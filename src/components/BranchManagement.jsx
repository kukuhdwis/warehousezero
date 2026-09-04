import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Phone, 
  User, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  AlertCircle,
  Warehouse,
  Users
} from 'lucide-react';
import { db } from '../services/firebase';
import { matchesSearch } from '../utils/searchUtils';
import GlobalSuccessModal from './GlobalSuccessModal';
import CustomAlertModal from './CustomAlertModal';
import ConfirmationModal from './ConfirmationModal';

export default function BranchManagement({ 
  currentUser, 
  branches = [], 
  users = [], 
  onCreateBranch, 
  onUpdateBranch, 
  onDeleteBranch,
  onClearAllBranches
}) {
  const [alertModal, setAlertModal] = useState(null);
  const showAlert = (title, message, type = 'WARNING') => {
    setAlertModal({ title, message, type });
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');


  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [isExecutingSave, setIsExecutingSave] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [deleteConfirmBranch, setDeleteConfirmBranch] = useState(null);
  const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false);
  const [successModal, setSuccessModal] = useState(null);


  // Form State - Only the 5 essential fields requested
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    pic: '',
    phone: '',
    status: 'ACTIVE',
    branchType: 'RESELLER'
  });

  const [formError, setFormError] = useState('');

  // Helper to accurately filter staff assigned to a specific branch (including Staff Pusat for Gudang Utama Pusat)
  const getStaffInBranch = (branch) => {
    if (!branch || !users) return [];
    const isPusatBranch = branch.isPusat === true || branch.code === 'GUDANG-PUSAT' || (branch.name || '').toLowerCase().includes('gudang utama pusat');

    return users.filter(u => {
      if (u.role === 'ADMIN') return false; // Exclude root administrator from branch staff count
      
      if (isPusatBranch) {
        return (
          u.role === 'STAFF_PUSAT' || 
          u.role === 'PUSAT' || 
          u.branchId === branch.id || 
          u.branchId === 'branch-pusat-hq' || 
          (u.branchName || '').toLowerCase().includes('gudang utama pusat')
        );
      }
      return u.branchId === branch.id || u.branchName === branch.name;
    });
  };

  // Stats calculation
  const totalBranches = branches.length;
  const activeBranches = branches.filter(b => b.status === 'ACTIVE').length;
  const totalAssignedStaff = users.filter(u => u.role !== 'ADMIN' && (u.branchId || u.role === 'STAFF_PUSAT' || u.role === 'PUSAT')).length;

  // Filtered branches
  const filteredBranches = branches.filter(branch => {
    const matchesSearchTerm = matchesSearch(searchTerm, branch.name, branch.address, branch.pic, branch.phone);

    const matchesStatus = statusFilter === 'ALL' || branch.status === statusFilter;
    return matchesSearchTerm && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      address: '',
      pic: '',
      phone: '',
      status: 'ACTIVE',
      branchType: 'RESELLER'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (branch) => {
    setEditingBranch(branch);
    
    setFormData({
      name: branch.name || '',
      address: branch.address || '',
      pic: branch.pic || '',
      phone: branch.phone || '',
      status: branch.status || 'ACTIVE',
      branchType: branch.branchType || 'RESELLER'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handlePreSubmitBranch = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Nama Gudang / Cabang wajib diisi.');
      return;
    }

    setIsConfirmSaveOpen(true);
  };

  const handleExecuteSaveBranch = async () => {
    setIsExecutingSave(true);
    try {
      if (editingBranch) {
        await onUpdateBranch(editingBranch.id, {
          ...editingBranch,
          ...formData
        });
      } else {
        const generatedCode = `CB-${Math.floor(100 + Math.random() * 900)}`;
        await onCreateBranch({
          code: generatedCode,
          ...formData
        });
      }
      setIsConfirmSaveOpen(false);
      setIsModalOpen(false);

      setSuccessModal({
        title: editingBranch ? "Data Cabang Berhasil Diperbarui!" : "Cabang Baru Berhasil Didaftarkan!",
        message: editingBranch 
          ? "Perubahan data cabang telah berhasil disimpan ke database." 
          : "Cabang gudang baru telah resmi terdaftar dan siap untuk operasional mutasi inventaris.",
        details: [
          { label: "Nama Cabang", value: formData.name },
          { label: "PIC Penanggung Jawab", value: formData.pic || '-' },
          { label: "Status Operasional", value: formData.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif', highlight: true }
        ]
      });
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan data cabang.');
      setIsConfirmSaveOpen(false);
    } finally {
      setIsExecutingSave(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmBranch) return;
    try {
      await onDeleteBranch(deleteConfirmBranch.id);
      setDeleteConfirmBranch(null);
    } catch (err) {
      showAlert("Gagal Menghapus Cabang", err.message, "ERROR");
    }
  };


  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Kelola Cabang & Gudang</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
              Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manajemen master lokasi cabang gudang, penanggung jawab (PIC), dan status operasional.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {branches.length > 0 && (
            <button
              onClick={() => setIsDeleteAllConfirmOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl font-semibold text-xs transition cursor-pointer"
              title="Kosongkan seluruh data cabang di database"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Hapus Semua</span>
            </button>
          )}


          <button
            onClick={handleOpenAddModal}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-sky-600/20 transition active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Cabang Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Cabang</p>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900 mt-0.5 sm:mt-1">{totalBranches} <span className="text-[10px] sm:text-xs font-normal text-slate-500">Cabang</span></h3>
          </div>
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-slate-100 text-slate-600 items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Gudang Aktif</p>
            <h3 className="text-lg sm:text-2xl font-bold text-emerald-600 mt-0.5 sm:mt-1">{activeBranches} <span className="text-[10px] sm:text-xs font-normal text-emerald-700/80">Aktif</span></h3>
          </div>
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Staff</p>
            <h3 className="text-lg sm:text-2xl font-bold text-sky-600 mt-0.5 sm:mt-1">{totalAssignedStaff} <span className="text-[10px] sm:text-xs font-normal text-sky-700/80">Staff</span></h3>
          </div>
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-sky-50 text-sky-600 items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama gudang, alamat, PIC, atau telepon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
        >
          <option value="ALL">Semua Status Gudang</option>
          <option value="ACTIVE">Aktif Beroperasi</option>
          <option value="MAINTENANCE">Dalam Pemeliharaan</option>
          <option value="CLOSED">Nonaktif / Tutup</option>
        </select>
      </div>

      {/* MOBILE CARDS VIEW (Optimized for Smartphones) */}
      <div className="block md:hidden space-y-3">
        {filteredBranches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-slate-600 text-sm">Tidak ada cabang gudang terdaftar</p>
            <p className="text-xs text-slate-400 mt-1">Klik tombol Tambah Cabang Baru di atas.</p>
          </div>
        ) : (
          filteredBranches.map((branch) => {
            const staffInBranch = getStaffInBranch(branch);
            const isMaintenance = branch.status === 'MAINTENANCE';
            const isClosed = branch.status === 'CLOSED';

            return (
              <div key={branch.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                
                {/* Branch Header: Name & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Warehouse className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{branch.name}</h4>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>PIC: <strong>{branch.pic || '-'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {branch.isPusat || branch.code === 'GUDANG-PUSAT' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        <Building2 className="w-3 h-3 text-purple-600" />
                        Gudang Utama (Pusat)
                      </span>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        {branch.branchType === 'DISTRIBUTOR' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            🏢 Distributor
                          </span>
                        ) : branch.branchType === 'INTERNAL' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            🏛️ Internal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            🏪 Reseller
                          </span>
                        )}

                        {isMaintenance ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Pemeliharaan
                          </span>
                        ) : isClosed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Tutup
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Aktif
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                {branch.address && (
                  <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{branch.address}</span>
                  </div>
                )}

                {/* Phone & Staff Count */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    {branch.phone ? (
                      <a 
                        href={`tel:${branch.phone}`}
                        className="inline-flex items-center gap-1 text-sky-600 font-semibold hover:underline bg-sky-50 px-2 py-1 rounded-lg"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{branch.phone}</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">Tanpa nomor telp</span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                    <Users className="w-3 h-3 text-slate-400" />
                    {staffInBranch.length} Staff
                  </span>
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEditModal(branch)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-semibold transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Ubah Data</span>
                  </button>

                  {branch.isPusat || branch.code === 'GUDANG-PUSAT' || branch.isProtected ? (
                    <button
                      disabled
                      className="p-2 bg-slate-100 text-slate-300 rounded-xl text-xs cursor-not-allowed"
                      title="Gudang Utama Pusat tidak dapat dihapus (Master Sistem)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmBranch(branch)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs transition cursor-pointer"
                      title="Hapus Cabang"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW (Screens >= md) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 min-w-[200px]">Nama Gudang / Cabang</th>
                <th className="px-4 py-3.5 min-w-[220px]">Alamat Lengkap Gudang</th>
                <th className="px-4 py-3.5 whitespace-nowrap min-w-[150px]">Penanggung Jawab (PIC)</th>
                <th className="px-4 py-3.5 whitespace-nowrap min-w-[140px]">Kontak / Hotline</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap min-w-[120px]">Staff Terdaftar</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap min-w-[140px]">Status Operasional</th>
                <th className="px-6 py-3.5 text-right whitespace-nowrap min-w-[100px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-slate-600">Tidak ada data cabang gudang di database.</p>
                    <p className="text-xs text-slate-400 mt-1">Klik tombol <strong>"Tambah Cabang Baru"</strong> untuk mendaftarkan gudang pertama Anda.</p>
                  </td>
                </tr>
              ) : (
                filteredBranches.map((branch) => {
                  const staffInBranch = getStaffInBranch(branch);
                  const isMaintenance = branch.status === 'MAINTENANCE';
                  const isClosed = branch.status === 'CLOSED';

                  return (
                    <tr key={branch.id} className="hover:bg-slate-50/80 transition">
                      
                      {/* Name & Tipe Kemitraan */}
                      <td className="px-6 py-4 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                            <Warehouse className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 leading-snug">{branch.name}</span>
                              {branch.isPusat || branch.code === 'GUDANG-PUSAT' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                  Gudang Pusat
                                </span>
                              ) : branch.branchType === 'DISTRIBUTOR' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                                  🏢 Distributor
                                </span>
                              ) : branch.branchType === 'INTERNAL' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  🏛️ Internal
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                                  🏪 Reseller
                                </span>
                              )}
                            </div>
                            {branch.code && (
                              <div className="text-[11px] font-mono text-slate-400">Kode: {branch.code}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Alamat Lengkap */}
                      <td className="px-4 py-4 min-w-[220px] max-w-sm">
                        <div className="text-xs text-slate-700 flex items-start gap-1.5 leading-relaxed break-words">
                          <MapPin className="w-3.5 h-3.5 text-sky-600 flex-shrink-0 mt-0.5" />
                          <span>{branch.address || '-'}</span>
                        </div>
                      </td>

                      {/* PIC / Kepala Gudang */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5 whitespace-nowrap">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{branch.pic || branch.managerName || '-'}</span>
                        </div>
                      </td>

                      {/* Phone / Hotline */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {branch.phone ? (
                          <div className="text-xs text-slate-700 font-medium flex items-center gap-1.5 whitespace-nowrap">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{branch.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">-</span>
                        )}
                      </td>

                      {/* Staff Count */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold whitespace-nowrap">
                          <Users className="w-3 h-3 text-slate-400" />
                          {staffInBranch.length} Staff
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        {branch.isPusat || branch.code === 'GUDANG-PUSAT' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 whitespace-nowrap">
                            <Building2 className="w-3.5 h-3.5 text-purple-600" />
                            Gudang Utama (Pusat)
                          </span>
                        ) : isMaintenance ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Pemeliharaan
                          </span>
                        ) : isClosed ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Tutup
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Aktif Beroperasi
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                          <button
                            onClick={() => handleOpenEditModal(branch)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                            title="Ubah Cabang"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          
                          {branch.isPusat || branch.code === 'GUDANG-PUSAT' || branch.isProtected ? (
                            <button
                              disabled
                              className="p-1.5 text-slate-300 bg-slate-100 rounded-lg cursor-not-allowed"
                              title="Gudang Utama Pusat tidak dapat dihapus (Master Sistem)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmBranch(branch)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus Cabang"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT BRANCH MODAL (Bottom Sheet Responsive) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-base">
                    {editingBranch ? 'Perbarui Data Cabang Gudang' : 'Tambah Cabang Gudang Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">Konfigurasi lokasi dan penanggung jawab operasional.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePreSubmitBranch} className="p-5 sm:p-6 space-y-4 text-sm overflow-y-auto flex-1">
              
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Nama Gudang / Cabang */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Gudang / Cabang *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Gudang Bobotsari"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                />
              </div>

              {/* 2. Alamat Lengkap Gudang */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Alamat Lengkap Gudang
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Jl. Raya Bobotsari No. 45, Purbalingga"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                />
              </div>

              {/* 3. Penanggung Jawab (PIC) & 4. Kontak Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Penanggung Jawab (PIC) / Kepala Gudang
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Kepala Gudang"
                    value={formData.pic}
                    onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Kontak / Telepon Hotline
                  </label>
                  <input
                    type="text"
                    placeholder="0812-xxxx / 0281-xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* 5. Status Operasional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Status Operasional
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                  >
                    <option value="ACTIVE">Aktif Beroperasi</option>
                    <option value="MAINTENANCE">Pemeliharaan / Renovasi</option>
                    <option value="CLOSED">Nonaktif / Tutup</option>
                  </select>
                </div>

                {/* 6. Tipe Kemitraan Cabang (Rahasia) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    Tipe / Kategori Kemitraan
                    <span title="Data ini dirahasiakan dan tidak akan terlihat oleh Cabang" className="bg-rose-100 text-rose-700 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Secret</span>
                  </label>
                  <select
                    value={formData.branchType}
                    onChange={(e) => setFormData({ ...formData, branchType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                  >
                    <option value="DISTRIBUTOR">Distributor (Harga Khusus)</option>
                    <option value="RESELLER">Reseller (Harga Standar)</option>
                    <option value="INTERNAL">Internal / Milik Sendiri (HPP)</option>
                  </select>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-sky-600/20 transition cursor-pointer"
                >
                  {editingBranch ? 'Simpan Perubahan' : 'Tambahkan Cabang'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmBranch && (
        <ConfirmationModal
          isOpen={Boolean(deleteConfirmBranch)}
          onClose={() => setDeleteConfirmBranch(null)}
          onConfirm={handleConfirmDelete}
          title="Konfirmasi Hapus Cabang Gudang"
          subtitle="Tindakan ini akan menghapus data cabang dari sistem."
          type="DANGER"
          confirmText="Ya, Hapus Cabang"
          cancelText="Batal"
          summaryItems={[
            { label: "Nama Cabang", value: deleteConfirmBranch.name, highlight: true },
            { label: "Alamat / Lokasi", value: deleteConfirmBranch.address || '-' },
            { label: "PIC Penanggung Jawab", value: deleteConfirmBranch.pic || '-' },
            { label: "Status", value: deleteConfirmBranch.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif' }
          ]}
          warningNote="PERINGATAN: Menghapus cabang dapat mempengaruhi akun staff cabang dan riwayat transfer barang yang terhubung."
        />
      )}

      {/* SAVE / UPDATE BRANCH CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={isConfirmSaveOpen}
        onClose={() => setIsConfirmSaveOpen(false)}
        onConfirm={handleExecuteSaveBranch}
        title={editingBranch ? "Konfirmasi Ubah Data Cabang" : "Konfirmasi Daftarkan Cabang Baru"}
        subtitle="Pastikan data nama, lokasi, dan penanggung jawab cabang sudah benar."
        type="PRIMARY"
        confirmText={editingBranch ? "Ya, Simpan Perubahan" : "Ya, Daftarkan Cabang"}
        cancelText="← Cek Kembali"
        isLoading={isExecutingSave}
        summaryItems={[
          { label: "Nama Gudang / Cabang", value: formData.name, highlight: true },
          { label: "Alamat Lokasi", value: formData.address || '-' },
          { label: "PIC Penanggung Jawab", value: formData.pic || '-' },
          { label: "No. Kontak Telepon", value: formData.phone || '-' },
          { label: "Status Operasional", value: formData.status === 'ACTIVE' ? '🟢 Aktif' : '🔴 Non-Aktif' }
        ]}
      />

      {/* CONFIRM DELETE ALL BRANCHES MODAL */}
      {isDeleteAllConfirmOpen && (
        <ConfirmationModal
          isOpen={isDeleteAllConfirmOpen}
          onClose={() => setIsDeleteAllConfirmOpen(false)}
          onConfirm={() => {
            if (onClearAllBranches) onClearAllBranches();
            setIsDeleteAllConfirmOpen(false);
          }}
          title="Hapus SEMUA Data Cabang?"
          subtitle="Tindakan darurat ini akan menghapus seluruh data cabang."
          type="DANGER"
          confirmText="Ya, Hapus Semua Cabang"
          cancelText="Batal"
          warningNote={`Anda akan menghapus ${branches.length} cabang gudang secara permanen dari database.`}
        />
      )}

      {/* UNIVERSAL SUCCESS POP-UP MODAL */}
      <GlobalSuccessModal
        isOpen={Boolean(successModal)}
        onClose={() => setSuccessModal(null)}
        title={successModal?.title}
        message={successModal?.message}
        details={successModal?.details}
        buttonText={successModal?.buttonText || "✓ Selesai & Tutup"}
      />


      {/* INTERACTIVE CUSTOM ALERT MODAL */}
      <CustomAlertModal
        isOpen={Boolean(alertModal)}
        onClose={() => setAlertModal(null)}
        title={alertModal?.title}
        message={alertModal?.message}
        type={alertModal?.type}
      />

    </div>
  );
}

