import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, ChevronDown, Eye, EyeOff, LogOut, Menu, UserRound, X } from 'lucide-react';
import { apiRequest, getToken } from '../api';

export default function Navbar({ currentTab, setCurrentTab, onNavigateLogin }) {
  const { user, logout, fetchProfile } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [activeRole, setActiveRole] = useState(() => localStorage.getItem('simagang_active_role') || '');
  const [roleSwitchMessage, setRoleSwitchMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [profilePhotoLightboxOpen, setProfilePhotoLightboxOpen] = useState(false);
  const [profilePhotoOptionsOpen, setProfilePhotoOptionsOpen] = useState(false);
  const [profileCameraOpen, setProfileCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const profileMenuRef = useRef(null);
  const profilePhotoInputRef = useRef(null);
  const profileCameraInputRef = useRef(null);
  const profileVideoRef = useRef(null);
  const profileCameraStreamRef = useRef(null);

  useEffect(() => {
    if (!profilePhotoPreview.startsWith('blob:')) return undefined;
    return () => URL.revokeObjectURL(profilePhotoPreview);
  }, [profilePhotoPreview]);

  useEffect(() => () => profileCameraStreamRef.current?.getTracks().forEach((track) => track.stop()), []);

  useEffect(() => {
    if (!user) {
      setActiveRole('');
      return;
    }

    const roles = Array.isArray(user.available_roles) ? user.available_roles : [user.role];
    const storedRole = localStorage.getItem('simagang_active_role');
    const nextRole = roles.includes(storedRole) ? storedRole : user.role;
    setActiveRole(nextRole || '');

    if (nextRole) {
      localStorage.setItem('simagang_active_role', nextRole);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (!profilePhotoLightboxOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setProfilePhotoLightboxOpen(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [profilePhotoLightboxOpen]);

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
    setProfileForm({ name: user?.name || '', email: user?.email || '' });
    setProfilePhotoFile(null);
    setProfilePhotoPreview(user?.profile_photo_url || '');
    setProfilePhotoLightboxOpen(false);
    setProfilePhotoOptionsOpen(false);
    setProfileMessage(null);
    setPasswords({ current_password: '', new_password: '', new_password_confirmation: '' });
    setVisiblePasswords({});
    setProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    if (profileSaving) return;
    stopProfileCamera();
    setProfilePhotoLightboxOpen(false);
    setProfileModalOpen(false);
    setProfileMessage(null);
  };

  const stopProfileCamera = () => {
    profileCameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    profileCameraStreamRef.current = null;
    if (profileVideoRef.current) profileVideoRef.current.srcObject = null;
    setProfileCameraOpen(false);
  };

  const openProfileCamera = async () => {
    setProfilePhotoOptionsOpen(false);
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      || window.matchMedia('(pointer: coarse)').matches;
    if (isMobile) {
      profileCameraInputRef.current?.click();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Browser ini tidak mendukung akses kamera.');
      setProfileCameraOpen(true);
      return;
    }

    setCameraError('');
    setProfileCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      profileCameraStreamRef.current = stream;
      if (profileVideoRef.current) {
        profileVideoRef.current.srcObject = stream;
        await profileVideoRef.current.play();
      }
    } catch {
      setCameraError('Akses kamera ditolak atau kamera sedang digunakan aplikasi lain.');
    }
  };

  const captureProfilePhoto = () => {
    const video = profileVideoRef.current;
    if (!video || video.readyState < 2) {
      setCameraError('Tunggu sampai pratinjau kamera siap.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError('Foto tidak dapat diambil. Coba lagi.');
        return;
      }
      const photo = new File([blob], `profile-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setProfilePhotoFile(photo);
      setProfilePhotoPreview(URL.createObjectURL(photo));
      setProfileMessage(null);
      stopProfileCamera();
    }, 'image/jpeg', 0.9);
  };

  const handleProfilePhotoSelect = (event) => {
    const file = event.target.files?.[0];
    setProfilePhotoOptionsOpen(false);
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setProfileMessage({ type: 'error', text: 'Pilih foto JPG, PNG, atau WebP maksimal 2 MB.' });
      event.target.value = '';
      return;
    }
    setProfilePhotoFile(file);
    setProfilePhotoPreview(URL.createObjectURL(file));
    setProfileMessage(null);
    event.target.value = '';
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    const payload = new FormData();
    payload.append('name', profileForm.name);
    payload.append('email', profileForm.email);
    if (profilePhotoFile instanceof File) payload.append('profile_photo', profilePhotoFile);
    if (passwords.new_password) {
      payload.append('current_password', passwords.current_password);
      payload.append('new_password', passwords.new_password);
      payload.append('new_password_confirmation', passwords.new_password_confirmation);
    }

    const result = await apiRequest('/auth/profile', { method: 'POST', body: payload });
    setProfileSaving(false);
    if (!result.success) {
      const errors = result.errors || {};
      setProfileMessage({
        type: 'error',
        text: errors.profile_photo?.[0] || errors.current_password?.[0] || errors.new_password?.[0] || errors.email?.[0] || errors.name?.[0] || result.message || 'Profil tidak dapat diperbarui.',
      });
      return;
    }

    setProfilePhotoFile(null);
    setProfilePhotoPreview('');
    setPasswords({ current_password: '', new_password: '', new_password_confirmation: '' });
    await fetchProfile();
    setVisiblePasswords({});
    setProfileMessage({ type: 'success', text: result.message || 'Perubahan profil berhasil disimpan.' });
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

  const roleBadge = getRoleBadge(user?.role, user?.division?.name);
  const badge = {
    ...roleBadge,
    text: user?.position?.trim() || user?.division?.name || roleBadge.text,
  };
  const availableRoles = Array.isArray(user?.available_roles)
    ? user.available_roles
    : [user?.role].filter(Boolean);
  const selectedRole = availableRoles.includes(activeRole) ? activeRole : user?.role;
  const roleLabels = { kabid: 'Kepala Bidang', mentor: 'Mentor' };

  const handleRoleSwitch = async (role) => {
    setRoleSwitchMessage('');
    try {
      const response = await fetch('/switch-role', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
        },
        body: JSON.stringify({ role }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        setRoleSwitchMessage(result.message || 'Konteks peran tidak dapat diganti.');
        return;
      }

      localStorage.setItem('simagang_active_role', result.data.active_role);
      setActiveRole(result.data.active_role);
      setRoleSwitchMessage(result.message || 'Konteks berhasil diganti.');
      setProfileMenuOpen(false);
    } catch {
      setRoleSwitchMessage('Konteks peran tidak dapat diganti. Periksa koneksi lalu coba lagi.');
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-3 sm:px-6 md:px-12">
        
        {/* 1. SISI KIRI (LOGO TABALONG, LOGO DISKOMINFO & JUDUL CENTER-ALIGNED) */}
        <div 
          className="flex min-w-0 items-center gap-2 sm:gap-3 cursor-pointer shrink-0"
          onClick={(e) => handleNavClick(e, 'home')}
        >
          {/* Logo Kabupaten Tabalong */}
          <img 
            src="/images/logo/logo_setda.png" 
            alt="Logo Kab. Tabalong" 
            className="h-8 w-auto object-contain shrink-0 sm:h-10"
          />
          {/* Logo Diskominfo */}
          <img 
            src="/images/logo/logo komdigi.png" 
            alt="Logo Komdigi" 
            className="hidden h-8 w-auto object-contain shrink-0 sm:block sm:h-10"
          />
          
          {/* Teks Brand */}
          <div className="flex min-w-0 flex-col justify-center leading-none">
            <span className="text-lg font-extrabold text-slate-900 tracking-tight leading-none sm:text-xl">
              SIMAGANG
            </span>
            <span className="hidden text-[11px] font-medium text-slate-500 leading-tight mt-1 sm:block">
              Sistem Informasi Magang
            </span>
            <span className="hidden text-[10px] font-normal text-slate-400 leading-tight sm:block">
              Dinas Komunikasi dan Informasi Kab.Tabalong
            </span>
          </div>
        </div>

        {/* 2. SISI KANAN (MENU & LOGIN) */}
        {!user ? (
          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            
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
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-sky-600/25 transition-all hover:bg-sky-700 sm:px-6 sm:py-2.5 cursor-pointer shrink-0"
            >
              <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
              Login
            </button>

            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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

              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700">
                {user.profile_photo_url
                  ? <img src={user.profile_photo_url} alt="Foto profil" className="h-full w-full object-cover" />
                  : user.name?.charAt(0) || 'U'}
              </span>
              <span className="hidden sm:block"><ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} /></span>
              <span className="rounded-lg p-1 text-slate-500 sm:hidden">{profileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</span>
            </button>

            {profileMenuOpen && (
              <div role="menu" className="absolute right-0 top-full z-[60] mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">Jabatan: {user.position || user.division?.name || 'Belum diatur'}</p>
                  <p className="mt-1 text-xs font-medium text-indigo-700">Konteks aktif: {roleLabels[selectedRole] || selectedRole}</p>
                </div>
                {availableRoles.length > 1 && (
                  <div className="border-b border-slate-100 px-2 py-2">
                    <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Ganti peran</p>
                    {availableRoles.map((role) => (
                      <button
                        key={role}
                        type="button"
                        role="menuitem"
                        disabled={role === selectedRole}
                        onClick={() => handleRoleSwitch(role)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${role === selectedRole ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        <span>{roleLabels[role] || role}</span>
                        {role === selectedRole && <span aria-label="Aktif">✓</span>}
                      </button>
                    ))}
                    {roleSwitchMessage && <p role="status" className="px-3 pt-2 text-xs text-slate-600">{roleSwitchMessage}</p>}
                  </div>
                )}
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
      {!user && mobileMenuOpen && (
        <nav aria-label="Navigasi utama" className="absolute inset-x-0 top-full border-b border-slate-200 bg-white px-4 py-3 shadow-lg md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(event) => { handleNavClick(event, item.id); setMobileMenuOpen(false); }}
                className={`rounded-xl px-4 py-3 text-sm font-bold ${isNavActive(item.id) ? 'bg-sky-50 text-sky-700' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      )}
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
                <p className="mt-1 text-sm text-slate-500">Perbarui profil, foto, atau password akun.</p>
              </div>
              <button
                type="button"
                onClick={closeProfileModal}
                disabled={profileSaving}
                aria-label="Tutup profil"
                className="rounded-lg px-2 py-1 text-xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <form onSubmit={handleProfileUpdate} className="space-y-5">
                <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-base font-bold text-slate-900">Informasi Profil</h3>
                <div className="flex flex-col items-center gap-3 pb-2">
                  <div className="relative inline-block">
                    {profilePhotoPreview || user.profile_photo_url ? (
                      <button
                        type="button"
                        onClick={() => setProfilePhotoLightboxOpen(true)}
                        aria-label="Lihat foto profil ukuran penuh"
                        className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-200 shadow ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-600"
                      >
                        <img src={profilePhotoPreview || user.profile_photo_url} alt="Pratinjau foto profil" className="h-full w-full rounded-full object-cover" />
                      </button>
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-200 text-3xl font-bold text-slate-500 shadow ring-1 ring-slate-200">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <input
                      ref={profileCameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="hidden"
                      onChange={handleProfilePhotoSelect}
                    />
                    <input
                      ref={profilePhotoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePhotoSelect}
                    />
                    <button
                      type="button"
                      aria-label="Pilih sumber foto profil"
                      aria-expanded={profilePhotoOptionsOpen}
                      onClick={() => setProfilePhotoOptionsOpen((open) => !open)}
                      className="absolute -bottom-1 -right-1 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-sky-600 text-white shadow hover:bg-sky-700"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    {profilePhotoOptionsOpen && (
                      <div className="absolute left-1/2 top-full z-20 mt-2 w-52 -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-xl">
                        <button
                          type="button"
                          onClick={openProfileCamera}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Kamera
                        </button>
                        <button
                          type="button"
                          onClick={() => profilePhotoInputRef.current?.click()}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Pilih dari Galeri
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-500">Ganti Foto - JPG, PNG, WebP maksimal 2 MB</span>
                </div>

                <div>
                  <label htmlFor="profile-name" className="mb-1.5 block text-xs font-semibold text-slate-700">Nama</label>
                  <input
                    id="profile-name"
                    required
                    maxLength={255}
                    value={profileForm.name}
                    onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>
                <div>
                  <label htmlFor="profile-email" className="mb-1.5 block text-xs font-semibold text-slate-700">Email</label>
                  <input
                    id="profile-email"
                    type="email"
                    required
                    maxLength={255}
                    value={profileForm.email}
                    onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-semibold">Jabatan:</span>{' '}
                  <span className={`inline-flex rounded-md border px-2 py-1 font-semibold ${badge.bg}`}>{badge.text}</span>
                  {user.division?.name && <span className="ml-2">{user.division.name}</span>}
                </div>
                </section>

                <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Ubah Password</h3>
                    <p className="mt-1 text-xs text-slate-500">Kosongkan jika tidak ingin mengganti password.</p>
                  </div>
                  {[
                    { name: 'current_password', label: 'Password Saat Ini', autoComplete: 'current-password' },
                    { name: 'new_password', label: 'Password Baru', autoComplete: 'new-password', minLength: 8 },
                    { name: 'new_password_confirmation', label: 'Konfirmasi Password Baru', autoComplete: 'new-password', minLength: 8 },
                  ].map((field) => (
                    <div key={field.name}>
                      <label htmlFor={field.name} className="mb-1.5 block text-xs font-semibold text-slate-700">{field.label}</label>
                      <div className="relative">
                        <input
                          id={field.name}
                          name={field.name}
                          type={visiblePasswords[field.name] ? 'text' : 'password'}
                          autoComplete={field.autoComplete}
                          minLength={field.minLength}
                          value={passwords[field.name]}
                          onChange={(event) => setPasswords((previous) => ({ ...previous, [field.name]: event.target.value }))}
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-600"
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
                </section>

                {profileMessage && (
                  <p role={profileMessage.type === 'error' ? 'alert' : 'status'} className={`rounded-xl border p-3 text-sm ${profileMessage.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                    {profileMessage.text}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="w-full rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {profileSaving ? 'Menyimpan perubahan...' : 'Simpan Perubahan'}
                </button>
              </form>
            </div>
          </section>
          {profilePhotoLightboxOpen && (profilePhotoPreview || user.profile_photo_url) && (
            <div
              className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/90 p-5 backdrop-blur-sm"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setProfilePhotoLightboxOpen(false);
              }}
            >
              <button
                type="button"
                onClick={() => setProfilePhotoLightboxOpen(false)}
                aria-label="Tutup foto"
                className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </button>
              <img
                src={profilePhotoPreview || user.profile_photo_url}
                alt={`Foto profil ${user.name || ''}`}
                className="max-h-[85vh] max-w-[min(90vw,900px)] rounded-lg object-contain shadow-2xl"
              />
            </div>
          )}
          {profileCameraOpen && (
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 p-4"
              onMouseDown={(event) => { if (event.target === event.currentTarget) stopProfileCamera(); }}
            >
              <section role="dialog" aria-modal="true" aria-labelledby="profile-camera-title" className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 id="profile-camera-title" className="text-lg font-bold text-slate-900">Ambil Foto Profil</h2>
                  <button type="button" aria-label="Tutup kamera" onClick={stopProfileCamera} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
                </div>
                <video ref={profileVideoRef} autoPlay playsInline muted className="aspect-video w-full rounded-xl bg-slate-950 object-cover" />
                {cameraError && <p role="alert" className="mt-3 text-sm text-rose-700">{cameraError}</p>}
                <button type="button" onClick={captureProfilePhoto} disabled={Boolean(cameraError)} className="mt-4 w-full rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">Ambil Foto</button>
              </section>
            </div>
          )}
        </div>,
        document.body
      )}
    </header>
  );
}
