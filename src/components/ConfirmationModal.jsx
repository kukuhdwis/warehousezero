import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle, 
  X, 
  ArrowRight,
  Package,
  Layers,
  Send,
  Trash2,
  Check,
  ShieldAlert
} from 'lucide-react';

/**
 * Universal Interactive Confirmation Modal
 * Replaces simple or missing confirmation steps with a rich, detailed verification dialog.
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Konfirmasi Tindakan",
  subtitle = "Mohon periksa kembali data sebelum melanjutkan.",
  type = "PRIMARY", // 'PRIMARY' (sky) | 'SUCCESS' (emerald) | 'WARNING' (amber) | 'DANGER' (rose)
  icon: CustomIcon = null,
  confirmText = "Ya, Konfirmasi",
  cancelText = "Periksa Kembali",
  summaryItems = [], // Array of { label: string, value: string | number | ReactNode, highlight?: boolean, badge?: string, color?: string }
  itemsList = [],    // Array of { name: string, sku?: string, brand?: string, qty?: number | string, unit?: string, note?: string, price?: number }
  itemsTitle = "Daftar Barang:",
  warningNote = null,
  isLoading = false,
  maxWidth = "max-w-lg" // 'max-w-md' | 'max-w-lg' | 'max-w-xl' | 'max-w-2xl'
}) {
  if (!isOpen) return null;

  const isDanger = type === 'DANGER';
  const isWarning = type === 'WARNING';
  const isSuccess = type === 'SUCCESS';
  const isPrimary = type === 'PRIMARY' || (!isDanger && !isWarning && !isSuccess);

  // Theme styles
  const theme = {
    iconBg: isDanger ? 'bg-rose-100 text-rose-600' : isWarning ? 'bg-amber-100 text-amber-600' : isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600',
    headerBg: isDanger ? 'bg-rose-50/70 border-rose-100' : isWarning ? 'bg-amber-50/70 border-amber-100' : isSuccess ? 'bg-emerald-50/70 border-emerald-100' : 'bg-sky-50/70 border-sky-100',
    confirmBtn: isDanger ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30 text-white' : isWarning ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30 text-white' : isSuccess ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 text-white' : 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/30 text-white',
    ringColor: isDanger ? 'focus:ring-rose-500' : isWarning ? 'focus:ring-amber-500' : isSuccess ? 'focus:ring-emerald-500' : 'focus:ring-sky-500',
    badgeBg: isDanger ? 'bg-rose-50 text-rose-700 border-rose-200' : isWarning ? 'bg-amber-50 text-amber-700 border-amber-200' : isSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-sky-50 text-sky-700 border-sky-200'
  };

  const DefaultIcon = isDanger ? Trash2 : isWarning ? AlertTriangle : isSuccess ? CheckCircle2 : Send;
  const RenderIcon = CustomIcon || DefaultIcon;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200 pointer-events-auto">
      <div className={`bg-white rounded-3xl shadow-2xl w-full ${maxWidth} overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[90vh]`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${theme.headerBg}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-xs ${theme.iconBg}`}>
              <RenderIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-snug">{title}</h3>
              <p className="text-xs text-slate-500 leading-tight">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white/60 transition cursor-pointer disabled:opacity-50"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-4 text-sm overflow-y-auto flex-1">
          
          {/* Key Summary Grid / Badges */}
          {summaryItems.length > 0 && (
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
              <div className="grid grid-cols-2 gap-2.5">
                {summaryItems.map((item, idx) => (
                  <div key={idx} className={`p-2 rounded-xl ${item.highlight ? 'bg-white border border-slate-200 shadow-2xs' : ''}`}>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      {item.label}
                    </span>
                    <span className={`text-xs font-bold block truncate mt-0.5 ${item.color || (item.highlight ? 'text-slate-900 text-sm' : 'text-slate-700')}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List of Items Breakdown (if multiple items exist) */}
          {itemsList.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {itemsTitle}
                </label>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700">
                  {itemsList.length} Item
                </span>
              </div>

              <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-slate-50/40">
                {itemsList.map((item, index) => (
                  <div key={index} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-white/80 transition">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 truncate">{item.name}</span>
                        {item.brand && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                            {item.brand}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                        {item.sku && <span>SKU: {item.sku}</span>}
                        {item.note && <span className="text-slate-600 italic">({item.note})</span>}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`font-extrabold text-sm ${isDanger ? 'text-rose-600' : isWarning ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {item.qty !== undefined ? `${item.qty} ${item.unit || 'Pcs'}` : ''}
                      </span>
                      {item.price !== undefined && item.price > 0 && (
                        <span className="block text-[10px] text-slate-400">
                          Rp {(Number(item.price) || 0).toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning / Important Note */}
          {warningNote && (
            <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs ${theme.badgeBg}`}>
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">
                {warningNote}
              </p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200/70 active:bg-slate-200 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${theme.confirmBtn}`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <RenderIcon className="w-4 h-4" />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
