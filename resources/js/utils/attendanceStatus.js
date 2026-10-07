const attendanceStatusLabels = {
  pending_approval: 'Menunggu Persetujuan',
  pending: 'Menunggu Persetujuan',
  late: 'Terlambat',
  present: 'Hadir',
  hadir: 'Hadir',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  sick: 'Izin / Sakit',
  izin: 'Izin / Sakit',
  leave: 'Izin / Sakit',
  absence: 'Izin / Sakit',
};

export function formatAttendanceStatus(status) {
  const normalizedStatus = String(status || '').trim().toLowerCase();
  if (!normalizedStatus) return '—';

  return attendanceStatusLabels[normalizedStatus]
    || normalizedStatus
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
}
