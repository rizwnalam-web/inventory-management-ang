import React, { useState } from 'react';
import {
  Warehouse as WarehouseIcon,
  ArrowRightLeft,
  Thermometer,
  ShieldCheck,
  User,
  Mail,
  MapPin,
  Box,
  Layers,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useSignalValue } from '../../core/signals';
import { inventoryStore } from '../../services/inventory-store.service';
import { Warehouse, Product } from '../../models/inventory.types';

interface WarehouseManagerComponentProps {
  onOpenTransfer: (defaultFromWarehouseId?: string) => void;
  onOpenStockAdjust: (product: Product) => void;
}

export default function WarehouseManagerComponent({
  onOpenTransfer,
  onOpenStockAdjust,
}: WarehouseManagerComponentProps) {
  const warehouses = useSignalValue(inventoryStore.warehouses);
  const products = useSignalValue(inventoryStore.products);
  const stats = useSignalValue(inventoryStore.warehouseStats);

  const [activeTabWarehouseId, setActiveTabWarehouseId] = useState<string>(warehouses[0]?.id || 'wh-north');

  const selectedWarehouse = warehouses.find((w) => w.id === activeTabWarehouseId) || warehouses[0];
  const selectedStats = stats.find((s) => s.warehouse.id === selectedWarehouse?.id);
  const warehouseProducts = products.filter((p) => p.warehouseId === selectedWarehouse?.id);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Facility Logistics &amp; Bin Topology
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Spatial monitoring across regional logistics centers and cold-storage terminals
          </p>
        </div>

        <button
          onClick={() => onOpenTransfer(selectedWarehouse?.id)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          Transfer Stock Between Facilities
        </button>
      </div>

      {/* Facility Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(({ warehouse, totalUnits, totalValue, fillPercentage, productCount }) => {
          const isSelected = warehouse.id === activeTabWarehouseId;

          return (
            <div
              key={warehouse.id}
              onClick={() => setActiveTabWarehouseId(warehouse.id)}
              className={`p-5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                  : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <WarehouseIcon
                    className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`}
                  />
                  <span className="font-bold text-white text-sm">{warehouse.name}</span>
                </div>
                <span className="font-mono text-xs text-indigo-400 font-semibold">{warehouse.code}</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span>{warehouse.location}</span>
                {warehouse.temperatureControlled && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-sky-400 flex items-center gap-0.5">
                      <Thermometer className="w-3 h-3" /> Cold Chain
                    </span>
                  </>
                )}
              </div>

              {/* Progress bar */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Capacity Fill</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-200">
                    {fillPercentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      fillPercentage > 85 ? 'bg-rose-500' : fillPercentage > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, fillPercentage))}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/50 text-xs">
                <div>
                  <div className="text-[11px] text-slate-400">Inventory Units</div>
                  <div className="font-mono font-bold text-white mt-0.5 tabular-nums">
                    {totalUnits.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Inventory Value</div>
                  <div className="font-mono font-bold text-slate-200 mt-0.5 tabular-nums">
                    ${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Warehouse Detailed Inspector */}
      {selectedWarehouse && (
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-6">
          {/* Facility Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{selectedWarehouse.name}</h2>
                <span className="text-xs font-mono bg-slate-900 px-2 py-0.5 rounded text-indigo-400 border border-slate-700">
                  {selectedWarehouse.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {selectedWarehouse.location} · Maximum Storage Allowance: {selectedWarehouse.capacityUnits.toLocaleString()} standard pallets
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Station Manager: <strong className="text-white">{selectedWarehouse.managerName}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-slate-400">{selectedWarehouse.contactEmail}</span>
              </div>
            </div>
          </div>

          {/* Items Currently Stocked in this Warehouse */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Box className="w-4 h-4 text-indigo-400" />
                Allocated Catalog Items ({warehouseProducts.length} SKUs)
              </h3>
              <span className="text-xs text-slate-400">
                Sum Units: <strong className="font-mono text-white tabular-nums">{warehouseProducts.reduce((sum, p) => sum + p.quantity, 0).toLocaleString()}</strong>
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-700/60 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-700 text-slate-400 font-medium">
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">Designated Storage Bin</th>
                    <th className="py-2.5 px-3 text-right">Physical Units</th>
                    <th className="py-2.5 px-3 text-right">Valuation</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {warehouseProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No products currently assigned to this facility.
                      </td>
                    </tr>
                  ) : (
                    warehouseProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-750 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-indigo-400 whitespace-nowrap">
                          {p.sku}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-200">
                          {p.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">
                          {p.binLocation}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-white">
                          {p.quantity.toLocaleString()} {p.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                          ${(p.quantity * p.unitPrice).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`font-medium text-[11px] ${
                              p.status === 'in_stock'
                                ? 'text-emerald-400'
                                : p.status === 'low_stock'
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {p.status === 'in_stock' ? 'Nominal' : p.status === 'low_stock' ? 'Low Stock' : 'Depleted'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onOpenStockAdjust(p)}
                            className="px-2 py-1 text-[11px] font-medium text-indigo-300 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/50 rounded transition-colors cursor-pointer"
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
