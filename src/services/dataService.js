import { db, isFirebaseConfigured } from "./firebase";
import { registerUserInFirebaseAuth } from "./authService";
import { 
  callCreateSystemUser, 
  callUpdateSystemUser, 
  callDeleteSystemUser 
} from "./cloudFunctionsService";
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
  where,
  onSnapshot,
  writeBatch
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

export const subscribeProducts = (callback) => {
  ensureFirebase();
  try {
    const q = query(collection(db, "products"), orderBy("name", "asc"));
    return onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      callback(prods);
    }, (err) => {
      console.error("Firestore real-time error on products:", err);
    });
  } catch (err) {
    console.error("Failed to subscribe products:", err);
    return () => {};
  }
};

// Helper to compress image in browser using Canvas
export const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error("File yang dipilih bukan gambar yang valid."));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            maxHeight = Math.round((height * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP or JPEG
        const mimeType = canvas.toDataURL('image/webp').startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const createProduct = async (productData) => {
  ensureFirebase();
  const sellingPrice = Number(productData.selling_price ?? productData.sellingPrice ?? productData.price) || 0;
  const resellerPrice = Number(productData.reseller_price ?? productData.resellerPrice) || 0;
  const profitAmount = productData.profit_amount !== undefined 
    ? Number(productData.profit_amount) 
    : (sellingPrice - resellerPrice);
  const profitPercentage = productData.profit_percentage !== undefined
    ? Number(productData.profit_percentage)
    : (resellerPrice > 0 ? ((profitAmount / resellerPrice) * 100) : 0);

  const engineType = productData.engine_type || productData.engineType || productData.machineCategory || 'Universal / Semua Mesin';
  const categoryName = productData.category_name || productData.categoryName || 'Downpipe';
  const sku = (productData.sku || productData.code || productData.barcode || '').trim();

  const newProd = {
    ...productData,
    code: sku,
    sku: sku,
    barcode: sku,
    name: (productData.name || '').trim(),
    engine_type: engineType,
    car_variant: productData.car_variant || productData.carVariant || '-',
    category_name: categoryName,
    spec_sound: productData.spec_sound || productData.specSound || 'Street (Bass)',
    spec_resonator: productData.spec_resonator !== undefined ? Boolean(productData.spec_resonator) : true,
    material_finish: productData.material_finish || productData.materialFinish || 'SS Polos',
    reseller_price: resellerPrice,
    selling_price: sellingPrice,
    price: sellingPrice, // Backward compatibility
    profit_amount: profitAmount,
    profit_percentage: Math.round(profitPercentage * 100) / 100,
    imageUrl: productData.imageUrl || productData.image || productData.photoUrl || '',
    notes: productData.notes || productData.description || '',
    minStock: Number(productData.minStock) || 5,
    currentStock: Number(productData.currentStock) || 0,
    machineCategory: engineType,
    brand: productData.brand || 'NDK Exhaust',
    unit: productData.unit || 'Pcs',
    status: productData.status || 'ACTIVE',
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
  const sellingPrice = Number(productData.selling_price ?? productData.sellingPrice ?? productData.price) || 0;
  const resellerPrice = Number(productData.reseller_price ?? productData.resellerPrice) || 0;
  const profitAmount = productData.profit_amount !== undefined 
    ? Number(productData.profit_amount) 
    : (sellingPrice - resellerPrice);
  const profitPercentage = productData.profit_percentage !== undefined
    ? Number(productData.profit_percentage)
    : (resellerPrice > 0 ? ((profitAmount / resellerPrice) * 100) : 0);

  const engineType = productData.engine_type || productData.engineType || productData.machineCategory || 'Universal / Semua Mesin';
  const categoryName = productData.category_name || productData.categoryName || 'Downpipe';
  const sku = (productData.sku || productData.code || productData.barcode || '').trim();

  const updatedData = {
    ...productData,
    code: sku,
    sku: sku,
    barcode: sku,
    name: (productData.name || '').trim(),
    engine_type: engineType,
    car_variant: productData.car_variant || productData.carVariant || '-',
    category_name: categoryName,
    spec_sound: productData.spec_sound || productData.specSound || 'Street (Bass)',
    spec_resonator: productData.spec_resonator !== undefined ? Boolean(productData.spec_resonator) : true,
    material_finish: productData.material_finish || productData.materialFinish || 'SS Polos',
    reseller_price: resellerPrice,
    selling_price: sellingPrice,
    price: sellingPrice, // Backward compatibility
    profit_amount: profitAmount,
    profit_percentage: Math.round(profitPercentage * 100) / 100,
    imageUrl: productData.imageUrl !== undefined ? productData.imageUrl : (productData.image || productData.photoUrl || ''),
    notes: productData.notes || productData.description || '',
    minStock: Number(productData.minStock) || 5,
    currentStock: Number(productData.currentStock) || 0,
    machineCategory: engineType,
    brand: productData.brand || 'NDK Exhaust',
    unit: productData.unit || 'Pcs',
    status: productData.status || 'ACTIVE',
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

export const deleteProductsBatch = async (ids = []) => {
  ensureFirebase();
  if (!ids || ids.length === 0) return true;
  try {
    const CHUNK_SIZE = 300;
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const chunk = ids.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const id of chunk) {
        batch.delete(doc(db, "products", id));
      }
      await batch.commit();
    }
    return true;
  } catch (err) {
    console.error("Firestore error batch deleting products:", err);
    throw new Error(`Gagal menghapus beberapa produk dari Firestore: ${err.message}`);
  }
};

export const importProductsBatch = async (itemsList, duplicateMode = 'UPDATE', onProgress = null) => {
  ensureFirebase();
  if (!itemsList || itemsList.length === 0) {
    return { total: 0, createdCount: 0, updatedCount: 0, skippedCount: 0 };
  }

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  // Split into chunks of 300 to stay well under Firestore's 500 batch limit
  const CHUNK_SIZE = 300;
  const chunks = [];
  for (let i = 0; i < itemsList.length; i += CHUNK_SIZE) {
    chunks.push(itemsList.slice(i, i + CHUNK_SIZE));
  }

  let processedSoFar = 0;

  for (let c = 0; c < chunks.length; c++) {
    const currentChunk = chunks[c];
    const batch = writeBatch(db);

    for (const item of currentChunk) {
      if (!item.isValid) {
        skippedCount++;
        continue;
      }

      const sellingPrice = Number(item.selling_price ?? item.price) || 0;
      const resellerPrice = Number(item.reseller_price) || 0;
      const profitAmount = Number(item.profit_amount) || (sellingPrice - resellerPrice);
      const profitPercentage = Number(item.profit_percentage) || (resellerPrice > 0 ? ((profitAmount / resellerPrice) * 100) : 0);

      const productPayload = {
        code: item.sku,
        sku: item.sku,
        barcode: item.sku,
        name: item.name,
        engine_type: item.engine_type || 'Universal / Semua Mesin',
        car_variant: item.car_variant || '-',
        category_name: item.category_name || 'Downpipe',
        spec_sound: item.spec_sound || 'Street (Bass)',
        spec_resonator: item.spec_resonator !== undefined ? Boolean(item.spec_resonator) : true,
        material_finish: item.material_finish || 'SS Polos',
        reseller_price: resellerPrice,
        selling_price: sellingPrice,
        price: sellingPrice,
        profit_amount: profitAmount,
        profit_percentage: Math.round(profitPercentage * 100) / 100,
        notes: item.notes || '',
        minStock: Number(item.minStock) || 5,
        currentStock: Number(item.currentStock) || 0,
        unit: item.unit || 'Pcs',
        status: item.status || 'ACTIVE',
        brand: item.brand || 'NDK Exhaust',
        machineCategory: item.engine_type || 'Universal / Semua Mesin',
        branchId: 'ALL',
        branchName: 'Semua Cabang (Pusat)',
        updatedAt: new Date().toISOString()
      };

      if (item.isDuplicate) {
        if (duplicateMode === 'UPDATE' && item.existingId) {
          const docRef = doc(db, "products", item.existingId);
          batch.update(docRef, productPayload);
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        const docRef = doc(collection(db, "products"));
        batch.set(docRef, {
          ...productPayload,
          createdAt: serverTimestamp()
        });
        createdCount++;
      }
    }

    await batch.commit();
    processedSoFar += currentChunk.length;
    if (onProgress) {
      onProgress(Math.round((processedSoFar / itemsList.length) * 100));
    }
  }

  return {
    total: itemsList.length,
    createdCount,
    updatedCount,
    skippedCount
  };
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

export const requestBatchBranchInventory = async (itemsList, currentUser) => {
  ensureFirebase();
  if (!itemsList || itemsList.length === 0) return [];

  const rawList = Array.isArray(itemsList) ? itemsList : [itemsList];
  const branchName = rawList[0]?.branchName || currentUser?.branchName || 'Cabang';
  const branchId = rawList[0]?.branchId || currentUser?.branchId || 'CABANG';

  try {
    const promises = rawList.map(async (data) => {
      const newInventoryRequest = {
        branchId: branchId,
        branchName: branchName,
        productId: data.productId,
        sku: data.sku,
        productName: data.productName,
        brand: data.brand || 'Generic',
        unit: data.unit || 'Pcs',
        price: Number(data.price) || 0,
        minStock: Number(data.minStock) || 5,
        stockQuantity: Number(data.stockQuantity || data.currentStock) || 0,
        notes: data.notes || '',
        status: 'PENDING_APPROVAL',
        requestedBy: currentUser?.name || currentUser?.email || 'Staff Cabang',
        requestedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "branch_inventories"), {
        ...newInventoryRequest,
        createdAt: serverTimestamp()
      });

      return { id: docRef.id, ...newInventoryRequest };
    });

    const results = await Promise.all(promises);

    // Create exactly ONE consolidated notification for the whole submission batch
    const productCount = results.length;
    const totalQty = results.reduce((acc, item) => acc + (Number(item.stockQuantity) || 0), 0);
    const productPreview = results.slice(0, 2).map(r => `"${r.productName}"`).join(', ') + (productCount > 2 ? ` dan ${productCount - 2} produk lainnya` : '');

    await createNotification({
      type: 'INVENTORY_REQUEST',
      title: 'Pendaftaran Inventaris Cabang 📋',
      message: `${branchName} mendaftarkan ${productCount} produk (${productPreview}) total ${totalQty} Pcs untuk diverifikasi Pusat.`,
      targetRole: 'ADMIN_AND_PUSAT',
      metaId: results[0]?.id || '',
      branchId: branchId,
      branchName: branchName
    });

    return results;
  } catch (err) {
    console.error("Firestore error creating batch branch inventory request:", err);
    throw new Error(`Gagal mengajukan inventaris ke Firestore: ${err.message}`);
  }
};

export const requestBranchInventory = async (data, currentUser) => {
  const res = await requestBatchBranchInventory([data], currentUser);
  return res[0];
};

export const approveBatchBranchInventory = async (itemsOrIds, adminUser) => {
  ensureFirebase();
  const list = Array.isArray(itemsOrIds) ? itemsOrIds : [itemsOrIds];
  if (list.length === 0) return [];

  const approvalData = {
    status: 'APPROVED',
    approvedBy: adminUser?.name || adminUser?.email || 'Administrator Pusat',
    approvedAt: new Date().toISOString()
  };

  try {
    const promises = list.map(async (itemOrId) => {
      const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
      const docRef = doc(db, "branch_inventories", id);
      await updateDoc(docRef, approvalData);
      return id;
    });

    const approvedIds = await Promise.all(promises);

    const firstItem = typeof list[0] === 'object' ? list[0] : null;
    const branchName = firstItem?.branchName || 'Cabang';
    const targetBranchId = firstItem?.branchId || 'ALL';

    await createNotification({
      type: 'INVENTORY_APPROVED',
      title: 'Pengajuan Inventaris Disetujui! ✅',
      message: `Pusat telah MENYETUJUI pendaftaran inventaris (${approvedIds.length} produk) untuk ${branchName}. Stok kini resmi aktif.`,
      targetRole: 'STAFF_BRANCH',
      targetBranchId: targetBranchId,
      metaId: approvedIds[0]
    });

    return approvedIds;
  } catch (err) {
    console.error("Firestore error approving batch inventory:", err);
    throw new Error(`Gagal menyetujui inventaris di Firestore: ${err.message}`);
  }
};

export const approveBranchInventory = async (idOrItem, adminUser) => {
  const res = await approveBatchBranchInventory([idOrItem], adminUser);
  return res[0];
};

export const rejectBatchBranchInventory = async (itemsOrIds, adminUser, reason = 'Kuantitas atau spesifikasi tidak sesuai verifikasi fisik.') => {
  ensureFirebase();
  const list = Array.isArray(itemsOrIds) ? itemsOrIds : [itemsOrIds];
  if (list.length === 0) return [];

  const rejectionData = {
    status: 'REJECTED',
    rejectionReason: reason || 'Kuantitas atau spesifikasi tidak sesuai verifikasi fisik.',
    rejectedBy: adminUser?.name || adminUser?.email || 'Administrator Pusat',
    rejectedAt: new Date().toISOString()
  };

  try {
    const promises = list.map(async (itemOrId) => {
      const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
      const docRef = doc(db, "branch_inventories", id);
      await updateDoc(docRef, rejectionData);
      return id;
    });

    const rejectedIds = await Promise.all(promises);

    const firstItem = typeof list[0] === 'object' ? list[0] : null;
    const branchName = firstItem?.branchName || 'Cabang';
    const targetBranchId = firstItem?.branchId || 'ALL';

    await createNotification({
      type: 'INVENTORY_REJECTED',
      title: 'Pengajuan Inventaris Ditolak ⚠️',
      message: `Pengajuan inventaris (${rejectedIds.length} produk) di ${branchName} DITOLAK oleh Pusat. Alasan: "${reason || '-'}"`,
      targetRole: 'STAFF_BRANCH',
      targetBranchId: targetBranchId,
      metaId: rejectedIds[0]
    });

    return rejectedIds;
  } catch (err) {
    console.error("Firestore error rejecting batch inventory:", err);
    throw new Error(`Gagal menolak inventaris di Firestore: ${err.message}`);
  }
};

export const rejectBranchInventory = async (idOrItem, adminUser, reason) => {
  const res = await rejectBatchBranchInventory([idOrItem], adminUser, reason);
  return res[0];
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
// REALTIME DATA SUBSCRIPTIONS (FIRESTORE)
// ==========================================

export const subscribeNotifications = (currentUser, onUpdate) => {
  ensureFirebase();
  if (!currentUser) return () => {};

  try {
    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(50));
    return onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      const filtered = notifs.filter(n => {
        if (currentUser.role === 'ADMIN' || currentUser.role === 'STAFF_PUSAT') {
          return n.targetRole === 'ADMIN_AND_PUSAT' || n.targetRole === 'ALL';
        }
        if (currentUser.role === 'STAFF_BRANCH') {
          return (n.targetRole === 'STAFF_BRANCH' && (n.targetBranchId === currentUser.branchId || n.targetBranchId === 'ALL')) || n.targetRole === 'ALL';
        }
        return true;
      });
      onUpdate(filtered);
    }, (err) => {
      console.warn("Realtime notifications listener error:", err);
    });
  } catch (err) {
    console.error("Failed to subscribe notifications:", err);
    return () => {};
  }
};

export const subscribeTransfers = (currentUser, onUpdate) => {
  ensureFirebase();
  if (!currentUser) return () => {};

  try {
    const q = query(collection(db, "stock_transfers"), orderBy("sentAt", "desc"), limit(100));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      const filtered = (currentUser?.role === 'STAFF_BRANCH')
        ? list.filter(t => t.targetBranchId === currentUser.branchId || t.targetBranchId === 'ALL' || t.to_branch_id === currentUser.branchId || t.to_branch_id === 'ALL')
        : list;
      onUpdate(filtered);
    }, (err) => {
      console.warn("Realtime transfers listener error:", err);
    });
  } catch (err) {
    console.error("Failed to subscribe transfers:", err);
    return () => {};
  }
};

