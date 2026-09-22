import React from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { 
  ShieldCheck, 
  LogOut, 
  User as UserIcon, 
  CheckCircle2, 
  Building2, 
  Briefcase, 
  Award, 
  GraduationCap, 
  Users,
  SearchCheck
} from 'lucide-react';

export default function Navbar({ currentTab, setCurrentTab }) {
  const { user, logout, quickSwitchRole } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'intern':
        return { text: 'Pemohon Magang', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'admin_kepegawaian':
        return { text: 'Admin Kepegawaian', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'kabid':
        return { text: 'Kepala Bidang', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'kadis':
        return { text: 'Kepala Dinas', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'mentor':
        return { text: 'Pembimbing Lapangan', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { text: role, bg: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      {/* Top Government Branding Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium tracking-wide">PORTAL RESMI DISKOMINFO • SISTEM INFORMASI MANAJEMEN MAGANG (SI-MAGANG)</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentTab('verify_cert')}
              className="hover:text-white flex items-center gap-1.5 transition text-xs text-blue-300 font-medium"
            >
              <SearchCheck className="w-3.5 h-3.5" />
              Verifikasi Sertifikat Digital
            </button>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Tahun Anggaran 2026</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">SI-MAGANG</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200/60">
                  Diskominfo
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal">Departemen Komunikasi & Informatika</p>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center justify-between lg:justify-end gap-3">
            {user ? (
              <div className="flex items-center gap-3">
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

                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-sm">
                  {user.name.charAt(0)}
                </div>

                <button
                  onClick={logout}
                  title="Keluar dari akun"
                  className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentTab('login')}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
              >
                Masuk / Login
              </button>
            )}
          </div>
        </div>

        {/* Instant Role Switcher Toolbar (for reviewer testing) */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            Uji Coba Peran (1-Click Switch):
          </span>
          {Object.entries(DEMO_ACCOUNTS).map(([key, item]) => {
            const isActive = user?.role === key;
            return (
              <button
                key={key}
                onClick={() => {
                  quickSwitchRole(key);
                  setCurrentTab('dashboard');
                }}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {isActive && <CheckCircle2 className="w-3 h-3 text-white" />}
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

