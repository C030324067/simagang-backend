import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  User, 
  Calendar, 
  AlertCircle,
  ShieldAlert,
  Send,
  ExternalLink
} from 'lucide-react';

export default function KepegawaianDashboard() {
  const [pendingApps, setPendingApps] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionForm, setActionForm] = useState({
    status: 'approved',
    division_id: '',
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [appsRes, divRes] = await Promise.all([
      apiRequest('/applications/pending-kepegawaian'),
      apiRequest('/divisions'),
    ]);

    if (appsRes.success) setPendingApps(appsRes.data || []);
    if (divRes.success) {
      setDivisions(divRes.data || []);
      if (divRes.data?.length > 0) {
        setActionForm((prev) => ({ ...prev, division_id: divRes.data[0].id }));
      }
    }
    setLoading(false);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    setSubmitting(true);
    setMsg({ type: '', text: '' });

    const res = await apiRequest(`/applications/${selectedApp.id}/approve-kepegawaian`, {
      method: 'PUT',
      body: JSON.stringify(actionForm),
    });

    if (res.success) {
      setMsg({ type: 'success', text: res.message || 'Verifikasi kepegawaian berhasil diproses.' });
      setSelectedApp(null);
      loadData();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal memproses verifikasi.' });
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Tahap 1: Verifikasi Berkas
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
            Dashboard Verifikasi Kepegawaian Diskominfo
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Verifikasi kelengkapan berkas administrasi pemohon magang (Mandiri & Rekomendasi Kampus), periksa kuota dinas, dan tentukan bidang penempatan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-xs text-slate-500 font-semibold block uppercase">Menunggu Verifikasi</span>
            <span className="text-xl font-bold text-blue-600">{pendingApps.length}</span>
          </div>
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl text-sm border flex items-center justify-between ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ type: '', text: '' })} className="font-bold text-xs hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Pending Queue List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Antrean Permohonan Masuk ({pendingApps.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Memuat data permohonan...</div>
        ) : pendingApps.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Semua berkas telah diverifikasi!</p>
            <p className="text-xs text-slate-400">Tidak ada pengajuan magang yang tertunda di tingkat Kepegawaian saat ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Pemohon</th>
                  <th className="py-3 px-4">Asal Institusi</th>
                  <th className="py-3 px-4">Jalur</th>
                  <th className="py-3 px-4">Periode Magang</th>
                  <th className="py-3 px-4">Dokumen</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{app.user?.name}</p>
                      <p className="text-slate-400 text-[11px]">{app.user?.email}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{app.institution_name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                        {app.application_type === 'mandiri' ? 'Mandiri' : 'Kampus'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {app.start_date} s/d {app.end_date}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-blue-600">
                      <div className="flex flex-col gap-1">
                        {app.file_proposal && <span className="hover:underline cursor-pointer">📄 Proposal.pdf</span>}
                        {app.file_cv && <span className="hover:underline cursor-pointer">📄 CV.pdf</span>}
                        {app.file_recommendation_letter && <span className="hover:underline cursor-pointer">📄 Surat_Kampus.pdf</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setActionForm({
                            status: 'approved',
                            division_id: app.division_id || divisions[0]?.id || '',
                            notes: 'Berkas administrasi lengkap dan valid.',
                          });
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition"
                      >
                        Verifikasi Berkas
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Verifikasi Berkas Pemohon</h3>
                <p className="text-xs text-slate-500">Pemohon: {selectedApp.user?.name} ({selectedApp.institution_name})</p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Keputusan Verifikasi</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActionForm({ ...actionForm, status: 'approved' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 transition ${
                      actionForm.status === 'approved'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Setujui & Teruskan ke Kabid
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionForm({ ...actionForm, status: 'rejected' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 transition ${
                      actionForm.status === 'rejected'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak Pengajuan
                  </button>
                </div>
              </div>

              {actionForm.status === 'approved' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Penetapan Bidang Penempatan (Diskominfo)
                  </label>
                  <select
                    required
                    value={actionForm.division_id}
                    onChange={(e) => setActionForm({ ...actionForm, division_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Catatan Verifikasi</label>
                <textarea
                  rows="3"
                  required
                  value={actionForm.notes}
                  onChange={(e) => setActionForm({ ...actionForm, notes: e.target.value })}
                  placeholder="Masukkan catatan evaluasi berkas atau alasan penolakan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Verifikasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

