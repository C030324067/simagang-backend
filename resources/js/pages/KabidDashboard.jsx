import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, downloadAcceptanceLetter } from '../api';
import useApplicationReviewDashboard from '../hooks/useApplicationReviewDashboard';
import useDivisions from '../hooks/useDivisions';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  X,
  ExternalLink,
  FileText
} from 'lucide-react';

export default function KabidDashboard() {
  const { user } = useAuth();
  const {
    pendingApps, selectedApp, setSelectedApp, actionForm, setActionForm, loading, submitting,
    msg, setMsg, openReview, handleActionSubmit,
  } = useApplicationReviewDashboard({ 
    endpoint: '/applications/kabid', 
    initialStatus: 'review_kadis', 
    initialNotes: 'Kandidat memiliki kualifikasi teknis yang relevan dengan kegiatan bidang.', 
    successMessage: 'Verifikasi teknis bidang berhasil disimpan.', 
    failureMessage: 'Gagal memproses verifikasi.' 
  });

  const [modalErr, setModalErr] = useState('');
  const [mentors, setMentors] = useState([]);
  const [mentorsLoading, setMentorsLoading] = useState(false);
  const [acceptedApps, setAcceptedApps] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);
  const { divisions, error: quotaError } = useDivisions();
  const quota = divisions.find((division) => Number(division.id) === Number(user?.division_id));

  useEffect(() => {
    let active = true;
    apiRequest('/applications?final_status=accepted&per_page=100').then((response) => {
      if (!active) return;
      if (response.success) {
        setAcceptedApps(response.data?.data || []);
      } else {
        setMsg({ type: 'error', text: response.message || 'Daftar peserta diterima gagal dimuat.' });
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const printAcceptanceLetter = async (applicationId) => {
    setDownloadingId(applicationId);
    const response = await downloadAcceptanceLetter(applicationId);
    setMsg({ type: response.success ? 'success' : 'error', text: response.message });
    setDownloadingId(null);
  };

  useEffect(() => {
    if (!selectedApp) {
      setMentors([]);
      return;
    }

    let active = true;
    setMentorsLoading(true);
    apiRequest(`/applications/${selectedApp.id}/mentors`)
      .then((response) => {
        if (!active) return;
        if (response.success) {
          setMentors(response.data || []);
        } else {
          setModalErr(response.message || 'Daftar pembimbing gagal dimuat.');
        }
      })
      .finally(() => {
        if (active) setMentorsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedApp]);

  // Validasi form lokal sebelum kirim
  const onSubmitHandler = (e) => {
    e.preventDefault();
    if (!actionForm.status) {
      setModalErr('Pilih keputusan terlebih dahulu: Setujui atau Tolak Calon.');
      return;
    }
    if (actionForm.status === 'rejected' && !actionForm.notes?.trim()) {
      setModalErr('Mohon isi alasan penolakan pada catatan pertimbangan teknis.');
      return;
    }
    if (actionForm.status === 'review_kadis' && !actionForm.mentor_id) {
      setModalErr('Pilih Pembimbing Lapangan sebelum menyetujui permohonan.');
      return;
    }
    setModalErr('');
    handleActionSubmit(e);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
      
      {/* Main Page Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Intro & Stat Header Section */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-2">
          <div className="space-y-1.5 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
              Dashboard Kepala Bidang
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Tinjau kesesuaian latar belakang teknis dan kualifikasi pemohon magang yang telah lolos verifikasi administrasi kepegawaian.
            </p>
            {quota && (
              <p className="text-xs font-semibold text-[#4F46E5] pt-1">
                Sisa Kuota {user?.division?.name || 'Bidang'}: <span className="font-bold">{Math.max(0, quota.remaining_quota)}/{quota.quota}</span>
              </p>
            )}
            {quotaError && <p role="status" className="text-xs text-rose-600">{quotaError}</p>}
          </div>

          {/* Menunggu Persetujuan Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs text-center min-w-[240px] shrink-0 self-start md:self-auto">
            <span className="block text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
              MENUNGGU PERSETUJUAN BIDANG
            </span>
            <b className="text-3xl sm:text-4xl font-extrabold text-[#4F46E5]">{pendingApps.length}</b>
          </div>
        </section>

        {/* Alert Notification */}
        {msg.text && (
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
              <span className="font-medium">{msg.text}</span>
            </div>
            <button 
              onClick={() => setMsg({ type: '', text: '' })} 
              className="p-1 rounded-lg hover:bg-black/5 text-slate-500 transition cursor-pointer"
              aria-label="Tutup pemberitahuan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Table Section */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 text-[#0F172A]">
            <Clock className="w-4 h-4 text-slate-700" />
            <h2 className="font-bold text-sm sm:text-base">
              Daftar Calon Magang Masuk Bidang ( {pendingApps.length} )
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-3">
              <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-[#4F46E5] border-t-transparent" />
              <p className="font-medium">Memuat antrean permohonan...</p>
            </div>
          ) : pendingApps.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-sm font-bold text-[#0F172A]">Semua permohonan bidang selesai ditinjau!</p>
              <p className="text-xs text-slate-400">
                Tidak ada pengajuan yang membutuhkan persetujuan Kepala Bidang saat ini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-bold">
                    <th className="py-3 px-3.5">Nama Pemohon</th>
                    <th className="py-3 px-3.5">Asal Institusi</th>
                    <th className="py-3 px-3.5">Bidang Penempatan</th>
                    <th className="py-3 px-3.5">Periode</th>
                    <th className="py-3 px-3.5">Catatan Kepegawaian</th>
                    <th className="py-3 px-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-3.5">
                        <span className="block font-bold text-[#0F172A] text-xs sm:text-sm">{app.user?.name}</span>
                        <span className="text-[11px] text-slate-400 font-normal">{app.user?.email}</span>
                      </td>
                      <td className="py-4 px-3.5">
                        <span className="block font-semibold text-slate-700 text-xs">{app.institution_name}</span>
                        <span className="text-[11px] text-slate-400 font-normal">{app.major || '—'}</span>
                      </td>
                      <td className="py-4 px-3.5 whitespace-nowrap">
                        <span className="inline-block px-3.5 py-1 bg-[#EEF2FF] text-[#4F46E5] font-bold text-[11px] rounded-full">
                          {app.division?.name || 'Bidang Aplikasi Informatika'}
                        </span>
                      </td>
                      <td className="py-4 px-3.5 text-slate-600 font-medium whitespace-nowrap">
                        {app.start_date} s/d {app.end_date}
                      </td>
                      <td className="py-4 px-3.5 text-slate-600 font-medium max-w-[220px]">
                        {app.notes_kepegawaian || 'Berkas diteruskan ke peninjauan bidang.'}
                      </td>
                      <td className="py-4 px-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setModalErr('');
                            openReview(app);
                          }}
                          className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                        >
                          Tinjau Teknis
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-sm sm:text-base text-[#0F172A]">
              Peserta Magang Diterima ({acceptedApps.length})
            </h2>
          </div>
          {acceptedApps.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">Belum ada peserta magang diterima di bidang Anda.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {acceptedApps.map((app) => (
                <div key={app.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm text-[#0F172A]">{app.user?.name}</p>
                    <p className="text-xs text-slate-500">{app.institution_name} · {app.division?.name || 'Bidang'}</p>
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

      </main>

      {/* Modal Popup: Verifikasi Teknis Penempatan */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-100 space-y-5 max-h-[88vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Verifikasi Teknis Penempatan</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calon Magang: <span className="font-semibold text-slate-700">{selectedApp.user?.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-700 space-y-2 leading-relaxed">
              <div><b className="text-slate-900">Institusi:</b> {selectedApp.institution_name} &middot; <b className="text-slate-900">Jurusan:</b> {selectedApp.major || '—'}</div>
              <div><b className="text-slate-900">Periode:</b> {selectedApp.start_date} s/d {selectedApp.end_date} &middot; <b className="text-slate-900">Bidang:</b> {selectedApp.division?.name || '—'}</div>
              
              <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-slate-200/60 mt-2">
                {[
                  ['Surat pengantar', selectedApp.cover_letter_path || selectedApp.file_proposal],
                  ['CV', selectedApp.file_cv],
                  ['Transkrip', selectedApp.transcript_path || selectedApp.file_recommendation_letter],
                  ['Kartu mahasiswa', selectedApp.student_card_path],
                ].map(([label, path]) => (
                  path ? (
                    <a 
                      key={label}
                      href={`/storage/${path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#4F46E5] font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                    >
                      Lihat {label}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span key={label} className="text-slate-400 text-[11px]">Lihat {label}</span>
                  )
                ))}
              </div>
            </div>

            {/* Form Decisions */}
            <form onSubmit={onSubmitHandler} className="space-y-4">
              <div>
                <span className="block text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2">
                  KEPUTUSAN KEPALA BIDANG
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActionForm({ ...actionForm, status: 'review_kadis' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-xs border transition cursor-pointer ${
                      actionForm.status === 'review_kadis'
                        ? 'bg-[#4F46E5] border-[#4F46E5] text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Setujui & Teruskan ke Kadis</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionForm({ ...actionForm, status: 'rejected', mentor_id: '' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-xs border transition cursor-pointer ${
                      actionForm.status === 'rejected'
                        ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>Tolak Calon</span>
                  </button>
                </div>
              </div>

              {actionForm.status === 'review_kadis' && (
                <div className="space-y-2">
                  <label htmlFor="mentor_id" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Pilih Pembimbing Lapangan <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="mentor_id"
                    required
                    value={actionForm.mentor_id || ''}
                    onChange={(event) => setActionForm({ ...actionForm, mentor_id: event.target.value })}
                    disabled={mentorsLoading || mentors.length === 0}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  >
                    <option value="">
                      {mentorsLoading ? 'Memuat pembimbing...' : 'Pilih Pembimbing Lapangan'}
                    </option>
                    {mentors.map((mentor) => (
                      <option key={mentor.id} value={mentor.id}>
                        {mentor.name} — {mentor.role === 'kabid' ? 'Kepala Bidang' : 'Staf Pembimbing'}
                      </option>
                    ))}
                  </select>

                  {/* UI Hint / Guidance */}
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-slate-600 leading-snug space-y-1">
                    <span className="font-bold text-[#4F46E5] block">📌 Petunjuk Penunjukan Pembimbing:</span>
                    <p>
                      • <strong>Siswa SMA/SMK:</strong> Disarankan menunjuk Staf Pembimbing Lapangan bidang.
                    </p>
                    <p>
                      • <strong>Mahasiswa D3 / S1 / Perguruan Tinggi:</strong> Dapat menunjuk Staf Senior atau Kepala Bidang secara langsung.
                    </p>
                  </div>

                  {mentors.length === 0 && !mentorsLoading && (
                    <p className="mt-1.5 text-xs text-rose-600 font-medium">
                      Tidak ada pembimbing aktif yang tersedia di bidang ini.
                    </p>
                  )}
                </div>
              )}

              {/* Textarea */}
              <div>
                <label htmlFor="fCatatan" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Catatan Pertimbangan Teknis
                </label>
                <textarea
                  id="fCatatan"
                  rows="3"
                  value={actionForm.notes || ''}
                  onChange={(e) => setActionForm({ ...actionForm, notes: e.target.value })}
                  placeholder="Tuliskan pertimbangan teknis atau alasan penolakan..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Error Message */}
              {modalErr && (
                <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 font-medium">
                  {modalErr}
                </p>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || mentorsLoading || (actionForm.status === 'review_kadis' && !actionForm.mentor_id)}
                  className="px-5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Kirim Keputusan Kabid'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}