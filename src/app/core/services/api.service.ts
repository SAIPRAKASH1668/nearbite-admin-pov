/**
 * YumDude Admin API Service
 * Connects to api.yumdude.com (prod) / api.dev.yumdude.com (dev)
 * Uses RETOOL_BYPASS_VALUE header for admin access without JWT
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private env: 'prod' | 'dev' = 'prod';

  private readonly BASE_URLS: Record<string, string> = {
    prod: 'https://api.yumdude.com',
    dev:  'https://api.dev.yumdude.com',
  };

  // Store credentials in localStorage so they persist across sessions
  private readonly JWT_KEY = 'yd_jwt_token';
  private readonly JWT_SEED = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaG9uZSI6Imh2QHl1bWR1ZGUuY29tIiwiaWF0IjoxNzc4MzIyMTg0LCJleHAiOjE3ODYwOTgxODQsInJlc3RhdXJhbnRJZCI6IlJFUy0xNzc0MDc0ODg1NTU4LTMyMjcifQ.iVihjzlz-nEquonzElGuV0Yo0byvzvDGlt5SeVZKz-o';

  private get bypassToken(): string {
    return localStorage.getItem('yd_bypass_token') || '';
  }

  private get jwtToken(): string {
    return localStorage.getItem(this.JWT_KEY) || '';
  }

  // ADMIN_API_KEY for ops endpoints (/api/v1/ops/*), sent as X-Api-Key.
  private get adminKey(): string {
    return localStorage.getItem('yd_admin_key') || '';
  }

  get hasAdminKey(): boolean {
    return !!this.adminKey;
  }

  setAdminKey(key: string): void {
    localStorage.setItem('yd_admin_key', (key || '').trim());
  }

  get baseUrl(): string {
    return this.BASE_URLS[this.env];
  }

  get currentEnv(): 'prod' | 'dev' {
    return this.env;
  }

  constructor(private http: HttpClient) {
    const stored = localStorage.getItem('yd_env') as 'prod' | 'dev';
    this.env = stored === 'dev' ? 'dev' : 'prod';
    // Pre-seed admin JWT if not yet stored
    if (!localStorage.getItem(this.JWT_KEY)) {
      localStorage.setItem(this.JWT_KEY, this.JWT_SEED);
    }
  }

  setEnv(env: 'prod' | 'dev'): void {
    this.env = env;
    localStorage.setItem('yd_env', env);
  }

  setBypassToken(token: string): void {
    localStorage.setItem('yd_bypass_token', token);
  }

  setJwtToken(token: string): void {
    localStorage.setItem(this.JWT_KEY, token);
  }

  private get headers(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (this.jwtToken) {
      headers = headers.set('Authorization', `Bearer ${this.jwtToken}`);
    }
    if (this.bypassToken) {
      headers = headers.set('X-Retool-Bypass', this.bypassToken);
    }
    // Ops/admin routes are gated by the ADMIN_API_KEY via X-Api-Key. Harmless on
    // JWT routes (backend only reads it for /api/v1/ops/* prefixes).
    if (this.adminKey) {
      headers = headers.set('X-Api-Key', this.adminKey);
    }
    return headers;
  }

  private handleError(err: any): Observable<never> {
    console.error('[YumDude API Error]', err);
    return throwError(() => err);
  }

  get<T>(path: string, params?: Record<string, string | number | boolean>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          httpParams = httpParams.set(k, String(v));
        }
      });
    }
    return this.http
      .get<T>(`${this.baseUrl}${path}`, { headers: this.headers, params: httpParams })
      .pipe(catchError(e => this.handleError(e)));
  }

  post<T>(path: string, body: any = {}): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}${path}`, body, { headers: this.headers })
      .pipe(catchError(e => this.handleError(e)));
  }

  put<T>(path: string, body: any = {}): Observable<T> {
    return this.http
      .put<T>(`${this.baseUrl}${path}`, body, { headers: this.headers })
      .pipe(catchError(e => this.handleError(e)));
  }

  delete<T>(path: string): Observable<T> {
    return this.http
      .delete<T>(`${this.baseUrl}${path}`, { headers: this.headers })
      .pipe(catchError(e => this.handleError(e)));
  }

  // ─── Orders ───────────────────────────────────────────────────────────────
  getOrderById(orderId: string) {
    return this.get<any>(`/api/v1/orders/${orderId}`);
  }

  getOrdersByDateRange(startDate: string, endDate: string, status?: string, limit = 1000) {
    const body: any = { startDate, endDate, limit };
    if (status && status !== 'ALL_STATUSES') body['status'] = status;
    return this.post<any>('/api/v1/orders/date-range', body);
  }

  getOrdersByRider(riderId: string, status?: string, limit = 100) {
    const params: any = { riderId, limit };
    if (status && status !== 'ALL_STATUSES') params['status'] = status;
    return this.get<any>('/api/v1/orders', params);
  }

  updateOrderStatus(orderId: string, status: string, riderId?: string) {
    const body: any = { status };
    if (riderId) body['riderId'] = riderId;
    return this.put<any>(`/api/v1/orders/${orderId}/status`, body);
  }

  getAnalyticsDashboard(startDate: string, endDate: string) {
    return this.get<any>('/api/v1/analytics/dashboard', { startDate, endDate });
  }

  // ─── Riders ───────────────────────────────────────────────────────────────
  listRiders() {
    return this.get<any>('/api/v1/riders');
  }

  getRider(riderId: string) {
    return this.get<any>(`/api/v1/riders/${riderId}`);
  }

  createRider(data: { phone: string; firstName?: string; lastName?: string; isActive?: boolean }) {
    return this.post<any>('/api/v1/riders', data);
  }

  updateRiderStatus(riderId: string, isActive: boolean) {
    return this.put<any>(`/api/v1/riders/${riderId}/status`, { isActive });
  }

  // ─── Rider Earnings ───────────────────────────────────────────────────────
  getRiderEarnings(riderId: string, period: 'today' | 'week' | 'month' = 'today') {
    return this.get<any>(`/api/v1/riders/${riderId}/earnings`, { period });
  }

  getRiderEarningsHistory(riderId: string, startDate: string, endDate: string) {
    return this.get<any>(`/api/v1/riders/${riderId}/earnings/history`, { startDate, endDate });
  }

  // ─── Restaurant Earnings ──────────────────────────────────────────────────
  getRestaurantEarnings(restaurantId: string, startDate: string, endDate: string) {
    return this.get<any>(`/api/v1/restaurants/${restaurantId}/earnings/settlement/preview`, { startDate, endDate });
  }

  getRestaurantEarningsHistory(restaurantId: string, startDate: string, endDate: string) {
    return this.get<any>(`/api/v1/restaurants/${restaurantId}/earnings/history`, { startDate, endDate });
  }

  confirmRestaurantSettlement(restaurantId: string, startDate: string, endDate: string, restaurantName: string) {
    return this.post<any>(`/api/v1/restaurants/${restaurantId}/earnings/settlement/confirm`, { startDate, endDate, restaurantName });
  }

  settleRestaurantEarnings(restaurantId: string, body: { orderIds: string[], startDate: string, endDate: string, settlementId: string }) {
    return this.post<any>(`/api/v1/restaurants/${restaurantId}/earnings/settle`, body);
  }

  settleRiderEarnings(riderId: string, body: { orderIds: string[], startDate: string, endDate: string, settlementId: string }) {
    return this.post<any>(`/api/v1/riders/${riderId}/earnings/settle`, body);
  }

  // ─── Restaurants ──────────────────────────────────────────────────────────
  // Default to Nandhyal city center — backend requires lat/lng for geohash query
  private readonly DEFAULT_LAT = 15.4877;
  private readonly DEFAULT_LNG = 78.4834;

  listRestaurants(lat?: number, lng?: number) {
    return this.get<any>('/api/v1/restaurants', {
      latitude: lat ?? this.DEFAULT_LAT,
      longitude: lng ?? this.DEFAULT_LNG,
    });
  }

  getRestaurant(restaurantId: string) {
    return this.get<any>(`/api/v1/restaurants/${restaurantId}`);
  }

  createRestaurant(data: any) {
    return this.post<any>('/api/v1/restaurants', data);
  }

  updateRestaurant(restaurantId: string, data: any) {
    return this.put<any>(`/api/v1/restaurants/${restaurantId}`, data);
  }

  toggleRestaurantOpen(restaurantId: string, isOpen: boolean) {
    return this.put<any>(`/api/v1/restaurants/${restaurantId}/status`, { isOpen });
  }

  // ─── Menu ─────────────────────────────────────────────────────────────────
  getMenu(restaurantId: string) {
    return this.get<any>(`/api/v1/restaurants/${restaurantId}/menu`);
  }

  updateMenuItem(restaurantId: string, itemId: string, data: any) {
    return this.put<any>(`/api/v1/restaurants/${restaurantId}/menu/${itemId}`, data);
  }

  toggleMenuItemAvailability(restaurantId: string, itemId: string, isAvailable: boolean) {
    return this.put<any>(`/api/v1/restaurants/${restaurantId}/menu/${itemId}`, { isAvailable });
  }

  // ─── Coupons ──────────────────────────────────────────────────────────────
  listCoupons() {
    return this.get<any>('/api/v1/coupons/available');
  }

  createCoupon(data: any) {
    return this.post<any>('/api/v1/coupons', data);
  }

  deleteCoupon(couponCode: string) {
    return this.delete<any>(`/api/v1/coupons/${couponCode}`);
  }

  // ─── Config ───────────────────────────────────────────────────────────────
  getGlobalConfig(restaurantId?: string) {
    const params: any = {};
    if (restaurantId) params['restaurantId'] = restaurantId;
    return this.get<any>('/api/v1/globalconfig', params);
  }

  saveGlobalConfig(data: any) {
    return this.post<any>('/api/v1/globalconfig', data);
  }

  getHeroBanners() {
    return this.get<any>('/api/v1/config/home-hero-banner', { admin: true });
  }

  saveHeroBanner(data: any) {
    return this.post<any>('/api/v1/config/home-hero-banner', data);
  }

  getAppVersion() {
    return this.get<any>('/api/v1/config/app-version');
  }

  saveAppVersion(data: any) {
    return this.post<any>('/api/v1/config/app-version', data);
  }

  // ─── Food Categories ──────────────────────────────────────────────────────
  listFoodCategories() {
    return this.get<any>('/api/v1/food-categories/display');
  }

  createFoodCategory(data: any) {
    return this.post<any>('/api/v1/food-categories', data);
  }

  updateFoodCategory(category: string, subCategory: string, data: any) {
    return this.put<any>(`/api/v1/food-categories/${encodeURIComponent(category)}/${encodeURIComponent(subCategory)}`, data);
  }

  deleteFoodCategory(category: string, subCategory: string) {
    return this.delete<any>(`/api/v1/food-categories/${encodeURIComponent(category)}/${encodeURIComponent(subCategory)}`);
  }

  // ─── Notifications ────────────────────────────────────────────────────────
  sendNotification(data: any) {
    return this.post<any>('/api/v1/notifications/send', data);
  }

  // ─── Rider Slots (admin/ops — requires ADMIN_API_KEY via X-Api-Key) ─────────
  listRiderSlots() {
    return this.get<any>('/api/v1/ops/rider-slots');
  }

  createRiderSlot(data: {
    label?: string; date: string; startTime: string; endTime: string;
    price: number; totalSeats: number; released?: boolean; releaseAt?: string;
  }) {
    return this.post<any>('/api/v1/ops/rider-slots', data);
  }

  updateRiderSlot(slotId: string, data: any) {
    return this.put<any>(`/api/v1/ops/rider-slots/${slotId}`, data);
  }

  deleteRiderSlot(slotId: string) {
    return this.delete<any>(`/api/v1/ops/rider-slots/${slotId}`);
  }

  releaseRiderSlot(slotId: string, releaseAt?: string) {
    return this.post<any>(`/api/v1/ops/rider-slots/${slotId}/release`, releaseAt ? { releaseAt } : {});
  }
}
