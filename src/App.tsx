import { useState } from 'react';
import { CartPage } from './pages/CartPage';
import { MenuPage } from './pages/MenuPage';
import { ProgressPage } from './pages/ProgressPage';
import { RationDetailPage } from './pages/RationDetailPage';
import { RationsPage } from './pages/RationsPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { RecipesPage } from './pages/RecipesPage';
import { recipes } from './data/recipes';
import { createEmptyWeeklyMenu, type MenuDay, type MenuMealSlot } from './types/menu';
import type { DailyRation } from './types/ration';
import type { ProgressEntry } from './types/progress';
import type { Recipe } from './types/recipe';

const getStartAppRecipeId = (search: string) => {
  const startApp = new URLSearchParams(search).get('startapp');

  if (!startApp?.startsWith('recipe_')) {
    return null;
  }

  return startApp.replace(/^recipe_/, '');
};

type NavigationTab = 'home' | 'rations' | 'recipes' | 'menu' | 'cart' | 'access';

type SubscriptionStatus = 'free' | 'active';

type UserProfile = { subscriptionStatus: SubscriptionStatus; subscriptionUntil?: string };

const navigationItems: { id: NavigationTab; label: string; icon: string }[] = [
  { id: 'home', label: 'Главная', icon: '🏠' },
  { id: 'rations', label: 'Рационы', icon: '🥣' },
  { id: 'recipes', label: 'Рецепты', icon: '📖' },
  { id: 'menu', label: 'План', icon: '🍽️' },
  { id: 'cart', label: 'Корзина', icon: '🛒' },
];

