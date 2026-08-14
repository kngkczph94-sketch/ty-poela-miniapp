import { recipesWithRationImages } from '../data/recipesWithRationImages';
import { menuMealSlots, menuSlotLabels, type WeeklyMenu } from '../types/menu';
import type { Meal } from '../types/recipe';

type DashboardProps = {
  weeklyMenu: WeeklyMenu;
  onOpenMenu: () => void;
  onOpenRecipes: () => void;
  onOpenProgress: () => void;
  onOpenMacros: () => void;
  onOpenPhotoNutrition: () => void;
  onOpenAi: () => void;
};

type NutritionKey = 'calories' | 'protein' | 'fat' | 'carbs';

const goals: Record<NutritionKey, number> = {
  calories: 1600,
  protein: 115,
  fat: 52,
  carbs: 165,
};

const round = (value: number) => Math.round(value * 10) / 10;

const getMealTotal = (meals: Array<Meal | null>, key: NutritionKey) =>
  meals.reduce((sum, meal) => sum + (meal?.[key] ?? 0), 0);

const getProgress = (value: number, goal: number) => Math.min(Math.round((value / goal) * 100), 124);

const formatDate = () =>
  new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

const MacroRing = ({ label, value, goal, tone }: { label: string; value: number; goal: number; tone: string }) => {
  const progress = getProgress(value, goal);
  return (
    <div className="macro-ring-card" style={{ '--macro-progress': progress, '--macro-tone': tone } as React.CSSProperties}>
      <div className="macro-ring" aria-hidden="true" />
      <div>
        <p className="macro-ring-card__label">{label}</p>
        <p className="macro-ring-card__value">{round(value)} г</p>
      </div>
    </div>
  );
};

const mealEmptyCopy: Record<string, string> = {
  breakfast: 'Добавить завтрак',
  lunch: 'Добавить обед',
  dinner: 'Добавить ужин',
  snack: 'Добавить перекус',
};

