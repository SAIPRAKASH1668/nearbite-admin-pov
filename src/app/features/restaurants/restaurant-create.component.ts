import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-restaurant-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Create Restaurant</div>
      <div class="page-subtitle">Onboard a new restaurant to the platform</div>
    </div>
  </div>

  <div *ngIf="success" class="alert alert-success" style="margin-bottom:16px">
    ✓ Restaurant created successfully! ID: <strong>{{ createdId }}</strong>
  </div>

  <div class="form-grid">
    <!-- Basic Info -->
    <div class="card">
      <div class="card-header">Basic Information</div>
      <div class="card-body">
        <div class="form-group">
          <label>Restaurant Name *</label>
          <input class="form-input" [(ngModel)]="form.name" placeholder="e.g. Aatithyam Restaurant" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Phone *</label>
            <input class="form-input" [(ngModel)]="form.phone" placeholder="+91XXXXXXXXXX" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input class="form-input" [(ngModel)]="form.email" placeholder="owner@restaurant.com" />
          </div>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea class="form-input" rows="3" [(ngModel)]="form.description" placeholder="Short description of the restaurant..."></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>FSSAI Number</label>
            <input class="form-input" [(ngModel)]="form.fssaiNumber" placeholder="FSSAI license number" />
          </div>
          <div class="form-group">
            <label>GST Number</label>
            <input class="form-input" [(ngModel)]="form.gstNumber" placeholder="GST number" />
          </div>
        </div>
      </div>
    </div>

    <!-- Location -->
    <div class="card">
      <div class="card-header">Location</div>
      <div class="card-body">
        <div class="form-group">
          <label>Address Line 1 *</label>
          <input class="form-input" [(ngModel)]="form.address.line1" placeholder="Street address" />
        </div>
        <div class="form-group">
          <label>Address Line 2</label>
          <input class="form-input" [(ngModel)]="form.address.line2" placeholder="Area / Locality" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>City *</label>
            <input class="form-input" [(ngModel)]="form.address.city" placeholder="City" />
          </div>
          <div class="form-group">
            <label>State</label>
            <input class="form-input" [(ngModel)]="form.address.state" placeholder="State" />
          </div>
          <div class="form-group">
            <label>PIN Code</label>
            <input class="form-input" [(ngModel)]="form.address.pincode" placeholder="PIN" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Latitude *</label>
            <input class="form-input" type="number" step="0.0001" [(ngModel)]="form.location.lat" placeholder="17.3850" />
          </div>
          <div class="form-group">
            <label>Longitude *</label>
            <input class="form-input" type="number" step="0.0001" [(ngModel)]="form.location.lng" placeholder="78.4867" />
          </div>
        </div>
      </div>
    </div>

    <!-- Settings -->
    <div class="card">
      <div class="card-header">Settings &amp; Pricing</div>
      <div class="card-body">
        <div class="form-row">
          <div class="form-group">
            <label>Min Order Value (₹)</label>
            <input class="form-input" type="number" [(ngModel)]="form.minOrderValue" placeholder="100" />
          </div>
          <div class="form-group">
            <label>Commission (%)</label>
            <input class="form-input" type="number" [(ngModel)]="form.commissionPct" placeholder="15" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Avg Prep Time (min)</label>
            <input class="form-input" type="number" [(ngModel)]="form.avgPrepTime" placeholder="20" />
          </div>
          <div class="form-group">
            <label>Delivery Radius (km)</label>
            <input class="form-input" type="number" [(ngModel)]="form.deliveryRadiusKm" placeholder="5" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Opening Time</label>
            <input class="form-input" type="time" [(ngModel)]="form.openingTime" />
          </div>
          <div class="form-group">
            <label>Closing Time</label>
            <input class="form-input" type="time" [(ngModel)]="form.closingTime" />
          </div>
        </div>
        <div class="form-group">
          <label>Image URL</label>
          <input class="form-input" [(ngModel)]="form.imageUrl" placeholder="https://..." />
        </div>
        <div class="toggle-row">
          <label>Is Open</label>
          <label class="toggle">
            <input type="checkbox" [(ngModel)]="form.isOpen" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="toggle-row">
          <label>Pure Veg</label>
          <label class="toggle">
            <input type="checkbox" [(ngModel)]="form.isPureVeg" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- Owner -->
    <div class="card">
      <div class="card-header">Owner Details</div>
      <div class="card-body">
        <div class="form-row">
          <div class="form-group">
            <label>Owner Name</label>
            <input class="form-input" [(ngModel)]="form.ownerName" placeholder="Owner full name" />
          </div>
          <div class="form-group">
            <label>Owner Phone</label>
            <input class="form-input" [(ngModel)]="form.ownerPhone" placeholder="+91XXXXXXXXXX" />
          </div>
        </div>
        <div class="form-group">
          <label>Bank Account (for payouts)</label>
          <input class="form-input" [(ngModel)]="form.bankAccount" placeholder="Account number" />
        </div>
        <div class="form-group">
          <label>IFSC Code</label>
          <input class="form-input" [(ngModel)]="form.ifscCode" placeholder="SBIN0XXXXXX" />
        </div>
      </div>
    </div>
  </div>

  <div class="form-actions">
    <button class="btn btn-secondary" (click)="reset()">Reset</button>
    <button class="btn btn-primary" (click)="submit()" [disabled]="saving">{{ saving ? 'Creating...' : 'Create Restaurant' }}</button>
  </div>
