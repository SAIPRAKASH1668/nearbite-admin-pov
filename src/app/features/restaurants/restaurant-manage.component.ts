import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { RestaurantDetailFormComponent } from './restaurant-detail-form.component';
import { RestaurantMenuManagerComponent } from './restaurant-menu-manager.component';

/**
 * Restaurant Updates hub: list + create + per-restaurant detail with
 * Details | Menu tabs (full CRUD). Restaurant deletion is intentionally
 * "deactivate only" (status toggle) — there is no backend hard-delete.
 */
@Component({
  selector: 'app-restaurant-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, RestaurantDetailFormComponent, RestaurantMenuManagerComponent],
  template: `
<div class="page fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Restaurant Updates</div>
      <div class="page-subtitle">Manage restaurants and their menus end-to-end</div>
    </div>
    <div class="flex gap-sm" *ngIf="!selected">
      <button class="btn btn-secondary btn-sm" (click)="load()">↻ Refresh</button>
      <button class="btn btn-primary btn-sm" (click)="showCreate = !showCreate">{{ showCreate ? 'Close' : '＋ New' }}</button>
    </div>
  </div>

  <!-- Create form -->
  <div *ngIf="showCreate && !selected" class="card" style="margin-bottom:16px">
    <div class="card-header">Create new restaurant</div>
    <div class="card-body">
      <div class="form-grid">
        <div class="form-group"><label>Name *</label><input class="form-input" [(ngModel)]="createForm.name" /></div>
        <div class="form-group"><label>Lat *</label><input class="form-input" type="number" step="any" [(ngModel)]="createForm.latitude" /></div>
        <div class="form-group"><label>Lng *</label><input class="form-input" type="number" step="any" [(ngModel)]="createForm.longitude" /></div>
        <div class="form-group"><label>Location name *</label><input class="form-input" [(ngModel)]="createForm.locationId" placeholder="NANDYAL" style="text-transform:uppercase" /></div>
        <div class="form-group"><label>Owner ID</label><input class="form-input" [(ngModel)]="createForm.ownerId" placeholder="USR-..." /></div>
        <div class="form-group"><label>Cuisine <span class="muted">(comma-separated)</span></label><input class="form-input" [(ngModel)]="createCuisineText" placeholder="South Indian, Biryani" /></div>
        <div class="form-group"><label>Username <span class="muted">(auto if blank)</span></label><input class="form-input" [(ngModel)]="createForm.username" /></div>
        <div class="form-group"><label>Password <span class="muted">(auto if blank)</span></label><input class="form-input" [(ngModel)]="createForm.password" /></div>
      </div>
      <div *ngIf="createResult" class="create-result">{{ createResult }}</div>
      <div class="form-actions" style="margin-top:16px">
        <button class="btn btn-secondary" (click)="showCreate=false">Cancel</button>
        <button class="btn btn-primary" (click)="doCreate()" [disabled]="creating">{{ creating ? 'Creating...' : 'Create restaurant' }}</button>
      </div>
    </div>
  </div>

  <!-- Stats -->
  <div *ngIf="!selected" class="stats-grid-4" style="margin-bottom:16px">
    <div class="stat-card"><div class="stat-label">Total</div><div class="stat-value">{{ restaurants.length }}</div></div>
    <div class="stat-card"><div class="stat-label">Open</div><div class="stat-value" style="color:var(--color-success)">{{ openCount }}</div></div>
    <div class="stat-card"><div class="stat-label">Closed</div><div class="stat-value" style="color:var(--color-400)">{{ closedCount }}</div></div>
    <div class="stat-card"><div class="stat-label">Theater</div><div class="stat-value">{{ theaterCount }}</div></div>
  </div>

  <!-- Filter -->
  <div *ngIf="!selected" class="filter-bar" style="margin-bottom:12px">
    <input class="form-input" [(ngModel)]="search" placeholder="Search name or ID..." />
    <select class="form-select" [(ngModel)]="statusFilter">
      <option value="">All</option>
      <option value="open">Open</option>
      <option value="closed">Closed</option>
    </select>
  </div>

  <!-- Loading -->
  <div *ngIf="loading && !selected" class="card" style="padding:16px">
    <div class="skeleton" style="height:56px;margin-bottom:8px;border-radius:8px" *ngFor="let i of [1,2,3,4]"></div>
  </div>

  <!-- List -->
  <div *ngIf="!loading && !selected" class="card" style="padding:0;overflow:hidden">
    <table class="data-table hide-mobile">
      <thead>
        <tr><th>Name</th><th>Restaurant ID</th><th>Cuisine</th><th>Status</th><th>Actions</th></tr>
      </thead>
      <tbody>
        <tr *ngFor="let r of filteredRestaurants">
          <td><strong>{{ r.name }}</strong></td>
          <td class="font-mono" style="font-size:10px">{{ r.restaurantId }}</td>
          <td>{{ cuisineText(r) || '—' }}</td>
          <td><span [class]="r.isOpen ? 'badge badge-success' : 'badge badge-neutral'">{{ r.isOpen ? 'Open' : 'Closed' }}</span></td>
          <td>
            <div class="flex gap-sm">
              <button class="btn btn-ghost btn-xs" (click)="select(r)">Manage</button>
              <button class="btn btn-xs" [class]="r.isOpen ? 'btn-danger' : 'btn-success'" (click)="toggleOpen(r)">{{ r.isOpen ? 'Deactivate' : 'Activate' }}</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="mobile-list show-mobile">
      <div class="mobile-card" *ngFor="let r of filteredRestaurants">
        <div class="mc-header">
          <div>
            <div class="mc-name">{{ r.name }}</div>
            <div class="mc-sub font-mono">{{ r.restaurantId }}</div>
          </div>
          <span [class]="r.isOpen ? 'badge badge-success' : 'badge badge-neutral'">{{ r.isOpen ? 'Open' : 'Closed' }}</span>
        </div>
        <div class="mc-row"><span class="mc-label">Cuisine</span><span class="mc-val">{{ cuisineText(r) || '—' }}</span></div>
        <div class="mc-footer">
          <button class="btn btn-ghost btn-xs" (click)="select(r)">Manage</button>
          <button class="btn btn-xs" [class]="r.isOpen ? 'btn-danger' : 'btn-success'" (click)="toggleOpen(r)">{{ r.isOpen ? 'Deactivate' : 'Activate' }}</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Detail (tabs) -->
  <div *ngIf="selected" class="card detail-shell">
    <div class="detail-head">
      <div>
        <div class="detail-name">{{ selected.name }}</div>
        <div class="detail-id font-mono">{{ selected.restaurantId }}</div>
      </div>
      <div class="flex gap-sm">
        <button class="btn btn-xs" [class]="selected.isOpen ? 'btn-danger' : 'btn-success'" (click)="toggleOpen(selected)">{{ selected.isOpen ? 'Deactivate' : 'Activate' }}</button>
        <button class="btn btn-ghost btn-sm" (click)="selected=null">← Back</button>
      </div>
    </div>
    <div class="tabs">
      <button class="tab" [class.active]="tab==='details'" (click)="tab='details'">Details</button>
      <button class="tab" [class.active]="tab==='menu'" (click)="tab='menu'">Menu</button>
    </div>
    <div class="tab-body">
      <app-restaurant-detail-form *ngIf="tab==='details'" [restaurant]="selected" (saved)="onSaved($event)"></app-restaurant-detail-form>
      <app-restaurant-menu-manager *ngIf="tab==='menu'" [restaurantId]="selected.restaurantId" [restaurantName]="selected.name"></app-restaurant-menu-manager>
    </div>
  </div>
</div>
  `,
  styles: [`
    .page { padding:24px; }
    .card-header { font-weight:600; font-size:13px; padding:12px 14px; border-bottom:1px solid var(--color-border); }
    .card-body { padding:16px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
    .form-actions { display:flex; gap:10px; justify-content:flex-end; }
    .muted { color:#777; font-size:11px; }
    .create-result { margin:12px 0 0; padding:10px 14px; background:rgba(34,197,94,.1); color:#4ade80; border-radius:8px; font-size:12px; word-break:break-all; }
    .detail-shell { padding:0; overflow:hidden; }
    .detail-head { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid var(--color-border); }
    .detail-name { font-size:15px; font-weight:700; }
    .detail-id { font-size:10px; color:#777; }
    .tabs { display:flex; gap:4px; padding:8px 12px 0; border-bottom:1px solid var(--color-border); }
    .tab { background:none; border:none; border-bottom:2px solid transparent; color:#888; padding:8px 14px; cursor:pointer; font-size:13px; }
    .tab.active { color:#fff; border-bottom-color:#fff; }
    .tab-body { padding:16px; }
    @media (max-width:900px) { .form-grid { grid-template-columns:1fr 1fr; } }
    @media (max-width:600px) { .page { padding:12px; } .form-grid { grid-template-columns:1fr; } .form-actions { flex-direction:column; } .tab-body { padding:12px; } }
  `]
})
export class RestaurantManageComponent implements OnInit {
  restaurants: any[] = [];
  loading = true;
  search = '';
  statusFilter = '';
  selected: any = null;
  tab: 'details' | 'menu' = 'details';

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
  get theaterCount(): number { return this.restaurants.filter(r => r.theaterMode === 'AVAILABLE').length; }

