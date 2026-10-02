import React from 'react';
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
  ExternalLink
} from 'lucide-react';

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

          {/* Menunggu Otorisasi Kadis Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs text-center min-w-[240px] shrink-0 self-start md:self-auto">
            <span className="block text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
              MENUNGGU OTORISASI KADIS
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

        {/* Queue Section Card */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 text-[#0F172A]">
            <Clock className="w-4 h-4 text-slate-700" />
            <h2 className="font-bold text-sm sm:text-base">
              Antrean Otorisasi Akhir ( {pendingApps.length} )
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-3">
              <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-[#4F46E5] border-t-transparent" />
              <p className="font-medium">Memuat antrean otorisasi...</p>
            </div>
          ) : pendingApps.length === 0 ? (
            /* Empty State matching reference UI exactly */
            <div className="py-16 px-4 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-sm font-bold text-[#0F172A]">Semua permohonan telah diotorisasi!</p>
              <p className="text-xs text-slate-400">
                Tidak ada berkas yang menunggu tanda tangan otorisasi Kepala Dinas saat ini.
              </p>
            </div>
          ) : (
            /* Itemized Queue List */
            <div className="space-y-3">
              {pendingApps.map((app) => (
                <div 
                  key={app.id} 
                  className="p-4 sm:p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#0F172A] text-sm sm:text-base">{app.user?.name}</span>
                      <span className="text-xs text-slate-400 font-normal">&middot; ID: #{app.id}</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {app.institution_name}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        {app.division?.name || 'Aplikasi Informatika'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {app.start_date} s/d {app.end_date}
                      </span>
                    </div>

                    {app.notes_kabid && (
                      <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 inline-block font-medium">
                        <span className="font-bold text-slate-500">Rekomendasi Kabid:</span> "{app.notes_kabid}"
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

      </main>

      {/* Review Modal Popup */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-100 space-y-5 max-h-[88vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Otorisasi Akhir Kepala Dinas</h3>
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

            {/* Applicant Details Card */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-700 space-y-2 leading-relaxed">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Institusi</span>
                  <span className="font-semibold text-slate-800">{selectedApp.institution_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Jurusan</span>
                  <span className="font-semibold text-slate-800">{selectedApp.major || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Periode Magang</span>
                  <span className="font-semibold text-slate-800">{selectedApp.start_date} – {selectedApp.end_date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Bidang Penempatan</span>
                  <span className="font-semibold text-[#4F46E5]">{selectedApp.division?.name || '—'}</span>
                </div>
              </div>

              {selectedApp.notes_kabid && (
                <div className="pt-2 border-t border-slate-200/60 mt-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Rekomendasi Kabid</span>
                  <p className="text-slate-700 italic mt-0.5">"{selectedApp.notes_kabid}"</p>
                </div>
              )}
            </div>

            {/* Decision Buttons */}
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
                onClick={() => submitDecision('rejected')}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer"
              >
                <XCircle className="h-4 w-4" />
                Tolak
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => submitDecision('approved_by_kadis')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] px-5 py-2 text-xs font-bold text-white transition shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                {submitting ? 'Memproses...' : 'Setujui & Otorisasi'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}