/**
 * Angular-Style Lazy Loading Module Router
 * Implements code-splitting and dynamic component chunk resolution
 * equivalent to Angular's route `loadComponent: () => import(...)`
 */

import React, { lazy, Suspense } from 'react';
import { ModuleRoute, Product } from '../models/inventory.types';
import { Loader2, Sparkles, Layers } from 'lucide-react';

// Lazy-loaded dynamic imports (Generates dedicated split chunks in Vite build)
const LazyOverviewComponent = lazy(() => import('../features/overview/OverviewComponent'));
const LazyProductsComponent = lazy(() => import('../features/products/ProductsComponent'));
const LazyStockMovementsComponent = lazy(() => import('../features/movements/StockMovementsComponent'));
const LazyWarehouseManagerComponent = lazy(() => import('../features/warehouses/WarehouseManagerComponent'));
const LazyPurchaseOrdersComponent = lazy(() => import('../features/purchase-orders/PurchaseOrdersComponent'));
const LazySuppliersComponent = lazy(() => import('../features/suppliers/SuppliersComponent'));
const LazyDatabaseConsoleComponent = lazy(() => import('../features/database/DatabaseConsoleComponent'));

export interface LazyModuleOutletProps {
  activeRoute: ModuleRoute;
  onOpenStockAdjust: (product?: Product) => void;
  onOpenEditProduct: (product: Product) => void;
  onOpenNewProduct: () => void;
  onOpenTransfer: (defaultFromWarehouseId?: string) => void;
  onOpenTransferWithProduct: (product: Product) => void;
  onOpenCreatePO: () => void;
}

export function LazyModuleOutlet({
  activeRoute,
  onOpenStockAdjust,
  onOpenEditProduct,
  onOpenNewProduct,
  onOpenTransfer,
  onOpenTransferWithProduct,
  onOpenCreatePO,
}: LazyModuleOutletProps) {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <div className="absolute inset-0 blur-md bg-indigo-500/20 rounded-full animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <div className="text-sm font-semibold text-slate-200">
              Loading Lazy Feature Module...
            </div>
            <div className="text-xs text-slate-400 font-mono">
              loadComponent: () =&gt; import('./features/{activeRoute}')
            </div>
          </div>
        </div>
      }
    >
      {activeRoute === 'overview' && (
        <LazyOverviewComponent
          onOpenStockAdjust={onOpenStockAdjust}
          onOpenNewProduct={onOpenNewProduct}
          onOpenTransfer={() => onOpenTransfer()}
        />
      )}

      {activeRoute === 'products' && (
        <LazyProductsComponent
          onOpenStockAdjust={(p) => onOpenStockAdjust(p)}
          onOpenEditProduct={onOpenEditProduct}
          onOpenNewProduct={onOpenNewProduct}
          onOpenTransferWithProduct={onOpenTransferWithProduct}
        />
      )}

      {activeRoute === 'movements' && <LazyStockMovementsComponent />}

      {activeRoute === 'warehouses' && (
        <LazyWarehouseManagerComponent
          onOpenTransfer={(whId) => onOpenTransfer(whId)}
          onOpenStockAdjust={(p) => onOpenStockAdjust(p)}
        />
      )}

      {activeRoute === 'purchase_orders' && (
        <LazyPurchaseOrdersComponent onOpenCreatePO={onOpenCreatePO} />
      )}

      {activeRoute === 'suppliers' && <LazySuppliersComponent />}

      {activeRoute === 'database' && <LazyDatabaseConsoleComponent />}
    </Suspense>
  );
}
