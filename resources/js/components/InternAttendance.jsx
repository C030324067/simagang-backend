import React, { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../api';

const emptyLocation = { latitude: null, longitude: null };

export default function InternAttendance({ open, onClose, attendance, attendanceHistory = [], onUpdated }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('present');
  const [selfie, setSelfie] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [location, setLocation] = useState(emptyLocation);
  const [locationMessage, setLocationMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [selfiePreview, setSelfiePreview] = useState('');

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  useEffect(() => {
    if (!open) stopCamera();
  }, [open]);

  useEffect(() => {
    if (!selfie) {
      setSelfiePreview('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selfie);
    setSelfiePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selfie]);

  if (!open) return null;

  const startCamera = async () => {
    setErrorMessage('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Browser ini tidak mendukung akses kamera langsung.');
      return;
    }
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
      setSelfie(null);
    } catch {
      setErrorMessage('Akses kamera ditolak atau kamera sedang digunakan aplikasi lain.');
    }
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      setErrorMessage('Tunggu sampai pratinjau kamera siap.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        setSelfie(blob);
        stopCamera();
        setErrorMessage('');
      }
    }, 'image/jpeg', 0.88);
  };

  const requestLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Perangkat tidak mendukung GPS browser.'));
      return;
    }
    setLocationMessage('Mengambil lokasi GPS…');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const currentLocation = { latitude: coords.latitude, longitude: coords.longitude };
        setLocation(currentLocation);
        setLocationMessage(`Lokasi didapat (${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}).`);
        resolve(currentLocation);
      },
      () => reject(new Error('Lokasi tidak dapat diakses. Izinkan GPS dan coba lagi.')),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  });

  const submitAttendance = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    try {
      const payload = new FormData();
      payload.append('status', status);
      if (status === 'present') {
        if (!selfie) throw new Error('Ambil swafoto langsung dari kamera terlebih dahulu.');
        const currentLocation = await requestLocation();
        payload.append('photo', selfie, 'attendance-selfie.jpg');
        payload.append('latitude', String(currentLocation.latitude));
        payload.append('longitude', String(currentLocation.longitude));
      } else {
        if (!attachment) throw new Error(status === 'sick' ? 'Unggah surat keterangan dokter.' : 'Unggah surat izin resmi.');
        payload.append(status === 'sick' ? 'dokumen_skd' : 'dokumen_izin', attachment);
      }
      const response = await apiRequest('/attendances/check-in', { method: 'POST', body: payload });
      if (!response.success) throw new Error(response.message || 'Presensi gagal dikirim.');
      setAttachment(null);
      setSelfie(null);
      await onUpdated?.();
      onClose?.();
    } catch (error) {
      setErrorMessage(error.message || 'Presensi gagal dikirim.');
    } finally {
      setSubmitting(false);
    }
  };

  const clockOut = async () => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      const response = await apiRequest('/attendances/check-out', { method: 'POST' });
      if (!response.success) throw new Error(response.message || 'Presensi pulang gagal dikirim.');
      await onUpdated?.();
      onClose?.();
    } catch (error) {
      setErrorMessage(error.message || 'Presensi pulang gagal dikirim.');
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="attendance-title">
    <section className="max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Presensi harian</p><h2 id="attendance-title" className="mt-1 text-xl font-extrabold text-slate-900">Kehadiran & GPS</h2></div>
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100" aria-label="Tutup">✕</button>
      </div>
      {attendance ? <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm">
        <p className="font-bold text-blue-950">Status hari ini: {attendance.status}</p>
        <p className="mt-1 text-blue-900">Persetujuan: {attendance.approval_status === 'pending_approval' ? 'Menunggu mentor' : attendance.approval_status}</p>
        <p className="mt-1 text-blue-900">Masuk: {attendance.clock_in_at || attendance.check_in_time || '—'} · Pulang: {attendance.clock_out_at || attendance.check_out_time || '—'}</p>
        {attendance.rejection_reason && <p className="mt-2 text-rose-700">Alasan penolakan: {attendance.rejection_reason}</p>}
        {!attendance.clock_out_at && attendance.status !== 'sick' && attendance.status !== 'leave' && <button type="button" disabled={submitting} onClick={clockOut} className="mt-3 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{submitting ? 'Mengirim…' : 'Presensi Pulang'}</button>}
      </div> : <form onSubmit={submitAttendance} className="space-y-4">
        <fieldset><legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">Jenis presensi</legend><div className="grid grid-cols-3 gap-2">
          {[['present', 'Hadir'], ['sick', 'Sakit'], ['leave', 'Izin']].map(([value, label]) => <button key={value} type="button" onClick={() => { setStatus(value); setSelfie(null); setAttachment(null); stopCamera(); }} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${status === value ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-600'}`}>{label}</button>)}
        </div></fieldset>
        {status === 'present' ? <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl bg-slate-950">
            {selfie ? <img src={selfiePreview} alt="Swafoto presensi yang diambil langsung" className="aspect-video w-full object-cover" /> : <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full object-cover" />}
          </div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={startCamera} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Buka Kamera</button>{cameraReady && <button type="button" onClick={captureSelfie} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Ambil Swafoto</button>}{selfie && <button type="button" onClick={startCamera} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Ambil Ulang</button>}</div>
          <p className="text-xs text-slate-500">Swafoto hanya dapat diambil dari kamera langsung. GPS harus berada dalam radius 50 meter dari kantor.</p>
          {locationMessage && <p className="text-xs text-slate-600">{locationMessage}</p>}
        </div> : <div><label htmlFor="attendance-attachment" className="mb-1 block text-xs font-bold text-slate-700">{status === 'sick' ? 'Surat keterangan dokter (PDF/JPG)' : 'Surat izin resmi (PDF/JPG)'}</label><input id="attendance-attachment" type="file" required accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg" onChange={(event) => setAttachment(event.target.files?.[0] || null)} className="block w-full rounded-xl border border-slate-200 p-3 text-sm" /></div>}
        {errorMessage && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{errorMessage}</p>}
        <button type="submit" disabled={submitting || (status === 'present' && !selfie)} className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Mengirim presensi…' : 'Kirim untuk Persetujuan Mentor'}</button>
      </form>}
      <div className="mt-6 border-t border-slate-100 pt-4"><h3 className="mb-2 text-sm font-bold text-slate-800">Riwayat terbaru</h3><ul className="space-y-2 text-xs text-slate-600">{attendanceHistory.slice(0, 5).map((row) => <li key={row.id} className="flex justify-between gap-2"><span>{row.date}</span><span className="capitalize">{row.status} · {row.approval_status || 'approved'}</span></li>)}{attendanceHistory.length === 0 && <li>Belum ada riwayat presensi.</li>}</ul></div>
    </section>
  </div>;
}
