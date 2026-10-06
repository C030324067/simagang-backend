import React, { useEffect, useState } from 'react';

const stages = [
  { key: 'submitted', title: 'Pengajuan Terkirim', description: 'Formulir dan seluruh berkas berhasil dikirim ke sistem.' },
  { key: 'kepegawaian', title: 'Verifikasi Kepegawaian', description: 'Admin kepegawaian memeriksa kelengkapan berkas dan menentukan bidang penempatan.' },
  { key: 'kabid', title: 'Verifikasi Kepala Bidang', description: 'Kepala bidang terkait meninjau kesesuaian teknis pemohon.' },
  { key: 'kadis', title: 'Otorisasi Kepala Dinas', description: 'Kepala Dinas memberikan otorisasi akhir atas permohonan magang kamu.' },
  { key: 'accepted', title: 'Diterima & Surat Terbit', description: 'Admin Kepegawaian menerbitkan surat resmi penerimaan magang kamu.' },
];

const progressStage = { pending_kepegawaian: 1, pending_kabid: 2, review_kabid: 2, pending_kadis: 3, review_kadis: 3, approved_by_kadis: 4, pending_letter_number: 4, approved_kadis: 4 };
const rejectionIndex = { kepegawaian: 1, kabid: 2, kadis: 3 };
const trackingNotFoundMessage = 'Kode tracking tidak ditemukan. Silakan periksa kembali kode Anda.';

function getStepStates(application) {
  if (application.status === 'accepted') return stages.map(() => 'completed');
  if (application.status === 'rejected') {
    const rejectedAt = rejectionIndex[application.rejected_at_stage] ?? 1;
    return stages.map((_, index) => index === 0 ? 'completed' : index < rejectedAt ? 'completed' : index === rejectedAt ? 'rejected' : 'disabled');
  }
  const activeIndex = progressStage[application.status] ?? 1;
  return stages.map((_, index) => index === 0 || index < activeIndex ? 'completed' : index === activeIndex ? 'active' : 'disabled');
}

export default function ApplicationStatus({ trackingCode, onLogin, onReapply, onChangeTrackingCode, onBack }) {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadStatus = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/applications/track/${encodeURIComponent(trackingCode)}`, { headers: { Accept: 'application/json' } });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) {
          const error = new Error(result.message || (response.status === 404 ? trackingNotFoundMessage : 'Status pengajuan tidak dapat dimuat.'));
          error.response = { status: response.status, data: result };
          throw error;
        }
        if (active) setApplication(result.data);
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || requestError.message || 'Gagal memuat status pengajuan.');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadStatus();
    const refreshTimer = window.setInterval(loadStatus, 60000);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, [trackingCode]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 px-4 py-10">
        <section className="w-full max-w-xl space-y-6 rounded-3xl bg-white p-6 shadow-xl md:p-8" aria-live="polite">
          <button
            className="text-xs font-semibold text-slate-600 transition hover:text-slate-900"
            onClick={onBack}
            type="button"
          >
            ← Kembali ke Beranda
          </button>
          <p className="py-6 text-center text-sm text-slate-500" role="status">Memuat status pengajuan…</p>
        </section>
      </main>
    );
  }

  if (error || !application) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 px-4 py-10">
        <section className="w-full max-w-xl space-y-6 rounded-3xl bg-white p-6 shadow-xl md:p-8">
          <button
            className="text-xs font-semibold text-slate-600 transition hover:text-slate-900"
            onClick={onBack}
            type="button"
          >
            ← Kembali ke Beranda
          </button>
          <p className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-900" role="alert">
            {error || 'Status pengajuan tidak ditemukan.'}
          </p>
          <button
            className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
            onClick={onChangeTrackingCode}
            type="button"
          >
            Masukkan kode lain
          </button>
        </section>
      </main>
    );
  }

  const states = getStepStates(application);
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 px-4 py-10">
      <section className="w-full max-w-xl space-y-6 rounded-3xl bg-white p-6 shadow-xl md:p-8" aria-label="Status pengajuan magang">
        <header className="space-y-3">
          <button
            className="mb-2 text-xs font-semibold text-slate-600 transition hover:text-slate-900"
            onClick={onBack}
            type="button"
          >
            ← Kembali ke Beranda
          </button>
          <h1 className="text-xl font-bold text-slate-900 md:text-2xl">Status Pengajuan Magang</h1>
          <p className="text-xs text-slate-500">Simpan kode pelacakan ini untuk melihat perkembangan pengajuan kamu.</p>
          <code className="inline-block rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-xs font-semibold text-slate-700">
            {trackingCode}
          </code>
          <div>
            <button
              className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
              onClick={onChangeTrackingCode}
              type="button"
            >
              Masukkan kode tracking lain
            </button>
          </div>
        </header>

        <ol className="space-y-1">
          {stages.map((stage, index) => (
            <li className="relative flex gap-3 pb-4 last:pb-0" key={stage.key}>
              {index < stages.length - 1 && (
                <span className="absolute bottom-0 left-3.5 top-7 w-0.5 bg-slate-200" aria-hidden="true" />
              )}
              <span
                className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  states[index] === 'completed'
                    ? 'bg-emerald-500 text-white'
                    : states[index] === 'active'
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : states[index] === 'rejected'
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-200 text-slate-400'
                }`}
                aria-label={states[index]}
              >
                {states[index] === 'completed' ? '✓' : states[index] === 'rejected' ? '×' : index + 1}
              </span>
              <div className="space-y-1 pt-0.5">
                <h2 className={`text-sm font-semibold ${states[index] === 'rejected' ? 'text-rose-700' : 'text-slate-800'}`}>
                  {stage.title}
                </h2>
                <p className="text-xs leading-relaxed text-slate-500">{stage.description}</p>
              </div>
            </li>
          ))}
        </ol>

        {application.status === 'accepted' ? (
          <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs text-emerald-900" role="status">
            <h2 className="font-semibold">🎉 Selamat, pengajuan kamu diterima!</h2>
            <p className="leading-relaxed">Surat resmi penerimaan magang kamu telah terbit. Silakan unduh surat di bawah ini, lalu masuk ke akun kamu untuk mulai mengisi jurnal harian.</p>
            <div className="flex flex-wrap gap-2">
              {application.acceptance_letter_url && (
                <a
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-xs font-semibold text-white transition hover:bg-emerald-700"
                  href={application.acceptance_letter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  ↓ Unduh Surat Penerimaan
                </a>
              )}
              <button
                className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100"
                onClick={onLogin}
                type="button"
              >
                Lanjut Masuk ke Akun
              </button>
            </div>
          </div>
        ) : application.status === 'rejected' ? (
          <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-xs text-red-900" role="status">
            <h2 className="font-semibold">✕ Mohon maaf, pengajuan kamu belum bisa diterima.</h2>
            <p className="leading-relaxed">Alasan: {application.rejection_reason || 'Tidak ada alasan yang dicantumkan.'}</p>
            <button
              className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-rose-700"
              onClick={onReapply}
              type="button"
            >
              Ajukan Permohonan Baru
            </button>
          </div>
        ) : (
          <div className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-900" role="status">
            <h2 className="font-semibold">⏳ Pengajuan sedang diproses</h2>
            <p className="leading-relaxed">Berkas kamu sedang dalam tahap verifikasi oleh tim terkait. Harap periksa halaman ini secara berkala.</p>
          </div>
        )}
      </section>
    </main>
  );
}
