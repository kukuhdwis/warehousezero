# Panduan Akses & Serah Terima Akun Administrator
**Sistem Warehouse Management System (WMS) & E-Katalog Resmi**  
**NDK Exhaust × RGN Performance**

---

## 1. Informasi Akses Portal Sistem

Portal internal Warehouse Management System (WMS) dapat diakses melalui browser komputer (desktop/laptop) maupun smartphone:

| Parameter | Detail |
| :--- | :--- |
| **URL Utama (Production)** | [https://warehouse.ndkexhaust.com/login](https://warehouse.ndkexhaust.com/login) |
| **URL Alternatif (Firebase)** | [https://warehousezero.web.app/login](https://warehousezero.web.app/login) |
| **Akses dari Landing Page** | Buka [https://warehouse.ndkexhaust.com/](https://warehouse.ndkexhaust.com/) lalu klik tombol **"Dashboard"** di pojok kanan atas navbar |
| **E-Katalog Publik** | [https://warehouse.ndkexhaust.com/catalog](https://warehouse.ndkexhaust.com/catalog) |

---

## 2. Kredensial Akun Administrator Utama (Pusat)

Akun ini memiliki hak akses penuh (*Super Administrator / Lord Admin*) ke seluruh cabang, master data, monitoring profit, dan manajemen pengguna:

```yaml
Alamat Email : admin@perusahaan.com
Kata Sandi   : [Silakan masukkan kata sandi yang telah Anda set / default: admin123]
Tingkat Hak  : ADMIN (Semua Cabang / Pusat)
Status       : ACTIVE (Aktif)
```

> [!IMPORTANT]
> Demi keamanan, setelah Anda berhasil masuk untuk pertama kalinya, disarankan untuk menambahkan akun admin baru dengan email resmi perusahaan Anda sendiri melalui menu **Manajemen Pengguna**, atau memperbarui kata sandi Anda.

---

## 3. Langkah-Langkah Masuk (Login)

1. Buka browser (Google Chrome, Safari, atau Microsoft Edge disarankan).
2. Kunjungi halaman [https://warehouse.ndkexhaust.com/login](https://warehouse.ndkexhaust.com/login).
3. Masukkan **Alamat Email** dan **Kata Sandi** administrator Anda.
4. Klik tombol merah **"MASUK KE SISTEM"**.
5. Sistem akan memverifikasi kredensial secara aman dan langsung mengarahkan Anda ke **Dashboard WMS Utama**.

---

## 4. Hak Akses & Fitur yang Dimiliki Administrator

Sebagai Administrator Pusat, Anda memiliki akses penuh ke seluruh modul sistem:

### 📊 A. Dashboard Utama
- **Ringkasan Inventaris**: Total varian produk (SKU), total unit fisik produk, serta total estimasi nilai valuasi rupiah seluruh stok.
- **Monitoring Profit Realtime**: Estimasi total keuntungan penjualan pergerakan barang keluar (*Stock Out*) untuk bulan berjalan.
- **Top Produk Terlaris**: Peringkat 5 produk dengan penjualan unit terbanyak bulan ini dilengkapi badge brand resmi.
- **Peringatan Stok Menipis (Low Stock Alert)**: Daftar produk yang stoknya telah berada di bawah batas minimum (*Min Stock*) dan perlu segera di-restock.
- **Aktivitas Mutasi Terakhir**: Log pergerakan barang masuk & keluar yang terjadi secara realtime.

### 📦 B. Master Data Produk
- Menambah produk knalpot, downpipe, frontpipe, resonator, muffler, dan part racing baru.
- Mengunggah foto produk resolusi tinggi untuk katalog publik.
- Mengatur harga jual ritel (*selling price*), harga modal (*cost price*), dan batas minimum stok aman.
- Menghasilkan dan mencetak **Barcode & Label Smart QR Code** untuk penempelan fisik pada dus/kemasan produk knalpot.
- Mengelola data Brand (NDK Exhaust, RGN Performance, dsb.) dan kategori mesin/kendaraan.

### 📥 C. Barang Masuk (Inbound / Stock In)
- Mencatat penerimaan stok baru dari produksi/supplier ke gudang pusat maupun cabang.
- Menyetujui (*approve*) atau menolak (*reject*) pengajuan transfer stok antar cabang.

### 📤 D. Barang Keluar (Outbound / Kasir Penjualan)
- Mencatat transaksi penjualan / pengiriman barang keluar dari gudang ke konsumen/bengkel.
- Memproses permintaan stok dari cabang (*Branch Stock Request*).
- Menghasilkan cetakan Surat Jalan / Nota Pengiriman resmi.

### 📜 E. Riwayat Transaksi & Laporan
- Jejak audit (*audit trail*) digital menyeluruh atas semua mutasi stok (siapa yang menginput, kapan, jumlah, dan catatannya).
- Filter berdasarkan rentang tanggal, cabang, jenis mutasi, dan pencarian nomor nota.
- Fitur ekspor laporan ke format **Excel (.xlsx)** dan **PDF**.

### 🔍 F. Monitoring Cabang
- Mengawasi stok yang tersebar di toko/cabang mitra secara transparan.
- Melihat margin profit dan performa penjualan masing-masing cabang secara terpisah.

### 👥 G. Manajemen Pengguna (User Management)
- Menambahkan akun baru untuk staff gudang pusat (`STAFF_PUSAT`) atau staff toko cabang (`STAFF_BRANCH`).
- Mengatur penempatan cabang staff.
- Mengaktifkan atau menonaktifkan akun staff yang sudah tidak aktif/bekerja.

### 🏢 H. Kelola Cabang & Gudang (Branch Management)
- Menambah cabang baru (misal: Workshop Purbalingga, Cabang Jakarta, Cabang Surabaya, dsb.).
- Mengatur data penanggung jawab (PIC), nomor kontak, dan alamat gudang cabang.

---

## 5. Panduan Membuat Akun Admin Baru untuk Klien

Jika Anda ingin membuat akun Administrator dengan email pribadi/perusahaan klien sendiri:

1. Masuk ke WMS menggunakan akun admin di atas.
2. Pada menu sebelah kiri, klik **"Manajemen Pengguna"** (atau buka menu lainnya di mobile).
3. Klik tombol **"+ Tambah Pengguna Baru"** di pojok kanan atas.
4. Isi formulir pembuatan akun:
   - **Nama Lengkap**: Nama Klien / Owner
   - **Email**: email.klien@perusahaan.com
   - **Kata Sandi**: minimal 6 karakter kombinasi aman
   - **Role**: Pilih **"Administrator (Pusat)"**
   - **Cabang**: Pilih **"Semua Cabang (Pusat)"**
5. Klik **"Simpan & Daftarkan Pengguna"**.
6. Akun baru tersebut sekarang sudah aktif dan dapat digunakan untuk login langsung dengan hak akses admin penuh.

---

## 6. Bantuan Teknis & Kontak Pengembang

Jika terdapat pertanyaan teknis, kendala saat login, atau kebutuhan kustomisasi lanjutan, silakan hubungi:

- **Pengembang**: Kukuh Dwi Saputra
- **Website**: [https://kukuhdwisaputra.site](https://kukuhdwisaputra.site)
- **Status Sistem**: Online & Protected by Firebase Authentication
