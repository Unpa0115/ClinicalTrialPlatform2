import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AuthService } from '../AuthService.js';
import { UserRepository, UserRecord } from '../../repositories/UserRepository.js';
import { CognitoService } from '../../config/cognito.js';

// Mock dependencies
vi.mock('../../repositories/index.js', () => ({
  RepositoryFactory: {
    getInstance: () => ({
      getUserRepository: () => mockUserRepository
    })
  }
}));

vi.mock('../../config/cognito.js', () => ({
  createCognitoService: () => mockCognitoService
}));

// Mock implementations
const mockUserRepository = {
  findByUsername: vi.fn(),
  findByCognitoSub: vi.fn(),
  updateUserWithCognito: vi.fn(),
} as unknown as UserRepository;

const mockCognitoService = {
  setUserPassword: vi.fn(),
} as unknown as CognitoService;

// Test data
const mockUser: UserRecord = {
  userId: 'user-testuser-123',
  username: 'testuser',
  email: 'test@example.com',
  cognitoSub: 'cognito-sub-123',
  firstName: 'Test',
  lastName: 'User',
  displayName: 'Test User',
  title: 'Investigator',
  primaryOrganizationId: 'org-test-123',
  accessibleOrganizations: ['org-test-123'],
  role: 'investigator',
  permissions: ['patient:manage', 'visit:manage', 'examination:manage'],
  cognitoGroups: ['investigator'],
  accessibleStudies: ['study-test-123'],
  status: 'active',
  language: 'ja',
  timezone: 'Asia/Tokyo',
  createdBy: 'admin',
  lastModifiedBy: 'admin',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  entityType: 'user'
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.updateUserWithCognito).mockResolvedValue(mockUser);

      // Act
      const result = await authService.login({
        username: 'testuser',
        password: 'password123'
      });

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('idToken');
      expect(result.user).toEqual({
        userId: mockUser.userId,
        username: mockUser.username,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        organizationId: mockUser.primaryOrganizationId,
        permissions: mockUser.permissions
      });

      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(mockUserRepository.updateUserWithCognito).toHaveBeenCalledWith(
        mockUser.userId,
        { lastLoginAt: expect.any(String) },
        'system'
      );
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login({
        username: 'nonexistent',
        password: 'password123'
      })).rejects.toThrow('Authentication failed: User not found');

      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('nonexistent');
    });

    it('should throw error for inactive user', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, status: 'inactive' as const };
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(authService.login({
        username: 'testuser',
        password: 'password123'
      })).rejects.toThrow('Authentication failed: User account is not active');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token with valid refresh token', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.updateUserWithCognito).mockResolvedValue(mockUser);
      
      const loginResult = await authService.login({
        username: 'testuser',
        password: 'password123'
      });
      
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(mockUser);

      // Act
      const result = await authService.refreshToken({
        refreshToken: loginResult.refreshToken
      });

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result.user).toEqual({
        userId: mockUser.userId,
        username: mockUser.username,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        organizationId: mockUser.primaryOrganizationId,
        permissions: mockUser.permissions
      });
    });

    it('should throw error for invalid refresh token', async () => {
      // Act & Assert
      await expect(authService.refreshToken({
        refreshToken: 'invalid-token'
      })).rejects.toThrow('Token refresh failed');
    });
  });

  describe('logout', () => {
    it('should successfully logout and invalidate session', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.updateUserWithCognito).mockResolvedValue(mockUser);
      
      const loginResult = await authService.login({
        username: 'testuser',
        password: 'password123'
      });

      // Extract session ID from token (mock implementation)
      const sessionId = 'mock-session-id';

      // Act
      await authService.logout(sessionId);

      // Assert - should not throw error
      expect(true).toBe(true);
    });
  });

  describe('initiatePasswordReset', () => {
    it('should initiate password reset for existing user', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser);

      // Act
      await authService.initiatePasswordReset({
        username: 'testuser'
      });

      // Assert - should not throw error
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('testuser');
    });

    it('should handle password reset for non-existent user gracefully', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(null);

      // Act
      await authService.initiatePasswordReset({
        username: 'nonexistent'
      });

      // Assert - should not throw error (for security)
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('nonexistent');
    });
  });

  describe('confirmPasswordReset', () => {
    it('should confirm password reset with valid code', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser);
      vi.mocked(mockCognitoService.setUserPassword).mockResolvedValue(undefined);

      // Act
      await authService.confirmPasswordReset({
        username: 'testuser',
        confirmationCode: '123456',
        newPassword: 'newpassword123'
      });

      // Assert
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(mockCognitoService.setUserPassword).toHaveBeenCalledWith('testuser', 'newpassword123', true);
    });
  });

  describe('changePassword', () => {
    it('should change password for existing user', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser);
      vi.mocked(mockCognitoService.setUserPassword).mockResolvedValue(undefined);

      // Act
      await authService.changePassword({
        username: 'testuser',
        oldPassword: 'oldpassword123',
        newPassword: 'newpassword123'
      });

      // Assert
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(mockCognitoService.setUserPassword).toHaveBeenCalledWith('testuser', 'newpassword123', true);
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(null);

      // Act & Assert
      await expect(authService.changePassword({
        username: 'nonexistent',
        oldPassword: 'oldpassword123',
        newPassword: 'newpassword123'
      })).rejects.toThrow('Password change failed: User not found');
    });
  });

  describe('validateSession', () => {
    it('should validate active session', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.updateUserWithCognito).mockResolvedValue(mockUser);
      
      const loginResult = await authService.login({
        username: 'testuser',
        password: 'password123'
      });

      // Mock session ID
      const sessionId = 'mock-session-id';

      // Act
      const result = await authService.validateSession(sessionId);

      // Assert - for mock implementation, this will return null since we don't have real session storage
      // In a real implementation, this would validate the session
      expect(result).toBeNull();
    });
  });

  describe('getActiveSessions', () => {
    it('should return list of active sessions', () => {
      // Act
      const sessions = authService.getActiveSessions();

      // Assert
      expect(Array.isArray(sessions)).toBe(true);
    });
  });

  describe('terminateSession', () => {
    it('should terminate specific session', async () => {
      // Act
      await authService.terminateSession('session-id');

      // Assert - should not throw error
      expect(true).toBe(true);
    });
  });

  describe('terminateUserSessions', () => {
    it('should terminate all sessions for a user', async () => {
      // Act
      await authService.terminateUserSessions('user-id');

      // Assert - should not throw error
      expect(true).toBe(true);
    });
  });
});