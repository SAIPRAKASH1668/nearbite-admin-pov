import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-rider-earnings',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DecimalPipe],
  template: `
<div class="page fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Rider Earnings</div>
      <div class="page-subtitle">Full earnings breakdown, history, and settlement management</div>
    </div>
  </div>

  <!-- Search Bar -->
  <div class="card filter-card">
    <div class="filter-grid">

      <!-- Rider picker -->
      <div class="form-group rider-picker-col" style="position:relative">
        <label>Rider</label>
        <div class="combobox-wrap" [class.combobox-loading]="ridersLoading">
          <input class="form-input"
                 [(ngModel)]="riderSearch"
                 (focus)="riderDropOpen = true"
                 (input)="riderDropOpen = true"
                 (blur)="scheduleCloseRider()"
                 [placeholder]="ridersLoading ? 'Loading riders...' : 'Search by name or phone...'"
                 [disabled]="ridersLoading"
                 autocomplete="off" />
          <span class="combobox-clear" *ngIf="selectedRider" (mousedown)="clearRider()">&times;</span>
        </div>
        <div *ngIf="selectedRider" class="rider-chip">
          <span class="rider-dot" [style.background]="selectedRider.isActive ? '#22c55e' : '#94a3b8'"></span>
          <span class="font-600">{{ riderLabel(selectedRider) }}</span>
          <span class="font-mono text-xs text-tertiary">{{ selectedRider.riderId }}</span>
        </div>
        <div class="search-dropdown" *ngIf="riderDropOpen && filteredRiders.length > 0">
          <div *ngFor="let r of filteredRiders" class="search-option"
               [class.search-option-selected]="selectedRider?.riderId === r.riderId"
               (mousedown)="pickRider(r)">
            <span class="rider-dot" [style.background]="r.isActive ? '#22c55e' : '#94a3b8'"></span>
            <div>
              <div class="search-option-name">{{ riderLabel(r) }}</div>
              <div class="search-option-sub">{{ r.phone }} &middot; {{ r.workingOnOrder?.length || 0 }} active</div>
            </div>
          </div>
        </div>
        <div class="search-dropdown" *ngIf="riderDropOpen && !ridersLoading && filteredRiders.length === 0 && riderSearch">
          <div class="search-option-empty">No riders match "{{ riderSearch }}"</div>
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
        <button class="btn btn-primary btn-sm" (click)="loadEarnings()" [disabled]="!riderId || loading">
          {{ loading ? 'Loading...' : 'Load Earnings' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Loading -->
  <div *ngIf="loading" class="card center-msg">Loading earnings...</div>
  <div *ngIf="!riderId && !loading" class="card center-msg">Select a rider above to view their earnings</div>

  <!-- Data -->
  <ng-container *ngIf="summary && !loading">

    <!-- Summary Stats -->
    <div class="stats-grid-re">
      <div class="stat-card">
        <div class="stat-label">Total Earnings</div>
        <div class="stat-value">{{ summary.totalEarnings | currency:'INR':'symbol':'1.0-0' }}</div>
        <div class="stat-sub">{{ summary.totalDeliveries || 0 }} deliveries</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Delivery Fees</div>
        <div class="stat-value">{{ summary.deliveryEarnings | currency:'INR':'symbol':'1.0-0' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Tips</div>
        <div class="stat-value" style="color:var(--color-success)">{{ summary.totalTips | currency:'INR':'symbol':'1.0-0' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Incentives</div>
        <div class="stat-value" style="color:var(--color-warning)">{{ summary.totalIncentives | currency:'INR':'symbol':'1.0-0' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Bonus Earnings</div>
        <div class="stat-value" style="color:var(--color-info)">{{ summary.totalBonusEarnings | currency:'INR':'symbol':'1.0-0' }}</div>
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
      <div class="stat-card cod-stat" *ngIf="summary.totalCashCollected > 0">
        <div class="stat-label">COD Cash Collected</div>
        <div class="stat-value" style="color:var(--color-warning)">{{ summary.totalCashCollected | currency:'INR':'symbol':'1.0-0' }}</div>
        <div class="stat-sub">Return to platform</div>
      </div>
    </div>

    <!-- Unsettled Section -->
    <div class="card section-card" *ngIf="unsettledItems.length > 0">
      <div class="section-header">
        <div class="section-title-row">
          <span class="section-title">&#9888; Unsettled Earnings</span>
          <span class="badge badge-error">{{ unsettledItems.length }} orders &middot; &#8377;{{ unsettledTotal | number:'1.0-0' }}</span>
        </div>
        <div class="settle-actions" *ngIf="selectedUnsettled.length > 0">
          <input class="form-input settle-id-input" [(ngModel)]="settlementId" placeholder="Enter Settlement ID (e.g. SET-2025-001)" />
          <button class="btn btn-success btn-sm" (click)="markSettled()" [disabled]="!settlementId || settling">
            {{ settling ? 'Settling...' : 'Mark ' + selectedUnsettled.length + ' as Settled' }}
          </button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th><input type="checkbox" (change)="toggleSelectAll($event)" [checked]="allUnsettledSelected" /></th>
              <th>Order ID</th>
              <th>Date</th>
              <th>Type</th>
              <th>Delivery Fee</th>
              <th>Tips</th>
              <th>Incentives</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let h of unsettledItems">
              <td><input type="checkbox" [checked]="isSelected(h.orderId)" (change)="toggleSelect(h.orderId)" /></td>
              <td class="font-mono text-xs">
                <button class="order-link" *ngIf="h.orderId" (click)="navigateToOrder(h.orderId)">{{ h.orderId | slice:0:16 }}&hellip;</button>
                <span *ngIf="!h.orderId" class="text-tertiary">{{ h.bonusLabel || '&mdash;' }}</span>
              </td>
              <td class="text-secondary">{{ h.date | slice:0:10 }}</td>
              <td><span class="badge badge-neutral text-xs">{{ h.entryType || 'DELIVERY' }}</span></td>
              <td class="font-mono">&#8377;{{ h.deliveryFees | number:'1.0-0' }}</td>
              <td class="font-mono" style="color:var(--color-success)">{{ h.tips > 0 ? '&#8377;' + (h.tips | number:'1.0-0') : '&mdash;' }}</td>
              <td class="font-mono" style="color:var(--color-warning)">{{ h.incentives > 0 ? '&#8377;' + (h.incentives | number:'1.0-0') : '&mdash;' }}</td>
              <td class="font-mono font-600">&#8377;{{ h.totalEarnings | number:'1.0-0' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Settled Section -->
    <div class="card section-card">
      <div class="section-header">
        <div class="section-title-row">
          <span class="section-title">&#10003; Settled Earnings</span>
          <span class="badge badge-success">{{ settledItems.length }} orders &middot; &#8377;{{ settledTotal | number:'1.0-0' }}</span>
        </div>
      </div>
      <div *ngIf="settledItems.length === 0" class="empty-row">No settled earnings in this period</div>
      <div class="table-wrap" *ngIf="settledItems.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Type</th>
              <th>Delivery Fee</th>
              <th>Tips</th>
              <th>Incentives</th>
              <th>Total</th>
              <th>Settlement ID</th>
              <th>Settled At</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let h of settledItems">
              <td class="font-mono text-xs">
                <button class="order-link" *ngIf="h.orderId" (click)="navigateToOrder(h.orderId)">{{ h.orderId | slice:0:16 }}&hellip;</button>
                <span *ngIf="!h.orderId" class="text-tertiary">{{ h.bonusLabel || '&mdash;' }}</span>
              </td>
              <td class="text-secondary">{{ h.date | slice:0:10 }}</td>
              <td><span class="badge badge-neutral text-xs">{{ h.entryType || 'DELIVERY' }}</span></td>
              <td class="font-mono">&#8377;{{ h.deliveryFees | number:'1.0-0' }}</td>
              <td class="font-mono" style="color:var(--color-success)">{{ h.tips > 0 ? '&#8377;' + (h.tips | number:'1.0-0') : '&mdash;' }}</td>
              <td class="font-mono" style="color:var(--color-warning)">{{ h.incentives > 0 ? '&#8377;' + (h.incentives | number:'1.0-0') : '&mdash;' }}</td>
              <td class="font-mono font-600">&#8377;{{ h.totalEarnings | number:'1.0-0' }}</td>
              <td class="font-mono text-xs text-tertiary">{{ h.settlementId || '&mdash;' }}</td>
              <td class="text-secondary text-xs">{{ h.settledAt ? (h.settledAt | slice:0:10) : '&mdash;' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- COD Cash Collected Section -->
    <div class="card section-card cod-section" *ngIf="codItems.length > 0">
      <div class="section-header">
        <div class="section-title-row">
          <span class="section-title">&#128181; COD Cash Collected</span>
          <span class="badge badge-warning">{{ codItems.length }} orders &middot; &#8377;{{ summary.totalCashCollected | number:'1.0-0' }}</span>
        </div>
        <span class="cod-note">Cash held by rider on behalf of platform &mdash; must be returned before settlement</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Cash Collected</th>
              <th>Action Required</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of codItems" class="cod-row">
              <td class="font-mono text-xs">
                <button class="order-link" (click)="navigateToOrder(c.orderId)">{{ c.orderId | slice:0:16 }}&hellip;</button>
              </td>
              <td class="text-secondary">{{ c.date | slice:0:10 }}</td>
              <td class="font-mono font-600 cod-amount">&#8377;{{ c.cashCollected | number:'1.0-0' }}</td>
              <td><span class="badge badge-warning text-xs">&#8617; Return to Platform</span></td>
            </tr>
          </tbody>
        </table>
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
    .rider-picker-col { position: relative; }
    .align-end { justify-content: flex-end; align-items: flex-end; display: flex; }
    .center-msg { padding: 40px; text-align: center; color: var(--color-400); }

    .stats-grid-re {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
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

    /* Combobox */
    .combobox-wrap { position: relative; }
    .combobox-clear {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      cursor: pointer; color: var(--color-400); font-size: 12px; padding: 2px 4px;
    }
    .rider-chip {
      display: flex; align-items: center; gap: 6px; margin-top: 6px;
      padding: 4px 8px; background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border); border-radius: 6px; font-size: 12px;
    }
    .rider-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .search-dropdown {
      position: absolute; top: calc(100% + 2px); left: 0; right: 0;
      background: var(--color-bg-elevated); border: 1px solid var(--color-border);
      border-radius: 8px; box-shadow: var(--shadow-lg); z-index: 200;
      max-height: 280px; overflow-y: auto;
    }
    .search-option {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 12px; cursor: pointer; transition: background 0.1s;
      border-bottom: 1px solid var(--color-border-light);
    }
    .search-option:last-child { border-bottom: none; }
    .search-option:hover, .search-option-selected { background: var(--color-bg-hover); }
    .search-option-name { font-size: 13px; font-weight: 600; }
    .search-option-sub { font-size: 11px; color: var(--color-text-secondary); margin-top: 2px; }
    .search-option-empty { padding: 16px; text-align: center; font-size: 13px; color: var(--color-400); }

    /* Order link */
    .order-link {
      background: none; border: none; padding: 0; margin: 0; cursor: pointer;
      color: var(--color-primary); font-family: var(--font-family-mono, monospace); font-size: 11px;
      text-decoration: underline; text-decoration-style: dotted; text-underline-offset: 2px;
    }
    .order-link:hover { text-decoration-style: solid; }

    /* COD section */
    .cod-section { border-left: 3px solid var(--color-warning, #f59e0b); }
    .cod-note { font-size: 11px; color: var(--color-text-secondary); }
    .cod-row { background: rgba(245, 158, 11, 0.04); }
    .cod-amount { color: var(--color-warning, #f59e0b) !important; }
    .cod-stat { border-top: 2px solid var(--color-warning, #f59e0b); }

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
      .settle-actions { flex-direction: column; align-items: stretch; }
    }
  `]
})
export class RiderEarningsComponent implements OnInit {
  riderId = '';
  startDate = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  endDate = new Date().toISOString().slice(0, 10);
  summary: any = null;
  historyItems: any[] = [];
  loading = false;
  settling = false;
  settlementId = '';

