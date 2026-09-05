import * as XLSX from 'xlsx';

/**
 * Sanitasi nilai mata uang / angka dari spreadsheet.
 * Menangani string seperti: "Rp 950.000", "1.250.000,00", " 950,000 ", "Rp. 1.500.000", 950000, dll.
 */
export const cleanCurrency = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.max(0, val);

  let str = String(val).trim();
  // Hapus prefix Rp, rp, RP, spasi
  str = str.replace(/^[rR][pP]\.?\s*/i, '').trim();

  // Jika ada format desimal Indonesia misal 1.250.000,00
  if (/\.\d{3},\d{2}$/.test(str)) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (/,\d{3}\.\d{2}$/.test(str)) {
    // Format US 1,250,000.00
    str = str.replace(/,/g, '');
  } else if (/\.\d{3}$/.test(str)) {
    // 950.000 atau 1.250.000
    str = str.replace(/\./g, '');
  } else if (/,\d{3}$/.test(str)) {
    // 950,000
    str = str.replace(/,/g, '');
  } else {
    // Hapus karakter selain angka dan titik desimal
    str = str.replace(/[^0-9.-]/g, '');
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.max(0, num);
};

/**
 * Ekstraksi kode kategori knalpot untuk pembentukan SKU terstandar.
 */
export const getCategoryAbbreviation = (categoryName = '', productName = '') => {
  const text = `${categoryName} ${productName}`.toLowerCase();

  if (text.includes('downpipe') || text.includes('down pipe')) return 'DP';
  if (text.includes('frontpipe') || text.includes('front pipe')) return 'FP';
  if (text.includes('centerpipe') || text.includes('center pipe') || text.includes('midpipe')) return 'CP';
  if (text.includes('bolt-on') || text.includes('bolt on') || text.includes('bolton')) return 'BO';
  if (text.includes('full system') || text.includes('full-system') || text.includes('fullvalve') || text.includes('full-valve') || text.includes('full valve')) return 'FS';
  if (text.includes('muffler') || text.includes('silencer') || text.includes('tailpipe')) return 'MF';
  if (text.includes('header') || text.includes('manifold')) return 'HD';
  if (text.includes('resonator') || text.includes('res')) return 'RS';
  if (text.includes('valvetronic') || text.includes('valve')) return 'VT';
  if (text.includes('catless') || text.includes('decat')) return 'DC';

  return 'EX';
};

/**
 * Format tipe mesin untuk SKU (membersihkan karakter khusus).
 * Mendukung: 2KD, 2GD/1GD, 4D56, 4N15, ALL, Universal.
 */
export const cleanEngineForSKU = (engineType = '') => {
  if (!engineType) return 'ALL';
  const clean = engineType.trim().toUpperCase();
  if (clean === 'ALL' || clean.includes('UNIVERSAL') || clean.includes('SEMUA') || clean === 'GEN') return 'ALL';
  if (clean.includes('2KD')) return '2KD';
  if (clean.includes('2GD') || clean.includes('1GD')) return '2GD';
  if (clean.includes('4D56')) return '4D56';
  if (clean.includes('4N15')) return '4N15';
  if (clean.includes('1NZ') || clean.includes('2NR')) return '1NZ';
  if (clean.includes('L15') || clean.includes('R18')) return 'L15';
  return clean.replace(/[^A-Z0-9]/g, '').substring(0, 4) || 'ALL';
};

/**
 * Generate Smart SKU dengan format: WZ-[MESIN]-[KODE_KAT]-[NOMOR_URUT]
 * Contoh: WZ-2KD-DP-001, WZ-2GD-BO-002, WZ-4D56-DP-003, WZ-ALL-FS-004
 */
export const generateSmartSKU = (engineType, categoryName, productName, existingSKUsSet, startCounter = 1) => {
  const engineCode = cleanEngineForSKU(engineType);
  const catCode = getCategoryAbbreviation(categoryName, productName);

  let counter = startCounter;
  let skuCandidate = '';

  while (true) {
    const formattedNum = String(counter).padStart(3, '0');
    skuCandidate = `WZ-${engineCode}-${catCode}-${formattedNum}`;
    if (!existingSKUsSet.has(skuCandidate.toLowerCase())) {
      existingSKUsSet.add(skuCandidate.toLowerCase());
      return { sku: skuCandidate, nextCounter: counter + 1 };
    }
    counter++;
  }
};

/**
 * Membuat dan mengunduh Template Excel (.xlsx) resmi katalog knalpot klien.
 */
