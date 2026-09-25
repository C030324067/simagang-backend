export function formatWhatsAppNumber(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('62')) return digits;
  return digits;
}

export function buildAcceptanceWhatsAppUrl({ phone, name, division, letterUrl }) {
  const number = formatWhatsAppNumber(phone);
  if (!number || !letterUrl) return null;
  const message = `Halo ${name}, selamat! Anda dinyatakan DITERIMA sebagai peserta magang.\nBidang penempatan: ${division || 'Belum ditentukan'}.\nSurat penerimaan dapat diakses melalui tautan berikut: ${letterUrl}\n\nSalam, Admin Kepegawaian.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
