import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Package,
  Car, 
  Wrench, 
  Volume2, 
  CheckCircle2, 
  MessageCircle, 
  Share2, 
  Eye, 
  X, 
  ArrowRight, 
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Info,
  Check,
  Flame,
  ImageIcon,
  Filter,
  CheckCircle,
  ExternalLink,
  MapPin,
  ShoppingBag,
  Store,
  Layers,
  RotateCcw,
  FileText
} from 'lucide-react';
import { matchesSearch } from '../utils/searchUtils';
import { setSEO } from '../utils/seo';

export const formatBundleDisplayName = (b) => {
  if (!b) return '';
  const mainEng = (b.engine_type || b.machineCategory || '').trim();
  const cleanEng = (mainEng && mainEng !== '-' && mainEng.toLowerCase() !== 'all') ? mainEng : '';
  if (cleanEng && !b.name?.toLowerCase().includes(cleanEng.toLowerCase())) {
    return `${b.name} - ${cleanEng}`;
  }
  return b.name || '';
};

export default function PublicCatalog({ 
  products = [], 
  bundles = [],
  brands = [], 
  machineCategories = [], 
  initialSku = '',
  onGoToLanding,
  onGoToLogin
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [catalogMode, setCatalogMode] = useState('ALL'); // 'ALL' | 'PRODUCTS' | 'BUNDLES'
  const [selectedEngine, setSelectedEngine] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSound, setSelectedSound] = useState('ALL');
  const [sortBy, setSortBy] = useState('POPULAR');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8; // 8 items per page

  const [detailProduct, setDetailProduct] = useState(null);
  const [detailBundle, setDetailBundle] = useState(null);
  const [copiedSku, setCopiedSku] = useState(false);

  const productListRef = useRef(null);

  const navigateToLanding = () => {
    if (onGoToLanding) {
      onGoToLanding();
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // Dynamic SEO
  useEffect(() => {
    if (detailBundle) {
      setSEO(
        `${detailBundle.name} - Paket Bundling NDK Exhaust Official`,
        `Beli ${detailBundle.name} ${detailBundle.brand || 'NDK Exhaust'}. Harga Resmi Paket: Rp ${(Number(detailBundle.selling_price || detailBundle.price) || 0).toLocaleString('id-ID')}. Kompatibel untuk: ${detailBundle.car_variant || 'Semua Mobil'}`
      );
    } else if (detailProduct) {
      setSEO(
        `${detailProduct.name} - NDK Exhaust Official`,
        `Beli ${detailProduct.name} ${detailProduct.brand || 'NDK Exhaust'}. Kategori: ${detailProduct.category_name || 'Knalpot'}. Harga Resmi: Rp ${(Number(detailProduct.selling_price || detailProduct.price) || 0).toLocaleString('id-ID')}. Kompatibel untuk: ${detailProduct.car_variant || 'Semua Mobil'}`,
        detailProduct.imageUrl || null
      );
    } else {
      setSEO(
        "Katalog Resmi NDK Exhaust - Knalpot Presisi untuk Performa Maksimal",
        "E-Katalog lengkap NDK Exhaust. Tersedia pilihan Part Satuan dan Paket Bundling berbahan Stainless Steel & Titanium untuk seluruh lini mobil Indonesia."
      );
    }
  }, [detailProduct, detailBundle]);

  // Active public products (exclude soft deleted INACTIVE)
  const activeProducts = useMemo(() => {
    return (products || []).filter(p => p.status !== 'INACTIVE');
  }, [products]);

  // Active public bundles (exclude soft deleted INACTIVE)
  const activeBundles = useMemo(() => {
    return (bundles || []).filter(b => b.status !== 'INACTIVE');
  }, [bundles]);

  // Derive unique categories and sounds for products
  const categoryList = useMemo(() => {
    const set = new Set();
    activeProducts.forEach(p => {
      const c = p.category_name || p.categoryName;
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [activeProducts]);

  const soundList = useMemo(() => {
    const set = new Set();
    activeProducts.forEach(p => {
      const s = p.spec_sound || p.specSound;
      if (s) set.add(s);
    });
    return Array.from(set).sort();
  }, [activeProducts]);

  // Helper count for engine chips
  const getEngineCount = (engineId) => {
    const pCount = engineId === 'ALL' ? activeProducts.length : activeProducts.filter(p => {
      const eng = (p.engine_type || p.machineCategory || p.engineType || '').toUpperCase();
      const target = engineId.toUpperCase();
      if (target.includes(',')) {
        const parts = target.split(',').map(s => s.trim());
        return parts.some(part => eng.includes(part));
      }
      return eng === target || eng.includes(target);
    }).length;

    const bCount = engineId === 'ALL' ? activeBundles.length : activeBundles.filter(b => {
      const eng = (b.engine_type || b.machineCategory || b.engineType || '').toUpperCase();
      const target = engineId.toUpperCase();
      if (target.includes(',')) {
        const parts = target.split(',').map(s => s.trim());
        return parts.some(part => eng.includes(part));
      }
      return eng === target || eng.includes(target);
    }).length;

    if (catalogMode === 'PRODUCTS') return pCount;
    if (catalogMode === 'BUNDLES') return bCount;
    return pCount + bCount;
  };

  // Dynamically derive engine chips from database (activeProducts & activeBundles)
  const availableEngineChips = useMemo(() => {
    const set = new Set();

    activeProducts.forEach(p => {
      const eng = (p.engine_type || p.machineCategory || p.engineType || '').trim();
      if (eng && eng !== '-' && eng.toLowerCase() !== 'universal / semua mesin') {
        set.add(eng);
      }
    });

    activeBundles.forEach(b => {
      const eng = (b.engine_type || b.machineCategory || b.engineType || '').trim();
      if (eng && eng !== '-' && eng.toLowerCase() !== 'universal' && eng.toLowerCase() !== 'universal / semua mesin') {
        set.add(eng);
      }
    });

    const sortedEngines = Array.from(set).sort((a, b) => a.localeCompare(b));

    const chips = [
      { id: 'ALL', label: 'SEMUA MESIN', icon: true },
      ...sortedEngines.map(eng => ({ id: eng, label: eng }))
    ];

    // Filter to only include chips that actually have at least 1 item in the database
    return chips.filter(chip => chip.id === 'ALL' || getEngineCount(chip.id) > 0);
  }, [activeProducts, activeBundles, catalogMode]);

  // Auto-reset selectedEngine if it's no longer available in the current mode
  useEffect(() => {
    if (selectedEngine !== 'ALL' && !availableEngineChips.some(eng => eng.id === selectedEngine)) {
      setSelectedEngine('ALL');
    }
  }, [availableEngineChips, selectedEngine]);

  // Filtered Products (Part Satuan)
  const filteredProducts = useMemo(() => {
    const list = activeProducts.filter(p => {
      const matchesSearchTerm = matchesSearch(
        searchTerm, 
        p.name, 
        p.sku || p.code, 
        p.car_variant || p.carVariant, 
        p.brand, 
        p.category_name,
        p.engine_type || p.machineCategory,
        p.spec_sound
      );

      let matchesEngine = true;
      if (selectedEngine !== 'ALL') {
        const eng = (p.engine_type || p.machineCategory || p.engineType || '').toUpperCase();
        const target = selectedEngine.toUpperCase();
        if (target.includes(',')) {
          const parts = target.split(',').map(s => s.trim());
          matchesEngine = parts.some(part => eng.includes(part));
        } else {
          matchesEngine = eng.includes(target);
        }
      }

      const matchesCategory = selectedCategory === 'ALL' || (p.category_name || p.categoryName) === selectedCategory;
      const matchesSound = selectedSound === 'ALL' || (p.spec_sound || p.specSound) === selectedSound;

      return matchesSearchTerm && matchesEngine && matchesCategory && matchesSound;
    });

    return list.sort((a, b) => {
      const priceA = Number(a.selling_price ?? a.price) || 0;
      const priceB = Number(b.selling_price ?? b.price) || 0;

      if (sortBy === 'PRICE_LOW') return priceA - priceB;
      if (sortBy === 'PRICE_HIGH') return priceB - priceA;
      if (sortBy === 'NAME_ASC') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });
  }, [activeProducts, searchTerm, selectedEngine, selectedCategory, selectedSound, sortBy]);

  // Filtered Bundles (Paket Bundling)
  const filteredBundles = useMemo(() => {
    const list = activeBundles.filter(b => {
      const matchesSearchTerm = matchesSearch(
        searchTerm,
        b.name,
        b.code,
        b.car_variant,
        b.brand,
        b.engine_type,
        b.rawIsi || '',
        b.description || b.keterangan || ''
      );

      let matchesEngine = true;
      if (selectedEngine !== 'ALL') {
        const eng = (b.engine_type || b.machineCategory || '').toUpperCase();
        const target = selectedEngine.toUpperCase();
        if (target.includes(',')) {
          const parts = target.split(',').map(s => s.trim());
          matchesEngine = parts.some(part => eng.includes(part));
        } else {
          matchesEngine = eng.includes(target);
        }
      }

      return matchesSearchTerm && matchesEngine;
    });

    return list.sort((a, b) => {
      const priceA = Number(a.selling_price ?? a.price) || 0;
      const priceB = Number(b.selling_price ?? b.price) || 0;

      if (sortBy === 'PRICE_LOW') return priceA - priceB;
      if (sortBy === 'PRICE_HIGH') return priceB - priceA;
      if (sortBy === 'NAME_ASC') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });
  }, [activeBundles, searchTerm, selectedEngine, sortBy]);

  // Combined Display Items (based on catalogMode)
  const displayedItems = useMemo(() => {
    if (catalogMode === 'PRODUCTS') {
      return filteredProducts.map(p => ({ ...p, isBundle: false }));
    }
    if (catalogMode === 'BUNDLES') {
      return filteredBundles.map(b => ({ ...b, isBundle: true }));
    }
    // ALL: tampilkan paket bundling di urutan teratas, diikuti part satuan
    return [
      ...filteredBundles.map(b => ({ ...b, isBundle: true })),
      ...filteredProducts.map(p => ({ ...p, isBundle: false }))
    ];
  }, [catalogMode, filteredProducts, filteredBundles]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedEngine, selectedCategory, selectedSound, sortBy, catalogMode]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(displayedItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return displayedItems.slice(startIndex, startIndex + pageSize);
  }, [displayedItems, currentPage, pageSize]);

  // Auto-open detail if initialSku is provided
  useEffect(() => {
    if (initialSku) {
      if (activeProducts.length > 0) {
        const matched = activeProducts.find(p => 
          (p.sku || '').toLowerCase() === initialSku.toLowerCase() ||
          (p.code || '').toLowerCase() === initialSku.toLowerCase()
        );
        if (matched) {
          setDetailProduct(matched);
          return;
        }
      }
      if (activeBundles.length > 0) {
        const matchedB = activeBundles.find(b => 
          (b.code || '').toLowerCase() === initialSku.toLowerCase()
        );
        if (matchedB) {
          setDetailBundle(matchedB);
        }
      }
    }
  }, [initialSku, activeProducts, activeBundles]);

  // WhatsApp Order Link Generator (Produk Satuan)
  const getWhatsAppOrderUrl = (prod) => {
    const price = Number(prod.selling_price ?? prod.price) || 0;
    const formattedPrice = `Rp ${price.toLocaleString('id-ID')}`;
    const text = `Halo Admin NDK Exhaust, saya ingin memesan & konsultasi produk ini dari Katalog Resmi:\n\n*${prod.name}*\n• SKU: ${prod.sku || prod.code || '-'}\n• Merk: ${prod.brand || 'NDK Exhaust'}\n• Tipe Mesin: ${prod.engine_type || prod.machineCategory || '-'}\n• Mobil: ${prod.car_variant || '-'}\n• Karakter Suara: ${prod.spec_sound || '-'}\n• Harga Resmi: ${formattedPrice}\n\nApakah stok unit ini siap kirim? Terima kasih!`;
    
    return `https://wa.me/6289502240040?text=${encodeURIComponent(text)}`;
  };

  // WhatsApp Order Link Generator (Paket Bundling)
  const getWhatsAppBundleOrderUrl = (bndl) => {
    const price = Number(bndl.selling_price ?? bndl.price) || 0;
    const formattedPrice = `Rp ${price.toLocaleString('id-ID')}`;
    const rawItems = bndl.rawIsi || (Array.isArray(bndl.items) ? bndl.items.map(i => `${i.qty || 1}x ${i.productName || i.name}`).join(' + ') : '-');
    const text = `Halo Admin NDK Exhaust, saya ingin memesan & konsultasi Paket Bundling ini dari Katalog Resmi:\n\n*${bndl.name}*\n• Kode Paket: ${bndl.code || '-'}\n• Merk: ${bndl.brand || 'NDK Exhaust'}\n• Tipe Mesin: ${bndl.engine_type || '-'}\n• Kompatibel Mobil: ${bndl.car_variant || '-'}\n• Rincian Isi Paket: ${rawItems}\n• Harga Resmi Paket: ${formattedPrice}\n\nApakah paket ini siap kirim / bisa dijadwalkan pasang? Terima kasih!`;
    
    return `https://wa.me/6289502240040?text=${encodeURIComponent(text)}`;
  };

  const handleShareProduct = (prod) => {
    const url = `${window.location.origin}/catalog?sku=${encodeURIComponent(prod.sku || prod.code)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedSku(true);
      setTimeout(() => setCopiedSku(false), 2000);
    }
  };

  const quickSearchTags = ['Innova 2GD', 'Fortuner', 'Brio', 'Downpipe', 'Titanium', '1KD', '4N15 Pajero'];

  const scrollToProducts = () => {
    if (productListRef.current) {
      productListRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-[#D32F2F] selection:text-white">
      
      {/* ========================================================================= */}
      {/* 1. MAIN NAVBAR (DOMINAN PUTIH DENGAN AKSEN MERAH & HITAM)                 */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
          
          {/* Brand Logos: NDK Exhaust & RGN Performance */}
          <div 
            onClick={navigateToLanding}
            className="flex items-center gap-3 cursor-pointer flex-shrink-0"
            title="Kembali ke Halaman Utama (Landing Page)"
          >
            <img 
              src="/logos/ndk-black.png" 
              alt="NDK Exhaust" 
              className="h-8 sm:h-10 w-auto object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <img 
              src="/logos/rgn-black.png" 
              alt="RGN Performance" 
              className="h-6 sm:h-8 w-auto object-contain hidden sm:block"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          {/* Center Navigation Menu Items */}
          <nav className="hidden md:flex items-center gap-2 text-xs font-bold tracking-wide text-slate-700">
            <button 
              onClick={scrollToProducts}
              className="px-3 py-1.5 rounded-md bg-[#D32F2F] text-white font-bold cursor-pointer"
            >
              Katalog Produk
            </button>
            <button 
              onClick={() => scrollToSection('marketplace-section')}
              className="px-3 py-1.5 rounded-md hover:bg-slate-100 text-slate-800 transition cursor-pointer"
            >
              Marketplace
            </button>
            <button 
              onClick={() => scrollToSection('about-section')}
              className="px-3 py-1.5 rounded-md hover:bg-slate-100 text-slate-800 transition cursor-pointer"
            >
              Kontak & Lokasi
            </button>
          </nav>

          {/* Right Section: Compact Search Bar & Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            
            {/* Quick Header Search (Desktop) */}
            <div className="relative hidden md:block w-48 lg:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari knalpot, mobil..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#D32F2F] focus:bg-white transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick WhatsApp Action Button */}
            <a
              href="https://wa.me/6289502240040?text=Halo%20Admin%20NDK%20Exhaust,%20saya%20ingin%20konsultasi%20pilihan%20knalpot%20mobil%20saya"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 flex items-center justify-center transition cursor-pointer"
              title="Chat WhatsApp CS Resmi (089502240040)"
            >
              <MessageCircle className="w-4 h-4" />
            </a>

            {/* Location Button */}
            <a
              href="https://g.page/ndkexhaust"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-[#D32F2F] flex items-center justify-center transition cursor-pointer"
              title="Lokasi Bengkel Google Maps"
            >
              <MapPin className="w-4 h-4" />
            </a>

          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO & SEARCH BAR SECTION                                              */}
      {/* ========================================================================= */}
      <section className="bg-white py-8 sm:py-10 px-4 sm:px-6 text-center border-b border-slate-200">
        <div className="max-w-4xl mx-auto space-y-3">
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
            Katalog Resmi <span className="text-[#D32F2F]">NDK Exhaust</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Tersedia pilihan Bolt-on, Downpipe, Frontpipe, Centerpipe, dan Muffler berbahan Stainless Steel & Titanium untuk semua varian mobil.
          </p>

          {/* Search Box with FILTER Button */}
          <div className="max-w-2xl mx-auto pt-3">
            <div className="flex items-stretch gap-2 bg-white p-1.5 rounded-xl border border-slate-300 shadow-xs focus-within:ring-2 focus-within:ring-[#D32F2F]/20 focus-within:border-[#D32F2F] transition">
              <div className="relative flex-1 flex items-center">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari tipe knalpot, mobil (Innova 2GD, Brio, Fortuner, Pajero), SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 sm:pl-11 pr-7 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 text-slate-400 hover:text-slate-700 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={scrollToProducts}
                className="bg-[#18181B] hover:bg-black text-white px-4 sm:px-5 py-2.5 rounded-lg text-xs font-extrabold flex items-center gap-2 uppercase tracking-wider transition cursor-pointer shadow-xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>FILTER</span>
              </button>
            </div>

            {/* Popular Search Tags */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3 text-[11px]">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">POPULER:</span>
              {quickSearchTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSearchTerm(tag)}
                  className="px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. ENGINE CHIPS & SUB-FILTER BAR (STICKY)                                 */}
      {/* ========================================================================= */}
      <section ref={productListRef} className="bg-white border-b border-slate-200 sticky top-16 sm:top-18 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 space-y-2.5">
          
          {/* Horizontal Slider Engine Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-extrabold">
            {availableEngineChips.map(eng => {
              const isSelected = selectedEngine === eng.id;
              const count = getEngineCount(eng.id);

              return (
                <button
                  key={eng.id}
                  onClick={() => setSelectedEngine(eng.id)}
                  className={`px-3.5 py-2 rounded-md whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer flex-shrink-0 text-xs ${
                    isSelected
                      ? 'bg-[#18181B] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {eng.icon && <Layers className="w-3.5 h-3.5" />}
                  <span>{eng.label}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sub-Filters: Components, Sounds & Sorting */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs border-t border-slate-100">
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-3 pr-8 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#D32F2F] cursor-pointer"
                >
                  <option value="ALL">Semua Komponen</option>
                  {categoryList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Sound Character Filter */}
              <div className="relative">
                <select
                  value={selectedSound}
                  onChange={(e) => setSelectedSound(e.target.value)}
                  className="pl-3 pr-8 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#D32F2F] cursor-pointer"
                >
                  <option value="ALL">Semua Karakter Suara</option>
                  {soundList.map(snd => (
                    <option key={snd} value={snd}>{snd}</option>
                  ))}
                </select>
              </div>

              {/* Reset Filter Button */}
              {(selectedEngine !== 'ALL' || selectedCategory !== 'ALL' || selectedSound !== 'ALL' || searchTerm) && (
                <button
                  onClick={() => {
                    setSelectedEngine('ALL');
                    setSelectedCategory('ALL');
                    setSelectedSound('ALL');
                    setSearchTerm('');
                  }}
                  className="px-2.5 py-1 text-[#D32F2F] hover:bg-rose-50 rounded font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>

            {/* Sort Filter (URUTKAN) */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">URUTKAN:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-3 pr-7 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#D32F2F] cursor-pointer"
              >
                <option value="POPULAR">Paling Populer</option>
                <option value="PRICE_LOW">Harga: Terendah</option>
                <option value="PRICE_HIGH">Harga: Tertinggi</option>
                <option value="NAME_ASC">Nama Produk A - Z</option>
              </select>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PRODUCT LISTING GRID (DOMINAN PUTIH, AKSEN HITAM & MERAH)              */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
        
        {/* TAB GROUPING: SEMUA | PART SATUAN | PAKET BUNDLING */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-200">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1">
            <button
              onClick={() => setCatalogMode('ALL')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                catalogMode === 'ALL'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Semua</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${catalogMode === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {activeProducts.length + activeBundles.length}
              </span>
            </button>

            <button
              onClick={() => setCatalogMode('PRODUCTS')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                catalogMode === 'PRODUCTS'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Part Satuan</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${catalogMode === 'PRODUCTS' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {activeProducts.length}
              </span>
            </button>

            <button
              onClick={() => setCatalogMode('BUNDLES')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                catalogMode === 'BUNDLES'
                  ? 'bg-[#D32F2F] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Paket Bundling</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${catalogMode === 'BUNDLES' ? 'bg-white text-[#D32F2F]' : 'bg-rose-100 text-[#D32F2F]'}`}>
                {activeBundles.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-[#D32F2F] animate-pulse" />
            <span className="text-[11px] sm:text-xs">Stok Siap Kirim Hari Ini</span>
          </div>
        </div>

        {/* Section Header: Title & Count */}
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-tight">
              {catalogMode === 'BUNDLES' ? 'DAFTAR PAKET BUNDLING' : catalogMode === 'PRODUCTS' ? 'DAFTAR PART SATUAN' : 'DAFTAR PRODUK & BUNDLE'}
            </h2>
            <span className="text-xs sm:text-sm font-bold text-[#D32F2F]">
              ({paginatedItems.length} dari {displayedItems.length} Item)
            </span>
          </div>
        </div>

        {/* Empty State */}
        {displayedItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-16 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Package className="w-7 h-7" />
            </div>
            <h4 className="text-base font-black text-slate-900">
              {catalogMode === 'BUNDLES' ? 'Paket Bundling Tidak Ditemukan' : 'Spesifikasi Knalpot Tidak Ditemukan'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Tidak ada item yang cocok dengan kata kunci "{searchTerm || selectedEngine}". Hubungi CS WhatsApp untuk ketersediaan atau pemesanan paket custom.
            </p>
            <button
              onClick={() => {
                setSelectedEngine('ALL');
                setSelectedCategory('ALL');
                setSelectedSound('ALL');
                setSearchTerm('');
                setCatalogMode('ALL');
              }}
              className="mt-2 px-5 py-2.5 bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Tampilkan Semua
            </button>
          </div>
        ) : (
          /* Grid 4-Columns Desktop / 2-Columns Mobile */
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {paginatedItems.map(item => {
              const isBundle = item.isBundle;
              const price = Number(item.selling_price ?? item.price) || 0;
              const formattedPrice = `Rp ${price.toLocaleString('id-ID')}`;
              const engineDisplay = item.engine_type || item.machineCategory || '';
              const carDisplay = item.car_variant || item.carVariant || '';

              // JIKA ITEM ADALAH PAKET BUNDLING
              if (isBundle) {
                const bundleDisplayName = formatBundleDisplayName(item);

                return (
                  <div 
                    key={`bndl-${item.id || item.code}`}
                    className="bg-white rounded-xl border-2 border-rose-200/70 hover:border-[#D32F2F] shadow-2xs hover:shadow-md transition duration-200 flex flex-col overflow-hidden group"
                  >
                    {/* Photo / Graphic Area */}
                    <div 
                      onClick={() => setDetailBundle(item)}
                      className="relative aspect-4/3 bg-rose-50/40 overflow-hidden cursor-pointer flex items-center justify-center border-b border-rose-100"
                    >
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-[#D32F2F] gap-1.5 p-2 text-center">
                          <div className="w-10 h-10 rounded-xl bg-white text-[#D32F2F] shadow-xs flex items-center justify-center border border-rose-100">
                            <Layers className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider">
                            {item.brand || 'NDK EXHAUST'}
                          </span>
                        </div>
                      )}

                      {/* Top Left Badge: Engine Type (Black) */}
                      {engineDisplay && (
                        <div className="absolute top-2 left-2">
                          <span className="px-1.5 py-0.5 rounded bg-[#18181B] text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
                            {engineDisplay}
                          </span>
                        </div>
                      )}

                      {/* Top Right Badge: PAKET BUNDLE */}
                      <div className="absolute top-2 right-2">
                        <span className="px-1.5 py-0.5 rounded bg-[#D32F2F] text-white text-[8px] sm:text-[9px] font-black tracking-wider uppercase shadow-xs flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5" />
                          <span>PAKET BUNDLE</span>
                        </span>
                      </div>
                    </div>

                    {/* Card Body Info */}
                    <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
                      <div className="space-y-1">
                        {/* Kode Bundle */}
                        {item.code && (
                          <div className="text-[10px] font-mono font-bold text-slate-400 truncate">
                            {item.code}
                          </div>
                        )}

                        {/* Bundle Name */}
                        <h3 
                          onClick={() => setDetailBundle(item)}
                          className="font-bold text-slate-950 text-xs sm:text-[13px] leading-snug group-hover:text-[#D32F2F] transition line-clamp-2 cursor-pointer pt-0.5"
                          title={bundleDisplayName}
                        >
                          {bundleDisplayName}
                        </h3>

                        {/* Compatible Car Variant */}
                        {carDisplay && carDisplay !== '-' && (
                          <div className="flex items-start gap-1 text-[10px] sm:text-[11px] text-slate-500 pt-0.5">
                            <Car className="w-3 h-3 text-[#D32F2F] flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{carDisplay}</span>
                          </div>
                        )}
                      </div>

                      {/* Price & Actions */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div>
                          <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">
                            HARGA RESMI PAKET
                          </span>
                          <div className="text-sm sm:text-base font-black text-slate-950 leading-none mt-0.5">
                            {formattedPrice}
                          </div>
                        </div>

                        {/* Action Buttons: DETAIL ISI & WA */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailBundle(item)}
                            className="py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-800 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3 h-3 text-slate-500" />
                            <span>DETAIL ISI</span>
                          </button>

                          <a
                            href={getWhatsAppBundleOrderUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-1.5 px-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-2xs active:scale-95 cursor-pointer text-center"
                          >
                            <MessageCircle className="w-3 h-3 text-white" />
                            <span>WA</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // JIKA ITEM ADALAH PRODUK SATUAN
              const soundDisplay = item.spec_sound || '';

              return (
                <div 
                  key={`prod-${item.id || item.sku || item.code}`}
                  className="bg-white rounded-xl border border-slate-200 hover:border-slate-400/80 shadow-2xs hover:shadow-md transition duration-200 flex flex-col overflow-hidden group"
                >
                  {/* Photo & Spec Badges Area */}
                  <div 
                    onClick={() => setDetailProduct(item)}
                    className="relative aspect-4/3 bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center border-b border-slate-100"
                  >
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 gap-1 p-2 text-center">
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">NDK Exhaust</span>
                      </div>
                    )}

                    {/* Top Left Badge: Engine Type (Black) */}
                    {engineDisplay && (
                      <div className="absolute top-2 left-2">
                        <span className="px-1.5 py-0.5 rounded bg-[#18181B] text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
                          {engineDisplay}
                        </span>
                      </div>
                    )}

                    {/* Top Left / Center Badge: Brand */}
                    {item.brand && (
                      <div className="absolute top-2 left-14">
                        <span className="px-1.5 py-0.5 rounded bg-white/90 backdrop-blur-xs text-slate-800 text-[8px] sm:text-[9px] font-bold border border-slate-200 shadow-2xs uppercase">
                          {item.brand}
                        </span>
                      </div>
                    )}

                    {/* Bottom Left Badge: Sound Character */}
                    {soundDisplay && (
                      <div className="absolute bottom-2 left-2">
                        <span className="px-1.5 py-0.5 rounded bg-black/85 text-slate-100 text-[9px] font-bold backdrop-blur-xs flex items-center gap-1 uppercase">
                          <Volume2 className="w-2.5 h-2.5 text-amber-400" />
                          <span>{soundDisplay}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body Info */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
                    <div className="space-y-1">
                      {/* SKU */}
                      {(item.sku || item.code) && (
                        <div className="text-[10px] font-mono font-bold text-slate-400 truncate">
                          {item.sku || item.code}
                        </div>
                      )}

                      {/* Product Title */}
                      <h3 
                        onClick={() => setDetailProduct(item)}
                        className="font-bold text-slate-950 text-xs sm:text-[13px] leading-snug group-hover:text-[#D32F2F] transition line-clamp-2 cursor-pointer pt-0.5"
                        title={item.name}
                      >
                        {item.name}
                      </h3>

                      {/* Compatible Car Variant */}
                      {carDisplay && (
                        <div className="flex items-start gap-1 text-[10px] sm:text-[11px] text-slate-500 pt-0.5">
                          <Car className="w-3 h-3 text-[#D32F2F] flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{carDisplay}</span>
                        </div>
                      )}
                    </div>

                    {/* Price & Actions */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">
                          HARGA RESMI
                        </span>
                        <div className="text-sm sm:text-base font-black text-slate-950 leading-none mt-0.5">
                          {formattedPrice}
                        </div>
                      </div>

                      {/* Action Buttons: SPEK & WA */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailProduct(item)}
                          className="py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-800 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>SPEK</span>
                        </button>

                        <a
                          href={getWhatsAppOrderUrl(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-1.5 px-2 bg-[#18181B] hover:bg-black text-white rounded text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-2xs active:scale-95 cursor-pointer text-center"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-400" />
                          <span>WA</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {displayedItems.length > pageSize && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 border-t border-slate-200 pt-4">
            <div>
              Menampilkan <strong className="text-slate-900">{((currentPage - 1) * pageSize) + 1}</strong> - <strong className="text-slate-900">{Math.min(currentPage * pageSize, displayedItems.length)}</strong> dari <strong className="text-slate-900">{displayedItems.length}</strong> Item
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded font-bold transition cursor-pointer ${
                    currentPage === page
                      ? 'bg-[#18181B] text-white'
                      : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* 5. OFFICIAL ORDER GATEWAY ("Pesan Melalui Platform Favorit Anda")          */}
      {/* ========================================================================= */}
      <section id="marketplace-section" className="bg-[#F8F9FA] border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8 text-center">
          
          <div className="space-y-2">
            <span className="text-[#D32F2F] text-[11px] font-black uppercase tracking-widest block">
              OFFICIAL ORDER GATEWAY
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Pesan Melalui Platform Favorit Anda
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
              Dapatkan kemudahan fasilitas Cicilan 0%, Bebas Ongkir se-Indonesia, dan Garansi Produk 100% Original NDK Exhaust Official Store.
            </p>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            
            {/* 1. Tokopedia */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-emerald-300 shadow-2xs hover:shadow-sm transition duration-200 flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 text-sm">Tokopedia Official</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Official Store terverifikasi, promo cashback marketplace, & cicilan kartu kredit.
                  </p>
                </div>
              </div>
              <a
                href="https://www.tokopedia.com/ndk-exhaust-id"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-slate-800 hover:text-emerald-700 flex items-center justify-between pt-2 border-t border-slate-100 transition"
              >
                <span>Buka Tokopedia</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </a>
            </div>

            {/* 2. Shopee */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-orange-300 shadow-2xs hover:shadow-sm transition duration-200 flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 text-sm">Shopee Official Mall</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Voucher gratis ongkir XTRA, COD di seluruh Indonesia, dan garansi tiba tepat waktu.
                  </p>
                </div>
              </div>
              <a
                href="https://shopee.co.id/ndk_exhaust_official"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-slate-800 hover:text-orange-700 flex items-center justify-between pt-2 border-t border-slate-100 transition"
              >
                <span>Buka Shopee</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </a>
            </div>

            {/* 3. Konsultasi CS WhatsApp */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-rose-300 shadow-2xs hover:shadow-sm transition duration-200 flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#D32F2F] flex items-center justify-center border border-rose-100">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 text-sm">Konsultasi CS WhatsApp</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Konsultasi kecocokan spesifikasi mesin, konfigurasi suara, dan booking pasang workshop.
                  </p>
                </div>
              </div>
              <a
                href="https://wa.me/6289502240040?text=Halo%20Admin%20NDK%20Exhaust,%20saya%20ingin%20konsultasi%20pemilihan%20knalpot%20dan%20cara%20pemesanan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#D32F2F] hover:underline flex items-center justify-between pt-2 border-t border-slate-100 transition"
              >
                <span>Hubungi Sekarang (+62 895-0224-0040)</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </a>
            </div>

            {/* 4. Workshop & Fitting Center */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-slate-400 shadow-2xs hover:shadow-sm transition duration-200 flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 text-sm">Workshop & Fitting Center</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Instalasi presisi bolt-on di lokasi bengkel mitra NDK Exhaust dengan teknisi tersertifikasi.
                  </p>
                </div>
              </div>
              <a
                href="https://g.page/ndkexhaust"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-slate-800 hover:text-black flex items-center justify-between pt-2 border-t border-slate-100 transition"
              >
                <span>Jadwalkan Pasang</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CLEAN FOOTER (DOMINAN PUTIH, AKSEN HITAM & MERAH)                      */}
      {/* ========================================================================= */}
      <footer id="about-section" className="bg-white text-slate-600 text-xs pt-12 pb-8 border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Column 1: Brand & Description */}
            <div className="space-y-4">
              <div 
                className="flex items-center gap-3 cursor-pointer"
                onClick={navigateToLanding}
                title="Kembali ke Halaman Utama (Landing Page)"
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

            {/* Column 2: MARKETPLACE */}
            <div className="space-y-3">
              <h4 className="text-slate-950 text-xs font-black uppercase tracking-widest">
                MARKETPLACE
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
                    <span>Tokopedia Official</span>
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
                    <span>Shopee Mall</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="https://wa.me/6289502240040?text=Halo%20Admin%20NDK%20Exhaust,%20saya%20ingin%20konsultasi%20dan%20order%20knalpot" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[#D32F2F] transition flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D32F2F]" />
                    <span>WhatsApp Konsultasi</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: MEDIA & VIDEO */}
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
                  <a 
                    href="https://warehousezero.web.app/catalog" 
                    className="hover:text-[#D32F2F] transition flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D32F2F]" />
                    <span>Official Web Catalog</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: WORKSHOP RESMI */}
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs font-extrabold rounded transition cursor-pointer shadow-xs uppercase tracking-wider"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>BUKA GOOGLE MAPS</span>
                </a>
              </div>
            </div>

          </div>

          {/* Copyright Bar */}
          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-400">
            <p>
              © 2026 NDK Exhaust & RGN Performance. All Rights Reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="hover:text-slate-700 transition cursor-pointer">Syarat Garansi</span>
              <span>•</span>
              <span className="hover:text-slate-700 transition cursor-pointer">Kebijakan Privasi</span>
              <span>•</span>
              <span className="hover:text-slate-700 transition cursor-pointer">Panduan Pemasangan</span>
            </div>
          </div>

        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 7. PRODUCT DETAIL MODAL (CLEAN FULL SPECIFICATIONS)                       */}
      {/* ========================================================================= */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 my-auto animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase bg-[#18181B] text-white">
                  {detailProduct.engine_type || detailProduct.machineCategory || 'UNIVERSAL'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {detailProduct.sku || detailProduct.code || '-'}
                </span>
              </div>
              <button
                onClick={() => setDetailProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Product Photo Frame */}
              <div className="aspect-16/9 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center relative">
                {detailProduct.imageUrl ? (
                  <img 
                    src={detailProduct.imageUrl} 
                    alt={detailProduct.name} 
                    className="w-full h-full object-contain bg-white" 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
                    <ImageIcon className="w-10 h-10 text-slate-300" />
                    <span className="text-xs font-bold text-slate-400 uppercase">NDK Exhaust High Performance</span>
                  </div>
                )}

                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2 py-0.5 rounded text-xs font-black bg-[#D32F2F] text-white shadow-2xs uppercase">
                    {detailProduct.brand || 'NDK EXHAUST'}
                  </span>
                </div>
              </div>

              {/* Title & Official Price */}
              <div className="space-y-1">
                <h3 className="text-base sm:text-xl font-black text-slate-950 leading-snug">
                  {detailProduct.name}
                </h3>
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Harga Resmi Eceran</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-950">
                      Rp {(Number(detailProduct.selling_price ?? detailProduct.price) || 0).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleShareProduct(detailProduct)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {copiedSku ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Link Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Bagikan Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Structured Technical Specifications Table */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-[#D32F2F]" />
                  <span>Spesifikasi & Kompatibilitas Mobil</span>
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px] block font-semibold uppercase">Tipe Mesin</span>
                    <strong className="text-slate-900 text-xs font-bold truncate block">{detailProduct.engine_type || detailProduct.machineCategory || '-'}</strong>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px] block font-semibold uppercase">Varian Mobil</span>
                    <strong className="text-slate-900 text-xs font-bold truncate block">{detailProduct.car_variant || '-'}</strong>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px] block font-semibold uppercase">Material</span>
                    <strong className="text-slate-900 text-xs font-bold truncate block">{detailProduct.material_finish || '-'}</strong>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px] block font-semibold uppercase">Karakter Suara</span>
                    <strong className="text-slate-900 text-xs font-bold truncate block">{detailProduct.spec_sound || '-'}</strong>
                  </div>

                  {detailProduct.spec_resonator !== undefined && (
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[10px] block font-semibold uppercase">Tabung Resonator</span>
                      <strong className="text-slate-900 text-xs font-bold truncate block">{detailProduct.spec_resonator === false ? 'Non-Resonator' : 'Ada Resonator'}</strong>
                    </div>
                  )}

                  {detailProduct.spec_pipe_size && (
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[10px] block font-semibold uppercase">Inlet / Outlet</span>
                      <strong className="text-slate-900 text-xs font-bold truncate block">{detailProduct.spec_pipe_size}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Multiline Description Section */}
              {detailProduct.description && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                  <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                    Deskripsi
                  </h4>
                  <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {detailProduct.description}
                  </div>
                </div>
              )}

              {/* Direct Order Call To Action */}
              <div className="pt-2">
                <a
                  href={getWhatsAppOrderUrl(detailProduct)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-[#18181B] hover:bg-black text-white rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 shadow-md active:scale-98 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Pesan Sekarang via WhatsApp (+62 895-0224-0040)</span>
                </a>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. BUNDLE DETAIL MODAL                                                    */}
      {/* ========================================================================= */}
      {detailBundle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 my-auto animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase bg-[#D32F2F] text-white flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  <span>PAKET BUNDLING</span>
                </span>
                {detailBundle.engine_type && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase bg-[#18181B] text-white">
                    {detailBundle.engine_type}
                  </span>
                )}
                <span className="text-xs font-mono font-bold text-slate-500">
                  {detailBundle.code || '-'}
                </span>
              </div>
              <button
                onClick={() => setDetailBundle(null)}
                className="p-1 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Product Photo or Bundle Graphic Frame */}
              <div className="aspect-16/9 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center relative">
                {detailBundle.imageUrl ? (
                  <img 
                    src={detailBundle.imageUrl} 
                    alt={detailBundle.name} 
                    className="w-full h-full object-contain bg-white" 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 text-[#D32F2F] flex items-center justify-center border border-rose-200/60">
                      <Layers className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      {detailBundle.brand || 'NDK EXHAUST'} • PAKET BUNDLE RESMI
                    </span>
                  </div>
                )}

                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2 py-0.5 rounded text-xs font-black bg-[#18181B] text-white shadow-2xs uppercase">
                    {detailBundle.brand || 'NDK EXHAUST'}
                  </span>
                </div>
              </div>

              {/* Title & Official Price */}
              <div className="space-y-1">
                <h3 className="text-base sm:text-xl font-black text-slate-950 leading-snug">
                  {formatBundleDisplayName(detailBundle)}
                </h3>
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Harga Resmi Paket</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-950">
                      Rp {(Number(detailBundle.selling_price ?? detailBundle.price) || 0).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleShareProduct(detailBundle)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {copiedSku ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Link Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Bagikan Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Specifications: Mesin & Mobil */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">Tipe Mesin</span>
                  <strong className="text-slate-900 text-xs font-bold truncate block">{detailBundle.engine_type || '-'}</strong>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">Varian Mobil</span>
                  <strong className="text-slate-900 text-xs font-bold truncate block">{detailBundle.car_variant || '-'}</strong>
                </div>
              </div>

              {/* RINCIAN KOMPONEN ISI PAKET */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#D32F2F]" />
                  <span>Rincian Komponen Isi Paket</span>
                </h4>

                {Array.isArray(detailBundle.items) && detailBundle.items.length > 0 ? (
                  <div className="space-y-2">
                    {detailBundle.items.map((bItem, idx) => {
                      const matchedProd = products.find(p => 
                        (bItem.productId && p.id === bItem.productId) || 
                        (bItem.sku && p.sku === bItem.sku)
                      );
                      const itemEngine = bItem.engine_type || bItem.engine || matchedProd?.engine_type || matchedProd?.machineCategory || detailBundle.engine_type || '';
                      const itemDetail = bItem.detail || bItem.cleanName || bItem.rawName;
                      const mainName = matchedProd?.name || bItem.productName || bItem.cleanName || bItem.rawName || 'Komponen Produk';
                      const hasDifferentDetail = itemDetail && itemDetail !== mainName;
                      const displayEngine = (itemEngine && itemEngine !== '-' && itemEngine.toLowerCase() !== 'all') ? itemEngine : '';

                      return (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs gap-2 text-xs">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-rose-50 text-[#D32F2F] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                              {bItem.qty || 1}x
                            </span>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 text-xs sm:text-[13px] break-words">{mainName}</span>
                                {displayEngine && (
                                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-white text-[9px] font-black uppercase tracking-wider shadow-2xs whitespace-nowrap">
                                    {displayEngine}
                                  </span>
                                )}
                                {(matchedProd?.brand || bItem.brand) && (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-[#D32F2F] border border-rose-200 text-[9px] font-bold uppercase whitespace-nowrap">
                                    {matchedProd?.brand || bItem.brand}
                                  </span>
                                )}
                              </div>
                              {hasDifferentDetail && (
                                <div className="text-[11px] text-slate-600 font-medium break-words">
                                  Detail Isi: <span className="text-slate-800 font-semibold">{itemDetail}</span>
                                </div>
                              )}
                              {(matchedProd?.car_variant || bItem.car_variant) && (
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 flex-wrap">
                                  <Car className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{matchedProd?.car_variant || bItem.car_variant}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {(matchedProd?.sku || bItem.sku) && (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200/60 shrink-0 self-start sm:self-center">
                              {matchedProd?.sku || bItem.sku}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : detailBundle.rawIsi ? (
                  <div className="space-y-1.5">
                    {detailBundle.rawIsi.split('+').map((itemStr, idx) => {
                      const cleanItemStr = itemStr.trim();
                      const fallbackEngine = (detailBundle.engine_type && detailBundle.engine_type !== '-' && detailBundle.engine_type.toLowerCase() !== 'all') ? detailBundle.engine_type : '';
                      return (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-rose-50 text-[#D32F2F] font-bold text-[10px] flex items-center justify-center">
                              ✓
                            </span>
                            <span className="font-bold text-slate-900">{cleanItemStr}</span>
                          </div>
                          {fallbackEngine && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-white text-[9px] font-black uppercase tracking-wider">
                              {fallbackEngine}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Rincian komponen belum dicantumkan.</p>
                )}
              </div>

              {/* Keterangan / Deskripsi Publik Paket */}
              {(detailBundle.description || detailBundle.keterangan) && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                  <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#D32F2F]" />
                    <span>Deskripsi / Keterangan Paket</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {detailBundle.description || detailBundle.keterangan}
                  </p>
                </div>
              )}

              {/* Direct Order Call To Action */}
              <div className="pt-2">
                <a
                  href={getWhatsAppBundleOrderUrl(detailBundle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 shadow-md active:scale-98 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span>Pesan Paket via WhatsApp (+62 895-0224-0040)</span>
                </a>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
