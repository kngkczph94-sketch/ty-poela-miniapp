import type { Recipe } from '../types/recipe';

type RecipeCardProps = {
  recipe: Recipe;
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <article className="rounded-3xl border border-orange-100 bg-white p-4 shadow-sm shadow-orange-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-orange-600">
              {recipe.mealType}
            </span>
            {recipe.isPremium && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-700">
                Premium
              </span>
            )}
          </div>
          <h3 className="text-lg font-black text-slate-950">{recipe.title}</h3>
          <p className="mt-1 text-sm leading-5 text-slate-500">{recipe.description}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl bg-orange-50 p-3 text-center">
        <div>
          <p className="text-sm font-black text-orange-600">{recipe.calories}</p>
          <p className="text-[11px] font-bold text-slate-400">ккал</p>
        </div>
        <div>
          <p className="text-sm font-black text-slate-800">{recipe.protein} г</p>
          <p className="text-[11px] font-bold text-slate-400">белки</p>
        </div>
        <div>
          <p className="text-sm font-black text-slate-800">{recipe.fat} г</p>
          <p className="text-[11px] font-bold text-slate-400">жиры</p>
        </div>
        <div>
          <p className="text-sm font-black text-slate-800">{recipe.carbs} г</p>
          <p className="text-[11px] font-bold text-slate-400">углеводы</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm font-bold text-slate-500">
        <span>⏱️ {recipe.cookingTime} мин</span>
        <span>🍽️ {recipe.servings} порц.</span>
      </div>
    </article>
  );
}
