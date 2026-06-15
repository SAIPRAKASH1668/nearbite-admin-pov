import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl, SafeStyle } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';

type DailyDealContentType = 'image' | 'html' | 'video';

interface DailyDealSlide {
  id: string;
  title: string;
  subtitle: string;
  contentType: DailyDealContentType;
  imageUrl: string;
  imageAlt: string;
  chipText: string;
  eyebrow: string;
  headline: string;
  description: string;
  statOneValue: string;
  statOneLabel: string;
  statTwoValue: string;
  statTwoLabel: string;
  videoUrl: string;
  html: string;
  ctaLabel: string;
  ctaAction: string;
}

interface DailyDealPopup {
  id: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  slides: DailyDealSlide[];
}

@Component({
  selector: 'app-daily-deal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Daily Deal Popup</div>
      <div class="page-subtitle">{{ popup.slides.length }} slide{{ popup.slides.length !== 1 ? 's' : '' }} configured for the customer mobile popup</div>
    </div>
    <div class="header-actions">
      <button class="btn btn-secondary btn-sm" (click)="load()">&#8635; Refresh</button>
      <button class="btn btn-secondary btn-sm" (click)="resetDraft()">Reset Draft</button>
    </div>
  </div>

  <div *ngIf="loading" class="editor-grid">
    <div class="panel skeleton-panel">
      <div class="skeleton" style="height:18px;width:42%;margin-bottom:16px"></div>
      <div class="skeleton" style="height:44px;margin-bottom:12px"></div>
      <div class="skeleton" style="height:180px"></div>
    </div>
    <div class="panel skeleton-panel">
      <div class="skeleton" style="height:320px;border-radius:18px"></div>
    </div>
  </div>

  <div *ngIf="!loading" class="editor-grid">
    <section class="panel">
      <div class="section-head">
        <div>
          <h2>Popup Settings</h2>
          <p>The popup is configurable from here. No deal content is hardcoded in the mobile app.</p>
        </div>
        <label class="toggle-label">
          <div class="toggle">
            <input type="checkbox" [(ngModel)]="popup.isActive" />
            <span class="toggle-track"></span>
          </div>
          <span class="toggle-text">{{ popup.isActive ? 'Active' : 'Inactive' }}</span>
        </label>
      </div>

      <div class="form-row-3">
        <div class="form-group">
          <label>Popup ID <span class="field-hint">(change to refresh app cache)</span></label>
          <input class="form-input" [(ngModel)]="popup.id" placeholder="daily-deal-2026-06-15" />
        </div>
        <div class="form-group">
          <label>Start Date</label>
          <input class="form-input" type="date" [(ngModel)]="popup.startDate" />
        </div>
        <div class="form-group">
          <label>End Date</label>
          <input class="form-input" type="date" [(ngModel)]="popup.endDate" />
        </div>
      </div>

      <div class="slides-head">
        <div>
          <h2>Carousel Slides</h2>
          <p>Each slide can have its own HTML/media, CTA label, and CTA action.</p>
        </div>
        <button class="btn btn-primary btn-sm" (click)="addSlide()">+ Add Slide</button>
      </div>

      <div class="slide-tabs" *ngIf="popup.slides.length > 1">
        <button
          type="button"
          *ngFor="let slide of popup.slides; let i = index"
          class="slide-tab"
          [class.active]="i === activeSlideIndex"
          (click)="activeSlideIndex = i"
        >
          {{ i + 1 }}
        </button>
      </div>

      <div class="slide-card" *ngFor="let slide of popup.slides; let i = index" [class.selected]="i === activeSlideIndex">
        <div class="slide-card-head">
          <div>
            <div class="slide-title">Slide {{ i + 1 }}</div>
            <div class="slide-subtitle">{{ slide.contentType | uppercase }} · {{ slide.ctaLabel || 'No CTA' }}</div>
          </div>
          <div class="slide-actions">
            <button class="btn btn-secondary btn-xs" (click)="duplicateSlide(i)">Duplicate</button>
            <button class="btn btn-danger btn-xs" (click)="removeSlide(i)" [disabled]="popup.slides.length <= 1">Remove</button>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label>Slide ID</label>
            <input class="form-input" [(ngModel)]="slide.id" placeholder="slide-1" />
          </div>
          <div class="form-group">
            <label>Content Type</label>
            <select class="form-input" [(ngModel)]="slide.contentType" (ngModelChange)="activeSlideIndex = i">
              <option value="html">HTML</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label>Title <span class="field-hint">(native text above media)</span></label>
            <input class="form-input" [(ngModel)]="slide.title" placeholder="New Today" />
          </div>
          <div class="form-group">
            <label>Subtitle</label>
            <input class="form-input" [(ngModel)]="slide.subtitle" placeholder="Short supporting text" />
          </div>
        </div>

        <div class="form-group" *ngIf="slide.contentType === 'html'">
          <label>HTML Content</label>
          <textarea
            class="form-input html-input"
            [(ngModel)]="slide.html"
            (focus)="activeSlideIndex = i"
            placeholder="<div>Paste mobile-first HTML here</div>"
          ></textarea>
          <div class="field-help">Use Poppins in your CSS. The customer app wrapper also requests Poppins and constrains media to mobile width.</div>
        </div>

        <div class="image-card-fields" *ngIf="slide.contentType === 'image'">
          <div class="field-help image-card-help">Styled image cards use fixed mobile-safe YumDude styles. Admin only edits content fields.</div>
          <div class="form-row-2">
            <div class="form-group">
              <label>Image URL</label>
              <input class="form-input" [(ngModel)]="slide.imageUrl" (focus)="activeSlideIndex = i" placeholder="https://cdn.yumdude.com/deals/today.jpg" />
            </div>
            <div class="form-group">
              <label>Image Alt Text</label>
              <input class="form-input" [(ngModel)]="slide.imageAlt" (focus)="activeSlideIndex = i" placeholder="Biryani bowl deal" />
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label>Chip Text</label>
              <input class="form-input" [(ngModel)]="slide.chipText" (focus)="activeSlideIndex = i" maxlength="24" placeholder="Today only" />
            </div>
            <div class="form-group">
              <label>Description Header</label>
              <input class="form-input" [(ngModel)]="slide.eyebrow" (focus)="activeSlideIndex = i" maxlength="28" placeholder="New Today" />
            </div>
          </div>
          <div class="form-group">
            <label>Description Title</label>
            <input class="form-input" [(ngModel)]="slide.headline" (focus)="activeSlideIndex = i" maxlength="58" placeholder="Flat 50% off on biryani cravings" />
          </div>
          <div class="form-group">
            <label>Description Content</label>
            <textarea class="form-input description-input" [(ngModel)]="slide.description" (focus)="activeSlideIndex = i" maxlength="150" placeholder="Open the deal, pick your favourite restaurant, and order before the offer disappears tonight."></textarea>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label>Stat 1 Value</label>
              <input class="form-input" [(ngModel)]="slide.statOneValue" (focus)="activeSlideIndex = i" maxlength="14" placeholder="50%" />
            </div>
            <div class="form-group">
              <label>Stat 1 Label</label>
              <input class="form-input" [(ngModel)]="slide.statOneLabel" (focus)="activeSlideIndex = i" maxlength="24" placeholder="maximum offer" />
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label>Stat 2 Value</label>
              <input class="form-input" [(ngModel)]="slide.statTwoValue" (focus)="activeSlideIndex = i" maxlength="14" placeholder="Today" />
            </div>
            <div class="form-group">
              <label>Stat 2 Label</label>
              <input class="form-input" [(ngModel)]="slide.statTwoLabel" (focus)="activeSlideIndex = i" maxlength="24" placeholder="limited window" />
            </div>
          </div>
        </div>

        <div class="form-group" *ngIf="slide.contentType === 'video'">
          <label>Video URL</label>
          <input class="form-input" [(ngModel)]="slide.videoUrl" (focus)="activeSlideIndex = i" placeholder="https://cdn.yumdude.com/deals/today.mp4 or https://youtu.be/..." />
          <div class="field-help">Direct MP4 URLs use the video player. YouTube watch, Shorts, and share links are embedded in the customer app.</div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label>CTA Label</label>
            <input class="form-input" [(ngModel)]="slide.ctaLabel" placeholder="Grab this deal" />
          </div>
          <div class="form-group">
            <label>CTA Action <span class="field-hint">(app route or URL)</span></label>
            <input class="form-input" [(ngModel)]="slide.ctaAction" placeholder="/search or /restaurant/RES-xxx" />
          </div>
        </div>
      </div>

      <div class="save-row">
        <div>
          <div *ngIf="saveError" class="alert-error">&#x2715; {{ saveError }}</div>
          <div *ngIf="saveSuccess" class="alert-success">&#10003; Daily deal saved</div>
        </div>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving">
          {{ saving ? 'Saving...' : 'Save Daily Deal' }}
        </button>
      </div>
    </section>

    <aside class="panel preview-panel">
      <div class="section-head compact">
        <div>
          <h2>Mobile Preview</h2>
          <p>{{ statusLabel }}</p>
        </div>
      </div>

      <div class="phone-preview">
        <div class="popup-card">
          <button class="close-dot" type="button">x</button>
          <h3 *ngIf="activeSlide.title">{{ activeSlide.title }}</h3>
          <p class="subtitle" *ngIf="activeSlide.subtitle">{{ activeSlide.subtitle }}</p>

          <div class="media-box">
            <div *ngIf="activeSlide.contentType === 'image'" class="image-card-preview">
              <div class="image-card-hero" [style.backgroundImage]="bgStyle(activeSlide.imageUrl)">
                <span *ngIf="!activeSlide.imageUrl" class="image-placeholder">Image preview</span>
                <span *ngIf="activeSlide.chipText" class="image-card-chip">{{ activeSlide.chipText }}</span>
              </div>
              <div class="image-card-body">
                <p *ngIf="activeSlide.eyebrow" class="image-card-eyebrow">{{ activeSlide.eyebrow }}</p>
                <h4>{{ activeSlide.headline || activeSlide.title || 'Fresh deal waiting for you' }}</h4>
                <p *ngIf="activeSlide.description" class="image-card-description">{{ activeSlide.description }}</p>
                <div class="image-card-stats" *ngIf="hasStats(activeSlide)">
                  <div class="image-card-stat" *ngIf="activeSlide.statOneValue || activeSlide.statOneLabel">
                    <strong *ngIf="activeSlide.statOneValue">{{ activeSlide.statOneValue }}</strong>
                    <span *ngIf="activeSlide.statOneLabel">{{ activeSlide.statOneLabel }}</span>
                  </div>
                  <div class="image-card-stat" *ngIf="activeSlide.statTwoValue || activeSlide.statTwoLabel">
                    <strong *ngIf="activeSlide.statTwoValue">{{ activeSlide.statTwoValue }}</strong>
                    <span *ngIf="activeSlide.statTwoLabel">{{ activeSlide.statTwoLabel }}</span>
                  </div>
                </div>
              </div>
            </div>

            <iframe *ngIf="activeSlide.contentType === 'video' && getYouTubeEmbedUrl(activeSlide.videoUrl)" class="video-preview" [src]="safeResourceUrl(getYouTubeEmbedUrl(activeSlide.videoUrl))" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
            <video *ngIf="activeSlide.contentType === 'video' && activeSlide.videoUrl && !getYouTubeEmbedUrl(activeSlide.videoUrl)" class="video-preview" [src]="activeSlide.videoUrl" controls></video>
            <div *ngIf="activeSlide.contentType === 'video' && !activeSlide.videoUrl" class="empty-media">Video preview</div>

            <div *ngIf="activeSlide.contentType === 'html'" class="html-preview" [innerHTML]="activeSlide.html || emptyHtml"></div>
          </div>

          <div class="preview-dots" *ngIf="popup.slides.length > 1">
            <span *ngFor="let slide of popup.slides; let i = index" [class.active]="i === activeSlideIndex"></span>
          </div>

          <button *ngIf="activeSlide.ctaLabel" class="cta-preview" type="button">{{ activeSlide.ctaLabel }}</button>
        </div>
      </div>

      <div class="payload-box">
        <div class="payload-title">Saved payload</div>
        <pre>{{ payloadPreview }}</pre>
      </div>
    </aside>
  </div>
</div>
  `,
  styles: [`
    .page { padding: 12px; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .editor-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
    .panel { background: #161616; border: 1px solid #252525; border-radius: 14px; padding: 16px; }
    .section-head, .slides-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
    .section-head.compact { margin-bottom: 12px; }
    .section-head h2, .slides-head h2 { margin: 0 0 4px; font-size: 17px; color: #f5f5f5; }
    .section-head p, .slides-head p { margin: 0; font-size: 12px; color: #777; line-height: 1.4; }
    .form-row-2, .form-row-3 { display: grid; grid-template-columns: 1fr; gap: 10px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
    .form-group label { font-size: 12px; font-weight: 700; color: #bbb; }
    .field-hint { font-size: 10px; color: #666; font-weight: 400; }
    .field-help { font-size: 11px; color: #777; line-height: 1.4; }
    .html-input { min-height: 180px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; line-height: 1.45; }
    .description-input { min-height: 76px; line-height: 1.45; resize: vertical; }
    .image-card-fields { border: 1px solid #292929; background: #101010; border-radius: 12px; padding: 12px; margin-bottom: 10px; }
    .image-card-help { margin-bottom: 10px; }

    .toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; flex-shrink: 0; }
    .toggle { position: relative; display: inline-block; width: 38px; height: 22px; flex-shrink: 0; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .toggle-track { position: absolute; inset: 0; background: #2a2a2a; border: 1px solid #333; border-radius: 22px; cursor: pointer; transition: .2s; }
    .toggle input:checked + .toggle-track { background: #22c55e; border-color: #22c55e; }
    .toggle-track:before { content: ''; position: absolute; width: 16px; height: 16px; left: 2px; top: 2px; background: #fff; border-radius: 50%; transition: .2s; }
    .toggle input:checked + .toggle-track:before { transform: translateX(16px); }
    .toggle-text { font-size: 13px; color: #aaa; }

    .slide-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin: -4px 0 12px; }
    .slide-tab { width: 30px; height: 30px; border-radius: 15px; border: 1px solid #333; background: #202020; color: #aaa; font-weight: 800; cursor: pointer; }
    .slide-tab.active { background: #fff; color: #111; border-color: #fff; }
    .slide-card { border: 1px solid #292929; background: #121212; border-radius: 13px; padding: 14px; margin-bottom: 12px; }
    .slide-card.selected { border-color: #555; }
    .slide-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    .slide-title { color: #f5f5f5; font-size: 14px; font-weight: 800; }
    .slide-subtitle { color: #777; font-size: 11px; margin-top: 3px; }
    .slide-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }

    .save-row { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
    .alert-success { padding: 10px 14px; background: rgba(34,197,94,.12); border: 1px solid rgba(34,197,94,.3); border-radius: 8px; font-size: 12px; color: #4ade80; }
    .alert-error { padding: 10px 14px; background: rgba(239,68,68,.12); border: 1px solid rgba(239,68,68,.3); border-radius: 8px; font-size: 12px; color: #f87171; }

    .preview-panel { align-self: start; }
    .phone-preview { max-width: 390px; margin: 0 auto; background: #0d0d0d; border: 1px solid #262626; border-radius: 26px; padding: 18px; }
    .popup-card { position: relative; background: #fff; border-radius: 20px; padding: 16px; color: #231f20; box-shadow: 0 18px 40px rgba(0,0,0,.35); }
    .close-dot { position: absolute; top: 10px; right: 10px; width: 30px; height: 30px; border-radius: 15px; border: 0; background: rgba(255,255,255,.92); color: #222; font-weight: 700; }
    .popup-card h3 { margin: 0 36px 4px 0; font-size: 19px; line-height: 1.25; }
    .subtitle { margin: 0 36px 12px 0; color: #6d6257; font-size: 12px; line-height: 1.45; }
    .media-box { min-height: 250px; border-radius: 16px; overflow: auto; background: #f5f0e8; }
    .image-card-preview { min-height: 250px; padding: 0; background: #fff; color: #231f20; }
    .image-card-hero { position: relative; min-height: 210px; border-radius: 16px; overflow: hidden; background-size: cover; background-position: center; background-color: #fff0c7; background-image: linear-gradient(145deg, #fff0c7 0%, #ffae54 52%, #ef332b 100%); display: flex; align-items: center; justify-content: center; }
    .image-placeholder { color: #8a8175; font-size: 13px; }
    .image-card-chip { position: absolute; left: 12px; top: 12px; padding: 7px 10px; border-radius: 999px; background: #ef332b; color: #fff; font-size: 12px; line-height: 1.1; font-weight: 600; }
    .image-card-body { padding-top: 10px; }
    .image-card-eyebrow { margin: 0 0 6px; color: #ef332b; font-size: 12px; line-height: 1.2; font-weight: 600; text-transform: uppercase; letter-spacing: .6px; }
    .image-card-body h4 { margin: 0; color: #231f20; font-size: 23px; line-height: 1.08; font-weight: 600; letter-spacing: -0.2px; }
    .image-card-description { margin: 8px 0 0; color: #665d55; font-size: 14px; line-height: 1.48; font-weight: 400; }
    .image-card-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
    .image-card-stat { padding: 10px; border-radius: 13px; background: #fff7ed; border: 1px solid #f5dfc4; }
    .image-card-stat strong { display: block; color: #231f20; font-size: 17px; line-height: 1; font-weight: 600; }
    .image-card-stat span { display: block; margin-top: 4px; color: #887a6c; font-size: 11px; line-height: 1.2; font-weight: 500; }
    .video-preview { display: block; width: 100%; height: 260px; background: #000; object-fit: contain; }
    .empty-media { height: 260px; display: flex; align-items: center; justify-content: center; color: #8a8175; font-size: 13px; }
    .html-preview { min-height: 250px; max-height: 330px; overflow: auto; padding: 12px; color: #231f20; background: #fff; font-family: Poppins, system-ui, sans-serif; }
    .html-preview :where(*) { font-family: Poppins, system-ui, sans-serif; }
    .html-preview :where(img, video) { max-width: 100%; height: auto; border-radius: 12px; }
    .preview-dots { margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 7px; }
    .preview-dots span { width: 6px; height: 6px; border-radius: 3px; background: #c8beb2; }
    .preview-dots span.active { width: 18px; background: #e8352a; }
    .cta-preview { width: 100%; height: 46px; margin-top: 14px; border: 0; border-radius: 14px; background: #e8352a; color: #fff; font-weight: 800; }
    .payload-box { margin-top: 14px; background: #101010; border: 1px solid #242424; border-radius: 12px; overflow: hidden; }
    .payload-title { padding: 10px 12px; border-bottom: 1px solid #242424; color: #aaa; font-size: 12px; font-weight: 700; }
    pre { margin: 0; padding: 12px; max-height: 220px; overflow: auto; color: #ccc; font-size: 11px; line-height: 1.45; white-space: pre-wrap; }

    @media (min-width: 900px) {
      .page { padding: 24px; }
      .editor-grid { grid-template-columns: minmax(0, 1.35fr) minmax(340px, .65fr); gap: 18px; }
      .form-row-2 { grid-template-columns: 1fr 1fr; }
      .form-row-3 { grid-template-columns: 1.2fr .8fr .8fr; }
      .save-row { flex-direction: row; align-items: center; justify-content: space-between; }
    }
  `]
})
export class DailyDealComponent implements OnInit {
  popup: DailyDealPopup = this.createDefaultPopup();
  activeSlideIndex = 0;
  loading = true;
  saving = false;
  saveSuccess = false;
  saveError = '';
  readonly emptyHtml = '<div style="height:220px;display:flex;align-items:center;justify-content:center;color:#8a8175;font-family:Poppins,system-ui,sans-serif;">HTML preview</div>';

  constructor(private api: ApiService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.load();
  }

  get activeSlide(): DailyDealSlide {
    return this.popup.slides[this.activeSlideIndex] || this.popup.slides[0] || this.createDefaultSlide(0);
  }

  get statusLabel(): string {
    if (!this.popup.isActive) return 'Disabled in customer app';
    if (this.popup.startDate || this.popup.endDate) {
      return `Active from ${this.popup.startDate || 'now'} to ${this.popup.endDate || 'no end date'}`;
    }
    return 'Active with no date window';
  }

  get payloadPreview(): string {
    return JSON.stringify(this.buildPayload(), null, 2);
  }

  bgStyle(url: string): SafeStyle {
    if (!url) return '';
    return this.sanitizer.bypassSecurityTrustStyle(`url('${url}')`);
  }

  safeResourceUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getYouTubeEmbedUrl(url?: string): string {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
      let videoId = '';

      if (host === 'youtu.be') {
        videoId = parsed.pathname.split('/').filter(Boolean)[0] || '';
      } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
        if (parsed.pathname.startsWith('/shorts/')) {
          videoId = parsed.pathname.split('/').filter(Boolean)[1] || '';
        } else if (parsed.pathname.startsWith('/embed/')) {
          videoId = parsed.pathname.split('/').filter(Boolean)[1] || '';
        } else {
          videoId = parsed.searchParams.get('v') || '';
        }
      }

      if (!/^[A-Za-z0-9_-]{6,}$/.test(videoId)) return '';
      return `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1`;
    } catch {
      return '';
    }
  }

  hasStats(slide: DailyDealSlide): boolean {
    return Boolean(slide.statOneValue || slide.statOneLabel || slide.statTwoValue || slide.statTwoLabel);
  }

  load(): void {
    this.loading = true;
    this.saveError = '';
    this.saveSuccess = false;
    this.api.getDailyDealPopup().subscribe({
      next: (res: any) => {
        this.popup = this.normalizePopup(res?.popup);
        this.activeSlideIndex = 0;
        this.loading = false;
      },
      error: () => {
        this.popup = this.createDefaultPopup();
        this.activeSlideIndex = 0;
        this.loading = false;
      }
    });
  }

  resetDraft(): void {
    this.popup = this.createDefaultPopup();
    this.activeSlideIndex = 0;
    this.saveError = '';
    this.saveSuccess = false;
  }

  addSlide(): void {
    this.popup.slides.push(this.createDefaultSlide(this.popup.slides.length));
    this.activeSlideIndex = this.popup.slides.length - 1;
  }

  duplicateSlide(index: number): void {
    const copy = {
      ...this.popup.slides[index],
      id: `slide-${Date.now().toString(36).slice(-6)}`,
    };
    this.popup.slides.splice(index + 1, 0, copy);
    this.activeSlideIndex = index + 1;
  }

  removeSlide(index: number): void {
    if (this.popup.slides.length <= 1) return;
    if (!confirm('Remove this slide?')) return;
    this.popup.slides.splice(index, 1);
    this.activeSlideIndex = Math.max(0, Math.min(this.activeSlideIndex, this.popup.slides.length - 1));
  }

  save(): void {
    this.saving = true;
    this.saveError = '';
    this.saveSuccess = false;
    this.api.saveDailyDealPopup({ popup: this.buildPayload() }).subscribe({
      next: (res: any) => {
        this.popup = this.normalizePopup(res?.popup ?? this.buildPayload());
        this.activeSlideIndex = Math.min(this.activeSlideIndex, this.popup.slides.length - 1);
        this.saving = false;
        this.saveSuccess = true;
        setTimeout(() => this.saveSuccess = false, 4000);
      },
      error: (err: any) => {
        this.saving = false;
        this.saveError = err?.error?.error || 'Failed to save daily deal. Please try again.';
      }
    });
  }

  private createDefaultPopup(): DailyDealPopup {
    const today = this.todayKey();
    return {
      id: `daily-deal-${today}`,
      isActive: false,
      startDate: today,
      endDate: today,
      slides: [this.createDefaultSlide(0)],
    };
  }

  private createDefaultSlide(index: number): DailyDealSlide {
    return {
      id: `slide-${index + 1}`,
      title: index === 0 ? 'New Today' : '',
      subtitle: '',
      contentType: 'html',
      imageUrl: '',
      imageAlt: '',
      chipText: 'Today only',
      eyebrow: 'New Today',
      headline: 'Flat 50% off on biryani cravings',
      description: 'Open the deal, pick your favourite restaurant, and order before the offer disappears tonight.',
      statOneValue: '50%',
      statOneLabel: 'maximum offer',
      statTwoValue: 'Today',
      statTwoLabel: 'limited window',
      videoUrl: '',
      html: '',
      ctaLabel: index === 0 ? 'Grab this deal' : '',
      ctaAction: '',
    };
  }

  private normalizePopup(raw: any): DailyDealPopup {
    const fallback = this.createDefaultPopup();
    if (!raw || typeof raw !== 'object') return fallback;

    const rawSlides = Array.isArray(raw.slides) && raw.slides.length > 0
      ? raw.slides
      : [raw];

    const slides = rawSlides.map((slide: any, index: number) => this.normalizeSlide(slide, index));

    return {
      id: String(raw.id || fallback.id),
      isActive: raw.isActive !== false,
      startDate: String(raw.startDate || ''),
      endDate: String(raw.endDate || ''),
      slides: slides.length > 0 ? slides : fallback.slides,
    };
  }

  private normalizeSlide(raw: any, index: number): DailyDealSlide {
    const fallback = this.createDefaultSlide(index);
    if (!raw || typeof raw !== 'object') return fallback;
    const contentType = ['image', 'html', 'video'].includes(raw.contentType) ? raw.contentType : fallback.contentType;
    return {
      ...fallback,
      ...raw,
      id: String(raw.id || fallback.id),
      title: String(raw.title || ''),
      subtitle: String(raw.subtitle || ''),
      contentType,
      imageUrl: String(raw.imageUrl || ''),
      imageAlt: String(raw.imageAlt || ''),
      chipText: String(raw.chipText || fallback.chipText || ''),
      eyebrow: String(raw.eyebrow || fallback.eyebrow || ''),
      headline: String(raw.headline || fallback.headline || ''),
      description: String(raw.description || fallback.description || ''),
      statOneValue: String(raw.statOneValue || fallback.statOneValue || ''),
      statOneLabel: String(raw.statOneLabel || fallback.statOneLabel || ''),
      statTwoValue: String(raw.statTwoValue || fallback.statTwoValue || ''),
      statTwoLabel: String(raw.statTwoLabel || fallback.statTwoLabel || ''),
      videoUrl: String(raw.videoUrl || ''),
      html: String(raw.html || ''),
      ctaLabel: String(raw.ctaLabel || ''),
      ctaAction: String(raw.ctaAction || ''),
    };
  }

  private buildPayload(): any {
    const slides = this.popup.slides.map((slide, index): DailyDealSlide => {
      const cleaned: DailyDealSlide = {
        ...slide,
        id: (slide.id || `slide-${index + 1}`).trim(),
        title: slide.title.trim(),
        subtitle: slide.subtitle.trim(),
        imageUrl: slide.imageUrl.trim(),
        imageAlt: slide.imageAlt.trim(),
        chipText: slide.chipText.trim(),
        eyebrow: slide.eyebrow.trim(),
        headline: slide.headline.trim(),
        description: slide.description.trim(),
        statOneValue: slide.statOneValue.trim(),
        statOneLabel: slide.statOneLabel.trim(),
        statTwoValue: slide.statTwoValue.trim(),
        statTwoLabel: slide.statTwoLabel.trim(),
        videoUrl: slide.videoUrl.trim(),
        ctaLabel: slide.ctaLabel.trim(),
        ctaAction: slide.ctaAction.trim(),
      };
      if (cleaned.contentType !== 'image') {
        cleaned.imageUrl = '';
        cleaned.imageAlt = '';
        cleaned.chipText = '';
        cleaned.eyebrow = '';
        cleaned.headline = '';
        cleaned.description = '';
        cleaned.statOneValue = '';
        cleaned.statOneLabel = '';
        cleaned.statTwoValue = '';
        cleaned.statTwoLabel = '';
      }
      if (cleaned.contentType !== 'video') cleaned.videoUrl = '';
      if (cleaned.contentType !== 'html') cleaned.html = '';
      return cleaned;
    });
    const first = slides[0] || this.createDefaultSlide(0);
    return {
      id: this.popup.id.trim() || this.createDefaultPopup().id,
      isActive: this.popup.isActive,
      startDate: this.popup.startDate || '',
      endDate: this.popup.endDate || '',
      contentType: first.contentType,
      title: first.title,
      subtitle: first.subtitle,
      imageUrl: first.imageUrl,
      imageAlt: first.imageAlt,
      chipText: first.chipText,
      eyebrow: first.eyebrow,
      headline: first.headline,
      description: first.description,
      statOneValue: first.statOneValue,
      statOneLabel: first.statOneLabel,
      statTwoValue: first.statTwoValue,
      statTwoLabel: first.statTwoLabel,
      videoUrl: first.videoUrl,
      html: first.html,
      ctaLabel: first.ctaLabel,
      ctaAction: first.ctaAction,
      slides,
    };
  }

  private todayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
