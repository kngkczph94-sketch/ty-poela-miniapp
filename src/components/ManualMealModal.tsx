import { useState } from 'react';
import { estimatePlanProducts } from '../data/nutritionRepository';
import { PhotoMealCapture } from './PhotoMealCapture';
import type { PlanProduct } from '../types/recipe';

type ManualMealModalProps = {
  mealLabel: string;
  onClose: () => void;
  onSave: (products: PlanProduct[]) => Promise<void>;
};

type NumericField = 'amount' | 'calories' | 'protein' | 'fat' | 'carbs';

type ProductDraft = Omit<PlanProduct, NumericField> & Record<NumericField, string>;

const createProduct = (): ProductDraft => ({
  id: globalThis.crypto?.randomUUID?.() ?? `product-${Date.now()}-${Math.random()}`,
  name: '',
  amount: '',
  unit: 'г',
  calories: '',
  protein: '',
  fat: '',
  carbs: '',
});

const numericFields: Array<{ key: NumericField; label: string }> = [
  { key: 'amount', label: 'Количество' },
  { key: 'calories', label: 'Ккал' },
  { key: 'protein', label: 'Белки' },
  { key: 'fat', label: 'Жиры' },
  { key: 'carbs', label: 'Углеводы' },
];

const sanitizeNumericInput = (value: string) => {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');
  const [integer = '', ...fractionParts] = normalized.split('.');
  const integerWithoutLeadingZeroes = integer.replace(/^0+(?=\d)/, '');
  if (fractionParts.length === 0) return integerWithoutLeadingZeroes;
  return `${integerWithoutLeadingZeroes || '0'}.${fractionParts.join('')}`;
};

const numericValue = (value: string) => {
  const parsed = Number(value.replace(',', '.'));
  return value.trim() !== '' && Number.isFinite(parsed) ? parsed : null;
};

const hasInvalidNumericFields = (product: ProductDraft) => numericFields.some(({ key }) => numericValue(product[key]) === null);

const toProductDraft = (product: PlanProduct): ProductDraft => ({
  ...product,
  amount: String(product.amount),
  calories: String(product.calories),
  protein: String(product.protein),
  fat: String(product.fat),
  carbs: String(product.carbs),
});

