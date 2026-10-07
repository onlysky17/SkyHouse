-- Isolated integration fixtures only. NEVER execute against a project database.
create schema if not exists storage;
create table if not exists storage.buckets(id text primary key,name text,public boolean);
create table if not exists storage.objects(id bigint,bucket_id text);
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
-- Match auth.uid()/auth.role() claim helpers for real PostgreSQL role/RLS tests.
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;
create function auth.role() returns text language sql stable as $$
  select nullif(current_setting('request.jwt.claim.role',true),'');
$$;
grant usage on schema auth to anon,authenticated;
