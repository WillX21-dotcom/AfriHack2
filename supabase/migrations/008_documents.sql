-- Migration 008: Documents
do $$ begin
    create type public.document_type as enum (
        'id_document', 'proof_of_address', 'policy_document', 'investment_statement',
        'driver_license', 'vehicle_registration', 'insurance_certificate', 'claim_document',
        'financial_statement', 'beneficiary_document', 'compliance_document', 'other'
    );
exception when duplicate_object then null;
end $$;

create table if not exists public.documents (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    uploaded_by uuid references public.profiles(id) on delete set null,
    document_type public.document_type not null,
    name text not null,
    storage_path text not null,
    mime_type text,
    file_size bigint check (file_size is null or file_size >= 0),
    is_verified boolean not null default false,
    verified_by uuid references public.profiles(id) on delete set null,
    verified_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_documents_client on public.documents(client_id);
create index if not exists idx_documents_type on public.documents(document_type);
