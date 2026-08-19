import { useState } from 'react';
import { BackButton } from '../components/BackButton';
import { ManualMealModal } from '../components/ManualMealModal';
import { FoodPhotoPlaceholder } from '../components/FoodPhotoPlaceholder';
import { calculateMealsNutrition } from '../types/ration';
import { menuDays, menuMealSlots, menuSlotLabels, type MenuDay, type MenuMealSlot, type WeeklyMenu } from '../types/menu';
import type { Meal, PlanProduct } from '../types/recipe';

const nutritionItems = [
  { key: 'calories', label: 'ккал', suffix: '' },
  { key: 'protein', label: 'белки', suffix: ' г' },
  { key: 'fat', label: 'жиры', suffix: ' г' },
  { key: 'carbs', label: 'углеводы', suffix: ' г' },
] as const;

function DaySummary({ meals }: { meals: WeeklyMenu[MenuDay]['meals'] }) {
  const totals = calculateMealsNutrition(meals);
  const hasMeals = menuMealSlots.some((slot) => Boolean(meals[slot]));

  return <section className="mt-4 overflow-hidden rounded-3xl border border-[#8FD14C]/30 bg-[#14170F]" aria-label="Итог дня">
    <div className="bg-[#37410F] px-4 py-4 text-white">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F4F7EE]/65">Итог дня</p>
      {hasMeals ? <div className="mt-3 grid grid-cols-4 gap-2">
        {nutritionItems.map(({ key, label, suffix }) => <div key={key}>
          <p className="text-base font-black sm:text-lg">{totals[key]}{suffix}</p>
          <p className="mt-0.5 text-[10px] font-bold text-[#F4F7EE]/65 sm:text-xs">{label}</p>
        </div>)}
      </div> : <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#14170F]/10 p-3">
        <span className="text-2xl" aria-hidden="true">🍽️</span>
        <div><p className="text-sm font-black">За этот день пока ничего не внесено</p><p className="mt-0.5 text-xs font-semibold text-[#F4F7EE]/65">Добавьте продукты или блюдо — итог появится здесь.</p></div>
      </div>}
    </div>
    {hasMeals && <div className="divide-y divide-[#8FD14C]/20 px-4">
      {menuMealSlots.map((slot) => {
        const meal = meals[slot];
        return <div className="flex items-center justify-between gap-3 py-3" key={slot}>
          <div className="min-w-0"><p className="text-sm font-black text-[#F4F7EE]">{menuSlotLabels[slot]}</p><p className="truncate text-[11px] font-semibold text-[#A9B39C]">{meal?.title ?? 'Не добавлено'}</p></div>
          {meal ? <p className="shrink-0 text-right text-xs font-extrabold text-[#F4F7EE]">{meal.calories} ккал<br /><span className="text-[10px] text-[#5C8A1E]">Б {meal.protein} · Ж {meal.fat} · У {meal.carbs}</span></p> : <span className="shrink-0 text-xs font-bold text-[#8A9482]">—</span>}
        </div>;
      })}
    </div>}
  </section>;
}

type MenuPageProps = {
  weeklyMenu: WeeklyMenu;
  onBack: () => void;
  onOpenCart: () => void;
  onOpenRations: () => void;
  onOpenRecipe: (recipe: Meal) => void;
  onRemoveRecipe: (day: MenuDay, slot: MenuMealSlot) => void;
  onUpdateRecipeQuantity: (day: MenuDay, slot: MenuMealSlot, amount: number) => Promise<void>;
  onAddManualMeal: (day: MenuDay, slot: MenuMealSlot, products: PlanProduct[]) => Promise<void>;
  onAddAiMeal: (day: MenuDay, slot: MenuMealSlot) => void;
};

function formatAmount(value: number) {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10);
}

