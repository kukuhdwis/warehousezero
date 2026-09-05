import React, { useState, useMemo } from 'react';
import { Search, Boxes, Check, X, Layers, Sparkles } from 'lucide-react';
import { matchesSearch } from '../utils/searchUtils';

export default function BundleSearchPicker({
  bundles = [],
  selectedBundleId = '',
  onSelectBundle,
  placeholder = "🔍 Cari Paket Bundling (Nama, Kode, Merk, Tipe Mesin, Varian)...",
  label = "Pilih Master Paket Bundling",
  showPrice = true,
  showComponentsCount = true,
  autoFocus = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEngine, setSelectedEngine] = useState('ALL');
  const [isOpen, setIsOpen] = useState(false);

  const safeBundles = Array.isArray(bundles) ? bundles : [];

  // Extract unique engines / categories from bundles
  const engines = useMemo(() => {
    const set = new Set();
    safeBundles.forEach(b => {
      const eng = b.engine_type || b.engine || b.machineCategory || b.kategoriMesin;
      if (eng && typeof eng === 'string' && eng.trim()) {
        set.add(eng.trim());
      }
    });
    return ['ALL', ...Array.from(set)];
  }, [safeBundles]);

  // Filter bundles based on search term and engine category
  const filteredBundles = useMemo(() => {
    return safeBundles.filter(b => {
      const eng = b.engine_type || b.engine || b.machineCategory || b.kategoriMesin || '';
      const matchesEngine = selectedEngine === 'ALL' || eng === selectedEngine;
      const matchesTerm = matchesSearch(
        searchTerm,
        b.name,
        b.code,
        b.brand,
        eng,
        b.car_variant,
        b.notes,
        b.keterangan
      );
      return matchesEngine && matchesTerm;
    });
  }, [safeBundles, searchTerm, selectedEngine]);

  const selectedBundle = safeBundles.find(b => b.id === selectedBundleId);
  const selectedMainEngine = selectedBundle ? (selectedBundle.engine_type || selectedBundle.engine || selectedBundle.machineCategory || selectedBundle.kategoriMesin || '') : '';
  const selectedDisplayName = (selectedBundle && selectedMainEngine && selectedMainEngine.toUpperCase() !== 'UNIVERSAL' && selectedMainEngine.toUpperCase() !== 'ALL' && !selectedBundle.name.toLowerCase().includes(selectedMainEngine.toLowerCase()))
    ? `${selectedBundle.name} - ${selectedMainEngine}`
    : (selectedBundle?.name || '');

  const handleSelect = (bundle) => {
    if (onSelectBundle) {
      onSelectBundle(bundle);
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

      {/* Selected Bundle Banner (When a bundle is chosen and picker is closed) */}
      {selectedBundle && !isOpen ? (
        <div className="p-3.5 bg-purple-50/90 border-2 border-purple-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
              <Boxes className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {selectedBundle.code && (
                  <span className="font-mono text-xs font-extrabold text-purple-900 bg-purple-200/80 px-2 py-0.5 rounded-md border border-purple-300">
                    {selectedBundle.code}
                  </span>
                )}
                <h4 className="font-bold text-slate-900 text-sm leading-snug break-words">{selectedDisplayName}</h4>
              </div>
              <div className="text-xs text-purple-900 font-medium mt-1 flex items-center gap-2 flex-wrap leading-relaxed">
                {selectedBundle.brand && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-purple-800 border border-purple-200 shadow-2xs">
                    {selectedBundle.brand}
                  </span>
                )}
                {selectedMainEngine && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {selectedMainEngine}
                  </span>
                )}
                {selectedBundle.car_variant && selectedBundle.car_variant !== '-' && (
                  <span className="text-[11px] text-slate-600">
                    Varian: <strong>{selectedBundle.car_variant}</strong>
                  </span>
                )}
                {showComponentsCount && (
                  <span className="text-[11px] text-purple-700 font-semibold">
                    • {(selectedBundle.items || []).length} Komponen
                  </span>
                )}
                {showPrice && (
                  <span className="text-xs font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-purple-200 ml-auto sm:ml-0">
                    Rp {(selectedBundle.selling_price || 0).toLocaleString('id-ID')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-xl text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer flex-shrink-0 self-start sm:self-center"
          >
            Cari & Ganti Bundle
          </button>
        </div>
      ) : (
        /* Search Box & Dropdown Selector */
        <div className="bg-white rounded-2xl border-2 border-purple-200 p-3 shadow-xs space-y-2.5">
          {/* Live Search Field */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-purple-500 absolute left-3 pointer-events-none" />
            <input
              type="text"
              autoFocus={autoFocus || isOpen}
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="w-full pl-9 pr-9 py-2.5 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none placeholder:text-slate-400 transition"
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

          {/* Quick Engine / Category Chips */}
          {engines.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1 mr-1 flex-shrink-0">
                <Layers className="w-3 h-3" />
                Mesin:
              </span>
              {engines.map(eng => (
                <button
                  key={eng}
                  type="button"
                  onClick={() => {
                    setSelectedEngine(eng);
                    setIsOpen(true);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex-shrink-0 cursor-pointer ${
                    selectedEngine === eng
                      ? 'bg-purple-700 text-white shadow-2xs'
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200/60'
                  }`}
                >
                  {eng === 'ALL' ? 'Semua Mesin' : eng}
                </button>
              ))}
            </div>
          )}

          {/* Filtered Bundle Selection List */}
          <div className="max-h-64 overflow-y-auto space-y-1 divide-y divide-purple-100/70 pr-1">
            {filteredBundles.length === 0 ? (
              <div className="p-5 text-center text-xs text-slate-500 space-y-1">
                <Boxes className="w-7 h-7 mx-auto text-purple-300 stroke-1" />
                <p className="font-semibold text-slate-700">Tidak ada paket bundling yang cocok</p>
                {searchTerm && (
                  <p className="text-[11px] text-slate-400">
                    Coba kata kunci lain atau kosongkan kolom pencarian.
                  </p>
                )}
              </div>
            ) : (
              filteredBundles.map(b => {
                const isSelected = b.id === selectedBundleId;
                const compCount = (b.items || []).length;
                const mainEngine = b.engine_type || b.engine || b.machineCategory || b.kategoriMesin || '';
                const displayName = (mainEngine && mainEngine.toUpperCase() !== 'UNIVERSAL' && mainEngine.toUpperCase() !== 'ALL' && !b.name.toLowerCase().includes(mainEngine.toLowerCase()))
                  ? `${b.name} - ${mainEngine}`
                  : b.name;

                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelect(b)}
                    className={`w-full text-left p-3 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-100/80 text-purple-950 font-bold border border-purple-300 shadow-2xs'
                        : 'hover:bg-purple-50/70 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {b.code && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-purple-200/90 text-purple-900 border border-purple-300/80 whitespace-nowrap">
                            {b.code}
                          </span>
                        )}
                        <span className="font-bold text-xs text-slate-900 leading-snug break-words">
                          {displayName}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap leading-relaxed">
                        {b.brand && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 whitespace-nowrap">
                            {b.brand}
                          </span>
                        )}
                        {mainEngine && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 whitespace-nowrap">
                            {mainEngine}
                          </span>
                        )}
                        {b.car_variant && b.car_variant !== '-' && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600 font-medium break-words">
                              {b.car_variant}
                            </span>
                          </>
                        )}
                        {showComponentsCount && (
                          <>
                            <span>•</span>
                            <span className="text-purple-700 font-semibold whitespace-nowrap">
                              {compCount} Komponen
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1">
                      {showPrice && (
                        <span className="text-xs font-black text-purple-950 bg-white sm:bg-transparent px-2 sm:px-0 py-0.5 rounded border sm:border-0 border-purple-200">
                          Rp {(b.selling_price || 0).toLocaleString('id-ID')}
                        </span>
                      )}
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-200/80 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Dipilih
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-purple-600 hover:underline">
                          Pilih Paket &rarr;
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Close / Cancel Button if currently selected */}
          {selectedBundle && isOpen && (
            <div className="pt-2 border-t border-purple-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer px-3 py-1"
              >
                Tutup Pencarian
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
