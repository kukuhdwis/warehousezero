import React, { useState } from 'react';
import { 
  Warehouse, 
  Lock, 
  Mail, 
  AlertCircle, 
  LogIn, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Layers, 
  Boxes,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { loginUser } from '../services/authService';

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userData = await loginUser(email, password);
      onLoginSuccess(userData);
    } catch (err) {
      setError(err.message || 'Email atau kata sandi tidak valid. Silakan periksa kembali.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col lg:grid lg:grid-cols-12 overflow-x-hidden selection:bg-sky-500 selection:text-white">
      
      {/* ========================================================= */}
      {/* LEFT COLUMN: HERO VIDEO SHOWCASE (Full Height on Desktop) */}
      {/* ========================================================= */}
      <div className="relative lg:col-span-6 xl:col-span-7 h-64 sm:h-80 lg:h-full min-h-0 lg:min-h-screen overflow-hidden flex flex-col justify-between p-6 sm:p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-950">
        
        {/* Background Video */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover scale-105 filter brightness-90 contrast-105"
          >
            <source src="/login-bg.mp4" type="video/mp4" />
            Browser Anda tidak mendukung tag video HTML5.
          </video>

          {/* High-End Dark Gradients & Ambient Lighting */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/90 lg:to-slate-950" />
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Video Overlay: Top Header / Brand Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 p-0.5 shadow-lg shadow-sky-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950/80 backdrop-blur-md rounded-[14px] flex items-center justify-center">
                <Warehouse className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  Warehouse<span className="text-sky-400">Zero</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  v1.2 PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Enterprise Warehouse Ecosystem</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-slate-800/80 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-3" />
            <span className="text-[11px] font-medium text-slate-300">Live Logistics Engine</span>
          </div>
        </div>

        {/* Video Overlay: Bottom Highlights & Glass Card (Desktop view) */}
        <div className="relative z-10 hidden lg:block space-y-6 max-w-xl">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" /> Presisi Tinggi & Multi-Cabang
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Manajemen Inventaris & Logistik Cerdas Otomotif
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Pantau mutasi barang, pemindaian barcode/QR instan, valuasi stok cabang, dan integrasi cloud Google Firebase dalam satu platform terpadu.
            </p>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-slate-800/80 shadow-xl">
              <div className="flex items-center gap-2 text-sky-400 mb-1">
                <Boxes className="w-4 h-4" />
                <span className="text-xs font-semibold text-slate-300">Multi-Gudang</span>
              </div>
              <p className="text-xs text-slate-400">Pusat & Cabang Terhubung</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-slate-800/80 shadow-xl">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-semibold text-slate-300">Aman & Terkendali</span>
              </div>
              <p className="text-xs text-slate-400">Hak Akses Role (RBAC)</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-slate-800/80 shadow-xl">
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <Layers className="w-4 h-4" />
                <span className="text-xs font-semibold text-slate-300">Real-Time Sync</span>
              </div>
              <p className="text-xs text-slate-400">Cloud Firestore Ready</p>
            </div>
          </div>
        </div>

        {/* Mobile Mini Title */}
        <div className="relative z-10 lg:hidden mt-auto pt-4">
          <h2 className="text-xl font-bold text-white leading-snug drop-shadow-md">
            Sistem Manajemen Gudang & Stok Terintegrasi
          </h2>
          <p className="text-xs text-slate-300 mt-1 drop-shadow">
            Masuk untuk mengakses dasbor inventaris multi-cabang.
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT COLUMN: LOGIN CARD & FORM                           */}
      {/* ========================================================= */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 xl:p-16 bg-slate-950/80 backdrop-blur-2xl relative">
        
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Form Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Portal Akses Terenkripsi</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Selamat Datang Kembali 👋
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Masukkan kredensial akun Anda untuk mengelola inventaris dan stok gudang.
            </p>
          </div>

          {/* Quick Demo Fill Buttons */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>⚡ Akses Cepat Demo:</span>
              <span className="text-[10px] text-sky-400 font-normal">Klik untuk mengisi</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@perusahaan.com', 'admin')}
                className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 hover:border-sky-500/50 text-left transition group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white group-hover:text-sky-300">Admin Pusat</span>
                  <CheckCircle2 className="w-3 h-3 text-sky-400 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <p className="text-[10px] text-slate-400 truncate">admin@perusahaan.com</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('budi.surabaya@perusahaan.com', 'admin')}
                className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 hover:border-sky-500/50 text-left transition group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white group-hover:text-sky-300">Staf Gudang</span>
                  <CheckCircle2 className="w-3 h-3 text-sky-400 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <p className="text-[10px] text-slate-400 truncate">budi.surabaya@...</p>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-rose-950/60 border border-rose-800/70 text-rose-300 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Email Pengguna
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="admin@perusahaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 flex items-center justify-center gap-2 mt-3 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Akses...</span>
                </div>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Sistem Gudang</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="pt-4 border-t border-slate-800/80 text-center space-y-1">
            <p className="text-[11px] text-slate-500">
              WarehouseZero Enterprise System • Hak Cipta Dilindungi
            </p>
            <p className="text-[10px] text-slate-600 font-mono">
              Mode Cloud Sync & Local Storage Active
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
