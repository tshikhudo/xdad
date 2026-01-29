import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User, UserRole } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<{ success: boolean; needsSignup?: boolean }>;
  signup: (email: string, name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
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

  const login = async (email: string): Promise<{ success: boolean; needsSignup?: boolean }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (res.status === 404) {
        return { success: false, needsSignup: true };
      }
      
      if (!res.ok) {
        return { success: false };
      }
      
      const data = await res.json();
      setUser(data);
      localStorage.setItem("userId", data.id);
      return { success: true };
    } catch {
      return { success: false };
    }
  };

  const signup = async (email: string, name: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      });
      
      if (res.status === 409) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem("userId", data.user.id);
          return { success: true };
        }
        return { success: false, error: "Email already registered" };
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
