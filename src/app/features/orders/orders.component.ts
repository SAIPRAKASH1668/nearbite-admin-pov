import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, SlicePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DecimalPipe, SlicePipe],
  template: `
<div class="page fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">All Orders</div>
      <div class="page-subtitle">Search orders by date range, rider, or customer</div>
    </div>
    <div class="flex gap-sm items-center">      <button class="btn btn-secondary btn-sm" (click)="search()" [disabled]="loading">&#8635; Refresh</button>
      <a routerLink="/orders/live" class="live-badge">LIVE</a>
      <a routerLink="/orders/cod" class="btn btn-secondary btn-sm">COD</a>
    </div>
  </div>

  <!-- Search Bar -->
  <div class="card" style="margin-bottom:16px">
    <div class="filter-bar" style="padding:0">
      <select class="form-select" [(ngModel)]="filterType" (ngModelChange)="onFilterTypeChange()">
        <option value="dateRange">By Date Range</option>
        <option value="orderId">By Order ID</option>
        <option value="riderId">By Rider ID</option>
        <option value="customerPhone">By Customer Phone</option>
      </select>
      <ng-container *ngIf="filterType === 'dateRange'">
        <input type="date" class="form-input" [(ngModel)]="startDate" />
        <span style="color:var(--color-400);font-size:13px">→</span>
        <input type="date" class="form-input" [(ngModel)]="endDate" />
      </ng-container>
      <ng-container *ngIf="filterType !== 'dateRange'">
        <input class="form-input" style="flex:1" [(ngModel)]="filterValue"
          [placeholder]="filterType === 'orderId' ? 'Enter Order ID…' : filterType === 'riderId' ? 'Enter Rider ID…' : 'Enter Customer Phone…'"
          (keyup.enter)="search()" />
      </ng-container>
      <select class="form-select" [(ngModel)]="statusFilter" *ngIf="filterType !== 'orderId'">
        <option value="">All Statuses</option>
        <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
      </select>
      <button class="btn btn-primary" (click)="search()" [disabled]="loading">
        {{ loading ? 'Loading…' : 'Search' }}
      </button>
    </div>
  </div>

  <!-- Stats row -->
  <div class="stats-grid-4" style="margin-bottom:16px" *ngIf="orders.length > 0">
    <div class="stat-card">
      <div class="stat-label">Total Found</div>
      <div class="stat-value">{{ orders.length }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Revenue</div>
      <div class="stat-value">&#x20B9;{{ totalRevenue | number:'1.0-0' }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Delivered</div>
      <div class="stat-value" style="color:var(--color-success)">{{ deliveredCount }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Cancelled</div>
      <div class="stat-value" style="color:var(--color-error)">{{ cancelledCount }}</div>
    </div>
  </div>

  <!-- Results card -->
  <div class="card" style="padding:0;overflow:hidden">
    <div *ngIf="loading" style="padding:32px">
      <div class="skeleton" style="height:56px;margin-bottom:8px;border-radius:8px" *ngFor="let i of [1,2,3,4,5]"></div>
    </div>
    <div class="empty-state" *ngIf="!loading && orders.length === 0 && !searched">
      <div class="empty-icon">⌕</div>
      <h4>Search for orders</h4>
      <p>Select a filter type and click Search</p>
    </div>
    <div class="empty-state" *ngIf="!loading && orders.length === 0 && searched">
      <div class="empty-icon">✕</div>
      <h4>No orders found</h4>
    </div>

    <!-- Desktop table -->
    <table class="data-table hide-mobile" *ngIf="!loading && orders.length > 0">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Restaurant</th>
          <th>Bill &amp; Revenue Split</th>
          <th>Payment</th>
          <th>Status</th>
          <th>Rider</th>
          <th>Customer</th>
          <th>Items</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let o of orders" [routerLink]="['/orders', o.orderId]" style="cursor:pointer">
          <td class="font-mono" style="font-size:11px">{{ o.orderId }}</td>
          <td>{{ o.restaurantName || o.restaurantId }}</td>
          <td>
            <div class="tbl-bill">
              <strong>&#x20B9;{{ o.grandTotal }}</strong>
              <div class="tbl-rev-chips">
                <span class="rchip rchip-us">Us &#x20B9;{{ calcPlatform(o) | number:'1.0-0' }}</span>
                <span class="rchip rchip-resto">Resto &#x20B9;{{ calcRestaurant(o) | number:'1.0-0' }}</span>
                <span class="rchip rchip-rider">Rider &#x20B9;{{ calcRider(o) | number:'1.0-0' }}</span>
                <span class="rchip rchip-govt">GST ~&#x20B9;{{ calcGovt(o) | number:'1.0-0' }}</span>
              </div>
            </div>
          </td>
          <td><span class="badge badge-neutral">{{ o.paymentMethod || '—' }}</span></td>
          <td><span [class]="'status-' + o.status">{{ o.status }}</span></td>
          <td>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <span *ngIf="o.riderName" class="rider-name">{{ o.riderName }}</span>
              <button class="assign-btn" (click)="openAssign(o, $event)">{{ o.riderName ? '&#8635;' : '+ Assign' }}</button>
            </div>
          </td>
          <td class="font-mono" style="font-size:11px">{{ o.receiverPhone || o.customerPhone }}</td>
          <td>{{ o.items?.length || 0 }}</td>
          <td class="text-secondary" style="font-size:11px">{{ o.createdAt | slice:0:16 }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Mobile card list -->
    <div class="mobile-list show-mobile" *ngIf="!loading && orders.length > 0">
      <a class="mobile-card" *ngFor="let o of orders" [routerLink]="['/orders', o.orderId]">
        <div class="mc-header">
          <div>
            <div class="mc-id">{{ o.orderId | slice:0:20 }}</div>
            <div class="mc-sub">{{ o.restaurantName || o.restaurantId }}</div>
          </div>
          <span [class]="'status-' + o.status">{{ o.status }}</span>
        </div>
        <div class="mc-row">
          <span class="mc-label">Customer</span>
          <span class="mc-val font-mono">{{ o.receiverPhone || o.customerPhone }}</span>
        </div>
        <div class="mc-row">
          <span class="mc-label">Payment</span>
          <span class="mc-val"><span class="badge badge-neutral">{{ o.paymentMethod || '—' }}</span></span>
        </div>
        <div class="mc-row">
          <span class="mc-label">Rider</span>
          <div class="mc-val" style="display:flex;align-items:center;gap:6px">
            <span *ngIf="o.riderName" class="rider-name">{{ o.riderName }}</span>
            <span *ngIf="!o.riderName" style="color:var(--color-400,#888);font-size:11px">Unassigned</span>
            <button class="assign-btn" (click)="openAssign(o, $event)">{{ o.riderName ? '&#8635;' : '+ Assign' }}</button>
          </div>
        </div>
        <!-- Revenue strip -->
        <div class="rev-strip">
          <div class="rev-chip-card rchip-us">
            <div class="rev-chip-label">Us</div>
            <div class="rev-chip-val">&#x20B9;{{ calcPlatform(o) | number:'1.0-0' }}</div>
          </div>
          <div class="rev-chip-card rchip-resto">
            <div class="rev-chip-label">Resto</div>
            <div class="rev-chip-val">&#x20B9;{{ calcRestaurant(o) | number:'1.0-0' }}</div>
          </div>
          <div class="rev-chip-card rchip-rider">
            <div class="rev-chip-label">Rider</div>
            <div class="rev-chip-val">&#x20B9;{{ calcRider(o) | number:'1.0-0' }}</div>
          </div>
          <div class="rev-chip-card rchip-govt">
            <div class="rev-chip-label">Govt</div>
            <div class="rev-chip-val">~&#x20B9;{{ calcGovt(o) | number:'1.0-0' }}</div>
          </div>
        </div>
        <div class="mc-footer">
          <span class="mc-amount">&#x20B9;{{ o.grandTotal }}</span>
          <span class="mc-meta">{{ o.items?.length || 0 }} items &middot; {{ o.createdAt | slice:11:16 }}</span>
        </div>
      </a>
    </div>
  </div>

  <!-- Assign Rider Modal -->
  <div class="modal-overlay" *ngIf="assigningOrder" (click)="closeAssign()">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <div>
          <div class="modal-title">Assign Rider</div>
          <div class="modal-sub">{{ assigningOrder.orderId | slice:0:20 }}&#8230;</div>
        </div>
        <button class="modal-close" (click)="closeAssign()">&#x2715;</button>
      </div>
      <div *ngIf="assignSuccess" class="assign-success">{{ assignSuccess }}</div>
      <div *ngIf="ridersLoading" class="modal-loading">Loading riders&hellip;</div>
      <div *ngIf="!ridersLoading && ridersList.length === 0 && !assignSuccess" class="modal-empty">No riders found</div>
      <div class="rider-grid" *ngIf="!ridersLoading && ridersList.length > 0">
        <div class="rider-option" *ngFor="let r of ridersList" (click)="doAssign(r)"
             [class.assigning]="assignLoading">
          <div class="rider-avatar">{{ (r.firstName || r.phone || '?').charAt(0).toUpperCase() }}</div>
          <div class="rider-info">
            <div class="rider-name-opt">{{ r.firstName || '&#8212;' }} {{ r.lastName || '' }}</div>
            <div class="rider-phone">{{ r.phone }}</div>
          </div>
          <span [class]="'rider-status-dot ' + (r.isActive ? 'dot-active' : 'dot-inactive')"></span>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .page { padding: 24px; }
    .live-badge { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; background:rgba(239,68,68,.12); color:#ef4444; border:1px solid rgba(239,68,68,.3); border-radius:100px; font-size:11px; font-weight:700; letter-spacing:.08em; text-decoration:none; animation:pulse-red 2s infinite; }
    @keyframes pulse-red { 0%,100%{opacity:1} 50%{opacity:.6} }
    .rider-name { font-size:12px; font-weight:600; color:var(--color-text-primary); }

    /* Revenue chips — desktop table */
    .tbl-bill { display:flex; flex-direction:column; gap:5px; }
    .tbl-rev-chips { display:flex; flex-wrap:wrap; gap:3px; }
    .rchip { font-size:10px; font-weight:600; padding:2px 6px; border-radius:4px; white-space:nowrap; }
    .rchip-us    { background:rgba(245,158,11,.15); color:#d97706; }
    .rchip-resto { background:rgba(34,197,94,.12);  color:#16a34a; }
    .rchip-rider { background:rgba(59,130,246,.12); color:#2563eb; }
    .rchip-govt  { background:rgba(168,85,247,.12); color:#7c3aed; }

    /* Revenue strip — mobile cards */
    .rev-strip { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin:10px 0 4px; }
    .rev-chip-card { background:var(--color-bg-elevated,#1a1a1a); border-radius:6px; padding:6px 8px; text-align:center; }
    .rev-chip-label { font-size:9px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:var(--color-text-tertiary); margin-bottom:2px; }
    .rev-chip-val { font-size:12px; font-weight:700; }
    .rchip-us  .rev-chip-val  { color:#d97706; }
    .rchip-us  .rev-chip-label{ color:#d97706; opacity:.7; }
    .rchip-resto .rev-chip-val  { color:#16a34a; }
    .rchip-resto .rev-chip-label{ color:#16a34a; opacity:.7; }
    .rchip-rider .rev-chip-val  { color:#2563eb; }
    .rchip-rider .rev-chip-label{ color:#2563eb; opacity:.7; }
    .rchip-govt .rev-chip-val  { color:#7c3aed; }
    .rchip-govt .rev-chip-label{ color:#7c3aed; opacity:.7; }

    @media (max-width: 768px) { .page { padding: 12px; } }
    /* Assign button */
    .assign-btn { background:none; border:1px solid #333; border-radius:6px; padding:2px 8px; font-size:11px; color:var(--color-400,#888); cursor:pointer; white-space:nowrap; font-family:inherit; line-height:1.4; }
    .assign-btn:hover { border-color:#555; color:#fff; }
    /* Assign Rider Modal */
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.75); z-index:1000; display:flex; align-items:center; justify-content:center; padding:16px; }
    .modal-box { background:#181818; border:1px solid #2a2a2a; border-radius:16px; width:100%; max-width:480px; max-height:80vh; display:flex; flex-direction:column; overflow:hidden; }
    .modal-header { display:flex; align-items:flex-start; justify-content:space-between; padding:20px 20px 16px; border-bottom:1px solid #2a2a2a; }
    .modal-title { font-size:16px; font-weight:700; color:#fff; }
    .modal-sub { font-size:11px; color:var(--color-400,#888); margin-top:3px; font-family:monospace; }
    .modal-close { background:none; border:1px solid #333; border-radius:6px; color:var(--color-400,#888); width:28px; height:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:13px; font-family:inherit; }
    .modal-close:hover { color:#fff; border-color:#555; }
    .modal-loading, .modal-empty { padding:32px; text-align:center; color:var(--color-400,#888); font-size:14px; }
    .assign-success { margin:12px 20px 0; padding:10px 14px; background:rgba(34,197,94,.12); color:#16a34a; border-radius:8px; font-size:13px; font-weight:600; text-align:center; }
    .rider-grid { overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:6px; }
    .rider-option { display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:10px; border:1px solid #2a2a2a; cursor:pointer; transition:background .15s,border-color .15s; }
    .rider-option:hover { background:#232323; border-color:#3a3a3a; }
    .rider-option.assigning { pointer-events:none; opacity:.6; }
    .rider-avatar { width:36px; height:36px; border-radius:50%; background:#2a2a2a; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:700; color:#fff; flex-shrink:0; }
    .rider-info { flex:1; min-width:0; }
    .rider-name-opt { font-size:14px; font-weight:600; color:#fff; }
    .rider-phone { font-size:11px; color:var(--color-400,#888); font-family:monospace; margin-top:2px; }
    .rider-status-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .dot-active { background:#22c55e; }
    .dot-inactive { background:#555; }
  `]
})
export class OrdersComponent implements OnInit {
  filterType = 'dateRange';
  filterValue = '';
  statusFilter = '';
  loading = false;
  searched = false;
  orders: any[] = [];

