import { BackButton } from '../components/BackButton';
import { useMemo, useState, type FormEvent } from 'react';
import type { HabitEntry, MeasurementEntry } from '../types/progress';

type ProgressPageProps = {
  onBack: () => void;
  measurements: MeasurementEntry[];
  habits: HabitEntry[];
  onSaveMeasurement: (entry: MeasurementEntry) => Promise<void>;
  onSaveHabit: (entry: HabitEntry) => Promise<void>;
};

type ProgressTab = 'measurements' | 'charts' | 'habits';
type MeasurementFormState = Record<MeasurementKey, string>;
type HabitFormState = { steps: string; sleep: string; water: string };
type MeasurementKey = 'weight' | 'neck' | 'chest' | 'waist' | 'hips' | 'leg' | 'arm';

const todayDate = () => new Date().toISOString().slice(0, 10);
const STEPS_GOAL = 10000;
const SLEEP_GOAL = 7.5;
const WATER_GOAL = 2.5;

const measurementFields: { key: MeasurementKey; label: string; placeholder: string; suffix: string }[] = [
  { key: 'weight', label: 'Вес, кг', placeholder: '58.4', suffix: ' кг' },
  { key: 'neck', label: 'Объём шеи, см', placeholder: '34', suffix: ' см' },
  { key: 'chest', label: 'Объём груди, см', placeholder: '88', suffix: ' см' },
  { key: 'waist', label: 'Объём талии, см', placeholder: '68', suffix: ' см' },
  { key: 'hips', label: 'Объём бедер, см', placeholder: '96', suffix: ' см' },
  { key: 'leg', label: 'Объём ноги, см', placeholder: '55', suffix: ' см' },
  { key: 'arm', label: 'Объём руки, см', placeholder: '28', suffix: ' см' },
];

const createMeasurementFormState = (measurements: MeasurementEntry[] = []): MeasurementFormState => {
  const todayEntry = measurements.find((entry) => entry.date === todayDate());
  return measurementFields.reduce((state, field) => ({ ...state, [field.key]: todayEntry?.[field.key]?.toString() ?? '' }), {} as MeasurementFormState);
};

