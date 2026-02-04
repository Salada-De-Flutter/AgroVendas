// Configuração da API baseada no ambiente
const ENV = process.env.EXPO_PUBLIC_ENV || 'development';
const API_URL_DEV = process.env.EXPO_PUBLIC_API_URL_DEV || 'http://localhost:3000/api';
const API_URL_PROD = process.env.EXPO_PUBLIC_API_URL_PROD || 'https://agrosystemapp.com/api';

// Seleciona a URL correta baseada no ambiente
export const API_URL = ENV === 'production' ? API_URL_PROD : API_URL_DEV;

// Endpoints da API
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_URL}/auth/login`,
    REGISTER: `${API_URL}/auth/register`,
  },
};

// Log da configuração (útil para debug)
console.log('🔧 Configuração da API:');
console.log('   Ambiente:', ENV);
console.log('   URL:', API_URL);
