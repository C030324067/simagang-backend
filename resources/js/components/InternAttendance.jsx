import React, { useEffect, useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { apiRequest } from '../api';
import { formatAttendanceStatus } from '../utils/attendanceStatus';

const emptyLocation = { latitude: null, longitude: null };

export default function InternAttendance({ open, onClose, attendance, attendanceHistory = [], onUpdated }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('present');
  const [attendanceMode, setAttendanceMode] = useState('present');
  const [notes, setNotes] = useState('');
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
        if (!notes.trim()) throw new Error('Isi keterangan atau alasan tidak hadir terlebih dahulu.');
        payload.append('notes', notes.trim());
        if (attachment) {
          payload.append(status === 'sick' ? 'dokumen_skd' : 'dokumen_izin', attachment);
        }
      }
      const response = await apiRequest('/attendances/check-in', { method: 'POST', body: payload });
      if (!response.success) throw new Error(response.message || 'Presensi gagal dikirim.');
      setAttachment(null);
      setSelfie(null);
      setNotes('');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="attendance-title">
      <section className="max-h-[94dvh] w-full max-w-xl space-y-5 overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <p id="attendance-title" className="text-sm font-bold uppercase tracking-wider text-indigo-600">PRESENSI HARIAN</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {attendance ? (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm">
            <p className="font-bold text-indigo-950">Status hari ini: {formatAttendanceStatus(attendance.status)}</p>
            <p className="mt-1 text-indigo-900">Persetujuan: {formatAttendanceStatus(attendance.approval_status || 'approved')}</p>
            <p className="mt-1 text-indigo-900">Masuk: {attendance.clock_in_at || attendance.check_in_time || '—'} · Pulang: {attendance.clock_out_at || attendance.check_out_time || '—'}</p>
            {attendance.notes && <p className="mt-2 text-slate-700">Keterangan: {attendance.notes}</p>}
            {attendance.rejection_reason && <p className="mt-2 text-rose-700">Alasan penolakan: {attendance.rejection_reason}</p>}
            {!attendance.clock_out_at && attendance.status !== 'sick' && attendance.status !== 'leave' && (
              <button type="button" disabled={submitting} onClick={clockOut} className="mt-3 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                {submitting ? 'Mengirim…' : 'Presensi Pulang'}
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={submitAttendance} className="space-y-5">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
              {[
                ['present', 'Hadir'],
                ['absence', 'Izin / Sakit'],
              ].map(([value, label]) => {
                const active = attendanceMode === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setAttendanceMode(value);
                      setStatus(value === 'present' ? 'present' : 'leave');
                      setSelfie(null);
                      setAttachment(null);
                      setErrorMessage('');
                      stopCamera();
                    }}
                    className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                      active
                        ? 'border-indigo-600 bg-white text-indigo-700 shadow-sm'
                        : 'border-transparent text-slate-600 hover:text-indigo-700'
                    }`}
                    aria-pressed={active}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {attendanceMode === 'present' ? (
              <div className="space-y-3">
                <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900">
                  <video ref={videoRef} autoPlay playsInline muted className={`h-full w-full object-cover ${selfie ? 'hidden' : ''}`} />
                  {selfie && (
                    <img src={selfiePreview} alt="Swafoto presensi yang diambil langsung" className="absolute inset-0 h-full w-full object-cover" />
                  )}
                  {!cameraReady && !selfie && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300">
                      <Camera className="h-8 w-8" />
                      <p className="text-xs">Pratinjau kamera presensi</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={startCamera} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50">
                    <Camera className="h-4 w-4" />
                    Buka Kamera
                  </button>
                  {cameraReady && (
                    <button type="button" onClick={captureSelfie} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
                      Ambil Foto Presensi
                    </button>
                  )}
                  {selfie && (
                    <button type="button" onClick={startCamera} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      Ambil Ulang
                    </button>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-slate-500">Swafoto diambil langsung dari kamera. GPS harus berada dalam radius 50 meter dari kantor.</p>
                {locationMessage && <p className="text-xs text-slate-600">{locationMessage}</p>}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="attendance-notes" className="block text-sm font-semibold text-slate-700">
                    Keterangan / Alasan Tidak Hadir <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id="attendance-notes"
                    required
                    maxLength={500}
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Contoh: Sakit demam sejak pagi, surat dokter menyusul. / Izin menghadiri acara keluarga."
                    className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="attendance-attachment" className="block text-sm font-semibold text-slate-700">
                    Upload Surat Dokter / Izin <span className="font-normal text-slate-400">(Opsional)</span>
                  </label>
                  <label
                    htmlFor="attendance-attachment"
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50"
                  >
                    <Upload className="h-6 w-6 text-indigo-600" />
                    <span className="text-sm font-semibold text-slate-700">
                      {attachment?.name || 'Pilih surat dokter atau surat izin'}
                    </span>
                    <span className="text-xs text-slate-500">PDF atau JPG, maksimal 5 MB (opsional)</span>
                    <input
                      id="attendance-attachment"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg"
                      onChange={(event) => setAttachment(event.target.files?.[0] || null)}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>
            )}

            {errorMessage && <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">{errorMessage}</p>}
            <button
              type="submit"
              disabled={submitting || (attendanceMode === 'present' && !selfie)}
              className="w-full rounded-2xl bg-[#4F46E5] py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Mengirim presensi…' : attendanceMode === 'present' ? 'Kirim Presensi Hadir' : 'Kirim untuk Persetujuan Mentor'}
            </button>
          </form>
        )}

        <div className="space-y-2 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-bold text-slate-800">Riwayat terbaru</h3>
          <ul className="space-y-2 text-xs text-slate-600">
            {attendanceHistory.slice(0, 5).map((row) => (
              <li key={row.id} className="flex flex-wrap justify-between gap-x-3 gap-y-1 rounded-xl bg-slate-50 px-3 py-2">
                <span>{row.date}</span>
                <span>{formatAttendanceStatus(row.status)} · {formatAttendanceStatus(row.approval_status || 'approved')}</span>
              </li>
            ))}
            {attendanceHistory.length === 0 && <li className="text-slate-500">Belum ada riwayat presensi.</li>}
          </ul>
        </div>
      </section>
    </div>
  );
}
