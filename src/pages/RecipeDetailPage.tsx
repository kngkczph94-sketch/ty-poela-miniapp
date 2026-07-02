import { useEffect, useState } from 'react';
import { menuDays, menuMealSlots, menuSlotLabels, type MenuDay, type MenuMealSlot } from '../types/menu';
import { FoodPhotoPlaceholder, getRecipeFoodVariant } from '../components/FoodPhotoPlaceholder';
import { mealTypeLabels, type Recipe } from '../types/recipe';
import { createRecipeShareText, recipeCopiedMessage, shareRecipe } from '../utils/shareRecipe';

type RecipeDetailPageProps = {
  hasActiveSubscription: boolean;
  recipe: Recipe;
  onBack: () => void;
  onAddToMenu: (recipe: Recipe, day: MenuDay, slot: MenuMealSlot) => void;
  onOpenAccess: () => void;
  onOpenMenu: () => void;
};

type ActionState = {
  menu: boolean;
  cart: boolean;
  shared: boolean;
};

const nutritionItems = [
  { key: 'calories', label: 'ккал' },
  { key: 'protein', label: 'белки', suffix: ' г' },
  { key: 'fat', label: 'жиры', suffix: ' г' },
  { key: 'carbs', label: 'углеводы', suffix: ' г' },
] as const;

