import { useEffect, useState } from 'react';
import { apiRequest } from '../api';

export default function useApplicationReviewDashboard({ endpoint, initialStatus, initialNotes, successMessage, failureMessage }) {
  const [pendingApps, setPendingApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionForm, setActionForm] = useState({ status: initialStatus, notes: initialNotes });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await apiRequest(endpoint);
      if (response.success) setPendingApps(response.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const openReview = (application) => {
    setSelectedApp(application);
    setActionForm({ status: initialStatus, notes: initialNotes });
  };

  const submitDecision = async (status) => {
    if (!selectedApp) return;
    setSubmitting(true); setMsg({ type: '', text: '' });
    try {
      const response = await apiRequest(`/applications/${selectedApp.id}/status`, {
        method: 'PUT', body: JSON.stringify({ ...actionForm, status, rejection_note: actionForm.notes }),
      });
      if (response.success) { setMsg({ type: 'success', text: response.message || successMessage }); setSelectedApp(null); await loadData(); }
      else setMsg({ type: 'error', text: response.message || failureMessage });
    } finally { setSubmitting(false); }
  };

  const handleActionSubmit = (event) => {
    event.preventDefault();
    return submitDecision(actionForm.status);
  };

  return { pendingApps, selectedApp, setSelectedApp, actionForm, setActionForm, loading, submitting, msg, setMsg, openReview, handleActionSubmit, submitDecision };
}
