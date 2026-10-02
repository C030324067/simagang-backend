import React, { useEffect, useState } from 'react';
import ApplicationStatus from './ApplicationStatus';
import RegisterApplicationPage from '../pages/RegisterApplicationPage';

const TRACKING_STORAGE_KEY = 'intern_tracking_code';
const trackingNotFoundMessage = 'Kode tracking tidak ditemukan. Silakan periksa kembali kode Anda.';

export default function ApplicationController({ onLogin, onBack }) {
  const [trackingCode, setTrackingCode] = useState(() => localStorage.getItem(TRACKING_STORAGE_KEY) || '');
  const [manualCode, setManualCode] = useState('');
  const [showLookup, setShowLookup] = useState(false);
  const [lookupError, setLookupError] = useState('');

  useEffect(() => {
    const storedCode = localStorage.getItem(TRACKING_STORAGE_KEY);
    if (storedCode) setTrackingCode(storedCode);
  }, []);

  const startTracking = (code) => {
    const normalizedCode = code.trim().toUpperCase();
    localStorage.setItem(TRACKING_STORAGE_KEY, normalizedCode);
    setTrackingCode(normalizedCode);
    setLookupError('');
    setShowLookup(false);
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
  };

  const changeTrackingCode = () => {
    localStorage.removeItem(TRACKING_STORAGE_KEY);
    setTrackingCode('');
    setShowLookup(true);
  };

  if (trackingCode) return <ApplicationStatus trackingCode={trackingCode} onLogin={onLogin} onReapply={reapply} onInvalidTrackingCode={changeTrackingCode} />;

  return <>
    <RegisterApplicationPage onLogin={onLogin} onBack={onBack} onSubmitted={startTracking} />
    <section className="application-tracking-lookup">
      <button type="button" className="application-tracking-lookup-toggle" onClick={() => setShowLookup((visible) => !visible)}>Sudah pernah mendaftar? Cek Status dengan Kode Tracking</button>
      {showLookup && <form className="application-tracking-lookup-form" onSubmit={lookup}>
        <label htmlFor="application-tracking-code">Kode tracking</label>
        <div><input id="application-tracking-code" autoComplete="off" value={manualCode} onChange={(event) => setManualCode(event.target.value)} placeholder="TRK-XXXXXXXXXXXX" required /><button type="submit">Cek Status</button></div>
        {lookupError && <p role="alert">{lookupError}</p>}
      </form>}
    </section>
  </>;
}
