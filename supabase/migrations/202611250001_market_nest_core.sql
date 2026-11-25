-- Market Nest core multi-tenant store foundation.
-- All merchant-owned data is scoped by store_id and protected by RLS.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  currency text not null default 'NGN',
  timezone text not null default 'Africa/Lagos',
  status text not null default 'draft' check (status in ('draft','published','suspended')),
  theme_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stores_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table if not exists public.store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner','admin','editor','staff')),
  created_at timestamptz not null default now(),
  unique (store_id, user_id)
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug),
  unique (id, store_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  collection_id uuid,
  title text not null,
  slug text not null,
  description text,
  price numeric(12,2) not null default 0 check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= 0),
  sku text,
  inventory_quantity integer not null default 0 check (inventory_quantity >= 0),
  status text not null default 'draft' check (status in ('draft','active','archived')),
  images jsonb not null default '[]'::jsonb,
  options jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug),
  constraint products_collection_store_fk foreign key (collection_id, store_id)
    references public.collections(id, store_id) on delete set null (collection_id)
);

create table if not exists public.store_pages (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null,
  slug text not null,
  page_type text not null default 'custom' check (page_type in ('home','about','contact','custom')),
  content jsonb not null default '{"sections":[]}'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create index if not exists stores_owner_id_idx on public.stores(owner_id);
create index if not exists store_members_user_store_idx on public.store_members(user_id, store_id);
create index if not exists collections_store_sort_idx on public.collections(store_id, sort_order);
create index if not exists products_store_status_created_idx on public.products(store_id, status, created_at desc);
create index if not exists products_collection_id_idx on public.products(collection_id);
create index if not exists store_pages_store_type_idx on public.store_pages(store_id, page_type);

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.store_pages enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "stores_select_members" on public.stores for select to authenticated
using (owner_id = (select auth.uid()) or exists (
  select 1 from public.store_members sm where sm.store_id = stores.id and sm.user_id = (select auth.uid())
));
create policy "stores_insert_owner" on public.stores for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "stores_update_owner" on public.stores for update to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "stores_delete_owner" on public.stores for delete to authenticated using (owner_id = (select auth.uid()));

create policy "members_select_self_or_owner" on public.store_members for select to authenticated
using (user_id = (select auth.uid()) or exists (
  select 1 from public.stores s where s.id = store_members.store_id and s.owner_id = (select auth.uid())
));
create policy "members_insert_owner" on public.store_members for insert to authenticated
with check (exists (select 1 from public.stores s where s.id = store_members.store_id and s.owner_id = (select auth.uid())));
create policy "members_update_owner" on public.store_members for update to authenticated
using (exists (select 1 from public.stores s where s.id = store_members.store_id and s.owner_id = (select auth.uid())))
with check (exists (select 1 from public.stores s where s.id = store_members.store_id and s.owner_id = (select auth.uid())));
create policy "members_delete_owner" on public.store_members for delete to authenticated
using (exists (select 1 from public.stores s where s.id = store_members.store_id and s.owner_id = (select auth.uid())));

create policy "collections_select_store_members" on public.collections for select to authenticated
using (exists (select 1 from public.stores s where s.id = collections.store_id and (s.owner_id = (select auth.uid()) or exists (
  select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid())
))));
create policy "collections_insert_store_members" on public.collections for insert to authenticated
with check (exists (select 1 from public.stores s where s.id = collections.store_id and (s.owner_id = (select auth.uid()) or exists (
  select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid()) and sm.role in ('admin','editor')
))));
create policy "collections_update_store_members" on public.collections for update to authenticated
using (exists (select 1 from public.stores s where s.id = collections.store_id and (s.owner_id = (select auth.uid()) or exists (
  select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid()) and sm.role in ('admin','editor')
))))
with check (exists (select 1 from public.stores s where s.id = collections.store_id and (s.owner_id = (select auth.uid()) or exists (
  select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid()) and sm.role in ('admin','editor')
))));
create policy "collections_delete_store_members" on public.collections for delete to authenticated
using (exists (select 1 from public.stores s where s.id = collections.store_id and (s.owner_id = (select auth.uid()) or exists (
  select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid()) and sm.role in ('admin','editor')
))));

