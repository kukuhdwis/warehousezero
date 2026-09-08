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
  ExternalLink,
  User,
  LogOut,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';

export default function Navbar({ 
  currentUser, 
  notifications = [], 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onNavigate,
  onLogout,
  isDark = true,
  onToggleDark
}) {
  const [time, setTime] = useState(new Date());
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
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
      } else if (notif.type === 'STOCK_TRANSFER_REJECTED') {
        onNavigate('history', { type: 'STOCK_TRANSFER_REJECTED', metaId: notif.metaId, notif });
      } else if (notif.type === 'INVENTORY_REQUEST') {
        if (currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF_PUSAT' || currentUser?.role === 'PUSAT') {
          onNavigate('products', { tab: 'APPROVAL_REQUESTS', metaId: notif.metaId });
        }
      } else if (notif.type === 'INVENTORY_APPROVED' || notif.type === 'INVENTORY_REJECTED') {
        onNavigate('products', { tab: 'MY_BRANCH_INVENTORY' });
      } else {
        onNavigate('dashboard');
      }
    }
    setIsNotifOpen(false);
  };

  return (
    <header className="bg-paper/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 sticky top-0 z-30 shadow-xs transition-colors">
      <div className="px-4 lg:px-8 py-2.5 flex items-center justify-between">
        
        {/* Brand / Logo Lockup: NDK Exhaust × RGN Performance */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <a 
            href="/" 
            onClick={(e) => { 
              e.preventDefault(); 
              if (onNavigate) onNavigate('dashboard'); 
            }} 
            className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer py-1"
            title="Ke Beranda Dashboard WMS"
          >
            <div className="relative h-6 sm:h-7 w-[84px] sm:w-[94px] flex items-center">
              <img
                alt="NDK Exhaust"
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-200 ${
                  isDark ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                src="/logos/ndk-white.png"
              />
              <img
                alt="NDK Exhaust"
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-200 ${
                  isDark ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
                src="/logos/ndk-black.png"
              />
            </div>

            <span className={`h-4 sm:h-5 w-[1px] transition-colors ${isDark ? 'bg-zinc-700' : 'bg-zinc-300'}`} />

            <div className="relative h-5 sm:h-6 w-[74px] sm:w-[84px] flex items-center">
              <img
                alt="RGN Performance"
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-200 ${
                  isDark ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                src="/logos/rgn-white.png"
              />
              <img
                alt="RGN Performance"
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-200 ${
                  isDark ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
                src="/logos/rgn-black.png"
              />
            </div>
          </a>

          <div className="hidden sm:flex items-center gap-2 pl-2 sm:pl-3 border-l border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] font-display uppercase tracking-widest text-zinc-400 font-bold hidden md:inline">
              WMS
            </span>
            {currentUser?.branchName && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                {currentUser.branchName}
              </span>
            )}
          </div>
        </div>

        {/* Right Section: Notification Center, Theme Toggle & Clock */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          
          {/* E-Katalog Publik Preview Button */}
          <button
            type="button"
            onClick={() => window.open('/catalog', '_blank')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-ember border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-display uppercase tracking-wider font-semibold transition cursor-pointer shadow-2xs"
            title="Buka Halaman E-Katalog Publik di tab baru"
          >
            <span className="text-ember">●</span>
            <span>E-Katalog</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60 text-zinc-400" />
          </button>

          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={(e) => onToggleDark && onToggleDark(e)}
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-xl transition cursor-pointer active:scale-95"
            title={isDark ? "Ganti ke Light Mode" : "Ganti ke Dark Mode"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-90 transition-transform duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700 hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>
          
          {/* Notification Center Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-xl transition cursor-pointer active:scale-95"
              title="Notifikasi & Validasi Alur"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-ember text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border-2 border-paper dark:border-zinc-950 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-paper dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                
                {/* Dropdown Header */}
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/70 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-display uppercase tracking-wider font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">Pusat Notifikasi</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ember-tint dark:bg-ember/20 text-ember">
                        {unreadCount} Baru
                      </span>
                    )}
                  </div>

                  {unreadCount > 0 && onMarkAllAsRead && (
                    <button
                      type="button"
                      onClick={() => onMarkAllAsRead(currentUser)}
                      className="text-[11px] font-semibold text-ember hover:text-ember-deep flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Tandai Semua</span>
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {safeNotifications.length === 0 ? (
                    <div className="p-8 text-center text-zinc-400 dark:text-zinc-500 space-y-1.5">
                      <Bell className="w-6 h-6 mx-auto text-zinc-300 dark:text-zinc-600 stroke-1" />
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
                      const isStockRejected = notif.type === 'STOCK_REQUEST_REJECTED' || notif.type === 'STOCK_TRANSFER_REJECTED';

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer flex items-start gap-3 ${
                            !notif.isRead ? 'bg-ember/5 dark:bg-ember/10 border-l-2 border-ember' : ''
                          }`}
                        >
                          <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                            isStockReq
                              ? 'bg-zinc-100 dark:bg-zinc-800 text-ember'
                              : (isStockIncoming || isStockApproved)
                                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                                : isStockRejected
                                  ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                                  : isStockReceived
                                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                                    : isRequest 
                                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300' 
                                      : isApproved 
                                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300' 
                                        : isRejected
                                          ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
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
                              <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                {notif.title || 'Notifikasi'}
                              </h4>
                              {!notif.isRead && (
                                <span className="w-2 h-2 rounded-full bg-ember flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">
                              {notif.message || ''}
                            </p>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block mt-1">
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
                  <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/70 border-t border-zinc-200 dark:border-zinc-800 text-center">
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                      Monitoring alur persetujuan inventaris & mutasi stok
                    </p>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Right: Real-time Clock (Desktop only) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-300 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{time.toLocaleTimeString('id-ID')} WIB</span>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative ml-1" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 pr-2 sm:pr-3 bg-paper dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-full transition cursor-pointer active:scale-95 shadow-2xs"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-ember to-ember-deep text-white flex items-center justify-center font-bold text-xs shadow-inner">
                {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left max-w-[100px]">
                <p className="text-xs font-bold text-zinc-900 dark:text-white truncate leading-tight">
                  {currentUser?.name || 'User'}
                </p>
                <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-medium truncate leading-tight">
                  {currentUser?.role === 'ADMIN' ? 'Administrator' : 'Staff'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-paper dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/70 border-b border-zinc-200 dark:border-zinc-800">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {currentUser?.name || 'User Name'}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {currentUser?.email || 'user@email.com'}
                  </p>
                  <div className="mt-2 inline-flex px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-ember-tint dark:bg-ember/20 text-ember border border-ember/30 uppercase tracking-wider">
                    {currentUser?.role === 'ADMIN' ? 'Lord Admin Pusat' : (currentUser?.role || 'Staff')}
                  </div>
                </div>
                
                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-ember hover:bg-ember/10 rounded-xl transition cursor-pointer text-sm font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar / Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
