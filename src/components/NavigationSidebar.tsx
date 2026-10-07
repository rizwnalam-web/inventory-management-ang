import React from 'react';
import {
  LayoutDashboard,
  Package,
  History,
  Warehouse as WarehouseIcon,
  Truck,
  Users,
  Database,
  X,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useSignalValue } from '../core/signals';
import { inventoryStore } from '../services/inventory-store.service';
import { ModuleRoute } from '../models/inventory.types';

interface NavigationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NavigationSidebar({ isOpen, onClose }: NavigationSidebarProps) {
  const activeRoute = useSignalValue(inventoryStore.activeRoute);
  const lowStock = useSignalValue(inventoryStore.lowStockProducts);
  const kpis = useSignalValue(inventoryStore.kpis);

  const navItems: {
    id: ModuleRoute;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Operations Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'products',
      label: 'Stock Catalog & SKUs',
      icon: Package,
      badge: lowStock.length > 0 ? `${lowStock.length} alert` : undefined,
      badgeColor: 'text-amber-400',
    },
    {
      id: 'movements',
      label: 'Stock Movements Ledger',
      icon: History,
    },
    {
      id: 'warehouses',
      label: 'Facility Topology',
      icon: WarehouseIcon,
    },
    {
      id: 'purchase_orders',
      label: 'Purchase Orders',
      icon: Truck,
      badge: kpis.activePurchaseOrders > 0 ? kpis.activePurchaseOrders : undefined,
      badgeColor: 'text-sky-400',
    },
    {
      id: 'suppliers',
      label: 'Suppliers Directory',
      icon: Users,
    },
    {
      id: 'database',
      label: 'LiteDatabase Console',
      icon: Database,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-base shadow-sm">
                N
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white">Nexus Stock</span>
                <span className="block text-[10px] text-slate-400 -mt-0.5 font-medium">
                  Inventory Management
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="md:hidden p-1 text-slate-400 hover:text-white rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Modules &amp; Routing
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeRoute === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    inventoryStore.activeRoute.set(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer group ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`font-mono text-[11px] font-bold ${
                        isActive ? 'text-indigo-200' : item.badgeColor || 'text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer: Architecture specs & state telemetry */}
        <div className="p-3.5 m-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center gap-1.5 text-indigo-400 font-semibold text-[11px]">
            <Zap className="w-3.5 h-3.5" />
            <span>Angular Signals &amp; LiteDB</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Zoneless reactive store with lazy loading and atomic client-side transactions.
          </p>
          <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between font-mono">
            <span>Storage: IndexedDB</span>
            <span className="text-emerald-400">Live Synced</span>
          </div>
        </div>
      </aside>
    </>
  );
}
