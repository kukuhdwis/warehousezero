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
  
  const searchWords = searchTerm.toLowerCase().split(' ').filter(Boolean);
  
  if (searchWords.length === 0) return true;

  // Every word from the search term must appear in at least one of the fields
  return searchWords.every(word => {
    return fields.some(field => {
      if (field === null || field === undefined) return false;
      return String(field).toLowerCase().includes(word);
    });
  });
};
