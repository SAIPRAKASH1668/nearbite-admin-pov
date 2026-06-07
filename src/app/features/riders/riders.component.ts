import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-riders',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, SlicePipe],
  template: `
<div class="page fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">All Riders</div>
      <div class="page-subtitle">Manage delivery partners on the platform</div>
    </div>
    <div class="flex gap-sm">
      <button class="btn btn-primary" (click)="showAdd=true">+ Add Rider</button>
      <button class="btn btn-secondary btn-sm" (click)="load()">↻</button>
    </div>
  </div>

  <!-- Stats -->
  <div class="stats-grid-4" style="margin-bottom:16px">
    <div class="stat-card">
      <div class="stat-label">Total Riders</div>
      <div class="stat-value">{{ riders.length }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Online Now</div>
      <div class="stat-value" style="color:var(--color-success)">{{ onlineCount }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">On Delivery</div>
      <div class="stat-value" style="color:var(--color-warning)">{{ onDeliveryCount }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Offline</div>
      <div class="stat-value" style="color:var(--color-400)">{{ offlineCount }}</div>
    </div>
  </div>

  <!-- Filter -->
  <div class="filter-bar" style="margin-bottom:12px">
    <input class="form-input" [(ngModel)]="search" placeholder="Search name or phone..." />
    <select class="form-select" [(ngModel)]="statusFilter">
      <option value="">All</option>
      <option value="online">Online</option>
      <option value="offline">Offline</option>
      <option value="on-order">On Delivery</option>
    </select>
  </div>

  <div class="card" style="padding:0;overflow:hidden">
    <div *ngIf="loading" style="padding:24px">
      <div class="skeleton" style="height:56px;margin-bottom:8px;border-radius:8px" *ngFor="let i of [1,2,3,4,5,6]"></div>
    </div>

    <!-- Desktop table -->
    <table class="data-table hide-mobile" *ngIf="!loading">
      <thead>
        <tr>
          <th>Rider ID</th>
          <th>Name</th>
          <th>Phone</th>
          <th>Status</th>
          <th>On Order</th>
          <th>Rating</th>
          <th>7d Orders</th>
          <th>Location</th>
          <th>Last Seen</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let r of filteredRiders">
          <td class="font-mono" style="font-size:10px">{{ r.riderId }}</td>
          <td><strong>{{ r.firstName || '' }} {{ r.lastName || '' }}</strong></td>
          <td class="font-mono">{{ r.phone }}</td>
          <td>
            <span *ngIf="r.isActive" class="badge badge-success badge-dot">Online</span>
            <span *ngIf="!r.isActive" class="badge badge-neutral badge-dot">Offline</span>
          </td>
          <td>{{ r.workingOnOrder?.length > 0 ? (r.workingOnOrder | slice:0:1) : '—' }}</td>
          <td>{{ r.rating ? '★ ' + (r.rating | number:'1.1-1') : '—' }}</td>
          <td>{{ r.ordersAssignedLast7d || 0 }}</td>
          <td class="font-mono" style="font-size:10px">
            {{ r.lat ? (r.lat | number:'1.4-4') + ', ' + (r.lng | number:'1.4-4') : '—' }}
          </td>
          <td class="text-secondary" style="font-size:11px">{{ r.lastSeen | slice:11:16 }}</td>
          <td>
            <button class="btn btn-xs" [class]="r.isActive ? 'btn-danger' : 'btn-success'"
              (click)="toggleStatus(r)">{{ r.isActive ? 'Go Offline' : 'Go Online' }}</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Mobile card list -->
    <div class="mobile-list show-mobile" *ngIf="!loading">
      <div class="mobile-card" *ngFor="let r of filteredRiders">
        <div class="mc-header">
          <div>
            <div class="mc-name">{{ r.firstName || '' }} {{ r.lastName || '' }}</div>
            <div class="mc-sub font-mono">{{ r.phone }}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
            <span *ngIf="r.isActive" class="badge badge-success badge-dot">Online</span>
            <span *ngIf="!r.isActive" class="badge badge-neutral badge-dot">Offline</span>
            <span *ngIf="r.workingOnOrder?.length > 0" class="badge badge-warning" style="font-size:10px">On Delivery</span>
          </div>
        </div>
        <div class="mc-row" *ngIf="r.rating">
          <span class="mc-label">Rating</span>
          <span class="mc-val" style="color:var(--color-warning)">★ {{ r.rating | number:'1.1-1' }}</span>
        </div>
        <div class="mc-row">
          <span class="mc-label">7d Orders</span>
          <span class="mc-val">{{ r.ordersAssignedLast7d || 0 }}</span>
        </div>
        <div class="mc-row" *ngIf="r.lastSeen">
          <span class="mc-label">Last Seen</span>
          <span class="mc-val text-secondary">{{ r.lastSeen | slice:11:16 }}</span>
        </div>
        <div class="mc-footer">
          <span class="mc-meta font-mono" style="font-size:10px">{{ r.riderId | slice:0:20 }}</span>
          <button class="btn btn-xs" [class]="r.isActive ? 'btn-danger' : 'btn-success'"
            (click)="toggleStatus(r)">{{ r.isActive ? 'Go Offline' : 'Go Online' }}</button>
        </div>
      </div>
      <div class="empty-state" *ngIf="filteredRiders.length === 0">
        <div class="empty-icon">🔍</div>
        <h4>No riders match filter</h4>
      </div>
    </div>
  </div>

  <!-- Add Rider Modal -->
  <div class="panel-overlay" *ngIf="showAdd" (click)="showAdd=false">
    <div class="panel" (click)="$event.stopPropagation()">
      <div class="panel-header">
        <h3>Add New Rider</h3>
        <button class="btn btn-ghost btn-sm" (click)="showAdd=false">✕</button>
      </div>
      <div class="panel-body">
        <div class="form-group">
          <label>Phone Number *</label>
          <input class="form-input" [(ngModel)]="newRider.phone" placeholder="+91XXXXXXXXXX" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>First Name</label>
            <input class="form-input" [(ngModel)]="newRider.firstName" placeholder="First" />
          </div>
          <div class="form-group">
            <label>Last Name</label>
            <input class="form-input" [(ngModel)]="newRider.lastName" placeholder="Last" />
          </div>
        </div>
      </div>
      <div class="panel-footer">
        <button class="btn btn-secondary" (click)="showAdd=false">Cancel</button>
        <button class="btn btn-primary" (click)="addRider()" [disabled]="adding">{{ adding ? 'Adding...' : 'Add Rider' }}</button>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .page { padding: 24px; }
    @media (max-width: 768px) { .page { padding: 12px; } }
  `]
})
export class RidersComponent implements OnInit {
  riders: any[] = [];
  loading = true;
  search = '';
  statusFilter = '';
  showAdd = false;
  adding = false;
  newRider = { phone: '', firstName: '', lastName: '' };

