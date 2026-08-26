import React, { useState } from 'react';
import { X, Database, CheckCircle2, AlertTriangle, Key, ExternalLink } from 'lucide-react';
import { isFirebaseConfigured } from '../services/firebase';

export default function FirebaseSettingsModal({ isOpen, onClose, onConfigSaved }) {
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');

  const isConnected = isFirebaseConfigured();

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const config = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId
    };
    localStorage.setItem("wms_firebase_config", JSON.stringify(config));
    if (onConfigSaved) onConfigSaved();
    window.location.reload();
  };

  const handleResetToDemo = () => {
    localStorage.removeItem("wms_firebase_config");
    if (onConfigSaved) onConfigSaved();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in fade-in duration-200 my-8">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-600" />
            <h3 className="font-semibold text-slate-800">Pengaturan Google Firebase Platform</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            isConnected 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            {isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="font-semibold text-sm">
                {isConnected ? 'Terhubung ke Google Firebase' : 'Mode Offline / Local Simulation'}
              </h4>
              <p className="text-xs mt-0.5 opacity-90">
                {isConnected 
                  ? 'Aplikasi sedang terintegrasi langsung dengan Firestore Cloud Database Google secara real-time.'
                  : 'Aplikasi berjalan lancar dengan data lokal. Masukkan API Key Firebase dari Google Console di bawah ini untuk menghubungkan cloud database permanen gratis.'}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-600">
            <div className="flex items-center justify-between font-semibold text-slate-700">
              <span>Langkah Mendapatkan Firebase Keys (100% Gratis):</span>
              <a 
                href="https://console.firebase.google.com/" 
                target="_blank" 
                rel="noreferrer"
                className="text-sky-600 hover:underline flex items-center gap-1"
              >
                Firebase Console <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-500">
              <li>Buat Proyek di <strong>Firebase Console</strong>.</li>
              <li>Masuk ke <strong>Project Settings</strong> {'>'} <strong>General</strong> {'>'} Tambah <strong>Web App</strong>.</li>
              <li>Copy objek <code className="bg-slate-200 px-1 py-0.5 rounded">firebaseConfig</code> dan paste value-nya di bawah.</li>
            </ol>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">API Key</label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Project ID</label>
                <input
                  type="text"
                  placeholder="wms-warehousezero"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Auth Domain</label>
                <input
                  type="text"
                  placeholder="wms-warehousezero.firebaseapp.com"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Storage Bucket</label>
                <input
                  type="text"
                  placeholder="wms-warehousezero.appspot.com"
                  value={storageBucket}
                  onChange={(e) => setStorageBucket(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Messaging Sender ID</label>
                <input
                  type="text"
                  placeholder="123456789"
                  value={messagingSenderId}
                  onChange={(e) => setMessagingSenderId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">App ID</label>
                <input
                  type="text"
                  placeholder="1:123456789:web:abcdef"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {isConnected && (
                <button
                  type="button"
                  onClick={handleResetToDemo}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition"
                >
                  Kembali ke Local Mode
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-xl text-xs transition shadow-sm shadow-sky-600/30"
              >
                Simpan & Hubungkan Firebase
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
