import { useState } from 'react';
import { RecipeShareCard, createRecipeDeepLink } from '../components/RecipeShareCard';
import { menuDays, menuMealSlots, menuSlotLabels, type MenuDay, type MenuMealSlot } from '../types/menu';
import { mealTypeLabels, type Recipe } from '../types/recipe';

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

export function RecipeDetailPage({ hasActiveSubscription, recipe, onBack, onAddToMenu, onOpenAccess, onOpenMenu }: RecipeDetailPageProps) {
  const [actionState, setActionState] = useState<ActionState>({
    menu: false,
    cart: false,
    shared: false,
  });
  const [toastMessage, setToastMessage] = useState('');
  const [selectedDay, setSelectedDay] = useState<MenuDay>('Сегодня');
  const [selectedSlot, setSelectedSlot] = useState<MenuMealSlot>('breakfast');
  const [isMenuPickerOpen, setIsMenuPickerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const deepLink = createRecipeDeepLink(recipe.id);
  const isPremiumPreview = recipe.isPremium && !hasActiveSubscription;

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

  const copyToClipboard = async (value: string, successMessage: string) => {
    if (!navigator.clipboard) {
      setToastMessage('Скопируй вручную: буфер обмена недоступен');
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setToastMessage(successMessage);
    } catch {
      setToastMessage('Скопируй вручную: буфер обмена недоступен');
    }
  };

  const shareText = [
    `Рецепт “${recipe.title}”`,
    '',
    'КБЖУ:',
    `Калории: ${recipe.calories} ккал`,
    `Белки: ${recipe.protein} г`,
    `Жиры: ${recipe.fat} г`,
    `Углеводы: ${recipe.carbs} г`,
    '',
    'Открыть рецепт:',
    deepLink,
  ].join('\n');

  return (
    <section className="flex flex-1 flex-col">
      <button
        className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-orange-600 shadow-sm shadow-orange-100 transition hover:-translate-x-0.5 hover:bg-orange-50"
        onClick={onBack}
        type="button"
      >
        ← Назад к рецептам
      </button>

      <article className="overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-orange-100">
        <div className="bg-gradient-to-br from-orange-500 via-amber-400 to-yellow-300 p-6 text-white">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/25 px-3 py-1 text-xs font-extrabold uppercase tracking-wide backdrop-blur">
              {mealTypeLabels[recipe.mealType]}
            </span>
            {recipe.isPremium && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-amber-700">Premium</span>
            )}
          </div>
          <h1 className="text-3xl font-black leading-tight tracking-tight">{recipe.title}</h1>
          <p className="mt-3 text-sm font-medium leading-6 text-white/90">{recipe.description}</p>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-4 gap-2 rounded-3xl bg-orange-50 p-3 text-center">
            {nutritionItems.map((item) => (
              <div key={item.key}>
                <p className="text-sm font-black text-slate-900">
                  {recipe[item.key]}
                  {'suffix' in item ? item.suffix : ''}
                </p>
                <p className="text-[11px] font-bold text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm font-bold text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-3">⏱️<br />{recipe.cookingTime} мин</div>
            <div className="rounded-2xl bg-slate-50 p-3">🍽️<br />{recipe.servings} порц.</div>
            <div className="rounded-2xl bg-slate-50 p-3">🥗<br />{mealTypeLabels[recipe.mealType]}</div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700" key={tag}>
                #{tag}
              </span>
            ))}
          </div>

          {isPremiumPreview ? (
            <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-center">
              <p className="text-4xl">🔒</p>
              <h2 className="mt-3 text-xl font-black text-slate-950">Открой полный рецепт, меню и корзину</h2>
              <p className="mt-2 text-sm font-semibold leading-5 text-slate-600">
                Ингредиенты, шаги приготовления, добавление в меню и автокорзина доступны после mock-подписки. Ты не слабая. Ты просто не планировала еду.
              </p>
              <button
                className="mt-4 w-full rounded-2xl bg-orange-500 px-4 py-3 text-base font-black text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
                onClick={onOpenAccess}
                type="button"
              >
                Открыть полный доступ
              </button>
            </div>
          ) : (
            <>
          {isMenuPickerOpen && (
            <div className="mt-5 rounded-3xl bg-orange-50 p-3">
              <p className="text-sm font-black text-slate-950">Куда добавить рецепт?</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-extrabold text-slate-500">День</span>
                  <select
                    className="w-full rounded-2xl border border-orange-100 bg-white px-3 py-3 text-sm font-bold text-slate-900 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
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
                  <span className="mb-1 block text-xs font-extrabold text-slate-500">Прием пищи</span>
                  <select
                    className="w-full rounded-2xl border border-orange-100 bg-white px-3 py-3 text-sm font-bold text-slate-900 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
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
                className="mt-3 w-full rounded-2xl bg-orange-500 px-4 py-3 text-base font-black text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
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
                actionState.menu ? 'bg-emerald-500 shadow-emerald-100' : 'bg-orange-500 shadow-orange-200 hover:bg-orange-600'
              }`}
              onClick={handleOpenMenuPicker}
              type="button"
            >
              {actionState.menu ? 'Добавлено в План' : isMenuPickerOpen ? 'Выбери день и прием пищи' : 'Добавить в План'}
            </button>
            <button
              className="rounded-2xl bg-orange-50 px-4 py-3 text-base font-black text-orange-600 transition hover:bg-orange-100"
              onClick={() => {
                showActionFeedback('cart', 'Корзина собирается из Плана. Сначала выбери слот — без Excel.');
                setIsMenuPickerOpen(true);
              }}
              type="button"
            >
              Собрать корзину через План
            </button>
            <button
              className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-base font-black text-slate-700 transition hover:bg-slate-50"
              onClick={() => {
                setIsShareModalOpen(true);
                setActionState((current) => ({ ...current, shared: true }));
                setToastMessage('');
              }}
              type="button"
            >
              {actionState.shared ? 'Поделиться ещё раз' : 'Поделиться'}
            </button>
          {actionState.menu && (
            <button
              className="mt-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-base font-black text-emerald-700 transition hover:bg-emerald-100"
              onClick={onOpenMenu}
              type="button"
            >
              Открыть План
            </button>
          )}
          </div>
            </>
          )}
        </div>
      </article>

      {!isPremiumPreview && (
        <>
      <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm shadow-orange-100">
        <h2 className="text-xl font-black text-slate-950">Ингредиенты</h2>
        <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-600">
          {recipe.ingredients.map((ingredient) => (
            <li className="flex items-center justify-between gap-2" key={`${ingredient.name}-${ingredient.unit}`}>
              <span><span className="mr-2">•</span>{ingredient.name}</span>
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-600">{ingredient.amount} {ingredient.unit}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm shadow-orange-100">
        <h2 className="text-xl font-black text-slate-950">Шаги приготовления</h2>
        <ol className="mt-3 space-y-3">
          {recipe.steps.map((step, index) => (
            <li className="flex gap-3 text-sm font-semibold leading-5 text-slate-600" key={step}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-black text-orange-600">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

        </>
      )}

      {isShareModalOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/50 px-4 pb-4 pt-10 backdrop-blur-sm sm:items-center">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">Поделиться</p>
                <h2 className="text-xl font-black text-slate-950">Шер-карточка рецепта</h2>
              </div>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-500 transition hover:bg-slate-200"
                onClick={() => setIsShareModalOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <RecipeShareCard deepLink={deepLink} recipe={recipe} />

            <div className="mt-4 grid gap-2">
              <button
                className="rounded-2xl bg-orange-500 px-4 py-3 text-base font-black text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
                onClick={() => copyToClipboard(deepLink, 'Ссылка скопирована')}
                type="button"
              >
                Скопировать ссылку
              </button>
              <button
                className="rounded-2xl bg-orange-50 px-4 py-3 text-base font-black text-orange-600 transition hover:bg-orange-100"
                onClick={() => copyToClipboard(shareText, 'Текст скопирован')}
                type="button"
              >
                Скопировать текст
              </button>
              <button
                className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-base font-black text-slate-600 transition hover:bg-slate-50"
                onClick={() => setIsShareModalOpen(false)}
                type="button"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed inset-x-4 bottom-28 z-30 mx-auto max-w-sm rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white shadow-2xl">
          {toastMessage}
        </div>
      )}
    </section>
  );
}
