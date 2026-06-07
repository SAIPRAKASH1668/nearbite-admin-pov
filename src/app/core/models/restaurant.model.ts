/**
 * Restaurant Model
 * Comprehensive restaurant entity for admin operations
 */

export enum RestaurantStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BLOCKED = 'BLOCKED',
  CLOSED = 'CLOSED'
}

export enum KYCStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RESUBMISSION_REQUIRED = 'RESUBMISSION_REQUIRED'
}

export enum DocumentType {
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
  FOOD_SAFETY_CERTIFICATE = 'FOOD_SAFETY_CERTIFICATE',
  TAX_ID = 'TAX_ID',
  BANK_ACCOUNT_PROOF = 'BANK_ACCOUNT_PROOF',
  IDENTITY_PROOF = 'IDENTITY_PROOF',
  ADDRESS_PROOF = 'ADDRESS_PROOF'
}

export interface RestaurantDocument {
  id: string;
  restaurantId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  expiryDate?: Date;
}

export interface RestaurantAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  landmark?: string;
  latitude: number;
  longitude: number;
}

export interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branch: string;
  accountType: 'SAVINGS' | 'CURRENT';
  verified: boolean;
}

export interface CommissionConfig {
  restaurantId: string;
  baseCommissionRate: number; // Percentage
  deliveryCommissionRate: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  notes?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  description: string;
  cuisineTypes: string[];
  address: RestaurantAddress;
  status: RestaurantStatus;
  kycStatus: KYCStatus;
  
  // AWS core fields for API compatibility
  restaurantId?: string; // Same as id, for AWS API compatibility
  locationId?: string; // AWS location-based indexing
  ownerId?: string; // AWS owner reference (phone)
  
  // Geohash fields for location-based queries (from AWS)
  geohash4Char?: string;
  geohash5Char?: string;
  geohash6Char?: string;
  geohash7Char?: string;
  
  // Business details
  businessRegistrationNumber: string;
  taxId: string;
  fssaiLicense: string;
  
  // Operational
  avgPreparationTime: number; // minutes
  minimumOrderValue: number;
  deliveryRadius: number; // km
  packagingCharges: number;
  
  // Ratings & Performance
  rating: number;
  totalRatings: number;
  totalOrders: number;
  completionRate: number; // percentage
  avgResponseTime: number; // minutes
  
  // Financial
  bankDetails?: BankDetails;
  commissionRate: number;
  outstandingBalance: number;
  totalRevenue: number;
  
  // Status tracking
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  suspensionReason?: string;
  suspendedAt?: Date;
  suspendedBy?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastOrderAt?: Date;
  
  // Settings
  isAcceptingOrders: boolean;
  isPureVeg: boolean;
  hasParkingSpace: boolean;
  hasOutdoorSeating: boolean;
  
  // Media
  logo?: string;
  coverImage?: string;
  images: string[];
}

export interface RestaurantPerformanceMetrics {
  restaurantId: string;
  period: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  rejectedOrders: number;
  revenue: number;
  commission: number;
  avgOrderValue: number;
  avgPreparationTime: number;
  customerSatisfaction: number;
  peakHours: { hour: number; orderCount: number }[];
}
