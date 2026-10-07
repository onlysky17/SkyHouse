-- INVENTORY-001. Existing products remain unmanaged (NULL); never invent stock.
begin;

alter table public.products
  add column stock_quantity numeric(14,3) check (stock_quantity >= 0 and stock_quantity <> 'NaN'::numeric),
  add column low_stock_threshold numeric(14,3) not null default 5 check (low_stock_threshold >= 0 and low_stock_threshold <> 'NaN'::numeric);
alter table public.orders add column inventory_state text not null default 'unprocessed'
  check (inventory_state in ('unprocessed','deducted','restored','legacy'));
-- Never subtract/restore historical fulfilment or guess a product from its name.
update public.orders set inventory_state = 'legacy'
where status <> 'new' or case when jsonb_typeof(items) <> 'array' then true
else jsonb_array_length(items)=0 or exists (
  select 1 from jsonb_array_elements(items) i
  where coalesce(i->>'product_id','') !~ '^[1-9][0-9]*$'
) end;

create table public.inventory_movements (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products(id) on delete restrict,
  order_id bigint references public.orders(id) on delete restrict,
  movement_type text not null check (movement_type in ('initial','admin_adjust','order_confirm','order_cancel_restore')),
  qty_delta numeric(14,3) not null,
  quantity_before numeric(14,3),
  quantity_after numeric(14,3) not null check (quantity_after >= 0),
  reason text not null check (btrim(reason) <> ''),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  request_id uuid unique,
  check (quantity_before is null or quantity_before >= 0),
  check (quantity_after = coalesce(quantity_before,0) + qty_delta),
  check ((movement_type in ('order_confirm','order_cancel_restore')) = (order_id is not null)),
  check (movement_type <> 'order_confirm' or qty_delta < 0),
  check (movement_type <> 'order_cancel_restore' or qty_delta > 0)
);
create unique index inventory_order_product_once on public.inventory_movements(order_id,product_id,movement_type)
where order_id is not null;
create index inventory_product_history on public.inventory_movements(product_id,created_at desc,id desc);
alter table public.inventory_movements enable row level security;
create policy "authenticated read inventory movements" on public.inventory_movements
for select to authenticated using (true);
revoke all on public.inventory_movements from public,anon,authenticated;
grant select on public.inventory_movements to authenticated;

-- Stock is writable only by the security-definer accounting functions.
-- Existing catalog metadata CRUD is retained, including threshold editing.
revoke insert,update on public.products from public,anon,authenticated;
do $$ declare cols text; begin
  select string_agg(quote_ident(column_name),',') into cols
  from information_schema.columns where table_schema='public' and table_name='products'
    and column_name <> 'stock_quantity';
  execute 'grant insert (' || cols || '), update (' || cols || ') on public.products to authenticated';
end $$;

create function public.inventory_preserve_unit()
returns trigger language plpgsql set search_path=public as $$
begin
  if OLD.stock_quantity is not null and NEW.unit is distinct from OLD.unit then
    raise exception 'Sản phẩm đã quản lý tồn phải giữ nguyên đơn vị; không tự đổi số tồn sang đơn vị khác.';
  end if;
  return NEW;
end $$;
revoke all on function public.inventory_preserve_unit() from public,anon,authenticated;
create trigger inventory_preserve_unit before update of unit on public.products
for each row execute function public.inventory_preserve_unit();

create function public.inventory_validate_snapshot(p_items jsonb)
returns void language plpgsql set search_path=public as $$
declare item jsonb;
begin
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)=0 then
    raise exception 'Đơn hàng chưa có sản phẩm.';
  end if;
  for item in select value from jsonb_array_elements(p_items) loop
    if coalesce(item->>'product_id','') !~ '^[1-9][0-9]*$'
      or coalesce(item->>'qty','') !~ '^[0-9]+(\.[0-9]{1,3})?$'
      or (item->>'qty')::numeric <= 0 then
      raise exception 'Sản phẩm hoặc số lượng trong đơn không hợp lệ; không đoán sản phẩm từ tên.';
    end if;
  end loop;
end $$;
revoke all on function public.inventory_validate_snapshot(jsonb) from public,anon,authenticated;

create function public.inventory_validate_items(p_items jsonb,p_checkout boolean)
returns void language plpgsql security definer set search_path=public as $$
declare line record; product public.products%rowtype;
begin
  perform public.inventory_validate_snapshot(p_items);
  -- Every transaction takes product locks in ID order, including merged checkout.
  for line in select (i->>'product_id')::bigint id,sum((i->>'qty')::numeric) qty
    from jsonb_array_elements(p_items) i group by 1 order by 1 loop
    select * into product from public.products where id=line.id for update;
    if not found then raise exception 'Sản phẩm #% không còn tồn tại.',line.id; end if;
    if p_checkout and (not coalesce(product.visible,false) or not coalesce(product.in_stock,false)) then
      raise exception 'Tạm hết hàng: %.',product.name;
    end if;
    if product.stock_quantity is not null and line.qty > product.stock_quantity then
      raise exception 'Không đủ tồn: % cần %, hiện còn %.',product.name,line.qty,product.stock_quantity;
    end if;
  end loop;
