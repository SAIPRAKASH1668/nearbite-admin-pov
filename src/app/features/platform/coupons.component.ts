import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

type CouponMode = 'checkout' | 'item';
type CouponType = 'fixed' | 'percentage';
type CouponTarget = 'delivery' | 'order' | 'item';
type ItemOfferScope = 'single' | 'bulk';
type BulkItemCouponType = 'price_match' | 'fixed' | 'percentage';

interface MenuItemGroup {
  category: string;
  items: any[];
}

interface CouponForm {
  mode: CouponMode;
  itemOfferScope: ItemOfferScope;
  couponCode: string;
  couponType: CouponType;
  couponValue: number | null;
  bulkCouponType: BulkItemCouponType;
  bulkCouponValue: number | null;
  issuedBy: '' | 'YUMDUDE' | 'RESTAURANT';
  couponTarget: CouponTarget;
  minOrderValue: number | null;
  couponRestaurant: string;
  itemId: string;
  itemIds: string[];
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
      <button class="btn btn-secondary" *ngIf="!showForm" (click)="openCreate('item')">+ New Item Offer</button>
      <button class="btn btn-primary" (click)="showForm ? cancelForm() : openCreate('checkout')">{{ showForm ? 'Cancel' : '+ New Checkout Coupon' }}</button>
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
        <button type="button" [class.active]="form.mode === 'item'" (click)="setMode('item')">Item offer - select items</button>
      </div>

      <div class="form-grid">
        <div class="form-group" *ngIf="form.mode !== 'item' || form.itemOfferScope === 'single'">
          <label>Coupon Code *</label>
          <input class="form-input" [(ngModel)]="form.couponCode" [disabled]="editMode" placeholder="SAVE20" style="text-transform:uppercase" />
        </div>

        <div class="form-group" *ngIf="form.mode !== 'item' || form.itemOfferScope === 'single'">
          <label>Discount Type *</label>
          <select class="form-select" [(ngModel)]="form.couponType">
            <option value="fixed">Fixed amount</option>
            <option value="percentage">Percentage</option>
          </select>
        </div>

        <div class="form-group" *ngIf="form.mode !== 'item' || form.itemOfferScope === 'single'">
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
          <div class="form-group full-col" *ngIf="!editMode">
            <label>Apply Offer To</label>
            <div class="sub-mode-tabs">
              <button type="button" [class.active]="form.itemOfferScope === 'single'" (click)="setItemOfferScope('single')">Pick specific items</button>
              <button type="button" [class.active]="form.itemOfferScope === 'bulk'" (click)="setItemOfferScope('bulk')">All eligible items</button>
            </div>
          </div>

          <ng-container *ngIf="form.itemOfferScope === 'single'">
          <div class="form-group full-col">
            <div class="item-picker-head">
              <label>Select Multiple Menu Items *</label>
              <div class="flex gap-sm">
                <button type="button" class="btn btn-secondary btn-xs" (click)="selectAllMenuItems()" [disabled]="!menuItems.length">Select all</button>
                <button type="button" class="btn btn-ghost btn-xs" (click)="clearSelectedItems()" [disabled]="!form.itemIds.length">Clear</button>
              </div>
            </div>
            <div class="item-picker" [class.disabled]="!form.couponRestaurant || menuLoading">
              <div class="muted" *ngIf="!form.couponRestaurant">Select a restaurant first</div>
              <div class="muted" *ngIf="form.couponRestaurant && menuLoading">Loading menu...</div>
              <div class="item-category" *ngFor="let group of groupedMenuItems()">
                <div class="item-category-head">
                  <div>
                    <strong>{{ group.category }}</strong>
                    <span>{{ selectedCountInGroup(group) }}/{{ group.items.length }} selected</span>
                  </div>
                  <div class="flex gap-sm">
                    <button type="button" class="btn btn-secondary btn-xs" (click)="selectCategoryItems(group)" [disabled]="!group.items.length">Select</button>
                    <button type="button" class="btn btn-ghost btn-xs" (click)="clearCategoryItems(group)" [disabled]="!selectedCountInGroup(group)">Clear</button>
                  </div>
                </div>
                <div class="item-category-grid">
                  <label class="item-option" *ngFor="let item of group.items">
                    <input type="checkbox" [checked]="isItemSelected(item)" (change)="toggleItem(item)" [disabled]="menuLoading" />
                    <span>
                      <span>{{ item.name || item.itemName || item.itemId }}</span>
                      <small *ngIf="item.subCategory">{{ item.subCategory }}</small>
                    </span>
                    <span class="font-mono">Rs {{ displayPrice(item) }}</span>
                    <span class="muted" *ngIf="item.itemOfferCouponCode">coupon {{ item.itemOfferCouponCode }}</span>
                  </label>
                </div>
              </div>
            </div>
            <small>{{ form.itemIds.length }} selected</small>
          </div>
          </ng-container>

