import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Restaurant, RestaurantStatus, KYCStatus, RestaurantPerformanceMetrics, RestaurantDocument } from '../models';

/**
 * Restaurant Service
 * Manages restaurant data, verification, and performance tracking
 */
@Injectable({
  providedIn: 'root'
})
export class RestaurantService {
  private mockRestaurants: Restaurant[] = this.generateMockRestaurants();

  getRestaurants(filters?: Partial<Restaurant>): Observable<Restaurant[]> {
    let filtered = [...this.mockRestaurants];
    
    if (filters?.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }
    if (filters?.kycStatus) {
      filtered = filtered.filter(r => r.kycStatus === filters.kycStatus);
    }
    
    return of(filtered).pipe(delay(400));
  }

  getRestaurantById(id: string): Observable<Restaurant | undefined> {
    return of(this.mockRestaurants.find(r => r.id === id)).pipe(delay(300));
  }

  getPendingApprovals(): Observable<Restaurant[]> {
    return of(this.mockRestaurants.filter(r => r.status === RestaurantStatus.PENDING_APPROVAL)).pipe(delay(350));
  }

  getRestaurantDocuments(restaurantId: string): Observable<RestaurantDocument[]> {
    return of(this.getMockDocuments(restaurantId)).pipe(delay(300));
  }

  approveRestaurant(restaurantId: string, approvedBy: string): Observable<{ success: boolean }> {
    const restaurant = this.mockRestaurants.find(r => r.id === restaurantId);
    if (restaurant) {
      restaurant.status = RestaurantStatus.ACTIVE;
      restaurant.kycStatus = KYCStatus.APPROVED;
      restaurant.approvedAt = new Date();
      restaurant.approvedBy = approvedBy;
    }
    return of({ success: true }).pipe(delay(500));
  }

  rejectRestaurant(restaurantId: string, reason: string): Observable<{ success: boolean }> {
    const restaurant = this.mockRestaurants.find(r => r.id === restaurantId);
    if (restaurant) {
      restaurant.kycStatus = KYCStatus.REJECTED;
      restaurant.rejectionReason = reason;
    }
    return of({ success: true }).pipe(delay(500));
  }

  suspendRestaurant(restaurantId: string, reason: string, suspendedBy: string): Observable<{ success: boolean }> {
    const restaurant = this.mockRestaurants.find(r => r.id === restaurantId);
    if (restaurant) {
      restaurant.status = RestaurantStatus.SUSPENDED;
      restaurant.suspensionReason = reason;
      restaurant.suspendedAt = new Date();
      restaurant.suspendedBy = suspendedBy;
    }
    return of({ success: true }).pipe(delay(500));
  }

  getPerformanceMetrics(restaurantId: string, period: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'): Observable<RestaurantPerformanceMetrics> {
    return of(this.getMockPerformanceMetrics(restaurantId, period)).pipe(delay(400));
  }

  private generateMockRestaurants(): Restaurant[] {
    const names = ['The Golden Spoon', 'Bella Italia', 'Sushi Paradise', 'Spice Route', 'Burger Haven', 'Dragon Wok', 'Pizza Palace', 'Taco Fiesta', 'Green Leaf Cafe', 'BBQ Nation'];
    const cuisines = [['American', 'Comfort Food'], ['Italian', 'Pizza'], ['Japanese', 'Sushi'], ['Indian', 'Asian'], ['American', 'Fast Food'], ['Chinese', 'Asian'], ['Italian', 'Pizza'], ['Mexican'], ['Healthy', 'Salads'], ['BBQ', 'Grill']];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];

