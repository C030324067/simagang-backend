/**
 * API client helper with Sanctum Bearer token integration.
 */

const API_BASE = '/api';
const ACCOUNT_EXPIRATION_ROLES = ['intern', 'peserta', 'pemohon'];
const INTERNAL_ROLES = ['admin', 'kepegawaian', 'admin_kepegawaian', 'kabid', 'mentor', 'kadis', 'superadmin'];
const ACCOUNT_EXPIRATION_STATE_KEY = /(?:account[_-]?expired|account[_-]?expiration[_-]?(?:error|expired|state)|expiration[_-]?(?:error|expired|state)|expired[_-]?account)/i;

export function getToken() {
  return localStorage.getItem('simagang_token') || '';
}

export function clearAccountExpirationState() {
  [localStorage, sessionStorage].forEach((storage) => {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key && ACCOUNT_EXPIRATION_STATE_KEY.test(key)) {
        storage.removeItem(key);
      }
    }
  });

  window.dispatchEvent(new Event('simagang:clear-account-expiration'));
}

function getCachedUser() {
  try {
    return JSON.parse(localStorage.getItem('simagang_user') || 'null');
  } catch {
    return null;
  }
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('simagang_token', token);
  } else {
    localStorage.removeItem('simagang_token');
    localStorage.removeItem('simagang_user');
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

  const activeRole = localStorage.getItem('simagang_active_role');
  if (activeRole) {
    headers['X-Active-Role'] = activeRole;
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

    if (res.status === 401 && token && token === getToken()) {
      // A 401 confirms that the stored token is no longer accepted.
      setToken(null);
    }

    if (res.status === 403 && data.code === 'ACCOUNT_EXPIRED') {
      const currentToken = getToken();
      const cachedUser = getCachedUser();
      const activeRole = localStorage.getItem('simagang_active_role');
      const roles = [cachedUser?.role, activeRole].filter(Boolean);
      const hasInternalRole = roles.some((role) => INTERNAL_ROLES.includes(role));
      const isParticipant = ACCOUNT_EXPIRATION_ROLES.includes(cachedUser?.role);
      const isCurrentParticipantRequest = Boolean(token)
        && token === currentToken
        && isParticipant
        && !hasInternalRole;
      const isUnauthenticatedParticipantLogin = endpoint === '/auth/login'
        && !currentToken
        && !hasInternalRole;

      if (isCurrentParticipantRequest || isUnauthenticatedParticipantLogin) {
        if (isCurrentParticipantRequest) {
          setToken(null);
        }
        window.dispatchEvent(new CustomEvent('simagang:account-expired', { detail: data }));
      }
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
