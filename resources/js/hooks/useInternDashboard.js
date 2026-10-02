import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest, getToken } from '../api';
import { formatLocalTime, formatWitaDateTime } from '../utils/dateFormatter';
import { getGrade } from '../utils/evaluation';
import { downloadTaskSubmission } from '../utils/downloadTaskSubmission';

const getCollection = (response) => Array.isArray(response?.data) ? response.data : response?.data?.data || [];
const initialLogbookForm = { date: '', activity_description: '', attachment: null };
const initialTaskForm = { submission_notes: '', submission_file: null };

export default function useInternDashboard(user) {
  const [now, setNow] = useState(new Date());
  const [attendance, setAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [logbooks, setLogbooks] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [application, setApplication] = useState(null);
  const [progressMetrics, setProgressMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [isLogbookModalOpen, setIsLogbookModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [logbookForm, setLogbookForm] = useState(initialLogbookForm);
  const [taskForm, setTaskForm] = useState(initialTaskForm);

  const loadDashboard = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [attendanceResponse, historyResponse, attendanceSummaryResponse, taskResponse, logbookResponse, evaluationResponse, certificateResponse, applicationResponse, metricsResponse] = await Promise.all([
        apiRequest('/attendances/today'), apiRequest('/attendances?per_page=1000'), apiRequest('/attendances/summary'), apiRequest('/tasks'), apiRequest('/logbooks?per_page=1000'),
        apiRequest('/evaluations'), apiRequest('/certificates/my-certificate'), apiRequest('/applications/my-application'),
        apiRequest(`/evaluations/metrics/${user.id}`),
      ]);
      if (attendanceResponse.success) setAttendance(attendanceResponse.data || null);
      if (historyResponse.success) setAttendanceHistory(getCollection(historyResponse));
      if (attendanceSummaryResponse.success) setAttendanceSummary(attendanceSummaryResponse.data || null);
      if (taskResponse.success) setTasks(getCollection(taskResponse));
      if (logbookResponse.success) setLogbooks(getCollection(logbookResponse));
      if (evaluationResponse.success) setEvaluation(getCollection(evaluationResponse)[0] || null);
      if (certificateResponse.success) setCertificate(certificateResponse.data || null);
      if (applicationResponse.success) setApplication(applicationResponse.data || null);
      if (metricsResponse.success) setProgressMetrics(metricsResponse.data || null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboard();
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [loadDashboard]);

  const notify = (text, type = 'success') => {
    setMessage({ text, type });
    window.setTimeout(() => setMessage(null), 4000);
  };

  const submitLogbook = async (event) => {
    event.preventDefault(); setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('date', logbookForm.date); payload.append('activity_description', logbookForm.activity_description);
      if (logbookForm.attachment) payload.append('attachment', logbookForm.attachment);
      const response = await apiRequest('/logbooks', { method: 'POST', body: payload });
      notify(response.message || (response.success ? 'Logbook berhasil dikirim.' : 'Logbook gagal dikirim.'), response.success ? 'success' : 'error');
      if (response.success) { setIsLogbookModalOpen(false); setLogbookForm(initialLogbookForm); await loadDashboard(); }
    } finally { setSubmitting(false); }
  };

  const submitTask = async (event) => {
    event.preventDefault(); if (!selectedTask) return;
    if (taskForm.submission_file && taskForm.submission_file.size > 30 * 1024 * 1024) {
      return notify('Ukuran berkas pengumpulan maksimal 30 MB.', 'error');
    }
    setSubmitting(true);
    try {
      const payload = new FormData(); payload.append('status', 'completed'); payload.append('submission_notes', taskForm.submission_notes);
      if (taskForm.submission_file) payload.append('submission_file', taskForm.submission_file);
      const response = await apiRequest(`/tasks/${selectedTask.id}/status`, { method: 'PUT', body: payload });
      notify(response.message || (response.success ? 'Tugas berhasil dikumpulkan.' : 'Tugas gagal dikumpulkan.'), response.success ? 'success' : 'error');
      if (response.success) { setSelectedTask(null); setTaskForm(initialTaskForm); await loadDashboard(); }
    } finally { setSubmitting(false); }
  };

  const downloadTaskFile = async (task) => {
    const result = await downloadTaskSubmission(task);
    if (!result.success) notify(result.message, 'error');
  };

  const downloadCertificate = async () => {
    if (!certificate?.pdf_path) return;
    const response = await fetch(`/storage/${certificate.pdf_path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!response.ok) return notify('Sertifikat belum dapat diunduh.', 'error');
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a'); link.href = url; link.download = 'sertifikat-magang.pdf'; link.click(); URL.revokeObjectURL(url);
  };

  const activeTasks = useMemo(() => tasks.filter((task) => task.status !== 'completed'), [tasks]);
  const hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Makassar' }).format(now));
  const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';

  return {
    now, attendance, attendanceHistory, attendanceSummary, progressMetrics, tasks, logbooks, evaluation, certificate, application, loading, submitting, message,
    setMessage, isLogbookModalOpen, setIsLogbookModalOpen, isCheckInModalOpen, setIsCheckInModalOpen,
    selectedTask, setSelectedTask,
    logbookForm, setLogbookForm, taskForm, setTaskForm, activeTasks, greeting,
    institution: application?.institution_name || 'Institusi belum diatur',
    division: application?.division?.name || user?.division?.name || 'Bidang belum ditetapkan',
    checkedInAt: formatLocalTime(attendance?.check_in_time), checkedOutAt: formatLocalTime(attendance?.check_out_time),
    grade: getGrade(evaluation?.final_score), currentTime: formatWitaDateTime(now, { hour: '2-digit', minute: '2-digit' }),
    loadDashboard, submitLogbook, submitTask, downloadTaskFile, downloadCertificate,
  };
}
