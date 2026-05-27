import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { auth as authApi, profile as profileApi } from './api';
import { setWSToken, wsManager } from './ws';
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
  refreshToken: () => Promise<void>;
  isMaster: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}

const AuthContext = createContext<AuthState>(null!);
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

const AUTH_SYNC_CHANNEL = 'diploma-auth-sync';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Guard to prevent infinite cross-tab refresh loops
  const externalRefreshRef = useRef(false);

  const loadProfile = async (fallbackRoles?: string[]) => {
    try {
      const p = await profileApi.get();
      setProfile(p);
      setRoles(p.roles?.length ? p.roles : fallbackRoles ?? []);
    } catch {
      // Profile might not exist yet
    }
  };

  const applyAuthState = (res: { user_id: string; email: string; roles: string[]; access_token: string }) => {
    setUserId(res.user_id);
    setEmail(res.email);
    setRoles(res.roles);
    setAccessToken(res.access_token);
    setWSToken(res.access_token);
  };

  useEffect(() => {
    // Try to restore session and in-memory access token via refresh cookie.
    authApi.refresh()
      .then(async (res) => {
        applyAuthState(res);
        await loadProfile(res.roles);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Cross-tab synchronization via BroadcastChannel
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
      channel.onmessage = () => {
        externalRefreshRef.current = true;
        authApi.refresh()
          .then(async (res) => {
            applyAuthState(res);
            await loadProfile(res.roles);
          })
          .catch(() => {})
          .finally(() => {
            externalRefreshRef.current = false;
          });
      };
    } catch {
      // BroadcastChannel not available (e.g., IE, Safari < 15.4)
    }
    return () => {
      if (channel) channel.close();
    };
  }, []);

  const login = async (em: string, pw: string) => {
    const res = await authApi.login({ email: em, password: pw });
    applyAuthState(res);
    await loadProfile(res.roles);
  };

  const register = async (data: { email: string; password: string; first_name: string; last_name: string; phone: string }) => {
    const res = await authApi.register(data);
    if (res.access_token) {
      applyAuthState(res as { user_id: string; email: string; roles: string[]; access_token: string });
    }
  };

  const logout = async () => {
    await authApi.logout().catch(() => {});
    wsManager.disconnectAll();
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

  const refreshToken = async () => {
    const res = await authApi.refresh();
    applyAuthState(res);
    await loadProfile(res.roles);

    // Notify other tabs to also refresh their token
    if (!externalRefreshRef.current) {
      try {
        const channel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
        channel.postMessage('refresh');
        channel.close();
      } catch {
        // BroadcastChannel not available
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      userId, email, roles, profile, accessToken, loading,
      login, register, logout, refreshProfile, refreshToken,
      isMaster: roles.includes('master'),
      isAdmin: roles.includes('admin'),
      isModerator: roles.includes('moderator'),
    }}>
      {children}
    </AuthContext.Provider>
  );
}
