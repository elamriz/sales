drop policy if exists "dashboard users read own access" on public.dashboard_users;
create policy "dashboard users read own access"
  on public.dashboard_users
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create index if not exists chats_latest_analysis_run_idx on public.chats(latest_analysis_run_id);
create index if not exists followups_chat_idx on public.followups(chat_id);
create index if not exists followups_customer_idx on public.followups(customer_id);
create index if not exists followups_episode_idx on public.followups(episode_id);
create index if not exists manual_decisions_episode_idx on public.manual_decisions(episode_id);
create index if not exists manual_decisions_user_idx on public.manual_decisions(user_id);
create index if not exists order_items_episode_idx on public.order_items(episode_id);
create index if not exists order_items_product_idx on public.order_items(product_id);
create index if not exists review_queue_reviewer_idx on public.review_queue(reviewer_user_id);
create index if not exists sales_episodes_analysis_run_idx on public.sales_episodes(analysis_run_id);
create index if not exists sales_episodes_chat_idx on public.sales_episodes(chat_id);
create index if not exists stock_requests_chat_idx on public.stock_requests(chat_id);
create index if not exists stock_requests_customer_idx on public.stock_requests(customer_id);
