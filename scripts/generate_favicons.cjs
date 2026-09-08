const fs = require('fs');
const path = require('path');

const ndkBase64 = fs.readFileSync('public/logos/ndk-white.png').toString('base64');
const rgnBase64 = fs.readFileSync('public/logos/rgn-white.png').toString('base64');

// 1. Static NDK Favicon (embedded base64, crisp rounded dark badge with ember border)
const ndkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="bgNdk" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1c1917"/>
      <stop offset="100%" stop-color="#0c0a09"/>
    </linearGradient>
    <linearGradient id="borderNdk" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#dc2626"/>
    </linearGradient>
  </defs>
  <!-- Background Badge with Racing Ember Border -->
  <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#bgNdk)" stroke="url(#borderNdk)" stroke-width="2.5"/>
  <!-- NDK Exhaust Logo -->
  <image href="data:image/png;base64,${ndkBase64}" x="6" y="14" width="52" height="36" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

// 2. Static RGN Favicon (embedded base64, crisp rounded dark badge with crimson border)
const rgnSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="bgRgn" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <linearGradient id="borderRgn" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#f97316"/>
    </linearGradient>
  </defs>
  <!-- Background Badge with Crimson/Ember Accent Border -->
  <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#bgRgn)" stroke="url(#borderRgn)" stroke-width="2.5"/>
  <!-- RGN Performance Logo -->
  <image href="data:image/png;base64,${rgnBase64}" x="4" y="17" width="56" height="30" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

// 3. Animated Switching SVG Favicon (SMIL Animation for SVG-capable browsers like Firefox)
const animatedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="bgAnim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <linearGradient id="borderAnim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="50%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#f97316"/>
    </linearGradient>
  </defs>
  
  <!-- Sleek rounded badge for high visibility on dark and light tabs -->
  <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#bgAnim)" stroke="url(#borderAnim)" stroke-width="2.5"/>
  
  <!-- NDK Exhaust Logo (Visible during 0s - 2.8s) -->
  <g id="ndk-layer">
    <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.46;0.50;0.96;1" dur="5s" repeatCount="indefinite"/>
    <image href="data:image/png;base64,${ndkBase64}" x="6" y="14" width="52" height="36" preserveAspectRatio="xMidYMid meet"/>
  </g>
  
  <!-- RGN Performance Logo (Visible during 2.5s - 5s) -->
  <g id="rgn-layer">
    <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.46;0.50;0.96;1" dur="5s" repeatCount="indefinite"/>
    <image href="data:image/png;base64,${rgnBase64}" x="4" y="17" width="56" height="30" preserveAspectRatio="xMidYMid meet"/>
  </g>
</svg>`;

fs.writeFileSync('public/favicon-ndk.svg', ndkSvg.trim());
fs.writeFileSync('public/favicon-rgn.svg', rgnSvg.trim());
fs.writeFileSync('public/favicon.svg', animatedSvg.trim());

console.log('✅ Generated public/favicon-ndk.svg, public/favicon-rgn.svg, and public/favicon.svg');
