import { useMemo, useState } from 'react';
import { BackButton } from '../components/BackButton';
import { PhotoMealCapture } from '../components/PhotoMealCapture';
import { menuDays, menuMealSlots, menuSlotLabels, type MenuDay, type MenuMealSlot } from '../types/menu';
import type { PlanProduct } from '../types/recipe';

type PhotoNutritionPageProps = {
  onBack: () => void;
  onSave: (day: MenuDay, slot: MenuMealSlot, products: PlanProduct[]) => Promise<void>;
};

type ProductDraft = Omit<PlanProduct, 'amount' | 'calories' | 'protein' | 'fat' | 'carbs'> & {
  amount: string;
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
};

const toDraft = (product: PlanProduct): ProductDraft => ({
  ...product,
  amount: String(product.amount),
  calories: String(product.calories),
  protein: String(product.protein),
  fat: String(product.fat),
  carbs: String(product.carbs),
});

const toNumber = (value: string) => {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const numericFields = ['amount', 'calories', 'protein', 'fat', 'carbs'] as const;
type NumericField = (typeof numericFields)[number];

export function PhotoNutritionPage({ onBack, onSave }: PhotoNutritionPageProps) {
  const [day, setDay] = useState<MenuDay>('Сегодня');
  const [slot, setSlot] = useState<MenuMealSlot>('breakfast');
  const [products, setProducts] = useState<ProductDraft[]>([]);
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const totals = useMemo(() => products.reduce((sum, product) => ({
    calories: sum.calories + toNumber(product.calories),
    protein: sum.protein + toNumber(product.protein),
    fat: sum.fat + toNumber(product.fat),
    carbs: sum.carbs + toNumber(product.carbs),
  }), { calories: 0, protein: 0, fat: 0, carbs: 0 }), [products]);

  const updateText = (index: number, field: 'name' | 'unit', value: string) => {
    setProducts((current) => current.map((product, productIndex) => productIndex === index ? { ...product, [field]: value } : product));
    setStatus('');
  };

  const updateNumber = (index: number, field: NumericField, value: string) => {
    if (!/^\d*[.,]?\d*$/.test(value)) return;
    setProducts((current) => current.map((product, productIndex) => productIndex === index ? { ...product, [field]: value } : product));
    setStatus('');
  };

  const save = async () => {
    const validProducts = products
      .filter((product) => product.name.trim() && toNumber(product.amount) > 0)
      .map((product) => ({
        ...product,
        name: product.name.trim(),
        unit: product.unit.trim() || 'г',
        amount: toNumber(product.amount),
        calories: toNumber(product.calories),
        protein: toNumber(product.protein),
        fat: toNumber(product.fat),
        carbs: toNumber(product.carbs),
      }));

    if (!validProducts.length) {
      setStatus('Проверьте название и количество продукта.');
      return;
    }

    setIsSaving(true);
    setStatus('');
    try {
      await onSave(day, slot, validProducts);
      setStatus('Готово — результат сохранён в план питания.');
    } catch {
      setStatus('Не удалось сохранить. Попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
    }
  };

  return <div>
    <BackButton onClick={onBack} />
    <section className="rounded-[2rem] border border-[#D99663]/30 bg-[#FFFDF8] p-5 shadow-lg shadow-[#D99663]/10">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-[#6E7E1F]">ИИ-анализ блюда</p>
      <h1 className="mt-2 text-4xl font-black leading-tight text-[#37410F]">КБЖУ по фото</h1>
      <p className="mt-3 text-base font-semibold leading-6 text-[#8B725F]">Сфотографируйте готовое блюдо. ИИ оценит продукты, порцию и КБЖУ, а вы сможете всё проверить перед сохранением.</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <label className="text-sm font-black text-[#8B725F]">День
          <select className="mt-2 w-full rounded-2xl border border-[#D99663]/35 bg-white px-3 py-3 font-bold text-[#37410F]" value={day} onChange={(event) => setDay(event.target.value as MenuDay)}>
            {menuDays.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-black text-[#8B725F]">Приём пищи
          <select className="mt-2 w-full rounded-2xl border border-[#D99663]/35 bg-white px-3 py-3 font-bold text-[#37410F]" value={slot} onChange={(event) => setSlot(event.target.value as MenuMealSlot)}>
            {menuMealSlots.map((item) => <option key={item} value={item}>{menuSlotLabels[item]}</option>)}
          </select>
        </label>
      </div>
    </section>

    <PhotoMealCapture onRecognized={(recognized, recognitionNotice) => {
      setProducts(recognized.map(toDraft));
      setNotice(recognitionNotice);
      setStatus('');
    }} />

    {products.length > 0 && <section className="mt-5 space-y-4">
      {notice && <p className="rounded-2xl bg-[#F3E2BF]/55 px-4 py-3 text-sm font-bold leading-5 text-[#8B725F]">{notice}</p>}
      {products.map((product, index) => <article className="rounded-3xl border border-[#D99663]/30 bg-[#FFFDF8] p-4" key={product.id}>
        <div className="flex items-center justify-between gap-3">
          <p className="font-black text-[#37410F]">Продукт {index + 1}</p>
          {products.length > 1 && <button className="text-sm font-black text-[#A45135]" onClick={() => setProducts((current) => current.filter((_, productIndex) => productIndex !== index))} type="button">Удалить</button>}
        </div>
        <label className="mt-3 block text-sm font-black text-[#8B725F]">Название
          <input className="mt-2 w-full rounded-2xl border border-[#D99663]/35 bg-white px-4 py-3 font-bold text-[#37410F]" value={product.name} onChange={(event) => updateText(index, 'name', event.target.value)} />
        </label>
        <div className="mt-3 grid grid-cols-[1fr_5.5rem] gap-3">
          <label className="text-sm font-black text-[#8B725F]">Количество
            <input inputMode="decimal" className="mt-2 w-full rounded-2xl border border-[#D99663]/35 bg-white px-4 py-3 font-bold text-[#37410F]" value={product.amount} onChange={(event) => updateNumber(index, 'amount', event.target.value)} />
          </label>
          <label className="text-sm font-black text-[#8B725F]">Единица
            <input className="mt-2 w-full rounded-2xl border border-[#D99663]/35 bg-white px-4 py-3 font-bold text-[#37410F]" value={product.unit} onChange={(event) => updateText(index, 'unit', event.target.value)} />
          </label>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {([
            ['calories', 'Ккал'],
            ['protein', 'Белки'],
            ['fat', 'Жиры'],
            ['carbs', 'Углеводы'],
          ] as const).map(([field, label]) => <label className="text-sm font-black text-[#8B725F]" key={field}>{label}
            <input inputMode="decimal" className="mt-2 w-full rounded-2xl border border-[#D99663]/35 bg-white px-4 py-3 font-bold text-[#37410F]" value={product[field]} onChange={(event) => updateNumber(index, field, event.target.value)} />
          </label>)}
        </div>
      </article>)}

      <article className="rounded-3xl bg-[#37410F] p-4 text-white">
        <p className="text-sm font-black uppercase tracking-wider text-[#F3E2BF]">Итого</p>
        <p className="mt-2 text-2xl font-black">{Math.round(totals.calories)} ккал</p>
        <p className="mt-1 font-bold">Б {totals.protein.toFixed(1)} · Ж {totals.fat.toFixed(1)} · У {totals.carbs.toFixed(1)}</p>
      </article>

      <button className="w-full rounded-3xl bg-[#6E7E1F] px-5 py-4 text-lg font-black text-white disabled:opacity-60" disabled={isSaving} onClick={() => void save()} type="button">{isSaving ? 'Сохраняем…' : 'Сохранить в план питания'}</button>
      {status && <p className="rounded-2xl bg-[#F3E2BF]/55 px-4 py-3 text-center text-sm font-black text-[#8B725F]">{status}</p>}
    </section>}
  </div>;
}
