import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

type CouponMode = 'checkout' | 'item';
type CouponType = 'fixed' | 'percentage';
type CouponTarget = 'delivery' | 'order';

interface CouponForm {
  mode: CouponMode;
  couponCode: string;
  couponType: CouponType;
  couponValue: number | null;
  issuedBy: '' | 'YUMDUDE' | 'RESTAURANT';
  couponTarget: CouponTarget;
  minOrderValue: number | null;
  couponRestaurant: string;
  itemId: string;
  itemBannerText: string;
  startDate: string;
  endDate: string;
  description: string;
  isOncePerUser: boolean;
  isOncePerDay: boolean;
  targetCustomerPhones: string;
}

@Component({
  selector: 'app-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
<div class="page fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Coupons</div>
      <div class="page-subtitle">Create checkout coupons, targeted campaigns, restaurant offers, and item offers</div>
    </div>
    <div class="flex gap-sm">
      <button class="btn btn-secondary btn-sm" (click)="load()">&#8635; Refresh</button>
      <button class="btn btn-primary" (click)="openCreate()">{{ showForm ? 'Cancel' : '+ New Coupon' }}</button>
    </div>
  </div>

  <div *ngIf="showForm" class="card coupon-builder">
    <div class="card-header">
      <div>
        <strong>{{ editMode ? 'Edit Coupon: ' + form.couponCode : 'New Coupon' }}</strong>
        <span>{{ form.mode === 'item' ? 'Menu item pricing offer' : 'Checkout discount coupon' }}</span>
      </div>
    </div>

    <div class="card-body">
      <div class="mode-tabs">
        <button type="button" [class.active]="form.mode === 'checkout'" (click)="setMode('checkout')">Checkout coupon</button>
        <button type="button" [class.active]="form.mode === 'item'" (click)="setMode('item')">Item offer</button>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Coupon Code *</label>
          <input class="form-input" [(ngModel)]="form.couponCode" [disabled]="editMode" placeholder="SAVE20" style="text-transform:uppercase" />
        </div>

        <div class="form-group">
          <label>Discount Type *</label>
          <select class="form-select" [(ngModel)]="form.couponType">
            <option value="fixed">Fixed amount</option>
            <option value="percentage">Percentage</option>
          </select>
        </div>

        <div class="form-group">
          <label>{{ form.couponType === 'fixed' ? 'Discount Amount (Rs) *' : 'Discount Percent *' }}</label>
          <input class="form-input" type="number" min="0" [(ngModel)]="form.couponValue" [placeholder]="form.couponType === 'fixed' ? '50' : '20'" />
        </div>

        <div class="form-group">
          <label>Funded By</label>
          <select class="form-select" [(ngModel)]="form.issuedBy">
            <option value="">Not specified</option>
            <option value="YUMDUDE">Platform / YumDude</option>
            <option value="RESTAURANT">Restaurant</option>
          </select>
        </div>

        <div class="form-group">
          <label>{{ form.issuedBy === 'RESTAURANT' || form.mode === 'item' ? 'Restaurant *' : 'Restaurant Scope' }}</label>
          <select class="form-select" [(ngModel)]="form.couponRestaurant" (ngModelChange)="onRestaurantChange()">
            <option value="">All restaurants</option>
            <option *ngFor="let r of restaurants" [value]="r.restaurantId">{{ r.name || r.restaurantName || r.restaurantId }}</option>
          </select>
        </div>

        <ng-container *ngIf="form.mode === 'checkout'">
          <div class="form-group">
            <label>Coupon Applies To</label>
            <select class="form-select" [(ngModel)]="form.couponTarget">
              <option value="delivery">Delivery fee</option>
              <option value="order">Order value</option>
            </select>
          </div>

          <div class="form-group">
            <label>Min Order Value (Rs)</label>
            <input class="form-input" type="number" min="0" [(ngModel)]="form.minOrderValue" placeholder="200" />
          </div>

          <div class="form-group">
            <label style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" [(ngModel)]="form.isOncePerUser" /> Once per user
            </label>
          </div>

          <div class="form-group">
            <label style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" [(ngModel)]="form.isOncePerDay" /> Once per day
            </label>
          </div>

          <div class="form-group full-col">
            <label>Target Customer Phones</label>
            <textarea class="form-input" rows="3" [(ngModel)]="form.targetCustomerPhones" placeholder="Optional. Comma or line separated phone numbers for private campaigns"></textarea>
          </div>
        </ng-container>

        <ng-container *ngIf="form.mode === 'item'">
          <div class="form-group">
            <label>Menu Item *</label>
            <select class="form-select" [(ngModel)]="form.itemId" [disabled]="!form.couponRestaurant || menuLoading">
              <option value="">{{ menuLoading ? 'Loading menu...' : 'Select item' }}</option>
              <option *ngFor="let item of menuItems" [value]="item.itemId || item.id">
                {{ item.name || item.itemName || item.itemId }} - Rs {{ item.price || item.restaurantPrice || 0 }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Item Banner Text</label>
            <input class="form-input" maxlength="20" [(ngModel)]="form.itemBannerText" placeholder="20% OFF" />
            <small>{{ (form.itemBannerText || '').length }}/20 characters</small>
          </div>
        </ng-container>

        <div class="form-group">
          <label>Start Date</label>
          <input class="form-input" type="date" [(ngModel)]="form.startDate" />
        </div>

        <div class="form-group">
          <label>End Date</label>
          <input class="form-input" type="date" [(ngModel)]="form.endDate" />
        </div>

        <div class="form-group full-col">
          <label>Description</label>
          <input class="form-input" [(ngModel)]="form.description" placeholder="Shown in coupon list and admin context" />
        </div>
      </div>

      <div class="rule-note" *ngIf="form.mode === 'item'">
        Item offers are attached to the selected menu item. Target customer lists are not supported for item coupons.
      </div>

      <div class="form-actions">
        <button class="btn btn-secondary" (click)="cancelForm()">Cancel</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="creating || !canSave">
          {{ creating ? 'Saving...' : (editMode ? 'Update Coupon' : 'Create Coupon') }}
        </button>
      </div>
    </div>
  </div>

  <div class="stats-grid-4" style="margin-bottom:16px">
    <div class="stat-card">
      <div class="stat-label">Total Coupons</div>
      <div class="stat-value">{{ coupons.length }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Active</div>
      <div class="stat-value" style="color:var(--color-success)">{{ activeCount }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Checkout</div>
      <div class="stat-value">{{ checkoutCount }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Item Offers</div>
      <div class="stat-value">{{ itemCount }}</div>
    </div>
  </div>

  <div *ngIf="loading" class="card" style="padding:24px">
    <div class="skeleton" style="height:40px;margin-bottom:8px" *ngFor="let i of [1,2,3]"></div>
  </div>

  <div *ngIf="!loading" class="card" style="padding:0;overflow:hidden">
    <table class="data-table hide-mobile">
      <thead>
        <tr>
          <th>Code</th>
          <th>Mode</th>
          <th>Discount</th>
          <th>Scope</th>
          <th>Rules</th>
          <th>End Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let c of coupons">
          <td>
            <strong class="font-mono">{{ c.couponCode }}</strong>
            <div class="muted" *ngIf="c.description">{{ c.description }}</div>
          </td>
          <td><span class="badge badge-neutral">{{ couponMode(c) }}</span></td>
          <td class="font-mono">{{ discountLabel(c) }}</td>
          <td>
            <div>{{ scopeLabel(c) }}</div>
            <div class="muted" *ngIf="c.issuedBy">{{ c.issuedBy }}</div>
          </td>
          <td>
            <div>{{ ruleLabel(c) }}</div>
            <div class="muted" *ngIf="targetCount(c)">{{ targetCount(c) }} targeted customers</div>
          </td>
          <td class="text-secondary">{{ c.endDate ? (c.endDate | date:'dd MMM yy') : 'No expiry' }}</td>
          <td>
            <span [class]="isActive(c) ? 'badge badge-success' : 'badge badge-neutral'">{{ isActive(c) ? 'Active' : 'Expired' }}</span>
          </td>
          <td>
            <div class="flex gap-sm">
              <button class="btn btn-ghost btn-xs" (click)="editCoupon(c)">Edit</button>
              <button class="btn btn-danger btn-xs" (click)="deleteCoupon(c)">Delete</button>
            </div>
          </td>
        </tr>
        <tr *ngIf="coupons.length === 0">
          <td colspan="8" style="text-align:center;color:var(--color-400);padding:24px">No coupons found</td>
        </tr>
      </tbody>
    </table>

    <div class="mobile-list show-mobile">
      <div class="mobile-card" *ngFor="let c of coupons">
        <div class="mc-header">
          <div>
            <div class="mc-id font-mono">{{ c.couponCode }}</div>
            <div class="mc-sub">{{ couponMode(c) }} - {{ discountLabel(c) }}</div>
          </div>
          <span [class]="isActive(c) ? 'badge badge-success' : 'badge badge-neutral'">{{ isActive(c) ? 'Active' : 'Expired' }}</span>
        </div>
        <div class="mc-row">
          <span class="mc-label">Scope</span>
          <span class="mc-val">{{ scopeLabel(c) }}</span>
        </div>
        <div class="mc-row">
          <span class="mc-label">Rules</span>
          <span class="mc-val">{{ ruleLabel(c) }}</span>
        </div>
        <div class="mc-row">
          <span class="mc-label">End Date</span>
          <span class="mc-val">{{ c.endDate ? (c.endDate | date:'dd MMM yy') : 'No expiry' }}</span>
        </div>
        <div class="mc-footer">
          <button class="btn btn-ghost btn-xs" (click)="editCoupon(c)">Edit</button>
          <button class="btn btn-danger btn-xs" (click)="deleteCoupon(c)">Delete</button>
        </div>
      </div>
      <div class="mobile-card" *ngIf="coupons.length === 0" style="text-align:center;color:var(--color-400)">No coupons found</div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .page { padding: 24px; }
    .coupon-builder { margin-bottom:16px; }
    .card-header { font-size:13px; padding:12px 14px; border-bottom:1px solid var(--color-border); }
    .card-header div { display:flex; flex-direction:column; gap:3px; }
    .card-header span, .muted, small { color:var(--color-text-tertiary); font-size:12px; }
    .card-body { padding:16px; }
    .mode-tabs { display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
    .mode-tabs button {
      border:1px solid var(--color-border);
      background:var(--color-bg-secondary);
      color:var(--color-text-secondary);
      border-radius:999px;
      padding:8px 12px;
      font-weight:700;
      cursor:pointer;
    }
    .mode-tabs button.active { background:var(--color-primary); border-color:var(--color-primary); color:#07140b; }
    .form-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12px; }
    .full-col { grid-column:1/-1; }
    textarea.form-input { min-height:74px; resize:vertical; }
    .rule-note {
      margin-top:12px;
      padding:10px 12px;
      border:1px solid var(--color-border);
      background:var(--color-bg-tertiary);
      color:var(--color-text-secondary);
      border-radius:8px;
      font-size:12px;
    }
    .form-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:16px; }
    @media (max-width:900px) {
      .form-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width:768px) {
      .page { padding: 12px; }
    }
    @media (max-width:520px) {
      .form-grid { grid-template-columns: 1fr; }
      .form-actions { flex-direction: column; }
    }
  `]
})
export class CouponsComponent implements OnInit {
  coupons: any[] = [];
  restaurants: any[] = [];
  menuItems: any[] = [];
  loading = true;
  menuLoading = false;
  showForm = false;
  editMode = false;
  creating = false;
  form: CouponForm = this.blank();

  get activeCount(): number { return this.coupons.filter(c => this.isActive(c)).length; }
  get checkoutCount(): number { return this.coupons.filter(c => !c.couponItem).length; }
  get itemCount(): number { return this.coupons.filter(c => !!c.couponItem).length; }
  get canSave(): boolean {
    if (!this.form.couponCode.trim() || !this.form.couponValue || this.form.couponValue <= 0) return false;
    if (this.form.issuedBy === 'RESTAURANT' && !this.form.couponRestaurant) return false;
    if (this.form.mode === 'item') return !!this.form.couponRestaurant && !!this.form.itemId;
    return true;
  }

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
    this.loadRestaurants();
  }

  blank(): CouponForm {
    return {
      mode: 'checkout',
      couponCode: '',
      couponType: 'fixed',
      couponValue: null,
      issuedBy: 'YUMDUDE',
      couponTarget: 'delivery',
      minOrderValue: null,
      couponRestaurant: '',
      itemId: '',
      itemBannerText: '',
      startDate: '',
      endDate: '',
      description: '',
      isOncePerUser: false,
      isOncePerDay: false,
      targetCustomerPhones: '',
    };
  }

  load(): void {
    this.loading = true;
    this.api.listCoupons().subscribe({
      next: (res: any) => {
        this.coupons = (res.coupons || []).map((c: any) => this.normalizeCoupon(c));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadRestaurants(): void {
    this.api.listRestaurants().subscribe({
      next: (res: any) => { this.restaurants = res.restaurants || []; },
      error: () => {}
    });
  }

  setMode(mode: CouponMode): void {
    this.form.mode = mode;
    if (mode === 'item') {
      this.form.couponTarget = 'order';
      this.form.targetCustomerPhones = '';
      this.form.isOncePerDay = false;
      this.form.isOncePerUser = false;
      if (this.form.couponRestaurant) this.loadMenu(this.form.couponRestaurant);
    } else {
      this.form.itemId = '';
      this.form.itemBannerText = '';
      this.menuItems = [];
    }
  }

  onRestaurantChange(): void {
    this.form.itemId = '';
    this.menuItems = [];
    if (this.form.mode === 'item' && this.form.couponRestaurant) {
      this.loadMenu(this.form.couponRestaurant);
    }
  }

  loadMenu(restaurantId: string): void {
    this.menuLoading = true;
    this.api.getMenu(restaurantId).subscribe({
      next: (res: any) => {
        this.menuItems = res.menuItems || res.items || [];
        this.menuLoading = false;
      },
      error: () => { this.menuLoading = false; }
    });
  }

  openCreate(): void {
    this.editMode = false;
    this.form = this.blank();
    this.showForm = true;
  }

  editCoupon(c: any): void {
    const mode: CouponMode = c.couponItem ? 'item' : 'checkout';
    this.editMode = true;
    this.form = {
      mode,
      couponCode: c.couponCode,
      couponType: this.normalizeType(c.couponType),
      couponValue: Number(c.couponValue || 0),
      minOrderValue: c.minOrderValue ?? null,
      couponTarget: (c.couponTarget || 'delivery') === 'order' ? 'order' : 'delivery',
      issuedBy: c.issuedBy || 'YUMDUDE',
      couponRestaurant: c.couponRestaurant || '',
      itemId: c.couponItem || '',
      itemBannerText: '',
      startDate: c.startDate || '',
      endDate: c.endDate || '',
      description: c.description || '',
      isOncePerUser: !!c.isOncePerUser,
      isOncePerDay: !!c.isOncePerDay,
      targetCustomerPhones: (c.targetCustomerPhones || []).join(', '),
    };
    if (mode === 'item' && this.form.couponRestaurant) this.loadMenu(this.form.couponRestaurant);
    this.showForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelForm(): void {
    this.showForm = false;
    this.editMode = false;
    this.menuItems = [];
    this.form = this.blank();
  }

  save(): void {
    if (!this.canSave) return;
    this.creating = true;
    const payload = this.buildPayload();
    this.api.createCoupon(payload).subscribe({
      next: () => {
        this.creating = false;
        this.cancelForm();
        this.load();
      },
      error: () => { this.creating = false; }
    });
  }

  deleteCoupon(c: any): void {
    if (!confirm('Delete coupon ' + c.couponCode + '?')) return;
    this.api.deleteCoupon(c.couponCode).subscribe({
      next: () => { this.coupons = this.coupons.filter(x => x !== c); }
    });
  }

  isActive(c: any): boolean {
    const now = new Date();
    if (c.startDate && new Date(c.startDate) > now) return false;
    if (c.endDate && new Date(c.endDate) < now) return false;
    return true;
  }

  couponMode(c: any): string {
    if (c.couponItem) return 'Item offer';
    if (this.targetCount(c)) return 'Targeted checkout';
    if (c.couponRestaurant) return 'Restaurant checkout';
    return 'Global checkout';
  }

  discountLabel(c: any): string {
    return this.normalizeType(c.couponType) === 'fixed'
      ? `Rs ${Number(c.couponValue || 0).toFixed(0)}`
      : `${Number(c.couponValue || 0).toFixed(0)}%`;
  }

  scopeLabel(c: any): string {
    if (c.couponItem) return `${this.restaurantName(c.couponRestaurant)} / ${c.couponItem}`;
    if (c.couponRestaurant) return this.restaurantName(c.couponRestaurant);
    return 'All restaurants';
  }

  ruleLabel(c: any): string {
    const rules = [];
    if (!c.couponItem) rules.push((c.couponTarget || 'delivery') === 'order' ? 'Order value' : 'Delivery fee');
    if (c.minOrderValue) rules.push(`Min Rs ${c.minOrderValue}`);
    if (c.isOncePerUser) rules.push('Once/user');
    if (c.isOncePerDay) rules.push('Once/day');
    return rules.length ? rules.join(' | ') : 'No extra rules';
  }

  private buildPayload(): any {
    const payload: any = {
      couponCode: this.form.couponCode.trim().toUpperCase(),
      couponType: this.form.couponType,
      couponValue: Number(this.form.couponValue || 0),
      isOncePerUser: this.form.mode === 'checkout' ? this.form.isOncePerUser : false,
      isOncePerDay: this.form.mode === 'checkout' ? this.form.isOncePerDay : false,
    };

    this.assignIf(payload, 'issuedBy', this.form.issuedBy);
    this.assignIf(payload, 'startDate', this.form.startDate);
    this.assignIf(payload, 'endDate', this.form.endDate);
    this.assignIf(payload, 'description', this.form.description);
    this.assignIf(payload, 'couponRestaurant', this.form.couponRestaurant);

    if (this.form.mode === 'item') {
      payload.itemId = this.form.itemId;
      this.assignIf(payload, 'itemBannerText', this.form.itemBannerText);
      return payload;
    }

    payload.couponTarget = this.form.couponTarget;
    if (this.form.minOrderValue !== null && this.form.minOrderValue !== undefined && Number(this.form.minOrderValue) > 0) {
      payload.minOrderValue = Number(this.form.minOrderValue);
    }
    const phones = this.parsePhones(this.form.targetCustomerPhones);
    if (phones.length) payload.targetCustomerPhones = phones;
    return payload;
  }

  private assignIf(payload: any, key: string, value: any): void {
    if (value !== null && value !== undefined && String(value).trim()) payload[key] = String(value).trim();
  }

  private parsePhones(value: string): string[] {
    return String(value || '')
      .split(/[\n,]+/)
      .map(v => v.trim())
      .filter(Boolean);
  }

  private normalizeCoupon(c: any): any {
    return {
      ...c,
      couponType: this.normalizeType(c.couponType),
    };
  }

  targetCount(c: any): number {
    return Number(c.targetCustomerCount || c.targetCustomerPhones?.length || 0);
  }

  private normalizeType(type: any): CouponType {
    const normalized = String(type || '').toLowerCase();
    if (normalized === 'percentage' || normalized === 'percent') return 'percentage';
    return 'fixed';
  }

  private restaurantName(restaurantId: string): string {
    const restaurant = this.restaurants.find(r => r.restaurantId === restaurantId);
    return restaurant?.name || restaurant?.restaurantName || restaurantId || 'All restaurants';
  }
}
