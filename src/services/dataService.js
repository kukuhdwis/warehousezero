import { db, isFirebaseConfigured } from "./firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  increment,
  where 
} from "firebase/firestore";

// Clean Storage Keys
const PRODUCTS_KEY = "wms_products";
const TRANSACTIONS_KEY = "wms_transactions";
const BRANCHES_KEY = "wms_branches";
const USERS_KEY = "wms_users_list";
const BRANDS_KEY = "wms_brands";
const BRANCH_INVENTORIES_KEY = "wms_branch_inventories";
const NOTIFICATIONS_KEY = "wms_notifications";
const TRANSFERS_KEY = "wms_stock_transfers";
const STOCK_REQUESTS_KEY = "wms_stock_requests";
const DUMMY_CLEANED_FLAG = "wms_dummy_cleaned_v2";

export const DEFAULT_BRANDS = [
  { id: "brand-1", name: "NDK Packaging", createdAt: new Date().toISOString() },
  { id: "brand-2", name: "Generic / Polos", createdAt: new Date().toISOString() }
];

// Default Root Administrator (Only for initial bootstrap if user database is empty)
export const DEFAULT_ROOT_ADMIN = {
  id: "usr-root-admin",
  name: "Administrator (Pusat)",
  email: "admin@perusahaan.com",
  password: "admin",
  role: "ADMIN",
  branchId: "ALL",
  branchName: "Semua Cabang (Pusat)",
  phone: "0811-0000-0001",
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

// Default Staff Gudang Pusat (Bisa monitor semua cabang, Inbound & Outbound, tanpa kelola user)
export const DEFAULT_STAFF_PUSAT = {
  id: "usr-staff-pusat",
  name: "Staff Gudang Pusat",
  email: "staffpusat@perusahaan.com",
  password: "staff",
  role: "STAFF_PUSAT",
  branchId: "ALL",
  branchName: "Semua Cabang (Pusat)",
  phone: "0812-3456-7890",
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

export const INITIAL_DEFAULT_USERS = [DEFAULT_ROOT_ADMIN, DEFAULT_STAFF_PUSAT];

// Automatic cleanup of legacy dummy data from previous sessions
const cleanupLegacyDummyData = () => {
  if (!localStorage.getItem(DUMMY_CLEANED_FLAG)) {
    localStorage.removeItem(PRODUCTS_KEY);
    localStorage.removeItem(TRANSACTIONS_KEY);
    localStorage.removeItem(BRANCHES_KEY);
    localStorage.removeItem(USERS_KEY);
    localStorage.setItem(DUMMY_CLEANED_FLAG, "true");
  }

  // Purge any temporary dummy branch if it got cached
  try {
    const data = localStorage.getItem(BRANCHES_KEY);
    if (data) {
      const branches = JSON.parse(data);
      const cleaned = branches.filter(b => b.id !== "branch-utama-1" && b.name !== "Gudang Utama Jakarta");
      if (cleaned.length !== branches.length) {
        localStorage.setItem(BRANCHES_KEY, JSON.stringify(cleaned));
      }
    }
  } catch (e) {
    // Ignore JSON parse errors
  }
};

// Run cleanup immediately on load
cleanupLegacyDummyData();

// Helper to get local data safely
const getLocalProducts = () => {
  try {
    const data = localStorage.getItem(PRODUCTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalProducts = (products) => {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

const getLocalTransactions = () => {
  try {
    const data = localStorage.getItem(TRANSACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalTransactions = (transactions) => {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

const getLocalBranches = () => {
  try {
    const data = localStorage.getItem(BRANCHES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalBranches = (branches) => {
  localStorage.setItem(BRANCHES_KEY, JSON.stringify(branches));
};

const getLocalBrands = () => {
  try {
    const data = localStorage.getItem(BRANDS_KEY);
    if (!data) {
      localStorage.setItem(BRANDS_KEY, JSON.stringify(DEFAULT_BRANDS));
      return DEFAULT_BRANDS;
    }
    const parsed = JSON.parse(data);
    return parsed.length > 0 ? parsed : DEFAULT_BRANDS;
  } catch (e) {
    return DEFAULT_BRANDS;
  }
};

const saveLocalBrands = (brands) => {
  localStorage.setItem(BRANDS_KEY, JSON.stringify(brands));
};

const getLocalUsers = () => {
  try {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_DEFAULT_USERS));
      return INITIAL_DEFAULT_USERS;
    }
    const parsed = JSON.parse(data);
    if (parsed.length > 0) {
      const hasStaffPusat = parsed.some(u => (u.email || '').toLowerCase() === 'staffpusat@perusahaan.com');
      if (!hasStaffPusat) {
        parsed.push(DEFAULT_STAFF_PUSAT);
        localStorage.setItem(USERS_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
    return INITIAL_DEFAULT_USERS;
  } catch (e) {
    return INITIAL_DEFAULT_USERS;
  }
};

const saveLocalUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const getLocalBranchInventories = () => {
  try {
    const data = localStorage.getItem(BRANCH_INVENTORIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalBranchInventories = (inventories) => {
  localStorage.setItem(BRANCH_INVENTORIES_KEY, JSON.stringify(inventories));
};

const getLocalNotifications = () => {
  try {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalNotifications = (notifications) => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

const getLocalTransfers = () => {
  try {
    const data = localStorage.getItem(TRANSFERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const getLocalStockRequests = () => {
  try {
    const data = localStorage.getItem(STOCK_REQUESTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalStockRequests = (requests) => {
  localStorage.setItem(STOCK_REQUESTS_KEY, JSON.stringify(requests));
};

const saveLocalTransfers = (transfers) => {
  localStorage.setItem(TRANSFERS_KEY, JSON.stringify(transfers));
};

// ==========================================
// BRAND / MERK SERVICES (REAL DATA)
// ==========================================

export const fetchBrands = async () => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, "brands"), orderBy("name", "asc"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firestoreBrands = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        saveLocalBrands(firestoreBrands);
        return firestoreBrands;
      }
      return getLocalBrands();
    } catch (err) {
      console.warn("Firestore error, reading local brands:", err);
      return getLocalBrands();
    }
  }
  return getLocalBrands();
};

export const createBrand = async (brandData) => {
  const brandName = (typeof brandData === 'string' ? brandData : brandData.name || '').trim();
  if (!brandName) throw new Error("Nama merk tidak boleh kosong.");

  const newBrand = {
    name: brandName,
    createdAt: new Date().toISOString()
  };

  let assignedId = `brand-${Date.now()}`;

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = await addDoc(collection(db, "brands"), {
        ...newBrand,
        createdAt: serverTimestamp()
      });
      assignedId = docRef.id;
    } catch (err) {
      console.warn("Firestore error creating brand:", err);
    }
  }

  const brands = getLocalBrands();
  const existing = brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
  if (existing) return existing;

  const created = { id: assignedId, ...newBrand };
  brands.push(created);
  saveLocalBrands(brands);
  return created;
};

export const deleteBrand = async (brandIdOrName) => {
  if (!brandIdOrName) return false;

  if (isFirebaseConfigured() && db) {
    try {
      const brandsSnapshot = await getDocs(collection(db, "brands"));
      for (const docSnap of brandsSnapshot.docs) {
        if (docSnap.id === brandIdOrName || docSnap.data().name?.toLowerCase() === brandIdOrName.toLowerCase()) {
          await deleteDoc(doc(db, "brands", docSnap.id));
        }
      }
    } catch (err) {
      console.warn("Firestore error deleting brand:", err);
    }
  }

  const brands = getLocalBrands();
  const filtered = brands.filter(b => b.id !== brandIdOrName && b.name?.toLowerCase() !== brandIdOrName.toLowerCase());
  saveLocalBrands(filtered);
  return true;
};

// ==========================================
// PRODUCT SERVICES (REAL MASTER CATALOG DATA)
// ==========================================

export const fetchProducts = async () => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, "products"), orderBy("name", "asc"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firestoreProds = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        saveLocalProducts(firestoreProds);
        return firestoreProds;
      }
      return getLocalProducts();
    } catch (err) {
      console.warn("Firestore error, reading local database:", err);
      return getLocalProducts();
    }
  }
  return getLocalProducts();
};

export const createProduct = async (productData) => {
  const newProd = {
    ...productData,
    price: Number(productData.price) || 0,
    minStock: Number(productData.minStock) || 0,
    currentStock: Number(productData.currentStock) || 0,
    barcode: productData.barcode || productData.sku,
    unit: 'Pcs',
    branchId: 'ALL',
    branchName: 'Semua Cabang (Pusat)',
    updatedAt: new Date().toISOString()
  };

  let assignedId = `prod-${Date.now()}`;

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = await addDoc(collection(db, "products"), {
        ...newProd,
        createdAt: serverTimestamp()
      });
      assignedId = docRef.id;
    } catch (err) {
      console.warn("Firestore error creating product:", err);
    }
  }

  const products = getLocalProducts();
  const created = { id: assignedId, ...newProd };
  products.unshift(created);
  saveLocalProducts(products);
  return created;
};

export const updateProduct = async (id, productData) => {
  const updatedData = {
    ...productData,
    price: Number(productData.price) || 0,
    minStock: Number(productData.minStock) || 0,
    currentStock: Number(productData.currentStock) || 0,
    updatedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, "products", id);
      await updateDoc(docRef, updatedData);
    } catch (err) {
      console.warn("Firestore error updating product:", err);
    }
  }

  const products = getLocalProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx !== -1) {
    products[idx] = { ...products[idx], ...updatedData };
    saveLocalProducts(products);
  }
  return { id, ...updatedData };
};

export const deleteProduct = async (id) => {
  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (err) {
      console.warn("Firestore error deleting product:", err);
    }
  }
  const products = getLocalProducts().filter(p => p.id !== id);
  saveLocalProducts(products);
};

// ==========================================
// BRANCH INVENTORIES & APPROVAL FLOW
// ==========================================

export const fetchBranchInventories = async (branchId = null) => {
  if (isFirebaseConfigured() && db) {
    try {
      let q = collection(db, "branch_inventories");
      if (branchId && branchId !== 'ALL') {
        q = query(collection(db, "branch_inventories"), where("branchId", "==", branchId));
      }
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firestoreList = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        saveLocalBranchInventories(firestoreList);
        return firestoreList;
      }
      const local = getLocalBranchInventories();
      return (branchId && branchId !== 'ALL') ? local.filter(b => b.branchId === branchId) : local;
    } catch (err) {
      console.warn("Firestore error fetching branch inventories:", err);
      const local = getLocalBranchInventories();
      return (branchId && branchId !== 'ALL') ? local.filter(b => b.branchId === branchId) : local;
    }
  }
  const local = getLocalBranchInventories();
  return (branchId && branchId !== 'ALL') ? local.filter(b => b.branchId === branchId) : local;
};

export const requestBranchInventory = async (data, currentUser) => {
  const newInventoryRequest = {
    branchId: currentUser?.branchId || data.branchId,
    branchName: currentUser?.branchName || data.branchName || 'Cabang',
    productId: data.productId,
    sku: data.sku,
    productName: data.productName,
    brand: data.brand || 'Generic',
    unit: 'Pcs',
    price: Number(data.price) || 0,
    minStock: Number(data.minStock) || 5,
    stockQuantity: Number(data.stockQuantity || data.currentStock) || 0,
    status: 'PENDING_APPROVAL', // 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
    requestedBy: currentUser?.name || currentUser?.email || 'Staff Cabang',
    requestedAt: new Date().toISOString()
  };

  let assignedId = `binv-${Date.now()}`;

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = await addDoc(collection(db, "branch_inventories"), {
        ...newInventoryRequest,
        createdAt: serverTimestamp()
      });
      assignedId = docRef.id;
    } catch (err) {
      console.warn("Firestore error creating branch inventory request:", err);
    }
  }

  const list = getLocalBranchInventories();
  const created = { id: assignedId, ...newInventoryRequest };
  list.unshift(created);
  saveLocalBranchInventories(list);

  // Trigger Notification to Admin & Staff Pusat
  await createNotification({
    type: 'INVENTORY_REQUEST',
    title: 'Pengajuan Inventaris Cabang Baru',
    message: `${newInventoryRequest.branchName} mengajukan inventaris produk "${newInventoryRequest.productName}" sebanyak ${newInventoryRequest.stockQuantity} Pcs.`,
    targetRole: 'ADMIN_AND_PUSAT',
    metaId: assignedId,
    branchId: newInventoryRequest.branchId,
    branchName: newInventoryRequest.branchName
  });

  return created;
};

export const approveBranchInventory = async (id, adminUser) => {
  const approvalData = {
    status: 'APPROVED',
    approvedBy: adminUser?.name || 'Administrator Pusat',
    approvedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, "branch_inventories", id);
      await updateDoc(docRef, approvalData);
    } catch (err) {
      console.warn("Firestore error approving inventory:", err);
    }
  }

  const list = getLocalBranchInventories();
  const idx = list.findIndex(item => item.id === id);
  let targetBranchId = 'ALL';
  let targetBranchName = 'Cabang';
  let productName = 'Produk';

  if (idx !== -1) {
    list[idx] = { ...list[idx], ...approvalData };
    targetBranchId = list[idx].branchId;
    targetBranchName = list[idx].branchName;
    productName = list[idx].productName;
    saveLocalBranchInventories(list);
  }

  // Send Notification to Branch Staff
  await createNotification({
    type: 'INVENTORY_APPROVED',
    title: 'Pengajuan Inventaris Disetujui! ✅',
    message: `Pengajuan inventaris produk "${productName}" untuk ${targetBranchName} telah DISETUJUI oleh Kantor Pusat. Stok kini aktif untuk penjualan.`,
    targetRole: 'STAFF_BRANCH',
    targetBranchId: targetBranchId,
    metaId: id
  });

  return { id, ...approvalData };
};

export const rejectBranchInventory = async (id, adminUser, reason = 'Kuantitas atau spesifikasi tidak sesuai verifikasi fisik.') => {
  const rejectionData = {
    status: 'REJECTED',
    rejectionReason: reason,
    rejectedBy: adminUser?.name || 'Administrator Pusat',
    rejectedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, "branch_inventories", id);
      await updateDoc(docRef, rejectionData);
    } catch (err) {
      console.warn("Firestore error rejecting inventory:", err);
    }
  }

  const list = getLocalBranchInventories();
  const idx = list.findIndex(item => item.id === id);
  let targetBranchId = 'ALL';
  let targetBranchName = 'Cabang';
  let productName = 'Produk';

  if (idx !== -1) {
    list[idx] = { ...list[idx], ...rejectionData };
    targetBranchId = list[idx].branchId;
    targetBranchName = list[idx].branchName;
    productName = list[idx].productName;
    saveLocalBranchInventories(list);
  }

  // Send Notification to Branch Staff
  await createNotification({
    type: 'INVENTORY_REJECTED',
    title: 'Pengajuan Inventaris Ditolak ⚠️',
    message: `Pengajuan inventaris "${productName}" untuk ${targetBranchName} DITOLAK oleh Pusat. Alasan: ${reason}`,
    targetRole: 'STAFF_BRANCH',
    targetBranchId: targetBranchId,
    metaId: id
  });

  return { id, ...rejectionData };
};

// ==========================================
// NOTIFICATION SYSTEM SERVICES
// ==========================================

export const fetchNotifications = async (currentUser) => {
  const notifs = getLocalNotifications();
  if (!currentUser) return [];

  // Filter based on role and branch
  return notifs.filter(n => {
    if (currentUser.role === 'ADMIN' || currentUser.role === 'STAFF_PUSAT') {
      return n.targetRole === 'ADMIN_AND_PUSAT' || n.targetRole === 'ALL';
    }
    if (currentUser.role === 'STAFF_BRANCH') {
      return (n.targetRole === 'STAFF_BRANCH' && (n.targetBranchId === currentUser.branchId || n.targetBranchId === 'ALL')) || n.targetRole === 'ALL';
    }
    return true;
  });
};

export const createNotification = async (notificationData) => {
  const newNotif = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...notificationData,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  const notifs = getLocalNotifications();
  notifs.unshift(newNotif);
  // Keep last 50 notifications
  saveLocalNotifications(notifs.slice(0, 50));
  return newNotif;
};

export const markNotificationAsRead = async (id) => {
  const notifs = getLocalNotifications();
  const idx = notifs.findIndex(n => n.id === id);
  if (idx !== -1) {
    notifs[idx].isRead = true;
    saveLocalNotifications(notifs);
  }
};

export const markAllNotificationsAsRead = async (currentUser) => {
  const notifs = getLocalNotifications();
  const updated = notifs.map(n => {
    if (currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF_PUSAT') {
      if (n.targetRole === 'ADMIN_AND_PUSAT' || n.targetRole === 'ALL') {
        return { ...n, isRead: true };
      }
    } else if (currentUser?.role === 'STAFF_BRANCH') {
      if ((n.targetRole === 'STAFF_BRANCH' && (n.targetBranchId === currentUser.branchId || n.targetBranchId === 'ALL')) || n.targetRole === 'ALL') {
        return { ...n, isRead: true };
      }
    }
    return n;
  });
  saveLocalNotifications(updated);
};

// ==========================================
// PUSAT TO BRANCH STOCK TRANSFER SERVICES
// ==========================================

export const fetchTransfers = async (branchId = null) => {
  if (isFirebaseConfigured() && db) {
    try {
      let q = query(collection(db, "stock_transfers"), orderBy("sentAt", "desc"));
      if (branchId && branchId !== 'ALL') {
        q = query(collection(db, "stock_transfers"), where("targetBranchId", "==", branchId), orderBy("sentAt", "desc"));
      }
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        saveLocalTransfers(list);
        return list;
      }
      const local = getLocalTransfers();
      return (branchId && branchId !== 'ALL') ? local.filter(t => t.targetBranchId === branchId) : local;
    } catch (err) {
      console.warn("Firestore error fetching transfers:", err);
      const local = getLocalTransfers();
      return (branchId && branchId !== 'ALL') ? local.filter(t => t.targetBranchId === branchId) : local;
    }
  }
  const local = getLocalTransfers();
  return (branchId && branchId !== 'ALL') ? local.filter(t => t.targetBranchId === branchId) : local;
};

