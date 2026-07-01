import { mealTypeLabels, type Recipe } from '../types/recipe';

export const createRecipeDeepLink = (recipeId: string) =>
  `https://t.me/typoela_bot/app?startapp=recipe_${encodeURIComponent(recipeId)}`;

type RecipeShareCardProps = {
  recipe: Recipe;
  deepLink: string;
};

const macroItems = [
  { key: 'calories', label: 'ккал', suffix: '' },
  { key: 'protein', label: 'белки', suffix: ' г' },
  { key: 'fat', label: 'жиры', suffix: ' г' },
  { key: 'carbs', label: 'углеводы', suffix: ' г' },
] as const;

export function RecipeShareCard({ recipe, deepLink }: RecipeShareCardProps) {
  return (
    <article className="relative overflow-hidden rounded-[2rem] bg-white text-[#4B4636] shadow-2xl shadow-[#E9D7A5]/70">
      <div className="absolute -right-10 top-20 h-32 w-32 rounded-full bg-[#E9D7A5]/50 blur-2xl" />
      <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-[#F4E8BE]/70 blur-2xl" />

      <div className="relative min-h-48 bg-gradient-to-br from-[#7A8450] via-[#5E6738] to-[#F4E8BE] p-5 text-white">
        {recipe.imageUrl ? (
          <img
            alt={recipe.title}
            className="absolute inset-0 h-full w-full object-cover"
            src={recipe.imageUrl}
          />
        ) : (
          <div className="absolute inset-0 opacity-25">
            <div className="absolute right-6 top-5 text-7xl">♡</div>
            <div className="absolute bottom-5 left-5 text-6xl">✦</div>
            <div className="absolute bottom-8 right-10 h-20 w-20 rounded-full border border-white/70" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#4B4636]/55 via-[#4B4636]/10 to-transparent" />
        <div className="relative z-10 flex min-h-40 flex-col justify-between">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-[#5E6738] shadow-lg shadow-[#5E6738]/10">
              Ты поела
            </span>
            <span className="rounded-full bg-white/25 px-3 py-1 text-xs font-extrabold uppercase tracking-wide backdrop-blur">
              {mealTypeLabels[recipe.mealType]}
            </span>
          </div>
          <div>
            <h2 className="max-w-xs text-3xl font-black leading-tight tracking-tight drop-shadow-sm">{recipe.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-white/90">{recipe.description}</p>
          </div>
        </div>
      </div>

      <div className="relative p-5">
        <div className="grid grid-cols-4 gap-2 rounded-3xl bg-[#F4E8BE] p-3 text-center">
          {macroItems.map((item) => (
            <div className="rounded-2xl bg-white/70 px-2 py-3" key={item.key}>
              <p className="text-lg font-black text-[#4B4636]">
                {recipe[item.key]}
                {item.suffix}
              </p>
              <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#4B4636]/45">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-3xl bg-[#4B4636] p-4 text-white">
          <div>
            <p className="text-xs font-bold text-white/55">готовится за</p>
            <p className="text-xl font-black">{recipe.cookingTime} минут</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-right text-sm font-extrabold">
            🍽️ {mealTypeLabels[recipe.mealType]}
          </div>
        </div>

        <a
          className="mt-4 flex items-center justify-center rounded-2xl bg-[#7A8450] px-4 py-3 text-center text-base font-black text-white shadow-lg shadow-[#E9D7A5] transition hover:bg-[#5E6738]"
          href={deepLink}
        >
          Открыть рецепт в Telegram
        </a>
      </div>
    </article>
  );
}
