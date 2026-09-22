import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { apiRequest } from '../api';
import { ShieldCheck, LogIn, UserPlus, KeyRound, Mail, Phone, User, AlertCircle, CheckCircle } from 'lucide-react';

export default function LoginPage({ onSuccess }) {
  const { login, quickSwitchRole } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: 'intern@diskominfo.go.id',
    password: 'password123',
    no_hp: '',
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (isRegister) {
      const res = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (res.success && res.data) {
        setSuccessMsg('Registrasi akun berhasil! Masuk otomatis...');
        await login(formData.email, formData.password);
        if (onSuccess) onSuccess();
      } else {
        setError(res.message || 'Gagal mendaftar.');
      }
    } else {
      const res = await login(formData.email, formData.password);
      if (res.success) {
        if (onSuccess) onSuccess();
      } else {
        setError(res.message || 'Email atau password salah.');
      }
    }

    setLoading(false);
  };

  const fillCredentials = (email) => {
    setFormData((prev) => ({
      ...prev,
      email,
      password: 'password123',
    }));
    setIsRegister(false);
    setError('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
            {isRegister ? 'Pendaftaran Akun Magang' : 'Masuk ke SI-MAGANG'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Dinas Komunikasi dan Informatika (Diskominfo)
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-sm">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`flex-1 py-2 font-medium rounded-md transition ${
              !isRegister ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Masuk / Login
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 py-2 font-medium rounded-md transition ${
              isRegister ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Daftar Pemohon Baru
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 border border-red-200 flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200 flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama lengkap pemohon"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="nama@diskominfo.go.id"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimal 6 karakter"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nomor WhatsApp / HP
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.no_hp}
                  onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {loading ? 'Memproses...' : isRegister ? 'Daftar Sebagai Pemohon' : 'Masuk ke Sistem'}
          </button>
        </form>

        {/* Fast-fill buttons for testing */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
            Pilih Akun Demo Default (Password: password123)
          </p>
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            {Object.entries(DEMO_ACCOUNTS).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => fillCredentials(item.email)}
                className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 text-left transition flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-slate-800">{item.label}</span>
                  <span className="text-slate-400 text-[11px] block">{item.email}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                  {item.badge}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

