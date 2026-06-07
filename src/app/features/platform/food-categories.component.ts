import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-food-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Food Categories</div>
      <div class="page-subtitle">Manage cuisine and food category tags shown in the app</div>
    </div>
    <div class="flex gap-sm">
      <button class="btn btn-secondary btn-sm" (click)="load()">&#8635; Refresh</button>
      <button class="btn btn-primary" (click)="showForm=!showForm">{{ showForm ? '✕ Cancel' : '+ Add Category' }}</button>
    </div>
  </div>

  <!-- Add Form -->
  <div *ngIf="showForm" class="card" style="margin-bottom:16px">
    <div class="card-header">New Category</div>
    <div class="card-body">
      <div class="form-row">
        <div class="form-group">
          <label>Category *</label>
          <input class="form-input" [(ngModel)]="form.category" placeholder="e.g. Indian" />
        </div>
        <div class="form-group">
          <label>Sub Category *</label>
          <input class="form-input" [(ngModel)]="form.subCategory" placeholder="e.g. Biryani" />
        </div>
        <div class="form-group">
          <label>Image URL *</label>
          <input class="form-input" [(ngModel)]="form.imageUrl" placeholder="https://..." />
        </div>
        <div class="form-group" style="justify-content:flex-end;align-items:flex-end">
          <button class="btn btn-primary" (click)="create()" [disabled]="creating">{{ creating ? 'Adding...' : 'Add Category' }}</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Grid -->
  <div *ngIf="loading" class="card" style="padding:24px">
    <div class="skeleton" style="height:60px;margin-bottom:8px" *ngFor="let i of [1,2,3,4]"></div>
  </div>

  <div *ngIf="!loading" class="categories-grid">
    <div class="cat-card" *ngFor="let c of categories">
      <div class="cat-img">
        <img *ngIf="c.imageUrl" [src]="c.imageUrl" [alt]="c.subCategory" style="width:44px;height:44px;object-fit:cover;border-radius:8px" />
        <span *ngIf="!c.imageUrl" style="font-size:24px">🍽</span>
      </div>
      <div class="cat-body">
        <div *ngIf="editingId !== catKey(c)">
          <div class="cat-name">{{ c.subCategory }}</div>
          <div class="text-secondary" style="font-size:11px">{{ c.category }}</div>
          <div class="text-secondary" style="font-size:11px">Display: {{ c.isDisplayItem === 'true' ? 'Yes' : 'No' }}</div>
        </div>
        <div *ngIf="editingId === catKey(c)" class="inline-edit">
          <input class="form-input form-input-sm" [(ngModel)]="editForm.imageUrl" placeholder="Image URL" style="width:150px" />
          <select class="form-input form-input-sm" [(ngModel)]="editForm.isDisplayItem" style="width:76px">
            <option value="true">Show</option>
            <option value="false">Hide</option>
          </select>
          <button class="btn btn-primary btn-xs" (click)="saveEdit(c)">Save</button>
          <button class="btn btn-ghost btn-xs" (click)="editingId=null">Cancel</button>
        </div>
      </div>
      <div class="cat-actions">
        <button class="btn btn-ghost btn-xs" (click)="startEdit(c)">✏</button>
        <button class="btn btn-danger btn-xs" (click)="deleteCategory(c)">✕</button>
      </div>
    </div>
  </div>

  <div *ngIf="!loading && categories.length===0" class="card" style="padding:40px;text-align:center;color:var(--color-400)">
    No categories yet. Add one above.
  </div>
</div>
  `,
  styles: [`
    .page { padding: 24px; }
    .card-header { font-weight:600; font-size:13px; padding:12px 14px; border-bottom:1px solid var(--color-border); }
    .card-body { padding:16px; }
    .categories-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:12px; }
    .cat-card { background:var(--color-white); border:1px solid var(--color-border); border-radius:10px; padding:14px; display:flex; align-items:center; gap:12px; }
    .cat-img { flex-shrink:0; width:44px; text-align:center; font-size:24px; }
    .cat-body { flex:1; min-width:0; overflow:hidden; }
    .cat-name { font-weight:600; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .cat-actions { display:flex; gap:4px; flex-shrink:0; }
    .inline-edit { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
    .form-input-sm { padding:4px 8px; font-size:12px; height:28px; }
    @media (max-width:768px) { .page { padding: 12px; } .categories-grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width:480px) { .categories-grid { grid-template-columns: 1fr; } }
  `]
})
export class FoodCategoriesComponent implements OnInit {
  categories: any[] = [];
  loading = true;
  showForm = false;
  creating = false;
  editingId: string | null = null;
  editForm: any = {};
  form = { category: '', subCategory: '', imageUrl: '' };

  constructor(private api: ApiService) {}
  ngOnInit(): void { this.load(); }

  catKey(c: any): string { return `${c.category}|${c.subCategory}`; }

  load(): void {
    this.loading = true;
    this.api.listFoodCategories().subscribe({
      next: (res: any) => {
        this.categories = Array.isArray(res) ? res : (res.items || res.categories || []);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  create(): void {
    if (!this.form.category || !this.form.subCategory || !this.form.imageUrl) return;
    this.creating = true;
    this.api.createFoodCategory(this.form).subscribe({
      next: () => {
        this.categories.unshift({ ...this.form, isDisplayItem: 'true' });
        this.showForm = false;
        this.form = { category: '', subCategory: '', imageUrl: '' };
        this.creating = false;
      },
      error: () => { this.creating = false; }
    });
  }

  startEdit(c: any): void {
    this.editingId = this.catKey(c);
    this.editForm = { imageUrl: c.imageUrl, isDisplayItem: c.isDisplayItem || 'true' };
  }

  saveEdit(c: any): void {
    this.api.updateFoodCategory(c.category, c.subCategory, this.editForm).subscribe({
      next: () => { Object.assign(c, this.editForm); this.editingId = null; }
    });
  }

  deleteCategory(c: any): void {
    if (!confirm(`Delete "${c.category} > ${c.subCategory}"?`)) return;
    this.api.deleteFoodCategory(c.category, c.subCategory).subscribe({
      next: () => { this.categories = this.categories.filter(x => x !== c); }
    });
  }
}
