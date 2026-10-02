import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onSuccess, onBack }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result?.success) {
        if (onSuccess) onSuccess();
      } else {
        setError(result?.message || 'Email atau password salah. Silakan coba lagi.');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem saat mencoba login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
          >
            <span aria-hidden="true">←</span>
            Kembali ke beranda
          </button>
        )}
        {/* Header Login */}
        <div className="text-center space-y-2">
          <img
            src="/images/logo/logo komdigi.png"
            alt="Logo Komdigi"
            className="h-16 w-auto mx-auto object-contain mb-2"
          />
          <h2 className="text-2xl font-bold text-slate-800">Masuk Akun</h2>
          <p className="text-xs text-slate-500">
            Silakan masukkan email dan password akun Anda untuk mengakses dashboard.
          </p>
        </div>

        {/* Pesan Error jika login gagal */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        {/* Form Login murni */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Email / Username
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email Anda"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password Anda"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
