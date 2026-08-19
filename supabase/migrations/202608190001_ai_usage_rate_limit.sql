begin;

-- Per-user, per-endpoint, per-day request counter for the OpenAI-backed Edge Functions
-- (recipe-suggest, nutrition-estimate, nutrition-photo-estimate, recipe-image).
-- Written exclusively by increment_ai_usage(), called with the service-role key from
-- inside the Edge Functions themselves, so there is no client-facing RLS policy here.
create table public.ai_usage_daily (
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  endpoint text not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (auth_user_id, usage_date, endpoint)
);

alter table public.ai_usage_daily enable row level security;

create or replace function public.increment_ai_usage(
  p_user_id uuid,
  p_endpoint text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.ai_usage_daily (auth_user_id, usage_date, endpoint, request_count)
  values (p_user_id, (now() at time zone 'utc')::date, p_endpoint, 1)
  on conflict (auth_user_id, usage_date, endpoint)
  do update set request_count = ai_usage_daily.request_count + 1, updated_at = now()
  returning request_count into v_count;

  return v_count;
end;
$$;

-- Only the Edge Functions (service_role) may call this — it counts against every
-- caller-supplied user id with no ownership check, so it must never be reachable
-- with the anon/authenticated key.
revoke all on function public.increment_ai_usage(uuid, text) from public;
grant execute on function public.increment_ai_usage(uuid, text) to service_role;

commit;
