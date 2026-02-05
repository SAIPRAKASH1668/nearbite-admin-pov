import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Settlement, Refund, Payment, FinancialSummary, SettlementStatus } from '../models';

@Injectable({
  providedIn: 'root'
})
export class FinancialService {
  private mockSettlements: Settlement[] = this.generateMockSettlements();

  getSettlements(filters?: { status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' }): Observable<Settlement[]> {
    let filtered = [...this.mockSettlements];
    if (filters?.status) {
      filtered = filtered.filter(s => s.status === filters.status);
    }
    return of(filtered).pipe(delay(300));
  }

  getPendingSettlements(): Observable<Settlement[]> {
    return of(this.mockSettlements.filter(s => s.status === 'PENDING')).pipe(delay(300));
  }

  getFinancialSummary(): Observable<FinancialSummary> {
    return of(this.getMockSummary()).pipe(delay(350));
  }

  approveSettlement(settlementId: string): Observable<boolean> {
    const settlement = this.mockSettlements.find(s => s.id === settlementId);
    if (settlement) {
      settlement.status = SettlementStatus.PROCESSING;
      settlement.approvedBy = 'admin-001';
      settlement.approvedAt = new Date();
      settlement.updatedAt = new Date();
    }
    return of(true).pipe(delay(500));
  }

  rejectSettlement(settlementId: string, reason: string): Observable<boolean> {
    const settlement = this.mockSettlements.find(s => s.id === settlementId);
    if (settlement) {
      settlement.status = SettlementStatus.FAILED;
      settlement.rejectionReason = reason;
      settlement.updatedAt = new Date();
    }
    return of(true).pipe(delay(500));
  }

  private generateMockSettlements(): Settlement[] {
    const restaurants = [
      { id: 'rest-001', name: 'The Golden Spoon' },
      { id: 'rest-002', name: 'Bella Italia' },
      { id: 'rest-003', name: 'Sushi Paradise' },
      { id: 'rest-004', name: 'Spice Route' },
      { id: 'rest-005', name: 'Burger Haven' },
      { id: 'rest-006', name: 'Thai Orchid' },
      { id: 'rest-007', name: 'Mexican Fiesta' },
      { id: 'rest-008', name: 'French Bistro' },
      { id: 'rest-009', name: 'Korean BBQ' },
      { id: 'rest-010', name: 'Indian Palace' }
    ];

    const settlements: Settlement[] = [];
    const now = new Date();

    for (let i = 0; i < 20; i++) {
      const restaurant = restaurants[i % restaurants.length];
      const grossAmount = 1200 + Math.random() * 4800;
      const platformFee = grossAmount * 0.15;
      const deliveryFee = grossAmount * 0.08;
      const adjustments = i % 5 === 0 ? -50 : 0;
      const netAmount = grossAmount - platformFee - deliveryFee + adjustments;
      
      const periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - (i * 7 + 14));
      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 6);
      
      let status: SettlementStatus;
      if (i < 12) status = SettlementStatus.PENDING;
      else if (i < 15) status = SettlementStatus.PROCESSING;
      else if (i < 19) status = SettlementStatus.COMPLETED;
      else status = SettlementStatus.FAILED;

      settlements.push({
        id: `settle-${String(i + 1).padStart(4, '0')}`,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        periodStart,
        periodEnd,
        totalOrders: 45 + Math.floor(Math.random() * 100),
        grossRevenue: grossAmount,
        platformCommission: platformFee,
        deliveryCommission: deliveryFee,
        taxes: grossAmount * 0.02,
        adjustments,
        netPayable: netAmount,
        status,
        scheduledPayoutDate: new Date(periodEnd.getTime() + 3 * 24 * 60 * 60 * 1000),
        actualPayoutDate: status === SettlementStatus.COMPLETED ? new Date(periodEnd.getTime() + 4 * 24 * 60 * 60 * 1000) : undefined,
        utrNumber: status === SettlementStatus.COMPLETED ? `UTR${String(Math.floor(Math.random() * 1000000000000)).padStart(12, '0')}` : undefined,
        accountNumber: `****${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        ifscCode: `${['HDFC', 'ICIC', 'SBIN', 'AXIS'][Math.floor(Math.random() * 4)]}0000${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        accountHolderName: restaurant.name,
        approvedBy: status !== SettlementStatus.PENDING ? 'admin-001' : undefined,
        approvedAt: status !== SettlementStatus.PENDING ? new Date(periodEnd.getTime() + 24 * 60 * 60 * 1000) : undefined,
        rejectionReason: status === SettlementStatus.FAILED ? 'Invalid bank account details' : undefined,
        createdAt: periodEnd,
        updatedAt: new Date()
      });
    }

    return settlements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private getMockSummary(): FinancialSummary {
    return {
      period: 'MONTH',
      totalRevenue: 2847234.50,
      platformCommission: 427085.18,
      deliveryCommission: 227778.76,
      totalRefunds: 12450.00,
      pendingSettlements: 89450.00,
      completedSettlements: 445632.00,
      failedPayments: 3,
      netProfit: 2407455.50
    };
  }
}
