-- Migration 001: Profiles and Enums
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

do $$ begin
    create type public.user_role as enum ('client', 'adviser', 'admin', 'compliance');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text,
    first_name text,
    last_name text,
    phone text,
    avatar_url text,
    role public.user_role not null default 'client',
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);
