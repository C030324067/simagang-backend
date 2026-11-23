import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { apiRequest } from '../api';
import { apiErrorMessage } from '../utils/apiErrorMessage';
import AutoDismissNotice from './AutoDismissNotice';

const rubric = [
  ['score_discipline', 'Disiplin'],
  ['score_quality', 'Perilaku dan Sopan Santun'],
  ['score_initiative', 'Inisiatif'],
  ['score_teamwork', 'Motivasi'],
  ['score_softskill', 'Komunikasi dan Kerja Sama'],
];

const educationLevelOf = (intern) => {
  const level = intern?.application?.jenjang || intern?.education_level || '';
  if (level) return /smk/i.test(level) ? 'SMK' : 'Kuliah';
  const institution = intern?.institution || '';
  if (/(^|\W)smk(s|n)?(\W|$)|sekolah menengah kejuruan/i.test(institution)) return 'SMK';
  if (/universitas|perguruan tinggi|politeknik|institut|sekolah tinggi|stimik|akademi/i.test(institution)) return 'Kuliah';
  return /^\d{10}$/.test(String(intern?.application?.student_number || '')) ? 'SMK' : 'Kuliah';
};

export default function MentorFinalEvaluation({ interns, evaluations, onSaved }) {
  const [internId, setInternId] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [scores, setScores] = useState(Object.fromEntries(rubric.map(([key]) => [key, ''])));
  const [technicalScores, setTechnicalScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const selectedIntern = interns.find((intern) => String(intern.intern_id || intern.id) === String(internId));
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
    setScores(Object.fromEntries(rubric.map(([key]) => [key, evaluation?.[key] ?? ''])));
    setTechnicalScores(evaluation?.technical_scores?.length
      ? evaluation.technical_scores.map((item) => ({ criteria: item.criteria, score: item.score }))
      : []);
  }, [internId, evaluations]);

  const submit = async (event) => {
    event.preventDefault();
    if (technicalScores.length === 0) {
      setMessage('Peserta wajib memiliki minimal satu nilai teknis.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const response = await apiRequest('/evaluations', {
        method: 'POST',
        body: JSON.stringify({
          intern_id: internId,
          ...Object.fromEntries(rubric.map(([key]) => [key, Number(scores[key])])), 
          technical_scores: technicalScores.map((item) => ({ criteria: item.criteria.trim(), score: Number(item.score) })),
        }),
      });
      setMessage(response.success ? response.message || 'Evaluasi tersimpan.' : apiErrorMessage(response, 'Evaluasi gagal disimpan.'));
      if (response.success) await onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const institution = selectedIntern?.institution
    || selectedIntern?.application?.institution_name
    || 'Pilih peserta untuk melihat institusi';
  const completion = internId ? Number(metrics?.logbook_completion_percentage ?? 0) : null;
  const stats = internId ? [
    ['Total Tugas', metrics?.total_tasks],
    ['Tugas Selesai', metrics?.completed_tasks],
    ['Sedang Dikerjakan', metrics?.in_progress_tasks],
    ['Perlu Revisi', metrics?.revision_tasks],
  ] : [
    ['Total Tugas', null],
    ['Tugas Selesai', null],
    ['Sedang Dikerjakan', null],
    ['Perlu Revisi', null],
  ];

  return (
    <section id="mentor-evaluation-form" className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-7">
      <h2 className="mb-5 text-lg font-extrabold text-[#0F2942]">Daftar Evaluasi Kinerja</h2>
      {message && <AutoDismissNotice as="p" watch={message} role="status" className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">{message}</AutoDismissNotice>}

      <div className="space-y-5 rounded-2xl border border-slate-200/80 p-4 sm:p-5">
        <div>
          <label htmlFor="mentor-evaluation-intern" className="mb-2 block text-xs font-bold text-slate-700">Peserta magang</label>
          <div className="flex items-center gap-3">
            <select
              id="mentor-evaluation-intern"
              required
              value={internId}
              onChange={(event) => setInternId(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Pilih peserta</option>
              {interns.map((intern) => (
                <option key={intern.intern_id || intern.id} value={intern.intern_id || intern.id}>{intern.name}</option>
              ))}
            </select>
            <span className="max-w-[58%] rounded-xl bg-indigo-50 px-4 py-2.5 text-xs font-semibold text-indigo-600">
              {internId ? institution : 'Pilih peserta untuk melihat institusi'}
            </span>
          </div>
          {interns.length === 0 && <p className="mt-2 text-xs text-amber-700">Belum ada peserta magang yang dapat dinilai.</p>}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200/80 p-3.5">
              <p className="text-[11px] font-medium text-slate-500">{label}</p>
              <strong className="mt-1 block text-xl font-extrabold text-[#0F2942]">
                {internId ? (loading ? '—' : value ?? 0) : '—'}
              </strong>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-[#0F2942]">Kelengkapan jurnal kerja</span>
            <strong className="text-sm font-extrabold text-[#0F2942]">{internId ? `${completion ?? 0}%` : '-'}</strong>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-indigo-100">
            <div
              className="h-full rounded-full bg-[#4F46E5] transition-all"
              style={{ width: `${internId ? Math.min(100, completion || 0) : 0}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">
            {!internId
              ? 'Pilih peserta untuk melihat kelengkapan jurnal kerja.'
              : `${metrics?.filled_working_days ?? 0} dari ${metrics?.total_working_days ?? 0} hari kerja terisi.`}
          </p>
        </div>

        {internId && (
          <form onSubmit={submit} className="space-y-4">
            <section className="space-y-4 rounded-xl border border-slate-200/80 p-5">
              <h3 className="text-sm font-extrabold text-[#0F2942]">
                A. Keterampilan <span className="font-medium text-slate-400">(Penilaian Tetap Diskominfo)</span>
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {rubric.map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-700">{label}</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="0.01"
                      required
                      placeholder="1-100"
                      value={scores[key]}
                      onChange={(event) => setScores((previous) => ({ ...previous, [key]: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-4 rounded-xl border border-slate-200/80 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-[#0F2942]">B. Penilaian Teknis</h3>
                  <p className="mt-1 text-xs text-slate-400">Sesuaikan nama aspek teknis dengan kompetensi peserta (maksimal 7 aspek).</p>
                </div>
                <button
                  type="button"
                  disabled={technicalScores.length >= 7}
                  onClick={() => setTechnicalScores((previous) => [...previous, { criteria: '', score: '' }])}
                  className="shrink-0 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Tambah Aspek Teknis</span>
                </button>
              </div>
              <div className="space-y-2">
                {technicalScores.map((item, index) => (
                  <div key={index} className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
                    <input
                      required
                      maxLength={255}
                      aria-label={`Nama aspek teknis ${index + 1}`}
                      placeholder="Nama aspek/kriteria"
                      value={item.criteria}
                      onChange={(event) => setTechnicalScores((previous) => previous.map((row, rowIndex) => rowIndex === index ? { ...row, criteria: event.target.value } : row))}
                      className="min-w-0 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                    />
                    <input
                      required
                      type="number"
                      min="1"
                      max="100"
                      step="0.01"
                      placeholder="1-100"
                      aria-label={`Nilai teknis ${index + 1}`}
                      value={item.score}
                      onChange={(event) => setTechnicalScores((previous) => previous.map((row, rowIndex) => rowIndex === index ? { ...row, score: event.target.value } : row))}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setTechnicalScores((previous) => previous.filter((_, rowIndex) => rowIndex !== index))}
                      aria-label={`Hapus aspek teknis ${index + 1}`}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex justify-end">
              <button
                disabled={saving || loading || !metrics || technicalScores.length === 0}
                type="submit"
                className="rounded-xl bg-[#4F46E5] px-6 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : selectedEvaluation ? 'Perbarui Evaluasi' : 'Simpan Evaluasi Akhir'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
