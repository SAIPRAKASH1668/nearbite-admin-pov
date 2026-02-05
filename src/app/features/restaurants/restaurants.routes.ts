import { Routes } from '@angular/router';

export const RESTAURANT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./restaurants-list.component').then(m => m.RestaurantsListComponent)
  },
  {
    path: 'pending',
    loadComponent: () => import('./restaurants-pending.component').then(m => m.RestaurantsPendingComponent)
  },
  {
    path: 'kyc',
    loadComponent: () => import('./restaurants-kyc.component').then(m => m.RestaurantsKycComponent)
  },
  {
    path: 'performance',
    loadComponent: () => import('./restaurants-performance.component').then(m => m.RestaurantsPerformanceComponent)
  }
];
