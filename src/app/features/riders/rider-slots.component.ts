/**
 * Rider Slots — admin CRUD dashboard.
 * Manages shift slots via the backend ops endpoints (/api/v1/ops/rider-slots),
 * which are gated by the ADMIN_API_KEY (sent as X-Api-Key by ApiService).
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface SlotForm {
  slotId: string;
  label: string;
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  price: number | null;
  totalSeats: number | null;
  released: boolean;
}

function emptyForm(): SlotForm {
  return { slotId: '', label: '', date: '', startTime: '', endTime: '', price: null, totalSeats: null, released: false };
}

@Component({
  selector: 'app-rider-slots',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="page fade-in">

    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="page-title">Rider Slots</div>
        <div class="page-subtitle">{{ slots.length }} slots · {{ releasedCount }} released · {{ draftCount }} draft</div>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary btn-sm" (click)="load()" [disabled]="loading">↻ Refresh</button>
        <button class="btn btn-primary btn-sm" (click)="openCreate()" [disabled]="!api.hasAdminKey">+ New Slot</button>
      </div>
    </div>

    <!-- Admin key bar -->
    <div class="card keybar" *ngIf="!api.hasAdminKey || showKeyEdit">
      <div>
        <strong>Admin API key</strong>
        <p class="text-tertiary">Ops endpoints need the <b>ADMIN_API_KEY</b> (sent as X-Api-Key) — not the mobile/web key. Dev default: <code>dev-admin-key-12345</code>.</p>
      </div>
      <div class="keybar-input">
        <input class="form-input" type="password" placeholder="ADMIN_API_KEY" [(ngModel)]="adminKeyInput" />
        <button class="btn btn-primary btn-sm" (click)="saveAdminKey()" [disabled]="!adminKeyInput.trim()">Save key</button>
        <button class="btn btn-secondary btn-sm" *ngIf="api.hasAdminKey" (click)="showKeyEdit=false">Cancel</button>
      </div>
    </div>
    <div class="keybar-compact" *ngIf="api.hasAdminKey && !showKeyEdit">
      <span class="text-tertiary">Admin key set ✓ · env: {{ api.currentEnv }}</span>
      <button class="btn btn-ghost btn-xs" (click)="adminKeyInput=''; showKeyEdit=true">Change key</button>
    </div>

    <!-- Alerts -->
    <div class="alert-success" *ngIf="success" style="margin-bottom:12px">✓ {{ success }}</div>
    <div class="alert-error" *ngIf="error" style="margin-bottom:12px">✕ {{ error }}</div>

    <!-- Stats -->
    <div class="stats-grid-4" style="margin-bottom:16px" *ngIf="api.hasAdminKey">
      <div class="stat-card"><div class="stat-label">Total Slots</div><div class="stat-value">{{ slots.length }}</div></div>
      <div class="stat-card"><div class="stat-label">Released</div><div class="stat-value" style="color:var(--color-success)">{{ releasedCount }}</div></div>
      <div class="stat-card"><div class="stat-label">Draft</div><div class="stat-value" style="color:var(--color-warning)">{{ draftCount }}</div></div>
      <div class="stat-card"><div class="stat-label">Seats (booked / total)</div><div class="stat-value">{{ bookedSeats }} / {{ totalSeats }}</div></div>
    </div>

    <!-- Slot Settings -->
    <div class="card settings-card" *ngIf="api.hasAdminKey && !loading">
      <div class="settings-head">
        <div>
          <div class="settings-title">Slot Settings</div>
          <div class="settings-sub">Compliance, penalties &amp; booking rules · stored in CONFIG#RIDER</div>
        </div>
        <button class="btn btn-primary btn-sm" (click)="saveSettings()" [disabled]="savingSettings">
          {{ savingSettings ? 'Saving…' : 'Save settings' }}
        </button>
      </div>
      <div class="settings-grid">
        <div class="form-group" *ngFor="let f of settingsFields">
          <label>{{ f.label }}</label>
          <input class="form-input" type="number" [min]="f.min" [step]="f.step" [(ngModel)]="settings[f.key]" />
        </div>
      </div>
      <div class="alert-success" *ngIf="settingsMsg" style="margin-top:10px">✓ {{ settingsMsg }}</div>
      <div class="alert-error" *ngIf="settingsError" style="margin-top:10px">✕ {{ settingsError }}</div>
    </div>

    <!-- Loading -->
    <div class="card" *ngIf="loading" style="padding:24px">
      <div class="skeleton" style="height:48px;margin-bottom:8px;border-radius:8px" *ngFor="let i of [1,2,3,4,5]"></div>
    </div>

    <!-- Empty -->
    <div class="empty-state" *ngIf="!loading && api.hasAdminKey && slots.length === 0">
      <div class="empty-icon">🗓️</div>
      <h4>No slots yet</h4>
      <p>Create a slot, then release it so riders can book.</p>
      <button class="btn btn-primary" (click)="openCreate()">+ New Slot</button>
    </div>

    <!-- Table -->
    <div class="data-table-container" *ngIf="!loading && slots.length > 0">
      <table class="data-table">
        <thead>
          <tr>
            <th>Slot</th><th>Date</th><th>Time</th><th>Duration</th>
            <th>Guarantee</th><th>Seats</th><th>Status</th><th style="text-align:right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let s of slots; trackBy: trackId">
            <td>
              <div><strong>{{ s.label || 'Slot' }}</strong></div>
              <small class="text-tertiary font-mono">{{ s.slotId }}</small>
            </td>
            <td>{{ s.date }}</td>
            <td>{{ s.startTime }}–{{ s.endTime }}</td>
            <td>{{ s.durationMinutes }}m</td>
            <td>₹{{ s.price }}</td>
            <td>{{ s.bookedSeats || 0 }} / {{ s.totalSeats }}</td>
            <td>
              <span class="badge" [class.badge-success]="s.released" [class.badge-warning]="!s.released">
                {{ s.released ? 'Released' : 'Draft' }}
              </span>
            </td>
            <td>
              <div class="action-buttons" style="justify-content:flex-end">
                <button class="btn btn-success btn-xs" *ngIf="!s.released" (click)="release(s)" title="Release for booking">Release</button>
                <button class="btn btn-secondary btn-xs" (click)="openEdit(s)" title="Edit">Edit</button>
                <button class="btn btn-danger btn-xs" (click)="askDelete(s)" title="Delete">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create / Edit modal -->
    <div class="panel-overlay" *ngIf="showForm" (click)="showForm=false">
      <div class="panel" (click)="$event.stopPropagation()">
        <div class="panel-header">
          <h3>{{ editing ? 'Edit Slot' : 'New Slot' }}</h3>
          <button class="btn btn-ghost btn-sm" (click)="showForm=false">✕</button>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <label>Label</label>
            <input class="form-input" [(ngModel)]="form.label" placeholder="e.g. Dinner peak" />
          </div>
          <div class="form-group">
            <label>Date *</label>
            <input class="form-input" type="date" [(ngModel)]="form.date" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Start *</label>
              <input class="form-input" type="time" [(ngModel)]="form.startTime" />
            </div>
            <div class="form-group">
              <label>End *</label>
              <input class="form-input" type="time" [(ngModel)]="form.endTime" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Guarantee (₹) *</label>
              <input class="form-input" type="number" min="0" [(ngModel)]="form.price" />
            </div>
            <div class="form-group">
              <label>Total seats *</label>
              <input class="form-input" type="number" min="1" [(ngModel)]="form.totalSeats" />
            </div>
          </div>
          <label class="check-row" *ngIf="!editing">
            <input type="checkbox" [(ngModel)]="form.released" />
            <span>Release immediately (open for booking now)</span>
          </label>
          <div class="alert-error" *ngIf="formError">✕ {{ formError }}</div>
        </div>
        <div class="panel-footer">
          <button class="btn btn-secondary" (click)="showForm=false">Cancel</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving…' : (editing ? 'Save changes' : 'Create slot') }}</button>
        </div>
      </div>
    </div>

    <!-- Delete confirm -->
    <div class="panel-overlay" *ngIf="deleteTarget" (click)="deleteTarget=null">
      <div class="panel" style="max-width:420px" (click)="$event.stopPropagation()">
        <div class="panel-header"><h3>Delete slot?</h3><button class="btn btn-ghost btn-sm" (click)="deleteTarget=null">✕</button></div>
        <div class="panel-body">
          <p>Delete <strong>{{ deleteTarget.label || 'Slot' }}</strong> on {{ deleteTarget.date }} ({{ deleteTarget.startTime }}–{{ deleteTarget.endTime }})?
             <span *ngIf="(deleteTarget.bookedSeats || 0) > 0"><br/><br/>⚠ {{ deleteTarget.bookedSeats }} rider(s) have booked this slot — their bookings will be cancelled.</span>
          </p>
        </div>
        <div class="panel-footer">
          <button class="btn btn-secondary" (click)="deleteTarget=null">Cancel</button>
          <button class="btn btn-danger" (click)="doDelete()" [disabled]="saving">{{ saving ? 'Deleting…' : 'Delete' }}</button>
        </div>
      </div>
    </div>

  </div>
  `,
  styles: [`
    .keybar { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:16px; flex-wrap:wrap; }
    .keybar p { margin:4px 0 0; font-size:12px; }
    .keybar-input { display:flex; gap:8px; align-items:center; }
    .keybar-input .form-input { min-width:280px; }
    .keybar-compact { display:flex; align-items:center; gap:10px; margin-bottom:12px; font-size:12px; }
    .check-row { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--color-text-secondary); cursor:pointer; }
    .check-row input { width:16px; height:16px; }
    .settings-card { padding:16px; margin-bottom:16px; }
    .settings-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; flex-wrap:wrap; }
    .settings-title { font-size:15px; font-weight:700; }
    .settings-sub { font-size:12px; color:var(--color-text-tertiary,#888); margin-top:2px; }
    .settings-grid { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:12px; }
    .settings-grid .form-group { display:flex; flex-direction:column; gap:6px; }
    .settings-grid label { font-size:12px; font-weight:600; color:var(--color-text-secondary); }
    @media (max-width:900px) { .settings-grid { grid-template-columns:1fr 1fr; } }
    @media (max-width:560px) { .settings-grid { grid-template-columns:1fr; } }
  `]
})
export class RiderSlotsComponent implements OnInit {
  slots: any[] = [];
  loading = false;
  saving = false;
  success = '';
  error = '';

  showForm = false;
  editing = false;
  form: SlotForm = emptyForm();
  formError = '';

  deleteTarget: any = null;
  adminKeyInput = '';
  showKeyEdit = false;

  settings: Record<string, number> = {};
  savingSettings = false;
  settingsMsg = '';
  settingsError = '';
  settingsFields: { key: string; label: string; step: number; min: number }[] = [
    { key: 'complianceThresholdPct', label: 'Compliance threshold (0–1)', step: 0.05, min: 0 },
    { key: 'maxRejectionsAllowed', label: 'Max rejections allowed', step: 1, min: 0 },
    { key: 'noShowPenalty', label: 'No-show penalty (₹)', step: 5, min: 0 },
    { key: 'staleSeconds', label: 'Offer stale after (sec)', step: 5, min: 0 },
    { key: 'noShowBanThreshold', label: 'No-show ban threshold', step: 1, min: 0 },
    { key: 'noShowBanWindowDays', label: 'No-show ban window (days)', step: 1, min: 0 },
    { key: 'noShowBanDurationDays', label: 'No-show ban duration (days)', step: 1, min: 0 },
    { key: 'releaseDaysInAdvance', label: 'Release days in advance', step: 1, min: 0 },
    { key: 'cancelCutoffHours', label: 'Cancel cutoff (hours)', step: 1, min: 0 },
  ];

  constructor(public api: ApiService) {}

  ngOnInit(): void {
    if (this.api.hasAdminKey) this.load();
  }

  get releasedCount(): number { return this.slots.filter(s => s.released).length; }
  get draftCount(): number { return this.slots.filter(s => !s.released).length; }
  get totalSeats(): number { return this.slots.reduce((n, s) => n + (+s.totalSeats || 0), 0); }
  get bookedSeats(): number { return this.slots.reduce((n, s) => n + (+s.bookedSeats || 0), 0); }

  trackId = (_: number, s: any) => s.slotId;

  saveAdminKey(): void {
    this.api.setAdminKey(this.adminKeyInput);
    this.adminKeyInput = '';
    this.showKeyEdit = false;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.listRiderSlots().subscribe({
      next: (res: any) => {
        this.slots = (res?.slots || []).sort((a: any, b: any) =>
          (a.date + a.startTime).localeCompare(b.date + b.startTime));
        this.settings = { ...(res?.settings || {}) };
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.message || 'Failed to load slots (check the admin key / environment).';
        this.loading = false;
      },
    });
  }

  saveSettings(): void {
    this.savingSettings = true;
    this.settingsMsg = '';
    this.settingsError = '';
    const payload: Record<string, number> = {};
    for (const f of this.settingsFields) {
      const v = Number((this.settings as any)[f.key]);
      if (!Number.isNaN(v)) payload[f.key] = v;
    }
    this.api.updateRiderSlotSettings(payload).subscribe({
      next: (res: any) => {
        this.settings = { ...(res?.settings || this.settings) };
        this.savingSettings = false;
        this.settingsMsg = 'Settings saved';
        setTimeout(() => this.settingsMsg = '', 3000);
      },
      error: (e) => {
        this.savingSettings = false;
        this.settingsError = e?.error?.message || 'Failed to save settings';
        setTimeout(() => this.settingsError = '', 4000);
      },
    });
  }

  openCreate(): void {
    this.editing = false;
    this.form = emptyForm();
    this.formError = '';
    this.showForm = true;
  }

  openEdit(s: any): void {
    this.editing = true;
    this.form = {
      slotId: s.slotId, label: s.label || '', date: s.date,
      startTime: s.startTime, endTime: s.endTime,
      price: s.price, totalSeats: s.totalSeats, released: !!s.released,
    };
    this.formError = '';
    this.showForm = true;
  }

  private validate(): string | null {
    const f = this.form;
    if (!f.date || !f.startTime || !f.endTime) return 'Date, start and end time are required.';
    if (f.endTime <= f.startTime) return 'End time must be after start time.';
    if (f.price == null || f.price < 0) return 'Guarantee must be ≥ 0.';
    if (f.totalSeats == null || f.totalSeats < 1) return 'Total seats must be ≥ 1.';
    return null;
  }

  save(): void {
    const err = this.validate();
    if (err) { this.formError = err; return; }
    this.saving = true;
    this.formError = '';
    const f = this.form;
    const body: any = {
      label: f.label, date: f.date, startTime: f.startTime, endTime: f.endTime,
      price: Number(f.price), totalSeats: Number(f.totalSeats),
    };
    const done = (msg: string) => { this.saving = false; this.showForm = false; this.flash(msg); this.load(); };
    const fail = (e: any) => { this.saving = false; this.formError = e?.error?.message || 'Save failed.'; };

    if (this.editing) {
      this.api.updateRiderSlot(f.slotId, body).subscribe({ next: () => done('Slot updated'), error: fail });
    } else {
      if (f.released) body.released = true;
      this.api.createRiderSlot(body).subscribe({ next: () => done('Slot created'), error: fail });
    }
  }

  release(s: any): void {
    this.api.releaseRiderSlot(s.slotId).subscribe({
      next: () => { this.flash('Slot released'); this.load(); },
      error: (e) => { this.error = e?.error?.message || 'Release failed.'; },
    });
  }

  askDelete(s: any): void { this.deleteTarget = s; }

  doDelete(): void {
    if (!this.deleteTarget) return;
    this.saving = true;
    this.api.deleteRiderSlot(this.deleteTarget.slotId).subscribe({
      next: () => { this.saving = false; this.deleteTarget = null; this.flash('Slot deleted'); this.load(); },
      error: (e) => { this.saving = false; this.error = e?.error?.message || 'Delete failed.'; this.deleteTarget = null; },
    });
  }

  private flash(msg: string): void {
    this.success = msg;
    setTimeout(() => (this.success = ''), 3000);
  }
}
