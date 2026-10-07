import React, { useState } from 'react';
import { X, Truck, Plus, Trash2 } from 'lucide-react';
import { useSignalValue } from '../core/signals';
import { inventoryStore } from '../services/inventory-store.service';
import { PurchaseOrderItem } from '../models/inventory.types';

interface PurchaseOrderModalProps {
  onClose: () => void;
}

export default function PurchaseOrderModal({ onClose }: PurchaseOrderModalProps) {
  const suppliers = useSignalValue(inventoryStore.suppliers);
  const products = useSignalValue(inventoryStore.products);

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState<string>(
    new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState<string>('Standard logistics freight delivery.');
  const [lines, setLines] = useState<PurchaseOrderItem[]>([
    {
      productId: products[0]?.id || '',
      sku: products[0]?.sku || '',
      productName: products[0]?.name || '',
      quantity: 50,
      unitCost: products[0]?.costPrice || 25,
      receivedQuantity: 0,
    },
  ]);

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

  const handleAddLine = () => {
    const defaultProduct = products[0];
    if (!defaultProduct) return;
    setLines([
      ...lines,
      {
        productId: defaultProduct.id,
        sku: defaultProduct.sku,
        productName: defaultProduct.name,
        quantity: 25,
        unitCost: defaultProduct.costPrice,
        receivedQuantity: 0,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      productId: prod.id,
      sku: prod.sku,
      productName: prod.name,
      unitCost: prod.costPrice,
    };
    setLines(updated);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...lines];
    updated[index].quantity = Math.max(1, qty);
    setLines(updated);
  };

  const handleCostChange = (index: number, cost: number) => {
    const updated = [...lines];
    updated[index].unitCost = Math.max(0, cost);
    setLines(updated);
  };

  const totalAmount = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) return;

    try {
      inventoryStore.createPurchaseOrder({
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        expectedDeliveryDate: expectedDate,
        status: 'pending',
        items: lines,
        totalAmount,
        notes,
      });
      onClose();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to create PO');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Create Purchase Order Agreement</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Supplier and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Vendor / Supplier</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}) — {s.country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Target Delivery Date</label>
              <input
                type="date"
                required
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Line items table */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-slate-300 font-medium">Order Line Items</label>
              <button
                type="button"
                onClick={handleAddLine}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Item Line
              </button>
            </div>

            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800"
                >
                  <div className="flex-1 min-w-[200px]">
                    <select
                      value={line.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-medium focus:outline-none cursor-pointer"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      min={1}
                      required
                      value={line.quantity}
                      onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                      placeholder="Qty"
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono text-center focus:outline-none"
                    />
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      required
                      value={line.unitCost}
                      onChange={(e) => handleCostChange(idx, Number(e.target.value))}
                      placeholder="Cost $"
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono text-right focus:outline-none"
                    />
                  </div>

                  <div className="w-24 text-right font-mono font-bold text-slate-200 tabular-nums self-center">
                    ${(line.quantity * line.unitCost).toFixed(2)}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    disabled={lines.length === 1}
                    className="p-1.5 text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer self-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes and total summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-slate-400 mb-1">Logistics / Purchase Order Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-center items-end text-right">
              <span className="text-slate-400 text-xs">Total Purchase Commitment</span>
              <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-0.5">
                ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                {lines.reduce((sum, l) => sum + l.quantity, 0)} Total Units Procured
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-300 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
            >
              Issue Purchase Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
