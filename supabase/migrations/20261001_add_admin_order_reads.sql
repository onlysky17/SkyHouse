-- Persist admin order read state per authenticated user so unread status follows the admin across devices.

create table if not exists public.admin_order_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id bigint not null references public.orders(id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (user_id, order_id)
);

create index if not exists admin_order_reads_order_id_idx
  on public.admin_order_reads (order_id);

alter table public.admin_order_reads enable row level security;

drop policy if exists "admin read own order reads" on public.admin_order_reads;
create policy "admin read own order reads"
on public.admin_order_reads for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "admin insert own order reads" on public.admin_order_reads;
create policy "admin insert own order reads"
on public.admin_order_reads for insert
to authenticated
with check (auth.uid() = user_id);

grant select, insert on public.admin_order_reads to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'admin_order_reads'
     ) then
    alter publication supabase_realtime add table public.admin_order_reads;
  end if;
end
$$;
