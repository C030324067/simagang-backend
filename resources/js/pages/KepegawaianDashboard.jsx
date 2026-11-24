import React from 'react';
import useKepegawaianDashboard from '../hooks/useKepegawaianDashboard';
import { apiRequest, downloadAcceptanceLetter, getToken } from '../api';
import InternshipPeriodSettings from '../components/InternshipPeriodSettings';
import AutoDismissNotice from '../components/AutoDismissNotice';
import { 
  Clock, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  X
} from 'lucide-react';

export default function KepegawaianDashboard() {
  const {
    pendingApps, approvedApps, acceptedApps, letterNumbers, setLetterNumbers, divisions, selectedApp, setSelectedApp,
    actionForm, setActionForm, loading, submitting, msg, setMsg, uploadLetter, openDocument, handleActionSubmit
  } = useKepegawaianDashboard();
  const [downloadingId, setDownloadingId] = React.useState(null);
  const [evaluations, setEvaluations] = React.useState([]);
  const [issuingId, setIssuingId] = React.useState(null);
  const [previewingId, setPreviewingId] = React.useState(null);
  const [downloadingCertificateId, setDownloadingCertificateId] = React.useState(null);
  const [certificateNumbers, setCertificateNumbers] = React.useState({});
  const [activeTab, setActiveTab] = React.useState('quota');

  React.useEffect(() => {
    apiRequest('/evaluations?per_page=1000').then((response) => {
      if (response.success) setEvaluations(response.data?.data || response.data || []);
    });
  }, []);

  const issueCertificate = async (applicationId, certificateNumber) => {
    if (!certificateNumber?.trim()) {
      setMsg({ type: 'error', text: 'Nomor sertifikat wajib diisi.' });
      return;
    }

    setIssuingId(applicationId);
    try {
      const response = await apiRequest(`/certificates/${applicationId}/issue`, {
        method: 'POST',
        body: JSON.stringify({ certificate_number: certificateNumber.trim() }),
      });
      setMsg({ type: response.success ? 'success' : 'error', text: response.message || 'Penerbitan sertifikat gagal.' });
      if (response.success) {
        setEvaluations((current) => current.map((evaluation) => (
          Number(evaluation.intern_application_id) === Number(applicationId)
            ? {
                ...evaluation,
                internApplication: {
                  ...(evaluation.internApplication || {}),
                  certificate: response.data,
                },
              }
            : evaluation
        )));
      }
    } finally {
      setIssuingId(null);
    }
  };

  const previewCertificate = async (applicationId, certificateNumber) => {
    const previewWindow = window.open('about:blank', '_blank');
    if (!previewWindow) {
      setMsg({ type: 'error', text: 'Izinkan pop-up browser untuk membuka pratinjau sertifikat.' });
      return;
    }

    setPreviewingId(applicationId);
    try {
      const query = new URLSearchParams({ certificate_number: certificateNumber });
      const response = await fetch(`/api/certificates/${applicationId}/preview?${query.toString()}`, {
        headers: {
          Accept: 'application/pdf, application/json',
          Authorization: `Bearer ${getToken()}`,
          'X-Active-Role': localStorage.getItem('simagang_active_role') || '',
        },
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        previewWindow.close();
        setMsg({ type: 'error', text: error.message || 'Preview sertifikat gagal dimuat.' });
        return;
      }

      const blob = new Blob([await response.blob()], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      previewWindow.opener = null;
      previewWindow.location.href = blobUrl;
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
      setMsg({ type: 'success', text: 'Preview sertifikat berhasil dimuat.' });
    } catch (error) {
      previewWindow.close();
      setMsg({ type: 'error', text: error.message || 'Preview sertifikat gagal dimuat. Periksa koneksi lalu coba lagi.' });
    } finally {
      setPreviewingId(null);
    }
  };

  const downloadCertificate = async (certificate) => {
    setDownloadingCertificateId(certificate.id);
    try {
      const response = await fetch(`/api/certificates/${certificate.id}/download`, {
        headers: {
          Accept: 'application/pdf, application/json',
          Authorization: `Bearer ${getToken()}`,
          'X-Active-Role': localStorage.getItem('simagang_active_role') || '',
        },
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        setMsg({ type: 'error', text: error.message || 'Sertifikat PDF gagal diunduh.' });
        return;
      }
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      const disposition = response.headers.get('Content-Disposition') || '';
      link.href = objectUrl;
      link.download = disposition.match(/filename="?([^";]+)"?/i)?.[1] || 'Sertifikat-Magang.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      setMsg({ type: 'success', text: 'Sertifikat PDF berhasil diunduh.' });
    } catch (error) {
      setMsg({ type: 'error', text: error.message || 'Sertifikat PDF gagal diunduh.' });
    } finally {
      setDownloadingCertificateId(null);
    }
  };

  const printAcceptanceLetter = async (applicationId) => {
    setDownloadingId(applicationId);
    const response = await downloadAcceptanceLetter(applicationId);
    setMsg({ type: response.success ? 'success' : 'error', text: response.message });
    setDownloadingId(null);
  };

  const certificateEvaluations = evaluations.filter((evaluation) => acceptedApps.some((app) => (
    app.internship_status === 'completed'
    && Number(app.id) === Number(evaluation.internApplication?.id || evaluation.intern_application_id)
  )));

  return (
    <div className="min-h-screen bg-slate-50/80 py-8 font-sans text-slate-800">
      <main className="mx-auto max-w-[1440px] space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              Dashboard Verifikasi Kepegawaian Diskominfo
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Verifikasi kelengkapan berkas pemohon magang, periksa kuota, dan tentukan bidang penempatan.
            </p>
          </div>
          <div className="flex min-w-[170px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-6 py-3.5 shadow-sm md:min-w-[190px]">
            <span className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Menunggu Verifikasi
            </span>
            <div className="mt-1 text-3xl font-extrabold leading-none text-indigo-600">{pendingApps.length}</div>
          </div>
        </section>

        {/* Alert Notification */}
        {msg.text && (
          <AutoDismissNotice watch={msg}>
            <div className={`p-4 rounded-2xl text-xs sm:text-sm border shadow-xs flex items-center justify-between gap-3 transition-all ${
            msg.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-3">
              {msg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold">{msg.text}</span>
            </div>
            <button 
              onClick={() => setMsg({ type: '', text: '' })} 
              className="p-1 rounded-lg hover:bg-black/5 text-slate-500 transition"
            >
              <X className="w-4 h-4" />
            </button>
            </div>
          </AutoDismissNotice>
        )}

        <nav
          role="tablist"
          aria-label="Navigasi dashboard Kepegawaian"
          className="grid w-full grid-cols-1 gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
        >
          {[
            { id: 'quota', label: 'Pengaturan Kuota' },
            { id: 'pending', label: `Antrean Permohonan (${pendingApps.length})`, icon: Clock },
            { id: 'approved', label: `Persetujuan Kadis (${approvedApps.length})`, icon: FileText },
            { id: 'certificates', label: 'Penerbitan Sertifikat', icon: FileText },
            { id: 'accepted', label: `Peserta Diterima (${acceptedApps.length})`, icon: FileText },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-center text-xs font-bold transition sm:text-sm ${
                activeTab === id
                  ? 'bg-[#3b43d6] text-white shadow-sm'
                  : 'bg-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {label}
            </button>
          ))}
        </nav>

        {activeTab === 'quota' && <InternshipPeriodSettings divisions={divisions} />}

        {/* Section 1: Antrean Permohonan Masuk */}
        {activeTab === 'pending' && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Clock className="w-5 h-5 text-[#0F2942]" />
            <h3 className="font-bold text-[#0F2942] text-base sm:text-lg">
              Antrean Permohonan Masuk ( {pendingApps.length} )
            </h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-3">
              <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-[#4F46E5] border-t-transparent" />
              <p className="font-medium">Memuat data permohonan...</p>
            </div>
          ) : pendingApps.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Tidak ada antrean permohonan yang tertunda saat ini.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold text-xs">
                    <th className="py-3 px-4 font-semibold">Nama Pemohon</th>
                    <th className="py-3 px-4 font-semibold">Asal Institusi</th>
                    <th className="py-3 px-4 font-semibold">Jalur</th>
                    <th className="py-3 px-4 font-semibold">Periode Magang</th>
                    <th className="py-3 px-4 font-semibold">Dokumen</th>
                    <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 align-top">
                        <div>
                          <p className="font-bold text-[#0F2942] text-sm">{app.user?.name}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{app.user?.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top text-slate-600 font-normal">
                        {app.institution_name}
                      </td>
                      <td className="py-4 px-4 align-top">
                        <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[#E0EDFF] text-[#4F46E5]">
                          {app.application_type || 'MANDIRI'}
                        </span>
                      </td>
                      <td className="py-4 px-4 align-top text-slate-600 whitespace-nowrap font-normal">
                        {app.start_date} s/d {app.end_date}
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          {[
                            ['Surat pengantar / proposal', 'proposal', app.cover_letter_path || app.file_proposal],
                            ['CV', 'cv', app.file_cv],
                            ['Transkrip nilai', 'transcript', app.transcript_path || app.file_recommendation_letter],
                            ['Kartu mahasiswa', 'student-card', app.student_card_path],
                          ].map(([label, documentType, path]) => path ? (
                            <button
                              key={label}
                              type="button"
                              onClick={() => openDocument(app.id, documentType)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4F46E5] hover:underline cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span>{label}</span>
                            </button>
                          ) : (
                            <span key={label} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span>{label} (tidak tersedia)</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top text-right">
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setActionForm({
                              status: 'review_kabid',
                              division_id: app.division_id || divisions[0]?.id || '',
                              notes: 'Berkas administrasi lengkap dan valid.',
                            });
                          }}
                          className="px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                        >
                          Verifikasi Berkas
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        )}

        {/* Section 2: Persetujuan Kadis — terbitkan surat resmi */}
        {activeTab === 'approved' && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-5 h-5 text-[#0F2942]" />
            <h3 className="font-bold text-[#0F2942] text-base sm:text-lg">
              Persetujuan Kadis — terbitkan surat resmi ( {approvedApps.length} )
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {approvedApps.map((app) => (
              <div key={app.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition px-2 rounded-xl">
                
                {/* Info Pemohon */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-[#0F2942] text-sm">{app.user?.name}</p>
                    <span className="text-xs text-slate-400 font-normal">
                      ({app.application_type === 'rekomendasi_kampus' ? 'Rekomendasi Kampus' : 'Pemohon Magang'})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {app.institution_name} <span className="text-slate-300">·</span> {app.user?.email}
                  </p>
                </div>

                {/* Form Input Nomor Surat & Action Button */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 shrink-0">
                  <input
                    type="text"
                    id={`official-letter-number-${app.id}`}
                    value={letterNumbers[app.id] || ''}
                    onChange={(event) => setLetterNumbers((previous) => ({ ...previous, [app.id]: event.target.value }))}
                    placeholder="Masukkan Nomor Surat Resmi"
                    aria-label={`Nomor surat resmi untuk ${app.user?.name || 'pemohon'}`}
                    className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20"
                  />

                  <button 
                    type="button"
                    disabled={submitting}
                    onClick={() => uploadLetter(app.id, letterNumbers[app.id])}
                    className="px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs transition disabled:opacity-50 shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    {submitting ? 'Memproses...' : 'Terbitkan & Generate'}
                  </button>
                </div>
              </div>
            ))}

            {!loading && approvedApps.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                Belum ada permohonan yang menunggu surat resmi.
              </div>
            )}
          </div>
        </section>
        )}

        {activeTab === 'certificates' && (
        <section className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
          <p className="mb-4 text-sm text-slate-500">Peserta yang telah menyelesaikan magang dan memiliki evaluasi akhir mentor.</p>
          <div className="divide-y divide-slate-100">
            {certificateEvaluations.map((evaluation) => {
              const application = evaluation.internApplication
                || acceptedApps.find((app) => Number(app.id) === Number(evaluation.intern_application_id));
              const applicationId = application?.id || evaluation.intern_application_id;
              const certificate = application?.certificate || evaluation.internApplication?.certificate;
              const certificateNumber = certificateNumbers[applicationId] ?? certificate?.certificate_number ?? '';

              return (
                <div key={evaluation.id} className="flex flex-col justify-between gap-6 py-5 md:flex-row md:items-center">
                  <div className="flex-1">
                    <p className="text-base font-bold text-[#0f2c59]">{evaluation.intern?.name}</p>
                    <p className="mt-0.5 text-sm text-slate-500">Nilai akhir: {Number(evaluation.final_score || 0).toFixed(2)}</p>
                    <label className="block">
                      <span className="mb-1.5 mt-3 block text-xs font-semibold text-slate-700">Nomor surat sertifikat</span>
                      <input
                        type="text"
                        required
                        maxLength={255}
                        value={certificateNumber}
                        onChange={(event) => setCertificateNumbers((previous) => ({ ...previous, [applicationId]: event.target.value }))}
                        placeholder="Contoh: 800/123/2026"
                        aria-label={`Nomor surat sertifikat untuk ${evaluation.intern?.name || 'peserta'}`}
                        className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-[#3b43d6] focus:outline-none"
                      />
                    </label>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 md:pt-4">
                    <button
                      type="button"
                      disabled={previewingId === applicationId}
                      onClick={() => previewCertificate(applicationId, certificateNumber)}
                      className="rounded-lg bg-[#5b61e6] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4e54d4] disabled:opacity-50"
                    >
                      {previewingId === applicationId ? 'Memuat...' : 'Preview Sertifikat'}
                    </button>
                    <button
                      type="button"
                      disabled={issuingId === applicationId}
                      onClick={() => issueCertificate(applicationId, certificateNumber)}
                      className="rounded-lg bg-[#3b43d6] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2f36b8] disabled:opacity-50"
                    >
                      {issuingId === applicationId ? 'Menerbitkan...' : 'Terbitkan Sertifikat'}
                    </button>
                    {certificate && (
                      <button
                        type="button"
                        disabled={downloadingCertificateId === certificate.id}
                        onClick={() => downloadCertificate(certificate)}
                        className="whitespace-nowrap text-xs font-semibold text-[#3b43d6] underline disabled:opacity-50"
                      >
                        {downloadingCertificateId === certificate.id ? 'Menyiapkan PDF...' : 'Unduh PDF'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {!certificateEvaluations.length && <p className="py-6 text-center text-sm text-slate-400">Belum ada peserta selesai dengan evaluasi akhir.</p>}
          </div>
        </section>
        )}

        {activeTab === 'accepted' && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-5 h-5 text-[#0F2942]" />
            <h3 className="font-bold text-[#0F2942] text-base sm:text-lg">
              Peserta Magang Diterima ({acceptedApps.length})
            </h3>
          </div>
          {acceptedApps.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-400">Belum ada peserta magang yang diterima.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {acceptedApps.map((app) => (
              <div key={app.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm text-[#0F2942]">{app.user?.name}</p>
                    <p className="text-xs text-slate-500">{app.institution_name} · {app.division?.name || 'Bidang belum tersedia'}</p>
                  </div>
                  <button
                    type="button"
                    disabled={downloadingId === app.id}
                    onClick={() => printAcceptanceLetter(app.id)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs rounded-xl disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    {downloadingId === app.id ? 'Menyiapkan PDF...' : 'Cetak Surat Balasan'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
        )}

      </main>

      {/* Verification Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-100 space-y-6">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#0F2942]">Verifikasi Berkas Pemohon</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="font-semibold text-slate-700">{selectedApp.user?.name}</span> ({selectedApp.institution_name})
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Keputusan Verifikasi
                </label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setActionForm({ ...actionForm, status: 'review_kabid' })}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition cursor-pointer ${
                      actionForm.status === 'review_kabid'
                        ? 'bg-[#10B981] text-white border-[#10B981] shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Setujui & Teruskan
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionForm({ ...actionForm, status: 'rejected' })}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition cursor-pointer ${
                      actionForm.status === 'rejected'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak Pengajuan
                  </button>
                </div>
              </div>

              {actionForm.status === 'review_kabid' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Penetapan Bidang Penempatan (Diskominfo)
                  </label>
                  <select
                    required
                    value={actionForm.division_id}
                    onChange={(e) => setActionForm({ ...actionForm, division_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium outline-none focus:ring-1 focus:ring-[#4F46E5] focus:bg-white transition"
                  >
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id} disabled={d.remaining_quota <= 0}>{d.name} ({d.code}) — Sisa Kuota: {Math.max(0, d.remaining_quota)}/{d.quota}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Catatan Verifikasi
                </label>
                <textarea
                  rows="3"
                  required
                  value={actionForm.notes}
                  onChange={(e) => setActionForm({ ...actionForm, notes: e.target.value })}
                  placeholder="Masukkan catatan evaluasi berkas..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-1 focus:ring-[#4F46E5] focus:bg-white transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Verifikasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
