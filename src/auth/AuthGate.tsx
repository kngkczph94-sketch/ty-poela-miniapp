import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';

const Screen = ({ title, text, action }: { title: string; text: string; action?: () => void }) => (
  <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-10">
    <section className="w-full rounded-[2rem] border border-[#8FD14C]/25 bg-[#14170F] p-6 text-center shadow-xl shadow-[#14170F]/70">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#14170F] text-2xl">🥗</div>
      <h1 className="mt-4 text-2xl font-black text-[#F4F7EE]">{title}</h1>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#A9B39C]">{text}</p>
      {action && <button className="mt-5 w-full rounded-2xl bg-[#5C8A1E] px-4 py-3 font-black text-white" onClick={action} type="button">Попробовать снова</button>}
    </section>
  </main>
);

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading, error, outsideTelegram, preview, retry } = useAuth();
  if (preview) return <>{children}</>;
  if (loading) return <Screen title="Выполняем вход…" text="Проверяем данные Telegram и готовим приложение." />;
  if (outsideTelegram) return <Screen title="Откройте приложение через Telegram" text="Запустите «Ты поела?» из меню бота, чтобы безопасно войти." action={retry} />;
  if (error) return <Screen title="Не удалось войти" text={error} action={retry} />;
  if (!session) return <Screen title="Не удалось войти" text="Сессия не была создана. Попробуйте ещё раз." action={retry} />;
  return <>{children}</>;
}
