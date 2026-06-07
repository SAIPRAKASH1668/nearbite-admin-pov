import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page fade-in">

  <!-- Header -->
  <div class="page-header">
    <div>
      <div class="page-title">Hero Banners</div>
      <div class="page-subtitle">{{ banners.length }} banner{{ banners.length !== 1 ? 's' : '' }} &nbsp;·&nbsp; {{ activeCount }} active</div>
    </div>
    <div class="header-actions">
      <button class="btn btn-secondary btn-sm" (click)="load()">&#8635; Refresh</button>
      <button class="btn btn-primary btn-sm" (click)="addBanner()">+ Add Banner</button>
    </div>
  </div>

  <!-- Loading -->
  <div *ngIf="loading" class="banners-list">
    <div class="banner-card skeleton-card" *ngFor="let i of [1,2]">
      <div class="skeleton" style="height:160px;border-radius:10px 10px 0 0"></div>
      <div style="padding:16px;display:flex;flex-direction:column;gap:8px">
        <div class="skeleton" style="height:13px;width:60%"></div>
        <div class="skeleton" style="height:13px;width:40%"></div>
      </div>
    </div>
  </div>

  <!-- Empty state -->
  <div *ngIf="!loading && banners.length === 0" class="empty-state">
    <div style="font-size:36px;margin-bottom:8px">🖼️</div>
    <div style="font-size:15px;font-weight:600;color:#ccc;margin-bottom:4px">No banners yet</div>
    <div style="font-size:13px;color:#555;margin-bottom:16px">Add a banner to show on the customer home screen</div>
    <button class="btn btn-primary" (click)="addBanner()">+ Add First Banner</button>
  </div>

  <!-- Banners list -->
  <div *ngIf="!loading && banners.length > 0" class="banners-list">
    <div class="banner-card" *ngFor="let b of banners; let i=index" [class.inactive-card]="!b.isActive">

      <!-- Preview -->
      <div class="banner-preview"
        [style.backgroundImage]="bgStyle(b.imageUrl)">
        <div *ngIf="!b.imageUrl" class="preview-placeholder">
          <span style="font-size:28px">🖼️</span>
          <span>No Image</span>
        </div>
        <div class="preview-overlay">
          <div class="preview-title" *ngIf="b.title">{{ b.title }}</div>
          <div class="preview-sub" *ngIf="b.subtitle">{{ b.subtitle }}</div>
        </div>
        <div class="banner-badges">
          <span class="order-badge">#{{ i + 1 }}</span>
          <span *ngIf="b.id" class="id-badge">{{ b.id }}</span>
          <span [class]="b.isActive ? 'status-badge active' : 'status-badge inactive'">
            {{ b.isActive ? 'Active' : 'Inactive' }}
          </span>
        </div>
      </div>

      <!-- Form fields -->
      <div class="banner-form">
        <div class="form-row-2">
          <div class="form-group">
            <label>Title</label>
            <input class="form-input" [(ngModel)]="b.title" placeholder="e.g. Order & Save 30%" />
          </div>
          <div class="form-group">
            <label>Subtitle</label>
            <input class="form-input" [(ngModel)]="b.subtitle" placeholder="e.g. Use code SAVE30" />
          </div>
        </div>
        <div class="form-group">
          <label>Image URL</label>
          <input class="form-input" [(ngModel)]="b.imageUrl" placeholder="https://cdn.yourdomain.com/banner.jpg" />
        </div>
        <div class="form-group">
          <label>Deep Link <span class="field-hint">(optional)</span></label>
          <input class="form-input" [(ngModel)]="b.deepLink" placeholder="yumdude://restaurant/RES-xxx" />
        </div>
        <div class="form-row-3">
          <div class="form-group">
            <label>Priority <span class="field-hint">(lower = first)</span></label>
            <input class="form-input" type="number" [(ngModel)]="b.priority" min="1" max="99" placeholder="1" />
          </div>
          <div class="form-group">
            <label>Start Date</label>
            <input class="form-input" type="date" [(ngModel)]="b.startDate" />
          </div>
          <div class="form-group">
            <label>End Date</label>
            <input class="form-input" type="date" [(ngModel)]="b.endDate" />
          </div>
        </div>
        <div class="banner-footer">
          <label class="toggle-label">
            <div class="toggle">
              <input type="checkbox" [(ngModel)]="b.isActive" />
              <span class="toggle-track"></span>
            </div>
            <span class="toggle-text">{{ b.isActive ? 'Active' : 'Inactive' }}</span>
          </label>
          <button class="btn btn-danger btn-xs" (click)="removeBanner(i)">&#x1F5D1; Remove</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Save bar -->
  <div *ngIf="!loading" class="save-bar">
    <div *ngIf="saveError" class="alert-error">&#x2715; {{ saveError }}</div>
    <div *ngIf="saveSuccess" class="alert-success">&#10003; Banners saved successfully!</div>
    <button class="btn btn-primary save-btn" (click)="save()" [disabled]="saving">
      {{ saving ? 'Saving...' : 'Save All Banners' }}
    </button>
  </div>

