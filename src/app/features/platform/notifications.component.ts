import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface NotificationTemplate {
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface NotificationHealthRow {
  restaurantId: string;
  name: string;
  tokenCount: number;
  hasLegacyToken: boolean;
  lastUpdated: string | null;
  ageHours: number | null;
  status: 'HEALTHY' | 'STALE' | 'MISSING' | string;
}

interface NotificationHealthSummary {
  total: number;
  healthy: number;
  stale: number;
  missing: number;
  staleThresholdHours: number;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
<div class="page fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Notifications</div>
      <div class="page-subtitle">Backend-supported customer broadcast payloads and restaurant token health</div>
    </div>
    <button class="btn btn-secondary" (click)="loadHealth()" [disabled]="loadingHealth">
      {{ loadingHealth ? 'Refreshing...' : 'Refresh health' }}
    </button>
  </div>

  <div class="support-note">
    <strong>Supported by backend today:</strong>
    customer broadcast Lambda payloads for active CUSTOMER users in geohash <code>td</code>, plus restaurant FCM token health.
    The API does not expose rider, restaurant, specific-user, image URL, or deep-link notification sending from the admin app.
  </div>

  <div class="content-grid notif-grid">
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Customer Broadcast Payload</div>
          <div class="card-subtitle">Matches <code>custom_notification_handler.py</code></div>
        </div>
        <span class="status-chip">Geohash td</span>
      </div>

      <div class="card-body">
        <div class="form-group">
          <label>Audience</label>
          <input class="form-input" value="Active CUSTOMER users in current operating area" disabled />
        </div>

        <div class="form-group">
          <label>Title</label>
          <input class="form-input" [(ngModel)]="form.title" placeholder="Notification" />
          <div class="help-text">Optional. Backend defaults to <code>Notification</code>. Supports <code>{{ '{{name}}' }}</code>.</div>
        </div>

        <div class="form-group">
          <label>Message body *</label>
          <textarea class="form-input" rows="4" [(ngModel)]="form.customMessage" placeholder="Write the customer message..."></textarea>
          <div class="char-count">{{ form.customMessage.length }}/200</div>
        </div>

        <div class="form-group">
          <label>FCM data payload (optional JSON object)</label>
          <textarea class="form-input mono" rows="4" [(ngModel)]="form.dataJson" placeholder='{"type":"custom"}'></textarea>
          <div class="error-text" *ngIf="dataError">{{ dataError }}</div>
          <div class="help-text" *ngIf="!dataError">Backend merges this object and defaults <code>type</code> to <code>custom</code>.</div>
        </div>

        <div class="notif-preview" *ngIf="form.title || form.customMessage">
          <div class="notif-icon">YD</div>
          <div class="notif-content">
            <div class="notif-title">{{ form.title || 'Notification' }}</div>
            <div class="notif-body">{{ form.customMessage || 'Message body...' }}</div>
          </div>
        </div>

        <div class="payload-box">
          <div class="payload-head">
            <span>Lambda event payload</span>
            <button class="btn btn-secondary btn-sm" (click)="copyPayload()" [disabled]="!canCopy">
              {{ copyState || 'Copy payload' }}
            </button>
          </div>
          <pre>{{ payloadPreview }}</pre>
        </div>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Quick Payloads</div>
            <div class="card-subtitle">Only fields the Lambda accepts</div>
          </div>
        </div>
        <div class="templates-list">
          <button class="template-item" *ngFor="let t of templates" (click)="applyTemplate(t)">
            <div>
              <div class="template-title">{{ t.title }}</div>
              <div class="template-body text-secondary">{{ t.body }}</div>
            </div>
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Restaurant Notification Health</div>
            <div class="card-subtitle">Real backend endpoint: token readiness for order pushes</div>
          </div>
        </div>

        <div class="health-loading text-secondary" *ngIf="loadingHealth">Loading notification health...</div>
        <div class="error-panel" *ngIf="healthError">{{ healthError }}</div>

        <ng-container *ngIf="!loadingHealth && !healthError">
          <div class="health-summary" *ngIf="healthSummary">
            <div class="health-stat">
              <strong>{{ healthSummary.total }}</strong>
              <span>Total</span>
            </div>
            <div class="health-stat ok">
              <strong>{{ healthSummary.healthy }}</strong>
              <span>Healthy</span>
            </div>
            <div class="health-stat warn">
              <strong>{{ healthSummary.stale }}</strong>
              <span>Stale</span>
            </div>
            <div class="health-stat bad">
              <strong>{{ healthSummary.missing }}</strong>
              <span>Missing</span>
            </div>
          </div>

          <div class="health-table" *ngIf="restaurants.length > 0">
            <div class="health-row head">
              <span>Restaurant</span>
              <span>Status</span>
              <span>Tokens</span>
            </div>
            <div class="health-row" *ngFor="let r of restaurants | slice:0:10">
              <div>
                <div class="restaurant-name">{{ r.name }}</div>
                <div class="text-secondary last-updated">
                  {{ r.lastUpdated ? (r.lastUpdated | date:'dd MMM, HH:mm') : 'Never updated' }}
                </div>
              </div>
              <span class="status-badge" [class.ok]="r.status === 'HEALTHY'" [class.warn]="r.status === 'STALE'" [class.bad]="r.status === 'MISSING'">{{ r.status }}</span>
              <span>{{ r.tokenCount }}</span>
            </div>
          </div>

          <div *ngIf="restaurants.length === 0" class="no-data text-secondary">No restaurant token health rows returned.</div>
        </ng-container>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .page { padding: 24px; }
    .page-header { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
    .support-note { margin: 0 0 16px; padding: 12px 14px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-50); color: var(--color-600); font-size: 13px; line-height: 1.45; }
    .card-header { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; padding:12px 14px; border-bottom:1px solid var(--color-border); }
    .card-title { font-weight:600; font-size:13px; }
    .card-subtitle { margin-top:2px; color:var(--color-400); font-size:11px; }
    .card-body { padding:16px; display:flex; flex-direction:column; gap:12px; }
    .status-chip { padding:4px 8px; border-radius:999px; background:var(--color-50); border:1px solid var(--color-border); color:var(--color-500); font-size:11px; font-weight:700; white-space:nowrap; }
    .help-text { margin-top:4px; color:var(--color-400); font-size:11px; line-height:1.35; }
    .error-text { margin-top:4px; color:#b42318; font-size:11px; }
    .char-count { font-size:11px; color:var(--color-400); text-align:right; margin-top:2px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:12px; }
    .notif-preview { display:flex; gap:10px; padding:12px; background:var(--color-50); border-radius:8px; border:1px solid var(--color-border); }
    .notif-icon { width:32px; height:32px; display:grid; place-items:center; border-radius:8px; background:var(--color-primary); color:#fff; font-size:11px; font-weight:800; flex-shrink:0; }
    .notif-title { font-weight:600; font-size:13px; }
    .notif-body { font-size:12px; color:var(--color-500); margin-top:2px; }
    .payload-box { border:1px solid var(--color-border); border-radius:8px; overflow:hidden; background:#fff; }
    .payload-head { display:flex; justify-content:space-between; align-items:center; gap:10px; padding:8px 10px; border-bottom:1px solid var(--color-border); color:var(--color-500); font-size:12px; font-weight:600; }
    .payload-box pre { margin:0; padding:10px; max-height:220px; overflow:auto; background:var(--color-50); font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; white-space:pre-wrap; }
    .btn-sm { padding:5px 8px; font-size:11px; }
    .templates-list { padding:8px; display:flex; flex-direction:column; gap:4px; }
    .template-item { width:100%; display:block; text-align:left; padding:9px 10px; border:0; border-radius:6px; background:transparent; cursor:pointer; }
    .template-item:hover { background:var(--color-50); }
    .template-title { font-weight:600; font-size:12px; color:var(--color-700); }
    .template-body { margin-top:2px; font-size:11px; line-height:1.35; }
    .health-loading, .no-data { padding:16px; text-align:center; font-size:13px; }
    .error-panel { margin:12px; padding:10px 12px; border-radius:8px; background:#fff1f0; border:1px solid #ffd6d1; color:#b42318; font-size:12px; }
    .health-summary { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; padding:12px; }
    .health-stat { padding:10px; border-radius:8px; background:var(--color-50); border:1px solid var(--color-border); }
    .health-stat strong { display:block; font-size:18px; line-height:1; }
    .health-stat span { display:block; margin-top:4px; color:var(--color-400); font-size:11px; font-weight:700; }
    .health-stat.ok strong, .status-badge.ok { color:#12805c; }
    .health-stat.warn strong, .status-badge.warn { color:#b7791f; }
    .health-stat.bad strong, .status-badge.bad { color:#b42318; }
    .health-table { padding:0 12px 12px; }
    .health-row { display:grid; grid-template-columns:minmax(0,1fr) 78px 48px; gap:10px; align-items:center; padding:9px 0; border-top:1px solid var(--color-border); font-size:12px; }
    .health-row.head { color:var(--color-400); font-weight:700; font-size:11px; text-transform:uppercase; letter-spacing:.4px; }
    .restaurant-name { font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .last-updated { margin-top:2px; font-size:11px; }
    .status-badge { font-size:10px; font-weight:800; }
    .notif-grid { grid-template-columns: minmax(0, 1.05fr) minmax(320px, .95fr); }
    @media (max-width:768px) {
      .page { padding: 12px; }
      .page-header { flex-direction:column; }
      .notif-grid { grid-template-columns: 1fr; }
      .health-summary { grid-template-columns:repeat(2,1fr); }
    }
  `]
})
export class NotificationsComponent implements OnInit {
  loadingHealth = false;
  healthError = '';
  copyState = '';

  healthSummary: NotificationHealthSummary | null = null;
  restaurants: NotificationHealthRow[] = [];

  form = {
    title: '',
    customMessage: '',
    dataJson: '{\n  "type": "custom"\n}',
  };

  templates: NotificationTemplate[] = [
    {
      title: 'Today only',
      body: 'Hi {{name}}, a fresh deal is live near you today. Open YumDude before it disappears.',
      data: { type: 'custom', campaign: 'daily_deal' },
    },
    {
      title: 'Order reminder',
      body: 'Hi {{name}}, your favorite restaurants are accepting orders now.',
      data: { type: 'custom', campaign: 'order_reminder' },
    },
    {
      title: 'Service update',
      body: 'Hi {{name}}, YumDude is available in your area. Thanks for ordering with us.',
      data: { type: 'custom', campaign: 'service_update' },
    },
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadHealth();
  }

  get dataError(): string {
    if (!this.form.dataJson.trim()) return '';
    try {
      const parsed = JSON.parse(this.form.dataJson);
      return parsed && !Array.isArray(parsed) && typeof parsed === 'object'
        ? ''
        : 'Data payload must be a JSON object.';
    } catch {
      return 'Data payload must be valid JSON.';
    }
  }

  get payload(): { title?: string; customMessage: string; data?: Record<string, unknown> } {
    const event: { title?: string; customMessage: string; data?: Record<string, unknown> } = {
      customMessage: this.form.customMessage.trim(),
    };
    const title = this.form.title.trim();
    if (title) event.title = title;
    const data = this.parseDataJson();
    if (data) event.data = data;
    return event;
  }

  get payloadPreview(): string {
    return JSON.stringify(this.payload, null, 2);
  }

  get canCopy(): boolean {
    return !!this.form.customMessage.trim() && !this.dataError;
  }

  applyTemplate(template: NotificationTemplate): void {
    this.form.title = template.title;
    this.form.customMessage = template.body;
    this.form.dataJson = JSON.stringify(template.data || { type: 'custom' }, null, 2);
    this.copyState = '';
  }

  async copyPayload(): Promise<void> {
    if (!this.canCopy) return;
    try {
      await navigator.clipboard.writeText(this.payloadPreview);
      this.copyState = 'Copied';
      window.setTimeout(() => (this.copyState = ''), 1600);
    } catch {
      this.copyState = 'Copy failed';
      window.setTimeout(() => (this.copyState = ''), 2000);
    }
  }

  loadHealth(): void {
    this.loadingHealth = true;
    this.healthError = '';

    this.api.getRestaurantNotificationHealth().subscribe({
      next: (response) => {
        this.healthSummary = response?.summary || null;
        this.restaurants = Array.isArray(response?.restaurants) ? response.restaurants : [];
        this.loadingHealth = false;
      },
      error: (error) => {
        this.healthSummary = null;
        this.restaurants = [];
        this.healthError = error?.error?.message || error?.error?.error || 'Failed to load notification health.';
        this.loadingHealth = false;
      },
    });
  }

  private parseDataJson(): Record<string, unknown> | undefined {
    if (!this.form.dataJson.trim() || this.dataError) return undefined;
    return JSON.parse(this.form.dataJson);
  }
}
