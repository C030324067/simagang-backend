import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';

const rubric = [
  ['score_discipline', 'Disiplin & Ketepatan Waktu'],
  ['score_quality', 'Kualitas Kerja & Tanggung Jawab'],
  ['score_initiative', 'Inisiatif & Pemecahan Masalah'],
  ['score_teamwork', 'Kerja Sama & Komunikasi'],
];

export default function MentorFinalEvaluation({ interns, evaluations, onSaved, onGenerateCertificate }) {
  const [internId, setInternId] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [scores, setScores] = useState({ score_discipline: 85, score_quality: 85, score_initiative: 85, score_teamwork: 85, notes: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!internId) { setMetrics(null); return undefined; }
    let active = true;
    setLoading(true);
    apiRequest(`/evaluations/metrics/${encodeURIComponent(internId)}`).then((response) => {
      if (!active) return;
      if (response.success) setMetrics(response.data);
      else { setMetrics(null); setMessage(response.message || 'Metrik peserta gagal dimuat.'); }
    }).catch(() => { if (active) setMessage('Metrik peserta gagal dimuat.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [internId]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    const response = await apiRequest('/evaluations', { method: 'POST', body: JSON.stringify({ intern_id: internId, ...scores }) });
    setMessage(response.message || (response.success ? 'Evaluasi tersimpan.' : 'Evaluasi gagal disimpan.'));
    if (response.success) await onSaved?.();
    setSaving(false);
  };

  const selectedEvaluation = evaluations.find((evaluation) => String(evaluation.intern_id) === String(internId));
  const total = Object.fromEntries(rubric.map(([key]) => [key, Number(scores[key]) || 0]));
  const estimatedScore = ((total.score_discipline + total.score_quality + total.score_initiative + total.score_teamwork) / 4).toFixed(2);

  return <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
    <div><p className="text-xs font-bold uppercase tracking-wider text-amber-700">Evaluasi akhir</p><h2 className="mt-1 text-xl font-extrabold text-slate-900">Rubrik Penilaian Mentor</h2><p className="mt-1 text-sm text-slate-500">Nilai empat kriteria dengan skala 1–100. Nilai akhir dihitung sebagai rata-rata berbobot sama.</p></div>
    {message && <p role="status" className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}
    <label className="block"><span className="mb-1 block text-xs font-bold text-slate-600">Peserta magang</span><select required value={internId} onChange={(event) => setInternId(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">Pilih peserta</option>{interns.map((intern) => <option key={intern.id} value={intern.id}>{intern.name}</option>)}</select></label>
    {internId && <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
        ['Total Tugas', metrics?.total_tasks], ['Tugas Selesai', metrics?.completed_tasks], ['Sedang Dikerjakan', metrics?.in_progress_tasks], ['Perlu Revisi', metrics?.revision_tasks],
      ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3"><p className="text-[11px] font-semibold text-slate-500">{label}</p><strong className="mt-1 block text-2xl text-slate-900">{loading ? '…' : value ?? 0}</strong></div>)}</div>
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-blue-950">Kelengkapan jurnal kerja</span><strong className="text-lg text-blue-900">{metrics?.logbook_completion_percentage ?? 0}%</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${Math.min(100, metrics?.logbook_completion_percentage || 0)}%` }} /></div><p className="mt-2 text-xs text-blue-800">{metrics?.filled_working_days ?? 0} dari {metrics?.total_working_days ?? 0} hari kerja terisi.</p></div>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">{rubric.map(([key, label]) => <label key={key} className="block"><span className="mb-1 block text-xs font-bold text-slate-700">{label}</span><input type="number" min="1" max="100" required value={scores[key]} onChange={(event) => setScores((previous) => ({ ...previous, [key]: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" /></label>)}</div>
        <label className="block"><span className="mb-1 block text-xs font-bold text-slate-700">Catatan mentor</span><textarea rows={3} maxLength={2000} value={scores.notes} onChange={(event) => setScores((previous) => ({ ...previous, notes: event.target.value }))} className="w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="Ringkasan kinerja dan rekomendasi" /></label>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-4"><p className="text-sm font-semibold text-emerald-900">Perkiraan nilai akhir: {estimatedScore}</p><button disabled={saving || loading || !metrics} type="submit" className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Menyimpan…' : selectedEvaluation ? 'Perbarui Evaluasi' : 'Simpan Evaluasi Akhir'}</button></div>
      </form>
      {selectedEvaluation && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 p-4"><p className="text-sm text-slate-700">Tersimpan: <strong>{selectedEvaluation.final_score} · {selectedEvaluation.grade_letter || '—'}</strong></p><button type="button" onClick={() => onGenerateCertificate?.(internId)} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">Terbitkan Sertifikat</button></div>}
    </>}
  </section>;
}
