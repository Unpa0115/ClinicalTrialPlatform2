import { authService } from './AuthService.js';

export interface User {
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  title: string;
  department?: string;
  specialization?: string;
  licenseNumber?: string;
  role: 'super_admin' | 'study_admin' | 'org_admin' | 'investigator' | 'coordinator' | 'data_entry' | 'viewer';
  status: 'active' | 'inactive' | 'pending_activation' | 'suspended' | 'locked';
  primaryOrganizationId: string;
  accessibleOrganizations: string[];
  accessibleStudies: string[];
  permissions: string[];
  language: 'ja' | 'en';
  timezone: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  title: string;
  primaryOrganizationId: string;
  role: User['role'];
  department?: string;
  specialization?: string;
  licenseNumber?: string;
  temporaryPassword?: string;
  language?: 'ja' | 'en';
  timezone?: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  department?: string;
  specialization?: string;
  licenseNumber?: string;
  primaryOrganizationId?: string;
  role?: User['role'];
  language?: 'ja' | 'en';
  timezone?: string;
  status?: User['status'];
}

export interface UserListResponse {
  success: boolean;
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface UserResponse {
  success: boolean;
  user: User;
}

export interface SetPasswordRequest {
  password: string;
  permanent: boolean;
}

export interface ActiveSession {
  sessionId: string;
  userId: string;
  username: string;
  email: string;
  role: string;
  organizationId: string;
  expiresAt: string;
}

export interface SessionsResponse {
  success: boolean;
  sessions: ActiveSession[];
}

export class UserManagementService {
  private static instance: UserManagementService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  public static getInstance(): UserManagementService {
    if (!UserManagementService.instance) {
      UserManagementService.instance = new UserManagementService();
    }
    return UserManagementService.instance;
  }

  /**
   * Get authorization headers
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const authHeaders = await authService.getAuthorizationHeader();
    return {
      'Content-Type': 'application/json',
      ...authHeaders
    };
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (error.response?.data?.error) {
      return new Error(error.response.data.error);
    }
    return new Error(error.message || 'An error occurred');
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/api/auth/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const data: UserResponse = await response.json();
      return data.user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get list of users
   */
  async getUsers(organizationId?: string, page: number = 1, limit: number = 10): Promise<UserListResponse> {
    try {
      const headers = await this.getHeaders();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (organizationId) {
        params.append('organizationId', organizationId);
      }

      const response = await fetch(`${this.baseUrl}/api/auth/users?${params}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/api/auth/users/${userId}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user');
      }

      const data: UserResponse = await response.json();
      return data.user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, updates: UpdateUserRequest): Promise<User> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/api/auth/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      const data: UserResponse = await response.json();
      return data.user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Set user password (Admin only)
   */
  async setUserPassword(userId: string, passwordData: SetPasswordRequest): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/api/auth/users/${userId}/password`, {
        method: 'POST',
        headers,
        body: JSON.stringify(passwordData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set password');
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUserProfile(): Promise<User> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/api/auth/me`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch profile');
      }

      const data: UserResponse = await response.json();
      return data.user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Sync user data from Cognito (Admin only)
   */
  async syncUserFromCognito(username: string): Promise<User> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/api/auth/sync/${username}`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync user');
      }

      const data: UserResponse = await response.json();
      return data.user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get active sessions (Admin only)
   */
  async getActiveSessions(): Promise<ActiveSession[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/api/auth/sessions`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch sessions');
      }

      const data: SessionsResponse = await response.json();
      return data.sessions;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Terminate session (Admin only)
   */
  async terminateSession(sessionId: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to terminate session');
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Terminate all user sessions (Admin only)
   */
  async terminateUserSessions(userId: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/api/auth/users/${userId}/sessions`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to terminate user sessions');
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get role display name
   */
  getRoleDisplayName(role: User['role']): string {
    const roleNames: Record<User['role'], string> = {
      'super_admin': 'Super Administrator',
      'study_admin': 'Study Administrator',
      'org_admin': 'Organization Administrator',
      'investigator': 'Principal Investigator',
      'coordinator': 'Study Coordinator',
      'data_entry': 'Data Entry Specialist',
      'viewer': 'Viewer'
    };
    return roleNames[role] || role;
  }

  /**
   * Get status display name
   */
  getStatusDisplayName(status: User['status']): string {
    const statusNames: Record<User['status'], string> = {
      'active': 'Active',
      'inactive': 'Inactive',
      'pending_activation': 'Pending Activation',
      'suspended': 'Suspended',
      'locked': 'Locked'
    };
    return statusNames[status] || status;
  }

  /**
   * Get available roles for current user
   */
  getAvailableRoles(currentUserRole: User['role']): User['role'][] {
    const roleHierarchy: Record<User['role'], User['role'][]> = {
      'super_admin': ['super_admin', 'study_admin', 'org_admin', 'investigator', 'coordinator', 'data_entry', 'viewer'],
      'study_admin': ['study_admin', 'org_admin', 'investigator', 'coordinator', 'data_entry', 'viewer'],
      'org_admin': ['org_admin', 'investigator', 'coordinator', 'data_entry', 'viewer'],
      'investigator': ['investigator', 'coordinator', 'data_entry', 'viewer'],
      'coordinator': ['coordinator', 'data_entry', 'viewer'],
      'data_entry': ['data_entry', 'viewer'],
      'viewer': ['viewer']
    };
    return roleHierarchy[currentUserRole] || [];
  }
}

// Export singleton instance
export const userManagementService = UserManagementService.getInstance();