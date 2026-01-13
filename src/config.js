export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const config = {
  apiUrl: API_URL,
  environment: import.meta.env.MODE,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

export default config;