create policy "products_select_store_members" on public.products for select to authenticated
using (exists (select 1 from public.stores s where s.id = products.store_id and (s.owner_id = (select auth.uid()) or exists (
  select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid())
))));
create policy "products_insert_store_members" on public.products for insert to authenticated
with check (exists (select 1 from public.stores s where s.id = products.store_id and (s.owner_id = (select auth.uid()) or exists (
  select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid()) and sm.role in ('admin','editor')
))));
create policy "products_update_store_members" on public.products for update to authenticated
using (exists (select 1 from public.stores s where s.id = products.store_id and (s.owner_id = (select auth.uid()) or exists (
  select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid()) and sm.role in ('admin','editor')
))))
with check (exists (select 1 from public.stores s where s.id = products.store_id and (s.owner_id = (select auth.uid()) or exists (
  select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid()) and sm.role in ('admin','editor')
))));
create policy "products_delete_store_members" on public.products for delete to authenticated
using (exists (select 1 from public.stores s where s.id = products.store_id and (s.owner_id = (select auth.uid()) or exists (
  select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid()) and sm.role in ('admin','editor')
))));

create policy "pages_select_store_members" on public.store_pages for select to authenticated
using (exists (select 1 from public.stores s where s.id = store_pages.store_id and (s.owner_id = (select auth.uid()) or exists (
  select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid())
))));
create policy "pages_insert_store_editors" on public.store_pages for insert to authenticated
with check (exists (select 1 from public.stores s where s.id = store_pages.store_id and (s.owner_id = (select auth.uid()) or exists (
  select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid()) and sm.role in ('admin','editor')
))));
create policy "pages_update_store_editors" on public.store_pages for update to authenticated
using (exists (select 1 from public.stores s where s.id = store_pages.store_id and (s.owner_id = (select auth.uid()) or exists (
  select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid()) and sm.role in ('admin','editor')
))))
with check (exists (select 1 from public.stores s where s.id = store_pages.store_id and (s.owner_id = (select auth.uid()) or exists (
  select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid()) and sm.role in ('admin','editor')
))));
create policy "pages_delete_store_editors" on public.store_pages for delete to authenticated
using (exists (select 1 from public.stores s where s.id = store_pages.store_id and (s.owner_id = (select auth.uid()) or exists (
  select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid()) and sm.role in ('admin','editor')
))));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-media', 'store-media', false, 102400, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = false, file_size_limit = 102400, allowed_mime_types = excluded.allowed_mime_types;

create policy "store_media_select_members" on storage.objects for select to authenticated
using (bucket_id = 'store-media' and exists (
  select 1 from public.stores s where s.id::text = (storage.foldername(name))[1]
  and (s.owner_id = (select auth.uid()) or exists (
    select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid())
  ))
));
create policy "store_media_insert_editors" on storage.objects for insert to authenticated
with check (bucket_id = 'store-media' and exists (
  select 1 from public.stores s where s.id::text = (storage.foldername(name))[1]
  and (s.owner_id = (select auth.uid()) or exists (
    select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid()) and sm.role in ('admin','editor')
  ))
));
create policy "store_media_update_editors" on storage.objects for update to authenticated
using (bucket_id = 'store-media' and exists (
  select 1 from public.stores s where s.id::text = (storage.foldername(name))[1]
  and (s.owner_id = (select auth.uid()) or exists (
    select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid()) and sm.role in ('admin','editor')
  ))
))
with check (bucket_id = 'store-media' and exists (
  select 1 from public.stores s where s.id::text = (storage.foldername(name))[1]
  and (s.owner_id = (select auth.uid()) or exists (
    select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid()) and sm.role in ('admin','editor')
  ))
));
create policy "store_media_delete_editors" on storage.objects for delete to authenticated
using (bucket_id = 'store-media' and exists (
  select 1 from public.stores s where s.id::text = (storage.foldername(name))[1]
  and (s.owner_id = (select auth.uid()) or exists (
    select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid()) and sm.role in ('admin','editor')
  ))
));
