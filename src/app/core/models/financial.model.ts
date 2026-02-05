/**
 * Financial Models
 * Settlement, payment, refund, and commission models
 */

export enum SettlementStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED'
}

export enum RefundStatus {
  INITIATED = 'INITIATED',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED'
}

export enum RefundReason {
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  WRONG_ITEM = 'WRONG_ITEM',
  LATE_DELIVERY = 'LATE_DELIVERY',
  MISSING_ITEM = 'MISSING_ITEM',
  CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
  FRAUDULENT_ORDER = 'FRAUDULENT_ORDER',
  OTHER = 'OTHER'
}

export interface Settlement {
  id: string;
  restaurantId: string;
  restaurantName: string;
  
  // Settlement period
  periodStart: Date;
  periodEnd: Date;
  
  // Financial breakdown
  totalOrders: number;
  grossRevenue: number;
  platformCommission: number;
  deliveryCommission: number;
  taxes: number;
  adjustments: number;
  netPayable: number;
  
  // Payment details
  status: SettlementStatus;
  scheduledPayoutDate: Date;
  actualPayoutDate?: Date;
  utrNumber?: string; // Unique Transaction Reference
  
  // Bank details
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  
  // Approval workflow
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface Refund {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  restaurantId: string;
  restaurantName: string;
  
  // Refund details
  reason: RefundReason;
  reasonDescription: string;
  requestedAmount: number;
  approvedAmount: number;
  
  // Status
  status: RefundStatus;
  
  // Payment details
  originalPaymentMethod: string;
  refundMethod: string;
  transactionId?: string;
  
  // Workflow
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  completedAt?: Date;
  rejectionReason?: string;
  
  // Evidence
  attachments: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  
  // Amount breakdown
  amount: number;
  platformFee: number;
  gatewayFee: number;
  netAmount: number;
  
  // Payment details
  method: string;
  gatewayProvider: string; // Razorpay, Stripe, etc.
  gatewayTransactionId: string;
  status: string;
  
  // Timestamps
  initiatedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  
  // Error handling
  failureReason?: string;
  retryCount: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface CommissionAdjustment {
  id: string;
  restaurantId: string;
  restaurantName: string;
  
  // Old vs New rates
  oldCommissionRate: number;
  newCommissionRate: number;
  
  // Adjustment details
  reason: string;
  adjustmentAmount: number;
  
  // Approval
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  
  // Effective period
  effectiveFrom: Date;
  effectiveTo?: Date;
  
  // Metadata
  createdAt: Date;
}

export interface FinancialSummary {
  period: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';
  totalRevenue: number;
  platformCommission: number;
  deliveryCommission: number;
  totalRefunds: number;
  pendingSettlements: number;
  completedSettlements: number;
  failedPayments: number;
  netProfit: number;
}
