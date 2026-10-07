import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="pb-2 border-b border-slate-800">
        <h1 class="text-2xl font-bold tracking-tight text-white">Suppliers & Vendor Directory</h1>
        <p class="text-sm text-slate-400 mt-0.5">Verified hardware manufacturers, SLA lead times, and reliability scoring</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div *ngFor="let s of inventory.suppliers()" class="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-3">
          <div class="flex items-start justify-between">
            <div>
              <div class="font-bold text-white text-base">{{ s.name }}</div>
              <div class="text-xs text-slate-400 font-mono">{{ s.code }} · {{ s.country }}</div>
            </div>
            <div class="text-xs bg-amber-950/50 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-mono font-bold">
              ★ {{ s.rating }}
            </div>
          </div>

          <div class="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">
            <div>Email: <span class="font-mono text-slate-400">{{ s.email }}</span></div>
            <div>Phone: <span class="font-mono text-slate-400">{{ s.phone }}</span></div>
            <div>Lead Time: <span class="font-mono text-indigo-400">{{ s.leadTimeDays }} Days</span></div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SuppliersComponent {
  readonly inventory = inject(InventoryService);
}
