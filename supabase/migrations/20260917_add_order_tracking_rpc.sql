create or replace function public.create_storefront_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_note text,
  p_items jsonb,
  p_subtotal_known bigint,
  p_has_contact_price boolean
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  if btrim(coalesce(p_customer_name, '')) = '' then
    raise exception 'customer_name_required';
  end if;
  if btrim(coalesce(p_customer_phone, '')) = '' then
    raise exception 'customer_phone_required';
  end if;
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'order_items_required';
  end if;

  insert into public.orders (
    customer_name,
    customer_phone,
    customer_note,
    items,
    subtotal_known,
    has_contact_price,
    status,
    source
  ) values (
    btrim(p_customer_name),
    btrim(p_customer_phone),
    coalesce(p_customer_note, ''),
    p_items,
    greatest(coalesce(p_subtotal_known, 0), 0),
    coalesce(p_has_contact_price, false),
    'new',
    'zalo'
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_storefront_order(text,text,text,jsonb,bigint,boolean) from public;
grant execute on function public.create_storefront_order(text,text,text,jsonb,bigint,boolean) to anon, authenticated;

create or replace function public.track_order(
  p_order_id bigint,
  p_phone text
)
returns table (
  id bigint,
  status text,
  customer_name text,
  customer_note text,
  items jsonb,
  subtotal_known bigint,
  shipping_fee bigint,
  final_total bigint,
  has_contact_price boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.id,
    o.status,
    o.customer_name,
    o.customer_note,
    o.items,
    o.subtotal_known,
    o.shipping_fee,
    o.final_total,
    o.has_contact_price,
    o.created_at,
    o.updated_at
  from public.orders o
  where o.id = p_order_id
    and regexp_replace(o.customer_phone, '\D', '', 'g') = regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
  limit 1;
$$;

revoke all on function public.track_order(bigint,text) from public;
grant execute on function public.track_order(bigint,text) to anon, authenticated;

create or replace function public.track_orders(
  p_phone text,
  p_customer_name text
)
returns table (
  id bigint,
  status text,
  customer_name text,
  customer_note text,
  items jsonb,
  subtotal_known bigint,
  shipping_fee bigint,
  final_total bigint,
  has_contact_price boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.id,
    o.status,
    o.customer_name,
    o.customer_note,
    o.items,
    o.subtotal_known,
    o.shipping_fee,
    o.final_total,
    o.has_contact_price,
    o.created_at,
    o.updated_at
  from public.orders o
  where regexp_replace(o.customer_phone, '\D', '', 'g') = regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
    and lower(btrim(o.customer_name)) = lower(btrim(coalesce(p_customer_name, '')))
  order by o.created_at desc
  limit 5;
$$;

revoke all on function public.track_orders(text,text) from public;
grant execute on function public.track_orders(text,text) to anon, authenticated;
