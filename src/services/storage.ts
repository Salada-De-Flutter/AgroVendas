import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@AgroVendas:token';
const USER_KEY = '@AgroVendas:user';

// Helper para adicionar timeout nas operações
function withTimeout<T>(promise: Promise<T>, timeoutMs = 3000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Storage timeout')), timeoutMs)
    ),
  ]);
}

export const StorageService = {
  // Token
  async saveToken(token: string): Promise<void> {
    try {
      await withTimeout(AsyncStorage.setItem(TOKEN_KEY, token));
    } catch (error) {
      console.error('Erro ao salvar token:', error);
      throw error;
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await withTimeout(AsyncStorage.getItem(TOKEN_KEY));
    } catch (error) {
      console.error('Erro ao buscar token:', error);
      return null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      await withTimeout(AsyncStorage.removeItem(TOKEN_KEY));
    } catch (error) {
      console.error('Erro ao remover token:', error);
    }
  },

  // Usuário
  async saveUser(user: any): Promise<void> {
    try {
      await withTimeout(AsyncStorage.setItem(USER_KEY, JSON.stringify(user)));
    } catch (error) {
      console.error('Erro ao salvar user:', error);
      throw error;
    }
  },

  async getUser(): Promise<any | null> {
    try {
      const user = await withTimeout(AsyncStorage.getItem(USER_KEY));
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Erro ao buscar user:', error);
      return null;
    }
  },

  async removeUser(): Promise<void> {
    try {
      await withTimeout(AsyncStorage.removeItem(USER_KEY));
    } catch (error) {
      console.error('Erro ao remover user:', error);
    }
  },

  // Limpar tudo
  async clearAll(): Promise<void> {
    try {
      await withTimeout(AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]));
    } catch (error) {
      console.error('Erro ao limpar storage:', error);
    }
  },
};
