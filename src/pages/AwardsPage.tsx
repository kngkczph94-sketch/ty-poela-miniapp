export type Award = {
  days: number;
  title: string;
  icon: string;
};

export const awards: Award[] = [
  { days: 1, title: 'Первый заход', icon: '🌿' },
  { days: 3, title: 'Разогрела тарелку', icon: '🍲' },
  { days: 7, title: 'Неделя без хаоса', icon: '🫒' },
  { days: 14, title: 'Вошла во вкус', icon: '🥄' },
  { days: 21, title: 'Повелительница корзины', icon: '🧺' },
  { days: 30, title: 'Месяц с «Ты поела»', icon: '🍽️' },
  { days: 60, title: 'Авокадо созрело', icon: '🥑' },
  { days: 90, title: 'Оливковая легенда', icon: '✨' },
  { days: 180, title: 'Астральная тарелка', icon: '🌙' },
  { days: 365, title: 'Великая жрица рациона', icon: '👑' },
];

const getCurrentAward = (uniqueDaysCount: number) => [...awards].reverse().find((award) => uniqueDaysCount >= award.days) ?? awards[0];
const getNextAward = (uniqueDaysCount: number) => awards.find((award) => uniqueDaysCount < award.days) ?? null;
const getProgressPercent = (current: number, target: number) => Math.min(100, Math.round((current / target) * 100));
const getDayWord = (days: number) => {
  const absDays = Math.abs(days);
  const lastTwoDigits = absDays % 100;
  const lastDigit = absDays % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'дней';
  }

  if (lastDigit === 1) {
    return 'день';
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'дня';
  }

  return 'дней';
};
const getDayLabel = (days: number) => `${days} ${getDayWord(days)}`;
const getAwardDescription = (days: number) => `${getDayLabel(days)} вместе`;

export function AwardsPage({ uniqueDaysCount }: { uniqueDaysCount: number }) {
  const currentAward = getCurrentAward(uniqueDaysCount);
  const nextAward = getNextAward(uniqueDaysCount);

  return <section className="flex flex-1 flex-col">
    <div className="rounded-[2rem] border border-[#D99663]/35 bg-gradient-to-br from-[#F3E2BF] via-[#D99663]/25 to-[#FFFDF8] p-6 text-[#37410F] shadow-xl shadow-[#D99663]/20">
      <p className="text-sm font-bold uppercase tracking-wide text-[#8B725F]">ЗВАНИЯ ЗА РЕГУЛЯРНОСТЬ</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">Награды</h1>
      <p className="mt-3 text-sm font-semibold leading-6 text-[#8B725F]">Чем чаще ты возвращаешься в приложение, тем выше твоё звание.</p>
    </div>

    <article className="mt-5 rounded-[2rem] border border-[#D99663]/25 bg-[#FFFDF8] p-5 shadow-sm shadow-[#F3E2BF]/70">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6E7E1F]">Текущий уровень:</p>
      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3E2BF] text-3xl">{currentAward.icon}</span>
        <h2 className="text-2xl font-black leading-tight text-[#37410F]">{currentAward.title}</h2>
      </div>
      <div className="mt-5 rounded-3xl bg-[#F3E2BF]/60 p-4">
        <div className="flex items-center justify-between gap-3 text-sm font-black text-[#37410F]">
          <span>{nextAward ? 'До следующего звания:' : 'Все звания получены:'}</span>
          <span>{nextAward ? `${uniqueDaysCount} / ${getDayLabel(nextAward.days)}` : getDayLabel(uniqueDaysCount)}</span>
        </div>
        {nextAward && <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#FFFDF8]"><div className="h-full rounded-full bg-[#6E7E1F] transition-all" style={{ width: `${getProgressPercent(uniqueDaysCount, nextAward.days)}%` }} /></div>}
      </div>
    </article>

    <div className="mt-5 space-y-3">
      {awards.map((award) => {
        const isReceived = uniqueDaysCount >= award.days;
        const progress = Math.min(uniqueDaysCount, award.days);

        return <article className="rounded-[2rem] border border-[#D99663]/20 bg-[#FFFDF8] p-4 shadow-sm shadow-[#F3E2BF]/70" key={award.days}>
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3E2BF] text-2xl">{award.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold text-[#37410F]">{award.title}</h2>
                {isReceived ? <span className="rounded-full bg-[#6E7E1F]/15 px-3 py-1 text-xs font-black text-[#6E7E1F]">Получено</span> : <span className="rounded-full bg-[#D99663]/15 px-3 py-1 text-xs font-black text-[#D99663]">В процессе</span>}
              </div>
              <p className="mt-1 text-sm font-semibold text-[#8B725F]">{getAwardDescription(award.days)}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F3E2BF]">
                  <div className="h-full rounded-full bg-[#6E7E1F] transition-all" style={{ width: `${getProgressPercent(progress, award.days)}%` }} />
                </div>
                <span className="text-xs font-black text-[#8B725F]">{progress} / {getDayLabel(award.days)}</span>
              </div>
            </div>
          </div>
        </article>;
      })}
    </div>
  </section>;
}
