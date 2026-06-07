import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-restaurant-earnings',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DecimalPipe],
  template: `
<div class="page fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Restaurant Earnings</div>
      <div class="page-subtitle">Revenue, commission, GST breakdown and settlement management</div>
    </div>
  </div>

  <!-- Filter -->
  <div class="card filter-card">
    <div class="filter-grid">
      <div class="form-group" style="position:relative">
        <label>Restaurant</label>
        <div class="combobox-wrap">
          <input class="form-input"
                 [(ngModel)]="restSearch"
                 (focus)="restDropOpen=true"
                 (input)="restDropOpen=true"
                 (blur)="scheduleCloseRest()"
                 [placeholder]="restsLoading ? 'Loading...' : 'Search by name...'"
                 [disabled]="restsLoading"
                 autocomplete="off" />
          <span class="combobox-clear" *ngIf="selectedRest" (mousedown)="clearRest()">&times;</span>
        </div>
        <div *ngIf="selectedRest" class="rest-chip">
          <span class="dot" [style.background]="selectedRest.isOpen ? '#22c55e' : '#94a3b8'"></span>
          <span class="font-600">{{ selectedRest.name }}</span>
          <span class="font-mono text-xs text-tertiary">{{ selectedRest.restaurantId }}</span>
        </div>
        <div class="search-dropdown" *ngIf="restDropOpen && filteredRests.length > 0">
          <div *ngFor="let r of filteredRests" class="search-option"
               [class.search-option-selected]="selectedRest?.restaurantId === r.restaurantId"
               (mousedown)="pickRest(r)">
            <span class="dot" [style.background]="r.isOpen ? '#22c55e' : '#94a3b8'"></span>
            <div>
              <div class="search-option-name">{{ r.name }}</div>
              <div class="search-option-sub">{{ r.restaurantId }}</div>
            </div>
          </div>
        </div>
        <div class="search-dropdown" *ngIf="restDropOpen && !restsLoading && filteredRests.length===0 && restSearch">
          <div class="search-option-empty">No restaurants match "{{ restSearch }}"</div>
        </div>
      </div>

      <div class="form-group">
        <label>Start Date</label>
        <input class="form-input" type="date" [(ngModel)]="startDate" />
      </div>
      <div class="form-group">
        <label>End Date</label>
        <input class="form-input" type="date" [(ngModel)]="endDate" />
      </div>
      <div class="form-group align-end">
        <button class="btn btn-primary btn-sm" (click)="load()" [disabled]="!restaurantId || loading">
          {{ loading ? 'Loading...' : 'Load Earnings' }}
        </button>
      </div>
    </div>
  </div>

  <div *ngIf="loading" class="card center-msg">Loading earnings...</div>
  <div *ngIf="!restaurantId && !loading" class="card center-msg">Select a restaurant to view earnings</div>

  <ng-container *ngIf="preview && !loading">

    <!-- Summary Stats -->
    <div class="stats-grid-re">
      <div class="stat-card">
        <div class="stat-label">Gross Revenue (GMV)</div>
        <div class="stat-value">{{ preview.totalGMV | currency:'INR':'symbol':'1.0-0' }}</div>
        <div class="stat-sub">{{ preview.totalOrders || 0 }} orders</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Platform Commission</div>
        <div class="stat-value" style="color:var(--color-error)">{{ preview.totalCommission | currency:'INR':'symbol':'1.0-0' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">GST on Commission (18%)</div>
        <div class="stat-value" style="color:var(--color-error)">{{ gstOnCommission | currency:'INR':'symbol':'1.0-0' }}</div>
        <div class="stat-sub">Govt. payout</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Coupon Deductions</div>
        <div class="stat-value" style="color:var(--color-warning)">{{ preview.totalCouponDeduction | currency:'INR':'symbol':'1.0-0' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Net Payable to Rest.</div>
        <div class="stat-value" style="color:var(--color-success)">{{ preview.netPayable | currency:'INR':'symbol':'1.0-0' }}</div>
      </div>
      <div class="stat-card settled-stat">
        <div class="stat-label">Settled</div>
        <div class="stat-value" style="color:var(--color-success)">{{ settledTotal | currency:'INR':'symbol':'1.0-0' }}</div>
        <div class="stat-sub">{{ settledItems.length }} orders</div>
      </div>
      <div class="stat-card unsettled-stat">
        <div class="stat-label">Unsettled</div>
        <div class="stat-value" style="color:var(--color-error)">{{ unsettledTotal | currency:'INR':'symbol':'1.0-0' }}</div>
        <div class="stat-sub">{{ unsettledItems.length }} orders</div>
      </div>
    </div>

    <!-- ── UNSETTLED SECTION ── -->
    <div class="card section-card" *ngIf="unsettledItems.length > 0">
      <div class="section-header">
        <div class="section-title-row">
          <span class="section-title">&#9888; Unsettled Earnings</span>
          <span class="badge badge-error">{{ unsettledItems.length }} orders &middot; &#8377;{{ unsettledTotal | number:'1.0-0' }}</span>
        </div>
        <div class="settle-actions" *ngIf="selectedUnsettled.length > 0">
          <input class="form-input settle-id-input" [(ngModel)]="settlementId" placeholder="Enter Settlement ID (e.g. RST-2025-001)" />
          <button class="btn btn-success btn-sm" (click)="markSettled()" [disabled]="!settlementId || settling">
            {{ settling ? 'Settling...' : 'Mark ' + selectedUnsettled.length + ' as Settled' }}
          </button>
        </div>
      </div>

      <!-- Desktop table -->
      <div class="table-wrap hide-mobile">
        <table class="data-table">
          <thead>
            <tr>
              <th><input type="checkbox" (change)="toggleSelectAll($event)" [checked]="allUnsettledSelected" /></th>
              <th>Order ID</th>
              <th>Date</th>
              <th>Order Value</th>
              <th>Commission</th>
              <th>Coupon Deduct.</th>
              <th>Net Payout</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let o of unsettledItems">
              <td><input type="checkbox" [checked]="isSelected(o.orderId)" (change)="toggleSelect(o.orderId)" /></td>
              <td class="font-mono text-xs">
                <button class="order-link" (click)="navigateToOrder(o.orderId)">{{ o.orderId | slice:0:16 }}&hellip;</button>
              </td>
              <td class="text-secondary">{{ o.date | slice:0:10 }}</td>
              <td class="font-mono">&#8377;{{ o.orderValue | number:'1.0-0' }}</td>
              <td class="font-mono" style="color:var(--color-error)">&#8377;{{ o.foodCommission | number:'1.0-0' }}</td>
              <td class="font-mono" style="color:var(--color-warning)">{{ o.couponDeduction > 0 ? ('&#8377;' + (o.couponDeduction | number:'1.0-0')) : '&#8212;' }}</td>
              <td class="font-mono font-600" style="color:var(--color-success)">&#8377;{{ o.netPayout | number:'1.0-0' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <div class="mobile-list show-mobile">
        <div class="mobile-card earn-card" *ngFor="let o of unsettledItems" [class.earn-card-selected]="isSelected(o.orderId)" (click)="toggleSelect(o.orderId)">
          <div class="ec-check">
            <input type="checkbox" [checked]="isSelected(o.orderId)" (click)="$event.stopPropagation(); toggleSelect(o.orderId)" />
          </div>
          <div class="ec-body">
            <div class="ec-top">
              <div>
                <span class="font-mono text-xs">{{ o.orderId | slice:0:18 }}&hellip;</span>
                <button class="order-link-sm" (click)="$event.stopPropagation(); navigateToOrder(o.orderId)">&#8599;</button>
              </div>
              <span class="ec-payout">&#8377;{{ o.netPayout | number:'1.0-0' }}</span>
            </div>
            <div class="ec-meta">
              <span>{{ o.date | slice:0:10 }}</span>
              <span>GMV &#8377;{{ o.orderValue | number:'1.0-0' }}</span>
              <span style="color:var(--color-error)">Comm. &#8377;{{ o.foodCommission | number:'1.0-0' }}</span>
            </div>
          </div>
        </div>
        <div class="mobile-select-all" *ngIf="unsettledItems.length > 0">
          <label>
            <input type="checkbox" (change)="toggleSelectAll($event)" [checked]="allUnsettledSelected" />
            Select all {{ unsettledItems.length }} orders
          </label>
        </div>
      </div>
    </div>

    <!-- ── SETTLED SECTION ── -->
    <div class="card section-card">
      <div class="section-header">
        <div class="section-title-row">
          <span class="section-title">&#10003; Settled Earnings</span>
          <span class="badge badge-success" *ngIf="settledItems.length > 0">{{ settledItems.length }} orders &middot; &#8377;{{ settledTotal | number:'1.0-0' }}</span>
        </div>
        <button class="btn btn-secondary btn-sm" (click)="loadHistory()" [disabled]="historyLoading">
          {{ historyLoading ? 'Loading...' : 'Refresh History' }}
        </button>
      </div>

      <div *ngIf="settleSuccess" class="settle-success-bar">
        Settlement confirmed! ID: <strong>{{ lastSettlementId }}</strong>
      </div>

      <div *ngIf="settledItems.length === 0 && !historyLoading" class="empty-row">No settled records found for this period</div>
      <div *ngIf="historyLoading" class="empty-row">Loading history...</div>

      <!-- Desktop table -->
      <div class="table-wrap hide-mobile" *ngIf="settledItems.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Total Earnings</th>
              <th>Settlement ID</th>
              <th>Settled At</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let h of settledItems">
              <td class="font-mono text-xs">
                <button class="order-link" (click)="navigateToOrder(h.orderId)">{{ h.orderId | slice:0:16 }}&hellip;</button>
              </td>
              <td class="text-secondary">{{ h.date | slice:0:10 }}</td>
              <td class="font-mono font-600" style="color:var(--color-success)">&#8377;{{ h.totalEarnings | number:'1.0-0' }}</td>
              <td class="font-mono text-xs text-tertiary">{{ h.settlementId || '&#8212;' }}</td>
              <td class="text-secondary text-xs">{{ h.settledAt ? (h.settledAt | slice:0:10) : '&#8212;' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <div class="mobile-list show-mobile" *ngIf="settledItems.length > 0">
        <div class="mobile-card earn-card earn-card-settled" *ngFor="let h of settledItems">
          <div class="ec-body">
            <div class="ec-top">
              <div>
                <span class="font-mono text-xs">{{ h.orderId | slice:0:18 }}&hellip;</span>
                <button class="order-link-sm" (click)="navigateToOrder(h.orderId)">&#8599;</button>
              </div>
              <span class="ec-payout" style="color:var(--color-success)">&#8377;{{ h.totalEarnings | number:'1.0-0' }}</span>
            </div>
            <div class="ec-meta">
              <span>{{ h.date | slice:0:10 }}</span>
              <span class="font-mono text-xs">{{ h.settlementId || 'No ID' }}</span>
              <span>{{ h.settledAt ? (h.settledAt | slice:0:10) : '&#8212;' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </ng-container>
</div>
  `,
  styles: [`
    .page { padding: 24px; }
    .filter-card { padding: 16px; margin-bottom: 16px; }
    .filter-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr auto;
      gap: 12px;
      align-items: start;
    }
    .align-end { display: flex; justify-content: flex-end; align-items: flex-end; }
    .center-msg { padding: 40px; text-align: center; color: var(--color-400); }

    .stats-grid-re {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }

    .section-card { margin-bottom: 16px; overflow: hidden; }
    .section-header {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-bottom: 1px solid var(--color-border); gap: 8px;
    }
    .section-title-row { display: flex; align-items: center; gap: 10px; }
    .section-title { font-size: 13px; font-weight: 600; }
    .settle-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .settle-id-input { width: 260px; height: 34px; }
    .table-wrap { overflow-x: auto; }
    .empty-row { padding: 24px; text-align: center; color: var(--color-400); font-size: 13px; }
    .settle-success-bar {
      padding: 10px 16px; background: var(--color-success-bg);
      color: var(--color-success); font-size: 13px; border-bottom: 1px solid var(--color-success-border);
    }

    /* Combobox */
    .combobox-wrap { position: relative; }
    .combobox-clear {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      cursor: pointer; color: var(--color-400); font-size: 12px; padding: 2px 4px;
    }
    .rest-chip {
      display: flex; align-items: center; gap: 6px; margin-top: 6px;
      padding: 4px 8px; background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border); border-radius: 6px; font-size: 12px;
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .search-dropdown {
      position: absolute; top: calc(100% + 2px); left: 0; right: 0;
      background: var(--color-bg-elevated); border: 1px solid var(--color-border);
      border-radius: 8px; box-shadow: var(--shadow-lg); z-index: 200;
      max-height: 280px; overflow-y: auto;
    }
    .search-option {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 12px; cursor: pointer;
      border-bottom: 1px solid var(--color-border-light);
    }
    .search-option:last-child { border-bottom: none; }
    .search-option:hover, .search-option-selected { background: var(--color-bg-hover); }
    .search-option-name { font-size: 13px; font-weight: 600; }
    .search-option-sub { font-size: 11px; color: var(--color-text-secondary); margin-top: 2px; }
    .search-option-empty { padding: 16px; text-align: center; font-size: 13px; color: var(--color-400); }

    /* Earn cards (mobile) */
    .earn-card {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 14px; border-bottom: 1px solid var(--color-border-light);
      cursor: pointer; transition: background 0.1s;
    }
    .earn-card:last-child { border-bottom: none; }
    .earn-card:hover { background: var(--color-bg-hover); }
    .earn-card-selected { background: rgba(239,68,68,0.06); }
    .earn-card-settled { cursor: default; }
    .ec-check { flex-shrink: 0; }
    .ec-body { flex: 1; min-width: 0; }
    .ec-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 4px; }
    .ec-payout { font-size: 14px; font-weight: 700; color: var(--color-text-primary); flex-shrink: 0; }
    .ec-meta { display: flex; gap: 10px; flex-wrap: wrap; font-size: 11px; color: var(--color-text-secondary); }
    .mobile-select-all {
      padding: 10px 14px; border-top: 1px solid var(--color-border);
      font-size: 12px; color: var(--color-text-secondary);
      display: flex; align-items: center; gap: 8px;
    }
    .mobile-select-all label { display: flex; align-items: center; gap: 6px; cursor: pointer; }

    /* Order links */
    .order-link {
      background: none; border: none; padding: 0; margin: 0; cursor: pointer;
      color: var(--color-primary); font-family: var(--font-family-mono, monospace); font-size: 11px;
      text-decoration: underline; text-decoration-style: dotted; text-underline-offset: 2px;
    }
    .order-link:hover { text-decoration-style: solid; }
    .order-link-sm {
      background: none; border: none; padding: 0 0 0 4px; cursor: pointer;
      color: var(--color-primary); font-size: 12px; vertical-align: middle;
    }
    .order-link-sm:hover { color: var(--color-primary-dark, var(--color-primary)); }

    /* Mobile responsive */
    @media (max-width: 1100px) {
      .stats-grid-re { grid-template-columns: repeat(4, 1fr); }
    }
    @media (max-width: 900px) {
      .filter-grid { grid-template-columns: 1fr 1fr; }
      .stats-grid-re { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 600px) {
      .page { padding: 12px; }
      .filter-grid { grid-template-columns: 1fr; }
      .stats-grid-re { grid-template-columns: 1fr 1fr; }
      .settle-id-input { width: 100%; }
      .settle-actions { flex-direction: column; align-items: stretch; width: 100%; }
    }
  `]
})
export class RestaurantEarningsComponent implements OnInit {
  restaurantId = '';
  startDate = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  endDate = new Date().toISOString().slice(0, 10);
  preview: any = null;
  settledHistory: any[] = [];
  loading = false;
  historyLoading = false;
  settling = false;
  settleSuccess = false;
  lastSettlementId = '';
  settlementId = '';
  selectedUnsettled: string[] = [];

