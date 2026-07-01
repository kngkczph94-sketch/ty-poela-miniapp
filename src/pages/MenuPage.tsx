import { calculateMealsNutrition } from '../types/ration';
import { menuDays, menuMealSlots, menuSlotLabels, type MenuDay, type MenuMealSlot, type WeeklyMenu } from '../types/menu';
import type { Meal } from '../types/recipe';

type MenuPageProps = {
  weeklyMenu: WeeklyMenu;
  onOpenCart: () => void;
  onOpenRations: () => void;
  onOpenRecipe: (recipe: Meal) => void;
  onRemoveRecipe: (day: MenuDay, slot: MenuMealSlot) => void;
};

export function MenuPage({ weeklyMenu, onOpenCart, onOpenRations, onOpenRecipe, onRemoveRecipe }: MenuPageProps) {
  const hasMealsInPlan = menuDays.some((day) => menuMealSlots.some((slot) => Boolean(weeklyMenu[day].meals[slot])));

  return <section className="flex flex-1 flex-col">
    <div className="rounded-[2rem] bg-gradient-to-br from-olive to-butter p-6 text-white shadow-xl shadow-ghee/70">
      <p className="text-sm font-bold uppercase tracking-wide text-white/80">План питания</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">План</h1>
      <p className="mt-3 text-sm font-medium leading-6 text-white/90">Добавь рацион дня на 1–3 дня или выбранные дни недели — корзина соберётся сама.</p>
      <button className="mt-5 rounded-2xl bg-white px-5 py-3 text-base font-black text-olive-dark shadow-lg" onClick={onOpenCart} type="button">Смотреть корзину</button>
    </div>
    {!hasMealsInPlan && <div className="mt-5 rounded-[2rem] bg-white p-6 text-center shadow-sm shadow-butter"><p className="text-5xl">🍽️</p><h2 className="mt-3 text-xl font-black text-warm-dark">Пока пусто. Добавь рацион дня — и план соберётся сам.</h2><button className="mt-5 rounded-2xl bg-olive px-5 py-3 text-base font-black text-white shadow-lg shadow-ghee" onClick={onOpenRations} type="button">Выбрать рацион</button></div>}
    <div className="mt-5 space-y-4">{menuDays.map((day) => {
      const planDay = weeklyMenu[day];
      const totals = calculateMealsNutrition(planDay.meals);
      const isEmpty = menuMealSlots.every((slot) => !planDay.meals[slot]);
      return <article className="rounded-[2rem] bg-white p-4 shadow-sm shadow-butter" key={day}><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-black text-warm-dark">{day}</h2><p className="mt-1 text-xs font-bold text-warm-dark/45">{planDay.rationNumber ? `Добавлен Рацион №${planDay.rationNumber}` : 'Завтрак · Обед · Ужин · Перекус'}</p></div><div className="rounded-2xl bg-butter-soft px-3 py-2 text-right text-xs font-extrabold text-olive-dark"><div>{totals.calories} ккал</div><div className="text-[11px] text-olive">за день</div></div></div>
      {isEmpty ? <div className="mt-3 rounded-3xl bg-butter-soft/50 p-4 text-center"><p className="text-sm font-semibold text-warm-dark/65">Пока пусто. Добавь рацион дня — и план соберётся сам.</p><button className="mt-3 rounded-2xl bg-olive px-4 py-3 text-sm font-black text-white" onClick={onOpenRations} type="button">Выбрать рацион</button></div> : <><div className="mt-3 grid grid-cols-4 gap-2 rounded-3xl bg-cream p-3 text-center"><div><p className="text-sm font-black">{totals.calories}</p><p className="text-[11px] font-bold text-warm-dark/45">ккал</p></div><div><p className="text-sm font-black">{totals.protein} г</p><p className="text-[11px] font-bold text-warm-dark/45">белки</p></div><div><p className="text-sm font-black">{totals.fat} г</p><p className="text-[11px] font-bold text-warm-dark/45">жиры</p></div><div><p className="text-sm font-black">{totals.carbs} г</p><p className="text-[11px] font-bold text-warm-dark/45">углеводы</p></div></div><div className="mt-3 space-y-2">{menuMealSlots.map((slot) => { const meal = planDay.meals[slot]; return <div className="rounded-3xl border border-butter-soft bg-butter-soft/50 p-3" key={slot}><p className="text-xs font-black uppercase tracking-wide text-olive">{menuSlotLabels[slot]}</p>{meal ? <div className="mt-2"><button className="text-left text-base font-black text-warm-dark" onClick={() => onOpenRecipe(meal)} type="button">{meal.title}</button><div className="mt-2 flex flex-wrap gap-2 text-[11px] font-extrabold text-warm-dark/65"><span className="rounded-full bg-white px-2 py-1">{meal.calories} ккал</span><span className="rounded-full bg-white px-2 py-1">Б {meal.protein} г</span><span className="rounded-full bg-white px-2 py-1">Ж {meal.fat} г</span><span className="rounded-full bg-white px-2 py-1">У {meal.carbs} г</span></div><button className="mt-3 rounded-full bg-white px-3 py-2 text-xs font-black text-rose-500 shadow-sm" onClick={() => onRemoveRecipe(day, slot)} type="button">Удалить из слота</button></div> : <button className="mt-2 text-left text-sm font-extrabold text-olive" onClick={onOpenRations} type="button">Выбрать рацион</button>}</div>})}</div></>}
      </article>})}</div>
  </section>;
}
