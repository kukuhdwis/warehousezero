import React, { useState } from 'react';
import { db } from '../services/firebase';
import { matchesSearch } from '../utils/searchUtils';
import { 
  User,
  Users, 
  UserPlus, 
  ShieldCheck, 
  UserCheck, 
  Building2, 
  Search, 
  Edit3, 
  Trash2, 
  Lock, 
  Mail, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Eye, 
  EyeOff, 
  ShieldAlert
} from 'lucide-react';
import GlobalSuccessModal from './GlobalSuccessModal';
import CustomAlertModal from './CustomAlertModal';
import ConfirmationModal from './ConfirmationModal';

export default function UserManagement({ 
  currentUser, 
  users = [], 
  branches = [], 
  onCreateUser, 
  onUpdateUser, 
  onDeleteUser 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  
  // Alert Modal State
  const [alertModal, setAlertModal] = useState(null);
  const showAlert = (title, message, type = 'WARNING') => {
    setAlertModal({ title, message, type });
  };

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [isExecutingSave, setIsExecutingSave] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [successModal, setSuccessModal] = useState(null);


  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STAFF_BRANCH',
    branchId: '',
    branchName: '',
    phone: '',
    status: 'ACTIVE'
  });

  const [formError, setFormError] = useState('');

  // Stats calculation
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const staffPusatCount = users.filter(u => u.role === 'STAFF_PUSAT' || u.role === 'PUSAT').length;
  const staffCount = users.filter(u => u.role === 'STAFF_BRANCH').length;
  const activeCount = users.filter(u => u.status !== 'INACTIVE').length;

  // Helper to dynamically get branch name
  const getBranchDisplayName = (user) => {
    if (!user) return '-';
    if (user.role === 'ADMIN') {
      return 'Pusat (Semua Cabang / Admin)';
    }
    if (user.role === 'STAFF_PUSAT' || user.role === 'PUSAT') {
      return 'Gudang Utama Pusat';
    }
    const found = branches.find(b => b.id === user.branchId);
    return found ? found.name : (user.branchName || user.branchId);
  };

  // Filtered Users
  const filteredUsers = users.filter(user => {
    const branchName = getBranchDisplayName(user);
    const matchesSearchTerm = matchesSearch(searchTerm, user.name, user.email, branchName);
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesBranch = branchFilter === 'ALL' || user.branchId === branchFilter;

    return matchesSearchTerm && matchesRole && matchesBranch;
  });

  const handleOpenAddModal = () => {
    setEditingUser(null);
    const defaultBranch = branches[0];
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'STAFF_BRANCH',
      branchId: defaultBranch ? defaultBranch.id : 'ALL',
      branchName: defaultBranch ? defaultBranch.name : 'Gudang Cabang',
      phone: '',
      status: 'ACTIVE'
    });
    setFormError('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    const matchedBranch = branches.find(b => b.id === user.branchId);
    const pusatBranch = branches.find(b => b.isPusat === true || b.code === 'GUDANG-PUSAT' || (b.name || '').toLowerCase().includes('gudang utama pusat'));
    
    let branchId = user.branchId;
    let branchName = user.branchName;

    if (user.role === 'ADMIN') {
      branchId = 'ALL';
      branchName = 'Semua Cabang (Global Admin)';
    } else if (user.role === 'STAFF_PUSAT' || user.role === 'PUSAT') {
      branchId = pusatBranch ? pusatBranch.id : 'branch-pusat-hq';
      branchName = pusatBranch ? pusatBranch.name : 'Gudang Utama Pusat';
    } else {
      branchId = user.branchId || (branches[0]?.id || 'ALL');
      branchName = matchedBranch ? matchedBranch.name : (user.branchName || 'Cabang');
    }

    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: user.password || '',
      role: user.role || 'STAFF_BRANCH',
      branchId,
      branchName,
      phone: user.phone || '',
      status: user.status || 'ACTIVE'
    });
    setFormError('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleBranchChange = (branchId) => {
    const matched = branches.find(b => b.id === branchId);
    setFormData({
      ...formData,
      branchId,
      branchName: matched ? matched.name : 'Cabang Khusus'
    });
  };

  const handlePreSubmitUser = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.role || !formData.branchId) {
      setFormError('Harap lengkapi semua field wajib.');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      setFormError('Kata sandi awal wajib diisi untuk pengguna baru.');
      return;
    }

    if (formData.password.trim() && formData.password.trim().length < 6) {
      setFormError('Kata sandi minimal 6 karakter sesuai standar keamanan.');
      return;
    }

    // Check email uniqueness among other users
    const existing = users.find(
      u => u.email.toLowerCase() === formData.email.toLowerCase().trim() && (!editingUser || u.id !== editingUser.id)
    );
    if (existing) {
      setFormError('Alamat email sudah digunakan oleh akun lain.');
      return;
    }

    setIsConfirmSaveOpen(true);
  };

  const handleExecuteSaveUser = async () => {
    setIsExecutingSave(true);
    setFormError('');

    // Strictly resolve correct branchName from current branch list
    let finalBranchId = formData.branchId;
    let finalBranchName = 'Gudang Utama Pusat';

    if (formData.role === 'ADMIN') {
      finalBranchId = 'ALL';
      finalBranchName = 'Pusat (Semua Cabang / Global Admin)';
    } else if (formData.role === 'STAFF_PUSAT' || formData.role === 'PUSAT') {
      const pusatBranch = branches.find(b => b.isPusat === true || b.code === 'GUDANG-PUSAT' || (b.name || '').toLowerCase().includes('gudang utama pusat'));
      finalBranchId = pusatBranch ? pusatBranch.id : 'branch-pusat-hq';
      finalBranchName = pusatBranch ? pusatBranch.name : 'Gudang Utama Pusat';
    } else {
      const matched = branches.find(b => b.id === finalBranchId);
      if (matched) {
        finalBranchName = matched.name;
      } else if (branches.length > 0) {
        finalBranchId = branches[0].id;
        finalBranchName = branches[0].name;
      }
    }

    const payload = {
      ...formData,
      branchId: finalBranchId,
      branchName: finalBranchName
    };

    try {
      if (editingUser) {
        await onUpdateUser(editingUser.id, payload);
      } else {
        await onCreateUser(payload);
      }
      setIsConfirmSaveOpen(false);
      setIsModalOpen(false);

      setSuccessModal({
        title: editingUser ? "Data Pengguna Berhasil Diperbarui!" : "Pengguna Baru Berhasil Didaftarkan!",
        message: editingUser 
          ? "Perubahan data akun dan hak akses pengguna telah disimpan ke database." 
          : "Akun baru telah aktif dan dapat langsung digunakan untuk masuk ke sistem.",
        details: [
          { label: "Nama Pengguna", value: payload.name },
          { label: "Email Akun", value: payload.email },
          { label: "Role & Cabang", value: `${payload.role} • ${payload.branchName}`, highlight: true }
        ]
      });
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan data pengguna.');
      setIsConfirmSaveOpen(false);
    } finally {
      setIsExecutingSave(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmUser) return;
    try {
      await onDeleteUser(deleteConfirmUser.id);
      setDeleteConfirmUser(null);
    } catch (err) {
      showAlert("Gagal Menghapus Pengguna", err.message, "ERROR");
    }
  };


  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Manajemen Pengguna</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
              Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola akun administrator, staff gudang pusat, staff cabang, dan penugasan akses.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-sky-600/20 transition active:scale-98 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3.5">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Total User</p>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">{totalUsers} <span className="text-[10px] sm:text-xs font-normal text-slate-500">Akun</span></h3>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin</p>
            <h3 className="text-lg sm:text-xl font-bold text-sky-600 mt-0.5">{adminCount} <span className="text-[10px] sm:text-xs font-normal text-sky-700/80">Admin</span></h3>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Staff Pusat</p>
            <h3 className="text-lg sm:text-xl font-bold text-amber-600 mt-0.5">{staffPusatCount} <span className="text-[10px] sm:text-xs font-normal text-amber-700/80">Pusat</span></h3>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Staff Cabang</p>
            <h3 className="text-lg sm:text-xl font-bold text-emerald-600 mt-0.5">{staffCount} <span className="text-[10px] sm:text-xs font-normal text-emerald-700/80">Cabang</span></h3>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Akun Aktif</p>
            <h3 className="text-lg sm:text-xl font-bold text-indigo-600 mt-0.5">{activeCount} <span className="text-[10px] sm:text-xs font-normal text-indigo-700/80">Aktif</span></h3>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, email, atau cabang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
          />
        </div>

        {/* Role & Branch Filters */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="ALL">Semua Peran</option>
            <option value="ADMIN">Administrator</option>
            <option value="STAFF_PUSAT">Staff Pusat</option>
            <option value="STAFF_BRANCH">Staff Cabang</option>
          </select>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="ALL">Semua Cabang</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* MOBILE USER CARDS VIEW (Optimized for Smartphone) */}
      <div className="block md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-slate-600 text-sm">Tidak ada data pengguna ditemukan</p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isAdmin = user.role === 'ADMIN';
            const isStaffPusat = user.role === 'STAFF_PUSAT' || user.role === 'PUSAT';
            const isCurrent = currentUser?.email?.toLowerCase() === user.email?.toLowerCase();
            const displayBranch = getBranchDisplayName(user);
            const initials = (user.name || user.email || 'U')
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div key={user.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                
                {/* Header: Avatar, Name, Role badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0 mt-0.5 ${
                      isAdmin 
                        ? 'bg-sky-100 text-sky-700 border border-sky-200' 
                        : isStaffPusat
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{user.name}</h4>
                        {isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded font-bold">
                            Anda
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" /> {user.email}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </span>
                    ) : isStaffPusat ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Eye className="w-3 h-3" /> Staff Pusat
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <UserCheck className="w-3 h-3" /> Staff Cabang
                      </span>
                    )}
                  </div>
                </div>

                {/* Details: Branch & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-medium truncate">{displayBranch}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <a href={`tel:${user.phone}`} className="text-sky-600 hover:underline">{user.phone}</a>
                    </div>
                  )}
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEditModal(user)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-semibold transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Ubah User</span>
                  </button>

                  {user.email === 'admin@perusahaan.com' ? (
                    <span className="px-2.5 py-1.5 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-bold border border-slate-200">
                      Root Admin
                    </span>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmUser(user)}
                      disabled={isCurrent}
                      className={`p-2 rounded-xl text-xs transition ${
                        isCurrent 
                          ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer'
                      }`}
                      title={isCurrent ? "Tidak dapat menghapus akun aktif" : "Hapus Pengguna"}
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
                <th className="px-6 py-3.5 min-w-[220px]">Pengguna / User</th>
                <th className="px-4 py-3.5 whitespace-nowrap min-w-[140px]">Peran (Role)</th>
                <th className="px-4 py-3.5 whitespace-nowrap min-w-[160px]">Penugasan Cabang</th>
                <th className="px-4 py-3.5 whitespace-nowrap min-w-[130px]">Kontak / Telepon</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap min-w-[95px]">Status</th>
                <th className="px-6 py-3.5 text-right whitespace-nowrap min-w-[110px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-slate-600">Tidak ada data pengguna ditemukan.</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter peran.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isAdmin = user.role === 'ADMIN';
                  const isStaffPusat = user.role === 'STAFF_PUSAT' || user.role === 'PUSAT';
                  const isCurrent = currentUser?.email?.toLowerCase() === user.email?.toLowerCase();
                  const displayBranch = getBranchDisplayName(user);
                  const initials = (user.name || user.email || 'U')
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition">
                      
                      {/* Name & Email */}
                      <td className="px-6 py-4 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0 ${
                            isAdmin 
                              ? 'bg-sky-100 text-sky-700 border border-sky-200' 
                              : isStaffPusat
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                              <span className="font-bold text-slate-900 leading-snug">{user.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded font-bold whitespace-nowrap flex-shrink-0">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 whitespace-nowrap">
                              <Mail className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Administrator
                          </span>
                        ) : isStaffPusat ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                            <Eye className="w-3.5 h-3.5" />
                            Staff Pusat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                            <UserCheck className="w-3.5 h-3.5" />
                            Staff Cabang
                          </span>
                        )}
                      </td>

                      {/* Branch Badge */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 whitespace-nowrap">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{displayBranch}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-4 text-xs text-slate-600 whitespace-nowrap">
                        {user.phone ? (
                          <span className="flex items-center gap-1.5 font-medium">
                            <Phone className="w-3 h-3 text-slate-400" /> {user.phone}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        {user.status === 'INACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Nonaktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Aktif
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                            title="Ubah Pengguna"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          
                          {user.email === 'admin@perusahaan.com' ? (
                            <span className="px-2 py-1 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-bold border border-slate-200">
                              Root Admin
                            </span>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmUser(user)}
                              disabled={isCurrent}
                              className={`p-1.5 rounded-lg transition ${
                                isCurrent 
                                  ? 'text-slate-300 cursor-not-allowed' 
                                  : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                              }`}
                              title={isCurrent ? 'Tidak dapat menghapus akun sendiri' : 'Hapus Pengguna'}
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

      {/* ADD / EDIT USER MODAL (Bottom Sheet Responsive) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-base">
                    {editingUser ? 'Perbarui Data Pengguna' : 'Tambah Pengguna Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">Atur kredensial dan hak akses akun sistem WMS.</p>
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
            <form onSubmit={handlePreSubmitUser} className="p-5 sm:p-6 space-y-4 text-sm overflow-y-auto flex-1">
              
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Email & Password Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Alamat Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="user@perusahaan.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    {editingUser ? 'Kata Sandi (Opsional)' : 'Kata Sandi Awal *'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingUser}
                      placeholder={editingUser ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Peran / Hak Akses *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  
                  {/* 1. Administrator */}
                  <label className={`
                    border rounded-xl p-3 flex flex-col justify-between cursor-pointer transition
                    ${formData.role === 'ADMIN' 
                      ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20' 
                      : 'border-slate-200 hover:bg-slate-50'}
                  `}>
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="role"
                        value="ADMIN"
                        checked={formData.role === 'ADMIN'}
                        onChange={() => {
                          setFormData({ 
                            ...formData, 
                            role: 'ADMIN',
                            branchId: 'ALL',
                            branchName: 'Pusat (Semua Cabang)'
                          });
                        }}
                        className="mt-0.5 text-sky-600 focus:ring-sky-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                          Admin
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Akses penuh termasuk kelola user & cabang.</p>
                      </div>
                    </div>
                  </label>

                  {/* 2. Staff Pusat */}
                  <label className={`
                    border rounded-xl p-3 flex flex-col justify-between cursor-pointer transition
                    ${formData.role === 'STAFF_PUSAT' 
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20' 
                      : 'border-slate-200 hover:bg-slate-50'}
                  `}>
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="role"
                        value="STAFF_PUSAT"
                        checked={formData.role === 'STAFF_PUSAT'}
                        onChange={() => {
                          setFormData({ 
                            ...formData, 
                            role: 'STAFF_PUSAT',
                            branchId: 'ALL',
                            branchName: 'Pusat (Semua Cabang)'
                          });
                        }}
                        className="mt-0.5 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-amber-600" />
                          Staff Pusat
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Monitoring semua cabang, In/Out, tanpa kelola user.</p>
                      </div>
                    </div>
                  </label>

                  {/* 3. Staff Cabang */}
                  <label className={`
                    border rounded-xl p-3 flex flex-col justify-between cursor-pointer transition
                    ${formData.role === 'STAFF_BRANCH' 
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20' 
                      : 'border-slate-200 hover:bg-slate-50'}
                  `}>
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="role"
                        value="STAFF_BRANCH"
                        checked={formData.role === 'STAFF_BRANCH'}
                        onChange={() => {
                          const defaultBranch = branches[0];
                          setFormData({ 
                            ...formData, 
                            role: 'STAFF_BRANCH',
                            branchId: defaultBranch ? defaultBranch.id : '',
                            branchName: defaultBranch ? defaultBranch.name : 'Cabang Khusus'
                          });
                        }}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Staff Cabang
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Akses khusus 1 cabang terpilih.</p>
                      </div>
                    </div>
                  </label>

                </div>
              </div>

              {/* Branch Assignment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Penugasan Cabang Gudang *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    disabled={formData.role === 'ADMIN' || formData.role === 'STAFF_PUSAT'}
                    value={formData.role === 'ADMIN' ? 'ALL' : formData.role === 'STAFF_PUSAT' ? (branches.find(b => b.isPusat === true || b.code === 'GUDANG-PUSAT')?.id || 'branch-pusat-hq') : (formData.branchId || '')}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 transition font-medium"
                  >
                    {formData.role === 'ADMIN' ? (
                      <option value="ALL">Administrator Pusat (Akses Seluruh Sistem)</option>
                    ) : formData.role === 'STAFF_PUSAT' ? (
                      <option value={branches.find(b => b.isPusat === true || b.code === 'GUDANG-PUSAT')?.id || 'branch-pusat-hq'}>
                        Gudang Utama Pusat (Otomatis Penugasan Gudang Pusat)
                      </option>
                    ) : (
                      <>
                        {branches.length === 0 ? (
                          <option value="">Belum ada cabang terdaftar (Buat cabang dulu)</option>
                        ) : (
                          branches.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.name} {b.isPusat ? '(Gudang Utama)' : ''}
                            </option>
                          ))
                        )}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Phone & Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    No. WhatsApp / HP
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="0812-3456-7890"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Status Akun
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                  >
                    <option value="ACTIVE">Aktif (Dapat Login)</option>
                    <option value="INACTIVE">Nonaktif (Diblokir)</option>
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
                  {editingUser ? 'Simpan Perubahan' : 'Buat Akun Pengguna'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmUser && (
        <ConfirmationModal
          isOpen={Boolean(deleteConfirmUser)}
          onClose={() => setDeleteConfirmUser(null)}
          onConfirm={handleConfirmDelete}
          title="Konfirmasi Hapus Akun Pengguna"
          subtitle="Tindakan ini akan menghapus akun dari sistem."
          type="DANGER"
          confirmText="Ya, Hapus Akun"
          cancelText="Batal"
          summaryItems={[
            { label: "Nama Pengguna", value: deleteConfirmUser.name, highlight: true },
            { label: "Email Akun", value: deleteConfirmUser.email },
            { label: "Role Akun", value: deleteConfirmUser.role || 'STAFF_BRANCH' },
            { label: "Penugasan Cabang", value: deleteConfirmUser.branchName || 'Semua Cabang' }
          ]}
          warningNote="PERINGATAN: Pengguna tidak akan dapat login lagi ke sistem aplikasi setelah dihapus."
        />
      )}

      {/* SAVE / UPDATE USER CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={isConfirmSaveOpen}
        onClose={() => setIsConfirmSaveOpen(false)}
        onConfirm={handleExecuteSaveUser}
        title={editingUser ? "Konfirmasi Ubah Akun Pengguna" : "Konfirmasi Buat Akun Baru"}
        subtitle="Pastikan informasi nama, email, role, dan penugasan cabang sudah benar."
        type="PRIMARY"
        confirmText={editingUser ? "Ya, Simpan Perubahan" : "Ya, Daftarkan Pengguna"}
        cancelText="← Cek Kembali"
        isLoading={isExecutingSave}
        summaryItems={[
          { label: "Nama Lengkap", value: formData.name.trim(), highlight: true },
          { label: "Alamat Email", value: formData.email.trim() },
          { label: "Role / Wewenang", value: formData.role === 'ADMIN' ? '👑 Administrator (Pusat)' : formData.role === 'STAFF_PUSAT' ? '🏢 Staff Gudang Pusat' : '🏬 Staff Gudang Cabang' },
          { label: "Penugasan Cabang", value: formData.role === 'ADMIN' ? 'Semua Cabang' : formData.branchName || 'Cabang' },
          { label: "Status Akun", value: formData.status === 'ACTIVE' ? '🟢 Aktif' : '🔴 Non-Aktif' }
        ]}
      />

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

