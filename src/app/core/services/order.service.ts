import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Order, OrderStatus, OrderAnalytics, PaymentStatus, PaymentMethod } from '../models';

/**
 * Order Service
 * Manages orders, real-time monitoring, and order lifecycle
 */
@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private mockOrders: Order[] = this.generateMockOrders();

  getOrders(filters?: {
    status?: OrderStatus;
    restaurantId?: string;
    customerId?: string;
    riderId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Observable<Order[]> {
    let filtered = [...this.mockOrders];
    
    if (filters?.status) {
      filtered = filtered.filter(o => o.status === filters.status);
    }
    if (filters?.restaurantId) {
      filtered = filtered.filter(o => o.restaurantId === filters.restaurantId);
    }
    if (filters?.customerId) {
      filtered = filtered.filter(o => o.customerId === filters.customerId);
    }
    
    return of(filtered).pipe(delay(400));
  }

  getOrderById(id: string): Observable<Order | undefined> {
    return of(this.mockOrders.find(o => o.id === id)).pipe(delay(300));
  }

  getActiveOrders(): Observable<Order[]> {
    const activeStatuses = [
      OrderStatus.INITIATED,
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.ACCEPTED,
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.AWAITING_RIDER_ASSIGNMENT,
      OrderStatus.OFFERED_TO_RIDER,
      OrderStatus.RIDER_ASSIGNED,
      OrderStatus.PICKED_UP,
      OrderStatus.OUT_FOR_DELIVERY
    ];
    return of(this.mockOrders.filter(o => activeStatuses.includes(o.status))).pipe(delay(350));
  }

  getOrderAnalytics(): Observable<OrderAnalytics> {
    return of(this.getMockAnalytics()).pipe(delay(400));
  }

  private generateMockOrders(): Order[] {
    const orders: Order[] = [];
    const statuses = Object.values(OrderStatus);
    const restaurants = ['rest-001', 'rest-002', 'rest-003', 'rest-004', 'rest-005'];
    const restaurantNames = ['The Golden Spoon', 'Bella Italia', 'Sushi Paradise', 'Spice Route', 'Burger Haven'];

    for (let i = 0; i < 50; i++) {
      const restIndex = i % restaurants.length;
      const statusIndex = Math.min(Math.floor(i / 10), statuses.length - 1);
      
      orders.push({
        id: `order-${String(i + 1).padStart(4, '0')}`,
        orderNumber: `ORD-${String(10000 + i)}`,
        restaurantId: restaurants[restIndex],
        restaurantName: restaurantNames[restIndex],
        customerId: `cust-${String((i % 20) + 1).padStart(3, '0')}`,
        riderId: i % 3 === 0 ? `rider-${String((i % 15) + 1).padStart(3, '0')}` : undefined,
        items: [
          {
            id: `item-${i}-1`,
            menuItemId: `menu-${i}-1`,
            name: ['Margherita Pizza', 'Caesar Salad', 'Sushi Roll', 'Butter Chicken', 'Cheeseburger'][restIndex],
            quantity: 1 + (i % 3),
            unitPrice: 12 + (i % 10),
            totalPrice: (12 + (i % 10)) * (1 + (i % 3))
          }
        ],
        status: statuses[statusIndex],
        subtotal: 25 + (i % 30),
        taxAmount: 2.5 + (i % 3),
        deliveryFee: 3 + (i % 2),
        packagingCharges: 1,
        discount: i % 5 === 0 ? 5 : 0,
        totalAmount: 31.5 + (i % 30),
        paymentMethod: [PaymentMethod.CARD, PaymentMethod.UPI, PaymentMethod.WALLET][i % 3],
        paymentStatus: i % 10 === 0 ? PaymentStatus.FAILED : PaymentStatus.SUCCESS,
        customerDetails: {
          customerId: `cust-${String((i % 20) + 1).padStart(3, '0')}`,
          name: `Customer ${(i % 20) + 1}`,
          phone: `+1-555-${String(2000 + (i % 20)).slice(-4)}`,
          deliveryAddress: {
            street: `${200 + i} Oak Street`,
            city: 'New York',
            zipCode: `10${20 + (i % 10)}`,
            latitude: 40.7128,
            longitude: -74.0060
          }
        },
        deliveryDetails: {
          estimatedDeliveryTime: new Date(Date.now() + (30 + i % 20) * 60000),
          riderId: i % 3 === 0 ? `rider-${String((i % 15) + 1).padStart(3, '0')}` : undefined,
          riderName: i % 3 === 0 ? `Rider ${(i % 15) + 1}` : undefined
        },
        placedAt: new Date(Date.now() - (i * 3600000)),
        isDisputed: i % 20 === 0,
        isFraudulent: false,
        requiresRefund: i % 15 === 0,
        createdAt: new Date(Date.now() - (i * 3600000)),
        updatedAt: new Date()
      });
    }

    return orders;
  }

  private getMockAnalytics(): OrderAnalytics {
    return {
      totalOrders: 2847,
      activeOrders: 342,
      completedToday: 2456,
      cancelledToday: 49,
      avgDeliveryTime: 28,
      totalRevenue: 142350,
      peakOrderTime: '7:30 PM'
    };
  }
}
