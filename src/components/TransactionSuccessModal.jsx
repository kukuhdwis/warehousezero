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

export default function TransactionSuccessModal({ 
  isOpen, 
  onClose, 
  transaction, 
  onNewTransaction 
}) {
  if (!isOpen || !transaction) return null;

  const isInbound = transaction.type === 'IN';
  const isBundling = Boolean(transaction.isBundling || transaction.transactionType === 'CUSTOM_BUNDLING');
  const isSale = transaction.transactionType === 'RETAIL_PCS' || transaction.transactionType === 'CUSTOM_BUNDLING';
  const isTransfer = transaction.transactionType === 'STOCK_TRANSFER_TO_BRANCH' || transaction.targetBranchName;

  const handlePrint = () => {
    try {
        const doc = new jsPDF();
        
        // --- HEADER ---
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        
        let title = "BUKTI TRANSAKSI";
        if (isTransfer) title = "SURAT JALAN";
        else if (isSale) title = "NOTA PENJUALAN";
        else if (isInbound) title = "BUKTI PENERIMAAN BARANG";
        
        // Right align title
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.text(title, pageWidth - 14, 22, { align: 'right' });
        
        // Draw line under title
        doc.setLineWidth(0.5);
        doc.line(14, 25, pageWidth - 14, 25);
        
        // Left Header: Company Info
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Kepada Yth.", 14, 32);
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

        // Right Header: Invoice Info
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
        doc.text("No. Dokumen", pageWidth - 70, 32);
        doc.text("Tanggal", pageWidth - 70, 38);
        doc.text("Petugas", pageWidth - 70, 44);
        
        doc.setFont("helvetica", "normal");
        doc.text(`: ${invoiceNo}`, pageWidth - 45, 32);
        doc.text(`: ${txDate}`, pageWidth - 45, 38);
        doc.text(`: ${transaction.performerName || transaction.callerUid || 'Admin'}`, pageWidth - 45, 44);

        // --- TABLE ---
        const tableColumn = ["No", "SKU", "Nama Barang", "Qty", "Jumlah (Rp)", "Keterangan"];
        const tableRows = [];
        
        let totalQty = 0;
        let totalAmount = 0;

        (transaction.items || []).forEach((item, index) => {
          let itemPrice = Number(item.totalPrice || item.subtotal || 0);
          if (!itemPrice && item.price) {
             itemPrice = Number(item.price) * (Number(item.qty) || 1);
          }
          
          if (isTransfer || isInbound) itemPrice = 0; 
          
          const rowData = [
            index + 1,
            item.sku || '-',
            item.productName || item.product_name || item.name || '-',
            `${item.qty || 0} ${item.unit || (isBundling ? 'Paket' : 'Pcs')}`,
            isSale ? `Rp ${itemPrice.toLocaleString('id-ID')}` : '-',
            item.notes || '-'
          ];
          tableRows.push(rowData);
          
          totalQty += Number(item.qty || 0);
          totalAmount += itemPrice;
        });

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 55,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 3, textColor: [0, 0, 0], lineColor: [0,0,0], lineWidth: 0.1 },
          headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineColor: [0,0,0], lineWidth: 0.1 },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 25 },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 15, halign: 'center' },
            4: { cellWidth: 25, halign: 'right' },
            5: { cellWidth: 35 }
          }
        });
        
        const finalY = doc.lastAutoTable?.finalY || 55;
        
        // --- TOTALS ---
        doc.setFont("helvetica", "bold");
        doc.text(`Total Berat/Barang: ${totalQty} Item`, 14, finalY + 8);
        
        if (isSale) {
            doc.text(`Total Pembayaran: Rp ${totalAmount.toLocaleString('id-ID')}`, pageWidth - 14, finalY + 8, { align: 'right' });
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
        doc.text(`Dicetak pada: ${printTimeStr}`, 14, finalY + 11.5);
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
        doc.text("Petugas Gudang", pageWidth - 35, finalY + 36, { align: 'center' });
        
        doc.setLineWidth(0.3);
        doc.line(14, finalY + 56, 56, finalY + 56);
        doc.line(pageWidth / 2 - 20, finalY + 56, pageWidth / 2 + 20, finalY + 56);
        doc.line(pageWidth - 56, finalY + 56, pageWidth - 14, finalY + 56);

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
                    {transaction.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-start sm:items-center py-2 first:pt-0 last:pb-0 gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-slate-800 font-bold">{it.productName || it.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            SKU: {it.sku} {it.price ? `• @ Rp ${(Number(it.price) || 0).toLocaleString('id-ID')}` : ''}
                          </div>
                          {it.notes && it.notes !== '-' && (
                            <p className="text-[10px] text-purple-700 font-medium mt-0.5">
                              Komponen: {it.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="font-extrabold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-xs">
                            {it.qty} {it.unit || (isBundling ? 'Paket' : 'Pcs')}
                          </span>
                          {(it.totalPrice || it.subtotal || it.price) ? (
                            <div className="text-[11px] font-bold text-slate-700 mt-0.5">
                              Rp {(Number(it.totalPrice || it.subtotal || (Number(it.price) * Number(it.qty)))).toLocaleString('id-ID')}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{transaction.productName}</h4>
                    {transaction.sku && (
                      <p className="text-xs font-mono text-slate-400">SKU: {transaction.sku}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl font-black text-sm ${
                    isInbound 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {isInbound ? `+${transaction.qty} Pcs` : `-${transaction.qty} Pcs`}
                  </span>
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
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Petugas Pelaksana</span>
                <span className="font-bold text-slate-800 truncate block mt-0.5">
                  {transaction.user || 'Staff Gudang'}
                </span>
              </div>
            </div>

            {/* Total Payment if Sale */}
            {isSale && transaction.totalPrice !== undefined && (
              <div className="pt-2.5 border-t border-dashed border-slate-300 flex items-center justify-between bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-xs font-bold text-emerald-900">Total Pembayaran:</span>
                <span className="text-base font-black text-emerald-800">
                  Rp {(Number(transaction.totalPrice) || 0).toLocaleString('id-ID')}
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
