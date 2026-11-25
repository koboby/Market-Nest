-- Published storefronts are public to both anonymous and signed-in shoppers.
drop policy if exists "stores_public_select" on public.stores;
create policy "stores_public_select" on public.stores for select to anon, authenticated using (status = 'published');
drop policy if exists "pages_public_select_published" on public.store_pages;
create policy "pages_public_select_published" on public.store_pages for select to anon, authenticated using (is_published and private.is_published_store(store_id));
drop policy if exists "products_public_select_active" on public.products;
create policy "products_public_select_active" on public.products for select to anon, authenticated using (status = 'active' and private.is_published_store(store_id));
drop policy if exists "collections_public_select_published" on public.collections;
create policy "collections_public_select_published" on public.collections for select to anon, authenticated using (is_published and private.is_published_store(store_id));
drop policy if exists "store_media_public_product_images" on storage.objects;
create policy "store_media_public_product_images" on storage.objects for select to anon, authenticated using (bucket_id = 'store-media' and private.is_public_product_media(((storage.foldername(name))[1])::uuid, name));
