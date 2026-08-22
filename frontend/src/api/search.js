import { apiRequest } from './client';

export const globalSearch = (q) => apiRequest('GET', '/search', { params: { q } });
