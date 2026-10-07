import React, { useState } from 'react';
import {
  Truck,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { useSignalValue } from '../../core/signals';
import { inventoryStore } from '../../services/inventory-store.service';
import { PurchaseOrder } from '../../models/inventory.types';

interface PurchaseOrdersComponentProps {
  onOpenCreatePO: () => void;
}

export default function PurchaseOrdersComponent({ onOpenCreatePO }: PurchaseOrdersComponentProps) {
  const purchaseOrders = useSignalValue(inventoryStore.purchaseOrders);
  const suppliers = useSignalValue(inventoryStore.suppliers);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedPoId, setExpandedPoId] = useState<string | null>(null);

  const filteredPOs = purchaseOrders.filter((po) => {
    if (statusFilter !== 'all' && po.status !== statusFilter) return false;
    return true;
  });

  const handleReceiveShipment = (poId: string, poNumber: string) => {
    if (
      window.confirm(
        `Confirm delivery reception for ${poNumber}? This will automatically add items into active warehouse stock and append an inbound audit record.`
      )
    ) {
      inventoryStore.receivePurchaseOrder(poId);
    }
  };

  const totalCommittedSpend = purchaseOrders
    .filter((po) => po.status === 'pending' || po.status === 'approved')
    .reduce((sum, po) => sum + po.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Procurement &amp; Purchase Orders
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Vendor supply agreements, shipment receiving dock, and safety stock reorders
          </p>
        </div>

        <button
          onClick={onOpenCreatePO}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Purchase Order
        </button>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Committed Pipeline Value</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
            ${totalCommittedSpend.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Approved &amp; transit orders</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Active Transit Orders</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-indigo-400 mt-1">
            {purchaseOrders.filter((po) => po.status === 'approved' || po.status === 'pending').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting dock check-in</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Completed Receipts</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
            {purchaseOrders.filter((po) => po.status === 'received').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Fully received &amp; inventoried</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit text-xs">
        {['all', 'pending', 'approved', 'received'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 font-medium rounded-md capitalize transition-colors cursor-pointer ${
              statusFilter === st
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {st === 'all' ? 'All Orders' : st}
          </button>
        ))}
      </div>

      {/* Purchase Orders List */}
      <div className="space-y-3">
        {filteredPOs.length === 0 ? (
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl py-12 text-center text-slate-400 text-sm">
            No purchase orders currently in this status.
          </div>
        ) : (
          filteredPOs.map((po) => {
            const isExpanded = expandedPoId === po.id;
            const canReceive = po.status === 'approved' || po.status === 'pending';

            return (
              <div
                key={po.id}
                className="bg-slate-800/60 border border-slate-700/80 rounded-xl overflow-hidden transition-all"
              >
                {/* Header Row */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start md:items-center gap-3">
                    <button
                      onClick={() => setExpandedPoId(isExpanded ? null : po.id)}
                      className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">{po.poNumber}</span>
                        <span
                          className={`text-[11px] font-mono uppercase tracking-wide font-medium ${
                            po.status === 'received'
                              ? 'text-emerald-400'
                              : po.status === 'approved'
                              ? 'text-sky-400'
                              : po.status === 'pending'
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {po.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Supplier: <strong className="text-slate-200">{po.supplierName}</strong> · Ordered{' '}
                        {new Date(po.orderDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Total Purchase Value</div>
                      <div className="font-mono font-bold text-white tabular-nums">
                        ${po.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    {canReceive && (
                      <button
                        onClick={() => handleReceiveShipment(po.id, po.poNumber)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 rounded-lg transition-colors cursor-pointer"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        Receive into Stock
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Item Details */}
                {isExpanded && (
                  <div className="bg-slate-900/70 border-t border-slate-700/80 p-4 space-y-3">
                    <div className="text-xs font-semibold text-slate-300">Procured Line Items ({po.items.length})</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-700 text-slate-400">
                            <th className="pb-2 font-medium">SKU</th>
                            <th className="pb-2 font-medium">Item Name</th>
                            <th className="pb-2 font-medium text-right">Ordered Qty</th>
                            <th className="pb-2 font-medium text-right">Received Qty</th>
                            <th className="pb-2 font-medium text-right">Unit Cost</th>
                            <th className="pb-2 font-medium text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {po.items.map((line, idx) => (
                            <tr key={idx}>
                              <td className="py-2 font-mono text-indigo-400">{line.sku}</td>
                              <td className="py-2 text-slate-200">{line.productName}</td>
                              <td className="py-2 text-right font-mono tabular-nums text-white">
                                {line.quantity}
                              </td>
                              <td className="py-2 text-right font-mono tabular-nums text-emerald-400">
                                {line.receivedQuantity}
                              </td>
                              <td className="py-2 text-right font-mono tabular-nums text-slate-300">
                                ${line.unitCost.toFixed(2)}
                              </td>
                              <td className="py-2 text-right font-mono tabular-nums text-slate-100 font-semibold">
                                ${(line.quantity * line.unitCost).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {po.notes && (
                      <div className="text-[11px] text-slate-400 bg-slate-800/80 p-2.5 rounded border border-slate-700/50">
                        <strong>Shipping Instructions / Notes:</strong> {po.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
