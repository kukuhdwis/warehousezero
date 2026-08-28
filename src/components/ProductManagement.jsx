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
  Sliders,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Folder,
  FolderOpen,
  Store,
  MapPin,
  LayoutGrid
} from 'lucide-react';
import GlobalSuccessModal from './GlobalSuccessModal';
import CustomAlertModal from './CustomAlertModal';
import ConfirmationModal from './ConfirmationModal';

export default function ProductManagement({ 
  currentUser,
  products = [], 
  branchInventories = [],
  branches = [],
  brands = [],
  machineCategories = [],
  initialTab,
  onCreateProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onCreateBrand,
  onDeleteBrand,
  onCreateMachineCategory,
  onDeleteMachineCategory,
  onShowBarcode,
  onApproveBranchInventory,
  onRejectBranchInventory,
  onApproveBranchRequest,
  onRejectBranchRequest,
  onUpdateBranchInventory,
  onRequestBranchInventory
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

  // Selected Branch Container State (Wadah Cabang)
  // null = Show overview of all branch containers
  // 'GUDANG-PUSAT' | branchId = View products & brands inside that specific branch
  const [selectedBranchId, setSelectedBranchId] = useState(
    isBranchStaff ? (currentUser?.branchId || 'CABANG') : null
  );

  // Sub-tabs
  // Admin/Pusat: 'BRANCH_CONTAINERS' | 'MASTER_CATALOG' | 'APPROVAL_REQUESTS' | 'ALL_BRANCH_INVENTORIES'
  // Branch: 'MY_BRANCH_INVENTORY' | 'MASTER_CATALOG_REF'
  const [activeSubTab, setActiveSubTab] = useState(
    initialTab || (isBranchStaff ? 'MY_BRANCH_INVENTORY' : 'BRANCH_CONTAINERS')
  );

  React.useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

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

  // Modals & Confirmation States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmMasterModalOpen, setIsConfirmMasterModalOpen] = useState(false);
  const [isBrandManagerOpen, setIsBrandManagerOpen] = useState(false);
  const [isMachineCategoryManagerOpen, setIsMachineCategoryManagerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [deleteConfirmBrand, setDeleteConfirmBrand] = useState(null);
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState(null);
  
  // Pending Approval States (Group & Single)
  const [approvingBranchGroup, setApprovingBranchGroup] = useState(null);
  const [approvingItem, setApprovingItem] = useState(null);
  const [rejectingTarget, setRejectingTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [isExecutingApproval, setIsExecutingApproval] = useState(false);
  const [expandedBranches, setExpandedBranches] = useState({});
  const [confirmStockAdjustItem, setConfirmStockAdjustItem] = useState(null);

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

  // Unified Branch Inventory Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isConfirmRequestModalOpen, setIsConfirmRequestModalOpen] = useState(false);
  const [requestSearchTerm, setRequestSearchTerm] = useState('');
  const [requestItems, setRequestItems] = useState([]); // [{ productId, sku, productName, brand, price, unit, stockQuantity, minStock, notes }]
  const [requestError, setRequestError] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const [isCreatingNewBrand, setIsCreatingNewBrand] = useState(false);
  const [newBrandInput, setNewBrandInput] = useState('');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newBrandManagerInput, setNewBrandManagerInput] = useState('');
  const [newCategoryManagerInput, setNewCategoryManagerInput] = useState('');
  const [formError, setFormError] = useState('');
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

  // Derive guaranteed branches list
  const hasPusatInList = branches.some(b => b.isPusat === true || b.code === 'GUDANG-PUSAT' || (b.name || '').toLowerCase().includes('gudang utama pusat'));
  const guaranteedBranches = hasPusatInList ? branches : [
    { id: 'GUDANG-PUSAT', name: 'Gudang Utama Pusat', code: 'GUDANG-PUSAT', isPusat: true, isProtected: true, managerName: 'Staff Gudang Pusat', address: 'Jl. Raya Utama Pusat No. 1, Jakarta Pusat', pic: 'Staff Gudang Pusat' },
    ...branches
  ];

  // Calculate Branch Container Statistics (Wadah Cabang)
  const branchContainers = guaranteedBranches.map(branch => {
    const isThisPusat = branch.isPusat === true || branch.code === 'GUDANG-PUSAT' || (branch.name || '').toLowerCase().includes('gudang utama pusat');
    
    if (isThisPusat) {
      const activeProducts = products.filter(p => p.status !== 'INACTIVE');
      const totalStock = products.reduce((acc, p) => acc + (Number(p.currentStock) || 0), 0);
      const branchBrands = Array.from(new Set(products.map(p => p.brand || 'Generic').filter(Boolean)));
      return {
        ...branch,
        id: branch.id || 'GUDANG-PUSAT',
        isPusat: true,
        totalSKU: activeProducts.length,
        totalStock: totalStock,
        brandsCount: branchBrands.length,
        brandsList: branchBrands,
        pendingCount: 0
      };
    } else {
      const branchItems = branchInventories.filter(bi => bi.branchId === branch.id || bi.branchName === branch.name);
      const approvedItems = branchItems.filter(bi => bi.status === 'APPROVED');
      const totalStock = approvedItems.reduce((acc, bi) => acc + (Number(bi.stockQuantity) || 0), 0);
      const branchBrands = Array.from(new Set(branchItems.map(bi => bi.brand || 'Generic').filter(Boolean)));
      const pendingBranchCount = branchItems.filter(bi => bi.status === 'PENDING_APPROVAL').length;
      return {
        ...branch,
        id: branch.id,
        isPusat: false,
        totalSKU: approvedItems.length,
        totalStock: totalStock,
        brandsCount: branchBrands.length,
        brandsList: branchBrands,
        pendingCount: pendingBranchCount
      };
    }
  });

  const selectedBranchObject = selectedBranchId 
    ? branchContainers.find(b => b.id === selectedBranchId || (b.isPusat && selectedBranchId === 'GUDANG-PUSAT') || b.code === selectedBranchId)
    : null;

  // Pending Approvals Count for Admin/Staff Pusat
  const pendingApprovals = branchInventories.filter(bi => bi.status === 'PENDING_APPROVAL');
  const pendingCount = pendingApprovals.length;

  // Group pending approvals by Branch
  const pendingByBranch = React.useMemo(() => {
    const groups = {};
    for (const req of pendingApprovals) {
      const bKey = req.branchId || req.branchName || 'CABANG';
      if (!groups[bKey]) {
        groups[bKey] = {
          branchId: req.branchId,
          branchName: req.branchName || 'Cabang',
          requestedBy: req.requestedBy || 'Staff Cabang',
          requestedAt: req.requestedAt,
          items: [],
          totalQty: 0
        };
      }
      groups[bKey].items.push(req);
      groups[bKey].totalQty += Number(req.stockQuantity) || 0;
    }
    return Object.values(groups);
  }, [pendingApprovals]);

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

  // Filtered Branch Inventories specifically for the active branch container
  const activeBranchItems = selectedBranchObject && !selectedBranchObject.isPusat
    ? branchInventories.filter(bi => bi.branchId === selectedBranchObject.id || bi.branchName === selectedBranchObject.name)
    : [];

  const filteredActiveBranchItems = activeBranchItems.filter(bi => {
    const matchesStatus = statusFilter === 'ALL' || bi.status === statusFilter;
    const matchesBrand = brandFilter === 'ALL' || bi.brand === brandFilter;
    const matchesSearch = 
      (bi.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bi.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bi.brand || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesBrand && matchesSearch;
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

  const handlePreStockAdjust = (e) => {
    e?.preventDefault();
    if (!adjustingStockItem) return;
    const newQty = Number(newStockQtyInput);
    if (isNaN(newQty) || newQty < 0) {
      showAlert("Kuantitas Tidak Valid", "Jumlah stok fisik baru harus berupa angka dan minimal 0.", "WARNING");
      return;
    }
    setConfirmStockAdjustItem(adjustingStockItem);
  };

  const handleExecuteSaveStockAdjust = async () => {
    if (!confirmStockAdjustItem) return;
    setIsSubmittingStockAdjust(true);
    try {
      const { type, data } = confirmStockAdjustItem;
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
      setConfirmStockAdjustItem(null);
      setAdjustingStockItem(null);
    } catch (err) {
      showAlert("Gagal Memperbarui Stok ⚠️", err.message, "ERROR");
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

  // Pre-submit validation before opening Master Product Confirmation Dialog
  const handlePreSubmitMasterProduct = (e) => {
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

    setIsConfirmMasterModalOpen(true);
  };

  // Submit Master Product to Database after user confirms in dialog
  const handleExecuteSaveMasterProduct = async () => {
    setFormError('');
    let finalBrand = isCreatingNewBrand ? newBrandInput.trim() : formData.brand.trim();
    let finalCategory = isCreatingNewCategory ? newCategoryInput.trim() : formData.machineCategory.trim();

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
      setIsConfirmMasterModalOpen(false);
      setIsModalOpen(false);

      setSuccessModal({
        title: editingProduct ? "Master Produk Berhasil Diperbarui!" : "Master Produk Berhasil Dibuat!",
        message: editingProduct 
          ? "Perubahan data master produk & spesifikasi telah berhasil disimpan ke database." 
          : "Master produk baru telah terdaftar di database.",
        details: [
          { label: "Nama Produk", value: formData.name.trim() },
          { label: "Merk / Brand", value: finalBrand },
          { label: "Status", value: formData.status === 'INACTIVE' ? '🔴 Non-Aktif' : '🟢 Aktif' },
          { label: "Stok Fisik Awal", value: editingProduct ? `${editingProduct.currentStock || 0} Pcs` : "0 Pcs (Input via Inbound)", highlight: true }
        ]
      });
    } catch (err) {
      setFormError(err.message || "Gagal menyimpan data produk.");
      setIsConfirmMasterModalOpen(false);
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

  // Unified Branch Inventory Request Handlers
  const handleOpenRequestModal = (targetBranch = null, preselectedProduct = null) => {
    setRequestSearchTerm('');
    setRequestError('');
    if (preselectedProduct) {
      setRequestItems([{
        productId: preselectedProduct.id,
        sku: preselectedProduct.sku,
        productName: preselectedProduct.name,
        brand: preselectedProduct.brand || 'Generic',
        price: preselectedProduct.price || 0,
        unit: preselectedProduct.unit || 'Pcs',
        stockQuantity: 10,
        minStock: 5,
        notes: ''
      }]);
    } else {
      setRequestItems([]);
    }
    setIsRequestModalOpen(true);
  };

  const handleToggleProductInRequest = (prod) => {
    const exists = requestItems.some(item => item.productId === prod.id);
    if (exists) {
      setRequestItems(requestItems.filter(item => item.productId !== prod.id));
    } else {
      setRequestItems([
        ...requestItems,
        {
          productId: prod.id,
          sku: prod.sku,
          productName: prod.name,
          brand: prod.brand || 'Generic',
          price: prod.price || 0,
          unit: prod.unit || 'Pcs',
          stockQuantity: 10,
          minStock: 5,
          notes: ''
        }
      ]);
    }
  };

  const handleUpdateItemField = (productId, field, value) => {
    setRequestItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleRemoveItemFromRequest = (productId) => {
    setRequestItems(prev => prev.filter(item => item.productId !== productId));
  };

  // Pre-submit validation before opening Branch Inventory Confirmation Dialog
  const handlePreSubmitInventoryRequest = (e) => {
    e?.preventDefault();
    if (requestItems.length === 0) {
      setRequestError("Silakan pilih minimal 1 produk dari katalog master di atas.");
      return;
    }
    for (const item of requestItems) {
      if (!item.stockQuantity || Number(item.stockQuantity) <= 0) {
        setRequestError(`Jumlah stok fisik untuk "${item.productName}" harus lebih besar dari 0.`);
        return;
      }
    }
    setRequestError('');
    setIsConfirmRequestModalOpen(true);
  };

  // Submit Branch Inventory Request to Database after user confirms in dialog
  const handleExecuteSubmitInventoryRequest = async () => {
    setIsSubmittingRequest(true);
    try {
      const targetB = selectedBranchObject && !selectedBranchObject.isPusat ? selectedBranchObject : null;
      const branchId = targetB ? targetB.id : currentUser?.branchId;
      const branchName = targetB ? targetB.name : (currentUser?.branchName || 'Cabang');

      const payloadList = requestItems.map(item => ({
        productId: item.productId,
        sku: item.sku,
        productName: item.productName,
        brand: item.brand,
        price: item.price,
        unit: item.unit || 'Pcs',
        stockQuantity: Number(item.stockQuantity) || 1,
        minStock: Number(item.minStock) || 5,
        notes: item.notes || '',
        branchId: branchId,
        branchName: branchName
      }));

      if (onRequestBranchInventory) {
        await onRequestBranchInventory(payloadList);
      }
      setIsConfirmRequestModalOpen(false);
      setIsRequestModalOpen(false);
      setSuccessModal({
        title: "Pengajuan Inventaris Terkirim! 📋",
        message: `Pendaftaran stok fisik untuk ${requestItems.length} produk di ${branchName} telah dikirim ke Pusat.`,
        details: [
          { label: "Jumlah Produk", value: `${requestItems.length} Item`, highlight: true },
          { label: "Cabang", value: branchName },
          { label: "Status", value: "⏳ Menunggu Verifikasi Pusat" }
        ]
      });
    } catch (err) {
      setRequestError(err.message || "Gagal mengirim pengajuan inventaris.");
      setIsConfirmRequestModalOpen(false);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Toggle Branch Accordion
  const toggleExpandBranch = (branchKey) => {
    setExpandedBranches(prev => ({
      ...prev,
      [branchKey]: prev[branchKey] === false ? true : false
    }));
  };

  // Handle Approve Batch Branch Inventory
  const handleExecuteApproveGroup = async () => {
    if (!approvingBranchGroup) return;
    setIsExecutingApproval(true);
    try {
      const approveFn = onApproveBranchInventory || onApproveBranchRequest;
      if (approveFn) {
        await approveFn(approvingBranchGroup.items, currentUser);
      }
      setSuccessModal({
        title: "Seluruh Inventaris Cabang Disetujui! 🎉",
        message: `Semua ${approvingBranchGroup.items.length} produk inventaris yang diajukan oleh ${approvingBranchGroup.branchName} telah diverifikasi dan resmi aktif di database cabang.`,
        details: [
          { label: "Cabang", value: approvingBranchGroup.branchName },
          { label: "Jumlah Produk", value: `${approvingBranchGroup.items.length} Jenis Produk`, highlight: true },
          { label: "Total Kuantitas Fisik", value: `+${approvingBranchGroup.totalQty} Pcs` },
          { label: "Status", value: "✓ Resmi Masuk Database" }
        ]
      });
      setApprovingBranchGroup(null);
    } catch (err) {
      showAlert("Gagal Menyetujui ⚠️", err.message || "Terjadi kesalahan saat menyetujui pengajuan.", "ERROR");
    } finally {
      setIsExecutingApproval(false);
    }
  };

  // Handle Approve Single Item
  const handleExecuteApproveSingle = async () => {
    if (!approvingItem) return;
    setIsExecutingApproval(true);
    try {
      const approveFn = onApproveBranchInventory || onApproveBranchRequest;
      if (approveFn) {
        await approveFn([approvingItem], currentUser);
      }
      setSuccessModal({
        title: "Pengajuan Produk Disetujui! 🎉",
        message: `Inventaris untuk "${approvingItem.productName}" telah diverifikasi dan resmi aktif di cabang ${approvingItem.branchName || 'Cabang'}.`,
        details: [
          { label: "Cabang", value: approvingItem.branchName || 'Cabang' },
          { label: "Produk", value: approvingItem.productName },
          { label: "Stok Aktif", value: `+${approvingItem.stockQuantity} Pcs`, highlight: true }
        ]
      });
      setApprovingItem(null);
    } catch (err) {
      showAlert("Gagal Menyetujui ⚠️", err.message || "Terjadi kesalahan saat menyetujui pengajuan.", "ERROR");
    } finally {
      setIsExecutingApproval(false);
    }
  };

  // Handle Reject Inventory Request (Batch or Single with required description)
  const handleExecuteReject = async () => {
    if (!rejectingTarget) return;
    const reason = rejectionReason.trim();
    if (!reason) {
      setRejectionError("Mohon isi deskripsi / alasan penolakan agar pihak cabang mengetahui penyebabnya.");
      return;
    }
    setIsExecutingApproval(true);
    try {
      const rejectFn = onRejectBranchInventory || onRejectBranchRequest;
      if (rejectFn) {
        const itemsToReject = rejectingTarget.type === 'GROUP' 
          ? rejectingTarget.data.items 
          : [rejectingTarget.data];
        await rejectFn(itemsToReject, currentUser, reason);
      }
      const branchName = rejectingTarget.type === 'GROUP' 
        ? rejectingTarget.data.branchName 
        : (rejectingTarget.data.branchName || 'Cabang');
      const count = rejectingTarget.type === 'GROUP' 
        ? rejectingTarget.data.items.length 
        : 1;

      setSuccessModal({
        title: "Pengajuan Berhasil Ditolak ⚠️",
        message: `${count} produk pengajuan dari ${branchName} telah ditolak dengan alasan resmi.`,
        details: [
          { label: "Cabang", value: branchName },
          { label: "Jumlah Item", value: `${count} Produk` },
          { label: "Alasan Penolakan", value: `"${reason}"`, highlight: true }
        ]
      });
      setRejectingTarget(null);
      setRejectionReason('');
      setRejectionError('');
    } catch (err) {
      showAlert("Gagal Menolak ⚠️", err.message || "Terjadi kesalahan saat menolak pengajuan.", "ERROR");
    } finally {
      setIsExecutingApproval(false);
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
              onClick={() => handleOpenRequestModal()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>+ Ajukan Inventaris Barang</span>
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
              onClick={() => {
                setActiveSubTab('BRANCH_CONTAINERS');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === 'BRANCH_CONTAINERS'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Wadah Inventaris Cabang ({branchContainers.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('MASTER_CATALOG');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === 'MASTER_CATALOG'
                  ? 'bg-indigo-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Katalog Master Pusat ({products.length})</span>
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
              <span>Rekap Seluruh Cabang ({branchInventories.filter(bi => bi.status === 'APPROVED').length})</span>
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
      {/* TAB 0: WADAH INVENTARIS CABANG (BRANCH AS A CONTAINER)                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'BRANCH_CONTAINERS' && (
        <div className="space-y-4">
          
          {/* ------------------------------------------------------------------- */}
          {/* LEVEL 1: OVERVIEW OF ALL BRANCH CONTAINERS (FOLDER CARDS GRID)      */}
          {/* ------------------------------------------------------------------- */}
          {selectedBranchId === null ? (
            <div className="space-y-5">
              {/* Guidance Banner */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center flex-shrink-0 text-sky-300">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Wadah Inventaris & Produk Antar-Cabang</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/30 text-sky-200 border border-sky-400/30">
                        {branchContainers.length} Wadah Aktif
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                      Pilih cabang sebagai wadah operasional. Klik pada kartu cabang untuk membuka dan mengatur katalog produk, stok fisik, serta merk khusus barang di cabang tersebut.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">Pilih Cabang:</span>
                </div>
              </div>

              {/* Branch Container Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {branchContainers.map((b) => {
                  const isPusat = b.isPusat;
                  return (
                    <div 
                      key={b.id}
                      onClick={() => {
                        setSelectedBranchId(b.id);
                        setSearchTerm('');
                        setBrandFilter('ALL');
                      }}
                      className={`group relative bg-white rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer p-5 flex flex-col justify-between overflow-hidden ${
                        isPusat 
                          ? 'border-indigo-200 hover:border-indigo-500 bg-gradient-to-b from-indigo-50/30 to-white' 
                          : 'border-slate-200 hover:border-sky-500'
                      }`}
                    >
                      {/* Top Bar */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold flex-shrink-0 transition-transform group-hover:scale-105 ${
                              isPusat 
                                ? 'bg-indigo-600 text-white shadow-xs' 
                                : 'bg-slate-100 text-slate-700 group-hover:bg-sky-100 group-hover:text-sky-700'
                            }`}>
                              {isPusat ? <Package className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-base group-hover:text-sky-600 transition">
                                {b.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-xs text-slate-500">{b.code || 'CABANG'}</span>
                                <span className={`px-2 py-0.2 rounded-md text-[10px] font-bold ${
                                  isPusat 
                                    ? 'bg-indigo-100 text-indigo-800' 
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {isPusat ? '⭐ Master HQ' : 'Gudang Cabang'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {b.pendingCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                              ⏳ {b.pendingCount} Pending
                            </span>
                          )}
                        </div>

                        {/* Location & PIC */}
                        <div className="text-xs text-slate-500 space-y-1 mb-4 pt-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>PIC: <strong className="text-slate-700">{b.managerName || b.pic || 'Staff Cabang'}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{b.address || 'Alamat cabang'}</span>
                          </div>
                        </div>

                        {/* Metrics Summary Row */}
                        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center mb-4">
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SKU Aktif</div>
                            <div className="text-sm font-extrabold text-slate-900 mt-0.5">{b.totalSKU}</div>
                          </div>
                          <div className="border-x border-slate-200/80 px-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stok Fisik</div>
                            <div className="text-sm font-extrabold text-emerald-600 mt-0.5">{b.totalStock} Pcs</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Merk</div>
                            <div className="text-sm font-extrabold text-indigo-600 mt-0.5">{b.brandsCount}</div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Button */}
                      <button
                        type="button"
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          isPusat
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                            : 'bg-slate-900 group-hover:bg-sky-600 text-white shadow-2xs'
                        }`}
                      >
                        <span>{isPusat ? 'Buka Master Produk & Merk Pusat' : 'Buka & Atur Produk Cabang'}</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ------------------------------------------------------------------- */
            /* LEVEL 2: INSIDE THE SELECTED BRANCH CONTAINER                       */
            /* ------------------------------------------------------------------- */
            <div className="space-y-4">
              
              {/* Breadcrumb & Quick Switcher Bar */}
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setSelectedBranchId(null);
                      setSearchTerm('');
                      setBrandFilter('ALL');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Semua Wadah Cabang</span>
                  </button>

                  <ChevronRight className="w-4 h-4 text-slate-400" />

                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-sky-600" />
                      {selectedBranchObject?.name || 'Cabang'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      selectedBranchObject?.isPusat 
                        ? 'bg-indigo-100 text-indigo-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {selectedBranchObject?.isPusat ? 'Master HQ' : 'Wadah Cabang Aktif'}
                    </span>
                  </div>
                </div>

                {/* Quick Branch Switcher Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold hidden md:inline">Pindah Wadah:</span>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedBranchId(val === 'OVERVIEW' ? null : val);
                      setSearchTerm('');
                      setBrandFilter('ALL');
                    }}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value="OVERVIEW">📁 « Semua Wadah Cabang »</option>
                    {branchContainers.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.isPusat ? '(Pusat)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Branch Header Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 text-white p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                      {selectedBranchObject?.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-white/10 text-sky-200 border border-white/10">
                      {selectedBranchObject?.code || 'CABANG'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    {selectedBranchObject?.address} • PIC: <strong className="text-white">{selectedBranchObject?.managerName || selectedBranchObject?.pic || 'Staff Cabang'}</strong>
                  </p>
                  
                  {/* Brand & Stock Pill Highlights */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="px-3 py-1 bg-white/10 text-white rounded-lg text-xs font-semibold">
                      📦 Total SKU: <strong>{selectedBranchObject?.totalSKU || 0} Produk</strong>
                    </span>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-lg text-xs font-semibold">
                      ⚡ Stok Fisik: <strong>{selectedBranchObject?.totalStock || 0} Pcs</strong>
                    </span>
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-lg text-xs font-semibold">
                      🏷️ Merk Aktif: <strong>{selectedBranchObject?.brandsCount || 0} Merk</strong>
                    </span>
                  </div>
                </div>

                {/* Branch Specific Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap self-start md:self-center">
                  {selectedBranchObject?.isPusat ? (
                    <>
                      <button
                        onClick={handleOpenAddModal}
                        className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Buat Master Produk</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleOpenRequestModal(selectedBranchObject)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-4 h-4" />
                      <span>+ Ajukan Inventaris Barang</span>
                    </button>
                  )}
                </div>
              </div>

              {/* --------------------------------------------------------------- */}
              {/* INSIDE BRANCH: TOOLBAR & BRAND FILTER                           */}
              {/* --------------------------------------------------------------- */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Cari produk atau SKU di ${selectedBranchObject?.name}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                {/* Filter Merk Khusus Cabang Ini */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                    className="w-1/2 sm:w-48 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="ALL">🏷️ Semua Merk ({selectedBranchObject?.isPusat ? allBrandNames.length : (selectedBranchObject?.brandsList?.length || 0)})</option>
                    {(selectedBranchObject?.isPusat ? allBrandNames : (selectedBranchObject?.brandsList || [])).map(bName => (
                      <option key={bName} value={bName}>{bName}</option>
                    ))}
                  </select>

                  {!selectedBranchObject?.isPusat && (
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-1/2 sm:w-40 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="ALL">Semua Status</option>
                      <option value="APPROVED">✓ Aktif (Disetujui)</option>
                      <option value="PENDING_APPROVAL">⏳ Menunggu</option>
                      <option value="REJECTED">⚠️ Ditolak</option>
                    </select>
                  )}
                </div>
              </div>

              {/* --------------------------------------------------------------- */}
              {/* INSIDE BRANCH: PRODUCTS TABLE                                   */}
              {/* --------------------------------------------------------------- */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {selectedBranchObject?.isPusat ? (
                  /* Pusat Master Products Table */
                  filteredProducts.length === 0 ? (
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
                  )
                ) : (
                  /* Specific Branch Products Table */
                  filteredActiveBranchItems.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 space-y-2">
                      <Boxes className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                      <p className="text-sm font-medium">Belum ada inventaris produk di {selectedBranchObject?.name}.</p>
                      <button
                        onClick={handleOpenBulkRequestModal}
                        className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl active:scale-95 transition cursor-pointer"
                      >
                        + Ajukan / Tambah Produk ke Cabang Ini Sekarang
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-100">
                          <tr>
                            <th className="px-5 py-3">Produk & Merk</th>
                            <th className="px-4 py-3 text-center">Stok Fisik Cabang</th>
                            <th className="px-4 py-3 text-right">Harga Jual</th>
                            <th className="px-4 py-3 text-center">Status Validasi</th>
                            <th className="px-4 py-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredActiveBranchItems.map((inv) => {
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
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => onShowBarcode(inv)}
                                      className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                      title="Cetak Barcode / QR"
                                    >
                                      <QrCode className="w-4 h-4" />
                                    </button>
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
                                    {isPending && (
                                      <button
                                        onClick={() => handleOpenApproveModal(inv)}
                                        className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
                                      >
                                        Setujui
                                      </button>
                                    )}
                                  </div>
                                </td>

                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
                      {!isBranchStaff ? (
                        <th className="px-4 py-3 text-center">Stok Pusat</th>
                      ) : (
                        <th className="px-4 py-3 text-center">Katalog Pusat</th>
                      )}
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
                        {!isBranchStaff ? (
                          <td className="px-4 py-3.5 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                              {prod.currentStock || 0} Pcs
                            </span>
                          </td>
                        ) : (
                          <td className="px-4 py-3.5 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                              ⭐ Tersedia
                            </span>
                          </td>
                        )}
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
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onShowBarcode(prod)}
                              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Cetak Barcode / QR"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>

                            {/* BRANCH STAFF DIRECT REGISTRATION BUTTON */}
                            {isBranchStaff && (
                              <button
                                type="button"
                                onClick={() => handleOpenRequestModal(null, prod)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap"
                                title="Daftarkan stok fisik produk ini yang ada di cabang Anda"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>+ Daftarkan ke Cabang</span>
                              </button>
                            )}

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
      {/* TAB 2: PENDING APPROVAL REQUESTS (GROUPED BY BRANCH FIRST)                */}
      {/* ========================================================================= */}
      {!isBranchStaff && activeSubTab === 'APPROVAL_REQUESTS' && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-amber-900 text-sm">Persetujuan & Validasi Inventaris Cabang</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Pengajuan dikelompokkan berdasarkan cabang agar Anda dapat memverifikasi dan menyetujui seluruh pengajuan sekaligus.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-200/80 text-amber-900 rounded-xl font-extrabold text-xs whitespace-nowrap">
                {pendingByBranch.length} Cabang Pengaju
              </span>
              <span className="px-3 py-1 bg-amber-600 text-white rounded-xl font-extrabold text-xs whitespace-nowrap">
                {pendingCount} Produk
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {pendingByBranch.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
                <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 stroke-1" />
                <p className="text-sm font-bold text-slate-700">Semua pengajuan inventaris cabang telah selesai divalidasi!</p>
                <p className="text-xs text-slate-400">Tidak ada pengajuan yang tertunda saat ini.</p>
              </div>
            ) : (
              pendingByBranch.map((group) => {
                const groupKey = group.branchId || group.branchName;
                const isExpanded = expandedBranches[groupKey] !== false; // Default expanded

                return (
                  <div 
                    key={groupKey} 
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition hover:border-amber-400"
                  >
                    {/* Branch Group Card Header */}
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50/50 via-white to-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 flex-shrink-0">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900 text-base sm:text-lg">{group.branchName}</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{group.items.length} Produk Diajukan</span>
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-200">
                              Total +{group.totalQty} Pcs Fisik
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Diajukan oleh: <strong className="text-slate-800 font-semibold">{group.requestedBy}</strong> • Waktu: <span className="text-slate-600">{new Date(group.requestedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons for this Branch */}
                      <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingTarget({ type: 'GROUP', data: group });
                            setRejectionReason('');
                            setRejectionError('');
                          }}
                          className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-rose-200/60"
                        >
                          <Ban className="w-4 h-4" />
                          <span>Tolak Semua ({group.items.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setApprovingBranchGroup(group)}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/20 transition active:scale-95 flex items-center gap-2 cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>Setujui Semua ({group.items.length} Produk)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleExpandBranch(groupKey)}
                          className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                          title={isExpanded ? "Sembunyikan Rincian Produk" : "Tampilkan Rincian Produk"}
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Group Items Table (Visible when expanded) */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 bg-slate-50/50">
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                              <tr>
                                <th className="px-4 py-3">Nama Produk Master</th>
                                <th className="px-3 py-3">Merk / Brand</th>
                                <th className="px-3 py-3 font-mono">SKU</th>
                                <th className="px-3 py-3 text-center">Kuantitas Fisik</th>
                                <th className="px-3 py-3">Catatan Pengajuan</th>
                                <th className="px-4 py-3 text-right">Aksi Satuan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {group.items.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                                  <td className="px-4 py-3 font-bold text-slate-900">
                                    {item.productName}
                                  </td>
                                  <td className="px-3 py-3">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                      {item.brand || 'Generic'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 font-mono text-slate-500">{item.sku}</td>
                                  <td className="px-3 py-3 text-center">
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      {item.stockQuantity} Pcs
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-slate-600 italic">
                                    {item.notes || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRejectingTarget({ type: 'SINGLE', data: item });
                                          setRejectionReason('');
                                          setRejectionError('');
                                        }}
                                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                        title="Tolak produk ini saja"
                                      >
                                        <Ban className="w-3 h-3" />
                                        <span>Tolak</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setApprovingItem(item)}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
                                        title="Setujui produk ini saja"
                                      >
                                        <Check className="w-3 h-3" />
                                        <span>Setujui</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
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
                <p className="text-sm font-medium">Belum ada inventaris produk fisik cabang yang didaftarkan.</p>
                {isBranchStaff && (
                  <button
                    onClick={() => handleOpenRequestModal()}
                    className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl active:scale-95 transition cursor-pointer shadow-xs inline-flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>+ Ajukan Inventaris Barang</span>
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
                      <th className="px-4 py-3 text-center">Stok Fisik di Cabang</th>
                      <th className="px-4 py-3 text-right">Harga Jual</th>
                      <th className="px-4 py-3 text-center">Status Verifikasi Pusat</th>
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
                                ✓ Terverifikasi & Aktif
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                <Clock className="w-3 h-3" />
                                ⏳ Menunggu Verifikasi Pusat
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200" title={inv.rejectionReason || 'Ditolak'}>
                                <Ban className="w-3 h-3" />
                                ⚠️ Ditolak Pusat
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
      {/* UNIFIED MODAL: AJUKAN INVENTARIS BARANG CABANG                            */}
      {/* ========================================================================= */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150 my-8">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-emerald-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Ajukan Inventaris Barang Cabang</h3>
                  <p className="text-xs text-slate-500">Pilih produk dari katalog master dan daftarkan kuantitas stok fisik cabang.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRequestModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePreSubmitInventoryRequest} className="p-6 space-y-4 text-sm">
              {requestError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{requestError}</span>
                </div>
              )}

              {/* 1. Master Product Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Pilih Produk dari Katalog Master ({products.filter(p => p.status !== 'INACTIVE').length} Tersedia):
                </label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama produk, SKU, atau merk katalog..."
                    value={requestSearchTerm}
                    onChange={(e) => setRequestSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {products
                    .filter(p => 
                      p.status !== 'INACTIVE' &&
                      ((p.name || '').toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
                       (p.sku || '').toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
                       (p.brand || '').toLowerCase().includes(requestSearchTerm.toLowerCase()))
                    )
                    .map(prod => {
                      const isSelected = requestItems.some(item => item.productId === prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => handleToggleProductInRequest(prod)}
                          className={`p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition ${
                            isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-500' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800 text-xs">{prod.name}</span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                  {prod.brand || 'Generic'}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 font-mono">
                                SKU: {prod.sku} • Rp {(Number(prod.price) || 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-700">
                            {isSelected ? '✓ Terpilih' : '+ Pilih'}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* 2. Configuration for Selected Items */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Atur Stok Fisik & Keterangan ({requestItems.length} Produk Dipilih):
                </label>

                {requestItems.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-slate-400 text-xs">
                    Klik / centang produk di atas untuk mengatur jumlah stok fisik cabang.
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1">
                    {requestItems.map((item) => (
                      <div key={item.productId} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800 text-xs">{item.productName}</span>
                            <span className="ml-1.5 text-[11px] font-mono text-slate-500">({item.sku})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromRequest(item.productId)}
                            className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                            title="Hapus item ini"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                              Stok Fisik di Cabang (Pcs) *
                            </label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={item.stockQuantity}
                              onChange={(e) => handleUpdateItemField(item.productId, 'stockQuantity', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-extrabold text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                              Batas Minimum Stok (Pcs)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.minStock}
                              onChange={(e) => handleUpdateItemField(item.productId, 'minStock', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div className="col-span-2 sm:col-span-1">
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                              Catatan Fisik
                            </label>
                            <input
                              type="text"
                              placeholder="Contoh: Stok toko"
                              value={item.notes}
                              onChange={(e) => handleUpdateItemField(item.productId, 'notes', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Note */}
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>Verifikasi Data Kantor Pusat:</span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  Data stok fisik yang didaftarkan akan berstatus <strong>Menunggu Verifikasi Pusat</strong> untuk memastikan data barang cabang valid sebelum resmi masuk sistem monitoring.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-emerald-800">
                  {requestItems.length} produk dipilih
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={requestItems.length === 0 || isSubmittingRequest}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingRequest ? 'Mengirim...' : `Kirim Pengajuan (${requestItems.length} Produk)`}</span>
                  </button>
                </div>
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

            <form onSubmit={handlePreSubmitMasterProduct} className="p-6 space-y-4 text-sm">
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
      {/* MODAL: DECLINE / REJECT INVENTORY REQUEST (WITH DESCRIPTION)              */}
      {/* ========================================================================= */}
      {rejectingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-rose-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Ban className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {rejectingTarget.type === 'GROUP' 
                      ? `Tolak Pengajuan ${rejectingTarget.data.branchName}` 
                      : `Tolak Pengajuan "${rejectingTarget.data.productName}"`}
                  </h3>
                  <p className="text-xs text-rose-600 font-medium">Beri deskripsi / alasan penolakan</p>
                </div>
              </div>
              <button 
                onClick={() => setRejectingTarget(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="text-slate-500">
                  Target: <strong className="text-slate-800">{rejectingTarget.type === 'GROUP' ? `${rejectingTarget.data.branchName} (${rejectingTarget.data.items.length} Produk, Total ${rejectingTarget.data.totalQty} Pcs)` : `${rejectingTarget.data.productName} (${rejectingTarget.data.stockQuantity} Pcs)`}</strong>
                </div>
                <div className="text-slate-500">
                  Diajukan oleh: <strong className="text-slate-700">{rejectingTarget.data.requestedBy || 'Staff Cabang'}</strong>
                </div>
              </div>

              {rejectionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{rejectionError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Deskripsi / Alasan Penolakan *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Hasil hitung fisik tidak sesuai surat jalan, barang belum tiba di gudang cabang, salah pilih SKU barang..."
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (rejectionError) setRejectionError('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none transition leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Deskripsi ini akan dikirimkan sebagai notifikasi ke pihak cabang pengaju.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isExecutingApproval}
                  onClick={handleExecuteReject}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{isExecutingApproval ? 'Memproses...' : (rejectingTarget.type === 'GROUP' ? `Tolak Semua (${rejectingTarget.data.items.length} Produk)` : 'Tolak Produk Ini')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION: APPROVE BATCH BRANCH INVENTORY */}
      {approvingBranchGroup && (
        <ConfirmationModal
          isOpen={Boolean(approvingBranchGroup)}
          onClose={() => setApprovingBranchGroup(null)}
          onConfirm={handleExecuteApproveGroup}
          title={`Setujui Seluruh Inventaris ${approvingBranchGroup.branchName}?`}
          subtitle="Semua stok produk yang diajukan akan diverifikasi dan langsung aktif di database cabang."
          type="SUCCESS"
          confirmText={`Ya, Setujui Semua (${approvingBranchGroup.items.length} Produk)`}
          cancelText="Batal"
          isLoading={isExecutingApproval}
          maxWidth="max-w-xl"
          summaryItems={[
            { label: "Cabang Pengaju", value: approvingBranchGroup.branchName, highlight: true },
            { label: "Total Jenis Produk", value: `${approvingBranchGroup.items.length} Produk` },
            { label: "Total Kuantitas Fisik", value: `+${approvingBranchGroup.totalQty} Pcs`, color: 'text-emerald-700 font-extrabold text-sm' },
            { label: "Petugas Pengaju", value: approvingBranchGroup.requestedBy }
          ]}
          itemsList={approvingBranchGroup.items.map(item => ({
            name: item.productName,
            sku: item.sku,
            brand: item.brand,
            qty: item.stockQuantity,
            unit: item.unit || 'Pcs',
            note: item.notes || 'Stok fisik cabang'
          }))}
          itemsTitle="Daftar Produk yang Disetujui:"
          warningNote="Setelah disetujui, stok fisik ini akan resmi aktif di sistem monitoring cabang dan dapat digunakan untuk transaksi."
        />
      )}

      {/* CONFIRMATION: APPROVE SINGLE ITEM */}
      {approvingItem && (
        <ConfirmationModal
          isOpen={Boolean(approvingItem)}
          onClose={() => setApprovingItem(null)}
          onConfirm={handleExecuteApproveSingle}
          title="Setujui Pengajuan Produk Ini?"
          subtitle="Stok produk ini akan langsung aktif di database cabang."
          type="SUCCESS"
          confirmText="Ya, Setujui Produk Ini"
          cancelText="Batal"
          isLoading={isExecutingApproval}
          summaryItems={[
            { label: "Nama Produk", value: approvingItem.productName, highlight: true },
            { label: "Cabang", value: approvingItem.branchName || 'Cabang' },
            { label: "SKU", value: approvingItem.sku },
            { label: "Kuantitas Fisik", value: `+${approvingItem.stockQuantity} Pcs`, color: 'text-emerald-700 font-extrabold text-sm' },
            { label: "Catatan Fisik", value: approvingItem.notes || '-' }
          ]}
        />
      )}

      {/* DELETE CONFIRM MASTER PRODUCT MODAL */}
      {deleteConfirmProduct && (
        <ConfirmationModal
          isOpen={Boolean(deleteConfirmProduct)}
          onClose={() => setDeleteConfirmProduct(null)}
          onConfirm={async () => {
            await onDeleteProduct(deleteConfirmProduct.id);
            setDeleteConfirmProduct(null);
          }}
          title="Konfirmasi Hapus Master Produk"
          subtitle="Tindakan ini akan menghapus master produk dari katalog database."
          type="DANGER"
          confirmText="Ya, Hapus Master Produk"
          cancelText="Batal"
          summaryItems={[
            { label: "Nama Produk", value: deleteConfirmProduct.name, highlight: true },
            { label: "SKU Produk", value: deleteConfirmProduct.sku },
            { label: "Merk / Brand", value: deleteConfirmProduct.brand || 'Generic' },
            { label: "Stok Fisik Pusat", value: `${deleteConfirmProduct.currentStock || 0} Pcs`, color: 'text-rose-600 font-bold' }
          ]}
          warningNote="PENTING: Menghapus master produk dapat mempengaruhi riwayat transaksi dan data katalog referensi cabang."
        />
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
            <form onSubmit={handlePreStockAdjust} className="p-6 space-y-4 text-sm">
              
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

      {/* INTERACTIVE APPROVAL CONFIRMATION MODAL */}
      {approvingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Setujui Pengajuan Inventaris?</h3>
                <p className="text-xs text-slate-500 font-medium">Validasi stok cabang kantor pusat</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              Stok sebanyak <strong className="text-emerald-700 font-extrabold">{approvingItem.stockQuantity} Pcs</strong> untuk produk <strong className="text-slate-900 font-bold">"{approvingItem.productName}"</strong> di cabang <strong className="text-slate-900 font-bold">{approvingItem.branchName || 'Cabang'}</strong> akan resmi diaktifkan di database.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApprovingItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteApprove}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Ya, Setujui Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UNIVERSAL CONFIRMATION MODALS (PRE-SUBMIT VERIFICATION)                   */}
      {/* ========================================================================= */}

      {/* 1. CONFIRMATION: AJUKAN INVENTARIS BARANG CABANG */}
      <ConfirmationModal
        isOpen={isConfirmRequestModalOpen}
        onClose={() => setIsConfirmRequestModalOpen(false)}
        onConfirm={handleExecuteSubmitInventoryRequest}
        title="Konfirmasi Pengajuan Inventaris Cabang"
        subtitle="Periksa kembali produk dan jumlah stok fisik sebelum dikirim ke Kantor Pusat."
        type="SUCCESS"
        confirmText="Ya, Kirim Pengajuan ke Pusat"
        cancelText="← Periksa / Ubah Lagi"
        isLoading={isSubmittingRequest}
        maxWidth="max-w-xl"
        summaryItems={[
          { label: "Cabang Pengaju", value: selectedBranchObject?.name || currentUser?.branchName || 'Cabang', highlight: true },
          { label: "Total Jenis Produk", value: `${requestItems.length} Produk` },
          { label: "Total Kuantitas Fisik", value: `${requestItems.reduce((acc, i) => acc + (Number(i.stockQuantity) || 0), 0)} Pcs`, color: 'text-emerald-700 font-extrabold text-sm' },
          { label: "Status Verifikasi", value: "⏳ Menunggu Verifikasi Pusat" }
        ]}
        itemsList={requestItems.map(item => ({
          name: item.productName,
          sku: item.sku,
          brand: item.brand,
          qty: item.stockQuantity,
          unit: item.unit || 'Pcs',
          note: item.notes || 'Stok fisik cabang',
          price: item.price
        }))}
        itemsTitle="Daftar Produk yang Diajukan:"
        warningNote="Data inventaris ini akan masuk ke daftar verifikasi Admin / Kantor Pusat terlebih dahulu sebelum resmi aktif di sistem monitoring cabang."
      />

      {/* 2. CONFIRMATION: TAMBAH / UBAH MASTER PRODUK */}
      <ConfirmationModal
        isOpen={isConfirmMasterModalOpen}
        onClose={() => setIsConfirmMasterModalOpen(false)}
        onConfirm={handleExecuteSaveMasterProduct}
        title={editingProduct ? "Konfirmasi Ubah Master Produk" : "Konfirmasi Buat Master Produk"}
        subtitle="Pastikan informasi SKU, merk, dan spesifikasi produk sudah benar."
        type="PRIMARY"
        confirmText={editingProduct ? "Ya, Simpan Perubahan" : "Ya, Tambahkan Master Produk"}
        cancelText="← Cek Kembali"
        summaryItems={[
          { label: "Nama Produk", value: formData.name.trim(), highlight: true },
          { label: "SKU Produk", value: formData.sku.trim() || (editingProduct ? editingProduct.sku : '(Auto-generated)') },
          { label: "Merk / Brand", value: isCreatingNewBrand ? newBrandInput.trim() : formData.brand },
          { label: "Kategori Mesin", value: isCreatingNewCategory ? newCategoryInput.trim() : formData.machineCategory },
          { label: "Batas Min. Stok", value: `${formData.minStock || 0} Pcs` },
          { label: "Status Produk", value: formData.status === 'INACTIVE' ? '🔴 Non-Aktif' : '🟢 Aktif' }
        ]}
        warningNote="Master produk ini akan menjadi template resmi katalog yang dapat dipilih oleh seluruh cabang."
      />

      {/* 3. CONFIRMATION: PENYESUAIAN STOK FISIK / OPNAME */}
      {confirmStockAdjustItem && (
        <ConfirmationModal
          isOpen={Boolean(confirmStockAdjustItem)}
          onClose={() => setConfirmStockAdjustItem(null)}
          onConfirm={handleExecuteSaveStockAdjust}
          title="Konfirmasi Penyesuaian Stok (Opname)"
          subtitle="Pastikan hasil hitung fisik sudah sesuai sebelum mengubah jumlah stok."
          type="WARNING"
          confirmText="Ya, Simpan Penyesuaian Stok"
          cancelText="← Cek Kembali"
          isLoading={isSubmittingStockAdjust}
          summaryItems={[
            { label: "Nama Produk", value: confirmStockAdjustItem.data.name || confirmStockAdjustItem.data.productName, highlight: true },
            { label: "Lokasi Gudang", value: confirmStockAdjustItem.type === 'MASTER' ? 'Gudang Utama Pusat' : `Cabang: ${confirmStockAdjustItem.data.branchName || 'Cabang'}` },
            { label: "Stok Sebelumnya", value: `${confirmStockAdjustItem.type === 'MASTER' ? (confirmStockAdjustItem.data.currentStock ?? 0) : (confirmStockAdjustItem.data.stockQuantity ?? 0)} Pcs` },
            { label: "Stok Fisik Baru", value: `${Number(newStockQtyInput) || 0} Pcs`, color: 'text-amber-800 font-extrabold text-sm' },
            { label: "Selisih Stok", value: `${(Number(newStockQtyInput) || 0) - (confirmStockAdjustItem.type === 'MASTER' ? (confirmStockAdjustItem.data.currentStock ?? 0) : (confirmStockAdjustItem.data.stockQuantity ?? 0))} Pcs` },
            { label: "Alasan / Catatan", value: adjustStockNotes || 'Opname / koreksi fisik' }
          ]}
          warningNote="Perubahan stok fisik ini akan langsung dicatat ke database dan mempengaruhi total inventaris yang dimonitor."
        />
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



