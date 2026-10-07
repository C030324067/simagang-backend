import { useEffect, useState } from 'react';
import { apiRequest, getToken } from '../api';
import { buildAcceptanceWhatsAppUrl } from '../utils/whatsapp';

export default function useKepegawaianDashboard() {
  const [pendingApps, setPendingApps] = useState([]);
  const [approvedApps, setApprovedApps] = useState([]);
  const [acceptedApps, setAcceptedApps] = useState([]);
  const [letterFiles, setLetterFiles] = useState({});
  const [letterNumbers, setLetterNumbers] = useState({});
  const [divisions, setDivisions] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionForm, setActionForm] = useState({ status: 'review_kabid', division_id: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [appsRes, divRes, acceptedRes] = await Promise.all([
        apiRequest('/applications/kepegawaian'),
        apiRequest('/divisions'),
        apiRequest('/applications?final_status=accepted&per_page=100'),
      ]);
      if (appsRes.success) {
        const applications = appsRes.data || [];
        setPendingApps(applications.filter((application) => application.status === 'pending_kepegawaian'));
        setApprovedApps(applications.filter((application) => ['approved_by_kadis', 'pending_letter_number', 'approved_kadis'].includes(application.status)));
      }
      if (acceptedRes.success) {
        setAcceptedApps(acceptedRes.data?.data || []);
      } else {
        setMsg({ type: 'error', text: acceptedRes.message || 'Daftar peserta diterima gagal dimuat.' });
      }
      if (divRes.success) {
        setDivisions(divRes.data || []);
        const availableDivision = divRes.data?.find((division) => division.remaining_quota > 0);
        if (availableDivision) setActionForm((previous) => ({ ...previous, division_id: previous.division_id || availableDivision.id }));
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const uploadLetter = async (applicationId) => {
    const file = letterFiles[applicationId];
    const officialLetterNumber = letterNumbers[applicationId]?.trim();
    if (!officialLetterNumber) { setMsg({ type: 'error', text: 'Masukkan nomor surat resmi terlebih dahulu.' }); return; }
    if (!file) { setMsg({ type: 'error', text: 'Pilih file surat penerimaan terlebih dahulu.' }); return; }
    const data = new FormData();
    data.append('official_letter_number', officialLetterNumber);
    data.append('official_letter_file', file);
    setSubmitting(true);
    try {
      const response = await apiRequest(`/applications/${applicationId}/upload-letter`, { method: 'POST', body: data });
      setMsg({ type: response.success ? 'success' : 'error', text: response.message || 'Gagal mengunggah surat.' });
      if (response.success) {
        setLetterFiles((previous) => ({ ...previous, [applicationId]: null }));
        setLetterNumbers((previous) => ({ ...previous, [applicationId]: '' }));
        const fileInput = document.getElementById(`file-upload-${applicationId}`);
        if (fileInput) fileInput.value = '';
        await loadData();
      }
    } finally { setSubmitting(false); }
  };

  const openDocument = async (applicationId, documentType) => {
    const previewWindow = window.open('about:blank', '_blank');

    if (!previewWindow) {
      setMsg({ type: 'error', text: 'Izinkan pop-up browser untuk membuka berkas.' });
      return;
    }

    try {
      const response = await fetch(`/api/applications/${applicationId}/documents/${documentType}`, {
        headers: {
          Accept: '*/*',
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        previewWindow.close();
        setMsg({ type: 'error', text: response.status === 404 ? 'Berkas tidak ditemukan.' : 'Berkas gagal dibuka.' });
        return;
      }

      const fileUrl = URL.createObjectURL(await response.blob());
      previewWindow.opener = null;
      previewWindow.location.href = fileUrl;
      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 120000);
    } catch {
      previewWindow.close();
      setMsg({ type: 'error', text: 'Berkas gagal dibuka. Periksa koneksi lalu coba lagi.' });
    }
  };

  const handleActionSubmit = async (event) => {
    event.preventDefault(); if (!selectedApp) return;
    setSubmitting(true); setMsg({ type: '', text: '' });
    try {
      const response = await apiRequest(`/applications/${selectedApp.id}/status`, { method: 'PUT', body: JSON.stringify({ ...actionForm, rejection_note: actionForm.notes }) });
      if (response.success) {
        setMsg({ type: 'success', text: response.message || 'Verifikasi kepegawaian berhasil diproses.' });
        setSelectedApp(null); await loadData();
      } else setMsg({ type: 'error', text: response.message || 'Gagal memproses verifikasi.' });
    } finally { setSubmitting(false); }
  };

  const sendAcceptanceWhatsApp = (application) => {
    const url = buildAcceptanceWhatsAppUrl({
      phone: application.user?.no_hp,
      name: application.user?.name,
      division: application.division?.name,
      letterUrl: application.official_letter_path ? `${window.location.origin}/storage/${application.official_letter_path}` : '',
    });
    if (!url) { setMsg({ type: 'error', text: 'Nomor WhatsApp atau surat penerimaan belum tersedia.' }); return; }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return {
    pendingApps, approvedApps, acceptedApps, letterFiles, setLetterFiles, letterNumbers, setLetterNumbers, divisions, selectedApp, setSelectedApp,
    actionForm, setActionForm, loading, submitting, msg, setMsg, uploadLetter, openDocument, handleActionSubmit, sendAcceptanceWhatsApp,
  };
}
