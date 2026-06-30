import { useMemo, useState, type FormEvent } from 'react';
import type { ProgressEntry } from '../types/progress';

type ProgressPageProps = {
  entries: ProgressEntry[];
  onAddEntry: (entry: ProgressEntry) => void;
  onDeleteEntry: (entryId: string) => void;
};

type ProgressFormState = {
  date: string;
  weight: string;
  waist: string;
  hips: string;
  chest: string;
  comment: string;
};

const createInitialFormState = (): ProgressFormState => ({
  date: new Date().toISOString().slice(0, 10),
  weight: '',
  waist: '',
  hips: '',
  chest: '',
  comment: '',
});

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date));

const parseOptionalNumber = (value: string) => {
  if (!value.trim()) {
    return undefined;
  }

  const parsedValue = Number(value.replace(',', '.'));
  return Number.isNaN(parsedValue) ? undefined : parsedValue;
};

const formatDifference = (difference: number) => {
  if (difference > 0) {
    return `+${difference.toFixed(1)} кг`;
  }

  return `${difference.toFixed(1)} кг`;
};

function ProgressInput({
  label,
  min,
  onChange,
  placeholder,
  step = '0.1',
  type = 'number',
  value,
}: {
  label: string;
  min?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  step?: string;
  type?: 'date' | 'number';
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-orange-500">{label}</span>
      <input
        className="mt-2 w-full rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-orange-300 focus:bg-white"
        min={min}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        step={step}
        type={type}
        value={value}
      />
    </label>
  );
}

export function ProgressPage({ entries, onAddEntry, onDeleteEntry }: ProgressPageProps) {
  const [formState, setFormState] = useState(createInitialFormState);
  const [notice, setNotice] = useState('');
  const sortedEntries = useMemo(
    () => [...entries].sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime()),
    [entries],
  );
  const weightedEntries = useMemo(
    () => [...entries].filter((entry) => entry.weight !== undefined).sort((first, second) => new Date(first.date).getTime() - new Date(second.date).getTime()),
    [entries],
  );
  const firstWeightedEntry = weightedEntries[0];
  const lastWeightedEntry = weightedEntries[weightedEntries.length - 1];

  const updateForm = (field: keyof ProgressFormState, value: string) => {
    setFormState((currentState) => ({ ...currentState, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onAddEntry({
      id: crypto.randomUUID(),
      date: formState.date,
      weight: parseOptionalNumber(formState.weight),
      waist: parseOptionalNumber(formState.waist),
      hips: parseOptionalNumber(formState.hips),
      chest: parseOptionalNumber(formState.chest),
      comment: formState.comment.trim() || undefined,
    });
    setFormState(createInitialFormState());
    setNotice('Замер добавлен');
    window.setTimeout(() => setNotice(''), 2200);
  };

  return (
    <section className="flex flex-1 flex-col">
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-rose-400 via-orange-400 to-amber-300 p-6 text-white shadow-xl shadow-orange-200/70">
        <p className="text-sm font-bold uppercase tracking-wide text-white/80">8 этап</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Прогресс</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-white/90">Спокойная динамика без оценок</p>
      </div>

      <article className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm shadow-orange-100">
        <h2 className="text-xl font-black text-slate-950">Новый замер</h2>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <ProgressInput label="Дата" onChange={(value) => updateForm('date', value)} type="date" value={formState.date} />
          <div className="grid grid-cols-2 gap-3">
            <ProgressInput label="Вес" onChange={(value) => updateForm('weight', value)} placeholder="кг" value={formState.weight} />
            <ProgressInput label="Талия" onChange={(value) => updateForm('waist', value)} placeholder="см" value={formState.waist} />
            <ProgressInput label="Бедра" onChange={(value) => updateForm('hips', value)} placeholder="см" value={formState.hips} />
            <ProgressInput label="Грудь" onChange={(value) => updateForm('chest', value)} placeholder="см" value={formState.chest} />
          </div>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-orange-500">Комментарий</span>
            <textarea
              className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-orange-300 focus:bg-white"
              onChange={(event) => updateForm('comment', event.target.value)}
              placeholder="Любая спокойная заметка"
              value={formState.comment}
            />
          </label>
          <button className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-base font-black text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600" type="submit">
            Добавить замер
          </button>
        </form>
        {notice && <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-black text-emerald-700">{notice}</p>}
      </article>

      <article className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm shadow-orange-100">
        <h2 className="text-xl font-black text-slate-950">Динамика веса</h2>
        {weightedEntries.length >= 2 && firstWeightedEntry.weight !== undefined && lastWeightedEntry.weight !== undefined ? (
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-3xl bg-orange-50 p-3"><p className="text-[11px] font-black uppercase text-orange-500">Первый замер</p><p className="mt-1 text-lg font-black text-slate-950">{firstWeightedEntry.weight} кг</p></div>
            <div className="rounded-3xl bg-amber-50 p-3"><p className="text-[11px] font-black uppercase text-amber-600">Последний замер</p><p className="mt-1 text-lg font-black text-slate-950">{lastWeightedEntry.weight} кг</p></div>
            <div className="rounded-3xl bg-rose-50 p-3"><p className="text-[11px] font-black uppercase text-rose-500">Разница</p><p className="mt-1 text-lg font-black text-slate-950">{formatDifference(lastWeightedEntry.weight - firstWeightedEntry.weight)}</p></div>
          </div>
        ) : (
          <p className="mt-3 rounded-3xl bg-orange-50 p-4 text-sm font-bold leading-5 text-slate-500">Добавь несколько замеров, чтобы увидеть динамику</p>
        )}
      </article>

      <section className="mt-5">
        <h2 className="text-xl font-black text-slate-950">История замеров</h2>
        {sortedEntries.length === 0 ? (
          <div className="mt-3 rounded-[2rem] bg-white p-6 text-center shadow-sm shadow-orange-100">
            <p className="text-5xl">🌷</p>
            <p className="mt-3 text-lg font-black text-slate-950">Добавь первый замер, чтобы видеть динамику</p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {sortedEntries.map((entry) => (
              <article className="rounded-[2rem] bg-white p-4 shadow-sm shadow-orange-100" key={entry.id}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-black text-slate-950">{formatDate(entry.date)}</h3>
                  <button className="rounded-full bg-rose-50 px-3 py-2 text-xs font-black text-rose-500 transition hover:bg-rose-100" onClick={() => onDeleteEntry(entry.id)} type="button">Удалить</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-slate-600">
                  {entry.weight !== undefined && <span className="rounded-full bg-orange-50 px-3 py-2">Вес {entry.weight} кг</span>}
                  {entry.waist !== undefined && <span className="rounded-full bg-orange-50 px-3 py-2">Талия {entry.waist} см</span>}
                  {entry.hips !== undefined && <span className="rounded-full bg-orange-50 px-3 py-2">Бедра {entry.hips} см</span>}
                  {entry.chest !== undefined && <span className="rounded-full bg-orange-50 px-3 py-2">Грудь {entry.chest} см</span>}
                </div>
                {entry.comment && <p className="mt-3 rounded-3xl bg-slate-50 p-3 text-sm font-semibold leading-5 text-slate-500">{entry.comment}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
