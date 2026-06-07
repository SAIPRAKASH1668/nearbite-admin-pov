import { Component, OnInit } from "@angular/core";
import { CommonModule, DecimalPipe, SlicePipe } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { forkJoin, of } from "rxjs";
import { catchError } from "rxjs/operators";
import { ApiService } from "../../core/services/api.service";

type TrendDirection = "up" | "down" | "flat";

interface Trend {
  direction: TrendDirection;
  label: string;
}

interface KpiCard {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  sub: string;
  trend: Trend;
  tone: "green" | "red" | "blue" | "amber";
}

type RangeMode = "daily" | "weekly" | "monthly" | "custom";
type DashboardTab = "overview" | "orders" | "profit" | "restaurants" | "riders" | "customers" | "offers" | "alerts";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DecimalPipe, SlicePipe],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.scss",
})
export class DashboardComponent implements OnInit {
  loading = true;
  analytics: any = null;
  previousAnalytics: any = null;

  rangeStart = DashboardComponent.todayIST();
  rangeEnd = DashboardComponent.todayIST();
  rangeMode: RangeMode = "daily";
  activeTab: DashboardTab = "overview";
  tabs: { key: DashboardTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "orders", label: "Orders" },
    { key: "profit", label: "Profit" },
    { key: "restaurants", label: "Restaurants" },
    { key: "riders", label: "Riders" },
    { key: "customers", label: "Customers" },
    { key: "offers", label: "Offers" },
    { key: "alerts", label: "Alerts" },
  ];

  riders: any[] = [];
  restaurants: any[] = [];
  liveOrders: any[] = [];
  kpis: KpiCard[] = [];
  orderSummary: { label: string; value: number; tone: string }[] = [];
  revenuePoints = "";
  revenueArea = "";
  revenueMax = 0;
  revenueTrend: any[] = [];
  orderTrend: any[] = [];
  topRestaurants: any[] = [];
  topItems: any[] = [];
  statusBreakdown: any[] = [];
  insights: { title: string; value: string; tone: string }[] = [];
  daypartRows: any[] = [];
  profitRows: { label: string; value: string; tone: string }[] = [];
  paymentRows: any[] = [];
  couponRows: any[] = [];
  customerCohort: any[] = [];
  topRiders: any[] = [];
  alertRows: { title: string; detail: string; tone: string }[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  private static todayIST(): string {
    return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }

  private static addDays(date: string, days: number): string {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  private static addMonths(date: string, months: number): string {
    const d = new Date(`${date}T00:00:00`);
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + months);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));
    return d.toISOString().slice(0, 10);
  }

  private static daysBetween(start: string, end: string): number {
    const a = new Date(`${start}T00:00:00`).getTime();
    const b = new Date(`${end}T00:00:00`).getTime();
    return Math.max(1, Math.round((b - a) / 86400000) + 1);
  }

  get rangeLabel(): string {
    const today = DashboardComponent.todayIST();
    const yesterday = DashboardComponent.addDays(today, -1);
    if (this.rangeStart === today && this.rangeEnd === today) return "Today";
    if (this.rangeStart === yesterday && this.rangeEnd === yesterday) return "Yesterday";
    if (this.rangeStart === this.rangeEnd) return this.rangeStart;
    return `${this.rangeStart} to ${this.rangeEnd}`;
  }

  get activeRiders(): number {
    return this.riders.filter((r) => r.isActive).length;
  }

  get busyRiders(): number {
    return this.riders.filter((r) => r.workingOnOrder?.length > 0).length;
  }

  get activeOrders(): number {
    return this.riders.reduce((sum, r) => sum + (r.workingOnOrder?.length || 0), 0);
  }

  get restaurantsOnline(): number {
    return this.restaurants.filter((r) => r.isOpen).length;
  }

  setRange(range: "daily" | "weekly" | "monthly"): void {
    const today = DashboardComponent.todayIST();
    this.rangeMode = range;
    if (range === "daily") {
      this.rangeStart = today;
      this.rangeEnd = today;
    } else if (range === "weekly") {
      this.rangeStart = DashboardComponent.addDays(today, -6);
      this.rangeEnd = today;
    } else {
      this.rangeStart = `${today.slice(0, 8)}01`;
      this.rangeEnd = today;
    }
    this.loadAll();
  }

  setCustomRange(): void {
    this.rangeMode = "custom";
    this.loadAll();
  }

  refresh(): void {
    this.loadAll();
  }

  setTab(tab: DashboardTab): void {
    this.activeTab = tab;
  }

  loadAll(): void {
    this.loading = true;
    const previous = this.previousRange();

    forkJoin({
      analytics: this.api.getAnalyticsDashboard(this.rangeStart, this.rangeEnd).pipe(catchError(() => of(null))),
      previous: this.api.getAnalyticsDashboard(previous.start, previous.end).pipe(catchError(() => of(null))),
      ridersRes: this.api.listRiders().pipe(catchError(() => of({ riders: [] }))),
      restaurantsRes: this.api.listRestaurants().pipe(catchError(() => of({ restaurants: [] }))),
    }).subscribe({
      next: ({ analytics, previous, ridersRes, restaurantsRes }: any) => {
        this.analytics = analytics;
        this.previousAnalytics = previous;
        this.riders = ridersRes?.riders || [];
        this.restaurants = restaurantsRes?.restaurants || [];
        this.buildDashboard();
        this.loadLiveOrders();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private previousRange(): { start: string; end: string } {
    if (this.rangeMode === "monthly") {
      return {
        start: DashboardComponent.addMonths(this.rangeStart, -1),
        end: DashboardComponent.addMonths(this.rangeEnd, -1),
      };
    }

    const days = DashboardComponent.daysBetween(this.rangeStart, this.rangeEnd);
    const end = DashboardComponent.addDays(this.rangeStart, -1);
    return { start: DashboardComponent.addDays(end, -(days - 1)), end };
  }

  private buildDashboard(): void {
    const summary = this.analytics?.summary || {};
    const prev = this.previousAnalytics?.summary || {};
    const orders = summary.orders || {};
    const prevOrders = prev.orders || {};
    const platform = summary.platformRevenue || {};
    const prevPlatform = prev.platformRevenue || {};
    const payments = summary.payments || {};
    const prevPayments = prev.payments || {};
    const customers = summary.customers || {};
    const prevCustomers = prev.customers || {};

    const deliveredGmv = this.num(orders.deliveredGmv ?? orders.gmv);
    const cancelledGmv = this.num(orders.cancelledGmv);
    const platformRevenue = this.num(platform.finalPayout);
    const deliveredOrders = this.num(orders.delivered);
    const totalOrders = this.num(orders.total);
    const paymentSuccess = this.num(payments.successRatePct);
    const repeatRate = this.num(customers.repeatRatePct);

    this.kpis = [
      {
        label: "Delivered GMV",
        value: deliveredGmv,
        prefix: "₹",
        sub: `${deliveredOrders} delivered orders`,
        trend: this.trend(deliveredGmv, this.num(prevOrders.deliveredGmv ?? prevOrders.gmv)),
        tone: "green",
      },
      {
        label: "Platform Revenue",
        value: platformRevenue,
        prefix: "₹",
        sub: "Delivered orders only",
        trend: this.trend(platformRevenue, this.num(prevPlatform.finalPayout)),
        tone: "blue",
      },
      {
        label: "Orders",
        value: totalOrders,
        sub: `${deliveredOrders} delivered`,
        trend: this.trend(totalOrders, this.num(prevOrders.total)),
        tone: "amber",
      },
      {
        label: "Cancelled GMV",
        value: cancelledGmv,
        prefix: "₹",
        sub: `${this.num(orders.cancelled)} cancelled orders`,
        trend: this.trend(cancelledGmv, this.num(prevOrders.cancelledGmv), true),
        tone: "red",
      },
      {
        label: "AOV",
        value: this.num(orders.aov),
        prefix: "₹",
        sub: "Delivered orders only",
        trend: this.trend(this.num(orders.aov), this.num(prevOrders.aov)),
        tone: "green",
      },
      {
        label: "Payment Success",
        value: paymentSuccess,
        suffix: "%",
        sub: `${this.num(payments.successful)} successful`,
        trend: this.trend(paymentSuccess, this.num(prevPayments.successRatePct)),
        tone: "blue",
      },
      {
        label: "Repeat Customers",
        value: repeatRate,
        suffix: "%",
        sub: `${this.num(customers.unique)} unique customers`,
        trend: this.trend(repeatRate, this.num(prevCustomers.repeatRatePct)),
        tone: "green",
      },
      {
        label: "Active Riders",
        value: this.activeRiders,
        sub: `${this.busyRiders} currently busy`,
        trend: { direction: "flat", label: `${this.riders.length} total riders` },
        tone: "amber",
      },
    ];

    this.orderSummary = [
      { label: "Live active", value: this.activeOrders, tone: "blue" },
      { label: "Delivered", value: deliveredOrders, tone: "green" },
      { label: "Cancelled", value: this.num(orders.cancelled), tone: "red" },
      { label: "Created", value: totalOrders, tone: "neutral" },
      { label: "Online restaurants", value: this.restaurantsOnline, tone: "green" },
    ];

    this.statusBreakdown = (this.analytics?.charts?.statusBreakdown || []).slice(0, 8);
    this.revenueTrend = this.analytics?.charts?.revenueByDay || [];
    this.orderTrend = this.analytics?.charts?.ordersByDay || [];
    this.topRestaurants = (this.analytics?.charts?.topRestaurants || []).slice(0, 5);
    this.topItems = this.buildTopItems(this.analytics?.charts?.restaurantStats || []);
    this.topRiders = (this.analytics?.charts?.topRiders || []).slice(0, 5);
    this.paymentRows = (this.analytics?.charts?.paymentMethodBreakdown || []).slice(0, 5);
    this.couponRows = (this.analytics?.charts?.couponUsage || []).slice(0, 5);
    this.customerCohort = this.analytics?.charts?.customerCohort || [];
    this.buildRevenueChart();
    this.buildInsights();
    this.buildDayparts();
    this.buildProfitBreakdown();
    this.buildAlerts();
  }

  private buildRevenueChart(): void {
    const values = this.orderTrend.map((d) => this.num(d.deliveredGmv ?? d.gmv));
    this.revenueMax = Math.max(...values, 1);
    if (!values.length) {
      this.revenuePoints = "";
      this.revenueArea = "";
      return;
    }

    const points = values.map((value, index) => {
      const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
      const y = 94 - (value / this.revenueMax) * 78;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    this.revenuePoints = points.join(" ");
    this.revenueArea = `0,100 ${points.join(" ")} 100,100`;
  }

  private buildTopItems(restaurants: any[]): any[] {
    const map = new Map<string, any>();
    restaurants.forEach((restaurant) => {
      (restaurant.topItems || []).forEach((item: any) => {
        const key = item.itemId || item.name;
        const existing = map.get(key) || {
          name: item.name || "Item",
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += this.num(item.quantity);
        existing.revenue += this.num(item.revenue);
        map.set(key, existing);
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }

  private buildInsights(): void {
    const orders = this.analytics?.summary?.orders || {};
    const payments = this.analytics?.summary?.payments || {};
    const coupons = this.analytics?.summary?.coupons || {};
    const platform = this.analytics?.summary?.platformRevenue || {};

    this.insights = [
      {
        title: "Demand created",
        value: `₹${this.compact(this.num(orders.createdGmv))}`,
        tone: "blue",
      },
      {
        title: "Lost to cancellations",
        value: `₹${this.compact(this.num(orders.cancelledGmv))}`,
        tone: "red",
      },
      {
        title: "Coupon cost",
        value: `₹${this.compact(this.num(coupons.discountValue))}`,
        tone: "amber",
      },
      {
        title: "Payment failures",
        value: `${this.num(payments.failed)} failed`,
        tone: this.num(payments.failed) > 0 ? "red" : "green",
      },
      {
        title: "Rider subsidy",
        value: `₹${this.compact(this.num(platform.riderDeliverySubsidy))}`,
        tone: "amber",
      },
    ];
  }

  private buildDayparts(): void {
    const rows = this.analytics?.charts?.daypartBreakdown || this.fallbackDayparts();
    const previousRows = this.previousAnalytics?.charts?.daypartBreakdown || [];
    const previousByKey = new Map(previousRows.map((row: any) => [row.key, row]));
    const maxOrders = Math.max(...rows.map((row: any) => this.num(row.orders)), 1);

    this.daypartRows = rows.map((row: any) => {
      const previous: any = previousByKey.get(row.key) || {};
      const orders = this.num(row.orders);
      return {
        ...row,
        barPct: (orders / maxOrders) * 100,
        deliveredGmv: this.num(row.deliveredGmv),
        aov: this.num(row.aov),
        conversionPct: this.num(row.conversionPct),
        sharePct: this.num(row.sharePct),
        peakHourLabel: row.peakHourLabel || "-",
        trend: this.trend(orders, this.num(previous.orders)),
      };
    });
  }

  private fallbackDayparts(): any[] {
    const hourly = this.analytics?.charts?.hourlyDistribution || [];
    const buckets = [
      { key: "morning", label: "Morning", window: "6 AM - 11:59 AM", hours: [6, 7, 8, 9, 10, 11] },
      { key: "afternoon", label: "Afternoon", window: "12 PM - 4:59 PM", hours: [12, 13, 14, 15, 16] },
      { key: "evening", label: "Evening", window: "5 PM - 6:59 PM", hours: [17, 18] },
      { key: "dinner", label: "Dinner", window: "7 PM - 5:59 AM", hours: [19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5] },
    ];
    return buckets.map((bucket) => {
      const hours = hourly.filter((row: any) => bucket.hours.includes(this.num(row.hour)));
      const peak = hours.reduce((best: any, row: any) => this.num(row.orders) > this.num(best?.orders) ? row : best, null);
      return {
        key: bucket.key,
        label: bucket.label,
        window: bucket.window,
        orders: hours.reduce((sum: number, row: any) => sum + this.num(row.orders), 0),
        delivered: 0,
        deliveredGmv: 0,
        aov: 0,
        conversionPct: 0,
        sharePct: 0,
        peakHourLabel: peak ? this.hourLabel(this.num(peak.hour)) : "-",
      };
    });
  }

  private buildProfitBreakdown(): void {
    const summary = this.analytics?.summary || {};
    const orders = summary.orders || {};
    const platform = summary.platformRevenue || {};
    const restaurant = summary.restaurantRevenueFromOrders || {};
    const rider = summary.riderRevenueFromOrders || {};
    const govt = summary.govtRevenue || {};
    const coupons = summary.coupons || {};

    this.profitRows = [
      { label: "Delivered GMV", value: `₹${this.compact(this.num(orders.deliveredGmv ?? orders.gmv))}`, tone: "green" },
      { label: "Restaurant payout", value: `- ₹${this.compact(this.num(restaurant.finalPayout))}`, tone: "red" },
      { label: "Rider payout", value: `- ₹${this.compact(this.num(rider.finalPayout))}`, tone: "red" },
      { label: "Govt GST", value: `- ₹${this.compact(this.num(govt.totalGst))}`, tone: "red" },
      { label: "Coupon cost", value: `- ₹${this.compact(this.num(coupons.discountValue))}`, tone: "amber" },
      { label: "Platform net", value: `₹${this.compact(this.num(platform.finalPayout))}`, tone: "green" },
    ];
  }

  private buildAlerts(): void {
    const orders = this.analytics?.summary?.orders || {};
    const payments = this.analytics?.summary?.payments || {};
    const customers = this.analytics?.summary?.customers || {};
    const signupRange = this.analytics?.summary?.signupConversion?.range || {};
    const riderTable = this.analytics?.summary?.riderEarningsTable || {};
    const bestDaypart = [...this.daypartRows].sort((a, b) => this.num(b.orders) - this.num(a.orders))[0];
    const worstDaypart = [...this.daypartRows].filter((row) => this.num(row.orders) > 0).sort((a, b) => this.num(a.orders) - this.num(b.orders))[0];
    const cancelRate = this.num(orders.total) ? (this.num(orders.cancelled) / this.num(orders.total)) * 100 : 0;

    this.alertRows = [
      {
        title: bestDaypart ? `${bestDaypart.label} is the strongest demand window` : "No demand window yet",
        detail: bestDaypart ? `${bestDaypart.orders} orders, peak around ${bestDaypart.peakHourLabel}. Staff riders and restaurants around this slot.` : "Orders will appear here once analytics has data.",
        tone: "green",
      },
      {
        title: worstDaypart ? `${worstDaypart.label} is the weakest window` : "Low-volume window unavailable",
        detail: worstDaypart ? `${worstDaypart.orders} orders in ${worstDaypart.window}. Good slot for targeted offers or push notifications.` : "Not enough order data to identify weak demand.",
        tone: "amber",
      },
      {
        title: cancelRate > 5 ? "Cancellation rate needs attention" : "Cancellation rate is under control",
        detail: `${cancelRate.toFixed(1)}% cancellation rate in this period.`,
        tone: cancelRate > 5 ? "red" : "green",
      },
      {
        title: this.num(payments.successRatePct) < 90 ? "Payment success is below target" : "Payment success looks healthy",
        detail: `${this.num(payments.successRatePct).toFixed(1)}% payment success across ${this.num(payments.totalAttempts)} attempts.`,
        tone: this.num(payments.successRatePct) < 90 ? "red" : "green",
      },
      {
        title: "COD cash exposure",
        detail: `₹${this.compact(this.num(riderTable.codHeldByRiders))} held by riders. Reconcile COD cash daily.`,
        tone: this.num(riderTable.codHeldByRiders) > 0 ? "amber" : "green",
      },
      {
        title: "Repeat customer health",
        detail: `${this.num(customers.repeatRatePct).toFixed(1)}% repeat rate. Push comeback offers if this drops.`,
        tone: this.num(customers.repeatRatePct) < 25 ? "amber" : "green",
      },
      {
        title: this.num(signupRange.signups) ? (this.num(signupRange.orderRatePct) < 20 ? "Signup activation is weak" : "Signup activation looks healthy") : "No new signup activation data",
        detail: this.num(signupRange.signups)
          ? `${this.num(signupRange.orderedInRange)} of ${this.num(signupRange.signups)} new signups ordered in this range. Target ${this.num(signupRange.notOrderedEver)} not-yet-ordered users.`
          : "New signup conversion appears once customers sign up in the selected range.",
        tone: this.num(signupRange.signups) ? (this.num(signupRange.orderRatePct) < 20 ? "amber" : "green") : "blue",
      },
    ];
  }

  private loadLiveOrders(): void {
    const activeRiders = this.riders.filter((r) => r.workingOnOrder?.length > 0);
    if (!activeRiders.length) {
      this.liveOrders = [];
      return;
    }

    const calls = activeRiders.map((r) =>
      this.api.getOrdersByRider(r.riderId, undefined, 20).pipe(catchError(() => of({ orders: [] })))
    );

    forkJoin(calls).subscribe((results: any[]) => {
      const seen = new Set<string>();
      const liveStatuses = new Set([
        "CONFIRMED",
        "ACCEPTED",
        "PREPARING",
        "READY_FOR_PICKUP",
        "AWAITING_RIDER_ASSIGNMENT",
        "OFFERED_TO_RIDER",
        "RIDER_ASSIGNED",
        "PICKED_UP",
        "OUT_FOR_DELIVERY",
      ]);

      this.liveOrders = results
        .flatMap((res) => res.orders || [])
        .filter((order) => {
          if (seen.has(order.orderId) || !liveStatuses.has(order.status)) return false;
          seen.add(order.orderId);
          return true;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8);
    });
  }

  trend(current: number, previous: number, inverse = false): Trend {
    if (!previous && !current) return { direction: "flat", label: "No change" };
    if (!previous) {
      return { direction: inverse ? "down" : "up", label: "New activity" };
    }
    const pct = ((current - previous) / Math.abs(previous)) * 100;
    const direction: TrendDirection = Math.abs(pct) < 0.5 ? "flat" : pct > 0 ? "up" : "down";
    const adjusted = inverse && direction === "up" ? "down" : inverse && direction === "down" ? "up" : direction;
    return {
      direction: adjusted,
      label: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs previous`,
    };
  }

  maxOrderCount(): number {
    return Math.max(...this.orderTrend.map((d) => this.num(d.orders)), 1);
  }

  maxCouponUses(): number {
    return Math.max(...this.couponRows.map((d) => this.num(d.uses)), 1);
  }

  maxRiderDeliveries(): number {
    return Math.max(...this.topRiders.map((d) => this.num(d.deliveries)), 1);
  }

  showAxisLabel(index: number, total: number): boolean {
    if (total <= 12) return true;
    const step = Math.ceil(total / 8);
    return index === 0 || index === total - 1 || index % step === 0;
  }

  hourLabel(hour: number): string {
    const suffix = hour < 12 ? "AM" : "PM";
    const display = hour % 12 || 12;
    return `${display} ${suffix}`;
  }

  compact(value: number): string {
    if (Math.abs(value) >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
    if (Math.abs(value) >= 100000) return `${(value / 100000).toFixed(1)}L`;
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return `${Math.round(value)}`;
  }

  initials(value: string): string {
    return String(value || "NA")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "NA";
  }

  private num(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
