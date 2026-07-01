import { mealTypeLabels, type Recipe } from '../types/recipe';

type RecipeCardProps = {
  recipe: Recipe;
  hasActiveSubscription: boolean;
  onOpen: (recipe: Recipe) => void;
};

export function RecipeCard({ recipe, hasActiveSubscription, onOpen }: RecipeCardProps) {
  const isLocked = recipe.isPremium && !hasActiveSubscription;
  return (
    <article className={`relative overflow-hidden rounded-3xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${isLocked ? 'border-ghee bg-butter-soft/80 shadow-butter' : 'border-butter bg-white shadow-butter'}`}>
      <button
        aria-label={`Открыть рецепт ${recipe.title}`}
        className="block w-full text-left"
        onClick={() => onOpen(recipe)}
        type="button"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-butter-soft px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-olive-dark">
                {mealTypeLabels[recipe.mealType]}
              </span>
              {recipe.isPremium && (
                <span className="rounded-full bg-ghee px-3 py-1 text-xs font-extrabold text-olive-dark">
                  Premium
                </span>
              )}
              {isLocked && (
                <span className="rounded-full bg-warm-dark px-3 py-1 text-xs font-extrabold text-white">
                  🔒 Закрыто
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-warm-dark">{recipe.title}</h3>
            <p className="mt-1 text-sm leading-5 text-warm-dark/65">{recipe.description}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl bg-butter-soft p-3 text-center">
          <div>
            <p className="text-sm font-black text-olive-dark">{recipe.calories}</p>
            <p className="text-[11px] font-bold text-warm-dark/45">ккал</p>
          </div>
          <div>
            <p className="text-sm font-black text-warm-dark">{recipe.protein} г</p>
            <p className="text-[11px] font-bold text-warm-dark/45">белки</p>
          </div>
          <div>
            <p className="text-sm font-black text-warm-dark">{recipe.fat} г</p>
            <p className="text-[11px] font-bold text-warm-dark/45">жиры</p>
          </div>
          <div>
            <p className="text-sm font-black text-warm-dark">{recipe.carbs} г</p>
            <p className="text-[11px] font-bold text-warm-dark/45">углеводы</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm font-bold text-warm-dark/65">
          <span>⏱️ {recipe.cookingTime} мин</span>
          <span>🍽️ {recipe.servings} порц.</span>
        </div>
      </button>
      {isLocked && (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl bg-white/85 px-3 py-2 text-center text-xs font-black text-warm-dark backdrop-blur">
          Нажми, чтобы посмотреть preview и оформить доступ
        </div>
      )}
    </article>
  );
}
