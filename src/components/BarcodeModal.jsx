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
      // Standard 50 x 30 mm Thermal Label format
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [50, 30]
      });

      const brand = String(product.brand || 'NDK EXHAUST').toUpperCase();
      const cleanSku = String(product.sku || product.code || 'PRODUCT').trim();
      const engineText = `Mesin ${engineName}`;

      if (isQr) {
        // --- 50 x 30 mm QR CODE LAYOUT ---
        // Left Side: QR Code (20.5mm x 20.5mm) + SKU text underneath
        doc.addImage(imgData, 'PNG', 2.5, 2.5, 20.5, 20.5, undefined, 'FAST');

        doc.setFont('courier', 'bold');
        doc.setFontSize(5.5);
        doc.setTextColor(30, 41, 59);
        doc.text(cleanSku, 12.75, 26.5, { align: 'center' });

        // Right Side: Brand, Product Name, Specs, Price, Directive
        // Brand Badge
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(15, 23, 42);
        doc.text(brand, 25, 5.5);

        // Product Name (wrapped to 23mm, max 2 lines)
        doc.setFontSize(6.5);
        doc.setTextColor(15, 23, 42);
        const nameLines = doc.splitTextToSize(product.name || 'Produk', 23);
        const displayLines = nameLines.slice(0, 2);
        doc.text(displayLines, 25, 9.5);

        let curY = 9.5 + (displayLines.length * 3.2);

        // Engine & Category
        doc.setFontSize(5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const specText = product.category_name ? `${engineText} • ${product.category_name}` : engineText;
        const specLines = doc.splitTextToSize(specText, 23);
        doc.text(specLines[0], 25, curY);

        curY += 3.8;

        // Price
        doc.setFontSize(5);
        doc.setTextColor(100, 116, 139);
        doc.text('Harga Resmi:', 25, curY);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(5, 150, 105);
        doc.text(`Rp ${sellingPrice.toLocaleString('id-ID')}`, 25, curY + 3.5);

        // Scan directive
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(4.5);
        doc.setTextColor(79, 70, 229);
        doc.text('Scan utk E-Katalog', 25, 27.5);
      } else {
        // --- 50 x 30 mm BARCODE 1D LAYOUT ---
        // Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(15, 23, 42);
        doc.text(brand, 25, 4.5, { align: 'center' });

        doc.setFontSize(6.5);
        const nameLines = doc.splitTextToSize(product.name || 'Produk', 46);
        doc.text(nameLines[0], 25, 8, { align: 'center' });

        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`${engineText}  |  Rp ${sellingPrice.toLocaleString('id-ID')}`, 25, 11.5, { align: 'center' });

        // Barcode 1D Image
        doc.addImage(imgData, 'PNG', 3, 13, 44, 10.5, undefined, 'FAST');

        // SKU Centered beneath
        doc.setFont('courier', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(30, 41, 59);
        doc.text(cleanSku, 25, 27, { align: 'center' });
      }

      // Save PDF with official naming convention including 50x30
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const safeSku = cleanSku.replace(/[/\\?%*:|"<>]/g, '-').trim();
      const filename = `${dateStr}_LABEL-50x30-${safeSku}.pdf`;

      doc.save(filename);
    } catch (err) {
      console.error("Gagal membuat PDF label 50x30mm:", err);
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
      a.download = `SmartQR-50x30mm-${product.sku || product.code}.png`;
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
              <h3 className="font-bold text-slate-800 text-base leading-tight">Smart QR & Barcode (50 x 30 mm)</h3>
              <p className="text-[11px] text-slate-400">Ukuran Standar Thermal Label 50x30 mm untuk Scanner & Customer</p>
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
            <span>Smart QR Code (50x30)</span>
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
            <span>Barcode 1D (50x30)</span>
          </button>
        </div>

        {/* Modal Printable Content calibrated to 50 x 30 mm */}
        <div className="p-6 text-center flex flex-col items-center justify-center bg-slate-50/50" id="printable-barcode-area">
          <div className="w-full max-w-[340px] aspect-[5/3] bg-white rounded-2xl border-2 border-dashed border-indigo-300 p-3 shadow-md flex flex-col justify-between text-left overflow-hidden relative">
            
            {codeType === 'QRCODE' ? (
              <div className="flex h-full gap-2.5 items-center">
                {/* Left Column: QR Code + SKU */}
                <div className="flex flex-col items-center justify-center w-[105px] flex-shrink-0 bg-slate-50/80 p-1.5 rounded-xl border border-slate-200/80">
                  <canvas ref={canvasRef} className="w-[80px] h-[80px] object-contain rounded-md print:hidden" />
                  {qrDataUrl && (
                    <img 
                      src={qrDataUrl} 
                      alt={product.sku || 'QR Code'} 
                      className="hidden print:block w-[80px] h-[80px] object-contain mx-auto" 
                    />
                  )}
                  <span className="text-[9px] font-mono font-bold text-slate-700 mt-1 truncate max-w-full">
                    {product.sku || product.code}
                  </span>
                </div>

                {/* Right Column: Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black tracking-wider uppercase">
                        {product.brand || 'NDK'}
                      </span>
                      <span className="text-[9px] font-bold text-amber-900 bg-amber-100 px-1 py-0.5 rounded truncate">
                        {engineName}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-xs leading-tight line-clamp-2 mt-1">
                      {product.name}
                    </h4>

                    {product.category_name && (
                      <p className="text-[9px] text-slate-500 font-medium truncate mt-0.5">
                        {product.category_name}
                      </p>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <div className="text-[9px] text-slate-400 font-medium">Harga Resmi:</div>
                    <div className="text-xs font-black text-emerald-600">
                      Rp {sellingPrice.toLocaleString('id-ID')}
                    </div>
                    <p className="text-[8px] text-indigo-600 font-semibold mt-0.5">
                      📱 Scan utk E-Katalog
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-between h-full py-1 text-center items-center">
                <div className="w-full">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black tracking-wider uppercase">
                      {product.brand || 'NDK EXHAUST'}
                    </span>
                    <span className="text-[9px] font-bold text-amber-900 bg-amber-100 px-1 py-0.5 rounded">
                      {engineName}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs leading-tight line-clamp-1 mt-1 px-1">
                    {product.name}
                  </h4>
                </div>

                <div className="w-full flex flex-col items-center justify-center my-0.5">
                  <canvas ref={canvasRef} className="max-w-[220px] h-[48px] print:hidden object-contain" />
                  {qrDataUrl && (
                    <img 
                      src={qrDataUrl} 
                      alt={product.sku || 'Barcode'} 
                      className="hidden print:block max-w-[220px] h-[48px] object-contain mx-auto" 
                    />
                  )}
                  <span className="text-[10px] font-mono font-bold text-slate-800 mt-0.5">
                    {product.sku || product.code}
                  </span>
                </div>

                <div className="text-[10px] font-bold text-slate-600">
                  Harga Resmi: <strong className="text-emerald-600">Rp {sellingPrice.toLocaleString('id-ID')}</strong>
                </div>
              </div>
            )}

          </div>

          <p className="text-[11px] text-slate-500 font-medium mt-2.5 flex items-center gap-1.5 no-print">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Format Cetak: <strong>50 x 30 mm</strong> (Standar Stiker Roll Thermal Gudang)</span>
          </p>
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
