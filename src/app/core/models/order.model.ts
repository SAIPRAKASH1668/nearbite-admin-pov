/**
 * Order Model
 * Complete order entity for admin monitoring and management
 */

export enum OrderStatus {
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  PICKED_UP = 'PICKED_UP',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUND_INITIATED = 'REFUND_INITIATED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  CARD = 'CARD',
  UPI = 'UPI',
  NET_BANKING = 'NET_BANKING',
  WALLET = 'WALLET',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY'
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizations?: string[];
  specialInstructions?: string;
}

export interface OrderTimeline {
  id: string;
  orderId: string;
  status: OrderStatus;
  timestamp: Date;
  performedBy?: string; // user/rider/system
  notes?: string;
  location?: { latitude: number; longitude: number };
}

export interface DeliveryDetails {
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  pickupTime?: Date;
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date;
  deliveryInstructions?: string;
  deliveryProof?: string; // photo URL
}

export interface CustomerDetails {
  customerId: string;
  name: string;
  phone: string;
  email?: string;
  deliveryAddress: {
    street: string;
    apartment?: string;
    city: string;
    zipCode: string;
    landmark?: string;
    latitude: number;
    longitude: number;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  
  // Relationships
  restaurantId: string;
  restaurantName: string;
  customerId: string;
  riderId?: string;
  
  // Order details
  items: OrderItem[];
  status: OrderStatus;
  
  // Pricing
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  packagingCharges: number;
  discount: number;
  totalAmount: number;
  
  // Payment
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  
  // Customer & Delivery
  customerDetails: CustomerDetails;
  deliveryDetails: DeliveryDetails;
  
  // Timeline
  placedAt: Date;
  confirmedAt?: Date;
  preparingAt?: Date;
  readyAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  
  // Additional info
  specialInstructions?: string;
  cancellationReason?: string;
  cancelledBy?: 'CUSTOMER' | 'RESTAURANT' | 'RIDER' | 'ADMIN';
  rating?: number;
  feedback?: string;
  
  // Flags for admin attention
  isDisputed: boolean;
  isFraudulent: boolean;
  requiresRefund: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderAnalytics {
  totalOrders: number;
  activeOrders: number;
  completedToday: number;
  cancelledToday: number;
  avgDeliveryTime: number;
  totalRevenue: number;
  peakOrderTime: string;
}
