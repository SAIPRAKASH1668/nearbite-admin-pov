import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-restaurant-manage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Manage Restaurants</div>
      <div class="page-subtitle">View, update, and control all onboarded restaurants</div>
    </div>
    <button class="btn btn-secondary btn-sm" (click)="load()">↻ Refresh</button>
  </div>

  <!-- Create Form -->
  <div *ngIf="showCreate" class="card" style="margin-bottom:16px">
    <div class="card-header">Create New Restaurant</div>
    <div class="card-body">
      <div class="form-grid">
        <div class="form-group">
          <label>Name *</label>
          <input class="form-input" [(ngModel)]="createForm.name" placeholder="Restaurant name" />
        </div>
        <div class="form-group">
          <label>Lat *</label>
          <input class="form-input" type="number" step="any" [(ngModel)]="createForm.latitude" placeholder="15.5" />
        </div>
        <div class="form-group">
          <label>Lng *</label>
          <input class="form-input" type="number" step="any" [(ngModel)]="createForm.longitude" placeholder="78.4" />
        </div>
        <div class="form-group">
          <label>Location Name *</label>
          <input class="form-input" [(ngModel)]="createForm.locationId" placeholder="NANDYAL" style="text-transform:uppercase" />
        </div>
        <div class="form-group">
          <label>Owner ID</label>
          <input class="form-input" [(ngModel)]="createForm.ownerId" placeholder="USR-..." />
        </div>
        <div class="form-group">
          <label>Cuisine <span style="color:var(--color-400);font-size:11px">(comma-separated)</span></label>
          <input class="form-input" [(ngModel)]="createCuisineText" placeholder="South Indian, Biryani" />
        </div>
        <div class="form-group">
          <label>Username <span style="color:var(--color-400);font-size:11px">(auto-generated if blank)</span></label>
          <input class="form-input" [(ngModel)]="createForm.username" placeholder="restaurant@yumdude.com" />
        </div>
        <div class="form-group">
          <label>Password <span style="color:var(--color-400);font-size:11px">(auto-generated if blank)</span></label>
          <input class="form-input" [(ngModel)]="createForm.password" placeholder="8-char auto password" />
        </div>
      </div>
      <div *ngIf="createResult" class="create-result">{{ createResult }}</div>
      <div class="form-actions" style="margin-top:16px">
        <button class="btn btn-secondary" (click)="showCreate=false">Cancel</button>
        <button class="btn btn-primary" (click)="doCreate()" [disabled]="creating">{{ creating ? 'Creating...' : 'Create Restaurant' }}</button>
      </div>
    </div>
  </div>

  <!-- Stats Row -->
  <div class="stats-grid-4" style="margin-bottom:16px">
    <div class="stat-card">
      <div class="stat-label">Total Restaurants</div>
      <div class="stat-value">{{ restaurants.length }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Open Now</div>
      <div class="stat-value" style="color:var(--color-success)">{{ openCount }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Closed</div>
      <div class="stat-value" style="color:var(--color-400)">{{ closedCount }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Pure Veg</div>
      <div class="stat-value">{{ vegCount }}</div>
    </div>
  </div>

  <!-- Filter -->
  <div class="filter-bar" style="margin-bottom:12px">
    <input class="form-input" [(ngModel)]="search" placeholder="Search name or phone..." />
    <select class="form-select" [(ngModel)]="statusFilter">
      <option value="">All</option>
      <option value="open">Open</option>
      <option value="closed">Closed</option>
    </select>
  </div>

  <!-- List -->
  <div *ngIf="loading" class="card" style="padding:16px">
    <div class="skeleton" style="height:56px;margin-bottom:8px;border-radius:8px" *ngFor="let i of [1,2,3,4]"></div>
  </div>

  <div *ngIf="!loading && !selected" class="card" style="padding:0;overflow:hidden">
    <!-- Desktop table -->
    <table class="data-table hide-mobile">
      <thead>
        <tr>
          <th>Restaurant ID</th>
          <th>Name</th>
          <th>Phone</th>
          <th>City</th>
          <th>Status</th>
          <th>Veg</th>
          <th>Commission</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let r of filteredRestaurants">
          <td class="font-mono" style="font-size:10px">{{ r.restaurantId }}</td>
          <td><strong>{{ r.name }}</strong></td>
          <td class="font-mono">{{ r.phone }}</td>
          <td>{{ r.address?.city || '—' }}</td>
          <td>
            <span [class]="r.isOpen ? 'badge badge-success' : 'badge badge-neutral'">{{ r.isOpen ? 'Open' : 'Closed' }}</span>
          </td>
          <td>{{ r.isPureVeg ? '🌿 Veg' : 'Non-Veg' }}</td>
          <td class="font-mono">{{ r.commissionPct || 15 }}%</td>
          <td>
            <div class="flex gap-sm">
              <button class="btn btn-ghost btn-xs" (click)="select(r)">Edit</button>
              <button class="btn btn-xs" [class]="r.isOpen ? 'btn-danger' : 'btn-success'" (click)="toggleOpen(r)">
                {{ r.isOpen ? 'Close' : 'Open' }}
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Mobile card list -->
    <div class="mobile-list show-mobile">
      <div class="mobile-card" *ngFor="let r of filteredRestaurants">
        <div class="mc-header">
          <div>
            <div class="mc-name">{{ r.name }}</div>
            <div class="mc-sub font-mono">{{ r.phone }}</div>
          </div>
          <span [class]="r.isOpen ? 'badge badge-success' : 'badge badge-neutral'">{{ r.isOpen ? 'Open' : 'Closed' }}</span>
        </div>
        <div class="mc-row">
          <span class="mc-label">City</span>
          <span class="mc-val">{{ r.address?.city || '—' }}</span>
        </div>
        <div class="mc-row">
          <span class="mc-label">Commission</span>
          <span class="mc-val font-mono">{{ r.commissionPct || 15 }}%</span>
        </div>
        <div class="mc-row">
          <span class="mc-label">Type</span>
          <span class="mc-val">{{ r.isPureVeg ? '🌿 Pure Veg' : 'Non-Veg' }}</span>
        </div>
        <div class="mc-footer">
          <button class="btn btn-ghost btn-xs" (click)="select(r)">Edit Details</button>
          <button class="btn btn-xs" [class]="r.isOpen ? 'btn-danger' : 'btn-success'" (click)="toggleOpen(r)">
            {{ r.isOpen ? 'Close Restaurant' : 'Open Restaurant' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit Panel -->
  <div *ngIf="selected" class="card">
    <div class="card-header" style="display:flex;justify-content:space-between">
      <span>Editing: {{ selected.name }}</span>
      <button class="btn btn-ghost btn-sm" (click)="selected=null">← Back</button>
    </div>
    <div class="card-body">
      <div class="form-grid">
        <div class="form-group">
          <label>Name</label>
          <input class="form-input" [(ngModel)]="selected.name" />
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input class="form-input" [(ngModel)]="selected.phone" />
        </div>
        <div class="form-group">
          <label>Commission (%)</label>
          <input class="form-input" type="number" [(ngModel)]="selected.commissionPct" />
        </div>
        <div class="form-group">
          <label>Avg Prep Time (min)</label>
          <input class="form-input" type="number" [(ngModel)]="selected.avgPrepTime" />
        </div>
        <div class="form-group">
          <label>Min Order Value (₹)</label>
          <input class="form-input" type="number" [(ngModel)]="selected.minOrderValue" />
        </div>
        <div class="form-group">
          <label>Delivery Radius (km)</label>
          <input class="form-input" type="number" [(ngModel)]="selected.deliveryRadiusKm" />
        </div>
        <div class="form-group">
          <label>Opening Time</label>
          <input class="form-input" type="time" [(ngModel)]="selected.openingTime" />
        </div>
        <div class="form-group">
          <label>Closing Time</label>
          <input class="form-input" type="time" [(ngModel)]="selected.closingTime" />
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label>Description</label>
          <textarea class="form-input" rows="2" [(ngModel)]="selected.description"></textarea>
        </div>
      </div>
      <div class="form-actions" style="margin-top:16px">
        <button class="btn btn-secondary" (click)="selected=null">Cancel</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : 'Save Changes' }}</button>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .page { padding: 24px; }
    .card-header { font-weight:600; font-size:13px; padding:12px 14px; border-bottom:1px solid var(--color-border); }
    .card-body { padding:16px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
    .form-actions { display:flex; gap:10px; justify-content:flex-end; }
    .create-result { margin:12px 0 0; padding:10px 14px; background:rgba(34,197,94,.1); color:#4ade80; border-radius:8px; font-size:12px; word-break:break-all; }
    @media (max-width:900px) { .form-grid { grid-template-columns:1fr 1fr; } }
    @media (max-width:600px) {
      .page { padding: 12px; }
      .form-grid { grid-template-columns: 1fr; }
      .form-actions { flex-direction: column; }
    }
  `]
})
export class RestaurantManageComponent implements OnInit {
  restaurants: any[] = [];
  loading = true;
  search = '';
  statusFilter = '';
  selected: any = null;
  saving = false;
  showCreate = false;
  creating = false;
  createResult = '';
  createCuisineText = '';
  createForm = this.blankCreate();

  blankCreate() {
    return { name: '', latitude: null as any, longitude: null as any, locationId: '', ownerId: '', username: '', password: '' };
  }

  get openCount(): number { return this.restaurants.filter(r => r.isOpen).length; }
  get closedCount(): number { return this.restaurants.filter(r => !r.isOpen).length; }
  get vegCount(): number { return this.restaurants.filter(r => r.isPureVeg).length; }

  get filteredRestaurants(): any[] {
    return this.restaurants.filter(r => {
      const s = this.search.toLowerCase();
      const matchSearch = !s || (r.name + ' ' + r.phone).toLowerCase().includes(s);
      const matchStatus = !this.statusFilter ||
        (this.statusFilter === 'open' && r.isOpen) ||
        (this.statusFilter === 'closed' && !r.isOpen);
      return matchSearch && matchStatus;
    });
  }

  constructor(private api: ApiService) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.listRestaurants().subscribe({
      next: (res: any) => { this.restaurants = res.restaurants || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  doCreate(): void {
    if (!this.createForm.name || this.createForm.latitude == null || this.createForm.longitude == null || !this.createForm.locationId) return;
    this.creating = true;
    this.createResult = '';
    const payload = {
      ...this.createForm,
      locationId: this.createForm.locationId.toUpperCase(),
      latitude: +this.createForm.latitude,
      longitude: +this.createForm.longitude,
      cuisine: this.createCuisineText ? this.createCuisineText.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
    };
    this.api.createRestaurant(payload).subscribe({
      next: (res: any) => {
        this.restaurants.unshift(res);
        this.createResult = `&#10003; Created! ID: ${res.restaurantId}`;
        this.creating = false;
        this.createForm = this.blankCreate();
        this.createCuisineText = '';
      },
      error: (err: any) => {
        this.createResult = '&#10007; Failed to create restaurant';
        this.creating = false;
      }
    });
  }

  select(r: any): void { this.selected = { ...r }; }

  save(): void {
    this.saving = true;
    this.api.updateRestaurant(this.selected.restaurantId, this.selected).subscribe({
      next: () => {
        const idx = this.restaurants.findIndex(r => r.restaurantId === this.selected.restaurantId);
        if (idx !== -1) this.restaurants[idx] = { ...this.selected };
        this.selected = null;
        this.saving = false;
      },
      error: () => { this.saving = false; }
    });
  }

  toggleOpen(r: any): void {
    this.api.toggleRestaurantOpen(r.restaurantId, !r.isOpen).subscribe({
      next: () => { r.isOpen = !r.isOpen; }
    });
  }
}
