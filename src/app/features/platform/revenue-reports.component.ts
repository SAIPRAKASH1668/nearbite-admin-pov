import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-revenue-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DecimalPipe, DatePipe],
  template: `
<div class="page fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Revenue Reports</div>
      <div class="page-subtitle">Platform-wide and per-restaurant revenue analytics</div>
    </div>
    <div class="flex gap-sm">
      <button class="btn btn-secondary btn-sm" (click)="exportCSV()">↓ Export CSV</button>
      <button class="btn btn-secondary btn-sm" (click)="load()">↻ Refresh</button>
    </div>
  </div>

  <!-- Date Range -->
  <div class="card" style="margin-bottom:16px">
    <div class="card-inner">
      <div class="form-row">
        <div class="form-group">
          <label>Report Type</label>
          <select class="form-select" [(ngModel)]="reportType">
            <option value="platform">Platform Summary</option>
            <option value="restaurant">Per Restaurant</option>
          </select>
        </div>
        <div class="form-group" *ngIf="reportType==='restaurant'">
          <label>Restaurant ID</label>
          <input class="form-input" [(ngModel)]="restaurantId" placeholder="Enter restaurant ID" />
        </div>
        <div class="form-group">
          <label>Start Date</label>
          <input class="form-input" type="date" [(ngModel)]="startDate" />
        </div>
        <div class="form-group">
          <label>End Date</label>
          <input class="form-input" type="date" [(ngModel)]="endDate" />
        </div>
        <div class="form-group" style="justify-content:flex-end;align-items:flex-end">
          <button class="btn btn-primary" (click)="load()" [disabled]="loading">Generate Report</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="stats-grid-4" style="margin-bottom:16px" *ngIf="data">
    <div class="stat-card">
      <div class="stat-label">Gross Revenue</div>
      <div class="stat-value">{{ data.grossRevenue | currency:'INR':'symbol':'1.0-0' }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Platform Commission</div>
      <div class="stat-value" style="color:var(--color-success)">{{ data.commission | currency:'INR':'symbol':'1.0-0' }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Orders</div>
      <div class="stat-value">{{ data.totalOrders | number }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg Order Value</div>
      <div class="stat-value">{{ data.avgOrderValue | currency:'INR':'symbol':'1.0-2' }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Delivery Revenue</div>
      <div class="stat-value">{{ data.deliveryRevenue | currency:'INR':'symbol':'1.0-0' }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Discounts Given</div>
      <div class="stat-value" style="color:var(--color-error)">{{ data.totalDiscounts | currency:'INR':'symbol':'1.0-0' }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">COD Revenue</div>
      <div class="stat-value">{{ data.codRevenue | currency:'INR':'symbol':'1.0-0' }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Online Pay Revenue</div>
      <div class="stat-value">{{ data.onlineRevenue | currency:'INR':'symbol':'1.0-0' }}</div>
    </div>
  </div>

  <div *ngIf="data" class="content-grid rr-grid">
    <!-- Daily Breakdown Table -->
    <div class="card">
      <div class="card-header">Daily Revenue Breakdown</div>
      <!-- Desktop table -->
      <table class="data-table hide-mobile" *ngIf="dailyData.length > 0">
        <thead>
          <tr>
            <th>Date</th>
            <th>Orders</th>
            <th>Gross Revenue</th>
            <th>Commission</th>
            <th>Delivery Fees</th>
            <th>Discounts</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let d of dailyData">
            <td class="font-mono">{{ d.date | date:'dd MMM yyyy' }}</td>
            <td>{{ d.orderCount }}</td>
            <td class="font-mono">{{ d.grossRevenue | currency:'INR':'symbol':'1.0-0' }}</td>
            <td class="font-mono" style="color:var(--color-success)">{{ d.commission | currency:'INR':'symbol':'1.0-0' }}</td>
            <td class="font-mono">{{ d.deliveryRevenue | currency:'INR':'symbol':'1.0-0' }}</td>
            <td class="font-mono" style="color:var(--color-error)">{{ d.discounts | currency:'INR':'symbol':'1.0-0' }}</td>
          </tr>
        </tbody>
      </table>
      <!-- Mobile card list -->
      <div class="mobile-list show-mobile" *ngIf="dailyData.length > 0">
        <div class="mobile-card" *ngFor="let d of dailyData">
          <div class="mc-header">
            <div class="mc-id font-mono">{{ d.date | date:'dd MMM yyyy' }}</div>
            <span class="mc-val font-mono" style="font-weight:700">₹{{ d.grossRevenue | number:'1.0-0' }}</span>
          </div>
          <div class="mc-row">
            <span class="mc-label">Orders</span>
            <span class="mc-val">{{ d.orderCount }}</span>
          </div>
          <div class="mc-row">
            <span class="mc-label">Commission</span>
            <span class="mc-val font-mono" style="color:var(--color-success)">{{ d.commission | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
          <div class="mc-row">
            <span class="mc-label">Delivery Fees</span>
            <span class="mc-val font-mono">{{ d.deliveryRevenue | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
          <div class="mc-row">
            <span class="mc-label">Discounts</span>
            <span class="mc-val font-mono" style="color:var(--color-error)">{{ d.discounts | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
        </div>
      </div>
      <div *ngIf="dailyData.length===0" class="text-secondary no-data">No daily data available</div>
    </div>

    <!-- Revenue Chart -->
    <div class="card">
      <div class="card-header">Revenue Trend</div>
      <div class="trend-list">
        <div class="trend-row" *ngFor="let d of dailyData | slice:0:14">
          <span class="trend-date">{{ d.date | date:'dd MMM' }}</span>
          <div class="trend-bar-wrap">
            <div class="trend-bar" [style.width.%]="(d.grossRevenue / maxRevenue) * 100"></div>
          </div>
          <span class="trend-val font-mono">₹{{ d.grossRevenue | number:'1.0-0' }}</span>
        </div>
      </div>
    </div>
  </div>

  <div *ngIf="loading" class="card" style="padding:40px;text-align:center;color:var(--color-400)">
    Generating report...
  </div>

  <div *ngIf="!loading && !data" class="card" style="padding:40px;text-align:center;color:var(--color-400)">
    Select a date range and click Generate Report
  </div>
</div>
  `,
  styles: [`
    .page { padding: 24px; }
    .card-inner { padding: 16px; }
    .card-header { font-weight:600; font-size:13px; padding:12px 14px; border-bottom:1px solid var(--color-border); }
    .trend-list { padding:12px 14px; display:flex; flex-direction:column; gap:6px; }
    .trend-row { display:flex; align-items:center; gap:8px; font-size:12px; }
    .trend-date { width:60px; flex-shrink:0; color:var(--color-500); }
    .trend-bar-wrap { flex:1; background:var(--color-100); border-radius:3px; height:10px; }
    .trend-bar { height:10px; background:var(--color-900); border-radius:3px; transition:.3s; }
    .trend-val { width:70px; text-align:right; flex-shrink:0; }
    .no-data { padding:24px; text-align:center; font-size:13px; }
    .rr-grid { grid-template-columns: 2fr 1fr; }
    @media (max-width:768px) {
      .page { padding: 12px; }
      .rr-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class RevenueReportsComponent implements OnInit {
  data: any = null;
  dailyData: any[] = [];
  loading = false;
  reportType = 'platform';
  restaurantId = '';
  startDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  endDate = new Date().toISOString().split('T')[0];

  get maxRevenue(): number { return Math.max(1, ...this.dailyData.map(d => d.grossRevenue)); }

  constructor(private api: ApiService) {}
  ngOnInit(): void {}

  load(): void {
    this.loading = true;
    const id = this.reportType === 'restaurant' ? this.restaurantId : '';
    this.api.getRestaurantEarnings(id, this.startDate, this.endDate).subscribe({
      next: (res: any) => {
        this.data = res;
        this.dailyData = res.dailyTrend || res.daily || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  exportCSV(): void {
    if (!this.dailyData.length) return;
    const headers = ['Date', 'Orders', 'Gross Revenue', 'Commission', 'Delivery Revenue', 'Discounts'];
    const rows = this.dailyData.map(d => [d.date, d.orderCount, d.grossRevenue, d.commission, d.deliveryRevenue, d.discounts].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'revenue-report-' + this.startDate + '-to-' + this.endDate + '.csv';
    a.click();
  }
}
