-- Complete paid orders once, update stock, and record the verified payment event.
create or replace function private.complete_paid_order(p_reference text, p_payload jsonb default '{}'::jsonb)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare target_order public.orders%rowtype;
begin
 select * into target_order from public.orders where payment_reference=p_reference for update;
 if not found then return false; end if;
 if target_order.payment_status='paid' then return true; end if;
 update public.orders set payment_status='paid',paid_at=now(),updated_at=now() where id=target_order.id and payment_status='pending';
 if not found then return false; end if;
 update public.products p set inventory_quantity=greatest(0,p.inventory_quantity-totals.quantity),updated_at=now()
 from (select product_id,sum(quantity)::integer quantity from public.order_items where order_id=target_order.id and product_id is not null group by product_id) totals
 where p.id=totals.product_id and p.store_id=target_order.store_id;
 insert into public.payment_events(store_id,order_id,provider,provider_event_id,event_type,payload,processed_at)
 values(target_order.store_id,target_order.id,'paystack',p_reference||':charge.success','charge.success',coalesce(p_payload,'{}'::jsonb),now())
 on conflict(provider_event_id) do nothing;
 if target_order.customer_id is not null then update public.customers set total_orders=total_orders+1,total_spent=total_spent+target_order.total,updated_at=now() where id=target_order.customer_id; end if;
 return true;
end;
$$;
revoke all on function private.complete_paid_order(text,jsonb) from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.complete_paid_order(text,jsonb) to service_role;
