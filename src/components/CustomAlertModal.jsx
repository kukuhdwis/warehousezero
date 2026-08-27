import React from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

/**
 * Universal Interactive Custom Alert & Warning Modal
 * Replaces native browser alert() with a modern, glassmorphic, interactive pop-up.
 */
export default function CustomAlertModal({
  isOpen,
  onClose,
  title = "Pemberitahuan System",
  message = "",
  type = "WARNING", // 'WARNING' | 'ERROR' | 'INFO'
  buttonText = "Mengerti & Tutup"
}) {
  if (!isOpen) return null;

  const isError = type === 'ERROR';
  const isInfo = type === 'INFO';
  const isWarning = type === 'WARNING' || (!isError && !isInfo);

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200 pointer-events-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 relative my-auto">
        
        {/* Close Cross */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-7 sm:p-8 text-center space-y-5">
          
          {/* Icon Container */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg animate-in zoom-in duration-200 ${
            isError 
              ? 'bg-rose-500 text-white shadow-rose-500/30' 
              : isWarning
              ? 'bg-amber-500 text-white shadow-amber-500/30'
              : 'bg-sky-500 text-white shadow-sky-500/30'
          }`}>
            {isError ? (
              <AlertCircle className="w-9 h-9 stroke-[2.5]" />
            ) : isWarning ? (
              <AlertTriangle className="w-9 h-9 stroke-[2.5]" />
            ) : (
              <Info className="w-9 h-9 stroke-[2.5]" />
            )}
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
              {message}
            </p>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-3.5 text-white font-bold rounded-2xl text-sm shadow-lg transition active:scale-98 cursor-pointer flex items-center justify-center gap-2 ${
              isError
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                : 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20'
            }`}
          >
            <span>{buttonText}</span>
          </button>

        </div>
      </div>
    </div>
  );
}
