import { Injectable } from '@angular/core';
import { Observable, of, delay, BehaviorSubject } from 'rxjs';
import {
  PlatformMetrics,
  RevenueAnalytics,
  RestaurantPerformanceRanking,
  CustomerBehaviorAnalytics,
  RiderEfficiencyMetrics,
  OperationalKPIs
} from '../models';

/**
 * Dashboard Service
 * Provides real-time platform metrics and analytics
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private metricsSubject = new BehaviorSubject<PlatformMetrics>(this.getMockPlatformMetrics());
  public metrics$ = this.metricsSubject.asObservable();

  constructor() {
  }

  getPlatformMetrics(): Observable<PlatformMetrics> {
    return of(this.getMockPlatformMetrics()).pipe(delay(300));
  }

  getRevenueAnalytics(period: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'): Observable<RevenueAnalytics> {
    return of(this.getMockRevenueAnalytics(period)).pipe(delay(400));
  }

  getTopRestaurants(limit: number = 10): Observable<RestaurantPerformanceRanking[]> {
    return of(this.getMockTopRestaurants().slice(0, limit)).pipe(delay(350));
  }

  getCustomerBehavior(): Observable<CustomerBehaviorAnalytics> {
    return of(this.getMockCustomerBehavior()).pipe(delay(400));
  }

  getRiderMetrics(): Observable<RiderEfficiencyMetrics> {
    return of(this.getMockRiderMetrics()).pipe(delay(350));
  }

  getOperationalKPIs(): Observable<OperationalKPIs> {
    return of(this.getMockOperationalKPIs()).pipe(delay(400));
  }

  private simulateRealTimeUpdates(): void {
    setInterval(() => {
      const current = this.metricsSubject.value;
      this.metricsSubject.next({
        ...current,
        activeOrders: current.activeOrders + Math.floor(Math.random() * 5) - 2,
        ordersToday: current.ordersToday + Math.floor(Math.random() * 3),
        revenueToday: current.revenueToday + Math.random() * 500
      });
    }, 5000);
  }

  private getMockPlatformMetrics(): PlatformMetrics {
    return {
      activeOrders: 342,
      activeRiders: 156,
      activeRestaurants: 487,
      onlineCustomers: 1823,
      ordersToday: 2847,
      revenueToday: 142350,
      newCustomersToday: 67,
      newRestaurantsToday: 3,
      avgDeliveryTime: 28,
      avgOrderPreparationTime: 18,
      orderCompletionRate: 94.2,
      orderCancellationRate: 3.8,
      apiLatency: 145,
      failedPaymentRate: 2.1,
      systemUptime: 99.97,
      errorRate: 0.12
    };
  }

  private getMockRevenueAnalytics(period: string): RevenueAnalytics {
    const baseRevenue = period === 'TODAY' ? 142350 : period === 'WEEK' ? 987600 : period === 'MONTH' ? 4235000 : 52870000;
    
    return {
      period: period as any,
      totalRevenue: baseRevenue,
      previousPeriodRevenue: baseRevenue * 0.88,
      growthRate: 13.6,
      orderRevenue: baseRevenue * 0.78,
      deliveryRevenue: baseRevenue * 0.15,
      platformCommission: baseRevenue * 0.07,
      revenueByCity: [
        { city: 'New York', revenue: baseRevenue * 0.32 },
        { city: 'Los Angeles', revenue: baseRevenue * 0.24 },
        { city: 'Chicago', revenue: baseRevenue * 0.18 },
        { city: 'Houston', revenue: baseRevenue * 0.15 },
        { city: 'Phoenix', revenue: baseRevenue * 0.11 }
      ],
      revenueByRestaurant: [
        { restaurantId: 'rest-001', name: 'The Golden Spoon', revenue: baseRevenue * 0.045 },
        { restaurantId: 'rest-002', name: 'Bella Italia', revenue: baseRevenue * 0.042 },
        { restaurantId: 'rest-003', name: 'Sushi Paradise', revenue: baseRevenue * 0.038 }
      ],
      dailyRevenue: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue: Math.random() * 50000 + 100000
      }))
    };
  }

  private getMockTopRestaurants(): RestaurantPerformanceRanking[] {
    return [
      { restaurantId: 'rest-001', restaurantName: 'The Golden Spoon', rank: 1, totalOrders: 1847, revenue: 94230, rating: 4.8, completionRate: 98.2, avgPreparationTime: 16, score: 96.5 },
      { restaurantId: 'rest-002', restaurantName: 'Bella Italia', rank: 2, totalOrders: 1623, revenue: 87540, rating: 4.7, completionRate: 97.8, avgPreparationTime: 18, score: 95.2 },
      { restaurantId: 'rest-003', restaurantName: 'Sushi Paradise', rank: 3, totalOrders: 1456, revenue: 81200, rating: 4.9, completionRate: 96.5, avgPreparationTime: 22, score: 94.8 },
      { restaurantId: 'rest-004', restaurantName: 'Spice Route', rank: 4, totalOrders: 1398, revenue: 76890, rating: 4.6, completionRate: 95.3, avgPreparationTime: 20, score: 92.7 },
      { restaurantId: 'rest-005', restaurantName: 'Burger Haven', rank: 5, totalOrders: 1342, revenue: 72450, rating: 4.5, completionRate: 94.8, avgPreparationTime: 15, score: 91.9 }
    ];
  }

  private getMockCustomerBehavior(): CustomerBehaviorAnalytics {
    return {
      totalCustomers: 45823,
      activeCustomers: 23456,
      newCustomersThisMonth: 1879,
      churnRate: 8.3,
      avgOrdersPerCustomer: 3.7,
      avgOrderValue: 42.50,
      repeatOrderRate: 64.2,
      highValueCustomers: 2341,
      inactiveCustomers: 8976,
      peakOrderHours: [
        { hour: 12, orderCount: 456 },
        { hour: 13, orderCount: 523 },
        { hour: 19, orderCount: 687 },
        { hour: 20, orderCount: 734 }
      ],
      peakOrderDays: [
        { day: 'Friday', orderCount: 4567 },
        { day: 'Saturday', orderCount: 4982 },
        { day: 'Sunday', orderCount: 4234 }
      ]
    };
  }

  private getMockRiderMetrics(): RiderEfficiencyMetrics {
    return {
      totalRiders: 892,
      activeRiders: 156,
      onlineRiders: 223,
      idleRiders: 67,
      avgDeliveriesPerRider: 14.3,
      avgRating: 4.6,
      onTimeDeliveryRate: 91.7,
      avgDeliveryTime: 28,
      avgDistancePerDelivery: 4.2,
      topRiders: [
        { riderId: 'rider-001', name: 'John Martinez', deliveries: 847, rating: 4.9, onTimeRate: 97.3 },
        { riderId: 'rider-002', name: 'Sarah Thompson', deliveries: 823, rating: 4.8, onTimeRate: 96.1 },
        { riderId: 'rider-003', name: 'Ahmed Hassan', deliveries: 798, rating: 4.9, onTimeRate: 95.8 }
      ]
    };
  }

  private getMockOperationalKPIs(): OperationalKPIs {
    return {
      orderFulfillmentRate: 94.2,
      avgOrderValue: 42.50,
      ordersPerHour: 118,
      avgOrderToDeliveryTime: 46,
      avgOrderAcceptanceTime: 2.3,
      avgFoodPreparationTime: 18,
      customerSatisfactionScore: 4.6,
      orderAccuracyRate: 96.8,
      restaurantComplianceRate: 92.4,
      riderReliabilityScore: 91.7,
      revenuePerOrder: 38.75,
      costPerOrder: 8.20,
      profitMargin: 21.3,
      customerGrowthRate: 4.2,
      restaurantGrowthRate: 2.8,
      orderGrowthRate: 13.6
    };
  }
}