end $$;
revoke all on function public.inventory_validate_items(jsonb,boolean) from public,anon,authenticated;

create function public.inventory_account_order()
returns trigger language plpgsql security definer set search_path=public as $$
declare line record; product public.products%rowtype; before_qty numeric;
begin
  if TG_OP='INSERT' then
    if NEW.status <> 'new' or NEW.inventory_state <> 'unprocessed' then
      raise exception 'Đơn mới phải ở trạng thái chờ xác nhận.';
    end if;
    perform public.inventory_validate_items(NEW.items,true);
    return NEW;
  end if;
  if NEW.inventory_state is distinct from OLD.inventory_state then
    raise exception 'Không được chỉnh dấu hạch toán tồn kho trực tiếp.';
  end if;
  if NEW.items is distinct from OLD.items and (OLD.status <> 'new' or OLD.inventory_state <> 'unprocessed') then
    raise exception 'Không được đổi món của đơn đã hạch toán hoặc đơn cũ thiếu mã sản phẩm.';
  end if;
  if OLD.inventory_state='legacy' then return NEW; end if;
  if NEW.status = OLD.status then
    if NEW.items is distinct from OLD.items then perform public.inventory_validate_items(NEW.items,true); end if;
    return NEW;
  end if;
  if (OLD.status='new' and NEW.status not in ('confirmed','cancelled'))
    or (OLD.status='confirmed' and NEW.status not in ('shipping','completed','cancelled'))
    or (OLD.status='shipping' and NEW.status not in ('completed','cancelled'))
    or OLD.status in ('completed','cancelled') then
    raise exception 'Chuyển trạng thái không hợp lệ; cần xác nhận trước và không mở lại đơn đã kết thúc.';
  end if;
  -- Snapshot cannot be replaced while confirming/cancelling.
  if NEW.items is distinct from OLD.items then raise exception 'Không được đổi món khi đổi trạng thái.'; end if;
  if OLD.status='new' and NEW.status='confirmed' then
    perform public.inventory_validate_items(OLD.items,false);
    for line in select (i->>'product_id')::bigint id,sum((i->>'qty')::numeric) qty
      from jsonb_array_elements(OLD.items) i group by 1 order by 1 loop
      select * into product from public.products where id=line.id for update;
      if product.stock_quantity is null then continue; end if;
      before_qty := product.stock_quantity;
      update public.products set stock_quantity=before_qty-line.qty,updated_at=now() where id=line.id;
      insert into public.inventory_movements(product_id,order_id,movement_type,qty_delta,quantity_before,quantity_after,reason,created_by)
      values(line.id,OLD.id,'order_confirm',-line.qty,before_qty,before_qty-line.qty,'Xác nhận đơn #'||OLD.id,auth.uid());
    end loop;
    NEW.inventory_state := 'deducted';
  elsif NEW.status='cancelled' and OLD.inventory_state='deducted' then
    -- Restore the actual recorded deduction, not an edited/current order snapshot.
    for line in select product_id,-qty_delta qty from public.inventory_movements
      where order_id=OLD.id and movement_type='order_confirm' order by product_id loop
      select * into product from public.products where id=line.product_id for update;
      before_qty := product.stock_quantity;
      update public.products set stock_quantity=before_qty+line.qty,updated_at=now() where id=line.product_id;
      insert into public.inventory_movements(product_id,order_id,movement_type,qty_delta,quantity_before,quantity_after,reason,created_by)
      values(line.product_id,OLD.id,'order_cancel_restore',line.qty,before_qty,before_qty+line.qty,'Hủy đơn #'||OLD.id,auth.uid());
    end loop;
    NEW.inventory_state := 'restored';
  end if;
  return NEW;
end $$;
revoke all on function public.inventory_account_order() from public,anon,authenticated;
create trigger inventory_account_order before insert or update on public.orders
for each row execute function public.inventory_account_order();

