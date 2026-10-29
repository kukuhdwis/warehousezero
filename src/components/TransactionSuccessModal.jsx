import React from 'react';
import { 
  CheckCircle2, 
  Printer, 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Package, 
  Building2, 
  User, 
  FileText, 
  Boxes, 
  Calendar, 
  Receipt,
  Share2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawPdfBrandHeader } from '../utils/pdfBrandHeader';
import { resolveItemUnitPrice } from '../utils/pricingResolver';

export default function TransactionSuccessModal({ 
  isOpen, 
  onClose, 
  transaction, 
  currentUser,
  products = [],
  branches = [],
  onNewTransaction 
}) {
  if (!isOpen || !transaction) return null;

  // 1. Petugas yang melakukan input transaksi (sesuai data transaksi yang dicatat)
  const transactionOperator = transaction?.user 
    || transaction?.performerName 
    || transaction?.operator 
    || transaction?.staffName 
    || transaction?.cashierName 
    || currentUser?.name 
    || currentUser?.displayName 
    || 'Operator';

  // 2. Petugas yang saat ini mencetak
  const printOperator = currentUser?.name 
    || currentUser?.displayName 
    || (currentUser?.email ? currentUser.email.split('@')[0] : '')
    || (typeof window !== 'undefined' && (() => {
        try {
          const u = JSON.parse(localStorage.getItem('wms_user') || '{}');
          return u?.name || u?.displayName || (u?.email ? u.email.split('@')[0] : '');
        } catch (e) { return ''; }
      })())
    || transactionOperator;

  const isInbound = transaction.type === 'IN';
  const isBundling = Boolean(transaction.isBundling || transaction.transactionType === 'CUSTOM_BUNDLING');
  const isSale = transaction.transactionType === 'RETAIL_PCS' || transaction.transactionType === 'CUSTOM_BUNDLING';
  const isTransfer = transaction.transactionType === 'STOCK_TRANSFER_TO_BRANCH' || Boolean(transaction.targetBranchName || transaction.targetBranchId);

  const handlePrint = () => {
    try {
        const doc = new jsPDF();
        
        let title = "BUKTI TRANSAKSI";
        let subtitle = "Sistem Inventaris Resmi NDK Exhaust & RGN Performance";
        if (isTransfer) {
          title = "SURAT JALAN PENGIRIMAN";
          subtitle = "Dokumen Resmi Pengiriman Barang Antar Gudang";
        } else if (isSale) {
          title = "NOTA PENJUALAN";
          subtitle = "Faktur & Bukti Pembayaran Penjualan";
        } else if (isInbound) {
          title = "BUKTI PENERIMAAN BARANG";
          subtitle = "Surat Tanda Terima Barang Masuk Gudang";
        }

        const branchOrigin = transaction.branchName || (isTransfer ? transaction.sourceBranchName : 'Gudang Pusat');
        drawPdfBrandHeader(doc, {
          title,
          subtitle,
          branchName: branchOrigin
        });
        
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Left Header: Company Info
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Kepada Yth.", 14, 33);
        doc.setFont("helvetica", "normal");
        
        if (isSale) {
            doc.text(`Nama: ${transaction.customerName || 'Pelanggan'}`, 14, 38);
            if (transaction.customerPhone) doc.text(`No. Telp: ${transaction.customerPhone}`, 14, 44);
            if (transaction.customerAddress) doc.text(`Alamat: ${transaction.customerAddress}`, 14, 50);
        } else if (isTransfer) {
            doc.text(`Tujuan: ${transaction.targetBranchName || 'Cabang'}`, 14, 38);
        } else if (isInbound) {
            doc.text(`Gudang: NDK Warehouse`, 14, 38);
        }

        // Right Header: Invoice Info & Operator Info
        const invoiceNo = transaction.invoiceNumber || transaction.deliveryNote || `#TRX-${Date.now().toString().slice(-6)}`;
        let txDate = new Date().toLocaleDateString('id-ID');
        if (transaction.timestamp) {
             // Handle Firestore timestamp or Date string
             const d = transaction.timestamp.toDate ? transaction.timestamp.toDate() : new Date(transaction.timestamp);
             txDate = d.toLocaleDateString('id-ID');
        } else if (transaction.createdAt) {
             const d = transaction.createdAt.toDate ? transaction.createdAt.toDate() : new Date(transaction.createdAt);
             txDate = d.toLocaleDateString('id-ID');
        }

        doc.setFont("helvetica", "bold");
        doc.text("No. Dokumen", pageWidth - 70, 33);
        doc.text("Tanggal", pageWidth - 70, 39);
        doc.text("Petugas / Kasir", pageWidth - 70, 45);
        
        doc.setFont("helvetica", "normal");
        doc.text(`: ${invoiceNo}`, pageWidth - 45, 33);
        doc.text(`: ${txDate}`, pageWidth - 45, 39);
        doc.text(`: ${transactionOperator}`, pageWidth - 45, 45);

        // --- TABLE ---
        const tableColumn = ["No", "SKU", "Nama Barang", "Qty", "Harga Satuan (Rp)", "Jumlah (Rp)", "Keterangan"];
        const tableRows = [];
        
        let totalQty = 0;
        let totalAmount = 0;

        const rawItems = (transaction.items && transaction.items.length > 0)
          ? transaction.items
          : (transaction.productName || transaction.sku)
            ? [{
                sku: transaction.sku || '-',
                productName: transaction.productName || 'Produk',
                qty: Number(transaction.qty || 1),
                unit: transaction.unit || (isBundling ? 'Paket' : 'Pcs'),
                price: Number(transaction.price || 0),
                totalPrice: Number(transaction.totalPrice || 0),
                notes: transaction.notes || '-'
              }]
            : [];

        rawItems.forEach((item, index) => {
          const itemQty = Number(item.qty || 1);
          const unitPrice = resolveItemUnitPrice(item, transaction, products, branches);
          const directSubtotal = Number(item.totalPrice ?? item.subtotal);
          const itemSubtotal = directSubtotal > 0 ? directSubtotal : (unitPrice * itemQty);
          
          const rowData = [
            index + 1,
            item.sku || '-',
            item.productName || item.product_name || item.name || '-',
            `${itemQty} ${item.unit || (isBundling ? 'Paket' : 'Pcs')}`,
            unitPrice > 0 ? `Rp ${unitPrice.toLocaleString('id-ID')}` : '-',
            itemSubtotal > 0 ? `Rp ${itemSubtotal.toLocaleString('id-ID')}` : '-',
            item.notes || '-'
          ];
          tableRows.push(rowData);
          
          totalQty += itemQty;
          totalAmount += itemSubtotal;
        });

        if (Number(transaction.totalPrice) > 0 && totalAmount === 0) {
          totalAmount = Number(transaction.totalPrice);
        }

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 58,
          theme: 'grid',
          styles: { fontSize: 8.5, cellPadding: 2.8, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
          headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.1 },
          columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 26 },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 16, halign: 'center' },
            4: { cellWidth: 28, halign: 'right' },
            5: { cellWidth: 28, halign: 'right' },
            6: { cellWidth: 25 }
          }
        });
        
        const finalY = doc.lastAutoTable?.finalY || 55;
        
        // --- TOTALS ---
        doc.setFont("helvetica", "bold");
        doc.text(`Total Berat/Barang: ${totalQty} Item`, 14, finalY + 8);
        
        if (totalAmount > 0) {
          const totalLabel = isSale 
            ? 'Total Pembayaran' 
            : isTransfer 
              ? 'Total Nilai Pengiriman' 
              : 'Total Nilai Barang';
          doc.text(`${totalLabel}: Rp ${totalAmount.toLocaleString('id-ID')}`, pageWidth - 14, finalY + 8, { align: 'right' });
        }
        
        // --- FOOTER & SIGNATURES ---
        const now = new Date();
        const printTimeStr = new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        }).format(now);

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(110, 110, 110);
        doc.text(`Dicetak pada: ${printTimeStr} oleh operator: ${printOperator}`, 14, finalY + 11.5);
        doc.setTextColor(0, 0, 0);

        doc.setLineWidth(0.4);
        doc.line(14, finalY + 14, pageWidth - 14, finalY + 14);
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("BARANG SUDAH DITERIMA DALAM KEADAAN BAIK DAN CUKUP oleh:", 14, finalY + 19);
        doc.text("(tanda tangan dan cap stempel perusahaan)", 14, finalY + 23);
        
        doc.setFontSize(9);
        doc.text("Penerima / Pembeli", 35, finalY + 36, { align: 'center' });
        doc.text("Bagian Pengiriman", pageWidth / 2, finalY + 36, { align: 'center' });
        doc.text(isSale ? "Kasir / Sales" : isTransfer ? "Petugas Pengirim" : "Petugas Penerima", pageWidth - 35, finalY + 36, { align: 'center' });
        
        doc.setLineWidth(0.3);
        doc.line(14, finalY + 56, 56, finalY + 56);
        doc.line(pageWidth / 2 - 20, finalY + 56, pageWidth / 2 + 20, finalY + 56);
        doc.line(pageWidth - 56, finalY + 56, pageWidth - 14, finalY + 56);

        // Signer Names underneath signature lines
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`( ${transaction.customerName || '.....................'} )`, 35, finalY + 61, { align: 'center' });
        doc.text(`( ..................... )`, pageWidth / 2, finalY + 61, { align: 'center' });
        doc.setFont("helvetica", "bold");
        doc.text(`( ${transactionOperator} )`, pageWidth - 35, finalY + 61, { align: 'center' });

        // --- SAVE (Format: YYYY-MM-DD_[NOMOR_DOKUMEN].pdf) ---
        let txDateObj = new Date();
        if (transaction.timestamp) {
            txDateObj = transaction.timestamp.toDate ? transaction.timestamp.toDate() : new Date(transaction.timestamp);
        } else if (transaction.createdAt) {
            txDateObj = transaction.createdAt.toDate ? transaction.createdAt.toDate() : new Date(transaction.createdAt);
        }
        const year = txDateObj.getFullYear();
        const month = String(txDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(txDateObj.getDate()).padStart(2, '0');
        const fileDateStr = `${year}-${month}-${day}`;
        const cleanInvoiceNo = String(invoiceNo || 'TRX').replace(/[/\\?%*:|"<>]/g, '-').trim();
        doc.save(`${fileDateStr}_${cleanInvoiceNo}.pdf`);
    } catch (err) {
        console.error("Failed to generate PDF", err);
        alert("Gagal mencetak PDF: " + err.message);
    }
  };

  // Compute total for modal receipt card view
  const modalItems = (transaction.items && transaction.items.length > 0)
    ? transaction.items
    : (transaction.productName || transaction.sku)
      ? [{
          sku: transaction.sku || '-',
          productName: transaction.productName || 'Produk',
          qty: Number(transaction.qty || 1),
          unit: transaction.unit || (isBundling ? 'Paket' : 'Pcs'),
          price: Number(transaction.price || 0),
          totalPrice: Number(transaction.totalPrice || 0),
          notes: transaction.notes || '-'
        }]
      : [];

  let calculatedModalTotal = 0;
  modalItems.forEach(item => {
    const itQty = Number(item.qty || 1);
    const unitPrice = resolveItemUnitPrice(item, transaction, products, branches);
    const directSubtotal = Number(item.totalPrice ?? item.subtotal);
    const itemSubtotal = directSubtotal > 0 ? directSubtotal : (unitPrice * itQty);
    calculatedModalTotal += itemSubtotal;
  });
  const displayModalTotal = Number(transaction.totalPrice) > 0 ? Number(transaction.totalPrice) : calculatedModalTotal;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200 pointer-events-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150 my-auto print-only-modal">
        
        {/* Header with Celebration Glow & Explicit Status */}
        <div className="relative p-6 text-center bg-gradient-to-b from-emerald-50 via-emerald-50/50 to-white border-b border-emerald-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer no-print"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-3 animate-bounce">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-extrabold mb-1 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>KONFIRMASI: TRANSAKSI BERHASIL TERCATAT</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isTransfer 
              ? 'Kiriman Stok Berhasil Diproses!' 
              : isSale 
                ? 'Penjualan Berhasil Disimpan!' 
                : 'Penerimaan Stok Berhasil!'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Mutasi stok telah otomatis diperbarui di database dan notifikasi terkait telah diteruskan.
          </p>
        </div>

        {/* Receipt / Surat Jalan Card */}
        <div id="printable-transaction-receipt" className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3.5 font-sans">
            
            {/* Header of Receipt */}
            <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-300 text-xs">
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                {isInbound ? (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[11px]">INBOUND MASUK</span>
                ) : isSale ? (
                  <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-800 text-[11px]">PENJUALAN KELUAR</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-lg bg-sky-100 text-sky-800 text-[11px]">TRANSFER CABANG</span>
                )}
              </span>
              <span className="font-mono font-bold text-slate-600 text-xs bg-white px-2 py-1 rounded-md border border-slate-200">
                {transaction.invoiceNumber || transaction.deliveryNote || `#TRX-${Date.now().toString().slice(-6)}`}
              </span>
            </div>

            {/* Product & Qty Info */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                Rincian Barang & Kuantitas Fisik
              </span>
              
              {transaction.items && transaction.items.length > 0 ? (
                <div className="space-y-2">
                  <div className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{isBundling ? (transaction.bundleName || transaction.productName) : `Daftar Barang (${transaction.items.length} Jenis Produk)`}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                      Total: {transaction.qty} {isBundling ? 'Paket' : 'Pcs'}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs space-y-1.5">
                    {transaction.items.map((it, idx) => {
                      const itQty = Number(it.qty || 1);
                      const unitPrice = resolveItemUnitPrice(it, transaction, products, branches);
                      const directSubtotal = Number(it.totalPrice ?? it.subtotal);
                      const itemSubtotal = directSubtotal > 0 ? directSubtotal : (unitPrice * itQty);

                      return (
                        <div key={idx} className="flex justify-between items-start sm:items-center py-2 first:pt-0 last:pb-0 gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-slate-800 font-bold">{it.productName || it.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              SKU: {it.sku} {unitPrice > 0 ? `• @ Rp ${unitPrice.toLocaleString('id-ID')}` : ''}
                            </div>
                            {it.notes && it.notes !== '-' && (
                              <p className="text-[10px] text-purple-700 font-medium mt-0.5">
                                Komponen: {it.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="font-extrabold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-xs">
                              {itQty} {it.unit || (isBundling ? 'Paket' : 'Pcs')}
                            </span>
                            {itemSubtotal > 0 && (
                              <div className="text-[11px] font-bold text-slate-700 mt-0.5">
                                Rp {itemSubtotal.toLocaleString('id-ID')}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{transaction.productName}</h4>
                    {transaction.sku && (
                      <p className="text-xs font-mono text-slate-400">
                        SKU: {transaction.sku}
                        {resolveItemUnitPrice(transaction, transaction, products, branches) > 0 
                          ? ` • @ Rp ${resolveItemUnitPrice(transaction, transaction, products, branches).toLocaleString('id-ID')}` 
                          : ''}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1.5 rounded-xl font-black text-sm block ${
                      isInbound 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isInbound ? `+${transaction.qty} Pcs` : `-${transaction.qty} Pcs`}
                    </span>
                    {displayModalTotal > 0 && (
                      <span className="text-[11px] font-bold text-slate-700 mt-1 block">
                        Rp {displayModalTotal.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Destination / Source / Customer */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">
                  {isInbound ? 'Asal Barang' : isSale ? 'Pembeli / Pelanggan' : 'Cabang Tujuan'}
                </span>
                <span className="font-bold text-slate-800 truncate block mt-0.5">
                  {transaction.targetBranchName || transaction.customerName || (transaction.source === 'KANTOR_PUSAT' ? 'Kantor Pusat (HQ)' : transaction.source === 'PABRIK_PRODUKSI_PUSAT' ? 'Pabrik Produksi Kantor' : 'Gudang Pusat')}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Petugas / Operator</span>
                <span className="font-bold text-slate-800 truncate block mt-0.5">
                  {transactionOperator}
                </span>
              </div>
            </div>

            {/* Total Payment / Total Value */}
            {displayModalTotal > 0 && (
              <div className="pt-2.5 border-t border-dashed border-slate-300 flex items-center justify-between bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-xs font-bold text-emerald-900">
                  {isSale ? 'Total Pembayaran:' : isTransfer ? 'Total Nilai Pengiriman:' : 'Total Nilai Barang:'}
                </span>
                <span className="text-base font-black text-emerald-800">
                  Rp {displayModalTotal.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-[10px] text-slate-400 text-center pt-1">
              Waktu Selesai: {new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} WIB
            </div>

          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1 no-print">
            <button
              onClick={handlePrint}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-md shadow-slate-900/10"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Bukti / Struk / Surat Jalan</span>
            </button>

            <button
              onClick={() => {
                onClose();
                if (onNewTransaction) onNewTransaction();
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer"
            >
              ✓ Selesai & Tutup
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
