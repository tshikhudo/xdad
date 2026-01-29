import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User, UserRole } from "@shared/schema";

interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  workerId?: string | null;
  employerId?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string; needsSignup?: boolean }>;
  signup: (username: string, password: string, name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUserId = localStorage.getItem("userId");
    if (savedUserId) {
      fetch(`/api/auth/user/${savedUserId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setUser(data);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string; needsSignup?: boolean }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      if (res.status === 404) {
        return { success: false, needsSignup: true };
      }
      
      if (res.status === 401) {
        return { success: false, error: "Wrong password" };
      }
      
      if (!res.ok) {
        return { success: false, error: "Login failed" };
      }
      
      const data = await res.json();
      setUser(data);
      localStorage.setItem("userId", data.id);
      return { success: true };
    } catch {
      return { success: false, error: "Login failed" };
    }
  };

  const signup = async (username: string, password: string, name: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, name, role }),
      });
      
      if (res.status === 409) {
        return { success: false, error: "Username already taken" };
      }
      
      if (!res.ok) {
        return { success: false, error: "Signup failed" };
      }
      
      const data = await res.json();
      setUser(data);
      localStorage.setItem("userId", data.id);
      return { success: true };
    } catch {
      return { success: false, error: "Signup failed" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("userId");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
