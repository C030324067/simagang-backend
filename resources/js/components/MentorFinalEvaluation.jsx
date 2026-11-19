import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { apiRequest } from '../api';
import { apiErrorMessage } from '../utils/apiErrorMessage';
import AutoDismissNotice from './AutoDismissNotice';

const rubric = [
  ['score_discipline', 'Disiplin'],
  ['score_quality', 'Perilaku dan Sopan Santun'],
  ['score_initiative', 'Inisiatif dan Kreativitas'],
  ['score_teamwork', 'Motivasi'],
  ['score_softskill', 'Komunikasi dan Kerjasama'],
];

const initialTechnicalScores = () => Array.from({ length: 5 }, (_, index) => ({
  criteria: `Aspek Teknis ${index + 1}`,
  score: 85,
}));

const educationLevelOf = (intern) => {
  const level = intern?.application?.jenjang || intern?.education_level || '';
  if (level) return /smk/i.test(level) ? 'SMK' : 'Kuliah';
  const institution = intern?.institution || '';
  if (/(^|\W)smk(s|n)?(\W|$)|sekolah menengah kejuruan/i.test(institution)) return 'SMK';
  if (/universitas|perguruan tinggi|politeknik|institut|sekolah tinggi|stimik|akademi/i.test(institution)) return 'Kuliah';
  return /^\d{10}$/.test(String(intern?.application?.student_number || '')) ? 'SMK' : 'Kuliah';
};

const gradeFor = (score) => {
  if (score >= 90) return ['A', 'SANGAT BAIK'];
  if (score >= 75) return ['B', 'BAIK'];
  if (score >= 60) return ['C', 'CUKUP'];
  return ['D', 'KURANG'];
};

