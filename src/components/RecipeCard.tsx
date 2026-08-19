import { FoodPhotoPlaceholder, getRecipeFoodVariant } from './FoodPhotoPlaceholder';
import { mealTypeLabels, type Recipe } from '../types/recipe';

type RecipeCardProps = {
  recipe: Recipe;
  hasActiveSubscription: boolean;
  onOpen: (recipe: Recipe) => void;
  onShare: (recipe: Recipe) => void;
};

export function RecipeCard({ recipe, hasActiveSubscription, onOpen, onShare }: RecipeCardProps) {
  const isLocked = recipe.isPremium && !hasActiveSubscription;
  return (
    <article className={`relative overflow-hidden rounded-[2rem] border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl ${isLocked ? 'border-[#8FD14C]/30 bg-[#14170F]/80 shadow-[#14170F]/70' : 'border-[#8FD14C]/20 bg-[#14170F] shadow-[#14170F]/80'}`}>
      <button
        aria-label={`Открыть рецепт ${recipe.title}`}
        className="block w-full text-left"
        onClick={() => onOpen(recipe)}
        type="button"
      >
        <FoodPhotoPlaceholder alt={recipe.title} className="mb-5 min-h-[12rem]" imageUrl={recipe.imageUrl} variant={getRecipeFoodVariant(recipe.id)} />
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#5C8A1E]/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#5C8A1E]">
                {mealTypeLabels[recipe.mealType]}
              </span>
              {recipe.isPremium && (
                <span className="rounded-full bg-[#8FD14C]/15 px-3 py-1 text-xs font-extrabold text-[#8FD14C]">
                  Premium
                </span>
              )}
              {isLocked && (
                <span className="rounded-full bg-[#37410F] px-3 py-1 text-xs font-extrabold text-white">
                  🔒 Закрыто
                </span>
              )}
            </div>
            <h3 className="text-xl font-black leading-tight text-[#F4F7EE]">{recipe.title}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#A9B39C]">{recipe.description}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2 rounded-3xl bg-[#14170F]/70 p-4 text-center">
          <div>
            <p className="text-sm font-black text-[#F4F7EE]">{recipe.calories}</p>
            <p className="text-[11px] font-bold text-[#A9B39C]">ккал</p>
          </div>
          <div>
            <p className="text-sm font-black text-[#F4F7EE]">{recipe.protein} г</p>
            <p className="text-[11px] font-bold text-[#A9B39C]">белки</p>
          </div>
          <div>
            <p className="text-sm font-black text-[#F4F7EE]">{recipe.fat} г</p>
            <p className="text-[11px] font-bold text-[#A9B39C]">жиры</p>
          </div>
          <div>
            <p className="text-sm font-black text-[#F4F7EE]">{recipe.carbs} г</p>
            <p className="text-[11px] font-bold text-[#A9B39C]">углеводы</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#14170F] px-1 text-sm font-bold text-[#A9B39C]">
          <span>⏱️ {recipe.cookingTime} мин</span>
          <span>🍽️ {recipe.servings} порц.</span>
        </div>
      </button>
      <button
        className="mt-4 rounded-2xl border border-[#A9B39C]/30 bg-[#14170F] px-4 py-2.5 text-sm font-black text-[#F4F7EE] shadow-sm shadow-[#14170F]/60 transition hover:bg-[#0A0C08]"
        onClick={() => onShare(recipe)}
        type="button"
      >
        Поделиться
      </button>
      {isLocked && (
        <div className="pointer-events-none absolute inset-x-4 bottom-16 rounded-2xl bg-[#14170F]/85 px-3 py-2 text-center text-xs font-black text-[#F4F7EE] backdrop-blur">
          Нажми, чтобы посмотреть preview и оформить доступ
        </div>
      )}
    </article>
  );
}
