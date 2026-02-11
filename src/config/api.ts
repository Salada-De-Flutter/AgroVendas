// Detecção de ambiente
export const useProdApi = process.env.EXPO_PUBLIC_USE_PROD_API === 'true';

// URLs
const PROD_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.agrosystemapp.com/api';
const DEV_API_URL = 'http://localhost:3000/api';

// URL final baseada no modo
const API_URL = useProdApi ? PROD_API_URL : DEV_API_URL;

// Endpoints da API
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_URL}/auth/login`,
    REGISTER: `${API_URL}/auth/register`,
  },
  CLIENTES: {
    LIST: `${API_URL}/clientes`,
    CREATE: `${API_URL}/clientes`,
    UPDATE: (id: string) => `${API_URL}/clientes/${id}`,
    DELETE: (id: string) => `${API_URL}/clientes/${id}`,
    SEND_VERIFICATION: `${API_URL}/clientes/enviar-verificacao`,
  },
  VENDAS: {
    LIST: `${API_URL}/vendas`,
    CREATE: `${API_URL}/vendas`,
    UPDATE: (id: string) => `${API_URL}/vendas/${id}`,
    DELETE: (id: string) => `${API_URL}/vendas/${id}`,
    BY_CLIENTE: (clienteId: string) => `${API_URL}/vendas/cliente/${clienteId}`,
    PDF: (id: string) => `${API_URL}/vendas/${id}/pdf`,
    SEND_VERIFICATION: `${API_URL}/vendas/enviar-codigo-verificacao`,
  },
};

// Log da configuração (útil para debug)
console.log('🔧 Configuração da API:');
console.log('   URL:', API_URL);