  allRiders: any[] = [];
  ridersLoading = false;
  riderSearch = '';
  riderDropOpen = false;
  selectedRider: any = null;
  selectedUnsettled: string[] = [];

  private _closeRiderTimer: any;

  get filteredRiders(): any[] {
    const q = this.riderSearch.toLowerCase().trim();
    if (!q) return this.allRiders;
    return this.allRiders.filter(r => {
      const name = `${r.firstName || ''} ${r.lastName || ''}`.toLowerCase();
      return name.includes(q) || (r.phone || '').includes(q) || (r.riderId || '').includes(q);
    });
  }

  get codItems(): any[] { return this.historyItems.filter(h => h.entryType === 'COD_AMOUNT_COLLECTED'); }
  get unsettledItems(): any[] { return this.historyItems.filter(h => !h.settled && h.entryType !== 'COD_AMOUNT_COLLECTED'); }
  get settledItems(): any[] { return this.historyItems.filter(h => h.settled && h.entryType !== 'COD_AMOUNT_COLLECTED'); }
  get unsettledTotal(): number { return this.unsettledItems.reduce((s, h) => s + (h.totalEarnings || 0), 0); }
  get settledTotal(): number { return this.settledItems.reduce((s, h) => s + (h.totalEarnings || 0), 0); }
  get allUnsettledSelected(): boolean {
    return this.unsettledItems.length > 0 && this.unsettledItems.every(h => this.selectedUnsettled.includes(h.orderId));
  }

