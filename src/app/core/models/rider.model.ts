/**
 * Rider (Delivery Partner) Model
 * Matches AWS User model with role=RIDER
 */

export enum RiderStatus {
  SIGNUP_DONE = 'SIGNUP_DONE',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
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

/**
 * Rider User Model - matches AWS DynamoDB Users table with role=RIDER
 */
export interface RiderUser {
  // Primary keys
  phone: string;
  role: 'RIDER';
  
  // Rider identification
  riderId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  
  // Personal details
  address?: string;
  dateOfBirth?: string;
  
  // KYC Documents
  aadharNumber?: string;
  aadharImageUrl?: string;
  aadharImageBase64?: string; // Deprecated but may exist
  panNumber?: string;
  panImageUrl?: string;
  panImageBase64?: string; // Deprecated but may exist
  
  // Status and approval
  riderStatus: RiderStatus;
  rejectionReason?: string;
  approvedAt?: string;
  
  // Account info
  isActive: boolean;
  createdAt: string;
  
  // FCM
  fcmToken?: string;
  fcmTokenUpdatedAt?: string;
}

/**
 * Legacy Rider interface for backward compatibility
 */
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
  operatingZones: string[];
  
  // Performance metrics
  rating: number;
  totalRatings: number;
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  successRate: number;
  avgDeliveryTime: number;
  
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
