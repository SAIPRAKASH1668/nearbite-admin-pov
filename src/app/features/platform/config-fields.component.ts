/**
 * Config Editor — structured editor for the fee / commission / hike-cap fields that
 * live on the global config and can be overridden per restaurant.
 *
 * Pick a target from the dropdown (Global, or a restaurant). The form loads the
 * *effective* values (GET /api/v1/effective-config): for a restaurant with no config
 * of its own, that's the global values — so hitting Save materializes a restaurant
 * config seeded from global, which you can then tweak per field. Saving writes only
 * the listed fields (POST /api/v1/config-fields), preserving every other key on the row.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface FieldDef { key: string; label: string; unit: string; step: string; hint?: string; }
interface FieldGroup { title: string; fields: FieldDef[]; }

const GROUPS: FieldGroup[] = [
  {
    title: 'Delivery & fees',
    fields: [
      { key: 'platformFee', label: 'Platform fee', unit: '₹', step: '0.5' },
      { key: 'riderBaseFare', label: 'Rider base fare', unit: '₹', step: '0.5' },
      { key: 'riderBaseFareApplicableUnderKms', label: 'Base fare applies under', unit: 'km', step: '0.1' },
      { key: 'riderFarePerKm', label: 'Rider fare per km', unit: '₹/km', step: '0.5' },
      { key: 'customerViewRiderFarePerKm', label: 'Customer-view fare per km', unit: '₹/km', step: '0.5' },
      { key: 'riderFreeDeliveryBelowKm', label: 'Free delivery below', unit: 'km', step: '0.1' },
      { key: 'freeDeliveryAboveThreshold', label: 'Free delivery above order value', unit: '₹', step: '10' },
      { key: 'maxDeliveryRadiusKm', label: 'Max delivery radius', unit: 'km', step: '0.5' },
    ],
  },
  {
    title: 'Commission',
    fields: [
      { key: 'restaurantCommissionPercentage', label: 'Restaurant commission', unit: '%', step: '1' },
    ],
  },
  {
    title: 'Menu price hike caps',
    fields: [
      { key: 'default', label: 'Default max hike', unit: '%', step: '1' },
      { key: 'below100', label: 'Max hike · item ≤ ₹100', unit: '%', step: '1' },
      { key: 'below200', label: 'Max hike · item ≤ ₹200', unit: '%', step: '1' },
      { key: 'below300', label: 'Max hike · item ≤ ₹300', unit: '%', step: '1' },
      { key: 'below400', label: 'Max hike · item ≤ ₹400', unit: '%', step: '1' },
    ],
  },
];

const ALL_KEYS = GROUPS.flatMap(g => g.fields.map(f => f.key));

@Component({
  selector: 'app-config-fields',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="page fade-in">
    <div class="page-header">
      <div>
        <div class="page-title">Config Editor</div>
        <div class="page-subtitle">Fees, commission &amp; hike caps — global or per restaurant</div>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary btn-sm" (click)="load()" [disabled]="loading">↻ Reload</button>
      </div>
    </div>

    <div class="alert-error" *ngIf="error" style="margin-bottom:12px">✕ {{ error }}</div>
    <div class="alert-success" *ngIf="success" style="margin-bottom:12px">✓ {{ success }}</div>

    <div class="card target-bar">
      <div class="form-group">
        <label>Config target</label>
        <select class="form-input" [(ngModel)]="target" (ngModelChange)="onTargetChange()">
          <option value="">🌐 Global config (applies to all restaurants)</option>
          <option *ngFor="let r of restaurants" [value]="r.restaurantId">
            {{ r.name || r.restaurantName || r.restaurantId }}
          </option>
        </select>
      </div>
      <div class="target-note" *ngIf="target">
        <span class="pill" [class.pill-warn]="!hasOwnConfig" [class.pill-ok]="hasOwnConfig">
          {{ hasOwnConfig ? 'Has own config' : 'No config yet — showing global values' }}
        </span>
        <span class="text-tertiary">Saving writes these fields to this restaurant (other keys are preserved).</span>
      </div>
      <div class="target-note" *ngIf="!target">
        <span class="text-tertiary">Editing the global baseline. Each restaurant inherits any field it doesn't override.</span>
      </div>
    </div>

    <div class="card" *ngIf="loading" style="padding:24px">
      <div class="skeleton" style="height:42px;margin-bottom:8px;border-radius:8px" *ngFor="let i of [1,2,3,4]"></div>
    </div>

    <form *ngIf="!loading" (ngSubmit)="save()">
      <div class="card group-card" *ngFor="let g of groups">
        <div class="group-title">{{ g.title }}</div>
        <div class="field-grid">
          <div class="form-group" *ngFor="let f of g.fields">
            <label>{{ f.label }} <span class="unit">({{ f.unit }})</span></label>
            <input class="form-input" type="number" [step]="f.step" min="0"
                   [(ngModel)]="fields[f.key]" [name]="f.key"
                   [placeholder]="globalPlaceholder(f.key)" />
          </div>
        </div>
      </div>

      <div class="save-bar">
        <button type="button" class="btn btn-secondary btn-sm" (click)="load()" [disabled]="saving">Reset</button>
        <button type="submit" class="btn btn-primary" [disabled]="saving">
          {{ saving ? 'Saving…' : (target ? 'Save restaurant config' : 'Save global config') }}
        </button>
      </div>
    </form>
  </div>
  `,
  styles: [`
    .target-bar { padding:16px; margin-bottom:16px; display:flex; flex-direction:column; gap:10px; }
    .target-bar .form-group { display:flex; flex-direction:column; gap:6px; max-width:520px; }
    .target-bar label { font-size:12px; font-weight:600; color:var(--color-text-secondary); }
    .target-note { display:flex; align-items:center; gap:10px; flex-wrap:wrap; font-size:12px; }
    .pill { font-size:11px; font-weight:700; padding:2px 8px; border-radius:999px; }
    .pill-ok { background:rgba(34,197,94,0.12); color:#16a34a; }
    .pill-warn { background:rgba(234,179,8,0.14); color:#b45309; }
    .group-card { padding:16px; margin-bottom:14px; }
    .group-title { font-size:14px; font-weight:700; margin-bottom:12px; }
    .field-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; }
    .field-grid .form-group { display:flex; flex-direction:column; gap:6px; }
    .field-grid label { font-size:12px; font-weight:600; color:var(--color-text-secondary); }
    .field-grid .unit { color:var(--color-text-tertiary,#888); font-weight:500; }
    .save-bar { display:flex; gap:10px; justify-content:flex-end; margin-top:6px; }
    @media (max-width:900px) { .field-grid { grid-template-columns:repeat(2,1fr); } }
    @media (max-width:560px) { .field-grid { grid-template-columns:1fr; } }
  `]
})
export class ConfigFieldsComponent implements OnInit {
  groups = GROUPS;
  restaurants: any[] = [];
  target = '';                              // '' = global, else restaurantId
  fields: Record<string, number | null> = {};
  globalConfig: Record<string, any> = {};   // for placeholders on a restaurant target
  hasOwnConfig = false;
  loading = false;
  saving = false;
  success = '';
  error = '';

  constructor(public api: ApiService) {}

  ngOnInit(): void {
    this.api.listRestaurants().subscribe({
      next: (res: any) => { this.restaurants = res?.restaurants ?? (Array.isArray(res) ? res : []); },
      error: () => { this.restaurants = []; },
    });
    // Preload the global baseline (used for restaurant-field placeholders) + show global form.
    this.api.getEffectiveConfig().subscribe({
      next: (res: any) => { this.globalConfig = res?.config || {}; },
      error: () => { this.globalConfig = {}; },
    });
    this.load();
  }

  onTargetChange(): void {
    this.success = '';
    this.error = '';
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    const rid = this.target || undefined;
    this.api.getEffectiveConfig(rid).subscribe({
      next: (res: any) => {
        const config = res?.config || {};
        if (!rid) this.globalConfig = config;
        this.hasOwnConfig = rid ? !!(res?.hasRestaurantConfig ?? this.detectOwnConfig(config)) : false;
        const next: Record<string, number | null> = {};
        for (const key of ALL_KEYS) {
          const v = config[key];
          next[key] = v === null || v === undefined || v === '' ? null : Number(v);
        }
        this.fields = next;
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.message || 'Failed to load config (is the new backend deployed?)';
        this.loading = false;
      },
    });
  }

  /** Heuristic: a restaurant "has its own config" if any managed field differs from global. */
  private detectOwnConfig(config: Record<string, any>): boolean {
    return ALL_KEYS.some(k => config[k] !== undefined && String(config[k]) !== String(this.globalConfig[k] ?? ''));
  }

  globalPlaceholder(key: string): string {
    if (!this.target) return '';
    const v = this.globalConfig[key];
    return v === undefined || v === null || v === '' ? '' : `global: ${v}`;
  }

  save(): void {
    this.saving = true;
    this.success = '';
    this.error = '';

    const payload: Record<string, number> = {};
    for (const key of ALL_KEYS) {
      const v = this.fields[key];
      if (v === null || v === undefined || (v as any) === '') continue;
      const num = Number(v);
      if (!Number.isFinite(num)) continue;
      payload[key] = num;
    }

    if (Object.keys(payload).length === 0) {
      this.saving = false;
      this.error = 'Nothing to save — enter at least one value.';
      return;
    }

    this.api.saveConfigFields(this.target || null, payload).subscribe({
      next: () => {
        this.saving = false;
        this.success = this.target ? 'Restaurant config saved' : 'Global config saved';
        this.hasOwnConfig = !!this.target;
        setTimeout(() => this.success = '', 3000);
      },
      error: (e) => {
        this.saving = false;
        this.error = e?.error?.message || 'Failed to save config';
        setTimeout(() => this.error = '', 5000);
      },
    });
  }
}