  allRests: any[] = [];
  restsLoading = false;
  restSearch = '';
  restDropOpen = false;
  selectedRest: any = null;

  private _closeRestTimer: any;

  get filteredRests(): any[] {
    const q = this.restSearch.toLowerCase().trim();
    if (!q) return this.allRests;
    return this.allRests.filter(r =>
      (r.name || '').toLowerCase().includes(q) || (r.restaurantId || '').toLowerCase().includes(q)
    );
  }

  get gstOnCommission(): number {
    return (this.preview?.totalCommission || 0) * 0.18;
  }

  get unsettledItems(): any[] {
    return (this.preview?.orders || []).filter((o: any) => !o.settled);
  }

  get settledItems(): any[] {
    return this.settledHistory.filter((h: any) => h.settled);
  }

  get unsettledTotal(): number {
    return this.unsettledItems.reduce((s: number, o: any) => s + (o.netPayout || 0), 0);
  }

  get settledTotal(): number {
    return this.settledItems.reduce((s: number, h: any) => s + (h.totalEarnings || 0), 0);
  }

  get allUnsettledSelected(): boolean {
    return this.unsettledItems.length > 0 &&
      this.unsettledItems.every((o: any) => this.selectedUnsettled.includes(o.orderId));
  }

  isSelected(orderId: string): boolean { return this.selectedUnsettled.includes(orderId); }

