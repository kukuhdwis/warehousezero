import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, QrCode, ArrowDownLeft, ArrowUpRight, Eye, Package } from 'lucide-react';
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
import PublicCatalog from './components/PublicCatalog';
import LandingPage from './components/LandingPage';
import { getStoredUser, logoutUser } from './services/authService';
import { 
  fetchProducts, 
  subscribeProducts,
  createProduct, 
  updateProduct, 
  deleteProduct, 
  deleteProductsBatch, 
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
  deleteBranchInventory,

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
  createBatchStockRequests,
  rejectStockRequest,
  rejectBatchStockRequests,
  fulfillStockRequest,
  playNotificationSound,

  fetchBundles,
  subscribeBundles,
  createBundle,
  updateBundle,
  deleteBundle,
  deleteBundlesBatch,
  importBundlesBatch
} from './services/dataService';

import BottomNav from './components/BottomNav';
import GlobalSuccessModal from './components/GlobalSuccessModal';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import CustomAlertModal from './components/CustomAlertModal';
import { db } from './services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function App() {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [forceLogoutAlert, setForceLogoutAlert] = useState(null);

  const handleForceLogout = async (reason) => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    setCurrentUser(null);
    setForceLogoutAlert(reason);
    window.history.pushState({}, '', '/login');
    setCurrentRoute('login');
  };
  
  const internalTabs = ['dashboard', 'products', 'stock-in', 'stock-out', 'history', 'monitoring', 'users', 'branches'];

  // Clean URL Routing (Manual SPA Routing)
  const [currentRoute, setCurrentRoute] = useState(() => {
    const p = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
    const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    
    // Check if Catalog is requested
    if (
      p.startsWith('/catalog') || p.startsWith('/katalog') || p.startsWith('/product') ||
      (sp && (sp.get('catalog') === 'true' || sp.get('sku')))
    ) {
      return 'catalog';
    }
    
    // Check if Login is requested
    if (p.startsWith('/login') || p.startsWith('/admin') || p.startsWith('/staf')) {
      return 'login';
    }

    // Check if it matches an internal tab
    const tabMatch = internalTabs.find(tab => p.startsWith(`/${tab}`));
    if (tabMatch) {
      return 'app';
    }

    return 'landing';
  });

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  let initialUrlSku = searchParams ? (searchParams.get('sku') || '') : '';
  
  if (!initialUrlSku && typeof window !== 'undefined') {
    const segments = window.location.pathname.split('/').filter(Boolean);
    if (segments.length >= 2 && (segments[0] === 'catalog' || segments[0] === 'katalog' || segments[0] === 'product')) {
      if (segments[1] !== 'list') {
        initialUrlSku = decodeURIComponent(segments[1]);
      }
    }
  }

  const [detectedQrSku, setDetectedQrSku] = useState(initialUrlSku);
  const [isQrActionSheetOpen, setIsQrActionSheetOpen] = useState(Boolean(initialUrlSku && currentUser));

  const [activeTab, setActiveTab] = useState(() => {
    const p = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
    const tabMatch = internalTabs.find(tab => p.startsWith(`/${tab}`));
    return tabMatch || 'dashboard';
  });

  // Listen to popstate for browser navigation (Back/Forward buttons)
  useEffect(() => {
    const handlePopStateRoute = () => {
      const p = window.location.pathname.toLowerCase();
      if (p.startsWith('/catalog') || p.startsWith('/katalog') || p.startsWith('/product')) {
        setCurrentRoute('catalog');
      } else if (p.startsWith('/login') || p.startsWith('/admin')) {
        setCurrentRoute('login');
      } else {
        const tabMatch = internalTabs.find(tab => p.startsWith(`/${tab}`));
        if (tabMatch) {
          setCurrentRoute('app');
          setActiveTab(tabMatch);
        } else {
          setCurrentRoute('landing');
        }
      }
    };
    window.addEventListener('popstate', handlePopStateRoute);
    return () => window.removeEventListener('popstate', handlePopStateRoute);
  }, []);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
  const [historyInitialSearch, setHistoryInitialSearch] = useState('');
  const [branches, setBranches] = useState([]);
  const [brands, setBrands] = useState([]);
  const [machineCategories, setMachineCategories] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [globalSuccessPopup, setGlobalSuccessPopup] = useState(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [backToast, setBackToast] = useState(null);
  const [liveToastNotif, setLiveToastNotif] = useState(null);
  const prevNotifIdsRef = useRef(new Set());
  const isInitialNotifLoadRef = useRef(true);

  // Find product matching detectedQrSku (placed safely after all useState definitions)
  const detectedProduct = (products || []).find(p => 
    (p.sku || '').toLowerCase() === (detectedQrSku || '').toLowerCase() ||
    (p.code || '').toLowerCase() === (detectedQrSku || '').toLowerCase()
  );

  const loadBundles = async () => {
    try {
      const bList = await fetchBundles();
      setBundles(bList);
    } catch (e) {
      console.warn("Gagal memuat bundles:", e);
    }
  };

  const loadData = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      // Data is populated automatically via onSnapshot real-time subscriptions.
      if (showSpinner) {
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    } catch (e) {
      console.error("Error loading data:", e);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData(true);
      loadBundles();
    }
  }, [currentUser]);

  // Check if we need to auto-migrate the legacy admin account to UID
  useEffect(() => {
    if (currentUser?.email === 'admin@perusahaan.com' && currentUser?.uid) {
      const runMigration = async () => {
        try {
          const { query, collection, where, getDocs, doc, getDoc, setDoc, deleteDoc } = await import('firebase/firestore');
          const { db } = await import('./services/firebase');
          
          // First check if the UID document already exists
          const uidDocRef = doc(db, 'users', currentUser.uid);
          const uidDocSnap = await getDoc(uidDocRef);
          
          if (uidDocSnap.exists()) {
            return; // Already migrated
          }

          // Search for legacy document
          const q = query(collection(db, 'users'), where('email', '==', 'admin@perusahaan.com'));
          const snap = await getDocs(q);
          
          if (!snap.empty) {
            const oldDoc = snap.docs[0];
            const oldDocId = oldDoc.id;
            const profileData = oldDoc.data();
            
            if (oldDocId !== currentUser.uid) {
              const newPayload = {
                ...profileData,
                id: currentUser.uid,
                uid: currentUser.uid,
              };
              
              await setDoc(uidDocRef, newPayload);
              console.log('Successfully migrated admin to new UID!');
              
              try {
                await deleteDoc(doc(db, 'users', oldDocId));
                console.log('Deleted old legacy admin document.');
              } catch (e) {
                console.warn('Could not delete old document (this is fine):', e);
              }
            }
          }
        } catch (err) {
          console.warn('Auto migration error:', err);
        }
      };
      runMigration();
    }
  }, [currentUser]);

  // Initial Data Load (Safe Realtime Subscriptions)
  useEffect(() => {
    if (!currentUser) return;

    // 0. Live Session Guard: Auto-logout immediately if User Doc or Branch Doc is deleted/deactivated by Admin
    let unsubUserDoc = () => {};
    let unsubBranchDoc = () => {};

    if (currentUser?.uid && currentUser?.email !== 'admin@perusahaan.com') {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        unsubUserDoc = onSnapshot(userRef, (snap) => {
          if (!snap.exists() || snap.data()?.status === 'INACTIVE' || snap.data()?.status === 'DELETED') {
            handleForceLogout('Sesi Anda telah berakhir. Akun Anda telah dinonaktifkan atau dihapus oleh Administrator.');
          }
        }, (err) => {
          console.warn('User status guard listener warning:', err);
        });

        if (currentUser?.role === 'STAFF_BRANCH' && currentUser?.branchId && currentUser?.branchId !== 'ALL') {
          const branchRef = doc(db, 'branches', currentUser.branchId);
          unsubBranchDoc = onSnapshot(branchRef, (snap) => {
            if (!snap.exists() || snap.data()?.status === 'INACTIVE' || snap.data()?.status === 'DELETED') {
              handleForceLogout('Sesi Anda telah berakhir. Data cabang ini telah dinonaktifkan atau dihapus oleh Administrator.');
            }
          }, (err) => {
            console.warn('Branch status guard listener warning:', err);
          });
        }
      } catch (guardErr) {
        console.warn('Failed to attach session guard listener:', guardErr);
      }
    }

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
      unsubUserDoc();
      unsubBranchDoc();
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

  const changeTab = (newTab) => {
    if (newTab !== activeTab) {
      window.history.pushState({}, '', `/${newTab}`);
      setCurrentRoute('app');
      setActiveTab(newTab);
    }
  };


  // Unauthenticated real-time stream for public catalog & landing page (Master Products & Master Bundles)
  useEffect(() => {
    if (!currentUser && (currentRoute === 'catalog' || currentRoute === 'landing')) {
      const unsubProds = subscribeProducts((liveProds) => setProducts(liveProds));
      const unsubBrands = subscribeBrands((liveBrands) => setBrands(liveBrands));
      const unsubCats = subscribeMachineCategories((liveCats) => setMachineCategories(liveCats));
      const unsubBundles = subscribeBundles((liveBundles) => setBundles(liveBundles));
      return () => {
        unsubProds();
        unsubBrands();
        unsubCats();
        unsubBundles();
      };
    }
  }, [currentUser, currentRoute]);

  // Tampilkan Landing Page (Public)
  if (currentRoute === 'landing') {
    return (
      <LandingPage 
        currentUser={currentUser} 
        products={products}
        bundles={bundles}
      />
    );
  }

  // Tampilkan Public E-Catalog
  if (currentRoute === 'catalog') {
    return (
      <PublicCatalog 
        products={products}
        bundles={bundles}
        brands={brands}
        machineCategories={machineCategories}
        initialSku={initialUrlSku}
        onGoToLanding={() => {
          window.history.pushState({}, '', '/');
          setCurrentRoute('landing');
        }}
        onGoToLogin={() => {
          window.history.pushState({}, '', '/login');
          setCurrentRoute('login');
        }}
      />
    );
  }

  // Jika belum login -> Tampilkan Halaman Login (untuk route /login atau route internal jika belum login)
  if (!currentUser) {
    return (
      <>
        <LoginView 
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setActiveTab('dashboard');
            // Update URL back to /dashboard after successful login
            window.history.pushState({}, '', '/dashboard');
            setCurrentRoute('app');
          }} 
          onOpenCatalog={() => {
            window.history.pushState({}, '', '/catalog');
            setCurrentRoute('catalog');
          }}
          onGoToLanding={() => {
            window.history.pushState({}, '', '/');
            setCurrentRoute('landing');
          }}
        />
        {forceLogoutAlert && (
          <CustomAlertModal
            isOpen={Boolean(forceLogoutAlert)}
            onClose={() => setForceLogoutAlert(null)}
            title="Sesi Berakhir"
            message={forceLogoutAlert}
            type="WARNING"
            buttonText="Mengerti & Masuk Kembali"
          />
        )}
      </>
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

  const handleDeleteProductsBatch = async (ids) => {
    await deleteProductsBatch(ids);
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

  const handleDeleteBranchInventory = async (id) => {
    await deleteBranchInventory(id);
    await loadData();
    setGlobalSuccessPopup({
      title: "Inventaris Cabang Dihapus!",
      message: "Data inventaris produk cabang telah berhasil dihapus dari database.",
      details: [
        { label: "Status", value: "Berhasil Dihapus" }
      ]
    });
  };

  // Handlers for Bundles
  const handleCreateBundle = async (bundleData) => {
    const res = await createBundle(bundleData);
    await loadBundles();
    return res;
  };

  const handleUpdateBundle = async (id, bundleData) => {
    const res = await updateBundle(id, bundleData);
    await loadBundles();
    return res;
  };

  const handleDeleteBundle = async (id) => {
    const res = await deleteBundle(id);
    await loadBundles();
    return res;
  };

  const handleDeleteBundlesBatch = async (ids) => {
    const res = await deleteBundlesBatch(ids);
    await loadBundles();
    return res;
  };

  const handleImportBundlesBatch = async (bundleList, onProgress) => {
    const res = await importBundlesBatch(bundleList, onProgress);
    await loadBundles();
    return res;
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

    // If this is a Central Transfer to a Branch, check if there is a pending stock request matching this branch and product, and mark as fulfilled
    if (movementData.transactionType === 'STOCK_TRANSFER_TO_BRANCH') {
      const deliveryNoteNo = movementData.deliveryNote || `SJ-HQ-${Date.now().toString().slice(-6)}`;

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
  };

  // Handler for Branch Confirming Central Transfer Receipt (Single or Batch)
  const handleConfirmTransfer = async (transferIdOrItems, notes) => {
    const list = Array.isArray(transferIdOrItems) ? transferIdOrItems : [transferIdOrItems];
    const result = await confirmBatchTransferReceipt(list, currentUser, notes);
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

  // Handler for Branch Requesting Stock from Central Office (Supports Single or Batch)
  const handleRequestStock = async (requestDataOrList) => {
    const isArray = Array.isArray(requestDataOrList);
    let result;
    if (isArray) {
      result = await createBatchStockRequests(requestDataOrList, currentUser);
    } else {
      result = await createStockRequest(requestDataOrList, currentUser);
    }

    const count = isArray ? requestDataOrList.length : 1;
    const firstItem = isArray ? requestDataOrList[0] : requestDataOrList;

    setGlobalSuccessPopup({
      title: "Permintaan Stok Berhasil Dikirim!",
      message: `Pengajuan permintaan stok (${count} produk) telah berhasil tercatat dan ternotifikasi ke Kantor Pusat.`,
      details: [
        { label: "Jumlah Permintaan", value: `${count} Produk`, highlight: true },
        { label: "Rincian Barang", value: isArray && count > 1 ? `${firstItem?.productName || 'Produk'} (+${count - 1} lainnya)` : `${firstItem?.qty || 1} Pcs "${firstItem?.productName || 'Produk'}"` },
        { label: "Status", value: "⏳ Menunggu Respon Pusat" },
        ...(firstItem?.notes ? [{ label: "Catatan", value: firstItem.notes }] : [])
      ]
    });
    return result;
  };

  // Handler for Central Warehouse Rejecting Stock Request (Supports Single ID or Array of IDs)
  const handleRejectStockRequest = async (requestIdOrList, reason) => {
    const isArray = Array.isArray(requestIdOrList);
    let result;
    if (isArray) {
      result = await rejectBatchStockRequests(requestIdOrList, reason, currentUser);
    } else {
      result = await rejectStockRequest(requestIdOrList, reason, currentUser);
    }
    // Note: StockOut.jsx provides its own comprehensive rejection success modal with exact items,
    // so we don't trigger a duplicate popup here to prevent the user having to click twice.
    return result;
  };

  // Handlers for User Management (Admin Only)
  const handleCreateUser = async (userData) => {
    await createUser(userData);
  };

  const handleUpdateUser = async (id, userData) => {
    await updateUser(id, userData);
    if (currentUser && (currentUser.id === id || currentUser.email === userData.email)) {
      const updatedSession = { ...currentUser, ...userData };
      delete updatedSession.password;
      setCurrentUser(updatedSession);
      localStorage.setItem('wms_user', JSON.stringify(updatedSession));
    }
  };

  const handleDeleteUser = async (id) => {
    await deleteUser(id);
  };

  // Handlers for Branch Management (Admin Only)
  const handleCreateBranch = async (branchData) => {
    await createBranch(branchData);
  };

  const handleUpdateBranch = async (id, branchData) => {
    await updateBranch(id, branchData);
  };

  const handleDeleteBranch = async (id) => {
    await deleteBranch(id);
  };

  const handleClearAllBranches = async () => {
    setLoading(true);
    try {
      await clearAllBranches();
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
    window.history.pushState({}, '', '/login');
    setCurrentRoute('login');
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
        .filter(bi => {
          const userBranchId = (currentUser.branchId || '').toLowerCase();
          const userBranchName = (currentUser.branchName || '').toLowerCase();
          const itemBranchId = (bi.branchId || '').toLowerCase();
          const itemBranchName = (bi.branchName || '').toLowerCase();

          const matchesBranch = (
            (userBranchId && (itemBranchId === userBranchId || itemBranchName === userBranchId)) ||
            (userBranchName && (itemBranchName === userBranchName || itemBranchId === userBranchName))
          );
          return matchesBranch && bi.status === 'APPROVED';
        })
        .map(bi => {
          const masterP = products.find(p => p.id === bi.productId || p.sku === bi.sku);
          const masterCost = Number(masterP?.reseller_price ?? masterP?.resellerPrice ?? masterP?.cost_price ?? masterP?.costPrice ?? 0);
          const branchCost = Number(bi.costPrice ?? bi.reseller_price ?? bi.resellerPrice ?? 0);
          return {
            id: bi.productId,
            branchInventoryId: bi.id,
            productId: bi.productId,
            sku: bi.sku,
            name: bi.productName,
            brand: bi.brand || masterP?.brand || 'Generic',
            machineCategory: masterP?.machineCategory || masterP?.kategoriMesin || 'Universal',
            price: Number(bi.price ?? masterP?.selling_price ?? masterP?.price ?? 0),
            unit: bi.unit || masterP?.unit || 'Pcs',
            currentStock: Number(bi.stockQuantity) || 0,
            minStock: Number(bi.minStock) || 5,
            costPrice: masterCost > 0 ? masterCost : (branchCost > 0 ? branchCost : 0),
            branchId: bi.branchId,
            branchName: bi.branchName || currentUser?.branchName || 'Cabang'
          };
        })
    : products.map(p => ({
        ...p,
        costPrice: Number(p.costPrice ?? p.reseller_price ?? p.resellerPrice ?? p.cost_price ?? 0)
      }));

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
    } else if (tab === 'history' && contextData) {
      if (contextData.type === 'STOCK_TRANSFER_REJECTED') {
        const msg = contextData.notif?.message || '';
        const sjMatch = msg.match(/SJ-[A-Z0-9-]+/i);
        const deliveryNote = contextData.deliveryNote || (sjMatch ? sjMatch[0] : null);
        
        const reasonMatch = msg.match(/Alasan:\s*["']?([^"']+)["']?/i);
        const reason = contextData.rejectionReason || (reasonMatch ? reasonMatch[1] : '-');

        const branchName = msg.split(' MENOLAK')[0] || 'Cabang';

        setGlobalSuccessPopup({
          title: "Kiriman Ditolak oleh Cabang ⚠️",
          message: `Cabang ${branchName} telah MENOLAK paket kiriman. Seluruh unit barang otomatis diretur dan dikembalikan ke stok fisik Gudang Pusat.`,
          details: [
            { label: "Status Kiriman", value: "Ditolak / Diretur", highlight: true },
            { label: "Cabang Penolak", value: branchName },
            ...(deliveryNote ? [{ label: "No. Surat Jalan", value: deliveryNote }] : []),
            { label: "Alasan Penolakan", value: `"${reason}"`, highlight: true },
            { label: "Tindakan Sistem", value: "✓ Stok Master Pusat Dikembalikan & Tercatat di Riwayat" }
          ],
          buttonText: "Buka Riwayat Transaksi"
        });

        if (deliveryNote) {
          setHistoryInitialSearch(deliveryNote);
        }
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
        onLogout={handleLogout}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation (Desktop Only) */}
        <Sidebar 
          currentUser={resolvedCurrentUser}
          activeTab={activeTab}
          setActiveTab={changeTab}
          onLogout={handleLogout}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
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
                  bundles={bundles}
                  onCreateBundle={handleCreateBundle}
                  onUpdateBundle={handleUpdateBundle}
                  onDeleteBundle={handleDeleteBundle}
                  onDeleteBundlesBatch={handleDeleteBundlesBatch}
                  onImportBundlesBatch={handleImportBundlesBatch}
                  initialTab={productsInitialTab}
                  onCreateProduct={handleCreateProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onDeleteProductsBatch={handleDeleteProductsBatch}
                  onCreateBrand={handleCreateBrand}
                  onDeleteBrand={handleDeleteBrand}
                  onCreateMachineCategory={handleCreateMachineCategory}
                  onDeleteMachineCategory={handleDeleteMachineCategory}
                  onShowBarcode={setBarcodeProduct}
                  onRequestBranchInventory={handleRequestBranchInventory}
                  onApproveBranchInventory={handleApproveBranchInventory}
                  onRejectBranchInventory={handleRejectBranchInventory}
                  onUpdateBranchInventory={handleUpdateBranchInventory}
                  onDeleteBranchInventory={handleDeleteBranchInventory}
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
                  bundles={bundles}
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
                  products={products}
                  initialSearch={historyInitialSearch}
                  onClearInitialSearch={() => setHistoryInitialSearch('')}
                />
              )}
              {activeTab === 'monitoring' && (
                <BranchMonitoring 
                  currentUser={currentUser}
                  branches={branches}
                  products={products}
                  branchInventories={branchInventories}
                  transactions={transactions}
                  users={users}
                  brands={brands}
                  machineCategories={machineCategories}
                  onCreateProduct={handleCreateProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onDeleteProductsBatch={handleDeleteProductsBatch}
                  onUpdateBranchInventory={handleUpdateBranchInventory}
                  onRequestBranchInventory={handleRequestBranchInventory}
                  onApproveBranchInventory={handleApproveBranchInventory}
                  onRejectBranchInventory={handleRejectBranchInventory}
                  onShowBarcode={setBarcodeProduct}
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

      {/* SMART QR CODE DETECTED MODAL (WHEN LOGGED-IN STAFF SCANS QR FROM OUTSIDE APP) */}
      {isQrActionSheetOpen && detectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col">
            
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-xs">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white leading-tight">Smart QR Terdeteksi!</h4>
                  <p className="text-[11px] text-slate-300">Pilih aksi cepat untuk produk ini</p>
                </div>
              </div>
              <button 
                onClick={() => setIsQrActionSheetOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                {detectedProduct.imageUrl ? (
                  <img 
                    src={detectedProduct.imageUrl} 
                    alt={detectedProduct.name} 
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-2xs flex-shrink-0 bg-white" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                    <Package className="w-7 h-7 opacity-60" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.2 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                      {detectedProduct.engine_type || 'Universal'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 font-bold">
                      {detectedProduct.sku || detectedProduct.code}
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm mt-0.5 truncate">{detectedProduct.name}</h5>
                  <p className="text-xs font-bold text-emerald-600 mt-0.5">
                    Rp {(Number(detectedProduct.selling_price ?? detectedProduct.price) || 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('stock-in');
                    setIsQrActionSheetOpen(false);
                  }}
                  className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 active:scale-95 cursor-pointer"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>+ Buka di Barang Masuk (Stock In)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('stock-out');
                    setIsQrActionSheetOpen(false);
                  }}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>+ Buka di Barang Keluar / Kasir (Stock Out)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCatalogMode(true);
                    setIsQrActionSheetOpen(false);
                  }}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-slate-500" />
                  <span>Lihat Tampilan E-Katalog Publik</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

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
              liveToastNotif.type === 'STOCK_REQUEST_SUBMITTED' ? 'stock-out' :
              liveToastNotif.type === 'STOCK_TRANSFER_REJECTED' ? 'history' : 'dashboard',
              { 
                tab: liveToastNotif.type === 'INVENTORY_REQUEST' ? 'APPROVAL_REQUESTS' : undefined,
                type: liveToastNotif.type,
                notif: liveToastNotif
              }
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

