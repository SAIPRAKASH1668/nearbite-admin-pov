import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem {
  label: string;
  icon?: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
  badge?: string | number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" fill="var(--color-primary)"/>
            <path d="M16 8L20 12H18V18H14V12H12L16 8Z" fill="white"/>
            <path d="M12 20H20V22H12V20Z" fill="white"/>
          </svg>
          <div class="logo-text">
            <div class="logo-title">NearBite</div>
            <div class="logo-subtitle">Admin Console</div>
          </div>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <div *ngFor="let item of menuItems" class="menu-item-wrapper">
          <a 
            *ngIf="!item.children"
            [routerLink]="item.route"
            routerLinkActive="active"
            class="menu-item"
          >
            <span class="menu-icon" [innerHTML]="item.icon"></span>
            <span class="menu-label">{{ item.label }}</span>
            <span class="menu-badge" *ngIf="item.badge">{{ item.badge }}</span>
          </a>
          
          <div *ngIf="item.children" class="menu-group">
            <div 
              class="menu-item" 
              [class.expanded]="item.expanded"
              (click)="toggleGroup(item)"
            >
              <span class="menu-icon" [innerHTML]="item.icon"></span>
              <span class="menu-label">{{ item.label }}</span>
              <svg class="menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            <div class="submenu" *ngIf="item.expanded">
              <a 
                *ngFor="let child of item.children"
                [routerLink]="child.route"
                routerLinkActive="active"
                class="submenu-item"
              >
                {{ child.label }}
                <span class="menu-badge" *ngIf="child.badge">{{ child.badge }}</span>
              </a>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      height: 100vh;
      background: var(--color-bg-secondary);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 200;
      transition: transform 0.3s;
    }
    
    :host-context(body.sidebar-collapsed) .sidebar {
      transform: translateX(calc(-1 * var(--sidebar-width) + var(--sidebar-collapsed-width)));
    }
    
    .sidebar-header {
      padding: var(--space-lg);
      border-bottom: 1px solid var(--color-border);
      height: var(--header-height);
      display: flex;
      align-items: center;
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: var(--space-md);
    }
    
    .logo-text {
      display: flex;
      flex-direction: column;
    }
    
    .logo-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--color-text-primary);
      line-height: 1;
    }
    
    .logo-subtitle {
      font-size: 10px;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-sm);
    }
    
    .menu-item-wrapper {
      margin-bottom: var(--space-xs);
    }
    
    .menu-item {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: 10px 12px;
      border-radius: 6px;
      color: var(--color-text-secondary);
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      
      &:hover {
        background: var(--color-bg-tertiary);
        color: var(--color-text-primary);
      }
      
      &.active {
        background: rgba(255, 107, 53, 0.1);
        color: var(--color-primary);
        
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          background: var(--color-primary);
          border-radius: 0 3px 3px 0;
        }
      }
    }
    
    .menu-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      :deep(svg) {
        width: 18px;
        height: 18px;
      }
    }
    
    .menu-label {
      flex: 1;
    }
    
    .menu-badge {
      background: var(--color-error);
      color: white;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 18px;
      text-align: center;
    }
    
    .menu-chevron {
      color: var(--color-text-tertiary);
      transition: transform 0.2s;
      flex-shrink: 0;
    }
    
    .menu-group .menu-item.expanded .menu-chevron {
      transform: rotate(180deg);
    }
    
    .submenu {
      margin-left: calc(20px + var(--space-md));
      padding-left: var(--space-md);
      border-left: 1px solid var(--color-border-light);
      margin-top: var(--space-xs);
    }
    
    .submenu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      color: var(--color-text-secondary);
      text-decoration: none;
      font-size: 12px;
      border-radius: 4px;
      transition: all 0.2s;
      margin-bottom: 2px;
      
      &:hover {
        background: var(--color-bg-tertiary);
        color: var(--color-text-primary);
      }
      
      &.active {
        background: rgba(255, 107, 53, 0.08);
        color: var(--color-primary);
      }
    }
  `]
})
export class SidebarComponent {
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
      route: '/dashboard'
    },
    {
      label: 'Orders',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>',
      route: '/orders',
      badge: 342
    },
    {
      label: 'Restaurants',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>',
      children: [
        { label: 'All Restaurants', route: '/restaurants' },
        { label: 'Pending Approval', route: '/restaurants/pending', badge: 8 },
        { label: 'KYC Verification', route: '/restaurants/kyc', badge: 3 },
        { label: 'Performance', route: '/restaurants/performance' }
      ]
    },
    {
      label: 'Customers',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      children: [
        { label: 'All Customers', route: '/customers' },
        { label: 'Support Requests', route: '/customers/support' },
        { label: 'Fraud Alerts', route: '/customers/fraud', badge: 2 }
      ]
    },
    {
      label: 'Delivery Partners',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>',
      children: [
        { label: 'All Riders', route: '/riders' },
        { label: 'Live Tracking', route: '/riders/live' },
        { label: 'Pending Verification', route: '/riders/pending', badge: 5 },
        { label: 'Performance', route: '/riders/performance' }
      ]
    },
    {
      label: 'Financial',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
      children: [
        { label: 'Settlements', route: '/financial/settlements', badge: 12 },
        { label: 'Refunds', route: '/financial/refunds' },
        { label: 'Commissions', route: '/financial/commissions' },
        { label: 'Payouts', route: '/financial/payouts' }
      ]
    },
    {
      label: 'Content',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect><line x1="7" y1="12" x2="17" y2="12"></line><line x1="7" y1="8" x2="17" y2="8"></line><line x1="7" y1="16" x2="13" y2="16"></line></svg>',
      children: [
        { label: 'Banners', route: '/content/banners' },
        { label: 'Campaigns', route: '/content/campaigns' },
        { label: 'Featured Restaurants', route: '/content/featured' }
      ]
    },
    {
      label: 'Support Tickets',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
      route: '/support',
      badge: 47
    },
    {
      label: 'Reports',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
      route: '/reports'
    },
    {
      label: 'Admin Users',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z"></path></svg>',
      route: '/admin-users'
    }
  ];

  toggleGroup(item: MenuItem) {
    item.expanded = !item.expanded;
  }
}