          <ng-container *ngIf="form.itemOfferScope === 'bulk'">
          <div class="form-group">
            <label>Bulk Offer Type *</label>
            <select class="form-select" [(ngModel)]="form.bulkCouponType" (ngModelChange)="onBulkCouponTypeChange()">
              <option value="price_match">Match dine-in price</option>
              <option value="fixed">Fixed amount</option>
              <option value="percentage">Percentage</option>
            </select>
          </div>

          <div class="form-group" *ngIf="form.bulkCouponType !== 'price_match'">
            <label>{{ form.bulkCouponType === 'fixed' ? 'Discount Amount (Rs) *' : 'Discount Percent *' }}</label>
            <input class="form-input" type="number" min="0" [(ngModel)]="form.bulkCouponValue" [placeholder]="form.bulkCouponType === 'fixed' ? '30' : '10'" />
          </div>
          </ng-container>

          <div class="form-group">
            <label>Item Banner Text</label>
            <input class="form-input" maxlength="20" [(ngModel)]="form.itemBannerText" placeholder="20% OFF" />
            <small>{{ (form.itemBannerText || '').length }}/20 characters</small>
          </div>

          <div class="item-preview full-col" *ngIf="form.couponRestaurant">
            <div>
              <strong>{{ form.itemOfferScope === 'bulk' ? (menuItems.length || 0) : form.itemIds.length }}</strong>
              <span>{{ form.itemOfferScope === 'bulk' ? 'menu items loaded for bulk offer' : 'selected menu items' }}</span>
            </div>
            <div *ngIf="selectedMenuItems()[0] as item">
              <span>{{ item.itemName || item.name || item.itemId }}</span>
              <span class="font-mono">Rs {{ displayPrice(item) }}</span>
              <span class="muted" *ngIf="form.itemIds.length > 1">+{{ form.itemIds.length - 1 }} more</span>
              <span class="muted" *ngIf="item.originalPrice">was Rs {{ item.originalPrice }}</span>
              <span class="muted" *ngIf="item.itemOfferCouponCode">coupon {{ item.itemOfferCouponCode }}</span>
            </div>
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
        {{ form.itemOfferScope === 'bulk'
          ? 'Bulk item offers generate one coupon per eligible menu item and attach each coupon to that item.'
          : 'Item offers are attached to the selected menu item. Target customer lists are not supported for item coupons.' }}
      </div>

      <div class="rule-note success-note" *ngIf="bulkResult">
        Created {{ bulkResult.createdCount || 0 }} item offer{{ (bulkResult.createdCount || 0) === 1 ? '' : 's' }}
        <span *ngIf="bulkResult.skippedCount">, skipped {{ bulkResult.skippedCount }}</span>.
      </div>

      <div class="rule-note error-note" *ngIf="saveError">
        {{ saveError }}
      </div>

