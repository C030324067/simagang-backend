import React, { useState } from 'react';

function ProfilePhoto({ src, alt, initials, className }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div aria-label={alt} role="img" className={`${className} flex items-center justify-center bg-sky-50 text-xl font-bold text-sky-700`}>
        {initials}
      </div>
    );
  }

  return <img src={src} alt={alt} onError={() => setFailed(true)} className={className} />;
}

export default function LandingPage({ onNavigateLogin, onNavigateRegister }) {
  const [activeTab, setActiveTab] = useState('home');

  const scrollToSection = (id) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 selection:bg-sky-100">
      
      {/* --- NAVBAR --- */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection('home')}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500 text-white font-black text-lg shadow-md shadow-sky-500/20">
              SM
            </div>
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

          {/* Navigasi Links */}
          <nav className="hidden md:flex items-center gap-8 font-bold text-sm text-slate-600">
            {[
              { id: 'home', label: 'Home' },
              { id: 'panduan', label: 'Panduan' },
              { id: 'tentang', label: 'Tentang Kami' },
              { id: 'bidang', label: 'Bidang' },
              { id: 'kontak', label: 'Kontak' },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`transition-colors py-1 relative ${
                  activeTab === link.id ? 'text-sky-600 font-extrabold' : 'hover:text-sky-600'
                }`}
              >
                {link.label}
                {activeTab === link.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-sky-600 rounded-full"></span>
                )}
              </button>
            ))}
          </nav>

          {/* Tombol Login */}
          <button
            onClick={onNavigateLogin}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-sky-600 text-white text-sm font-bold shadow-lg shadow-sky-600/25 hover:bg-sky-700 transition-all hover:-translate-y-0.5"
          >
            <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
            Login
          </button>
        </div>
      </header>

      {/* --- SECTION 1: HOME (HERO) --- */}
      <section id="home" className="pt-12 pb-20 md:py-24 bg-gradient-to-b from-sky-50/50 to-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.15] tracking-tight">
              Sistem Informasi Magang untuk Masa Depan <span className="text-sky-600">yang Lebih Baik</span>
            </h1>
            <p className="text-base md:text-lg text-slate-500 font-normal leading-relaxed max-w-xl">
              SIMAGANG hadir sebagai platform resmi untuk memudahkan mahasiswa dalam mengelola seluruh proses magang secara online dan terintegrasi.
            </p>
            <div className="pt-4">
              <button
                onClick={onNavigateRegister}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-sky-600 text-white font-bold text-base shadow-xl shadow-sky-600/30 hover:bg-sky-700 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                Ajukan Sekarang
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-tr from-sky-100 to-sky-50 p-6 md:p-8 border border-sky-100 shadow-2xl shadow-sky-100/50">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center justify-between border-b pb-4 border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  </div>
                  <span className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full">SIMAGANG Portal</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-center">
                    <span className="block text-xs font-bold text-sky-700">Pengajuan</span>
                    <span className="text-[10px] text-slate-500">Online</span>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
                    <span className="block text-xs font-bold text-indigo-700">Laporan</span>
                    <span className="text-[10px] text-slate-500">Harian</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                    <span className="block text-xs font-bold text-emerald-700">Penilaian</span>
                    <span className="text-[10px] text-slate-500">Sertifikat</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="h-2 w-3/4 bg-slate-200 rounded"></div>
                  <div className="h-2 w-1/2 bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- SECTION 2: PANDUAN --- */}
      <section id="panduan" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-12">
          
          <div className="max-w-2xl">
            <span className="text-xs font-black tracking-widest text-sky-600 uppercase mb-2 block">
              PANDUAN
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
              Kelola proses magang secara mandiri dan transparan.
            </h2>
            <p className="text-base text-slate-500 font-normal leading-relaxed">
              Seluruh alur pelayanan magang kini dilakukan serba digital, mulai dari pengajuan berkas hingga penerbitan sertifikat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
            {[
              {
                step: "01",
                title: "Registrasi Online",
                desc: "Isi data diri, buat password akun, dan pilih bidang tujuan secara langsung di portal."
              },
              {
                step: "02",
                title: "Unggah Berkas",
                desc: "Lampirkan surat pengantar institusi, CV, transkrip nilai, dan kartu siswa/mahasiswa."
              },
              {
                step: "03",
                title: "Verifikasi Sistem",
                desc: "Tim Diskominfo Tabalong akan memeriksa kelengkapan berkas yang Anda unggah secara online."
              },
              {
                step: "04",
                title: "Pelaksanaan & Jurnal",
                desc: "Login ke akun Anda untuk mengisi jurnal kegiatan harian dan mengunduh sertifikat magang."
              }
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-sky-200 transition-all group hover:shadow-lg hover:shadow-sky-50/50">
                <span className="text-2xl font-black text-sky-500 mb-3 block group-hover:scale-110 transition-transform">
                  {item.step}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

{/* --- SECTION 3: TENTANG KAMI (STRUKTUR ORGANISASI) --- */}
<section id="tentang" className="py-20 bg-slate-50/60 border-y border-slate-100">
  <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-12">
    
    <div className="max-w-3xl">
      <span className="text-xs font-black tracking-widest text-sky-600 uppercase mb-2 block">
        TENTANG KAMI
      </span>
      <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
        Struktur Organisasi Diskominfo Kabupaten Tabalong
      </h2>
      <p className="text-base text-slate-500 font-normal leading-relaxed">
        Mengenal jajaran pimpinan dan bidang kerja yang menaungi pelaksanaan program magang di Dinas Komunikasi dan Informatika Kabupaten Tabalong.
      </p>
    </div>

    <div className="space-y-8">
      {/* Pimpinan Atas: Kadis & Sekdin */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        
        {/* Kepala Dinas */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-center relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-sky-600"></div>
          <ProfilePhoto src="/images/pimpinan/kadis.png" alt="Foto Kepala Dinas" initials="ES" className="w-24 h-24 rounded-full object-cover border-4 border-sky-100 shadow-md mb-4 mt-2" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Kepala Dinas Komunikasi dan Informatika</span>
          <h3 className="text-xl font-extrabold text-slate-900">Eddy Suriyani, S.Sos., M.A.</h3>
        </div>

        {/* Sekretaris Dinas */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-center relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-700"></div>
          <ProfilePhoto src="/images/pimpinan/sekdin.png" alt="Foto Sekretaris Dinas" initials="RF" className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-md mb-4 mt-2" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Sekretaris Dinas</span>
          <h3 className="text-xl font-extrabold text-slate-900">Rully Febriansyah</h3>
        </div>
      </div>

      {/* Garis Penghubung */}
      <div className="flex justify-center items-center">
        <div className="w-0.5 h-8 bg-sky-200"></div>
      </div>

      {/* Kepala Bidang (Kabid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Kabid IKP */}
        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-sky-300 transition-all flex flex-col items-center text-center">
          <ProfilePhoto src="/images/pimpinan/kabid-ikp.jpeg" alt="Foto Kabid IKP" initials="ER" className="w-20 h-20 rounded-full object-cover border-2 border-sky-100 shadow-sm mb-3" />
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold bg-sky-100 text-sky-800 mb-2">
            Bidang IKP
          </span>
          <h4 className="text-base font-extrabold text-slate-900 mb-0.5">Eka Rismawina</h4>
          <p className="text-xs font-bold text-slate-500 mb-3">Kabid Informasi & Komunikasi Publik</p>
          <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3 text-left w-full">
            Mengurusi kemitraan media, pengelolaan pengaduan masyarakat seperti SP4N-LAPOR, PPID, serta diseminasi informasi publik.
          </p>
        </div>

        {/* Kabid APTIKA */}
        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-sky-300 transition-all flex flex-col items-center text-center">
          <ProfilePhoto src="/images/pimpinan/kabid-aptika.png" alt="Foto Kabid APTIKA" initials="MZ" className="w-20 h-20 rounded-full object-cover border-2 border-sky-100 shadow-sm mb-3" />
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold bg-sky-100 text-sky-800 mb-2">
            Bidang APTIKA
          </span>
          <h4 className="text-base font-extrabold text-slate-900 mb-0.5">Muhammad Zainaini</h4>
          <p className="text-xs font-bold text-slate-500 mb-3">Kabid E-Government & Aplikasi</p>
          <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3 text-left w-full">
            Mengurusi tata kelola SPBE, pengembangan aplikasi daerah, infrastruktur TIK, dan program prioritas 1 Desa 1 Wi-Fi.
          </p>
        </div>

        {/* Kabid Statistik */}
        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-sky-300 transition-all flex flex-col items-center text-center">
          <ProfilePhoto src="/images/pimpinan/kabid-statistik.png" alt="Foto Kabid Statistik" initials="KS" className="w-20 h-20 rounded-full object-cover border-2 border-sky-100 shadow-sm mb-3" />
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold bg-sky-100 text-sky-800 mb-2">
            Bidang Statistik
          </span>
          <h4 className="text-base font-extrabold text-slate-900 mb-0.5">Kepala Bidang Statistik</h4>
          <p className="text-xs font-bold text-slate-500 mb-3">Pengelolaan Data & Statistik Daerah</p>
          <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3 text-left w-full">
            Mengelola data dan statistik sektoral daerah, integrasi Satu Data Indonesia/Daerah, serta pengelolaan portal data daerah.
          </p>
        </div>

      </div>

    </div>

  </div>
</section>

      {/* --- SECTION 4: BIDANG --- */}
      <section id="bidang" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black tracking-widest text-sky-600 uppercase block">
              BIDANG PILIHAN MAGANG
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Mengenal Bidang di Diskominfo Tabalong
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-sky-50/50 hover:border-sky-200 transition-all">
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">Bidang APTIKA</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                <strong className="text-slate-800 font-bold">Aplikasi Informatika</strong> — Mengelola aplikasi, jaringan, dan sistem informasi untuk mendukung layanan digital pemerintahan.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-sky-50/50 hover:border-sky-200 transition-all">
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">Bidang IKP</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                <strong className="text-slate-800 font-bold">Informasi & Komunikasi Publik</strong> — Mengelola kehumasan, media massa, pengaduan masyarakat, serta keterbukaan informasi publik.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-sky-50/50 hover:border-sky-200 transition-all">
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">Bidang Statistik</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                <strong className="text-slate-800 font-bold">Statistik Sektoral</strong> — Mengelola pengumpulan, validasi, dan integrasi data statistik daerah untuk mendukung perencanaan pemerintahan.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* --- SECTION 5: PENDAFTARAN ONLINE --- */}
      <section id="kontak" className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <span className="text-xs font-black tracking-widest text-sky-600 uppercase block">
            PENDAFTARAN ONLINE
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Siap Memulai Magang?
          </h2>
          <p className="text-base md:text-lg text-slate-500 font-normal leading-relaxed max-w-2xl mx-auto">
            Seluruh proses permohonan magang dilakukan secara online melalui portal SIMAGANG tanpa perlu pengajuan manual.
          </p>
        </div>
      </section>

      {/* --- FOOTER CERAH (DESAIN WARNA PUTIH & BIRU PASTEL) --- */}
      <footer className="bg-gradient-to-b from-slate-50 via-sky-50/40 to-sky-100/50 text-slate-600 pt-16 pb-8 border-t border-sky-100/80">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-sky-200/60">
          
          {/* KOLOM 1: IDENTITAS */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-sky-500 text-white font-black flex items-center justify-center text-base shadow-md shadow-sky-500/20">
                SM
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight tracking-wide">
                  DINAS KOMUNIKASI DAN INFORMATIKA
                </h3>
                <p className="text-[11px] text-sky-600 font-bold tracking-wider uppercase">
                  PEMERINTAH KABUPATEN TABALONG
                </p>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed pt-1">
              Portal SIMAGANG resmi untuk pengajuan mandiri, pemantauan jurnal harian, hingga penerbitan sertifikat magang digital.
            </p>

            {/* Sosial Media Ikon Soft */}
            <div className="flex items-center gap-2 pt-1">
              {['f', '𝕏', '📷', '▶'].map((icon, idx) => (
                <a key={idx} href="#" className="w-8 h-8 rounded-lg bg-white hover:bg-sky-600 hover:text-white text-slate-600 flex items-center justify-center transition-all text-xs border border-slate-200 shadow-sm">
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* KOLOM 2: TAUTAN NAVIGASI */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-sky-700 uppercase tracking-widest border-b border-sky-200/60 pb-2">
              TAUTAN NAVIGASI
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-600">
              <li>
                <button onClick={() => scrollToSection('home')} className="hover:text-sky-600 transition-colors flex items-center gap-1.5">
                  <span className="text-sky-500 font-bold">›</span> Beranda
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('panduan')} className="hover:text-sky-600 transition-colors flex items-center gap-1.5">
                  <span className="text-sky-500 font-bold">›</span> Panduan Magang
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('tentang')} className="hover:text-sky-600 transition-colors flex items-center gap-1.5">
                  <span className="text-sky-500 font-bold">›</span> Struktur Organisasi
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('bidang')} className="hover:text-sky-600 transition-colors flex items-center gap-1.5">
                  <span className="text-sky-500 font-bold">›</span> Bidang Kerja
                </button>
              </li>
              <li>
                <button onClick={onNavigateRegister} className="text-sky-600 font-extrabold hover:underline flex items-center gap-1.5">
                  <span className="text-sky-500 font-bold">›</span> Form Pengajuan Magang
                </button>
              </li>
            </ul>
          </div>

          {/* KOLOM 3: KONTAK & HELPDESK */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-sky-700 uppercase tracking-widest border-b border-sky-200/60 pb-2">
              KONTAK & ALAMAT
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed font-medium">
              <li className="flex items-start gap-2">
                <span className="text-sky-600">📞</span>
                <span>+62 526-2023169 (Kantor)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-600">✉️</span>
                <span>diskominfo@tabalongkab.go.id</span>
              </li>
              <li className="flex items-start gap-2 pt-1">
                <span className="text-emerald-600">💬</span>
                <div>
                  <strong className="text-slate-800 block">Bantuan Teknis System:</strong>
                  <a
                    href="https://wa.me/6283809862480"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:underline font-bold"
                  >
                    +62 838-0986-2480 (WA Helpdesk)
                  </a>
                </div>
              </li>
            </ul>
          </div>

          {/* KOLOM 4: JAM LAYANAN (CARD PUTIH CLEAN) */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-sky-700 uppercase tracking-widest border-b border-sky-200/60 pb-2">
              JAM LAYANAN VERIFIKASI
            </h4>
            <div className="bg-white border border-sky-100 rounded-2xl p-4 text-xs space-y-2 shadow-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Senin - Kamis</span>
                <span className="font-bold text-slate-800">08.00 - 16.00 WITA</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Jumat</span>
                <span className="font-bold text-slate-800">08.00 - 11.30 WITA</span>
              </div>
              <div className="flex justify-between text-slate-400 font-medium pt-0.5">
                <span>Sabtu - Minggu / Libur</span>
                <span className="text-rose-500 font-bold">Tutup</span>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM BAR & TOMBOL SCROLL TOP */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
          <p>© 2026 · DINAS KOMUNIKASI DAN INFORMATIKA TABALONG</p>
          
          <div className="flex items-center gap-4">
            <p className="text-slate-400 uppercase tracking-wider text-[11px]">
              PEMERINTAH KABUPATEN TABALONG
            </p>
            <button
              onClick={scrollToTop}
              title="Kembali ke atas"
              className="w-9 h-9 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-black flex items-center justify-center shadow-md shadow-sky-600/20 transition-transform hover:-translate-y-1 cursor-pointer"
            >
              ▲
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
