import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Edit2,
  Trash2,
  RefreshCw,
  QrCode,
  Package,
  ArrowRightLeft,
  SlidersHorizontal,
  ChevronDown,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { useSignalValue } from '../../core/signals';
import { inventoryStore } from '../../services/inventory-store.service';
import { Product } from '../../models/inventory.types';

interface ProductsComponentProps {
  onOpenStockAdjust: (product: Product) => void;
  onOpenEditProduct: (product: Product) => void;
  onOpenNewProduct: () => void;
  onOpenTransferWithProduct: (product: Product) => void;
}

export default function ProductsComponent({
  onOpenStockAdjust,
  onOpenEditProduct,
  onOpenNewProduct,
  onOpenTransferWithProduct,
}: ProductsComponentProps) {
  const filteredProducts = useSignalValue(inventoryStore.filteredProducts);
  const allProducts = useSignalValue(inventoryStore.products);
  const categories = useSignalValue(inventoryStore.categories);
  const warehouses = useSignalValue(inventoryStore.warehouses);
  const filters = useSignalValue(inventoryStore.filters);

  const [selectedBarcodeModal, setSelectedBarcodeModal] = useState<Product | null>(null);

  const isFiltered =
    filters.search.trim() !== '' ||
    filters.category !== 'all' ||
    filters.stockStatus !== 'all' ||
    filters.warehouseId !== 'all';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    inventoryStore.filters.update((f) => ({ ...f, search: e.target.value }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    inventoryStore.filters.update((f) => ({ ...f, category: e.target.value }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    inventoryStore.filters.update((f) => ({ ...f, stockStatus: e.target.value }));
  };

  const handleWarehouseFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    inventoryStore.filters.update((f) => ({ ...f, warehouseId: e.target.value }));
  };

  const handleSort = (field: 'name' | 'quantity' | 'unitPrice' | 'valuation' | 'updatedAt') => {
    inventoryStore.filters.update((f) => {
      const nextDir = f.sortBy === field && f.sortDirection === 'asc' ? 'desc' : 'asc';
      return { ...f, sortBy: field, sortDirection: nextDir };
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from the active inventory catalog?`)) {
      inventoryStore.deleteProduct(id);
    }
  };

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Catalog &amp; Stock Ledger
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Active SKUs, unit costs, bin coordinates, and safety stock thresholds
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* CSV Export Action Button Group */}
          <div className="inline-flex items-center">
            <button
              onClick={() => inventoryStore.exportProductsCsv(filteredProducts)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700 cursor-pointer whitespace-nowrap"
              title={`Download CSV report with ${filteredProducts.length} items`}
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export CSV {isFiltered ? `(${filteredProducts.length})` : `(${allProducts.length})`}</span>
            </button>

            {isFiltered && (
              <button
                onClick={() => inventoryStore.exportProductsCsv(allProducts)}
                className="ml-1.5 px-2.5 py-2 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 cursor-pointer whitespace-nowrap transition-colors"
                title="Export all inventory items regardless of filters"
              >
                All ({allProducts.length})
              </button>
            )}
          </div>

          <button
            onClick={onOpenNewProduct}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New SKU
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search by SKU, product name, bin, or barcode..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category */}
          <select
            value={filters.category}
            onChange={handleCategoryChange}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={filters.stockStatus}
            onChange={handleStatusChange}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock (Nominal)</option>
            <option value="low_stock">Low Stock (Alert)</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          {/* Warehouse */}
          <select
            value={filters.warehouseId}
            onChange={handleWarehouseFilterChange}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Facilities</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {(filters.search || filters.category !== 'all' || filters.stockStatus !== 'all' || filters.warehouseId !== 'all') && (
            <button
              onClick={() =>
                inventoryStore.filters.set({
                  search: '',
                  category: 'all',
                  stockStatus: 'all',
                  warehouseId: 'all',
                  sortBy: 'name',
                  sortDirection: 'asc',
                })
              }
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-700/80 text-slate-400 font-medium">
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Item Specifications &amp; SKU</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-3">Location &amp; Bin</th>
                <th
                  onClick={() => handleSort('quantity')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Stock Level</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('unitPrice')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Unit Price / Cost</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('valuation')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Total Valuation</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    No catalog items match current search query or filter parameters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const warehouse = warehouses.find((w) => w.id === p.warehouseId);
                  const valuation = p.quantity * p.unitPrice;

                  return (
                    <tr key={p.id} className="hover:bg-slate-750 transition-colors">
                      {/* Name, SKU & Category */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100">{p.name}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                          <span className="text-indigo-400 font-medium">{p.sku}</span>
                          <span aria-hidden="true">·</span>
                          <span>{p.category}</span>
                          <span aria-hidden="true">·</span>
                          <button
                            onClick={() => setSelectedBarcodeModal(p)}
                            className="text-slate-500 hover:text-slate-300 flex items-center gap-0.5 transition-colors cursor-pointer"
                            title="View barcode"
                          >
                            <QrCode className="w-3 h-3" />
                            <span>{p.barcode}</span>
                          </button>
                        </div>
                      </td>

                      {/* Location & Bin */}
                      <td className="py-3 px-3 text-slate-300">
                        <div className="font-medium text-slate-200">{warehouse?.name || 'Unassigned'}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{p.binLocation}</div>
                      </td>

                      {/* Stock Level */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <div
                          className={`font-bold text-sm ${
                            p.quantity === 0
                              ? 'text-rose-400'
                              : p.quantity <= p.minStockLevel
                              ? 'text-amber-400'
                              : 'text-slate-100'
                          }`}
                        >
                          {p.quantity.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">{p.unit}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Safety Min: {p.minStockLevel} · Max: {p.maxStockLevel}
                        </div>
                      </td>

                      {/* Unit Price / Cost */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <div className="font-semibold text-slate-200">${p.unitPrice.toFixed(2)}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Cost: ${p.costPrice.toFixed(2)}</div>
                      </td>

                      {/* Total Valuation */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <div className="font-bold text-slate-200">
                          ${valuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
                          Margin: +${((p.unitPrice - p.costPrice) * p.quantity).toLocaleString('en-US', {
                            maximumFractionDigits: 0,
                          })}
                        </div>
                      </td>

                      {/* Status - Clean unboxed text with color token according to zero-pill rule */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.status === 'in_stock'
                                ? 'bg-emerald-400'
                                : p.status === 'low_stock'
                                ? 'bg-amber-400'
                                : 'bg-rose-400'
                            }`}
                          />
                          <span
                            className={`font-medium ${
                              p.status === 'in_stock'
                                ? 'text-emerald-400'
                                : p.status === 'low_stock'
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {p.status === 'in_stock'
                              ? 'In Stock'
                              : p.status === 'low_stock'
                              ? 'Low Threshold'
                              : 'Depleted'}
                          </span>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenStockAdjust(p)}
                            title="Adjust Stock Count"
                            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors border border-slate-700 cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenTransferWithProduct(p)}
                            title="Transfer Warehouse"
                            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors border border-slate-700 cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenEditProduct(p)}
                            title="Edit Specifications"
                            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors border border-slate-700 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            title="Delete SKU"
                            className="p-1.5 text-rose-400 hover:text-rose-300 bg-slate-800 hover:bg-rose-950/40 rounded transition-colors border border-slate-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer with stats */}
        <div className="bg-slate-900/80 px-4 py-2.5 border-t border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span>
              Showing <span className="font-mono tabular-nums text-slate-200 font-medium">{filteredProducts.length}</span> of{' '}
              <span className="font-mono tabular-nums text-slate-400">{allProducts.length}</span> SKUs
            </span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => inventoryStore.exportProductsCsv(filteredProducts)}
              className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Download CSV report for current table view"
            >
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
            </button>
          </div>
          <div className="flex items-center gap-4 font-mono tabular-nums">
            <span>
              Sum Units: {filteredProducts.reduce((sum, p) => sum + p.quantity, 0).toLocaleString()}
            </span>
            <span>
              Sum Valuation: $
              {filteredProducts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0).toLocaleString('en-US', {
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Barcode Viewer Modal */}
      {selectedBarcodeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-sm w-full text-center space-y-4">
            <h3 className="text-base font-bold text-white">SKU Barcode &amp; EAN Token</h3>
            <p className="text-xs text-slate-400">{selectedBarcodeModal.name}</p>

            <div className="bg-white p-6 rounded-lg text-slate-900 inline-block font-mono tracking-widest text-center">
              {/* Simulated visual barcode stripes */}
              <div className="flex items-center justify-center h-16 gap-1 mb-2">
                {[...Array(24)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-black h-full"
                    style={{ width: `${(i % 3) + 1.5}px` }}
                  />
                ))}
              </div>
              <div className="text-xs font-bold font-mono">{selectedBarcodeModal.barcode}</div>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              SKU: {selectedBarcodeModal.sku} · Bin: {selectedBarcodeModal.binLocation}
            </div>

            <button
              onClick={() => setSelectedBarcodeModal(null)}
              className="w-full py-2 text-xs font-medium text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
