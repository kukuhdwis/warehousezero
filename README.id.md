# 📦 NDK Warehouse — Sistem Manajemen Gudang Modern (WMS)

![Preview 1](image.png)
![Preview 2](image-1.png)
![Preview 3](image-2.png)

[ 🇬🇧 English Version ](./readme.md) | [ 🇮🇩 Bahasa Indonesia ](./README.id.md)

---

**NDK Warehouse** adalah Sistem Manajemen Gudang (*Warehouse Management System* / WMS) modern, responsif, dan ringan yang dibangun menggunakan **React 19**, **Vite**, **Tailwind CSS**, dan **Google Firebase**. Dirancang untuk menyederhanakan pelacakan inventaris multi-cabang, pergerakan stok (Barang Masuk / Barang Keluar), pencetakan & pemindaian barcode/QR, serta kontrol hak akses berbasis peran (*Role-Based Access Control*).

---

## 🌟 Fitur Utama

### 🏢 1. Manajemen Multi-Cabang & Monitoring Pusat
- **Manajemen Pusat & Cabang**: Tambah dan kelola banyak lokasi gudang/cabang dengan kode unik, alamat, dan penanggung jawab (PIC).
- **Monitoring Cabang Real-Time**: Ringkasan total nilai valuasi stok, peringatan stok menipis, dan aktivitas transaksi per cabang.
- **Isolasi Data Cabang**: Staf cabang secara otomatis hanya melihat dan mengelola data inventaris cabang yang ditugaskan kepada mereka.

### 📦 2. Manajemen Inventaris & Produk Lengkap
- **Katalog Produk**: Kelola data SKU, barcode, kategori, harga beli/jual, batas minimum stok, dan jumlah stok terkini.
- **Generator Barcode & QR Code**: Pembuat barcode/QR bawaan berbasis `bwip-js` dengan tombol cetak label siap pakai.
- **Pemindai Kamera Langsung**: Pemindai kamera barcode & QR terintegrasi bertenaga `html5-qrcode` untuk pencarian barang secara cepat.

### 🔄 3. Operasional Barang Masuk & Barang Keluar
- **Barang Masuk (Stock In)**: Catat penerimaan barang dari pemasok atau kiriman gudang pusat dengan penambahan stok otomatis.
- **Barang Keluar (Stock Out)**: Proses pengiriman dan penjualan dengan pengurangan stok seketika serta validasi pencegahan stok minus.
- **Audit Log Lengkap**: Setiap perpindahan barang mencatat waktu presisi, nama operator/staf, jumlah, cabang, dan catatan referensi.

### 📊 4. Riwayat Transaksi & Ekspor CSV
- **Jejak Audit Historis**: Riwayat transaksi barang masuk dan keluar yang dapat difilter berdasarkan tanggal, cabang, dan tipe pergerakan.
- **Ekspor Sekali Klik**: Unduh laporan inventaris dan riwayat transaksi langsung ke format file spreadsheet CSV.

### 👥 5. Kontrol Hak Akses Berbasis Peran (RBAC)
- **Administrator (`ADMIN`)**: Akses penuh ke analitik global seluruh cabang, manajemen cabang, pembuatan akun staf, dan pengaturan sistem.
- **Staf Cabang (`STAFF_BRANCH`)**: Tampilan operasional harian yang fokus pada input barang masuk, barang keluar, dan inventaris lokal cabang.

### ☁️ 6. Arsitektur Hybrid Cloud & Mode Offline
- **Google Firebase Firestore**: Sinkronisasi database cloud waktu-nyata (*real-time*) antar banyak perangkat.
- **Simulasi Lokal (Offline)**: Berjalan mulus tanpa konfigurasi awal menggunakan penyimpanan lokal (*localStorage*) browser untuk demo instan.
- **Penghubung Cloud di Dalam Aplikasi**: Hubungkan project Firebase langsung dari tampilan antarmuka web tanpa perlu mengubah kode sumber.

---

## 🛠️ Teknologi yang Digunakan