export const downloadExhaustTemplate = () => {
  const headers = [
    'No',
    'Merk',
    'Kode',
    'Mesin',
    'Nama',
    'Varian Mobil',
    'Harga Jual',
    'Harga Reseller',
    'Harga Distributor',
    'ket'
  ];

  const sampleRows = [
    [
      1,
      'NDK Exhaust',
      'WZ-2KD-DP-001',
      '2KD',
      'Downpipe',
      'Innova 2.5 / Fortuner 2.5',
      1250000,
      950000,
      850000,
      'Street Bass SS Polos'
    ],
    [
      2,
      'RGN Performance',
      'WZ-2GD-BO-002',
      '2GD/1GD',
      'Bolt-on Muffler',
      'Innova Reborn / Fortuner VRZ',
      1600000,
      1200000,
      1050000,
      'Finishing Burntip Blue'
    ],
    [
      3,
      'NDK Exhaust',
      'WZ-2KD-CP-003',
      '2KD',
      'Centerpipe Non-Resonator',
      'Innova / Fortuner / Hilux SC',
      1150000,
      850000,
      750000,
      'Drag Kering Full Stainless'
    ],
    [
      4,
      'NDK Exhaust',
      'WZ-4N15-FP-004',
      '4N15',
      'Frontpipe Racing',
      'Pajero Sport Dakar',
      1500000,
      1100000,
      980000,
      'Drag Sound SS Polos'
    ],
    [
      5,
      'NDK Exhaust',
      '', // Kosong untuk mendemonstrasikan Auto-Generate SKU
      '2GD/1GD',
      'Downpipe + Frontpipe Kit',
      'Hilux Double Cabin / Single Cabin',
      1900000,
      1400000,
      1250000,
      'Contoh baris tanpa kode (Otomatis dibuatkan SKU)'
    ]
  ];

  const worksheetData = [headers, ...sampleRows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Styling / Lebar Kolom
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 18 }, // Merk
    { wch: 18 }, // Kode
    { wch: 14 }, // Mesin
    { wch: 28 }, // Nama
    { wch: 34 }, // Varian Mobil
    { wch: 16 }, // Harga Jual
    { wch: 16 }, // Harga Reseller
    { wch: 18 }, // Harga Distributor
    { wch: 36 }  // ket
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Katalog Produk');

  // Trigger download file
  XLSX.writeFile(workbook, 'Template_Import_Katalog_Exhaust_WZ.xlsx');
};

/**
 * Parsing file Spreadsheet (XLSX, XLS, CSV) menjadi struktur lembar kerja (worksheet).
 * Mendukung pembacaan multi-sheet sekaligus.
 */
