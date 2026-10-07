-- Local acceptance fixtures, before the inventory migration; no real identities.
insert into auth.users(id) values ('00000000-0000-0000-0000-000000000001');
insert into public.products(id,name) values (70000,'Legacy fixture');
insert into public.orders(id,customer_name,customer_phone,items,status) values
  (70000,'Local fixture','local-test','[{"name":"No ID","qty":3}]','new'),
  (70001,'Local fixture','local-test','[{"product_id":70000,"qty":3}]','confirmed'),
  (70010,'Local fixture','local-test','{}','new'),
  (70011,'Local fixture','local-test','[]','new');
grant usage on schema public to anon,authenticated;
grant all on all tables in schema public to anon,authenticated;
grant usage on all sequences in schema public to anon,authenticated;