  cuisineText(r: any): string { return Array.isArray(r.cuisine) ? r.cuisine.join(', ') : (r.cuisine || ''); }

  get filteredRestaurants(): any[] {
    const s = this.search.toLowerCase();
    return this.restaurants.filter(r => {
      const matchSearch = !s || `${r.name} ${r.restaurantId} ${this.cuisineText(r)}`.toLowerCase().includes(s);
      const matchStatus = !this.statusFilter
        || (this.statusFilter === 'open' && r.isOpen)
        || (this.statusFilter === 'closed' && !r.isOpen);
      return matchSearch && matchStatus;
    });
  }

  constructor(private api: ApiService) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.listRestaurants().subscribe({
      next: (res: any) => { this.restaurants = res.restaurants || []; this.loading = false; },
      error: () => { this.loading = false; },
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
        this.createResult = `✓ Created! ID: ${res.restaurantId}`;
        this.creating = false;
        this.createForm = this.blankCreate();
        this.createCuisineText = '';
      },
      error: () => { this.createResult = '✗ Failed to create restaurant'; this.creating = false; },
    });
  }

  select(r: any): void { this.selected = { ...r }; this.tab = 'details'; }

  onSaved(updated: any): void {
    if (!updated) return;
    const id = this.selected.restaurantId;
    const idx = this.restaurants.findIndex(r => r.restaurantId === id);
    if (idx !== -1) this.restaurants[idx] = { ...this.restaurants[idx], ...updated };
    this.selected = { ...this.selected, ...updated };
  }

  toggleOpen(r: any): void {
    const id = r.restaurantId;
    const next = !r.isOpen;
    this.api.toggleRestaurantOpen(id, next).subscribe({
      next: () => {
        r.isOpen = next;
        const row = this.restaurants.find(x => x.restaurantId === id);
        if (row) row.isOpen = next;
        if (this.selected && this.selected.restaurantId === id) this.selected.isOpen = next;
      },
    });
  }
}
