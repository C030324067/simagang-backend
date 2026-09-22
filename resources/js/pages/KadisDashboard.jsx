import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  ShieldCheck, 
  Building,
  Sparkles,
  Users,
  Check
} from 'lucide-react';

export default function KadisDashboard() {
  const { user } = useAuth();
  const [pendingApps, setPendingApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionForm, setActionForm] = useState({
    status: 'approved',
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
    const res = await apiRequest('/applications/pending-kadis');
    if (res.success) setPendingApps(res.data || []);
    setLoading(false);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    setSubmitting(true);
    setMsg({ type: '', text: '' });

    const res = await apiRequest(`/applications/${selectedApp.id}/approve-kadis`, {
      method: 'PUT',
      body: JSON.stringify(actionForm),
    });

    if (res.success) {
      setMsg({ type: 'success', text: res.message || 'Otorisasi surat penerimaan magang berhasil diterbitkan.' });
      setSelectedApp(null);
      loadData();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal memproses otorisasi.' });
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Tahap 3: Otorisasi Akhir Kepala Dinas
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
            Dashboard Eksekutif Kepala Dinas Kominfo
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Berikan tanda tangan otorisasi digital akhir untuk menerbitkan Surat Resmi Penerimaan Magang bagi pemohon yang telah disetujui Kepegawaian dan Kabid.
          </p>
        </div>

        <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
          <span className="text-xs text-slate-500 font-semibold block uppercase">Menunggu Otorisasi Kadis</span>
          <span className="text-xl font-bold text-purple-600">{pendingApps.length}</span>
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

      {/* Pending List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            Antrean Otorisasi Akhir ({pendingApps.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Memuat antrean otorisasi...</div>
        ) : pendingApps.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Semua permohonan telah diotorisasi!</p>
            <p className="text-xs text-slate-400">Tidak ada berkas yang menunggu tanda tangan otorisasi Kepala Dinas saat ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Pemohon</th>
                  <th className="py-3 px-4">Institusi</th>
                  <th className="py-3 px-4">Bidang Penempatan</th>
                  <th className="py-3 px-4">Verifikasi Kepegawaian</th>
                  <th className="py-3 px-4">Verifikasi Kabid</th>
                  <th className="py-3 px-4 text-right">Otorisasi</th>
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                        {app.division?.name || 'Aptika'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Disetujui</span>
                      </div>
                      <p className="text-[11px] text-slate-400 max-w-xs truncate">{app.notes_kepegawaian}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1 text-indigo-600 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Disetujui</span>
                      </div>
                      <p className="text-[11px] text-slate-400 max-w-xs truncate">{app.notes_kabid}</p>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setActionForm({
                            status: 'approved',
                            notes: 'Surat penerimaan magang resmi disahkan oleh Kepala Dinas.',
                          });
                        }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-xs transition shadow-xs flex items-center gap-1 ml-auto"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Otorisasi Surat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Kadis Authorization Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Otorisasi Surat Penerimaan Magang</h3>
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
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Keputusan Otorisasi Kadis</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActionForm({ ...actionForm, status: 'approved' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 transition ${
                      actionForm.status === 'approved'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Terbitkan Surat Penerimaan
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
                    Tolak Permohonan
                  </button>
                </div>
              </div>

              {actionForm.status === 'approved' && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-900">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Format Nomor Surat Resmi yang akan Diterbitkan:
                  </p>
                  <p className="font-mono mt-1 text-slate-700 bg-white p-1.5 rounded border border-purple-200">
                    500.12.1/DISKOMINFO/{new Date().getFullYear()}/000{selectedApp.id}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Catatan Kepala Dinas</label>
                <textarea
                  rows="3"
                  required
                  value={actionForm.notes}
                  onChange={(e) => setActionForm({ ...actionForm, notes: e.target.value })}
                  placeholder="Catatan resmi otorisasi atau instruksi dinas..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                >
                  {submitting ? 'Memproses...' : 'Sahkan & Terbitkan Surat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

