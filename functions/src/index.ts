import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin App
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// ============================================================================
// DATA INTERFACES
// ============================================================================

export interface SaleItem {
  productId: string;
  qty: number;
}

export interface CalculatedTransferItem {
  productId: string;
  productName: string;
  qty_pcs: number;
  unit_price: number;
  subtotal: number;
}

export interface BranchDocument {
  id: string;
  branch_code: string;
  branch_name: string;
  branch_type: 'INTERNAL' | 'DISTRIBUTOR' | 'RESELLER';
  pic_name: string;
  phone: string;
  address: string;
  payment_terms: 'CASH' | 'TEMPO_7_HARI' | 'TEMPO_14_HARI' | 'TEMPO_30_HARI';
  credit_limit: number;
  current_outstanding_ar: number;
  is_active: boolean;
  created_at: admin.firestore.Timestamp;
}

// ============================================================================
// 1. POS & CUSTOM BUNDLING ATOMIC MUTATOR ENGINE
// ============================================================================

export const processPOSSale = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Wajib login!');
  }

  const callerUid = context.auth.uid;
  const callerRole = context.auth.token.role;
  const callerBranch = context.auth.token.branch_id;
  const { branchId, transactionType, bundleName, items, customPrice, paymentMethod } = data;

  // 1. Validasi Kepemilikan Cabang
  if (callerRole === 'cabang' && callerBranch !== branchId) {
    throw new functions.https.HttpsError('permission-denied', 'Akses cabang tidak valid!');
  }

  // 2. Validasi Array Items & Nilai Positif
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Daftar item tidak boleh kosong!');
  }

  for (const item of items) {
    if (!Number.isInteger(item.qty) || item.qty <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Kuantitas barang wajib bilangan bulat > 0!');
    }
  }

  return await db.runTransaction(async (t) => {
    // 3. READ PHASE: Baca semua stok cabang
    const stockRefs = items.map((it: SaleItem) => db.doc(`branch_stocks/${branchId}_${it.productId}`));
    const stockSnapshots = await Promise.all(stockRefs.map(ref => t.get(ref)));

    // 4. VALIDASI STOK KETERSEDIAAN
    for (let i = 0; i < items.length; i++) {
      const snap = stockSnapshots[i];
      const item = items[i];
      if (!snap.exists) {
        throw new functions.https.HttpsError('not-found', `Produk ID ${item.productId} tidak terdaftar di cabang ini.`);
      }
      const currentStock = snap.data()?.qty_pcs || 0;
      if (currentStock < item.qty) {
        throw new functions.https.HttpsError(
          'failed-precondition', 
          `Stok tidak mencukupi untuk ${snap.data()?.product_name || item.productId}. Sisa: ${currentStock}, Diminta: ${item.qty}`
        );
      }
    }

    // 5. WRITE PHASE: Atomic Stock Decrement
    for (let i = 0; i < items.length; i++) {
      const snap = stockSnapshots[i];
      const currentStock = snap.data()?.qty_pcs;
      t.update(stockRefs[i], {
        qty_pcs: currentStock - items[i].qty,
        last_outbound_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // 6. RECORD TRANSAKSI PENJUALAN
    const saleRef = db.collection('sales_transactions').doc();
    t.set(saleRef, {
      id: saleRef.id,
      branch_id: branchId,
      transaction_type: transactionType || 'RETAIL_PCS', // 'RETAIL_PCS' | 'CUSTOM_BUNDLING'
      bundle_name: bundleName || null,
      items: items,
      total_price: customPrice || 0,
      payment_method: paymentMethod || 'CASH',
      cashier_uid: callerUid,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, transactionId: saleRef.id };
  });
});

// ============================================================================
// 2. SURAT JALAN / TRANSFER RECEIPT CONFIRMATION
// ============================================================================

export const confirmTransferReceipt = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Wajib login!');

  const callerUid = context.auth.uid;
  const callerBranch = context.auth.token.branch_id;
  const callerRole = context.auth.token.role;
  const { transferId, notes } = data;

  return await db.runTransaction(async (t) => {
    const transferRef = db.doc(`stock_transfers/${transferId}`);
    const transferSnap = await t.get(transferRef);

    if (!transferSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Surat jalan tidak ditemukan.');
    }

    const transferData = transferSnap.data()!;

    // 1. Validasi Kepemilikan Cabang Penerima
    if (callerRole === 'cabang' && transferData.to_branch_id !== callerBranch) {
      throw new functions.https.HttpsError('permission-denied', 'Bukan surat jalan untuk cabang Anda.');
    }

    // 2. Strict State Machine: Hanya boleh transisi dari IN_TRANSIT -> RECEIVED
    if (transferData.status !== 'IN_TRANSIT') {
      throw new functions.https.HttpsError('failed-precondition', `Status surat jalan saat ini: ${transferData.status}, tidak dapat diterima.`);
    }

    // 3. Tambah Stok ke Cabang Penerima (Satuan PCS)
    const items = transferData.items || [];
    for (const item of items) {
      const stockRef = db.doc(`branch_stocks/${transferData.to_branch_id}_${item.productId}`);
      const stockSnap = await t.get(stockRef);

      if (!stockSnap.exists) {
        t.set(stockRef, {
          branch_id: transferData.to_branch_id,
          product_id: item.productId,
          product_name: item.productName,
          qty_pcs: item.qty_pcs,
          unit: 'PCS',
          last_inbound_at: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        const currentQty = stockSnap.data()?.qty_pcs || 0;
        t.update(stockRef, {
          qty_pcs: currentQty + item.qty_pcs,
          last_inbound_at: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    // 4. Update Status Transfer ke 'RECEIVED'
    t.update(transferRef, {
      status: 'RECEIVED',
      received_by: callerUid,
      received_at: admin.firestore.FieldValue.serverTimestamp(),
      receipt_notes: notes || ''
    });

    return { success: true, message: 'Barang berhasil diterima & stok cabang telah bertambah.' };
  });
});

// ============================================================================
// 3. ROLE MANAGEMENT, CLAIMS & IMMEDIATE TOKEN REVOCATION
// ============================================================================

export const setUserRoleAndBranch = functions.https.onCall(async (data, context) => {
  // Hanya Superadmin
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Hanya Superadmin!');
  }

  const { targetUid, role, branchId, branchType } = data;

  if (!targetUid || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'targetUid dan role wajib diisi.');
  }

  // 1. Set Custom Claims
  await admin.auth().setCustomUserClaims(targetUid, {
    role,
    branch_id: role === 'cabang' ? branchId : null,
    branch_type: role === 'cabang' ? branchType : null,
    claims_version: Date.now()
  });

  // 2. CRITICAL: Cabut token lama (Force Refresh Session)
  // Menjamin jika staff di-demote/dikeluarkan, token lama langsung invalidated
  await admin.auth().revokeRefreshTokens(targetUid);

  // 3. Catat di Dokumen Profil
  await db.doc(`user_profiles/${targetUid}`).set({
    role,
    branch_id: role === 'cabang' ? branchId : null,
    branch_type: role === 'cabang' ? branchType : null,
    claims_updated_at: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return { success: true, message: 'Role berhasil diubah dan sesi user telah di-refresh.' };
});

// ============================================================================
// 4. BRANCH CREDIT LIMIT UPDATE & IMMUTABLE AUDIT LOG
// ============================================================================

export const updateBranchCreditLimit = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Hanya Admin yang dapat mengubah limit kredit.');
  }

  const callerUid = context.auth.uid;
  const { branchId, newCreditLimit, reason } = data;

  if (typeof newCreditLimit !== 'number' || newCreditLimit < 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Limit kredit harus angka valid >= 0');
  }

  const branchRef = db.doc(`branches/${branchId}`);

  return await db.runTransaction(async (t) => {
    const branchSnap = await t.get(branchRef);
    if (!branchSnap.exists) throw new functions.https.HttpsError('not-found', 'Cabang tidak ditemukan.');

    const oldLimit = branchSnap.data()?.credit_limit || 0;

    // 1. Update Limit di Cabang
    t.update(branchRef, {
      credit_limit: newCreditLimit,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Tulis ke Koleksi Immutable Audit Log (Tidak bisa diedit/dihapus siapapun)
    const logRef = db.collection('credit_limit_audit_logs').doc();
    t.set(logRef, {
      log_id: logRef.id,
      branch_id: branchId,
      branch_name: branchSnap.data()?.branch_name,
      old_limit: oldLimit,
      new_limit: newCreditLimit,
      reason: reason || 'Penyesuaian limit kemitraan',
      authorized_admin_uid: callerUid,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { 
      success: true, 
      message: `Limit kredit berhasil diubah dari Rp ${oldLimit.toLocaleString()} ke Rp ${newCreditLimit.toLocaleString()}` 
    };
  });
});

// ============================================================================
// 5. CREDIT LIMIT & OVERDUE AR GUARD STOCK TRANSFER
// ============================================================================

export const createStockTransfer = functions.https.onCall(async (data, context) => {
  if (!context.auth || !['admin', 'pusat'].includes(context.auth.token.role)) {
    throw new functions.https.HttpsError('permission-denied', 'Hanya Admin atau Staf Pusat!');
  }

  const callerUid = context.auth.uid;
  const { toBranchId, items, shippingNotes } = data;

  if (!toBranchId || !items || !Array.isArray(items) || items.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Cabang tujuan dan daftar items tidak boleh kosong.');
  }

  // 1. Cek Profil Cabang Tujuan
  const branchSnap = await db.doc(`branches/${toBranchId}`).get();
  if (!branchSnap.exists) throw new functions.https.HttpsError('not-found', 'Cabang tujuan tidak ada.');
  const branch = branchSnap.data()!;

  // 2. CEK STATUS PIUTANG OVERDUE (Jatuh Tempo Macet)
  const overdueInvoices = await db.collection('invoices')
    .where('branch_id', '==', toBranchId)
    .where('status', 'in', ['UNPAID', 'PARTIAL'])
    .where('due_date', '<', admin.firestore.Timestamp.now())
    .get();

  if (!overdueInvoices.empty) {
    throw new functions.https.HttpsError(
      'failed-precondition', 
      `Pengiriman DITOLAK! Cabang ini memiliki ${overdueInvoices.size} invoice piutang yang telah MELEWATI JATUH TEMPO (Overdue). Harap selesaikan pembayaran terlebih dahulu.`
    );
  }

  // 3. HITUNG NILAI PENGIRIMAN SESUAI TIER HARGA CABANG
  let totalTransferValue = 0;
  const calculatedItems: CalculatedTransferItem[] = [];

  for (const item of items) {
    const pricingSnap = await db.doc(`product_pricings/${item.productId}`).get();
    const productSnap = await db.doc(`products/${item.productId}`).get();
    
    if (!pricingSnap.exists || !productSnap.exists) {
      throw new functions.https.HttpsError('not-found', `Data harga untuk SKU ${item.productId} tidak lengkap.`);
    }

    const priceApplied = branch.branch_type === 'DISTRIBUTOR' 
      ? pricingSnap.data()!.distributor_price 
      : branch.branch_type === 'RESELLER' 
        ? pricingSnap.data()!.reseller_price 
        : pricingSnap.data()!.cost_price; // Internal = HPP

    const subtotal = priceApplied * item.qty_pcs;
    totalTransferValue += subtotal;

    calculatedItems.push({
      productId: item.productId,
      productName: productSnap.data()!.name,
      qty_pcs: item.qty_pcs,
      unit_price: priceApplied,
      subtotal: subtotal
    });
  }

  // 4. CEK CREDIT LIMIT GUARD (Untuk Distributor / Reseller Tempo)
  if (branch.payment_terms !== 'CASH') {
    const currentOutstanding = branch.current_outstanding_ar || 0;
    if (currentOutstanding + totalTransferValue > (branch.credit_limit || 0)) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Pengiriman Melebihi Plafon Kredit! Piutang Aktif: Rp ${currentOutstanding.toLocaleString()}, Pengiriman Baru: Rp ${totalTransferValue.toLocaleString()}, Limit: Rp ${(branch.credit_limit || 0).toLocaleString()}`
      );
    }
  }

  // 5. ATOMIC MUTATION: Potong Stok Pusat + Buat Surat Jalan + Buat Invoice Piutang
  return await db.runTransaction(async (t) => {
    // Kurangi Stok Pusat
    for (const item of calculatedItems) {
      const centralStockRef = db.doc(`branch_stocks/PUSAT_${item.productId}`);
      const centralStockSnap = await t.get(centralStockRef);
      const currentQty = centralStockSnap.data()?.qty_pcs || 0;

      if (currentQty < item.qty_pcs) {
        throw new functions.https.HttpsError('failed-precondition', `Stok Gudang Pusat tidak cukup untuk ${item.productName}. Sisa: ${currentQty}, Diminta: ${item.qty_pcs}`);
      }

      t.update(centralStockRef, { 
        qty_pcs: currentQty - item.qty_pcs,
        last_outbound_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Terbitkan Dokumen Surat Jalan Transfer
    const transferRef = db.collection('stock_transfers').doc();
    t.set(transferRef, {
      id: transferRef.id,
      from_branch_id: 'PUSAT',
      to_branch_id: toBranchId,
      branch_name: branch.branch_name,
      branch_type: branch.branch_type,
      items: calculatedItems,
      total_value: totalTransferValue,
      status: 'IN_TRANSIT',
      unit: 'PCS',
      created_by: callerUid,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      shipping_notes: shippingNotes || ''
    });

    // Jika Bukan Pembayaran Cash Lunas, Terbitkan Invoice Piutang
    if (branch.payment_terms !== 'CASH') {
      const invoiceRef = db.collection('invoices').doc();
      const days = branch.payment_terms === 'TEMPO_7_HARI' ? 7 : branch.payment_terms === 'TEMPO_14_HARI' ? 14 : 30;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + days);

      t.set(invoiceRef, {
        invoice_id: invoiceRef.id,
        transfer_id: transferRef.id,
        branch_id: toBranchId,
        branch_name: branch.branch_name,
        total_amount: totalTransferValue,
        paid_amount: 0,
        remaining_amount: totalTransferValue,
        payment_terms: branch.payment_terms,
        due_date: admin.firestore.Timestamp.fromDate(dueDate),
        status: 'UNPAID',
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update akumulasi piutang cabang
      t.update(db.doc(`branches/${toBranchId}`), {
        current_outstanding_ar: (branch.current_outstanding_ar || 0) + totalTransferValue,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return { success: true, transferId: transferRef.id, totalValue: totalTransferValue };
  });
});
