-- Record the catalog grants that were previously applied manually.
grant select, insert, update, delete
on table
  public.recipes,
  public.ingredients,
  public.recipe_ingredients,
  public.rations,
  public.ration_meals
to service_role;
