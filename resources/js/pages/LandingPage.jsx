import Navbar from '../components/Navbar';
import React, { useState } from 'react';
import useDivisions from '../hooks/useDivisions';

function ProfilePhoto({ src, alt, initials, className }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div aria-label={alt} role="img" className={`${className} flex items-center justify-center bg-[#e0f2fe] text-xl font-bold text-[#0284c7]`}>
        {initials}
      </div>
    );
  }

  return <img src={src} alt={alt} onError={() => setFailed(true)} className={className} />;
}

// Foto untuk masing-masing bidang (4 Bidang Utama)
const divisionPortraits = {
  ikp: '/images/pimpinan/kabid-ikp.png',
  aptika: '/images/pimpinan/kabid-aptika.png',
  statistik: '/images/pimpinan/kabid-statistik.png',
  tki: '/images/pimpinan/kabid-tki.png',
};

export default function LandingPage({ onNavigateLogin, onNavigateRegister, onNavigateTracking }) {
  const [activeTab, setActiveTab] = useState('home');
  const { divisions, error: divisionError } = useDivisions();

  // Filter agar Sekretariat tidak muncul di daftar bidang/kabid
  const filteredDivisions = divisions.filter(
    (division) => (division.code || division.slug || division.name || '').toLowerCase() !== 'sekretariat'
  );

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
    <div className="min-h-screen bg-[#f0f9ff] font-sans text-[#1e293b] selection:bg-[#e0f2fe] selection:text-[#0284c7]">
      
      {/* --- NAVBAR --- */}
      <Navbar
        currentTab={activeTab}
        setCurrentTab={scrollToSection}
        onNavigateLogin={onNavigateLogin}
      />

      {/* --- SECTION 1: HERO --- */}
      <section 
        id="home" 
        className="relative w-full min-h-[calc(100vh-80px)] flex items-center overflow-hidden bg-[#f0f9ff]"
      >
        <div className="absolute inset-y-0 right-0 w-full lg:w-3/5 pointer-events-none z-0">
          <img
            src="/images/logo/diskominfo.png"
            alt="Gedung Diskominfo Tabalong"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f0f9ff] via-[#f0f9ff]/50 via-25% to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f0f9ff] via-transparent to-transparent opacity-90" />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 relative z-10 w-full">
          <div className="max-w-2xl space-y-6 bg-[#f0f9ff]/60 backdrop-blur-[2px] p-4 rounded-2xl lg:bg-transparent lg:p-0">
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#0f172a] leading-[1.15] tracking-tight">
              Sistem Informasi Magang untuk Masa Depan{' '}
              <span className="text-[#0284c7] bg-clip-text text-transparent bg-gradient-to-r from-[#38bdf8] to-[#0284c7]">
                yang Lebih Baik
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-[#334155] font-medium leading-relaxed">
              SIMAGANG hadir sebagai platform resmi untuk memudahkan mahasiswa dalam mengelola seluruh proses magang, mulai dari pengajuan, pelaksanaan, hingga penilaian secara online dan terintegrasi.
            </p>

            {/* --- BUTTONS --- */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onNavigateRegister}
                className="inline-flex items-center justify-between gap-4 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#0284c7] to-[#38bdf8] text-white font-bold text-base shadow-lg shadow-[#0284c7]/20 hover:shadow-xl hover:shadow-[#0284c7]/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
              >
                <span>Pengajuan Magang</span>
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </span>
              </button>

              <button
                type="button"
                onClick={onNavigateTracking}
                className="inline-flex items-center justify-between gap-4 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#0284c7] to-[#38bdf8] text-white font-bold text-base shadow-lg shadow-[#0284c7]/20 hover:shadow-xl hover:shadow-[#0284c7]/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
              >
                <span>Cek Status Pengajuan</span>
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 2: PANDUAN --- */}
      <section id="panduan" className="py-20 bg-[#f0f9ff] relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-12">
          
          <div className="max-w-2xl">
            <span className="text-xs font-black tracking-widest text-[#0284c7] uppercase mb-2 block">
              PANDUAN
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0f172a] tracking-tight leading-tight mb-4">
              Kelola proses magang secara mandiri dan transparan.
            </h2>
            <p className="text-base text-[#64748b] font-normal leading-relaxed">
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
              <div key={idx} className="p-6 rounded-2xl bg-white/80 border border-[#bae6fd]/60 hover:border-[#38bdf8] hover:bg-white transition-all group shadow-sm hover:shadow-md">
                <span className="text-2xl font-black text-[#0284c7] mb-3 block group-hover:scale-110 transition-transform">
                  {item.step}
                </span>
                <h3 className="text-lg font-bold text-[#0f172a] mb-2">{item.title}</h3>
                <p className="text-sm text-[#64748b] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* --- SECTION 3: TENTANG KAMI (STRUKTUR ORGANISASI) --- */}
      <section id="tentang" className="py-20 bg-[#e0f2fe]/40 border-y border-[#bae6fd]/60 relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-12">
          
          <div className="max-w-3xl">
            <span className="text-xs font-black tracking-widest text-[#0284c7] uppercase mb-2 block">
              TENTANG KAMI
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0f172a] tracking-tight leading-tight mb-4">
              Struktur Organisasi Diskominfo Kabupaten Tabalong
            </h2>
            <p className="text-base text-[#64748b] font-normal leading-relaxed">
              Mengenal jajaran pimpinan dan bidang kerja yang menaungi pelaksanaan program magang di Dinas Komunikasi dan Informatika Kabupaten Tabalong.
            </p>
          </div>

          <div className="space-y-10">
            
            {/* 1. KADIS & SEKRETARIS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              
              {/* Card Kepala Dinas */}
              <div className="group p-8 md:p-10 rounded-3xl bg-white border border-[#bae6fd]/80 text-[#0f172a] shadow-sm hover:shadow-xl hover:bg-gradient-to-b hover:from-[#e0f2fe] hover:to-[#bae6fd]/70 hover:border-[#7dd3fc] hover:scale-[1.01] transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden">
                <div className="relative p-2 rounded-full mb-5 bg-[#e0f2fe] group-hover:bg-white transition-colors shadow-inner">
                  <ProfilePhoto 
                    src="/images/pimpinan/kadis.png" 
                    alt="Foto Kepala Dinas" 
                    initials="ES" 
                    className="w-32 h-32 md:w-36 md:h-36 rounded-full object-cover border-4 border-white shadow-md" 
                  />
                </div>
                <span className="text-xs md:text-sm font-extrabold uppercase tracking-wider block mb-2 text-[#0284c7] group-hover:text-[#0369a1] transition-colors">
                  Kepala Dinas Komunikasi dan Informatika
                </span>
                <h3 className="text-2xl md:text-3xl font-black text-[#0f172a] group-hover:text-[#0c4a6e] transition-colors">
                  Eddy Suriyani, S.Sos., M.A.
                </h3>
              </div>

              {/* Card Sekretaris Dinas */}
              <div className="group p-8 md:p-10 rounded-3xl bg-white border border-[#bae6fd]/80 text-[#0f172a] shadow-sm hover:shadow-xl hover:bg-gradient-to-b hover:from-[#e0f2fe] hover:to-[#bae6fd]/70 hover:border-[#7dd3fc] hover:scale-[1.01] transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden">
                <div className="relative p-2 rounded-full mb-5 bg-[#e0f2fe] group-hover:bg-white transition-colors shadow-inner">
                  <ProfilePhoto
                    src="/images/pimpinan/sekdin.png"
                    alt="Foto Sekretaris Dinas"
                    initials="RF"
                    className="w-32 h-32 md:w-36 md:h-36 rounded-full object-cover border-4 border-white shadow-md"
                  />
                </div>
                <span className="text-xs md:text-sm font-extrabold uppercase tracking-wider block mb-2 text-[#0284c7] group-hover:text-[#0369a1] transition-colors">
                  Sekretaris Dinas
                </span>
                <h3 className="text-2xl md:text-3xl font-black text-[#0f172a] group-hover:text-[#0c4a6e] transition-colors">
                  Rully Febriansyah, S.I.Kom., M.I.Kom.
                </h3>
              </div>

            </div>

            {/* Garis Penghubung Alur Struktur */}
            <div className="flex justify-center items-center">
              <div className="w-0.5 h-10 bg-[#38bdf8]/60"></div>
            </div>

            {/* 2. KABID (4 BIDANG UTAMA) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {filteredDivisions.length > 0 ? filteredDivisions.map((division) => (
                <div key={division.id} className="group p-6 rounded-2xl bg-white border border-[#bae6fd]/80 text-[#0f172a] shadow-sm hover:shadow-md hover:bg-gradient-to-b hover:from-[#e0f2fe] hover:to-[#bae6fd]/70 hover:border-[#7dd3fc] hover:scale-[1.01] transition-all duration-300 flex flex-col items-center text-center">
                  <div className="relative p-1.5 rounded-full mb-3 bg-[#e0f2fe] group-hover:bg-white transition-colors">
                    <ProfilePhoto
                      src={divisionPortraits[String(division.code || '').toLowerCase()]}
                      alt={`Foto ${division.active_kabid?.name || division.name}`}
                      initials={(division.active_kabid?.name || division.name).split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                      className="h-24 w-24 rounded-full border-2 border-white object-cover shadow-sm"
                    />
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold mb-2.5 bg-[#e0f2fe] text-[#0284c7] group-hover:bg-white group-hover:text-[#0369a1] transition-colors">
                    {division.name}
                  </span>
                  <h4 className="text-base font-extrabold mb-1 text-[#0f172a] group-hover:text-[#0c4a6e] transition-colors">
                    {division.active_kabid?.name || 'Kepala bidang belum ditetapkan'}
                  </h4>
                  <p className="text-xs font-bold mb-3 text-[#64748b] group-hover:text-[#0284c7] transition-colors">
                    {division.active_kabid?.position || 'Kepala Bidang'}
                  </p>
                  <p className="text-xs leading-relaxed border-t border-[#f1f5f9] pt-3 w-full text-left text-[#64748b] group-hover:border-[#bae6fd] group-hover:text-[#334155] transition-colors">
                    {division.description || 'Informasi bidang belum tersedia.'}
                  </p>
                </div>
              )) : (
                <>
                  {/* Fallback Kabid IKP */}
                  <div className="group p-6 rounded-2xl bg-white border border-[#bae6fd]/80 text-[#0f172a] shadow-sm hover:shadow-md hover:bg-gradient-to-b hover:from-[#e0f2fe] hover:to-[#bae6fd]/70 hover:border-[#7dd3fc] hover:scale-[1.01] transition-all duration-300 flex flex-col items-center text-center">
                    <div className="relative p-1.5 rounded-full mb-3 bg-[#e0f2fe] group-hover:bg-white transition-colors">
                      <ProfilePhoto 
                        src="/images/pimpinan/kabid-ikp.png" 
                        alt="Foto Kabid IKP" 
                        initials="ER" 
                        className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-sm" 
                      />
                    </div>
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold mb-2.5 bg-[#e0f2fe] text-[#0284c7] group-hover:bg-white group-hover:text-[#0369a1] transition-colors">
                      Bidang IKP
                    </span>
                    <h4 className="text-base font-extrabold mb-1 text-[#0f172a] group-hover:text-[#0c4a6e] transition-colors">
                      Eka Rismawina, S.P., M.P.
                    </h4>
                    <p className="text-xs font-bold mb-3 text-[#64748b] group-hover:text-[#0284c7] transition-colors">
                      Kabid Informasi & Komunikasi Publik
                    </p>
                    <p className="text-xs leading-relaxed border-t border-[#f1f5f9] pt-3 w-full text-left text-[#64748b] group-hover:border-[#bae6fd] group-hover:text-[#334155] transition-colors">
                      Mengurusi kemitraan media, pengelolaan pengaduan masyarakat seperti SP4N-LAPOR, PPID, serta diseminasi informasi publik.
                    </p>
                  </div>

                  {/* Fallback Kabid APTIKA */}
                  <div className="group p-6 rounded-2xl bg-white border border-[#bae6fd]/80 text-[#0f172a] shadow-sm hover:shadow-md hover:bg-gradient-to-b hover:from-[#e0f2fe] hover:to-[#bae6fd]/70 hover:border-[#7dd3fc] hover:scale-[1.01] transition-all duration-300 flex flex-col items-center text-center">
                    <div className="relative p-1.5 rounded-full mb-3 bg-[#e0f2fe] group-hover:bg-white transition-colors">
                      <ProfilePhoto 
                        src="/images/pimpinan/kabid-aptika.png" 
                        alt="Foto Kabid APTIKA" 
                        initials="MZ" 
                        className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-sm" 
                      />
                    </div>
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold mb-2.5 bg-[#e0f2fe] text-[#0284c7] group-hover:bg-white group-hover:text-[#0369a1] transition-colors">
                      Bidang APTIKA
                    </span>
                    <h4 className="text-base font-extrabold mb-1 text-[#0f172a] group-hover:text-[#0c4a6e] transition-colors">
                      Muhammad Zainaini, S.Kom., M.T.
                    </h4>
                    <p className="text-xs font-bold mb-3 text-[#64748b] group-hover:text-[#0284c7] transition-colors">
                      Kabid E-Government & Aplikasi
                    </p>
                    <p className="text-xs leading-relaxed border-t border-[#f1f5f9] pt-3 w-full text-left text-[#64748b] group-hover:border-[#bae6fd] group-hover:text-[#334155] transition-colors">
                      Mengurusi tata kelola SPBE, pengembangan aplikasi daerah, infrastruktur TIK, dan program prioritas 1 Desa 1 Wi-Fi.
                    </p>
                  </div>

                  {/* Fallback Kabid Statistik */}
                  <div className="group p-6 rounded-2xl bg-white border border-[#bae6fd]/80 text-[#0f172a] shadow-sm hover:shadow-md hover:bg-gradient-to-b hover:from-[#e0f2fe] hover:to-[#bae6fd]/70 hover:border-[#7dd3fc] hover:scale-[1.01] transition-all duration-300 flex flex-col items-center text-center">
                    <div className="relative p-1.5 rounded-full mb-3 bg-[#e0f2fe] group-hover:bg-white transition-colors">
                      <ProfilePhoto 
                        src="/images/pimpinan/kabid-statistik.png" 
                        alt="Foto Kabid Statistik" 
                        initials="MT" 
                        className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-sm" 
                      />
                    </div>
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold mb-2.5 bg-[#e0f2fe] text-[#0284c7] group-hover:bg-white group-hover:text-[#0369a1] transition-colors">
                      Bidang Statistik
                    </span>
                    <h4 className="text-base font-extrabold mb-1 text-[#0f172a] group-hover:text-[#0c4a6e] transition-colors">
                      Muhammad Tabrani, S.Si, M.M.
                    </h4>
                    <p className="text-xs font-bold mb-3 text-[#64748b] group-hover:text-[#0284c7] transition-colors">
                      Kabid Pengelolaan Data & Statistik Daerah
                    </p>
                    <p className="text-xs leading-relaxed border-t border-[#f1f5f9] pt-3 w-full text-left text-[#64748b] group-hover:border-[#bae6fd] group-hover:text-[#334155] transition-colors">
                      Mengelola data dan statistik sektoral daerah, integrasi Satu Data Indonesia/Daerah, serta pengelolaan portal data daerah.
                    </p>
                  </div>

                  {/* Fallback Kabid TKI */}
                  <div className="group p-6 rounded-2xl bg-white border border-[#bae6fd]/80 text-[#0f172a] shadow-sm hover:shadow-md hover:bg-gradient-to-b hover:from-[#e0f2fe] hover:to-[#bae6fd]/70 hover:border-[#7dd3fc] hover:scale-[1.01] transition-all duration-300 flex flex-col items-center text-center">
                    <div className="relative p-1.5 rounded-full mb-3 bg-[#e0f2fe] group-hover:bg-white transition-colors">
                      <ProfilePhoto 
                        src="/images/pimpinan/kabid-tki.png" 
                        alt="Foto Kabid TKI" 
                        initials="MF" 
                        className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-sm" 
                      />
                    </div>
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold mb-2.5 bg-[#e0f2fe] text-[#0284c7] group-hover:bg-white group-hover:text-[#0369a1] transition-colors">
                      Bidang TKI
                    </span>
                    <h4 className="text-base font-extrabold mb-1 text-[#0f172a] group-hover:text-[#0c4a6e] transition-colors">
                      Mahdiani Fauzi, S.T.
                    </h4>
                    <p className="text-xs font-bold mb-3 text-[#64748b] group-hover:text-[#0284c7] transition-colors">
                      Kabid Telekomunikasi & Keamanan Informasi
                    </p>
                    <p className="text-xs leading-relaxed border-t border-[#f1f5f9] pt-3 w-full text-left text-[#64748b] group-hover:border-[#bae6fd] group-hover:text-[#334155] transition-colors">
                      Mengurusi infrastruktur jaringan telekomunikasi, persandian, dan keamanan informasi daerah.
                    </p>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* --- SECTION 4: BIDANG --- */}
      <section id="bidang" className="py-20 bg-[#f0f9ff] relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black tracking-widest text-[#0284c7] uppercase block">
              BIDANG PILIHAN MAGANG
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0f172a] tracking-tight">
              Mengenal Bidang di Diskominfo Tabalong
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {filteredDivisions.length === 0 ? (
              <p role={divisionError ? 'alert' : 'status'} className="text-sm text-slate-600 md:col-span-2 xl:col-span-4">
                {divisionError || 'Memuat daftar bidang dan kuota...'}
              </p>
            ) : filteredDivisions.map((division) => {
              const isFull = Number(division.remaining_quota) <= 0;

              return (
                <div
                  key={division.id}
                  className="p-8 rounded-3xl bg-white border border-[#bae6fd]/60 hover:bg-[#e0f2fe]/40 hover:border-[#38bdf8] transition-all flex flex-col shadow-sm hover:shadow-md"
                >
                  <h3 className="text-xl font-extrabold text-[#0f172a] mb-3">{division.name}</h3>
                  <p className="text-sm text-[#64748b] leading-relaxed flex-1">
                    {division.description || 'Informasi bidang belum tersedia.'}
                  </p>

                  <div className="mt-6 pt-4 border-t border-[#f1f5f9]">
                    {divisionError ? (
                      <span role="status" className="text-xs font-semibold text-rose-600">
                        Kuota tidak dapat diperbarui: {divisionError}
                      </span>
                    ) : isFull ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#fef2f2] text-[#ef4444] border border-[#fee2e2]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] inline-block"></span>
                        Kuota penuh
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] inline-block"></span>
                        {division.remaining_quota} dari {division.quota} lowongan tersedia
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* --- SECTION 5: PENDAFTARAN ONLINE --- */}
      <section id="kontak" className="py-20 bg-[#e0f2fe]/50 border-t border-[#bae6fd]/60 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <span className="text-xs font-black tracking-widest text-[#0284c7] uppercase block">
            PENDAFTARAN ONLINE
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#0f172a] tracking-tight">
            Siap Memulai Magang?
          </h2>
          <p className="text-base md:text-lg text-[#64748b] font-normal leading-relaxed max-w-2xl mx-auto">
            Seluruh proses permohonan magang dilakukan secara online melalui portal SIMAGANG tanpa perlu pengajuan manual.
          </p>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#e0f2fe]/80 text-[#64748b] pt-16 pb-8 border-t border-[#bae6fd]/80 relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#bae6fd]/60">
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/images/logo/logo komdigi.png" 
                alt="Logo Komdigi" 
                className="h-10 w-auto object-contain"
              />
              <div>
                <h3 className="text-sm font-extrabold text-[#0f172a] leading-tight tracking-wide">
                  DINAS KOMUNIKASI DAN INFORMATIKA
                </h3>
                <p className="text-[11px] text-[#0284c7] font-bold tracking-wider uppercase">
                  PEMERINTAH KABUPATEN TABALONG
                </p>
              </div>
            </div>
            
            <p className="text-xs text-[#64748b] leading-relaxed pt-1">
              Portal SIMAGANG resmi untuk pengajuan mandiri, pemantauan jurnal harian, hingga penerbitan sertifikat magang digital.
            </p>

            <div className="flex items-center gap-2 pt-1">
              {['f', '𝕏', '📷', '▶'].map((icon, idx) => (
                <a key={idx} href="#" className="w-8 h-8 rounded-lg bg-white hover:bg-[#0284c7] hover:text-white text-[#0f172a] flex items-center justify-center transition-all text-xs border border-[#bae6fd]/60">
                  {icon}
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#0f172a] uppercase tracking-widest border-b border-[#bae6fd]/60 pb-2">
              TAUTAN NAVIGASI
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-[#64748b]">
              <li>
                <button onClick={() => scrollToSection('home')} className="hover:text-[#0284c7] transition-colors flex items-center gap-1.5">
                  <span className="text-[#0284c7] font-bold">›</span> Beranda
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('panduan')} className="hover:text-[#0284c7] transition-colors flex items-center gap-1.5">
                  <span className="text-[#0284c7] font-bold">›</span> Panduan Magang
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('tentang')} className="hover:text-[#0284c7] transition-colors flex items-center gap-1.5">
                  <span className="text-[#0284c7] font-bold">›</span> Struktur Organisasi
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('bidang')} className="hover:text-[#0284c7] transition-colors flex items-center gap-1.5">
                  <span className="text-[#0284c7] font-bold">›</span> Bidang Kerja
                </button>
              </li>
              <li>
                <button onClick={onNavigateRegister} className="text-[#0284c7] font-extrabold hover:underline flex items-center gap-1.5">
                  <span className="text-[#0284c7] font-bold">›</span> Form Pengajuan Magang
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#0f172a] uppercase tracking-widest border-b border-[#bae6fd]/60 pb-2">
              KONTAK & ALAMAT
            </h4>
            <ul className="space-y-2.5 text-xs text-[#64748b] leading-relaxed font-medium">
              <li className="flex items-start gap-2">
                <span>📞</span>
                <span>+62 526-2023169 (Kantor)</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✉</span>
                <span>diskominfo@tabalongkab.go.id</span>
              </li>
              <li className="flex items-start gap-2 pt-1">
                <span>💬</span>
                <div>
                  <strong className="text-[#0f172a] block">Bantuan Teknis System:</strong>
                  <a
                    href="https://wa.me/6283809862480"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#16a34a] hover:underline font-bold"
                  >
                    +62 838-0986-2480 (WA Helpdesk)
                  </a>
                </div>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#0f172a] uppercase tracking-widest border-b border-[#bae6fd]/60 pb-2">
              JAM LAYANAN VERIFIKASI
            </h4>
            <div className="bg-white/80 border border-[#bae6fd]/60 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between border-b border-[#bae6fd]/40 pb-2">
                <span className="text-[#64748b] font-medium">Senin - Kamis</span>
                <span className="font-bold text-[#0f172a]">08.00 - 16.00 WITA</span>
              </div>
              <div className="flex justify-between border-b border-[#bae6fd]/40 pb-2">
                <span className="text-[#64748b] font-medium">Jumat</span>
                <span className="font-bold text-[#0f172a]">08.00 - 11.30 WITA</span>
              </div>
              <div className="flex justify-between text-[#64748b] font-medium pt-0.5">
                <span>Sabtu - Minggu / Libur</span>
                <span className="text-[#ef4444] font-bold">Tutup</span>
              </div>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-[#64748b]">
          <p>© 2026 · DINAS KOMUNIKASI DAN INFORMATIKA TABALONG</p>
          
          <div className="flex items-center gap-4">
            <p className="text-[#0284c7] font-bold uppercase tracking-wider text-[11px]">
              PEMERINTAH KABUPATEN TABALONG
            </p>
            <button
              onClick={scrollToTop}
              title="Kembali ke atas"
              className="w-9 h-9 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white font-black flex items-center justify-center shadow-md shadow-[#0284c7]/20 transition-transform hover:-translate-y-1 cursor-pointer"
            >
              ▲
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}