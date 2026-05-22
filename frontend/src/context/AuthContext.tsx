import { createContext, useContext, useState, type ReactNode } from 'react';
import type { JwtPayload } from '../api/types';

interface AuthContextValue {
  user: JwtPayload | null;
  token: string | null;
  setAuth: (token: string) => void;
  logout: () => void;
}

function decodeJwt(token: string): JwtPayload {
  const payload = token.split('.')[1];
  return JSON.parse(atob(payload));
}

function loadFromStorage(): { token: string | null; user: JwtPayload | null } {
  const token = localStorage.getItem('accessToken');
  if (!token) return { token: null, user: null };
  try {
    const user = decodeJwt(token);
    if (user.exp * 1000 < Date.now()) {
      localStorage.removeItem('accessToken');
      return { token: null, user: null };
    }
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = loadFromStorage();
  const [token, setToken] = useState<string | null>(initial.token);
  const [user, setUser] = useState<JwtPayload | null>(initial.user);

  function setAuth(newToken: string) {
    localStorage.setItem('accessToken', newToken);
    setToken(newToken);
    setUser(decodeJwt(newToken));
  }

  function logout() {
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
