import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { supabase, Database } from "@/lib/supabase";

type User = Database["public"]["Tables"]["users"]["Row"];

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // GI-FIX: Gi-disable ang auto-login sa pag-refresh aron mangayo pirme og login.
    // Tangtangon usab ang daan nga session sa memory para limpyo.
    localStorage.removeItem("pilikart_user");
    setUser(null);
    setIsLoading(false);

    // Pugson ang app nga moadto sa login page kon wala kini sa splash o register page
    if (location !== "/splash" && location !== "/register") {
      setLocation("/login");
    }
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem("pilikart_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("pilikart_user");
    setLocation("/login");
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data && !error) {
        login(data);
      }
    } catch (error) {
      console.error("Failed to refresh user", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
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
