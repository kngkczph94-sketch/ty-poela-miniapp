import { mealTypeLabels, type Recipe } from '../types/recipe';

type RecipeCardProps = {
  recipe: Recipe;
  hasActiveSubscription: boolean;
  onOpen: (recipe: Recipe) => void;
};

export function RecipeCard({ recipe, hasActiveSubscription, onOpen }: RecipeCardProps) {
  const isLocked = recipe.isPremium && !hasActiveSubscription;
  return (
    <article className={`relative overflow-hidden rounded-3xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${isLocked ? 'border-[#E9D7A5] bg-[#F4E8BE]/80 shadow-[#E9D7A5]' : 'border-[#E9D7A5] bg-white shadow-[#E9D7A5]'}`}>
      <button
        aria-label={`Открыть рецепт ${recipe.title}`}
        className="block w-full text-left"
        onClick={() => onOpen(recipe)}
        type="button"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#F4E8BE] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#5E6738]">
                {mealTypeLabels[recipe.mealType]}
              </span>
              {recipe.isPremium && (
                <span className="rounded-full bg-[#E9D7A5] px-3 py-1 text-xs font-extrabold text-[#5E6738]">
                  Premium
                </span>
              )}
              {isLocked && (
                <span className="rounded-full bg-[#4B4636] px-3 py-1 text-xs font-extrabold text-white">
                  🔒 Закрыто
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-[#4B4636]">{recipe.title}</h3>
            <p className="mt-1 text-sm leading-5 text-[#4B4636]/65">{recipe.description}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl bg-[#F4E8BE] p-3 text-center">
          <div>
            <p className="text-sm font-black text-[#5E6738]">{recipe.calories}</p>
            <p className="text-[11px] font-bold text-[#4B4636]/45">ккал</p>
          </div>
          <div>
            <p className="text-sm font-black text-[#4B4636]">{recipe.protein} г</p>
            <p className="text-[11px] font-bold text-[#4B4636]/45">белки</p>
          </div>
          <div>
            <p className="text-sm font-black text-[#4B4636]">{recipe.fat} г</p>
            <p className="text-[11px] font-bold text-[#4B4636]/45">жиры</p>
          </div>
          <div>
            <p className="text-sm font-black text-[#4B4636]">{recipe.carbs} г</p>
            <p className="text-[11px] font-bold text-[#4B4636]/45">углеводы</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm font-bold text-[#4B4636]/65">
          <span>⏱️ {recipe.cookingTime} мин</span>
          <span>🍽️ {recipe.servings} порц.</span>
        </div>
      </button>
      {isLocked && (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl bg-white/85 px-3 py-2 text-center text-xs font-black text-[#4B4636] backdrop-blur">
          Нажми, чтобы посмотреть preview и оформить доступ
        </div>
      )}
    </article>
  );
}
