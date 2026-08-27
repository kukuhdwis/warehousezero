import { db, isFirebaseConfigured } from "./firebase";
import { 
  collection, 
  getDocs, 
  getDoc,
  setDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  limit,
  serverTimestamp,
  increment,
  where 
} from "firebase/firestore";

// Helper to throw explicit error if Firebase is not active
const ensureFirebase = () => {
  if (!isFirebaseConfigured() || !db) {
    throw new Error("Koneksi Firebase Firestore belum terkonfigurasi. Silakan periksa file .env.");
  }
};

// Helper to check if initial database bootstrapping has already been executed
const isBootstrapInitialized = async () => {
  try {
    const metaRef = doc(db, "system_metadata", "bootstrap");
    const metaSnap = await getDoc(metaRef);
    return metaSnap.exists() && metaSnap.data()?.initialized === true;
  } catch (e) {
    return false;
  }
};

// Helper to mark system bootstrapping as completed
const markBootstrapDone = async () => {
  try {
    const metaRef = doc(db, "system_metadata", "bootstrap");
    await setDoc(metaRef, { 
      initialized: true, 
      bootstrappedAt: serverTimestamp() 
    }, { merge: true });
  } catch (e) {
    console.warn("Gagal mencatat status bootstrap:", e);
  }
};

// ==========================================
// DEFAULT SEED DATA FOR INITIAL BOOTSTRAP ONLY
// ==========================================

export const DEFAULT_BRANDS = [
  { name: "NDK Packaging", createdAt: new Date().toISOString() },
  { name: "Generic / Polos", createdAt: new Date().toISOString() }
];

export const DEFAULT_MACHINE_CATEGORIES = [
  { name: "Universal / Semua Mesin", createdAt: new Date().toISOString() },
  { name: "Mesin Offset", createdAt: new Date().toISOString() },
  { name: "Mesin Digital Printing", createdAt: new Date().toISOString() },
  { name: "Mesin Flexography (Flexo)", createdAt: new Date().toISOString() },
  { name: "Mesin Rotogravure", createdAt: new Date().toISOString() },
  { name: "Mesin Die Cut & Finishing", createdAt: new Date().toISOString() },
  { name: "Mesin Laminating & Coating", createdAt: new Date().toISOString() },
  { name: "Mesin Packaging & Binding", createdAt: new Date().toISOString() }
];

