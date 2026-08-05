begin;

-- Bring older Supabase projects up to the schema expected by the current
-- meal-plan repository and replace_meal_plan_day RPC. All additions are
-- idempotent and preserve existing rows.
alter table public.meal_plan_items
  add column if not exists planned_servings numeric not null default 1,
  add column if not exists portion_amount numeric,
  add column if not exists portion_unit text,
  add column if not exists entry_source text not null default 'recipe',
  add column if not exists custom_title text,
  add column if not exists custom_products jsonb not null default '[]'::jsonb,
  add column if not exists custom_calories numeric not null default 0,
  add column if not exists custom_protein_g numeric not null default 0,
  add column if not exists custom_fat_g numeric not null default 0,
  add column if not exists custom_carbs_g numeric not null default 0,
  add column if not exists custom_recipe_data jsonb,
  add column if not exists custom_image_url text;

-- Backfill values required by the current application without overwriting
-- valid data already stored in newer environments.
update public.meal_plan_items
set
  planned_servings = coalesce(planned_servings, 1),
  portion_amount = coalesce(portion_amount, planned_servings, 1),
  portion_unit = coalesce(nullif(portion_unit, ''), 'serving'),
  entry_source = coalesce(nullif(entry_source, ''), 'recipe'),
  custom_products = coalesce(custom_products, '[]'::jsonb),
  custom_calories = coalesce(custom_calories, 0),
  custom_protein_g = coalesce(custom_protein_g, 0),
  custom_fat_g = coalesce(custom_fat_g, 0),
  custom_carbs_g = coalesce(custom_carbs_g, 0);

alter table public.meal_plan_items
  alter column planned_servings set default 1,
  alter column planned_servings set not null,
  alter column portion_amount set default 1,
  alter column portion_amount set not null,
  alter column portion_unit set default 'serving',
  alter column portion_unit set not null,
  alter column entry_source set default 'recipe',
  alter column entry_source set not null,
  alter column custom_products set default '[]'::jsonb,
  alter column custom_products set not null,
  alter column custom_calories set default 0,
  alter column custom_calories set not null,
  alter column custom_protein_g set default 0,
  alter column custom_protein_g set not null,
  alter column custom_fat_g set default 0,
  alter column custom_fat_g set not null,
  alter column custom_carbs_g set default 0,
  alter column custom_carbs_g set not null;

-- Recreate the RPC after the columns exist so PostgreSQL validates the final
-- insert against the repaired table schema.
create or replace function public.replace_meal_plan_day(
  p_plan_date date,
  p_source_ration_id uuid,
  p_items jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := public.current_app_user_id();
  v_plan_id uuid;
begin
  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'p_items must be a JSON array' using errcode = '22023';
  end if;

  perform 1
  from jsonb_to_recordset(p_items) as item(
    meal_type public.meal_type, planned_recipe_id uuid, entry_source text,
    custom_title text, custom_products jsonb, custom_calories numeric,
    custom_protein_g numeric, custom_fat_g numeric, custom_carbs_g numeric,
    planned_servings numeric, portion_amount numeric, portion_unit text,
    custom_recipe_data jsonb, custom_image_url text
  )
  where item.entry_source not in ('recipe', 'manual', 'ai')
     or item.portion_amount <= 0
     or item.portion_unit not in ('serving', 'g')
     or (item.entry_source = 'recipe' and item.planned_recipe_id is null)
     or (item.entry_source in ('manual', 'ai') and (
       item.planned_recipe_id is not null
       or nullif(trim(item.custom_title), '') is null
     ));

  if found then
    raise exception 'Invalid meal plan item payload' using errcode = '22023';
  end if;

  if jsonb_array_length(p_items) = 0 then
    delete from public.meal_plans
    where user_id = v_user_id and plan_date = p_plan_date;
    return null;
  end if;

  insert into public.meal_plans(user_id, plan_date, source_ration_id)
  values (v_user_id, p_plan_date, p_source_ration_id)
  on conflict (user_id, plan_date)
  do update set source_ration_id = excluded.source_ration_id
  returning id into v_plan_id;

  delete from public.meal_plan_items where meal_plan_id = v_plan_id;

  insert into public.meal_plan_items(
    meal_plan_id, meal_type, planned_recipe_id, entry_source, custom_title,
    custom_products, custom_calories, custom_protein_g, custom_fat_g,
    custom_carbs_g, planned_servings, portion_amount, portion_unit,
    custom_recipe_data, custom_image_url
  )
  select
    v_plan_id, item.meal_type, item.planned_recipe_id, item.entry_source,
    item.custom_title, coalesce(item.custom_products, '[]'::jsonb),
    coalesce(item.custom_calories, 0), coalesce(item.custom_protein_g, 0),
    coalesce(item.custom_fat_g, 0), coalesce(item.custom_carbs_g, 0),
    coalesce(item.planned_servings, 1), item.portion_amount,
    item.portion_unit, item.custom_recipe_data, item.custom_image_url
  from jsonb_to_recordset(p_items) as item(
    meal_type public.meal_type, planned_recipe_id uuid, entry_source text,
    custom_title text, custom_products jsonb, custom_calories numeric,
    custom_protein_g numeric, custom_fat_g numeric, custom_carbs_g numeric,
    planned_servings numeric, portion_amount numeric, portion_unit text,
    custom_recipe_data jsonb, custom_image_url text
  );

  return v_plan_id;
end;
$$;

grant execute on function public.replace_meal_plan_day(date, uuid, jsonb)
  to authenticated;

commit;
