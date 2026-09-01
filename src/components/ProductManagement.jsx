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
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Folder,
  FolderOpen,
  Store,
  MapPin,
  LayoutGrid,
  FileSpreadsheet,
  Download,
  Car,
  Wrench,
  DollarSign,
  Image as ImageIcon,
  Upload,
  Camera,
  Link2,
  Eye,
  Hash,
  CheckSquare,
  Square,
  MinusSquare,
  Trash
} from 'lucide-react';
import GlobalSuccessModal from './GlobalSuccessModal';
import CustomAlertModal from './CustomAlertModal';
import ConfirmationModal from './ConfirmationModal';
import SpreadsheetImportModal from './SpreadsheetImportModal';
import { downloadExhaustTemplate, generateSmartSKU } from '../services/spreadsheetService';
import { compressImage } from '../services/dataService';

// Unified Pagination Bar Component
function PaginationControl({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemName = "produk",
  pageSizeOptions = [10, 25, 50, 100, 0]
}) {
  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = totalItems === 0 ? 0 : (pageSize === 0 ? 1 : (safePage - 1) * pageSize + 1);
  const endItem = pageSize === 0 ? totalItems : Math.min(safePage * pageSize, totalItems);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (safePage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (safePage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages);
    }
    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div className="bg-white px-3.5 py-3 sm:px-5 sm:py-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
      {/* Left: Summary and Page Size Selector */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 w-full md:w-auto justify-between md:justify-start">
        <span className="text-slate-600 font-medium">
          Menampilkan <strong className="text-slate-900 font-extrabold">{startItem} - {endItem}</strong> dari <strong className="text-slate-900 font-extrabold">{totalItems}</strong> {itemName}
        </span>

        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
          <span className="text-slate-500 font-medium">Baris:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 0 ? 'Semua' : opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Page Navigation Buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 flex-wrap justify-center w-full md:w-auto">
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            className={`px-2.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1 text-xs ${
              safePage <= 1
                ? 'text-slate-300 cursor-not-allowed bg-slate-50 border border-slate-100'
                : 'text-slate-700 hover:bg-slate-100 border border-slate-200 bg-white cursor-pointer active:scale-95'
            }`}
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1.5 py-1 text-slate-400 font-bold">
                  ...
                </span>
              );
            }
            const isCurrent = p === safePage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-[30px] h-7 px-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100 bg-white border border-slate-200'
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            className={`px-2.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1 text-xs ${
              safePage >= totalPages
                ? 'text-slate-300 cursor-not-allowed bg-slate-50 border border-slate-100'
                : 'text-slate-700 hover:bg-slate-100 border border-slate-200 bg-white cursor-pointer active:scale-95'
            }`}
            title="Halaman Selanjutnya"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

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
  onDeleteProductsBatch,
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

  const DEFAULT_ENGINE_TYPES = [
    'ALL',
    '2KD',
    '2GD/1GD',
    '4D56',
    '4N15',
    'Universal / Semua Mesin',
    '1NZ-FE / 2NR',
    'L15 / R18'
  ];

  const DEFAULT_EXHAUST_CATEGORIES = [
    'Downpipe',
    'Frontpipe',
    'Centerpipe',
    'Bolt-on',
    'Full System',
    'Muffler / Silencer',
    'Header / Manifold',
    'Resonator',
    'Catless / Decat',
    'Valvetronic System'
  ];

  const DEFAULT_MACHINE_CATEGORIES = DEFAULT_ENGINE_TYPES;

  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [engineTypeFilter, setEngineTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [machineCategoryFilter, setMachineCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');

  // Pagination States for Product Catalogs and Lists
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPageSize, setCatalogPageSize] = useState(25); // 10, 25, 50, 100, 0 (Semua)

  const [branchPage, setBranchPage] = useState(1);
  const [branchPageSize, setBranchPageSize] = useState(25);

  const [recapPage, setRecapPage] = useState(1);
  const [recapPageSize, setRecapPageSize] = useState(25);

  // Auto-reset page to 1 when filters or search change
  React.useEffect(() => {
    setCatalogPage(1);
  }, [searchTerm, brandFilter, engineTypeFilter, categoryFilter, machineCategoryFilter, statusFilter]);

  React.useEffect(() => {
    setBranchPage(1);
  }, [searchTerm, brandFilter, statusFilter, selectedBranchId]);

  React.useEffect(() => {
    setRecapPage(1);
  }, [searchTerm, statusFilter, selectedBranchFilter]);

  // Modals & Confirmation States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportSpreadsheetOpen, setIsImportSpreadsheetOpen] = useState(false);
  const [isConfirmMasterModalOpen, setIsConfirmMasterModalOpen] = useState(false);
  const [isBrandManagerOpen, setIsBrandManagerOpen] = useState(false);
  const [isMachineCategoryManagerOpen, setIsMachineCategoryManagerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [deleteConfirmBrand, setDeleteConfirmBrand] = useState(null);
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState(null);
  
  // Multi-Selection (Bulk Delete / Bulk Actions)
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isExecutingDelete, setIsExecutingDelete] = useState(false);
  
  // Pending Approval States (Group & Single)
  const [approvingBranchGroup, setApprovingBranchGroup] = useState(null);
  const [approvingItem, setApprovingItem] = useState(null);
  const [rejectingTarget, setRejectingTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [isExecutingApproval, setIsExecutingApproval] = useState(false);
  const [expandedBranches, setExpandedBranches] = useState({});
  const [confirmStockAdjustItem, setConfirmStockAdjustItem] = useState(null);

  // Master Product Form State (Exhaust System Schema)
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    brand: 'NDK Exhaust',
    engine_type: '2KD',
    category_name: 'Downpipe',
    car_variant: '',
    spec_sound: 'Street (Bass)',
    spec_resonator: true,
    material_finish: 'SS Polos',
    reseller_price: 0,
    selling_price: 0,
    profit_amount: 0,
    profit_percentage: 0,
    imageUrl: '',
    description: '',
    notes: '',
    price: 0,
    minStock: 5,
    currentStock: 0,
    unit: 'Pcs',
    status: 'ACTIVE',
    machineCategory: '2KD'
  });

  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [photoInputType, setPhotoInputType] = useState('FILE'); // 'FILE' | 'URL'

  const handlePhotoUploadChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingPhoto(true);
      const compressed = await compressImage(file, 1200, 1200, 0.82);
      setFormData(prev => ({ ...prev, imageUrl: compressed }));
    } catch (err) {
      showAlert("Gagal Memproses Foto", err.message || "Pastikan file gambar valid (JPG, PNG, WebP).", "ERROR");
    } finally {
      setIsCompressingPhoto(false);
    }
  };

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

  // Filtered Master Products (Automotive Exhaust System Support)
  const filteredProducts = products.filter(p => {
    const pBrand = p.brand || 'NDK Exhaust';
    const pEngine = p.engine_type || p.engineType || p.machineCategory || p.kategoriMesin || 'Universal / Semua Mesin';
    const pCategory = p.category_name || p.categoryName || 'Downpipe';
    const pVariant = p.car_variant || p.carVariant || '';
    const pFinish = p.material_finish || p.materialFinish || '';
    const pSound = p.spec_sound || p.specSound || '';

    const matchesSearch = 
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      pBrand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pEngine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pVariant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pFinish.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pSound.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBrand = brandFilter === 'ALL' || pBrand === brandFilter;
    const matchesEngine = engineTypeFilter === 'ALL' || pEngine === engineTypeFilter || (engineTypeFilter === '2KD' && pEngine.includes('2KD')) || (engineTypeFilter === '2GD/1GD' && (pEngine.includes('2GD') || pEngine.includes('1GD')));
    const matchesCategory = categoryFilter === 'ALL' || pCategory === categoryFilter;
    const matchesMachineCat = machineCategoryFilter === 'ALL' || pEngine === machineCategoryFilter;

    return matchesSearch && matchesBrand && matchesEngine && matchesCategory && matchesMachineCat;
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

  // Paginated Master Products
  const totalCatalogPages = catalogPageSize === 0 ? 1 : Math.max(1, Math.ceil(filteredProducts.length / catalogPageSize));
  const safeCatalogPage = Math.min(Math.max(1, catalogPage), totalCatalogPages);
  const paginatedProducts = catalogPageSize === 0 
    ? filteredProducts 
    : filteredProducts.slice((safeCatalogPage - 1) * catalogPageSize, safeCatalogPage * catalogPageSize);

  // Paginated Active Branch Items
  const totalBranchPages = branchPageSize === 0 ? 1 : Math.max(1, Math.ceil(filteredActiveBranchItems.length / branchPageSize));
  const safeBranchPage = Math.min(Math.max(1, branchPage), totalBranchPages);
  const paginatedActiveBranchItems = branchPageSize === 0
    ? filteredActiveBranchItems
    : filteredActiveBranchItems.slice((safeBranchPage - 1) * branchPageSize, safeBranchPage * branchPageSize);

  // Paginated Recap Branch Items
  const totalRecapPages = recapPageSize === 0 ? 1 : Math.max(1, Math.ceil(myBranchInventories.length / recapPageSize));
  const safeRecapPage = Math.min(Math.max(1, recapPage), totalRecapPages);
  const paginatedMyBranchInventories = recapPageSize === 0
    ? myBranchInventories
    : myBranchInventories.slice((safeRecapPage - 1) * recapPageSize, safeRecapPage * recapPageSize);


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

  // Selection & Bulk Deletion Handlers
  const handleToggleSelectProduct = (id) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllOnPage = () => {
    const pageIds = paginatedProducts.map(p => p.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedProductIds.has(id));

    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach(id => next.delete(id));
      } else {
        pageIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredProducts.map(p => p.id);
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedProductIds.has(id));

    setSelectedProductIds(prev => {
      if (allSelected) {
        return new Set();
      } else {
        return new Set(allFilteredIds);
      }
    });
  };

  const handleClearSelection = () => {
    setSelectedProductIds(new Set());
  };

  const handleExecuteSingleDelete = async () => {
    if (!deleteConfirmProduct) return;
    setIsExecutingDelete(true);
    try {
      const prodName = deleteConfirmProduct.name;
      await onDeleteProduct(deleteConfirmProduct.id);
      setSelectedProductIds(prev => {
        const next = new Set(prev);
        next.delete(deleteConfirmProduct.id);
        return next;
      });
      setDeleteConfirmProduct(null);
      setSuccessModal({
        title: "Master Produk Berhasil Dihapus! 🗑️",
        message: `Master produk "${prodName}" telah resmi dihapus dari sistem.`,
        buttonText: "Tutup"
      });
    } catch (err) {
      showAlert("Gagal Menghapus Produk", err.message || "Terjadi kesalahan saat menghapus data.", "ERROR");
    } finally {
      setIsExecutingDelete(false);
    }
  };

  const handleExecuteBulkDelete = async () => {
    if (selectedProductIds.size === 0) return;
    setIsExecutingDelete(true);
    try {
      const idsToDelete = Array.from(selectedProductIds);
      const totalCount = idsToDelete.length;

      if (onDeleteProductsBatch) {
        await onDeleteProductsBatch(idsToDelete);
      } else {
        for (const id of idsToDelete) {
          await onDeleteProduct(id);
        }
      }

      setSelectedProductIds(new Set());
      setIsBulkDeleteModalOpen(false);
      setSuccessModal({
        title: "Hapus Massal Berhasil! 🗑️",
        message: `Sebanyak ${totalCount} master produk berhasil dihapus dari database.`,
        buttonText: "Tutup"
      });
    } catch (err) {
      showAlert("Gagal Menghapus Produk Massal", err.message || "Terjadi kesalahan saat menghapus data.", "ERROR");
    } finally {
      setIsExecutingDelete(false);
    }
  };

  // Auto-generate Smart SKU for Master Product Form
  const handleAutoGenerateFormSKU = () => {
    const engine = formData.engine_type || 'Universal';
    const cat = formData.category_name || formData.name || 'Downpipe';
    const existingSKUs = new Set(products.map(p => (p.sku || '').toLowerCase()));
    const generated = generateSmartSKU(engine, cat, formData.name, existingSKUs, products.length + 1);
    setFormData(prev => ({ ...prev, sku: generated.sku }));
  };

  // Open Master Product Add Modal
  const handleOpenAddModal = () => {
    if (!canManageProducts) return;
    setEditingProduct(null);
    setIsCreatingNewBrand(false);
    setNewBrandInput('');
    setIsCreatingNewCategory(false);
    setNewCategoryInput('');
    
    const existingSKUs = new Set(products.map(p => (p.sku || '').toLowerCase()));
    const initialSKU = generateSmartSKU('2KD', 'Downpipe', 'Downpipe', existingSKUs, products.length + 1).sku;

    setFormData({
      sku: initialSKU,
      name: '',
      brand: allBrandNames[0] || 'NDK Exhaust',
      engine_type: '2KD',
      category_name: 'Downpipe',
      car_variant: '',
      spec_sound: 'Street (Bass)',
      spec_resonator: true,
      material_finish: 'SS Polos',
      reseller_price: 0,
      selling_price: 0,
      profit_amount: 0,
      profit_percentage: 0,
      imageUrl: '',
      description: '',
      notes: '',
      price: 0,
      minStock: 5,
      currentStock: 0,
      unit: 'Pcs',
      status: 'ACTIVE',
      machineCategory: '2KD'
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

    const sellingPrice = Number(product.selling_price ?? product.sellingPrice ?? product.price) || 0;
    const resellerPrice = Number(product.reseller_price ?? product.resellerPrice) || 0;
    const profitAmount = product.profit_amount !== undefined ? Number(product.profit_amount) : (sellingPrice - resellerPrice);
    const profitPercentage = product.profit_percentage !== undefined ? Number(product.profit_percentage) : (resellerPrice > 0 ? ((profitAmount / resellerPrice) * 100) : 0);
    const engineType = product.engine_type || product.engineType || product.machineCategory || product.kategoriMesin || 'Universal / Semua Mesin';
    const categoryName = product.category_name || product.categoryName || 'Downpipe';

    setFormData({
      sku: product.sku || product.code || '',
      name: product.name || '',
      brand: product.brand || allBrandNames[0] || 'NDK Exhaust',
      engine_type: engineType,
      category_name: categoryName,
      car_variant: product.car_variant || product.carVariant || '',
      spec_sound: product.spec_sound || product.specSound || 'Street (Bass)',
      spec_resonator: product.spec_resonator !== undefined ? Boolean(product.spec_resonator) : true,
      material_finish: product.material_finish || product.materialFinish || 'SS Polos',
      reseller_price: resellerPrice,
      selling_price: sellingPrice,
      price: sellingPrice,
      profit_amount: profitAmount,
      profit_percentage: Math.round(profitPercentage * 100) / 100,
      imageUrl: product.imageUrl || product.image || product.photoUrl || '',
      description: product.description || '',
      notes: product.notes || '',
      minStock: product.minStock ?? 5,
      currentStock: product.currentStock ?? 0,
      unit: product.unit || 'Pcs',
      status: product.status || 'ACTIVE',
      machineCategory: engineType
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Pre-submit validation before opening Master Product Confirmation Dialog
  const handlePreSubmitMasterProduct = (e) => {
    e.preventDefault();
    if (!canManageProducts) return;
    setFormError('');

    let finalBrand = isCreatingNewBrand ? newBrandInput.trim() : (formData.brand || '').trim();
    if (!finalBrand) {
      setFormError("Merk / Brand produk wajib diisi.");
      return;
    }
    if (!formData.name.trim()) {
      setFormError("Nama produk / komponen knalpot wajib diisi.");
      return;
    }
    if (!formData.engine_type.trim()) {
      setFormError("Tipe mesin kendaraan wajib dipilih.");
      return;
    }

    setIsConfirmMasterModalOpen(true);
  };

  // Submit Master Product to Database after user confirms in dialog
  const handleExecuteSaveMasterProduct = async () => {
    setFormError('');
    let finalBrand = isCreatingNewBrand ? newBrandInput.trim() : formData.brand.trim();
    let finalEngine = formData.engine_type.trim() || 'Universal / Semua Mesin';
    let finalCategory = formData.category_name.trim() || 'Downpipe';

    const sellingPrice = Number(formData.selling_price) || Number(formData.price) || 0;
    const resellerPrice = Number(formData.reseller_price) || 0;
    const profitAmount = sellingPrice - resellerPrice;
    const profitPercentage = resellerPrice > 0 ? ((profitAmount / resellerPrice) * 100) : 0;

    try {
      if (isCreatingNewBrand && onCreateBrand && newBrandInput.trim()) {
        try {
          await onCreateBrand(finalBrand);
        } catch (bErr) {
          console.warn("Brand already exists:", bErr);
        }
      }

      const existingSKUs = new Set(products.map(p => (p.sku || '').toLowerCase()));
      const finalSKU = formData.sku.trim() || (editingProduct ? editingProduct.sku : generateSmartSKU(finalEngine, finalCategory, formData.name, existingSKUs, products.length + 1).sku);

      const productPayload = {
        code: finalSKU,
        sku: finalSKU,
        barcode: finalSKU,
        name: formData.name.trim(),
        brand: finalBrand,
        engine_type: finalEngine,
        category_name: finalCategory,
        car_variant: (formData.car_variant || '').trim() || '-',
        spec_sound: formData.spec_sound || 'Street (Bass)',
        spec_resonator: Boolean(formData.spec_resonator),
        material_finish: formData.material_finish || 'SS Polos',
        reseller_price: resellerPrice,
        selling_price: sellingPrice,
        price: sellingPrice, // Backward compatibility
        profit_amount: profitAmount,
        profit_percentage: Math.round(profitPercentage * 100) / 100,
        imageUrl: formData.imageUrl || '',
        description: (formData.description || '').trim(),
        notes: (formData.notes || '').trim(),
        machineCategory: finalEngine,
        minStock: Number(formData.minStock) || 5,
        currentStock: Number(formData.currentStock) || 0,
        unit: formData.unit || 'Pcs',
        status: formData.status || 'ACTIVE'
      };

      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, {
          ...editingProduct,
          ...productPayload
        });
      } else {
        await onCreateProduct(productPayload);
      }
      setIsConfirmMasterModalOpen(false);
      setIsModalOpen(false);

      setSuccessModal({
        title: editingProduct ? "Master Produk Berhasil Diperbarui!" : "Master Produk Berhasil Dibuat!",
        message: editingProduct 
          ? `Perubahan spesifikasi dan harga untuk "${formData.name.trim()}" telah tersimpan.` 
          : `Master produk knalpot "${formData.name.trim()}" (${finalSKU}) telah terdaftar.`,
        details: [
          { label: "Nama Produk", value: formData.name.trim() },
          { label: "SKU / Kode", value: finalSKU },
          { label: "Tipe Mesin", value: finalEngine },
          { label: "Kompatibilitas", value: formData.car_variant || '-' },
          { label: "Harga Reseller", value: `Rp ${resellerPrice.toLocaleString('id-ID')}` },
          { label: "Harga Jual Retail", value: `Rp ${sellingPrice.toLocaleString('id-ID')}` },
          { label: "Margin Profit", value: `+Rp ${profitAmount.toLocaleString('id-ID')} (${Math.round(profitPercentage * 10) / 10}%)`, highlight: true }
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
    <div className="space-y-4 sm:space-y-6 relative">
      
      {/* STICKY TOP SECTION */}
      <div className="sticky top-0 z-20 bg-slate-50 pt-2 pb-3 -mx-2 px-2 sm:-mx-4 sm:px-4 -mt-2 mb-2">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs mb-4">
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
            {/* Admin & Staff Pusat: Master Product + Spreadsheet Import + Brand Direct Permission */}
            {canManageProducts && (
              <>
                <button
                  onClick={downloadExhaustTemplate}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 rounded-xl text-xs font-bold transition cursor-pointer"
                  title="Unduh template Excel resmi format katalog exhaust system"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden sm:inline">Unduh Template</span>
                </button>

                <button
                  onClick={() => setIsImportSpreadsheetOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                  title="Import katalog produk exhaust system dari file Excel / CSV"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Import Spreadsheet</span>
                </button>

                <button
                  onClick={() => setIsBrandManagerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  <span>Merk</span>
                </button>

                <button
                  onClick={() => setIsMachineCategoryManagerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Kategori Mesin</span>
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
              {/* --------------------------------------------------------------- */}
              {/* INSIDE BRANCH: PRODUCTS TABLE & MOBILE CARDS                    */}
              {/* --------------------------------------------------------------- */}
              <div className="space-y-3">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  {selectedBranchObject?.isPusat ? (
                    /* Pusat Master Products Table */
                    filteredProducts.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 space-y-2">
                        <Package className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                        <p className="text-sm font-medium">Belum ada produk master yang sesuai filter.</p>
                      </div>
                    ) : (
                      <>
                        {/* Mobile Card Feed for Master in Branch View */}
                        <div className="block md:hidden divide-y divide-slate-100 p-2.5 sm:p-3 space-y-3 bg-slate-50/50">
                          {paginatedProducts.map((prod, idx) => {
                            const rowNumber = (safeCatalogPage - 1) * (catalogPageSize === 0 ? 0 : catalogPageSize) + idx + 1;
                            const isInactive = prod.status === 'INACTIVE';
                            const isSelected = selectedProductIds.has(prod.id);

                            return (
                              <div key={prod.id} className={`bg-white rounded-2xl border transition p-3.5 space-y-3 ${
                                isSelected 
                                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20' 
                                  : isInactive 
                                    ? 'opacity-70 bg-slate-50/70 border-slate-200 border-dashed' 
                                    : 'border-slate-200/90 hover:border-slate-300'
                              }`}>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    {canManageProducts && (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleSelectProduct(prod.id)}
                                        className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                                        title={isSelected ? "Batal pilih" : "Pilih produk ini"}
                                      >
                                        {isSelected ? (
                                          <CheckSquare className="w-5 h-5 text-indigo-600" />
                                        ) : (
                                          <Square className="w-5 h-5 text-slate-300" />
                                        )}
                                      </button>
                                    )}
                                    <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
                                      #{rowNumber}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isInactive ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                      {isInactive ? '🔴 Non-Aktif' : '🟢 Aktif'}
                                    </span>
                                  </div>
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                    Stok: {prod.currentStock || 0} Pcs
                                  </span>
                                </div>

                                <div className="flex items-start gap-2.5">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h4 className="font-bold text-slate-900 text-sm leading-snug break-words">{prod.name}</h4>
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap">{prod.brand || 'Generic'}</span>
                                    </div>
                                    <div className="text-xs font-mono font-bold text-slate-500 mt-0.5">SKU: {prod.sku}</div>
                                    <div className="text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-md px-2 py-0.5 mt-1 font-semibold inline-block">
                                      {prod.machineCategory || prod.kategoriMesin || 'Universal'}
                                    </div>
                                  </div>
                                </div>

                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-500">Harga Unit</span>
                                  <span className="font-extrabold text-slate-900 text-sm">Rp {(Number(prod.price) || 0).toLocaleString('id-ID')}</span>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5 flex-wrap">
                                  <button onClick={() => onShowBarcode(prod)} className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl transition cursor-pointer" title="Cetak Barcode">
                                    <QrCode className="w-4 h-4" />
                                  </button>
                                  {canManageProducts && (
                                    <>
                                      <button onClick={() => handleToggleProductStatus(prod)} className={`p-2 rounded-xl transition cursor-pointer border ${isInactive ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`} title={isInactive ? 'Aktifkan' : 'Non-aktifkan'}>
                                        {isInactive ? <Check className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                      </button>
                                      <button onClick={() => handleOpenStockAdjustModal(prod, 'MASTER')} className="p-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl transition cursor-pointer" title="Edit Stok">
                                        <Sliders className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleOpenEditModal(prod)} className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer">
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>Edit</span>
                                      </button>
                                      <button onClick={() => setDeleteConfirmProduct(prod)} className="p-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-xl transition cursor-pointer" title="Hapus">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Desktop Table View for Master in Branch View */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
                              <tr>
                                {canManageProducts && (
                                  <th className="px-3 py-3.5 text-center w-10 whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={handleSelectAllOnPage}
                                      className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer flex items-center justify-center mx-auto"
                                      title={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProductIds.has(p.id)) ? "Lepas pilihan halaman ini" : "Pilih semua di halaman ini"}
                                    >
                                      {paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProductIds.has(p.id)) ? (
                                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                                      ) : paginatedProducts.some(p => selectedProductIds.has(p.id)) ? (
                                        <MinusSquare className="w-4 h-4 text-indigo-600" />
                                      ) : (
                                        <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                                      )}
                                    </button>
                                  </th>
                                )}
                                <th className="px-3.5 py-3.5 text-center font-bold text-slate-500 text-xs w-12 whitespace-nowrap">No.</th>
                                <th className="px-5 py-3.5 min-w-[200px]">Produk & Merk</th>
                                <th className="px-4 py-3.5 min-w-[150px]">Kategori Mesin</th>
                                <th className="px-4 py-3.5 whitespace-nowrap min-w-[130px]">SKU Master</th>
                                <th className="px-4 py-3.5 text-right whitespace-nowrap min-w-[110px]">Harga Unit</th>
                                <th className="px-4 py-3.5 text-center whitespace-nowrap min-w-[100px]">Stok Pusat</th>
                                <th className="px-4 py-3.5 text-center whitespace-nowrap min-w-[95px]">Status</th>
                                <th className="px-5 py-3.5 text-right whitespace-nowrap min-w-[140px]">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {paginatedProducts.map((prod, idx) => {
                                const rowNumber = (safeCatalogPage - 1) * (catalogPageSize === 0 ? 0 : catalogPageSize) + idx + 1;
                                const isSelected = selectedProductIds.has(prod.id);
                                return (
                                  <tr key={prod.id} className={`transition ${
                                    isSelected 
                                      ? 'bg-indigo-50/40 hover:bg-indigo-50/60' 
                                      : prod.status === 'INACTIVE' 
                                        ? 'bg-slate-50/60 opacity-60 hover:bg-slate-100/70' 
                                        : 'hover:bg-slate-50/70'
                                  }`}>
                                    {/* Selection Checkbox */}
                                    {canManageProducts && (
                                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                                        <button
                                          type="button"
                                          onClick={() => handleToggleSelectProduct(prod.id)}
                                          className="p-1 transition cursor-pointer flex items-center justify-center mx-auto"
                                          title={isSelected ? "Batal pilih" : "Pilih produk ini"}
                                        >
                                          {isSelected ? (
                                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                                          ) : (
                                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                                          )}
                                        </button>
                                      </td>
                                    )}
                                    <td className="px-3.5 py-3.5 text-center font-bold text-slate-400 text-xs whitespace-nowrap">
                                      {rowNumber}
                                    </td>
                                    <td className="px-5 py-3.5 font-medium text-slate-900 min-w-[200px]">
                                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                        <span className="font-bold text-slate-900 leading-snug">{prod.name}</span>
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap flex-shrink-0">
                                          {prod.brand || 'Generic'}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-slate-600 min-w-[150px]">
                                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60 whitespace-nowrap inline-block">
                                        {prod.machineCategory || prod.kategoriMesin || 'Universal'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-xs font-mono text-slate-600 font-bold whitespace-nowrap">{prod.sku}</td>
                                    <td className="px-4 py-3.5 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                                      Rp {(Number(prod.price) || 0).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 whitespace-nowrap">
                                        {prod.currentStock || 0} Pcs
                                      </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap ${
                                        prod.status === 'INACTIVE'
                                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      }`}>
                                        {prod.status === 'INACTIVE' ? '🔴 Non-Aktif' : '🟢 Aktif'}
                                      </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                      <div className="flex items-center justify-end gap-1 flex-nowrap">
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
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
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
                      <>
                        {/* Mobile Card Feed for Specific Branch Items */}
                        <div className="block md:hidden divide-y divide-slate-100 p-2.5 sm:p-3 space-y-3 bg-slate-50/50">
                          {paginatedActiveBranchItems.map((inv, idx) => {
                            const rowNumber = (safeBranchPage - 1) * (branchPageSize === 0 ? 0 : branchPageSize) + idx + 1;
                            const isApproved = inv.status === 'APPROVED';
                            const isPending = inv.status === 'PENDING_APPROVAL';
                            const isRejected = inv.status === 'REJECTED';

                            return (
                              <div key={inv.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
                                    #{rowNumber}
                                  </span>
                                  {isApproved && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <Check className="w-3 h-3" />
                                      Aktif (Disetujui)
                                    </span>
                                  )}
                                  {isPending && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                      <Clock className="w-3 h-3" />
                                      Menunggu Validasi
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      <Ban className="w-3 h-3" />
                                      Ditolak
                                    </span>
                                  )}
                                </div>

                                <div>
                                  <h4 className="font-bold text-slate-900 text-sm leading-snug break-words">{inv.productName}</h4>
                                  <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-700">SKU: {inv.sku}</span>
                                    <span>•</span>
                                    <span className="text-indigo-600 font-semibold">{inv.brand}</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stok Cabang</span>
                                    <span className={`text-sm font-extrabold ${isApproved ? 'text-emerald-700' : 'text-slate-600'}`}>
                                      {inv.stockQuantity} Pcs
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Harga Jual</span>
                                    <span className="text-sm font-black text-slate-900">
                                      Rp {(Number(inv.price) || 0).toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                                  <button onClick={() => onShowBarcode(inv)} className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl transition cursor-pointer" title="Cetak Barcode">
                                    <QrCode className="w-4 h-4" />
                                  </button>
                                  {isApproved && (
                                    <button onClick={() => handleOpenStockAdjustModal(inv, 'BRANCH')} className="px-3 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs">
                                      <Sliders className="w-3.5 h-3.5" />
                                      <span>Edit Stok</span>
                                    </button>
                                  )}
                                  {isPending && (
                                    <button onClick={() => handleOpenApproveModal(inv)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition cursor-pointer shadow-2xs">
                                      Setujui
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Desktop Table View for Specific Branch Items */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
                              <tr>
                                <th className="px-3.5 py-3.5 text-center font-bold text-slate-500 text-xs w-12 whitespace-nowrap">No.</th>
                                <th className="px-5 py-3.5 min-w-[200px]">Produk & Merk</th>
                                <th className="px-4 py-3.5 text-center whitespace-nowrap min-w-[120px]">Stok Fisik Cabang</th>
                                <th className="px-4 py-3.5 text-right whitespace-nowrap min-w-[110px]">Harga Jual</th>
                                <th className="px-4 py-3.5 text-center whitespace-nowrap min-w-[130px]">Status Validasi</th>
                                <th className="px-5 py-3.5 text-right whitespace-nowrap min-w-[130px]">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {paginatedActiveBranchItems.map((inv, idx) => {
                                const rowNumber = (safeBranchPage - 1) * (branchPageSize === 0 ? 0 : branchPageSize) + idx + 1;
                                const isApproved = inv.status === 'APPROVED';
                                const isPending = inv.status === 'PENDING_APPROVAL';
                                const isRejected = inv.status === 'REJECTED';

                                return (
                                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                                    <td className="px-3.5 py-3.5 text-center font-bold text-slate-400 text-xs whitespace-nowrap">
                                      {rowNumber}
                                    </td>
                                    <td className="px-5 py-3.5 font-medium text-slate-900 min-w-[200px]">
                                      <div className="font-bold text-slate-900 leading-snug">{inv.productName}</div>
                                      <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span className="whitespace-nowrap font-bold text-slate-600">SKU: {inv.sku}</span>
                                        <span>•</span>
                                        <span className="text-indigo-600 font-semibold whitespace-nowrap">{inv.brand}</span>
                                      </div>
                                    </td>

                                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                                        isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                                      }`}>
                                        {inv.stockQuantity} Pcs
                                      </span>
                                    </td>

                                    <td className="px-4 py-3.5 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                                      Rp {(Number(inv.price) || 0).toLocaleString('id-ID')}
                                    </td>

                                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                      {isApproved && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                          <Check className="w-3.5 h-3.5" />
                                          Aktif (Disetujui)
                                        </span>
                                      )}
                                      {isPending && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse whitespace-nowrap">
                                          <Clock className="w-3.5 h-3.5" />
                                          Menunggu Validasi
                                        </span>
                                      )}
                                      {isRejected && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap" title={inv.rejectionReason || 'Ditolak'}>
                                          <Ban className="w-3.5 h-3.5" />
                                          Ditolak
                                        </span>
                                      )}
                                    </td>

                                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                      <div className="flex items-center justify-end gap-1.5 flex-nowrap">
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
                                            className="px-2.5 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs whitespace-nowrap"
                                            title="Edit / Opname Stok Cabang Direct"
                                          >
                                            <Sliders className="w-3.5 h-3.5" />
                                            <span>Edit Stok</span>
                                          </button>
                                        )}
                                        {isPending && (
                                          <button
                                            onClick={() => handleOpenApproveModal(inv)}
                                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition cursor-pointer whitespace-nowrap shadow-2xs"
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
                      </>
                    )
                  )}
                </div>

                {/* Pagination for Branch View */}
                {selectedBranchObject?.isPusat ? (
                  <PaginationControl
                    currentPage={safeCatalogPage}
                    totalItems={filteredProducts.length}
                    pageSize={catalogPageSize}
                    onPageChange={setCatalogPage}
                    onPageSizeChange={setCatalogPageSize}
                    itemName="produk master"
                  />
                ) : (
                  <PaginationControl
                    currentPage={safeBranchPage}
                    totalItems={filteredActiveBranchItems.length}
                    pageSize={branchPageSize}
                    onPageChange={setBranchPage}
                    onPageSizeChange={setBranchPageSize}
                    itemName="produk cabang"
                  />
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
          <div className="flex flex-col lg:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari SKU, komponen knalpot, tipe mesin (2KD, 2GD), varian mobil, finishing..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
              <select
                value={engineTypeFilter}
                onChange={(e) => setEngineTypeFilter(e.target.value)}
                className="w-full sm:w-44 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none flex-shrink-0"
              >
                <option value="ALL">Semua Tipe Mesin</option>
                {DEFAULT_ENGINE_TYPES.map(eName => (
                  <option key={eName} value={eName}>{eName}</option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-44 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none flex-shrink-0"
              >
                <option value="ALL">Semua Komponen</option>
                {DEFAULT_EXHAUST_CATEGORIES.map(cName => (
                  <option key={cName} value={cName}>{cName}</option>
                ))}
              </select>

              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full sm:w-36 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none flex-shrink-0"
              >
                <option value="ALL">Semua Merk</option>
                {allBrandNames.map(bName => (
                  <option key={bName} value={bName}>{bName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Multi-Select Floating Action Bar */}
          {canManageProducts && selectedProductIds.size > 0 && (
            <div className="sticky top-4 z-40 bg-slate-900/95 backdrop-blur-md text-white p-3 sm:p-4 rounded-2xl shadow-xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-200">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3 py-1.5 rounded-xl text-xs font-bold">
                  <CheckSquare className="w-4 h-4 text-rose-400" />
                  <span>{selectedProductIds.size} Produk Terpilih</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAllOnPage}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer font-semibold"
                  >
                    {paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProductIds.has(p.id)) 
                      ? 'Lepas Pilih Halaman Ini' 
                      : `Pilih Semua di Halaman (${paginatedProducts.length})`}
                  </button>

                  {filteredProducts.length > paginatedProducts.length && (
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer font-semibold"
                    >
                      {filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.has(p.id)) 
                        ? 'Lepas Semua Filter' 
                        : `Pilih Semua ${filteredProducts.length} Produk`}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-2.5 py-1.5 text-slate-400 hover:text-white transition cursor-pointer font-semibold"
                  >
                    Batal Pilih
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus {selectedProductIds.size} Produk Terpilih</span>
              </button>
            </div>
          )}

          {/* Master Product Grid / Table & Mobile Cards */}
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {filteredProducts.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Package className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                  <p className="text-sm font-medium">Belum ada produk master yang sesuai filter.</p>
                  <p className="text-xs text-slate-400">Silakan tambahkan produk master baru atau impor dari spreadsheet.</p>
                </div>
              ) : (
                <>
                  {/* MOBILE FEED VIEW (Smartphone Optimized - Full info, no horizontal scroll) */}
                  <div className="block md:hidden divide-y divide-slate-100 p-2.5 sm:p-3 space-y-3 bg-slate-50/50">
                    {paginatedProducts.map((prod, idx) => {
                      const rowNumber = (safeCatalogPage - 1) * (catalogPageSize === 0 ? 0 : catalogPageSize) + idx + 1;
                      const selling = Number(prod.selling_price ?? prod.price) || 0;
                      const reseller = Number(prod.reseller_price) || 0;
                      const profit = prod.profit_amount !== undefined ? Number(prod.profit_amount) : (selling - reseller);
                      const profitPct = prod.profit_percentage !== undefined ? Number(prod.profit_percentage) : (reseller > 0 ? ((profit / reseller) * 100) : 0);
                      const isInactive = prod.status === 'INACTIVE';
                      const isSelected = selectedProductIds.has(prod.id);

                      return (
                        <div 
                          key={prod.id} 
                          className={`bg-white rounded-2xl border transition p-3.5 space-y-3 ${
                            isSelected 
                              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20' 
                              : isInactive 
                                ? 'opacity-70 bg-slate-50/70 border-slate-200 border-dashed' 
                                : 'border-slate-200/90 hover:border-slate-300'
                          }`}
                        >
                          {/* Header: Select Checkbox, Number Badge, Status & Stock */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {canManageProducts && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleSelectProduct(prod.id)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                                  title={isSelected ? "Batal pilih" : "Pilih produk ini"}
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                                  ) : (
                                    <Square className="w-5 h-5 text-slate-300" />
                                  )}
                                </button>
                              )}
                              <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
                                #{rowNumber}
                              </span>
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border" style={{
                                backgroundColor: isInactive ? '#fff1f2' : '#ecfdf5',
                                borderColor: isInactive ? '#fecdd3' : '#a7f3d0',
                                color: isInactive ? '#be123c' : '#047857'
                              }}>
                                <span className={`w-2 h-2 rounded-full ${isInactive ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                <span>{isInactive ? 'Non-Aktif' : 'Aktif'}</span>
                              </div>
                            </div>

                            <div>
                              {!isBranchStaff ? (
                                <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                                  Stok: {prod.currentStock || 0} Pcs
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-50 text-sky-800 border border-sky-200">
                                  ⭐ Tersedia
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Product Identity: Photo + Name + Brand + SKU */}
                          <div className="flex items-start gap-3">
                            {prod.imageUrl ? (
                              <img 
                                src={prod.imageUrl} 
                                alt={prod.name} 
                                className="w-13 h-13 rounded-xl object-cover border border-slate-200 shadow-2xs flex-shrink-0 bg-slate-50 mt-0.5" 
                              />
                            ) : (
                              <div className="w-13 h-13 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400 mt-0.5">
                                <ImageIcon className="w-5 h-5 opacity-40" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-slate-900 text-sm leading-snug break-words">
                                  {prod.name}
                                </h4>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap">
                                  {prod.brand || 'NDK Exhaust'}
                                </span>
                              </div>
                              
                              <div className="text-xs text-slate-500 font-mono font-bold mt-1">
                                SKU: <span className="text-slate-800">{prod.sku || prod.code}</span>
                              </div>

                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="font-semibold text-slate-700">{prod.category_name || 'Exhaust'}</span>
                                {prod.material_finish && (
                                  <>
                                    <span>•</span>
                                    <span className="text-sky-700 font-medium">{prod.material_finish}</span>
                                  </>
                                )}
                                {prod.spec_sound && (
                                  <>
                                    <span>•</span>
                                    <span className="text-amber-700 font-medium">{prod.spec_sound}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Engine & Compatibility Box */}
                          <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                                {prod.engine_type || prod.machineCategory || 'Universal'}
                              </span>
                              {prod.spec_resonator === false && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                                  Non-Resonator
                                </span>
                              )}
                              <span className="text-slate-700 font-medium text-[11px] break-words">
                                {prod.car_variant || 'Semua varian'}
                              </span>
                            </div>
                          </div>

                          {/* Financial & Price Grid */}
                          <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Harga Jual</span>
                              <span className="text-sm font-black text-slate-900">
                                Rp {selling.toLocaleString('id-ID')}
                              </span>
                            </div>

                            {!isBranchStaff && (
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Harga Reseller</span>
                                <span className="text-xs font-semibold text-slate-600">
                                  {reseller > 0 ? `Rp ${reseller.toLocaleString('id-ID')}` : '-'}
                                </span>
                              </div>
                            )}

                            {!isBranchStaff && reseller > 0 && (
                              <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Margin Profit</span>
                                <div className="text-right">
                                  <span className="font-bold text-emerald-600 text-xs">
                                    +Rp {profit.toLocaleString('id-ID')}
                                  </span>
                                  <span className="ml-1 text-[10px] font-extrabold text-emerald-800">
                                    ({Math.round(profitPct * 10) / 10}%)
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Quick Actions Bar */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-1">
                              {canManageProducts && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(prod)}
                                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-2xs active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                              )}

                              {isBranchStaff && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRequestModal(null, prod)}
                                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>+ Daftarkan</span>
                                </button>
                              )}

                              <button
                                onClick={() => onShowBarcode(prod)}
                                className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                                title="Cetak Smart QR Code"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>

                              {canManageProducts && (
                                <>
                                  <button
                                    onClick={() => handleOpenStockAdjustModal(prod, 'MASTER')}
                                    className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition cursor-pointer border border-emerald-200"
                                    title="Opname Stok Cepat"
                                  >
                                    <Sliders className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleProductStatus(prod)}
                                    className={`p-2 rounded-xl transition cursor-pointer border ${
                                      isInactive 
                                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' 
                                        : 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                                    }`}
                                    title={isInactive ? 'Aktifkan Produk' : 'Non-aktifkan Produk'}
                                  >
                                    {isInactive ? <Check className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmProduct(prod)}
                                    className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition cursor-pointer border border-rose-200"
                                    title="Hapus Produk Master"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* DESKTOP TABLE VIEW (Screens >= md) */}
                  <div className="hidden md:block overflow-x-auto" style={{ transform: 'rotateX(180deg)' }}>
                    <table className="w-full text-left text-sm border-collapse" style={{ transform: 'rotateX(180deg)' }}>
                      <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
                        <tr>
                          {canManageProducts && (
                            <th className="px-3 py-3.5 text-center w-10 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={handleSelectAllOnPage}
                                className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer flex items-center justify-center mx-auto"
                                title={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProductIds.has(p.id)) ? "Lepas pilihan halaman ini" : "Pilih semua di halaman ini"}
                              >
                                {paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProductIds.has(p.id)) ? (
                                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                                ) : paginatedProducts.some(p => selectedProductIds.has(p.id)) ? (
                                  <MinusSquare className="w-4 h-4 text-indigo-600" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                                )}
                              </button>
                            </th>
                          )}
                          <th className="px-3.5 py-3.5 text-center font-bold text-slate-500 text-xs w-12 whitespace-nowrap">No.</th>
                          <th className="px-5 py-3.5 min-w-[220px]">Produk & Komponen</th>
                          <th className="px-4 py-3.5 min-w-[170px]">Tipe Mesin & Kompatibilitas</th>
                          <th className="px-4 py-3.5 whitespace-nowrap min-w-[130px]">SKU Master</th>
                          {!isBranchStaff && (
                            <th className="px-4 py-3.5 text-right whitespace-nowrap min-w-[110px]">Harga Reseller</th>
                          )}
                          <th className="px-4 py-3.5 text-right whitespace-nowrap min-w-[110px]">Harga Jual</th>
                          {!isBranchStaff && (
                            <th className="px-4 py-3.5 text-right whitespace-nowrap min-w-[110px]">Margin Profit</th>
                          )}
                          {!isBranchStaff ? (
                            <th className="px-4 py-3.5 text-center whitespace-nowrap min-w-[105px]">Stok Pusat</th>
                          ) : (
                            <th className="px-4 py-3.5 text-center whitespace-nowrap min-w-[105px]">Katalog Pusat</th>
                          )}
                          <th className="px-3 py-3.5 text-center whitespace-nowrap min-w-[65px]">Status</th>
                          <th className="px-5 py-3.5 text-right whitespace-nowrap min-w-[220px]">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedProducts.map((prod, idx) => {
                          const rowNumber = (safeCatalogPage - 1) * (catalogPageSize === 0 ? 0 : catalogPageSize) + idx + 1;
                          const selling = Number(prod.selling_price ?? prod.price) || 0;
                          const reseller = Number(prod.reseller_price) || 0;
                          const profit = prod.profit_amount !== undefined ? Number(prod.profit_amount) : (selling - reseller);
                          const profitPct = prod.profit_percentage !== undefined ? Number(prod.profit_percentage) : (reseller > 0 ? ((profit / reseller) * 100) : 0);
                          const isSelected = selectedProductIds.has(prod.id);

                          return (
                            <tr key={prod.id} className={`transition ${
                              isSelected 
                                ? 'bg-indigo-50/40 hover:bg-indigo-50/60' 
                                : prod.status === 'INACTIVE' 
                                  ? 'bg-slate-50/60 opacity-60 hover:bg-slate-100/70' 
                                  : 'hover:bg-slate-50/70'
                            }`}>
                              {/* Selection Checkbox */}
                              {canManageProducts && (
                                <td className="px-3 py-3.5 text-center whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSelectProduct(prod.id)}
                                    className="p-1 transition cursor-pointer flex items-center justify-center mx-auto"
                                    title={isSelected ? "Batal pilih" : "Pilih produk ini"}
                                  >
                                    {isSelected ? (
                                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                                    ) : (
                                      <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                                    )}
                                  </button>
                                </td>
                              )}

                              {/* Continuous Row Number Column */}
                              <td className="px-3.5 py-3.5 text-center font-bold text-slate-400 text-xs whitespace-nowrap">
                                {rowNumber}
                              </td>

                              <td className="px-5 py-3.5 font-medium text-slate-900 min-w-[240px]">
                                <div className="flex items-start gap-3">
                                  {/* Clean Image Thumbnail / Placeholder */}
                                  {prod.imageUrl ? (
                                    <img 
                                      src={prod.imageUrl} 
                                      alt={prod.name} 
                                      className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-2xs flex-shrink-0 bg-slate-50 mt-0.5" 
                                    />
                                  ) : (
                                    <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center flex-shrink-0 text-slate-400 mt-0.5" title="Belum ada foto">
                                      <ImageIcon className="w-5 h-5 opacity-40" />
                                    </div>
                                  )}

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                                      <span className="font-bold text-slate-900 leading-snug">
                                        {prod.name}
                                      </span>
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap flex-shrink-0">
                                        {prod.brand || 'NDK Exhaust'}
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                                      <span className="font-semibold text-slate-600 whitespace-nowrap">{prod.category_name || 'Exhaust'}</span>
                                      {prod.material_finish && (
                                        <>
                                          <span>•</span>
                                          <span className="text-sky-700 font-medium whitespace-nowrap">{prod.material_finish}</span>
                                        </>
                                      )}
                                      {prod.spec_sound && (
                                        <>
                                          <span>•</span>
                                          <span className="text-amber-700 font-medium whitespace-nowrap">{prod.spec_sound}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-3.5 text-xs text-slate-600 min-w-[170px]">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200/80 whitespace-nowrap flex-shrink-0">
                                    {prod.engine_type || prod.machineCategory || 'Universal'}
                                  </span>
                                  {prod.spec_resonator === false && (
                                   <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap flex-shrink-0">
                                      Non-Resonator
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-medium mt-1 leading-snug break-words" title={prod.car_variant}>
                                  {prod.car_variant || '-'}
                                </div>
                              </td>

                              <td className="px-4 py-3.5 text-xs font-mono font-bold text-slate-700 whitespace-nowrap">
                                {prod.sku || prod.code}
                              </td>

                              {!isBranchStaff && (
                                <td className="px-4 py-3.5 text-right font-medium text-slate-600 text-xs whitespace-nowrap">
                                  {reseller > 0 ? `Rp ${reseller.toLocaleString('id-ID')}` : '-'}
                                </td>
                              )}

                              <td className="px-4 py-3.5 text-right font-extrabold text-slate-900 text-xs whitespace-nowrap">
                                Rp {selling.toLocaleString('id-ID')}
                              </td>

                              {!isBranchStaff && (
                                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                  {reseller > 0 ? (
                                    <div>
                                      <div className="font-bold text-emerald-600 text-xs whitespace-nowrap">
                                        +Rp {profit.toLocaleString('id-ID')}
                                      </div>
                                      <div className="text-[10px] font-bold text-emerald-800 whitespace-nowrap">
                                        {Math.round(profitPct * 10) / 10}%
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-xs">-</span>
                                  )}
                                </td>
                              )}

                              {!isBranchStaff ? (
                                <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 whitespace-nowrap">
                                    {prod.currentStock || 0} Pcs
                                  </span>
                                </td>
                              ) : (
                                <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs whitespace-nowrap">
                                    ⭐ Tersedia
                                  </span>
                                </td>
                              )}

                              {/* Minimalist Green / Red Dot Indicator for Status */}
                              <td className="px-3 py-3.5 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center" title={prod.status === 'INACTIVE' ? 'Status: Non-Aktif' : 'Status: Aktif'}>
                                  <span className={`w-3 h-3 rounded-full shadow-2xs inline-block transition-transform duration-200 ${
                                    prod.status === 'INACTIVE'
                                      ? 'bg-rose-500 ring-4 ring-rose-100'
                                      : 'bg-emerald-500 ring-4 ring-emerald-100'
                                  }`} />
                                </div>
                              </td>

                              <td className="px-5 py-3.5 text-right whitespace-nowrap min-w-[230px]">
                                <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                                  
                                  {/* PROMINENT EDIT & FOTO BUTTON FOR ADMIN */}
                                  {canManageProducts && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditModal(prod)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
                                      title="Ubah Data Produk & Upload Foto"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span>Edit</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => onShowBarcode(prod)}
                                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                    title="Cetak Smart QR Code"
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
                                        onClick={() => handleOpenStockAdjustModal(prod, 'MASTER')}
                                        className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                        title="Koreksi Stok Cepat (Opname)"
                                      >
                                        <Sliders className="w-4 h-4" />
                                      </button>
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
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Pagination Controls for Master Catalog */}
            <PaginationControl
              currentPage={safeCatalogPage}
              totalItems={filteredProducts.length}
              pageSize={catalogPageSize}
              onPageChange={setCatalogPage}
              onPageSizeChange={setCatalogPageSize}
              itemName="produk master"
            />
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
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                              <tr>
                                <th className="px-4 py-3 min-w-[180px]">Nama Produk Master</th>
                                <th className="px-3 py-3 whitespace-nowrap min-w-[110px]">Merk / Brand</th>
                                <th className="px-3 py-3 font-mono whitespace-nowrap min-w-[120px]">SKU</th>
                                <th className="px-3 py-3 text-center whitespace-nowrap min-w-[120px]">Kuantitas Fisik</th>
                                <th className="px-3 py-3 min-w-[150px]">Catatan Pengajuan</th>
                                <th className="px-4 py-3 text-right whitespace-nowrap min-w-[140px]">Aksi Satuan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {group.items.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                                  <td className="px-4 py-3 font-bold text-slate-900 min-w-[180px]">
                                    <span className="leading-snug">{item.productName}</span>
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap inline-block">
                                      {item.brand || 'Generic'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 font-mono text-slate-600 font-bold whitespace-nowrap">{item.sku}</td>
                                  <td className="px-3 py-3 text-center whitespace-nowrap">
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap inline-block">
                                      {item.stockQuantity} Pcs
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-slate-600 italic break-words min-w-[150px]">
                                    {item.notes || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRejectingTarget({ type: 'SINGLE', data: item });
                                          setRejectionReason('');
                                          setRejectionError('');
                                        }}
                                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                        title="Tolak produk ini saja"
                                      >
                                        <Ban className="w-3 h-3" />
                                        <span>Tolak</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setApprovingItem(item)}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer whitespace-nowrap"
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

          {/* Inventories Table & Mobile Cards */}
          <div className="space-y-3">
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
                <>
                  {/* Mobile Card Feed for Branch Inventories (Smartphone Friendly) */}
                  <div className="block md:hidden divide-y divide-slate-100 p-2.5 sm:p-3 space-y-3 bg-slate-50/50">
                    {paginatedMyBranchInventories.map((inv, idx) => {
                      const rowNumber = (safeRecapPage - 1) * (recapPageSize === 0 ? 0 : recapPageSize) + idx + 1;
                      const isApproved = inv.status === 'APPROVED';
                      const isPending = inv.status === 'PENDING_APPROVAL';
                      const isRejected = inv.status === 'REJECTED';

                      return (
                        <div key={inv.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 space-y-3">
                          {/* Header */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
                                #{rowNumber}
                              </span>
                              {!isBranchStaff && inv.branchName && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                                  {inv.branchName}
                                </span>
                              )}
                            </div>

                            <div>
                              {isApproved && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-3 h-3" />
                                  ✓ Aktif
                                </span>
                              )}
                              {isPending && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                  <Clock className="w-3 h-3" />
                                  Menunggu
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <Ban className="w-3 h-3" />
                                  Ditolak
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Product Info */}
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm leading-snug break-words">{inv.productName}</h4>
                            <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-700">SKU: {inv.sku}</span>
                              <span>•</span>
                              <span className="text-indigo-600 font-semibold">{inv.brand}</span>
                            </div>
                          </div>

                          {/* Price & Stock Grid */}
                          <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stok Fisik</span>
                              <span className={`text-sm font-extrabold ${isApproved ? 'text-emerald-700' : 'text-slate-600'}`}>
                                {inv.stockQuantity} Pcs
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Harga Jual</span>
                              <span className="text-sm font-black text-slate-900">
                                Rp {(Number(inv.price) || 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>

                          {/* Action footer */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                            {isApproved && (
                              <button
                                onClick={() => handleOpenStockAdjustModal(inv, 'BRANCH')}
                                className="px-3 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs"
                                title="Edit / Opname Stok Cabang Direct"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>Edit Stok</span>
                              </button>
                            )}
                            {!isBranchStaff && isPending && (
                              <button
                                onClick={() => handleApprove(inv.id)}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition cursor-pointer shadow-2xs"
                              >
                                Setujui
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table View (Screens >= md) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
                        <tr>
                          <th className="px-3.5 py-3.5 text-center font-bold text-slate-500 text-xs w-12 whitespace-nowrap">No.</th>
                          <th className="px-5 py-3.5 min-w-[200px]">Produk & Merk</th>
                          {!isBranchStaff && <th className="px-4 py-3.5 whitespace-nowrap min-w-[140px]">Lokasi Cabang</th>}
                          <th className="px-4 py-3.5 text-center whitespace-nowrap min-w-[130px]">Stok Fisik di Cabang</th>
                          <th className="px-4 py-3.5 text-right whitespace-nowrap min-w-[110px]">Harga Jual</th>
                          <th className="px-4 py-3.5 text-center whitespace-nowrap min-w-[150px]">Status Verifikasi Pusat</th>
                          <th className="px-5 py-3.5 text-right whitespace-nowrap min-w-[130px]">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedMyBranchInventories.map((inv, idx) => {
                          const rowNumber = (safeRecapPage - 1) * (recapPageSize === 0 ? 0 : recapPageSize) + idx + 1;
                          const isApproved = inv.status === 'APPROVED';
                          const isPending = inv.status === 'PENDING_APPROVAL';
                          const isRejected = inv.status === 'REJECTED';

                          return (
                            <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                              <td className="px-3.5 py-3.5 text-center font-bold text-slate-400 text-xs whitespace-nowrap">
                                {rowNumber}
                              </td>

                              <td className="px-5 py-3.5 font-medium text-slate-900 min-w-[200px]">
                                <div className="font-bold text-slate-900 leading-snug">{inv.productName}</div>
                                <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className="whitespace-nowrap font-bold text-slate-600">SKU: {inv.sku}</span>
                                  <span>•</span>
                                  <span className="text-indigo-600 font-semibold whitespace-nowrap">{inv.brand}</span>
                                </div>
                              </td>

                              {!isBranchStaff && (
                                <td className="px-4 py-3.5 text-xs text-slate-700 font-semibold whitespace-nowrap">
                                  {inv.branchName}
                                </td>
                              )}

                              <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                                  isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {inv.stockQuantity} Pcs
                                </span>
                              </td>

                              <td className="px-4 py-3.5 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                                Rp {(Number(inv.price) || 0).toLocaleString('id-ID')}
                              </td>

                              <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                {isApproved && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                    <Check className="w-3.5 h-3.5" />
                                    ✓ Terverifikasi & Aktif
                                  </span>
                                )}
                                {isPending && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse whitespace-nowrap">
                                    <Clock className="w-3.5 h-3.5" />
                                    ⏳ Menunggu Verifikasi Pusat
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap" title={inv.rejectionReason || 'Ditolak'}>
                                    <Ban className="w-3.5 h-3.5" />
                                    ⚠️ Ditolak Pusat
                                  </span>
                                )}
                              </td>

                              <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                                  {isApproved && (
                                    <button
                                      onClick={() => handleOpenStockAdjustModal(inv, 'BRANCH')}
                                      className="px-2.5 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs whitespace-nowrap"
                                      title="Edit / Opname Stok Cabang Direct"
                                    >
                                      <Sliders className="w-3.5 h-3.5" />
                                      <span>Edit Stok</span>
                                    </button>
                                  )}
                                  {!isBranchStaff && isPending && (
                                    <button
                                      onClick={() => handleApprove(inv.id)}
                                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition cursor-pointer whitespace-nowrap shadow-2xs"
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
                </>
              )}
            </div>

            {/* Pagination Controls for Branch Inventories */}
            <PaginationControl
              currentPage={safeRecapPage}
              totalItems={myBranchInventories.length}
              pageSize={recapPageSize}
              onPageChange={setRecapPage}
              onPageSizeChange={setRecapPageSize}
              itemName="inventaris cabang"
            />
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
                          className={`p-3 flex items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer transition ${
                            isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-500' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                                <span className="font-bold text-slate-800 text-xs leading-snug">{prod.name}</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap flex-shrink-0">
                                  {prod.brand || 'Generic'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1 flex-wrap">
                                <span className="whitespace-nowrap font-semibold text-slate-600">SKU: {prod.sku}</span>
                                <span>•</span>
                                <span className="whitespace-nowrap text-slate-700 font-bold">Rp {(Number(prod.price) || 0).toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-700 whitespace-nowrap flex-shrink-0">
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
      {/* MODAL 2: MASTER PRODUCT ADD / EDIT (AUTOMOTIVE EXHAUST SCHEMA)            */}
      {/* ========================================================================= */}
      {canManageProducts && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150 my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {editingProduct ? 'Ubah Master Produk Exhaust' : 'Tambah Master Produk Exhaust Baru'}
                  </h3>
                  <p className="text-xs text-slate-300">Formulir spesifikasi knalpot otomotif & harga bertingkat.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body (Scrollable) */}
            <form onSubmit={handlePreSubmitMasterProduct} className="p-6 space-y-4 text-sm overflow-y-auto flex-1">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Row 1: SKU & Auto SKU Generator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Kode / SKU Produk *
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateFormSKU}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
                      title="Buat kode unik otomatis berdasarkan tipe mesin & kategori"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-Gen SKU</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: WZ-2KD-DP-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Komponen / Produk *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Downpipe Stainless Steel"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Tipe Mesin & Kategori Komponen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tipe Mesin Kendaraan *
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={formData.engine_type}
                      onChange={(e) => setFormData({ ...formData, engine_type: e.target.value, machineCategory: e.target.value })}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {DEFAULT_ENGINE_TYPES.map(eName => (
                        <option key={eName} value={eName}>{eName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kategori Komponen *
                  </label>
                  <select
                    value={formData.category_name}
                    onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {DEFAULT_EXHAUST_CATEGORIES.map(cName => (
                      <option key={cName} value={cName}>{cName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Varian Mobil & Merk */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kompatibilitas / Varian Mobil
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Innova 2.5 / Fortuner 2.5 / Hilux"
                    value={formData.car_variant}
                    onChange={(e) => setFormData({ ...formData, car_variant: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Merk / Brand *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNewBrand(!isCreatingNewBrand);
                        setNewBrandInput('');
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      {isCreatingNewBrand ? '← Pilih dari Daftar' : '+ Merk Baru'}
                    </button>
                  </div>

                  {isCreatingNewBrand ? (
                    <input
                      type="text"
                      required
                      placeholder="Ketik merk baru..."
                      value={newBrandInput}
                      onChange={(e) => setNewBrandInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-indigo-50 border border-indigo-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-indigo-950"
                    />
                  ) : (
                    <select
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {allBrandNames.map(bName => (
                        <option key={bName} value={bName}>{bName}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Row 4: Karakter Suara, Resonator, Finishing Tip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Karakter Suara
                  </label>
                  <select
                    value={formData.spec_sound}
                    onChange={(e) => setFormData({ ...formData, spec_sound: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Street (Bass)">Street (Bass)</option>
                    <option value="Drag (Kering)">Drag (Kering)</option>
                    <option value="Silent">Silent / Senyap</option>
                    <option value="Standar">Standar Pabrik</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Opsi Resonator
                  </label>
                  <select
                    value={formData.spec_resonator ? 'WITH_RESONATOR' : 'NON_RESONATOR'}
                    onChange={(e) => setFormData({ ...formData, spec_resonator: e.target.value === 'WITH_RESONATOR' })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="WITH_RESONATOR">Ada Resonator</option>
                    <option value="NON_RESONATOR">Non-Resonator (Plong)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Finishing Ujung (Tip)
                  </label>
                  <select
                    value={formData.material_finish}
                    onChange={(e) => setFormData({ ...formData, material_finish: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="SS Polos">SS Polos</option>
                    <option value="SS Burntip">SS Burntip (Blue)</option>
                    <option value="SS Look Titanium">SS Look Titanium</option>
                    <option value="Titanium Asli">Titanium Asli</option>
                    <option value="Carbon Tip">Carbon Tip</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Multi-Tier Pricing with Live Profit Calculator */}
              <div className="p-4 bg-gradient-to-r from-emerald-50/70 via-sky-50/50 to-indigo-50/50 border border-emerald-200/80 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                  <span>Struktur Harga Bertingkat & Live Margin</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Harga Reseller / B2B (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.reseller_price}
                      onChange={(e) => {
                        const reseller = Number(e.target.value) || 0;
                        const selling = Number(formData.selling_price) || 0;
                        const profit = selling - reseller;
                        const pct = reseller > 0 ? ((profit / reseller) * 100) : 0;
                        setFormData({
                          ...formData,
                          reseller_price: reseller,
                          profit_amount: profit,
                          profit_percentage: Math.round(pct * 100) / 100
                        });
                      }}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Harga Jual Retail (Rp) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="0"
                      value={formData.selling_price}
                      onChange={(e) => {
                        const selling = Number(e.target.value) || 0;
                        const reseller = Number(formData.reseller_price) || 0;
                        const profit = selling - reseller;
                        const pct = reseller > 0 ? ((profit / reseller) * 100) : 0;
                        setFormData({
                          ...formData,
                          selling_price: selling,
                          price: selling,
                          profit_amount: profit,
                          profit_percentage: Math.round(pct * 100) / 100
                        });
                      }}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Live Profit Display Badge */}
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-200 flex flex-col justify-center text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Laba / Margin</span>
                    <div className="font-black text-emerald-600 text-sm mt-0.5">
                      +Rp {((Number(formData.selling_price) || 0) - (Number(formData.reseller_price) || 0)).toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] font-extrabold text-emerald-800">
                      {Number(formData.reseller_price) > 0 
                        ? `${Math.round(((((Number(formData.selling_price) || 0) - (Number(formData.reseller_price) || 0)) / Number(formData.reseller_price)) * 100) * 10) / 10}% Margin` 
                        : '0% Margin'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 6: Stok Fisik, Min Stock Threshold, Satuan, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
                    Stok Fisik Pusat (Pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3.5 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-sm font-extrabold text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Batas Minimum Alert
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status Produk
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="ACTIVE">🟢 Aktif</option>
                    <option value="INACTIVE">🔴 Non-Aktif (Soft Delete)</option>
                  </select>
                </div>
              </div>

              {/* Row 7: Foto Produk untuk E-Katalog Publik */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span>Foto Produk (Tampil di E-Katalog Publik)</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPhotoInputType('FILE')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        photoInputType === 'FILE'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoInputType('URL')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        photoInputType === 'URL'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Link URL
                    </button>
                  </div>
                </div>

                {formData.imageUrl ? (
                  <div className="flex items-center gap-3.5 p-3 bg-white border border-indigo-200 rounded-xl shadow-2xs">
                    <img 
                      src={formData.imageUrl} 
                      alt="Pratinjau Foto Produk" 
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs flex-shrink-0 bg-slate-50"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">Foto Produk Terpasang</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          ✓ Siap Tampil
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">Foto akan otomatis muncul di E-Katalog Publik.</p>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: '' })}
                        className="mt-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Foto</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {photoInputType === 'FILE' ? (
                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white rounded-xl cursor-pointer transition group">
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          onChange={handlePhotoUploadChange}
                          disabled={isCompressingPhoto}
                          className="hidden"
                        />
                        {isCompressingPhoto ? (
                          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold py-1">
                            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <span>Mengompresi & Memproses Gambar...</span>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition shadow-2xs mb-1.5">
                              <Camera className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition">
                              Klik untuk Pilih Foto Knalpot dari Galeri / Kamera
                            </span>
                            <span className="text-[11px] text-slate-400 mt-0.5">
                              Format: JPG, PNG, WebP (Otomatis dikompresi agar ringan)
                            </span>
                          </>
                        )}
                      </label>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Link2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="url"
                            placeholder="https://example.com/foto-knalpot.jpg"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Row 8: Catatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan / Keterangan Tambahan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bahan Stainless 304 tebal 1.5mm, PNP tanpa potong pipa"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Row 9: Deskripsi Lengkap */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Deskripsi Lengkap Produk
                </label>
                <textarea
                  rows={4}
                  placeholder="Masukkan deskripsi panjang, fitur utama, dan manfaat produk di sini..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Master Produk</span>
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

      {/* DELETE CONFIRM SINGLE MASTER PRODUCT MODAL */}
      {deleteConfirmProduct && (
        <ConfirmationModal
          isOpen={Boolean(deleteConfirmProduct)}
          onClose={() => setDeleteConfirmProduct(null)}
          onConfirm={handleExecuteSingleDelete}
          title="Konfirmasi Hapus Master Produk"
          subtitle="Tindakan ini akan menghapus master produk dari katalog database."
          type="DANGER"
          confirmText="Ya, Hapus Master Produk"
          cancelText="Batal"
          isLoading={isExecutingDelete}
          summaryItems={[
            { label: "Nama Produk", value: deleteConfirmProduct.name, highlight: true },
            { label: "SKU Produk", value: deleteConfirmProduct.sku || deleteConfirmProduct.code },
            { label: "Merk / Brand", value: deleteConfirmProduct.brand || 'NDK Exhaust' },
            { label: "Stok Fisik Pusat", value: `${deleteConfirmProduct.currentStock || 0} Pcs`, color: 'text-rose-600 font-bold' }
          ]}
          warningNote="PENTING: Menghapus master produk bersifat permanen dan dapat mempengaruhi riwayat referensi cabang."
        />
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {isBulkDeleteModalOpen && (
        <ConfirmationModal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          onConfirm={handleExecuteBulkDelete}
          title={`Hapus ${selectedProductIds.size} Master Produk Terpilih?`}
          subtitle="Tindakan ini akan menghapus produk-produk yang dipilih sekaligus dari database katalog."
          type="DANGER"
          confirmText={`Ya, Hapus Semua (${selectedProductIds.size} Produk)`}
          cancelText="Batal"
          isLoading={isExecutingDelete}
          maxWidth="max-w-xl"
          summaryItems={[
            { label: "Total Produk Terpilih", value: `${selectedProductIds.size} Produk`, highlight: true, color: 'text-rose-600 font-extrabold text-sm' },
            { label: "Total Stok Terdampak", value: `${products.filter(p => selectedProductIds.has(p.id)).reduce((acc, p) => acc + (Number(p.currentStock) || 0), 0)} Pcs`, color: 'text-slate-800 font-bold' }
          ]}
          itemsList={products.filter(p => selectedProductIds.has(p.id)).map(item => ({
            name: item.name,
            sku: item.sku || item.code,
            brand: item.brand || 'NDK Exhaust',
            qty: item.currentStock || 0,
            unit: 'Pcs',
            note: item.engine_type || item.machineCategory || 'Universal'
          }))}
          itemsTitle="Daftar Produk yang Akan Dihapus:"
          warningNote="PERINGATAN KRITIS: Tindakan hapus massal tidak dapat dibatalkan. Pastikan seluruh produk yang dipilih sudah benar."
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

      {/* SPREADSHEET IMPORT MODAL */}
      <SpreadsheetImportModal
        isOpen={isImportSpreadsheetOpen}
        onClose={() => setIsImportSpreadsheetOpen(false)}
        existingProducts={products}
        onSuccess={() => {
          // Success handled in modal & realtime stream
        }}
      />

    </div>
  );
}



