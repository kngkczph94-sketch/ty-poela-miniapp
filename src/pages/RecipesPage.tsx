import { useEffect, useMemo, useState } from 'react';
import { RecipeCard } from '../components/RecipeCard';
import { recipes } from '../data/recipes';
import { mealTypeLabels, type MealType, type Recipe } from '../types/recipe';
import { createRecipeShareText, recipeCopiedMessage, shareRecipe } from '../utils/shareRecipe';

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

type ActiveMealType = MealType | 'все';

type RecipesPageProps = {
  hasActiveSubscription: boolean;
  onOpenAccess: () => void;
  onOpenRecipe: (recipe: Recipe) => void;
};

export function RecipesPage({ hasActiveSubscription, onOpenAccess, onOpenRecipe }: RecipesPageProps) {
  const [search, setSearch] = useState('');
  const [activeMealType, setActiveMealType] = useState<ActiveMealType>('все');
  const [toastMessage, setToastMessage] = useState('');
  const [manualShareText, setManualShareText] = useState('');

  const filteredRecipes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return recipes.filter((recipe) => {
      const matchesTitle = recipe.title.toLowerCase().includes(normalizedSearch);
      const matchesMealType = activeMealType === 'все' || recipe.mealType === activeMealType;

      return matchesTitle && matchesMealType;
    });
  }, [activeMealType, search]);

  useEffect(() => {
    if (!toastMessage) return;

    const timer = window.setTimeout(() => setToastMessage(''), 2500);

    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const resetFilters = () => {
    setSearch('');
    setActiveMealType('все');
  };

  const handleShareRecipe = async (recipe: Recipe) => {
    try {
      const result = await shareRecipe(recipe);

      if (result.status === 'copied') {
        setToastMessage(recipeCopiedMessage);
      }

      if (result.status === 'manual') {
        setManualShareText(result.shareText);
      }
    } catch {
      setManualShareText(createRecipeShareText(recipe));
    }
  };

  return (
    <section className="flex flex-1 flex-col">
      <div className="rounded-[2rem] bg-[#F3E2BF] p-6 text-[#37410F] shadow-xl shadow-[#F3E2BF]/70">
        <p className="text-sm font-bold uppercase tracking-wide text-[#8B725F]">Каталог</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Рецепты</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-[#8B725F]">
          20 идей с КБЖУ: блюда можно добавлять в План и использовать для замен в рационах.
        </p>
      </div>

      <div className="sticky top-0 z-10 -mx-4 mt-5 bg-[#FFFDF8] px-4 pb-3 pt-1">
        <label className="block">
          <span className="sr-only">Поиск по названию</span>
          <input
            className="w-full rounded-2xl border border-[#F3E2BF] bg-[#FFFDF8] px-4 py-3 text-base font-semibold text-[#37410F] shadow-sm outline-none transition placeholder:text-[#8B725F] focus:border-[#6E7E1F] focus:ring-4 focus:ring-[#F3E2BF]"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Найти рецепт"
            type="search"
            value={search}
          />
        </label>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {(['все', ...mealTypes] as ActiveMealType[]).map((mealType) => (
            <button
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-extrabold transition ${
                activeMealType === mealType
                  ? 'bg-[#6E7E1F] text-white shadow-lg shadow-[#F3E2BF]/70'
                  : 'bg-white text-[#8B725F] shadow-sm shadow-[#F3E2BF]/70 hover:text-[#37410F]'
              }`}
              key={mealType === 'все' ? 'все' : mealTypeLabels[mealType]}
              onClick={() => setActiveMealType(mealType)}
              type="button"
            >
              {mealType === 'все' ? 'все' : mealTypeLabels[mealType]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <h2 className="text-xl font-black text-[#37410F]">Найдено: {filteredRecipes.length}</h2>
        <button className="text-sm font-bold text-[#37410F]" onClick={onOpenAccess} type="button">Доступ</button>
      </div>

      <div className="mt-3 space-y-3">
        {filteredRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} hasActiveSubscription={hasActiveSubscription} recipe={recipe} onOpen={onOpenRecipe} onShare={handleShareRecipe} />
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="mt-8 rounded-3xl bg-[#FFFDF8] p-6 text-center shadow-sm shadow-[#F3E2BF]/70">
          <p className="text-4xl">🔎</p>
          <h3 className="mt-3 text-lg font-black text-[#37410F]">По такому фильтру рецептов пока нет</h3>
          <p className="mt-1 text-sm font-semibold leading-5 text-[#8B725F]">Сбросим фильтры и найдём что-то спокойное. Меню без Excel — это сюда.</p>
          <button className="mt-5 rounded-2xl bg-[#6E7E1F] px-5 py-3 text-base font-black text-white shadow-lg shadow-[#F3E2BF]/70 transition hover:bg-[#37410F]" onClick={resetFilters} type="button">
            Сбросить фильтры
          </button>
        </div>
      )}

      {manualShareText && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#37410F]/50 px-4 pb-4 pt-10 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-[2rem] bg-[#FFFDF8] p-4 shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6E7E1F]">Поделиться</p>
                <h2 className="text-xl font-black text-[#37410F]">Скопируй рецепт вручную</h2>
              </div>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FBF6EC] text-lg font-black text-[#8B725F] transition hover:bg-[#F3E2BF]" onClick={() => setManualShareText('')} type="button">×</button>
            </div>
            <pre className="whitespace-pre-wrap rounded-2xl border border-[#8B725F]/30 bg-white p-4 text-sm font-semibold leading-6 text-[#37410F]">{manualShareText}</pre>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed inset-x-4 bottom-28 z-30 mx-auto max-w-sm rounded-2xl bg-[#37410F] px-4 py-3 text-center text-sm font-bold text-white shadow-2xl">
          {toastMessage}
        </div>
      )}
    </section>
  );
}
