import { menuDays, menuMealSlots, type MenuDay, type MenuMealSlot, type WeeklyMenu } from '../types/menu';
import type { Recipe } from '../types/recipe';

type MenuPageProps = {
  weeklyMenu: WeeklyMenu;
  onOpenCart: () => void;
  onOpenRecipes: () => void;
  onOpenRecipe: (recipe: Recipe) => void;
  onRemoveRecipe: (day: MenuDay, slot: MenuMealSlot) => void;
};

const getDayTotals = (recipes: (Recipe | null)[]) =>
  recipes.reduce(
    (totals, recipe) => {
      if (!recipe) {
        return totals;
      }

      return {
        calories: totals.calories + recipe.calories,
        protein: totals.protein + recipe.protein,
        fat: totals.fat + recipe.fat,
        carbs: totals.carbs + recipe.carbs,
      };
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );

export function MenuPage({ weeklyMenu, onOpenCart, onOpenRecipes, onOpenRecipe, onRemoveRecipe }: MenuPageProps) {
  const hasRecipesInMenu = menuDays.some((day) => menuMealSlots.some((slot) => Boolean(weeklyMenu[day][slot])));

  return (
    <section className="flex flex-1 flex-col">
      <div className="rounded-[2rem] bg-gradient-to-br from-orange-500 to-amber-300 p-6 text-white shadow-xl shadow-orange-200/70">
        <p className="text-sm font-bold uppercase tracking-wide text-white/80">4 этап</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Меню на неделю</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-white/90">
          Собирай завтраки, обеды, ужины и перекусы из рецептов — все КБЖУ считаются за день.
        </p>
        <button
          className="mt-5 rounded-2xl bg-white px-5 py-3 text-base font-black text-orange-600 shadow-lg shadow-orange-700/10 transition hover:-translate-y-0.5"
          onClick={onOpenCart}
          type="button"
        >
          Смотреть корзину
        </button>
      </div>

      {!hasRecipesInMenu && (
        <div className="mt-5 rounded-[2rem] bg-white p-6 text-center shadow-sm shadow-orange-100">
          <p className="text-5xl">🍽️</p>
          <h2 className="mt-3 text-xl font-black text-slate-950">Собери меню на неделю из рецептов</h2>
          <p className="mt-2 text-sm font-semibold leading-5 text-slate-500">
            Открой карточку рецепта и добавь блюдо в нужный день и прием пищи.
          </p>
          <button
            className="mt-5 rounded-2xl bg-orange-500 px-5 py-3 text-base font-black text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
            onClick={onOpenRecipes}
            type="button"
          >
            Перейти к рецептам
          </button>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {menuDays.map((day) => {
          const dayRecipes = menuMealSlots.map((slot) => weeklyMenu[day][slot]);
          const totals = getDayTotals(dayRecipes);

          return (
            <article className="rounded-[2rem] bg-white p-4 shadow-sm shadow-orange-100" key={day}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-950">{day}</h2>
                  <p className="mt-1 text-xs font-bold text-slate-400">Завтрак · Обед · Ужин · Перекус</p>
                </div>
                <div className="rounded-2xl bg-orange-50 px-3 py-2 text-right text-xs font-extrabold text-orange-600">
                  <div>{totals.calories} ккал</div>
                  <div className="text-[11px] text-orange-400">за день</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2 rounded-3xl bg-slate-50 p-3 text-center">
                <div>
                  <p className="text-sm font-black text-slate-900">{totals.calories}</p>
                  <p className="text-[11px] font-bold text-slate-400">ккал</p>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{totals.protein} г</p>
                  <p className="text-[11px] font-bold text-slate-400">белки</p>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{totals.fat} г</p>
                  <p className="text-[11px] font-bold text-slate-400">жиры</p>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{totals.carbs} г</p>
                  <p className="text-[11px] font-bold text-slate-400">углеводы</p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {menuMealSlots.map((slot) => {
                  const recipe = weeklyMenu[day][slot];

                  return (
                    <div className="rounded-3xl border border-orange-50 bg-orange-50/50 p-3" key={slot}>
                      <p className="text-xs font-black uppercase tracking-wide text-orange-500">{slot}</p>
                      {recipe ? (
                        <div className="mt-2">
                          <button className="text-left text-base font-black text-slate-950" onClick={() => onOpenRecipe(recipe)} type="button">
                            {recipe.title}
                          </button>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-extrabold text-slate-500">
                            <span className="rounded-full bg-white px-2 py-1">{recipe.calories} ккал</span>
                            <span className="rounded-full bg-white px-2 py-1">Б {recipe.protein} г</span>
                            <span className="rounded-full bg-white px-2 py-1">Ж {recipe.fat} г</span>
                            <span className="rounded-full bg-white px-2 py-1">У {recipe.carbs} г</span>
                            <span className="rounded-full bg-white px-2 py-1">⏱️ {recipe.cookingTime} мин</span>
                          </div>
                          <button
                            className="mt-3 rounded-full bg-white px-3 py-2 text-xs font-black text-rose-500 shadow-sm transition hover:bg-rose-50"
                            onClick={() => onRemoveRecipe(day, slot)}
                            type="button"
                          >
                            Удалить из слота
                          </button>
                        </div>
                      ) : (
                        <button
                          className="mt-2 text-left text-sm font-extrabold text-orange-400"
                          onClick={onOpenRecipes}
                          type="button"
                        >
                          Добавь рецепт
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
