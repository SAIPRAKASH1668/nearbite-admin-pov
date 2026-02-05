import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, delay } from 'rxjs';
import { AdminUser, AdminRole, AdminStatus, AdminSession, AdminPermission } from '../models';

/**
 * Mock Authentication Service
 * Handles admin authentication and role-based access control
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AdminUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private sessionSubject = new BehaviorSubject<AdminSession | null>(null);
  public session$ = this.sessionSubject.asObservable();

  constructor() {
    // Check if user is already logged in
    const storedSession = localStorage.getItem('admin_session');
    if (storedSession) {
      const session = JSON.parse(storedSession);
      this.sessionSubject.next(session);
      this.loadUserProfile(session.userId);
    }
  }

  login(email: string, password: string): Observable<{ success: boolean; session?: AdminSession; error?: string }> {
    // Mock authentication - in production, this would call backend API
    return of(this.mockLogin(email, password)).pipe(delay(500));
  }

  private mockLogin(email: string, password: string): { success: boolean; session?: AdminSession; error?: string } {
    // Mock user credentials
    const mockUsers = this.getMockUsers();
    const user = mockUsers.find(u => u.email === email);

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (user.status !== AdminStatus.ACTIVE) {
      return { success: false, error: 'Account is suspended or inactive' };
    }

    // Create session
    const session: AdminSession = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      token: `mock_token_${Date.now()}`,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours
    };

    // Store session
    localStorage.setItem('admin_session', JSON.stringify(session));
    this.sessionSubject.next(session);
    this.currentUserSubject.next(user);

    return { success: true, session };
  }

  logout(): void {
    localStorage.removeItem('admin_session');
    this.sessionSubject.next(null);
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    const session = this.sessionSubject.value;
    if (!session) return false;
    return new Date(session.expiresAt) > new Date();
  }

  hasPermission(resource: string, action: string): boolean {
    const session = this.sessionSubject.value;
    if (!session) return false;

    // Super admin has all permissions
    if (session.role === AdminRole.SUPER_ADMIN) return true;

    // Check specific permissions
    return session.permissions.some(
      p => p.resource === resource && p.actions.includes(action as any)
    );
  }

  hasRole(role: AdminRole): boolean {
    const session = this.sessionSubject.value;
    return session?.role === role;
  }

  private loadUserProfile(userId: string): void {
    const users = this.getMockUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  getCurrentUser(): AdminUser | null {
    return this.currentUserSubject.value;
  }

  private getMockUsers(): AdminUser[] {
    return [
      {
        id: 'admin-001',
        email: 'admin@nearbite.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        phone: '+1-555-0100',
        role: AdminRole.SUPER_ADMIN,
        status: AdminStatus.ACTIVE,
        permissions: [], // Super admin has all permissions
        lastLogin: new Date(),
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        department: 'Administration',
        employeeId: 'NB001'
      },
      {
        id: 'admin-002',
        email: 'finance@nearbite.com',
        firstName: 'Michael',
        lastName: 'Chen',
        phone: '+1-555-0101',
        role: AdminRole.FINANCE_TEAM,
        status: AdminStatus.ACTIVE,
        permissions: [
          { resource: 'settlements', actions: ['read', 'approve'] },
          { resource: 'refunds', actions: ['read', 'approve'] },
          { resource: 'payments', actions: ['read'] },
          { resource: 'commissions', actions: ['read', 'update'] },
          { resource: 'reports', actions: ['read', 'export'] }
        ],
        lastLogin: new Date(),
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date(),
        department: 'Finance',
        employeeId: 'NB002'
      },
      {
        id: 'admin-003',
        email: 'support@nearbite.com',
        firstName: 'Emily',
        lastName: 'Rodriguez',
        phone: '+1-555-0102',
        role: AdminRole.SUPPORT_TEAM,
        status: AdminStatus.ACTIVE,
        permissions: [
          { resource: 'tickets', actions: ['read', 'create', 'update'] },
          { resource: 'customers', actions: ['read', 'update'] },
          { resource: 'orders', actions: ['read', 'update'] },
          { resource: 'refunds', actions: ['read', 'create'] }
        ],
        lastLogin: new Date(),
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date(),
        department: 'Customer Support',
        employeeId: 'NB003'
      },
      {
        id: 'admin-004',
        email: 'operations@nearbite.com',
        firstName: 'David',
        lastName: 'Kumar',
        phone: '+1-555-0103',
        role: AdminRole.OPERATIONS_TEAM,
        status: AdminStatus.ACTIVE,
        permissions: [
          { resource: 'restaurants', actions: ['read', 'update', 'approve'] },
          { resource: 'riders', actions: ['read', 'update', 'approve'] },
          { resource: 'orders', actions: ['read', 'update'] },
          { resource: 'analytics', actions: ['read'] }
        ],
        lastLogin: new Date(),
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date(),
        department: 'Operations',
        employeeId: 'NB004'
      },
      {
        id: 'admin-005',
        email: 'content@nearbite.com',
        firstName: 'Jessica',
        lastName: 'Williams',
        phone: '+1-555-0104',
        role: AdminRole.CONTENT_TEAM,
        status: AdminStatus.ACTIVE,
        permissions: [
          { resource: 'banners', actions: ['read', 'create', 'update', 'delete'] },
          { resource: 'campaigns', actions: ['read', 'create', 'update', 'delete'] },
          { resource: 'featured', actions: ['read', 'create', 'update', 'delete'] },
          { resource: 'restaurants', actions: ['read'] }
        ],
        lastLogin: new Date(),
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date(),
        department: 'Marketing',
        employeeId: 'NB005'
      }
    ];
  }
}
