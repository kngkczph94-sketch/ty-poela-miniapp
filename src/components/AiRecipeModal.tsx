import { useEffect, useState } from 'react';
import { suggestRecipes, type RecipeSuggestion } from '../data/recipeSuggestionRepository';
import { menuDays, menuMealSlots, menuSlotLabels, type MenuDay, type MenuMealSlot } from '../types/menu';
import './AiRecipeModal.css';

type Props = {
  initialDay?: MenuDay;
  initialSlot?: MenuMealSlot;
  onClose: () => void;
  onChoose: (recipe: RecipeSuggestion, day: MenuDay, slot: MenuMealSlot, grams: number) => Promise<void>;
};

const MAX_SOURCE_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_QUALITY = 0.82;

const optimizeImage = async (file: File) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Выберите фотографию JPG, PNG или WebP.');
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error('Фотография должна быть не больше 12 МБ.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Не удалось прочитать фотографию.'));
      image.src = objectUrl;
    });
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Не удалось подготовить фотографию.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const roundMacro = (value: number) => Math.round(value * 10) / 10;

const nutritionFor = (recipe: RecipeSuggestion) => {
  const total = recipe.nutritionTotal ?? {
    calories: recipe.calories,
    protein: recipe.protein,
    fat: recipe.fat,
    carbs: recipe.carbs,
  };
  const per100 = recipe.nutritionPer100g ?? (recipe.finishedWeightGrams && recipe.finishedWeightGrams > 0
    ? {
        calories: Math.round(total.calories * 100 / recipe.finishedWeightGrams),
        protein: roundMacro(total.protein * 100 / recipe.finishedWeightGrams),
        fat: roundMacro(total.fat * 100 / recipe.finishedWeightGrams),
        carbs: roundMacro(total.carbs * 100 / recipe.finishedWeightGrams),
      }
    : null);
  return { total, per100 };
};

function RecipeNutritionSummary({ recipe }: { recipe: RecipeSuggestion }) {
  const { total, per100 } = nutritionFor(recipe);
  return (
    <div className="ai-recipe-nutrition">
      <p className="ai-recipe-nutrition-title">
        На весь рецепт{recipe.finishedWeightGrams ? ` · готовый вес ≈ ${recipe.finishedWeightGrams} г` : ''}
      </p>
      <div className="ai-recipe-meta">
        <span className="ai-recipe-chip">{total.calories} ккал</span>
        <span className="ai-recipe-chip">Б {total.protein} г</span>
        <span className="ai-recipe-chip">Ж {total.fat} г</span>
        <span className="ai-recipe-chip">У {total.carbs} г</span>
      </div>
      {per100 && (
        <>
          <p className="ai-recipe-nutrition-title">На 100 г готового блюда</p>
          <div className="ai-recipe-meta">
            <span className="ai-recipe-chip">{per100.calories} ккал</span>
            <span className="ai-recipe-chip">Б {per100.protein} г</span>
            <span className="ai-recipe-chip">Ж {per100.fat} г</span>
            <span className="ai-recipe-chip">У {per100.carbs} г</span>
          </div>
        </>
      )}
      <p className="ai-recipe-time">⏱ {recipe.cookingTime} мин</p>
    </div>
  );
}

