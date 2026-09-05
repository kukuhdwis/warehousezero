import { NDK_LOGO_BASE64, RGN_LOGO_BASE64 } from './pdfLogos';

/**
 * Menggambar Header / Kop Surat Resmi dengan Logo NDK Exhaust dan RGN Performance
 * pada dokumen jsPDF.
 * 
 * @param {import('jspdf').jsPDF} doc - Instance jsPDF aktif
 * @param {Object} options
 * @param {string} options.title - Judul Dokumen (SURAT JALAN / NOTA PENJUALAN / BUKTI PENERIMAAN)
 * @param {string} [options.subtitle] - Subjudul Dokumen
 * @param {string} [options.branchName] - Nama Cabang / Lokasi Gudang
 * @returns {number} startY - Posisi Y awal untuk konten berikutnya
 */
export const drawPdfBrandHeader = (doc, {
  title = "BUKTI TRANSAKSI",
  subtitle = "Sistem Inventaris Resmi NDK Exhaust & RGN Performance",
  branchName = "Gudang Pusat"
} = {}) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  try {
    // 1. Logo NDK Exhaust (Kiri)
    // Rasio asli: 1854 x 710 (~2.61:1) -> w: 23.5mm, h: 9mm
    doc.addImage(NDK_LOGO_BASE64, 'PNG', 14, 10.5, 23.5, 9);

    // 2. Pemisah Vertikal Halus
    doc.setDrawColor(210, 215, 222);
    doc.setLineWidth(0.35);
    doc.line(40.5, 11.5, 40.5, 18.5);

    // 3. Logo RGN Performance (Kanan dari NDK)
    // Rasio asli: 4720 x 932 (~5.06:1) -> w: 38mm, h: 7.5mm
    doc.addImage(RGN_LOGO_BASE64, 'PNG', 43, 11.3, 38, 7.5);
  } catch (err) {
    console.warn("Logo PDF fallback to text:", err);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("NDK EXHAUST  |  RGN PERFORMANCE", 14, 16);
  }

  // Subtitle Lokasi Gudang di Bawah Logo
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Official Exhaust System • Lokasi: ${branchName || 'Gudang Pusat'}`, 14, 23.5);

  // Judul Dokumen di Kanan Atas
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(title, pageWidth - 14, 15.5, { align: 'right' });

  // Subjudul Dokumen di Kanan
  if (subtitle) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, pageWidth - 14, 20.5, { align: 'right' });
  }

  // Garis Pemisah Horizontal
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, 26, pageWidth - 14, 26);

  // Reset warna teks ke default
  doc.setTextColor(15, 23, 42);

  return 32; // startY untuk metadata berikutnya
};
