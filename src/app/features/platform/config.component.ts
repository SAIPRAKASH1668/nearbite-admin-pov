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

  <!-- YumCoins Config -->
  <div class="config-section">
    <div class="section-header">
      <div class="section-title">YumCoins Config</div>
      <span *ngIf="yumcoinsSource" class="source-badge">source: {{ yumcoinsSource }}</span>
    </div>
    <div class="yumcoins-body">
      <div *ngIf="yumcoinsLoading" class="empty-state">Loading&hellip;</div>
      <div class="yumcoins-grid" *ngIf="!yumcoinsLoading">
        <div class="yc-card">
          <div class="yc-card-title">Redemption</div>
          <label class="yc-check"><input type="checkbox" [(ngModel)]="yumcoins.walletConfig.redemptionEnabled" /> Redemption enabled</label>
          <div class="form-group"><label>₹ per YumCoin</label><input class="form-input" type="number" min="0" [(ngModel)]="yumcoins.walletConfig.yumConversionRate" placeholder="1" /></div>
          <div class="form-group"><label>Max coins per order</label><input class="form-input" type="number" min="0" [(ngModel)]="yumcoins.walletConfig.maxCoinsPerOrder" placeholder="500" /></div>
          <div class="form-group"><label>Max redemptions / day</label><input class="form-input" type="number" min="0" [(ngModel)]="yumcoins.walletConfig.maxRedemptionsPerDay" placeholder="3" /></div>
          <div class="form-group"><label>Min order value to redeem (₹)</label><input class="form-input" type="number" min="0" [(ngModel)]="yumcoins.walletConfig.minOrderValueToRedeem" placeholder="150" /></div>
        </div>
        <div class="yc-card">
          <div class="yc-card-title">Referral</div>
          <label class="yc-check"><input type="checkbox" [(ngModel)]="yumcoins.referralConfig.enabled" /> Referral enabled</label>
          <div class="form-group"><label>Referrer reward (coins)</label><input class="form-input" type="number" min="0" [(ngModel)]="yumcoins.referralConfig.referrerReward" placeholder="100" /></div>
          <div class="form-group"><label>Referee reward (coins)</label><input class="form-input" type="number" min="0" [(ngModel)]="yumcoins.referralConfig.refereeReward" placeholder="50" /></div>
        </div>
        <div class="yc-card">
          <div class="yc-card-title">Order cashback</div>
          <label class="yc-check"><input type="checkbox" [(ngModel)]="yumcoins.orderCashbackConfig.enabled" /> Cashback enabled</label>
          <div class="form-group"><label>Cashback %</label><input class="form-input" type="number" min="0" [(ngModel)]="yumcoins.orderCashbackConfig.percentage" placeholder="1.5" /></div>
          <div class="form-group"><label>Max coins per order</label><input class="form-input" type="number" min="0" [(ngModel)]="yumcoins.orderCashbackConfig.maxCoinsPerOrder" placeholder="100" /></div>
        </div>
      </div>
    </div>
    <div class="section-footer">
      <span *ngIf="yumcoinsSaveMsg" [class]="'save-msg save-' + yumcoinsSaveMsgType">{{ yumcoinsSaveMsg }}</span>
      <div class="footer-actions">
        <button class="btn btn-secondary btn-sm" (click)="loadYumcoins()" [disabled]="yumcoinsLoading || yumcoinsSaving">Reset</button>
        <button class="btn btn-primary" (click)="saveYumcoins()" [disabled]="yumcoinsSaving || yumcoinsLoading">
          {{ yumcoinsSaving ? 'Saving&hellip;' : 'Save YumCoins Config' }}
        </button>
      </div>
    </div>
  </div>

  <!-- COD Config -->
  <div class="config-section">
    <div class="section-header">
      <div class="section-title">Cash on Delivery (COD) Config</div>
      <span *ngIf="codSource" class="source-badge">source: {{ codSource }}</span>
    </div>
    <div class="yumcoins-body">
      <div *ngIf="codLoading" class="empty-state">Loading&hellip;</div>
      <div class="yumcoins-grid" *ngIf="!codLoading">
        <div class="yc-card">
          <div class="yc-card-title">Availability</div>
          <label class="yc-check"><input type="checkbox" [(ngModel)]="cod.disableCod" /> Disable COD globally</label>
          <div class="form-group"><label>Min order amount (₹)</label><input class="form-input" type="number" min="0" [(ngModel)]="cod.minAmount" placeholder="0" /></div>
          <div class="form-group"><label>Max order amount (₹)</label><input class="form-input" type="number" min="0" [(ngModel)]="cod.maxAmount" placeholder="2000" /></div>
        </div>
        <div class="yc-card">
          <div class="yc-card-title">COD hours (IST)</div>
          <div class="form-group"><label>Available from</label><input class="form-input" type="time" [(ngModel)]="cod.availableFrom" /></div>
          <div class="form-group"><label>Available to</label><input class="form-input" type="time" [(ngModel)]="cod.availableTo" /></div>
          <div class="yc-hint">COD is offered only inside this window. Leave both blank for 24×7. To disable COD 9 PM–6 AM, set 06:00 → 21:00.</div>
        </div>
      </div>
    </div>
    <div class="section-footer">
      <span *ngIf="codSaveMsg" [class]="'save-msg save-' + codSaveMsgType">{{ codSaveMsg }}</span>
      <div class="footer-actions">
        <button class="btn btn-secondary btn-sm" (click)="loadCod()" [disabled]="codLoading || codSaving">Reset</button>
        <button class="btn btn-primary" (click)="saveCod()" [disabled]="codSaving || codLoading">
          {{ codSaving ? 'Saving&hellip;' : 'Save COD Config' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Coupon Usage Config -->
  <div class="config-section">
    <div class="section-header">
      <div class="section-title">Coupon Usage</div>
    </div>
    <div class="yumcoins-body">
      <div *ngIf="couponCfgLoading" class="empty-state">Loading&hellip;</div>
      <div class="yumcoins-grid" *ngIf="!couponCfgLoading">
        <div class="yc-card">
          <div class="yc-card-title">Availability</div>
          <label class="yc-check"><input type="checkbox" [(ngModel)]="couponCfg.enabled" /> Allow customers to use coupons</label>
          <div class="form-group"><label>Available from</label><input class="form-input" type="time" [(ngModel)]="couponCfg.availableFrom" [disabled]="!couponCfg.enabled" /></div>
          <div class="form-group"><label>Available to</label><input class="form-input" type="time" [(ngModel)]="couponCfg.availableTo" [disabled]="!couponCfg.enabled" /></div>
          <div class="yc-hint">Uncheck to disable all checkout coupons platform-wide. Set a window (IST) to allow coupons only during those hours; leave both blank for 24×7. Item-level menu offers are not affected.</div>
        </div>
      </div>
    </div>
    <div class="section-footer">
      <span *ngIf="couponCfgSaveMsg" [class]="'save-msg save-' + couponCfgSaveMsgType">{{ couponCfgSaveMsg }}</span>
      <div class="footer-actions">
        <button class="btn btn-secondary btn-sm" (click)="loadCouponConfig()" [disabled]="couponCfgLoading || couponCfgSaving">Reset</button>
        <button class="btn btn-primary" (click)="saveCouponConfig()" [disabled]="couponCfgSaving || couponCfgLoading">
          {{ couponCfgSaving ? 'Saving&hellip;' : 'Save Coupon Usage' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Rider Config -->
  <div class="config-section">
    <div class="section-header">
      <div class="section-title">Rider Config</div>
      <span *ngIf="riderSource" class="source-badge">source: {{ riderSource }}</span>
    </div>
    <div class="editor-wrap">
      <div *ngIf="riderLoading" class="editor-overlay">Loading&hellip;</div>
      <textarea
        class="json-editor"
        [(ngModel)]="riderJson"
        spellcheck="false"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        rows="16"
        [class.json-error]="riderParseError"
        (ngModelChange)="validateRider()"
      ></textarea>
      <div *ngIf="riderParseError" class="parse-error">{{ riderParseError }}</div>
    </div>
    <div class="section-footer">
      <span *ngIf="riderSaveMsg" [class]="'save-msg save-' + riderSaveMsgType">{{ riderSaveMsg }}</span>
      <div class="footer-actions">
        <button class="btn btn-secondary btn-sm" (click)="formatRider()">Format JSON</button>
        <button class="btn btn-primary" (click)="saveRider()" [disabled]="riderSaving || !!riderParseError">
          {{ riderSaving ? 'Saving&hellip;' : 'Save Rider Config' }}
        </button>
      </div>
    </div>
    <div class="rider-hint">riderSlots, riderBonusConfig, riderSlotsSettings. Stored in CONFIG#RIDER.</div>
  </div>

  <!-- Coupon Blocks -->
  <div class="config-section">
    <div class="section-header">
      <div class="section-title">Customer Coupon Blocks</div>
      <span class="source-badge">{{ couponBlocksSource ? 'source: ' + couponBlocksSource : 'CONFIG#COUPONS' }}</span>
    </div>

    <div class="coupon-block-body">
      <div class="coupon-block-grid">
        <div class="form-group">
          <label>Restaurant</label>
          <select class="form-select" [(ngModel)]="selectedCouponBlockRestaurantId" (ngModelChange)="onCouponBlockRestaurantChange()">
            <option value="">Select restaurant</option>
            <option *ngFor="let r of restaurants" [value]="r.restaurantId">
              {{ r.name || r.restaurantName || r.restaurantId }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Coupon</label>
          <div class="inline-action">
            <select class="form-select" [(ngModel)]="selectedCouponToBlock" [disabled]="!selectedCouponBlockRestaurantId || couponsLoading">
              <option value="">{{ couponsLoading ? 'Loading coupons...' : 'Select coupon' }}</option>
              <option *ngFor="let code of availableCouponCodes" [value]="code">{{ code }}</option>
            </select>
            <button class="btn btn-secondary btn-sm" (click)="addSelectedCouponBlock()" [disabled]="!selectedCouponToBlock">Add</button>
          </div>
        </div>

        <div class="form-group">
          <label>Manual Code</label>
          <div class="inline-action">
            <input class="form-input" [(ngModel)]="manualCouponCode" placeholder="SAVE20" style="text-transform:uppercase" [disabled]="!selectedCouponBlockRestaurantId" />
            <button class="btn btn-secondary btn-sm" (click)="addManualCouponBlock()" [disabled]="!manualCouponCode.trim() || !selectedCouponBlockRestaurantId">Add</button>
          </div>
        </div>
      </div>

      <ng-container *ngIf="selectedCouponBlockRestaurantId; else pickRestaurant">
        <div class="blocked-summary">
          <div>
            <strong>{{ selectedCouponBlockRestaurantName }}</strong>
            <span>{{ selectedRestaurantBlockedCoupons.length }} blocked coupon{{ selectedRestaurantBlockedCoupons.length === 1 ? '' : 's' }}</span>
          </div>
          <button class="btn btn-primary" (click)="saveCouponBlocks()" [disabled]="couponBlockSaving">
            {{ couponBlockSaving ? 'Saving&hellip;' : 'Save Coupon Blocks' }}
          </button>
        </div>

        <div class="blocked-list" *ngIf="selectedRestaurantBlockedCoupons.length; else noBlockedCoupons">
          <span class="blocked-chip" *ngFor="let code of selectedRestaurantBlockedCoupons">
            <span class="font-mono">{{ code }}</span>
            <button type="button" (click)="removeBlockedCoupon(code)" aria-label="Remove coupon">&times;</button>
          </span>
        </div>
      </ng-container>

      <ng-template #pickRestaurant>
        <div class="empty-state">Select a restaurant to manage hidden customer coupons.</div>
      </ng-template>

      <ng-template #noBlockedCoupons>
        <div class="empty-state">No blocked coupons for this restaurant.</div>
      </ng-template>

      <div *ngIf="couponBlockSaveMsg" [class]="'save-msg save-' + couponBlockSaveMsgType">{{ couponBlockSaveMsg }}</div>
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
    .coupon-block-body { padding:16px 20px; display:flex; flex-direction:column; gap:16px; }
    .coupon-block-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12px; }
    .form-group { display:flex; flex-direction:column; gap:6px; }
    .form-group label { font-size:12px; font-weight:700; color:var(--color-text-secondary,#cbd5e1); }
    .inline-action { display:flex; gap:8px; align-items:center; }
    .inline-action .form-select, .inline-action .form-input { min-width:0; }
    .blocked-summary { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px; border:1px solid var(--color-border,#222); border-radius:8px; background:var(--color-bg-secondary,#161616); }
    .blocked-summary div { display:flex; flex-direction:column; gap:3px; }
    .blocked-summary span, .empty-state { color:var(--color-text-tertiary,#888); font-size:12px; }
    .blocked-list { display:flex; flex-wrap:wrap; gap:8px; }
    .blocked-chip { display:inline-flex; align-items:center; gap:8px; padding:6px 8px 6px 10px; border-radius:8px; background:rgba(239,68,68,.1); color:#fecaca; border:1px solid rgba(239,68,68,.24); font-size:12px; }
    .blocked-chip button { width:20px; height:20px; border:none; border-radius:50%; background:rgba(239,68,68,.18); color:#fecaca; cursor:pointer; line-height:18px; }
    .empty-state { padding:12px; border:1px dashed var(--color-border,#222); border-radius:8px; }
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
    .yumcoins-body { padding:16px 20px; }
    .yumcoins-grid { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:16px; }
    .yc-card { border:1px solid var(--color-border,#222); border-radius:10px; padding:14px; display:flex; flex-direction:column; gap:10px; background:var(--color-bg-secondary,#161616); }
    .yc-card-title { font-size:13px; font-weight:700; color:#fff; }
    .yc-check { display:flex; align-items:center; gap:8px; font-size:12px; font-weight:700; color:var(--color-text-secondary,#cbd5e1); }
    .yc-hint { font-size:11px; color:var(--color-text-tertiary,#888); line-height:1.5; }
    .rider-hint { padding:0 20px 14px; font-size:11px; color:var(--color-text-tertiary,#888); }
    @media (max-width:960px) { .coupon-block-grid { grid-template-columns:1fr; } .yumcoins-grid { grid-template-columns:1fr; } }
    @media (max-width:768px) { .page { padding:12px; gap:16px; } .json-editor { font-size:12px; padding:14px; } .blocked-summary { align-items:stretch; flex-direction:column; } }
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
  globalConfigData: any = {};

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

  coupons: any[] = [];
  couponsLoading = false;
  selectedCouponBlockRestaurantId = '';
  selectedCouponToBlock = '';
  manualCouponCode = '';
  couponBlockSaving = false;
  couponBlockSaveMsg = '';
  couponBlockSaveMsgType = 'ok';
  blockedConfig: Record<string, string[]> = {};   // restaurantId -> blocked codes (CONFIG#COUPONS)
  couponBlocksSource = '';

  yumcoins: any = this.blankYumcoins();
  yumcoinsLoading = false;
  yumcoinsSaving = false;
  yumcoinsSaveMsg = '';
  yumcoinsSaveMsgType = 'ok';
  yumcoinsSource = '';

  cod: any = this.blankCod();
  codLoading = false;
  codSaving = false;
  codSaveMsg = '';
  codSaveMsgType = 'ok';
  codSource = '';

  couponCfg: any = this.blankCouponConfig();
  couponCfgLoading = false;
  couponCfgSaving = false;
  couponCfgSaveMsg = '';
  couponCfgSaveMsgType = 'ok';

  riderJson = '';
  riderParseError = '';
  riderLoading = false;
  riderSaving = false;
  riderSaveMsg = '';
  riderSaveMsgType = 'ok';
  riderSource = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loadGlobal();
    this.loadRestaurants();
    this.loadCoupons();
    this.loadYumcoins();
    this.loadCod();
    this.loadCouponConfig();
    this.loadRiderConfig();
    this.loadCouponBlocks();
  }

  loadCouponBlocks(): void {
    this.api.getCouponBlocks().subscribe({
      next: (res: any) => {
        this.blockedConfig = this.normalizeBlockedCouponConfig(res?.blockedCouponsByRestaurant);
        this.couponBlocksSource = res?.source || '';
      },
      error: () => {}
    });
  }

  loadRiderConfig(): void {
    this.riderLoading = true;
    this.riderSaveMsg = '';
    this.api.getRiderConfig().subscribe({
      next: (res: any) => {
        const cfg = {
          riderSlots: res?.riderSlots ?? [],
          riderBonusConfig: res?.riderBonusConfig ?? {},
          riderSlotsSettings: res?.riderSlotsSettings ?? {},
        };
        this.riderSource = res?.source || '';
        this.riderJson = JSON.stringify(cfg, null, 2);
        this.riderParseError = '';
        this.riderLoading = false;
      },
      error: () => { this.riderLoading = false; }
    });
  }

  validateRider(): void {
    try { JSON.parse(this.riderJson); this.riderParseError = ''; }
    catch (e: any) { this.riderParseError = e.message; }
  }

  formatRider(): void {
    try { this.riderJson = JSON.stringify(JSON.parse(this.riderJson), null, 2); this.riderParseError = ''; }
    catch { }
  }

  saveRider(): void {
    let payload: any;
    try { payload = JSON.parse(this.riderJson); }
    catch { return; }
    this.riderSaving = true;
    this.riderSaveMsg = '';
    this.api.saveRiderConfig(payload).subscribe({
      next: () => {
        this.riderSaving = false;
        this.riderSource = 'RIDER';
        this.riderSaveMsg = '✓ Rider config saved';
        this.riderSaveMsgType = 'ok';
        setTimeout(() => this.riderSaveMsg = '', 3000);
      },
      error: () => {
        this.riderSaving = false;
        this.riderSaveMsg = '✗ Save failed';
        this.riderSaveMsgType = 'err';
        setTimeout(() => this.riderSaveMsg = '', 4000);
      }
    });
  }

  blankCouponConfig(): any {
    return { enabled: true, availableFrom: '', availableTo: '' };
  }

  loadCouponConfig(): void {
    this.couponCfgLoading = true;
    this.couponCfgSaveMsg = '';
    this.api.getCouponConfig().subscribe({
      next: (res: any) => {
        this.couponCfg = { ...this.blankCouponConfig(), ...(res?.couponConfig || {}) };
        this.couponCfgLoading = false;
      },
      error: () => { this.couponCfgLoading = false; }
    });
  }

  saveCouponConfig(): void {
    const payload = {
      couponConfig: {
        enabled: !!this.couponCfg.enabled,
        availableFrom: this.couponCfg.availableFrom || '',
        availableTo: this.couponCfg.availableTo || '',
      },
    };
    this.couponCfgSaving = true;
    this.couponCfgSaveMsg = '';
    this.api.saveCouponConfig(payload).subscribe({
      next: () => {
        this.couponCfgSaving = false;
        this.couponCfgSaveMsg = '✓ Coupon usage saved';
        this.couponCfgSaveMsgType = 'ok';
        setTimeout(() => this.couponCfgSaveMsg = '', 3000);
      },
      error: () => {
        this.couponCfgSaving = false;
        this.couponCfgSaveMsg = '✗ Save failed';
        this.couponCfgSaveMsgType = 'err';
        setTimeout(() => this.couponCfgSaveMsg = '', 4000);
      }
    });
  }

  blankCod(): any {
    return { disableCod: false, minAmount: null, maxAmount: null, availableFrom: '', availableTo: '' };
  }

  loadCod(): void {
    this.codLoading = true;
    this.codSaveMsg = '';
    this.api.getCodConfig().subscribe({
      next: (res: any) => {
        this.cod = { ...this.blankCod(), ...(res?.codConfig || {}) };
        this.codSource = res?.source || '';
        this.codLoading = false;
      },
      error: () => { this.codLoading = false; }
    });
  }

  saveCod(): void {
    const num = (v: any) => (v === null || v === undefined || v === '' ? 0 : Number(v));
    const payload = {
      codConfig: {
        disableCod: !!this.cod.disableCod,
        minAmount: num(this.cod.minAmount),
        maxAmount: num(this.cod.maxAmount),
        availableFrom: this.cod.availableFrom || '',
        availableTo: this.cod.availableTo || '',
      },
    };
    this.codSaving = true;
    this.codSaveMsg = '';
    this.api.saveCodConfig(payload).subscribe({
      next: () => {
        this.codSaving = false;
        this.codSource = 'COD';
        this.codSaveMsg = '✓ COD config saved';
        this.codSaveMsgType = 'ok';
        setTimeout(() => this.codSaveMsg = '', 3000);
      },
      error: () => {
        this.codSaving = false;
        this.codSaveMsg = '✗ Save failed';
        this.codSaveMsgType = 'err';
        setTimeout(() => this.codSaveMsg = '', 4000);
      }
    });
  }

  blankYumcoins(): any {
    return {
      walletConfig: {
        yumConversionRate: null,
        redemptionEnabled: false,
        maxCoinsPerOrder: null,
        maxRedemptionsPerDay: null,
        minOrderValueToRedeem: null,
      },
      referralConfig: { enabled: false, referrerReward: null, refereeReward: null },
      orderCashbackConfig: { enabled: false, percentage: null, maxCoinsPerOrder: null },
    };
  }

  loadYumcoins(): void {
    this.yumcoinsLoading = true;
    this.yumcoinsSaveMsg = '';
    this.api.getYumcoinsConfig().subscribe({
      next: (res: any) => {
        const base = this.blankYumcoins();
        this.yumcoins = {
          walletConfig: { ...base.walletConfig, ...(res?.walletConfig || {}) },
          referralConfig: { ...base.referralConfig, ...(res?.referralConfig || {}) },
          orderCashbackConfig: { ...base.orderCashbackConfig, ...(res?.orderCashbackConfig || {}) },
        };
        this.yumcoinsSource = res?.source || '';
        this.yumcoinsLoading = false;
      },
      error: () => { this.yumcoinsLoading = false; }
    });
  }

  saveYumcoins(): void {
    const num = (v: any) => (v === null || v === undefined || v === '' ? 0 : Number(v));
    const payload = {
      walletConfig: {
        yumConversionRate: num(this.yumcoins.walletConfig.yumConversionRate),
        redemptionEnabled: !!this.yumcoins.walletConfig.redemptionEnabled,
        maxCoinsPerOrder: num(this.yumcoins.walletConfig.maxCoinsPerOrder),
        maxRedemptionsPerDay: num(this.yumcoins.walletConfig.maxRedemptionsPerDay),
        minOrderValueToRedeem: num(this.yumcoins.walletConfig.minOrderValueToRedeem),
      },
      referralConfig: {
        enabled: !!this.yumcoins.referralConfig.enabled,
        referrerReward: num(this.yumcoins.referralConfig.referrerReward),
        refereeReward: num(this.yumcoins.referralConfig.refereeReward),
      },
      orderCashbackConfig: {
        enabled: !!this.yumcoins.orderCashbackConfig.enabled,
        percentage: num(this.yumcoins.orderCashbackConfig.percentage),
        maxCoinsPerOrder: num(this.yumcoins.orderCashbackConfig.maxCoinsPerOrder),
      },
    };
    this.yumcoinsSaving = true;
    this.yumcoinsSaveMsg = '';
    this.api.saveYumcoinsConfig(payload).subscribe({
      next: () => {
        this.yumcoinsSaving = false;
        this.yumcoinsSource = 'YUMCOINS';
        this.yumcoinsSaveMsg = '✓ YumCoins config saved';
        this.yumcoinsSaveMsgType = 'ok';
        setTimeout(() => this.yumcoinsSaveMsg = '', 3000);
      },
      error: () => {
        this.yumcoinsSaving = false;
        this.yumcoinsSaveMsg = '✗ Save failed';
        this.yumcoinsSaveMsgType = 'err';
        setTimeout(() => this.yumcoinsSaveMsg = '', 4000);
      }
    });
  }

  loadGlobal(): void {
    this.globalLoading = true;
    this.api.getGlobalConfig().subscribe({
      next: (res: any) => {
        const cfg = res.config ?? res ?? {};
        this.globalConfigData = cfg;
        this.globalSource = res.source ?? 'GLOBAL';
        this.globalJson = JSON.stringify(cfg, null, 2);
        this.globalParseError = '';
        this.globalLoading = false;
      },
      error: () => { this.globalLoading = false; }
    });
  }

  validateGlobal(): void {
    try { this.globalConfigData = JSON.parse(this.globalJson); this.globalParseError = ''; }
    catch (e: any) { this.globalParseError = e.message; }
  }

  formatGlobal(): void {
    try { this.globalConfigData = JSON.parse(this.globalJson); this.globalJson = JSON.stringify(this.globalConfigData, null, 2); this.globalParseError = ''; }
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
        this.globalConfigData = payload;
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

  loadCoupons(): void {
    this.couponsLoading = true;
    this.api.listCoupons().subscribe({
      next: (res: any) => {
        this.coupons = res.coupons ?? (Array.isArray(res) ? res : []);
        this.couponsLoading = false;
      },
      error: () => { this.couponsLoading = false; }
    });
  }

  get selectedCouponBlockRestaurantName(): string {
    const restaurant = this.restaurants.find(r => r.restaurantId === this.selectedCouponBlockRestaurantId);
    return restaurant?.name || restaurant?.restaurantName || this.selectedCouponBlockRestaurantId;
  }

  get selectedRestaurantBlockedCoupons(): string[] {
    if (!this.selectedCouponBlockRestaurantId) return [];
    return this.blockedConfig[this.selectedCouponBlockRestaurantId] || [];
  }

  get availableCouponCodes(): string[] {
    const blocked = new Set(this.selectedRestaurantBlockedCoupons);
    return Array.from(new Set(
      this.coupons
        .map(c => String(c.couponCode || '').trim().toUpperCase())
        .filter(Boolean)
    ))
      .filter(code => !blocked.has(code))
      .sort();
  }

  onCouponBlockRestaurantChange(): void {
    this.selectedCouponToBlock = '';
    this.manualCouponCode = '';
    this.couponBlockSaveMsg = '';
  }

  addSelectedCouponBlock(): void {
    this.addBlockedCoupon(this.selectedCouponToBlock);
    this.selectedCouponToBlock = '';
  }

  addManualCouponBlock(): void {
    this.addBlockedCoupon(this.manualCouponCode);
    this.manualCouponCode = '';
  }

  removeBlockedCoupon(code: string): void {
    if (!this.selectedCouponBlockRestaurantId) return;
    const up = String(code || '').trim().toUpperCase();
    const list = (this.blockedConfig[this.selectedCouponBlockRestaurantId] || []).filter(c => c !== up);
    this.blockedConfig = { ...this.blockedConfig, [this.selectedCouponBlockRestaurantId]: list };
  }

  saveCouponBlocks(): void {
    if (!this.selectedCouponBlockRestaurantId) return;
    const payload: Record<string, string[]> = {};
    Object.entries(this.blockedConfig).forEach(([rid, codes]) => { if (codes?.length) payload[rid] = codes; });
    this.couponBlockSaving = true;
    this.couponBlockSaveMsg = '';
    this.api.saveCouponBlocks(payload).subscribe({
      next: (res: any) => {
        this.blockedConfig = this.normalizeBlockedCouponConfig(res?.blockedCouponsByRestaurant);
        this.couponBlockSaving = false;
        this.couponBlockSaveMsg = '✓ Coupon blocks saved';
        this.couponBlockSaveMsgType = 'ok';
        setTimeout(() => this.couponBlockSaveMsg = '', 3000);
      },
      error: () => {
        this.couponBlockSaving = false;
        this.couponBlockSaveMsg = '✗ Save failed';
        this.couponBlockSaveMsgType = 'err';
        setTimeout(() => this.couponBlockSaveMsg = '', 4000);
      }
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

  private addBlockedCoupon(rawCode: string): void {
    const code = String(rawCode || '').trim().toUpperCase();
    if (!code || !this.selectedCouponBlockRestaurantId) return;
    const current = new Set(this.blockedConfig[this.selectedCouponBlockRestaurantId] || []);
    current.add(code);
    this.blockedConfig = {
      ...this.blockedConfig,
      [this.selectedCouponBlockRestaurantId]: Array.from(current).sort(),
    };
  }

  private normalizeBlockedCouponConfig(value: any): Record<string, string[]> {
    const normalized: Record<string, string[]> = {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) return normalized;

    Object.entries(value).forEach(([restaurantId, rawCodes]) => {
      const codes = this.normalizeCouponCodes(rawCodes);
      if (codes.length) normalized[String(restaurantId).trim()] = codes;
    });
    return normalized;
  }

  private normalizeCouponCodes(value: any): string[] {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return this.normalizeCouponCodes(value.couponCodes ?? value.codes ?? value.blockedCoupons);
    }

    const rawCodes = Array.isArray(value)
      ? value
      : (typeof value === 'string' ? value.split(/[\n,]+/) : []);
    return Array.from(new Set(
      rawCodes
        .map(code => String(code || '').trim().toUpperCase())
        .filter(Boolean)
    )).sort();
  }

}
