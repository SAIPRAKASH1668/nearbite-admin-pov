import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ImageUploaderComponent } from '../../shared/components/image-uploader/image-uploader.component';

/**
 * Full restaurant editor over the REAL persistable fields (models/restaurant.py).
 * Fetches the full record by id, edits, and PUTs a partial update.
 */
@Component({
  selector: 'app-restaurant-detail-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploaderComponent],
  template: `
<div class="rd">
  <div *ngIf="loading" class="card" style="padding:16px">
    <div class="skeleton" style="height:48px;margin-bottom:8px;border-radius:8px" *ngFor="let i of [1,2,3,4]"></div>
  </div>

  <div *ngIf="!loading" class="card">
    <div class="card-body">
      <!-- Read-only identity -->
      <div class="ro-row">
        <span class="ro"><span class="ro-k">ID</span> <span class="font-mono">{{ form.restaurantId }}</span></span>
        <span class="ro" *ngIf="form.geohash"><span class="ro-k">geohash</span> <span class="font-mono">{{ form.geohash }}</span></span>
        <span class="ro" *ngIf="form.rating != null"><span class="ro-k">rating</span> {{ form.rating }} ({{ form.ratedCount || 0 }})</span>
      </div>

      <div class="form-grid">
        <div class="form-group full-col">
          <label>Name</label>
          <input class="form-input" [(ngModel)]="form.name" />
        </div>

        <div class="form-group">
          <label>Latitude</label>
          <input class="form-input" type="number" step="any" [(ngModel)]="form.latitude" />
        </div>
        <div class="form-group">
          <label>Longitude</label>
          <input class="form-input" type="number" step="any" [(ngModel)]="form.longitude" />
        </div>
        <div class="form-group">
          <label>Open?</label>
          <select class="form-select" [(ngModel)]="form.isOpen">
            <option [ngValue]="true">Open</option>
            <option [ngValue]="false">Closed</option>
          </select>
        </div>

        <div class="form-group full-col" *ngIf="relocated">
          <div class="warn">⚠️ Changing latitude/longitude relocates this restaurant (its record is re-created under a new geohash). Double-check the coordinates.</div>
        </div>

        <div class="form-group full-col">
          <label>Cuisines <span class="muted">(comma-separated)</span></label>
          <input class="form-input" [(ngModel)]="cuisineText" placeholder="South Indian, Biryani" />
        </div>

        <div class="form-group">
          <label>Opens at</label>
          <input class="form-input" type="time" [(ngModel)]="form.opensAt" />
        </div>
        <div class="form-group">
          <label>Closes at</label>
          <input class="form-input" type="time" [(ngModel)]="form.closesAt" />
        </div>
        <div class="form-group">
          <label>Avg prep time (min)</label>
          <input class="form-input" type="number" [(ngModel)]="form.avgPreparationTime" placeholder="5–120" />
        </div>

        <div class="form-group">
          <label>Homescreen position</label>
          <input class="form-input" type="number" [(ngModel)]="form.position" />
        </div>
        <div class="form-group">
          <label>Top offer banner</label>
          <input class="form-input" maxlength="20" [(ngModel)]="form.topOfferBanner" />
        </div>
        <div class="form-group">
          <label>Timezone</label>
          <select class="form-select" [(ngModel)]="form.timezone">
            <option value="Asia/Kolkata">Asia/Kolkata</option>
            <option value="Asia/Dubai">Asia/Dubai</option>
            <option value="Asia/Singapore">Asia/Singapore</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <div class="form-group">
          <label>Theater mode</label>
          <select class="form-select" [(ngModel)]="form.theaterMode">
            <option [ngValue]="null">Disabled</option>
            <option [ngValue]="'AVAILABLE'">Available (in-venue)</option>
          </select>
        </div>

        <!-- Shift timings -->
        <div class="form-group full-col">
          <label>Shift timings (availability windows)</label>
          <div class="rows">
            <div class="row-line" *ngFor="let s of form.shiftTimings; let i = index">
              <input class="form-input" placeholder="Label (e.g. Lunch)" [(ngModel)]="s.label" />
              <input class="form-input" type="time" [(ngModel)]="s.start" style="max-width:130px" />
              <input class="form-input" type="time" [(ngModel)]="s.end" style="max-width:130px" />
              <button class="btn btn-xs btn-ghost" (click)="form.shiftTimings.splice(i,1)">✕</button>
            </div>
          </div>
          <button class="btn btn-xs btn-secondary" (click)="form.shiftTimings.push({ label:'', start:'', end:'' })">＋ Add shift</button>
        </div>

        <!-- Images -->
        <div class="form-group full-col">
          <app-image-uploader entity="RESTAURANT" [restaurantId]="form.restaurantId"
            [urls]="form.restaurantImage" (urlsChange)="form.restaurantImage = $event" label="Restaurant photos"></app-image-uploader>
        </div>

        <!-- Advanced -->
        <div class="form-group full-col">
          <button class="btn btn-xs btn-ghost" (click)="showAdvanced = !showAdvanced">{{ showAdvanced ? '▾' : '▸' }} Advanced</button>
        </div>
        <ng-container *ngIf="showAdvanced">
          <div class="form-group">
            <label>Location ID <span class="muted">(city group)</span></label>
            <input class="form-input" [(ngModel)]="form.locationId" />
          </div>
          <div class="form-group">
            <label>Owner ID</label>
            <input class="form-input" [(ngModel)]="form.ownerId" />
          </div>
        </ng-container>
      </div>

      <div *ngIf="error" class="warn" style="margin-top:12px">{{ error }}</div>

      <div class="form-actions" style="margin-top:16px">
        <button class="btn btn-secondary" (click)="reset()" [disabled]="saving">Reset</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving || !canSave">{{ saving ? 'Saving...' : 'Save changes' }}</button>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .card-body { padding:16px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
    .full-col { grid-column:1/-1; }
    .form-actions { display:flex; gap:10px; justify-content:flex-end; }
    .muted { color:#777; font-size:11px; }
    .warn { background:rgba(245,158,11,.12); color:#fbbf24; border-radius:8px; padding:10px 12px; font-size:12px; }
    .ro-row { display:flex; gap:16px; flex-wrap:wrap; margin-bottom:14px; font-size:12px; color:#aaa; }
    .ro-k { color:#666; margin-right:4px; }
    .rows { display:flex; flex-direction:column; gap:6px; margin-bottom:6px; }
    .row-line { display:flex; gap:6px; align-items:center; }
    .row-line .form-input { flex:1; }
    @media (max-width:900px) { .form-grid { grid-template-columns:1fr 1fr; } }
    @media (max-width:600px) { .form-grid { grid-template-columns:1fr; } .form-actions { flex-direction:column; } }
  `]
})
export class RestaurantDetailFormComponent implements OnChanges {
  @Input() restaurant: any = null;
  @Output() saved = new EventEmitter<any>();

