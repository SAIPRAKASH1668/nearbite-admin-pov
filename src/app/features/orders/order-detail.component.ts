import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, SlicePipe } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DecimalPipe, SlicePipe],
  template: `
<div class="od-page fade-in">

  <!-- ── Sticky Mobile Header ── -->
  <div class="od-mobile-header">
    <button class="od-back-btn" (click)="goBack()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
    </button>
    <div class="od-mobile-header-center">
      <div class="od-mobile-order-id font-mono">{{ orderId | slice:0:18 }}…</div>
      <span [class]="'od-status-chip status-' + order?.status" *ngIf="order">{{ order.status }}</span>
    </div>
    <button class="od-reload-btn" (click)="reload()" [disabled]="loading">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" [style.opacity]="loading?'0.4':'1'"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-3"/></svg>
    </button>
  </div>

  <!-- ── Desktop Header ── -->
  <div class="od-desktop-header page-header">
    <div class="flex items-center gap-md">
      <button class="btn btn-ghost btn-sm" (click)="goBack()">← Back</button>
      <div>
        <div class="page-title font-mono" style="font-size:16px;letter-spacing:0.5px">{{ orderId }}</div>
        <div class="page-subtitle">Order Detail</div>
      </div>
    </div>
    <div class="flex gap-sm items-center" *ngIf="order">
      <span [class]="'status-' + order.status" style="font-size:13px">{{ order.status }}</span>
      <span class="text-secondary" style="font-size:12px">{{ formatDateTime(order.createdAt) }}</span>
      <button class="btn btn-secondary btn-sm" (click)="reload()" [disabled]="loading">↻</button>
    </div>
  </div>

  <!-- Loading -->
  <div *ngIf="loading" class="od-loading">
    <div class="skeleton od-skel-hero"></div>
    <div class="od-skel-grid">
      <div class="skeleton od-skel-block"></div>
      <div class="skeleton od-skel-block-sm"></div>
    </div>
  </div>

  <!-- Content -->
  <ng-container *ngIf="!loading && order">

    <!-- ── MOBILE HERO CARD ── -->
    <div class="od-hero-card">
      <!-- Amount row -->
      <div class="od-hero-amount">
        <div>
          <div class="od-hero-label">Grand Total</div>
          <div class="od-hero-value">₹{{ order.grandTotal | number:'1.0-0' }}</div>
        </div>
        <div class="od-hero-payment-badge">
          <span class="od-pay-icon">💳</span>
          {{ order.paymentMethod || '—' }}
        </div>
      </div>

      <!-- 4 quick stats -->
      <div class="od-hero-stats">
        <div class="od-hero-stat">
          <div class="od-hs-val">{{ order.items?.length || 0 }}</div>
          <div class="od-hs-lbl">Items</div>
        </div>
        <div class="od-hero-stat">
          <div class="od-hs-val">{{ order.deliveryDistanceKm ? (order.deliveryDistanceKm | number:'1.1-1') + 'km' : '—' }}</div>
          <div class="od-hs-lbl">Distance</div>
        </div>
        <div class="od-hero-stat">
          <div class="od-hs-val" [style.color]="order.riderId ? '#22c55e' : '#f59e0b'">
            {{ order.riderId ? '✓' : '—' }}
          </div>
          <div class="od-hs-lbl">Rider</div>
        </div>
        <div class="od-hero-stat">
          <div class="od-hs-val">{{ formatTime(order.createdAt) }}</div>
          <div class="od-hs-lbl">{{ order.createdAt | slice:0:10 }}</div>
        </div>
      </div>

      <!-- Restaurant & customer pills -->
      <div class="od-hero-pills">
        <div class="od-pill">
          <span class="od-pill-icon">🍽️</span>
          <span class="od-pill-text">{{ order.restaurantName || order.restaurantId }}</span>
        </div>
        <div class="od-pill">
          <span class="od-pill-icon">📞</span>
          <span class="od-pill-text font-mono">{{ order.customerPhone }}</span>
        </div>
      </div>

      <!-- OTP row (critical, show always) -->
      <div class="od-otp-row" *ngIf="order.deliveryOtp || order.pickupOtp">
        <div class="od-otp-chip" *ngIf="order.deliveryOtp">
          <span class="od-otp-lbl">DELIVERY OTP</span>
          <span class="od-otp-val">{{ order.deliveryOtp }}</span>
        </div>
        <div class="od-otp-chip od-otp-blue" *ngIf="order.pickupOtp">
          <span class="od-otp-lbl">PICKUP OTP</span>
          <span class="od-otp-val">{{ order.pickupOtp }}</span>
        </div>
      </div>
    </div>

    <!-- ── Revenue Strip (desktop: 4-col, mobile: 2-col) ── -->
    <div class="od-rev-strip">
      <div class="od-rev-chip od-rev-red">
        <div class="od-rc-lbl">Customer Paid</div>
        <div class="od-rc-val">₹{{ order.grandTotal | number:'1.0-0' }}</div>
      </div>
      <div class="od-rev-chip od-rev-green">
        <div class="od-rc-lbl">Restaurant Gets</div>
        <div class="od-rc-val">₹{{ restaurantShare | number:'1.0-0' }}</div>
      </div>
      <div class="od-rev-chip od-rev-amber">
        <div class="od-rc-lbl">Platform Earns</div>
        <div class="od-rc-val">₹{{ platformShare | number:'1.0-0' }}</div>
      </div>
      <div class="od-rev-chip od-rev-blue">
        <div class="od-rc-lbl">Rider Earns</div>
        <div class="od-rc-val">₹{{ order.deliveryFee | number:'1.0-0' }}</div>
      </div>
    </div>

    <!-- ── Main Layout ── -->
    <div class="od-main-grid">

      <!-- LEFT COLUMN -->
      <div class="od-col-left">

        <!-- ── Order Items (CARD style, no table) ── -->
        <div class="card">
          <div class="card-header">
            <h4>Order Items</h4>
            <span class="badge badge-neutral">{{ order.items?.length || 0 }} · {{ order.restaurantName || order.restaurantId }}</span>
          </div>
          <div class="od-items-list">
            <div class="od-item-card" *ngFor="let item of order.items">
              <div class="od-item-main">
                <div class="od-item-qty-badge">×{{ item.quantity }}</div>
                <div class="od-item-info">
                  <div class="od-item-name">{{ item.name }}</div>
                  <div class="od-item-meta" *ngIf="item.addOns?.length">
                    <span *ngFor="let a of item.addOns; let last=last">{{ a.name }}<span *ngIf="!last">, </span></span>
                  </div>
                  <div class="od-item-meta" *ngIf="item.itemCommissionPercentage">
                    Comm: {{ item.itemCommissionPercentage }}%
                  </div>
                </div>
                <div class="od-item-price-col">
                  <div class="od-item-subtotal">₹{{ ((+item.price + (+item.addOnTotal || 0)) * +item.quantity) | number:'1.0-0' }}</div>
                  <div class="od-item-unit-price">₹{{ item.price | number:'1.0-0' }} each</div>
                  <div class="od-item-discount" *ngIf="item.itemDiscountAmount > 0">-₹{{ item.itemDiscountAmount | number:'1.0-0' }}</div>
                </div>
              </div>
            </div>
          </div>
          <!-- Bill Summary -->
          <div class="od-bill-summary">
            <div class="od-bill-row"><span>Food Total</span><span>₹{{ order.foodTotal | number:'1.0-0' }}</span></div>
            <div class="od-bill-row"><span class="text-secondary">Delivery Fee</span><span>₹{{ order.deliveryFee | number:'1.0-0' }}</span></div>
            <div class="od-bill-row"><span class="text-secondary">Platform Fee</span><span>₹{{ order.platformFee | number:'1.0-0' }}</span></div>
            <div class="od-bill-row od-bill-coupon" *ngIf="couponDiscount > 0">
              <span>Coupon <strong class="font-mono">{{ couponCode }}</strong></span>
              <span>-₹{{ couponDiscount | number:'1.0-0' }}</span>
            </div>
            <div class="od-bill-row od-bill-total">
              <span>Grand Total</span>
              <strong>₹{{ order.grandTotal | number:'1.0-0' }}</strong>
            </div>
          </div>
        </div>

        <!-- ── Payment Card ── -->
        <div class="card">
          <div class="card-header"><h4>Payment</h4></div>
          <div class="od-pay-grid">
            <div class="od-pay-block">
              <div class="od-pay-method">{{ order.paymentMethod || '—' }}</div>
              <div class="od-pay-sub" *ngIf="order.paymentChannel">via {{ order.paymentChannel }}</div>
              <div class="od-pay-id font-mono" *ngIf="order.paymentId">{{ order.paymentId }}</div>
              <div class="od-pay-attempts" *ngIf="order.riderAssignmentAttempts > 0">
                Assign attempts: {{ order.riderAssignmentAttempts }}
              </div>
            </div>
            <div class="od-coupon-block" *ngIf="couponApplied">
              <div class="od-coupon-tag">COUPON APPLIED</div>
              <div class="od-coupon-code font-mono">{{ couponCode }}</div>
              <div class="od-coupon-savings" *ngIf="couponDiscount > 0">Saved ₹{{ couponDiscount | number:'1.0-0' }}</div>
            </div>
            <div class="od-coupon-empty" *ngIf="!couponApplied">No coupon</div>
          </div>
        </div>

        <!-- ── Customer & Delivery Card ── -->
        <div class="card">
          <div class="card-header"><h4>Customer &amp; Delivery</h4></div>
          <div class="od-customer-grid">
            <div class="od-cust-row">
              <span class="od-cust-lbl">Customer</span>
              <span class="od-cust-val font-mono">{{ order.customerPhone }}</span>
            </div>
            <div class="od-cust-row" *ngIf="order.receiverPhone && order.receiverPhone !== order.customerPhone">
              <span class="od-cust-lbl">Receiver</span>
              <span class="od-cust-val font-mono">{{ order.receiverPhone }}</span>
            </div>
            <div class="od-cust-row">
              <span class="od-cust-lbl">Restaurant</span>
              <span class="od-cust-val">{{ order.restaurantName || order.restaurantId }}</span>
            </div>
            <div class="od-cust-row" *ngIf="order.preparationTime">
              <span class="od-cust-lbl">Prep Time</span>
              <span class="od-cust-val">{{ order.preparationTime }} min</span>
            </div>
            <div class="od-cust-row" *ngIf="order.deliveryDistanceKm">
              <span class="od-cust-lbl">Distance</span>
              <span class="od-cust-val">{{ order.deliveryDistanceKm | number:'1.1-1' }} km</span>
            </div>
          </div>
          <div class="od-address-block">
            <div class="od-address-label">📍 DELIVERY ADDRESS</div>
            <div class="od-address-text">{{ order.formattedAddress || order.deliveryAddress || '—' }}</div>
          </div>
        </div>

      </div><!-- /LEFT COLUMN -->

      <!-- RIGHT COLUMN -->
      <div class="od-col-right">

        <!-- ── Assigned Rider Card ── -->
        <div class="card" *ngIf="order.riderId">
          <div class="card-header">
            <h4>Assigned Rider</h4>
            <span *ngIf="assignedRider" [ngStyle]="{'background': assignedRider.isActive ? (assignedRider.workingOnOrder?.length > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.1)') : 'var(--color-100)', 'color': assignedRider.isActive ? (assignedRider.workingOnOrder?.length > 0 ? '#b45309' : '#15803d') : 'var(--color-400)', 'padding': '3px 10px', 'border-radius': '100px', 'font-size': '11px', 'font-weight': '600'}">
              {{ assignedRider.workingOnOrder?.length > 0 ? 'On Delivery' : (assignedRider.isActive ? 'Online' : 'Offline') }}
            </span>
          </div>
          <div class="od-rider-hero">
            <div class="od-rider-avatar">🛵</div>
            <div class="od-rider-details">
              <div class="od-rider-name">{{ order.riderName || riderDisplayName(assignedRider) }}</div>
              <div class="od-rider-phone font-mono">{{ order.riderPhone || assignedRider?.phone }}</div>
              <div class="od-rider-rating" *ngIf="order.riderRating != null">
                <span>★</span>
                <strong>{{ order.riderRating | number:'1.1-1' }}</strong>
                <span class="text-secondary">({{ order.riderRatedCount }})</span>
              </div>
            </div>
          </div>
          <div class="od-rider-metrics" *ngIf="assignedRider">
            <div class="od-rm-item">
              <div class="od-rm-val" [style.color]="assignedRider.workingOnOrder?.length > 0 ? '#f59e0b' : 'var(--color-700)'">{{ assignedRider.workingOnOrder?.length || 0 }}</div>
              <div class="od-rm-lbl">ACTIVE</div>
            </div>
            <div class="od-rm-item">
              <div class="od-rm-val">{{ assignedRider.ordersAssignedLast7d || 0 }}</div>
              <div class="od-rm-lbl">7D ORDERS</div>
            </div>
            <div class="od-rm-item" *ngIf="assignedRider.rating">
              <div class="od-rm-val" style="color:#f59e0b">{{ assignedRider.rating | number:'1.1-1' }}</div>
              <div class="od-rm-lbl">RATING</div>
            </div>
            <div class="od-rm-item" *ngIf="assignedRider.speed > 0">
              <div class="od-rm-val">{{ assignedRider.speed | number:'1.0-0' }}</div>
              <div class="od-rm-lbl">KM/H</div>
            </div>
          </div>
        </div>
        <div class="card" *ngIf="!order.riderId">
          <div class="card-header"><h4>Rider</h4></div>
          <div class="od-no-rider">
            <div style="font-size:28px">🛵</div>
            <div>No rider assigned yet</div>
          </div>
        </div>

        <!-- ── Timeline ── -->
        <div class="card">
          <div class="card-header"><h4>Status Timeline</h4></div>
          <div class="od-timeline">
            <div class="od-tl-item" [class.done]="order.createdAt">
              <div class="od-tl-dot"></div>
              <div class="od-tl-body">
                <div class="od-tl-label">Order Placed</div>
                <div class="od-tl-time">{{ formatDateTime(order.createdAt) }}</div>
              </div>
            </div>
            <div class="od-tl-item" [class.done]="order.riderAssignedAt">
              <div class="od-tl-dot"></div>
              <div class="od-tl-body">
                <div class="od-tl-label">Rider Assigned</div>
                <div class="od-tl-time">{{ formatDateTime(order.riderAssignedAt) || '—' }}</div>
              </div>
            </div>
            <div class="od-tl-item" [class.done]="order.riderPickupAt">
              <div class="od-tl-dot"></div>
              <div class="od-tl-body">
                <div class="od-tl-label">Picked Up</div>
                <div class="od-tl-time">{{ formatDateTime(order.riderPickupAt) || '—' }}</div>
              </div>
            </div>
            <div class="od-tl-item" [class.done]="order.riderDeliveredAt">
              <div class="od-tl-dot"></div>
              <div class="od-tl-body">
                <div class="od-tl-label">Delivered</div>
                <div class="od-tl-time">{{ formatDateTime(order.riderDeliveredAt) || '—' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Revenue Breakdown ── -->
        <div class="card">
          <div class="card-header">
            <h4>Revenue Breakdown</h4>
            <span class="badge badge-neutral">{{ order.revenue ? 'Actual' : '~Estimated' }}</span>
          </div>
          <ng-container *ngIf="order.revenue">
            <div class="od-rev-row"><span>Food Commission</span><span>₹{{ order.revenue.platformRevenue?.foodCommission | number:'1.2-2' }}</span></div>
            <div class="od-rev-row"><span>Platform Fee</span><span>₹{{ order.revenue.platformRevenue?.platformFee | number:'1.2-2' }}</span></div>
            <div class="od-rev-row" *ngIf="order.revenue.platformRevenue?.excessFromRestaurantRevenue > 0">
              <span>Markup Share</span><span>₹{{ order.revenue.platformRevenue.excessFromRestaurantRevenue | number:'1.2-2' }}</span>
            </div>
            <div class="od-rev-row od-rev-total" style="color:#f59e0b">
              <span>Platform Total</span><strong>₹{{ platformShare | number:'1.2-2' }}</strong>
            </div>
            <div class="od-rev-divider"></div>
            <div class="od-rev-row" style="color:#22c55e">
              <span>Restaurant Settlement</span><span>₹{{ order.revenue.restaurantRevenue?.revenue | number:'1.2-2' }}</span>
            </div>
          </ng-container>
          <ng-container *ngIf="!order.revenue">
            <div class="od-rev-row"><span class="text-secondary">Food Total</span><span>₹{{ order.foodTotal | number:'1.2-2' }}</span></div>
            <div class="od-rev-row" style="color:#22c55e"><span>Restaurant (~85%)</span><span>₹{{ restaurantShare | number:'1.2-2' }}</span></div>
            <div class="od-rev-row" style="color:#f59e0b"><span>Platform (~15%+fee)</span><span>₹{{ platformShare | number:'1.2-2' }}</span></div>
            <div class="od-rev-divider"></div>
          </ng-container>
          <div class="od-rev-row" style="color:#3b82f6"><span>Rider (Delivery Fee)</span><span>₹{{ order.deliveryFee | number:'1.2-2' }}</span></div>
        </div>

      </div><!-- /RIGHT COLUMN -->
    </div>

    <!-- FORCE ASSIGN RIDER (full width, conditional) -->
    <div class="card od-force-assign" *ngIf="showForceAssign">
      <div class="card-header">
        <div>
          <h4>Force Assign Rider</h4>
          <div class="text-secondary" style="font-size:12px;margin-top:2px">
            Select a rider below — this will set the order to RIDER_ASSIGNED and override any current assignment
          </div>
        </div>
        <div class="flex gap-sm items-center" style="flex-wrap:wrap;justify-content:flex-end">
          <span *ngIf="assignSuccess" style="color:#22c55e;font-size:13px;font-weight:600">✓ {{ assignSuccess }}</span>
          <span *ngIf="assignError" style="color:var(--color-error);font-size:12px">{{ assignError }}</span>
          <button class="btn btn-primary" (click)="forceAssign()" [disabled]="!selectedRiderId || assigning">
            {{ assigning ? 'Assigning…' : 'Assign to Selected Rider' }}
          </button>
        </div>
      </div>

      <!-- Rider Grid -->
      <div class="od-rider-grid">
        <div *ngFor="let r of riders" class="od-rider-card" [class.selected]="selectedRiderId === r.riderId" [class.is-online]="r.isActive" [class.is-busy]="r.workingOnOrder?.length > 0" (click)="selectedRiderId = r.riderId">

          <!-- Status indicator bar -->
          <div class="od-rc-bar" [style.background]="r.workingOnOrder?.length > 0 ? '#f59e0b' : (r.isActive ? '#22c55e' : 'var(--color-200)')"></div>

          <div class="od-rc-body">
            <div class="od-rc-top">
              <div>
                <div class="od-rc-name">{{ riderDisplayName(r) }}</div>
                <div class="od-rc-phone font-mono">{{ r.phone }}</div>
              </div>
              <div class="od-rc-check" *ngIf="selectedRiderId === r.riderId">✓</div>
            </div>

            <div class="od-rc-status-row">
              <span class="od-rc-badge" [style.background]="r.workingOnOrder?.length > 0 ? 'rgba(245,158,11,0.12)' : (r.isActive ? 'rgba(34,197,94,0.1)' : 'var(--color-100)')"
                    [style.color]="r.workingOnOrder?.length > 0 ? '#b45309' : (r.isActive ? '#15803d' : 'var(--color-400)')">
                {{ r.workingOnOrder?.length > 0 ? 'On delivery' : (r.isActive ? 'Online' : 'Offline') }}
              </span>
              <span *ngIf="r.rating" style="display:flex;align-items:center;gap:2px;font-size:12px;color:#f59e0b;font-weight:600">
                ★ {{ r.rating | number:'1.1-1' }}
              </span>
            </div>

            <div class="od-rc-metrics">
              <div class="od-rc-metric">
                <div class="od-rc-metric-val" [style.color]="r.workingOnOrder?.length > 0 ? '#f59e0b' : 'var(--color-700)'">
                  {{ r.workingOnOrder?.length || 0 }}
                </div>
                <div class="od-rc-metric-label">Active Orders</div>
              </div>
              <div class="od-rc-metric">
                <div class="od-rc-metric-val">{{ r.ordersAssignedLast7d || 0 }}</div>
                <div class="od-rc-metric-label">Last 7 Days</div>
              </div>
              <div class="od-rc-metric">
                <div class="od-rc-metric-val" style="font-size:11px">{{ formatTime(r.lastSeen) }}</div>
                <div class="od-rc-metric-label">Last Seen</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="riders.length === 0" class="empty-state" style="padding:24px 0">
        <p>No riders found</p>
      </div>
    </div>

  </ng-container>

  <!-- Not found -->
  <div class="empty-state" *ngIf="!loading && !order">
    <div class="empty-icon">✕</div>
    <h4>Order not found</h4>
    <button class="btn btn-primary" (click)="goBack()">Go Back</button>
  </div>
</div>
  `,
  styles: [`
    /* ── Page wrapper ── */
    .od-page { padding: 24px; padding-bottom: 48px; }

    /* ── Mobile sticky header (hidden on desktop) ── */
    .od-mobile-header {
      display: none;
      position: sticky; top: 0; z-index: 50;
      background: var(--color-bg-secondary);
      border-bottom: 1px solid var(--color-border);
      padding: 10px 16px;
      align-items: center; gap: 12px;
    }
    .od-back-btn, .od-reload-btn {
      width: 36px; height: 36px; border-radius: 10px;
      border: 1px solid var(--color-border); background: var(--color-bg-primary);
      color: var(--color-text-primary); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .od-mobile-header-center { flex: 1; min-width: 0; }
    .od-mobile-order-id { font-size: 12px; color: var(--color-text-secondary); line-height: 1.2; }
    .od-status-chip {
      display: inline-block; margin-top: 2px;
      font-size: 11px; font-weight: 700;
      padding: 2px 8px; border-radius: 100px;
    }

    /* ── Desktop header (hidden on mobile) ── */
    .od-desktop-header { display: flex; }

    /* ── Loading skeletons ── */
    .od-loading { display: flex; flex-direction: column; gap: 16px; }
    .od-skel-hero { height: 200px; border-radius: 16px; }
    .od-skel-grid { display: grid; grid-template-columns: 1fr 380px; gap: 16px; }
    .od-skel-block { height: 280px; border-radius: 12px; }
    .od-skel-block-sm { height: 200px; border-radius: 12px; }

    /* ── Hero Card ── */
    .od-hero-card {
      background: linear-gradient(135deg, #1a0a09 0%, #1c1010 100%);
      border: 1px solid rgba(232,53,42,0.25);
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .od-hero-amount {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 16px;
    }
    .od-hero-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.45); letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 2px; }
    .od-hero-value { font-size: 36px; font-weight: 800; color: #fff; line-height: 1; }
    .od-hero-payment-badge {
      display: flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
      border-radius: 100px; padding: 6px 14px;
      font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.75);
    }
    .od-hero-stats {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 8px; margin-bottom: 14px;
    }
    .od-hero-stat {
      background: rgba(255,255,255,0.06); border-radius: 12px; padding: 10px 8px;
      text-align: center;
    }
    .od-hs-val { font-size: 16px; font-weight: 700; color: #fff; line-height: 1.2; }
    .od-hs-lbl { font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 3px; text-transform: uppercase; letter-spacing: 0.3px; }
    .od-hero-pills { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
    .od-pill {
      display: flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,0.06); border-radius: 10px; padding: 8px 12px;
      font-size: 13px; color: rgba(255,255,255,0.8);
    }
    .od-pill-icon { font-size: 14px; flex-shrink: 0; }
    .od-pill-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .od-otp-row { display: flex; gap: 10px; flex-wrap: wrap; }
    .od-otp-chip {
      flex: 1; min-width: 120px;
      background: rgba(232,53,42,0.12); border: 1.5px solid rgba(232,53,42,0.35);
      border-radius: 12px; padding: 10px 14px;
    }
    .od-otp-blue {
      background: rgba(59,130,246,0.12); border-color: rgba(59,130,246,0.35);
    }
    .od-otp-lbl { font-size: 9px; font-weight: 700; letter-spacing: 1px; color: rgba(255,255,255,0.5); margin-bottom: 4px; }
    .od-otp-val { font-size: 26px; font-weight: 900; letter-spacing: 6px; color: #fff; font-family: monospace; }

    /* ── Revenue Strip ── */
    .od-rev-strip {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 10px; margin-bottom: 16px;
    }
    .od-rev-chip {
      border-radius: 14px; padding: 14px 16px;
      border-left: 3px solid transparent;
    }
    .od-rev-red   { background: rgba(232,53,42,0.07);  border-color: #E8352A; }
    .od-rev-green { background: rgba(34,197,94,0.07);  border-color: #22c55e; }
    .od-rev-amber { background: rgba(245,158,11,0.07); border-color: #f59e0b; }
    .od-rev-blue  { background: rgba(59,130,246,0.07); border-color: #3b82f6; }
    .od-rc-lbl { font-size: 11px; font-weight: 600; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px; }
    .od-rc-val { font-size: 20px; font-weight: 800; color: var(--color-text-primary); }

    /* ── Main Grid ── */
    .od-main-grid {
      display: grid; grid-template-columns: 1fr 380px;
      gap: 16px; align-items: start;
    }
    .od-col-left, .od-col-right { display: flex; flex-direction: column; gap: 16px; }

    /* ── Item Cards ── */
    .od-items-list { display: flex; flex-direction: column; gap: 1px; margin: 0 -1px; }
    .od-item-card {
      padding: 12px 0;
      border-bottom: 1px solid var(--color-border);
    }
    .od-item-card:last-child { border-bottom: none; }
    .od-item-main { display: flex; align-items: flex-start; gap: 12px; }
    .od-item-qty-badge {
      min-width: 32px; height: 32px; border-radius: 8px;
      background: var(--color-bg-tertiary); border: 1px solid var(--color-border);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: var(--color-text-primary);
      flex-shrink: 0;
    }
    .od-item-info { flex: 1; min-width: 0; }
    .od-item-name { font-size: 14px; font-weight: 600; color: var(--color-text-primary); line-height: 1.3; }
    .od-item-meta { font-size: 11px; color: var(--color-text-tertiary); margin-top: 3px; }
    .od-item-price-col { text-align: right; flex-shrink: 0; }
    .od-item-subtotal { font-size: 15px; font-weight: 700; color: var(--color-text-primary); }
    .od-item-unit-price { font-size: 11px; color: var(--color-text-tertiary); margin-top: 2px; }
    .od-item-discount { font-size: 11px; color: #22c55e; margin-top: 2px; }

    /* ── Bill Summary ── */
    .od-bill-summary {
      margin-top: 8px; padding-top: 8px;
      border-top: 2px dashed var(--color-border);
    }
    .od-bill-row {
      display: flex; justify-content: space-between;
      padding: 6px 0; font-size: 13px;
      color: var(--color-text-secondary);
    }
    .od-bill-coupon { color: #22c55e; }
    .od-bill-total {
      padding: 10px 0 2px;
      border-top: 1px solid var(--color-border);
      margin-top: 4px;
      font-size: 16px; font-weight: 700;
      color: var(--color-text-primary);
    }

    /* ── Payment card ── */
    .od-pay-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 4px 0; }
    .od-pay-method { font-size: 18px; font-weight: 800; color: var(--color-text-primary); margin-bottom: 4px; }
    .od-pay-sub { font-size: 12px; color: var(--color-text-tertiary); margin-bottom: 4px; }
    .od-pay-id { font-size: 10px; color: var(--color-text-tertiary); word-break: break-all; }
    .od-pay-attempts { font-size: 12px; color: #f59e0b; margin-top: 6px; }
    .od-coupon-block {
      background: rgba(34,197,94,0.06); border: 1.5px solid #22c55e;
      border-radius: 12px; padding: 14px;
    }
    .od-coupon-tag { font-size: 9px; font-weight: 700; letter-spacing: 1px; color: #22c55e; margin-bottom: 4px; }
    .od-coupon-code { font-size: 20px; font-weight: 800; letter-spacing: 2px; }
    .od-coupon-savings { font-size: 13px; color: #22c55e; font-weight: 600; margin-top: 6px; }
    .od-coupon-empty { display: flex; align-items: center; justify-content: center; height: 100%; font-size: 12px; color: var(--color-text-tertiary); border: 1px dashed var(--color-border); border-radius: 10px; min-height: 60px; }

    /* ── Customer card ── */
    .od-customer-grid { display: flex; flex-direction: column; gap: 2px; margin-bottom: 12px; }
    .od-cust-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid var(--color-100); font-size: 13px; }
    .od-cust-row:last-child { border-bottom: none; }
    .od-cust-lbl { font-size: 11px; color: var(--color-text-tertiary); }
    .od-cust-val { font-weight: 500; text-align: right; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .od-address-block { background: var(--color-bg-tertiary); border-radius: 10px; padding: 12px 14px; }
    .od-address-label { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; color: var(--color-text-tertiary); margin-bottom: 6px; }
    .od-address-text { font-size: 13px; line-height: 1.6; color: var(--color-text-primary); }

    /* ── Rider card ── */
    .od-rider-hero { display: flex; align-items: center; gap: 14px; padding: 8px 0 12px; }
    .od-rider-avatar {
      width: 56px; height: 56px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .od-rider-name { font-size: 17px; font-weight: 700; margin-bottom: 2px; }
    .od-rider-phone { font-size: 13px; color: var(--color-text-tertiary); }
    .od-rider-rating { display: flex; align-items: center; gap: 4px; margin-top: 6px; font-size: 14px; color: #f59e0b; }
    .od-rider-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .od-rm-item { background: var(--color-bg-tertiary); border-radius: 8px; padding: 8px 6px; text-align: center; }
    .od-rm-val { font-size: 18px; font-weight: 700; }
    .od-rm-lbl { font-size: 9px; color: var(--color-text-tertiary); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.3px; }
    .od-no-rider { text-align: center; padding: 24px 0; color: var(--color-text-tertiary); font-size: 13px; }

    /* ── Timeline ── */
    .od-timeline { padding: 4px 0; }
    .od-tl-item {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 8px 0; position: relative; opacity: 0.4;
    }
    .od-tl-item.done { opacity: 1; }
    .od-tl-item:not(:last-child)::after {
      content: ''; position: absolute; left: 7px; top: 28px;
      width: 2px; height: calc(100% - 8px); background: var(--color-200);
    }
    .od-tl-item.done:not(:last-child)::after { background: var(--color-primary); opacity: 0.3; }
    .od-tl-dot {
      width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0;
      background: var(--color-200); border: 2px solid var(--color-300); margin-top: 2px;
    }
    .od-tl-item.done .od-tl-dot { background: var(--color-primary); border-color: var(--color-primary); }
    .od-tl-label { font-size: 13px; font-weight: 600; }
    .od-tl-time { font-size: 11px; color: var(--color-400); margin-top: 1px; }

    /* ── Revenue rows ── */
    .od-rev-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 0; font-size: 13px; border-bottom: 1px solid var(--color-100);
    }
    .od-rev-row:last-child { border-bottom: none; }
    .od-rev-total { font-weight: 600; padding: 10px 0; }
    .od-rev-divider { height: 1px; background: var(--color-200); margin: 4px 0 8px; }

    /* ── Force assign ── */
    .od-force-assign { margin-top: 16px; }
    .od-rider-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px; padding: 8px 0 4px;
    }
    .od-rider-card {
      border: 2px solid var(--color-200); border-radius: 12px;
      overflow: hidden; cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
    }
    .od-rider-card:hover { border-color: var(--color-primary); box-shadow: 0 2px 12px rgba(0,0,0,0.08); transform: translateY(-1px); }
    .od-rider-card.selected { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(232,53,42,0.12); }
    .od-rc-bar { height: 4px; width: 100%; }
    .od-rc-body { padding: 12px; }
    .od-rc-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .od-rc-name { font-weight: 700; font-size: 14px; line-height: 1.3; }
    .od-rc-phone { font-size: 11px; color: var(--color-400); margin-top: 2px; }
    .od-rc-check { width: 22px; height: 22px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .od-rc-status-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .od-rc-badge { padding: 2px 8px; border-radius: 100px; font-size: 11px; font-weight: 600; }
    .od-rc-metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; }
    .od-rc-metric { background: var(--color-50); border-radius: 6px; padding: 6px 4px; text-align: center; }
    .od-rc-metric-val { font-size: 15px; font-weight: 700; line-height: 1.2; }
    .od-rc-metric-label { font-size: 9px; color: var(--color-400); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.3px; }

    /* ── MOBILE RESPONSIVE ── */
    @media (max-width: 768px) {
      .od-page { padding: 0 0 60px; }
      .od-mobile-header { display: flex; }
      .od-desktop-header { display: none !important; }

      .od-hero-card { border-radius: 0; border-left: none; border-right: none; margin-bottom: 12px; }
      .od-hero-value { font-size: 40px; }

      .od-rev-strip { grid-template-columns: 1fr 1fr; margin-bottom: 12px; padding: 0 12px; }
      .od-rev-chip { padding: 12px 14px; }
      .od-rc-val { font-size: 18px; }

      .od-main-grid { grid-template-columns: 1fr; gap: 12px; }
      .od-col-left, .od-col-right { gap: 12px; }
      .card { border-radius: 12px; margin: 0 12px; }

      .od-skel-grid { grid-template-columns: 1fr; }

      .od-pay-grid { grid-template-columns: 1fr; }

      .od-rider-metrics { grid-template-columns: repeat(4, 1fr); }
    }

    @media (max-width: 480px) {
      .od-hero-stats { grid-template-columns: repeat(4, 1fr); gap: 6px; }
      .od-hs-val { font-size: 14px; }
      .od-rev-strip { gap: 8px; padding: 0 12px; }
    }
  `]
})
export class OrderDetailComponent implements OnInit {
  orderId = '';
  order: any = null;
  loading = true;
  riders: any[] = [];
  selectedRiderId = '';
  assigning = false;
  assignError = '';
  assignSuccess = '';

