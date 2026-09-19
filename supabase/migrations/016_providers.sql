-- Migration 016: Providers
create table if not exists public.providers (
    id uuid primary key default gen_random_uuid(),
    name text unique not null,
    provider_type text not null,
    api_enabled boolean not null default false,
    mock_enabled boolean not null default true,
    contact_email text,
    contact_phone text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

insert into public.providers (name, provider_type, api_enabled, mock_enabled, contact_email)
values
    ('Sanlam', 'insurance_and_investments', false, true, 'mock@sanlam.example'),
    ('Old Mutual', 'insurance_and_investments', false, true, 'mock@oldmutual.example'),
    ('Liberty', 'insurance_and_investments', false, true, 'mock@liberty.example'),
    ('Momentum', 'insurance_and_investments', false, true, 'mock@momentum.example'),
    ('Discovery', 'insurance_and_investments', false, true, 'mock@discovery.example'),
    ('Allan Gray', 'investments', false, true, 'mock@allangray.example'),
    ('Santam', 'insurance', false, true, 'mock@santam.example')
on conflict (name) do update set mock_enabled = true;
