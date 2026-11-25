-- PostgREST can invoke this public RPC, but only the server service role may execute it.
create or replace function public.complete_paid_order(p_reference text, p_payload jsonb default '{}'::jsonb)
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
 return private.complete_paid_order(p_reference,p_payload);
end;
$$;
revoke all on function public.complete_paid_order(text,jsonb) from public,anon,authenticated;
grant execute on function public.complete_paid_order(text,jsonb) to service_role;