  private readonly FORCE_ASSIGN_STATUSES = [
    'CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP',
    'AWAITING_RIDER_ASSIGNMENT', 'OFFERED_TO_RIDER', 'RIDER_ASSIGNED'
  ];

  get showForceAssign(): boolean {
    return !!(this.order && this.FORCE_ASSIGN_STATUSES.includes(this.order.status));
  }

  get assignedRider(): any {
    if (!this.order?.riderId) return null;
    return this.riders.find(r => r.riderId === this.order.riderId) || null;
  }

  get restaurantShare(): number {
    if (!this.order) return 0;
    if (this.order.revenue?.restaurantRevenue?.revenue != null)
      return +this.order.revenue.restaurantRevenue.revenue;
    const commission = (+this.order.foodTotal) * 0.15;
    return Math.max(0, +this.order.foodTotal - commission);
  }

  get platformShare(): number {
    if (!this.order) return 0;
    if (this.order.revenue?.platformRevenue) {
      const pr = this.order.revenue.platformRevenue;
      if (pr.finalPayout != null) return +pr.finalPayout;
      return (+pr.foodCommission || 0) + (+pr.platformFee || 0) + (+pr.excessFromRestaurantRevenue || 0);
    }
    const commission = (+this.order.foodTotal) * 0.15;
    return commission + (+this.order.platformFee || 0);
  }

