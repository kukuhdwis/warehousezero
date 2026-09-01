import React, { useEffect } from 'react';
import { Package, ShieldCheck, Zap, ArrowRight, Warehouse, CheckCircle2 } from 'lucide-react';
import { setSEO } from '../utils/seo';

export default function LandingPage({ currentUser }) {
  useEffect(() => {
    setSEO(
      "NDK Warehouse - Official E-Katalog & Sistem Manajemen Knalpot",
      "Katalog resmi produk knalpot NDK Exhaust. Sistem informasi manajemen gudang dan katalog produk original NDK Exhaust."
    );
  }, []);
  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleStaffPortalClick = () => {
    if (currentUser) {
      navigateTo('/dashboard');
    } else {
      navigateTo('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-sky-200">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Warehouse className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">WarehouseZero</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateTo('/catalog')}
              className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              Katalog Produk
            </button>
            <button
              onClick={handleStaffPortalClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-900/20 transition active:scale-95 cursor-pointer"
            >
              {currentUser ? 'Ke Dashboard' : 'Login Staf'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse"></span>
          Sistem Terintegrasi v2.0
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
          Kelola Inventaris Dengan <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">
            Akurasi Penuh
          </span>
        </h1>
        
        <p className="max-w-2xl text-lg sm:text-xl text-slate-500 mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          WarehouseZero adalah sistem manajemen gudang modern untuk NDK Exhaust. Lacak pergerakan stok, kelola multi-cabang, dan pantau ketersediaan barang secara real-time dalam satu dasbor cerdas.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-7 duration-700">
          <button
            onClick={() => navigateTo('/catalog')}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-sky-500/30 transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Package className="w-5 h-5" />
            Lihat E-Katalog Publik
          </button>
          <button
            onClick={handleStaffPortalClick}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200 hover:border-slate-300 rounded-2xl font-bold text-lg shadow-sm transition active:scale-95 cursor-pointer"
          >
            {currentUser ? 'Masuk ke Dashboard' : 'Masuk ke Portal Staf'}
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Dibangun Untuk Kecepatan & Keamanan</h2>
            <p className="mt-4 text-slate-500">Teknologi modern yang memastikan operasi gudang berjalan tanpa hambatan.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-6">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Sinkronisasi Real-Time</h3>
              <p className="text-slate-500 leading-relaxed">
                Setiap perubahan stok langsung terlihat di semua perangkat seketika tanpa perlu memuat ulang halaman.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Zero-Trust Security</h3>
              <p className="text-slate-500 leading-relaxed">
                Sistem keamanan berbasis aturan backend (Firestore Rules) memastikan data tidak dapat dimanipulasi dari luar.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Katalog Otomatis</h3>
              <p className="text-slate-500 leading-relaxed">
                Barang yang dimasukkan ke Master Data secara otomatis dipublikasikan ke E-Katalog untuk dilihat kustomer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Warehouse className="w-6 h-6 text-slate-400" />
          <span className="font-extrabold text-xl tracking-tight text-white">WarehouseZero</span>
        </div>
        <p className="text-slate-400 text-sm">
          Sistem Manajemen Inventaris Internal &copy; {new Date().getFullYear()} NDK Exhaust.
        </p>
        <p className="text-slate-500 text-xs mt-2">
          Created by <a href="https://kukuhdwisaputra.site" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">kukuhdwisaputra.site</a>
        </p>
      </footer>
    </div>
  );
}
