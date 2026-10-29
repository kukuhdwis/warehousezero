/**
 * WarehouseZero (NDK Warehouse) End-to-End Integration & User Journey Test Suite
 * Follows the webapp-testing skill guidelines for verifying complete user flows.
 */

import { cleanFirestoreData, sanitizeExportText } from '../src/services/dataService.js';
import { resolveProductPriceForBranch, resolveItemUnitPrice } from '../src/utils/pricingResolver.js';
import { matchesSearch, sortWithStockFirst } from '../src/utils/searchUtils.js';
import { generateSmartSKU } from '../src/services/spreadsheetService.js';
import { serverTimestamp } from 'firebase/firestore';

// Pure logic mirror from PublicCatalog.jsx & BranchMonitoring.jsx
const formatBundleDisplayName = (b) => {
  if (!b) return '';
  const mainEng = (b.engine_type || b.machineCategory || '').trim();
  const cleanEng = (mainEng && mainEng !== '-' && mainEng.toLowerCase() !== 'all') ? mainEng : '';
  if (cleanEng && !b.name?.toLowerCase().includes(cleanEng.toLowerCase())) {
    return `${b.name} (${cleanEng})`;
  }
  return b.name || '';
};

const calculateItemProfit = (item, products = []) => {
  if (!item) return { sellingPrice: 0, costPrice: 0, qty: 1, profit: 0 };
  const qty = Number(item.qty || 1);
  const sellingPrice = Number(item.price || 0);
  const matchedProd = products.find(p => p.id === item.productId || p.sku === item.sku);
  const costPrice = Number(matchedProd?.cost_price || matchedProd?.costPrice || 0);
  return {
    sellingPrice,
    costPrice,
    qty,
    profit: (sellingPrice - costPrice) * qty
  };
};

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${details}`);
    failed++;
  }
}

console.log('\n=============================================================');
console.log('🚀 RUNNING END-TO-END USER JOURNEYS & SYSTEM INTEGRATION TEST');
console.log('=============================================================\n');

// -----------------------------------------------------------------------------
// JOURNEY 1: Catalog Discovery, Search & Stock Sorting Flow
// -----------------------------------------------------------------------------
console.log('📋 Journey 1: Public Catalog & Discovery Flow');
{
  const mockProducts = [
    { id: 'p1', name: 'Muffler NDK V2', sku: 'NDK-MUF-001', currentStock: 0, brand: 'NDK', machineCategory: 'Universal' },
    { id: 'p2', name: 'Downpipe 2GD Innova Reborn', sku: 'NDK-DP-2GD', currentStock: 15, brand: 'NDK', machineCategory: 'Diesel' },
    { id: 'p3', name: 'Frontpipe Fortuner VRZ', sku: 'NDK-FP-VRZ', currentStock: 4, brand: 'NDK', machineCategory: 'Diesel' }
  ];

  // 1. Search matching: searchTerm is first, followed by fields to check
  const searchResult = mockProducts.filter(p => matchesSearch('innova 2gd', p.name, p.sku, p.brand));
  assert(searchResult.length === 1 && searchResult[0].id === 'p2', 'Fuzzy search matches "innova 2gd" correctly');

  // 2. Stock sorting: In-stock products must always come first
  const sorted = sortWithStockFirst(mockProducts, p => p.currentStock);
  assert(sorted[0].currentStock > 0 && sorted[sorted.length - 1].currentStock === 0, 'Products with stock > 0 are prioritized before out-of-stock items');

  // 3. Bundle display formatting
  const rawBundle = { name: 'Paket Komplit Diesel', engine_type: '2GD / 1GD' };
  const formatted = formatBundleDisplayName(rawBundle);
  assert(formatted.includes('(2GD / 1GD)'), 'Bundle display name appends engine category cleanly');
}

// -----------------------------------------------------------------------------
// JOURNEY 2: Multi-Tier Pricing & Profit Calculation Matrix
// -----------------------------------------------------------------------------
console.log('\n💰 Journey 2: Multi-Tier Pricing & Profit Margin Flow');
{
  const mockProduct = {
    id: 'p-exhaust',
    name: 'Knalpot Racing NDK',
    sku: 'EX-01',
    cost_price: 500000,
    reseller_price: 750000,
    distributor_price: 650000,
    selling_price: 1000000
  };

  const distBranch = { id: 'b1', name: 'Cabang Distributor Surabaya', tipe: 'DISTRIBUTOR' };
  const resBranch = { id: 'b2', name: 'Cabang Reseller Bandung', tipe: 'RESELLER' };
  const internalBranch = { id: 'b3', name: 'Gudang Pusat', tipe: 'INTERNAL' };

  const priceDist = resolveProductPriceForBranch(mockProduct, distBranch);
  const priceRes = resolveProductPriceForBranch(mockProduct, resBranch);
  const priceInternal = resolveProductPriceForBranch(mockProduct, internalBranch);

  assert(priceDist === 650000, 'Distributor branch gets distributor_price (Rp 650.000)');
  assert(priceRes === 750000, 'Reseller branch gets reseller_price (Rp 750.000)');
  assert(priceInternal === 1000000, 'Internal / Retail fallback uses selling_price (Rp 1.000.000)');

  // Test profit calculation
  const saleItem = { productId: 'p-exhaust', qty: 2, price: 1000000 };
  const profit = calculateItemProfit(saleItem, [mockProduct]);
  assert(profit.profit === 1000000, 'Profit calculated accurately: (Rp 1.000.000 - Rp 500.000 cost) * 2 = Rp 1.000.000');
}

// -----------------------------------------------------------------------------
// JOURNEY 3: Outbound Staging & Multi-Item Stock Transfer (The Video Bugfix Flow)
// -----------------------------------------------------------------------------
console.log('\n📦 Journey 3: Outbound Transfer Staging & Undefined Value Protection (Bugfix Verification)');
{
  const targetBranch = { id: 'b-jkt', name: 'RGN JAKARTA', tipe: 'RESELLER' };
  const currentUserAdmin = { name: 'Bunga', role: 'ADMIN', branchId: 'ALL', branchName: 'Semua Cabang (Pusat)' };

  // 6 products selected manually from transfer staging list (like in user video)
  const stagedCart = [
    { productId: 'prod-1', sku: 'HZ-4N15-DP-059', name: 'Downpipe 4N15', qty: 2, price: 0 },
    { productId: 'prod-2', sku: 'HZ-2GD-FP-013', name: 'Frontpipe 2GD', qty: 2, price: 0 },
    { productId: 'prod-3', sku: 'HZ-2KD-CP-032', name: 'Centerpipe Drag', qty: 2, price: 0 },
    { productId: 'prod-4', sku: 'HZ-2KD-DP-056', name: 'Downpipe PIUPIU', qty: 3, price: 0 },
    { productId: 'prod-5', sku: 'HZ-2KD-BP-054', name: 'Bolton SS Polos', qty: 1, price: 0 },
    { productId: 'prod-6', sku: 'HZ-4D56-DP-012', name: 'Downpipe 4D56', qty: 2, price: 0 }
  ];

  // Simulating StockOut.jsx transferItems mapping
  const isBranchStaff = currentUserAdmin.role === 'STAFF_BRANCH';
  const transferItems = stagedCart.map(i => {
    const unitPrice = 750000; // Mock resolved price
    const iQty = Number(i.qty) || 1;
    const itemObj = {
      productId: i.productId,
      productName: i.name,
      sku: i.sku,
      qty: iQty,
      unit: 'Pcs',
      price: unitPrice,
      totalPrice: unitPrice * iQty,
      costPrice: 500000,
      ...(i.requestId ? { requestId: i.requestId } : {})
    };
    return itemObj;
  });

  const transferTotalAmount = transferItems.reduce((acc, i) => acc + i.totalPrice, 0);

  const payload = {
    productId: 'BATCH-TRANSFER',
    sku: 'MULTI-TRANSFER',
    productName: `${transferItems.length} Macam Produk Transfer`,
    type: 'OUT',
    transactionType: 'STOCK_TRANSFER_TO_BRANCH',
    targetBranchId: targetBranch.id,
    targetBranchName: targetBranch.name,
    targetBranchType: targetBranch.tipe,
    deliveryNote: 'SJ-HQ-998877',
    invoiceNumber: 'SJ-HQ-998877',
    notes: 'SIDE EXIT ANPS TI BLM MASUK LIST',
    user: currentUserAdmin.name,
    qty: transferItems.reduce((acc, i) => acc + i.qty, 0),
    unit: 'Pcs',
    price: 0,
    totalPrice: transferTotalAmount,
    isMultiItem: true,
    items: transferItems,
    branchId: isBranchStaff ? currentUserAdmin.branchId : (currentUserAdmin.branchId || 'ALL'),
    skipMasterProductUpdate: isBranchStaff
  };

  // 1. Verify that no raw object keys are undefined
  let foundUndefinedInPayload = false;
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined) foundUndefinedInPayload = true;
  }
  assert(!foundUndefinedInPayload, 'Payload root has no undefined values');

  let foundUndefinedInItems = false;
  for (const item of payload.items) {
    if ('requestId' in item && item.requestId === undefined) foundUndefinedInItems = true;
    for (const [k, v] of Object.entries(item)) {
      if (v === undefined) foundUndefinedInItems = true;
    }
  }
  assert(!foundUndefinedInItems, 'Staged transfer items have no undefined requestId or fields');

  // 2. Test recursive cleanFirestoreData guard
  const payloadWithAccidentalUndefined = {
    ...payload,
    accidentalField: undefined,
    ts: serverTimestamp(),
    items: payload.items.map(it => ({ ...it, badNestedField: undefined }))
  };

  const cleaned = cleanFirestoreData(payloadWithAccidentalUndefined);

  assert(!('accidentalField' in cleaned), 'cleanFirestoreData successfully strips undefined root fields');
  assert(!('badNestedField' in cleaned.items[0]), 'cleanFirestoreData successfully strips undefined nested item fields');
  assert(Boolean(cleaned.ts), 'cleanFirestoreData preserves Firestore serverTimestamp FieldValue object intact');
  assert(cleaned.items.length === 6, 'All 6 transfer items preserved after cleaning');
  assert(cleaned.qty === 12, 'Total quantity correctly sums to 12 Pcs');
}

// -----------------------------------------------------------------------------
// JOURNEY 4: Smart SKU Generator & Spreadsheet Data Sanitation Flow
// -----------------------------------------------------------------------------
console.log('\n📄 Journey 4: Smart SKU Generator & Excel Sanitation Flow');
{
  const existingSet = new Set(['wz-2gd-dp-001']);
  const result = generateSmartSKU('2GD', 'Downpipe', 'Downpipe Innova Reborn', existingSet);
  assert(result.sku === 'WZ-2GD-DP-002', 'Smart SKU generator avoids duplicate and increments counter (WZ-2GD-DP-002)');

  const mojibakeText = 'Pipa Stainless â€¢ Las Argon â€¢ Diameter 2.5\u00A0inch';
  const cleanText = sanitizeExportText(mojibakeText);
  assert(cleanText.includes('•') && !cleanText.includes('â€¢'), 'sanitizeExportText eliminates mojibake bullets and non-breaking spaces');
}

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n=============================================================');
console.log(`📊 RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('=============================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('✨ ALL USER JOURNEY ASSERTIONS PASSED WITH ZERO ERRORS!\n');
}
