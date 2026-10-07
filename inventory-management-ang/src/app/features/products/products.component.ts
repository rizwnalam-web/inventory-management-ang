import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-white">Catalog & Stock Ledger</h1>
          <p class="text-sm text-slate-400 mt-0.5">Active SKUs, unit costs, bin coordinates, and safety stock thresholds</p>
        </div>

        <div class="flex items-center gap-2">
          <button (click)="inventory.exportProductsCsv()" class="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 cursor-pointer">
            Export CSV Report
          </button>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between">
        <input
          type="text"
          [ngModel]="inventory.filters().search"
          (ngModelChange)="updateSearch($event)"
          placeholder="Search by SKU, product name, bin, or barcode..."
          class="w-full md:w-80 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
        />

        <div class="flex items-center gap-2 text-xs">
          <select
            [ngModel]="inventory.filters().category"
            (ngModelChange)="updateCategory($event)"
            class="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option *ngFor="let cat of inventory.categories()" [value]="cat.name">{{ cat.name }}</option>
          </select>

          <select
            [ngModel]="inventory.filters().stockStatus"
            (ngModelChange)="updateStatus($event)"
            class="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      <!-- High-Density Products Grid -->
      <div class="bg-slate-800/60 border border-slate-700/80 rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-900/60 border-b border-slate-700 text-slate-400 font-medium">
                <th class="py-3 px-4">SKU / Item Specifications</th>
                <th class="py-3 px-3">Bin Location</th>
                <th class="py-3 px-3 text-right">Stock Level</th>
                <th class="py-3 px-3 text-right">Unit Price</th>
                <th class="py-3 px-3 text-right">Valuation</th>
                <th class="py-3 px-3">Status</th>
                <th class="py-3 px-4 text-right">Quick Stock</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-700/50">
              <tr *ngFor="let p of inventory.filteredProducts()" class="hover:bg-slate-750">
                <td class="py-3 px-4">
                  <div class="font-semibold text-slate-100">{{ p.name }}</div>
                  <div class="text-[11px] text-slate-400 font-mono mt-0.5">
                    <span class="text-indigo-400 font-medium">{{ p.sku }}</span> · {{ p.category }} · {{ p.barcode }}
                  </div>
                </td>
                <td class="py-3 px-3 text-slate-300 font-mono">{{ p.binLocation }}</td>
                <td class="py-3 px-3 text-right font-mono font-bold tabular-nums">
                  <span [ngClass]="p.quantity === 0 ? 'text-rose-400' : p.quantity <= p.minStockLevel ? 'text-amber-400' : 'text-slate-100'">
                    {{ p.quantity }} {{ p.unit }}
                  </span>
                </td>
                <td class="py-3 px-3 text-right font-mono tabular-nums text-slate-200">
                  \${{ p.unitPrice | number:'1.2-2' }}
                </td>
                <td class="py-3 px-3 text-right font-mono font-bold tabular-nums text-slate-200">
                  \${{ p.quantity * p.unitPrice | number:'1.2-2' }}
                </td>
                <td class="py-3 px-3">
                  <span class="font-medium capitalize" [ngClass]="p.status === 'in_stock' ? 'text-emerald-400' : p.status === 'low_stock' ? 'text-amber-400' : 'text-rose-400'">
                    {{ p.status === 'in_stock' ? 'In Stock' : p.status === 'low_stock' ? 'Low Stock' : 'Depleted' }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button (click)="inventory.adjustStock(p.id, 5, 'inbound', 'Inbound scan', 'DOCK')" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded border border-slate-700 cursor-pointer font-bold">
                      +5
                    </button>
                    <button (click)="inventory.adjustStock(p.id, -5, 'outbound', 'Outbound issue', 'DISPATCH')" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded border border-slate-700 cursor-pointer font-bold">
                      -5
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ProductsComponent {
  readonly inventory = inject(InventoryService);

  updateSearch(search: string): void {
    this.inventory.filters.update(f => ({ ...f, search }));
  }

  updateCategory(category: string): void {
    this.inventory.filters.update(f => ({ ...f, category }));
  }

  updateStatus(stockStatus: string): void {
    this.inventory.filters.update(f => ({ ...f, stockStatus }));
  }
}
