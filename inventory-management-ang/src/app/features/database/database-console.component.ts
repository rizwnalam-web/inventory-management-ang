import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiteDatabaseService } from '../../services/litedatabase.service';

@Component({
  selector: 'app-database-console',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-white">LiteDatabase Engine Console</h1>
          <p class="text-sm text-slate-400 mt-0.5">Embedded client-side document store with indexed collections</p>
        </div>

        <div class="flex gap-2">
          <button (click)="exportBackup()" class="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 cursor-pointer">
            Export JSON Backup
          </button>
          <button (click)="resetDefaults()" class="px-3.5 py-2 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 rounded-lg border border-rose-800 cursor-pointer">
            Reset Seed Data
          </button>
        </div>
      </div>

      <!-- Engine Diagnostics -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div class="text-xs text-slate-400">Database Engine</div>
          <div class="text-lg font-bold font-mono text-white mt-1">LiteDB (Angular 19)</div>
          <div class="text-[11px] text-emerald-400 mt-1">Operational</div>
        </div>

        <div class="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div class="text-xs text-slate-400">Total Documents</div>
          <div class="text-xl font-bold font-mono text-white mt-1">{{ metrics().totalRecords }}</div>
          <div class="text-[11px] text-slate-400 mt-1">Across 7 tables</div>
        </div>

        <div class="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div class="text-xs text-slate-400">Storage Size</div>
          <div class="text-xl font-bold font-mono text-white mt-1">{{ metrics().storageSizeKb }} KB</div>
          <div class="text-[11px] text-slate-400 mt-1">LocalStorage Cache</div>
        </div>

        <div class="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div class="text-xs text-slate-400">Reactivity</div>
          <div class="text-xl font-bold font-mono text-purple-400 mt-1">Angular Signals</div>
          <div class="text-[11px] text-slate-400 mt-1">Fine-grained graph</div>
        </div>
      </div>

      <!-- JSON Explorer -->
      <div class="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-4">
        <h2 class="text-base font-semibold text-white">Products Collection Raw Document Store</h2>
        <div class="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-96">
          <pre class="text-slate-300">{{ productsJson() }}</pre>
        </div>
      </div>
    </div>
  `
})
export class DatabaseConsoleComponent {
  private liteDb = inject(LiteDatabaseService);

  readonly metrics = signal(this.liteDb.getDatabaseMetrics());
  readonly productsJson = signal(JSON.stringify(this.liteDb.getTableData('products'), null, 2));

  exportBackup(): void {
    const jsonStr = this.liteDb.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-litedb-ang-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  resetDefaults(): void {
    if (confirm('Reset LiteDatabase to initial demo datasets?')) {
      this.liteDb.resetToDefaults();
      this.metrics.set(this.liteDb.getDatabaseMetrics());
      this.productsJson.set(JSON.stringify(this.liteDb.getTableData('products'), null, 2));
    }
  }
}
