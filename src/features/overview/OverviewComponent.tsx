import React, { useState } from 'react';
import {
  Package,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  Warehouse as WarehouseIcon,
  Plus,
  RefreshCw,
  Clock,
  ArrowRightLeft,
  ChevronRight,
  DollarSign,
  Layers,
  Download,
} from 'lucide-react';
import { useSignalValue } from '../../core/signals';
import { inventoryStore } from '../../services/inventory-store.service';
import { Product } from '../../models/inventory.types';

interface OverviewComponentProps {
  onOpenStockAdjust: (product?: Product) => void;
  onOpenNewProduct: () => void;
  onOpenTransfer: () => void;
}

export default function OverviewComponent({
  onOpenStockAdjust,
  onOpenNewProduct,
  onOpenTransfer,
}: OverviewComponentProps) {
  const kpis = useSignalValue(inventoryStore.kpis);
  const lowStock = useSignalValue(inventoryStore.lowStockProducts);
  const recentMovements = useSignalValue(inventoryStore.recentMovements);
  const warehouseStats = useSignalValue(inventoryStore.warehouseStats);
  const products = useSignalValue(inventoryStore.products);

  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month'>('week');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Operations & Inventory Overview
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time reactive stock telemetry powered by Angular Signals &amp; LiteDatabase
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => inventoryStore.exportProductsCsv()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700 whitespace-nowrap cursor-pointer"
            title="Export inventory product list to CSV report"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            Export Inventory (CSV)
          </button>

          <button
            onClick={() => onOpenStockAdjust()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700 whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            Quick Stock Adjust
          </button>

          <button
            onClick={onOpenTransfer}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700 whitespace-nowrap cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
            Inter-Facility Transfer
          </button>

          <button
            onClick={onOpenNewProduct}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Register SKU
          </button>
        </div>
      </div>

      {/* KPI Cards Grid - Single Elevation, Crisp Tabular Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Valuation */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4.5 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Total Inventory Valuation</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
            {formatCurrency(kpis.totalValuation)}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-medium">Cost: {formatCurrency(kpis.totalCostValuation)}</span>
            <span aria-hidden="true">·</span>
            <span>Est. Margin: +{Math.round(((kpis.potentialProfit) / (kpis.totalValuation || 1)) * 100)}%</span>
          </div>
        </div>

        {/* Total Stocked Units */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4.5 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">On-Hand Physical Units</span>
            <Package className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
            {kpis.totalUnits.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span>Across {kpis.totalSkus} catalog items</span>
            <span aria-hidden="true">·</span>
            <span className="text-indigo-400">3 Regional Hubs</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4.5 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Low Stock Critical Threshold</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-400 mt-1">
            {kpis.lowStockCount + kpis.outOfStockCount}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="text-rose-400 font-medium">{kpis.outOfStockCount} Depleted</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-400">{kpis.lowStockCount} Below Minimum</span>
          </div>
        </div>

        {/* Inbound Supply Pipeline */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4.5 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Inbound Purchase Orders</span>
            <Truck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
            {kpis.activePurchaseOrders} Active
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="text-sky-400 font-medium font-mono tabular-nums">+{kpis.incomingUnits} units</span>
            <span aria-hidden="true">·</span>
            <span>En route to facilities</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Critical Stock Action Center & Warehouse Capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Priority Table - 2 columns */}
        <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/80 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Critical Inventory Replenishment Queue
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Reactive signals highlight items requiring immediate reorder or supplier allocation
              </p>
            </div>
            <button
              onClick={() => inventoryStore.activeRoute.set('products')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              View Full Catalog <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {lowStock.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400 border border-dashed border-slate-700 rounded-lg">
              All inventory levels are currently above reorder thresholds.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 font-medium">
                    <th className="pb-2.5 font-medium">SKU / Item Name</th>
                    <th className="pb-2.5 font-medium">Warehouse</th>
                    <th className="pb-2.5 font-medium text-right">On Hand</th>
                    <th className="pb-2.5 font-medium text-right">Min Level</th>
                    <th className="pb-2.5 font-medium text-right">Unit Cost</th>
                    <th className="pb-2.5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {lowStock.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-750 transition-colors">
                      <td className="py-3 pr-3">
                        <div className="font-medium text-slate-100">{prod.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {prod.sku} · {prod.category}
                        </div>
                      </td>
                      <td className="py-3 text-slate-300">
                        {prod.warehouseId === 'wh-north' && 'North Hub'}
                        {prod.warehouseId === 'wh-central' && 'Central Freight'}
                        {prod.warehouseId === 'wh-south' && 'Gulf Terminal'}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`font-mono font-bold tabular-nums ${
                            prod.quantity === 0 ? 'text-rose-400' : 'text-amber-400'
                          }`}
                        >
                          {prod.quantity} {prod.unit}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums text-slate-400">
                        {prod.minStockLevel}
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums text-slate-300">
                        ${prod.costPrice.toFixed(2)}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onOpenStockAdjust(prod)}
                          className="px-2.5 py-1 text-[11px] font-medium text-indigo-300 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 rounded transition-colors cursor-pointer"
                        >
                          Restock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Warehouse Capacity & Utilization Section */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <WarehouseIcon className="w-4 h-4 text-indigo-400" />
                Facility Utilization
              </h2>
              <button
                onClick={() => inventoryStore.activeRoute.set('warehouses')}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                Inspect <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Real-time spatial capacity monitoring across distribution centers
            </p>

            <div className="space-y-4">
              {warehouseStats.map((stat) => (
                <div key={stat.warehouse.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{stat.warehouse.name}</span>
                    <span className="font-mono tabular-nums text-slate-300">
                      {stat.totalUnits.toLocaleString()} / {stat.warehouse.capacityUnits.toLocaleString()} units
                    </span>
                  </div>
                  {/* High contrast custom progress bar */}
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700/50">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stat.fillPercentage > 85
                          ? 'bg-rose-500'
                          : stat.fillPercentage > 65
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, stat.fillPercentage))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{stat.warehouse.location} · {stat.productCount} SKUs</span>
                    <span className="font-mono tabular-nums font-medium text-slate-300">
                      {stat.fillPercentage}% allocated
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-700/60">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Overall Fleet Fill Rate:</span>
              <span className="font-bold text-slate-200 font-mono tabular-nums">
                {kpis.warehouseUtilizationRate}% of Total Capacity
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Stock Movement Ledger Feed */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Live Stock Ledger Stream
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Append-only audit trail dispatched upon every inventory signal state mutation
            </p>
          </div>
          <button
            onClick={() => inventoryStore.activeRoute.set('movements')}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
          >
            Complete Ledger <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 font-medium">
                <th className="pb-2.5 font-medium">Timestamp</th>
                <th className="pb-2.5 font-medium">Movement Type</th>
                <th className="pb-2.5 font-medium">SKU / Item</th>
                <th className="pb-2.5 font-medium">Reference</th>
                <th className="pb-2.5 font-medium text-right">Quantity Delta</th>
                <th className="pb-2.5 font-medium text-right">Balance</th>
                <th className="pb-2.5 font-medium">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {recentMovements.slice(0, 6).map((mov) => {
                const isPositive = mov.type === 'inbound';
                const isNegative = mov.type === 'outbound' || mov.type === 'scrap';

                return (
                  <tr key={mov.id} className="hover:bg-slate-750 transition-colors">
                    <td className="py-2.5 font-mono text-slate-400 tabular-nums">
                      {new Date(mov.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
                      {new Date(mov.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`font-mono text-[11px] uppercase tracking-wide font-medium ${
                          mov.type === 'inbound'
                            ? 'text-emerald-400'
                            : mov.type === 'outbound'
                            ? 'text-sky-400'
                            : mov.type === 'transfer'
                            ? 'text-purple-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {mov.type}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <div className="font-medium text-slate-200">{mov.productName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{mov.sku}</div>
                    </td>
                    <td className="py-2.5 font-mono text-slate-300">{mov.referenceNumber}</td>
                    <td className="py-2.5 text-right font-mono font-bold tabular-nums">
                      <span
                        className={
                          isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-300'
                        }
                      >
                        {isPositive ? `+${mov.quantity}` : isNegative ? `-${mov.quantity}` : `${mov.quantity}`}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-slate-400">
                      {mov.newStock}
                    </td>
                    <td className="py-2.5 text-slate-400">{mov.performedBy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
