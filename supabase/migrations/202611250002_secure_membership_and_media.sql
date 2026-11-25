-- Replace recursive membership RLS checks with narrowly scoped private helpers.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.can_access_store(_store_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.stores s where s.id = _store_id and (
    s.owner_id = (select auth.uid()) or exists (
      select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid())
    )
  ));
$$;

create or replace function private.can_edit_store(_store_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.stores s where s.id = _store_id and (
    s.owner_id = (select auth.uid()) or exists (
      select 1 from public.store_members sm where sm.store_id = s.id and sm.user_id = (select auth.uid())
        and sm.role in ('admin','editor')
    )
  ));
$$;

create or replace function private.is_store_owner(_store_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.stores s where s.id = _store_id and s.owner_id = (select auth.uid()));
$$;

revoke all on function private.can_access_store(uuid) from public;
revoke all on function private.can_edit_store(uuid) from public;
revoke all on function private.is_store_owner(uuid) from public;
grant execute on function private.can_access_store(uuid) to authenticated;
grant execute on function private.can_edit_store(uuid) to authenticated;
grant execute on function private.is_store_owner(uuid) to authenticated;

drop policy if exists "stores_select_members" on public.stores;
create policy "stores_select_members" on public.stores for select to authenticated using (private.can_access_store(id));

drop policy if exists "members_select_self_or_owner" on public.store_members;
drop policy if exists "members_insert_owner" on public.store_members;
drop policy if exists "members_update_owner" on public.store_members;
drop policy if exists "members_delete_owner" on public.store_members;
create policy "members_select_self_or_owner" on public.store_members for select to authenticated using (user_id = (select auth.uid()) or private.is_store_owner(store_id));
create policy "members_insert_owner" on public.store_members for insert to authenticated with check (private.is_store_owner(store_id));
create policy "members_update_owner" on public.store_members for update to authenticated using (private.is_store_owner(store_id)) with check (private.is_store_owner(store_id));
create policy "members_delete_owner" on public.store_members for delete to authenticated using (private.is_store_owner(store_id));

drop policy if exists "collections_select_store_members" on public.collections;
drop policy if exists "collections_insert_store_members" on public.collections;
drop policy if exists "collections_update_store_members" on public.collections;
drop policy if exists "collections_delete_store_members" on public.collections;
create policy "collections_select_store_members" on public.collections for select to authenticated using (private.can_access_store(store_id));
create policy "collections_insert_store_members" on public.collections for insert to authenticated with check (private.can_edit_store(store_id));
create policy "collections_update_store_members" on public.collections for update to authenticated using (private.can_edit_store(store_id)) with check (private.can_edit_store(store_id));
create policy "collections_delete_store_members" on public.collections for delete to authenticated using (private.can_edit_store(store_id));

drop policy if exists "products_select_store_members" on public.products;
drop policy if exists "products_insert_store_members" on public.products;
drop policy if exists "products_update_store_members" on public.products;
drop policy if exists "products_delete_store_members" on public.products;
create policy "products_select_store_members" on public.products for select to authenticated using (private.can_access_store(store_id));
create policy "products_insert_store_members" on public.products for insert to authenticated with check (private.can_edit_store(store_id));
create policy "products_update_store_members" on public.products for update to authenticated using (private.can_edit_store(store_id)) with check (private.can_edit_store(store_id));
create policy "products_delete_store_members" on public.products for delete to authenticated using (private.can_edit_store(store_id));

drop policy if exists "pages_select_store_members" on public.store_pages;
drop policy if exists "pages_insert_store_editors" on public.store_pages;
drop policy if exists "pages_update_store_editors" on public.store_pages;
drop policy if exists "pages_delete_store_editors" on public.store_pages;
create policy "pages_select_store_members" on public.store_pages for select to authenticated using (private.can_access_store(store_id));
create policy "pages_insert_store_editors" on public.store_pages for insert to authenticated with check (private.can_edit_store(store_id));
create policy "pages_update_store_editors" on public.store_pages for update to authenticated using (private.can_edit_store(store_id)) with check (private.can_edit_store(store_id));
create policy "pages_delete_store_editors" on public.store_pages for delete to authenticated using (private.can_edit_store(store_id));

drop policy if exists "store_media_select_members" on storage.objects;
drop policy if exists "store_media_insert_editors" on storage.objects;
drop policy if exists "store_media_update_editors" on storage.objects;
drop policy if exists "store_media_delete_editors" on storage.objects;
create policy "store_media_select_members" on storage.objects for select to authenticated using (bucket_id = 'store-media' and private.can_access_store(((storage.foldername(name))[1])::uuid));
create policy "store_media_insert_editors" on storage.objects for insert to authenticated with check (bucket_id = 'store-media' and private.can_edit_store(((storage.foldername(name))[1])::uuid));
create policy "store_media_update_editors" on storage.objects for update to authenticated using (bucket_id = 'store-media' and private.can_edit_store(((storage.foldername(name))[1])::uuid)) with check (bucket_id = 'store-media' and private.can_edit_store(((storage.foldername(name))[1])::uuid));
create policy "store_media_delete_editors" on storage.objects for delete to authenticated using (bucket_id = 'store-media' and private.can_edit_store(((storage.foldername(name))[1])::uuid));

alter table public.products drop constraint if exists products_collection_id_store_id_fkey;
alter table public.products add constraint products_collection_id_store_id_fkey
foreign key (collection_id, store_id) references public.collections(id, store_id) on delete set null (collection_id);
create index if not exists products_collection_store_idx on public.products(collection_id, store_id);
