import React, { useEffect, useState } from 'react';
import { apiRequest, getToken } from '../api';

export default function MentorAttendanceReview() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [rejectionId, setRejectionId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadQueue = async () => {
    setLoading(true);
    const response = await apiRequest('/attendances/pending-approval');
    setRecords(response.success ? response.data || [] : []);
    if (!response.success) setMessage(response.message || 'Antrean presensi gagal dimuat.');
    setLoading(false);
  };

  useEffect(() => { loadQueue(); }, []);
  useEffect(() => () => { if (preview?.url) URL.revokeObjectURL(preview.url); }, [preview]);

  const openFile = async (record, kind) => {
    try {
      const response = await fetch(`/api/attendances/${record.id}/files/${kind}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) throw new Error('Berkas tidak dapat dimuat.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreview({ url, type: blob.type, title: `${record.user?.name || 'Peserta'} · ${kind === 'selfie' ? 'Swafoto' : 'Lampiran'}` });
    } catch (error) {
      setMessage(error.message || 'Berkas tidak dapat dimuat.');
    }
  };

  const review = async (record, approvalStatus) => {
    if (approvalStatus === 'rejected' && !rejectionReason.trim()) {
      setRejectionId(record.id);
      setMessage('Masukkan alasan penolakan sebelum menolak presensi.');
      return;
    }
    setSaving(true);
    const response = await apiRequest(`/attendances/${record.id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ approval_status: approvalStatus, rejection_reason: approvalStatus === 'rejected' ? rejectionReason : null }),
    });
    setMessage(response.message || (response.success ? 'Presensi diperbarui.' : 'Keputusan gagal disimpan.'));
    if (response.success) {
      setRejectionId(null);
      setRejectionReason('');
      await loadQueue();
    }
    setSaving(false);
  };

  return <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold text-slate-900">Persetujuan Presensi</h2><p className="mt-1 text-sm text-slate-500">Periksa bukti kamera, lokasi, dan dokumen sebelum menyetujui.</p></div><button type="button" onClick={loadQueue} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Muat ulang</button></header>
    {message && <p role="status" className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}
    {loading ? <p className="py-10 text-center text-sm text-slate-500">Memuat antrean…</p> : records.length === 0 ? <p className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">Tidak ada presensi yang menunggu persetujuan.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Peserta / Tanggal</th><th className="p-3">Status & Waktu</th><th className="p-3">Lokasi</th><th className="p-3">Bukti</th><th className="p-3">Keputusan</th></tr></thead><tbody className="divide-y divide-slate-100">{records.map((record) => <tr key={record.id} className="align-top"><td className="p-3"><strong>{record.user?.name}</strong><p className="text-xs text-slate-500">{record.date}</p></td><td className="p-3"><span className="capitalize">{record.status}</span><p className="text-xs text-slate-500">{record.clock_in_at || record.check_in_time || '—'}</p></td><td className="p-3">{record.is_within_radius === null ? 'Tidak diperlukan' : record.is_within_radius ? <span className="font-semibold text-emerald-700">Dalam radius · {Math.round(record.distance_meters || 0)} m</span> : <span className="font-semibold text-rose-700">Di luar radius</span>}</td><td className="space-y-2 p-3">{(record.selfie_path || record.photo_in) && <button type="button" onClick={() => openFile(record, 'selfie')} className="block text-xs font-semibold text-blue-700 underline">Lihat swafoto</button>}{record.attachment_path && <button type="button" onClick={() => openFile(record, 'attachment')} className="block text-xs font-semibold text-blue-700 underline">Lihat surat lampiran</button>}{!record.attachment_path && !record.selfie_path && !record.photo_in && '—'}</td><td className="w-64 p-3"><div className="flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={() => review(record, 'approved')} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Setujui</button><button type="button" disabled={saving} onClick={() => { setRejectionId(record.id); setRejectionReason(''); }} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Tolak</button></div>{rejectionId === record.id && <div className="mt-2 space-y-2"><textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} rows={2} placeholder="Alasan penolakan" className="w-full rounded-lg border border-slate-200 p-2 text-xs" /><button type="button" disabled={saving || !rejectionReason.trim()} onClick={() => review(record, 'rejected')} className="rounded-lg bg-rose-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Konfirmasi Tolak</button></div>}</td></tr>)}</tbody></table></div>}
    {preview && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4" onClick={() => setPreview(null)}><div className="max-h-[90vh] max-w-4xl overflow-auto rounded-2xl bg-white p-3" onClick={(event) => event.stopPropagation()}><div className="mb-2 flex items-center justify-between gap-3"><strong className="text-sm">{preview.title}</strong><button type="button" onClick={() => setPreview(null)} className="rounded-lg px-3 py-1 text-slate-500">Tutup</button></div>{preview.type === 'application/pdf' ? <iframe title={preview.title} src={preview.url} className="h-[75vh] w-[min(80vw,900px)]" /> : <img src={preview.url} alt={preview.title} className="max-h-[80vh] max-w-full object-contain" />}</div></div>}
  </section>;
}
