import React from 'react';
import {
  Search,
  Warehouse as WarehouseIcon,
  Plus,
  RefreshCw,
  Bell,
  Menu,
} from 'lucide-react';
import { useSignalValue } from '../core/signals';
import { inventoryStore } from '../services/inventory-store.service';
import { ModuleRoute } from '../models/inventory.types';

interface TopBarProps {
  onToggleSidebar: () => void;
  onOpenQuickStockAdjust: () => void;
  onOpenNewProduct: () => void;
}

export default function TopBar({
  onToggleSidebar,
  onOpenQuickStockAdjust,
  onOpenNewProduct,
}: TopBarProps) {
  const activeRoute = useSignalValue(inventoryStore.activeRoute);
  const selectedWh = useSignalValue(inventoryStore.selectedWarehouseId);
  const warehouses = useSignalValue(inventoryStore.warehouses);
  const lowStock = useSignalValue(inventoryStore.lowStockProducts);

  const routeBreadcrumbs: Record<ModuleRoute, string> = {
    overview: 'Operations Overview',
    products: 'Stock Catalog & Ledger',
    movements: 'Audit Trail Ledger',
    warehouses: 'Facility Topology',
    purchase_orders: 'Procurement Orders',
    suppliers: 'Vendor Directory',
    database: 'LiteDatabase Console',
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Zone 1: Mobile toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-400">Nexus Stock</span>
          <span className="text-slate-600">/</span>
          <span className="font-medium text-slate-100">{routeBreadcrumbs[activeRoute]}</span>
        </div>
      </div>

      {/* Zone 2: Warehouse selector & quick filters */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-slate-850 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
          <WarehouseIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400">Facility:</span>
          <select
            value={selectedWh}
            onChange={(e) => inventoryStore.selectedWarehouseId.set(e.target.value)}
            className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900">All Facilities (Global)</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id} className="bg-slate-900">
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenQuickStockAdjust}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700 cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
          Quick Adjust
        </button>

        <button
          onClick={onOpenNewProduct}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          Add SKU
        </button>
      </div>
    </header>
  );
}
