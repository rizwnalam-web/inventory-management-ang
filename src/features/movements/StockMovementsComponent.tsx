import React, { useState } from 'react';
import {
  History,
  Download,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  AlertOctagon,
  SlidersHorizontal,
} from 'lucide-react';
import { useSignalValue } from '../../core/signals';
import { inventoryStore } from '../../services/inventory-store.service';
import { MovementType, StockMovement } from '../../models/inventory.types';

export default function StockMovementsComponent() {
  const movements = useSignalValue(inventoryStore.stockMovements);
  const warehouses = useSignalValue(inventoryStore.warehouses);

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredMovements = movements.filter((mov) => {
    if (typeFilter !== 'all' && mov.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const inSku = mov.sku.toLowerCase().includes(q);
      const inName = mov.productName.toLowerCase().includes(q);
      const inRef = mov.referenceNumber.toLowerCase().includes(q);
      const inReason = mov.reason.toLowerCase().includes(q);
      if (!inSku && !inName && !inRef && !inReason) return false;
    }
    return true;
  });

  const getWarehouseName = (id?: string) => {
    if (!id) return '-';
    return warehouses.find((w) => w.id === id)?.name || id;
  };

  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Timestamp',
      'Type',
      'SKU',
      'Product Name',
      'Reference',
      'Quantity Delta',
      'Previous Stock',
      'New Stock',
      'From Warehouse',
      'To Warehouse',
      'Reason',
      'Performed By',
    ];

    const rows = filteredMovements.map((m) => [
      m.id,
      m.timestamp,
      m.type,
      `"${m.sku}"`,
      `"${m.productName}"`,
      `"${m.referenceNumber}"`,
      m.quantity,
      m.previousStock,
      m.newStock,
      `"${getWarehouseName(m.fromWarehouseId)}"`,
      `"${getWarehouseName(m.toWarehouseId)}"`,
      `"${m.reason.replace(/"/g, '""')}"`,
      `"${m.performedBy}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-movements-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    inventoryStore.showToast('Stock movements ledger exported to CSV.', 'success');
  };

  // Calculate net flow
  const inboundCount = filteredMovements
    .filter((m) => m.type === 'inbound')
    .reduce((sum, m) => sum + m.quantity, 0);

  const outboundCount = filteredMovements
    .filter((m) => m.type === 'outbound' || m.type === 'scrap')
    .reduce((sum, m) => sum + m.quantity, 0);

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Stock Movements &amp; Audit Ledger
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Immutable transaction record tracking every physical inventory quantity shift
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700 cursor-pointer whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          Export Ledger (CSV)
        </button>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Recorded Ledger Entries</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
            {filteredMovements.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total transactions evaluated</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Inbound Additions</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
            +{inboundCount.toLocaleString()} units
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Replenishments &amp; PO receipts</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Outbound Dispatches &amp; Scraps</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-400 mt-1">
            -{outboundCount.toLocaleString()} units
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Sales fulfillments &amp; write-offs</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reference, SKU, item name, or reason..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Movement Types</option>
            <option value="inbound">Inbound (+)</option>
            <option value="outbound">Outbound (-)</option>
            <option value="transfer">Transfer (&harr;)</option>
            <option value="adjustment">Count Adjustment (&sim;)</option>
            <option value="scrap">Quarantine / Scrap (!)</option>
          </select>

          {(typeFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setTypeFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-700/80 text-slate-400 font-medium">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Item / SKU</th>
                <th className="py-3 px-3">Reference</th>
                <th className="py-3 px-3 text-right">Delta</th>
                <th className="py-3 px-3 text-right">Balance</th>
                <th className="py-3 px-3">Facilities Involved</th>
                <th className="py-3 px-4">Reason &amp; Log</th>
                <th className="py-3 px-3">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-sm">
                    No stock movements found matching filter conditions.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isPositive = m.type === 'inbound';
                  const isNegative = m.type === 'outbound' || m.type === 'scrap';

                  return (
                    <tr key={m.id} className="hover:bg-slate-750 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 tabular-nums whitespace-nowrap">
                        {new Date(m.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`font-mono text-[11px] uppercase tracking-wide font-medium ${
                            m.type === 'inbound'
                              ? 'text-emerald-400'
                              : m.type === 'outbound'
                              ? 'text-sky-400'
                              : m.type === 'transfer'
                              ? 'text-purple-400'
                              : m.type === 'scrap'
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-200">{m.productName}</div>
                        <div className="text-[11px] text-indigo-400 font-mono mt-0.5">{m.sku}</div>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                        {m.referenceNumber}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                        <span
                          className={
                            isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-300'
                          }
                        >
                          {isPositive ? `+${m.quantity}` : isNegative ? `-${m.quantity}` : `${m.quantity}`}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-400 whitespace-nowrap">
                        {m.previousStock} &rarr;{' '}
                        <span className="text-slate-200 font-semibold">{m.newStock}</span>
                      </td>

                      <td className="py-3 px-3 text-slate-300 text-[11px]">
                        {m.type === 'transfer' ? (
                          <span>
                            {getWarehouseName(m.fromWarehouseId)} &rarr; {getWarehouseName(m.toWarehouseId)}
                          </span>
                        ) : (
                          <span>{getWarehouseName(m.toWarehouseId || m.fromWarehouseId)}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={m.reason}>
                        {m.reason}
                      </td>

                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{m.performedBy}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
