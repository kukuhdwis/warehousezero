import React from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  Boxes,
  Users,
  Building2,
  MapPin,
  ChevronRight,
  Eye,
  History,
  Coins,
  Trophy,
  Flame
} from 'lucide-react';
import { 
  calculateTxProfit, 
  getCurrentMonthKey, 
  formatMonthLabel, 
  isTxInSelectedMonth 
} from './BranchMonitoring';

export default function Dashboard({ 
  currentUser, 
  products = [], 
  branchInventories = [],
  transactions = [], 
  stockRequests = [],
  branches = [], 
  users = [], 
  onNavigate,
  onLogout 
}) {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isStaffPusat = currentUser?.role === 'STAFF_PUSAT' || currentUser?.role === 'PUSAT';
  const isBranchStaff = currentUser?.role === 'STAFF_BRANCH';

  // Pending branch inventory requests waiting for HQ approval
  const pendingBranchRequests = isBranchStaff
    ? branchInventories.filter(bi => {
        const userBranchId = (currentUser?.branchId || '').toLowerCase();
        const userBranchName = (currentUser?.branchName || '').toLowerCase();
        const itemBranchId = (bi.branchId || '').toLowerCase();
        const itemBranchName = (bi.branchName || '').toLowerCase();

        const matchesBranch = (
          (userBranchId && (itemBranchId === userBranchId || itemBranchName === userBranchId)) ||
          (userBranchName && (itemBranchName === userBranchName || itemBranchId === userBranchName))
        );
        return matchesBranch && bi.status === 'PENDING_APPROVAL';
      })
    : [];

  // Metric Calculations
  const totalItemTypes = products.length;
  const totalStockQuantity = products.reduce((acc, p) => acc + (Number(p.currentStock) || 0), 0);
  const lowStockProducts = products.filter(p => (Number(p.currentStock) || 0) <= (Number(p.minStock) || 0));
  const totalValuation = products.reduce((acc, p) => acc + ((Number(p.currentStock) || 0) * (Number(p.price) || 0)), 0);

  // Current Month Key (e.g. '2026-09')
  const currentMonthKey = React.useMemo(() => getCurrentMonthKey(), []);

  // Scoped transactions for monthly profit calculation
  const scopedProfitTransactions = React.useMemo(() => {
    return transactions.filter(t => {
      // Must be in current month
      if (!isTxInSelectedMonth(t, currentMonthKey)) return false;
      
      // Branch scoping for branch staff
      if (isBranchStaff) {
        return (
          t.branchId === currentUser?.branchId || 
          (currentUser?.branchName && t.branchName && t.branchName.trim().toLowerCase() === currentUser?.branchName.trim().toLowerCase()) ||
          t.user === currentUser?.name
        );
      }
      return true;
    });
  }, [isBranchStaff, transactions, currentUser, currentMonthKey]);

  const totalEstimatedProfit = React.useMemo(() => {
    return scopedProfitTransactions.reduce((acc, tx) => {
      if (tx.type === 'OUT') {
        const { txProfit } = calculateTxProfit(tx, products, branchInventories);
        return acc + txProfit;
      }
      return acc;
    }, 0);
  }, [scopedProfitTransactions, products, branchInventories]);

  // Top Selling Products Calculation for Dashboard
  const topSellingProducts = React.useMemo(() => {
    const salesMap = new Map();

    scopedProfitTransactions.forEach(tx => {
      if (tx.type !== 'OUT') return;
      const { profitItems } = calculateTxProfit(tx, products, branchInventories);

      if (profitItems && profitItems.length > 0) {
        profitItems.forEach(pi => {
          const qty = Number(pi.qty || 1);
          const price = Number(pi.price || 0);
          const name = pi.productName || tx.productName || 'Barang';
          const sku = pi.sku || tx.sku || '-';
          const key = sku !== '-' ? sku : name;

          const currentStockItem = products.find(p => p.sku === sku || p.name === name) ||
            branchInventories.find(bi => bi.sku === sku || bi.productName === name);

          if (!salesMap.has(key)) {
            salesMap.set(key, {
              key,
              sku,
              productName: name,
              brand: currentStockItem?.brand || pi.brand || 'Generic',
              totalQty: 0,
              totalRevenue: 0,
              currentStock: Number(currentStockItem?.stockQuantity ?? currentStockItem?.currentStock ?? 0),
              minStock: Number(currentStockItem?.minStock ?? 5),
              unit: pi.unit || currentStockItem?.unit || 'Pcs'
            });
          }

          const record = salesMap.get(key);
          record.totalQty += qty;
          record.totalRevenue += price * qty;
        });
      } else {
        const qty = Number(tx.qty || 1);
        const price = Number(tx.price || (tx.totalPrice ? (tx.totalPrice / qty) : 0));
        const name = tx.productName || 'Barang';
        const sku = tx.sku || '-';
        const key = sku !== '-' ? sku : name;

        const currentStockItem = products.find(p => p.sku === sku || p.name === name) ||
          branchInventories.find(bi => bi.sku === sku || bi.productName === name);

        if (!salesMap.has(key)) {
          salesMap.set(key, {
            key,
            sku,
            productName: name,
            brand: currentStockItem?.brand || 'Generic',
            totalQty: 0,
            totalRevenue: 0,
            currentStock: Number(currentStockItem?.stockQuantity ?? currentStockItem?.currentStock ?? 0),
            minStock: Number(currentStockItem?.minStock ?? 5),
            unit: tx.unit || currentStockItem?.unit || 'Pcs'
          });
        }

        const record = salesMap.get(key);
        record.totalQty += qty;
        record.totalRevenue += tx.totalPrice ? Number(tx.totalPrice) : (price * qty);
      }
    });

    const list = Array.from(salesMap.values());
    list.sort((a, b) => b.totalQty - a.totalQty);
    return list;
  }, [scopedProfitTransactions, products, branchInventories]);

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Welcome Banner & Page Header with High-Octane Industrial Aesthetic */}
      <div className="relative overflow-hidden bg-paper dark:bg-zinc-950 p-4 sm:p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm space-y-4 transition-colors">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-ember/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-display uppercase tracking-wide font-bold text-zinc-900 dark:text-white">
                Halo, {currentUser?.name || 'Pengguna'} 👋
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-display uppercase tracking-wider font-bold ${
                isAdmin 
                  ? 'bg-ember-tint dark:bg-ember/20 text-ember border border-ember/30' 
                  : isStaffPusat
                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                    : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
              }`}>
                {isAdmin ? 'Lord Admin Pusat' : isStaffPusat ? 'Staff Pusat' : 'Staff Cabang'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Gudang & Lokasi: <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">{currentUser?.branchName || (currentUser?.branchId === 'ALL' ? 'Semua Cabang (Pusat)' : currentUser?.branchId)}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 font-medium">
              Periode: {formatMonthLabel(currentMonthKey)}
            </span>
          </div>
        </div>

        {/* Quick Action Grid (Touch Friendly for Smartphones) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <button
            onClick={() => onNavigate('stock-in')}
            className="flex items-center justify-center gap-2 py-3 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-display uppercase tracking-wider font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Barang Masuk</span>
          </button>
          
          <button
            onClick={() => onNavigate('stock-out')}
            className="flex items-center justify-center gap-2 py-3 px-3.5 bg-ember hover:bg-ember-deep text-white rounded-xl font-display uppercase tracking-wider font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Barang Keluar</span>
          </button>

          {isAdmin ? (
            <button
              onClick={() => onNavigate('products')}
              className="flex items-center justify-center gap-2 py-3 px-3.5 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white border border-zinc-700 dark:border-zinc-600 hover:border-ember rounded-xl font-display uppercase tracking-wider font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-ember" />
              <span>Tambah Produk</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('products')}
              className="flex items-center justify-center gap-2 py-3 px-3.5 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white border border-zinc-700 dark:border-zinc-600 hover:border-ember rounded-xl font-display uppercase tracking-wider font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer"
            >
              <Package className="w-4 h-4 text-ember" />
              <span>Katalog Produk</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('monitoring')}
            className="flex items-center justify-center gap-2 py-3 px-3.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-xl font-display uppercase tracking-wider font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-amber-500" />
            <span>{currentUser?.role === 'STAFF_BRANCH' ? 'Monitoring Toko' : 'Monitoring Cabang'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid (2 cols on mobile, 5 cols on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
        
        {/* Card 1: Total SKU */}
        <div className="bg-paper dark:bg-zinc-950 p-3.5 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-[10px] sm:text-xs font-display uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500">Total Produk</p>
            <h3 className="text-lg sm:text-2xl font-display font-black text-zinc-900 dark:text-white mt-0.5 sm:mt-1">{totalItemTypes} <span className="font-body text-[10px] sm:text-xs font-normal text-zinc-400">SKU</span></h3>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-ember-tint dark:bg-ember/15 text-ember border border-ember/20 flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 2: Total Unit */}
        <div className="bg-paper dark:bg-zinc-950 p-3.5 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-[10px] sm:text-xs font-display uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500">Unit Stok</p>
            <h3 className="text-lg sm:text-2xl font-display font-black text-zinc-900 dark:text-white mt-0.5 sm:mt-1">{totalStockQuantity.toLocaleString('id-ID')} <span className="font-body text-[10px] sm:text-xs font-normal text-zinc-400">Pcs</span></h3>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center flex-shrink-0">
            <Boxes className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 3: Low Stock */}
        <div className="bg-paper dark:bg-zinc-950 p-3.5 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-[10px] sm:text-xs font-display uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500">Stok Menipis</p>
            <h3 className="text-lg sm:text-2xl font-display font-black text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1">{lowStockProducts.length} <span className="font-body text-[10px] sm:text-xs font-normal text-amber-700/80 dark:text-amber-300/80">Item</span></h3>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 4: Valuation */}
        <div className="bg-paper dark:bg-zinc-950 p-3.5 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-[10px] sm:text-xs font-display uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500">Nilai Stok</p>
            <h3 className="text-sm sm:text-xl font-display font-black text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1 truncate max-w-[130px] sm:max-w-none">
              Rp {totalValuation.toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 5: Estimasi Profit */}
        <div 
          onClick={() => onNavigate('monitoring')}
          className="bg-gradient-to-br from-emerald-500/10 via-paper dark:via-zinc-950 to-emerald-500/5 p-3.5 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-400 transition group"
          title="Klik untuk membuka rincian monitoring profit cabang"
        >
          <div>
            <p className="text-[10px] sm:text-xs font-display uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
              Profit Bulan Ini <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
            </p>
            <h3 className="text-sm sm:text-xl font-display font-black text-emerald-800 dark:text-emerald-200 mt-0.5 sm:mt-1 truncate max-w-[130px] sm:max-w-none">
              Rp {totalEstimatedProfit.toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition">
            <Coins className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Branch Staff Empty Inventory Alert Banner */}
      {isBranchStaff && products.length === 0 && (
        <div className="bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 p-6 sm:p-8 rounded-2xl text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-2xl flex items-center justify-center mx-auto">
            <Boxes className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-display uppercase tracking-wider font-bold text-amber-950 dark:text-amber-100 text-base sm:text-lg">
              Inventaris Gudang Cabang Belum Aktif
            </h3>
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 max-w-md mx-auto mt-1">
              Cabang <strong>{currentUser?.branchName || 'Cabang'}</strong> belum memiliki inventaris produk yang disetujui. Silakan ajukan inventaris produk dari Katalog Master ke Kantor Pusat agar stok cabang dapat disetujui & aktif.
            </p>
          </div>

          {pendingBranchRequests.length > 0 ? (
            <div className="p-3 bg-paper dark:bg-zinc-900 border border-amber-300 dark:border-amber-700/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 font-semibold inline-flex items-center gap-2">
              <span>⏳</span>
              <span>Ada <strong>{pendingBranchRequests.length} pengajuan inventaris</strong> yang sedang menunggu persetujuan Admin Pusat.</span>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('products')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-display uppercase tracking-wider font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Ajukan Inventaris Produk ke Pusat</span>
            </button>
          )}
        </div>
      )}

      {/* TOP SELLING PRODUCTS WIDGET FOR DASHBOARD */}
      {topSellingProducts.length > 0 && (
        <div className="bg-paper dark:bg-zinc-950 p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-display uppercase tracking-wider font-bold text-zinc-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>
                  {isBranchStaff ? `Produk Terlaris di ${currentUser?.branchName || 'Cabang'}` : 'Top Produk Terlaris Bulan Ini'}
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Produk dengan pergerakan transaksi keluar tercepat pada periode <strong className="text-zinc-800 dark:text-zinc-200">{formatMonthLabel(currentMonthKey)}</strong>.
              </p>
            </div>

            <button
              onClick={() => onNavigate('monitoring')}
              className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-display uppercase tracking-wider font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{topSellingProducts.reduce((sum, p) => sum + p.totalQty, 0)} Pcs Terjual • Lihat Detail</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {topSellingProducts.slice(0, 5).map((item, idx) => {
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
              const isTop1 = idx === 0;
              const isLow = item.currentStock <= item.minStock;

              return (
                <div 
                  key={item.key} 
                  className={`p-3.5 rounded-xl border transition flex flex-col justify-between gap-2.5 ${
                    isTop1 
                      ? 'bg-gradient-to-br from-amber-500/10 via-paper dark:via-zinc-900 to-amber-500/5 border-amber-300 dark:border-amber-700/60 shadow-2xs' 
                      : 'bg-zinc-50/70 dark:bg-zinc-900/60 hover:bg-zinc-100/80 dark:hover:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-sm font-black">{medal}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-display uppercase tracking-wider font-extrabold bg-ember-tint dark:bg-ember/20 text-ember border border-ember/30">
                        {item.brand}
                      </span>
                    </div>
                    <h4 className="font-bold text-zinc-900 dark:text-white text-xs line-clamp-1" title={item.productName}>
                      {item.productName}
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 block">{item.sku}</span>
                  </div>

                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                    <span className="font-display font-black text-zinc-900 dark:text-white flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-ember" />
                      <span>{item.totalQty} {item.unit}</span>
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isLow ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-400 font-mono'
                    }`}>
                      {isLow ? `Sisa ${item.currentStock}` : `Rp ${item.totalRevenue >= 1000000 ? `${(item.totalRevenue / 1000000).toFixed(1)}M` : item.totalRevenue.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Left Column: Low Stock Alerts */}
        <div className="lg:col-span-2 bg-paper dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-xs overflow-hidden transition-colors">
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              <h3 className="font-display uppercase tracking-wider font-bold text-zinc-900 dark:text-white text-xs sm:text-sm">Peringatan Stok Menipis</h3>
            </div>
            <span className="text-[10px] sm:text-xs bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-display uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full">
              {lowStockProducts.length} Perlu Restock
            </span>
          </div>

          {/* Mobile Card List for Low Stock Alerts */}
          <div className="block md:hidden divide-y divide-zinc-200 dark:divide-zinc-800">
            {lowStockProducts.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                🎉 Semua stok dalam kondisi aman di atas batas minimum.
              </div>
            ) : (
              lowStockProducts.map((prod) => (
                <div key={prod.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-zinc-900 dark:text-white text-xs truncate">{prod.name}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                      <span className="font-mono">{prod.sku}</span>
                      <span>•</span>
                      <span>Min: {prod.minStock} {prod.unit}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-1 rounded-lg text-xs">
                      {prod.currentStock} {prod.unit}
                    </span>
                    <button
                      onClick={() => onNavigate('stock-in')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-display uppercase tracking-wider font-bold rounded-lg active:scale-95 transition cursor-pointer"
                    >
                      + Masuk
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table for Low Stock Alerts */}
          <div className="hidden md:block overflow-x-auto">
            {lowStockProducts.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 dark:text-zinc-500 text-sm">
                🎉 Semua stok dalam kondisi aman di atas batas minimum.
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 text-xs font-display uppercase tracking-wider font-bold border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-3.5 min-w-[200px]">Produk</th>
                    <th className="px-4 py-3.5 whitespace-nowrap min-w-[140px]">Lokasi / Cabang</th>
                    <th className="px-4 py-3.5 text-center whitespace-nowrap min-w-[120px]">Stok Saat Ini</th>
                    <th className="px-4 py-3.5 text-center whitespace-nowrap min-w-[100px]">Stok Min</th>
                    <th className="px-6 py-3.5 text-right whitespace-nowrap min-w-[100px]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {lowStockProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 transition">
                      <td className="px-6 py-3.5 font-medium text-zinc-900 dark:text-white min-w-[200px]">
                        <div className="font-bold text-zinc-900 dark:text-white leading-snug">{prod.name}</div>
                        <div className="text-xs text-zinc-400 dark:text-zinc-500 font-mono mt-0.5 whitespace-nowrap">SKU: {prod.sku}</div>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300 text-xs whitespace-nowrap font-medium">
                        {prod.branchName || (isBranchStaff ? currentUser?.branchName : 'Semua Cabang (Pusat)')}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className="inline-block font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-md text-xs border border-rose-200/60 dark:border-rose-800/50 whitespace-nowrap">
                          {prod.currentStock} {prod.unit || 'Pcs'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-zinc-600 dark:text-zinc-300 text-xs whitespace-nowrap font-semibold">
                        {prod.minStock} {prod.unit || 'Pcs'}
                      </td>
                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => onNavigate('stock-in')}
                          className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-display uppercase tracking-wider font-bold rounded-lg transition cursor-pointer whitespace-nowrap"
                        >
                          Restock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="bg-paper dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-xs p-4 sm:p-6 space-y-3 sm:space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
            <h3 className="font-display uppercase tracking-wider font-bold text-zinc-900 dark:text-white text-xs sm:text-sm">Aktivitas Terakhir</h3>
            <button 
              onClick={() => onNavigate('history')} 
              className="text-xs text-ember hover:text-ember-deep font-display uppercase tracking-wider font-bold cursor-pointer flex items-center gap-0.5"
            >
              <span>Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentTransactions.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-4">Belum ada riwayat transaksi.</p>
            ) : (
              recentTransactions.map((tx) => {
                const isIn = tx.type === 'IN';
                return (
                  <div key={tx.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/80">
                    <div className={`p-1.5 rounded-xl flex-shrink-0 mt-0.5 ${
                      isIn 
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300' 
                        : 'bg-ember-tint dark:bg-ember/20 text-ember'
                    }`}>
                      {isIn ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-200 truncate">{tx.productName}</p>
                        <span className={`text-xs font-display font-black ${isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-ember'}`}>
                          {isIn ? '+' : '-'}{tx.qty}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{tx.notes || tx.user || 'Sistem'}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
