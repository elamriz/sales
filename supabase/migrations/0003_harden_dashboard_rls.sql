create or replace function public.is_dashboard_user() returns boolean
language sql stable security invoker set search_path = public
as $$
  select exists (
    select 1
    from public.dashboard_users du
    where du.user_id = auth.uid()
  );
$$;

revoke execute on function public.is_dashboard_user() from public;
revoke execute on function public.is_dashboard_user() from anon;
grant execute on function public.is_dashboard_user() to authenticated;

comment on function public.is_dashboard_user() is
'Checks whether the authenticated user is authorized for the Sales dashboard. SECURITY INVOKER keeps the dashboard_users RLS policy in force.';
