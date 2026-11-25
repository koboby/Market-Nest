-- Public storefront reads are limited to published stores and active products.
create or replace function private.is_published_store(_store_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.stores s where s.id = _store_id and s.status = 'published');
$$;

create or replace function private.is_public_product_media(_store_id uuid, _object_name text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.products p join public.stores s on s.id = p.store_id
    where p.store_id = _store_id and s.status = 'published' and p.status = 'active'
      and p.images @> jsonb_build_array(jsonb_build_object('path', _object_name))
  );
$$;

grant usage on schema private to anon, authenticated;
revoke all on function private.is_published_store(uuid) from public;
revoke all on function private.is_public_product_media(uuid,text) from public;
grant execute on function private.is_published_store(uuid) to anon, authenticated;
grant execute on function private.is_public_product_media(uuid,text) to anon, authenticated;

drop policy if exists "stores_public_select" on public.stores;
create policy "stores_public_select" on public.stores for select to anon using (status = 'published');
drop policy if exists "pages_public_select_published" on public.store_pages;
create policy "pages_public_select_published" on public.store_pages for select to anon using (is_published and private.is_published_store(store_id));
drop policy if exists "products_public_select_active" on public.products;
create policy "products_public_select_active" on public.products for select to anon using (status = 'active' and private.is_published_store(store_id));
drop policy if exists "collections_public_select_published" on public.collections;
create policy "collections_public_select_published" on public.collections for select to anon using (is_published and private.is_published_store(store_id));
drop policy if exists "store_media_public_product_images" on storage.objects;
create policy "store_media_public_product_images" on storage.objects for select to anon using (bucket_id = 'store-media' and private.is_public_product_media(((storage.foldername(name))[1])::uuid, name));
