import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from './Navbar';

/** Height of the phone tab bar plus the home-indicator inset; pages pad by this so nothing hides under it. */
export const TAB_BAR_SPACE = 'pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0';

export const Layout = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className={`flex-1 ${user ? TAB_BAR_SPACE : ''}`}>{children}</main>
    </div>
  );
};