export const subscribeBranchInventories = (currentUser, onUpdate) => {
  ensureFirebase();
  if (!currentUser) return () => {};

  try {
    const q = collection(db, "branch_inventories");
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      const filtered = (currentUser?.role === 'STAFF_BRANCH')
        ? list.filter(b => b.branchId === currentUser.branchId)
        : list;
      onUpdate(filtered);
    }, (err) => {
      console.warn("Realtime branch_inventories listener error:", err);
    });
  } catch (err) {
    console.error("Failed to subscribe branch_inventories:", err);
    return () => {};
  }
};

export const subscribeStockRequests = (currentUser, onUpdate) => {
  ensureFirebase();
  if (!currentUser) return () => {};

  try {
    const q = query(collection(db, "stock_requests"), orderBy("requestedAt", "desc"), limit(100));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      const filtered = (currentUser?.role === 'STAFF_BRANCH')
        ? list.filter(r => r.branchId === currentUser.branchId)
        : list;
      onUpdate(filtered);
    }, (err) => {
      console.warn("Realtime stock_requests listener error:", err);
    });
  } catch (err) {
    console.error("Failed to subscribe stock_requests:", err);
    return () => {};
  }
};

export const subscribeStockMovements = (currentUser, onUpdate) => {
  ensureFirebase();
  try {
    const q = query(collection(db, "stock_movements"), orderBy("createdAt", "desc"), limit(200));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      const filtered = (currentUser?.role === 'STAFF_BRANCH')
        ? list.filter(m => m.branchId === currentUser.branchId || m.source === currentUser.branchId)
        : list;
      onUpdate(filtered);
    }, (err) => {
      console.warn("Realtime stock_movements listener error:", err);
    });
  } catch (err) {
    console.error("Failed to subscribe stock_movements:", err);
    return () => {};
  }
};

