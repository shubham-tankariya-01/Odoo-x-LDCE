export const BASE_URL = 'http://localhost:8000';

export async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
  };

  // Only add content-type JSON if it's not FormData (which sets its own boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new Error('Session expired. Please log in again.');
  }

  if (response.status === 204) {
    return null; // No content
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      data = { detail: text };
    } catch (e) {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMsg = data && (data.detail || data.message)
      ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail))
      : `Request failed (${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}


// ==========================================
// AUTH
// ==========================================
export async function register(payload) {
  return fetchWithAuth('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function login(username, password) {
  const formData = new URLSearchParams();
  formData.append('username', (username || '').trim());
  formData.append('password', password || '');

  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Invalid credentials');
  }
  return data;
}


// ==========================================
// USERS
// ==========================================
export async function getMe() {
  return fetchWithAuth('/users/me');
}

export async function updateMe(payload) {
  return fetchWithAuth('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getMyTrips(type) {
  // type can be 'preplanned' or 'previous' per API guide
  const qs = type ? `?type=${type}` : '';
  return fetchWithAuth(`/users/me/trips${qs}`);
}

// ==========================================
// CATALOG (Cities / Activities)
// ==========================================
export async function getCountries() {
  return fetchWithAuth('/countries');
}

export async function getPopularCities() {
  return fetchWithAuth('/cities/popular');
}


export async function searchCities(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return fetchWithAuth(`/cities${qs ? `?${qs}` : ''}`);
}

export async function getCitySuggestions(cityId) {
  return fetchWithAuth(`/cities/${cityId}/suggestions`);
}

export async function getActivities(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return fetchWithAuth(`/activities${qs ? `?${qs}` : ''}`);
}

// ==========================================
// TRIPS
// ==========================================
export async function createTrip(payload) {
  return fetchWithAuth('/trips', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listTrips(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return fetchWithAuth(`/trips${qs ? `?${qs}` : ''}`);
}

export async function getItinerary(tripId) {
  return fetchWithAuth(`/trips/${tripId}/itinerary`);
}

export async function getBudget(tripId) {
  return fetchWithAuth(`/trips/${tripId}/budget`);
}

// ==========================================
// SECTIONS & TRIP ACTIVITIES
// ==========================================
export async function listSections(tripId) {
  return fetchWithAuth(`/trips/${tripId}/sections`);
}

export async function createSection(tripId, payload) {
  return fetchWithAuth(`/trips/${tripId}/sections`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSection(sectionId, payload) {
  return fetchWithAuth(`/sections/${sectionId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteSection(sectionId) {
  return fetchWithAuth(`/sections/${sectionId}`, {
    method: 'DELETE',
  });
}

export async function reorderSections(tripId, orderedIds) {
  return fetchWithAuth(`/trips/${tripId}/sections/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
}

export async function addActivity(sectionId, payload) {
  return fetchWithAuth(`/sections/${sectionId}/activities`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateActivity(activityId, payload) {
  return fetchWithAuth(`/trip-activities/${activityId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteActivity(activityId) {
  return fetchWithAuth(`/trip-activities/${activityId}`, {
    method: 'DELETE',
  });
}

// ==========================================
// GLOBAL SEARCH
// ==========================================
export async function globalSearch(q) {
  if (!q) return { cities: [], trips: [] };
  const response = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(q)}`);
  if (!response.ok) throw new Error('Search failed');
  return response.json();
}

// ==========================================
// COMMUNITY
// ==========================================
export async function listPosts(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return fetchWithAuth(`/community/posts${qs ? `?${qs}` : ''}`);
}

export async function createPost(payload) {
  return fetchWithAuth('/community/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function toggleLikePost(postId) {
  return fetchWithAuth(`/community/posts/${postId}/like`, {
    method: 'POST',
  });
}

export async function addComment(postId, payload) {
  return fetchWithAuth(`/community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteComment(commentId, postId) {
  return fetchWithAuth(`/community/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
  });
}



// ==========================================
// ADMIN
// ==========================================
export async function adminListUsers(skip = 0, limit = 10) {
  return fetchWithAuth(`/admin/users?skip=${skip}&limit=${limit}`);
}

export async function adminUpdateUser(userId, payload) {
  return fetchWithAuth(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function adminDeleteUser(userId) {
  return fetchWithAuth(`/admin/users/${userId}`, {
    method: 'DELETE',
  });
}

export async function adminGetPopularCities() {
  return fetchWithAuth('/admin/analytics/popular-cities');
}

export async function adminGetPopularActivities() {
  return fetchWithAuth('/admin/analytics/popular-activities');
}

export async function adminGetTrends() {
  return fetchWithAuth('/admin/analytics/trends');
}
