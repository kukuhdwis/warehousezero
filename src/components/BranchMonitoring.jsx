import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Package, 
  Boxes, 
  TrendingUp, 
  AlertTriangle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search, 
  Download, 
  Warehouse, 
  User, 
  Phone, 
  MapPin, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Eye,
  ArrowLeft,
  Filter,
  Layers,
  Inbox
} from 'lucide-react';
import { exportToCSV } from '../services/dataService';

export default function BranchMonitoring({ 
  currentUser, 
  branches = [], 
  products = [], 
  transactions = [], 
  users = [] 
}) {
  // 'ALL' for overview grid, or specific branchId for dedicated warehouse view
  const [selectedBranchId, setSelectedBranchId] = useState('ALL');
  const [selectedStaffName, setSelectedStaffName] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL'); // 'ALL' | 'LOW' | 'SAFE'

  // Selected Branch Object
  const selectedBranch = branches.find(b => b.id === selectedBranchId);

  // Staff list for selected branch
  const branchStaffList = selectedBranch
    ? users.filter(u => u.branchId === selectedBranch.id)
    : users;

  // Products belonging to the selected branch (or all)
  const branchProducts = products.filter(p => {
    if (selectedBranchId === 'ALL') return true;
    return p.branchId === selectedBranchId;
  });

  // Filter products by search & stock status
  const filteredProducts = branchProducts.filter(p => {
    const matchesSearch = 
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase());

    const isLow = (Number(p.currentStock) || 0) <= (Number(p.minStock) || 0);
    const matchesStock = 
      stockFilter === 'ALL' ||
      (stockFilter === 'LOW' && isLow) ||
      (stockFilter === 'SAFE' && !isLow);

    return matchesSearch && matchesStock;
  });

  // Transactions belonging to selected branch and/or staff
  const branchTransactions = transactions.filter(t => {
    const matchesBranch = selectedBranchId === 'ALL' || t.branchId === selectedBranchId;
    const matchesStaff = selectedStaffName === 'ALL' || t.user === selectedStaffName;
    return matchesBranch && matchesStaff;
  });

  // Statistics Calculation
  const totalSKU = filteredProducts.length;
  const totalUnits = filteredProducts.reduce((acc, p) => acc + (Number(p.currentStock) || 0), 0);
  const lowStockItems = filteredProducts.filter(p => (Number(p.currentStock) || 0) <= (Number(p.minStock) || 0));
  const totalValuation = filteredProducts.reduce((acc, p) => acc + ((Number(p.currentStock) || 0) * (Number(p.price) || 0)), 0);

  // Export report for current view
  const handleExportCSV = () => {
    const branchLabel = selectedBranch ? selectedBranch.name.replace(/\s+/g, '-') : 'Semua-Cabang';
    const reportData = filteredProducts.map(p => {
      const branchName = branches.find(b => b.id === p.branchId)?.name || p.branchName || 'Pusat';
      return {
        Cabang: branchName,
        SKU: p.sku,
        Nama_Produk: p.name,
        Kuantitas_Stok: p.currentStock,
        Satuan: p.unit || 'Pcs',
        Harga_Satuan: p.price,
        Total_Nilai_Stok: (Number(p.currentStock) || 0) * (Number(p.price) || 0),
        Stok_Minimum: p.minStock,
        Status: (Number(p.currentStock) || 0) <= (Number(p.minStock) || 0) ? 'Perlu Restock' : 'Aman'
      };
    });

    exportToCSV(reportData, `Inventaris-${branchLabel}-${Date.now()}.csv`);
  };

  // ==========================================
  // VIEW 1: DEDICATED BRANCH WAREHOUSE VIEW
  // (Triggered when Admin clicks on a branch)
  // ==========================================
  if (selectedBranch) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
        
        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setSelectedBranchId('ALL');
              setSelectedStaffName('ALL');
              setSearchTerm('');
              setStockFilter('ALL');
            }}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Ringkasan Semua Cabang</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Dedicated Branch Header Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 p-5 sm:p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-sky-400 flex-shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                      Gudang {selectedBranch.name}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {selectedBranch.status || 'Aktif'}
                    </span>
                  </div>

                  {selectedBranch.address && (
                    <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                      <span>{selectedBranch.address}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Branch PIC & Hotline Info */}
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 text-xs space-y-1 sm:min-w-[200px]">
                <div className="flex items-center justify-between text-slate-300 text-[11px]">
                  <span>Kepala Gudang (PIC):</span>
                  <strong className="text-white">{selectedBranch.pic || '-'}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300 text-[11px]">
                  <span>Hotline / Kontak:</span>
                  {selectedBranch.phone ? (
                    <a 
                      href={`tel:${selectedBranch.phone}`}
                      className="text-sky-300 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {selectedBranch.phone}
                    </a>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Staff Accounts Operating in this Branch */}
          <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <span className="text-xs font-bold text-slate-700">Akun Petugas / Staff ({branchStaffList.length}):</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedStaffName('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedStaffName === 'ALL'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Semua Petugas
              </button>

              {branchStaffList.map(staff => (
                <button
                  key={staff.id}
                  onClick={() => setSelectedStaffName(staff.name)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    selectedStaffName === staff.name
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span>{staff.name}</span>
                </button>
              ))}

              {branchStaffList.length === 0 && (
                <span className="text-xs text-slate-400 italic">Belum ada akun staff yang ditugaskan ke cabang ini.</span>
              )}
            </div>
          </div>
        </div>

        {/* Branch Real-time KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Total SKU</p>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {totalSKU} <span className="text-xs font-normal text-slate-400">Item</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Jenis produk terdaftar di gudang</p>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Unit Stok</p>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {totalUnits.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">Pcs</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Fisik barang siap distribusi</p>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Stok Menipis</p>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">
              {lowStockItems.length} <span className="text-xs font-normal text-amber-700/80">Item</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Mendekati / di bawah batas min</p>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Valuasi Aset</p>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-emerald-600 mt-1 truncate">
              Rp {totalValuation.toLocaleString('id-ID')}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Estimasi nilai total persediaan</p>
          </div>

        </div>

        {/* TAMPILAN MENYELURUH ISI GUDANG CABANG */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-600" />
                <span>Katalog Inventaris Isi Gudang {selectedBranch.name}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Daftar menyeluruh seluruh stok barang fisik yang tersimpan di lokasi cabang ini.</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-medium self-start sm:self-auto">
              <button
                onClick={() => setStockFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  stockFilter === 'ALL' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({branchProducts.length})
              </button>
              <button
                onClick={() => setStockFilter('LOW')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                  stockFilter === 'LOW' ? 'bg-rose-600 text-white font-bold shadow-2xs' : 'text-rose-600 hover:text-rose-700'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Menipis ({lowStockItems.length})</span>
              </button>
              <button
                onClick={() => setStockFilter('SAFE')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  stockFilter === 'SAFE' ? 'bg-emerald-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aman ({branchProducts.length - lowStockItems.length})
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Cari nama barang atau SKU di ${selectedBranch.name}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            />
          </div>

          {/* EMPTY STATE IF NO ITEMS YET */}
          {filteredProducts.length === 0 ? (
            <div className="p-8 sm:p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-500 border border-sky-100 flex items-center justify-center mx-auto">
                <Inbox className="w-7 h-7" />
              </div>
              <div className="max-w-sm mx-auto">
                <h4 className="font-bold text-slate-800 text-sm sm:text-base">Gudang Cabang Ini Belum Memiliki Data Barang</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Inventaris barang akan otomatis terdata secara real-time saat Anda atau staf cabang menambahkan produk baru atau memproses transaksi barang masuk.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* MOBILE CARDS (Smartphone View) */}
              <div className="block md:hidden space-y-2.5">
                {filteredProducts.map((p) => {
                  const isLow = (Number(p.currentStock) || 0) <= (Number(p.minStock) || 0);
                  const lineValuation = (Number(p.currentStock) || 0) * (Number(p.price) || 0);

                  return (
                    <div key={p.id} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{p.name}</h4>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">SKU: {p.sku}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                          isLow ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {p.currentStock} {p.unit || 'Pcs'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                        <div>
                          <span className="text-slate-400">Harga Satuan:</span>
                          <p className="font-semibold text-slate-800">Rp {(Number(p.price) || 0).toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Total Nilai:</span>
                          <p className="font-bold text-emerald-700">Rp {lineValuation.toLocaleString('id-ID')}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px] text-slate-400">
                        <span>Batas Min: {p.minStock || 0} {p.unit || 'Pcs'}</span>
                        <span className={`font-semibold ${isLow ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {isLow ? '⚠️ Butuh Restock' : '✓ Stok Aman'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Nama Produk & SKU</th>
                      <th className="px-4 py-3 text-right">Harga Unit</th>
                      <th className="px-4 py-3 text-center">Stok Fisik</th>
                      <th className="px-4 py-3 text-center">Batas Min</th>
                      <th className="px-4 py-3 text-right">Total Nilai (Rp)</th>
                      <th className="px-5 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((prod) => {
                      const isLow = (Number(prod.currentStock) || 0) <= (Number(prod.minStock) || 0);
                      const lineVal = (Number(prod.currentStock) || 0) * (Number(prod.price) || 0);

                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-5 py-3.5 font-medium text-slate-900">
                            <div>{prod.name}</div>
                            <div className="text-xs text-slate-400 font-mono">{prod.sku}</div>
                          </td>
                          <td className="px-4 py-3.5 text-right text-slate-700 text-xs font-medium">
                            Rp {(Number(prod.price) || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              isLow ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {prod.currentStock} {prod.unit || 'Pcs'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center text-xs text-slate-500">
                            {prod.minStock || 0} {prod.unit || 'Pcs'}
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-slate-900 text-xs">
                            Rp {lineVal.toLocaleString('id-ID')}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertTriangle className="w-3 h-3" />
                                Restock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
                                <CheckCircle2 className="w-3 h-3" />
                                Aman
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </div>

        {/* LOG TRANSAKSI MUTASI STOK KHUSUS CABANG INI */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Log Mutasi Stok Terkini ({selectedBranch.name})
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {branchTransactions.length} Transaksi Tercatat
            </span>
          </div>

          <div className="space-y-2">
            {branchTransactions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Belum ada catatan mutasi barang masuk/keluar di cabang ini.</p>
            ) : (
              branchTransactions.slice(0, 10).map((tx) => {
                const isIn = tx.type === 'IN';
                return (
                  <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                        isIn ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {isIn ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{tx.productName}</p>
                        <p className="text-[10px] text-slate-400">
                          Petugas: <strong className="text-slate-700">{tx.user || 'Staff'}</strong> • {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs font-bold ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isIn ? '+' : '-'}{tx.qty}
                      </span>
                      <p className="text-[10px] text-slate-400">{tx.notes || '-'}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    );
  }

  // ==========================================
  // VIEW 2: MULTI-BRANCH DIRECTORY OVERVIEW
  // (Main listing of all branches)
  // ==========================================
  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Eye className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Monitoring Inventaris Cabang
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pilih cabang di bawah untuk membuka **tampilan menyeluruh isi gudang**, stok fisik, dan log mutasi staff.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-xs transition active:scale-98 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Rekap Semua Cabang</span>
        </button>
      </div>

      {/* Global Consolidated KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Cabang</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{branches.length} <span className="text-xs font-normal text-slate-400">Gudang</span></h3>
        </div>
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Total SKU Global</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{products.length} <span className="text-xs font-normal text-slate-400">Item</span></h3>
        </div>
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Unit Fisik</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{products.reduce((acc, p) => acc + (Number(p.currentStock) || 0), 0).toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">Pcs</span></h3>
        </div>
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Valuasi</p>
          <h3 className="text-sm sm:text-xl font-bold text-emerald-600 mt-1 truncate">
            Rp {products.reduce((acc, p) => acc + ((Number(p.currentStock) || 0) * (Number(p.price) || 0)), 0).toLocaleString('id-ID')}
          </h3>
        </div>
      </div>

      {/* BRANCH CARDS DIRECTORY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600">
            Daftar Lokasi Gudang Cabang (Klik untuk Buka Isi Gudang)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {branches.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              Belum ada cabang terdaftar. Tambahkan cabang di menu Kelola Cabang & Gudang.
            </div>
          ) : (
            branches.map((branch) => {
              const bProducts = products.filter(p => p.branchId === branch.id);
              const bStaff = users.filter(u => u.branchId === branch.id);
              const bTotalUnits = bProducts.reduce((acc, p) => acc + (Number(p.currentStock) || 0), 0);
              const bLowStock = bProducts.filter(p => (Number(p.currentStock) || 0) <= (Number(p.minStock) || 0)).length;
              const bValuation = bProducts.reduce((acc, p) => acc + ((Number(p.currentStock) || 0) * (Number(p.price) || 0)), 0);

              return (
                <div
                  key={branch.id}
                  onClick={() => {
                    setSelectedBranchId(branch.id);
                    setSelectedStaffName('ALL');
                    setSearchTerm('');
                    setStockFilter('ALL');
                  }}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-400 hover:shadow-md transition-all cursor-pointer space-y-4 group"
                >
                  {/* Branch Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-600 group-hover:text-white transition">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-base group-hover:text-sky-600 transition">
                            {branch.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            {branch.status || 'Aktif'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          PIC: <strong className="text-slate-700">{branch.pic || '-'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-sky-50 text-slate-400 group-hover:text-sky-600 transition">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Branch Address & Phone */}
                  {branch.address && (
                    <p className="text-xs text-slate-400 line-clamp-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                      <span>{branch.address}</span>
                    </p>
                  )}

                  {/* Branch Metrics Matrix */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <p className="text-[10px] text-slate-400 uppercase">Item SKU</p>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{bProducts.length}</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <p className="text-[10px] text-slate-400 uppercase">Fisik Unit</p>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{bTotalUnits}</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <p className="text-[10px] text-slate-400 uppercase">Petugas</p>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{bStaff.length}</p>
                    </div>
                  </div>

                  {/* Action Banner */}
                  <div className="flex items-center justify-between text-xs font-semibold text-sky-600 pt-1 group-hover:translate-x-1 transition">
                    <span>Buka Tampilan Menyeluruh Isi Gudang</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
