import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  FileDown,
  FileText,
  Filter,
  GraduationCap,
  NotebookPen,
  ShieldCheck,
  Star,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, downloadAcceptanceLetter, getToken } from '../api';
import useApplicationReviewDashboard from '../hooks/useApplicationReviewDashboard';
import useInternshipPeriodStatus from '../hooks/useInternshipPeriodStatus';

const extractList = (response) => {
  const candidates = [response, response?.data, response?.data?.data, response?.data?.data?.data];
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

const Avatar = ({ name, tone = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    violet: 'bg-violet-100 text-violet-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
  };

  return (
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-extrabold ${colors[tone]}`}>
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

const KPI = ({ label, value, detail, icon: Icon, tone = 'blue', children }) => {
  const styles = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <article className="min-w-[190px] flex-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
        </div>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${styles[tone]}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      {children || <p className="mt-1 text-[11px] text-slate-400">{detail}</p>}
    </article>
  );
};

export default function KabidDashboard() {
  const { user } = useAuth();
  const {
    pendingApps, selectedApp, setSelectedApp, actionForm, setActionForm, loading, submitting,
    msg, setMsg, openReview, handleActionSubmit,
  } = useApplicationReviewDashboard({
    endpoint: '/applications/kabid',
    decisionEndpoint: '/applications/{application}/approve-kabid',
    initialStatus: 'approved',
    initialNotes: 'Kandidat memiliki kualifikasi teknis yang relevan dengan kegiatan bidang.',
    successMessage: 'Verifikasi teknis bidang berhasil disimpan.',
    failureMessage: 'Gagal memproses verifikasi.',
  });

  const [modalErr, setModalErr] = useState('');
  const [mentors, setMentors] = useState([]);
  const [mentorsLoading, setMentorsLoading] = useState(false);
  const [acceptedApps, setAcceptedApps] = useState([]);
  const [historyApps, setHistoryApps] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [activeTab, setActiveTab] = useState('review');
  const [reportFilters, setReportFilters] = useState({ start_date: '', end_date: '', status: '' });
  const [appliedReportFilters, setAppliedReportFilters] = useState({});
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportDownloading, setReportDownloading] = useState(false);
  const { period, error: quotaError } = useInternshipPeriodStatus();
  const quota = period?.divisions?.find((division) => Number(division.id) === Number(user?.division_id));

  const safePendingApps = Array.isArray(pendingApps) ? pendingApps.filter(Boolean) : [];
  const safeAcceptedApps = Array.isArray(acceptedApps) ? acceptedApps.filter(Boolean) : [];
  const safeHistoryApps = Array.isArray(historyApps) ? historyApps.filter(Boolean) : [];
  const decisionHistory = useMemo(
    () => safeHistoryApps.filter((app) => ['approved', 'rejected'].includes(app.status_kabid)),
    [safeHistoryApps],
  );

  useEffect(() => {
    let active = true;
    apiRequest('/kabid/interns?per_page=100').then((response) => {
      if (!active) return;
      if (response.success) {
        setAcceptedApps(extractList(response));
      } else {
        setMsg({ type: 'error', text: response.message || 'Daftar peserta aktif bidang gagal dimuat.' });
      }
    }).catch((error) => {
      if (active) setMsg({ type: 'error', text: error.message || 'Daftar peserta aktif bidang gagal dimuat.' });
    });

    apiRequest('/applications/history-kabid').then((response) => {
      if (!active) return;
      if (response.success) {
        setHistoryApps(extractList(response));
      } else {
        setMsg({ type: 'error', text: response.message || 'Riwayat keputusan bidang gagal dimuat.' });
      }
    }).catch((error) => {
      if (active) setMsg({ type: 'error', text: error.message || 'Riwayat keputusan bidang gagal dimuat.' });
    }).finally(() => {
      if (active) setHistoryLoading(false);
    });
    setHistoryLoading(true);

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedApp) {
      setMentors([]);
      return undefined;
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

  useEffect(() => {
    if (activeTab !== 'report') return undefined;

    let active = true;
    const query = new URLSearchParams(
      Object.entries(appliedReportFilters).filter(([, value]) => value !== '' && value != null),
    ).toString();
    setReportLoading(true);
    apiRequest(`/kabid/report${query ? `?${query}` : ''}`).then((response) => {
      if (!active) return;
      if (response.ok || response.success) {
        setReportData(response.data);
      } else {
        setMsg({ type: 'error', text: response.message || 'Rekap bidang gagal dimuat.' });
      }
    }).finally(() => {
      if (active) setReportLoading(false);
    });

    return () => {
      active = false;
    };
  }, [activeTab, appliedReportFilters]);

  const quotaMax = Number(quota?.max_quota ?? quota?.monthly_quota ?? quota?.quota ?? 0);
  const quotaRemaining = Math.max(0, Number(quota?.remaining_quota ?? quotaMax));
  const quotaUsed = Math.max(0, quotaMax - quotaRemaining);
  const quotaProgress = quotaMax > 0 ? Math.min(100, (quotaUsed / quotaMax) * 100) : 0;
  const reportSummary = reportData?.summary || {};
  const participants = reportData?.participants || [];

  const onSubmitHandler = (event) => {
    event.preventDefault();
    if (!actionForm.status) {
      setModalErr('Pilih keputusan terlebih dahulu: Setujui atau Tolak Calon.');
      return;
    }
    if (actionForm.status === 'rejected' && !actionForm.notes?.trim()) {
      setModalErr('Mohon isi alasan penolakan pada catatan pertimbangan teknis.');
      return;
    }
    if (actionForm.status === 'approved' && !actionForm.mentor_id) {
      setModalErr('Pilih Pembimbing Lapangan sebelum menyetujui permohonan.');
      return;
    }
    setModalErr('');
    handleActionSubmit(event);
  };

  const printAcceptanceLetter = async (applicationId) => {
    setDownloadingId(applicationId);
    const response = await downloadAcceptanceLetter(applicationId);
    setMsg({ type: response.success ? 'success' : 'error', text: response.message });
    setDownloadingId(null);
  };

  const applyReportFilters = (event) => {
    event.preventDefault();
    setAppliedReportFilters({
      ...(reportFilters.start_date ? { start_date: reportFilters.start_date } : {}),
      ...(reportFilters.end_date ? { end_date: reportFilters.end_date } : {}),
      ...(reportFilters.status ? { status: reportFilters.status } : {}),
    });
  };

  const downloadReport = async () => {
    setReportDownloading(true);
    try {
      const query = new URLSearchParams(
        Object.entries(appliedReportFilters).filter(([, value]) => value !== '' && value != null),
      ).toString();
      const token = getToken();
      if (!token) throw new Error('Token autentikasi tidak ditemukan. Silakan masuk kembali.');

      const response = await fetch(`/api/kabid/report/export-pdf${query ? `?${query}` : ''}`, {
        headers: {
          Accept: 'application/pdf, application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Rekap PDF gagal diunduh (HTTP ${response.status}).`);
      }

      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      const disposition = response.headers.get('Content-Disposition') || '';
      link.href = objectUrl;
      link.download = disposition.match(/filename="?([^";]+)"?/i)?.[1] || 'rekap-bidang-magang.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      setMsg({ type: 'success', text: 'Rekap bidang berhasil diunduh.' });
    } catch (error) {
      setMsg({ type: 'error', text: error.message || 'Rekap PDF gagal diunduh.' });
    } finally {
      setReportDownloading(false);
    }
  };

  const closeReview = () => {
    setSelectedApp(null);
    setModalErr('');
  };

  return (
    <div className="min-h-screen bg-slate-50/80 font-sans text-slate-800">
      <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-7 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              {user?.division?.name || 'Bidang Anda'}
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              Dashboard Kepala Bidang
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Kelola tinjauan teknis, penunjukan mentor, serta pantau perkembangan peserta magang di bidang Anda.
            </p>
            {quotaError && <p role="status" className="mt-2 text-xs text-rose-600">{quotaError}</p>}
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-[750px]">
            <KPI
              label="Sisa Kuota Bidang"
              value={`${quotaUsed}/${quotaMax || '—'}`}
              icon={Users}
              tone="blue"
            >
              <div className="mt-2.5">
                <ProgressBar value={quotaProgress} />
                <p className="mt-1.5 text-[11px] text-slate-400">{quotaRemaining} kuota masih tersedia</p>
              </div>
            </KPI>
            <KPI label="Menunggu Tinjauan Teknis" value={safePendingApps.length} detail="pengajuan masuk" icon={Clock3} tone="amber" />
            <KPI label="Pemagang Aktif Bidang" value={safeAcceptedApps.length} detail="peserta sedang magang" icon={GraduationCap} tone="emerald" />
          </div>
        </section>

        <nav className="inline-flex max-w-full flex-wrap gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm" role="tablist" aria-label="Navigasi dashboard bidang">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'review'}
            onClick={() => setActiveTab('review')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition sm:text-sm ${
              activeTab === 'review' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Tinjauan Teknis &amp; Mentor
            <span className={`rounded-full px-2 py-0.5 text-[10px] ${activeTab === 'review' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
              {safePendingApps.length}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'report'}
            onClick={() => setActiveTab('report')}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition sm:text-sm ${
              activeTab === 'report' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Pemantauan &amp; Rekapitulasi Bidang
          </button>
        </nav>

        {msg?.text && (
          <div className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-sm shadow-sm ${
            msg.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}>
            <div className="flex items-center gap-2.5">
              {msg.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />}
              <span className="font-medium">{msg.text}</span>
            </div>
            <button type="button" onClick={() => setMsg({ type: '', text: '' })} className="rounded-lg p-1 text-slate-500 hover:bg-black/5" aria-label="Tutup pemberitahuan">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {activeTab === 'review' ? (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="flex items-center gap-2 font-bold text-slate-900">
                  <Clock3 className="h-4 w-4 text-blue-600" />
                  Antrean Tinjauan Teknis
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">{safePendingApps.length}</span>
                </h2>
                <p className="text-xs text-slate-500">Permohonan yang sudah melewati verifikasi kepegawaian.</p>
              </div>
              {loading ? (
                <div className="p-12 text-center text-sm text-slate-400">
                  <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  Memuat antrean permohonan...
                </div>
              ) : safePendingApps.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
                  <p className="mt-3 text-sm font-bold text-slate-800">Semua permohonan sudah ditinjau</p>
                  <p className="mt-1 text-xs text-slate-400">Belum ada pengajuan baru yang menunggu tinjauan bidang.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1080px] text-left text-xs">
                    <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3.5 font-bold">Nama Pemohon</th>
                        <th className="px-4 py-3.5 font-bold">Asal Institusi</th>
                        <th className="px-4 py-3.5 font-bold">Bidang</th>
                        <th className="px-4 py-3.5 font-bold">Periode</th>
                        <th className="px-4 py-3.5 font-bold">Catatan Kepegawaian</th>
                        <th className="px-5 py-3.5 text-right font-bold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {safePendingApps.map((app) => (
                        <tr key={app.id} className="text-slate-600 transition hover:bg-slate-50/70">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={app.user?.name} />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900">{app.user?.name || '—'}</p>
                                <p className="mt-0.5 text-[11px] text-slate-400">{app.user?.email || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-800">{app.institution_name || '—'}</p>
                            <p className="mt-0.5 text-[11px] text-slate-400">{app.major || '—'}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">{app.division?.name || user?.division?.name || '—'}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600">
                              <CalendarDays className="h-3 w-3 text-slate-400" />
                              {formatDate(app.start_date)} – {formatDate(app.end_date)}
                            </span>
                          </td>
                          <td className="max-w-[230px] px-4 py-4 leading-5 text-slate-500">{app.notes_kepegawaian || 'Berkas diteruskan ke peninjauan bidang.'}</td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setModalErr('');
                                openReview(app);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2.5 font-bold text-white shadow-sm transition hover:bg-blue-700"
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

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="flex items-center gap-2 font-bold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Riwayat Keputusan Bidang
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{decisionHistory.length}</span>
                </h2>
                <p className="mt-1 text-xs text-slate-500">Catatan pertimbangan teknis atas permohonan yang telah diproses.</p>
              </div>
              {historyLoading ? (
                <p className="p-8 text-center text-sm text-slate-400">Memuat riwayat keputusan...</p>
              ) : decisionHistory.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-slate-400">Belum ada riwayat keputusan bidang.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {decisionHistory.map((app) => {
                    const rejected = app.status_kabid === 'rejected';
                    return (
                      <article key={app.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
                        <div className="flex min-w-0 items-start gap-3">
                          <Avatar name={app.user?.name} tone={rejected ? 'amber' : 'emerald'} />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-slate-900">{app.user?.name || '—'}</h3>
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${rejected ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {rejected ? 'Ditolak' : 'Disetujui'}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{app.institution_name || '—'} · {app.division?.name || user?.division?.name || 'Bidang'}</p>
                            <p className="mt-2 max-w-3xl text-xs italic leading-5 text-slate-500">“{app.notes_kabid || 'Tidak ada catatan pertimbangan teknis.'}”</p>
                          </div>
                        </div>
                        {app.kabid_decided_at && <time className="shrink-0 text-[11px] text-slate-400">{formatDate(String(app.kabid_decided_at).slice(0, 10))}</time>}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {safeAcceptedApps.length > 0 && (
              <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <h2 className="font-bold text-slate-900">Peserta Aktif Bidang</h2>
                    <p className="mt-1 text-xs text-slate-500">{safeAcceptedApps.length} peserta sedang menjalani magang.</p>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {safeAcceptedApps.map((app) => (
                    <div key={app.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div className="flex items-center gap-3">
                        <Avatar name={app.user?.name} tone="violet" />
                        <div>
                          <p className="font-bold text-slate-900">{app.user?.name || '—'}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{app.institution_name} · {app.division?.name || 'Bidang'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={downloadingId === app.id}
                        onClick={() => printAcceptanceLetter(app.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 px-3.5 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
                      >
                        <FileText className="h-4 w-4" />
                        {downloadingId === app.id ? 'Menyiapkan PDF...' : 'Cetak Surat Balasan'}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 font-bold text-slate-900">
                    <Filter className="h-4 w-4 text-blue-600" />
                    Filter Laporan
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">Data otomatis dibatasi untuk {user?.division?.name || 'bidang Anda'}.</p>
                </div>
                <button
                  type="button"
                  onClick={downloadReport}
                  disabled={reportDownloading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <FileDown className="h-4 w-4" />
                  {reportDownloading ? 'Menyiapkan PDF...' : 'Unduh Rekap PDF'}
                </button>
              </div>
              <form onSubmit={applyReportFilters} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
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
                <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                  Status Peserta
                  <select
                    value={reportFilters.status}
                    onChange={(event) => setReportFilters((filters) => ({ ...filters, status: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Semua Status</option>
                    <option value="active">Aktif</option>
                    <option value="completed">Selesai</option>
                  </select>
                </label>
                <div className="flex items-end">
                  <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700">
                    <Filter className="h-3.5 w-3.5" />
                    Terapkan Filter
                  </button>
                </div>
              </form>
            </section>

            {reportLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Memuat rekap bidang" aria-busy="true">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <div className="h-3 w-28 rounded bg-slate-200" />
                    <div className="mt-4 h-8 w-20 rounded bg-slate-200" />
                    <div className="mt-3 h-3 w-36 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : reportData && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <KPI label="Total Peserta Bidang" value={reportSummary.total_accepted ?? 0} detail="peserta diterima di bidang" icon={Users} tone="blue" />
                  <KPI
                    label="Rata-rata Kehadiran"
                    value={reportSummary.average_attendance_percentage == null ? '—' : `${Number(reportSummary.average_attendance_percentage).toFixed(1)}%`}
                    icon={BarChart3}
                    tone="emerald"
                  >
                    <div className="mt-2.5">
                      <ProgressBar value={reportSummary.average_attendance_percentage} color="bg-emerald-500" />
                      <p className="mt-1.5 text-[11px] text-slate-400">rata-rata kehadiran peserta</p>
                    </div>
                  </KPI>
                  <KPI label="Logbook Tervalidasi" value={reportSummary.total_validated_logbooks ?? 0} detail="catatan aktivitas tervalidasi" icon={NotebookPen} tone="amber" />
                  <KPI
                    label="Rata-rata Nilai Akhir"
                    value={reportSummary.average_final_score == null ? '—' : Number(reportSummary.average_final_score).toFixed(2)}
                    detail="dari evaluasi peserta"
                    icon={Star}
                    tone="blue"
                  />
                </div>

                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                    <h2 className="flex items-center gap-2 font-bold text-slate-900">
                      <ClipboardCheck className="h-4 w-4 text-blue-600" />
                      Daftar Peserta
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">{participants.length} peserta sesuai filter aktif.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1120px] text-left text-xs">
                      <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-3.5 font-bold">Nama Peserta</th>
                          <th className="px-4 py-3.5 font-bold">Institusi</th>
                          <th className="px-4 py-3.5 font-bold">Mentor</th>
                          <th className="px-4 py-3.5 font-bold">Kehadiran</th>
                          <th className="px-4 py-3.5 font-bold">Logbook</th>
                          <th className="px-4 py-3.5 font-bold">Status</th>
                          <th className="px-5 py-3.5 text-right font-bold">Nilai Akhir</th>
                        </tr>
                      </thead>
                      {participants.length > 0 ? (
                        <tbody className="divide-y divide-slate-100">
                          {participants.map((participant, index) => {
                            const attendance = participant.attendance_percentage == null ? null : Number(participant.attendance_percentage);
                            const logbookProgress = participant.logbook_percentage == null ? null : Number(participant.logbook_percentage);
                            const completed = participant.internship_status === 'completed';
                            return (
                              <tr key={participant.application_id || index} className="text-slate-600 transition hover:bg-slate-50/70">
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar name={participant.participant_name} tone="violet" />
                                    <div>
                                      <p className="font-bold text-slate-900">{participant.participant_name || '—'}</p>
                                      <p className="mt-0.5 text-[11px] text-slate-400">{participant.major || '—'}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 font-medium text-slate-700">{participant.institution_name || '—'}</td>
                                <td className="px-4 py-4">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1.5 text-[10px] font-bold text-violet-700">
                                    <GraduationCap className="h-3.5 w-3.5" />
                                    {participant.mentor_name || 'Belum ditentukan'}
                                  </span>
                                </td>
                                <td className="w-40 px-4 py-4">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-slate-700">{attendance == null ? '—' : `${attendance.toFixed(1)}%`}</span>
                                  </div>
                                  <div className="mt-2"><ProgressBar value={attendance} color="bg-emerald-500" /></div>
                                </td>
                                <td className="w-40 px-4 py-4">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-slate-700">{logbookProgress == null ? '—' : `${logbookProgress.toFixed(1)}%`}</span>
                                    <span className="text-[10px] text-slate-400">{participant.validated_logbooks ?? 0}/{participant.total_logbooks ?? 0}</span>
                                  </div>
                                  <div className="mt-2"><ProgressBar value={logbookProgress} /></div>
                                </td>
                                <td className="px-4 py-4">
                                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${completed ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                                    {completed ? 'Selesai' : 'Aktif'}
                                  </span>
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
                              <Users className="mx-auto h-8 w-8 text-slate-300" />
                              <p className="mt-3 font-bold text-slate-700">Belum ada data peserta</p>
                              <p className="mt-1 text-xs text-slate-400">Coba sesuaikan tanggal atau status peserta.</p>
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
      </main>

      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-5" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeReview();
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="review-modal-title" className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">Verifikasi teknis</p>
                <h2 id="review-modal-title" className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">Verifikasi Teknis &amp; Penunjukan Mentor</h2>
              </div>
              <button type="button" onClick={closeReview} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup modal">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="space-y-5 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <Avatar name={selectedApp.user?.name} />
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">{selectedApp.user?.name || '—'}</p>
                  <p className="truncate text-xs text-slate-500">{selectedApp.user?.email || '—'}</p>
                </div>
              </div>

              <section className="rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
                <h3 className="mb-3 text-xs font-bold text-slate-900">Ringkasan Pengajuan</h3>
                <div className="grid gap-x-6 gap-y-3 text-xs sm:grid-cols-2">
                  <div><p className="text-slate-400">Institusi</p><p className="mt-0.5 font-semibold text-slate-800">{selectedApp.institution_name || '—'}</p></div>
                  <div><p className="text-slate-400">Jurusan</p><p className="mt-0.5 font-semibold text-slate-800">{selectedApp.major || '—'}</p></div>
                  <div><p className="text-slate-400">Periode Magang</p><p className="mt-0.5 font-semibold text-slate-800">{formatDate(selectedApp.start_date)} – {formatDate(selectedApp.end_date)}</p></div>
                  <div><p className="text-slate-400">Bidang Penempatan</p><p className="mt-0.5 font-semibold text-slate-800">{selectedApp.division?.name || '—'}</p></div>
                </div>
                <div className="mt-4 border-t border-slate-200 pt-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Dokumen Pendukung</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ['Surat Pengantar', selectedApp.cover_letter_path || selectedApp.file_proposal],
                      ['CV', selectedApp.file_cv],
                      ['Transkrip', selectedApp.transcript_path || selectedApp.file_recommendation_letter],
                      ['KTM', selectedApp.student_card_path],
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

              <form onSubmit={onSubmitHandler} className="space-y-5">
                <fieldset>
                  <legend className="mb-2.5 text-xs font-bold text-slate-800">Keputusan Teknis</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setActionForm({ ...actionForm, status: 'approved' })}
                      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                        actionForm.status === 'approved' ? 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${actionForm.status === 'approved' ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span>
                        <span className="block text-xs font-bold text-slate-900">Setujui &amp; Teruskan ke Kadis</span>
                        <span className="mt-1 block text-[11px] leading-4 text-slate-500">Lanjutkan proses dan tetapkan pembimbing.</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionForm({ ...actionForm, status: 'rejected', mentor_id: '' })}
                      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                        actionForm.status === 'rejected' ? 'border-rose-300 bg-rose-50 ring-2 ring-rose-100' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <XCircle className={`mt-0.5 h-5 w-5 shrink-0 ${actionForm.status === 'rejected' ? 'text-rose-600' : 'text-slate-400'}`} />
                      <span>
                        <span className="block text-xs font-bold text-slate-900">Tolak Calon</span>
                        <span className="mt-1 block text-[11px] leading-4 text-slate-500">Akhiri proses pengajuan dengan alasan yang jelas.</span>
                      </span>
                    </button>
                  </div>
                </fieldset>

                {actionForm.status === 'approved' ? (
                  <div className="space-y-2">
                    <label htmlFor="mentor_id" className="block text-xs font-bold text-slate-800">Pilih Pembimbing Lapangan / Mentor <span className="text-rose-600">*</span></label>
                    <select
                      id="mentor_id"
                      required
                      value={actionForm.mentor_id || ''}
                      onChange={(event) => setActionForm({ ...actionForm, mentor_id: event.target.value })}
                      disabled={mentorsLoading || mentors.length === 0}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                    >
                      <option value="">{mentorsLoading ? 'Memuat pembimbing...' : 'Pilih pembimbing bidang'}</option>
                      {mentors.map((mentor) => (
                        <option key={mentor.id} value={mentor.id}>
                          {mentor.name} · {mentor.role === 'kabid' ? 'Kepala Bidang' : 'Mentor'} · {mentor.active_intern_count ?? 0} pemagang dibimbing
                        </option>
                      ))}
                    </select>
                    {mentors.length === 0 && !mentorsLoading && <p className="text-xs font-medium text-rose-600">Tidak ada pembimbing aktif yang tersedia di bidang ini.</p>}
                  </div>
                ) : actionForm.status === 'rejected' ? (
                  <div className="flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>Alasan penolakan wajib diisi pada catatan pertimbangan teknis di bawah.</p>
                  </div>
                ) : null}

                <div>
                  <label htmlFor="fCatatan" className="mb-2 block text-xs font-bold text-slate-800">
                    Catatan Pertimbangan Teknis {actionForm.status === 'rejected' && <span className="text-rose-600">*</span>}
                  </label>
                  <textarea
                    id="fCatatan"
                    rows="4"
                    required={actionForm.status === 'rejected'}
                    value={actionForm.notes || ''}
                    onChange={(event) => setActionForm({ ...actionForm, notes: event.target.value })}
                    placeholder="Tuliskan pertimbangan teknis atau alasan penolakan..."
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {modalErr && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">{modalErr}</p>}
                <footer className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                  <button type="button" onClick={closeReview} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50">Batal</button>
                  <button
                    type="submit"
                    disabled={submitting || mentorsLoading || (actionForm.status === 'approved' && !actionForm.mentor_id)}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? 'Menyimpan keputusan...' : 'Simpan Keputusan'}
                  </button>
                </footer>
              </form>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
