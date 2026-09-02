import React, { useState } from 'react';
import { matchesSearch } from '../utils/searchUtils';
import { History, Download, ArrowDownLeft, ArrowUpRight, Filter, Search, User, Clock, FileText, Trash2, AlertTriangle } from 'lucide-react';
import { exportToCSV, purgeTransactions } from '../services/dataService';
import ConfirmationModal from './ConfirmationModal';

export default function TransactionHistory({ transactions = [], currentUser, onTransactionUpdate }) {
  const isBranchStaff = currentUser?.role === 'STAFF_BRANCH';
  const branchId = currentUser?.branchId;

  const formatTime = (ts) => {
    if (!ts) return '-';
    try {
      if (ts.toDate) return ts.toDate().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      return new Date(ts).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '-';
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isPurgeConfirmOpen, setIsPurgeConfirmOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeError, setPurgeError] = useState('');

  // Branch data isolation: Branch Staff only sees their own branch's transactions!
  const scopedTransactions = transactions.filter(tx => {
    if (isBranchStaff && branchId) {
      return tx.branchId === branchId || tx.targetBranchId === branchId;
    }
    if (!isBranchStaff) {
      if (selectedBranchFilter !== 'ALL') {
        return tx.branchId === selectedBranchFilter || tx.targetBranchId === selectedBranchFilter;
      } else {
        // Admin default view: Only show Pusat transactions
        return !tx.branchId || tx.branchId === 'ALL' || tx.branchId === 'PUSAT' || tx.source === 'PUSAT' || tx.targetBranchId === 'PUSAT';
      }
    }
    return true;
  });

  const filteredTransactions = scopedTransactions.filter(tx => {
    const matchesSearchTerm = matchesSearch(searchTerm, tx.productName, tx.sku, tx.notes, tx.user, tx.branchName);
    
    const matchesType = typeFilter === 'ALL' || tx.type === typeFilter;
    return matchesSearchTerm && matchesType;
  });

  const handleExport = (exportType = 'ALL') => {
    const formattedData = [];
    
    // Filter transactions based on the selected exportType
    const transactionsToExport = filteredTransactions.filter(tx => {
      if (exportType === 'ALL') return true;
      if (exportType === 'IN') return tx.type === 'IN';
      if (exportType === 'OUT') return tx.type !== 'IN';
      if (exportType === 'OUT_SHOPEE') return tx.type !== 'IN' && (tx.notes || '').toLowerCase().includes('shopee');
      if (exportType === 'OUT_TOKOPEDIA') return tx.type !== 'IN' && (tx.notes || '').toLowerCase().includes('tokopedia');
      if (exportType === 'OUT_TIKTOK') return tx.type !== 'IN' && (tx.notes || '').toLowerCase().includes('tiktok');
      if (exportType === 'OUT_OFFLINE') return tx.type !== 'IN' && ((tx.notes || '').toLowerCase().includes('offline') || (tx.notes || '').toLowerCase().includes('cabang'));
      return true;
    });

    transactionsToExport.forEach(tx => {
      const isOutboundOrSale = tx.type !== 'IN';
      
      if (tx.items && tx.items.length > 0) {
        // Flatten multi-item transactions
        tx.items.forEach(item => {
          const itemQty = Number(item.qty || item.qty_in || 1);
          const itemPrice = Number(item.price || 0);
          const itemTotal = item.subtotal || (itemPrice * itemQty);
          
          formattedData.push({
            ID: tx.id,
            Tipe: tx.type === 'IN' ? 'Barang Masuk' : 'Barang Keluar',
            SKU: item.sku || '-',
            Nama_Produk: item.productName || item.product_name || item.name || '-',
            Jumlah: itemQty,
            Harga_Satuan: isOutboundOrSale ? `Rp ${itemPrice}` : '-',
            Total_Harga: isOutboundOrSale ? `Rp ${itemTotal}` : '-',
            Catatan: tx.notes || '-',
            Petugas: tx.user || '-',
            Waktu: formatTime(tx.createdAt)
          });
        });
      } else {
        // Single item transaction fallback
        const qty = Number(tx.qty || 1);
        const price = Number(tx.price || 0);
        const total = Number(tx.totalPrice || tx.totalValue || (price * qty));
        
        formattedData.push({
          ID: tx.id,
          Tipe: tx.type === 'IN' ? 'Barang Masuk' : 'Barang Keluar',
          SKU: tx.sku || '-',
          Nama_Produk: tx.productName || '-',
          Jumlah: qty,
          Harga_Satuan: isOutboundOrSale ? `Rp ${price}` : '-',
          Total_Harga: isOutboundOrSale ? `Rp ${total}` : '-',
          Catatan: tx.notes || '-',
          Petugas: tx.user || '-',
          Waktu: formatTime(tx.createdAt)
        });
      }
    });

    let filenameSuffix = exportType;
    if (exportType.startsWith('OUT_')) {
      filenameSuffix = `Keluar-${exportType.replace('OUT_', '')}`;
    }
    
    exportToCSV(formattedData, `WMS-Riwayat-Transaksi-${filenameSuffix}-${Date.now()}.csv`);
    setIsExportMenuOpen(false);
  };

  const handlePurgeTransactions = async () => {
    setIsPurging(true);
    setPurgeError('');
    try {
      const deletedCount = await purgeTransactions(selectedBranchFilter, currentUser);
      setIsPurgeConfirmOpen(false);
      if (onTransactionUpdate) {
        onTransactionUpdate(); // Trigger refresh in parent
      } else {
        // Fallback reload if prop not provided
        window.location.reload();
      }
      alert(`Berhasil menghapus ${deletedCount} riwayat transaksi secara permanen.`);
    } catch (err) {
      setPurgeError(err.message);
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Riwayat Transaksi Stok</h2>
          <p className="text-xs sm:text-sm text-slate-500">Audit trail pergerakan stok barang masuk (Inbound) & keluar (Outbound).</p>
        </div>

        <div className="flex items-center gap-2 relative">
          {/* PURGE BUTTON (ADMIN ONLY) */}
          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => setIsPurgeConfirmOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-sm shadow-xs transition active:scale-98 cursor-pointer"
              title="Bersihkan Semua Data Riwayat (Admin Only)"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Purge Data</span>
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-sm shadow-xs transition active:scale-98 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV / Excel</span>
          </button>
          
          {isExportMenuOpen && (
            <>
              {/* Backdrop to close menu */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsExportMenuOpen(false)}
              ></div>
              
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 origin-top-right">
                <div className="p-1 text-slate-700 font-medium text-sm">
                  <button
                    onClick={() => handleExport('ALL')}
                    className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-slate-50 transition cursor-pointer flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Semua Transaksi</span>
                  </button>
                  <button
                    onClick={() => handleExport('OUT')}
                    className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer flex items-center gap-2"
                  >
                    <ArrowUpRight className="w-4 h-4 text-rose-500" />
                    <span>Hanya Pengeluaran (Keluar)</span>
                  </button>
                  <button
                    onClick={() => handleExport('IN')}
                    className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition cursor-pointer flex items-center gap-2"
                  >
                    <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                    <span>Hanya Pemasukan (Masuk)</span>
                  </button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rekap Spesifik (Keluar)</div>
                  <button
                    onClick={() => handleExport('OUT_SHOPEE')}
                    className="w-full text-left px-4 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-700 transition cursor-pointer flex items-center gap-2 text-xs"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-orange-500" />
                    <span>Shopee</span>
                  </button>
                  <button
                    onClick={() => handleExport('OUT_TOKOPEDIA')}
                    className="w-full text-left px-4 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition cursor-pointer flex items-center gap-2 text-xs"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
                    <span>Tokopedia</span>
                  </button>
                  <button
                    onClick={() => handleExport('OUT_TIKTOK')}
                    className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer flex items-center gap-2 text-xs"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-700" />
                    <span>TikTok Shop</span>
                  </button>
                  <button
                    onClick={() => handleExport('OUT_OFFLINE')}
                    className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition cursor-pointer flex items-center gap-2 text-xs"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />
                    <span>Toko Offline / Cabang</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Search */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari produk, SKU, petugas, atau catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`py-2 rounded-lg transition text-center cursor-pointer ${
              typeFilter === 'ALL' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Semua ({scopedTransactions.length})
          </button>
          <button
            onClick={() => setTypeFilter('IN')}
            className={`py-2 rounded-lg transition text-center cursor-pointer ${
              typeFilter === 'IN' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Masuk
          </button>
          <button
            onClick={() => setTypeFilter('OUT')}
            className={`py-2 rounded-lg transition text-center cursor-pointer ${
              typeFilter === 'OUT' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Keluar
          </button>
        </div>
      </div>

      {/* MOBILE FEED VIEW (Smartphone friendly) */}
      <div className="block md:hidden space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
            <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-600">Belum ada transaksi ditemukan</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isIn = tx.type === 'IN';
            return (
              <div key={tx.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                
                {/* Header: Type Badge, Product Name, and Qty */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isIn ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {isIn ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{tx.productName}</h4>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">SKU: {tx.sku}</p>
                      {tx.totalPrice !== undefined && tx.type === 'OUT' && (
                        <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">Nilai: Rp {tx.totalPrice.toLocaleString('id-ID')}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold ${
                      isIn ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isIn ? `+${tx.qty}` : `-${tx.qty}`}
                    </span>
                  </div>
                </div>

                {/* Notes if available */}
                {tx.notes && (
                  <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600 flex items-start gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{tx.notes}</span>
                  </div>
                )}

                {/* Footer: User & Time */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-slate-600 font-medium">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{tx.user || 'Sistem'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{formatTime(tx.createdAt)}</span>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW (Screens >= md) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap min-w-[110px]">Tipe</th>
                <th className="px-5 py-3.5 min-w-[200px]">Produk & SKU</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap min-w-[110px]">Jumlah (Qty)</th>
                <th className="px-4 py-3.5 min-w-[160px]">Catatan / Keterangan</th>
                <th className="px-4 py-3.5 whitespace-nowrap min-w-[120px]">Petugas</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap min-w-[140px]">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 text-sm">
                    Belum ada riwayat transaksi yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIn = tx.type === 'IN';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                          isIn ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isIn ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          {isIn ? 'Masuk' : 'Keluar'}
                        </span>
                      </td>
                      <td className="px-5 py-4 min-w-[200px]">
                        <div className="font-semibold text-slate-800 leading-snug">{tx.productName}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5 whitespace-nowrap">SKU: {tx.sku}</div>
                        {tx.totalPrice !== undefined && tx.type === 'OUT' && (
                          <div className="text-xs font-semibold text-emerald-600 mt-1 whitespace-nowrap">Nilai Transaksi: Rp {tx.totalPrice.toLocaleString('id-ID')}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center font-extrabold text-slate-900 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                          isIn ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {isIn ? `+${tx.qty}` : `-${tx.qty}`}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600 text-xs min-w-[160px] break-words">
                        {tx.notes || '-'}
                      </td>
                      <td className="px-4 py-4 text-slate-700 text-xs font-medium whitespace-nowrap">
                        {tx.user || '-'}
                      </td>
                      <td className="px-5 py-4 text-right text-xs text-slate-400 whitespace-nowrap">
                        {formatTime(tx.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
                  {selectedBranchFilter === 'ALL' ? 'SEMUA CABANG & PUSAT' : `CABANG TEPILIH (${selectedBranchFilter})`}
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
