import React from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginUser = (credentials) => api.post('/login', credentials);
export const registerUser = (userData) => api.post('/register', userData);
export const getJobs = (params) => api.get('/jobs', { params });
export const getJobDetails = (id) => api.get(`/jobs/${id}`);
export const getCategories = () => api.get('/jobs/categories');
export const getEmployerStats = () => api.get('/employer/stats');
export const createCheckoutSession = (plan) => api.post('/payments/create-checkout-session', { plan });
export const getSubscriptionInfo = () => api.get('/payments/subscription');
export const getBillingPortal = () => api.post('/payments/portal-session');

export default api;
