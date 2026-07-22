import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

type AuthState = 'loading' | 'authenticated' | 'outside-telegram' | 'preview' | 'error';
type AuthContextValue = { state: AuthState; retry: () => void };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');
  const [attempt, setAttempt] = useState(0);
  const requestInFlight = useRef(false);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    const webApp = window.Telegram?.WebApp;
    webApp?.ready();

    if (!supabase) {
      setState(import.meta.env.DEV && import.meta.env.VITE_AUTH_PREVIEW === 'true' ? 'preview' : 'error');
      return;
    }
    const updateSession = (session: Session | null) => {
      if (active && session) setState('authenticated');
    };
    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => updateSession(session));

    const authenticate = async () => {
      setState('loading');
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (session) {
        setState('authenticated');
        return;
      }
      const initData = webApp?.initData;
      if (!initData) {
        setState(import.meta.env.DEV && import.meta.env.VITE_AUTH_PREVIEW === 'true' ? 'preview' : 'outside-telegram');
        return;
      }
      if (requestInFlight.current) return;
      requestInFlight.current = true;
      try {
        const { data, error } = await supabase.functions.invoke('telegram-auth', { body: { initData } });
        if (error || typeof data?.token_hash !== 'string' || data?.type !== 'email') throw new Error('edge_auth_failed');
        const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: 'email' });
        if (verifyError) throw verifyError;
        if (active) setState('authenticated');
      } catch {
        if (active) setState('error');
      } finally {
        requestInFlight.current = false;
      }
    };
    void authenticate();
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [attempt]);

  return <AuthContext.Provider value={{ state, retry }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
