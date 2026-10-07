import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InventoryService } from './services/inventory.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      <!-- Collapsible Sidebar -->
      <aside class="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          <!-- Brand -->
          <div class="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-base shadow-sm">
                N
              </div>
              <div>
                <span class="font-bold text-base tracking-tight text-white">Nexus Stock</span>
                <span class="block text-[10px] text-slate-400 -mt-0.5 font-medium">Angular 19 Signals</span>
              </div>
            </div>
          </div>

          <!-- Navigation Links -->
          <nav class="p-3 space-y-1">
            <div class="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Modules (Lazy Loaded)
            </div>
            
            <a routerLink="/overview" routerLinkActive="bg-indigo-600 text-white font-semibold" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors">
              <span>Operations Overview</span>
            </a>

            <a routerLink="/products" routerLinkActive="bg-indigo-600 text-white font-semibold" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors">
              <span>Stock Catalog & SKUs</span>
              <span *ngIf="inventory.lowStockProducts().length > 0" class="text-amber-400 font-mono text-[11px] font-bold">
                {{ inventory.lowStockProducts().length }} alert
              </span>
            </a>

            <a routerLink="/movements" routerLinkActive="bg-indigo-600 text-white font-semibold" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors">
              <span>Stock Movements Ledger</span>
            </a>

            <a routerLink="/warehouses" routerLinkActive="bg-indigo-600 text-white font-semibold" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors">
              <span>Facility Topology</span>
            </a>

            <a routerLink="/purchase-orders" routerLinkActive="bg-indigo-600 text-white font-semibold" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors">
              <span>Purchase Orders</span>
              <span *ngIf="inventory.kpis().activePurchaseOrders > 0" class="text-sky-400 font-mono text-[11px] font-bold">
                {{ inventory.kpis().activePurchaseOrders }}
              </span>
            </a>

            <a routerLink="/suppliers" routerLinkActive="bg-indigo-600 text-white font-semibold" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors">
              <span>Suppliers Directory</span>
            </a>

            <a routerLink="/database" routerLinkActive="bg-indigo-600 text-white font-semibold" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors">
              <span>LiteDatabase Console</span>
            </a>
          </nav>
        </div>

        <div class="p-3.5 m-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
          <div class="text-indigo-400 font-semibold text-[11px]">Angular 19 Zoneless</div>
          <p class="text-[11px] text-slate-400">Native signal reactive architecture with zero zone.js overhead.</p>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Top Bar -->
        <header class="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div class="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400">Nexus Stock</span>
            <span className="text-slate-600">/</span>
            <span className="font-medium text-slate-100">Enterprise Dashboard</span>
          </div>

          <div class="flex items-center gap-3">
            <button (click)="inventory.exportProductsCsv()" class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700 cursor-pointer">
              Export Catalog (CSV)
            </button>
          </div>
        </header>

        <!-- Router Outlet -->
        <main class="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Toast -->
      <div *ngIf="inventory.toastNotification() as toast" class="fixed bottom-5 right-5 z-50 p-3.5 rounded-xl border border-emerald-500/50 bg-slate-900/95 text-xs text-slate-200 shadow-xl">
        {{ toast.message }}
      </div>
    </div>
  `
})
export class AppComponent {
  readonly inventory = inject(InventoryService);
}
