import { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { downloadTaskSubmission } from '../utils/downloadTaskSubmission';

export default function useMentorDashboard() {
  const [activeTab, setActiveTab] = useState('logbooks');
  const [logbooks, setLogbooks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [selectedLogbook, setSelectedLogbook] = useState(null);
  const [logbookVerifyForm, setLogbookVerifyForm] = useState({ verification_status: 'approved', mentor_notes: '' });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigned_to: '', deadline: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [logRes, taskRes, evalRes, appRes] = await Promise.all([
        apiRequest('/logbooks'), apiRequest('/tasks'), apiRequest('/evaluations'),
        apiRequest('/applications?final_status=accepted&per_page=1000'),
      ]);
      if (logRes.success && logRes.data) setLogbooks(logRes.data.data || []);
      if (taskRes.success && taskRes.data) setTasks(taskRes.data.data || []);
      if (evalRes.success && evalRes.data) setEvaluations(evalRes.data.data || []);
      if (appRes.success && appRes.data) {
        const acceptedInterns = (appRes.data.data || []).map((application) => application.user)
          .filter((intern) => intern?.role === 'intern' && intern?.status_akun === 'approved');
        setInterns(acceptedInterns);
        setTaskForm((previous) => ({
          ...previous,
          assigned_to: acceptedInterns.some((intern) => String(intern.id) === String(previous.assigned_to)) ? previous.assigned_to : '',
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleVerifyLogbook = async (event) => {
    event.preventDefault();
    if (!selectedLogbook) return;
    const response = await apiRequest(`/logbooks/${selectedLogbook.id}/verify`, { method: 'PUT', body: JSON.stringify(logbookVerifyForm) });
    setMsg({ type: response.success ? 'success' : 'error', text: response.message || 'Verifikasi logbook gagal.' });
    if (response.success) { setSelectedLogbook(null); await loadData(); }
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    const response = await apiRequest('/tasks', { method: 'POST', body: JSON.stringify(taskForm) });
    setMsg({ type: response.success ? 'success' : 'error', text: response.message || 'Pembuatan tugas gagal.' });
    if (response.success) { setShowTaskModal(false); setTaskForm({ title: '', description: '', assigned_to: '', deadline: '' }); await loadData(); }
  };

  const handleUpdateTaskStatus = async (task, status, catatanRevisi = '') => {
    const response = await apiRequest(`/tasks/${task.id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, ...(status === 'revision_needed' ? { catatan_revisi: catatanRevisi } : {}) }),
    });
    setMsg({ type: response.success ? 'success' : 'error', text: response.message || 'Status tugas gagal diperbarui.' });
    if (response.success) await loadData();
    return response;
  };

  const handleGenerateCert = async (internId) => {
    const response = await apiRequest('/certificates/generate', { method: 'POST', body: JSON.stringify({ intern_id: internId }) });
    setMsg({ type: response.success ? 'success' : 'error', text: response.success ? `Sertifikat diterbitkan. Nomor: ${response.data.certificate_number}` : response.message || 'Penerbitan sertifikat gagal.' });
    if (response.success) await loadData();
  };

  const handleDownloadTaskSubmission = async (task) => {
    const result = await downloadTaskSubmission(task);
    setMsg({ type: result.success ? 'success' : 'error', text: result.success ? 'Berkas tugas berhasil diunduh.' : result.message });
  };

  return {
    activeTab, setActiveTab, logbooks, tasks, evaluations, interns, loading, msg, setMsg,
    selectedLogbook, setSelectedLogbook, logbookVerifyForm, setLogbookVerifyForm, showTaskModal, setShowTaskModal,
    taskForm, setTaskForm, loadData, handleVerifyLogbook, handleCreateTask, handleUpdateTaskStatus,
    handleGenerateCert, handleDownloadTaskSubmission,
  };
}
