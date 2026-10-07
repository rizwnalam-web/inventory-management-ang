/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSignalValue } from './core/signals';
import { inventoryStore } from './services/inventory-store.service';
import NavigationSidebar from './components/NavigationSidebar';
import TopBar from './components/TopBar';
import { LazyModuleOutlet } from './core/lazy-router';
import StockAdjustmentModal from './components/StockAdjustmentModal';
import ProductFormModal from './components/ProductFormModal';
import StockTransferModal from './components/StockTransferModal';
import PurchaseOrderModal from './components/PurchaseOrderModal';
import ToastContainer from './components/ToastContainer';
import { Product } from './models/inventory.types';
import { Cpu, Zap, Database, ArrowRight } from 'lucide-react';

export default function App() {
  const activeRoute = useSignalValue(inventoryStore.activeRoute);
  const kpis = useSignalValue(inventoryStore.kpis);

  // Modal dialog states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [isStockAdjustOpen, setIsStockAdjustOpen] = useState(false);

  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);

  const [transferProduct, setTransferProduct] = useState<Product | null>(null);
  const [transferFromWarehouse, setTransferFromWarehouse] = useState<string | undefined>(undefined);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);

  // Handlers
  const handleOpenStockAdjust = (product?: Product) => {
    setStockAdjustProduct(product || null);
    setIsStockAdjustOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditProduct(product);
    setIsProductFormOpen(true);
  };

  const handleOpenNewProduct = () => {
    setEditProduct(null);
    setIsProductFormOpen(true);
  };

  const handleOpenTransfer = (defaultFromWarehouseId?: string) => {
    setTransferProduct(null);
    setTransferFromWarehouse(defaultFromWarehouseId);
    setIsTransferOpen(true);
  };

  const handleOpenTransferWithProduct = (product: Product) => {
    setTransferProduct(product);
    setTransferFromWarehouse(product.warehouseId);
    setIsTransferOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Collapsible / Responsive Navigation Sidebar */}
      <NavigationSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar following Top Bar Contract */}
        <TopBar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenQuickStockAdjust={() => handleOpenStockAdjust()}
          onOpenNewProduct={handleOpenNewProduct}
        />

        {/* Angular Architecture & Reactive Signals Status Strip */}
        <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 md:px-6 py-2 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
              <Zap className="w-3 h-3" />
              <span>Angular Signals Engine</span>
            </span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span className="font-mono text-slate-300">
              {kpis.totalSkus} Observable Signals · 5 Computed Derivations
            </span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LiteDatabase Synced
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
            <span className="text-slate-400">Route Chunk:</span>
            <span className="text-slate-300 font-bold bg-slate-800 px-2 py-0.5 rounded">
              {activeRoute}.chunk.js (lazy)
            </span>
          </div>
        </div>

        {/* Main Lazy-Loaded Feature Viewport */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <LazyModuleOutlet
            activeRoute={activeRoute}
            onOpenStockAdjust={handleOpenStockAdjust}
            onOpenEditProduct={handleOpenEditProduct}
            onOpenNewProduct={handleOpenNewProduct}
            onOpenTransfer={handleOpenTransfer}
            onOpenTransferWithProduct={handleOpenTransferWithProduct}
            onOpenCreatePO={() => setIsCreatePOOpen(true)}
          />
        </main>
      </div>

      {/* Modals and Overlays */}
      {isStockAdjustOpen && (
        <StockAdjustmentModal
          initialProduct={stockAdjustProduct}
          onClose={() => {
            setIsStockAdjustOpen(false);
            setStockAdjustProduct(null);
          }}
        />
      )}

      {isProductFormOpen && (
        <ProductFormModal
          editProduct={editProduct}
          onClose={() => {
            setIsProductFormOpen(false);
            setEditProduct(null);
          }}
        />
      )}

      {isTransferOpen && (
        <StockTransferModal
          initialProduct={transferProduct}
          defaultFromWarehouseId={transferFromWarehouse}
          onClose={() => {
            setIsTransferOpen(false);
            setTransferProduct(null);
            setTransferFromWarehouse(undefined);
          }}
        />
      )}

      {isCreatePOOpen && (
        <PurchaseOrderModal onClose={() => setIsCreatePOOpen(false)} />
      )}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
