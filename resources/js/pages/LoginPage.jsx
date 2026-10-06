import React, { useState } from 'react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({
  onSuccess,
  onBack,
  onRegister,
  passwordResetToken = '',
  passwordResetEmail = '',
  onPasswordReset,
}) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetRequestLoading, setResetRequestLoading] = useState(false);
  const [resetRequestError, setResetRequestError] = useState('');
  const [resetRequestSent, setResetRequestSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [passwordResetError, setPasswordResetError] = useState('');
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetComplete, setPasswordResetComplete] = useState(false);

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

  const openForgotPassword = () => {
    setResetEmail(email);
    setResetRequestError('');
    setResetRequestSent(false);
    setForgotPasswordOpen(true);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetRequestError('');
    setResetRequestLoading(true);

    try {
      const result = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail }),
      });

      if (!result.success) {
        setResetRequestError(result.message || 'Instruksi reset password tidak dapat dikirim. Silakan coba lagi.');
        return;
      }

      setResetRequestSent(true);
    } catch (requestError) {
      setResetRequestError(requestError.message || 'Tidak dapat terhubung ke server.');
    } finally {
      setResetRequestLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setPasswordResetError('');
    setPasswordResetLoading(true);

    try {
      const result = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: passwordResetToken,
          email: passwordResetEmail,
          password: newPassword,
          password_confirmation: newPasswordConfirmation,
        }),
      });

      if (!result.success) {
        setPasswordResetError(result.message || 'Password tidak dapat diperbarui. Silakan periksa tautan reset Anda.');
        return;
      }

      setPasswordResetComplete(true);
    } catch (requestError) {
      setPasswordResetError(requestError.message || 'Tidak dapat terhubung ke server.');
    } finally {
      setPasswordResetLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col lg:flex-row bg-white font-sans overflow-y-auto lg:overflow-hidden">

      {/* Sisi Kiri - Gambar Gedung Diskominfo + Efek Blur Gradasi Putih */}
      <div className="relative hidden lg:block lg:w-1/2 xl:w-7/12 bg-slate-900 overflow-hidden">
        <img
          src="/images/logo/diskominfo.png"
          alt="Gedung Diskominfo Tabalong"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Overlay Blur & Gradasi Putih di Tepi Kanan Gambar */}
        <div className="absolute inset-y-0 right-0 w-32 lg:w-48 bg-gradient-to-r from-transparent via-white/50 to-white backdrop-blur-[2px] pointer-events-none z-10" />

        {/* Tombol Melayang "kembali ke beranda" */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-slate-800 rounded-full text-xs font-semibold shadow-md backdrop-blur-sm transition-all duration-200 cursor-pointer hover:shadow-lg"
          >
            <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>kembali ke beranda</span>
          </button>
        )}
      </div>

      {/* Sisi Kanan - Form Login */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-16 xl:px-24 bg-white relative">

        {/* Tombol Kembali khusus Tampilan Mobile */}
        {onBack && (
          <div className="lg:hidden absolute top-6 left-6">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>kembali ke beranda</span>
            </button>
          </div>
        )}

        <div className="w-full max-w-md space-y-6">

          {/* Logo & Judul */}
          <div className="text-center space-y-3 flex flex-col items-center">
            <img
              src="/images/logo/logo komdigi.png"
              alt="Logo Komdigi"
              className="h-16 w-auto object-contain mx-auto"
            />
            <div className="space-y-1 text-center">
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                {passwordResetToken ? 'Reset Password' : 'Selamat Datang di'}
              </h1>
              {!passwordResetToken && (
                <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                  Sistem Pengelolaan Magang
                </h2>
              )}
              <p className="text-sm text-slate-500 pt-1">
                {passwordResetToken
                  ? passwordResetComplete
                    ? 'Password baru Anda sudah tersimpan.'
                    : 'Buat password baru untuk akun Anda.'
                  : 'Masuk untuk menggunakan layanan'}
              </p>
            </div>
          </div>

          {passwordResetToken ? (
            passwordResetComplete ? (
              <div className="space-y-4 text-center">
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700" role="status">
                  Password berhasil diperbarui. Silakan masuk dengan password baru.
                </p>
                <button
                  type="button"
                  onClick={onPasswordReset}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 cursor-pointer"
                >
                  Kembali ke Login
                </button>
              </div>
            ) : (
              <>
                {passwordResetError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-medium text-red-600" role="alert">
                    {passwordResetError}
                  </div>
                )}
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <label htmlFor="reset-email" className="mb-1.5 block text-xs font-semibold text-slate-700">Email</label>
                    <input
                      id="reset-email"
                      type="email"
                      required
                      value={passwordResetEmail}
                      readOnly
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-600 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-password" className="mb-1.5 block text-xs font-semibold text-slate-700">Password baru</label>
                    <input
                      id="new-password"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-password-confirmation" className="mb-1.5 block text-xs font-semibold text-slate-700">Konfirmasi password baru</label>
                    <input
                      id="new-password-confirmation"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={newPasswordConfirmation}
                      onChange={(event) => setNewPasswordConfirmation(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={passwordResetLoading}
                    className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                  >
                    {passwordResetLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
                  </button>
                </form>
              </>
            )
          ) : (
            <>
              {/* Pesan Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium text-center">
                  {error}
                </div>
              )}

              {/* Form Login */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-400 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M1 1l22 22" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Lupa Password */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={openForgotPassword}
                    className="text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Lupa Password?
                  </button>
                </div>

                {/* Tombol Masuk */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 mt-4"
                >
                  {loading ? 'Memproses...' : 'Masuk'}
                </button>
              </form>

              {/* Tautan Registrasi */}
              <div className="text-center pt-2 text-xs">
                <p className="text-slate-600">
                  Belum punya akun?{' '}
                  <button
                    type="button"
                    onClick={onRegister}
                    className="text-blue-600 font-semibold hover:underline cursor-pointer"
                  >
                    Registrasi
                  </button>
                </p>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Modal Lupa Password */}
      {forgotPasswordOpen && !passwordResetToken && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4 py-6" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="forgot-password-title" className="text-xl font-bold text-slate-900">Reset Password</h2>
                <p className="mt-2 text-sm text-slate-600">Masukkan email akun Anda. Jika terdaftar, kami akan mengirimkan tautan instruksi reset password.</p>
              </div>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(false)}
                aria-label="Tutup"
                className="rounded-lg px-2 py-1 text-xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
              >
                ×
              </button>
            </div>
            {resetRequestSent ? (
              <div className="mt-5 space-y-4">
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700" role="status">
                  Jika email terdaftar, instruksi reset password akan dikirim ke email tersebut.
                </p>
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(false)}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="mt-5 space-y-4">
                {resetRequestError && (
                  <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
                    {resetRequestError}
                  </p>
                )}
                <div>
                  <label htmlFor="forgot-password-email" className="mb-1.5 block text-xs font-semibold text-slate-700">Email</label>
                  <input
                    id="forgot-password-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    placeholder="nama@email.com"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetRequestLoading}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                >
                  {resetRequestLoading ? 'Mengirim...' : 'Kirim Tautan Reset'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}