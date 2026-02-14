"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/types";
import { setAccessToken } from "@/lib/api";
import * as authService from "@/services/auth-service";
import * as userService from "@/services/user-service";
import * as menuAccessService from "@/services/menu-access-service";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  allowedMenuKeys: string[] | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allowedMenuKeys, setAllowedMenuKeys] = useState<string[] | null>(null);
  const router = useRouter();
  const hasAttemptedRefresh = useRef(false);

  const loadMenuKeys = useCallback(async () => {
    try {
      const menuRes = await menuAccessService.getMyMenuKeys();
      if (menuRes.success && menuRes.data && menuRes.data.menu_keys.length > 0) {
        setAllowedMenuKeys(menuRes.data.menu_keys);
      } else {
        // No custom config — use role defaults (null)
        setAllowedMenuKeys(null);
      }
    } catch {
      setAllowedMenuKeys(null);
    }
  }, []);

  const loadUser = useCallback(async () => {
    // Only attempt refresh once per mount to avoid loops
    if (hasAttemptedRefresh.current) return;
    hasAttemptedRefresh.current = true;

    try {
      const refreshRes = await authService.refreshToken();
      if (refreshRes.success && refreshRes.data) {
        setAccessToken(refreshRes.data.access_token);
        const meRes = await userService.getMe();
        if (meRes.success && meRes.data) {
          setUser(meRes.data);
          await loadMenuKeys();
        }
      }
    } catch {
      // No valid session — just stay on current page (login)
      setAccessToken(null);
      setUser(null);
      setAllowedMenuKeys(null);
    } finally {
      setIsLoading(false);
    }
  }, [loadMenuKeys]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    if (res.success && res.data) {
      setAccessToken(res.data.access_token);
      const meRes = await userService.getMe();
      if (meRes.success && meRes.data) {
        setUser(meRes.data);
        await loadMenuKeys();
      }
      router.push("/dashboard");
    } else {
      throw new Error(res.message);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
      setAllowedMenuKeys(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, allowedMenuKeys, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
