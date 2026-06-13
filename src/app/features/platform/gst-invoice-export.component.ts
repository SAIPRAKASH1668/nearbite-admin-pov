/**
 * GST Export — downloads DELIVERED orders for a date range as a GSTR-1 .xlsx.
 *
 * One row per delivered order, 6 columns:
 *   GSTIN/UIN of Recipient (blank — no GSTIN stored) · Invoice Number (orderId) ·
 *   Restaurant Name · Invoice date (DD-MMM-YYYY) · Invoice Value (foodTotal only) · Rate (5%).
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
  selector: 'app-gst-invoice-export',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">GST Export</div>
      <div class="page-subtitle">Download delivered orders for GST (GSTR-1) filing</div>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-inner">
      <div class="form-row">
        <div class="form-group">
          <label>Start Date</label>
          <input class="form-input" type="date" [(ngModel)]="startDate" />
        </div>
        <div class="form-group">
          <label>End Date</label>
          <input class="form-input" type="date" [(ngModel)]="endDate" />
        </div>
        <div class="form-group" style="justify-content:flex-end;align-items:flex-end">
          <button class="btn btn-primary" (click)="download()" [disabled]="loading || !startDate || !endDate">
            {{ loading ? 'Preparing…' : '↓ Download .xlsx' }}
          </button>
        </div>
      </div>
      <p class="hint">One row per delivered order · columns: GSTIN/UIN of Recipient (blank), Invoice Number, Restaurant Name, Invoice date, Invoice Value (food value), Rate (5%).</p>
    </div>
  </div>

  <div class="alert-error" *ngIf="error">✕ {{ error }}</div>

  <div class="card" *ngIf="loading" style="padding:32px;text-align:center;color:var(--color-400,#888)">
    Fetching delivered orders…
  </div>

  <div class="card" *ngIf="!loading && exportedCount !== null && exportedCount > 0" style="padding:20px;text-align:center;color:var(--color-success,#22c55e)">
    ✓ Exported {{ exportedCount }} delivered order(s).
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
export class GstInvoiceExportComponent {
  // Food GST rate (backend config: GST_RATE_FOOD = 0.05 → 5%).
  private readonly GST_RATE_FOOD = 5;

  startDate = firstOfThisMonth();
  endDate = new Date().toISOString().split('T')[0];

  loading = false;
  error = '';
  exportedCount: number | null = null;

  constructor(private api: ApiService) {}

  download(): void {
    if (this.loading || !this.startDate || !this.endDate) return;
    this.loading = true;
    this.error = '';
    this.exportedCount = null;

    this.api.getOrdersByDateRange(this.startDate, this.endDate, 'DELIVERED', 5000).subscribe({
      next: (res: any) => {
        // Defensive: re-filter in case the API ignores the status body param,
        // and require a food value (GSTR-1 row is the food sale at 5%).
        const orders = (res?.orders || []).filter(
          (o: any) => o?.status === 'DELIVERED' && Number(o?.foodTotal) > 0
        );
        this.exportedCount = orders.length;
        if (!orders.length) {
          this.loading = false;
          this.error = 'No delivered orders with a food value in this date range.';
          return;
        }

        const header = ['GSTIN/UIN of Recipient', 'Invoice Number', 'Restaurant Name', 'Invoice date', 'Invoice Value', 'Rate'];
        const rows = orders.map((o: any) => [
          '',                                                   // GSTIN/UIN of Recipient — not stored (B2C)
          o.orderId || '',
          o.restaurantName || '',                              // Restaurant Name (blank if not stored on the order)
          this.formatGstDate(o.createdAt),
          Math.round((Number(o.foodTotal) || 0) * 100) / 100,  // Invoice Value = food value only
          this.GST_RATE_FOOD,
        ]);

        const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'b2b');
        XLSX.writeFile(wb, `gst-delivered-${this.startDate}-to-${this.endDate}.xlsx`);
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.message || 'Failed to fetch delivered orders.';
      },
    });
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
