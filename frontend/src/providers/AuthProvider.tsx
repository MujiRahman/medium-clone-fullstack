"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api/axios";
import { useAuthStore } from "@/lib/store/authStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitializing, setIsInitializing] = useState(true);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data && res.data.data) {
          login({
            id: res.data.data.id,
            username: res.data.data.username,
            email: res.data.data.email,
          });
        }
      } catch (err) {
        // If 401 or network error, silently clear UI session
        logout();
      } finally {
        setIsInitializing(false);
      }
    };

    fetchMe();
  }, [login, logout]);

  // Show nothing or a smooth loader while rehydrating to prevent layout shift & redirect flicker
  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse w-8 h-8 rounded-full bg-primary/20"></div></div>;
  }

  return <>{children}</>;
}
