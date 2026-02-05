/**
 * Analytics & Reporting Models
 * Platform-wide analytics and KPIs
 */

export interface PlatformMetrics {
  // Real-time metrics
  activeOrders: number;
  activeRiders: number;
  activeRestaurants: number;
  onlineCustomers: number;
  
  // Today's metrics
  ordersToday: number;
  revenueToday: number;
  newCustomersToday: number;
  newRestaurantsToday: number;
  
  // Performance
  avgDeliveryTime: number; // minutes
  avgOrderPreparationTime: number;
  orderCompletionRate: number; // percentage
  orderCancellationRate: number;
  
  // System health
  apiLatency: number; // ms
  failedPaymentRate: number;
  systemUptime: number; // percentage
  errorRate: number;
}

export interface RevenueAnalytics {
  period: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';
  totalRevenue: number;
  previousPeriodRevenue: number;
  growthRate: number; // percentage
  
  // Breakdown
  orderRevenue: number;
  deliveryRevenue: number;
  platformCommission: number;
  
  // By segment
  revenueByCity: { city: string; revenue: number }[];
  revenueByRestaurant: { restaurantId: string; name: string; revenue: number }[];
  
  // Trends
  dailyRevenue: { date: string; revenue: number }[];
}

export interface RestaurantPerformanceRanking {
  restaurantId: string;
  restaurantName: string;
  rank: number;
  totalOrders: number;
  revenue: number;
  rating: number;
  completionRate: number;
  avgPreparationTime: number;
  score: number; // Overall performance score
}

export interface CustomerBehaviorAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  churnRate: number; // percentage
  
  // Behavior
  avgOrdersPerCustomer: number;
  avgOrderValue: number;
  repeatOrderRate: number;
  
  // Segmentation
  highValueCustomers: number;
  inactiveCustomers: number;
  
  // Popular times
  peakOrderHours: { hour: number; orderCount: number }[];
  peakOrderDays: { day: string; orderCount: number }[];
}

export interface RiderEfficiencyMetrics {
  totalRiders: number;
  activeRiders: number;
  onlineRiders: number;
  idleRiders: number;
  
  // Performance
  avgDeliveriesPerRider: number;
  avgRating: number;
  onTimeDeliveryRate: number;
  
  // Efficiency
  avgDeliveryTime: number;
  avgDistancePerDelivery: number; // km
  
  // Top performers
  topRiders: {
    riderId: string;
    name: string;
    deliveries: number;
    rating: number;
    onTimeRate: number;
  }[];
}

export interface OperationalKPIs {
  // Order KPIs
  orderFulfillmentRate: number;
  avgOrderValue: number;
  ordersPerHour: number;
  
  // Time KPIs
  avgOrderToDeliveryTime: number;
  avgOrderAcceptanceTime: number;
  avgFoodPreparationTime: number;
  
  // Quality KPIs
  customerSatisfactionScore: number;
  orderAccuracyRate: number;
  restaurantComplianceRate: number;
  riderReliabilityScore: number;
  
  // Financial KPIs
  revenuePerOrder: number;
  costPerOrder: number;
  profitMargin: number;
  
  // Growth KPIs
  customerGrowthRate: number;
  restaurantGrowthRate: number;
  orderGrowthRate: number;
}

export interface FraudDetectionMetrics {
  totalFraudCases: number;
  activeFraudInvestigations: number;
  fraudulentOrdersBlocked: number;
  amountSaved: number;
  
  // By type
  fraudByType: {
    type: 'FAKE_ORDER' | 'PAYMENT_FRAUD' | 'REFUND_ABUSE' | 'ACCOUNT_TAKEOVER' | 'OTHER';
    count: number;
  }[];
  
  // Risk score distribution
  highRiskUsers: number;
  mediumRiskUsers: number;
  lowRiskUsers: number;
}

export interface ExportableReport {
  id: string;
  title: string;
  type: 'REVENUE' | 'ORDERS' | 'RESTAURANTS' | 'RIDERS' | 'CUSTOMERS' | 'SETTLEMENTS' | 'REFUNDS';
  format: 'CSV' | 'PDF' | 'EXCEL';
  filters: Record<string, any>;
  generatedBy: string;
  generatedAt: Date;
  fileUrl: string;
  expiresAt: Date;
}
