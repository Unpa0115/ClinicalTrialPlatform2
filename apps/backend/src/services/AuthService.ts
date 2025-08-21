import { CognitoService, createCognitoService } from '../config/cognito.js';
import { UserRepository, UserRecord, CreateUserWithCognitoRequest } from '../repositories/UserRepository.js';
import { RepositoryFactory } from '../repositories/index.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
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
    permissions: string[];
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface PasswordResetRequest {
  username: string;
}

export interface ConfirmPasswordResetRequest {
  username: string;
  confirmationCode: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  username: string;
  oldPassword: string;
  newPassword: string;
}

export interface SessionInfo {
  userId: string;
  username: string;
  email: string;
  role: string;
  organizationId: string;
  groups: string[];
  permissions: string[];
  sessionId: string;
  expiresAt: Date;
}

/**
 * Authentication Service
 * Handles user authentication, session management, and token operations
 */
export class AuthService {
  private cognitoService: CognitoService;
  private userRepository: UserRepository;
  private activeSessions: Map<string, SessionInfo> = new Map();

  constructor() {
    this.cognitoService = createCognitoService();
    this.userRepository = RepositoryFactory.getInstance().getUserRepository();
  }

  /**
   * Authenticate user with username/password using Cognito
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      // Authenticate with Cognito
      const cognitoResult = await this.cognitoService.authenticateUser({
        username: request.username,
        password: request.password
      });

      // Get user details from Cognito ID token
      const idTokenPayload = cognitoResult.idTokenPayload;
      const cognitoSub = idTokenPayload.sub;

      // Find or create user record in our database
      let user = await this.userRepository.findByCognitoSub(cognitoSub);
      
      if (!user) {
        // Create user record from Cognito data if it doesn't exist
        const userData = {
          cognitoSub,
          username: idTokenPayload['cognito:username'] || request.username,
          email: idTokenPayload.email,
          firstName: idTokenPayload.given_name || '',
          lastName: idTokenPayload.family_name || '',
          role: idTokenPayload['custom:role'] || 'user',
          primaryOrganizationId: idTokenPayload['custom:organization_id'] || 'default',
          status: 'active',
          cognitoGroups: cognitoResult.accessTokenPayload['cognito:groups'] || [],
          permissions: ['read'], // Default permissions
          entityType: 'user',
          isActive: true,
          language: 'ja',
          timezone: 'Asia/Tokyo'
        };

        // Since Cognito authentication already succeeded, just create the DynamoDB record
        // Create a new user record directly in DynamoDB using BaseRepository methods
        const userId = `user-${userData.username}-${Date.now()}`;
        const userRecord = {
          ...userData,
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          updatedBy: 'system'
        };
        
        await this.userRepository.create(userRecord);
        user = userRecord;
      } else {
        // Update user's last login time and sync Cognito groups
        await this.userRepository.updateUserWithCognito(
          user.userId,
          { 
            lastLoginAt: new Date().toISOString(),
            cognitoGroups: cognitoResult.accessTokenPayload['cognito:groups'] || []
          },
          'system'
        );
      }

      if (user.status !== 'active') {
        throw new Error('User account is not active');
      }

      // Create session info
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const sessionInfo: SessionInfo = {
        userId: user.cognitoSub,
        username: user.username,
        email: user.email,
        role: user.role,
        organizationId: user.primaryOrganizationId,
        groups: user.cognitoGroups || [],
        permissions: user.permissions || [],
        sessionId,
        expiresAt
      };

      // Store session
      this.activeSessions.set(sessionId, sessionInfo);

      return {
        accessToken: cognitoResult.accessToken,
        refreshToken: cognitoResult.refreshToken,
        idToken: cognitoResult.idToken,
        user: {
          userId: user.userId,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.primaryOrganizationId,
          permissions: user.permissions || []
        }
      };

    } catch (error) {
      console.error('Login error:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(request: RefreshTokenRequest): Promise<Partial<LoginResponse>> {
    try {
      // Decode refresh token to get session info
      const decoded = jwt.decode(request.refreshToken) as any;
      
      if (!decoded || !decoded.sessionId) {
        throw new Error('Invalid refresh token');
      }

      const sessionInfo = this.activeSessions.get(decoded.sessionId);
      if (!sessionInfo) {
        throw new Error('Session not found or expired');
      }

      if (sessionInfo.expiresAt < new Date()) {
        this.activeSessions.delete(decoded.sessionId);
        throw new Error('Session expired');
      }

      // Get updated user info
      const user = await this.userRepository.findByCognitoSub(sessionInfo.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new access token
      const accessToken = this.generateMockAccessToken(user, sessionInfo.sessionId);

      return {
        accessToken,
        user: {
          userId: user.userId,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.primaryOrganizationId,
          permissions: user.permissions
        }
      };

    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(sessionId: string): Promise<void> {
    try {
      this.activeSessions.delete(sessionId);
      // In production, you would also invalidate the Cognito session
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  /**
   * Initiate password reset
   */
  async initiatePasswordReset(request: PasswordResetRequest): Promise<void> {
    try {
      // In production, use Cognito's forgot password flow
      // await this.cognitoService.forgotPassword(request.username);
      
      // For now, just validate user exists
      const user = await this.userRepository.findByUsername(request.username);
      if (!user) {
        // Don't reveal if user exists or not for security
        console.log(`Password reset requested for non-existent user: ${request.username}`);
      }

      // In production, Cognito would send reset email
      console.log(`Password reset initiated for user: ${request.username}`);
      
    } catch (error) {
      console.error('Password reset initiation error:', error);
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  /**
   * Confirm password reset with code
   */
  async confirmPasswordReset(request: ConfirmPasswordResetRequest): Promise<void> {
    try {
      // In production, use Cognito's confirm forgot password flow
      // await this.cognitoService.confirmForgotPassword(
      //   request.username,
      //   request.confirmationCode,
      //   request.newPassword
      // );

      const user = await this.userRepository.findByUsername(request.username);
      if (user) {
        // Set new password in Cognito
        await this.cognitoService.setUserPassword(request.username, request.newPassword, true);
      }

    } catch (error) {
      console.error('Password reset confirmation error:', error);
      throw new Error(`Password reset confirmation failed: ${error.message}`);
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(request: ChangePasswordRequest): Promise<void> {
    try {
      // In production, use Cognito's change password flow
      // This would require the user's current session
      
      const user = await this.userRepository.findByUsername(request.username);
      if (!user) {
        throw new Error('User not found');
      }

      // Set new password in Cognito
      await this.cognitoService.setUserPassword(request.username, request.newPassword, true);

    } catch (error) {
      console.error('Password change error:', error);
      throw new Error(`Password change failed: ${error.message}`);
    }
  }

  /**
   * Validate session and return user info
   */
  async validateSession(sessionId: string): Promise<SessionInfo | null> {
    try {
      const sessionInfo = this.activeSessions.get(sessionId);
      
      if (!sessionInfo) {
        return null;
      }

      if (sessionInfo.expiresAt < new Date()) {
        this.activeSessions.delete(sessionId);
        return null;
      }

      return sessionInfo;

    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  /**
   * Get all active sessions for monitoring
   */
  getActiveSessions(): SessionInfo[] {
    const now = new Date();
    const activeSessions: SessionInfo[] = [];

    for (const [sessionId, sessionInfo] of this.activeSessions.entries()) {
      if (sessionInfo.expiresAt > now) {
        activeSessions.push(sessionInfo);
      } else {
        // Clean up expired sessions
        this.activeSessions.delete(sessionId);
      }
    }

    return activeSessions;
  }

  /**
   * Terminate specific session (admin function)
   */
  async terminateSession(sessionId: string): Promise<void> {
    this.activeSessions.delete(sessionId);
  }

  /**
   * Terminate all sessions for a user (admin function)
   */
  async terminateUserSessions(userId: string): Promise<void> {
    for (const [sessionId, sessionInfo] of this.activeSessions.entries()) {
      if (sessionInfo.userId === userId) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  /**
   * Generate mock access token (for development)
   * In production, tokens would come from Cognito
   */
  private generateMockAccessToken(user: UserRecord, sessionId: string): string {
    const payload = {
      sub: user.cognitoSub,
      'cognito:username': user.username,
      email: user.email,
      'cognito:groups': user.cognitoGroups,
      'custom:organization_id': user.primaryOrganizationId,
      'custom:role': user.role,
      token_use: 'access',
      iss: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
      aud: process.env.COGNITO_BACKEND_CLIENT_ID,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      iat: Math.floor(Date.now() / 1000),
      sessionId
    };

    return jwt.sign(payload, 'mock-secret-key');
  }

  /**
   * Generate mock refresh token (for development)
   */
  private generateMockRefreshToken(user: UserRecord, sessionId: string): string {
    const payload = {
      sub: user.cognitoSub,
      token_use: 'refresh',
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
      iat: Math.floor(Date.now() / 1000),
      sessionId
    };

    return jwt.sign(payload, 'mock-secret-key');
  }

  /**
   * Generate mock ID token (for development)
   */
  private generateMockIdToken(user: UserRecord, sessionId: string): string {
    const payload = {
      sub: user.cognitoSub,
      'cognito:username': user.username,
      email: user.email,
      given_name: user.firstName,
      family_name: user.lastName,
      'custom:organization_id': user.primaryOrganizationId,
      'custom:role': user.role,
      token_use: 'id',
      iss: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
      aud: process.env.COGNITO_BACKEND_CLIENT_ID,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      iat: Math.floor(Date.now() / 1000),
      sessionId
    };

    return jwt.sign(payload, 'mock-secret-key');
  }
}

// Singleton instance
let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
}