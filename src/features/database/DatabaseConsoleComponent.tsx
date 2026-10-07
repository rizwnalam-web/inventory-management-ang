import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  Layers,
  FileJson,
  HardDrive,
  Activity,
  Search,
} from 'lucide-react';
import { useSignalValue } from '../../core/signals';
import { inventoryStore } from '../../services/inventory-store.service';
import { liteDb, DatabaseSchema } from '../../services/litedatabase';

export default function DatabaseConsoleComponent() {
  const auditLogs = useSignalValue(inventoryStore.auditLogs);
  const metrics = liteDb.getDatabaseMetrics();

  const [activeCollection, setActiveCollection] = useState<keyof DatabaseSchema>('products');
  const [importText, setImportText] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');

  const tableData = liteDb.getTableData(activeCollection) || [];

  const collectionsList: { key: keyof DatabaseSchema; label: string; count: number }[] = [
    { key: 'products', label: 'Products (SKUs)', count: metrics?.productsCount ?? 0 },
    { key: 'warehouses', label: 'Facilities & Hubs', count: metrics?.warehousesCount ?? 0 },
    { key: 'stock_movements', label: 'Stock Movements Ledger', count: metrics?.movementsCount ?? 0 },
    { key: 'purchase_orders', label: 'Purchase Orders', count: metrics?.ordersCount ?? 0 },
    { key: 'suppliers', label: 'Suppliers Directory', count: metrics?.suppliersCount ?? 0 },
    { key: 'categories', label: 'Categories Taxonomy', count: 6 },
    { key: 'audit_logs', label: 'Immutable Audit Trail', count: metrics?.auditLogsCount ?? 0 },
  ];

  const handleExport = () => {
    inventoryStore.exportBackupJson();
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;
    const ok = inventoryStore.importBackupJson(importText);
    if (ok) {
      setShowImportDialog(false);
      setImportText('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Warning: This will reset LiteDatabase to its initial seed state with default test catalog and facilities. Continue?'
      )
    ) {
      inventoryStore.resetDatabaseDefaults();
    }
  };

  const filteredLogs = (auditLogs || []).filter((log) => {
    if (!log) return false;
    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    const details = (log.details || '').toLowerCase();
    const action = (log.action || '').toLowerCase();
    const performedBy = (log.performedBy || '').toLowerCase();
    return details.includes(q) || action.includes(q) || performedBy.includes(q);
  });

  const formatLogDate = (timestamp?: string) => {
    if (!timestamp) return '-';
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return timestamp;
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            LiteDatabase Engine Console &amp; Storage
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Embedded client-side document store with indexed collections and live signal changefeed
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            Export Backup (JSON)
          </button>

          <button
            onClick={() => setShowImportDialog(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700 cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            Restore Backup
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Factory Reset Seed
          </button>
        </div>
      </div>

      {/* Engine Diagnostics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Database Engine</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold font-mono text-white mt-1">LiteDB v1.2</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Operational &amp; Synced
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Documents</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
            {metrics.totalRecords}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across 7 managed tables</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Storage Footprint</span>
            <HardDrive className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
            {metrics.storageSizeKb} KB
          </div>
          <div className="text-[11px] text-slate-400 mt-1">IndexedDB / Local Cache</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Signal Reactivity</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-400 mt-1">Fine-Grained</div>
          <div className="text-[11px] text-slate-400 mt-1">Auto-dispatches on commit</div>
        </div>
      </div>

      {/* Database Collection Explorer */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <FileJson className="w-4 h-4 text-indigo-400" />
            Collection Inspector
          </h2>

          {/* Collection Tab Selector */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            {collectionsList.map((col) => (
              <button
                key={col.key}
                onClick={() => setActiveCollection(col.key)}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  activeCollection === col.key
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {col.label} ({col.count})
              </button>
            ))}
          </div>
        </div>

        {/* JSON Viewer */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-96">
          <pre className="text-slate-300">
            {JSON.stringify(tableData, null, 2)}
          </pre>
        </div>
      </div>

      {/* Immutable Transaction Audit Trail */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">System Transaction &amp; Mutation Audit Log</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Every data modification, stock adjustment, and entity creation recorded in LiteDatabase
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Filter audit logs..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-700/60 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-700 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-4">Event Details</th>
                <th className="py-2.5 px-3">Authorized By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-750 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-400 tabular-nums whitespace-nowrap">
                    {formatLogDate(log.timestamp)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-indigo-400">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">
                    {log.entityType}
                  </td>
                  <td className="py-2.5 px-4 text-slate-200">
                    {log.details}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                    {log.performedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Backup Modal */}
      {showImportDialog && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-lg w-full space-y-4">
            <h3 className="text-base font-bold text-white">Restore LiteDatabase from JSON Backup</h3>
            <p className="text-xs text-slate-400">
              Upload an exported JSON backup file or paste raw database JSON below. This will replace the current state.
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Select File</label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Or Paste JSON Data</label>
                <textarea
                  rows={6}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste database JSON payload here..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportDialog(false)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-700 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!importText.trim()}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg cursor-pointer"
                >
                  Restore Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