export const createStockTransfer = async (transferData, currentUser) => {
  const newTransfer = {
    productId: transferData.productId,
    sku: transferData.sku,
    productName: transferData.productName,
    brand: transferData.brand || 'Generic',
    price: Number(transferData.price) || 0,
    qty: Number(transferData.qty) || 1,
    unit: 'Pcs',
    fromBranchId: 'ALL',
    fromBranchName: 'Gudang Pusat',
    targetBranchId: transferData.targetBranchId,
    targetBranchName: transferData.targetBranchName || 'Cabang',
    deliveryNote: transferData.deliveryNote || `SJ-HQ-${Date.now().toString().slice(-6)}`,
    status: 'IN_TRANSIT', // 'IN_TRANSIT' | 'RECEIVED'
    senderName: currentUser?.name || 'Staff Pusat',
    notes: transferData.notes || '',
    sentAt: new Date().toISOString()
  };

  let assignedId = `trf-${Date.now()}`;

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = await addDoc(collection(db, "stock_transfers"), {
        ...newTransfer,
        createdAt: serverTimestamp()
      });
      assignedId = docRef.id;
    } catch (err) {
      console.warn("Firestore error creating transfer:", err);
    }
  }

  const transfers = getLocalTransfers();
  const created = { id: assignedId, ...newTransfer };
  transfers.unshift(created);
  saveLocalTransfers(transfers);

  // Trigger Notification to Branch Staff
  await createNotification({
    type: 'STOCK_TRANSFER_INCOMING',
    title: 'Kiriman Stok Baru dari Kantor Pusat 🚚',
    message: `Pusat telah mengirim ${newTransfer.qty} Pcs "${newTransfer.productName}" (No. Surat Jalan: ${newTransfer.deliveryNote}). Silakan periksa barang fisik dan konfirmasi penerimaan di menu Barang Masuk.`,
    targetRole: 'STAFF_BRANCH',
    targetBranchId: newTransfer.targetBranchId,
    metaId: assignedId
  });

  return created;
};