function QuantityEditor({ meal, onSave }: { meal: Meal; onSave: (amount: number) => Promise<void> }) {
  const isWeighted = Boolean(meal.totalWeightGrams);
  const totalAmount = isWeighted ? meal.totalWeightGrams! : meal.servings;
  const selectedAmount = isWeighted ? meal.selectedWeightGrams ?? totalAmount : meal.selectedServings ?? meal.plannedServings ?? totalAmount;
  const unitLabel = isWeighted ? 'г' : 'порций';
  const currentLabel = isWeighted
    ? `${formatAmount(selectedAmount)} г из ${formatAmount(totalAmount)} г`
    : `${formatAmount(selectedAmount)} из ${formatAmount(totalAmount)} порций`;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(formatAmount(selectedAmount));
  const [error, setError] = useState('');
  const save = async () => {
    if (!value.trim()) return setError(isWeighted ? 'Введите положительное количество в граммах.' : 'Введите положительное количество порций.');
    const amount = Number(value.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) return setError(isWeighted ? 'Введите положительное количество в граммах.' : 'Введите положительное количество порций.');
    const normalized = Math.round(amount * 10) / 10;
    setValue(formatAmount(normalized));
    await onSave(normalized);
    setEditing(false);
  };
  return editing ? <div className="mt-3 rounded-2xl bg-[#14170F] p-3">
    <label className="text-xs font-black text-[#F4F7EE]">{isWeighted ? 'Количество, г' : 'Количество порций'}<input aria-label={isWeighted ? 'Количество блюда в граммах' : 'Количество порций блюда'} className="mt-2 w-full rounded-xl border border-[#A9B39C]/35 px-3 py-2" inputMode="decimal" onChange={(event) => { setValue(event.target.value.replace(/[^\d.,]/g, '')); setError(''); }} placeholder={unitLabel} type="text" value={value} /></label>
    {error && <p className="mt-1 text-xs font-bold text-[#E7B24A]">{error}</p>}
    <div className="mt-2 flex gap-2"><button className="rounded-full bg-[#5C8A1E] px-3 py-2 text-xs font-black text-white" onClick={() => void save()} type="button">Сохранить</button><button className="rounded-full px-3 py-2 text-xs font-black" onClick={() => { setValue(formatAmount(selectedAmount)); setEditing(false); setError(''); }} type="button">Отмена</button></div>
  </div> : <button className="mt-3 rounded-full bg-[#14170F] px-3 py-2 text-xs font-black text-[#F4F7EE] shadow-sm" onClick={() => setEditing(true)} type="button">Изменить количество · {currentLabel}</button>;
}