  // Assign rider modal
  assigningOrder: any = null;
  ridersList: any[] = [];
  ridersLoading = false;
  assignLoading = false;
  assignSuccess = '';

  // Date range — default to today in IST
  startDate: string = this.todayIST();
  endDate: string = this.todayIST();

  statuses = ['INITIATED','CONFIRMED','ACCEPTED','PREPARING','READY_FOR_PICKUP',
    'AWAITING_RIDER_ASSIGNMENT','OFFERED_TO_RIDER','RIDER_ASSIGNED',
    'PICKED_UP','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'];

  get totalRevenue(): number { return this.orders.reduce((s, o) => s + (+o.grandTotal || 0), 0); }
  get deliveredCount(): number { return this.orders.filter(o => o.status === 'DELIVERED').length; }
  get cancelledCount(): number { return this.orders.filter(o => o.status === 'CANCELLED').length; }

  calcPlatform(o: any): number {
    if (o.revenue?.platformRevenue) {
      const pr = o.revenue.platformRevenue;
      if (pr.finalPayout != null) return +pr.finalPayout;
      return (+pr.foodCommission || 0)
        + (+pr.platformFee || 0)
        + (+pr.excessFromRestaurantRevenue || 0)
        - (+pr.riderDeliverySubsidy || 0)
        - (+pr.couponDiscount || 0)
        - (+pr.itemCouponDiscount || 0)
        - (+pr.longDistanceBonus || 0);
    }
    return Math.round((+o.foodTotal || 0) * 0.15 + (+o.platformFee || 0));
  }
  calcRestaurant(o: any): number {
    if (o.revenue?.restaurantRevenue?.finalPayout != null) return +o.revenue.restaurantRevenue.finalPayout;
    if (o.revenue?.restaurantRevenue?.revenue != null) return +o.revenue.restaurantRevenue.revenue;
    return Math.round((+o.foodTotal || 0) * 0.85);
  }
  calcRider(o: any): number {
    if (o.revenue?.riderRevenue?.finalPayout != null) return +o.revenue.riderRevenue.finalPayout;
    return +o.deliveryFee || 0;
  }
  calcGovt(o: any): number {
    if (o.revenue?.govtRevenue?.finalPayout != null) return +o.revenue.govtRevenue.finalPayout;
    return Math.round(this.calcPlatform(o) * 0.18);
  }

