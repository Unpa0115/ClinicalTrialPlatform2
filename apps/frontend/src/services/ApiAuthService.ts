import { UserProfile, LoginCredentials, ChangePasswordData } from './AuthService';

export interface LoginResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  idToken: string;
  user: {
    userId: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string;
  };
}

export interface ApiUserProfile extends UserProfile {
  userId: string;
  displayName: string;
  title: string;
  department?: string;
  status: string;
  primaryOrganizationId: string;
  accessibleOrganizations: string[];
  permissions: string[];
  language: string;
  timezone: string;
  lastLoginAt?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class ApiAuthService {
  private static instance: ApiAuthService;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  private constructor() {
    // Load tokens from localStorage on initialization
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  public static getInstance(): ApiAuthService {
    if (!ApiAuthService.instance) {
      ApiAuthService.instance = new ApiAuthService();
    }
    return ApiAuthService.instance;
  }

  /**
   * Sign in user with username and password
   */
  async signIn(credentials: LoginCredentials): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Login failed');
      }

      const data: LoginResponse = await response.json();

      // Store tokens
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      return { isSignedIn: true, nextStep: null };
    } catch (error) {
      console.error('Sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      // Call logout endpoint if we have a token
      if (this.accessToken) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local cleanup even if API call fails
    } finally {
      // Clear tokens and local storage
      this.accessToken = null;
      this.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userProfile');
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<any | null> {
    return this.isAuthenticated() ? { username: 'current_user' } : null;
  }

  /**
   * Get current user session
   */
  async getCurrentSession(): Promise<any | null> {
    if (!this.accessToken) return null;
    
    return {
      tokens: {
        accessToken: { toString: () => this.accessToken },
        idToken: { toString: () => this.accessToken },
      }
    };
  }

  /**
   * Get current user's access token
   */
  async getAccessToken(): Promise<string | null> {
    return this.accessToken;
  }

  /**
   * Get current user's ID token
   */
  async getIdToken(): Promise<string | null> {
    return this.accessToken; // Using access token as ID token for simplicity
  }

  /**
   * Get user profile information
   */
  async getUserProfile(): Promise<ApiUserProfile | null> {
    try {
      if (!this.accessToken) return null;

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, clear auth state
          await this.signOut();
          return null;
        }
        throw new Error('Failed to get user profile');
      }

      const data = await response.json();
      const profile: ApiUserProfile = {
        ...data.user,
        sub: data.user.userId,
        organizationId: data.user.primaryOrganizationId,
        groups: [data.user.role],
      };

      // Cache profile for offline access
      localStorage.setItem('userProfile', JSON.stringify(profile));
      
      return profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      // Try to get cached profile
      const cachedProfile = localStorage.getItem('userProfile');
      if (cachedProfile) {
        try {
          return JSON.parse(cachedProfile);
        } catch (parseError) {
          console.error('Error parsing cached profile:', parseError);
          localStorage.removeItem('userProfile');
        }
      }
      return null;
    }
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Password change failed');
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Initiate forgot password flow
   */
  async forgotPassword(username: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Password reset failed');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Confirm forgot password with verification code
   */
  async confirmForgotPassword(username: string, code: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/confirm-forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          confirmationCode: code,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Password confirmation failed');
      }
    } catch (error) {
      console.error('Confirm forgot password error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return !!this.accessToken;
  }

  /**
   * Refresh user session
   */
  async refreshSession(): Promise<any | null> {
    try {
      if (!this.refreshToken) return null;

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      });

      if (!response.ok) {
        // Refresh failed, clear auth state
        await this.signOut();
        return null;
      }

      const data = await response.json();
      this.accessToken = data.accessToken;
      localStorage.setItem('accessToken', data.accessToken);

      return {
        tokens: {
          accessToken: { toString: () => this.accessToken },
        }
      };
    } catch (error) {
      console.error('Error refreshing session:', error);
      await this.signOut();
      return null;
    }
  }

  /**
   * Set up automatic token refresh
   */
  setupTokenRefresh(): void {
    // Refresh token 5 minutes before expiry
    const REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds

    setInterval(async () => {
      try {
        if (this.accessToken) {
          // Parse token to get expiry
          const payload = this.decodeJWTPayload(this.accessToken);
          const expiryTime = payload.exp * 1000; // Convert to milliseconds
          const currentTime = Date.now();
          
          if (expiryTime - currentTime <= REFRESH_BUFFER) {
            await this.refreshSession();
            console.log('Token refreshed automatically');
          }
        }
      } catch (error) {
        console.error('Auto refresh error:', error);
      }
    }, 60000); // Check every minute
  }

  /**
   * Safely decode JWT token payload
   */
  private decodeJWTPayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      // Add padding if needed for base64 decoding
      let payload = parts[1];
      while (payload.length % 4) {
        payload += '=';
      }

      // Replace URL-safe characters
      payload = payload.replace(/-/g, '+').replace(/_/g, '/');

      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('JWT decode error:', error);
      throw new Error('Failed to decode JWT token');
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: any): Error {
    const message = error.message || error.toString();
    
    // Map common error messages to user-friendly messages
    const errorMap: Record<string, string> = {
      'Authentication failed: User not found': 'Incorrect username or password.',
      'User not found': 'Incorrect username or password.',
      'Invalid username or password': 'Incorrect username or password.',
      'Password does not meet requirements': 'Password does not meet requirements.',
      'Too many attempts': 'Too many attempts. Please try again later.',
      'Invalid verification code': 'Invalid verification code.',
      'Verification code has expired': 'Verification code has expired.'
    };

    for (const [errorText, userMessage] of Object.entries(errorMap)) {
      if (message.includes(errorText)) {
        return new Error(userMessage);
      }
    }

    return new Error(message);
  }

  /**
   * Get authorization header for API requests
   */
  async getAuthorizationHeader(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    if (token) {
      return {
        'Authorization': `Bearer ${token}`
      };
    }
    return {};
  }
}

// Export singleton instance
export const apiAuthService = ApiAuthService.getInstance();