import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowDownLeft, 
  Camera, 
  CheckCircle, 
  CheckCircle2,
  Package, 
  Plus, 
  Minus, 
  FileText, 
  User, 
  Building2, 
  Factory, 
  Truck, 
  Clock, 
  ShieldCheck, 
  Send, 
  HelpCircle, 
  X, 
  Boxes, 
  Check,
  Ban,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';
import ScannerModal from './ScannerModal';
import TransactionSuccessModal from './TransactionSuccessModal';
import GlobalSuccessModal from './GlobalSuccessModal';
import ProductSearchPicker from './ProductSearchPicker';
import CustomAlertModal from './CustomAlertModal';
import ConfirmationModal from './ConfirmationModal';


export default function StockIn({ 
  currentUser, 
  products = [], 
  branches = [], 
  transfers = [], 
  stockRequests = [], 
  initialTab = 'INCOMING_DELIVERIES',
  onRecordMovement, 
  onConfirmTransfer, 
  onRejectTransfer,
  onRequestStock 
}) {
  const isBranchStaff = currentUser?.role === 'STAFF_BRANCH';

  // Alert Modal State
  const [alertModal, setAlertModal] = useState(null);

  const showAlert = (title, message, type = 'WARNING') => {
    setAlertModal({ title, message, type });
  };


  // Sub-tab for Branch Staff: 'INCOMING_DELIVERIES' | 'REQUEST_STOCK'
  const [activeBranchTab, setActiveBranchTab] = useState(initialTab || 'INCOMING_DELIVERIES');

  React.useEffect(() => {
    if (initialTab) {
      setActiveBranchTab(initialTab);
    }
  }, [initialTab]);

  // Confirmation Modal States
  const [pendingConfirmBatchInbound, setPendingConfirmBatchInbound] = useState(null);
  const [pendingConfirmRequest, setPendingConfirmRequest] = useState(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  // Incoming Delivery (HQ -> Branch) States
  const [expandedPackages, setExpandedPackages] = useState({});
  const [confirmingPackageGroup, setConfirmingPackageGroup] = useState(null);
  const [confirmingSingleTransfer, setConfirmingSingleTransfer] = useState(null);
  const [rejectingTransferTarget, setRejectingTransferTarget] = useState(null);
  const [transferRejectReason, setTransferRejectReason] = useState('');
  const [transferRejectError, setTransferRejectError] = useState('');

  // Request Stock Form State (Branch -> Pusat)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqProductId, setReqProductId] = useState('');
  const [reqQty, setReqQty] = useState(10);
  const [reqNotes, setReqNotes] = useState('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);
  const [reqSuccessMsg, setReqSuccessMsg] = useState('');
  const [successRequestData, setSuccessRequestData] = useState(null);


  // Pusat Direct Inbound Form State (Only for Staff Pusat / Admin)
  const [selectedProductId, setSelectedProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [user, setUser] = useState(currentUser?.name || (isBranchStaff ? 'Staff Cabang' : 'Staff Gudang Pusat'));
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);
  const [confirmingTransferId, setConfirmingTransferId] = useState(null);

  // Multi-Category Inbound Manifest State (Requirement 2)
  const [isInboundMultiCategoryMode, setIsInboundMultiCategoryMode] = useState(false);
  const [inboundCategoryFilter, setInboundCategoryFilter] = useState('ALL');
  const [inboundManifest, setInboundManifest] = useState([]);
  const [scanSuccessToast, setScanSuccessToast] = useState(null);

  // Safe Arrays
  const safeTransfers = Array.isArray(transfers) ? transfers : [];
  const safeStockRequests = Array.isArray(stockRequests) ? stockRequests : [];
  const safeProducts = Array.isArray(products) ? products : [];

  // Auto-dismiss scan success toast
  useEffect(() => {
    if (scanSuccessToast) {
      const timer = setTimeout(() => {
        setScanSuccessToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [scanSuccessToast]);

  // Get all unique categories for filtering
  const allInboundCategories = Array.from(
    new Set(safeProducts.map(p => p.machineCategory || p.kategoriMesin || 'Universal / Semua Mesin'))
  );

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

  const handleAddItemToManifest = (product) => {
    if (!product) return;
    setInboundManifest((prevManifest) => {
      const prodSku = (product.sku || product.code || '').trim().toLowerCase();
      const existingIdx = prevManifest.findIndex(
        item => (item.productId && item.productId === product.id) || 
                (item.sku && item.sku.trim().toLowerCase() === prodSku)
      );

      if (existingIdx !== -1) {
        const updated = [...prevManifest];
        const currentQty = Number(updated[existingIdx].qty_in) || 0;
        const nextQty = currentQty + 1;
        updated[existingIdx] = {
          ...updated[existingIdx],
          qty_in: nextQty
        };
        setScanSuccessToast({
          name: product.name,
          sku: product.sku || product.code,
          qty: nextQty
        });
        return updated;
      } else {
        setScanSuccessToast({
          name: product.name,
          sku: product.sku || product.code,
          qty: 1
        });
        return [
          ...prevManifest,
          {
            productId: product.id,
            sku: product.sku || product.code,
            productName: product.name,
            brand: product.brand || 'NDK Exhaust',
            machineCategory: product.machineCategory || product.engine_type || product.kategoriMesin || 'Universal',
            qty_in: 1,
            buyPrice: Number(product.reseller_price || product.price) || 0,
            supplier: '',
            invoiceNo: '',
            batchNo: '',
            expiredDate: ''
          }
        ];
      }
    });
  };

  const handleUpdateManifestField = (index, field, value) => {
    setInboundManifest(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const handleRemoveFromManifest = (index) => {
    setInboundManifest(prev => prev.filter((_, i) => i !== index));
  };

  const handleScanSuccess = (scannedText) => {
    if (!scannedText) return;
    const cleanSku = parseScannedSKU(scannedText).trim().toLowerCase();
    const cleanNormalized = cleanSku.replace(/[\s\-_]/g, '');
    
    const matched = safeProducts.find(p => {
      const pSku = (p.sku || '').trim().toLowerCase();
      const pCode = (p.code || '').trim().toLowerCase();
      const pBarcode = (p.barcode || '').trim().toLowerCase();
      const pId = (p.id || '').trim().toLowerCase();
      const pName = (p.name || '').trim().toLowerCase();

      return pSku === cleanSku || 
             pCode === cleanSku || 
             pBarcode === cleanSku || 
             pId === cleanSku ||
             pSku.replace(/[\s\-_]/g, '') === cleanNormalized ||
             pCode.replace(/[\s\-_]/g, '') === cleanNormalized ||
             pName === cleanSku;
    });

    if (matched) {
      if (isBranchStaff) {
        setReqProductId(matched.id);
        setReqQty(prev => (Number(prev) || 0) + 1);
        setIsRequestModalOpen(true);
      } else {
        handleAddItemToManifest(matched);
      }
      setIsScannerOpen(false);
    } else {
      showAlert("Produk Tidak Ditemukan 🔍", `Produk dengan SKU/Barcode "${parseScannedSKU(scannedText)}" tidak ditemukan di database master.`, "WARNING");
    }
  };

  // Pre-submit validation before opening Inbound Batch Confirmation Dialog
  const handlePreSubmitBatchManifest = (e) => {
    e.preventDefault();
    if (inboundManifest.length === 0) {
      showAlert("List Barang Kosong 📋", "Pilih minimal 1 produk ke dalam list penerimaan barang!", "WARNING");
      return;
    }
    for (const item of inboundManifest) {
      if (!item.qty_in || Number(item.qty_in) <= 0) {
        showAlert("Kuantitas Tidak Valid", `Kuantitas untuk "${item.productName}" harus lebih besar dari 0!`, "WARNING");
        return;
      }
    }
    const batchDeliveryNote = deliveryNoteNumber.trim() || `SJ-PABRIK-${Date.now().toString().slice(-6)}`;
    const totalQty = inboundManifest.reduce((acc, i) => acc + (Number(i.qty_in) || 0), 0);

    setPendingConfirmBatchInbound({
      items: [...inboundManifest],
      deliveryNote: batchDeliveryNote,
      totalQty,
      notes: notes.trim(),
      user: user || currentUser?.name || 'Staff Pusat'
    });
  };

  // Execute Inbound Batch Save to Database after confirmation
  const handleExecuteBatchManifest = async () => {
    if (!pendingConfirmBatchInbound) return;
    setIsExecutingAction(true);

    try {
      const { items, deliveryNote, totalQty, notes: noteText, user: userName } = pendingConfirmBatchInbound;
      const summaryText = items.map(item => `${item.qty_in}x ${item.productName}`).join(' + ');
      
      for (const item of items) {
        const itemNotes = `Penerimaan Barang Masuk Gudang Pusat • ${item.productName} (${item.qty_in} Pcs)${item.supplier ? ` • Supplier: ${item.supplier}` : ''}${item.invoiceNo ? ` • No. Faktur: ${item.invoiceNo}` : ''}${noteText ? ` • Catatan: ${noteText}` : ''}`;

        await onRecordMovement({
          productId: item.productId,
          sku: item.sku,
          productName: item.productName,
          type: 'IN',
          qty: Math.max(1, Number(item.qty_in) || 1),
          unit: 'Pcs',
          notes: itemNotes,
          source: item.supplier || 'PABRIK_PRODUKSI_PUSAT',
          deliveryNote: item.invoiceNo || deliveryNote,
          user: userName
        });
      }

      setSuccessModalData({
        productName: `${items.length} Jenis Produk Inbound`,
        sku: 'BATCH-INBOUND',
        type: 'IN',
        qty: totalQty,
        notes: `Penerimaan ${items.length} jenis barang ke gudang pusat [${summaryText}]${noteText ? ` • Catatan: ${noteText}` : ''}`,
        deliveryNote: deliveryNote,
        user: userName
      });

      setPendingConfirmBatchInbound(null);
      setInboundManifest([]);
      setDeliveryNoteNumber('');
      setNotes('');
    } catch (err) {
      showAlert("Gagal Menyimpan Inbound", err.message, "ERROR");
    } finally {
      setIsExecutingAction(false);
    }
  };



  // Helper date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Incoming pending transfers from HQ for this branch
  const pendingTransfers = safeTransfers.filter(
    t => t && t.status === 'IN_TRANSIT' && (t.targetBranchId === currentUser?.branchId || t.targetBranchId === 'ALL' || t.to_branch_id === currentUser?.branchId || t.to_branch_id === 'ALL')
  );

  // Group incoming transfers from HQ by Delivery Note / Surat Jalan
  const pendingByDeliveryNote = React.useMemo(() => {
    const groups = {};
    for (const trf of pendingTransfers) {
      const key = trf.deliveryNote || trf.id;
      if (!groups[key]) {
        groups[key] = {
          deliveryNote: trf.deliveryNote || 'SJ-PENGIRIMAN',
          senderName: trf.senderName || 'Staff Pusat',
          sentAt: trf.sentAt,
          notes: trf.notes || '',
          items: [],
          totalQty: 0
        };
      }
      groups[key].items.push(trf);
      groups[key].totalQty += Number(trf.qty) || 0;
    }
    return Object.values(groups);
  }, [pendingTransfers]);

  // Completed received transfers for this branch
  const receivedTransfers = safeTransfers.filter(
    t => t && t.status === 'RECEIVED' && (t.targetBranchId === currentUser?.branchId || t.targetBranchId === 'ALL' || t.to_branch_id === currentUser?.branchId || t.to_branch_id === 'ALL')
  );

  // Branch Stock Requests
  const myStockRequests = safeStockRequests.filter(
    r => r && (isBranchStaff ? r.branchId === currentUser?.branchId : true)
  );

  const selectedProduct = safeProducts.find(p => p.id === selectedProductId || p.sku === selectedProductId);

  // Toggle expand for a Delivery Note Package
  const toggleExpandPackage = (key) => {
    setExpandedPackages(prev => ({
      ...prev,
      [key]: prev[key] === false ? true : false
    }));
  };

  // Execute Batch Package Receipt Confirmation
  const handleExecuteConfirmPackageGroup = async () => {
    if (!confirmingPackageGroup) return;
    setIsExecutingAction(true);
    try {
      if (onConfirmTransfer) {
        await onConfirmTransfer(confirmingPackageGroup.items, 'Seluruh paket kiriman telah diverifikasi dan diterima dalam kondisi baik.');
      }
      setConfirmingPackageGroup(null);
    } catch (err) {
      showAlert("Gagal Mengonfirmasi Paket", err.message || "Terjadi kesalahan saat menerima paket.", "ERROR");
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Execute Single Item Receipt Confirmation
  const handleExecuteConfirmSingleTransfer = async () => {
    if (!confirmingSingleTransfer) return;
    setIsExecutingAction(true);
    try {
      if (onConfirmTransfer) {
        await onConfirmTransfer([confirmingSingleTransfer], 'Barang telah diperiksa dan diterima dalam kondisi baik.');
      }
      setConfirmingSingleTransfer(null);
    } catch (err) {
      showAlert("Gagal Mengonfirmasi", err.message || "Terjadi kesalahan saat menerima barang.", "ERROR");
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Execute Batch or Single Transfer Rejection
  const handleExecuteRejectTransfer = async () => {
    if (!rejectingTransferTarget) return;
    const reason = transferRejectReason.trim();
    if (!reason) {
      setTransferRejectError("Mohon tuliskan deskripsi / alasan penolakan atau retur barang.");
      return;
    }
    setIsExecutingAction(true);
    try {
      if (onRejectTransfer) {
        const itemsToReject = rejectingTransferTarget.type === 'GROUP' 
          ? rejectingTransferTarget.data.items 
          : [rejectingTransferTarget.data];
        await onRejectTransfer(itemsToReject, reason);
      }
      setRejectingTransferTarget(null);
      setTransferRejectReason('');
      setTransferRejectError('');
    } catch (err) {
      showAlert("Gagal Menolak Kiriman", err.message || "Terjadi kesalahan saat menolak kiriman.", "ERROR");
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Pre-submit validation before opening Request Stock Confirmation Dialog
  const handlePreSubmitStockRequest = (e) => {
    e.preventDefault();
    const targetP = safeProducts.find(p => p.id === reqProductId) || safeProducts[0];
    if (!targetP) {
      showAlert("Pilih Produk", "Pilih produk dari katalog terlebih dahulu!", "WARNING");
      return;
    }
    if (Number(reqQty) <= 0) {
      showAlert("Kuantitas Tidak Valid", "Jumlah kuantitas yang diminta harus lebih besar dari 0!", "WARNING");
      return;
    }

    const payload = {
      productId: targetP.id,
      sku: targetP.sku,
      productName: targetP.name,
      brand: targetP.brand || 'Generic',
      qty: Number(reqQty),
      notes: reqNotes.trim()
    };
    setPendingConfirmRequest(payload);
  };

  // Execute Stock Request Save to Database after confirmation
  const handleExecuteStockRequest = async () => {
    if (!pendingConfirmRequest) return;
    setIsExecutingAction(true);
    try {
      if (onRequestStock) {
        await onRequestStock(pendingConfirmRequest);
      }

      setIsRequestModalOpen(false);
      setReqNotes('');
      setReqQty(10);
      setActiveBranchTab('REQUEST_STOCK');
      setSuccessRequestData(pendingConfirmRequest);
      setPendingConfirmRequest(null);
    } catch (err) {
      showAlert("Gagal Mengirim Permintaan", err.message, "ERROR");
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Pusat Direct Inbound Submission (Pusat Only)
  const handlePusatSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      showAlert("Pilih Produk", "Silakan pilih produk terlebih dahulu!", "WARNING");
      return;
    }
    if (Number(qty) <= 0) {
      showAlert("Kuantitas Tidak Valid", "Jumlah kuantitas (Pcs) harus lebih besar dari 0!", "WARNING");
      return;
    }

    const originDescription = `Inbound Gudang Pusat dari Pabrik Produksi Kantor${deliveryNoteNumber ? ` • No. Surat Jalan / Batch: ${deliveryNoteNumber}` : ''}`;
    const finalNotes = notes 
      ? `${originDescription} • Catatan: ${notes}` 
      : originDescription;

    const txPayload = {
      productId: selectedProduct.id,
      sku: selectedProduct.sku,
      productName: selectedProduct.name,
      type: 'IN',
      qty: Number(qty),
      unit: 'Pcs',
      notes: finalNotes,
      source: 'PABRIK_PRODUKSI_PUSAT',
      deliveryNote: deliveryNoteNumber || `SJ-PABRIK-${Date.now().toString().slice(-6)}`,
      user: user || currentUser?.name || 'Staff Pusat'
    };

    try {
      await onRecordMovement(txPayload);
      setSuccessModalData(txPayload);
      setQty(1);
      setDeliveryNoteNumber('');
      setNotes('');
    } catch (err) {
      showAlert("Gagal Memproses Inbound", err.message, "ERROR");
    }

  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
          <ArrowDownLeft className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {isBranchStaff ? 'Penerimaan Stok Cabang (Inbound)' : 'Barang Masuk (Inbound Pusat)'}
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isBranchStaff 
                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {isBranchStaff ? 'Sistem 1 Pintu: Dari Kantor Pusat' : 'Penerimaan Pabrik Produksi'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isBranchStaff 
              ? 'Barang masuk hanya berasal dari Kantor Pusat. Cabang dapat mengonfirmasi kiriman atau mengajukan permintaan stok baru.' 
              : 'Catat penerimaan stok masuk langsung dari Pabrik Produksi Kantor ke Gudang Pusat.'}
          </p>
        </div>
      </div>

      {/* Live Scan Success Alert Banner */}
      {scanSuccessToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-950 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 animate-in slide-in-from-top-4 duration-200 max-w-md w-[92%]">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold leading-tight truncate text-white">{scanSuccessToast.name}</p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              SKU: <span className="font-mono text-emerald-400 font-bold">{scanSuccessToast.sku}</span> • Total di List: <strong className="text-white bg-emerald-700/80 px-2 py-0.5 rounded-md font-black">{scanSuccessToast.qty} Pcs</strong>
            </p>
          </div>
          <button 
            type="button" 
            onClick={() => setScanSuccessToast(null)} 
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {reqSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{reqSuccessMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BRANCH STAFF VIEW: 100% SINGLE DOOR (CONFIRM TRANSFERS & REQUEST STOCK)  */}
      {/* ========================================================================= */}
      {isBranchStaff ? (
        <div className="space-y-4">
          
          {/* Sub Navigation Tabs for Branch Staff */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveBranchTab('INCOMING_DELIVERIES')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  activeBranchTab === 'INCOMING_DELIVERIES'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Kiriman dari Pusat</span>
                {pendingTransfers.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    activeBranchTab === 'INCOMING_DELIVERIES' ? 'bg-amber-400 text-slate-900' : 'bg-rose-500 text-white'
                  }`}>
                    {pendingTransfers.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveBranchTab('REQUEST_STOCK')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  activeBranchTab === 'REQUEST_STOCK'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Permintaan Stok Saya ({myStockRequests.length})</span>
              </button>
            </div>

            {/* CTA Button to open Request Modal */}
            <button
              onClick={() => {
                if (safeProducts.length > 0 && !reqProductId) {
                  setReqProductId(safeProducts[0].id);
                }
                setIsRequestModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Request Stok ke Pusat</span>
            </button>
          </div>

          {/* TAB 1: INCOMING DELIVERIES FROM HQ (GROUPED BY SURAT JALAN) */}
          {activeBranchTab === 'INCOMING_DELIVERIES' && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-amber-900 text-sm">Paket Kiriman Masuk dari Kantor Pusat</h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Kiriman dikelompokkan per Nomor Surat Jalan agar Anda dapat mengonfirmasi atau menolak seluruh paket kiriman sekaligus.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-amber-200/80 text-amber-900 rounded-xl font-extrabold text-xs whitespace-nowrap">
                    {pendingByDeliveryNote.length} Paket Kiriman
                  </span>
                  <span className="px-3 py-1 bg-amber-600 text-white rounded-xl font-extrabold text-xs whitespace-nowrap">
                    {pendingTransfers.length} Produk Menunggu
                  </span>
                </div>
              </div>

              {pendingByDeliveryNote.length > 0 ? (
                <div className="space-y-4">
                  {pendingByDeliveryNote.map((pkg) => {
                    const pkgKey = pkg.deliveryNote;
                    const isExpanded = expandedPackages[pkgKey] !== false; // Default expanded

                    return (
                      <div 
                        key={pkgKey} 
                        className="bg-white border-2 border-amber-300 rounded-2xl shadow-xs overflow-hidden transition hover:border-amber-400"
                      >
                        {/* Package Header */}
                        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50/50 via-white to-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 flex-shrink-0">
                              <Truck className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-extrabold text-slate-900 text-base sm:text-lg">
                                  No. Surat Jalan: {pkg.deliveryNote}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{pkg.items.length} Produk</span>
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                  Total +{pkg.totalQty} Pcs Fisik
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                Pengirim: <strong className="text-slate-700 font-semibold">{pkg.senderName}</strong> • Waktu Dikirim: <span className="text-slate-600">{formatDate(pkg.sentAt)}</span>
                              </p>
                              {pkg.notes && (
                                <p className="text-xs text-slate-600 italic mt-0.5">
                                  Catatan Pengiriman: "{pkg.notes}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Batch Action Buttons */}
                          <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingTransferTarget({ type: 'GROUP', data: pkg });
                                setTransferRejectReason('');
                                setTransferRejectError('');
                              }}
                              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-rose-200/60"
                            >
                              <Ban className="w-4 h-4" />
                              <span>Tolak / Retur ({pkg.items.length})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setConfirmingPackageGroup(pkg)}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/20 transition active:scale-95 flex items-center gap-2 cursor-pointer"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Terima Semua Paket ({pkg.items.length} Produk)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleExpandPackage(pkgKey)}
                              className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                              title={isExpanded ? "Sembunyikan Rincian Barang" : "Tampilkan Rincian Barang"}
                            >
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        {/* Package Items Table (Visible when expanded) */}
                        {isExpanded && (
                          <div className="p-4 sm:p-5 bg-slate-50/50">
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                                  <tr>
                                    <th className="px-4 py-3 min-w-[180px]">Nama Produk</th>
                                    <th className="px-3 py-3 whitespace-nowrap min-w-[110px]">Merk / Brand</th>
                                    <th className="px-3 py-3 font-mono whitespace-nowrap min-w-[120px]">SKU</th>
                                    <th className="px-3 py-3 text-center whitespace-nowrap min-w-[120px]">Kuantitas Kirim</th>
                                    <th className="px-3 py-3 min-w-[150px]">Catatan</th>
                                    <th className="px-4 py-3 text-right whitespace-nowrap min-w-[140px]">Aksi Satuan</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {pkg.items.map((item) => (
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
                                          +{item.qty} Pcs
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
                                              setRejectingTransferTarget({ type: 'SINGLE', data: item });
                                              setTransferRejectReason('');
                                              setTransferRejectError('');
                                            }}
                                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                            title="Tolak item ini saja"
                                          >
                                            <Ban className="w-3 h-3" />
                                            <span>Tolak</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setConfirmingSingleTransfer(item)}
                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                            title="Terima item ini saja"
                                          >
                                            <Check className="w-3 h-3" />
                                            <span>Terima</span>
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
                  })}
                </div>
              ) : (
                <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-2">
                  <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 stroke-1" />
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Jika stok fisik di cabang mulai menipis, Anda dapat menekan tombol <strong>+ Request Stok ke Pusat</strong> untuk mengajukan pengiriman baru.
                  </p>
                  <button
                    onClick={() => {
                      if (safeProducts.length > 0 && !reqProductId) {
                        setReqProductId(safeProducts[0].id);
                      }
                      setIsRequestModalOpen(true);
                    }}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl active:scale-95 transition cursor-pointer"
                  >
                    + Buat Permintaan Stok Sekarang
                  </button>
                </div>
              )}

              {/* Collapsible History of Received Shipments */}
              {receivedTransfers.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                      Riwayat Paket yang Telah Diterima ({receivedTransfers.length})
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    {receivedTransfers.map(rec => (
                      <div key={rec.id} className="p-3.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800">{rec.productName}</span>
                          <span className="text-slate-400 ml-1.5 font-mono">({rec.deliveryNote})</span>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Diterima: {formatDate(rec.receivedAt || rec.sentAt)}
                          </p>
                        </div>
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                          +{rec.qty} Pcs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY STOCK REQUESTS LIST */}
          {activeBranchTab === 'REQUEST_STOCK' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Send className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-indigo-900 text-sm">Daftar Pengajuan Permintaan Stok ke Pusat</h4>
                    <p className="text-xs text-indigo-800 mt-0.5">
                      Pantau status permintaan stok yang diajukan cabang ke Kantor Pusat.
                    </p>
                  </div>
                </div>
              </div>

              {myStockRequests.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
                  <Boxes className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                  <p className="text-sm font-medium">Belum ada pengajuan permintaan stok.</p>
                  <button
                    onClick={() => {
                      if (safeProducts.length > 0 && !reqProductId) {
                        setReqProductId(safeProducts[0].id);
                      }
                      setIsRequestModalOpen(true);
                    }}
                    className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl active:scale-95 transition cursor-pointer"
                  >
                    + Ajukan Permintaan Stok ke Pusat
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {myStockRequests.map(req => {
                      const isPending = req.status === 'PENDING';
                      const isRejected = req.status === 'REJECTED';
                      const isFulfilled = req.status === 'FULFILLED' || req.status === 'APPROVED';

                      return (
                        <div key={req.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-slate-50/70 transition">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm">{req.productName}</span>
                              <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                {req.brand || 'Generic'}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isPending 
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' 
                                  : isRejected
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}>
                                {isPending 
                                  ? '⏳ Menunggu Respon Pusat' 
                                  : isRejected
                                    ? '✕ Ditolak oleh Pusat'
                                    : `✓ Disetujui & Dikirim (${req.deliveryNote || 'Dalam Pengiriman'})`}
                              </span>
                            </div>
                            
                            <p className="text-xs text-slate-500 mt-1">
                              Diajukan pada: {formatDate(req.requestedAt)} • SKU: {req.sku}
                            </p>

                            {req.notes && (
                              <p className="text-xs text-slate-600 mt-0.5 italic">
                                "Catatan Permintaan: {req.notes}"
                              </p>
                            )}

                            {/* Rejection Reason Box */}
                            {isRejected && (
                              <div className="mt-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
                                <p className="font-bold text-rose-800">
                                  Alasan Penolakan dari Kantor Pusat:
                                </p>
                                <p className="mt-0.5 text-rose-950 font-medium">"{req.rejectionReason || 'Stok di gudang pusat tidak mencukupi saat ini.'}"</p>
                                <span className="text-[10px] text-rose-700 block mt-1">
                                  Ditinjau oleh: <strong>{req.rejectedBy || 'Staff Pusat'}</strong> ({formatDate(req.rejectedAt)})
                                </span>
                              </div>
                            )}

                            {/* Fulfilled Info Box */}
                            {isFulfilled && (
                              <div className="mt-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                                <p className="font-bold text-emerald-800">
                                  ✓ Telah Disetujui & Dikirimkan oleh Pusat
                                </p>
                                <p className="text-emerald-900 mt-0.5">
                                  No. Surat Jalan: <strong className="font-mono font-bold">{req.deliveryNote}</strong>
                                </p>
                                <span className="text-[10px] text-emerald-700 block mt-1">
                                  Silakan cek tab <strong>Kiriman dari Pusat</strong> untuk konfirmasi penerimaan setelah paket tiba.
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Jumlah Diminta</span>
                            <span className="text-base font-black text-indigo-900">{req.qty} Pcs</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      ) : (
        /* ========================================================================= */
        /* PUSAT / ADMIN VIEW: DIRECT INBOUND FROM FACTORY                           */
        /* ========================================================================= */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-5">


          <form onSubmit={handlePreSubmitBatchManifest} className="space-y-4">
            
            {/* Step 1: Search & Pick Products into Staging List */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Pilih / Cari Produk ke Dalam List Penerimaan Barang
                </span>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
                >
                  <Camera className="w-4 h-4 text-sky-600" />
                  <span>Scan Barcode</span>
                </button>
              </div>

              <ProductSearchPicker
                products={safeProducts}
                selectedProductId=""
                onSelectProduct={(prod) => handleAddItemToManifest(prod)}
                placeholder="🔍 Ketik Nama Produk, SKU, Merk, atau Kategori Mesin untuk menambah ke list..."
                label=""
                showStockInfo={true}
              />
            </div>

            {/* Step 2: Staging List Table with Inline Qty Input */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="p-3 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-950 uppercase tracking-wider">
                  📋 List Barang Masuk ({inboundManifest.length} Jenis Produk Dipilih)
                </span>
                {inboundManifest.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setInboundManifest([])}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800"
                  >
                    Kosongkan List
                  </button>
                )}
              </div>

              {inboundManifest.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Boxes className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                  <p className="text-xs font-medium">Belum ada barang yang dipilih ke dalam list penerimaan.</p>
                  <p className="text-[11px] text-slate-400">Gunakan kotak pencarian atau scanner barcode di atas untuk menambah barang.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100/80 text-slate-600 font-semibold uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5 min-w-[200px]">Produk & Kategori</th>
                        <th className="px-3 py-2.5 text-center whitespace-nowrap min-w-[140px]">Kuantitas Masuk (Pcs)</th>
                        <th className="px-3 py-2.5 text-right whitespace-nowrap min-w-[120px]">Harga Beli / HPP</th>
                        <th className="px-3 py-2.5 min-w-[160px]">Supplier / No. Faktur</th>
                        <th className="px-4 py-2.5 text-right whitespace-nowrap min-w-[70px]">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inboundManifest.map((item, idx) => (
                        <tr key={item.productId} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-900 min-w-[200px]">
                            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                              <span className="font-bold text-slate-900 leading-snug">{item.productName}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap flex-shrink-0">
                                {item.machineCategory}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span className="whitespace-nowrap font-bold text-slate-600">SKU: {item.sku}</span>
                              <span>|</span>
                              <span className="whitespace-nowrap text-indigo-600 font-semibold">Brand: {item.brand}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateManifestField(idx, 'qty_in', Math.max(1, (Number(item.qty_in) || 1) - 1))}
                                className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center justify-center transition active:scale-95"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.qty_in}
                                onChange={(e) => handleUpdateManifestField(idx, 'qty_in', Math.max(1, Number(e.target.value)))}
                                className="w-16 py-1 bg-emerald-50 border border-emerald-300 rounded-lg text-center font-extrabold text-emerald-950 text-xs focus:ring-2 focus:ring-emerald-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateManifestField(idx, 'qty_in', (Number(item.qty_in) || 1) + 1)}
                                className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center justify-center transition active:scale-95"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={item.buyPrice}
                              onChange={(e) => handleUpdateManifestField(idx, 'buyPrice', Number(e.target.value))}
                              className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="space-y-1">
                              <input
                                type="text"
                                placeholder="Supplier (Opsional)"
                                value={item.supplier}
                                onChange={(e) => handleUpdateManifestField(idx, 'supplier', e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] focus:ring-2 focus:ring-emerald-500"
                              />
                              <input
                                type="text"
                                placeholder="No. Faktur (Opsional)"
                                value={item.invoiceNo}
                                onChange={(e) => handleUpdateManifestField(idx, 'invoiceNo', e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] focus:ring-2 focus:ring-emerald-500 font-mono"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveFromManifest(idx)}
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

            {/* Step 3: Batch Delivery Note & Notes Header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  No. Surat Jalan / No. Batch Pabrik (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SJ-PABRIK-2026-001 (Otomatis jika kosong)"
                  value={deliveryNoteNumber}
                  onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Barang datang via Truk A"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Submit Multi-Item Inbound */}
            <button
              type="submit"
              disabled={inboundManifest.length === 0}
              className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                inboundManifest.length === 0 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Simpan Penerimaan Barang Masuk ({inboundManifest.length} Jenis Produk • Total {inboundManifest.reduce((acc, i) => acc + (Number(i.qty_in) || 0), 0)} Pcs)</span>
            </button>
          </form>

        </div>
      )}



      {/* ========================================================================= */}
      {/* MODAL: BRANCH REQUEST STOCK TO HQ                                         */}
      {/* ========================================================================= */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-indigo-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Ajukan Permintaan Stok ke Pusat</h3>
                  <p className="text-xs text-slate-400">Pusat akan menerima notifikasi dan mengirimkan stok ke cabang Anda.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRequestModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePreSubmitStockRequest} className="p-6 space-y-4 text-sm">
              
              {/* Product Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Produk dari Master Katalog *
                </label>
                <select
                  required
                  value={reqProductId}
                  onChange={(e) => setReqProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {safeProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.brand || 'Generic'}] ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Kuantitas yang Diminta (Qty Pcs) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Contoh: 50"
                  value={reqQty}
                  onChange={(e) => setReqQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan / Keterangan Kebutuhan Cabang
                </label>
                <textarea
                  rows="3"
                  placeholder="Contoh: Stok di cabang tersisa 5 pcs, mohon dikirimkan segera."
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-bold">🚚 Prosedur Pengiriman:</p>
                <p className="text-[11px] text-amber-800">
                  Kantor Pusat akan memproses pengiriman dengan Surat Jalan resmi. Anda tinggal menunggu barang tiba dan menekan tombol <strong>Konfirmasi Paket Diterima</strong>.
                </p>
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
                  disabled={isSubmittingReq}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingReq ? 'Mengirim...' : 'Kirim Permintaan ke Pusat'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Transaction Success Pop-Up Modal */}
      <TransactionSuccessModal
        isOpen={Boolean(successModalData)}
        transaction={successModalData}
        onClose={() => setSuccessModalData(null)}
      />

      {/* STOCK REQUEST SUBMITTED SUCCESS POP-UP MODAL */}
      <GlobalSuccessModal
        isOpen={Boolean(successRequestData)}
        onClose={() => setSuccessRequestData(null)}
        title="Permintaan Stok Berhasil Dikirim!"
        message="Pengajuan permintaan stok barang telah berhasil tercatat dan ternotifikasi ke Kantor Pusat."
        details={successRequestData ? [
          { label: "Nama Produk", value: successRequestData.productName },
          { label: "Kuantitas Diminta", value: `+${successRequestData.qty} Pcs`, highlight: true },
          { label: "Status Permintaan", value: "Menunggu Respon Pusat" },
          ...(successRequestData.notes ? [{ label: "Catatan", value: successRequestData.notes }] : [])
        ] : null}
        buttonText="✓ Selesai & Tutup"
      />

      {/* ========================================================================= */}
      {/* CONFIRMATION MODALS                                                       */}
      {/* ========================================================================= */}

      {/* 1. CONFIRMATION: BATCH INBOUND TO PUSAT */}
      {pendingConfirmBatchInbound && (
        <ConfirmationModal
          isOpen={Boolean(pendingConfirmBatchInbound)}
          onClose={() => setPendingConfirmBatchInbound(null)}
          onConfirm={handleExecuteBatchManifest}
          title="Konfirmasi Penerimaan Barang Masuk"
          subtitle="Periksa kembali daftar fisik barang sebelum menambah stok gudang pusat."
          type="SUCCESS"
          confirmText="Ya, Simpan Barang Masuk"
          cancelText="← Periksa Lagi"
          isLoading={isExecutingAction}
          maxWidth="max-w-xl"
          summaryItems={[
            { label: "Lokasi Penerimaan", value: "Gudang Utama Pusat", highlight: true },
            { label: "Total Jenis Barang", value: `${pendingConfirmBatchInbound.items.length} Produk` },
            { label: "Total Kuantitas Masuk", value: `+${pendingConfirmBatchInbound.totalQty} Pcs`, color: 'text-emerald-700 font-extrabold text-sm' },
            { label: "No. Surat Jalan / Batch", value: pendingConfirmBatchInbound.deliveryNote },
            { label: "Petugas Penerima", value: pendingConfirmBatchInbound.user }
          ]}
          itemsList={pendingConfirmBatchInbound.items.map(item => ({
            name: item.productName,
            sku: item.sku,
            brand: item.brand,
            qty: item.qty_in,
            unit: 'Pcs',
            note: item.supplier ? `Supplier: ${item.supplier}` : 'Pabrik Produksi Pusat'
          }))}
          itemsTitle="Daftar Barang Masuk:"
          warningNote="Stok fisik gudang pusat akan langsung bertambah sesuai kuantitas yang dikonfirmasi."
        />
      )}

      {/* 2. CONFIRMATION: REQUEST STOCK TO PUSAT */}
      {pendingConfirmRequest && (
        <ConfirmationModal
          isOpen={Boolean(pendingConfirmRequest)}
          onClose={() => setPendingConfirmRequest(null)}
          onConfirm={handleExecuteStockRequest}
          title="Konfirmasi Permintaan Stok ke Pusat"
          subtitle="Permintaan stok akan tercatat di sistem Kantor Pusat untuk diproses pengirimannya."
          type="PRIMARY"
          confirmText="Ya, Kirim Permintaan"
          cancelText="← Cek Kembali"
          isLoading={isExecutingAction}
          summaryItems={[
            { label: "Cabang Pemohon", value: currentUser?.branchName || 'Cabang', highlight: true },
            { label: "Nama Produk", value: pendingConfirmRequest.productName },
            { label: "SKU Produk", value: pendingConfirmRequest.sku },
            { label: "Jumlah Diminta", value: `+${pendingConfirmRequest.qty} Pcs`, color: 'text-indigo-700 font-bold' },
            { label: "Catatan Permintaan", value: pendingConfirmRequest.notes || '-' }
          ]}
          warningNote="Admin / Staff Pusat akan memverifikasi ketersediaan stok fisik di pusat sebelum mengirimkannya ke cabang Anda."
        />
      )}

      {/* 3. CONFIRMATION: BATCH PACKAGE RECEIPT (GROUP) */}
      {confirmingPackageGroup && (
        <ConfirmationModal
          isOpen={Boolean(confirmingPackageGroup)}
          onClose={() => setConfirmingPackageGroup(null)}
          onConfirm={handleExecuteConfirmPackageGroup}
          title={`Konfirmasi Penerimaan Paket (No. SJ: ${confirmingPackageGroup.deliveryNote})`}
          subtitle="Pastikan seluruh fisik produk dalam paket ini telah tiba dan diperiksa dalam kondisi baik."
          type="SUCCESS"
          confirmText={`Ya, Terima Seluruh Paket (${confirmingPackageGroup.items.length} Produk)`}
          cancelText="Batal"
          isLoading={isExecutingAction}
          maxWidth="max-w-xl"
          summaryItems={[
            { label: "No. Surat Jalan", value: confirmingPackageGroup.deliveryNote, highlight: true },
            { label: "Total Jenis Produk", value: `${confirmingPackageGroup.items.length} Produk` },
            { label: "Total Kuantitas Fisik", value: `+${confirmingPackageGroup.totalQty} Pcs`, color: 'text-emerald-700 font-extrabold text-sm' },
            { label: "Petugas Pengirim (Pusat)", value: confirmingPackageGroup.senderName },
            { label: "Cabang Penerima", value: currentUser?.branchName || 'Cabang' }
          ]}
          itemsList={confirmingPackageGroup.items.map(item => ({
            name: item.productName,
            sku: item.sku,
            brand: item.brand,
            qty: item.qty,
            unit: item.unit || 'Pcs',
            note: item.notes || '-'
          }))}
          itemsTitle="Daftar Produk dalam Paket:"
          warningNote="Setelah dikonfirmasi, seluruh stok fisik produk di atas akan otomatis aktif dan bertambah di database inventaris cabang Anda."
        />
      )}

      {/* 4. CONFIRMATION: SINGLE TRANSFER ITEM RECEIPT */}
      {confirmingSingleTransfer && (
        <ConfirmationModal
          isOpen={Boolean(confirmingSingleTransfer)}
          onClose={() => setConfirmingSingleTransfer(null)}
          onConfirm={handleExecuteConfirmSingleTransfer}
          title="Konfirmasi Penerimaan Produk Ini?"
          subtitle="Pastikan fisik produk telah diterima dalam kondisi baik."
          type="SUCCESS"
          confirmText="Ya, Konfirmasi Terima Produk"
          cancelText="Batal"
          isLoading={isExecutingAction}
          summaryItems={[
            { label: "Nama Produk", value: confirmingSingleTransfer.productName, highlight: true },
            { label: "SKU Produk", value: confirmingSingleTransfer.sku },
            { label: "Jumlah Diterima", value: `+${confirmingSingleTransfer.qty} Pcs`, color: 'text-emerald-700 font-extrabold text-sm' },
            { label: "No. Surat Jalan", value: confirmingSingleTransfer.deliveryNote || '-' },
            { label: "Pengirim", value: confirmingSingleTransfer.senderName || 'Kantor Pusat' }
          ]}
          warningNote="Stok produk ini akan langsung aktif di database cabang Anda."
        />
      )}

      {/* 5. MODAL: DECLINE / RETURN TRANSFER (WITH DESCRIPTION) */}
      {rejectingTransferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-rose-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Ban className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {rejectingTransferTarget.type === 'GROUP' 
                      ? `Tolak / Retur Paket (${rejectingTransferTarget.data.deliveryNote})` 
                      : `Tolak Produk "${rejectingTransferTarget.data.productName}"`}
                  </h3>
                  <p className="text-xs text-rose-600 font-medium">Beri deskripsi / alasan penolakan paket</p>
                </div>
              </div>
              <button 
                onClick={() => setRejectingTransferTarget(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="text-slate-500">
                  Target: <strong className="text-slate-800">{rejectingTransferTarget.type === 'GROUP' ? `Paket No. SJ ${rejectingTransferTarget.data.deliveryNote} (${rejectingTransferTarget.data.items.length} Produk, Total +${rejectingTransferTarget.data.totalQty} Pcs)` : `${rejectingTransferTarget.data.productName} (+${rejectingTransferTarget.data.qty} Pcs)`}</strong>
                </div>
                <div className="text-slate-500">
                  Pengirim: <strong className="text-slate-700">{rejectingTransferTarget.type === 'GROUP' ? rejectingTransferTarget.data.senderName : (rejectingTransferTarget.data.senderName || 'Staff Pusat')}</strong>
                </div>
              </div>

              {transferRejectError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{transferRejectError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Deskripsi / Alasan Retur / Penolakan *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Paket rusak saat pengiriman, barang tidak sampai, kuantitas fisik kurang dari surat jalan..."
                  value={transferRejectReason}
                  onChange={(e) => {
                    setTransferRejectReason(e.target.value);
                    if (transferRejectError) setTransferRejectError('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none transition leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Deskripsi penolakan ini akan dikirimkan sebagai notifikasi ke Kantor Pusat (HQ).
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingTransferTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isExecutingAction}
                  onClick={handleExecuteRejectTransfer}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{isExecutingAction ? 'Memproses...' : (rejectingTransferTarget.type === 'GROUP' ? `Tolak Semua (${rejectingTransferTarget.data.items.length} Produk)` : 'Tolak Produk Ini')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE CUSTOM ALERT MODAL */}
      <CustomAlertModal
        isOpen={Boolean(alertModal)}
        onClose={() => setAlertModal(null)}
        title={alertModal?.title}
        message={alertModal?.message}
        type={alertModal?.type}
      />

      {/* SCANNER MODAL FOR BARCODE / SMART QR */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

    </div>
  );
}

