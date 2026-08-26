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
  Inbox,
  Check,
  Ban
} from 'lucide-react';
import { exportToCSV } from '../services/dataService';

export default function BranchMonitoring({ 
  currentUser, 
  branches = [], 
  products = [], 
  branchInventories = [],
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

  // Branch Inventories belonging to selected branch (or all)
  const branchInventoryItems = branchInventories.filter(bi => {
    if (selectedBranchId === 'ALL') return true;
    return bi.branchId === selectedBranchId;
  });

  // Filter items by search & stock status
  const filteredInventories = branchInventoryItems.filter(item => {
    const matchesSearch = 
      (item.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.brand || '').toLowerCase().includes(searchTerm.toLowerCase());

    const isLow = (Number(item.stockQuantity) || 0) <= (Number(item.minStock) || 5);
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
  const totalSKU = filteredInventories.filter(bi => bi.status === 'APPROVED').length;
  const totalUnits = filteredInventories
    .filter(bi => bi.status === 'APPROVED')
    .reduce((acc, bi) => acc + (Number(bi.stockQuantity) || 0), 0);
  const lowStockItems = filteredInventories.filter(
    bi => bi.status === 'APPROVED' && (Number(bi.stockQuantity) || 0) <= (Number(bi.minStock) || 5)
  );
  const totalValuation = filteredInventories
    .filter(bi => bi.status === 'APPROVED')
    .reduce((acc, bi) => acc + ((Number(bi.stockQuantity) || 0) * (Number(bi.price) || 0)), 0);

  // Export report for current view
  const handleExportCSV = () => {
    const branchLabel = selectedBranch ? selectedBranch.name.replace(/\s+/g, '-') : 'Semua-Cabang';
    const reportData = filteredInventories.map(item => {
      const branchName = branches.find(b => b.id === item.branchId)?.name || item.branchName || 'Cabang';
      return {
        Cabang: branchName,
        SKU: item.sku,
        Nama_Produk: item.productName,
        Merk: item.brand || 'Generic',
        Kuantitas_Stok: item.stockQuantity,
        Satuan: item.unit || 'Pcs',
        Harga_Satuan: item.price,
        Total_Nilai_Stok: (Number(item.stockQuantity) || 0) * (Number(item.price) || 0),
        Status_Validasi: item.status,
        Disetujui_Oleh: item.approvedBy || '-',
        Stok_Minimum: item.minStock || 5,
        Status_Stok: (Number(item.stockQuantity) || 0) <= (Number(item.minStock) || 5) ? 'Perlu Restock' : 'Aman'
      };
    });

    exportToCSV(reportData, `Inventaris-${branchLabel}-${Date.now()}.csv`);
  };

  // ==========================================
  // VIEW 1: DEDICATED BRANCH WAREHOUSE VIEW
  // (Triggered when Admin/Staff clicks on a branch)
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
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Ringkasan Semua Cabang</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Cabang</span>
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
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {selectedBranch.status || 'Aktif'}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-2">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-sky-400" />
                      PIC: <strong className="text-white">{selectedBranch.pic || '-'}</strong>
                    </span>
                    {selectedBranch.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-sky-400" />
                        {selectedBranch.phone}
                      </span>
                    )}
                    {selectedBranch.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-sky-400" />
                        {selectedBranch.address}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Staff Registered Badge */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-right flex-shrink-0">
                <span className="text-[10px] text-slate-300 uppercase block font-semibold">Petugas Bertugas</span>
                <span className="text-lg font-bold text-white">
                  {branchStaffList.length} <span className="text-xs font-normal text-slate-300">Staff</span>
                </span>
              </div>

            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 border-t border-slate-100 bg-slate-50/60">
            <div className="p-4 text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">Total Produk Aktif</span>
              <span className="text-lg font-bold text-slate-800 mt-0.5 block">{totalSKU} SKU</span>
            </div>
            <div className="p-4 text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">Total Fisik Stok</span>
              <span className="text-lg font-bold text-slate-800 mt-0.5 block">{totalUnits.toLocaleString('id-ID')} Pcs</span>
            </div>
            <div className="p-4 text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">Stok Menipis</span>
              <span className={`text-lg font-bold mt-0.5 block ${lowStockItems.length > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                {lowStockItems.length} Item
              </span>
            </div>
            <div className="p-4 text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">Total Valuasi Stok</span>
              <span className="text-lg font-bold text-emerald-600 mt-0.5 block">
                Rp {totalValuation.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* SECTION A: INVENTORY PRODUCTS IN BRANCH    */}
        {/* ========================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Boxes className="w-5 h-5 text-sky-600" />
                <span>Daftar Stok Fisik Barang di {selectedBranch.name}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Stok fisik yang telah diajukan cabang dan diverifikasi/disetujui oleh Kantor Pusat.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-medium self-start sm:self-auto">
              <button
                onClick={() => setStockFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  stockFilter === 'ALL' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({branchInventoryItems.length})
              </button>
              <button
                onClick={() => setStockFilter('LOW')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                  stockFilter === 'LOW' ? 'bg-rose-600 text-white font-bold shadow-2xs' : 'text-rose-600 hover:text-rose-700'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Menipis ({lowStockItems.length})</span>
              </button>
              <button
                onClick={() => setStockFilter('SAFE')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  stockFilter === 'SAFE' ? 'bg-emerald-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aman ({branchInventoryItems.length - lowStockItems.length})
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Cari nama barang, merk, atau SKU di ${selectedBranch.name}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            />
          </div>

          {/* EMPTY STATE IF NO ITEMS YET */}
          {filteredInventories.length === 0 ? (
            <div className="p-8 sm:p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-500 border border-sky-100 flex items-center justify-center mx-auto">
                <Inbox className="w-7 h-7" />
              </div>
              <div className="max-w-sm mx-auto">
                <h4 className="font-bold text-slate-800 text-sm sm:text-base">Gudang Cabang Ini Belum Memiliki Data Barang</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Inventaris barang akan otomatis terdata secara real-time saat staf cabang mengajukan inventaris produk dan telah disetujui oleh Pusat.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* MOBILE CARDS (Smartphone View) */}
              <div className="block md:hidden space-y-2.5">
                {filteredInventories.map((item) => {
                  const isLow = (Number(item.stockQuantity) || 0) <= (Number(item.minStock) || 5);
                  const lineValuation = (Number(item.stockQuantity) || 0) * (Number(item.price) || 0);
                  const isApproved = item.status === 'APPROVED';

                  return (
                    <div key={item.id} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{item.productName}</h4>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                              {item.brand || 'Generic'}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">SKU: {item.sku}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                          !isApproved 
                            ? 'bg-amber-100 text-amber-800' 
                            : isLow 
                              ? 'bg-rose-100 text-rose-700' 
                              : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {item.stockQuantity} {item.unit || 'Pcs'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                        <div>
                          <span className="text-slate-400">Harga Satuan:</span>
                          <p className="font-semibold text-slate-800">Rp {(Number(item.price) || 0).toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Total Nilai:</span>
                          <p className="font-bold text-emerald-700">Rp {lineValuation.toLocaleString('id-ID')}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px]">
                        <span className="text-slate-400">Status: {item.status}</span>
                        <span className={`font-semibold ${isApproved ? (isLow ? 'text-rose-600' : 'text-emerald-600') : 'text-amber-600'}`}>
                          {isApproved ? (isLow ? '⚠️ Butuh Restock' : '✓ Stok Aktif') : '⏳ Menunggu Validasi'}
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
                      <th className="px-5 py-3">Nama Produk & Merk</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3 text-right">Harga Unit</th>
                      <th className="px-4 py-3 text-center">Stok Fisik</th>
                      <th className="px-4 py-3 text-right">Total Nilai (Rp)</th>
                      <th className="px-5 py-3 text-center">Status Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInventories.map((item) => {
                      const isLow = (Number(item.stockQuantity) || 0) <= (Number(item.minStock) || 5);
                      const lineVal = (Number(item.stockQuantity) || 0) * (Number(item.price) || 0);
                      const isApproved = item.status === 'APPROVED';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-5 py-3.5 font-medium text-slate-900">
                            <div className="flex items-center gap-2">
                              <span>{item.productName}</span>
                              <span className="px-2 py-0.2 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                {item.brand || 'Generic'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-400 font-mono">{item.sku}</td>
                          <td className="px-4 py-3.5 text-right text-slate-700 text-xs font-medium">
                            Rp {(Number(item.price) || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              !isApproved 
                                ? 'bg-amber-100 text-amber-800' 
                                : isLow 
                                  ? 'bg-rose-100 text-rose-700' 
                                  : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {item.stockQuantity} {item.unit || 'Pcs'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-slate-900 text-xs">
                            Rp {lineVal.toLocaleString('id-ID')}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3" />
                                Aktif (Disetujui)
                              </span>
                            ) : item.status === 'PENDING_APPROVAL' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                <Clock className="w-3 h-3" />
                                Menunggu Validasi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <Ban className="w-3 h-3" />
                                Ditolak
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

        {/* ========================================== */}
        {/* SECTION B: MUTATION HISTORY & STAFF LOG    */}
        {/* ========================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-600" />
                <span>Log Riwayat Mutasi & Transaksi di {selectedBranch.name}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pencatatan real-time seluruh arus barang masuk dan keluar di cabang ini.
              </p>
            </div>

            {/* Staff Filter Dropdown */}
            {branchStaffList.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500">Filter Staff:</label>
                <select
                  value={selectedStaffName}
                  onChange={(e) => setSelectedStaffName(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="ALL">Semua Petugas ({branchStaffList.length})</option>
                  {branchStaffList.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            {branchTransactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Belum ada catatan mutasi transaksi untuk cabang ini.
              </div>
            ) : (
              branchTransactions.slice(0, 15).map((tx) => {
                const isIn = tx.type === 'IN';
                return (
                  <div 
                    key={tx.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                        isIn ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {isIn ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">{tx.productName}</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Petugas: <strong className="text-slate-700">{tx.user || '-'}</strong> • {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs font-bold ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isIn ? '+' : '-'}{tx.qty} Pcs
                      </span>
                      <p className="text-[10px] text-slate-400 max-w-xs truncate">{tx.notes || '-'}</p>
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
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Unit di Cabang</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {branchInventories.filter(bi => bi.status === 'APPROVED').reduce((acc, bi) => acc + (Number(bi.stockQuantity) || 0), 0).toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">Pcs</span>
          </h3>
        </div>
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Valuasi Cabang</p>
          <h3 className="text-sm sm:text-xl font-bold text-emerald-600 mt-1 truncate">
            Rp {branchInventories.filter(bi => bi.status === 'APPROVED').reduce((acc, bi) => acc + ((Number(bi.stockQuantity) || 0) * (Number(bi.price) || 0)), 0).toLocaleString('id-ID')}
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
              const bInventories = branchInventories.filter(bi => bi.branchId === branch.id && bi.status === 'APPROVED');
              const bStaff = users.filter(u => u.branchId === branch.id);
              const bTotalUnits = bInventories.reduce((acc, bi) => acc + (Number(bi.stockQuantity) || 0), 0);
              const bValuation = bInventories.reduce((acc, bi) => acc + ((Number(bi.stockQuantity) || 0) * (Number(bi.price) || 0)), 0);

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
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{bInventories.length}</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <p className="text-[10px] text-slate-400 uppercase">Fisik Unit</p>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{bTotalUnits} Pcs</p>
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
