import { useState } from 'react';
import { dailyRations } from '../data/rations';
import { adaptRationToCalories, calculateMealsNutrition } from '../types/ration';
import type { DailyRation } from '../types/ration';

type Gender = 'female' | 'male';
type Activity = 'low' | 'moderate' | 'high';
type Goal = 'loss' | 'maintain' | 'gain';

type MacroResult = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

type MacroCalculatorPageProps = {
  onBack: () => void;
  onOpenRation: (ration: DailyRation) => void;
};

const activityFactors: Record<Activity, number> = {
  low: 1.2,
  moderate: 1.45,
  high: 1.65,
};

const goalFactors: Record<Goal, number> = {
  loss: 0.85,
  maintain: 1,
  gain: 1.1,
};

const PROTEIN_GRAMS_PER_KG = 1.8;
const FAT_GRAMS_PER_KG = 0.9;

const formatDifference = (targetCalories: number, rationCalories: number) => {
  const difference = rationCalories - targetCalories;

  if (Math.abs(difference) <= 50) {
    return 'близко к вашей норме';
  }

  return `на ${Math.abs(difference)} ккал ${difference > 0 ? 'выше' : 'ниже'} вашей нормы`;
};

const calculateMacros = (gender: Gender, age: number, height: number, weight: number, activity: Activity, goal: Goal): MacroResult => {
  const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'female' ? -161 : 5);
  const calories = Math.round(bmr * activityFactors[activity] * goalFactors[goal]);
  const protein = Math.round(weight * PROTEIN_GRAMS_PER_KG);
  const fat = Math.round(weight * FAT_GRAMS_PER_KG);
  const remainingCalories = calories - protein * 4 - fat * 9;
  const carbs = Math.max(0, Math.round(remainingCalories / 4));

  return { calories, protein, fat, carbs };
};

