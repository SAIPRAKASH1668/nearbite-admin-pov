import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  /** On desktop: true = icon-only collapsed. On mobile: true = drawer hidden */
  sidebarCollapsed = signal(false);
  /** Mobile-specific: is sidebar drawer open */
  mobileSidebarOpen = signal(false);

  get isMobile(): boolean { return window.innerWidth <= 768; }

  toggleSidebar(): void {
    if (this.isMobile) {
      this.mobileSidebarOpen.update(v => !v);
    } else {
      this.sidebarCollapsed.update(v => !v);
      document.body.classList.toggle('sidebar-collapsed', this.sidebarCollapsed());
    }
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }
}
