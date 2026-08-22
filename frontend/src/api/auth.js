import { apiRequest } from './client';

export const register = (payload) => apiRequest('POST', '/auth/register', { body: payload });

export const login = (username, password) => {
  const body = new URLSearchParams();
  body.append('username', username);
  body.append('password', password);
  return apiRequest('POST', '/auth/login', { body, isFormData: true });
};
