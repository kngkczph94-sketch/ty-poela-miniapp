type FeatureCard = {
  title: string;
  description: string;
  icon: string;
  tone: string;
};

type Recipe = {
  title: string;
  meta: string;
  calories: string;
};

const featureCards: FeatureCard[] = [
  {
    title: 'Меню на неделю',
    description: 'Готовый план питания без лишних решений каждый день.',
    icon: '🗓️',
    tone: 'bg-orange-100 text-orange-700',
  },
  {
    title: 'Рецепты с КБЖУ',
    description: 'Простые блюда с белками, жирами, углеводами и калориями.',
    icon: '🥗',
    tone: 'bg-emerald-100 text-emerald-700',
  },
  {
    title: 'Корзина продуктов',
    description: 'Список ингредиентов для меню и любимых рецептов.',
    icon: '🛒',
    tone: 'bg-rose-100 text-rose-700',
  },
];

const popularRecipes: Recipe[] = [
  {
    title: 'Боул с курицей и киноа',
    meta: '25 минут · много белка',
    calories: '420 ккал',
  },
  {
    title: 'Творожные сырники без сахара',
    meta: '20 минут · завтрак',
    calories: '310 ккал',
  },
  {
    title: 'Паста с индейкой и томатами',
    meta: '30 минут · ужин',
    calories: '510 ккал',
  },
];

const navigationItems = [
  { label: 'Главная', icon: '🏠', isActive: true },
  { label: 'Рецепты', icon: '📖', isActive: false },
  { label: 'Меню', icon: '🍽️', isActive: false },
  { label: 'Прогресс', icon: '📈', isActive: false },
];

function App() {
  return (
    <main className="min-h-screen bg-cream text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-5">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-500 via-amber-400 to-yellow-300 p-6 text-white shadow-xl shadow-orange-200/70">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/20" />
          <div className="absolute -bottom-16 right-12 h-32 w-32 rounded-full bg-white/15" />
          <div className="relative z-10">
            <p className="mb-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur">
              Telegram Mini App
            </p>
            <h1 className="max-w-xs text-4xl font-black leading-tight tracking-tight">
              Ты поела?
            </h1>
            <p className="mt-4 max-w-sm text-base font-medium leading-6 text-white/90">
              Рационы, рецепты и корзина продуктов внутри Telegram
            </p>
            <button className="mt-6 rounded-2xl bg-white px-5 py-3 text-base font-bold text-orange-600 shadow-lg shadow-orange-700/20 transition hover:-translate-y-0.5 hover:shadow-xl">
              Что приготовить?
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-3">
          {featureCards.map((card) => (
            <article
              className="rounded-3xl border border-orange-100 bg-white p-4 shadow-sm shadow-orange-100"
              key={card.title}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${card.tone}`}
                >
                  {card.icon}
                </span>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950">{card.title}</h2>
                  <p className="mt-1 text-sm leading-5 text-slate-500">{card.description}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-950">Популярные рецепты</h2>
            <button className="text-sm font-bold text-orange-600">Все</button>
          </div>
          <div className="space-y-3">
            {popularRecipes.map((recipe) => (
              <article
                className="flex items-center justify-between rounded-3xl bg-white p-4 shadow-sm shadow-orange-100"
                key={recipe.title}
              >
                <div>
                  <h3 className="font-bold text-slate-900">{recipe.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{recipe.meta}</p>
                </div>
                <span className="ml-3 shrink-0 rounded-2xl bg-orange-50 px-3 py-2 text-sm font-extrabold text-orange-600">
                  {recipe.calories}
                </span>
              </article>
            ))}
          </div>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-orange-100 bg-white/95 px-4 pb-5 pt-3 shadow-2xl shadow-orange-100 backdrop-blur">
        <div className="grid grid-cols-4 gap-2">
          {navigationItems.map((item) => (
            <button
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-bold transition ${
                item.isActive ? 'bg-orange-50 text-orange-600' : 'text-slate-400 hover:text-slate-600'
              }`}
              key={item.label}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}

export default App;
