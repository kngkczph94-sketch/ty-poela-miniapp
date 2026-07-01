import type { Meal } from './recipe';

export type MenuDay = 'Сегодня' | 'Завтра' | 'Среда' | 'Четверг' | 'Пятница' | 'Суббота' | 'Воскресенье';
export type MenuMealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type PlanDay = {
  rationId?: string;
  rationNumber?: number;
  meals: Record<MenuMealSlot, Meal | null>;
};

export type WeeklyMenu = Record<MenuDay, PlanDay>;

export const menuDays: MenuDay[] = ['Сегодня', 'Завтра', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
export const menuMealSlots: MenuMealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const menuSlotLabels: Record<MenuMealSlot, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

export const createEmptyPlanDay = (): PlanDay => ({
  meals: { breakfast: null, lunch: null, dinner: null, snack: null },
});

export const createEmptyWeeklyMenu = (): WeeklyMenu =>
  menuDays.reduce((weekMenu, day) => {
    weekMenu[day] = createEmptyPlanDay();
    return weekMenu;
  }, {} as WeeklyMenu);
