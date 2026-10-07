/**
 * Angular-Style Lazy Loading Module Router
 * Implements code-splitting and dynamic component chunk resolution
 * equivalent to Angular's route `loadComponent: () => import(...)`
 */

import React, { lazy, Suspense } from 'react';
import { ModuleRoute, Product } from '../models/inventory.types';
import { Loader2, AlertTriangle, RotateCcw } from 'lucide-react';

// Lazy-loaded dynamic imports (Generates dedicated split chunks in Vite build)
const LazyOverviewComponent = lazy(() => import('../features/overview/OverviewComponent'));
const LazyProductsComponent = lazy(() => import('../features/products/ProductsComponent'));
const LazyStockMovementsComponent = lazy(() => import('../features/movements/StockMovementsComponent'));
const LazyWarehouseManagerComponent = lazy(() => import('../features/warehouses/WarehouseManagerComponent'));
const LazyPurchaseOrdersComponent = lazy(() => import('../features/purchase-orders/PurchaseOrdersComponent'));
const LazySuppliersComponent = lazy(() => import('../features/suppliers/SuppliersComponent'));
const LazyDatabaseConsoleComponent = lazy(() => import('../features/database/DatabaseConsoleComponent'));

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyModuleOutlet caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-slate-900 border border-rose-800/80 rounded-xl p-8 max-w-xl mx-auto my-12 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-700 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Module Rendering Notice</h3>
            <p className="text-xs text-slate-400">
              The view encountered a state mismatch. You can retry or reset local cache.
            </p>
          </div>
          {this.state.error && (
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-left font-mono text-xs text-rose-300 max-h-32 overflow-y-auto">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
            >
              Retry View
            </button>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem('nexus_inventory_litedb_v1');
                  window.location.reload();
                } catch {
                  window.location.reload();
                }
              }}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Cache &amp; Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
    <ErrorBoundary key={activeRoute}>
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
    </ErrorBoundary>
  );
}
