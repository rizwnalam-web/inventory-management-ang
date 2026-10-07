# Inventory Management Dashboard (Angular 19 Standalone)

A complete native **Angular 19** application featuring **Signals reactive state management**, **route-level dynamic lazy loading**, **LiteDatabase** persistence, and **Tailwind CSS**.

---

## Quick Start (Local Setup)

### 1. Prerequisites
- **Node.js**: `v18.19.0` or higher (recommended: `v20.x LTS` or `v22.x LTS`)
- **Angular CLI**: `v19` (optional, can run via `npx @angular/cli`)

### 2. Install Dependencies
Open a terminal inside this directory (`inventory-management-ang`):
```bash
npm install
```

### 3. Launch Development Server
```bash
npm start
```
or
```bash
npx ng serve --port 4200 --open
```

Navigate your browser to:
```
http://localhost:4200
```

---

## Architectural Highlights

- **Angular 19 Zoneless Signal Architecture (`src/app/services/inventory.service.ts`)**:
  - Uses native `@angular/core` `signal()`, `computed()`, and `effect()`.
  - Configured with `provideExperimentalZonelessChangeDetection()` in `app.config.ts`.
- **Route-Based Lazy Loading (`src/app/app.routes.ts`)**:
  - Uses `loadComponent: () => import(...)` for code-splitting across all 7 operational modules:
    - `/overview`: Executive KPI dashboard and replenishment queue.
    - `/products`: High-density catalog data grid with real-time CSV reporting.
    - `/movements`: Append-only stock audit ledger.
    - `/warehouses`: Spatial facility utilization and bin locations.
    - `/purchase-orders`: Procurement order workflow.
    - `/suppliers`: Verified vendor directory.
    - `/database`: LiteDatabase collection console & backup explorer.
- **Embedded LiteDatabase Service (`src/app/services/litedatabase.service.ts`)**:
  - Persistent document store backed by `localStorage` / `IndexedDB`.
  - Atomic transactions and full JSON snapshot backup & restore.
- **Tailwind CSS (`src/styles.css`, `tailwind.config.js`)**:
  - Dark slate aesthetic with tabular numerals (`tabular-nums`) and responsive layout.

---

## Production Build

To compile an optimized production build:
```bash
npm run build
```
Output artifacts will be generated in `dist/inventory-management-ang/`.
