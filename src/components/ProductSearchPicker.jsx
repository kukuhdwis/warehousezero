import React, { useState, useMemo } from 'react';
import { Search, Tag, Boxes, Check, X, ChevronDown, Layers } from 'lucide-react';

export default function ProductSearchPicker({ 
  products = [], 
  selectedProductId = '', 
  onSelectProduct,
  placeholder = "🔍 Cari Produk (Nama, SKU, Merk, Kategori Mesin)...",
  label = "Pilih Produk dari Katalog",
  showStockInfo = true
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isOpen, setIsOpen] = useState(false);

  const safeProducts = Array.isArray(products) ? products : [];

  // Extract all unique categories
  const categories = useMemo(() => {
    const set = new Set();
    safeProducts.forEach(p => {
      const cat = p.machineCategory || p.kategoriMesin;
      if (cat) set.add(cat);
    });
    return ['ALL', ...Array.from(set)];
  }, [safeProducts]);

  // Filter products by search term and selected category
  const filteredProducts = useMemo(() => {
    return safeProducts.filter(p => {
      const cat = p.machineCategory || p.kategoriMesin || 'Universal';
      const matchesCat = selectedCategory === 'ALL' || cat === selectedCategory;
      const term = searchTerm.toLowerCase().trim();
      const matchesTerm = !term || 
        (p.name || '').toLowerCase().includes(term) ||
        (p.sku || '').toLowerCase().includes(term) ||
        (p.brand || '').toLowerCase().includes(term) ||
        cat.toLowerCase().includes(term);
      return matchesCat && matchesTerm;
    });
  }, [safeProducts, searchTerm, selectedCategory]);

  const selectedProduct = safeProducts.find(p => p.id === selectedProductId || p.sku === selectedProductId);

  const handleSelect = (product) => {
    if (onSelectProduct) {
      onSelectProduct(product);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}
        </label>
      )}

      {/* Selected Product Banner (When selected) */}
      {selectedProduct && !isOpen ? (
        <div className="p-3.5 bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-emerald-950 text-sm truncate">{selectedProduct.name}</h4>
                <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                  {selectedProduct.brand || 'Generic'}
                </span>
              </div>
              <p className="text-xs text-emerald-800 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                <span>SKU: {selectedProduct.sku}</span>
                <span>•</span>
                <span>Kategori: {selectedProduct.machineCategory || selectedProduct.kategoriMesin || 'Universal'}</span>
                {showStockInfo && (
                  <>
                    <span>•</span>
                    <strong className="text-emerald-950 bg-emerald-200/70 px-1.5 py-0.2 rounded">Stok: {selectedProduct.currentStock ?? 0} Pcs</strong>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer flex-shrink-0"
          >
            Ganti Produk
          </button>
        </div>
      ) : (
        /* Search Box & Dropdown Selector */
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-3 shadow-xs space-y-2.5">
          
          {/* Live Search Field */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              autoFocus={isOpen}
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1 mr-1 flex-shrink-0">
              <Layers className="w-3 h-3" />
              Filter:
            </span>
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setIsOpen(true);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex-shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'Semua Kategori' : cat}
              </button>
            ))}
          </div>

          {/* Filtered Product Selection List */}
          <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-slate-100 pr-1">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Tidak ada produk yang cocok dengan pencarian "{searchTerm}".
              </div>
            ) : (
              filteredProducts.map(p => {
                const isSelected = p.id === selectedProductId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected ? 'bg-emerald-50 text-emerald-950 font-bold' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs truncate">{p.name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {p.brand || 'Generic'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        SKU: {p.sku} | Kategori: {p.machineCategory || p.kategoriMesin || 'Universal'}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      {showStockInfo && (
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          (p.currentStock ?? 0) <= (p.minStock ?? 5)
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          Stok: {p.currentStock ?? 0} Pcs
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

        </div>
      )}
    </div>
  );
}
