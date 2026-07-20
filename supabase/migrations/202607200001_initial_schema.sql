-- Initial Supabase schema for «Ты поела?». Review in a non-production project first.
begin;

create extension if not exists pgcrypto;

create type public.meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');
create type public.meal_source as enum ('ration', 'recipe_book', 'manual');
create type public.subscription_status as enum ('pending', 'active', 'past_due', 'cancelled', 'expired');
create type public.goal_kind as enum ('lose_weight', 'maintain_weight', 'gain_weight', 'custom');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  legacy_id text unique,
  telegram_user_id bigint not null unique check (telegram_user_id > 0),
  telegram_username text,
  first_name text,
  last_name text,
  timezone text not null default 'UTC' check (length(timezone) between 1 and 64),
  locale text not null default 'ru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  legacy_id text not null unique,
  title text not null,
  description text not null default '',
  meal_type public.meal_type not null,
  source public.meal_source not null default 'recipe_book',
  calories_per_serving numeric(10,2) not null check (calories_per_serving >= 0),
  protein_g_per_serving numeric(10,2) not null check (protein_g_per_serving >= 0),
  fat_g_per_serving numeric(10,2) not null check (fat_g_per_serving >= 0),
  carbs_g_per_serving numeric(10,2) not null check (carbs_g_per_serving >= 0),
  base_servings numeric(8,2) not null default 1 check (base_servings > 0),
  cooking_time_minutes integer not null default 0 check (cooking_time_minutes >= 0),
  steps text[] not null default '{}',
  tags text[] not null default '{}',
  allergens text[] not null default '{}',
  image_path text,
  video_url text,
  is_premium boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null,
  normalized_name text not null,
  category text not null check (category in ('овощи','фрукты','белок','молочные','крупы','бакалея','специи','прочее')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (normalized_name, category)
);

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  amount numeric(12,3) not null check (amount >= 0),
  unit text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recipe_id, sort_order)
);

create table public.rations (
  id uuid primary key default gen_random_uuid(),
  legacy_id text not null unique,
  ration_number integer not null,
  title text not null,
  description text not null default '',
  tags text[] not null default '{}',
  image_path text,
  is_premium boolean not null default false,
  published_on date,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ration_meals (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  ration_id uuid not null references public.rations(id) on delete cascade,
  meal_type public.meal_type not null,
  recipe_id uuid not null references public.recipes(id) on delete restrict,
  servings numeric(8,2) not null default 1 check (servings > 0),
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ration_id, meal_type)
);

create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  user_id uuid not null references public.users(id) on delete cascade,
  plan_date date not null,
  source_ration_id uuid references public.rations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

create table public.meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  meal_type public.meal_type not null,
  planned_recipe_id uuid references public.recipes(id) on delete restrict,
  planned_servings numeric(8,2) not null default 1 check (planned_servings > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (meal_plan_id, meal_type)
);

create table public.meal_completions (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  user_id uuid not null references public.users(id) on delete cascade,
  meal_plan_item_id uuid references public.meal_plan_items(id) on delete set null,
  completion_date date not null,
  meal_type public.meal_type not null,
  actual_recipe_id uuid references public.recipes(id) on delete restrict,
  actual_servings numeric(8,2) not null check (actual_servings > 0),
  calories_per_serving numeric(10,2) not null check (calories_per_serving >= 0),
  protein_g_per_serving numeric(10,2) not null check (protein_g_per_serving >= 0),
  fat_g_per_serving numeric(10,2) not null check (fat_g_per_serving >= 0),
  carbs_g_per_serving numeric(10,2) not null check (carbs_g_per_serving >= 0),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (meal_plan_item_id)
);

