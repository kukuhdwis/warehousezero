import React, { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProductManagement from './components/ProductManagement';
import StockIn from './components/StockIn';
import StockOut from './components/StockOut';
import TransactionHistory from './components/TransactionHistory';
import UserManagement from './components/UserManagement';
import BranchManagement from './components/BranchManagement';
import BranchMonitoring from './components/BranchMonitoring';
import BarcodeModal from './components/BarcodeModal';
import LoginView from './components/LoginView';
import { getStoredUser, logoutUser } from './services/authService';
import { 
  fetchProducts, 
  subscribeProducts,
  createProduct, 
  updateProduct, 
  deleteProduct, 
  fetchTransactions, 
  subscribeStockMovements,
  recordStockMovement,
  fetchBranches,
  subscribeBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  clearAllBranches,
  fetchUsers,
  subscribeUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchBrands,
  subscribeBrands,
  createBrand,
  deleteBrand,
  fetchMachineCategories,
  subscribeMachineCategories,
  createMachineCategory,
  deleteMachineCategory,
  fetchBranchInventories,
  subscribeBranchInventories,
  requestBranchInventory,
  requestBatchBranchInventory,
  approveBranchInventory,
  approveBatchBranchInventory,
  rejectBranchInventory,
  rejectBatchBranchInventory,
  updateBranchInventory,

  fetchNotifications,
  subscribeNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  fetchTransfers,
  subscribeTransfers,
  createStockTransfer,
  confirmTransferReceipt,
  confirmBatchTransferReceipt,
  rejectBatchTransferReceipt,
  fetchStockRequests,
  subscribeStockRequests,
  createStockRequest,
  rejectStockRequest,
  fulfillStockRequest,
  playNotificationSound
} from './services/dataService';

import BottomNav from './components/BottomNav';
import GlobalSuccessModal from './components/GlobalSuccessModal';
import LogoutConfirmModal from './components/LogoutConfirmModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [branchInventories, setBranchInventories] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [stockRequests, setStockRequests] = useState([]);
  const [inboundInitialTab, setInboundInitialTab] = useState('INCOMING_DELIVERIES');
  const [outboundInitialRequestData, setOutboundInitialRequestData] = useState(null);
  const [productsInitialTab, setProductsInitialTab] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [brands, setBrands] = useState([]);
  const [machineCategories, setMachineCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [globalSuccessPopup, setGlobalSuccessPopup] = useState(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [backToast, setBackToast] = useState(null);
  const [liveToastNotif, setLiveToastNotif] = useState(null);
  const prevNotifIdsRef = useRef(new Set());
  const isInitialNotifLoadRef = useRef(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        fetchProducts(),
        fetchTransactions(),
        fetchBranches(),
        fetchUsers(),
        fetchBrands(),
        fetchMachineCategories(),
        fetchBranchInventories(),
        fetchNotifications(currentUser),
        fetchTransfers(currentUser?.branchId),
        fetchStockRequests(currentUser?.branchId)
      ]);

      const [prodsRes, txsRes, branchRes, userRes, brandRes, catRes, invRes, notifRes, transRes, reqRes] = results;

      if (branchRes.status === 'fulfilled') setBranches(branchRes.value || []);
      if (userRes.status === 'fulfilled') setUsers(userRes.value || []);
      if (brandRes.status === 'fulfilled') setBrands(brandRes.value || []);
      if (catRes.status === 'fulfilled') setMachineCategories(catRes.value || []);
      if (prodsRes.status === 'fulfilled') setProducts(prodsRes.value || []);
      if (invRes.status === 'fulfilled') setBranchInventories(invRes.value || []);
      if (notifRes.status === 'fulfilled') setNotifications(notifRes.value || []);
      if (transRes.status === 'fulfilled') setTransfers(transRes.value || []);
      if (reqRes.status === 'fulfilled') setStockRequests(reqRes.value || []);

      if (txsRes.status === 'fulfilled') {
        const txs = txsRes.value || [];
        if (currentUser && currentUser.role === 'STAFF_BRANCH' && currentUser.branchId !== 'ALL') {
          setTransactions(txs.filter(t => !t.branchId || t.branchId === currentUser.branchId));
        } else {
          setTransactions(txs);
        }
      }
    } catch (e) {
      console.error("Error loading data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  // Full Realtime Live Data Stream Across All Collections (Seamless Zero-Refresh)
  useEffect(() => {
    if (!currentUser) return;

    // 1. Live Notifications with Sound & Toast Detection
    const unsubNotifs = subscribeNotifications(currentUser, (liveNotifs) => {
      setNotifications(liveNotifs);
      const currentIds = new Set(liveNotifs.map(n => n.id));
      if (!isInitialNotifLoadRef.current) {
        const newlyArrived = liveNotifs.find(n => !n.isRead && !prevNotifIdsRef.current.has(n.id));
        if (newlyArrived) {
          playNotificationSound();
          setLiveToastNotif(newlyArrived);
          setTimeout(() => setLiveToastNotif(null), 6000);
        }
      } else {
        isInitialNotifLoadRef.current = false;
      }
      prevNotifIdsRef.current = currentIds;
    });

    // 2. Live Master Products
    const unsubProducts = subscribeProducts((liveProds) => {
      setProducts(liveProds);
    });

    // 3. Live Stock Movements / Transactions
    const unsubMovements = subscribeStockMovements(currentUser, (liveMovements) => {
      setTransactions(liveMovements);
    });

    // 4. Live Inbound / Outbound Transfers
    const unsubTransfers = subscribeTransfers(currentUser, (liveTransfers) => {
      setTransfers(liveTransfers);
    });

    // 5. Live Branch Inventories & Approval State
    const unsubBranchInv = subscribeBranchInventories(currentUser, (liveInventories) => {
      setBranchInventories(liveInventories);
    });

    // 6. Live Stock Requests (Branch <-> HQ)
    const unsubRequests = subscribeStockRequests(currentUser, (liveRequests) => {
      setStockRequests(liveRequests);
    });

    // 7. Live Branches Master
    const unsubBranches = subscribeBranches((liveBranches) => {
      setBranches(liveBranches);
    });

    // 8. Live Brands Master
    const unsubBrands = subscribeBrands((liveBrands) => {
      setBrands(liveBrands);
    });

    // 9. Live Machine Categories
    const unsubMachineCats = subscribeMachineCategories((liveCats) => {
      setMachineCategories(liveCats);
    });

    // 10. Live Users Master (Admin only)
    const unsubUsers = subscribeUsers(currentUser, (liveUsers) => {
      setUsers(liveUsers);
    });

    return () => {
      unsubNotifs();
      unsubProducts();
      unsubMovements();
      unsubTransfers();
      unsubBranchInv();
      unsubRequests();
      unsubBranches();
      unsubBrands();
      unsubMachineCats();
      unsubUsers();
    };
  }, [currentUser]);

  // Mobile / Browser Hardware Back Button Handler (Requirement 6)
  useEffect(() => {
    window.history.replaceState({ tab: activeTab }, '');
  }, []);

  useEffect(() => {
    const handlePopState = (e) => {
      // 1. Close open modals first
      if (globalSuccessPopup) {
        setGlobalSuccessPopup(null);
        return;
      }
      if (barcodeProduct) {
        setBarcodeProduct(null);
        return;
      }
      if (isLogoutModalOpen) {
        setIsLogoutModalOpen(false);
        return;
      }

      // 2. Return to dashboard if in another tab
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        return;
      }

      // 3. Show Toast if already on dashboard
      setBackToast("Tekan sekali lagi untuk keluar dari aplikasi.");
      setTimeout(() => setBackToast(null), 3000);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [globalSuccessPopup, barcodeProduct, isLogoutModalOpen, activeTab]);

  const changeTab = (newTab) => {
    if (newTab !== activeTab) {
      window.history.pushState({ tab: newTab }, '');
      setActiveTab(newTab);
    }
  };


  // Jika belum login -> Tampilkan Halaman Login!
  if (!currentUser) {
    return (
      <LoginView 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActiveTab('dashboard');
        }} 
      />
    );
  }

  // Handlers for Product Management (Master Catalog)
  const handleCreateProduct = async (productData) => {
    const dataWithBranch = {
      ...productData,
      branchId: 'ALL',
      branchName: 'Semua Cabang (Pusat)'
    };
    await createProduct(dataWithBranch);
    await loadData();
  };

  const handleUpdateProduct = async (id, productData) => {
    await updateProduct(id, productData);
    await loadData();
  };

  const handleDeleteProduct = async (id) => {
    await deleteProduct(id);
    await loadData();
  };

  const handleCreateBrand = async (brandData) => {
    const newBrand = await createBrand(brandData);
    await loadData();
    return newBrand;
  };

  const handleDeleteBrand = async (brandIdOrName) => {
    await deleteBrand(brandIdOrName);
    await loadData();
  };

  const handleCreateMachineCategory = async (catData) => {
    const newCat = await createMachineCategory(catData);
    await loadData();
    return newCat;
  };

  const handleDeleteMachineCategory = async (catIdOrName) => {
    await deleteMachineCategory(catIdOrName);
    await loadData();
  };

  // Handlers for Branch Inventory Requests & Approval Flow
  const handleRequestBranchInventory = async (requestDataOrList) => {
    const list = Array.isArray(requestDataOrList) ? requestDataOrList : [requestDataOrList];
    await requestBatchBranchInventory(list, currentUser);
    await loadData();
  };

  const handleApproveBranchInventory = async (idOrItems, adminUser) => {
    const list = Array.isArray(idOrItems) ? idOrItems : [idOrItems];
    await approveBatchBranchInventory(list, adminUser);
    await loadData();
    const count = list.length;
    const firstItem = typeof list[0] === 'object' ? list[0] : branchInventories.find(b => b.id === list[0]);
    const branchName = firstItem?.branchName || 'Cabang';
    setGlobalSuccessPopup({
      title: "Pengajuan Inventaris Disetujui! 🎉",
      message: `${count} produk inventaris dari ${branchName} telah diverifikasi dan resmi aktif di database cabang.`,
      details: [
        { label: "Cabang", value: branchName },
        { label: "Total Disetujui", value: `${count} Produk`, highlight: true },
        { label: "Status", value: "✓ Resmi Aktif" }
      ]
    });
  };

  const handleRejectBranchInventory = async (idOrItems, adminUser, reason) => {
    const list = Array.isArray(idOrItems) ? idOrItems : [idOrItems];
    await rejectBatchBranchInventory(list, adminUser, reason);
    await loadData();
    const count = list.length;
    const firstItem = typeof list[0] === 'object' ? list[0] : branchInventories.find(b => b.id === list[0]);
    const branchName = firstItem?.branchName || 'Cabang';
    setGlobalSuccessPopup({
      title: "Pengajuan Inventaris Ditolak ⚠️",
      message: `${count} pengajuan inventaris dari ${branchName} telah ditolak dengan catatan alasan resmi.`,
      details: [
        { label: "Cabang", value: branchName },
        { label: "Total Ditolak", value: `${count} Produk` },
        { label: "Alasan Penolakan", value: `"${reason || '-'}"`, highlight: true }
      ]
    });
  };

  const handleUpdateBranchInventory = async (id, data) => {
    await updateBranchInventory(id, data);
    await loadData();
    setGlobalSuccessPopup({
      title: "Stok Inventaris Cabang Diperbarui!",
      message: `Jumlah stok untuk "${data.productName || 'Produk'}" di cabang telah berhasil disesuaikan.`,
      details: [
        { label: "Cabang", value: data.branchName || 'Cabang' },
        { label: "Produk", value: data.productName },
        { label: "Stok Baru", value: `${data.stockQuantity} Pcs`, highlight: true }
      ]
    });
  };


  // Handlers for Notifications
  const handleMarkNotificationRead = async (id) => {
    await markNotificationAsRead(id);
    const updated = await fetchNotifications(currentUser);
    setNotifications(updated);
  };

  const handleMarkAllNotificationsRead = async (user) => {
    await markAllNotificationsAsRead(user);
    const updated = await fetchNotifications(user);
    setNotifications(updated);
  };

  // Handlers for Stock Movements
  const handleRecordMovement = async (movementData) => {
    const matchedBranch = branches.find(b => b.id === (movementData.branchId || currentUser.branchId));
    const dataWithBranch = {
      ...movementData,
      branchId: movementData.branchId || currentUser.branchId || 'ALL',
      branchName: matchedBranch?.name || currentUser.branchName || 'Semua Cabang (Pusat)',
      user: currentUser.name || currentUser.email
    };
    await recordStockMovement(dataWithBranch);

    // If this is a Central Transfer to a Branch, also register the transfer for branch confirmation
    if (movementData.transactionType === 'STOCK_TRANSFER_TO_BRANCH') {
      const prod = products.find(p => p.id === movementData.productId);
      const deliveryNoteNo = movementData.deliveryNote || `SJ-HQ-${Date.now().toString().slice(-6)}`;

      await createStockTransfer({
        productId: movementData.productId,
        sku: movementData.sku || prod?.sku,
        productName: movementData.productName || prod?.name,
        brand: prod?.brand || 'NDK Packaging',
        price: movementData.price || prod?.price || 0,
        qty: movementData.qty,
        targetBranchId: movementData.targetBranchId,
        targetBranchName: movementData.targetBranchName,
        deliveryNote: deliveryNoteNo,
        notes: movementData.notes
      }, currentUser);

      // Check if there is a pending stock request matching this branch and product, and mark as fulfilled
      const matchedReq = stockRequests.find(
        r => r.status === 'PENDING' && 
             r.branchId === movementData.targetBranchId && 
             (r.productId === movementData.productId || r.sku === movementData.sku)
      );
      if (matchedReq) {
        await fulfillStockRequest(matchedReq.id, deliveryNoteNo, currentUser);
      }
    }

    await loadData();
  };

  // Handler for Branch Confirming Central Transfer Receipt (Single or Batch)
  const handleConfirmTransfer = async (transferIdOrItems, notes) => {
    const list = Array.isArray(transferIdOrItems) ? transferIdOrItems : [transferIdOrItems];
    const result = await confirmBatchTransferReceipt(list, currentUser, notes);
    await loadData();
    const count = list.length;
    const firstItem = typeof list[0] === 'object' ? list[0] : transfers.find(t => t.id === list[0]);
    const deliveryNote = firstItem?.deliveryNote || '-';
    setGlobalSuccessPopup({
      title: "Paket Kiriman Berhasil Diterima! 📦",
      message: `${count} produk kiriman dari Kantor Pusat telah diverifikasi dan resmi aktif di inventaris cabang Anda.`,
      details: [
        { label: "Total Barang", value: `${count} Jenis Produk`, highlight: true },
        { label: "No. Surat Jalan", value: deliveryNote },
        { label: "Status", value: "✓ Diterima & Aktif di Cabang" }
      ]
    });
    return result;
  };

  // Handler for Branch Rejecting Central Transfer (Single or Batch)
  const handleRejectTransfer = async (transferIdOrItems, reason) => {
    const list = Array.isArray(transferIdOrItems) ? transferIdOrItems : [transferIdOrItems];
    const result = await rejectBatchTransferReceipt(list, currentUser, reason);
    await loadData();
    const count = list.length;
    const firstItem = typeof list[0] === 'object' ? list[0] : transfers.find(t => t.id === list[0]);
    const deliveryNote = firstItem?.deliveryNote || '-';
    setGlobalSuccessPopup({
      title: "Paket Kiriman Ditolak / Retur ⚠️",
      message: `${count} barang kiriman dari Pusat (No. Surat Jalan: ${deliveryNote}) telah ditolak dengan alasan resmi.`,
      details: [
        { label: "Total Barang", value: `${count} Produk` },
        { label: "No. Surat Jalan", value: deliveryNote },
        { label: "Alasan Penolakan", value: `"${reason || '-'}"`, highlight: true }
      ]
    });
    return result;
  };

  // Handler for Branch Requesting Stock from Central Office
  const handleRequestStock = async (requestData) => {
    const result = await createStockRequest(requestData, currentUser);
    await loadData();
    setGlobalSuccessPopup({
      title: "Permintaan Stok Berhasil Dikirim!",
      message: "Pengajuan permintaan stok barang telah berhasil tercatat dan ternotifikasi ke Kantor Pusat.",
      details: [
        { label: "Nama Produk", value: requestData.productName },
        { label: "Kuantitas Diminta", value: `+${requestData.qty} Pcs`, highlight: true },
        { label: "Status", value: "⏳ Menunggu Respon Pusat" },
        ...(requestData.notes ? [{ label: "Catatan", value: requestData.notes }] : [])
      ]
    });
    return result;
  };

  // Handler for Central Warehouse Rejecting Stock Request
  const handleRejectStockRequest = async (requestId, reason) => {
    const matched = stockRequests.find(r => r.id === requestId);
    const result = await rejectStockRequest(requestId, reason, currentUser);
    await loadData();
    setGlobalSuccessPopup({
      title: "Permintaan Stok Ditolak",
      message: "Pemberitahuan penolakan permintaan stok beserta alasan resmi telah terkirim ke Cabang pemohon.",
      details: [
        { label: "Cabang", value: matched?.branchName || 'Cabang' },
        { label: "Produk", value: matched?.productName || 'Produk' },
        { label: "Alasan Penolakan", value: `"${reason}"`, highlight: true }
      ]
    });
    return result;
  };

  // Handlers for User Management (Admin Only)
  const handleCreateUser = async (userData) => {
    await createUser(userData);
    await loadData();
  };

  const handleUpdateUser = async (id, userData) => {
    await updateUser(id, userData);
    if (currentUser && (currentUser.id === id || currentUser.email === userData.email)) {
      const updatedSession = { ...currentUser, ...userData };
      delete updatedSession.password;
      setCurrentUser(updatedSession);
      localStorage.setItem('wms_user', JSON.stringify(updatedSession));
    }
    await loadData();
  };

  const handleDeleteUser = async (id) => {
    await deleteUser(id);
    await loadData();
  };

  // Handlers for Branch Management (Admin Only)
  const handleCreateBranch = async (branchData) => {
    await createBranch(branchData);
    await loadData();
  };

  const handleUpdateBranch = async (id, branchData) => {
    await updateBranch(id, branchData);
    await loadData();
  };

  const handleDeleteBranch = async (id) => {
    await deleteBranch(id);
    await loadData();
  };

  const handleClearAllBranches = async () => {
    setLoading(true);
    try {
      await clearAllBranches();
      await loadData();
    } catch (e) {
      console.error("Error clearing branches:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setIsLogoutModalOpen(false);
  };


  const currentBranchDisplay = currentUser?.role === 'ADMIN' || currentUser?.branchId === 'ALL'
    ? 'Semua Cabang (Pusat)'
    : (branches.find(b => b.id === currentUser?.branchId)?.name || currentUser?.branchName || '-');

  const resolvedCurrentUser = currentUser ? {
    ...currentUser,
    branchName: currentBranchDisplay
  } : null;

  // Compute products available for Dashboard and Outbound for the current branch:
  // If Staff Cabang: ONLY map approved branchInventories for their specific branchId!
  const effectiveOutboundProducts = (currentUser?.role === 'STAFF_BRANCH')
    ? branchInventories
        .filter(bi => bi.branchId === currentUser?.branchId && bi.status === 'APPROVED')
        .map(bi => {
          const masterP = products.find(p => p.id === bi.productId || p.sku === bi.sku);
          return {
            id: bi.id,
            productId: bi.productId,
            sku: bi.sku,
            name: bi.productName,
            brand: bi.brand || masterP?.brand || 'Generic',
            machineCategory: masterP?.machineCategory || masterP?.kategoriMesin || 'Universal',
            price: bi.price ?? masterP?.price ?? 0,
            unit: bi.unit || masterP?.unit || 'Pcs',
            currentStock: Number(bi.stockQuantity) || 0,
            minStock: Number(bi.minStock) || 5,
            branchId: bi.branchId,
            branchName: bi.branchName || currentUser?.branchName || 'Cabang'
          };
        })
    : products;

  const handleNavigate = (tab, contextData = null) => {
    if (tab === 'products') {
      if (contextData?.tab) {
        setProductsInitialTab(contextData.tab);
      } else {
        setProductsInitialTab(null);
      }
    } else if (tab === 'stock-out' && contextData) {
      let matchedRequest = null;
      if (contextData.metaId) {
        matchedRequest = stockRequests.find(r => r.id === contextData.metaId);
      }
      if (matchedRequest) {
        setOutboundInitialRequestData({
          id: matchedRequest.id,
          requestId: matchedRequest.id,
          targetBranchId: matchedRequest.branchId,
          branchId: matchedRequest.branchId,
          branchName: matchedRequest.branchName,
          targetBranchName: matchedRequest.branchName,
          productId: matchedRequest.productId,
          productName: matchedRequest.productName,
          qty: matchedRequest.qty,
          notes: matchedRequest.notes
        });
      } else if (contextData.notif) {
        setOutboundInitialRequestData({
          notes: contextData.notif.message
        });
      }
    } else if (tab === 'stock-in') {
      if (contextData?.tab) {
        setInboundInitialTab(contextData.tab);
      } else {
        setInboundInitialTab('INCOMING_DELIVERIES');
      }
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-800">
      {/* Top Navbar with Real-time Notification Center */}
      <Navbar 
        currentUser={resolvedCurrentUser}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationRead}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onNavigate={handleNavigate}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation (Desktop Only) */}
        <Sidebar 
          currentUser={resolvedCurrentUser}
          activeTab={activeTab}
          setActiveTab={changeTab}
          onLogout={handleLogout}
        />


        {/* Main Content Area with Mobile Safe Padding */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-28 lg:pb-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
              <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium">Memuat data inventaris WMS...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard 
                  currentUser={currentUser}
                  products={effectiveOutboundProducts}
                  branchInventories={branchInventories}
                  transactions={transactions}
                  branches={branches}
                  users={users}
                  onNavigate={setActiveTab}
                  onLogout={handleLogout}
                />
              )}
              {activeTab === 'products' && (
                <ProductManagement 
                  currentUser={currentUser}
                  products={products}
                  branchInventories={branchInventories}
                  branches={branches}
                  brands={brands}
                  machineCategories={machineCategories}
                  initialTab={productsInitialTab}
                  onCreateProduct={handleCreateProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onCreateBrand={handleCreateBrand}
                  onDeleteBrand={handleDeleteBrand}
                  onCreateMachineCategory={handleCreateMachineCategory}
                  onDeleteMachineCategory={handleDeleteMachineCategory}
                  onShowBarcode={setBarcodeProduct}
                  onRequestBranchInventory={handleRequestBranchInventory}
                  onApproveBranchInventory={handleApproveBranchInventory}
                  onRejectBranchInventory={handleRejectBranchInventory}
                  onUpdateBranchInventory={handleUpdateBranchInventory}
                />

              )}
              {activeTab === 'stock-in' && (
                <StockIn 
                  currentUser={currentUser}
                  products={products}
                  branches={branches}
                  transfers={transfers}
                  stockRequests={stockRequests}
                  initialTab={inboundInitialTab}
                  onRecordMovement={handleRecordMovement}
                  onConfirmTransfer={handleConfirmTransfer}
                  onRejectTransfer={handleRejectTransfer}
                  onRequestStock={handleRequestStock}
                />
              )}
              {activeTab === 'stock-out' && (
                <StockOut 
                  currentUser={currentUser}
                  products={effectiveOutboundProducts}
                  branches={branches}
                  stockRequests={stockRequests}
                  initialRequestData={outboundInitialRequestData}
                  onClearInitialRequest={() => setOutboundInitialRequestData(null)}
                  onRecordMovement={handleRecordMovement}
                  onRejectStockRequest={handleRejectStockRequest}
                />
              )}
              {activeTab === 'history' && (
                <TransactionHistory 
                  currentUser={currentUser}
                  transactions={transactions}
                />
              )}
              {activeTab === 'monitoring' && (currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF_PUSAT' || currentUser?.role === 'PUSAT') && (
                <BranchMonitoring 
                  currentUser={currentUser}
                  branches={branches}
                  products={products}
                  branchInventories={branchInventories}
                  transactions={transactions}
                  users={users}
                />
              )}
              {activeTab === 'users' && currentUser?.role === 'ADMIN' && (
                <UserManagement 
                  currentUser={currentUser}
                  users={users}
                  branches={branches}
                  onCreateUser={handleCreateUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                />
              )}
              {activeTab === 'branches' && currentUser?.role === 'ADMIN' && (
                <BranchManagement 
                  currentUser={currentUser}
                  branches={branches}
                  users={users}
                  onCreateBranch={handleCreateBranch}
                  onUpdateBranch={handleUpdateBranch}
                  onDeleteBranch={handleDeleteBranch}
                  onClearAllBranches={handleClearAllBranches}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Barcode / QR Preview Modal */}
      <BarcodeModal 
        product={barcodeProduct}
        onClose={() => setBarcodeProduct(null)}
      />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav 
        currentUser={resolvedCurrentUser}
        activeTab={activeTab}
        setActiveTab={changeTab}
        onLogout={handleLogout}
      />


      {/* TOPMOST ROOT LEVEL SUCCESS POP-UP CONFIRMATION MODAL */}
      <GlobalSuccessModal
        isOpen={Boolean(globalSuccessPopup)}
        onClose={() => setGlobalSuccessPopup(null)}
        title={globalSuccessPopup?.title}
        message={globalSuccessPopup?.message}
        details={globalSuccessPopup?.details}
        buttonText={globalSuccessPopup?.buttonText || "✓ Selesai & Tutup"}
      />

      {/* LOGOUT CONFIRMATION MODAL */}
      <LogoutConfirmModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* MOBILE BACK BUTTON TOAST */}
      {backToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl z-[999] animate-bounce backdrop-blur-sm border border-slate-700">
          {backToast}
        </div>
      )}

      {/* REALTIME FLOATING NOTIFICATION TOAST */}
      {liveToastNotif && (
        <div 
          onClick={() => {
            handleNavigate(
              liveToastNotif.type === 'STOCK_TRANSFER_INCOMING' ? 'stock-in' :
              liveToastNotif.type === 'INVENTORY_REQUEST' ? 'products' :
              liveToastNotif.type === 'STOCK_REQUEST_SUBMITTED' ? 'stock-out' : 'dashboard',
              { tab: liveToastNotif.type === 'INVENTORY_REQUEST' ? 'APPROVAL_REQUESTS' : undefined }
            );
            setLiveToastNotif(null);
          }}
          className="fixed top-5 right-5 z-[9999] max-w-sm w-full bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-amber-400/40 animate-in slide-in-from-top-4 duration-300 cursor-pointer hover:border-amber-400 transition"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0 font-bold shadow-md shadow-amber-500/30 animate-bounce">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">Pemberitahuan Baru 🔴</span>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLiveToastNotif(null); }}
                  className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h5 className="font-bold text-xs text-white truncate mt-0.5">{liveToastNotif.title}</h5>
              <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-snug">{liveToastNotif.message}</p>
              <div className="flex items-center gap-1 text-[10px] text-amber-300 font-semibold mt-1.5">
                <span>Klik untuk langsung membuka</span>
                <span>→</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

