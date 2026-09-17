alter table public.orders
  add column if not exists shipping_fee bigint not null default 0 check (shipping_fee >= 0),
  add column if not exists final_total bigint check (final_total is null or final_total >= 0),
  add column if not exists admin_note text not null default '';