  riderLabel(r: any): string {
    if (!r) return '';
    return `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.riderId?.slice(0, 12) || 'Rider';
  }

  isSelected(orderId: string): boolean { return this.selectedUnsettled.includes(orderId); }

  toggleSelect(orderId: string): void {
    const idx = this.selectedUnsettled.indexOf(orderId);
    if (idx >= 0) this.selectedUnsettled.splice(idx, 1);
    else this.selectedUnsettled.push(orderId);
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedUnsettled = checked ? this.unsettledItems.map(h => h.orderId) : [];
  }

  pickRider(r: any): void {
    this.selectedRider = r;
    this.riderId = r.riderId;
    this.riderSearch = this.riderLabel(r);
    this.riderDropOpen = false;
    this.loadEarnings();
  }

  clearRider(): void {
    this.selectedRider = null;
    this.riderId = '';
    this.riderSearch = '';
    this.riderDropOpen = false;
    this.summary = null;
    this.historyItems = [];
  }

  scheduleCloseRider(): void {
    this._closeRiderTimer = setTimeout(() => { this.riderDropOpen = false; }, 150);
  }

  constructor(private api: ApiService, private router: Router) {}

  navigateToOrder(orderId: string): void {
    if (orderId) this.router.navigate(['/orders', orderId]);
  }

  ngOnInit(): void {
    this.ridersLoading = true;
    this.api.listRiders().subscribe({
      next: (res: any) => {
        this.allRiders = (res.riders || []).sort((a: any, b: any) =>
          this.riderLabel(a).localeCompare(this.riderLabel(b)));
        this.ridersLoading = false;
      },
      error: () => { this.ridersLoading = false; }
    });
  }

  loadEarnings(): void {
    if (!this.riderId) return;
    this.loading = true;
    this.summary = null;
    this.historyItems = [];
    this.selectedUnsettled = [];
    this.api.getRiderEarningsHistory(this.riderId, this.startDate, this.endDate).subscribe({
      next: (res: any) => {
        const items: any[] = res.history || [];
        this.historyItems = items;
        // Use server-provided totals (backend already excludes COD rows from totalEarnings)
        this.summary = {
          totalDeliveries: res.totalDeliveries || 0,
          totalEarnings: res.totalEarnings || 0,
          deliveryEarnings: res.deliveryEarnings || 0,
          totalTips: res.totalTips || 0,
          totalIncentives: res.totalIncentives || 0,
          totalBonusEarnings: res.totalBonusEarnings || 0,
          totalCashCollected: res.totalCashCollected || 0,
        };
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  markSettled(): void {
    if (!this.settlementId || this.selectedUnsettled.length === 0) return;
    this.settling = true;
    this.api.settleRiderEarnings(this.riderId, {
      orderIds: [...this.selectedUnsettled],
      startDate: this.startDate,
      endDate: this.endDate,
      settlementId: this.settlementId
    }).subscribe({
      next: () => {
        this.settling = false;
        this.settlementId = '';
        this.selectedUnsettled = [];
        this.loadEarnings(); // refresh
      },
      error: () => { this.settling = false; }
    });
  }
}

