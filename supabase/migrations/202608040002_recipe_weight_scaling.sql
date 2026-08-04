begin;

alter table public.meal_plan_items
  add column if not exists total_recipe_weight_g numeric(10, 2) check (total_recipe_weight_g > 0),
  add column if not exists selected_weight_g numeric(10, 2) check (selected_weight_g > 0);

create or replace function public.replace_meal_plan_day(
  p_plan_date date, p_source_ration_id uuid, p_items jsonb
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_user_id uuid := public.current_app_user_id();
  v_plan_id uuid;
begin
  if jsonb_typeof(p_items) <> 'array' then raise exception 'p_items must be a JSON array' using errcode = '22023'; end if;
  perform 1 from jsonb_to_recordset(p_items) as item(
    meal_type public.meal_type, planned_recipe_id uuid, entry_source text,
    custom_title text, custom_products jsonb, custom_calories numeric,
    custom_protein_g numeric, custom_fat_g numeric, custom_carbs_g numeric,
    planned_servings numeric, portion_amount numeric, portion_unit text,
    total_recipe_weight_g numeric, selected_weight_g numeric,
    custom_recipe_data jsonb, custom_image_url text
  ) where item.entry_source not in ('recipe', 'manual', 'ai') or item.portion_amount <= 0
    or item.portion_unit not in ('serving', 'g')
    or (item.portion_unit = 'g' and (item.total_recipe_weight_g is null or item.selected_weight_g is null))
    or (item.entry_source = 'recipe' and item.planned_recipe_id is null)
    or (item.entry_source in ('manual', 'ai') and (item.planned_recipe_id is not null or nullif(trim(item.custom_title), '') is null));
  if found then raise exception 'Invalid meal plan item payload' using errcode = '22023'; end if;
  if jsonb_array_length(p_items) = 0 then delete from public.meal_plans where user_id = v_user_id and plan_date = p_plan_date; return null; end if;
  insert into public.meal_plans(user_id, plan_date, source_ration_id) values (v_user_id, p_plan_date, p_source_ration_id)
  on conflict (user_id, plan_date) do update set source_ration_id = excluded.source_ration_id returning id into v_plan_id;
  delete from public.meal_plan_items where meal_plan_id = v_plan_id;
  insert into public.meal_plan_items(meal_plan_id, meal_type, planned_recipe_id, entry_source, custom_title,
    custom_products, custom_calories, custom_protein_g, custom_fat_g, custom_carbs_g, planned_servings,
    portion_amount, portion_unit, total_recipe_weight_g, selected_weight_g, custom_recipe_data, custom_image_url)
  select v_plan_id, item.* from jsonb_to_recordset(p_items) as item(
    meal_type public.meal_type, planned_recipe_id uuid, entry_source text, custom_title text,
    custom_products jsonb, custom_calories numeric, custom_protein_g numeric, custom_fat_g numeric,
    custom_carbs_g numeric, planned_servings numeric, portion_amount numeric, portion_unit text,
    total_recipe_weight_g numeric, selected_weight_g numeric, custom_recipe_data jsonb, custom_image_url text);
  return v_plan_id;
end; $$;

grant execute on function public.replace_meal_plan_day(date, uuid, jsonb) to authenticated;
commit;
