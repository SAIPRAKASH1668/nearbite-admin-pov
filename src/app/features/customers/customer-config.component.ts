/**
 * Customer Config — admin dashboard for per-customer settings.
 *
 * Currently manages the Cash-on-Delivery (COD) risk flags (disableCod /
 * forceCod). Reads the customer via GET /api/v1/users/<phone> and writes the
 * flags via POST /api/v1/ops/users/<phone>/cod-toggles, which is gated by the
 * ADMIN_API_KEY (sent as X-Api-Key by ApiService) — same pattern as Rider Slots.
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-customer-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="page fade-in">

    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="page-title">Customer Config</div>
        <div class="page-subtitle">Manage per-customer Cash-on-Delivery controls</div>
      </div>
    </div>

    <!-- Admin key bar (cod-toggles is an ops endpoint, gated by ADMIN_API_KEY) -->
    <div class="card keybar" *ngIf="!api.hasAdminKey || showKeyEdit">
      <div>
        <strong>Admin API key</strong>
        <p class="text-tertiary">Saving COD toggles uses the ops endpoint, gated by the <b>ADMIN_API_KEY</b> (sent as X-Api-Key) — not the mobile/web key. Dev default: <code>dev-admin-key-12345</code>.</p>
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

    <!-- Search customer (read) -->
    <div class="card search-card">
      <div class="form-group" style="margin:0">
        <label>Customer phone</label>
        <div class="search-row">
          <input class="form-input" type="tel" placeholder="e.g. +919876543210" [(ngModel)]="phone" (keyup.enter)="load()" />
          <button class="btn btn-primary" (click)="load()" [disabled]="loading || !phone.trim()">{{ loading ? 'Loading…' : 'Load' }}</button>
        </div>
      </div>
    </div>

    <!-- Alerts -->
    <div class="alert-success" *ngIf="success">✓ {{ success }}</div>
    <div class="alert-error" *ngIf="error">✕ {{ error }}</div>

    <!-- Not found -->
    <div class="empty-state" *ngIf="notFound">
      <div class="empty-icon">🔍</div>
      <h4>No customer found</h4>
      <p>No CUSTOMER record exists for that phone number. Double-check the number.</p>
    </div>

    <!-- Customer COD controls (read + update) -->
    <div class="card customer-card" *ngIf="loaded && customer">
      <div class="customer-head">
        <div class="customer-name">{{ customer.name || 'Customer' }}</div>
        <div class="text-tertiary font-mono">{{ customer.phone }}</div>
      </div>

      <div class="toggle-row">
        <div class="toggle-meta">
          <div class="toggle-title">Disable COD</div>
          <div class="toggle-desc text-tertiary">Never offer Cash on Delivery to this customer.</div>
        </div>
        <label class="switch">
          <input type="checkbox" [(ngModel)]="disableCod" />
          <span class="track"></span>
        </label>
      </div>

      <div class="toggle-row">
        <div class="toggle-meta">
          <div class="toggle-title">Force COD</div>
          <div class="toggle-desc text-tertiary">Always allow COD for this customer — overrides Disable COD and all global rules.</div>
        </div>
        <label class="switch">
          <input type="checkbox" [(ngModel)]="forceCod" />
          <span class="track"></span>
        </label>
      </div>

      <div class="hint" *ngIf="disableCod && forceCod">⚠ Both flags are on — <b>Force COD wins</b>, so COD will be allowed for this customer.</div>

      <div class="customer-foot">
        <button class="btn btn-primary" (click)="save()" [disabled]="saving || !api.hasAdminKey">{{ saving ? 'Saving…' : 'Save COD settings' }}</button>
        <span class="text-tertiary" *ngIf="!api.hasAdminKey" style="font-size:12px">Set the admin key above to save.</span>
      </div>
    </div>

  </div>
  `,
  styles: [`
    .keybar { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
    .keybar p { margin:4px 0 0; font-size:12px; }
    .keybar-input { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .keybar-input .form-input { min-width:280px; }
    .keybar-compact { display:flex; align-items:center; gap:10px; font-size:12px; }

    .search-card { padding:16px 20px; }
    .search-row { display:flex; gap:12px; align-items:center; margin-top:6px; }
    .search-row .form-input { flex:1; max-width:360px; }

    .customer-card { padding:0; overflow:hidden; }
    .customer-head { padding:16px 20px; border-bottom:1px solid var(--color-border,#222); }
    .customer-name { font-size:15px; font-weight:700; color:var(--color-text-primary,#fff); }

    .toggle-row { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:16px 20px; border-bottom:1px solid var(--color-border,#222); }
    .toggle-meta { flex:1; }
    .toggle-title { font-weight:600; color:var(--color-text-primary,#fff); }
    .toggle-desc { font-size:12px; margin-top:2px; }
    .hint { padding:12px 20px; font-size:12px; color:var(--color-warning,#fbbf24); border-bottom:1px solid var(--color-border,#222); }
    .customer-foot { display:flex; align-items:center; gap:12px; padding:14px 20px; flex-wrap:wrap; }

    .switch { position:relative; display:inline-block; width:46px; height:26px; flex:none; }
    .switch input { opacity:0; width:0; height:0; }
    .switch .track { position:absolute; cursor:pointer; inset:0; background:var(--color-bg-tertiary,#333); border-radius:26px; transition:.2s; }
    .switch .track::before { content:''; position:absolute; height:20px; width:20px; left:3px; top:3px; background:#fff; border-radius:50%; transition:.2s; }
    .switch input:checked + .track { background:var(--color-primary,#6366f1); }
    .switch input:checked + .track::before { transform:translateX(20px); }

    @media (max-width:600px) {
      .search-row { flex-direction:column; align-items:stretch; }
      .search-row .form-input { max-width:100%; }
    }
  `]
})
export class CustomerConfigComponent {
  phone = '';
  loading = false;
  saving = false;
  loaded = false;
  notFound = false;
  error = '';
  success = '';

  customer: { phone: string; name: string } | null = null;
  disableCod = false;
  forceCod = false;

  adminKeyInput = '';
  showKeyEdit = false;

  constructor(public api: ApiService) {}

  saveAdminKey(): void {
    this.api.setAdminKey(this.adminKeyInput);
    this.adminKeyInput = '';
    this.showKeyEdit = false;
  }

  load(): void {
    const phone = this.phone.trim();
    if (!phone) return;
    this.loading = true;
    this.error = '';
    this.success = '';
    this.loaded = false;
    this.notFound = false;
    this.customer = null;

    this.api.getUserByPhone(phone, 'CUSTOMER').subscribe({
      next: (res: any) => {
        this.customer = { phone: res?.phone || phone, name: res?.name || '' };
        this.disableCod = !!res?.disableCod;
        this.forceCod = !!res?.forceCod;
        this.loaded = true;
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        if (e?.status === 404) {
          this.notFound = true;
        } else {
          this.error = e?.error?.message || 'Failed to load customer.';
        }
      },
    });
  }

  save(): void {
    if (!this.customer || this.saving) return;
    this.saving = true;
    this.error = '';
    this.success = '';

    this.api.setCustomerCodToggles(this.customer.phone, {
      disableCod: this.disableCod,
      forceCod: this.forceCod,
      opsUser: 'admin-console',
    }).subscribe({
      next: (res: any) => {
        this.saving = false;
        // Re-sync from the server's authoritative response.
        this.disableCod = !!res?.disableCod;
        this.forceCod = !!res?.forceCod;
        this.flash('COD settings saved');
      },
      error: (e) => {
        this.saving = false;
        this.error = e?.error?.message || 'Save failed (check the admin key / environment).';
      },
    });
  }

  private flash(msg: string): void {
    this.success = msg;
    setTimeout(() => (this.success = ''), 3000);
  }
}
