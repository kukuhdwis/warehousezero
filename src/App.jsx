import React, { useState, useEffect } from 'react';
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
  createProduct, 
  updateProduct, 
  deleteProduct, 
  fetchTransactions, 
  recordStockMovement,
  fetchBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchBrands,
  createBrand,
  deleteBrand,
  fetchBranchInventories,
  requestBranchInventory,
  approveBranchInventory,
  rejectBranchInventory,
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  fetchTransfers,
  createStockTransfer,
  confirmTransferReceipt,
  fetchStockRequests,
  createStockRequest,
  rejectStockRequest,
  fulfillStockRequest
} from './services/dataService';

import BottomNav from './components/BottomNav';
import GlobalSuccessModal from './components/GlobalSuccessModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [branchInventories, setBranchInventories] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [stockRequests, setStockRequests] = useState([]);
  const [outboundInitialRequestData, setOutboundInitialRequestData] = useState(null);
  const [inboundInitialTab, setInboundInitialTab] = useState('INCOMING_DELIVERIES');
  const [transactions, setTransactions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [brands, setBrands] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [globalSuccessPopup, setGlobalSuccessPopup] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, txs, branchList, userList, brandList, invList, notifList, transferList, reqList] = await Promise.all([
        fetchProducts(),
        fetchTransactions(),
        fetchBranches(),
        fetchUsers(),
        fetchBrands(),
        fetchBranchInventories(),
        fetchNotifications(currentUser),
        fetchTransfers(currentUser?.branchId),
        fetchStockRequests(currentUser?.branchId)
      ]);

      setBranches(branchList);
      setUsers(userList);
      setBrands(brandList);
      setProducts(prods);
      setBranchInventories(invList);
      setNotifications(notifList);
      setTransfers(transferList);
      setStockRequests(reqList);

      if (currentUser && currentUser.role === 'STAFF_BRANCH' && currentUser.branchId !== 'ALL') {
        // Scoped transactions to this branch
        setTransactions(txs.filter(t => !t.branchId || t.branchId === currentUser.branchId));
      } else {
        setTransactions(txs);
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

  // Handlers for Branch Inventory Requests & Approval Flow
  const handleRequestBranchInventory = async (requestData) => {
    await requestBranchInventory(requestData, currentUser);
    await loadData();
  };

  const handleApproveBranchInventory = async (id, adminUser) => {
    const matched = branchInventories.find(b => b.id === id);
    await approveBranchInventory(id, adminUser);
    await loadData();
    if (matched) {
      setGlobalSuccessPopup({
        title: "Pengajuan Inventaris Disetujui!",
        message: `Inventaris untuk "${matched.productName}" telah diverifikasi dan resmi aktif di ${matched.branchName || 'Cabang'}.`,
        details: [
          { label: "Cabang", value: matched.branchName || 'Cabang' },
          { label: "Produk", value: matched.productName },
          { label: "Stok Aktif", value: `+${matched.stockQuantity} Pcs`, highlight: true }
        ]
      });
    }
  };

  const handleRejectBranchInventory = async (id, adminUser, reason) => {
    const matched = branchInventories.find(b => b.id === id);
    await rejectBranchInventory(id, adminUser, reason);
    await loadData();
    setGlobalSuccessPopup({
      title: "Pengajuan Inventaris Ditolak",
      message: `Pengajuan inventaris cabang telah ditolak dengan alasan resmi yang terkirim ke cabang.`,
      details: [
        { label: "Cabang", value: matched?.branchName || 'Cabang' },
        { label: "Produk", value: matched?.productName || 'Produk' },
        { label: "Alasan Penolakan", value: `"${reason}"`, highlight: true }
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

  // Handler for Branch Confirming Central Transfer Receipt
  const handleConfirmTransfer = async (transferId, notes) => {
    const matched = transfers.find(t => t.id === transferId);
    const result = await confirmTransferReceipt(transferId, currentUser, notes);
    await loadData();
    if (matched) {
      setGlobalSuccessPopup({
        title: "Paket Kiriman Berhasil Diterima!",
        message: "Stok fisik barang telah diverifikasi dan langsung aktif di inventaris cabang Anda.",
        details: [
          { label: "Barang Diterima", value: `${matched.qty} Pcs "${matched.productName}"` },
          { label: "No. Surat Jalan", value: matched.deliveryNote, highlight: true },
          { label: "Status", value: "Diterima & Aktif di Cabang" }
        ]
      });
    }
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
    for (const b of branches) {
      await deleteBranch(b.id);
    }
    await loadData();
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  const currentBranchDisplay = currentUser?.role === 'ADMIN' || currentUser?.branchId === 'ALL'
    ? 'Semua Cabang (Pusat)'
    : (branches.find(b => b.id === currentUser?.branchId)?.name || currentUser?.branchName || '-');

  const resolvedCurrentUser = currentUser ? {
    ...currentUser,
    branchName: currentBranchDisplay
  } : null;

  // Compute products available for Outbound for the current branch:
  // If Staff Cabang: map stocks from approved branchInventories
  const effectiveOutboundProducts = (currentUser?.role === 'STAFF_BRANCH')
    ? products.map(p => {
        const branchInv = branchInventories.find(
          bi => bi.branchId === currentUser.branchId && (bi.productId === p.id || bi.sku === p.sku) && bi.status === 'APPROVED'
        );
        return {
          ...p,
          currentStock: branchInv ? Number(branchInv.stockQuantity) : 0
        };
      })
    : products;

  const handleNavigate = (tab, contextData = null) => {
    if (tab === 'stock-out' && contextData) {
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Inter',sans-serif]">
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
          setActiveTab={setActiveTab}
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
                  onCreateProduct={handleCreateProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onCreateBrand={handleCreateBrand}
                  onDeleteBrand={handleDeleteBrand}
                  onShowBarcode={setBarcodeProduct}
                  onRequestBranchInventory={handleRequestBranchInventory}
                  onApproveBranchInventory={handleApproveBranchInventory}
                  onRejectBranchInventory={handleRejectBranchInventory}
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
        setActiveTab={setActiveTab}
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
    </div>
  );
}
