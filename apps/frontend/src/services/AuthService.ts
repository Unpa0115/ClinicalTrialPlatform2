// Use API-based authentication instead of direct Amplify
import { apiAuthService, ApiUserProfile } from './ApiAuthService';

export interface UserProfile {
  sub: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
  role?: string;
  groups?: string[];
  [key: string]: any;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignUpData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export class AuthService {
  private static instance: AuthService;

  private constructor() {
    // Delegate to API auth service
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Sign in user with username and password
   */
  async signIn(credentials: LoginCredentials): Promise<any> {
    return await apiAuthService.signIn(credentials);
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    return await apiAuthService.signOut();
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<any | null> {
    return await apiAuthService.getCurrentUser();
  }

  /**
   * Get current user session
   */
  async getCurrentSession(): Promise<any | null> {
    return await apiAuthService.getCurrentSession();
  }

  /**
   * Get current user's access token
   */
  async getAccessToken(): Promise<string | null> {
    return await apiAuthService.getAccessToken();
  }

  /**
   * Get current user's ID token
   */
  async getIdToken(): Promise<string | null> {
    return await apiAuthService.getIdToken();
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
   * Get user profile information
   */
  async getUserProfile(): Promise<UserProfile | null> {
    return await apiAuthService.getUserProfile();
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    return await apiAuthService.changePassword(data);
  }

  /**
   * Initiate forgot password flow
   */
  async forgotPassword(username: string): Promise<void> {
    return await apiAuthService.forgotPassword(username);
  }

  /**
   * Confirm forgot password with verification code
   */
  async confirmForgotPassword(username: string, code: string, newPassword: string): Promise<void> {
    return await apiAuthService.confirmForgotPassword(username, code, newPassword);
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await apiAuthService.isAuthenticated();
  }

  /**
   * Refresh user session
   */
  async refreshSession(): Promise<any | null> {
    return await apiAuthService.refreshSession();
  }

  /**
   * Set up automatic token refresh
   */
  setupTokenRefresh(): void {
    apiAuthService.setupTokenRefresh();
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: any): Error {
    const message = error.message || error.toString();
    
    // Map common Cognito error codes to user-friendly messages
    const errorMap: Record<string, string> = {
      'UserNotConfirmedException': 'Please confirm your account before signing in.',
      'PasswordResetRequiredException': 'Password reset is required.',
      'NotAuthorizedException': 'Invalid username or password.',
      'UserNotFoundException': 'User not found.',
      'InvalidPasswordException': 'Password does not meet requirements.',
      'LimitExceededException': 'Too many attempts. Please try again later.',
      'TooManyRequestsException': 'Too many requests. Please try again later.',
      'InvalidParameterException': 'Invalid parameters provided.',
      'CodeMismatchException': 'Invalid verification code.',
      'ExpiredCodeException': 'Verification code has expired.'
    };

    for (const [code, userMessage] of Object.entries(errorMap)) {
      if (message.includes(code)) {
        return new Error(userMessage);
      }
    }

    return new Error(message);
  }

  /**
   * Get authorization header for API requests
   */
  async getAuthorizationHeader(): Promise<Record<string, string>> {
    return await apiAuthService.getAuthorizationHeader();
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();