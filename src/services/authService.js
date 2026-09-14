// Authentication service for NDK Warehouse WMS
import { initializeApp, getApps } from 'firebase/app';
import { auth, db, isFirebaseConfigured, firebaseConfig } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onIdTokenChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';

const STORAGE_KEY = 'wms_user';

/**
 * Register a new user into Firebase Authentication directly from client side
 * Uses direct Firebase Auth REST API to ensure 100% stateless reliability without session conflicts!
 */
export const registerUserInFirebaseAuth = async (email, password) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanEmail || !cleanPassword) {
    throw new Error('Email dan kata sandi wajib diisi.');
  }

  if (cleanPassword.length < 6) {
    throw new Error('Kata sandi minimal 6 karakter sesuai standar keamanan Firebase.');
  }

  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        password: cleanPassword,
        returnSecureToken: true
      })
    });
    
    const data = await res.json();
    if (data.error) {
      const errMsg = data.error.message || '';
      if (errMsg.includes('EMAIL_EXISTS')) {
        console.warn(`User ${cleanEmail} sudah ada di Firebase Authentication.`);
        return null;
      }
      if (errMsg.includes('WEAK_PASSWORD')) {
        throw new Error('Kata sandi terlalu lemah. Gunakan minimal 6 karakter.');
      }
      if (errMsg.includes('INVALID_EMAIL')) {
        throw new Error('Format alamat email tidak valid.');
      }
      throw new Error(`Firebase Auth error: ${errMsg}`);
    }
    return data.localId; // The new Firebase Auth UID
  } catch (err) {
    console.error("Error in registerUserInFirebaseAuth:", err);
    throw err;
  }
};

/**
 * Synchronize or update a user's password in Firebase Authentication statelessly.
 * When an Administrator updates a user's password in User Management, this ensures
 * the new password is immediately active in Firebase Auth without logging out the Admin.
 */
export const syncUserPasswordInFirebaseAuth = async (email, oldPassword, newPassword) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanNewPass = (newPassword || '').trim();
  const cleanOldPass = (oldPassword || '').trim();

  if (!cleanEmail || !cleanNewPass) return false;
  if (cleanNewPass.length < 6) {
    throw new Error('Kata sandi minimal 6 karakter sesuai standar keamanan Firebase.');
  }

  const apiKey = firebaseConfig.apiKey;

  // 1. Check if the new password is ALREADY valid in Firebase Auth (no sync needed)
  try {
    const testNewRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanNewPass, returnSecureToken: true })
    });
    const testNewData = await testNewRes.json();
    if (testNewData && !testNewData.error && testNewData.idToken) {
      console.log(`[syncUserPassword] ${cleanEmail} sudah tersinkronisasi dengan kata sandi baru.`);
      return true;
    }
  } catch (e) {
    // Continue to step 2
  }

  // 2. Try candidate passwords to authenticate and obtain an idToken to perform accounts:update
  const candidatePasswords = [cleanOldPass, 'NDKProfit10T', 'StaffNDK123'].filter(Boolean);
  const uniqueCandidates = [...new Set(candidatePasswords)];

  for (const candidatePass of uniqueCandidates) {
    try {
      const signInRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: candidatePass, returnSecureToken: true })
      });
      const signInData = await signInRes.json();
      if (signInData && !signInData.error && signInData.idToken) {
        // Successfully obtained idToken! Update password to cleanNewPass
        const updateRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: signInData.idToken,
            password: cleanNewPass,
            returnSecureToken: true
          })
        });
        const updateData = await updateRes.json();
        if (updateData && !updateData.error) {
          console.log(`[syncUserPassword] Berhasil memperbarui kata sandi di Firebase Auth untuk ${cleanEmail}!`);
          return true;
        }
      }
    } catch (e) {
      console.warn(`[syncUserPassword] Percobaan kata sandi lama gagal:`, e);
    }
  }

  // 3. If account does not exist in Firebase Auth yet, register it directly
  try {
    const newUid = await registerUserInFirebaseAuth(cleanEmail, cleanNewPass);
    if (newUid) {
      console.log(`[syncUserPassword] Akun baru berhasil dibuat di Firebase Auth untuk ${cleanEmail}.`);
      return true;
    }
  } catch (e) {
    console.warn(`[syncUserPassword] Registrasi akun baru di Firebase Auth gagal:`, e);
  }

  return false;
};

