-- Store the corresponding recurring plan identifier from Paystack.
alter table public.subscription_plans add column if not exists provider_plan_code text unique;