export const confirmTransferReceipt = async (transferId, receiverUser, receiverNotes = '') => {
  const transfers = getLocalTransfers();
  const tIdx = transfers.findIndex(t => t.id === transferId);
  if (tIdx === -1) throw new Error("Data pengiriman tidak ditemukan.");

  const transfer = transfers[tIdx];
  if (transfer.status === 'RECEIVED') {
    throw new Error("Pengiriman ini sudah dikonfirmasi diterima sebelumnya.");
  }

  const updateData = {
    status: 'RECEIVED',
    receiverName: receiverUser?.name || 'Staff Cabang',
    receiverNotes: receiverNotes,
    receivedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, "stock_transfers", transferId);
      await updateDoc(docRef, updateData);
    } catch (err) {
      console.warn("Firestore error confirming transfer:", err);
    }
  }

  transfers[tIdx] = { ...transfers[tIdx], ...updateData };
  saveLocalTransfers(transfers);

  // Automatically update or insert into branch_inventories
  const branchInvs = getLocalBranchInventories();
  const bIdx = branchInvs.findIndex(bi => bi.branchId === transfer.targetBranchId && (bi.productId === transfer.productId || bi.sku === transfer.sku));
  
  if (bIdx !== -1) {
    const currentStock = Number(branchInvs[bIdx].stockQuantity) || 0;
    branchInvs[bIdx].stockQuantity = currentStock + Number(transfer.qty);
    branchInvs[bIdx].status = 'APPROVED';
    branchInvs[bIdx].updatedAt = new Date().toISOString();
  } else {
    branchInvs.unshift({
      id: `binv-${Date.now()}`,
      branchId: transfer.targetBranchId,
      branchName: transfer.targetBranchName,
      productId: transfer.productId,
      sku: transfer.sku,
      productName: transfer.productName,
      brand: transfer.brand || 'Generic',
      unit: 'Pcs',
      price: Number(transfer.price) || 0,
      minStock: 5,
      stockQuantity: Number(transfer.qty),
      status: 'APPROVED',
      requestedBy: 'Kantor Pusat (Transfer Otomatis)',
      requestedAt: transfer.sentAt,
      approvedBy: receiverUser?.name || 'Staff Cabang (Diterima)',
      approvedAt: new Date().toISOString()
    });
  }
  saveLocalBranchInventories(branchInvs);

  // Record Stock Movement IN for the branch
  const mov = await recordStockMovement({
    productId: transfer.productId,
    sku: transfer.sku,
    productName: transfer.productName,
    type: 'IN',
    qty: Number(transfer.qty),
    unit: 'Pcs',
    branchId: transfer.targetBranchId,
    branchName: transfer.targetBranchName,
    source: 'KANTOR_PUSAT',
    deliveryNote: transfer.deliveryNote,
    notes: `Penerimaan Kiriman dari Kantor Pusat (Pcs) • No. Surat Jalan: ${transfer.deliveryNote}${receiverNotes ? ` • Catatan: ${receiverNotes}` : ''}`,
    user: receiverUser?.name || 'Staff Cabang'
  });

  // Trigger Notification to Admin & Staff Pusat
  await createNotification({
    type: 'STOCK_TRANSFER_RECEIVED',
    title: 'Kiriman Diterima oleh Cabang ✅',
    message: `${transfer.targetBranchName} telah mengonfirmasi penerimaan ${transfer.qty} Pcs "${transfer.productName}" (No. Surat Jalan: ${transfer.deliveryNote}). Stok cabang kini telah aktif bertambah.`,
    targetRole: 'ADMIN_AND_PUSAT',
    metaId: transferId
  });

  return { transfer: transfers[tIdx], movement: mov };
};

