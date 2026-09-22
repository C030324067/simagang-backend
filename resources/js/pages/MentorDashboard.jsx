import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { 
  Users, 
  BookOpen, 
  ListTodo, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  Star, 
  QrCode,
  Send,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function MentorDashboard() {
  const [activeTab, setActiveTab] = useState('logbooks'); // logbooks, tasks, evaluations
  const [logbooks, setLogbooks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Logbook verify modal
  const [selectedLogbook, setSelectedLogbook] = useState(null);
  const [logbookVerifyForm, setLogbookVerifyForm] = useState({
    verification_status: 'approved',
    mentor_notes: '',
  });

  // Task Form Modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    deadline: '',
  });

  // Evaluation Form Modal
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalForm, setEvalForm] = useState({
    intern_id: '',
    discipline_score: 90,
    skill_score: 90,
    softskill_score: 90,
    remarks: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [logRes, taskRes, evalRes, appRes] = await Promise.all([
      apiRequest('/logbooks'),
      apiRequest('/tasks'),
      apiRequest('/evaluations'),
      apiRequest('/applications?final_status=accepted'),
    ]);

    if (logRes.success && logRes.data) setLogbooks(logRes.data.data || []);
    if (taskRes.success && taskRes.data) setTasks(taskRes.data.data || []);
    if (evalRes.success && evalRes.data) setEvaluations(evalRes.data.data || []);

    if (appRes.success && appRes.data) {
      const acceptedInterns = (appRes.data.data || []).map((app) => app.user).filter(Boolean);
      setInterns(acceptedInterns);
      if (acceptedInterns.length > 0) {
        setTaskForm((prev) => ({ ...prev, assigned_to: acceptedInterns[0].id }));
        setEvalForm((prev) => ({ ...prev, intern_id: acceptedInterns[0].id }));
      }
    }

    setLoading(false);
  };

  const handleVerifyLogbook = async (e) => {
    e.preventDefault();
    if (!selectedLogbook) return;

    const res = await apiRequest(`/logbooks/${selectedLogbook.id}/verify`, {
      method: 'PUT',
      body: JSON.stringify(logbookVerifyForm),
    });

    if (res.success) {
      setMsg({ type: 'success', text: 'Verifikasi logbook harian berhasil disimpan!' });
      setSelectedLogbook(null);
      loadData();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal memverifikasi logbook' });
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const res = await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskForm),
    });

    if (res.success) {
      setMsg({ type: 'success', text: 'Tugas berhasil diberikan kepada anak magang!' });
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', assigned_to: interns[0]?.id || '', deadline: '' });
      loadData();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal membuat tugas' });
    }
  };

  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    const res = await apiRequest('/evaluations', {
      method: 'POST',
      body: JSON.stringify(evalForm),
    });

    if (res.success) {
      setMsg({ type: 'success', text: 'Nilai evaluasi kinerja magang berhasil disimpan!' });
      setShowEvalModal(false);
      loadData();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal menyimpan nilai evaluasi' });
    }
  };

  const handleGenerateCert = async (internId) => {
    const res = await apiRequest('/certificates/generate', {
      method: 'POST',
      body: JSON.stringify({ intern_id: internId }),
    });

    if (res.success) {
      setMsg({ type: 'success', text: `Sertifikat resmi dengan Kode QR berhasil diterbitkan! No: ${res.data.certificate_number}` });
      loadData();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal menerbitkan sertifikat' });
    }
  };

  const calculatedFinalScore = Math.round(
    ((Number(evalForm.discipline_score) * 0.3) +
     (Number(evalForm.skill_score) * 0.4) +
     (Number(evalForm.softskill_score) * 0.3)) * 100
  ) / 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              Manajemen Bimbingan Lapangan
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
            Dashboard Pembimbing Lapangan Staff (Mentor)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Bimbing anak magang, validasi aktivitas logbook harian, berikan penugasan berkala, evaluasi nilai akhir, dan terbitkan sertifikat digital ber-QR.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTaskModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Tugas Baru
          </button>
          <button
            onClick={() => setShowEvalModal(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <Star className="w-4 h-4" />
            Beri Nilai Akhir
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl text-sm border flex items-center justify-between ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ type: '', text: '' })} className="font-bold text-xs hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('logbooks')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === 'logbooks'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Verifikasi Logbook ({logbooks.filter(l => l.verification_status === 'pending').length} Tertunda)
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === 'tasks'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          Daftar Penugasan ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('evaluations')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === 'evaluations'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          Penilaian & Terbit Sertifikat ({evaluations.length})
        </button>
      </div>

      {/* TAB 1: LOGBOOK VERIFICATION */}
      {activeTab === 'logbooks' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Catatan Logbook Kegiatan Magang
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Anak Magang</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Uraian Kegiatan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Catatan Mentor</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logbooks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400">Belum ada catatan logbook yang masuk.</td>
                  </tr>
                ) : (
                  logbooks.map((lb) => (
                    <tr key={lb.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{lb.user?.name}</td>
                      <td className="py-3 px-4 text-slate-600 font-semibold">{lb.date}</td>
                      <td className="py-3 px-4 text-slate-700 max-w-sm">{lb.activity_description}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          lb.verification_status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : lb.verification_status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {lb.verification_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{lb.mentor_notes || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedLogbook(lb);
                            setLogbookVerifyForm({
                              verification_status: 'approved',
                              mentor_notes: 'Aktivitas pekerjaan magang disetujui sesuai standar operasional dinas.',
                            });
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs transition"
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

      {/* TAB 2: TASKS */}
      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.length === 0 ? (
            <div className="col-span-3 p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
              Belum ada tugas yang dibuat. Klik "Tugas Baru" untuk memberikan instruksi kerja.
            </div>
          ) : (
            tasks.map((t) => (
              <div key={t.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{t.title}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    t.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : t.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{t.description}</p>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <p>Diberikan kepada: <span className="font-semibold text-slate-800">{t.assigned_user?.name}</span></p>
                  {t.deadline && <p>Tenggat: <span className="font-semibold text-slate-700">{new Date(t.deadline).toLocaleDateString('id-ID')}</span></p>}
                  {t.submission_notes && (
                    <p className="p-2 bg-slate-50 rounded text-slate-700 mt-2">
                      <span className="font-semibold">Catatan Pengumpulan:</span> {t.submission_notes}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: EVALUATIONS & CERTIFICATE ISSUANCE */}
      {activeTab === 'evaluations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              Daftar Evaluasi Kinerja & Penerbitan Sertifikat QR
            </h3>
            <button
              onClick={() => setShowEvalModal(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
            >
              + Input Nilai Magang
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Anak Magang</th>
                  <th className="py-3 px-4">Kedisiplinan (30%)</th>
                  <th className="py-3 px-4">Keterampilan Teknis (40%)</th>
                  <th className="py-3 px-4">Soft Skill (30%)</th>
                  <th className="py-3 px-4">Nilai Akhir</th>
                  <th className="py-3 px-4 text-right">Sertifikat QR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evaluations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400">Belum ada evaluasi nilai yang diinput.</td>
                  </tr>
                ) : (
                  evaluations.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{ev.intern?.name}</p>
                        <p className="text-[11px] text-slate-400">{ev.intern?.division?.name || 'Aptika'}</p>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold">{ev.discipline_score}</td>
                      <td className="py-3 px-4 font-mono font-semibold">{ev.skill_score}</td>
                      <td className="py-3 px-4 font-mono font-semibold">{ev.softskill_score}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-md font-bold font-mono text-xs bg-emerald-100 text-emerald-800">
                          {ev.final_score}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleGenerateCert(ev.intern_id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition inline-flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Terbitkan Sertifikat QR
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

      {/* Logbook Verification Modal */}
      {selectedLogbook && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Validasi Catatan Logbook</h3>
            <p className="text-xs text-slate-500">Pemohon: {selectedLogbook.user?.name} - {selectedLogbook.date}</p>
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
              {selectedLogbook.activity_description}
            </div>

            <form onSubmit={handleVerifyLogbook} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Status Validasi</label>
                <select
                  value={logbookVerifyForm.verification_status}
                  onChange={(e) => setLogbookVerifyForm({ ...logbookVerifyForm, verification_status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="approved">Disetujui (Approved)</option>
                  <option value="rejected">Ditolak (Rejected)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Catatan Pembimbing</label>
                <textarea
                  rows="3"
                  value={logbookVerifyForm.mentor_notes}
                  onChange={(e) => setLogbookVerifyForm({ ...logbookVerifyForm, mentor_notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLogbook(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
                >
                  Simpan Validasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Buat Tugas Magang Baru</h3>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Pilih Anak Magang</label>
                <select
                  required
                  value={taskForm.assigned_to}
                  onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  {interns.map((it) => (
                    <option key={it.id} value={it.id}>{it.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Judul Tugas</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembuatan Dokumentasi Modul Diskominfo"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Instruksi / Rincian</label>
                <textarea
                  rows="3"
                  placeholder="Rincian arahan tugas yang harus dikerjakan..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Tenggat Waktu (Deadline)</label>
                <input
                  type="date"
                  value={taskForm.deadline}
                  onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Tugaskan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evaluation Scoring Modal */}
      {showEvalModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Formulir Penilaian Akhir Magang</h3>
            <form onSubmit={handleSaveEvaluation} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Pilih Anak Magang</label>
                <select
                  required
                  value={evalForm.intern_id}
                  onChange={(e) => setEvalForm({ ...evalForm, intern_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  {interns.map((it) => (
                    <option key={it.id} value={it.id}>{it.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Disiplin (30%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={evalForm.discipline_score}
                    onChange={(e) => setEvalForm({ ...evalForm, discipline_score: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Teknis (40%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={evalForm.skill_score}
                    onChange={(e) => setEvalForm({ ...evalForm, skill_score: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Softskill (30%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={evalForm.softskill_score}
                    onChange={(e) => setEvalForm({ ...evalForm, softskill_score: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-900 font-bold">
                <span>Nilai Akhir Terhitung Otomatis:</span>
                <span className="font-mono text-base text-amber-800">{calculatedFinalScore}</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Catatan / Ulasan Pembimbing</label>
                <textarea
                  rows="3"
                  value={evalForm.remarks}
                  onChange={(e) => setEvalForm({ ...evalForm, remarks: e.target.value })}
                  placeholder="Catatan prestasi, dedikasi, dan evaluasi hasil magang..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEvalModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
                >
                  Simpan Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

