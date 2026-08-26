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
  Sparkles
} from 'lucide-react';
import ScannerModal from './ScannerModal';
import TransactionSuccessModal from './TransactionSuccessModal';
import GlobalSuccessModal from './GlobalSuccessModal';

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

  // Single Item State (For Retail Pcs / HQ Transfer)
  const [selectedProductId, setSelectedProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [targetBranchId, setTargetBranchId] = useState(branches[0]?.id || '');
  const [customerName, setCustomerName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' | 'TRANSFER' | 'QRIS'
  const [notes, setNotes] = useState('');
  const [user, setUser] = useState(currentUser?.name || (isBranchStaff ? 'Staff Kasir Cabang' : 'Staff Toko/Gudang Pusat'));
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
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
      alert("Gagal menolak permintaan: " + err.message);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId || p.sku === selectedProductId);
  const currentAvailable = Number(selectedProduct?.currentStock) || 0;
  const isInsufficient = Number(qty) > currentAvailable;

  const isSaleMode = outboundMode === 'RETAIL_PCS' || outboundMode === 'CUSTOM_BUNDLING';
  const isTransferMode = outboundMode === 'STOCK_TRANSFER_TO_BRANCH';

  // Scanner handler
  const handleScanSuccess = (scannedText) => {
    const matched = products.find(
      p => p.sku.toLowerCase() === scannedText.toLowerCase() || 
           p.barcode?.toLowerCase() === scannedText.toLowerCase()
    );
    if (matched) {
      if (outboundMode !== 'CUSTOM_BUNDLING') {
        setSelectedProductId(matched.id);
      } else {
        const existingIdx = bundleItems.findIndex(bi => bi.productId === matched.id);
        if (existingIdx !== -1) {
          const updated = [...bundleItems];
          updated[existingIdx].qty += 1;
          setBundleItems(updated);
        } else {
          setBundleItems([...bundleItems, { productId: matched.id, qty: 1 }]);
        }
      }
    } else {
      alert(`Produk dengan SKU/Barcode "${scannedText}" tidak ditemukan di database.`);
    }
  };

  // Bundling Helper: Add Component Row
  const handleAddBundleComponent = () => {
    const availableProd = products.find(p => !bundleItems.some(bi => bi.productId === p.id)) || products[0];
    if (availableProd) {
      setBundleItems([...bundleItems, { productId: availableProd.id, qty: 1 }]);
    }
  };

  // Bundling Helper: Update Component Row
  const handleUpdateBundleComponent = (index, field, value) => {
    const updated = [...bundleItems];
    updated[index] = { ...updated[index], [field]: value };
    setBundleItems(updated);
  };

  // Bundling Helper: Remove Component Row
  const handleRemoveBundleComponent = (index) => {
    if (bundleItems.length <= 1) {
      alert("Paket bundling minimal harus memiliki 1 komponen produk.");
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

  // Step 1: Open Confirmation Modal Before Processing Single Item Outbound
  const handlePrepareSingleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert("Silakan pilih produk terlebih dahulu!");
      return;
    }
    if (Number(qty) <= 0) {
      alert("Jumlah kuantitas (Pcs) harus lebih besar dari 0!");
      return;
    }
    if (isInsufficient) {
      alert(`Stok tidak mencukupi! Stok tersedia hanya ${currentAvailable} Pcs.`);
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
      // Retail Sale (Either at Branch or Central Physical Store)
      const unitPrice = Number(selectedProduct.price) || 0;
      const totalPrice = unitPrice * Number(qty);
      const notaNo = invoiceNumber || `NOTA-${Math.floor(1000 + Math.random() * 9000)}`;
      const locationLabel = isBranchStaff ? currentUser?.branchName || 'Cabang' : 'Toko Fisik Pusat';

      finalNotes = `Penjualan Satuan (${locationLabel} - ${qty} Pcs) • Pembeli: ${customerName || 'Walk-in Customer'} • No. Nota: ${notaNo} • Bayar: ${paymentMethod}${notes ? ` • ${notes}` : ''}`;
      movementTypeData = {
        transactionType: 'RETAIL_PCS',
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

  // Step 2: User Confirmed -> Execute and Show Success Pop-Up
  const handleExecuteConfirmed = async () => {
    if (!pendingConfirm) return;
    setIsProcessing(true);

    try {
      await onRecordMovement(pendingConfirm);

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
      alert("Gagal memproses transaksi: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 1: Open Confirmation Modal for Bundling Sale
  const handlePrepareBundlingSubmit = (e) => {
    e.preventDefault();
    if (!bundleName.trim()) {
      alert("Masukkan nama paket bundling!");
      return;
    }
    if (bundleItems.length === 0) {
      alert("Paket bundling harus memiliki minimal 1 komponen produk.");
      return;
    }
    if (isBundleStockInsufficient) {
      alert("Salah satu komponen bundling melebihi stok yang tersedia!");
      return;
    }

    const totalBundlePrice = bundleCustomPrice ? Number(bundleCustomPrice) : bundleRegularTotal;
    const notaNo = invoiceNumber || `NOTA-BUNDLE-${Math.floor(1000 + Math.random() * 9000)}`;
    const locationLabel = isBranchStaff ? currentUser?.branchName || 'Cabang' : 'Toko Fisik Pusat';

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
      notes: `Penjualan Paket Bundling (${locationLabel}) • "${bundleName}" [${itemsSummary}] • Pembeli: ${customerName || 'Walk-in Customer'} • Total: Rp ${totalBundlePrice.toLocaleString('id-ID')} • No. Nota: ${notaNo}`,
      user: user || currentUser?.name || 'Staff',
      transactionType: 'CUSTOM_BUNDLING',
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
        
        {/* OUTBOUND MODE SELECTOR */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Pilih Jenis Pengeluaran Barang (Outbound)
          </label>
          <div className={`grid gap-3 ${!isBranchStaff ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}>
            
            {/* OPSI A: MUTASI KE CABANG (PUSAT ONLY) */}
            {!isBranchStaff && (
              <button
                type="button"
                onClick={() => setOutboundMode('STOCK_TRANSFER_TO_BRANCH')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  outboundMode === 'STOCK_TRANSFER_TO_BRANCH'
                    ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20 text-indigo-950'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 ${outboundMode === 'STOCK_TRANSFER_TO_BRANCH' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-xs sm:text-sm">1. Kirim ke Cabang</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Kirim mutasi stok per pcs dengan Surat Jalan.</p>
                </div>
              </button>
            )}

            {/* OPSI B: PENJUALAN SATUAN (RETAIL PCS) */}
            <button
              type="button"
              onClick={() => setOutboundMode('RETAIL_PCS')}
              className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                outboundMode === 'RETAIL_PCS'
                  ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 text-emerald-950'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className={`p-2 rounded-xl flex-shrink-0 ${outboundMode === 'RETAIL_PCS' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <Store className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs sm:text-sm">{!isBranchStaff ? '2. Penjualan Toko' : '1. Penjualan Satuan'}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">Per Pcs</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {!isBranchStaff ? 'Jual produk satuan di toko fisik pusat.' : 'Penjualan 1 jenis produk per pcs langsung.'}
                </p>
              </div>
            </button>

            {/* OPSI C: PAKET BUNDLING */}
            <button
              type="button"
              onClick={() => setOutboundMode('CUSTOM_BUNDLING')}
              className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                outboundMode === 'CUSTOM_BUNDLING'
                  ? 'border-purple-500 bg-purple-50/70 ring-2 ring-purple-500/20 text-purple-950'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className={`p-2 rounded-xl flex-shrink-0 ${outboundMode === 'CUSTOM_BUNDLING' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs sm:text-sm">{!isBranchStaff ? '3. Paket Bundling' : '2. Paket Bundling'}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded">Combo</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Jual gabungan beberapa barang sekaligus.</p>
              </div>
            </button>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1 & 2: SINGLE ITEM (MUTASI KE CABANG ATAU PENJUALAN SATUAN)          */}
        {/* ========================================================================= */}
        {(outboundMode === 'STOCK_TRANSFER_TO_BRANCH' || outboundMode === 'RETAIL_PCS') && (
          <form onSubmit={handlePrepareSingleSubmit} className="space-y-4 pt-2">
            
            {/* Step 1: Scan / Select Product */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  1. Pilih / Scan Produk dari Gudang (Per Pcs)
                </label>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-sky-600" />
                  <span>Scan Barcode</span>
                </button>
              </div>

              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value="">-- Pilih Produk dari Gudang ({products.length} Tersedia) --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} [{p.brand || 'Generic'}] ({p.sku}) — Stok Tersedia: {p.currentStock} Pcs
                  </option>
                ))}
              </select>
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

            {/* Step 2: Destination or Customer Details */}
            {isTransferMode ? (
              /* MUTASI KE CABANG */
              <div className="space-y-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  <span>Tujuan Pengiriman Mutasi Cabang</span>
                </div>

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
                    placeholder="Contoh: SJ-HQ-2026-001 (Otomatis jika kosong)"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              /* PENJUALAN SATUAN (RETAIL PCS) */
              <div className="space-y-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>Informasi Pembeli & Transaksi Penjualan Satuan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Pembeli / Pelanggan
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Walk-in Customer / Bpk Andi"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Metode Pembayaran
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="CASH">Tunai (Cash)</option>
                      <option value="TRANSFER">Transfer Bank</option>
                      <option value="QRIS">QRIS / E-Wallet</option>
                    </select>
                  </div>
                </div>

                {selectedProduct && Number(selectedProduct.price) > 0 && (
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500">Harga Satuan:</span>
                      <strong className="text-slate-800 ml-1">Rp {Number(selectedProduct.price).toLocaleString('id-ID')} / Pcs</strong>
                    </div>
                    <div>
                      <span className="text-emerald-700 font-bold">Total Pembayaran:</span>
                      <strong className="text-base font-black text-emerald-700 ml-1.5">
                        Rp {(Number(selectedProduct.price) * Number(qty)).toLocaleString('id-ID')}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Stepper */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Kuantitas Keluar (Qty Pcs) *
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
                  className="flex-1 h-12 text-center text-lg font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-slate-900"
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

            {/* Notes & Staff User */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Petugas Pelaksana (Staff)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan Transaksi (Opsional)
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Keterangan tambahan..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Stock Reduction Simulation */}
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
              className={`w-full py-3.5 text-white font-bold rounded-xl text-sm shadow-md transition active:scale-98 cursor-pointer mt-2 ${
                isTransferMode 
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' 
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              } disabled:bg-slate-200 disabled:text-slate-400`}
            >
              {isTransferMode 
                ? `Kirim Stok Mutasi ke Cabang (${qty} Pcs)` 
                : `Proses Penjualan Satuan (${qty} Pcs)`}
            </button>

          </form>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: CUSTOM BUNDLING SALE                                              */}
        {/* ========================================================================= */}
        {outboundMode === 'CUSTOM_BUNDLING' && (
          <form onSubmit={handlePrepareBundlingSubmit} className="space-y-4 pt-2">
            
            <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl flex items-start gap-2.5 text-xs text-purple-900">
              <Boxes className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Penjualan Paket Bundling Combo:</p>
                <p className="text-[11px] text-purple-800 mt-0.5">
                  Gabungkan beberapa produk per pcs menjadi satu paket penjualan. Stok masing-masing barang akan otomatis terpotong sesuai kuantitas komponennya.
                </p>
              </div>
            </div>

            {/* Bundle Name & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Paket Bundling *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Paket Hemat 3 Botol + Tutup"
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
                        <select
                          value={item.productId}
                          onChange={(e) => handleUpdateBundleComponent(idx, 'productId', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} [{p.brand || 'Generic'}] (Stok: {p.currentStock} Pcs)
                            </option>
                          ))}
                        </select>
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

            {/* Customer & Payment for Bundling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Pembeli / Pelanggan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Walk-in Customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="CASH">Tunai (Cash)</option>
                  <option value="TRANSFER">Transfer Bank</option>
                  <option value="QRIS">QRIS / E-Wallet</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isBundleStockInsufficient}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-sm shadow-md shadow-purple-600/20 transition active:scale-98 cursor-pointer mt-2"
            >
              Proses Penjualan Paket Bundling
            </button>

          </form>
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

    </div>
  );
}
