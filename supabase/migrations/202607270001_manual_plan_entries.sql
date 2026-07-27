begin;

alter table public.meal_plan_items
  add column if not exists entry_source text not null default 'recipe',
  add column if not exists custom_title text,
  add column if not exists custom_products jsonb not null default '[]'::jsonb,
  add column if not exists custom_calories numeric(10, 2) not null default 0,
  add column if not exists custom_protein_g numeric(10, 2) not null default 0,
  add column if not exists custom_fat_g numeric(10, 2) not null default 0,
  add column if not exists custom_carbs_g numeric(10, 2) not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'meal_plan_items_entry_source_check'
      and conrelid = 'public.meal_plan_items'::regclass
  ) then
    alter table public.meal_plan_items
      add constraint meal_plan_items_entry_source_check
      check (entry_source in ('recipe', 'manual', 'ai'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'meal_plan_items_custom_products_array_check'
      and conrelid = 'public.meal_plan_items'::regclass
  ) then
    alter table public.meal_plan_items
      add constraint meal_plan_items_custom_products_array_check
      check (jsonb_typeof(custom_products) = 'array');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'meal_plan_items_content_check'
      and conrelid = 'public.meal_plan_items'::regclass
  ) then
    alter table public.meal_plan_items
      add constraint meal_plan_items_content_check
      check (
        (entry_source = 'recipe' and planned_recipe_id is not null)
        or (
          entry_source in ('manual', 'ai')
          and planned_recipe_id is null
          and nullif(trim(custom_title), '') is not null
        )
      );
  end if;
end
$$;

commit;
