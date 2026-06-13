/**
 * Customer Model
 * Customer entity for admin support and management
 */

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BLOCKED = 'BLOCKED',
  FLAGGED_FOR_FRAUD = 'FLAGGED_FOR_FRAUD'
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  label: string; // Home, Work, Other
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  
  // Profile
  dateOfBirth?: Date;
  profilePicture?: string;
  
  // Activity
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  
  // Engagement
  favoriteRestaurants: string[];
  savedAddresses: CustomerAddress[];
  
  // Support & Issues
  totalComplaints: number;
  activeComplaints: number;
  refundsReceived: number;
  totalRefundAmount: number;
  
  // Fraud detection flags
  isFraudulent: boolean;
  fraudScore: number; // 0-100
  suspiciousActivityCount: number;
  
  // Status tracking
  blockReason?: string;
  blockedAt?: Date;
  blockedBy?: string;

  // COD controls (admin-managed risk flags; set via the Customer Config dashboard)
  disableCod?: boolean;
  forceCod?: boolean;

  // Metadata
  registeredAt: Date;
  lastOrderAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerOrderHistory {
  customerId: string;
  orders: {
    orderId: string;
    orderNumber: string;
    restaurantName: string;
    amount: number;
    status: string;
    placedAt: Date;
  }[];
  totalOrders: number;
  totalSpent: number;
}