// ==========================================
// BRANCH STOCK REQUEST SERVICES (CABANG -> PUSAT)
// ==========================================

export const fetchStockRequests = async (branchId = null) => {
  if (isFirebaseConfigured() && db) {
    try {
      let q = query(collection(db, "stock_requests"), orderBy("requestedAt", "desc"));
      if (branchId && branchId !== 'ALL') {
        q = query(collection(db, "stock_requests"), where("branchId", "==", branchId), orderBy("requestedAt", "desc"));
      }
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        saveLocalStockRequests(list);
        return list;
      }
      const local = getLocalStockRequests();
      return (branchId && branchId !== 'ALL') ? local.filter(r => r.branchId === branchId) : local;
    } catch (err) {
      console.warn("Firestore error fetching stock requests:", err);
      const local = getLocalStockRequests();
      return (branchId && branchId !== 'ALL') ? local.filter(r => r.branchId === branchId) : local;
    }
  }
  const local = getLocalStockRequests();
  return (branchId && branchId !== 'ALL') ? local.filter(r => r.branchId === branchId) : local;
};

export const createStockRequest = async (requestData, currentUser) => {
  const newReq = {
    productId: requestData.productId,
    sku: requestData.sku,
    productName: requestData.productName,
    brand: requestData.brand || 'Generic',
    qty: Number(requestData.qty) || 1,
    unit: 'Pcs',
    branchId: currentUser?.branchId || requestData.branchId,
    branchName: currentUser?.branchName || requestData.branchName || 'Cabang',
    requestedBy: currentUser?.name || 'Staff Cabang',
    notes: requestData.notes || '',
    status: 'PENDING', // 'PENDING' | 'FULFILLED' | 'CANCELLED'
    requestedAt: new Date().toISOString()
  };

  let assignedId = `req-${Date.now()}`;

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = await addDoc(collection(db, "stock_requests"), {
        ...newReq,
        createdAt: serverTimestamp()
      });
      assignedId = docRef.id;
    } catch (err) {
      console.warn("Firestore error creating stock request:", err);
    }
  }

  const requests = getLocalStockRequests();
  const created = { id: assignedId, ...newReq };
  requests.unshift(created);
  saveLocalStockRequests(requests);

  // Trigger Notification to Admin & Staff Pusat
  await createNotification({
    type: 'STOCK_REQUEST_SUBMITTED',
    title: 'Permintaan Kiriman Stok dari Cabang 📦',
    message: `${newReq.branchName} mengajukan permintaan ${newReq.qty} Pcs "${newReq.productName}". Catatan: ${newReq.notes || 'Mohon segera dikirimkan.'}`,
    targetRole: 'ADMIN_AND_PUSAT',
    metaId: assignedId
  });

  return created;
};

