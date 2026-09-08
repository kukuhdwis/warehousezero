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
  FileText,
  Sun,
  Moon,
  LogIn,
  BookOpen
} from 'lucide-react';
import {
  TokopediaIcon,
  ShopeeIcon,
  WhatsAppIcon,
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon
} from './SocialIcons';
import { matchesSearch } from '../utils/searchUtils';
import { setSEO } from '../utils/seo';
import { toggleThemeWithClipPath } from '../utils/themeAnimation';

export const formatBundleDisplayName = (b) => {
  if (!b) return '';
  const mainEng = (b.engine_type || b.machineCategory || '').trim();
  const cleanEng = (mainEng && mainEng !== '-' && mainEng.toLowerCase() !== 'all') ? mainEng : '';
  if (cleanEng && !b.name?.toLowerCase().includes(cleanEng.toLowerCase())) {
    return `${b.name} (${cleanEng})`;
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
  // Dark / Light mode synchronized with LandingPage & Dashboard
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('ndk_theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return true; // Default dark for motorsport identity
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
    // Preload logos for instant zero-lag theme transitions
    ['/logos/ndk-white.png', '/logos/ndk-black.png', '/logos/rgn-white.png', '/logos/rgn-black.png'].forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

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

  // Active public products (exclude soft deleted INACTIVE)
  const activeProducts = useMemo(() => {
    return (products || []).filter(p => p.status !== 'INACTIVE');
  }, [products]);

  // Active public bundles (exclude soft deleted INACTIVE)
  const activeBundles = useMemo(() => {
    return (bundles || []).filter(b => b.status !== 'INACTIVE');
  }, [bundles]);

  // Dynamic SEO & Google Search Structured Data (Schema.org)
  useEffect(() => {
    if (detailBundle) {
      const price = Number(detailBundle.selling_price || detailBundle.price) || 0;
      setSEO({
        title: `${detailBundle.name} - Paket Bundling Knalpot | NDK Exhaust`,
        description: `Beli paket bundling ${detailBundle.name} ${detailBundle.brand || 'NDK Exhaust'}. Material stainless steel presisi. Harga resmi: Rp ${price.toLocaleString('id-ID')}. Kompatibel: ${detailBundle.car_variant || 'Semua Mobil'}.`,
        canonical: `https://warehousezero.web.app/catalog?bundle=${encodeURIComponent(detailBundle.id || detailBundle.sku || '')}`,
        image: detailBundle.imageUrl || 'https://warehousezero.web.app/logos/ndk-black.png',
        type: 'product',
        schema: {
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": detailBundle.name,
          "image": detailBundle.imageUrl || "https://warehousezero.web.app/logos/ndk-black.png",
          "description": `Paket knalpot mobil ${detailBundle.name} presisi dari NDK Exhaust & RGN Performance Purbalingga.`,
          "sku": detailBundle.sku || detailBundle.id,
          "brand": {
            "@type": "Brand",
            "name": detailBundle.brand || "NDK Exhaust"
          },
          "offers": {
            "@type": "Offer",
            "priceCurrency": "IDR",
            "price": price,
            "availability": "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": "NDK Exhaust & RGN Performance Purbalingga"
            }
          }
        }
      });
    } else if (detailProduct) {
      const price = Number(detailProduct.selling_price || detailProduct.price) || 0;
      setSEO({
        title: `${detailProduct.name} - Knalpot Mobil | NDK Exhaust Official`,
        description: `Beli ${detailProduct.name} original ${detailProduct.brand || 'NDK Exhaust'}. Kategori: ${detailProduct.category_name || 'Knalpot'}. Harga Resmi: Rp ${price.toLocaleString('id-ID')}. Cocok untuk: ${detailProduct.car_variant || 'Mobil Harian & Racing'}.`,
        canonical: `https://warehousezero.web.app/catalog?sku=${encodeURIComponent(detailProduct.sku || '')}`,
        image: detailProduct.imageUrl || 'https://warehousezero.web.app/logos/ndk-black.png',
        type: 'product',
        schema: {
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": detailProduct.name,
          "image": detailProduct.imageUrl || "https://warehousezero.web.app/logos/ndk-black.png",
          "description": detailProduct.description || `Knalpot mobil ${detailProduct.name} berbahan stainless steel presisi dari NDK Exhaust Purbalingga.`,
          "sku": detailProduct.sku,
          "brand": {
            "@type": "Brand",
            "name": detailProduct.brand || "NDK Exhaust"
          },
          "offers": {
            "@type": "Offer",
            "priceCurrency": "IDR",
            "price": price,
            "availability": "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": "NDK Exhaust & RGN Performance Purbalingga"
            }
          }
        }
      });
    } else {
      setSEO({
        title: "E-Katalog Resmi NDK Exhaust & RGN Performance | Knalpot Mobil Presisi Purbalingga",
        description: "E-Katalog resmi knalpot mobil NDK Exhaust & RGN Performance. Downpipe, Frontpipe, Centerpipe, Resonator, dan Muffler stainless steel presisi mesin bensin & diesel.",
        keywords: "katalog knalpot, knalpot ndk, rgn performance, knalpot purbalingga, knalpot stainless steel, downpipe brio, downpipe innova diesel, muffler mobil",
        canonical: "https://warehousezero.web.app/catalog",
        image: "https://warehousezero.web.app/logos/ndk-black.png",
        type: "website",
        schema: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "E-Katalog Resmi NDK Exhaust & RGN Performance",
          "description": "Katalog knalpot mobil stainless steel presisi untuk mesin bensin dan diesel modern Indonesia.",
          "url": "https://warehousezero.web.app/catalog",
          "mainEntity": {
            "@type": "ItemList",
            "itemListElement": (activeProducts.slice(0, 10)).map((p, idx) => ({
              "@type": "ListItem",
              "position": idx + 1,
              "item": {
                "@type": "Product",
                "name": p.name,
                "sku": p.sku,
                "offers": {
                  "@type": "Offer",
                  "priceCurrency": "IDR",
                  "price": Number(p.selling_price || p.price) || 0
                }
              }
            }))
          }
        }
      });
    }
  }, [detailProduct, detailBundle, activeProducts]);

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
    <div className={`min-h-screen flex flex-col font-body antialiased transition-colors duration-300 selection:bg-ember selection:text-white ${isDark ? 'bg-ink text-paper' : 'bg-paper text-ink'
      }`}>

      {/* ========================================================================= */}
      {/* 1. MAIN NAVBAR (LANDING PAGE DESIGN TOKENS & TYPOGRAPHY)                  */}
      {/* ========================================================================= */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-300 ${isDark ? 'bg-ink/95 border-zinc-800' : 'bg-paper/95 border-zinc-200 shadow-xs'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo Lockup: NDK & RGN with Seamless Stacked Crossfade */}
          <div
            onClick={navigateToLanding}
            className="flex items-center gap-2.5 sm:gap-3 group py-1 cursor-pointer flex-shrink-0"
            title="Kembali ke Beranda"
          >
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
          </div>

          {/* Center Navigation Menu Items */}
          <nav className={`hidden md:flex items-center space-x-7 text-xs sm:text-sm font-display uppercase tracking-widest ${isDark ? 'text-zinc-300' : 'text-zinc-700'
            }`}>
            <button
              type="button"
              onClick={navigateToLanding}
              className="hover:text-ember transition-colors cursor-pointer"
            >
              Beranda
            </button>
            <button
              type="button"
              onClick={scrollToProducts}
              className="text-ember font-semibold hover:text-ember-deep transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Katalog</span>
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('marketplace-section')}
              className="hover:text-ember transition-colors cursor-pointer"
            >
              Marketplace
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('about-section')}
              className="hover:text-ember transition-colors cursor-pointer"
            >
              Tentang Kami
            </button>
          </nav>

          {/* Right Section: Compact Search Bar, Theme Toggle, Dashboard & WhatsApp */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">

            {/* Quick Header Search (Desktop) */}
            <div className="relative hidden lg:block w-44 xl:w-52">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
              <input
                type="text"
                placeholder="Cari knalpot, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-8 pr-7 py-1.5 rounded text-xs font-body transition focus:outline-none focus:ring-1 focus:ring-ember focus:border-ember ${isDark
                    ? 'bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500'
                    : 'bg-smoke border border-zinc-300 text-ink placeholder-zinc-400'
                  }`}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

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
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Dashboard / Portal Button */}
            <button
              type="button"
              onClick={onGoToLogin || navigateToLanding}
              title="Masuk ke Dashboard Sistem"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded text-xs font-display uppercase tracking-wider font-semibold border transition cursor-pointer ${isDark
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-ember hover:text-white'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-800 hover:border-ember hover:text-ember'
                }`}
            >
              <LogIn className="w-3.5 h-3.5 text-ember" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            {/* WhatsApp Consultation CTA Button */}
            <a
              className="hidden md:inline-flex bg-ember hover:bg-ember-deep text-white text-xs font-display font-semibold uppercase tracking-wider px-3.5 sm:px-4 py-2 rounded transition-all shadow-md items-center gap-1.5"
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

      {/* ========================================================================= */}
      {/* 2. HERO & SEARCH BAR SECTION                                              */}
      {/* ========================================================================= */}
      <section className={`py-10 sm:py-14 px-4 sm:px-6 text-center border-b transition-colors duration-300 ${isDark ? 'bg-ink border-zinc-800' : 'bg-paper border-zinc-200'
        }`}>
        <div className="max-w-4xl mx-auto space-y-3">
          <h1 className={`font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight uppercase leading-[1.08] ${isDark ? 'text-white' : 'text-ink'
            }`}>
            Katalog Resmi{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-ember via-rose-500 to-rose-400">
              NDK Exhaust
            </span>
          </h1>

          <p className={`font-body text-xs sm:text-base max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-zinc-400' : 'text-steel'
            }`}>
            Stainless steel presisi Purbalingga. Tersedia Downpipe, Frontpipe, Centerpipe, Resonator, dan Muffler untuk mesin bensin dan diesel modern.
          </p>

          <div className="w-24 h-[2px] bg-ember mx-auto mt-4" />

          {/* Search Box with FILTER Button */}
          <div className="max-w-2xl mx-auto pt-4">
            <div className={`flex items-stretch gap-2 p-1.5 rounded-xl border shadow-sm transition-all focus-within:ring-2 focus-within:ring-ember/20 focus-within:border-ember ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-smoke border-zinc-300'
              }`}>
              <div className="relative flex-1 flex items-center">
                <Search className={`w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 pointer-events-none ${isDark ? 'text-zinc-500' : 'text-zinc-400'
                  }`} />
                <input
                  type="text"
                  placeholder="Cari tipe knalpot, mobil (Innova 2GD, Brio, Fortuner, Pajero), SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 sm:pl-11 pr-7 py-2 text-xs sm:text-sm font-body bg-transparent focus:outline-none ${isDark ? 'text-white placeholder-zinc-500' : 'text-ink placeholder-zinc-400'
                    }`}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className={`absolute right-2 p-1 ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'
                      }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={scrollToProducts}
                className="bg-ember hover:bg-ember-deep text-white px-4 sm:px-5 py-2.5 rounded-lg text-xs font-display font-semibold flex items-center gap-2 uppercase tracking-wider transition cursor-pointer shadow-md"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>FILTER</span>
              </button>
            </div>

            {/* Popular Search Tags */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3 text-[11px]">
              <span className="font-mono font-bold uppercase tracking-widest text-[10px] text-zinc-500">POPULER:</span>
              {quickSearchTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSearchTerm(tag)}
                  className={`px-2.5 py-1 rounded text-xs font-display uppercase tracking-wider transition cursor-pointer border ${isDark
                      ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-ember'
                      : 'bg-smoke hover:bg-zinc-200 text-zinc-700 border-zinc-200 hover:border-ember'
                    }`}
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
      <section ref={productListRef} className={`border-b sticky top-16 z-30 shadow-xs transition-colors duration-300 backdrop-blur-md ${isDark ? 'bg-ink/95 border-zinc-800' : 'bg-paper/95 border-zinc-200'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-2.5">

          {/* Horizontal Slider Engine Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {availableEngineChips.map(eng => {
              const isSelected = selectedEngine === eng.id;
              const count = getEngineCount(eng.id);

              return (
                <button
                  key={eng.id}
                  type="button"
                  onClick={() => setSelectedEngine(eng.id)}
                  className={`px-3.5 py-2 rounded-lg whitespace-nowrap font-display uppercase tracking-wider font-semibold transition flex items-center gap-1.5 cursor-pointer flex-shrink-0 text-xs ${isSelected
                      ? 'bg-ember text-white shadow-md'
                      : (isDark ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700' : 'bg-smoke text-zinc-700 hover:bg-zinc-200 border border-zinc-200')
                    }`}
                >
                  {eng.icon && <Layers className="w-3.5 h-3.5" />}
                  <span>{eng.label}</span>
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : (isDark ? 'text-zinc-500' : 'text-zinc-400')}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sub-Filters: Components, Sounds & Sorting */}
          <div className={`flex flex-wrap items-center justify-between gap-2.5 pt-1.5 text-xs border-t ${isDark ? 'border-zinc-850' : 'border-zinc-100'
            }`}>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`pl-3 pr-8 py-1.5 rounded-lg text-xs font-display uppercase tracking-wider font-semibold focus:outline-none focus:ring-1 focus:ring-ember cursor-pointer border ${isDark
                      ? 'bg-zinc-900 border-zinc-750 text-zinc-200'
                      : 'bg-smoke border-zinc-300 text-zinc-800'
                    }`}
                >
                  <option value="ALL">SEMUA KOMPONEN</option>
                  {categoryList.map(cat => (
                    <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Sound Character Filter */}
              <div className="relative">
                <select
                  value={selectedSound}
                  onChange={(e) => setSelectedSound(e.target.value)}
                  className={`pl-3 pr-8 py-1.5 rounded-lg text-xs font-display uppercase tracking-wider font-semibold focus:outline-none focus:ring-1 focus:ring-ember cursor-pointer border ${isDark
                      ? 'bg-zinc-900 border-zinc-750 text-zinc-200'
                      : 'bg-smoke border-zinc-300 text-zinc-800'
                    }`}
                >
                  <option value="ALL">SEMUA KARAKTER SUARA</option>
                  {soundList.map(snd => (
                    <option key={snd} value={snd}>{snd.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Reset Filter Button */}
              {(selectedEngine !== 'ALL' || selectedCategory !== 'ALL' || selectedSound !== 'ALL' || searchTerm) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEngine('ALL');
                    setSelectedCategory('ALL');
                    setSelectedSound('ALL');
                    setSearchTerm('');
                  }}
                  className="px-2.5 py-1 text-ember hover:bg-ember/10 rounded font-display uppercase tracking-wider font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>RESET FILTER</span>
                </button>
              )}
            </div>

            {/* Sort Filter (URUTKAN) */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="font-mono font-bold uppercase tracking-widest text-[10px] text-zinc-500">URUTKAN:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`pl-3 pr-7 py-1.5 rounded-lg text-xs font-display uppercase tracking-wider font-semibold focus:outline-none focus:ring-1 focus:ring-ember cursor-pointer border ${isDark
                    ? 'bg-zinc-900 border-zinc-750 text-zinc-200'
                    : 'bg-smoke border-zinc-300 text-zinc-800'
                  }`}
              >
                <option value="POPULAR">PALING POPULER</option>
                <option value="PRICE_LOW">HARGA: TERENDAH</option>
                <option value="PRICE_HIGH">HARGA: TERTINGGI</option>
                <option value="NAME_ASC">NAMA A - Z</option>
              </select>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PRODUCT LISTING GRID (LANDING PAGE MOTORSPORT DESIGN TOKENS)           */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">

        {/* TAB GROUPING: SEMUA | PART SATUAN | PAKET BUNDLING */}
        <div className={`flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b transition-colors duration-300 ${isDark ? 'border-zinc-800' : 'border-zinc-200'
          }`}>
          <div className={`inline-flex p-1 rounded-xl gap-1.5 ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-smoke border border-zinc-200'
            }`}>
            <button
              type="button"
              onClick={() => setCatalogMode('ALL')}
              className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs font-display uppercase tracking-wider font-semibold transition cursor-pointer flex items-center gap-1.5 ${catalogMode === 'ALL'
                  ? 'bg-ember text-white shadow-md'
                  : (isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-ink')
                }`}
            >
              <span>Semua</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${catalogMode === 'ALL'
                  ? 'bg-black/30 text-white'
                  : (isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-700')
                }`}>
                {activeProducts.length + activeBundles.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCatalogMode('PRODUCTS')}
              className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs font-display uppercase tracking-wider font-semibold transition cursor-pointer flex items-center gap-1.5 ${catalogMode === 'PRODUCTS'
                  ? 'bg-ember text-white shadow-md'
                  : (isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-ink')
                }`}
            >
              <span>Part Satuan</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${catalogMode === 'PRODUCTS'
                  ? 'bg-black/30 text-white'
                  : (isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-700')
                }`}>
                {activeProducts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCatalogMode('BUNDLES')}
              className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs font-display uppercase tracking-wider font-semibold transition cursor-pointer flex items-center gap-1.5 ${catalogMode === 'BUNDLES'
                  ? 'bg-ember text-white shadow-md'
                  : (isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-ink')
                }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Paket Bundling</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${catalogMode === 'BUNDLES'
                  ? 'bg-black/30 text-white'
                  : (isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-700')
                }`}>
                {activeBundles.length}
              </span>
            </button>
          </div>

          {/* <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-ember animate-pulse" />
            <span className={`font-mono text-[10px] uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-steel'}`}>
              Stok Siap Kirim Hari Ini
            </span>
          </div> */}
        </div>

          {/* Section Header: Title & Count */}
          <div className="flex items-center justify-between gap-2 mb-5">
            <div className="flex items-baseline gap-2">
              <h2 className={`font-display text-base sm:text-lg font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-ink'
                }`}>
                {catalogMode === 'BUNDLES' ? 'DAFTAR PAKET BUNDLING' : catalogMode === 'PRODUCTS' ? 'DAFTAR PART SATUAN' : 'DAFTAR PRODUK & BUNDLE'}
              </h2>
              <span className="font-mono text-xs sm:text-sm font-bold text-ember">
                ({paginatedItems.length} dari {displayedItems.length} Item)
              </span>
            </div>
          </div>

          {/* Empty State */}
          {displayedItems.length === 0 ? (
            <div className={`rounded-2xl border p-10 sm:p-16 text-center space-y-3 shadow-xs ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-paper border-zinc-200'
              }`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-smoke text-zinc-500'
                }`}>
                <Package className="w-7 h-7" />
              </div>
              <h4 className={`font-display text-lg font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-ink'}`}>
                {catalogMode === 'BUNDLES' ? 'Paket Bundling Tidak Ditemukan' : 'Spesifikasi Knalpot Tidak Ditemukan'}
              </h4>
              <p className={`font-body text-xs max-w-md mx-auto leading-relaxed ${isDark ? 'text-zinc-400' : 'text-steel'}`}>
                Tidak ada item yang cocok dengan kata kunci "{searchTerm || selectedEngine}". Hubungi CS WhatsApp untuk ketersediaan atau pemesanan custom.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedEngine('ALL');
                  setSelectedCategory('ALL');
                  setSelectedSound('ALL');
                  setSearchTerm('');
                  setCatalogMode('ALL');
                }}
                className="mt-2 px-5 py-2.5 bg-ember hover:bg-ember-deep text-white rounded-lg text-xs font-display uppercase tracking-wider font-semibold transition shadow-md cursor-pointer"
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
                      className={`rounded-2xl border shadow-xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group ${isDark
                          ? 'bg-zinc-900/90 border-zinc-800 hover:border-ember'
                          : 'bg-paper border-zinc-200 hover:border-ember'
                        }`}
                    >
                      {/* Photo / Graphic Area */}
                      <div
                        onClick={() => setDetailBundle(item)}
                        className={`relative aspect-4/3 overflow-hidden cursor-pointer flex items-center justify-center border-b bg-zinc-950 ${isDark ? 'border-zinc-800' : 'border-zinc-200'
                          }`}
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-ember gap-1.5 p-2 text-center">
                            <div className={`w-10 h-10 rounded-xl shadow-xs flex items-center justify-center border ${isDark ? 'bg-zinc-900 text-rose-400 border-zinc-800' : 'bg-paper text-ember border-zinc-200'
                              }`}>
                              <Layers className="w-5 h-5" />
                            </div>
                            <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-800'}`}>
                              {item.brand || 'NDK EXHAUST'}
                            </span>
                          </div>
                        )}

                        {/* Top Left Badge: Engine Type */}
                        {engineDisplay && (
                          <div className="absolute top-2 left-2">
                            <span className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest font-semibold ${isDark ? 'bg-zinc-800 text-zinc-200 border border-zinc-700' : 'bg-zinc-900 text-white'
                              }`}>
                              {engineDisplay}
                            </span>
                          </div>
                        )}

                        {/* Top Right Badge: PAKET BUNDLE */}
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-0.5 rounded bg-ember text-white font-mono text-[8px] sm:text-[9px] font-bold tracking-widest uppercase shadow-sm flex items-center gap-1">
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
                            <div className={`text-[10px] font-mono font-bold uppercase tracking-widest truncate ${isDark ? 'text-zinc-500' : 'text-steel'}`}>
                              {item.code}
                            </div>
                          )}

                          {/* Bundle Name */}
                          <h3
                            onClick={() => setDetailBundle(item)}
                            className={`font-display font-bold text-xs sm:text-[13px] leading-snug transition-colors line-clamp-2 cursor-pointer pt-0.5 ${isDark ? 'text-zinc-100 group-hover:text-ember' : 'text-ink group-hover:text-ember'
                              }`}
                            title={bundleDisplayName}
                          >
                            {bundleDisplayName}
                          </h3>

                          {/* Compatible Car Variant */}
                          {carDisplay && carDisplay !== '-' && (
                            <div className={`flex items-start gap-1 font-body text-[10px] sm:text-[11px] pt-0.5 ${isDark ? 'text-zinc-400' : 'text-steel'}`}>
                              <Car className="w-3 h-3 text-ember shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{carDisplay}</span>
                            </div>
                          )}
                        </div>

                        {/* Price & Actions */}
                        <div className={`pt-2 border-t space-y-2 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                          <div>
                            <span className={`text-[9px] font-mono font-bold uppercase tracking-widest block ${isDark ? 'text-zinc-500' : 'text-steel'}`}>
                              HARGA RESMI PAKET
                            </span>
                            <div className="text-sm sm:text-base font-display font-bold text-ember leading-none mt-1">
                              {formattedPrice}
                            </div>
                          </div>

                          {/* Action Buttons: DETAIL ISI & WA */}
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailBundle(item)}
                              className={`py-1.5 px-2 rounded text-[11px] font-display uppercase tracking-wider font-semibold transition flex items-center justify-center gap-1 cursor-pointer border ${isDark
                                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700 hover:border-ember'
                                  : 'bg-smoke hover:bg-zinc-200 border-zinc-300 text-zinc-800 hover:border-ember'
                                }`}
                            >
                              <Eye className={`w-3 h-3 ${isDark ? 'text-zinc-400' : 'text-steel'}`} />
                              <span>DETAIL ISI</span>
                            </button>

                            <a
                              href={getWhatsAppBundleOrderUrl(item)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1.5 px-2 bg-ember hover:bg-ember-deep text-white rounded text-[11px] font-display uppercase tracking-wider font-semibold transition flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer text-center"
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
                    className={`rounded-2xl border shadow-xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group ${isDark
                        ? 'bg-zinc-900/90 border-zinc-800 hover:border-ember'
                        : 'bg-paper border-zinc-200 hover:border-ember'
                      }`}
                  >
                    {/* Photo & Spec Badges Area */}
                    <div
                      onClick={() => setDetailProduct(item)}
                      className={`relative aspect-4/3 overflow-hidden cursor-pointer flex items-center justify-center border-b bg-zinc-950 ${isDark ? 'border-zinc-800' : 'border-zinc-200'
                        }`}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-500 gap-1 p-2 text-center">
                          <ImageIcon className={`w-8 h-8 ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`} />
                          <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>NDK Exhaust</span>
                        </div>
                      )}

                      {/* Top Left Badge: Engine Type */}
                      {engineDisplay && (
                        <div className="absolute top-2 left-2">
                          <span className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest font-semibold ${isDark ? 'bg-zinc-800 text-zinc-200 border border-zinc-700' : 'bg-zinc-900 text-white'
                            }`}>
                            {engineDisplay}
                          </span>
                        </div>
                      )}

                      {/* Top Left / Center Badge: Brand */}
                      {item.brand && (
                        <div className="absolute top-2 left-14">
                          <span className={`px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-display uppercase tracking-wider font-semibold border shadow-xs ${isDark ? 'bg-zinc-900/90 text-zinc-200 border-zinc-700' : 'bg-paper/90 text-zinc-800 border-zinc-300'
                            }`}>
                            {item.brand}
                          </span>
                        </div>
                      )}

                      {/* Bottom Left Badge: Sound Character */}
                      {soundDisplay && (
                        <div className="absolute bottom-2 left-2">
                          <span className="px-2 py-0.5 rounded bg-black/85 text-zinc-200 border border-zinc-800 font-mono text-[9px] uppercase tracking-widest font-semibold backdrop-blur-xs flex items-center gap-1">
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
                          <div className={`text-[10px] font-mono font-bold uppercase tracking-widest truncate ${isDark ? 'text-zinc-500' : 'text-steel'}`}>
                            {item.sku || item.code}
                          </div>
                        )}

                        {/* Product Title */}
                        <h3
                          onClick={() => setDetailProduct(item)}
                          className={`font-display font-bold text-xs sm:text-[13px] leading-snug transition-colors line-clamp-2 cursor-pointer pt-0.5 ${isDark ? 'text-zinc-100 group-hover:text-ember' : 'text-ink group-hover:text-ember'
                            }`}
                          title={item.name}
                        >
                          {item.name}
                        </h3>

                        {/* Compatible Car Variant */}
                        {carDisplay && (
                          <div className={`flex items-start gap-1 font-body text-[10px] sm:text-[11px] pt-0.5 ${isDark ? 'text-zinc-400' : 'text-steel'}`}>
                            <Car className="w-3 h-3 text-ember shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{carDisplay}</span>
                          </div>
                        )}
                      </div>

                      {/* Price & Actions */}
                      <div className={`pt-2 border-t space-y-2 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                        <div>
                          <span className={`text-[9px] font-mono font-bold uppercase tracking-widest block ${isDark ? 'text-zinc-500' : 'text-steel'}`}>
                            HARGA RESMI
                          </span>
                          <div className="text-sm sm:text-base font-display font-bold text-ember leading-none mt-1">
                            {formattedPrice}
                          </div>
                        </div>

                        {/* Action Buttons: SPEK & WA */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailProduct(item)}
                            className={`py-1.5 px-2 rounded text-[11px] font-display uppercase tracking-wider font-semibold transition flex items-center justify-center gap-1 cursor-pointer border ${isDark
                                ? 'bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border-zinc-700 hover:border-ember'
                                : 'bg-smoke hover:bg-zinc-200 border-zinc-300 text-zinc-800 hover:border-ember'
                              }`}
                          >
                            <Eye className={`w-3 h-3 ${isDark ? 'text-zinc-400' : 'text-steel'}`} />
                            <span>SPEK</span>
                          </button>

                          <a
                            href={getWhatsAppOrderUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-1.5 px-2 bg-ember hover:bg-ember-deep text-white rounded text-[11px] font-display uppercase tracking-wider font-semibold transition flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer text-center"
                          >
                            <MessageCircle className="w-3 h-3 text-white" />
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
            <div className={`mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t pt-4 ${isDark ? 'text-zinc-400 border-zinc-800' : 'text-steel border-zinc-200'
              }`}>
              <div className="font-body">
                Menampilkan <strong className={`font-mono ${isDark ? 'text-white' : 'text-ink'}`}>{((currentPage - 1) * pageSize) + 1}</strong> - <strong className={`font-mono ${isDark ? 'text-white' : 'text-ink'}`}>{Math.min(currentPage * pageSize, displayedItems.length)}</strong> dari <strong className={`font-mono ${isDark ? 'text-white' : 'text-ink'}`}>{displayedItems.length}</strong> Item
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer ${isDark ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300' : 'bg-smoke border-zinc-200 hover:bg-zinc-200 text-zinc-700'
                    }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg font-display text-xs font-semibold transition cursor-pointer border ${currentPage === page
                        ? 'bg-ember text-white border-ember shadow-md'
                        : (isDark ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300' : 'bg-smoke border-zinc-200 hover:bg-zinc-200 text-zinc-700')
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer ${isDark ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300' : 'bg-smoke border-zinc-200 hover:bg-zinc-200 text-zinc-700'
                    }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
      </main>
      {/* ========================================================================= */}
      {/* 5. OFFICIAL ORDER GATEWAY (LANDING PAGE MOTORSPORT DESIGN TOKENS)         */}
      {/* ========================================================================= */}
      <section id="marketplace-section" className={`border-t py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDark ? 'bg-ink border-zinc-800 text-paper' : 'bg-smoke/60 border-zinc-200 text-ink'
        }`}>
        <div className="max-w-7xl mx-auto space-y-8 text-center">

          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-widest text-ember font-bold mb-2">
              OFFICIAL ORDER GATEWAY
            </p>
            <h2 className={`font-display text-2xl sm:text-4xl font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-ink'
              }`}>
              Pesan Melalui Platform Resmi
            </h2>
            <p className={`font-body text-xs sm:text-sm max-w-xl mx-auto leading-relaxed ${isDark ? 'text-zinc-400' : 'text-steel'
              }`}>
              Nikmati fasilitas Cicilan 0%, Bebas Ongkir se-Indonesia, dan Garansi Keaslian Produk 100% Original NDK Exhaust &amp; RGN Performance.
            </p>
            <div className="w-20 h-[2px] bg-ember mx-auto mt-3" />
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">

            {/* 1. Tokopedia */}
            <div className={`rounded-2xl p-6 border shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4 group hover:border-ember ${isDark
                ? 'bg-zinc-900/90 border-zinc-800'
                : 'bg-paper border-zinc-200'
              }`}>
              <div className="space-y-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/60' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                  <TokopediaIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`font-display text-base font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-ink'}`}>
                    Tokopedia Official
                  </h3>
                  <p className={`font-body text-xs mt-1 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-steel'}`}>
                    Official Store terverifikasi, cashback marketplace, cicilan 0% & garansi produk original.
                  </p>
                </div>
              </div>
              <a
                href="https://www.tokopedia.com/ndk-exhaust-id"
                target="_blank"
                rel="noopener noreferrer"
                className={`font-display text-xs font-semibold uppercase tracking-wider flex items-center justify-between pt-3 border-t transition-colors ${isDark ? 'text-zinc-300 hover:text-emerald-400 border-zinc-800' : 'text-zinc-800 hover:text-emerald-700 border-zinc-200'
                  }`}
              >
                <span>Buka Tokopedia</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* 2. Shopee */}
            <div className={`rounded-2xl p-6 border shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4 group hover:border-ember ${isDark
                ? 'bg-zinc-900/90 border-zinc-800'
                : 'bg-paper border-zinc-200'
              }`}>
              <div className="space-y-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? 'bg-orange-950/60 text-orange-400 border-orange-900/60' : 'bg-orange-50 text-orange-600 border-orange-100'
                  }`}>
                  <ShopeeIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`font-display text-base font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-ink'}`}>
                    Shopee Official Mall
                  </h3>
                  <p className={`font-body text-xs mt-1 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-steel'}`}>
                    Voucher gratis ongkir XTRA, promo tanggal kembar, dan pengiriman aman se-Indonesia.
                  </p>
                </div>
              </div>
              <a
                href="https://shopee.co.id/ndk_exhaust_official"
                target="_blank"
                rel="noopener noreferrer"
                className={`font-display text-xs font-semibold uppercase tracking-wider flex items-center justify-between pt-3 border-t transition-colors ${isDark ? 'text-zinc-300 hover:text-orange-400 border-zinc-800' : 'text-zinc-800 hover:text-orange-700 border-zinc-200'
                  }`}
              >
                <span>Buka Shopee</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* 3. Konsultasi CS WhatsApp */}
            <div className={`rounded-2xl p-6 border shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4 group hover:border-ember ${isDark
                ? 'bg-zinc-900/90 border-zinc-800'
                : 'bg-paper border-zinc-200'
              }`}>
              <div className="space-y-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/60' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                  <WhatsAppIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`font-display text-base font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-ink'}`}>
                    Konsultasi CS WhatsApp
                  </h3>
                  <p className={`font-body text-xs mt-1 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-steel'}`}>
                    Konsultasi rekomendasi knalpot presisi sesuai karakter harian atau balap dengan engineer kami.
                  </p>
                </div>
              </div>
              <a
                href="https://wa.me/6289502240040?text=Halo%20Admin%20NDK%20Exhaust%2C%20saya%20ingin%20konsultasi%20exhaust%20system."
                target="_blank"
                rel="noopener noreferrer"
                className={`font-display text-xs font-semibold uppercase tracking-wider flex items-center justify-between pt-3 border-t transition-colors ${isDark ? 'text-ember hover:text-rose-400 border-zinc-800' : 'text-ember hover:text-ember-deep border-zinc-200'
                  }`}
              >
                <span>Chat Admin WA</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* 4. Workshop & Fitting Center */}
            <div className={`rounded-2xl p-6 border shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4 group hover:border-ember ${isDark
                ? 'bg-zinc-900/90 border-zinc-800'
                : 'bg-paper border-zinc-200'
              }`}>
              <div className="space-y-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-smoke text-zinc-800 border-zinc-200'
                  }`}>
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-display text-base font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-ink'}`}>
                    Workshop &amp; Fitting Center
                  </h3>
                  <p className={`font-body text-xs mt-1 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-steel'}`}>
                    Instalasi presisi bolt-on di lokasi bengkel mitra NDK Exhaust dengan teknisi berpengalaman dan tersertifikasi.
                  </p>
                </div>
              </div>
              <a
                href="https://g.page/ndkexhaust"
                target="_blank"
                rel="noopener noreferrer"
                className={`font-display text-xs font-semibold uppercase tracking-wider flex items-center justify-between pt-3 border-t transition-colors ${isDark ? 'text-zinc-300 hover:text-white border-zinc-800' : 'text-zinc-800 hover:text-black border-zinc-200'
                  }`}
              >
                <span>Jadwalkan Pasang</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CLEAN FOOTER (LANDING PAGE MOTORSPORT DESIGN TOKENS)                    */}
      {/* ========================================================================= */}
      <footer id="about-section" className={`text-xs pt-16 pb-10 border-t mt-auto transition-colors duration-300 ${isDark ? 'bg-ink text-zinc-400 border-zinc-800' : 'bg-smoke text-steel border-zinc-200'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Column 1: Brand & Description */}
            <div className="space-y-4">
              <div
                className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
                onClick={navigateToLanding}
                title="Kembali ke Beranda"
              >
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
              </div>

              <p className={`font-body text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-steel'}`}>
                Katalog resmi produk knalpot NDK Exhaust &amp; RGN Performance. Melayani pemesanan, konsultasi spesifikasi mobil, dan pengiriman aman ke seluruh Indonesia.
              </p>
            </div>

            {/* Column 2: MARKETPLACE */}
            <div className="space-y-3">
              <h4 className={`font-display text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-ink'}`}>
                MARKETPLACE
              </h4>
              <ul className="space-y-2.5 text-xs font-body">
                <li>
                  <a
                    href="https://www.tokopedia.com/ndk-exhaust-id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-ember transition-colors flex items-center gap-2.5 group"
                  >
                    <TokopediaIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>Tokopedia Official</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://shopee.co.id/ndk_exhaust_official"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-ember transition-colors flex items-center gap-2.5 group"
                  >
                    <ShopeeIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>Shopee Official Mall</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/6289502240040?text=Halo%20Admin%20NDK%20Exhaust%2C%20saya%20ingin%20konsultasi%20exhaust%20system."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-ember transition-colors flex items-center gap-2.5 group"
                  >
                    <WhatsAppIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>WhatsApp Konsultasi</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: MEDIA & VIDEO */}
            <div className="space-y-3">
              <h4 className={`font-display text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-ink'}`}>
                MEDIA &amp; VIDEO
              </h4>
              <ul className="space-y-2.5 text-xs font-body">
                <li>
                  <a
                    href="https://www.instagram.com/ndkexhaust"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-ember transition-colors flex items-center gap-2.5 group"
                  >
                    <InstagramIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>Instagram @ndkexhaust</span>
                  </a>
                </li>
                <li>
                  <a
                    href="http://bit.ly/Youtube-NDKexhaust"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-ember transition-colors flex items-center gap-2.5 group"
                  >
                    <YouTubeIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>YouTube Sound Test</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.tiktok.com/@ndkofficial.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-ember transition-colors flex items-center gap-2.5 group"
                  >
                    <TikTokIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>TikTok @ndkofficial.id</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://warehousezero.web.app/catalog"
                    className="hover:text-ember transition-colors flex items-center gap-2.5 group"
                  >
                    <BookOpen className="w-4 h-4 text-ember shrink-0 transition-transform group-hover:scale-110" />
                    <span>E-Katalog Resmi</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: WORKSHOP RESMI */}
            <div className="space-y-3">
              <h4 className={`font-display text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-ink'}`}>
                WORKSHOP RESMI
              </h4>
              <p className={`font-body text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-steel'}`}>
                RGN Performance Workshop<br />
                Purbalingga, Jawa Tengah, Indonesia<br />
                Senin - Sabtu: 08.30 - 17.00 WIB
              </p>
              <div>
                <a
                  href="https://g.page/ndkexhaust"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-ember hover:bg-ember-deep text-white text-xs font-display font-semibold uppercase tracking-wider rounded transition cursor-pointer shadow-md"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>BUKA GOOGLE MAPS</span>
                </a>
              </div>
            </div>

          </div>

          {/* Copyright Bar */}
          <div className={`pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-body ${isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-steel'
            }`}>
            <p>
              © 2026 NDK Exhaust &amp; RGN Performance. All Rights Reserved.
            </p>
            <div className="flex items-center gap-4 text-[11px]">
              <span className={`transition cursor-pointer ${isDark ? 'hover:text-zinc-300' : 'hover:text-ink'}`}>Syarat Garansi</span>
              <span>•</span>
              <span className={`transition cursor-pointer ${isDark ? 'hover:text-zinc-300' : 'hover:text-ink'}`}>Kebijakan Privasi</span>
              <span>•</span>
              <span className={`transition cursor-pointer ${isDark ? 'hover:text-zinc-300' : 'hover:text-ink'}`}>Panduan Pemasangan</span>
            </div>
          </div>

        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 7. PRODUCT DETAIL MODAL (LANDING PAGE MOTORSPORT DESIGN TOKENS)           */}
      {/* ========================================================================= */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className={`rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border my-auto animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] ${isDark ? 'bg-zinc-900 border-zinc-800 text-paper' : 'bg-paper border-zinc-200 text-ink'
            }`}>

            {/* Modal Header */}
            <div className={`p-3.5 sm:p-4 border-b flex items-center justify-between flex-shrink-0 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-smoke border-zinc-200'
              }`}>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-widest ${isDark ? 'bg-zinc-800 text-zinc-200 border border-zinc-700' : 'bg-zinc-900 text-white'
                  }`}>
                  {detailProduct.engine_type || detailProduct.machineCategory || 'UNIVERSAL'}
                </span>
                <span className={`text-xs font-mono font-bold uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-steel'}`}>
                  {detailProduct.sku || detailProduct.code || '-'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800 border-zinc-800' : 'text-zinc-500 hover:text-ink hover:bg-zinc-200 border-zinc-300'
                  }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">

              {/* Product Photo Frame */}
              <div className={`aspect-16/9 rounded-xl border overflow-hidden flex items-center justify-center relative bg-zinc-950 ${isDark ? 'border-zinc-800' : 'border-zinc-200'
                }`}>
                {detailProduct.imageUrl ? (
                  <img
                    src={detailProduct.imageUrl}
                    alt={detailProduct.name}
                    className="w-full h-full object-contain bg-transparent"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-500 gap-1.5 p-4 text-center">
                    <ImageIcon className={`w-10 h-10 ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`} />
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500">NDK Exhaust High Performance</span>
                  </div>
                )}

                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2.5 py-1 rounded font-display text-xs font-semibold uppercase tracking-wider bg-ember text-white shadow-sm">
                    {detailProduct.brand || 'NDK EXHAUST'}
                  </span>
                </div>
              </div>

              {/* Title & Official Price */}
              <div className="space-y-1">
                <h3 className={`font-display text-lg sm:text-2xl font-bold uppercase tracking-tight leading-snug ${isDark ? 'text-white' : 'text-ink'}`}>
                  {detailProduct.name}
                </h3>
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <div>
                    <span className={`font-mono text-[10px] block uppercase font-bold tracking-widest ${isDark ? 'text-zinc-500' : 'text-steel'}`}>
                      HARGA RESMI ECERAN
                    </span>
                    <span className="font-display text-2xl sm:text-3xl font-bold text-ember">
                      Rp {(Number(detailProduct.selling_price ?? detailProduct.price) || 0).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleShareProduct(detailProduct)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-display uppercase tracking-wider font-semibold transition flex items-center gap-1.5 cursor-pointer border ${isDark
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700 hover:border-ember'
                        : 'bg-smoke hover:bg-zinc-200 text-zinc-800 border-zinc-300 hover:border-ember'
                      }`}
                  >
                    {copiedSku ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Link Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Bagikan Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Structured Technical Specifications Table */}
              <div className={`border rounded-xl p-4 space-y-3 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-smoke/60 border-zinc-200'
                }`}>
                <h4 className={`font-display text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-zinc-800'
                  }`}>
                  <Wrench className="w-3.5 h-3.5 text-ember" />
                  <span>Spesifikasi &amp; Kompatibilitas Mobil</span>
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-paper border-zinc-200'
                    }`}>
                    <span className={`font-mono text-[9px] block font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-steel'}`}>Tipe Mesin</span>
                    <strong className={`font-display text-xs sm:text-sm font-semibold uppercase tracking-tight truncate block mt-0.5 ${isDark ? 'text-zinc-100' : 'text-ink'}`}>{detailProduct.engine_type || detailProduct.machineCategory || '-'}</strong>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-paper border-zinc-200'
                    }`}>
                    <span className={`font-mono text-[9px] block font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-steel'}`}>Varian Mobil</span>
                    <strong className={`font-display text-xs sm:text-sm font-semibold uppercase tracking-tight truncate block mt-0.5 ${isDark ? 'text-zinc-100' : 'text-ink'}`}>{detailProduct.car_variant || '-'}</strong>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-paper border-zinc-200'
                    }`}>
                    <span className={`font-mono text-[9px] block font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-steel'}`}>Material</span>
                    <strong className={`font-display text-xs sm:text-sm font-semibold uppercase tracking-tight truncate block mt-0.5 ${isDark ? 'text-zinc-100' : 'text-ink'}`}>{detailProduct.material_finish || '-'}</strong>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-paper border-zinc-200'
                    }`}>
                    <span className={`font-mono text-[9px] block font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-steel'}`}>Karakter Suara</span>
                    <strong className={`font-display text-xs sm:text-sm font-semibold uppercase tracking-tight truncate block mt-0.5 ${isDark ? 'text-zinc-100' : 'text-ink'}`}>{detailProduct.spec_sound || '-'}</strong>
                  </div>

                  {detailProduct.spec_resonator !== undefined && (
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-paper border-zinc-200'
                      }`}>
                      <span className={`font-mono text-[9px] block font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-steel'}`}>Tabung Resonator</span>
                      <strong className={`font-display text-xs sm:text-sm font-semibold uppercase tracking-tight truncate block mt-0.5 ${isDark ? 'text-zinc-100' : 'text-ink'}`}>{detailProduct.spec_resonator === false ? 'Non-Resonator' : 'Ada Resonator'}</strong>
                    </div>
                  )}

                  {detailProduct.spec_pipe_size && (
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-paper border-zinc-200'
                      }`}>
                      <span className={`font-mono text-[9px] block font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-steel'}`}>Inlet / Outlet</span>
                      <strong className={`font-display text-xs sm:text-sm font-semibold uppercase tracking-tight truncate block mt-0.5 ${isDark ? 'text-zinc-100' : 'text-ink'}`}>{detailProduct.spec_pipe_size}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Multiline Description Section */}
              {detailProduct.description && (
                <div className={`border rounded-xl p-4 space-y-2 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-smoke/60 border-zinc-200'
                  }`}>
                  <h4 className={`font-display text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    Deskripsi Produk
                  </h4>
                  <div className={`font-body text-xs leading-relaxed whitespace-pre-line ${isDark ? 'text-zinc-300' : 'text-steel'}`}>
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
                  className="w-full py-3.5 px-5 bg-ember hover:bg-ember-deep text-white rounded-xl font-display text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-ember/20 active:scale-98 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span>Pesan Sekarang via WhatsApp (+62 895-0224-0040)</span>
                </a>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. BUNDLE DETAIL MODAL (LANDING PAGE MOTORSPORT DESIGN TOKENS)             */}
      {/* ========================================================================= */}
      {detailBundle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className={`rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border my-auto animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] ${isDark ? 'bg-zinc-900 border-zinc-800 text-paper' : 'bg-paper border-zinc-200 text-ink'
            }`}>

            {/* Modal Header */}
            <div className={`p-3.5 sm:p-4 border-b flex items-center justify-between flex-shrink-0 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-smoke border-zinc-200'
              }`}>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-widest bg-ember text-white flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  <span>PAKET BUNDLING</span>
                </span>
                {detailBundle.engine_type && (
                  <span className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-widest ${isDark ? 'bg-zinc-800 text-zinc-200 border border-zinc-700' : 'bg-zinc-900 text-white'
                    }`}>
                    {detailBundle.engine_type}
                  </span>
                )}
                <span className={`text-xs font-mono font-bold uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-steel'}`}>
                  {detailBundle.code || '-'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDetailBundle(null)}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800 border-zinc-800' : 'text-zinc-500 hover:text-ink hover:bg-zinc-200 border-zinc-300'
                  }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">

              {/* Product Photo or Bundle Graphic Frame */}
              <div className={`aspect-16/9 rounded-xl border overflow-hidden flex items-center justify-center relative bg-zinc-950 ${isDark ? 'border-zinc-800' : 'border-zinc-200'
                }`}>
                {detailBundle.imageUrl ? (
                  <img
                    src={detailBundle.imageUrl}
                    alt={detailBundle.name}
                    className="w-full h-full object-contain bg-transparent"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-400 gap-2 p-4 text-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${isDark ? 'bg-zinc-900 text-rose-400 border-zinc-800' : 'bg-smoke text-ember border-zinc-200'
                      }`}>
                      <Layers className="w-7 h-7" />
                    </div>
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400">
                      {detailBundle.brand || 'NDK EXHAUST'} • PAKET BUNDLE RESMI
                    </span>
                  </div>
                )}

                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2.5 py-1 rounded font-display text-xs font-semibold uppercase tracking-wider bg-ember text-white shadow-sm">
                    {detailBundle.brand || 'NDK EXHAUST'}
                  </span>
                </div>
              </div>

              {/* Title & Official Price */}
              <div className="space-y-1">
                <h3 className={`font-display text-lg sm:text-2xl font-bold uppercase tracking-tight leading-snug ${isDark ? 'text-white' : 'text-ink'}`}>
                  {formatBundleDisplayName(detailBundle)}
                </h3>
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <div>
                    <span className={`font-mono text-[10px] block uppercase font-bold tracking-widest ${isDark ? 'text-zinc-500' : 'text-steel'}`}>
                      HARGA RESMI PAKET
                    </span>
                    <span className="font-display text-2xl sm:text-3xl font-bold text-ember">
                      Rp {(Number(detailBundle.selling_price ?? detailBundle.price) || 0).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleShareProduct(detailBundle)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-display uppercase tracking-wider font-semibold transition flex items-center gap-1.5 cursor-pointer border ${isDark
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700 hover:border-ember'
                        : 'bg-smoke hover:bg-zinc-200 text-zinc-800 border-zinc-300 hover:border-ember'
                      }`}
                  >
                    {copiedSku ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Link Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Bagikan Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Specifications: Mesin & Mobil */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-smoke/60 border-zinc-200'
                  }`}>
                  <span className={`font-mono text-[9px] block font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-steel'}`}>Tipe Mesin</span>
                  <strong className={`font-display text-xs sm:text-sm font-semibold uppercase tracking-tight truncate block mt-0.5 ${isDark ? 'text-zinc-100' : 'text-ink'}`}>{detailBundle.engine_type || '-'}</strong>
                </div>

                <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-smoke/60 border-zinc-200'
                  }`}>
                  <span className={`font-mono text-[9px] block font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-steel'}`}>Varian Mobil</span>
                  <strong className={`font-display text-xs sm:text-sm font-semibold uppercase tracking-tight truncate block mt-0.5 ${isDark ? 'text-zinc-100' : 'text-ink'}`}>{detailBundle.car_variant || '-'}</strong>
                </div>
              </div>

              {/* RINCIAN KOMPONEN ISI PAKET */}
              <div className={`border rounded-xl p-4 space-y-3 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-smoke/60 border-zinc-200'
                }`}>
                <h4 className={`font-display text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-zinc-800'
                  }`}>
                  <Layers className="w-3.5 h-3.5 text-ember" />
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
                        <div key={idx} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border shadow-xs gap-2 text-xs ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-paper border-zinc-200'
                          }`}>
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="font-mono text-xs font-bold w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 bg-ember/15 text-ember border border-ember/20">
                              {bItem.qty || 1}x
                            </span>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`font-display font-bold text-xs sm:text-sm uppercase tracking-tight break-words ${isDark ? 'text-white' : 'text-ink'}`}>{mainName}</span>
                                {displayEngine && (
                                  <span className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest font-semibold whitespace-nowrap ${isDark ? 'bg-zinc-800 text-zinc-200 border border-zinc-700' : 'bg-zinc-900 text-white'
                                    }`}>
                                    {displayEngine}
                                  </span>
                                )}
                                {(matchedProd?.brand || bItem.brand) && (
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-display uppercase tracking-wider font-semibold whitespace-nowrap border ${isDark ? 'bg-zinc-900/90 text-zinc-300 border-zinc-700' : 'bg-smoke text-zinc-800 border-zinc-300'
                                    }`}>
                                    {matchedProd?.brand || bItem.brand}
                                  </span>
                                )}
                              </div>
                              {hasDifferentDetail && (
                                <div className={`font-body text-[11px] break-words ${isDark ? 'text-zinc-400' : 'text-steel'}`}>
                                  Detail Isi: <span className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>{itemDetail}</span>
                                </div>
                              )}
                              {(matchedProd?.car_variant || bItem.car_variant) && (
                                <div className={`font-body text-[10px] flex items-center gap-1 flex-wrap ${isDark ? 'text-zinc-500' : 'text-steel'}`}>
                                  <Car className="w-3 h-3 shrink-0 text-ember" />
                                  <span>{matchedProd?.car_variant || bItem.car_variant}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {(matchedProd?.sku || bItem.sku) && (
                            <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded border shrink-0 self-start sm:self-center ${isDark ? 'text-zinc-400 bg-zinc-950 border-zinc-800' : 'text-zinc-500 bg-smoke border-zinc-200'
                              }`}>
                              {matchedProd?.sku || bItem.sku}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : detailBundle.rawIsi ? (
                  <div className="space-y-2">
                    {detailBundle.rawIsi.split('+').map((itemStr, idx) => {
                      const cleanItemStr = itemStr.trim();
                      const fallbackEngine = (detailBundle.engine_type && detailBundle.engine_type !== '-' && detailBundle.engine_type.toLowerCase() !== 'all') ? detailBundle.engine_type : '';
                      return (
                        <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border text-xs ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-paper border-zinc-200'
                          }`}>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded font-mono font-bold text-[10px] flex items-center justify-center bg-ember/15 text-ember border border-ember/20">
                              ✓
                            </span>
                            <span className={`font-display font-bold uppercase tracking-tight text-xs sm:text-sm ${isDark ? 'text-white' : 'text-ink'}`}>{cleanItemStr}</span>
                          </div>
                          {fallbackEngine && (
                            <span className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest font-semibold ${isDark ? 'bg-zinc-800 text-zinc-200 border border-zinc-700' : 'bg-zinc-900 text-white'
                              }`}>
                              {fallbackEngine}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className={`font-body text-xs italic ${isDark ? 'text-zinc-500' : 'text-steel'}`}>Rincian komponen belum dicantumkan.</p>
                )}
              </div>

              {/* Keterangan / Deskripsi Publik Paket */}
              {(detailBundle.description || detailBundle.keterangan) && (
                <div className={`border rounded-xl p-4 space-y-2 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-smoke/60 border-zinc-200'
                  }`}>
                  <h4 className={`font-display text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'
                    }`}>
                    <FileText className="w-3.5 h-3.5 text-ember" />
                    <span>Deskripsi / Keterangan Paket</span>
                  </h4>
                  <p className={`font-body text-xs leading-relaxed whitespace-pre-line ${isDark ? 'text-zinc-300' : 'text-steel'}`}>
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
                  className="w-full py-3.5 px-5 bg-ember hover:bg-ember-deep text-white rounded-xl font-display text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-ember/20 active:scale-98 cursor-pointer"
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
