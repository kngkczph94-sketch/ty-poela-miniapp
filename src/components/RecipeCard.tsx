import type { Recipe } from '../types/recipe';

type RecipeCardProps = {
  recipe: Recipe;
  hasActiveSubscription: boolean;
  onOpen: (recipe: Recipe) => void;
};

export function RecipeCard({ recipe, hasActiveSubscription, onOpen }: RecipeCardProps) {
  const isLocked = recipe.isPremium && !hasActiveSubscription;
  return (
    <article className={`relative overflow-hidden rounded-3xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${isLocked ? 'border-amber-200 bg-amber-50/80 shadow-amber-100' : 'border-orange-100 bg-white shadow-orange-100'}`}>
      <button
        aria-label={`Открыть рецепт ${recipe.title}`}
        className="block w-full text-left"
        onClick={() => onOpen(recipe)}
        type="button"
      >
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
              {isLocked && (
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-extrabold text-white">
                  🔒 Закрыто
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
      </button>
      {isLocked && (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl bg-white/85 px-3 py-2 text-center text-xs font-black text-slate-700 backdrop-blur">
          Нажми, чтобы посмотреть preview и оформить доступ
        </div>
      )}
    </article>
  );
}
