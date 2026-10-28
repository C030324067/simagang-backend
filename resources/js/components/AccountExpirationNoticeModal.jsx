import React from 'react';

export default function AccountExpirationNoticeModal({ open, onClose, expired = false, message = '' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="account-expiration-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h2 id="account-expiration-title" className="text-lg font-bold text-slate-900">{expired ? 'Masa Aktif Akun Berakhir' : 'Pemberitahuan Masa Aktif Akun'}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message || 'Sesuai dengan kebijakan Diskominfo Kabupaten Tabalong, akun magang Anda aktif selama periode kegiatan magang dan akan diberikan masa tenggang akses selama 7 (tujuh) hari setelah tanggal selesai magang. Setelah periode tersebut, akun akan dinonaktifkan secara otomatis.'}</p>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">{expired ? 'Kembali ke Login' : 'Saya Mengerti'}</button>
        </div>
      </section>
    </div>
  );
}
