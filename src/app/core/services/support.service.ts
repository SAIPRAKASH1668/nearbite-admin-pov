import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { SupportTicket, TicketStatus, TicketPriority, TicketCategory, UserType } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private mockTickets: SupportTicket[] = this.generateMockTickets();

  getTickets(filters?: { status?: TicketStatus }): Observable<SupportTicket[]> {
    let filtered = [...this.mockTickets];
    if (filters?.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    return of(filtered).pipe(delay(300));
  }

  getOpenTickets(): Observable<SupportTicket[]> {
    return of(this.mockTickets.filter(t => t.status === TicketStatus.OPEN || t.status === TicketStatus.IN_PROGRESS)).pipe(delay(300));
  }

  private generateMockTickets(): SupportTicket[] {
    const tickets: SupportTicket[] = [];
    const userTypes = [UserType.CUSTOMER, UserType.RESTAURANT, UserType.RIDER];
    const categories = Object.values(TicketCategory);
    const priorities = Object.values(TicketPriority);
    const statuses = Object.values(TicketStatus);
    const subjects = [
      'Order not delivered',
      'Payment issue - double charge',
      'Account verification problem',
      'Wrong order received',
      'Refund not processed',
      'App crashing on checkout',
      'Unable to update menu',
      'Commission calculation error',
      'Delivery time exceeded SLA',
      'Customer harassment complaint',
      'Missing payment for completed orders',
      'Document verification stuck',
      'GPS not working',
      'Rating dispute',
      'Promotional credit not applied'
    ];

    const now = new Date();

    for (let i = 0; i < 60; i++) {
      const createdAt = new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000);
      const slaResponseTime = 30; // 30 minutes
      const slaResolutionTime = 240; // 4 hours
      
      let status: TicketStatus;
      if (i < 20) status = TicketStatus.OPEN;
      else if (i < 35) status = TicketStatus.IN_PROGRESS;
      else if (i < 50) status = TicketStatus.RESOLVED;
      else status = TicketStatus.CLOSED;

      const resolvedAt = status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED ? 
        new Date(createdAt.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000) : undefined;
      
      const slaBreached = status === TicketStatus.OPEN && 
        (now.getTime() - createdAt.getTime()) > (slaResolutionTime * 60 * 1000);

      tickets.push({
        id: `ticket-${String(i + 1).padStart(4, '0')}`,
        ticketNumber: `SUP-${String(10000 + i)}`,
        subject: subjects[i % subjects.length],
        description: 'Detailed description of the issue...',
        category: categories[i % categories.length],
        priority: priorities[i % priorities.length],
        status,
        userType: userTypes[i % userTypes.length],
        userId: `user-${String((i % 30) + 1).padStart(3, '0')}`,
        userName: `User ${(i % 30) + 1}`,
        userEmail: `user${(i % 30) + 1}@example.com`,
        userPhone: `+91-9${String(Math.floor(Math.random() * 900000000) + 100000000)}`,
        assignedTo: i % 2 === 0 ? `agent-${(i % 5) + 1}` : undefined,
        assignedToName: i % 2 === 0 ? `Support Agent ${(i % 5) + 1}` : undefined,
        assignedAt: i % 2 === 0 ? new Date(createdAt.getTime() + 60000) : undefined,
        createdAt,
        firstResponseAt: i % 2 === 0 ? new Date(createdAt.getTime() + 300000) : undefined,
        resolvedAt,
        closedAt: status === TicketStatus.CLOSED ? resolvedAt : undefined,
        slaBreached,
        slaResponseTime,
        slaResolutionTime,
        conversations: this.generateMockConversations(i + 1),
        resolutionSummary: resolvedAt ? 'Issue resolved successfully' : undefined,
        customerSatisfactionRating: resolvedAt ? Math.floor(Math.random() * 3) + 3 : undefined,
        isFraudulent: false,
        requiresEscalation: false,
        escalatedTo: undefined,
        escalatedAt: undefined,
        tags: ['customer-support'],
        updatedAt: resolvedAt || new Date()
      });
    }

    return tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private generateMockConversations(ticketId: number): any[] {
    const count = 1 + Math.floor(Math.random() * 5);
    return Array(count).fill(null);
  }
}
