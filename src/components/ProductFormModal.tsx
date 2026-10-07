import React, { useState } from 'react';
import { X, Package, Plus, Save } from 'lucide-react';
import { useSignalValue } from '../core/signals';
import { inventoryStore } from '../services/inventory-store.service';
import { Product } from '../models/inventory.types';

interface ProductFormModalProps {
  editProduct?: Product | null;
  onClose: () => void;
}

export default function ProductFormModal({ editProduct, onClose }: ProductFormModalProps) {
  const categories = useSignalValue(inventoryStore.categories);
  const warehouses = useSignalValue(inventoryStore.warehouses);
  const suppliers = useSignalValue(inventoryStore.suppliers);

  const [formData, setFormData] = useState({
    sku: editProduct?.sku || '',
    name: editProduct?.name || '',
    description: editProduct?.description || '',
    category: editProduct?.category || categories[0]?.name || 'Microcontrollers & ICs',
    warehouseId: editProduct?.warehouseId || warehouses[0]?.id || 'wh-north',
    binLocation: editProduct?.binLocation || 'Bay A · Rack 01 · Bin 01',
    quantity: editProduct?.quantity ?? 50,
    minStockLevel: editProduct?.minStockLevel ?? 20,
    maxStockLevel: editProduct?.maxStockLevel ?? 200,
    unitPrice: editProduct?.unitPrice ?? 45.0,
    costPrice: editProduct?.costPrice ?? 25.0,
    supplierId: editProduct?.supplierId || suppliers[0]?.id || '',
    barcode: editProduct?.barcode || `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
    unit: editProduct?.unit || 'units',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku.trim() || !formData.name.trim()) {
      alert('Please fill out SKU and Product Name.');
      return;
    }

    if (editProduct) {
      inventoryStore.updateProduct(editProduct.id, formData);
    } else {
      inventoryStore.createProduct(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white">
              {editProduct ? `Edit Specifications: ${editProduct.sku}` : 'Register New Inventory SKU'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* SKU and Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">SKU Code</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="e.g. SENS-TEMP-X1"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-300 mb-1 font-medium">Item Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. High-Precision Digital Thermal Sensor"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 mb-1 font-medium">Technical Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed specifications, pinout, or tolerances..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category & Facility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Assigned Warehouse</label>
              <select
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bin Location & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 mb-1 font-medium">Designated Bin / Rack Location</label>
              <input
                type="text"
                required
                value={formData.binLocation}
                onChange={(e) => setFormData({ ...formData, binLocation: e.target.value })}
                placeholder="Bay A · Rack 02 · Bin 14"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Unit Measurement</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="units, kg, boxes"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Initial Quantity</label>
              <input
                type="number"
                min={0}
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Safety Min Level</label>
              <input
                type="number"
                min={0}
                required
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Capacity Max Level</label>
              <input
                type="number"
                min={1}
                required
                value={formData.maxStockLevel}
                onChange={(e) => setFormData({ ...formData, maxStockLevel: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Pricing & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Selling Price ($)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                required
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Unit Cost ($)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                required
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Primary Supplier</label>
              <select
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Barcode Token */}
          <div>
            <label className="block text-slate-400 mb-1">Barcode / EAN-13 Number</label>
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Action Buttons */}
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
              {editProduct ? 'Save Changes' : 'Register SKU in LiteDatabase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
