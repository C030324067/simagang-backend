import React from 'react';
import useMentorDashboard from '../hooks/useMentorDashboard';
import MentorAttendanceReview from '../components/MentorAttendanceReview';
import MentorFinalEvaluation from '../components/MentorFinalEvaluation';
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
  User,
  Star,
  FileText,
  RefreshCw
} from 'lucide-react';

export default function MentorDashboard() {
  const [taskToRevise, setTaskToRevise] = React.useState(null);
  const [revisionNote, setRevisionNote] = React.useState('');
  const [savingRevision, setSavingRevision] = React.useState(false);
  const {
    activeTab, setActiveTab, logbooks, tasks, evaluations, interns, loading, msg, setMsg,
    selectedLogbook, setSelectedLogbook, logbookVerifyForm, setLogbookVerifyForm, showTaskModal, setShowTaskModal,
    taskForm, setTaskForm, loadData, handleUpdateTaskStatus,
    handleVerifyLogbook, handleCreateTask,
    handleGenerateCert, handleDownloadTaskSubmission,
  } = useMentorDashboard();

  const pendingLogbooksCount = logbooks.filter(l => l.verification_status === 'pending').length;

  const updateTaskStatus = async (task, status) => {
    if (status === 'revision_needed') {
      setTaskToRevise(task);
      setRevisionNote(task.catatan_revisi || '');
      return;
    }
    await handleUpdateTaskStatus(task, status);
  };

  const submitRevisionNote = async (event) => {
    event.preventDefault();
    if (!taskToRevise || !revisionNote.trim()) return;
    setSavingRevision(true);
    try {
      const response = await handleUpdateTaskStatus(taskToRevise, 'revision_needed', revisionNote.trim());
      if (response.success) setTaskToRevise(null);
    } finally {
      setSavingRevision(false);
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
            Bimbing anak magang, validasi aktivitas logbook harian, berikan penugasan berkala, evaluasi nilai akhir, dan terbitkan sertifikat digital ber-QR.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowTaskModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-semibold text-xs shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tugas Baru
          </button>
          <button
            onClick={() => setActiveTab('evaluations')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-semibold text-xs shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Star className="w-4 h-4 fill-white/20" />
            Beri Nilai Akhir
          </button>
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

      {/* Navigation Tabs - Modern Pill Style */}
      <div className="flex items-center gap-2 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('interns')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'interns'
              ? 'bg-[#4F46E5] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/60'
          }`}
        >
          <Users className="w-4 h-4" />
          Permohonan ( {interns.length} )
        </button>

        <button
          onClick={() => setActiveTab('logbooks')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'logbooks'
              ? 'bg-[#4F46E5] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Verifikasi Logbook ( {pendingLogbooksCount} Tertunda )
        </button>

        <button
          onClick={() => { setActiveTab('tasks'); void loadData(); }}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
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
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'attendance' 
              ? 'bg-[#4F46E5] text-white shadow-xs' 
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Persetujuan Presensi
        </button>

        <button
          onClick={() => setActiveTab('evaluations')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'evaluations'
              ? 'bg-[#4F46E5] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/60'
          }`}
        >
          <Award className="w-4 h-4" />
          Penilaian & Terbit Sertifikat ( {evaluations.length} )
        </button>
      </div>

      {/* TAB: PRESENSI */}
      {activeTab === 'attendance' && <MentorAttendanceReview />}

      {/* TAB: PERMOHONAN / PESERTA MAGANG */}
      {activeTab === 'interns' && (
        <section className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden p-6 space-y-6">
          <div className="flex items-center gap-2 text-[#0F172A]">
            <Clock className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-sm">Permohonan Menunggu Peninjauan</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-500 font-bold border-b border-slate-100 pb-3">
                  <th className="py-3 px-2">Pemohon</th>
                  <th className="py-3 px-2">Institusi / Bidang</th>
                  <th className="py-3 px-2">Dokumen</th>
                  <th className="py-3 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {interns.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-400 font-medium">
                      Tidak ada permohonan menunggu.
                    </td>
                  </tr>
                ) : (
                  interns.map((intern) => (
                    <tr key={intern.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-2 font-bold text-slate-800">
                        {intern.name}
                        <span className="block font-normal text-slate-400 text-[11px]">{intern.email}</span>
                      </td>
                      <td className="py-4 px-2 text-slate-600 font-medium">{intern.division?.name || 'Bidang Aplikasi Informatika'}</td>
                      <td className="py-4 px-2 text-slate-500 font-medium">Berkas_Permohonan.pdf</td>
                      <td className="py-4 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setTaskForm((previous) => ({ ...previous, assigned_to: intern.id }));
                            setShowTaskModal(true);
                          }}
                          className="px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Beri Tugas
                        </button>
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

          <div className="overflow-x-auto">
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
                      <td className="py-4 px-2 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedLogbook(lb);
                            setLogbookVerifyForm({
                              verification_status: 'approved',
                              mentor_notes: 'Aktivitas pekerjaan magang disetujui sesuai standar.',
                            });
                          }}
                          className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                            lb.verification_status === 'pending'
                              ? 'bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-xs'
                              : 'bg-[#818CF8]/40 hover:bg-[#6366F1] text-white'
                          }`}
                        >
                          Verifikasi
                        </button>
                      </td>
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
                <div key={t.id} className="p-5 rounded-2xl border border-slate-200/70 space-y-4 flex flex-col justify-between hover:border-indigo-200 transition bg-white">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-extrabold text-[#0F172A] text-sm leading-snug">{t.title}</h4>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                        t.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : t.status === 'revision_needed'
                          ? 'bg-rose-100 text-rose-700'
                          : t.status === 'in_progress'
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {{ pending: 'Menunggu', todo: 'Menunggu', in_progress: 'IN_PROGRESS', revision_needed: 'Revisi', completed: 'COMPLETED' }[t.status] || t.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">{t.description}</p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <div>
                      <span>Diberikan kepada: </span>
                      <span className="font-bold text-slate-800">{t.assigned_user?.name} (Pemohon Magang)</span>
                    </div>

                    {t.deadline && (
                      <div>
                        <span>Tenggat: </span>
                        <span className="font-bold text-slate-800">
                          {new Date(t.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    )}

                    {t.submission_notes && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 space-y-1">
                        <span className="font-bold block text-xs text-[#0F172A]">Catatan Pengumpulan:</span>
                        <p className="text-xs text-slate-600">{t.submission_notes}</p>
                      </div>
                    )}

                    {t.submission_file && (
                      <a 
                        href={`/api/tasks/${t.id}/submission`}
                        onClick={(event) => { event.preventDefault(); handleDownloadTaskSubmission(t); }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] hover:underline pt-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Unduh Berkas: {t.submission_file_name || 'Pengumpulan tugas'}
                      </a>
                    )}

                    <label className="block pt-2">
                      <span className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Ubah Status Tasks</span>
                      <select 
                        value={t.status === 'todo' ? 'pending' : t.status} 
                        onChange={(event) => updateTaskStatus(t, event.target.value)} 
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="pending">Menunggu</option>
                        <option value="in_progress">Dalam Proses</option>
                        <option value="revision_needed">Perlu Revisi</option>
                        <option value="completed">Selesai</option>
                      </select>
                    </label>
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
          <MentorFinalEvaluation interns={interns} evaluations={evaluations} onSaved={loadData} onGenerateCertificate={handleGenerateCert} />
          
          <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#0F172A]">
                <Award className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold">Daftar Evaluasi Kinerja & Penerbitan Sertifikat QR</h3>
              </div>
              <button 
                onClick={() => setActiveTab('evaluations')}
                className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-bold transition"
              >
                + Input Nilai Magang
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-bold">
                    <th className="py-3 px-2">Nama Anak Magang</th>
                    <th className="py-3 px-2">Kedisiplinan (30%)</th>
                    <th className="py-3 px-2">Keterampilan Teknis (40%)</th>
                    <th className="py-3 px-2">Soft Skill (30%)</th>
                    <th className="py-3 px-2">Nilai Akhir</th>
                    <th className="py-3 px-2 text-right">Sertifikat QR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evaluations.length ? (
                    evaluations.map((evaluation) => (
                      <tr key={evaluation.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-2">
                          <strong className="text-[#0F172A] font-bold">{evaluation.intern?.name} (Pemohon Magang)</strong>
                          <p className="text-slate-400 text-[11px] mt-0.5">{evaluation.intern?.division?.name || 'Bidang Aplikasi Informatika'}</p>
                        </td>
                        <td className="py-4 px-2 font-medium text-slate-700">{evaluation.discipline_score || '92.50'}</td>
                        <td className="py-4 px-2 font-medium text-slate-700">{evaluation.technical_score || '95.00'}</td>
                        <td className="py-4 px-2 font-medium text-slate-700">{evaluation.soft_skill_score || '90.00'}</td>
                        <td className="py-4 px-2">
                          <span className="rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-700 text-xs">
                            {evaluation.final_score || '92.75'}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <button 
                            type="button" 
                            onClick={() => handleGenerateCert(evaluation.intern_id)} 
                            className="rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] px-4 py-2 font-bold text-white transition cursor-pointer"
                          >
                            Terbitkan Sertifikat QR
                          </button>
                        </td>
                      </tr>
                    ))
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

      {/* Modal Validasi Logbook */}
      {selectedLogbook && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-slate-100 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Validasi Catatan Logbook</h3>
                <p className="text-xs text-slate-500">
                  Pemohon: <span className="font-semibold text-slate-700">{selectedLogbook.user?.name}</span> ({selectedLogbook.date})
                </p>
              </div>
              <button 
                onClick={() => setSelectedLogbook(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-[10px] uppercase text-[#4F46E5] block mb-1">Rincian Kegiatan:</span>
              {selectedLogbook.activity_description}
            </div>

            <form onSubmit={handleVerifyLogbook} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Status Validasi
                </label>
                <select
                  value={logbookVerifyForm.verification_status}
                  onChange={(e) => setLogbookVerifyForm({ ...logbookVerifyForm, verification_status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="approved">Disetujui (Approved)</option>
                  <option value="rejected">Ditolak (Rejected)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Catatan Pembimbing
                </label>
                <textarea
                  rows="3"
                  value={logbookVerifyForm.mentor_notes}
                  onChange={(e) => setLogbookVerifyForm({ ...logbookVerifyForm, mentor_notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedLogbook(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer"
                >
                  Simpan Validasi
                </button>
              </div>
            </form>
          </div>
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
                  value={taskForm.deadline}
                  onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
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
                <label htmlFor="task-revision-note" className="mb-1.5 block text-xs font-bold text-slate-700">Catatan Revisi</label>
                <textarea
                  id="task-revision-note"
                  required
                  maxLength={2000}
                  rows={5}
                  value={revisionNote}
                  onChange={(event) => setRevisionNote(event.target.value)}
                  placeholder="Jelaskan bagian yang perlu diperbaiki oleh intern..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
                  {savingRevision ? 'Menyimpan...' : 'Kirim Catatan Revisi'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

    </div>
  );
}