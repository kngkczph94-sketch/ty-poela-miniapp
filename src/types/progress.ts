export type MeasurementEntry = {
  id: string;
  date: string;
  weight?: number;
  neck?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  leg?: number;
  arm?: number;
};

export type HabitEntry = {
  id: string;
  date: string;
  steps?: number;
  sleep?: number;
  water?: number;
};

export type ProgressEntry = MeasurementEntry & HabitEntry;
