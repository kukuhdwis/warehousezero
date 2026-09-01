# WarehouseZero (WMS)

WarehouseZero adalah Sistem Manajemen Gudang (Warehouse Management System / WMS) berbasis web untuk mengelola inventaris, mutasi stok, dan penjualan multi-cabang. Aplikasi ini dirancang menggunakan arsitektur keamanan terpusat pada sisi server untuk mencegah manipulasi data dari sisi klien.

## Fitur Utama

- **Katalog Publik & Deep Linking**: Halaman katalog publik (`/catalog`) dengan fitur Smart QR Code untuk *deep-linking* detail produk.
- **Pemindai Kamera Barcode & QR Code**: Dukungan pemindaian langsung dari kamera perangkat (HP/Laptop) untuk otomatisasi pencatatan penerimaan dan pengeluaran barang.
- **Sinkronisasi Realtime**: Menggunakan Firestore `onSnapshot` untuk memperbarui antarmuka secara instan tanpa perlu memuat ulang halaman (*zero-refresh*).
- **Manajemen Multi-Cabang**: Mendukung persetujuan mutasi stok antar cabang, penerbitan surat jalan otomatis, dan manajemen piutang/limit kredit cabang.
- **Role-Based Access Control (RBAC)**: Validasi keamanan bertingkat yang diatur melalui *Custom Claims* token pengguna, memastikan staf cabang hanya dapat mengakses data operasional di wilayah kerjanya.
- **Keamanan Zero-Trust Database**: Operasi sensitif seperti pemotongan stok dan pencatatan transaksi dikunci secara absolut pada sisi klien dan hanya dapat dieksekusi secara atomik melalui Firebase Cloud Functions.

## Pembaruan Terbaru

- **Optimasi Database (Zero Double-Fetching)**: Menghapus penarikan data manual secara masal pada saat inisialisasi awal. Sistem kini murni mengandalkan *realtime listener* bawaan dari *cache* lokal, yang secara signifikan memangkas beban baca database (Read Operations) dan mempercepat waktu *loading*.
- **UX Respons Instan**: Menghilangkan fungsi muat ulang otomatis (*reload*) setelah pengguna melakukan tindakan modifikasi data. Perubahan antarmuka kini bereaksi instan mengikuti aliran *WebSocket* Firestore.
- **Penerapan Keamanan RBAC Kritis (Firestore Rules)**: Menutup seluruh celah keamanan terbuka (*default allow*) pada `firestore.rules`. Master data kini berstatus *read-only* bagi karyawan biasa, dan manipulasi stok antar cabang kini divalidasi secara ketat berdasarkan pencocokan ID Cabang dari profil staf.
- **Auto-Migrasi Profil Admin (*Spark Plan Ready*)**: Menyuntikkan skrip migrasi sinkronisasi ID keamanan sisi klien di dalam aplikasi agar akun admin versi *legacy* dapat kembali mengakses hak penuh *Master Produk* tanpa bergantung pada layanan Cloud Functions.
- **Pembaruan Antarmuka Akun**: Menambahkan *dropdown* manajemen profil dan akses *Logout* pada navigasi atas layar, menghilangkan keharusan menggulir daftar inventaris panjang di menu sisi samping (*sidebar*).

## Teknologi & Arsitektur

- **Frontend**: React 19, Vite 6, Tailwind CSS 3, Lucide React
- **Backend & Database**: Firebase Cloud Functions (TypeScript), Firebase Auth, Cloud Firestore
- **Utilitas Tambahan**: `bwip-js` (Barcode Generator), `html5-qrcode` (Kamera Scanner)

## Panduan Instalasi

### 1. Prasyarat Sistem
- Node.js versi 18.x atau lebih baru
- Akun Google Firebase (dengan layanan Firestore, Auth, & Functions yang aktif)
- Firebase CLI (`npm install -g firebase-tools`)

### 2. Instalasi Dependensi

```bash
# Clone repositori
git clone https://github.com/kukuhdwis/warehousezero.git
cd warehousezero

# Install dependensi frontend
npm install

# Install dependensi backend
cd functions
npm install
cd ..
```

### 3. Server Pengembangan

```bash
npm run dev
```
Buka browser di `http://localhost:5173`.

## Deployment ke Firebase

Pastikan Anda sudah login ke Firebase CLI dan telah menunjuk ke ID Proyek yang benar (`firebase use <project-id>`).

```bash
# Deploy Aturan Keamanan Database & Backend Functions
npx firebase-tools deploy --only firestore:rules,functions

# Build & Deploy Frontend App (Firebase Hosting)
npm run build
npx firebase-tools deploy --only hosting
```
