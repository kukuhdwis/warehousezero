/**
 * Animated Brand Favicon Manager
 * Seamlessly alternates the browser tab favicon between NDK Exhaust and RGN Performance logos.
 * Features:
 * - High-contrast racing badge (looks stunning on both dark and light browser tab themes)
 * - Canvas pre-rendering to PNG data URI for zero-flicker instant tab swapping in Chrome/Edge
 * - SVG fallback for ultra-crisp vector rendering
 * - Page Visibility awareness (keeps running smoothly or throttles gracefully when inactive)
 */

let intervalId = null;
let currentBrand = 'ndk'; // 'ndk' | 'rgn'
let ndkDataUrl = '/favicon-ndk.svg';
let rgnDataUrl = '/favicon-rgn.svg';
let isInitialized = false;

/**
 * Pre-renders high-contrast square badge favicons using HTML5 Canvas
 * ensuring 100% compatibility across Chrome, Edge, Brave, Safari, and Firefox.
 */
const prepareCanvasFavicons = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  try {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawBadge = (img, borderColor1, borderColor2, imgW, imgH) => {
      ctx.clearRect(0, 0, size, size);

      // 1. Draw rounded rectangle background (deep dark slate #09090b)
      const radius = 14;
      const x = 2;
      const y = 2;
      const w = size - 4;
      const h = size - 4;

      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();

      // Subtle metallic dark fill
      const fillGrad = ctx.createLinearGradient(0, 0, size, size);
      fillGrad.addColorStop(0, '#1c1917');
      fillGrad.addColorStop(1, '#09090b');
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // Border gradient (Ember / Crimson Racing theme)
      const strokeGrad = ctx.createLinearGradient(0, 0, size, size);
      strokeGrad.addColorStop(0, borderColor1);
      strokeGrad.addColorStop(1, borderColor2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = strokeGrad;
      ctx.stroke();

      // 2. Draw centered logo
      if (img && img.complete && img.naturalWidth > 0) {
        const posX = (size - imgW) / 2;
        const posY = (size - imgH) / 2;
        ctx.drawImage(img, posX, posY, imgW, imgH);
      }

      return canvas.toDataURL('image/png');
    };

    // Load NDK White logo
    const ndkImg = new Image();
    ndkImg.crossOrigin = 'anonymous';
    ndkImg.src = '/logos/ndk-white.png';
    ndkImg.onload = () => {
      // NDK aspect ratio ~2.6:1 -> width 50, height 19
      ndkDataUrl = drawBadge(ndkImg, '#f97316', '#dc2626', 50, 19);
      if (currentBrand === 'ndk') {
        updateFavicon(ndkDataUrl);
      }
    };

    // Load RGN White logo
    const rgnImg = new Image();
    rgnImg.crossOrigin = 'anonymous';
    rgnImg.src = '/logos/rgn-white.png';
    rgnImg.onload = () => {
      // RGN aspect ratio ~5:1 -> width 54, height 11
      rgnDataUrl = drawBadge(rgnImg, '#ef4444', '#f97316', 54, 11);
      if (currentBrand === 'rgn') {
        updateFavicon(rgnDataUrl);
      }
    };
  } catch (e) {
    console.warn('Canvas favicon pre-rendering fallback to SVG', e);
  }
};

/**
 * Updates or creates the link[rel="icon"] tag in document head
 */
const updateFavicon = (href) => {
  if (typeof document === 'undefined' || !href) return;

  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  // Set type appropriately
  link.type = href.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  link.href = href;
};

/**
 * Starts the brand switcher animation
 * @param {number} intervalMs - Interval in milliseconds (default: 2500ms / 2.5 seconds)
 */
export const startAnimatedFavicon = (intervalMs = 2500) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (isInitialized) return;
  isInitialized = true;

  // Initialize with NDK
  updateFavicon(ndkDataUrl);
  prepareCanvasFavicons();

  const toggleBrand = () => {
    currentBrand = currentBrand === 'ndk' ? 'rgn' : 'ndk';
    const targetUrl = currentBrand === 'ndk' ? ndkDataUrl : rgnDataUrl;
    updateFavicon(targetUrl);
  };

  intervalId = window.setInterval(toggleBrand, intervalMs);

  // Keep alive / handle tab visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Ensure immediately synced when user returns to tab
      const targetUrl = currentBrand === 'ndk' ? ndkDataUrl : rgnDataUrl;
      updateFavicon(targetUrl);
    }
  });
};

/**
 * Stops the animated favicon switcher
 */
export const stopAnimatedFavicon = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isInitialized = false;
};