export const getStoredUser = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to get stored user:', e);
    return null;
  }
};

/**
 * Secure User Login using Firebase Authentication
 */
export const loginUser = async (email, password) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanEmail || !cleanPassword) {
    throw new Error('Email dan kata sandi wajib diisi.');
  }

  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Koneksi Firebase Authentication belum terkonfigurasi. Silakan periksa file .env.');
  }

  // Execute login with a 15-second timeout to prevent UI hanging indefinitely
  const loginPromise = async () => {
    let firebaseUser = null;
    let idTokenResult = null;

    try {
      // 1. Authenticate with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      firebaseUser = userCredential.user;
      idTokenResult = await firebaseUser.getIdTokenResult(true);
    } catch (authError) {
      console.error('Firebase Auth login error:', authError);
      if (
        authError.code === 'auth/user-not-found' ||
        authError.code === 'auth/wrong-password' ||
        authError.code === 'auth/invalid-credential' ||
        authError.code === 'auth/invalid-email'
      ) {
        throw new Error('Email atau kata sandi tidak valid. Silakan periksa kembali kredensial Anda.');
      }
      if (authError.code === 'auth/too-many-requests') {
        throw new Error('Terlalu banyak percobaan login yang gagal. Silakan tunggu beberapa saat atau hubungi administrator.');
      }
      if (authError.code === 'auth/user-disabled') {
        throw new Error('Akun Anda telah dinonaktifkan. Silakan hubungi administrator sistem.');
      }
      throw new Error(`Gagal masuk ke sistem: ${authError.message || 'Terjadi kesalahan pada server autentikasi.'}`);
    }

    // 2. Retrieve user profile details from Firestore using Direct O(1) UID Lookup
    let profileData = {};
    try {
      if (db) {
        // Fast Direct Key-Value Lookup (O(1))
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          profileData = { id: userDocSnap.id, ...userDocSnap.data() };
        } else {
          // Fallback search by email if document ID is not yet matching UID
          const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
          const snap = await getDocs(q);
          if (!snap.empty) {
            profileData = { id: snap.docs[0].id, ...snap.docs[0].data() };
            
            // Auto-migrate legacy document to UID
            if (profileData.id !== firebaseUser.uid) {
              try {
                const newPayload = {
                  ...profileData,
                  id: firebaseUser.uid,
                  uid: firebaseUser.uid,
                };
                const { setDoc, deleteDoc } = await import('firebase/firestore');
                await setDoc(userDocRef, newPayload);
                try {
                  await deleteDoc(doc(db, 'users', profileData.id));
                } catch (delErr) {
                  console.warn('Could not delete old legacy user document:', delErr);
                }
                profileData = newPayload;
              } catch (migErr) {
                console.warn('Auto-migration to UID failed:', migErr);
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Gagal memuat detail profil tambahan dari Firestore:', err);
    }

    // 3. Verify user profile exists in Firestore (unless root admin initial setup)
    if (!profileData.id) {
      if (cleanEmail === 'admin@perusahaan.com') {
        // Root admin fallback profile
        profileData = {
          name: 'Administrator (Pusat)',
          email: 'admin@perusahaan.com',
          role: 'ADMIN',
          branchId: 'ALL',
          branchName: 'Semua Cabang (Pusat)',
          status: 'ACTIVE'
        };
      } else {
        if (auth) await signOut(auth);
        localStorage.removeItem(STORAGE_KEY);
        throw new Error('Akun Anda tidak terdaftar atau telah dihapus oleh Administrator. Silakan hubungi admin sistem.');
      }
    }

    // 4. Check if user is marked INACTIVE in Firestore profile
    if (profileData.status === 'INACTIVE') {
      if (auth) await signOut(auth);
      localStorage.removeItem(STORAGE_KEY);
      throw new Error('Akun Anda telah dinonaktifkan oleh Administrator. Silakan hubungi admin sistem.');
    }

    // 5. If branch staff, verify branch existence & active status in Firestore
    if (profileData.role === 'STAFF_BRANCH' && profileData.branchId && profileData.branchId !== 'ALL') {
      try {
        const branchDocRef = doc(db, 'branches', profileData.branchId);
        const branchDocSnap = await getDoc(branchDocRef);
        if (!branchDocSnap.exists() || branchDocSnap.data()?.status === 'INACTIVE') {
          if (auth) await signOut(auth);
          localStorage.removeItem(STORAGE_KEY);
          throw new Error('Cabang untuk akun ini telah dihapus atau tidak aktif. Silakan hubungi Administrator.');
        }
        if (branchDocSnap.data()?.name) {
          profileData.branchName = branchDocSnap.data().name;
        }
      } catch (brErr) {
        if (brErr.message.includes('telah dihapus')) throw brErr;
        console.warn('Gagal memverifikasi status cabang:', brErr);
      }
    }

    // 6. Construct secure session compatible with App.jsx
    const claims = idTokenResult?.claims || {};
    const userSession = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: profileData.name || firebaseUser.displayName || cleanEmail.split('@')[0],
      role: profileData.role || claims.role || 'STAFF_BRANCH',
      branchId: profileData.branchId || claims.branch_id || 'ALL',
      branchName: profileData.branchName || (claims.branch_name) || (profileData.role === 'ADMIN' ? 'Semua Cabang (Pusat)' : 'Cabang'),
      phone: profileData.phone || '',
      status: profileData.status || 'ACTIVE'
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(userSession));
    return userSession;
  };

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Waktu koneksi habis (Timeout). Koneksi ke Firebase terputus atau sangat lambat. Silakan muat ulang halaman atau periksa internet Anda.'));
    }, 15000);
  });

  return Promise.race([loginPromise(), timeoutPromise]);
};

