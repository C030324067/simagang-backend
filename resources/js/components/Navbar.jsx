import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function Navbar({ currentTab, setCurrentTab, onNavigateLogin }) {
  const { user, logout } = useAuth();

  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    if (sectionId === 'home') {
      if (currentTab === 'landing' || !currentTab) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (setCurrentTab) {
        setCurrentTab('landing');
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      }
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else if (setCurrentTab) {
      setCurrentTab('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
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
        
        {/* 1. SISI KIRI (LOGO & JUDUL) */}
        <div 
          className="flex items-center gap-3 cursor-pointer shrink-0" 
          onClick={(e) => handleNavClick(e, 'home')}
        >
          <img 
            src="/images/logo/logo komdigi.png" 
            alt="Logo Komdigi" 
            className="h-11 w-auto object-contain"
          />
          <div>
            <div className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
              SIMAGANG
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              Sistem Informasi Magang<br />
              <span className="text-slate-400">Dinas Komunikasi dan Informasi Kab.Tabalong</span>
            </p>
          </div>
        </div>

        {/* 2. SISI KANAN (MENU & LOGIN MENYATU DALAM WRAPPER FLEX ITEM KANAN) */}
        {!user ? (
          <div className="flex items-center gap-6 shrink-0">
            
            {/* Menu Navigasi */}
            <nav className="hidden md:flex items-center gap-6 font-bold text-sm text-slate-600">
              <a 
                href="#home" 
                onClick={(e) => handleNavClick(e, 'home')}
                className={`transition-colors py-1 ${
                  currentTab === 'landing' || currentTab === 'home' ? 'text-sky-600 font-extrabold' : 'hover:text-sky-600'
                }`}
              >
                Home
              </a>
              <a 
                href="#panduan" 
                onClick={(e) => handleNavClick(e, 'panduan')}
                className="transition-colors py-1 hover:text-sky-600"
              >
                Panduan
              </a>
              <a 
                href="#tentang" 
                onClick={(e) => handleNavClick(e, 'tentang')}
                className="transition-colors py-1 hover:text-sky-600"
              >
                Tentang Kami
              </a>
              <a 
                href="#bidang" 
                onClick={(e) => handleNavClick(e, 'bidang')}
                className="transition-colors py-1 hover:text-sky-600"
              >
                Bidang
              </a>
              <a 
                href="#kontak" 
                onClick={(e) => handleNavClick(e, 'kontak')}
                className="transition-colors py-1 hover:text-sky-600"
              >
                Kontak
              </a>
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
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 leading-tight">{user.name}</p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium border ${badge.bg}`}>
                  {badge.text}
                </span>
                {user.division && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    • {user.division.code}
                  </span>
                )}
              </div>
            </div>

            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-sm shrink-0">
              {user.name?.charAt(0) || 'U'}
            </div>

            <button
              onClick={logout}
              title="Keluar dari akun"
              className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </header>
  );
}