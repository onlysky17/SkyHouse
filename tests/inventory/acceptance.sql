\set ON_ERROR_STOP on
begin;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
create function pg_temp.assert_true(ok boolean, message text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'ASSERT: %',message; end if; end $$;
select pg_temp.assert_true((select bool_and(inventory_state='legacy') from orders where id in (70000,70001,70010,70011)),'legacy backfill including invalid/empty historical snapshot');
select pg_temp.assert_true((select stock_quantity is null from products where id=70000),'legacy NULL stock');
update orders set status='confirmed' where id=70000;
update orders set status='cancelled' where id=70001;
select pg_temp.assert_true(not exists(select 1 from inventory_movements),'legacy does not guess/subtract/restore');
insert into products(id,name,price,unit) values
  (70002,'Managed fixture',100,'kg'),(70003,'Second fixture',100,'gói'),(70004,'Unmanaged fixture',100,'hũ');
select adjust_inventory(70002,10,'Initial local count','00000000-0000-0000-0000-000000000002',null);
select adjust_inventory(70002,10,'Initial local count','00000000-0000-0000-0000-000000000002',null);
select pg_temp.assert_true((select count(*)=1 from inventory_movements where product_id=70002),'adjust retry exactly once');
select pg_temp.assert_true((select quantity_before is null and movement_type='initial' from inventory_movements where product_id=70002),'initial unknown before recorded');
insert into orders(id,customer_name,customer_phone,items) values (70002,'Local fixture','local-test','[{"product_id":70002,"qty":3}]');
select pg_temp.assert_true((select stock_quantity=10 from products where id=70002),'new does not reserve');
select update_order_status_with_inventory(70002,'confirmed');
select update_order_status_with_inventory(70002,'confirmed');
select pg_temp.assert_true((select stock_quantity=7 from products where id=70002),'confirm retry exactly once');
select update_order_status_with_inventory(70002,'shipping');
select update_order_status_with_inventory(70002,'completed');
select pg_temp.assert_true((select stock_quantity=7 from products where id=70002),'shipping/completed no deduction');
select adjust_inventory(70002,10,'Case C local reset','00000000-0000-0000-0000-000000000011',7);
insert into orders(id,customer_name,customer_phone,items) values (70003,'Local fixture','local-test','[{"product_id":70002,"qty":3}]');
select update_order_status_with_inventory(70003,'confirmed');
select update_order_status_with_inventory(70003,'shipping');
select update_order_status_with_inventory(70003,'cancelled');
select update_order_status_with_inventory(70003,'cancelled');
select pg_temp.assert_true((select stock_quantity=10 from products where id=70002),'cancel restores actual deduction once');
select pg_temp.assert_true((select count(*)=2 from inventory_movements where order_id=70003),'one confirm + one restore');
insert into orders(id,customer_name,customer_phone,items) values (70007,'Local fixture','local-test','[{"product_id":70002,"qty":3}]');
select update_order_status_with_inventory(70007,'confirmed');
select pg_temp.assert_true((select stock_quantity=7 from products where id=70002),'confirmed cancellation base');
select update_order_status_with_inventory(70007,'cancelled');
select update_order_status_with_inventory(70007,'cancelled');
select pg_temp.assert_true((select stock_quantity=10 from products where id=70002),'direct confirmed cancel restores 10');
select adjust_inventory(70002,7,'Local suite reset','00000000-0000-0000-0000-000000000012',10);
insert into orders(id,customer_name,customer_phone,items) values (70004,'Local fixture','local-test','[{"product_id":70002,"qty":1}]');
select update_order_status_with_inventory(70004,'cancelled');
select pg_temp.assert_true(not exists(select 1 from inventory_movements where order_id=70004),'new cancel no restoration');
select adjust_inventory(70003,3,'Initial count','00000000-0000-0000-0000-000000000003',null);
insert into orders(id,customer_name,customer_phone,items) values (70005,'Local fixture','local-test','[{"product_id":70002,"qty":2},{"product_id":70003,"qty":3}]');
select adjust_inventory(70003,2,'Count changed before confirmation','00000000-0000-0000-0000-000000000004',3);
do $$ begin
  begin perform update_order_status_with_inventory(70005,'confirmed'); raise exception 'expected insufficient';
  exception when others then if SQLERRM not like 'Không đủ tồn:%' then raise; end if; end;
end $$;
select pg_temp.assert_true((select status='new' from orders where id=70005),'insufficient keeps new');
select pg_temp.assert_true((select stock_quantity=7 from products where id=70002),'no partial deduction');
select pg_temp.assert_true(not exists(select 1 from inventory_movements where order_id=70005),'no partial ledger');
-- Direct UPDATE status uses the same trigger: older clients cannot bypass accounting.
insert into orders(id,customer_name,customer_phone,items) values (70006,'Local fixture','local-test','[{"product_id":70002,"qty":1},{"product_id":70002,"qty":2},{"product_id":70004,"qty":1}]');
update orders set status='confirmed' where id=70006;
select pg_temp.assert_true((select stock_quantity=4 from products where id=70002),'duplicate IDs aggregate once');
select pg_temp.assert_true((select count(*)=1 from inventory_movements where order_id=70006),'unmanaged item stays untracked');
select pg_temp.assert_true((select stock_quantity<=low_stock_threshold from products where id=70002),'low threshold');
do $$ begin
  begin update products set unit='gói' where id=70002; raise exception 'expected unit guard';
  exception when others then if SQLERRM not like 'Sản phẩm đã quản lý tồn%' then raise; end if; end;
  begin update orders set items='[]' where id=70006; raise exception 'expected frozen snapshot';
  exception when others then if SQLERRM not like 'Không được đổi món%' then raise; end if; end;
  begin perform update_order_status_with_inventory(70003,'confirmed'); raise exception 'expected terminal guard';
  exception when others then if SQLERRM not like 'Chuyển trạng thái không hợp lệ%' then raise; end if; end;
  begin perform adjust_inventory(70002,8,'Stale count','00000000-0000-0000-0000-000000000005',7); raise exception 'expected stale';
  exception when others then if SQLERRM not like 'Tồn kho đã thay đổi%' then raise; end if; end;
end $$;
-- Real secure RPC, same browser token + same phone, pending append before confirmation.
do $$ declare first_id bigint; merged jsonb; begin
  first_id := (submit_storefront_order('Local fixture','0000000001','', '[{"product_id":70002,"name":"Same name","unit":"kg","price":100,"qty":1}]',100,false,repeat('a',48))->>'order_id')::bigint;
  merged := submit_storefront_order('Local fixture','0000000001','', '[{"product_id":70002,"name":"Same name","unit":"kg","price":100,"qty":2},{"product_id":70004,"name":"Same name","unit":"kg","price":100,"qty":1}]',300,false,repeat('a',48));
  perform pg_temp.assert_true((merged->>'order_id')::bigint=first_id and (merged->>'merged')::boolean,'pending same-browser append');
  begin
    perform submit_storefront_order('Local fixture','0000000001','', '[{"product_id":70002,"qty":2}]',200,false,repeat('a',48));
    raise exception 'expected combined overstock';
  exception when others then if SQLERRM not like 'Không đủ tồn:%' then raise; end if; end;
  perform pg_temp.assert_true((select (items->0->>'qty')::numeric=3 from orders where id=first_id),'rejected append preserves snapshot');
  begin
    perform submit_storefront_order('Local fixture','0000000001','', '[{"product_id":70002,"qty":-1}]',100,false,repeat('a',48));
    raise exception 'expected invalid quantity';
  exception when others then if SQLERRM not like 'Sản phẩm hoặc số lượng%' then raise; end if; end;
  perform pg_temp.assert_true((select jsonb_array_length(items)=2 from orders where id=first_id),'different IDs same name remain distinct');
  perform pg_temp.assert_true((select stock_quantity=4 from products where id=70002),'append never subtracts');
  perform update_order_status_with_inventory(first_id,'confirmed');
  perform pg_temp.assert_true((select stock_quantity=1 from products where id=70002),'confirm final merged snapshot');
  merged := submit_storefront_order('Local fixture','0000000001','', '[{"product_id":70002,"qty":1}]',100,false,repeat('a',48));
  perform pg_temp.assert_true((merged->>'order_id')::bigint<>first_id,'confirmed order not reused');
end $$;
-- Sold out/overstock checkout rejected before any order commit.
select adjust_inventory(70002,0,'Sold-out test','00000000-0000-0000-0000-000000000006',1);
do $$ begin
  begin perform submit_storefront_order('Local fixture','0000000002','', '[{"product_id":70002,"qty":1}]',100,false,repeat('b',48)); raise exception 'expected stock failure';
  exception when others then if SQLERRM not like 'Không đủ tồn:%' then raise; end if; end;
end $$;
select pg_temp.assert_true(not exists(select 1 from orders where customer_phone='0000000002'),'sold out creates no order');
-- Authenticated role cannot mutate stock or history directly; metadata CRUD remains.
set local role authenticated;
update products set description='Local metadata edit' where id=70002;
select adjust_inventory(70002,0,'Authenticated RPC permission','00000000-0000-0000-0000-000000000009',0);
do $$ begin
  begin update products set stock_quantity=99 where id=70002; raise exception 'expected privilege denial';
  exception when insufficient_privilege then null; end;
  begin insert into products(name,stock_quantity) values('Unauthorized stock fixture',99); raise exception 'expected privilege denial';
  exception when insufficient_privilege then null; end;
  begin delete from inventory_movements; raise exception 'expected privilege denial';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
set local request.jwt.claim.role='anon';
do $$ begin
  begin perform adjust_inventory(70002,99,'Anon','00000000-0000-0000-0000-000000000007',0); raise exception 'expected privilege denial';
  exception when insufficient_privilege then null; end;
  begin perform update_order_status_with_inventory(70002,'cancelled'); raise exception 'expected privilege denial';
  exception when insufficient_privilege then null; end;
  begin select count(*) from inventory_movements; raise exception 'expected privilege denial';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: local transaction acceptance A-F,H + legacy/security/idempotency/snapshot/rollback' as result;
rollback;
