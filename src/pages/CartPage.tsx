import { useMemo, useState } from 'react';
import { menuDays, menuMealSlots, type WeeklyMenu } from '../types/menu';
import type { Ingredient, IngredientCategory } from '../types/recipe';

const categoryLabels: Record<IngredientCategory, string> = {
  овощи: 'Овощи',
  фрукты: 'Фрукты',
  белок: 'Белок',
  молочные: 'Молочные',
  крупы: 'Крупы',
  бакалея: 'Бакалея',
  специи: 'Специи',
  прочее: 'Прочее',
};

const categoryOrder: IngredientCategory[] = ['овощи', 'фрукты', 'белок', 'молочные', 'крупы', 'бакалея', 'специи', 'прочее'];

type CartIngredient = Ingredient & {
  id: string;
};

type CartPageProps = {
  weeklyMenu: WeeklyMenu;
  onOpenRecipes: () => void;
};

const formatAmount = (amount: number) => Number.isInteger(amount) ? String(amount) : amount.toFixed(1).replace(/\.0$/, '');

const buildCartIngredients = (weeklyMenu: WeeklyMenu): CartIngredient[] => {
  const ingredientMap = new Map<string, CartIngredient>();

  menuDays.forEach((day) => {
    menuMealSlots.forEach((slot) => {
      const recipe = weeklyMenu[day][slot];

      recipe?.ingredients.forEach((ingredient) => {
        const normalizedName = ingredient.name.trim().toLowerCase();
        const normalizedUnit = ingredient.unit.trim().toLowerCase();
        const id = `${ingredient.category}|${normalizedName}|${normalizedUnit}`;
        const existingIngredient = ingredientMap.get(id);

        if (existingIngredient) {
          ingredientMap.set(id, {
            ...existingIngredient,
            amount: existingIngredient.amount + ingredient.amount,
          });
          return;
        }

        ingredientMap.set(id, { ...ingredient, id });
      });
    });
  });

  return Array.from(ingredientMap.values()).sort((first, second) => {
    const categoryDifference = categoryOrder.indexOf(first.category) - categoryOrder.indexOf(second.category);
    return categoryDifference || first.name.localeCompare(second.name, 'ru');
  });
};

const buildCopyText = (ingredients: CartIngredient[]) => {
  const lines = ['Корзина “Ты поела”', ''];

  categoryOrder.forEach((category) => {
    const categoryIngredients = ingredients.filter((ingredient) => ingredient.category === category);

    if (categoryIngredients.length === 0) {
      return;
    }

    lines.push(`${categoryLabels[category]}:`);
    categoryIngredients.forEach((ingredient) => {
      lines.push(`- ${ingredient.name[0].toUpperCase()}${ingredient.name.slice(1)} — ${formatAmount(ingredient.amount)} ${ingredient.unit}`);
    });
    lines.push('');
  });

  return lines.join('\n').trim();
};

export function CartPage({ weeklyMenu, onOpenRecipes }: CartPageProps) {
  const [checkedIngredientIds, setCheckedIngredientIds] = useState<string[]>([]);
  const [copyMessage, setCopyMessage] = useState('');
  const cartIngredients = useMemo(() => buildCartIngredients(weeklyMenu), [weeklyMenu]);

  const toggleIngredient = (id: string) => {
    setCheckedIngredientIds((currentIds) =>
      currentIds.includes(id) ? currentIds.filter((currentId) => currentId !== id) : [...currentIds, id],
    );
  };

  const handleCopyList = async () => {
    const text = buildCopyText(cartIngredients);

    if (!navigator.clipboard?.writeText) {
      setCopyMessage('Скопируй список вручную — clipboard недоступен');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage('Список скопирован');
    } catch {
      setCopyMessage('Не получилось скопировать автоматически');
    }
  };

  if (cartIngredients.length === 0) {
    return (
      <section className="flex flex-1 flex-col">
        <div className="rounded-[2rem] bg-gradient-to-br from-rose-400 via-orange-400 to-amber-300 p-6 text-white shadow-xl shadow-orange-200/70">
          <p className="text-sm font-bold uppercase tracking-wide text-white/80">5 этап</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Корзина продуктов</h1>
          <p className="mt-3 text-sm font-medium leading-6 text-white/90">Список покупок появится сам, когда ты добавишь рецепты в меню.</p>
        </div>

        <div className="mt-5 rounded-[2rem] bg-white p-6 text-center shadow-sm shadow-orange-100">
          <p className="text-5xl">🛒</p>
          <h2 className="mt-3 text-xl font-black text-slate-950">Сначала добавь рецепты в меню</h2>
          <p className="mt-2 text-sm font-semibold leading-5 text-slate-500">Выбери рецепты, а мы автоматически сложим продукты по категориям.</p>
          <button className="mt-5 rounded-2xl bg-orange-500 px-5 py-3 text-base font-black text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600" onClick={onOpenRecipes} type="button">
            Перейти к рецептам
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col">
      <div className="rounded-[2rem] bg-gradient-to-br from-rose-400 via-orange-400 to-amber-300 p-6 text-white shadow-xl shadow-orange-200/70">
        <p className="text-sm font-bold uppercase tracking-wide text-white/80">5 этап</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Корзина продуктов</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-white/90">Все ингредиенты из недельного меню уже собраны и объединены.</p>
        <button className="mt-5 rounded-2xl bg-white px-5 py-3 text-base font-black text-orange-600 shadow-lg shadow-orange-700/10 transition hover:-translate-y-0.5" onClick={handleCopyList} type="button">
          Скопировать список
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {categoryOrder.map((category) => {
          const categoryIngredients = cartIngredients.filter((ingredient) => ingredient.category === category);

          if (categoryIngredients.length === 0) {
            return null;
          }

          return (
            <article className="rounded-[2rem] bg-white p-4 shadow-sm shadow-orange-100" key={category}>
              <h2 className="text-xl font-black text-slate-950">{categoryLabels[category]}</h2>
              <div className="mt-3 space-y-2">
                {categoryIngredients.map((ingredient) => {
                  const isChecked = checkedIngredientIds.includes(ingredient.id);

                  return (
                    <label className={`flex items-center gap-3 rounded-3xl border p-3 transition ${isChecked ? 'border-slate-100 bg-slate-50 text-slate-400' : 'border-orange-50 bg-orange-50/50 text-slate-900'}`} key={ingredient.id}>
                      <input checked={isChecked} className="h-5 w-5 rounded border-orange-200 accent-orange-500" onChange={() => toggleIngredient(ingredient.id)} type="checkbox" />
                      <span className={`flex-1 text-sm font-extrabold ${isChecked ? 'line-through' : ''}`}>{ingredient.name}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${isChecked ? 'bg-white text-slate-400' : 'bg-white text-orange-600'}`}>{formatAmount(ingredient.amount)} {ingredient.unit}</span>
                    </label>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      {copyMessage && <div className="fixed inset-x-4 bottom-28 z-30 mx-auto max-w-sm rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white shadow-2xl">{copyMessage}</div>}
    </section>
  );
}
