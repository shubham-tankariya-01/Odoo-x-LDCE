import { apiRequest } from './client';

export const getPopularCities = () => apiRequest('GET', '/cities/popular');
export const searchCities = ({ search, filter, sort_by }) => apiRequest('GET', '/cities', { params: { search, filter, sort_by } });
export const getCitySuggestions = (cityId) => apiRequest('GET', `/cities/${cityId}/suggestions`);
