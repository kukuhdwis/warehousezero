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
  Ban,
  X,
  Info,
  Trash2
} from 'lucide-react';
import { exportToCSV, purgeTransactions } from '../services/dataService';
import { matchesSearch } from '../utils/searchUtils';
import ConfirmationModal from './ConfirmationModal';

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
  const [showProfitDetails, setShowProfitDetails] = useState(false);

  // Purge State
  const [isPurgeConfirmOpen, setIsPurgeConfirmOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeError, setPurgeError] = useState('');

  const handlePurgeTransactions = async () => {
    setIsPurging(true);
    setPurgeError('');
    try {
      await purgeTransactions(selectedBranchId, currentUser);
      setIsPurgeConfirmOpen(false);
    } catch (err) {
      setPurgeError(err.message || 'Gagal melakukan purge data.');
    } finally {
      setIsPurging(false);
    }
  };

  // Selected Branch Object
  const selectedBranch = branches.find(b => b.id === selectedBranchId);

  // Helper to accurately filter staff assigned to a specific branch (including Staff Pusat for Gudang Utama Pusat)
  const getBranchStaff = (branch) => {
    if (!branch || !users) return [];
    const isPusatBranch = branch.isPusat === true || branch.code === 'GUDANG-PUSAT' || (branch.name || '').toLowerCase().includes('gudang utama pusat');

    return users.filter(u => {
      if (u.role === 'ADMIN') return false; // Exclude root administrator from branch staff count
      
      if (isPusatBranch) {
        return (
          u.role === 'STAFF_PUSAT' || 
          u.role === 'PUSAT' || 
          u.branchId === branch.id || 
          u.branchId === 'branch-pusat-hq' || 
          (u.branchName || '').toLowerCase().includes('gudang utama pusat')
        );
      }
      return u.branchId === branch.id || u.branchName === branch.name;
    });
  };

  // Staff list for selected branch
  const branchStaffList = selectedBranch
    ? getBranchStaff(selectedBranch)
    : users;

  const isPusatSelected = selectedBranch && (
    selectedBranch.isPusat === true || 
    selectedBranch.code === 'GUDANG-PUSAT' || 
    (selectedBranch.name || '').toLowerCase().includes('gudang utama pusat')
  );

  // Branch Inventories belonging to selected branch (or all)
  // GUDANG UTAMA PUSAT: Directly uses master products catalog!
  const branchInventoryItems = React.useMemo(() => {
    if (selectedBranchId === 'ALL') {
      return branchInventories;
    }
    if (isPusatSelected) {
      return products.map(p => ({
        id: p.id,
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        brand: p.brand || 'Generic',
        category: p.category || 'General',
        stockQuantity: Number(p.currentStock) || 0,
        minStock: Number(p.minStock) || 5,
        unit: p.unit || 'Pcs',
        price: Number(p.price) || 0,
        status: 'APPROVED',
        branchId: selectedBranch.id,
        branchName: selectedBranch.name,
        isMasterProduct: true
      }));
    }

    // Match all items for this branch by ID, code, or name
    const branchItems = branchInventories.filter(bi => {
      if (!bi) return false;
      if (bi.branchId === selectedBranchId) return true;
      if (selectedBranch) {
        if (bi.branchId === selectedBranch.id) return true;
        if (selectedBranch.code && bi.branchId === selectedBranch.code) return true;
        if (bi.branchName && selectedBranch.name && bi.branchName.trim().toLowerCase() === selectedBranch.name.trim().toLowerCase()) return true;
      }
      return false;
    });

    // Deduplicate by SKU / productId if any duplicates exist
    const deduplicatedMap = new Map();
    for (const item of branchItems) {
      const key = item.sku || item.productId || item.id;
      if (!deduplicatedMap.has(key)) {
        deduplicatedMap.set(key, item);
      } else {
        const existing = deduplicatedMap.get(key);
        const existingDate = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
        const itemDate = new Date(item.updatedAt || item.createdAt || 0).getTime();
        if (itemDate >= existingDate) {
          deduplicatedMap.set(key, item);
        }
      }
    }
    return Array.from(deduplicatedMap.values());
  }, [selectedBranchId, isPusatSelected, products, branchInventories, selectedBranch]);

  // Filter items by search & stock status
  const filteredInventories = branchInventoryItems.filter(item => {
    const matchesSearchTerm = matchesSearch(searchTerm, item.productName, item.sku, item.brand);

    const isLow = (Number(item.stockQuantity) || 0) <= (Number(item.minStock) || 5);
    const matchesStock = 
      stockFilter === 'ALL' ||
      (stockFilter === 'LOW' && isLow) ||
      (stockFilter === 'SAFE' && !isLow);

    return matchesSearchTerm && matchesStock;
  });

  const branchTransactions = transactions.filter(t => {
    const matchesBranch = selectedBranchId === 'ALL' || t.branchId === selectedBranchId;
    const matchesStaff = selectedStaffName === 'ALL' || t.user === selectedStaffName;
    return matchesBranch && matchesStaff;
  });

  const detailBranchProfit = branchTransactions.reduce((acc, tx) => {
    if (tx.type === 'OUT' && tx.items) {
      return acc + tx.items.reduce((sum, item) => {
        if (item.costPrice !== undefined) {
          return sum + ((Number(item.price) || 0) - (Number(item.costPrice) || 0)) * (Number(item.qty) || 0);
        }
        return sum;
      }, 0);
    }
    return acc;
  }, 0);

  const profitDetails = branchTransactions
    .filter(tx => tx.type === 'OUT' && tx.items)
    .map(tx => {
      let txProfit = 0;
      const profitItems = tx.items.map(item => {
        if (item.costPrice !== undefined) {
          const itemProfit = ((Number(item.price) || 0) - (Number(item.costPrice) || 0)) * (Number(item.qty) || 0);
          txProfit += itemProfit;
          return { ...item, itemProfit };
        }
        return { ...item, itemProfit: 0 };
      });
      return { ...tx, txProfit, profitItems };
    })
    .filter(tx => tx.txProfit !== 0);

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

          <div className="flex items-center gap-2">
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => setIsPurgeConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                title="Purge Data Riwayat Transaksi Cabang Ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Purge Riwayat</span>
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV Cabang</span>
            </button>
          </div>
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
                      {selectedBranch.name.toLowerCase().startsWith('gudang') ? selectedBranch.name : `Gudang ${selectedBranch.name}`}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {isPusatSelected ? '⭐ Master HQ' : (selectedBranch.status || 'Aktif')}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-2">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-sky-400" />
                      PIC: <strong className="text-white">{selectedBranch.pic || selectedBranch.managerName || '-'}</strong>
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
          <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-slate-100 border-t border-slate-100 bg-slate-50/60">
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
            <div 
              className="p-4 text-center cursor-pointer hover:bg-emerald-50 transition group"
              onClick={() => setShowProfitDetails(true)}
            >
              <span className="text-[11px] font-semibold text-emerald-600 uppercase block flex items-center justify-center gap-1">
                Estimasi Profit <Info className="w-3 h-3 text-emerald-500 group-hover:text-emerald-700" />
              </span>
              <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
                Rp {detailBranchProfit.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Profit Details Modal (inside View 1) */}
        {showProfitDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowProfitDetails(false)}></div>
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col relative z-10">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Detail Estimasi Profit</h3>
                    <p className="text-xs text-slate-500">{isPusatSelected ? 'Gudang Pusat' : (selectedBranch ? `Cabang ${selectedBranch.name}` : 'Semua Cabang')}</p>
                  </div>
                </div>
                <button onClick={() => setShowProfitDetails(false)} className="w-8 h-8 rounded-xl hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto flex-1 bg-slate-50">
                {profitDetails.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">Belum ada transaksi penjualan yang menghasilkan profit tercatat.</div>
                ) : (
                  <div className="space-y-4">
                    {profitDetails.map(tx => (
                      <div key={tx.id} className="p-4 rounded-xl border border-slate-100 bg-white shadow-xs">
                        <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-50">
                          <div>
                            <div className="font-bold text-slate-700 text-sm">{tx.id}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{formatTime(tx.timestamp || tx.date)}</div>
                            <div className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full inline-block mt-1">{tx.user || 'Unknown'}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-semibold text-slate-500 uppercase">Profit</div>
                            <div className={`font-bold ${tx.txProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              Rp {tx.txProfit.toLocaleString('id-ID')}
                            </div>
                            {tx.totalPrice > 0 && <div className="text-[10px] text-slate-400">Total: Rp {tx.totalPrice.toLocaleString('id-ID')}</div>}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {tx.profitItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs items-center gap-4">
                              <div className="text-slate-600 font-medium break-words">
                                {item.qty}x {item.productName}
                                <span className="text-slate-400 ml-1">
                                  (Jual: Rp {(Number(item.price) || 0).toLocaleString('id-ID')} - Modal: Rp {(Number(item.costPrice) || 0).toLocaleString('id-ID')})
                                </span>
                              </div>
                              <div className={`font-semibold flex-shrink-0 ${item.itemProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                Rp {item.itemProfit.toLocaleString('id-ID')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-5 border-t border-slate-100 bg-slate-50/80 flex justify-between items-center">
                <span className="font-semibold text-slate-600 text-sm">Total Keseluruhan Profit</span>
                <span className="text-lg font-bold text-emerald-700">Rp {detailBranchProfit.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* SECTION A: INVENTORY PRODUCTS IN BRANCH    */}
        {/* ========================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Boxes className="w-5 h-5 text-sky-600" />
                <span>{isPusatSelected ? `Daftar Stok Fisik Master di ${selectedBranch.name}` : `Daftar Stok Fisik Barang di ${selectedBranch.name}`}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isPusatSelected 
                  ? 'Stok fisik induk katalog master di Gudang Utama Pusat (Master Hub).' 
                  : 'Stok fisik yang telah diajukan cabang dan diverifikasi/disetujui oleh Kantor Pusat.'}
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
                <h4 className="font-bold text-slate-800 text-sm sm:text-base">
                  {isPusatSelected ? 'Belum Ada Produk di Katalog Master' : 'Gudang Cabang Ini Belum Memiliki Data Barang'}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {isPusatSelected 
                    ? 'Silakan tambahkan produk master baru melalui menu Master Data Produk.' 
                    : 'Inventaris barang akan otomatis terdata secara real-time saat staf cabang mengajukan inventaris produk dan telah disetujui oleh Pusat.'}
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
              <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5 min-w-[200px]">Nama Produk & Merk</th>
                      <th className="px-4 py-3.5 whitespace-nowrap min-w-[130px]">SKU</th>
                      <th className="px-4 py-3.5 text-right whitespace-nowrap min-w-[110px]">Harga Unit</th>
                      <th className="px-4 py-3.5 text-center whitespace-nowrap min-w-[120px]">Stok Fisik</th>
                      <th className="px-4 py-3.5 text-right whitespace-nowrap min-w-[130px]">Total Nilai (Rp)</th>
                      <th className="px-5 py-3.5 text-center whitespace-nowrap min-w-[140px]">Status Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInventories.map((item) => {
                      const isLow = (Number(item.stockQuantity) || 0) <= (Number(item.minStock) || 5);
                      const lineVal = (Number(item.stockQuantity) || 0) * (Number(item.price) || 0);
                      const isApproved = item.status === 'APPROVED';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-5 py-3.5 font-medium text-slate-900 min-w-[200px]">
                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                              <span className="font-bold text-slate-900 leading-snug">{item.productName}</span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap flex-shrink-0">
                                {item.brand || 'Generic'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-600 font-mono font-bold whitespace-nowrap">{item.sku}</td>
                          <td className="px-4 py-3.5 text-right text-slate-700 text-xs font-semibold whitespace-nowrap">
                            Rp {(Number(item.price) || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                              !isApproved 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : isLow 
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}>
                              {item.stockQuantity} {item.unit || 'Pcs'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-extrabold text-slate-900 text-xs whitespace-nowrap">
                            Rp {lineVal.toLocaleString('id-ID')}
                          </td>
                          <td className="px-5 py-3.5 text-center whitespace-nowrap">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                <Check className="w-3.5 h-3.5" />
                                Aktif (Disetujui)
                              </span>
                            ) : item.status === 'PENDING_APPROVAL' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse whitespace-nowrap">
                                <Clock className="w-3.5 h-3.5" />
                                Menunggu Validasi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                                <Ban className="w-3.5 h-3.5" />
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

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => setIsPurgeConfirmOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs transition cursor-pointer shadow-xs border border-rose-200"
              title="Purge Data Riwayat Transaksi Seluruh Cabang & Pusat"
            >
              <Trash2 className="w-4 h-4" />
              <span>Purge Semua Riwayat</span>
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-xs transition active:scale-98 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Rekap Semua Cabang</span>
          </button>
        </div>
      </div>

      {/* Global Consolidated KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-4">
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
        <div className="bg-emerald-50/50 p-3.5 sm:p-5 rounded-2xl border border-emerald-200 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase">Estimasi Profit</p>
          <h3 className="text-sm sm:text-xl font-bold text-emerald-700 mt-1 truncate">
            Rp {transactions.reduce((acc, tx) => {
              if (tx.type === 'OUT' && tx.items) {
                return acc + tx.items.reduce((sum, item) => {
                  if (item.costPrice !== undefined) {
                    return sum + ((Number(item.price) || 0) - (Number(item.costPrice) || 0)) * (Number(item.qty) || 0);
                  }
                  return sum;
                }, 0);
              }
              return acc;
            }, 0).toLocaleString('id-ID')}
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
              const bStaff = getBranchStaff(branch);
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
                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center">
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
                    <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="text-[10px] text-emerald-600 uppercase">Profit</p>
                      <p className="font-bold text-emerald-700 text-sm mt-0.5" title={`Rp ${transactions.filter(t => t.branchId === branch.id).reduce((acc, tx) => {
                        if (tx.type === 'OUT' && tx.items) {
                          return acc + tx.items.reduce((sum, item) => {
                            if (item.costPrice !== undefined) {
                              return sum + ((Number(item.price) || 0) - (Number(item.costPrice) || 0)) * (Number(item.qty) || 0);
                            }
                            return sum;
                          }, 0);
                        }
                        return acc;
                      }, 0).toLocaleString('id-ID')}`}>
                        {(() => {
                          const profit = transactions.filter(t => t.branchId === branch.id).reduce((acc, tx) => {
                            if (tx.type === 'OUT' && tx.items) {
                              return acc + tx.items.reduce((sum, item) => {
                                if (item.costPrice !== undefined) {
                                  return sum + ((Number(item.price) || 0) - (Number(item.costPrice) || 0)) * (Number(item.qty) || 0);
                                }
                                return sum;
                              }, 0);
                            }
                            return acc;
                          }, 0);
                          return profit > 1000000 ? `${(profit / 1000000).toFixed(1)}M` : profit > 1000 ? `${(profit / 1000).toFixed(1)}K` : profit;
                        })()}
                      </p>
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

      {/* ADMIN PURGE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={isPurgeConfirmOpen}
        onClose={() => {
          setIsPurgeConfirmOpen(false);
          setPurgeError('');
        }}
        onConfirm={handlePurgeTransactions}
        title="Peringatan Kritis: Purge Data ⚠️"
        message={
          <div className="space-y-4">
            <div className="bg-rose-50 text-rose-800 p-4 rounded-xl flex gap-3 text-sm border border-rose-200">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <p>
                Anda akan menghapus <strong>SELURUH</strong> riwayat transaksi (Barang Masuk & Keluar) secara permanen untuk 
                <span className="font-bold underline ml-1">
                  {selectedBranchId === 'ALL' ? 'SEMUA CABANG & PUSAT' : `CABANG TEPILIH (${selectedBranch?.name || ''})`}
                </span>.
              </p>
            </div>
            <p className="text-slate-600 text-sm font-semibold">
              Tindakan ini bersifat destruktif dan TIDAK DAPAT dibatalkan. Riwayat yang dihapus tidak bisa dikembalikan.
            </p>
            {purgeError && (
              <p className="text-sm font-bold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                Error: {purgeError}
              </p>
            )}
          </div>
        }
        confirmText={isPurging ? "Memproses Purge..." : "Ya, Hapus Permanen!"}
        cancelText="Batal"
        isDangerous={true}
        isLoading={isPurging}
      />
    </div>
  );
}
