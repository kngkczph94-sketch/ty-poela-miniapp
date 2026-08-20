import type { CSSProperties } from 'react';
import { menuMealSlots, menuSlotLabels, type WeeklyMenu } from '../types/menu';
import type { Meal } from '../types/recipe';
import type { HabitEntry } from '../types/progress';

type DashboardProps = {
  weeklyMenu: WeeklyMenu;
  streakDays: number;
  todayHabit?: HabitEntry;
  onOpenMenu: () => void;
  onOpenProgress: () => void;
  onOpenMacros: () => void;
  onOpenPhotoNutrition: () => void;
  onOpenAi: () => void;
};

const STEPS_GOAL = 10000;

type NutritionKey = 'calories' | 'protein' | 'fat' | 'carbs';
type MotionStyle = CSSProperties & Record<string, string | number>;

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

const calorieSegments = Array.from({ length: 18 }, (_, index) => index);

const MacroRing = ({ label, value, goal, tone }: { label: string; value: number; goal: number; tone: string }) => {
  const progress = getProgress(value, goal);
  return (
    <div className="macro-ring-card" style={{ '--macro-progress': progress, '--macro-tone': tone } as MotionStyle}>
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
  streakDays,
  todayHabit,
  onOpenMenu,
  onOpenProgress,
  onOpenMacros,
  onOpenPhotoNutrition,
  onOpenAi,
}: DashboardProps) {
  const todayMeals = weeklyMenu['Сегодня']?.meals ?? { breakfast: null, lunch: null, dinner: null, snack: null };
  const meals = menuMealSlots.map((slot) => ({ slot, meal: todayMeals[slot] }));
  const filledMeals = meals.filter(({ meal }) => meal).map(({ meal }) => meal);
  const calories = getMealTotal(filledMeals, 'calories');
  const protein = getMealTotal(filledMeals, 'protein');
  const fat = getMealTotal(filledMeals, 'fat');
  const carbs = getMealTotal(filledMeals, 'carbs');
  const calorieProgress = getProgress(calories, goals.calories);
  const caloriesLeft = goals.calories - calories;

  return (
    <div className="daily-dashboard">
      <header className="day-header reveal-card">
        <div>
          <p className="day-header__date">{formatDate()}</p>
          <h1 className="day-header__title">Ты поела?</h1>
        </div>
        <button className="streak-pill" onClick={onOpenProgress} type="button" aria-label={`Открыть прогресс: серия ${streakDays} ${streakDays === 1 ? 'день' : 'дней'}`}>
          <span className="streak-pill__mark">{streakDays}</span>
          <span className="streak-pill__copy">
            <strong>серия</strong>
            <small>дней подряд</small>
          </span>
        </button>
      </header>

      <section className={`calorie-hero reveal-card ${calories > goals.calories ? 'calorie-hero--over' : ''}`} style={{ '--calorie-progress': calorieProgress } as MotionStyle}>
        <div className="calorie-aura" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="calorie-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="calorie-ring" aria-label={`Калории: ${Math.round(calories)} из ${goals.calories}`}>
          <div className="calorie-segments" aria-hidden="true">
            {calorieSegments.map((segment) => (
              <span key={segment} style={{ '--segment-index': segment } as MotionStyle} />
            ))}
          </div>
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
        <MacroRing label="Белки" value={protein} goal={goals.protein} tone="#8FD14C" />
        <MacroRing label="Жиры" value={fat} goal={goals.fat} tone="#FFA36C" />
        <MacroRing label="Угли" value={carbs} goal={goals.carbs} tone="#9A8FC4" />
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
          <span>Подобрать рецепт</span>
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
                <small>{meal ? `${Math.round(meal.calories)} ккал · Б ${round(meal.protein)} · Ж ${round(meal.fat)} · У ${round(meal.carbs)}` : 'Место для следующего блюда'}</small>
              </span>
              <span className="meal-row__dot" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className="activity-card reveal-card" onClick={onOpenProgress} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') onOpenProgress(); }}>
        <div>
          <p className="activity-card__label">Активность</p>
          <h2>{todayHabit?.steps ? `${todayHabit.steps.toLocaleString('ru-RU')} шагов` : 'Шаги не внесены'}</h2>
          <p>{todayHabit?.steps ? (todayHabit.steps >= STEPS_GOAL ? 'Дневная цель выполнена' : 'Внести ещё раз можно в Прогрессе') : 'Нажми, чтобы внести шаги за сегодня'}</p>
        </div>
        <div className="activity-progress" aria-hidden="true"><span style={{ width: `${Math.min(((todayHabit?.steps ?? 0) / STEPS_GOAL) * 100, 100)}%` }} /></div>
      </section>

      <section className="dashboard-section reveal-card">
        <div className="section-heading">
          <h2>Привычки</h2>
          <button onClick={onOpenProgress} type="button">Все</button>
        </div>
        <div className="habit-strip">
          {[
            { title: 'Вода', value: todayHabit?.water ? `${todayHabit.water} л` : '—', tone: '#7BA7A0', icon: '💧' },
            { title: 'Сон', value: todayHabit?.sleep ? `${todayHabit.sleep} ч` : '—', tone: '#9A8FC4', icon: '🌙' },
            { title: 'Шаги', value: todayHabit?.steps ? `${Math.round(todayHabit.steps / 100) / 10}k` : '—', tone: '#FFA36C', icon: '👣' },
          ].map((habit) => (
            <button className="habit-chip" key={habit.title} onClick={onOpenProgress} style={{ '--habit-tone': habit.tone } as MotionStyle} type="button">
              <span className="habit-chip__icon" aria-hidden="true">{habit.icon}</span>
              <strong>{habit.title}</strong>
              <small>{habit.value}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
