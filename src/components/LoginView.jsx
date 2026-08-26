import React, { useState } from 'react';
import { Warehouse, Lock, Mail, AlertCircle, LogIn, Eye, EyeOff } from 'lucide-react';
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

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col lg:grid lg:grid-cols-12 overflow-x-hidden selection:bg-sky-500 selection:text-white">
      
      {/* ========================================================= */}
      {/* LEFT COLUMN: HERO VIDEO (Clean, Unobstructed Video Player) */}
      {/* ========================================================= */}
      <div className="relative lg:col-span-6 xl:col-span-7 h-64 sm:h-80 lg:h-full min-h-0 lg:min-h-screen overflow-hidden flex flex-col justify-between p-6 sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-950">
        
        {/* Background Video */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover filter brightness-95 contrast-105"
          >
            <source src="/login-bg.mp4" type="video/mp4" />
            Browser Anda tidak mendukung pemutaran video.
          </video>

          {/* Clean Subtle Dark Gradients & Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-slate-950/80 lg:to-slate-950/90" />
        </div>

        {/* Minimal Clean Brand Watermark (Top Left) */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 p-0.5 shadow-lg shadow-sky-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950/80 backdrop-blur-md rounded-[10px] flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
              NDK <span className="text-sky-400">Warehouse</span>
            </span>
            <p className="text-[11px] text-slate-400 font-medium">Warehouse Management System</p>
          </div>
        </div>

        {/* Empty bottom space to let the video shine unobstructed */}
        <div className="relative z-10" />
      </div>

      {/* ========================================================= */}
      {/* RIGHT COLUMN: CLEAN ENTERPRISE LOGIN FORM                 */}
      {/* ========================================================= */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 xl:p-16 bg-slate-950 relative">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md space-y-6 relative z-10 animate-in fade-in duration-300">
          
          {/* Header */}
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Masuk ke Akun
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Silakan masukkan email dan kata sandi Anda untuk melanjutkan.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            
            {/* Error Alert */}
            {error && (
              <div className="p-3.5 bg-rose-950/60 border border-rose-800/70 text-rose-300 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="nama@perusahaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Kata Sandi
              </label>
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
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </div>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Sistem</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Copyright */}
          <div className="pt-6 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} NDK Warehouse. Seluruh hak cipta dilindungi.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
