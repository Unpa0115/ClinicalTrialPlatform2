import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../auth.js';
import { 
  requireSiteAccess, 
  requireStudyAccess, 
  requireCognitoRole, 
  requireCognitoPermission,
  validateRoleHierarchy,
  ROLE_HIERARCHY
} from '../rbac.js';
import { UserRecord } from '../../repositories/UserRepository.js';

// Mock dependencies
vi.mock('../../repositories/index.js', () => ({
  RepositoryFactory: {
    getInstance: () => ({
      getUserRepository: () => mockUserRepository
    })
  }
}));

const mockUserRepository = {
  findByCognitoSub: vi.fn(),
};

// Test data
const mockSuperAdmin: UserRecord = {
  userId: 'user-superadmin-123',
  username: 'superadmin',
  email: 'superadmin@example.com',
  cognitoSub: 'cognito-sub-superadmin',
  firstName: 'Super',
  lastName: 'Admin',
  displayName: 'Super Admin',
  title: 'System Administrator',
  primaryOrganizationId: 'org-main-123',
  accessibleOrganizations: ['org-main-123', 'org-test-123'],
  role: 'super_admin',
  permissions: ['*'],
  cognitoGroups: ['super_admin'],
  accessibleStudies: ['study-test-123'],
  status: 'active',
  language: 'ja',
  timezone: 'Asia/Tokyo',
  createdBy: 'system',
  lastModifiedBy: 'system',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  entityType: 'user'
};

const mockOrgAdmin: UserRecord = {
  ...mockSuperAdmin,
  userId: 'user-orgadmin-123',
  username: 'orgadmin',
  email: 'orgadmin@example.com',
  cognitoSub: 'cognito-sub-orgadmin',
  role: 'org_admin',
  permissions: ['organization:manage', 'user:manage', 'patient:manage'],
  cognitoGroups: ['org_admin'],
  accessibleOrganizations: ['org-test-123']
};

const mockInvestigator: UserRecord = {
  ...mockSuperAdmin,
  userId: 'user-investigator-123',
  username: 'investigator',
  email: 'investigator@example.com',
  cognitoSub: 'cognito-sub-investigator',
  role: 'investigator',
  permissions: ['patient:manage', 'visit:manage', 'examination:manage'],
  cognitoGroups: ['investigator'],
  accessibleOrganizations: ['org-test-123']
};

// Mock request and response
const createMockRequest = (user?: any, params?: any, body?: any): AuthenticatedRequest => ({
  user,
  params: params || {},
  body: body || {},
  ip: '127.0.0.1',
  get: vi.fn().mockReturnValue('test-user-agent'),
  path: '/test',
  method: 'GET'
} as any);

const createMockResponse = (): Response => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const mockNext = vi.fn();