  get couponApplied(): boolean {
    return !!(this.order?.calculatedFeeResponse?.couponApplied);
  }

  get couponCode(): string {
    return this.order?.calculatedFeeResponse?.couponCode || '';
  }

  get couponDiscount(): number {
    return +(this.order?.calculatedFeeResponse?.breakdown?.couponDiscount || 0);
  }

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.assignSuccess = '';
    this.assignError = '';
    forkJoin({
      orderRes: this.api.getOrderById(this.orderId).pipe(catchError(() => of(null))),
      ridersRes: this.api.listRiders().pipe(catchError(() => of({ riders: [] })))
    }).subscribe(({ orderRes, ridersRes }: any) => {
      this.order = orderRes;
      this.riders = (ridersRes.riders || []).sort((a: any, b: any) => {
        if (a.isActive !== b.isActive) return b.isActive ? 1 : -1;
        const aLoad = a.workingOnOrder?.length || 0;
        const bLoad = b.workingOnOrder?.length || 0;
        if (aLoad !== bLoad) return aLoad - bLoad;
        return (b.rating || 0) - (a.rating || 0);
      });
      this.loading = false;
    });
  }

  forceAssign(): void {
    if (!this.selectedRiderId) return;
    this.assigning = true;
    this.assignError = '';
    this.assignSuccess = '';
    this.api.updateOrderStatus(this.orderId, 'RIDER_ASSIGNED', this.selectedRiderId).subscribe({
      next: () => {
        this.assignSuccess = 'Rider assigned successfully!';
        this.assigning = false;
        setTimeout(() => this.reload(), 800);
      },
      error: () => {
        this.assignError = 'Assignment failed. Please try again.';
        this.assigning = false;
      }
    });
  }

  riderDisplayName(r: any): string {
    if (!r) return '—';
    if (r.firstName || r.lastName) return `${r.firstName || ''} ${r.lastName || ''}`.trim();
    return r.riderId?.slice(0, 12) || 'Rider';
  }

  formatTime(iso: string): string {
    if (!iso) return '—';
    return iso.slice(11, 16);
  }

  formatDateTime(iso: string): string {
    if (!iso) return '—';
    return iso.slice(0, 16).replace('T', ' ');
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }
}
