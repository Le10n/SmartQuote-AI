create extension if not exists "pgcrypto";

create type public.quote_status as enum ('draft', 'pending', 'accepted', 'rejected');

create table public.company_settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade unique,
  company_name text not null default 'SmartQuote AI',
  logo_path text,
  vat text,
  iban text,
  address text,
  email_signature text not null default 'Kind regards, SmartQuote AI',
  default_tax numeric(8,2) not null default 20,
  brand_primary text not null default '#0f766e',
  brand_secondary text not null default '#2563eb',
  pdf_terms text not null default 'Payment is due within 14 days unless otherwise agreed. This quote is valid for 30 days.',
  ai_enabled boolean not null default true,
  ai_tone text not null default 'professional',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  contact_person text not null,
  email text not null,
  phone text,
  address text,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  sku text not null,
  name text not null,
  description text,
  category text,
  purchase_price numeric(12,2) not null default 0,
  selling_price numeric(12,2) not null default 0,
  tax numeric(8,2) not null default 20,
  stock numeric(12,2) not null default 0,
  unit text not null default 'pcs',
  image_path text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, sku)
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  quote_number text not null,
  client_id uuid not null references public.clients(id) on delete restrict,
  status public.quote_status not null default 'draft',
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, quote_number)
);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(12,2) not null check (quantity > 0),
  price numeric(12,2) not null check (price >= 0),
  discount numeric(8,2) not null default 0 check (discount >= 0 and discount <= 100),
  tax numeric(8,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create index clients_owner_search_idx on public.clients using gin (to_tsvector('simple', coalesce(company,'') || ' ' || coalesce(contact_person,'') || ' ' || coalesce(email,'') || ' ' || coalesce(notes,'')));
create index products_owner_search_idx on public.products using gin (to_tsvector('simple', coalesce(sku,'') || ' ' || coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || coalesce(category,'')));
create index quotes_owner_status_idx on public.quotes(owner_id, status, created_at desc);
create index quote_items_quote_idx on public.quote_items(quote_id);
create index activity_owner_created_idx on public.activity_events(owner_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger company_settings_set_updated_at before update on public.company_settings for each row execute function public.set_updated_at();
create trigger clients_set_updated_at before update on public.clients for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger quotes_set_updated_at before update on public.quotes for each row execute function public.set_updated_at();

create or replace function public.generate_quote_number()
returns trigger language plpgsql as $$
declare
  next_number integer;
begin
  if new.quote_number is null or length(trim(new.quote_number)) = 0 then
    select count(*) + 1 into next_number
    from public.quotes
    where owner_id = new.owner_id
      and date_part('year', created_at) = date_part('year', now());

    new.quote_number := 'SQ-' || to_char(now(), 'YYYY') || '-' || lpad(next_number::text, 5, '0');
  end if;
  return new;
end;
$$;

create trigger quotes_generate_quote_number before insert on public.quotes for each row execute function public.generate_quote_number();

create or replace function public.ensure_company_settings()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.company_settings(owner_id, company_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'company_name', 'SmartQuote AI'))
  on conflict (owner_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.ensure_company_settings();

create or replace function public.log_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  actor uuid;
  label text;
begin
  actor := coalesce(new.owner_id, old.owner_id);
  label := tg_table_name;
  insert into public.activity_events(owner_id, entity_type, entity_id, action, description)
  values (
    actor,
    tg_table_name,
    coalesce(new.id, old.id),
    lower(tg_op),
    initcap(tg_table_name) || ' ' || lower(tg_op)
  );
  return coalesce(new, old);
end;
$$;

create trigger clients_log_activity after insert or update or delete on public.clients for each row execute function public.log_activity();
create trigger products_log_activity after insert or update or delete on public.products for each row execute function public.log_activity();
create trigger quotes_log_activity after insert or update or delete on public.quotes for each row execute function public.log_activity();

alter table public.company_settings enable row level security;
alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.activity_events enable row level security;

create policy "company settings are isolated" on public.company_settings for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "clients are isolated" on public.clients for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "products are isolated" on public.products for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "quotes are isolated" on public.quotes for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "quote items follow quote owner" on public.quote_items for all using (
  exists (select 1 from public.quotes q where q.id = quote_id and q.owner_id = auth.uid())
) with check (
  exists (select 1 from public.quotes q where q.id = quote_id and q.owner_id = auth.uid())
);
create policy "activity is isolated" on public.activity_events for select using (owner_id = auth.uid());

insert into storage.buckets (id, name, public) values ('company-assets', 'company-assets', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('client-files', 'client-files', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('quote-attachments', 'quote-attachments', false) on conflict (id) do nothing;

create policy "users read own company assets" on storage.objects for select using (bucket_id = 'company-assets' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users write own company assets" on storage.objects for insert with check (bucket_id = 'company-assets' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users update own company assets" on storage.objects for update using (bucket_id = 'company-assets' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users read own client files" on storage.objects for select using (bucket_id = 'client-files' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users write own client files" on storage.objects for insert with check (bucket_id = 'client-files' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users read own product images" on storage.objects for select using (bucket_id = 'product-images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users write own product images" on storage.objects for insert with check (bucket_id = 'product-images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users read own quote attachments" on storage.objects for select using (bucket_id = 'quote-attachments' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users write own quote attachments" on storage.objects for insert with check (bucket_id = 'quote-attachments' and auth.uid()::text = (storage.foldername(name))[1]);
