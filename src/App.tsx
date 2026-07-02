import { useEffect, useState } from 'react';
import { CartPage } from './pages/CartPage';
import { MacroCalculatorPage } from './pages/MacroCalculatorPage';
import { MenuPage } from './pages/MenuPage';
import { ProgressPage } from './pages/ProgressPage';
import { RationDetailPage } from './pages/RationDetailPage';
import { RationsPage } from './pages/RationsPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { RecipesPage } from './pages/RecipesPage';
import { FoodPhotoPlaceholder } from './components/FoodPhotoPlaceholder';
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

type NavigationTab = 'home' | 'rations' | 'recipes' | 'menu' | 'cart' | 'access' | 'macros';

type SubscriptionStatus = 'free' | 'active';

type UserProfile = { subscriptionStatus: SubscriptionStatus; subscriptionUntil?: string };

const navigationItems: { id: NavigationTab; label: string; icon: string }[] = [
  { id: 'home', label: 'Главная', icon: '🏠' },
  { id: 'rations', label: 'Рационы', icon: '🥣' },
  { id: 'recipes', label: 'Рецепты', icon: '📖' },
  { id: 'menu', label: 'План', icon: '🍽️' },
  { id: 'cart', label: 'Корзина', icon: '🛒' },
];

function HomePage({ subscriptionStatus, onOpenAccess, onOpenRations, onOpenRecipes, onOpenCart, onOpenProgress, onOpenMacros }: { subscriptionStatus: SubscriptionStatus; onOpenAccess: () => void; onOpenRations: () => void; onOpenRecipes: () => void; onOpenCart: () => void; onOpenProgress: () => void; onOpenMacros: () => void }) {
  const cards = [
    { title: 'Рационы дня', description: 'Готовый день питания из 4 приёмов пищи', icon: '🥣', onClick: onOpenRations, tone: 'bg-[#F3E2BF] text-[#6E7E1F]' },
    { title: 'Рассчитать БЖУ', description: 'Калории, БЖУ и подгонка рациона', icon: '🧮', onClick: onOpenMacros, tone: 'bg-[#F3E2BF] text-[#6E7E1F]' },
    { title: 'Рецепты', description: 'Тёплые блюда на каждый день', icon: '📖', onClick: onOpenRecipes, tone: 'bg-[#F3E2BF] text-[#6E7E1F]' },
    { title: 'База знаний', description: 'Мягкие подсказки о питании', icon: '📚', soon: true, tone: 'bg-[#F3E2BF] text-[#6E7E1F]' },
    { title: 'ИИ-подбор', description: 'Персональный подбор рецептов', icon: '✨', soon: true, tone: 'bg-[#F3E2BF] text-[#6E7E1F]' },
    { title: 'Прогресс', description: 'Мягкий трекер без давления', icon: '🌷', onClick: onOpenProgress, tone: 'bg-[#F3E2BF] text-[#6E7E1F]' },
  ];
  return <>
    <section className="relative overflow-hidden rounded-[2rem] border border-[#D99663]/35 bg-[#FFFDF8] p-4 text-[#37410F] shadow-xl shadow-[#D99663]/20"><FoodPhotoPlaceholder className="min-h-[13.5rem]" variant="hero" /><div className="absolute inset-x-4 bottom-4 rounded-b-[1.75rem] bg-gradient-to-t from-[#2F240F]/70 via-[#2F240F]/30 to-transparent p-5 pt-16 text-white"><p className="mb-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-sm font-bold backdrop-blur">Telegram Mini App</p><h1 className="max-w-xs text-4xl font-black leading-tight tracking-tight">Ты поела?</h1><p className="mt-3 max-w-sm text-base font-semibold leading-6 text-white/90">Рационы, рецепты и план питания внутри Telegram</p><button className="mt-5 rounded-2xl bg-[#6E7E1F] px-5 py-3 text-base font-bold text-white shadow-lg shadow-[#2F240F]/25 transition hover:bg-[#37410F]" onClick={onOpenRations} type="button">Выбрать рацион дня</button></div></section>
    <section className="mt-5 overflow-hidden rounded-[2rem] border border-[#D99663]/25 bg-[#FFFDF8] p-4 shadow-lg shadow-[#F3E2BF]/80"><div className="grid gap-5 sm:grid-cols-[1fr_10rem] sm:items-center"><div className="p-2"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#6E7E1F]">Сегодня можно проще</p><h2 className="mt-2 text-2xl font-black leading-tight text-[#37410F]">Тёплый food-блок для спокойного выбора</h2><p className="mt-3 text-sm font-semibold leading-6 text-[#8B725F]">Собери день питания, добавь его в План — и получи понятную корзину без лишней суеты.</p><button className="mt-4 rounded-2xl bg-[#F3E2BF] px-4 py-3 text-sm font-black text-[#37410F]" onClick={onOpenRecipes} type="button">Посмотреть рецепты</button></div><FoodPhotoPlaceholder className="min-h-[10rem]" variant="salad" /></div></section>
    <section className="mt-5 rounded-3xl border border-[#D99663]/25 bg-[#FFFDF8] p-4 shadow-sm shadow-[#F3E2BF]/70"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#6E7E1F]">Статус доступа</p><h2 className="mt-1 text-lg font-black text-[#37410F]">{subscriptionStatus === 'active' ? 'Доступ активен' : 'Бесплатный доступ'}</h2><p className="mt-1 text-sm font-semibold text-[#8B725F]">{subscriptionStatus === 'active' ? 'Premium-рационы открыты' : 'Открой premium-рационы и рецепты'}</p></div>{subscriptionStatus === 'free' && <button className="shrink-0 rounded-2xl bg-[#6E7E1F] px-4 py-3 text-sm font-black text-white transition hover:bg-[#37410F]" onClick={onOpenAccess} type="button">Открыть доступ</button>}</div></section>
    <section className="mt-6 grid gap-3">{cards.map((card) => {
      const content = <div className="flex items-start gap-4"><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${card.tone}`}>{card.icon}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="text-lg font-extrabold text-[#37410F]">{card.title}</h2>{card.soon && <span className="rounded-full bg-[#D99663]/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#D99663]">скоро</span>}</div><p className="mt-1 text-sm leading-5 text-[#8B725F]">{card.description}</p></div></div>;
      const className = `rounded-3xl border border-[#D99663]/20 bg-[#FFFDF8] p-5 text-left shadow-sm shadow-[#F3E2BF]/70 ${card.onClick ? 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md' : ''}`;

      return card.onClick ? <button className={className} key={card.title} onClick={card.onClick} type="button">{content}</button> : <article className={className} key={card.title}>{content}</article>;
    })}</section>
    <section className="mt-7 grid grid-cols-2 gap-3"><button className="rounded-3xl bg-[#FFFDF8] p-4 text-left font-black text-[#37410F] shadow-sm shadow-[#F3E2BF]/70" onClick={onOpenRecipes} type="button">Открыть рецепты</button><button className="rounded-3xl bg-[#FFFDF8] p-4 text-left font-black text-[#37410F] shadow-sm shadow-[#F3E2BF]/70" onClick={onOpenCart} type="button">Корзина</button></section>
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
      <div className="overflow-hidden rounded-[2rem] bg-[#F3E2BF] p-6 text-[#37410F] shadow-xl shadow-[#F3E2BF]/70">
        <p className="text-sm font-bold uppercase tracking-wide text-[#8B725F]">Подписка</p>
        <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight">Открой рецепты, меню и корзину</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-[#8B725F]">Готовые решения по питанию внутри Telegram</p>
      </div>

      {subscriptionStatus === 'active' && (
        <div className="mt-5 rounded-3xl border border-[#8B725F]/35 bg-[#F3E2BF] p-5 text-[#37410F] shadow-sm shadow-[#F3E2BF]/70">
          <p className="text-3xl">✅</p>
          <h2 className="mt-2 text-xl font-black">Доступ открыт</h2>
          <p className="mt-1 text-sm font-bold">Premium-рецепты, меню и корзина доступны{formattedUntil ? ` до ${formattedUntil}` : ''}.</p>
        </div>
      )}

      <article className="mt-5 rounded-[2rem] bg-[#FFFDF8] p-5 shadow-xl shadow-[#F3E2BF]/70">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6E7E1F]">Тариф</p>
            <h2 className="mt-1 text-2xl font-black text-[#37410F]">Неделя доступа</h2>
          </div>
          <span className="rounded-full bg-[#D99663]/15 px-3 py-1 text-xs font-extrabold text-[#D99663]">Premium</span>
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
            <p className="flex items-center gap-3 text-sm font-bold text-[#37410F]" key={item}>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F3E2BF] text-[#37410F]">✓</span>
              {item}
            </p>
          ))}
        </div>

        <button
          className="mt-6 w-full rounded-2xl bg-[#6E7E1F] px-4 py-3 text-base font-black text-white shadow-lg shadow-[#F3E2BF]/70 transition hover:bg-[#37410F]"
          onClick={onActivate}
          type="button"
        >
          {subscriptionStatus === 'active' ? 'Продлить mock-доступ' : 'Открыть полный доступ'}
        </button>
        <p className="mt-3 text-center text-xs font-bold text-[#8B725F]">Mock-режим: настоящие Telegram Stars пока не подключены.</p>
      </article>

      <button
        className="mt-4 rounded-2xl bg-white px-4 py-3 text-base font-black text-[#37410F] shadow-sm shadow-[#F3E2BF]/70 transition hover:bg-[#F3E2BF]"
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
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>(() => {
    try {
      const savedEntries = window.localStorage.getItem('ty-poela-progress-entries');
      return savedEntries ? JSON.parse(savedEntries) as ProgressEntry[] : [];
    } catch {
      return [];
    }
  });
  const [showProgressCard, setShowProgressCard] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({ subscriptionStatus: 'free' });
  const hasActiveSubscription = userProfile.subscriptionStatus === 'active';

  const openRecipes = () => { setSelectedRecipe(null); setSelectedRation(null); setActiveTab('recipes'); };
  const openRecipe = (recipe: Recipe) => { setSelectedRecipe(recipe); setSelectedRation(null); setActiveTab('recipes'); };
  const openRations = () => { setSelectedRation(null); setSelectedRecipe(null); setActiveTab('rations'); };
  const openMacros = () => { setSelectedRation(null); setSelectedRecipe(null); setShowProgressCard(false); setActiveTab('macros'); };
  const openRation = (ration: DailyRation) => { setSelectedRation(ration); setSelectedRecipe(null); setShowProgressCard(false); setActiveTab('rations'); };
  const openAccess = (recipe?: Recipe) => { setRecipeToOpenAfterAccess(recipe ?? selectedRecipe); setActiveTab('access'); };
  const activateSubscription = () => { const until = new Date(); until.setDate(until.getDate() + 7); setUserProfile({ subscriptionStatus: 'active', subscriptionUntil: until.toISOString() }); if (recipeToOpenAfterAccess) { setSelectedRecipe(recipeToOpenAfterAccess); setRecipeToOpenAfterAccess(null); setActiveTab('recipes'); } };

  const addRecipeToMenu = (recipe: Recipe, day: MenuDay, slot: MenuMealSlot) => {
    setWeeklyMenu((currentMenu) => ({ ...currentMenu, [day]: { ...currentMenu[day], meals: { ...currentMenu[day].meals, [slot]: recipe } } }));
  };
  const addRationToPlan = (ration: DailyRation, meals: DailyRation['meals'], days: MenuDay[]) => {
    setWeeklyMenu((currentMenu) => days.reduce((nextMenu, day) => ({ ...nextMenu, [day]: { rationId: ration.id, rationNumber: ration.rationNumber, meals: { ...meals } } }), currentMenu));
  };
  const removeRecipeFromMenu = (day: MenuDay, slot: MenuMealSlot) => setWeeklyMenu((currentMenu) => ({ ...currentMenu, [day]: { ...currentMenu[day], meals: { ...currentMenu[day].meals, [slot]: null } } }));
  useEffect(() => {
    window.localStorage.setItem('ty-poela-progress-entries', JSON.stringify(progressEntries));
  }, [progressEntries]);

  const saveProgressEntry = (entry: ProgressEntry) => setProgressEntries((currentEntries) => {
    const entriesWithoutToday = currentEntries.filter((currentEntry) => currentEntry.date !== entry.date);
    return [entry, ...entriesWithoutToday].sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime());
  });

  return <main className="min-h-screen bg-gradient-to-b from-[#FBF6EC] via-[#F3E2BF]/45 to-[#FBF6EC] text-[#37410F]"><div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-5">
    {showProgressCard ? <ProgressPage entries={progressEntries} onSaveEntry={saveProgressEntry} /> : activeTab === 'recipes' ? (selectedRecipe ? <RecipeDetailPage hasActiveSubscription={hasActiveSubscription} recipe={selectedRecipe} onAddToMenu={addRecipeToMenu} onBack={() => setSelectedRecipe(null)} onOpenAccess={() => openAccess(selectedRecipe)} onOpenMenu={() => setActiveTab('menu')} /> : <RecipesPage hasActiveSubscription={hasActiveSubscription} onOpenAccess={() => openAccess()} onOpenRecipe={openRecipe} />) : activeTab === 'rations' ? (selectedRation ? <RationDetailPage ration={selectedRation} hasActiveSubscription={hasActiveSubscription} onBack={() => setSelectedRation(null)} onOpenAccess={() => openAccess()} onOpenRecipe={openRecipe} onAddRationToPlan={addRationToPlan} /> : <RationsPage hasActiveSubscription={hasActiveSubscription} onOpenAccess={() => openAccess()} onOpenRation={openRation} />) : activeTab === 'macros' ? <MacroCalculatorPage onBack={() => setActiveTab('home')} onOpenRation={openRation} /> : activeTab === 'menu' ? <MenuPage weeklyMenu={weeklyMenu} onOpenCart={() => setActiveTab('cart')} onOpenRations={openRations} onOpenRecipe={openRecipe} onRemoveRecipe={removeRecipeFromMenu} /> : activeTab === 'cart' ? <CartPage weeklyMenu={weeklyMenu} onOpenRecipes={openRations} /> : activeTab === 'access' ? <AccessPage subscriptionUntil={userProfile.subscriptionUntil} subscriptionStatus={userProfile.subscriptionStatus} onActivate={activateSubscription} onOpenRecipes={openRecipes} /> : <HomePage subscriptionStatus={userProfile.subscriptionStatus} onOpenAccess={() => openAccess()} onOpenRations={openRations} onOpenCart={() => setActiveTab('cart')} onOpenRecipes={openRecipes} onOpenProgress={() => setShowProgressCard(true)} onOpenMacros={openMacros} />}
  </div><nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-[#D99663]/35 bg-[#FFFDF8]/95 px-4 pb-5 pt-3 shadow-2xl shadow-[#D99663]/25 backdrop-blur"><div className="grid grid-cols-5 gap-1">{navigationItems.map((item)=><button className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-bold transition ${activeTab === item.id && !showProgressCard ? 'bg-[#6E7E1F] text-white shadow-md shadow-[#6E7E1F]/20' : 'text-[#8B725F] hover:bg-[#F3E2BF]/70 hover:text-[#37410F]'}`} key={item.id} onClick={()=>{ setShowProgressCard(false); setActiveTab(item.id); setSelectedRecipe(null); setSelectedRation(null); }} type="button"><span className="text-lg">{item.icon}</span>{item.label}</button>)}</div></nav></main>;
}

export default App;
