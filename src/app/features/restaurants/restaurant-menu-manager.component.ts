import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { ImageUploaderComponent } from '../../shared/components/image-uploader/image-uploader.component';

/**
 * Full menu CRUD for one restaurant: list + create + edit (all fields) + delete +
 * availability toggle + bulk ops (price-hike, category shift-timings).
 * Reusable: drop in with [restaurantId] (and optional [restaurantName]).
 */
@Component({
  selector: 'app-restaurant-menu-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, ImageUploaderComponent],
  template: `
<div class="mm">
  <!-- Toolbar -->
  <div class="mm-toolbar">
    <div class="mm-stats" *ngIf="menuItems.length">
      <span class="chip">Total {{ menuItems.length }}</span>
      <span class="chip ok">On {{ availableCount }}</span>
      <span class="chip off">Off {{ unavailableCount }}</span>
      <span class="chip">Veg {{ vegCount }}</span>
    </div>
    <div class="mm-actions">
      <button class="btn btn-ghost btn-sm" (click)="loadMenu()" [disabled]="!restaurantId">↻</button>
      <button class="btn btn-secondary btn-sm" (click)="openBulkHike()" [disabled]="!menuItems.length" title="Raise base prices (restaurantPrice) by a %">Price hike</button>
      <button class="btn btn-secondary btn-sm" (click)="openBulkHikeAdjust()" [disabled]="!menuItems.length" title="Increase / decrease the markup (hike %) on all items">Adjust hike %</button>
      <button class="btn btn-secondary btn-sm" (click)="openBulkShifts()" [disabled]="!menuItems.length">Category shifts</button>
      <button class="btn btn-primary btn-sm" (click)="openCreate()" [disabled]="!restaurantId">＋ Add item</button>
    </div>
  </div>

  <div *ngIf="notice" class="notice">{{ notice }} <button class="notice-x" (click)="notice=''">✕</button></div>

  <!-- Category tabs -->
  <div *ngIf="categories.length" class="tab-scroll">
    <button class="tab-btn" [class.active]="!selectedCategory" (click)="selectedCategory=''">All</button>
    <button class="tab-btn" *ngFor="let cat of categories" [class.active]="selectedCategory===cat" (click)="selectedCategory=cat">{{ cat }}</button>
  </div>

  <!-- Filters -->
  <div *ngIf="menuItems.length" class="filter-bar">
    <input class="form-input filter-search" [(ngModel)]="search" placeholder="Search items..." />
    <select class="form-select" [(ngModel)]="availFilter">
      <option value="">All status</option>
      <option value="available">Available</option>
      <option value="unavailable">Unavailable</option>
    </select>
    <select class="form-select" [(ngModel)]="vegFilter">
      <option value="">All types</option>
      <option value="veg">Veg</option>
      <option value="nonveg">Non-Veg</option>
    </select>
  </div>

  <!-- Loading -->
  <div *ngIf="loading" class="card" style="padding:16px">
    <div class="skeleton" style="height:48px;margin-bottom:8px;border-radius:8px" *ngFor="let i of [1,2,3,4]"></div>
  </div>

  <!-- Desktop table -->
  <div *ngIf="!loading && filteredItems.length" class="card hide-mobile" style="padding:0;overflow:hidden">
    <table class="data-table">
      <thead>
        <tr><th>Item</th><th>Category</th><th>Cost</th><th>Hike</th><th>Price</th><th>Type</th><th>Status</th><th>Actions</th></tr>
      </thead>
      <tbody>
        <tr *ngFor="let item of filteredItems">
          <td>
            <div style="display:flex;align-items:center;gap:8px">
              <img *ngIf="thumb(item)" [src]="thumb(item)" style="width:32px;height:32px;object-fit:cover;border-radius:4px" alt="" />
              <strong>{{ name(item) }}</strong>
            </div>
          </td>
          <td>{{ item.category || '—' }}</td>
          <td class="font-mono">{{ item.restaurantPrice | currency:'INR':'symbol':'1.0-0' }}</td>
          <td class="font-mono">{{ (item.hikePercentage || 0) }}%</td>
          <td class="font-mono">{{ item.price | currency:'INR':'symbol':'1.0-0' }}</td>
          <td><span [class]="item.isVeg ? 'badge badge-success' : 'badge badge-neutral'">{{ item.isVeg ? 'Veg' : (item.isVeg === false ? 'Non' : '—') }}</span></td>
          <td><span [class]="item.isAvailable !== false ? 'badge badge-success' : 'badge badge-neutral'">{{ item.isAvailable !== false ? 'On' : 'Off' }}</span></td>
          <td>
            <div class="flex gap-sm">
              <button class="btn btn-xs btn-ghost" (click)="openEdit(item)">Edit</button>
              <button class="btn btn-xs" [class]="item.isAvailable !== false ? 'btn-secondary' : 'btn-success'" (click)="toggleItem(item)">{{ item.isAvailable !== false ? 'Disable' : 'Enable' }}</button>
              <button class="btn btn-xs btn-danger" (click)="deleteItem(item)">Delete</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Mobile cards -->
  <div *ngIf="!loading && filteredItems.length" class="show-mobile mm-cards">
    <div class="mm-card" *ngFor="let item of filteredItems">
      <div class="mm-card-top">
        <img *ngIf="thumb(item)" [src]="thumb(item)" class="mm-thumb" alt="" />
        <div *ngIf="!thumb(item)" class="mm-thumb ph">{{ (name(item) || '?').charAt(0) }}</div>
        <div style="flex:1;min-width:0">
          <div class="mm-name">{{ name(item) }}</div>
          <div class="mm-sub">{{ item.category || 'Uncategorized' }} · {{ item.price | currency:'INR':'symbol':'1.0-0' }}</div>
        </div>
        <span [class]="item.isAvailable !== false ? 'badge badge-success' : 'badge badge-neutral'">{{ item.isAvailable !== false ? 'On' : 'Off' }}</span>
      </div>
      <div class="mm-card-actions">
        <button class="btn btn-xs btn-ghost" (click)="openEdit(item)">Edit</button>
        <button class="btn btn-xs" [class]="item.isAvailable !== false ? 'btn-secondary' : 'btn-success'" (click)="toggleItem(item)">{{ item.isAvailable !== false ? 'Disable' : 'Enable' }}</button>
        <button class="btn btn-xs btn-danger" (click)="deleteItem(item)">Delete</button>
      </div>
    </div>
  </div>

  <!-- Empty -->
  <div *ngIf="!loading && restaurantId && !menuItems.length" class="empty">🍽️ No menu items yet. Use “Add item” to create one.</div>
  <div *ngIf="!restaurantId" class="empty">Select a restaurant to manage its menu.</div>

  <!-- Item form modal -->
  <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
    <div class="modal-sheet" (click)="$event.stopPropagation()">
      <div class="modal-drag-handle"></div>
      <div class="modal-header">
        <div>
          <div class="modal-title">{{ editMode ? 'Edit item' : 'Add item' }}</div>
          <div class="modal-sub">{{ restaurantName || restaurantId }}</div>
        </div>
        <button class="modal-close" (click)="closeForm()">&#x2715;</button>
      </div>
      <div class="modal-body">
        <div class="edit-grid">
          <div class="form-group full-col">
            <label>Item name *</label>
            <input class="form-input" [(ngModel)]="form.name" />
          </div>
          <div class="form-group">
            <label>Cost price (₹) *</label>
            <input class="form-input" type="number" step="any" [(ngModel)]="form.restaurantPrice" />
          </div>
          <div class="form-group">
            <label>Hike %</label>
            <input class="form-input" type="number" step="any" [(ngModel)]="form.hikePercentage" />
          </div>
          <div class="form-group">
            <label>Customer price</label>
            <input class="form-input" [value]="computedPrice" disabled />
          </div>
          <div class="form-group">
            <label>Category</label>
            <input class="form-input" list="mm-cats" [(ngModel)]="form.category" />
            <datalist id="mm-cats"><option *ngFor="let c of categories" [value]="c"></option></datalist>
          </div>
          <div class="form-group">
            <label>Sub-category</label>
            <input class="form-input" [(ngModel)]="form.subCategory" />
          </div>
          <div class="form-group">
            <label>Veg?</label>
            <select class="form-select" [(ngModel)]="form.isVeg">
              <option [ngValue]="true">Veg</option>
              <option [ngValue]="false">Non-Veg</option>
              <option [ngValue]="null">Unknown</option>
            </select>
          </div>
          <div class="form-group">
            <label>Available?</label>
            <select class="form-select" [(ngModel)]="form.isAvailable">
              <option [ngValue]="true">Available</option>
              <option [ngValue]="false">Unavailable</option>
            </select>
          </div>
          <div class="form-group full-col">
            <label>Description</label>
            <textarea class="form-input" rows="2" [(ngModel)]="form.description"></textarea>
          </div>

          <!-- Images -->
          <div class="form-group full-col">
            <app-image-uploader entity="ITEM" [restaurantId]="restaurantId" [itemId]="form.itemId"
              [urls]="form.image" (urlsChange)="form.image = $event" label="Item photos"></app-image-uploader>
          </div>

          <!-- Add-ons -->
          <div class="form-group full-col">
            <label>Add-on options</label>
            <div class="rows">
              <div class="row-line" *ngFor="let a of form.addOnOptions; let i = index">
                <input class="form-input" placeholder="Name" [(ngModel)]="a.name" />
                <input class="form-input" type="number" step="any" placeholder="Extra ₹" [(ngModel)]="a.extraPrice" style="max-width:110px" />
                <button class="btn btn-xs btn-ghost" (click)="form.addOnOptions.splice(i,1)">✕</button>
              </div>
            </div>
            <button class="btn btn-xs btn-secondary" (click)="form.addOnOptions.push({ name:'', extraPrice:0 })">＋ Add option</button>
          </div>

          <!-- Shift timings -->
          <div class="form-group full-col">
            <label>Shift timings (availability windows)</label>
            <div class="rows">
              <div class="row-line" *ngFor="let s of form.shiftTimings; let i = index">
                <input class="form-input" placeholder="Label (e.g. Lunch)" [(ngModel)]="s.label" />
                <input class="form-input" type="time" [(ngModel)]="s.start" style="max-width:130px" />
                <input class="form-input" type="time" [(ngModel)]="s.end" style="max-width:130px" />
                <button class="btn btn-xs btn-ghost" (click)="form.shiftTimings.splice(i,1)">✕</button>
              </div>
            </div>
            <button class="btn btn-xs btn-secondary" (click)="form.shiftTimings.push({ label:'', start:'', end:'' })">＋ Add shift</button>
          </div>

          <!-- Theater -->
          <div class="form-group">
            <label>Theater mode?</label>
            <select class="form-select" [(ngModel)]="form.theaterMode">
              <option [ngValue]="false">No</option>
              <option [ngValue]="true">Yes (in-venue)</option>
            </select>
          </div>
          <div class="form-group" *ngIf="form.theaterMode">
            <label>Inventory count</label>
            <input class="form-input" type="number" [(ngModel)]="form.inventoryCount" />
          </div>
          <div class="form-group">
            <label>Top offer banner</label>
            <input class="form-input" maxlength="20" [(ngModel)]="form.topOfferBanner" />
          </div>
          <div class="form-group">
            <label>Item coupon code</label>
            <input class="form-input" [(ngModel)]="form.itemOfferCouponCode" />
          </div>
        </div>
        <div *ngIf="error" class="dz-error">{{ error }}</div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" style="flex:1" (click)="closeForm()">Cancel</button>
        <button class="btn btn-primary" style="flex:2" (click)="save()" [disabled]="saving || !canSave">{{ saving ? 'Saving...' : (editMode ? 'Save changes' : 'Create item') }}</button>
      </div>
    </div>
  </div>

  <!-- Bulk price-hike modal -->
  <div class="modal-overlay" *ngIf="showBulkHike" (click)="showBulkHike=false">
    <div class="modal-sheet small" (click)="$event.stopPropagation()">
      <div class="modal-header"><div class="modal-title">Bulk price hike</div><button class="modal-close" (click)="showBulkHike=false">&#x2715;</button></div>
      <div class="modal-body">
        <p class="muted" style="font-size:12px">Raises every item's customer price by this percentage.</p>
        <div class="form-group"><label>Percentage (%)</label><input class="form-input" type="number" step="any" [(ngModel)]="bulkHikePct" /></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" style="flex:1" (click)="showBulkHike=false">Cancel</button>
        <button class="btn btn-primary" style="flex:2" (click)="applyBulkHike()" [disabled]="bulkSaving || !((bulkHikePct || 0) > 0)">{{ bulkSaving ? 'Applying...' : 'Apply' }}</button>
      </div>
    </div>
  </div>

  <!-- Bulk hike-% adjust modal -->
  <div class="modal-overlay" *ngIf="showBulkHikeAdjust" (click)="showBulkHikeAdjust=false">
    <div class="modal-sheet small" (click)="$event.stopPropagation()">
      <div class="modal-header"><div class="modal-title">Adjust hike %</div><button class="modal-close" (click)="showBulkHikeAdjust=false">&#x2715;</button></div>
      <div class="modal-body">
        <p class="muted" style="font-size:12px">Changes the markup (hike %) on every item. Customer price is recomputed as cost × (1 + hike%). Hike % can't go below 0.</p>
        <div class="form-group">
          <label>Operation</label>
          <select class="form-select" [(ngModel)]="hikeAdjustMode">
            <option value="increase">Increase by</option>
            <option value="decrease">Decrease by</option>
            <option value="set">Set all to</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ hikeAdjustMode === 'set' ? 'Hike %' : 'Percentage points' }}</label>
          <input class="form-input" type="number" step="any" min="0" [(ngModel)]="hikeAdjustValue" />
        </div>
        <p class="muted" style="font-size:11px">Applies to all {{ menuItems.length }} items.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" style="flex:1" (click)="showBulkHikeAdjust=false">Cancel</button>
        <button class="btn btn-primary" style="flex:2" (click)="applyBulkHikeAdjust()" [disabled]="bulkSaving || !canApplyHikeAdjust">{{ bulkSaving ? 'Applying...' : 'Apply' }}</button>
      </div>
    </div>
  </div>

  <!-- Bulk category-shifts modal -->
  <div class="modal-overlay" *ngIf="showBulkShifts" (click)="showBulkShifts=false">
    <div class="modal-sheet" (click)="$event.stopPropagation()">
      <div class="modal-header"><div class="modal-title">Category shift timings</div><button class="modal-close" (click)="showBulkShifts=false">&#x2715;</button></div>
      <div class="modal-body">
        <div class="form-group">
          <label>Category</label>
          <select class="form-select" [(ngModel)]="bulkShiftCategory">
            <option value="">Select category</option>
            <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
          </select>
        </div>
        <label style="font-size:12px;color:#aaa">Shift windows (empty list = always available)</label>
        <div class="rows">
          <div class="row-line" *ngFor="let s of bulkShifts; let i = index">
            <input class="form-input" placeholder="Label" [(ngModel)]="s.label" />
            <input class="form-input" type="time" [(ngModel)]="s.start" style="max-width:130px" />
            <input class="form-input" type="time" [(ngModel)]="s.end" style="max-width:130px" />
            <button class="btn btn-xs btn-ghost" (click)="bulkShifts.splice(i,1)">✕</button>
          </div>
        </div>
        <button class="btn btn-xs btn-secondary" (click)="bulkShifts.push({ label:'', start:'', end:'' })">＋ Add shift</button>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" style="flex:1" (click)="showBulkShifts=false">Cancel</button>
        <button class="btn btn-primary" style="flex:2" (click)="applyBulkShifts()" [disabled]="bulkSaving || !bulkShiftCategory">{{ bulkSaving ? 'Applying...' : 'Apply to category' }}</button>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .mm { display:block; }
    .mm-toolbar { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
    .mm-stats { display:flex; gap:6px; flex-wrap:wrap; }
    .chip { font-size:11px; padding:3px 9px; border-radius:999px; background:#1f1f1f; color:#aaa; }
    .chip.ok { color:#4ade80; } .chip.off { color:#f87171; }
    .mm-actions { display:flex; gap:6px; flex-wrap:wrap; }
    .tab-scroll { display:flex; gap:6px; overflow-x:auto; padding-bottom:4px; margin-bottom:10px; white-space:nowrap; scrollbar-width:none; }
    .tab-scroll::-webkit-scrollbar { display:none; }
    .filter-bar { display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap; }
    .filter-search { flex:2; min-width:160px; }
    .filter-bar .form-select { flex:1; min-width:120px; }
    .empty { padding:40px 16px; text-align:center; color:#666; font-size:14px; }
    .muted { color:#777; }
    .dz-error { color:#f87171; font-size:12px; margin-top:8px; }
    .notice { display:flex; align-items:center; justify-content:space-between; gap:8px; background:rgba(34,197,94,.1); color:#4ade80; border-radius:8px; padding:8px 12px; font-size:12px; margin-bottom:12px; }
    .notice-x { background:none; border:none; color:inherit; cursor:pointer; font-size:12px; }

    .mm-cards { display:flex; flex-direction:column; gap:8px; }
    .mm-card { background:#161616; border:1px solid #222; border-radius:14px; padding:12px; }
    .mm-card-top { display:flex; gap:10px; align-items:center; }
    .mm-thumb { width:48px; height:48px; border-radius:10px; object-fit:cover; flex-shrink:0; }
    .mm-thumb.ph { background:#2a2a2a; display:flex; align-items:center; justify-content:center; font-weight:700; color:#555; }
    .mm-name { font-size:14px; font-weight:600; color:#fff; }
    .mm-sub { font-size:12px; color:#777; }
    .mm-card-actions { display:flex; gap:8px; margin-top:10px; }
    .mm-card-actions .btn { flex:1; }

    .rows { display:flex; flex-direction:column; gap:6px; margin-bottom:6px; }
    .row-line { display:flex; gap:6px; align-items:center; }
    .row-line .form-input { flex:1; }

    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.8); z-index:1000; display:flex; align-items:flex-end; justify-content:center; }
    .modal-sheet { background:#181818; border:1px solid #2a2a2a; border-radius:20px 20px 0 0; width:100%; max-height:92vh; display:flex; flex-direction:column; overflow:hidden; }
    .modal-drag-handle { width:36px; height:4px; background:#333; border-radius:2px; margin:10px auto 4px; flex-shrink:0; }
    .modal-header { display:flex; align-items:flex-start; justify-content:space-between; padding:12px 20px 14px; border-bottom:1px solid #222; }
    .modal-title { font-size:16px; font-weight:700; color:#fff; }
    .modal-sub { font-size:12px; color:#777; margin-top:2px; }
    .modal-close { background:none; border:1px solid #2a2a2a; border-radius:8px; color:#777; width:30px; height:30px; cursor:pointer; }
    .modal-body { padding:16px 20px; overflow-y:auto; flex:1; }
    .modal-footer { display:flex; gap:10px; padding:14px 20px; border-top:1px solid #222; padding-bottom:max(14px, env(safe-area-inset-bottom)); }
    .edit-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .edit-grid .full-col { grid-column:1/-1; }

    @media (min-width:768px) {
      .modal-overlay { align-items:center; }
      .modal-sheet { border-radius:16px; max-width:600px; max-height:90vh; }
      .modal-sheet.small { max-width:420px; }
      .modal-drag-handle { display:none; }
    }
  `]
})
export class RestaurantMenuManagerComponent implements OnChanges {
  @Input() restaurantId = '';
  @Input() restaurantName = '';