const createHabitFormState = (habits: HabitEntry[] = []): HabitFormState => {
  const todayEntry = habits.find((entry) => entry.date === todayDate());
  return {
    steps: todayEntry?.steps?.toString() ?? '',
    sleep: todayEntry?.sleep?.toString() ?? '',
    water: todayEntry?.water?.toString() ?? '',
  };
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T00:00:00`));

const parseOptionalNumber = (value: string) => {
  if (!value.trim()) return undefined;
  const parsedValue = Number(value.replace(',', '.'));
  return Number.isNaN(parsedValue) ? undefined : parsedValue;
};

const clampProgress = (value: number | undefined, goal: number) => {
  if (value === undefined || value <= 0) return 0;
  return Math.min((value / goal) * 100, 100);
};

const formatValue = (value: number | undefined, suffix = '') => (value === undefined ? '—' : `${value}${suffix}`);

function TrackerInput({
  description,
  label,
  min = '0',
  onChange,
  placeholder,
  progressLabel,
  progressValue,
  step = '0.1',
  value,
}: {
  description?: string;
  label: string;
  min?: string;
  onChange: (value: string) => void;
  placeholder: string;
  progressLabel?: string;
  progressValue?: number;
  step?: string;
  value: string;
}) {
  return (
    <label className="block rounded-[1.75rem] border border-[#D99663]/20 bg-[#FFFDF8] p-4 shadow-sm shadow-[#F3E2BF]/70">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-[#6E7E1F]">{label}</span>
      {description && <span className="mt-1 block text-sm font-semibold leading-5 text-[#8B725F]">{description}</span>}
      <input
        className="mt-3 w-full rounded-2xl border border-[#D99663]/30 bg-[#F3E2BF]/35 px-4 py-3 text-base font-black text-[#37410F] outline-none transition placeholder:text-[#8B725F]/70 focus:border-[#6E7E1F] focus:bg-white"
        inputMode="decimal"
        min={min}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        step={step}
        type="number"
        value={value}
      />
      {progressLabel && progressValue !== undefined && (
        <span className="mt-3 block">
          <span className="flex items-center justify-between text-xs font-black text-[#8B725F]"><span>{progressLabel}</span></span>
          <span className="mt-2 block h-2 overflow-hidden rounded-full bg-[#F3E2BF]"><span className="block h-full rounded-full bg-[#6E7E1F]" style={{ width: `${progressValue}%` }} /></span>
        </span>
      )}
    </label>
  );
}

function LineChart({ entries, selectedMetric }: { entries: MeasurementEntry[]; selectedMetric: MeasurementKey }) {
  const points = entries
    .slice()
    .sort((first, second) => new Date(first.date).getTime() - new Date(second.date).getTime())
    .map((entry) => ({ date: entry.date, value: entry[selectedMetric] }))
    .filter((point): point is { date: string; value: number } => point.value !== undefined);
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const svgPoints = points.map((point, index) => {
    const x = points.length === 1 ? 140 : 20 + (index * 260) / (points.length - 1);
    const y = 130 - ((point.value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="rounded-[2rem] border border-[#D99663]/20 bg-[#FFFDF8] p-4 shadow-sm shadow-[#F3E2BF]/70">
      <svg className="h-44 w-full" preserveAspectRatio="none" viewBox="0 0 300 160" role="img" aria-label="График прогресса">
        <line x1="20" x2="280" y1="130" y2="130" stroke="#F3E2BF" strokeWidth="3" />
        <line x1="20" x2="20" y1="20" y2="130" stroke="#F3E2BF" strokeWidth="3" />
        <polyline fill="none" points={svgPoints} stroke="#6E7E1F" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
        {svgPoints.split(' ').map((point) => {
          const [x, y] = point.split(',');
          return <circle cx={x} cy={y} fill="#D99663" key={point} r="5" />;
        })}
      </svg>
      <div className="mt-2 flex justify-between text-xs font-black text-[#8B725F]">
        <span>{formatDate(points[0].date)}</span>
        <span>{formatDate(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}

export function ProgressPage({ measurements, habits, onBack, onSaveMeasurement, onSaveHabit }: ProgressPageProps) {
  const [activeTab, setActiveTab] = useState<ProgressTab>('measurements');
  const [measurementForm, setMeasurementForm] = useState(() => createMeasurementFormState(measurements));
  const [habitForm, setHabitForm] = useState(() => createHabitFormState(habits));
  const [selectedMetric, setSelectedMetric] = useState<MeasurementKey>('weight');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const today = todayDate();
  const sortedMeasurements = useMemo(() => [...measurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [measurements]);
  const sortedHabits = useMemo(() => [...habits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7), [habits]);
  const chartEntries = sortedMeasurements.filter((entry) => entry[selectedMetric] !== undefined);
  const firstChartEntry = chartEntries[chartEntries.length - 1];
  const lastChartEntry = chartEntries[0];
  const selectedField = measurementFields.find((field) => field.key === selectedMetric) ?? measurementFields[0];
  const chartDelta = firstChartEntry && lastChartEntry ? Number((lastChartEntry[selectedMetric]! - firstChartEntry[selectedMetric]!).toFixed(1)) : 0;
  const currentSteps = parseOptionalNumber(habitForm.steps);
  const currentSleep = parseOptionalNumber(habitForm.sleep);
  const currentWater = parseOptionalNumber(habitForm.water);

  const showNotice = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 2200);
  };

  const handleMeasurementSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSaveMeasurement({
        id: today,
        date: today,
        weight: parseOptionalNumber(measurementForm.weight),
        neck: parseOptionalNumber(measurementForm.neck),
        chest: parseOptionalNumber(measurementForm.chest),
        waist: parseOptionalNumber(measurementForm.waist),
        hips: parseOptionalNumber(measurementForm.hips),
        leg: parseOptionalNumber(measurementForm.leg),
        arm: parseOptionalNumber(measurementForm.arm),
      });
      showNotice('Замеры сохранены в профиле');
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Не удалось сохранить замеры');
    } finally {
      setSaving(false);
    }
  };

  const handleHabitSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSaveHabit({ id: today, date: today, steps: currentSteps, sleep: currentSleep, water: currentWater });
      showNotice('День сохранён в профиле');
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Не удалось сохранить день');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="flex flex-1 flex-col">
      <BackButton onClick={onBack} />
      <div className="overflow-hidden rounded-[2rem] bg-[#F3E2BF] p-6 text-[#37410F] shadow-xl shadow-[#F3E2BF]/70">
        <h1 className="text-3xl font-black tracking-tight">Прогресс</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-[#8B725F]">Вес, шаги, сон и вода помогают видеть общую картину и оценивать прогресс.</p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 rounded-[2rem] bg-[#FFFDF8] p-2 shadow-sm shadow-[#F3E2BF]/70">
        {[
          ['measurements', 'Замеры'],
          ['charts', 'Графики'],
          ['habits', 'Привычки'],
        ].map(([id, label]) => (
          <button className={`rounded-2xl px-2 py-3 text-sm font-black transition ${activeTab === id ? 'bg-[#6E7E1F] text-white' : 'text-[#8B725F] hover:bg-[#F3E2BF]/70'}`} key={id} onClick={() => setActiveTab(id as ProgressTab)} type="button">{label}</button>
        ))}
      </div>
      {notice && <p className="mt-3 rounded-2xl bg-[#F3E2BF] px-4 py-3 text-center text-sm font-black text-[#37410F]">{notice}</p>}

      {activeTab === 'measurements' && <section className="mt-5">
        <article className="rounded-[2rem] border border-[#D99663]/20 bg-[#FFFDF8] p-5 shadow-sm shadow-[#F3E2BF]/70">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#6E7E1F]">Сегодня</p><h2 className="mt-1 text-xl font-black text-[#37410F]">Замеры тела</h2></div><span className="rounded-full bg-[#F3E2BF] px-3 py-1 text-xs font-black text-[#8B725F]">{formatDate(today)}</span></div>
          <form className="mt-4 space-y-3" onSubmit={handleMeasurementSubmit}>
            {measurementFields.map((field) => <TrackerInput key={field.key} label={field.label} onChange={(value) => setMeasurementForm((state) => ({ ...state, [field.key]: value }))} placeholder={field.placeholder} value={measurementForm[field.key]} />)}
            <button className="w-full rounded-2xl bg-[#6E7E1F] px-4 py-3 text-base font-black text-white shadow-lg shadow-[#F3E2BF]/70 transition hover:bg-[#37410F] disabled:cursor-wait disabled:opacity-60" disabled={saving} type="submit">{saving ? 'Сохраняем…' : 'Сохранить замеры'}</button>
          </form>
        </article>
        <h2 className="mt-5 text-xl font-black text-[#37410F]">История замеров</h2>
        {sortedMeasurements.length === 0 ? <div className="mt-3 rounded-[2rem] bg-[#FFFDF8] p-6 text-center shadow-sm shadow-[#F3E2BF]/70"><p className="text-5xl">🌷</p><p className="mt-3 text-sm font-semibold leading-5 text-[#8B725F]">Пока нет замеров. Добавь первую запись — и динамика появится здесь.</p></div> : <div className="mt-3 space-y-3">{sortedMeasurements.map((entry) => <article className="rounded-[2rem] border border-[#D99663]/15 bg-[#FFFDF8] p-4 shadow-sm shadow-[#F3E2BF]/70" key={entry.id}><h3 className="text-base font-black text-[#37410F]">{formatDate(entry.date)}</h3><div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black text-[#8B725F]">{measurementFields.map((field) => <span className="rounded-2xl bg-[#F3E2BF]/70 px-3 py-2" key={field.key}>{field.label.replace(', кг', '').replace(', см', '')} {formatValue(entry[field.key], field.suffix)}</span>)}</div></article>)}</div>}
      </section>}

      {activeTab === 'charts' && <section className="mt-5 space-y-4">
        <label className="block rounded-[1.75rem] border border-[#D99663]/20 bg-[#FFFDF8] p-4 shadow-sm shadow-[#F3E2BF]/70"><span className="text-xs font-black uppercase tracking-[0.16em] text-[#6E7E1F]">Показатель</span><select className="mt-3 w-full rounded-2xl border border-[#D99663]/30 bg-[#F3E2BF]/35 px-4 py-3 text-base font-black text-[#37410F] outline-none focus:border-[#6E7E1F] focus:bg-white" onChange={(event) => setSelectedMetric(event.target.value as MeasurementKey)} value={selectedMetric}>{measurementFields.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}</select></label>
        {chartEntries.length < 2 ? <div className="rounded-[2rem] bg-[#FFFDF8] p-6 text-center shadow-sm shadow-[#F3E2BF]/70"><p className="text-5xl">📈</p><p className="mt-3 text-sm font-semibold leading-5 text-[#8B725F]">Добавь хотя бы две записи замеров, чтобы увидеть график прогресса.</p></div> : <><LineChart entries={chartEntries} selectedMetric={selectedMetric} /><div className="grid grid-cols-3 gap-2 text-center text-xs font-black text-[#8B725F]"><span className="rounded-2xl bg-[#FFFDF8] p-3 shadow-sm shadow-[#F3E2BF]/70">Первое<br />{formatValue(firstChartEntry?.[selectedMetric], selectedField.suffix)}</span><span className="rounded-2xl bg-[#FFFDF8] p-3 shadow-sm shadow-[#F3E2BF]/70">Последнее<br />{formatValue(lastChartEntry?.[selectedMetric], selectedField.suffix)}</span><span className="rounded-2xl bg-[#FFFDF8] p-3 shadow-sm shadow-[#F3E2BF]/70">Изменение<br />{chartDelta > 0 ? '+' : ''}{chartDelta}{selectedField.suffix}</span></div></>}
      </section>}

      {activeTab === 'habits' && <section className="mt-5">
        <article className="rounded-[2rem] border border-[#D99663]/20 bg-[#FFFDF8] p-5 shadow-sm shadow-[#F3E2BF]/70">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#6E7E1F]">Сегодня</p><h2 className="mt-1 text-xl font-black text-[#37410F]">Ежедневные привычки</h2></div><span className="rounded-full bg-[#F3E2BF] px-3 py-1 text-xs font-black text-[#8B725F]">{formatDate(today)}</span></div>
          <form className="mt-4 space-y-3" onSubmit={handleHabitSubmit}>
            <TrackerInput description="Цель по умолчанию — 10000 шагов" label="Шаги" onChange={(value) => setHabitForm((state) => ({ ...state, steps: value }))} placeholder="8700" progressLabel={`${currentSteps ?? 0} / ${STEPS_GOAL}`} progressValue={clampProgress(currentSteps, STEPS_GOAL)} step="1" value={habitForm.steps} />
            <TrackerInput description="Цель по умолчанию — 7.5 часов" label="Сон" onChange={(value) => setHabitForm((state) => ({ ...state, sleep: value }))} placeholder="7.5" progressLabel={`${currentSleep ?? 0} / ${SLEEP_GOAL} ч`} progressValue={clampProgress(currentSleep, SLEEP_GOAL)} value={habitForm.sleep} />
            <TrackerInput description="Цель по умолчанию — 2.5 л" label="Вода" onChange={(value) => setHabitForm((state) => ({ ...state, water: value }))} placeholder="2.1" progressLabel={`${currentWater ?? 0} / ${WATER_GOAL} л`} progressValue={clampProgress(currentWater, WATER_GOAL)} value={habitForm.water} />
            <button className="w-full rounded-2xl bg-[#6E7E1F] px-4 py-3 text-base font-black text-white shadow-lg shadow-[#F3E2BF]/70 transition hover:bg-[#37410F] disabled:cursor-wait disabled:opacity-60" disabled={saving} type="submit">{saving ? 'Сохраняем…' : 'Сохранить день'}</button>
          </form>
        </article>
        <h2 className="mt-5 text-xl font-black text-[#37410F]">История привычек</h2>
        {sortedHabits.length === 0 ? <div className="mt-3 rounded-[2rem] bg-[#FFFDF8] p-6 text-center shadow-sm shadow-[#F3E2BF]/70"><p className="text-5xl">🌿</p><p className="mt-3 text-sm font-semibold leading-5 text-[#8B725F]">Пока нет записей. Заполни сегодняшний день — и история появится здесь.</p></div> : <div className="mt-3 space-y-3">{sortedHabits.map((entry) => <article className="rounded-[2rem] border border-[#D99663]/15 bg-[#FFFDF8] p-4 shadow-sm shadow-[#F3E2BF]/70" key={entry.id}><h3 className="text-base font-black text-[#37410F]">{formatDate(entry.date)}</h3><div className="mt-3 grid grid-cols-3 gap-2 text-xs font-black text-[#8B725F]"><span className="rounded-2xl bg-[#F3E2BF]/70 px-3 py-2">Шаги {formatValue(entry.steps)}</span><span className="rounded-2xl bg-[#F3E2BF]/70 px-3 py-2">Сон {formatValue(entry.sleep, ' ч')}</span><span className="rounded-2xl bg-[#F3E2BF]/70 px-3 py-2">Вода {formatValue(entry.water, ' л')}</span></div></article>)}</div>}
      </section>}
    </section>
  );
}
