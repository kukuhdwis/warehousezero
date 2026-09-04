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
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ 
  currentUser, 
  activeTab, 
  setActiveTab, 
  onLogout,
  isCollapsed,
  setIsCollapsed
}) {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isStaffPusat = currentUser?.role === 'STAFF_PUSAT' || currentUser?.role === 'PUSAT';

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
    <aside className={`hidden lg:flex transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-slate-200 flex-col justify-between flex-shrink-0 min-h-[calc(100vh-61px)] relative`}>
      
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-6 bg-white border border-slate-200 shadow-sm rounded-full p-1 text-slate-400 hover:text-sky-600 hover:border-sky-200 z-10 transition-colors cursor-pointer"
        title={isCollapsed ? "Perbesar Menu" : "Perkecil Menu"}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={`p-4 space-y-6 overflow-y-auto flex-1 ${isCollapsed ? 'px-2' : ''}`}>
        
        {/* Main Operational Menu */}
        <div>
          {!isCollapsed && (
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 truncate">
              Menu Operasional
            </p>
          )}
          <nav className="space-y-1">
            {operationalItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`
                    w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'} rounded-xl font-medium text-sm transition cursor-pointer
                    ${isActive 
                      ? 'bg-sky-50 text-sky-700 font-semibold shadow-2xs' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-sky-600' : (item.color || 'text-slate-400')}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Staff Pusat Monitoring Section */}
        {isStaffPusat && !isAdmin && (
          <div>
            {!isCollapsed ? (
              <div className="px-3 flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 truncate">
                  Monitoring Pusat
                </p>
                <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold rounded flex-shrink-0 ml-1">
                  PUSAT
                </span>
              </div>
            ) : (
              <div className="flex justify-center mb-2">
                <span className="text-[8px] px-1 py-0.2 bg-amber-100 text-amber-800 font-bold rounded">PST</span>
              </div>
            )}
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('monitoring')}
                title={isCollapsed ? "Monitoring Cabang" : undefined}
                className={`
                  w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'} rounded-xl font-medium text-sm transition cursor-pointer
                  ${activeTab === 'monitoring' 
                    ? 'bg-amber-50 text-amber-800 font-semibold shadow-2xs' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                `}
              >
                <Eye className={`w-5 h-5 flex-shrink-0 ${activeTab === 'monitoring' ? 'text-amber-600' : 'text-amber-500'}`} />
                {!isCollapsed && <span className="truncate">Monitoring Cabang</span>}
              </button>
            </nav>
          </div>
        )}

        {/* Staff Cabang Monitoring Section */}
        {!isAdmin && !isStaffPusat && (
          <div>
            {!isCollapsed ? (
              <div className="px-3 flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 truncate">
                  Monitoring Toko
                </p>
                <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded flex-shrink-0 ml-1">
                  TOKO
                </span>
              </div>
            ) : (
              <div className="flex justify-center mb-2">
                <span className="text-[8px] px-1 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded">TOKO</span>
              </div>
            )}
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('monitoring')}
                title={isCollapsed ? "Monitoring Toko" : undefined}
                className={`
                  w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'} rounded-xl font-medium text-sm transition cursor-pointer
                  ${activeTab === 'monitoring' 
                    ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-2xs' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                `}
              >
                <Eye className={`w-5 h-5 flex-shrink-0 ${activeTab === 'monitoring' ? 'text-emerald-600' : 'text-emerald-500'}`} />
                {!isCollapsed && <span className="truncate">Monitoring Toko</span>}
              </button>
            </nav>
          </div>
        )}

        {/* Admin Management Section */}
        {isAdmin && (
          <div>
            {!isCollapsed ? (
              <div className="px-3 flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600 truncate">
                  Administrasi Sistem
                </p>
                <span className="text-[9px] px-1.5 py-0.2 bg-sky-100 text-sky-700 font-bold rounded flex-shrink-0 ml-1">
                  ADMIN
                </span>
              </div>
            ) : (
              <div className="flex justify-center mb-2">
                <span className="text-[8px] px-1 py-0.2 bg-sky-100 text-sky-700 font-bold rounded">ADM</span>
              </div>
            )}
            <nav className="space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`
                      w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'} rounded-xl font-medium text-sm transition cursor-pointer
                      ${isActive 
                        ? 'bg-sky-50 text-sky-700 font-semibold shadow-2xs' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                    `}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-sky-600' : (item.color || 'text-slate-400')}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

      </div>

      {/* Menu Footer: (Desktop Only) */}
      <div className={`p-3 border-t border-slate-200 bg-slate-50/60 flex justify-center ${isCollapsed ? 'hidden' : ''}`}>
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