| Komponen | Teknologi |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/) |
| **Styling & UI** | [Tailwind CSS 3](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/) |
| **Database & Cloud** | [Google Firebase v11](https://firebase.google.com/) (Firestore Cloud Database) |
| **Barcode Engine** | [bwip-js](https://github.com/metafloor/bwip-js) |
| **Scanner Barcode/QR Kamera** | [html5-qrcode](https://github.com/mebjas/html5-qrcode) |

---

## 🚀 Panduan Memulai

### Prasyarat
- [Node.js](https://nodejs.org/) (disarankan versi 18 ke atas)
- [npm](https://www.npmjs.com/) atau [yarn](https://yarnpkg.com/)

### 1. Instalasi
Kloning repositori dan pasang dependensi:

```bash
git clone https://github.com/kukuhdwis/warehousezero.git
cd warehousezero
npm install
```

### 2. Menjalankan Server Pengembangan (Dev)
Jalankan server lokal:

```bash
npm run dev
```

Buka peramban (browser) dan akses alamat `http://localhost:5173`.

### 3. Membangun untuk Produksi (Build)
Untuk membuat paket build produksi yang teroptimasi:

```bash
npm run build
npm run preview
```

---

## ⚙️ Pengaturan Google Firebase (Opsional)

Untuk mengaktifkan sinkronisasi database cloud permanen antar perangkat:

### Opsi A: Lewat Modal Pengaturan di Aplikasi (Paling Mudah)
1. Buka aplikasi di peramban web.
2. Klik menu **"Google Firebase Platform"** atau ikon Database pada bilah navigasi atas.
3. Tempel kredensial Web App dari [Firebase Console](https://console.firebase.google.com/).
4. Klik **"Simpan & Hubungkan Firebase"**.

### Opsi B: Lewat Berkas Environment (`.env`)
1. Salin berkas `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
2. Isi kredensial Firebase Anda:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
   ```

---

## 🔐 Kredensial Login Demo Default

Untuk mode simulasi lokal dan instalasi baru, kredensial administrator awal adalah:

- **Email**: `admin@perusahaan.com`
- **Kata Sandi**: `admin`
- **Peran**: `Administrator (Pusat)`

---

## 📁 Struktur Direktori Proyek

```text
warehousezero/
├── public/                     # Aset publik statis
├── src/
│   ├── components/             # Komponen Antarmuka (UI)
│   │   ├── BarcodeModal.jsx    # Modal pembuat label barcode/QR
│   │   ├── BottomNav.jsx       # Navigasi bawah untuk perangkat seluler
│   │   ├── BranchManagement.jsx# CRUD & penetapan cabang
│   │   ├── BranchMonitoring.jsx# Tinjauan analitik seluruh cabang
│   │   ├── Dashboard.jsx       # Metrik ringkasan & KPI utama
│   │   ├── FirebaseSettingsModal.jsx # Dialog konfigurasi cloud
│   │   ├── LoginView.jsx       # Halaman login otentikasi
│   │   ├── Navbar.jsx          # Bar navigasi atas
│   │   ├── ProductManagement.jsx # Manajemen katalog barang
│   │   ├── ScannerModal.jsx    # Modal pemindai kamera live
│   │   ├── Sidebar.jsx         # Navigasi bilah samping
│   │   ├── StockIn.jsx         # Alur pencatatan barang masuk
│   │   ├── StockOut.jsx        # Alur pencatatan barang keluar
│   │   ├── TransactionHistory.jsx # Riwayat log pergerakan stok
│   │   └── UserManagement.jsx  # Manajemen staf & peran (RBAC)
│   ├── services/
│   │   ├── authService.js      # Pengelola sesi & otentikasi
│   │   ├── dataService.js      # Layanan penyimpanan data & CRUD
│   │   └── firebase.js         # Inisialisasi klien Firebase
│   ├── App.jsx                 # Tata letak utama & status rute
│   ├── index.css               # Pengaturan gaya global & Tailwind
│   └── main.jsx                # Titik masuk utama aplikasi React
├── .env.example                # Templat variabel lingkungan
├── .gitignore                  # Berkas yang diabaikan Git
├── firebase.json               # Konfigurasi Firebase Hosting
├── package.json                # Daftar pustaka dependensi & skrip
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

