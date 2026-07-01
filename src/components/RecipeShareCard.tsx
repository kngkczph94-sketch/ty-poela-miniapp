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
    <article className="relative overflow-hidden rounded-[2rem] bg-white text-[#30360E] shadow-2xl shadow-[#E2D4B9]/70">
      <div className="absolute -right-10 top-20 h-32 w-32 rounded-full bg-[#E2D4B9]/50 blur-2xl" />
      <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-[#E2D4B9]/70 blur-2xl" />

      <div className="relative min-h-48 bg-[#E2D4B9] p-5 text-[#30360E]">
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
            <div className="absolute bottom-8 right-10 h-20 w-20 rounded-full border border-[#92735C]/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-[#30360E]/35" />
        <div className="relative z-10 flex min-h-40 flex-col justify-between">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-[#30360E] shadow-lg shadow-[#30360E]/10">
              Ты поела
            </span>
            <span className="rounded-full bg-[#FAF7EF]/70 px-3 py-1 text-xs font-extrabold uppercase tracking-wide backdrop-blur">
              {mealTypeLabels[recipe.mealType]}
            </span>
          </div>
          <div>
            <h2 className="max-w-xs text-3xl font-black leading-tight tracking-tight drop-shadow-sm">{recipe.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-[#92735C]">{recipe.description}</p>
          </div>
        </div>
      </div>

      <div className="relative p-5">
        <div className="grid grid-cols-4 gap-2 rounded-3xl bg-[#E2D4B9] p-3 text-center">
          {macroItems.map((item) => (
            <div className="rounded-2xl bg-white/70 px-2 py-3" key={item.key}>
              <p className="text-lg font-black text-[#30360E]">
                {recipe[item.key]}
                {item.suffix}
              </p>
              <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#92735C]">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-3xl bg-[#30360E] p-4 text-white">
          <div>
            <p className="text-xs font-bold text-[#92735C]">готовится за</p>
            <p className="text-xl font-black">{recipe.cookingTime} минут</p>
          </div>
          <div className="rounded-2xl bg-[#FAF7EF]/30 px-3 py-2 text-right text-sm font-extrabold">
            🍽️ {mealTypeLabels[recipe.mealType]}
          </div>
        </div>

        <a
          className="mt-4 flex items-center justify-center rounded-2xl bg-[#686F12] px-4 py-3 text-center text-base font-black text-white shadow-lg shadow-[#E2D4B9] transition hover:bg-[#30360E]"
          href={deepLink}
        >
          Открыть рецепт в Telegram
        </a>
      </div>
    </article>
  );
}
