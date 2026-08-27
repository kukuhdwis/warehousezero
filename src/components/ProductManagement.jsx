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
  Send,
  Sliders
} from 'lucide-react';
import GlobalSuccessModal from './GlobalSuccessModal';
import CustomAlertModal from './CustomAlertModal';

export default function ProductManagement({ 
  currentUser,
  products = [], 
  branchInventories = [],
  branches = [],
  brands = [],
  machineCategories = [],
  onCreateProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onCreateBrand,
  onDeleteBrand,
  onCreateMachineCategory,
  onDeleteMachineCategory,
  onShowBarcode,
  onRequestBranchInventory,
  onApproveBranchRequest,
  onRejectBranchRequest,
  onUpdateBranchInventory
}) {

  const [alertModal, setAlertModal] = useState(null);
  const showAlert = (title, message, type = 'WARNING') => {
    setAlertModal({ title, message, type });
  };

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

  const DEFAULT_MACHINE_CATEGORIES = [
    'Universal / Semua Mesin',
    'Mesin Offset',
    'Mesin Digital Printing',
    'Mesin Flexography (Flexo)',
    'Mesin Rotogravure',
    'Mesin Die Cut & Finishing',
    'Mesin Laminating & Coating',
    'Mesin Packaging & Binding'
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [machineCategoryFilter, setMachineCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBrandManagerOpen, setIsBrandManagerOpen] = useState(false);
  const [isMachineCategoryManagerOpen, setIsMachineCategoryManagerOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [deleteConfirmBrand, setDeleteConfirmBrand] = useState(null);
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Master Product Form State
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    brand: '',
    price: 0,
    minStock: 10,
    unit: 'Pcs',
    status: 'ACTIVE',
    machineCategory: 'Universal / Semua Mesin'
  });

  // Bulk Branch Inventory Request Modal State (Requirement 5)
  const [isBulkRequestModalOpen, setIsBulkRequestModalOpen] = useState(false);
  const [bulkStep, setBulkStep] = useState(1); // 1: Search & Multi-Check, 2: Set Quantities
  const [bulkSearchTerm, setBulkSearchTerm] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [bulkRequestItems, setBulkRequestItems] = useState([]);
  const [bulkRequestError, setBulkRequestError] = useState('');

  // Single Branch Inventory Request Form State
  const [requestFormData, setRequestFormData] = useState({
    productId: '',
    stockQuantity: 10,
    minStock: 5,
    notes: ''
  });


  const [isCreatingNewBrand, setIsCreatingNewBrand] = useState(false);
  const [newBrandInput, setNewBrandInput] = useState('');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newBrandManagerInput, setNewBrandManagerInput] = useState('');
  const [newCategoryManagerInput, setNewCategoryManagerInput] = useState('');
  const [formError, setFormError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [brandManagerError, setBrandManagerError] = useState('');
  const [categoryManagerError, setCategoryManagerError] = useState('');
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

  // Machine Category Mapping
  const machineCategoryMap = new Map();
  machineCategories.forEach(mc => {
    if (mc && mc.name) machineCategoryMap.set(mc.name.toLowerCase(), { id: mc.id || mc.name, name: mc.name });
  });
  DEFAULT_MACHINE_CATEGORIES.forEach(name => {
    const lower = name.toLowerCase();
    if (!machineCategoryMap.has(lower)) machineCategoryMap.set(lower, { id: `cat-${name}`, name });
  });
  products.forEach(p => {
    const pCat = p.machineCategory || p.kategoriMesin;
    if (pCat) {
      const lower = pCat.toLowerCase();
      if (!machineCategoryMap.has(lower)) machineCategoryMap.set(lower, { id: `cat-${pCat}`, name: pCat });
    }
  });
  const allMachineCategoriesList = Array.from(machineCategoryMap.values());
  const allMachineCategories = allMachineCategoriesList.map(c => c.name);

  // Pending Approvals Count for Admin/Staff Pusat
  const pendingApprovals = branchInventories.filter(bi => bi.status === 'PENDING_APPROVAL');
  const pendingCount = pendingApprovals.length;

  // Filtered Master Products
  const filteredProducts = products.filter(p => {
    const pBrand = p.brand || 'NDK Packaging';
    const pCategory = p.machineCategory || p.kategoriMesin || 'Universal / Semua Mesin';
    const matchesSearch = 
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      pBrand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pCategory.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = brandFilter === 'ALL' || pBrand === brandFilter;
    const matchesCategory = machineCategoryFilter === 'ALL' || pCategory === machineCategoryFilter;
    return matchesSearch && matchesBrand && matchesCategory;
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

  // Quick Stock Adjustment Modal State (Opname / Direct Edit Stock)
  const [adjustingStockItem, setAdjustingStockItem] = useState(null); // { type: 'MASTER' | 'BRANCH', data: item }
  const [newStockQtyInput, setNewStockQtyInput] = useState(0);
  const [adjustStockNotes, setAdjustStockNotes] = useState('');
  const [isSubmittingStockAdjust, setIsSubmittingStockAdjust] = useState(false);

  const handleOpenStockAdjustModal = (item, type = 'MASTER') => {
    setAdjustingStockItem({ type, data: item });
    setNewStockQtyInput(type === 'MASTER' ? (item.currentStock ?? 0) : (item.stockQuantity ?? 0));
    setAdjustStockNotes('Hasil opname / koreksi stok fisik gudang');
  };

  const handleExecuteStockAdjust = async (e) => {
    e.preventDefault();
    if (!adjustingStockItem) return;
    setIsSubmittingStockAdjust(true);
    try {
      const { type, data } = adjustingStockItem;
      const newQty = Math.max(0, Number(newStockQtyInput));

      if (type === 'MASTER') {
        await onUpdateProduct(data.id, {
          ...data,
          currentStock: newQty
        });
        setSuccessModal({
          title: "Stok Master Produk Berhasil Disesuaikan! 📦",
          message: `Stok fisik gudang pusat untuk "${data.name}" telah diperbarui dari ${data.currentStock ?? 0} Pcs menjadi ${newQty} Pcs.`,
          details: [
            { label: "Produk", value: data.name },
            { label: "SKU", value: data.sku },
            { label: "Stok Baru", value: `${newQty} Pcs`, highlight: true }
          ]
        });
      } else if (type === 'BRANCH') {
        if (onUpdateBranchInventory) {
          await onUpdateBranchInventory(data.id, {
            ...data,
            stockQuantity: newQty
          });
        }
      }
      setAdjustingStockItem(null);
    } catch (err) {
      alert("Gagal memperbarui stok: " + err.message);
    } finally {
      setIsSubmittingStockAdjust(false);
    }
  };

  // Open Master Product Add Modal
  const handleOpenAddModal = () => {
    if (!canManageProducts) return;
    setEditingProduct(null);
    setIsCreatingNewBrand(false);
    setNewBrandInput('');
    setIsCreatingNewCategory(false);
    setNewCategoryInput('');
    setFormData({
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      brand: allBrandNames[0] || 'NDK Packaging',
      price: '',
      minStock: 10,
      currentStock: 0,
      unit: 'Pcs',
      status: 'ACTIVE',
      machineCategory: 'Universal / Semua Mesin'
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
    setIsCreatingNewCategory(false);
    setNewCategoryInput('');
    setFormData({
      sku: product.sku || '',
      name: product.name || '',
      brand: product.brand || allBrandNames[0] || 'NDK Packaging',
      price: product.price ?? 0,
      minStock: product.minStock ?? 10,
      currentStock: product.currentStock ?? 0,
      unit: product.unit || 'Pcs',
      status: product.status || 'ACTIVE',
      machineCategory: product.machineCategory || product.kategoriMesin || 'Universal / Semua Mesin'
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
    let finalCategory = isCreatingNewCategory ? newCategoryInput.trim() : formData.machineCategory.trim();
    if (!finalCategory) {
      setFormError("Kategori mesin wajib diisi.");
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

      if (isCreatingNewCategory && onCreateMachineCategory && newCategoryInput.trim()) {
        try {
          await onCreateMachineCategory(finalCategory);
        } catch (cErr) {
          console.warn("Category already exists:", cErr);
        }
      }

      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, {
          ...editingProduct,
          sku: formData.sku.trim() || editingProduct.sku,
          name: formData.name.trim(),
          brand: finalBrand,
          machineCategory: finalCategory,
          price: Number(formData.price) || 0,
          minStock: Number(formData.minStock) || 0,
          currentStock: Number(formData.currentStock) || 0,
          unit: formData.unit || 'Pcs',
          status: formData.status || 'ACTIVE'
        });
      } else {
        const generatedSku = formData.sku.trim() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
        await onCreateProduct({
          sku: generatedSku,
          name: formData.name.trim(),
          brand: finalBrand,
          machineCategory: finalCategory,
          price: Number(formData.price) || 0,
          currentStock: Number(formData.currentStock) || 0,
          minStock: Number(formData.minStock) || 10,
          unit: formData.unit || 'Pcs',
          status: formData.status || 'ACTIVE'
        });
      }
      setIsModalOpen(false);

      setSuccessModal({
        title: editingProduct ? "Master Produk Berhasil Diperbarui!" : "Master Produk Berhasil Dibuat!",
        message: editingProduct 
          ? "Perubahan data master produk & jumlah stok fisik telah berhasil disimpan ke database." 
          : "Master produk baru beserta stok fisik awal telah terdaftar di database.",
        details: [

          { label: "Nama Produk", value: formData.name.trim() },
          { label: "Merk / Brand", value: finalBrand },
          { label: "Status", value: formData.status === 'INACTIVE' ? '🔴 Non-Aktif' : '🟢 Aktif' },
          { label: "Stok Fisik Awal", value: editingProduct ? `${editingProduct.currentStock || 0} Pcs` : "0 Pcs (Input via Inbound)", highlight: true }
        ]
      });
    } catch (err) {
      setFormError(err.message || "Gagal menyimpan data produk.");
    }
  };

  // Toggle Master Product Active/Inactive Status
  const handleToggleProductStatus = async (product) => {
    if (!canManageProducts) return;
    const nextStatus = product.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    try {
      await onUpdateProduct(product.id, {
        ...product,
        status: nextStatus
      });
    } catch (err) {
      showAlert("Gagal Mengubah Status", err.message, "ERROR");
    }
  };

  // Bulk Branch Inventory Request Handlers (Requirement 5)
  const handleOpenBulkRequestModal = () => {
    setBulkStep(1);
    setBulkSearchTerm('');
    setSelectedProductIds([]);
    setBulkRequestItems([]);
    setBulkRequestError('');
    setIsBulkRequestModalOpen(true);
  };

  const handleToggleSelectProduct = (productId) => {
    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
    } else {
      setSelectedProductIds([...selectedProductIds, productId]);
    }
  };

  const handleSelectAllProducts = (productList) => {
    const activeProducts = productList.filter(p => p.status !== 'INACTIVE');
    if (selectedProductIds.length === activeProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(activeProducts.map(p => p.id));
    }
  };

  const handleProceedToQtyStep = () => {
    if (selectedProductIds.length === 0) {
      setBulkRequestError("Silakan centang minimal 1 produk dari katalog master.");
      return;
    }
    setBulkRequestError('');
    const items = selectedProductIds.map(id => {
      const targetP = products.find(p => p.id === id);
      return {
        productId: targetP.id,
        sku: targetP.sku,
        productName: targetP.name,
        brand: targetP.brand || 'Generic',
        price: targetP.price || 0,
        unit: targetP.unit || 'Pcs',
        stockQuantity: 10,
        minStock: targetP.minStock || 5,
        notes: ''
      };
    });
    setBulkRequestItems(items);
    setBulkStep(2);
  };

  const handleSubmitBulkInventoryRequest = async (e) => {
    e.preventDefault();
    if (bulkRequestItems.length === 0) return;
    setBulkRequestError('');

    try {
      for (const item of bulkRequestItems) {
        if (onRequestBranchInventory) {
          await onRequestBranchInventory({
            productId: item.productId,
            sku: item.sku,
            productName: item.productName,
            brand: item.brand,
            price: item.price,
            unit: item.unit || 'Pcs',
            stockQuantity: Number(item.stockQuantity) || 1,
            minStock: Number(item.minStock) || 5,
            notes: item.notes
          });
        }
      }
      setIsBulkRequestModalOpen(false);

      setSuccessModal({
        title: "Pengajuan Inventaris Massal Terkirim!",
        message: `Pengajuan inventaris untuk ${bulkRequestItems.length} produk telah dikirimkan ke Gudang Pusat untuk verifikasi.`,
        details: [
          { label: "Jumlah Item", value: `${bulkRequestItems.length} Produk`, highlight: true },
          { label: "Cabang", value: currentUser?.branchName || 'Cabang' },
          { label: "Status", value: "⏳ Menunggu Persetujuan Admin" }
        ]
      });
    } catch (err) {
      setBulkRequestError(err.message || "Gagal mengirim pengajuan inventaris massal.");
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
      showAlert("Gagal Menyetujui", err.message, "ERROR");
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
      showAlert("Gagal Menolak", err.message, "ERROR");
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
                onClick={() => setIsMachineCategoryManagerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Kelola Kategori Mesin</span>
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
              onClick={handleOpenBulkRequestModal}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>+ Ajukan Inventaris Produk (Multi-Pick)</span>
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
          
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari SKU, nama produk, merk, atau kategori mesin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-1/2 sm:w-44 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="ALL">Semua Merk</option>
                {allBrandNames.map(bName => (
                  <option key={bName} value={bName}>{bName}</option>
                ))}
              </select>

              <select
                value={machineCategoryFilter}
                onChange={(e) => setMachineCategoryFilter(e.target.value)}
                className="w-1/2 sm:w-48 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="ALL">Semua Kategori Mesin</option>
                {allMachineCategories.map(cName => (
                  <option key={cName} value={cName}>{cName}</option>
                ))}
              </select>
            </div>
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
                      <th className="px-4 py-3">Kategori Mesin</th>
                      <th className="px-4 py-3">SKU Master</th>
                      <th className="px-4 py-3 text-right">Harga Unit</th>
                      <th className="px-4 py-3 text-center">Stok Pusat</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((prod) => (
                      <tr key={prod.id} className={`hover:bg-slate-50/70 transition ${prod.status === 'INACTIVE' ? 'bg-slate-50/60 opacity-60' : ''}`}>
                        <td className="px-5 py-3.5 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{prod.name}</span>
                            <span className="px-2 py-0.2 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {prod.brand || 'Generic'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-600">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                            {prod.machineCategory || prod.kategoriMesin || 'Universal'}
                          </span>
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
                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            prod.status === 'INACTIVE'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {prod.status === 'INACTIVE' ? '🔴 Non-Aktif' : '🟢 Aktif'}
                          </span>
                        </td>
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
                                  onClick={() => handleToggleProductStatus(prod)}
                                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                                    prod.status === 'INACTIVE' 
                                      ? 'text-emerald-600 hover:bg-emerald-50' 
                                      : 'text-amber-600 hover:bg-amber-50'
                                  }`}
                                  title={prod.status === 'INACTIVE' ? 'Aktifkan Produk' : 'Non-aktifkan Produk (Soft Delete)'}
                                >
                                  {prod.status === 'INACTIVE' ? <Check className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                </button>
                                <button
                                   onClick={() => handleOpenStockAdjustModal(prod, 'MASTER')}
                                   className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                   title="Edit / Opname Stok Direct"
                                 >
                                   <Sliders className="w-4 h-4" />
                                 </button>
                                 <button
                                   onClick={() => handleOpenEditModal(prod)}
                                   className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                                   title="Ubah Produk Master & Spesifikasi (Termasuk Stok)"
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
                            {isApproved && (
                              <button
                                onClick={() => handleOpenStockAdjustModal(inv, 'BRANCH')}
                                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition cursor-pointer inline-flex items-center gap-1"
                                title="Edit / Opname Stok Cabang Direct"
                              >
                                <Sliders className="w-4 h-4" />
                                <span className="text-[11px] font-bold">Edit Stok</span>
                              </button>
                            )}
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
                    {editingProduct ? 'Ubah Master Produk Pusat' : 'Tambah Master Produk'}
                  </h3>
                  <p className="text-xs text-slate-400">Master template katalog SKU dan spesifikasi produk.</p>
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

              {/* Machine Category Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Kategori Mesin *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewCategory(!isCreatingNewCategory);
                      setNewCategoryInput('');
                    }}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                  >
                    {isCreatingNewCategory ? '← Pilih Kategori Mesin' : '+ Buat Kategori Mesin Baru'}
                  </button>
                </div>

                {isCreatingNewCategory ? (
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Mesin Heidelberg Offset GTO..."
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-amber-50 border border-amber-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-amber-950"
                  />
                ) : (
                  <select
                    value={formData.machineCategory}
                    onChange={(e) => setFormData({ ...formData, machineCategory: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {allMachineCategories.map(cName => (
                      <option key={cName} value={cName}>{cName}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Price, Stock Quantity & Min Stock Threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Jumlah Stok (Pcs) *</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded font-extrabold">EDIT STOK</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3.5 py-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-extrabold text-emerald-950"
                  />
                  <p className="text-[10px] text-emerald-700 mt-1">Stok fisik gudang pusat</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Batas Minimum (Alert)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Alert stok menipis</p>
                </div>
              </div>


              {/* Unit Standard */}
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

              {/* Physical Stock Guidance Notice */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">💡 Pengaturan & Update Stok Fisik Barang:</p>
                  <p>Anda dapat mengedit jumlah stok fisik secara langsung pada kolom <strong>Jumlah Stok (Pcs)</strong> di atas, atau melalui menu <strong>Inbound (Stok Masuk)</strong> jika memiliki Surat Jalan resmi dari pabrik.</p>
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
      {/* MODAL 3B: MACHINE CATEGORY MANAGER (ADMIN & STAFF PUSAT)                 */}
      {/* ========================================================================= */}
      {canManageProducts && isMachineCategoryManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-amber-50/50">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Kelola Master Kategori Mesin</h3>
                  <p className="text-xs text-slate-400">Tambah & hapus master tipe/kategori mesin.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMachineCategoryManagerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              {categoryManagerError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{categoryManagerError}</span>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik kategori mesin baru..."
                  value={newCategoryManagerInput}
                  onChange={(e) => setNewCategoryManagerInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <button
                  onClick={async () => {
                    if (!newCategoryManagerInput.trim()) return;
                    try {
                      setCategoryManagerError('');
                      if (onCreateMachineCategory) {
                        await onCreateMachineCategory(newCategoryManagerInput.trim());
                      }
                      setNewCategoryManagerInput('');
                    } catch (err) {
                      setCategoryManagerError(err.message || 'Gagal menambah kategori mesin.');
                    }
                  }}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex-shrink-0"
                >
                  Tambah
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 pr-1">
                {allMachineCategoriesList.map(c => {
                  const mappedCount = products.filter(p => (p.machineCategory || p.kategoriMesin || 'Universal / Semua Mesin').toLowerCase() === c.name.toLowerCase()).length;
                  return (
                    <div key={c.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 text-xs">{c.name}</span>
                        {mappedCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            {mappedCount} produk
                          </span>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Hapus kategori mesin "${c.name}"?`)) return;
                          try {
                            setCategoryManagerError('');
                            if (onDeleteMachineCategory) {
                              await onDeleteMachineCategory(c.id || c.name);
                            }
                          } catch (err) {
                            setCategoryManagerError(err.message || 'Gagal menghapus kategori mesin.');
                          }
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        title="Hapus kategori mesin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
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

      {/* ========================================================================= */}
      {/* MODAL 5: BULK INVENTORY REQUEST MODAL (SEARCH & MULTI-CHECK)              */}
      {/* ========================================================================= */}
      {isBulkRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150 my-8">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-emerald-50/50">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Ajukan Inventaris Cabang (Multi-Pick)</h3>
                  <p className="text-xs text-slate-500">Pilih beberapa produk master sekaligus lalu atur kuantitas pengajuan.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsBulkRequestModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bulkRequestError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{bulkRequestError}</span>
              </div>
            )}

            {/* STEP 1: LIVE SEARCH & MULTI-CHECKLIST */}
            {bulkStep === 1 && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Cari nama produk, SKU, merk, atau kategori mesin..."
                      value={bulkSearchTerm}
                      onChange={(e) => setBulkSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const filtered = products.filter(p => 
                        p.status !== 'INACTIVE' &&
                        ((p.name || '').toLowerCase().includes(bulkSearchTerm.toLowerCase()) ||
                         (p.sku || '').toLowerCase().includes(bulkSearchTerm.toLowerCase()) ||
                         (p.brand || '').toLowerCase().includes(bulkSearchTerm.toLowerCase()))
                      );
                      handleSelectAllProducts(filtered);
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap"
                  >
                    Pilih Semua ({selectedProductIds.length})
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {products
                    .filter(p => 
                      p.status !== 'INACTIVE' &&
                      ((p.name || '').toLowerCase().includes(bulkSearchTerm.toLowerCase()) ||
                       (p.sku || '').toLowerCase().includes(bulkSearchTerm.toLowerCase()) ||
                       (p.brand || '').toLowerCase().includes(bulkSearchTerm.toLowerCase()))
                    )
                    .map(prod => {
                      const isSelected = selectedProductIds.includes(prod.id);
                      return (
                        <div 
                          key={prod.id} 
                          onClick={() => handleToggleSelectProduct(prod.id)}
                          className={`p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition ${
                            isSelected ? 'bg-emerald-50/60' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-xs sm:text-sm">{prod.name}</span>
                                <span className="px-2 py-0.2 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                  {prod.brand || 'Generic'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                SKU: <span className="font-mono">{prod.sku}</span> • Rp {(Number(prod.price) || 0).toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-slate-400">
                            {isSelected ? '✓ Terpilih' : '+ Pilih'}
                          </span>
                        </div>
                      );
                    })
                  }
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-emerald-700">
                    {selectedProductIds.length} produk dicentang
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBulkRequestModalOpen(false)}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToQtyStep}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Lanjut ke Pengisian Qty</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: REVIEW & SET QUANTITIES */}
            {bulkStep === 2 && (
              <form onSubmit={handleSubmitBulkInventoryRequest} className="p-6 space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                  <span>Atur kuantitas fisik stok yang diminta untuk masing-masing item ({bulkRequestItems.length} produk):</span>
                  <button
                    type="button"
                    onClick={() => setBulkStep(1)}
                    className="text-emerald-700 font-bold underline hover:text-emerald-900 cursor-pointer"
                  >
                    ← Kembali Pilih Produk
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
                  {bulkRequestItems.map((item, idx) => (
                    <div key={item.productId} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">{item.productName}</span>
                          <span className="ml-2 text-[11px] font-mono text-slate-500">({item.sku})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = bulkRequestItems.filter((_, i) => i !== idx);
                            setBulkRequestItems(updated);
                            setSelectedProductIds(selectedProductIds.filter(id => id !== item.productId));
                            if (updated.length === 0) setBulkStep(1);
                          }}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          title="Hapus dari pengajuan"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                            Qty Diminta (Pcs)
                          </label>
                          <input 
                            type="number"
                            min="1"
                            value={item.stockQuantity}
                            onChange={(e) => {
                              const updated = [...bulkRequestItems];
                              updated[idx].stockQuantity = e.target.value;
                              setBulkRequestItems(updated);
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-extrabold text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                            Min Stock Alert
                          </label>
                          <input 
                            type="number"
                            min="1"
                            value={item.minStock}
                            onChange={(e) => {
                              const updated = [...bulkRequestItems];
                              updated[idx].minStock = e.target.value;
                              setBulkRequestItems(updated);
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                            Catatan / Alasan
                          </label>
                          <input 
                            type="text"
                            placeholder="Contoh: Stok etalase habis"
                            value={item.notes}
                            onChange={(e) => {
                              const updated = [...bulkRequestItems];
                              updated[idx].notes = e.target.value;
                              setBulkRequestItems(updated);
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsBulkRequestModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Pengajuan ({bulkRequestItems.length} Produk)</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: QUICK STOCK ADJUSTMENT (OPNAME / DIRECT EDIT STOK)                 */}
      {/* ========================================================================= */}
      {adjustingStockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-emerald-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-950 text-base">Edit / Opname Stok Direct</h3>
                  <p className="text-xs text-emerald-800">Ubah jumlah stok fisik secara langsung.</p>
                </div>
              </div>
              <button 
                onClick={() => setAdjustingStockItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleExecuteStockAdjust} className="p-6 space-y-4 text-sm">
              
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Detail Produk</span>
                <h4 className="font-bold text-slate-900 text-sm">{adjustingStockItem.data.name || adjustingStockItem.data.productName}</h4>
                <p className="text-xs text-slate-500 font-mono">
                  SKU: {adjustingStockItem.data.sku} | Brand: {adjustingStockItem.data.brand || 'Generic'}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {adjustingStockItem.type === 'MASTER' ? 'Gudang Utama Pusat' : `Cabang: ${adjustingStockItem.data.branchName || 'Cabang'}`}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Jumlah Stok Fisik Baru (Pcs) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newStockQtyInput}
                  onChange={(e) => setNewStockQtyInput(e.target.value)}
                  className="w-full px-4 py-3 bg-emerald-50 border-2 border-emerald-400 rounded-xl text-center text-xl font-extrabold text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-xs text-slate-500 mt-1 text-center">
                  Stok Sebelumnya: <strong className="text-slate-800">{adjustingStockItem.type === 'MASTER' ? (adjustingStockItem.data.currentStock ?? 0) : (adjustingStockItem.data.stockQuantity ?? 0)} Pcs</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Alasan / Catatan Penyesuaian
                </label>
                <input
                  type="text"
                  placeholder="Misal: Opname bulanan, barang rusak, koreksi selisih"
                  value={adjustStockNotes}
                  onChange={(e) => setAdjustStockNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingStockItem(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStockAdjust}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan Stok</span>
                </button>
              </div>
            </form>
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

      {/* INTERACTIVE CUSTOM ALERT MODAL */}
      <CustomAlertModal
        isOpen={Boolean(alertModal)}
        onClose={() => setAlertModal(null)}
        title={alertModal?.title}
        message={alertModal?.message}
        type={alertModal?.type}
      />

    </div>
  );
}



