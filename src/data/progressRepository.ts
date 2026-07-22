import { supabase } from '../lib/supabase';
import type { HabitEntry, MeasurementEntry } from '../types/progress';

type MeasurementRow = {
  id: string;
  measured_on: string;
  weight_kg: number | null;
  neck_cm: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  leg_cm: number | null;
  arm_cm: number | null;
};

type HabitRow = {
  id: string;
  entry_date: string;
  steps: number | null;
  water_ml: number | null;
  sleep_minutes: number | null;
};

const hasMeasurement = (entry: MeasurementEntry) =>
  [entry.weight, entry.neck, entry.chest, entry.waist, entry.hips, entry.leg, entry.arm].some((value) => value !== undefined);

const hasHabit = (entry: HabitEntry) =>
  [entry.steps, entry.water, entry.sleep].some((value) => value !== undefined);

const requireProfileId = async () => {
  const { data, error } = await supabase.from('users').select('id').single();
  if (error || !data?.id) throw new Error('Не удалось определить профиль пользователя.');
  return data.id as string;
};

const measurementPayload = (userId: string, entry: MeasurementEntry) => ({
  user_id: userId,
  measured_on: entry.date,
  weight_kg: entry.weight ?? null,
  neck_cm: entry.neck ?? null,
  chest_cm: entry.chest ?? null,
  waist_cm: entry.waist ?? null,
  hips_cm: entry.hips ?? null,
  leg_cm: entry.leg ?? null,
  arm_cm: entry.arm ?? null,
});

const habitPayload = (userId: string, entry: HabitEntry) => ({
  user_id: userId,
  entry_date: entry.date,
  steps: entry.steps === undefined ? null : Math.round(entry.steps),
  water_ml: entry.water === undefined ? null : Math.round(entry.water * 1000),
  sleep_minutes: entry.sleep === undefined ? null : Math.round(entry.sleep * 60),
});

const mapMeasurement = (row: MeasurementRow): MeasurementEntry => ({
  id: row.id,
  date: row.measured_on,
  weight: row.weight_kg ?? undefined,
  neck: row.neck_cm ?? undefined,
  chest: row.chest_cm ?? undefined,
  waist: row.waist_cm ?? undefined,
  hips: row.hips_cm ?? undefined,
  leg: row.leg_cm ?? undefined,
  arm: row.arm_cm ?? undefined,
});

const mapHabit = (row: HabitRow): HabitEntry => ({
  id: row.id,
  date: row.entry_date,
  steps: row.steps ?? undefined,
  water: row.water_ml === null ? undefined : row.water_ml / 1000,
  sleep: row.sleep_minutes === null ? undefined : row.sleep_minutes / 60,
});

const loadRemoteProgress = async () => {
  const [measurementsResult, habitsResult] = await Promise.all([
    supabase
      .from('measurements')
      .select('id, measured_on, weight_kg, neck_cm, chest_cm, waist_cm, hips_cm, leg_cm, arm_cm')
      .order('measured_on', { ascending: false }),
    supabase
      .from('habit_entries')
      .select('id, entry_date, steps, water_ml, sleep_minutes')
      .order('entry_date', { ascending: false }),
  ]);

  if (measurementsResult.error) throw measurementsResult.error;
  if (habitsResult.error) throw habitsResult.error;

  return {
    measurements: ((measurementsResult.data ?? []) as MeasurementRow[]).map(mapMeasurement),
    habits: ((habitsResult.data ?? []) as HabitRow[]).map(mapHabit),
  };
};

export async function syncProgress(localMeasurements: MeasurementEntry[], localHabits: HabitEntry[]) {
  const userId = await requireProfileId();
  const remote = await loadRemoteProgress();
  const remoteMeasurementDates = new Set(remote.measurements.map((entry) => entry.date));
  const remoteHabitDates = new Set(remote.habits.map((entry) => entry.date));
  const measurementsToMigrate = localMeasurements.filter((entry) => hasMeasurement(entry) && !remoteMeasurementDates.has(entry.date));
  const habitsToMigrate = localHabits.filter((entry) => hasHabit(entry) && !remoteHabitDates.has(entry.date));

  if (measurementsToMigrate.length > 0) {
    const { error } = await supabase
      .from('measurements')
      .upsert(measurementsToMigrate.map((entry) => measurementPayload(userId, entry)), { onConflict: 'user_id,measured_on' });
    if (error) throw error;
  }

  if (habitsToMigrate.length > 0) {
    const { error } = await supabase
      .from('habit_entries')
      .upsert(habitsToMigrate.map((entry) => habitPayload(userId, entry)), { onConflict: 'user_id,entry_date' });
    if (error) throw error;
  }

  return measurementsToMigrate.length > 0 || habitsToMigrate.length > 0
    ? loadRemoteProgress()
    : remote;
}

export async function persistMeasurement(entry: MeasurementEntry) {
  if (!hasMeasurement(entry)) throw new Error('Добавьте хотя бы один замер.');
  const userId = await requireProfileId();
  const { error } = await supabase
    .from('measurements')
    .upsert(measurementPayload(userId, entry), { onConflict: 'user_id,measured_on' });
  if (error) throw error;
}

export async function persistHabit(entry: HabitEntry) {
  if (!hasHabit(entry)) throw new Error('Добавьте шаги, воду или сон.');
  const userId = await requireProfileId();
  const { error } = await supabase
    .from('habit_entries')
    .upsert(habitPayload(userId, entry), { onConflict: 'user_id,entry_date' });
  if (error) throw error;
}
