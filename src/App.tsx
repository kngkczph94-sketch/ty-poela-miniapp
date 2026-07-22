import { useEffect, useState } from 'react';
import { BackButton } from './components/BackButton';
import { AwardsPage } from './pages/AwardsPage';
import { CartPage } from './pages/CartPage';
import { MacroCalculatorPage } from './pages/MacroCalculatorPage';
import { MenuPage } from './pages/MenuPage';
import { ProgressPage } from './pages/ProgressPage';
import { RationDetailPage } from './pages/RationDetailPage';
import { RationsPage } from './pages/RationsPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { RecipesPage } from './pages/RecipesPage';
import { findRecipeWithRationImage } from './data/recipesWithRationImages';
import { dailyRations } from './data/rations';
import { createEmptyWeeklyMenu, type MenuDay, type MenuMealSlot } from './types/menu';
import type { DailyRation } from './types/ration';
import type { HabitEntry, MeasurementEntry, ProgressEntry } from './types/progress';
import type { Recipe } from './types/recipe';

const getRecipeIdFromSearch = (search: string) => {
  const params = new URLSearchParams(search);
  const recipeId = params.get('recipe');

  if (recipeId) {
    return recipeId;
  }

  const startApp = params.get('startapp');

  if (!startApp?.startsWith('recipe_')) {
    return null;
  }

  return startApp.replace(/^recipe_/, '');
};

const getRationIdFromSearch = (search: string) => {
  const params = new URLSearchParams(search);
  const rationId = params.get('ration');

  if (rationId) {
    return rationId;
  }

  const startApp = params.get('startapp');

  if (!startApp?.startsWith('ration_')) {
    return null;
  }

  return startApp.replace(/^ration_/, '');
};

const findRationBySearchId = (rationId: string | null) => {
  if (!rationId) {
    return null;
  }

  const normalizedRationId = rationId.startsWith('ration-') ? rationId : `ration-${rationId}`;
  const rationNumber = Number(rationId);

  return dailyRations.find((ration) =>
    ration.id === normalizedRationId || (!Number.isNaN(rationNumber) && ration.rationNumber === rationNumber),
  ) ?? null;
};

type NavigationTab = 'home' | 'rations' | 'recipes' | 'menu' | 'cart' | 'access' | 'macros' | 'progress' | 'awards' | 'share';

type SubscriptionStatus = 'free' | 'active';

type UserProfile = { subscriptionStatus: SubscriptionStatus; subscriptionUntil?: string };

const navigationItems: { id: NavigationTab; label: string; icon: string }[] = [
  { id: 'home', label: 'Главная', icon: '🏠' },
  { id: 'rations', label: 'Рационы', icon: '🥣' },
  { id: 'recipes', label: 'Рецепты', icon: '📖' },
  { id: 'menu', label: 'План', icon: '🍽️' },
  { id: 'cart', label: 'Корзина', icon: '🛒' },
];

type HomeAction = { label: string; onClick?: () => void; soon?: boolean };

type HomeCardVisual = 'macros' | 'rations' | 'recipes' | 'ai' | 'knowledge' | 'progress' | 'awards' | 'share';

type HomeCard = { title: string; description: string; visual: HomeCardVisual; imageSrc?: string; soon?: boolean; action: HomeAction };

const HomeFeaturePhoto = ({ alt, imageSrc, visual }: { alt: string; imageSrc?: string; visual: HomeCardVisual }) => (
  <div className={`home-feature-photo home-feature-photo--${visual}`}>
    {imageSrc && <img alt={alt} className="home-feature-photo__image" loading="lazy" src={imageSrc} />}
  </div>
);

