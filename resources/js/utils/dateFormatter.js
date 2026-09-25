const WITA = 'Asia/Makassar';

export function formatLocalTime(value) {
  if (!value) return null;
  // API time columns are SQL TIME strings; parse the wall clock without treating it as UTC.
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: WITA }).format(date);
}

export function formatWitaDateTime(value, options = {}) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('id-ID', { ...options, timeZone: WITA, hour12: false }).format(date);
}
