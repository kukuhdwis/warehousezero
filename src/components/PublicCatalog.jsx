import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Package, 
  Car, 
  Wrench, 
  Sparkles, 
  Tag, 
  Volume2, 
  Layers, 
  CheckCircle2, 
  MessageCircle, 
  Share2, 
  Eye, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  SlidersHorizontal,
  ChevronRight,
  Info,
  Check,
  PhoneCall,
  Flame,
  ImageIcon,
  Filter,
  CheckCircle
} from 'lucide-react';

export default function PublicCatalog({ 
  products = [], 
  brands = [], 
  machineCategories = [], 
  initialSku = '' 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEngine, setSelectedEngine] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedSound, setSelectedSound] = useState('ALL');
  const [detailProduct, setDetailProduct] = useState(null);
  const [copiedSku, setCopiedSku] = useState(false);

  // Active public products (exclude soft deleted INACTIVE)
  const activeProducts = useMemo(() => {
    return (products || []).filter(p => p.status !== 'INACTIVE');
  }, [products]);

  // Unique filter lists derived from actual products data
  const engineList = useMemo(() => {
    const set = new Set();
    activeProducts.forEach(p => {
      const e = p.engine_type || p.engineType || p.machineCategory;
      if (e) set.add(e);
    });
    return Array.from(set).sort();
  }, [activeProducts]);

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

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return activeProducts.filter(p => {
      const matchesSearch = 
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku || p.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.car_variant || p.carVariant || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category_name || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEngine = selectedEngine === 'ALL' || (p.engine_type || p.machineCategory) === selectedEngine;
      const matchesCategory = selectedCategory === 'ALL' || (p.category_name || p.categoryName) === selectedCategory;
      const matchesBrand = selectedBrand === 'ALL' || (p.brand || 'NDK Exhaust') === selectedBrand;
      const matchesSound = selectedSound === 'ALL' || (p.spec_sound || p.specSound) === selectedSound;

      return matchesSearch && matchesEngine && matchesCategory && matchesBrand && matchesSound;
    });
  }, [activeProducts, searchTerm, selectedEngine, selectedCategory, selectedBrand, selectedSound]);

  // Auto-open product detail if initialSku is provided (e.g. from QR code scan)
  useEffect(() => {
    if (initialSku && activeProducts.length > 0) {
      const matched = activeProducts.find(p => 
        (p.sku || '').toLowerCase() === initialSku.toLowerCase() ||
        (p.code || '').toLowerCase() === initialSku.toLowerCase()
      );
      if (matched) {
        setDetailProduct(matched);
      }
    }
  }, [initialSku, activeProducts]);

  // Generate WhatsApp Order Message
  const getWhatsAppOrderUrl = (prod) => {
    const price = Number(prod.selling_price ?? prod.price) || 0;
    const formattedPrice = `Rp ${price.toLocaleString('id-ID')}`;
    const text = `Halo Admin NDK Exhaust, saya ingin konsultasi & memesan produk knalpot ini:\n\n*${prod.name}*\n• SKU: ${prod.sku || prod.code}\n• Merk: ${prod.brand || 'NDK Exhaust'}\n• Mesin: ${prod.engine_type || '-'}\n• Mobil: ${prod.car_variant || '-'}\n• Karakter Suara: ${prod.spec_sound || '-'}\n• Harga Resmi: ${formattedPrice}\n\nApakah stok barang ini tersedia untuk pengiriman? Terima kasih!`;
    
    return `https://wa.me/6281122334455?text=${encodeURIComponent(text)}`;
  };

  const handleShareProduct = (prod) => {
    const url = `${window.location.origin}/catalog?sku=${encodeURIComponent(prod.sku || prod.code)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedSku(true);
      setTimeout(() => setCopiedSku(false), 2000);
    }
  };

  const quickSearchTags = ['Innova 2GD', 'Fortuner', 'Brio', 'Downpipe', 'Titanium', '2KD'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* ========================================================================= */}
      {/* 1. APP HEADER - CLEAN AUTOMOTIVE IDENTITY                                 */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          
          {/* Brand Logo & Professional Subtitle */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-800 to-indigo-900 flex items-center justify-center shadow-sm text-white font-black flex-shrink-0">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-2xl font-black tracking-tight text-slate-950 truncate">
                  NDK EXHAUST
                </h1>
                <span className="text-[10px] sm:text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                  Catalog
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium hidden sm:block truncate">
                Katalog Resmi Sistem Knalpot & Komponen Performa Mesin Presisi
              </p>
            </div>
          </div>

          {/* Direct WhatsApp Consultation Button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="https://wa.me/6281122334455?text=Halo%20Admin%20NDK%20Exhaust,%20saya%20ingin%20konsultasi%20pilihan%20knalpot%20mobil%20saya"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs active:scale-95 cursor-pointer"
              title="Hubungi WhatsApp Customer Service Resmi"
            >
              <MessageCircle className="w-4 h-4 fill-white/20" />
              <span className="hidden sm:inline">Konsultasi CS</span>
              <span className="sm:hidden">WA CS</span>
            </a>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SHOWCASE & SEARCH (MODERN & ADAPTIVE)                             */}
      {/* ========================================================================= */}
      <section className="bg-white border-b border-slate-200/70 py-5 sm:py-10 px-3.5 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-800 text-[11px] sm:text-xs font-bold">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>Katalog Master Plug & Play (PNP) Presisi</span>
          </div>

          <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight leading-snug">
            Knalpot Presisi untuk Performa Maksimal
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed hidden sm:block">
            Tersedia pilihan Bolt-on, Downpipe, Frontpipe, Centerpipe, dan Muffler berbahan Stainless Steel & Titanium untuk semua varian mobil.
          </p>

          {/* Quick Search Input */}
          <div className="max-w-2xl mx-auto pt-1">
            <div className="relative">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama knalpot, mobil (Innova, Brio, Fortuner), SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-9 sm:pr-10 py-2.5 sm:py-3.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-indigo-100 shadow-2xs transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Search Tags for Fast Mobile Tap */}
            <div className="flex items-center justify-center gap-1.5 overflow-x-auto pt-2 no-scrollbar text-[11px]">
              <span className="text-slate-400 font-medium flex-shrink-0">Populer:</span>
              {quickSearchTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSearchTerm(tag)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 font-semibold transition cursor-pointer flex-shrink-0 whitespace-nowrap"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. HORIZONTAL STICKY FILTER BAR (OPTIMIZED FOR MOBILE SWIPE)             */}
      {/* ========================================================================= */}
      <section className="bg-white/95 border-b border-slate-200/90 sticky top-16 sm:top-20 z-30 py-2.5 px-3.5 sm:px-6 shadow-2xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto space-y-2">
          
          {/* Tipe Mesin Chips Horizontal Slider */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 no-scrollbar text-xs">
            <button
              onClick={() => setSelectedEngine('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                selectedEngine === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Semua Mesin ({activeProducts.length})
            </button>

            {engineList.map(eng => {
              const count = activeProducts.filter(p => (p.engine_type || p.machineCategory) === eng).length;
              return (
                <button
                  key={eng}
                  onClick={() => setSelectedEngine(eng)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                    selectedEngine === eng
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {eng} <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Secondary Filter Dropdowns */}
          <div className="flex items-center gap-2 overflow-x-auto text-[11px] sm:text-xs">
            <div className="flex items-center gap-1 flex-shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">Semua Komponen</option>
                {categoryList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <select
                value={selectedSound}
                onChange={(e) => setSelectedSound(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">Semua Suara</option>
                {soundList.map(snd => (
                  <option key={snd} value={snd}>{snd}</option>
                ))}
              </select>
            </div>

            {(selectedEngine !== 'ALL' || selectedCategory !== 'ALL' || selectedSound !== 'ALL' || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedEngine('ALL');
                  setSelectedCategory('ALL');
                  setSelectedSound('ALL');
                  setSearchTerm('');
                }}
                className="px-2 py-1 text-rose-600 hover:underline font-bold transition cursor-pointer flex-shrink-0"
              >
                Reset
              </button>
            )}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PRODUCTS GRID (2-COLUMNS ON MOBILE, 3-4 ON DESKTOP)                   */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 w-full">
        
        {/* Results Info */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm sm:text-base font-black text-slate-900">
            Daftar Produk <span className="text-slate-400 font-medium">({filteredProducts.length})</span>
          </h3>
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-800">Tidak ada produk yang cocok</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Coba gunakan kata kunci pencarian yang lain atau ubah pilihan filter mesin Anda.
            </p>
            <button
              onClick={() => {
                setSelectedEngine('ALL');
                setSelectedCategory('ALL');
                setSelectedSound('ALL');
                setSearchTerm('');
              }}
              className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Tampilkan Semua Produk
            </button>
          </div>
        ) : (
          /* 2-Column Grid on Mobile, 3-4 on Tablet/Desktop */
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5">
            {filteredProducts.map(prod => {
              const price = Number(prod.selling_price ?? prod.price) || 0;
              const formattedPrice = `Rp ${price.toLocaleString('id-ID')}`;

              return (
                <div 
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 shadow-2xs hover:shadow-md transition duration-200 flex flex-col overflow-hidden group"
                >
                  
                  {/* Photo Showcase Area */}
                  <div 
                    onClick={() => setDetailProduct(prod)}
                    className="relative aspect-4/3 bg-slate-100 border-b border-slate-100 overflow-hidden cursor-pointer flex items-center justify-center"
                  >
                    {prod.imageUrl ? (
                      <img 
                        src={prod.imageUrl} 
                        alt={prod.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 gap-1 p-2 text-center">
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">NDK Exhaust</span>
                      </div>
                    )}

                    {/* Engine Type Tag overlay */}
                    <div className="absolute top-2 left-2">
                      <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-extrabold bg-white/95 text-slate-900 border border-slate-200/80 shadow-2xs backdrop-blur-xs">
                        {prod.engine_type || prod.machineCategory || 'Universal'}
                      </span>
                    </div>

                    {/* Sound spec badge */}
                    {prod.spec_sound && (
                      <div className="absolute bottom-2 left-2">
                        <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-slate-950/80 text-amber-300 backdrop-blur-xs">
                          🔊 {prod.spec_sound}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info Section */}
                  <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2">
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs">
                        <span className="font-mono font-bold text-slate-500 truncate">
                          {prod.sku || prod.code}
                        </span>
                        <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                          {prod.brand || 'NDK Exhaust'}
                        </span>
                      </div>

                      <h4 
                        onClick={() => setDetailProduct(prod)}
                        className="font-bold text-slate-950 text-xs sm:text-sm leading-snug group-hover:text-indigo-600 transition line-clamp-2 cursor-pointer"
                        title={prod.name}
                      >
                        {prod.name}
                      </h4>

                      {/* Car compatibility preview */}
                      <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
                        <Car className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{prod.car_variant || 'Semua Varian Mobil'}</span>
                      </p>
                    </div>

                    {/* Price & Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Harga Resmi</span>
                        <div className="text-xs sm:text-base font-black text-slate-950 leading-tight">
                          {formattedPrice}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailProduct(prod)}
                          className="py-1.5 sm:py-2 px-1.5 sm:px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
                          <span>Spek</span>
                        </button>

                        <a
                          href={getWhatsAppOrderUrl(prod)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-1.5 sm:py-2 px-1.5 sm:px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs active:scale-95 cursor-pointer text-center"
                        >
                          <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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

      </main>

      {/* ========================================================================= */}
      {/* 5. PRODUCT DETAIL MODAL (CLEAN FULL SPECIFICATIONS)                       */}
      {/* ========================================================================= */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 my-auto animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {detailProduct.brand || 'NDK Exhaust'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  {detailProduct.sku || detailProduct.code}
                </span>
              </div>
              <button
                onClick={() => setDetailProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Product Photo Frame */}
              <div className="aspect-16/9 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center relative">
                {detailProduct.imageUrl ? (
                  <img 
                    src={detailProduct.imageUrl} 
                    alt={detailProduct.name} 
                    className="w-full h-full object-contain bg-white" 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
                    <ImageIcon className="w-10 h-10 text-slate-300" />
                    <span className="text-xs font-bold text-slate-400">NDK Exhaust High Performance</span>
                  </div>
                )}

                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-white/95 text-slate-900 border border-slate-200 shadow-2xs">
                    {detailProduct.engine_type || detailProduct.machineCategory || 'Universal'}
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
                    <span className="text-xl sm:text-2xl font-black text-emerald-700">
                      Rp {(Number(detailProduct.selling_price ?? detailProduct.price) || 0).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleShareProduct(detailProduct)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
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
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                <h4 className="text-[11px] sm:text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Spesifikasi & Kompatibilitas Mobil</span>
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">Tipe Mesin</span>
                    <strong className="text-slate-900 text-xs font-bold truncate block">{detailProduct.engine_type || detailProduct.machineCategory || 'Universal'}</strong>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">Varian Mobil</span>
                    <strong className="text-slate-900 text-xs font-bold truncate block">{detailProduct.car_variant || 'Semua Varian'}</strong>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">Material</span>
                    <strong className="text-slate-900 text-xs font-bold truncate block">{detailProduct.material_finish || 'Stainless Steel'}</strong>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">Karakter Suara</span>
                    <strong className="text-amber-700 text-xs font-bold truncate block">{detailProduct.spec_sound || 'Street (Bass Adem)'}</strong>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">Tabung Resonator</span>
                    <strong className="text-slate-900 text-xs font-bold truncate block">{detailProduct.spec_resonator === false ? 'Non-Resonator' : 'Ada Resonator'}</strong>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">Inlet / Outlet</span>
                    <strong className="text-slate-900 text-xs font-bold truncate block">{detailProduct.spec_pipe_size || 'Presisi PNP'}</strong>
                  </div>
                </div>
              </div>

              {/* Multiline Description Section */}
              {detailProduct.description && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 mt-3">
                  <h4 className="text-[11px] sm:text-xs font-black text-slate-700 uppercase tracking-wider">
                    Deskripsi
                  </h4>
                  <div className="text-xs sm:text-[13px] text-slate-600 leading-relaxed whitespace-pre-line">
                    {detailProduct.description}
                  </div>
                </div>
              )}

              {/* Direct Order Call To Action */}
              <div className="pt-1">
                <a
                  href={getWhatsAppOrderUrl(detailProduct)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-white/20" />
                  <span>Pesan Sekarang via WhatsApp Customer Service</span>
                </a>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. CLEAN FOOTER                                                           */}
      {/* ========================================================================= */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-slate-900 font-bold">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>NDK Exhaust Indonesia</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Katalog Resmi Sistem Knalpot Presisi • Layanan Konsultasi & Pengiriman Seluruh Indonesia
          </p>
        </div>
      </footer>

    </div>
  );
}
