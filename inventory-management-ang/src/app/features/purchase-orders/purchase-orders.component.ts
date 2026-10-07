import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="pb-2 border-b border-slate-800">
        <h1 class="text-2xl font-bold tracking-tight text-white">Procurement & Purchase Orders</h1>
        <p class="text-sm text-slate-400 mt-0.5">Supplier agreements, dock reception, and safety stock reorders</p>
      </div>

      <div class="space-y-3">
        <div *ngFor="let po of inventory.purchaseOrders()" class="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-white text-sm">{{ po.poNumber }}</span>
              <span class="text-xs uppercase font-mono font-semibold" [ngClass]="po.status === 'received' ? 'text-emerald-400' : 'text-sky-400'">
                {{ po.status }}
              </span>
            </div>
            <div class="text-xs text-slate-400 mt-1">
              Supplier: <strong class="text-slate-200">{{ po.supplierName }}</strong> · Date: {{ po.orderDate | date:'mediumDate' }}
            </div>
          </div>

          <div class="text-right">
            <div class="text-xs text-slate-400">Total Purchase Value</div>
            <div class="text-base font-bold font-mono text-emerald-400">\${{ po.totalAmount | number:'1.2-2' }}</div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PurchaseOrdersComponent {
  readonly inventory = inject(InventoryService);
}
