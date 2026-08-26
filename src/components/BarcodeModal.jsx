import React, { useEffect, useRef } from 'react';
import bwipjs from 'bwip-js';
import { X, Printer, Download } from 'lucide-react';

export default function BarcodeModal({ product, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (product && canvasRef.current) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: 'code128',
          text: product.barcode || product.sku,
          scale: 3,
          height: 12,
          includetext: true,
          textxalign: 'center',
          textsize: 11,
        });
      } catch (e) {
        console.error("Barcode generation error:", e);
      }
    }
  }, [product]);

  if (!product) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `Barcode-${product.sku}.png`;
      a.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800">Cetak & Preview Barcode</h3>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-center" id="printable-barcode-area">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
            <h4 className="font-bold text-slate-900 text-lg mb-1">{product.name}</h4>
            <p className="text-xs font-mono text-slate-500 mb-4">SKU: {product.sku} | Rak: {product.location}</p>
            
            <canvas ref={canvasRef} className="max-w-full bg-white p-2 rounded shadow-sm" />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition"
          >
            <Download className="w-4 h-4" /> Download PNG
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-xl text-sm transition shadow-sm shadow-sky-600/30"
          >
            <Printer className="w-4 h-4" /> Cetak Barcode
          </button>
        </div>
      </div>
    </div>
  );
}
