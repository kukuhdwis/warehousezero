import { functions, isFirebaseConfigured } from './firebase';
import { httpsCallable } from 'firebase/functions';

/**
 * Call Cloud Function `processPOSSale`
 * Atomic decrement + Record POS sale
 */
export const callProcessPOSSale = async ({
  branchId,
  transactionType = 'RETAIL_PCS',
  bundleName = null,
  items,
  customPrice,
  paymentMethod = 'CASH'
}) => {
  if (isFirebaseConfigured() && functions) {
    const processPOSSaleFn = httpsCallable(functions, 'processPOSSale');
    const result = await processPOSSaleFn({
      branchId,
      transactionType,
      bundleName,
      items,
      customPrice,
      paymentMethod
    });
    return result.data;
  }
  throw new Error('Firebase Functions belum terkonfigurasi untuk memproses penjualan POS di server.');
};

/**
 * Call Cloud Function `confirmTransferReceipt`
 * Confirm DO receipt, atomic increment branch stock, strict state machine
 */
export const callConfirmTransferReceipt = async ({ transferId, notes = '' }) => {
  if (isFirebaseConfigured() && functions) {
    const confirmTransferReceiptFn = httpsCallable(functions, 'confirmTransferReceipt');
    const result = await confirmTransferReceiptFn({ transferId, notes });
    return result.data;
  }
  throw new Error('Firebase Functions belum terkonfigurasi untuk mengonfirmasi penerimaan transfer.');
};

/**
 * Call Cloud Function `setUserRoleAndBranch`
 * Set custom claims, revoke refresh tokens, and update profile
 */
export const callSetUserRoleAndBranch = async ({ targetUid, role, branchId, branchType }) => {
  if (isFirebaseConfigured() && functions) {
    const setUserRoleAndBranchFn = httpsCallable(functions, 'setUserRoleAndBranch');
    const result = await setUserRoleAndBranchFn({
      targetUid,
      role,
      branchId,
      branchType
    });
    return result.data;
  }
  throw new Error('Firebase Functions belum terkonfigurasi untuk mengubah role pengguna.');
};

/**
 * Call Cloud Function `updateBranchCreditLimit`
 * Update branch credit limit with immutable audit log
 */
export const callUpdateBranchCreditLimit = async ({ branchId, newCreditLimit, reason = '' }) => {
  if (isFirebaseConfigured() && functions) {
    const updateBranchCreditLimitFn = httpsCallable(functions, 'updateBranchCreditLimit');
    const result = await updateBranchCreditLimitFn({
      branchId,
      newCreditLimit,
      reason
    });
    return result.data;
  }
  throw new Error('Firebase Functions belum terkonfigurasi untuk mengubah limit kredit.');
};

/**
 * Call Cloud Function `createStockTransfer`
 * Overdue check, pricing calculation, credit limit guard, central stock decrement, DO & AR Invoice creation
 */
export const callCreateStockTransfer = async ({ toBranchId, items, shippingNotes = '' }) => {
  if (isFirebaseConfigured() && functions) {
    const createStockTransferFn = httpsCallable(functions, 'createStockTransfer');
    const result = await createStockTransferFn({
      toBranchId,
      items,
      shippingNotes
    });
    return result.data;
  }
  throw new Error('Firebase Functions belum terkonfigurasi untuk membuat surat jalan transfer stok.');
};

/**
 * Call Cloud Function `createSystemUser`
 * Creates Auth user, sets Custom Claims, and writes to Firestore `users/{uid}`
 */
export const callCreateSystemUser = async (userData) => {
  if (isFirebaseConfigured() && functions) {
    const createSystemUserFn = httpsCallable(functions, 'createSystemUser');
    const result = await createSystemUserFn(userData);
    return result.data;
  }
  throw new Error('Firebase Functions belum terkonfigurasi untuk mendaftarkan pengguna baru.');
};

/**
 * Call Cloud Function `updateSystemUser`
 * Updates Auth user, sets Custom Claims, and writes to Firestore `users/{uid}`
 */
export const callUpdateSystemUser = async (userData) => {
  if (isFirebaseConfigured() && functions) {
    const updateSystemUserFn = httpsCallable(functions, 'updateSystemUser');
    const result = await updateSystemUserFn(userData);
    return result.data;
  }
  throw new Error('Firebase Functions belum terkonfigurasi untuk memperbarui pengguna.');
};

/**
 * Call Cloud Function `deleteSystemUser`
 * Deletes user from both Firebase Auth and Firestore `users/{uid}`
 */
export const callDeleteSystemUser = async (targetUid) => {
  if (isFirebaseConfigured() && functions) {
    const deleteSystemUserFn = httpsCallable(functions, 'deleteSystemUser');
    const result = await deleteSystemUserFn({ targetUid });
    return result.data;
  }
  throw new Error('Firebase Functions belum terkonfigurasi untuk menghapus pengguna.');
};

