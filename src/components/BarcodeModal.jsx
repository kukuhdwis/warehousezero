import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import bwipjs from 'bwip-js';
import jsPDF from 'jspdf';
import { X, Printer, Download, QrCode, Barcode as BarcodeIcon, Sparkles, ExternalLink, FileText } from 'lucide-react';

export default function BarcodeModal({ product, onClose }) {
  const canvasRef = useRef(null);
  const [codeType, setCodeType] = useState('QRCODE'); // 'QRCODE' | 'BARCODE1D'
  const [qrDataUrl, setQrDataUrl] = useState('');

  const publicUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/catalog?sku=${encodeURIComponent(product?.sku || product?.code || '')}`
    : `https://warehouse.ndkexhaust.com/catalog?sku=${encodeURIComponent(product?.sku || product?.code || '')}`;

  useEffect(() => {
    if (!product) return;
    document.body.classList.add('barcode-modal-open');
    return () => {
      document.body.classList.remove('barcode-modal-open');
    };
  }, [product]);

  useEffect(() => {
    if (product && canvasRef.current) {
      try {
        if (codeType === 'QRCODE') {
          // Render High Quality 2D QR Code with deep-link URL
          bwipjs.toCanvas(canvasRef.current, {
            bcid: 'qrcode',
            text: publicUrl,
            scale: 4,
            includetext: false,
            eclevel: 'M'
          });
        } else {
          // Render Standard 1D Code128 Barcode
          bwipjs.toCanvas(canvasRef.current, {
            bcid: 'code128',
            text: product.barcode || product.sku || product.code,
            scale: 3,
            height: 12,
            includetext: true,
            textxalign: 'center',
            textsize: 11,
          });
        }

        try {
          const dataUrl = canvasRef.current.toDataURL('image/png');
          setQrDataUrl(dataUrl);
        } catch (err) {
          console.warn("Could not extract canvas dataURL:", err);
        }
      } catch (e) {
        console.error("Barcode/QR generation error:", e);
      }
    }
  }, [product, codeType, publicUrl]);

  if (!product) return null;

  const handleDownloadPDF = () => {
    try {
      let imgData = qrDataUrl;
      if (!imgData && canvasRef.current) {
        imgData = canvasRef.current.toDataURL('image/png');
      }
      if (!imgData) {
        alert("Gagal memproses gambar barcode/QR. Silakan coba lagi.");
        return;
      }

      const isQr = codeType === 'QRCODE';
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [85, isQr ? 120 : 105]
      });

      const pageWidth = 85;
      const pageHeight = isQr ? 120 : 105;

      // Background soft tint
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(4, 4, pageWidth - 8, pageHeight - 8, 4, 4, 'F');

      // Outer dashed border
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(0.4);
      doc.setLineDashPattern([2, 2], 0);
      doc.roundedRect(4, 4, pageWidth - 8, pageHeight - 8, 4, 4, 'S');
      doc.setLineDashPattern([], 0);

      // Brand Badge
      const brand = String(product.brand || 'NDK EXHAUST').toUpperCase();
      doc.setFillColor(15, 23, 42);
      const brandBadgeWidth = Math.min(60, Math.max(36, brand.length * 3.4));
      doc.roundedRect((pageWidth - brandBadgeWidth) / 2, 7.5, brandBadgeWidth, 5.5, 2.75, 2.75, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text(brand, pageWidth / 2, 11.3, { align: 'center' });

      // Product Title
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const splitTitle = doc.splitTextToSize(product.name || 'Produk', pageWidth - 14);
      doc.text(splitTitle, pageWidth / 2, 17.5, { align: 'center' });

      let curY = 17.5 + (splitTitle.length * 3.8);

      // Tags: Mesin & Category
      doc.setFontSize(6.5);
      const engineText = `Mesin ${engineName}`;
      const catText = product.category_name ? String(product.category_name) : '';
      
      if (catText) {
        // Tag 1 (Engine)
        doc.setFillColor(254, 243, 199);
        doc.setDrawColor(251, 191, 36);
        doc.setLineWidth(0.2);
        doc.roundedRect(pageWidth / 2 - 29, curY, 28, 4.5, 1.5, 1.5, 'FD');
        doc.setTextColor(146, 64, 14);
        doc.text(engineText, pageWidth / 2 - 15, curY + 3.2, { align: 'center' });

        // Tag 2 (Category)
        doc.setFillColor(224, 242, 254);
        doc.setDrawColor(56, 189, 248);
        doc.roundedRect(pageWidth / 2 + 1, curY, 28, 4.5, 1.5, 1.5, 'FD');
        doc.setTextColor(7, 89, 133);
        doc.text(catText, pageWidth / 2 + 15, curY + 3.2, { align: 'center' });
      } else {
        // Single Engine Tag centered
        doc.setFillColor(254, 243, 199);
        doc.setDrawColor(251, 191, 36);
        doc.setLineWidth(0.2);
        doc.roundedRect((pageWidth - 34) / 2, curY, 34, 4.5, 1.5, 1.5, 'FD');
        doc.setTextColor(146, 64, 14);
        doc.text(engineText, pageWidth / 2, curY + 3.2, { align: 'center' });
      }

      curY += 7.5;

      if (isQr) {
        // QR Code Box
        const qrBoxSize = 46;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect((pageWidth - qrBoxSize) / 2, curY, qrBoxSize, qrBoxSize + 6, 3, 3, 'FD');

        // QR Code Image
        doc.addImage(imgData, 'PNG', (pageWidth - 38) / 2, curY + 2.5, 38, 38, undefined, 'FAST');

        // SKU below QR
        doc.setFont('courier', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(product.sku || product.code || '-', pageWidth / 2, curY + 44.5, { align: 'center' });

        curY += qrBoxSize + 10;
      } else {
        // Barcode 1D Box
        const bcBoxW = 62;
        const bcBoxH = 26;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect((pageWidth - bcBoxW) / 2, curY, bcBoxW, bcBoxH, 3, 3, 'FD');

        // Barcode Image
        doc.addImage(imgData, 'PNG', (pageWidth - 54) / 2, curY + 3, 54, 20, undefined, 'FAST');

        curY += bcBoxH + 5;
      }

      // Price
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Harga Resmi: ', pageWidth / 2 - 12, curY, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text(`Rp ${sellingPrice.toLocaleString('id-ID')}`, pageWidth / 2 - 10, curY, { align: 'left' });

      curY += 4.5;

      // Scan Directive
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(79, 70, 229);
      const directiveText = isQr 
        ? 'Scan dengan Kamera HP untuk membuka E-Katalog Produk' 
        : 'Scan Barcode dengan scanner gudang';
      doc.text(directiveText, pageWidth / 2, curY, { align: 'center' });

      // Save PDF with official naming convention
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const cleanSku = String(product.sku || product.code || 'PRODUCT').replace(/[/\\?%*:|"<>]/g, '-').trim();
      const filename = `${dateStr}_LABEL-${cleanSku}.pdf`;

      doc.save(filename);
    } catch (err) {
      console.error("Gagal membuat PDF label:", err);
      alert("Gagal mendownload PDF: " + err.message);
    }
  };

  const handlePrint = () => {
    if (canvasRef.current) {
      try {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setQrDataUrl(dataUrl);
      } catch (err) {}
    }
    setTimeout(() => {
      window.print();
    }, 60);
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `SmartQR-${product.sku}.png`;
      a.click();
    }
  };

  const sellingPrice = Number(product.selling_price ?? product.price) || 0;
  const engineName = product.engine_type || product.machineCategory || 'Universal';

  const modalContent = (
    <div 
      id="barcode-modal-portal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="modal-content-card bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/70 no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base leading-tight">Smart QR Code & Label</h3>
              <p className="text-[11px] text-slate-400">Universal QR untuk Customer & Scanner Staff</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Code Type Switcher Tabs */}
        <div className="flex border-b border-slate-100 px-6 pt-3 bg-slate-50/40 text-xs no-print">
          <button
            type="button"
            onClick={() => setCodeType('QRCODE')}
            className={`flex-1 pb-2.5 font-bold flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
              codeType === 'QRCODE'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Smart QR Code (Dual-Purpose)</span>
          </button>

          <button
            type="button"
            onClick={() => setCodeType('BARCODE1D')}
            className={`flex-1 pb-2.5 font-bold flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
              codeType === 'BARCODE1D'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <BarcodeIcon className="w-4 h-4" />
            <span>Barcode 1D (Gudang)</span>
          </button>
        </div>

        {/* Modal Printable Content */}
        <div className="p-6 text-center" id="printable-barcode-area">
          <div className="bg-gradient-to-b from-slate-50 to-indigo-50/30 p-5 rounded-2xl border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center space-y-3">
            
            {/* Header Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black tracking-widest uppercase">
              <span>{product.brand || 'NDK EXHAUST'}</span>
            </div>

            {/* Product Title & Compatibility */}
            <div>
              <h4 className="font-extrabold text-slate-900 text-base leading-snug">{product.name}</h4>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  Mesin {engineName}
                </span>
                {product.category_name && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-900 border border-sky-200">
                    {product.category_name}
                  </span>
                )}
              </div>
            </div>

            {/* Canvas Target for Screen & Image for Print */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center">
              <canvas ref={canvasRef} className="max-w-full rounded-lg print:hidden" />
              {qrDataUrl && (
                <img 
                  src={qrDataUrl} 
                  alt={product.sku || 'Barcode'} 
                  className="hidden print:block max-w-[180px] w-auto h-auto rounded-lg mx-auto" 
                />
              )}
              {codeType === 'QRCODE' && (
                <span className="text-[10px] font-mono text-slate-500 font-bold mt-2">
                  {product.sku || product.code}
                </span>
              )}
            </div>

            {/* Price & Scan Directive */}
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-slate-500">
                Harga Resmi: <strong className="text-emerald-600">Rp {sellingPrice.toLocaleString('id-ID')}</strong>
              </div>
              <p className="text-[10px] text-indigo-700 font-medium">
                {codeType === 'QRCODE' 
                  ? '📱 Scan dengan Kamera HP untuk membuka E-Katalog Produk' 
                  : '📦 Scan Barcode dengan scanner gudang'}
              </p>
            </div>

          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/70 no-print">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer shadow-2xs"
            title="Download gambar PNG resolusi tinggi"
          >
            <Download className="w-4 h-4" /> 
            <span>Download PNG</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-indigo-600/30 cursor-pointer active:scale-95"
            title="Download file PDF label langsung siap cetak"
          >
            <FileText className="w-4 h-4" /> 
            <span>Cetak as PDF</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
            title="Buka dialog printer (Cetak langsung via printer fisik)"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