export function AiRecipeModal({ initialDay = 'Сегодня', initialSlot = 'breakfast', onClose, onChoose }: Props) {
  const [mode, setMode] = useState<'products' | 'photo'>('products');
  const [products, setProducts] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [day, setDay] = useState<MenuDay>(initialDay);
  const [slot, setSlot] = useState<MenuMealSlot>(initialSlot);
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [recognizedProducts, setRecognizedProducts] = useState<string[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [preparingImage, setPreparingImage] = useState(false);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');
  const [plannedGrams, setPlannedGrams] = useState('100');

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  const resetResults = () => {
    setSuggestions([]);
    setRecognizedProducts([]);
    setSelectedRecipe(null);
    setImageError('');
  };

  const chooseImage = async (file?: File) => {
    setError('');
    resetResults();
    setImageDataUrl('');
    if (!file) return;
    setPreparingImage(true);
    try {
      setImageDataUrl(await optimizeImage(file));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось подготовить фотографию.');
    } finally {
      setPreparingImage(false);
    }
  };

  const generate = async () => {
    setLoading(true);
    setError('');
    resetResults();
    try {
      const input = mode === 'products'
        ? { mode: 'products' as const, products: products.trim() }
        : { mode: 'photo' as const, imageDataUrl };
      if (mode === 'products' && !products.trim()) throw new Error('Перечислите продукты.');
      if (mode === 'photo' && !imageDataUrl) throw new Error('Добавьте фотографию продуктов.');
      const result = await suggestRecipes(input);
      setSuggestions(result.suggestions);
      setRecognizedProducts(result.recognizedProducts);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось подобрать рецепты.');
    } finally {
      setLoading(false);
    }
  };

  const selectRecipe = (recipe: RecipeSuggestion) => {
    setSelectedRecipe(recipe);
    setPlannedGrams('100');
    setImageError('');
  };

  const choose = async (recipe: RecipeSuggestion) => {
    const grams = Number(plannedGrams);
    if (!Number.isFinite(grams) || grams <= 0) {
      setError('Введите количество готового блюда больше 0 г.');
      return;
    }
    setSavingId(recipe.id);
    setError('');
    try {
      await onChoose(recipe, day, slot, grams);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось добавить блюдо в план.');
    } finally {
      setSavingId('');
    }
  };

  return <div aria-modal="true" className="ai-recipe-overlay" role="dialog">
    <section className="ai-recipe-modal">
      <header className="ai-recipe-header">
        <div>
          <div className="ai-recipe-kicker">ИИ · подбор рецепта</div>
          <h2 className="ai-recipe-title">{selectedRecipe ? 'Ваш рецепт' : 'Что приготовить?'}</h2>
        </div>
        <button aria-label="Закрыть" className="ai-recipe-close" onClick={onClose} type="button">×</button>
      </header>

      {selectedRecipe ? <div className="ai-recipe-selected">
        <button className="ai-recipe-back" onClick={() => { setSelectedRecipe(null); setImageError(''); }} type="button">← К трём вариантам</button>
        <div className="ai-recipe-image-shell">
          {savingId && <div className="ai-recipe-image-loading"><span>✨</span><strong>Создаём изображение…</strong><small>Рецепт сохраняется в плане питания</small></div>}
          {!savingId && !selectedRecipe.imageUrl && <div className="ai-recipe-image-fallback"><span>🍽️</span><strong>Рецепт готов</strong>{imageError ? <small>{imageError}</small> : <small>Изображение создадим после сохранения рецепта</small>}</div>}
        </div>
        <article className="ai-recipe-card ai-recipe-selected-card">
          <h3>{selectedRecipe.title}</h3>
          <p>{selectedRecipe.description}</p>
          <RecipeNutritionSummary recipe={selectedRecipe} />
          <details open><summary>Ингредиенты</summary><ul>{selectedRecipe.ingredients.map((item, index) => <li key={`${item.name}-${index}`}>{item.name} — {item.amount} {item.unit}</li>)}</ul>{selectedRecipe.missingIngredients.length > 0 && <p>Нужно докупить: {selectedRecipe.missingIngredients.join(', ')}</p>}</details>
          <details><summary>Как готовить</summary><ol>{selectedRecipe.steps.map((step, index) => <li key={index}>{step}</li>)}</ol></details>
          {(() => {
            const per100 = nutritionFor(selectedRecipe).per100;
            const grams = Number(plannedGrams);
            const factor = Number.isFinite(grams) && grams > 0 ? grams / 100 : 0;
            return <div className="ai-recipe-field">
              <label htmlFor="ai-recipe-grams">Количество, г</label>
              <input aria-label="Количество готового блюда в граммах" id="ai-recipe-grams" inputMode="numeric" onBlur={() => setPlannedGrams((value) => value ? String(Number.parseInt(value, 10)) : value)} onChange={(event) => { setPlannedGrams(event.target.value.replace(/\D/g, '')); setError(''); }} placeholder="Например, 145" type="text" value={plannedGrams} />
              {per100 && <small>КБЖУ для выбранного количества: {Math.round(per100.calories * factor)} ккал · Б {roundMacro(per100.protein * factor)} · Ж {roundMacro(per100.fat * factor)} · У {roundMacro(per100.carbs * factor)}</small>}
            </div>;
          })()}
          <button className="ai-recipe-add" disabled={Boolean(savingId) || !plannedGrams || Number(plannedGrams) <= 0 || !nutritionFor(selectedRecipe).per100} onClick={() => choose(selectedRecipe)} type="button">{savingId === selectedRecipe.id ? 'Добавляю…' : 'Добавить в план питания'}</button>
        </article>
        {error && <div className="ai-recipe-error">{error}</div>}
      </div> : <>
        <div className="ai-recipe-tabs"><button className={`ai-recipe-tab ${mode === 'products' ? 'is-active' : ''}`} onClick={() => { setMode('products'); resetResults(); }} type="button">По продуктам</button><button className={`ai-recipe-tab ${mode === 'photo' ? 'is-active' : ''}`} onClick={() => { setMode('photo'); resetResults(); }} type="button">По фото</button></div>
        <div className="ai-recipe-grid"><label className="ai-recipe-field">День<select onChange={(event) => setDay(event.target.value as MenuDay)} value={day}>{menuDays.map((item) => <option key={item}>{item}</option>)}</select></label><label className="ai-recipe-field">Приём пищи<select onChange={(event) => setSlot(event.target.value as MenuMealSlot)} value={slot}>{menuMealSlots.map((item) => <option key={item} value={item}>{menuSlotLabels[item]}</option>)}</select></label></div>
        <div className="ai-recipe-source">{mode === 'products' ? <label className="ai-recipe-field">Какие продукты есть<textarea onChange={(event) => setProducts(event.target.value)} placeholder="Например: курица, рис, помидоры, сыр" value={products} /></label> : <><label className="ai-recipe-file">📷 Нажмите, чтобы выбрать фото продуктов<input accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => void chooseImage(event.target.files?.[0])} type="file" /></label><p className="ai-recipe-photo-help">Сфотографируйте продукты сверху при хорошем освещении. Готовые блюда лучше анализировать в разделе КБЖУ по фото.</p>{preparingImage && <div className="ai-recipe-photo-help">Подготавливаю фотографию…</div>}{imageDataUrl && <img alt="Выбранные продукты" className="ai-recipe-preview" src={imageDataUrl} />}</>}</div>
        <button className="ai-recipe-primary" disabled={loading || preparingImage} onClick={generate} type="button">{preparingImage ? 'Обрабатываю фото…' : loading ? 'Подбираю 3 варианта…' : '✨ Подобрать 3 рецепта'}</button>
        {error && <div className="ai-recipe-error">{error}</div>}
        {recognizedProducts.length > 0 && <section className="ai-recipe-recognized"><div className="ai-recipe-recognized-title">ИИ распознал</div><div className="ai-recipe-recognized-list">{recognizedProducts.map((item) => <span className="ai-recipe-recognized-chip" key={item}>{item}</span>)}</div><button className="ai-recipe-recognized-edit" onClick={() => { const recognized = recognizedProducts.join(', '); setMode('products'); resetResults(); setProducts(recognized); }} type="button">Исправить список</button></section>}
        {suggestions.length > 0 && <><p className="ai-recipe-results-hint">Выберите вариант, затем сохраните его — после сохранения создадим изображение.</p><div className="ai-recipe-results">{suggestions.map((recipe) => <article className="ai-recipe-card" key={recipe.id}><h3>{recipe.title}</h3><p>{recipe.description}</p><RecipeNutritionSummary recipe={recipe} /><details><summary>Ингредиенты</summary><ul>{recipe.ingredients.map((item, index) => <li key={`${item.name}-${index}`}>{item.name} — {item.amount} {item.unit}</li>)}</ul>{recipe.missingIngredients.length > 0 && <p>Нужно докупить: {recipe.missingIngredients.join(', ')}</p>}</details><details><summary>Как готовить</summary><ol>{recipe.steps.map((step, index) => <li key={index}>{step}</li>)}</ol></details><button className="ai-recipe-add" onClick={() => selectRecipe(recipe)} type="button">Выбрать этот вариант</button></article>)}</div></>}
      </>}
    </section>
  </div>;
}
