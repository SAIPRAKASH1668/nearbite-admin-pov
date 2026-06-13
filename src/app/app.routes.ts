import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },

      // Orders
      { path: 'orders', loadComponent: () => import('./features/orders/orders.component').then(m => m.OrdersComponent) },
      { path: 'orders/live', loadComponent: () => import('./features/orders/orders-live.component').then(m => m.OrdersLiveComponent) },
      { path: 'orders/cod', loadComponent: () => import('./features/orders/orders-cod.component').then(m => m.OrdersCodComponent) },
      { path: 'orders/:id', loadComponent: () => import('./features/orders/order-detail.component').then(m => m.OrderDetailComponent) },

      // Riders
      { path: 'riders', loadComponent: () => import('./features/riders/riders.component').then(m => m.RidersComponent) },
      { path: 'riders/status', loadComponent: () => import('./features/riders/rider-status.component').then(m => m.RiderStatusComponent) },
      { path: 'riders/earnings', loadComponent: () => import('./features/riders/rider-earnings.component').then(m => m.RiderEarningsComponent) },
      { path: 'riders/slots', loadComponent: () => import('./features/riders/rider-slots.component').then(m => m.RiderSlotsComponent) },

      // Restaurants
      { path: 'restaurant-earnings', loadComponent: () => import('./features/restaurants/restaurant-earnings.component').then(m => m.RestaurantEarningsComponent) },
      { path: 'restaurants/create', loadComponent: () => import('./features/restaurants/restaurant-create.component').then(m => m.RestaurantCreateComponent) },
      { path: 'restaurants/manage', loadComponent: () => import('./features/restaurants/restaurant-manage.component').then(m => m.RestaurantManageComponent) },
      { path: 'menu', loadComponent: () => import('./features/restaurants/all-menu.component').then(m => m.AllMenuComponent) },

      // Customer
      { path: 'customer-config', loadComponent: () => import('./features/customers/customer-config.component').then(m => m.CustomerConfigComponent) },

      // Platform
      { path: 'coupons', loadComponent: () => import('./features/platform/coupons.component').then(m => m.CouponsComponent) },
      { path: 'notifications', loadComponent: () => import('./features/platform/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'hero-banner', loadComponent: () => import('./features/platform/hero-banner.component').then(m => m.HeroBannerComponent) },
      { path: 'food-categories', loadComponent: () => import('./features/platform/food-categories.component').then(m => m.FoodCategoriesComponent) },
      { path: 'config', loadComponent: () => import('./features/platform/config.component').then(m => m.ConfigComponent) },
      { path: 'revenue', loadComponent: () => import('./features/platform/revenue-reports.component').then(m => m.RevenueReportsComponent) },
      { path: 'gst-export', loadComponent: () => import('./features/platform/gst-invoice-export.component').then(m => m.GstInvoiceExportComponent) },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
