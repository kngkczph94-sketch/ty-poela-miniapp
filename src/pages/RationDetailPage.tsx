import { useEffect, useMemo, useState } from 'react';
import { FoodPhotoPlaceholder } from '../components/FoodPhotoPlaceholder';
import { recipes } from '../data/recipes';
import { dailyRations } from '../data/rations';
import { calculateMealsNutrition } from '../types/ration';
import { menuDays, menuSlotLabels, type MenuDay, type MenuMealSlot } from '../types/menu';
import type { DailyRation } from '../types/ration';
import type { Meal } from '../types/recipe';

type AddMode = 'today' | 'tomorrow' | '2days' | '3days' | 'custom';

export function RationDetailPage({ ration, onBack, onOpenAccess, onOpenRecipe, onAddRationToPlan, hasActiveSubscription }: { ration: DailyRation; hasActiveSubscription: boolean; onBack: () => void; onOpenAccess: () => void; onOpenRecipe: (meal: Meal) => void; onAddRationToPlan: (ration: DailyRation, meals: DailyRation['meals'], days: MenuDay[]) => void }) {
  const [meals, setMeals] = useState(ration.meals);
  const [replaceSlot, setReplaceSlot] = useState<MenuMealSlot | null>(null);
  const [showAllMeals, setShowAllMeals] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customDays, setCustomDays] = useState<MenuDay[]>(['Сегодня']);
  const [toast, setToast] = useState('');
  const [isOriginalRestored, setIsOriginalRestored] = useState(false);

  const sourceRation = useMemo(
    () => dailyRations.find((dailyRation) => dailyRation.id === ration.id || dailyRation.rationNumber === ration.rationNumber),
    [ration.id, ration.rationNumber],
  );
  const displayRation = sourceRation && sourceRation.isPremium === false && !ration.adaptedFrom ? sourceRation : ration;

  useEffect(() => {
    setMeals(displayRation.meals);
    setReplaceSlot(null);
    setPickerOpen(false);
    setToast('');
    setIsOriginalRestored(false);
  }, [displayRation]);

  const totals = calculateMealsNutrition(meals);
  const locked = displayRation.isPremium === true && !hasActiveSubscription;
  const adaptation = isOriginalRestored ? undefined : displayRation.adaptedFrom;
  const changePercent = adaptation ? Math.round((adaptation.scaleFactor - 1) * 100) : 0;
  const replacementMeals = useMemo(() => recipes.filter((meal) => showAllMeals || meal.mealType === replaceSlot), [replaceSlot, showAllMeals]);
  const add = (mode: AddMode) => {
    const days: MenuDay[] = mode === 'today' ? ['Сегодня'] : mode === 'tomorrow' ? ['Завтра'] : mode === '2days' ? ['Сегодня','Завтра'] : mode === '3days' ? ['Сегодня','Завтра','Среда'] : customDays;
    onAddRationToPlan(displayRation, meals, days);
    setPickerOpen(false); setToast(`Рацион №${displayRation.rationNumber} добавлен в План: ${days.join(', ')}`);
  };

  return <section className="flex flex-1 flex-col">
    <button className="mb-4 inline-flex w-fit rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[#37410F] shadow-sm" onClick={onBack} type="button">← Назад к рационам</button>
    <article className="overflow-hidden rounded-[2rem] bg-[#FFFDF8] shadow-xl shadow-[#F3E2BF]/70"><div className="bg-[#F3E2BF] p-6 text-[#37410F]">{displayRation.isPremium&&<span className="inline-flex rounded-full bg-[#D99663]/15 px-3 py-1 text-xs font-extrabold text-[#D99663]">Premium</span>}<h1 className="mt-3 text-3xl font-black">{displayRation.title}</h1>{adaptation && <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#37410F]">Подогнано под вашу норму</span>}<p className="mt-3 text-sm font-medium leading-6 text-[#8B725F]">{displayRation.description}</p></div>
    <div className="p-5">{adaptation && <div className="mb-4 rounded-3xl border border-[#8B725F]/35 bg-[#F3E2BF] p-4"><p className="text-sm font-black text-[#37410F]">Подогнано под вашу норму</p><p className="mt-1 text-sm font-semibold text-[#8B725F]">Исходная калорийность: {adaptation.originalCalories} ккал · новая: {totals.calories} ккал</p><p className="mt-1 text-sm font-semibold text-[#8B725F]">Граммовки изменены на {changePercent > 0 ? '+' : ''}{changePercent}%</p><button className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#37410F]" onClick={() => { setMeals(adaptation.originalMeals); setIsOriginalRestored(true); setToast('Оригинальные граммовки возвращены'); }} type="button">Вернуть оригинал</button></div>}<div className="grid grid-cols-4 gap-2 rounded-3xl bg-[#F3E2BF] p-3 text-center"><div><p className="text-sm font-black">{totals.calories}</p><p className="text-[11px] font-bold text-[#8B725F]">ккал</p></div><div><p className="text-sm font-black">{totals.protein} г</p><p className="text-[11px] font-bold text-[#8B725F]">белки</p></div><div><p className="text-sm font-black">{totals.fat} г</p><p className="text-[11px] font-bold text-[#8B725F]">жиры</p></div><div><p className="text-sm font-black">{totals.carbs} г</p><p className="text-[11px] font-bold text-[#8B725F]">углеводы</p></div></div>
    {locked ? <div className="mt-5 rounded-3xl border border-[#8B725F]/35 bg-[#F3E2BF] p-5 text-center"><p className="text-4xl">🔒</p><h2 className="mt-3 text-xl font-black">Preview premium-рациона</h2><p className="mt-2 text-sm font-semibold text-[#8B725F]">Детали блюд, замены и добавление в План доступны после mock-подписки.</p><button className="mt-4 w-full rounded-2xl bg-[#6E7E1F] px-4 py-3 text-base font-black text-white" onClick={onOpenAccess} type="button">Оформить доступ</button></div> : <>
    <div className="mt-4 space-y-3">{Object.entries(meals).map(([slot, meal]) => <div className="rounded-3xl border border-[#8B725F]/35 bg-[#F3E2BF]/50 p-3" key={slot}><p className="text-xs font-black uppercase tracking-wide text-[#6E7E1F]">{menuSlotLabels[slot as MenuMealSlot]}</p><div className="mt-2 grid gap-3 sm:grid-cols-[5.5rem_1fr] sm:items-start"><FoodPhotoPlaceholder alt={meal.title} className="min-h-[5.5rem]" imageUrl={displayRation.mealImageUrls?.[slot as MenuMealSlot] ?? meal.imageUrl} /><div><h3 className="text-base font-black text-[#37410F]">{meal.title}</h3><p className="mt-1 text-sm text-[#8B725F]">{meal.description}</p><div className="mt-2 flex flex-wrap gap-2 text-[11px] font-extrabold text-[#8B725F]"><span className="rounded-full bg-white px-2 py-1">{meal.calories} ккал</span><span className="rounded-full bg-white px-2 py-1">Б {meal.protein} г</span><span className="rounded-full bg-white px-2 py-1">Ж {meal.fat} г</span><span className="rounded-full bg-white px-2 py-1">У {meal.carbs} г</span></div><div className="mt-3 flex gap-2"><button className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#37410F]" onClick={()=>onOpenRecipe(meal)} type="button">Открыть</button><button className="rounded-full bg-[#6E7E1F] px-3 py-2 text-xs font-black text-white transition hover:bg-[#37410F]" onClick={()=>{setReplaceSlot(slot as MenuMealSlot); setShowAllMeals(false)}} type="button">Заменить</button></div></div></div></div>)}</div>
    <button className="mt-4 w-full rounded-2xl bg-[#6E7E1F] px-4 py-3 text-base font-black text-white shadow-lg shadow-[#F3E2BF]/70" onClick={()=>setPickerOpen(!pickerOpen)} type="button">Добавить в план</button>
    {pickerOpen && <div className="mt-3 rounded-3xl bg-[#F3E2BF] p-3"><div className="grid grid-cols-2 gap-2">{(['today','tomorrow','2days','3days'] as AddMode[]).map(m=><button className="rounded-2xl bg-white px-3 py-3 text-sm font-black text-[#37410F]" key={m} onClick={()=>add(m)} type="button">{m==='today'?'Сегодня':m==='tomorrow'?'Завтра':m==='2days'?'На 2 дня':'На 3 дня'}</button>)}</div><p className="mt-3 text-sm font-black">Выбрать дни недели</p><div className="mt-2 flex flex-wrap gap-2">{menuDays.map(day=><button className={`rounded-full px-3 py-2 text-xs font-black ${customDays.includes(day)?'bg-[#6E7E1F] text-white':'bg-white text-[#8B725F]'}`} key={day} onClick={()=>setCustomDays(d=>d.includes(day)?d.filter(x=>x!==day):[...d, day])} type="button">{day}</button>)}</div><button className="mt-3 w-full rounded-2xl bg-[#6E7E1F] px-4 py-3 text-sm font-black text-white transition hover:bg-[#37410F]" onClick={()=>add('custom')} type="button">Добавить в выбранные дни</button></div>}
    </>}</div></article>
    {replaceSlot && <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#37410F]/50 px-4 pb-4 backdrop-blur-sm"><div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-[#FFFDF8] p-4"><div className="flex items-center justify-between"><h2 className="text-xl font-black">Заменить: {menuSlotLabels[replaceSlot]}</h2><button className="text-2xl font-black" onClick={()=>setReplaceSlot(null)} type="button">×</button></div><div className="mt-3 flex gap-2"><button className={`rounded-full px-4 py-2 text-sm font-black ${!showAllMeals?'bg-[#6E7E1F] text-white':'bg-[#F3E2BF] text-[#37410F]'}`} onClick={()=>setShowAllMeals(false)} type="button">{menuSlotLabels[replaceSlot]}</button><button className={`rounded-full px-4 py-2 text-sm font-black ${showAllMeals?'bg-[#6E7E1F] text-white':'bg-[#F3E2BF] text-[#37410F]'}`} onClick={()=>setShowAllMeals(true)} type="button">Все блюда</button></div><div className="mt-3 space-y-2">{replacementMeals.map(meal=><button className="w-full rounded-3xl border border-[#8B725F]/35 p-3 text-left" key={meal.id} onClick={()=>{setMeals(cur=>({...cur,[replaceSlot]: meal})); setReplaceSlot(null); setToast(adaptation ? 'После замены КБЖУ пересчитаны.' : '')}} type="button"><b>{meal.title}</b><p className="text-sm text-[#8B725F]">{meal.calories} ккал · Б {meal.protein} · Ж {meal.fat} · У {meal.carbs}</p></button>)}</div></div></div>}
    {toast && <div className="fixed inset-x-4 bottom-28 z-30 mx-auto max-w-sm rounded-2xl bg-[#37410F] px-4 py-3 text-center text-sm font-bold text-white shadow-2xl">{toast}</div>}
  </section>;
}
