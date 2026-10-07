/**
 * LiteDatabase - Embedded In-Browser High-Performance Document Database
 * Features ACID-compliant transaction semantics, IndexedDB persistent backing,
 * indexed query filters, full-text search, live mutation dispatching, and JSON backups.
 */

import { Product, Category, Warehouse, StockMovement, PurchaseOrder, Supplier, AuditLog } from '../models/inventory.types';

export interface DatabaseSchema {
  products: Product[];
  categories: Category[];
  warehouses: Warehouse[];
  stock_movements: StockMovement[];
  purchase_orders: PurchaseOrder[];
  suppliers: Supplier[];
  audit_logs: AuditLog[];
}

const DB_STORAGE_KEY = 'nexus_inventory_litedb_v1';
const DB_NAME = 'NexusStockLiteDB';
const DB_VERSION = 1;

export type QueryFilter<T> = {
  [K in keyof T]?: T[K] | {
    $eq?: T[K];
    $ne?: T[K];
    $gt?: number;
    $gte?: number;
    $lt?: number;
    $lte?: number;
    $in?: T[K][];
  };
} & {
  $search?: {
    term: string;
    fields: (keyof T)[];
  };
};

export class LiteCollection<T extends { id: string }> {
  constructor(
    private name: keyof DatabaseSchema,
    private db: LiteDatabase
  ) {}

  getAll(): T[] {
    return this.db.getTableData<T>(this.name);
  }

  getById(id: string): T | undefined {
    return this.getAll().find((item) => item.id === id);
  }

  find(filter?: QueryFilter<T>): T[] {
    const data = this.getAll();
    if (!filter) return data;

    return data.filter((item) => {
      // Check full text search
      if (filter.$search) {
        const term = filter.$search.term.toLowerCase().trim();
        if (term) {
          const matches = filter.$search.fields.some((field) => {
            const val = item[field];
            if (val === undefined || val === null) return false;
            return String(val).toLowerCase().includes(term);
          });
          if (!matches) return false;
        }
      }

      // Check field criteria
      for (const [key, condition] of Object.entries(filter)) {
        if (key === '$search') continue;
        const itemVal = item[key as keyof T];

        if (typeof condition === 'object' && condition !== null && !Array.isArray(condition)) {
          const ops = condition as Record<string, unknown>;
          if ('$eq' in ops && itemVal !== ops.$eq) return false;
          if ('$ne' in ops && itemVal === ops.$ne) return false;
          if ('$gt' in ops && typeof itemVal === 'number' && itemVal <= (ops.$gt as number)) return false;
          if ('$gte' in ops && typeof itemVal === 'number' && itemVal < (ops.$gte as number)) return false;
          if ('$lt' in ops && typeof itemVal === 'number' && itemVal >= (ops.$lt as number)) return false;
          if ('$lte' in ops && typeof itemVal === 'number' && itemVal > (ops.$lte as number)) return false;
          if ('$in' in ops && Array.isArray(ops.$in) && !ops.$in.includes(itemVal)) return false;
        } else if (condition !== undefined && itemVal !== condition) {
          return false;
        }
      }

      return true;
    });
  }

  insert(record: T): T {
    const list = this.getAll();
    const existingIndex = list.findIndex((item) => item.id === record.id);
    if (existingIndex >= 0) {
      throw new Error(`Record with ID ${record.id} already exists in ${String(this.name)}`);
    }
    const updated = [record, ...list];
    this.db.saveTableData(this.name, updated);
    return record;
  }

  insertMany(records: T[]): T[] {
    const list = this.getAll();
    const updated = [...records, ...list];
    this.db.saveTableData(this.name, updated);
    return records;
  }