export const DEFAULT_ROOT_ADMIN = {
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

export const DEFAULT_STAFF_PUSAT = {
  name: "Staff Gudang Pusat",
  email: "staffpusat@perusahaan.com",
  password: "staff",
  role: "STAFF_PUSAT",
  branchId: "branch-pusat-hq",
  branchName: "Gudang Utama Pusat",
  phone: "0812-3456-7890",
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

export const DEFAULT_STAFF_JAKARTA = {
  name: "Staff Cabang Jakarta",
  email: "jakarta@perusahaan.com",
  password: "staff",
  role: "STAFF_BRANCH",
  branchId: "branch-jakarta-1",
  branchName: "Gudang Cabang Jakarta",
  phone: "0812-9999-8888",
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

export const INITIAL_DEFAULT_USERS = [DEFAULT_ROOT_ADMIN, DEFAULT_STAFF_PUSAT, DEFAULT_STAFF_JAKARTA];

// Single Protected Gudang Utama Pusat
export const DEFAULT_GUDANG_PUSAT = {
  name: "Gudang Utama Pusat",
  code: "GUDANG-PUSAT",
  address: "Jl. Raya Utama Pusat No. 1, Jakarta Pusat",
  managerName: "Staff Gudang Pusat",
  pic: "Staff Gudang Pusat",
  phone: "0811-0000-0000",
  status: "ACTIVE",
  isPusat: true,
  isProtected: true,
  createdAt: new Date().toISOString()
};

export const DEFAULT_INITIAL_BRANCHES = [
  DEFAULT_GUDANG_PUSAT,
  {
    name: "Gudang Cabang Jakarta",
    code: "BR-JKT",
    address: "Jl. Sudirman No. 10, Jakarta Pusat",
    managerName: "Budi Santoso",
    pic: "Budi Santoso",
    phone: "0812-1111-2222",
    status: "ACTIVE",
    isPusat: false,
    createdAt: new Date().toISOString()
  },
  {
    name: "Gudang Cabang Surabaya",
    code: "BR-SBY",
    address: "Jl. Pemuda No. 45, Surabaya",
    managerName: "Siti Rahma",
    pic: "Siti Rahma",
    phone: "0813-3333-4444",
    status: "ACTIVE",
    isPusat: false,
    createdAt: new Date().toISOString()
  }
];

// ==========================================
// BRAND / MERK SERVICES (FIRESTORE)
// ==========================================

export const fetchBrands = async () => {
  ensureFirebase();
  try {
    const q = query(collection(db, "brands"), orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    }
    
    const isDone = await isBootstrapInitialized();
    if (isDone) {
      return [];
    }

    const seededBrands = [];
    for (const b of DEFAULT_BRANDS) {
      const docRef = await addDoc(collection(db, "brands"), {
        ...b,
        createdAt: serverTimestamp()
      });
      seededBrands.push({ id: docRef.id, ...b });
    }
    await markBootstrapDone();
    return seededBrands;
  } catch (err) {
    console.error("Firestore error fetching brands:", err);
    throw new Error(`Gagal mengambil data Brand dari Firestore: ${err.message}`);
  }
};

export const createBrand = async (brandData) => {
  ensureFirebase();
  const brandName = (typeof brandData === 'string' ? brandData : brandData.name || '').trim();
  if (!brandName) throw new Error("Nama merk tidak boleh kosong.");

  const newBrand = {
    name: brandName,
    createdAt: new Date().toISOString()
  };

  try {
    const docRef = await addDoc(collection(db, "brands"), {
      ...newBrand,
      createdAt: serverTimestamp()
    });
    await markBootstrapDone();
    return { id: docRef.id, ...newBrand };
  } catch (err) {
    console.error("Firestore error creating brand:", err);
    throw new Error(`Gagal menambah Brand ke Firestore: ${err.message}`);
  }
};

export const deleteBrand = async (brandIdOrName) => {
  ensureFirebase();
  if (!brandIdOrName) return false;

  try {
    const brandsSnapshot = await getDocs(collection(db, "brands"));
    for (const docSnap of brandsSnapshot.docs) {
      if (docSnap.id === brandIdOrName || docSnap.data().name?.toLowerCase() === brandIdOrName.toLowerCase()) {
        await deleteDoc(doc(db, "brands", docSnap.id));
      }
    }
    await markBootstrapDone();
    return true;
  } catch (err) {
    console.error("Firestore error deleting brand:", err);
    throw new Error(`Gagal menghapus Brand dari Firestore: ${err.message}`);
  }
};

// ==========================================
// MACHINE CATEGORY SERVICES (FIRESTORE)
// ==========================================

export const fetchMachineCategories = async () => {
  ensureFirebase();
  try {
    const q = query(collection(db, "machine_categories"), orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    }
    
    const isDone = await isBootstrapInitialized();
    if (isDone) {
      return [];
    }

    const seededCategories = [];
    for (const c of DEFAULT_MACHINE_CATEGORIES) {
      const docRef = await addDoc(collection(db, "machine_categories"), {
        ...c,
        createdAt: serverTimestamp()
      });
      seededCategories.push({ id: docRef.id, ...c });
    }
    await markBootstrapDone();
    return seededCategories;
  } catch (err) {
    console.error("Firestore error fetching machine categories:", err);
    throw new Error(`Gagal mengambil data Kategori Mesin dari Firestore: ${err.message}`);
  }
};

export const createMachineCategory = async (catData) => {
  ensureFirebase();
  const catName = (typeof catData === 'string' ? catData : catData.name || '').trim();
  if (!catName) throw new Error("Nama kategori mesin tidak boleh kosong.");

  const newCat = {
    name: catName,
    createdAt: new Date().toISOString()
  };

  try {
    const docRef = await addDoc(collection(db, "machine_categories"), {
      ...newCat,
      createdAt: serverTimestamp()
    });
    await markBootstrapDone();
    return { id: docRef.id, ...newCat };
  } catch (err) {
    console.error("Firestore error creating machine category:", err);
    throw new Error(`Gagal menambah Kategori Mesin ke Firestore: ${err.message}`);
  }
};

export const deleteMachineCategory = async (catIdOrName) => {
  ensureFirebase();
  if (!catIdOrName) return false;

  try {
    const snapshot = await getDocs(collection(db, "machine_categories"));
    for (const docSnap of snapshot.docs) {
      if (docSnap.id === catIdOrName || docSnap.data().name?.toLowerCase() === catIdOrName.toLowerCase()) {
        await deleteDoc(doc(db, "machine_categories", docSnap.id));
      }
    }
    await markBootstrapDone();
    return true;
  } catch (err) {
    console.error("Firestore error deleting machine category:", err);
    throw new Error(`Gagal menghapus Kategori Mesin dari Firestore: ${err.message}`);
  }
};

// ==========================================
// PRODUCT SERVICES (FIRESTORE)
// ==========================================

export const fetchProducts = async () => {
  ensureFirebase();
  try {
    const q = query(collection(db, "products"), orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (err) {
    console.error("Firestore error fetching products:", err);
    throw new Error(`Gagal mengambil data Produk dari Firestore: ${err.message}`);
  }
};

export const createProduct = async (productData) => {
  ensureFirebase();
  const newProd = {
    ...productData,
    price: Number(productData.price) || 0,
    minStock: Number(productData.minStock) || 0,
    currentStock: Number(productData.currentStock) || 0,
    machineCategory: productData.machineCategory || productData.kategoriMesin || 'Universal / Semua Mesin',
    barcode: productData.barcode || productData.sku,
    unit: 'Pcs',
    branchId: 'ALL',
    branchName: 'Semua Cabang (Pusat)',
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = await addDoc(collection(db, "products"), {
      ...newProd,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...newProd };
  } catch (err) {
    console.error("Firestore error creating product:", err);
    throw new Error(`Gagal membuat Produk baru di Firestore: ${err.message}`);
  }
};

export const updateProduct = async (id, productData) => {
  ensureFirebase();
  const updatedData = {
    ...productData,
    price: Number(productData.price) || 0,
    minStock: Number(productData.minStock) || 0,
    currentStock: Number(productData.currentStock) || 0,
    machineCategory: productData.machineCategory || productData.kategoriMesin || 'Universal / Semua Mesin',
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, "products", id);
    await updateDoc(docRef, updatedData);
    return { id, ...updatedData };
  } catch (err) {
    console.error("Firestore error updating product:", err);
    throw new Error(`Gagal memperbarui Produk di Firestore: ${err.message}`);
  }
};

export const deleteProduct = async (id) => {
  ensureFirebase();
  try {
    await deleteDoc(doc(db, "products", id));
    return true;
  } catch (err) {
    console.error("Firestore error deleting product:", err);
    throw new Error(`Gagal menghapus Produk dari Firestore: ${err.message}`);
  }
};

// ==========================================
// BRANCH INVENTORIES (FIRESTORE)
// ==========================================

export const fetchBranchInventories = async (branchId = null) => {
  ensureFirebase();
  try {
    let q = collection(db, "branch_inventories");
    if (branchId && branchId !== 'ALL') {
      q = query(collection(db, "branch_inventories"), where("branchId", "==", branchId));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (err) {
    console.error("Firestore error fetching branch inventories:", err);
    throw new Error(`Gagal mengambil data Inventaris Cabang dari Firestore: ${err.message}`);
  }
};

export const requestBranchInventory = async (data, currentUser) => {
  ensureFirebase();
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
    status: 'PENDING_APPROVAL',
    requestedBy: currentUser?.name || currentUser?.email || 'Staff Cabang',
    requestedAt: new Date().toISOString()
  };

  try {
    const docRef = await addDoc(collection(db, "branch_inventories"), {
      ...newInventoryRequest,
      createdAt: serverTimestamp()
    });
    const created = { id: docRef.id, ...newInventoryRequest };

    await createNotification({
      type: 'INVENTORY_REQUEST',
      title: 'Pengajuan Inventaris Cabang Baru',
      message: `${newInventoryRequest.branchName} mengajukan inventaris produk "${newInventoryRequest.productName}" sebanyak ${newInventoryRequest.stockQuantity} Pcs.`,
      targetRole: 'ADMIN_AND_PUSAT',
      metaId: docRef.id,
      branchId: newInventoryRequest.branchId,
      branchName: newInventoryRequest.branchName
    });

    return created;
  } catch (err) {
    console.error("Firestore error creating branch inventory request:", err);
    throw new Error(`Gagal mengajukan inventaris ke Firestore: ${err.message}`);
  }
};

export const approveBranchInventory = async (id, adminUser) => {
  ensureFirebase();
  const approvalData = {
    status: 'APPROVED',
    approvedBy: adminUser?.name || 'Administrator Pusat',
    approvedAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, "branch_inventories", id);
    await updateDoc(docRef, approvalData);

    await createNotification({
      type: 'INVENTORY_APPROVED',
      title: 'Pengajuan Inventaris Disetujui! ✅',
      message: `Pengajuan inventaris untuk cabang telah DISETUJUI oleh Kantor Pusat.`,
      targetRole: 'STAFF_BRANCH',
      targetBranchId: 'ALL',
      metaId: id
    });

    return { id, ...approvalData };
  } catch (err) {
    console.error("Firestore error approving inventory:", err);
    throw new Error(`Gagal menyetujui inventaris di Firestore: ${err.message}`);
  }
};

export const rejectBranchInventory = async (id, adminUser, reason = 'Kuantitas atau spesifikasi tidak sesuai verifikasi fisik.') => {
  ensureFirebase();
  const rejectionData = {
    status: 'REJECTED',
    rejectionReason: reason,
    rejectedBy: adminUser?.name || 'Administrator Pusat',
    rejectedAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, "branch_inventories", id);
    await updateDoc(docRef, rejectionData);

    await createNotification({
      type: 'INVENTORY_REJECTED',
      title: 'Pengajuan Inventaris Ditolak ⚠️',
      message: `Pengajuan inventaris DITOLAK oleh Pusat. Alasan: ${reason}`,
      targetRole: 'STAFF_BRANCH',
      targetBranchId: 'ALL',
      metaId: id
    });

    return { id, ...rejectionData };
  } catch (err) {
    console.error("Firestore error rejecting inventory:", err);
    throw new Error(`Gagal menolak inventaris di Firestore: ${err.message}`);
  }
};

export const updateBranchInventory = async (id, updateData) => {
  ensureFirebase();
  try {
    const docRef = doc(db, "branch_inventories", id);
    const payload = {
      ...updateData,
      stockQuantity: Number(updateData.stockQuantity) || 0,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(docRef, payload);
    return { id, ...payload };
  } catch (err) {
    console.error("Firestore error updating branch inventory:", err);
    throw new Error(`Gagal memperbarui Inventaris Cabang di Firestore: ${err.message}`);
  }
};


// ==========================================
// NOTIFICATION SYSTEM SERVICES (FIRESTORE)
// ==========================================

export const fetchNotifications = async (currentUser) => {
  ensureFirebase();
  if (!currentUser) return [];

  try {
    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(50));
    const snapshot = await getDocs(q);
    const notifs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

    return notifs.filter(n => {
      if (currentUser.role === 'ADMIN' || currentUser.role === 'STAFF_PUSAT') {
        return n.targetRole === 'ADMIN_AND_PUSAT' || n.targetRole === 'ALL';
      }
      if (currentUser.role === 'STAFF_BRANCH') {
        return (n.targetRole === 'STAFF_BRANCH' && (n.targetBranchId === currentUser.branchId || n.targetBranchId === 'ALL')) || n.targetRole === 'ALL';
      }
      return true;
    });
  } catch (err) {
    console.error("Firestore error fetching notifications:", err);
    return [];
  }
};

export const createNotification = async (notificationData) => {
  ensureFirebase();
  const newNotif = {
    ...notificationData,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  try {
    const docRef = await addDoc(collection(db, "notifications"), {
      ...newNotif,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...newNotif };
  } catch (err) {
    console.error("Firestore error creating notification:", err);
    return { id: `notif-${Date.now()}`, ...newNotif };
  }
};

export const markNotificationAsRead = async (id) => {
  ensureFirebase();
  try {
    const docRef = doc(db, "notifications", id);
    await updateDoc(docRef, { isRead: true });
  } catch (err) {
    console.error("Firestore error marking notification as read:", err);
  }
};

export const markAllNotificationsAsRead = async (currentUser) => {
  ensureFirebase();
  try {
    const notifs = await fetchNotifications(currentUser);
    for (const n of notifs) {
      if (!n.isRead) {
        const docRef = doc(db, "notifications", n.id);
        await updateDoc(docRef, { isRead: true });
      }
    }
  } catch (err) {
    console.error("Firestore error marking all notifications as read:", err);
  }
};

// ==========================================
// STOCK TRANSFERS (FIRESTORE)
// ==========================================

export const fetchTransfers = async (branchId = null) => {
  ensureFirebase();
  try {
    let q = query(collection(db, "stock_transfers"), orderBy("sentAt", "desc"));
    if (branchId && branchId !== 'ALL') {
      q = query(collection(db, "stock_transfers"), where("targetBranchId", "==", branchId), orderBy("sentAt", "desc"));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (err) {
    console.error("Firestore error fetching transfers:", err);
    throw new Error(`Gagal mengambil data Transfer Stok dari Firestore: ${err.message}`);
  }
};

export const createStockTransfer = async (transferData, currentUser) => {
  ensureFirebase();
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
    status: 'IN_TRANSIT',
    senderName: currentUser?.name || 'Staff Pusat',
    notes: transferData.notes || '',
    sentAt: new Date().toISOString()
  };

  try {
    const docRef = await addDoc(collection(db, "stock_transfers"), {
      ...newTransfer,
      createdAt: serverTimestamp()
    });

    const created = { id: docRef.id, ...newTransfer };

    await createNotification({
      type: 'STOCK_TRANSFER_INCOMING',
      title: 'Kiriman Stok Baru dari Kantor Pusat 🚚',
      message: `Pusat telah mengirim ${newTransfer.qty} Pcs "${newTransfer.productName}" (No. Surat Jalan: ${newTransfer.deliveryNote}).`,
      targetRole: 'STAFF_BRANCH',
      targetBranchId: newTransfer.targetBranchId,
      metaId: docRef.id
    });

    return created;
  } catch (err) {
    console.error("Firestore error creating transfer:", err);
    throw new Error(`Gagal membuat Transfer Stok di Firestore: ${err.message}`);
  }
};

export const confirmTransferReceipt = async (transferId, receiverUser, receiverNotes = '') => {
  ensureFirebase();
  const updateData = {
    status: 'RECEIVED',
    receiverName: receiverUser?.name || 'Staff Cabang',
    receiverNotes: receiverNotes,
    receivedAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, "stock_transfers", transferId);
    await updateDoc(docRef, updateData);

    const mov = await recordStockMovement({
      productId: 'TRANSFER_PROD',
      sku: 'TRANSFER_SKU',
      productName: 'Penerimaan Transfer',
      type: 'IN',
      qty: 1,
      unit: 'Pcs',
      branchId: receiverUser?.branchId || 'CABANG',
      branchName: receiverUser?.branchName || 'Cabang',
      source: 'KANTOR_PUSAT',
      notes: `Konfirmasi Penerimaan Transfer • ${receiverNotes}`,
      user: receiverUser?.name || 'Staff Cabang'
    });

    await createNotification({
      type: 'STOCK_TRANSFER_RECEIVED',
      title: 'Kiriman Diterima oleh Cabang ✅',
      message: `Cabang telah mengonfirmasi penerimaan transfer stok.`,
      targetRole: 'ADMIN_AND_PUSAT',
      metaId: transferId
    });

    return { id: transferId, ...updateData, movement: mov };
  } catch (err) {
    console.error("Firestore error confirming transfer:", err);
    throw new Error(`Gagal mengonfirmasi penerimaan transfer di Firestore: ${err.message}`);
  }
};

// ==========================================
// STOCK REQUESTS (FIRESTORE)
// ==========================================

export const fetchStockRequests = async (branchId = null) => {
  ensureFirebase();
  try {
    let q = query(collection(db, "stock_requests"), orderBy("requestedAt", "desc"));
    if (branchId && branchId !== 'ALL') {
      q = query(collection(db, "stock_requests"), where("branchId", "==", branchId), orderBy("requestedAt", "desc"));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (err) {
    console.error("Firestore error fetching stock requests:", err);
    throw new Error(`Gagal mengambil data Permintaan Stok dari Firestore: ${err.message}`);
  }
};

export const createStockRequest = async (requestData, currentUser) => {
  ensureFirebase();
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
    status: 'PENDING',
    requestedAt: new Date().toISOString()
  };

  try {
    const docRef = await addDoc(collection(db, "stock_requests"), {
      ...newReq,
      createdAt: serverTimestamp()
    });

    const created = { id: docRef.id, ...newReq };

    await createNotification({
      type: 'STOCK_REQUEST_SUBMITTED',
      title: 'Permintaan Kiriman Stok dari Cabang 📦',
      message: `${newReq.branchName} mengajukan permintaan ${newReq.qty} Pcs "${newReq.productName}".`,
      targetRole: 'ADMIN_AND_PUSAT',
      metaId: docRef.id
    });

    return created;
  } catch (err) {
    console.error("Firestore error creating stock request:", err);
    throw new Error(`Gagal membuat Permintaan Stok di Firestore: ${err.message}`);
  }
};

export const rejectStockRequest = async (requestId, reason, currentUser) => {
  ensureFirebase();
  try {
    const updateData = {
      status: 'REJECTED',
      rejectionReason: reason,
      rejectedBy: currentUser?.name || 'Staff Pusat',
      rejectedAt: new Date().toISOString()
    };
    await updateDoc(doc(db, "stock_requests", requestId), updateData);

    await createNotification({
      type: 'STOCK_REQUEST_REJECTED',
      title: 'Permintaan Stok Ditolak oleh Pusat ❌',
      message: `Permintaan pengiriman ditolak oleh Kantor Pusat. Alasan: "${reason}".`,
      targetRole: 'STAFF_BRANCH',
      metaId: requestId
    });

    return { id: requestId, ...updateData };
  } catch (err) {
    console.error("Firestore error rejecting stock request:", err);
    throw new Error(`Gagal menolak Permintaan Stok di Firestore: ${err.message}`);
  }
};

export const fulfillStockRequest = async (requestId, deliveryNote, currentUser) => {
  ensureFirebase();
  try {
    const updateData = {
      status: 'FULFILLED',
      fulfilledBy: currentUser?.name || 'Staff Pusat',
      fulfilledAt: new Date().toISOString(),
      deliveryNote: deliveryNote
    };
    await updateDoc(doc(db, "stock_requests", requestId), updateData);

    await createNotification({
      type: 'STOCK_REQUEST_APPROVED',
      title: 'Permintaan Stok Disetujui & Dikirimkan 🚚',
      message: `Kantor Pusat telah menyetujui permintaan dan mengirimkan stok (No. Surat Jalan: ${deliveryNote}).`,
      targetRole: 'STAFF_BRANCH',
      metaId: requestId
    });

    return { id: requestId, ...updateData };
  } catch (err) {
    console.error("Firestore error fulfilling stock request:", err);
    throw new Error(`Gagal menyetujui Permintaan Stok di Firestore: ${err.message}`);
  }
};

export const cancelStockRequest = async (requestId, user) => {
  ensureFirebase();
  try {
    const docRef = doc(db, "stock_requests", requestId);
    await updateDoc(docRef, {
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString()
    });
    return { id: requestId, status: 'CANCELLED' };
  } catch (err) {
    console.error("Firestore error cancelling stock request:", err);
    throw new Error(`Gagal membatalkan Permintaan Stok di Firestore: ${err.message}`);
  }
};

// ==========================================
// STOCK TRANSACTIONS (FIRESTORE)
// ==========================================

export const fetchTransactions = async () => {
  ensureFirebase();
  try {
    const q = query(collection(db, "stock_movements"), orderBy("createdAt", "desc"), limit(100));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ 
      id: docSnap.id, 
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate ? docSnap.data().createdAt.toDate().toISOString() : docSnap.data().createdAt
    }));
  } catch (err) {
    console.error("Firestore error fetching transactions:", err);
    throw new Error(`Gagal mengambil data Transaksi Stok dari Firestore: ${err.message}`);
  }
};

export const recordStockMovement = async (movementData) => {
  ensureFirebase();
  const isIncrement = movementData.type === 'IN';
  const qtyChange = Number(movementData.qty) || 1;
  const isBundling = Boolean(movementData.isBundling && movementData.items && movementData.items.length > 0);
  
  const movement = {
    ...movementData,
    qty: qtyChange,
    createdAt: new Date().toISOString()
  };

  try {
    const docRef = await addDoc(collection(db, "stock_movements"), {
      ...movement,
      createdAt: serverTimestamp()
    });

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

    return { id: docRef.id, ...movement };
  } catch (err) {
    console.error("Firestore error recording stock movement:", err);
    throw new Error(`Gagal mencatat mutasi stok di Firestore: ${err.message}`);
  }
};

// ==========================================
// BRANCH MANAGEMENT SERVICES (FIRESTORE)
// ==========================================

export const fetchBranches = async () => {
  ensureFirebase();
  try {
    const q = query(collection(db, "branches"), orderBy("name", "asc"));
    const snapshot = await getDocs(q);

    let branchesList = [];

    if (!snapshot.empty) {
      branchesList = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    } else {
      const isDone = await isBootstrapInitialized();
      if (!isDone) {
        for (const branch of DEFAULT_INITIAL_BRANCHES) {
          const docRef = await addDoc(collection(db, "branches"), {
            ...branch,
            createdAt: serverTimestamp()
          });
          branchesList.push({ id: docRef.id, ...branch });
        }
        await markBootstrapDone();
      }
    }

    // Ensure Gudang Utama Pusat ALWAYS exists as master system location (Singleton)
    const hasPusat = branchesList.some(b => b.isPusat === true || b.code === 'GUDANG-PUSAT' || (b.name || '').toLowerCase().includes('gudang utama pusat'));
    if (!hasPusat) {
      const docRef = await addDoc(collection(db, "branches"), {
        ...DEFAULT_GUDANG_PUSAT,
        createdAt: serverTimestamp()
      });
      const pusatBranch = { id: docRef.id, ...DEFAULT_GUDANG_PUSAT };
      branchesList.unshift(pusatBranch);
    }

    return branchesList;
  } catch (err) {
    console.error("Firestore error fetching branches:", err);
    throw new Error(`Gagal mengambil data Cabang dari Firestore: ${err.message}`);
  }
};

export const createBranch = async (branchData) => {
  ensureFirebase();
  const isPusatChoice = Boolean(branchData.isPusat) || branchData.code === 'GUDANG-PUSAT';
  
  if (isPusatChoice) {
    const snapshot = await getDocs(collection(db, "branches"));
    const existingPusat = snapshot.docs.some(docSnap => docSnap.data().isPusat === true || docSnap.data().code === 'GUDANG-PUSAT');
    if (existingPusat) {
      throw new Error("Gudang Utama Pusat sudah terdaftar. Hanya boleh ada 1 Gudang Utama Pusat di dalam sistem.");
    }
  }

  const newBranch = {
    ...branchData,
    code: isPusatChoice ? "GUDANG-PUSAT" : (branchData.code || `BR-${Math.floor(100 + Math.random() * 900)}`),
    status: branchData.status || "ACTIVE",
    isPusat: isPusatChoice,
    isProtected: isPusatChoice,
    createdAt: new Date().toISOString()
  };

  try {
    const docRef = await addDoc(collection(db, "branches"), {
      ...newBranch,
      createdAt: serverTimestamp()
    });
    await markBootstrapDone();
    return { id: docRef.id, ...newBranch };
  } catch (err) {
    console.error("Firestore error creating branch:", err);
    throw new Error(`Gagal membuat Cabang baru di Firestore: ${err.message}`);
  }
};

export const updateBranch = async (id, branchData) => {
  ensureFirebase();
  const updatedData = {
    ...branchData,
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, "branches", id);
    await updateDoc(docRef, updatedData);
    return { id, ...updatedData };
  } catch (err) {
    console.error("Firestore error updating branch:", err);
    throw new Error(`Gagal memperbarui Cabang di Firestore: ${err.message}`);
  }
};

export const deleteBranch = async (id) => {
  ensureFirebase();
  try {
    const docRef = doc(db, "branches", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.isPusat === true || data.code === 'GUDANG-PUSAT' || data.isProtected === true) {
        throw new Error("Gudang Utama Pusat adalah lokasi master sistem dan tidak dapat dihapus.");
      }
    }

    await deleteDoc(docRef);
    await markBootstrapDone();
    return true;
  } catch (err) {
    console.error("Firestore error deleting branch:", err);
    throw new Error(err.message || "Gagal menghapus Cabang dari Firestore.");
  }
};

export const clearAllBranches = async () => {
  ensureFirebase();
  try {
    const snapshot = await getDocs(collection(db, "branches"));
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      // Protect Gudang Utama Pusat from bulk clear
      if (!data.isPusat && data.code !== 'GUDANG-PUSAT' && !data.isProtected) {
        await deleteDoc(doc(db, "branches", docSnap.id));
      }
    }
    await markBootstrapDone();
    return true;
  } catch (err) {
    console.error("Firestore error clearing branches:", err);
    throw new Error(`Gagal menghapus seluruh Cabang di Firestore: ${err.message}`);
  }
};

// ==========================================
// USER MANAGEMENT SERVICES (FIRESTORE)
// ==========================================

export const fetchUsers = async () => {
  ensureFirebase();
  try {
    const q = query(collection(db, "users"), orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    }

    const isDone = await isBootstrapInitialized();
    if (isDone) {
      return [];
    }

    const seededUsers = [];
    for (const user of INITIAL_DEFAULT_USERS) {
      const docRef = await addDoc(collection(db, "users"), {
        ...user,
        createdAt: serverTimestamp()
      });
      seededUsers.push({ id: docRef.id, ...user });
    }
    await markBootstrapDone();
    return seededUsers;
  } catch (err) {
    console.error("Firestore error fetching users:", err);
    throw new Error(`Gagal mengambil data Pengguna dari Firestore: ${err.message}`);
  }
};

export const createUser = async (userData) => {
  ensureFirebase();
  let assignedBranchId = userData.branchId || "ALL";
  let assignedBranchName = userData.branchName || "Semua Cabang (Pusat)";

  if (userData.role === 'STAFF_PUSAT' || userData.role === 'PUSAT') {
    const branches = await fetchBranches();
    const pusatBranch = branches.find(b => b.isPusat === true || b.code === 'GUDANG-PUSAT' || (b.name || '').toLowerCase().includes('gudang utama pusat'));
    assignedBranchId = pusatBranch ? pusatBranch.id : "branch-pusat-hq";
    assignedBranchName = pusatBranch ? pusatBranch.name : "Gudang Utama Pusat";
  }

  const newUser = {
    ...userData,
    role: userData.role || "STAFF_BRANCH",
    branchId: assignedBranchId,
    branchName: assignedBranchName,
    status: userData.status || "ACTIVE",
    createdAt: new Date().toISOString()
  };

  try {
    const docRef = await addDoc(collection(db, "users"), {
      ...newUser,
      createdAt: serverTimestamp()
    });
    await markBootstrapDone();
    return { id: docRef.id, ...newUser };
  } catch (err) {
    console.error("Firestore error creating user:", err);
    throw new Error(`Gagal membuat Pengguna baru di Firestore: ${err.message}`);
  }
};

export const updateUser = async (id, userData) => {
  ensureFirebase();
  let assignedBranchId = userData.branchId;
  let assignedBranchName = userData.branchName;

  if (userData.role === 'STAFF_PUSAT' || userData.role === 'PUSAT') {
    const branches = await fetchBranches();
    const pusatBranch = branches.find(b => b.isPusat === true || b.code === 'GUDANG-PUSAT' || (b.name || '').toLowerCase().includes('gudang utama pusat'));
    assignedBranchId = pusatBranch ? pusatBranch.id : "branch-pusat-hq";
    assignedBranchName = pusatBranch ? pusatBranch.name : "Gudang Utama Pusat";
  }

  const updatedData = {
    ...userData,
    ...(assignedBranchId ? { branchId: assignedBranchId, branchName: assignedBranchName } : {}),
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, "users", id);
    await updateDoc(docRef, updatedData);
    return { id, ...updatedData };
  } catch (err) {
    console.error("Firestore error updating user:", err);
    throw new Error(`Gagal memperbarui Pengguna di Firestore: ${err.message}`);
  }
};

export const deleteUser = async (id) => {
  ensureFirebase();
  try {
    await deleteDoc(doc(db, "users", id));
    await markBootstrapDone();
    return true;
  } catch (err) {
    console.error("Firestore error deleting user:", err);
    throw new Error(`Gagal menghapus Pengguna dari Firestore: ${err.message}`);
  }
};

// ==========================================
// EXPORT UTILITIES
// ==========================================

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
