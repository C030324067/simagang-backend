import { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { apiErrorMessage } from '../utils/apiErrorMessage';
import { downloadTaskFile } from '../utils/downloadTaskSubmission';

const collection = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const initialTaskForm = { title: '', description: '', assigned_to: '', deadline: '', task_file: null };

export default function useMentorDashboard() {
  const [activeTab, setActiveTab] = useState('logbooks');
  const [logbooks, setLogbooks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState(initialTaskForm);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logRes, taskRes, evalRes, appRes] = await Promise.all([
        apiRequest('/logbooks?per_page=1000'),
        apiRequest('/tasks?per_page=1000'),
        apiRequest('/evaluations?per_page=1000'),
        apiRequest('/applications?per_page=1000'),
      ]);
      const failures = [logRes, taskRes, evalRes, appRes].filter((response) => !response.success);
      if (failures.length) {
        setMsg({ type: 'error', text: apiErrorMessage(failures[0], 'Data dashboard mentor gagal dimuat.') });
      }
      if (logRes.success) setLogbooks(collection(logRes));
      if (taskRes.success) setTasks(collection(taskRes));
      if (evalRes.success) setEvaluations(collection(evalRes));
      if (appRes.success) {
        const applications = collection(appRes);
        const activeInterns = applications
          .filter((application) => application.final_status === 'accepted')
          .map((application) => ({
            ...application.user,
            intern_id: application.user?.id,
            application_id: application.id,
            institution: application.institution_name || application.institution || '—',
            division: application.division,
            start_date: application.start_date,
            end_date: application.end_date,
            application,
          }))
          .filter((intern) => intern.intern_id);
        setInterns(activeInterns);
        setTaskForm((previous) => ({
          ...previous,
          assigned_to: activeInterns.some((intern) => String(intern.intern_id) === String(previous.assigned_to))
            ? previous.assigned_to
            : '',
        }));
      }
    } catch (error) {
      setMsg({ type: 'error', text: error.message || 'Data dashboard mentor gagal dimuat.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const handleLoadApplication = async (applicationId) => {
    const response = await apiRequest(`/applications/${applicationId}`);
    if (!response.success) {
      setMsg({ type: 'error', text: apiErrorMessage(response, 'Detail pengajuan gagal dimuat.') });
      return;
    }
    setSelectedApplication(response.data);
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    if (taskForm.task_file && taskForm.task_file.size > 30 * 1024 * 1024) {
      setMsg({ type: 'error', text: 'Ukuran berkas instruksi maksimal 30 MB.' });
      return;
    }
    const payload = new FormData();
    payload.append('assigned_to', taskForm.assigned_to);
    payload.append('title', taskForm.title);
    payload.append('description', taskForm.description);
    if (taskForm.deadline) payload.append('deadline', taskForm.deadline);
    if (taskForm.task_file) payload.append('task_file', taskForm.task_file);

    const response = await apiRequest('/tasks', { method: 'POST', body: payload });
    setMsg({
      type: response.success ? 'success' : 'error',
      text: response.success ? response.message || 'Tugas berhasil dibuat.' : apiErrorMessage(response, 'Pembuatan tugas gagal.'),
    });
    if (response.success) {
      setShowTaskModal(false);
      setTaskForm(initialTaskForm);
      await loadData();
    }
  };

  const handleUpdateTaskStatus = async (task, status, catatanRevisi = '', revisionFile = null) => {
    let response;
    if (status === 'revision_needed' || revisionFile) {
      const payload = new FormData();
      payload.append('status', status);
      if (status === 'revision_needed') payload.append('catatan_revisi', catatanRevisi);
      if (revisionFile) payload.append('revision_file', revisionFile);
      response = await apiRequest(`/tasks/${task.id}/status`, { method: 'POST', body: payload });
    } else {
      response = await apiRequest(`/tasks/${task.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    }
    setMsg({
      type: response.success ? 'success' : 'error',
      text: response.success ? response.message || 'Status tugas berhasil diperbarui.' : apiErrorMessage(response, 'Status tugas gagal diperbarui.'),
    });
    if (response.success) await loadData();
    return response;
  };

  const handleDownloadTaskFile = async (task, kind) => {
    const result = await downloadTaskFile(task, kind);
    setMsg({ type: result.success ? 'success' : 'error', text: result.success ? 'Berkas berhasil diunduh.' : result.message });
  };

  return {
    activeTab, setActiveTab, logbooks, tasks, evaluations, interns, loading, msg, setMsg,
    selectedApplication, setSelectedApplication, showTaskModal, setShowTaskModal,
    taskForm, setTaskForm, loadData, handleLoadApplication, handleCreateTask,
    handleUpdateTaskStatus, handleDownloadTaskFile,
  };
}