export const rejectStockRequest = async (requestId, reason, currentUser) => {
  const requests = getLocalStockRequests();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) {
    throw new Error("Permintaan stok tidak ditemukan.");
  }

  const req = requests[idx];
  req.status = 'REJECTED';
  req.rejectionReason = reason;
  req.rejectedBy = currentUser?.name || 'Staff Pusat';
  req.rejectedAt = new Date().toISOString();

  saveLocalStockRequests(requests);

  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, "stock_requests", requestId), {
        status: 'REJECTED',
        rejectionReason: reason,
        rejectedBy: currentUser?.name || 'Staff Pusat',
        rejectedAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Firestore reject stock request error:", e);
    }
  }

  // Trigger Notification to Branch
  await createNotification({
    type: 'STOCK_REQUEST_REJECTED',
    title: 'Permintaan Stok Ditolak oleh Pusat ❌',
    message: `Permintaan pengiriman ${req.qty} Pcs "${req.productName}" ditolak oleh Kantor Pusat. Alasan: "${reason}".`,
    targetRole: 'STAFF_BRANCH',
    targetBranchId: req.branchId,
    metaId: requestId
  });

  return req;
};

export const fulfillStockRequest = async (requestId, deliveryNote, currentUser) => {
  const requests = getLocalStockRequests();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) return null;

  const req = requests[idx];
  req.status = 'FULFILLED';
  req.fulfilledBy = currentUser?.name || 'Staff Pusat';
  req.fulfilledAt = new Date().toISOString();
  req.deliveryNote = deliveryNote;

  saveLocalStockRequests(requests);

  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, "stock_requests", requestId), {
        status: 'FULFILLED',
        fulfilledBy: currentUser?.name || 'Staff Pusat',
        fulfilledAt: serverTimestamp(),
        deliveryNote: deliveryNote
      });
    } catch (e) {
      console.warn("Firestore fulfill stock request error:", e);
    }
  }

  // Trigger Notification to Branch
  await createNotification({
    type: 'STOCK_REQUEST_APPROVED',
    title: 'Permintaan Stok Disetujui & Dikirimkan 🚚',
    message: `Kantor Pusat telah menyetujui permintaan dan mengirimkan ${req.qty} Pcs "${req.productName}" (No. Surat Jalan: ${deliveryNote}). Silakan periksa di menu Barang Masuk.`,
    targetRole: 'STAFF_BRANCH',
    targetBranchId: req.branchId,
    metaId: requestId
  });

  return req;
};

