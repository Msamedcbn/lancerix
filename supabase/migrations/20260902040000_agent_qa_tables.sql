alter table public.qa_tier_orders
  add column agent_status text check (agent_status in ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'ESCALATED'));

create table public.qa_agent_runs (
  id uuid primary key default gen_random_uuid(),
  tier_order_id uuid not null references public.qa_tier_orders(id) on delete cascade,
  status text not null check (status in ('RUNNING', 'SUCCESS', 'FAILED', 'ESCALATED_TO_TIER3')),
  llm_responses jsonb,
  screenshots text[],
  confidence_score integer check (confidence_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index qa_agent_runs_tier_order_id_idx on public.qa_agent_runs (tier_order_id);

alter table public.qa_agent_runs enable row level security;

create policy qa_agent_runs_select on public.qa_agent_runs
  for select using (
    exists (
      select 1 from public.qa_tier_orders o
      join public.deliveries d on d.id = o.delivery_id
      where o.id = tier_order_id and public.is_contract_party(d.contract_id)
    )
    or public.is_admin()
  );

create or replace function public.auto_escalate_qa_tier(
  p_order_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery_id uuid;
begin
  if not public.is_admin() then
    raise exception 'only admin/worker can escalate qa tier' using errcode = 'insufficient_privilege';
  end if;

  select delivery_id into v_delivery_id 
  from public.qa_tier_orders 
  where id = p_order_id;
  
  if v_delivery_id is null then
    raise exception 'qa_tier_order % not found', p_order_id using errcode = 'no_data_found';
  end if;

  update public.qa_tier_orders 
  set agent_status = 'ESCALATED' 
  where id = p_order_id;
  
  insert into public.qa_tier_orders (delivery_id, tier, fee_kurus, payment_status, agent_status)
  values (v_delivery_id, 'TIER3', 0, 'PENDING', null);
  
end;
$$;
