# Nexus Stock — Enterprise Inventory Management Dashboard

A high-performance inventory management system architected with **Angular Signal-based state management**, **route-level dynamic lazy loading**, and an embedded **LiteDatabase** persistence layer with responsive **Tailwind CSS** styling.

---

## Key Features

- **Angular Signals State Management**:
  - Implements Angular's fine-grained reactive primitives: `signal()`, `computed()`, and `effect()`.
  - Zero unnecessary re-renders; computed metrics (KPIs, active replenishment alerts, facility fill rates, and filtered views) recalculate reactively upon signal mutations.
- **Route-Level Lazy Loading**:
  - Employs dynamic code-splitting chunk resolution (`loadComponent: () => import(...)` pattern) across all 7 operational modules:
    - **Operations Overview**: Real-time KPI telemetry, low-stock reorder queue, and velocity feeds.
    - **Stock Catalog & SKUs**: High-density data grid with multi-attribute filtering, barcode generator/viewer, and unit margin calculations.
    - **Stock Movements Ledger**: Append-only transactional audit stream tracking every inbound, outbound, transfer, and scrap adjustment.
    - **Facility Topology**: Multi-warehouse spatial monitoring, cold-chain controls, and inter-facility stock transfers.
    - **Procurement & POs**: Purchase order lifecycle with 1-click dock shipment receiving that automatically restocks catalog items.
    - **Suppliers Directory**: Lead-time SLA tracking, quality scoring, and vendor catalogs.
    - **LiteDatabase Console**: In-browser document inspector, collection stats, backup JSON import/export, and transaction audit trails.
- **Embedded LiteDatabase Storage Engine**:
  - Client-side document database backed by `IndexedDB` with automatic `localStorage` fallback.
  - ACID-like atomic mutations across 7 relational collections (`products`, `warehouses`, `categories`, `stock_movements`, `purchase_orders`, `suppliers`, `audit_logs`).
  - Pre-seeded with realistic enterprise aerospace, semiconductor, photonics, and robotics components.
- **CSV Reporting & Export**:
  - One-click export of the active inventory product catalog to standardized, UTF-8 BOM encoded CSV reports compatible with Excel, Google Sheets, and enterprise BI suites.

---

## Prerequisites

Before running the application locally, make sure you have the following installed:

- **Node.js**: `v18.0.0` or higher (recommended: `Node.js 20 LTS` or `22 LTS`)
- **Package Manager**: `npm` (comes with Node.js) or `pnpm` / `yarn`

Verify your Node.js and npm versions:
```bash
node -v
npm -v
```

---

## Step-by-Step Local Setup

### 1. Clone or Extract the Project
Navigate to your desired project directory:
```bash
cd nexus-stock-inventory
```

### 2. Install Dependencies
Install all required dependencies defined in `package.json`:
```bash
npm install
```
*(If you use pnpm: `pnpm install`, or yarn: `yarn install`)*

### 3. Configure Environment Variables
Copy the sample environment file to create your local `.env`:
```bash
cp .env.example .env
```

The application runs entirely in-browser using the embedded LiteDatabase engine without requiring external database servers or third-party API keys for core inventory operations.

### 4. Start the Development Server
Launch the Vite development server:
```bash
npm run dev
```

The console will output the local server URL:
```text
  VITE v8.x.x  ready in 250 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://0.0.0.0:3000/
```

### 5. Access the Dashboard
Open your browser and navigate to:
```
http://localhost:3000
```

---

## Production Build

To build the optimized static production bundle:

```bash
npm run build
```

This generates code-split production assets in the `dist/` directory, with separate lazy chunks for each dashboard module.

To preview the production build locally:
```bash
npm run preview
```

To run type checking and lint validation:
```bash
npm run lint
```

---

## Project Structure

```text
├── index.html                   # HTML entry point with Plus Jakarta Sans & JetBrains Mono typography
├── metadata.json                # AI Studio application metadata
├── package.json                 # Project dependencies and npm scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite configuration with React & Tailwind CSS plugins
└── src/
    ├── main.tsx                 # React DOM mount point
    ├── index.css                # Global styles and Tailwind CSS imports
    ├── App.tsx                  # Root application frame with header, sidebar, modals, & router outlet
    ├── core/
    │   ├── signals.ts           # Angular Signals engine (signal, computed, effect, useSignalValue)
    │   └── lazy-router.tsx      # Dynamic code-splitting router and lazy module loader
    ├── models/
    │   └── inventory.types.ts   # TypeScript interfaces (Product, Warehouse, StockMovement, PO, etc.)
    ├── services/
    │   ├── litedatabase.ts      # Embedded LiteDatabase storage engine with query engine & seed data
    │   └── inventory-store.service.ts # Angular-style injectable service with reactive signals
    ├── features/                # Lazy-loaded feature modules (code-split chunks)
    │   ├── overview/            # Operations Overview (KPI cards, replenishment queue, velocity)
    │   ├── products/            # Catalog & SKUs (data grid, search, barcode, CSV export)
    │   ├── movements/           # Stock Movements Ledger (audit trail, ledger CSV export)
    │   ├── warehouses/          # Facility Topology & Inter-facility transfer wizard
    │   ├── purchase-orders/     # Procurement workflow & dock receiving actions
    │   ├── suppliers/           # Verified vendor directory and SLA metrics
    │   └── database/            # LiteDatabase Inspector, backup import/export, and reset tools
    └── components/              # Shared UI components
        ├── TopBar.tsx           # Standardized 3-zone header with facility switcher & quick actions
        ├── NavigationSidebar.tsx# Collapsible sidebar navigation with reactive alert badges
        ├── ProductFormModal.tsx # Add / Edit catalog SKU dialog
        ├── StockAdjustmentModal.tsx # Inbound / Outbound / Scrap quantity reconciliation modal
        ├── StockTransferModal.tsx   # Inter-facility relocation dialog
        ├── PurchaseOrderModal.tsx   # Issue new purchase order agreement modal
        └── ToastContainer.tsx   # Angular signal-dispatched toast alerts
```

---

## Managing LiteDatabase Data & Backups

- **Persistence**: All edits, stock adjustments, purchase order receipts, and new SKUs are saved to the browser's persistent `IndexedDB` storage.
- **Export Backup**: Navigate to **LiteDatabase Console** &rarr; click **Export Backup (JSON)** to download a full snapshot.
- **Restore Backup**: Click **Restore Backup** in the console and upload any previously exported JSON file.
- **Factory Reset**: Click **Factory Reset Seed** to restore the default sample dataset at any time.

---

## License
Apache-2.0
