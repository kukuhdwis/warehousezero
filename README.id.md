# 📦 NDK Warehouse — Sistem Manajemen Gudang Modern (WMS) V3.0 (Zero-Trust Backend)

![Preview 1](image.png)
![Preview 2](image-1.png)
![Preview 3](image-2.png)

[ 🇬🇧 English Version ](./readme.md) | [ 🇮🇩 Bahasa Indonesia ](./README.id.md)

---

**NDK Warehouse (WarehouseZero)** adalah Sistem Manajemen Gudang (*Warehouse Management System* / WMS) modern berarsitektur **Zero-Trust Backend Mutation**, dibangun menggunakan **React 19**, **Vite**, **Tailwind CSS**, **Google Firebase Cloud Firestore V3.0**, dan **Firebase Cloud Functions (TypeScript)**.

Aplikasi ini dirancang dengan keamanan tingkat tinggi (bulletproof) terhadap manipulasi client, menjamin konsistensi stok secara atomik, melindungi kerahasiaan HPP/margin, mencegah nota fiktif, serta dilengkapi guard limit piutang & tunggakan overdue otomatis.

---

## 🏗️ Prinsip Arsitektur: Zero-Trust Backend Mutation

```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT TIER (Web / POS / Mobile)                          │
│   • Staff Cabang & Pusat HANYA memiliki izin READ terisolasi (Scoped Query).             │
│   • Client DILARANG KERAS melakukan `updateDoc()`, `setDoc()`, atau `addDoc()` langsung   │
│     ke koleksi sensitif (`branch_stocks`, `sales_transactions`, `invoices`).             │
└────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                             │ (HTTPS Callable with Auth Token)
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                         CLOUD FUNCTIONS TIER (Firebase Admin SDK)                        │
│   1. `processPOSSale()`           -> Validasi Stok + Atomic Decrement + Record Sale      │
│   2. `processCustomBundlingSale()`-> Validasi Komponen + Atomic Decrement + Record Bundle│
│   3. `confirmTransferReceipt()`   -> Validasi State + Increment Branch Stock + Close DO  │
│   4. `createStockTransfer()`      -> Validasi Overdue Piutang + Credit Limit Guard       │
│   5. `setUserRoleAndBranch()`     -> Set Claims + Revoke Token Cache                     │
│   6. `updateBranchCreditLimit()`  -> Admin Only + Write to Immutable Audit Log           │
└────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                             │ (Admin SDK Bypass Rules)
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                   DATABASE TIER (Firestore)                              │
│   • `/branch_stocks`          -> `allow write: if false;` (Kebal manipulasi client)      │
│   • `/sales_transactions`     -> `allow write: if false;` (Kebal nota fiktif/palsu)      │
│   • `/product_pricings`       -> `allow write: if false;` (HPP & Margin aman total)      │
│   • `/invoices`               -> `allow write: if false;` (Status piutang anti-tamper)   │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Fitur Unggulan

### 🔐 1. Keamanan Firestore Security Rules V3.0
- **Proteksi Mutasi Stok**: Koleksi `/branch_stocks` dan `/sales_transactions` memiliki aturan `allow write: if false;`, menutup celah manipulasi stok dari peramban.
- **Isolasi Harga Privat**: Koleksi `/product_pricings` (HPP, harga distributor, reseller) terpisah dari katalog publik dan hanya dapat dibaca oleh staf terotentikasi.
- **Scoped Read Access**: Staf cabang hanya dapat membaca data stok, transaksi, dan surat jalan milik cabangnya sendiri (`request.auth.token.branch_id == branchId`).

### ⚡ 2. Core Cloud Functions (Atomic Mutator Engine)
1. **`processPOSSale`**: Memvalidasi kuantitas item, ketersediaan stok cabang, melakukan pemotongan stok secara atomik (`runTransaction`), dan menerbitkan nota transaksi penjualan.
2. **`confirmTransferReceipt`**: Mengelola *strict state machine* perpindahan barang (`IN_TRANSIT` ➔ `RECEIVED`), menambah stok cabang tujuan, dan mencatat waktu penerimaan.
3. **`setUserRoleAndBranch`**: Mengatur Custom Claims (`role`, `branch_id`, `branch_type`), memicu *immediate token revocation* (`revokeRefreshTokens`), dan menyinkronkan profil pengguna.
4. **`updateBranchCreditLimit`**: Memperbarui limit kredit cabang oleh Admin dan mencatat jejak audit permanen yang tidak dapat diubah di `/credit_limit_audit_logs`.
5. **`createStockTransfer`**:
   - **Overdue AR Guard**: Memblokir pengiriman jika cabang tujuan memiliki invoice jatuh tempo yang belum lunas.
   - **Multi-tier Pricing**: Menghitung valuasi berdasarkan tipe cabang (`DISTRIBUTOR`, `RESELLER`, `INTERNAL`).
   - **Credit Limit Plafon Guard**: Menolak transfer jika akumulasi piutang + transfer baru melebihi limit kredit.
   - **Atomic Central Stock Decrement**: Memotong stok gudang pusat dan menerbitkan surat jalan + invoice piutang secara bersamaan.

### 🏢 3. Manajemen Multi-Cabang & Monitoring Pusat
- Pemantauan valuasi stok, status limit kredit, piutang berjalan (*outstanding AR*), dan histori mutasi.
- Tipe cabang fleksibel: `INTERNAL`, `DISTRIBUTOR`, `RESELLER`.
- Skema termin pembayaran: `CASH`, `TEMPO_7_HARI`, `TEMPO_14_HARI`, `TEMPO_30_HARI`.

### 📦 4. Katalog Produk, Barcode & Scanner Kamera
- Generator barcode dan QR Code bawaan bertenaga `bwip-js`.
- Scanner barcode / QR langsung via kamera bertenaga `html5-qrcode`.
- Ekspor laporan inventaris dan transaksi ke format file spreadsheet CSV.

---

## 🛠️ Teknologi yang Digunakan

| Komponen | Teknologi |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/) |
| **Styling & UI** | [Tailwind CSS 3](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/) |
| **Database & Cloud** | [Google Firebase v11](https://firebase.google.com/) (Firestore Cloud Database) |
| **Cloud Functions** | [Firebase Functions v5](https://firebase.google.com/docs/functions) + TypeScript |
| **Barcode Engine** | [bwip-js](https://github.com/metafloor/bwip-js) |
| **Scanner Barcode/QR Kamera** | [html5-qrcode](https://github.com/mebjas/html5-qrcode) |

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### 1. Instalasi Dependensi Frontend & Functions

```bash
# Clone repository
git clone https://github.com/kukuhdwis/warehousezero.git
cd warehousezero

