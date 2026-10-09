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

export async function downloadAcceptanceLetter(applicationId) {
  try {
    const response = await fetch(`/pendaftaran/${applicationId}/cetak-surat`, {
      headers: {
        Accept: 'application/pdf, application/json',
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, message: error.message || 'Surat penerimaan gagal diunduh.' };
    }

    const objectUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    const disposition = response.headers.get('Content-Disposition') || '';
    const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || 'Surat-Penerimaan-Magang.pdf';
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);

    return { success: true, message: 'Surat penerimaan berhasil diunduh.' };
  } catch (error) {
    return { success: false, message: error.message || 'Surat gagal diunduh. Periksa koneksi lalu coba lagi.' };
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

  if (options.body instanceof FormData) {
    // Let fetch add the multipart boundary; setting this header manually breaks PHP parsing.
    Object.keys(headers)
      .filter((name) => name.toLowerCase() === 'content-type')
      .forEach((name) => delete headers[name]);
  } else if (options.body && !headers['Content-Type']) {
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
