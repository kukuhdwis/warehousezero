import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  ArrowRight, 
  ExternalLink, 
  MapPin, 
  BookOpen, 
  LogIn, 
  ShoppingBag,
  MessageCircle,
  ZoomIn,
  X
} from 'lucide-react';
import { 
  TokopediaIcon, 
  ShopeeIcon, 
  WhatsAppIcon, 
  InstagramIcon, 
  TikTokIcon, 
  YouTubeIcon 
} from './SocialIcons';
import { setSEO } from '../utils/seo';
import { toggleThemeWithClipPath } from '../utils/themeAnimation';

// Real Product Showcase Items (from /fotoproduk/)
const PRODUCT_SHOWCASE = [
  {
    id: 'prod-1',
    src: '/fotoproduk/fotoproduk.webp',
    name: 'NDK DK-03 v3',
    sound: 'FULL BASS',
    type: 'Universal Muffler',
    spec: 'Double TIG Argon Welding • High Flow Canister'
  },
  {
    id: 'prod-2',
    src: '/fotoproduk/fotoproduk2.webp',
    name: 'NDK DK-02 v3',
    sound: 'DRY BASS',
    type: 'Curved Tail Muffler',
    spec: 'Burn Purple Tip Finish • Dry Deep Bass Sound'
  },
  {
    id: 'prod-3',
    src: '/fotoproduk/fotoproduk3.webp',
    name: 'NDK DK-03 v4',
    sound: 'ROUND BASS',
    type: 'High RPM Muffler',
    spec: 'AKRF Short Tail Design • Double TIG Welding'
  },
  {
    id: 'prod-4',
    src: '/fotoproduk/fotoproduk4.webp',
    name: 'NDK DK-03 v4 BOLT ON',
    sound: 'PLUG & PLAY',
    type: 'Honda Brio Spec',
    spec: 'Presisi PNP Tanpa Las • Mandrel Bend Precision'
  },
  {
    id: 'prod-5',
    src: '/fotoproduk/fotoproduk5.webp',
    name: 'NDK DK-01 v3',
    sound: 'DRY SCREAMING',
    type: 'Race Muffler',
    spec: 'Large 4-Inch Exhaust Tip • Screaming High Tone'
  }
];

