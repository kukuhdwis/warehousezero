import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Package, 
  Boxes, 
  TrendingUp, 
  AlertTriangle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search, 
  Download, 
  Warehouse, 
  User, 
  Phone, 
  MapPin, 
  ChevronRight,
  ChevronLeft,
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Eye, 
  ArrowLeft, 
  Filter, 
  Layers, 
  Inbox, 
  Check, 
  Ban, 
  X, 
  Info, 
  Trash2,
  Calendar,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Coins,
  Receipt,
  Folder,
  FolderOpen,
  LayoutGrid,
  List,
  Send,
  Sparkles,
  CheckCircle,
  Sliders,
  CheckSquare,
  Square,
  MinusSquare,
  Plus,
  Edit3,
  QrCode,
  Tag,
  Settings2,
  Trash,
  AlertCircle,
  Trophy,
  Flame,
  Award
} from 'lucide-react';
import { exportToCSV, purgeTransactions } from '../services/dataService';
import { matchesSearch } from '../utils/searchUtils';
import ConfirmationModal from './ConfirmationModal';
import TransactionDetailModal from './TransactionDetailModal';

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

// Helper to get Year-Month key (e.g. '2026-09') from a date/timestamp
export const getTxMonthKey = (ts) => {
  if (!ts) return '';
  try {
    let d;
    if (ts.toDate) d = ts.toDate();
    else if (ts.seconds) d = new Date(ts.seconds * 1000);
    else d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  } catch (e) {
    return '';
  }
};

