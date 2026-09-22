import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import InternDashboard from './pages/InternDashboard';
import KepegawaianDashboard from './pages/KepegawaianDashboard';
import KabidDashboard from './pages/KabidDashboard';
import KadisDashboard from './pages/KadisDashboard';
import MentorDashboard from './pages/MentorDashboard';
import VerifyCertificate from './pages/VerifyCertificate';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [urlHash, setUrlHash] = useState('');

  useEffect(() => {
    // Check if current URL is /verify-cert/:hash
    const path = window.location.pathname;
    if (path.startsWith('/verify-cert/')) {
      const hash = path.replace('/verify-cert/', '');
      setUrlHash(hash);
      setCurrentTab('verify_cert');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Memuat SI-MAGANG Diskominfo...</p>
        </div>
      </div>
    );
  }

  // If user opens public verify certificate page
  if (currentTab === 'verify_cert') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        <main className="flex-1">
          <VerifyCertificate defaultHash={urlHash} onBack={() => setCurrentTab('dashboard')} />
        </main>
        <Footer />
      </div>
    );
  }

  // If not logged in, show Login page
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        <main className="flex-1">
          <LoginPage onSuccess={() => setCurrentTab('dashboard')} />
        </main>
        <Footer />
      </div>
    );
  }

  // Render role-specific dashboard
  const renderDashboard = () => {
    switch (user.role) {
      case 'intern':
        return <InternDashboard />;
      case 'admin_kepegawaian':
        return <KepegawaianDashboard />;
      case 'kabid':
        return <KabidDashboard />;
      case 'kadis':
        return <KadisDashboard />;
      case 'mentor':
        return <MentorDashboard />;
      default:
        return (
          <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl border border-slate-200 text-center">
            <p className="text-sm text-slate-700">Peran akun ({user.role}) tidak dikenali.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <main className="flex-1">
        {renderDashboard()}
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 space-y-1">
        <p className="font-medium text-slate-600">
          SI-MAGANG © {new Date().getFullYear()} Dinas Komunikasi dan Informatika (Diskominfo). Hak Cipta Dilindungi.
        </p>
        <p className="text-[11px] text-slate-400">
          Arsitektur RESTful Laravel 11/13 • Otentikasi Sanctum RBAC • Frontend React & Tailwind CSS
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}

