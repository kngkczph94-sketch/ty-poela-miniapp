import { useMemo, useRef, useState, type FormEvent } from 'react';
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
      <span className="text-xs font-black uppercase tracking-[0.16em] text-[#6E7E1F]">{label}</span>
      <input
        className="mt-2 w-full rounded-2xl border border-[#8B725F]/35 bg-[#F3E2BF]/40 px-4 py-3 text-sm font-bold text-[#37410F] outline-none transition placeholder:text-[#8B725F] focus:border-[#8B725F]/35 focus:bg-white"
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
  const formRef = useRef<HTMLFormElement>(null);
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
      <div className="overflow-hidden rounded-[2rem] bg-[#F3E2BF] p-6 text-[#37410F] shadow-xl shadow-[#F3E2BF]/70">
        <p className="text-sm font-bold uppercase tracking-wide text-[#8B725F]">8 этап</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Прогресс</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-[#8B725F]">Спокойная динамика без оценок</p>
      </div>

      <article className="mt-5 rounded-[2rem] bg-[#FFFDF8] p-5 shadow-sm shadow-[#F3E2BF]/70">
        <h2 className="text-xl font-black text-[#37410F]">Новый замер</h2>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit} ref={formRef}>
          <ProgressInput label="Дата" onChange={(value) => updateForm('date', value)} type="date" value={formState.date} />
          <div className="grid grid-cols-2 gap-3">
            <ProgressInput label="Вес" onChange={(value) => updateForm('weight', value)} placeholder="кг" value={formState.weight} />
            <ProgressInput label="Талия" onChange={(value) => updateForm('waist', value)} placeholder="см" value={formState.waist} />
            <ProgressInput label="Бедра" onChange={(value) => updateForm('hips', value)} placeholder="см" value={formState.hips} />
            <ProgressInput label="Грудь" onChange={(value) => updateForm('chest', value)} placeholder="см" value={formState.chest} />
          </div>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-[#6E7E1F]">Комментарий</span>
            <textarea
              className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-[#8B725F]/35 bg-[#F3E2BF]/40 px-4 py-3 text-sm font-bold text-[#37410F] outline-none transition placeholder:text-[#8B725F] focus:border-[#8B725F]/35 focus:bg-white"
              onChange={(event) => updateForm('comment', event.target.value)}
              placeholder="Любая спокойная заметка"
              value={formState.comment}
            />
          </label>
          <button className="w-full rounded-2xl bg-[#6E7E1F] px-4 py-3 text-base font-black text-white shadow-lg shadow-[#F3E2BF]/70 transition hover:bg-[#37410F]" type="submit">
            Добавить замер
          </button>
        </form>
        {notice && <p className="mt-3 rounded-2xl bg-[#F3E2BF] px-4 py-3 text-center text-sm font-black text-[#37410F]">{notice}</p>}
      </article>

      <article className="mt-5 rounded-[2rem] bg-[#FFFDF8] p-5 shadow-sm shadow-[#F3E2BF]/70">
        <h2 className="text-xl font-black text-[#37410F]">Динамика веса</h2>
        {weightedEntries.length >= 2 && firstWeightedEntry.weight !== undefined && lastWeightedEntry.weight !== undefined ? (
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-3xl bg-[#F3E2BF] p-3"><p className="text-[11px] font-black uppercase text-[#6E7E1F]">Первый замер</p><p className="mt-1 text-lg font-black text-[#37410F]">{firstWeightedEntry.weight} кг</p></div>
            <div className="rounded-3xl bg-[#F3E2BF] p-3"><p className="text-[11px] font-black uppercase text-[#37410F]">Последний замер</p><p className="mt-1 text-lg font-black text-[#37410F]">{lastWeightedEntry.weight} кг</p></div>
            <div className="rounded-3xl bg-[#F3E2BF] p-3"><p className="text-[11px] font-black uppercase text-[#37410F]">Разница</p><p className="mt-1 text-lg font-black text-[#37410F]">{formatDifference(lastWeightedEntry.weight - firstWeightedEntry.weight)}</p></div>
          </div>
        ) : (
          <p className="mt-3 rounded-3xl bg-[#F3E2BF] p-4 text-sm font-bold leading-5 text-[#8B725F]">Добавь несколько замеров, чтобы увидеть динамику</p>
        )}
      </article>

      <section className="mt-5">
        <h2 className="text-xl font-black text-[#37410F]">История замеров</h2>
        {sortedEntries.length === 0 ? (
          <div className="mt-3 rounded-[2rem] bg-[#FFFDF8] p-6 text-center shadow-sm shadow-[#F3E2BF]/70">
            <p className="text-5xl">🌷</p>
            <p className="mt-3 text-lg font-black text-[#37410F]">Добавь первый замер, чтобы видеть динамику</p>
            <p className="mt-2 text-sm font-semibold leading-5 text-[#8B725F]">Можно указать только то, что хочется. Остальное подождёт.</p>
            <button
              className="mt-5 rounded-2xl bg-[#6E7E1F] px-5 py-3 text-base font-black text-white shadow-lg shadow-[#F3E2BF]/70 transition hover:bg-[#37410F]"
              onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              type="button"
            >
              Добавить замер
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {sortedEntries.map((entry) => (
              <article className="rounded-[2rem] bg-[#FFFDF8] p-4 shadow-sm shadow-[#F3E2BF]/70" key={entry.id}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-black text-[#37410F]">{formatDate(entry.date)}</h3>
                  <button className="rounded-full bg-[#F3E2BF] px-3 py-2 text-xs font-black text-[#37410F] transition hover:bg-[#F3E2BF]" onClick={() => onDeleteEntry(entry.id)} type="button">Удалить</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-[#8B725F]">
                  {entry.weight !== undefined && <span className="rounded-full bg-[#F3E2BF] px-3 py-2">Вес {entry.weight} кг</span>}
                  {entry.waist !== undefined && <span className="rounded-full bg-[#F3E2BF] px-3 py-2">Талия {entry.waist} см</span>}
                  {entry.hips !== undefined && <span className="rounded-full bg-[#F3E2BF] px-3 py-2">Бедра {entry.hips} см</span>}
                  {entry.chest !== undefined && <span className="rounded-full bg-[#F3E2BF] px-3 py-2">Грудь {entry.chest} см</span>}
                </div>
                {entry.comment && <p className="mt-3 rounded-3xl bg-[#FFFDF8] p-3 text-sm font-semibold leading-5 text-[#8B725F]">{entry.comment}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
