import React from 'react';
import useKepegawaianDashboard from '../hooks/useKepegawaianDashboard';
import { downloadAcceptanceLetter } from '../api';
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
    pendingApps, approvedApps, acceptedApps, letterFiles, setLetterFiles, letterNumbers, setLetterNumbers, divisions, selectedApp, setSelectedApp,
    actionForm, setActionForm, loading, submitting, msg, setMsg, uploadLetter, openDocument, handleActionSubmit
  } = useKepegawaianDashboard();
  const [downloadingId, setDownloadingId] = React.useState(null);

  const printAcceptanceLetter = async (applicationId) => {
    setDownloadingId(applicationId);
    const response = await downloadAcceptanceLetter(applicationId);
    setMsg({ type: response.success ? 'success' : 'error', text: response.message });
    setDownloadingId(null);
  };

  return (
    <div className="min-h-screen bg-[#F2F6FA] font-sans text-slate-800 py-8">
      
      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">

        {/* Header Banner & Counter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F2942] tracking-tight">
              Dashboard Verifikasi Kepegawaian Diskominfo
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Verifikasi kelengkapan berkas administrasi pemohon magang (Mandiri & Rekomendasi Kampus), periksa kuota dinas, dan tentukan bidang penempatan.
            </p>
          </div>

          {/* Counter Box Right */}
          <div className="bg-white px-6 py-5 rounded-2xl border border-slate-100 shadow-xs min-w-[210px] flex flex-col justify-center items-center self-start md:self-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              MENUNGGU VERIFIKASI
            </span>
            <div className="text-4xl font-black text-[#4F46E5] text-center mt-1">
              {pendingApps.length}
            </div>
          </div>
        </div>

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
              <span className="font-semibold">{msg.text}</span>
            </div>
            <button 
              onClick={() => setMsg({ type: '', text: '' })} 
              className="p-1 rounded-lg hover:bg-black/5 text-slate-500 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Section 1: Antrean Permohonan Masuk */}
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
            <div className="overflow-x-auto">
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

        {/* Section 2: Persetujuan Kadis — unggah surat resmi */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-5 h-5 text-[#0F2942]" />
            <h3 className="font-bold text-[#0F2942] text-base sm:text-lg">
              Persetujuan Kadis — unggah surat resmi ( {approvedApps.length} )
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {approvedApps.map((app) => (
              <div key={app.id} className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 transition px-2 rounded-xl">
                
                {/* Info Pemohon & Pilih File */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-8">
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

                  {/* Nomor Surat Resmi */}
                  <input
                    type="text"
                    value={letterNumbers[app.id] || ''}
                    onChange={(event) => setLetterNumbers((previous) => ({ ...previous, [app.id]: event.target.value }))}
                    placeholder="Masukkan Nomor Surat Resmi"
                    aria-label={`Nomor surat resmi untuk ${app.user?.name || 'pemohon'}`}
                    className="w-full sm:w-56 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20"
                  />

                  {/* Pilih File Button & File Name */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <input 
                      type="file" 
                      accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                      id={`file-upload-${app.id}`}
                      onChange={(e) => setLetterFiles((prev) => ({ ...prev, [app.id]: e.target.files?.[0] || null }))} 
                      className="sr-only"
                    />
                    <label 
                      htmlFor={`file-upload-${app.id}`}
                      className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/80 bg-[#F0F4F9] hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>Pilih File</span>
                    </label>
                    <span className="text-xs text-slate-400 truncate max-w-[180px]">
                      {letterFiles[app.id] ? letterFiles[app.id].name : 'Tidak ada file yang dipilih'}
                    </span>
                  </div>
                </div>

                {/* Action Submit Button */}
                <button 
                  disabled={submitting || !letterFiles[app.id] || !letterNumbers[app.id]?.trim()}
                  onClick={() => uploadLetter(app.id)} 
                  className="px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs transition disabled:opacity-50 shadow-xs cursor-pointer whitespace-nowrap self-start lg:self-auto"
                >
                  Unggah & Terima
                </button>
              </div>
            ))}

            {!loading && approvedApps.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                Belum ada permohonan yang menunggu surat resmi.
              </div>
            )}
          </div>
        </section>

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
                <div key={app.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                <div className="grid grid-cols-2 gap-3">
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