  loading = false;
  saving = false;
  error = '';
  showAdvanced = false;
  form: any = {};
  cuisineText = '';
  private origLat: number | null = null;
  private origLng: number | null = null;

  constructor(private api: ApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['restaurant'] && this.restaurant) {
      const id = this.restaurant.restaurantId || this.restaurant.id;
      if (id) this.fetch(id);
      else this.populate(this.restaurant);
    }
  }

  get canSave(): boolean { return !!(this.form.name || '').trim(); }

  get relocated(): boolean {
    return this.origLat != null && this.origLng != null
      && (+this.form.latitude !== +this.origLat || +this.form.longitude !== +this.origLng);
  }

  private fetch(id: string): void {
    this.loading = true;
    this.api.getRestaurant(id).subscribe({
      next: (res: any) => { this.populate(res || this.restaurant); this.loading = false; },
      error: () => { this.populate(this.restaurant); this.loading = false; },
    });
  }

  private populate(r: any): void {
    const img = Array.isArray(r.restaurantImage) ? [...r.restaurantImage] : (r.restaurantImage ? [r.restaurantImage] : []);
    this.form = {
      restaurantId: r.restaurantId || r.id || '',
      name: r.name || '',
      latitude: r.latitude ?? r.lat ?? null,
      longitude: r.longitude ?? r.lng ?? null,
      isOpen: r.isOpen !== false,
      opensAt: r.opensAt || '',
      closesAt: r.closesAt || '',
      avgPreparationTime: r.avgPreparationTime ?? null,
      position: r.position ?? null,
      topOfferBanner: r.topOfferBanner || '',
      timezone: r.timezone || 'Asia/Kolkata',
      theaterMode: r.theaterMode ?? null,
      shiftTimings: Array.isArray(r.shiftTimings) ? r.shiftTimings.map((s: any) => ({ ...s })) : [],
      restaurantImage: img,
      locationId: r.locationId || '',
      ownerId: r.ownerId || '',
      geohash: r.geohash || '',
      rating: r.rating ?? null,
      ratedCount: r.ratedCount ?? null,
    };
    this.cuisineText = Array.isArray(r.cuisine) ? r.cuisine.join(', ') : (r.cuisine || '');
    this.origLat = this.form.latitude != null ? +this.form.latitude : null;
    this.origLng = this.form.longitude != null ? +this.form.longitude : null;
    this.error = '';
  }

  reset(): void { this.populate(this.restaurant); }

  private buildPayload(): any {
    const f = this.form;
    const cuisine = this.cuisineText ? this.cuisineText.split(',').map(s => s.trim()).filter(Boolean) : [];
    const shiftTimings = (f.shiftTimings || [])
      .filter((s: any) => s.label && s.start && s.end)
      .map((s: any) => ({ label: s.label, start: s.start, end: s.end }));
    const payload: any = {
      name: (f.name || '').trim(),
      isOpen: f.isOpen !== false,
      cuisine,
      opensAt: f.opensAt || '',
      closesAt: f.closesAt || '',
      topOfferBanner: f.topOfferBanner || '',
      timezone: f.timezone || 'Asia/Kolkata',
      theaterMode: f.theaterMode || null,
      shiftTimings,
      restaurantImage: f.restaurantImage || [],
      locationId: f.locationId || '',
      ownerId: f.ownerId || '',
    };
    if (f.latitude != null && f.latitude !== '') payload.latitude = +f.latitude;
    if (f.longitude != null && f.longitude !== '') payload.longitude = +f.longitude;
    if (f.avgPreparationTime != null && f.avgPreparationTime !== '') payload.avgPreparationTime = +f.avgPreparationTime;
    if (f.position != null && f.position !== '') payload.position = +f.position;
    return payload;
  }

  save(): void {
    if (!this.canSave || this.saving) return;
    const apt = this.form.avgPreparationTime;
    if (apt != null && apt !== '' && (+apt < 5 || +apt > 120)) {
      this.error = 'Avg prep time must be between 5 and 120 minutes.';
      return;
    }
    this.saving = true;
    this.error = '';
    this.api.updateRestaurant(this.form.restaurantId, this.buildPayload()).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.origLat = +this.form.latitude;
        this.origLng = +this.form.longitude;
        this.saved.emit(res || this.form);
      },
      error: () => { this.saving = false; this.error = 'Save failed. Please try again.'; },
    });
  }
}
