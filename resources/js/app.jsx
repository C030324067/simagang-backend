import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import InternDashboard from './pages/InternDashboard';
import KepegawaianDashboard from './pages/KepegawaianDashboard';
import KabidDashboard from './pages/KabidDashboard';
import KadisDashboard from './pages/KadisDashboard';
import MentorDashboard from './pages/MentorDashboard';
import VerifyCertificate from './pages/VerifyCertificate';
import RegisterApplicationPage from './pages/RegisterApplicationPage';

// --- KOMPONEN FORM PENGAJUAN MAGANG (LANGSUNG DI SINI AGAR TIDAK BLANK) ---
function ApplyPage({ onBack, onSuccess }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    institution: '',
    major: '',
    startDate: '',
    endDate: '',
    proposalFile: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto my-12 px-6 py-10 text-center bg-white rounded-3xl border border-slate-200 shadow-xl space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Pengajuan Berhasil Dikirim!</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Terima kasih telah mengajukan permohonan magang di Diskominfo Tabalong.
          Berkas Anda akan diverifikasi. Akun login beserta info selanjutnya akan dikirim ke email <strong>{formData.email}</strong>.
        </p>
        <div className="pt-4">
          <button
            onClick={onSuccess}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-8 px-4">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        ← Kembali ke Beranda
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-10 shadow-xl space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
            Formulir Permohonan
          </span>
          <h1 className="text-2xl font-black text-slate-800 mt-2">Pengajuan Magang / PKL</h1>
          <p className="text-sm text-slate-500 mt-1">
            Silakan isi data pengajuan Anda. Akun login akan dibuatkan oleh sistem setelah permohonan disetujui.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Lengkap *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Contoh: Ahmad Rizky"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Aktif *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="email@domain.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nomor WhatsApp *</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="081234567890"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Asal Sekolah / Kampus *</label>
              <input
                type="text"
                name="institution"
                required
                value={formData.institution}
                onChange={handleChange}
                placeholder="Contoh: Universitas Lambung Mangkurat"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Jurusan *</label>
              <input
                type="text"
                name="major"
                required
                value={formData.major}
                onChange={handleChange}
                placeholder="Teknik Informatika"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tanggal Mulai *</label>
              <input
                type="date"
                name="startDate"
                required
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tanggal Selesai *</label>
              <input
                type="date"
                name="endDate"
                required
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Upload Proposal / Surat Pengantar (PDF) *</label>
            <input
              type="file"
              name="proposalFile"
              accept=".pdf"
              required
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Mengirimkan Pengajuan...' : 'Kirim Permohonan Magang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- MAIN APP ---
function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('landing');
  const [urlHash, setUrlHash] = useState('');

  useEffect(() => {
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

  if (currentTab === 'verify_cert') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        <main className="flex-1">
          <VerifyCertificate defaultHash={urlHash} onBack={() => setCurrentTab('landing')} />
        </main>
        <Footer />
      </div>
    );
  }

  // Jika belum login
  if (!user) {
    if (currentTab === 'login') {
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

    if (currentTab === 'apply') {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
          <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
          <main className="flex-1">
            <RegisterApplicationPage onLogin={() => setCurrentTab('login')} />
          </main>
          <Footer />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <main className="flex-1">
          <LandingPage 
            onNavigateLogin={() => setCurrentTab('login')} 
            onNavigateRegister={() => setCurrentTab('apply')}
          />
        </main>
        <Footer />
      </div>
    );
  }

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
  return null;
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