export default function LandingPage({ currentUser }) {
  // Lightbox Modal state for product showcase
  const [selectedProductImage, setSelectedProductImage] = useState(null);

  // Dark / Light Mode State with LocalStorage Persistence
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('ndk_theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      // Default to dark mode for authentic motorsport aesthetic
      return true;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ndk_theme', isDark ? 'dark' : 'light');
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDark]);

  const handleToggleTheme = (e) => {
    toggleThemeWithClipPath(e, () => {
      const next = !isDark;
      setIsDark(next);
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('ndk_theme', next ? 'dark' : 'light');
    });
  };

  useEffect(() => {
    setSEO({
      title: "NDK Exhaust × RGN Performance | Precision Exhaust Engineering & E-Katalog Resmi",
      description: "Manufaktur knalpot mobil stainless steel presisi berbasis di Purbalingga, Jawa Tengah. E-Katalog resmi knalpot racing, harian, downpipe, frontpipe, resonator, dan muffler bensin & diesel.",
      keywords: "ndk exhaust, rgn performance, knalpot purbalingga, knalpot stainless steel, knalpot racing, downpipe, frontpipe, resonator, muffler mobil, knalpot diesel",
      canonical: "https://warehousezero.web.app/",
      image: "https://warehousezero.web.app/logos/ndk-black.png",
      type: "website"
    });

    // Preload both dark and light logos for instant zero-lag theme transitions
    ['/logos/ndk-white.png', '/logos/ndk-black.png', '/logos/rgn-white.png', '/logos/rgn-black.png'].forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const handleNavigateCatalog = () => {
    window.history.pushState({}, '', '/catalog');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleNavigateLogin = () => {
    window.history.pushState({}, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Safe fallback theme logos
  const ndkLogo = isDark ? '/logos/ndk-white.png' : '/logos/ndk-black.png';
  const rgnLogo = isDark ? '/logos/rgn-white.png' : '/logos/rgn-black.png';

  return (
    <div className={`min-h-screen font-body antialiased transition-colors duration-300 selection:bg-ember selection:text-white ${
      isDark ? 'bg-ink text-paper' : 'bg-paper text-ink'
    }`}>
      
      {/* ========================================================= */}
      {/* HEADER / NAVIGATION                                       */}
      {/* ========================================================= */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
        isDark ? 'bg-ink/95 border-zinc-800' : 'bg-paper/95 border-zinc-200 shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Lockup: NDK & RGN with Seamless Stacked Crossfade */}
          <a className="flex items-center gap-2.5 sm:gap-3 group py-1" href="#beranda">
            <div className="relative h-6 sm:h-7 w-[88px] sm:w-[100px] flex items-center">
              <img 
                alt="NDK Exhaust Logo" 
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-in-out ${
                  isDark ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`} 
                src="/logos/ndk-white.png"
              />
              <img 
                alt="NDK Exhaust Logo" 
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-in-out ${
                  isDark ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`} 
                src="/logos/ndk-black.png"
              />
            </div>

            <span className={`h-4 sm:h-5 w-[1px] transition-colors duration-300 ${isDark ? 'bg-zinc-700' : 'bg-zinc-300'}`} />

            <div className="relative h-5 sm:h-6 w-[78px] sm:w-[90px] flex items-center">
              <img 
                alt="RGN Performance Logo" 
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-in-out ${
                  isDark ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`} 
                src="/logos/rgn-white.png"
              />
              <img 
                alt="RGN Performance Logo" 
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-in-out ${
                  isDark ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`} 
                src="/logos/rgn-black.png"
              />
            </div>
          </a>

          {/* Navigation Menu (Beranda, Testimoni, Tentang Kami, Katalog) */}
          <nav className={`hidden md:flex items-center space-x-7 text-xs sm:text-sm font-display uppercase tracking-widest ${
            isDark ? 'text-zinc-300' : 'text-zinc-700'
          }`}>
            <a className={`hover:text-ember transition-colors ${isDark ? 'text-white' : 'text-ink font-semibold'}`} href="#beranda">
              Beranda
            </a>
            <a className="hover:text-ember transition-colors" href="#testimoni">
              Testimoni
            </a>
            <a className="hover:text-ember transition-colors" href="#workshop">
              Tentang Kami
            </a>
            <button 
              type="button" 
              onClick={handleNavigateCatalog}
              className="hover:text-ember transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-ember" />
              <span>Katalog</span>
            </button>
          </nav>

          {/* Action Buttons: Dark Mode Toggle, Dashboard, & Consultation CTA */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* Dark/Light Mode Toggle Button */}
            <button
              type="button"
              onClick={handleToggleTheme}
              title={isDark ? "Beralih ke Light Mode" : "Beralih ke Dark Mode"}
              className={`p-2 rounded-lg border transition-all duration-200 cursor-pointer flex items-center justify-center ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-700 text-amber-400 hover:bg-zinc-800 hover:text-amber-300' 
                  : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900'
              }`}
              aria-label="Toggle Dark/Light Mode"
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            {/* Dashboard / Portal Button (Always visible on mobile & desktop) */}
            <button
              type="button"
              onClick={handleNavigateLogin}
              title={currentUser ? "Buka Dashboard Internal" : "Masuk ke Dashboard Sistem"}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded text-xs font-display uppercase tracking-wider font-semibold border transition cursor-pointer ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-ember hover:text-white' 
                  : 'bg-zinc-100 border-zinc-300 text-zinc-800 hover:border-ember hover:text-ember'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-ember" />
              <span>Dashboard</span>
            </button>

            {/* CTA Button: WhatsApp Consultation (Hidden on mobile to prevent duplicate button directly above Hero CTA) */}
            <a 
              className="hidden md:inline-flex bg-ember hover:bg-ember-deep text-white text-xs font-display font-semibold uppercase tracking-wider px-3.5 sm:px-5 py-2.5 rounded transition-all shadow-md items-center gap-2" 
              href="https://wa.me/6289502240040?text=Halo%20NDK%20Exhaust%20%26%20RGN%20Performance%2C%20saya%20ingin%20konsultasi%20exhaust%20system." 
              rel="noopener noreferrer" 
              target="_blank"
            >
              <span>KONSULTASI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTENT                                              */}
      {/* ========================================================= */}
      <main id="beranda">
        
        {/* ========================================================= */}
        {/* HERO SECTION WITH FULL SCREEN MARQUEE CAROUSEL TRACK      */}
        {/* ========================================================= */}
        <section className={`relative py-1.5 sm:py-2.5 px-1 sm:px-2 overflow-hidden racing-grid ${
          isDark ? 'bg-ink text-paper' : 'bg-zinc-950 text-white'
        }`}>
          {/* Subtle Ambient Flare */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-ember/20 blur-[130px] rounded-full pointer-events-none" />

          {/* Full Screen Width Frame with Thin Borders */}
          <div className="relative w-full rounded-xl sm:rounded-2xl border border-zinc-800/90 bg-black/70 shadow-2xl overflow-hidden mb-2">
            
            <div className="relative w-full overflow-hidden h-[500px] sm:h-[580px] lg:h-[640px]">
              <div className="marquee-track h-full">
                
                {/* Slide 1: Stainless Precision */}
                <div className="relative w-[360px] sm:w-[480px] lg:w-[580px] h-full shrink-0 border-r border-zinc-800/80 group">
                  <img 
                    alt="Precision Stainless Steel Exhaust Pipe" 
                    className="w-full h-full object-cover filter brightness-[0.65] group-hover:brightness-[0.8] transition-all duration-700 scale-105 group-hover:scale-100" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQL_hzk8XUnFhLUS_Xo6saaeHkT54VNmCZOuyf3rZPKRekCwLzlxXP4imYr9xG6G0AZJUo8KTtgndkzNsaiA8AUlod5NuFcIBlCQpw5xzg8VYlOPjwiMiByg8lVtJ4GlGA_uirf3RagqXA0scBJXc4Hl3djvWRZ50suVJUZEw199AdSDXlxR1U9H4rDdQQQuK9Ywjp13EttVghGDNyVSAdYsD3cav9dwt6MkhVT4aadtkkInV_keGs"
                  />
                  <div className="absolute bottom-6 left-6 right-6 z-10">
                    <span className="text-[10px] font-mono uppercase tracking-widest bg-ember/30 text-white px-2 py-0.5 rounded border border-ember/40">
                      Precision TIG Welding
                    </span>
                    <p className="font-display text-lg text-white font-bold uppercase mt-1">Stainless Steel Craftsmanship</p>
                  </div>
                </div>

                {/* Slide 2: Gas Flow Simulation */}
                <div className="relative w-[360px] sm:w-[480px] lg:w-[580px] h-full shrink-0 border-r border-zinc-800/80 group">
                  <img 
                    alt="Exhaust Sound Performance & Flow" 
                    className="w-full h-full object-cover filter brightness-[0.65] group-hover:brightness-[0.8] transition-all duration-700 scale-105 group-hover:scale-100" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMTlNHy8rzO_cWzR7RuNuTCT8Fd8Vxs5L64A--ruN_7Fe9oG4LMxn3BaY1Xzqfm_LTctHpL1OcBqm2HjJ3QQU5u886WBGPORGWWQeK0aoLotjJuS-pEZ-zil5aksCLfGaD1rnLeQdIma23Y8LuwOAsE1fTTdjhP7PrNufvFIXgnAQdpMVuDdOU6rpBP7OH1ry3NeUvx8Jh1Zx-fSoSaCcmF5fHCtYv9t4fMb027eUw31Xa7AjSrMkI"
                  />
                  <div className="absolute bottom-6 left-6 right-6 z-10">
                    <span className="text-[10px] font-mono uppercase tracking-widest bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                      Backpressure R&D
                    </span>
                    <p className="font-display text-lg text-white font-bold uppercase mt-1">High Flow Gas Acceleration</p>
                  </div>
                </div>

                {/* Slide 3: Argon Welded Header */}
                <div className="relative w-[360px] sm:w-[480px] lg:w-[580px] h-full shrink-0 border-r border-zinc-800/80 group">
                  <img 
                    alt="Sports Car Exhaust System" 
                    className="w-full h-full object-cover filter brightness-[0.65] group-hover:brightness-[0.8] transition-all duration-700 scale-105 group-hover:scale-100" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOhU6Fu9-luO2zFupw42D8-t3VkoKq7h17eveoAdwi-X5pnMTj6FTUn0d0I-Jf7U18VrH0tbh4OJ35utnrHRjXZuA1g9Rmqfi9xYxf_QcG05I0mF0g2JBEH_9RrQ2P1bM_PQ20oPP6Tw2InzZ4Nd49LChtTa0Jna1j55nuZvd1_mW7WM0MfT74-bFSOr01WtPuiwJ4X8IaN5zTbNZM4gRtRqRz1DatltAbdg9QzVi2YzFKdV_KzDLD"
                  />
                  <div className="absolute bottom-6 left-6 right-6 z-10">
                    <span className="text-[10px] font-mono uppercase tracking-widest bg-ember/30 text-white px-2 py-0.5 rounded border border-ember/40">
                      Laminar Gas Flow
                    </span>
                    <p className="font-display text-lg text-white font-bold uppercase mt-1">Turbo Downpipe & Frontpipe</p>
                  </div>
                </div>

                {/* Slide 4: Track Performance */}
                <div className="relative w-[360px] sm:w-[480px] lg:w-[580px] h-full shrink-0 border-r border-zinc-800/80 group">
                  <img 
                    alt="Motorsport Engineering" 
                    className="w-full h-full object-cover filter brightness-[0.6] group-hover:brightness-[0.8] transition-all duration-700 scale-105 group-hover:scale-100" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZNhgMOPQw6hoSL5tSrKyRL3BBJizGyBa51m6xDbqlPqurWDpBg1RVxkvM62ED9iDSRfvCuo2CifCtHYFf_Xbx5paWcD3ynKs1jZGyL97Wq1qX830kUDOGJyixczJWAVlC7CJYTrFwuUlCgoAyAlLDeVC4VCLTP4Z_8k0xbfGe0kZX-DzXcrOtK4qUiqtLplguxZ8HwFP4UsopUy5mPrXuv5sGcJGuxHjCG1QnE2pYdFUfVpiXuKEq"
                  />
                  <div className="absolute bottom-6 left-6 right-6 z-10">
                    <span className="text-[10px] font-mono uppercase tracking-widest bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                      Zero Drone Tech
                    </span>
                    <p className="font-display text-lg text-white font-bold uppercase mt-1">Acoustic Harmonics Engineering</p>
                  </div>
                </div>

                {/* Duplicate Set for Seamless Continuous Sliding Loop */}
                <div className="relative w-[360px] sm:w-[480px] lg:w-[580px] h-full shrink-0 border-r border-zinc-800/80 group">
                  <img 
                    alt="Precision Stainless Steel Exhaust Pipe" 
                    className="w-full h-full object-cover filter brightness-[0.65] group-hover:brightness-[0.8] transition-all duration-700 scale-105 group-hover:scale-100" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJLgvGBhrXtflPZHli1cMz3ojOTHf_Z_d54K8BdcM_ks97DQUTC8JN4Jx4NVe5c0Z68Ih77RtcVaXorZDK-BX2MrMbBWjGUKDsHB-Wrsfr3NyLg5Ch89FujctjTUyiJGzXJngeLxqRz0SoGCgAOsrFuGYN8MqJTTPVlEkJyEtkKUBWU90TMawATtEefX6wwWVtCo4_sQT-jU02AeJmnI6oraFg0Z_1pTPrKoVruVHFWO-YRxXsb4YX"
                  />
                  <div className="absolute bottom-6 left-6 right-6 z-10">
                    <span className="text-[10px] font-mono uppercase tracking-widest bg-ember/30 text-white px-2 py-0.5 rounded border border-ember/40">
                      Precision TIG Welding
                    </span>
                    <p className="font-display text-lg text-white font-bold uppercase mt-1">Stainless Steel Craftsmanship</p>
                  </div>
                </div>

                <div className="relative w-[360px] sm:w-[480px] lg:w-[580px] h-full shrink-0 border-r border-zinc-800/80 group">
                  <img 
                    alt="Exhaust Sound Performance & Flow" 
                    className="w-full h-full object-cover filter brightness-[0.65] group-hover:brightness-[0.8] transition-all duration-700 scale-105 group-hover:scale-100" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCCQKXB8zaNBid_3o_Im3DUI9q8cs3iXyaLkofWjV1AnqYH_HxyT16j8GPOThPVCEJ0ZgXZ4PyGBhzRo5qT1LQnh4_DNOj1sKaC9F0rAqYldnxILgiDVE6EgWQYcCJdiaUYV8xyl3Qthpsnylj1oOaFzHWuwF_EOB8esqFuRRWzMShoJyMDmo3Pg-yUTovAEUL83boJf6aETDQaFT8pwHp3A73uRU5pOXp3DlMPa7DzKA0MHJS48Q0"
                  />
                  <div className="absolute bottom-6 left-6 right-6 z-10">
                    <span className="text-[10px] font-mono uppercase tracking-widest bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                      Backpressure R&D
                    </span>
                    <p className="font-display text-lg text-white font-bold uppercase mt-1">High Flow Gas Acceleration</p>
                  </div>
                </div>

                <div className="relative w-[360px] sm:w-[480px] lg:w-[580px] h-full shrink-0 border-r border-zinc-800/80 group">
                  <img 
                    alt="Sports Car Exhaust System" 
                    className="w-full h-full object-cover filter brightness-[0.65] group-hover:brightness-[0.8] transition-all duration-700 scale-105 group-hover:scale-100" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVHs2e50t7RQX7QoAFYEAiAiXCxAUzC2Ibfieion8Bkne9ElEz8w4AiUJeR-ZbzkHrY2zBkIfSZ0M0xNzqhnrTBv_-DVgyJaFvDhftMZw0qiHinWmZFruPxroFUuO293gRNzOl22IxX-Qxj2jLKvywirTblZ2aNp4XR7S5f3BuwfpNi6-mPoagLnUx-_scL7-Ga4P1zqDQBieKCpnW0ZjtA3p29TsziAOEYOgFN8FfVL7wkWJrMh0J"
                  />
                  <div className="absolute bottom-6 left-6 right-6 z-10">
                    <span className="text-[10px] font-mono uppercase tracking-widest bg-ember/30 text-white px-2 py-0.5 rounded border border-ember/40">
                      Laminar Gas Flow
                    </span>
                    <p className="font-display text-lg text-white font-bold uppercase mt-1">Turbo Downpipe & Frontpipe</p>
                  </div>
                </div>

                <div className="relative w-[360px] sm:w-[480px] lg:w-[580px] h-full shrink-0 border-r border-zinc-800/80 group">
                  <img 
                    alt="Motorsport Engineering" 
                    className="w-full h-full object-cover filter brightness-[0.6] group-hover:brightness-[0.8] transition-all duration-700 scale-105 group-hover:scale-100" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCb33zgA-uVPrqJtC3DKsd_Kh2T1AUK0E1AsNMWzOOPbcI4Pbyjo5FfeprCSlL3a4uBTv0QgchhsornTzowKoYpclbFpsaZnbMS5SrfvimTLcOYasQtJ2_crmon8A5GM0sjMdNr56TwGQaQiauU2HPvzag0395Mj0FdHvmRiEYp4N0hEcZABH8uhMX6Xxbx-c4B26tnlX8C96tf_jXr4pLgtvimRCijsDalgNkZbBNWjQekMOAsSYme"
                  />
                  <div className="absolute bottom-6 left-6 right-6 z-10">
                    <span className="text-[10px] font-mono uppercase tracking-widest bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                      Zero Drone Tech
                    </span>
                    <p className="font-display text-lg text-white font-bold uppercase mt-1">Acoustic Harmonics Engineering</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Hero Overlay Content: Cinematic Dark Vignette (Prevents White Distortion in Light Mode) */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 sm:pb-16 px-4 sm:px-8 text-center pointer-events-none bg-gradient-to-t from-black/90 via-black/45 to-transparent">
              <div className="pointer-events-auto max-w-4xl mx-auto flex flex-col items-center">
                
                {/* Brand Logos (NDK & RGN) in Glassmorphic Pill */}
                <div className="inline-flex items-center justify-center gap-3.5 sm:gap-5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl border border-zinc-700/80 bg-black/60 backdrop-blur-md mb-4 sm:mb-6 shadow-xl">
                  <div className="relative h-7 sm:h-8 lg:h-9 w-[100px] sm:w-[120px] lg:w-[135px] flex items-center">
                    <img 
                      alt="NDK Exhaust" 
                      className="h-full w-full object-contain" 
                      src="/logos/ndk-white.png"
                    />
                  </div>

                  <span className="h-4 sm:h-5 w-[1px] bg-zinc-600" />

                  <div className="relative h-6 sm:h-7 lg:h-8 w-[90px] sm:w-[110px] lg:w-[125px] flex items-center">
                    <img 
                      alt="RGN Performance" 
                      className="h-full w-full object-contain" 
                      src="/logos/rgn-white.png"
                    />
                  </div>
                </div>

                <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight uppercase leading-[1.08] mb-6 sm:mb-8 text-white drop-shadow-lg">
                  WE DON'T BUILD EXHAUST{' '}<br className="hidden sm:inline"/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-paper via-zinc-200 to-ember">
                    JUST TO MAKE SOUND
                  </span>
                </h1>

                {/* Dual Focused CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mt-2">
                  <a 
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-ember hover:bg-ember-deep text-white font-display text-sm sm:text-base uppercase tracking-wider px-8 py-3.5 rounded font-semibold shadow-lg shadow-ember/30 transition-all transform hover:-translate-y-0.5" 
                    href="https://wa.me/6289502240040?text=Halo%20Admin%20NDK%20Exhaust%20%26%20RGN%20Performance%2C%20saya%20tertarik%20konsultasi%20knalpot%20presisi%20untuk%20mobil%20saya." 
                    rel="noopener noreferrer" 
                    target="_blank"
                  >
                    <span>KONSULTASI SEKARANG</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  <button 
                    type="button"
                    onClick={handleNavigateCatalog}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-display text-sm sm:text-base uppercase tracking-wider px-7 py-3.5 rounded font-semibold border border-zinc-700/90 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 hover:text-white backdrop-blur-md shadow-lg transition-all cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-ember" />
                    <span>LIHAT E-KATALOG</span>
                  </button>
                </div>

              </div>
            </div>

            </div>

          {/* Clean, elegant industrial divider line */}
          <div className={`w-full border-b relative ${isDark ? 'border-zinc-800/90' : 'border-zinc-200'}`}>
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-[1px] w-32 h-[2px] bg-ember" />
          </div>
        </section>

        {/* ========================================================= */}
        {/* RESEARCH & MANUFACTURING SECTION                          */}
        {/* ========================================================= */}
        <section className={`py-20 lg:py-24 relative transition-colors duration-300 ${
          isDark ? 'bg-zinc-950 text-paper' : 'bg-smoke text-ink'
        }`} id="prinsip">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Section Header (Bagian 1: ENGINEERING PHILOSOPHY dihapus) */}
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className={`font-display text-3xl sm:text-5xl font-bold tracking-tight uppercase ${
                isDark ? 'text-white' : 'text-ink'
              }`}>
                Riset &amp; Manufaktur
              </h2>
            </div>

            {/* 3 Re-engineered Cards: Image on left + Headline Tagline on right */}
            <div className="space-y-6">
              
              {/* Pilar 1: Design */}
              <div className={`rounded-2xl border overflow-hidden shadow-sm transition-all duration-300 grid grid-cols-1 md:grid-cols-12 items-center group hover:border-ember ${
                isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-paper border-zinc-200'
              }`}>
                <div className="md:col-span-6 lg:col-span-5 h-64 md:h-72 w-full overflow-hidden bg-zinc-950">
                  <img 
                    alt="Technical CAD blueprint exhaust header" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTEW03dG2JmkGp0qbTyqvnQUZUIZXaW0s8j47ca68oFvjDJY3Q0eUGtboCeDOWj0r_aLNw9Vetj1WxEB6QWRXfYq6JNgFgloqv7BQkaeuVtUuhIw5obYdNM6ye6y-Y8mRRuSV4FKujtb9TEbw1YiORoBL_5twGEuTtYKgaQp0jX6yP6WWEa75Kwf5jvW90HQior7INu1_l1i5b-VQlMxiNneyGio5T-Xu4qshxYiT6UVkkjcwa3XtD"
                  />
                </div>
                <div className="md:col-span-6 lg:col-span-7 p-8 sm:p-12">
                  <h3 className={`font-display text-2xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight leading-tight ${
                    isDark ? 'text-white' : 'text-ink'
                  }`}>
                    SETIAP DESAIN HARUS MEMILIKI ALASAN
                  </h3>
                </div>
              </div>

              {/* Pilar 2: Material */}
              <div className={`rounded-2xl border overflow-hidden shadow-sm transition-all duration-300 grid grid-cols-1 md:grid-cols-12 items-center group hover:border-ember ${
                isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-paper border-zinc-200'
              }`}>
                <div className="md:col-span-6 lg:col-span-5 h-64 md:h-72 w-full overflow-hidden bg-zinc-950">
                  <img 
                    alt="Stainless steel pipe TIG welding rainbow seam" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCw_WHcqYP4UeouevzfYMs1ES_TADDpHkxjvCjIWsAPXIIb4-E8LrE0aScHtMvglwXJwxD4-UMklY5_2V9rOgFr5GFb8qmxcN3M6lSNVJ34TYi9KeFcGxkUhX-9RSCREi3WnVu8oTZV5JxVHydf4417BFIRlIjpZTWXOcvkSRq7kvQXu0GzWQFCs9fV-JNekzjwJ5wyJlqYn7MPWv6DRDEeSUVuoxtMrgYQOXA6ua8ioC21kz6zLr1r"
                  />
                </div>
                <div className="md:col-span-6 lg:col-span-7 p-8 sm:p-12">
                  <h3 className={`font-display text-2xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight leading-tight ${
                    isDark ? 'text-white' : 'text-ink'
                  }`}>
                    SETIAP MATERIAL HARUS MEMILIKI FUNGSI
                  </h3>
                </div>
              </div>

              {/* Pilar 3: Ukuran */}
              <div className={`rounded-2xl border overflow-hidden shadow-sm transition-all duration-300 grid grid-cols-1 md:grid-cols-12 items-center group hover:border-ember ${
                isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-paper border-zinc-200'
              }`}>
                <div className="md:col-span-6 lg:col-span-5 h-64 md:h-72 w-full overflow-hidden bg-zinc-950">
                  <img 
                    alt="Micrometer precision measuring & tuning graph" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCh6ZlnHLguR9S5gthW4LMv0_nINWtjS-fstQatoIXf71n8gids3At9tEeZU19FQtQwMbsJbrHcyBRgUQa74jCo2rzp2cVSXJBXYzsogpzNnHhzmuN1KM9sG4QMRN-zPdiKfoRcJdk1YLd9vGLOuEBJHxvQ1aaPbUNlVOZ2P36-1lW0zJRGOeGkclO5j_xwhKMI4xiYlPcNS2W2qS5NzSQGvO8rSYoex4NGAb9QTd3xodSEjilmAopx"
                  />
                </div>
                <div className="md:col-span-6 lg:col-span-7 p-8 sm:p-12">
                  <h3 className={`font-display text-2xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight leading-tight ${
                    isDark ? 'text-white' : 'text-ink'
                  }`}>
                    SETIAP UKURAN HARUS SUDAH DIPERHITUNGKAN
                  </h3>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* TWO ENGINES TWO SPECIALITY DIVISION                       */}
        {/* ========================================================= */}
        <section className={`py-24 border-b transition-colors duration-300 ${
          isDark ? 'bg-ink border-zinc-800 text-paper' : 'bg-paper border-zinc-200 text-ink'
        }`} id="dua-mesin">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className={`font-display text-3xl sm:text-5xl font-bold tracking-tight uppercase ${
                isDark ? 'text-white' : 'text-ink'
              }`}>
                TWO ENGINES TWO SPECIALITY
              </h2>
            </div>

            {/* 2 Side-by-Side Comparison Panels */}
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 rounded-2xl border overflow-hidden shadow-sm ${
              isDark 
                ? 'bg-zinc-950/80 border-zinc-800 lg:divide-x lg:divide-zinc-800' 
                : 'bg-smoke/50 border-zinc-200 lg:divide-x lg:divide-zinc-300'
            }`}>
              
              {/* LEFT CARD: NDK EXHAUST (Mesin Bensin) */}
              <div className={`p-8 sm:p-12 flex flex-col justify-between transition-colors duration-300 ${
                isDark ? 'hover:bg-zinc-900/60' : 'hover:bg-white'
              }`}>
                <div>
                  {/* Brand Header with NDK Logo */}
                  <div className={`flex items-center justify-between mb-6 pb-6 border-b ${
                    isDark ? 'border-zinc-800' : 'border-zinc-200'
                  }`}>
                    <div className="relative h-8 sm:h-9 w-[110px] sm:w-[130px] flex items-center">
                      <img 
                        alt="NDK Exhaust Logo" 
                        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-in-out ${
                          isDark ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`} 
                        src="/logos/ndk-white.png"
                      />
                      <img 
                        alt="NDK Exhaust Logo" 
                        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-in-out ${
                          isDark ? 'opacity-0 pointer-events-none' : 'opacity-100'
                        }`} 
                        src="/logos/ndk-black.png"
                      />
                    </div>
                    <span className={`text-[11px] font-mono uppercase px-3 py-1 rounded font-semibold ${
                      isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-800'
                    }`}>
                      Petrol Division
                    </span>
                  </div>

                  <p className={`text-sm sm:text-base leading-relaxed mb-6 font-normal ${
                    isDark ? 'text-zinc-300' : 'text-ink'
                  }`}>
                    Karakteristik mesin bensin memerlukan kalkulasi scavenging velocity dan resonansi gas buang presisi. Desain exhaust NDK dikembangkan dengan perhitungan presisi untuk menjaga tekanan balik (backpressure) ideal, mempertahankan torsi RPM bawah dan mengoptimalkan aliran udara pada RPM tinggi.
                  </p>
                </div>

                <div className={`mt-8 pt-6 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                  <a 
                    className={`inline-flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider hover:text-ember transition-colors ${
                      isDark ? 'text-white' : 'text-ink'
                    }`} 
                    href="https://wa.me/6289502240040?text=Halo%20NDK%20Exhaust%2C%20saya%20ingin%20konsultasi%20spesialisasi%20knalpot%20mesin%20bensin." 
                    rel="noopener noreferrer" 
                    target="_blank"
                  >
                    <span>Konsultasi Seri Bensin</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* RIGHT CARD: RGN PERFORMANCE (Mesin Diesel) */}
              <div className={`p-8 sm:p-12 flex flex-col justify-between transition-colors duration-300 ${
                isDark ? 'hover:bg-zinc-900/60' : 'hover:bg-white'
              }`}>
                <div>
                  {/* Brand Header with RGN Logo */}
                  <div className={`flex items-center justify-between mb-6 pb-6 border-b ${
                    isDark ? 'border-zinc-800' : 'border-zinc-200'
                  }`}>
                    <div className="relative h-8 sm:h-9 w-[100px] sm:w-[120px] flex items-center">
                      <img 
                        alt="RGN Performance Logo" 
                        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-in-out ${
                          isDark ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`} 
                        src="/logos/rgn-white.png"
                      />
                      <img 
                        alt="RGN Performance Logo" 
                        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-in-out ${
                          isDark ? 'opacity-0 pointer-events-none' : 'opacity-100'
                        }`} 
                        src="/logos/rgn-black.png"
                      />
                    </div>
                    <span className={`text-[11px] font-mono uppercase px-3 py-1 rounded font-semibold ${
                      isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-800'
                    }`}>
                      Diesel Division
                    </span>
                  </div>

                  <p className={`text-sm sm:text-base leading-relaxed mb-6 font-normal ${
                    isDark ? 'text-zinc-300' : 'text-ink'
                  }`}>
                    Karakteristik mesin diesel common rail berturbo berfokus pada efisiensi pelepasan temperatur gas buang (EGT) dan penurunan resistansi aliran. RGN merekayasa diameter downpipe dan frontpipe presisi guna meminimalkan turbo lag serta menunjang kinerja kompresi tinggi secara aman.
                  </p>
                </div>

                <div className={`mt-8 pt-6 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                  <a 
                    className={`inline-flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider hover:text-ember transition-colors ${
                      isDark ? 'text-white' : 'text-ink'
                    }`} 
                    href="https://wa.me/6289502240040?text=Halo%20RGN%20Performance%2C%20saya%20ingin%20konsultasi%20spesialisasi%20knalpot%20mesin%20diesel." 
                    rel="noopener noreferrer" 
                    target="_blank"
                  >
                    <span>Konsultasi Seri Diesel</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SHOWCASE & TESTIMONIALS SECTION                           */}
        {/* ========================================================= */}
        <section className={`py-24 transition-colors duration-300 ${
          isDark ? 'bg-zinc-950 text-paper' : 'bg-smoke text-ink'
        }`} id="testimoni">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className={`font-display text-3xl sm:text-5xl font-bold tracking-tight uppercase ${
                isDark ? 'text-white' : 'text-ink'
              }`}>
                Hasil Karya &amp; Review Pelanggan
              </h2>
            </div>

            {/* Rolling Product Photos Showcase (Marquee Gallery from /fotoproduk/) */}
            <div className={`rounded-2xl border mb-16 relative overflow-hidden shadow-2xl transition-colors duration-300 ${
              isDark ? 'bg-zinc-950/90 border-zinc-800' : 'bg-paper border-zinc-200 shadow-md'
            }`}>
              
              {/* Header inside rolling showcase container */}
              <div className={`p-6 sm:p-8 border-b ${
                isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-smoke/60'
              }`}>
                <div>
                  <h3 className={`font-display text-xl sm:text-2xl font-bold uppercase tracking-tight ${
                    isDark ? 'text-white' : 'text-ink'
                  }`}>
                    Galeri Hasil Karya &amp; Foto Produk Asli
                  </h3>
                </div>
              </div>

              {/* Marquee Scroller Wrapper with Soft Fading Edge Gradients */}
              <div className="relative py-6 sm:py-8 overflow-hidden group">
                
                {/* Left & Right Gradient Shadows for Seamless Look */}
                <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-28 z-10 bg-gradient-to-r ${
                  isDark ? 'from-zinc-950 via-zinc-950/80 to-transparent' : 'from-paper via-paper/80 to-transparent'
                }`} />
                <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-28 z-10 bg-gradient-to-l ${
                  isDark ? 'from-zinc-950 via-zinc-950/80 to-transparent' : 'from-paper via-paper/80 to-transparent'
                }`} />

                {/* Track with continuous marquee */}
                <div className="marquee-track flex gap-5 sm:gap-6 px-4">
                  {[...PRODUCT_SHOWCASE, ...PRODUCT_SHOWCASE].map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      onClick={() => setSelectedProductImage(item)}
                      className={`w-[260px] sm:w-[310px] shrink-0 rounded-xl border overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:border-ember hover:shadow-xl hover:shadow-ember/20 cursor-pointer group/card flex flex-col ${
                        isDark 
                          ? 'bg-zinc-900/90 border-zinc-800 text-paper' 
                          : 'bg-white border-zinc-200 text-ink shadow-sm'
                      }`}
                    >
                      {/* Image Preview Box */}
                      <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden border-b border-zinc-800">
                        <img
                          src={item.src}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out"
                          loading="lazy"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 text-white">
                          <div className="w-10 h-10 rounded-full bg-ember flex items-center justify-center shadow-lg shadow-ember/40">
                            <ZoomIn className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-display uppercase text-xs tracking-wider font-semibold">
                            Lihat Foto Lengkap
                          </span>
                        </div>

                        {/* Sound Tag Badge */}
                        <div className="absolute top-3 right-3 z-10">
                          <span className="font-mono text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-black/80 text-ember border border-ember/40 backdrop-blur-sm shadow-md">
                            {item.sound}
                          </span>
                        </div>
                      </div>

                      {/* Info Footer */}
                      <div className="p-4 flex flex-col justify-between flex-1">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className={`font-display text-base font-bold uppercase tracking-tight group-hover/card:text-ember transition-colors ${
                              isDark ? 'text-white' : 'text-ink'
                            }`}>
                              {item.name}
                            </h4>
                          </div>
                          <p className={`font-body text-xs line-clamp-1 ${
                            isDark ? 'text-zinc-400' : 'text-steel'
                          }`}>
                            {item.spec}
                          </p>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-dashed flex items-center justify-between text-[11px] font-mono">
                          <span className={`${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{item.type}</span>
                          <span className="text-ember font-semibold flex items-center gap-1 group-hover/card:translate-x-0.5 transition-transform">
                            DETAIL <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* Customer Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Testi 1 */}
              <div className={`p-6 sm:p-8 rounded-xl border shadow-sm flex flex-col justify-between transition-colors duration-300 ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-paper border-zinc-200'
              }`}>
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-4">★★★★★</div>
                  <p className={`text-sm sm:text-base leading-relaxed italic mb-6 ${
                    isDark ? 'text-zinc-200' : 'text-ink'
                  }`}>
                    "Civic FE 1.5 Turbo - Suara bass bulat berwibawa di RPM rendah, pas injak gas RPM tinggi tenaganya ngisi terus. Tidak ada dengung sama sekali di kabin saat cruising 100 km/jam."
                  </p>
                </div>
                <div className={`pt-4 border-t flex items-center justify-between ${
                  isDark ? 'border-zinc-800' : 'border-zinc-100'
                }`}>
                  <div>
                    <p className={`font-display text-sm font-bold uppercase ${isDark ? 'text-white' : 'text-ink'}`}>
                      Rendy P.
                    </p>
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-steel'}`}>Jakarta · Honda Civic FE</p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    NDK Street
                  </span>
                </div>
              </div>

              {/* Testi 2 */}
              <div className={`p-6 sm:p-8 rounded-xl border shadow-sm flex flex-col justify-between transition-colors duration-300 ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-paper border-zinc-200'
              }`}>
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-4">★★★★★</div>
                  <p className={`text-sm sm:text-base leading-relaxed italic mb-6 ${
                    isDark ? 'text-zinc-200' : 'text-ink'
                  }`}>
                    "Innova Reborn 2.4 Diesel - Downpipe + Frontpipe RGN tarikan bawahnya terasa jauh lebih enteng, turbo spooling lebih cepat tanpa asap pekat. Finishing las argon sangat rapi."
                  </p>
                </div>
                <div className={`pt-4 border-t flex items-center justify-between ${
                  isDark ? 'border-zinc-800' : 'border-zinc-100'
                }`}>
                  <div>
                    <p className={`font-display text-sm font-bold uppercase ${isDark ? 'text-white' : 'text-ink'}`}>
                      Dimas K.
                    </p>
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-steel'}`}>Surabaya · Innova Reborn 2GD</p>
                  </div>
                  <span className="text-[10px] font-mono bg-ember-tint px-2 py-0.5 rounded text-ember font-semibold">
                    RGN Diesel
                  </span>
                </div>
              </div>

              {/* Testi 3 */}
              <div className={`p-6 sm:p-8 rounded-xl border shadow-sm flex flex-col justify-between transition-colors duration-300 ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-paper border-zinc-200'
              }`}>
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-4">★★★★★</div>
                  <p className={`text-sm sm:text-base leading-relaxed italic mb-6 ${
                    isDark ? 'text-zinc-200' : 'text-ink'
                  }`}>
                    "Brio 1.2 Street Tuning - Pengujian sebelum dan sesudah pasang full exhaust system tarikan langsung responsif dan nafas RPM atas jauh lebih panjang tanpa utak-atik ECU. Recomended!"
                  </p>
                </div>
                <div className={`pt-4 border-t flex items-center justify-between ${
                  isDark ? 'border-zinc-800' : 'border-zinc-100'
                }`}>
                  <div>
                    <p className={`font-display text-sm font-bold uppercase ${isDark ? 'text-white' : 'text-ink'}`}>
                      Fajar M.
                    </p>
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-steel'}`}>Bandung · Honda Brio 1.2 NA</p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    NDK Full System
                  </span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* QUICK CATALOG & CONSULTATION CTA                          */}
        {/* ========================================================= */}
        <section className={`py-16 border-t transition-colors duration-300 ${
          isDark ? 'bg-zinc-900 text-paper border-zinc-800' : 'bg-ink text-paper border-zinc-800'
        }`} id="katalog">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase text-white">
                Siap Menemukan Karakter Suara &amp; Tenaga Mobil Anda?
              </h3>
              <p className="text-zinc-400 text-sm mt-1">
                Konsultasikan tipe kendaraan, konfigurasi mesin, dan ekspektasi suara bersama tim teknis resmi kami.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleNavigateCatalog}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-display uppercase tracking-wider px-5 py-3 rounded font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer border border-zinc-700"
              >
                <BookOpen className="w-4 h-4 text-ember" />
                <span>Buka E-Katalog</span>
              </button>
              
              <a 
                className="bg-ember hover:bg-ember-deep text-white font-display uppercase tracking-wider px-6 py-3 rounded font-semibold text-sm transition-all flex items-center gap-2 shadow-md" 
                href="https://wa.me/6289502240040?text=Halo%20Admin%20NDK%20%26%20RGN%2C%20saya%20ingin%20konsultasi%20pemilihan%20knalpot." 
                rel="noopener noreferrer" 
                target="_blank"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat WhatsApp CS</span>
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* ========================================================= */}
      {/* MAIN FOOTER (4-Column Layout)                             */}
      {/* ========================================================= */}
      <footer className="bg-ink text-paper pt-16 pb-12 border-t border-zinc-800" id="workshop">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-zinc-800">
            
            {/* Column 1: Brand Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  alt="NDK Exhaust" 
                  className="h-6 w-auto object-contain" 
                  src="/logos/ndk-white.png"
                />
                <span className="text-zinc-600 text-xs">|</span>
                <img 
                  alt="RGN Performance" 
                  className="h-5 w-auto object-contain" 
                  src="/logos/rgn-white.png"
                />
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Manufaktur exhaust system knalpot mobil berbahan stainless steel berkualitas tinggi untuk harian dan performa. Berbasis di Purbalingga, Jawa Tengah.
              </p>
            </div>

            {/* Column 2: Marketplace Resmi */}
            <div>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-ember rounded-full" /> Marketplace Resmi
              </h4>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li>
                  <a className="hover:text-ember transition-colors flex items-center gap-2.5 group" href="https://www.tokopedia.com/ndk-exhaust-id" rel="noopener noreferrer" target="_blank">
                    <TokopediaIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>Tokopedia Official <span className="bg-emerald-950 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded ml-1">Verified</span></span>
                  </a>
                </li>
                <li>
                  <a className="hover:text-ember transition-colors flex items-center gap-2.5 group" href="https://shopee.co.id/ndk_exhaust_official" rel="noopener noreferrer" target="_blank">
                    <ShopeeIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>Shopee Mall</span>
                  </a>
                </li>
                <li>
                  <a className="hover:text-ember transition-colors flex items-center gap-2.5 group" href="https://wa.me/6289502240040?text=Halo%20Admin%20NDK%20Exhaust,%20saya%20ingin%20konsultasi%20dan%20order%20knalpot" rel="noopener noreferrer" target="_blank">
                    <WhatsAppIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>WhatsApp Konsultasi (+62 895-0224-0040)</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Social Media */}
            <div>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-ember rounded-full" /> Social Media
              </h4>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li>
                  <a className="hover:text-ember transition-colors flex items-center gap-2.5 group" href="https://www.instagram.com/ndkexhaust" rel="noopener noreferrer" target="_blank">
                    <InstagramIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>Instagram: @ndkexhaust</span>
                  </a>
                </li>
                <li>
                  <a className="hover:text-ember transition-colors flex items-center gap-2.5 group" href="https://www.tiktok.com/@ndkofficial.id" rel="noopener noreferrer" target="_blank">
                    <TikTokIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>TikTok: @ndkofficial.id</span>
                  </a>
                </li>
                <li>
                  <a className="hover:text-ember transition-colors flex items-center gap-2.5 group" href="http://bit.ly/Youtube-NDKexhaust" rel="noopener noreferrer" target="_blank">
                    <YouTubeIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>YouTube: NDK Exhaust</span>
                  </a>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={handleNavigateCatalog}
                    className="hover:text-ember transition-colors flex items-center gap-2.5 cursor-pointer text-left group"
                  >
                    <BookOpen className="w-4 h-4 text-ember shrink-0 transition-transform group-hover:scale-110" />
                    <span>E-Katalog Web Resmi</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Workshop & Lokasi */}
            <div>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-ember rounded-full" /> Workshop &amp; Lokasi
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed mb-2">
                RGN Performance Workshop<br />
                Purbalingga, Jawa Tengah, Indonesia.
              </p>
              <div className="text-xs text-zinc-300 font-medium mb-4">
                <span>Senin - Sabtu: 08.30 - 17.00 WIB</span><br/>
                <span className="text-zinc-500">Minggu &amp; Hari Libur: Tutup</span>
              </div>
              <a 
                className="inline-flex items-center gap-2 border border-zinc-700 hover:border-ember bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold py-2 px-3 rounded transition-all" 
                href="https://g.page/ndkexhaust" 
                rel="noopener noreferrer" 
                target="_blank"
              >
                <MapPin className="w-4 h-4 text-ember" />
                <span>Buka Google Maps</span>
              </a>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
            <div>
              © 2026 NDK Exhaust &amp; RGN Performance. All Rights Reserved.
            </div>
            <div className="flex items-center gap-6">
              <button 
                type="button" 
                onClick={handleNavigateLogin}
                className="hover:text-ember transition-colors text-zinc-400 cursor-pointer flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Portal Logistik Internal</span>
              </button>
              <span className="text-zinc-700">|</span>
              <a className="hover:text-zinc-300 transition-colors" href="#">Kebijakan Privasi</a>
              <a className="hover:text-zinc-300 transition-colors" href="#">Syarat &amp; Ketentuan</a>
            </div>
          </div>

        </div>
      </footer>

      {/* Lightbox Modal for Product Photo Showcase */}
      {selectedProductImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setSelectedProductImage(null)}
        >
          <div 
            className="relative max-w-2xl w-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-widest text-ember font-bold">
                  {selectedProductImage.sound}
                </span>
                <span className="text-zinc-600">•</span>
                <h3 className="font-display text-base sm:text-lg font-bold text-white uppercase tracking-tight">
                  {selectedProductImage.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductImage(null)}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Full Image */}
            <div className="p-4 bg-black flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={selectedProductImage.src}
                alt={selectedProductImage.name}
                className="max-h-[60vh] w-auto object-contain rounded-lg"
              />
            </div>

            {/* Modal Footer / Action */}
            <div className="px-5 py-4 bg-zinc-900/80 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="font-body text-xs text-zinc-400">
                {selectedProductImage.spec}
              </p>
              <a
                href={`https://wa.me/6289502240040?text=Halo%2C%20saya%20tertarik%20dengan%20produk%20${encodeURIComponent(selectedProductImage.name)}%20yang%20ada%20di%20landing%20page.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 bg-ember hover:bg-ember-deep text-white rounded-xl font-display text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 shrink-0 shadow-md shadow-ember/20 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-white" />
                <span>Tanya / Pesan Seri Ini</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
