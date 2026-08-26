import React, { useState } from 'react';
import { History, Download, ArrowDownLeft, ArrowUpRight, Filter, Search, User, Clock, FileText } from 'lucide-react';
import { exportToCSV } from '../services/dataService';

export default function TransactionHistory({ transactions = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.user?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'ALL' || tx.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleExport = () => {
    const formattedData = filteredTransactions.map(tx => ({
      ID: tx.id,
      Tipe: tx.type === 'IN' ? 'Barang Masuk' : 'Barang Keluar',
      SKU: tx.sku,
      Nama_Produk: tx.productName,
      Jumlah: tx.qty,
      Catatan: tx.notes || '-',
      Petugas: tx.user || '-',
      Waktu: new Date(tx.createdAt).toLocaleString('id-ID')
    }));

    exportToCSV(formattedData, `WMS-Riwayat-Transaksi-${Date.now()}.csv`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Riwayat Transaksi Stok</h2>
          <p className="text-xs sm:text-sm text-slate-500">Audit trail pergerakan stok barang masuk (Inbound) & keluar (Outbound).</p>
        </div>

        <button
          onClick={handleExport}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-sm shadow-xs transition active:scale-98 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV / Excel</span>
        </button>
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
            Semua ({transactions.length})
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
                    <span>{new Date(tx.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
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
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Tipe</th>
                <th className="px-6 py-3.5">Produk & SKU</th>
                <th className="px-4 py-3.5 text-center">Jumlah (Qty)</th>
                <th className="px-4 py-3.5">Catatan / Supplier / PO</th>
                <th className="px-4 py-3.5">Petugas</th>
                <th className="px-6 py-3.5 text-right">Waktu</th>
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
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isIn ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isIn ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          {isIn ? 'Masuk' : 'Keluar'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{tx.productName}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">SKU: {tx.sku}</div>
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-slate-900">
                        {isIn ? `+${tx.qty}` : `-${tx.qty}`}
                      </td>
                      <td className="px-4 py-4 text-slate-600 text-xs">
                        {tx.notes || '-'}
                      </td>
                      <td className="px-4 py-4 text-slate-700 text-xs font-medium">
                        {tx.user || '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-slate-400">
                        {new Date(tx.createdAt).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
