export const BASE_URL = 'http://localhost:8000';

export async function apiRequest(method, path, { params, body, isFormData = false } = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
  }

  const headers = {};
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const token = localStorage.getItem('gt_token');
  const noAuthPaths = ['/auth/register', '/auth/login', '/search'];
  
  if (token && !noAuthPaths.includes(path)) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    if (response.status === 401) {
      localStorage.removeItem('gt_token');
      window.dispatchEvent(new CustomEvent('unauthorized'));
      throw new Error('Unauthorized');
    }

    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || `Error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}
