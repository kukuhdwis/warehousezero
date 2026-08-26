import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  Users, 
  Building2, 
  LogOut, 
  ShieldCheck, 
  UserCheck,
  Eye 
} from 'lucide-react';

export default function Sidebar({ 
  currentUser, 
  activeTab, 
  setActiveTab, 
  onLogout 
}) {
  const isAdmin = currentUser?.role === 'ADMIN';

  const operationalItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Master Data Produk', icon: Package },
    { id: 'stock-in', label: 'Barang Masuk (Inbound)', icon: ArrowDownLeft, color: 'text-emerald-500' },
    { id: 'stock-out', label: 'Barang Keluar (Outbound)', icon: ArrowUpRight, color: 'text-rose-500' },
    { id: 'history', label: 'Riwayat Transaksi', icon: History },
  ];

  const adminItems = [
    { id: 'monitoring', label: 'Monitoring Cabang', icon: Eye, color: 'text-amber-500' },
    { id: 'users', label: 'Manajemen Pengguna', icon: Users, color: 'text-sky-500' },
    { id: 'branches', label: 'Kelola Cabang & Gudang', icon: Building2, color: 'text-indigo-500' },
  ];

  return (
    <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col justify-between flex-shrink-0 min-h-[calc(100vh-61px)]">
      <div className="p-4 space-y-6 overflow-y-auto flex-1">
        
        {/* Main Operational Menu */}
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Menu Operasional
          </p>
          <nav className="space-y-1">
            {operationalItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer
                    ${isActive 
                      ? 'bg-sky-50 text-sky-700 font-semibold shadow-2xs' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : (item.color || 'text-slate-400')}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin Management Section */}
        {isAdmin && (
          <div>
            <div className="px-3 flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
                Administrasi Sistem
              </p>
              <span className="text-[9px] px-1.5 py-0.2 bg-sky-100 text-sky-700 font-bold rounded">
                ADMIN
              </span>
            </div>
            <nav className="space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer
                      ${isActive 
                        ? 'bg-sky-50 text-sky-700 font-semibold shadow-2xs' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : (item.color || 'text-slate-400')}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

      </div>

      {/* Menu Footer: User Profile & Logout (Desktop Only) */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/60 space-y-2.5">
        {currentUser && (
          <div className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200/80">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              isAdmin 
                ? 'bg-sky-100 text-sky-700' 
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 truncate">
                {currentUser.branchName || (currentUser.branchId === 'ALL' ? 'Semua Cabang' : currentUser.branchId)}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-600 hover:text-rose-700 rounded-xl text-xs font-semibold transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar / Logout</span>
        </button>

        <p className="text-[10px] text-slate-400 text-center pt-0.5">
          Created by{' '}
          <a
            href="https://kukuhdwisaputra.site"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 hover:text-sky-700 hover:underline font-medium"
          >
            kukuhdwisaputra.site
          </a>
        </p>
      </div>

    </aside>
  );
}
