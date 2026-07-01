import { useMemo, useState } from 'react';
import { dailyRations } from '../data/rations';
import { calculateMealsNutrition } from '../types/ration';
import { menuSlotLabels } from '../types/menu';
import type { DailyRation } from '../types/ration';

type Filter = 'all' | 'free' | 'premium';

export function RationsPage({ hasActiveSubscription, onOpenAccess, onOpenRation }: { hasActiveSubscription: boolean; onOpenAccess: () => void; onOpenRation: (ration: DailyRation) => void }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const rations = useMemo(() => dailyRations.filter((ration) => {
    const matchesSearch = !search.trim() || String(ration.rationNumber).includes(search.trim()) || ration.title.toLowerCase().includes(search.trim().toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'premium' ? ration.isPremium : !ration.isPremium);
    return matchesSearch && matchesFilter;
  }), [filter, search]);

  return <section className="flex flex-1 flex-col">
    <div className="rounded-[2rem] bg-[#EEF1D8] p-6 text-[#30360E] shadow-xl shadow-[#E2D4B9]/70">
      <p className="text-sm font-bold uppercase tracking-wide text-[#92735C]">Рационы дня</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">Рационы</h1>
      <p className="mt-3 text-sm font-medium leading-6 text-[#92735C]">Готовый 1 день питания из 4 приёмов пищи. КБЖУ считаются автоматически.</p>
    </div>
    <div className="sticky top-0 z-10 -mx-4 mt-5 bg-[#FFFDF8] px-4 pb-3 pt-1">
      <input className="w-full rounded-2xl border border-[#92735C]/35 bg-white px-4 py-3 text-base font-semibold text-[#30360E] shadow-sm outline-none focus:border-[#92735C]/35 focus:ring-4 focus:ring-[#EEF1D8]" placeholder="Найти Рацион №" value={search} onChange={(e)=>setSearch(e.target.value)} />
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{(['all','free','premium'] as Filter[]).map((item)=><button className={`shrink-0 rounded-full px-4 py-2 text-sm font-extrabold ${filter===item?'bg-[#686F12] text-white':'bg-white text-[#92735C] shadow-sm shadow-[#E2D4B9]/70'}`} key={item} onClick={()=>setFilter(item)} type="button">{item==='all'?'Все':item==='free'?'Бесплатные':'Premium'}</button>)}</div>
    </div>
    <div className="mt-2 space-y-3">{rations.map((ration)=>{
      const totals = calculateMealsNutrition(ration.meals);
      const locked = ration.isPremium && !hasActiveSubscription;
      return <article className={`rounded-3xl border p-4 shadow-sm ${locked?'border-[#92735C]/35 bg-[#E2D4B9]':'border-[#92735C]/35 bg-[#FFFDF8] shadow-[#E2D4B9]/70'}`} key={ration.id}>
        <div className="flex items-start justify-between gap-3"><div><div className="flex gap-2"><span className="rounded-full bg-[#E2D4B9] px-3 py-1 text-xs font-extrabold text-[#30360E]">Рацион №{ration.rationNumber}</span>{ration.isPremium&&<span className="rounded-full bg-[#E2D4B9] px-3 py-1 text-xs font-extrabold text-[#30360E]">Premium</span>}</div><h2 className="mt-2 text-xl font-black text-[#30360E]">{ration.title}</h2><p className="mt-1 text-sm leading-5 text-[#92735C]">{ration.description}</p></div></div>
        <div className="mt-3 grid gap-2">{Object.entries(ration.meals).map(([slot, meal])=><p className="rounded-2xl bg-[#E2D4B9] px-3 py-2 text-sm font-bold text-[#30360E]" key={slot}><span className="text-[#30360E]">{menuSlotLabels[slot as keyof typeof menuSlotLabels]}:</span> {locked ? 'детали после доступа' : meal.title}</p>)}</div>
        <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl bg-[#FFFDF8] p-3 text-center text-xs font-bold"><div><b>{totals.calories}</b><p>ккал</p></div><div><b>{totals.protein} г</b><p>белки</p></div><div><b>{totals.fat} г</b><p>жиры</p></div><div><b>{totals.carbs} г</b><p>углеводы</p></div></div>
        <button className="mt-4 w-full rounded-2xl bg-[#686F12] px-4 py-3 text-base font-black text-white shadow-lg shadow-[#E2D4B9]/70" onClick={()=> locked ? onOpenAccess() : onOpenRation(ration)} type="button">{locked?'Оформить доступ':'Открыть'}</button>
      </article>})}</div>
  </section>;
}
