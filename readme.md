# 📦 NDK Warehouse — Sistem Manajemen Gudang Modern (WMS) V3.0 (Zero-Trust Backend)

![Preview 1](image.png)
![Preview 2](image-1.png)
![Preview 3](image-2.png)

[ 🇮🇩 Bahasa Indonesia ](./README.md) | [ 🇬🇧 English Version ](./readme.md)

---

## 📌 Ringkasan Proyek

**NDK Warehouse (WarehouseZero)** adalah **Sistem Manajemen Gudang (*Warehouse Management System* / WMS)** tingkat perusahaan (*enterprise-ready*) modern yang dirancang dengan arsitektur **Zero-Trust Backend Mutation**. 

Di bidang manufaktur dan distribusi, aplikasi ini memastikan konsistensi data inventaris multi-cabang, mencegah nota fiktif, mengisolasi informasi HPP/margin keuntungan, serta dilengkapi sistem pengaman limit kredit (*Credit Ceiling Guard*) dan blokir otomatis tunggakan jatuh tempo (*Overdue Accounts Receivable Guard*).

Aplikasi ini dibangun menggunakan ekosistem teknologi modern: **React 19**, **Vite**, **Tailwind CSS**, **Google Firebase Cloud Firestore V3.0**, dan **Firebase Cloud Functions (TypeScript)**.

---

## 🏗️ Arsitektur Keamanan: Zero-Trust Backend Mutation

Sistem ini menerapkan prinsip **Zero-Trust Backend Mutation**, di mana klien (*web browser / POS terminal*) **DILARANG KERAS** melakukan modifikasi langsung (`updateDoc`, `setDoc`, `addDoc`) pada koleksi data krusial seperti stok barang, transaksi penjualan, invoice, dan log audit. Semua operasi penulisan sensitif wajib mengeksekusi **Firebase Cloud Functions** yang berjalan pada **Firebase Admin SDK** yang terlindungi.

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

## 🌟 Fitur Utama Sistem

### 🔐 1. Keamanan Firestore Security Rules V3.0
- **Locked Stock Mutation**: Koleksi `/branch_stocks` dan `/sales_transactions` dikunci dengan aturan `allow write: if false;`, menutup total celah manipulasi stok dari peramban.
- **Isolasi Harga Privat**: Koleksi `/product_pricings` (HPP/COGS, harga distributor, harga reseller) dipisahkan dari katalog produk umum.
- **Scoped Read Access**: Staf cabang hanya diizinkan membaca data stok, transaksi, dan surat jalan milik cabang mereka sendiri (`request.auth.token.branch_id == branchId`).

### ⚡ 2. Core Cloud Functions (Atomic Mutator Engine)
1. **`processPOSSale`**: Memvalidasi kuantitas item & ketersediaan stok cabang, memotong stok secara atomik (`runTransaction`), dan mencatat nota transaksi penjualan.
2. **`confirmTransferReceipt`**: Mengelola transisi *strict state machine* perpindahan barang (`IN_TRANSIT` ➔ `RECEIVED`), menambah stok cabang tujuan secara atomik, serta menutup status Surat Jalan.
3. **`setUserRoleAndBranch`**: Mengatur Custom Claims (`role`, `branch_id`, `branch_type`), memicu pemutusan sesi instan (`revokeRefreshTokens`), dan menyinkronkan profil pengguna.
4. **`updateBranchCreditLimit`**: Memperbarui limit kredit cabang oleh Admin dan mencatat jejak audit permanen di `/credit_limit_audit_logs`.
5. **`createStockTransfer`**:
   - **Overdue AR Guard**: Memblokir pengiriman jika cabang tujuan memiliki invoice jatuh tempo yang belum lunas.
   - **Multi-tier Pricing**: Menghitung valuasi berdasarkan tipe cabang (`DISTRIBUTOR`, `RESELLER`, `INTERNAL`).
   - **Credit Limit Plafon Guard**: Menolak transfer jika akumulasi piutang + transfer baru melebihi limit kredit.
   - **Atomic Central Stock Decrement**: Memotong stok gudang pusat dan menerbitkan surat jalan + invoice piutang secara bersamaan.

### 🏢 3. Manajemen Multi-Cabang & Monitoring Pusat
- Dashboard pemantauan valuasi stok global, piutang berjalan (*Outstanding AR*), penggunaan limit kredit, dan distribusi barang per cabang secara real-time.
- Mendukung tipe kemitraan cabang: `INTERNAL` (Gudang/Cabang Sendiri), `DISTRIBUTOR`, dan `RESELLER`.
- Skema termin pembayaran yang disesuaikan: `CASH`, `TEMPO_7_HARI`, `TEMPO_14_HARI`, `TEMPO_30_HARI`.

