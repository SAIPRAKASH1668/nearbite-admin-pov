/**
 * GST Revenue — downloads platform GST revenue for a date range as .xlsx.
 *
 * For each DELIVERED order, emits THREE rows (all at Rate 18%):
 *   1. Invoice Value = revenue.platformRevenue.finalPayout - revenue.platformRevenue.platformFee  (commission)
 *   2. Invoice Value = calculatedFeeResponse.deliveryFee                                           (delivery)
 *   3. Invoice Value = revenue.platformRevenue.platformFee                                         (platform fee)
 * Columns: Invoice Number (orderId), Restaurant Name, Invoice Date (DD-MMM-YYYY), Invoice Value, Rate.
 *
 * Frontend-only: reads delivered orders via the existing date-range API and
 * builds the workbook client-side with SheetJS.
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import * as XLSX from 'xlsx';

function firstOfThisMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

@Component({
  selector: 'app-gst-revenue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">GST Revenue</div>
      <div class="page-subtitle">Platform GST revenue export (commission, delivery & platform fee @ 18%)</div>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-inner">
      <div class="form-row">
        <div class="form-group">
          <label>From Date</label>
          <input class="form-input" type="date" [(ngModel)]="startDate" />
        </div>
        <div class="form-group">
          <label>To Date</label>
          <input class="form-input" type="date" [(ngModel)]="endDate" />
        </div>
        <div class="form-group" style="justify-content:flex-end;align-items:flex-end">
          <button class="btn btn-primary" (click)="download()" [disabled]="loading || !startDate || !endDate">
            {{ loading ? 'Preparing…' : '↓ Download .xlsx' }}
          </button>
        </div>
      </div>
      <p class="hint">3 rows per delivered order @ 18% — (1) platform commission [finalPayout − platformFee], (2) delivery fee, (3) platform fee. Columns: Invoice Number, Restaurant Name, Invoice Date, Invoice Value, Rate.</p>
    </div>
  </div>

  <div class="alert-error" *ngIf="error">✕ {{ error }}</div>

  <div class="card" *ngIf="loading" style="padding:32px;text-align:center;color:var(--color-400,#888)">
    Fetching delivered orders…
  </div>

  <div class="card" *ngIf="!loading && orderCount !== null && orderCount > 0" style="padding:20px;text-align:center;color:var(--color-success,#22c55e)">
    ✓ Exported {{ orderCount }} order(s) → {{ orderCount * 3 }} rows.
  </div>
</div>
  `,
  styles: [`
    .page { padding: 24px; }
    .card-inner { padding: 16px; }
    .hint { margin: 10px 0 0; font-size: 12px; color: var(--color-text-tertiary, #888); }
    @media (max-width: 768px) { .page { padding: 12px; } }
  `]
})
export class GstRevenueComponent {
  private readonly RATE = 18; // GST rate (%) on platform services

  startDate = firstOfThisMonth();
  endDate = new Date().toISOString().split('T')[0];

  loading = false;
  error = '';
  orderCount: number | null = null;

  constructor(private api: ApiService) {}

  download(): void {
    if (this.loading || !this.startDate || !this.endDate) return;
    this.loading = true;
    this.error = '';
    this.orderCount = null;

    this.api.getOrdersByDateRange(this.startDate, this.endDate, 'DELIVERED', 5000).subscribe({
      next: (res: any) => {
        const orders = (res?.orders || []).filter((o: any) => o?.status === 'DELIVERED');
        this.orderCount = orders.length;
        if (!orders.length) {
          this.loading = false;
          this.error = 'No delivered orders in this date range.';
          return;
        }

        const header = ['Invoice Number', 'Restaurant Name', 'Invoice Date', 'Invoice Value', 'Rate'];
        const rows: any[][] = [header];
        for (const o of orders) {
          const pr = o?.revenue?.platformRevenue || {};
          const cfr = o?.calculatedFeeResponse || {};
          const invNo = o?.orderId || '';
          const rName = o?.restaurantName || '';
          const invDate = this.formatGstDate(o?.createdAt);
          const commission = this.num(pr.finalPayout) - this.num(pr.platformFee);
          const deliveryFee = this.num(cfr.deliveryFee);
          const platformFee = this.num(pr.platformFee);
          for (const value of [commission, deliveryFee, platformFee]) {
            rows.push([invNo, rName, invDate, this.round2(value), this.RATE]);
          }
        }

        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'gst-revenue');
        XLSX.writeFile(wb, `gst-revenue-${this.startDate}-to-${this.endDate}.xlsx`);
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.message || 'Failed to fetch delivered orders.';
      },
    });
  }

  private num(v: any): number {
    const n = Number(v);
    return isFinite(n) ? n : 0;
  }

  private round2(v: number): number {
    return Math.round(v * 100) / 100;
  }

  /** ISO timestamp → "DD-MMM-YYYY" using the stored (IST) calendar date, no TZ math. */
  private formatGstDate(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = String(iso).slice(0, 10).split('-');
    const mi = parseInt(m, 10) - 1;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (!y || !d || mi < 0 || mi > 11) return '';
    return `${d}-${months[mi]}-${y}`;
  }
}
