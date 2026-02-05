import { Routes } from '@angular/router';

export const RIDER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./riders-list.component').then(m => m.RidersListComponent)
  }
];