function HomePage({ subscriptionStatus, onOpenAccess, onOpenRations, onOpenRecipes, onOpenCart, onOpenProgress }: { subscriptionStatus: SubscriptionStatus; onOpenAccess: () => void; onOpenRations: () => void; onOpenRecipes: () => void; onOpenCart: () => void; onOpenProgress: () => void }) {
  const cards = [
    { title: 'Рационы дня', description: 'Готовый день питания из 4 приёмов пищи', icon: '🥣', onClick: onOpenRations, tone: 'bg-orange-100 text-orange-700' },
    { title: 'Рассчитать БЖУ', description: 'Скоро', icon: '🧮', tone: 'bg-slate-100 text-slate-600' },
    { title: 'База знаний', description: 'Скоро', icon: '📚', tone: 'bg-emerald-100 text-emerald-700' },
    { title: 'ИИ-подбор рецепта', description: 'Скоро', icon: '✨', tone: 'bg-violet-100 text-violet-700' },
    { title: 'Прогресс', description: 'Мягкий трекер без давления', icon: '🌷', onClick: onOpenProgress, tone: 'bg-rose-100 text-rose-700' },
  ];
  return <>
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-500 via-amber-400 to-yellow-300 p-6 text-white shadow-xl shadow-orange-200/70"><div className="relative z-10"><p className="mb-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur">Telegram Mini App</p><h1 className="max-w-xs text-4xl font-black leading-tight tracking-tight">Ты поела?</h1><p className="mt-4 max-w-sm text-base font-medium leading-6 text-white/90">Рационы дня, План питания, рецепты и корзина продуктов внутри Telegram</p><button className="mt-6 rounded-2xl bg-white px-5 py-3 text-base font-bold text-orange-600 shadow-lg" onClick={onOpenRations} type="button">Выбрать рацион дня</button></div></section>
    <section className="mt-5 rounded-3xl border border-orange-100 bg-white p-4 shadow-sm shadow-orange-100"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">Статус доступа</p><h2 className="mt-1 text-lg font-black text-slate-950">{subscriptionStatus === 'active' ? 'Доступ активен' : 'Бесплатный доступ'}</h2><p className="mt-1 text-sm font-semibold text-slate-500">{subscriptionStatus === 'active' ? 'Premium-рационы открыты' : 'Открой premium-рационы и рецепты'}</p></div>{subscriptionStatus === 'free' && <button className="shrink-0 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white" onClick={onOpenAccess} type="button">Открыть доступ</button>}</div></section>
    <section className="mt-6 grid gap-3">{cards.map((card)=><article className={`rounded-3xl border border-orange-100 bg-white p-4 shadow-sm shadow-orange-100 ${card.onClick ? 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md' : ''}`} key={card.title} onClick={card.onClick}><div className="flex items-start gap-4"><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${card.tone}`}>{card.icon}</span><div><h2 className="text-lg font-extrabold text-slate-950">{card.title}</h2><p className="mt-1 text-sm leading-5 text-slate-500">{card.description}</p></div></div></article>)}</section>
    <section className="mt-7 grid grid-cols-2 gap-3"><button className="rounded-3xl bg-white p-4 text-left font-black text-orange-600 shadow-sm shadow-orange-100" onClick={onOpenRecipes} type="button">Открыть рецепты</button><button className="rounded-3xl bg-white p-4 text-left font-black text-orange-600 shadow-sm shadow-orange-100" onClick={onOpenCart} type="button">Корзина</button></section>
  </>;
}
function AccessPage({
  subscriptionStatus,
  subscriptionUntil,
  onActivate,
  onOpenRecipes,
}: {
  subscriptionStatus: SubscriptionStatus;
  subscriptionUntil?: string;
  onActivate: () => void;
  onOpenRecipes: () => void;
}) {
  const formattedUntil = subscriptionUntil
    ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(subscriptionUntil))
    : null;

  return (
    <section className="flex flex-1 flex-col">
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-orange-600 to-amber-400 p-6 text-white shadow-xl shadow-orange-200/70">
        <p className="text-sm font-bold uppercase tracking-wide text-white/75">Подписка</p>
        <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight">Открой рецепты, меню и корзину</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-white/90">Готовые решения по питанию внутри Telegram</p>
      </div>

      {subscriptionStatus === 'active' && (
        <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-800 shadow-sm shadow-emerald-100">
          <p className="text-3xl">✅</p>
          <h2 className="mt-2 text-xl font-black">Доступ открыт</h2>
          <p className="mt-1 text-sm font-bold">Premium-рецепты, меню и корзина доступны{formattedUntil ? ` до ${formattedUntil}` : ''}.</p>
        </div>
      )}

      <article className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl shadow-orange-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">Тариф</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Неделя доступа</h2>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-700">Premium</span>
        </div>

        <div className="mt-5 space-y-3">
          {[
            'полный каталог рецептов',
            'видео-рецепты',
            'меню на неделю',
            'автокорзина продуктов',
            'шер-карточки',
            'трекер прогресса без давления',
          ].map((item) => (
            <p className="flex items-center gap-3 text-sm font-bold text-slate-700" key={item}>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-50 text-orange-600">✓</span>
              {item}
            </p>
          ))}
        </div>

        <button
          className="mt-6 w-full rounded-2xl bg-orange-500 px-4 py-3 text-base font-black text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
          onClick={onActivate}
          type="button"
        >
          {subscriptionStatus === 'active' ? 'Продлить mock-доступ' : 'Открыть полный доступ'}
        </button>
        <p className="mt-3 text-center text-xs font-bold text-slate-400">Mock-режим: настоящие Telegram Stars пока не подключены.</p>
      </article>

      <button
        className="mt-4 rounded-2xl bg-white px-4 py-3 text-base font-black text-orange-600 shadow-sm shadow-orange-100 transition hover:bg-orange-50"
        onClick={onOpenRecipes}
        type="button"
      >
        Вернуться в каталог
      </button>
    </section>
  );
}

function App() {
  const startAppRecipeId = getStartAppRecipeId(window.location.search);
  const initialRecipe = startAppRecipeId ? recipes.find((recipe) => recipe.id === startAppRecipeId) ?? null : null;
  const [activeTab, setActiveTab] = useState<NavigationTab>(startAppRecipeId ? 'recipes' : 'home');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(initialRecipe);
  const [selectedRation, setSelectedRation] = useState<DailyRation | null>(null);
  const [recipeToOpenAfterAccess, setRecipeToOpenAfterAccess] = useState<Recipe | null>(initialRecipe);
  const [weeklyMenu, setWeeklyMenu] = useState(createEmptyWeeklyMenu);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [showProgressCard, setShowProgressCard] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({ subscriptionStatus: 'free' });
  const hasActiveSubscription = userProfile.subscriptionStatus === 'active';

  const openRecipes = () => { setSelectedRecipe(null); setSelectedRation(null); setActiveTab('recipes'); };
  const openRecipe = (recipe: Recipe) => { setSelectedRecipe(recipe); setSelectedRation(null); setActiveTab('recipes'); };
  const openRations = () => { setSelectedRation(null); setSelectedRecipe(null); setActiveTab('rations'); };
  const openAccess = (recipe?: Recipe) => { setRecipeToOpenAfterAccess(recipe ?? selectedRecipe); setActiveTab('access'); };
  const activateSubscription = () => { const until = new Date(); until.setDate(until.getDate() + 7); setUserProfile({ subscriptionStatus: 'active', subscriptionUntil: until.toISOString() }); if (recipeToOpenAfterAccess) { setSelectedRecipe(recipeToOpenAfterAccess); setRecipeToOpenAfterAccess(null); setActiveTab('recipes'); } };

  const addRecipeToMenu = (recipe: Recipe, day: MenuDay, slot: MenuMealSlot) => {
    setWeeklyMenu((currentMenu) => ({ ...currentMenu, [day]: { ...currentMenu[day], meals: { ...currentMenu[day].meals, [slot]: recipe } } }));
  };
  const addRationToPlan = (ration: DailyRation, meals: DailyRation['meals'], days: MenuDay[]) => {
    setWeeklyMenu((currentMenu) => days.reduce((nextMenu, day) => ({ ...nextMenu, [day]: { rationId: ration.id, rationNumber: ration.rationNumber, meals: { ...meals } } }), currentMenu));
  };
  const removeRecipeFromMenu = (day: MenuDay, slot: MenuMealSlot) => setWeeklyMenu((currentMenu) => ({ ...currentMenu, [day]: { ...currentMenu[day], meals: { ...currentMenu[day].meals, [slot]: null } } }));
  const addProgressEntry = (entry: ProgressEntry) => setProgressEntries((currentEntries) => [...currentEntries, entry]);
  const deleteProgressEntry = (entryId: string) => setProgressEntries((currentEntries) => currentEntries.filter((entry) => entry.id !== entryId));

  return <main className="min-h-screen bg-cream text-slate-950"><div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-5">
    {showProgressCard ? <ProgressPage entries={progressEntries} onAddEntry={addProgressEntry} onDeleteEntry={deleteProgressEntry} /> : activeTab === 'recipes' ? (selectedRecipe ? <RecipeDetailPage hasActiveSubscription={hasActiveSubscription} recipe={selectedRecipe} onAddToMenu={addRecipeToMenu} onBack={() => setSelectedRecipe(null)} onOpenAccess={() => openAccess(selectedRecipe)} onOpenMenu={() => setActiveTab('menu')} /> : <RecipesPage hasActiveSubscription={hasActiveSubscription} onOpenAccess={() => openAccess()} onOpenRecipe={openRecipe} />) : activeTab === 'rations' ? (selectedRation ? <RationDetailPage ration={selectedRation} hasActiveSubscription={hasActiveSubscription} onBack={() => setSelectedRation(null)} onOpenAccess={() => openAccess()} onOpenRecipe={openRecipe} onAddRationToPlan={addRationToPlan} /> : <RationsPage hasActiveSubscription={hasActiveSubscription} onOpenAccess={() => openAccess()} onOpenRation={setSelectedRation} />) : activeTab === 'menu' ? <MenuPage weeklyMenu={weeklyMenu} onOpenCart={() => setActiveTab('cart')} onOpenRations={openRations} onOpenRecipe={openRecipe} onRemoveRecipe={removeRecipeFromMenu} /> : activeTab === 'cart' ? <CartPage weeklyMenu={weeklyMenu} onOpenRecipes={openRations} /> : activeTab === 'access' ? <AccessPage subscriptionUntil={userProfile.subscriptionUntil} subscriptionStatus={userProfile.subscriptionStatus} onActivate={activateSubscription} onOpenRecipes={openRecipes} /> : <HomePage subscriptionStatus={userProfile.subscriptionStatus} onOpenAccess={() => openAccess()} onOpenRations={openRations} onOpenCart={() => setActiveTab('cart')} onOpenRecipes={openRecipes} onOpenProgress={() => setShowProgressCard(true)} />}
  </div><nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-orange-100 bg-white/95 px-4 pb-5 pt-3 shadow-2xl shadow-orange-100 backdrop-blur"><div className="grid grid-cols-5 gap-1">{navigationItems.map((item)=><button className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-bold transition ${activeTab === item.id && !showProgressCard ? 'bg-orange-50 text-orange-600' : 'text-slate-400 hover:text-slate-600'}`} key={item.id} onClick={()=>{ setShowProgressCard(false); setActiveTab(item.id); setSelectedRecipe(null); setSelectedRation(null); }} type="button"><span className="text-lg">{item.icon}</span>{item.label}</button>)}</div></nav></main>;
}

export default App;
