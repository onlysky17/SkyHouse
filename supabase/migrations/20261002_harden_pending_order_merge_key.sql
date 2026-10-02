-- Harden pending-order merge so only the same browser/device secret can append to an open order.
-- Legacy orders without a merge key are intentionally not adopted.

alter table public.orders
  add column if not exists customer_merge_key_hash text;

comment on column public.orders.customer_merge_key_hash is
  'SHA-256 of a random storefront browser token used only to authorize merging into a still-new order.';

-- Remove the phone-only overload. Old cached clients will fall back to create_storefront_order.
drop function if exists public.submit_storefront_order(text,text,text,jsonb,bigint,boolean);

create or replace function public.submit_storefront_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_note text,
  p_items jsonb,
  p_subtotal_known bigint,
  p_has_contact_price boolean,
  p_merge_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id bigint;
  v_phone_digits text;
  v_merge_key_hash text;
  v_existing_items jsonb := '[]'::jsonb;
  v_item_map jsonb := '{}'::jsonb;
  v_item_keys text[] := array[]::text[];
  v_item jsonb;
  v_prior jsonb;
  v_key text;
  v_qty integer;
  v_merged_items jsonb := '[]'::jsonb;
  v_subtotal bigint := 0;
  v_has_contact boolean := false;
begin
  if btrim(coalesce(p_customer_name, '')) = '' then
    raise exception 'customer_name_required';
  end if;

  v_phone_digits := regexp_replace(coalesce(p_customer_phone, ''), '\D', '', 'g');
  if v_phone_digits = '' then
    raise exception 'customer_phone_required';
  end if;

  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'order_items_required';
  end if;

  if length(btrim(coalesce(p_merge_token, ''))) between 32 and 256 then
    v_merge_key_hash := encode(extensions.digest(btrim(p_merge_token), 'sha256'), 'hex');
  else
    v_merge_key_hash := null;
  end if;

  -- Serialize concurrent submissions for the same phone. Different browser secrets
  -- still cannot race into duplicate rows for the same authenticated merge context.
  perform pg_advisory_xact_lock(hashtextextended('skyhouse-order:' || v_phone_digits, 0));

  if v_merge_key_hash is not null then
    select o.id, o.items
    into v_id, v_existing_items
    from public.orders o
    where o.status = 'new'
      and regexp_replace(o.customer_phone, '\D', '', 'g') = v_phone_digits
      and o.customer_merge_key_hash = v_merge_key_hash
    order by o.created_at desc, o.id desc
    limit 1
    for update;
  end if;

  if v_id is null then
    insert into public.orders (
      customer_name,
      customer_phone,
      customer_note,
      items,
      subtotal_known,
      has_contact_price,
      status,
      source,
      customer_merge_key_hash
    ) values (
      btrim(p_customer_name),
      btrim(p_customer_phone),
      coalesce(p_customer_note, ''),
      p_items,
      greatest(coalesce(p_subtotal_known, 0), 0),
      coalesce(p_has_contact_price, false),
      'new',
      'storefront',
      v_merge_key_hash
    )
    returning id into v_id;

    return jsonb_build_object('order_id', v_id, 'merged', false);
  end if;

  for v_item in
    select value from jsonb_array_elements(coalesce(v_existing_items, '[]'::jsonb))
  loop
    v_key := lower(btrim(coalesce(v_item->>'name', '')))
      || '|'
      || lower(btrim(coalesce(v_item->>'unit', '')));

    if not (v_key = any(v_item_keys)) then
      v_item_keys := array_append(v_item_keys, v_key);
    end if;

    if v_item_map ? v_key then
      v_prior := v_item_map -> v_key;
      v_qty := greatest(coalesce((v_prior->>'qty')::integer, 0), 0)
        + greatest(coalesce((v_item->>'qty')::integer, 0), 0);
      v_item_map := jsonb_set(
        v_item_map,
        array[v_key],
        v_prior || v_item || jsonb_build_object('qty', v_qty),
        true
      );
    else
      v_item_map := jsonb_set(v_item_map, array[v_key], v_item, true);
    end if;
  end loop;

  for v_item in
    select value from jsonb_array_elements(p_items)
  loop
    v_key := lower(btrim(coalesce(v_item->>'name', '')))
      || '|'
      || lower(btrim(coalesce(v_item->>'unit', '')));

    if not (v_key = any(v_item_keys)) then
      v_item_keys := array_append(v_item_keys, v_key);
    end if;

    if v_item_map ? v_key then
      v_prior := v_item_map -> v_key;
      v_qty := greatest(coalesce((v_prior->>'qty')::integer, 0), 0)
        + greatest(coalesce((v_item->>'qty')::integer, 0), 0);
      v_item_map := jsonb_set(
        v_item_map,
        array[v_key],
        v_prior || v_item || jsonb_build_object('qty', v_qty),
        true
      );
    else
      v_item_map := jsonb_set(v_item_map, array[v_key], v_item, true);
    end if;
  end loop;

  select coalesce(jsonb_agg(v_item_map -> ordered.item_key order by ordered.ordinality), '[]'::jsonb)
  into v_merged_items
  from unnest(v_item_keys) with ordinality as ordered(item_key, ordinality);

  select
    coalesce(sum(
      case
        when coalesce(item->>'price', '') ~ '^\d+$'
         and coalesce(item->>'qty', '') ~ '^\d+$'
        then (item->>'price')::bigint * (item->>'qty')::bigint
        else 0
      end
    ), 0),
    coalesce(bool_or(
      item->'price' is null
      or jsonb_typeof(item->'price') = 'null'
      or coalesce(item->>'price', '') !~ '^\d+$'
    ), false)
  into v_subtotal, v_has_contact
  from jsonb_array_elements(v_merged_items) as merged(item);

  update public.orders
  set
    customer_name = btrim(p_customer_name),
    customer_phone = btrim(p_customer_phone),
    customer_note = coalesce(p_customer_note, ''),
    items = v_merged_items,
    subtotal_known = greatest(v_subtotal, 0),
    has_contact_price = v_has_contact,
    final_total = null,
    source = 'storefront',
    updated_at = now()
  where id = v_id;

  delete from public.admin_order_reads where order_id = v_id;

  return jsonb_build_object('order_id', v_id, 'merged', true);
end;
$$;

revoke all on function public.submit_storefront_order(text,text,text,jsonb,bigint,boolean,text) from public;
grant execute on function public.submit_storefront_order(text,text,text,jsonb,bigint,boolean,text) to anon, authenticated;
