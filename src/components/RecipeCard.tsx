import { mealTypeLabels, type Recipe } from '../types/recipe';

type RecipeCardProps = {
  recipe: Recipe;
  hasActiveSubscription: boolean;
  onOpen: (recipe: Recipe) => void;
};

export function RecipeCard({ recipe, hasActiveSubscription, onOpen }: RecipeCardProps) {
  const isLocked = recipe.isPremium && !hasActiveSubscription;
  return (
    <article className={`relative overflow-hidden rounded-3xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${isLocked ? 'border-[#D99663]/30 bg-[#F3E2BF]/80 shadow-[#F3E2BF]/70' : 'border-[#F3E2BF] bg-[#FFFDF8] shadow-[#F3E2BF]/70'}`}>
      <button
        aria-label={`Открыть рецепт ${recipe.title}`}
        className="block w-full text-left"
        onClick={() => onOpen(recipe)}
        type="button"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#6E7E1F]/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#6E7E1F]">
                {mealTypeLabels[recipe.mealType]}
              </span>
              {recipe.isPremium && (
                <span className="rounded-full bg-[#D99663]/15 px-3 py-1 text-xs font-extrabold text-[#D99663]">
                  Premium
                </span>
              )}
              {isLocked && (
                <span className="rounded-full bg-[#37410F] px-3 py-1 text-xs font-extrabold text-white">
                  🔒 Закрыто
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-[#37410F]">{recipe.title}</h3>
            <p className="mt-1 text-sm leading-5 text-[#8B725F]">{recipe.description}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl bg-[#F3E2BF] p-3 text-center">
          <div>
            <p className="text-sm font-black text-[#37410F]">{recipe.calories}</p>
            <p className="text-[11px] font-bold text-[#8B725F]">ккал</p>
          </div>
          <div>
            <p className="text-sm font-black text-[#37410F]">{recipe.protein} г</p>
            <p className="text-[11px] font-bold text-[#8B725F]">белки</p>
          </div>
          <div>
            <p className="text-sm font-black text-[#37410F]">{recipe.fat} г</p>
            <p className="text-[11px] font-bold text-[#8B725F]">жиры</p>
          </div>
          <div>
            <p className="text-sm font-black text-[#37410F]">{recipe.carbs} г</p>
            <p className="text-[11px] font-bold text-[#8B725F]">углеводы</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm font-bold text-[#8B725F]">
          <span>⏱️ {recipe.cookingTime} мин</span>
          <span>🍽️ {recipe.servings} порц.</span>
        </div>
      </button>
      {isLocked && (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl bg-white/85 px-3 py-2 text-center text-xs font-black text-[#37410F] backdrop-blur">
          Нажми, чтобы посмотреть preview и оформить доступ
        </div>
      )}
    </article>
  );
}
