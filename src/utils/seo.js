/**
 * Dynamic SEO & Meta Tags Manager for Single Page Application
 * Updates document title, meta tags, OpenGraph, Twitter Cards, Canonical links, and JSON-LD structured data.
 */
export const setSEO = (titleOrOptions, description, image = null) => {
  if (typeof document === 'undefined') return;

  let title = titleOrOptions;
  let desc = description;
  let img = image;
  let url = null;
  let canonical = null;
  let keywords = null;
  let type = 'website';
  let schema = null;

  if (typeof titleOrOptions === 'object' && titleOrOptions !== null) {
    title = titleOrOptions.title;
    desc = titleOrOptions.description;
    img = titleOrOptions.image;
    url = titleOrOptions.url;
    canonical = titleOrOptions.canonical;
    keywords = titleOrOptions.keywords;
    type = titleOrOptions.type || 'website';
    schema = titleOrOptions.schema;
  }

  // Helper to get or create meta tag
  const setMeta = (attributeName, attributeValue, content) => {
    if (!content) return;
    let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attributeName, attributeValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // 1. Title
  if (title) {
    const formattedTitle = typeof title === 'string' ? title : String(title);
    document.title = formattedTitle;
    setMeta('property', 'og:title', formattedTitle);
    setMeta('name', 'twitter:title', formattedTitle);
  }

  // 2. Meta Description
  if (desc) {
    setMeta('name', 'description', desc);
    setMeta('property', 'og:description', desc);
    setMeta('name', 'twitter:description', desc);
  }

  // 3. Keywords
  if (keywords) {
    setMeta('name', 'keywords', keywords);
  }

  // 4. OpenGraph & Twitter Image
  const resolvedImage = img || 'https://warehouse.ndkexhaust.com/logos/ndk-black.png';
  setMeta('property', 'og:image', resolvedImage);
  setMeta('name', 'twitter:image', resolvedImage);
  setMeta('name', 'twitter:card', 'summary_large_image');

  // 5. OpenGraph Type, Locale, Site Name
  setMeta('property', 'og:type', type);
  setMeta('property', 'og:locale', 'id_ID');
  setMeta('property', 'og:site_name', 'NDK Exhaust × RGN Performance');

  // 6. Canonical & OG URL
  const targetUrl = canonical || url || (typeof window !== 'undefined' ? window.location.href : 'https://warehouse.ndkexhaust.com/');
  setMeta('property', 'og:url', targetUrl);

  let canonicalElement = document.querySelector('link[rel="canonical"]');
  if (!canonicalElement) {
    canonicalElement = document.createElement('link');
    canonicalElement.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalElement);
  }
  canonicalElement.setAttribute('href', targetUrl);

  // 7. Structured Data (JSON-LD)
  if (schema) {
    let scriptTag = document.getElementById('dynamic-seo-schema');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'dynamic-seo-schema';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    try {
      scriptTag.textContent = JSON.stringify(schema);
    } catch (e) {
      console.warn('Failed to serialize dynamic SEO JSON-LD schema', e);
    }
  }
};
