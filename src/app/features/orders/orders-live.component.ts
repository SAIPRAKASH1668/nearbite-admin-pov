import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DecimalPipe, SlicePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, interval, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

const LIVE_STATUSES = [
  'CONFIRMED',
  'ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'AWAITING_RIDER_ASSIGNMENT',
  'OFFERED_TO_RIDER',
  'RIDER_ASSIGNED',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
];

const DELIVERY_STATUSES = ['RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'];
const PRE_PICKUP_STATUSES = ['PREPARING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED'];
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 620;
const GOOGLE_MAPS_API_KEY = 'AIzaSyCL5AHrcH6PHCA4Lh1poEOk2nUPpQLNTK0';
const GOOGLE_MAP_SCRIPT_ID = 'nearbite-admin-google-maps';

type NavState = 'ON_ROUTE' | 'WATCH' | 'OFF_ROUTE' | 'WAITING';
type DistanceTrend = 'CLOSER' | 'AWAY' | 'UNCHANGED' | 'UNKNOWN';

interface Point {
  lat: number;
  lng: number;
}

interface MapPoint extends Point {
  x: number;
  y: number;
}

interface LiveTrip {
  order: any;
  rider: any | null;
  restaurant: Point | null;
  riderPoint: Point | null;
  customer: Point | null;
  activeDestination: Point | null;
  activeDestinationLabel: string;
  restaurantMap: MapPoint | null;
  riderMap: MapPoint | null;
  customerMap: MapPoint | null;
  routePath: string;
  progressPct: number;
  distanceRemainingKm: number | null;
  distanceFromRouteKm: number | null;
  riderLocationAgeMin: number | null;
  headingDeltaDeg: number | null;
  trend: DistanceTrend;
  navState: NavState;
  alerts: string[];
}

