import React, { useState } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import { useSignalValue } from '../core/signals';
import { inventoryStore } from '../services/inventory-store.service';
import { Product } from '../models/inventory.types';

interface StockTransferModalProps {
  initialProduct?: Product | null;
  defaultFromWarehouseId?: string;
  onClose: () => void;
}

export default function StockTransferModal({
  initialProduct,
  defaultFromWarehouseId,
  onClose,
}: StockTransferModalProps) {
  const products = useSignalValue(inventoryStore.products);
  const warehouses = useSignalValue(inventoryStore.warehouses);

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct?.id || products[0]?.id || ''
  );

  const currentProduct = products.find((p) => p.id === selectedProductId) || initialProduct;

  const [fromWarehouseId, setFromWarehouseId] = useState<string>(
    currentProduct?.warehouseId || defaultFromWarehouseId || warehouses[0]?.id || ''
  );
  const [toWarehouseId, setToWarehouseId] = useState<string>(
    warehouses.find((w) => w.id !== fromWarehouseId)?.id || warehouses[1]?.id || ''
  );
  const [transferQuantity, setTransferQuantity] = useState<number>(
    Math.min(currentProduct?.quantity || 10, 10)
  );
  const [notes, setNotes] = useState<string>('Regional inventory rebalancing');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;
    if (fromWarehouseId === toWarehouseId) {
      alert('Source and destination facilities cannot be identical.');
      return;
    }
    if (transferQuantity <= 0) {
      alert('Transfer quantity must be greater than zero.');
      return;
    }
    if (transferQuantity > currentProduct.quantity) {
      alert(`Cannot transfer more than on-hand stock (${currentProduct.quantity}).`);
      return;
    }

    try {
      inventoryStore.transferStock(
        currentProduct.id,
        transferQuantity,
        fromWarehouseId,
        toWarehouseId,
        notes
      );
      onClose();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to transfer stock');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Inter-Facility Stock Transfer</h2>
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
            <label className="block text-slate-300 mb-1 font-medium">Select Item to Relocate</label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const p = products.find((prod) => prod.id === e.target.value);
                if (p) {
                  setFromWarehouseId(p.warehouseId);
                  setTransferQuantity(Math.min(p.quantity, 10));
                }
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Available: {p.quantity} {p.unit}
                </option>
              ))}
            </select>
          </div>

          {/* From -> To Facility */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Origin Facility</label>
              <select
                value={fromWarehouseId}
                onChange={(e) => setFromWarehouseId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Destination Facility</label>
              <select
                value={toWarehouseId}
                onChange={(e) => setToWarehouseId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {warehouses
                  .filter((w) => w.id !== fromWarehouseId)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Transfer Quantity */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-300 font-medium">Transfer Units</label>
              <span className="text-slate-400 font-mono">
                Max Available: {currentProduct?.quantity || 0} {currentProduct?.unit}
              </span>
            </div>
            <input
              type="number"
              min={1}
              max={currentProduct?.quantity || 1}
              required
              value={transferQuantity}
              onChange={(e) => setTransferQuantity(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-center font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Transfer Notes */}
          <div>
            <label className="block text-slate-300 mb-1 font-medium">Transfer Manifest Note</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Expedited freight dispatch for assembly station"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
            />
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
              className="px-4 py-1.5 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
            >
              Dispatch Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
