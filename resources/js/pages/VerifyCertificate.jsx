import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Award, 
  Calendar, 
  Building, 
  User, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export default function VerifyCertificate({ defaultHash = '', onBack }) {
  // Check if hash is in URL query or path
  const [hashInput, setHashInput] = useState(defaultHash || 'd85e7a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const verifyHash = async (hashToVerify) => {
    if (!hashToVerify.trim()) return;
    setLoading(true);
    setSearched(true);
    setResult(null);

    const res = await apiRequest(`/public/verify-cert/${hashToVerify.trim()}`);
    if (res.success && res.data) {
      setResult(res.data);
    } else {
      setResult({ valid: false, message: res.message || 'Sertifikat tidak ditemukan pada sistem Diskominfo' });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (defaultHash) {
      verifyHash(defaultHash);
    }
  }, [defaultHash]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Aplikasi
        </button>
      )}

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/20">
          <ShieldCheck className="w-9 h-9" />
        </div>
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">
          Layanan Publik Diskominfo
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Verifikasi Sertifikat Magang Digital (QR)
        </h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Sistem validasi keaslian sertifikat magang resmi Dinas Komunikasi dan Informatika secara daring melalui hash cryptographic SHA-256.
        </p>
      </div>

      {/* Search Input */}
      <div className="max-w-2xl mx-auto bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verifyHash(hashInput);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              placeholder="Masukkan kode unik QR Hash sertifikat..."
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-2"
          >
            {loading ? 'Memvalidasi...' : 'Verifikasi Keaslian'}
          </button>
        </form>
      </div>

      {/* Verification Result Card */}
      {searched && (
        <div className="max-w-2xl mx-auto">
          {result?.valid ? (
            <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-xl overflow-hidden">
              {/* Authentic Header Seal */}
              <div className="bg-emerald-600 p-6 text-white text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">SERTIFIKAT RESMI & TERVERIFIKASI</h3>
                <p className="text-xs text-emerald-100 font-medium">
                  Terdaftar sah dalam basis data Sistem Informasi Magang Diskominfo
                </p>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase">Nama Peserta Magang</span>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{result.intern?.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase">Asal Institusi</span>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{result.intern?.institution}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase">Nomor Sertifikat</span>
                    <p className="font-mono font-bold text-blue-700 mt-0.5">{result.certificate_number}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase">Bidang Penempatan</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{result.intern?.division}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase">Tanggal Penerbitan</span>
                    <p className="font-medium text-slate-700 mt-0.5">{result.issued_at || 'Terbit Resmi'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase">Diterbitkan Oleh</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{result.issued_by}</p>
                  </div>
                </div>

                {/* Score Breakdown */}
                {result.evaluation && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Hasil Evaluasi Akhir Kinerja Magang
                    </span>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Disiplin</span>
                        <span className="font-mono font-bold text-slate-800 text-sm">{result.evaluation.discipline_score}</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Teknis</span>
                        <span className="font-mono font-bold text-slate-800 text-sm">{result.evaluation.skill_score}</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Softskill</span>
                        <span className="font-mono font-bold text-slate-800 text-sm">{result.evaluation.softskill_score}</span>
                      </div>
                      <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                        <span className="text-[10px] text-emerald-600 font-bold uppercase block">Nilai Akhir</span>
                        <span className="font-mono font-extrabold text-emerald-700 text-sm">{result.evaluation.final_score}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Kode Hash Verifikasi Kriptografis</span>
                  <p className="font-mono text-[11px] text-slate-500 break-all mt-1 bg-slate-50 p-2 rounded border border-slate-200">
                    {result.qr_hash}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-red-300 p-8 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600">
                <XCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Sertifikat Tidak Valid / Tidak Ditemukan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Kode QR Hash yang dimasukkan tidak cocok dengan basis data sertifikat resmi Dinas Komunikasi dan Informatika.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

