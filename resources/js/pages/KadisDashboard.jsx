import React, { useEffect, useState } from 'react';
import useApplicationReviewDashboard from '../hooks/useApplicationReviewDashboard';
import { apiRequest, getToken } from '../api';
import {
  AlertCircle,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChartNoAxesCombined,
  ExternalLink,
  FileDown,
  FileSignature,
  FileText,
  Filter,
  GraduationCap,
  RotateCcw,
  Search,
  ShieldCheck,
  Users,
  X,
  XCircle,
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

const getInitials = (name = '') => name
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map((part) => part[0] || '')
  .join('')
  .toUpperCase() || '—';

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const Avatar = ({ name, tone = 'blue', size = 'h-10 w-10' }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    violet: 'bg-violet-100 text-violet-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
  };

  return (
    <span className={`grid ${size} shrink-0 place-items-center rounded-full text-xs font-extrabold ${colors[tone]}`}>
      {getInitials(name)}
    </span>
  );
};

const ProgressBar = ({ value, color = 'bg-blue-600' }) => {
  const progress = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${progress}%` }} />
    </div>
  );
};

const StatCard = ({ label, value, suffix, icon: Icon, tone = 'blue', children }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    violet: 'bg-violet-50 text-violet-700',
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
          {suffix && <p className="mt-1 text-[11px] text-slate-400">{suffix}</p>}
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${colors[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {children}
    </article>
  );
};

export default function KadisDashboard() {
  const {
    pendingApps, selectedApp, setSelectedApp, loading, submitting,
    msg, setMsg, openReview, submitDecision,
  } = useApplicationReviewDashboard({
    endpoint: '/applications/kadis',
    initialStatus: 'approved_by_kadis',
    initialNotes: 'Permohonan diotorisasi Kadis dan diteruskan kepada Kepegawaian untuk penerbitan surat.',
    successMessage: 'Persetujuan Kepala Dinas berhasil disimpan.',
    failureMessage: 'Gagal memproses persetujuan Kepala Dinas.',
  });

  const [activeInterns, setActiveInterns] = useState([]);
  const [activeInternsTotal, setActiveInternsTotal] = useState(0);
  const [activeLoading, setActiveLoading] = useState(false);
  const [isActiveModalOpen, setIsActiveModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [historyApps, setHistoryApps] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [decisionChoice, setDecisionChoice] = useState('approve');
  const [divisions, setDivisions] = useState([]);
  const [reportFilters, setReportFilters] = useState({ division_id: '', start_date: '', end_date: '' });
  const [appliedReportFilters, setAppliedReportFilters] = useState({});
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportDownloading, setReportDownloading] = useState(false);

  const safePendingApps = Array.isArray(pendingApps) ? pendingApps.filter(Boolean) : [];
  const safeActiveInterns = Array.isArray(activeInterns) ? activeInterns.filter(Boolean) : [];
  const safeHistoryApps = Array.isArray(historyApps) ? historyApps.filter(Boolean) : [];

  const fetchActiveInterns = async () => {
    setActiveLoading(true);
    try {
      const token = localStorage.getItem('token')
        || localStorage.getItem('auth_token')
        || localStorage.getItem('simagang_token');
      if (!token) {
        throw new Error('Token autentikasi tidak ditemukan. Silakan masuk kembali.');
      }

      const response = await fetch('/api/applications/active?per_page=100', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || `Gagal memuat pemagang aktif (HTTP ${response.status}).`);
      }

      const applications = extractApplications(data);
      setActiveInterns(applications);
      setActiveInternsTotal(Number(data?.data?.total ?? applications.length));
    } catch (error) {
      console.error('Gagal memuat daftar pemagang aktif:', error);
      setMsg({ type: 'error', text: error?.message || 'Gagal memuat daftar pemagang aktif.' });
    } finally {
      setActiveLoading(false);
    }
  };

  const fetchHistoryApps = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('token')
        || localStorage.getItem('auth_token')
        || localStorage.getItem('simagang_token');
      if (!token) {
        throw new Error('Token autentikasi tidak ditemukan. Silakan masuk kembali.');
      }

      const response = await fetch('/api/applications/history-kadis', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || `Gagal memuat riwayat keputusan (HTTP ${response.status}).`);
      }

      setHistoryApps(extractApplications(data));
    } catch (error) {
      console.error('Gagal memuat riwayat keputusan:', error);
      setMsg({ type: 'error', text: error?.message || 'Gagal memuat riwayat keputusan.' });
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

  const filteredInterns = safeActiveInterns.filter((app) => {
    const term = (searchTerm || '').trim().toLowerCase();
    if (!term) return true;
    const name = String(app?.user?.name || app?.name || '').toLowerCase();
    const institution = String(app?.institution_name || '').toLowerCase();
    const division = String(app?.division?.name || '').toLowerCase();
    const email = String(app?.user?.email || '').toLowerCase();
    return name.includes(term) || institution.includes(term) || division.includes(term) || email.includes(term);
  });

  const openAuthorization = (application) => {
    setDecisionChoice('approve');
    openReview(application);
  };

  const submitAuthorization = async () => {
    if (decisionChoice === 'reject') {
      await submitDecision('rejected');
      fetchHistoryApps();
      return;
    }
    await submitDecision('approved_by_kadis');
    fetchActiveInterns();
    fetchHistoryApps();
  };

  const closeAuthorization = () => {
    setSelectedApp(null);
    setDecisionChoice('approve');
  };

  return (
    <div className="min-h-screen bg-slate-50/80 font-sans text-slate-800">
      <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-7 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">
              <Building2 className="h-3.5 w-3.5" />
              Dinas Komunikasi dan Informatika
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Dashboard Kepala Dinas</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Otorisasi akhir permohonan magang dan pantau capaian pelaksanaan magang di seluruh bidang.
            </p>
          </div>
          {activeTab === 'dashboard' && (
            <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-[520px]">
              <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">Pemagang Aktif Dinas</p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{activeLoading ? '…' : activeInternsTotal}</p>
                    <button
                      type="button"
                      onClick={() => setIsActiveModalOpen(true)}
                      className="mt-1 text-xs font-bold text-blue-700 transition hover:text-blue-800"
                    >
                      Lihat daftar <span aria-hidden="true">→</span>
                    </button>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                </div>
              </article>
              <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">Menunggu Otorisasi Kadis</p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{safePendingApps.length}</p>
                    <p className="mt-1 text-[11px] text-slate-400">permohonan dalam antrean</p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
                    <FileSignature className="h-5 w-5" />
                  </span>
                </div>
              </article>
            </div>
          )}
        </section>

        <nav role="tablist" className="inline-flex max-w-full flex-wrap gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm" aria-label="Navigasi dashboard Kepala Dinas">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition sm:text-sm ${
              activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Otorisasi &amp; Pemagang Aktif
            {safePendingApps.length > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${activeTab === 'dashboard' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                {safePendingApps.length}
              </span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'report'}
            onClick={() => setActiveTab('report')}
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition sm:text-sm ${
              activeTab === 'report' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Laporan Eksekutif
          </button>
        </nav>

        {msg?.text && (
          <div className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-sm shadow-sm ${
            msg.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}>
            <div className="flex items-center gap-2.5">
              {msg.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />}
              <span className="font-medium">{msg.text || '—'}</span>
            </div>
            <button type="button" onClick={() => setMsg({ type: '', text: '' })} className="rounded-lg p-1 text-slate-500 transition hover:bg-black/5" aria-label="Tutup pemberitahuan">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {activeTab === 'report' ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 font-bold text-slate-900">
                    <Filter className="h-4 w-4 text-blue-600" />
                    Filter Laporan
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">Pilih bidang dan rentang periode yang ingin ditinjau.</p>
                </div>
                <button
                  type="button"
                  onClick={downloadExecutiveReport}
                  disabled={reportDownloading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FileDown className="h-4 w-4" />
                  {reportDownloading ? 'Menyiapkan PDF...' : 'Unduh Laporan PDF'}
                </button>
              </div>
              <form onSubmit={applyReportFilters} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_auto_auto]">
                <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                  Divisi/Bidang
                  <select
                    value={reportFilters.division_id}
                    onChange={(event) => setReportFilters((filters) => ({ ...filters, division_id: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Semua Bidang</option>
                    {divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}
                  </select>
                </label>
                <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                  Tanggal Mulai
                  <input
                    type="date"
                    value={reportFilters.start_date}
                    onChange={(event) => setReportFilters((filters) => ({ ...filters, start_date: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                  Tanggal Akhir
                  <input
                    type="date"
                    min={reportFilters.start_date || undefined}
                    value={reportFilters.end_date}
                    onChange={(event) => setReportFilters((filters) => ({ ...filters, end_date: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <button type="submit" className="inline-flex items-end justify-center gap-2 self-end rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700">
                  <Filter className="h-3.5 w-3.5" />
                  Terapkan Filter
                </button>
                <button type="button" onClick={resetReportFilters} className="inline-flex items-end justify-center gap-2 self-end rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              </form>
            </section>

            {reportLoading ? (
              <div className="space-y-6" aria-label="Memuat laporan eksekutif" aria-busy="true">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                      <div className="h-3 w-28 rounded bg-slate-200" />
                      <div className="mt-4 h-8 w-20 rounded bg-slate-200" />
                      <div className="mt-3 h-3 w-36 rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
                {[1, 2].map((item) => (
                  <section key={item} className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <div className="h-4 w-48 rounded bg-slate-200" />
                    <div className="mt-5 space-y-3">{[1, 2, 3, 4].map((row) => <div key={row} className="h-8 rounded bg-slate-100" />)}</div>
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
                  const attendance = summary.average_attendance_percentage == null
                    ? null
                    : Number(summary.average_attendance_percentage);
                  const stats = [
                    { label: 'Total Pendaftar', value: summary.total_applicants ?? 0, icon: Users, tone: 'blue', suffix: 'peserta terdaftar' },
                    { label: 'Peserta Diterima', value: summary.total_accepted ?? 0, icon: CheckCircle2, tone: 'emerald', suffix: `${summary.total_active ?? 0} peserta aktif` },
                    { label: 'Rata-rata Kehadiran', value: attendance == null ? '—' : `${attendance.toFixed(1)}%`, icon: ChartNoAxesCombined, tone: 'emerald', suffix: 'persentase kehadiran dinas', attendance },
                    { label: 'Tingkat Penyelesaian', value: `${completionRate.toFixed(1)}%`, icon: GraduationCap, tone: 'violet', suffix: `${completed} dari ${accepted} peserta diterima selesai` },
                  ];

                  return (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {stats.map(({ label, value, icon, tone, suffix, attendance: attendanceValue }) => (
                        <StatCard key={label} label={label} value={value} suffix={suffix} icon={icon} tone={tone}>
                          {label === 'Rata-rata Kehadiran' && (
                            <div className="mt-3">
                              <ProgressBar value={attendanceValue} color="bg-emerald-500" />
                            </div>
                          )}
                        </StatCard>
                      ))}
                    </div>
                  );
                })()}

                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                    <h2 className="flex items-center gap-2 font-bold text-slate-900">
                      <BriefcaseBusiness className="h-4 w-4 text-blue-600" />
                      Rekapitulasi Per Bidang
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">Ringkasan kuota, status peserta, dan rata-rata nilai akhir.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left text-xs">
                      <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-3.5 font-bold">Nama Bidang</th>
                          <th className="w-48 px-4 py-3.5 font-bold">Kuota</th>
                          <th className="px-4 py-3.5 text-right font-bold">Total Pendaftar</th>
                          <th className="px-4 py-3.5 text-right font-bold">Diterima</th>
                          <th className="px-4 py-3.5 text-right font-bold">Aktif</th>
                          <th className="px-4 py-3.5 text-right font-bold">Lulus</th>
                          <th className="px-5 py-3.5 text-right font-bold">Rata-rata Nilai</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(reportData.divisions || []).map((division) => {
                          const quota = Number(division.quota || 0);
                          const accepted = Number(division.total_accepted || 0);
                          const quotaUsage = quota > 0 ? Math.min(100, (accepted / quota) * 100) : 0;
                          return (
                            <tr key={division.division_id} className="text-slate-600 transition hover:bg-slate-50/70">
                              <td className="px-5 py-4 font-semibold text-slate-900">{division.division_name}</td>
                              <td className="px-4 py-4">
                                <div className="flex items-center justify-between gap-2 text-[11px]">
                                  <span className="font-bold text-slate-800">{accepted} / {division.quota ?? '—'}</span>
                                  <span className="text-slate-400">{quota > 0 ? `${quotaUsage.toFixed(0)}%` : '—'}</span>
                                </div>
                                <div className="mt-2"><ProgressBar value={quotaUsage} color="bg-blue-500" /></div>
                              </td>
                              <td className="px-4 py-4 text-right">{division.total_applicants ?? 0}</td>
                              <td className="px-4 py-4 text-right">{division.total_accepted ?? 0}</td>
                              <td className="px-4 py-4 text-right">{division.total_active ?? 0}</td>
                              <td className="px-4 py-4 text-right">{division.total_completed ?? 0}</td>
                              <td className="px-5 py-4 text-right">
                                <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-700">
                                  {division.average_final_score == null ? '—' : Number(division.average_final_score).toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {(!reportData.divisions || reportData.divisions.length === 0) && (
                          <tr><td colSpan="7" className="px-5 py-10 text-center text-slate-400">Tidak ada data bidang untuk filter ini.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                    <h2 className="flex items-center gap-2 font-bold text-slate-900">
                      <Users className="h-4 w-4 text-blue-600" />
                      Daftar Peserta Magang
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">{(reportData.participants || []).length} peserta sesuai filter aktif.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1120px] text-left text-xs">
                      <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-3.5 font-bold">Nama</th>
                          <th className="px-4 py-3.5 font-bold">Institusi</th>
                          <th className="px-4 py-3.5 font-bold">Bidang</th>
                          <th className="px-4 py-3.5 font-bold">Periode</th>
                          <th className="px-4 py-3.5 font-bold">Status</th>
                          <th className="w-40 px-4 py-3.5 font-bold">Kehadiran</th>
                          <th className="px-5 py-3.5 text-right font-bold">Nilai Akhir/Predikat</th>
                        </tr>
                      </thead>
                      {reportData.participants?.length > 0 ? (
                        <tbody className="divide-y divide-slate-100">
                          {reportData.participants.map((participant, index) => {
                            const completed = participant.internship_status === 'completed';
                            const attendance = participant.attendance_percentage == null ? null : Number(participant.attendance_percentage);
                            return (
                              <tr key={participant.application_id ?? index} className="text-slate-600 transition hover:bg-slate-50/70">
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar name={participant.participant_name} tone="violet" />
                                    <div>
                                      <p className="font-bold text-slate-900">{participant.participant_name || '—'}</p>
                                      <p className="mt-0.5 text-[11px] text-slate-400">{participant.major || 'Peserta magang'}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 font-medium text-slate-700">{participant.institution_name || '—'}</td>
                                <td className="px-4 py-4">
                                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">{participant.division_name || '—'}</span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-4 text-slate-500">{formatDate(participant.start_date)} – {formatDate(participant.end_date)}</td>
                                <td className="px-4 py-4">
                                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                    completed ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                                  }`}>
                                    {completed ? 'Selesai' : participant.internship_status === 'in_progress' ? 'Aktif' : participant.final_status || '—'}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-700">
                                    <span>{attendance == null ? '—' : `${attendance.toFixed(1)}%`}</span>
                                  </div>
                                  <div className="mt-2"><ProgressBar value={attendance} color="bg-emerald-500" /></div>
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <span className="font-bold text-slate-900">{participant.final_score == null ? '—' : Number(participant.final_score).toFixed(2)}</span>
                                  {participant.grade_letter && <span className="ml-1.5 text-slate-500">/ {participant.grade_letter}</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      ) : (
                        <tbody>
                          <tr>
                            <td colSpan="7" className="px-5 py-14 text-center">
                              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400"><Users className="h-5 w-5" /></span>
                              <p className="mt-3 font-bold text-slate-700">Belum ada data peserta</p>
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
        ) : (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="flex items-center gap-2 font-bold text-slate-900">
                  <FileSignature className="h-4 w-4 text-blue-600" />
                  Antrean Otorisasi Akhir
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">{safePendingApps.length}</span>
                </h2>
                <p className="mt-1 text-xs text-slate-500">Permohonan yang sudah melewati verifikasi Kepegawaian dan Kepala Bidang.</p>
              </div>
              {loading ? (
                <div className="p-12 text-center text-sm text-slate-400">
                  <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  Memuat antrean otorisasi...
                </div>
              ) : safePendingApps.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-7 w-7" />
                  </span>
                  <p className="mt-4 text-sm font-bold text-slate-900">Semua permohonan telah diotorisasi!</p>
                  <p className="mt-1 text-xs text-slate-400">Tidak ada berkas yang menunggu otorisasi Kepala Dinas saat ini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1180px] text-left text-xs">
                    <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3.5 font-bold">Nama Pemohon</th>
                        <th className="px-4 py-3.5 font-bold">Asal Institusi</th>
                        <th className="px-4 py-3.5 font-bold">Bidang Penempatan</th>
                        <th className="px-4 py-3.5 font-bold">Periode Magang</th>
                        <th className="px-4 py-3.5 font-bold">Rekomendasi Kabid &amp; Mentor</th>
                        <th className="px-5 py-3.5 text-right font-bold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {safePendingApps.map((app, index) => (
                        <tr key={app?.id ?? index} className="transition hover:bg-slate-50/70">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={app?.user?.name || app?.name} />
                              <div>
                                <p className="font-bold text-slate-900">{app?.user?.name || app?.name || '—'}</p>
                                <p className="mt-0.5 text-[11px] text-slate-400">{app?.user?.email || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-800">{app?.institution_name || '—'}</p>
                            <p className="mt-0.5 text-[11px] text-slate-400">{app?.major || '—'}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">{app?.division?.name || '—'}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600">
                              <CalendarDays className="h-3 w-3 text-slate-400" />
                              {formatDate(app?.start_date)} – {formatDate(app?.end_date)}
                            </span>
                          </td>
                          <td className="max-w-[270px] px-4 py-4">
                            <p className="line-clamp-2 leading-5 text-slate-500">{app?.notes_kabid || 'Tidak ada catatan rekomendasi.'}</p>
                            {app?.mentor?.name && (
                              <p className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-semibold text-violet-700">
                                <GraduationCap className="h-3.5 w-3.5" />
                                Mentor: {app.mentor.name}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => openAuthorization(app)}
                              className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-3.5 py-2.5 font-bold text-white shadow-sm transition hover:bg-blue-700"
                            >
                              <FileSignature className="h-4 w-4" />
                              Tinjau &amp; Otorisasi
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="flex items-center gap-2 font-bold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Riwayat Keputusan Kadis
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{safeHistoryApps.length}</span>
                </h2>
                <p className="mt-1 text-xs text-slate-500">Catatan keputusan akhir atas permohonan yang sudah diproses.</p>
              </div>
              {historyLoading ? (
                <p className="p-8 text-center text-sm text-slate-400">Memuat riwayat keputusan...</p>
              ) : safeHistoryApps.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm font-bold text-slate-800">Belum ada riwayat keputusan.</p>
                  <p className="mt-1 text-xs text-slate-400">Keputusan yang sudah dikirim akan tercatat di sini.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {safeHistoryApps.map((app, index) => {
                    const rejected = app?.status === 'rejected' || app?.status_kadis === 'rejected';
                    return (
                      <article key={app?.id ?? index} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
                        <div className="flex min-w-0 items-start gap-3">
                          <Avatar name={app?.user?.name || app?.name} tone={rejected ? 'amber' : 'emerald'} />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-slate-900">{app?.user?.name || app?.name || '—'}</h3>
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${rejected ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {rejected ? 'Ditolak' : 'Disetujui'}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{app?.institution_name || '—'} <span className="mx-1.5 text-slate-300">·</span> {app?.division?.name || '—'}</p>
                            <p className="mt-2 max-w-3xl text-xs italic leading-5 text-slate-500">“{app?.notes_kadis || 'Tidak ada catatan keputusan.'}”</p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-5">
          <section role="dialog" aria-modal="true" aria-labelledby="kadis-review-title" className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">Tahap akhir verifikasi</p>
                <h2 id="kadis-review-title" className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">Otorisasi Kepala Dinas</h2>
              </div>
              <button type="button" onClick={closeAuthorization} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup modal">
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="space-y-5 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <Avatar name={selectedApp?.user?.name || selectedApp?.name} />
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">{selectedApp?.user?.name || selectedApp?.name || '—'}</p>
                  <p className="truncate text-xs text-slate-500">{selectedApp?.user?.email || '—'}</p>
                </div>
              </div>

              <section className="rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
                <h3 className="mb-3 text-xs font-bold text-slate-900">Ringkasan Informasi Pemohon</h3>
                <div className="grid gap-x-6 gap-y-3 text-xs sm:grid-cols-2">
                  <div><p className="text-slate-400">Institusi</p><p className="mt-0.5 font-semibold text-slate-800">{selectedApp?.institution_name || '—'}</p></div>
                  <div><p className="text-slate-400">Jurusan</p><p className="mt-0.5 font-semibold text-slate-800">{selectedApp?.major || '—'}</p></div>
                  <div><p className="text-slate-400">Periode Magang</p><p className="mt-0.5 font-semibold text-slate-800">{formatDate(selectedApp?.start_date)} – {formatDate(selectedApp?.end_date)}</p></div>
                  <div><p className="text-slate-400">Bidang Penempatan</p><p className="mt-0.5 font-semibold text-slate-800">{selectedApp?.division?.name || '—'}</p></div>
                  <div><p className="text-slate-400">Mentor Penunjukan</p><p className="mt-0.5 font-semibold text-slate-800">{selectedApp?.mentor?.name || '—'}</p></div>
                </div>
                {selectedApp?.notes_kabid && (
                  <div className="mt-4 border-t border-slate-200 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Rekomendasi Kabid</p>
                    <p className="mt-1 text-xs italic leading-5 text-slate-600">“{selectedApp.notes_kabid}”</p>
                  </div>
                )}
                <div className="mt-4 border-t border-slate-200 pt-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Dokumen Pendukung</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ['Surat Pengantar', selectedApp?.cover_letter_path || selectedApp?.file_proposal],
                      ['CV', selectedApp?.file_cv],
                      ['Transkrip', selectedApp?.transcript_path || selectedApp?.file_recommendation_letter],
                      ['KTM', selectedApp?.student_card_path],
                    ].map(([label, path]) => (
                      path ? (
                        <a key={label} href={`/storage/${path}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-[10px] font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50">
                          <FileText className="h-3.5 w-3.5" />
                          {label}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span key={label} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-medium text-slate-400">{label} tidak tersedia</span>
                      )
                    ))}
                  </div>
                </div>
              </section>

              <fieldset>
                <legend className="mb-2.5 text-xs font-bold text-slate-800">Keputusan Otorisasi</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setDecisionChoice('approve')}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                      decisionChoice === 'approve' ? 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100' : 'border-slate-200 bg-white hover:bg-emerald-50/50'
                    }`}
                  >
                    <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${decisionChoice === 'approve' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>
                      <span className="block text-xs font-bold text-slate-900">Otorisasi &amp; Terbitkan Surat</span>
                      <span className="mt-1 block text-[11px] leading-4 text-slate-500">Teruskan permohonan disetujui ke Kepegawaian.</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionChoice('reject')}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                      decisionChoice === 'reject' ? 'border-rose-300 bg-rose-50 ring-2 ring-rose-100' : 'border-slate-200 bg-white hover:bg-rose-50/50'
                    }`}
                  >
                    <XCircle className={`mt-0.5 h-5 w-5 shrink-0 ${decisionChoice === 'reject' ? 'text-rose-600' : 'text-slate-400'}`} />
                    <span>
                      <span className="block text-xs font-bold text-slate-900">Tolak Permohonan</span>
                      <span className="mt-1 block text-[11px] leading-4 text-slate-500">Tolak pengajuan pada tahap otorisasi akhir.</span>
                    </span>
                  </button>
                </div>
              </fieldset>

              <footer className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={closeAuthorization} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50">Batal</button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={submitAuthorization}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    decisionChoice === 'reject' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {decisionChoice === 'reject' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  {submitting ? 'Memproses...' : 'Simpan Keputusan'}
                </button>
              </footer>
            </div>
          </section>
        </div>
      )}

      {isActiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-5">
          <section role="dialog" aria-modal="true" aria-labelledby="active-interns-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7">
            <header className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 id="active-interns-title" className="text-lg font-extrabold tracking-tight text-slate-900">Pemagang Aktif Dinas</h2>
                <p className="mt-1 text-xs text-slate-500">{activeInternsTotal} pemagang aktif di dinas saat ini.</p>
              </div>
              <button type="button" onClick={() => { setIsActiveModalOpen(false); setSearchTerm(''); }} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100" aria-label="Tutup daftar pemagang">
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari nama, institusi, atau bidang..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {activeLoading ? (
              <div className="py-12 text-center text-sm text-slate-400">
                <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                Memuat data pemagang aktif...
              </div>
            ) : filteredInterns.length === 0 ? (
              <div className="py-14 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400"><Users className="h-5 w-5" /></span>
                <p className="mt-3 font-bold text-slate-800">{searchTerm ? 'Pemagang tidak ditemukan.' : 'Belum ada pemagang aktif.'}</p>
                <p className="mt-1 text-xs text-slate-400">{searchTerm ? 'Tidak ada data yang cocok dengan kata kunci.' : 'Data pemagang aktif akan tampil di sini.'}</p>
              </div>
            ) : (
              <div className="mt-4 max-h-[55vh] space-y-2.5 overflow-y-auto pr-1">
                {filteredInterns.map((intern, index) => (
                  <article key={intern?.id ?? index} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4 transition hover:border-blue-100 hover:bg-slate-50/70">
                    <Avatar name={intern?.user?.name || intern?.name} tone="violet" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-900">{intern?.user?.name || intern?.name || '—'}</p>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Aktif</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{intern?.institution_name || '—'} <span className="mx-1 text-slate-300">·</span> {intern?.division?.name || '—'}</p>
                      <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                        <CalendarDays className="h-3.5 w-3.5" /> {formatDate(intern?.start_date)} – {formatDate(intern?.end_date)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