export const readSpreadsheetFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetNames = workbook.SheetNames || [];
        if (sheetNames.length === 0) {
          throw new Error("File spreadsheet tidak memiliki lembar kerja (worksheet).");
        }

        const sheetsData = {};
        sheetNames.forEach(sName => {
          const ws = workbook.Sheets[sName];
          sheetsData[sName] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        });

        const activeSheetName = sheetNames[0];
        const rawAoa = sheetsData[activeSheetName] || [];

        if (!rawAoa || rawAoa.length < 1) {
          throw new Error("Spreadsheet kosong atau tidak memiliki data baris.");
        }

        resolve({
          rawAoa,
          sheetNames,
          sheetsData,
          activeSheetName
        });
      } catch (err) {
        reject(new Error(`Gagal membaca file spreadsheet: ${err.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Gagal membaca berkas spreadsheet dari perangkat."));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Mencari indeks kolom berdasarkan berbagai variasi nama header klien.
 */
const findColumnIndex = (headerRow, candidates) => {
  for (let i = 0; i < headerRow.length; i++) {
    const colName = String(headerRow[i] || '').trim().toLowerCase();
    for (const cand of candidates) {
      if (colName === cand.toLowerCase()) return i;
    }
  }
  // Loose search (includes)
  for (let i = 0; i < headerRow.length; i++) {
    const colName = String(headerRow[i] || '').trim().toLowerCase();
    for (const cand of candidates) {
      if (colName.includes(cand.toLowerCase())) return i;
    }
  }
  return -1;
};

/**
 * Deteksi spesifikasi tambahan dari teks keterangan / nama knalpot
 */
export const extractExhaustSpecs = (text = '') => {
  const lower = text.toLowerCase();

  // Karakter Suara
  let spec_sound = 'Street (Bass)';
  if (lower.includes('drag') || lower.includes('kering') || lower.includes('racing')) {
    spec_sound = 'Drag (Kering)';
  } else if (lower.includes('silent') || lower.includes('standar') || lower.includes('senyap') || lower.includes('halus')) {
    spec_sound = 'Silent';
  } else if (lower.includes('bass') || lower.includes('street')) {
    spec_sound = 'Street (Bass)';
  }

  // Resonator
  const spec_resonator = !lower.includes('non-resonator') && !lower.includes('non resonator') && !lower.includes('tanpa resonator');

  // Finishing / Material
  let material_finish = 'SS Polos';
  if (lower.includes('burntip') || lower.includes('burn tip') || lower.includes('blue tip')) {
    material_finish = 'SS Burntip';
  } else if (lower.includes('look titanium') || lower.includes('look ti')) {
    material_finish = 'SS Look Titanium';
  } else if (lower.includes('titanium') && !lower.includes('look')) {
    material_finish = 'Titanium Asli';
  } else if (lower.includes('carbon') || lower.includes('karbon')) {
    material_finish = 'Carbon Tip';
  }

  return { spec_sound, spec_resonator, material_finish };
};

/**
 * Validasi dan Transformasi baris spreadsheet menjadi format Master Data Produk.
 * Menghasilkan statistik (total, valid, duplicate, error) dan list item siap import.
 */
export const processSpreadsheetData = (rawAoa, existingProducts = [], duplicateMode = 'UPDATE') => {
  if (!rawAoa || rawAoa.length < 1) {
    throw new Error("File spreadsheet tidak memiliki data.");
  }

  // Auto-Discovery Header Row (mencari baris yang memiliki kecocokan nama kolom terbanyak)
  let headerRowIndex = 0;
  let maxMatchedCols = -1;

  for (let r = 0; r < Math.min(rawAoa.length, 10); r++) {
    const row = rawAoa[r] || [];
    const strRow = row.map(cell => String(cell || '').trim());
    const matched = ['nama', 'mesin', 'varian', 'harga', 'kode', 'reseller', 'jual', 'profit', 'no']
      .filter(k => strRow.some(cell => cell.toLowerCase().includes(k))).length;
    if (matched > maxMatchedCols) {
      maxMatchedCols = matched;
      headerRowIndex = r;
    }
  }

  const headerRow = (rawAoa[headerRowIndex] || []).map(h => String(h || '').trim());

  // Mapping indeks kolom
  const idxNo = findColumnIndex(headerRow, ['no', 'nomor', 'num', '#']);
  const idxMerk = findColumnIndex(headerRow, ['merk', 'brand', 'merek']);
  const idxKode = findColumnIndex(headerRow, ['kode', 'sku', 'code', 'kode produk', 'product code']);
  const idxMesin = findColumnIndex(headerRow, ['mesin', 'engine', 'tipe mesin', 'engine type', 'tipe_mesin']);
  const idxNama = findColumnIndex(headerRow, ['nama', 'name', 'nama produk', 'product name', 'komponen', 'kategori']);
  const idxVarian = findColumnIndex(headerRow, ['varian mobil', 'varian', 'mobil', 'car variant', 'kendaraan', 'kompatibilitas', 'tipe mobil']);
  const idxJual = findColumnIndex(headerRow, ['harga jual', 'harga', 'jual', 'retail', 'selling price', 'harga retail', 'price']);
  const idxReseller = findColumnIndex(headerRow, ['harga reseller', 'reseller', 'harga agen', 'harga b2b', 'reseller price', 'hpp']);
  const idxDistributor = findColumnIndex(headerRow, ['harga distributor', 'distributor', 'distributor price', 'harga grosir', 'grosir']);
  const idxProfit = findColumnIndex(headerRow, ['profit', 'laba', 'margin', 'keuntungan']);
  const idxKet = findColumnIndex(headerRow, ['ket', 'keterangan', 'notes', 'catatan', 'deskripsi', 'description']);
  const idxPercent = findColumnIndex(headerRow, ['%', 'persen', 'persentase', 'margin %', 'profit %', 'percentage']);

  // Set existing SKUs untuk deteksi duplikat & auto SKU generator
  const existingSKUsSet = new Set();
  const existingProductMapBySKU = new Map();
  const existingProductMapByNameEngine = new Map();

  existingProducts.forEach(p => {
    if (p.sku) {
      const lowerSKU = p.sku.trim().toLowerCase();
      existingSKUsSet.add(lowerSKU);
      existingProductMapBySKU.set(lowerSKU, p);
    }
    if (p.name && (p.engine_type || p.engineType)) {
      const key = `${p.name.trim().toLowerCase()}__${(p.engine_type || p.engineType || '').trim().toLowerCase()}`;
      existingProductMapByNameEngine.set(key, p);
    }
  });

  const parsedItems = [];
  let validCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  let autoSkuCount = 0;
  let startSkuCounter = existingProducts.length + 1;

  for (let r = headerRowIndex + 1; r < rawAoa.length; r++) {
    const row = rawAoa[r];
    if (!row || row.every(cell => String(cell || '').trim() === '')) {
      continue; // Lewati baris kosong
    }

    const rowNumber = r + 1;
    const rawNo = idxNo >= 0 ? row[idxNo] : (r - headerRowIndex);
    const rawMerk = idxMerk >= 0 ? String(row[idxMerk] || '').trim() : '';
    const rawKode = idxKode >= 0 ? String(row[idxKode] || '').trim() : '';
    let rawMesin = idxMesin >= 0 ? String(row[idxMesin] || '').trim() : '';
    const rawNama = idxNama >= 0 ? String(row[idxNama] || '').trim() : '';
    const rawVarian = idxVarian >= 0 ? String(row[idxVarian] || '').trim() : '';
    const rawJual = idxJual >= 0 ? row[idxJual] : '';
    const rawReseller = idxReseller >= 0 ? row[idxReseller] : '';
    const rawDistributor = idxDistributor >= 0 ? row[idxDistributor] : '';
    const rawKet = idxKet >= 0 ? String(row[idxKet] || '').trim() : '';

    // Normalisasi Tipe Mesin jika kosong tetapi terdeteksi di teks nama/varian
    if (!rawMesin) {
      const combText = `${rawNama} ${rawVarian}`.toUpperCase();
      if (combText.includes('2KD')) rawMesin = '2KD';
      else if (combText.includes('2GD') || combText.includes('1GD')) rawMesin = '2GD/1GD';
      else if (combText.includes('4D56')) rawMesin = '4D56';
      else if (combText.includes('4N15')) rawMesin = '4N15';
      else rawMesin = 'ALL';
    }

    const sellingPrice = cleanCurrency(rawJual);
    const resellerPrice = cleanCurrency(rawReseller);
    const distributorPrice = cleanCurrency(rawDistributor) || (resellerPrice > 0 ? resellerPrice : sellingPrice);

    // Kalkulasi Profit & Persentase Keuntungan
    let profitAmount = sellingPrice - resellerPrice;
    let profitPercentage = resellerPrice > 0 ? ((profitAmount / resellerPrice) * 100) : 0;
    profitPercentage = Math.round(profitPercentage * 100) / 100;

    // Validasi baris
    const rowErrors = [];
    const rowWarnings = [];

    if (!rawNama) {
      rowErrors.push("Nama Produk / Komponen tidak boleh kosong.");
    }
    if (resellerPrice <= 0 && sellingPrice <= 0) {
      rowWarnings.push("Harga Reseller dan Harga Jual bernilai Rp 0.");
    } else if (sellingPrice < resellerPrice) {
      rowWarnings.push("Harga Jual lebih rendah dari Harga Reseller (Margin Negatif).");
    }

    // SKU Handling
    let finalSKU = rawKode;
    let isAutoGeneratedSKU = false;

    if (!finalSKU) {
      const generated = generateSmartSKU(
        rawMesin || 'ALL',
        rawNama,
        rawNama,
        existingSKUsSet,
        startSkuCounter
      );
      finalSKU = generated.sku;
      startSkuCounter = generated.nextCounter;
      isAutoGeneratedSKU = true;
      autoSkuCount++;
    } else {
      existingSKUsSet.add(finalSKU.toLowerCase());
    }

    // Duplicate Checking
    const existingMatch = existingProductMapBySKU.get(finalSKU.toLowerCase()) ||
      existingProductMapByNameEngine.get(`${rawNama.toLowerCase()}__${rawMesin.toLowerCase()}`);

    const isDuplicate = Boolean(existingMatch);
    if (isDuplicate) {
      duplicateCount++;
      if (duplicateMode === 'UPDATE') {
        rowWarnings.push(`SKU / Produk sudah ada (${existingMatch.name}). Data lama akan diperbarui.`);
      } else {
        rowWarnings.push(`SKU / Produk sudah ada (${existingMatch.name}). Baris ini akan dilewati.`);
      }
    }

    // Ekstraksi spesifikasi tambahan dari keterangan
    const fullSpecText = `${rawNama} ${rawKet} ${rawVarian}`;
    const specs = extractExhaustSpecs(fullSpecText);

    // Kategori knalpot
    let categoryName = 'Downpipe';
    const lowerNama = rawNama.toLowerCase();
    if (lowerNama.includes('frontpipe') || lowerNama.includes('front pipe')) categoryName = 'Frontpipe';
    else if (lowerNama.includes('centerpipe') || lowerNama.includes('center pipe') || lowerNama.includes('midpipe')) categoryName = 'Centerpipe';
    else if (lowerNama.includes('bolt-on') || lowerNama.includes('bolt on') || lowerNama.includes('bolton')) categoryName = 'Bolt-on';
    else if (lowerNama.includes('full system') || lowerNama.includes('full-system') || lowerNama.includes('fullvalve') || lowerNama.includes('full-valve') || lowerNama.includes('full valve')) categoryName = 'Full System';
    else if (lowerNama.includes('muffler') || lowerNama.includes('silencer') || lowerNama.includes('tailpipe')) categoryName = 'Muffler / Silencer';
    else if (lowerNama.includes('header') || lowerNama.includes('manifold')) categoryName = 'Header / Manifold';
    else if (lowerNama.includes('resonator')) categoryName = 'Resonator';
    else if (lowerNama.includes('downpipe')) categoryName = 'Downpipe';
    else categoryName = rawNama;

    const isValid = rowErrors.length === 0;
    if (isValid) {
      validCount++;
    } else {
      errorCount++;
    }

    parsedItems.push({
      rowNumber,
      no: rawNo || (r - headerRowIndex),
      sku: finalSKU,
      isAutoGeneratedSKU,
      name: rawNama || 'Produk Tanpa Nama',
      engine_type: rawMesin || 'ALL',
      car_variant: rawVarian || '-',
      category_name: categoryName,
      spec_sound: specs.spec_sound,
      spec_resonator: specs.spec_resonator,
      material_finish: specs.material_finish,
      reseller_price: resellerPrice,
      selling_price: sellingPrice,
      distributor_price: distributorPrice,
      price: sellingPrice, // Backward compatibility
      profit_amount: profitAmount,
      profit_percentage: profitPercentage,
      notes: rawKet || '',
      minStock: 5,
      currentStock: 0,
      unit: 'Pcs',
      status: 'ACTIVE',
      brand: rawMerk || 'NDK Exhaust',
      machineCategory: rawMesin || 'ALL',
      isDuplicate,
      existingId: existingMatch?.id || null,
      isValid,
      errors: rowErrors,
      warnings: rowWarnings
    });
  }

  return {
    totalRows: parsedItems.length,
    validCount,
    duplicateCount,
    errorCount,
    autoSkuCount,
    duplicateMode,
    items: parsedItems
  };
};

/**
 * Membuat dan mengunduh Template Excel (.xlsx) resmi Paket Bundling dari format 16 kolom klien.
 */
export const downloadBundleTemplate = () => {
  const headers = [
    'No',
    'Merk',
    'Kode',
    'Mesin',
    'Nama Bundle',
    'Harga Jual',
    'Harga Reseller',
    'Harga Distributor',
    'Mesin',
    'Isi',
    'Varian Mobil',
    'Profit Reseller',
    '%',
    'Profit Distributor',
    '%',
    'ket'
  ];

  const sampleRows = [
    [
      1,
      'NDK Exhaust',
      'WZ-BNDL-2KD-001',
      '2KD',
      'Paket Full System 2KD',
      3500000,
      2700000,
      2400000,
      '2KD',
      'Downpipe + Frontpipe + Centerpipe',
      'Innova 2.5 / Fortuner 2.5',
      800000,
      '29.63%',
      1100000,
      '45.83%',
      'Street Bass SS Polos'
    ],
    [
      2,
      'RGN Performance',
      'WZ-BNDL-2GD-002',
      '2GD/1GD',
      'Paket Stage 1 2GD',
      2800000,
      2200000,
      1950000,
      '2GD/1GD',
      'Downpipe + Bolt-on Muffler',
      'Innova Reborn / Fortuner VRZ',
      600000,
      '27.27%',
      850000,
      '43.59%',
      'Finishing Burntip Blue'
    ],
    [
      3,
      'NDK Exhaust',
      'WZ-BNDL-4D56-003',
      '4D56',
      'Paket Racing Drag 4D56',
      3100000,
      2400000,
      2100000,
      '4D56',
      'Downpipe + Frontpipe Racing',
      'Pajero Sport / Strada Triton',
      700000,
      '29.17%',
      1000000,
      '47.62%',
      'Drag Sound Kering Stainless'
    ]
  ];

  const worksheetData = [headers, ...sampleRows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 18 }, // Merk
    { wch: 18 }, // Kode
    { wch: 14 }, // Mesin
    { wch: 28 }, // Nama Bundle
    { wch: 16 }, // Harga Jual
    { wch: 16 }, // Harga Reseller
    { wch: 18 }, // Harga Distributor
    { wch: 12 }, // Mesin (dup)
    { wch: 38 }, // Isi
    { wch: 32 }, // Varian Mobil
    { wch: 16 }, // Profit Reseller
    { wch: 10 }, // %
    { wch: 18 }, // Profit Distributor
    { wch: 10 }, // %
    { wch: 30 }  // ket
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Bundle');
  XLSX.writeFile(workbook, 'Template_Import_Bundle_Exhaust_WZ.xlsx');
};

/**
 * Parser file Spreadsheet Paket Bundling format resmi 16 kolom klien.
 * Melakukan smart parsing pada kolom 'Isi' untuk mendeteksi komponen produk & kuantitas.
 */
export const processBundleSpreadsheetData = (rawAoa = [], existingProducts = []) => {
  if (!rawAoa || rawAoa.length < 2) {
    throw new Error("File spreadsheet bundling kosong atau tidak memiliki data.");
  }

  // Cari index header row
  let headerRowIndex = 0;
  let maxMatchedCols = 0;
  const keywords = ['nama bundle', 'bundle', 'paket', 'isi', 'harga', 'kode', 'mesin'];

  for (let r = 0; r < Math.min(10, rawAoa.length); r++) {
    const strRow = (rawAoa[r] || []).map(cell => String(cell || '').trim());
    const matched = keywords.filter(k => strRow.some(cell => cell.toLowerCase().includes(k))).length;
    if (matched > maxMatchedCols) {
      maxMatchedCols = matched;
      headerRowIndex = r;
    }
  }

  const headerRow = (rawAoa[headerRowIndex] || []).map(h => String(h || '').trim());

  // Cari semua kolom mesin (kolom mesin utama vs kolom mesin komponen)
  const mesinIndices = [];
  headerRow.forEach((h, i) => {
    const col = String(h || '').trim().toLowerCase();
    if (col === 'mesin' || col === 'engine' || col.includes('tipe mesin') || col.includes('mesin utama') || col.includes('mesin komponen')) {
      mesinIndices.push(i);
    }
  });

  const idxNo = findColumnIndex(headerRow, ['no', '#', 'nomor']);
  const idxMerk = findColumnIndex(headerRow, ['merk', 'brand', 'merek']);
  const idxKode = findColumnIndex(headerRow, ['kode', 'sku', 'code', 'kode bundle', 'kode paket']);
  const idxNama = findColumnIndex(headerRow, ['nama bundle', 'nama paket', 'nama', 'bundle name', 'paket']);
  const idxJual = findColumnIndex(headerRow, ['harga jual', 'jual', 'retail', 'selling price', 'harga']);
  const idxReseller = findColumnIndex(headerRow, ['harga reseller', 'reseller', 'harga b2b']);
  const idxDistributor = findColumnIndex(headerRow, ['harga distributor', 'distributor', 'harga grosir']);
  const idxIsi = findColumnIndex(headerRow, ['isi', 'komponen', 'isi paket', 'items', 'komponen bundle']);
  const idxVarian = findColumnIndex(headerRow, ['varian mobil', 'varian', 'mobil', 'car variant']);
  const idxKet = findColumnIndex(headerRow, ['ket', 'keterangan', 'notes', 'catatan']);

  // Tentukan kolom Mesin Utama (SS 3: kolom mesin sebelum Nama Bundle)
  // dan kolom Mesin Komponen (SS 5: kolom mesin kedua sebelum/dekat kolom Isi)
  let idxMesinUtama = findColumnIndex(headerRow, ['mesin utama', 'tipe mesin utama', 'mesin paket']);
  let idxMesinKomponen = findColumnIndex(headerRow, ['mesin komponen', 'tipe mesin komponen', 'mesin isi', 'mesin part', 'mesin kedua']);

  if (idxMesinUtama === -1) {
    idxMesinUtama = mesinIndices.length > 0 ? mesinIndices[0] : -1;
  }

  if (idxMesinKomponen === -1) {
    // Jika ada lebih dari 1 kolom mesin di sheet (seperti pada SS 3 & SS 5), ambil yang kedua sebagai mesin komponen
    if (mesinIndices.length > 1) {
      idxMesinKomponen = mesinIndices[1];
    } else {
      idxMesinKomponen = idxMesinUtama;
    }
  }

  // Pre-build index pencarian produk
  const productBySku = new Map();
  const productsList = existingProducts || [];
  productsList.forEach(p => {
    if (p.sku) productBySku.set(p.sku.trim().toLowerCase(), p);
    if (p.code) productBySku.set(p.code.trim().toLowerCase(), p);
  });

  // Step 1: Kelompokkan baris-baris Excel berdasarkan paket bundling.
  // Seringkali pada spreadsheet klien, 1 paket bundling memiliki komponen di beberapa baris ke bawah
  // (baris pertama berisi Nama & Harga Paket, baris-baris berikutnya hanya berisi kolom 'Isi').
  const bundleGroups = [];
  let currentGroup = null;

  for (let r = headerRowIndex + 1; r < rawAoa.length; r++) {
    const row = rawAoa[r];
    if (!row || row.every(cell => String(cell || '').trim() === '')) continue;

    const rawNo = idxNo >= 0 ? row[idxNo] : '';
    const rawMerk = idxMerk >= 0 ? String(row[idxMerk] || '').trim() : '';
    const rawKode = idxKode >= 0 ? String(row[idxKode] || '').trim() : '';
    const rawMesinUtama = idxMesinUtama >= 0 ? String(row[idxMesinUtama] || '').trim() : '';
    const rawMesinKomponen = idxMesinKomponen >= 0 ? String(row[idxMesinKomponen] || '').trim() : '';
    const rawNama = idxNama >= 0 ? String(row[idxNama] || '').trim() : '';
    const rawJual = idxJual >= 0 ? row[idxJual] : '';
    const rawReseller = idxReseller >= 0 ? row[idxReseller] : '';
    const rawDistributor = idxDistributor >= 0 ? row[idxDistributor] : '';
    const rawIsi = idxIsi >= 0 ? String(row[idxIsi] || '').trim() : '';
    const rawVarian = idxVarian >= 0 ? String(row[idxVarian] || '').trim() : '';
    const rawKet = idxKet >= 0 ? String(row[idxKet] || '').trim() : '';

    // Deteksi awal bundle baru: memiliki Nama Bundle ATAU (memiliki Kode & Harga Jual)
    const isNewBundle = Boolean(rawNama || (rawKode && (rawJual !== '' && rawJual !== null && rawJual !== undefined)));

    if (isNewBundle) {
      if (currentGroup) {
        bundleGroups.push(currentGroup);
      }
      currentGroup = {
        rowNumber: r + 1,
        no: rawNo,
        brand: rawMerk,
        code: rawKode,
        engine_type: rawMesinUtama,
        engine: rawMesinUtama,
        name: rawNama,
        rawJual,
        rawReseller,
        rawDistributor,
        rawVarian,
        rawKet,
        itemsRaw: rawIsi ? [{ text: rawIsi, engine: rawMesinKomponen || rawMesinUtama }] : []
      };
    } else if (currentGroup && rawIsi) {
      // Sub-baris komponen milik paket yang sedang aktif
      currentGroup.itemsRaw.push({
        text: rawIsi,
        engine: rawMesinKomponen || currentGroup.engine_type
      });
      if (!currentGroup.rawVarian && rawVarian) currentGroup.rawVarian = rawVarian;
      if (!currentGroup.rawKet && rawKet) currentGroup.rawKet = rawKet;
      if (!currentGroup.brand && rawMerk) currentGroup.brand = rawMerk;
      if (!currentGroup.engine_type && rawMesinUtama) {
        currentGroup.engine_type = rawMesinUtama;
        currentGroup.engine = rawMesinUtama;
      }
    }
  }

  if (currentGroup) {
    bundleGroups.push(currentGroup);
  }

  // Step 2: Proses setiap grup bundle dan komponen-komponen isinya
  const parsedBundles = [];
  let validCount = 0;
  let errorCount = 0;

  bundleGroups.forEach((bg, bIdx) => {
    const sellingPrice = cleanCurrency(bg.rawJual);
    const resellerPrice = cleanCurrency(bg.rawReseller);
    const distributorPrice = cleanCurrency(bg.rawDistributor) || (resellerPrice > 0 ? resellerPrice : sellingPrice);

    const rowErrors = [];
    const rowWarnings = [];

    if (!bg.name && !bg.code) {
      return;
    }
    if (!bg.name) {
      rowErrors.push("Nama Bundle tidak boleh kosong.");
    }

    // Format nama bundle: sertakan tipe mesin utama jika belum ada di dalam nama bundle
    const mainEngine = (bg.engine_type || '').trim();
    let finalBundleName = bg.name || '';
    if (mainEngine && mainEngine.toUpperCase() !== 'UNIVERSAL' && mainEngine.toUpperCase() !== 'ALL') {
      if (!finalBundleName.toLowerCase().includes(mainEngine.toLowerCase())) {
        finalBundleName = `${finalBundleName} - ${mainEngine}`;
      }
    }

    // Gabungkan dan petakan seluruh item dari baris utama dan sub-baris ke bawah
    const componentEntries = [];
    (bg.itemsRaw || []).forEach(rawItemObj => {
      const rawText = typeof rawItemObj === 'string' ? rawItemObj : rawItemObj?.text || '';
      const itemEngine = (typeof rawItemObj === 'object' && rawItemObj?.engine) ? rawItemObj.engine : bg.engine_type || '';
      
      const parts = rawText
        ? rawText.split(/[\+,\;\n]+/).map(s => s.trim()).filter(Boolean)
        : [];
      
      parts.forEach(part => {
        componentEntries.push({ text: part, engine: itemEngine });
      });
    });

    const parsedComponents = componentEntries.map(entry => {
      const compStr = entry.text;
      const compEngine = entry.engine || bg.engine_type || '';
      let qty = 1;
      let cleanComp = compStr;

      const qtyMatchPrefix = cleanComp.match(/^(\d+)\s*[xX*]\s*(.+)$/);
      if (qtyMatchPrefix) {
        qty = Number(qtyMatchPrefix[1]) || 1;
        cleanComp = qtyMatchPrefix[2].trim();
      } else {
        const qtyMatchSuffix = cleanComp.match(/^(.+?)\s*\((\d+)\s*(?:pcs|pc|set)?\)$/i);
        if (qtyMatchSuffix) {
          qty = Number(qtyMatchSuffix[2]) || 1;
          cleanComp = qtyMatchSuffix[1].trim();
        }
      }

      // 1. Cocokkan SKU persis
      let matchedProd = productBySku.get(cleanComp.toLowerCase());

      // 2. Cocokkan Nama & Mesin Komponen (SS 5: Mesin Kedua)
      if (!matchedProd) {
        const lowerComp = cleanComp.toLowerCase();
        const lowerEngine = (compEngine || bg.engine_type || '').toLowerCase();
        matchedProd = productsList.find(p => {
          const pName = (p.name || '').toLowerCase();
          const pEngine = (p.engine_type || p.machineCategory || p.kategoriMesin || '').toLowerCase();
          const matchesName = pName.includes(lowerComp) || lowerComp.includes(pName);
          const matchesEngine = !lowerEngine || lowerEngine === 'all' || pEngine.includes(lowerEngine) || lowerEngine.includes(pEngine);
          return matchesName && matchesEngine;
        });
      }

      // 3. Cocokkan Kategori Knalpot & Mesin Komponen
      if (!matchedProd) {
        const lowerComp = cleanComp.toLowerCase();
        const lowerEngine = (compEngine || bg.engine_type || '').toLowerCase();
        const categoryKeyword = ['downpipe', 'frontpipe', 'centerpipe', 'bolt-on', 'muffler', 'resonator', 'header']
          .find(k => lowerComp.includes(k));

        if (categoryKeyword) {
          matchedProd = productsList.find(p => {
            const pCat = (p.category_name || p.name || '').toLowerCase();
            const pEngine = (p.engine_type || p.machineCategory || p.kategoriMesin || '').toLowerCase();
            const matchesCat = pCat.includes(categoryKeyword);
            const matchesEngine = !lowerEngine || lowerEngine === 'all' || pEngine.includes(lowerEngine);
            return matchesCat && matchesEngine;
          });
        }
      }

      const effectiveEngine = compEngine || matchedProd?.engine_type || matchedProd?.machineCategory || bg.engine_type || '';

      return {
        rawName: compStr,
        cleanName: cleanComp,
        detail: cleanComp, // Detail isi komponen dari datasheet
        engine_type: effectiveEngine, // Tipe mesin komponen dari kolom mesin kedua
        engine: effectiveEngine,
        qty,
        productId: matchedProd ? matchedProd.id : null,
        productName: matchedProd ? matchedProd.name : cleanComp,
        sku: matchedProd ? matchedProd.sku : '',
        unit: matchedProd?.unit || 'Pcs',
        isMatched: Boolean(matchedProd)
      };
    });

    if (parsedComponents.length === 0) {
      rowWarnings.push("Kolom 'Isi' belum memiliki rincian komponen.");
    } else {
      const unmatched = parsedComponents.filter(c => !c.isMatched);
      if (unmatched.length > 0) {
        rowWarnings.push(`${unmatched.length} komponen akan disimpan sebagai item paket.`);
      }
    }

    const isValid = rowErrors.length === 0;
    if (isValid) validCount++;
    else errorCount++;

    // Generate smart bundle code if empty
    let finalCode = bg.code;
    if (!finalCode) {
      const engTag = (bg.engine_type || 'EXH').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'BDL';
      const padNum = String(parsedBundles.length + 1).padStart(3, '0');
      finalCode = `BDL-${engTag}-${padNum}`;
    }

    parsedBundles.push({
      rowNumber: bg.rowNumber,
      no: bg.no || (parsedBundles.length + 1),
      brand: bg.brand || 'RGN Performance',
      code: finalCode,
      engine_type: bg.engine_type || 'Universal',
      engine: bg.engine_type || 'Universal',
      name: finalBundleName,
      selling_price: sellingPrice,
      reseller_price: resellerPrice,
      distributor_price: distributorPrice,
      rawIsi: componentEntries.map(e => e.text).join(' + '),
      car_variant: bg.rawVarian || '-',
      description: bg.rawKet || '',
      admin_note: '',
      notes: '',
      status: 'ACTIVE',
      items: parsedComponents,
      isValid,
      errors: rowErrors,
      warnings: rowWarnings
    });
  });

  return {
    totalRows: parsedBundles.length,
    validCount,
    errorCount,
    bundles: parsedBundles
  };
};
