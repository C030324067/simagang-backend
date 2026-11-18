import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import useApplicationReviewDashboard from '../hooks/useApplicationReviewDashboard';
import { apiRequest, getToken } from '../api';
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
  Search,
  FileDown,
  Filter,
  RotateCcw,
  Users,
  GraduationCap,
  ChartNoAxesCombined
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

  const [activeTab, setActiveTab] = useState('dashboard');
  const [divisions, setDivisions] = useState([]);
  const [reportFilters, setReportFilters] = useState({ division_id: '', start_date: '', end_date: '' });
  const [appliedReportFilters, setAppliedReportFilters] = useState({});
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportDownloading, setReportDownloading] = useState(false);

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

  useEffect(() => {
    let active = true;
    apiRequest('/divisions').then((response) => {
      if (!active) return;
      if (response.ok || response.success) {
        const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setDivisions(data);
      } else {
        setMsg({ type: 'error', text: response.message || 'Daftar bidang gagal dimuat.' });
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'report') return undefined;

    let active = true;
    const query = new URLSearchParams(
      Object.entries(appliedReportFilters).filter(([, value]) => value !== '' && value != null),
    ).toString();
    setReportLoading(true);
    apiRequest(`/kadis/executive-report${query ? `?${query}` : ''}`).then((response) => {
      if (!active) return;
      if (response.ok || response.success) {
        setReportData(response.data);
      } else {
        setMsg({ type: 'error', text: response.message || 'Laporan eksekutif gagal dimuat.' });
      }
    }).finally(() => {
      if (active) setReportLoading(false);
    });

    return () => {
      active = false;
    };
  }, [activeTab, appliedReportFilters]);

  const applyReportFilters = (event) => {
    event.preventDefault();
    setAppliedReportFilters({
      ...(reportFilters.division_id ? { division_id: reportFilters.division_id } : {}),
      ...(reportFilters.start_date ? { start_date: reportFilters.start_date } : {}),
      ...(reportFilters.end_date ? { end_date: reportFilters.end_date } : {}),
    });
  };

  const resetReportFilters = () => {
    setReportFilters({ division_id: '', start_date: '', end_date: '' });
    setAppliedReportFilters({});
  };

  const downloadExecutiveReport = async () => {
    setReportDownloading(true);
    try {
      const query = new URLSearchParams(
        Object.entries(appliedReportFilters).filter(([, value]) => value !== '' && value != null),
      ).toString();
      const token = getToken();
      if (!token) throw new Error('Token autentikasi tidak ditemukan. Silakan masuk kembali.');

      const response = await fetch(`/api/kadis/executive-report/export-pdf${query ? `?${query}` : ''}`, {
        headers: {
          Accept: 'application/pdf, application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Laporan PDF gagal diunduh (HTTP ${response.status}).`);
      }

      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      const disposition = response.headers.get('Content-Disposition') || '';
      link.href = objectUrl;
      link.download = disposition.match(/filename="?([^";]+)"?/i)?.[1] || 'laporan-eksekutif-magang.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      setMsg({ type: 'success', text: 'Laporan eksekutif berhasil diunduh.' });
    } catch (error) {
      setMsg({ type: 'error', text: error.message || 'Laporan PDF gagal diunduh.' });
    } finally {
      setReportDownloading(false);
    }
  };

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
              {activeTab === 'report' ? 'Laporan Eksekutif' : 'Dashboard Kepala Dinas'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {activeTab === 'report'
                ? 'Pantau ringkasan pelaksanaan magang, capaian per bidang, dan data peserta berdasarkan periode yang dipilih.'
                : 'Berikan tanda tangan otorisasi digital akhir untuk menerbitkan Surat Resmi Penerimaan Magang bagi pemohon yang telah disetujui Kepegawaian dan Kabid.'}
            </p>
          </div>

          {/* Stat Cards Container Header (Ukuran Identik Presisi) */}
          {activeTab === 'dashboard' && <div className="flex items-center gap-4 shrink-0 self-start md:self-auto flex-wrap sm:flex-nowrap">
            
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

          </div>}
        </section>

        <nav role="tablist" className="flex w-full gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs sm:w-fit" aria-label="Navigasi dashboard Kepala Dinas">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition sm:text-sm ${
              activeTab === 'dashboard' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Otorisasi & Pemagang Aktif
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'report'}
            onClick={() => setActiveTab('report')}
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition sm:text-sm ${
              activeTab === 'report' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Laporan Eksekutif
          </button>
        </nav>

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

        {activeTab === 'report' && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <Filter className="h-4 w-4 text-[#2563EB]" />
                    Filter Laporan
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">Pilih bidang dan periode magang yang ingin ditinjau.</p>
                </div>
                <button
                  type="button"
                  onClick={downloadExecutiveReport}
                  disabled={reportDownloading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FileDown className="h-4 w-4" />
                  {reportDownloading ? 'Menyiapkan PDF...' : 'Unduh Laporan PDF'}
                </button>
              </div>

              <form onSubmit={applyReportFilters} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                  Divisi/Bidang
                  <select
                    value={reportFilters.division_id}
                    onChange={(event) => setReportFilters((filters) => ({ ...filters, division_id: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-700 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Semua Bidang</option>
                    {divisions.map((division) => (
                      <option key={division.id} value={division.id}>{division.name}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                  Tanggal Mulai
                  <input
                    type="date"
                    value={reportFilters.start_date}
                    onChange={(event) => setReportFilters((filters) => ({ ...filters, start_date: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-700 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                  Tanggal Akhir
                  <input
                    type="date"
                    min={reportFilters.start_date || undefined}
                    value={reportFilters.end_date}
                    onChange={(event) => setReportFilters((filters) => ({ ...filters, end_date: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-700 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <div className="flex items-end gap-2">
                  <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700">
                    <Filter className="h-3.5 w-3.5" />
                    Terapkan Filter
                  </button>
                  <button type="button" onClick={resetReportFilters} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50" aria-label="Reset filter">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </button>
                </div>
              </form>
            </section>

            {reportLoading ? (
              <div className="space-y-6" aria-label="Memuat laporan eksekutif" aria-busy="true">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="animate-pulse rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
                      <div className="h-3 w-28 rounded bg-slate-200" />
                      <div className="mt-4 h-8 w-20 rounded bg-slate-200" />
                      <div className="mt-3 h-3 w-36 rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
                {[7, 7].map((columns, tableIndex) => (
                  <section key={tableIndex} className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
                    <div className="h-4 w-48 rounded bg-slate-200" />
                    <div className="mt-5 space-y-3">
                      {[1, 2, 3, 4].map((row) => (
                        <div key={row} className="flex gap-4">
                          {Array.from({ length: columns }, (_, column) => (
                            <div key={column} className="h-8 flex-1 rounded bg-slate-100" />
                          ))}
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : reportData && (
              <>
                {(() => {
                  const summary = reportData.summary || {};
                  const accepted = Number(summary.total_accepted || 0);
                  const completed = Number(summary.total_completed || 0);
                  const completionRate = accepted ? (completed / accepted) * 100 : 0;
                  const kpis = [
                    { label: 'Total Pendaftar', value: summary.total_applicants ?? 0, icon: Users, suffix: 'peserta terdaftar' },
                    { label: 'Peserta Diterima', value: summary.total_accepted ?? 0, icon: CheckCircle2, suffix: `${summary.total_active ?? 0} peserta aktif` },
                    { label: 'Rata-rata Kehadiran', value: summary.average_attendance_percentage == null ? '—' : `${Number(summary.average_attendance_percentage).toFixed(1)}%`, icon: ChartNoAxesCombined, suffix: 'persentase kehadiran dinas' },
                    { label: 'Tingkat Penyelesaian', value: `${completionRate.toFixed(1)}%`, icon: GraduationCap, suffix: `${completed} dari ${accepted} peserta diterima selesai` },
                  ];

                  return (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {kpis.map(({ label, value, icon: Icon, suffix }) => (
                        <article key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold text-slate-500">{label}</p>
                              <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
                              <p className="mt-1 text-[11px] text-slate-400">{suffix}</p>
                            </div>
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#2563EB]">
                              <Icon className="h-5 w-5" />
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  );
                })()}

                <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
                  <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                    <h2 className="font-bold text-slate-900">Rekapitulasi Per Bidang</h2>
                    <p className="mt-1 text-xs text-slate-500">Ringkasan kuota, status peserta, dan nilai akhir rata-rata.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-3 font-bold">Nama Bidang</th>
                          <th className="px-4 py-3 text-right font-bold">Kuota</th>
                          <th className="px-4 py-3 text-right font-bold">Total Pendaftar</th>
                          <th className="px-4 py-3 text-right font-bold">Diterima</th>
                          <th className="px-4 py-3 text-right font-bold">Aktif</th>
                          <th className="px-4 py-3 text-right font-bold">Lulus</th>
                          <th className="px-5 py-3 text-right font-bold">Rata-rata Nilai</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(reportData.divisions || []).map((division) => (
                          <tr key={division.division_id} className="text-slate-700 hover:bg-slate-50/70">
                            <td className="px-5 py-3.5 font-semibold text-slate-900">{division.division_name}</td>
                            <td className="px-4 py-3.5 text-right">{division.quota ?? '—'}</td>
                            <td className="px-4 py-3.5 text-right">{division.total_applicants ?? 0}</td>
                            <td className="px-4 py-3.5 text-right">{division.total_accepted ?? 0}</td>
                            <td className="px-4 py-3.5 text-right">{division.total_active ?? 0}</td>
                            <td className="px-4 py-3.5 text-right">{division.total_completed ?? 0}</td>
                            <td className="px-5 py-3.5 text-right">{division.average_final_score == null ? '—' : Number(division.average_final_score).toFixed(2)}</td>
                          </tr>
                        ))}
                        {(!reportData.divisions || reportData.divisions.length === 0) && (
                          <tr><td colSpan="7" className="px-5 py-10 text-center text-slate-400">Tidak ada data bidang untuk filter ini.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
                  <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                    <h2 className="font-bold text-slate-900">Daftar Peserta Magang</h2>
                    <p className="mt-1 text-xs text-slate-500">{(reportData.participants || []).length} peserta sesuai filter aktif.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-3 font-bold">Nama</th>
                          <th className="px-4 py-3 font-bold">Institusi</th>
                          <th className="px-4 py-3 font-bold">Bidang</th>
                          <th className="px-4 py-3 font-bold">Periode</th>
                          <th className="px-4 py-3 font-bold">Status</th>
                          <th className="px-4 py-3 text-right font-bold">Kehadiran</th>
                          <th className="px-5 py-3 text-right font-bold">Nilai Akhir/Predikat</th>
                        </tr>
                      </thead>
                      {reportData.participants?.length > 0 ? (
                        <tbody className="divide-y divide-slate-100">
                          {reportData.participants.map((participant) => (
                            <tr key={participant.application_id} className="text-slate-600 hover:bg-slate-50/70">
                              <td className="px-5 py-3.5 font-semibold text-slate-900">{participant.participant_name || '—'}</td>
                              <td className="px-4 py-3.5">{participant.institution_name || '—'}</td>
                              <td className="px-4 py-3.5">{participant.division_name || '—'}</td>
                              <td className="px-4 py-3.5 whitespace-nowrap">{participant.start_date || '—'} – {participant.end_date || '—'}</td>
                              <td className="px-4 py-3.5">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                  participant.internship_status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : participant.internship_status === 'in_progress'
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {participant.internship_status === 'completed' ? 'Selesai' : participant.internship_status === 'in_progress' ? 'Aktif' : participant.final_status || '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right">{participant.attendance_percentage == null ? '—' : `${Number(participant.attendance_percentage).toFixed(1)}%`}</td>
                              <td className="px-5 py-3.5 text-right font-semibold text-slate-800">
                                {participant.final_score ?? '—'}{participant.grade_letter ? ` / ${participant.grade_letter}` : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      ) : (
                        <tbody>
                          <tr>
                            <td colSpan="7" className="px-5 py-14 text-center">
                              <Users className="mx-auto h-8 w-8 text-slate-300" />
                              <p className="mt-3 text-sm font-bold text-slate-700">Belum ada data peserta</p>
                              <p className="mt-1 text-xs text-slate-400">Sesuaikan filter bidang atau periode untuk melihat laporan.</p>
                            </td>
                          </tr>
                        </tbody>
                      )}
                    </table>
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && <>
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
                  className="p-4 md:p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
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
                  className="p-4 md:p-5 rounded-2xl border border-slate-100 bg-slate-50/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
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
        </>}

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
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                    className="p-4 md:p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
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
