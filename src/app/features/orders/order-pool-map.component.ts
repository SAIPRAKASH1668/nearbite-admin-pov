/**
 * Order Pooling Map — shows ALL in-progress orders on a single Google map so ops
 * can manually pool nearby orders.
 *
 * Each order gets a unique vibrant colour. Per order we plot up to 3 labelled
 * pins — R-<Restaurant Name>, C-<receiver phone>, D-<rider name> (rider only when
 * assigned) — connected by a route in the order's colour. Restaurant→Customer is a
 * road route (toggleable to straight lines); the rider is linked to its active
 * destination with a dashed connector.
 */
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, of, Subscription, interval } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

declare const google: any;

const GOOGLE_MAPS_API_KEY = 'AIzaSyCL5AHrcH6PHCA4Lh1poEOk2nUPpQLNTK0';
const GOOGLE_MAP_SCRIPT_ID = 'nearbite-admin-google-maps';

const LIVE_STATUSES = [
  'CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP',
  'AWAITING_RIDER_ASSIGNMENT', 'OFFERED_TO_RIDER', 'RIDER_ASSIGNED',
  'PICKED_UP', 'OUT_FOR_DELIVERY',
];
const POST_PICKUP = ['PICKED_UP', 'OUT_FOR_DELIVERY'];

interface Point { lat: number; lng: number; }

interface PoolOrder {
  orderId: string;
  status: string;
  color: string;
  restaurant: Point | null;
  customer: Point | null;
  rider: Point | null;
  restaurantName: string;
  receiverPhone: string;
  riderName: string;
}

