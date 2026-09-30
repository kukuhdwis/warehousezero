/**
 * Evaluates whether a given search term is found within a set of provided fields.
 * It uses a multi-word search approach: each word in the search term (separated by spaces)
 * must be found in AT LEAST ONE of the target fields.
 *
 * @param {string} searchTerm - The search string (e.g. "bolton titanium")
 * @param  {...any} fields - The fields to search within (e.g. name, sku, brand)
 * @returns {boolean} - True if the search term matches, otherwise false
 */
export const matchesSearch = (searchTerm, ...fields) => {
  if (!searchTerm || typeof searchTerm !== 'string') return true;
  const searchWords = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
  
  if (searchWords.length === 0) return true;

  // Every word from the search term must appear in at least one of the fields
  return searchWords.every(word => {
    return fields.some(field => {
      if (field === null || field === undefined) return false;
      return String(field).toLowerCase().includes(word);
    });
  });
};

/**
 * Prioritizes items that have physical stock (stock > 0) at the top of the list,
 * sorted descending by stock quantity, followed by zero-stock items sorted alphabetically.
 *
 * @param {Array} items - List of product or inventory items
 * @param {Function} [getStockFn] - Optional custom getter function to extract stock number
 * @returns {Array} - New sorted array with in-stock items first
 */
export const sortWithStockFirst = (items, getStockFn) => {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    const stockA = Number(getStockFn ? getStockFn(a) : (a.currentStock ?? a.stockQuantity ?? a.stock ?? 0)) || 0;
    const stockB = Number(getStockFn ? getStockFn(b) : (b.currentStock ?? b.stockQuantity ?? b.stock ?? 0)) || 0;

    // Items with stock (>0) always precede items with 0 stock
    if (stockA > 0 && stockB <= 0) return -1;
    if (stockB > 0 && stockA <= 0) return 1;

    // Both have stock: higher stock first
    if (stockA > 0 && stockB > 0 && stockA !== stockB) {
      return stockB - stockA;
    }

    // Secondary sort: alphabetical by name/productName
    const nameA = String(a.name || a.productName || a.sku || '').toLowerCase();
    const nameB = String(b.name || b.productName || b.sku || '').toLowerCase();
    return nameA.localeCompare(nameB, 'id');
  });
};
