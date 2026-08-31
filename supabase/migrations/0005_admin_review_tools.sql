create table if not exists public.dashboard_admin_access (
  id smallint primary key default 1 check (id = 1),
  code_hash text not null,
  updated_at timestamptz not null default now()
);

alter table public.dashboard_admin_access enable row level security;
revoke all on public.dashboard_admin_access from anon, authenticated;

create or replace function public.verify_dashboard_admin(p_code text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.dashboard_admin_access a
    where a.id = 1
      and a.code_hash = encode(digest(coalesce(p_code,''), 'sha256'), 'hex')
  );
$$;

revoke all on function public.verify_dashboard_admin(text) from public;
grant execute on function public.verify_dashboard_admin(text) to anon, authenticated;

create or replace function public.get_customer_private_contacts(p_code text)
returns table(customer_id uuid, phone_e164 text, whatsapp_number text)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_dashboard_admin(p_code) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  return query
    select c.customer_id, c.phone_e164, c.whatsapp_number
    from public.customer_private_contacts c;
end;
$$;

revoke all on function public.get_customer_private_contacts(text) from public;
grant execute on function public.get_customer_private_contacts(text) to anon, authenticated;

create or replace function public.admin_set_review_amount(p_code text, p_episode_id uuid, p_amount numeric)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_dashboard_admin(p_code) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  if p_amount is null or p_amount < 0 then
    raise exception 'invalid amount';
  end if;

  update public.sales_episodes
     set total = p_amount,
         amount_confidence = 1,
         manually_overridden = true,
         updated_at = now()
   where id = p_episode_id;

  update public.review_queue
     set review_note = concat_ws(E'\n', nullif(review_note,''), 'Montant manuel enregistré depuis le dashboard: ' || to_char(p_amount, 'FM999999990.00') || ' EUR. Validation encore requise.')
   where entity_type = 'sales_episode'
     and entity_id = p_episode_id
     and status = 'pending';
end;
$$;

revoke all on function public.admin_set_review_amount(text,uuid,numeric) from public;
grant execute on function public.admin_set_review_amount(text,uuid,numeric) to anon, authenticated;

create or replace function public.admin_resolve_review(
  p_code text,
  p_episode_id uuid,
  p_action text,
  p_amount numeric default null,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_old_classification public.sale_classification;
  v_old_status public.order_status;
  v_total numeric;
  v_review_status public.review_status;
  v_new_classification public.sale_classification;
  v_new_status public.order_status;
begin
  if not public.verify_dashboard_admin(p_code) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select classification, status, total
    into v_old_classification, v_old_status, v_total
  from public.sales_episodes
  where id = p_episode_id
  for update;

  if not found then raise exception 'episode not found'; end if;

  if p_action = 'approve_revenue' then
    v_total := coalesce(p_amount, v_total);
    if v_total is null or v_total < 0 then raise exception 'amount required'; end if;
    v_review_status := 'approved';
    v_new_classification := 'confirmed';
    v_new_status := 'confirmed';
    update public.sales_episodes
       set total = v_total,
           amount_confidence = 1,
           classification = 'confirmed',
           status = 'confirmed',
           review_required = false,
           revenue_eligible = true,
           manually_overridden = true,
           updated_at = now()
     where id = p_episode_id;
  elsif p_action = 'approve_no_revenue' then
    v_review_status := 'approved';
    v_new_classification := 'confirmed';
    v_new_status := 'confirmed';
    update public.sales_episodes
       set classification = 'confirmed',
           status = 'confirmed',
           review_required = false,
           revenue_eligible = false,
           manually_overridden = true,
           updated_at = now()
     where id = p_episode_id;
  elsif p_action = 'reject' then
    v_review_status := 'rejected';
    v_new_classification := 'not_sale';
    v_new_status := 'not_sale';
    update public.sales_episodes
       set classification = 'not_sale',
           status = 'not_sale',
           review_required = false,
           revenue_eligible = false,
           manually_overridden = true,
           updated_at = now()
     where id = p_episode_id;
  else
    raise exception 'invalid action';
  end if;

  insert into public.manual_decisions(
    episode_id, user_id, previous_classification, new_classification,
    previous_status, new_status, note
  ) values (
    p_episode_id, null, v_old_classification, v_new_classification,
    v_old_status, v_new_status,
    concat_ws(' · ', 'Décision manuelle dashboard', nullif(p_note,''))
  );

  update public.review_queue
     set status = v_review_status,
         reviewed_at = now(),
         reviewer_user_id = null,
         review_note = concat_ws(E'\n', nullif(review_note,''), concat_ws(' · ', 'Décision manuelle dashboard: ' || p_action, nullif(p_note,'')))
   where entity_type = 'sales_episode'
     and entity_id = p_episode_id
     and status = 'pending';
end;
$$;

revoke all on function public.admin_resolve_review(text,uuid,text,numeric,text) from public;
grant execute on function public.admin_resolve_review(text,uuid,text,numeric,text) to anon, authenticated;

-- The access-code hash is provisioned operationally and is intentionally not committed.