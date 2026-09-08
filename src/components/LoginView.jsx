import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, LogIn, Eye, EyeOff, ArrowLeft } from 'lucide-react';
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

  const handleBackToHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden racing-grid selection:bg-red-500 selection:text-white">
      
      {/* Ambient Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-sky-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Symmetrical Centered Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-3xl p-7 sm:p-10 shadow-2xl backdrop-blur-xl relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Brand Logos: Symmetrical Lockup (NDK & RGN) */}
        <div className="flex flex-col items-center justify-center space-y-5 text-center">
          <div className="flex items-center justify-center gap-4 sm:gap-5 py-1">
            <img 
              src="/logos/ndk-white.png" 
              alt="NDK Exhaust" 
              className="h-9 sm:h-10 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform"
            />
            <span className="h-6 w-[1px] bg-slate-700" />
            <img 
              src="/logos/rgn-white.png" 
              alt="RGN Performance" 
              className="h-8 sm:h-9 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform"
            />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display uppercase">
              Masuk ke Sistem
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Silakan masukkan email dan kata sandi Anda untuk melanjutkan.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-950/60 border border-rose-800/70 text-rose-300 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email Input */}
          <div className="space-y-1.5 text-left">
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
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5 text-left">
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
                className="w-full pl-10 pr-11 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition"
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
            className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-red-600/30 hover:shadow-red-600/40 flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
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

        {/* Back to Home Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleBackToHome}
            className="w-full py-3 px-4 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white font-medium rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Utama</span>
          </button>
        </div>

        {/* Footer Copyright */}
        <div className="pt-4 border-t border-slate-800/80 text-center space-y-1">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} NDK Exhaust × RGN Performance.
          </p>
          <p className="text-[11px] text-slate-500">
            Dikembangkan oleh{' '}
            <a 
              href="https://kukuhdwisaputra.site" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-red-400 hover:text-red-300 hover:underline transition font-medium"
            >
              kukuhdwisaputra.site
            </a>
          </p>
        </div>

      </div>

    </div>
  );
}
