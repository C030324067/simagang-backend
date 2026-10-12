import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { apiRequest } from '../api';

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const currentDate = new Date();
const emptyForm = {
  division_id: '',
  year: currentDate.getFullYear(),
  quarter: Math.ceil((currentDate.getMonth() + 1) / 3),
  month: currentDate.getMonth() + 1,
  monthly_quota: '',
};

export default function InternshipPeriodSettings({ divisions }) {
  const [periods, setPeriods] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadPeriods = useCallback(async () => {
    const response = await apiRequest('/internship-periods');
    if (!response.success) {
      setNotice({ type: 'error', text: response.message || 'Pengaturan kuota gagal dimuat.' });
      setLoading(false);
      return;
    }
    setPeriods(response.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  useEffect(() => {
    if (!form.division_id && divisions.length) {
      setForm((previous) => ({ ...previous, division_id: String(divisions[0].id) }));
    }
  }, [divisions, form.division_id]);

  const updateMonth = (month) => {
    setForm((previous) => ({ ...previous, month, quarter: Math.ceil(month / 3) }));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    const response = await apiRequest('/internship-periods', {
      method: 'PUT',
      body: JSON.stringify({
        ...form,
        division_id: Number(form.division_id),
        year: Number(form.year),
        month: Number(form.month),
        quarter: Number(form.quarter),
        monthly_quota: Number(form.monthly_quota),
      }),
    });
    setSaving(false);
    if (!response.success) {
      setNotice({ type: 'error', text: response.message || 'Kuota periode gagal disimpan.' });
      return;
    }
    setNotice({ type: 'success', text: response.message });
    await loadPeriods();
  };

  const remove = async (period) => {
    if (!window.confirm(`Hapus kuota ${period.division?.name} untuk ${monthNames[period.month - 1]} ${period.year}? Pendaftaran periode ini akan ditutup.`)) return;
    const response = await apiRequest(`/internship-periods/${period.id}`, { method: 'DELETE' });
    if (!response.success) {
      setNotice({ type: 'error', text: response.message || 'Pengaturan kuota gagal dihapus.' });
      return;
    }
    setNotice({ type: 'success', text: response.message });
    await loadPeriods();
  };

  return (
    <section className="space-y-5 rounded-2xl border border-indigo-100 bg-white p-6 shadow-xs">
      <div>
        <h3 className="text-lg font-bold text-[#0F2942]">Pengaturan Kuota Periode Magang</h3>
        <p className="mt-1 text-sm text-slate-500">Tetapkan kuota pendaftaran untuk setiap divisi, bulan, dan triwulan. Periode tanpa pengaturan tidak menerima pendaftaran.</p>
      </div>

      {notice && (
        <div className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`} role={notice.type === 'error' ? 'alert' : 'status'}>
          {notice.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {notice.text}
        </div>
      )}

      <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6" onSubmit={save}>
        <label className="text-xs font-semibold text-slate-600">
          Divisi
          <select required value={form.division_id} onChange={(event) => setForm((previous) => ({ ...previous, division_id: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Pilih divisi</option>
            {divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Tahun
          <input required type="number" min="2000" max="2100" value={form.year} onChange={(event) => setForm((previous) => ({ ...previous, year: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Triwulan
          <select required value={form.quarter} onChange={(event) => {
            const quarter = Number(event.target.value);
            const month = (quarter - 1) * 3 + 1;
            setForm((previous) => ({ ...previous, quarter, month }));
          }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {[1, 2, 3, 4].map((quarter) => <option key={quarter} value={quarter}>Triwulan {quarter}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Bulan
          <select required value={form.month} onChange={(event) => updateMonth(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {monthNames.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Kuota pendaftar
          <input required type="number" min="0" max="100000" value={form.monthly_quota} onChange={(event) => setForm((previous) => ({ ...previous, monthly_quota: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <button type="submit" disabled={saving || divisions.length === 0} className="self-end rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? 'Menyimpan…' : 'Simpan kuota'}
        </button>
      </form>

      {loading ? <p className="text-sm text-slate-500">Memuat pengaturan kuota…</p> : periods.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Belum ada pengaturan kuota periode.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3">Divisi</th><th className="px-3 py-3">Periode</th><th className="px-3 py-3">Kuota</th><th className="px-3 py-3">Pendaftar</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {periods.map((period) => (
                <tr key={period.id}>
                  <td className="px-3 py-3 font-medium">{period.division?.name}</td>
                  <td className="px-3 py-3">{monthNames[period.month - 1]} {period.year} · Triwulan {period.quarter}</td>
                  <td className="px-3 py-3">{period.monthly_quota}</td>
                  <td className="px-3 py-3">{period.registered_count}</td>
                  <td className="px-3 py-3">{period.is_closed ? 'Penuh / ditutup' : 'Dibuka'}</td>
                  <td className="px-3 py-3">
                    <button type="button" onClick={() => remove(period)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                      <Trash2 className="h-3.5 w-3.5" /> Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
