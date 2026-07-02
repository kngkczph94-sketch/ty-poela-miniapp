import { useMemo, useState, type FormEvent } from 'react';
import type { ProgressEntry } from '../types/progress';

type ProgressPageProps = {
  entries: ProgressEntry[];
  onSaveEntry: (entry: ProgressEntry) => void;
};

type ProgressFormState = {
  weight: string;
  steps: string;
  sleep: string;
  water: string;
};

const todayDate = () => new Date().toISOString().slice(0, 10);
const STEPS_GOAL = 10000;
const SLEEP_GOAL = 7.5;
const WATER_GOAL = 2.5;

const createInitialFormState = (entries: ProgressEntry[] = []): ProgressFormState => {
  const todayEntry = entries.find((entry) => entry.date === todayDate());

  return {
    weight: todayEntry?.weight?.toString() ?? '',
    steps: todayEntry?.steps?.toString() ?? '',
    sleep: todayEntry?.sleep?.toString() ?? '',
    water: todayEntry?.water?.toString() ?? '',
  };
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T00:00:00`));

const parseOptionalNumber = (value: string) => {
  if (!value.trim()) {
    return undefined;
  }

  const parsedValue = Number(value.replace(',', '.'));
  return Number.isNaN(parsedValue) ? undefined : parsedValue;
};

const clampProgress = (value: number | undefined, goal: number) => {
  if (value === undefined || value <= 0) {
    return 0;
  }

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
  description: string;
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
      <span className="mt-1 block text-sm font-semibold leading-5 text-[#8B725F]">{description}</span>
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

export function ProgressPage({ entries, onSaveEntry }: ProgressPageProps) {
  const [formState, setFormState] = useState(() => createInitialFormState(entries));
  const [notice, setNotice] = useState('');
  const today = todayDate();
  const sortedEntries = useMemo(
    () => [...entries].sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime()).slice(0, 7),
    [entries],
  );
  const currentSteps = parseOptionalNumber(formState.steps);
  const currentSleep = parseOptionalNumber(formState.sleep);
  const currentWater = parseOptionalNumber(formState.water);

  const updateForm = (field: keyof ProgressFormState, value: string) => {
    setFormState((currentState) => ({ ...currentState, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSaveEntry({
      id: today,
      date: today,
      weight: parseOptionalNumber(formState.weight),
      steps: currentSteps,
      sleep: currentSleep,
      water: currentWater,
    });
    setNotice('День сохранён');
    window.setTimeout(() => setNotice(''), 2200);
  };

  return (
    <section className="flex flex-1 flex-col">
      <div className="overflow-hidden rounded-[2rem] bg-[#F3E2BF] p-6 text-[#37410F] shadow-xl shadow-[#F3E2BF]/70">
        <h1 className="text-3xl font-black tracking-tight">Прогресс</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-[#8B725F]">Вес, шаги, сон и вода помогают видеть общую картину и оценивать прогресс.</p>
      </div>

      <article className="mt-5 rounded-[2rem] border border-[#D99663]/20 bg-[#FFFDF8] p-5 shadow-sm shadow-[#F3E2BF]/70">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6E7E1F]">Сегодня</p>
            <h2 className="mt-1 text-xl font-black text-[#37410F]">Данные за день</h2>
          </div>
          <span className="rounded-full bg-[#F3E2BF] px-3 py-1 text-xs font-black text-[#8B725F]">{formatDate(today)}</span>
        </div>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <TrackerInput description="Поле ввода в кг" label="Вес" onChange={(value) => updateForm('weight', value)} placeholder="58.4" value={formState.weight} />
          <TrackerInput description="Цель по умолчанию — 10000 шагов" label="Шаги" onChange={(value) => updateForm('steps', value)} placeholder="8700" progressLabel={`${currentSteps ?? 0} / ${STEPS_GOAL}`} progressValue={clampProgress(currentSteps, STEPS_GOAL)} step="1" value={formState.steps} />
          <TrackerInput description="Цель по умолчанию — 7.5 часов" label="Сон" onChange={(value) => updateForm('sleep', value)} placeholder="7.5" progressLabel={`${currentSleep ?? 0} / ${SLEEP_GOAL} ч`} progressValue={clampProgress(currentSleep, SLEEP_GOAL)} value={formState.sleep} />
          <TrackerInput description="Цель по умолчанию — 2.5 л" label="Вода" onChange={(value) => updateForm('water', value)} placeholder="2.1" progressLabel={`${currentWater ?? 0} / ${WATER_GOAL} л`} progressValue={clampProgress(currentWater, WATER_GOAL)} value={formState.water} />

          <button className="w-full rounded-2xl bg-[#6E7E1F] px-4 py-3 text-base font-black text-white shadow-lg shadow-[#F3E2BF]/70 transition hover:bg-[#37410F]" type="submit">
            Сохранить день
          </button>
        </form>
        {notice && <p className="mt-3 rounded-2xl bg-[#F3E2BF] px-4 py-3 text-center text-sm font-black text-[#37410F]">{notice}</p>}
      </article>

      <section className="mt-5">
        <h2 className="text-xl font-black text-[#37410F]">История</h2>
        {sortedEntries.length === 0 ? (
          <div className="mt-3 rounded-[2rem] bg-[#FFFDF8] p-6 text-center shadow-sm shadow-[#F3E2BF]/70">
            <p className="text-5xl">🌷</p>
            <p className="mt-3 text-sm font-semibold leading-5 text-[#8B725F]">Пока нет записей. Заполни сегодняшний день — и динамика появится здесь.</p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {sortedEntries.map((entry) => (
              <article className="rounded-[2rem] border border-[#D99663]/15 bg-[#FFFDF8] p-4 shadow-sm shadow-[#F3E2BF]/70" key={entry.id}>
                <h3 className="text-base font-black text-[#37410F]">{formatDate(entry.date)}</h3>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black text-[#8B725F]">
                  <span className="rounded-2xl bg-[#F3E2BF]/70 px-3 py-2">Вес {formatValue(entry.weight, ' кг')}</span>
                  <span className="rounded-2xl bg-[#F3E2BF]/70 px-3 py-2">Шаги {formatValue(entry.steps)}</span>
                  <span className="rounded-2xl bg-[#F3E2BF]/70 px-3 py-2">Сон {formatValue(entry.sleep, ' ч')}</span>
                  <span className="rounded-2xl bg-[#F3E2BF]/70 px-3 py-2">Вода {formatValue(entry.water, ' л')}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
