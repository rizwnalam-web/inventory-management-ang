/**
 * Enterprise Inventory Management System Type Definitions
 */

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'reordered';

export type MovementType = 'inbound' | 'outbound' | 'transfer' | 'adjustment' | 'scrap';

export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'received' | 'cancelled';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  warehouseId: string;
  binLocation: string;
  quantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  unitPrice: number;
  costPrice: number;
  status: StockStatus;
  supplierId: string;
  lastRestockedAt: string;
  barcode: string;
  unit: string; // e.g. 'units', 'kg', 'boxes', 'meters'
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount?: number;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location: string;
  capacityUnits: number;
  occupiedUnits: number;
  managerName: string;
  contactEmail: string;
  temperatureControlled: boolean;
}

export interface StockMovement {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  timestamp: string;
  referenceNumber: string;
  reason: string;
  performedBy: string;
}

export interface PurchaseOrderItem {
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitCost: number;
  receivedQuantity: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  totalAmount: number;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  country: string;
  leadTimeDays: number;
  rating: number; // 1.0 to 5.0
  activeProductsCount: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'TRANSFER' | 'STOCK_ADJUST' | 'RECEIVE_PO' | 'EXPORT_DATA';
  entityType: 'Product' | 'Stock' | 'PurchaseOrder' | 'Warehouse' | 'Supplier' | 'Database';
  entityId: string;
  details: string;
  performedBy: string;
}

export interface ProductFilters {
  search: string;
  category: string;
  stockStatus: string;
  warehouseId: string;
  sortBy: 'name' | 'quantity' | 'unitPrice' | 'valuation' | 'updatedAt';
  sortDirection: 'asc' | 'desc';
}

export interface InventoryKPIs {
  totalSkus: number;
  totalUnits: number;
  totalValuation: number;
  totalCostValuation: number;
  potentialProfit: number;
  lowStockCount: number;
  outOfStockCount: number;
  activePurchaseOrders: number;
  incomingUnits: number;
  warehouseUtilizationRate: number;
}

export type ModuleRoute =
  | 'overview'
  | 'products'
  | 'movements'
  | 'warehouses'
  | 'purchase_orders'
  | 'suppliers'
  | 'database';
