import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  Camera, 
  CheckCircle, 
  Package, 
  AlertCircle, 
  Plus, 
  Minus, 
  FileText, 
  User, 
  Building2, 
  ShoppingBag, 
  Boxes, 
  Trash2, 
  Receipt, 
  CreditCard,
  Truck,
  Store,
  HelpCircle,
  X,
  ShieldCheck,
  Check,
  Send,
  Sparkles,
  PackageCheck,
  CheckCheck,
  XCircle
} from 'lucide-react';

import ScannerModal from './ScannerModal';
import TransactionSuccessModal from './TransactionSuccessModal';
import GlobalSuccessModal from './GlobalSuccessModal';
import ProductSearchPicker from './ProductSearchPicker';
import BundleSearchPicker from './BundleSearchPicker';
import CustomAlertModal from './CustomAlertModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { callCreateStockTransfer } from '../services/cloudFunctionsService';
import { createSparkPlanStockTransfer } from '../services/dataService';


export default function StockOut({ 
  currentUser, 
  products = [], 
  branches = [], 
  bundles = [],
  stockRequests = [],
  initialRequestData = null,
  onClearInitialRequest,
  onRecordMovement,
  onRejectStockRequest 
}) {
  const isBranchStaff = currentUser?.role === 'STAFF_BRANCH';

  // Outbound Mode:
  // For Pusat: 'STOCK_TRANSFER_TO_BRANCH' (Kirim ke Cabang) | 'RETAIL_PCS' (Penjualan Toko Pusat) | 'CUSTOM_BUNDLING' (Bundling Toko Pusat)
  // For Branch: 'RETAIL_PCS' (Penjualan Satuan) | 'CUSTOM_BUNDLING' (Paket Bundling)
  const [outboundMode, setOutboundMode] = useState(
    isBranchStaff ? 'RETAIL_PCS' : 'STOCK_TRANSFER_TO_BRANCH'
  );
  const [rejectSuccessData, setRejectSuccessData] = useState(null);

  // Sales Platform & Type States (Requirement: Unified Sales Section)
  const [salesType, setSalesType] = useState('SINGLE'); // 'SINGLE' | 'BUNDLE'
  const [salesPlatform, setSalesPlatform] = useState('OFFLINE'); // 'OFFLINE' | 'SHOPEE' | 'TOKOPEDIA' | 'TIKTOK'

  // Single Item State (For Retail Pcs / HQ Transfer)
  const [selectedProductId, setSelectedProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [targetBranchId, setTargetBranchId] = useState(branches[0]?.id || '');
  const [customerName, setCustomerName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' | 'TRANSFER' | 'QRIS' | 'MARKETPLACE'
  const [notes, setNotes] = useState('');
  const [user, setUser] = useState(currentUser?.name || (isBranchStaff ? 'Staff Kasir Cabang' : 'Staff Toko/Gudang Pusat'));
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  
  // Alert Modal State
  const [alertModal, setAlertModal] = useState(null); // { title, message, type }

  const showAlert = (title, message, type = 'WARNING') => {
    setAlertModal({ title, message, type });
  };

  // Confirmation & Success Modal States
  const [pendingConfirm, setPendingConfirm] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);
  const [activeFulfillmentRequest, setActiveFulfillmentRequest] = useState(initialRequestData);

  // Rejection State (Supports Single Request or Batch of Requests)
  const [rejectingBatch, setRejectingBatch] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Bundling Dual-Mode State (Preset vs Custom) & Multi-Bundle Cart
  const [bundleMode, setBundleMode] = useState('PRESET'); // 'PRESET' | 'CUSTOM'
  const [selectedBundlePresetId, setSelectedBundlePresetId] = useState('');
  const [bundleName, setBundleName] = useState('');
  const [bundleCustomPrice, setBundleCustomPrice] = useState('');
  const [bundleQty, setBundleQty] = useState(1);
  const [bundleCart, setBundleCart] = useState([]);
  const [bundleItems, setBundleItems] = useState([
    { productId: products[0]?.id || '', qty: 1 }
  ]);

  // Transfer Cart & Multi-Branch Request Filtering
  const [transferCart, setTransferCart] = useState([]);
  const [requestBranchFilter, setRequestBranchFilter] = useState('ALL');

  // Safe pending requests from branches for Pusat/Admin
  const pendingStockRequests = (!isBranchStaff && Array.isArray(stockRequests))
    ? stockRequests.filter(r => r && r.status === 'PENDING')
    : [];

  // Group pending requests by branch
  const pendingBranchesList = React.useMemo(() => {
    const map = new Map();
    pendingStockRequests.forEach(req => {
      const bId = req.branchId || 'UNKNOWN';
      const bName = req.branchName || 'Cabang';
      if (!map.has(bId)) {
        map.set(bId, { id: bId, name: bName, count: 0 });
      }
      map.get(bId).count++;
    });
    return Array.from(map.values());
  }, [pendingStockRequests]);

  const displayedStockRequests = pendingStockRequests.filter(r => {
    if (requestBranchFilter === 'ALL') return true;
    return r.branchId === requestBranchFilter;
  });

  // Toggle request fulfillment: adds requested product directly into transferCart, or removes it if already in cart
  const handleToggleRequestFulfillment = (req) => {
    if (!req) return;

    // Check if this request's item is already in transferCart
    const existingIndex = transferCart.findIndex(item => 
      item.requestId === req.id || 
      (item.productId && req.productId && item.productId === req.productId) || 
      (item.sku && req.sku && item.sku.toLowerCase() === req.sku.toLowerCase())
    );

    if (existingIndex !== -1) {
      // Toggle OFF: Remove from transferCart
      const updatedCart = transferCart.filter((_, idx) => idx !== existingIndex);
      setTransferCart(updatedCart);
      if (updatedCart.length === 0) {
        setActiveFulfillmentRequest(null);
        setSelectedProductId('');
        setQty(1);
        setNotes('');
      }
      return;
    }

    // Check if user is switching to a different branch while transferCart is not empty
    if (targetBranchId && targetBranchId !== req.branchId && transferCart.length > 0) {
      const currentBranchObj = branches.find(b => b.id === targetBranchId);
      const currentBranchName = currentBranchObj?.name || 'Cabang Lain';
      showAlert(
        "Cabang Berbeda ⚠️",
        `List kiriman saat ini untuk "${currentBranchName}". Selesaikan atau kosongkan list terlebih dahulu sebelum merespon permintaan dari "${req.branchName || 'Cabang Lain'}".`,
        "WARNING"
      );
      return;
    }

    // Set branch and switch to transfer mode
    setOutboundMode('STOCK_TRANSFER_TO_BRANCH');
    setTargetBranchId(req.branchId);

    // Find master product from products list
    const targetProduct = products.find(p => 
      p.id === req.productId || 
      (req.sku && p.sku && p.sku.toLowerCase() === req.sku.toLowerCase()) ||
      (req.productName && p.name && p.name.trim().toLowerCase() === req.productName.trim().toLowerCase())
    );

    const maxStock = Number(targetProduct?.currentStock) || 0;
    const reqQty = Number(req.qty) || 1;

    if (maxStock <= 0) {
      showAlert(
        "Stok Pusat Kosong 📦", 
        `Stok produk "${targetProduct?.name || req.productName}" di gudang pusat saat ini 0 Pcs. Anda dapat tetap menambahkannya atau lakukan restok terlebih dahulu.`, 
        "WARNING"
      );
    } else if (reqQty > maxStock) {
      showAlert(
        "Stok Pusat Terbatas ⚠️",
        `Permintaan cabang ${reqQty} Pcs melebihi stok gudang pusat yang tersedia (${maxStock} Pcs). Kuantitas dimasukkan sebesar ${maxStock} Pcs.`,
        "INFO"
      );
    }

    const finalQty = maxStock > 0 ? Math.min(maxStock, reqQty) : reqQty;

    const newItem = {
      requestId: req.id,
      productId: targetProduct ? targetProduct.id : req.productId,
      sku: targetProduct?.sku || req.sku || '-',
      productName: targetProduct?.name || req.productName || 'Produk',
      brand: targetProduct?.brand || req.brand || 'Generic',
      price: Number(targetProduct?.price) || 0,
      currentStock: maxStock,
      qty: finalQty,
      reqNotes: req.notes || ''
    };

    setTransferCart(prev => {
      const existingIdx = prev.findIndex(item => item.productId === newItem.productId);
      if (existingIdx !== -1) {
        const next = [...prev];
        next[existingIdx].qty = finalQty;
        next[existingIdx].requestId = req.id;
        return next;
      }
      return [...prev, newItem];
    });

    setActiveFulfillmentRequest(req);
    setSelectedProductId(newItem.productId);
    setQty(finalQty);

    // Combine notes
    setNotes(prev => {
      const allNotes = [...transferCart.map(i => i.reqNotes), req.notes].filter(Boolean);
      const uniqueNotes = [...new Set(allNotes)];
      return uniqueNotes.length > 0 ? `Memenuhi Permintaan Cabang: ${uniqueNotes.join('; ')}` : (prev || 'Memenuhi Permintaan Cabang');
    });

    // Smooth scroll directly to the transfer cart section (Box 2)
    setTimeout(() => {
      const targetEl = document.getElementById('transfer-cart-section');
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleSelectRequestToFulfill = handleToggleRequestFulfillment;

  const handleCancelFulfillment = () => {
    setActiveFulfillmentRequest(null);
    if (onClearInitialRequest) onClearInitialRequest();
    setSelectedProductId('');
    setNotes('');
    setQty(1);
    setTransferCart([]);
  };

  // Handle incoming initialRequestData (e.g. from notification click)
  useEffect(() => {
    if (initialRequestData) {
      handleToggleRequestFulfillment(initialRequestData);
    }
  }, [initialRequestData]);

  const handleOpenRejectModal = (req) => {
    setRejectingBatch([req]);
    setRejectionReason('');
  };

  const handleOpenRejectBatchModal = (requestsList) => {
    if (!requestsList || requestsList.length === 0) return;
    setRejectingBatch(requestsList);
    setRejectionReason('');
  };

  // Bulk Accept: Put all requests into transferCart at once
  const handleAcceptAllRequests = (requestsToAccept) => {
    if (!requestsToAccept || requestsToAccept.length === 0) return;

    // Verify all requests belong to the same branch
    const uniqueBranchIds = [...new Set(requestsToAccept.map(r => r.branchId))];
    if (uniqueBranchIds.length > 1) {
      showAlert(
        "Pilih Cabang Terlebih Dahulu ⚠️",
        "Terdapat permintaan dari beberapa cabang berbeda. Silakan gunakan filter tab cabang untuk memproses satu cabang per satu pengiriman.",
        "INFO"
      );
      return;
    }

    const targetBId = uniqueBranchIds[0];
    if (targetBranchId && targetBranchId !== targetBId && transferCart.length > 0) {
      const currentBranchObj = branches.find(b => b.id === targetBranchId);
      showAlert(
        "Cabang Berbeda ⚠️",
        `List kiriman saat ini untuk "${currentBranchObj?.name || 'Cabang Lain'}". Selesaikan atau kosongkan list terlebih dahulu sebelum memproses cabang ini.`,
        "WARNING"
      );
      return;
    }

    setOutboundMode('STOCK_TRANSFER_TO_BRANCH');
    setTargetBranchId(targetBId);

    const newItems = [];
    const allNotes = [...transferCart.map(i => i.reqNotes)];

    requestsToAccept.forEach(req => {
      const targetProduct = products.find(p => 
        p.id === req.productId || 
        (req.sku && p.sku && p.sku.toLowerCase() === req.sku.toLowerCase()) ||
        (req.productName && p.name && p.name.trim().toLowerCase() === req.productName.trim().toLowerCase())
      );
      const maxStock = Number(targetProduct?.currentStock) || 0;
      const reqQty = Number(req.qty) || 1;
      const finalQty = maxStock > 0 ? Math.min(maxStock, reqQty) : reqQty;

      newItems.push({
        requestId: req.id,
        productId: targetProduct ? targetProduct.id : req.productId,
        sku: targetProduct?.sku || req.sku || '-',
        productName: targetProduct?.name || req.productName || 'Produk',
        brand: targetProduct?.brand || req.brand || 'Generic',
        price: Number(targetProduct?.price) || 0,
        currentStock: maxStock,
        qty: finalQty,
        reqNotes: req.notes || ''
      });

      if (req.notes) allNotes.push(req.notes);
    });

    setTransferCart(prev => {
      const map = new Map();
      prev.forEach(item => map.set(item.productId, item));
      newItems.forEach(item => map.set(item.productId, item));
      return Array.from(map.values());
    });

    const uniqueNotes = [...new Set(allNotes.filter(Boolean))];
    if (uniqueNotes.length > 0) {
      setNotes(`Memenuhi Permintaan Cabang: ${uniqueNotes.join('; ')}`);
    }

    // Smooth scroll directly to the transfer cart section
    setTimeout(() => {
      const targetEl = document.getElementById('transfer-cart-section');
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  const handleConfirmRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingBatch || rejectingBatch.length === 0) return;
    if (!rejectionReason.trim()) {
      showAlert("Alasan Wajib Diisi ⚠️", "Harap berikan alasan penolakan permintaan stok!", "WARNING");
      return;
    }

    setIsSubmittingReject(true);
    try {
      const savedReason = rejectionReason.trim();
      const ids = rejectingBatch.map(r => r.id);
      const firstReq = rejectingBatch[0];
      const savedBranchName = firstReq.branchName || 'Cabang';
      const totalCount = rejectingBatch.length;

      if (onRejectStockRequest) {
        await onRejectStockRequest(ids, savedReason);
      }
      
      // Remove rejected items from transferCart if they were staged
      setTransferCart(prev => prev.filter(item => !ids.includes(item.requestId)));
      
      // If the currently active form is processing any of these requests, cancel/clear it
      if (activeFulfillmentRequest && ids.includes(activeFulfillmentRequest.id)) {
        handleCancelFulfillment();
      }
      
      const summaryItems = totalCount === 1
        ? `${firstReq.qty} Pcs "${firstReq.productName}"`
        : `${totalCount} Produk (${firstReq.productName}${totalCount > 1 ? ` +${totalCount - 1} lainnya` : ''})`;

      setRejectingBatch(null);
      setRejectionReason('');

      setRejectSuccessData({
        title: totalCount > 1 ? "Penolakan Batch Berhasil Dikirim!" : "Penolakan Berhasil Dikirim!",
        message: `Pemberitahuan penolakan (${totalCount} permintaan stok) beserta alasan resmi telah terkirim ke ${savedBranchName}.`,
        details: [
          { label: "Cabang Pemohon", value: savedBranchName },
          { label: "Total Permintaan", value: `${totalCount} Produk`, highlight: true },
          { label: "Rincian Barang", value: summaryItems },
          { label: "Alasan Penolakan", value: `"${savedReason}"`, highlight: true }
        ]
      });
    } catch (err) {
      showAlert("Gagal Menolak Permintaan", err.message, "ERROR");
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // Batch Barcode Scan Mode State (Requirement 1)
  const [isBatchTransferMode, setIsBatchTransferMode] = useState(false);

  // Multi-Item Sales Cart State (Requirement: Retail & Store Multi-Item Outbound)
  const [salesCart, setSalesCart] = useState([]);

  const selectedProduct = products.find(p => p.id === selectedProductId || p.sku === selectedProductId);
  const currentAvailable = Number(selectedProduct?.currentStock) || 0;
  const isInsufficient = Number(qty) > currentAvailable;

  const isSaleMode = outboundMode === 'RETAIL_PCS' || outboundMode === 'CUSTOM_BUNDLING';
  const isTransferMode = outboundMode === 'STOCK_TRANSFER_TO_BRANCH';

  // Helper: Add product to transfer cart
  const handleAddItemToTransferCart = (product) => {
    if (!product) return;
    const existingIdx = transferCart.findIndex(item => item.productId === product.id);
    const maxStock = Number(product.currentStock) || 0;
    if (existingIdx !== -1) {
      const updated = [...transferCart];
      if (updated[existingIdx].qty + 1 > maxStock) {
        showAlert("Stok Produk Terbatas ⚠️", `Stok produk "${product.name}" di gudang pusat terbatas hanya ${maxStock} Pcs.`, "WARNING");
        return;
      }
      updated[existingIdx].qty += 1;
      setTransferCart(updated);
    } else {
      if (maxStock <= 0) {
        showAlert("Stok Produk Habis 📦", `Stok produk "${product.name}" di gudang pusat habis (0 Pcs).`, "WARNING");
        return;
      }
      setTransferCart([
        ...transferCart,
        {
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          brand: product.brand || 'Generic',
          price: product.price || 0,
          currentStock: maxStock,
          qty: 1
        }
      ]);
    }
  };

  const handleUpdateTransferCartQty = (index, newQty) => {
    const updated = [...transferCart];
    const item = updated[index];
    const maxStock = Number(item.currentStock) || 0;
    const val = Number(newQty);
    if (val > maxStock) {
      showAlert("Kuantitas Melebihi Stok ⚠️", `Kuantitas kirim melebihi stok pusat! Maksimal ${maxStock} Pcs.`, "WARNING");
      updated[index].qty = maxStock;
    } else {
      updated[index].qty = Math.max(1, val);
    }
    setTransferCart(updated);
  };

  const handleRemoveFromTransferCart = (index) => {
    setTransferCart(transferCart.filter((_, i) => i !== index));
  };

  // Helper: Add product to sales cart (Multi-Item POS)
  const handleAddItemToSalesCart = (product) => {
    if (!product) return;
    const maxStock = Number(product.currentStock) || 0;
    const existingIdx = salesCart.findIndex(item => item.productId === product.id);

    if (existingIdx !== -1) {
      const updated = [...salesCart];
      if (updated[existingIdx].qty + 1 > maxStock) {
        showAlert("Stok Produk Terbatas ⚠️", `Stok produk "${product.name}" terbatas hanya ${maxStock} Pcs.`, "WARNING");
        return;
      }
      updated[existingIdx].qty += 1;
      setSalesCart(updated);
    } else {
      if (maxStock <= 0) {
        showAlert("Stok Produk Habis 📦", `Stok produk "${product.name}" saat ini habis (0 Pcs).`, "WARNING");
        return;
      }
      setSalesCart([
        ...salesCart,
        {
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          brand: product.brand || 'Generic',
          price: Number(product.price) || 0,
          costPrice: Number(product.costPrice ?? product.reseller_price ?? product.resellerPrice ?? product.cost_price ?? 0),
          currentStock: maxStock,
          qty: 1
        }
      ]);
    }
  };

  const handleUpdateSalesCartQty = (index, newQty) => {
    const updated = [...salesCart];
    const item = updated[index];
    const maxStock = Number(item.currentStock) || 0;
    const val = Number(newQty);
    if (val > maxStock) {
      showAlert("Kuantitas Melebihi Stok ⚠️", `Kuantitas penjualan melebihi stok fisik yang tersedia! Maksimal ${maxStock} Pcs.`, "WARNING");
      updated[index].qty = maxStock;
    } else {
      updated[index].qty = Math.max(1, val);
    }
    setSalesCart(updated);
  };

  const handleUpdateSalesCartPrice = (index, newPrice) => {
    const updated = [...salesCart];
    updated[index].price = Math.max(0, Number(newPrice) || 0);
    setSalesCart(updated);
  };

  const handleRemoveFromSalesCart = (index) => {
    setSalesCart(salesCart.filter((_, i) => i !== index));
  };

// Helper to parse SKU from raw barcodes or Smart QR URLs
const parseScannedSKU = (text) => {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.includes('http://') || trimmed.includes('https://') || trimmed.includes('sku=') || trimmed.includes('/catalog/') || trimmed.includes('/product/')) {
    try {
      const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      const skuParam = urlObj.searchParams.get('sku');
      if (skuParam) return decodeURIComponent(skuParam).trim();
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && (parts[0] === 'catalog' || parts[0] === 'katalog' || parts[0] === 'product') && parts[1] !== 'list') {
        return decodeURIComponent(parts[1]).trim();
      }
    } catch (e) {
      const match = trimmed.match(/[?&]sku=([^&#]+)/i);
      if (match && match[1]) return decodeURIComponent(match[1]).trim();
    }
  }
  return trimmed;
};

  // Scanner handler
  const handleScanSuccess = (scannedText) => {
    if (!scannedText) return;
    const cleanSku = parseScannedSKU(scannedText).trim().toLowerCase();

    const matched = products.find(p => {
      const pSku = (p.sku || '').trim().toLowerCase();
      const pCode = (p.code || '').trim().toLowerCase();
      const pBarcode = (p.barcode || '').trim().toLowerCase();
      const pId = (p.id || '').trim().toLowerCase();
      return pSku === cleanSku || pCode === cleanSku || pBarcode === cleanSku || pId === cleanSku;
    });

    if (matched) {
      if (outboundMode === 'STOCK_TRANSFER_TO_BRANCH') {
        setIsBatchTransferMode(true);
        handleAddItemToTransferCart(matched);
      } else if (outboundMode === 'CUSTOM_BUNDLING' || salesType === 'BUNDLE') {
        const existingIdx = bundleItems.findIndex(bi => bi.productId === matched.id);
        if (existingIdx !== -1) {
          const updated = [...bundleItems];
          updated[existingIdx].qty = (Number(updated[existingIdx].qty) || 0) + 1;
          setBundleItems(updated);
        } else {
          setBundleItems([...bundleItems, { productId: matched.id, qty: 1 }]);
        }
      } else {
        // Sales Mode (Satuan & Multi-Item POS)
        handleAddItemToSalesCart(matched);
      }
      setIsScannerOpen(false);
    } else {
      showAlert("Produk Tidak Ditemukan 🔍", `Produk dengan SKU/Barcode "${parseScannedSKU(scannedText)}" tidak ditemukan di database.`, "WARNING");
    }
  };


  // Bundling Helper: Add Component Row (Prevent Duplicates)
  const handleAddBundleComponent = () => {
    const unselectedProd = products.find(p => !bundleItems.some(bi => bi.productId === p.id));
    if (!unselectedProd) {
      showAlert(
        "Semua Produk Sudah Dimasukkan 📋",
        "Semua produk katalog yang tersedia telah dimasukkan ke dalam list bundling.",
        "INFO"
      );
      return;
    }
    setBundleItems([...bundleItems, { productId: unselectedProd.id, qty: 1 }]);
  };

  // Bundling Helper: Update Component Row (Auto Merge / Confirm Duplicates)
  const handleUpdateBundleComponent = (index, field, value) => {
    if (field === 'productId') {
      const existingIdx = bundleItems.findIndex((item, i) => i !== index && item.productId === value);
      if (existingIdx !== -1) {
        const prod = products.find(p => p.id === value);
        // Automatically merge +1 Qty to existing row and clear duplicate
        const updated = bundleItems.filter((_, i) => i !== index);
        updated[existingIdx].qty = (Number(updated[existingIdx].qty) || 1) + 1;
        setBundleItems(updated);

        showAlert(
          "Produk Digabungkan 📦",
          `Produk "${prod?.name || 'tersebut'}" sudah ada di dalam list bundling. Kuantitas (+1 Pcs) telah digabungkan secara otomatis ke baris produk yang ada.`,
          "INFO"
        );
        return;
      }
    }
    const updated = [...bundleItems];
    updated[index] = { ...updated[index], [field]: value };
    setBundleItems(updated);
  };


  // Bundling Helper: Remove Component Row
  const handleRemoveBundleComponent = (index) => {
    if (bundleItems.length <= 1) {
      showAlert("Komponen Paket Minimal 1", "Paket bundling minimal harus memiliki 1 komponen produk.", "WARNING");
      return;
    }
    setBundleItems(bundleItems.filter((_, i) => i !== index));
  };

  // Helper: Find product matching item by productId or SKU
  const getProductFromItem = (item) => {
    if (!item) return null;
    return products.find(p => p.id === item.productId || (item.sku && p.sku && p.sku.toLowerCase() === item.sku.toLowerCase()));
  };

  // Helper: Select Bundle Preset
  const handleSelectBundlePreset = (bundleId) => {
    setSelectedBundlePresetId(bundleId);
    if (!bundleId) {
      setBundleName('');
      setBundleCustomPrice('');
      setBundleItems([{ productId: products[0]?.id || '', qty: 1 }]);
      return;
    }
    const b = bundles.find(item => item.id === bundleId);
    if (!b) return;

    const mainEngine = (b.engine_type || b.engine || b.machineCategory || b.kategoriMesin || '').trim();
    let formattedName = b.name || '';
    if (mainEngine && mainEngine.toUpperCase() !== 'UNIVERSAL' && mainEngine.toUpperCase() !== 'ALL' && !formattedName.toLowerCase().includes(mainEngine.toLowerCase())) {
      formattedName = `${formattedName} - ${mainEngine}`;
    }
    setBundleName(formattedName);

    // Suggested price based on branch type:
    // If branch staff and branchType === 'DISTRIBUTOR', use distributor_price
    // If branch staff and branchType === 'RESELLER', use reseller_price
    // Otherwise use selling_price
    const branchType = currentUser?.branchType;
    let suggestedPrice = Number(b.selling_price) || 0;
    if (branchType === 'DISTRIBUTOR' && b.distributor_price) {
      suggestedPrice = Number(b.distributor_price);
    } else if (branchType === 'RESELLER' && b.reseller_price) {
      suggestedPrice = Number(b.reseller_price);
    }
    setBundleCustomPrice(suggestedPrice ? String(suggestedPrice) : '');

    if (Array.isArray(b.items) && b.items.length > 0) {
      const mapped = b.items.map(comp => {
        const found = products.find(p => p.id === comp.productId || (comp.sku && p.sku && p.sku.toLowerCase() === comp.sku.toLowerCase()));
        const compEngine = comp.engine_type || comp.engine || found?.engine_type || found?.machineCategory || '';
        const compDetail = comp.detail || comp.cleanName || comp.rawName || found?.name || '';
        return {
          productId: found?.id || comp.productId || '',
          sku: comp.sku || found?.sku || '-',
          productName: comp.productName || found?.name || compDetail || 'Komponen',
          detail: compDetail,
          engine_type: compEngine,
          engine: compEngine,
          qty: Number(comp.qty) || 1,
          unit: comp.unit || found?.unit || 'Pcs'
        };
      });
      setBundleItems(mapped);
    }
  };

  // Calculate total regular price of bundling components
  const bundleRegularTotal = bundleItems.reduce((sum, item) => {
    const p = getProductFromItem(item);
    return sum + (Number(p?.price) || 0) * (Number(item.qty) || 1);
  }, 0);

  // Check if any component in bundling exceeds stock for current bundle selection
  const isBundleStockInsufficient = bundleItems.some(item => {
    const p = getProductFromItem(item);
    const needed = (Number(item.qty) || 0) * (Math.max(1, Number(bundleQty) || 1));
    return needed > (Number(p?.currentStock) || 0);
  });

  // Handler: Add currently configured bundle to bundleCart
  const handleAddBundleToCart = () => {
    if (!bundleName.trim()) {
      showAlert("Nama Paket Wajib Diisi", "Masukkan nama paket bundling terlebih dahulu!", "WARNING");
      return;
    }
    if (bundleItems.length === 0) {
      showAlert("Komponen Paket Kosong", "Paket bundling harus memiliki minimal 1 komponen produk.", "WARNING");
      return;
    }
    const curQty = Math.max(1, Number(bundleQty) || 1);
    const chosenPreset = selectedBundlePresetId ? bundles.find(b => b.id === selectedBundlePresetId) : null;
    const unitPrice = bundleCustomPrice ? Number(bundleCustomPrice) : bundleRegularTotal;

    // Check stock for this bundle with its quantity
    const insufficientComp = bundleItems.find(item => {
      const p = getProductFromItem(item);
      const neededQty = (Number(item.qty) || 1) * curQty;
      return neededQty > (Number(p?.currentStock) || 0);
    });

    if (insufficientComp) {
      const p = getProductFromItem(insufficientComp);
      showAlert("Stok Komponen Tidak Mencukupi 📦", `Stok komponen "${p?.name || insufficientComp.productName}" tidak mencukupi untuk ${curQty} paket! Tersedia: ${p?.currentStock || 0} Pcs, Diperlukan: ${(Number(insufficientComp.qty) || 1) * curQty} Pcs.`, "WARNING");
      return;
    }

    const newBundle = {
      id: `BC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bundleId: selectedBundlePresetId || null,
      code: chosenPreset?.code || 'PAKET-BUNDLE',
      name: bundleName,
      qty: curQty,
      unitPrice: unitPrice,
      subtotal: unitPrice * curQty,
      items: bundleItems.map(bi => {
        const p = getProductFromItem(bi);
        return {
          productId: bi.productId || p?.id,
          productName: p?.name || bi.productName || 'Komponen',
          sku: p?.sku || bi.sku || '-',
          qty: Number(bi.qty) || 1,
          unit: bi.unit || p?.unit || 'Pcs',
          price: Number(p?.price) || 0,
          costPrice: Number(p?.costPrice ?? p?.reseller_price ?? p?.resellerPrice ?? p?.cost_price ?? 0)
        };
      }),
      bundleMode: bundleMode
    };

    setBundleCart(prev => [...prev, newBundle]);
    showAlert("Paket Ditambahkan ✅", `Paket "${bundleName}" (${curQty} set) berhasil dimasukkan ke daftar nota penjualan bundling.`, "SUCCESS");
  };

  const handleUpdateBundleCartQty = (index, newQty) => {
    if (newQty <= 0) {
      handleRemoveBundleFromCart(index);
      return;
    }
    setBundleCart(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          qty: newQty,
          subtotal: updated[index].unitPrice * newQty
        };
      }
      return updated;
    });
  };

  const handleRemoveBundleFromCart = (index) => {
    setBundleCart(prev => prev.filter((_, i) => i !== index));
  };

  const getPlatformLabel = (platformCode) => {
    switch (platformCode) {
      case 'SHOPEE': return 'Shopee';
      case 'TOKOPEDIA': return 'Tokopedia';
      case 'TIKTOK': return 'TikTok Shop';
      case 'OFFLINE':
      case 'OTHER':
      default: return 'Toko Fisik (Offline)';
    }
  };

  // Step 1: Open Confirmation Modal Before Processing Outbound Sale / Single Transfer
  const handlePrepareSingleSubmit = (e) => {
    e.preventDefault();

    if (isTransferMode) {
      // Pusat Transfer to Branch
      if (!selectedProduct) {
        showAlert("Produk Belum Dipilih", "Silakan pilih produk terlebih dahulu!", "WARNING");
        return;
      }
      if (Number(qty) <= 0) {
        showAlert("Kuantitas Tidak Valid", "Jumlah kuantitas (Pcs) harus lebih besar dari 0!", "WARNING");
        return;
      }
      if (isInsufficient) {
        showAlert("Stok Tidak Mencukupi 📦", `Stok tidak mencukupi! Stok tersedia hanya ${currentAvailable} Pcs.`, "WARNING");
        return;
      }

      const targetBranch = branches.find(b => b.id === targetBranchId);
      const targetBranchName = targetBranch?.name || 'Cabang Tujuan';
      const sjNo = invoiceNumber || `SJ-HQ-${Math.floor(1000 + Math.random() * 9000)}`;

      const finalNotes = notes && notes.trim() ? notes.trim() : '';
      const payload = {
        productId: selectedProduct.id,
        sku: selectedProduct.sku,
        productName: selectedProduct.name,
        type: 'OUT',
        qty: Number(qty),
        unit: 'Pcs',
        notes: finalNotes,
        user: user || currentUser?.name || 'Staff',
        transactionType: 'STOCK_TRANSFER_TO_BRANCH',
        targetBranchId: targetBranchId,
        targetBranchName: targetBranchName,
        deliveryNote: sjNo
      };

      setPendingConfirm(payload);
      return;
    }

    // ==========================================
    // RETAIL SALES (MULTI-ITEM LIST CART)
    // ==========================================
    if (salesCart.length === 0) {
      // Fallback: If user picked via single product picker
      if (selectedProduct) {
        if (Number(qty) <= 0) {
          showAlert("Kuantitas Tidak Valid", "Jumlah kuantitas (Pcs) harus lebih besar dari 0!", "WARNING");
          return;
        }
        if (isInsufficient) {
          showAlert("Stok Tidak Mencukupi 📦", `Stok tidak mencukupi! Stok tersedia hanya ${currentAvailable} Pcs.`, "WARNING");
          return;
        }
        // Auto add to salesCart and continue
        const item = {
          productId: selectedProduct.id,
          sku: selectedProduct.sku,
          productName: selectedProduct.name,
          brand: selectedProduct.brand || 'Generic',
          price: Number(selectedProduct.price) || 0,
          costPrice: Number(selectedProduct.costPrice ?? selectedProduct.reseller_price ?? selectedProduct.resellerPrice ?? selectedProduct.cost_price ?? 0),
          currentStock: currentAvailable,
          qty: Number(qty)
        };
        salesCart.push(item);
      } else {
        showAlert("Daftar Barang Masih Kosong 🛒", "Silakan pilih atau scan minimal 1 barang untuk dijual!", "WARNING");
        return;
      }
    }

    // Validate stock for each item in cart
    const insufficientItem = salesCart.find(i => (Number(i.qty) || 0) > (Number(i.currentStock) || 0));
    if (insufficientItem) {
      showAlert("Stok Tidak Mencukupi 📦", `Stok produk "${insufficientItem.productName}" tidak mencukupi! Tersedia: ${insufficientItem.currentStock} Pcs, Diminta: ${insufficientItem.qty} Pcs.`, "WARNING");
      return;
    }

    // Validate cost price for each item in cart
    const underpricedItem = salesCart.find(i => Number(i.price) < Number(i.costPrice));
    if (underpricedItem) {
      showAlert(
        "Harga Jual Terlalu Rendah ⚠️", 
        `Harga jual untuk "${underpricedItem.productName}" (Rp ${Number(underpricedItem.price).toLocaleString('id-ID')}) berada di bawah harga modal (Rp ${Number(underpricedItem.costPrice).toLocaleString('id-ID')}). Transaksi ditolak.`, 
        "ERROR"
      );
      return;
    }

    const platformName = getPlatformLabel(salesPlatform);
    const defaultPrefix = salesPlatform !== 'OFFLINE' ? `${salesPlatform}-` : 'NOTA-';
    const notaNo = invoiceNumber || `${defaultPrefix}${Math.floor(100000 + Math.random() * 900000)}`;
    const locationLabel = isBranchStaff ? currentUser?.branchName || 'Cabang' : 'Pusat';
    
    const totalPcs = salesCart.reduce((acc, i) => acc + (Number(i.qty) || 0), 0);
    const grandTotal = salesCart.reduce((acc, i) => acc + ((Number(i.price) || 0) * (Number(i.qty) || 0)), 0);
    const finalNotes = notes && notes.trim() ? notes.trim() : '';

    const payload = {
      productId: salesCart.length === 1 ? salesCart[0].productId : 'MULTI-ITEM-SALE',
      sku: salesCart.length === 1 ? salesCart[0].sku : 'MULTI-ITEM',
      productName: salesCart.length === 1 ? salesCart[0].productName : `[PENJUALAN] ${salesCart.length} Jenis Barang`,
      type: 'OUT',
      branchId: isBranchStaff ? currentUser?.branchId : undefined,
      qty: totalPcs,
      unit: 'Pcs',
      notes: finalNotes,
      user: user || currentUser?.name || 'Staff',
      transactionType: 'RETAIL_PCS',
      salesPlatform: salesPlatform,
      platformName: platformName,
      customerName: customerName || 'Walk-in Customer',
      invoiceNumber: notaNo,
      paymentMethod: paymentMethod,
      totalPrice: grandTotal,
      isMultiItem: true,
      items: salesCart.map(item => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        brand: item.brand,
        price: Number(item.price) || 0,
        costPrice: Number(item.costPrice ?? item.reseller_price ?? item.resellerPrice ?? item.cost_price ?? 0),
        qty: Number(item.qty) || 1
      }))
    };

    setPendingConfirm(payload);
  };

  // Step 1B: Prepare Batch Scan Transfer Submit
  const handlePrepareBatchTransferSubmit = (e) => {
    e.preventDefault();
    if (transferCart.length === 0) {
      showAlert("List Barang Kosong 📋", "Keranjang mutasi transfer masih kosong! Silakan scan atau pilih produk terlebih dahulu.", "WARNING");
      return;
    }
    const targetBranch = branches.find(b => b.id === targetBranchId);
    const targetBranchName = targetBranch?.name || 'Cabang Tujuan';
    const sjNo = invoiceNumber || `SJ-HQ-${Math.floor(1000 + Math.random() * 9000)}`;

    const payload = {
      productId: 'BATCH-TRANSFER',
      sku: 'MULTI-TRANSFER',
      productName: `[MULTI-TRANSFER] ${transferCart.length} Jenis Produk`,
      type: 'OUT',
      qty: transferCart.reduce((acc, i) => acc + Number(i.qty), 0),
      unit: 'Pcs',
      notes: notes && notes.trim() ? notes.trim() : '',
      user: user || currentUser?.name || 'Staff',
      transactionType: 'STOCK_TRANSFER_TO_BRANCH',
      targetBranchId: targetBranchId,
      targetBranchName: targetBranchName,
      deliveryNote: sjNo,
      isBatchTransfer: true,
      batchItems: transferCart
    };

    setPendingConfirm(payload);
  };

  // Step 2: User Confirmed -> Execute and Show Success Pop-Up
  const handleExecuteConfirmed = async () => {
    if (!pendingConfirm) return;
    setIsProcessing(true);

    try {
      if (pendingConfirm.transactionType === 'STOCK_TRANSFER_TO_BRANCH') {
        const isBatch = pendingConfirm.isBatchTransfer && pendingConfirm.batchItems;
        const items = isBatch ? pendingConfirm.batchItems : [pendingConfirm];
        
        // 1. Panggil createSparkPlanStockTransfer (which handles items array properly with tier pricing & limits)
        const deliveryNote = pendingConfirm.deliveryNote || `SJ-HQ-${Date.now().toString().slice(-6)}`;
        
        await createSparkPlanStockTransfer({
          items: items.map(i => ({ ...i, qty: Number(i.qty) || 1 })),
          toBranchId: pendingConfirm.targetBranchId,
          deliveryNote: deliveryNote,
          shippingNotes: pendingConfirm.notes ? `${pendingConfirm.notes} | SJ: ${deliveryNote}` : `SJ: ${deliveryNote}`
        }, currentUser?.uid || 'admin');

        // 3. Catat di Audit Log Frontend (onRecordMovement)
        for (const item of items) {
          await onRecordMovement({
            ...item,
            type: 'OUT',
            transactionType: 'STOCK_TRANSFER_TO_BRANCH',
            targetBranchId: pendingConfirm.targetBranchId,
            targetBranchName: pendingConfirm.targetBranchName,
            deliveryNote: deliveryNote,
            notes: pendingConfirm.notes,
            user: pendingConfirm.user,
            skipMasterProductUpdate: isBranchStaff
          });
        }
        if (isBatch) setTransferCart([]);
      } else if (pendingConfirm.isMultiItem && pendingConfirm.items) {
        await onRecordMovement({
          ...pendingConfirm,
          items: pendingConfirm.items,
          skipMasterProductUpdate: isBranchStaff
        });
        setSalesCart([]);
      } else if (pendingConfirm.transactionType === 'CUSTOM_BUNDLING' && pendingConfirm.bundleItems) {
        await onRecordMovement({
          ...pendingConfirm,
          isBundling: true,
          items: pendingConfirm.bundleItems,
          skipMasterProductUpdate: isBranchStaff
        });
        setBundleCart([]);
        setBundleQty(1);
      } else {
        await onRecordMovement({
          ...pendingConfirm,
          skipMasterProductUpdate: isBranchStaff
        });
      }

      // Trigger Success Receipt Modal
      setSuccessModalData({
        ...pendingConfirm,
        items: pendingConfirm.isBatchTransfer 
          ? pendingConfirm.batchItems 
          : (pendingConfirm.isBundling ? (pendingConfirm.bundles || [pendingConfirm]) : (pendingConfirm.items || [pendingConfirm]))
      });

      // Reset form states
      setQty(1);
      setCustomerName('');
      setInvoiceNumber('');
      setNotes('');
      setBundleName('');
      setBundleCustomPrice('');
      setBundleQty(1);
      setSelectedBundlePresetId('');
      setBundleItems([{ productId: products[0]?.id || '', qty: 1 }]);
      setPendingConfirm(null);
      setActiveFulfillmentRequest(null);
      if (onClearInitialRequest) onClearInitialRequest();
    } catch (err) {
      showAlert("Gagal Memproses Transaksi", err.message, "ERROR");
    } finally {
      setIsProcessing(false);
    }
  };


  // Step 1: Open Confirmation Modal for Bundling Sale
  const handlePrepareBundlingSubmit = (e) => {
    e.preventDefault();

    let activeBundles = [...bundleCart];

    // If bundleCart is empty, use the bundle currently configured in the form
    if (activeBundles.length === 0) {
      if (!bundleName.trim()) {
        showAlert("Nama Paket Wajib Diisi", "Masukkan nama paket bundling terlebih dahulu!", "WARNING");
        return;
      }
      if (bundleItems.length === 0) {
        showAlert("Komponen Paket Kosong", "Paket bundling harus memiliki minimal 1 komponen produk.", "WARNING");
        return;
      }
      const curQty = Math.max(1, Number(bundleQty) || 1);
      const chosenPreset = selectedBundlePresetId ? bundles.find(b => b.id === selectedBundlePresetId) : null;
      const unitPrice = bundleCustomPrice ? Number(bundleCustomPrice) : bundleRegularTotal;

      activeBundles = [{
        id: `BC-${Date.now()}`,
        bundleId: selectedBundlePresetId || null,
        code: chosenPreset?.code || 'PAKET-BUNDLE',
        name: bundleName,
        qty: curQty,
        unitPrice: unitPrice,
        subtotal: unitPrice * curQty,
        items: bundleItems.map(bi => {
          const p = getProductFromItem(bi);
          return {
            productId: bi.productId || p?.id,
            productName: p?.name || bi.productName || 'Komponen',
            sku: p?.sku || bi.sku || '-',
            qty: Number(bi.qty) || 1,
            unit: bi.unit || p?.unit || 'Pcs',
            price: Number(p?.price) || 0,
            costPrice: Number(p?.costPrice ?? p?.reseller_price ?? p?.resellerPrice ?? p?.cost_price ?? 0)
          };
        }),
        bundleMode: bundleMode
      }];
    }

    // Validate combined stock requirement across all bundles in activeBundles
    const componentRequirementMap = new Map();
    for (const b of activeBundles) {
      for (const comp of b.items) {
        const p = products.find(prod => prod.id === comp.productId || (comp.sku && prod.sku && prod.sku.toLowerCase() === comp.sku.toLowerCase()));
        const pId = p ? p.id : comp.productId;
        const totalNeeded = (Number(comp.qty) || 1) * b.qty;
        const prev = componentRequirementMap.get(pId) || { needed: 0, product: p, name: comp.productName };
        componentRequirementMap.set(pId, {
          needed: prev.needed + totalNeeded,
          product: p || prev.product,
          name: comp.productName || prev.name
        });
      }
    }

    for (const [_, info] of componentRequirementMap.entries()) {
      const currentStock = Number(info.product?.currentStock) || 0;
      if (info.needed > currentStock) {
        showAlert(
          "Stok Komponen Tidak Mencukupi 📦", 
          `Total stok komponen "${info.name}" tidak mencukupi untuk seluruh paket dalam nota! Tersedia: ${currentStock} Pcs, Diperlukan: ${info.needed} Pcs.`, 
          "WARNING"
        );
        return;
      }
    }

    const totalBundleSets = activeBundles.reduce((acc, b) => acc + Number(b.qty), 0);
    const grandTotal = activeBundles.reduce((acc, b) => acc + Number(b.subtotal), 0);
    const platformName = getPlatformLabel(salesPlatform);
    const defaultPrefix = salesPlatform !== 'OFFLINE' ? `${salesPlatform}-BUNDLE-` : 'NOTA-BUNDLE-';
    const notaNo = invoiceNumber || `${defaultPrefix}${Math.floor(100000 + Math.random() * 900000)}`;
    const locationLabel = isBranchStaff ? currentUser?.branchName || 'Cabang' : 'Pusat';

    // Combine all components for physical stock deduction in Firestore
    const allComponentsCombined = [];
    activeBundles.forEach(b => {
      b.items.forEach(comp => {
        const totalCompQty = (Number(comp.qty) || 1) * b.qty;
        const existing = allComponentsCombined.find(c => c.productId === comp.productId);
        if (existing) {
          existing.qty += totalCompQty;
        } else {
          allComponentsCombined.push({
            ...comp,
            qty: totalCompQty
          });
        }
      });
    });

    const finalNotes = notes && notes.trim() ? notes.trim() : '';

    const payload = {
      productId: activeBundles.length === 1 ? (activeBundles[0].bundleId ? `BUNDLE-${activeBundles[0].bundleId}` : 'BUNDLE-CUSTOM') : 'MULTI-BUNDLE-SALE',
      sku: activeBundles.length === 1 ? (activeBundles[0].code || 'PAKET-BUNDLE') : 'MULTI-BUNDLE',
      productName: activeBundles.length === 1 ? `[BUNDLING] ${activeBundles[0].name}` : `[BUNDLING] ${activeBundles.length} Jenis Paket (${totalBundleSets} Set)`,
      bundleId: activeBundles.length === 1 ? activeBundles[0].bundleId : null,
      bundleQty: totalBundleSets,
      bundles: activeBundles.map(b => ({
        sku: b.code,
        code: b.code,
        productName: `[BUNDLING] ${b.name}`,
        name: b.name,
        qty: b.qty,
        unit: 'Paket',
        price: b.unitPrice,
        totalPrice: b.subtotal,
        subtotal: b.subtotal,
        notes: b.items ? b.items.map(c => `${c.qty * b.qty}x ${c.productName}`).join(', ') : '',
        items: b.items
      })),
      bundleItems: allComponentsCombined,
      type: 'OUT',
      branchId: isBranchStaff ? currentUser?.branchId : undefined,
      qty: totalBundleSets,
      unit: 'Paket',
      notes: finalNotes,
      user: user || currentUser?.name || 'Staff',
      transactionType: 'CUSTOM_BUNDLING',
      isBundling: true,
      salesPlatform: salesPlatform,
      platformName: platformName,
      customerName: customerName || 'Walk-in Customer',
      invoiceNumber: notaNo,
      paymentMethod: paymentMethod,
      totalPrice: grandTotal
    };

    setPendingConfirm(payload);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold flex-shrink-0">
          <ArrowUpRight className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {isBranchStaff ? 'Penjualan Barang Cabang (Outbound)' : 'Laporan Barang Keluar (Outbound Pusat)'}
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isTransferMode
                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {isTransferMode ? 'Mutasi Pusat -> Cabang' : 'Penjualan Langsung Toko'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isBranchStaff 
              ? 'Cabang hanya melayani pengeluaran berupa transaksi penjualan ke pembeli (Satuan Pcs atau Paket Bundling).' 
              : 'Pusat dapat melakukan pengiriman stok mutasi ke cabang atau penjualan langsung di toko fisik pusat.'}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PUSAT ONLY: PENDING BRANCH STOCK REQUESTS NOTIFICATION BANNER & CARDS     */}
      {/* ========================================================================= */}
      {!isBranchStaff && pendingStockRequests.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-white border-2 border-indigo-200 p-4 sm:p-5 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-indigo-950">
                  Permintaan Kiriman Stok dari Cabang ({pendingStockRequests.length} Menunggu Respon)
                </h3>
                <p className="text-[11px] text-indigo-700">
                  Klik tombol <strong>Respon & Kirimkan</strong> untuk langsung mengisi form mutasi pengiriman secara otomatis.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-extrabold rounded-full animate-pulse">
              {pendingStockRequests.length} Request Baru
            </span>
          </div>

          {/* Multi-Branch Filter Tabs */}
          {pendingBranchesList.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 border-t border-indigo-100/80">
              <span className="text-[11px] font-bold text-indigo-900 shrink-0 mr-1">Filter Cabang:</span>
              <button
                type="button"
                onClick={() => setRequestBranchFilter('ALL')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  requestBranchFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-indigo-900 border border-indigo-200 hover:bg-indigo-50'
                }`}
              >
                Semua Cabang ({pendingStockRequests.length})
              </button>
              {pendingBranchesList.map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setRequestBranchFilter(b.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    requestBranchFilter === b.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-indigo-900 border border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  <span>🏢 {b.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    requestBranchFilter === b.id ? 'bg-indigo-800 text-white' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {b.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Review & Bulk Action Toolbar for Branch Requests */}
          {displayedStockRequests.length > 0 && (() => {
            const inCartCount = displayedStockRequests.filter(req => 
              transferCart.some(item => item.requestId === req.id || (item.productId && req.productId && item.productId === req.productId))
            ).length;
            const notInCartRequests = displayedStockRequests.filter(req => 
              !transferCart.some(item => item.requestId === req.id || (item.productId && req.productId && item.productId === req.productId))
            );
            const isSingleBranchScope = pendingBranchesList.length <= 1 || requestBranchFilter !== 'ALL';
            const scopeBranchName = isSingleBranchScope 
              ? (pendingBranchesList.find(b => b.id === requestBranchFilter)?.name || displayedStockRequests[0]?.branchName || 'Cabang')
              : 'Semua Cabang';

            return (
              <div className="bg-white/95 backdrop-blur-xs border border-indigo-200/90 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  <span className="text-xs font-bold text-slate-800">
                    Opsi Cepat {isSingleBranchScope ? `(${scopeBranchName})` : ''}:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {inCartCount > 0 ? (
                      <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {inCartCount} dipilih ke kiriman, {notInCartRequests.length} belum
                      </span>
                    ) : (
                      <span>{displayedStockRequests.length} barang menunggu respon</span>
                    )}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Terima Seluruh */}
                  <button
                    type="button"
                    onClick={() => handleAcceptAllRequests(displayedStockRequests)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                    title="Masukkan seluruh barang permintaan cabang ini ke dalam list pengiriman"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>✓ Terima Seluruh ({displayedStockRequests.length})</span>
                  </button>

                  {/* Tolak Sisa (Muncul jika ada sebagian yang sudah dipilih dan ada yang belum) */}
                  {inCartCount > 0 && notInCartRequests.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleOpenRejectBatchModal(notInCartRequests)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                      title="Tolak sisa barang yang tidak dimasukkan ke list kiriman"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>✕ Tolak Sisa ({notInCartRequests.length})</span>
                    </button>
                  )}

                  {/* Tolak Seluruh */}
                  <button
                    type="button"
                    onClick={() => handleOpenRejectBatchModal(displayedStockRequests)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Tolak seluruh permohonan cabang ini dengan alasan resmi"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>✕ Tolak Seluruh ({displayedStockRequests.length})</span>
                  </button>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {displayedStockRequests.map(req => {
              const isCurrentlySelected = transferCart.some(item => 
                item.requestId === req.id || 
                (item.productId && req.productId && item.productId === req.productId) || 
                (item.sku && req.sku && item.sku.toLowerCase() === req.sku.toLowerCase())
              );
              return (
                <div 
                  key={req.id} 
                  className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 ${
                    isCurrentlySelected 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400/40' 
                      : 'bg-white text-slate-800 border-indigo-100 hover:border-indigo-300'
                  }`}
                >
                  <div>
                    {/* Top Row: Branch Badge, Time, and Top-Right Close Button */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isCurrentlySelected ? 'bg-indigo-800 text-indigo-100' : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {req.branchName}
                        </span>
                        {isCurrentlySelected && (
                          <span className="px-2 py-0.2 rounded text-[9px] font-extrabold bg-emerald-500 text-white uppercase tracking-wider">
                            ✓ Dalam List
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-semibold ${isCurrentlySelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {new Date(req.requestedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        
                        {/* Tanda silang (✕) di pojok kanan atas tiap request yang sedang aktif */}
                        {isCurrentlySelected && (
                          <button
                            type="button"
                            onClick={() => handleToggleRequestFulfillment(req)}
                            className="p-1 rounded-md text-white hover:text-rose-200 bg-white/20 hover:bg-rose-500 transition cursor-pointer flex items-center justify-center"
                            title="Batal pilih request ini dari list kiriman"
                          >
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 className="font-bold text-sm mt-2 line-clamp-1">{req.productName}</h4>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span>SKU: <strong className="font-mono">{req.sku}</strong></span>
                      <span>•</span>
                      <span className={`font-extrabold ${isCurrentlySelected ? 'text-amber-200' : 'text-slate-900'}`}>
                        Diminta: {req.qty} Pcs
                      </span>
                    </div>
                    {req.notes && (
                      <p className={`text-[11px] mt-1 italic line-clamp-2 ${isCurrentlySelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                        "{req.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenRejectModal(req)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        isCurrentlySelected
                          ? 'bg-indigo-800 text-rose-300 hover:bg-rose-900'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                      title="Tolak Permintaan dengan Alasan"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Tolak</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleRequestFulfillment(req)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        isCurrentlySelected 
                          ? 'bg-white text-indigo-900 shadow-xs hover:bg-indigo-50' 
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>{isCurrentlySelected ? '✓ Sedang Diproses (Klik Batal)' : '🚚 Respon & Kirimkan'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-5">
        
        {/* OUTBOUND MODE SELECTOR (2 MAIN OPTIONS) */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Jenis Pengeluaran (Outbound)
          </label>
          <div className={`grid gap-2.5 ${!isBranchStaff ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            
            {/* OPSI 1: MUTASI KE CABANG (PUSAT ONLY) */}
            {!isBranchStaff && (
              <button
                type="button"
                onClick={() => setOutboundMode('STOCK_TRANSFER_TO_BRANCH')}
                className={`p-3 sm:p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
                  outboundMode === 'STOCK_TRANSFER_TO_BRANCH'
                    ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20 text-indigo-950 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 ${outboundMode === 'STOCK_TRANSFER_TO_BRANCH' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'}`}>
                  <Truck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs sm:text-sm truncate">Kirim ke Cabang</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full flex-shrink-0">Mutasi</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">Pengiriman stok pusat ke cabang</p>
                </div>
              </button>
            )}

            {/* OPSI 2: PENJUALAN PRODUK */}
            <button
              type="button"
              onClick={() => setOutboundMode('RETAIL_PCS')}
              className={`p-3 sm:p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
                outboundMode === 'RETAIL_PCS'
                  ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className={`p-2 rounded-xl flex-shrink-0 ${outboundMode === 'RETAIL_PCS' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'}`}>
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs sm:text-sm truncate">Penjualan Produk</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full flex-shrink-0">Kasir / Toko</span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">Toko offline & pesanan online</p>
              </div>
            </button>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: MUTASI KE CABANG (STOCK TRANSFER)                                */}
        {/* ========================================================================= */}
        {outboundMode === 'STOCK_TRANSFER_TO_BRANCH' && (
          <div className="space-y-4 pt-2">
            <form onSubmit={handlePrepareBatchTransferSubmit} className="space-y-4">
              
              {/* Step 1: Search & Pick Products to Transfer Staging List */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    1. Pilih / Cari Produk ke Dalam List Transfer Cabang
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Scan Barcode</span>
                    </button>
                  </div>
                </div>

                <ProductSearchPicker
                  products={products}
                  selectedProductId=""
                  onSelectProduct={(prod) => handleAddItemToTransferCart(prod)}
                  placeholder="🔍 Ketik Nama Produk, SKU, Merk, atau Kategori untuk menambah ke list transfer..."
                  label=""
                  showStockInfo={true}
                />
              </div>

              {/* Step 2: Transfer Staging Cart Table with Inline Qty Input */}
              <div id="transfer-cart-section" className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                    📋 List Barang Kiriman Cabang ({transferCart.length} Jenis Produk Dipilih)
                  </span>
                  {transferCart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTransferCart([])}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-800"
                    >
                      Kosongkan List
                    </button>
                  )}
                </div>

                {transferCart.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 space-y-2">
                    <Boxes className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                    <p className="text-xs font-medium">Belum ada barang yang dipilih ke dalam list kiriman cabang.</p>
                    <p className="text-[11px] text-slate-400">Gunakan kotak pencarian atau scanner barcode di atas untuk memilih barang.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100/80 text-slate-600 font-semibold uppercase border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5 min-w-[200px]">Produk</th>
                          <th className="px-3 py-2.5 whitespace-nowrap min-w-[140px]">SKU & Merk</th>
                          <th className="px-3 py-2.5 text-center whitespace-nowrap min-w-[130px]">Stok Gudang Pusat</th>
                          <th className="px-3 py-2.5 text-center whitespace-nowrap min-w-[140px]">Qty Kirim (Pcs)</th>
                          <th className="px-4 py-2.5 text-right whitespace-nowrap min-w-[70px]">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transferCart.map((item, idx) => (
                          <tr key={item.productId} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-900 min-w-[200px]">
                              <span className="leading-snug">{item.productName}</span>
                            </td>
                            <td className="px-3 py-3 text-[11px] whitespace-nowrap">
                              <span className="font-mono text-slate-600 font-bold">{item.sku}</span>
                              <span className="mx-1 text-slate-300">|</span>
                              <span className="text-indigo-600 font-bold px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100">{item.brand || 'Generic'}</span>
                            </td>
                            <td className="px-3 py-3 text-center whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 whitespace-nowrap inline-block">
                                {item.currentStock} Pcs
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateTransferCartQty(idx, (Number(item.qty) || 1) - 1)}
                                  className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center justify-center transition active:scale-95"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max={item.currentStock}
                                  value={item.qty}
                                  onChange={(e) => handleUpdateTransferCartQty(idx, Math.max(1, Number(e.target.value)))}
                                  className="w-16 py-1 bg-indigo-50 border border-indigo-300 rounded-lg text-center font-extrabold text-indigo-950 text-xs focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateTransferCartQty(idx, (Number(item.qty) || 1) + 1)}
                                  className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center justify-center transition active:scale-95"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveFromTransferCart(idx)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition cursor-pointer"
                                title="Hapus dari list"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Step 3: Destination Branch & Delivery Note Header */}
              <div className="space-y-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  <span>Tujuan Pengiriman & Surat Jalan Mutasi</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Pilih Cabang Penerima *
                    </label>
                    <select
                      required
                      value={targetBranchId}
                      onChange={(e) => setTargetBranchId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.address || 'Alamat Cabang'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      No. Surat Jalan Resmi (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: SJ-HQ-2026-001"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Catatan Pengiriman (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Titipan pengiriman darurat via armada truk A"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Batch Transfer */}
              <button
                type="submit"
                disabled={transferCart.length === 0}
                className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                  transferCart.length === 0 
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Kirim Mutasi Stok ke Cabang ({transferCart.length} Jenis Produk • Total {transferCart.reduce((acc, i) => acc + (Number(i.qty) || 0), 0)} Pcs)</span>
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: PENJUALAN PRODUK TERPADU (SATUAN & BUNDLING VIA MULTI-PLATFORM)  */}
        {/* ========================================================================= */}
        {outboundMode === 'RETAIL_PCS' && (
          <div className="space-y-5 pt-2">
            
            {/* SUB-HEADER: PLATFORM & FORMAT SELECTION CONTAINER */}
            <div className="p-3 sm:p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
              
              {/* PLATFORM PENJUALAN SELECTOR */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-950">
                    Platform Penjualan
                  </label>
                  <span className="text-[10px] font-bold text-emerald-800 bg-white/90 px-2 py-0.5 rounded-md border border-emerald-200">
                    {getPlatformLabel(salesPlatform)}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  
                  {/* Toko Fisik / Offline */}
                  <button
                    type="button"
                    onClick={() => setSalesPlatform('OFFLINE')}
                    title="Toko Fisik / Offline"
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                      salesPlatform === 'OFFLINE'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-900/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Store className={`w-4 h-4 ${salesPlatform === 'OFFLINE' ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span className="text-[10px] sm:text-xs">Toko</span>
                  </button>

                  {/* Shopee */}
                  <button
                    type="button"
                    onClick={() => setSalesPlatform('SHOPEE')}
                    title="Shopee"
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                      salesPlatform === 'SHOPEE'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-xs ring-2 ring-orange-500/20'
                        : 'bg-white text-orange-700 border-orange-200 hover:bg-orange-50'
                    }`}
                  >
                    <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                      <path d="M19 7h-2.5V5.5A4.5 4.5 0 0012 1a4.5 4.5 0 00-4.5 4.5V7H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2zm-9.5-1.5A2.5 2.5 0 0112 3a2.5 2.5 0 012.5 2.5V7h-5V5.5zm4.8 8.8c0 1.5-1.1 2.5-2.7 2.5-1.3 0-2.3-.7-2.6-1.7l1.4-.6c.2.6.7 1 1.2 1 .7 0 1.2-.4 1.2-1 0-.6-.4-.9-1.4-1.3-1.6-.6-2.3-1.3-2.3-2.4 0-1.4 1.1-2.4 2.5-2.4 1.1 0 2 .5 2.4 1.4l-1.3.6c-.2-.5-.6-.8-1.1-.8-.6 0-1 .4-1 .9 0 .5.3.8 1.3 1.2 1.7.6 2.4 1.3 2.4 2.6z"/>
                    </svg>
                    <span className="text-[10px] sm:text-xs">Shopee</span>
                  </button>

                  {/* Tokopedia */}
                  <button
                    type="button"
                    onClick={() => setSalesPlatform('TOKOPEDIA')}
                    title="Tokopedia"
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                      salesPlatform === 'TOKOPEDIA'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.02 10.02 0 0022 12c0-5.52-4.48-10-10-10z"/>
                    </svg>
                    <span className="text-[10px] sm:text-xs">Tokopedia</span>
                  </button>

                  {/* TikTok Shop */}
                  <button
                    type="button"
                    onClick={() => setSalesPlatform('TIKTOK')}
                    title="TikTok Shop"
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                      salesPlatform === 'TIKTOK'
                        ? 'bg-slate-950 text-white border-slate-950 shadow-xs ring-2 ring-slate-900/20'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.868 2.896 2.896 0 0 1-2.892-2.868 2.896 2.896 0 0 1 2.892-2.869c.356 0 .695.068 1.008.192V9.45a6.31 6.31 0 0 0-1.008-.08C5.972 9.37 3 12.339 3 15.872 3 19.405 5.972 22.37 9.491 22.37c3.518 0 6.474-2.857 6.474-6.39V8.898a8.21 8.21 0 0 0 4.887 1.587V7.04a4.814 4.814 0 0 1-1.263-.354z"/>
                    </svg>
                    <span className="text-[10px] sm:text-xs">TikTok</span>
                  </button>

                </div>
              </div>

              {/* FORMAT PENJUALAN: SATUAN VS BUNDLING (MINIMALIS) */}
              <div className="flex items-center justify-between pt-2 border-t border-emerald-200/70">
                <span className="text-xs font-bold text-emerald-950">Format Penjualan</span>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-emerald-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setSalesType('SINGLE')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      salesType === 'SINGLE'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>( Satuan )</span>
                    {salesCart.length > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${salesType === 'SINGLE' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                        {salesCart.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalesType('BUNDLE')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      salesType === 'BUNDLE'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-purple-700 bg-purple-50 hover:bg-purple-100'
                    }`}
                  >
                    <span>( Bundling )</span>
                  </button>
                </div>
              </div>

            </div>

            {/* HEADER METADATA: PEMBELI, NO. PESANAN / RESI, BAYAR */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                <User className="w-4 h-4 text-emerald-600" />
                <span>2. Detail Pembeli & Informasi Transaksi ({getPlatformLabel(salesPlatform)})</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Nama Pembeli / Pemesan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Pembeli / Pemesan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Walk-in Customer / Pelanggan Shopee"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>

                {/* No. Nota / No. Pesanan Marketplace */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    {salesPlatform !== 'OFFLINE' ? `No. Pesanan / Resi (${salesPlatform})` : 'No. Nota / Faktur (Opsional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={salesPlatform !== 'OFFLINE' ? `Contoh: 260827-SPX-001` : 'Contoh: NOTA-2026-001'}
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                {/* Metode Pembayaran */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="CASH">Tunai (Cash)</option>
                    <option value="TRANSFER">Transfer Bank</option>
                    <option value="QRIS">QRIS / E-Wallet</option>
                    <option value="MARKETPLACE">Marketplace Escrow / Rekber</option>
                  </select>
                </div>

              </div>
            </div>

            {/* FORM BODY BASED ON SALES TYPE (SATUAN / MULTI-ITEM VS BUNDLING) */}
            {salesType === 'SINGLE' ? (
              /* MULTI-ITEM SALES LIST CART FORM */
              <form onSubmit={handlePrepareSingleSubmit} className="space-y-4">
                
                {/* Step 3: Search & Add Products */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      3. Pilih / Scan Produk yang Dijual
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Scan Barcode (+1)</span>
                    </button>
                  </div>

                  <ProductSearchPicker
                    products={products}
                    selectedProductId=""
                    onSelectProduct={(prod) => handleAddItemToSalesCart(prod)}
                    placeholder="🔍 Ketik Nama Produk, SKU, Merk untuk menambah ke daftar nota penjualan..."
                    label=""
                    showStockInfo={true}
                  />
                </div>

                {/* Step 4: Multi-Item Sales Cart Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="p-3 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-emerald-600" />
                      <span>Daftar Barang Penjualan ({salesCart.length} Jenis Produk Dipilih)</span>
                    </span>
                    {salesCart.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSalesCart([])}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 transition cursor-pointer"
                      >
                        Kosongkan Daftar
                      </button>
                    )}
                  </div>

                  {salesCart.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 space-y-2">
                      <Boxes className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                      <p className="text-xs font-semibold text-slate-600">Belum ada barang di daftar penjualan nota ini.</p>
                      <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                        Gunakan kotak pencarian di atas atau tombol <strong>Scan Barcode</strong> untuk memasukkan barang-barang yang dibeli pelanggan.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100/80 text-slate-600 font-semibold uppercase border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5 min-w-[200px]">Produk & Merk</th>
                            <th className="px-3 py-2.5 text-center whitespace-nowrap min-w-[100px]">Stok Fisik</th>
                            <th className="px-3 py-2.5 text-center whitespace-nowrap min-w-[130px]">Qty Jual (Pcs)</th>
                            <th className="px-3 py-2.5 text-right whitespace-nowrap min-w-[130px]">Harga Satuan (Rp)</th>
                            <th className="px-3 py-2.5 text-right whitespace-nowrap min-w-[130px]">Subtotal (Rp)</th>
                            <th className="px-3 py-2.5 text-right whitespace-nowrap min-w-[70px]">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {salesCart.map((item, idx) => {
                            const isItemOverStock = (Number(item.qty) || 0) > (Number(item.currentStock) || 0);
                            const itemSubtotal = (Number(item.price) || 0) * (Number(item.qty) || 0);

                            return (
                              <tr key={item.productId} className={`hover:bg-slate-50 ${isItemOverStock ? 'bg-rose-50/50' : ''}`}>
                                <td className="px-4 py-3 min-w-[200px]">
                                  <div className="font-bold text-slate-900 leading-snug">{item.productName}</div>
                                  <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                    <span className="whitespace-nowrap font-bold text-slate-600">SKU: {item.sku}</span>
                                    <span>|</span>
                                    <span className="text-indigo-600 font-semibold whitespace-nowrap">{item.brand || 'Generic'}</span>
                                  </div>
                                </td>
                                
                                <td className="px-3 py-3 text-center whitespace-nowrap">
                                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap inline-block ${
                                    item.currentStock <= 0 
                                      ? 'bg-rose-100 text-rose-800' 
                                      : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {item.currentStock} Pcs
                                  </span>
                                </td>

                                <td className="px-3 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSalesCartQty(idx, (Number(item.qty) || 1) - 1)}
                                      className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center justify-center transition active:scale-95 cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min="1"
                                      max={item.currentStock}
                                      value={item.qty}
                                      onChange={(e) => handleUpdateSalesCartQty(idx, Math.max(1, Number(e.target.value)))}
                                      className={`w-14 py-1 border rounded-lg text-center font-extrabold text-xs focus:ring-2 focus:ring-emerald-500 ${
                                        isItemOverStock 
                                          ? 'bg-rose-50 border-rose-400 text-rose-700' 
                                          : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                                      }`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSalesCartQty(idx, (Number(item.qty) || 1) + 1)}
                                      className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center justify-center transition active:scale-95 cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                  {isItemOverStock && (
                                    <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                                      Max: {item.currentStock} Pcs
                                    </span>
                                  )}
                                </td>

                                <td className="px-3 py-3 text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.price}
                                    onChange={(e) => handleUpdateSalesCartPrice(idx, e.target.value)}
                                    className="w-28 py-1 px-2 text-right bg-white border border-slate-200 rounded-lg font-medium text-xs focus:ring-2 focus:ring-emerald-500"
                                  />
                                </td>

                                <td className="px-3 py-3 text-right font-black text-emerald-900 text-xs">
                                  Rp {itemSubtotal.toLocaleString('id-ID')}
                                </td>

                                <td className="px-3 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFromSalesCart(idx)}
                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                    title="Hapus barang ini dari nota"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Step 5: Summary & Notes */}
                {salesCart.length > 0 && (
                  <div className="p-4 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-white border border-emerald-200 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                          Ringkasan Tagihan Nota Penjualan
                        </span>
                        <p className="text-[11px] text-emerald-800">
                          {salesCart.length} Jenis Produk • Total {salesCart.reduce((sum, i) => sum + (Number(i.qty) || 0), 0)} Pcs Fisik
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Tagihan (Grand Total)</span>
                        <span className="text-xl sm:text-2xl font-black text-emerald-800">
                          Rp {salesCart.reduce((sum, i) => sum + ((Number(i.price) || 0) * (Number(i.qty) || 0)), 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Catatan Transaksi (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Packing kayu / Titipan via Kurir Instant"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={salesCart.length === 0 || salesCart.some(i => (Number(i.qty) || 0) > (Number(i.currentStock) || 0))}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-2 ${
                    salesCart.length === 0 || salesCart.some(i => (Number(i.qty) || 0) > (Number(i.currentStock) || 0))
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-emerald-600/20'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {salesCart.length === 0 
                      ? 'Pilih Barang untuk Memproses Penjualan' 
                      : `Proses Penjualan [${getPlatformLabel(salesPlatform)}] (${salesCart.length} Jenis Produk • Total ${salesCart.reduce((sum, i) => sum + (Number(i.qty) || 0), 0)} Pcs • Rp ${salesCart.reduce((sum, i) => sum + ((Number(i.price) || 0) * (Number(i.qty) || 0)), 0).toLocaleString('id-ID')})`}
                  </span>
                </button>

              </form>
            ) : (
              /* PAKET BUNDLING (COMBO) FORM */
              <form onSubmit={handlePrepareBundlingSubmit} className="space-y-4">
                
                {/* Sub-Mode Switcher: Preset Bundling vs Custom Ad-hoc */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-purple-50/80 border border-purple-200 rounded-2xl gap-2">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-purple-700" />
                    <span className="text-xs font-bold text-purple-950 uppercase tracking-wider">Mode Bundling</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-purple-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        setBundleMode('PRESET');
                        if (bundles.length > 0 && !selectedBundlePresetId) {
                          handleSelectBundlePreset(bundles[0].id);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        bundleMode === 'PRESET'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-purple-800 hover:bg-purple-50'
                      }`}
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      <span>📦 Pilih Paket Preset ({bundles.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBundleMode('CUSTOM');
                        setSelectedBundlePresetId('');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        bundleMode === 'CUSTOM'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-purple-800 hover:bg-purple-50'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>✏️ Susun Custom (Ad-hoc)</span>
                    </button>
                  </div>
                </div>

                {/* MODE A: PRESET BUNDLING */}
                {bundleMode === 'PRESET' ? (
                  <div className="space-y-4">
                    {/* Select Preset Search Picker */}
                    <div>
                      {bundles.length === 0 ? (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                          Belum ada data paket bundling preset. Silakan buat master bundle di menu <strong>Katalog Produk &gt; Paket Bundling</strong> atau gunakan mode <strong>Susun Custom</strong> di atas.
                        </div>
                      ) : (
                        <BundleSearchPicker
                          bundles={bundles}
                          selectedBundleId={selectedBundlePresetId}
                          onSelectBundle={(b) => handleSelectBundlePreset(b.id)}
                          label="Pilih Master Paket Bundling *"
                          placeholder="🔍 Cari Paket Bundling (Ketik Kode, Nama Paket, Merk, atau Mesin)..."
                          showPrice={true}
                          showComponentsCount={true}
                        />
                      )}
                    </div>

                    {/* Preset Details & Price Card if selected */}
                    {selectedBundlePresetId && (() => {
                      const curPreset = bundles.find(b => b.id === selectedBundlePresetId);
                      if (!curPreset) return null;

                      return (
                        <div className="p-3.5 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {curPreset.brand && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md text-[10px] font-bold">
                                Merk: {curPreset.brand}
                              </span>
                            )}
                            {curPreset.engine && (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[10px] font-bold">
                                Mesin: {curPreset.engine}
                              </span>
                            )}
                            {curPreset.car_variant && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                                Varian: {curPreset.car_variant}
                              </span>
                            )}
                            <div className="ml-auto text-[11px] text-slate-500 flex items-center gap-2">
                              <span>Harga Jual: <strong>Rp {(curPreset.selling_price || 0).toLocaleString('id-ID')}</strong></span>
                              <span>• Reseller: <strong>Rp {(curPreset.reseller_price || 0).toLocaleString('id-ID')}</strong></span>
                              <span>• Distributor: <strong>Rp {(curPreset.distributor_price || 0).toLocaleString('id-ID')}</strong></span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Bundle Name & Price (Always Editable for Negotiation) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Nama Paket Bundling *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Nama paket bundling"
                          value={bundleName}
                          onChange={(e) => setBundleName(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>Harga Jual Paket (Rp) *</span>
                          <span className="text-[10px] font-bold text-emerald-600">Bisa diubah/nego</span>
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="Masukkan harga kesepakatan"
                          value={bundleCustomPrice}
                          onChange={(e) => setBundleCustomPrice(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-purple-300 rounded-xl text-sm font-bold text-purple-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          * Harga default terisi otomatis dari master, tetapi dapat diedit jika terjadi proses tawar-menawar.
                        </p>
                      </div>
                    </div>

                    {/* Preset Components List (Read-only Recipe + Stock Check) */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Rincian Komponen Paket ({bundleItems.length} Komponen Produk)
                      </label>
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                        {bundleItems.map((item, idx) => {
                          const compProd = getProductFromItem(item);
                          const currentStock = Number(compProd?.currentStock) || 0;
                          const reqQty = Number(item.qty) || 1;
                          const totalNeeded = reqQty * Math.max(1, Number(bundleQty) || 1);
                          const isInsufficient = totalNeeded > currentStock;
                          const itemEngine = item.engine_type || item.engine || compProd?.engine_type || compProd?.machineCategory || compProd?.kategoriMesin || '';
                          const itemDetail = item.detail || item.cleanName || item.rawName || '';

                          return (
                            <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/80 gap-3">
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-slate-900 leading-snug break-words">
                                    {compProd?.name || item.productName || itemDetail || 'Komponen Produk'}
                                  </span>
                                  {itemEngine && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                                      {itemEngine}
                                    </span>
                                  )}
                                  {compProd?.brand && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 whitespace-nowrap">
                                      {compProd.brand}
                                    </span>
                                  )}
                                </div>
                                {itemDetail && itemDetail !== (compProd?.name || item.productName) && (
                                  <p className="text-xs text-slate-600 font-medium break-words">
                                    Detail Isi: <span className="text-slate-800 font-semibold">{itemDetail}</span>
                                  </p>
                                )}
                                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 flex-wrap leading-relaxed">
                                  <span>SKU: <strong className="text-purple-700">{compProd?.sku || item.sku || '-'}</strong></span>
                                  {(compProd?.car_variant || compProd?.carVariant) && (
                                    <>
                                      <span>•</span>
                                      <span className="text-slate-600 font-sans font-medium">{compProd?.car_variant || compProd?.carVariant}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 flex-shrink-0 self-start sm:self-center">
                                <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg whitespace-nowrap">
                                  {reqQty} Pcs/Paket ({totalNeeded} Pcs Total)
                                </span>
                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                                  isInsufficient 
                                    ? 'bg-rose-100 text-rose-700' 
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {isInsufficient ? `Stok Kurang (${currentStock} Pcs)` : `Stok Cukup (${currentStock} Pcs)`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quantity & Add to Cart Controls */}
                    <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-purple-900">Jumlah Paket:</span>
                        <div className="flex items-center border border-purple-300 rounded-xl bg-white overflow-hidden shadow-xs">
                          <button
                            type="button"
                            onClick={() => setBundleQty(prev => Math.max(1, Number(prev || 1) - 1))}
                            className="px-3 py-1.5 text-purple-700 hover:bg-purple-100 font-bold text-sm cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={bundleQty}
                            onChange={(e) => setBundleQty(Math.max(1, Number(e.target.value)))}
                            className="w-16 px-2 py-1.5 text-center text-xs font-bold text-purple-900 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setBundleQty(prev => Number(prev || 1) + 1)}
                            className="px-3 py-1.5 text-purple-700 hover:bg-purple-100 font-bold text-sm cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs text-purple-700 font-semibold">Paket</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddBundleToCart}
                        disabled={isBundleStockInsufficient}
                        className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Masukkan Paket ke Daftar Nota</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* MODE B: CUSTOM AD-HOC BUNDLING */
                  <div className="space-y-4">
                    {/* Bundle Name & Price */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Nama Paket Bundling Custom *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Paket Combo 3 Botol + Tutup"
                          value={bundleName}
                          onChange={(e) => setBundleName(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Harga Jual Paket (Rp) (Opsional)
                        </label>
                        <input
                          type="number"
                          placeholder={`Default: Rp ${bundleRegularTotal.toLocaleString('id-ID')}`}
                          value={bundleCustomPrice}
                          onChange={(e) => setBundleCustomPrice(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-purple-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Bundle Component Items */}
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                          Komponen Isi Paket ({bundleItems.length} Produk)
                        </label>
                        <button
                          type="button"
                          onClick={handleAddBundleComponent}
                          className="flex items-center gap-1 px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg text-xs font-bold active:scale-95 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Tambah Komponen</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {bundleItems.map((item, idx) => {
                          const compProd = getProductFromItem(item);
                          const totalNeeded = (Number(item.qty) || 0) * (Math.max(1, Number(bundleQty) || 1));
                          const isCompInsufficient = totalNeeded > (Number(compProd?.currentStock) || 0);

                          return (
                            <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                              <div className="flex-1">
                                <ProductSearchPicker
                                  products={products}
                                  selectedProductId={item.productId}
                                  onSelectProduct={(p) => handleUpdateBundleComponent(idx, 'productId', p.id)}
                                  placeholder="🔍 Cari Komponen Produk (Nama, SKU, Merk)..."
                                  label=""
                                  showStockInfo={true}
                                />
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Qty:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.qty}
                                  onChange={(e) => handleUpdateBundleComponent(idx, 'qty', Math.max(1, Number(e.target.value)))}
                                  className="w-20 px-2.5 py-1.5 text-center bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                />
                                <span className="text-xs text-slate-500 font-semibold">Pcs</span>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveBundleComponent(idx)}
                                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition active:scale-95 cursor-pointer ml-auto sm:ml-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {isCompInsufficient && (
                                <span className="text-[10px] font-bold text-rose-600 block sm:hidden">
                                  Stok tidak mencukupi (Tersisa {compProd?.currentStock} Pcs, Diperlukan {totalNeeded} Pcs)
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quantity & Add to Cart Controls */}
                    <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-purple-900">Jumlah Paket:</span>
                        <div className="flex items-center border border-purple-300 rounded-xl bg-white overflow-hidden shadow-xs">
                          <button
                            type="button"
                            onClick={() => setBundleQty(prev => Math.max(1, Number(prev || 1) - 1))}
                            className="px-3 py-1.5 text-purple-700 hover:bg-purple-100 font-bold text-sm cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={bundleQty}
                            onChange={(e) => setBundleQty(Math.max(1, Number(e.target.value)))}
                            className="w-16 px-2 py-1.5 text-center text-xs font-bold text-purple-900 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setBundleQty(prev => Number(prev || 1) + 1)}
                            className="px-3 py-1.5 text-purple-700 hover:bg-purple-100 font-bold text-sm cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs text-purple-700 font-semibold">Paket</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddBundleToCart}
                        disabled={isBundleStockInsufficient}
                        className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Masukkan Paket ke Daftar Nota</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Bundling Multi-Item Cart */}
                {bundleCart.length > 0 && (
                  <div className="space-y-3 p-4 bg-purple-50/80 border border-purple-200 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                        <PackageCheck className="w-4 h-4 text-purple-600" />
                        Daftar Paket Bundling dalam Nota ({bundleCart.length} Jenis Paket)
                      </h4>
                      <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                        Total: {bundleCart.reduce((sum, b) => sum + b.qty, 0)} Paket
                      </span>
                    </div>

                    <div className="space-y-2">
                      {bundleCart.map((cartItem, idx) => (
                        <div key={cartItem.id || idx} className="p-3 bg-white border border-purple-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                                {cartItem.code || 'PAKET'}
                              </span>
                              <p className="text-sm font-bold text-slate-900 truncate">{cartItem.name}</p>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              @ Rp {cartItem.unitPrice.toLocaleString('id-ID')} • Subtotal: <strong className="text-purple-700">Rp {cartItem.subtotal.toLocaleString('id-ID')}</strong>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                              Komponen: {cartItem.items?.map(c => `${c.qty * cartItem.qty}x ${c.productName}`).join(', ')}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => handleUpdateBundleCartQty(idx, cartItem.qty - 1)}
                                className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 font-bold text-sm cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-3 py-1 text-xs font-bold text-slate-800 bg-white min-w-[32px] text-center">
                                {cartItem.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateBundleCartQty(idx, cartItem.qty + 1)}
                                className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 font-bold text-sm cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveBundleFromCart(idx)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus paket"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-between items-center text-xs font-bold text-slate-700 border-t border-purple-200/60">
                      <span>Grand Total Penjualan Bundling:</span>
                      <span className="text-sm font-black text-purple-700">
                        Rp {bundleCart.reduce((sum, b) => sum + b.subtotal, 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Catatan Transaksi (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Paket promo spesial TikTok Live"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={bundleCart.length === 0 && isBundleStockInsufficient}
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-sm shadow-md shadow-purple-600/20 transition active:scale-98 cursor-pointer mt-2"
                >
                  {bundleCart.length > 0
                    ? `Proses Penjualan ${bundleCart.reduce((sum, b) => sum + b.qty, 0)} Paket Bundling (Rp ${bundleCart.reduce((sum, b) => sum + b.subtotal, 0).toLocaleString('id-ID')}) [${getPlatformLabel(salesPlatform)}]`
                    : `Proses Penjualan Paket Bundling (${bundleQty} Set) [${getPlatformLabel(salesPlatform)}]`
                  }
                </button>

              </form>
            )}

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: PRE-SUBMISSION CONFIRMATION DIALOG                                */}
      {/* ========================================================================= */}
      {pendingConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Konfirmasi Tindakan Transaksi</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Mohon pastikan rincian data transaksi barang keluar berikut sudah sesuai sebelum diproses ke database.
                </p>
              </div>

              {/* Transaction Summary Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Jenis Transaksi:</span>
                  <span className="font-bold text-slate-900">
                    {pendingConfirm.transactionType === 'STOCK_TRANSFER_TO_BRANCH' 
                      ? '🚚 Kirim Mutasi ke Cabang' 
                      : pendingConfirm.transactionType === 'CUSTOM_BUNDLING' 
                        ? '🎁 Penjualan Paket Bundling' 
                        : '🛍️ Penjualan Satuan Langsung'}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Nama Barang / Paket:</span>
                  <span className="font-bold text-slate-900 text-right">{pendingConfirm.productName}</span>
                </div>

                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Jumlah Kuantitas:</span>
                  <span className="font-extrabold text-rose-600 text-sm">-{pendingConfirm.qty} {pendingConfirm.unit || 'Pcs'}</span>
                </div>

                {pendingConfirm.targetBranchName && (
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Cabang Tujuan:</span>
                    <span className="font-bold text-indigo-700">{pendingConfirm.targetBranchName}</span>
                  </div>
                )}

                {pendingConfirm.customerName && (
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Pembeli:</span>
                    <span className="font-bold text-slate-800">{pendingConfirm.customerName}</span>
                  </div>
                )}

                {pendingConfirm.totalPrice > 0 && (
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Total Tagihan:</span>
                    <span className="font-black text-emerald-700 text-sm">
                      Rp {Number(pendingConfirm.totalPrice).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-slate-500">Petugas:</span>
                  <span className="font-semibold text-slate-800">{pendingConfirm.user}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setPendingConfirm(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Batal / Cek Lagi
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleExecuteConfirmed}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isProcessing ? 'Memproses...' : '✓ Ya, Proses Sekarang'}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Camera Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* MODAL 2: TRANSACTION SUCCESS RECEIPT MODAL */}
      <TransactionSuccessModal
        isOpen={Boolean(successModalData)}
        transaction={successModalData}
        onClose={() => setSuccessModalData(null)}
      />

      {/* MODAL 3: REJECT STOCK REQUEST WITH REASON DIALOG (SINGLE & BATCH) */}
      {rejectingBatch && rejectingBatch.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                    <X className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {rejectingBatch.length > 1 
                        ? `Tolak ${rejectingBatch.length} Permintaan Stok Sekaligus` 
                        : 'Tolak Permintaan Stok'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Berikan alasan resmi penolakan ke {rejectingBatch[0]?.branchName || 'Cabang'}.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setRejectingBatch(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Request Info Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2 max-h-52 overflow-y-auto">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cabang Pemohon:</span>
                  <span className="font-bold text-slate-800">{rejectingBatch[0]?.branchName}</span>
                </div>

                {rejectingBatch.length === 1 ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Barang & Kuantitas:</span>
                      <span className="font-bold text-indigo-700">{rejectingBatch[0].qty} Pcs "{rejectingBatch[0].productName}"</span>
                    </div>
                    {rejectingBatch[0].notes && (
                      <div className="pt-1 border-t border-slate-200 text-slate-600 italic">
                        "Catatan Cabang: {rejectingBatch[0].notes}"
                      </div>
                    )}
                  </>
                ) : (
                  <div className="border-t border-slate-200/80 pt-2 space-y-1.5">
                    <span className="text-slate-500 block font-semibold">
                      Daftar {rejectingBatch.length} Barang yang Akan Ditolak:
                    </span>
                    {rejectingBatch.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200/60">
                        <span className="font-medium text-slate-700 truncate mr-2">{item.productName}</span>
                        <span className="font-bold text-rose-600 shrink-0">{item.qty} Pcs</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Input Alasan Penolakan */}
              <form onSubmit={handleConfirmRejectSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Alasan Penolakan dari Kantor Pusat *
                  </label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Contoh: Stok di Pusat saat ini sedang menipis/menunggu batch produksi baru, perkiraan kirim hari Senin depan."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isSubmittingReject}
                    onClick={() => setRejectingBatch(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReject}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isSubmittingReject ? (
                      <span className="animate-pulse">Mengirim...</span>
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        <span>✕ Kirim Penolakan ({rejectingBatch.length})</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* UNIVERSAL SUCCESS POP-UP MODAL */}
      <GlobalSuccessModal
        isOpen={Boolean(rejectSuccessData)}
        onClose={() => setRejectSuccessData(null)}
        title={rejectSuccessData?.title}
        message={rejectSuccessData?.message}
        details={rejectSuccessData?.details}
        buttonText="✓ Selesai & Tutup"
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

