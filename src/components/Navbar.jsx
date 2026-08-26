import React, { useState, useEffect, useRef } from 'react';
import { 
  Warehouse, 
  Clock, 
  Bell, 
  Check, 
  CheckCheck, 
  AlertCircle, 
  Package, 
  Building2, 
  ShieldCheck, 
  Truck,
  Send,
  X,
  ExternalLink 
} from 'lucide-react';

export default function Navbar({ 
  currentUser, 
  notifications = [], 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onNavigate 
}) {
  const [time, setTime] = useState(new Date());
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Defensive safe array for notifications
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => n && !n.isRead).length;

  const formatNotifTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      return `${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • ${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
    } catch (e) {
      return dateStr || '-';
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif) return;
    if (!notif.isRead && onMarkAsRead) {
      onMarkAsRead(notif.id);
    }
    
    if (onNavigate) {
      if (notif.type === 'STOCK_REQUEST_SUBMITTED') {
        if (currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF_PUSAT' || currentUser?.role === 'PUSAT') {
          onNavigate('stock-out', { type: 'STOCK_REQUEST_SUBMITTED', metaId: notif.metaId, notif });
        }
      } else if (notif.type === 'STOCK_TRANSFER_INCOMING' || notif.type === 'STOCK_REQUEST_APPROVED') {
        onNavigate('stock-in', { type: notif.type, metaId: notif.metaId, notif });
      } else if (notif.type === 'STOCK_REQUEST_REJECTED') {
        onNavigate('stock-in', { type: notif.type, tab: 'REQUEST_STOCK', metaId: notif.metaId, notif });
      } else if (notif.type === 'STOCK_TRANSFER_RECEIVED') {
        onNavigate('monitoring', { type: 'STOCK_TRANSFER_RECEIVED', metaId: notif.metaId, notif });
      } else if (notif.type === 'INVENTORY_REQUEST') {
        if (currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF_PUSAT' || currentUser?.role === 'PUSAT') {
          onNavigate('products', { tab: 'branch-requests', metaId: notif.metaId });
        }
      } else if (notif.type === 'INVENTORY_APPROVED' || notif.type === 'INVENTORY_REJECTED') {
        onNavigate('products', { tab: 'my-branch' });
      } else {
        onNavigate('dashboard');
      }
    }
    setIsNotifOpen(false);
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-4 lg:px-8 py-3 flex items-center justify-between">
        
        {/* Brand / Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 font-bold flex-shrink-0">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 tracking-tight text-base sm:text-lg leading-tight">
                NDK Warehouse
              </h1>
              {currentUser?.branchName && (
                <span className="hidden md:inline-flex px-2 py-0.2 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {currentUser.branchName}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Warehouse Management System
            </p>
          </div>
        </div>

        {/* Right Section: Notification Center & Clock */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Notification Center Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer active:scale-95"
              title="Notifikasi & Validasi Alur"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                
                {/* Dropdown Header */}
                <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-900">Pusat Notifikasi</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                        {unreadCount} Baru
                      </span>
                    )}
                  </div>

                  {unreadCount > 0 && onMarkAllAsRead && (
                    <button
                      type="button"
                      onClick={() => onMarkAllAsRead(currentUser)}
                      className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Tandai Semua</span>
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {safeNotifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 space-y-1.5">
                      <Bell className="w-6 h-6 mx-auto text-slate-300 stroke-1" />
                      <p className="text-xs font-medium">Belum ada notifikasi baru.</p>
                    </div>
                  ) : (
                    safeNotifications.map((notif) => {
                      if (!notif) return null;
                      const isRequest = notif.type === 'INVENTORY_REQUEST';
                      const isApproved = notif.type === 'INVENTORY_APPROVED';
                      const isRejected = notif.type === 'INVENTORY_REJECTED';
                      const isStockReq = notif.type === 'STOCK_REQUEST_SUBMITTED';
                      const isStockIncoming = notif.type === 'STOCK_TRANSFER_INCOMING';
                      const isStockReceived = notif.type === 'STOCK_TRANSFER_RECEIVED';
                      const isStockApproved = notif.type === 'STOCK_REQUEST_APPROVED';
                      const isStockRejected = notif.type === 'STOCK_REQUEST_REJECTED';

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3 ${
                            !notif.isRead ? 'bg-indigo-50/40 border-l-2 border-indigo-500' : ''
                          }`}
                        >
                          <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                            isStockReq
                              ? 'bg-indigo-100 text-indigo-700'
                              : (isStockIncoming || isStockApproved)
                                ? 'bg-emerald-100 text-emerald-700'
                                : isStockRejected
                                  ? 'bg-rose-100 text-rose-700'
                                  : isStockReceived
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : isRequest 
                                      ? 'bg-amber-100 text-amber-700' 
                                      : isApproved 
                                        ? 'bg-emerald-100 text-emerald-700' 
                                        : isRejected
                                          ? 'bg-rose-100 text-rose-700'
                                          : 'bg-sky-100 text-sky-700'
                          }`}>
                            {isStockReq && <Package className="w-4 h-4" />}
                            {(isStockIncoming || isStockApproved) && <Truck className="w-4 h-4" />}
                            {isStockRejected && <AlertCircle className="w-4 h-4" />}
                            {isStockReceived && <Check className="w-4 h-4" />}
                            {isRequest && <Building2 className="w-4 h-4" />}
                            {isApproved && <Check className="w-4 h-4" />}
                            {isRejected && <AlertCircle className="w-4 h-4" />}
                            {!isStockReq && !isStockIncoming && !isStockApproved && !isStockRejected && !isStockReceived && !isRequest && !isApproved && !isRejected && <Package className="w-4 h-4" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {notif.title || 'Notifikasi'}
                              </h4>
                              {!notif.isRead && (
                                <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                              {notif.message || ''}
                            </p>
                            <span className="text-[10px] text-slate-400 block mt-1">
                              {formatNotifTime(notif.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Dropdown Footer */}
                {notifications.length > 0 && (
                  <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-medium">
                      Monitoring alur persetujuan inventaris & mutasi stok
                    </p>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Right: Real-time Clock (Desktop only) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-600 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{time.toLocaleTimeString('id-ID')} WIB</span>
          </div>

        </div>

      </div>
    </header>
  );
}
