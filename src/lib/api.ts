import axios from 'axios';

const getBaseURL = () => {
  if (typeof window !== 'undefined') return '/api';
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';
};

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('no refresh token');
        const { data } = await axios.post(
          '/api/auth/refresh',
          { refreshToken },
        );
        localStorage.setItem('accessToken', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
