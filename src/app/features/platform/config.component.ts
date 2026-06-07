import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Platform Config</div>
      <div class="page-subtitle">Edit global and per-restaurant configuration JSON</div>
    </div>
    <button class="btn btn-secondary btn-sm" (click)="loadAll()">&#8635; Refresh</button>
  </div>

  <!-- Global Config -->
  <div class="config-section">
    <div class="section-header">
      <div class="section-title">Global Config</div>
      <span *ngIf="globalSource" class="source-badge">source: {{ globalSource }}</span>
    </div>
    <div class="editor-wrap">
      <div *ngIf="globalLoading" class="editor-overlay">Loading&hellip;</div>
      <textarea
        class="json-editor"
        [(ngModel)]="globalJson"
        spellcheck="false"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        rows="20"
        [class.json-error]="globalParseError"
        (ngModelChange)="validateGlobal()"
      ></textarea>
      <div *ngIf="globalParseError" class="parse-error">{{ globalParseError }}</div>
    </div>
    <div class="section-footer">
      <span *ngIf="globalSaveMsg" [class]="'save-msg save-' + globalSaveMsgType">{{ globalSaveMsg }}</span>
      <div class="footer-actions">
        <button class="btn btn-secondary btn-sm" (click)="formatGlobal()">Format JSON</button>
        <button class="btn btn-primary" (click)="saveGlobal()" [disabled]="globalSaving || !!globalParseError">
          {{ globalSaving ? 'Saving&hellip;' : 'Upsert Global Config' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Restaurant Config -->
  <div class="config-section">
    <div class="section-header">
      <div class="section-title">Restaurant Config</div>
      <span *ngIf="restoSource" [class]="'source-badge source-' + restoSource.toLowerCase()">source: {{ restoSource }}</span>
    </div>

    <div class="resto-select-row">
      <select class="form-select resto-select" [(ngModel)]="selectedRestoId" (ngModelChange)="onRestoChange()">
        <option value="">Select an option</option>
        <option *ngFor="let r of restaurants" [value]="r.restaurantId">
          {{ r.name || r.restaurantId }}
        </option>
      </select>
      <span *ngIf="restosLoading" class="loading-text">Loading restaurants&hellip;</span>
    </div>

    <ng-container *ngIf="selectedRestoId">
      <div class="editor-wrap">
        <div *ngIf="restoLoading" class="editor-overlay">Loading&hellip;</div>
        <textarea
          class="json-editor"
          [(ngModel)]="restoJson"
          spellcheck="false"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          rows="20"
          [class.json-error]="restoParseError"
          (ngModelChange)="validateResto()"
        ></textarea>
        <div *ngIf="restoParseError" class="parse-error">{{ restoParseError }}</div>
      </div>
      <div class="section-footer">
        <span *ngIf="restoSaveMsg" [class]="'save-msg save-' + restoSaveMsgType">{{ restoSaveMsg }}</span>
        <div class="footer-actions">
          <button class="btn btn-secondary btn-sm" (click)="formatResto()">Format JSON</button>
          <button class="btn btn-primary" (click)="saveResto()" [disabled]="restoSaving || !!restoParseError">
            {{ restoSaving ? 'Saving&hellip;' : 'Upsert Restaurant Config' }}
          </button>
        </div>
      </div>
    </ng-container>
  </div>
</div>
  `,
  styles: [`
    .page { padding: 24px; display:flex; flex-direction:column; gap:24px; }
    .config-section { background:var(--color-bg-card,#111); border:1px solid var(--color-border,#222); border-radius:14px; overflow:hidden; }
    .section-header { display:flex; align-items:center; gap:10px; padding:16px 20px; border-bottom:1px solid var(--color-border,#222); }
    .section-title { font-size:15px; font-weight:700; color:#fff; }
    .source-badge { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:.08em; padding:2px 8px; border-radius:100px; background:rgba(99,102,241,.15); color:#818cf8; }
    .source-restaurant { background:rgba(34,197,94,.12); color:#4ade80; }
    .source-global { background:rgba(99,102,241,.15); color:#818cf8; }
    .resto-select-row { display:flex; align-items:center; gap:12px; padding:16px 20px; border-bottom:1px solid var(--color-border,#222); }
    .resto-select { max-width:340px; }
    .loading-text { font-size:12px; color:var(--color-400,#888); }
    .editor-wrap { position:relative; }
    .editor-overlay { position:absolute; inset:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; font-size:14px; color:#888; z-index:2; }
    .json-editor { display:block; width:100%; box-sizing:border-box; background:#0d0d0d; color:#e2e8f0; font-family:'Fira Code','Cascadia Code','JetBrains Mono',Consolas,monospace; font-size:13px; line-height:1.6; border:none; outline:none; resize:vertical; padding:20px; margin:0; tab-size:2; }
    .json-editor.json-error { box-shadow:inset 0 0 0 2px rgba(239,68,68,.5); }
    .parse-error { padding:8px 20px; font-size:11px; color:#f87171; background:rgba(239,68,68,.08); font-family:monospace; }
    .section-footer { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-top:1px solid var(--color-border,#222); gap:12px; flex-wrap:wrap; }
    .footer-actions { display:flex; gap:8px; }
    .save-msg { font-size:12px; font-weight:600; }
    .save-ok { color:#4ade80; }
    .save-err { color:#f87171; }
    @media (max-width:768px) { .page { padding:12px; gap:16px; } .json-editor { font-size:12px; padding:14px; } }
  `]
})
export class ConfigComponent implements OnInit {
  globalJson = '';
  globalParseError = '';
  globalLoading = false;
  globalSaving = false;
  globalSaveMsg = '';
  globalSaveMsgType = 'ok';
  globalSource = '';

  restaurants: any[] = [];
  restosLoading = false;
  selectedRestoId = '';
  restoJson = '';
  restoParseError = '';
  restoLoading = false;
  restoSaving = false;
  restoSaveMsg = '';
  restoSaveMsgType = 'ok';
  restoSource = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loadGlobal();
    this.loadRestaurants();
  }

  loadGlobal(): void {
    this.globalLoading = true;
    this.api.getGlobalConfig().subscribe({
      next: (res: any) => {
        const cfg = res.config ?? res ?? {};
        this.globalSource = res.source ?? 'GLOBAL';
        this.globalJson = JSON.stringify(cfg, null, 2);
        this.globalParseError = '';
        this.globalLoading = false;
      },
      error: () => { this.globalLoading = false; }
    });
  }

  validateGlobal(): void {
    try { JSON.parse(this.globalJson); this.globalParseError = ''; }
    catch (e: any) { this.globalParseError = e.message; }
  }

  formatGlobal(): void {
    try { this.globalJson = JSON.stringify(JSON.parse(this.globalJson), null, 2); this.globalParseError = ''; }
    catch { }
  }

  saveGlobal(): void {
    let payload: any;
    try { payload = JSON.parse(this.globalJson); }
    catch { return; }
    this.globalSaving = true;
    this.globalSaveMsg = '';
    this.api.saveGlobalConfig(payload).subscribe({
      next: () => {
        this.globalSaving = false;
        this.globalSaveMsg = '&#10003; Global config saved';
        this.globalSaveMsgType = 'ok';
        setTimeout(() => this.globalSaveMsg = '', 3000);
      },
      error: () => {
        this.globalSaving = false;
        this.globalSaveMsg = '&#10007; Save failed';
        this.globalSaveMsgType = 'err';
        setTimeout(() => this.globalSaveMsg = '', 4000);
      }
    });
  }

  loadRestaurants(): void {
    this.restosLoading = true;
    this.api.listRestaurants().subscribe({
      next: (res: any) => {
        this.restaurants = res.restaurants ?? (Array.isArray(res) ? res : []);
        this.restosLoading = false;
      },
      error: () => { this.restosLoading = false; }
    });
  }

  onRestoChange(): void {
    if (!this.selectedRestoId) return;
    this.restoLoading = true;
    this.restoJson = '';
    this.restoParseError = '';
    this.restoSaveMsg = '';
    this.restoSource = '';
    this.api.getGlobalConfig(this.selectedRestoId).subscribe({
      next: (res: any) => {
        const cfg = res.config ?? res ?? {};
        this.restoSource = res.source ?? 'GLOBAL';
        this.restoJson = JSON.stringify(cfg, null, 2);
        this.restoParseError = '';
        this.restoLoading = false;
      },
      error: () => { this.restoLoading = false; }
    });
  }

  validateResto(): void {
    try { JSON.parse(this.restoJson); this.restoParseError = ''; }
    catch (e: any) { this.restoParseError = e.message; }
  }

  formatResto(): void {
    try { this.restoJson = JSON.stringify(JSON.parse(this.restoJson), null, 2); this.restoParseError = ''; }
    catch { }
  }

  saveResto(): void {
    let payload: any;
    try { payload = JSON.parse(this.restoJson); }
    catch { return; }
    this.restoSaving = true;
    this.restoSaveMsg = '';
    this.api.saveGlobalConfig({ ...payload, restaurantId: this.selectedRestoId }).subscribe({
      next: () => {
        this.restoSaving = false;
        this.restoSaveMsg = '&#10003; Restaurant config saved';
        this.restoSaveMsgType = 'ok';
        this.restoSource = 'RESTAURANT';
        setTimeout(() => this.restoSaveMsg = '', 3000);
      },
      error: () => {
        this.restoSaving = false;
        this.restoSaveMsg = '&#10007; Save failed';
        this.restoSaveMsgType = 'err';
        setTimeout(() => this.restoSaveMsg = '', 4000);
      }
    });
  }
}