export const cancelStockRequest = async (requestId, user) => {
  const requests = getLocalStockRequests();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx !== -1) {
    requests[idx].status = 'CANCELLED';
    requests[idx].cancelledAt = new Date().toISOString();
    saveLocalStockRequests(requests);
  }
  return requests[idx];
};

// ==========================================
// INVENTORY & STOCK TRANSACTION SERVICES
// ==========================================

export const fetchTransactions = async () => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, "stock_movements"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firestoreTxs = snapshot.docs.map(docSnap => ({ 
          id: docSnap.id, 
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate ? docSnap.data().createdAt.toDate().toISOString() : docSnap.data().createdAt
        }));
        saveLocalTransactions(firestoreTxs);
        return firestoreTxs;
      }
      return getLocalTransactions();
    } catch (err) {
      console.warn("Firestore error, reading local transactions:", err);
      return getLocalTransactions();
    }
  }
  return getLocalTransactions();
};

export const recordStockMovement = async (movementData) => {
  const isIncrement = movementData.type === 'IN';
  const qtyChange = Number(movementData.qty) || 1;
  const isBundling = Boolean(movementData.isBundling && movementData.items && movementData.items.length > 0);
  
  const movement = {
    ...movementData,
    qty: qtyChange,
    createdAt: new Date().toISOString()
  };

  let assignedTxId = `mov-${Date.now()}`;

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = await addDoc(collection(db, "stock_movements"), {
        ...movement,
        createdAt: serverTimestamp()
      });
      assignedTxId = docRef.id;

      // Update product stock in Firestore
      if (isBundling) {
        for (const item of movementData.items) {
          if (item.productId) {
            const prodRef = doc(db, "products", item.productId);
            await updateDoc(prodRef, {
              currentStock: increment(-Number(item.qty || 1)),
              updatedAt: new Date().toISOString()
            });
          }
        }
      } else if (movement.productId) {
        const prodRef = doc(db, "products", movement.productId);
        await updateDoc(prodRef, {
          currentStock: increment(isIncrement ? qtyChange : -qtyChange),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn("Firestore error recording stock movement:", err);
    }
  }

  // Update local product stock
  const products = getLocalProducts();
  if (isBundling) {
    for (const item of movementData.items) {
      const prodIndex = products.findIndex(p => p.id === item.productId || p.sku === item.sku);
      if (prodIndex !== -1) {
        const current = Number(products[prodIndex].currentStock) || 0;
        products[prodIndex].currentStock = Math.max(0, current - Number(item.qty || 1));
        products[prodIndex].updatedAt = new Date().toISOString();
      }
    }
    saveLocalProducts(products);
  } else {
    const prodIndex = products.findIndex(p => p.id === movement.productId || p.sku === movement.sku);
    if (prodIndex !== -1) {
      const current = Number(products[prodIndex].currentStock) || 0;
      products[prodIndex].currentStock = isIncrement ? current + qtyChange : Math.max(0, current - qtyChange);
      products[prodIndex].updatedAt = new Date().toISOString();
      saveLocalProducts(products);
    }
  }

  // ALSO Sync to Branch Inventories if this movement belongs to a branch
  const branchInvs = getLocalBranchInventories();
  if (movementData.branchId && movementData.branchId !== 'ALL') {
    if (isBundling) {
      for (const item of movementData.items) {
        const bIdx = branchInvs.findIndex(bi => bi.branchId === movementData.branchId && (bi.productId === item.productId || bi.sku === item.sku));
        if (bIdx !== -1 && branchInvs[bIdx].status === 'APPROVED') {
          const bStock = Number(branchInvs[bIdx].stockQuantity) || 0;
          branchInvs[bIdx].stockQuantity = Math.max(0, bStock - Number(item.qty || 1));
        }
      }
    } else {
      const bIdx = branchInvs.findIndex(bi => bi.branchId === movementData.branchId && (bi.productId === movementData.productId || bi.sku === movementData.sku));
      if (bIdx !== -1 && branchInvs[bIdx].status === 'APPROVED') {
        const bStock = Number(branchInvs[bIdx].stockQuantity) || 0;
        branchInvs[bIdx].stockQuantity = isIncrement ? bStock + qtyChange : Math.max(0, bStock - qtyChange);
      }
    }
    saveLocalBranchInventories(branchInvs);
  }

  const txs = getLocalTransactions();
  const newTx = { id: assignedTxId, ...movement };
  txs.unshift(newTx);
  saveLocalTransactions(txs);

  return newTx;
};

// ==========================================
// BRANCH / CABANG SERVICES (REAL DATA)
// ==========================================

export const fetchBranches = async () => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, "branches"), orderBy("name", "asc"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firestoreBranches = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        saveLocalBranches(firestoreBranches);
        return firestoreBranches;
      }
      return getLocalBranches();
    } catch (err) {
      console.warn("Firestore error, reading local branches:", err);
      return getLocalBranches();
    }
  }
  return getLocalBranches();
};