  toggleSelect(orderId: string): void {
    const idx = this.selectedUnsettled.indexOf(orderId);
    if (idx >= 0) this.selectedUnsettled.splice(idx, 1);
    else this.selectedUnsettled.push(orderId);
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedUnsettled = checked ? this.unsettledItems.map((o: any) => o.orderId) : [];
  }

  pickRest(r: any): void {
    this.selectedRest = r;
    this.restaurantId = r.restaurantId;
    this.restSearch = r.name;
    this.restDropOpen = false;
    this.load();
  }

  clearRest(): void {
    this.selectedRest = null;
    this.restaurantId = '';
    this.restSearch = '';
    this.restDropOpen = false;
    this.preview = null;
    this.settledHistory = [];
    this.selectedUnsettled = [];
  }

  scheduleCloseRest(): void {
    this._closeRestTimer = setTimeout(() => { this.restDropOpen = false; }, 150);
  }

  constructor(private api: ApiService, private router: Router) {}

  navigateToOrder(orderId: string): void {
    if (orderId) this.router.navigate(['/orders', orderId]);
  }

  ngOnInit(): void {
    this.restsLoading = true;
    this.api.listRestaurants().subscribe({
      next: (res: any) => {
        this.allRests = (res.restaurants || []).sort((a: any, b: any) =>
          (a.name || '').localeCompare(b.name || ''));
        this.restsLoading = false;
      },
      error: () => { this.restsLoading = false; }
    });
  }

