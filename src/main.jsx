import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught runtime error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl mx-auto flex items-center justify-center text-3xl font-extrabold">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-slate-100">Terjadi Kesalahan Tampilan</h2>
            <p className="text-xs text-slate-400">
              Aplikasi mengalami kendala saat memuat data di browser Anda. Cobalah muat ulang aplikasi.
            </p>
            {this.state.error && (
              <div className="p-3 bg-slate-950 text-rose-300 rounded-xl text-left text-[11px] font-mono overflow-x-auto border border-rose-900/50">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
            >
              🔄 Muat Ulang Aplikasi (Refresh Browser)
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

