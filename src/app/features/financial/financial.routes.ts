import { Routes } from '@angular/router';

export const FINANCIAL_ROUTES: Routes = [
  {
    path: 'settlements',
    loadComponent: () => import('./settlements.component').then(m => m.SettlementsComponent)
  }
];
