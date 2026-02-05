/**
 * Rider (Delivery Partner) Model
 * Complete rider entity for admin management
 */

export enum RiderStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  OFFLINE = 'OFFLINE',
  ON_DELIVERY = 'ON_DELIVERY',
  SUSPENDED = 'SUSPENDED',
  BLOCKED = 'BLOCKED'
}

export enum VehicleType {
  BICYCLE = 'BICYCLE',
  MOTORCYCLE = 'MOTORCYCLE',
  SCOOTER = 'SCOOTER',
  CAR = 'CAR'
}

export interface RiderDocument {
  id: string;
  riderId: string;
  type: 'DRIVING_LICENSE' | 'VEHICLE_RC' | 'INSURANCE' | 'IDENTITY_PROOF' | 'ADDRESS_PROOF';
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  expiryDate?: Date;
}

export interface VehicleDetails {
  type: VehicleType;
  registrationNumber: string;
  model: string;
  color: string;
  insuranceValidUntil: Date;
  rcValidUntil: Date;
}

export interface RiderBankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branch: string;
  verified: boolean;
}

export interface Rider {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: RiderStatus;
  
  // Personal details
  dateOfBirth: Date;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  // Professional details
  vehicleDetails: VehicleDetails;
  operatingZones: string[]; // city names or zone IDs
  
  // Performance metrics
  rating: number;
  totalRatings: number;
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  successRate: number; // percentage
  avgDeliveryTime: number; // minutes
  
  // Financial
  bankDetails?: RiderBankDetails;
  earningsToday: number;
  earningsThisWeek: number;
  earningsThisMonth: number;
  pendingPayout: number;
  totalEarnings: number;
  
  // Real-time status
  isOnline: boolean;
  currentOrderId?: string;
  lastKnownLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  
  // Issues & Disputes
  totalComplaints: number;
  activeComplaints: number;
  suspensionCount: number;
  
  // Verification
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  
  // Status tracking
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  suspensionReason?: string;
  suspendedAt?: Date;
  suspendedBy?: string;
  
  // Metadata
  joinedAt: Date;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiderPerformanceMetrics {
  riderId: string;
  period: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  avgDeliveryTime: number;
  avgRating: number;
  earnings: number;
  peakHours: { hour: number; deliveryCount: number }[];
  onTimeDeliveryRate: number;
}
