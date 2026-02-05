/**
 * Admin User Model
 * Represents internal NearBite admin users with role-based access
 */

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  FINANCE_TEAM = 'FINANCE_TEAM',
  SUPPORT_TEAM = 'SUPPORT_TEAM',
  OPERATIONS_TEAM = 'OPERATIONS_TEAM',
  CONTENT_TEAM = 'CONTENT_TEAM',
  READ_ONLY_ANALYST = 'READ_ONLY_ANALYST'
}

export enum AdminStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE'
}

export interface AdminPermission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete' | 'approve' | 'export')[];
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: AdminRole;
  status: AdminStatus;
  permissions: AdminPermission[];
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  profilePicture?: string;
  department?: string;
  employeeId?: string;
}

export interface AdminSession {
  userId: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  token: string;
  expiresAt: Date;
}