    return names.map((name, index) => ({
      id: `rest-${String(index + 1).padStart(3, '0')}`,
      name,
      slug: name.toLowerCase().replace(/ /g, '-'),
      ownerName: `Owner ${index + 1}`,
      ownerEmail: `owner${index + 1}@${name.toLowerCase().replace(/ /g, '')}.com`,
      ownerPhone: `+1-555-${String(1000 + index).slice(-4)}`,
      description: `Delicious ${cuisines[index].join(' and ')} cuisine with authentic flavors`,
      cuisineTypes: cuisines[index],
      address: {
        street: `${100 + index * 10} Main Street`,
        city: cities[index % cities.length],
        state: 'NY',
        zipCode: `100${10 + index}`,
        country: 'USA',
        latitude: 40.7128 + (index * 0.01),
        longitude: -74.0060 + (index * 0.01)
      },
      status: index < 2 ? RestaurantStatus.PENDING_APPROVAL : RestaurantStatus.ACTIVE,
      kycStatus: index < 2 ? KYCStatus.SUBMITTED : KYCStatus.APPROVED,
      businessRegistrationNumber: `BR-2024-${String(1000 + index)}`,
      taxId: `TAX-${String(10000 + index)}`,
      fssaiLicense: `FSSAI-${String(100000 + index)}`,
      avgPreparationTime: 15 + (index * 2),
      minimumOrderValue: 10 + (index * 5),
      deliveryRadius: 5 + (index % 3),
      packagingCharges: 2 + (index % 3),
      rating: 4.2 + (Math.random() * 0.8),
      totalRatings: 500 + (index * 100),
      totalOrders: 1000 + (index * 500),
      completionRate: 92 + (Math.random() * 6),
      avgResponseTime: 5 + (index % 3),
      commissionRate: 18 + (index % 5),
      outstandingBalance: Math.random() * 5000,
      totalRevenue: 50000 + (index * 10000),
      approvedAt: index >= 2 ? new Date('2024-01-15') : undefined,
      approvedBy: index >= 2 ? 'admin-001' : undefined,
      createdAt: new Date(2024, 0, 15 + index),
      updatedAt: new Date(),
      lastOrderAt: new Date(),
      isAcceptingOrders: index < 8,
      isPureVeg: index % 3 === 0,
      hasParkingSpace: index % 2 === 0,
      hasOutdoorSeating: index % 3 === 1,
      images: []
    }));
  }

  private getMockDocuments(restaurantId: string): RestaurantDocument[] {
    return [
      {
        id: `doc-${restaurantId}-001`,
        restaurantId,
        type: 'BUSINESS_LICENSE' as any,
        fileName: 'business-license.pdf',
        fileUrl: '/mock/documents/business-license.pdf',
        uploadedAt: new Date('2024-11-01'),
        status: 'APPROVED',
        verifiedAt: new Date('2024-11-02'),
        verifiedBy: 'admin-004'
      },
      {
        id: `doc-${restaurantId}-002`,
        restaurantId,
        type: 'FOOD_SAFETY_CERTIFICATE' as any,
        fileName: 'fssai-certificate.pdf',
        fileUrl: '/mock/documents/fssai-certificate.pdf',
        uploadedAt: new Date('2024-11-01'),
        status: 'APPROVED',
        verifiedAt: new Date('2024-11-02'),
        verifiedBy: 'admin-004',
        expiryDate: new Date('2025-12-31')
      }
    ];
  }

  private getMockPerformanceMetrics(restaurantId: string, period: string): RestaurantPerformanceMetrics {
    const multiplier = period === 'TODAY' ? 1 : period === 'WEEK' ? 7 : period === 'MONTH' ? 30 : 365;
    
    return {
      restaurantId,
      period: period as any,
      totalOrders: 50 * multiplier,
      completedOrders: 47 * multiplier,
      cancelledOrders: 2 * multiplier,
      rejectedOrders: 1 * multiplier,
      revenue: 2500 * multiplier,
      commission: 450 * multiplier,
      avgOrderValue: 45,
      avgPreparationTime: 18,
      customerSatisfaction: 4.6,
      peakHours: [
        { hour: 12, orderCount: 8 },
        { hour: 13, orderCount: 12 },
        { hour: 19, orderCount: 15 },
        { hour: 20, orderCount: 18 }
      ]
    };
  }
}
