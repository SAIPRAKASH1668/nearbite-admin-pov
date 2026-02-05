/**
 * Content Management Models
 * Banners, campaigns, promotions, and featured content
 */

export enum BannerType {
  HERO = 'HERO',
  PROMOTION = 'PROMOTION',
  CATEGORY = 'CATEGORY',
  RESTAURANT_FEATURE = 'RESTAURANT_FEATURE',
  ANNOUNCEMENT = 'ANNOUNCEMENT'
}

export enum BannerStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED'
}

export enum TargetAudience {
  ALL_USERS = 'ALL_USERS',
  NEW_USERS = 'NEW_USERS',
  REPEAT_CUSTOMERS = 'REPEAT_CUSTOMERS',
  INACTIVE_USERS = 'INACTIVE_USERS',
  HIGH_VALUE_CUSTOMERS = 'HIGH_VALUE_CUSTOMERS',
  SPECIFIC_CITY = 'SPECIFIC_CITY'
}

export interface Banner {
  id: string;
  title: string;
  description?: string;
  type: BannerType;
  status: BannerStatus;
  
  // Media
  imageUrl: string;
  mobileImageUrl?: string;
  
  // Action
  actionType: 'OPEN_URL' | 'OPEN_RESTAURANT' | 'OPEN_CATEGORY' | 'OPEN_OFFER' | 'NONE';
  actionValue?: string; // URL, restaurant ID, etc.
  
  // Targeting
  targetAudience: TargetAudience;
  targetCities: string[];
  
  // Scheduling
  startDate: Date;
  endDate: Date;
  displayOrder: number;
  
  // Performance
  impressions: number;
  clicks: number;
  clickThroughRate: number;
  
  // Management
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'DISCOUNT' | 'CASHBACK' | 'FREE_DELIVERY' | 'COMBO_OFFER' | 'REFERRAL';
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'EXPIRED';
  
  // Discount details
  discountType: 'PERCENTAGE' | 'FLAT' | 'FREE_ITEM';
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderValue?: number;
  
  // Targeting
  targetAudience: TargetAudience;
  eligibleRestaurants: string[]; // empty = all
  eligibleCities: string[];
  
  // Budget & Limits
  totalBudget: number;
  usedBudget: number;
  maxUsagePerUser: number;
  maxTotalUsage: number;
  currentUsageCount: number;
  
  // Scheduling
  startDate: Date;
  endDate: Date;
  
  // Promotion code
  promoCode?: string;
  
  // Performance
  totalOrders: number;
  totalRevenue: number;
  totalDiscount: number;
  roi: number; // Return on Investment percentage
  
  // Management
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt: Date;
}

export interface FeaturedRestaurant {
  id: string;
  restaurantId: string;
  restaurantName: string;
  
  // Feature details
  featureType: 'TOP_PICK' | 'TRENDING' | 'NEW_ARRIVAL' | 'BEST_RATED' | 'FASTEST_DELIVERY';
  displayOrder: number;
  
  // Scheduling
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  
  // Targeting
  targetCities: string[];
  
  // Performance
  impressions: number;
  clicks: number;
  orders: number;
  
  // Management
  createdBy: string;
  createdAt: Date;
}

export interface OfferApproval {
  id: string;
  restaurantId: string;
  restaurantName: string;
  offerTitle: string;
  offerDescription: string;
  discountValue: number;
  minOrderValue: number;
  validFrom: Date;
  validTo: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
}
