/**
 * Universal Pricing Resolver Utility
 * Ensures prices and totals are reliably resolved for all transaction types
 * (Retail Sale, Stock Transfer to Branch, and Inbound Receipt).
 */

export const resolveProductPriceForBranch = (product, targetBranch = null) => {
  if (!product) return 0;
  const branchType = (targetBranch?.tipe || targetBranch?.branchType || '').toUpperCase();

  if (branchType === 'DISTRIBUTOR') {
    const distPrice = Number(product.distributor_price ?? product.distributorPrice);
    if (distPrice > 0) return distPrice;
    const resPrice = Number(product.reseller_price ?? product.resellerPrice);
    if (resPrice > 0) return resPrice;
  } else if (branchType === 'RESELLER') {
    const resPrice = Number(product.reseller_price ?? product.resellerPrice);
    if (resPrice > 0) return resPrice;
    const distPrice = Number(product.distributor_price ?? product.distributorPrice);
    if (distPrice > 0) return distPrice;
  }

  // Fallback chain
  const fallback = Number(
    product.price ?? 
    product.selling_price ?? 
    product.sellingPrice ?? 
    product.reseller_price ?? 
    product.resellerPrice ?? 
    product.distributor_price ?? 
    product.distributorPrice ?? 
    product.costPrice ?? 
    product.cost_price ?? 
    0
  );
  return fallback > 0 ? fallback : 0;
};

export const resolveItemUnitPrice = (item, transaction = {}, products = [], branches = []) => {
  if (!item) return 0;

  // 1. Direct price on item
  const directPrice = Number(item.price ?? item.unitPrice);
  if (directPrice > 0) return directPrice;

  // 2. Direct totalPrice or subtotal divided by quantity
  const qty = Number(item.qty || item.quantity || 1) || 1;
  const directSubtotal = Number(item.totalPrice ?? item.subtotal ?? item.total_price);
  if (directSubtotal > 0 && qty > 0) return directSubtotal / qty;

  // 3. Fallback on explicit tier fields on the item itself
  const isTransfer = transaction.transactionType === 'STOCK_TRANSFER_TO_BRANCH' || 
                     transaction.transactionType === 'STOCK_TRANSFER' ||
                     Boolean(transaction.targetBranchName || transaction.targetBranchId);
  const isInbound = transaction.type === 'IN';

  let branchType = (transaction.targetBranchType || transaction.branchType || '').toUpperCase();
  if (!branchType && Array.isArray(branches) && branches.length > 0) {
    const foundBranch = branches.find(b => 
      (transaction.targetBranchId && b.id === transaction.targetBranchId) ||
      (transaction.targetBranchName && b.name && b.name.toLowerCase() === transaction.targetBranchName.toLowerCase())
    );
    if (foundBranch) {
      branchType = (foundBranch.tipe || foundBranch.branchType || '').toUpperCase();
    }
  }

  if (isTransfer) {
    if (branchType === 'DISTRIBUTOR') {
      const dist = Number(item.distributor_price ?? item.distributorPrice);
      if (dist > 0) return dist;
    }
    const res = Number(item.reseller_price ?? item.resellerPrice);
    if (res > 0) return res;
    const dist = Number(item.distributor_price ?? item.distributorPrice);
    if (dist > 0) return dist;
  }

  // 4. Look up matching product in products catalog
  if (Array.isArray(products) && products.length > 0) {
    const itemSku = (item.sku || '').trim().toLowerCase();
    const itemName = (item.productName || item.product_name || item.name || '').trim().toLowerCase();

    const prod = products.find(p => 
      (p.id && item.productId && p.id === item.productId) ||
      (itemSku && p.sku && String(p.sku).trim().toLowerCase() === itemSku) ||
      (itemSku && p.code && String(p.code).trim().toLowerCase() === itemSku) ||
      (itemName && p.name && String(p.name).trim().toLowerCase() === itemName)
    );

    if (prod) {
      if (isTransfer) {
        if (branchType === 'DISTRIBUTOR') {
          const dPrice = Number(prod.distributor_price ?? prod.distributorPrice);
          if (dPrice > 0) return dPrice;
          const rPrice = Number(prod.reseller_price ?? prod.resellerPrice);
          if (rPrice > 0) return rPrice;
        } else {
          const rPrice = Number(prod.reseller_price ?? prod.resellerPrice);
          if (rPrice > 0) return rPrice;
          const dPrice = Number(prod.distributor_price ?? prod.distributorPrice);
          if (dPrice > 0) return dPrice;
        }
        // Transfer fallback to selling_price / price
        const sPrice = Number(prod.selling_price ?? prod.sellingPrice ?? prod.price);
        if (sPrice > 0) return sPrice;
      } else if (isInbound) {
        const cPrice = Number(prod.cost_price ?? prod.costPrice ?? prod.reseller_price ?? prod.price);
        if (cPrice > 0) return cPrice;
      } else {
        // Retail sale / general
        const sPrice = Number(prod.selling_price ?? prod.sellingPrice ?? prod.price ?? prod.reseller_price);
        if (sPrice > 0) return sPrice;
      }
    }
  }

  // 5. Fallback on any positive price property on item
  const genericPrice = Number(
    item.selling_price ?? 
    item.sellingPrice ?? 
    item.reseller_price ?? 
    item.resellerPrice ?? 
    item.distributor_price ?? 
    item.distributorPrice ?? 
    item.costPrice ?? 
    item.cost_price ?? 
    0
  );
  if (genericPrice > 0) return genericPrice;

  // 6. If transaction has totalPrice and this is the only item
  if (transaction.totalPrice && qty > 0 && (!transaction.items || transaction.items.length <= 1)) {
    return Number(transaction.totalPrice) / qty;
  }

  return 0;
};