### 📦 4. Katalog Produk, Pengajuan Inventaris & Barcode Engine
- Manajemen Katalog Master Produk, Merek (Brand), dan Kategori Mesin.
- Direct Stock Quantity Editing langsung dari katalog inventaris dengan pencatatan riwayat audit log.
- Alur Pengajuan Inventaris Cabang (*Branch Inventory Request & Approval Workflow*).
- Generator Label Barcode (Code128) dan QR Code interaktif bawaan berbasis `bwip-js`.
- Pemindai Barcode & QR Code langsung melalui kamera perangkat berbasis `html5-qrcode`.
- Ekspor riwayat transaksi & inventaris ke format spreadsheet CSV.

### 🛒 5. Penjualan Produk Terpadu (Omnichannel POS & Bundling)
- **Omnichannel Platform Selection**: Mendukung pencatatan transaksi dari berbagai saluran penjualan: **Toko Fisik / Offline (Kasir)**, **Shopee**, **Tokopedia**, **TikTok Shop**, dan **Direct Channel / Lainnya**.
- **Unified Satuan & Bundling**: Fleksibilitas memilih format penjualan per Pcs (satuan) atau Paket Bundling Combo dalam 1 wadah terpadu.
- **Pencegahan & Penggabungan Otomatis Duplikasi Barang**: Logika cerdas yang mencegah duplikasi komponen dalam paket bundling. Pemilihan produk yang sudah ada akan otomatis mendeteksi dan menggabungkan kuantitas (`+1 Qty`) ke baris yang ada serta memicu notifikasi modal interaktif.
- **Detail Transaksi & Pembayaran**: Pencatatan Nama Pembeli/Pemesan, No. Nota/Resi Marketplace, dan Metode Pembayaran (`CASH`, `TRANSFER`, `QRIS`, `MARKETPLACE_ESCROW`).

### 📋 6. Multi-Item Staging Cart & Custom Alert Modal
- **Staging Cart Inbound & Outbound**: Alur barang masuk (`StockIn.jsx`) dan keluar (`StockOut.jsx`) menggunakan 1 Staging Table terpadu dengan penyuntingan kuantitas langsung secara *inline*.
- **Pencarian Cepat & Barcode**: Dilengkapi komponen `ProductSearchPicker` dan *Instant Camera Scanner* untuk memindai Barcode/QR Code tanpa modal berulang.
- **Interactive Glassmorphism Alert Modal**: Seluruh pesan `alert()` bawaan browser diganti dengan `CustomAlertModal.jsx` interaktif berbasis glassmorphism, lencana indikator kategori (Warning, Error, Info), dan desain yang menyatu dengan tema aplikasi.

---


## 🛠️ Teknologi & Library

