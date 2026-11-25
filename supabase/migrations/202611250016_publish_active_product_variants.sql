-- Shoppers may read active variants of active products in published stores.
drop policy if exists "variants_store_members_all" on public.product_variants;
drop policy if exists "variants_public_select_active" on public.product_variants;
create policy "variants_public_select_active" on public.product_variants for select to anon
using (is_active and exists(select 1 from public.products p join public.stores s on s.id=p.store_id where p.id=product_variants.product_id and p.store_id=product_variants.store_id and p.status='active' and s.status='published'));
drop policy if exists "variants_select_members_or_public" on public.product_variants;
create policy "variants_select_members_or_public" on public.product_variants for select to authenticated
using (private.can_access_store(product_variants.store_id) or (is_active and exists(select 1 from public.products p join public.stores s on s.id=p.store_id where p.id=product_id and p.store_id=store_id and p.status='active' and s.status='published')));
create policy "variants_insert_members" on public.product_variants for insert to authenticated with check(private.can_access_store(store_id));
create policy "variants_update_members" on public.product_variants for update to authenticated using(private.can_access_store(store_id)) with check(private.can_access_store(store_id));
create policy "variants_delete_members" on public.product_variants for delete to authenticated using(private.can_access_store(store_id));
grant select on public.product_variants to anon;