export const subscribeBranches = (onUpdate) => {
  ensureFirebase();
  try {
    const q = collection(db, "branches");
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      onUpdate(list);
    }, (err) => {
      console.warn("Realtime branches listener error:", err);
    });
  } catch (err) {
    console.error("Failed to subscribe branches:", err);
    return () => {};
  }
};

export const subscribeBrands = (onUpdate) => {
  ensureFirebase();
  try {
    const q = collection(db, "brands");
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      onUpdate(list);
    }, (err) => {
      console.warn("Realtime brands listener error:", err);
    });
  } catch (err) {
    console.error("Failed to subscribe brands:", err);
    return () => {};
  }
};

export const subscribeMachineCategories = (onUpdate) => {
  ensureFirebase();
  try {
    const q = collection(db, "machine_categories");
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      onUpdate(list);
    }, (err) => {
      console.warn("Realtime machine_categories listener error:", err);
    });
  } catch (err) {
    console.error("Failed to subscribe machine_categories:", err);
    return () => {};
  }
};

export const subscribeUsers = (currentUser, onUpdate) => {
  ensureFirebase();
  if (!currentUser || currentUser.role === 'STAFF_BRANCH') return () => {};

  try {
    const q = collection(db, "users");
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      onUpdate(list);
    }, (err) => {
      console.warn("Realtime users listener error:", err);
    });
  } catch (err) {
    console.error("Failed to subscribe users:", err);
    return () => {};
  }
};

