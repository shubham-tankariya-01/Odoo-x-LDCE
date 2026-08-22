import { apiRequest } from './client';

export const getMe = () => apiRequest('GET', '/users/me');
export const updateMe = (payload) => apiRequest('PATCH', '/users/me', { body: payload });
export const getMyTrips = (type) => apiRequest('GET', '/users/me/trips', { params: { type } });
