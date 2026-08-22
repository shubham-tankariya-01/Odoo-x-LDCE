import { apiRequest } from './client';

export const getActivities = ({ search, category, sort_by }) => apiRequest('GET', '/activities', { params: { search, category, sort_by } });
