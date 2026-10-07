/**
 * Angular-Style Signal Store & Inventory Service
 * Manages fine-grained reactive signals and coordinates LiteDatabase mutations.
 */

import { signal, computed, WritableSignal, Signal } from '../core/signals';
import { liteDb } from './litedatabase';
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

export class InventoryStoreService {
  // Angular-style Writable Signals
  public readonly products: WritableSignal<Product[]>;
  public readonly categories: WritableSignal<Category[]>;
  public readonly warehouses: WritableSignal<Warehouse[]>;
  public readonly stockMovements: WritableSignal<StockMovement[]>;
  public readonly purchaseOrders: WritableSignal<PurchaseOrder[]>;
  public readonly suppliers: WritableSignal<Supplier[]>;
  public readonly auditLogs: WritableSignal<AuditLog[]>;

  // UI state signals
  public readonly activeRoute: WritableSignal<ModuleRoute> = signal<ModuleRoute>('overview');
  public readonly selectedWarehouseId: WritableSignal<string> = signal<string>('all');
  public readonly toastNotification: WritableSignal<{
    id: string;
    type: 'success' | 'warning' | 'info' | 'error';
    message: string;
  } | null> = signal(null);

  public readonly filters: WritableSignal<ProductFilters> = signal<ProductFilters>({
    search: '',
    category: 'all',
    stockStatus: 'all',
    warehouseId: 'all',
    sortBy: 'name',
    sortDirection: 'asc',
  });

  // Angular Computed Signals
  public readonly filteredProducts: Signal<Product[]>;
  public readonly kpis: Signal<InventoryKPIs>;
  public readonly lowStockProducts: Signal<Product[]>;
  public readonly recentMovements: Signal<StockMovement[]>;
  public readonly warehouseStats: Signal<{
    warehouse: Warehouse;
    productCount: number;
    totalUnits: number;
    totalValue: number;
    fillPercentage: number;
  }[]>;

