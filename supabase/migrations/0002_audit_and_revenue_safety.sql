alter table public.chats
  add column if not exists chat_kind text not null default 'unknown'
    check (chat_kind in ('customer','internal','test','unknown')),
  add column if not exists broadcast_message_count integer not null default 0;

alter table public.sales_episodes
  add column if not exists episode_key text,
  add column if not exists amount_confidence numeric(5,4)
    check (amount_confidence is null or (amount_confidence >= 0 and amount_confidence <= 1)),
  add column if not exists revenue_eligible boolean not null default false,
  add column if not exists payment_confirmed_at timestamptz,
  add column if not exists refund_amount numeric(12,2) not null default 0,
  add column if not exists refunded_at timestamptz,
  add column if not exists fulfillment_status text not null default 'unknown'
    check (fulfillment_status in ('unknown','pending','handed_over','shipped','delivered','lost','replacement_sent','refunded','cancelled'));

create unique index if not exists episodes_idempotency_idx
  on public.sales_episodes(whatsapp_chat_id, episode_key)
  where episode_key is not null;

create index if not exists episodes_revenue_idx
  on public.sales_episodes(revenue_eligible, classification, ordered_at desc);

create or replace view public.revenue_events
with (security_invoker = true)
as
select
  id,
  customer_id,
  ordered_at,
  currency,
  greatest(coalesce(total,0) - coalesce(refund_amount,0), 0) as net_total,
  classification,
  revenue_eligible,
  review_required
from public.sales_episodes
where status <> 'not_sale';

comment on column public.sales_episodes.revenue_eligible is
'Only true when the transaction AND its final amount are supported strongly enough to enter confirmed revenue.';
comment on column public.sales_episodes.episode_key is
'Stable analyzer-generated key used to continue incremental backfills without recreating an already analyzed sales episode.';
