import type { Recipe } from './recipe';

export type MenuDay =
  | 'Понедельник'
  | 'Вторник'
  | 'Среда'
  | 'Четверг'
  | 'Пятница'
  | 'Суббота'
  | 'Воскресенье';

export type MenuMealSlot = 'Завтрак' | 'Обед' | 'Ужин' | 'Перекус';

export type WeeklyMenu = Record<MenuDay, Record<MenuMealSlot, Recipe | null>>;

export const menuDays: MenuDay[] = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
];

export const menuMealSlots: MenuMealSlot[] = ['Завтрак', 'Обед', 'Ужин', 'Перекус'];

export const createEmptyWeeklyMenu = (): WeeklyMenu =>
  menuDays.reduce((weekMenu, day) => {
    weekMenu[day] = menuMealSlots.reduce(
      (dayMenu, slot) => {
        dayMenu[slot] = null;
        return dayMenu;
      },
      {} as Record<MenuMealSlot, Recipe | null>,
    );

    return weekMenu;
  }, {} as WeeklyMenu);