  constructor() {
    // Initialize signals from LiteDatabase
    this.products = signal<Product[]>(liteDb.collection('products').getAll());
    this.categories = signal<Category[]>(liteDb.collection('categories').getAll());
    this.warehouses = signal<Warehouse[]>(liteDb.collection('warehouses').getAll());
    this.stockMovements = signal<StockMovement[]>(liteDb.collection('stock_movements').getAll());
    this.purchaseOrders = signal<PurchaseOrder[]>(liteDb.collection('purchase_orders').getAll());
    this.suppliers = signal<Supplier[]>(liteDb.collection('suppliers').getAll());
    this.auditLogs = signal<AuditLog[]>(liteDb.collection('audit_logs').getAll());

    // Connect LiteDatabase changes back to signals automatically
    liteDb.subscribeChanges(() => {
      this.syncFromDatabase();
    });

    // 1. Computed Filtered Products Signal
    this.filteredProducts = computed(() => {
      const items = this.products();
      const currentFilters = this.filters();
      const globalWh = this.selectedWarehouseId();

      return items
        .filter((prod) => {
          // Global warehouse selection override
          if (globalWh !== 'all' && prod.warehouseId !== globalWh) {
            return false;
          }
          if (currentFilters.warehouseId !== 'all' && prod.warehouseId !== currentFilters.warehouseId) {
            return false;
          }
          if (currentFilters.category !== 'all' && prod.category !== currentFilters.category) {
            return false;
          }
          if (currentFilters.stockStatus !== 'all' && prod.status !== currentFilters.stockStatus) {
            return false;
          }
          if (currentFilters.search.trim()) {
            const query = currentFilters.search.toLowerCase().trim();
            const inName = prod.name.toLowerCase().includes(query);
            const inSku = prod.sku.toLowerCase().includes(query);
            const inBin = prod.binLocation.toLowerCase().includes(query);
            const inBarcode = prod.barcode.toLowerCase().includes(query);
            if (!inName && !inSku && !inBin && !inBarcode) return false;
          }
          return true;
        })
        .sort((a, b) => {
          const dir = currentFilters.sortDirection === 'asc' ? 1 : -1;
          if (currentFilters.sortBy === 'name') {
            return dir * a.name.localeCompare(b.name);
          }
          if (currentFilters.sortBy === 'quantity') {
            return dir * (a.quantity - b.quantity);
          }
          if (currentFilters.sortBy === 'unitPrice') {
            return dir * (a.unitPrice - b.unitPrice);
          }
          if (currentFilters.sortBy === 'valuation') {
            return dir * (a.quantity * a.unitPrice - b.quantity * b.unitPrice);
          }
          if (currentFilters.sortBy === 'updatedAt') {
            return dir * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
          }
          return 0;
        });
    });

    // 2. Computed KPIs Signal
    this.kpis = computed(() => {
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

    // 3. Computed Low Stock Products
    this.lowStockProducts = computed(() => {
      return this.products().filter((p) => p.quantity <= p.minStockLevel);
    });

    // 4. Computed Recent Movements
    this.recentMovements = computed(() => {
      return this.stockMovements().slice(0, 10);
    });

    // 5. Computed Warehouse Summaries
    this.warehouseStats = computed(() => {
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
  }

  private syncFromDatabase() {
    this.products.set(liteDb.collection('products').getAll());
    this.categories.set(liteDb.collection('categories').getAll());
    this.warehouses.set(liteDb.collection('warehouses').getAll());
    this.stockMovements.set(liteDb.collection('stock_movements').getAll());
    this.purchaseOrders.set(liteDb.collection('purchase_orders').getAll());
    this.suppliers.set(liteDb.collection('suppliers').getAll());
    this.auditLogs.set(liteDb.collection('audit_logs').getAll());
  }

  public showToast(message: string, type: 'success' | 'warning' | 'info' | 'error' = 'success') {
    const id = `toast-${Date.now()}`;
    this.toastNotification.set({ id, type, message });
    setTimeout(() => {
      if (this.toastNotification()?.id === id) {
        this.toastNotification.set(null);
      }
    }, 4000);
  }

  // Stock Adjustment Action
  public adjustStock(
    productId: string,
    delta: number,
    type: MovementType,
    reason: string,
    referenceNumber?: string
  ): void {
    const product = liteDb.collection('products').getById(productId);
    if (!product) throw new Error('Product not found in LiteDatabase');

    const prevStock = product.quantity;
    const newStock = Math.max(0, prevStock + delta);

    let nextStatus = product.status;
    if (newStock === 0) {
      nextStatus = 'out_of_stock';
    } else if (newStock <= product.minStockLevel) {
      nextStatus = 'low_stock';
    } else {
      nextStatus = 'in_stock';
    }

    liteDb.collection('products').update(productId, {
      quantity: newStock,
      status: nextStatus,
    });

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      type,
      quantity: Math.abs(delta),
      previousStock: prevStock,
      newStock,
      fromWarehouseId: delta < 0 ? product.warehouseId : undefined,
      toWarehouseId: delta > 0 ? product.warehouseId : undefined,
      timestamp: new Date().toISOString(),
      referenceNumber: referenceNumber || `ADJ-${Date.now().toString().slice(-6)}`,
      reason,
      performedBy: 'Lead Operations Engineer',
    };

    liteDb.collection('stock_movements').insert(movement);

    liteDb.logAudit(
      'STOCK_ADJUST',
      'Stock',
      product.id,
      `Stock adjusted for ${product.name} (${product.sku}): ${delta > 0 ? '+' : ''}${delta} units (${prevStock} -> ${newStock}). Reason: ${reason}`
    );

    this.showToast(
      `Stock updated for ${product.sku}: ${delta > 0 ? '+' : ''}${delta} units (New total: ${newStock} ${product.unit}).`,
      'success'
    );
  }

  // Stock Transfer between Warehouses
  public transferStock(
    productId: string,
    quantity: number,
    fromWarehouseId: string,
    toWarehouseId: string,
    notes: string
  ): void {
    if (quantity <= 0) throw new Error('Transfer quantity must be greater than zero');
    if (fromWarehouseId === toWarehouseId) throw new Error('Source and destination warehouses cannot be the same');

    const product = liteDb.collection('products').getById(productId);
    if (!product) throw new Error('Product not found');
    if (product.quantity < quantity) throw new Error('Insufficient stock available for transfer');

    const fromWh = liteDb.collection('warehouses').getById(fromWarehouseId);
    const toWh = liteDb.collection('warehouses').getById(toWarehouseId);

    // Update product location or adjust quantities
    // For single product entity with location assignment:
    const prevStock = product.quantity;
    liteDb.collection('products').update(productId, {
      warehouseId: toWarehouseId,
      binLocation: `Transfer Bay · Inbound from ${fromWh?.code || 'Orig'}`,
    });

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      type: 'transfer',
      quantity,
      previousStock: prevStock,
      newStock: prevStock,
      fromWarehouseId,
      toWarehouseId,
      timestamp: new Date().toISOString(),
      referenceNumber: `TRF-${Date.now().toString().slice(-6)}`,
      reason: `Warehouse inter-facility transfer: ${notes || 'Rebalance inventory'}`,
      performedBy: 'Logistics Router',
    };

    liteDb.collection('stock_movements').insert(movement);

    liteDb.logAudit(
      'TRANSFER',
      'Stock',
      product.id,
      `Transferred ${quantity} units of ${product.sku} from ${fromWh?.name} to ${toWh?.name}.`
    );

    this.showToast(`Transfer scheduled: ${quantity} units transferred to ${toWh?.name}.`, 'info');
  }

  // Create Product
  public createProduct(data: Omit<Product, 'id' | 'updatedAt' | 'lastRestockedAt' | 'status'>): Product {
    const id = `prod-${Date.now()}`;
    const status = data.quantity === 0 ? 'out_of_stock' : data.quantity <= data.minStockLevel ? 'low_stock' : 'in_stock';
    const now = new Date().toISOString();

    const newProduct: Product = {
      ...data,
      id,
      status,
      lastRestockedAt: now,
      updatedAt: now,
    };

    liteDb.collection('products').insert(newProduct);

    // Record initial inbound stock movement if qty > 0
    if (newProduct.quantity > 0) {
      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        productId: newProduct.id,
        sku: newProduct.sku,
        productName: newProduct.name,
        type: 'inbound',
        quantity: newProduct.quantity,
        previousStock: 0,
        newStock: newProduct.quantity,
        toWarehouseId: newProduct.warehouseId,
        timestamp: now,
        referenceNumber: `INIT-${newProduct.sku}`,
        reason: 'Initial catalog inventory initialization',
        performedBy: 'Lead Operations Engineer',
      };
      liteDb.collection('stock_movements').insert(movement);
    }

    liteDb.logAudit('CREATE', 'Product', newProduct.id, `Created new product ${newProduct.name} (${newProduct.sku}) with ${newProduct.quantity} initial units.`);
    this.showToast(`Product ${newProduct.sku} registered successfully.`, 'success');
    return newProduct;
  }

  // Update Product
  public updateProduct(id: string, updates: Partial<Product>): void {
    const updated = liteDb.collection('products').update(id, updates);
    liteDb.logAudit('UPDATE', 'Product', id, `Updated catalog specifications for ${updated.name} (${updated.sku}).`);
    this.showToast(`Product ${updated.sku} updated.`, 'info');
  }

  // Delete Product
  public deleteProduct(id: string): void {
    const item = liteDb.collection('products').getById(id);
    if (!item) return;
    liteDb.collection('products').delete(id);
    liteDb.logAudit('DELETE', 'Product', id, `Archived and removed ${item.name} (${item.sku}) from catalog.`);
    this.showToast(`Product ${item.sku} deleted from inventory.`, 'warning');
  }

  // Create Purchase Order
  public createPurchaseOrder(po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'orderDate'>): PurchaseOrder {
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newPO: PurchaseOrder = {
      ...po,
      id: `po-${Date.now()}`,
      poNumber,
      orderDate: new Date().toISOString(),
    };

    liteDb.collection('purchase_orders').insert(newPO);
    liteDb.logAudit('CREATE', 'PurchaseOrder', newPO.id, `Created Purchase Order ${newPO.poNumber} for ${newPO.supplierName} ($${newPO.totalAmount.toLocaleString()}).`);
    this.showToast(`Purchase Order ${newPO.poNumber} dispatched to ${newPO.supplierName}.`, 'success');
    return newPO;
  }

  // Receive Purchase Order items
  public receivePurchaseOrder(poId: string): void {
    const po = liteDb.collection('purchase_orders').getById(poId);
    if (!po) throw new Error('Purchase order not found');

    // Update each item in the product catalog with received quantity
    for (const line of po.items) {
      const remaining = line.quantity - line.receivedQuantity;
      if (remaining > 0) {
        this.adjustStock(line.productId, remaining, 'inbound', `Received PO shipment ${po.poNumber}`, po.poNumber);
      }
    }

    const updatedLines = po.items.map((line) => ({ ...line, receivedQuantity: line.quantity }));
    liteDb.collection('purchase_orders').update(poId, {
      status: 'received',
      items: updatedLines,
    });

    liteDb.logAudit('RECEIVE_PO', 'PurchaseOrder', po.id, `Completed receiving for ${po.poNumber}. Stock counts incremented.`);
    this.showToast(`Shipment for ${po.poNumber} received and stored into inventory!`, 'success');
  }

  // Export Products to CSV report for executive & warehouse reporting
  public exportProductsCsv(customProducts?: Product[]): void {
    const prods = customProducts || this.filteredProducts();
    const whs = this.warehouses();
    const sups = this.suppliers();

    const headers = [
      'Product ID',
      'SKU',
      'Product Name',
      'Category',
      'Warehouse Code',
      'Warehouse Name',
      'Bin Location',
      'Quantity On Hand',
      'Unit of Measure',
      'Min Safety Stock',
      'Max Stock Level',
      'Unit Price ($)',
      'Unit Cost ($)',
      'Total Valuation ($)',
      'Total Cost Basis ($)',
      'Est Profit Margin ($)',
      'Margin %',
      'Stock Status',
      'Supplier Code',
      'Supplier Name',
      'Barcode EAN',
      'Last Restocked At',
      'Last Updated At',
    ];

    const escapeCsv = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = prods.map((p) => {
      const wh = whs.find((w) => w.id === p.warehouseId);
      const sup = sups.find((s) => s.id === p.supplierId);
      const totalVal = p.quantity * p.unitPrice;
      const totalCost = p.quantity * p.costPrice;
      const marginDollar = totalVal - totalCost;
      const marginPct = totalVal > 0 ? Math.round(((p.unitPrice - p.costPrice) / p.unitPrice) * 100) : 0;

      return [
        escapeCsv(p.id),
        escapeCsv(p.sku),
        escapeCsv(p.name),
        escapeCsv(p.category),
        escapeCsv(wh?.code || 'N/A'),
        escapeCsv(wh?.name || 'Unassigned'),
        escapeCsv(p.binLocation),
        p.quantity,
        escapeCsv(p.unit),
        p.minStockLevel,
        p.maxStockLevel,
        p.unitPrice.toFixed(2),
        p.costPrice.toFixed(2),
        totalVal.toFixed(2),
        totalCost.toFixed(2),
        marginDollar.toFixed(2),
        `${marginPct}%`,
        escapeCsv(p.status.toUpperCase()),
        escapeCsv(sup?.code || 'N/A'),
        escapeCsv(sup?.name || 'N/A'),
        escapeCsv(p.barcode),
        escapeCsv(p.lastRestockedAt),
        escapeCsv(p.updatedAt),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `nexus-inventory-catalog-${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    liteDb.logAudit(
      'EXPORT_DATA',
      'Product',
      'CATALOG_CSV',
      `Exported CSV inventory report containing ${prods.length} products.`
    );

    this.showToast(
      `Inventory report exported successfully (${prods.length} products).`,
      'success'
    );
  }

  // Database backups and resets
  public exportBackupJson(): void {
    const jsonStr = liteDb.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexus-inventory-litedb-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showToast('LiteDatabase backup exported successfully.', 'success');
  }

  public importBackupJson(jsonStr: string): boolean {
    const success = liteDb.importBackup(jsonStr);
    if (success) {
      this.syncFromDatabase();
      this.showToast('LiteDatabase restored successfully from backup.', 'success');
      return true;
    }
    this.showToast('Failed to import backup: invalid schema structure.', 'error');
    return false;
  }

  public resetDatabaseDefaults(): void {
    liteDb.resetToDefaults();
    this.syncFromDatabase();
    this.showToast('LiteDatabase reset to initial enterprise dataset.', 'warning');
  }
}

// Global injectable singleton instance
export const inventoryStore = new InventoryStoreService();
