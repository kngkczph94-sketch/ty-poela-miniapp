import { BackButton } from '../components/BackButton';
import { FoodPhotoPlaceholder } from '../components/FoodPhotoPlaceholder';
import { calculateMealsNutrition } from '../types/ration';
import { menuDays, menuMealSlots, menuSlotLabels, type MenuDay, type MenuMealSlot, type WeeklyMenu } from '../types/menu';
import type { Meal } from '../types/recipe';

type MenuPageProps = {
  weeklyMenu: WeeklyMenu;
  onBack: () => void;
  onOpenCart: () => void;
  onOpenRations: () => void;
  onOpenRecipe: (recipe: Meal) => void;
  onRemoveRecipe: (day: MenuDay, slot: MenuMealSlot) => void;
};

export function MenuPage({ weeklyMenu, onBack, onOpenCart, onOpenRations, onOpenRecipe, onRemoveRecipe }: MenuPageProps) {
  const hasMealsInPlan = menuDays.some((day) => menuMealSlots.some((slot) => Boolean(weeklyMenu[day].meals[slot])));

  return <section className="flex flex-1 flex-col">
    <BackButton onClick={onBack} />
    <div className="rounded-[2rem] border border-[#D99663]/35 bg-gradient-to-br from-[#F3E2BF] via-[#D99663]/35 to-[#FBF6EC] p-6 text-[#37410F] shadow-xl shadow-[#D99663]/20">
      <p className="text-sm font-bold uppercase tracking-wide text-[#8B725F]">План питания</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">План</h1>
      <p className="mt-3 text-sm font-medium leading-6 text-[#8B725F]">Добавь рацион дня на 1–3 дня или выбранные дни недели — корзина соберётся сама.</p>
      <button className="mt-5 rounded-2xl bg-[#6E7E1F] px-5 py-3 text-base font-black text-white shadow-lg shadow-[#F3E2BF]/70 transition hover:bg-[#37410F]" onClick={onOpenCart} type="button">Смотреть корзину</button>
    </div>
    {!hasMealsInPlan && <div className="mt-5 rounded-[2rem] border border-[#D99663]/25 bg-[#FFFDF8] p-6 text-center shadow-sm shadow-[#F3E2BF]/70"><p className="text-5xl">🍽️</p><h2 className="mt-3 text-xl font-black text-[#37410F]">Пока пусто. Добавь рацион дня — и план соберётся сам.</h2><button className="mt-5 rounded-2xl bg-[#6E7E1F] px-5 py-3 text-base font-black text-white shadow-lg shadow-[#F3E2BF]/70" onClick={onOpenRations} type="button">Выбрать рацион</button></div>}
    <div className="mt-5 space-y-4">{menuDays.map((day) => {
      const planDay = weeklyMenu[day];
      const totals = calculateMealsNutrition(planDay.meals);
      const isEmpty = menuMealSlots.every((slot) => !planDay.meals[slot]);
      return <article className="rounded-[2rem] border border-[#D99663]/25 bg-[#FFFDF8] p-4 shadow-sm shadow-[#F3E2BF]/70" key={day}><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-black text-[#37410F]">{day}</h2><p className="mt-1 text-xs font-bold text-[#8B725F]">{planDay.rationNumber ? `Добавлен Рацион №${planDay.rationNumber}` : 'Завтрак · Обед · Ужин · Перекус'}</p></div><div className="rounded-2xl bg-[#F3E2BF] px-3 py-2 text-right text-xs font-extrabold text-[#37410F]"><div>{totals.calories} ккал</div><div className="text-[11px] text-[#6E7E1F]">за день</div></div></div>
      {isEmpty ? <div className="mt-3 rounded-3xl bg-[#F3E2BF]/65 p-4 text-center"><p className="text-sm font-semibold text-[#8B725F]">Пока пусто. Добавь рацион дня — и план соберётся сам.</p><button className="mt-3 rounded-2xl bg-[#6E7E1F] px-4 py-3 text-sm font-black text-white" onClick={onOpenRations} type="button">Выбрать рацион</button></div> : <><div className="mt-3 grid grid-cols-4 gap-2 rounded-3xl bg-[#FFFDF8] p-3 text-center"><div><p className="text-sm font-black">{totals.calories}</p><p className="text-[11px] font-bold text-[#8B725F]">ккал</p></div><div><p className="text-sm font-black">{totals.protein} г</p><p className="text-[11px] font-bold text-[#8B725F]">белки</p></div><div><p className="text-sm font-black">{totals.fat} г</p><p className="text-[11px] font-bold text-[#8B725F]">жиры</p></div><div><p className="text-sm font-black">{totals.carbs} г</p><p className="text-[11px] font-bold text-[#8B725F]">углеводы</p></div></div><div className="mt-3 space-y-2">{menuMealSlots.map((slot) => { const meal = planDay.meals[slot]; return <div className="rounded-3xl border border-[#D99663]/30 bg-[#F3E2BF]/60 p-3" key={slot}><p className="text-xs font-black uppercase tracking-wide text-[#6E7E1F]">{menuSlotLabels[slot]}</p>{meal ? <div className="mt-2 grid gap-3 sm:grid-cols-[5.5rem_1fr] sm:items-start"><FoodPhotoPlaceholder alt={meal.title} className="min-h-[5.5rem]" imageUrl={meal.imageUrl} /><div><button className="text-left text-base font-black text-[#37410F]" onClick={() => onOpenRecipe(meal)} type="button">{meal.title}</button><div className="mt-2 flex flex-wrap gap-2 text-[11px] font-extrabold text-[#8B725F]"><span className="rounded-full bg-white px-2 py-1">{meal.calories} ккал</span><span className="rounded-full bg-white px-2 py-1">Б {meal.protein} г</span><span className="rounded-full bg-white px-2 py-1">Ж {meal.fat} г</span><span className="rounded-full bg-white px-2 py-1">У {meal.carbs} г</span></div><button className="mt-3 rounded-full bg-white px-3 py-2 text-xs font-black text-[#37410F] shadow-sm" onClick={() => onRemoveRecipe(day, slot)} type="button">Удалить из слота</button></div></div> : <button className="mt-2 text-left text-sm font-extrabold text-[#6E7E1F]" onClick={onOpenRations} type="button">Выбрать рацион</button>}</div>})}</div></>}
      </article>})}</div>
  </section>;
}
