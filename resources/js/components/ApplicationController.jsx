import React, { useEffect, useState } from 'react';
import ApplicationStatus from './ApplicationStatus';
import RegisterApplicationPage from '../pages/RegisterApplicationPage';

const TRACKING_STORAGE_KEY = 'intern_tracking_code';
const trackingNotFoundMessage = 'Kode tracking tidak ditemukan. Silakan periksa kembali kode Anda.';

export default function ApplicationController({ onLogin, onBack, lookupOnly = false }) {
  const [trackingCode, setTrackingCode] = useState(() => lookupOnly ? '' : localStorage.getItem(TRACKING_STORAGE_KEY) || '');
  const [manualCode, setManualCode] = useState('');
  const [lookupMode, setLookupMode] = useState(lookupOnly);
  const [lookupError, setLookupError] = useState('');

  useEffect(() => {
    if (lookupOnly) return;
    const storedCode = localStorage.getItem(TRACKING_STORAGE_KEY);
    if (storedCode) setTrackingCode(storedCode);
  }, [lookupOnly]);

  const startTracking = (code) => {
    const normalizedCode = code.trim().toUpperCase();
    localStorage.setItem(TRACKING_STORAGE_KEY, normalizedCode);
    setTrackingCode(normalizedCode);
    setLookupError('');
  };

  const lookup = async (event) => {
    event.preventDefault();
    const code = manualCode.trim().toUpperCase();
    if (!code) return;
    try {
      const response = await fetch(`/api/applications/track/${encodeURIComponent(code)}`, { headers: { Accept: 'application/json' } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        const error = new Error(result.message || (response.status === 404 ? trackingNotFoundMessage : 'Kode tracking tidak dapat diverifikasi.'));
        error.response = { status: response.status, data: result };
        throw error;
      }
      startTracking(code);
    } catch (error) {
      setLookupError(error.response?.data?.message || error.message || 'Kode tracking tidak dapat diverifikasi.');
    }
  };

  const reapply = () => {
    localStorage.removeItem(TRACKING_STORAGE_KEY);
    setTrackingCode('');
    setManualCode('');
    setLookupMode(false);
  };

  const changeTrackingCode = () => {
    localStorage.removeItem(TRACKING_STORAGE_KEY);
    setTrackingCode('');
    setLookupMode(true);
  };

  const backToHome = () => {
    localStorage.removeItem(TRACKING_STORAGE_KEY);
    setTrackingCode('');
    onBack?.();
  };

  const trackingLookupForm = (
    <form className="space-y-4" onSubmit={lookup}>
      <div className="space-y-2">
        <label htmlFor="application-tracking-code" className="block text-sm font-semibold text-slate-700">
          Kode tracking
        </label>
        <input
          id="application-tracking-code"
          autoComplete="off"
          value={manualCode}
          onChange={(event) => setManualCode(event.target.value)}
          placeholder="TRK-XXXXXXXXXXXX"
          required
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm uppercase tracking-wide text-slate-800 outline-none transition placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </div>
      {lookupError && (
        <p className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
          {lookupError}
        </p>
      )}
      <button
        type="submit"
        className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
      >
        Cek Status Pengajuan
      </button>
    </form>
  );

  if (trackingCode) return <ApplicationStatus trackingCode={trackingCode} onLogin={onLogin} onReapply={reapply} onChangeTrackingCode={changeTrackingCode} onBack={backToHome} />;

  if (lookupMode) return (
    <main className="flex min-h-[calc(100vh-88px)] items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 px-4 py-10">
      <section className="w-full max-w-xl space-y-6 rounded-3xl border border-white/70 bg-white p-6 shadow-xl md:p-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg py-1 text-sm font-semibold text-slate-600 transition hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
        >
          <span aria-hidden="true">←</span>
          Kembali ke beranda
        </button>
        <header className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cek Status Pengajuan</h1>
          <p className="text-sm leading-relaxed text-slate-500">
            Masukkan kode tracking untuk melihat perkembangan pengajuan magang kamu.
          </p>
        </header>
        {trackingLookupForm}
      </section>
    </main>
  );

  return <RegisterApplicationPage onLogin={onLogin} onBack={onBack} onSubmitted={startTracking} />;
}
