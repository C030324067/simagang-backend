import React, { useEffect, useState } from 'react';
import '../../css/ApplicationStatus.css';

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

export default function ApplicationStatus({ trackingCode, onLogin, onReapply, onInvalidTrackingCode }) {
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

  if (loading) return <section className="application-status-card" aria-live="polite"><div className="application-status-loading" role="status">Memuat status pengajuan…</div></section>;
  if (error || !application) return <section className="application-status-card"><p className="application-status-error" role="alert">{error || 'Status pengajuan tidak ditemukan.'}</p><button className="application-status-button application-status-button--secondary" onClick={onInvalidTrackingCode} type="button">Masukkan kode lain</button></section>;

  const states = getStepStates(application);
  return (
    <section className="application-status-card" aria-label="Status pengajuan magang">
      <header className="application-status-header"><span className="status-pill">Pelacakan Pengajuan</span><h1>Status Pengajuan Magang</h1><p>Simpan kode pelacakan ini untuk melihat perkembangan pengajuan kamu.</p><code>{trackingCode}</code></header>
      <ol className="application-stepper">
        {stages.map((stage, index) => <li className={`application-step application-step--${states[index]}`} key={stage.key}>
          <span className="stepper-line" aria-hidden="true" />
          <span className="application-step-icon" aria-label={states[index]}>{states[index] === 'completed' ? '✓' : states[index] === 'rejected' ? '×' : index + 1}</span>
          <div className="application-step-content"><h2>{stage.title}</h2><p>{stage.description}</p></div>
        </li>)}
      </ol>
      {application.status === 'accepted' ? <div className="alert-card alert-accepted" role="status"><h2>🎉 Selamat, pengajuan kamu diterima!</h2><p>Surat resmi penerimaan magang kamu telah terbit. Silakan unduh surat di bawah ini, lalu masuk ke akun kamu untuk mulai mengisi jurnal harian.</p><div className="application-status-actions">{application.acceptance_letter_url && <a className="application-status-button application-status-button--primary" href={application.acceptance_letter_url} target="_blank" rel="noopener noreferrer" download>↓ Unduh Surat Penerimaan</a>}<button className="application-status-button application-status-button--secondary" onClick={onLogin} type="button">Lanjut Masuk ke Akun</button></div></div>
        : application.status === 'rejected' ? <div className="alert-card alert-rejected" role="status"><h2>✕ Mohon maaf, pengajuan kamu belum bisa diterima.</h2><p>Alasan: {application.rejection_reason || 'Tidak ada alasan yang dicantumkan.'}</p><button className="application-status-button application-status-button--primary" onClick={onReapply} type="button">Ajukan Permohonan Baru</button></div>
          : <div className="alert-card alert-info" role="status"><h2>⏳ Pengajuan sedang diproses</h2><p>Berkas kamu sedang dalam tahap verifikasi oleh tim terkait. Harap periksa halaman ini secara berkala.</p></div>}
    </section>
  );
}
