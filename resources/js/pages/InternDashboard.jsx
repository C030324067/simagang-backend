import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  LogIn,
  LogOut,
  Plus,
  Upload,
  X,
} from 'lucide-react';
import { apiRequest, getToken } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatLocalTime, formatWitaDateTime } from '../utils/dateFormatter';
import { getGrade } from '../utils/evaluation';

const getCollection = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  return response?.data?.data || [];
};

const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!value) return '—';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('id-ID', options).format(date);
};

const formatTime = formatLocalTime;

const getGreeting = (date) => {
  const hour = Number(new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hourCycle: 'h23',
    timeZone: 'Asia/Makassar',
  }).format(date));

  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
};

const taskStatus = {
  todo: { label: 'Belum dimulai', style: 'bg-slate-100 text-slate-600' },
  in_progress: { label: 'IN PROGRESS', style: 'bg-sky-50 text-sky-700' },
  completed: { label: 'Selesai', style: 'bg-emerald-50 text-emerald-700' },
};

function StatusBadge({ status }) {
  const approved = status === 'approved';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
      {approved ? 'Disetujui' : 'Menunggu'}
    </span>
  );
}

export default function InternDashboard() {
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());
  const [attendance, setAttendance] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [logbooks, setLogbooks] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [isLogbookModalOpen, setIsLogbookModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [checkInPhoto, setCheckInPhoto] = useState(null);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [logbookForm, setLogbookForm] = useState({ date: '', activity_description: '', attachment: null });
  const [taskForm, setTaskForm] = useState({ submission_notes: '', submission_file: null });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const [attendanceResponse, taskResponse, logbookResponse, evaluationResponse, certificateResponse, applicationResponse] = await Promise.all([
      apiRequest('/attendances/today'),
      apiRequest('/tasks'),
      apiRequest('/logbooks'),
      apiRequest('/evaluations'),
      apiRequest('/certificates/my-certificate'),
      apiRequest('/applications/my-application'),
    ]);

    if (attendanceResponse.success) setAttendance(attendanceResponse.data || null);
    if (taskResponse.success) setTasks(getCollection(taskResponse));
    if (logbookResponse.success) setLogbooks(getCollection(logbookResponse));
    if (evaluationResponse.success) setEvaluation(getCollection(evaluationResponse)[0] || null);
    if (certificateResponse.success) setCertificate(certificateResponse.data || null);
    if (applicationResponse.success) setApplication(applicationResponse.data || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
    const clockTimer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(clockTimer);
  }, [loadDashboard]);

  const notify = (text, type = 'success') => {
    setMessage({ text, type });
    window.setTimeout(() => setMessage(null), 4000);
  };

  const activeTasks = useMemo(() => tasks.filter((task) => task.status !== 'completed'), [tasks]);
  const greeting = getGreeting(now);
  const institution = application?.institution_name || 'Institusi belum diatur';
  const division = application?.division?.name || user?.division?.name || 'Bidang belum ditetapkan';
  const checkedInAt = formatTime(attendance?.check_in_time);
  const checkedOutAt = formatTime(attendance?.check_out_time);
  const grade = getGrade(evaluation?.final_score);

  const handleAttendance = async (action) => {
    setSubmitting(true);
    const response = await apiRequest(`/attendances/${action === 'check-in' ? 'check-in' : 'check-out'}`, { method: 'POST' });
    notify(response.message || (response.success ? 'Presensi berhasil dicatat.' : 'Presensi gagal dicatat.'), response.success ? 'success' : 'error');
    if (response.success) await loadDashboard();
    setSubmitting(false);
  };

  const submitCheckIn = async (event) => {
    event.preventDefault();
    if (!checkInPhoto) {
      notify('Ambil atau pilih foto bukti kehadiran terlebih dahulu.', 'error');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(checkInPhoto.type) || checkInPhoto.size > 5 * 1024 * 1024) {
      notify('Foto harus JPG, PNG, atau WEBP dengan ukuran maksimal 5 MB.', 'error');
      return;
    }

    setSubmitting(true);
    const payload = new FormData();
    payload.append('photo', checkInPhoto);
    if (checkInNotes.trim()) payload.append('notes', checkInNotes.trim());
    const response = await apiRequest('/attendances/check-in', { method: 'POST', body: payload });
    notify(response.message || (response.success ? 'Presensi masuk berhasil dicatat.' : 'Presensi gagal dicatat.'), response.success ? 'success' : 'error');
    if (response.success) {
      setIsCheckInModalOpen(false);
      setCheckInPhoto(null);
      setCheckInNotes('');
      await loadDashboard();
    }
    setSubmitting(false);
  };

  const submitLogbook = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    const payload = new FormData();
    payload.append('date', logbookForm.date);
    payload.append('activity_description', logbookForm.activity_description);
    if (logbookForm.attachment) payload.append('attachment', logbookForm.attachment);

    const response = await apiRequest('/logbooks', { method: 'POST', body: payload });
    notify(response.message || (response.success ? 'Logbook berhasil dikirim.' : 'Logbook gagal dikirim.'), response.success ? 'success' : 'error');
    if (response.success) {
      setIsLogbookModalOpen(false);
      setLogbookForm({ date: '', activity_description: '', attachment: null });
      await loadDashboard();
    }
    setSubmitting(false);
  };

  const submitTask = async (event) => {
    event.preventDefault();
    if (!selectedTask) return;
    setSubmitting(true);
    const payload = new FormData();
    payload.append('status', 'completed');
    payload.append('submission_notes', taskForm.submission_notes);
    if (taskForm.submission_file) payload.append('submission_file', taskForm.submission_file);

    const response = await apiRequest(`/tasks/${selectedTask.id}/status`, { method: 'PUT', body: payload });
    notify(response.message || (response.success ? 'Tugas berhasil dikumpulkan.' : 'Tugas gagal dikumpulkan.'), response.success ? 'success' : 'error');
    if (response.success) {
      setSelectedTask(null);
      setTaskForm({ submission_notes: '', submission_file: null });
      await loadDashboard();
    }
    setSubmitting(false);
  };

  const downloadCertificate = async () => {
    if (!certificate?.pdf_path) return;
    const response = await fetch(`/storage/${certificate.pdf_path}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!response.ok) {
      notify('Sertifikat belum dapat diunduh.', 'error');
      return;
    }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sertifikat-magang.pdf';
    link.click();
    URL.revokeObjectURL(url);
  };

  const cardClass = 'rounded-xl border border-slate-100 bg-white shadow-sm';
  const sectionTitle = 'text-xs font-bold tracking-wider text-slate-400 uppercase';

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-12 font-sans text-slate-800 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-7xl space-y-6 py-6 md:py-8">
        <header className={`${cardClass} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6`}>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {greeting}, {user?.name || 'Mahasiswa'} <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">{institution} <span className="px-1">•</span> Bidang {division}</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Status: Aktif Magang
          </span>
        </header>

        {message && (
          <div role="status" className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${message.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {message.type === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <section className={`${cardClass} p-5 sm:p-6 md:col-span-2`}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className={sectionTitle}>Presensi Hari Ini</h2>
              <CalendarDays className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-4xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-5xl">
                  {formatWitaDateTime(now, { hour: '2-digit', minute: '2-digit' })}
                  <span className="ml-2 text-base font-semibold text-slate-400">WITA</span>
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Makassar' }).format(now)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {checkedInAt ? (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> In: {checkedInAt} WITA
                  </span>
                ) : (
                  <button onClick={() => setIsCheckInModalOpen(true)} disabled={submitting || loading} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60">
                    <LogIn className="h-4 w-4" /> Check-In
                  </button>
                )}
                {checkedInAt && (
                  <button onClick={() => handleAttendance('check-out')} disabled={submitting || loading || Boolean(checkedOutAt)} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">
                    {checkedOutAt ? <Check className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
                    {checkedOutAt ? `Out: ${checkedOutAt} WITA` : 'Check-Out'}
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className={`${cardClass} flex flex-col p-5 sm:p-6`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className={sectionTitle}>Tugas dari Mentor</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{activeTasks.length} aktif</span>
            </div>
            <div className="flex-1 space-y-3">
              {loading ? <p className="text-sm text-slate-400">Memuat tugas…</p> : activeTasks.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Belum ada tugas aktif dari mentor.</p>
              ) : activeTasks.slice(0, 3).map((task) => {
                const badge = taskStatus[task.status] || taskStatus.todo;
                return (
                  <button key={task.id} onClick={() => setSelectedTask(task)} className="w-full rounded-xl border border-slate-100 p-4 text-left transition hover:border-sky-200 hover:bg-sky-50/50">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${badge.style}`}>{badge.label}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Clock3 className="h-3.5 w-3.5" /> Deadline {formatDate(task.deadline)}</span>
                    </div>
                    <p className="line-clamp-2 text-sm font-semibold text-slate-800">{task.title}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={`${cardClass} overflow-hidden md:col-span-2`}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
              <div>
                <h2 className={sectionTitle}>Jurnal Aktivitas (Logbook)</h2>
                <p className="mt-1 text-xs text-slate-400">Catatan kegiatan magang Anda</p>
              </div>
              <button onClick={() => setIsLogbookModalOpen(true)} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-sky-600 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-sky-700 sm:text-sm">
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Tulis Jurnal</span><span className="sm:hidden">Jurnal</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                  <tr><th className="px-5 py-3 sm:px-6">Tanggal</th><th className="px-5 py-3 sm:px-6">Aktivitas</th><th className="px-5 py-3 sm:px-6">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-400">Memuat logbook…</td></tr> : logbooks.length === 0 ? (
                    <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-400">Belum ada jurnal aktivitas.</td></tr>
                  ) : logbooks.slice(0, 5).map((logbook) => (
                    <tr key={logbook.id} className="align-top">
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-700 sm:px-6">{formatDate(logbook.date)}</td>
                      <td className="max-w-md px-5 py-4 text-slate-600 sm:px-6"><p className="line-clamp-2">{logbook.activity_description}</p>{logbook.mentor_notes && <p className="mt-1 text-xs text-slate-400">Catatan mentor: {logbook.mentor_notes}</p>}</td>
                      <td className="px-5 py-4 sm:px-6"><StatusBadge status={logbook.verification_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${cardClass} flex flex-col p-5 sm:p-6`}>
            <h2 className={sectionTitle}>Evaluasi & Sertifikat</h2>
            <div className="mt-5 flex-1">
              <p className="text-sm font-medium text-slate-500">Nilai Akhir Magang</p>
              <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900">{evaluation?.final_score ?? '—'}<span className="ml-1 text-base font-semibold text-slate-400">/ 100</span></p>
              {evaluation && <div className="mt-3 space-y-1 text-xs text-slate-600">
                <p className="font-semibold text-sky-700">Predikat: {grade}</p>
                <p>Kehadiran (20%): {evaluation.attendance_percentage}%</p>
                <p>Rata-rata tugas harian (40%): {evaluation.task_average}</p>
                <p>Evaluasi mentor (40%): {( (Number(evaluation.discipline_score) + Number(evaluation.responsibility_score) + Number(evaluation.skill_score) + Number(evaluation.softskill_score)) / 4).toFixed(2)}</p>
                <p>Disiplin {evaluation.discipline_score} · Tanggung jawab {evaluation.responsibility_score} · Kualitas tugas {evaluation.skill_score} · Kerja sama {evaluation.softskill_score}</p>
                {evaluation.remarks && <p className="pt-1">Catatan: {evaluation.remarks}</p>}
              </div>}
              <p className="mt-2 text-xs text-slate-400">{evaluation ? 'Nilai dari evaluasi mentor' : 'Nilai akhir belum diterbitkan.'}</p>
            </div>
            {certificate?.pdf_path ? (
              <a href={`/storage/${certificate.pdf_path}`} download className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">
                <Download className="h-4 w-4" /> Unduh Sertifikat Resmi
              </a>
            ) : (
              <button disabled className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400" title="Sertifikat belum tersedia">
                <Download className="h-4 w-4" /> Sertifikat belum tersedia
              </button>
            )}
          </section>
        </div>
      </main>

      {isCheckInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) setIsCheckInModalOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="checkin-title" className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div><h2 id="checkin-title" className="font-bold text-slate-900">Form Presensi Masuk</h2><p className="mt-1 text-xs text-slate-500">Unggah foto sebagai bukti kehadiran di tempat magang.</p></div>
              <button type="button" onClick={() => setIsCheckInModalOpen(false)} disabled={submitting} aria-label="Tutup" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submitCheckIn} className="space-y-4 p-5">
              <label className="block text-sm font-medium text-slate-700">Foto bukti kehadiran <span className="text-rose-500">*</span>
                <input required type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => setCheckInPhoto(event.target.files?.[0] || null)} className="mt-1.5 block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-sky-700 hover:file:bg-sky-100" />
              </label>
              {checkInPhoto && <p className="-mt-2 text-xs text-slate-500">Dipilih: {checkInPhoto.name} ({(checkInPhoto.size / 1024 / 1024).toFixed(1)} MB)</p>}
              <label className="block text-sm font-medium text-slate-700">Catatan <span className="font-normal text-slate-400">(opsional)</span>
                <textarea rows={2} maxLength={500} value={checkInNotes} onChange={(event) => setCheckInNotes(event.target.value)} placeholder="Contoh: tiba di kantor Diskominfo" className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
              </label>
              <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">Foto JPG, PNG, atau WEBP maksimal 5 MB. Waktu presensi akan dicatat saat formulir dikirim.</p>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsCheckInModalOpen(false)} disabled={submitting} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Batal</button>
                <button type="submit" disabled={submitting || !checkInPhoto} className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Mengirim…' : 'Kirim Presensi'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isLogbookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsLogbookModalOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="logbook-title" className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div><h2 id="logbook-title" className="font-bold text-slate-900">Tulis Jurnal Harian</h2><p className="mt-1 text-xs text-slate-500">Ceritakan kegiatan magang hari ini.</p></div>
              <button onClick={() => setIsLogbookModalOpen(false)} aria-label="Tutup" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submitLogbook} className="space-y-4 p-5">
              <label className="block text-sm font-medium text-slate-700">Tanggal kegiatan
                <input required type="date" max={new Date().toISOString().slice(0, 10)} value={logbookForm.date} onChange={(event) => setLogbookForm({ ...logbookForm, date: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Deskripsi aktivitas
                <textarea required minLength={10} rows={4} value={logbookForm.activity_description} onChange={(event) => setLogbookForm({ ...logbookForm, activity_description: event.target.value })} placeholder="Jelaskan pekerjaan atau kegiatan yang Anda lakukan…" className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Lampiran <span className="font-normal text-slate-400">(opsional)</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(event) => setLogbookForm({ ...logbookForm, attachment: event.target.files?.[0] || null })} className="mt-1.5 block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-sky-700 hover:file:bg-sky-100" />
              </label>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsLogbookModalOpen(false)} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Batal</button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60">{submitting ? 'Mengirim…' : 'Kirim jurnal'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedTask(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="task-title" className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div><h2 id="task-title" className="font-bold text-slate-900">Detail Tugas</h2><p className="mt-1 text-xs text-slate-500">Deadline: {formatDate(selectedTask.deadline)}</p></div>
              <button onClick={() => setSelectedTask(null)} aria-label="Tutup" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submitTask} className="space-y-4 p-5">
              <div><p className="text-lg font-bold text-slate-900">{selectedTask.title}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{selectedTask.description || 'Tidak ada keterangan tambahan.'}</p></div>
              <label className="block text-sm font-medium text-slate-700">Catatan pengumpulan
                <textarea rows={3} value={taskForm.submission_notes} onChange={(event) => setTaskForm({ ...taskForm, submission_notes: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-600 hover:border-sky-400">
                <Upload className="h-4 w-4 text-sky-600" /> {taskForm.submission_file?.name || 'Pilih lampiran tugas (opsional)'}
                <input type="file" className="sr-only" onChange={(event) => setTaskForm({ ...taskForm, submission_file: event.target.files?.[0] || null })} />
              </label>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setSelectedTask(null)} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Tutup</button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60">{submitting ? 'Mengirim…' : 'Kirim tugas'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