  constructor(private api: ApiService) {}
  ngOnInit(): void {}

  onFilterTypeChange(): void {
    this.filterValue = '';
    this.orders = [];
    this.searched = false;
  }

  private todayIST(): string {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
  }

  search(): void {
    this.searched = true;
    if (this.filterType === 'dateRange') {
      if (!this.startDate || !this.endDate) return;
      this.loading = true;
      this.api.getOrdersByDateRange(this.startDate, this.endDate, this.statusFilter || undefined, 1000).subscribe({
        next: (res: any) => { this.orders = res.orders || []; this.loading = false; },
        error: () => { this.loading = false; }
      });
    } else if (this.filterType === 'orderId') {
      if (!this.filterValue.trim()) return;
      this.loading = true;
      this.api.getOrderById(this.filterValue.trim()).subscribe({
        next: (res: any) => { this.orders = res ? [res] : []; this.loading = false; },
        error: () => { this.orders = []; this.loading = false; }
      });
    } else {
      if (!this.filterValue.trim()) return;
      this.loading = true;
      const params: any = { [this.filterType]: this.filterValue.trim(), limit: 200 };
      if (this.statusFilter) params['status'] = this.statusFilter;
      this.api.get<any>('/api/v1/orders', params).subscribe({
        next: (res: any) => { this.orders = res.orders || []; this.loading = false; },
        error: () => { this.loading = false; }
      });
    }
  }

  openAssign(order: any, e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    this.assigningOrder = order;
    this.ridersList = [];
    this.ridersLoading = true;
    this.assignSuccess = '';
    this.assignLoading = false;
    this.api.listRiders().subscribe({
      next: (res: any) => { this.ridersList = res.riders || (Array.isArray(res) ? res : []); this.ridersLoading = false; },
      error: () => { this.ridersLoading = false; }
    });
  }

  closeAssign(): void {
    this.assigningOrder = null;
    this.assignSuccess = '';
  }

  doAssign(rider: any): void {
    if (!this.assigningOrder || this.assignLoading) return;
    this.assignLoading = true;
    this.api.updateOrderStatus(this.assigningOrder.orderId, 'RIDER_ASSIGNED', rider.riderId).subscribe({
      next: () => {
        const name = rider.firstName ? `${rider.firstName} ${rider.lastName || ''}`.trim() : rider.phone;
        this.assignSuccess = `Assigned to ${name}`;
        this.assigningOrder.riderName = name;
        this.assignLoading = false;
        setTimeout(() => this.closeAssign(), 1500);
      },
      error: () => { this.assignLoading = false; }
    });
  }
}
