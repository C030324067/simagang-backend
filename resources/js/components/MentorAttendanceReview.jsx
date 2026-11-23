import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { apiErrorMessage } from '../utils/apiErrorMessage';
import AutoDismissNotice from './AutoDismissNotice';

export default function MentorAttendanceReview() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(null);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/attendances?per_page=1000');
      setRecords(response.success ? (Array.isArray(response.data) ? response.data : response.data?.data || []) : []);
      setMessage(response.success ? '' : apiErrorMessage(response, 'Daftar presensi gagal dimuat.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadRecords(); }, []);
  useEffect(() => () => { if (preview?.url) URL.revokeObjectURL(preview.url); }, [preview]);

  const storageUrl = (path) => {
    const relativePath = String(path || '')
      .replace(/^https?:\/\/[^/]+/i, '')
      .replace(/^\/+/, '')
      .replace(/^(?:storage\/)+/i, '');

    return `/storage/${relativePath.split('/').map(encodeURIComponent).join('/')}`;
  };

  const openFile = async (record, kind) => {
    try {
      const path = kind === 'selfie' ? (record.selfie_path || record.photo_in) : record.attachment_path;
      if (!path) throw new Error('Berkas tidak ditemukan.');

      const response = await fetch(storageUrl(path));
      if (!response.ok) throw new Error('Berkas tidak dapat dimuat.');
      const blob = await response.blob();
      const extension = path.split('.').pop()?.toLowerCase();
      const detectedType = blob.type.split(';')[0];
      const fallbackType = extension === 'pdf' ? 'application/pdf' : `image/${extension === 'jpg' ? 'jpeg' : extension}`;
      const type = !detectedType || detectedType === 'application/octet-stream' ? fallbackType : detectedType;
      const previewBlob = blob.type === type ? blob : new Blob([blob], { type });
      setPreview({ url: URL.createObjectURL(previewBlob), type, title: `${record.user?.name || 'Peserta'} · ${kind === 'selfie' ? 'Swafoto' : 'Lampiran'}`, filename: path.split('/').pop() || 'lampiran' });
    } catch (error) {
      setMessage(error.message || 'Berkas tidak dapat dimuat.');
    }
  };

  return <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold text-slate-900">Monitoring Presensi</h2><p className="mt-1 text-sm text-slate-500">Presensi tercatat otomatis. Mentor dapat memantau bukti, lokasi, dan waktu.</p></div><button type="button" onClick={loadRecords} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Muat ulang</button></header>
    {message && <AutoDismissNotice as="p" watch={message} role="status" className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">{message}</AutoDismissNotice>}
    {loading ? <p className="py-10 text-center text-sm text-slate-500">Memuat presensi…</p> : records.length === 0 ? <p className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">Belum ada presensi tercatat.</p> : <div className="w-full overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Peserta / Tanggal</th><th className="p-3">Status & Waktu</th><th className="p-3">Lokasi</th><th className="p-3">Bukti</th><th className="p-3">Pencatatan</th></tr></thead><tbody className="divide-y divide-slate-100">{records.map((record) => <tr key={record.id} className="align-top"><td className="p-3"><strong>{record.user?.name}</strong><p className="text-xs text-slate-500">{record.date}</p></td><td className="p-3"><span className="capitalize">{record.status}</span><p className="text-xs text-slate-500">{record.clock_in_at || record.check_in_time || '—'}</p></td><td className="p-3">{record.is_within_radius === null ? 'Tidak diperlukan' : record.is_within_radius ? <span className="font-semibold text-emerald-700">Dalam radius · {Math.round(record.distance_meters || 0)} m</span> : <span className="font-semibold text-rose-700">Di luar radius</span>}</td><td className="space-y-2 p-3">{(record.selfie_path || record.photo_in) && <button type="button" onClick={() => openFile(record, 'selfie')} className="block text-xs font-semibold text-blue-700 underline">Lihat swafoto</button>}{record.attachment_path && <button type="button" onClick={() => openFile(record, 'attachment')} className="block text-xs font-semibold text-blue-700 underline">Lihat surat lampiran</button>}{!record.attachment_path && !record.selfie_path && !record.photo_in && '—'}</td><td className="p-3"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Tercatat otomatis</span></td></tr>)}</tbody></table></div>}
    {preview && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4" onClick={() => setPreview(null)}><div className="max-h-[90vh] max-w-4xl overflow-auto rounded-2xl bg-white p-3" onClick={(event) => event.stopPropagation()}><div className="mb-2 flex items-center justify-between gap-3"><strong className="text-sm">{preview.title}</strong><div className="flex items-center gap-2"><a href={preview.url} download={preview.filename} className="rounded-lg px-3 py-1 text-sm font-semibold text-blue-700">Unduh</a><button type="button" onClick={() => setPreview(null)} className="rounded-lg px-3 py-1 text-slate-500">Tutup</button></div></div>{preview.type === 'application/pdf' ? <iframe title={preview.title} src={preview.url} className="h-[75vh] w-[min(80vw,900px)]" /> : preview.type.startsWith('image/') ? <img src={preview.url} alt={preview.title} className="max-h-[80vh] max-w-full object-contain" /> : <p className="p-8 text-sm text-slate-600">Pratinjau tidak tersedia. Gunakan tombol Unduh.</p>}</div></div>}
  </section>;
}
