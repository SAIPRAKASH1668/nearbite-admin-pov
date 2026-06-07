import { Component, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { LayoutService } from '../../../core/services/layout.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @HostBinding('class.collapsed') get collapsed() { return this.layout.sidebarCollapsed(); }
  @HostBinding('class.mobile-open') get mobileOpen() { return this.layout.mobileSidebarOpen(); }

  constructor(public apiSvc: ApiService, public layout: LayoutService) {}

  setEnv(env: 'prod' | 'dev'): void { this.apiSvc.setEnv(env); }

  toggle(): void { this.layout.toggleSidebar(); }
}
