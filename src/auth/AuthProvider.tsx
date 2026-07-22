import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

type AuthState = {
  session: Session | null;
  loading: boolean;
  error: string | null;
  outsideTelegram: boolean;
  preview: boolean;
  retry: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outsideTelegram, setOutsideTelegram] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const running = useRef(false);
  const preview = import.meta.env.DEV && import.meta.env.VITE_AUTH_PREVIEW === 'true';

  const retry = useCallback(() => {
    setError(null);
    setOutsideTelegram(false);
    setLoading(true);
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const authenticate = async () => {
      if (running.current) return;
      running.current = true;
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          setSession(data.session);
          return;
        }
        if (preview) return;

        const webApp = window.Telegram?.WebApp;
        const initData = webApp?.initData?.trim();
        if (!webApp || !initData) {
          setOutsideTelegram(true);
          return;
        }

        const { data: authData, error: invokeError } = await supabase.functions.invoke('telegram-auth', {
          body: { initData },
        });
        if (invokeError) throw invokeError;
        if (!authData?.token_hash || authData.type !== 'email') throw new Error('Некорректный ответ сервера авторизации.');

        const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
          token_hash: authData.token_hash,
          type: 'email',
        });
        if (otpError) throw otpError;
        if (!otpData.session) throw new Error('Не удалось создать сессию.');
        if (!cancelled) setSession(otpData.session);
        webApp.ready();
        webApp.expand?.();
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Не удалось выполнить вход.');
      } finally {
        running.current = false;
        if (!cancelled) setLoading(false);
      }
    };
    void authenticate();
    return () => { cancelled = true; };
  }, [attempt, preview]);

  return <AuthContext.Provider value={{ session, loading, error, outsideTelegram, preview, retry }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth должен использоваться внутри AuthProvider.');
  return value;
}
