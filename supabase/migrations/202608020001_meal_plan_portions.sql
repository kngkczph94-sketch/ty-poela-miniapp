begin;

alter table public.meal_plan_items
  add column if not exists portion_amount numeric(10, 2),
  add column if not exists portion_unit text;

update public.meal_plan_items
set portion_amount = planned_servings,
    portion_unit = 'serving'
where portion_amount is null or portion_unit is null;

alter table public.meal_plan_items
  alter column portion_amount set not null,
  alter column portion_unit set not null,
  add constraint meal_plan_items_portion_amount_check check (portion_amount > 0),
  add constraint meal_plan_items_portion_unit_check check (portion_unit in ('serving', 'g'));

commit;
