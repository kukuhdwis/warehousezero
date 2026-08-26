# 📦 WarehouseZero — Modern Warehouse Management System (WMS)

[ 🇬🇧 English Version ](./readme.md) | [ 🇮🇩 Bahasa Indonesia ](./README.id.md)

---

**WarehouseZero** is a modern, responsive, and lightweight Warehouse Management System built with **React 19**, **Vite**, **Tailwind CSS**, and **Google Firebase**. It is designed to streamline multi-branch inventory tracking, stock movements (Stock In / Stock Out), barcode & QR scanning, and role-based operational workflows.

---


## 🌟 Key Features

### 🏢 1. Multi-Branch & Central Monitoring
- **Central HQ & Branch Management**: Add and manage multiple warehouse locations with unique branch codes, addresses, and PIC assignments.
- **Real-Time Branch Monitoring**: High-level overview of total inventory value, low-stock warnings, and transaction activities per branch.
- **Branch Data Scoping**: Staff members automatically access and manage stock restricted to their assigned branch.

### 📦 2. Comprehensive Inventory Management
- **Product Catalog**: Track SKUs, barcodes, categories, purchase/selling prices, minimum stock alerts, and current stock quantities.
- **Barcode & QR Code Generation**: Built-in barcode/QR renderer using `bwip-js` with one-click printable labels.
- **Live Camera Scanner**: Integrated camera barcode & QR scanner powered by `html5-qrcode` for rapid item lookup.

### 🔄 3. Stock In & Stock Out Operations
- **Stock In (Barang Masuk)**: Record incoming goods from suppliers or central warehouse with automatic stock increments.
- **Stock Out (Barang Keluar)**: Process shipments and sales with real-time stock deduction and prevention of negative inventory.
- **Audit Logging**: Every movement records timestamp, operator name, quantity, branch, and notes.

### 📊 4. Transaction History & CSV Export
- **Historical Audit Trail**: Searchable, filterable list of all inbound and outbound transactions.
- **One-Click Export**: Export inventory lists and transaction histories directly into CSV format.

### 👥 5. Role-Based Access Control (RBAC)
- **Administrator (`ADMIN`)**: Full access to global analytics, branch management, user creation, and configuration settings.
- **Branch Staff (`STAFF_BRANCH`)**: Streamlined operational interface focused on day-to-day stock entry, dispatch, and local inventory.

### ☁️ 6. Hybrid Cloud & Offline Architecture
- **Google Firebase Firestore**: Real-time cloud synchronization across devices.
- **Local Storage Fallback**: Runs smoothly without configuration using local browser storage for instant demos or offline usage.
- **In-App Cloud Connector**: Connect your Firebase project directly from the web interface without touching code.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/) |
| **Styling & UI** | [Tailwind CSS 3](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/) |
| **Database & Cloud** | [Google Firebase v11](https://firebase.google.com/) (Firestore Cloud Database) |
| **Barcode Engine** | [bwip-js](https://github.com/metafloor/bwip-js) |
| **Camera QR/Barcode Scanner** | [html5-qrcode](https://github.com/mebjas/html5-qrcode) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### 1. Installation
Clone the repository and install the dependencies:

```bash
git clone https://github.com/kukuhdwis/warehousezero.git
cd warehousezero
npm install
```

### 2. Development Server
Start the local development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

### 3. Production Build
To create an optimized production build:

```bash
npm run build
npm run preview
```

---

## ⚙️ Google Firebase Setup (Optional)

To enable persistent cloud database synchronization across multiple devices:

### Option A: Via In-App Settings Modal (Easiest)
1. Open the application in your browser.
2. Click the **"Google Firebase Platform"** or Database icon in the top navigation bar.
3. Paste your Firebase Web App configuration keys from the [Firebase Console](https://console.firebase.google.com/).
4. Click **"Simpan & Hubungkan Firebase"**.

### Option B: Via Environment Variables
1. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
2. Fill in your credentials:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
   ```

---

## 🔐 Default Demo Login Credentials

For local simulation and fresh setups, the default root administrator credentials are:

- **Email**: `admin@perusahaan.com`
- **Password**: `admin`
- **Role**: `Administrator (Pusat)`

---

## 📁 Project Structure

```text
warehousezero/
├── .agents/                    # Custom agent and skill workflows
├── public/                     # Static assets
├── src/
│   ├── components/             # UI Components
│   │   ├── BarcodeModal.jsx    # Barcode/QR generator modal
│   │   ├── BottomNav.jsx       # Mobile bottom navigation bar
│   │   ├── BranchManagement.jsx# Branch CRUD & assignment
│   │   ├── BranchMonitoring.jsx# Central branch overview
│   │   ├── Dashboard.jsx       # Main KPI metrics & stats
│   │   ├── FirebaseSettingsModal.jsx # Cloud setup dialog
│   │   ├── LoginView.jsx       # Authentication screen
│   │   ├── Navbar.jsx          # Top application bar
│   │   ├── ProductManagement.jsx # Inventory catalog
│   │   ├── ScannerModal.jsx    # Live camera scanner
│   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   ├── StockIn.jsx         # Inbound stock workflow
│   │   ├── StockOut.jsx        # Outbound stock workflow
│   │   ├── TransactionHistory.jsx # Movement audit logs
│   │   └── UserManagement.jsx  # Staff & RBAC management
│   ├── services/
│   │   ├── authService.js      # Session & authentication handler
│   │   ├── dataService.js      # Data storage & CRUD services
│   │   └── firebase.js         # Firebase client initialization
│   ├── App.jsx                 # Root layout & route state
│   ├── index.css               # Global styling & Tailwind directives
│   └── main.jsx                # App entry point
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── firebase.json               # Firebase Hosting configuration
├── package.json                # Dependencies & scripts
├── README.id.md                # Project documentation (Bahasa Indonesia)
├── readme.md                   # Project documentation (English)
├── tailwind.config.js          # Tailwind styling configuration
└── vite.config.js              # Vite bundler configuration
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
