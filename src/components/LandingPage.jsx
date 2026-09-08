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

// Real Workshop & Installation Documentation (from /ndk-asset/ as high-efficiency WebP)
// Unseen photos from upper landing page sections are prioritized first
const DOKUMENTASI_ASSET = [
  {
    id: 'doc-1',
    src: '/ndk-asset/IMG_3551.webp',
    title: 'Toyota Innova Reborn 2GD Diesel',
    category: 'Workshop NDK Exhaust',
    desc: 'Pemasangan full exhaust system pada hydraulic lift workshop NDK Exhaust.'
  },
  {
    id: 'doc-2',
    src: '/ndk-asset/IMG_3552.webp',
    title: 'Innova Reborn Exhaust Upgrade',
    category: 'Workshop Installation',
    desc: 'Proses penggantian exhaust bawaan dengan exhaust stainless flow tinggi.'
  },
  {
    id: 'doc-3',
    src: '/ndk-asset/IMG_3553.webp',
    title: 'Downpipe Golden Pie-Cut Welds',
    category: 'Precision TIG Welding',
    desc: 'Detail pengelasan argon pie-cut presisi tinggi tahan temperatur ekstrem.'
  },
  {
    id: 'doc-4',
    src: '/ndk-asset/IMG_3554.webp',
    title: 'Burnt Titanium Exhaust Tip',
    category: 'Finishing Eksklusif',
    desc: 'Muffler tip burnt titanium dengan gradasi warna autentik tahan panas tinggi.'
  },
  {
    id: 'doc-5',
    src: '/ndk-asset/IMG_3542.webp',
    title: 'Blueprint & Engineering Drawing',
    category: 'Riset Desain Teknis',
    desc: 'Gambar kerja teknis dan spesifikasi detail sudut lekukan manifold dan pipa.'
  },
  {
    id: 'doc-6',
    src: '/ndk-asset/IMG_3543.webp',
    title: 'Fabrikasi Sesuai Gambar Kerja',
    category: 'Riset & Manufaktur',
    desc: 'Pengerjaan knalpot terstandarisasi berdasarkan blueprint dan kalkulasi ukuran.'
  },
  {
    id: 'doc-7',
    src: '/ndk-asset/IMG_3544.webp',
    title: 'Kalkulasi Aliran Gas Buang',
    category: 'Engineering Philosophy',
    desc: 'Perhitungan volumetrik gas buang untuk memastikan scavenging effect optimal.'
  },
  {
    id: 'doc-8',
    src: '/ndk-asset/IMG_3545.webp',
    title: 'Manual Craftsmanship Purbalingga',
    category: 'Pengerjaan Presisi',
    desc: 'Keahlian tangan perajin knalpot berpengalaman menyatukan tiap segmen pipa.'
  },
  {
    id: 'doc-9',
    src: '/ndk-asset/IMG_3556.webp',
    title: 'Fitment Test & Quality Control',
    category: 'QC Akhir Manufaktur',
    desc: 'Pengecekan akhir kepresisian gantungan dan clearance knalpot terhadap bodi.'
  },
  {
    id: 'doc-10',
    src: '/ndk-asset/IMG_3546.webp',
    title: 'Instalasi Kolong Mobil Profesional',
    category: 'Proses Pemasangan',
    desc: 'Pemasangan exhaust system presisi tanpa modifikasi struktur sasis bawaan.'
  },
  {
    id: 'doc-11',
    src: '/ndk-asset/IMG_3547.webp',
    title: 'Fortuner 2KD Blackbull Dyno',
    category: 'RGN Performance Workshop',
    desc: 'Pengujian dan tuning exhaust downpipe performa tinggi di workshop RGN.'
  },
  {
    id: 'doc-12',
    src: '/ndk-asset/IMG_3555.webp',
    title: 'RGN Downpipe Engine Bay View',
    category: 'Diesel Turbo Direct Fit',
    desc: 'Instalasi downpipe RGN Performance by NDK Group pada ruang mesin mobil.'
  }
];