create table public.daily_summaries (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  user_id uuid not null references public.users(id) on delete cascade,
  summary_date date not null,
  calories numeric(12,2) not null default 0 check (calories >= 0),
  protein_g numeric(12,2) not null default 0 check (protein_g >= 0),
  fat_g numeric(12,2) not null default 0 check (fat_g >= 0),
  carbs_g numeric(12,2) not null default 0 check (carbs_g >= 0),
  steps integer check (steps >= 0),
  water_ml integer check (water_ml >= 0),
  sleep_minutes integer check (sleep_minutes between 0 and 1440),
  completed_meals smallint not null default 0 check (completed_meals between 0 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, summary_date)
);

create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  user_id uuid not null references public.users(id) on delete cascade,
  measured_on date not null,
  weight_kg numeric(6,2) check (weight_kg > 0),
  neck_cm numeric(6,2) check (neck_cm > 0),
  chest_cm numeric(6,2) check (chest_cm > 0),
  waist_cm numeric(6,2) check (waist_cm > 0),
  hips_cm numeric(6,2) check (hips_cm > 0),
  leg_cm numeric(6,2) check (leg_cm > 0),
  arm_cm numeric(6,2) check (arm_cm > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, measured_on),
  check (num_nonnulls(weight_kg, neck_cm, chest_cm, waist_cm, hips_cm, leg_cm, arm_cm) > 0)
);

create table public.habit_entries (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  user_id uuid not null references public.users(id) on delete cascade,
  entry_date date not null,
  steps integer check (steps >= 0),
  water_ml integer check (water_ml >= 0),
  sleep_minutes integer check (sleep_minutes between 0 and 1440),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date),
  check (num_nonnulls(steps, water_ml, sleep_minutes) > 0)
);

create table public.user_goals (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  user_id uuid not null references public.users(id) on delete cascade,
  goal_type public.goal_kind not null,
  starts_on date not null,
  ends_on date,
  target_weight_kg numeric(6,2) check (target_weight_kg > 0),
  daily_calories integer check (daily_calories > 0),
  daily_protein_g numeric(8,2) check (daily_protein_g >= 0),
  daily_fat_g numeric(8,2) check (daily_fat_g >= 0),
  daily_carbs_g numeric(8,2) check (daily_carbs_g >= 0),
  daily_steps integer check (daily_steps >= 0),
  daily_water_ml integer check (daily_water_ml >= 0),
  daily_sleep_minutes integer check (daily_sleep_minutes between 0 and 1440),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);

create unique index user_goals_one_active_idx on public.user_goals(user_id) where is_active;

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  user_id uuid not null references public.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null,
  provider_subscription_id text,
  status public.subscription_status not null default 'pending',
  premium_starts_at timestamptz,
  premium_ends_at timestamptz,
  auto_renew boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subscription_id),
  check (premium_ends_at is null or premium_starts_at is null or premium_ends_at > premium_starts_at)
);

create index recipes_meal_type_idx on public.recipes(meal_type) where is_published;
create index recipe_ingredients_ingredient_idx on public.recipe_ingredients(ingredient_id);
create index rations_published_sort_idx on public.rations(sort_order) where is_published;
create index ration_meals_recipe_idx on public.ration_meals(recipe_id);
create index meal_plans_user_date_idx on public.meal_plans(user_id, plan_date);
create index meal_plan_items_recipe_idx on public.meal_plan_items(planned_recipe_id);
create index meal_completions_user_date_idx on public.meal_completions(user_id, completion_date);
create index measurements_user_date_idx on public.measurements(user_id, measured_on desc);
create index habit_entries_user_date_idx on public.habit_entries(user_id, entry_date desc);
create index favorites_recipe_idx on public.favorites(recipe_id);
create index subscriptions_user_status_idx on public.subscriptions(user_id, status, premium_ends_at);

create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

do $$ declare t text; begin
  foreach t in array array['users','recipes','ingredients','recipe_ingredients','rations','ration_meals','meal_plans','meal_plan_items','meal_completions','daily_summaries','measurements','habit_entries','user_goals','favorites','subscriptions'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

create function public.current_app_user_id() returns uuid
language sql stable security definer set search_path = ''
as $$ select id from public.users where auth_user_id = auth.uid() $$;

create function public.has_premium_access() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = public.current_app_user_id() and status = 'active'
      and premium_starts_at <= now() and (premium_ends_at is null or premium_ends_at > now())
  )
