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
      const recipe = weeklyMenu[day].meals[slot];

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
        <div className="rounded-[2rem] border border-[#D99663]/35 bg-gradient-to-br from-[#F3E2BF] via-[#D99663]/35 to-[#FBF6EC] p-6 text-[#37410F] shadow-xl shadow-[#D99663]/20">
          <p className="text-sm font-bold uppercase tracking-wide text-[#8B725F]">5 этап</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Корзина продуктов</h1>
          <p className="mt-3 text-sm font-medium leading-6 text-[#8B725F]">Список покупок появится сам, когда ты добавишь рационы или рецепты в План.</p>
        </div>

        <div className="mt-5 rounded-[2rem] border border-[#D99663]/25 bg-[#FFFDF8] p-6 text-center shadow-sm shadow-[#F3E2BF]/70">
          <p className="text-5xl">🛒</p>
          <h2 className="mt-3 text-xl font-black text-[#37410F]">Сначала добавь рацион в План</h2>
          <p className="mt-2 text-sm font-semibold leading-5 text-[#8B725F]">Выбери рацион дня, а мы автоматически сложим продукты по категориям.</p>
          <button className="mt-5 rounded-2xl bg-[#6E7E1F] px-5 py-3 text-base font-black text-white shadow-lg shadow-[#F3E2BF]/70 transition hover:bg-[#37410F]" onClick={onOpenRecipes} type="button">
            Выбрать рацион
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col">
      <div className="rounded-[2rem] border border-[#D99663]/35 bg-gradient-to-br from-[#F3E2BF] via-[#D99663]/35 to-[#FBF6EC] p-6 text-[#37410F] shadow-xl shadow-[#D99663]/20">
        <p className="text-sm font-bold uppercase tracking-wide text-[#8B725F]">5 этап</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Корзина продуктов</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-[#8B725F]">Все ингредиенты из Плана уже собраны и объединены.</p>
        <button className="mt-5 rounded-2xl bg-[#6E7E1F] px-5 py-3 text-base font-black text-white shadow-lg shadow-[#F3E2BF]/70 transition hover:bg-[#37410F]" onClick={handleCopyList} type="button">
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
            <article className="rounded-[2rem] border border-[#D99663]/25 bg-[#FFFDF8] p-4 shadow-sm shadow-[#F3E2BF]/70" key={category}>
              <h2 className="text-xl font-black text-[#37410F]">{categoryLabels[category]}</h2>
              <div className="mt-3 space-y-2">
                {categoryIngredients.map((ingredient) => {
                  const isChecked = checkedIngredientIds.includes(ingredient.id);

                  return (
                    <label className={`flex items-center gap-3 rounded-3xl border p-3 transition ${isChecked ? 'border-[#FBF6EC] bg-[#FBF6EC] text-[#8B725F]' : 'border-[#D99663]/30 bg-[#F3E2BF]/60 text-[#37410F]'}`} key={ingredient.id}>
                      <input checked={isChecked} className="h-5 w-5 rounded border-[#8B725F]/35 accent-[#6E7E1F]" onChange={() => toggleIngredient(ingredient.id)} type="checkbox" />
                      <span className={`flex-1 text-sm font-extrabold ${isChecked ? 'line-through' : ''}`}>{ingredient.name}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${isChecked ? 'bg-white text-[#8B725F]' : 'bg-white text-[#37410F]'}`}>{formatAmount(ingredient.amount)} {ingredient.unit}</span>
                    </label>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      {copyMessage && <div className="fixed inset-x-4 bottom-28 z-30 mx-auto max-w-sm rounded-2xl bg-[#37410F] px-4 py-3 text-center text-sm font-bold text-white shadow-2xl">{copyMessage}</div>}
    </section>
  );
}
