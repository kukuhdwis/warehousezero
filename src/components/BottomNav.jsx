import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  Users, 
  Building2, 
  MoreHorizontal,
  X,
  LogOut,
  ShieldCheck,
  UserCheck,
  Eye
} from 'lucide-react';

export default function BottomNav({ 
  currentUser, 
  activeTab, 
  setActiveTab, 
  onLogout 
}) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const isAdmin = currentUser?.role === 'ADMIN';

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'products', label: 'Produk', icon: Package },
    { id: 'stock-in', label: 'Masuk', icon: ArrowDownLeft, color: 'text-emerald-500' },
    { id: 'stock-out', label: 'Keluar', icon: ArrowUpRight, color: 'text-rose-500' },
  ];

  return (
    <>
      {/* Mobile More Actions Bottom Sheet */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            onClick={() => setIsMoreMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          />

          {/* Bottom Sheet Drawer */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl p-5 border-t border-slate-200 dark:border-slate-800 shadow-2xl z-50 animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto space-y-4">
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-2" />
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Menu Lainnya</h3>
                <p className="text-xs text-slate-400 dark:text-slate-400">Navigasi dan administrasi akun</p>
              </div>
              <button 
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Links */}
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setActiveTab('history');
                  setIsMoreMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition cursor-pointer ${
                  activeTab === 'history' 
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold' 
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-sm">Riwayat Transaksi</p>
                  <p className="text-xs text-slate-400 dark:text-slate-400">Audit trail barang masuk & keluar</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('monitoring');
                  setIsMoreMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition cursor-pointer ${
                  activeTab === 'monitoring' 
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold' 
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-sm">
                    {currentUser?.role === 'STAFF_BRANCH' ? 'Monitoring Toko' : 'Monitoring Cabang'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-400">
                    {currentUser?.role === 'STAFF_BRANCH' ? 'Transparansi stok & estimasi profit toko' : 'Transparansi stok & estimasi profit cabang'}
                  </p>
                </div>
              </button>

              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      setActiveTab('users');
                      setIsMoreMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition cursor-pointer ${
                      activeTab === 'users' 
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold' 
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-sm">Manajemen Pengguna</p>
                      <p className="text-xs text-slate-400 dark:text-slate-400">Kelola akun admin & staff</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('branches');
                      setIsMoreMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition cursor-pointer ${
                      activeTab === 'branches' 
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold' 
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-sm">Kelola Cabang & Gudang</p>
                      <p className="text-xs text-slate-400 dark:text-slate-400">Lokasi gudang & penanggung jawab</p>
                    </div>
                  </button>
                </>
              )}
            </div>

            {/* Profile Card & Logout */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              {currentUser && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    isAdmin 
                      ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300' 
                      : (currentUser?.role === 'STAFF_PUSAT' || currentUser?.role === 'PUSAT')
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {isAdmin ? <ShieldCheck className="w-5 h-5" /> : (currentUser?.role === 'STAFF_PUSAT' || currentUser?.role === 'PUSAT') ? <Eye className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/80 px-1.5 py-0.2 rounded">
                      {currentUser.branchName || 'Semua Cabang'}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold rounded-2xl text-sm transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Akun</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Sticky Bottom Navigation Bar for Smartphones */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] transition-colors">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMoreMenuOpen(false);
                }}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition relative touch-manipulation cursor-pointer ${
                  isActive 
                    ? 'text-sky-600 dark:text-sky-400 font-bold' 
                    : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive ? 'bg-sky-50 dark:bg-sky-950/70 scale-110' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-sky-600 dark:text-sky-400' : ''}`} />
                </div>
                <span className="text-[10px] tracking-tight leading-tight mt-0.5">{item.label}</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-sky-600 dark:bg-sky-400 mt-0.5" />
                )}
              </button>
            );
          })}

          {/* More / Menu Button */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition touch-manipulation cursor-pointer ${
              ['history', 'users', 'branches'].includes(activeTab) || isMoreMenuOpen
                ? 'text-sky-600 dark:text-sky-400 font-bold' 
                : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition ${['history', 'users', 'branches'].includes(activeTab) ? 'bg-sky-50 dark:bg-sky-950/70 scale-110' : ''}`}>
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight leading-tight mt-0.5">Menu</span>
            {['history', 'users', 'branches'].includes(activeTab) && (
              <span className="w-1 h-1 rounded-full bg-sky-600 dark:bg-sky-400 mt-0.5" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