export function MenuPage({ weeklyMenu, onBack, onOpenCart, onOpenRations, onOpenRecipe, onRemoveRecipe, onUpdateRecipeQuantity, onAddManualMeal, onAddAiMeal }: MenuPageProps) {
  const [manualTarget, setManualTarget] = useState<{ day: MenuDay; slot: MenuMealSlot } | null>(null);
  const hasMealsInPlan = menuDays.some((day) => menuMealSlots.some((slot) => Boolean(weeklyMenu[day].meals[slot])));

  return <section className="flex flex-1 flex-col">
    <BackButton onClick={onBack} />
    <div className="rounded-[2rem] border border-[#8FD14C]/35 bg-gradient-to-br from-[#14170F] via-[#8FD14C]/35 to-[#0A0C08] p-6 text-[#F4F7EE] shadow-xl shadow-[#8FD14C]/20">
      <p className="text-sm font-bold uppercase tracking-wide text-[#A9B39C]">План питания</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">План питания</h1>
      <p className="mt-3 text-sm font-medium leading-6 text-[#A9B39C]">Добавь рацион дня на 1–3 дня или выбранные дни недели — корзина соберётся сама.</p>
      <button className="mt-5 rounded-2xl bg-[#5C8A1E] px-5 py-3 text-base font-black text-white shadow-lg shadow-[#14170F]/70 transition hover:bg-[#37410F]" onClick={onOpenCart} type="button">Смотреть корзину</button>
    </div>
    {!hasMealsInPlan && <div className="mt-5 rounded-[2rem] border border-[#8FD14C]/25 bg-[#14170F] p-6 text-center shadow-sm shadow-[#14170F]/70"><p className="text-5xl">🍽️</p><h2 className="mt-3 text-xl font-black text-[#F4F7EE]">Пока пусто. Добавь рацион дня — и план соберётся сам.</h2><button className="mt-5 rounded-2xl bg-[#5C8A1E] px-5 py-3 text-base font-black text-white shadow-lg shadow-[#14170F]/70" onClick={onOpenRations} type="button">Выбрать рацион</button></div>}
    <div className="mt-5 space-y-4">{menuDays.map((day) => {
      const planDay = weeklyMenu[day];
      const isEmpty = menuMealSlots.every((slot) => !planDay.meals[slot]);
      return <article className="rounded-[2rem] border border-[#8FD14C]/25 bg-[#14170F] p-4 shadow-sm shadow-[#14170F]/70" key={day}><div><h2 className="text-xl font-black text-[#F4F7EE]">{day}</h2><p className="mt-1 text-xs font-bold text-[#A9B39C]">{planDay.rationNumber ? `Добавлен Рацион №${planDay.rationNumber}` : 'Завтрак · Обед · Ужин · Перекус'}</p></div>
      <DaySummary meals={planDay.meals} />
      {isEmpty ? <div className="mt-3 rounded-3xl bg-[#14170F]/65 p-4 text-center"><p className="text-sm font-semibold text-[#A9B39C]">Пока пусто. Добавь рацион дня — и план соберётся сам.</p><div className="mt-3 flex flex-col gap-2"><button className="rounded-2xl bg-[#5C8A1E] px-4 py-3 text-sm font-black text-white" onClick={onOpenRations} type="button">Выбрать рацион</button><div className="grid grid-cols-2 gap-2">{menuMealSlots.map((slot) => <button className="rounded-2xl border border-[#5C8A1E] bg-[#14170F] px-3 py-3 text-xs font-black text-[#5C8A1E]" key={slot} onClick={() => setManualTarget({ day, slot })} type="button">+ {menuSlotLabels[slot]}</button>)}</div><button className="rounded-2xl bg-[#37410F] px-4 py-3 text-sm font-black text-white" onClick={() => onAddAiMeal(day, 'breakfast')} type="button">✨ Подобрать блюдо с ИИ</button></div></div> : <div className="mt-3 space-y-2">{menuMealSlots.map((slot) => { const meal = planDay.meals[slot]; return <div className="rounded-3xl border border-[#8FD14C]/30 bg-[#14170F]/60 p-3" key={slot}><p className="text-xs font-black uppercase tracking-wide text-[#5C8A1E]">{menuSlotLabels[slot]}</p>{meal ? (meal.entrySource === 'manual' && meal.planProducts?.length ? <div className="mt-2"><div className="space-y-2">{meal.planProducts.map((product) => <div className="rounded-2xl bg-[#14170F] p-3" key={product.id}><div className="flex items-start justify-between gap-3"><p className="font-black text-[#F4F7EE]">{product.name}</p><p className="shrink-0 text-xs font-black text-[#5C8A1E]">{product.amount} {product.unit}</p></div><p className="mt-1 text-[11px] font-bold text-[#A9B39C]">{product.calories} ккал · Б {product.protein} · Ж {product.fat} · У {product.carbs}</p></div>)}</div><button className="mt-3 rounded-full bg-[#14170F] px-3 py-2 text-xs font-black text-[#F4F7EE] shadow-sm" onClick={() => onRemoveRecipe(day, slot)} type="button">Удалить приём пищи</button></div> : <div className="mt-2 grid gap-3 sm:grid-cols-[5.5rem_1fr] sm:items-start"><FoodPhotoPlaceholder alt={meal.title} className="min-h-[5.5rem]" imageUrl={meal.imageUrl} /><div><button className="text-left text-base font-black text-[#F4F7EE]" onClick={() => onOpenRecipe(meal)} type="button">{meal.title}</button><div className="mt-2 flex flex-wrap gap-2 text-[11px] font-extrabold text-[#A9B39C]"><span className="rounded-full bg-[#14170F] px-2 py-1">{meal.calories} ккал</span><span className="rounded-full bg-[#14170F] px-2 py-1">Б {meal.protein} г</span><span className="rounded-full bg-[#14170F] px-2 py-1">Ж {meal.fat} г</span><span className="rounded-full bg-[#14170F] px-2 py-1">У {meal.carbs} г</span></div><QuantityEditor meal={meal} onSave={(amount) => onUpdateRecipeQuantity(day, slot, amount)} /><button className="mt-3 rounded-full bg-[#14170F] px-3 py-2 text-xs font-black text-[#F4F7EE] shadow-sm" onClick={() => onRemoveRecipe(day, slot)} type="button">Удалить из слота</button></div></div>) : <div className="mt-2 flex flex-wrap gap-2"><button className="rounded-full bg-[#14170F] px-3 py-2 text-xs font-black text-[#5C8A1E]" onClick={onOpenRations} type="button">Выбрать рецепт</button><button className="rounded-full border border-[#5C8A1E] bg-[#14170F] px-3 py-2 text-xs font-black text-[#5C8A1E]" onClick={() => setManualTarget({ day, slot })} type="button">+ Внести продукты</button><button className="rounded-full bg-[#37410F] px-3 py-2 text-xs font-black text-white" onClick={() => onAddAiMeal(day, slot)} type="button">✨ Подобрать блюдо с ИИ</button></div>}</div>})}</div>}
      </article>})}</div>
    {manualTarget && <ManualMealModal
      mealLabel={`${manualTarget.day} · ${menuSlotLabels[manualTarget.slot]}`}
      onClose={() => setManualTarget(null)}
      onSave={(products) => onAddManualMeal(manualTarget.day, manualTarget.slot, products)}
    />}
  </section>;
}
