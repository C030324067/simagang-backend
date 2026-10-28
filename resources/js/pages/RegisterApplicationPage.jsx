import React, { useMemo, useState } from 'react';
import useDivisions from '../hooks/useDivisions';
import useInternshipPeriodStatus from '../hooks/useInternshipPeriodStatus';
import '../../css/RegisterApplication.css';

const empty = { application_type: 'mandiri', recommendation_letter_number: '', nama: '', email: '', nim_nisn: '', bidang: '', institusi: '', jenjang: '', jurusan: '', hp: '', tgl_mulai: '', tgl_selesai: '', pw: '', pw2: '' };
const docs = [
  { key: 'b1', label: 'Surat pengantar institusi', accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'b2', label: 'Curriculum Vitae (CV)', accept: '.pdf', required: true, pdfOnly: true },
  { key: 'b3', label: 'Transkrip nilai / rapor', accept: '.pdf', pdfOnly: true },
  { key: 'b4', label: 'Kartu Pelajar', accept: '.pdf,.jpg,.png', optional: true },
];
const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export default function RegisterApplicationPage({ onLogin, onBack, onSubmitted }) {
  const [form, setForm] = useState(empty);
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [agreements, setAgreements] = useState([false, false]);
  const [visible, setVisible] = useState([false, false]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { divisions, error: divisionError } = useDivisions();
  const { period, loading: periodLoading, error: periodError } = useInternshipPeriodStatus();
  const periodDivisions = period?.divisions || [];
  const hasOpenPeriod = periodDivisions.some((division) => division.can_register);
  const allPeriodsConfigured = periodDivisions.length > 0 && periodDivisions.every((division) => division.configured);
  const allPeriodsFull = periodDivisions.length > 0
    && periodDivisions.every((division) => ['full', 'division_full'].includes(division.availability_status));

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
    for (const [key, value] of Object.entries(form)) {
      if (key === 'application_type' || (key === 'recommendation_letter_number' && form.application_type !== 'rekomendasi_kampus')) continue;
      if (!String(value).trim()) next[key] = 'Kolom ini wajib diisi.';
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Masukkan alamat email yang valid.';
    
    // VALIDASI NIM / NISN : Mengizinkan kombinasi huruf dan angka (5-20 karakter)
    if (form.nim_nisn && !/^[a-zA-Z0-9]{5,20}$/.test(form.nim_nisn)) {
      next.nim_nisn = 'NIM / NISN harus berupa 5â€“20 karakter alfanumerik (huruf dan angka).';
    }
    if (form.hp && !/^(?:08\d{8,11}|628\d{7,10})$/.test(form.hp)) {
      next.hp = 'Nomor HP / WhatsApp harus terdiri dari 10â€“13 digit dan diawali 08 atau 628.';
    }
    if (form.pw && form.pw.length < 8) next.pw = 'Password minimal 8 karakter.';
    if (form.pw && form.pw2 && form.pw !== form.pw2) next.pw2 = 'Konfirmasi password tidak sama.';
    if (form.application_type === 'rekomendasi_kampus' && !form.recommendation_letter_number.trim()) {
      next.recommendation_letter_number = 'Nomor surat rekomendasi kampus wajib diisi.';
    }
    if (form.tgl_mulai && form.tgl_mulai < today) next.tgl_mulai = 'Tanggal mulai tidak boleh sebelum hari ini.';
    if (form.tgl_selesai && form.tgl_selesai < (form.tgl_mulai || today)) next.tgl_selesai = 'Tanggal selesai harus sama atau setelah tanggal mulai.';
    docs.forEach(({ key, imageOnly, pdfOnly, required }) => {
      const isOptionalRecommendation = key === 'b3' && form.application_type === 'rekomendasi_kampus';
      const isRequired = required || (key === 'b3' && !isOptionalRecommendation);
      const file = files[key];
      if (!file) {
        if (isRequired) next[key] = 'Berkas ini wajib diunggah.';
      } else if (file.size > (key === 'b1' ? 5 : 2) * 1024 * 1024) next[key] = `Ukuran file maksimal ${key === 'b1' ? 5 : 2} MB.`;
      else if (pdfOnly ? file.type !== 'application/pdf' : imageOnly ? !['image/jpeg', 'image/png'].includes(file.type) : !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) next[key] = pdfOnly ? 'Gunakan file PDF.' : imageOnly ? 'Gunakan foto JPG atau PNG.' : 'Gunakan PDF, JPG, atau PNG.';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    const selectedPeriod = periodDivisions.find((division) => division.code === form.bidang);
    if (periodLoading || periodError || !selectedPeriod?.can_register) {
      return notify('Kuota pendaftaran untuk bidang atau periode ini belum tersedia.', 'error');
    }
    if (!agreements.every(Boolean)) return notify('Centang kedua pernyataan sebelum mendaftar.', 'error');
    if (!validate()) return notify('Periksa kembali data dan berkas yang ditandai.', 'error');
    setLoading(true);
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    Object.entries(files).forEach(([key, file]) => payload.append(key, file));
    try {
      const response = await fetch('/api/applications/register', {
        method: 'POST', body: payload, headers: { Accept: 'application/json' },
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 422) {
        const serverErrors = Object.fromEntries(Object.entries(result.errors || {}).map(([key, messages]) => [key, messages[0]]));
        setErrors(serverErrors);
        notify('Mohon perbaiki data yang belum sesuai.', 'error');
        return;
      }
      if (!response.ok) throw new Error(result.message || 'Pendaftaran gagal. Silakan coba lagi.');
      const trackingCode = result.tracking_code || result.data?.tracking_code;
      if (!trackingCode) throw new Error('Kode pelacakan tidak diterima. Hubungi pengelola sebelum mengirim ulang.');
      localStorage.setItem('intern_tracking_code', trackingCode);
      notify(result.message || 'Pendaftaran berhasil.');
      if (onSubmitted) onSubmitted(trackingCode);
      else setTimeout(() => { if (onLogin) onLogin(); else window.location.assign(result.redirect_url || '/login'); }, 1200);
    } catch (error) {
      notify(error.message || 'Tidak dapat terhubung ke server.', 'error');
    } finally { setLoading(false); }
  };

  const field = (key, label, type = 'text', props = {}) => (
    <div className="field" key={key}>
      <label htmlFor={key}>{label}<span className="req"> *</span></label>
      {key === 'bidang' ? <select id={key} className={`input ${errors[key] ? 'invalid' : ''}`} value={form[key]} onChange={change}>
        <option value="">Pilih bidang</option>{divisions.map((division) => {
          const periodDivision = periodDivisions.find((item) => item.code === division.code);
          const isMonthlyFull = ['full', 'division_full'].includes(periodDivision?.availability_status);
          const isUnconfigured = !periodDivision?.configured;
          const isFull = isMonthlyFull || isUnconfigured || !periodDivision?.can_register;
          const isNotStarted = periodDivision?.availability_status === 'before_start';
          return <option key={division.id} value={division.code} disabled={isFull}>{division.name}{isMonthlyFull ? ' â€” Kuota penuh' : isNotStarted ? ` â€” Dibuka ${periodDivision.start_date}` : isUnconfigured || !periodDivision?.can_register ? ' â€” Periode belum dibuka' : ` â€” Sisa kuota: ${periodDivision.remaining_quota}/${periodDivision.monthly_quota}`}</option>;
        })}
      </select> : <input id={key} className={`input ${errors[key] ? 'invalid' : ''}`} type={type} value={form[key]} onChange={change} {...props} />}
      {key === 'bidang' && form[key] && (() => {
        const selectedDivision = divisions.find((division) => String(division.code) === form[key]);
          const selectedPeriod = periodDivisions.find((division) => division.code === form[key]);
          return selectedDivision && selectedPeriod?.availability_status === 'division_full'
            ? (<p style={{color:'#dc2626',fontSize:'0.8rem',marginTop:'6px',fontWeight:'600'}}>âš ï¸ Kuota bidang ini sudah penuh. Silakan pilih bidang lain.</p>)
            : selectedPeriod?.availability_status === 'full'
              ? (<p style={{color:'#dc2626',fontSize:'0.8rem',marginTop:'6px',fontWeight:'600'}}>âš ï¸ Kuota pendaftaran bulanan bidang ini sudah penuh.</p>)
              : selectedPeriod && !selectedPeriod.can_register
                ? (<p style={{color:'#64748b',fontSize:'0.8rem',marginTop:'6px',fontWeight:'600'}}>Pendaftaran bidang ini belum dibuka atau masa pendaftarannya telah berakhir.</p>)
            : null;
        })()}
      {key === 'bidang' && divisionError && <p className="error-msg">{divisionError}</p>}
      {errors[key] && <p className="error-msg">{errors[key]}</p>}
    </div>
  );

  // PENYARINGAN INPUT : Menyaring nim_nisn agar mengizinkan huruf & angka
  function change(event) {
    const { id, value } = event.target;
    const maxLength = id === 'nim_nisn' ? 20 : id === 'hp' ? 13 : undefined;
    let nextValue = value;

    if (id === 'hp') {
      nextValue = value.replace(/\D/g, '').slice(0, maxLength);
    } else if (id === 'nim_nisn') {
      nextValue = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, maxLength);
    }

    setForm(previous => ({ ...previous, [id]: nextValue }));
    setErrors(previous => ({ ...previous, [id]: '' }));
  }

  const selectApplicationType = (applicationType) => {
    setForm((previous) => ({ ...previous, application_type: applicationType }));
    setFiles((previous) => ({ ...previous, b3: null }));
    setErrors((previous) => ({ ...previous, b3: '', recommendation_letter_number: '' }));
    const categoryDocumentInput = document.getElementById('b3');
    if (categoryDocumentInput) categoryDocumentInput.value = '';
  };

  const formatFileSize = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  return (
    <div className="register-container">
      <main className="card">
        {onBack && (
          <button className="register-back" type="button" onClick={() => onBack()} aria-label="Kembali ke beranda">
            <span aria-hidden="true">&larr;</span> Kembali ke beranda
          </button>
        )}
        <header className="register-heading">
          <p className="eyebrow">SIMAGANG &middot; PENDAFTARAN</p>
          <h1>Daftar program magang</h1>
          <p>Lengkapi data diri dan dokumen untuk mengajukan permohonan magang.</p>
        </header>
        {periodLoading ? (
          <p className="note full" role="status">Memeriksa kuota periode pendaftaranâ€¦</p>
        ) : periodError ? (
          <p className="note full" role="alert">{periodError} Formulir dinonaktifkan sampai status kuota dapat diverifikasi.</p>
        ) : !hasOpenPeriod ? (
          <div className="note full" role="status" style={{ color: '#991b1b', background: '#fef2f2', borderColor: '#fecaca' }}>
            {allPeriodsFull
              ? `Mohon Maaf, Pendaftaran Magang untuk Periode/Bulan Ini Telah Ditutup Karena Kuota Sudah Penuh. (${period.period_label})`
              : allPeriodsConfigured
                ? `Pendaftaran periode ${period?.period_label || ''} belum dibuka atau sudah melewati tanggal pendaftaran.`
                : `Pendaftaran periode ${period?.period_label || ''} belum dibuka karena kuota divisi belum diatur.`}
          </div>
        ) : (
        <form onSubmit={submit} noValidate>
          <p className="note full">Semua kolom bertanda <span className="req">*</span> wajib diisi.</p>
          <fieldset className="application-type full">
            <legend>Jenis pengajuan magang<span className="req"> *</span></legend>
            <div className="application-type-options">
              <label className={`application-type-card ${form.application_type === 'mandiri' ? 'selected' : ''}`}>
                <input type="radio" name="application_type" value="mandiri" checked={form.application_type === 'mandiri'} onChange={() => selectApplicationType('mandiri')} />
                <span className="application-type-copy"><strong>Magang mandiri</strong><small>Mengajukan magang atas inisiatif sendiri.</small></span>
              </label>
              <label className={`application-type-card ${form.application_type === 'rekomendasi_kampus' ? 'selected' : ''}`}>
                <input type="radio" name="application_type" value="rekomendasi_kampus" checked={form.application_type === 'rekomendasi_kampus'} onChange={() => selectApplicationType('rekomendasi_kampus')} />
                <span className="application-type-copy"><strong>Rekomendasi kampus/sekolah</strong><small>Mengajukan magang dengan surat rekomendasi dari kampus atau sekolah.</small></span>
              </label>
            </div>
          </fieldset>
          {form.application_type === 'rekomendasi_kampus' && field('recommendation_letter_number', 'Nomor surat rekomendasi kampus')}
          {field('nama', 'Nama lengkap', 'text', { autoComplete: 'name' })}
          {field('email', 'Email address', 'email', { autoComplete: 'email' })}
          {/* ATRIBUT INPUT : inputMode set ke 'text' agar keyboard biasa muncul */}
          {field('nim_nisn', 'NIM / NISN', 'text', { inputMode: 'text', minLength: 5, maxLength: 20, autoComplete: 'off' })}
          {field('bidang', 'Bidang yang diminati')}
          {field('institusi', 'Nama institusi')}
          <div className="field"><label htmlFor="jenjang">Jenjang pendidikan<span className="req"> *</span></label><select id="jenjang" className={`input ${errors.jenjang ? 'invalid' : ''}`} value={form.jenjang} onChange={change}><option value="">Pilih jenjang</option><option value="SMK">SMK</option><option value="Kuliah">Kuliah</option></select>{errors.jenjang && <p className="error-msg">{errors.jenjang}</p>}</div>
          {field('jurusan', 'Jurusan / program studi')}
          {field('hp', 'Nomor telepon / WhatsApp', 'tel', { inputMode: 'numeric', minLength: 10, maxLength: 13, autoComplete: 'tel' })}
          {field('tgl_mulai', 'Tanggal mulai magang', 'date', { min: today })}
          {field('tgl_selesai', 'Tanggal selesai magang', 'date', { min: form.tgl_mulai || today })}
          {duration && <p className="date-info full">Perkiraan durasi magang: <strong>{duration}</strong></p>}
          {['pw', 'pw2'].map((key, index) => (
            <div className="field" key={key}>
              <label htmlFor={key}>{index ? 'Konfirmasi password' : 'Password'}<span className="req"> *</span></label>
              <div className="pw-wrap">
                <input id={key} className={`input ${errors[key] ? 'invalid' : ''}`} type={visible[index] ? 'text' : 'password'} value={form[key]} onChange={change} autoComplete={index ? 'new-password' : 'new-password'} />
                <button type="button" className="eye-btn" aria-label={visible[index] ? 'Sembunyikan password' : 'Tampilkan password'} onClick={() => setVisible(prev => prev.map((v, i) => i === index ? !v : v))}>
                  {visible[index] ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </div>
              {errors[key] && <p className="error-msg">{errors[key]}</p>}
            </div>
          ))}
          <section className="berkas full">
            <h2>Dokumen pendukung</h2>
            <p className="hint">CV dan surat rekomendasi: PDF maksimal 2 MB. Kartu pelajar: PDF, JPG, atau PNG maksimal 2 MB.</p>
            <div className="berkas-grid">
              {docs.map(({ key, label: defaultLabel, accept, optional }) => {
                const isRecommendation = key === 'b3' && form.application_type === 'rekomendasi_kampus';
                const label = isRecommendation ? 'Surat Rekomendasi' : defaultLabel;
                const isOptional = optional || isRecommendation;
                const file = files[key];

                return (
                  <div className="field" key={key}>
                    <label htmlFor={key}>{label}{isOptional ? ' (Opsional)' : <span className="req"> *</span>}</label>
                    <div className={`upload-card ${file ? 'has-file' : ''} ${errors[key] ? 'invalid' : ''}`}>
                      <input id={key} className="upload-native" type="file" accept={accept} onChange={event => { setFiles(prev => ({ ...prev, [key]: event.target.files?.[0] || null })); setErrors(prev => ({ ...prev, [key]: '' })); }} />
                      <label className="upload-label" htmlFor={key}>
                        <span className="upload-copy">
                          <strong>{file?.name || 'Pilih berkas untuk diunggah'}</strong>
                          <small>{file ? `${formatFileSize(file.size)} &middot; klik untuk mengganti berkas` : `${accept.toUpperCase().replaceAll(',', ', ')} Â· maksimal ${key === 'b1' ? '5' : '2'} MB`}</small>
                        </span>
                        <span className="upload-action">{file ? 'Ganti' : 'Pilih file'}</span>
                      </label>
                    </div>
                    {errors[key] && <p className="error-msg">{errors[key]}</p>}
                  </div>
                );
              })}
            </div>
          </section>
          <div className="checks full">
            {[
              'Saya telah memeriksa dan memastikan seluruh data yang diisi benar.',
              'Seluruh data dan dokumen yang saya kirim adalah milik saya dan dapat dipertanggungjawabkan.',
            ].map((label, index) => (
              <label className="check" key={label}>
                <input type="checkbox" checked={agreements[index]} onChange={event => setAgreements(prev => prev.map((value, i) => i === index ? event.target.checked : value))} />
                {label}
              </label>
            ))}
          </div>
          <button className="submit full" type="submit" disabled={!agreements.every(Boolean) || loading}>
            {loading ? 'Mengirim pendaftaranâ€¦' : 'Kirim pendaftaran'}
          </button>
          <p className="login full">
            Sudah punya akun? <a href="/login" onClick={event => { if (onLogin) { event.preventDefault(); onLogin(); } }}>Masuk</a>
          </p>
        </form>
        )}
      </main>
      {toast && <div className={`toast show ${toast.kind}`} role="status">{toast.message}</div>}
    </div>
  );
}
