import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  ArrowRight, 
  CheckCircle2, 
  MessageCircle, 
  MapPin, 
  ExternalLink, 
  ShoppingBag, 
  Store, 
  ChevronRight, 
  Layers, 
  Flame, 
  Star, 
  Wrench, 
  Volume2, 
  ShieldCheck, 
  Sparkles,
  Search,
  ImageIcon,
  Car
} from 'lucide-react';
import { setSEO } from '../utils/seo';

// Curated high-performance fallback items for instant display if Firestore data is empty or loading
const FALLBACK_BEST_SELLERS = [
  {
    id: 'fb-1',
    sku: 'NDK-DP-2GD',
    name: 'Downpipe NDK Exhaust Toyota Innova Reborn / Fortuner VRZ (2GD-FTV)',
    brand: 'NDK Exhaust',
    engine_type: '2GD-FTV',
    car_variant: 'Innova Reborn / Fortuner VRZ',
    category_name: 'Downpipe',
    selling_price: 1350000,
    imageUrl: '',
    spec_sound: 'Gahar / Spool Turbo',
    tag: 'BEST SELLER DIESEL'
  },
  {
    id: 'fb-2',
    sku: 'NDK-BO-BRIO',
    name: 'Bolt-On Muffler NDK Exhaust Honda Brio All New (L12)',
    brand: 'NDK Exhaust',
    engine_type: 'L12',
    car_variant: 'Honda Brio Satya & RS',
    category_name: 'Bolt On Muffler',
    selling_price: 850000,
    imageUrl: '',
    spec_sound: 'Bass Bulat Padat',
    tag: 'BEST SELLER BENSIN'
  },
  {
    id: 'fb-3',
    sku: 'NDK-RES-HOLD',
    name: 'Resonator NDK Exhaust Type Hold (Transmisi Manual & Matic)',
    brand: 'NDK Exhaust',
    engine_type: 'Universal Bensin',
    car_variant: 'Universal City Car & Sedan',
    category_name: 'Resonator',
    selling_price: 450000,
    imageUrl: '',
    spec_sound: 'Bass Kering Adem',
    tag: 'TOP RESIDUAL'
  },
  {
    id: 'fb-4',
    sku: 'NDK-FS-2GD-RGN',
    name: 'Paket Full System NDK & RGN Innova 2GD (Downpipe + Frontpipe + Centerpipe + Muffler)',
    brand: 'NDK Exhaust',
    engine_type: '2GD-FTV',
    car_variant: 'Toyota Innova Reborn 2.4 Diesel',
    category_name: 'Paket Bundling',
    selling_price: 3450000,
    imageUrl: '',
    spec_sound: 'Gahar Maksimal',
    isBundle: true,
    tag: 'PAKET KOMPLIT'
  },
  {
    id: 'fb-5',
    sku: 'NDK-DP-2KD',
    name: 'Downpipe NDK Exhaust Toyota Innova 2KD / Fortuner 2KD non-VNT & VNT',
    brand: 'NDK Exhaust',
    engine_type: '2KD-FTV',
    car_variant: 'Innova 2KD / Fortuner 2KD',
    category_name: 'Downpipe',
    selling_price: 1250000,
    imageUrl: '',
    spec_sound: 'Spooling Turbo Padat',
    tag: 'LEGEND DIESEL'
  },
  {
    id: 'fb-6',
    sku: 'NDK-BO-YARIS',
    name: 'Bolt-On Muffler NDK Exhaust Toyota Yaris Bakpao / Lele / Joker (1NZ / 2NR)',
    brand: 'NDK Exhaust',
    engine_type: '1NZ-FE / 2NR-FE',
    car_variant: 'Toyota Yaris All Gen',
    category_name: 'Bolt On Muffler',
    selling_price: 950000,
    imageUrl: '',
    spec_sound: 'Bass Kering Sporty',
    tag: 'FAVORIT HATCHBACK'
  }
];

