import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth as authApi, profile as profileApi } from './api';
import { setWSToken } from './ws';
import type { FullProfile } from './types';

interface AuthState {
  userId: string | null;
  email: string | null;
  roles: string[];
  profile: FullProfile | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; first_name: string; last_name: string; phone: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isMaster: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}

const AuthContext = createContext<AuthState>(null!);
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (fallbackRoles?: string[]) => {
    try {
      const p = await profileApi.get();
      setProfile(p);
      setRoles(p.roles?.length ? p.roles : fallbackRoles ?? []);
    } catch {
      // Profile might not exist yet
    }
  };

  useEffect(() => {
    // Try to restore session and in-memory access token via refresh cookie.
    authApi.refresh()
      .then(async (res) => {
        setUserId(res.user_id);
        setEmail(res.email);
        setRoles(res.roles);
        setAccessToken(res.access_token);
        setWSToken(res.access_token);
        await loadProfile(res.roles);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = async (em: string, pw: string) => {
    const res = await authApi.login({ email: em, password: pw });
    setUserId(res.user_id);
    setEmail(res.email);
    setRoles(res.roles);
    setAccessToken(res.access_token);
    setWSToken(res.access_token);
    await loadProfile(res.roles);
  };

  const register = async (data: { email: string; password: string; first_name: string; last_name: string; phone: string }) => {
    const res = await authApi.register(data);
    setUserId(res.user_id);
    setEmail(res.email);
    setRoles(res.roles);
    setAccessToken(res.access_token);
    setWSToken(res.access_token);
  };

  const logout = async () => {
    await authApi.logout().catch(() => {});
    setUserId(null);
    setEmail(null);
    setRoles([]);
    setProfile(null);
    setAccessToken(null);
    setWSToken(null);
  };

  const refreshProfile = async () => {
    if (userId) await loadProfile();
  };

  return (
    <AuthContext.Provider value={{
      userId, email, roles, profile, accessToken, loading,
      login, register, logout, refreshProfile,
      isMaster: roles.includes('master'),
      isAdmin: roles.includes('admin'),
      isModerator: roles.includes('moderator'),
    }}>
      {children}
    </AuthContext.Provider>
  );
}
