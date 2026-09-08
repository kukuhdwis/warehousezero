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
            className="fixed inset-0 bg-ink/70 backdrop-blur-xs animate-in fade-in duration-200"
          />

          {/* Bottom Sheet Drawer */}
          <div className="fixed bottom-0 left-0 right-0 bg-paper dark:bg-zinc-950 rounded-t-3xl p-5 border-t border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto space-y-4">
            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-2" />
            
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="font-display uppercase tracking-wider font-bold text-zinc-900 dark:text-white text-base">Menu Lainnya</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Navigasi dan administrasi akun</p>
              </div>
              <button 
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 rounded-full cursor-pointer"
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
                    ? 'bg-ember-tint dark:bg-ember/20 text-ember dark:text-ember font-bold border border-ember/30' 
                    : 'bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${activeTab === 'history' ? 'bg-ember text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>
                  <History className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-sm">Riwayat Transaksi</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">Audit trail barang masuk & keluar</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('monitoring');
                  setIsMoreMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition cursor-pointer ${
                  activeTab === 'monitoring' 
                    ? 'bg-ember-tint dark:bg-ember/20 text-ember dark:text-ember font-bold border border-ember/30' 
                    : 'bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${activeTab === 'monitoring' ? 'bg-ember text-white' : 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300'}`}>
                  <Eye className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-sm">
                    {currentUser?.role === 'STAFF_BRANCH' ? 'Monitoring Toko' : 'Monitoring Cabang'}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
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
                        ? 'bg-ember-tint dark:bg-ember/20 text-ember dark:text-ember font-bold border border-ember/30' 
                        : 'bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${activeTab === 'users' ? 'bg-ember text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-sm">Manajemen Pengguna</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">Kelola akun admin & staff</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('branches');
                      setIsMoreMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition cursor-pointer ${
                      activeTab === 'branches' 
                        ? 'bg-ember-tint dark:bg-ember/20 text-ember dark:text-ember font-bold border border-ember/30' 
                        : 'bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${activeTab === 'branches' ? 'bg-ember text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-sm">Kelola Cabang & Gudang</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">Pusat & cabang operasional</p>
                    </div>
                  </button>
                </>
              )}

              {/* User Account Info Bar */}
              {currentUser && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ember to-ember-deep text-white flex items-center justify-center font-bold text-xs">
                      {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-xs text-zinc-900 dark:text-white leading-tight">{currentUser.name}</p>
                      <p className="text-[10px] text-zinc-400">{currentUser.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-ember-tint dark:bg-ember/20 text-ember">
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
                className="w-full flex items-center justify-center gap-2 py-3 bg-ember-tint dark:bg-ember/20 hover:bg-ember/30 border border-ember/40 text-ember font-semibold rounded-2xl text-sm transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Akun</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Sticky Bottom Navigation Bar for Smartphones */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800/80 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-colors">
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
                    ? 'text-ember font-bold' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium'
                }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive ? 'bg-ember-tint dark:bg-ember/20 scale-110' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-ember' : ''}`} />
                </div>
                <span className="text-[10px] tracking-tight leading-tight mt-0.5">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-ember mt-0.5" />
                )}
              </button>
            );
          })}

          {/* More / Menu Button */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition touch-manipulation cursor-pointer ${
              ['history', 'users', 'branches'].includes(activeTab) || isMoreMenuOpen
                ? 'text-ember font-bold' 
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition ${['history', 'users', 'branches'].includes(activeTab) ? 'bg-ember-tint dark:bg-ember/20 scale-110' : ''}`}>
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight leading-tight mt-0.5">Menu</span>
            {['history', 'users', 'branches'].includes(activeTab) && (
              <span className="w-1.5 h-1.5 rounded-full bg-ember mt-0.5" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
