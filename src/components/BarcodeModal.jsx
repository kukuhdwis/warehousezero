import React, { useEffect, useRef, useState } from 'react';
import bwipjs from 'bwip-js';
import { X, Printer, Download, QrCode, Barcode as BarcodeIcon, Sparkles, ExternalLink } from 'lucide-react';

export default function BarcodeModal({ product, onClose }) {
  const canvasRef = useRef(null);
  const [codeType, setCodeType] = useState('QRCODE'); // 'QRCODE' | 'BARCODE1D'

  const publicUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/catalog?sku=${encodeURIComponent(product?.sku || product?.code || '')}`
    : `https://warehousezero.web.app/catalog?sku=${encodeURIComponent(product?.sku || product?.code || '')}`;

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
      } catch (e) {
        console.error("Barcode/QR generation error:", e);
      }
    }
  }, [product, codeType, publicUrl]);

  if (!product) return null;

  const handlePrint = () => {
    window.print();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/70">
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
        <div className="flex border-b border-slate-100 px-6 pt-3 bg-slate-50/40 text-xs">
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

            {/* Canvas Target */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center">
              <canvas ref={canvasRef} className="max-w-full rounded-lg" />
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
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4" /> 
            <span>Download PNG</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-indigo-600/30 cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" /> 
            <span>Cetak Label</span>
          </button>
        </div>

      </div>
    </div>
  );
}