export const createBranch = async (branchData) => {
  const newBranch = {
    ...branchData,
    code: branchData.code || `BR-${Math.floor(100 + Math.random() * 900)}`,
    status: branchData.status || "ACTIVE",
    createdAt: new Date().toISOString()
  };

  let assignedId = `branch-${Date.now()}`;

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = await addDoc(collection(db, "branches"), {
        ...newBranch,
        createdAt: serverTimestamp()
      });
      assignedId = docRef.id;
    } catch (err) {
      console.warn("Firestore error creating branch:", err);
    }
  }

  const branches = getLocalBranches();
  const created = { id: assignedId, ...newBranch };
  branches.push(created);
  saveLocalBranches(branches);
  return created;
};

export const updateBranch = async (id, branchData) => {
  const updatedData = {
    ...branchData,
    updatedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, "branches", id);
      await updateDoc(docRef, updatedData);
    } catch (err) {
      console.warn("Firestore error updating branch:", err);
    }
  }

  const branches = getLocalBranches();
  const idx = branches.findIndex(b => b.id === id);
  if (idx !== -1) {
    branches[idx] = { ...branches[idx], ...updatedData };
    saveLocalBranches(branches);
  }
  return { id, ...updatedData };
};

export const deleteBranch = async (id) => {
  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, "branches", id));
    } catch (err) {
      console.warn("Firestore error deleting branch:", err);
    }
  }
  const branches = getLocalBranches().filter(b => b.id !== id);
  saveLocalBranches(branches);
};