</div>
  `,
  styles: [`
    .page { padding: 12px; }

    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }

    /* Banners list */
    .banners-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 80px; }

    /* Banner card */
    .banner-card { background: #161616; border: 1px solid #252525; border-radius: 14px; overflow: hidden; transition: border-color .2s; }
    .banner-card:hover { border-color: #333; }
    .inactive-card { opacity: .65; }

    /* Preview area */
    .banner-preview { height: 160px; background: #1e1e1e; background-size: cover; background-position: center; background-repeat: no-repeat; position: relative; display: flex; align-items: flex-end; }
    .preview-placeholder { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: #555; font-size: 13px; }
    .preview-overlay { position: relative; z-index: 1; padding: 10px 12px; background: linear-gradient(transparent, rgba(0,0,0,.8)); width: 100%; }
    .preview-title { font-size: 15px; font-weight: 700; color: #fff; line-height: 1.2; }
    .preview-sub { font-size: 12px; color: rgba(255,255,255,.7); margin-top: 2px; }
    .banner-badges { position: absolute; top: 10px; left: 10px; display: flex; gap: 6px; flex-wrap: wrap; z-index: 2; }
    .order-badge { background: rgba(0,0,0,.7); color: #fff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 8px; }
    .id-badge { background: rgba(0,0,0,.6); color: #aaa; font-size: 10px; font-family: monospace; padding: 3px 7px; border-radius: 8px; }
    .status-badge { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 8px; }
    .status-badge.active { background: rgba(34,197,94,.85); color: #fff; }
    .status-badge.inactive { background: rgba(100,100,100,.85); color: #ccc; }

    /* Form */
    .banner-form { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .form-row-2 { display: grid; grid-template-columns: 1fr; gap: 10px; }
    .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .field-hint { font-size: 10px; color: #555; font-weight: 400; }

    /* Toggle */
    .banner-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 4px; }
    .toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .toggle { position: relative; display: inline-block; width: 38px; height: 22px; flex-shrink: 0; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .toggle-track { position: absolute; inset: 0; background: #2a2a2a; border: 1px solid #333; border-radius: 22px; cursor: pointer; transition: .2s; }
    .toggle input:checked + .toggle-track { background: #22c55e; border-color: #22c55e; }
    .toggle-track:before { content: ''; position: absolute; width: 16px; height: 16px; left: 2px; top: 2px; background: #fff; border-radius: 50%; transition: .2s; }
    .toggle input:checked + .toggle-track:before { transform: translateX(16px); }
    .toggle-text { font-size: 13px; color: #aaa; }

    /* Save bar */
    .save-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #111; border-top: 1px solid #222; padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; z-index: 100; }
    .save-btn { width: 100%; height: 44px; font-size: 15px; font-weight: 600; }

    /* Alerts */
    .alert-success { padding: 10px 14px; background: rgba(34,197,94,.12); border: 1px solid rgba(34,197,94,.3); border-radius: 8px; font-size: 12px; color: #4ade80; }
    .alert-error { padding: 10px 14px; background: rgba(239,68,68,.12); border: 1px solid rgba(239,68,68,.3); border-radius: 8px; font-size: 12px; color: #f87171; }

    /* Empty state */
    .empty-state { text-align: center; padding: 60px 16px; }

    /* Desktop */
    @media (min-width: 768px) {
      .page { padding: 24px; }
      .banners-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; margin-bottom: 20px; }
      .banner-preview { height: 180px; }
      .form-row-2 { grid-template-columns: 1fr 1fr; }
      .save-bar { position: static; background: none; border: none; padding: 0; flex-direction: row; justify-content: flex-end; margin-top: 8px; }
      .save-btn { width: auto; min-width: 180px; }
    }
  `]
})
export class HeroBannerComponent implements OnInit {
  banners: any[] = [];
  loading = true;
  saving = false;
  saveSuccess = false;
  saveError = '';

  get activeCount(): number { return this.banners.filter(b => b.isActive).length; }

  constructor(private api: ApiService, private sanitizer: DomSanitizer) {}

  bgStyle(url: string): SafeStyle {
    if (!url) return '';
    return this.sanitizer.bypassSecurityTrustStyle(`url('${url}')`);
  }
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.saveSuccess = false;
    this.saveError = '';
    this.api.getHeroBanners().subscribe({
      next: (res: any) => {
        // admin=true returns { banners } after backend deploy;
        // live backend (pre-deploy) returns { heroBanners } (active-only filtered)
        const raw: any[] = res.banners ?? res.heroBanners ?? [];
        // Normalize: old records use backgroundImageUrl; new ones use imageUrl
        this.banners = raw.map((b: any) => ({
          ...b,
          imageUrl: b.imageUrl || b.backgroundImageUrl || ''
        }));
        this.loading = false;
      },
      error: () => { this.loading = false; this.banners = []; }
    });
  }

  addBanner(): void {
    const id = Math.random().toString(36).slice(2, 10);
    this.banners.push({
      id,
      title: '',
      subtitle: '',
      imageUrl: '',
      deepLink: '',
      isActive: true,
      priority: this.banners.length + 1,
      startDate: '',
      endDate: '',
    });
  }

  removeBanner(i: number): void {
    if (!confirm('Remove this banner?')) return;
    this.banners.splice(i, 1);
  }

  save(): void {
    this.saving = true;
    this.saveSuccess = false;
    this.saveError = '';
    // Write both fields so the customer app (reads backgroundImageUrl || imageUrl) keeps working
    const payload = this.banners.map((b: any) => ({ ...b, backgroundImageUrl: b.imageUrl || b.backgroundImageUrl || '' }));
    this.api.saveHeroBanner({ banners: payload }).subscribe({
      next: (res: any) => {
        // Backend returns updated banners with auto-assigned IDs; re-normalize
        if (res.banners) this.banners = res.banners.map((b: any) => ({
          ...b,
          imageUrl: b.imageUrl || b.backgroundImageUrl || ''
        }));
        this.saving = false;
        this.saveSuccess = true;
        setTimeout(() => this.saveSuccess = false, 4000);
      },
      error: (err: any) => {
        this.saving = false;
        this.saveError = err?.error?.error || 'Failed to save banners. Please try again.';
      }
    });
  }
}
