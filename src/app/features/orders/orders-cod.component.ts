import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, SlicePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-orders-cod',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DecimalPipe, SlicePipe],
  template: `
<div class="page fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">COD Orders</div>
      <div class="page-subtitle">Cash on Delivery orders — track collection status</div>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="filter-bar" style="padding:0">
      <input type="date" class="form-input" [(ngModel)]="startDate" />
      <span style="color:var(--color-400);font-size:13px">→</span>
      <input type="date" class="form-input" [(ngModel)]="endDate" />
      <button class="btn btn-primary" (click)="load()" [disabled]="loading">
        {{ loading ? 'Loading…' : 'Load COD Orders' }}
      </button>
    </div>
  </div>

  <div class="stats-grid-4" style="margin-bottom:16px" *ngIf="orders.length > 0">
    <div class="stat-card">
      <div class="stat-label">Total COD Orders</div>
      <div class="stat-value">{{ orders.length }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total COD Amount</div>
      <div class="stat-value">₹{{ totalAmount | number:'1.0-0' }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg Order Value</div>
      <div class="stat-value">₹{{ avgAmount | number:'1.0-0' }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Delivered (COD)</div>
      <div class="stat-value" style="color:var(--color-success)">{{ deliveredCount }}</div>
    </div>
  </div>

  <div class="card" style="padding:0;overflow:hidden">
    <div *ngIf="loading" style="padding:32px">
      <div class="skeleton" style="height:56px;margin-bottom:8px;border-radius:8px" *ngFor="let i of [1,2,3,4,5]"></div>
    </div>
    <div *ngIf="!loading && orders.length === 0 && !loaded" class="empty-state">
      <div class="empty-icon">📅</div>
      <h4>Select date range and load</h4>
    </div>
    <div *ngIf="!loading && orders.length === 0 && loaded" class="empty-state">
      <div class="empty-icon">✕</div>
      <h4>No COD orders found</h4>
    </div>

    <!-- Desktop table -->
    <table class="data-table hide-mobile" *ngIf="!loading && orders.length > 0">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Customer</th>
          <th>Rider</th>
          <th>Restaurant</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let o of orders" [routerLink]="['/orders', o.orderId]" style="cursor:pointer">
          <td class="font-mono" style="font-size:11px">{{ o.orderId }}</td>
          <td><strong style="color:var(--color-warning)">₹{{ o.grandTotal }}</strong></td>
          <td><span [class]="'status-' + o.status">{{ o.status }}</span></td>
          <td class="font-mono" style="font-size:11px">{{ o.receiverPhone }}</td>
          <td>{{ o.riderName || '—' }}</td>
          <td style="font-size:11px">{{ o.restaurantName || o.restaurantId }}</td>
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
          <span class="mc-val font-mono">{{ o.receiverPhone }}</span>
        </div>
        <div class="mc-row">
          <span class="mc-label">Rider</span>
          <span class="mc-val">{{ o.riderName || '—' }}</span>
        </div>
        <div class="mc-footer">
          <span class="mc-amount" style="color:var(--color-warning)">₹{{ o.grandTotal }}</span>
          <span class="mc-meta">COD &middot; {{ o.createdAt | slice:0:16 }}</span>
        </div>
      </a>
    </div>
  </div>
</div>
  `,
  styles: [`
    .page { padding: 24px; }
    @media (max-width: 768px) { .page { padding: 12px; } }
  `]
})
export class OrdersCodComponent implements OnInit {
  loading = false;
  loaded = false;
  orders: any[] = [];

  startDate: string = this.todayIST();
  endDate: string = this.todayIST();

  get totalAmount(): number { return this.orders.reduce((s, o) => s + (+o.grandTotal || 0), 0); }
  get avgAmount(): number { return this.orders.length ? this.totalAmount / this.orders.length : 0; }
  get deliveredCount(): number { return this.orders.filter(o => o.status === 'DELIVERED').length; }

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  private todayIST(): string {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
  }

  load(): void {
    if (!this.startDate || !this.endDate) return;
    this.loading = true;
    this.api.getOrdersByDateRange(this.startDate, this.endDate, undefined, 1000).subscribe({
      next: (res: any) => {
        this.orders = (res.orders || []).filter((o: any) => o.paymentMethod === 'COD');
        this.loading = false;
        this.loaded = true;
      },
      error: () => { this.loading = false; this.loaded = true; }
    });
  }
}
