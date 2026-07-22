import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';

const Shell = ({ children }: { children: ReactNode }) => (
  <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#FBF6EC] to-[#F3E2BF]/50 px-4 text-[#37410F]">
    <section className="w-full max-w-sm rounded-[2rem] bg-[#FFFDF8] p-7 text-center shadow-xl shadow-[#D99663]/15">{children}</section>
  </main>
);

export function AuthGate({ children }: { children: ReactNode }) {
  const { state, retry } = useAuth();
  if (state === 'authenticated' || state === 'preview') return <>{children}</>;
  if (state === 'loading') return <Shell><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#F3E2BF] border-t-[#6E7E1F]" /><h1 className="mt-5 text-xl font-black">Выполняем вход…</h1></Shell>;
  const outside = state === 'outside-telegram';
  return <Shell>
    <div className="text-4xl">{outside ? '✈️' : '🌿'}</div>
    <h1 className="mt-4 text-2xl font-black">{outside ? 'Откройте приложение через Telegram' : 'Не удалось выполнить вход'}</h1>
    <p className="mt-3 text-sm font-semibold leading-6 text-[#8B725F]">{outside ? 'Запустите мини-приложение из чата с ботом.' : 'Проверьте подключение и попробуйте ещё раз.'}</p>
    <button className="mt-6 rounded-full bg-[#6E7E1F] px-5 py-3 text-sm font-black text-white" onClick={retry} type="button">{outside ? 'Проверить снова' : 'Попробовать снова'}</button>
  </Shell>;
}
