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
    const checkAuth = async () => {
      // First check for Replit Auth session (Google login)
      try {
        const replitAuthRes = await fetch("/api/auth/user", { credentials: "include" });
        if (replitAuthRes.ok) {
          const replitUser = await replitAuthRes.json();
          // User logged in via Google - treat as employer
          setUser({
            id: replitUser.id,
            username: replitUser.email || replitUser.id,
            name: [replitUser.firstName, replitUser.lastName].filter(Boolean).join(" ") || "User",
            role: "employer" as UserRole,
            employerId: replitUser.id,
          });
          setIsLoading(false);
          return;
        }
      } catch {
        // Replit Auth not available, continue to check localStorage
      }

      // Check for localStorage auth (username/password login)
      const savedUserId = localStorage.getItem("userId");
      if (savedUserId) {
        try {
          const res = await fetch(`/api/auth/user/${savedUserId}`);
          if (res.ok) {
            const data = await res.json();
            setUser(data);
          }
        } catch {
          // Ignore errors
        }
      }
      setIsLoading(false);
    };
    
    checkAuth();
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

  const logout = async () => {
    const wasLocalUser = localStorage.getItem("userId");
    setUser(null);
    localStorage.removeItem("userId");
    
    // If user was logged in via Google (no localStorage userId), redirect to Replit logout
    if (!wasLocalUser) {
      window.location.href = "/api/logout";
    }
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
