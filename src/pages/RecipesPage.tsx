import { useMemo, useState } from 'react';
import { RecipeCard } from '../components/RecipeCard';
import { recipes } from '../data/recipes';
import { mealTypeLabels, type MealType, type Recipe } from '../types/recipe';

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

  const filteredRecipes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return recipes.filter((recipe) => {
      const matchesTitle = recipe.title.toLowerCase().includes(normalizedSearch);
      const matchesMealType = activeMealType === 'все' || recipe.mealType === activeMealType;

      return matchesTitle && matchesMealType;
    });
  }, [activeMealType, search]);

  const resetFilters = () => {
    setSearch('');
    setActiveMealType('все');
  };

  return (
    <section className="flex flex-1 flex-col">
      <div className="rounded-[2rem] bg-gradient-to-br from-[#7A8450] to-[#F4E8BE] p-6 text-white shadow-xl shadow-[#E9D7A5]/70">
        <p className="text-sm font-bold uppercase tracking-wide text-white/80">Каталог</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Рецепты</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-white/90">
          20 идей с КБЖУ: блюда можно добавлять в План и использовать для замен в рационах.
        </p>
      </div>

      <div className="sticky top-0 z-10 -mx-4 mt-5 bg-[#F8F4EA] px-4 pb-3 pt-1">
        <label className="block">
          <span className="sr-only">Поиск по названию</span>
          <input
            className="w-full rounded-2xl border border-[#E9D7A5] bg-white px-4 py-3 text-base font-semibold text-[#4B4636] shadow-sm outline-none transition placeholder:text-[#4B4636]/45 focus:border-[#E9D7A5] focus:ring-4 focus:ring-[#F4E8BE]"
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
                  ? 'bg-[#7A8450] text-white shadow-lg shadow-[#E9D7A5]'
                  : 'bg-white text-[#4B4636]/65 shadow-sm shadow-[#E9D7A5] hover:text-[#5E6738]'
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
        <h2 className="text-xl font-black text-[#4B4636]">Найдено: {filteredRecipes.length}</h2>
        <button className="text-sm font-bold text-[#5E6738]" onClick={onOpenAccess} type="button">Доступ</button>
      </div>

      <div className="mt-3 space-y-3">
        {filteredRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} hasActiveSubscription={hasActiveSubscription} recipe={recipe} onOpen={onOpenRecipe} />
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="mt-8 rounded-3xl bg-white p-6 text-center shadow-sm shadow-[#E9D7A5]">
          <p className="text-4xl">🔎</p>
          <h3 className="mt-3 text-lg font-black text-[#4B4636]">По такому фильтру рецептов пока нет</h3>
          <p className="mt-1 text-sm font-semibold leading-5 text-[#4B4636]/65">Сбросим фильтры и найдём что-то спокойное. Меню без Excel — это сюда.</p>
          <button className="mt-5 rounded-2xl bg-[#7A8450] px-5 py-3 text-base font-black text-white shadow-lg shadow-[#E9D7A5] transition hover:bg-[#5E6738]" onClick={resetFilters} type="button">
            Сбросить фильтры
          </button>
        </div>
      )}
    </section>
  );
}
