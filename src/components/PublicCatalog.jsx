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
    // Reset window scroll to top whenever catalog page loads
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const productListRef = useRef(null);

  const navigateToLanding = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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
      {/* 1. MAIN NAVBAR (DISESUAIKAN DENGAN DESAIN TEMPLATE & SS1)                 */}
      {/* ========================================================================= */}
      <header className={`main-header sticky top-0 z-50 border-b transition-colors duration-300 backdrop-blur-md ${isDark ? 'bg-ink/95 border-zinc-800' : 'bg-paper/95 border-line'
        }`}>
        <div className="max-w-[1180px] mx-auto px-4 sm:px-5 h-16 flex items-center gap-3.5">

          {/* Logo Lockup: NDK & RGN with Seamless Stacked Crossfade */}
          <div
            onClick={navigateToLanding}
            className="flex items-center gap-2.5 sm:gap-3 group py-1 cursor-pointer shrink-0 select-none"
            title="Kembali ke Beranda"
          >
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

            <span className={`h-4 sm:h-5 w-[1px] transition-colors duration-300 ${isDark ? 'bg-zinc-700' : 'bg-line'}`} />

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
          </div>

          {/* Main Navigation Links with Generous Spacing */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-8 text-[0.88rem] font-medium ml-6 sm:ml-8">
            <button
              type="button"
              onClick={navigateToLanding}
              className={`py-1.5 border-b-2 border-transparent transition-colors cursor-pointer whitespace-nowrap ${isDark ? 'text-zinc-400 hover:text-white' : 'text-steel hover:text-ink'
                }`}
            >
              Beranda
            </button>
            <button
              type="button"
              onClick={scrollToProducts}
              className="py-1.5 border-b-2 border-ember text-ember font-semibold cursor-pointer whitespace-nowrap"
            >
              Katalog
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('marketplace-section')}
              className={`py-1.5 border-b-2 border-transparent transition-colors cursor-pointer whitespace-nowrap ${isDark ? 'text-zinc-400 hover:text-white' : 'text-steel hover:text-ink'
                }`}
            >
              Marketplace
            </button>
          </nav>

          {/* Header Quick Search (Desktop) */}
          <div className="hidden md:block flex-1 max-w-[280px] ml-auto relative">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-steel-soft'}`} />
            <input
              type="text"
              placeholder="Cari knalpot, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-8 py-2 rounded-[10px] text-xs font-body border transition-all focus:outline-none focus:ring-2 focus:ring-ember ${isDark
                  ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:bg-zinc-950'
                  : 'bg-smoke border-line text-ink placeholder-steel-soft focus:bg-paper'
                }`}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-steel-soft hover:text-ink'}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Header Actions: Theme Toggle, Dashboard, Konsultasi, Hamburger */}
          <div className="flex items-center gap-2 shrink-0 ml-auto md:ml-0">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={handleToggleTheme}
              title={isDark ? "Mode Terang" : "Mode Gelap"}
              aria-label="Ganti tema gelap/terang"
              className={`w-10 h-10 rounded-[10px] border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${isDark
                  ? 'bg-zinc-900 border-zinc-800 text-amber-400 hover:bg-zinc-800'
                  : 'bg-paper border-line text-steel hover:bg-smoke hover:text-ink'
                }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Dashboard Button */}
            <button
              type="button"
              onClick={onGoToLogin || navigateToLanding}
              className={`hidden md:inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-[10px] text-xs font-semibold font-body border transition-colors cursor-pointer whitespace-nowrap ${isDark
                  ? 'border-zinc-800 hover:border-zinc-700 text-zinc-200 bg-transparent'
                  : 'border-line hover:border-ink text-ink bg-transparent'
                }`}
            >
              <LogIn className="w-3.5 h-3.5 text-ember" />
              <span>Dashboard</span>
            </button>

            {/* WhatsApp Consultation Button */}
            <a
              href="https://wa.me/6289502240040?text=Halo%20NDK%20Exhaust%20%26%20RGN%20Performance%2C%20saya%20ingin%20konsultasi%20exhaust%20system."
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden md:inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-[10px] text-xs font-semibold font-body transition-colors cursor-pointer whitespace-nowrap ${isDark
                  ? 'bg-white text-ink hover:bg-zinc-200'
                  : 'bg-ink text-white hover:bg-zinc-800'
                }`}
            >
              <span>Konsultasi</span>
            </a>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Buka menu navigasi"
              className={`md:hidden w-10 h-10 rounded-[10px] border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${isDark
                  ? 'bg-zinc-900 border-zinc-800 text-white'
                  : 'bg-paper border-line text-ink'
                }`}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              )}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-t transition-all ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-paper border-line'
            }`}>
            <div className="max-w-[1180px] mx-auto px-4 py-4 flex flex-col gap-3">
              {/* Mobile Search */}
              <div className="relative">
                <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-steel-soft'}`} />
                <input
                  type="text"
                  placeholder="Cari knalpot, SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-9 pr-8 py-2 rounded-[10px] text-xs font-body border ${isDark
                      ? 'bg-zinc-900 border-zinc-800 text-white'
                      : 'bg-smoke border-line text-ink'
                    }`}
                />
              </div>

              {/* Mobile Nav Links */}
              <nav className="flex flex-col text-sm font-medium">
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); navigateToLanding(); }}
                  className={`py-2.5 text-left border-b ${isDark ? 'border-zinc-800 text-white' : 'border-line text-ink'}`}
                >
                  Beranda
                </button>
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); scrollToProducts(); }}
                  className={`py-2.5 text-left border-b text-ember font-semibold ${isDark ? 'border-zinc-800' : 'border-line'}`}
                >
                  Katalog
                </button>
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); scrollToSection('marketplace-section'); }}
                  className={`py-2.5 text-left border-b ${isDark ? 'border-zinc-800 text-white' : 'border-line text-ink'}`}
                >
                  Marketplace
                </button>
              </nav>

              {/* Mobile Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); if (onGoToLogin) onGoToLogin(); else navigateToLanding(); }}
                  className={`flex-1 py-2.5 rounded-[10px] text-xs font-semibold border text-center ${isDark ? 'border-zinc-800 text-white' : 'border-line text-ink'
                    }`}
                >
                  Dashboard
                </button>
                <a
                  href="https://wa.me/6289502240040?text=Halo%20NDK%20Exhaust%20%26%20RGN%20Performance%2C%20saya%20ingin%20konsultasi%20exhaust%20system."
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 py-2.5 rounded-[10px] text-xs font-semibold text-center ${isDark ? 'bg-white text-ink' : 'bg-ink text-white'
                    }`}
                >
                  Konsultasi
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. CATALOG HERO SECTION (DISESUAIKAN DENGAN SS2 & TEMPLATE)               */}
      {/* ========================================================================= */}
      <section className={`catalog-hero pt-11 pb-3 text-center transition-colors duration-300 ${isDark ? 'bg-ink' : 'bg-paper'
        }`}>
        <div className="max-w-[1180px] mx-auto px-4 sm:px-5">
          <h1 className="font-display text-3xl sm:text-5xl lg:text-[3rem] font-bold leading-[1.12] tracking-tight uppercase">
            <span className={isDark ? 'text-white' : 'text-ink'}>KATALOG RESMI </span>
            <span className="text-ember">NDK EXHAUST</span>
          </h1>

          <p className="mt-4 max-w-[56ch] mx-auto font-body text-xs sm:text-sm md:text-[0.98rem] leading-relaxed text-steel dark:text-zinc-400">
            Stainless steel presisi Purbalingga. Tersedia Downpipe, Frontpipe, Centerpipe, Resonator, dan Muffler untuk mesin bensin dan diesel modern.
          </p>

          <div className="w-14 h-[3px] bg-ember mx-auto mt-5 rounded-full" />

          {/* Main Search Bar with Red Filter Button */}
          <div className="mt-7 max-w-[820px] mx-auto flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className={`w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-steel-soft'
                }`} />
              <input
                type="text"
                placeholder="Cari tipe knalpot, mobil (Innova 2GD, Brio, Fortuner, Pajero), SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-11 pr-9 py-3.5 rounded-[10px] border text-xs sm:text-sm font-body transition-all focus:outline-none focus:ring-2 focus:ring-ember ${isDark
                    ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:bg-zinc-950'
                    : 'bg-paper border-line text-ink placeholder-steel-soft focus:bg-paper'
                  }`}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-steel-soft hover:text-ink'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={scrollToProducts}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-[10px] bg-ember hover:bg-ember-deep text-white text-xs font-semibold font-display uppercase tracking-wider transition-colors shadow-sm cursor-pointer shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4 text-white" />
              <span>Filter</span>
            </button>
          </div>

          {/* Popular Search Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5 max-w-[820px] mx-auto text-xs">
            <span className="text-steel-soft font-semibold tracking-wider text-[12px] mr-1">Populer:</span>
            {quickSearchTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchTerm(tag)}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-medium transition-colors cursor-pointer ${searchTerm === tag
                    ? 'bg-ember border-ember text-white'
                    : isDark
                      ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-ember hover:text-ember'
                      : 'border-line bg-paper text-steel hover:border-ember hover:text-ink'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CATALOG FILTERS & SUBTABS (DISESUAIKAN DENGAN SS2 & TEMPLATE)          */}
      {/* ========================================================================= */}
      <section ref={productListRef} className="catalog-filters pt-8">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-5">

          {/* Chip Scroll: Semua Mesin, 2GD, dll. */}
          <div className="flex gap-2 overflow-x-auto pb-3.5 no-scrollbar">
            {availableEngineChips.map(eng => {
              const isSelected = selectedEngine === eng.id;
              const count = getEngineCount(eng.id);

              return (
                <button
                  key={eng.id}
                  type="button"
                  onClick={() => setSelectedEngine(eng.id)}
                  className={`shrink-0 px-4 py-2.5 rounded-full text-xs font-semibold border whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 transition-colors ${isSelected
                      ? 'bg-ember border-ember text-white shadow-sm'
                      : isDark
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                        : 'bg-paper border-line text-steel hover:text-ink hover:border-zinc-400'
                    }`}
                >
                  <span>{eng.label}</span>
                  <span className="opacity-75 font-normal">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Filter Selects: Komponen, Suara, Urutkan */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 py-3.5 border-t border-b border-line dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`px-3.5 py-2.5 rounded-[10px] text-xs font-semibold uppercase tracking-wider border focus:outline-none focus:ring-2 focus:ring-ember cursor-pointer transition-colors ${isDark
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
                    : 'bg-paper border-line text-ink'
                  }`}
              >
                <option value="ALL">Semua Komponen</option>
                {categoryList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Sound Filter */}
              <select
                value={selectedSound}
                onChange={(e) => setSelectedSound(e.target.value)}
                className={`px-3.5 py-2.5 rounded-[10px] text-xs font-semibold uppercase tracking-wider border focus:outline-none focus:ring-2 focus:ring-ember cursor-pointer transition-colors ${isDark
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
                    : 'bg-paper border-line text-ink'
                  }`}
              >
                <option value="ALL">Semua Karakter Suara</option>
                {soundList.map(snd => (
                  <option key={snd} value={snd}>{snd}</option>
                ))}
              </select>

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
                  className="px-3 py-1.5 text-ember hover:bg-ember/10 rounded-[10px] font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-3.5 py-2.5 rounded-[10px] text-xs font-semibold uppercase tracking-wider border focus:outline-none focus:ring-2 focus:ring-ember cursor-pointer transition-colors ${isDark
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
                  : 'bg-paper border-line text-ink'
                }`}
            >
              <option value="POPULAR">Urutkan: Paling Populer</option>
              <option value="PRICE_LOW">Harga: Terendah</option>
              <option value="PRICE_HIGH">Harga: Tertinggi</option>
              <option value="NAME_ASC">Nama A - Z</option>
            </select>
          </div>

          {/* Subtabs: Semua, Part Satuan, Paket Bundling (NO STOK SIAP KIRIM - SESUAI TANDA TIDAK PERLU DI SS2) */}
          <div className="flex items-center justify-between py-4 text-xs font-semibold">
            <div className="flex items-center gap-5 flex-wrap">
              <button
                type="button"
                onClick={() => setCatalogMode('ALL')}
                className={`flex items-center gap-1.5 cursor-pointer transition-colors ${catalogMode === 'ALL'
                    ? 'text-ember'
                    : isDark ? 'text-zinc-400 hover:text-white' : 'text-steel hover:text-ink'
                  }`}
              >
                <span>Semua</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${catalogMode === 'ALL'
                    ? 'bg-ember text-white'
                    : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-smoke text-steel'
                  }`}>
                  {activeProducts.length + activeBundles.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCatalogMode('PRODUCTS')}
                className={`flex items-center gap-1.5 cursor-pointer transition-colors ${catalogMode === 'PRODUCTS'
                    ? 'text-ember'
                    : isDark ? 'text-zinc-400 hover:text-white' : 'text-steel hover:text-ink'
                  }`}
              >
                <span>Part Satuan</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${catalogMode === 'PRODUCTS'
                    ? 'bg-ember text-white'
                    : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-smoke text-steel'
                  }`}>
                  {activeProducts.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCatalogMode('BUNDLES')}
                className={`flex items-center gap-1.5 cursor-pointer transition-colors ${catalogMode === 'BUNDLES'
                    ? 'text-ember'
                    : isDark ? 'text-zinc-400 hover:text-white' : 'text-steel hover:text-ink'
                  }`}
              >
                <span>Paket Bundling</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${catalogMode === 'BUNDLES'
                    ? 'bg-ember text-white'
                    : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-smoke text-steel'
                  }`}>
                  {activeBundles.length}
                </span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PRODUCT LISTING GRID (DISESUAIKAN DENGAN SS2 & TEMPLATE)               */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-[1180px] mx-auto px-4 sm:px-5 pb-16 w-full">

        {/* Section Header: Title & Count */}
        <div className="py-3.5 pb-5">
          <h2 className={`font-body text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-ink'}`}>
            {catalogMode === 'BUNDLES' ? 'Daftar Paket Bundling' : catalogMode === 'PRODUCTS' ? 'Daftar Part Satuan' : 'Daftar Produk & Bundle'}{' '}
            <span className="font-normal text-steel dark:text-zinc-400">
              (<span className="text-ember font-bold">{paginatedItems.length}</span> dari {displayedItems.length} Item)
            </span>
          </h2>
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
            /* Product Grid: 4 Columns Desktop / 2 Columns Tablet / 1 Column Mobile */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
              {paginatedItems.map(item => {
                const isBundle = item.isBundle;
                const price = Number(item.selling_price ?? item.price) || 0;
                const formattedPrice = `Rp ${price.toLocaleString('id-ID')}`;
                const engineDisplay = item.engine_type || item.machineCategory || '';
                const itemKey = isBundle ? `bndl-${item.id || item.code}` : `prod-${item.id || item.sku || item.code}`;
                const displayName = isBundle ? formatBundleDisplayName(item) : item.name;

                const cardImage = item.imageUrl || (isBundle && Array.isArray(item.items) ? item.items.find(sub => sub.imageUrl)?.imageUrl : null);

                return (
                  <article
                    key={itemKey}
                    className={`product-card border rounded-[10px] overflow-hidden flex flex-col transition-all duration-150 group ${isDark
                        ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:shadow-lg'
                        : 'bg-paper border-line hover:border-ink hover:shadow-[0_6px_18px_rgba(0,0,0,0.06)]'
                      }`}
                  >
                    {/* Product Media Area (Aspect-Square: dominant visual presentation) */}
                    <div
                      onClick={() => isBundle ? setDetailBundle(item) : setDetailProduct(item)}
                      className="product-media relative aspect-square bg-gradient-to-br from-[#222222] via-[#161616] to-[#0a0a0a] flex items-center justify-center overflow-hidden cursor-pointer"
                    >
                      {/* Top Left Code Tag (Engine / Code) */}
                      {engineDisplay && (
                        <span className="code-tag absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-[6px] tracking-wide uppercase font-mono z-10 border border-white/10">
                          {engineDisplay}
                        </span>
                      )}

                      {/* Top Right Bundle Tag */}
                      {isBundle && (
                        <span className="bundle-tag absolute top-2.5 right-2.5 bg-ember text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 font-mono uppercase tracking-wider shadow-sm z-10">
                          <Layers className="w-3 h-3" />
                          <span>Paket Bundle</span>
                        </span>
                      )}

                      {/* Product Image or Aesthetic Graphic Fallback */}
                      {cardImage ? (
                        <img
                          src={cardImage}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 p-6 text-center select-none">
                          <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                            {isBundle ? (
                              <Layers className="w-7 h-7 stroke-white text-white" />
                            ) : (
                              <Package className="w-7 h-7 stroke-white text-white" />
                            )}
                          </div>
                          <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-zinc-400">
                            {isBundle ? 'NDK Paket Exhaust' : (item.category || 'NDK Exhaust Part')}
                          </span>
                        </div>
                      )}

                      {/* Bottom Watermark */}
                      <span className="watermark absolute bottom-2 left-0 right-0 text-center font-display text-[10px] tracking-[0.2em] text-white/35 font-semibold uppercase pointer-events-none">
                        {item.brand || 'NDK EXHAUST'}
                      </span>
                    </div>

                    {/* Product Body: Compact to ensure the image above is clearly larger than the text */}
                    <div className="product-body p-3.5 flex flex-col gap-1.5 flex-1">
                      {/* SKU */}
                      <span className="product-sku text-[10px] sm:text-[11px] font-mono font-medium tracking-wider text-steel-soft uppercase truncate">
                        {item.sku || item.code || '-'}
                      </span>

                      {/* Product Name */}
                      <h3
                        onClick={() => isBundle ? setDetailBundle(item) : setDetailProduct(item)}
                        className={`product-name font-body font-semibold text-[13px] sm:text-[14px] leading-snug line-clamp-2 min-h-[2.35rem] cursor-pointer transition-colors ${isDark ? 'text-white group-hover:text-ember' : 'text-ink group-hover:text-ember'
                          }`}
                        title={displayName}
                      >
                        {displayName}
                      </h3>

                      {/* Price Section */}
                      <div className="mt-0.5">
                        <span className="block text-[10px] font-body font-semibold tracking-wider uppercase text-steel-soft">
                          {isBundle ? 'Harga Resmi Paket' : 'Harga Resmi'}
                        </span>
                        <span className="product-price text-[1.12rem] sm:text-[1.18rem] font-bold font-display text-ember leading-none">
                          {formattedPrice}
                        </span>
                      </div>

                      {/* Product Actions */}
                      <div className="product-actions flex gap-2 mt-auto pt-2">
                        <button
                          type="button"
                          onClick={() => isBundle ? setDetailBundle(item) : setDetailProduct(item)}
                          className={`btn btn-outline btn-sm flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[8px] text-xs font-semibold font-body border transition-colors cursor-pointer ${isDark
                              ? 'border-zinc-800 hover:border-zinc-700 text-zinc-300 bg-zinc-900/60'
                              : 'border-line hover:border-ink text-ink bg-paper'
                            }`}
                        >
                          <Eye className="w-3.5 h-3.5 text-steel" />
                          <span>{isBundle ? 'Detail Isi' : 'Detail'}</span>
                        </button>

                        <a
                          href={isBundle ? getWhatsAppBundleOrderUrl(item) : getWhatsAppOrderUrl(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[8px] text-xs font-semibold font-body bg-ember hover:bg-ember-deep text-white transition-colors shadow-sm cursor-pointer text-center"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 fill-current text-white" />
                          <span>WA</span>
                        </a>
                      </div>
                    </div>
                  </article>
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
                    Tokopedia
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
                    Shopee
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
                    WhatsApp
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
                    <span>Tokopedia</span>
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
                    <span>Shopee</span>
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
                    <span>WhatsApp</span>
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
                    <span>Instagram</span>
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
                    <span>YouTube</span>
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
                    <span>TikTok</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://warehousezero.web.app/catalog"
                    className="hover:text-ember transition-colors flex items-center gap-2.5 group"
                  >
                    <BookOpen className="w-4 h-4 text-ember shrink-0 transition-transform group-hover:scale-110" />
                    <span>E-Katalog</span>
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
