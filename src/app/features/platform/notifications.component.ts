import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
<div class="page fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Send Notifications</div>
      <div class="page-subtitle">Push notifications to users, riders, or restaurants</div>
    </div>
  </div>

  <div class="content-grid notif-grid">

    <!-- Compose -->
    <div class="card">
      <div class="card-header">Compose Notification</div>
      <div class="card-body">
        <div class="form-group">
          <label>Audience</label>
          <select class="form-select" [(ngModel)]="form.audience">
            <option value="all_customers">All Customers</option>
            <option value="all_riders">All Riders</option>
            <option value="all_restaurants">All Restaurants</option>
            <option value="specific_user">Specific User</option>
            <option value="specific_rider">Specific Rider</option>
          </select>
        </div>

        <div *ngIf="form.audience==='specific_user' || form.audience==='specific_rider'" class="form-group">
          <label>Target ID / Phone</label>
          <input class="form-input" [(ngModel)]="form.targetId" placeholder="User ID or phone number" />
        </div>

        <div class="form-group">
          <label>Notification Title *</label>
          <input class="form-input" [(ngModel)]="form.title" placeholder="e.g. 🎉 Special Offer!" />
        </div>

        <div class="form-group">
          <label>Message Body *</label>
          <textarea class="form-input" rows="4" [(ngModel)]="form.body" placeholder="Enter your notification message..."></textarea>
          <div class="char-count">{{ form.body.length }}/200</div>
        </div>

        <div class="form-group">
          <label>Deep Link (optional)</label>
          <input class="form-input" [(ngModel)]="form.deepLink" placeholder="e.g. yumdude://offers" />
        </div>

        <div class="form-group">
          <label>Image URL (optional)</label>
          <input class="form-input" [(ngModel)]="form.imageUrl" placeholder="https://..." />
        </div>

        <!-- Preview -->
        <div class="notif-preview" *ngIf="form.title || form.body">
          <div class="notif-icon">🍔</div>
          <div class="notif-content">
            <div class="notif-title">{{ form.title || 'Notification Title' }}</div>
            <div class="notif-body">{{ form.body || 'Message body...' }}</div>
          </div>
        </div>

        <button class="btn btn-primary" style="width:100%;margin-top:8px" (click)="send()" [disabled]="sending || !form.title || !form.body">
          {{ sending ? 'Sending...' : '📤 Send Notification' }}
        </button>
      </div>
    </div>

    <!-- History + Templates -->
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="card">
        <div class="card-header">Quick Templates</div>
        <div class="templates-list">
          <div class="template-item" *ngFor="let t of templates" (click)="applyTemplate(t)">
            <div class="template-icon">{{ t.icon }}</div>
            <div>
              <div class="template-title">{{ t.title }}</div>
              <div class="template-body text-secondary">{{ t.body }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">Send History</div>
        <div class="history-list" *ngIf="sent.length > 0">
          <div class="history-item" *ngFor="let s of sent">
            <div>
              <div class="history-title">{{ s.title }}</div>
              <div class="text-secondary" style="font-size:11px">{{ s.audience }} · {{ s.sentAt | date:'dd MMM, HH:mm' }}</div>
            </div>
            <span class="badge badge-success">Sent</span>
          </div>
        </div>
        <div *ngIf="sent.length === 0" class="text-secondary no-data">No notifications sent this session</div>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .page { padding: 24px; }
    .card-header { font-weight:600; font-size:13px; padding:12px 14px; border-bottom:1px solid var(--color-border); }
    .card-body { padding:16px; display:flex; flex-direction:column; gap:12px; }
    .char-count { font-size:11px; color:var(--color-400); text-align:right; margin-top:2px; }
    .notif-preview { display:flex; gap:10px; padding:12px; background:var(--color-50); border-radius:8px; border:1px solid var(--color-border); }
    .notif-icon { font-size:24px; flex-shrink:0; }
    .notif-title { font-weight:600; font-size:13px; }
    .notif-body { font-size:12px; color:var(--color-500); margin-top:2px; }
    .templates-list { padding:8px; display:flex; flex-direction:column; gap:2px; }
    .template-item { display:flex; gap:10px; align-items:flex-start; padding:8px 10px; border-radius:6px; cursor:pointer; }
    .template-item:hover { background:var(--color-50); }
    .template-icon { font-size:18px; flex-shrink:0; }
    .template-title { font-weight:500; font-size:12px; }
    .template-body { font-size:11px; }
    .history-list { padding:8px; display:flex; flex-direction:column; gap:2px; }
    .history-item { display:flex; justify-content:space-between; align-items:center; padding:8px 10px; }
    .history-title { font-size:12px; font-weight:500; }
    .no-data { padding:16px; text-align:center; font-size:13px; }
    .notif-grid { grid-template-columns: 1fr 1fr; }
    @media (max-width:768px) { .page { padding: 12px; } .notif-grid { grid-template-columns: 1fr; } }
  `]
})
export class NotificationsComponent {
  sending = false;
  sent: any[] = [];

  form = { audience: 'all_customers', targetId: '', title: '', body: '', deepLink: '', imageUrl: '' };

  templates = [
    { icon: '🎉', title: 'New Offer!', body: 'Get 20% off on your next order. Use code SAVE20.' },
    { icon: '🚀', title: 'New Restaurant', body: 'Explore a new restaurant in your area — check it out now!' },
    { icon: '⏰', title: 'Limited Time Deal', body: 'Flash deal ending soon. Order now and save big!' },
    { icon: '🙏', title: 'Thank You', body: 'Thanks for using YumDude! Your support means the world to us.' },
    { icon: '⭐', title: 'Rate Your Order', body: 'How was your last order? Tap to leave a review!' },
  ];

  constructor(private api: ApiService) {}

  applyTemplate(t: any): void { this.form.title = t.title; this.form.body = t.body; }

  send(): void {
    if (!this.form.title || !this.form.body) return;
    this.sending = true;
    this.api.sendNotification(this.form).subscribe({
      next: () => {
        this.sent.unshift({ ...this.form, sentAt: new Date().toISOString() });
        this.sending = false;
        this.form = { audience: 'all_customers', targetId: '', title: '', body: '', deepLink: '', imageUrl: '' };
      },
      error: () => { this.sending = false; }
    });
  }
}