export function MacroCalculatorPage({ onBack, onOpenRation }: MacroCalculatorPageProps) {
  const [gender, setGender] = useState<Gender>('female');
  const [age, setAge] = useState('32');
  const [height, setHeight] = useState('168');
  const [weight, setWeight] = useState('64');
  const [activity, setActivity] = useState<Activity>('moderate');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [result, setResult] = useState<MacroResult | null>(null);
  const [warningRationId, setWarningRationId] = useState<string | null>(null);

  const suitableRations = result
    ? dailyRations
        .map((ration) => ({ ration, totals: ration.nutrition ?? calculateMealsNutrition(ration.meals) }))
        .sort((first, second) => Math.abs(first.totals.calories - result.calories) - Math.abs(second.totals.calories - result.calories))
        .slice(0, 3)
    : [];

  const handleCalculate = () => {
    const numericAge = Number(age);
    const numericHeight = Number(height);
    const numericWeight = Number(weight);

    if (numericAge > 0 && numericHeight > 0 && numericWeight > 0) {
      setResult(calculateMacros(gender, numericAge, numericHeight, numericWeight, activity, goal));
      setWarningRationId(null);
    }
  };

  const handleAdapt = (ration: DailyRation, force = false) => {
    if (!result) {
      return;
    }

    const originalCalories = calculateMealsNutrition(ration.meals).calories;
    const scaleFactor = result.calories / originalCalories;

    if (!force && (scaleFactor < 0.8 || scaleFactor > 1.2)) {
      setWarningRationId(ration.id);
      return;
    }

    onOpenRation(adaptRationToCalories(ration, result.calories));
  };

  return (
    <section className="flex flex-1 flex-col">
      <button className="mb-4 self-start rounded-2xl bg-[#FFFDF8] px-4 py-3 text-sm font-black text-[#37410F] shadow-sm shadow-[#F3E2BF]/70 transition hover:bg-[#F3E2BF]" onClick={onBack} type="button">← Назад</button>
      <div className="rounded-[2rem] border border-[#D99663]/35 bg-gradient-to-br from-[#F3E2BF] via-[#D99663]/35 to-[#FBF6EC] p-6 text-[#37410F] shadow-xl shadow-[#D99663]/20">
        <p className="text-sm font-bold uppercase tracking-wide text-[#8B725F]">Калькулятор</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Расчёт БЖУ</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-[#8B725F]">Рассчитай ориентир и подгони ближайший рацион под свою норму.</p>
      </div>

      <article className="mt-5 rounded-[2rem] border border-[#D99663]/25 bg-[#FFFDF8] p-5 shadow-sm shadow-[#F3E2BF]/70">
        <div className="grid gap-4">
          <div>
            <p className="mb-2 text-sm font-black text-[#37410F]">Пол</p>
            <div className="grid grid-cols-2 gap-2">
              {(['female', 'male'] as Gender[]).map((value) => <button className={`rounded-2xl px-4 py-3 text-sm font-black ${gender === value ? 'bg-[#6E7E1F] text-white' : 'bg-[#F3E2BF]/80 text-[#37410F]'}`} key={value} onClick={() => setGender(value)} type="button">{value === 'female' ? 'Женский' : 'Мужской'}</button>)}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="text-sm font-black text-[#37410F]">Возраст<input className="mt-2 w-full rounded-2xl border border-[#F3E2BF] bg-[#FFFDF8] px-3 py-3 text-base font-bold outline-none focus:border-[#6E7E1F]" min="1" onChange={(event) => setAge(event.target.value)} type="number" value={age} /></label>
            <label className="text-sm font-black text-[#37410F]">Рост, см<input className="mt-2 w-full rounded-2xl border border-[#F3E2BF] bg-[#FFFDF8] px-3 py-3 text-base font-bold outline-none focus:border-[#6E7E1F]" min="1" onChange={(event) => setHeight(event.target.value)} type="number" value={height} /></label>
            <label className="text-sm font-black text-[#37410F]">Вес, кг<input className="mt-2 w-full rounded-2xl border border-[#F3E2BF] bg-[#FFFDF8] px-3 py-3 text-base font-bold outline-none focus:border-[#6E7E1F]" min="1" onChange={(event) => setWeight(event.target.value)} type="number" value={weight} /></label>
          </div>
          <div>
            <p className="mb-2 text-sm font-black text-[#37410F]">Активность</p>
            <div className="grid grid-cols-3 gap-2">{(['low', 'moderate', 'high'] as Activity[]).map((value) => <button className={`rounded-2xl px-2 py-3 text-xs font-black ${activity === value ? 'bg-[#6E7E1F] text-white' : 'bg-[#F3E2BF]/80 text-[#37410F]'}`} key={value} onClick={() => setActivity(value)} type="button">{value === 'low' ? 'Низкая' : value === 'moderate' ? 'Умеренная' : 'Высокая'}</button>)}</div>
          </div>
          <div>
            <p className="mb-2 text-sm font-black text-[#37410F]">Цель</p>
            <div className="grid grid-cols-3 gap-2">{(['loss', 'maintain', 'gain'] as Goal[]).map((value) => <button className={`rounded-2xl px-2 py-3 text-xs font-black ${goal === value ? 'bg-[#6E7E1F] text-white' : 'bg-[#F3E2BF]/80 text-[#37410F]'}`} key={value} onClick={() => setGoal(value)} type="button">{value === 'loss' ? 'Снижение' : value === 'maintain' ? 'Поддержание' : 'Набор'}</button>)}</div>
          </div>
        </div>
        <button className="mt-5 w-full rounded-2xl bg-[#6E7E1F] px-4 py-3 text-base font-black text-white shadow-lg shadow-[#F3E2BF]/70 transition hover:bg-[#37410F]" onClick={handleCalculate} type="button">Рассчитать</button>
      </article>

      {result && <>
        <article className="mt-5 rounded-[2rem] border border-[#D99663]/25 bg-[#FFFDF8] p-5 shadow-sm shadow-[#F3E2BF]/70">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6E7E1F]">Ваша ориентировочная норма</p>
          <div className="mt-3 grid grid-cols-4 gap-2 rounded-3xl bg-[#F3E2BF]/65 p-3 text-center"><div><p className="text-sm font-black">{result.calories}</p><p className="text-[11px] font-bold text-[#8B725F]">ккал</p></div><div><p className="text-sm font-black">{result.protein} г</p><p className="text-[11px] font-bold text-[#8B725F]">белки</p></div><div><p className="text-sm font-black">{result.fat} г</p><p className="text-[11px] font-bold text-[#8B725F]">жиры</p></div><div><p className="text-sm font-black">{result.carbs} г</p><p className="text-[11px] font-bold text-[#8B725F]">углеводы</p></div></div>
          <p className="mt-3 text-xs font-semibold leading-5 text-[#8B725F]">Белок рассчитан ориентировочно: {PROTEIN_GRAMS_PER_KG} г на кг веса.</p>
        </article>

        <section className="mt-5">
          <h2 className="text-xl font-black text-[#37410F]">Подходящие рационы</h2>
          {suitableRations.length === 0 ? <div className="mt-3 rounded-[2rem] bg-[#FFFDF8] p-6 text-center text-sm font-bold text-[#8B725F] shadow-sm shadow-[#F3E2BF]/70">Пока нет подходящих рационов. Добавим их позже.</div> : <div className="mt-3 space-y-3">{suitableRations.map(({ ration, totals }) => <article className="rounded-[2rem] border border-[#D99663]/25 bg-[#FFFDF8] p-4 shadow-sm shadow-[#F3E2BF]/70" key={ration.id}><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-black text-[#37410F]">Рацион №{ration.rationNumber}</h3><p className="mt-1 text-sm font-bold text-[#8B725F]">{formatDifference(result.calories, totals.calories)}</p></div><span className="rounded-2xl bg-[#F3E2BF] px-3 py-2 text-sm font-black text-[#37410F]">{totals.calories} ккал</span></div><div className="mt-3 flex flex-wrap gap-2 text-[11px] font-extrabold text-[#8B725F]"><span className="rounded-full bg-[#6E7E1F]/15 px-2 py-1 text-[#6E7E1F]">Б {totals.protein} г</span><span className="rounded-full bg-[#D99663]/15 px-2 py-1 text-[#D99663]">Ж {totals.fat} г</span><span className="rounded-full bg-[#F3E2BF] px-2 py-1 text-[#37410F]">У {totals.carbs} г</span></div>{warningRationId === ration.id && <div className="mt-3 rounded-3xl border border-[#8B725F]/35 bg-[#F3E2BF] p-3"><p className="text-sm font-bold text-[#37410F]">Этот рацион сильно отличается от вашей нормы. Лучше выбрать рацион ближе по калорийности.</p><button className="mt-2 rounded-2xl bg-[#6E7E1F] px-4 py-2 text-sm font-black text-white hover:bg-[#37410F]" onClick={() => handleAdapt(ration, true)} type="button">Всё равно подогнать</button></div>}<div className="mt-4 grid grid-cols-2 gap-2"><button className="rounded-2xl bg-[#F3E2BF] px-4 py-3 text-sm font-black text-[#37410F]" onClick={() => onOpenRation(ration)} type="button">Открыть</button><button className="rounded-2xl bg-[#6E7E1F] px-4 py-3 text-sm font-black text-white" onClick={() => handleAdapt(ration)} type="button">Подогнать под меня</button></div></article>)}</div>}
        </section>
      </>}
    </section>
  );
}