export default function MentorFinalEvaluation({ interns, evaluations, onSaved }) {
  const [internId, setInternId] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [scores, setScores] = useState(Object.fromEntries(rubric.map(([key]) => [key, 85])));
  const [technicalScores, setTechnicalScores] = useState(initialTechnicalScores);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const selectedIntern = interns.find((intern) => String(intern.intern_id || intern.id) === String(internId));
  const isSmk = educationLevelOf(selectedIntern) === 'SMK';
  const selectedEvaluation = evaluations.find((evaluation) => (
    String(evaluation.internApplication?.user_id || evaluation.intern?.id || evaluation.intern_id) === String(internId)
  ));

  useEffect(() => {
    if (!internId) {
      setMetrics(null);
      return undefined;
    }

    let active = true;
    setLoading(true);
    apiRequest(`/evaluations/metrics/${encodeURIComponent(internId)}`).then((response) => {
      if (!active) return;
      if (response.success) setMetrics(response.data);
      else {
        setMetrics(null);
        setMessage(apiErrorMessage(response, 'Metrik peserta gagal dimuat.'));
      }
    }).catch(() => {
      if (active) setMessage('Metrik peserta gagal dimuat.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [internId]);

  useEffect(() => {
    const evaluation = evaluations.find((item) => (
      String(item.internApplication?.user_id || item.intern?.id || item.intern_id) === String(internId)
    ));
    setScores(Object.fromEntries(rubric.map(([key]) => [key, evaluation?.[key] ?? 85])));
    setTechnicalScores(evaluation?.technical_scores?.length
      ? evaluation.technical_scores.map((item) => ({ criteria: item.criteria, score: item.score }))
      : initialTechnicalScores());
  }, [internId, evaluations]);

  const skillTotal = rubric.reduce((total, [key]) => total + (Number(scores[key]) || 0), 0);
  const technicalTotal = technicalScores.reduce((total, item) => total + (Number(item.score) || 0), 0);
  const itemCount = rubric.length + technicalScores.length;
  const scoreTotal = skillTotal + technicalTotal;
  const estimatedScore = itemCount ? Math.round((scoreTotal / itemCount) * 100) / 100 : 0;
  const [estimatedGrade, estimatedDescription] = gradeFor(estimatedScore);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const response = await apiRequest('/evaluations', {
        method: 'POST',
        body: JSON.stringify({
          intern_id: internId,
          ...scores,
          technical_scores: technicalScores.map((item) => ({ ...item, score: Number(item.score) })),
        }),
      });
      setMessage(response.success ? response.message || 'Evaluasi tersimpan.' : apiErrorMessage(response, 'Evaluasi gagal disimpan.'));
      if (response.success) await onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="mentor-evaluation-form" className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Evaluasi akhir</p>
        <h2 className="mt-1 text-xl font-extrabold text-slate-900">Penilaian Akhir Peserta Magang</h2>
        <p className="mt-1 text-sm text-slate-500">Nilai akhir merata-ratakan lima aspek keterampilan Diskominfo dan aspek teknis yang dipilih mentor.</p>
      </div>
      {message && <AutoDismissNotice as="p" watch={message} role="status" className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">{message}</AutoDismissNotice>}

      <label className="block">
        <span className="mb-1 block text-xs font-bold text-slate-600">Peserta magang</span>
        <select
          id="mentor-evaluation-intern"
          required
          value={internId}
          onChange={(event) => setInternId(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        >
          <option value="">Pilih peserta magang</option>
          {interns.map((intern) => (
            <option key={intern.intern_id || intern.id} value={intern.intern_id || intern.id}>{intern.name}</option>
          ))}
        </select>
        {interns.length === 0 && <span className="mt-1 block text-xs text-amber-700">Belum ada peserta magang yang dapat dinilai.</span>}
      </label>

      {internId && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${isSmk ? 'bg-violet-100 text-violet-800' : 'bg-blue-100 text-blue-800'}`}>
              {isSmk ? 'SMK - PKL' : 'Perguruan Tinggi - Magang'}
            </span>
            <span className="text-sm font-semibold text-slate-700">{selectedIntern?.institution || 'Institusi tidak tersedia'}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[
              ['Total Tugas', metrics?.total_tasks],
              ['Tugas Selesai', metrics?.completed_tasks],
              ['Sedang Dikerjakan', metrics?.in_progress_tasks],
              ['Perlu Revisi', metrics?.revision_tasks],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold text-slate-500">{label}</p>
                <strong className="mt-1 block text-2xl text-slate-900">{loading ? '…' : value ?? 0}</strong>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-blue-950">Kelengkapan jurnal kerja</span>
              <strong className="text-lg text-blue-900">{metrics?.logbook_completion_percentage ?? 0}%</strong>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100">
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${Math.min(100, metrics?.logbook_completion_percentage || 0)}%` }} />
            </div>
            <p className="mt-2 text-xs text-blue-800">{metrics?.filled_working_days ?? 0} dari {metrics?.total_working_days ?? 0} hari kerja terisi.</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <section className="space-y-3">
              <div>
                <h3 className="font-bold text-slate-900">A. Keterampilan (Penilaian Tetap Diskominfo)</h3>
                <p className="mt-1 text-xs text-slate-500">Beri nilai 0–100 pada setiap aspek.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {rubric.map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="mb-1 block text-xs font-bold text-slate-700">{label}</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      required
                      value={scores[key]}
                      onChange={(event) => setScores((previous) => ({ ...previous, [key]: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900">B. Penilaian Teknis</h3>
                    <p className="mt-1 text-xs text-slate-500">Sesuaikan nama aspek teknis dengan kompetensi peserta (maksimal 7 aspek).</p>
                  </div>
                  <button
                    type="button"
                    disabled={technicalScores.length >= 7}
                    onClick={() => setTechnicalScores((previous) => [...previous, { criteria: '', score: 85 }])}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-800 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" /> Tambah Aspek Teknis
                  </button>
                </div>
                <div className="space-y-2">
                  {technicalScores.map((item, index) => (
                    <div key={index} className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
                      <input
                        required
                        maxLength={255}
                        aria-label={`Kriteria teknis ${index + 1}`}
                        placeholder={`Kriteria teknis ${index + 1}`}
                        value={item.criteria}
                        onChange={(event) => setTechnicalScores((previous) => previous.map((row, rowIndex) => rowIndex === index ? { ...row, criteria: event.target.value } : row))}
                        className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                      />
                      <input
                        required
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        aria-label={`Nilai teknis ${index + 1}`}
                        value={item.score}
                        onChange={(event) => setTechnicalScores((previous) => previous.map((row, rowIndex) => rowIndex === index ? { ...row, score: event.target.value } : row))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                      />
                      <button
                        type="button"
                        disabled={technicalScores.length <= 1}
                        onClick={() => setTechnicalScores((previous) => previous.filter((_, rowIndex) => rowIndex !== index))}
                        aria-label={`Hapus kriteria teknis ${index + 1}`}
                        className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-3 text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-4">
              <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-sm text-emerald-950 sm:grid-cols-4">
                <span>Jumlah Nilai <strong className="block">{scoreTotal.toFixed(2)}</strong></span>
                <span>Nilai Akhir <strong className="block">{estimatedScore.toFixed(2)}</strong></span>
                <span>Huruf Mutu <strong className="block">{estimatedGrade}</strong></span>
                <span>Sebutan <strong className="block">{estimatedDescription}</strong></span>
              </div>
              <button disabled={saving || loading || !metrics} type="submit" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Menyimpan…' : selectedEvaluation ? 'Perbarui Evaluasi' : 'Simpan Evaluasi Akhir'}
              </button>
            </div>
          </form>

          {selectedEvaluation && (
            <div className="rounded-2xl border border-emerald-200 p-4">
              <p className="text-sm text-slate-700">Tersimpan: <strong>{selectedEvaluation.final_score} · {selectedEvaluation.grade_letter || '—'}</strong></p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
