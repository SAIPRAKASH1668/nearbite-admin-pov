import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-all-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
<div class="page fade-in">

  <!-- Header -->
  <div class="page-header">
    <div>
      <div class="page-title">All Menus</div>
      <div class="page-subtitle">Browse and manage menu items for any restaurant</div>
    </div>
  </div>

  <!-- Search Bar -->
  <div class="card search-card">
    <div class="search-grid">
      <div class="form-group" style="grid-column:1/-1">
        <label>Search Restaurant</label>
        <div class="resto-search-wrap">
          <input class="form-input" [(ngModel)]="restoSearch" (input)="filterRestos()" placeholder="Type restaurant name..." autocomplete="off" />
          <div class="resto-dropdown" *ngIf="restoSuggestions.length > 0">
            <div class="resto-option" *ngFor="let r of restoSuggestions" (click)="pickResto(r)">
              <strong>{{ r.name }}</strong>
              <span class="resto-id">{{ r.restaurantId }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label>Restaurant ID</label>
        <input class="form-input" [(ngModel)]="restaurantId" placeholder="RES-..." />
      </div>
      <div class="form-group load-btn-group">
        <button class="btn btn-primary btn-load" [disabled]="!restaurantId || loading" (click)="loadMenu()">
          {{ loading ? 'Loading...' : 'Load Menu' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Stats -->
  <div *ngIf="menuItems.length > 0" class="stats-grid" style="margin-bottom:16px">
    <div class="stat-card">
      <div class="stat-label">Total</div>
      <div class="stat-value">{{ menuItems.length }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Available</div>
      <div class="stat-value" style="color:var(--color-success)">{{ availableCount }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Off</div>
      <div class="stat-value" style="color:var(--color-error)">{{ unavailableCount }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Veg</div>
      <div class="stat-value">{{ vegCount }}</div>
    </div>
  </div>

  <!-- Category Tabs -->
  <div *ngIf="categories.length > 0" class="tab-scroll" style="margin-bottom:12px">
    <button class="tab-btn" [class.active]="!selectedCategory" (click)="selectedCategory=''">All</button>
    <button class="tab-btn" *ngFor="let cat of categories" [class.active]="selectedCategory===cat" (click)="selectedCategory=cat">
      {{ cat }}
    </button>
  </div>

  <!-- Filters -->
  <div *ngIf="menuItems.length > 0" class="filter-bar" style="margin-bottom:12px">
    <input class="form-input filter-search" [(ngModel)]="search" placeholder="&#128269; Search items..." />
    <div class="filter-row">
      <select class="form-select" [(ngModel)]="availFilter">
        <option value="">All Status</option>
        <option value="available">Available</option>
        <option value="unavailable">Unavailable</option>
      </select>
      <select class="form-select" [(ngModel)]="vegFilter">
        <option value="">All Types</option>
        <option value="veg">Veg</option>
        <option value="nonveg">Non-Veg</option>
      </select>
    </div>
  </div>

  <!-- Desktop Table (hidden on mobile) -->
  <div *ngIf="!loading && filteredItems.length > 0" class="card hide-mobile" style="padding:0;overflow:hidden">
    <table class="data-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Category</th>
          <th>Price</th>
          <th>Type</th>
          <th>Status</th>
          <th>Description</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let item of filteredItems">
          <td>
            <div style="display:flex;align-items:center;gap:8px">
              <img *ngIf="item.imageUrl" [src]="item.imageUrl" style="width:32px;height:32px;object-fit:cover;border-radius:4px;flex-shrink:0" alt="" />
              <strong>{{ item.name }}</strong>
            </div>
          </td>
          <td>{{ item.category || '—' }}</td>
          <td class="font-mono">{{ item.price | currency:'INR':'symbol':'1.0-0' }}</td>
          <td><span [class]="item.isVeg ? 'badge badge-veg' : 'badge badge-nonveg'">{{ item.isVeg ? '🟢 Veg' : '🔴 Non' }}</span></td>
          <td><span [class]="item.isAvailable !== false ? 'badge badge-success' : 'badge badge-neutral'">{{ item.isAvailable !== false ? 'Available' : 'Off' }}</span></td>
          <td class="text-secondary" style="font-size:11px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ item.description || '—' }}</td>
          <td>
            <div class="flex gap-sm">
              <button class="btn btn-xs btn-ghost" (click)="openEdit(item, $event)">Edit</button>
              <button class="btn btn-xs" [class]="item.isAvailable !== false ? 'btn-danger' : 'btn-success'" (click)="toggleItem(item)">
                {{ item.isAvailable !== false ? 'Disable' : 'Enable' }}
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Mobile Cards (shown on mobile only) -->
  <div *ngIf="!loading && filteredItems.length > 0" class="show-mobile mobile-menu-list">
    <div class="menu-card" *ngFor="let item of filteredItems">
      <div class="menu-card-inner">
        <!-- Image -->
        <div class="menu-img-wrap">
          <img *ngIf="item.imageUrl" [src]="item.imageUrl" class="menu-img" alt="" />
          <div *ngIf="!item.imageUrl" class="menu-img-placeholder">{{ (item.name || '?').charAt(0) }}</div>
          <span class="veg-dot" [style.background]="item.isVeg ? '#22c55e' : '#ef4444'"></span>
        </div>
        <!-- Info -->
        <div class="menu-info">
          <div class="menu-name">{{ item.name }}</div>
          <div class="menu-meta">
            <span class="menu-cat">{{ item.category || 'Uncategorized' }}</span>
            <span [class]="item.isAvailable !== false ? 'menu-status on' : 'menu-status off'">
              {{ item.isAvailable !== false ? 'Available' : 'Off' }}
            </span>
          </div>
          <div class="menu-price">{{ item.price | currency:'INR':'symbol':'1.0-0' }}</div>
          <div class="menu-desc" *ngIf="item.description">{{ item.description }}</div>
        </div>
      </div>
      <!-- Actions -->
      <div class="menu-actions">
        <button class="btn btn-xs btn-ghost" (click)="openEdit(item, $event)">&#9998; Edit</button>
        <button class="btn btn-xs" [class]="item.isAvailable !== false ? 'btn-danger' : 'btn-success'" (click)="toggleItem(item)">
          {{ item.isAvailable !== false ? 'Disable' : 'Enable' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Loading skeleton -->
  <div *ngIf="loading" class="mobile-menu-list">
    <div class="menu-card skeleton-card" *ngFor="let i of [1,2,3,4,5]">
      <div style="display:flex;gap:12px;align-items:center;padding:14px">
        <div class="skeleton" style="width:52px;height:52px;border-radius:10px;flex-shrink:0"></div>
        <div style="flex:1">
          <div class="skeleton" style="height:14px;width:60%;margin-bottom:8px"></div>
          <div class="skeleton" style="height:11px;width:40%"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Empty state -->
  <div *ngIf="!loading && menuItems.length === 0 && restaurantId" class="empty-state">
    <div style="font-size:32px;margin-bottom:8px">🍽️</div>
    <div>No menu items found for this restaurant</div>
  </div>

  <!-- Edit Item Modal -->
  <div class="modal-overlay" *ngIf="editingItem" (click)="closeEdit()">
    <div class="modal-sheet" (click)="$event.stopPropagation()">
      <div class="modal-drag-handle"></div>
      <div class="modal-header">
        <div>
          <div class="modal-title">Edit Item</div>
          <div class="modal-sub">{{ editForm.name }}</div>
        </div>
        <button class="modal-close" (click)="closeEdit()">&#x2715;</button>
      </div>
      <div class="modal-body">
        <div class="edit-grid">
          <div class="form-group full-col">
            <label>Item Name</label>
            <input class="form-input" [(ngModel)]="editForm.name" />
          </div>
          <div class="form-group">
            <label>Price (&#x20B9;)</label>
            <input class="form-input" type="number" [(ngModel)]="editForm.restaurantPrice" />
          </div>
          <div class="form-group">
            <label>Markup %</label>
            <input class="form-input" type="number" [(ngModel)]="editForm.hikePercentage" />
          </div>
          <div class="form-group">
            <label>Category</label>
            <input class="form-input" [(ngModel)]="editForm.category" />
          </div>
          <div class="form-group">
            <label>Sub-Category</label>
            <input class="form-input" [(ngModel)]="editForm.subCategory" />
          </div>
          <div class="form-group">
            <label>Veg?</label>
            <select class="form-select" [(ngModel)]="editForm.isVeg">
              <option [ngValue]="true">🟢 Veg</option>
              <option [ngValue]="false">🔴 Non-Veg</option>
              <option [ngValue]="null">Unknown</option>
            </select>
          </div>
          <div class="form-group">
            <label>Available?</label>
            <select class="form-select" [(ngModel)]="editForm.isAvailable">
              <option [ngValue]="true">Available</option>
              <option [ngValue]="false">Unavailable</option>
            </select>
          </div>
          <div class="form-group full-col">
            <label>Description</label>
            <textarea class="form-input" rows="2" [(ngModel)]="editForm.description"></textarea>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" style="flex:1" (click)="closeEdit()">Cancel</button>
        <button class="btn btn-primary" style="flex:2" (click)="saveItem()" [disabled]="editSaving">{{ editSaving ? 'Saving...' : 'Save Changes' }}</button>
      </div>
    </div>
  </div>

</div>
  `,
  styles: [`
    .page { padding: 12px; }

    /* Search card */
    .search-card { padding: 16px; margin-bottom: 16px; }
    .search-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
    .load-btn-group { display: flex; align-items: flex-end; }
    .btn-load { width: 100%; height: 42px; font-size: 14px; }

    /* Restaurant autocomplete */
    .resto-search-wrap { position: relative; }
    .resto-dropdown { position: absolute; z-index: 200; top: calc(100% + 4px); left: 0; right: 0; background: #1a1a1a; border: 1px solid #333; border-radius: 10px; overflow: hidden; max-height: 220px; overflow-y: auto; box-shadow: 0 8px 24px rgba(0,0,0,.5); }
    .resto-option { display: flex; align-items: center; justify-content: space-between; padding: 11px 14px; cursor: pointer; gap: 8px; border-bottom: 1px solid #222; }
    .resto-option:last-child { border-bottom: none; }
    .resto-option:hover { background: #232323; }
    .resto-option strong { font-size: 13px; color: #fff; }
    .resto-id { font-size: 10px; color: #666; font-family: monospace; white-space: nowrap; }

    /* Stats */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }

    /* Category tabs */
    .tab-scroll { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; white-space: nowrap; }
    .tab-scroll::-webkit-scrollbar { display: none; }

    /* Filter bar */
    .filter-bar { display: flex; flex-direction: column; gap: 8px; }
    .filter-search { width: 100%; }
    .filter-row { display: flex; gap: 8px; }
    .filter-row .form-select { flex: 1; }

    /* Badge overrides */
    .badge-veg { background: rgba(34,197,94,.15); color: #4ade80; border: 1px solid rgba(34,197,94,.3); }
    .badge-nonveg { background: rgba(239,68,68,.15); color: #f87171; border: 1px solid rgba(239,68,68,.3); }

    /* Mobile menu cards */
    .mobile-menu-list { display: flex; flex-direction: column; gap: 8px; }
    .menu-card { background: #161616; border: 1px solid #222; border-radius: 14px; overflow: hidden; }
    .menu-card-inner { display: flex; gap: 12px; padding: 14px 14px 10px; }
    .menu-img-wrap { position: relative; flex-shrink: 0; }
    .menu-img { width: 56px; height: 56px; object-fit: cover; border-radius: 10px; display: block; }
    .menu-img-placeholder { width: 56px; height: 56px; background: #2a2a2a; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: #555; }
    .veg-dot { position: absolute; bottom: -3px; right: -3px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #161616; }
    .menu-info { flex: 1; min-width: 0; }
    .menu-name { font-size: 14px; font-weight: 600; color: #fff; line-height: 1.3; margin-bottom: 4px; }
    .menu-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap; }
    .menu-cat { font-size: 11px; color: #666; background: #1f1f1f; padding: 2px 7px; border-radius: 4px; }
    .menu-status { font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 4px; }
    .menu-status.on { background: rgba(34,197,94,.12); color: #4ade80; }
    .menu-status.off { background: rgba(239,68,68,.12); color: #f87171; }
    .menu-price { font-size: 15px; font-weight: 700; color: #fff; font-family: monospace; margin-bottom: 3px; }
    .menu-desc { font-size: 11px; color: #555; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .menu-actions { display: flex; gap: 8px; padding: 0 14px 12px; }
    .menu-actions .btn { flex: 1; font-size: 12px; height: 34px; }

    /* Skeleton card */
    .skeleton-card { border: 1px solid #1e1e1e; }

    /* Empty state */
    .empty-state { padding: 48px 16px; text-align: center; color: #555; font-size: 14px; }

    /* Edit modal — bottom sheet on mobile */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.8); z-index: 1000; display: flex; align-items: flex-end; justify-content: center; }
    .modal-sheet { background: #181818; border: 1px solid #2a2a2a; border-radius: 20px 20px 0 0; width: 100%; max-height: 92vh; display: flex; flex-direction: column; overflow: hidden; }
    .modal-drag-handle { width: 36px; height: 4px; background: #333; border-radius: 2px; margin: 10px auto 4px; flex-shrink: 0; }
    .modal-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 12px 20px 14px; border-bottom: 1px solid #222; }
    .modal-title { font-size: 16px; font-weight: 700; color: #fff; }
    .modal-sub { font-size: 12px; color: #777; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px; }
    .modal-close { background: none; border: 1px solid #2a2a2a; border-radius: 8px; color: #777; width: 30px; height: 30px; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .modal-close:hover { color: #fff; border-color: #444; }
    .modal-body { padding: 16px 20px; overflow-y: auto; flex: 1; }
    .modal-footer { display: flex; gap: 10px; padding: 14px 20px; border-top: 1px solid #222; padding-bottom: max(14px, env(safe-area-inset-bottom)); }
    .edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .edit-grid .full-col { grid-column: 1 / -1; }

    /* Desktop overrides */
    @media (min-width: 768px) {
      .page { padding: 24px; }
      .search-grid { grid-template-columns: 1fr 1fr auto; }
      .load-btn-group { padding-top: 20px; }
      .btn-load { width: auto; min-width: 120px; }
      .stats-grid { gap: 12px; }
      .filter-bar { flex-direction: row; align-items: center; }
      .filter-search { flex: 2; }
      .filter-row { flex: 1; }
      /* Modal centered on desktop */
      .modal-overlay { align-items: center; }
      .modal-sheet { border-radius: 16px; max-width: 520px; max-height: 90vh; }
      .modal-drag-handle { display: none; }
    }
  `]
})
export class AllMenuComponent implements OnInit {
  restaurantId = '';
  restoSearch = '';
  allRestaurants: any[] = [];
  restoSuggestions: any[] = [];
  menuItems: any[] = [];
  loading = false;
  search = '';
  availFilter = '';
  vegFilter = '';
  selectedCategory = '';
  // Edit modal
  editingItem: any = null;
  editForm: any = {};
  editSaving = false;

  get categories(): string[] {
    return [...new Set(this.menuItems.map(i => i.category).filter(Boolean))];
  }
  get availableCount(): number { return this.menuItems.filter(i => i.isAvailable !== false).length; }
  get unavailableCount(): number { return this.menuItems.filter(i => i.isAvailable === false).length; }
  get vegCount(): number { return this.menuItems.filter(i => i.isVeg).length; }

  get filteredItems(): any[] {
    return this.menuItems.filter(i => {
      const s = this.search.toLowerCase();
      const matchSearch = !s || i.name?.toLowerCase().includes(s);
      const matchAvail = !this.availFilter ||
        (this.availFilter === 'available' && i.isAvailable !== false) ||
        (this.availFilter === 'unavailable' && i.isAvailable === false);
      const matchVeg = !this.vegFilter ||
        (this.vegFilter === 'veg' && i.isVeg) ||
        (this.vegFilter === 'nonveg' && !i.isVeg);
      const matchCat = !this.selectedCategory || i.category === this.selectedCategory;
      return matchSearch && matchAvail && matchVeg && matchCat;
    });
  }

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.loadRestaurants(); }

  loadRestaurants(): void {
    this.api.listRestaurants().subscribe({
      next: (res: any) => { this.allRestaurants = res.restaurants ?? []; },
      error: () => {}
    });
  }

  filterRestos(): void {
    const q = this.restoSearch.trim().toLowerCase();
    if (!q) { this.restoSuggestions = []; return; }
    this.restoSuggestions = this.allRestaurants.filter(r => r.name?.toLowerCase().includes(q)).slice(0, 8);
  }

  pickResto(r: any): void {
    this.restaurantId = r.restaurantId;
    this.restoSearch = r.name;
    this.restoSuggestions = [];
    this.loadMenu();
  }

  loadMenu(): void {
    if (!this.restaurantId) return;
    this.loading = true;
    this.menuItems = [];
    this.api.getMenu(this.restaurantId).subscribe({
      next: (res: any) => { this.menuItems = res.menuItems || res.items || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  toggleItem(item: any): void {
    const newAvail = item.isAvailable === false ? true : false;
    this.api.toggleMenuItemAvailability(this.restaurantId, item.itemId || item.id, newAvail).subscribe({
      next: () => { item.isAvailable = newAvail; }
    });
  }

  openEdit(item: any, e: Event): void {
    e.stopPropagation();
    this.editingItem = item;
    this.editForm = {
      itemId: item.itemId || item.id,
      name: item.name || item.itemName || '',
      restaurantPrice: item.restaurantPrice ?? item.price ?? 0,
      hikePercentage: item.hikePercentage ?? 0,
      category: item.category || '',
      subCategory: item.subCategory || '',
      isVeg: item.isVeg ?? null,
      isAvailable: item.isAvailable !== false,
      description: item.description || '',
    };
    this.editSaving = false;
  }

  closeEdit(): void { this.editingItem = null; }

  saveItem(): void {
    if (!this.editingItem || this.editSaving) return;
    this.editSaving = true;
    const { itemId, ...updates } = this.editForm;
    this.api.updateMenuItem(this.restaurantId, itemId, updates).subscribe({
      next: (res: any) => {
        Object.assign(this.editingItem, {
          name: this.editForm.name,
          itemName: this.editForm.name,
          restaurantPrice: this.editForm.restaurantPrice,
          hikePercentage: this.editForm.hikePercentage,
          category: this.editForm.category,
          subCategory: this.editForm.subCategory,
          isVeg: this.editForm.isVeg,
          isAvailable: this.editForm.isAvailable,
          description: this.editForm.description,
        });
        this.editSaving = false;
        this.closeEdit();
      },
      error: () => { this.editSaving = false; }
    });
  }
}