  get onlineCount(): number { return this.riders.filter(r => r.isActive).length; }
  get offlineCount(): number { return this.riders.filter(r => !r.isActive).length; }
  get onDeliveryCount(): number { return this.riders.filter(r => r.workingOnOrder?.length > 0).length; }

  get filteredRiders(): any[] {
    return this.riders.filter(r => {
      const matchSearch = !this.search ||
        (r.firstName + ' ' + r.lastName + ' ' + r.phone).toLowerCase().includes(this.search.toLowerCase());
      const matchStatus = !this.statusFilter ||
        (this.statusFilter === 'online' && r.isActive) ||
        (this.statusFilter === 'offline' && !r.isActive) ||
        (this.statusFilter === 'on-order' && r.workingOnOrder?.length > 0);
      return matchSearch && matchStatus;
    });
  }

  constructor(private api: ApiService) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.listRiders().subscribe({
      next: (res: any) => { this.riders = res.riders || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  toggleStatus(rider: any): void {
    const newStatus = !rider.isActive;
    this.api.updateRiderStatus(rider.riderId, newStatus).subscribe({
      next: () => { rider.isActive = newStatus; }
    });
  }

  addRider(): void {
    if (!this.newRider.phone) return;
    this.adding = true;
    this.api.createRider(this.newRider).subscribe({
      next: (res: any) => { this.riders.unshift(res); this.showAdd = false; this.adding = false; this.newRider = { phone: '', firstName: '', lastName: '' }; },
      error: () => { this.adding = false; }
    });
  }
}