export function DailyDashboard({
  weeklyMenu,
  onOpenMenu,
  onOpenRecipes,
  onOpenProgress,
  onOpenMacros,
  onOpenPhotoNutrition,
  onOpenAi,
}: DashboardProps) {
  const todayMeals = weeklyMenu['Сегодня']?.meals ?? { breakfast: null, lunch: null, dinner: null, snack: null };
  const meals = menuMealSlots.map((slot) => ({ slot, meal: todayMeals[slot] }));
  const filledMeals = meals.filter(({ meal }) => meal);
  const calories = getMealTotal(filledMeals.map(({ meal }) => meal), 'calories');
  const protein = getMealTotal(filledMeals.map(({ meal }) => meal), 'protein');
  const fat = getMealTotal(filledMeals.map(({ meal }) => meal), 'fat');
  const carbs = getMealTotal(filledMeals.map(({ meal }) => meal), 'carbs');
  const calorieProgress = getProgress(calories, goals.calories);
  const caloriesLeft = goals.calories - calories;
  const recommendedRecipes = recipesWithRationImages.slice(0, 6);

  return (
    <div className="daily-dashboard">
      <header className="day-header reveal-card">
        <div>
          <p className="day-header__date">{formatDate()}</p>
          <h1 className="day-header__title">Ты поела?</h1>
        </div>
        <button className="streak-pill" onClick={onOpenProgress} type="button" aria-label="Открыть прогресс">
          <span className="streak-pill__mark">7</span>
          <span>streak</span>
        </button>
      </header>

      <section className={`calorie-hero reveal-card ${calories > goals.calories ? 'calorie-hero--over' : ''}`} style={{ '--calorie-progress': calorieProgress } as React.CSSProperties}>
        <div className="calorie-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="calorie-ring" aria-label={`Калории: ${Math.round(calories)} из ${goals.calories}`}>
          <div className="calorie-ring__inner">
            <p className="calorie-ring__eyebrow">сегодня</p>
            <p className="calorie-ring__value">{Math.round(calories)}</p>
            <p className="calorie-ring__goal">из {goals.calories} ккал</p>
          </div>
        </div>
        <p className="calorie-hero__status">
          {caloriesLeft >= 0 ? `Осталось ${Math.round(caloriesLeft)} ккал` : `Выше плана на ${Math.abs(Math.round(caloriesLeft))} ккал`}
        </p>
      </section>

      <section className="macro-grid reveal-card" aria-label="Макросы">
        <MacroRing label="Белки" value={protein} goal={goals.protein} tone="#6E7E1F" />
        <MacroRing label="Жиры" value={fat} goal={goals.fat} tone="#C98B5B" />
        <MacroRing label="Угли" value={carbs} goal={goals.carbs} tone="#3E7C78" />
      </section>

      <section className="quick-actions reveal-card" aria-label="Быстрые действия">
        <button className="quick-action quick-action--primary" onClick={onOpenMenu} type="button">
          <span className="quick-action__icon">+</span>
          <span>Добавить приём пищи</span>
        </button>
        <button className="quick-action" onClick={onOpenPhotoNutrition} type="button">
          <span className="quick-action__icon">⌁</span>
          <span>Сканировать блюдо</span>
        </button>
        <button className="quick-action" onClick={onOpenAi} type="button">
          <span className="quick-action__icon">✦</span>
          <span>ИИ-рецепт</span>
        </button>
        <button className="quick-action" onClick={onOpenMacros} type="button">
          <span className="quick-action__icon">◌</span>
          <span>Норма БЖУ</span>
        </button>
      </section>

      <section className="dashboard-section reveal-card">
        <div className="section-heading">
          <h2>Рацион дня</h2>
          <button onClick={onOpenMenu} type="button">План</button>
        </div>
        <div className="meal-feed">
          {meals.map(({ slot, meal }) => (
            <button className={`meal-row ${meal ? '' : 'meal-row--empty'}`} key={slot} onClick={onOpenMenu} type="button">
              <span className="meal-row__time">{menuSlotLabels[slot]}</span>
              <span className="meal-row__body">
                <strong>{meal?.title ?? mealEmptyCopy[slot]}</strong>
                <small>{meal ? `${Math.round(meal.calories)} ккал · Б ${round(meal.protein)} · Ж ${round(meal.fat)} · У ${round(meal.carbs)}` : 'Мягкое место для следующего блюда'}</small>
              </span>
              <span className="meal-row__dot" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className="activity-card reveal-card">
        <div>
          <p className="activity-card__label">Активность</p>
          <h2>6 420 шагов</h2>
          <p>Спокойный темп, цель близко</p>
        </div>
        <div className="activity-progress" aria-hidden="true"><span /></div>
      </section>

      <section className="dashboard-section reveal-card">
        <div className="section-heading">
          <h2>Привычки</h2>
          <button onClick={onOpenProgress} type="button">Все</button>
        </div>
        <div className="habit-strip">
          {[
            { title: 'Вода', value: '5/7', tone: '#3E7C78' },
            { title: 'Сон', value: '7ч', tone: '#6E7E1F' },
            { title: 'Шаги', value: '6.4k', tone: '#C98B5B' },
          ].map((habit) => (
            <button className="habit-chip" key={habit.title} onClick={onOpenProgress} style={{ '--habit-tone': habit.tone } as React.CSSProperties} type="button">
              <span className="habit-chip__growth" aria-hidden="true"><span /></span>
              <strong>{habit.title}</strong>
              <small>{habit.value}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-section reveal-card">
        <div className="section-heading">
          <h2>Рецепты</h2>
          <button onClick={onOpenRecipes} type="button">Каталог</button>
        </div>
        <div className="recipe-carousel">
          {recommendedRecipes.map((recipe) => (
            <button className="recipe-tile" key={recipe.id} onClick={onOpenRecipes} type="button">
              {recipe.imageUrl && <img alt="" src={recipe.imageUrl} loading="lazy" />}
              <span>{recipe.title}</span>
              <small>{Math.round(recipe.calories)} ккал</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
