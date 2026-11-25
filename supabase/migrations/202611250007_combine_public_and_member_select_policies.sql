-- Avoid overlapping permissive SELECT policies for authenticated users.
drop policy if exists "stores_public_select" on public.stores;
create policy "stores_public_select" on public.stores for select to anon using (status = 'published');
drop policy if exists "stores_select_members" on public.stores;
create policy "stores_select_members" on public.stores for select to authenticated using (status = 'published' or private.can_access_store(id));

drop policy if exists "pages_public_select_published" on public.store_pages;
create policy "pages_public_select_published" on public.store_pages for select to anon using (is_published and private.is_published_store(store_id));
drop policy if exists "pages_select_store_members" on public.store_pages;
create policy "pages_select_store_members" on public.store_pages for select to authenticated using (private.can_access_store(store_id) or (is_published and private.is_published_store(store_id)));

drop policy if exists "products_public_select_active" on public.products;
create policy "products_public_select_active" on public.products for select to anon using (status = 'active' and private.is_published_store(store_id));
drop policy if exists "products_select_store_members" on public.products;
create policy "products_select_store_members" on public.products for select to authenticated using (private.can_access_store(store_id) or (status = 'active' and private.is_published_store(store_id)));

drop policy if exists "collections_public_select_published" on public.collections;
create policy "collections_public_select_published" on public.collections for select to anon using (is_published and private.is_published_store(store_id));
drop policy if exists "collections_select_store_members" on public.collections;
create policy "collections_select_store_members" on public.collections for select to authenticated using (private.can_access_store(store_id) or (is_published and private.is_published_store(store_id)));

drop policy if exists "store_media_public_product_images" on storage.objects;
create policy "store_media_public_product_images" on storage.objects for select to anon using (bucket_id = 'store-media' and private.is_public_product_media(((storage.foldername(name))[1])::uuid, name));
drop policy if exists "store_media_select_members" on storage.objects;
create policy "store_media_select_members" on storage.objects for select to authenticated using (
  bucket_id = 'store-media' and (
    private.can_access_store(((storage.foldername(name))[1])::uuid)
    or private.is_public_product_media(((storage.foldername(name))[1])::uuid, name)
  )
);
