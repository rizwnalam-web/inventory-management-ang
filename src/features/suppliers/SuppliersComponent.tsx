import React, { useState } from 'react';
import {
  Truck,
  Star,
  Mail,
  Phone,
  Globe,
  Plus,
  Clock,
  Package,
  Search,
} from 'lucide-react';
import { useSignalValue } from '../../core/signals';
import { inventoryStore } from '../../services/inventory-store.service';
import { liteDb } from '../../services/litedatabase';
import { Supplier } from '../../models/inventory.types';

export default function SuppliersComponent() {
  const suppliers = useSignalValue(inventoryStore.suppliers);
  const products = useSignalValue(inventoryStore.products);

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    country: '',
    leadTimeDays: 7,
    rating: 4.8,
  });

  const filteredSuppliers = suppliers.filter((sup) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      sup.name.toLowerCase().includes(q) ||
      sup.code.toLowerCase().includes(q) ||
      sup.country.toLowerCase().includes(q)
    );
  });

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name.trim() || !newSupplier.code.trim()) return;

    const id = `sup-${Date.now()}`;
    const entry: Supplier = {
      ...newSupplier,
      id,
      activeProductsCount: 0,
    };

    liteDb.collection('suppliers').insert(entry);
    liteDb.logAudit('CREATE', 'Supplier', id, `Registered new vendor ${entry.name} (${entry.code}).`);
    inventoryStore.showToast(`Supplier ${entry.name} registered.`, 'success');
    setShowAddModal(false);
    setNewSupplier({
      name: '',
      code: '',
      email: '',
      phone: '',
      country: '',
      leadTimeDays: 7,
      rating: 4.8,
    });
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Supplier &amp; Vendor Directory
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Verified hardware manufacturers, SLA lead times, and reliability scoring
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          Register Supplier
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers by name, vendor code, or country..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSuppliers.map((supplier) => {
          const linkedProducts = products.filter((p) => p.supplierId === supplier.id);

          return (
            <div
              key={supplier.id}
              className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-4 hover:border-slate-600 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{supplier.name}</h3>
                    <span className="text-xs font-mono bg-slate-900 px-2 py-0.5 rounded text-indigo-400 border border-slate-700">
                      {supplier.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span>{supplier.country}</span>
                    <span aria-hidden="true">·</span>
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Avg Lead Time: <strong className="text-slate-300 font-mono">{supplier.leadTimeDays} days</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs bg-amber-950/40 text-amber-300 border border-amber-800/50 px-2.5 py-1 rounded-md font-mono font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{supplier.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-mono truncate">{supplier.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-mono">{supplier.phone}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Catalog Supply Contracts: <strong className="text-white font-mono">{linkedProducts.length} Active SKUs</strong></span>
                </span>
                <span className="text-[11px] text-emerald-400 font-medium">Verified Partner</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">Register Vendor / Manufacturer</h3>
            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Company / Entity Name</label>
                <input
                  type="text"
                  required
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  placeholder="e.g. Apex Sensor Works Inc"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Vendor Code</label>
                  <input
                    type="text"
                    required
                    value={newSupplier.code}
                    onChange={(e) => setNewSupplier({ ...newSupplier, code: e.target.value.toUpperCase() })}
                    placeholder="SUP-105"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={newSupplier.country}
                    onChange={(e) => setNewSupplier({ ...newSupplier, country: e.target.value })}
                    placeholder="e.g. Taiwan"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    placeholder="orders@vendor.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    placeholder="+1 800 555 0199"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={newSupplier.leadTimeDays}
                    onChange={(e) => setNewSupplier({ ...newSupplier, leadTimeDays: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Quality Rating (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={1}
                    max={5}
                    value={newSupplier.rating}
                    onChange={(e) => setNewSupplier({ ...newSupplier, rating: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-300 hover:text-white bg-slate-700 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-white bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-lg cursor-pointer"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
