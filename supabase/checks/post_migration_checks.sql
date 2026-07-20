-- Read-only integrity checks. Expected result is zero rows/count = 0 unless noted.

-- Duplicate legacy identifiers (repeat for imported catalog entities).
select legacy_id, count(*) from public.recipes group by legacy_id having count(*) > 1;
select legacy_id, count(*) from public.rations group by legacy_id having count(*) > 1;

-- Every published ration must contain exactly the four enum values.
select r.id, r.legacy_id, count(rm.id) as meal_count,
       count(distinct rm.meal_type) as distinct_meal_types
from public.rations r left join public.ration_meals rm on rm.ration_id = r.id
where r.is_published
group by r.id, r.legacy_id
having count(rm.id) <> 4 or count(distinct rm.meal_type) <> 4;

-- No orphaned junction rows (FKs enforce this; useful after staged imports).
select ri.id from public.recipe_ingredients ri
left join public.recipes r on r.id = ri.recipe_id
left join public.ingredients i on i.id = ri.ingredient_id
where r.id is null or i.id is null;

-- User timezone must be an actual PostgreSQL/IANA timezone name.
select u.id, u.timezone from public.users u
left join pg_timezone_names tz on tz.name = u.timezone
where tz.name is null;

-- Completion owner must own its optional plan item.
select c.id from public.meal_completions c
join public.meal_plan_items i on i.id = c.meal_plan_item_id
join public.meal_plans p on p.id = i.meal_plan_id
where c.user_id <> p.user_id;

-- One diagnostic row per ration: compare total per-serving energy with source data manifest.
select r.legacy_id,
       round(sum(rec.calories_per_serving * rm.servings), 2) as ration_calories,
       round(sum(rec.protein_g_per_serving * rm.servings), 2) as ration_protein_g,
       round(sum(rec.fat_g_per_serving * rm.servings), 2) as ration_fat_g,
       round(sum(rec.carbs_g_per_serving * rm.servings), 2) as ration_carbs_g
from public.rations r
join public.ration_meals rm on rm.ration_id = r.id
join public.recipes rec on rec.id = rm.recipe_id
group by r.id, r.legacy_id order by r.legacy_id;

-- RLS tests require separate sessions/JWTs and are intentionally documented, not faked here.
