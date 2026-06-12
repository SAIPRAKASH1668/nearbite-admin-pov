import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { RestaurantMenuManagerComponent } from './restaurant-menu-manager.component';

/**
 * "All Menus" — pick any restaurant, then manage its full menu via the shared
 * RestaurantMenuManagerComponent (same implementation as the Restaurant
 * Updates hub's Menu tab).
 */
@Component({
  selector: 'app-all-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, RestaurantMenuManagerComponent],
  template: `
<div class="page fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">All Menus</div>
      <div class="page-subtitle">Browse and manage menu items for any restaurant</div>
    </div>
  </div>

  <!-- Restaurant picker -->
  <div class="card search-card">
    <div class="search-grid">
      <div class="form-group" style="grid-column:1/-1">
        <label>Search restaurant</label>
        <div class="resto-search-wrap">
          <input class="form-input" [(ngModel)]="restoSearch" (input)="filterRestos()" placeholder="Type restaurant name..." autocomplete="off" />
          <div class="resto-dropdown" *ngIf="restoSuggestions.length">
            <div class="resto-option" *ngFor="let r of restoSuggestions" (click)="pickResto(r)">
              <strong>{{ r.name }}</strong><span class="resto-id">{{ r.restaurantId }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="form-group"><label>Restaurant ID</label><input class="form-input" [(ngModel)]="restaurantId" placeholder="RES-..." /></div>
      <div class="form-group load-btn-group">
        <button class="btn btn-primary btn-load" [disabled]="!restaurantId" (click)="activeId = restaurantId">Load menu</button>
      </div>
    </div>
  </div>

  <app-restaurant-menu-manager *ngIf="activeId" [restaurantId]="activeId" [restaurantName]="restoSearch"></app-restaurant-menu-manager>
</div>
  `,
  styles: [`
    .page { padding:12px; }
    .search-card { padding:16px; margin-bottom:16px; }
    .search-grid { display:grid; grid-template-columns:1fr; gap:10px; }
    .load-btn-group { display:flex; align-items:flex-end; }
    .btn-load { width:100%; height:42px; }
    .resto-search-wrap { position:relative; }
    .resto-dropdown { position:absolute; z-index:200; top:calc(100% + 4px); left:0; right:0; background:#1a1a1a; border:1px solid #333; border-radius:10px; overflow:hidden; max-height:220px; overflow-y:auto; box-shadow:0 8px 24px rgba(0,0,0,.5); }
    .resto-option { display:flex; align-items:center; justify-content:space-between; padding:11px 14px; cursor:pointer; gap:8px; border-bottom:1px solid #222; }
    .resto-option:last-child { border-bottom:none; }
    .resto-option:hover { background:#232323; }
    .resto-option strong { font-size:13px; color:#fff; }
    .resto-id { font-size:10px; color:#666; font-family:monospace; white-space:nowrap; }
    @media (min-width:768px) {
      .page { padding:24px; }
      .search-grid { grid-template-columns:1fr 1fr auto; }
      .load-btn-group { padding-top:20px; }
      .btn-load { width:auto; min-width:120px; }
    }
  `]
})
export class AllMenuComponent implements OnInit {
  restaurantId = '';
  activeId = '';
  restoSearch = '';
  allRestaurants: any[] = [];
  restoSuggestions: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.loadRestaurants(); }

  loadRestaurants(): void {
    this.api.listRestaurants().subscribe({
      next: (res: any) => { this.allRestaurants = res.restaurants ?? []; },
      error: () => {},
    });
  }

  filterRestos(): void {
    const q = this.restoSearch.trim().toLowerCase();
    this.restoSuggestions = q ? this.allRestaurants.filter(r => r.name?.toLowerCase().includes(q)).slice(0, 8) : [];
  }

  pickResto(r: any): void {
    this.restaurantId = r.restaurantId;
    this.restoSearch = r.name;
    this.restoSuggestions = [];
    this.activeId = r.restaurantId;
  }
}
