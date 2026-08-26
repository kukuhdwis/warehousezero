# 📦 NDK Warehouse — Modern Warehouse Management System (WMS) V3.0 (Zero-Trust Backend)

![Preview 1](image.png)
![Preview 2](image-1.png)
![Preview 3](image-2.png)

[ 🇬🇧 English Version ](./readme.md) | [ 🇮🇩 Bahasa Indonesia ](./README.id.md)

---

**NDK Warehouse (WarehouseZero)** is a modern, enterprise-ready Warehouse Management System (WMS) designed around a **Zero-Trust Backend Mutation Architecture**, built using **React 19**, **Vite**, **Tailwind CSS**, **Google Firebase Firestore V3.0**, and **Firebase Cloud Functions (TypeScript)**.

It ensures end-to-end data integrity by restricting client write privileges, ensuring atomic stock decrement/increment on the backend, safeguarding private cost/margin pricing, preventing fraudulent sales transactions, and enforcing automated credit limit and overdue accounts receivable guards.

---

## 🏗️ Architecture Principle: Zero-Trust Backend Mutation

```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT TIER (Web / POS / Mobile)                          │
│   • Staff & Central HQ only possess isolated READ permissions (Scoped Queries).          │
│   • Clients are STRICTLY FORBIDDEN from direct `updateDoc()`, `setDoc()`, or `addDoc()` │
│     to sensitive collections (`branch_stocks`, `sales_transactions`, `invoices`).        │
└────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                             │ (HTTPS Callable with Auth Token)
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                         CLOUD FUNCTIONS TIER (Firebase Admin SDK)                        │
│   1. `processPOSSale()`           -> Stock Validation + Atomic Decrement + Record Sale   │
│   2. `processCustomBundlingSale()`-> Component Validation + Atomic Decrement + Record    │
│   3. `confirmTransferReceipt()`   -> State Machine Validation + Branch Stock Increment   │
│   4. `createStockTransfer()`      -> Overdue Receivables Check + Credit Limit Guard      │
│   5. `setUserRoleAndBranch()`     -> Custom Claims + Immediate Refresh Token Revocation  │
│   6. `updateBranchCreditLimit()`  -> Admin Only + Write to Immutable Audit Log           │
└────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                             │ (Admin SDK Bypass Rules)
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                   DATABASE TIER (Firestore)                              │
│   • `/branch_stocks`          -> `allow write: if false;` (Tamper-proof from client)     │
│   • `/sales_transactions`     -> `allow write: if false;` (Prevents forged receipts)     │
│   • `/product_pricings`       -> `allow write: if false;` (HPP & Margins isolated)       │
│   • `/invoices`               -> `allow write: if false;` (Anti-tamper debt records)     │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Features

### 🔐 1. Bulletproof Firestore Security Rules V3.0
- **Locked Stock Mutation**: `/branch_stocks` and `/sales_transactions` enforce `allow write: if false;`, eliminating client-side tampering.
- **Private Pricing Isolation**: `/product_pricings` (COGS/HPP, distributor price, reseller price) is segregated from public product catalogs.
- **Scoped Read Access**: Branch users can only view data, inventory, and stock transfers belonging to their assigned branch.

### ⚡ 2. Core Cloud Functions (Atomic Mutator Engine)
1. **`processPOSSale`**: Validates stock availability, runs atomic decrement (`runTransaction`), and records sales receipts.
2. **`confirmTransferReceipt`**: Strict state machine (`IN_TRANSIT` ➔ `RECEIVED`), atomic recipient branch stock increment, and delivery order closure.
3. **`setUserRoleAndBranch`**: Assigns custom claims (`role`, `branch_id`, `branch_type`), invalidates stale session tokens via `revokeRefreshTokens()`, and syncs user profiles.
4. **`updateBranchCreditLimit`**: Modifies credit limits and writes immutable audit logs to `/credit_limit_audit_logs`.
5. **`createStockTransfer`**:
   - **Overdue Accounts Receivable Guard**: Rejects stock transfers if the destination branch has overdue unpaid invoices.
   - **Multi-tier Pricing Valuation**: Dynamically resolves pricing by branch tier (`DISTRIBUTOR`, `RESELLER`, `INTERNAL`).
   - **Credit Ceiling Guard**: Enforces credit limits for non-cash terms.
   - **Atomic Central Warehouse Decrement**: Deducts central stock and creates stock transfer DO + accounts receivable invoice in one transaction.

### 🏢 3. Multi-Branch & Central Monitoring
- Real-time stock valuation, credit limit monitoring, and accounts receivable tracking.
- Branch partner tiers: `INTERNAL`, `DISTRIBUTOR`, `RESELLER`.
- Payment terms: `CASH`, `TEMPO_7_HARI`, `TEMPO_14_HARI`, `TEMPO_30_HARI`.

### 📦 4. Product Catalog, Barcode & Camera Scanner
- Built-in barcode and QR Code renderer powered by `bwip-js`.
- Integrated live camera barcode/QR scanner powered by `html5-qrcode`.
- One-click CSV export for inventory and transaction records.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/) |
| **Styling & UI** | [Tailwind CSS 3](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/) |
| **Database & Cloud** | [Google Firebase v11](https://firebase.google.com/) (Firestore Cloud Database) |
| **Cloud Functions** | [Firebase Functions v5](https://firebase.google.com/docs/functions) + TypeScript |
| **Barcode Engine** | [bwip-js](https://github.com/metafloor/bwip-js) |
| **Camera QR/Barcode Scanner** | [html5-qrcode](https://github.com/mebjas/html5-qrcode) |

---

## 🚀 Getting Started

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/kukuhdwis/warehousezero.git
cd warehousezero

# Install frontend dependencies
npm install

# Install Cloud Functions backend dependencies
cd functions
npm install
cd ..
```

