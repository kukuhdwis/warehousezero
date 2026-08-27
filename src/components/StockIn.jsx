import React, { useState } from 'react';
import { 
  ArrowDownLeft, 
  Camera, 
  CheckCircle, 
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
  Trash2
} from 'lucide-react';
import ScannerModal from './ScannerModal';
import TransactionSuccessModal from './TransactionSuccessModal';
import GlobalSuccessModal from './GlobalSuccessModal';
import ProductSearchPicker from './ProductSearchPicker';
import CustomAlertModal from './CustomAlertModal';


export default function StockIn({ 
  currentUser, 
  products = [], 
  branches = [], 
  transfers = [], 
  stockRequests = [], 
  initialTab = 'INCOMING_DELIVERIES',
  onRecordMovement, 
  onConfirmTransfer, 
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

  // Request Stock Form State (Branch -> Pusat)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqProductId, setReqProductId] = useState(products[0]?.id || '');
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


  // Safe Arrays
  const safeTransfers = Array.isArray(transfers) ? transfers : [];
  const safeStockRequests = Array.isArray(stockRequests) ? stockRequests : [];
  const safeProducts = Array.isArray(products) ? products : [];

  // Get all unique categories for filtering
  const allInboundCategories = Array.from(
    new Set(safeProducts.map(p => p.machineCategory || p.kategoriMesin || 'Universal / Semua Mesin'))
  );

  const handleAddItemToManifest = (product) => {
    if (!product) return;
    const existingIdx = inboundManifest.findIndex(item => item.productId === product.id);
    if (existingIdx !== -1) {
      const updated = [...inboundManifest];
      updated[existingIdx].qty_in += 1;
      setInboundManifest(updated);
    } else {
      setInboundManifest([
        ...inboundManifest,
        {
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          brand: product.brand || 'Generic',
          machineCategory: product.machineCategory || product.kategoriMesin || 'Universal',
          qty_in: 1,
          buyPrice: product.price || 0,
          supplier: '',
          invoiceNo: '',
          batchNo: '',
          expiredDate: ''
        }
      ]);
    }
  };

  const handleUpdateManifestField = (index, field, value) => {
    const updated = [...inboundManifest];
    updated[index][field] = value;
    setInboundManifest(updated);
  };

  const handleRemoveFromManifest = (index) => {
    setInboundManifest(inboundManifest.filter((_, i) => i !== index));
  };

  const handleBatchManifestSubmit = async (e) => {
    e.preventDefault();
    if (inboundManifest.length === 0) {
      showAlert("List Barang Kosong 📋", "Pilih minimal 1 produk ke dalam list penerimaan barang!", "WARNING");
      return;
    }

    try {
      const batchDeliveryNote = deliveryNoteNumber.trim() || `SJ-PABRIK-${Date.now().toString().slice(-6)}`;
      const summaryText = inboundManifest.map(item => `${item.qty_in}x ${item.productName}`).join(' + ');
      
      for (const item of inboundManifest) {
        const itemNotes = `Penerimaan Barang Masuk Gudang Pusat • ${item.productName} (${item.qty_in} Pcs)${item.supplier ? ` • Supplier: ${item.supplier}` : ''}${item.invoiceNo ? ` • No. Faktur: ${item.invoiceNo}` : ''}${notes.trim() ? ` • Catatan: ${notes.trim()}` : ''}`;

        await onRecordMovement({
          productId: item.productId,
          sku: item.sku,
          productName: item.productName,
          type: 'IN',
          qty: Math.max(1, Number(item.qty_in) || 1),
          unit: 'Pcs',
          notes: itemNotes,
          source: item.supplier || 'PABRIK_PRODUKSI_PUSAT',
          deliveryNote: item.invoiceNo || batchDeliveryNote,
          user: user || currentUser?.name || 'Staff Pusat'
        });
      }

      const totalQty = inboundManifest.reduce((acc, i) => acc + (Number(i.qty_in) || 0), 0);

      setSuccessModalData({
        productName: `${inboundManifest.length} Jenis Produk Inbound`,
        sku: 'BATCH-INBOUND',
        type: 'IN',
        qty: totalQty,
        notes: `Penerimaan ${inboundManifest.length} jenis barang ke gudang pusat [${summaryText}]${notes.trim() ? ` • Catatan: ${notes.trim()}` : ''}`,
        deliveryNote: batchDeliveryNote,
        user: user || currentUser?.name || 'Staff Pusat'
      });

      setInboundManifest([]);
      setDeliveryNoteNumber('');
      setNotes('');
    } catch (err) {
      showAlert("Gagal Menyimpan Inbound", err.message, "ERROR");
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
    t => t && t.status === 'IN_TRANSIT' && (t.targetBranchId === currentUser?.branchId || t.targetBranchId === 'ALL')
  );

  // Completed received transfers for this branch
  const receivedTransfers = safeTransfers.filter(
    t => t && t.status === 'RECEIVED' && (t.targetBranchId === currentUser?.branchId || t.targetBranchId === 'ALL')
  );

  // Branch Stock Requests
  const myStockRequests = safeStockRequests.filter(
    r => r && (isBranchStaff ? r.branchId === currentUser?.branchId : true)
  );

  const selectedProduct = safeProducts.find(p => p.id === selectedProductId || p.sku === selectedProductId);

  const handleScanSuccess = (scannedText) => {
    const matched = safeProducts.find(
      p => p.sku?.toLowerCase() === scannedText?.toLowerCase() || 
           p.barcode?.toLowerCase() === scannedText?.toLowerCase()
    );
    if (matched) {
      setSelectedProductId(matched.id);
    } else {
      showAlert("Barcode Tidak Ditemukan 🔍", `Produk dengan SKU/Barcode "${scannedText}" tidak ditemukan di database.`, "WARNING");
    }
  };

  // One-click Confirm Receipt of Central Transfer by Branch
  const handleConfirmReceipt = async (transfer) => {
    if (!window.confirm(`Konfirmasi penerimaan ${transfer.qty} Pcs "${transfer.productName}" (No. Surat Jalan: ${transfer.deliveryNote})?\n\nStok akan langsung aktif dan ditambahkan ke database inventaris cabang Anda.`)) {
      return;
    }

    try {
      setConfirmingTransferId(transfer.id);
      if (onConfirmTransfer) {
        await onConfirmTransfer(transfer.id, 'Barang fisik telah diperiksa & diterima dalam kondisi baik.');
        
        // Show Transaction Success Pop-Up
        setSuccessModalData({
          productId: transfer.productId,
          sku: transfer.sku,
          productName: transfer.productName,
          type: 'IN',
          qty: Number(transfer.qty),
          unit: 'Pcs',
          notes: `Penerimaan Kiriman dari Kantor Pusat (Pcs) • No. Surat Jalan: ${transfer.deliveryNote}`,
          source: 'KANTOR_PUSAT',
          deliveryNote: transfer.deliveryNote,
          targetBranchName: transfer.targetBranchName,
          user: currentUser?.name || 'Staff Cabang'
        });
      }
    } catch (err) {
      showAlert("Gagal Mengonfirmasi Penerimaan", err.message, "ERROR");
    } finally {
      setConfirmingTransferId(null);
    }
  };

  // Submit Stock Request to Central Office (Branch -> HQ)
  const handleSubmitStockRequest = async (e) => {
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

    setIsSubmittingReq(true);
    try {
      const payload = {
        productId: targetP.id,
        sku: targetP.sku,
        productName: targetP.name,
        brand: targetP.brand,
        qty: Number(reqQty),
        notes: reqNotes.trim()
      };

      if (onRequestStock) {
        await onRequestStock(payload);
      }

      setIsRequestModalOpen(false);
      setReqNotes('');
      setReqQty(10);
      setActiveBranchTab('REQUEST_STOCK');
      setSuccessRequestData(payload);
    } catch (err) {
      showAlert("Gagal Mengirim Permintaan", err.message, "ERROR");
    } finally {
      setIsSubmittingReq(false);
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

          {/* TAB 1: INCOMING DELIVERIES FROM HQ */}
          {activeBranchTab === 'INCOMING_DELIVERIES' && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-amber-900 text-sm">Paket Kiriman Masuk dari Kantor Pusat</h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Klik <strong>✓ Konfirmasi Paket Diterima</strong> untuk memasukkan barang langsung ke database inventaris cabang Anda.
                    </p>
                  </div>
                </div>
                {pendingTransfers.length > 0 && (
                  <span className="px-3 py-1 bg-amber-200/80 text-amber-900 rounded-xl font-extrabold text-xs flex-shrink-0">
                    {pendingTransfers.length} Menunggu
                  </span>
                )}
              </div>

              {pendingTransfers.length > 0 ? (
                <div className="space-y-3">
                  {pendingTransfers.map(trf => (
                    <div 
                      key={trf.id} 
                      className="bg-white border-2 border-amber-300 p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-amber-400"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-base">{trf.productName}</span>
                            <span className="px-2 py-0.2 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800">
                              {trf.brand || 'Generic'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                              🚚 Dalam Perjalanan
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            No. Surat Jalan: <strong className="text-slate-800 font-mono">{trf.deliveryNote}</strong> • Pengirim: <strong className="text-slate-700">{trf.senderName || 'Staff Pusat'}</strong> ({formatDate(trf.sentAt)})
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs">
                            <span className="font-semibold text-slate-600">SKU: <strong className="font-mono">{trf.sku}</strong></span>
                            <span className="text-slate-300">•</span>
                            <span className="font-extrabold text-emerald-700 text-sm">
                              Kuantitas Kirim: +{trf.qty} Pcs
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleConfirmReceipt(trf)}
                        disabled={confirmingTransferId === trf.id}
                        className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap self-stretch sm:self-center"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{confirmingTransferId === trf.id ? 'Memproses...' : '✓ Konfirmasi Paket Diterima'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-2">
                  <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 stroke-1" />
                  <p className="text-sm font-bold text-slate-800">Semua kiriman dari Kantor Pusat telah diterima.</p>
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


          <form onSubmit={handleBatchManifestSubmit} className="space-y-4">
            
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
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="px-4 py-2.5">Produk & Kategori</th>
                        <th className="px-3 py-2.5 text-center w-36">Kuantitas Masuk (Pcs)</th>
                        <th className="px-3 py-2.5 text-right w-32">Harga Beli / HPP</th>
                        <th className="px-3 py-2.5">Supplier / No. Faktur</th>
                        <th className="px-4 py-2.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inboundManifest.map((item, idx) => (
                        <tr key={item.productId} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span>{item.productName}</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
                                {item.machineCategory}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">{item.sku} | Brand: {item.brand}</span>
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

            <form onSubmit={handleSubmitStockRequest} className="p-6 space-y-4 text-sm">
              
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

      {/* Barcode Scanner Camera Modal (For Pusat Inbound) */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

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

