import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full'
  },
  {
    path: 'overview',
    loadComponent: () => import('./features/overview/overview.component').then(m => m.OverviewComponent)
  },
  {
    path: 'products',
    loadComponent: () => import('./features/products/products.component').then(m => m.ProductsComponent)
  },
  {
    path: 'movements',
    loadComponent: () => import('./features/movements/movements.component').then(m => m.MovementsComponent)
  },
  {
    path: 'warehouses',
    loadComponent: () => import('./features/warehouses/warehouses.component').then(m => m.WarehousesComponent)
  },
  {
    path: 'purchase-orders',
    loadComponent: () => import('./features/purchase-orders/purchase-orders.component').then(m => m.PurchaseOrdersComponent)
  },
  {
    path: 'suppliers',
    loadComponent: () => import('./features/suppliers/suppliers.component').then(m => m.SuppliersComponent)
  },
  {
    path: 'database',
    loadComponent: () => import('./features/database/database-console.component').then(m => m.DatabaseConsoleComponent)
  },
  {
    path: '**',
    redirectTo: 'overview'
  }
];
