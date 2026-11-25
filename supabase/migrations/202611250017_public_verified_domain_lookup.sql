-- Verified custom domains are readable so the edge proxy can resolve hostnames to stores.
drop policy if exists "domains_store_members_all" on public.store_domains;
drop policy if exists "domains_public_verified_select" on public.store_domains;
create policy "domains_public_verified_select" on public.store_domains for select to anon using(verification_status='verified');
drop policy if exists "domains_select_members_or_verified" on public.store_domains;
create policy "domains_select_members_or_verified" on public.store_domains for select to authenticated using(verification_status='verified' or private.can_access_store(store_id));
create policy "domains_insert_members" on public.store_domains for insert to authenticated with check(private.can_access_store(store_id));
create policy "domains_update_members" on public.store_domains for update to authenticated using(private.can_access_store(store_id)) with check(private.can_access_store(store_id));
create policy "domains_delete_members" on public.store_domains for delete to authenticated using(private.can_access_store(store_id));
grant select on public.store_domains to anon;
