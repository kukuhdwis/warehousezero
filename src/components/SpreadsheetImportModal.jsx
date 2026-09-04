import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  X, 
  ArrowRight, 
  RefreshCw, 
  Sparkles, 
  Layers, 
  Check, 
  HelpCircle, 
  Sliders, 
  Search, 
  Info,
  Car,
  Wrench,
  DollarSign
} from 'lucide-react';
import { 
  readSpreadsheetFile, 
  processSpreadsheetData, 
  downloadExhaustTemplate 
} from '../services/spreadsheetService';
import { importProductsBatch } from '../services/dataService';
import { matchesSearch } from '../utils/searchUtils';

export default function SpreadsheetImportModal({ 
  isOpen, 
  onClose, 
  existingProducts = [], 
  onSuccess 
}) {
  const [file, setFile] = useState(null);
  const [rawAoa, setRawAoa] = useState(null);
  const [duplicateMode, setDuplicateMode] = useState('UPDATE'); // 'UPDATE' | 'SKIP'
  const [parsedData, setParsedData] = useState(null);
  const [previewFilter, setPreviewFilter] = useState('ALL'); // 'ALL' | 'VALID' | 'DUPLICATE' | 'ISSUE'
  const [searchPreview, setSearchPreview] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [sheetNames, setSheetNames] = useState([]);
  const [sheetsData, setSheetsData] = useState({});
  const [selectedSheet, setSelectedSheet] = useState('');

  if (!isOpen) return null;

  // Handle file select and parse
  const handleProcessFile = async (selectedFile) => {
    if (!selectedFile) return;
    setErrorMessage('');
    setIsProcessingFile(true);
    setFile(selectedFile);

    try {
      const parsedWorkbook = await readSpreadsheetFile(selectedFile);
      const activeAoa = parsedWorkbook.rawAoa || [];
      setRawAoa(activeAoa);
      setSheetNames(parsedWorkbook.sheetNames || []);
      setSheetsData(parsedWorkbook.sheetsData || {});
      setSelectedSheet(parsedWorkbook.activeSheetName || '');

      const result = processSpreadsheetData(activeAoa, existingProducts, duplicateMode);
      setParsedData(result);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal membaca berkas spreadsheet.');
      setFile(null);
      setRawAoa(null);
      setSheetNames([]);
      setSheetsData({});
      setSelectedSheet('');
      setParsedData(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Handle switching active worksheet in multi-sheet files
  const handleSelectSheet = (sheetName) => {
    setSelectedSheet(sheetName);
    const aoa = sheetsData[sheetName] || [];
    setRawAoa(aoa);
    const result = processSpreadsheetData(aoa, existingProducts, duplicateMode);
    setParsedData(result);
  };

  // Re-process when duplicate mode changes
  const handleChangeDuplicateMode = (mode) => {
    setDuplicateMode(mode);
    if (rawAoa) {
      const result = processSpreadsheetData(rawAoa, existingProducts, mode);
      setParsedData(result);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleReset = () => {
    setFile(null);
    setRawAoa(null);
    setSheetNames([]);
    setSheetsData({});
    setSelectedSheet('');
    setParsedData(null);
    setImportResult(null);
    setErrorMessage('');
    setImportProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Execute Batch Import to Firestore
  const handleExecuteImport = async () => {
    if (!parsedData || !parsedData.items || parsedData.items.length === 0) return;
    
    setIsImporting(true);
    setErrorMessage('');
    setImportProgress(10);

    try {
      const result = await importProductsBatch(
        parsedData.items, 
        duplicateMode, 
        (pct) => setImportProgress(pct)
      );

      setImportResult(result);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal melakukan batch import produk ke database.');
    } finally {
      setIsImporting(false);
    }
  };

  // Filter preview items
  const filteredPreviewItems = (parsedData?.items || []).filter(item => {
    const matchesSearchTerm = matchesSearch(searchPreview, item.sku, item.name, item.engine_type, item.car_variant, item.category_name);

    if (!matchesSearchTerm) return false;

    if (previewFilter === 'VALID') return item.isValid && !item.isDuplicate;
    if (previewFilter === 'DUPLICATE') return item.isDuplicate;
    if (previewFilter === 'ISSUE') return !item.isValid || item.warnings.length > 0;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150 my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                <span>Import Spreadsheet Katalog Produk</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Exhaust System
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Unggah data katalog knalpot, auto-generate SKU, dan kalkulasi profit instan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadExhaustTemplate}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition cursor-pointer border border-white/20"
              title="Unduh format spreadsheet resmi dengan contoh data knalpot"
            >
              <Download className="w-3.5 h-3.5 text-sky-300" />
              <span>Unduh Template Excel</span>
            </button>

            <button 
              onClick={onClose}
              disabled={isImporting}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-sm">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3 text-xs animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Terjadi Kesalahan / Peringatan:</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* STEP 1: IMPORT SUCCESS REPORT */}
          {importResult ? (
            <div className="py-8 px-4 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div className="max-w-md mx-auto space-y-1.5">
                <h4 className="text-xl font-extrabold text-slate-900">
                  Import Spreadsheet Selesai! 🎉
                </h4>
                <p className="text-xs text-slate-500">
                  Data master produk exhaust system telah berhasil disinkronkan ke dalam database Firestore.
                </p>
              </div>

              {/* Stat summary cards */}
              <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto pt-2">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Produk Baru</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1">+{importResult.createdCount}</div>
                </div>
                <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl text-center">
                  <div className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">Diperbarui</div>
                  <div className="text-2xl font-black text-sky-600 mt-1">{importResult.updatedCount}</div>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dilewati</div>
                  <div className="text-2xl font-black text-slate-600 mt-1">{importResult.skippedCount}</div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Import File Lain
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-indigo-900 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          ) : !parsedData ? (
            /* STEP 2: FILE UPLOAD & TEMPLATE DOWNLOAD AREA */
            <div className="space-y-5">
              
              {/* Guidance Info Banner */}
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-sky-950">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Format Spreadsheet Klien Didukung Penuh:</span>
                    <p className="text-sky-800 mt-0.5">
                      Kolom resmi: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-sky-200 text-sky-900">No</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-sky-200 text-sky-900">Kode</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-sky-200 text-sky-900">Mesin</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-sky-200 text-sky-900">Nama</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-sky-200 text-sky-900">Varian Mobil</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-sky-200 text-sky-900">Harga Reseller</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-sky-200 text-sky-900">Harga Jual</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-sky-200 text-sky-900">Profit</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-sky-200 text-sky-900">ket</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-sky-200 text-sky-900">%</code>.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadExhaustTemplate}
                  className="sm:self-center flex items-center justify-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold transition shadow-xs whitespace-nowrap cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template .XLSX</span>
                </button>
              </div>

              {/* Drag and Drop Box */}
              <div 
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  isDragOver 
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]' 
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleProcessFile(e.target.files[0]);
                    }
                  }} 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                />

                <div className="w-16 h-16 rounded-3xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                  {isProcessingFile ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : (
                    <UploadCloud className="w-8 h-8 stroke-[1.8]" />
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 text-base">
                    {isProcessingFile ? 'Membaca data spreadsheet...' : 'Tarik & Letakkan file Spreadsheet Anda di sini'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Mendukung format file <strong className="text-slate-600">.XLSX</strong>, <strong className="text-slate-600">.XLS</strong>, atau <strong className="text-slate-600">.CSV</strong> (Maksimal 10 MB).
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isProcessingFile}
                  className="mt-2 px-5 py-2.5 bg-slate-900 hover:bg-indigo-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Pilih Berkas dari Komputer
                </button>
              </div>

              {/* Key Features Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span>Smart SKU Generator</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Kolom kode kosong otomatis dibuatkan SKU unik berformat <code className="font-mono bg-slate-100 px-1 rounded">WZ-2KD-DP-001</code>.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                    <DollarSign className="w-4 h-4" />
                    <span>Smart Currency Cleaner</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Menghapus simbol "Rp", pemisah titik/koma ribuan, serta kalkulasi otomatis selisih harga & % margin.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-sky-600 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Interactive Dry-Run</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Pratinjau visual seluruh baris produk lengkap dengan deteksi duplikasi sebelum tersimpan ke database.
                  </p>
                </div>
              </div>

            </div>
          ) : (
            /* STEP 3: INTERACTIVE DRY RUN & PREVIEW TABLE */
            <div className="space-y-4">
              
              {/* Summary Stats Row & Action Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 flex-wrap">
                      <span>{file?.name || 'Spreadsheet Terpilih'}</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                        {parsedData.totalRows} Baris Terdeteksi
                      </span>
                      {sheetNames.length > 1 && (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                          Sheet: {selectedSheet}
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Periksa hasil validasi dan pratinjau data produk di bawah sebelum konfirmasi import.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Sheet Selector (if multiple sheets exist in Excel) */}
                  {sheetNames.length > 1 && (
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
                      <span className="font-bold text-slate-500 text-[11px]">Pilih Sheet:</span>
                      <select
                        value={selectedSheet}
                        onChange={(e) => handleSelectSheet(e.target.value)}
                        className="font-bold text-indigo-700 bg-transparent focus:outline-none cursor-pointer"
                      >
                        {sheetNames.map(sName => (
                          <option key={sName} value={sName}>{sName}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Duplicate Handling Mode Selector */}
                  <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                    <span className="px-2 text-slate-500 font-semibold hidden sm:inline">Mode Duplikat:</span>
                    <button
                      type="button"
                      onClick={() => handleChangeDuplicateMode('UPDATE')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                        duplicateMode === 'UPDATE'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Perbarui Data Lama</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChangeDuplicateMode('SKIP')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                        duplicateMode === 'SKIP'
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>Lewati Duplikat</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Stat Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-white border border-slate-200 rounded-2xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Baris</div>
                  <div className="text-lg font-extrabold text-slate-900 mt-0.5">{parsedData.totalRows}</div>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Siap Import (Valid)</div>
                  <div className="text-lg font-extrabold text-emerald-700 mt-0.5 flex items-center gap-1.5">
                    <span>{parsedData.validCount}</span>
                    {parsedData.autoSkuCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-200/80 text-emerald-900">
                        {parsedData.autoSkuCount} Auto-SKU
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl">
                  <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Duplikat Terdeteksi</div>
                  <div className="text-lg font-extrabold text-amber-700 mt-0.5">
                    {parsedData.duplicateCount} <span className="text-[10px] font-normal text-amber-900">({duplicateMode === 'UPDATE' ? 'akan di-update' : 'akan dilewati'})</span>
                  </div>
                </div>

                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl">
                  <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Baris Bermasalah</div>
                  <div className="text-lg font-extrabold text-rose-700 mt-0.5">{parsedData.errorCount}</div>
                </div>
              </div>

              {/* Filter Tabs & Search in Preview */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      previewFilter === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Semua ({parsedData.totalRows})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('VALID')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      previewFilter === 'VALID'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Hanya Valid ({parsedData.validCount - parsedData.duplicateCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('DUPLICATE')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      previewFilter === 'DUPLICATE'
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Duplikat ({parsedData.duplicateCount})
                  </button>
                  {parsedData.errorCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('ISSUE')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        previewFilter === 'ISSUE'
                          ? 'bg-rose-600 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Bermasalah ({parsedData.errorCount})
                    </button>
                  )}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari di pratinjau..."
                    value={searchPreview}
                    onChange={(e) => setSearchPreview(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-3 text-center whitespace-nowrap min-w-[50px]">No</th>
                        <th className="px-3 py-3 whitespace-nowrap min-w-[110px]">Merk</th>
                        <th className="px-3 py-3 whitespace-nowrap min-w-[130px]">SKU / Kode</th>
                        <th className="px-3 py-3 text-center whitespace-nowrap min-w-[90px]">Mesin</th>
                        <th className="px-4 py-3 min-w-[200px]">Komponen & Nama</th>
                        <th className="px-4 py-3 min-w-[160px]">Varian Mobil</th>
                        <th className="px-3 py-3 text-right whitespace-nowrap min-w-[120px]">Harga Jual</th>
                        <th className="px-3 py-3 text-right whitespace-nowrap min-w-[120px]">Harga Reseller</th>
                        <th className="px-3 py-3 text-right whitespace-nowrap min-w-[120px]">Harga Distributor</th>
                        <th className="px-4 py-3 text-center whitespace-nowrap min-w-[110px]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPreviewItems.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                            Tidak ada baris yang sesuai dengan filter pratinjau.
                          </td>
                        </tr>
                      ) : (
                        filteredPreviewItems.map((item, idx) => (
                          <tr 
                            key={idx} 
                            className={`hover:bg-slate-50/80 transition ${
                              !item.isValid 
                                ? 'bg-rose-50/50' 
                                : item.isDuplicate 
                                ? 'bg-amber-50/30' 
                                : ''
                            }`}
                          >
                            <td className="px-3 py-2.5 text-center font-mono text-slate-400 whitespace-nowrap">
                              {item.no}
                            </td>

                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                                {item.brand || 'NDK Exhaust'}
                              </span>
                            </td>

                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 flex-nowrap">
                                <span className="font-mono font-bold text-slate-800 whitespace-nowrap">{item.sku}</span>
                                {item.isAutoGeneratedSKU && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-indigo-100 text-indigo-700 whitespace-nowrap flex-shrink-0" title="Dibuat otomatis oleh Smart SKU Generator">
                                    AUTO
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-3 py-2.5 text-center whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 whitespace-nowrap inline-block">
                                {item.engine_type}
                              </span>
                            </td>

                            <td className="px-4 py-2.5 min-w-[200px]">
                              <div className="font-semibold text-slate-900 leading-snug">{item.name}</div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 flex-wrap">
                                <span className="whitespace-nowrap">{item.category_name}</span>
                                <span>•</span>
                                <span className="whitespace-nowrap">{item.material_finish}</span>
                              </div>
                            </td>

                            <td className="px-4 py-2.5 text-slate-700 min-w-[160px]">
                              <div className="text-xs break-words" title={item.car_variant}>
                                {item.car_variant}
                              </div>
                            </td>

                            <td className="px-3 py-2.5 text-right font-bold text-slate-900 whitespace-nowrap">
                              Rp {(item.selling_price || 0).toLocaleString('id-ID')}
                            </td>

                            <td className="px-3 py-2.5 text-right font-medium text-slate-600 whitespace-nowrap">
                              Rp {(item.reseller_price || 0).toLocaleString('id-ID')}
                            </td>

                            <td className="px-3 py-2.5 text-right font-medium text-sky-700 whitespace-nowrap">
                              Rp {(item.distributor_price || item.reseller_price || 0).toLocaleString('id-ID')}
                            </td>

                            <td className="px-4 py-2.5 text-center whitespace-nowrap">
                              {!item.isValid ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 whitespace-nowrap" title={item.errors.join(', ')}>
                                  <AlertCircle className="w-3 h-3" />
                                  Error
                                </span>
                              ) : item.isDuplicate ? (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                                  duplicateMode === 'UPDATE'
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`} title={item.warnings.join(', ')}>
                                  <RefreshCw className="w-3 h-3" />
                                  {duplicateMode === 'UPDATE' ? 'Update' : 'Lewati'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 whitespace-nowrap">
                                  <Check className="w-3 h-3" />
                                  Siap Import
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Progress Bar during Batch Import */}
              {isImporting && (
                <div className="space-y-2 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl animate-in fade-in">
                  <div className="flex justify-between text-xs font-bold text-indigo-900">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>Sedang menulis data ke Firestore Database...</span>
                    </span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="w-full bg-indigo-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
          <div>
            {parsedData && !importResult && (
              <button
                type="button"
                disabled={isImporting}
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Ganti File
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isImporting}
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>

            {parsedData && !importResult && (
              <button
                type="button"
                disabled={isImporting || parsedData.validCount === 0}
                onClick={handleExecuteImport}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengimpor ({importProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Konfirmasi & Import ({parsedData.validCount} Produk)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
