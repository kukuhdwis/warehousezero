// Authentication service for NDK Warehouse WMS
import { fetchUsers } from './dataService';
import { auth } from './firebase';
import { onIdTokenChanged } from 'firebase/auth';

const STORAGE_KEY = 'wms_user';

export const getStoredUser = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to get stored user:', e);
    return null;
  }
};

export const loginUser = async (email, password) => {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 500));

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  // Retrieve current users from data service / local storage
  const users = await fetchUsers();

  const foundUser = users.find(
    (u) => (u.email || '').toLowerCase() === cleanEmail && (u.password === cleanPassword || (!u.password && cleanPassword === 'admin'))
  );

  if (!foundUser) {
    throw new Error('Email atau kata sandi tidak valid. Silakan periksa kembali kredensial Anda.');
  }

  if (foundUser.status === 'INACTIVE') {
    throw new Error('Akun Anda dinonaktifkan oleh Administrator. Silakan hubungi admin sistem.');
  }

  const { password: _, ...userSession } = foundUser;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userSession));
  return userSession;
};

export const logoutUser = async () => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Setup Real-time ID Token and Role Claims synchronization listener
 * Detects role revocation / claims update and forces fresh token retrieval
 */
export const setupAuthTokenListener = (onClaimsChanged) => {
  if (!auth) return () => {};

  const unsubscribe = onIdTokenChanged(auth, async (user) => {
    if (user) {
      try {
        const idTokenResult = await user.getIdTokenResult(true); // Force Refresh = true
        console.log("Active Custom Claims:", idTokenResult.claims);
        if (onClaimsChanged && typeof onClaimsChanged === 'function') {
          onClaimsChanged(idTokenResult.claims, user);
        }
      } catch (err) {
        console.error("Error refreshing ID token claims:", err);
      }
    }
  });

  return unsubscribe;
};

