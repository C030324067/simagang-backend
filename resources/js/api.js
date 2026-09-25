/**
 * API client helper with Sanctum Bearer token integration.
 */

const API_BASE = '/api';

export function getToken() {
  return localStorage.getItem('simagang_token') || '';
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('simagang_token', token);
  } else {
    localStorage.removeItem('simagang_token');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is not FormData, ensure Content-Type is application/json
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json().catch(() => ({
      success: false,
      message: `Error parsing server response (HTTP ${res.status})`,
    }));

    if (!res.ok && data.message === 'Unauthenticated.') {
      // Clear invalid token
      setToken(null);
    }

    return {
      ok: res.ok,
      status: res.status,
      ...data,
    };
  } catch (err) {
    return {
      ok: false,
      success: false,
      message: err.message || 'Gagal terhubung ke server backend.',
      data: null,
    };
  }
}

