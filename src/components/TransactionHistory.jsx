import React, { useState } from 'react';
import { matchesSearch } from '../utils/searchUtils';
import { History, Download, ArrowDownLeft, ArrowUpRight, Filter, Search, User, Clock, FileText, Trash2, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { exportToCSV, exportToExcel, purgeTransactions } from '../services/dataService';
import ConfirmationModal from './ConfirmationModal';
import TransactionDetailModal from './TransactionDetailModal';

export default function TransactionHistory({ 
  transactions = [], 
  currentUser, 
  onTransactionUpdate, 
  products = [],
  initialSearch = '',
  onClearInitialSearch
}) {
  const isBranchStaff = currentUser?.role === 'STAFF_BRANCH';
  const branchId = currentUser?.branchId;

  const [selectedDetailTx, setSelectedDetailTx] = useState(null);

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

  const [searchTerm, setSearchTerm] = useState(initialSearch || '');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('EXCEL'); // 'EXCEL' | 'CSV'
  const [isPurgeConfirmOpen, setIsPurgeConfirmOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeError, setPurgeError] = useState('');

  // Synchronize initialSearch prop
  React.useEffect(() => {
    if (initialSearch) {
      setSearchTerm(initialSearch);
      setTypeFilter('ALL');
      if (onClearInitialSearch) onClearInitialSearch();
    }
  }, [initialSearch]);

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
    const matchesSearchTerm = matchesSearch(
      searchTerm, 
      tx.productName, 
      tx.sku, 
      tx.notes, 
      tx.user, 
      tx.branchName,
      tx.deliveryNote,
      tx.rejectionReason,
      tx.invoiceNumber
    );
    
    const isRetur = tx.transactionType === 'TRANSFER_REJECTED_RETURN' || tx.status === 'REJECTED_RETURN' || tx.transferStatus === 'REJECTED';
    const isIn = tx.type === 'IN' && !isRetur;
    const isOut = !isIn && !isRetur;

    let matchesType = true;
    if (typeFilter === 'IN') matchesType = isIn;
    else if (typeFilter === 'OUT') matchesType = isOut;
    else if (typeFilter === 'RETUR') matchesType = isRetur;

    return matchesSearchTerm && matchesType;
  });

  const handleExport = (exportType = 'ALL', chosenFormat = exportFormat) => {
    const formattedData = [];
    
    // Filter transactions based on the selected exportType
    const transactionsToExport = filteredTransactions.filter(tx => {
      const isReturTx = tx.transactionType === 'TRANSFER_REJECTED_RETURN' || tx.status === 'REJECTED_RETURN' || tx.transferStatus === 'REJECTED';
      const isInTx = tx.type === 'IN' && !isReturTx;
      const isOutTx = !isInTx && !isReturTx;

      if (exportType === 'ALL') return true;
      if (exportType === 'IN') return isInTx;
      if (exportType === 'OUT') return isOutTx;
      if (exportType === 'OUT_SHOPEE') return isOutTx && (tx.notes || '').toLowerCase().includes('shopee');
      if (exportType === 'OUT_TOKOPEDIA') return isOutTx && (tx.notes || '').toLowerCase().includes('tokopedia');
      if (exportType === 'OUT_TIKTOK') return isOutTx && (tx.notes || '').toLowerCase().includes('tiktok');
      if (exportType === 'OUT_OFFLINE') return isOutTx && ((tx.notes || '').toLowerCase().includes('offline') || (tx.notes || '').toLowerCase().includes('cabang'));
      return true;
    });

    let rowNumber = 1;
    transactionsToExport.forEach(tx => {
      const isRejectedReturn = tx.transactionType === 'TRANSFER_REJECTED_RETURN' || tx.status === 'REJECTED_RETURN';
      const isOutboundRejected = tx.transferStatus === 'REJECTED';
      const isInTx = tx.type === 'IN' && !isRejectedReturn;
      const isOutboundOrSale = !isInTx;

      let typeLabel = 'Barang Keluar';
      if (isRejectedReturn) {
        typeLabel = 'Retur Masuk (Pusat)';
      } else if (isOutboundRejected) {
        typeLabel = 'Barang Keluar (Ditolak Cabang)';
      } else if (isInTx) {
        typeLabel = 'Barang Masuk';
      }

      const docNo = tx.invoiceNumber || tx.deliveryNote || '-';

      if (tx.items && tx.items.length > 0) {
        // Multi-item transactions
        tx.items.forEach(item => {
          const itemQty = Number(item.qty || item.qty_in || 1);
          const itemPrice = Number(item.price || 0);
          const itemTotal = Number(item.subtotal || (itemPrice * itemQty));
          
          formattedData.push({
            'No': rowNumber++,
            'ID Transaksi': tx.id || '-',
            'No. Dokumen / Nota': docNo,
            'Tipe Transaksi': typeLabel,
            'SKU': item.sku || tx.sku || '-',
            'Nama Produk': item.productName || item.product_name || item.name || tx.productName || '-',
            'Jumlah (Qty)': itemQty,
            'Harga Satuan (Rp)': isOutboundOrSale && itemPrice > 0 ? `Rp ${itemPrice.toLocaleString('id-ID')}` : '-',
            'Total Nilai (Rp)': isOutboundOrSale && itemTotal > 0 ? `Rp ${itemTotal.toLocaleString('id-ID')}` : '-',
            'Catatan / Keterangan': tx.notes || '-',
            'Petugas': tx.user || 'Sistem',
            'Waktu Transaksi': formatTime(tx.createdAt || tx.timestamp || tx.date)
          });
        });
      } else {
        // Single item transaction fallback
        const qty = Number(tx.qty || 1);
        const price = Number(tx.price || 0);
        const total = Number(tx.totalPrice || tx.totalValue || (price * qty));
        
        formattedData.push({
          'No': rowNumber++,
          'ID Transaksi': tx.id || '-',
          'No. Dokumen / Nota': docNo,
          'Tipe Transaksi': typeLabel,
          'SKU': tx.sku || '-',
          'Nama Produk': tx.productName || '-',
          'Jumlah (Qty)': qty,
          'Harga Satuan (Rp)': isOutboundOrSale && price > 0 ? `Rp ${price.toLocaleString('id-ID')}` : '-',
          'Total Nilai (Rp)': isOutboundOrSale && total > 0 ? `Rp ${total.toLocaleString('id-ID')}` : '-',
          'Catatan / Keterangan': tx.notes || '-',
          'Petugas': tx.user || 'Sistem',
          'Waktu Transaksi': formatTime(tx.createdAt || tx.timestamp || tx.date)
        });
      }
    });

    let filenameSuffix = exportType;
    if (exportType.startsWith('OUT_')) {
      filenameSuffix = `Keluar-${exportType.replace('OUT_', '')}`;
    }
    
    if (chosenFormat === 'CSV') {
      exportToCSV(formattedData, `WMS-Riwayat-Transaksi-${filenameSuffix}-${Date.now()}.csv`);
    } else {
      exportToExcel(formattedData, `WMS-Riwayat-Transaksi-${filenameSuffix}-${Date.now()}.xlsx`, 'Riwayat Transaksi');
    }
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
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Rekap Excel</span>
            </button>
          
            {isExportMenuOpen && (
              <>
                {/* Backdrop to close menu */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsExportMenuOpen(false)}
                ></div>
                
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 origin-top-right">
                  {/* Format Selector Toggle */}
                  <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Format File</span>
                    <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setExportFormat('EXCEL'); }}
                        className={`px-2 py-1 rounded-md transition font-bold flex items-center gap-1 ${
                          exportFormat === 'EXCEL'
                            ? 'bg-white text-emerald-700 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Format resmi Microsoft Excel (.xlsx) dengan auto-width & encoding UTF-8 penuh"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Excel (.xlsx)
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setExportFormat('CSV'); }}
                        className={`px-2 py-1 rounded-md transition font-bold flex items-center gap-1 ${
                          exportFormat === 'CSV'
                            ? 'bg-white text-slate-800 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Format CSV standar dengan UTF-8 BOM"
                      >
                        CSV (.csv)
                      </button>
                    </div>
                  </div>

                  <div className="p-1.5 text-slate-700 font-medium text-sm">
                    <button
                      onClick={() => handleExport('ALL')}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        <span className="font-semibold text-slate-800">Semua Transaksi</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {exportFormat === 'EXCEL' ? '.xlsx' : '.csv'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleExport('OUT')}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer flex items-center gap-2"
                    >
                      <ArrowUpRight className="w-4 h-4 text-rose-500" />
                      <span>Hanya Pengeluaran (Keluar)</span>
                    </button>
                    <button
                      onClick={() => handleExport('IN')}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition cursor-pointer flex items-center gap-2"
                    >
                      <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                      <span>Hanya Pemasukan (Masuk)</span>
                    </button>
                    
                    <div className="h-px bg-slate-100 my-1"></div>
                    <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rekap Spesifik (Keluar)</div>
                    
                    <button
                      onClick={() => handleExport('OUT_SHOPEE')}
                      className="w-full text-left px-3.5 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-700 transition cursor-pointer flex items-center gap-2 text-xs font-medium"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-orange-500" />
                      <span>Pesanan Shopee</span>
                    </button>
                    <button
                      onClick={() => handleExport('OUT_TOKOPEDIA')}
                      className="w-full text-left px-3.5 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition cursor-pointer flex items-center gap-2 text-xs font-medium"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
                      <span>Pesanan Tokopedia</span>
                    </button>
                    <button
                      onClick={() => handleExport('OUT_TIKTOK')}
                      className="w-full text-left px-3.5 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer flex items-center gap-2 text-xs font-medium"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-700" />
                      <span>Pesanan TikTok Shop</span>
                    </button>
                    <button
                      onClick={() => handleExport('OUT_OFFLINE')}
                      className="w-full text-left px-3.5 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition cursor-pointer flex items-center gap-2 text-xs font-medium"
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
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
          <button
            onClick={() => setTypeFilter('RETUR')}
            className={`py-2 rounded-lg transition text-center cursor-pointer ${
              typeFilter === 'RETUR' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            ↩️ Retur / Ditolak
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
            const isRejectedReturn = tx.transactionType === 'TRANSFER_REJECTED_RETURN' || tx.status === 'REJECTED_RETURN';
            const isOutboundRejected = tx.transferStatus === 'REJECTED';
            const isRejected = isRejectedReturn || isOutboundRejected;
            const isIn = tx.type === 'IN' && !isRejectedReturn;

            return (
              <div 
                key={tx.id} 
                onClick={() => setSelectedDetailTx(tx)}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5 cursor-pointer hover:border-sky-300 hover:shadow-sm transition active:scale-[0.99] group"
              >
                
                {/* Header: Type Badge, Product Name, and Qty */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition ${
                      isRejectedReturn
                        ? 'bg-amber-100 text-amber-700 font-bold'
                        : isOutboundRejected
                          ? 'bg-rose-100 text-rose-700 font-bold'
                          : isIn
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                    }`}>
                      {isRejectedReturn ? (
                        <span className="text-sm">↩️</span>
                      ) : isIn ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-sky-700 transition">{tx.productName}</h4>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <p className="text-[11px] font-mono text-slate-400">SKU: {tx.sku}</p>
                        {tx.invoiceNumber && (
                          <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                            {tx.invoiceNumber}
                          </span>
                        )}
                        {tx.deliveryNote && (
                          <span className="font-mono text-[9px] bg-sky-50 text-sky-700 px-1.5 py-0.2 rounded border border-sky-200">
                            {tx.deliveryNote}
                          </span>
                        )}
                      </div>
                      {isRejectedReturn && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 mt-1">
                          ↩️ Paket Diretur ke Pusat
                        </span>
                      )}
                      {isOutboundRejected && !isRejectedReturn && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 mt-1">
                          ⚠️ Ditolak oleh Cabang
                        </span>
                      )}
                      {tx.rejectionReason && (
                        <p className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-1 rounded border border-rose-200 mt-1">
                          Alasan Penolakan: "{tx.rejectionReason}"
                        </p>
                      )}
                      {tx.totalPrice !== undefined && tx.type === 'OUT' && (
                        <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">Nilai: Rp {tx.totalPrice.toLocaleString('id-ID')}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold ${
                      isRejectedReturn
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : isIn
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isRejectedReturn ? `+${tx.qty}` : isIn ? `+${tx.qty}` : `-${tx.qty}`}
                    </span>
                  </div>
                </div>

                {/* Notes if available */}
                {tx.notes && (
                  <div className="p-2 bg-slate-50 rounded-xl text-xs text-slate-600 flex items-start gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{tx.notes}</span>
                  </div>
                )}

                {/* Footer: User, Time & PDF Button */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{tx.user || 'Sistem'}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatTime(tx.createdAt || tx.timestamp || tx.date)}</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-sky-600 group-hover:underline flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    <span>PDF</span>
                  </span>
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
                <th className="px-5 py-3.5 whitespace-nowrap min-w-[140px]">Waktu</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap min-w-[130px]">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 text-sm">
                    Belum ada riwayat transaksi yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isRejectedReturn = tx.transactionType === 'TRANSFER_REJECTED_RETURN' || tx.status === 'REJECTED_RETURN';
                  const isOutboundRejected = tx.transferStatus === 'REJECTED';
                  const isIn = tx.type === 'IN' && !isRejectedReturn;

                  return (
                    <tr 
                      key={tx.id} 
                      onClick={() => setSelectedDetailTx(tx)}
                      className="hover:bg-slate-50/90 transition cursor-pointer group"
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isRejectedReturn ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold whitespace-nowrap bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
                            <span>↩️</span> Retur Masuk
                          </span>
                        ) : isOutboundRejected ? (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap bg-rose-100 text-rose-800">
                              <ArrowUpRight className="w-3.5 h-3.5" /> Keluar
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold whitespace-nowrap bg-rose-50 text-rose-700 border border-rose-200">
                              ⚠️ Ditolak Cabang
                            </span>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                            isIn ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isIn ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                            {isIn ? 'Masuk' : 'Keluar'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 min-w-[200px]">
                        <div className="font-semibold text-slate-800 group-hover:text-sky-700 transition leading-snug">{tx.productName}</div>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400 font-mono whitespace-nowrap">SKU: {tx.sku}</span>
                          {tx.invoiceNumber && (
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                              {tx.invoiceNumber}
                            </span>
                          )}
                          {tx.deliveryNote && (
                            <span className="font-mono text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.2 rounded border border-sky-200 font-semibold">
                              {tx.deliveryNote}
                            </span>
                          )}
                        </div>
                        {tx.rejectionReason && (
                          <div className="text-[11px] text-rose-700 font-bold mt-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-flex items-center gap-1">
                            <span>⚠️</span>
                            <span>Alasan Ditolak: "{tx.rejectionReason}"</span>
                          </div>
                        )}
                        {tx.totalPrice !== undefined && tx.type === 'OUT' && (
                          <div className="text-xs font-semibold text-emerald-600 mt-1 whitespace-nowrap">Nilai: Rp {tx.totalPrice.toLocaleString('id-ID')}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center font-extrabold text-slate-900 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                          isRejectedReturn
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : isIn
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                        }`}>
                          {isRejectedReturn ? `+${tx.qty}` : isIn ? `+${tx.qty}` : `-${tx.qty}`}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600 text-xs min-w-[160px] break-words">
                        {tx.notes || '-'}
                      </td>
                      <td className="px-4 py-4 text-slate-700 text-xs font-medium whitespace-nowrap">
                        {tx.user || '-'}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {formatTime(tx.createdAt || tx.timestamp || tx.date)}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDetailTx(tx);
                          }}
                          className="px-3 py-1.5 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 mx-auto cursor-pointer shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Lihat & Cetak</span>
                        </button>
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

      {/* Transaction Detail & PDF Generator Modal */}
      <TransactionDetailModal
        isOpen={Boolean(selectedDetailTx)}
        transaction={selectedDetailTx}
        onClose={() => setSelectedDetailTx(null)}
        products={products}
      />
    </div>
  );
}
