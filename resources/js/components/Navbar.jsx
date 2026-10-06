import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Eye, EyeOff, LogOut, UserRound } from 'lucide-react';
import { apiRequest } from '../api';

export default function Navbar({ currentTab, setCurrentTab, onNavigateLogin }) {
  const { user, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!profileMenuOpen) return undefined;

    const handleClickOutside = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [profileMenuOpen]);

  const openProfileModal = () => {
    setProfileMenuOpen(false);
    setPasswordMessage(null);
    setPasswords({
      current_password: '',
      new_password: '',
      new_password_confirmation: '',
    });
    setVisiblePasswords({});
    setProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    if (passwordLoading) return;
    setProfileModalOpen(false);
    setPasswordMessage(null);
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    const result = await apiRequest('/change-password', {
      method: 'POST',
      body: JSON.stringify(passwords),
    });

    setPasswordLoading(false);

    if (!result.success) {
      setPasswordMessage({
        type: 'error',
        text: result.errors?.current_password?.[0] || result.errors?.new_password?.[0] || result.message || 'Password tidak dapat diperbarui. Silakan coba lagi.',
      });
      return;
    }

    setPasswordMessage({ type: 'success', text: result.message || 'Password berhasil diperbarui.' });
    setPasswords({
      current_password: '',
      new_password: '',
      new_password_confirmation: '',
    });
    setVisiblePasswords({});
  };

  // Daftar menu navigasi
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'panduan', label: 'Panduan' },
    { id: 'tentang', label: 'Tentang Kami' },
    { id: 'bidang', label: 'Bidang' },
    { id: 'kontak', label: 'Kontak' },
  ];

  // Fungsi helper scroll presisi dengan offset sesuai tinggi navbar (80px)
  const scrollToElement = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const navbarOffset = 80; // Disesuaikan pas dengan tinggi navbar h-20 (80px)
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navbarOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleNavClick = (e, sectionId) => {
    e.preventDefault();

    if (sectionId === 'home') {
      if (setCurrentTab) setCurrentTab('landing');
      if (currentTab === 'landing' || !currentTab) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      }
      return;
    }

    // Set tab aktif
    if (setCurrentTab) setCurrentTab(sectionId);

    const element = document.getElementById(sectionId);
    if (element) {
      scrollToElement(sectionId);
    } else if (setCurrentTab) {
      setCurrentTab('landing');
      setTimeout(() => {
        scrollToElement(sectionId);
      }, 100);
    }
  };

  // Fungsi pengecekan menu aktif
  const isNavActive = (id) => {
    if (id === 'home') {
      return currentTab === 'landing' || currentTab === 'home' || !currentTab;
    }
    return currentTab === id;
  };

  const getRoleBadge = (role, divisionName) => {
    const divisionTitle = divisionName?.replace(/^Bidang\s+/i, '').trim();

    switch (role) {
      case 'intern':
        return { text: 'Intern', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'admin_kepegawaian':
        return { text: 'Kepegawaian', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'kabid':
        return { text: divisionTitle || 'Kabid', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'kadis':
        return { text: 'Kadis', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'mentor':
        return { text: 'Mentor', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { text: role, bg: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const badge = getRoleBadge(user?.role, user?.division?.name);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
        
        {/* 1. SISI KIRI (LOGO TABALONG, LOGO DISKOMINFO & JUDUL CENTER-ALIGNED) */}
        <div 
          className="flex items-center gap-3 cursor-pointer shrink-0" 
          onClick={(e) => handleNavClick(e, 'home')}
        >
          {/* Logo Kabupaten Tabalong */}
          <img 
            src="/images/logo/logo_setda.png" 
            alt="Logo Kab. Tabalong" 
            className="h-10 w-auto object-contain shrink-0"
          />
          {/* Logo Diskominfo */}
          <img 
            src="/images/logo/logo komdigi.png" 
            alt="Logo Komdigi" 
            className="h-10 w-auto object-contain shrink-0"
          />
          
          {/* Teks Brand */}
          <div className="flex flex-col justify-center leading-none">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
              SIMAGANG
            </span>
            <span className="text-[11px] font-medium text-slate-500 leading-tight mt-1">
              Sistem Informasi Magang
            </span>
            <span className="text-[10px] font-normal text-slate-400 leading-tight">
              Dinas Komunikasi dan Informasi Kab.Tabalong
            </span>
          </div>
        </div>

        {/* 2. SISI KANAN (MENU & LOGIN) */}
        {!user ? (
          <div className="flex items-center gap-6 shrink-0">
            
            {/* Menu Navigasi Dinamis */}
            <nav className="hidden md:flex items-center gap-6 font-bold text-sm text-slate-600">
              {navItems.map((item) => {
                const active = isNavActive(item.id);
                return (
                  <a 
                    key={item.id}
                    href={`#${item.id}`} 
                    onClick={(e) => handleNavClick(e, item.id)}
                    className={`transition-colors py-1 ${
                      active ? 'text-sky-600 font-extrabold' : 'hover:text-sky-600'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>

            {/* Tombol Login */}
            <button
              onClick={() => onNavigateLogin ? onNavigateLogin() : setCurrentTab?.('login')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-sky-600 text-white text-sm font-bold shadow-lg shadow-sky-600/25 hover:bg-sky-700 transition-all hover:-translate-y-0.5 cursor-pointer shrink-0"
            >
              <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
              Login
            </button>

          </div>
        ) : (
          
          /* Tampilan Jika Sudah Login */
          <div className="relative flex items-center shrink-0" ref={profileMenuRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
              aria-label="Buka menu profil"
              onClick={() => setProfileMenuOpen((open) => !open)}
              className="flex max-w-[min(70vw,360px)] items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            >
              <div className="hidden min-w-0 text-right sm:block">
                <p className="truncate text-sm font-semibold leading-tight text-slate-800">{user.name}</p>
                <div className="mt-0.5 flex items-center justify-end gap-1.5">
                  <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${badge.bg}`}>
                    {badge.text}
                  </span>
                  {user.division && (
                    <span className="text-[11px] font-medium text-slate-500">
                      • {user.division.code}
                    </span>
                  )}
                </div>
              </div>

              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700">
                {user.name?.charAt(0) || 'U'}
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileMenuOpen && (
              <div role="menu" className="absolute right-0 top-full z-[60] mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                <button
                  type="button"
                  role="menuitem"
                  onClick={openProfileModal}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <UserRound className="h-4 w-4 text-slate-500" />
                  Profil Saya
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={logout}
                  className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              </div>
            )}
          </div>
        )}

      </div>
      {profileModalOpen && user && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeProfileModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            className="my-auto flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <h2 id="profile-modal-title" className="text-xl font-bold text-slate-900">Profil Saya</h2>
                <p className="mt-1 text-sm text-slate-500">Informasi akun dan pengaturan password.</p>
              </div>
              <button
                type="button"
                onClick={closeProfileModal}
                disabled={passwordLoading}
                aria-label="Tutup profil"
                className="rounded-lg px-2 py-1 text-xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Nama</dt>
                    <dd className="mt-1 font-semibold text-slate-900">{user.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Email</dt>
                    <dd className="mt-1 break-all font-semibold text-slate-900">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Peran / Jabatan</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${badge.bg}`}>
                        {badge.text}
                      </span>
                      {user.division?.name && <span className="ml-2 text-xs text-slate-600">{user.division.name}</span>}
                    </dd>
                  </div>
                </dl>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Ubah Password</h3>
                {[
                  { name: 'current_password', label: 'Password Saat Ini', autoComplete: 'current-password' },
                  { name: 'new_password', label: 'Password Baru', autoComplete: 'new-password', minLength: 8 },
                  { name: 'new_password_confirmation', label: 'Konfirmasi Password Baru', autoComplete: 'new-password', minLength: 8 },
                ].map((field) => (
                  <div key={field.name}>
                    <label htmlFor={field.name} className="mb-1.5 block text-xs font-semibold text-slate-700">
                      {field.label}
                    </label>
                    <div className="relative">
                      <input
                        id={field.name}
                        name={field.name}
                        type={visiblePasswords[field.name] ? 'text' : 'password'}
                        autoComplete={field.autoComplete}
                        required
                        minLength={field.minLength}
                        value={passwords[field.name]}
                        onChange={(event) => setPasswords((previous) => ({ ...previous, [field.name]: event.target.value }))}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-600"
                      />
                      <button
                        type="button"
                        aria-label={`${visiblePasswords[field.name] ? 'Sembunyikan' : 'Tampilkan'} ${field.label.toLowerCase()}`}
                        aria-pressed={Boolean(visiblePasswords[field.name])}
                        onClick={() => setVisiblePasswords((previous) => ({ ...previous, [field.name]: !previous[field.name] }))}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-800"
                      >
                        {visiblePasswords[field.name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}

                {passwordMessage && (
                  <p
                    role={passwordMessage.type === 'error' ? 'alert' : 'status'}
                    className={`rounded-xl border p-3 text-sm ${
                      passwordMessage.type === 'error'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {passwordMessage.text}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {passwordLoading ? 'Memperbarui...' : 'Simpan Password Baru'}
                </button>
              </form>
            </div>
          </section>
        </div>,
        document.body
      )}
    </header>
  );
}