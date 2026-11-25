-- Cover foreign-key columns for common joins and cascade operations.
create index if not exists order_items_product_id_idx on public.order_items(product_id);
create index if not exists order_items_variant_id_idx on public.order_items(variant_id);
create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists payment_events_order_id_idx on public.payment_events(order_id);
create index if not exists payment_events_store_id_idx on public.payment_events(store_id);
create index if not exists product_variants_store_id_idx on public.product_variants(store_id);
create index if not exists store_subscriptions_plan_id_idx on public.store_subscriptions(plan_id);
