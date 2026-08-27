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
  Tag
} from 'lucide-react';

import ScannerModal from './ScannerModal';
import TransactionSuccessModal from './TransactionSuccessModal';
import GlobalSuccessModal from './GlobalSuccessModal';
import ProductSearchPicker from './ProductSearchPicker';
import CustomAlertModal from './CustomAlertModal';



export default function StockOut({ 
  currentUser, 
  products = [], 
  branches = [], 
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
  const [salesPlatform, setSalesPlatform] = useState('OFFLINE'); // 'OFFLINE' | 'SHOPEE' | 'TOKOPEDIA' | 'TIKTOK' | 'OTHER'

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

  // Rejection State
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Bundling State (For Custom Bundling)
  const [bundleName, setBundleName] = useState('');
  const [bundleCustomPrice, setBundleCustomPrice] = useState('');
  const [bundleItems, setBundleItems] = useState([
    { productId: products[0]?.id || '', qty: 1 }
  ]);

  // Handle incoming initialRequestData (e.g. from notification click)
  useEffect(() => {
    if (initialRequestData) {
      setActiveFulfillmentRequest(initialRequestData);
      setOutboundMode('STOCK_TRANSFER_TO_BRANCH');
      if (initialRequestData.targetBranchId || initialRequestData.branchId) {
        setTargetBranchId(initialRequestData.targetBranchId || initialRequestData.branchId);
      }
      if (initialRequestData.productId) {
        setSelectedProductId(initialRequestData.productId);
      }
      if (initialRequestData.qty) {
        setQty(Number(initialRequestData.qty));
      }
      if (initialRequestData.notes) {
        setNotes(`Memenuhi Permintaan Cabang: ${initialRequestData.notes}`);
      }
    } else {
      setActiveFulfillmentRequest(null);
    }
  }, [initialRequestData]);

  // Safe pending requests from branches for Pusat/Admin
  const pendingStockRequests = (!isBranchStaff && Array.isArray(stockRequests))
    ? stockRequests.filter(r => r && r.status === 'PENDING')
    : [];

  const handleSelectRequestToFulfill = (req) => {
    setActiveFulfillmentRequest(req);
    setOutboundMode('STOCK_TRANSFER_TO_BRANCH');
    setTargetBranchId(req.branchId);
    setSelectedProductId(req.productId);
    setQty(Number(req.qty) || 1);
    setNotes(`Memenuhi Permintaan Cabang: ${req.notes || '-'}`);
    
    // Smooth scroll to form
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleCancelFulfillment = () => {
    setActiveFulfillmentRequest(null);
    if (onClearInitialRequest) onClearInitialRequest();
    setSelectedProductId('');
    setNotes('');
    setQty(1);
  };

  const handleOpenRejectModal = (req) => {
    setRejectingRequest(req);
    setRejectionReason('');
  };

  const handleConfirmRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingRequest) return;
    if (!rejectionReason.trim()) {
      alert("Harap berikan alasan penolakan permintaan stok!");
      return;
    }

    setIsSubmittingReject(true);
    try {
      const savedBranchName = rejectingRequest.branchName;
      const savedProductName = rejectingRequest.productName;
      const savedQty = rejectingRequest.qty;
      const savedReason = rejectionReason.trim();

      if (onRejectStockRequest) {
        await onRejectStockRequest(rejectingRequest.id, savedReason);
      }
      
      // If the currently active form is processing this request, immediately clear it and reset the form
      if (
        !activeFulfillmentRequest || 
        activeFulfillmentRequest.id === rejectingRequest.id || 
        activeFulfillmentRequest.requestId === rejectingRequest.id ||
        activeFulfillmentRequest.branchId === rejectingRequest.branchId
      ) {
        handleCancelFulfillment();
      }
      
      setRejectingRequest(null);
      setRejectionReason('');

      setRejectSuccessData({
        title: "Penolakan Berhasil Dikirim!",
        message: "Pemberitahuan penolakan permintaan stok beserta alasan resmi telah terkirim ke Cabang pemohon.",
        details: [
          { label: "Cabang Pemohon", value: savedBranchName },
          { label: "Barang & Kuantitas", value: `${savedQty} Pcs "${savedProductName}"` },
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
  const [transferCart, setTransferCart] = useState([]);

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

  // Scanner handler
  const handleScanSuccess = (scannedText) => {
    const matched = products.find(
      p => p.sku?.toLowerCase() === scannedText.toLowerCase() || 
           p.barcode?.toLowerCase() === scannedText.toLowerCase() ||
           p.id?.toLowerCase() === scannedText.toLowerCase()
    );
    if (matched) {
      if (outboundMode === 'STOCK_TRANSFER_TO_BRANCH' && isBatchTransferMode) {
        handleAddItemToTransferCart(matched);
      } else if (outboundMode === 'CUSTOM_BUNDLING') {
        const existingIdx = bundleItems.findIndex(bi => bi.productId === matched.id);
        if (existingIdx !== -1) {
          const updated = [...bundleItems];
          updated[existingIdx].qty += 1;
          setBundleItems(updated);
        } else {
          setBundleItems([...bundleItems, { productId: matched.id, qty: 1 }]);
        }
      } else {
        setSelectedProductId(matched.id);
      }
    } else {
      showAlert("Barcode Tidak Ditemukan 🔍", `Produk dengan SKU/Barcode "${scannedText}" tidak ditemukan di database.`, "WARNING");
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

  // Calculate total regular price of bundling components
  const bundleRegularTotal = bundleItems.reduce((sum, item) => {
    const p = products.find(prod => prod.id === item.productId);
    return sum + (Number(p?.price) || 0) * (Number(item.qty) || 1);
  }, 0);

  // Check if any component in bundling exceeds stock
  const isBundleStockInsufficient = bundleItems.some(item => {
    const p = products.find(prod => prod.id === item.productId);
    return (Number(item.qty) || 0) > (Number(p?.currentStock) || 0);
  });

  const getPlatformLabel = (platformCode) => {
    switch (platformCode) {
      case 'SHOPEE': return 'Shopee';
      case 'TOKOPEDIA': return 'Tokopedia';
      case 'TIKTOK': return 'TikTok Shop';
      case 'OTHER': return 'Direct / Channel';
      case 'OFFLINE':
      default: return 'Toko Fisik (Offline)';
    }
  };

  // Step 1: Open Confirmation Modal Before Processing Single Item Outbound
  const handlePrepareSingleSubmit = (e) => {
    e.preventDefault();
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

    let finalNotes = '';
    let movementTypeData = {};

    if (isTransferMode) {
      // Pusat Transfer to Branch
      const targetBranch = branches.find(b => b.id === targetBranchId);
      const targetBranchName = targetBranch?.name || 'Cabang Tujuan';
      const sjNo = invoiceNumber || `SJ-HQ-${Math.floor(1000 + Math.random() * 9000)}`;

      finalNotes = `Pengiriman Mutasi ke: ${targetBranchName} (${qty} Pcs) • No. Surat Jalan: ${sjNo}${notes ? ` • Catatan: ${notes}` : ''}`;
      movementTypeData = {
        transactionType: 'STOCK_TRANSFER_TO_BRANCH',
        targetBranchId: targetBranchId,
        targetBranchName: targetBranchName,
        deliveryNote: sjNo
      };
    } else {
      // Retail Sale (Satuan Per Pcs - Offline / Marketplace)
      const unitPrice = Number(selectedProduct.price) || 0;
      const totalPrice = unitPrice * Number(qty);
      const platformName = getPlatformLabel(salesPlatform);
      const defaultPrefix = salesPlatform !== 'OFFLINE' ? `${salesPlatform}-` : 'NOTA-';
      const notaNo = invoiceNumber || `${defaultPrefix}${Math.floor(100000 + Math.random() * 900000)}`;
      const locationLabel = isBranchStaff ? currentUser?.branchName || 'Cabang' : 'Pusat';

      finalNotes = `Penjualan Satuan (${platformName} • ${locationLabel} • ${qty} Pcs) • Pembeli: ${customerName || 'Walk-in Customer'} • No. Nota/Pesanan: ${notaNo} • Bayar: ${paymentMethod}${notes ? ` • ${notes}` : ''}`;
      movementTypeData = {
        transactionType: 'RETAIL_PCS',
        salesPlatform: salesPlatform,
        platformName: platformName,
        customerName: customerName || 'Walk-in Customer',
        invoiceNumber: notaNo,
        paymentMethod: paymentMethod,
        totalPrice: totalPrice
      };
    }

    const payload = {
      productId: selectedProduct.id,
      sku: selectedProduct.sku,
      productName: selectedProduct.name,
      type: 'OUT',
      qty: Number(qty),
      unit: 'Pcs',
      notes: finalNotes,
      user: user || currentUser?.name || 'Staff',
      ...movementTypeData
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

    const summaryList = transferCart.map(item => `${item.qty}x ${item.productName}`).join(' + ');

    const payload = {
      productId: 'BATCH-TRANSFER',
      sku: 'MULTI-TRANSFER',
      productName: `[MULTI-TRANSFER] ${transferCart.length} Jenis Produk`,
      type: 'OUT',
      qty: transferCart.reduce((acc, i) => acc + Number(i.qty), 0),
      unit: 'Pcs',
      notes: `Batch Transfer ke: ${targetBranchName} [${summaryList}] • No. Surat Jalan: ${sjNo}${notes ? ` • Catatan: ${notes}` : ''}`,
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
      if (pendingConfirm.isBatchTransfer && pendingConfirm.batchItems) {
        for (const item of pendingConfirm.batchItems) {
          await onRecordMovement({
            productId: item.productId,
            sku: item.sku,
            productName: item.productName,
            type: 'OUT',
            qty: Number(item.qty),
            unit: 'Pcs',
            notes: pendingConfirm.notes,
            user: pendingConfirm.user,
            transactionType: 'STOCK_TRANSFER_TO_BRANCH',
            targetBranchId: pendingConfirm.targetBranchId,
            targetBranchName: pendingConfirm.targetBranchName,
            deliveryNote: pendingConfirm.deliveryNote
          });
        }
        setTransferCart([]);
      } else if (pendingConfirm.transactionType === 'CUSTOM_BUNDLING' && pendingConfirm.bundleItems) {
        await onRecordMovement({
          ...pendingConfirm,
          isBundling: true,
          items: pendingConfirm.bundleItems
        });
      } else {
        await onRecordMovement(pendingConfirm);
      }

      // Trigger Success Receipt Modal
      setSuccessModalData(pendingConfirm);

      // Reset form states
      setQty(1);
      setCustomerName('');
      setInvoiceNumber('');
      setNotes('');
      setBundleName('');
      setBundleCustomPrice('');
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
    if (!bundleName.trim()) {
      showAlert("Nama Paket Wajib Diisi", "Masukkan nama paket bundling terlebih dahulu!", "WARNING");
      return;
    }
    if (bundleItems.length === 0) {
      showAlert("Komponen Paket Kosong", "Paket bundling harus memiliki minimal 1 komponen produk.", "WARNING");
      return;
    }
    if (isBundleStockInsufficient) {
      showAlert("Stok Komponen Tidak Mencukupi 📦", "Salah satu komponen bundling melebihi stok yang tersedia!", "WARNING");
      return;
    }


    const totalBundlePrice = bundleCustomPrice ? Number(bundleCustomPrice) : bundleRegularTotal;
    const platformName = getPlatformLabel(salesPlatform);
    const defaultPrefix = salesPlatform !== 'OFFLINE' ? `${salesPlatform}-BUNDLE-` : 'NOTA-BUNDLE-';
    const notaNo = invoiceNumber || `${defaultPrefix}${Math.floor(100000 + Math.random() * 900000)}`;
    const locationLabel = isBranchStaff ? currentUser?.branchName || 'Cabang' : 'Pusat';

    const itemsSummary = bundleItems.map(item => {
      const p = products.find(prod => prod.id === item.productId);
      return `${item.qty}x ${p?.name || 'Produk'}`;
    }).join(' + ');

    const payload = {
      productId: 'BUNDLE-CUSTOM',
      sku: 'PAKET-BUNDLE',
      productName: `[BUNDLING] ${bundleName}`,
      type: 'OUT',
      qty: bundleItems.reduce((acc, i) => acc + Number(i.qty), 0),
      unit: 'Paket',
      notes: `Penjualan Paket Bundling (${platformName} • ${locationLabel}) • "${bundleName}" [${itemsSummary}] • Pembeli: ${customerName || 'Walk-in Customer'} • Total: Rp ${totalBundlePrice.toLocaleString('id-ID')} • No. Nota/Pesanan: ${notaNo}`,
      user: user || currentUser?.name || 'Staff',
      transactionType: 'CUSTOM_BUNDLING',
      salesPlatform: salesPlatform,
      platformName: platformName,
      customerName: customerName || 'Walk-in Customer',
      invoiceNumber: notaNo,
      paymentMethod: paymentMethod,
      totalPrice: totalBundlePrice,
      bundleItems: bundleItems.map(bi => {
        const p = products.find(prod => prod.id === bi.productId);
        return {
          productId: bi.productId,
          productName: p?.name,
          sku: p?.sku,
          qty: Number(bi.qty)
        };
      })
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {pendingStockRequests.map(req => {
              const isCurrentlySelected = activeFulfillmentRequest?.id === req.id;
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
                            ✓ Aktif
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
                            onClick={handleCancelFulfillment}
                            className="p-1 rounded-md text-white hover:text-rose-200 bg-white/20 hover:bg-rose-500 transition cursor-pointer flex items-center justify-center"
                            title="Batal pilih request ini / Reset form"
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
                      onClick={() => isCurrentlySelected ? handleCancelFulfillment() : handleSelectRequestToFulfill(req)}
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
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Pilih Jenis Pengeluaran Barang (Outbound)
          </label>
          <div className={`grid gap-3 ${!isBranchStaff ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            
            {/* OPSI 1: MUTASI KE CABANG (PUSAT ONLY) */}
            {!isBranchStaff && (
              <button
                type="button"
                onClick={() => setOutboundMode('STOCK_TRANSFER_TO_BRANCH')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3.5 ${
                  outboundMode === 'STOCK_TRANSFER_TO_BRANCH'
                    ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20 text-indigo-950 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${outboundMode === 'STOCK_TRANSFER_TO_BRANCH' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'}`}>
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm">1. Kirim ke Cabang</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">Mutasi Stok</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Kirim mutasi stok dari gudang pusat ke cabang dengan Surat Jalan.</p>
                </div>
              </button>
            )}

            {/* OPSI 2: PENJUALAN PRODUK (SATUAN & BUNDLING - ALL PLATFORMS) */}
            <button
              type="button"
              onClick={() => setOutboundMode('RETAIL_PCS')}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3.5 ${
                outboundMode === 'RETAIL_PCS'
                  ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className={`p-2.5 rounded-xl flex-shrink-0 ${outboundMode === 'RETAIL_PCS' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'}`}>
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm">{!isBranchStaff ? '2. Penjualan Produk' : '1. Penjualan Produk'}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">Satuan & Combo</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Penjualan toko fisik atau marketplace (Shopee, Tokopedia, TikTok Shop).
                </p>
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
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Scan Barcode</span>
                  </button>
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
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
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
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 text-slate-600 font-semibold uppercase">
                        <tr>
                          <th className="px-4 py-2.5">Produk</th>
                          <th className="px-3 py-2.5">SKU & Merk</th>
                          <th className="px-3 py-2.5 text-center">Stok Gudang Pusat</th>
                          <th className="px-3 py-2.5 text-center w-36">Qty Kirim (Pcs)</th>
                          <th className="px-4 py-2.5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transferCart.map((item, idx) => (
                          <tr key={item.productId} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-900">{item.productName}</td>
                            <td className="px-3 py-3 font-mono text-slate-500 text-[11px]">
                              {item.sku} | <span className="text-indigo-600 font-bold">{item.brand}</span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
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
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-4">
              
              {/* PLATFORM PENJUALAN SELECTOR */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-2">
                  1. Pilih Platform / Channel Penjualan
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  
                  {/* Toko Fisik / Offline */}
                  <button
                    type="button"
                    onClick={() => setSalesPlatform('OFFLINE')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
                      salesPlatform === 'OFFLINE'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Store className="w-4 h-4 text-emerald-400" />
                    <span>Toko Fisik / Offline</span>
                  </button>

                  {/* Shopee */}
                  <button
                    type="button"
                    onClick={() => setSalesPlatform('SHOPEE')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
                      salesPlatform === 'SHOPEE'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                        : 'bg-white text-orange-700 border-orange-200 hover:bg-orange-50'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Shopee</span>
                  </button>

                  {/* Tokopedia */}
                  <button
                    type="button"
                    onClick={() => setSalesPlatform('TOKOPEDIA')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
                      salesPlatform === 'TOKOPEDIA'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>Tokopedia</span>
                  </button>

                  {/* TikTok Shop */}
                  <button
                    type="button"
                    onClick={() => setSalesPlatform('TIKTOK')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
                      salesPlatform === 'TIKTOK'
                        ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-rose-400" />
                    <span>TikTok Shop</span>
                  </button>

                  {/* Direct / Other */}
                  <button
                    type="button"
                    onClick={() => setSalesPlatform('OTHER')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer col-span-2 sm:col-span-1 ${
                      salesPlatform === 'OTHER'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50'
                    }`}
                  >
                    <Tag className="w-4 h-4" />
                    <span>Lainnya / Direct</span>
                  </button>

                </div>
              </div>

              {/* FORMAT JENIS PENJUALAN: SATUAN VS BUNDLING */}
              <div className="flex items-center justify-between pt-1 border-t border-emerald-200/80">
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs">Format Barang Penjualan</h4>
                  <p className="text-[11px] text-emerald-800">Jual per produk satuan atau gabungan paket bundling combo.</p>
                </div>
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-emerald-300 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setSalesType('SINGLE')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      salesType === 'SINGLE'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Satuan (Per Pcs)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalesType('BUNDLE')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      salesType === 'BUNDLE'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-purple-700 bg-purple-50 hover:bg-purple-100'
                    }`}
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Paket Bundling (Combo)</span>
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

            {/* FORM BODY BASED ON SALES TYPE (SATUAN VS BUNDLING) */}
            {salesType === 'SINGLE' ? (
              /* SATUAN (PER PCS) FORM */
              <form onSubmit={handlePrepareSingleSubmit} className="space-y-4">
                
                {/* Step 3: Select Product */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      3. Pilih / Cari Produk yang Dijual
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer shadow-2xs"
                    >
                      <Camera className="w-4 h-4 text-sky-600" />
                      <span>Scan Barcode</span>
                    </button>
                  </div>

                  <ProductSearchPicker
                    products={products}
                    selectedProductId={selectedProductId}
                    onSelectProduct={(prod) => setSelectedProductId(prod.id)}
                    placeholder="🔍 Cari Produk (Ketik Nama, SKU, Merk, Kategori)..."
                    label=""
                    showStockInfo={true}
                  />
                </div>

                {/* Product Preview Card */}
                {selectedProduct && (
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                    isInsufficient ? 'bg-rose-50/80 border-rose-300' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{selectedProduct.name}</h4>
                        <p className="text-xs text-slate-400 font-mono">
                          Merk: <span className="text-indigo-600 font-semibold">{selectedProduct.brand || 'NDK Packaging'}</span> | SKU: {selectedProduct.sku}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">Stok Fisik Tersedia</span>
                      <span className={`text-sm font-extrabold ${isInsufficient ? 'text-rose-600' : 'text-slate-800'}`}>
                        {selectedProduct.currentStock} Pcs
                      </span>
                    </div>
                  </div>
                )}

                {/* Quantity Stepper */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kuantitas Dijual (Qty Pcs) *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQty(Math.max(1, Number(qty) - 1))}
                      className="w-12 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-lg flex items-center justify-center active:scale-95 transition cursor-pointer"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    
                    <input
                      type="number"
                      min="1"
                      max={currentAvailable || undefined}
                      required
                      value={qty}
                      onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                      className="flex-1 h-12 text-center text-lg font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900"
                    />

                    <button
                      type="button"
                      onClick={() => setQty(Number(qty) + 1)}
                      className="w-12 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-lg flex items-center justify-center active:scale-95 transition cursor-pointer"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Catatan Transaksi (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Packing kayu via Kurir Instant"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>

                {/* Simulation Preview */}
                {selectedProduct && (
                  <div className={`p-3 rounded-xl border text-xs flex justify-between items-center ${
                    isInsufficient ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    <span>Sisa Stok Fisik Setelah Transaksi:</span>
                    <span className={`font-bold text-sm ${isInsufficient ? 'text-rose-600' : 'text-slate-900'}`}>
                      {currentAvailable - Number(qty)} Pcs
                    </span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!selectedProduct || isInsufficient}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition active:scale-98 cursor-pointer mt-2"
                >
                  Proses Penjualan Satuan [{getPlatformLabel(salesPlatform)}] ({qty} Pcs)
                </button>

              </form>
            ) : (
              /* PAKET BUNDLING (COMBO) FORM */
              <form onSubmit={handlePrepareBundlingSubmit} className="space-y-4">
                
                {/* Bundle Name & Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Paket Bundling *
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
                      const compProd = products.find(p => p.id === item.productId);
                      const isCompInsufficient = (Number(item.qty) || 0) > (Number(compProd?.currentStock) || 0);

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
                              Stok tidak mencukupi (Tersisa {compProd?.currentStock} Pcs)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

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
                  disabled={isBundleStockInsufficient}
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-sm shadow-md shadow-purple-600/20 transition active:scale-98 cursor-pointer mt-2"
                >
                  Proses Penjualan Paket Bundling [{getPlatformLabel(salesPlatform)}]
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

      {/* MODAL 3: REJECT STOCK REQUEST WITH REASON DIALOG */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                    <X className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Tolak Permintaan Stok</h3>
                    <p className="text-xs text-slate-500">Berikan alasan resmi penolakan kepada cabang.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setRejectingRequest(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Request Info Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cabang Pemohon:</span>
                  <span className="font-bold text-slate-800">{rejectingRequest.branchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Barang & Kuantitas:</span>
                  <span className="font-bold text-indigo-700">{rejectingRequest.qty} Pcs "{rejectingRequest.productName}"</span>
                </div>
                {rejectingRequest.notes && (
                  <div className="pt-1 border-t border-slate-200 text-slate-600 italic">
                    "Catatan Cabang: {rejectingRequest.notes}"
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
                    onClick={() => setRejectingRequest(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReject}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>{isSubmittingReject ? 'Mengirim...' : '✕ Kirim Penolakan'}</span>
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

