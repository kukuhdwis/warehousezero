// Authentication service for NDK Warehouse WMS
import { fetchUsers } from './dataService';

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
