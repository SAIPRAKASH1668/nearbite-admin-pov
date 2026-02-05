/**
 * Support & Ticket Models
 * Support ticket system for customers, restaurants, and riders
 */

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_FOR_CUSTOMER = 'WAITING_FOR_CUSTOMER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL'
}

export enum TicketCategory {
  ORDER_ISSUE = 'ORDER_ISSUE',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  DELIVERY_ISSUE = 'DELIVERY_ISSUE',
  REFUND_REQUEST = 'REFUND_REQUEST',
  ACCOUNT_ISSUE = 'ACCOUNT_ISSUE',
  TECHNICAL_ISSUE = 'TECHNICAL_ISSUE',
  FRAUD_REPORT = 'FRAUD_REPORT',
  GENERAL_INQUIRY = 'GENERAL_INQUIRY',
  COMPLAINT = 'COMPLAINT',
  OTHER = 'OTHER'
}

export enum UserType {
  CUSTOMER = 'CUSTOMER',
  RESTAURANT = 'RESTAURANT',
  RIDER = 'RIDER'
}

export interface TicketConversation {
  id: string;
  ticketId: string;
  message: string;
  sentBy: string; // userId or 'SYSTEM'
  sentByType: 'CUSTOMER' | 'RESTAURANT' | 'RIDER' | 'ADMIN' | 'SYSTEM';
  sentAt: Date;
  attachments: string[];
  isInternal: boolean; // Internal notes for admins only
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  
  // Requester details
  userType: UserType;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  
  // Ticket details
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  
  // Related entities
  orderId?: string;
  orderNumber?: string;
  restaurantId?: string;
  riderId?: string;
  
  // Assignment
  assignedTo?: string; // Admin user ID
  assignedToName?: string;
  assignedAt?: Date;
  
  // SLA tracking
  createdAt: Date;
  firstResponseAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  slaBreached: boolean;
  slaResponseTime: number; // minutes
  slaResolutionTime: number; // minutes
  
  // Conversations
  conversations: TicketConversation[];
  
  // Resolution
  resolutionSummary?: string;
  customerSatisfactionRating?: number;
  
  // Flags
  isFraudulent: boolean;
  requiresEscalation: boolean;
  escalatedTo?: string;
  escalatedAt?: Date;
  
  // Metadata
  tags: string[];
  updatedAt: Date;
}

export interface TicketAnalytics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedToday: number;
  avgResolutionTime: number;
  slaBreachRate: number;
  customerSatisfactionScore: number;
  ticketsByCategory: { category: string; count: number }[];
}
