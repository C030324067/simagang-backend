import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';

const collection = (response) => response.data?.data ?? response.data ?? [];

export default function SmkAssessmentManager({ interns, onSaved }) {
  const smkInterns = interns.filter((intern) => intern.application?.jenjang === 'SMK');
  const [applicationId, setApplicationId] = useState('');
  const [aspects, setAspects] = useState([]);
  const [scores, setScores] = useState({});
  const [newAspect, setNewAspect] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiRequest('/penilaian-smk/aspects').then((response) => {
      if (response.success) setAspects(collection(response));
    });
  }, []);

  useEffect(() => {
    if (!applicationId) return;
    apiRequest(`/penilaian-smk/${applicationId}`).then((response) => {
      if (response.success) {
        setScores(Object.fromEntries(collection(response).map((score) => [score.aspek, score])));
      }
    });
  }, [applicationId]);

  const addAspect = async (event) => {
    event.preventDefault();
    const response = await apiRequest('/penilaian-smk/aspects', { method: 'POST', body: JSON.stringify({ nama: newAspect }) });
    if (response.success) {
      setAspects((current) => [...current, collection(response)]);
      setNewAspect('');
      setMessage('Aspek penilaian ditambahkan.');
    } else setMessage(response.message || 'Aspek gagal ditambahkan.');
  };

  const renameAspect = async (aspect) => {
    const nama = window.prompt('Nama aspek penilaian', aspect.nama)?.trim();
    if (!nama || nama === aspect.nama) return;
    const response = await apiRequest(`/penilaian-smk/aspects/${aspect.id}`, { method: 'PUT', body: JSON.stringify({ nama }) });
    if (response.success) {
      setAspects((current) => current.map((item) => item.id === aspect.id ? collection(response) : item));
      setMessage('Aspek penilaian diperbarui.');
    } else setMessage(response.message || 'Aspek gagal diperbarui.');
  };

  const removeAspect = async (aspect) => {
    const response = await apiRequest(`/penilaian-smk/aspects/${aspect.id}`, { method: 'DELETE' });
    if (response.success) {
      setAspects((current) => current.filter((item) => item.id !== aspect.id));
      setScores((current) => Object.fromEntries(Object.entries(current).filter(([name]) => name !== aspect.nama)));
      setMessage('Aspek penilaian dihapus.');
    } else setMessage(response.message || 'Aspek gagal dihapus.');
  };

  const save = async (event) => {
    event.preventDefault();
    const nilai = aspects.map((aspect) => ({ aspek: aspect.nama, nilai: scores[aspect.nama]?.nilai ?? '', catatan: scores[aspect.nama]?.catatan ?? '' }));
    const response = await apiRequest(`/penilaian-smk/${applicationId}`, { method: 'PUT', body: JSON.stringify({ nilai }) });
    setMessage(response.success ? 'Penilaian SMK tersimpan.' : response.message || 'Penilaian gagal disimpan.');
    if (response.success) onSaved?.();
  };

  return <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
    <div><h2 className="text-lg font-bold text-slate-900">Penilaian peserta SMK</h2><p className="text-sm text-slate-500">Kelola aspek penilaian dan isi nilai secara terpisah dari penilaian kuliah.</p></div>
    <form onSubmit={addAspect} className="flex flex-wrap gap-2"><input required value={newAspect} onChange={(event) => setNewAspect(event.target.value)} placeholder="Nama aspek baru" className="min-w-48 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"/><button className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white">Tambah aspek</button></form>
    <select value={applicationId} onChange={(event) => setApplicationId(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"><option value="">Pilih peserta SMK</option>{smkInterns.map((intern) => <option key={intern.application_id} value={intern.application_id}>{intern.name}</option>)}</select>
    <div className="flex flex-wrap gap-2">{aspects.map((aspect) => <div key={aspect.id} className="rounded-lg bg-slate-100 px-3 py-2 text-xs">{aspect.nama}<button type="button" onClick={() => renameAspect(aspect)} className="ml-2 font-bold text-blue-700">Ubah</button><button type="button" onClick={() => removeAspect(aspect)} className="ml-2 font-bold text-red-700">Hapus</button></div>)}</div>
    {applicationId && <form onSubmit={save} className="space-y-3">{aspects.map((aspect) => <label key={aspect.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_8rem_1fr] sm:items-center"><span className="text-sm font-semibold">{aspect.nama}</span><input type="number" min="0" max="100" required value={scores[aspect.nama]?.nilai ?? ''} onChange={(event) => setScores((current) => ({ ...current, [aspect.nama]: { ...current[aspect.nama], nilai: event.target.value } }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Nilai"/><input value={scores[aspect.nama]?.catatan ?? ''} onChange={(event) => setScores((current) => ({ ...current, [aspect.nama]: { ...current[aspect.nama], catatan: event.target.value } }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Catatan (opsional)"/></label>)}<button className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white">Simpan nilai SMK</button></form>}
    {message && <p role="status" className="text-sm text-slate-600">{message}</p>}
  </section>;
}