function HomeFeatureCard({ card }: { card: HomeCard }) {
  return (
    <article className="group grid overflow-hidden rounded-[1.8rem] border border-[#D99663]/20 bg-[#FFFDF8] text-left shadow-sm shadow-[#F3E2BF]/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#D99663]/15 sm:grid-cols-[1fr_9.5rem]">
      <div className="order-2 flex min-w-0 flex-col p-4 pt-1 sm:order-1 sm:pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-extrabold text-[#37410F]">{card.title}</h2>
          {card.soon && <span className="rounded-full bg-[#D99663]/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#D99663]">скоро</span>}
        </div>
        <p className="mt-1 text-sm leading-5 text-[#8B725F]">{card.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {card.action.onClick ? <button className="rounded-full bg-[#6E7E1F] px-4 py-2 text-sm font-black text-white shadow-sm shadow-[#6E7E1F]/20 transition hover:bg-[#37410F]" onClick={card.action.onClick} type="button">{card.action.label}</button> : <span className="rounded-full bg-[#F3E2BF] px-4 py-2 text-sm font-black text-[#8B725F]">{card.action.label}{card.action.soon ? ' скоро' : ''}</span>}
        </div>
      </div>
      <div className="order-1 p-3 pb-2 sm:order-2 sm:pl-0">
        <HomeFeaturePhoto alt={card.title} imageSrc={card.imageSrc} visual={card.visual} />
      </div>
    </article>
  );
}

function HomePage({ onOpenRations, onOpenRecipes, onOpenProgress, onOpenMacros, onOpenAwards, onOpenShare }: { onOpenRations: () => void; onOpenRecipes: () => void; onOpenProgress: () => void; onOpenMacros: () => void; onOpenAwards: () => void; onOpenShare: () => void }) {
  const homeCards: HomeCard[] = [
    {
      title: 'Расчёт БЖУ',
      description: 'Рассчитай свою норму калорий, белков, жиров и углеводов под цель.',
      visual: 'macros',
      imageSrc: '/ty-poela-miniapp/images/home/home-macros.jpg',
      action: { label: 'БЖУ', onClick: onOpenMacros },
    },
    {
      title: 'Рационы',
      description: 'Выбери готовый день питания с уже собранными приёмами пищи и КБЖУ.',
      visual: 'rations',
      imageSrc: '/ty-poela-miniapp/images/home/home-rations.jpg',
      action: { label: 'Рационы', onClick: onOpenRations },
    },
    {
      title: 'Рецепты',
      description: 'Открой отдельные рецепты с ингредиентами, шагами приготовления и КБЖУ.',
      visual: 'recipes',
      imageSrc: '/ty-poela-miniapp/images/home/home-recipes.jpg',
      action: { label: 'Рецепты', onClick: onOpenRecipes },
    },
    {
      title: 'ИИ-подбор',
      description: 'Подбери рецепт или рацион по списку продуктов или фотографии.',
      visual: 'ai',
      imageSrc: '/ty-poela-miniapp/images/home/home-ai-selection.jpg',
      action: { label: 'ИИ', onClick: () => undefined },
    },
    {
      title: 'База знаний',
      description: 'Материалы о питании, коррекции веса, БЖУ, продуктах и пищевых привычках.',
      visual: 'knowledge',
      action: { label: 'База знаний' },
    },
    {
      title: 'Прогресс',
      description: 'Отмечай вес, замеры, шаги, сон и воду — приложение поддержит регулярность.',
      visual: 'progress',
      imageSrc: '/ty-poela-miniapp/images/home/home-progress.jpg',
      action: { label: 'Прогресс', onClick: onOpenProgress },
    },
    {
      title: 'Награды',
      description: 'Собирай достижения за регулярные отметки и движение к своей цели.',
      visual: 'awards',
      imageSrc: '/ty-poela-miniapp/images/home/home-rewards.jpg',
      action: { label: 'Награды', onClick: onOpenAwards },
    },
    {
      title: 'Поделиться приложением',
      description: 'Отправь ссылку тому, кому тоже нужен понятный план питания.',
      visual: 'share',
      imageSrc: '/ty-poela-miniapp/images/home/home-share.jpg',
      action: { label: 'Поделиться', onClick: onOpenShare },
    },
  ];

  return <>
    <section className="relative overflow-hidden rounded-[2rem] border border-[#D99663]/25 bg-[#FFFDF8] text-[#37410F] shadow-lg shadow-[#F3E2BF]/80">
      <img alt="Ты поела?" className="home-hero-image" src="/ty-poela-miniapp/images/home/home-hero.jpg" />
      <div className="p-5">
        <p className="inline-flex rounded-full bg-[#F3E2BF] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#6E7E1F]">Telegram Mini App</p>
        <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight">Ты поела?</h1>
        <p className="mt-3 max-w-md text-base font-semibold leading-6 text-[#8B725F]">Готовые рационы, рецепты, расчёт БЖУ и список покупок внутри Telegram.</p>
      </div>
    </section>
    <section className="mt-5 grid gap-4">{homeCards.map((card) => <HomeFeatureCard card={card} key={card.title} />)}</section>
  </>;
}

function AccessPage({
  subscriptionStatus,
  subscriptionUntil,
  onActivate,
  onOpenRecipes,
  onBack,
}: {
  subscriptionStatus: SubscriptionStatus;
  subscriptionUntil?: string;
  onActivate: () => void;
  onOpenRecipes: () => void;
  onBack: () => void;
}) {
  const formattedUntil = subscriptionUntil
    ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(subscriptionUntil))
    : null;

  return (
    <section className="flex flex-1 flex-col">
      <BackButton onClick={onBack} />
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
            'трекер прогресса',
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

const appShareText = `Я пользуюсь «Ты поела» — здесь можно собрать рацион, добавить его в план и получить список покупок.

Попробуй тоже:
https://kngkczph94-sketch.github.io/ty-poela-miniapp/`;

function ShareAppPage({ onBack }: { onBack: () => void }) {
  const [copiedMessage, setCopiedMessage] = useState('');
  const [manualShareText, setManualShareText] = useState('');

  const handleShare = async () => {
    setCopiedMessage('');
    setManualShareText('');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ты поела',
          text: appShareText,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(appShareText);
        setCopiedMessage('Ссылка скопирована. Можно отправить её в чат.');
        return;
      } catch {
        // Fall through to manual copy block.
      }
    }

    setManualShareText(appShareText);
  };

  return (
    <section className="flex flex-1 flex-col">
      <BackButton onClick={onBack} />
      <div className="rounded-[2rem] border border-[#D99663]/35 bg-gradient-to-br from-[#F3E2BF] via-[#D99663]/35 to-[#FBF6EC] p-6 text-[#37410F] shadow-xl shadow-[#D99663]/20">
        <p className="text-sm font-bold uppercase tracking-wide text-[#8B725F]">Поделиться</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Поделиться приложением</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-[#8B725F]">Отправь ссылку тому, кому тоже нужен рацион, план и понятная корзина.</p>
      </div>

      <article className="mt-5 rounded-[2rem] border border-[#D99663]/25 bg-[#FFFDF8] p-5 shadow-xl shadow-[#F3E2BF]/70">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3E2BF] text-2xl text-[#6E7E1F]">💌</span>
          <div>
            <h2 className="text-xl font-black text-[#37410F]">Ссылка на «Ты поела»</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#8B725F]">Можно отправить в чат или скопировать ссылку вручную.</p>
          </div>
        </div>

        <button
          className="mt-6 w-full rounded-2xl bg-[#6E7E1F] px-5 py-3 text-base font-black text-white shadow-lg shadow-[#F3E2BF]/70 transition hover:bg-[#37410F]"
          aria-label="Поделиться приложением"
          onClick={handleShare}
          type="button"
        >
          Поделиться
        </button>

        {copiedMessage && <p className="mt-4 rounded-2xl bg-[#F3E2BF]/70 px-4 py-3 text-sm font-black text-[#37410F]">{copiedMessage}</p>}
        {manualShareText && <div className="mt-4 rounded-2xl border border-[#D99663]/30 bg-[#FBF6EC] p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#6E7E1F]">Скопируй текст вручную</p><pre className="mt-3 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-[#37410F]">{manualShareText}</pre></div>}

        <p className="mt-4 text-center text-xs font-bold text-[#8B725F]">Скоро здесь появятся бонусы за приглашения.</p>
      </article>
    </section>
  );
}

const getTodayUsageDate = () => new Date().toISOString().slice(0, 10);

const readUsageDates = () => {
  try {
    const savedDates = window.localStorage.getItem('ty-poela-award-usage-dates');
    const parsedDates = savedDates ? (JSON.parse(savedDates) as unknown) : [];
    return Array.isArray(parsedDates) ? parsedDates.filter((date): date is string => typeof date === 'string') : [];
  } catch {
    return [];
  }
};

const saveTodayUsageDate = () => {
  const today = getTodayUsageDate();
  const uniqueDates = Array.from(new Set([...readUsageDates(), today])).sort();
  window.localStorage.setItem('ty-poela-award-usage-dates', JSON.stringify(uniqueDates));
  return uniqueDates;
};

function App() {
  const initialRecipeId = getRecipeIdFromSearch(window.location.search);
  const initialRecipe = initialRecipeId ? findRecipeWithRationImage(initialRecipeId) ?? null : null;
  const initialRation = initialRecipe ? null : findRationBySearchId(getRationIdFromSearch(window.location.search));
  const [activeTab, setActiveTab] = useState<NavigationTab>(initialRecipe ? 'recipes' : initialRation ? 'rations' : 'home');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(initialRecipe);
  const [selectedRation, setSelectedRation] = useState<DailyRation | null>(initialRation);
  const [recipeReturnTarget, setRecipeReturnTarget] = useState<{ tab: NavigationTab; ration?: DailyRation }>({ tab: 'recipes' });
  const [rationReturnTab, setRationReturnTab] = useState<NavigationTab>('rations');
  const [accessReturnTarget, setAccessReturnTarget] = useState<{ tab: NavigationTab; recipe?: Recipe; ration?: DailyRation }>({ tab: 'home' });
  const [recipeToOpenAfterAccess, setRecipeToOpenAfterAccess] = useState<Recipe | null>(initialRecipe);
  const [weeklyMenu, setWeeklyMenu] = useState(createEmptyWeeklyMenu);
  const [measurementEntries, setMeasurementEntries] = useState<MeasurementEntry[]>(() => {
    try {
      const savedMeasurements = window.localStorage.getItem('ty-poela-measurement-entries');
      if (savedMeasurements) {
        return JSON.parse(savedMeasurements) as MeasurementEntry[];
      }
      const legacyEntries = window.localStorage.getItem('ty-poela-progress-entries');
      return legacyEntries ? (JSON.parse(legacyEntries) as ProgressEntry[]).map(({ id, date, weight }) => ({ id, date, weight })) : [];
    } catch {
      return [];
    }
  });
  const [habitEntries, setHabitEntries] = useState<HabitEntry[]>(() => {
    try {
      const savedHabits = window.localStorage.getItem('ty-poela-habit-entries');
      if (savedHabits) {
        return JSON.parse(savedHabits) as HabitEntry[];
      }
      const legacyEntries = window.localStorage.getItem('ty-poela-progress-entries');
      return legacyEntries ? (JSON.parse(legacyEntries) as ProgressEntry[]).map(({ id, date, steps, sleep, water }) => ({ id, date, steps, sleep, water })) : [];
    } catch {
      return [];
    }
  });
  const [userProfile, setUserProfile] = useState<UserProfile>({ subscriptionStatus: 'free' });
  const [usageDates] = useState<string[]>(saveTodayUsageDate);
  const hasActiveSubscription = userProfile.subscriptionStatus === 'active';

  const openRecipes = () => { setSelectedRecipe(null); setSelectedRation(null); setActiveTab('recipes'); };
  const openRecipe = (recipe: Recipe) => { setRecipeReturnTarget({ tab: activeTab, ration: selectedRation ?? undefined }); setSelectedRecipe(recipe); setSelectedRation(null); setActiveTab('recipes'); };
  const openRations = () => { setSelectedRation(null); setSelectedRecipe(null); setActiveTab('rations'); };
  const openMacros = () => { setSelectedRation(null); setSelectedRecipe(null); setActiveTab('macros'); };
  const openRation = (ration: DailyRation) => { setRationReturnTab(activeTab); setSelectedRation(ration); setSelectedRecipe(null); setActiveTab('rations'); };
  const openAccess = (recipe?: Recipe) => { setAccessReturnTarget({ tab: activeTab, recipe: recipe ?? selectedRecipe ?? undefined, ration: selectedRation ?? undefined }); setRecipeToOpenAfterAccess(recipe ?? selectedRecipe); setActiveTab('access'); };
  const activateSubscription = () => { const until = new Date(); until.setDate(until.getDate() + 7); setUserProfile({ subscriptionStatus: 'active', subscriptionUntil: until.toISOString() }); if (recipeToOpenAfterAccess) { setSelectedRecipe(recipeToOpenAfterAccess); setRecipeToOpenAfterAccess(null); setActiveTab('recipes'); } };

  const addRecipeToMenu = (recipe: Recipe, day: MenuDay, slot: MenuMealSlot) => {
    setWeeklyMenu((currentMenu) => ({ ...currentMenu, [day]: { ...currentMenu[day], meals: { ...currentMenu[day].meals, [slot]: recipe } } }));
  };
  const addRationToPlan = (ration: DailyRation, meals: DailyRation['meals'], days: MenuDay[]) => {
    setWeeklyMenu((currentMenu) => days.reduce((nextMenu, day) => ({ ...nextMenu, [day]: { rationId: ration.id, rationNumber: ration.rationNumber, meals: { ...meals } } }), currentMenu));
  };
  const removeRecipeFromMenu = (day: MenuDay, slot: MenuMealSlot) => setWeeklyMenu((currentMenu) => ({ ...currentMenu, [day]: { ...currentMenu[day], meals: { ...currentMenu[day].meals, [slot]: null } } }));
  useEffect(() => {
    window.localStorage.setItem('ty-poela-measurement-entries', JSON.stringify(measurementEntries));
  }, [measurementEntries]);
  useEffect(() => {
    window.localStorage.setItem('ty-poela-habit-entries', JSON.stringify(habitEntries));
  }, [habitEntries]);

  const saveMeasurementEntry = (entry: MeasurementEntry) => setMeasurementEntries((currentEntries) => {
    const entriesWithoutToday = currentEntries.filter((currentEntry) => currentEntry.date !== entry.date);
    return [entry, ...entriesWithoutToday].sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime());
  });
  const saveHabitEntry = (entry: HabitEntry) => setHabitEntries((currentEntries) => {
    const entriesWithoutToday = currentEntries.filter((currentEntry) => currentEntry.date !== entry.date);
    return [entry, ...entriesWithoutToday].sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime());
  });

  const goHome = () => { setActiveTab('home'); setSelectedRecipe(null); setSelectedRation(null); };
  const goBack = () => {
    if (selectedRecipe) {
      setSelectedRecipe(null);
      setSelectedRation(recipeReturnTarget.ration ?? null);
      setActiveTab(recipeReturnTarget.tab === 'home' ? 'recipes' : recipeReturnTarget.tab);
      return;
    }
    if (selectedRation) {
      setSelectedRation(null);
      setActiveTab(rationReturnTab === 'home' ? 'rations' : rationReturnTab);
      return;
    }
    if (activeTab === 'access') {
      setSelectedRecipe(accessReturnTarget.recipe ?? null);
      setSelectedRation(accessReturnTarget.ration ?? null);
      setActiveTab(accessReturnTarget.tab === 'access' ? 'home' : accessReturnTarget.tab);
      return;
    }
    goHome();
  };

  useEffect(() => {
    const telegramBackButton = window.Telegram?.WebApp?.BackButton;

    if (activeTab === 'home' && !selectedRecipe && !selectedRation) {
      telegramBackButton?.hide();
      return;
    }

    telegramBackButton?.show();
    telegramBackButton?.onClick(goBack);
    return () => telegramBackButton?.offClick(goBack);
  });

  return <main className="min-h-screen bg-gradient-to-b from-[#FBF6EC] via-[#F3E2BF]/45 to-[#FBF6EC] text-[#37410F]"><div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-5">
    {activeTab === 'awards' ? <AwardsPage onBack={goBack} uniqueDaysCount={usageDates.length} /> : activeTab === 'share' ? <ShareAppPage onBack={goBack} /> : activeTab === 'progress' ? <ProgressPage onBack={goBack} habits={habitEntries} measurements={measurementEntries} onSaveHabit={saveHabitEntry} onSaveMeasurement={saveMeasurementEntry} /> : activeTab === 'recipes' ? (selectedRecipe ? <RecipeDetailPage hasActiveSubscription={hasActiveSubscription} recipe={selectedRecipe} onAddToMenu={addRecipeToMenu} onBack={goBack} onOpenAccess={() => openAccess(selectedRecipe)} onOpenMenu={() => setActiveTab('menu')} /> : <RecipesPage onBack={goBack} hasActiveSubscription={hasActiveSubscription} onOpenAccess={() => openAccess()} onOpenRecipe={openRecipe} />) : activeTab === 'rations' ? (selectedRation ? <RationDetailPage ration={selectedRation} hasActiveSubscription={hasActiveSubscription} onBack={goBack} onOpenAccess={() => openAccess()} onOpenRecipe={openRecipe} onAddRationToPlan={addRationToPlan} /> : <RationsPage onBack={goBack} hasActiveSubscription={hasActiveSubscription} onOpenAccess={() => openAccess()} onOpenRation={openRation} />) : activeTab === 'macros' ? <MacroCalculatorPage onBack={goBack} onOpenRation={openRation} /> : activeTab === 'menu' ? <MenuPage onBack={goBack} weeklyMenu={weeklyMenu} onOpenCart={() => setActiveTab('cart')} onOpenRations={openRations} onOpenRecipe={openRecipe} onRemoveRecipe={removeRecipeFromMenu} /> : activeTab === 'cart' ? <CartPage onBack={goBack} weeklyMenu={weeklyMenu} onOpenRecipes={openRations} /> : activeTab === 'access' ? <AccessPage onBack={goBack} subscriptionUntil={userProfile.subscriptionUntil} subscriptionStatus={userProfile.subscriptionStatus} onActivate={activateSubscription} onOpenRecipes={openRecipes} /> : <HomePage onOpenRations={openRations} onOpenRecipes={openRecipes} onOpenProgress={() => setActiveTab('progress')} onOpenMacros={openMacros} onOpenAwards={() => setActiveTab('awards')} onOpenShare={() => setActiveTab('share')} />}
  </div><nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-[#D99663]/35 bg-[#FFFDF8]/95 px-4 pb-5 pt-3 shadow-2xl shadow-[#D99663]/25 backdrop-blur"><div className="grid grid-cols-5 gap-1">{navigationItems.map((item)=><button className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-bold transition ${activeTab === item.id ? 'bg-[#6E7E1F] text-white shadow-md shadow-[#6E7E1F]/20' : 'text-[#8B725F] hover:bg-[#F3E2BF]/70 hover:text-[#37410F]'}`} key={item.id} onClick={()=>{ setActiveTab(item.id); setSelectedRecipe(null); setSelectedRation(null); }} type="button"><span className="text-lg">{item.icon}</span>{item.label}</button>)}</div></nav></main>;
}

export default App;
