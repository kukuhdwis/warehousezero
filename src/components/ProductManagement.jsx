import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  QrCode, 
  AlertTriangle, 
  X, 
  Boxes,
  Tag,
  AlertCircle
} from 'lucide-react';

export default function ProductManagement({ 
  currentUser,
  products = [], 
  branches = [],
  onCreateProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onShowBarcode 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);

  // Form State - Simplified to only requested fields
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    currentStock: 0,
    minStock: 10,
    unit: 'Pcs'
  });

  const [formError, setFormError] = useState('');
  const isAdmin = currentUser?.role === 'ADMIN';

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleOpenAddModal = () => {
    if (!isAdmin) return;
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      currentStock: '',
      minStock: 10,
      unit: 'Pcs'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    if (!isAdmin) return;
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      price: product.price ?? 0,
      currentStock: product.currentStock ?? 0,
      minStock: product.minStock ?? 10,
      unit: product.unit || 'Pcs'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setFormError('');

    if (!formData.name.trim()) {
      setFormError("Nama Produk wajib diisi.");
      return;
    }

    try {
      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, {
          ...editingProduct,
          name: formData.name.trim(),
          price: Number(formData.price) || 0,
          currentStock: Number(formData.currentStock) || 0,
          minStock: Number(formData.minStock) || 0,
          unit: formData.unit.trim() || 'Pcs'
        });
      } else {
        // Auto-generate SKU internally
        const generatedSku = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
        await onCreateProduct({
          sku: generatedSku,
          name: formData.name.trim(),
          price: Number(formData.price) || 0,
          currentStock: Number(formData.currentStock) || 0,
          minStock: Number(formData.minStock) || 0,
          unit: formData.unit.trim() || 'Pcs',
          category: 'General',
          location: '-'
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan produk.');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Master Data Produk</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {isAdmin 
              ? 'Kelola katalog barang, harga produk, kuantitas stok awal, dan ambang batas minimum.' 
              : 'Katalog master barang dan cetak barcode produk untuk operasional gudang.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-sky-600/20 transition active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk Baru</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama produk atau SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
          />
        </div>
      </div>

      {/* MOBILE CARD VIEW (Optimized for Smartphone Screens) */}
      <div className="block md:hidden space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-600">Tidak ada produk ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan tombol Tambah Produk Baru di atas.</p>
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const isLow = (Number(prod.currentStock) || 0) <= (Number(prod.minStock) || 0);
            return (
              <div key={prod.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                
                {/* Card Header: Name, SKU, Stock */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Boxes className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{prod.name}</h4>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">{prod.sku}</p>
                    </div>
                  </div>

                  {/* Stock Pill */}
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                      isLow ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {isLow && <AlertTriangle className="w-3 h-3" />}
                      {prod.currentStock} {prod.unit || 'Pcs'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Min: {prod.minStock || 0}</p>
                  </div>
                </div>

                {/* Card Details: Price */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">Harga Satuan</span>
                  <span className="font-bold text-slate-900 text-sm">
                    Rp {(Number(prod.price) || 0).toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Action Buttons for Mobile */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onShowBarcode(prod)}
                    className={`${isAdmin ? 'flex-1' : 'w-full'} flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Cetak Barcode</span>
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleOpenEditModal(prod)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-semibold transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Ubah</span>
                      </button>

                      <button
                        onClick={() => setDeleteConfirmProduct(prod)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
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
                <th className="px-6 py-3.5">Nama Produk</th>
                <th className="px-4 py-3.5 text-right">Harga Produk</th>
                <th className="px-4 py-3.5 text-center">Stok Saat Ini</th>
                <th className="px-4 py-3.5 text-center">Stok Minimum</th>
                <th className="px-4 py-3.5 text-center">Satuan</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 text-sm">
                    Tidak ada data produk yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isLow = (Number(prod.currentStock) || 0) <= (Number(prod.minStock) || 0);
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <div className="font-semibold text-slate-800">{prod.name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          SKU: {prod.sku}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-slate-800">
                        Rp {(Number(prod.price) || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          isLow ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {prod.currentStock} {prod.unit || 'Pcs'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-xs text-slate-600 font-medium">
                        {prod.minStock || 0} {prod.unit || 'Pcs'}
                      </td>
                      <td className="px-4 py-4 text-center text-xs text-slate-500">
                        {prod.unit || 'Pcs'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onShowBarcode(prod)}
                            title="Cetak Barcode"
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(prod)}
                                title="Edit"
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmProduct(prod)}
                                title="Hapus"
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal (SIMPLIFIED TO ONLY REQUESTED FIELDS) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
              <div>
                <h3 className="font-semibold text-slate-800 text-base">
                  {editingProduct ? 'Perbarui Data Produk' : 'Tambah Produk Baru'}
                </h3>
                <p className="text-xs text-slate-400">Input informasi nama, harga, dan stok barang.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-sm overflow-y-auto flex-1">
              
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Nama Produk */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Produk / Barang *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kardus Corrugated 20x20"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                />
              </div>

              {/* 2. Harga Produk & Satuan Kuantitas Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Harga Produk (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 15000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Satuan Kuantitas Produk
                  </label>
                  <input
                    type="text"
                    placeholder="Pcs / Box / Kg / Lusin"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* 3. Stok Awal & 4. Stok Minimum Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Jumlah stok saat ini"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Stok Minimum (Batas Restock)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Batas peringatan menipis"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition font-semibold text-amber-700"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-sky-600/20 transition cursor-pointer"
                >
                  {editingProduct ? 'Simpan Perubahan' : 'Tambahkan Produk'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Hapus Produk?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus <strong>{deleteConfirmProduct.name}</strong>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmProduct(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteProduct(deleteConfirmProduct.id);
                  setDeleteConfirmProduct(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-rose-600/20 transition cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