| Komponen / Layer | Teknologi / Library | Deskripsi |
| :--- | :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/) | Framework SPA modern dengan performa tinggi & Fast Refresh |
| **Styling & UI** | [Tailwind CSS 3](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/) | Responsive Utility-first CSS & Ikonografi modern |
| **Database & Cloud** | [Google Firebase v11](https://firebase.google.com/) | Cloud Firestore DB real-time & Authentication |
| **Backend Mutator Engine** | [Firebase Cloud Functions v5](https://firebase.google.com/docs/functions) | Backend Serverless berbasis TypeScript & Firebase Admin SDK |
| **Barcode Generator** | [bwip-js](https://github.com/metafloor/bwip-js) | Rendering barcode 1D/2D (Code128, QR) dalam bentuk Canvas / Vector |
| **Camera Scanner** | [html5-qrcode](https://github.com/mebjas/html5-qrcode) | Pemindaian Barcode & QR Code via kamera perangkat secara real-time |

---

## 🚀 Panduan Memulai (Getting Started)

### 1. Prasyarat Sistem
- Node.js versi 18.x atau lebih baru
- NPM versi 9.x atau lebih baru
- Akun Google Firebase (dengan proyek Firestore & Cloud Functions aktif)

### 2. Instalasi Dependensi

```bash
# Clone repository ini
git clone https://github.com/kukuhdwis/warehousezero.git
cd warehousezero

# Install dependensi frontend web
npm install

# Install dependensi backend Cloud Functions
cd functions
npm install
cd ..
```

### 3. Menjalankan Server Pengembangan (Local Dev)

```bash
npm run dev
```

Buka peramban browser di `http://localhost:5173`.

### 4. Membangun Bundle Produksi (Build)

```bash
# Build bundle frontend React
npm run build

# Compile Cloud Functions TypeScript
cd functions
npm run build
cd ..
```

---

## 🚀 Deployment ke Google Firebase

Untuk menerapkan aturan keamanan Firestore, Cloud Functions backend, dan Web Hosting ke Firebase:

```bash
# 1. Login ke Firebase CLI
npx firebase-tools login

# 2. Hubungkan ke proyek Firebase Anda
npx firebase-tools use <your-project-id>

# 3. Deploy Firestore Rules & Cloud Functions Backend
npx firebase-tools deploy --only firestore:rules,functions

# 4. Deploy Frontend Web Hosting
npx firebase-tools deploy --only hosting
```

---



## 📁 Struktur Direktori Proyek

```text
warehousezero/
├── firestore.rules             # Aturan Keamanan Firestore V3.0 (Zero-Trust Security Rules)
├── firebase.json               # Konfigurasi Firebase Hosting, Functions & Firestore
├── functions/                  # Cloud Functions Backend (TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts            # Atomic Mutator Engine (processPOSSale, confirmTransferReceipt, dll.)
├── public/                     # Aset statis aplikasi
├── src/
│   ├── components/             # Komponen Antarmuka (UI Components)
│   │   ├── BarcodeModal.jsx    # Modal generator & preview label barcode/QR
│   │   ├── BottomNav.jsx       # Navigasi bawah untuk tampilan mobile
│   │   ├── BranchManagement.jsx# CRUD Cabang, Pengaturan Plafon Kredit & Term Payment
│   │   ├── BranchMonitoring.jsx# Dashboard analitik stok cabang & pemantauan piutang
│   │   ├── CustomAlertModal.jsx# Modal notifikasi alert interaktif glassmorphism
│   │   ├── Dashboard.jsx       # Metrik ringkasan KPI & grafik stok
│   │   ├── GlobalSuccessModal.jsx # Popup konfirmasi sukses universal
│   │   ├── LoginView.jsx       # Halaman Portal Autentikasi Login
│   │   ├── Navbar.jsx          # Bar navigasi atas & Pusat Notifikasi Real-time
│   │   ├── ProductManagement.jsx # Katalog produk, Merek, Kategori & Direct Stock Editing
│   │   ├── ProductSearchPicker.jsx # Picker pencarian produk cepat berbasis pencarian & filter
│   │   ├── ScannerModal.jsx    # Modal pemindai QR / Barcode via kamera live
│   │   ├── Sidebar.jsx         # Bilah navigasi samping (Desktop)
│   │   ├── StockIn.jsx         # Alur Barang Masuk Manifest Staging Cart & Surat Jalan
│   │   ├── StockOut.jsx        # Alur Penjualan Omnichannel Terpadu & Transfer Cabang
│   │   ├── TransactionHistory.jsx # Audit Log riwayat pergerakan stok & ekspor CSV
│   │   └── UserManagement.jsx  # Manajemen staf, penetapan peran RBAC & Custom Claims

│   ├── services/
│   │   ├── authService.js      # Pengelola sesi otentikasi & token listener
│   │   ├── cloudFunctionsService.js # Client caller HTTPS Callable Cloud Functions
│   │   ├── dataService.js      # Layanan penyimpanan data Firestore & CRUD
│   │   └── firebase.js         # Inisialisasi Firebase App, Auth, Firestore & Functions
│   ├── App.jsx                 # Main Application Layout & State Router
│   ├── index.css               # Pengaturan CSS Global & import Tailwind
│   └── main.jsx                # React Root Entry Point
├── package.json                # Pengaturan dependensi frontend
├── README.md                   # Dokumentasi Utama Proyek (Bahasa Indonesia)
├── README.id.md                # Salinan Dokumentasi Bahasa Indonesia
├── readme.md                   # Dokumentasi Versi Bahasa Inggris
├── tailwind.config.js          # Konfigurasi Tema Tailwind CSS
└── vite.config.js              # Konfigurasi Bundler Vite
```

---

## 👨‍💻 Pengembang

Dikembangkan oleh **[kukuhdwisaputra.site](https://kukuhdwisaputra.site)**.

---

## 📄 Lisensi

Proyek ini dirilis di bawah lisensi terbuka [MIT License](LICENSE).
