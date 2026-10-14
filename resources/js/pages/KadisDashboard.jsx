import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import useApplicationReviewDashboard from '../hooks/useApplicationReviewDashboard';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2,
  AlertCircle,
  X,
  Calendar,
  Briefcase,
  FileSignature,
  Search
} from 'lucide-react';

const extractApplications = (response) => {
  const candidates = [
    response,
    response?.data,
    response?.data?.data,
    response?.data?.data?.data,
  ];

  return candidates.find(Array.isArray) || [];
};

export default function KadisDashboard() {
  const { user } = useAuth();
  const {
    pendingApps, selectedApp, setSelectedApp, loading, submitting,
    msg, setMsg, openReview, submitDecision,
  } = useApplicationReviewDashboard({ 
    endpoint: '/applications/kadis', 
    initialStatus: 'approved_by_kadis', 
    initialNotes: 'Permohonan diotorisasi Kadis dan diteruskan kepada Kepegawaian untuk penerbitan surat.', 
    successMessage: 'Persetujuan Kepala Dinas berhasil disimpan.', 
    failureMessage: 'Gagal memproses persetujuan Kepala Dinas.' 
  });

  // State untuk Pemagang Aktif Dinas
  const [activeInterns, setActiveInterns] = useState([]);
  const [activeLoading, setActiveLoading] = useState(false);
  const [isActiveModalOpen, setIsActiveModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // State untuk Riwayat Keputusan Kadis
  const [historyApps, setHistoryApps] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const safePendingApps = Array.isArray(pendingApps) ? pendingApps.filter(Boolean) : [];
  const safeActiveInterns = Array.isArray(activeInterns) ? activeInterns.filter(Boolean) : [];
  const safeHistoryApps = Array.isArray(historyApps) ? historyApps.filter(Boolean) : [];

  // Fetch Pemagang Aktif
  const fetchActiveInterns = async () => {
    setActiveLoading(true);
    try {
      const token = localStorage.getItem('token')
        || localStorage.getItem('auth_token')
        || localStorage.getItem('simagang_token');
      if (!token) {
        throw new Error('Token autentikasi tidak ditemukan. Silakan masuk kembali.');
      }

      const res = await fetch('/api/applications?final_status=accepted&per_page=100', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || `Gagal memuat pemagang aktif (HTTP ${res.status}).`);
      }

      setActiveInterns(extractApplications(data));
    } catch (err) {
      console.error('Gagal memuat daftar pemagang aktif:', err);
      setMsg({ type: 'error', text: err?.message || 'Gagal memuat daftar pemagang aktif.' });
    } finally {
      setActiveLoading(false);
    }
  };

  // Fetch Riwayat Keputusan
  const fetchHistoryApps = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('token')
        || localStorage.getItem('auth_token')
        || localStorage.getItem('simagang_token');
      if (!token) {
        throw new Error('Token autentikasi tidak ditemukan. Silakan masuk kembali.');
      }

      const res = await fetch('/api/applications/history-kadis', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || `Gagal memuat riwayat keputusan (HTTP ${res.status}).`);
      }

      setHistoryApps(extractApplications(data));
    } catch (err) {
      console.error('Gagal memuat riwayat keputusan:', err);
      setMsg({ type: 'error', text: err?.message || 'Gagal memuat riwayat keputusan.' });
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveInterns();
    fetchHistoryApps();
  }, []);

  // Filter pencarian modal pemagang aktif
  const filteredInterns = safeActiveInterns.filter((app) => {
    const term = (searchTerm || '').trim().toLowerCase();
    if (!term) return true;
    const name = String(app?.user?.name || app?.name || '').toLowerCase();
    const inst = String(app?.institution_name || '').toLowerCase();
    const div = String(app?.division?.name || '').toLowerCase();
    const email = String(app?.user?.email || '').toLowerCase();
    return name.includes(term) || inst.includes(term) || div.includes(term) || email.includes(term);
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
      
      {/* Main Page Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Header & Stat Section */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-2">
          <div className="space-y-1.5 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
              Dashboard Kepala Dinas
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Berikan tanda tangan otorisasi digital akhir untuk menerbitkan Surat Resmi Penerimaan Magang bagi pemohon yang telah disetujui Kepegawaian dan Kabid.
            </p>
          </div>

          {/* Stat Cards Container Header (Ukuran Identik Presisi) */}
          <div className="flex items-center gap-4 shrink-0 self-start md:self-auto flex-wrap sm:flex-nowrap">
            
            {/* Card 1: Pemagang Aktif Dinas */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs text-center min-w-[210px] sm:min-w-[230px] h-[120px] flex flex-col items-center justify-center shrink-0">
              <span className="block text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                PEMAGANG AKTIF DINAS
              </span>
              <b className="text-3xl sm:text-4xl font-extrabold text-[#4F46E5] leading-tight">
                {activeLoading ? '...' : safeActiveInterns.length}
              </b>
              <button
                type="button"
                onClick={() => setIsActiveModalOpen(true)}
                className="text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] mt-1 transition-colors cursor-pointer"
              >
                Lihat daftar &rsaquo;
              </button>
            </div>

            {/* Card 2: Menunggu Otorisasi Kadis (Ukuran Sama Persis) */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs text-center min-w-[210px] sm:min-w-[230px] h-[120px] flex flex-col items-center justify-center shrink-0">
              <span className="block text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                MENUNGGU OTORISASI KADIS
              </span>
              <b className="text-3xl sm:text-4xl font-extrabold text-[#4F46E5] leading-tight">
                {safePendingApps.length}
              </b>
              <div className="h-4 mt-1" /> {/* Penyeimbang tinggi agar posisinya sejajar */}
            </div>

          </div>
        </section>

        {/* Alert Notification */}
        {msg?.text && (
          <div className={`p-4 rounded-2xl text-xs sm:text-sm border shadow-xs flex items-center justify-between gap-3 transition-all ${
            msg?.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-3">
              {msg?.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{msg?.text || '—'}</span>
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

        {/* KARTU 1: Antrean Otorisasi Akhir */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 text-[#0F172A]">
            <Clock className="w-4.5 h-4.5 text-slate-700" />
            <h2 className="font-bold text-sm sm:text-base">
              Antrean Otorisasi Akhir ( {safePendingApps.length} )
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-3">
              <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-[#4F46E5] border-t-transparent" />
              <p className="font-medium">Memuat antrean otorisasi...</p>
            </div>
          ) : safePendingApps.length === 0 ? (
            /* Empty State Kartu 1 */
            <div className="py-14 px-4 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-sm font-bold text-[#0F172A]">Semua permohonan telah diotorisasi!</p>
              <p className="text-xs text-slate-400">
                Tidak ada berkas yang menunggu tanda tangan otorisasi Kepala Dinas saat ini.
              </p>
            </div>
          ) : (
            /* Itemized List Permohonan */
            <div className="space-y-3">
              {safePendingApps.map((app, index) => (
                <div 
                  key={app?.id ?? index}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#0F172A] text-sm sm:text-base">{app?.user?.name || app?.name || '—'}</span>
                      <span className="text-xs text-slate-400 font-normal">&middot; ID: #{app?.id || '—'}</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {app?.institution_name || '—'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        {app?.division?.name || 'Aplikasi Informatika'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {app?.start_date || '—'} s/d {app?.end_date || '—'}
                      </span>
                    </div>

                    {app?.notes_kabid && (
                      <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 inline-block font-medium">
                        <span className="font-bold text-slate-500">Rekomendasi Kabid:</span>                         "{app?.notes_kabid || '—'}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => openReview(app)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      <FileSignature className="w-4 h-4" />
                      Tinjau & Otorisasi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* KARTU 2: Riwayat Keputusan Kadis */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 text-[#0F172A]">
            <CheckCircle2 className="w-4.5 h-4.5 text-slate-700" />
            <h2 className="font-bold text-sm sm:text-base">
              Riwayat Keputusan Kadis ( {safeHistoryApps.length} )
            </h2>
          </div>

          {historyLoading ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-3">
              <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-[#4F46E5] border-t-transparent" />
              <p className="font-medium">Memuat riwayat keputusan...</p>
            </div>
          ) : safeHistoryApps.length === 0 ? (
            /* Empty State Kartu 2 Presisi Sesuai Gambar Rujukan */
            <div className="py-14 px-4 text-center space-y-1.5">
              <p className="text-sm font-bold text-[#0F172A]">Belum ada riwayat keputusan.</p>
              <p className="text-xs text-slate-400">
                Keputusan yang sudah dikirim akan tercatat di sini.
              </p>
            </div>
          ) : (
            /* Itemized List Riwayat Keputusan */
            <div className="space-y-3">
              {safeHistoryApps.map((app, index) => (
                <div 
                  key={app?.id ?? index}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#0F172A] text-sm sm:text-base">{app?.user?.name || app?.name || '—'}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        app?.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {app?.status === 'rejected' ? 'Ditolak' : 'Disetujui'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                      <span>{app?.institution_name || '—'}</span>
                      <span>&bull;</span>
                      <span>{app?.division?.name || 'Aplikasi Informatika'}</span>
                    </div>
                  </div>

                  {app?.notes_kadis && (
                    <div className="text-xs text-slate-500 italic bg-white px-3 py-1.5 rounded-xl border border-slate-100">
                      "{app?.notes_kadis || '—'}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Modal Popup Review */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-100 space-y-5 max-h-[88vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Otorisasi Akhir Kepala Dinas</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calon Magang: <span className="font-semibold text-slate-700">{selectedApp?.user?.name || selectedApp?.name || '—'}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-700 space-y-2 leading-relaxed">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Institusi</span>
                  <span className="font-semibold text-slate-800">{selectedApp?.institution_name || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Jurusan</span>
                  <span className="font-semibold text-slate-800">{selectedApp?.major || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Periode Magang</span>
                  <span className="font-semibold text-slate-800">{selectedApp?.start_date || '—'} – {selectedApp?.end_date || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Bidang Penempatan</span>
                  <span className="font-semibold text-[#4F46E5]">{selectedApp?.division?.name || '—'}</span>
                </div>
              </div>

              {selectedApp?.notes_kabid && (
                <div className="pt-2 border-t border-slate-200/60 mt-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Rekomendasi Kabid</span>
                  <p className="text-slate-700 italic mt-0.5">"{selectedApp?.notes_kabid || '—'}"</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  await submitDecision('rejected');
                  fetchHistoryApps();
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer"
              >
                <XCircle className="h-4 w-4" />
                Tolak
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  await submitDecision('approved_by_kadis');
                  fetchActiveInterns();
                  fetchHistoryApps();
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] px-5 py-2 text-xs font-bold text-white transition shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                {submitting ? 'Memproses...' : 'Setujui & Otorisasi'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Popup Pemagang Aktif Dinas */}
      {isActiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-xl border border-slate-100 space-y-5 max-h-[88vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-lg sm:text-xl text-[#0F172A]">
                  Pemagang Aktif Dinas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {safeActiveInterns.length} pemagang aktif di dinas saat ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsActiveModalOpen(false);
                  setSearchTerm('');
                }}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama, institusi, atau bidang..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            {activeLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-3">
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-[#4F46E5] border-t-transparent" />
                <p className="font-medium">Memuat data pemagang aktif...</p>
              </div>
            ) : filteredInterns.length === 0 ? (
              <div className="py-16 px-4 text-center space-y-2">
                <p className="text-sm sm:text-base font-bold text-[#0F172A]">
                  {searchTerm ? 'Pemagang tidak ditemukan.' : 'Belum ada pemagang aktif.'}
                </p>
                <p className="text-xs text-slate-400">
                  {searchTerm 
                    ? 'Tidak ada data pemagang yang cocok dengan kata kunci pencarian.' 
                    : 'Data pemagang aktif dinas ini akan tampil di sini.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {filteredInterns.map((intern, index) => (
                  <div
                    key={intern?.id ?? index}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#0F172A] text-sm sm:text-base">
                          {intern?.user?.name || intern?.name || '—'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Aktif
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {intern?.institution_name || '—'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          {intern?.division?.name || 'Aplikasi Informatika'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {intern?.start_date || '—'} s/d {intern?.end_date || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}