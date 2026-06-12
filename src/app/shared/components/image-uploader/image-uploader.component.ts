import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

/**
 * Reusable image uploader: file-pick / drag-drop -> base64 -> POST /images/upload
 * -> append returned CDN URLs. Two-way bind `urls`.
 *
 * For entity='ITEM' an `itemId` is required (create the item first, then upload);
 * if it's missing the zone is disabled with a hint.
 */
@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="uploader">
  <label class="uploader-label" *ngIf="label">{{ label }} <span class="muted">({{ urls.length }}/{{ max }})</span></label>

  <div class="thumb-grid" *ngIf="urls.length">
    <div class="thumb" *ngFor="let u of urls; let i = index">
      <img [src]="u" alt="" />
      <button type="button" class="thumb-x" (click)="remove(i)" title="Remove">&#x2715;</button>
    </div>
  </div>

  <div class="dropzone"
       [class.disabled]="!canUpload"
       (click)="pick(fileInput)"
       (drop)="onDrop($event)" (dragover)="onDragOver($event)">
    <input #fileInput type="file" accept="image/*" multiple hidden (change)="onFiles($event)" />
    <div *ngIf="uploading" class="dz-text">Uploading…</div>
    <div *ngIf="!uploading && canUpload" class="dz-text">＋ Drop images or click to upload</div>
    <div *ngIf="!uploading && !canUpload && entity === 'ITEM' && !itemId" class="dz-text muted">Save the item first to add photos</div>
    <div *ngIf="!uploading && !canUpload && urls.length >= max" class="dz-text muted">Maximum {{ max }} photos</div>
  </div>

  <div *ngIf="error" class="dz-error">{{ error }}</div>
</div>
  `,
  styles: [`
    .uploader { display:block; }
    .uploader-label { display:block; font-size:12px; margin-bottom:6px; color:var(--color-300, #aaa); }
    .muted { color:#666; font-weight:400; }
    .thumb-grid { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:8px; }
    .thumb { position:relative; width:72px; height:72px; border-radius:8px; overflow:hidden; border:1px solid #2a2a2a; }
    .thumb img { width:100%; height:100%; object-fit:cover; display:block; }
    .thumb-x { position:absolute; top:2px; right:2px; width:20px; height:20px; border:none; border-radius:50%;
      background:rgba(0,0,0,.7); color:#fff; cursor:pointer; font-size:11px; line-height:1; display:flex; align-items:center; justify-content:center; }
    .dropzone { border:1px dashed #333; border-radius:10px; padding:16px; text-align:center; cursor:pointer; transition:border-color .15s; }
    .dropzone:hover:not(.disabled) { border-color:#555; }
    .dropzone.disabled { cursor:not-allowed; opacity:.6; }
    .dz-text { font-size:12px; color:#888; }
    .dz-error { color:#f87171; font-size:12px; margin-top:6px; }
  `]
})
export class ImageUploaderComponent {
  @Input() entity: 'RESTAURANT' | 'ITEM' = 'RESTAURANT';
  @Input() restaurantId = '';
  @Input() itemId?: string;
  @Input() urls: string[] = [];
  @Output() urlsChange = new EventEmitter<string[]>();
  @Input() label = 'Photos';
  @Input() max = 6;

  uploading = false;
  error = '';

  constructor(private api: ApiService) {}

  get canUpload(): boolean {
    if (this.uploading) return false;
    if (!this.restaurantId) return false;
    if (this.entity === 'ITEM' && !this.itemId) return false;
    return (this.urls?.length || 0) < this.max;
  }

  onFiles(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (files.length) this.upload(files);
    input.value = '';
  }

  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    const files = ev.dataTransfer?.files ? Array.from(ev.dataTransfer.files) : [];
    if (files.length) this.upload(files);
  }

  onDragOver(ev: DragEvent): void { ev.preventDefault(); }

  pick(input: HTMLInputElement): void { if (this.canUpload) input.click(); }

  remove(i: number): void {
    const next = (this.urls || []).filter((_, idx) => idx !== i);
    this.urls = next;
    this.urlsChange.emit(next);
  }

  private async upload(files: File[]): Promise<void> {
    if (!this.canUpload) {
      if (this.entity === 'ITEM' && !this.itemId) this.error = 'Save the item first, then add photos.';
      return;
    }
    this.error = '';
    const remaining = this.max - (this.urls?.length || 0);
    const slice = files.filter(f => f.type.startsWith('image/')).slice(0, Math.max(0, remaining));
    if (!slice.length) return;

    this.uploading = true;
    try {
      const listBase64 = await Promise.all(slice.map(f => this.toBase64(f)));
      const body: { listBase64: string[]; entity: 'RESTAURANT' | 'ITEM'; restaurantId: string; itemId?: string } = {
        listBase64, entity: this.entity, restaurantId: this.restaurantId,
      };
      if (this.entity === 'ITEM' && this.itemId) body.itemId = this.itemId;
      this.api.uploadImages(body).subscribe({
        next: (res: any) => {
          const newUrls = ((res && res.images) || []).map((im: any) => im.url).filter(Boolean);
          const merged = [...(this.urls || []), ...newUrls];
          this.urls = merged;
          this.urlsChange.emit(merged);
          this.uploading = false;
        },
        error: () => { this.error = 'Upload failed'; this.uploading = false; },
      });
    } catch {
      this.error = 'Could not read file';
      this.uploading = false;
    }
  }

  private toBase64(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