@Component({
  selector: 'app-order-pool-map',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
  <div class="pool-page fade-in">
    <div class="page-header">
      <div>
        <div class="page-title">Order Pooling Map</div>
        <div class="page-subtitle">All in-progress orders on one map — pool nearby orders by hand</div>
      </div>
      <div class="header-tools">
        <span class="live-dot">LIVE</span>
        <input type="date" class="form-input date-input" [(ngModel)]="selectedDate" (change)="load()" />
        <label class="toggle"><input type="checkbox" [(ngModel)]="useRoadRoutes" (change)="render()" /> Road routes</label>
        <label class="toggle"><input type="checkbox" [(ngModel)]="autoRefresh" (change)="setupAutoRefresh()" /> Auto</label>
        <button class="btn btn-secondary btn-sm" (click)="load()" [disabled]="loading">{{ loading ? 'Loading…' : 'Refresh' }}</button>
      </div>
    </div>

    <div class="pool-kpis">
      <div class="kpi"><span>In progress</span><strong>{{ poolOrders.length }}</strong></div>
      <div class="kpi"><span>With rider</span><strong>{{ withRiderCount }}</strong></div>
      <div class="kpi"><span>Awaiting rider</span><strong>{{ poolOrders.length - withRiderCount }}</strong></div>
      <div class="kpi"><span>Updated</span><strong>{{ updatedLabel || '—' }}</strong></div>
    </div>

    <div class="pool-layout">
      <aside class="legend">
        <div class="legend-head">Orders ({{ poolOrders.length }})</div>
        <div class="legend-empty" *ngIf="!loading && poolOrders.length === 0">No in-progress orders for this date.</div>
        <div class="legend-item" *ngFor="let o of poolOrders" (click)="toggle(o)" [class.open]="expanded.has(o.orderId)" [title]="'Order ' + o.orderId">
          <span class="swatch" [style.background]="o.color"></span>
          <div class="legend-text" *ngIf="expanded.has(o.orderId)">
            <div class="legend-line"><strong>C</strong> #{{ last4(o.orderId) }}</div>
            <div class="legend-line"><strong>R</strong> {{ o.restaurantName || '—' }}</div>
            <div class="legend-line" *ngIf="o.receiverPhone"><strong>☎</strong> {{ o.receiverPhone }}</div>
            <div class="legend-line" *ngIf="o.riderName"><strong>D</strong> {{ o.riderName }}</div>
            <div class="legend-line muted" *ngIf="!o.rider">No rider yet</div>
            <span class="legend-status" [attr.data-post]="isPostPickup(o.status)">{{ o.status }}</span>
          </div>
        </div>
      </aside>

      <div class="map-wrap">
        <div #map class="map"></div>
        <div class="map-loading" *ngIf="mapLoading">Loading map…</div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .pool-page { padding: 16px 20px; display:flex; flex-direction:column; gap:14px; height:calc(100vh - 56px); box-sizing:border-box; }
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; }
    .page-title { font-size:20px; font-weight:800; }
    .page-subtitle { font-size:12px; color:var(--color-text-tertiary,#888); margin-top:2px; }
    .header-tools { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .date-input { max-width:160px; }
    .live-dot { font-size:10px; font-weight:800; letter-spacing:.08em; color:#fff; background:#e8352a; padding:3px 8px; border-radius:100px; }
    .toggle { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--color-text-secondary); cursor:pointer; }
    .toggle input { width:15px; height:15px; }
    .pool-kpis { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:12px; }
    .kpi { background:var(--color-bg-card,#fff); border:1px solid var(--color-border,#eee); border-radius:12px; padding:10px 14px; display:flex; flex-direction:column; gap:2px; }
    .kpi span { font-size:11px; color:var(--color-text-tertiary,#888); text-transform:uppercase; letter-spacing:.05em; }
    .kpi strong { font-size:18px; }
    .pool-layout { flex:1; min-height:0; display:grid; grid-template-columns:320px 1fr; gap:14px; }
    .legend { border:1px solid var(--color-border,#eee); border-radius:12px; background:var(--color-bg-card,#fff); overflow:auto; padding:8px; }
    .legend-head { font-size:12px; font-weight:700; padding:6px 8px; color:var(--color-text-secondary); position:sticky; top:0; background:inherit; }
    .legend-empty { padding:12px; font-size:12px; color:var(--color-text-tertiary,#888); }
    .legend-item { display:flex; gap:8px; align-items:flex-start; padding:8px; border-radius:8px; cursor:pointer; background:#fff; border:1px solid var(--color-border,#eee); margin-bottom:6px; }
    .legend-item:hover { border-color:#cbd5e1; }
    .legend-item.open { border-color:#94a3b8; box-shadow:0 1px 4px rgba(0,0,0,.06); }
    .swatch { width:14px; height:14px; border-radius:4px; flex:0 0 auto; margin-top:2px; border:1px solid rgba(0,0,0,.15); }
    .legend-text { flex:1; min-width:0; }
    .legend-line { font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .legend-line strong { display:inline-block; width:14px; color:var(--color-text-tertiary,#888); }
    .legend-line.muted { color:var(--color-text-tertiary,#aaa); font-style:italic; }
    .legend-status { font-size:9px; font-weight:700; padding:2px 6px; border-radius:100px; background:#eef; color:#556; height:fit-content; }
    .legend-status[data-post='true'] { background:#e7f8ee; color:#176b3a; }
    .map-wrap { position:relative; border-radius:12px; overflow:hidden; border:1px solid var(--color-border,#eee); }
    .map { position:absolute; inset:0; }
    .map-loading { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.6); font-size:13px; color:#666; }
    @media (max-width:860px) { .pool-layout { grid-template-columns:1fr; } .pool-kpis { grid-template-columns:1fr 1fr; } .map-wrap { min-height:60vh; } }
  `]
})
export class OrderPoolMapComponent implements OnInit, OnDestroy {
  @ViewChild('map', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  selectedDate = new Date().toISOString().slice(0, 10);
  poolOrders: PoolOrder[] = [];
  loading = false;
  mapLoading = false;
  updatedLabel = '';
  useRoadRoutes = true;
  autoRefresh = false;

  private gmap: any = null;
  private overlays: any[] = [];           // markers + polylines + renderers to clear on refresh
  private mapsPromise: Promise<any> | null = null;
  private refreshSub: Subscription | null = null;

  constructor(private api: ApiService) {}

  expanded = new Set<string>();

  get withRiderCount(): number { return this.poolOrders.filter(o => !!o.rider).length; }

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.refreshSub?.unsubscribe(); }

  isPostPickup(status: string): boolean { return POST_PICKUP.includes(status); }

  last4(orderId: string): string { const s = String(orderId || ''); return s.slice(-4) || s; }

  // Legend blocks stay blank (white) until clicked; clicking reveals their text + focuses the map.
  toggle(o: PoolOrder): void {
    if (this.expanded.has(o.orderId)) {
      this.expanded.delete(o.orderId);
    } else {
      this.expanded.add(o.orderId);
      this.focus(o);
    }
  }

  setupAutoRefresh(): void {
    this.refreshSub?.unsubscribe();
    this.refreshSub = null;
    if (this.autoRefresh) {
      this.refreshSub = interval(30000).subscribe(() => this.load());
    }
  }

  load(): void {
    this.loading = true;
    forkJoin({
      ordersRes: this.api.getOrdersByDateRange(this.selectedDate, this.selectedDate, undefined, 700)
        .pipe(catchError(() => of({ orders: [] }))),
      ridersRes: this.api.listRiders().pipe(catchError(() => of({ riders: [] }))),
    }).subscribe({
      next: ({ ordersRes, ridersRes }: any) => {
        const riderById = new Map((ridersRes.riders || []).map((r: any) => [r.riderId, r]));
        const live = (ordersRes.orders || []).filter((o: any) => LIVE_STATUSES.includes(o.status));
        this.poolOrders = live.map((order: any, i: number) => {
          const rider: any = order.riderId ? riderById.get(order.riderId) || null : null;
          return {
            orderId: order.orderId,
            status: order.status,
            color: this.colorForIndex(i),
            restaurant: this.pointFrom(order.pickupLat, order.pickupLng),
            customer: this.pointFrom(order.deliveryLat, order.deliveryLng),
            rider: this.pointFrom(order.riderCurrentLat ?? rider?.lat, order.riderCurrentLng ?? rider?.lng),
            restaurantName: order.restaurantName || order.restaurantId || '',
            receiverPhone: order.receiverPhone || order.customerPhone || '',
            riderName: order.riderName
              || (rider ? `${rider.firstName || ''} ${rider.lastName || ''}`.trim() : '')
              || (order.riderId ? String(order.riderId) : ''),
          } as PoolOrder;
        });
        this.updatedLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.loading = false;
        this.render();
      },
      error: () => { this.loading = false; },
    });
  }

  focus(o: PoolOrder): void {
    if (!this.gmap) return;
    const pts = [o.restaurant, o.customer, o.rider].filter(Boolean) as Point[];
    if (!pts.length) return;
    const bounds = new google.maps.LatLngBounds();
    pts.forEach(p => bounds.extend(new google.maps.LatLng(p.lat, p.lng)));
    this.gmap.fitBounds(bounds, 120);
  }

  render(): void {
    this.mapLoading = true;
    this.loadGoogleMaps().then(() => {
      if (!this.gmap) {
        this.gmap = new google.maps.Map(this.mapEl.nativeElement, {
          center: { lat: 17.385, lng: 78.4867 },
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
          styles: this.googleMapStyle(),
        });
      }
      this.clearOverlays();

      const bounds = new google.maps.LatLngBounds();
      let any = false;

      this.poolOrders.forEach((o, i) => {
        const r = o.restaurant, c = o.customer, d = o.rider;
        if (r) { this.addPin(r, `R-${o.restaurantName}`, o.color); bounds.extend(this.ll(r)); any = true; }
        if (c) { this.addPin(c, `C-${this.last4(o.orderId)}`, o.color); bounds.extend(this.ll(c)); any = true; }
        if (d) { this.addPin(d, `D-${o.riderName}`, o.color, true); bounds.extend(this.ll(d)); any = true; }

        // Restaurant -> Customer route (the delivery leg) in the order's colour.
        if (r && c) {
          if (this.useRoadRoutes) this.drawRoadRoute(r, c, o.color, i);
          else this.drawLine([r, c], o.color, false);
        }
        // Connect the rider to its active destination (restaurant pre-pickup, customer after).
        if (d) {
          const dest = POST_PICKUP.includes(o.status) ? (c || r) : (r || c);
          if (dest) this.drawLine([d, dest], o.color, true);
        }
      });

      if (any) this.gmap.fitBounds(bounds, 70);
      this.mapLoading = false;
    }).catch(() => { this.mapLoading = false; });
  }

  // ─── map helpers ──────────────────────────────────────────────────────────
  private ll(p: Point): any { return new google.maps.LatLng(p.lat, p.lng); }

  private addPin(p: Point, text: string, color: string, emphasize = false): void {
    const marker = new google.maps.Marker({
      map: this.gmap,
      position: this.ll(p),
      title: text,
      icon: this.pillIcon(text, color, emphasize),
      zIndex: emphasize ? 30 : 20,
    });
    this.overlays.push(marker);
  }

  private drawLine(path: Point[], color: string, dashed: boolean): void {
    const opts: any = {
      map: this.gmap,
      path: path.map(p => this.ll(p)),
      geodesic: true,
      strokeColor: color,
      strokeOpacity: dashed ? 0 : 0.9,
      strokeWeight: dashed ? 0 : 5,
      zIndex: 5,
    };
    if (dashed) {
      opts.icons = [{
        icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.9, strokeColor: color, scale: 3 },
        offset: '0', repeat: '12px',
      }];
    }
    this.overlays.push(new google.maps.Polyline(opts));
  }

  private drawRoadRoute(from: Point, to: Point, color: string, index: number): void {
    const renderer = new google.maps.DirectionsRenderer({
      map: this.gmap,
      suppressMarkers: true,
      preserveViewport: true,
      polylineOptions: { strokeColor: color, strokeOpacity: 0.92, strokeWeight: 5 },
    });
    this.overlays.push(renderer);
    // Stagger requests so a screenful of orders doesn't trip the rate limit.
    setTimeout(() => {
      const svc = new google.maps.DirectionsService();
      svc.route(
        { origin: this.ll(from), destination: this.ll(to), travelMode: google.maps.TravelMode.DRIVING },
        (result: any, status: string) => {
          if (status === 'OK' && result) {
            renderer.setDirections(result);
          } else {
            renderer.setMap(null);
            this.drawLine([from, to], color, false);  // fallback to a straight line
          }
        },
      );
    }, index * 120);
  }

  private clearOverlays(): void {
    this.overlays.forEach(o => o.setMap && o.setMap(null));
    this.overlays = [];
  }

  private pillIcon(text: string, color: string, emphasize: boolean): any {
    const label = text.length > 26 ? text.slice(0, 25) + '…' : text;
    const w = Math.max(34, Math.round(label.length * 7.2) + 18);
    const h = 24;
    const svg =
      `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>` +
      `<rect x='1.5' y='1.5' rx='11' ry='11' width='${w - 3}' height='${h - 3}' fill='${color}' stroke='#ffffff' stroke-width='${emphasize ? 3 : 2}'/>` +
      `<text x='${w / 2}' y='${h / 2}' fill='#ffffff' font-family='Arial, sans-serif' font-size='12' font-weight='700' text-anchor='middle' dominant-baseline='central'>` +
      this.escapeXml(label) + `</text></svg>`;
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(w, h),
      anchor: new google.maps.Point(w / 2, h / 2),
    };
  }

  private escapeXml(s: string): string {
    return s.replace(/[<>&'"]/g, ch => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[ch] as string));
  }

  private pointFrom(lat: any, lng: any): Point | null {
    const la = Number(lat), ln = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln) || (la === 0 && ln === 0)) return null;
    return { lat: la, lng: ln };
  }

  // Golden-angle hue spacing → maximally distinct vibrant colours.
  private colorForIndex(i: number): string {
    return this.hslToHex((i * 137.508) % 360, 80, 47);
  }

  private hslToHex(h: number, s: number, l: number): string {
    s /= 100; l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const c = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  private loadGoogleMaps(): Promise<any> {
    const win = window as any;
    if (win.google?.maps) return Promise.resolve(win.google);
    if (this.mapsPromise) return this.mapsPromise;
    this.mapsPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById(GOOGLE_MAP_SCRIPT_ID) as HTMLScriptElement | null;
      const cb = `nearbiteAdminMapsReady_${Date.now()}`;
      win[cb] = () => { delete win[cb]; resolve(win.google); };
      if (existing) {
        existing.addEventListener('load', () => resolve(win.google), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.id = GOOGLE_MAP_SCRIPT_ID;
      script.async = true; script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=${cb}`;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return this.mapsPromise;
  }

  private googleMapStyle(): any[] {
    return [
      { elementType: 'geometry', stylers: [{ color: '#f8f8f8' }] },
      { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#7f8792' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
      { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
      { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#d8dee6' }] },
      { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#d5e3ef' }] },
      { featureType: 'landscape', elementType: 'geometry.fill', stylers: [{ color: '#f1f4f6' }] },
    ];
  }
}
