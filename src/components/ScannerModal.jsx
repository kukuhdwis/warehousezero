import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, RefreshCw, SwitchCamera } from 'lucide-react';

export default function ScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [scanError, setScanError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const html5QrcodeRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    setScanError(null);
    setIsScanning(false);

    let html5Qrcode = null;

    const startScanner = async () => {
      try {
        // Fetch available camera devices
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setScanError('Tidak ditemukan perangkat kamera yang aktif pada perangkat Anda.');
          return;
        }

        setCameras(devices);

        // Prefer rear/back camera for scanning on mobile devices
        const backCameraIndex = devices.findIndex(d => 
          (d.label || '').toLowerCase().includes('back') || 
          (d.label || '').toLowerCase().includes('rear') || 
          (d.label || '').toLowerCase().includes('belakang')
        );
        const selectedIndex = backCameraIndex !== -1 ? backCameraIndex : 0;
        setCurrentCameraIndex(selectedIndex);

        html5Qrcode = new Html5Qrcode("interactive-qr-reader");
        html5QrcodeRef.current = html5Qrcode;

        const targetCameraId = devices[selectedIndex].id;

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minDim = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minDim * 0.8),
              height: Math.floor(minDim * 0.5)
            };
          },
          aspectRatio: 1.333
        };

        await html5Qrcode.start(
          targetCameraId,
          config,
          (decodedText) => {
            if (decodedText) {
              onScanSuccess(decodedText);
              stopScanner();
              onClose();
            }
          },
          () => {}
        );

        setIsScanning(true);
      } catch (err) {
        console.warn("Gagal membuka cameraId spesifik, mencoba facingMode fallback:", err);
        try {
          if (!html5Qrcode) {
            html5Qrcode = new Html5Qrcode("interactive-qr-reader");
            html5QrcodeRef.current = html5Qrcode;
          }
          await html5Qrcode.start(
            { facingMode: "environment" },
            { fps: 15, qrbox: { width: 250, height: 150 } },
            (decodedText) => {
              if (decodedText) {
                onScanSuccess(decodedText);
                stopScanner();
                onClose();
              }
            },
            () => {}
          );
          setIsScanning(true);
        } catch (fallbackErr) {
          console.error("Gagal total mengakses kamera:", fallbackErr);
          setScanError(`Gagal mengakses kamera: ${fallbackErr.message || err.message || 'Izin kamera ditolak'}. Pastikan browser diizinkan mengakses kamera.`);
        }
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
        await html5QrcodeRef.current.clear();
      } catch (e) {
        console.warn("Clean scanner:", e);
      }
      html5QrcodeRef.current = null;
    }
    setIsScanning(false);
  };

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
        { fps: 15, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          if (decodedText) {
            onScanSuccess(decodedText);
            stopScanner();
            onClose();
          }
        },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base leading-tight">Scan Barcode / QR Code</h3>
              <p className="text-xs text-slate-400">Arahkan kamera HP / Webcam ke kode barcode produk</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleCloseModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Camera Viewport */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          <div className="relative overflow-hidden rounded-2xl bg-black border border-slate-800 shadow-md flex items-center justify-center min-h-[300px]">
            {/* HTML5 QR reader target container */}
            <div id="interactive-qr-reader" className="w-full h-full min-h-[300px]" />

            {/* Custom Scanning Laser Animation Overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-center items-center">
                <div className="w-3/4 h-36 border-2 border-sky-400/80 rounded-xl relative overflow-hidden shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_10px_#38bdf8] animate-pulse absolute top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-white/90 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full font-medium mt-3 shadow-xs">
                  Posisikan Barcode produk tepat di dalam garis kotak
                </p>
              </div>
            )}

            {!isScanning && !scanError && (
              <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white gap-3 p-4">
                <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="text-xs font-semibold text-slate-300">Menghubungkan & Membuka Sensor Kamera...</p>
              </div>
            )}
          </div>

          {scanError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{scanError}</span>
            </div>
          )}

          {/* Camera Switcher (If multiple cameras detected) */}
          {cameras.length > 1 && (
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
              <span className="truncate pr-2">Kamera: <strong>{cameras[currentCameraIndex]?.label || `Kamera ${currentCameraIndex + 1}`}</strong></span>
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-sky-700 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer flex-shrink-0"
              >
                <SwitchCamera className="w-3.5 h-3.5" />
                <span>Ganti Kamera</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={handleCloseModal}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Tutup Scanner
          </button>
        </div>

      </div>
    </div>
  );
}
