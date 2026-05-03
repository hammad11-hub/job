import api from './axiosInstance';

export const login = (credentials) => api.post('/login', credentials);
export const register = (userData) => api.post('/register', userData);
export const logout = () => api.post('/logout');
export const getMe = () => api.get('/me');
