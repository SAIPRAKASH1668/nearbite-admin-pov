import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services';
import { LayoutService } from '../../../core/services/layout.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AdminUser } from '../../../core/models';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="topbar">
      <div class="topbar-left">
        <button class="menu-toggle" (click)="toggleSidebar()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        
        <div class="platform-status">
          <div class="status-dot" [class.online]="systemStatus.online"></div>
          <span class="status-text">System {{ systemStatus.online ? 'Online' : 'Offline' }}</span>
          <span class="status-metric">{{ systemStatus.activeOrders }} active orders</span>
        </div>
      </div>
      
      <div class="topbar-right">
        <div class="search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input type="text" placeholder="Search orders, restaurants, users..." />
        </div>
        
        <button class="icon-btn" title="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span class="badge" *ngIf="notificationCount > 0">{{ notificationCount }}</span>
        </button>

        <button class="theme-toggle" type="button" (click)="theme.toggle()" [title]="theme.mode() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
          <span class="theme-track">
            <span class="theme-thumb"></span>
          </span>
          <span class="theme-label">{{ theme.mode() === 'dark' ? 'Dark' : 'Light' }}</span>
        </button>
        
        <div class="user-menu" (click)="toggleUserMenu()">
          <div class="user-avatar">
            {{ currentUser?.firstName?.[0] }}{{ currentUser?.lastName?.[0] }}
          </div>
          <div class="user-info">
            <div class="user-name">{{ currentUser?.firstName }} {{ currentUser?.lastName }}</div>
            <div class="user-role">{{ formatRole(currentUser?.role) }}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        
        <div class="user-dropdown" *ngIf="showUserMenu">
          <a routerLink="/profile" class="dropdown-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Profile
          </a>
          <a routerLink="/settings" class="dropdown-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6"></path>
            </svg>
            Settings
          </a>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" (click)="logout()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      height: calc(var(--header-height) + var(--safe-top, 0px));
      padding-top: var(--safe-top, 0px);
      background: var(--color-bg-secondary);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-left: var(--space-lg);
      padding-right: var(--space-lg);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .topbar-left,
    .topbar-right {
      display: flex;
      align-items: center;
      gap: var(--space-lg);
    }
    
    .menu-toggle {
      background: none;
      border: none;
      color: var(--color-text-secondary);
      cursor: pointer;
      padding: var(--space-sm);
      border-radius: 4px;
      display: flex;
      align-items: center;
      
      &:hover {
        background: var(--color-bg-tertiary);
        color: var(--color-text-primary);
      }
    }
    
    .platform-status {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: 4px 12px;
      background: var(--color-bg-tertiary);
      border-radius: 4px;
      font-size: 12px;
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-error);
      
      &.online {
        background: var(--color-success);
        animation: pulse 2s infinite;
      }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .status-text {
      color: var(--color-text-primary);
      font-weight: 500;
    }
    
    .status-metric {
      color: var(--color-text-secondary);
      border-left: 1px solid var(--color-border);
      padding-left: var(--space-sm);
      margin-left: var(--space-xs);
      @media (max-width: 768px) { display: none; }
    }
    
    .search-bar {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      padding: 6px 12px;
      width: 400px;

      @media (max-width: 768px) {
        display: none;
      }
      
      svg {
        color: var(--color-text-secondary);
        flex-shrink: 0;
      }
      
      input {
        border: none;
        background: none;
        color: var(--color-text-primary);
        font-size: 13px;
        width: 100%;
        outline: none;
        
        &::placeholder {
          color: var(--color-text-tertiary);
        }
      }
    }
    
    .icon-btn {
      position: relative;
      background: none;
      border: none;
      color: var(--color-text-secondary);
      cursor: pointer;
      padding: var(--space-sm);
      border-radius: 4px;
      display: flex;
      align-items: center;
      
      &:hover {
        background: var(--color-bg-tertiary);
        color: var(--color-text-primary);
      }
      
      .badge {
        position: absolute;
        top: 4px;
        right: 4px;
        background: var(--color-error);
        color: var(--color-text-inverse);
        font-size: 10px;
        font-weight: 600;
        padding: 2px 5px;
        border-radius: 10px;
        min-width: 18px;
        text-align: center;
      }
    }

    .theme-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1px solid var(--color-border);
      border-radius: 999px;
      padding: 4px 9px 4px 5px;
      background: var(--color-bg-tertiary);
      color: var(--color-text-primary);
      cursor: pointer;
      font: inherit;
      font-size: 12px;
      font-weight: 700;

      &:hover {
        border-color: var(--color-border-strong);
        background: var(--color-bg-hover);
      }
    }

    .theme-track {
      display: flex;
      align-items: center;
      width: 34px;
      height: 20px;
      border-radius: 999px;
      padding: 2px;
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
    }

    .theme-thumb {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--color-success);
      box-shadow: var(--shadow-sm);
      transform: translateX(14px);
      transition: transform var(--transition-normal), background var(--transition-normal);
    }

    :host-context(body.theme-light) .theme-thumb {
      transform: translateX(0);
      background: var(--color-primary);
    }

    .theme-label {
      @media (max-width: 900px) {
        display: none;
      }
    }
    
    .user-menu {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      cursor: pointer;
      padding: 4px 8px 4px 4px;
      border-radius: 4px;
      position: relative;
      
      &:hover {
        background: var(--color-bg-tertiary);
      }
    }
    
    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-primary);
      color: var(--color-text-inverse);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }
    
    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      @media (max-width: 768px) { display: none; }
    }
    
    .user-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-primary);
    }
    
    .user-role {
      font-size: 11px;
      color: var(--color-text-secondary);
    }
    
    .user-dropdown {
      position: absolute;
      top: calc(var(--header-height) - 4px);
      right: var(--space-lg);
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      border-radius: 6px;
      box-shadow: var(--shadow-lg);
      min-width: 200px;
      padding: var(--space-sm);
      z-index: 1000;
    }
    
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-sm) var(--space-md);
      border-radius: 4px;
      font-size: 13px;
      color: var(--color-text-primary);
      text-decoration: none;
      border: none;
      background: none;
      width: 100%;
      cursor: pointer;
      text-align: left;
      
      &:hover {
        background: var(--color-bg-tertiary);
      }
      
      svg {
        color: var(--color-text-secondary);
      }
    }
    
    .dropdown-divider {
      height: 1px;
      background: var(--color-border);
      margin: var(--space-sm) 0;
    }
  `]
})
export class TopbarComponent implements OnInit {
  currentUser: AdminUser | null = null;
  showUserMenu = false;
  notificationCount = 12;
  systemStatus = {
    online: true,
    activeOrders: 342
  };

  constructor(
    private authService: AuthService,
    private layoutSvc: LayoutService,
    public theme: ThemeService,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleSidebar() {
    this.layoutSvc.toggleSidebar();
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  formatRole(role?: string): string {
    if (!role) return '';
    return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  logout() {
    this.authService.logout();
    window.location.href = '/login';
  }
}
