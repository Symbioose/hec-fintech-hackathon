// Fake auth: any email/password is accepted, session stored in localStorage.
// Hardcoded to a single asset manager — François Martin (Carmignac Credit Fund A).

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

const SESSION_KEY = "smatch.session";
export const ME_AM_ID = "AM-02";

export interface Session {
  email: string;
  signedInAt: string;
}

interface AuthCtx {
  session: Session | null;
  isAuthenticated: boolean;
  signIn: (email: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session]);

  const signIn = useCallback((email: string) => {
    setSession({ email, signedInAt: new Date().toISOString() });
  }, []);

  const signOut = useCallback(() => setSession(null), []);

  const value = useMemo<AuthCtx>(
    () => ({
      session,
      isAuthenticated: !!session,
      signIn,
      signOut,
    }),
    [session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
