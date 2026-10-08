import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { flushPush, forgetLocalOwner, releaseLocalState, resetLocalGame } from '@/lib/gameSync';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** True between following a password-reset link and choosing a new password. */
  recovery: boolean;
  signOut: () => Promise<void>;
  clearRecovery: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  recovery: false,
  signOut: async () => {},
  clearRecovery: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await flushPush();
    releaseLocalState();
    await supabase.auth.signOut();
    // The game is saved server-side; don't leave it on a shared device.
    resetLocalGame();
    forgetLocalOwner();
  };

  return (
    <AuthContext.Provider
      value={{ user: session?.user ?? null, session, loading, recovery, signOut, clearRecovery: () => setRecovery(false) }}
    >
      {children}
    </AuthContext.Provider>
  );
}
