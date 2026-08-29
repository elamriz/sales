create extension if not exists pgcrypto;

create type public.sale_classification as enum ('confirmed', 'probable', 'not_sale');
create type public.review_status as enum ('pending', 'approved', 'rejected');
create type public.analysis_status as enum ('pending', 'running', 'completed', 'error');
create type public.payment_status as enum ('unknown', 'pending', 'paid', 'failed', 'refunded', 'cash_due');
create type public.order_status as enum ('lead', 'confirmed', 'fulfilled', 'cancelled', 'abandoned', 'not_sale');

create table public.dashboard_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null check (run_type in ('backfill', 'incremental', 'reanalysis', 'manual_review')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status public.analysis_status not null default 'running',
  source text not null default 'whatsapp_raw',
  model_name text,
  analysis_version text not null default 'v1',
  chats_scanned integer not null default 0,
  messages_scanned integer not null default 0,
  episodes_created integer not null default 0,
  notes text
);

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  whatsapp_chat_id text not null unique,
  display_name text,
  first_message_at timestamptz,
  last_message_at timestamptz,
  message_count integer not null default 0,
  last_analyzed_message_id text,
  last_analyzed_message_at timestamptz,
  analysis_status public.analysis_status not null default 'pending',
  latest_analysis_run_id uuid references public.analysis_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  whatsapp_chat_id text not null unique,
  display_name text,
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  first_order_at timestamptz,
  last_order_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null unique,
  category text,
  strength text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.sales_episodes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  chat_id uuid not null references public.chats(id) on delete cascade,
  whatsapp_chat_id text not null,
  ordered_at timestamptz,
  episode_started_at timestamptz,
  episode_ended_at timestamptz,
  subtotal numeric(12,2),
  delivery_fee numeric(12,2),
  discount_amount numeric(12,2),
  total numeric(12,2),
  currency text not null default 'EUR',
  payment_method text,
  payment_status public.payment_status not null default 'unknown',
  status public.order_status not null default 'lead',
  classification public.sale_classification not null,
  confidence numeric(5,4) not null check (confidence >= 0 and confidence <= 1),
  review_required boolean not null default false,
  analysis_summary text not null,
  uncertainty jsonb not null default '{}'::jsonb,
  analysis_run_id uuid references public.analysis_runs(id) on delete set null,
  manually_overridden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.sales_episodes(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity numeric(12,3),
  unit_price numeric(12,2),
  line_total numeric(12,2),
  confidence numeric(5,4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  notes text
);

create table public.order_evidence (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.sales_episodes(id) on delete cascade,
  archive_message_id text not null,
  whatsapp_message_id text,
  message_at timestamptz,
  evidence_type text not null check (evidence_type in ('intent', 'product', 'quantity', 'price', 'discount', 'delivery', 'payment', 'confirmation', 'cancellation', 'fulfillment', 'other')),
  created_at timestamptz not null default now(),
  unique (episode_id, archive_message_id, evidence_type)
);

create table public.review_queue (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('sales_episode', 'stock_request', 'followup')),
  entity_id uuid not null,
  reason text not null,
  reason_code text not null,
  confidence numeric(5,4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  status public.review_status not null default 'pending',
  reviewer_user_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);

create table public.stock_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  chat_id uuid not null references public.chats(id) on delete cascade,
  product_name text not null,
  requested_at timestamptz not null,
  quantity numeric(12,3),
  status text not null default 'waiting' check (status in ('waiting', 'notified', 'converted', 'closed')),
  confidence numeric(5,4) not null check (confidence >= 0 and confidence <= 1),
  source_message_id text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.followups (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  chat_id uuid not null references public.chats(id) on delete cascade,
  episode_id uuid references public.sales_episodes(id) on delete cascade,
  reason text not null,
  suggested_at timestamptz not null default now(),
  due_at timestamptz,
  status text not null default 'open' check (status in ('open', 'done', 'dismissed')),
  confidence numeric(5,4) not null check (confidence >= 0 and confidence <= 1),
  source_message_id text,
  created_at timestamptz not null default now()
);

create table public.manual_decisions (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.sales_episodes(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  previous_classification public.sale_classification,
  new_classification public.sale_classification not null,
  previous_status public.order_status,
  new_status public.order_status,
  note text,
  created_at timestamptz not null default now()
);

create index chats_last_message_idx on public.chats(last_message_at desc);
create index customers_last_order_idx on public.customers(last_order_at desc);
create index episodes_ordered_at_idx on public.sales_episodes(ordered_at desc);
create index episodes_classification_idx on public.sales_episodes(classification, ordered_at desc);
create index episodes_customer_idx on public.sales_episodes(customer_id, ordered_at desc);
create index items_product_name_idx on public.order_items(product_name);
create index evidence_message_idx on public.order_evidence(archive_message_id);
create index review_pending_idx on public.review_queue(status, created_at desc);
create index stock_waiting_idx on public.stock_requests(status, requested_at desc);
create index followups_open_idx on public.followups(status, due_at);

alter table public.dashboard_users enable row level security;
alter table public.analysis_runs enable row level security;
alter table public.chats enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.sales_episodes enable row level security;
alter table public.order_items enable row level security;
alter table public.order_evidence enable row level security;
alter table public.review_queue enable row level security;
alter table public.stock_requests enable row level security;
alter table public.followups enable row level security;
alter table public.manual_decisions enable row level security;

create function public.is_dashboard_user() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.dashboard_users du where du.user_id = auth.uid());
$$;

create policy "dashboard users read own access" on public.dashboard_users for select to authenticated using (user_id = auth.uid());

create policy "dashboard users all analysis_runs" on public.analysis_runs for all to authenticated using (public.is_dashboard_user()) with check (public.is_dashboard_user());
create policy "dashboard users all chats" on public.chats for all to authenticated using (public.is_dashboard_user()) with check (public.is_dashboard_user());
create policy "dashboard users all customers" on public.customers for all to authenticated using (public.is_dashboard_user()) with check (public.is_dashboard_user());
create policy "dashboard users all products" on public.products for all to authenticated using (public.is_dashboard_user()) with check (public.is_dashboard_user());
create policy "dashboard users all episodes" on public.sales_episodes for all to authenticated using (public.is_dashboard_user()) with check (public.is_dashboard_user());
create policy "dashboard users all items" on public.order_items for all to authenticated using (public.is_dashboard_user()) with check (public.is_dashboard_user());
create policy "dashboard users all evidence" on public.order_evidence for all to authenticated using (public.is_dashboard_user()) with check (public.is_dashboard_user());
create policy "dashboard users all reviews" on public.review_queue for all to authenticated using (public.is_dashboard_user()) with check (public.is_dashboard_user());
create policy "dashboard users all stock" on public.stock_requests for all to authenticated using (public.is_dashboard_user()) with check (public.is_dashboard_user());
create policy "dashboard users all followups" on public.followups for all to authenticated using (public.is_dashboard_user()) with check (public.is_dashboard_user());
create policy "dashboard users all decisions" on public.manual_decisions for all to authenticated using (public.is_dashboard_user()) with check (public.is_dashboard_user());