// Hero Showcase Slides (Real Assets from /ndk-asset/ as WebP)
const HERO_SLIDES = [
  {
    src: '/ndk-asset/IMG_3547.webp',
    tag: 'RGN Performance Workshop',
    title: 'Diesel Performance Tuning',
    alt: 'Toyota Fortuner di Workshop RGN Performance'
  },
  {
    src: '/ndk-asset/IMG_3548.webp',
    tag: 'Handcrafted TIG Welding',
    title: 'Pengrajin Knalpot Purbalingga',
    alt: 'Pengelasan TIG Argon Stainless Steel NDK'
  },
  {
    src: '/ndk-asset/IMG_3555.webp',
    tag: 'Direct Bolt-On Turbo',
    title: 'Downpipe & Frontpipe Presisi',
    alt: 'Instalasi Downpipe RGN Performance di Engine Bay'
  },
  {
    src: '/ndk-asset/IMG_3550.webp',
    tag: 'Presisi Sasis & Kolong',
    title: 'Full Stainless Exhaust System',
    alt: 'Pemasangan Knalpot Stainless di Kolong Mobil'
  },
  {
    src: '/ndk-asset/IMG_3549.webp',
    tag: 'Laser Marking Tech',
    title: 'Titanium Finishing Eksklusif',
    alt: 'Laser Engraving Knalpot Titanium'
  },
  {
    src: '/ndk-asset/IMG_3546.webp',
    tag: 'Instalasi Profesional',
    title: 'Pemasangan Presisi Tanpa Las Sasis',
    alt: 'Instalasi Knalpot di Lift Workshop'
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

  // Dynamic Scrollspy: track active section on scroll
  const [activeSection, setActiveSection] = useState('beranda');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;

      const testimoniEl = document.getElementById('testimoni');
      const workshopEl = document.getElementById('workshop');

      const testimoniTop = testimoniEl ? testimoniEl.offsetTop : Infinity;
      const workshopTop = workshopEl ? workshopEl.offsetTop : Infinity;

      const isBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;

      if (isBottom || scrollPos >= workshopTop) {
        setActiveSection('workshop');
      } else if (scrollPos >= testimoniTop) {
        setActiveSection('testimoni');
      } else {
        setActiveSection('beranda');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  useEffect(() => {
    setSEO({
      title: "NDK Exhaust × RGN Performance | Precision Exhaust Engineering & E-Katalog Resmi",
      description: "Manufaktur knalpot mobil stainless steel presisi berbasis di Purbalingga, Jawa Tengah. E-Katalog resmi knalpot racing, harian, downpipe, frontpipe, resonator, dan muffler bensin & diesel.",
      keywords: "ndk exhaust, rgn performance, knalpot purbalingga, knalpot stainless steel, knalpot racing, downpipe, frontpipe, resonator, muffler mobil, knalpot diesel",
      canonical: "https://warehouse.ndkexhaust.com/",
      image: "https://warehouse.ndkexhaust.com/logos/ndk-black.png",
      type: "website"
    });

    // Preload both dark and light logos for instant zero-lag theme transitions
    ['/logos/ndk-white.png', '/logos/ndk-black.png', '/logos/rgn-white.png', '/logos/rgn-black.png'].forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const handleNavigateCatalog = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    window.history.pushState({}, '', '/catalog');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleNavigateLogin = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    window.history.pushState({}, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Safe fallback theme logos
  const ndkLogo = isDark ? '/logos/ndk-white.png' : '/logos/ndk-black.png';
  const rgnLogo = isDark ? '/logos/rgn-white.png' : '/logos/rgn-black.png';

  return (
    <div className={`min-h-screen font-body antialiased transition-colors duration-300 selection:bg-ember selection:text-white ${isDark ? 'bg-ink text-paper' : 'bg-paper text-ink'
      }`}>

      {/* ========================================================= */}
      {/* HEADER / NAVIGATION                                       */}
      {/* ========================================================= */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${isDark ? 'bg-ink/95 border-zinc-800' : 'bg-paper/95 border-zinc-200 shadow-xs'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo Lockup: NDK & RGN with Seamless Stacked Crossfade */}
          <a className="flex items-center gap-2.5 sm:gap-3 group py-1" href="#beranda">
            <div className="relative h-6 sm:h-7 w-[88px] sm:w-[100px] flex items-center">
              <img
                alt="NDK Exhaust Logo"
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                src="/logos/ndk-white.png"
              />
              <img
                alt="NDK Exhaust Logo"
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-in-out ${isDark ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }`}
                src="/logos/ndk-black.png"
              />
            </div>

            <span className={`h-4 sm:h-5 w-[1px] transition-colors duration-300 ${isDark ? 'bg-zinc-700' : 'bg-zinc-300'}`} />

            <div className="relative h-5 sm:h-6 w-[78px] sm:w-[90px] flex items-center">
              <img
                alt="RGN Performance Logo"
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                src="/logos/rgn-white.png"
              />
              <img
                alt="RGN Performance Logo"
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-in-out ${isDark ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }`}
                src="/logos/rgn-black.png"
              />
            </div>
          </a>

          {/* Navigation Menu (Beranda, Testimoni, Tentang Kami, Katalog) */}
          <nav className="hidden md:flex items-center space-x-7 text-xs sm:text-sm font-display uppercase tracking-widest">
            <a
              href="#beranda"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`relative py-1.5 transition-all duration-200 cursor-pointer ${activeSection === 'beranda'
                  ? 'text-ember font-bold'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-950'
                }`}
            >
              Beranda
              {activeSection === 'beranda' && (
                <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-ember rounded-full shadow-sm shadow-ember/50 animate-in fade-in duration-200" />
              )}
            </a>

            <a
              href="#testimoni"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('testimoni');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`relative py-1.5 transition-all duration-200 cursor-pointer ${activeSection === 'testimoni'
                  ? 'text-ember font-bold'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-950'
                }`}
            >
              Testimoni
              {activeSection === 'testimoni' && (
                <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-ember rounded-full shadow-sm shadow-ember/50 animate-in fade-in duration-200" />
              )}
            </a>

            <a
              href="#workshop"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('workshop');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`relative py-1.5 transition-all duration-200 cursor-pointer ${activeSection === 'workshop'
                  ? 'text-ember font-bold'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-950'
                }`}
            >
              Tentang Kami
              {activeSection === 'workshop' && (
                <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-ember rounded-full shadow-sm shadow-ember/50 animate-in fade-in duration-200" />
              )}
            </a>

            <button
              type="button"
              onClick={handleNavigateCatalog}
              className={`relative py-1.5 transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${isDark ? 'text-zinc-400 hover:text-ember' : 'text-zinc-600 hover:text-ember'
                }`}
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
              className={`p-2 rounded-lg border transition-all duration-200 cursor-pointer flex items-center justify-center ${isDark
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded text-xs font-display uppercase tracking-wider font-semibold border transition cursor-pointer ${isDark
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
        <section className={`relative py-1.5 sm:py-2.5 px-1 sm:px-2 overflow-hidden racing-grid ${isDark ? 'bg-ink text-paper' : 'bg-zinc-950 text-white'
          }`}>
          {/* Subtle Ambient Flare */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-ember/20 blur-[130px] rounded-full pointer-events-none" />

          {/* Full Screen Width Frame with Thin Borders */}
          <div className="relative w-full rounded-xl sm:rounded-2xl border border-zinc-800/90 bg-black/70 shadow-2xl overflow-hidden mb-2">

            <div className="relative w-full overflow-hidden h-[500px] sm:h-[580px] lg:h-[640px]">
              <div className="marquee-track h-full">
                {[...HERO_SLIDES, ...HERO_SLIDES].map((slide, idx) => (
                  <div
                    key={`hero-slide-${idx}`}
                    className="relative w-[360px] sm:w-[480px] lg:w-[580px] h-full shrink-0 border-r border-zinc-800/80 group"
                  >
                    <img
                      alt={slide.alt}
                      className="w-full h-full object-cover filter brightness-[0.7] group-hover:brightness-[0.85] transition-all duration-700 scale-105 group-hover:scale-100"
                      src={slide.src}
                    />
                    <div className="absolute bottom-6 left-6 right-6 z-10">
                      <span className="text-[10px] font-mono uppercase tracking-widest bg-ember/30 text-white px-2 py-0.5 rounded border border-ember/40 backdrop-blur-xs">
                        {slide.tag}
                      </span>
                      <p className="font-display text-lg sm:text-xl text-white font-bold uppercase mt-1 drop-shadow-md">
                        {slide.title}
                      </p>
                    </div>
                  </div>
                ))}
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
                  WE DON'T BUILD EXHAUST{' '}<br className="hidden sm:inline" />
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
        <section className={`py-20 lg:py-24 relative transition-colors duration-300 ${isDark ? 'bg-zinc-950 text-paper' : 'bg-smoke text-ink'
          }`} id="prinsip">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Section Header (Bagian 1: ENGINEERING PHILOSOPHY dihapus) */}
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className={`font-display text-3xl sm:text-5xl font-bold tracking-tight uppercase ${isDark ? 'text-white' : 'text-ink'
                }`}>
                Riset &amp; Manufaktur
              </h2>
            </div>

            {/* 3 Pillars Grid: Side-by-Side (Menyamping) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">

              {/* Pilar 1: Desain */}
              <div className={`rounded-2xl border overflow-hidden shadow-sm transition-all duration-300 flex flex-col group hover:border-ember hover:-translate-y-1 hover:shadow-xl ${isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-paper border-zinc-200'
                }`}>
                <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-zinc-950">
                  <img
                    alt="Pengelasan dan fabrikasi desain knalpot presisi NDK"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src="/ndk-asset/IMG_3548.webp"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 sm:p-8 flex items-center justify-center text-center flex-1">
                  <h3 className={`font-display text-xl sm:text-2xl font-bold uppercase tracking-tight leading-snug group-hover:text-ember transition-colors ${isDark ? 'text-white' : 'text-ink'
                    }`}>
                    SETIAP DESAIN HARUS MEMILIKI ALASAN
                  </h3>
                </div>
              </div>

              {/* Pilar 2: Material */}
              <div className={`rounded-2xl border overflow-hidden shadow-sm transition-all duration-300 flex flex-col group hover:border-ember hover:-translate-y-1 hover:shadow-xl ${isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-paper border-zinc-200'
                }`}>
                <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-zinc-950">
                  <img
                    alt="Finishing material knalpot titanium dan stainless steel tahan panas"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    style={{ objectPosition: 'center 20%' }}
                    src="/ndk-asset/Screenshot_1.webp"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 sm:p-8 flex items-center justify-center text-center flex-1">
                  <h3 className={`font-display text-xl sm:text-2xl font-bold uppercase tracking-tight leading-snug group-hover:text-ember transition-colors ${isDark ? 'text-white' : 'text-ink'
                    }`}>
                    SETIAP MATERIAL HARUS MEMILIKI FUNGSI
                  </h3>
                </div>
              </div>

              {/* Pilar 3: Ukuran */}
              <div className={`rounded-2xl border overflow-hidden shadow-sm transition-all duration-300 flex flex-col group hover:border-ember hover:-translate-y-1 hover:shadow-xl ${isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-paper border-zinc-200'
                }`}>
                <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-zinc-950">
                  <img
                    alt="Presisi pemasangan dan ukuran exhaust di kolong kendaraan"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src="/ndk-asset/IMG_3550.webp"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 sm:p-8 flex items-center justify-center text-center flex-1">
                  <h3 className={`font-display text-xl sm:text-2xl font-bold uppercase tracking-tight leading-snug group-hover:text-ember transition-colors ${isDark ? 'text-white' : 'text-ink'
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
        <section className={`py-24 border-b transition-colors duration-300 ${isDark ? 'bg-ink border-zinc-800 text-paper' : 'bg-paper border-zinc-200 text-ink'
          }`} id="dua-mesin">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className={`font-display text-3xl sm:text-5xl font-bold tracking-tight uppercase ${isDark ? 'text-white' : 'text-ink'
                }`}>
                TWO ENGINES TWO SPECIALITY
              </h2>
            </div>

            {/* 2 Side-by-Side Comparison Panels */}
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 rounded-2xl border overflow-hidden shadow-sm ${isDark
                ? 'bg-zinc-950/80 border-zinc-800 lg:divide-x lg:divide-zinc-800'
                : 'bg-smoke/50 border-zinc-200 lg:divide-x lg:divide-zinc-300'
              }`}>

              {/* LEFT CARD: NDK EXHAUST (Mesin Bensin) */}
              <div className={`p-8 sm:p-12 flex flex-col justify-between transition-colors duration-300 ${isDark ? 'hover:bg-zinc-900/60' : 'hover:bg-white'
                }`}>
                <div>
                  {/* Brand Header with NDK Logo */}
                  <div className={`flex items-center justify-between mb-6 pb-6 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'
                    }`}>
                    <div className="relative h-8 sm:h-9 w-[110px] sm:w-[130px] flex items-center">
                      <img
                        alt="NDK Exhaust Logo"
                        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0 pointer-events-none'
                          }`}
                        src="/logos/ndk-white.png"
                      />
                      <img
                        alt="NDK Exhaust Logo"
                        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-in-out ${isDark ? 'opacity-0 pointer-events-none' : 'opacity-100'
                          }`}
                        src="/logos/ndk-black.png"
                      />
                    </div>
                    <span className={`text-[11px] font-mono uppercase px-3 py-1 rounded font-semibold ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-800'
                      }`}>
                      Bensin/Petrol Division
                    </span>
                  </div>

                  <p className={`text-sm sm:text-base leading-relaxed mb-6 font-normal ${isDark ? 'text-zinc-300' : 'text-ink'
                    }`}>
                    NDK Exhaust telah dikembangkan sejak 2019 dan telah melewati RND serta perhitungan pada kendaraan bermesin bensin demi mendapatkan hasil paling maksimal. Tidak hanya klaim sepihak, test dyno telah dilakukan untuk mendapatkan data paling obyektif.
                  </p>
                </div>

                <div className={`mt-8 pt-6 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                  <a
                    className={`inline-flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider hover:text-ember transition-colors ${isDark ? 'text-white' : 'text-ink'
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
              <div className={`p-8 sm:p-12 flex flex-col justify-between transition-colors duration-300 ${isDark ? 'hover:bg-zinc-900/60' : 'hover:bg-white'
                }`}>
                <div>
                  {/* Brand Header with RGN Logo */}
                  <div className={`flex items-center justify-between mb-6 pb-6 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'
                    }`}>
                    <div className="relative h-8 sm:h-9 w-[100px] sm:w-[120px] flex items-center">
                      <img
                        alt="RGN Performance Logo"
                        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0 pointer-events-none'
                          }`}
                        src="/logos/rgn-white.png"
                      />
                      <img
                        alt="RGN Performance Logo"
                        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-in-out ${isDark ? 'opacity-0 pointer-events-none' : 'opacity-100'
                          }`}
                        src="/logos/rgn-black.png"
                      />
                    </div>
                    <span className={`text-[11px] font-mono uppercase px-3 py-1 rounded font-semibold ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-800'
                      }`}>
                      Diesel Division
                    </span>
                  </div>

                  <p className={`text-sm sm:text-base leading-relaxed mb-6 font-normal ${isDark ? 'text-zinc-300' : 'text-ink'
                    }`}>
                    RGN Performance hadir sebagai jawaban pengguna mobil diesel yang menginginkan lebih dari sekedar pergantian knalpot. Berfokus pada desain, suara dan performa yang disesuaikan dengan karakter mesin diesel modern.
                  </p>
                </div>

                <div className={`mt-8 pt-6 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                  <a
                    className={`inline-flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider hover:text-ember transition-colors ${isDark ? 'text-white' : 'text-ink'
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
        <section className={`py-24 transition-colors duration-300 scroll-mt-16 ${isDark ? 'bg-zinc-950 text-paper' : 'bg-smoke text-ink'
          }`} id="testimoni">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className={`font-display text-3xl sm:text-5xl font-bold tracking-tight uppercase ${isDark ? 'text-white' : 'text-ink'
                }`}>
                Hasil Karya &amp; Review Pelanggan
              </h2>
            </div>

            {/* Rolling Documentation Showcase (Marquee Gallery from /ndk-asset/) */}
            <div className={`rounded-2xl border mb-16 relative overflow-hidden shadow-2xl transition-colors duration-300 ${isDark ? 'bg-zinc-950/90 border-zinc-800' : 'bg-paper border-zinc-200 shadow-md'
              }`}>

              {/* Header inside rolling showcase container */}
              <div className={`p-6 sm:p-8 border-b ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-smoke/60'
                }`}>
                <div>
                  <h3 className={`font-display text-xl sm:text-2xl font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-ink'
                    }`}>
                    Dokumentasi Workshop &amp; Hasil Pemasangan Asli
                  </h3>
                  <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-steel'}`}>
                    Foto otentik langsung dari workshop manufaktur NDK Exhaust &amp; RGN Performance di Purbalingga.
                  </p>
                </div>
              </div>

              {/* Marquee Scroller Wrapper with Soft Fading Edge Gradients */}
              <div className="relative py-6 sm:py-8 overflow-hidden group">

                {/* Left & Right Gradient Shadows for Seamless Look */}
                <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-28 z-10 bg-gradient-to-r ${isDark ? 'from-zinc-950 via-zinc-950/80 to-transparent' : 'from-paper via-paper/80 to-transparent'
                  }`} />
                <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-28 z-10 bg-gradient-to-l ${isDark ? 'from-zinc-950 via-zinc-950/80 to-transparent' : 'from-paper via-paper/80 to-transparent'
                  }`} />

                {/* Track with continuous marquee */}
                <div className="marquee-track flex gap-5 sm:gap-6 px-4">
                  {[...DOKUMENTASI_ASSET, ...DOKUMENTASI_ASSET].map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      onClick={() => setSelectedProductImage(item)}
                      className={`w-[280px] sm:w-[320px] h-[350px] sm:h-[370px] shrink-0 rounded-xl border overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:border-ember hover:shadow-xl hover:shadow-ember/20 cursor-pointer group/card flex flex-col justify-between ${isDark
                          ? 'bg-zinc-900/90 border-zinc-800 text-paper'
                          : 'bg-white border-zinc-200 text-ink shadow-sm'
                        }`}
                    >
                      {/* Image Preview Box - Fixed height and object-cover to guarantee equal dimensions */}
                      <div className="relative h-48 sm:h-52 w-full bg-black shrink-0 overflow-hidden border-b border-zinc-800">
                        <img
                          src={item.src}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out"
                          loading="lazy"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 text-white">
                          <div className="w-10 h-10 rounded-full bg-ember flex items-center justify-center shadow-lg shadow-ember/40">
                            <ZoomIn className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-display uppercase text-xs tracking-wider font-semibold">
                            Perbesar Foto
                          </span>
                        </div>

                        {/* Category Tag Badge */}
                        <div className="absolute top-3 right-3 z-10">
                          <span className="font-mono text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-black/80 text-ember border border-ember/40 backdrop-blur-xs shadow-md">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {/* Info Footer */}
                      <div className="p-4 flex flex-col justify-between flex-1">
                        <div>
                          <h4 className={`font-display text-sm sm:text-base font-bold uppercase tracking-tight group-hover/card:text-ember transition-colors mb-1 line-clamp-1 ${isDark ? 'text-white' : 'text-ink'
                            }`}>
                            {item.title}
                          </h4>
                          <p className={`font-body text-xs line-clamp-2 ${isDark ? 'text-zinc-400' : 'text-steel'
                            }`}>
                            {item.desc}
                          </p>
                        </div>
                        <div className="mt-auto pt-2.5 border-t border-dashed flex items-center justify-between text-[11px] font-mono">
                          <span className={`${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>NDK × RGN</span>
                          <span className="text-ember font-semibold flex items-center gap-1 group-hover/card:translate-x-0.5 transition-transform">
                            LIHAT <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* Customer Testimonials Grid (Authentic 5-Star Reviews from Shopee) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {/* Testi 1: Innova Bensin Header 4-2-1 */}
              <div className={`p-6 sm:p-8 rounded-xl border shadow-sm flex flex-col justify-between transition-colors duration-300 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-paper border-zinc-200'
                }`}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-amber-400 text-sm">★★★★★</div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-orange-500 font-semibold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      <ShopeeIcon className="w-3.5 h-3.5 text-[#EE4D2D]" />
                      Shopee Verified
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed italic mb-6 ${isDark ? 'text-zinc-200' : 'text-ink'
                    }`}>
                    "Tarikan mesin terasa lebih enteng dan padat dari RPM bawah sampai atas, aliran gas buang lancar. Kualitas sangat baik, material murni stainless steel, tekukan presisi, dan hasil pengelasan rapi. Fitment di ruang mesin presisi tanpa perlu ubahan aneh-aneh. Tampilan stainless kinclong berkelas dan suaranya makin padat berisi. Penjual responsif, pengiriman cepat. Rekomended buat yang mau upgrade performa Innova bensin!"
                  </p>
                </div>
                <div className={`pt-4 border-t flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-zinc-100'
                  }`}>
                  <div>
                    <p className={`font-display text-sm font-bold uppercase ${isDark ? 'text-white' : 'text-ink'}`}>
                      j*****a
                    </p>
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-steel'}`}>Toyota Innova 1TR-FE Bensin</p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                    Header 4-2-1
                  </span>
                </div>
              </div>

              {/* Testi 2: Honda Brio Bolt On DK-03V4 */}
              <div className={`p-6 sm:p-8 rounded-xl border shadow-sm flex flex-col justify-between transition-colors duration-300 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-paper border-zinc-200'
                }`}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-amber-400 text-sm">★★★★★</div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-orange-500 font-semibold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      <ShopeeIcon className="w-3.5 h-3.5 text-[#EE4D2D]" />
                      Shopee Verified
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed italic mb-6 ${isDark ? 'text-zinc-200' : 'text-ink'
                    }`}>
                    "Bagus banget asli, kalo cold start gak mengganggu di telinga, suara bulat merdu. Gak perlu potong-potong atau las lagi, langsung plug and play (PNP). Pas ngebut beuhhh suaranya ngebulet ngebass merdu, super pokoknya!"
                  </p>
                </div>
                <div className={`pt-4 border-t flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-zinc-100'
                  }`}>
                  <div>
                    <p className={`font-display text-sm font-bold uppercase ${isDark ? 'text-white' : 'text-ink'}`}>
                      robtee_vintage
                    </p>
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-steel'}`}>Honda Brio All New</p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                    Bolt On DK-03V4
                  </span>
                </div>
              </div>

              {/* Testi 3: Fortuner VNT 2KD Diesel Fullsystem */}
              <div className={`p-6 sm:p-8 rounded-xl border shadow-sm flex flex-col justify-between transition-colors duration-300 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-paper border-zinc-200'
                }`}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-amber-400 text-sm">★★★★★</div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-orange-500 font-semibold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      <ShopeeIcon className="w-3.5 h-3.5 text-[#EE4D2D]" />
                      Shopee Verified
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed italic mb-6 ${isDark ? 'text-zinc-200' : 'text-ink'
                    }`}>
                    "Downpipe & frontpipe RGN Performance presisi banget di turbo 2KD. Spooling turbo jadi jauh lebih responsif, tarikan enteng dan temperatur gas buang lebih adem. Las argon pie-cut rapi kelas sultan!"
                  </p>
                </div>
                <div className={`pt-4 border-t flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-zinc-100'
                  }`}>
                  <div>
                    <p className={`font-display text-sm font-bold uppercase ${isDark ? 'text-white' : 'text-ink'}`}>
                      andre9232
                    </p>
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-steel'}`}>Fortuner VNT 2KD Diesel</p>
                  </div>
                  <span className="text-[10px] font-mono bg-ember-tint px-2 py-0.5 rounded text-ember font-semibold">
                    RGN Diesel
                  </span>
                </div>
              </div>

            </div>

            {/* Shopee Review Badge & Link */}
            <div className="mt-12 text-center">
              <a
                href="https://shopee.co.id/buyer/138110837/rating?shop_id=138109013"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-xs sm:text-sm font-mono tracking-wider transition-all duration-300 border ${
                  isDark 
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-orange-500 hover:text-white' 
                    : 'bg-white border-zinc-300 text-zinc-700 hover:border-orange-500 hover:text-black shadow-sm'
                }`}
              >
                <ShopeeIcon className="w-4 h-4 text-[#EE4D2D]" />
                <span>Lihat 500+ Ulasan Asli di Official Store Shopee (Rating 4.9 / 5.0)</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              </a>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* QUICK CATALOG & CONSULTATION CTA                          */}
        {/* ========================================================= */}
        <section className={`py-16 border-t transition-colors duration-300 ${isDark ? 'bg-zinc-900 text-paper border-zinc-800' : 'bg-ink text-paper border-zinc-800'
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
      <footer className="bg-ink text-paper pt-16 pb-12 border-t border-zinc-800 scroll-mt-16" id="workshop">
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
                Manufaktur exhaust system knalpot mobil presisi berbahan stainless steel berkualitas tinggi untuk mesin bensin dan diesel. Berbasis di Purbalingga, Jawa Tengah.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNavigateCatalog}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded bg-zinc-900 border border-zinc-700 hover:border-ember text-xs text-zinc-200 hover:text-white transition-all cursor-pointer font-display uppercase tracking-wider"
                >
                  <BookOpen className="w-3.5 h-3.5 text-ember" />
                  <span>Buka E-Katalog</span>
                </button>
              </div>
            </div>

            {/* Column 2: NDK Exhaust Official (Petrol & Universal) */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-800/80">
                <img
                  alt="NDK Exhaust"
                  className="h-4 w-auto object-contain"
                  src="/logos/ndk-white.png"
                />
                <span className="text-[10px] font-mono uppercase bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-semibold">
                  Petrol Series
                </span>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li>
                  <a className="hover:text-ember transition-colors flex items-center gap-2.5 group" href="https://shopee.co.id/ndk_exhaust_official" rel="noopener noreferrer" target="_blank">
                    <ShopeeIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>Shopee: ndk_exhaust_official</span>
                  </a>
                </li>
                <li>
                  <a className="hover:text-ember transition-colors flex items-center gap-2.5 group" href="https://www.tokopedia.com/ndk-exhaust-id" rel="noopener noreferrer" target="_blank">
                    <TokopediaIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>Tokopedia: ndk-exhaust-id</span>
                  </a>
                </li>
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
                    <span>YouTube: NDK Exhaust Official</span>
                  </a>
                </li>
                <li>
                  <a className="hover:text-ember transition-colors flex items-center gap-2.5 group" href="https://wa.me/6289502240040?text=Halo%20Admin%20NDK%20Exhaust,%20saya%20ingin%20konsultasi%20dan%20order%20knalpot" rel="noopener noreferrer" target="_blank">
                    <WhatsAppIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>WhatsApp NDK CS</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: RGN Performance Official (Diesel Performance) */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-800/80">
                <img
                  alt="RGN Performance"
                  className="h-4 w-auto object-contain"
                  src="/logos/rgn-white.png"
                />
                <span className="text-[10px] font-mono uppercase bg-ember/20 text-ember border border-ember/30 px-2 py-0.5 rounded font-semibold">
                  Diesel Series
                </span>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li>
                  <a className="hover:text-ember transition-colors flex items-center gap-2.5 group" href="https://shopee.co.id/rgn.performance" rel="noopener noreferrer" target="_blank">
                    <ShopeeIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>Shopee: rgn.performance</span>
                  </a>
                </li>
                <li>
                  <a className="hover:text-ember transition-colors flex items-center gap-2.5 group" href="https://www.instagram.com/rgn.performance" rel="noopener noreferrer" target="_blank">
                    <InstagramIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>Instagram: @rgn.performance</span>
                  </a>
                </li>
                <li>
                  <a className="hover:text-ember transition-colors flex items-center gap-2.5 group" href="https://www.tiktok.com/@rgn.performance" rel="noopener noreferrer" target="_blank">
                    <TikTokIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>TikTok: @rgn.performance</span>
                  </a>
                </li>
                <li>
                  <a className="hover:text-ember transition-colors flex items-center gap-2.5 group" href="https://www.youtube.com/@RGNPerformance" rel="noopener noreferrer" target="_blank">
                    <YouTubeIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>YouTube: @RGNPerformance</span>
                  </a>
                </li>
                <li>
                  <a className="hover:text-ember transition-colors flex items-center gap-2.5 group" href="https://wa.me/6289502240040?text=Halo%20Admin%20RGN%20Performance%2C%20saya%20ingin%20konsultasi%20knalpot%20diesel" rel="noopener noreferrer" target="_blank">
                    <WhatsAppIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>WhatsApp RGN CS</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Workshop & Lokasi */}
            <div>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-ember rounded-full" /> Workshop &amp; Lokasi
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed mb-2">
                RGN &amp; NDK Performance Workshop<br />
                Purbalingga, Jawa Tengah, Indonesia.
              </p>
              <div className="text-xs text-zinc-300 font-medium mb-4">
                <span>Senin - Sabtu: 08.30 - 17.00 WIB</span><br />
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

      {/* Lightbox Modal for Photo Showcase */}
      {selectedProductImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setSelectedProductImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-widest text-ember font-bold">
                  {selectedProductImage.category}
                </span>
                <span className="text-zinc-600">•</span>
                <h3 className="font-display text-base sm:text-lg font-bold text-white uppercase tracking-tight">
                  {selectedProductImage.title}
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
            <div className="p-4 bg-black flex items-center justify-center max-h-[72vh] overflow-auto">
              <img
                src={selectedProductImage.src}
                alt={selectedProductImage.title}
                className="max-h-[66vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            {/* Modal Footer / Action */}
            <div className="px-5 py-4 bg-zinc-900/80 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="font-body text-xs text-zinc-400">
                {selectedProductImage.desc}
              </p>
              <a
                href={`https://wa.me/6289502240040?text=Halo%2C%20saya%20tertarik%20dengan%20hasil%20pemasangan%20${encodeURIComponent(selectedProductImage.title)}%20yang%20ada%20di%20landing%20page.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 bg-ember hover:bg-ember-deep text-white rounded-xl font-display text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 shrink-0 shadow-md shadow-ember/20 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-white" />
                <span>Konsultasi Serupa via WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