// ==========================================
// USER / PENGGUNA SERVICES (REAL DATA)
// ==========================================

export const fetchUsers = async () => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, "users"), orderBy("name", "asc"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firestoreUsers = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        saveLocalUsers(firestoreUsers);
        return firestoreUsers;
      }
      return getLocalUsers();
    } catch (err) {
      console.warn("Firestore error, reading local users:", err);
      return getLocalUsers();
    }
  }
  return getLocalUsers();
};

export const createUser = async (userData) => {
  const newUser = {
    ...userData,
    role: userData.role || "STAFF_BRANCH",
    branchId: userData.branchId || "ALL",
    branchName: userData.branchName || "Semua Cabang (Pusat)",
    status: userData.status || "ACTIVE",
    createdAt: new Date().toISOString()
  };

  let assignedId = `usr-${Date.now()}`;

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = await addDoc(collection(db, "users"), {
        ...newUser,
        createdAt: serverTimestamp()
      });
      assignedId = docRef.id;
    } catch (err) {
      console.warn("Firestore error creating user:", err);
    }
  }

  const users = getLocalUsers();
  const created = { id: assignedId, ...newUser };
  users.push(created);
  saveLocalUsers(users);
  return created;
};

export const updateUser = async (id, userData) => {
  const updatedData = {
    ...userData,
    updatedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, "users", id);
      await updateDoc(docRef, updatedData);
    } catch (err) {
      console.warn("Firestore error updating user:", err);
    }
  }

  const users = getLocalUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updatedData };
    saveLocalUsers(users);
  }
  return { id, ...updatedData };
};

export const deleteUser = async (id) => {
  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, "users", id));
    } catch (err) {
      console.warn("Firestore error deleting user:", err);
    }
  }
  const users = getLocalUsers().filter(u => u.id !== id);
  saveLocalUsers(users);
};

export const exportToCSV = (data, filename = "wms-export.csv") => {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(","));

  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + (row[header] ?? '')).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