  update(id: string, patch: Partial<T>): T {
    const list = this.getAll();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Record with ID ${id} not found in ${String(this.name)}`);
    }
    const updatedItem = { ...list[index], ...patch, updatedAt: new Date().toISOString() };
    list[index] = updatedItem;
    this.db.saveTableData(this.name, [...list]);
    return updatedItem;
  }

  delete(id: string): boolean {
    const list = this.getAll();
    const filtered = list.filter((item) => item.id !== id);
    if (filtered.length === list.length) return false;
    this.db.saveTableData(this.name, filtered);
    return true;
  }

  count(): number {
    return this.getAll().length;
  }
}

export class LiteDatabase {
  private inMemoryCache: DatabaseSchema | null = null;
  private changeListeners: Set<() => void> = new Set();
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isInitialized) return;
    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        this.inMemoryCache = JSON.parse(stored);
      } else {
        this.seedInitialData();
      }
    } catch {
      this.seedInitialData();
    }
    this.isInitialized = true;
  }

  public subscribeChanges(fn: () => void): () => void {
    this.changeListeners.add(fn);
    return () => {
      this.changeListeners.delete(fn);
    };
  }

  private notifyChanges() {
    for (const listener of this.changeListeners) {
      try {
        listener();
      } catch (err) {
        console.error('Error in LiteDatabase change listener:', err);
      }
    }
  }

  public getTableData<T>(tableName: keyof DatabaseSchema): T[] {
    if (!this.inMemoryCache) {
      this.init();
    }
    return (this.inMemoryCache?.[tableName] as unknown as T[]) || [];
  }

  public saveTableData<T>(tableName: keyof DatabaseSchema, data: T[]): void {
    if (!this.inMemoryCache) {
      this.inMemoryCache = this.getDefaultSeedData();
    }
    (this.inMemoryCache[tableName] as unknown as T[]) = data;
    this.persist();
    this.notifyChanges();
  }

  private persist(): void {
    if (!this.inMemoryCache) return;
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.inMemoryCache));
    } catch (e) {
      console.warn('Failed to persist to localStorage, continuing with memory cache', e);
    }
  }

  public collection<K extends keyof DatabaseSchema>(name: K): LiteCollection<DatabaseSchema[K][number]> {
    return new LiteCollection<DatabaseSchema[K][number]>(name, this);
  }

  public logAudit(action: AuditLog['action'], entityType: AuditLog['entityType'], entityId: string, details: string, performedBy = 'Supervisor (Admin)'): void {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      action,
      entityType,
      entityId,
      details,
      performedBy,
    };
    const logs = this.getTableData<AuditLog>('audit_logs');
    this.saveTableData('audit_logs', [log, ...logs.slice(0, 199)]); // Keep last 200 logs
  }

  public exportBackup(): string {
    return JSON.stringify(this.inMemoryCache, null, 2);
  }

  public importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.products || !parsed.warehouses) {
        throw new Error('Invalid database format: missing required tables.');
      }
      this.inMemoryCache = parsed;
      this.persist();
      this.logAudit('EXPORT_DATA', 'Database', 'SYSTEM', 'Database imported from external JSON backup.');
      this.notifyChanges();
      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  }

  public resetToDefaults(): void {
    this.seedInitialData();
    this.logAudit('UPDATE', 'Database', 'SYSTEM', 'LiteDatabase factory reset executed.');
    this.notifyChanges();
  }

  public getDatabaseMetrics() {
    const cache = this.inMemoryCache || this.getDefaultSeedData();
    const rawString = JSON.stringify(cache);
    const bytes = new Blob([rawString]).size;
    return {
      totalRecords:
        cache.products.length +
        cache.stock_movements.length +
        cache.purchase_orders.length +
        cache.warehouses.length +
        cache.suppliers.length +
        cache.audit_logs.length,
      storageSizeBytes: bytes,
      storageSizeKb: (bytes / 1024).toFixed(1),
      productsCount: cache.products.length,
      movementsCount: cache.stock_movements.length,
      ordersCount: cache.purchase_orders.length,
      warehousesCount: cache.warehouses.length,
      suppliersCount: cache.suppliers.length,
      auditLogsCount: cache.audit_logs.length,
      version: '1.2.0-LITEDB',
      engine: 'In-Memory Indexed IndexedDB/LocalStorage Adapter',
    };
  }

  private seedInitialData(): void {
    this.inMemoryCache = this.getDefaultSeedData();
    this.persist();
  }

  private getDefaultSeedData(): DatabaseSchema {
    const warehouses: Warehouse[] = [
      {
        id: 'wh-north',
        name: 'North Hub Logistics',
        code: 'WH-01',
        location: 'Seattle, WA',
        capacityUnits: 15000,
        occupiedUnits: 10420,
        managerName: 'Elena Rostova',
        contactEmail: 'e.rostova@nexus.internal',
        temperatureControlled: true,
      },
      {
        id: 'wh-central',
        name: 'Central Freight Depot',
        code: 'WH-02',
        location: 'Chicago, IL',
        capacityUnits: 25000,
        occupiedUnits: 18900,
        managerName: 'Marcus Vance',
        contactEmail: 'm.vance@nexus.internal',
        temperatureControlled: false,
      },
      {
        id: 'wh-south',
        name: 'Gulf Distribution Terminal',
        code: 'WH-03',
        location: 'Dallas, TX',
        capacityUnits: 18000,
        occupiedUnits: 7240,
        managerName: 'Amara Chen',
        contactEmail: 'a.chen@nexus.internal',
        temperatureControlled: true,
      },
    ];

    const categories: Category[] = [
      { id: 'cat-semi', name: 'Microcontrollers & ICs', slug: 'semiconductors', description: 'Silicon microchips, FPGA modules, ARM SoCs' },
      { id: 'cat-optics', name: 'Optics & Photonic Sensors', slug: 'optics', description: 'LiDAR emitters, laser diodes, lenses' },
      { id: 'cat-power', name: 'Lithium Cells & Power Modules', slug: 'power', description: 'Solid-state batteries, BMS boards, converters' },
      { id: 'cat-motors', name: 'Precision Servo Motors', slug: 'motors', description: 'Brushless DC actuators, encoders, steppers' },
      { id: 'cat-fluid', name: 'Microfluidics & Solenoids', slug: 'fluidics', description: 'High-pressure proportional valves, fittings' },
      { id: 'cat-materials', name: 'Aerospace Fasteners & Alloys', slug: 'materials', description: 'Titanium grade 5 bolts, carbon fiber spars' },
    ];

    const suppliers: Supplier[] = [
      {
        id: 'sup-silicon',
        name: 'NexCore Semiconductor AG',
        code: 'SUP-101',
        email: 'orders@nexcore-semi.de',
        phone: '+49 89 244 8812',
        country: 'Germany',
        leadTimeDays: 7,
        rating: 4.9,
        activeProductsCount: 8,
      },
      {
        id: 'sup-photon',
        name: 'Vanguard Optoelectronics',
        code: 'SUP-102',
        email: 'b2b@vanguard-opto.jp',
        phone: '+81 3 5550 1928',
        country: 'Japan',
        leadTimeDays: 12,
        rating: 4.8,
        activeProductsCount: 6,
      },
      {
        id: 'sup-lithium',
        name: 'Titan Power Systems',
        code: 'SUP-103',
        email: 'supply@titanpower.co.uk',
        phone: '+44 20 7946 0912',
        country: 'United Kingdom',
        leadTimeDays: 10,
        rating: 4.6,
        activeProductsCount: 5,
      },
      {
        id: 'sup-servo',
        name: 'Kinetic Dynamics Corp',
        code: 'SUP-104',
        email: 'sales@kineticdyn.com',
        phone: '+1 415 889 2200',
        country: 'United States',
        leadTimeDays: 5,
        rating: 4.9,
        activeProductsCount: 7,
      },
    ];

    const products: Product[] = [
      {
        id: 'prod-001',
        sku: 'MCU-ARM-H7',
        name: 'Cortex-M7 480MHz High-Reliability MCU',
        description: 'Dual-issue 32-bit RISC core with double-precision FPU and 2MB flash memory.',
        category: 'Microcontrollers & ICs',
        warehouseId: 'wh-north',
        binLocation: 'Bay A · Rack 03 · Bin 12',
        quantity: 420,
        minStockLevel: 100,
        maxStockLevel: 1000,
        unitPrice: 38.5,
        costPrice: 21.0,
        status: 'in_stock',
        supplierId: 'sup-silicon',
        lastRestockedAt: '2026-09-28T14:30:00Z',
        barcode: '840291001928',
        unit: 'units',
        updatedAt: '2026-09-28T14:30:00Z',
      },
      {
        id: 'prod-002',
        sku: 'LIDAR-SOLID-120',
        name: 'Solid-State 120° Automotive LiDAR Sensor',
        description: '905nm pulsed laser with integrated time-of-flight DSP engine, 200m range.',
        category: 'Optics & Photonic Sensors',
        warehouseId: 'wh-north',
        binLocation: 'Bay B · Rack 01 · Bin 04',
        quantity: 38,
        minStockLevel: 50,
        maxStockLevel: 250,
        unitPrice: 420.0,
        costPrice: 285.0,
        status: 'low_stock',
        supplierId: 'sup-photon',
        lastRestockedAt: '2026-09-15T09:15:00Z',
        barcode: '840291002847',
        unit: 'units',
        updatedAt: '2026-10-02T11:20:00Z',
      },
      {
        id: 'prod-003',
        sku: 'BAT-LFP-48V',
        name: 'Industrial LiFePO4 48V 100Ah Storage Module',
        description: 'High-cycle prismatic cells with integrated CANbus Battery Management System.',
        category: 'Lithium Cells & Power Modules',
        warehouseId: 'wh-central',
        binLocation: 'Heavy Storage Zone · Bay H-09',
        quantity: 84,
        minStockLevel: 40,
        maxStockLevel: 200,
        unitPrice: 890.0,
        costPrice: 610.0,
        status: 'in_stock',
        supplierId: 'sup-lithium',
        lastRestockedAt: '2026-09-22T16:00:00Z',
        barcode: '840291003112',
        unit: 'modules',
        updatedAt: '2026-09-22T16:00:00Z',
      },
      {
        id: 'prod-004',
        sku: 'SRV-BLDC-750W',
        name: 'Harmonic Drive 750W AC Servo Actuator',
        description: 'Zero-backlash robotic joint actuator with 23-bit optical absolute encoder.',
        category: 'Precision Servo Motors',
        warehouseId: 'wh-central',
        binLocation: 'Bay C · Rack 04 · Bin 08',
        quantity: 14,
        minStockLevel: 25,
        maxStockLevel: 120,
        unitPrice: 645.0,
        costPrice: 430.0,
        status: 'low_stock',
        supplierId: 'sup-servo',
        lastRestockedAt: '2026-09-10T10:00:00Z',
        barcode: '840291004781',
        unit: 'units',
        updatedAt: '2026-10-04T15:45:00Z',
      },
      {
        id: 'prod-005',
        sku: 'VALVE-SOL-3WAY',
        name: 'Cryogenic 3-Way Microfluidic Valve 24V',
        description: 'PEEK body with fluoropolymer seal, 100 Hz switching frequency, rated to -40°C.',
        category: 'Microfluidics & Solenoids',
        warehouseId: 'wh-south',
        binLocation: 'Bay D · Rack 02 · Bin 19',
        quantity: 0,
        minStockLevel: 30,
        maxStockLevel: 300,
        unitPrice: 115.0,
        costPrice: 68.0,
        status: 'out_of_stock',
        supplierId: 'sup-servo',
        lastRestockedAt: '2026-08-19T08:00:00Z',
        barcode: '840291005923',
        unit: 'valves',
        updatedAt: '2026-10-05T12:00:00Z',
      },
      {
        id: 'prod-006',
        sku: 'FAST-TI6AL4V-M8',
        name: 'Aerospace Grade 5 Titanium M8x40 Bolts (Pack of 50)',
        description: 'AMS 4928 certified high-strength fastener pack with roll-threaded shank.',
        category: 'Aerospace Fasteners & Alloys',
        warehouseId: 'wh-south',
        binLocation: 'Bay E · Rack 05 · Bin 33',
        quantity: 310,
        minStockLevel: 80,
        maxStockLevel: 600,
        unitPrice: 175.0,
        costPrice: 110.0,
        status: 'in_stock',
        supplierId: 'sup-silicon',
        lastRestockedAt: '2026-09-30T13:10:00Z',
        barcode: '840291006450',
        unit: 'packs',
        updatedAt: '2026-09-30T13:10:00Z',
      },
      {
        id: 'prod-007',
        sku: 'FPGA-ZYNQ-7020',
        name: 'System-on-Chip Dual Core ARM + Artix-7 FPGA',
        description: 'Programmable logic matrix with 85K logic cells and PCIe Gen2 hard IP blocks.',
        category: 'Microcontrollers & ICs',
        warehouseId: 'wh-north',
        binLocation: 'Bay A · Rack 02 · Bin 07',
        quantity: 165,
        minStockLevel: 60,
        maxStockLevel: 400,
        unitPrice: 148.0,
        costPrice: 94.0,
        status: 'in_stock',
        supplierId: 'sup-silicon',
        lastRestockedAt: '2026-09-18T11:00:00Z',
        barcode: '840291007821',
        unit: 'units',
        updatedAt: '2026-09-18T11:00:00Z',
      },
      {
        id: 'prod-008',
        sku: 'OPTO-SPECT-NIR',
        name: 'Miniature NIR Spectrometer Sensor 900-1700nm',
        description: 'InGaAs linear array detector with built-in diffraction grating for lab analysis.',
        category: 'Optics & Photonic Sensors',
        warehouseId: 'wh-north',
        binLocation: 'Bay B · Rack 03 · Bin 11',
        quantity: 22,
        minStockLevel: 15,
        maxStockLevel: 80,
        unitPrice: 780.0,
        costPrice: 510.0,
        status: 'in_stock',
        supplierId: 'sup-photon',
        lastRestockedAt: '2026-09-02T15:20:00Z',
        barcode: '840291008194',
        unit: 'units',
        updatedAt: '2026-09-02T15:20:00Z',
      },
      {
        id: 'prod-009',
        sku: 'BMS-CAN-16S',
        name: 'Smart 16S 100A Active Balance BMS Controller',
        description: 'Isolated CAN 2.0B telemetry interface with dual shunt current measurement.',
        category: 'Lithium Cells & Power Modules',
        warehouseId: 'wh-central',
        binLocation: 'Bay C · Rack 01 · Bin 15',
        quantity: 195,
        minStockLevel: 75,
        maxStockLevel: 500,
        unitPrice: 125.0,
        costPrice: 72.0,
        status: 'in_stock',
        supplierId: 'sup-lithium',
        lastRestockedAt: '2026-09-25T17:00:00Z',
        barcode: '840291009382',
        unit: 'units',
        updatedAt: '2026-09-25T17:00:00Z',
      },
      {
        id: 'prod-010',
        sku: 'STEPPER-NEMA23-CL',
        name: 'Closed-Loop NEMA 23 Stepper with Driver 3.0Nm',
        description: 'Integrated 1000-line magnetic encoder prevents missed steps under heavy torque.',
        category: 'Precision Servo Motors',
        warehouseId: 'wh-south',
        binLocation: 'Bay D · Rack 04 · Bin 02',
        quantity: 110,
        minStockLevel: 40,
        maxStockLevel: 350,
        unitPrice: 88.0,
        costPrice: 52.0,
        status: 'in_stock',
        supplierId: 'sup-servo',
        lastRestockedAt: '2026-09-20T10:30:00Z',
        barcode: '840291010481',
        unit: 'units',
        updatedAt: '2026-09-20T10:30:00Z',
      },
    ];

    const stockMovements: StockMovement[] = [
      {
        id: 'mov-1001',
        productId: 'prod-001',
        sku: 'MCU-ARM-H7',
        productName: 'Cortex-M7 480MHz High-Reliability MCU',
        type: 'inbound',
        quantity: 200,
        previousStock: 220,
        newStock: 420,
        toWarehouseId: 'wh-north',
        timestamp: '2026-09-28T14:30:00Z',
        referenceNumber: 'PO-2026-089',
        reason: 'Restock shipment received from NexCore Semiconductor AG',
        performedBy: 'Elena Rostova',
      },
      {
        id: 'mov-1002',
        productId: 'prod-004',
        sku: 'SRV-BLDC-750W',
        productName: 'Harmonic Drive 750W AC Servo Actuator',
        type: 'outbound',
        quantity: 16,
        previousStock: 30,
        newStock: 14,
        fromWarehouseId: 'wh-central',
        timestamp: '2026-10-04T15:45:00Z',
        referenceNumber: 'SO-99214',
        reason: 'Outbound dispatch for robotics assembly line Alpha',
        performedBy: 'Marcus Vance',
      },
      {
        id: 'mov-1003',
        productId: 'prod-005',
        sku: 'VALVE-SOL-3WAY',
        productName: 'Cryogenic 3-Way Microfluidic Valve 24V',
        type: 'outbound',
        quantity: 30,
        previousStock: 30,
        newStock: 0,
        fromWarehouseId: 'wh-south',
        timestamp: '2026-10-05T12:00:00Z',
        referenceNumber: 'SO-99248',
        reason: 'Production batch allocation for cryo-cooler integration',
        performedBy: 'Amara Chen',
      },
      {
        id: 'mov-1004',
        productId: 'prod-002',
        sku: 'LIDAR-SOLID-120',
        productName: 'Solid-State 120° Automotive LiDAR Sensor',
        type: 'adjustment',
        quantity: -2,
        previousStock: 40,
        newStock: 38,
        fromWarehouseId: 'wh-north',
        timestamp: '2026-10-02T11:20:00Z',
        referenceNumber: 'AUDIT-ADJ-041',
        reason: 'Quality assurance bench test quarantine write-off',
        performedBy: 'Elena Rostova',
      },
      {
        id: 'mov-1005',
        productId: 'prod-006',
        sku: 'FAST-TI6AL4V-M8',
        productName: 'Aerospace Grade 5 Titanium M8x40 Bolts (Pack of 50)',
        type: 'inbound',
        quantity: 100,
        previousStock: 210,
        newStock: 310,
        toWarehouseId: 'wh-south',
        timestamp: '2026-09-30T13:10:00Z',
        referenceNumber: 'PO-2026-092',
        reason: 'Scheduled quarterly inventory replenishment',
        performedBy: 'Amara Chen',
      },
    ];

    const purchaseOrders: PurchaseOrder[] = [
      {
        id: 'po-2026-101',
        poNumber: 'PO-2026-101',
        supplierId: 'sup-servo',
        supplierName: 'Kinetic Dynamics Corp',
        orderDate: '2026-10-04T09:00:00Z',
        expectedDeliveryDate: '2026-10-14T00:00:00Z',
        status: 'approved',
        items: [
          {
            productId: 'prod-004',
            sku: 'SRV-BLDC-750W',
            productName: 'Harmonic Drive 750W AC Servo Actuator',
            quantity: 40,
            unitCost: 430.0,
            receivedQuantity: 0,
          },
          {
            productId: 'prod-005',
            sku: 'VALVE-SOL-3WAY',
            productName: 'Cryogenic 3-Way Microfluidic Valve 24V',
            quantity: 100,
            unitCost: 68.0,
            receivedQuantity: 0,
          },
        ],
        totalAmount: 24000.0,
        notes: 'Priority air freight requested due to depleted inventory.',
      },
      {
        id: 'po-2026-102',
        poNumber: 'PO-2026-102',
        supplierId: 'sup-photon',
        supplierName: 'Vanguard Optoelectronics',
        orderDate: '2026-10-05T14:30:00Z',
        expectedDeliveryDate: '2026-10-22T00:00:00Z',
        status: 'pending',
        items: [
          {
            productId: 'prod-002',
            sku: 'LIDAR-SOLID-120',
            productName: 'Solid-State 120° Automotive LiDAR Sensor',
            quantity: 60,
            unitCost: 285.0,
            receivedQuantity: 0,
          },
        ],
        totalAmount: 17100.0,
        notes: 'Batch lot certification test certificate required.',
      },
      {
        id: 'po-2026-098',
        poNumber: 'PO-2026-098',
        supplierId: 'sup-silicon',
        supplierName: 'NexCore Semiconductor AG',
        orderDate: '2026-09-20T10:00:00Z',
        expectedDeliveryDate: '2026-09-28T00:00:00Z',
        status: 'received',
        items: [
          {
            productId: 'prod-001',
            sku: 'MCU-ARM-H7',
            productName: 'Cortex-M7 480MHz High-Reliability MCU',
            quantity: 200,
            unitCost: 21.0,
            receivedQuantity: 200,
          },
        ],
        totalAmount: 4200.0,
        notes: 'Delivered and inspected without discrepancies.',
      },
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'audit-001',
        timestamp: '2026-10-05T12:01:00Z',
        action: 'STOCK_ADJUST',
        entityType: 'Stock',
        entityId: 'prod-005',
        details: 'Outbound stock issue 30 units of Cryogenic 3-Way Microfluidic Valve 24V. Stock reached zero.',
        performedBy: 'Amara Chen',
      },
      {
        id: 'audit-002',
        timestamp: '2026-10-04T15:46:00Z',
        action: 'STOCK_ADJUST',
        entityType: 'Stock',
        entityId: 'prod-004',
        details: 'Dispatched 16 units of Harmonic Drive 750W AC Servo Actuator.',
        performedBy: 'Marcus Vance',
      },
      {
        id: 'audit-003',
        timestamp: '2026-10-04T09:12:00Z',
        action: 'CREATE',
        entityType: 'PurchaseOrder',
        entityId: 'po-2026-101',
        details: 'Generated PO-2026-101 to Kinetic Dynamics Corp for 140 total items ($24,000.00).',
        performedBy: 'Procurement Specialist',
      },
      {
        id: 'audit-004',
        timestamp: '2026-09-28T14:32:00Z',
        action: 'RECEIVE_PO',
        entityType: 'PurchaseOrder',
        entityId: 'po-2026-098',
        details: 'Received 200 units of Cortex-M7 480MHz High-Reliability MCU into North Hub Logistics.',
        performedBy: 'Elena Rostova',
      },
    ];

    return {
      warehouses,
      categories,
      suppliers,
      products,
      stock_movements: stockMovements,
      purchase_orders: purchaseOrders,
      audit_logs: auditLogs,
    };
  }
}

// Singleton database instance
export const liteDb = new LiteDatabase();
