import { Routes } from '@angular/router';

export const CONTENT_ROUTES: Routes = [
  {
    path: 'banners',
    loadComponent: () => import('./banners.component').then(m => m.BannersComponent)
  }
];