</div>
  `,
  styles: [`
    .page { padding: 24px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
    .card-header { font-weight:600; font-size:13px; padding:12px 14px; border-bottom:1px solid var(--color-border); }
    .card-body { padding:16px; display:flex; flex-direction:column; gap:12px; }
    .toggle-row { display:flex; justify-content:space-between; align-items:center; font-size:13px; }
    .toggle { position:relative; display:inline-block; width:40px; height:22px; }
    .toggle input { opacity:0; width:0; height:0; }
    .toggle-slider { position:absolute; inset:0; background:var(--color-300); border-radius:22px; cursor:pointer; transition:.2s; }
    .toggle input:checked + .toggle-slider { background:var(--color-900); }
    .toggle-slider:before { content:''; position:absolute; width:16px; height:16px; left:3px; bottom:3px; background:var(--color-white); border-radius:50%; transition:.2s; }
    .toggle input:checked + .toggle-slider:before { transform:translateX(18px); }
    .form-actions { display:flex; gap:12px; justify-content:flex-end; margin-top:8px; }
    .alert-success { padding:12px 16px; background:#f0fdf4; border:1px solid var(--color-success); border-radius:8px; font-size:13px; color:#166534; }
    @media (max-width:900px) { .form-grid { grid-template-columns:1fr; } }
    @media (max-width:768px) { .page { padding: 12px; } .form-actions { flex-direction: column; } }
  `]
})
export class RestaurantCreateComponent {
  saving = false;
  success = false;
  createdId = '';
  form = this.blank();

  blank() {
    return {
      name: '', phone: '', email: '', description: '', fssaiNumber: '', gstNumber: '',
      address: { line1: '', line2: '', city: '', state: '', pincode: '' },
      location: { lat: 0, lng: 0 },
      minOrderValue: 100, commissionPct: 15, avgPrepTime: 20, deliveryRadiusKm: 5,
      openingTime: '09:00', closingTime: '22:00', imageUrl: '',
      isOpen: true, isPureVeg: false,
      ownerName: '', ownerPhone: '', bankAccount: '', ifscCode: ''
    };
  }

  constructor(private api: ApiService, private router: Router) {}

  reset(): void { this.form = this.blank(); this.success = false; }

  submit(): void {
    if (!this.form.name || !this.form.phone) return;
    this.saving = true;
    this.api.createRestaurant(this.form).subscribe({
      next: (res: any) => {
        this.createdId = res.restaurantId || res.id || 'N/A';
        this.success = true;
        this.saving = false;
        this.form = this.blank();
        window.scrollTo(0, 0);
      },
      error: () => { this.saving = false; }
    });
  }
}