describe('RBAC Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('requireSiteAccess', () => {
    it('should allow super admin to access any organization', async () => {
      // Arrange
      const req = createMockRequest(
        { sub: 'cognito-sub-superadmin' },
        { organizationId: 'org-other-123' }
      );
      const res = createMockResponse();
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(mockSuperAdmin);

      // Act
      await requireSiteAccess()(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.user?.fullUserRecord).toEqual(mockSuperAdmin);
    });

    it('should allow org admin to access their own organization', async () => {
      // Arrange
      const req = createMockRequest(
        { sub: 'cognito-sub-orgadmin' },
        { organizationId: 'org-test-123' }
      );
      const res = createMockResponse();
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(mockOrgAdmin);

      // Act
      await requireSiteAccess()(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny org admin access to other organizations', async () => {
      // Arrange
      const req = createMockRequest(
        { sub: 'cognito-sub-orgadmin' },
        { organizationId: 'org-other-123' }
      );
      const res = createMockResponse();
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(mockOrgAdmin);

      // Act
      await requireSiteAccess()(req, res, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied to this organization',
        userOrganizations: ['org-test-123'],
        requestedOrganization: 'org-other-123'
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      // Arrange
      const req = createMockRequest();
      const res = createMockResponse();

      // Act
      await requireSiteAccess()(req, res, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    });
  });

  describe('requireStudyAccess', () => {
    it('should allow study admin to access any study', async () => {
      // Arrange
      const studyAdmin = { ...mockSuperAdmin, role: 'study_admin' as const };
      const req = createMockRequest(
        { sub: 'cognito-sub-studyadmin' },
        { studyId: 'study-other-123' }
      );
      const res = createMockResponse();
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(studyAdmin);

      // Act
      await requireStudyAccess()(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny investigator access to non-accessible studies', async () => {
      // Arrange
      const req = createMockRequest(
        { sub: 'cognito-sub-investigator' },
        { studyId: 'study-other-123' }
      );
      const res = createMockResponse();
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(mockInvestigator);

      // Act
      await requireStudyAccess()(req, res, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied to this study',
        userStudies: ['study-test-123'],
        requestedStudy: 'study-other-123'
      });
    });
  });

  describe('requireCognitoRole', () => {
    it('should allow user with correct role', async () => {
      // Arrange
      const req = createMockRequest({ sub: 'cognito-sub-orgadmin' });
      const res = createMockResponse();
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(mockOrgAdmin);

      // Act
      await requireCognitoRole('org_admin')(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow user with role in Cognito groups', async () => {
      // Arrange
      const req = createMockRequest({ sub: 'cognito-sub-orgadmin' });
      const res = createMockResponse();
      const userWithDifferentRole = { ...mockOrgAdmin, role: 'investigator' as const };
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(userWithDifferentRole);

      // Act
      await requireCognitoRole('org_admin')(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny user without correct role', async () => {
      // Arrange
      const req = createMockRequest({ sub: 'cognito-sub-investigator' });
      const res = createMockResponse();
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(mockInvestigator);

      // Act
      await requireCognitoRole('org_admin')(req, res, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient role permissions',
        required: ['org_admin'],
        userRole: 'investigator',
        userGroups: ['investigator']
      });
    });

    it('should handle multiple allowed roles', async () => {
      // Arrange
      const req = createMockRequest({ sub: 'cognito-sub-investigator' });
      const res = createMockResponse();
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(mockInvestigator);

      // Act
      await requireCognitoRole(['org_admin', 'investigator'])(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('requireCognitoPermission', () => {
    it('should allow user with required permission', async () => {
      // Arrange
      const req = createMockRequest({ sub: 'cognito-sub-orgadmin' });
      const res = createMockResponse();
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(mockOrgAdmin);

      // Act
      await requireCognitoPermission('patient:manage')(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny user without required permission', async () => {
      // Arrange
      const req = createMockRequest({ sub: 'cognito-sub-investigator' });
      const res = createMockResponse();
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(mockInvestigator);

      // Act
      await requireCognitoPermission('organization:manage')(req, res, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        required: ['organization:manage'],
        userRole: 'investigator',
        userPermissions: ['patient:manage', 'visit:manage', 'examination:manage'],
        userGroups: ['investigator']
      });
    });
  });

  describe('validateRoleHierarchy', () => {
    it('should allow assigning role at same level', async () => {
      // Arrange
      const req = createMockRequest(
        { sub: 'cognito-sub-orgadmin' },
        {},
        { role: 'org_admin' }
      );
      const res = createMockResponse();
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(mockOrgAdmin);

      // Act
      await validateRoleHierarchy()(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow assigning lower role', async () => {
      // Arrange
      const req = createMockRequest(
        { sub: 'cognito-sub-orgadmin' },
        {},
        { role: 'investigator' }
      );
      const res = createMockResponse();
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(mockOrgAdmin);

      // Act
      await validateRoleHierarchy()(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny assigning higher role', async () => {
      // Arrange
      const req = createMockRequest(
        { sub: 'cognito-sub-investigator' },
        {},
        { role: 'org_admin' }
      );
      const res = createMockResponse();
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(mockInvestigator);

      // Act
      await validateRoleHierarchy()(req, res, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Cannot assign role higher than your own',
        userRole: 'investigator',
        targetRole: 'org_admin',
        userLevel: ROLE_HIERARCHY.investigator,
        targetLevel: ROLE_HIERARCHY.org_admin
      });
    });

    it('should pass through when no role is specified', async () => {
      // Arrange
      const req = createMockRequest({ sub: 'cognito-sub-investigator' });
      const res = createMockResponse();
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(mockInvestigator);

      // Act
      await validateRoleHierarchy()(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Role Hierarchy Constants', () => {
    it('should have correct role hierarchy order', () => {
      expect(ROLE_HIERARCHY.super_admin).toBeLessThan(ROLE_HIERARCHY.study_admin);
      expect(ROLE_HIERARCHY.study_admin).toBeLessThan(ROLE_HIERARCHY.org_admin);
      expect(ROLE_HIERARCHY.org_admin).toBeLessThan(ROLE_HIERARCHY.investigator);
      expect(ROLE_HIERARCHY.investigator).toBeLessThan(ROLE_HIERARCHY.coordinator);
      expect(ROLE_HIERARCHY.coordinator).toBeLessThan(ROLE_HIERARCHY.data_entry);
      expect(ROLE_HIERARCHY.data_entry).toBeLessThan(ROLE_HIERARCHY.viewer);
    });
  });
});