### 2. Running Local Development Server

```bash
npm run dev
```

Open your browser at `http://localhost:5173`.

### 3. Production Build

```bash
# Build frontend web bundle
npm run build

# Compile Cloud Functions (TypeScript)
cd functions
npm run build
cd ..
```

---

## 🚀 Deployment to Google Firebase

To deploy Security Rules, Cloud Functions, and Hosting:

```bash
# 1. Login to Firebase CLI
npx firebase-tools login

# 2. Select your Firebase project
npx firebase-tools use <your-project-id>

# 3. Deploy Firestore Rules and Cloud Functions
npx firebase-tools deploy --only firestore:rules,functions

# 4. Deploy Web Hosting
npx firebase-tools deploy --only hosting
```

---

## 🔐 Default Demo Login Credentials

For local simulation and fresh setups, two default accounts are available:

### 1. 🛡️ Super Administrator Account
- **Email**: `admin@perusahaan.com`
- **Password**: `admin`
- **Role**: `Administrator` (Full system access: User & Branch management, Global monitoring, Inbound & Outbound)

### 2. 🏢 Central Warehouse Staff Account
- **Email**: `staffpusat@perusahaan.com`
- **Password**: `staff`
- **Role**: `Staff Pusat` (Multi-branch monitoring, Inbound & Outbound, Global transactions, **Strictly no access to User & Branch management**)


---

## 📁 Directory Structure

```text
warehousezero/
├── firestore.rules             # Bulletproof Firestore Security Rules V3.0
├── firebase.json               # Firebase Hosting, Functions & Firestore config
├── functions/                  # Cloud Functions Backend (TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts            # Atomic Mutator Engine (processPOSSale, confirmTransferReceipt, etc.)
├── public/                     # Static assets
├── src/
│   ├── components/             # UI Components
│   │   ├── BarcodeModal.jsx    # Barcode/QR generator modal
│   │   ├── BottomNav.jsx       # Mobile bottom navigation
│   │   ├── BranchManagement.jsx# Branch CRUD & credit limits
│   │   ├── BranchMonitoring.jsx# Centralized branch analytics & AR tracking
│   │   ├── Dashboard.jsx       # Core KPI metrics
│   │   ├── FirebaseSettingsModal.jsx # Cloud connector dialog
│   │   ├── LoginView.jsx       # Authentication page
│   │   ├── Navbar.jsx          # Top navigation bar
│   │   ├── ProductManagement.jsx # Catalog & public pricing
│   │   ├── ScannerModal.jsx    # Live camera scanner
│   │   ├── Sidebar.jsx         # Sidebar navigation
│   │   ├── StockIn.jsx         # Stock in workflow
│   │   ├── StockOut.jsx        # Stock out workflow
│   │   ├── TransactionHistory.jsx # Movement audit logs
│   │   └── UserManagement.jsx  # Staff & RBAC management
│   ├── services/
│   │   ├── authService.js      # Session & token refresh listener
│   │   ├── cloudFunctionsService.js # HTTPS Callable Cloud Functions client
│   │   ├── dataService.js      # Data storage & CRUD services
│   │   └── firebase.js         # Firebase App, DB, Auth & Functions initialization
│   ├── App.jsx                 # Main application layout
│   ├── index.css               # Global CSS & Tailwind imports
│   └── main.jsx                # React root entrypoint
├── package.json                # Frontend package configuration
├── README.id.md                # Indonesian Documentation
├── readme.md                   # English Documentation
├── tailwind.config.js          # Tailwind CSS theme configuration
└── vite.config.js              # Vite configuration
```

---

## 👨‍💻 Developer

Developed by **[kukuhdwisaputra.site](https://kukuhdwisaputra.site)**.

---

## 📄 License

This project is open source under the [MIT License](LICENSE).
