import React, { useState } from 'react';
import { ArrowDownLeft, Camera, CheckCircle, Package, Plus, Minus, FileText, User } from 'lucide-react';
import ScannerModal from './ScannerModal';

export default function StockIn({ currentUser, products = [], onRecordMovement }) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [user, setUser] = useState(currentUser?.name || 'Staff Inbound');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const selectedProduct = products.find(p => p.id === selectedProductId || p.sku === selectedProductId);

  const handleScanSuccess = (scannedText) => {
    // Look up product by SKU or Barcode
    const matched = products.find(
      p => p.sku.toLowerCase() === scannedText.toLowerCase() || 
           p.barcode?.toLowerCase() === scannedText.toLowerCase()
    );
    if (matched) {
      setSelectedProductId(matched.id);
      setSuccessMessage(`Berhasil scan barcode: ${matched.name}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      alert(`Produk dengan SKU/Barcode "${scannedText}" tidak ditemukan di database.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert("Silakan pilih produk terlebih dahulu!");
      return;
    }
    if (Number(qty) <= 0) {
      alert("Jumlah (Qty) harus lebih besar dari 0!");
      return;
    }

    try {
      await onRecordMovement({
        productId: selectedProduct.id,
        sku: selectedProduct.sku,
        productName: selectedProduct.name,
        type: 'IN',
        qty: Number(qty),
        notes: notes || 'Penerimaan Stok Gudang',
        user: user || currentUser?.name || 'Staff Inbound'
      });

      setSuccessMessage(`Berhasil menambahkan ${qty} ${selectedProduct.unit} stok ${selectedProduct.name}!`);
      setQty(1);
      setNotes('');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
          <ArrowDownLeft className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Barang Masuk (Inbound)</h2>
          <p className="text-xs sm:text-sm text-slate-500">Catat penerimaan stok baru dari supplier atau penyesuaian produksi.</p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-5">
        
        {/* Step 1: Scan / Select Product */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Pilih / Scan Produk
            </label>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-sky-600" />
              <span>Scan Barcode</span>
            </button>
          </div>

          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="">-- Pilih Produk dari Katalog --</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku}) — Stok: {p.currentStock} {p.unit}
              </option>
            ))}
          </select>
        </div>

        {/* Product Preview Card */}
        {selectedProduct && (
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedProduct.name}</h4>
                <p className="text-xs text-slate-400 font-mono">SKU: {selectedProduct.sku} | Rak: {selectedProduct.location || '-'}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Stok Saat Ini</span>
              <span className="text-sm font-bold text-slate-800">{selectedProduct.currentStock} {selectedProduct.unit}</span>
            </div>
          </div>
        )}

        {/* Step 2: Details Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          
          {/* Quantity with Thumb Stepper (+ / -) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Kuantitas Masuk (Qty) *
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, Number(qty) - 1))}
                className="w-12 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-lg flex items-center justify-center active:scale-95 transition"
              >
                <Minus className="w-5 h-5" />
              </button>
              
              <input
                type="number"
                min="1"
                required
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className="flex-1 h-12 text-center text-lg font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => setQty(Number(qty) + 1)}
                className="w-12 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-lg flex items-center justify-center active:scale-95 transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Nama Petugas / Staff</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Catatan / Supplier / PO</label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="PO-2026 / Supplier ABC"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Stock Simulation Preview */}
          {selectedProduct && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex justify-between items-center">
              <span>Proyeksi Stok Akhir:</span>
              <span className="font-bold text-sm">
                {(Number(selectedProduct.currentStock) || 0) + Number(qty)} {selectedProduct.unit}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedProduct}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition active:scale-98 cursor-pointer mt-2"
          >
            Simpan Barang Masuk (+{qty})
          </button>

        </form>
      </div>

      {/* Barcode Scanner Camera Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

    </div>
  );
}
