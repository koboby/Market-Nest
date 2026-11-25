-- Allow public marketing pages to display active subscription plans.
drop policy if exists "plans_public_read_active" on public.subscription_plans;
create policy "plans_public_read_active" on public.subscription_plans for select to anon using(is_active);
grant select on public.subscription_plans to anon;
