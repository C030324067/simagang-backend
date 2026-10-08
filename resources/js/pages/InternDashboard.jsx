import React, { useState } from 'react';
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Clock3,
  Download,
  GraduationCap,
  Plus,
  Share2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useInternDashboard from '../hooks/useInternDashboard';
import InternAttendance from '../components/InternAttendance';

// Helper Format Tanggal (e.g. 22 Sep 2026)
const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

// Style Badges Status Tugas sesuai UI Referensi
const taskStatusStyle = {
  pending: { label: 'Belum Dikerjakan', style: 'bg-rose-50 text-rose-600 font-bold' },
  in_progress: { label: 'Dalam Proses', style: 'bg-amber-100/70 text-amber-800 font-bold' },
  revision_needed: { label: 'Perlu Revisi', style: 'bg-rose-100 text-rose-700 font-bold' },
  completed: { label: 'Selesai', style: 'bg-emerald-100/70 text-emerald-700 font-bold' },
};

export default function InternDashboard() {
  const { user } = useAuth();
  const {
    logbooks,
    attendance,
    attendanceDay,
    attendanceHistory,
    attendanceSummary,
    tasks,
    progressMetrics,
    application,
    evaluation,
    certificate,
    submitting,
    message,
    setMessage,
    isLogbookModalOpen,
    setIsLogbookModalOpen,
    isCheckInModalOpen,
    setIsCheckInModalOpen,
    selectedTask,
    setSelectedTask,
    taskSubmitError,
    setTaskSubmitError,
    logbookForm,
    setLogbookForm,
    taskForm,
    setTaskForm,
    downloadCertificate,
    loadDashboard,
    submitLogbook,
    submitTask,
    downloadTaskFile,
  } = useInternDashboard(user);

  const openTaskSubmission = (task) => {
    setSelectedTask(task);
    setTaskSubmitError('');
    setTaskForm({ submission_notes: task.submission_notes || '', submission_file: null });
  };

  // State Modal
  const [isAllActivitiesModalOpen, setIsAllActivitiesModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [certificateNotice, setCertificateNotice] = useState('');

  const userName = user?.name || 'Peserta Magang';
  const pendingTasksCount = tasks.filter((t) => t.status !== 'completed').length;

  const attendancePercent = Math.round(Number(attendanceSummary?.attendance_percentage || 0) * 100) / 100;
  const approvedLogbooks = logbooks.filter((item) => item.verification_status === 'approved').length;
  const applicationEndDate = application?.end_date ? new Date(`${String(application.end_date).slice(0, 10)}T23:59:59`) : null;
  const internshipCompleted = application?.internship_status === 'completed';
  const internshipPeriodEnded = applicationEndDate ? applicationEndDate < new Date() : false;
  const remainingDays = applicationEndDate && !internshipPeriodEnded
    ? Math.ceil((applicationEndDate.getTime() - new Date().getTime()) / 86400000)
    : 0;

  const certificateChecklist = [
    { title: 'Kehadiran minimum tercapai', description: `${attendancePercent}% kehadiran (acuan 80%)`, done: attendancePercent >= 80 },
    { title: 'Logbook kegiatan terverifikasi', description: `${approvedLogbooks} dari ${logbooks.length} logbook disetujui`, done: logbooks.length > 0 && approvedLogbooks === logbooks.length },
    { title: 'Status magang selesai', description: internshipCompleted ? 'Penilaian akhir pembimbing sudah disimpan' : internshipPeriodEnded ? 'Menunggu penilaian akhir pembimbing' : 'Program magang sedang berjalan', done: internshipCompleted },
    { title: 'Penilaian akhir oleh pembimbing', description: evaluation ? 'Penilaian telah diisi pembimbing' : 'Menunggu penilaian pembimbing', done: Boolean(evaluation) },
    ...(certificate?.is_eligible === false
      ? [{ title: 'Kelayakan sertifikat dikonfirmasi sistem', description: 'Sistem menyatakan masih ada syarat yang belum terpenuhi', done: false }]
      : []),
  ];
  const certificateProgress = Math.round((certificateChecklist.filter((item) => item.done).length / certificateChecklist.length) * 100);
  const isCertificateEligible = certificate?.is_eligible !== false && certificateChecklist.every((item) => item.done);
  const evaluationScore = Number(certificate?.intern?.evaluations?.[0]?.final_score ?? evaluation?.final_score);
  const certificateType = ['kelulusan', 'mengikuti'].includes(certificate?.certificate_type)
    ? certificate.certificate_type
    : evaluationScore >= 70 ? 'kelulusan' : 'mengikuti';
  const certificateTypeLabel = certificateType === 'kelulusan' ? 'SERTIFIKAT KELULUSAN' : 'SERTIFIKAT MENGIKUTI';
  const certificateTypeStyle = certificateType === 'kelulusan'
    ? 'bg-emerald-100 text-emerald-800'
    : 'bg-amber-100 text-amber-800';

  const handleCertificateClick = () => {
    setCertificateNotice('');
    setIsCertificateModalOpen(true);
  };

  const handleShareCertificate = async () => {
    if (!certificate?.qr_hash) {
      setCertificateNotice('Tautan verifikasi sertifikat belum tersedia.');
      return;
    }
    const verificationUrl = `${window.location.origin}/verify-cert/${encodeURIComponent(certificate.qr_hash)}`;
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCertificateNotice('Tautan verifikasi berhasil disalin.');
    } catch {
      setCertificateNotice(verificationUrl);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] font-sans text-slate-800 antialiased pb-12">
      
      {/* MAIN CONTAINER */}
      <main className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
        
        {/* NOTIFIKASI PESAN */}
        {message && (
          <div
            className={`flex items-center justify-between rounded-2xl p-4 text-xs font-medium shadow-xs border ${
              message.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* 1. HEADER PAGE & RINGKASAN TUGAS */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-1">
          <div className="space-y-1 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F2942]">
              Dashboard Peserta Magang
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              Pantau tugas dari pembimbing lapangan dan catat kegiatan harianmu selama magang di Diskominfo.
            </p>
          </div>

          {/* Kartu Tugas Belum Dikerjakan */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-xs text-center min-w-[220px] shrink-0 self-start md:self-auto">
            <span className="block text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
              TUGAS BELUM DIKERJAKAN
            </span>
            <b className="text-3xl sm:text-4xl font-extrabold text-[#4F46E5]">
              {pendingTasksCount}
            </b>
          </div>
        </section>

        {/* 2. DUA KARTU UTAMA (PRESENSI & SERTIFIKAT) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* CARD PRESENSI */}
          <div 
            onClick={() => {
              if (attendanceDay?.is_attendance_open) setIsCheckInModalOpen(true);
            }}
            className={`group flex items-center justify-between bg-white rounded-2xl p-5 border border-slate-100 shadow-xs transition ${
              attendanceDay?.is_attendance_open ? 'hover:shadow-md cursor-pointer' : 'cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[#4F46E5] shrink-0">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#0F2942] group-hover:text-[#4F46E5] transition-colors">
                  Presensi
                </h3>
                <p className={`text-xs font-medium mt-0.5 ${attendanceDay?.is_attendance_open ? 'text-slate-400' : 'text-amber-700'}`}>
                  {attendanceDay?.is_attendance_open
                    ? 'Lakukan presensi kehadiran selama kegiatan magang.'
                    : attendanceDay?.holiday_name || attendanceDay?.message || 'Memuat status hari kerja...'}
                </p>
              </div>
            </div>
            {attendanceDay?.is_attendance_open && (
              <ChevronRight className="h-5 w-5 text-[#4F46E5] transition-transform group-hover:translate-x-1 shrink-0" />
            )}
          </div>

          {/* CARD SERTIFIKAT */}
          <div 
            onClick={handleCertificateClick}
            className="group flex items-center justify-between bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#3B82F6] shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#0F2942] group-hover:text-[#3B82F6] transition-colors">
                  Sertifikat
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Unduh sertifikat setelah menyelesaikan magang.
                </p>
              </div>
            </div>
            {certificate?.pdf_path ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[#3B82F6]">
                <Download className="h-5 w-5" />
              </div>
            ) : (
              <ChevronRight className="h-5 w-5 text-[#3B82F6] transition-transform group-hover:translate-x-1 shrink-0" />
            )}
          </div>
        </div>

        {/* 3. GRID UTAMA (TUGAS & KEGIATAN MAGANG) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* TABEL KIRI: TUGAS PEMBIMBING LAPANGAN */}
          <section className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-[#4F46E5] shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0F2942]">Tugas Pembimbing Lapangan</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Daftar tugas yang diberikan oleh pembimbing lapangan.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAllActivitiesModalOpen(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer"
                >
                  Lihat Semua
                </button>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[11px]">
                      <th className="pb-3 pr-3 font-bold">Tanggal</th>
                      <th className="pb-3 px-3 font-bold">Judul Tugas</th>
                      <th className="pb-3 px-3 font-bold">Deskripsi</th>
                      <th className="pb-3 pl-3 font-bold">Status</th>
                      <th className="pb-3 pl-3 font-bold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-400">
                          Belum ada tugas dari pembimbing.
                        </td>
                      </tr>
                    ) : (
                      tasks.slice(0, 4).map((task) => {
                        const badge = taskStatusStyle[task.status] || taskStatusStyle.pending;
                        return (
                          <tr key={task.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5 pr-3 font-bold text-[#0F2942] whitespace-nowrap">
                              {formatDate(task.deadline)}
                            </td>
                            <td className="py-3.5 px-3 font-medium text-slate-800">
                              {task.title}
                            </td>
                            <td className="py-3.5 px-3 text-slate-500 max-w-[180px] truncate">
                              {task.description || '—'}
                            </td>
                            <td className="py-3.5 pl-3">
                              <span className={`inline-block rounded-full px-3 py-1 text-[11px] whitespace-nowrap ${badge.style}`}>
                                {task.status === 'completed' ? 'Telah Dikumpulkan' : badge.label}
                              </span>
                            </td>
                            <td className="py-3.5 pl-3">
                              {task.status === 'completed' ? (
                                <button
                                  type="button"
                                  disabled
                                  className="cursor-not-allowed rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700"
                                >
                                  Telah Dikumpulkan
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openTaskSubmission(task)}
                                  className="rounded-lg bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-[#4F46E5] transition hover:bg-indigo-100"
                                >
                                  {task.status === 'revision_needed' ? 'Perbaiki Tugas' : 'Detail / Upload'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* TABEL KANAN: KEGIATAN MAGANG */}
          <section className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#3B82F6] shrink-0">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0F2942]">Kegiatan Magang</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Catat kegiatan harian selama magang Anda.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsLogbookModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Tambah Kegiatan
                </button>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[11px]">
                      <th className="pb-3 pr-3 font-bold">Tanggal</th>
                      <th className="pb-3 px-3 font-bold">Kegiatan</th>
                      <th className="pb-3 px-3 font-bold">Kategori</th>
                      <th className="pb-3 pl-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logbooks.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-slate-400">
                          Belum ada kegiatan yang dicatat.
                        </td>
                      </tr>
                    ) : (
                      logbooks.slice(0, 4).map((log) => {
                        const isApproved = log.verification_status === 'approved';
                        return (
                          <tr key={log.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5 pr-3 font-bold text-[#0F2942] whitespace-nowrap">
                              {formatDate(log.date)}
                            </td>
                            <td className="py-3.5 px-3 font-medium text-slate-800 max-w-[200px] truncate">
                              {log.activity_description}
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold text-[#4F46E5] whitespace-nowrap">
                                {log.category || 'Pekerjaan'}
                              </span>
                            </td>
                            <td className="py-3.5 pl-3">
                              <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold whitespace-nowrap ${
                                isApproved 
                                  ? 'bg-emerald-100/70 text-emerald-700' 
                                  : 'bg-amber-100/70 text-amber-800'
                              }`}>
                                {isApproved ? 'Selesai' : 'Dalam Proses'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => setIsAllActivitiesModalOpen(true)} 
                className="inline-flex items-center gap-1 text-xs font-bold text-[#3B82F6] hover:underline cursor-pointer"
              >
                Lihat Semua Kegiatan <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>

        </div>

      </main>

      {/* MODAL SERTIFIKAT */}
      {isCertificateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs" onClick={() => setIsCertificateModalOpen(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="certificate-title" className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-50 text-[#4F46E5]"><GraduationCap className="h-5 w-5" /></div>
                <div><strong className="block text-sm text-slate-900">SIMAGANG</strong><span className="text-xs text-slate-400">Sertifikat Magang</span></div>
              </div>
              <button type="button" aria-label="Tutup" onClick={() => setIsCertificateModalOpen(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 transition"><X className="h-5 w-5" /></button>
            </header>

            <div className="overflow-y-auto p-6 sm:p-8">
              <div className="mb-5">
                <h2 id="certificate-title" className="text-xl font-bold text-[#0F2942]">Sertifikat Magang</h2>
                <p className="mt-1 text-xs text-slate-500">Pantau progres kelayakan dan unduh sertifikat setelah kegiatan magang selesai.</p>
              </div>

              {!isCertificateEligible ? (
                <div className="space-y-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
                  <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-900">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Sertifikat belum dapat diunduh karena syarat belum terpenuhi.</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-5">
                    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#4F46E5 ${certificateProgress}%, #E2E8F0 ${certificateProgress}% 100%)` }}>
                      <span className="grid h-16 w-16 place-items-center rounded-full bg-white text-sm font-bold text-[#0F2942]">{certificateProgress}%</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[#0F2942]">Sertifikat belum tersedia</h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">Sertifikat diterbitkan setelah penilaian akhir pembimbing selesai. {applicationEndDate && !internshipCompleted ? <>Sisa waktu magang: <strong className="text-slate-800">{remainingDays} hari</strong>.</> : null}</p>
                    </div>
                  </div>

                  <div className="grid gap-2.5">
                    {certificateChecklist.map((item) => (
                      <div key={item.title} className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white px-4 py-3">
                        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{item.done ? <Check className="h-4 w-4" /> : <Clock3 className="h-3.5 w-3.5" />}</span>
                        <div className="min-w-0 flex-1"><strong className="block text-xs text-[#0F2942]">{item.title}</strong><span className="text-[11px] text-slate-400">{item.description}</span></div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{item.done ? 'Selesai' : 'Menunggu'}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button type="button" disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2 text-xs font-bold text-white opacity-50"><Download className="h-4 w-4" />Unduh PDF</button>
                    <button type="button" disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 opacity-50"><Share2 className="h-4 w-4" />Bagikan</button>
                  </div>
                </div>
              ) : (
                <div className="grid items-start gap-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-xs lg:grid-cols-2">
                  <div className="relative flex aspect-[1.4/1] flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 p-6 text-center text-white">
                    <GraduationCap className="mb-2 h-8 w-8" />
                    <span className={`mb-2 rounded-full px-3 py-1 text-[10px] font-extrabold tracking-wide ${certificateTypeStyle}`}>{certificateTypeLabel}</span>
                    <h3 className="text-xs font-bold tracking-widest uppercase">SERTIFIKAT MAGANG</h3>
                    <strong className="mt-2 text-lg sm:text-xl font-extrabold">{userName}</strong>
                    <p className="mt-1 text-[11px] leading-relaxed text-white/80">Telah menyelesaikan program magang di Diskominfo</p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div><span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold tracking-wide ${certificateTypeStyle}`}>{certificateTypeLabel}</span></div>
                    <div className="space-y-2.5">
                      {[
                        ['Nama Peserta', userName],
                        ['Nomor Sertifikat', certificate?.certificate_number || '—'],
                        ['Periode Magang', `${application?.start_date ? formatDate(application.start_date) : '—'} – ${application?.end_date ? formatDate(application.end_date) : '—'}`],
                        ['Tanggal Terbit', certificate?.issued_at ? formatDate(certificate.issued_at) : '—'],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2"><span className="text-slate-400">{label}</span><strong className="text-[#0F2942]">{value}</strong></div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button type="button" onClick={downloadCertificate} className="inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2 text-xs font-bold text-white hover:bg-[#4338CA] transition"><Download className="h-4 w-4" />Unduh PDF</button>
                      <button type="button" onClick={handleShareCertificate} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"><Share2 className="h-4 w-4" />Bagikan</button>
                    </div>
                    {certificateNotice && <p className="text-xs text-indigo-600 font-medium">{certificateNotice}</p>}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* COMPONENT PRESENSI */}
      <InternAttendance open={isCheckInModalOpen} onClose={() => setIsCheckInModalOpen(false)} attendance={attendance} attendanceDay={attendanceDay} attendanceHistory={attendanceHistory} onUpdated={loadDashboard} />

      {/* MODAL TAMBAH KEGIATAN (SESUAI UI REFERENSI) */}
      {isLogbookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-lg font-bold text-[#0F2942]">Tambah Kegiatan</h3>
              <button 
                type="button" 
                onClick={() => setIsLogbookModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Modal */}
            <form onSubmit={submitLogbook} className="space-y-4 text-xs font-medium">
              {/* Field Tanggal */}
              <div>
                <label className="block text-slate-800 font-bold mb-1.5">Tanggal</label>
                <input
                  required
                  type="date"
                  value={logbookForm.date || ''}
                  onChange={(e) => setLogbookForm({ ...logbookForm, date: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition"
                />
              </div>

              {/* Field Kegiatan */}
              <div>
                <label className="block text-slate-800 font-bold mb-1.5">Kegiatan</label>
                <textarea
                  required
                  rows={4}
                  value={logbookForm.activity_description || ''}
                  onChange={(e) => setLogbookForm({ ...logbookForm, activity_description: e.target.value })}
                  placeholder="Tuliskan kegiatan yang dilakukan"
                  className="w-full rounded-2xl border border-slate-200 p-4 text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition resize-none"
                />
              </div>

              {/* Field Kategori */}
              <div>
                <label className="block text-slate-800 font-bold mb-1.5">Kategori</label>
                <div className="relative">
                  <select
                    value={logbookForm.category || 'Pekerjaan'}
                    onChange={(e) => setLogbookForm({ ...logbookForm, category: e.target.value })}
                    className="w-full appearance-none rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition bg-white pr-10"
                  >
                    <option value="Kegiatan">Kegiatan</option>
                    <option value="Pekerjaan">Pekerjaan</option>
                    <option value="Diskusi">Diskusi</option>
                    <option value="Pembelajaran">Pembelajaran</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsLogbookModalOpen(false)}
                  className="rounded-2xl bg-slate-100 hover:bg-slate-200 px-6 py-2.5 text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] px-6 py-2.5 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL / SUBMIT TUGAS */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-bold text-[#0F2942]">Detail & Pengumpulan Tugas</h3>
              <button onClick={() => { setSelectedTask(null); setTaskSubmitError(''); }} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitTask} className="space-y-4 p-6 text-xs">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1">
                <p className="font-bold text-[#0F2942]">{selectedTask.title}</p>
                <p className="text-slate-500">{selectedTask.description || 'Tidak ada deskripsi.'}</p>
              </div>
              {selectedTask.status === 'revision_needed' && selectedTask.catatan_revisi && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">
                  <p className="font-bold">Catatan Revisi dari Pembimbing</p>
                  <p className="mt-1 whitespace-pre-wrap">{selectedTask.catatan_revisi}</p>
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-700">Catatan Pengumpulan</label>
                <textarea
                  rows={2}
                  value={taskForm.submission_notes}
                  onChange={(e) => {
                    setTaskForm({ ...taskForm, submission_notes: e.target.value });
                    if (taskSubmitError) setTaskSubmitError('');
                  }}
                  placeholder="Tambah catatan..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="task-submission-file" className="block font-semibold text-slate-700">Berkas Hasil Tugas</label>
                <input
                  id="task-submission-file"
                  type="file"
                  onChange={(event) => {
                    setTaskForm({ ...taskForm, submission_file: event.target.files?.[0] || null });
                    if (taskSubmitError) setTaskSubmitError('');
                  }}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:font-semibold file:text-[#4F46E5] hover:file:bg-indigo-100"
                />
              </div>
              {taskSubmitError && (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                  {taskSubmitError}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setSelectedTask(null); setTaskSubmitError(''); }}
                  className="rounded-xl bg-slate-100 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] px-5 py-2 font-bold text-white transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Mengirim...' : 'Kirim Tugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SEMUA AKTIVITAS */}
      {isAllActivitiesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="font-bold text-[#0F2942]">Daftar Seluruh Aktivitas Magang</h3>
                <p className="text-xs text-slate-400">Riwayat lengkap seluruh jurnal dan kegiatan harian Anda.</p>
              </div>
              <button onClick={() => setIsAllActivitiesModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[11px]">
                    <th className="pb-3 pr-3 font-bold">Tanggal</th>
                    <th className="pb-3 px-3 font-bold">Kegiatan</th>
                    <th className="pb-3 px-3 font-bold">Kategori</th>
                    <th className="pb-3 pl-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logbooks.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-400">Belum ada kegiatan yang dicatat.</td>
                    </tr>
                  ) : (
                    logbooks.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 pr-3 font-bold text-[#0F2942] whitespace-nowrap">{formatDate(log.date)}</td>
                        <td className="py-3.5 px-3 font-medium text-slate-800">{log.activity_description}</td>
                        <td className="py-3.5 px-3"><span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold text-[#4F46E5]">{log.category || 'Pekerjaan'}</span></td>
                        <td className="py-3.5 pl-3"><span className="inline-block rounded-full bg-emerald-100/70 px-3 py-1 text-[11px] font-bold text-emerald-700">Selesai</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end border-t border-slate-100 px-6 py-3">
              <button
                type="button"
                onClick={() => setIsAllActivitiesModalOpen(false)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}