// Current Month key (e.g. '2026-09')
export const getCurrentMonthKey = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Format Month key to Indonesian readable label (e.g. '2026-09' -> 'September 2026')
export const formatMonthLabel = (monthKey) => {
  if (!monthKey || monthKey === 'ALL') return 'Semua Periode';
  const parts = monthKey.split('-');
  if (parts.length !== 2) return monthKey;
  const [year, month] = parts;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

// Helper to check if a transaction belongs to a selected month key
export const isTxInSelectedMonth = (tx, monthKey) => {
  if (!monthKey || monthKey === 'ALL') return true;
  const txMonth = getTxMonthKey(tx.createdAt || tx.timestamp || tx.date);
  if (!txMonth) return true;
  return txMonth === monthKey;
};

// Helper to calculate profit for an individual item
export const calculateItemProfit = (item, products = [], branchInventories = []) => {
  if (!item) return { sellingPrice: 0, costPrice: 0, qty: 1, itemProfit: 0 };
  const qty = Number(item.qty || item.quantity || 1);
  const sellingPrice = Number(item.price ?? item.selling_price ?? item.sellingPrice ?? 0);
  
  const catalogItem = (products || []).find(p => 
    (item.productId && (p.id === item.productId || p.productId === item.productId)) ||
    (item.sku && p.sku === item.sku) ||
    (item.productName && p.name && p.name.trim().toLowerCase() === item.productName.trim().toLowerCase())
  ) || (branchInventories || []).find(bi => 
    (item.productId && (bi.productId === item.productId || bi.id === item.productId)) ||
    (item.sku && bi.sku === item.sku) ||
    (item.productName && bi.productName && bi.productName.trim().toLowerCase() === item.productName.trim().toLowerCase())
  );
  
  const catalogCost = Number(catalogItem?.reseller_price ?? catalogItem?.resellerPrice ?? catalogItem?.cost_price ?? catalogItem?.costPrice ?? 0);
  const itemCost = Number(item.costPrice ?? item.cost_price ?? item.reseller_price ?? item.resellerPrice ?? 0);
  
  let costPrice = 0;
  if (catalogCost > 0) {
    costPrice = catalogCost;
  } else if (itemCost > 0 && itemCost !== sellingPrice) {
    costPrice = itemCost;
  } else if (catalogItem && Number(catalogItem.profit_amount) > 0 && sellingPrice > 0) {
    costPrice = Math.max(0, sellingPrice - Number(catalogItem.profit_amount));
  } else if (itemCost > 0) {
    costPrice = itemCost;
  }
  
  const itemProfit = (sellingPrice - costPrice) * qty;
  return { sellingPrice, costPrice, qty, itemProfit };
};

// Helper to calculate profit for a whole transaction
export const calculateTxProfit = (tx, products = [], branchInventories = []) => {
  if (!tx || tx.type !== 'OUT') return { txProfit: 0, profitItems: [] };
  
  // BUNDLING TRANSACTION: represent bundles as unified packages with aggregated component costs
  if (tx.isBundling || tx.transactionType === 'CUSTOM_BUNDLING') {
    if (tx.bundles && Array.isArray(tx.bundles) && tx.bundles.length > 0) {
      let txProfit = 0;
      const profitItems = tx.bundles.map(b => {
        const bQty = Number(b.qty || 1);
        const bUnitPrice = Number(b.unitPrice || b.price || (b.subtotal ? b.subtotal / bQty : 0));
        
        let singleBundleModal = 0;
        if (b.items && Array.isArray(b.items)) {
          singleBundleModal = b.items.reduce((sum, comp) => {
            const compCalc = calculateItemProfit(comp, products, branchInventories);
            return sum + (compCalc.costPrice * (Number(comp.qty) || 1));
          }, 0);
        }
        
        const totalBundleOmset = bUnitPrice * bQty;
        const totalBundleModal = singleBundleModal * bQty;
        const bProfit = totalBundleOmset - totalBundleModal;
        txProfit += bProfit;

        return {
          sku: b.sku || b.code || 'PAKET-BUNDLE',
          productName: b.productName || `[BUNDLING] ${b.name || 'Paket Bundling'}`,
          qty: bQty,
          unit: b.unit || 'Paket',
          price: bUnitPrice,
          costPrice: singleBundleModal,
          itemProfit: bProfit,
          notes: b.items ? b.items.map(c => `${(Number(c.qty) || 1) * bQty}x ${c.productName}`).join(', ') : ''
        };
      });
      return { txProfit, profitItems };
    } else {
      // Single bundle fallback with components in tx.bundleItems or tx.items
      const bQty = Number(tx.bundleQty || tx.qty || 1);
      const totalOmset = tx.totalPrice ? Number(tx.totalPrice) : (Number(tx.price || 0) * bQty);
      const bUnitPrice = totalOmset / bQty;

      const compItems = tx.bundleItems || tx.items || [];
      let totalCompModal = 0;
      if (Array.isArray(compItems) && compItems.length > 0) {
        totalCompModal = compItems.reduce((sum, comp) => {
          const compCalc = calculateItemProfit(comp, products, branchInventories);
          return sum + (compCalc.costPrice * (Number(comp.qty) || 1));
        }, 0);
      }
      const singleBundleModal = totalCompModal / bQty;
      const txProfit = totalOmset - totalCompModal;

      const profitItems = [{
        sku: tx.sku || 'PAKET-BUNDLE',
        productName: tx.productName || '[BUNDLING] Paket Bundling',
        qty: bQty,
        unit: 'Paket',
        price: bUnitPrice,
        costPrice: singleBundleModal,
        itemProfit: txProfit,
        notes: compItems.map(c => `${c.qty}x ${c.productName}`).join(', ')
      }];
      return { txProfit, profitItems };
    }
  }

  if (tx.items && Array.isArray(tx.items) && tx.items.length > 0) {
    let txProfit = 0;
    const profitItems = tx.items.map(item => {
      const calc = calculateItemProfit(item, products, branchInventories);
      txProfit += calc.itemProfit;
      return {
        ...item,
        costPrice: calc.costPrice,
        sellingPrice: calc.sellingPrice,
        itemProfit: calc.itemProfit
      };
    });
    return { txProfit, profitItems };
  }
  
  const qty = Number(tx.qty || 1);
  const sellingPrice = Number(tx.price || (tx.totalPrice ? (tx.totalPrice / qty) : 0));
  
  const catalogItem = (products || []).find(p => 
    (tx.productId && (p.id === tx.productId || p.productId === tx.productId)) ||
    (tx.sku && p.sku === tx.sku) ||
    (tx.productName && p.name && p.name.trim().toLowerCase() === tx.productName.trim().toLowerCase())
  ) || (branchInventories || []).find(bi => 
    (tx.productId && (bi.productId === tx.productId || bi.id === tx.productId)) ||
    (tx.sku && bi.sku === tx.sku) ||
    (tx.productName && bi.productName && bi.productName.trim().toLowerCase() === tx.productName.trim().toLowerCase())
  );
  
  const catalogCost = Number(catalogItem?.reseller_price ?? catalogItem?.resellerPrice ?? catalogItem?.cost_price ?? catalogItem?.costPrice ?? 0);
  const txDirectCost = Number(tx.costPrice ?? tx.cost_price ?? tx.reseller_price ?? tx.resellerPrice ?? 0);
  
  let costPrice = 0;
  if (catalogCost > 0) {
    costPrice = catalogCost;
  } else if (txDirectCost > 0 && txDirectCost !== sellingPrice) {
    costPrice = txDirectCost;
  } else if (catalogItem && Number(catalogItem.profit_amount) > 0 && sellingPrice > 0) {
    costPrice = Math.max(0, sellingPrice - Number(catalogItem.profit_amount));
  } else if (txDirectCost > 0) {
    costPrice = txDirectCost;
  }
  
  const totalOmset = tx.totalPrice ? Number(tx.totalPrice) : (sellingPrice * qty);
  const totalModal = costPrice * qty;
  const txProfit = totalOmset - totalModal;
  
  const profitItems = [{
    sku: tx.sku || '-',
    productName: tx.productName || 'Barang',
    qty: qty,
    unit: tx.unit || 'Pcs',
    price: sellingPrice,
    costPrice: costPrice,
    itemProfit: txProfit
  }];
  
  return { txProfit, profitItems };
};

export default function BranchMonitoring({ 
  currentUser,
  branches = [], 
  products = [], 
  branchInventories = [], 
  transactions = [],
  users = [],
  brands = [],
  machineCategories = [],
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onDeleteProductsBatch,
  onUpdateBranchInventory,
  onRequestBranchInventory,
  onApproveBranchInventory,
  onRejectBranchInventory,
  onShowBarcode
}) {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isStaffPusat = currentUser?.role === 'STAFF_PUSAT' || currentUser?.role === 'PUSAT';
  const isBranchStaff = currentUser?.role === 'STAFF_BRANCH';
  const canManageProducts = isAdmin || isStaffPusat;

  // Find user's branch for branch staff
  const userBranch = React.useMemo(() => {
    if (!isBranchStaff) return null;
    return branches.find(b => 
      b.id === currentUser?.branchId || 
      (b.code && b.code === currentUser?.branchId) ||
      (b.name && currentUser?.branchName && b.name.trim().toLowerCase() === currentUser?.branchName.trim().toLowerCase())
    ) || {
      id: currentUser?.branchId || 'CABANG',
      name: currentUser?.branchName || 'Cabang',
      pic: currentUser?.name || 'Staff Cabang',
      status: 'ACTIVE'
    };
  }, [isBranchStaff, branches, currentUser]);

  // 'ALL' for overview grid, or specific branchId for dedicated warehouse view
  const [selectedBranchId, setSelectedBranchId] = useState(() => {
    if (isBranchStaff && userBranch) {
      return userBranch.id;
    }
    return 'ALL';
  });

  const [selectedStaffName, setSelectedStaffName] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonthKey());
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL'); // 'ALL' | 'LOW' | 'SAFE'
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [showProfitDetails, setShowProfitDetails] = useState(false);
  const [selectedDetailTx, setSelectedDetailTx] = useState(null);
  const [overviewViewMode, setOverviewViewMode] = useState('CARDS'); // 'CARDS' | 'TABLE'

  // Product Selection & Action States inside Branch View
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [adjustingStockItem, setAdjustingStockItem] = useState(null);
  const [adjustStockQty, setAdjustStockQty] = useState(0);
  const [adjustStockNotes, setAdjustStockNotes] = useState('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  const [editingProductItem, setEditingProductItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const [isAddBranchProductOpen, setIsAddBranchProductOpen] = useState(false);
  const [addBranchSelectedMasterIds, setAddBranchSelectedMasterIds] = useState(new Set());
  const [addBranchSearch, setAddBranchSearch] = useState('');
  const [addBranchBrandFilter, setAddBranchBrandFilter] = useState('ALL');
  const [addBranchQtyMap, setAddBranchQtyMap] = useState({});
  const [addBranchPriceMap, setAddBranchPriceMap] = useState({});
  const [isSubmittingAddBranch, setIsSubmittingAddBranch] = useState(false);

  const [isCreateMasterModalOpen, setIsCreateMasterModalOpen] = useState(false);
  const [newMasterFormData, setNewMasterFormData] = useState({
    name: '',
    sku: '',
    brand: 'NDK Exhaust',
    machineCategory: 'Universal',
    price: 0,
    costPrice: 0,
    currentStock: 0,
    minStock: 5,
    unit: 'Pcs',
    status: 'ACTIVE',
    notes: ''
  });

  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPurgeConfirmOpen, setIsPurgeConfirmOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  // Extract all distinct months present in transactions + current month
  const availableMonths = React.useMemo(() => {
    const monthSet = new Set();
    monthSet.add(getCurrentMonthKey());
    transactions.forEach(t => {
      const k = getTxMonthKey(t.createdAt || t.timestamp || t.date);
      if (k) monthSet.add(k);
    });
    return Array.from(monthSet).sort().reverse();
  }, [transactions]);

  // Selected Branch Object
  const selectedBranch = selectedBranchId === 'ALL'
    ? null
    : branches.find(b => b.id === selectedBranchId || b.code === selectedBranchId || (b.isPusat && selectedBranchId === 'GUDANG-PUSAT')) || {
        id: selectedBranchId,
        name: selectedBranchId === 'GUDANG-PUSAT' ? 'Gudang Utama Pusat' : 'Cabang Operasional',
        code: selectedBranchId === 'GUDANG-PUSAT' ? 'GUDANG-PUSAT' : selectedBranchId,
        pic: 'Staff Cabang',
        status: 'ACTIVE',
        isPusat: selectedBranchId === 'GUDANG-PUSAT'
      };

  const isPusatSelected = selectedBranch && (
    selectedBranch.isPusat === true || 
    selectedBranch.code === 'GUDANG-PUSAT' || 
    (selectedBranch.name || '').toLowerCase().includes('gudang utama pusat')
  );

  const getBranchStaff = (branch) => {
    if (!branch) return users;
    const isPusatBranch = branch.isPusat === true || branch.code === 'GUDANG-PUSAT' || (branch.name || '').toLowerCase().includes('gudang utama pusat');
    return users.filter(u => {
      if (isPusatBranch) {
        return (
          u.role === 'STAFF_PUSAT' || 
          u.role === 'PUSAT' || 
          u.branchId === branch.id || 
          u.branchId === 'branch-pusat-hq' || 
          (u.branchName || '').toLowerCase().includes('gudang utama pusat')
        );
      }
      return u.branchId === branch.id || u.branchName === branch.name;
    });
  };

  const branchStaffList = selectedBranch
    ? getBranchStaff(selectedBranch)
    : users;

  // Branch Inventories belonging to selected branch (or all)
  const branchInventoryItems = React.useMemo(() => {
    if (selectedBranchId === 'ALL') {
      return branchInventories;
    }
    if (isPusatSelected) {
      return products.map(p => ({
        id: p.id,
        productId: p.id,
        productName: p.name,
        name: p.name,
        sku: p.sku,
        brand: p.brand || 'Generic',
        category: p.category || 'General',
        machineCategory: p.machineCategory || p.kategoriMesin || p.engineType || 'Universal',
        stockQuantity: Number(p.currentStock) || Number(p.stock) || Number(p.quantity) || 0,
        minStock: Number(p.minStock) || 5,
        unit: p.unit || 'Pcs',
        price: Number(p.price || p.selling_price) || 0,
        costPrice: Number(p.cost_price || p.reseller_price) || 0,
        status: p.status || 'ACTIVE',
        branchId: selectedBranch?.id || 'GUDANG-PUSAT',
        branchName: selectedBranch?.name || 'Gudang Utama Pusat',
        isMasterProduct: true
      }));
    }

    const branchItems = branchInventories.filter(bi => {
      if (!bi) return false;
      if (bi.branchId === selectedBranchId) return true;
      if (selectedBranch) {
        if (bi.branchId === selectedBranch.id) return true;
        if (selectedBranch.code && bi.branchId === selectedBranch.code) return true;
        if (bi.branchName && selectedBranch.name && bi.branchName.trim().toLowerCase() === selectedBranch.name.trim().toLowerCase()) return true;
      }
      return false;
    });

    const deduplicatedMap = new Map();
    for (const item of branchItems) {
      const key = item.sku || item.productId || item.id;
      const matchingProd = products.find(p => p.id === item.productId || p.sku === item.sku);
      const enrichedItem = {
        ...item,
        machineCategory: item.machineCategory || item.kategoriMesin || matchingProd?.machineCategory || matchingProd?.kategoriMesin || matchingProd?.engineType || 'Universal',
        brand: item.brand || matchingProd?.brand || 'Generic',
        productName: item.productName || item.name || matchingProd?.name || 'Produk'
      };

      if (!deduplicatedMap.has(key)) {
        deduplicatedMap.set(key, enrichedItem);
      } else {
        const existing = deduplicatedMap.get(key);
        const existingDate = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
        const itemDate = new Date(item.updatedAt || item.createdAt || 0).getTime();
        if (itemDate >= existingDate) {
          deduplicatedMap.set(key, enrichedItem);
        }
      }
    }
    return Array.from(deduplicatedMap.values());
  }, [selectedBranchId, isPusatSelected, products, branchInventories, selectedBranch]);

  // Extract available brands for this branch
  const branchBrandNames = React.useMemo(() => {
    const bSet = new Set();
    branchInventoryItems.forEach(item => {
      if (item.brand) bSet.add(item.brand);
    });
    return Array.from(bSet).filter(Boolean);
  }, [branchInventoryItems]);

  // Filter items by search, brand & stock status
  const filteredInventories = React.useMemo(() => {
    return branchInventoryItems.filter(item => {
      const matchesSearchTerm = matchesSearch(searchTerm, item.productName, item.name, item.sku, item.brand, item.machineCategory);
      const matchesBrand = brandFilter === 'ALL' || item.brand === brandFilter;

      const isLow = (Number(item.stockQuantity) || 0) <= (Number(item.minStock) || 5);
      const matchesStock = 
        stockFilter === 'ALL' ||
        (stockFilter === 'LOW' && isLow) ||
        (stockFilter === 'SAFE' && !isLow);

      return matchesSearchTerm && matchesBrand && matchesStock;
    });
  }, [branchInventoryItems, searchTerm, brandFilter, stockFilter]);

  const branchTransactions = transactions.filter(t => {
    let matchesBranch = false;
    if (selectedBranchId === 'ALL') {
      matchesBranch = true;
    } else if (t.branchId === selectedBranchId) {
      matchesBranch = true;
    } else if (selectedBranch) {
      matchesBranch = 
        t.branchId === selectedBranch.id ||
        (selectedBranch.code && t.branchId === selectedBranch.code) ||
        (t.branchName && selectedBranch.name && t.branchName.trim().toLowerCase() === selectedBranch.name.trim().toLowerCase()) ||
        (t.targetBranchId && (t.targetBranchId === selectedBranch.id || t.targetBranchId === selectedBranch.code)) ||
        (t.user && branchStaffList.some(s => s.name?.toLowerCase() === t.user?.toLowerCase() || s.email?.toLowerCase() === t.user?.toLowerCase()));
    }
    const matchesStaff = selectedStaffName === 'ALL' || t.user === selectedStaffName;
    return matchesBranch && matchesStaff;
  });

  const branchMonthlyTransactions = React.useMemo(() => {
    return branchTransactions.filter(t => isTxInSelectedMonth(t, selectedMonth));
  }, [branchTransactions, selectedMonth]);

  const profitDetails = React.useMemo(() => {
    const targetTransactions = selectedBranch 
      ? branchMonthlyTransactions 
      : transactions.filter(t => isTxInSelectedMonth(t, selectedMonth));

    return targetTransactions
      .filter(tx => tx.type === 'OUT')
      .map(tx => {
        const { txProfit, profitItems } = calculateTxProfit(tx, products, branchInventories);
        return { ...tx, txProfit, profitItems };
      })
      .filter(tx => tx.profitItems && tx.profitItems.length > 0);
  }, [selectedBranch, branchMonthlyTransactions, transactions, selectedMonth, products, branchInventories]);

  const detailBranchProfit = React.useMemo(() => {
    return branchMonthlyTransactions.reduce((acc, tx) => {
      if (tx.type === 'OUT') {
        const { txProfit } = calculateTxProfit(tx, products, branchInventories);
        return acc + txProfit;
      }
      return acc;
    }, 0);
  }, [branchMonthlyTransactions, products, branchInventories]);

  // Overall metrics for selected branch
  const totalSKU = branchInventoryItems.length;
  const totalUnits = branchInventoryItems.reduce((acc, item) => acc + (Number(item.stockQuantity) || 0), 0);
  const totalValuation = branchInventoryItems.reduce((acc, item) => acc + ((Number(item.stockQuantity) || 0) * (Number(item.price) || 0)), 0);
  const lowStockItems = branchInventoryItems.filter(item => (Number(item.stockQuantity) || 0) <= (Number(item.minStock) || 5));

  // Monthly recap calculations
  const branchMonthlyRecap = React.useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalUnitsSold = 0;
    let totalTxCount = 0;

    branchMonthlyTransactions.forEach(tx => {
      if (tx.type === 'OUT') {
        totalTxCount++;
        const { txProfit, profitItems } = calculateTxProfit(tx, products, branchInventories);
        totalProfit += txProfit;

        if (profitItems && profitItems.length > 0) {
          profitItems.forEach(pi => {
            const qty = Number(pi.qty || 1);
            const price = Number(pi.price || 0);
            const cost = Number(pi.costPrice || 0);
            totalRevenue += price * qty;
            totalCost += cost * qty;
            totalUnitsSold += qty;
          });
        } else {
          const qty = Number(tx.qty || 1);
          const price = Number(tx.price || (tx.totalPrice ? (tx.totalPrice / qty) : 0));
          const cost = Number(tx.costPrice || 0);
          totalRevenue += tx.totalPrice ? Number(tx.totalPrice) : (price * qty);
          totalCost += cost * qty;
          totalUnitsSold += qty;
        }
      }
    });

    const marginPct = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;
    return { totalRevenue, totalCost, totalProfit, totalUnitsSold, totalTxCount, marginPct };
  }, [branchMonthlyTransactions, products, branchInventories]);

  // Calculate Top Selling Products (Produk Paling Banyak Terjual)
  const topSellingProducts = React.useMemo(() => {
    const targetTransactions = selectedBranch 
      ? branchMonthlyTransactions 
      : transactions.filter(t => isTxInSelectedMonth(t, selectedMonth));

    const salesMap = new Map();

    targetTransactions.forEach(tx => {
      if (tx.type !== 'OUT') return;
      const { profitItems } = calculateTxProfit(tx, products, branchInventories);

      if (profitItems && profitItems.length > 0) {
        profitItems.forEach(pi => {
          const qty = Number(pi.qty || 1);
          const price = Number(pi.price || 0);
          const cost = Number(pi.costPrice || 0);
          const itemProfit = Number(pi.itemProfit || ((price - cost) * qty));
          const name = pi.productName || tx.productName || 'Barang';
          const sku = pi.sku || tx.sku || '-';
          const key = sku !== '-' ? sku : name;

          const currentStockItem = branchInventoryItems.find(bi => bi.sku === sku || bi.productName === name || bi.name === name);
          const currentStock = Number(currentStockItem?.stockQuantity ?? currentStockItem?.currentStock ?? 0);
          const minStock = Number(currentStockItem?.minStock ?? 5);

          if (!salesMap.has(key)) {
            salesMap.set(key, {
              key,
              sku,
              productName: name,
              brand: currentStockItem?.brand || pi.brand || 'Generic',
              machineCategory: currentStockItem?.machineCategory || pi.machineCategory || 'Universal',
              totalQty: 0,
              totalRevenue: 0,
              totalProfit: 0,
              txCount: 0,
              currentStock,
              minStock,
              unit: pi.unit || currentStockItem?.unit || 'Pcs'
            });
          }

          const record = salesMap.get(key);
          record.totalQty += qty;
          record.totalRevenue += price * qty;
          record.totalProfit += itemProfit;
          record.txCount += 1;
        });
      } else {
        const qty = Number(tx.qty || 1);
        const price = Number(tx.price || (tx.totalPrice ? (tx.totalPrice / qty) : 0));
        const cost = Number(tx.costPrice || 0);
        const itemProfit = (price - cost) * qty;
        const name = tx.productName || 'Barang';
        const sku = tx.sku || '-';
        const key = sku !== '-' ? sku : name;

        const currentStockItem = branchInventoryItems.find(bi => bi.sku === sku || bi.productName === name || bi.name === name);
        const currentStock = Number(currentStockItem?.stockQuantity ?? currentStockItem?.currentStock ?? 0);
        const minStock = Number(currentStockItem?.minStock ?? 5);

        if (!salesMap.has(key)) {
          salesMap.set(key, {
            key,
            sku,
            productName: name,
            brand: currentStockItem?.brand || 'Generic',
            machineCategory: currentStockItem?.machineCategory || 'Universal',
            totalQty: 0,
            totalRevenue: 0,
            totalProfit: 0,
            txCount: 0,
            currentStock,
            minStock,
            unit: tx.unit || currentStockItem?.unit || 'Pcs'
          });
        }

        const record = salesMap.get(key);
        record.totalQty += qty;
        record.totalRevenue += tx.totalPrice ? Number(tx.totalPrice) : (price * qty);
        record.totalProfit += itemProfit;
        record.txCount += 1;
      }
    });

    const list = Array.from(salesMap.values());
    list.sort((a, b) => b.totalQty - a.totalQty);
    return list;
  }, [selectedBranch, branchMonthlyTransactions, transactions, selectedMonth, products, branchInventories, branchInventoryItems]);

  // Handle Checkbox Selection
  const handleToggleSelectProduct = (id) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllOnPage = () => {
    if (filteredInventories.length === 0) return;
    const allSelected = filteredInventories.every(p => selectedProductIds.has(p.id));
    if (allSelected) {
      setSelectedProductIds(new Set());
    } else {
      const next = new Set(selectedProductIds);
      filteredInventories.forEach(p => next.add(p.id));
      setSelectedProductIds(next);
    }
  };

  // Toggle Status of Single Product
  const handleToggleProductStatus = async (item) => {
    try {
      if (isPusatSelected) {
        const nextStatus = item.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
        if (onUpdateProduct) {
          await onUpdateProduct(item.id, { status: nextStatus });
        }
      } else {
        const nextStatus = item.status === 'INACTIVE' ? 'APPROVED' : 'INACTIVE';
        if (onUpdateBranchInventory) {
          await onUpdateBranchInventory(item.id, { ...item, status: nextStatus });
        }
      }
    } catch (e) {
      console.error("Error toggling product status:", e);
    }
  };

  // Open Stock Adjust Modal
  const handleOpenStockAdjust = (item) => {
    setAdjustingStockItem(item);
    setAdjustStockQty(Number(item.stockQuantity) || 0);
    setAdjustStockNotes(`Koreksi/Opname stok fisik di ${selectedBranch?.name || 'Cabang'}`);
  };

  const handleSaveStockAdjust = async (e) => {
    e?.preventDefault();
    if (!adjustingStockItem) return;
    setIsSubmittingAdjust(true);
    try {
      const newQty = Math.max(0, Number(adjustStockQty));
      if (isPusatSelected) {
        if (onUpdateProduct) {
          await onUpdateProduct(adjustingStockItem.id, { 
            currentStock: newQty, 
            stock: newQty, 
            quantity: newQty,
            notes: adjustStockNotes 
          });
        }
      } else {
        if (onUpdateBranchInventory) {
          await onUpdateBranchInventory(adjustingStockItem.id, {
            ...adjustingStockItem,
            stockQuantity: newQty,
            notes: adjustStockNotes
          });
        }
      }
      setAdjustingStockItem(null);
    } catch (err) {
      console.error("Error adjusting stock:", err);
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (item) => {
    setEditingProductItem(item);
    setEditFormData({
      productName: item.productName || item.name || '',
      brand: item.brand || 'Generic',
      machineCategory: item.machineCategory || 'Universal',
      price: Number(item.price) || 0,
      costPrice: Number(item.costPrice) || 0,
      minStock: Number(item.minStock) || 5,
      status: item.status || 'APPROVED',
      notes: item.notes || ''
    });
  };

  const handleSaveEditProduct = async (e) => {
    e?.preventDefault();
    if (!editingProductItem) return;
    setIsSubmittingEdit(true);
    try {
      if (isPusatSelected) {
        if (onUpdateProduct) {
          await onUpdateProduct(editingProductItem.id, {
            name: editFormData.productName,
            brand: editFormData.brand,
            machineCategory: editFormData.machineCategory,
            price: Number(editFormData.price),
            selling_price: Number(editFormData.price),
            cost_price: Number(editFormData.costPrice),
            reseller_price: Number(editFormData.costPrice),
            minStock: Number(editFormData.minStock),
            status: editFormData.status,
            notes: editFormData.notes
          });
        }
      } else {
        if (onUpdateBranchInventory) {
          await onUpdateBranchInventory(editingProductItem.id, {
            ...editingProductItem,
            productName: editFormData.productName,
            brand: editFormData.brand,
            machineCategory: editFormData.machineCategory,
            price: Number(editFormData.price),
            costPrice: Number(editFormData.costPrice),
            minStock: Number(editFormData.minStock),
            status: editFormData.status,
            notes: editFormData.notes
          });
        }
      }
      setEditingProductItem(null);
    } catch (err) {
      console.error("Error editing product:", err);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle Delete Product (Single or Batch)
  const handleExecuteDelete = async () => {
    if (!deleteConfirmItem) return;
    setIsDeleting(true);
    try {
      if (deleteConfirmItem.isBatch) {
        const ids = Array.from(selectedProductIds);
        if (isPusatSelected) {
          if (onDeleteProductsBatch) {
            await onDeleteProductsBatch(ids);
          }
        } else {
          for (const id of ids) {
            if (onUpdateBranchInventory) {
              await onUpdateBranchInventory(id, { status: 'INACTIVE', stockQuantity: 0 });
            }
          }
        }
        setSelectedProductIds(new Set());
      } else {
        const item = deleteConfirmItem.item;
        if (isPusatSelected) {
          if (onDeleteProduct) {
            await onDeleteProduct(item.id);
          }
        } else {
          if (onUpdateBranchInventory) {
            await onUpdateBranchInventory(item.id, { status: 'INACTIVE', stockQuantity: 0 });
          }
        }
      }
      setDeleteConfirmItem(null);
    } catch (err) {
      console.error("Error deleting:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Add Master Products to this Branch (Batch Selection Modal)
  const handleToggleAddMasterSelection = (prod) => {
    setAddBranchSelectedMasterIds(prev => {
      const next = new Set(prev);
      if (next.has(prod.id)) {
        next.delete(prod.id);
      } else {
        next.add(prod.id);
        if (addBranchQtyMap[prod.id] === undefined) {
          setAddBranchQtyMap(q => ({ ...q, [prod.id]: 1 }));
        }
        if (addBranchPriceMap[prod.id] === undefined) {
          setAddBranchPriceMap(p => ({ ...p, [prod.id]: Number(prod.price || prod.selling_price || 0) }));
        }
      }
      return next;
    });
  };

  const handleSaveAddBranchProducts = async (e) => {
    e?.preventDefault();
    if (addBranchSelectedMasterIds.size === 0 || !selectedBranch) return;
    setIsSubmittingAddBranch(true);
    try {
      const itemsToAdd = [];
      for (const prodId of addBranchSelectedMasterIds) {
        const p = products.find(prod => prod.id === prodId);
        if (!p) continue;
        const qty = Math.max(0, Number(addBranchQtyMap[prodId] || 1));
        const price = Math.max(0, Number(addBranchPriceMap[prodId] || p.price || p.selling_price || 0));

        itemsToAdd.push({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          brand: p.brand || 'Generic',
          category: p.category || 'General',
          machineCategory: p.machineCategory || p.kategoriMesin || 'Universal',
          stockQuantity: qty,
          minStock: Number(p.minStock) || 5,
          unit: p.unit || 'Pcs',
          price: price,
          costPrice: Number(p.cost_price || p.reseller_price || 0),
          status: 'APPROVED',
          branchId: selectedBranch.id,
          branchName: selectedBranch.name,
          approvedBy: currentUser?.name || 'Admin Master',
          approvedAt: new Date().toISOString()
        });
      }

      if (onRequestBranchInventory) {
        await onRequestBranchInventory(itemsToAdd);
      }
      setIsAddBranchProductOpen(false);
      setAddBranchSelectedMasterIds(new Set());
    } catch (err) {
      console.error("Error adding products to branch:", err);
    } finally {
      setIsSubmittingAddBranch(false);
    }
  };

  // Create Master Product (if in Pusat)
  const handleSaveNewMasterProduct = async (e) => {
    e?.preventDefault();
    if (!newMasterFormData.name || !newMasterFormData.sku) return;
    try {
      if (onCreateProduct) {
        await onCreateProduct(newMasterFormData);
      }
      setIsCreateMasterModalOpen(false);
      setNewMasterFormData({
        name: '',
        sku: '',
        brand: 'NDK Exhaust',
        machineCategory: 'Universal',
        price: 0,
        costPrice: 0,
        currentStock: 0,
        minStock: 5,
        unit: 'Pcs',
        status: 'ACTIVE',
        notes: ''
      });
    } catch (err) {
      console.error("Error creating master product:", err);
    }
  };

  // Purge Transactions handler
  const handlePurgeHistory = async () => {
    setIsPurging(true);
    try {
      const bId = selectedBranch ? selectedBranch.id : 'ALL';
      await purgeTransactions(bId);
      setIsPurgeConfirmOpen(false);
    } catch (e) {
      console.error("Error purging transactions:", e);
    } finally {
      setIsPurging(false);
    }
  };

  // Export Inventory CSV
  const handleExportInventoryCSV = () => {
    const branchLabel = selectedBranch ? selectedBranch.name.replace(/\s+/g, '-') : 'Semua-Cabang';
    const reportData = filteredInventories.map(item => ({
      Cabang: selectedBranch?.name || 'Cabang',
      SKU: item.sku,
      Nama_Produk: item.productName || item.name,
      Merk: item.brand || 'Generic',
      Kategori_Mesin: item.machineCategory || 'Universal',
      Kuantitas_Stok: item.stockQuantity,
      Satuan: item.unit || 'Pcs',
      Harga_Satuan: item.price,
      Total_Nilai_Stok: (Number(item.stockQuantity) || 0) * (Number(item.price) || 0),
      Status_Validasi: item.status
    }));
    exportToCSV(reportData, `Stok-Inventaris-${branchLabel}-${Date.now()}.csv`);
  };

  // Export Monthly Recap CSV
  const handleExportMonthlyRecapCSV = () => {
    const branchLabel = selectedBranch ? selectedBranch.name.replace(/\s+/g, '-') : 'Semua-Cabang';
    const periodLabel = selectedMonth === 'ALL' ? 'Semua-Periode' : selectedMonth;
    const targetTransactions = selectedBranch ? branchMonthlyTransactions : transactions.filter(t => isTxInSelectedMonth(t, selectedMonth));

    const rows = [];
    targetTransactions.forEach((tx, idx) => {
      const { txProfit, profitItems } = calculateTxProfit(tx, products, branchInventories);
      const branchName = tx.branchName || (branches.find(b => b.id === tx.branchId)?.name) || (selectedBranch?.name) || 'Cabang';
      const formattedDate = formatTime(tx.createdAt || tx.timestamp || tx.date);

      if (profitItems && profitItems.length > 0) {
        profitItems.forEach((pi, itemIdx) => {
          const qty = Number(pi.qty || 1);
          const sellingPrice = Number(pi.price || 0);
          const costPrice = Number(pi.costPrice || 0);
          const omset = sellingPrice * qty;
          const modal = costPrice * qty;
          const itemProfit = Number(pi.itemProfit || (omset - modal));

          rows.push({
            'No': `${idx + 1}.${itemIdx + 1}`,
            'Periode': formatMonthLabel(selectedMonth),
            'Waktu Transaksi': formattedDate,
            'No. Nota / Invoice': tx.invoiceNumber || tx.id || '-',
            'Gudang / Cabang': branchName,
            'Petugas': tx.user || '-',
            'SKU': pi.sku || '-',
            'Nama Produk': pi.productName || tx.productName || 'Barang',
            'Qty Terjual': qty,
            'Satuan': pi.unit || 'Pcs',
            'Harga Jual Satuan (Rp)': sellingPrice,
            'Harga Modal Satuan (Rp)': costPrice,
            'Total Omset (Rp)': omset,
            'Total Modal (Rp)': modal,
            'Estimasi Profit (Rp)': itemProfit,
            'Platform / Saluran': tx.platformName || tx.salesPlatform || 'Offline (Toko Fisik)',
            'Tipe Transaksi': tx.type === 'OUT' ? 'Penjualan Keluar' : tx.type
          });
        });
      }
    });

    if (rows.length === 0) {
      alert(`Tidak ada transaksi tercatat pada periode ${formatMonthLabel(selectedMonth)}.`);
      return;
    }
    exportToCSV(rows, `Rekap-Bulanan-${branchLabel}-${periodLabel}.csv`);
  };

  // ==========================================
  // VIEW 1: DEDICATED BRANCH WAREHOUSE VIEW
  // (Full management & monitoring of branch products)
  // ==========================================
  if (selectedBranch) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
        
        {/* Breadcrumb & Switcher Bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {!isBranchStaff ? (
              <button
                onClick={() => {
                  setSelectedBranchId('ALL');
                  setSelectedStaffName('ALL');
                  setSearchTerm('');
                  setBrandFilter('ALL');
                  setStockFilter('ALL');
                  setSelectedProductIds(new Set());
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Semua Wadah Cabang</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-xl text-xs font-bold text-sky-800 shadow-2xs">
                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                <span>{isBranchStaff ? 'Wadah Toko' : 'Wadah Gudang Cabang'}</span>
              </div>
            )}

            <ChevronRight className="w-4 h-4 text-slate-400" />

            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-sky-600" />
                {selectedBranch?.name || 'Cabang'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                isPusatSelected 
                  ? 'bg-indigo-100 text-indigo-800' 
                  : (isBranchStaff ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-100 text-emerald-800')
              }`}>
                {isPusatSelected ? 'Master HQ' : (isBranchStaff ? 'Toko Aktif' : 'Wadah Cabang Aktif')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Branch Switcher Dropdown */}
            {!isBranchStaff && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold hidden md:inline">Pindah Wadah:</span>
                <select
                  value={selectedBranchId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedBranchId(val === 'OVERVIEW' ? 'ALL' : val);
                    setSearchTerm('');
                    setBrandFilter('ALL');
                    setStockFilter('ALL');
                    setSelectedProductIds(new Set());
                  }}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                >
                  <option value="OVERVIEW">📁 « Semua Wadah Cabang »</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.isPusat ? '(Pusat)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Monthly Period Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Periode:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {availableMonths.map(mKey => (
                  <option key={mKey} value={mKey}>
                    {formatMonthLabel(mKey)}{mKey === getCurrentMonthKey() ? ' (Bulan Ini)' : ''}
                  </option>
                ))}
                <option value="ALL">Semua Periode</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dedicated Branch Header Banner (Dark Navy) */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 text-white p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                {selectedBranch?.name}
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-white/10 text-sky-200 border border-white/10">
                {selectedBranch?.code || 'CABANG'}
              </span>

              {/* Confidential Branch Type Classification - Visible ONLY to Admin / Pusat */}
              {isPusatSelected ? (
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/40">
                  Gudang Utama Pusat
                </span>
              ) : (isAdmin || isStaffPusat) ? (
                selectedBranch?.branchType === 'DISTRIBUTOR' ? (
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/40 flex items-center gap-1" title="Tipe Kemitraan: Distributor (Rahasia Pusat)">
                    <span>🏢</span> Distributor
                  </span>
                ) : selectedBranch?.branchType === 'INTERNAL' ? (
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 flex items-center gap-1" title="Tipe Kemitraan: Internal (Rahasia Pusat)">
                    <span>🏛️</span> Internal
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/30 text-amber-200 border border-amber-400/40 flex items-center gap-1" title="Tipe Kemitraan: Reseller (Rahasia Pusat)">
                    <span>🏪</span> Reseller
                  </span>
                )
              ) : null}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              {selectedBranch?.address ? `${selectedBranch.address} • ` : ''}PIC: <strong className="text-white">{selectedBranch?.pic || selectedBranch?.managerName || 'Staff Cabang'}</strong>
            </p>
            
            {/* Pill Highlights */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="px-3 py-1 bg-white/10 text-white rounded-lg text-xs font-semibold">
                📦 Total SKU: <strong>{totalSKU} Produk</strong>
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-lg text-xs font-semibold">
                ⚡ Stok Fisik: <strong>{totalUnits} Pcs</strong>
              </span>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-lg text-xs font-semibold">
                🏷️ Merk Aktif: <strong>{branchBrandNames.length} Merk</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start md:self-center">
            {/* Direct Add/Propose Product Button inside Branch */}
            {canManageProducts && (
              isPusatSelected ? (
                <button
                  onClick={() => setIsCreateMasterModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Buat Master Produk</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsAddBranchProductOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Tambah / Atur Produk Cabang</span>
                </button>
              )
            )}

            <button
              onClick={handleExportMonthlyRecapCSV}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/10 shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              title="Download Laporan Rekap Penjualan & Profit Bulanan"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Rekap Bulanan</span>
            </button>

            <button
              onClick={handleExportInventoryCSV}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 border border-slate-700"
              title="Download Daftar Inventaris Stok Fisik"
            >
              <Download className="w-4 h-4" />
              <span>Export Stok</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-slate-100 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase block">Total Produk Aktif</span>
            <span className="text-lg font-bold text-slate-800 mt-0.5 block">{totalSKU} SKU</span>
          </div>
          <div className="p-4 text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase block">Total Fisik Stok</span>
            <span className="text-lg font-bold text-slate-800 mt-0.5 block">{totalUnits.toLocaleString('id-ID')} Pcs</span>
          </div>
          <div className="p-4 text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase block">Stok Menipis</span>
            <span className={`text-lg font-bold mt-0.5 block ${lowStockItems.length > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {lowStockItems.length} Item
            </span>
          </div>
          <div className="p-4 text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase block">Total Valuasi Stok</span>
            <span className="text-lg font-bold text-emerald-600 mt-0.5 block">
              Rp {totalValuation.toLocaleString('id-ID')}
            </span>
          </div>
          <div 
            className="p-4 text-center cursor-pointer hover:bg-emerald-50 transition group"
            onClick={() => setShowProfitDetails(true)}
          >
            <span className="text-[11px] font-semibold text-emerald-600 uppercase block flex items-center justify-center gap-1">
              Estimasi Profit <span className="text-[10px] lowercase font-normal">({selectedMonth === 'ALL' ? 'semua' : (selectedMonth === getCurrentMonthKey() ? 'bulan ini' : formatMonthLabel(selectedMonth))})</span> <Info className="w-3 h-3 text-emerald-500 group-hover:text-emerald-700" />
            </span>
            <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
              Rp {detailBranchProfit.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* SECTION: TOP SELLING PRODUCTS (PRODUK TERLARIS DI CABANG - DIATAS TABEL) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Peringkat Produk Paling Banyak Terjual (Best Sellers)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Statistik ditarik dari riwayat mutasi penjualan barang keluar di {selectedBranch.name} periode <strong className="text-slate-700">{formatMonthLabel(selectedMonth)}</strong>.
              </p>
            </div>

            {topSellingProducts.length > 0 && (
              <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold self-start sm:self-auto flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>{topSellingProducts.reduce((sum, p) => sum + p.totalQty, 0)} Total Unit Terjual</span>
              </span>
            )}
          </div>

          {topSellingProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-1.5">
              <Trophy className="w-7 h-7 mx-auto text-slate-300 stroke-1" />
              <p className="font-semibold text-slate-600">Belum ada data penjualan pada periode {formatMonthLabel(selectedMonth)}.</p>
              <p className="text-[11px] text-slate-400">Data produk terlaris akan otomatis terakumulasi setelah terjadi transaksi penjualan keluar (OUT).</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {topSellingProducts.slice(0, 6).map((item, idx) => {
                const isTop1 = idx === 0;
                const isTop2 = idx === 1;
                const isTop3 = idx === 2;
                const medal = isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : `#${idx + 1}`;
                const maxQty = topSellingProducts[0]?.totalQty || 1;
                const pct = Math.round((item.totalQty / maxQty) * 100);
                const isLowStock = item.currentStock <= item.minStock;

                return (
                  <div 
                    key={item.key} 
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 relative overflow-hidden ${
                      isTop1 
                        ? 'bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 border-amber-300 shadow-xs' 
                        : 'bg-white hover:bg-slate-50/80 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-sm ${
                            isTop1 
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs' 
                              : isTop2 
                                ? 'bg-slate-200 text-slate-800' 
                                : isTop3 
                                  ? 'bg-amber-100/60 text-amber-800' 
                                  : 'bg-slate-100 text-slate-600'
                          }`}>
                            {medal}
                          </span>
                          <div>
                            <span className="font-mono text-[10px] font-bold text-slate-400 block">SKU: {item.sku}</span>
                            <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-1" title={item.productName}>
                              {item.productName}
                            </h4>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap">
                          {item.brand}
                        </span>
                      </div>

                      {/* Visual Sales Bar */}
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-600 flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-rose-500" />
                            <span>Terjual: <strong className="text-slate-900 font-black">{item.totalQty} {item.unit}</strong></span>
                          </span>
                          <span className="text-emerald-700 font-extrabold">
                            Rp {item.totalRevenue.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isTop1 ? 'bg-amber-500' : isTop2 ? 'bg-sky-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stock Warning & Profit Breakdown */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        Profit: <strong className="text-emerald-700 font-bold">+Rp {item.totalProfit.toLocaleString('id-ID')}</strong>
                      </span>

                      <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] flex items-center gap-1 ${
                        isLowStock
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isLowStock && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        <span>Sisa Stok: {item.currentStock} {item.unit}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Toolbar with Search & Brand Dropdown Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Cari nama produk, SKU, merk, atau kategori mesin di ${selectedBranch?.name}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter Brand */}
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">🏷️ Semua Merk ({branchBrandNames.length})</option>
              {branchBrandNames.map(bName => (
                <option key={bName} value={bName}>{bName}</option>
              ))}
            </select>

            {/* Filter Stock */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-medium">
              <button
                onClick={() => setStockFilter('ALL')}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer text-xs ${
                  stockFilter === 'ALL' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setStockFilter('LOW')}
                className={`px-2.5 py-1.5 rounded-lg transition text-xs flex items-center gap-1 cursor-pointer ${
                  stockFilter === 'LOW' ? 'bg-rose-600 text-white font-bold shadow-2xs' : 'text-rose-600 hover:text-rose-700'
                }`}
              >
                <span>Menipis ({lowStockItems.length})</span>
              </button>
              <button
                onClick={() => setStockFilter('SAFE')}
                className={`px-2.5 py-1.5 rounded-lg transition text-xs cursor-pointer ${
                  stockFilter === 'SAFE' ? 'bg-emerald-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aman
              </button>
            </div>
          </div>
        </div>

        {/* PRODUCT INVENTORY TABLE WITH ACTION TOOLS (Matching Screenshot 2) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {filteredInventories.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Package className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
              <p className="text-sm font-medium">Belum ada produk yang sesuai filter di gudang ini.</p>
              {canManageProducts && !isPusatSelected && (
                <button
                  onClick={() => setIsAddBranchProductOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  + Tambah / Ajukan Barang ke Cabang Ini
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
                  <tr>
                    {canManageProducts && (
                      <th className="px-3 py-3.5 text-center w-10 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={handleSelectAllOnPage}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer flex items-center justify-center mx-auto"
                          title={filteredInventories.length > 0 && filteredInventories.every(p => selectedProductIds.has(p.id)) ? "Lepas pilihan semua" : "Pilih semua"}
                        >
                          {filteredInventories.length > 0 && filteredInventories.every(p => selectedProductIds.has(p.id)) ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : filteredInventories.some(p => selectedProductIds.has(p.id)) ? (
                            <MinusSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>
                      </th>
                    )}
                    <th className="px-3.5 py-3.5 text-center font-bold text-slate-500 text-xs w-12 whitespace-nowrap">NO.</th>
                    <th className="px-5 py-3.5 min-w-[220px]">PRODUK & MERK</th>
                    <th className="px-4 py-3.5 text-center whitespace-nowrap min-w-[130px]">KATEGORI MESIN</th>
                    <th className="px-4 py-3.5 whitespace-nowrap min-w-[140px]">SKU MASTER</th>
                    <th className="px-4 py-3.5 text-right whitespace-nowrap min-w-[120px]">HARGA UNIT</th>
                    <th className="px-4 py-3.5 text-center whitespace-nowrap min-w-[120px]">
                      {isPusatSelected ? 'STOK PUSAT' : 'STOK CABANG'}
                    </th>
                    <th className="px-4 py-3.5 text-center whitespace-nowrap min-w-[100px]">STATUS</th>
                    <th className="px-5 py-3.5 text-right whitespace-nowrap min-w-[140px]">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredInventories.map((item, idx) => {
                    const isSelected = selectedProductIds.has(item.id);
                    const isInactive = item.status === 'INACTIVE';
                    const isLow = (Number(item.stockQuantity) || 0) <= (Number(item.minStock) || 5);

                    return (
                      <tr key={item.id || idx} className={`transition ${
                        isSelected 
                          ? 'bg-indigo-50/40 hover:bg-indigo-50/60' 
                          : isInactive 
                            ? 'bg-slate-50/60 opacity-60 hover:bg-slate-100/70' 
                            : 'hover:bg-slate-50/70'
                      }`}>
                        {/* Checkbox */}
                        {canManageProducts && (
                          <td className="px-3 py-3.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectProduct(item.id)}
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
                          {idx + 1}
                        </td>

                        <td className="px-5 py-3.5 font-medium text-slate-900 min-w-[220px]">
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <span className="font-bold text-slate-900 text-sm leading-snug">{item.productName || item.name}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap flex-shrink-0">
                              {item.brand || 'Generic'}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-50 text-amber-900 border border-amber-200/80 inline-block">
                            {item.machineCategory || 'Universal'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-xs text-slate-700 font-mono font-bold whitespace-nowrap">
                          {item.sku}
                        </td>

                        <td className="px-4 py-3.5 text-right text-slate-900 font-bold whitespace-nowrap">
                          Rp {(Number(item.price) || 0).toLocaleString('id-ID')}
                        </td>

                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap ${
                            isInactive
                              ? 'bg-slate-100 text-slate-500'
                              : isLow 
                                ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                                : 'bg-slate-100 text-slate-800'
                          }`}>
                            {item.stockQuantity} {item.unit || 'Pcs'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold whitespace-nowrap ${
                            isInactive
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isInactive ? 'bg-rose-500' : 'bg-emerald-500'} inline-block`} />
                            {isInactive ? 'Non-Aktif' : 'Aktif'}
                          </span>
                        </td>

                        {/* AKSI BUTTONS (Matching Screenshot 2) */}
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 flex-nowrap">
                            {/* Barcode/QR */}
                            <button
                              onClick={() => onShowBarcode && onShowBarcode(item)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Cetak Barcode / QR"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>

                            {canManageProducts && (
                              <>
                                {/* Status Toggle */}
                                <button
                                  onClick={() => handleToggleProductStatus(item)}
                                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                                    isInactive
                                      ? 'text-emerald-600 hover:bg-emerald-50' 
                                      : 'text-amber-600 hover:bg-amber-50'
                                  }`}
                                  title={isInactive ? 'Aktifkan Produk' : 'Non-aktifkan Produk (Soft Delete)'}
                                >
                                  {isInactive ? <Check className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                </button>

                                {/* Edit Stock (Sliders) */}
                                <button
                                  onClick={() => handleOpenStockAdjust(item)}
                                  className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                  title="Edit / Opname Stok Fisik"
                                >
                                  <Sliders className="w-4 h-4" />
                                </button>

                                {/* Edit Product Info (Edit3) */}
                                <button
                                  onClick={() => handleOpenEditProduct(item)}
                                  className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                                  title="Ubah Rincian & Harga Produk"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                {/* Delete (Trash2) */}
                                <button
                                  onClick={() => setDeleteConfirmItem({ item, isBatch: false, isPusat: isPusatSelected })}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Hapus Produk dari Gudang Ini"
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
          )}
        </div>

        {/* Floating Batch Actions Bar */}
        {selectedProductIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200">
            <span className="text-xs font-bold text-sky-300">
              {selectedProductIds.size} produk dipilih
            </span>
            <div className="h-4 w-px bg-slate-700" />
            <button
              onClick={() => setDeleteConfirmItem({ isBatch: true, isPusat: isPusatSelected })}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Terpilih</span>
            </button>
            <button
              onClick={() => setSelectedProductIds(new Set())}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              title="Batal Pilihan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SECTION B: MUTATION HISTORY & TRANSACTIONS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-600" />
                <span>Log Riwayat Mutasi & Transaksi di {selectedBranch.name}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pencatatan real-time seluruh arus barang masuk dan keluar di cabang ini.
              </p>
            </div>

            {branchStaffList.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500">Filter Staff:</label>
                <select
                  value={selectedStaffName}
                  onChange={(e) => setSelectedStaffName(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="ALL">Semua Petugas ({branchStaffList.length})</option>
                  {branchStaffList.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            {branchTransactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Belum ada catatan mutasi transaksi untuk cabang ini.
              </div>
            ) : (
              branchTransactions.slice(0, 30).map((tx) => {
                const isIn = tx.type === 'IN';
                return (
                  <div 
                    key={tx.id}
                    onClick={() => setSelectedDetailTx(tx)}
                    className="p-3 bg-slate-50 hover:bg-sky-50/70 rounded-xl border border-slate-200/80 hover:border-sky-300 flex items-center justify-between gap-3 text-xs transition cursor-pointer group shadow-2xs"
                    title="Klik untuk melihat rincian & download dokumen PDF"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold flex-shrink-0 shadow-xs group-hover:scale-105 transition ${
                        isIn ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {isIn ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 group-hover:text-sky-700 transition leading-snug truncate">
                            {tx.productName}
                          </span>
                          {tx.invoiceNumber && (
                            <span className="font-mono text-[10px] font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                              {tx.invoiceNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Petugas: <strong className="text-slate-700">{tx.user || '-'}</strong> • {formatTime(tx.createdAt || tx.timestamp || tx.date)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 flex items-center gap-3">
                      <div>
                        <span className={`text-xs font-bold block ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isIn ? '+' : '-'}{tx.qty} Pcs
                        </span>
                        <p className="text-[10px] text-slate-400 max-w-[140px] sm:max-w-xs truncate">{tx.notes || '-'}</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-sky-600 bg-sky-100/60 group-hover:bg-sky-600 group-hover:text-white px-2.5 py-1.5 rounded-lg transition">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Lihat & PDF</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* MODAL 1: STOCK ADJUSTMENT (OPNAME) */}
        {adjustingStockItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
              <div className="p-5 border-b border-slate-100 bg-emerald-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Sesuaikan Stok Fisik</h3>
                    <p className="text-xs text-slate-500">{adjustingStockItem.productName || adjustingStockItem.name}</p>
                  </div>
                </div>
                <button onClick={() => setAdjustingStockItem(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveStockAdjust} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold uppercase mb-1">Jumlah Stok Fisik Baru (Pcs)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={adjustStockQty}
                    onChange={(e) => setAdjustStockQty(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-base font-extrabold text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase mb-1">Alasan / Catatan Penyesuaian</label>
                  <input
                    type="text"
                    value={adjustStockNotes}
                    onChange={(e) => setAdjustStockNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setAdjustingStockItem(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition cursor-pointer">
                    Batal
                  </button>
                  <button type="submit" disabled={isSubmittingAdjust} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer">
                    {isSubmittingAdjust ? 'Menyimpan...' : 'Simpan Perubahan Stok'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: EDIT PRODUCT DETAILS */}
        {editingProductItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
              <div className="p-5 border-b border-slate-100 bg-sky-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Edit Rincian Produk</h3>
                    <p className="text-xs text-slate-500">SKU: {editingProductItem.sku}</p>
                  </div>
                </div>
                <button onClick={() => setEditingProductItem(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditProduct} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold uppercase mb-1">Nama Produk</label>
                  <input
                    type="text"
                    required
                    value={editFormData.productName}
                    onChange={(e) => setEditFormData({ ...editFormData, productName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold uppercase mb-1">Merk / Brand</label>
                    <input
                      type="text"
                      value={editFormData.brand}
                      onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold uppercase mb-1">Kategori Mesin</label>
                    <input
                      type="text"
                      value={editFormData.machineCategory}
                      onChange={(e) => setEditFormData({ ...editFormData, machineCategory: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold uppercase mb-1">Harga Jual Unit (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      value={editFormData.price}
                      onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold uppercase mb-1">Harga Modal / HPP (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      value={editFormData.costPrice}
                      onChange={(e) => setEditFormData({ ...editFormData, costPrice: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold uppercase mb-1">Batas Minimum Stok Alert</label>
                    <input
                      type="number"
                      min="1"
                      value={editFormData.minStock}
                      onChange={(e) => setEditFormData({ ...editFormData, minStock: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold uppercase mb-1">Status Produk</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                    >
                      <option value="APPROVED">🟢 Aktif (Disetujui)</option>
                      <option value="INACTIVE">🔴 Non-Aktif (Soft Delete)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setEditingProductItem(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition cursor-pointer">
                    Batal
                  </button>
                  <button type="submit" disabled={isSubmittingEdit} className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer">
                    {isSubmittingEdit ? 'Menyimpan...' : 'Simpan Rincian'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: ADD/ASSIGN PRODUCTS TO THIS BRANCH */}
        {isAddBranchProductOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
              <div className="p-5 border-b border-slate-100 bg-emerald-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Tambah Produk ke {selectedBranch?.name}</h3>
                    <p className="text-xs text-slate-500">Pilih produk dari Katalog Master untuk ditambahkan ke cabang ini.</p>
                  </div>
                </div>
                <button onClick={() => setIsAddBranchProductOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-2.5 bg-slate-50/50">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari produk master untuk ditambahkan..."
                    value={addBranchSearch}
                    onChange={(e) => setAddBranchSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <select
                  value={addBranchBrandFilter}
                  onChange={(e) => setAddBranchBrandFilter(e.target.value)}
                  className="w-full sm:w-44 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Merk</option>
                  {Array.from(new Set(products.map(p => p.brand).filter(Boolean))).map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Master Products List */}
              <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
                {products
                  .filter(p => {
                    const matchesS = matchesSearch(addBranchSearch, p.name, p.sku, p.brand, p.machineCategory);
                    const matchesB = addBranchBrandFilter === 'ALL' || p.brand === addBranchBrandFilter;
                    return matchesS && matchesB;
                  })
                  .map(p => {
                    const isSelected = addBranchSelectedMasterIds.has(p.id);
                    const alreadyInBranch = branchInventoryItems.some(bi => bi.productId === p.id || bi.sku === p.sku);

                    return (
                      <div key={p.id} className={`py-3 px-3.5 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isSelected ? 'bg-emerald-50/70 border border-emerald-300' : 'hover:bg-slate-50'}`}>
                        <div className="flex items-start gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleAddMasterSelection(p)}
                            className="mt-0.5 p-1 transition cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">{p.name}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {p.brand || 'Generic'}
                              </span>
                              {alreadyInBranch && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  Sudah ada di Cabang
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              SKU: {p.sku} • Kat: {p.machineCategory || 'Universal'}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-2.5 self-end sm:self-center pl-7 sm:pl-0">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold">Stok Awal</span>
                              <input
                                type="number"
                                min="0"
                                value={addBranchQtyMap[p.id] ?? 1}
                                onChange={(e) => setAddBranchQtyMap({ ...addBranchQtyMap, [p.id]: e.target.value })}
                                className="w-20 px-2 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold">Harga Jual (Rp)</span>
                              <input
                                type="number"
                                min="0"
                                value={addBranchPriceMap[p.id] ?? (p.price || p.selling_price || 0)}
                                onChange={(e) => setAddBranchPriceMap({ ...addBranchPriceMap, [p.id]: e.target.value })}
                                className="w-28 px-2 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-right focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  {addBranchSelectedMasterIds.size} produk dipilih
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setIsAddBranchProductOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer">
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={addBranchSelectedMasterIds.size === 0 || isSubmittingAddBranch}
                    onClick={handleSaveAddBranchProducts}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    {isSubmittingAddBranch ? 'Menambahkan...' : `Tambahkan (${addBranchSelectedMasterIds.size}) Produk ke Cabang`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: CREATE MASTER PRODUCT (IF PUSAT) */}
        {isCreateMasterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
              <div className="p-5 border-b border-slate-100 bg-indigo-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Buat Master Produk Baru</h3>
                    <p className="text-xs text-slate-500">Tambahkan SKU katalog master ke Gudang Pusat.</p>
                  </div>
                </div>
                <button onClick={() => setIsCreateMasterModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveNewMasterProduct} className="p-5 space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold uppercase mb-1">Nama Produk Master *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bolton Titanium 2KD"
                    value={newMasterFormData.name}
                    onChange={(e) => setNewMasterFormData({ ...newMasterFormData, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold uppercase mb-1">SKU Master *</label>
                    <input
                      type="text"
                      required
                      placeholder="WZ-2KD-B0-001"
                      value={newMasterFormData.sku}
                      onChange={(e) => setNewMasterFormData({ ...newMasterFormData, sku: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold uppercase mb-1">Merk / Brand</label>
                    <input
                      type="text"
                      value={newMasterFormData.brand}
                      onChange={(e) => setNewMasterFormData({ ...newMasterFormData, brand: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold uppercase mb-1">Kategori Mesin</label>
                    <input
                      type="text"
                      placeholder="2KD, 2GD, 4D56, dll"
                      value={newMasterFormData.machineCategory}
                      onChange={(e) => setNewMasterFormData({ ...newMasterFormData, machineCategory: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold uppercase mb-1">Stok Awal Fisik Pusat</label>
                    <input
                      type="number"
                      min="0"
                      value={newMasterFormData.currentStock}
                      onChange={(e) => setNewMasterFormData({ ...newMasterFormData, currentStock: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold uppercase mb-1">Harga Jual Satuan (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      value={newMasterFormData.price}
                      onChange={(e) => setNewMasterFormData({ ...newMasterFormData, price: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold uppercase mb-1">Harga Modal / HPP (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      value={newMasterFormData.costPrice}
                      onChange={(e) => setNewMasterFormData({ ...newMasterFormData, costPrice: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button type="button" onClick={() => setIsCreateMasterModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition cursor-pointer">
                    Batal
                  </button>
                  <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer">
                    Simpan Master Produk
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 5: DELETE CONFIRMATION */}
        {deleteConfirmItem && (
          <ConfirmationModal
            isOpen={Boolean(deleteConfirmItem)}
            title={deleteConfirmItem.isBatch ? "Hapus Beberapa Produk?" : "Hapus Produk Ini?"}
            message={deleteConfirmItem.isBatch 
              ? `Apakah Anda yakin ingin menghapus ${selectedProductIds.size} produk terpilih dari gudang ini?` 
              : `Apakah Anda yakin ingin menghapus produk "${deleteConfirmItem.item?.productName || deleteConfirmItem.item?.name}" dari gudang ini?`}
            confirmText={isDeleting ? "Menghapus..." : "Ya, Hapus"}
            cancelText="Batal"
            type="danger"
            onConfirm={handleExecuteDelete}
            onCancel={() => setDeleteConfirmItem(null)}
          />
        )}

        {/* MODAL 6: PURGE TRANSACTIONS */}
        {isPurgeConfirmOpen && (
          <ConfirmationModal
            isOpen={isPurgeConfirmOpen}
            title="Purge Data Riwayat Transaksi?"
            message={`Tindakan ini akan menghapus seluruh catatan riwayat transaksi pada cabang ${selectedBranch?.name}. Data transaksi tidak dapat dikembalikan setelah dihapus.`}
            confirmText={isPurging ? "Memproses..." : "Ya, Purge Data"}
            cancelText="Batal"
            type="danger"
            onConfirm={handlePurgeHistory}
            onCancel={() => setIsPurgeConfirmOpen(false)}
          />
        )}

        {/* MODAL 7: TRANSACTION DETAIL & PDF */}
        <TransactionDetailModal
          isOpen={Boolean(selectedDetailTx)}
          transaction={selectedDetailTx}
          onClose={() => setSelectedDetailTx(null)}
          products={products}
        />

        {/* MODAL 8: DETAIL ESTIMASI PROFIT & LAPORAN PENJUALAN */}
        {showProfitDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
              
              {/* Header */}
              <div className="p-5 border-b border-slate-100 bg-emerald-50/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <span>Rincian & Kalkulasi Estimasi Profit</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {selectedBranch ? selectedBranch.name : 'Seluruh Cabang'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Periode: <strong className="text-slate-800">{formatMonthLabel(selectedMonth)}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportMonthlyRecapCSV}
                    className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Export CSV Rekap Bulanan"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">Export Excel/CSV</span>
                  </button>
                  <button
                    onClick={() => setShowProfitDetails(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 bg-slate-50/70 border-b border-slate-100 text-center">
                <div className="p-3.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Transaksi Keluar</span>
                  <span className="text-base font-extrabold text-slate-800 mt-0.5 block">{profitDetails.length} Transaksi</span>
                </div>
                <div className="p-3.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Omset Penjualan</span>
                  <span className="text-base font-extrabold text-slate-800 mt-0.5 block">
                    Rp {profitDetails.reduce((sum, tx) => {
                      return sum + (tx.profitItems || []).reduce((itemSum, pi) => itemSum + ((Number(pi.price) || 0) * (Number(pi.qty) || 1)), 0);
                    }, 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="p-3.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Modal (HPP)</span>
                  <span className="text-base font-extrabold text-slate-800 mt-0.5 block">
                    Rp {profitDetails.reduce((sum, tx) => {
                      return sum + (tx.profitItems || []).reduce((itemSum, pi) => itemSum + ((Number(pi.costPrice) || 0) * (Number(pi.qty) || 1)), 0);
                    }, 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="p-3.5 bg-emerald-50/60">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Estimasi Profit</span>
                  <span className="text-base font-black text-emerald-700 mt-0.5 block">
                    Rp {profitDetails.reduce((sum, tx) => sum + (Number(tx.txProfit) || 0), 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Table List of Transactions with Profit Breakdown */}
              <div className="overflow-y-auto flex-1 p-4">
                {profitDetails.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <Receipt className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                    <p className="text-xs font-semibold">Belum ada transaksi penjualan pada periode {formatMonthLabel(selectedMonth)}.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-3 text-center whitespace-nowrap w-10">No.</th>
                          <th className="px-3.5 py-3 whitespace-nowrap">Waktu & Invoice</th>
                          <th className="px-3.5 py-3 whitespace-nowrap">Platform</th>
                          <th className="px-3.5 py-3 whitespace-nowrap">Produk Terjual</th>
                          <th className="px-3 py-3 text-center whitespace-nowrap">Qty</th>
                          <th className="px-3.5 py-3 text-right whitespace-nowrap">Harga Jual</th>
                          <th className="px-3.5 py-3 text-right whitespace-nowrap">Modal (HPP)</th>
                          <th className="px-3.5 py-3 text-right whitespace-nowrap">Omset</th>
                          <th className="px-3.5 py-3 text-right whitespace-nowrap">Estimasi Profit</th>
                          <th className="px-3 py-3 text-center whitespace-nowrap">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {profitDetails.map((tx, idx) => {
                          const dateStr = formatTime(tx.createdAt || tx.timestamp || tx.date);
                          const items = tx.profitItems || [];
                          
                          return items.map((pi, itemIdx) => {
                            const qty = Number(pi.qty || 1);
                            const sellingPrice = Number(pi.price || 0);
                            const costPrice = Number(pi.costPrice || 0);
                            const omset = sellingPrice * qty;
                            const itemProfit = Number(pi.itemProfit || (omset - (costPrice * qty)));

                            return (
                              <tr key={`${tx.id}-${itemIdx}`} className="hover:bg-slate-50 transition">
                                <td className="px-3 py-3 text-center font-bold text-slate-400">
                                  {idx + 1}{items.length > 1 ? `.${itemIdx + 1}` : ''}
                                </td>
                                <td className="px-3.5 py-3">
                                  <div className="font-mono font-bold text-slate-900">{tx.invoiceNumber || tx.id || '-'}</div>
                                  <div className="text-[10px] text-slate-400">{dateStr}</div>
                                </td>
                                <td className="px-3.5 py-3 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-extrabold">
                                    {tx.platformName || tx.salesPlatform || 'Offline'}
                                  </span>
                                </td>
                                <td className="px-3.5 py-3 font-semibold text-slate-800 min-w-[160px]">
                                  <div>{pi.productName || tx.productName || 'Barang'}</div>
                                  <div className="font-mono text-[10px] text-slate-400">{pi.sku || '-'}</div>
                                  {pi.notes && (
                                    <div className="text-[10px] text-purple-700 font-normal italic mt-0.5">
                                      Komponen: {pi.notes}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-3 text-center font-bold text-slate-800 whitespace-nowrap">
                                  {qty} {pi.unit || 'Pcs'}
                                </td>
                                <td className="px-3.5 py-3 text-right text-slate-700 whitespace-nowrap">
                                  Rp {sellingPrice.toLocaleString('id-ID')}
                                </td>
                                <td className="px-3.5 py-3 text-right text-slate-500 whitespace-nowrap">
                                  Rp {costPrice.toLocaleString('id-ID')}
                                </td>
                                <td className="px-3.5 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                  Rp {omset.toLocaleString('id-ID')}
                                </td>
                                <td className="px-3.5 py-3 text-right font-extrabold text-emerald-600 whitespace-nowrap">
                                  + Rp {itemProfit.toLocaleString('id-ID')}
                                </td>
                                <td className="px-3 py-3 text-center whitespace-nowrap">
                                  <button
                                    onClick={() => setSelectedDetailTx(tx)}
                                    className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                                    title="Lihat Detail Transaksi & PDF"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          });
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowProfitDetails(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Tutup Rincian
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    );
  }

  // ==========================================
  // VIEW 2: MULTI-BRANCH DIRECTORY OVERVIEW
  // (Clean, focused view without redundant subtabs)
  // ==========================================
  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Eye className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Monitoring & Inventaris Cabang
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pusat monitoring stok gudang, performa profit bulanan, serta kendali produk antar-cabang.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          {/* Monthly Period Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 shadow-2xs w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-500">Periode:</span>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {availableMonths.map(mKey => (
                <option key={mKey} value={mKey}>
                  {formatMonthLabel(mKey)}{mKey === getCurrentMonthKey() ? ' (Bulan Ini)' : ''}
                </option>
              ))}
              <option value="ALL">Semua Periode</option>
            </select>
          </div>

          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => setIsPurgeConfirmOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer"
              title="Purge Data Riwayat Transaksi"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Semua</span>
            </button>
          )}

          <button
            onClick={handleExportMonthlyRecapCSV}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition active:scale-98 cursor-pointer shadow-xs"
            title="Download Laporan Rekap Penjualan & Profit Bulanan Seluruh Cabang"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Rekap Bulanan</span>
          </button>

          <button
            onClick={handleExportInventoryCSV}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-xs transition active:scale-98 cursor-pointer shadow-xs"
            title="Download Rekap Stok Fisik Seluruh Cabang"
          >
            <Download className="w-4 h-4" />
            <span>Export Stok</span>
          </button>
        </div>
      </div>

      {/* Global Consolidated KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Cabang</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{branches.length} <span className="text-xs font-normal text-slate-400">Gudang</span></h3>
        </div>
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Total SKU Global</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{products.length} <span className="text-xs font-normal text-slate-400">Item</span></h3>
        </div>
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Unit di Cabang</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {branchInventories.filter(bi => bi.status === 'APPROVED').reduce((acc, bi) => acc + (Number(bi.stockQuantity) || 0), 0).toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">Pcs</span>
          </h3>
        </div>
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Valuasi Cabang</p>
          <h3 className="text-sm sm:text-xl font-bold text-emerald-600 mt-1 truncate">
            Rp {branchInventories.filter(bi => bi.status === 'APPROVED').reduce((acc, bi) => acc + ((Number(bi.stockQuantity) || 0) * (Number(bi.price) || 0)), 0).toLocaleString('id-ID')}
          </h3>
        </div>
        <div 
          onClick={() => setShowProfitDetails(true)}
          className="bg-emerald-50/50 p-3.5 sm:p-5 rounded-2xl border border-emerald-200 shadow-xs cursor-pointer hover:bg-emerald-100/60 transition group"
          title="Klik untuk melihat rincian & kalkulasi estimasi profit"
        >
          <p className="text-[11px] font-semibold text-emerald-600 uppercase flex items-center justify-between">
            <span>Estimasi Profit <span className="text-[10px] font-normal lowercase">({selectedMonth === 'ALL' ? 'semua' : (selectedMonth === getCurrentMonthKey() ? 'bulan ini' : formatMonthLabel(selectedMonth))})</span></span>
            <Info className="w-3.5 h-3.5 text-emerald-600 group-hover:text-emerald-800" />
          </p>
          <h3 className="text-sm sm:text-xl font-bold text-emerald-700 mt-1 truncate">
            Rp {transactions.filter(t => isTxInSelectedMonth(t, selectedMonth)).reduce((acc, tx) => {
              if (tx.type === 'OUT') {
                const { txProfit } = calculateTxProfit(tx, products, branchInventories);
                return acc + txProfit;
              }
              return acc;
            }, 0).toLocaleString('id-ID')}
          </h3>
        </div>
      </div>

      {/* TOP 5 BEST SELLERS SELURUH CABANG WIDGET */}
      {topSellingProducts.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Top 5 Produk Paling Banyak Terjual Seluruh Cabang</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Produk dengan pergerakan mutasi keluar tercepat pada periode <strong className="text-slate-700">{formatMonthLabel(selectedMonth)}</strong>.
              </p>
            </div>

            <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold self-start sm:self-auto flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>{topSellingProducts.reduce((acc, p) => acc + p.totalQty, 0)} Total Unit Terjual</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {topSellingProducts.slice(0, 5).map((item, idx) => {
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
              const isTop1 = idx === 0;

              return (
                <div 
                  key={item.key} 
                  className={`p-3.5 rounded-xl border transition flex flex-col justify-between gap-2.5 ${
                    isTop1 
                      ? 'bg-gradient-to-br from-amber-50/70 to-white border-amber-300 shadow-2xs' 
                      : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-sm font-black">{medal}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-indigo-50 text-indigo-700">
                        {item.brand}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs line-clamp-1" title={item.productName}>
                      {item.productName}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 block">{item.sku}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-rose-500" />
                      <span>{item.totalQty} {item.unit}</span>
                    </span>
                    <span className="font-bold text-emerald-700 text-[11px]">
                      Rp {item.totalRevenue >= 1000000 ? `${(item.totalRevenue / 1000000).toFixed(1)}M` : item.totalRevenue.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* UNIFIED SECTION: DIREKTORI GUDANG & REKAPITULASI PERFORMA */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-600" />
              <span>Direktori Lokasi Gudang & Rekapitulasi Performa Cabang</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih cabang untuk membuka tampilan menyeluruh isi gudang, stok fisik, dan audit transaksi periode <strong className="text-slate-700">{formatMonthLabel(selectedMonth)}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setOverviewViewMode('CARDS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                overviewViewMode === 'CARDS'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid Kartu</span>
            </button>
            <button
              onClick={() => setOverviewViewMode('TABLE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                overviewViewMode === 'TABLE'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabel Performa</span>
            </button>
          </div>
        </div>

        {/* View Mode 1: Grid Kartu */}
        {overviewViewMode === 'CARDS' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {branches.map((branch) => {
              const isPusat = branch.isPusat === true || branch.code === 'GUDANG-PUSAT' || (branch.name || '').toLowerCase().includes('gudang utama pusat');
              
              const bStaff = getBranchStaff(branch);
              const bInventories = isPusat 
                ? products.map(p => ({ stockQuantity: p.currentStock || 0, status: 'APPROVED' }))
                : branchInventories.filter(bi => (bi.branchId === branch.id || bi.branchName === branch.name) && bi.status === 'APPROVED');
              
              const bSKUCount = isPusat ? products.length : bInventories.length;
              const bUnitsCount = bInventories.reduce((acc, bi) => acc + (Number(bi.stockQuantity) || 0), 0);

              const bTx = transactions.filter(t => {
                let matchesBranch = false;
                if (t.branchId === branch.id || (branch.code && t.branchId === branch.code) || (t.branchName && branch.name && t.branchName.trim().toLowerCase() === branch.name.trim().toLowerCase())) {
                  matchesBranch = true;
                } else if (t.user && bStaff.some(s => s.name?.toLowerCase() === t.user?.toLowerCase() || s.email?.toLowerCase() === t.user?.toLowerCase())) {
                  matchesBranch = true;
                }
                return matchesBranch && isTxInSelectedMonth(t, selectedMonth);
              });

              let bRevenue = 0;
              let bProfit = 0;
              bTx.forEach(tx => {
                if (tx.type === 'OUT') {
                  const { txProfit, profitItems } = calculateTxProfit(tx, products, branchInventories);
                  bProfit += txProfit;
                  if (profitItems && profitItems.length > 0) {
                    profitItems.forEach(pi => {
                      bRevenue += (Number(pi.price) || 0) * (Number(pi.qty) || 1);
                    });
                  } else {
                    bRevenue += tx.totalPrice ? Number(tx.totalPrice) : ((Number(tx.price) || 0) * (Number(tx.qty) || 1));
                  }
                }
              });

              return (
                <div
                  key={branch.id}
                  onClick={() => {
                    setSelectedBranchId(branch.id);
                    setSearchTerm('');
                    setBrandFilter('ALL');
                    setStockFilter('ALL');
                    setSelectedProductIds(new Set());
                  }}
                  className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-sky-500 hover:shadow-md transition cursor-pointer group flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition ${
                          isPusat ? 'bg-indigo-50 text-indigo-700' : 'bg-sky-50 text-sky-700'
                        }`}>
                          <Warehouse className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-base group-hover:text-sky-700 transition">
                              {branch.name}
                            </h4>
                            {isPusat ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800 border border-purple-200">
                                Master HQ
                              </span>
                            ) : (isAdmin || isStaffPusat) ? (
                              branch.branchType === 'DISTRIBUTOR' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-0.5">
                                  🏢 Distributor
                                </span>
                              ) : branch.branchType === 'INTERNAL' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-0.5">
                                  🏛️ Internal
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                                  🏪 Reseller
                                </span>
                              )
                            ) : null}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              branch.status === 'ACTIVE' || !branch.status ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {branch.status || 'Active'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            PIC: <strong className="text-slate-700">{branch.pic || branch.managerName || 'Staff Cabang'}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-600 transition flex-shrink-0">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 mt-3 flex items-center gap-3 flex-wrap">
                      {branch.address && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{branch.address}</span>
                        </span>
                      )}
                      {branch.email && (
                        <span className="flex items-center gap-1 text-slate-400 truncate">
                          <span>@</span> {branch.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center">
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Item SKU</span>
                      <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">{bSKUCount}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Fisik Stok</span>
                      <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">{bUnitsCount} Pcs</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Omset</span>
                      <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">
                        {bRevenue >= 1000000 ? `${(bRevenue / 1000000).toFixed(1)}M` : bRevenue.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 block">Profit</span>
                      <span className="text-xs font-black text-emerald-700 mt-0.5 block">
                        {bProfit >= 1000000 ? `${(bProfit / 1000000).toFixed(1)}M` : bProfit.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-xs text-sky-600 font-bold group-hover:text-sky-700">
                    <span>Buka & Monitor Isi Gudang Cabang</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* View Mode 2: Tabel Performa */
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[180px]">Nama Cabang</th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[130px]">PIC & Kontak</th>
                  <th className="px-3 py-3.5 text-center whitespace-nowrap">SKU Aktif</th>
                  <th className="px-3 py-3.5 text-center whitespace-nowrap">Fisik Stok</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap min-w-[120px]">Total Omset</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap min-w-[120px]">Estimasi Profit</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap min-w-[100px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branches.map(branch => {
                  const isPusat = branch.isPusat === true || branch.code === 'GUDANG-PUSAT' || (branch.name || '').toLowerCase().includes('gudang utama pusat');
                  const bStaff = getBranchStaff(branch);
                  const bInventories = isPusat 
                    ? products.map(p => ({ stockQuantity: p.currentStock || 0 }))
                    : branchInventories.filter(bi => (bi.branchId === branch.id || bi.branchName === branch.name) && bi.status === 'APPROVED');
                  
                  const bSKUCount = isPusat ? products.length : bInventories.length;
                  const bUnitsCount = bInventories.reduce((acc, bi) => acc + (Number(bi.stockQuantity) || 0), 0);

                  const bTx = transactions.filter(t => {
                    let matchesBranch = false;
                    if (t.branchId === branch.id || (branch.code && t.branchId === branch.code) || (t.branchName && branch.name && t.branchName.trim().toLowerCase() === branch.name.trim().toLowerCase())) {
                      matchesBranch = true;
                    } else if (t.user && bStaff.some(s => s.name?.toLowerCase() === t.user?.toLowerCase() || s.email?.toLowerCase() === t.user?.toLowerCase())) {
                      matchesBranch = true;
                    }
                    return matchesBranch && isTxInSelectedMonth(t, selectedMonth);
                  });

                  let bRevenue = 0;
                  let bProfit = 0;
                  bTx.forEach(tx => {
                    if (tx.type === 'OUT') {
                      const { txProfit, profitItems } = calculateTxProfit(tx, products, branchInventories);
                      bProfit += txProfit;
                      if (profitItems && profitItems.length > 0) {
                        profitItems.forEach(pi => {
                          bRevenue += (Number(pi.price) || 0) * (Number(pi.qty) || 1);
                        });
                      } else {
                        bRevenue += tx.totalPrice ? Number(tx.totalPrice) : ((Number(tx.price) || 0) * (Number(tx.qty) || 1));
                      }
                    }
                  });

                  return (
                    <tr 
                      key={branch.id} 
                      onClick={() => {
                        setSelectedBranchId(branch.id);
                        setSearchTerm('');
                        setBrandFilter('ALL');
                        setStockFilter('ALL');
                        setSelectedProductIds(new Set());
                      }}
                      className="hover:bg-sky-50/50 transition cursor-pointer"
                    >
                      <td className="px-4 py-3.5 font-bold text-slate-900 min-w-[200px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{branch.name}</span>
                          {isPusat ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                              Pusat
                            </span>
                          ) : (isAdmin || isStaffPusat) ? (
                            branch.branchType === 'DISTRIBUTOR' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-0.5">
                                🏢 Distributor
                              </span>
                            ) : branch.branchType === 'INTERNAL' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-0.5">
                                🏛️ Internal
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                                🏪 Reseller
                              </span>
                            )
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 min-w-[130px]">
                        <div>{branch.pic || branch.managerName || '-'}</div>
                        <div className="text-[10px] text-slate-400">{branch.phone || branch.address || '-'}</div>
                      </td>
                      <td className="px-3 py-3.5 text-center font-bold text-slate-800">
                        {bSKUCount} SKU
                      </td>
                      <td className="px-3 py-3.5 text-center font-extrabold text-slate-800">
                        {bUnitsCount.toLocaleString('id-ID')} Pcs
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                        Rp {bRevenue.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-extrabold text-emerald-700">
                        Rp {bProfit.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1 shadow-2xs">
                          <span>Buka</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: PURGE TRANSACTIONS */}
      {isPurgeConfirmOpen && (
        <ConfirmationModal
          isOpen={isPurgeConfirmOpen}
          title="Purge Seluruh Data Transaksi?"
          message="Tindakan ini akan menghapus seluruh catatan riwayat mutasi transaksi seluruh cabang secara permanen. Pastikan Anda telah mengunduh rekap bulanan sebelum melakukan purge."
          confirmText={isPurging ? "Memproses..." : "Ya, Purge Semua"}
          cancelText="Batal"
          type="danger"
          onConfirm={handlePurgeHistory}
          onCancel={() => setIsPurgeConfirmOpen(false)}
        />
      )}

      {/* MODAL: DETAIL ESTIMASI PROFIT & LAPORAN PENJUALAN */}
      {showProfitDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-emerald-50/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>Rincian & Kalkulasi Estimasi Profit</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Seluruh Cabang
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Periode: <strong className="text-slate-800">{formatMonthLabel(selectedMonth)}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMonthlyRecapCSV}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Export CSV Rekap Bulanan"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Export Excel/CSV</span>
                </button>
                <button
                  onClick={() => setShowProfitDetails(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Summary Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 bg-slate-50/70 border-b border-slate-100 text-center">
              <div className="p-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Transaksi Keluar</span>
                <span className="text-base font-extrabold text-slate-800 mt-0.5 block">{profitDetails.length} Transaksi</span>
              </div>
              <div className="p-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Omset Penjualan</span>
                <span className="text-base font-extrabold text-slate-800 mt-0.5 block">
                  Rp {profitDetails.reduce((sum, tx) => {
                    return sum + (tx.profitItems || []).reduce((itemSum, pi) => itemSum + ((Number(pi.price) || 0) * (Number(pi.qty) || 1)), 0);
                  }, 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Modal (HPP)</span>
                <span className="text-base font-extrabold text-slate-800 mt-0.5 block">
                  Rp {profitDetails.reduce((sum, tx) => {
                    return sum + (tx.profitItems || []).reduce((itemSum, pi) => itemSum + ((Number(pi.costPrice) || 0) * (Number(pi.qty) || 1)), 0);
                  }, 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-3.5 bg-emerald-50/60">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Estimasi Profit</span>
                <span className="text-base font-black text-emerald-700 mt-0.5 block">
                  Rp {profitDetails.reduce((sum, tx) => sum + (Number(tx.txProfit) || 0), 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Table List of Transactions with Profit Breakdown */}
            <div className="overflow-y-auto flex-1 p-4">
              {profitDetails.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Receipt className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                  <p className="text-xs font-semibold">Belum ada transaksi penjualan pada periode {formatMonthLabel(selectedMonth)}.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-3 text-center whitespace-nowrap w-10">No.</th>
                        <th className="px-3.5 py-3 whitespace-nowrap">Waktu & Invoice</th>
                        <th className="px-3.5 py-3 whitespace-nowrap">Produk Terjual</th>
                        <th className="px-3 py-3 text-center whitespace-nowrap">Qty</th>
                        <th className="px-3.5 py-3 text-right whitespace-nowrap">Harga Jual</th>
                        <th className="px-3.5 py-3 text-right whitespace-nowrap">Modal (HPP)</th>
                        <th className="px-3.5 py-3 text-right whitespace-nowrap">Omset</th>
                        <th className="px-3.5 py-3 text-right whitespace-nowrap">Estimasi Profit</th>
                        <th className="px-3 py-3 text-center whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {profitDetails.map((tx, idx) => {
                        const dateStr = formatTime(tx.createdAt || tx.timestamp || tx.date);
                        const items = tx.profitItems || [];
                        
                        return items.map((pi, itemIdx) => {
                          const qty = Number(pi.qty || 1);
                          const sellingPrice = Number(pi.price || 0);
                          const costPrice = Number(pi.costPrice || 0);
                          const omset = sellingPrice * qty;
                          const itemProfit = Number(pi.itemProfit || (omset - (costPrice * qty)));

                          return (
                            <tr key={`${tx.id}-${itemIdx}`} className="hover:bg-slate-50 transition">
                              <td className="px-3 py-3 text-center font-bold text-slate-400">
                                {idx + 1}{items.length > 1 ? `.${itemIdx + 1}` : ''}
                              </td>
                              <td className="px-3.5 py-3">
                                <div className="font-mono font-bold text-slate-900">{tx.invoiceNumber || tx.id || '-'}</div>
                                <div className="text-[10px] text-slate-400">{dateStr}</div>
                              </td>
                              <td className="px-3.5 py-3 font-semibold text-slate-800 min-w-[160px]">
                                <div>{pi.productName || tx.productName || 'Barang'}</div>
                                <div className="font-mono text-[10px] text-slate-400">{pi.sku || '-'}</div>
                              </td>
                              <td className="px-3 py-3 text-center font-bold text-slate-800 whitespace-nowrap">
                                {qty} {pi.unit || 'Pcs'}
                              </td>
                              <td className="px-3.5 py-3 text-right text-slate-700 whitespace-nowrap">
                                Rp {sellingPrice.toLocaleString('id-ID')}
                              </td>
                              <td className="px-3.5 py-3 text-right text-slate-500 whitespace-nowrap">
                                Rp {costPrice.toLocaleString('id-ID')}
                              </td>
                              <td className="px-3.5 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                Rp {omset.toLocaleString('id-ID')}
                              </td>
                              <td className="px-3.5 py-3 text-right font-extrabold text-emerald-600 whitespace-nowrap">
                                + Rp {itemProfit.toLocaleString('id-ID')}
                              </td>
                              <td className="px-3 py-3 text-center whitespace-nowrap">
                                <button
                                  onClick={() => setSelectedDetailTx(tx)}
                                  className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                                  title="Lihat Detail Transaksi & PDF"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowProfitDetails(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Tutup Rincian
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: TRANSACTION DETAIL & PDF */}
      <TransactionDetailModal
        isOpen={Boolean(selectedDetailTx)}
        transaction={selectedDetailTx}
        onClose={() => setSelectedDetailTx(null)}
        products={products}
      />

    </div>
  );
}
