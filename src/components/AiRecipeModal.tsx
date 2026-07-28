import { useEffect, useState } from 'react';
import {
  generateRecipeImage,
  suggestRecipes,
  type RecipeSuggestion,
} from '../data/recipeSuggestionRepository';
import { menuDays, menuMealSlots, menuSlotLabels, type MenuDay, type MenuMealSlot } from '../types/menu';
import './AiRecipeModal.css';

type Props = {
  initialDay?: MenuDay;
  initialSlot?: MenuMealSlot;
  onClose: () => void;
  onChoose: (recipe: RecipeSuggestion, day: MenuDay, slot: MenuMealSlot) => Promise<void>;
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function AiRecipeModal({ initialDay = 'Сегодня', initialSlot = 'breakfast', onClose, onChoose }: Props) {
  const [mode, setMode] = useState<'products' | 'photo'>('products');
  const [products, setProducts] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [day, setDay] = useState<MenuDay>(initialDay);
  const [slot, setSlot] = useState<MenuMealSlot>(initialSlot);
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  const resetResults = () => {
    setSuggestions([]);
    setSelectedRecipe(null);
    setImageError('');
  };

  const chooseImage = (file?: File) => {
    setError('');
    resetResults();
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Выберите фотографию JPG, PNG или WebP.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Фотография должна быть не больше 5 МБ.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(String(reader.result ?? ''));
    reader.onerror = () => setError('Не удалось прочитать фотографию.');
    reader.readAsDataURL(file);
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
      setSuggestions(await suggestRecipes(input));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось подобрать рецепты.');
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedImage = async (recipe: RecipeSuggestion) => {
    setSelectedRecipe(recipe);
    setImageLoading(true);
    setImageError('');
    try {
      const imageUrl = await generateRecipeImage(recipe);
      setSelectedRecipe((current) => current?.id === recipe.id ? { ...current, imageUrl } : current);
    } catch {
      setImageError('Фото не загрузилось. Можно повторить или добавить рецепт без фото.');
    } finally {
      setImageLoading(false);
    }
  };

  const choose = async (recipe: RecipeSuggestion) => {
    setSavingId(recipe.id);
    setError('');
    try {
      await onChoose(recipe, day, slot);
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
          {imageLoading && <div className="ai-recipe-image-loading"><span>✨</span><strong>Создаю фото блюда…</strong><small>Оно появится только у выбранного рецепта</small></div>}
          {!imageLoading && selectedRecipe.imageUrl && <img alt={selectedRecipe.title} className="ai-recipe-generated-image" src={selectedRecipe.imageUrl} />}
          {!imageLoading && !selectedRecipe.imageUrl && <div className="ai-recipe-image-fallback"><span>🍽️</span><strong>Рецепт готов</strong>{imageError && <small>{imageError}</small>}<button onClick={() => loadSelectedImage(selectedRecipe)} type="button">Повторить создание фото</button></div>}
        </div>
        <article className="ai-recipe-card ai-recipe-selected-card">
          <h3>{selectedRecipe.title}</h3>
          <p>{selectedRecipe.description}</p>
          <div className="ai-recipe-meta"><span className="ai-recipe-chip">{selectedRecipe.calories} ккал</span><span className="ai-recipe-chip">Б {selectedRecipe.protein}</span><span className="ai-recipe-chip">Ж {selectedRecipe.fat}</span><span className="ai-recipe-chip">У {selectedRecipe.carbs}</span><span className="ai-recipe-chip">⏱ {selectedRecipe.cookingTime} мин</span></div>
          <details open><summary>Ингредиенты</summary><ul>{selectedRecipe.ingredients.map((item, index) => <li key={`${item.name}-${index}`}>{item.name} — {item.amount} {item.unit}</li>)}</ul>{selectedRecipe.missingIngredients.length > 0 && <p>Нужно докупить: {selectedRecipe.missingIngredients.join(', ')}</p>}</details>
          <details><summary>Как готовить</summary><ol>{selectedRecipe.steps.map((step, index) => <li key={index}>{step}</li>)}</ol></details>
          <button className="ai-recipe-add" disabled={Boolean(savingId)} onClick={() => choose(selectedRecipe)} type="button">{savingId === selectedRecipe.id ? 'Добавляю…' : 'Добавить в план питания'}</button>
        </article>
        {error && <div className="ai-recipe-error">{error}</div>}
      </div> : <>
        <div className="ai-recipe-tabs"><button className={`ai-recipe-tab ${mode === 'products' ? 'is-active' : ''}`} onClick={() => { setMode('products'); resetResults(); }} type="button">По продуктам</button><button className={`ai-recipe-tab ${mode === 'photo' ? 'is-active' : ''}`} onClick={() => { setMode('photo'); resetResults(); }} type="button">По фото</button></div>
        <div className="ai-recipe-grid"><label className="ai-recipe-field">День<select onChange={(event) => setDay(event.target.value as MenuDay)} value={day}>{menuDays.map((item) => <option key={item}>{item}</option>)}</select></label><label className="ai-recipe-field">Приём пищи<select onChange={(event) => setSlot(event.target.value as MenuMealSlot)} value={slot}>{menuMealSlots.map((item) => <option key={item} value={item}>{menuSlotLabels[item]}</option>)}</select></label></div>
        <div className="ai-recipe-source">{mode === 'products' ? <label className="ai-recipe-field">Какие продукты есть<textarea onChange={(event) => setProducts(event.target.value)} placeholder="Например: курица, рис, помидоры, сыр" value={products} /></label> : <><label className="ai-recipe-file">📷 Нажмите, чтобы выбрать фото<input accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseImage(event.target.files?.[0])} type="file" /></label>{imageDataUrl && <img alt="Выбранные продукты" className="ai-recipe-preview" src={imageDataUrl} />}</>}</div>
        <button className="ai-recipe-primary" disabled={loading} onClick={generate} type="button">{loading ? 'Подбираю 3 варианта…' : '✨ Подобрать 3 рецепта'}</button>
        {error && <div className="ai-recipe-error">{error}</div>}
        {suggestions.length > 0 && <><p className="ai-recipe-results-hint">Выберите один вариант — только тогда создадим его фото.</p><div className="ai-recipe-results">{suggestions.map((recipe) => <article className="ai-recipe-card" key={recipe.id}><h3>{recipe.title}</h3><p>{recipe.description}</p><div className="ai-recipe-meta"><span className="ai-recipe-chip">{recipe.calories} ккал</span><span className="ai-recipe-chip">Б {recipe.protein}</span><span className="ai-recipe-chip">Ж {recipe.fat}</span><span className="ai-recipe-chip">У {recipe.carbs}</span><span className="ai-recipe-chip">⏱ {recipe.cookingTime} мин</span></div><details><summary>Ингредиенты</summary><ul>{recipe.ingredients.map((item, index) => <li key={`${item.name}-${index}`}>{item.name} — {item.amount} {item.unit}</li>)}</ul>{recipe.missingIngredients.length > 0 && <p>Нужно докупить: {recipe.missingIngredients.join(', ')}</p>}</details><details><summary>Как готовить</summary><ol>{recipe.steps.map((step, index) => <li key={index}>{step}</li>)}</ol></details><button className="ai-recipe-add" disabled={imageLoading} onClick={() => loadSelectedImage(recipe)} type="button">Выбрать этот вариант</button></article>)}</div></>}
      </>}
    </section>
  </div>;
}