export default function LandingPage({ currentUser, products = [], bundles = [] }) {
  const [activeFilterTab, setActiveFilterTab] = useState('ALL'); // 'ALL' | 'PRODUCTS' | 'BUNDLES'

  useEffect(() => {
    setSEO(
      "NDK Exhaust & RGN Performance - Knalpot Presisi untuk Performa Maksimal",
      "Katalog resmi knalpot performa NDK Exhaust & RGN Performance. Bolt-on Muffler, Downpipe, Frontpipe, Centerpipe, dan Paket Full System Plug and Play stainless steel berkualitas tinggi."
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

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Curate Best Sellers from active products and bundles
  const bestSellers = useMemo(() => {
    const activeProds = (products || []).filter(p => p.status !== 'INACTIVE');
    const activeBundles = (bundles || []).filter(b => b.status !== 'INACTIVE');

    if (activeProds.length === 0 && activeBundles.length === 0) {
      return FALLBACK_BEST_SELLERS;
    }

    // Pick popular / standout products (match diesel 2GD, 2KD, Brio, Pajero, or top items)
    const dieselKeywords = ['2gd', '2kd', 'innova', 'fortuner', 'pajero', 'downpipe', 'brio', 'muffler', 'bolt-on'];
    
    const prioritizedProds = [...activeProds].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      const matchA = dieselKeywords.some(k => nameA.includes(k)) ? 1 : 0;
      const matchB = dieselKeywords.some(k => nameB.includes(k)) ? 1 : 0;
      return matchB - matchA;
    });

    const chosenProds = prioritizedProds.slice(0, 6).map(p => ({
      ...p,
      isBundle: false,
      tag: p.engine_type || p.category_name || 'PART RESMI'
    }));

    const chosenBundles = activeBundles.slice(0, 3).map(b => ({
      ...b,
      isBundle: true,
      tag: 'PAKET BUNDLING'
    }));

    const merged = [...chosenBundles, ...chosenProds];
    return merged.length > 0 ? merged : FALLBACK_BEST_SELLERS;
  }, [products, bundles]);

  // Filtered by tab for Best Seller section
  const displayedBestSellers = useMemo(() => {
    if (activeFilterTab === 'PRODUCTS') {
      return bestSellers.filter(item => !item.isBundle);
    }
    if (activeFilterTab === 'BUNDLES') {
      return bestSellers.filter(item => item.isBundle);
    }
    return bestSellers;
  }, [bestSellers, activeFilterTab]);

  const getWhatsAppUrl = (product) => {
    const pName = encodeURIComponent(product.name || 'Produk NDK Exhaust');
    const pSku = encodeURIComponent(product.sku || product.code || '');
    return `https://wa.me/6289502240040?text=Halo%20Admin%20NDK%20Exhaust,%20saya%20tertarik%20dengan%20produk%20*${pName}*%20(Kode:%20${pSku}).%20Mohon%20info%20ketersediaan%20stok%20dan%20cara%20pemesanan.`;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans selection:bg-[#D32F2F] selection:text-white">
      
      {/* 1. TOP ANNOUNCEMENT / CS BAR */}
      <div className="bg-[#18181B] text-white text-[11px] font-semibold py-2 px-4 text-center border-b border-zinc-800 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#D32F2F] animate-pulse"></span>
        <span>Official E-Katalog NDK Exhaust & RGN Performance</span>
        <span className="hidden sm:inline text-zinc-500">•</span>
        <a 
          href="https://wa.me/6289502240040" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hidden sm:inline-flex items-center gap-1 text-[#D32F2F] hover:text-red-400 font-bold transition"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Konsultasi WA: +62 895-0224-0040</span>
        </a>
      </div>

      {/* 2. STICKY NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Brand Logos (NDK & RGN) */}
          <div 
            className="flex items-center gap-3 sm:gap-4 cursor-pointer" 
            onClick={() => {
              navigateTo('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            title="Halaman Utama NDK Exhaust"
          >
            <img 
              src="/logos/ndk-black.png" 
              alt="NDK Exhaust" 
              className="h-7 sm:h-9 w-auto object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <img 
              src="/logos/rgn-black.png" 
              alt="RGN Performance" 
              className="h-6 sm:h-8 w-auto object-contain hidden sm:block"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          {/* Desktop Navigation Menu */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-700">
            <button 
              onClick={() => navigateTo('/catalog')}
              className="hover:text-[#D32F2F] transition flex items-center gap-1 cursor-pointer"
            >
              <span>E-Katalog Resmi</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#D32F2F] text-white">LENGKAP</span>
            </button>
            <button 
              onClick={() => scrollToSection('best-sellers')}
              className="hover:text-[#D32F2F] transition cursor-pointer"
            >
              Best Seller
            </button>
            <button 
              onClick={() => scrollToSection('lineup')}
              className="hover:text-[#D32F2F] transition cursor-pointer"
            >
              Kategori Produk
            </button>
            <button 
              onClick={() => scrollToSection('marketplace')}
              className="hover:text-[#D32F2F] transition cursor-pointer"
            >
              Marketplace
            </button>
            <button 
              onClick={() => scrollToSection('workshop')}
              className="hover:text-[#D32F2F] transition cursor-pointer"
            >
              Workshop
            </button>
          </nav>

          {/* Actions on Navbar */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => navigateTo('/catalog')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs font-black rounded-lg shadow-sm transition active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Buka Katalog</span>
            </button>

            {/* Subtle Portal Staf Button for Internal Users */}
            <button
              onClick={handleStaffPortalClick}
              className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition cursor-pointer"
              title="Akses portal manajemen gudang internal"
            >
              <span>{currentUser ? 'Dashboard' : 'Portal Staf'}</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>

        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative bg-white border-b border-slate-200 overflow-hidden pt-12 sm:pt-16 pb-16 sm:pb-24">
        {/* Subtle grid background pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#18181B_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            
            {/* Tag Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-[#D32F2F] text-xs font-black uppercase tracking-wider shadow-2xs">
              <Flame className="w-4 h-4 text-[#D32F2F]" />
              <span>Official NDK Exhaust & RGN Performance</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.15]">
              Sistem Knalpot Presisi untuk <br />
              <span className="text-[#D32F2F]">Performa Maksimal</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Tingkatkan respons gas, torsi, dan tenaga mesin mobil Anda dengan sistem knalpot presisi berbahan stainless steel berkualitas tinggi. 100% Plug and Play (PNP) tanpa ubahan bodi.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigateTo('/catalog')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded-xl font-black text-sm sm:text-base shadow-lg shadow-red-600/20 transition hover:scale-102 active:scale-98 cursor-pointer uppercase tracking-wider"
              >
                <Package className="w-5 h-5" />
                <span>Lihat E-Katalog Lengkap</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="https://wa.me/6289502240040?text=Halo%20Admin%20NDK%20Exhaust,%20saya%20ingin%20konsultasi%20pilihan%20knalpot%20untuk%20mobil%20saya."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 bg-[#18181B] hover:bg-black text-white rounded-xl font-black text-sm sm:text-base shadow-sm transition hover:scale-102 active:scale-98 cursor-pointer uppercase tracking-wider"
              >
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <span>Konsultasi WhatsApp CS</span>
              </a>
            </div>

            {/* Key Value Badges */}
            <div className="pt-8 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="font-black text-slate-900 text-sm sm:text-base">100% PNP</div>
                <div className="text-[11px] text-slate-500 font-medium">Bolt-on Presisi Pabrik</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="font-black text-slate-900 text-sm sm:text-base">Stainless Steel</div>
                <div className="text-[11px] text-slate-500 font-medium">Tahan Karat & Panas</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="font-black text-slate-900 text-sm sm:text-base">Dyno Proven</div>
                <div className="text-[11px] text-slate-500 font-medium">Power & Torque Naik</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="font-black text-slate-900 text-sm sm:text-base">Se-Indonesia</div>
                <div className="text-[11px] text-slate-500 font-medium">Ekspedisi Aman & Cepat</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. BEST SELLER SHOWCASE SECTION */}
      <section id="best-sellers" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-[#D32F2F] uppercase tracking-widest mb-1.5">
              <Star className="w-3.5 h-3.5 fill-[#D32F2F]" />
              <span>PRODUK & PAKET FAVORIT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Best Seller NDK Exhaust & RGN
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Pilihan knalpot terpopuler untuk mesin diesel modern dan bensin dengan performa dan suara terbaik.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-2xs self-start md:self-auto">
            <button
              onClick={() => setActiveFilterTab('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeFilterTab === 'ALL' 
                  ? 'bg-[#18181B] text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Semua ({bestSellers.length})
            </button>
            <button
              onClick={() => setActiveFilterTab('PRODUCTS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeFilterTab === 'PRODUCTS' 
                  ? 'bg-[#18181B] text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Part Satuan
            </button>
            <button
              onClick={() => setActiveFilterTab('BUNDLES')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                activeFilterTab === 'BUNDLES' 
                  ? 'bg-[#D32F2F] text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Paket Bundling</span>
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedBestSellers.map((item, idx) => {
            const isBundle = Boolean(item.isBundle);
            const price = Number(item.selling_price ?? item.price) || 0;
            const itemSku = item.sku || item.code || '';

            return (
              <div 
                key={item.id || idx}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-lg transition-all duration-200 hover:-translate-y-1 flex flex-col overflow-hidden group"
              >
                {/* Photo Box */}
                <div className="aspect-16/10 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-contain bg-white group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-1 p-4 text-center">
                      {isBundle ? (
                        <Layers className="w-10 h-10 text-slate-300" />
                      ) : (
                        <ImageIcon className="w-10 h-10 text-slate-300" />
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {isBundle ? 'Paket Full System' : 'NDK Exhaust Official'}
                      </span>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {isBundle ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#D32F2F] text-white shadow-2xs flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>PAKET BUNDLING</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#18181B] text-white shadow-2xs">
                        {item.brand || 'NDK EXHAUST'}
                      </span>
                    )}

                    {item.tag && !isBundle && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/90 backdrop-blur-xs text-slate-800 border border-slate-200">
                        {item.tag}
                      </span>
                    )}
                  </div>

                  {itemSku && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/90 backdrop-blur-xs text-slate-600 border border-slate-200">
                        {itemSku}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Compatibility chip */}
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-1.5">
                      <Car className="w-3.5 h-3.5 text-[#D32F2F] flex-shrink-0" />
                      <span className="truncate">{item.car_variant || item.engine_type || 'Universal Fitment'}</span>
                    </div>

                    <h3 className="font-black text-slate-900 text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-[#D32F2F] transition-colors">
                      {item.name}
                    </h3>

                    {/* Sound spec or bundle info if available */}
                    {item.spec_sound && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                        <Volume2 className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">Karakter: <strong>{item.spec_sound}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Price & Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                        {isBundle ? 'Harga Resmi Paket' : 'Harga Eceran'}
                      </span>
                      <span className="text-base sm:text-lg font-black text-slate-950">
                        Rp {price.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={getWhatsAppUrl(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition"
                        title="Tanya ketersediaan stok via WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => navigateTo(itemSku ? `/catalog?sku=${encodeURIComponent(itemSku)}` : '/catalog')}
                        className="px-3 py-2 rounded-lg bg-[#18181B] hover:bg-[#D32F2F] text-white text-xs font-black transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>Detail</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Section Bottom Banner to Catalog */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xs text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-slate-950">
              Mencari knalpot untuk tipe mobil atau mesin lainnya?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Jelajahi E-Katalog resmi dengan filter lengkap berdasarkan tipe mesin (2GD, 2KD, 1NZ, dll), karakter suara, dan kategori knalpot.
            </p>
          </div>
          <button
            onClick={() => navigateTo('/catalog')}
            className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3.5 bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded-xl font-black text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer uppercase tracking-wider"
          >
            <span>Buka E-Katalog Lengkap</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 5. PRODUCT CATEGORY LINEUP */}
      <section id="lineup" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-black text-[#D32F2F] uppercase tracking-widest">
              LINE-UP PRODUK NDK & RGN
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Komponen Knalpot Performa Lengkap
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Dirancang secara aerodinamis untuk mengoptimalkan aliran pembuangan gas sisa pembakaran mobil Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Downpipe & Frontpipe */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#D32F2F]/40 transition group">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#D32F2F] flex items-center justify-center mb-4 font-black">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-2 group-hover:text-[#D32F2F] transition-colors">
                Downpipe & Frontpipe
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Menghilangkan hambatan katalis standar, mempercepat spool turbo pada mesin diesel & bensin turbo, serta meningkatkan torsi signifikan.
              </p>
            </div>

            {/* Card 2: Bolt-On Muffler */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#D32F2F]/40 transition group">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 text-slate-900 flex items-center justify-center mb-4 font-black">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-2 group-hover:text-[#D32F2F] transition-colors">
                Bolt-On Muffler
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pemasangan plug and play presisi langsung baut ke gantungan orisinil mobil. Karakter suara bass bulat, kering, atau gahar sesuai selera.
              </p>
            </div>

            {/* Card 3: Resonator High Flow */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#D32F2F]/40 transition group">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 text-slate-900 flex items-center justify-center mb-4 font-black">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-2 group-hover:text-[#D32F2F] transition-colors">
                Resonator Racing & Harian
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tersedia tipe Hold (Manual/Matic) dan Straight. Menjaga kompresi putaran bawah agar tidak ngempos dan meredam dengung berlebih di dalam kabin.
              </p>
            </div>

            {/* Card 4: Paket Full System */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#D32F2F]/40 transition group">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#D32F2F] flex items-center justify-center mb-4 font-black">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-2 group-hover:text-[#D32F2F] transition-colors">
                Paket Bundling Full System
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kombinasi lengkap dari header/downpipe, pipa tengah hingga muffler tip. Paket teruji untuk output tenaga tertinggi dan harga lebih hemat.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 6. OFFICIAL MARKETPLACES & ORDER SECTION */}
      <section id="marketplace" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-black text-[#D32F2F] uppercase tracking-widest">
            OFFICIAL STORE & ORDER GATEWAY
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            Pesan Resmi NDK Exhaust & RGN
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Dapatkan jaminan produk 100% original, garansi kepresisian, dan transaksi aman melalui official marketplace atau WhatsApp CS resmi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Tokopedia */}
          <a
            href="https://www.tokopedia.com/ndk-exhaust-id"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition hover:-translate-y-1 flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="font-black text-slate-900 text-lg group-hover:text-emerald-600 transition">
                Tokopedia Official Store
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bebas ongkir ke seluruh Indonesia, opsi cicilan 0%, dan promo diskon voucher resmi Tokopedia.
              </p>
            </div>
            <div className="pt-6 flex items-center gap-1.5 text-xs font-black text-emerald-600 uppercase tracking-wider">
              <span>Buka Tokopedia</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Shopee */}
          <a
            href="https://shopee.co.id/ndk_exhaust_official"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition hover:-translate-y-1 flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-orange-600 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="font-black text-slate-900 text-lg group-hover:text-orange-600 transition">
                Shopee Official Mall
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nikmati gratis ongkir ekstra, garansi pengembalian barang, dan kemudahan pembayaran COD / ShopeePay.
              </p>
            </div>
            <div className="pt-6 flex items-center gap-1.5 text-xs font-black text-orange-600 uppercase tracking-wider">
              <span>Buka Shopee</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* WhatsApp Direct */}
          <a
            href="https://wa.me/6289502240040?text=Halo%20Admin%20NDK%20Exhaust,%20saya%20ingin%20konsultasi%20dan%20order%20knalpot"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition hover:-translate-y-1 flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="font-black text-slate-900 text-lg group-hover:text-emerald-600 transition">
                WhatsApp CS (+62 895-0224-0040)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Konsultasi langsung spesifikasi mobil, pemilihan karakter suara, dan order custom khusus bengkel atau reseller.
              </p>
            </div>
            <div className="pt-6 flex items-center gap-1.5 text-xs font-black text-emerald-600 uppercase tracking-wider">
              <span>Chat WhatsApp Sekarang</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>

        </div>
      </section>

      {/* 7. WORKSHOP & FITTING CENTER SECTION */}
      <section id="workshop" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#D32F2F] text-xs font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                <span>Workshop & Installation</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                Kunjungi RGN Performance Workshop
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Melayani pemasangan langsung knalpot NDK & RGN dengan teknisi berpengalaman. Nikmati sound test langsung di tempat dan pengecekan kepresisian plug and play.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Teknisi Khusus Knalpot</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Garansi Pasang Presisi</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Sound Test Langsung</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <a
                href="https://g.page/ndkexhaust"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded-xl font-black text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer uppercase tracking-wider text-center"
              >
                <MapPin className="w-4 h-4" />
                <span>Buka Rute di Google Maps</span>
              </a>
              <a
                href="http://bit.ly/Youtube-NDKexhaust"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 rounded-xl font-black text-xs sm:text-sm transition active:scale-95 cursor-pointer uppercase tracking-wider text-center"
              >
                <span>Lihat Sound Test YouTube</span>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Col 1: Brand Info */}
            <div className="space-y-4">
              <div 
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => {
                  navigateTo('/');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                title="Halaman Utama NDK Exhaust"
              >
                <img 
                  src="/logos/ndk-black.png" 
                  alt="NDK Exhaust" 
                  className="h-8 sm:h-9 w-auto object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="h-5 w-px bg-slate-200"></div>
                <img 
                  src="/logos/rgn-black.png" 
                  alt="RGN Performance" 
                  className="h-6 sm:h-7 w-auto object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Katalog resmi produk knalpot NDK Exhaust & RGN Performance. Melayani pemesanan, konsultasi spesifikasi mobil, dan pengiriman ke seluruh Indonesia.
              </p>
            </div>

            {/* Col 2: MARKETPLACE */}
            <div className="space-y-3">
              <h4 className="text-slate-950 text-xs font-black uppercase tracking-widest">
                MARKETPLACE RESMI
              </h4>
              <ul className="space-y-2 text-[11px]">
                <li>
                  <a 
                    href="https://www.tokopedia.com/ndk-exhaust-id" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-[#D32F2F] transition flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D32F2F]" />
                    <span>Tokopedia Official Store</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="https://shopee.co.id/ndk_exhaust_official" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-[#D32F2F] transition flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D32F2F]" />
                    <span>Shopee Official Mall</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="https://wa.me/6289502240040?text=Halo%20Admin%20NDK%20Exhaust" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-[#D32F2F] transition flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D32F2F]" />
                    <span>WhatsApp CS: 0895-0224-0040</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: MEDIA & VIDEO */}
            <div className="space-y-3">
              <h4 className="text-slate-950 text-xs font-black uppercase tracking-widest">
                MEDIA & VIDEO
              </h4>
              <ul className="space-y-2 text-[11px]">
                <li>
                  <a 
                    href="https://www.instagram.com/ndkexhaust" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-[#D32F2F] transition flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D32F2F]" />
                    <span>Instagram @ndkexhaust</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="http://bit.ly/Youtube-NDKexhaust" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-[#D32F2F] transition flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D32F2F]" />
                    <span>YouTube Sound Test</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.tiktok.com/@ndkofficial.id" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-[#D32F2F] transition flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D32F2F]" />
                    <span>TikTok @ndkofficial.id</span>
                  </a>
                </li>
                <li>
                  <button 
                    onClick={() => navigateTo('/catalog')}
                    className="hover:text-[#D32F2F] transition flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D32F2F]" />
                    <span>E-Katalog Web Resmi</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: WORKSHOP RESMI */}
            <div className="space-y-3">
              <h4 className="text-slate-950 text-xs font-black uppercase tracking-widest">
                WORKSHOP RESMI
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                RGN Performance Workshop,<br />
                Kawasan Industri Otomotif, Indonesia<br />
                Senin - Sabtu: 08.30 - 17.00 WIB
              </p>
              <div>
                <a
                  href="https://g.page/ndkexhaust"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs font-extrabold rounded transition cursor-pointer shadow-2xs uppercase tracking-wider"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>BUKA GOOGLE MAPS</span>
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Bar with Discreet Staff Portal Link */}
          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-400">
            <p>
              © {new Date().getFullYear()} NDK Exhaust & RGN Performance. All Rights Reserved.
            </p>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigateTo('/catalog')} 
                className="hover:text-slate-700 transition cursor-pointer"
              >
                E-Katalog
              </button>
              <span>•</span>
              <button 
                onClick={handleStaffPortalClick} 
                className="hover:text-[#D32F2F] transition cursor-pointer font-semibold"
              >
                {currentUser ? 'Ke Dashboard Gudang' : 'Portal Staf Gudang'}
              </button>
              <span>•</span>
              <a 
                href="https://kukuhdwisaputra.site" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-slate-700 transition"
              >
                kukuhdwisaputra.site
              </a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
