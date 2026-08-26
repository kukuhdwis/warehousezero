import React, { useState, useEffect } from 'react';
import { Warehouse, Clock } from 'lucide-react';

export default function Navbar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-4 lg:px-8 py-3 flex items-center justify-between">
        
        {/* Brand / Title (Clean & Centered/Aligned) */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 font-bold flex-shrink-0">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 tracking-tight text-base sm:text-lg leading-tight">
              NDK Warehouse
            </h1>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Warehouse Management System
            </p>
          </div>
        </div>

        {/* Right: Real-time Clock (Desktop only) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-600 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{time.toLocaleTimeString('id-ID')} WIB</span>
        </div>

      </div>
    </header>
  );
}
