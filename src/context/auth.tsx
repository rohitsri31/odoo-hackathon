import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { getToken, getUser, onUnauthorized, saveToken, saveUser, SessionUser } from '@/lib/api';

type AuthContextValue = { token: string | null; user: SessionUser | null; loading: boolean; signIn: (token: string, user: SessionUser) => Promise<void>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void Promise.all([getToken(), getUser()]).then(([value, profile]) => { if (active) { setToken(value); setUser(profile); } }).catch(() => { if (active) setToken(null); }).finally(() => { if (active) setLoading(false); });
    const remove = onUnauthorized(() => { setToken(null); setUser(null); });
    return () => { active = false; remove(); };
  }, []);
  const signIn = async (value: string, profile: SessionUser) => { await Promise.all([saveToken(value), saveUser(profile)]); setToken(value); setUser(profile); };
  const signOut = async () => { await Promise.all([saveToken(null), saveUser(null)]); setToken(null); setUser(null); };
  return <AuthContext.Provider value={{ token, user, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