      <div class="form-actions">
        <button class="btn btn-secondary" (click)="cancelForm()">Cancel</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="creating || !canSave">
          {{ creating ? 'Saving...' : saveButtonLabel }}
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
          <th>Uses</th>
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
          <td class="font-mono">{{ c.uses || 0 }}</td>
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
          <td colspan="9" style="text-align:center;color:var(--color-400);padding:24px">No coupons found</td>
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
          <span class="mc-label">Uses</span>
          <span class="mc-val">{{ c.uses || 0 }}</span>
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
    .mode-tabs button, .sub-mode-tabs button {
      border:1px solid var(--color-border);
      background:var(--color-bg-secondary);
      color:var(--color-text-secondary);
      border-radius:999px;
      padding:8px 12px;
      font-weight:700;
      cursor:pointer;
    }
    .mode-tabs button.active, .sub-mode-tabs button.active { background:var(--color-primary); border-color:var(--color-primary); color:#07140b; }
    .sub-mode-tabs { display:flex; gap:8px; flex-wrap:wrap; }
    .form-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12px; }
    .full-col { grid-column:1/-1; }
    textarea.form-input { min-height:74px; resize:vertical; }
    .item-picker-head { display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .item-picker {
      display:flex;
      flex-direction:column;
      gap:8px;
      max-height:260px;
      overflow:auto;
      padding:10px;
      border:1px solid var(--color-border);
      border-radius:8px;
      background:var(--color-bg-secondary);
    }
    .item-picker.disabled { opacity:.7; }
    .item-category {
      display:flex;
      flex-direction:column;
      gap:8px;
      padding:10px;
      border:1px solid var(--color-border);
      border-radius:8px;
      background:var(--color-bg-card);
    }
    .item-category-head { display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .item-category-head div:first-child { display:flex; flex-direction:column; gap:3px; min-width:0; }
    .item-category-head strong { color:var(--color-text-primary); font-size:13px; }
    .item-category-head span { color:var(--color-text-tertiary); font-size:11px; }
    .item-category-grid {
      display:grid;
      grid-template-columns:repeat(2, minmax(0, 1fr));
      gap:8px;
    }
    .item-option {
      display:grid;
      grid-template-columns:auto minmax(0, 1fr) auto auto;
      align-items:center;
      gap:8px;
      min-height:36px;
      padding:7px 8px;
      border:1px solid var(--color-border);
      border-radius:8px;
      background:var(--color-bg-secondary);
      font-size:12px;
      cursor:pointer;
    }
    .item-option span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .item-option span span { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .item-option small { display:block; color:var(--color-text-tertiary); font-size:10px; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .item-option input { margin:0; }
    .item-preview {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      padding:10px 12px;
      border:1px solid var(--color-border);
      border-radius:8px;
      background:var(--color-bg-secondary);
      font-size:12px;
    }
    .item-preview div { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .item-preview strong { font-size:16px; color:var(--color-text-primary); }
    .rule-note {
      margin-top:12px;
      padding:10px 12px;
      border:1px solid var(--color-border);
      background:var(--color-bg-tertiary);
      color:var(--color-text-secondary);
      border-radius:8px;
      font-size:12px;
    }
    .success-note { border-color:rgba(34,197,94,.35); color:var(--color-success); }
    .error-note { border-color:rgba(239,68,68,.35); color:var(--color-error); }
    .form-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:16px; }
    @media (max-width:900px) {
      .form-grid { grid-template-columns: 1fr 1fr; }
      .item-category-grid { grid-template-columns:1fr; }
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
  bulkResult: any = null;
  saveError = '';
  form: CouponForm = this.blank();

  get activeCount(): number { return this.coupons.filter(c => this.isActive(c)).length; }
  get checkoutCount(): number { return this.coupons.filter(c => !this.itemIdsFromCoupon(c).length).length; }
  get itemCount(): number { return this.coupons.filter(c => !!this.itemIdsFromCoupon(c).length).length; }
  get saveButtonLabel(): string {
    if (this.form.mode === 'item' && this.form.itemOfferScope === 'bulk') return 'Apply Bulk Item Offers';
    return this.editMode ? 'Update Coupon' : 'Create Coupon';
  }
  get canSave(): boolean {
    if (this.form.issuedBy === 'RESTAURANT' && !this.form.couponRestaurant) return false;
    if (this.form.mode === 'item' && this.form.itemOfferScope === 'bulk') {
      if (!this.form.couponRestaurant) return false;
      if (this.form.bulkCouponType === 'price_match') return true;
      if (!this.form.bulkCouponValue || this.form.bulkCouponValue <= 0) return false;
      if (this.form.bulkCouponType === 'percentage' && this.form.bulkCouponValue > 100) return false;
      return true;
    }
    if (!this.form.couponCode.trim() || !this.form.couponValue || this.form.couponValue <= 0) return false;
    if (this.form.couponType === 'percentage' && this.form.couponValue > 100) return false;
    if (this.form.mode === 'item') return !!this.form.couponRestaurant && this.form.itemIds.length > 0;
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
      itemOfferScope: 'single',
      couponCode: '',
      couponType: 'fixed',
      couponValue: null,
      bulkCouponType: 'price_match',
      bulkCouponValue: null,
      issuedBy: 'YUMDUDE',
      couponTarget: 'delivery',
      minOrderValue: null,
      couponRestaurant: '',
      itemId: '',
      itemIds: [],
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
    this.bulkResult = null;
    this.saveError = '';
    if (mode === 'item') {
      this.form.couponTarget = 'item';
      this.form.targetCustomerPhones = '';
      this.form.isOncePerDay = false;
      this.form.isOncePerUser = false;
      if (this.form.couponRestaurant) this.loadMenu(this.form.couponRestaurant);
    } else {
      if (this.form.couponTarget === 'item') this.form.couponTarget = 'delivery';
      this.form.itemOfferScope = 'single';
      this.form.itemId = '';
      this.form.itemIds = [];
      this.form.itemBannerText = '';
      this.menuItems = [];
    }
  }

  setItemOfferScope(scope: ItemOfferScope): void {
    this.form.itemOfferScope = scope;
    this.bulkResult = null;
    this.saveError = '';
    if (scope === 'bulk') {
      this.form.couponCode = '';
      this.form.itemId = '';
      this.form.itemIds = [];
      this.form.couponValue = null;
    }
    if (this.form.couponRestaurant) this.loadMenu(this.form.couponRestaurant);
  }

  onBulkCouponTypeChange(): void {
    if (this.form.bulkCouponType === 'price_match') this.form.bulkCouponValue = null;
  }

  onRestaurantChange(): void {
    this.form.itemId = '';
    this.form.itemIds = [];
    this.menuItems = [];
    if (this.form.mode === 'item' && this.form.couponRestaurant) {
      this.loadMenu(this.form.couponRestaurant);
    }
  }

  loadMenu(restaurantId: string): void {
    this.menuLoading = true;
    this.api.getMenu(restaurantId, 'all').subscribe({
      next: (res: any) => {
        this.menuItems = res.menuItems || res.items || [];
        const item = this.selectedMenuItems()[0];
        if (item && !this.form.itemBannerText && item.itemOfferCouponCode === this.form.couponCode) {
          this.form.itemBannerText = item.topOfferBanner || '';
        }
        this.menuLoading = false;
      },
      error: () => { this.menuLoading = false; }
    });
  }

  openCreate(mode: CouponMode = 'checkout'): void {
    this.editMode = false;
    this.form = this.blank();
    this.form.mode = mode;
    if (mode === 'item') {
      this.form.couponTarget = 'item';
      this.form.targetCustomerPhones = '';
      this.form.isOncePerDay = false;
      this.form.isOncePerUser = false;
    }
    this.bulkResult = null;
    this.saveError = '';
    this.showForm = true;
  }

  editCoupon(c: any): void {
    const itemIds = this.itemIdsFromCoupon(c);
    const mode: CouponMode = itemIds.length ? 'item' : 'checkout';
    this.editMode = true;
    this.form = {
      mode,
      itemOfferScope: 'single',
      couponCode: c.couponCode,
      couponType: this.normalizeType(c.couponType),
      couponValue: Number(c.couponValue || 0),
      bulkCouponType: 'price_match',
      bulkCouponValue: null,
      minOrderValue: c.minOrderValue ?? null,
      couponTarget: (c.couponTarget || 'delivery') === 'order' ? 'order' : 'delivery',
      issuedBy: c.issuedBy || 'YUMDUDE',
      couponRestaurant: c.couponRestaurant || '',
      itemId: itemIds[0] || '',
      itemIds,
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
    this.bulkResult = null;
    this.saveError = '';
    this.form = this.blank();
  }

  save(): void {
    if (!this.canSave) return;
    this.creating = true;
    this.saveError = '';
    this.bulkResult = null;

    if (this.form.mode === 'item' && this.form.itemOfferScope === 'bulk') {
      this.api.createBulkItemCoupons(this.form.couponRestaurant, this.buildBulkPayload()).subscribe({
        next: (res: any) => {
          this.creating = false;
          this.bulkResult = res;
          this.load();
          this.loadMenu(this.form.couponRestaurant);
        },
        error: (err: any) => {
          this.creating = false;
          this.saveError = this.errorMessage(err);
        }
      });
      return;
    }

    const payload = this.buildPayload();
    this.api.createCoupon(payload).subscribe({
      next: () => {
        this.creating = false;
        this.cancelForm();
        this.load();
      },
      error: (err: any) => {
        this.creating = false;
        this.saveError = this.errorMessage(err);
      }
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
    if (this.itemIdsFromCoupon(c).length) return 'Item offer';
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
    const itemIds = this.itemIdsFromCoupon(c);
    if (itemIds.length === 1) return `${this.restaurantName(c.couponRestaurant)} / ${itemIds[0]}`;
    if (itemIds.length > 1) return `${this.restaurantName(c.couponRestaurant)} / ${itemIds.length} items`;
    if (c.couponRestaurant) return this.restaurantName(c.couponRestaurant);
    return 'All restaurants';
  }

  ruleLabel(c: any): string {
    const rules = [];
    const itemIds = this.itemIdsFromCoupon(c);
    if (itemIds.length) rules.push(itemIds.length === 1 ? 'Item price' : `${itemIds.length} item prices`);
    if (!itemIds.length) rules.push((c.couponTarget || 'delivery') === 'order' ? 'Order value' : 'Delivery fee');
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
      payload.itemIds = this.form.itemIds;
      if (this.form.itemIds.length === 1) payload.itemId = this.form.itemIds[0];
      payload.couponTarget = 'item';
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

  private buildBulkPayload(): any {
    const payload: any = {
      couponType: this.form.bulkCouponType,
      issuedBy: this.form.issuedBy || 'YUMDUDE',
    };
    if (this.form.bulkCouponType !== 'price_match') {
      payload.couponValue = Number(this.form.bulkCouponValue || 0);
    }
    this.assignIf(payload, 'itemBannerText', this.form.itemBannerText);
    this.assignIf(payload, 'startDate', this.form.startDate);
    this.assignIf(payload, 'endDate', this.form.endDate);
    this.assignIf(payload, 'description', this.form.description);
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

  itemIdOf(item: any): string {
    return String(item?.itemId || item?.id || '').trim();
  }

  isItemSelected(item: any): boolean {
    const itemId = this.itemIdOf(item);
    return !!itemId && this.form.itemIds.includes(itemId);
  }

  toggleItem(item: any): void {
    const itemId = this.itemIdOf(item);
    if (!itemId) return;
    const selected = new Set(this.form.itemIds);
    if (selected.has(itemId)) selected.delete(itemId);
    else selected.add(itemId);
    this.form.itemIds = Array.from(selected);
    this.form.itemId = this.form.itemIds[0] || '';
  }

  selectAllMenuItems(): void {
    this.form.itemIds = this.menuItems
      .map(item => this.itemIdOf(item))
      .filter(Boolean);
    this.form.itemId = this.form.itemIds[0] || '';
  }

  clearSelectedItems(): void {
    this.form.itemIds = [];
    this.form.itemId = '';
  }

  selectedMenuItems(): any[] {
    const selected = new Set(this.form.itemIds);
    return this.menuItems.filter(item => selected.has(this.itemIdOf(item)));
  }

  groupedMenuItems(): MenuItemGroup[] {
    const groups = new Map<string, any[]>();
    this.menuItems.forEach(item => {
      const category = this.categoryLabel(item);
      const items = groups.get(category) || [];
      items.push(item);
      groups.set(category, items);
    });

    return Array.from(groups.entries())
      .map(([category, items]) => ({
        category,
        items: items.slice().sort((a, b) => this.itemName(a).localeCompare(this.itemName(b))),
      }))
      .sort((a, b) => {
        if (a.category === 'Uncategorized') return 1;
        if (b.category === 'Uncategorized') return -1;
        return a.category.localeCompare(b.category);
      });
  }

  selectedCountInGroup(group: MenuItemGroup): number {
    const selected = new Set(this.form.itemIds);
    return group.items.filter(item => selected.has(this.itemIdOf(item))).length;
  }

  selectCategoryItems(group: MenuItemGroup): void {
    const selected = new Set(this.form.itemIds);
    group.items.forEach(item => {
      const itemId = this.itemIdOf(item);
      if (itemId) selected.add(itemId);
    });
    this.form.itemIds = Array.from(selected);
    this.form.itemId = this.form.itemIds[0] || '';
  }

  clearCategoryItems(group: MenuItemGroup): void {
    const categoryIds = new Set(group.items.map(item => this.itemIdOf(item)).filter(Boolean));
    this.form.itemIds = this.form.itemIds.filter(itemId => !categoryIds.has(itemId));
    this.form.itemId = this.form.itemIds[0] || '';
  }

  itemIdsFromCoupon(c: any): string[] {
    const rawItems = [
      c?.couponItem,
      ...(Array.isArray(c?.couponItems) ? c.couponItems : []),
    ];
    return Array.from(new Set(
      rawItems
        .map(itemId => String(itemId || '').trim())
        .filter(Boolean)
    ));
  }

  private categoryLabel(item: any): string {
    return String(item?.category || 'Uncategorized').trim() || 'Uncategorized';
  }

  private itemName(item: any): string {
    return String(item?.name || item?.itemName || item?.itemId || '').trim();
  }

  displayPrice(item: any): string {
    const value = Number(item.price ?? item.restaurantPrice ?? 0);
    return Number.isFinite(value) ? value.toFixed(value % 1 === 0 ? 0 : 1) : '0';
  }

  private errorMessage(err: any): string {
    return err?.error?.error || err?.error?.message || err?.message || 'Save failed';
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
