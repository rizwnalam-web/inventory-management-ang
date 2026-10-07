import { Injectable, signal, computed, effect } from '@angular/core';
import { LiteDatabaseService } from './litedatabase.service';
import {
  Product,
  Category,
  Warehouse,
  StockMovement,
  PurchaseOrder,
  Supplier,
  AuditLog,
  ProductFilters,
  InventoryKPIs,
  MovementType,
  ModuleRoute,
} from '../models/inventory.types';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  // Angular 19 native signals
  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly warehouses = signal<Warehouse[]>([]);
  readonly stockMovements = signal<StockMovement[]>([]);
  readonly purchaseOrders = signal<PurchaseOrder[]>([]);
  readonly suppliers = signal<Supplier[]>([]);
  readonly auditLogs = signal<AuditLog[]>([]);

  readonly selectedWarehouseId = signal<string>('all');
  readonly activeRoute = signal<ModuleRoute>('overview');

  readonly toastNotification = signal<{
    id: string;
    type: 'success' | 'warning' | 'info' | 'error';
    message: string;
  } | null>(null);

  readonly filters = signal<ProductFilters>({
    search: '',
    category: 'all',
    stockStatus: 'all',
    warehouseId: 'all',
    sortBy: 'name',
    sortDirection: 'asc',
  });

  // Angular 19 computed signals
  readonly filteredProducts = computed(() => {
    const items = this.products();
    const currentFilters = this.filters();
    const globalWh = this.selectedWarehouseId();

    return items
      .filter((prod) => {
        if (globalWh !== 'all' && prod.warehouseId !== globalWh) return false;
        if (currentFilters.warehouseId !== 'all' && prod.warehouseId !== currentFilters.warehouseId) return false;
        if (currentFilters.category !== 'all' && prod.category !== currentFilters.category) return false;
        if (currentFilters.stockStatus !== 'all' && prod.status !== currentFilters.stockStatus) return false;
        if (currentFilters.search.trim()) {
          const q = currentFilters.search.toLowerCase().trim();
          const inName = prod.name.toLowerCase().includes(q);
          const inSku = prod.sku.toLowerCase().includes(q);
          const inBin = prod.binLocation.toLowerCase().includes(q);
          const inBarcode = prod.barcode.toLowerCase().includes(q);
          if (!inName && !inSku && !inBin && !inBarcode) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dir = currentFilters.sortDirection === 'asc' ? 1 : -1;
        if (currentFilters.sortBy === 'name') return dir * a.name.localeCompare(b.name);
        if (currentFilters.sortBy === 'quantity') return dir * (a.quantity - b.quantity);
        if (currentFilters.sortBy === 'unitPrice') return dir * (a.unitPrice - b.unitPrice);
        if (currentFilters.sortBy === 'valuation') return dir * (a.quantity * a.unitPrice - b.quantity * b.unitPrice);
        if (currentFilters.sortBy === 'updatedAt') return dir * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
        return 0;
      });
  });

  readonly kpis = computed<InventoryKPIs>(() => {
    const items = this.products();
    const pos = this.purchaseOrders();
    const whs = this.warehouses();

    let totalUnits = 0;
    let totalValuation = 0;
    let totalCostValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of items) {
      totalUnits += p.quantity;
      totalValuation += p.quantity * p.unitPrice;
      totalCostValuation += p.quantity * p.costPrice;
      if (p.quantity === 0 || p.status === 'out_of_stock') {
        outOfStockCount++;
      } else if (p.quantity <= p.minStockLevel || p.status === 'low_stock') {
        lowStockCount++;
      }
    }

    const activePurchaseOrders = pos.filter((p) => p.status === 'pending' || p.status === 'approved').length;
    let incomingUnits = 0;
    for (const po of pos) {
      if (po.status === 'approved' || po.status === 'pending') {
        for (const item of po.items) {
          incomingUnits += item.quantity - item.receivedQuantity;
        }
      }
    }

    const totalCap = whs.reduce((acc, w) => acc + w.capacityUnits, 0);
    const totalOccupied = whs.reduce((acc, w) => acc + w.occupiedUnits, 0);
    const warehouseUtilizationRate = totalCap > 0 ? Math.round((totalOccupied / totalCap) * 100) : 0;

    return {
      totalSkus: items.length,
      totalUnits,
      totalValuation,
      totalCostValuation,
      potentialProfit: totalValuation - totalCostValuation,
      lowStockCount,
      outOfStockCount,
      activePurchaseOrders,
      incomingUnits,
      warehouseUtilizationRate,
    };
  });

  readonly lowStockProducts = computed(() => {
    return this.products().filter((p) => p.quantity <= p.minStockLevel);
  });

  readonly recentMovements = computed(() => {
    return this.stockMovements().slice(0, 10);
  });

  readonly warehouseStats = computed(() => {
    const whs = this.warehouses();
    const prods = this.products();

    return whs.map((wh) => {
      const whProds = prods.filter((p) => p.warehouseId === wh.id);
      const units = whProds.reduce((sum, p) => sum + p.quantity, 0);
      const val = whProds.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
      const fill = wh.capacityUnits > 0 ? Math.round((units / wh.capacityUnits) * 100) : 0;

      return {
        warehouse: wh,
        productCount: whProds.length,
        totalUnits: units,
        totalValue: val,
        fillPercentage: fill,
      };
    });
  });

  constructor(private liteDb: LiteDatabaseService) {
    this.syncFromDatabase();
    this.liteDb.subscribeChanges(() => {
      this.syncFromDatabase();
    });
  }

  private syncFromDatabase(): void {
    this.products.set(this.liteDb.getTableData<Product>('products'));
    this.categories.set(this.liteDb.getTableData<Category>('categories'));
    this.warehouses.set(this.liteDb.getTableData<Warehouse>('warehouses'));
    this.stockMovements.set(this.liteDb.getTableData<StockMovement>('stock_movements'));
    this.purchaseOrders.set(this.liteDb.getTableData<PurchaseOrder>('purchase_orders'));
    this.suppliers.set(this.liteDb.getTableData<Supplier>('suppliers'));
    this.auditLogs.set(this.liteDb.getTableData<AuditLog>('audit_logs'));
  }

  public showToast(message: string, type: 'success' | 'warning' | 'info' | 'error' = 'success'): void {
    const id = `toast-${Date.now()}`;
    this.toastNotification.set({ id, type, message });
    setTimeout(() => {
      if (this.toastNotification()?.id === id) {
        this.toastNotification.set(null);
      }
    }, 4000);
  }

  public adjustStock(productId: string, delta: number, type: MovementType, reason: string, refNum?: string): void {
    const prods = this.products();
    const index = prods.findIndex((p) => p.id === productId);
    if (index === -1) return;

    const prod = prods[index];
    const prevStock = prod.quantity;
    const newStock = Math.max(0, prevStock + delta);
    const nextStatus = newStock === 0 ? 'out_of_stock' : newStock <= prod.minStockLevel ? 'low_stock' : 'in_stock';

    const updatedProd: Product = { ...prod, quantity: newStock, status: nextStatus, updatedAt: new Date().toISOString() };
    const updatedProds = [...prods];
    updatedProds[index] = updatedProd;
    this.liteDb.saveTableData('products', updatedProds);

    const mov: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: prod.id,
      sku: prod.sku,
      productName: prod.name,
      type,
      quantity: Math.abs(delta),
      previousStock: prevStock,
      newStock,
      fromWarehouseId: delta < 0 ? prod.warehouseId : undefined,
      toWarehouseId: delta > 0 ? prod.warehouseId : undefined,
      timestamp: new Date().toISOString(),
      referenceNumber: refNum || `ADJ-${Date.now().toString().slice(-6)}`,
      reason,
      performedBy: 'Lead Operations Engineer',
    };
    this.liteDb.saveTableData('stock_movements', [mov, ...this.stockMovements()]);
    this.liteDb.logAudit('STOCK_ADJUST', 'Stock', prod.id, `Stock adjusted for ${prod.sku}: ${delta > 0 ? '+' : ''}${delta} units.`);
    this.showToast(`Stock updated for ${prod.sku}: new total ${newStock} units.`, 'success');
  }

  public exportProductsCsv(customProducts?: Product[]): void {
    const prods = customProducts || this.filteredProducts();
    const whs = this.warehouses();
    const sups = this.suppliers();

    const headers = [
      'Product ID', 'SKU', 'Product Name', 'Category', 'Warehouse Code', 'Warehouse Name',
      'Bin Location', 'Quantity On Hand', 'Unit', 'Min Safety', 'Max Stock', 'Unit Price ($)',
      'Unit Cost ($)', 'Total Valuation ($)', 'Total Cost ($)', 'Margin ($)', 'Margin %', 'Status'
    ];

    const escape = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = prods.map((p) => {
      const wh = whs.find((w) => w.id === p.warehouseId);
      const val = p.quantity * p.unitPrice;
      const cost = p.quantity * p.costPrice;
      return [
        escape(p.id), escape(p.sku), escape(p.name), escape(p.category),
        escape(wh?.code || 'N/A'), escape(wh?.name || 'Unassigned'),
        escape(p.binLocation), p.quantity, escape(p.unit), p.minStockLevel,
        p.maxStockLevel, p.unitPrice.toFixed(2), p.costPrice.toFixed(2),
        val.toFixed(2), cost.toFixed(2), (val - cost).toFixed(2),
        val > 0 ? `${Math.round(((p.unitPrice - p.costPrice) / p.unitPrice) * 100)}%` : '0%',
        escape(p.status.toUpperCase())
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexus-inventory-catalog-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.showToast(`Exported ${prods.length} items to CSV.`, 'success');
  }
}
