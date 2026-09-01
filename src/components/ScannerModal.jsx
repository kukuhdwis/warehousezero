import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, AlertCircle, RefreshCw, SwitchCamera, QrCode, ArrowRight, CheckCircle2 } from 'lucide-react';

// Helper to extract SKU from Smart QR Code URLs or raw barcodes
const extractSKU = (text) => {
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

export default function ScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [scanError, setScanError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [manualSkuInput, setManualSkuInput] = useState('');
  const [scannedSuccessCode, setScannedSuccessCode] = useState(null);
  
  const html5QrcodeRef = useRef(null);
  const isMountedRef = useRef(false);
  const isProcessedRef = useRef(false);

  const handleDecoded = (decodedText) => {
    if (!decodedText || isProcessedRef.current) return;
    
    isProcessedRef.current = true;
    const cleanSKU = extractSKU(decodedText);
    setScannedSuccessCode(cleanSKU);

    setTimeout(() => {
      if (onScanSuccess) {
        onScanSuccess(cleanSKU);
      }
      stopScanner();
      onClose();
    }, 450);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualSkuInput.trim() && !isProcessedRef.current) {
      isProcessedRef.current = true;
      const cleanSKU = extractSKU(manualSkuInput.trim());
      setScannedSuccessCode(cleanSKU);
      
      setTimeout(() => {
        if (onScanSuccess) {
          onScanSuccess(cleanSKU);
        }
        stopScanner();
        onClose();
      }, 300);
    }
  };

  const stopScanner = async () => {
    const scanner = html5QrcodeRef.current;
    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        await scanner.clear();
      } catch (e) {
        console.warn("Scanner cleanup ignore:", e);
      }
      html5QrcodeRef.current = null;
    }
    if (isMountedRef.current) {
      setIsScanning(false);
    }
  };

  const startScanner = async () => {
    setScanError(null);
    setIsScanning(false);
    isProcessedRef.current = false;

    try {
      // 1. Cleanup any previous instance
      if (html5QrcodeRef.current) {
        await stopScanner();
      }

      // 2. Initialize instance with full 2D QR + 1D Barcode support
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.DATA_MATRIX
      ];

      const html5Qrcode = new Html5Qrcode("interactive-qr-reader", {
        formatsToSupport,
        verbose: false
      });
      html5QrcodeRef.current = html5Qrcode;

      const scanConfig = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minDim = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.max(180, Math.floor(minDim * 0.72));
          return { width: size, height: size };
        }
      };

      // 3. Enumerate camera devices first (standard on mobile)
      let selectedCameraConfig = { facingMode: "environment" };

      try {
        const devices = await Html5Qrcode.getCameras();
        if (Array.isArray(devices) && devices.length > 0) {
          if (isMountedRef.current) {
            setCameras(devices);
          }

          // Search for back camera
          const backCameraIdx = devices.findIndex(d => {
            const label = (d.label || '').toLowerCase();
            return label.includes('back') || label.includes('rear') || label.includes('belakang') || label.includes('environment') || label.includes('0, facing back');
          });

          const chosenIdx = backCameraIdx !== -1 ? backCameraIdx : 0;
          if (isMountedRef.current) {
            setCurrentCameraIndex(chosenIdx);
          }
          selectedCameraConfig = devices[chosenIdx].id;
        }
      } catch (devErr) {
        console.warn("Device enumeration fallback to facingMode:", devErr);
      }

      // 4. Start camera with chosen camera ID or environment facingMode
      await html5Qrcode.start(
        selectedCameraConfig,
        scanConfig,
        handleDecoded,
        () => {}
      );

      if (isMountedRef.current) {
        setIsScanning(true);
      }

    } catch (err) {
      console.warn("Percobaan 1 gagal, mencoba fallback facingMode:", err);
      
      try {
        if (!html5QrcodeRef.current) {
          html5QrcodeRef.current = new Html5Qrcode("interactive-qr-reader", {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.EAN_13
            ],
            verbose: false
          });
        }

        await html5QrcodeRef.current.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 220, height: 220 }
          },
          handleDecoded,
          () => {}
        );

        if (isMountedRef.current) {
          setIsScanning(true);
        }
      } catch (fallbackErr) {
        console.error("Gagal total mengakses kamera:", fallbackErr);
        if (isMountedRef.current) {
          setScanError(`Kamera belum dapat dibuka: ${fallbackErr.message || err.message || 'Izin kamera ditolak atau kamera sedang digunakan aplikasi lain'}.`);
        }
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    isProcessedRef.current = false;
    setScannedSuccessCode(null);

    if (isOpen) {
      const timer = setTimeout(() => {
        startScanner();
      }, 350);

      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }

    return () => {
      isMountedRef.current = false;
      stopScanner();
    };
  }, [isOpen]);

  const handleSwitchCamera = async () => {
    if (cameras.length <= 1 || !html5QrcodeRef.current) return;

    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    const nextCamera = cameras[nextIndex];

    try {
      if (html5QrcodeRef.current.isScanning) {
        await html5QrcodeRef.current.stop();
      }

      await html5QrcodeRef.current.start(
        nextCamera.id,
        { 
          fps: 15, 
          qrbox: { width: 220, height: 220 }
        },
        handleDecoded,
        () => {}
      );
    } catch (e) {
      console.error("Gagal mengganti kamera:", e);
    }
  };

  const handleCloseModal = () => {
    stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">Scan Smart QR / Barcode</h3>
              <p className="text-xs text-slate-500">Arahkan kamera ke QR Code atau Barcode produk</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleCloseModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Camera Viewport */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
          
          <div className="relative overflow-hidden rounded-2xl bg-black border border-slate-800 shadow-md flex items-center justify-center min-h-[280px]">
            {/* HTML5 QR reader target container */}
            <div id="interactive-qr-reader" className="w-full h-full min-h-[280px]" />

            {/* Custom Scanning Laser Animation Overlay for Square QR Code & Barcode */}
            {isScanning && !scannedSuccessCode && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-center items-center">
                <div className="w-52 h-52 sm:w-60 sm:h-60 border-2 border-indigo-400/90 rounded-2xl relative overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                  {/* Corner Targets */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-300" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-300" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-300" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-300" />
                  
                  {/* Scanning beam */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_12px_#818cf8] animate-pulse absolute top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-white/95 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full font-medium mt-3 shadow-xs">
                  Posisikan QR Code / Barcode di dalam kotak
                </p>
              </div>
            )}

            {/* Visual Success Overlay */}
            {scannedSuccessCode && (
              <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 p-4 animate-in zoom-in-90 duration-150">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
                <h4 className="font-extrabold text-base text-white">QR Code Berhasil Terbaca!</h4>
                <span className="px-3 py-1 bg-white/20 rounded-lg text-xs font-mono font-bold tracking-wider">
                  {scannedSuccessCode}
                </span>
              </div>
            )}

            {!isScanning && !scanError && !scannedSuccessCode && (
              <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white gap-3 p-4">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-xs font-semibold text-slate-300">Menghubungkan Sensor Kamera...</p>
              </div>
            )}
          </div>

          {scanError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                <span className="leading-relaxed font-medium">{scanError}</span>
              </div>
              <button
                type="button"
                onClick={startScanner}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Coba Buka Kamera Lagi</span>
              </button>
            </div>
          )}

          {/* Camera Switcher (If multiple cameras detected) */}
          {cameras.length > 1 && (
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-600">
              <span className="truncate pr-2">Kamera: <strong>{cameras[currentCameraIndex]?.label || `Kamera ${currentCameraIndex + 1}`}</strong></span>
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-indigo-700 rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer flex-shrink-0"
              >
                <SwitchCamera className="w-3.5 h-3.5" />
                <span>Ganti Kamera</span>
              </button>
            </div>
          )}

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="pt-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Atau Ketik / Tempel SKU Manual:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: WZ-2GD-BO-033"
                value={manualSkuInput}
                onChange={(e) => setManualSkuInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!manualSkuInput.trim()}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span>Pilih</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={handleCloseModal}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Tutup Scanner
          </button>
        </div>

      </div>
    </div>
  );
}
