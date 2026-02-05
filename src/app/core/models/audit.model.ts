/**
 * Audit & Logging Models
 * Track all admin actions for compliance and security
 */

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  SUSPEND = 'SUSPEND',
  REINSTATE = 'REINSTATE',
  REFUND = 'REFUND',
  SETTLEMENT_APPROVE = 'SETTLEMENT_APPROVE',
  COMMISSION_ADJUST = 'COMMISSION_ADJUST',
  TICKET_ASSIGN = 'TICKET_ASSIGN',
  TICKET_RESOLVE = 'TICKET_RESOLVE',
  EXPORT_DATA = 'EXPORT_DATA',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET = 'PASSWORD_RESET'
}

export enum AuditEntity {
  RESTAURANT = 'RESTAURANT',
  CUSTOMER = 'CUSTOMER',
  RIDER = 'RIDER',
  ORDER = 'ORDER',
  PAYMENT = 'PAYMENT',
  SETTLEMENT = 'SETTLEMENT',
  REFUND = 'REFUND',
  BANNER = 'BANNER',
  CAMPAIGN = 'CAMPAIGN',
  SUPPORT_TICKET = 'SUPPORT_TICKET',
  ADMIN_USER = 'ADMIN_USER',
  COMMISSION_CONFIG = 'COMMISSION_CONFIG'
}

export interface AuditLog {
  id: string;
  
  // Who
  performedBy: string; // Admin user ID
  performedByName: string;
  performedByRole: string;
  
  // What
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  entityName?: string;
  
  // Details
  description: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  
  // Context
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  
  // Metadata
  timestamp: Date;
  
  // Additional data
  metadata?: Record<string, any>;
}

export interface FraudSignal {
  id: string;
  
  // Target
  entityType: 'CUSTOMER' | 'RESTAURANT' | 'RIDER' | 'ORDER';
  entityId: string;
  
  // Signal details
  signalType: 'MULTIPLE_ACCOUNTS' | 'ABNORMAL_REFUND' | 'VELOCITY_CHECK' | 'LOCATION_MISMATCH' | 'PAYMENT_FRAUD' | 'FAKE_REVIEWS' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number; // 0-100
  
  // Description
  description: string;
  evidence: string[];
  
  // Status
  status: 'NEW' | 'UNDER_REVIEW' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'RESOLVED';
  reviewedBy?: string;
  reviewedAt?: Date;
  resolution?: string;
  
  // Action taken
  actionTaken?: 'BLOCK_USER' | 'SUSPEND_ACCOUNT' | 'FLAG_FOR_REVIEW' | 'NO_ACTION';
  
  // Metadata
  detectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
