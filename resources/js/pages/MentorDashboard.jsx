import React from 'react';
import useMentorDashboard from '../hooks/useMentorDashboard';
import MentorAttendanceReview from '../components/MentorAttendanceReview';
import MentorFinalEvaluation from '../components/MentorFinalEvaluation';
import AutoDismissNotice from '../components/AutoDismissNotice';
import { apiRequest, getToken } from '../api';
import { 
  Users, 
  BookOpen, 
  ListTodo, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  QrCode,
  Calendar,
  AlertCircle,
  X,
  FileText,
  RefreshCw,
} from 'lucide-react';

const skillAverage = (evaluation) => {
  const values = [
    evaluation?.score_discipline,
    evaluation?.score_quality,
    evaluation?.score_initiative,
    evaluation?.score_teamwork,
    evaluation?.score_softskill,
  ].map(Number).filter((value) => Number.isFinite(value));
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
};

const technicalAverage = (evaluation) => {
  const values = (evaluation?.technical_scores || []).map((item) => Number(item.score)).filter((value) => Number.isFinite(value));
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
};

export default function MentorDashboard() {
  const [taskToRevise, setTaskToRevise] = React.useState(null);
  const [revisionNote, setRevisionNote] = React.useState('');
  const [revisionFile, setRevisionFile] = React.useState(null);
  const [savingRevision, setSavingRevision] = React.useState(false);
  const [taskStatusSelections, setTaskStatusSelections] = React.useState({});
  const [detailEvaluation, setDetailEvaluation] = React.useState(null);
  const [issuingCertificateId, setIssuingCertificateId] = React.useState(null);
  const [downloadingCertificateId, setDownloadingCertificateId] = React.useState(null);
  const {
    activeTab, setActiveTab, logbooks, tasks, evaluations, interns, loading, msg, setMsg, generatingCertificateId,
    selectedApplication, setSelectedApplication,
    showTaskModal, setShowTaskModal,
    taskForm, setTaskForm, loadData, handleLoadApplication, handleUpdateTaskStatus,
    handleCreateTask, handleDownloadTaskFile,
  } = useMentorDashboard();


  const today = new Date();
  const minimumTaskDeadline = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');


  const updateTaskStatus = async (task, status) => {
    if (status === 'revision_needed') {
      setTaskToRevise(task);
      setRevisionNote(task.catatan_revisi || '');
      setRevisionFile(null);
      return;
    }
    await handleUpdateTaskStatus(task, status);
  };

  const submitRevisionNote = async (event) => {
    event.preventDefault();
    if (!taskToRevise || !revisionNote.trim()) return;
    if (revisionFile && revisionFile.size > 30 * 1024 * 1024) {
      setMsg({ type: 'error', text: 'Ukuran berkas revisi maksimal 30 MB.' });
      return;
    }
    setSavingRevision(true);
    try {
      const response = await handleUpdateTaskStatus(taskToRevise, 'revision_needed', revisionNote.trim(), revisionFile);
      if (response.success) {
        setTaskToRevise(null);
        setRevisionFile(null);
      }
    } finally {
      setSavingRevision(false);
    }
  };

  const saveTaskStatus = (task) => {
    const selectedStatus = taskStatusSelections[task.id]
      || (task.status === 'completed' ? 'completed' : 'revision_needed');
    void updateTaskStatus(task, selectedStatus);
  };

  const issueCertificate = async (evaluation) => {
    setIssuingCertificateId(evaluation.id);
    try {
      const response = await apiRequest(`/evaluations/${evaluation.id}/generate-certificate`, { method: 'POST' });
      setMsg({
        type: response.success ? 'success' : 'error',
        text: response.success ? response.message || 'Sertifikat berhasil diterbitkan.' : response.message || 'Penerbitan sertifikat gagal.',
      });
      if (response.success) {
        await loadData();
        setDetailEvaluation((current) => current ? {
          ...current,
          internApplication: {
            ...(current.internApplication || {}),
            certificate: response.data,
          },
        } : current);
      }
    } finally {
      setIssuingCertificateId(null);
    }
  };

  const downloadCertificate = async (certificate) => {
    if (!certificate?.id) return;
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans text-slate-800 bg-[#F8FAFC] min-h-screen">
      
      {/* Header Section - Modern Clean Layout */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-2">
        <div className="space-y-1 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
            Dashboard Pembimbing Lapangan Staff (Mentor)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Bimbing anak magang, pantau presensi dan logbook harian, berikan penugasan berkala, dan simpan evaluasi akhir.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('evaluations');
              window.setTimeout(() => document.getElementById('mentor-evaluation-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold text-xs transition active:scale-95 cursor-pointer"
          >
            <span aria-hidden="true">☆</span>
            Beri Nilai Akhir
          </button>
          <button
            onClick={() => setShowTaskModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-semibold text-xs shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tugas Baru
          </button>
        </div>
      </div>

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
        </AutoDismissNotice>
      )}

      {/* Navigation Tabs - Modern Pill Style */}
      <div className="flex w-full items-center justify-between gap-2 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5">
        <button
          onClick={() => setActiveTab('interns')}
          className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-center text-xs font-bold transition cursor-pointer ${
            activeTab === 'interns'
              ? 'bg-[#4F46E5] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/60'
          }`}
        >
          <Users className="w-4 h-4" />
          Daftar Intern Bimbingan ( {interns.length} )
        </button>

        <button
          onClick={() => setActiveTab('logbooks')}
          className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-center text-xs font-bold transition cursor-pointer ${
            activeTab === 'logbooks'
              ? 'bg-[#4F46E5] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Monitoring Logbook ({logbooks.length})
        </button>

        <button
          onClick={() => { setActiveTab('tasks'); void loadData(); }}
          className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-center text-xs font-bold transition cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-[#4F46E5] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/60'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          Daftar Penugasan ( {tasks.length} )
          {tasks.filter((task) => task.status === 'completed' && (task.submission_notes || task.submission_file)).length > 0 && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">
              {tasks.filter((task) => task.status === 'completed' && (task.submission_notes || task.submission_file)).length} dikumpulkan
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-center text-xs font-bold transition cursor-pointer ${
            activeTab === 'attendance' 
              ? 'bg-[#4F46E5] text-white shadow-xs' 
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Monitoring Presensi
        </button>

        <button
          onClick={() => setActiveTab('evaluations')}
          className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-center text-xs font-bold transition cursor-pointer ${
            activeTab === 'evaluations'
              ? 'bg-[#4F46E5] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/60'
          }`}
        >
          <Award className="w-4 h-4" />
          Penilaian Akhir ({evaluations.length})
        </button>

      </div>

      {/* TAB: PRESENSI */}
      {activeTab === 'attendance' && <MentorAttendanceReview />}

      {/* TAB: PERMOHONAN / PESERTA MAGANG */}
      {activeTab === 'interns' && (
        <section className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden p-6 space-y-6">
          <div className="flex items-center gap-2 text-[#0F172A]">
            <Clock className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-sm">Intern Aktif dalam Bimbingan</h3>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-500 font-bold border-b border-slate-100 pb-3">
                  <th className="py-3 px-2">Intern</th>
                  <th className="py-3 px-2">Institusi</th>
                  <th className="py-3 px-2">Divisi & Periode Magang</th>
                  <th className="py-3 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {interns.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-400 font-medium">
                      Tidak ada intern aktif di divisi bimbingan Anda.
                    </td>
                  </tr>
                ) : (
                  interns.map((intern) => (
                    <tr key={intern.application_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-2 font-bold text-slate-800">
                        {intern.name}
                        <span className="block font-normal text-slate-400 text-[11px]">ID {intern.intern_id} · {intern.email}</span>
                      </td>
                      <td className="py-4 px-2 text-slate-600 font-medium">{intern.institution}</td>
                      <td className="py-4 px-2 text-slate-600 font-medium">
                        <span className="block">{intern.division?.name || '—'}</span>
                        <span className="text-[11px] text-slate-400">{intern.start_date || '—'} – {intern.end_date || '—'}</span>
                      </td>
                      <td className="py-4 px-2 text-right whitespace-nowrap">
                        <button type="button" onClick={() => void handleLoadApplication(intern.application_id)} className="mr-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                          Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTaskForm((previous) => ({ ...previous, assigned_to: intern.intern_id }));
                            setShowTaskModal(true);
                          }}
                          className="px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >Beri Tugas</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB: VERIFIKASI LOGBOOK */}
      {activeTab === 'logbooks' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden p-6 space-y-6">
          <div className="flex items-center gap-2 text-[#0F172A]">
            <Clock className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-sm">Catatan Logbook Kegiatan Magang</h3>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-500 font-bold border-b border-slate-100">
                  <th className="py-3 px-2">Nama Anak Magang</th>
                  <th className="py-3 px-2">Tanggal</th>
                  <th className="py-3 px-2">Uraian Kegiatan</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Catatan Mentor</th>
                  <th className="py-3 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logbooks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 text-xs">
                      Belum ada catatan logbook yang dikirimkan.
                    </td>
                  </tr>
                ) : (
                  logbooks.map((lb) => (
                    <tr key={lb.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-2 font-bold text-[#0F172A]">
                        {lb.user?.name} <span className="font-medium text-slate-500">(Pemohon Magang)</span>
                      </td>
                      <td className="py-4 px-2 text-slate-600 font-medium whitespace-nowrap">{lb.date}</td>
                      <td className="py-4 px-2 text-slate-600 max-w-xs leading-relaxed font-medium">{lb.activity_description}</td>
                      <td className="py-4 px-2 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          lb.verification_status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : lb.verification_status === 'rejected'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {lb.verification_status}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-slate-500 max-w-xs truncate font-medium">{lb.mentor_notes || '—'}</td>
                      <td className="py-4 px-2 text-right whitespace-nowrap text-slate-500">Monitoring saja</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: DAFTAR PENUGASAN */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between gap-3 text-[#0F172A]">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-slate-700" />
              <h3 className="font-bold text-sm">Daftar Penugasan Anak Magang</h3>
            </div>
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Muat ulang
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-12 h-12 bg-indigo-50 text-[#4F46E5] rounded-full flex items-center justify-center mx-auto">
                <ListTodo className="w-6 h-6" />
              </div>
              <p className="text-slate-800 font-bold text-sm">Belum ada tugas yang dibuat</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Klik tombol "Tugas Baru" di atas untuk memberikan instruksi pekerjaan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tasks.map((t) => (
                <div key={t.id} className="flex flex-col justify-between rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition hover:border-indigo-200">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Tugas Magang</span>
                        <h4 className="text-base font-extrabold leading-snug text-[#0F172A]">{t.title}</h4>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                        t.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : t.status === 'revision_needed'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {t.status === 'completed' ? 'Selesai' : t.status === 'revision_needed' ? 'Perlu Revisi' : 'Dalam Proses'}
                      </span>
                    </div>
                    {t.description && <p className="text-sm leading-relaxed text-slate-500">{t.description}</p>}

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <span className="block text-xs text-slate-500">Diberikan kepada</span>
                        <span className="mt-1 block truncate text-sm font-bold text-[#0F172A]">{t.assigned_user?.name || '—'}</span>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <span className="block text-xs text-slate-500">Tenggat</span>
                        <span className="mt-1 block text-sm font-bold text-[#0F172A]">
                          {t.deadline
                            ? new Date(t.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                            : 'Tidak ditentukan'}
                        </span>
                      </div>
                    </div>

                    {t.submission_file && (
                      <button type="button" onClick={() => handleDownloadTaskFile(t, 'submission')} className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40">
                        <span className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Berkas Kiriman Intern</span>
                        <span className="mt-1 block truncate text-sm font-bold text-[#0F172A]">{t.submission_file_name || 'Unduh berkas kiriman'}</span>
                      </button>
                    )}

                    {t.submission_notes && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <span className="block text-xs font-bold text-[#0F172A]">Catatan Pengumpulan</span>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{t.submission_notes}</p>
                      </div>
                    )}

                    {t.status === 'revision_needed' && t.catatan_revisi && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <span className="block text-xs font-bold text-[#0F172A]">Catatan Revisi untuk Intern</span>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{t.catatan_revisi}</p>
                      </div>
                    )}

                    {t.task_file_path && (
                      <button type="button" onClick={() => handleDownloadTaskFile(t, 'attachment')} className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:underline">
                        <FileText className="h-3.5 w-3.5" /> Instruksi: {t.task_file_name || 'Unduh berkas mentor'}
                      </button>
                    )}
                    {t.revision_file_path && (
                      <button type="button" onClick={() => handleDownloadTaskFile(t, 'revision')} className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:underline">
                        <FileText className="h-3.5 w-3.5" /> Berkas revisi: {t.revision_file_name || 'Unduh berkas revisi'}
                      </button>
                    )}
                  </div>

                  <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-[#0F172A]">Perbarui status</span>
                      <select
                        value={taskStatusSelections[t.id] || (t.status === 'completed' ? 'completed' : 'revision_needed')}
                        onChange={(event) => setTaskStatusSelections((previous) => ({ ...previous, [t.id]: event.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="revision_needed">Perlu Revisi</option>
                        <option value="completed">Selesai</option>
                      </select>
                    </label>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => saveTaskStatus(t)}
                        className="rounded-xl bg-indigo-600 px-3 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                      >
                        Simpan Status
                      </button>
                      <button
                        type="button"
                        disabled={!t.submission_file}
                        onClick={() => handleDownloadTaskFile(t, 'submission')}
                        className="rounded-xl border border-indigo-400 bg-white px-3 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Unduh Kiriman
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: PENILAIAN & SERTIFIKAT */}
      {activeTab === 'evaluations' && (
        <div className="space-y-6">
          <MentorFinalEvaluation interns={interns} evaluations={evaluations} onSaved={loadData} />

          <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
            <h3 className="mb-5 text-lg font-extrabold text-[#0F2942]">Rekap Penilaian dan Status Magang</h3>
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 font-bold text-slate-500">
                    <th className="py-3 px-2">Nama Anak Magang</th>
                    <th className="py-3 px-2">Divisi</th>
                    <th className="py-3 px-2">Nilai Keterampilan</th>
                    <th className="py-3 px-2">Nilai Teknis</th>
                    <th className="py-3 px-2">Nilai Rata-rata</th>
                    <th className="py-3 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evaluations.length ? (
                    evaluations.map((evaluation) => {
                      const skill = skillAverage(evaluation);
                      const technical = technicalAverage(evaluation);
                      return (
                        <tr key={evaluation.id} className="transition hover:bg-slate-50/50">
                          <td className="px-2 py-4">
                            <strong className="font-bold text-[#0F2942]">{evaluation.intern?.name || '—'}</strong>
                          </td>
                          <td className="px-2 py-4 font-medium text-slate-700">{evaluation.intern?.division?.name || '—'}</td>
                          <td className="px-2 py-4 font-medium text-slate-700">{skill === null ? '-' : skill.toFixed(2)}</td>
                          <td className="px-2 py-4 font-medium text-slate-700">{technical === null ? '-' : technical.toFixed(2)}</td>
                          <td className="px-2 py-4">
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                              {evaluation.final_score !== null && evaluation.final_score !== undefined ? Number(evaluation.final_score).toFixed(2) : '-'}
                            </span>
                          </td>
                          <td className="px-2 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setDetailEvaluation(evaluation)}
                              className="rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#4338CA]"
                            >
                              Lihat rincian
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">Belum ada evaluasi akhir tersimpan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Modal Buat Tugas Baru */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-slate-100 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Buat Tugas Magang Baru</h3>
              <button 
                onClick={() => setShowTaskModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Penerima Tugas
                </label>
                <select
                  required
                  value={taskForm.assigned_to}
                  onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Pilih peserta magang</option>
                  {interns.map((it) => (
                    <option key={it.id} value={it.id}>{it.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Judul Tugas
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembuatan Dokumentasi Modul Diskominfo"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Instruksi / Rincian
                </label>
                <textarea
                  rows="3"
                  placeholder="Rincian arahan tugas yang harus dikerjakan..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Tenggat Waktu (Deadline)
                </label>
                <input
                  type="date"
                  min={minimumTaskDeadline}
                  value={taskForm.deadline}
                  onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="mentor-task-file" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Berkas Instruksi (opsional, maksimal 30 MB)
                </label>
                <input
                  id="mentor-task-file"
                  type="file"
                  onChange={(event) => setTaskForm({ ...taskForm, task_file: event.target.files?.[0] || null })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer"
                >
                  Buat Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {taskToRevise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <section role="dialog" aria-modal="true" aria-labelledby="revision-note-title" className="w-full max-w-lg space-y-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="revision-note-title" className="font-bold text-[#0F2942]">Minta Revisi Tugas</h3>
                <p className="mt-1 text-xs text-slate-500">{taskToRevise.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setTaskToRevise(null)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitRevisionNote} className="space-y-4">
              <div>
                <label htmlFor="task-revision-note" className="mb-1.5 block text-xs font-bold text-slate-700">Catatan Revisi dari Mentor</label>
                <textarea
                  id="task-revision-note"
                  required
                  maxLength={1000}
                  rows={5}
                  value={revisionNote}
                  onChange={(event) => setRevisionNote(event.target.value)}
                  placeholder="Jelaskan bagian yang perlu diperbaiki oleh intern..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                <p className="mt-1 text-right text-[11px] text-slate-400">{revisionNote.length}/1000</p>
              </div>
              <div>
                <label htmlFor="task-revision-file" className="mb-1.5 block text-xs font-bold text-slate-700">Berkas Revisi (opsional, maksimal 30 MB)</label>
                <input
                  id="task-revision-file"
                  type="file"
                  onChange={(event) => setRevisionFile(event.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTaskToRevise(null)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingRevision || !revisionNote.trim()}
                  className="rounded-xl bg-[#4F46E5] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#4338CA] disabled:opacity-50"
                >
                  {savingRevision ? 'Mengirim...' : 'Kirim Revisi'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {detailEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <section role="dialog" aria-modal="true" aria-labelledby="evaluation-detail-title" className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Rincian nilai</p>
                <h3 id="evaluation-detail-title" className="mt-1 text-lg font-extrabold text-[#0F2942]">{detailEvaluation.intern?.name || 'Peserta Magang'}</h3>
              </div>
              <button type="button" onClick={() => setDetailEvaluation(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Tutup rincian nilai">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                ['Disiplin', detailEvaluation.score_discipline],
                ['Perilaku dan Sopan Santun', detailEvaluation.score_quality],
                ['Inisiatif', detailEvaluation.score_initiative],
                ['Motivasi', detailEvaluation.score_teamwork],
                ['Komunikasi dan Kerja Sama', detailEvaluation.score_softskill],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-slate-200/80 px-4 py-3">
                  <span className="text-xs text-slate-600">{label}</span>
                  <strong className="text-sm text-[#0F2942]">{value !== null && value !== undefined ? Number(value).toFixed(2) : '-'}</strong>
                </div>
              ))}
            </div>

            {(detailEvaluation.technical_scores || []).length > 0 && (
              <div className="mt-4 space-y-2 rounded-xl border border-slate-200/80 p-4">
                <p className="text-xs font-bold text-[#0F2942]">Penilaian Teknis</p>
                {detailEvaluation.technical_scores.map((item, index) => (
                  <div key={`${item.criteria}-${index}`} className="flex items-center justify-between border-b border-slate-100 py-2 text-xs last:border-0">
                    <span className="text-slate-600">{item.criteria}</span>
                    <strong className="text-[#0F2942]">{Number(item.score).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
              <span className="text-xs font-bold text-emerald-800">Nilai Rata-rata</span>
              <strong className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700">
                {detailEvaluation.final_score !== null && detailEvaluation.final_score !== undefined ? Number(detailEvaluation.final_score).toFixed(2) : '-'}
              </strong>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-200/80 pt-4">
              {(() => {
                const certificate = detailEvaluation.internApplication?.certificate || detailEvaluation.certificate;
                return certificate?.id ? (
                  <button
                    type="button"
                    onClick={() => downloadCertificate(certificate)}
                    disabled={downloadingCertificateId === certificate.id}
                    className="rounded-xl bg-[#4F46E5] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#4338CA] disabled:opacity-50"
                  >
                    {downloadingCertificateId === certificate.id ? 'Menyiapkan PDF...' : 'Unduh Sertifikat'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => issueCertificate(detailEvaluation)}
                    disabled={issuingCertificateId === detailEvaluation.id}
                    className="rounded-xl bg-[#4F46E5] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#4338CA] disabled:opacity-50"
                  >
                    {issuingCertificateId === detailEvaluation.id ? 'Menerbitkan...' : 'Terbitkan Sertifikat'}
                  </button>
                );
              })()}
              <button type="button" onClick={() => setDetailEvaluation(null)} className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">Tutup</button>
            </div>
          </section>
        </div>
      )}

      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <section role="dialog" aria-modal="true" aria-labelledby="application-detail-title" className="w-full max-w-xl space-y-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h3 id="application-detail-title" className="font-bold text-slate-900">Detail Pengajuan Magang</h3>
                <p className="mt-1 text-xs text-slate-500">ID Pengajuan {selectedApplication.id} · ID Intern {selectedApplication.user_id}</p>
              </div>
              <button type="button" onClick={() => setSelectedApplication(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Tutup detail">
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="grid gap-4 text-sm md:grid-cols-2">
              <div><dt className="text-xs font-semibold text-slate-500">Nama</dt><dd className="mt-1 font-bold text-slate-900">{selectedApplication.user?.name || '—'}</dd></div>
              <div><dt className="text-xs font-semibold text-slate-500">Email</dt><dd className="mt-1 text-slate-800">{selectedApplication.user?.email || '—'}</dd></div>
              <div><dt className="text-xs font-semibold text-slate-500">Institusi</dt><dd className="mt-1 text-slate-800">{selectedApplication.institution_name || selectedApplication.institution || '—'}</dd></div>
              <div><dt className="text-xs font-semibold text-slate-500">Divisi</dt><dd className="mt-1 text-slate-800">{selectedApplication.division?.name || '—'}</dd></div>
              <div><dt className="text-xs font-semibold text-slate-500">Tanggal Mulai</dt><dd className="mt-1 text-slate-800">{selectedApplication.start_date || '—'}</dd></div>
              <div><dt className="text-xs font-semibold text-slate-500">Tanggal Selesai</dt><dd className="mt-1 text-slate-800">{selectedApplication.end_date || '—'}</dd></div>
            </dl>
            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button type="button" onClick={() => setSelectedApplication(null)} className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">Tutup</button>
            </div>
          </section>
        </div>
      )}

    </div>
  );
}