  menuItems: any[] = [];
  loading = false;
  search = '';
  availFilter = '';
  vegFilter = '';
  selectedCategory = '';

  showForm = false;
  editMode = false;
  saving = false;
  error = '';
  form: any = this.blankForm();

  showBulkHike = false;
  bulkHikePct: number | null = null;
  showBulkHikeAdjust = false;
  hikeAdjustMode: 'increase' | 'decrease' | 'set' = 'increase';
  hikeAdjustValue: number | null = null;
  showBulkShifts = false;
  bulkShiftCategory = '';
  bulkShifts: any[] = [];
  bulkSaving = false;
  notice = '';

  constructor(private api: ApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['restaurantId']) {
      if (this.restaurantId) this.loadMenu();
      else this.menuItems = [];
    }
  }

  // ── list helpers ──
  get categories(): string[] { return [...new Set(this.menuItems.map(i => i.category).filter(Boolean))]; }
  get availableCount(): number { return this.menuItems.filter(i => i.isAvailable !== false).length; }
  get unavailableCount(): number { return this.menuItems.filter(i => i.isAvailable === false).length; }
  get vegCount(): number { return this.menuItems.filter(i => i.isVeg).length; }

  name(i: any): string { return i.name || i.itemName || ''; }
  thumb(i: any): string { return i.imageUrl || (Array.isArray(i.image) ? i.image[0] : i.image) || ''; }

  get filteredItems(): any[] {
    const s = this.search.toLowerCase();
    return this.menuItems.filter(i => {
      const matchSearch = !s || this.name(i).toLowerCase().includes(s);
      const matchAvail = !this.availFilter
        || (this.availFilter === 'available' && i.isAvailable !== false)
        || (this.availFilter === 'unavailable' && i.isAvailable === false);
      const matchVeg = !this.vegFilter
        || (this.vegFilter === 'veg' && i.isVeg)
        || (this.vegFilter === 'nonveg' && i.isVeg === false);
      const matchCat = !this.selectedCategory || i.category === this.selectedCategory;
      return matchSearch && matchAvail && matchVeg && matchCat;
    });
  }

  loadMenu(): void {
    if (!this.restaurantId) return;
    this.loading = true;
    this.menuItems = [];
    this.api.getMenu(this.restaurantId, 'all').subscribe({
      next: (res: any) => { this.menuItems = res.menuItems || res.items || []; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  // ── form ──
  blankForm(): any {
    return {
      itemId: '', name: '', restaurantPrice: null, hikePercentage: 0, category: '', subCategory: '',
      isVeg: null, isAvailable: true, description: '', image: [], addOnOptions: [], shiftTimings: [],
      theaterMode: false, inventoryCount: 0, topOfferBanner: '', itemOfferCouponCode: '',
    };
  }

  get canSave(): boolean { return !!(this.form.name || '').trim() && (+this.form.restaurantPrice > 0); }

  get computedPrice(): number {
    const base = +this.form.restaurantPrice || 0;
    const hike = +this.form.hikePercentage || 0;
    return Math.round(base * (1 + hike / 100) * 2) / 2; // nearest 0.5 (matches backend)
  }

  openCreate(): void { this.editMode = false; this.error = ''; this.form = this.blankForm(); this.showForm = true; }

  openEdit(item: any): void {
    this.editMode = true;
    this.error = '';
    this.form = {
      itemId: item.itemId || item.id,
      name: this.name(item),
      restaurantPrice: item.restaurantPrice ?? 0,
      hikePercentage: item.hikePercentage ?? 0,
      category: item.category || '',
      subCategory: item.subCategory || '',
      isVeg: item.isVeg ?? null,
      isAvailable: item.isAvailable !== false,
      description: item.description || '',
      image: Array.isArray(item.image) ? [...item.image] : (item.image ? [item.image] : (item.imageUrl ? [item.imageUrl] : [])),
      addOnOptions: Array.isArray(item.addOnOptions) ? item.addOnOptions.map((a: any) => ({ ...a })) : [],
      shiftTimings: Array.isArray(item.shiftTimings) ? item.shiftTimings.map((s: any) => ({ ...s })) : [],
      theaterMode: !!item.theaterMode,
      inventoryCount: item.inventoryCount ?? 0,
      topOfferBanner: item.topOfferBanner || '',
      itemOfferCouponCode: item.itemOfferCouponCode || '',
    };
    this.showForm = true;
  }

  closeForm(): void { this.showForm = false; }

  private buildPayload(): any {
    const f = this.form;
    const addOnOptions = (f.addOnOptions || [])
      .filter((a: any) => (a.name || '').trim())
      .map((a: any) => ({ ...(a.optionId ? { optionId: a.optionId } : {}), name: (a.name || '').trim(), extraPrice: +a.extraPrice || 0 }));
    const shiftTimings = (f.shiftTimings || [])
      .filter((s: any) => s.label && s.start && s.end)
      .map((s: any) => ({ label: s.label, start: s.start, end: s.end }));
    const payload: any = {
      name: (f.name || '').trim(),
      restaurantPrice: +f.restaurantPrice || 0,
      hikePercentage: +f.hikePercentage || 0,
      category: f.category || '',
      subCategory: f.subCategory || '',
      isVeg: f.isVeg,
      isAvailable: f.isAvailable !== false,
      description: f.description || '',
      image: f.image || [],
      addOnOptions,
      shiftTimings,
      theaterMode: !!f.theaterMode,
      topOfferBanner: f.topOfferBanner || '',
      itemOfferCouponCode: f.itemOfferCouponCode || '',
    };
    if (f.theaterMode) payload.inventoryCount = +f.inventoryCount || 0;
    return payload;
  }

  save(): void {
    if (!this.canSave || this.saving) return;
    this.saving = true;
    this.error = '';
    const payload = this.buildPayload();
    const obs = this.editMode
      ? this.api.updateMenuItem(this.restaurantId, this.form.itemId, payload)
      : this.api.createMenuItem(this.restaurantId, payload);
    obs.subscribe({
      next: () => { this.saving = false; this.closeForm(); this.loadMenu(); },
      error: () => { this.saving = false; this.error = 'Save failed. Check the fields and try again.'; },
    });
  }

  toggleItem(item: any): void {
    const newAvail = item.isAvailable === false;
    this.api.toggleMenuItemAvailability(this.restaurantId, item.itemId || item.id, newAvail).subscribe({
      next: () => { item.isAvailable = newAvail; },
    });
  }

  deleteItem(item: any): void {
    const id = item.itemId || item.id;
    if (!confirm(`Delete "${this.name(item)}"? This cannot be undone.`)) return;
    this.api.deleteMenuItem(this.restaurantId, id).subscribe({
      next: () => { this.menuItems = this.menuItems.filter(x => (x.itemId || x.id) !== id); },
    });
  }

  // ── bulk ──
  openBulkHike(): void { this.bulkHikePct = null; this.showBulkHike = true; }

  applyBulkHike(): void {
    const pct = +(this.bulkHikePct as any);
    if (!pct || pct <= 0 || this.bulkSaving) return;
    if (!confirm(`Raise ALL item prices by ${pct}%?`)) return;
    this.bulkSaving = true;
    this.api.bulkMenuPriceHike(this.restaurantId, pct).subscribe({
      next: () => { this.bulkSaving = false; this.showBulkHike = false; this.bulkHikePct = null; this.loadMenu(); },
      error: () => { this.bulkSaving = false; },
    });
  }

  // Bulk adjust the markup (hike %) across all items — increase / decrease / set.
  openBulkHikeAdjust(): void { this.hikeAdjustMode = 'increase'; this.hikeAdjustValue = null; this.showBulkHikeAdjust = true; }

  get canApplyHikeAdjust(): boolean {
    const v = this.hikeAdjustValue;
    if (v == null || isNaN(+v)) return false;
    return this.hikeAdjustMode === 'set' ? +v >= 0 : +v > 0;
  }

  applyBulkHikeAdjust(): void {
    if (!this.canApplyHikeAdjust || this.bulkSaving) return;
    const val = +(this.hikeAdjustValue as any);

    // Compute the new hike % per item; skip items that don't change.
    const changes: { item: any; next: number }[] = [];
    for (const item of this.menuItems) {
      const cur = +item.hikePercentage || 0;
      let next = cur;
      if (this.hikeAdjustMode === 'increase') next = cur + val;
      else if (this.hikeAdjustMode === 'decrease') next = Math.max(0, cur - val);
      else next = Math.max(0, val);
      next = Math.round(next * 100) / 100;
      if (next !== cur) changes.push({ item, next });
    }

    if (!changes.length) { this.showBulkHikeAdjust = false; this.notice = 'No items needed a change.'; return; }

    const verb = this.hikeAdjustMode === 'set' ? `set hike % to ${val}` : `${this.hikeAdjustMode} hike % by ${val}`;
    if (!confirm(`This will ${verb} on ${changes.length} item(s). Continue?`)) return;

    this.bulkSaving = true;
    this.notice = '';
    const calls = changes.map(c =>
      this.api.updateMenuItem(this.restaurantId, c.item.itemId || c.item.id, { hikePercentage: c.next }).pipe(
        map(() => ({ ok: true, c })),
        catchError(() => of({ ok: false, c })),
      )
    );
    forkJoin(calls).subscribe({
      next: (results: any[]) => {
        const okResults = results.filter(r => r.ok);
        okResults.forEach(r => { r.c.item.hikePercentage = r.c.next; });
        const failed = results.length - okResults.length;
        this.bulkSaving = false;
        this.showBulkHikeAdjust = false;
        this.notice = `Hike % updated on ${okResults.length} item(s)` + (failed ? `, ${failed} failed.` : '.');
        this.loadMenu();
      },
      error: () => { this.bulkSaving = false; this.notice = 'Bulk hike-% update failed.'; },
    });
  }

  openBulkShifts(): void { this.bulkShiftCategory = ''; this.bulkShifts = []; this.showBulkShifts = true; }

  applyBulkShifts(): void {
    if (!this.bulkShiftCategory || this.bulkSaving) return;
    const shifts = (this.bulkShifts || [])
      .filter(s => s.label && s.start && s.end)
      .map(s => ({ label: s.label, start: s.start, end: s.end }));
    this.bulkSaving = true;
    this.api.bulkCategoryShifts(this.restaurantId, this.bulkShiftCategory, shifts).subscribe({
      next: () => { this.bulkSaving = false; this.showBulkShifts = false; this.loadMenu(); },
      error: () => { this.bulkSaving = false; },
    });
  }
}