// Subtle and pleasant Web Audio API notification chime
export const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
    gain1.gain.setValueAtTime(0.1, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.3); // D6
    gain2.gain.setValueAtTime(0.1, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);
  } catch (e) {
    // Ignore audio permission error on silent autoplay policy
  }
};

// ==========================================
// STOCK TRANSFERS (FIRESTORE)
// ==========================================

export const fetchTransfers = async (branchId = null) => {
  ensureFirebase();
  try {
    const q = query(collection(db, "stock_transfers"), orderBy("sentAt", "desc"));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    if (branchId && branchId !== 'ALL') {
      return list.filter(t => t.targetBranchId === branchId || t.fromBranchId === branchId || t.to_branch_id === branchId);
    }
    return list;
  } catch (err) {
    console.error("Firestore error fetching transfers:", err);
    return [];
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

export const confirmBatchTransferReceipt = async (transferListOrIds, receiverUser, receiverNotes = '') => {
  ensureFirebase();
  const list = Array.isArray(transferListOrIds) ? transferListOrIds : [transferListOrIds];
  if (list.length === 0) return [];

  const updateData = {
    status: 'RECEIVED',
    receiverName: receiverUser?.name || 'Staff Cabang',
    receiverNotes: receiverNotes || 'Barang telah diperiksa & diterima dalam kondisi baik.',
    receivedAt: new Date().toISOString()
  };

  try {
    const promises = list.map(async (transferOrId) => {
      const id = typeof transferOrId === 'string' ? transferOrId : transferOrId.id;
      let transferObj = typeof transferOrId === 'object' ? transferOrId : null;
      
      const docRef = doc(db, "stock_transfers", id);
      if (!transferObj || !transferObj.productId || !transferObj.qty) {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          transferObj = { id: snap.id, ...snap.data() };
        }
      }

      await updateDoc(docRef, updateData);

      const branchId = receiverUser?.branchId || transferObj?.targetBranchId || 'CABANG';
      const branchName = receiverUser?.branchName || transferObj?.targetBranchName || 'Cabang';
      const qtyToAdd = Number(transferObj?.qty) || 1;
      const prodId = transferObj?.productId;
      const sku = transferObj?.sku;

      // 1. Record stock movement IN for the branch
      const mov = await recordStockMovement({
        productId: prodId || 'TRANSFER_PROD',
        sku: sku || 'TRANSFER_SKU',
        productName: transferObj?.productName || 'Penerimaan Transfer',
        type: 'IN',
        qty: qtyToAdd,
        unit: transferObj?.unit || 'Pcs',
        branchId,
        branchName,
        source: 'KANTOR_PUSAT',
        deliveryNote: transferObj?.deliveryNote || '-',
        notes: `Konfirmasi Penerimaan Kiriman • ${transferObj?.productName || ''} (+${qtyToAdd} Pcs)${receiverNotes ? ` • Catatan: ${receiverNotes}` : ''}`,
        user: receiverUser?.name || 'Staff Cabang'
      });

      // 2. Update or create branch inventory record so stock physically increases in branch inventory
      if (branchId && (prodId || sku)) {
        let branchInvDoc = null;
        let branchInvId = null;
        let currentBranchStock = 0;

        // Query by branchId and SKU
        if (sku) {
          const q1 = query(
            collection(db, "branch_inventories"),
            where("branchId", "==", branchId),
            where("sku", "==", sku)
          );
          const snap1 = await getDocs(q1);
          if (!snap1.empty) {
            branchInvDoc = snap1.docs[0].data();
            branchInvId = snap1.docs[0].id;
            currentBranchStock = Number(branchInvDoc.stockQuantity) || 0;
          }
        }

        // Query by branchId and productId if not found by SKU
        if (!branchInvId && prodId) {
          const q2 = query(
            collection(db, "branch_inventories"),
            where("branchId", "==", branchId),
            where("productId", "==", prodId)
          );
          const snap2 = await getDocs(q2);
          if (!snap2.empty) {
            branchInvDoc = snap2.docs[0].data();
            branchInvId = snap2.docs[0].id;
            currentBranchStock = Number(branchInvDoc.stockQuantity) || 0;
          }
        }

        if (branchInvId) {
          const newQty = currentBranchStock + qtyToAdd;
          await updateDoc(doc(db, "branch_inventories", branchInvId), {
            stockQuantity: newQty,
            status: 'APPROVED',
            updatedAt: new Date().toISOString()
          });
        } else {
          await addDoc(collection(db, "branch_inventories"), {
            branchId,
            branchName,
            productId: prodId || '',
            sku: sku || '',
            productName: transferObj?.productName || 'Produk',
            brand: transferObj?.brand || 'Generic',
            price: Number(transferObj?.price) || 0,
            stockQuantity: qtyToAdd,
            minStock: 10,
            unit: transferObj?.unit || 'Pcs',
            status: 'APPROVED',
            approvedBy: 'KANTOR_PUSAT (TRANSFER)',
            approvedAt: new Date().toISOString(),
            createdAt: serverTimestamp(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      return { id, ...updateData, movement: mov };
    });

    const results = await Promise.all(promises);

    const firstItem = typeof list[0] === 'object' ? list[0] : null;
    const deliveryNote = firstItem?.deliveryNote || '-';
    const branchName = receiverUser?.branchName || firstItem?.targetBranchName || 'Cabang';

    await createNotification({
      type: 'STOCK_TRANSFER_RECEIVED',
      title: 'Kiriman Diterima oleh Cabang ✅',
      message: `${branchName} telah mengonfirmasi penerimaan kiriman (${results.length} produk, No. Surat Jalan: ${deliveryNote}).`,
      targetRole: 'ADMIN_AND_PUSAT',
      metaId: results[0]?.id
    });

    return results;
  } catch (err) {
    console.error("Firestore error confirming batch transfer:", err);
    throw new Error(`Gagal mengonfirmasi penerimaan transfer di Firestore: ${err.message}`);
  }
};

export const confirmTransferReceipt = async (transferIdOrObj, receiverUser, receiverNotes = '') => {
  const results = await confirmBatchTransferReceipt([transferIdOrObj], receiverUser, receiverNotes);
  return results[0];
};

export const rejectBatchTransferReceipt = async (transferListOrIds, receiverUser, reason = 'Kuantitas atau kondisi fisik tidak sesuai.') => {
  ensureFirebase();
  const list = Array.isArray(transferListOrIds) ? transferListOrIds : [transferListOrIds];
  if (list.length === 0) return [];

  const updateData = {
    status: 'REJECTED',
    rejectionReason: reason || 'Kuantitas atau kondisi fisik tidak sesuai.',
    rejectedBy: receiverUser?.name || 'Staff Cabang',
    rejectedAt: new Date().toISOString()
  };

  try {
    const promises = list.map(async (transferOrId) => {
      const id = typeof transferOrId === 'string' ? transferOrId : transferOrId.id;
      const docRef = doc(db, "stock_transfers", id);
      await updateDoc(docRef, updateData);
      return id;
    });

    const rejectedIds = await Promise.all(promises);

    const firstItem = typeof list[0] === 'object' ? list[0] : null;
    const deliveryNote = firstItem?.deliveryNote || '-';
    const branchName = receiverUser?.branchName || firstItem?.targetBranchName || 'Cabang';

    await createNotification({
      type: 'STOCK_TRANSFER_REJECTED',
      title: 'Kiriman Ditolak oleh Cabang ⚠️',
      message: `${branchName} MENOLAK paket kiriman (${rejectedIds.length} produk, No. Surat Jalan: ${deliveryNote}). Alasan: "${reason || '-'}"`,
      targetRole: 'ADMIN_AND_PUSAT',
      metaId: rejectedIds[0]
    });

    return rejectedIds;
  } catch (err) {
    console.error("Firestore error rejecting batch transfer:", err);
    throw new Error(`Gagal menolak paket kiriman di Firestore: ${err.message}`);
  }
};

// ==========================================
// STOCK REQUESTS (FIRESTORE)
// ==========================================

export const fetchStockRequests = async (branchId = null) => {
  ensureFirebase();
  try {
    const q = query(collection(db, "stock_requests"), orderBy("requestedAt", "desc"));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    if (branchId && branchId !== 'ALL') {
      return list.filter(r => r.branchId === branchId);
    }
    return list;
  } catch (err) {
    console.error("Firestore error fetching stock requests:", err);
    return [];
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
  const hasMultipleItems = Boolean(movementData.items && Array.isArray(movementData.items) && movementData.items.length > 0);
  
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
    if (hasMultipleItems) {
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

  const { branchType, ...publicBranchData } = branchData;

  const newBranch = {
    ...publicBranchData,
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

    if (!isPusatChoice) {
      await setDoc(doc(db, "branch_secrets", docRef.id), {
        type: branchType || 'INTERNAL',
        createdAt: serverTimestamp()
      });
    }

    await markBootstrapDone();
    return { id: docRef.id, ...newBranch, branchType };
  } catch (err) {
    console.error("Firestore error creating branch:", err);
    throw new Error(`Gagal membuat Cabang baru di Firestore: ${err.message}`);
  }
};

export const updateBranch = async (id, branchData) => {
  ensureFirebase();
  const { branchType, ...publicBranchData } = branchData;
  const updatedData = {
    ...publicBranchData,
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, "branches", id);
    await updateDoc(docRef, updatedData);
    
    if (branchType) {
      await setDoc(doc(db, "branch_secrets", id), {
        type: branchType,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
    
    return { id, ...updatedData, branchType };
  } catch (err) {
    console.error("Firestore error updating branch:", err);
    throw new Error(`Gagal memperbarui Cabang di Firestore: ${err.message}`);
  }
};

export const getBranchSecret = async (id) => {
  ensureFirebase();
  try {
    const docRef = doc(db, "branch_secrets", id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().type || 'INTERNAL';
    }
    return null;
  } catch (err) {
    console.warn("Could not fetch branch secret:", err);
    return null;
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

  const payload = {
    ...userData,
    email: (userData.email || '').trim().toLowerCase(),
    role: userData.role || "STAFF_BRANCH",
    branchId: assignedBranchId,
    branchName: assignedBranchName,
    status: userData.status || "ACTIVE"
  };

  try {
    const result = await callCreateSystemUser(payload);
    await markBootstrapDone();
    return result.user || { id: result.user?.id || Date.now(), ...payload };
  } catch (fnErr) {
    console.warn("Cloud function create user fallback, registering via client Firebase Auth:", fnErr);
    
    let authUid = null;
    if (userData.password && userData.password.trim()) {
      try {
        authUid = await registerUserInFirebaseAuth(payload.email, userData.password);
      } catch (authErr) {
        console.error("Client Firebase Auth registration failed:", authErr);
        throw authErr;
      }
    }

    if (authUid) {
      const docRef = doc(db, "users", authUid);
      await setDoc(docRef, {
        ...payload,
        uid: authUid,
        createdAt: serverTimestamp()
      });
      await markBootstrapDone();
      return { id: authUid, uid: authUid, ...payload };
    } else {
      const docRef = await addDoc(collection(db, "users"), {
        ...payload,
        createdAt: serverTimestamp()
      });
      await markBootstrapDone();
      return { id: docRef.id, ...payload };
    }
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
    email: (userData.email || '').trim().toLowerCase(),
    ...(assignedBranchId ? { branchId: assignedBranchId, branchName: assignedBranchName } : {}),
    updatedAt: new Date().toISOString()
  };

  // If password was provided on edit, ensure it gets created/synced to Firebase Auth
  if (userData.password && userData.password.trim()) {
    try {
      await registerUserInFirebaseAuth(updatedData.email, userData.password);
    } catch (authErr) {
      console.warn("Firebase Auth sync on update warning:", authErr);
    }
  }

  try {
    const result = await callUpdateSystemUser({ targetUid: id, ...updatedData });
    return result.user || { id, ...updatedData };
  } catch (fnErr) {
    console.warn("Cloud function update user fallback to direct Firestore:", fnErr);
    const docRef = doc(db, "users", id);
    await updateDoc(docRef, updatedData);
    return { id, ...updatedData };
  }
};

export const deleteUser = async (id) => {
  ensureFirebase();
  try {
    await callDeleteSystemUser(id);
    await markBootstrapDone();
    return true;
  } catch (fnErr) {
    console.warn("Cloud function delete user fallback to direct Firestore:", fnErr);
    await deleteDoc(doc(db, "users", id));
    await markBootstrapDone();
    return true;
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
