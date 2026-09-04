# Peta Arsitektur WarehouseZero (CODEBASE MAP)

**Perhatian untuk AI:** Baca dokumen ini TERLEBIH DAHULU sebelum melakukan pencarian (`grep_search`) atau membaca file (`view_file`) secara acak. Tujuannya adalah untuk menghemat penggunaan token.

## 1. Struktur Direktori Utama
*   `src/components/` : Berisi komponen-komponen UI React, mulai dari modal sederhana hingga halaman/view utama yang kompleks.
*   `src/services/` : Tempat semua logika integrasi backend, database (Firebase/Firestore), dan utilitas Cloud Functions.
*   `src/App.jsx` : *Entry point* navigasi aplikasi dan router *state-based*.

## 2. File-file Kritis & Berukuran Sangat Besar (Hati-hati: Ratusan hingga Ribuan Baris)
Jika Anda perlu mengedit salah satu dari file berikut, gunakan parameter `StartLine` dan `EndLine` pada `view_file` atau pecah tugas menjadi kecil-kecil, JANGAN BACA KESELURUHAN secara langsung jika tidak mutlak diperlukan.

### `src/components/`
*   `ProductManagement.jsx` (Sangat Besar - ~2.400 baris): Manajemen master produk, SKU, variasi kemasan, integrasi spreadsheet import, penentuan harga (pricing tier: Retail, Reseller, Distributor), serta sub-tab **Paket Bundling** (`stock_bundles`) dengan form resep komponen dan modal import spreadsheet bundling 16 kolom.
*   `StockOut.jsx` (Sangat Besar - ~2.200 baris): Halaman untuk memproses Barang Keluar (Kasir/Retail, Paket Bundling Dual-Mode: Preset vs Custom dengan harga editable untuk negosiasi, dan Mutasi Pengiriman dari Pusat ke Cabang termasuk fitur tambah dari paket bundling). Validasi harga jual dan pembentukan *cart* penjualan ada di sini.
*   `StockIn.jsx` (Besar - ~900 baris): Halaman untuk mencatat Barang Masuk (Restock, Produksi, dan Penerimaan mutasi dari cabang/pusat).
*   `BranchMonitoring.jsx` (Sedang - ~800 baris): Halaman Dashboard Pusat untuk memonitor aset semua cabang, stok menipis per cabang, detail profit, serta fitur *Purge* riwayat transaksi.
*   `UserManagement.jsx` (Sedang - ~600 baris): Dashboard admin untuk membuat/mengelola akun Staff Cabang dan Pusat.
*   `SpreadsheetImportModal.jsx` (Sedang): Logika impor/ekspor data Excel untuk produk dan stok (kolom Merk & Harga Distributor, auto-registrasi brand baru jika belum terdaftar).
*   `TransactionHistory.jsx`: Menampilkan log transaksi (Masuk/Keluar/Mutasi) dalam bentuk tabel dengan filter tanggal, cabang, dan *staff*.
*   `TransactionSuccessModal.jsx` & `TransactionDetailModal.jsx`: Modal sukses transaksi dan rincian transaksi dengan fitur export nota/surat jalan format PDF (jsPDF + autoTable). Format penamaan file terstandarisasi: `YYYY-MM-DD_[nomor_dokumen].pdf` dan pencetakan watermark/timestamp: `Dicetak pada: DD MMMM YYYY, HH:mm WIB`.

### `src/services/`
*   `dataService.js` (Sangat Besar - ~2.300 baris): "Jantung" interaksi Firestore. Semua fungsi CRUD (`getDocs`, `addDoc`, `updateDoc`, `deleteDoc`) untuk users, branches, products, stock_movements, stock_transfers, brands, dan `stock_bundles` (CRUD + batch import paket bundling). Termasuk fungsi kalkulasi tier pricing (`createSparkPlanStockTransfer` dengan tier DISTRIBUTOR & RESELLER).
*   `authService.js`: Menangani proses login, inisialisasi sesi, dan manajemen *Authentication*.
*   `cloudFunctionsService.js`: Wrapper untuk menembak endpoint Firebase Cloud Functions secara langsung.
*   `spreadsheetService.js`: Fungsi utilitas *parsing* file XLSX (SheetJS), template Excel knalpot (Merk & Harga Distributor), template bundling 16 kolom resmi, dan smart parser parsing teks komposit kolom `Isi`.

## 3. Peta Koleksi Database (Firestore)
*   `users` : Data pengguna (Admin, Staff Pusat, Staff Cabang).
*   `branches` : Data daftar cabang dan gudang (tipe: `DISTRIBUTOR` / `RESELLER`).
*   `brands` : Master merk knalpot / produk (auto-registered saat import spreadsheet jika belum ada).
*   `products` : Master data produk, SKU, kategori, brand, selling_price, reseller_price, distributor_price.
*   `product_pricings` : Logika harga berjenjang (tier pricing: `cost_price`, `reseller_price`, `distributor_price`).
*   `inventory` : Stok barang yang telah disetujui (Approved) secara global maupun per cabang.
*   `stock_movements` : Histori keluar-masuk barang secara mutlak (Audit Log). Fitur Purge akan membersihkan koleksi ini.
*   `stock_transfers` : Dokumen khusus untuk melacak perjalanan barang antar cabang (Transit/Pending/Received).
*   `stock_bundles` : Master paket bundling yang menggabungkan beberapa SKU komponen (`code`, `name`, `brand`, `engine`, `car_variant`, `selling_price`, `reseller_price`, `distributor_price`, `items`: `[{productId, sku, productName, qty, unit}]`).
