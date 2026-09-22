import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Camera,
  Upload,
  BookOpen,
  Award,
  ListTodo,
  QrCode,
  Building,
  Send,
  Download
} from 'lucide-react';

export default function InternDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('application'); // application, attendance, logbook, tasks, certificate
  const [application, setApplication] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [logbooks, setLogbooks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Application Form State
  const [appForm, setAppForm] = useState({
    application_type: 'mandiri',
    institution_name: '',
    recommendation_letter_number: '',
    start_date: '',
    end_date: '',
    division_id: '',
    file_proposal: null,
    file_cv: null,
    file_recommendation_letter: null,
  });

  // Logbook Form State
  const [logbookForm, setLogbookForm] = useState({
    date: new Date().toISOString().split('T')[0],
    activity_description: '',
    attachment: null,
  });

  // Attendance Form State
  const [attendanceNotes, setAttendanceNotes] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('present');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    const [appRes, divRes, todayRes, attRes, logRes, taskRes, certRes] = await Promise.all([
      apiRequest('/applications/my-application'),
      apiRequest('/divisions'),
      apiRequest('/attendances/today'),
      apiRequest('/attendances'),
      apiRequest('/logbooks'),
      apiRequest('/tasks'),
      apiRequest('/certificates/my-certificate'),
    ]);

    if (appRes.success) setApplication(appRes.data);
    if (divRes.success) setDivisions(divRes.data || []);
    if (todayRes.success) setTodayAttendance(todayRes.data);
    if (attRes.success && attRes.data) setAttendances(attRes.data.data || []);
    if (logRes.success && logRes.data) setLogbooks(logRes.data.data || []);
    if (taskRes.success && taskRes.data) setTasks(taskRes.data.data || []);
    if (certRes.success) setCertificate(certRes.data);

    setLoading(false);
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    const formData = new FormData();
    formData.append('application_type', appForm.application_type);
    formData.append('institution_name', appForm.institution_name);
    formData.append('start_date', appForm.start_date);
    formData.append('end_date', appForm.end_date);
    if (appForm.division_id) formData.append('division_id', appForm.division_id);

    if (appForm.application_type === 'mandiri') {
      if (appForm.file_cv) formData.append('file_cv', appForm.file_cv);
      if (appForm.file_proposal) formData.append('file_proposal', appForm.file_proposal);
    } else {
      formData.append('recommendation_letter_number', appForm.recommendation_letter_number);
      if (appForm.file_recommendation_letter) formData.append('file_recommendation_letter', appForm.file_recommendation_letter);
      if (appForm.file_proposal) formData.append('file_proposal', appForm.file_proposal);
    }

    const res = await apiRequest('/applications/submit', {
      method: 'POST',
      body: formData,
    });

    if (res.success) {
      setMsg({ type: 'success', text: 'Pengajuan magang berhasil dikirimkan!' });
      setApplication(res.data);
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal mengirim pengajuan' });
    }
  };

  const handleCheckIn = async () => {
    const res = await apiRequest('/attendances/check-in', {
      method: 'POST',
      body: JSON.stringify({
        status: attendanceStatus,
        notes: attendanceNotes,
      }),
    });

    if (res.success) {
      setMsg({ type: 'success', text: 'Check-in presensi hari ini berhasil!' });
      loadAllData();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal check-in' });
    }
  };

  const handleCheckOut = async () => {
    const res = await apiRequest('/attendances/check-out', {
      method: 'POST',
      body: JSON.stringify({ notes: attendanceNotes }),
    });

    if (res.success) {
      setMsg({ type: 'success', text: 'Check-out presensi hari ini berhasil!' });
      loadAllData();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal check-out' });
    }
  };

  const handleLogbookSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('date', logbookForm.date);
    formData.append('activity_description', logbookForm.activity_description);
    if (logbookForm.attachment) formData.append('attachment', logbookForm.attachment);

    const res = await apiRequest('/logbooks', {
      method: 'POST',
      body: formData,
    });

    if (res.success) {
      setMsg({ type: 'success', text: 'Logbook harian berhasil disimpan!' });
      setLogbookForm({ date: new Date().toISOString().split('T')[0], activity_description: '', attachment: null });
      loadAllData();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal menyimpan logbook' });
    }
  };

  const handleTaskUpdate = async (taskId, newStatus, submissionNotes) => {
    const res = await apiRequest(`/tasks/${taskId}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status: newStatus,
        submission_notes: submissionNotes,
      }),
    });

    if (res.success) {
      setMsg({ type: 'success', text: 'Status tugas berhasil diperbarui!' });
      loadAllData();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal memperbarui status tugas' });
    }
  };

  const getStepStatus = (stepName) => {
    if (!application) return 'inactive';

    if (stepName === 'submit') {
      return 'completed';
    }

    if (stepName === 'kepegawaian') {
      if (application.status_kepegawaian === 'approved') return 'completed';
      if (application.status_kepegawaian === 'rejected') return 'rejected';
      return 'current';
    }

    if (stepName === 'kabid') {
      if (application.status_kepegawaian !== 'approved') return 'inactive';
      if (application.status_kabid === 'approved') return 'completed';
      if (application.status_kabid === 'rejected') return 'rejected';
      return 'current';
    }

    if (stepName === 'kadis') {
      if (application.status_kabid !== 'approved') return 'inactive';
      if (application.status_kadis === 'approved') return 'completed';
      if (application.status_kadis === 'rejected') return 'rejected';
      return 'current';
    }

    return 'inactive';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Portal Pemohon Magang</h2>
          <p className="text-sm text-slate-500 mt-1">
            Selamat datang, <span className="font-semibold text-slate-700">{user?.name}</span>. Pantau alur pendaftaran, presensi, logbook kegiatan, dan sertifikat Anda.
          </p>
        </div>
        {application?.final_status === 'accepted' && (
          <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Resmi Diterima Magang</span>
          </div>
        )}
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl text-sm border flex items-center justify-between ${
          msg.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ type: '', text: '' })} className="font-bold text-xs hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('application')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === 'application'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Status Pengajuan
        </button>

        {application?.final_status === 'accepted' && (
          <>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
                activeTab === 'attendance'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Presensi Harian
            </button>

            <button
              onClick={() => setActiveTab('logbook')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
                activeTab === 'logbook'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Logbook Harian
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
                activeTab === 'tasks'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              Tugas Magang ({tasks.length})
            </button>

            <button
              onClick={() => setActiveTab('certificate')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
                activeTab === 'certificate'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Award className="w-4 h-4" />
              Nilai & Sertifikat
            </button>
          </>
        )}
      </div>

      {/* TAB 1: STATUS PENGAJUAN & STEPPER */}
      {activeTab === 'application' && (
        <div className="space-y-6">
          {application ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nomor Registrasi Magang</span>
                  <p className="text-lg font-bold text-slate-900">#APP-{String(application.id).padStart(5, '0')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1 rounded-full font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    Jalur {application.application_type === 'mandiri' ? 'Mandiri' : 'Rekomendasi Kampus'}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold uppercase ${
                    application.final_status === 'accepted'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : application.final_status === 'rejected'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {application.final_status === 'accepted' ? 'Diterima' : application.final_status === 'rejected' ? 'Ditolak' : 'Dalam Proses Review'}
                  </span>
                </div>
              </div>

              {/* 4-Stage Sequential Approval Stepper */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
                  Alur Persetujuan 3 Tingkat Diskominfo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Step 1 */}
                  <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">Tahap 1</span>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Submisi Berkas</p>
                    <p className="text-xs text-slate-500 mt-1">Dokumen berhasil diunggah oleh pemohon.</p>
                  </div>

                  {/* Step 2 */}
                  <div className={`p-4 rounded-xl border relative ${
                    getStepStatus('kepegawaian') === 'completed'
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : getStepStatus('kepegawaian') === 'rejected'
                      ? 'bg-red-50/60 border-red-200'
                      : getStepStatus('kepegawaian') === 'current'
                      ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/20'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">Tahap 2</span>
                      {getStepStatus('kepegawaian') === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : getStepStatus('kepegawaian') === 'rejected' ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Verifikasi Kepegawaian</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {application.notes_kepegawaian || 'Pengecekan kelengkapan berkas & kuota dinas.'}
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className={`p-4 rounded-xl border relative ${
                    getStepStatus('kabid') === 'completed'
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : getStepStatus('kabid') === 'rejected'
                      ? 'bg-red-50/60 border-red-200'
                      : getStepStatus('kabid') === 'current'
                      ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/20'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">Tahap 3</span>
                      {getStepStatus('kabid') === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : getStepStatus('kabid') === 'rejected' ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Verifikasi Teknis Kabid</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {application.notes_kabid || 'Kesesuaian bidang teknis penempatan.'}
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className={`p-4 rounded-xl border relative ${
                    getStepStatus('kadis') === 'completed'
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : getStepStatus('kadis') === 'rejected'
                      ? 'bg-red-50/60 border-red-200'
                      : getStepStatus('kadis') === 'current'
                      ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/20'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">Tahap 4</span>
                      {getStepStatus('kadis') === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : getStepStatus('kadis') === 'rejected' ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Otorisasi Kadis</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {application.notes_kadis || 'Tanda tangan digital & penerbitan surat penerimaan.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Official Acceptance Letter Banner */}
              {application.final_status === 'accepted' && application.acceptance_letter_number && (
                <div className="p-5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-700/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Award className="w-6 h-6 text-emerald-200" />
                        <h4 className="text-base font-bold">Surat Penerimaan Magang Resmi Diterbitkan</h4>
                      </div>
                      <p className="text-xs text-emerald-100 mt-1">
                        Nomor Surat: <span className="font-mono font-bold text-white bg-emerald-800/60 px-2 py-0.5 rounded">{application.acceptance_letter_number}</span>
                      </p>
                      <p className="text-xs text-emerald-100 mt-1">
                        Bidang Penempatan: <span className="font-semibold text-white">{application.division?.name || 'Aptika'}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => alert(`Surat Penerimaan Magang No: ${application.acceptance_letter_number}\nStatus: Terotorisasi Digital oleh Kepala Diskominfo`)}
                      className="px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      Unduh Surat Penerimaan (PDF)
                    </button>
                  </div>
                </div>
              )}

              {/* Application Details Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-semibold uppercase">Asal Institusi / Kampus</span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{application.institution_name}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase">Periode Magang</span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{application.start_date} s/d {application.end_date}</p>
                </div>
                {application.recommendation_letter_number && (
                  <div>
                    <span className="text-slate-400 font-semibold uppercase">No. Surat Rekomendasi Kampus</span>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{application.recommendation_letter_number}</p>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 font-semibold uppercase">Bidang Penempatan</span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{application.division?.name || 'Menunggu verifikasi'}</p>
                </div>
              </div>
            </div>
          ) : (
            /* NEW APPLICATION FORM */
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Formulir Pengajuan Magang Baru</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pilih jalur pendaftaran (Mandiri atau Rekomendasi Kampus) dan lengkapi berkas persyaratan.
                </p>
              </div>

              {/* Application Type Tabs */}
              <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-slate-100 border border-slate-200 max-w-md">
                <button
                  type="button"
                  onClick={() => setAppForm({ ...appForm, application_type: 'mandiri' })}
                  className={`py-2 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    appForm.application_type === 'mandiri'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  Jalur Mandiri
                </button>
                <button
                  type="button"
                  onClick={() => setAppForm({ ...appForm, application_type: 'rekomendasi_kampus' })}
                  className={`py-2 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    appForm.application_type === 'rekomendasi_kampus'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Rekomendasi Kampus
                </button>
              </div>

              <form onSubmit={handleApplicationSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Nama Universitas / Sekolah
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Universitas Indonesia"
                      value={appForm.institution_name}
                      onChange={(e) => setAppForm({ ...appForm, institution_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {appForm.application_type === 'rekomendasi_kampus' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Nomor Surat Rekomendasi Kampus
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: 421.4/UNIV/III/2026"
                        value={appForm.recommendation_letter_number}
                        onChange={(e) => setAppForm({ ...appForm, recommendation_letter_number: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Tanggal Mulai Magang
                    </label>
                    <input
                      type="date"
                      required
                      value={appForm.start_date}
                      onChange={(e) => setAppForm({ ...appForm, start_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Tanggal Selesai Magang
                    </label>
                    <input
                      type="date"
                      required
                      value={appForm.end_date}
                      onChange={(e) => setAppForm({ ...appForm, end_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Pilihan Peminatan Bidang Diskominfo
                    </label>
                    <select
                      value={appForm.division_id}
                      onChange={(e) => setAppForm({ ...appForm, division_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Pilih Bidang (Opsional / Ditentukan Kepegawaian)</option>
                      {divisions.map((d) => (
                        <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* File Uploads */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Upload Proposal Magang (PDF, max 10MB)
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      required
                      onChange={(e) => setAppForm({ ...appForm, file_proposal: e.target.files[0] })}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  {appForm.application_type === 'mandiri' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Upload Curriculum Vitae (CV) (PDF, max 5MB)
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        required
                        onChange={(e) => setAppForm({ ...appForm, file_cv: e.target.files[0] })}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Surat Rekomendasi Resmi Kampus (PDF, max 5MB)
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        required
                        onChange={(e) => setAppForm({ ...appForm, file_recommendation_letter: e.target.files[0] })}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md shadow-blue-500/20 transition flex items-center gap-2 text-sm"
                >
                  <Send className="w-4 h-4" />
                  Kirimkan Berkas Pengajuan Magang
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRESENSI HARIAN */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Check-In Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs md:col-span-1 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Presensi Hari Ini
              </h3>
              <p className="text-xs text-slate-500">
                Tanggal: <span className="font-semibold text-slate-700">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </p>

              {todayAttendance?.check_in_time ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Sudah Check-In</span>
                  </div>
                  <p>Waktu Check-In: <span className="font-mono font-bold">{todayAttendance.check_in_time}</span></p>
                  <p>Status: <span className="font-semibold uppercase">{todayAttendance.status}</span></p>
                  {todayAttendance.check_out_time ? (
                    <p>Waktu Check-Out: <span className="font-mono font-bold">{todayAttendance.check_out_time}</span></p>
                  ) : (
                    <button
                      onClick={handleCheckOut}
                      className="mt-2 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs transition"
                    >
                      Lakukan Check-Out Sekarang
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Status Kehadiran</label>
                    <select
                      value={attendanceStatus}
                      onChange={(e) => setAttendanceStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="present">Hadir Tepat Waktu</option>
                      <option value="late">Hadir Terlambat</option>
                      <option value="sick">Sakit</option>
                      <option value="leave">Izin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Catatan / Keterangan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Tugas lapangan di Diskominfo"
                      value={attendanceNotes}
                      onChange={(e) => setAttendanceNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <button
                    onClick={handleCheckIn}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-xs transition"
                  >
                    Kirim Check-In Presensi
                  </button>
                </div>
              )}
            </div>

            {/* Attendance History Table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs md:col-span-2">
              <h3 className="text-base font-bold text-slate-900 mb-4">Riwayat Presensi</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Check-In</th>
                      <th className="py-2.5 px-3">Check-Out</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendances.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-4 text-center text-slate-400">Belum ada riwayat presensi.</td>
                      </tr>
                    ) : (
                      attendances.map((att) => (
                        <tr key={att.id}>
                          <td className="py-2.5 px-3 font-semibold text-slate-700">{att.date}</td>
                          <td className="py-2.5 px-3 font-mono">{att.check_in_time || '-'}</td>
                          <td className="py-2.5 px-3 font-mono">{att.check_out_time || '-'}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              att.status === 'present' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {att.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{att.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOGBOOK HARIAN */}
      {activeTab === 'logbook' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Submit Logbook Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs md:col-span-1 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Catat Logbook Harian
            </h3>
            <form onSubmit={handleLogbookSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tanggal Kegiatan</label>
                <input
                  type="date"
                  required
                  value={logbookForm.date}
                  onChange={(e) => setLogbookForm({ ...logbookForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Deskripsi Kegiatan</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Rincian aktivitas dan pencapaian kerja magang..."
                  value={logbookForm.activity_description}
                  onChange={(e) => setLogbookForm({ ...logbookForm, activity_description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Lampiran / Bukti (PDF / Foto)</label>
                <input
                  type="file"
                  onChange={(e) => setLogbookForm({ ...logbookForm, attachment: e.target.files[0] })}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-xs transition"
              >
                Kirim Logbook ke Pembimbing
              </button>
            </form>
          </div>

          {/* Logbook Entries List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs md:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Riwayat Catatan Logbook</h3>
            <div className="space-y-3">
              {logbooks.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Belum ada catatan logbook yang dibuat.</p>
              ) : (
                logbooks.map((lb) => (
                  <div key={lb.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{lb.date}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        lb.verification_status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : lb.verification_status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {lb.verification_status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 whitespace-pre-line">{lb.activity_description}</p>
                    {lb.mentor_notes && (
                      <div className="text-xs p-2 rounded bg-blue-50/60 border border-blue-100 text-blue-800">
                        <span className="font-semibold">Catatan Mentor:</span> {lb.mentor_notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TASKS DARI MENTOR */}
      {activeTab === 'tasks' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-blue-600" />
            Daftar Penugasan dari Pembimbing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 col-span-2 text-center">Belum ada tugas yang diberikan oleh pembimbing.</p>
            ) : (
              tasks.map((t) => (
                <div key={t.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">{t.title}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      t.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : t.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{t.description}</p>
                  {t.deadline && (
                    <p className="text-[11px] text-slate-400">
                      Tenggat: <span className="font-semibold text-slate-700">{new Date(t.deadline).toLocaleDateString('id-ID')}</span>
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">Ubah Status:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTaskUpdate(t.id, 'in_progress', t.submission_notes)}
                        className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-[11px] rounded font-semibold text-slate-700"
                      >
                        Sedang Dikerjakan
                      </button>
                      <button
                        onClick={() => handleTaskUpdate(t.id, 'completed', 'Tugas telah diselesaikan.')}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-[11px] rounded font-semibold text-white"
                      >
                        Selesai
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: NILAI & SERTIFIKAT QR */}
      {activeTab === 'certificate' && (
        <div className="space-y-6">
          {certificate ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                <Award className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Sertifikat Magang Resmi Diskominfo</span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">Sertifikat Kelulusan Magang Digital</h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">No. Sertifikat: {certificate.certificate_number}</p>
              </div>

              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase">Nama Peserta</span>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{user?.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase">Bidang Penempatan</span>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{certificate.intern?.division?.name || 'Aptika'}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <span className="text-slate-400 font-semibold uppercase text-xs">Kode Validasi QR Hash</span>
                  <p className="font-mono text-xs text-slate-600 break-all bg-white p-2.5 rounded-lg border border-slate-200 mt-1">
                    {certificate.qr_hash}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`/api/public/verify-cert/${certificate.qr_hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-xs transition flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  Verifikasi Publik Kode QR
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center space-y-3">
              <Award className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">Sertifikat Belum Diterbitkan</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Sertifikat magang digital akan diterbitkan secara otomatis setelah pembimbing lapangan menyelesaikan penilaian akhir kinerja magang Anda.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

