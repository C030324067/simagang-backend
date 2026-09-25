import React, { useMemo, useState } from 'react';
import '../../css/RegisterApplication.css';

const empty = { nama: '', email: '', bidang: '', institusi: '', jurusan: '', hp: '', tgl_mulai: '', tgl_selesai: '', pw: '', pw2: '' };
const docs = [
  { key: 'b1', label: 'Surat pengantar institusi', accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'b2', label: 'Curriculum Vitae (CV)', accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'b3', label: 'Transkrip nilai / rapor', accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'b4', label: 'Foto kartu pelajar / mahasiswa', accept: '.jpg,.jpeg,.png', imageOnly: true },
];
const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export default function RegisterApplicationPage({ onLogin }) {
  const [form, setForm] = useState(empty);
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [agreements, setAgreements] = useState([false, false]);
  const [visible, setVisible] = useState([false, false]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const duration = useMemo(() => {
    if (!form.tgl_mulai || !form.tgl_selesai || form.tgl_selesai < form.tgl_mulai) return null;
    const days = Math.round((Date.parse(`${form.tgl_selesai}T00:00:00Z`) - Date.parse(`${form.tgl_mulai}T00:00:00Z`)) / 86400000) + 1;
    return `${days} hari (sekitar ${(days / 30).toFixed(1)} bulan)`;
  }, [form.tgl_mulai, form.tgl_selesai]);

  const notify = (message, kind = 'success') => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 4000);
  };

  const validate = () => {
    const next = {};
    for (const [key, value] of Object.entries(form)) if (!String(value).trim()) next[key] = 'Kolom ini wajib diisi.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Masukkan alamat email yang valid.';
    if (form.pw && form.pw.length < 8) next.pw = 'Password minimal 8 karakter.';
    if (form.pw && form.pw2 && form.pw !== form.pw2) next.pw2 = 'Konfirmasi password tidak sama.';
    if (form.tgl_mulai && form.tgl_mulai < today) next.tgl_mulai = 'Tanggal mulai tidak boleh sebelum hari ini.';
    if (form.tgl_selesai && form.tgl_selesai < (form.tgl_mulai || today)) next.tgl_selesai = 'Tanggal selesai harus sama atau setelah tanggal mulai.';
    docs.forEach(({ key, imageOnly }) => {
      const file = files[key];
      if (!file) next[key] = 'Berkas ini wajib diunggah.';
      else if (file.size > 5 * 1024 * 1024) next[key] = 'Ukuran file maksimal 5 MB.';
      else if (imageOnly ? !['image/jpeg', 'image/png'].includes(file.type) : !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) next[key] = imageOnly ? 'Gunakan foto JPG atau PNG.' : 'Gunakan PDF, JPG, atau PNG.';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!agreements.every(Boolean)) return notify('Centang kedua pernyataan sebelum mendaftar.', 'error');
    if (!validate()) return notify('Periksa kembali data dan berkas yang ditandai.', 'error');
    setLoading(true);
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    Object.entries(files).forEach(([key, file]) => payload.append(key, file));
    try {
      const response = await fetch('/register-application', {
        method: 'POST', body: payload, headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
        },
        credentials: 'same-origin',
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 422) {
        const serverErrors = Object.fromEntries(Object.entries(result.errors || {}).map(([key, messages]) => [key, messages[0]]));
        setErrors(serverErrors);
        notify('Mohon perbaiki data yang belum sesuai.', 'error');
        return;
      }
      if (!response.ok) throw new Error(result.message || 'Pendaftaran gagal. Silakan coba lagi.');
      notify(result.message || 'Pendaftaran berhasil.');
      setTimeout(() => { if (onLogin) onLogin(); else window.location.assign(result.redirect_url || '/login'); }, 1200);
    } catch (error) {
      notify(error.message || 'Tidak dapat terhubung ke server.', 'error');
    } finally { setLoading(false); }
  };

  const field = (key, label, type = 'text', props = {}) => (
    <div className="field" key={key}>
      <label htmlFor={key}>{label}<span className="req"> *</span></label>
      {key === 'bidang' ? <select id={key} className={`input ${errors[key] ? 'invalid' : ''}`} value={form[key]} onChange={change}>
        <option value="">Pilih bidang</option><option>Aptika</option><option>Statistika</option><option>IKP</option>
      </select> : <input id={key} className={`input ${errors[key] ? 'invalid' : ''}`} type={type} value={form[key]} onChange={change} {...props} />}
      {errors[key] && <p className="error-msg">{errors[key]}</p>}
    </div>
  );
  function change(event) {
    const { id, value } = event.target;
    setForm(previous => ({ ...previous, [id]: value }));
    setErrors(previous => ({ ...previous, [id]: '' }));
  }

  return <div className="register-container"><main className="card">
    <header className="register-heading"><p className="eyebrow">SIMAGANG · PENDAFTARAN</p><h1>Daftar program magang</h1><p>Lengkapi data diri dan dokumen untuk mengajukan permohonan magang.</p></header>
    <form onSubmit={submit} noValidate>
      <p className="note full">Semua kolom bertanda <span className="req">*</span> wajib diisi.</p>
      {field('nama', 'Nama lengkap', 'text', { autoComplete: 'name' })}
      {field('email', 'Email address', 'email', { autoComplete: 'email' })}
      {field('bidang', 'Bidang yang diminati')}
      {field('institusi', 'Nama institusi')}
      {field('jurusan', 'Jurusan / program studi')}
      {field('hp', 'Nomor telepon / WhatsApp', 'tel', { autoComplete: 'tel' })}
      {field('tgl_mulai', 'Tanggal mulai magang', 'date', { min: today })}
      {field('tgl_selesai', 'Tanggal selesai magang', 'date', { min: form.tgl_mulai || today })}
      {duration && <p className="date-info full">Perkiraan durasi magang: <strong>{duration}</strong></p>}
      {['pw', 'pw2'].map((key, index) => <div className="field" key={key}>
        <label htmlFor={key}>{index ? 'Konfirmasi password' : 'Password'}<span className="req"> *</span></label>
        <div className="pw-wrap"><input id={key} className={`input ${errors[key] ? 'invalid' : ''}`} type={visible[index] ? 'text' : 'password'} value={form[key]} onChange={change} autoComplete={index ? 'new-password' : 'new-password'} />
          <button type="button" className="eye-btn" aria-label={visible[index] ? 'Sembunyikan password' : 'Tampilkan password'} onClick={() => setVisible(prev => prev.map((v, i) => i === index ? !v : v))}>{visible[index] ? 'Sembunyikan' : 'Tampilkan'}</button></div>
        {errors[key] && <p className="error-msg">{errors[key]}</p>}
      </div>)}
      <section className="berkas full"><h2>Dokumen pendukung</h2><p className="hint">PDF, JPG, atau PNG · maksimal 5 MB per berkas. Foto kartu hanya JPG/PNG.</p>
        <div className="berkas-grid">{docs.map(({ key, label, accept }) => <div className="field" key={key}>
          <label htmlFor={key}>{label}<span className="req"> *</span></label>
          <input id={key} className={`file-input ${errors[key] ? 'invalid' : ''}`} type="file" accept={accept} onChange={event => { setFiles(prev => ({ ...prev, [key]: event.target.files?.[0] || null })); setErrors(prev => ({ ...prev, [key]: '' })); }} />
          {errors[key] && <p className="error-msg">{errors[key]}</p>}
        </div>)}</div>
      </section>
      <div className="checks full">{[
        'Saya telah memeriksa dan memastikan seluruh data yang diisi benar.',
        'Seluruh data dan dokumen yang saya kirim adalah milik saya dan dapat dipertanggungjawabkan.',
      ].map((label, index) => <label className="check" key={label}><input type="checkbox" checked={agreements[index]} onChange={event => setAgreements(prev => prev.map((value, i) => i === index ? event.target.checked : value))} />{label}</label>)}</div>
      <button className="submit full" type="submit" disabled={!agreements.every(Boolean) || loading}>{loading ? 'Mengirim pendaftaran…' : 'Kirim pendaftaran'}</button>
      <p className="login full">Sudah punya akun? <a href="/login" onClick={event => { if (onLogin) { event.preventDefault(); onLogin(); } }}>Masuk</a></p>
    </form>
  </main>{toast && <div className={`toast show ${toast.kind}`} role="status">{toast.message}</div>}</div>;
}
