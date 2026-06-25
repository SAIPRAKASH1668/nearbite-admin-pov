/**
 * Rider Bonus Config — admin editor for the rider bonus campaign (riderBonusConfig).
 * Reads/writes via the ops endpoints (/api/v1/ops/rider-bonus), gated by the
 * ADMIN_API_KEY (sent as X-Api-Key by ApiService). Persisted to CONFIG#RIDER.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface Milestone { stops: number | null; amount: number | null; }

interface BonusForm {
  enabled: boolean;
  title: string;
  description: string;
  startDate: string;   // datetime-local: YYYY-MM-DDTHH:MM
  endDate: string;
  targetStops: number | null;
  milestones: Milestone[];
}

function emptyForm(): BonusForm {
  return { enabled: false, title: '', description: '', startDate: '', endDate: '', targetStops: null, milestones: [] };
}

// Stored ISO (e.g. "2026-05-17T23:59:59+05:30") -> datetime-local input value.
function toLocalInput(iso: any): string {
  const s = String(iso || '');
  if (!s) return '';
  if (s.length >= 16) return s.slice(0, 16);
  if (s.length === 10) return `${s}T00:00`;
  return s;
}
// datetime-local value -> stored ISO with explicit IST offset.
function toStored(local: string): string {
  const s = String(local || '').trim();
  if (!s) return '';
  return s.length === 16 ? `${s}:00+05:30` : s;
}

@Component({
  selector: 'app-rider-bonus-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="page fade-in">
    <div class="page-header">
      <div>
        <div class="page-title">Rider Bonus Config</div>
        <div class="page-subtitle">Milestone bonus campaign for riders</div>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary btn-sm" (click)="load()" [disabled]="loading || !api.hasAdminKey">↻ Refresh</button>
      </div>
    </div>

    <!-- Admin key bar -->
    <div class="card keybar" *ngIf="!api.hasAdminKey || showKeyEdit">
      <div>
        <strong>Admin API key</strong>
        <p class="text-tertiary">Ops endpoints need the <b>ADMIN_API_KEY</b> (sent as X-Api-Key). Dev default: <code>dev-admin-key-12345</code>.</p>
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

    <div class="alert-error" *ngIf="error" style="margin-bottom:12px">✕ {{ error }}</div>
    <div class="alert-success" *ngIf="success" style="margin-bottom:12px">✓ {{ success }}</div>

    <div class="card" *ngIf="loading" style="padding:24px">
      <div class="skeleton" style="height:48px;margin-bottom:8px;border-radius:8px" *ngFor="let i of [1,2,3]"></div>
    </div>

    <div class="card bonus-card" *ngIf="api.hasAdminKey && !loading">
      <label class="enable-row">
        <input type="checkbox" [(ngModel)]="form.enabled" />
        <span>Campaign enabled</span>
        <span class="enable-hint">When on, riders earn milestone bonuses within the date window.</span>
      </label>

      <div class="bonus-grid">
        <div class="form-group full">
          <label>Title</label>
          <input class="form-input" [(ngModel)]="form.title" placeholder="Weekly Rider Bonus" />
        </div>
        <div class="form-group full">
          <label>Description</label>
          <input class="form-input" [(ngModel)]="form.description" placeholder="Shown to riders on the earnings screen" />
        </div>
        <div class="form-group">
          <label>Start date &amp; time (IST)</label>
          <input class="form-input" type="datetime-local" [(ngModel)]="form.startDate" />
        </div>
        <div class="form-group">
          <label>End date &amp; time (IST)</label>
          <input class="form-input" type="datetime-local" [(ngModel)]="form.endDate" />
        </div>
        <div class="form-group">
          <label>Target stops</label>
          <input class="form-input" type="number" min="0" step="1" [(ngModel)]="form.targetStops" placeholder="10" />
        </div>
      </div>

      <div class="milestones">
        <div class="milestones-head">
          <div class="settings-title">Milestones</div>
          <button class="btn btn-secondary btn-sm" (click)="addMilestone()">+ Add milestone</button>
        </div>
        <div class="empty-state" *ngIf="form.milestones.length === 0" style="padding:12px">No milestones yet.</div>
        <div class="milestone-row" *ngFor="let m of form.milestones; let i = index">
          <div class="form-group">
            <label>Stops</label>
            <input class="form-input" type="number" min="1" step="1" [(ngModel)]="m.stops" placeholder="5" />
          </div>
          <div class="form-group">
            <label>Bonus amount (₹)</label>
            <input class="form-input" type="number" min="0" step="5" [(ngModel)]="m.amount" placeholder="50" />
          </div>
          <button class="btn btn-danger btn-sm milestone-remove" (click)="removeMilestone(i)" title="Remove">✕</button>
        </div>
      </div>

      <div class="bonus-footer">
        <button class="btn btn-secondary btn-sm" (click)="load()" [disabled]="saving">Reset</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving…' : 'Save Bonus Config' }}</button>
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
    .bonus-card { padding:18px; }
    .enable-row { display:flex; align-items:center; gap:10px; font-weight:700; font-size:14px; margin-bottom:16px; cursor:pointer; flex-wrap:wrap; }
    .enable-row input { width:18px; height:18px; }
    .enable-hint { font-weight:400; font-size:12px; color:var(--color-text-tertiary,#888); }
    .bonus-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .bonus-grid .form-group { display:flex; flex-direction:column; gap:6px; }
    .bonus-grid .full { grid-column:1/-1; }
    .bonus-grid label, .milestone-row label { font-size:12px; font-weight:600; color:var(--color-text-secondary); }
    .milestones { margin-top:18px; }
    .milestones-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
    .settings-title { font-size:14px; font-weight:700; }
    .milestone-row { display:grid; grid-template-columns:1fr 1fr auto; gap:12px; align-items:end; margin-bottom:10px; }
    .milestone-row .form-group { display:flex; flex-direction:column; gap:6px; }
    .milestone-remove { height:38px; }
    .bonus-footer { display:flex; gap:10px; justify-content:flex-end; margin-top:18px; }
    @media (max-width:560px) { .bonus-grid { grid-template-columns:1fr; } }
  `]
})
export class RiderBonusConfigComponent implements OnInit {
  form: BonusForm = emptyForm();
  loading = false;
  saving = false;
  success = '';
  error = '';
  adminKeyInput = '';
  showKeyEdit = false;

  constructor(public api: ApiService) {}

  ngOnInit(): void {
    if (this.api.hasAdminKey) this.load();
  }

  saveAdminKey(): void {
    this.api.setAdminKey(this.adminKeyInput);
    this.adminKeyInput = '';
    this.showKeyEdit = false;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.getRiderBonusConfig().subscribe({
      next: (res: any) => {
        const b = res?.bonusConfig || {};
        this.form = {
          enabled: !!b.enabled,
          title: b.title || '',
          description: b.description || '',
          startDate: toLocalInput(b.startDate),
          endDate: toLocalInput(b.endDate),
          targetStops: b.targetStops ?? null,
          milestones: Array.isArray(b.milestones)
            ? b.milestones.map((m: any) => ({ stops: m?.stops ?? null, amount: m?.amount ?? null }))
            : [],
        };
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.message || 'Failed to load bonus config (check the admin key / environment).';
        this.loading = false;
      },
    });
  }

  addMilestone(): void {
    this.form.milestones.push({ stops: null, amount: null });
  }

  removeMilestone(i: number): void {
    this.form.milestones.splice(i, 1);
  }

  save(): void {
    this.saving = true;
    this.success = '';
    this.error = '';
    const payload = {
      enabled: this.form.enabled,
      title: this.form.title.trim(),
      description: this.form.description.trim(),
      startDate: toStored(this.form.startDate),
      endDate: toStored(this.form.endDate),
      targetStops: Number(this.form.targetStops || 0),
      milestones: this.form.milestones
        .filter(m => m.stops != null && m.amount != null)
        .map(m => ({ stops: Number(m.stops), amount: Number(m.amount) })),
    };
    this.api.saveRiderBonusConfig(payload).subscribe({
      next: () => {
        this.saving = false;
        this.success = 'Bonus config saved';
        setTimeout(() => this.success = '', 3000);
      },
      error: (e) => {
        this.saving = false;
        this.error = e?.error?.message || 'Failed to save bonus config';
        setTimeout(() => this.error = '', 5000);
      },
    });
  }
}
