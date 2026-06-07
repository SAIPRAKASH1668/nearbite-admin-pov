import { Routes } from '@angular/router';

export const RIDER_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'approvals',
    pathMatch: 'full'
  },
  {
    path: 'approvals',
    loadComponent: () => import('./riders-approvals-list.component').then(m => m.RidersApprovalsListComponent)
  },
  {
    path: 'approvals/:phone',
    loadComponent: () => import('./rider-approval-detail.component').then(m => m.RiderApprovalDetailComponent)
  },
  {
    path: 'list',
    loadComponent: () => import('./riders-list.component').then(m => m.RidersListComponent)
  }
];