/**
 * Logout User and clear Firebase Auth & local storage
 */
export const logoutUser = async () => {
  if (auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signout warning:', e);
    }
  }
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
        if (onClaimsChanged && typeof onClaimsChanged === 'function') {
          onClaimsChanged(idTokenResult.claims, user);
        }
      } catch (err) {
        console.error('Error refreshing ID token claims:', err);
      }
    }
  });

  return unsubscribe;
};

/**
 * Change password for the currently logged-in user
 * 1. Re-authenticates using current password for maximum security
 * 2. Updates password in Firebase Authentication
 * 3. Updates password in Firestore /users/{uid} document
 */
export const changeUserPassword = async (currentPassword, newPassword) => {
  if (!auth?.currentUser) {
    throw new Error('Sesi autentikasi tidak ditemukan. Silakan login kembali.');
  }

  const cleanCurrent = (currentPassword || '').trim();
  const cleanNew = (newPassword || '').trim();

  if (!cleanCurrent || !cleanNew) {
    throw new Error('Kata sandi saat ini dan kata sandi baru wajib diisi.');
  }

  if (cleanNew.length < 6) {
    throw new Error('Kata sandi baru minimal 6 karakter sesuai standar keamanan.');
  }

  if (cleanCurrent === cleanNew) {
    throw new Error('Kata sandi baru tidak boleh sama dengan kata sandi saat ini.');
  }

  // 1. Re-authenticate user with current password
  try {
    const credential = EmailAuthProvider.credential(auth.currentUser.email, cleanCurrent);
    await reauthenticateWithCredential(auth.currentUser, credential);
  } catch (authErr) {
    if (
      authErr.code === 'auth/wrong-password' || 
      authErr.code === 'auth/invalid-credential' ||
      authErr.code === 'auth/invalid-login-credentials'
    ) {
      throw new Error('Kata sandi saat ini salah. Silakan periksa kembali kata sandi lama Anda.');
    }
    throw new Error(`Gagal verifikasi kata sandi lama: ${authErr.message || 'Kredensial tidak valid'}`);
  }

  // 2. Update password in Firebase Authentication
  try {
    await updatePassword(auth.currentUser, cleanNew);
  } catch (pwErr) {
    if (pwErr.code === 'auth/weak-password') {
      throw new Error('Kata sandi terlalu lemah. Gunakan kombinasi huruf dan angka minimal 6 karakter.');
    }
    throw new Error(`Gagal memperbarui kata sandi di sistem autentikasi: ${pwErr.message}`);
  }

  // 3. Update Firestore document so Admin / user records remain synchronized
  try {
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userDocRef, {
      password: cleanNew,
      updatedAt: serverTimestamp()
    });
  } catch (docErr) {
    console.warn('Firestore password doc update warning (Firebase Auth is already successfully updated):', docErr);
  }

  return true;
};



