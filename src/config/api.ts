// Configuração da API
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Endpoints da API
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_URL}/auth/login`,
    REGISTER: `${API_URL}/auth/register`,
  },
};

// Log da configuração (útil para debug)
console.log('🔧 Configuração da API:');
console.log('   URL:', API_URL);