# Install dependensi frontend
npm install

# Install dependensi backend functions
cd functions
npm install
cd ..
```

### 2. Menjalankan Server Pengembangan (Dev)

```bash
npm run dev
```

Buka peramban (browser) di `http://localhost:5173`.

### 3. Membangun untuk Produksi

```bash
# Build frontend
npm run build

# Build Cloud Functions
cd functions
npm run build
cd ..
```

---

## 🚀 Deployment ke Google Firebase

Untuk menerapkan Security Rules, Cloud Functions, dan Hosting ke Firebase:

```bash
# 1. Login Firebase CLI
npx firebase-tools login

# 2. Inisialisasi / pilih project Firebase aktif
npx firebase-tools use <your-project-id>

# 3. Deploy Firestore Rules & Cloud Functions
npx firebase-tools deploy --only firestore:rules,functions

# 4. Deploy Frontend Web Hosting
npx firebase-tools deploy --only hosting
```

---

## 🔐 Kredensial Login Demo Default

Untuk mode simulasi lokal dan instalasi baru, tersedia 2 akun bawaan:

### 1. 🛡️ Akun Super Administrator (Pusat)
- **Email**: `admin@perusahaan.com`
- **Kata Sandi**: `admin`
- **Peran**: `Administrator` (Akses Penuh: Kelola Pengguna, Kelola Cabang, Monitoring Global, Inbound & Outbound)

### 2. 🏢 Akun Khusus Staff Gudang Pusat
- **Email**: `staffpusat@perusahaan.com`
- **Kata Sandi**: `staff`
- **Peran**: `Staff Pusat` (Bisa Monitoring Seluruh Cabang, Operasional Inbound & Outbound, Transaksi Global, **Tanpa Akses Manajemen Pengguna & Cabang**)


---

## 📁 Struktur Direktori Proyek

```text
warehousezero/
├── firestore.rules             # Aturan Keamanan Firestore V3.0 (Zero-Trust)
├── firebase.json               # Konfigurasi Hosting, Functions & Firestore
├── functions/                  # Cloud Functions Backend (TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts            # Atomic Mutator Engine (processPOSSale, confirmTransferReceipt, dll.)
├── public/                     # Aset publik statis
├── src/
│   ├── components/             # Komponen Antarmuka (UI)
│   │   ├── BarcodeModal.jsx    # Modal pembuat label barcode/QR
│   │   ├── BottomNav.jsx       # Navigasi bawah untuk perangkat seluler
│   │   ├── BranchManagement.jsx# CRUD cabang, plafon limit kredit & tipe rekanan
│   │   ├── BranchMonitoring.jsx# Tinjauan analitik seluruh cabang & piutang
│   │   ├── Dashboard.jsx       # Metrik ringkasan & KPI utama
│   │   ├── FirebaseSettingsModal.jsx # Dialog konfigurasi cloud
│   │   ├── LoginView.jsx       # Halaman login otentikasi
│   │   ├── Navbar.jsx          # Bar navigasi atas
│   │   ├── ProductManagement.jsx # Manajemen katalog barang & harga publik
│   │   ├── ScannerModal.jsx    # Modal pemindai kamera live
│   │   ├── Sidebar.jsx         # Navigasi bilah samping
│   │   ├── StockIn.jsx         # Alur pencatatan barang masuk
│   │   ├── StockOut.jsx        # Alur pencatatan barang keluar
│   │   ├── TransactionHistory.jsx # Riwayat log pergerakan stok
│   │   └── UserManagement.jsx  # Manajemen staf, peran RBAC & claims
│   ├── services/
│   │   ├── authService.js      # Pengelola sesi & token refresh listener
│   │   ├── cloudFunctionsService.js # Klien pemanggil Cloud Functions Callable
│   │   ├── dataService.js      # Layanan penyimpanan data & CRUD
│   │   └── firebase.js         # Inisialisasi Firebase App, DB, Auth, Functions
│   ├── App.jsx                 # Tata letak utama & status rute
│   ├── index.css               # Pengaturan gaya global & Tailwind
│   └── main.jsx                # Titik masuk utama aplikasi React
├── package.json                # Daftar pustaka dependensi frontend
├── README.id.md                # Dokumentasi Proyek (Bahasa Indonesia)
├── readme.md                   # Dokumentasi Proyek (English)
├── tailwind.config.js          # Konfigurasi tema Tailwind CSS
└── vite.config.js              # Konfigurasi bundler Vite
```

---

## 👨‍💻 Pengembang

Dikembangkan oleh **[kukuhdwisaputra.site](https://kukuhdwisaputra.site)**.

---

## 📄 Lisensi

Proyek ini berlisensi terbuka di bawah [Lisensi MIT](LICENSE).
