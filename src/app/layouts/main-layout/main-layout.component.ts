import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TopbarComponent, SidebarComponent],
  template: `
    <div class="main-layout">
      <div class="sidebar-backdrop" [class.visible]="layout.mobileSidebarOpen()" (click)="layout.closeMobileSidebar()"></div>
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <app-topbar></app-topbar>
        <main class="content-area">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .main-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin-left: var(--sidebar-width);
      transition: margin-left 0.25s ease;
      min-width: 0;
    }

    :host-context(body.sidebar-collapsed) .main-content {
      margin-left: var(--sidebar-collapsed-width);
    }

    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-xl);
      background: var(--color-bg-primary);
    }

    .sidebar-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.55);
      z-index: 150;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s;
      &.visible {
        opacity: 1;
        pointer-events: auto;
      }
    }

    @media (max-width: 768px) {
      .main-content {
        margin-left: 0 !important;
      }
      .content-area {
        padding: var(--space-md);
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
      .sidebar-backdrop {
        display: block;
      }
    }
  `]
})
export class MainLayoutComponent {
  constructor(public layout: LayoutService) {}
}