export function RecipeDetailPage({ hasActiveSubscription: _hasActiveSubscription, recipe, onBack, onAddToMenu, onOpenAccess: _onOpenAccess, onOpenMenu }: RecipeDetailPageProps) {
  const [actionState, setActionState] = useState<ActionState>({
    menu: false,
    cart: false,
    shared: false,
  });
  const [toastMessage, setToastMessage] = useState('');
  const [selectedDay, setSelectedDay] = useState<MenuDay>('Сегодня');
  const [selectedSlot, setSelectedSlot] = useState<MenuMealSlot>('breakfast');
  const [isMenuPickerOpen, setIsMenuPickerOpen] = useState(false);
  const [manualShareText, setManualShareText] = useState('');

  const showActionFeedback = (action: keyof ActionState, message: string) => {
    setActionState((current) => ({ ...current, [action]: true }));
    setToastMessage(message);
  };

  const handleOpenMenuPicker = () => {
    setIsMenuPickerOpen(true);
    setActionState((current) => ({ ...current, menu: false }));
    setToastMessage('');
  };

  const handleAddToMenu = () => {
    onAddToMenu(recipe, selectedDay, selectedSlot);
    setIsMenuPickerOpen(false);
    showActionFeedback('menu', `Готово: ${selectedDay}, ${menuSlotLabels[selectedSlot].toLowerCase()}. Белок есть, паники нет.`);
  };

  useEffect(() => {
    if (!toastMessage) return;

    const timer = window.setTimeout(() => setToastMessage(''), 2500);

    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const handleShareRecipe = async () => {
    try {
      const result = await shareRecipe(recipe);
      setActionState((current) => ({ ...current, shared: true }));

      if (result.status === 'copied') {
        setToastMessage(recipeCopiedMessage);
      }

      if (result.status === 'manual') {
        setManualShareText(result.shareText);
      }
    } catch {
      setManualShareText(createRecipeShareText(recipe));
    }
  };

  return (
    <section className="flex flex-1 flex-col">
      <button
        className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[#37410F] shadow-sm shadow-[#F3E2BF]/70 transition hover:-translate-x-0.5 hover:bg-[#F3E2BF]"
        onClick={onBack}
        type="button"
      >
        ← Назад к рецептам
      </button>

      <article className="overflow-hidden rounded-[2rem] bg-[#FFFDF8] shadow-xl shadow-[#F3E2BF]/70">
        <div className="bg-[#F3E2BF] p-6 text-[#37410F]">
          <FoodPhotoPlaceholder alt={recipe.title} className="mb-5 min-h-[15rem]" imageUrl={recipe.imageUrl} variant={getRecipeFoodVariant(recipe.id)} />
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#FBF6EC]/70 px-3 py-1 text-xs font-extrabold uppercase tracking-wide backdrop-blur">
              {mealTypeLabels[recipe.mealType]}
            </span>
            {recipe.isPremium && (
              <span className="rounded-full bg-[#D99663]/15 px-3 py-1 text-xs font-extrabold text-[#D99663]">Premium</span>
            )}
          </div>
          <h1 className="text-3xl font-black leading-tight tracking-tight">{recipe.title}</h1>
          <p className="mt-3 text-sm font-medium leading-6 text-[#8B725F]">{recipe.description}</p>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-4 gap-2 rounded-3xl bg-[#F3E2BF] p-3 text-center">
            {nutritionItems.map((item) => (
              <div key={item.key}>
                <p className="text-sm font-black text-[#37410F]">
                  {recipe[item.key]}
                  {'suffix' in item ? item.suffix : ''}
                </p>
                <p className="text-[11px] font-bold text-[#8B725F]">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm font-bold text-[#8B725F]">
            <div className="rounded-2xl bg-[#FFFDF8] p-3">⏱️<br />{recipe.cookingTime} мин</div>
            <div className="rounded-2xl bg-[#FFFDF8] p-3">🍽️<br />{recipe.servings} порц.</div>
            <div className="rounded-2xl bg-[#FFFDF8] p-3">🥗<br />{mealTypeLabels[recipe.mealType]}</div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <span className="rounded-full bg-[#F3E2BF] px-3 py-1 text-xs font-extrabold text-[#37410F]" key={tag}>
                #{tag}
              </span>
            ))}
          </div>

            <>
          {isMenuPickerOpen && (
            <div className="mt-5 rounded-3xl bg-[#F3E2BF] p-3">
              <p className="text-sm font-black text-[#37410F]">Куда добавить рецепт?</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-extrabold text-[#8B725F]">День</span>
                  <select
                    className="w-full rounded-2xl border border-[#8B725F]/35 bg-white px-3 py-3 text-sm font-bold text-[#37410F] outline-none focus:border-[#8B725F]/35 focus:ring-4 focus:ring-[#F3E2BF]"
                    onChange={(event) => setSelectedDay(event.target.value as MenuDay)}
                    value={selectedDay}
                  >
                    {menuDays.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-extrabold text-[#8B725F]">Прием пищи</span>
                  <select
                    className="w-full rounded-2xl border border-[#8B725F]/35 bg-white px-3 py-3 text-sm font-bold text-[#37410F] outline-none focus:border-[#8B725F]/35 focus:ring-4 focus:ring-[#F3E2BF]"
                    onChange={(event) => setSelectedSlot(event.target.value as MenuMealSlot)}
                    value={selectedSlot}
                  >
                    {menuMealSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {menuSlotLabels[slot]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                className="mt-3 w-full rounded-2xl bg-[#6E7E1F] px-4 py-3 text-base font-black text-white shadow-lg shadow-[#F3E2BF]/70 transition hover:bg-[#37410F]"
                onClick={handleAddToMenu}
                type="button"
              >
                Добавить в выбранный слот
              </button>
            </div>
          )}

          <div className="mt-3 grid gap-2">
            <button
              className={`rounded-2xl px-4 py-3 text-base font-black text-white shadow-lg transition ${
                actionState.menu ? 'bg-[#37410F] shadow-[#F3E2BF]/70' : 'bg-[#6E7E1F] shadow-[#F3E2BF]/70 hover:bg-[#37410F]'
              }`}
              onClick={handleOpenMenuPicker}
              type="button"
            >
              {actionState.menu ? 'Добавлено в План' : isMenuPickerOpen ? 'Выбери день и прием пищи' : 'Добавить в План'}
            </button>
            <button
              className="rounded-2xl bg-[#F3E2BF] px-4 py-3 text-base font-black text-[#37410F] transition hover:bg-[#F3E2BF]"
              onClick={() => {
                showActionFeedback('cart', 'Корзина собирается из Плана. Сначала выбери слот — без Excel.');
                setIsMenuPickerOpen(true);
              }}
              type="button"
            >
              Собрать корзину через План
            </button>
            <button
              className="rounded-2xl border border-[#8B725F]/35 bg-white px-4 py-3 text-base font-black text-[#37410F] transition hover:bg-[#FBF6EC]"
              onClick={handleShareRecipe}
              type="button"
            >
              {actionState.shared ? 'Поделиться ещё раз' : 'Поделиться'}
            </button>
          {actionState.menu && (
            <button
              className="mt-2 rounded-2xl border border-[#8B725F]/35 bg-[#F3E2BF] px-4 py-3 text-base font-black text-[#37410F] transition hover:bg-[#F3E2BF]"
              onClick={onOpenMenu}
              type="button"
            >
              Открыть План
            </button>
          )}
          </div>
            </>
        </div>
      </article>

      <>
      <section className="mt-5 rounded-3xl bg-[#FFFDF8] p-5 shadow-sm shadow-[#F3E2BF]/70">
        <h2 className="text-xl font-black text-[#37410F]">Ингредиенты</h2>
        <ul className="mt-3 space-y-2 text-sm font-semibold text-[#8B725F]">
          {recipe.ingredients.map((ingredient) => (
            <li className="flex items-center justify-between gap-2" key={`${ingredient.name}-${ingredient.unit}`}>
              <span><span className="mr-2">•</span>{ingredient.name}</span>
              <span className="rounded-full bg-[#F3E2BF] px-3 py-1 text-xs font-black text-[#37410F]">{ingredient.amount} {ingredient.unit}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-3xl bg-[#FFFDF8] p-5 shadow-sm shadow-[#F3E2BF]/70">
        <h2 className="text-xl font-black text-[#37410F]">Шаги приготовления</h2>
        <ol className="mt-3 space-y-3">
          {recipe.steps.map((step, index) => (
            <li className="flex gap-3 text-sm font-semibold leading-5 text-[#8B725F]" key={step}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3E2BF] text-xs font-black text-[#37410F]">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      </>

      {manualShareText && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#37410F]/50 px-4 pb-4 pt-10 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-[2rem] bg-[#FFFDF8] p-4 shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6E7E1F]">Поделиться</p>
                <h2 className="text-xl font-black text-[#37410F]">Скопируй рецепт вручную</h2>
              </div>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FBF6EC] text-lg font-black text-[#8B725F] transition hover:bg-[#F3E2BF]" onClick={() => setManualShareText('')} type="button">×</button>
            </div>
            <pre className="whitespace-pre-wrap rounded-2xl border border-[#8B725F]/30 bg-white p-4 text-sm font-semibold leading-6 text-[#37410F]">{manualShareText}</pre>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed inset-x-4 bottom-28 z-30 mx-auto max-w-sm rounded-2xl bg-[#37410F] px-4 py-3 text-center text-sm font-bold text-white shadow-2xl">
          {toastMessage}
        </div>
      )}
    </section>
  );
}
