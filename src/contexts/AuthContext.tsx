import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { StorageService } from '../services/storage';

interface User {
  id: number;
  nome: string;
  email: string;
  tipo: string;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadStorageData();
  }, []);

  // Gerenciar navegação baseada na autenticação
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // Usuário não autenticado, redirecionar para boas-vindas/login
      router.replace('/');
    } else if (user && inAuthGroup) {
      // Usuário autenticado tentando acessar telas de auth, redirecionar para home
      router.replace('/(app)/home');
    }
  }, [user, segments, loading]);

  async function loadStorageData() {
    try {
      const storedToken = await StorageService.getToken();
      const storedUser = await StorageService.getUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do storage:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(newToken: string, newUser: User) {
    try {
      await StorageService.saveToken(newToken);
      await StorageService.saveUser(newUser);
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  }

  async function signOut() {
    try {
      await StorageService.clearAll();
      setToken(null);
      setUser(null);
      router.replace('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signIn,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
