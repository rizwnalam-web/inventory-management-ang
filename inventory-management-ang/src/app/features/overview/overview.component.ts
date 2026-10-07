import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-white">Operations & Inventory Overview</h1>
          <p class="text-sm text-slate-400 mt-0.5">Real-time reactive stock telemetry powered by Angular 19 Signals</p>
        </div>
        <button (click)="inventory.exportProductsCsv()" class="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 cursor-pointer">
          Export Inventory (CSV)
        </button>
      </div>

      <!-- KPI Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4.5">
          <div class="text-xs text-slate-400">Total Inventory Valuation</div>
          <div class="text-2xl font-bold font-mono tabular-nums text-white mt-1">
            \${{ inventory.kpis().totalValuation | number:'1.0-0' }}
          </div>
          <div class="text-xs text-emerald-400 mt-1">Est Margin: +\${{ inventory.kpis().potentialProfit | number:'1.0-0' }}</div>
        </div>

        <div class="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4.5">
          <div class="text-xs text-slate-400">On-Hand Physical Units</div>
          <div class="text-2xl font-bold font-mono tabular-nums text-white mt-1">
            {{ inventory.kpis().totalUnits | number }}
          </div>
          <div class="text-xs text-slate-400 mt-1">Across {{ inventory.kpis().totalSkus }} SKUs</div>
        </div>

        <div class="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4.5">
          <div class="text-xs text-slate-400">Low Stock Critical Alerts</div>
          <div class="text-2xl font-bold font-mono tabular-nums text-amber-400 mt-1">
            {{ inventory.kpis().lowStockCount + inventory.kpis().outOfStockCount }}
          </div>
          <div class="text-xs text-rose-400 mt-1">{{ inventory.kpis().outOfStockCount }} Depleted Items</div>
        </div>

        <div class="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4.5">
          <div class="text-xs text-slate-400">Inbound Purchase Orders</div>
          <div class="text-2xl font-bold font-mono tabular-nums text-sky-400 mt-1">
            {{ inventory.kpis().activePurchaseOrders }} Active
          </div>
          <div class="text-xs text-slate-400 mt-1">+{{ inventory.kpis().incomingUnits }} units in transit</div>
        </div>
      </div>

      <!-- Replenishment Queue -->
      <div class="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5">
        <h2 class="text-base font-semibold text-white mb-3">Critical Inventory Replenishment Queue</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-700 text-slate-400">
                <th class="pb-2">SKU & Item Name</th>
                <th class="pb-2 text-right">On Hand</th>
                <th class="pb-2 text-right">Min Level</th>
                <th class="pb-2 text-right">Unit Cost</th>
                <th class="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-700/50">
              <tr *ngFor="let item of inventory.lowStockProducts()" class="hover:bg-slate-750">
                <td class="py-2.5">
                  <div class="font-medium text-slate-100">{{ item.name }}</div>
                  <div class="text-indigo-400 font-mono text-[11px]">{{ item.sku }}</div>
                </td>
                <td class="py-2.5 text-right font-mono font-bold text-amber-400">
                  {{ item.quantity }} {{ item.unit }}
                </td>
                <td class="py-2.5 text-right font-mono text-slate-400">{{ item.minStockLevel }}</td>
                <td class="py-2.5 text-right font-mono text-slate-300">\${{ item.costPrice | number:'1.2-2' }}</td>
                <td class="py-2.5 text-right">
                  <button (click)="inventory.adjustStock(item.id, 25, 'inbound', 'Quick replenishment', 'REPLENISH')" class="px-2.5 py-1 text-[11px] font-medium text-indigo-300 bg-indigo-950/70 border border-indigo-700/60 rounded cursor-pointer">
                    + Restock 25
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class OverviewComponent {
  readonly inventory = inject(InventoryService);
}
