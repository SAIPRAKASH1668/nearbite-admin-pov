/**
 * GST Revenue — downloads platform GST revenue for a date range as .xlsx.
 *
 * For each DELIVERED order, emits TWO rows (all at Rate 18%) on a single sheet.
 * Invoice Value is the order grandTotal (same on both rows); the per-row
 * Taxable Value is:
 *   1. Taxable Value = calculatedFeeResponse.deliveryFee                                           (delivery)
 *   2. Taxable Value = revenue.platformRevenue.platformFee                                         (platform fee)
 * Columns: Invoice Number (orderId), Restaurant Name, Invoice Date (DD-MMM-YYYY),
 * Invoice Value (grandTotal), Place Of Supply, Reverse Charge, Applicable % of Tax Rate,
 * Invoice Type, E-Commerce GSTIN, Rate, Taxable Value, Cess Amount.
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
      <p class="hint">GSTR-1 B2B layout. 2 rows per delivered order @ 18% — Invoice Value = order grand total; Taxable Value = (1) delivery fee, (2) platform fee. Place of Supply 37-Andhra Pradesh, Reverse Charge N, Invoice Type Regular B2B, Cess 0.</p>
    </div>
  </div>

  <div class="alert-error" *ngIf="error">✕ {{ error }}</div>

  <div class="card" *ngIf="loading" style="padding:32px;text-align:center;color:var(--color-400,#888)">
    Fetching delivered orders…
  </div>

  <div class="card" *ngIf="!loading && orderCount !== null && orderCount > 0" style="padding:20px;text-align:center;color:var(--color-success,#22c55e)">
    ✓ Exported {{ orderCount }} order(s) → {{ orderCount * 2 }} rows.
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
  private readonly PLACE_OF_SUPPLY = '37-Andhra Pradesh';
  private readonly REVERSE_CHARGE = 'N';
  private readonly INVOICE_TYPE = 'Regular B2B';
  private readonly ECOMMERCE_GSTIN = '';
  private readonly CESS_AMOUNT = 0;

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

        const header = [
          'Invoice Number', 'Restaurant Name', 'Invoice Date', 'Invoice Value',
          'Place Of Supply', 'Reverse Charge', 'Applicable % of Tax Rate', 'Invoice Type',
          'E-Commerce GSTIN', 'Rate', 'Taxable Value', 'Cess Amount',
        ];
        const rows: any[][] = [header];
        for (const o of orders) {
          const pr = o?.revenue?.platformRevenue || {};
          const cfr = o?.calculatedFeeResponse || {};
          const invNo = o?.orderId || '';
          const rName = o?.restaurantName || '';
          const invDate = this.formatGstDate(o?.createdAt);
          const invoiceValue = this.round2(this.num(o?.grandTotal));
          const buildRow = (taxable: number) => [
            invNo, rName, invDate, invoiceValue,
            this.PLACE_OF_SUPPLY, this.REVERSE_CHARGE, this.RATE, this.INVOICE_TYPE,
            this.ECOMMERCE_GSTIN, this.RATE, this.round2(taxable), this.CESS_AMOUNT,
          ];
          rows.push(buildRow(this.num(cfr.deliveryFee)));
          rows.push(buildRow(this.num(pr.platformFee)));
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'gst-revenue');
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
