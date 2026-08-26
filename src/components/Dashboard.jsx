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
  History
} from 'lucide-react';

export default function Dashboard({ 
  currentUser, 
  products = [], 
  transactions = [], 
  branches = [], 
  users = [], 
  onNavigate,
  onLogout 
}) {
  const isAdmin = currentUser?.role === 'ADMIN';

  // Metric Calculations
  const totalItemTypes = products.length;
  const totalStockQuantity = products.reduce((acc, p) => acc + (Number(p.currentStock) || 0), 0);
  const lowStockProducts = products.filter(p => (Number(p.currentStock) || 0) <= (Number(p.minStock) || 0));
  const totalValuation = products.reduce((acc, p) => acc + ((Number(p.currentStock) || 0) * (Number(p.price) || 0)), 0);

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Welcome Banner & Page Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Halo, {currentUser?.name || 'Pengguna'} 👋
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              isAdmin 
                ? 'bg-sky-100 text-sky-800 border border-sky-200' 
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {isAdmin ? 'Admin' : 'Staff'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cabang: <strong className="text-slate-700">{currentUser?.branchName || (currentUser?.branchId === 'ALL' ? 'Semua Cabang (Pusat)' : currentUser?.branchId)}</strong>
          </p>
        </div>

        {/* Quick Action Grid (Touch Friendly for Smartphones) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={() => onNavigate('stock-in')}
            className="flex items-center justify-center gap-2 py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition active:scale-98 cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Barang Masuk</span>
          </button>
          
          <button
            onClick={() => onNavigate('stock-out')}
            className="flex items-center justify-center gap-2 py-3 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs transition active:scale-98 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Barang Keluar</span>
          </button>

          {isAdmin ? (
            <button
              onClick={() => onNavigate('products')}
              className="flex items-center justify-center gap-2 py-3 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-xs transition active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('products')}
              className="flex items-center justify-center gap-2 py-3 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-xs transition active:scale-98 cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Katalog Produk</span>
            </button>
          )}

          {isAdmin ? (
            <button
              onClick={() => onNavigate('monitoring')}
              className="flex items-center justify-center gap-2 py-3 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-xs transition active:scale-98 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Monitoring Cabang</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('history')}
              className="flex items-center justify-center gap-2 py-3 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-xs transition active:scale-98 cursor-pointer"
            >
              <History className="w-4 h-4" />
              <span>Riwayat Transaksi</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Cards Grid (2 cols on mobile, 4 cols on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Card 1: Total SKU */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Produk</p>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900 mt-0.5 sm:mt-1">{totalItemTypes} <span className="text-[10px] sm:text-xs font-normal text-slate-500">SKU</span></h3>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 2: Total Unit */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Unit Stok</p>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900 mt-0.5 sm:mt-1">{totalStockQuantity.toLocaleString('id-ID')} <span className="text-[10px] sm:text-xs font-normal text-slate-500">Pcs</span></h3>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Boxes className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 3: Low Stock */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Stok Menipis</p>
            <h3 className="text-lg sm:text-2xl font-bold text-amber-600 mt-0.5 sm:mt-1">{lowStockProducts.length} <span className="text-[10px] sm:text-xs font-normal text-amber-700/80">Item</span></h3>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 4: Valuation */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Nilai Stok</p>
            <h3 className="text-sm sm:text-xl font-bold text-emerald-600 mt-0.5 sm:mt-1 truncate max-w-[130px] sm:max-w-none">
              Rp {totalValuation.toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Left Column: Low Stock Alerts */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm">Peringatan Stok Menipis</h3>
            </div>
            <span className="text-[10px] sm:text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full">
              {lowStockProducts.length} Perlu Restock
            </span>
          </div>

          {/* Mobile Card List for Low Stock Alerts */}
          <div className="block md:hidden divide-y divide-slate-100">
            {lowStockProducts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                🎉 Semua stok dalam kondisi aman di atas batas minimum.
              </div>
            ) : (
              lowStockProducts.map((prod) => (
                <div key={prod.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-slate-900 text-xs truncate">{prod.name}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="font-mono">{prod.sku}</span>
                      <span>•</span>
                      <span>Min: {prod.minStock} {prod.unit}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg text-xs">
                      {prod.currentStock} {prod.unit}
                    </span>
                    <button
                      onClick={() => onNavigate('stock-in')}
                      className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg active:scale-95 transition"
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
              <div className="p-8 text-center text-slate-400 text-sm">
                🎉 Semua stok dalam kondisi aman di atas batas minimum.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Produk</th>
                    <th className="px-4 py-3">Lokasi / Cabang</th>
                    <th className="px-4 py-3">Stok Saat Ini</th>
                    <th className="px-4 py-3">Stok Min</th>
                    <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-3.5 font-medium text-slate-900">
                        <div>{prod.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{prod.sku}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 text-xs">
                        {prod.branchName || prod.location || '-'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md text-xs">
                          {prod.currentStock} {prod.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">{prod.minStock} {prod.unit}</td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => onNavigate('stock-in')}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg transition cursor-pointer"
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm">Aktivitas Terakhir</h3>
            <button 
              onClick={() => onNavigate('history')} 
              className="text-xs text-sky-600 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentTransactions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Belum ada riwayat transaksi.</p>
            ) : (
              recentTransactions.map((tx) => {
                const isIn = tx.type === 'IN';
                return (
                  <div key={tx.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                    <div className={`p-1.5 rounded-xl flex-shrink-0 mt-0.5 ${isIn ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {isIn ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="text-xs font-bold text-slate-800 truncate">{tx.productName}</p>
                        <span className={`text-xs font-bold ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isIn ? '+' : '-'}{tx.qty}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{tx.notes || tx.user || 'Sistem'}</p>
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
