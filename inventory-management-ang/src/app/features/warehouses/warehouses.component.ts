import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="pb-2 border-b border-slate-800">
        <h1 class="text-2xl font-bold tracking-tight text-white">Facility Logistics & Topology</h1>
        <p class="text-sm text-slate-400 mt-0.5">Spatial monitoring across regional logistics centers and storage terminals</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div *ngFor="let stat of inventory.warehouseStats()" class="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-bold text-white text-base">{{ stat.warehouse.name }}</span>
            <span class="text-xs font-mono text-indigo-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {{ stat.warehouse.code }}
            </span>
          </div>

          <div class="text-xs text-slate-400">
            {{ stat.warehouse.location }} · Manager: {{ stat.warehouse.managerName }}
          </div>

          <div class="space-y-1">
            <div class="flex justify-between text-xs">
              <span class="text-slate-400">Capacity Allocation</span>
              <span class="font-mono text-slate-200 font-bold">{{ stat.fillPercentage }}%</span>
            </div>
            <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
              <div class="h-full bg-indigo-500 rounded-full" [style.width.%]="stat.fillPercentage"></div>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-700/60 flex justify-between text-xs font-mono">
            <span>{{ stat.totalUnits | number }} Units</span>
            <span class="text-emerald-400 font-bold">\${{ stat.totalValue | number:'1.0-0' }} Value</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WarehousesComponent {
  readonly inventory = inject(InventoryService);
}