export function ManualMealModal({ mealLabel, onClose, onSave }: ManualMealModalProps) {
  const [products, setProducts] = useState<ProductDraft[]>([createProduct()]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [hasEstimate, setHasEstimate] = useState(false);
  const [photoNotice, setPhotoNotice] = useState('');

  const updateProduct = <K extends keyof ProductDraft>(id: string, key: K, value: ProductDraft[K]) => {
    setProducts((current) => current.map((product) => product.id === id ? { ...product, [key]: value } : product));
    if (key === 'name' || key === 'amount' || key === 'unit') {
      setHasEstimate(false);
      setPhotoNotice('');
    }
  };

  const normalizeProducts = (): PlanProduct[] => products.map((product) => ({
    ...product,
    name: product.name.trim(),
    unit: product.unit.trim() || 'г',
    amount: numericValue(product.amount) ?? 0,
    calories: numericValue(product.calories) ?? 0,
    protein: numericValue(product.protein) ?? 0,
    fat: numericValue(product.fat) ?? 0,
    carbs: numericValue(product.carbs) ?? 0,
  }));

  const handleEstimate = async () => {
    const normalized = normalizeProducts();
    if (normalized.some((product) => !product.name || product.amount <= 0)) {
      setError('Укажите название и количество каждого продукта.');
      return;
    }

    setError('');
    setIsEstimating(true);
    try {
      setProducts((await estimatePlanProducts(normalized)).map(toProductDraft));
      setHasEstimate(true);
      setPhotoNotice('');
    } catch (estimateError) {
      console.error('Nutrition estimate failed', estimateError);
      setError('Не удалось рассчитать КБЖУ. Проверьте соединение и попробуйте ещё раз.');
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSave = async () => {
    if (products.some(hasInvalidNumericFields)) {
      setError('Заполните количество и все поля КБЖУ корректными числами.');
      return;
    }
    const normalized = normalizeProducts();

    if (normalized.some((product) => !product.name || product.amount <= 0)) {
      setError('Укажите название и количество каждого продукта.');
      return;
    }
    if (!hasEstimate) {
      setError('Сначала рассчитайте КБЖУ.');
      return;
    }
    if (normalized.some((product) => [product.calories, product.protein, product.fat, product.carbs].some((value) => value < 0))) {
      setError('КБЖУ не могут быть отрицательными.');
      return;
    }

    setError('');
    setIsSaving(true);
    try {
      await onSave(normalized);
      onClose();
    } catch (saveError) {
      console.error('Manual meal save failed', saveError);
      setError('Не удалось сохранить. Проверьте соединение и попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
    }
  };

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#37410F]/35 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label={`Добавить продукты: ${mealLabel}`}>
    <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-[#FFFDF8] p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6E7E1F]">{mealLabel}</p>
          <h2 className="mt-1 text-2xl font-black text-[#37410F]">Добавить продукты</h2>
          <p className="mt-2 text-sm font-semibold text-[#8B725F]">Каждый продукт сохранится отдельно — именно так он останется в истории.</p>
        </div>
        <button className="rounded-full bg-[#F3E2BF] px-3 py-2 font-black text-[#37410F]" onClick={onClose} type="button" aria-label="Закрыть">×</button>
      </div>

      <PhotoMealCapture
        disabled={isEstimating || isSaving}
        onRecognized={(recognized, notice) => {
          setProducts(recognized.map(toProductDraft));
          setHasEstimate(true);
          setPhotoNotice(notice);
          setError('');
        }}
      />
      {photoNotice && <p className="mt-3 rounded-2xl bg-[#F3E2BF]/65 px-4 py-3 text-xs font-bold leading-5 text-[#8B725F]">{photoNotice}</p>}

      <div className="mt-5 space-y-4">
        {products.map((product, index) => <div className="rounded-3xl border border-[#D99663]/30 bg-[#F3E2BF]/55 p-4" key={product.id}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-[#37410F]">Продукт {index + 1}</p>
            {products.length > 1 && <button className="text-xs font-black text-[#A45135]" onClick={() => { setProducts((current) => current.filter((item) => item.id !== product.id)); setHasEstimate(false); setPhotoNotice(''); }} type="button">Удалить</button>}
          </div>
          <label className="mt-3 block text-xs font-black text-[#8B725F]">Название
            <input className="mt-1 w-full rounded-2xl border border-[#D99663]/35 bg-white px-3 py-3 text-base font-bold text-[#37410F] outline-none focus:border-[#6E7E1F]" placeholder="Например, макароны" value={product.name} onChange={(event) => updateProduct(product.id, 'name', event.target.value)} />
          </label>
          <div className="mt-3 grid grid-cols-[1fr_6rem] gap-2">
            <label className="text-xs font-black text-[#8B725F]">Количество
              <input className="mt-1 w-full rounded-2xl border border-[#D99663]/35 bg-white px-3 py-3 font-bold text-[#37410F]" inputMode="decimal" placeholder="0" type="text" value={product.amount} onChange={(event) => updateProduct(product.id, 'amount', sanitizeNumericInput(event.target.value))} />
            </label>
            <label className="text-xs font-black text-[#8B725F]">Единица
              <input className="mt-1 w-full rounded-2xl border border-[#D99663]/35 bg-white px-3 py-3 font-bold text-[#37410F]" value={product.unit} onChange={(event) => updateProduct(product.id, 'unit', event.target.value)} />
            </label>
          </div>
          {hasEstimate && <div className="mt-3 grid grid-cols-2 gap-2">
            {numericFields.slice(1).map(({ key, label }) => <label className="text-xs font-black text-[#8B725F]" key={key}>{label}
              <input className="mt-1 w-full rounded-2xl border border-[#D99663]/35 bg-white px-3 py-3 font-bold text-[#37410F]" inputMode="decimal" placeholder="0" type="text" value={product[key]} onChange={(event) => updateProduct(product.id, key, sanitizeNumericInput(event.target.value))} />
            </label>)}
          </div>}
        </div>)}
      </div>

      <button className="mt-4 w-full rounded-2xl border border-[#6E7E1F] px-4 py-3 text-sm font-black text-[#6E7E1F]" onClick={() => { setProducts((current) => [...current, createProduct()]); setHasEstimate(false); setPhotoNotice(''); }} type="button">+ Добавить ещё продукт</button>
      <button className="mt-3 w-full rounded-2xl bg-[#37410F] px-4 py-4 text-base font-black text-white disabled:opacity-60" disabled={isEstimating || isSaving} onClick={handleEstimate} type="button">{isEstimating ? 'Рассчитываем…' : hasEstimate ? 'Рассчитать заново' : '✨ Рассчитать КБЖУ'}</button>
      {hasEstimate && <p className="mt-3 rounded-2xl bg-[#F3E2BF]/65 px-4 py-3 text-xs font-bold leading-5 text-[#8B725F]">Расчёт ориентировочный. Для продукта в упаковке сверьте значения с этикеткой — их можно исправить перед сохранением.</p>}
      {error && <p className="mt-3 rounded-2xl bg-[#D99663]/15 px-4 py-3 text-sm font-bold text-[#A45135]">{error}</p>}
      <button className="mt-4 w-full rounded-2xl bg-[#6E7E1F] px-4 py-4 text-base font-black text-white disabled:opacity-60" disabled={isSaving || isEstimating || !hasEstimate} onClick={handleSave} type="button">{isSaving ? 'Сохраняем…' : 'Сохранить приём пищи'}</button>
      <button className="mt-2 w-full px-4 py-3 text-sm font-black text-[#8B725F]" disabled={isSaving} onClick={onClose} type="button">Отмена</button>
    </div>
  </div>;
}
