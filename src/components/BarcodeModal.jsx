import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import bwipjs from 'bwip-js';
import jsPDF from 'jspdf';
import { X, Printer, Download, QrCode, Barcode as BarcodeIcon, FileText } from 'lucide-react';

/**
 * Utility helper to wrap text to fit within a maximum width on a 2D canvas.
 */
/**
 * Utility helper to wrap text to fit within a maximum width.
 * Splits on whitespace as well as after delimiters like '/', ',', '-'
 * so that long compound machine codes (e.g. "2KD/2KD VNT/2GD/1GD")
 * wrap cleanly at code boundaries instead of breaking words arbitrarily.
 */
function wrapSmartText(measureFn, text, maxWidth) {
  if (!text) return [];
  const rawWords = String(text).trim().split(/\s+/);
  if (!rawWords.length || !rawWords[0]) return [];

  const tokens = [];
  for (let i = 0; i < rawWords.length; i++) {
    const word = rawWords[i];
    // Split keeping delimiter attached to preceding token: "2KD/2KD" -> ["2KD/", "2KD"]
    const parts = word.split(/(?<=[/,-])/);
    for (let j = 0; j < parts.length; j++) {
      if (parts[j]) {
        tokens.push({
          text: parts[j],
          needsLeadingSpace: j === 0 && i > 0
        });
      }
    }
  }

  const lines = [];
  let currentLine = '';

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const prefix = (currentLine && tok.needsLeadingSpace) ? ' ' : '';
    const testLine = currentLine + prefix + tok.text;

    if (measureFn(testLine) <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = tok.text;
      } else {
        // Token itself is wider than maxWidth; slice char by char as a fallback
        let chunk = '';
        for (const char of tok.text) {
          if (measureFn(chunk + char) <= maxWidth) {
            chunk += char;
          } else {
            lines.push(chunk);
            chunk = char;
          }
        }
        currentLine = chunk;
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Extracts and formats all product specification details including
 * complete engine type, car compatibility, category, and pricing.
 */
function getProductDetails(product) {
  const brand = String(product?.brand || 'NDK EXHAUST').toUpperCase();
  const cleanSku = String(product?.sku || product?.code || 'PRODUCT').trim();
  const safeSku = cleanSku.replace(/[/\\?%*:|"<>]/g, '-').trim();
  const sellingPrice = Number(product?.selling_price ?? product?.price) || 0;

  // Resolve engine / machine category string with all common fallbacks
  const rawEngine = String(
    product?.engine_type ||
    product?.engineType ||
    product?.machineCategory ||
    product?.kategoriMesin ||
    ''
  ).trim();

  const engineClean = rawEngine || 'Universal';
  // Prefix with "Mesin " if not already present and not 'Universal' / 'Semua Mesin'
  const engineText = (/^mesin\b/i.test(engineClean) || /^universal\b/i.test(engineClean) || /^semua\s*mesin\b/i.test(engineClean))
    ? engineClean
    : `Mesin ${engineClean}`;

  // Compatibility / Car Variant (e.g. "Innova, Fortuner, Hilux SC")
  const rawCarVariant = String(product?.car_variant || product?.carVariant || '').trim();
  const hasCarVariant = Boolean(
    rawCarVariant && 
    rawCarVariant !== '-' && 
    !/^semua\s*varian$/i.test(rawCarVariant)
  );

  // Category Name (e.g. "Centerpipe")
  const rawCategory = String(product?.category_name || product?.category || '').trim();
  const isCategoryInName = rawCategory && product?.name && product.name.toLowerCase().includes(rawCategory.toLowerCase());
  const categoryText = (!isCategoryInName && rawCategory) ? rawCategory : '';

  return {
    brand,
    cleanSku,
    safeSku,
    sellingPrice,
    engineText,
    rawCarVariant: hasCarVariant ? rawCarVariant : '',
    categoryText
  };
}

/**
 * Renders complete 50 x 30 mm Thermal Label onto a high-resolution Canvas (1000 x 600 px).
 * Matches the PDF layout 1:1 and enforces 100% pure black (#000000) for sharp thermal printing.
 */
function renderLabelCanvas(product, codeType, rawBarcodeCanvas) {
  const SCALE = 20; // 20 px per mm -> 1000 x 600 px (~508 DPI)
  const width = 50 * SCALE;  // 1000 px
  const height = 30 * SCALE; // 600 px

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 1. Solid pure white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  if (!product || !rawBarcodeCanvas) return canvas;

  const { brand, cleanSku, sellingPrice, engineText, rawCarVariant, categoryText } = getProductDetails(product);

  // 100% Solid Black for all strokes and text
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#000000';

  if (codeType === 'QRCODE') {
    // --- 50 x 30 mm QR CODE LAYOUT (matches PDF 1:1) ---
    // Left Column: QR Code (20.5mm x 20.5mm at x=2.5mm, y=2.5mm)
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(rawBarcodeCanvas, 2.5 * SCALE, 2.5 * SCALE, 20.5 * SCALE, 20.5 * SCALE);

    // Left Column: SKU text centered beneath QR Code (x=12.75mm, y=26.5mm)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    let skuFontSize = 38;
    ctx.font = `bold ${skuFontSize}px "Courier New", Courier, monospace`;
    while (ctx.measureText(cleanSku).width > 440 && skuFontSize > 22) {
      skuFontSize -= 2;
      ctx.font = `bold ${skuFontSize}px "Courier New", Courier, monospace`;
    }
    ctx.fillText(cleanSku, 12.75 * SCALE, 26.5 * SCALE);

    // Right Column: Details (starts at x=24.5mm, width=24.0mm)
    const rightX = 24.5 * SCALE;
    const maxTextWidth = 24.0 * SCALE;
    ctx.textAlign = 'left';

    // 1. Brand (y = 4.8mm)
    ctx.font = 'bold 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillText(brand, rightX, 4.8 * SCALE);

    // 2. Product Name (starts at y = 8.0mm, max 2 lines, line height = 2.8mm)
    ctx.font = 'bold 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    const nameLines = wrapSmartText((t) => ctx.measureText(t).width, product.name || 'Produk', maxTextWidth);
    const displayLines = nameLines.slice(0, 2);
    if (nameLines.length > 2 && displayLines.length === 2) {
      displayLines[1] = displayLines[1].replace(/\.?\s*$/, '...');
    }
    displayLines.forEach((line, idx) => {
      ctx.fillText(line, rightX, (8.0 + idx * 2.8) * SCALE);
    });

    let curY = 8.0 + (displayLines.length * 2.8);

    // Fixed Bottom Anchors:
    // Directive Scan E-Katalog (y = 27.6mm)
    ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillText('Scan utk E-Katalog', rightX, 27.6 * SCALE);

    // Price Value (y = 24.6mm)
    let priceFontSize = 48;
    const priceText = `Rp ${sellingPrice.toLocaleString('id-ID')}`;
    ctx.font = `bold ${priceFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
    while (ctx.measureText(priceText).width > maxTextWidth && priceFontSize > 32) {
      priceFontSize -= 2;
      ctx.font = `bold ${priceFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
    }
    ctx.fillText(priceText, rightX, 24.6 * SCALE);

    // "Harga Resmi:" label (y = 21.6mm)
    ctx.font = 'normal 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillText('Harga Resmi:', rightX, 21.6 * SCALE);

    // 3. Engine Type & Details (rendered in the window between curY and 21.2mm)
    // Auto-scale font size for engine: try 30px down to 24px
    let engineFontSize = 30;
    ctx.font = `bold ${engineFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
    while (ctx.measureText(engineText).width > maxTextWidth && engineFontSize > 24) {
      engineFontSize -= 2;
      ctx.font = `bold ${engineFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
    }

    let engineLines = [];
    if (ctx.measureText(engineText).width <= maxTextWidth) {
      engineLines = [engineText];
    } else {
      // If still longer than maxTextWidth even at 24px, wrap cleanly at code boundaries
      engineLines = wrapSmartText((t) => ctx.measureText(t).width, engineText, maxTextWidth);
    }

    const engineLineHeight = 2.3;
    engineLines.forEach((line, idx) => {
      ctx.fillText(line, rightX, (curY + idx * engineLineHeight) * SCALE);
    });

    curY += engineLines.length * engineLineHeight;

    // 4. Car Variant / Compatibility or Category (if space allows before 21.2mm)
    const availableSpace = 21.2 - curY;
    if (rawCarVariant && availableSpace >= 2.0) {
      ctx.font = 'normal 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
      const carLines = wrapSmartText((t) => ctx.measureText(t).width, rawCarVariant, maxTextWidth);
      const maxCarLines = availableSpace >= 3.8 ? 2 : 1;
      const displayCarLines = carLines.slice(0, maxCarLines);
      if (carLines.length > maxCarLines && displayCarLines.length === maxCarLines) {
        displayCarLines[maxCarLines - 1] = displayCarLines[maxCarLines - 1].replace(/\.?\s*$/, '...');
      }
      displayCarLines.forEach((line, idx) => {
        ctx.fillText(line, rightX, (curY + idx * 2.0) * SCALE);
      });
    } else if (categoryText && availableSpace >= 2.0) {
      ctx.font = 'normal 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
      ctx.fillText(`Kategori: ${categoryText}`, rightX, curY * SCALE);
    }

  } else {
    // --- 50 x 30 mm BARCODE 1D LAYOUT (matches PDF 1:1) ---
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // 1. Brand (y = 4.5mm)
    ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillText(brand, 25 * SCALE, 4.5 * SCALE);

    // 2. Product Name (y = 7.8mm, max 1 line)
    ctx.font = 'bold 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    const nameLines = wrapSmartText((t) => ctx.measureText(t).width, product.name || 'Produk', 46 * SCALE);
    ctx.fillText(nameLines[0] || product.name || 'Produk', 25 * SCALE, 7.8 * SCALE);

    // 3. Spec & Price (y = 11.2mm)
    const priceStr = `Rp ${sellingPrice.toLocaleString('id-ID')}`;
    let spec1DText = rawCarVariant 
      ? `${engineText} (${rawCarVariant})  |  ${priceStr}` 
      : `${engineText}  |  ${priceStr}`;

    let spec1DFontSize = 34;
    ctx.font = `bold ${spec1DFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
    while (ctx.measureText(spec1DText).width > 46 * SCALE && spec1DFontSize > 20) {
      spec1DFontSize -= 1;
      ctx.font = `bold ${spec1DFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
    }

    // If still exceeds 46mm width, fall back to engineText without car variant so engineText is never truncated
    if (ctx.measureText(spec1DText).width > 46 * SCALE && rawCarVariant) {
      spec1DText = `${engineText}  |  ${priceStr}`;
      spec1DFontSize = 30;
      ctx.font = `bold ${spec1DFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
      while (ctx.measureText(spec1DText).width > 46 * SCALE && spec1DFontSize > 18) {
        spec1DFontSize -= 1;
        ctx.font = `bold ${spec1DFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
      }
    }

    ctx.fillText(spec1DText, 25 * SCALE, 11.2 * SCALE);

    // 4. Barcode 1D Image (x = 3mm, y = 13mm, w = 44mm, h = 10.5mm)
    ctx.drawImage(rawBarcodeCanvas, 3 * SCALE, 13 * SCALE, 44 * SCALE, 10.5 * SCALE);

    // 5. SKU Centered beneath (y = 27mm)
    ctx.font = 'bold 44px "Courier New", Courier, monospace';
    ctx.fillText(cleanSku, 25 * SCALE, 27 * SCALE);
  }

  return canvas;
}

export default function BarcodeModal({ product, onClose }) {
  const rawCanvasRef = useRef(null);
  const [codeType, setCodeType] = useState('QRCODE'); // 'QRCODE' | 'BARCODE1D'
  const [rawCodeDataUrl, setRawCodeDataUrl] = useState('');
  const [labelPngUrl, setLabelPngUrl] = useState('');

  const publicUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/catalog?sku=${encodeURIComponent(product?.sku || product?.code || '')}`
    : `https://warehouse.ndkexhaust.com/catalog?sku=${encodeURIComponent(product?.sku || product?.code || '')}`;

  useEffect(() => {
    if (!product) return;
    document.body.classList.add('barcode-modal-open');
    return () => {
      document.body.classList.remove('barcode-modal-open');
    };
  }, [product]);

  // Generate QR/Barcode matrix via bwip-js and build complete 50x30mm monochrome PNG label
  const generateLabel = useCallback(() => {
    if (!product || !rawCanvasRef.current) return;
    try {
      if (codeType === 'QRCODE') {
        // High quality 2D QR Code with pure black bars
        bwipjs.toCanvas(rawCanvasRef.current, {
          bcid: 'qrcode',
          text: publicUrl,
          scale: 4,
          includetext: false,
          eclevel: 'M',
          barcolor: '000000',
          backgroundcolor: 'ffffff'
        });
      } else {
        // Standard 1D Code128 Barcode with pure black bars
        bwipjs.toCanvas(rawCanvasRef.current, {
          bcid: 'code128',
          text: product.barcode || product.sku || product.code,
          scale: 3,
          height: 12,
          includetext: false,
          barcolor: '000000',
          backgroundcolor: 'ffffff'
        });
      }

      const rawDataUrl = rawCanvasRef.current.toDataURL('image/png');
      setRawCodeDataUrl(rawDataUrl);

      // Render the complete 50 x 30 mm Thermal Label layout (1000 x 600 px) in pure black
      const labelCanvas = renderLabelCanvas(product, codeType, rawCanvasRef.current);
      const fullPng = labelCanvas.toDataURL('image/png');
      setLabelPngUrl(fullPng);
    } catch (e) {
      console.error("Barcode/QR generation error:", e);
    }
  }, [product, codeType, publicUrl]);

  useEffect(() => {
    generateLabel();
  }, [generateLabel]);

  if (!product) return null;

  const { safeSku } = getProductDetails(product);

  const getExportFilename = (ext) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return `${dateStr}_LABEL-50x30-${safeSku}.${ext}`;
  };

  /**
   * Export complete 50 x 30 mm label as PNG image.
   * Format & dimensions match the PDF label 1:1, rendered in 100% black.
   */
  const handleDownloadPNG = () => {
    try {
      let url = labelPngUrl;
      if (!url && rawCanvasRef.current) {
        const labelCanvas = renderLabelCanvas(product, codeType, rawCanvasRef.current);
        url = labelCanvas.toDataURL('image/png');
      }
      if (!url) {
        alert("Gagal memproses gambar label PNG. Silakan coba lagi.");
        return;
      }

      const a = document.createElement('a');
      a.href = url;
      a.download = getExportFilename('png');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Gagal mendownload PNG:", err);
      alert("Gagal mendownload PNG: " + err.message);
    }
  };

  /**
   * Export complete 50 x 30 mm label as PDF.
   * Matches the PNG layout 1:1, rendered in 100% solid black.
   */
  const handleDownloadPDF = () => {
    try {
      let rawImg = rawCodeDataUrl;
      if (!rawImg && rawCanvasRef.current) {
        rawImg = rawCanvasRef.current.toDataURL('image/png');
      }
      if (!rawImg) {
        alert("Gagal memproses gambar barcode/QR. Silakan coba lagi.");
        return;
      }

      const isQr = codeType === 'QRCODE';
      // Standard 50 x 30 mm Thermal Label format
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [50, 30]
      });

      // 100% pure black for all text and drawings
      doc.setTextColor(0, 0, 0);
      doc.setDrawColor(0, 0, 0);

      const { brand, cleanSku, sellingPrice, engineText, rawCarVariant, categoryText } = getProductDetails(product);

      if (isQr) {
        // --- 50 x 30 mm QR CODE LAYOUT (matches PNG 1:1) ---
        // Left Side: QR Code (20.5mm x 20.5mm)
        doc.addImage(rawImg, 'PNG', 2.5, 2.5, 20.5, 20.5, undefined, 'FAST');

        // SKU centered underneath QR Code (Courier Bold, 100% black)
        doc.setFont('courier', 'bold');
        let skuFontSize = 5.5;
        doc.setFontSize(skuFontSize);
        while (doc.getTextWidth(cleanSku) > 22 && skuFontSize > 3.5) {
          skuFontSize -= 0.5;
          doc.setFontSize(skuFontSize);
        }
        doc.setTextColor(0, 0, 0);
        doc.text(cleanSku, 12.75, 26.5, { align: 'center' });

        // Right Side: Brand, Product Name, Specs, Price, Directive (x = 24.5mm, w = 24.0mm)
        const rightX = 24.5;
        const maxTextWidth = 24.0;

        // 1. Brand (y = 4.8mm)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.2);
        doc.setTextColor(0, 0, 0);
        doc.text(brand, rightX, 4.8);

        // 2. Product Name (starts at y = 8.0mm, max 2 lines, line height = 2.8mm)
        doc.setFontSize(6.2);
        doc.setTextColor(0, 0, 0);
        const nameLines = wrapSmartText((t) => doc.getTextWidth(t), product.name || 'Produk', maxTextWidth);
        const displayLines = nameLines.slice(0, 2);
        if (nameLines.length > 2 && displayLines.length === 2) {
          displayLines[1] = displayLines[1].replace(/\.?\s*$/, '...');
        }
        displayLines.forEach((line, idx) => {
          doc.text(line, rightX, 8.0 + idx * 2.8);
        });

        let curY = 8.0 + (displayLines.length * 2.8);

        // Fixed Bottom Anchors:
        // Directive Scan E-Katalog (y = 27.6mm)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(4.2);
        doc.setTextColor(0, 0, 0);
        doc.text('Scan utk E-Katalog', rightX, 27.6);

        // Price Value (y = 24.6mm)
        let priceFontSize = 7.5;
        const priceText = `Rp ${sellingPrice.toLocaleString('id-ID')}`;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(priceFontSize);
        while (doc.getTextWidth(priceText) > maxTextWidth && priceFontSize > 5.0) {
          priceFontSize -= 0.3;
          doc.setFontSize(priceFontSize);
        }
        doc.setTextColor(0, 0, 0);
        doc.text(priceText, rightX, 24.6);

        // "Harga Resmi:" label (y = 21.6mm)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(4.0);
        doc.setTextColor(0, 0, 0);
        doc.text('Harga Resmi:', rightX, 21.6);

        // 3. Engine Type & Details (rendered in the window between curY and 21.2mm)
        let engineFontSizePt = 4.6;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(engineFontSizePt);
        while (doc.getTextWidth(engineText) > maxTextWidth && engineFontSizePt > 3.8) {
          engineFontSizePt -= 0.2;
          doc.setFontSize(engineFontSizePt);
        }

        let engineLines = [];
        if (doc.getTextWidth(engineText) <= maxTextWidth) {
          engineLines = [engineText];
        } else {
          engineLines = wrapSmartText((t) => doc.getTextWidth(t), engineText, maxTextWidth);
        }

        const engineLineHeight = 2.3;
        engineLines.forEach((line, idx) => {
          doc.text(line, rightX, curY + idx * engineLineHeight);
        });

        curY += engineLines.length * engineLineHeight;

        // 4. Car Variant / Compatibility or Category (if space allows before 21.2mm)
        const availableSpace = 21.2 - curY;
        if (rawCarVariant && availableSpace >= 2.0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(3.8);
          const carLines = wrapSmartText((t) => doc.getTextWidth(t), rawCarVariant, maxTextWidth);
          const maxCarLines = availableSpace >= 3.8 ? 2 : 1;
          const displayCarLines = carLines.slice(0, maxCarLines);
          if (carLines.length > maxCarLines && displayCarLines.length === maxCarLines) {
            displayCarLines[maxCarLines - 1] = displayCarLines[maxCarLines - 1].replace(/\.?\s*$/, '...');
          }
          displayCarLines.forEach((line, idx) => {
            doc.text(line, rightX, curY + idx * 2.0);
          });
        } else if (categoryText && availableSpace >= 2.0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(3.8);
          doc.text(`Kategori: ${categoryText}`, rightX, curY);
        }

      } else {
        // --- 50 x 30 mm BARCODE 1D LAYOUT ---
        // 1. Header Brand (y = 4.5mm)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(0, 0, 0);
        doc.text(brand, 25, 4.5, { align: 'center' });

        // 2. Product Name (y = 7.8mm)
        doc.setFontSize(6.0);
        const nameLines = wrapSmartText((t) => doc.getTextWidth(t), product.name || 'Produk', 46);
        doc.text(nameLines[0] || product.name || 'Produk', 25, 7.8, { align: 'center' });

        // 3. Spec & Price (y = 11.2mm)
        const priceStr = `Rp ${sellingPrice.toLocaleString('id-ID')}`;
        let spec1DText = rawCarVariant 
          ? `${engineText} (${rawCarVariant})  |  ${priceStr}` 
          : `${engineText}  |  ${priceStr}`;

        let spec1DFontSize = 5.2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(spec1DFontSize);
        while (doc.getTextWidth(spec1DText) > 46 && spec1DFontSize > 3.2) {
          spec1DFontSize -= 0.2;
          doc.setFontSize(spec1DFontSize);
        }

        if (doc.getTextWidth(spec1DText) > 46 && rawCarVariant) {
          spec1DText = `${engineText}  |  ${priceStr}`;
          spec1DFontSize = 4.6;
          doc.setFontSize(spec1DFontSize);
          while (doc.getTextWidth(spec1DText) > 46 && spec1DFontSize > 3.0) {
            spec1DFontSize -= 0.2;
            doc.setFontSize(spec1DFontSize);
          }
        }

        doc.text(spec1DText, 25, 11.2, { align: 'center' });

        // 4. Barcode 1D Image (x = 3mm, y = 13mm, w = 44mm, h = 10.5mm)
        doc.addImage(rawImg, 'PNG', 3, 13, 44, 10.5, undefined, 'FAST');

        // 5. SKU Centered beneath (y = 27mm)
        doc.setFont('courier', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(0, 0, 0);
        doc.text(cleanSku, 25, 27, { align: 'center' });
      }

      doc.save(getExportFilename('pdf'));
    } catch (err) {
      console.error("Gagal membuat PDF label 50x30mm:", err);
      alert("Gagal mendownload PDF: " + err.message);
    }
  };

  /**
   * Triggers browser print dialog for direct physical thermal label printing.
   */
  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 60);
  };

  const modalContent = (
    <div 
      id="barcode-modal-portal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      {/* Hidden offscreen canvas for bwip-js matrix generation */}
      <div 
        style={{ position: 'fixed', left: -9999, top: -9999, opacity: 0, pointerEvents: 'none' }} 
        aria-hidden="true"
      >
        <canvas ref={rawCanvasRef} />
      </div>

      <div className="modal-content-card bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/70 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-base leading-tight">Smart QR & Barcode (50 x 30 mm)</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Code Type Switcher Tabs */}
        <div className="flex border-b border-slate-100 px-6 pt-3 bg-slate-50/40 text-xs no-print">
          <button
            type="button"
            onClick={() => setCodeType('QRCODE')}
            className={`flex-1 pb-2.5 font-bold flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
              codeType === 'QRCODE'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Smart QR Code (50x30)</span>
          </button>

          <button
            type="button"
            onClick={() => setCodeType('BARCODE1D')}
            className={`flex-1 pb-2.5 font-bold flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
              codeType === 'BARCODE1D'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <BarcodeIcon className="w-4 h-4" />
            <span>Barcode 1D (50x30)</span>
          </button>
        </div>

        {/* Modal Printable Content calibrated to 50 x 30 mm */}
        <div className="p-6 text-center flex flex-col items-center justify-center bg-slate-50/50" id="printable-barcode-area">
          <div className="w-full max-w-[340px] aspect-[5/3] bg-white rounded-xl border-2 border-slate-900 shadow-md flex items-center justify-center overflow-hidden relative">
            {labelPngUrl ? (
              <img 
                src={labelPngUrl} 
                alt={`Label ${product.sku || 'Barcode'}`} 
                className="w-full h-full object-contain block m-0 p-0" 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-500 font-medium">
                Memproses label 50x30mm...
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/70 no-print">
          <button
            type="button"
            onClick={handleDownloadPNG}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer shadow-2xs active:scale-95"
            title="Download gambar PNG label 50x30mm resolusi tinggi (100% hitam)"
          >
            <Download className="w-4 h-4" /> 
            <span>Download PNG (50x30)</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition shadow-md shadow-slate-900/20 cursor-pointer active:scale-95"
            title="Download file PDF label 50x30mm langsung siap cetak (100% hitam)"
          >
            <FileText className="w-4 h-4" /> 
            <span>Cetak as PDF (50x30)</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Buka dialog printer (Cetak langsung via printer thermal)"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
