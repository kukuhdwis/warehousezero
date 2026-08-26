import React from 'react';
import { Check, X } from 'lucide-react';

/**
 * Universal Success Pop-Up Modal
 * Matches modern UI card with green checkmark, title, description, and primary action button.
 */
export default function GlobalSuccessModal({
  isOpen,
  onClose,
  title = "Submission Successful!",
  message = "Data Anda telah berhasil dikirimkan dan diproses oleh sistem.",
  details = null, // Array of { label, value, highlight } or object
  buttonText = "✓ Mengerti & Tutup"
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200 pointer-events-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 relative my-auto">
        
        {/* Close cross button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-7 sm:p-8 text-center space-y-5">
          
          {/* Green Checkmark Circle Icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 animate-in zoom-in duration-200">
            <Check className="w-9 h-9 stroke-[3]" />
          </div>

          {/* Title and Message */}
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
              {message}
            </p>
          </div>

          {/* Optional Details Box */}
          {details && Array.isArray(details) && details.length > 0 && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2 text-xs">
              {details.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-200/60 last:border-0 last:pb-0">
                  <span className="text-slate-500">{item.label}:</span>
                  <span className={`font-bold ${item.highlight ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md' : 'text-slate-800'}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Primary Confirmation Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-emerald-600/20 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{buttonText}</span>
          </button>

        </div>
      </div>
    </div>
  );
}
