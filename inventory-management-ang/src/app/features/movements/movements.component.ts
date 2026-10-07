import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-movements',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-5">
      <div class="pb-2 border-b border-slate-800">
        <h1 class="text-2xl font-bold tracking-tight text-white">Stock Movements & Audit Ledger</h1>
        <p class="text-sm text-slate-400 mt-0.5">Immutable transaction record tracking every physical inventory quantity shift</p>
      </div>

      <div class="bg-slate-800/60 border border-slate-700/80 rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-900/60 border-b border-slate-700 text-slate-400">
                <th class="py-3 px-4">Timestamp</th>
                <th class="py-3 px-3">Type</th>
                <th class="py-3 px-3">SKU / Item</th>
                <th class="py-3 px-3">Reference</th>
                <th class="py-3 px-3 text-right">Delta</th>
                <th class="py-3 px-3 text-right">Balance</th>
                <th class="py-3 px-4">Reason & Justification</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-700/50">
              <tr *ngFor="let m of inventory.stockMovements()" class="hover:bg-slate-750">
                <td class="py-2.5 px-4 font-mono text-slate-400 tabular-nums">
                  {{ m.timestamp | date:'short' }}
                </td>
                <td class="py-2.5 px-3 uppercase font-mono font-medium" [ngClass]="m.type === 'inbound' ? 'text-emerald-400' : 'text-sky-400'">
                  {{ m.type }}
                </td>
                <td class="py-2.5 px-3">
                  <div class="font-semibold text-slate-200">{{ m.productName }}</div>
                  <div class="text-[11px] text-indigo-400 font-mono">{{ m.sku }}</div>
                </td>
                <td class="py-2.5 px-3 font-mono text-slate-300">{{ m.referenceNumber }}</td>
                <td class="py-2.5 px-3 text-right font-mono font-bold" [ngClass]="m.type === 'inbound' ? 'text-emerald-400' : 'text-rose-400'">
                  {{ m.type === 'inbound' ? '+' : '-' }}{{ m.quantity }}
                </td>
                <td class="py-2.5 px-3 text-right font-mono text-slate-300">{{ m.newStock }}</td>
                <td class="py-2.5 px-4 text-slate-300">{{ m.reason }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class MovementsComponent {
  readonly inventory = inject(InventoryService);
}
