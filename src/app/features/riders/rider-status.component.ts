import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-rider-status',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="page fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Rider Status Board</div>
      <div class="page-subtitle">Live status of all delivery partners</div>
    </div>
    <div class="flex gap-sm align-center">
      <span class="live-badge">LIVE</span>
      <button class="btn btn-secondary btn-sm" (click)="load()">↻ Refresh</button>
    </div>
  </div>

  <div class="stats-grid-4" style="margin-bottom:16px">
    <div class="stat-card">
      <div class="stat-label">Total Riders</div>
      <div class="stat-value">{{ riders.length }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Online</div>
      <div class="stat-value" style="color:var(--color-success)">{{ online.length }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">On Delivery</div>
      <div class="stat-value" style="color:var(--color-warning)">{{ onDelivery.length }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Offline</div>
      <div class="stat-value" style="color:var(--color-400)">{{ offline.length }}</div>
    </div>
  </div>

  <div class="rs-grid">

    <!-- Online Riders Panel -->
    <div class="card">
      <div class="card-header">Online &amp; Available ({{ online.length }})</div>
      <div *ngIf="loading" class="text-secondary" style="padding:12px">Loading...</div>
      <div class="rider-status-list" *ngIf="!loading">
        <div class="rider-row" *ngFor="let r of online">
          <span class="pulse-online"></span>
          <div class="rider-info">
            <strong>{{ r.firstName }} {{ r.lastName }}</strong>
            <span class="text-secondary font-mono" style="font-size:10px">{{ r.phone }}</span>
          </div>
          <div class="rider-meta">
            <span class="badge badge-success">Online</span>
            <span class="text-secondary" style="font-size:11px">{{ r.ordersAssignedLast7d || 0 }} / 7d</span>
          </div>
        </div>
        <div *ngIf="online.length===0" class="text-secondary no-data">No riders online</div>
      </div>
    </div>

    <!-- On Delivery Panel -->
    <div class="card">
      <div class="card-header">On Active Delivery ({{ onDelivery.length }})</div>
      <div class="rider-status-list" *ngIf="!loading">
        <div class="rider-row" *ngFor="let r of onDelivery">
          <span class="status-dot on-delivery"></span>
          <div class="rider-info">
            <strong>{{ r.firstName }} {{ r.lastName }}</strong>
            <span class="text-secondary font-mono" style="font-size:10px">{{ r.phone }}</span>
          </div>
          <div class="rider-meta">
            <span class="badge badge-warning">On Delivery</span>
            <span class="font-mono" style="font-size:10px">{{ r.workingOnOrder?.[0] }}</span>
          </div>
        </div>
        <div *ngIf="onDelivery.length===0" class="text-secondary no-data">No active deliveries</div>
      </div>
    </div>

    <!-- Offline Panel -->
    <div class="card rs-offline-panel">
      <div class="card-header">Offline Riders ({{ offline.length }})</div>
      <div class="rider-grid" *ngIf="!loading">
        <div class="rider-chip" *ngFor="let r of offline">
          <span class="status-dot offline"></span>
          <span>{{ r.firstName }} {{ r.lastName }}</span>
          <span class="text-secondary font-mono" style="font-size:10px;margin-left:4px">{{ r.phone }}</span>
        </div>
        <div *ngIf="offline.length===0" class="text-secondary no-data">All riders are online!</div>
      </div>
    </div>

  </div>
</div>
  `,
  styles: [`
    .page { padding: 24px; }
    .rs-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .rs-offline-panel { grid-column: 1 / -1; }
    .rider-status-list { display:flex; flex-direction:column; gap:6px; padding:12px; }
    .rider-row { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:6px; background:var(--color-50); }
    .rider-info { flex:1; display:flex; flex-direction:column; }
    .rider-meta { display:flex; flex-direction:column; align-items:flex-end; gap:2px; }
    .status-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .status-dot.on-delivery { background:var(--color-warning); }
    .status-dot.offline { background:var(--color-300); }
    .rider-grid { display:flex; flex-wrap:wrap; gap:8px; padding:12px; }
    .rider-chip { display:flex; align-items:center; gap:6px; padding:6px 12px; border:1px solid var(--color-border); border-radius:20px; font-size:12px; }
    .no-data { padding:16px; text-align:center; font-size:13px; }
    .card-header { font-weight:600; font-size:13px; padding:12px 14px; border-bottom:1px solid var(--color-border); }
    @media (max-width: 768px) {
      .page { padding: 12px; }
      .rs-grid { grid-template-columns: 1fr; }
      .rs-offline-panel { grid-column: 1; }
    }
  `]
})
export class RiderStatusComponent implements OnInit {
  riders: any[] = [];
  loading = true;

  get online(): any[] { return this.riders.filter(r => r.isActive && (!r.workingOnOrder || r.workingOnOrder.length === 0)); }
  get onDelivery(): any[] { return this.riders.filter(r => r.workingOnOrder?.length > 0); }
  get offline(): any[] { return this.riders.filter(r => !r.isActive); }

  constructor(private api: ApiService) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.listRiders().subscribe({
      next: (res: any) => { this.riders = res.riders || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
