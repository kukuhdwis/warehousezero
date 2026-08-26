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
  increment 
} from "firebase/firestore";

// Clean Storage Keys
const PRODUCTS_KEY = "wms_products";
const TRANSACTIONS_KEY = "wms_transactions";
const BRANCHES_KEY = "wms_branches";
const USERS_KEY = "wms_users_list";
const DUMMY_CLEANED_FLAG = "wms_dummy_cleaned_v2";

// Default Root Administrator (Only for initial bootstrap if user database is empty)
export const DEFAULT_ROOT_ADMIN = {
  id: "usr-root-admin",
  name: "Administrator",
  email: "admin@perusahaan.com",
  password: "admin",
  role: "ADMIN",
  branchId: "ALL",
  branchName: "Semua Cabang (Pusat)",
  phone: "-",
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

// Automatic cleanup of legacy dummy data from previous sessions
const cleanupLegacyDummyData = () => {
  if (!localStorage.getItem(DUMMY_CLEANED_FLAG)) {
    localStorage.removeItem(PRODUCTS_KEY);
    localStorage.removeItem(TRANSACTIONS_KEY);
    localStorage.removeItem(BRANCHES_KEY);
    localStorage.removeItem(USERS_KEY);
    localStorage.setItem(DUMMY_CLEANED_FLAG, "true");
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

const getLocalUsers = () => {
  try {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) {
      const initialUsers = [DEFAULT_ROOT_ADMIN];
      localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
    const parsed = JSON.parse(data);
    return parsed.length > 0 ? parsed : [DEFAULT_ROOT_ADMIN];
  } catch (e) {
    return [DEFAULT_ROOT_ADMIN];
  }
};

const saveLocalUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// ==========================================
// PRODUCT SERVICES (REAL DATA)
// ==========================================

export const fetchProducts = async () => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, "products"), orderBy("name", "asc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
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
    updatedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = await addDoc(collection(db, "products"), {
        ...newProd,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...newProd };
    } catch (err) {
      console.warn("Firestore error creating product:", err);
    }
  }

  const products = getLocalProducts();
  const created = { id: `prod-${Date.now()}`, ...newProd };
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
      return { id, ...updatedData };
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
// TRANSACTION SERVICES (REAL DATA)
// ==========================================

export const fetchTransactions = async () => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    } catch (err) {
      console.warn("Firestore error fetching transactions:", err);
      return getLocalTransactions();
    }
  }
  return getLocalTransactions();
};

export const recordStockMovement = async ({ productId, sku, productName, type, qty, notes, user, branchId }) => {
  const quantity = Number(qty);
  if (!quantity || quantity <= 0) throw new Error("Jumlah (Qty) harus lebih besar dari 0");

  const movement = {
    productId,
    sku,
    productName,
    type, // "IN" or "OUT"
    qty: quantity,
    notes: notes || "-",
    user: user || "Staf Gudang",
    branchId: branchId || "ALL",
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured() && db) {
    try {
      await addDoc(collection(db, "transactions"), {
        ...movement,
        createdAt: serverTimestamp()
      });
      const prodRef = doc(db, "products", productId);
      await updateDoc(prodRef, {
        currentStock: increment(type === "IN" ? quantity : -quantity),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Firestore error during movement:", err);
    }
  }

  // Update local storage
  const products = getLocalProducts();
  const prodIdx = products.findIndex(p => p.id === productId || p.sku === sku);
  if (prodIdx !== -1) {
    const current = Number(products[prodIdx].currentStock) || 0;
    const nextStock = type === "IN" ? current + quantity : Math.max(0, current - quantity);
    products[prodIdx].currentStock = nextStock;
    products[prodIdx].updatedAt = new Date().toISOString();
    saveLocalProducts(products);
  }

  const txs = getLocalTransactions();
  const newTx = { id: `mov-${Date.now()}`, ...movement };
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
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
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

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = await addDoc(collection(db, "branches"), {
        ...newBranch,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...newBranch };
    } catch (err) {
      console.warn("Firestore error creating branch:", err);
    }
  }

  const branches = getLocalBranches();
  const created = { id: `branch-${Date.now()}`, ...newBranch };
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
      return { id, ...updatedData };
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
      if (snapshot.empty) {
        // Return default root admin if collection is completely fresh
        return [DEFAULT_ROOT_ADMIN];
      }
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
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

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = await addDoc(collection(db, "users"), {
        ...newUser,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...newUser };
    } catch (err) {
      console.warn("Firestore error creating user:", err);
    }
  }

  const users = getLocalUsers();
  const created = { id: `usr-${Date.now()}`, ...newUser };
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
      return { id, ...updatedData };
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
