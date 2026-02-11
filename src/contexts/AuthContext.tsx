import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { tokenStorage } from "@/lib/token-storage";
import type { LoginRequest, LoginResponse, TipoUsuario, AuthTokens } from "@/types/auth";

interface AuthContextType {
  isAuthenticated: boolean;
  userType: TipoUsuario | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(tokenStorage.isAuthenticated());
  const [userType, setUserType] = useState<TipoUsuario | null>(tokenStorage.getUserType());
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsAuthenticated(tokenStorage.isAuthenticated());
    setUserType(tokenStorage.getUserType());
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await api.post<LoginResponse>("/api/auth", data);
      const tokens: AuthTokens = {
        jwt: response.data.jwt,
        jwtExpires: response.data.jwtExpires,
        refreshToken: response.data.refreshToken,
        refreshTokenExpires: response.data.refreshTokenExpires,
      };
      tokenStorage.setTokens(tokens);
      const tipo = tokenStorage.getUserType();
      setIsAuthenticated(true);
      setUserType(tipo);

      switch (tipo) {
        case "EMPRESA":
          navigate("/empresa");
          break;
        case "FUNCIONARIO":
          navigate("/funcionario");
          break;
        case "ADMIN":
          navigate("/admin");
          break;
        default:
          navigate("/");
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // silent
    } finally {
      tokenStorage.clearTokens();
      setIsAuthenticated(false);
      setUserType(null);
      navigate("/login");
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, userType, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