$$;

revoke all on function public.current_app_user_id() from public;
revoke all on function public.has_premium_access() from public;
grant execute on function public.current_app_user_id() to authenticated;
grant execute on function public.has_premium_access() to authenticated;

alter table public.users enable row level security;
alter table public.recipes enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.rations enable row level security;
alter table public.ration_meals enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_plan_items enable row level security;
alter table public.meal_completions enable row level security;
alter table public.daily_summaries enable row level security;
alter table public.measurements enable row level security;
alter table public.habit_entries enable row level security;
alter table public.user_goals enable row level security;
alter table public.favorites enable row level security;
alter table public.subscriptions enable row level security;

-- Do not rely on project-level default grants: expose only the operations used by the app.
revoke all on all tables in schema public from anon, authenticated;
grant select on public.users to authenticated;
grant update (telegram_username, first_name, last_name, timezone, locale) on public.users to authenticated;
grant select on public.recipes, public.ingredients, public.recipe_ingredients,
  public.rations, public.ration_meals to authenticated;
grant select, insert, update, delete on public.meal_plans, public.meal_plan_items,
  public.meal_completions, public.daily_summaries, public.measurements,
  public.habit_entries, public.user_goals, public.favorites to authenticated;
grant select on public.subscriptions to authenticated;

create policy users_own_select on public.users for select to authenticated using (auth_user_id = auth.uid());
create policy users_own_update on public.users for update to authenticated using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

create policy recipes_entitled_read on public.recipes for select to authenticated
using (is_published and (not is_premium or public.has_premium_access()));
create policy ingredients_entitled_read on public.ingredients for select to authenticated using (
  exists (select 1 from public.recipe_ingredients ri join public.recipes r on r.id = ri.recipe_id
          where ri.ingredient_id = ingredients.id and r.is_published and (not r.is_premium or public.has_premium_access()))
);
create policy recipe_ingredients_entitled_read on public.recipe_ingredients for select to authenticated using (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.is_published and (not r.is_premium or public.has_premium_access()))
);
create policy rations_entitled_read on public.rations for select to authenticated
using (is_published and (not is_premium or public.has_premium_access()));
create policy ration_meals_entitled_read on public.ration_meals for select to authenticated using (
  exists (select 1 from public.rations r where r.id = ration_id and r.is_published and (not r.is_premium or public.has_premium_access()))
);
-- No INSERT/UPDATE/DELETE policies exist for catalog tables: only service_role can modify them.

create policy meal_plans_own_all on public.meal_plans for all to authenticated
using (user_id = public.current_app_user_id()) with check (user_id = public.current_app_user_id());
create policy meal_plan_items_own_all on public.meal_plan_items for all to authenticated
using (exists (select 1 from public.meal_plans p where p.id = meal_plan_id and p.user_id = public.current_app_user_id()))
with check (exists (select 1 from public.meal_plans p where p.id = meal_plan_id and p.user_id = public.current_app_user_id()));

create policy meal_completions_own_all on public.meal_completions for all to authenticated
using (user_id = public.current_app_user_id())
with check (
  user_id = public.current_app_user_id()
  and (meal_plan_item_id is null or exists (
    select 1 from public.meal_plan_items i join public.meal_plans p on p.id = i.meal_plan_id
    where i.id = meal_plan_item_id and p.user_id = public.current_app_user_id()
  ))
);

do $$ declare t text; begin
  foreach t in array array['daily_summaries','measurements','habit_entries','user_goals','favorites'] loop
    execute format('create policy %I on public.%I for all to authenticated using (user_id = public.current_app_user_id()) with check (user_id = public.current_app_user_id())', t || '_own_all', t);
  end loop;
end $$;

create policy subscriptions_own_select on public.subscriptions for select to authenticated
using (user_id = public.current_app_user_id());
-- Subscription writes are intentionally restricted to service_role/webhook code.

commit;
