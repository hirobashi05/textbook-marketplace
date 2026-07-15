import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { api, clearToken, getToken, setToken } from "../lib/api";
import type { AuthUser, User } from "../types/api";

type AuthContextValue = {
  user: AuthUser | null;
  profile: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(getToken()));

  const refreshMe = useCallback(async () => {
    const me = await api.me();
    setProfile(me);
    setUser({ uid: me.uid, email: me.email, name: me.name });
  }, []);

  useEffect(() => {
    if (!getToken()) {
      return;
    }

    refreshMe()
      .catch(() => {
        clearToken();
        setUser(null);
        setProfile(null);
      })
      .finally(() => setIsLoading(false));
  }, [refreshMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.login({ email, password });
      setToken(response.token);
      setUser(response.user);
      await refreshMe();
    },
    [refreshMe]
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      refreshMe
    }),
    [user, profile, isLoading, login, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

