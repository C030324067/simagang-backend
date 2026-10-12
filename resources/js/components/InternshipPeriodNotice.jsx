import React from 'react';
import { AlertCircle } from 'lucide-react';
import useInternshipPeriodStatus from '../hooks/useInternshipPeriodStatus';

export default function InternshipPeriodNotice() {
  const { period, loading, error } = useInternshipPeriodStatus();
  if (loading || (!error && !period)) return null;

  const divisions = period?.divisions || [];
  const allClosed = divisions.length > 0
    && divisions.every((division) => division.configured && division.is_closed);
  const noneConfigured = divisions.length > 0
    && divisions.every((division) => !division.configured);

  if (!error && !allClosed && !noneConfigured) return null;

  const message = error
    ? 'Status kuota pendaftaran belum dapat diverifikasi. Silakan coba kembali beberapa saat lagi.'
    : allClosed
      ? `Mohon Maaf, Pendaftaran Magang untuk Periode/Bulan Ini Telah Ditutup Karena Kuota Sudah Penuh. (${period.period_label})`
      : `Pendaftaran periode ${period.period_label} belum dibuka karena kuota setiap bidang belum diatur.`;

  return (
    <aside className="mx-auto my-6 flex max-w-7xl gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-amber-950 shadow-sm" role="status">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
      <div>
        <h2 className="font-bold">Informasi pendaftaran magang</h2>
        <p className="mt-1 text-sm leading-relaxed">{message}</p>
      </div>
    </aside>
  );
}
