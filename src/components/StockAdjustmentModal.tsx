import React, { useState } from 'react';
import { X, RefreshCw, Plus, Minus, AlertCircle } from 'lucide-react';
import { useSignalValue } from '../core/signals';
import { inventoryStore } from '../services/inventory-store.service';
import { Product, MovementType } from '../models/inventory.types';

interface StockAdjustmentModalProps {
  initialProduct?: Product | null;
  onClose: () => void;
}

export default function StockAdjustmentModal({ initialProduct, onClose }: StockAdjustmentModalProps) {
  const products = useSignalValue(inventoryStore.products);

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct?.id || products[0]?.id || ''
  );
  const [adjustmentType, setAdjustmentType] = useState<MovementType>('inbound');
  const [quantityDelta, setQuantityDelta] = useState<number>(10);
  const [reason, setReason] = useState<string>('Stock intake from supplier dock');
  const [customReference, setCustomReference] = useState<string>('');

  const currentProduct = products.find((p) => p.id === selectedProductId) || initialProduct;

  const currentStock = currentProduct ? currentProduct.quantity : 0;
  const isDeduction = adjustmentType === 'outbound' || adjustmentType === 'scrap';
  const effectiveDelta = isDeduction ? -Math.abs(quantityDelta) : Math.abs(quantityDelta);
  const projectedStock = Math.max(0, currentStock + effectiveDelta);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;
    if (quantityDelta <= 0) {
      alert('Adjustment quantity must be greater than zero.');
      return;
    }

    try {
      inventoryStore.adjustStock(
        currentProduct.id,
        effectiveDelta,
        adjustmentType,
        reason || 'Manual inventory adjustment',
        customReference || undefined
      );
      onClose();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to adjust stock');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-850 border border-slate-700 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl bg-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Stock Adjustment &amp; Count Reconciliation</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Select Product */}
          <div>
            <label className="block text-slate-300 mb-1 font-medium">Catalog Item</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Current: {p.quantity} {p.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Adjustment Type */}
          <div>
            <label className="block text-slate-300 mb-1 font-medium">Adjustment Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAdjustmentType('inbound');
                  setReason('Dock intake / Restock');
                }}
                className={`py-2 px-2 text-center rounded-lg border font-medium cursor-pointer transition-colors ${
                  adjustmentType === 'inbound'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                + Inbound (Add)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustmentType('outbound');
                  setReason('Production line dispatch');
                }}
                className={`py-2 px-2 text-center rounded-lg border font-medium cursor-pointer transition-colors ${
                  adjustmentType === 'outbound'
                    ? 'bg-sky-950/60 border-sky-500 text-sky-300'
                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                - Outbound (Issue)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustmentType('scrap');
                  setReason('Defect / Quarantine write-off');
                }}
                className={`py-2 px-2 text-center rounded-lg border font-medium cursor-pointer transition-colors ${
                  adjustmentType === 'scrap'
                    ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                ! Scrap / Damaged
              </button>
            </div>
          </div>

          {/* Quantity Input with live Calculation Preview */}
          <div>
            <label className="block text-slate-300 mb-1 font-medium">Quantity to Adjust</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantityDelta(Math.max(1, quantityDelta - 5))}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min={1}
                required
                value={quantityDelta}
                onChange={(e) => setQuantityDelta(Math.max(1, Number(e.target.value)))}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-center text-sm font-bold focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setQuantityDelta(quantityDelta + 5)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Calculated Stock Balance Card */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 font-mono text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Current Stock on Hand:</span>
              <span className="tabular-nums font-semibold text-slate-200">
                {currentStock} {currentProduct?.unit}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Adjustment Shift:</span>
              <span
                className={`tabular-nums font-semibold ${
                  isDeduction ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {effectiveDelta > 0 ? `+${effectiveDelta}` : effectiveDelta} {currentProduct?.unit}
              </span>
            </div>
            <div className="pt-1 border-t border-slate-850 flex justify-between font-bold text-white">
              <span>Projected New Balance:</span>
              <span className="tabular-nums text-sm text-indigo-400">
                {projectedStock} {currentProduct?.unit}
              </span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-slate-300 mb-1 font-medium">Audit Reason / Justification</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Received shipment dock check-in"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Optional Reference */}
          <div>
            <label className="block text-slate-400 mb-1">Reference Number (Optional)</label>
            <input
              type="text"
              value={customReference}
              onChange={(e) => setCustomReference(e.target.value)}
              placeholder="PO-2026-..., RMA-..., or SO-..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Actions */}
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
              Confirm &amp; Log Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
