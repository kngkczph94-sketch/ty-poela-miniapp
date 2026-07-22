import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';

const Screen = ({ title, text, action }: { title: string; text: string; action?: () => void }) => (
  <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-10">
    <section className="w-full rounded-[2rem] border border-[#D99663]/25 bg-[#FFFDF8] p-6 text-center shadow-xl shadow-[#F3E2BF]/70">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3E2BF] text-2xl">🥗</div>
      <h1 className="mt-4 text-2xl font-black text-[#37410F]">{title}</h1>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#8B725F]">{text}</p>
      {action && <button className="mt-5 w-full rounded-2xl bg-[#6E7E1F] px-4 py-3 font-black text-white" onClick={action} type="button">Попробовать снова</button>}
    </section>
  </main>
);

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading, error, outsideTelegram, preview, retry } = useAuth();
  if (preview) return <>{children}</>;
  if (loading) return <Screen title="Выполняем вход…" text="Проверяем данные Telegram и готовим приложение." />;
  if (outsideTelegram) return <Screen title="Откройте приложение через Telegram" text="Запустите «Ты поела?» из меню бота, чтобы безопасно войти." action={retry} />;
  if (error) return <Screen title="Не удалось войти" text="Проверьте соединение и попробуйте ещё раз." action={retry} />;
  if (!session) return <Screen title="Не удалось войти" text="Сессия не была создана. Попробуйте ещё раз." action={retry} />;
  return <>{children}</>;
}
