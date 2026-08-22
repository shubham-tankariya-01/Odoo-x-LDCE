import { apiRequest } from './client';

export const createTrip = (payload) => apiRequest('POST', '/trips', { body: payload });
export const listTrips = ({ status, sort_by, search, limit }) => apiRequest('GET', '/trips', { params: { status, sort_by, search, limit } });
export const createSection = (tripId, payload) => apiRequest('POST', `/trips/${tripId}/sections`, { body: payload });
export const listSections = (tripId) => apiRequest('GET', `/trips/${tripId}/sections`);
export const updateSection = (sectionId, payload) => apiRequest('PATCH', `/sections/${sectionId}`, { body: payload });
export const deleteSection = (sectionId) => apiRequest('DELETE', `/sections/${sectionId}`);
export const reorderSections = (tripId, orderedIds) => apiRequest('PATCH', `/trips/${tripId}/sections/reorder`, { body: { ordered_ids: orderedIds } });
export const addActivity = (sectionId, payload) => apiRequest('POST', `/sections/${sectionId}/activities`, { body: payload });
export const updateActivity = (activityId, payload) => apiRequest('PATCH', `/trip-activities/${activityId}`, { body: payload });
export const deleteActivity = (activityId) => apiRequest('DELETE', `/trip-activities/${activityId}`);
export const getItinerary = (tripId) => apiRequest('GET', `/trips/${tripId}/itinerary`);
export const getBudget = (tripId) => apiRequest('GET', `/trips/${tripId}/budget`);
