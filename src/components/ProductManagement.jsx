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
  AlertCircle, 
  Settings2, 
  CheckCircle, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Clock, 
  Check, 
  Ban, 
  Building2, 
  User, 
  ArrowRight,
  Send
} from 'lucide-react';
import GlobalSuccessModal from './GlobalSuccessModal';

export default function ProductManagement({ 
  currentUser,
  products = [], 
  branchInventories = [],
  branches = [],
  brands = [],
  onCreateProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onCreateBrand,
  onDeleteBrand,
  onShowBarcode,
  onRequestBranchInventory,
  onApproveBranchInventory,
  onRejectBranchInventory
}) {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isStaffPusat = currentUser?.role === 'STAFF_PUSAT' || currentUser?.role === 'PUSAT';
  const isBranchStaff = currentUser?.role === 'STAFF_BRANCH';

  // Staff Pusat and Admin have full permission to add/edit products, stock, and brands at Pusat
  const canManageProducts = isAdmin || isStaffPusat;

  const [successModal, setSuccessModal] = useState(null);

  // Sub-tabs
  // Admin/Pusat: 'MASTER_CATALOG' | 'APPROVAL_REQUESTS' | 'ALL_BRANCH_INVENTORIES'
  // Branch: 'MY_BRANCH_INVENTORY' | 'MASTER_CATALOG_REF'
  const [activeSubTab, setActiveSubTab] = useState(
    isBranchStaff ? 'MY_BRANCH_INVENTORY' : 'MASTER_CATALOG'
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBrandManagerOpen, setIsBrandManagerOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [deleteConfirmBrand, setDeleteConfirmBrand] = useState(null);
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Master Product Form State
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    price: 0,
    currentStock: 0,
    minStock: 10,
    unit: 'Pcs'
  });

  // Branch Inventory Request Form State
  const [requestFormData, setRequestFormData] = useState({
    productId: '',
    stockQuantity: 1,
    minStock: 5,
    notes: ''
  });

  const [isCreatingNewBrand, setIsCreatingNewBrand] = useState(false);
  const [newBrandInput, setNewBrandInput] = useState('');
  const [newBrandManagerInput, setNewBrandManagerInput] = useState('');
  const [formError, setFormError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [brandManagerError, setBrandManagerError] = useState('');
  const [brandManagerSuccess, setBrandManagerSuccess] = useState('');

  // Brand Mapping
  const brandMap = new Map();
  brands.forEach(b => {
    if (b && b.name) brandMap.set(b.name.toLowerCase(), { id: b.id || b.name, name: b.name });
  });
  products.forEach(p => {
    if (p && p.brand) {
      const lower = p.brand.toLowerCase();
      if (!brandMap.has(lower)) brandMap.set(lower, { id: `brand-${p.brand}`, name: p.brand });
    }
  });
  if (brandMap.size === 0) {
    brandMap.set('ndk packaging', { id: 'brand-1', name: 'NDK Packaging' });
    brandMap.set('generic / polos', { id: 'brand-2', name: 'Generic / Polos' });
  }
  const allBrandsList = Array.from(brandMap.values());
  const allBrandNames = allBrandsList.map(b => b.name);

  // Pending Approvals Count for Admin/Staff Pusat
  const pendingApprovals = branchInventories.filter(bi => bi.status === 'PENDING_APPROVAL');
  const pendingCount = pendingApprovals.length;

  // Filtered Master Products
  const filteredProducts = products.filter(p => {
    const pBrand = p.brand || 'NDK Packaging';
    const matchesSearch = 
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      pBrand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = brandFilter === 'ALL' || pBrand === brandFilter;
    return matchesSearch && matchesBrand;
  });

  // Filtered Branch Inventories
  const myBranchInventories = branchInventories.filter(bi => {
    const matchesBranch = isBranchStaff 
      ? bi.branchId === currentUser?.branchId 
      : (selectedBranchFilter === 'ALL' || bi.branchId === selectedBranchFilter);
    const matchesStatus = statusFilter === 'ALL' || bi.status === statusFilter;
    const matchesSearch = 
      (bi.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bi.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bi.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bi.branchName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBranch && matchesStatus && matchesSearch;
  });

  // Open Master Product Add Modal
  const handleOpenAddModal = () => {
    if (!canManageProducts) return;
    setEditingProduct(null);
    setIsCreatingNewBrand(false);
    setNewBrandInput('');
    setFormData({
      name: '',
      brand: allBrandNames[0] || 'NDK Packaging',
      price: '',
      currentStock: '',
      minStock: 10,
      unit: 'Pcs'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Master Product Edit Modal
  const handleOpenEditModal = (product) => {
    if (!canManageProducts) return;
    setEditingProduct(product);
    setIsCreatingNewBrand(false);
    setNewBrandInput('');
    setFormData({
      name: product.name || '',
      brand: product.brand || allBrandNames[0] || 'NDK Packaging',
      price: product.price ?? 0,
      currentStock: product.currentStock ?? 0,
      minStock: product.minStock ?? 10,
      unit: product.unit || 'Pcs'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit Master Product Form
  const handleSubmitMasterProduct = async (e) => {
    e.preventDefault();
    if (!canManageProducts) return;
    setFormError('');

    let finalBrand = isCreatingNewBrand ? newBrandInput.trim() : formData.brand.trim();
    if (!finalBrand) {
      setFormError("Merk / Brand produk wajib diisi.");
      return;
    }
    if (!formData.name.trim()) {
      setFormError("Nama produk / barang wajib diisi.");
      return;
    }

    try {
      if (isCreatingNewBrand && onCreateBrand && newBrandInput.trim()) {
        try {
          await onCreateBrand(finalBrand);
        } catch (bErr) {
          console.warn("Brand already exists:", bErr);
        }
      }

      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, {
          ...editingProduct,
          name: formData.name.trim(),
          brand: finalBrand,
          price: Number(formData.price) || 0,
          currentStock: Number(formData.currentStock) || 0,
          minStock: Number(formData.minStock) || 0,
          unit: 'Pcs'
        });
      } else {
        const generatedSku = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
        await onCreateProduct({
          sku: generatedSku,
          name: formData.name.trim(),
          brand: finalBrand,
          price: Number(formData.price) || 0,
          currentStock: Number(formData.currentStock) || 0,
          minStock: Number(formData.minStock) || 10,
          unit: 'Pcs'
        });
      }
      setIsModalOpen(false);

      setSuccessModal({
        title: editingProduct ? "Master Produk Berhasil Diperbarui!" : "Master Produk Berhasil Dibuat!",
        message: editingProduct 
          ? "Perubahan data master produk telah berhasil disimpan ke database." 
          : "Master produk baru telah terdaftar di database dan siap digunakan.",
        details: [
          { label: "Nama Produk", value: formData.name.trim() },
          { label: "Merk / Brand", value: finalBrand },
          { label: "Stok Gudang Pusat", value: `${formData.currentStock || 0} Pcs`, highlight: true }
        ]
      });
    } catch (err) {
      setFormError(err.message || "Gagal menyimpan data produk.");
    }
  };

  // Open Branch Inventory Request Modal
  const handleOpenRequestModal = () => {
    setRequestFormData({
      productId: products[0]?.id || '',
      stockQuantity: 10,
      minStock: 5,
      notes: ''
    });
    setRequestError('');
    setIsRequestModalOpen(true);
  };

  // Submit Branch Inventory Request
  const handleSubmitInventoryRequest = async (e) => {
    e.preventDefault();
    setRequestError('');

    const targetProduct = products.find(p => p.id === requestFormData.productId);
    if (!targetProduct) {
      setRequestError("Silakan pilih produk dari katalog master.");
      return;
    }
    if (Number(requestFormData.stockQuantity) <= 0) {
      setRequestError("Kuantitas fisik stok harus lebih besar dari 0.");
      return;
    }

    try {
      if (onRequestBranchInventory) {
        await onRequestBranchInventory({
          productId: targetProduct.id,
          sku: targetProduct.sku,
          productName: targetProduct.name,
          brand: targetProduct.brand,
          price: targetProduct.price,
          unit: 'Pcs',
          stockQuantity: Number(requestFormData.stockQuantity),
          minStock: Number(requestFormData.minStock) || 5,
          notes: requestFormData.notes
        });
      }
      setIsRequestModalOpen(false);

      setSuccessModal({
        title: "Pengajuan Inventaris Terkirim!",
        message: "Permintaan penambahan inventaris cabang telah dikirimkan ke Kantor Pusat untuk proses persetujuan.",
        details: [
          { label: "Nama Produk", value: targetProduct.name },
          { label: "Kuantitas Diajukan", value: `+${requestFormData.stockQuantity} Pcs`, highlight: true },
          { label: "Status", value: "Menunggu Persetujuan Admin" }
        ]
      });
    } catch (err) {
      setRequestError(err.message || "Gagal mengirim pengajuan inventaris.");
    }
  };

  // Handle Approve Inventory Request
  const handleApprove = async (inventoryId) => {
    if (!window.confirm("Setujui pengajuan inventaris ini? Stok cabang akan resmi aktif.")) return;
    try {
      const matchedItem = branchInventories.find(i => i.id === inventoryId);
      if (onApproveBranchInventory) {
        await onApproveBranchInventory(inventoryId, currentUser);
      }
      if (matchedItem) {
        setSuccessModal({
          title: "Pengajuan Inventaris Disetujui!",
          message: `Inventaris untuk ${matchedItem.productName} telah disetujui dan aktif di cabang ${matchedItem.branchName || 'Cabang'}.`,
          details: [
            { label: "Cabang", value: matchedItem.branchName || 'Cabang' },
            { label: "Produk", value: matchedItem.productName },
            { label: "Stok Aktif", value: `${matchedItem.stockQuantity} Pcs`, highlight: true }
          ]
        });
      }
    } catch (err) {
      alert("Gagal menyetujui: " + err.message);
    }
  };

  // Handle Reject Inventory Request
  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    try {
      if (onRejectBranchInventory) {
        await onRejectBranchInventory(rejectingItem.id, currentUser, rejectionReason || 'Kuantitas fisik tidak sesuai verifikasi.');
      }
      setRejectingItem(null);
      setRejectionReason('');
    } catch (err) {
      alert("Gagal menolak: " + err.message);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {isBranchStaff ? 'Inventaris Produk Cabang' : 'Master Data & Inventaris Produk'}
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              isAdmin 
                ? 'bg-sky-100 text-sky-800 border border-sky-200' 
                : isStaffPusat
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {isAdmin ? 'Admin Master' : isStaffPusat ? 'Staff Pusat (Akses Langsung)' : `Cabang: ${currentUser?.branchName || 'Lokal'}`}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isBranchStaff 
              ? 'Kelola dan ajukan stok fisik inventaris cabang Anda dari Katalog Master resmi Pusat.' 
              : 'Katalog SKU master pusat, manajemen stok & merk, dan validasi persetujuan inventaris cabang.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Admin & Staff Pusat: Master Product + Brand Direct Permission */}
          {canManageProducts && (
            <>
              <button
                onClick={() => setIsBrandManagerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>Kelola Merk</span>
              </button>

              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Master Produk</span>
              </button>
            </>
          )}

          {/* Branch Staff: Request Inventory */}
          {isBranchStaff && (
            <button
              onClick={handleOpenRequestModal}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>+ Ajukan Inventaris Produk</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {/* Admin / Staff Pusat Tabs */}
        {!isBranchStaff && (
          <>
            <button
              onClick={() => setActiveSubTab('MASTER_CATALOG')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === 'MASTER_CATALOG'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Katalog Master Produk ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('APPROVAL_REQUESTS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === 'APPROVAL_REQUESTS'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Persetujuan Inventaris Cabang</span>
              {pendingCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeSubTab === 'APPROVAL_REQUESTS' ? 'bg-white text-amber-700' : 'bg-rose-500 text-white'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('ALL_BRANCH_INVENTORIES')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === 'ALL_BRANCH_INVENTORIES'
                  ? 'bg-sky-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Seluruh Inventaris Cabang ({branchInventories.filter(bi => bi.status === 'APPROVED').length})</span>
            </button>
          </>
        )}

        {/* Branch Staff Tabs */}
        {isBranchStaff && (
          <>
            <button
              onClick={() => setActiveSubTab('MY_BRANCH_INVENTORY')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === 'MY_BRANCH_INVENTORY'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Inventaris Gudang Saya ({myBranchInventories.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('MASTER_CATALOG_REF')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === 'MASTER_CATALOG_REF'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Referensi Master Produk Pusat ({products.length})</span>
            </button>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MASTER CATALOG VIEW                                                */}
      {/* ========================================================================= */}
      {(activeSubTab === 'MASTER_CATALOG' || activeSubTab === 'MASTER_CATALOG_REF') && (
        <div className="space-y-4">
          
          {/* Search & Brand Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari SKU, nama produk, atau merk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="ALL">Semua Merk</option>
              {allBrandNames.map(bName => (
                <option key={bName} value={bName}>{bName}</option>
              ))}
            </select>
          </div>

          {/* Master Product Grid / Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Package className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                <p className="text-sm font-medium">Belum ada produk master yang sesuai filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3">Produk & Merk</th>
                      <th className="px-4 py-3">SKU Master</th>
                      <th className="px-4 py-3 text-right">Harga Unit</th>
                      <th className="px-4 py-3 text-center">Stok Pusat</th>
                      <th className="px-4 py-3 text-center">Satuan</th>
                      <th className="px-5 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{prod.name}</span>
                            <span className="px-2 py-0.2 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {prod.brand || 'Generic'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-mono text-slate-500">{prod.sku}</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-slate-800 text-xs">
                          Rp {(Number(prod.price) || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                            {prod.currentStock || 0} Pcs
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center text-xs text-slate-600">{prod.unit || 'Pcs'}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onShowBarcode(prod)}
                              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Cetak Barcode / QR"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            {canManageProducts && (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(prod)}
                                  className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                                  title="Ubah Produk Master & Stok"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmProduct(prod)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Hapus Produk Master"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PENDING APPROVAL REQUESTS (ADMIN / STAFF PUSAT ONLY)                */}
      {/* ========================================================================= */}
      {!isBranchStaff && activeSubTab === 'APPROVAL_REQUESTS' && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-amber-900 text-sm">Validasi Anti-Pemalsuan Inventaris Cabang</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Setujui pengajuan inventaris agar kuantitas stok cabang resmi masuk ke database aktif dan dapat dimonitor.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-200/80 text-amber-900 rounded-xl font-extrabold text-xs">
              {pendingCount} Pengajuan
            </span>
          </div>

          <div className="space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
                <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 stroke-1" />
                <p className="text-sm font-medium">Semua pengajuan inventaris cabang telah divalidasi.</p>
              </div>
            ) : (
              pendingApprovals.map((req) => (
                <div key={req.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-amber-400 transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm sm:text-base">{req.productName}</span>
                        <span className="px-2 py-0.2 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700">
                          {req.brand}
                        </span>
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                          Menunggu Persetujuan
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Cabang Pengaju: <strong className="text-slate-800">{req.branchName}</strong> • Diajukan oleh: <strong className="text-slate-700">{req.requestedBy}</strong> ({new Date(req.requestedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })})
                      </p>
                      <p className="text-xs font-semibold text-emerald-700 mt-1">
                        Kuantitas Diajukan: <span className="text-sm font-extrabold">{req.stockQuantity} Pcs</span> • SKU: {req.sku}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    <button
                      onClick={() => {
                        setRejectingItem(req);
                        setRejectionReason('');
                      }}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Tolak</span>
                    </button>

                    <button
                      onClick={() => handleApprove(req.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Setujui (Approve)</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BRANCH INVENTORY (MY BRANCH OR ALL BRANCHES)                       */}
      {/* ========================================================================= */}
      {(activeSubTab === 'MY_BRANCH_INVENTORY' || activeSubTab === 'ALL_BRANCH_INVENTORIES') && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari inventaris cabang, SKU, atau merk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Branch Filter for Admin & Staff Pusat */}
            {!isBranchStaff && (
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="w-full sm:w-44 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="ALL">Semua Cabang</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-40 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="APPROVED">✓ Disetujui (Aktif)</option>
              <option value="PENDING_APPROVAL">⏳ Menunggu Persetujuan</option>
              <option value="REJECTED">⚠️ Ditolak</option>
            </select>
          </div>

          {/* Inventories Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {myBranchInventories.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Boxes className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                <p className="text-sm font-medium">Belum ada inventaris produk cabang.</p>
                {isBranchStaff && (
                  <button
                    onClick={handleOpenRequestModal}
                    className="mt-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl active:scale-95 transition cursor-pointer"
                  >
                    + Ajukan Inventaris Produk Sekarang
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3">Produk & Merk</th>
                      {!isBranchStaff && <th className="px-4 py-3">Lokasi Cabang</th>}
                      <th className="px-4 py-3 text-center">Stok Fisik</th>
                      <th className="px-4 py-3 text-right">Harga Jual</th>
                      <th className="px-4 py-3 text-center">Status Validasi</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myBranchInventories.map((inv) => {
                      const isApproved = inv.status === 'APPROVED';
                      const isPending = inv.status === 'PENDING_APPROVAL';
                      const isRejected = inv.status === 'REJECTED';

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5 font-medium text-slate-900">
                            <div>{inv.productName}</div>
                            <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>SKU: {inv.sku}</span>
                              <span>•</span>
                              <span className="text-indigo-600 font-semibold">{inv.brand}</span>
                            </div>
                          </td>

                          {!isBranchStaff && (
                            <td className="px-4 py-3.5 text-xs text-slate-700 font-semibold">
                              {inv.branchName}
                            </td>
                          )}

                          <td className="px-4 py-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {inv.stockQuantity} Pcs
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right font-bold text-slate-800 text-xs">
                            Rp {(Number(inv.price) || 0).toLocaleString('id-ID')}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3" />
                                Aktif (Disetujui)
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                <Clock className="w-3 h-3" />
                                Menunggu Validasi
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200" title={inv.rejectionReason || 'Ditolak'}>
                                <Ban className="w-3 h-3" />
                                Ditolak
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            {!isBranchStaff && isPending && (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleApprove(inv.id)}
                                  className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
                                >
                                  Setujui
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: BRANCH INVENTORY REQUEST (STAFF CABANG)                          */}
      {/* ========================================================================= */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Ajukan Inventaris Produk Cabang</h3>
                  <p className="text-xs text-slate-400">Daftarkan produk dari katalog master ke cabang Anda.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRequestModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitInventoryRequest} className="p-6 space-y-4 text-sm">
              {requestError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{requestError}</span>
                </div>
              )}

              {/* Select Product */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Produk dari Master Katalog *
                </label>
                <select
                  required
                  value={requestFormData.productId}
                  onChange={(e) => setRequestFormData({ ...requestFormData, productId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.brand || 'Generic'}] ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              {/* Physical Quantity Pcs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Kuantitas Fisik Awal Cabang (Pcs) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Contoh: 50"
                  value={requestFormData.stockQuantity}
                  onChange={(e) => setRequestFormData({ ...requestFormData, stockQuantity: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan / Keterangan untuk Pusat
                </label>
                <textarea
                  rows="2"
                  placeholder="Contoh: Stok awal hasil opname fisik cabang."
                  value={requestFormData.notes}
                  onChange={(e) => setRequestFormData({ ...requestFormData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                <p className="font-bold">⚠️ Alur Validasi Kantor Pusat:</p>
                <p>Data inventaris akan masuk status <strong>Menunggu Persetujuan</strong> dan akan dinotifikasikan langsung ke Admin/Pusat sebelum dapat dijual.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                >
                  Kirim Pengajuan ke Pusat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MASTER PRODUCT ADD / EDIT (ADMIN & STAFF PUSAT DIRECT)           */}
      {/* ========================================================================= */}
      {canManageProducts && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {editingProduct ? 'Ubah Master Produk Pusat' : 'Tambah Master Produk & Stok Pusat'}
                  </h3>
                  <p className="text-xs text-slate-400">Master template katalog SKU dan stok fisik resmi Pusat.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMasterProduct} className="p-6 space-y-4 text-sm">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Produk Master *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Botol Plastik 250ml Clear"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Brand Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Merk / Brand *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewBrand(!isCreatingNewBrand);
                      setNewBrandInput('');
                    }}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
                  >
                    {isCreatingNewBrand ? '← Pilih dari Daftar Merk' : '+ Buat Merk Baru'}
                  </button>
                </div>

                {isCreatingNewBrand ? (
                  <input
                    type="text"
                    required
                    placeholder="Ketik nama merk baru..."
                    value={newBrandInput}
                    onChange={(e) => setNewBrandInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-sky-50 border border-sky-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold text-sky-950"
                  />
                ) : (
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {allBrandNames.map(bName => (
                      <option key={bName} value={bName}>{bName}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Harga Master (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Stok Fisik di Pusat (Pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Min Stock & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Batas Minimum Stok
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Satuan Standar
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Pcs"
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 font-bold text-center"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                >
                  Simpan Master Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BRAND MANAGER (ADMIN & STAFF PUSAT)                              */}
      {/* ========================================================================= */}
      {canManageProducts && isBrandManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">Kelola Master Merk</h3>
              </div>
              <button 
                onClick={() => setIsBrandManagerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik nama merk baru..."
                  value={newBrandManagerInput}
                  onChange={(e) => setNewBrandManagerInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <button
                  onClick={async () => {
                    if (!newBrandManagerInput.trim()) return;
                    await onCreateBrand(newBrandManagerInput.trim());
                    setNewBrandManagerInput('');
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Tambah
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {allBrandsList.map(b => (
                  <div key={b.id} className="py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-xs">{b.name}</span>
                    <button
                      onClick={() => onDeleteBrand(b.id || b.name)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      title="Hapus merk"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: REJECT CONFIRMATION                                              */}
      {/* ========================================================================= */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600">
              <Ban className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-slate-900 text-base">Tolak Pengajuan Inventaris</h3>
            </div>
            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menolak pengajuan <strong>{rejectingItem.productName}</strong> dari <strong>{rejectingItem.branchName}</strong>?
            </p>
            <input
              type="text"
              placeholder="Alasan penolakan (opsional)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingItem(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Tolak Pengajuan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MASTER PRODUCT MODAL */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600">
              <Trash2 className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-slate-900 text-base">Hapus Master Produk</h3>
            </div>
            <p className="text-xs text-slate-600">
              Hapus master produk <strong>{deleteConfirmProduct.name}</strong> ({deleteConfirmProduct.sku})?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  await onDeleteProduct(deleteConfirmProduct.id);
                  setDeleteConfirmProduct(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIVERSAL SUCCESS POP-UP MODAL */}
      <GlobalSuccessModal
        isOpen={Boolean(successModal)}
        onClose={() => setSuccessModal(null)}
        title={successModal?.title}
        message={successModal?.message}
        details={successModal?.details}
        buttonText={successModal?.buttonText || "✓ Selesai & Tutup"}
      />

    </div>
  );
}