@Component({
  selector: 'app-orders-live',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SlicePipe, DecimalPipe],
  template: `
<div class="live-page fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Live Delivery Monitor</div>
      <div class="page-subtitle">Order, rider, and customer route visibility</div>
    </div>
    <div class="header-tools">
      <span class="live-dot">LIVE</span>
      <input type="date" class="form-input date-input" [(ngModel)]="selectedDate" />
      <button class="btn btn-secondary btn-sm" (click)="load()" [disabled]="loading">
        {{ loading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>
  </div>

  <div class="monitor-kpis">
    <div class="monitor-kpi">
      <span>Active</span>
      <strong>{{ trips.length }}</strong>
    </div>
    <div class="monitor-kpi on">
      <span>On Route</span>
      <strong>{{ countByNav('ON_ROUTE') }}</strong>
    </div>
    <div class="monitor-kpi watch">
      <span>Watch</span>
      <strong>{{ countByNav('WATCH') }}</strong>
    </div>
    <div class="monitor-kpi off">
      <span>Off Route</span>
      <strong>{{ countByNav('OFF_ROUTE') }}</strong>
    </div>
    <div class="monitor-kpi waiting">
      <span>Waiting</span>
      <strong>{{ countByNav('WAITING') }}</strong>
    </div>
  </div>

  <div class="monitor-layout">
    <aside class="trip-list">
      <div class="panel-heading">
        <div>
          <h3>Deliveries</h3>
          <span>{{ updatedLabel }}</span>
        </div>
        <select class="form-input filter-select" [(ngModel)]="routeFilter">
          <option value="ALL">All</option>
          <option value="ON_ROUTE">On Route</option>
          <option value="WATCH">Watch</option>
          <option value="OFF_ROUTE">Off Route</option>
          <option value="WAITING">Waiting</option>
        </select>
      </div>

      <button
        *ngFor="let trip of filteredTrips"
        class="trip-card"
        [class.selected]="selectedTrip?.order?.orderId === trip.order.orderId"
        [class.on]="trip.navState === 'ON_ROUTE'"
        [class.watch]="trip.navState === 'WATCH'"
        [class.off]="trip.navState === 'OFF_ROUTE'"
        [class.waiting]="trip.navState === 'WAITING'"
        (click)="selectTrip(trip)"
      >
        <div class="trip-card-top">
          <div>
            <div class="trip-id">{{ trip.order.orderId | slice:0:22 }}</div>
            <div class="trip-restaurant">{{ trip.order.restaurantName || trip.order.restaurantId }}</div>
          </div>
          <span class="route-chip" [ngClass]="trip.navState.toLowerCase()">{{ navLabel(trip.navState) }}</span>
        </div>

        <div class="mini-route">
          <span class="mini-node restaurant"></span>
          <span class="mini-line" [style.--progress]="trip.progressPct + '%'"></span>
          <span class="mini-node rider" [style.left.%]="trip.progressPct"></span>
          <span class="mini-node customer"></span>
        </div>

        <div class="trip-card-metrics">
          <span>{{ trip.order.status }}</span>
          <span *ngIf="trip.distanceRemainingKm !== null">{{ trip.distanceRemainingKm | number:'1.1-1' }} km left</span>
          <span *ngIf="trip.riderLocationAgeMin !== null">{{ trip.riderLocationAgeMin | number:'1.0-0' }} min GPS</span>
        </div>
      </button>

      <div class="empty-state compact" *ngIf="!loading && filteredTrips.length === 0">
        <h4>No matching deliveries</h4>
        <p>Try a different route state or date.</p>
      </div>
    </aside>

    <section class="map-panel">
      <div class="map-toolbar">
        <div>
          <h3>Route Map</h3>
          <span *ngIf="selectedTrip">{{ selectedTrip.order.status }} / {{ selectedTrip.order.restaurantName || selectedTrip.order.restaurantId }}</span>
          <span *ngIf="!selectedTrip">Select a delivery</span>
        </div>
        <a *ngIf="selectedTrip" class="btn btn-ghost btn-xs" [routerLink]="['/orders', selectedTrip.order.orderId]">Open Order</a>
      </div>

      <div class="route-map" *ngIf="selectedTrip as trip">
        <div #roadMap class="road-map"></div>
        <div class="map-loading" *ngIf="mapLoading">Updating road route...</div>

        <div class="map-empty" *ngIf="!trip.riderPoint || !trip.activeDestination">
          Map needs rider and destination coordinates.
        </div>
      </div>

      <div class="detail-grid" *ngIf="selectedTrip as trip">
        <div class="detail-card status" [ngClass]="trip.navState.toLowerCase()">
          <span>Rider Direction</span>
          <strong>{{ navLabel(trip.navState) }}</strong>
          <small>{{ directionText(trip) }}</small>
        </div>
        <div class="detail-card">
          <span>Remaining</span>
          <strong>{{ trip.distanceRemainingKm === null ? '-' : (trip.distanceRemainingKm | number:'1.1-1') + ' km' }}</strong>
          <small>To {{ trip.activeDestinationLabel }}</small>
        </div>
        <div class="detail-card">
          <span>Route Deviation</span>
          <strong>{{ trip.distanceFromRouteKm === null ? '-' : (trip.distanceFromRouteKm | number:'1.1-1') + ' km' }}</strong>
          <small>Direct-route proxy</small>
        </div>
        <div class="detail-card">
          <span>GPS Age</span>
          <strong>{{ trip.riderLocationAgeMin === null ? '-' : (trip.riderLocationAgeMin | number:'1.0-0') + ' min' }}</strong>
          <small>{{ gpsText(trip) }}</small>
        </div>
      </div>

      <div class="alerts" *ngIf="selectedTrip?.alerts?.length">
        <div class="alert-item" *ngFor="let alert of selectedTrip?.alerts">{{ alert }}</div>
      </div>
    </section>
  </div>

  <div *ngIf="loading" class="loading-strip">
    <div class="skeleton" *ngFor="let i of [1,2,3]"></div>
  </div>
</div>
  `,
  styles: [`
    .live-page {
      padding: 24px;
      color: var(--color-text-primary);
    }

    .page-header,
    .header-tools,
    .panel-heading,
    .map-toolbar,
    .trip-card-top,
    .trip-card-metrics {
      display: flex;
      align-items: center;
    }

    .page-header {
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }

    .header-tools {
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .date-input {
      width: 154px;
    }

    .live-dot {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 32px;
      padding: 0 10px;
      border-radius: 999px;
      background: rgba(239, 68, 68, 0.12);
      color: #ef4444;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.04em;
    }

    .live-dot::before {
      content: '';
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.12);
    }

    .monitor-kpis {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 14px;
    }

    .monitor-kpi {
      min-height: 72px;
      padding: 14px;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      background: var(--color-bg-secondary);
    }

    .monitor-kpi span,
    .detail-card span {
      display: block;
      color: var(--color-text-secondary);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .monitor-kpi strong {
      display: block;
      margin-top: 8px;
      font-size: 26px;
      line-height: 1;
    }

    .monitor-kpi.on { border-color: rgba(34, 197, 94, 0.36); }
    .monitor-kpi.watch { border-color: rgba(245, 158, 11, 0.42); }
    .monitor-kpi.off { border-color: rgba(239, 68, 68, 0.42); }
    .monitor-kpi.waiting { border-color: rgba(59, 130, 246, 0.34); }

    .monitor-layout {
      display: grid;
      grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
      gap: 14px;
      align-items: start;
    }

    .trip-list,
    .map-panel {
      border: 1px solid var(--color-border);
      border-radius: 8px;
      background: var(--color-bg-secondary);
    }

    .trip-list {
      padding: 12px;
      max-height: calc(100vh - 214px);
      overflow: auto;
    }

    .panel-heading,
    .map-toolbar {
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 12px;
    }

    .panel-heading h3,
    .map-toolbar h3 {
      margin: 0;
      font-size: 16px;
      line-height: 1.2;
    }

    .panel-heading span,
    .map-toolbar span {
      display: block;
      margin-top: 3px;
      color: var(--color-text-tertiary);
      font-size: 12px;
    }

    .filter-select {
      width: 118px;
      height: 34px;
      font-size: 12px;
    }

    .trip-card {
      width: 100%;
      display: block;
      margin-bottom: 10px;
      padding: 12px;
      text-align: left;
      border: 1px solid var(--color-border);
      border-left-width: 4px;
      border-radius: 8px;
      background: var(--color-bg-primary);
      color: inherit;
      cursor: pointer;
      transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
    }

    .trip-card:hover,
    .trip-card.selected {
      transform: translateY(-1px);
      background: var(--color-bg-hover);
      border-color: var(--color-primary);
    }

    .trip-card.on { border-left-color: #22c55e; }
    .trip-card.watch { border-left-color: #f59e0b; }
    .trip-card.off { border-left-color: #ef4444; }
    .trip-card.waiting { border-left-color: #3b82f6; }

    .trip-card-top {
      justify-content: space-between;
      gap: 8px;
    }

    .trip-id {
      color: var(--color-text-primary);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      font-weight: 800;
    }

    .trip-restaurant {
      margin-top: 4px;
      color: var(--color-text-secondary);
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 210px;
    }

    .route-chip {
      flex: 0 0 auto;
      padding: 5px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
    }

    .route-chip.on_route,
    .detail-card.status.on_route {
      background: rgba(34, 197, 94, 0.12);
      color: #16a34a;
    }

    .route-chip.watch,
    .detail-card.status.watch {
      background: rgba(245, 158, 11, 0.14);
      color: #b45309;
    }

    .route-chip.off_route,
    .detail-card.status.off_route {
      background: rgba(239, 68, 68, 0.12);
      color: #dc2626;
    }

    .route-chip.waiting,
    .detail-card.status.waiting {
      background: rgba(59, 130, 246, 0.12);
      color: #2563eb;
    }

    .mini-route {
      position: relative;
      height: 22px;
      margin: 14px 12px 8px;
    }

    .mini-line {
      position: absolute;
      left: 0;
      right: 0;
      top: 10px;
      height: 3px;
      border-radius: 99px;
      background:
        linear-gradient(90deg, #22c55e 0 var(--progress), rgba(148, 163, 184, 0.35) var(--progress) 100%);
    }

    .mini-node {
      position: absolute;
      top: 5px;
      width: 13px;
      height: 13px;
      border-radius: 50%;
      border: 2px solid var(--color-bg-primary);
      z-index: 1;
    }

    .mini-node.restaurant { left: 0; background: #f97316; }
    .mini-node.rider { background: #22c55e; transform: translateX(-50%); }
    .mini-node.customer { right: 0; background: #3b82f6; }

    .trip-card-metrics {
      justify-content: space-between;
      gap: 8px;
      color: var(--color-text-tertiary);
      font-size: 11px;
    }

    .map-panel {
      padding: 12px;
      min-width: 0;
    }

    .route-map {
      position: relative;
      width: 100%;
      aspect-ratio: 1000 / 620;
      overflow: hidden;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      background:
        linear-gradient(135deg, rgba(15, 23, 42, 0.04), rgba(15, 23, 42, 0.02)),
        var(--color-bg-primary);
    }

    .road-map {
      width: 100%;
      height: 100%;
      min-height: 320px;
    }

    .map-empty {
      position: absolute;
      inset: auto 14px 14px 14px;
      padding: 10px 12px;
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.82);
      color: white;
      font-size: 12px;
    }

    .map-loading {
      position: absolute;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      padding: 7px 12px;
      border: 1px solid rgba(148, 163, 184, 0.36);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.95);
      color: #334155;
      font-size: 12px;
      font-weight: 800;
      box-shadow: 0 10px 26px rgba(15, 23, 42, 0.12);
      z-index: 2;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      margin-top: 12px;
    }

    .detail-card {
      min-height: 86px;
      padding: 12px;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      background: var(--color-bg-primary);
    }

    .detail-card strong {
      display: block;
      margin-top: 8px;
      font-size: 20px;
      line-height: 1.1;
      color: var(--color-text-primary);
    }

    .detail-card small {
      display: block;
      margin-top: 6px;
      color: var(--color-text-tertiary);
      font-size: 12px;
      line-height: 1.3;
    }

    .alerts {
      display: grid;
      gap: 8px;
      margin-top: 12px;
    }

    .alert-item {
      padding: 10px 12px;
      border: 1px solid rgba(245, 158, 11, 0.35);
      border-radius: 8px;
      background: rgba(245, 158, 11, 0.1);
      color: #b45309;
      font-size: 12px;
      font-weight: 700;
    }

    .loading-strip {
      display: grid;
      gap: 8px;
      margin-top: 12px;
    }

    .loading-strip .skeleton {
      height: 42px;
      border-radius: 8px;
    }

    .empty-state.compact {
      padding: 24px 12px;
      text-align: center;
    }

    @media (max-width: 1080px) {
      .monitor-layout {
        grid-template-columns: 1fr;
      }

      .trip-list {
        max-height: none;
      }

      .detail-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 768px) {
      .live-page {
        padding: 12px;
      }

      .page-header {
        align-items: stretch;
        flex-direction: column;
      }

      .header-tools {
        justify-content: flex-start;
      }

      .monitor-kpis {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .monitor-kpi {
        min-height: 66px;
      }

      .monitor-kpi strong {
        font-size: 23px;
      }

      .detail-grid {
        grid-template-columns: 1fr;
      }

      .date-input {
        width: 100%;
      }
    }
  `],
})
export class OrdersLiveComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('roadMap') roadMap?: ElementRef<HTMLDivElement>;

  selectedDate = this.todayIST();
  loading = false;
  mapLoading = false;
  routeFilter: NavState | 'ALL' = 'ALL';
  updatedLabel = 'Not loaded';
  orders: any[] = [];
  riders: any[] = [];
  trips: LiveTrip[] = [];
  selectedTrip: LiveTrip | null = null;

  private previousDistances = new Map<string, number>();
  private refreshSub?: Subscription;
  private mapViewReady = false;
  private googleMap: any;
  private directionsRenderer: any;
  private roadPolyline: any;
  private mapMarkers: any[] = [];
  private mapsPromise?: Promise<any>;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
    this.refreshSub = interval(30000).subscribe(() => this.load(false));
  }

  ngAfterViewInit(): void {
    this.mapViewReady = true;
    this.renderRoadMap();
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
    this.clearRoadMap();
  }

  get filteredTrips(): LiveTrip[] {
    if (this.routeFilter === 'ALL') {
      return this.trips;
    }
    return this.trips.filter((trip) => trip.navState === this.routeFilter);
  }

  load(showLoading = true): void {
    if (!this.selectedDate) {
      return;
    }

    if (showLoading) {
      this.loading = true;
    }

    forkJoin({
      ordersRes: this.api
        .getOrdersByDateRange(this.selectedDate, this.selectedDate, undefined, 700)
        .pipe(catchError(() => of({ orders: [] }))),
      ridersRes: this.api.listRiders().pipe(catchError(() => of({ riders: [] }))),
    }).subscribe({
      next: ({ ordersRes, ridersRes }: any) => {
        this.orders = (ordersRes.orders || []).filter((order: any) => LIVE_STATUSES.includes(order.status));
        this.riders = ridersRes.riders || [];
        this.trips = this.buildTrips();
        this.selectedTrip = this.resolveSelectedTrip();
        this.updatedLabel = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        this.loading = false;
        this.renderRoadMap();
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  selectTrip(trip: LiveTrip): void {
    this.selectedTrip = trip;
    this.renderRoadMap();
  }

  countByNav(state: NavState): number {
    return this.trips.filter((trip) => trip.navState === state).length;
  }

  navLabel(state: NavState): string {
    return {
      ON_ROUTE: 'On Route',
      WATCH: 'Watch',
      OFF_ROUTE: 'Off Route',
      WAITING: 'Waiting',
    }[state];
  }

  progressPath(trip: LiveTrip): string {
    if (!trip.restaurantMap || !trip.riderMap) {
      return '';
    }
    return `M ${trip.restaurantMap.x} ${trip.restaurantMap.y} L ${trip.riderMap.x} ${trip.riderMap.y}`;
  }

  remainingPath(trip: LiveTrip): string {
    if (!trip.riderMap || !trip.customerMap) {
      return '';
    }
    return `M ${trip.riderMap.x} ${trip.riderMap.y} L ${trip.customerMap.x} ${trip.customerMap.y}`;
  }

  directionText(trip: LiveTrip): string {
    if (!DELIVERY_STATUSES.includes(trip.order.status)) {
      return 'Order is not in rider navigation yet';
    }
    if (!trip.riderPoint || !trip.activeDestination) {
      return 'Missing rider or destination location';
    }
    if (trip.trend === 'AWAY') {
      return `Rider is getting farther from ${trip.activeDestinationLabel}`;
    }
    if (trip.headingDeltaDeg !== null && trip.headingDeltaDeg > 100) {
      return 'Rider heading is not aligned';
    }
    if (trip.distanceFromRouteKm !== null && trip.distanceFromRouteKm > 1.5) {
      return 'Rider is far from the direct route';
    }
    if (trip.trend === 'CLOSER') {
      return `Rider is moving closer to ${trip.activeDestinationLabel}`;
    }
    return 'Route position looks acceptable';
  }

  gpsText(trip: LiveTrip): string {
    if (trip.riderLocationAgeMin === null) {
      return 'No rider timestamp';
    }
    if (trip.riderLocationAgeMin > 5) {
      return 'Location is stale';
    }
    return 'Recent rider update';
  }

  private renderRoadMap(): void {
    const trip = this.selectedTrip;
    if (!this.mapViewReady || !this.roadMap?.nativeElement || !trip?.riderPoint || !trip.activeDestination) {
      return;
    }

    this.mapLoading = true;
    this.loadGoogleMaps()
      .then((google) => {
        if (!this.roadMap?.nativeElement || !this.selectedTrip?.riderPoint || !this.selectedTrip.activeDestination) {
          this.mapLoading = false;
          return;
        }

        const currentTrip = this.selectedTrip;
        const riderPoint = currentTrip.riderPoint;
        const activeDestination = currentTrip.activeDestination;
        if (!riderPoint || !activeDestination) {
          this.mapLoading = false;
          return;
        }
        const riderLatLng = this.toGoogleLatLng(google, riderPoint);
        const destinationLatLng = this.toGoogleLatLng(google, activeDestination);

        if (!this.googleMap) {
          this.googleMap = new google.maps.Map(this.roadMap.nativeElement, {
            center: riderLatLng,
            zoom: 14,
            disableDefaultUI: true,
            zoomControl: true,
            clickableIcons: false,
            gestureHandling: 'greedy',
            styles: this.googleMapStyle(),
          });
          this.directionsRenderer = new google.maps.DirectionsRenderer({
            map: this.googleMap,
            suppressMarkers: true,
            preserveViewport: true,
            polylineOptions: {
              strokeColor: '#e8352a',
              strokeOpacity: 1,
              strokeWeight: 6,
            },
          });
        }

        this.clearMarkers();
        this.roadPolyline?.setMap(null);
        this.roadPolyline = null;

        this.addMapMarker(google, riderPoint, 'D', '#e8352a', 'Delivery Partner');
        if (currentTrip.restaurant) {
          this.addMapMarker(google, currentTrip.restaurant, 'R', '#f59e0b', 'Restaurant');
        }
        if (currentTrip.customer) {
          this.addMapMarker(google, currentTrip.customer, 'C', '#16a34a', 'Customer');
        }

        const bounds = new google.maps.LatLngBounds();
        bounds.extend(riderLatLng);
        bounds.extend(destinationLatLng);
        if (currentTrip.restaurant) {
          bounds.extend(this.toGoogleLatLng(google, currentTrip.restaurant));
        }
        if (currentTrip.customer) {
          bounds.extend(this.toGoogleLatLng(google, currentTrip.customer));
        }
        this.googleMap.fitBounds(bounds, 76);

        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
          {
            origin: riderLatLng,
            destination: destinationLatLng,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result: any, status: string) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              this.directionsRenderer.setDirections(result);
            } else {
              this.directionsRenderer.setDirections({ routes: [] });
              this.roadPolyline = new google.maps.Polyline({
                map: this.googleMap,
                path: [riderLatLng, destinationLatLng],
                strokeColor: '#e8352a',
                strokeOpacity: 0.92,
                strokeWeight: 5,
              });
            }
            this.mapLoading = false;
          },
        );
      })
      .catch(() => {
        this.mapLoading = false;
      });
  }

  private loadGoogleMaps(): Promise<any> {
    const win = window as any;
    if (win.google?.maps) {
      return Promise.resolve(win.google);
    }
    if (this.mapsPromise) {
      return this.mapsPromise;
    }

    this.mapsPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById(GOOGLE_MAP_SCRIPT_ID) as HTMLScriptElement | null;
      const callbackName = `nearbiteAdminMapsReady_${Date.now()}`;

      win[callbackName] = () => {
        delete win[callbackName];
        resolve(win.google);
      };

      if (existing) {
        existing.addEventListener('load', () => resolve(win.google), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = GOOGLE_MAP_SCRIPT_ID;
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=${callbackName}`;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return this.mapsPromise;
  }

  private addMapMarker(google: any, point: Point, label: string, color: string, title: string): void {
    const marker = new google.maps.Marker({
      map: this.googleMap,
      position: this.toGoogleLatLng(google, point),
      title,
      label: {
        text: label,
        color: '#ffffff',
        fontWeight: '900',
        fontSize: '13px',
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: label === 'D' ? 15 : 13,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 4,
      },
      zIndex: label === 'D' ? 30 : 20,
    });
    this.mapMarkers.push(marker);
  }

  private clearRoadMap(): void {
    this.clearMarkers();
    this.roadPolyline?.setMap(null);
    this.directionsRenderer?.setMap(null);
  }

  private clearMarkers(): void {
    this.mapMarkers.forEach((marker) => marker.setMap(null));
    this.mapMarkers = [];
  }

  private toGoogleLatLng(google: any, point: Point): any {
    return new google.maps.LatLng(point.lat, point.lng);
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
      { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#eceff3' }] },
      { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#d5e3ef' }] },
      { featureType: 'landscape', elementType: 'geometry.fill', stylers: [{ color: '#f1f4f6' }] },
    ];
  }

  private buildTrips(): LiveTrip[] {
    const riderById = new Map(this.riders.map((r: any) => [r.riderId, r]));
    const trips = this.orders.map((order) => {
      const rider = order.riderId ? riderById.get(order.riderId) || null : null;
      return this.buildTrip(order, rider);
    });

    trips.sort((a, b) => {
      const severity = { OFF_ROUTE: 0, WATCH: 1, WAITING: 2, ON_ROUTE: 3 };
      const aScore = severity[a.navState];
      const bScore = severity[b.navState];
      if (aScore !== bScore) {
        return aScore - bScore;
      }
      return new Date(b.order.createdAt || 0).getTime() - new Date(a.order.createdAt || 0).getTime();
    });

    return trips;
  }

  private buildTrip(order: any, rider: any | null): LiveTrip {
    const restaurant = this.pointFrom(order.pickupLat, order.pickupLng);
    const riderPoint = this.pointFrom(
      order.riderCurrentLat ?? rider?.lat,
      order.riderCurrentLng ?? rider?.lng,
    );
    const customer = this.pointFrom(order.deliveryLat, order.deliveryLng);
    const activeDestination = this.resolveActiveDestination(order, restaurant, customer);
    const activeDestinationLabel = activeDestination === restaurant ? 'restaurant pickup' : 'customer drop';

    const projection = restaurant && riderPoint && customer
      ? this.projectTripPoints(restaurant, riderPoint, customer)
      : { restaurantMap: null, riderMap: null, customerMap: null, routePath: '' };

    const distanceRemainingKm = riderPoint && activeDestination ? this.distanceKm(riderPoint, activeDestination) : null;
    const distanceFromRouteKm = restaurant && riderPoint && customer && ['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(order.status)
      ? this.distanceFromSegmentKm(riderPoint, restaurant, customer)
      : null;
    const progressPct = restaurant && riderPoint && customer
      ? this.progressAlongSegmentPct(riderPoint, restaurant, customer)
      : 0;
    const riderLocationAgeMin = this.locationAgeMinutes(order.riderLocationUpdatedAt || rider?.lastSeen || rider?.timestamp);
    const heading = Number(order.riderHeading ?? rider?.heading);
    const headingDeltaDeg = riderPoint && activeDestination && Number.isFinite(heading)
      ? this.headingDelta(heading, this.bearingDeg(riderPoint, activeDestination))
      : null;
    const trend = this.resolveTrend(order.orderId, distanceRemainingKm);
    const alerts = this.buildAlerts(order, rider, restaurant, riderPoint, customer, {
      distanceFromRouteKm,
      riderLocationAgeMin,
      headingDeltaDeg,
      trend,
    });
    const navState = this.resolveNavState(order, riderPoint, customer, {
      distanceFromRouteKm,
      riderLocationAgeMin,
      headingDeltaDeg,
      trend,
      alerts,
    });

    return {
      order,
      rider,
      restaurant,
      riderPoint,
      customer,
      activeDestination,
      activeDestinationLabel,
      restaurantMap: projection.restaurantMap,
      riderMap: projection.riderMap,
      customerMap: projection.customerMap,
      routePath: projection.routePath,
      progressPct,
      distanceRemainingKm,
      distanceFromRouteKm,
      riderLocationAgeMin,
      headingDeltaDeg,
      trend,
      navState,
      alerts,
    };
  }

  private resolveSelectedTrip(): LiveTrip | null {
    if (!this.trips.length) {
      return null;
    }
    const selectedId = this.selectedTrip?.order?.orderId;
    if (selectedId) {
      const existing = this.trips.find((trip) => trip.order.orderId === selectedId);
      if (existing) {
        return existing;
      }
    }
    return this.trips[0];
  }

  private buildAlerts(
    order: any,
    rider: any | null,
    restaurant: Point | null,
    riderPoint: Point | null,
    customer: Point | null,
    metrics: {
      distanceFromRouteKm: number | null;
      riderLocationAgeMin: number | null;
      headingDeltaDeg: number | null;
      trend: DistanceTrend;
    },
  ): string[] {
    const alerts: string[] = [];

    if (!order.riderId && ['AWAITING_RIDER_ASSIGNMENT', 'OFFERED_TO_RIDER'].includes(order.status)) {
      alerts.push('No rider assigned yet');
    }
    if (order.riderId && !rider) {
      alerts.push('Assigned rider was not found in rider list');
    }
    if (!restaurant || !riderPoint || !customer) {
      alerts.push('Map coordinates are incomplete');
    }
    if (metrics.riderLocationAgeMin !== null && metrics.riderLocationAgeMin > 5) {
      alerts.push('Rider GPS has not updated recently');
    }
    if (metrics.distanceFromRouteKm !== null && metrics.distanceFromRouteKm > 1.5) {
      alerts.push('Rider is far from the direct pickup-to-drop route');
    }
    if (metrics.headingDeltaDeg !== null && metrics.headingDeltaDeg > 100 && Number(order.riderSpeed ?? rider?.speed ?? 0) > 3) {
      alerts.push('Rider heading points away from current stop');
    }
    if (metrics.trend === 'AWAY') {
      alerts.push('Rider is farther from current stop than the previous refresh');
    }
    if (this.minutesSince(order.createdAt) > 45 && !['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(order.status)) {
      alerts.push('Order has been active for more than 45 minutes before delivery');
    }

    return alerts;
  }

  private resolveNavState(
    order: any,
    riderPoint: Point | null,
    customer: Point | null,
    metrics: {
      distanceFromRouteKm: number | null;
      riderLocationAgeMin: number | null;
      headingDeltaDeg: number | null;
      trend: DistanceTrend;
      alerts: string[];
    },
  ): NavState {
    if (!DELIVERY_STATUSES.includes(order.status)) {
      return 'WAITING';
    }
    if (!order.riderId || !riderPoint || !customer) {
      return 'WATCH';
    }
    if (
      (metrics.distanceFromRouteKm !== null && metrics.distanceFromRouteKm > 1.5) ||
      (metrics.trend === 'AWAY' && metrics.headingDeltaDeg !== null && metrics.headingDeltaDeg > 100)
    ) {
      return 'OFF_ROUTE';
    }
    if (
      (metrics.riderLocationAgeMin !== null && metrics.riderLocationAgeMin > 5) ||
      (metrics.distanceFromRouteKm !== null && metrics.distanceFromRouteKm > 0.7) ||
      (metrics.headingDeltaDeg !== null && metrics.headingDeltaDeg > 80) ||
      metrics.trend === 'AWAY'
    ) {
      return 'WATCH';
    }
    return 'ON_ROUTE';
  }

  private resolveActiveDestination(order: any, restaurant: Point | null, customer: Point | null): Point | null {
    if (PRE_PICKUP_STATUSES.includes(order.status) && restaurant) {
      return restaurant;
    }
    if (['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(order.status) && customer) {
      return customer;
    }
    return customer || restaurant;
  }

  private pointFrom(lat: unknown, lng: unknown): Point | null {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      return null;
    }
    return { lat: parsedLat, lng: parsedLng };
  }

  private projectTripPoints(restaurant: Point, rider: Point, customer: Point) {
    const points = [restaurant, rider, customer];
    const minLat = Math.min(...points.map((p) => p.lat));
    const maxLat = Math.max(...points.map((p) => p.lat));
    const minLng = Math.min(...points.map((p) => p.lng));
    const maxLng = Math.max(...points.map((p) => p.lng));
    const latSpan = Math.max(0.001, maxLat - minLat);
    const lngSpan = Math.max(0.001, maxLng - minLng);
    const padding = 92;

    const project = (point: Point): MapPoint => ({
      ...point,
      x: padding + ((point.lng - minLng) / lngSpan) * (MAP_WIDTH - padding * 2),
      y: padding + ((maxLat - point.lat) / latSpan) * (MAP_HEIGHT - padding * 2),
    });

    const restaurantMap = project(restaurant);
    const riderMap = project(rider);
    const customerMap = project(customer);
    const routePath = `M ${restaurantMap.x} ${restaurantMap.y} L ${customerMap.x} ${customerMap.y}`;

    return { restaurantMap, riderMap, customerMap, routePath };
  }

  private distanceKm(a: Point, b: Point): number {
    const radiusKm = 6371;
    const dLat = this.toRad(b.lat - a.lat);
    const dLng = this.toRad(b.lng - a.lng);
    const lat1 = this.toRad(a.lat);
    const lat2 = this.toRad(b.lat);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * radiusKm * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  private distanceFromSegmentKm(point: Point, start: Point, end: Point): number {
    const avgLat = this.toRad((start.lat + end.lat) / 2);
    const scaleX = 111.32 * Math.cos(avgLat);
    const toXY = (p: Point) => ({
      x: p.lng * scaleX,
      y: p.lat * 110.57,
    });
    const p = toXY(point);
    const a = toXY(start);
    const b = toXY(end);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (!lenSq) {
      return this.distanceKm(point, start);
    }
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
    const closest = { x: a.x + t * dx, y: a.y + t * dy };
    return Math.sqrt((p.x - closest.x) ** 2 + (p.y - closest.y) ** 2);
  }

  private progressAlongSegmentPct(point: Point, start: Point, end: Point): number {
    const avgLat = this.toRad((start.lat + end.lat) / 2);
    const scaleX = Math.cos(avgLat);
    const p = { x: point.lng * scaleX, y: point.lat };
    const a = { x: start.lng * scaleX, y: start.lat };
    const b = { x: end.lng * scaleX, y: end.lat };
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (!lenSq) {
      return 0;
    }
    const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
    return Math.max(0, Math.min(100, Math.round(t * 100)));
  }

  private bearingDeg(from: Point, to: Point): number {
    const lat1 = this.toRad(from.lat);
    const lat2 = this.toRad(to.lat);
    const dLng = this.toRad(to.lng - from.lng);
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return (this.toDeg(Math.atan2(y, x)) + 360) % 360;
  }

  private headingDelta(heading: number, bearing: number): number {
    const delta = Math.abs(((heading - bearing + 540) % 360) - 180);
    return Math.round(delta);
  }

  private resolveTrend(orderId: string, currentDistance: number | null): DistanceTrend {
    if (currentDistance === null) {
      return 'UNKNOWN';
    }

    const previous = this.previousDistances.get(orderId);
    this.previousDistances.set(orderId, currentDistance);

    if (previous === undefined) {
      return 'UNKNOWN';
    }

    const delta = currentDistance - previous;
    if (delta < -0.08) {
      return 'CLOSER';
    }
    if (delta > 0.08) {
      return 'AWAY';
    }
    return 'UNCHANGED';
  }

  private locationAgeMinutes(value: unknown): number | null {
    if (!value) {
      return null;
    }
    const timestamp = new Date(String(value)).getTime();
    if (!Number.isFinite(timestamp)) {
      return null;
    }
    return Math.max(0, (Date.now() - timestamp) / 60000);
  }

  private minutesSince(value: unknown): number {
    if (!value) {
      return 0;
    }
    const timestamp = new Date(String(value)).getTime();
    if (!Number.isFinite(timestamp)) {
      return 0;
    }
    return Math.max(0, (Date.now() - timestamp) / 60000);
  }

  private todayIST(): string {
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    return new Date(Date.now() + istOffsetMs).toISOString().slice(0, 10);
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  private toDeg(value: number): number {
    return (value * 180) / Math.PI;
  }
}