create function public.update_order_status_with_inventory(p_order_id bigint,p_status text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare result public.orders%rowtype;
begin
  if auth.role() is distinct from 'authenticated' or auth.uid() is null then raise exception 'Admin login required'; end if;
  if p_status not in ('new','confirmed','shipping','completed','cancelled') or p_status is null then
    raise exception 'Trạng thái không hợp lệ.';
  end if;
  update public.orders set status=p_status,updated_at=now() where id=p_order_id returning * into result;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;
  return jsonb_build_object('order_id',result.id,'status',result.status,'inventory_state',result.inventory_state);
end $$;
revoke all on function public.update_order_status_with_inventory(bigint,text) from public,anon;
grant execute on function public.update_order_status_with_inventory(bigint,text) to authenticated;

create function public.adjust_inventory(p_product_id bigint,p_quantity numeric,p_reason text,p_request_id uuid,p_expected_quantity numeric)
returns jsonb language plpgsql security definer set search_path=public as $$
declare product public.products%rowtype; movement public.inventory_movements%rowtype; kind text;
begin
  if auth.role() is distinct from 'authenticated' or auth.uid() is null then raise exception 'Admin login required'; end if;
  if p_quantity is null or p_quantity < 0 or p_quantity > 99999999999.999 or p_quantity <> round(p_quantity,3)
    or p_quantity::text in ('NaN','Infinity','-Infinity') then raise exception 'Tồn kho phải không âm, tối đa 3 chữ số thập phân.'; end if;
  if btrim(coalesce(p_reason,''))='' or p_request_id is null then raise exception 'Cần lý do điều chỉnh và mã thao tác.'; end if;
  perform pg_advisory_xact_lock(hashtextextended('inventory-adjust:'||p_request_id::text,0));
  select * into movement from public.inventory_movements where request_id=p_request_id;
  if found then
    if movement.product_id<>p_product_id or movement.quantity_after<>p_quantity or movement.reason<>btrim(p_reason)
      or movement.created_by is distinct from auth.uid() then raise exception 'Mã thao tác đã được dùng cho điều chỉnh khác.'; end if;
    return to_jsonb(movement);
  end if;
  select * into product from public.products where id=p_product_id for update;
  if not found then raise exception 'Không tìm thấy sản phẩm.'; end if;
  if btrim(coalesce(product.unit,''))='' then raise exception 'Nhập đơn vị sản phẩm trước khi quản lý tồn.'; end if;
  if product.stock_quantity is distinct from p_expected_quantity then
    raise exception 'Tồn kho đã thay đổi. Tải lại sản phẩm trước khi điều chỉnh.';
  end if;
  kind := case when product.stock_quantity is null then 'initial' else 'admin_adjust' end;
  update public.products set stock_quantity=p_quantity,updated_at=now() where id=p_product_id;
  insert into public.inventory_movements(product_id,movement_type,qty_delta,quantity_before,quantity_after,reason,created_by,request_id)
  values(p_product_id,kind,p_quantity-coalesce(product.stock_quantity,0),product.stock_quantity,p_quantity,btrim(p_reason),auth.uid(),p_request_id)
  returning * into movement;
  return to_jsonb(movement);
end $$;
revoke all on function public.adjust_inventory(bigint,numeric,text,uuid,numeric) from public,anon;
grant execute on function public.adjust_inventory(bigint,numeric,text,uuid,numeric) to authenticated;

do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(
    select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='products'
  ) then alter publication supabase_realtime add table public.products; end if;
end $$;
-- Secure pending-order RPC replacement is appended below, inside this transaction.

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
  v_qty numeric;
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

  -- Validate raw append input without product locks; order row is locked first.
  perform public.inventory_validate_snapshot(p_items);

  -- Serialize concurrent submissions for the same phone. Different browser secrets
  -- still cannot race into duplicate rows for the same authenticated merge context.
  perform pg_advisory_xact_lock(hashtextextended('skyhouse-order:' || v_phone_digits, 0));

  if v_merge_key_hash is not null then
    select o.id, o.items
    into v_id, v_existing_items
    from public.orders o
    where o.status = 'new' and o.inventory_state = 'unprocessed'
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
    v_key := 'product:' || (v_item->>'product_id');

    if not (v_key = any(v_item_keys)) then
      v_item_keys := array_append(v_item_keys, v_key);
    end if;

    if v_item_map ? v_key then
      v_prior := v_item_map -> v_key;
      v_qty := greatest(coalesce((v_prior->>'qty')::numeric, 0), 0)
        + greatest(coalesce((v_item->>'qty')::numeric, 0), 0);
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
    v_key := 'product:' || (v_item->>'product_id');

    if not (v_key = any(v_item_keys)) then
      v_item_keys := array_append(v_item_keys, v_key);
    end if;

    if v_item_map ? v_key then
      v_prior := v_item_map -> v_key;
      v_qty := greatest(coalesce((v_prior->>'qty')::numeric, 0), 0)
        + greatest(coalesce((v_item->>'qty')::numeric, 0), 0);
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
        when coalesce(item->>'price', '') ~ '^[0-9]+$'
         and coalesce(item->>'qty', '') ~ '^[0-9]+(\.[0-9]{1,3})?$'
        then (item->>'price')::bigint * (item->>'qty')::numeric
        else 0
      end
    ), 0),
    coalesce(bool_or(
      item->'price' is null
      or jsonb_typeof(item->'price') = 'null'
      or coalesce(item->>'price', '') !~ '^[0-9]+$'
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

commit;