  load(): void {
    if (!this.restaurantId) return;
    this.loading = true;
    this.preview = null;
    this.settleSuccess = false;
    this.selectedUnsettled = [];
    this.api.getRestaurantEarnings(this.restaurantId, this.startDate, this.endDate).subscribe({
      next: (res: any) => {
        this.preview = res;
        this.loading = false;
        this.loadHistory();
      },
      error: () => { this.loading = false; }
    });
  }

  loadHistory(): void {
    if (!this.restaurantId) return;
    this.historyLoading = true;
    this.api.getRestaurantEarningsHistory(this.restaurantId, this.startDate, this.endDate).subscribe({
      next: (res: any) => {
        this.settledHistory = res.history || [];
        this.historyLoading = false;
      },
      error: () => { this.historyLoading = false; }
    });
  }

  markSettled(): void {
    if (!this.settlementId || this.selectedUnsettled.length === 0) return;
    this.settling = true;
    this.api.settleRestaurantEarnings(this.restaurantId, {
      orderIds: [...this.selectedUnsettled],
      startDate: this.startDate,
      endDate: this.endDate,
      settlementId: this.settlementId
    }).subscribe({
      next: (res: any) => {
        this.settling = false;
        this.lastSettlementId = res.settlementId || this.settlementId;
        this.settleSuccess = true;
        this.settlementId = '';
        this.selectedUnsettled = [];
        this.load();
      },
      error: () => { this.settling = false; }
    });
  }
}


