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
    
    // Timeout de segurança: se depois de 5 segundos ainda estiver carregando, força finalizar
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('[Auth] Timeout no carregamento do AuthContext, forçando finalização');
        setLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, []);

  // Gerenciar navegação baseada na autenticação
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = String(segments[0]) === 'auth';
    const inAppGroup = String(segments[0]) === '(app)';
    // Corrige comparação de tipos: verifica se há segmento e se o primeiro é 'index' (como string)
    const inRootIndex = !segments.length || String(segments[0]) === 'index';

    console.log('[Nav] Segments:', segments, '| User:', user?.nome || 'none');

    if (!user && !inAuthGroup && !inRootIndex) {
      // Usuário não autenticado fora de auth/root, redirecionar para boas-vindas
      console.log('[Nav] Redirecionando para root (não autenticado)');
      router.replace('/');
    } else if (user && (inAuthGroup || inRootIndex)) {
      // Usuário autenticado em auth ou root, redirecionar para home
      console.log('[Nav] Redirecionando para home (autenticado)');
      router.replace('/(app)/home');
    }
  }, [user, segments, loading]);

  async function loadStorageData() {
    try {
      console.log('[Auth] Iniciando carregamento do storage');
      const storedToken = await StorageService.getToken();
      console.log('[Auth] Token carregado:', storedToken ? 'Existe' : 'Não existe');
      
      const storedUser = await StorageService.getUser();
      console.log('[Auth] User carregado:', storedUser ? storedUser.nome : 'Não existe');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        console.log('[Auth] Autenticação restaurada com sucesso');
      } else {
        console.log('[Auth] Nenhuma sessão anterior encontrada');
      }
    } catch (error) {
      console.error('[Auth] Erro ao carregar dados do storage:', error);
    } finally {
      console.log('[Auth] Finalizando carregamento do storage');
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
