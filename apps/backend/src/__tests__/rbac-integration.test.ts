import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  requireSiteAccess, 
  requireCognitoRole, 
  requireCognitoPermission,
  validateRoleHierarchy,
  requireFullRBAC
} from '../middleware/rbac.js';
import { UserRecord } from '../repositories/UserRepository.js';

// Mock dependencies
vi.mock('../repositories/index.js', () => ({
  RepositoryFactory: {
    getInstance: () => ({
      getUserRepository: () => mockUserRepository
    })
  }
}));

const mockUserRepository = {
  findByCognitoSub: vi.fn(),
};

// Test users
const testUsers: Record<string, UserRecord> = {
  superAdmin: {
    userId: 'user-superadmin-123',
    username: 'superadmin',
    email: 'superadmin@example.com',
    cognitoSub: 'cognito-sub-superadmin',
    firstName: 'Super',
    lastName: 'Admin',
    displayName: 'Super Admin',
    title: 'System Administrator',
    primaryOrganizationId: 'org-main-123',
    accessibleOrganizations: ['org-main-123', 'org-test-123', 'org-other-123'],
    role: 'super_admin',
    permissions: ['*'],
    cognitoGroups: ['super_admin'],
    accessibleStudies: ['study-test-123', 'study-other-123'],
    status: 'active',
    language: 'ja',
    timezone: 'Asia/Tokyo',
    createdBy: 'system',
    lastModifiedBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    entityType: 'user'
  },
  studyAdmin: {
    userId: 'user-studyadmin-123',
    username: 'studyadmin',
    email: 'studyadmin@example.com',
    cognitoSub: 'cognito-sub-studyadmin',
    firstName: 'Study',
    lastName: 'Admin',
    displayName: 'Study Admin',
    title: 'Study Administrator',
    primaryOrganizationId: 'org-main-123',
    accessibleOrganizations: ['org-main-123', 'org-test-123'],
    role: 'study_admin',
    permissions: ['study:*', 'organization:*', 'user:*', 'patient:*', 'visit:*', 'examination:*', 'audit:*'],
    cognitoGroups: ['study_admin'],
    accessibleStudies: ['study-test-123', 'study-other-123'],
    status: 'active',
    language: 'ja',
    timezone: 'Asia/Tokyo',
    createdBy: 'system',
    lastModifiedBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    entityType: 'user'
  },
  orgAdmin: {
    userId: 'user-orgadmin-123',
    username: 'orgadmin',
    email: 'orgadmin@example.com',
    cognitoSub: 'cognito-sub-orgadmin',
    firstName: 'Org',
    lastName: 'Admin',
    displayName: 'Org Admin',
    title: 'Organization Administrator',
    primaryOrganizationId: 'org-test-123',
    accessibleOrganizations: ['org-test-123'],
    role: 'org_admin',
    permissions: ['organization:manage', 'user:manage', 'patient:manage', 'visit:read', 'examination:read', 'audit:read'],
    cognitoGroups: ['org_admin'],
    accessibleStudies: ['study-test-123'],
    status: 'active',
    language: 'ja',
    timezone: 'Asia/Tokyo',
    createdBy: 'system',
    lastModifiedBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    entityType: 'user'
  },
  investigator: {
    userId: 'user-investigator-123',
    username: 'investigator',
    email: 'investigator@example.com',
    cognitoSub: 'cognito-sub-investigator',
    firstName: 'Principal',
    lastName: 'Investigator',
    displayName: 'Principal Investigator',
    title: 'Principal Investigator',
    primaryOrganizationId: 'org-test-123',
    accessibleOrganizations: ['org-test-123'],
    role: 'investigator',
    permissions: ['study:read', 'patient:manage', 'visit:manage', 'examination:manage', 'audit:read'],
    cognitoGroups: ['investigator'],
    accessibleStudies: ['study-test-123'],
    status: 'active',
    language: 'ja',
    timezone: 'Asia/Tokyo',
    createdBy: 'system',
    lastModifiedBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    entityType: 'user'
  },
  dataEntry: {
    userId: 'user-dataentry-123',
    username: 'dataentry',
    email: 'dataentry@example.com',
    cognitoSub: 'cognito-sub-dataentry',
    firstName: 'Data',
    lastName: 'Entry',
    displayName: 'Data Entry',
    title: 'Data Entry Specialist',
    primaryOrganizationId: 'org-test-123',
    accessibleOrganizations: ['org-test-123'],
    role: 'data_entry',
    permissions: ['examination:create', 'examination:update', 'visit:read', 'patient:read'],
    cognitoGroups: ['data_entry'],
    accessibleStudies: ['study-test-123'],
    status: 'active',
    language: 'ja',
    timezone: 'Asia/Tokyo',
    createdBy: 'system',
    lastModifiedBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    entityType: 'user'
  }
};

// Mock JWT tokens for each user
const mockTokens: Record<string, string> = {
  superAdmin: 'mock-token-superadmin',
  studyAdmin: 'mock-token-studyadmin',
  orgAdmin: 'mock-token-orgadmin',
  investigator: 'mock-token-investigator',
  dataEntry: 'mock-token-dataentry'
};

// Mock JWT verification
vi.mock('jsonwebtoken', async () => {
  const actual = await vi.importActual('jsonwebtoken');
  return {
    ...actual,
    decode: vi.fn((token: string) => {
      const userKey = Object.keys(mockTokens).find(key => mockTokens[key] === token);
      if (!userKey) return null;
      
      const user = testUsers[userKey];
      return {
        sub: user.cognitoSub,
        'cognito:username': user.username,
        email: user.email,
        'cognito:groups': user.cognitoGroups,
        'custom:organization_id': user.primaryOrganizationId,
        'custom:role': user.role,
        token_use: 'access',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      };
    })
  };
});

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Test routes for different RBAC scenarios
  
  // Site access control
  app.get('/organizations/:organizationId/data', 
    authenticateToken, 
    requireSiteAccess(),
    (req, res) => {
      res.json({ success: true, organizationId: req.params.organizationId });
    }
  );

  // Role-based access
  app.get('/admin/users', 
    authenticateToken, 
    requireCognitoRole(['super_admin', 'study_admin', 'org_admin']),
    (req, res) => {
      res.json({ success: true, users: [] });
    }
  );

  // Permission-based access
  app.post('/patients', 
    authenticateToken, 
    requireCognitoPermission('patient:manage'),
    (req, res) => {
      res.json({ success: true, patientId: 'patient-123' });
    }
  );

  // Role hierarchy validation
  app.post('/users/:userId/role', 
    authenticateToken, 
    validateRoleHierarchy(),
    (req, res) => {
      res.json({ success: true, role: req.body.role });
    }
  );

  // Full RBAC check
  app.get('/studies/:studyId/sensitive-data', 
    authenticateToken, 
    requireFullRBAC(['super_admin', 'study_admin'], ['study:read'], true),
    (req, res) => {
      res.json({ success: true, studyId: req.params.studyId });
    }
  );

  return app;
}

describe('RBAC Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Site Access Control', () => {
    it('should allow super admin to access any organization', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(testUsers.superAdmin);

      // Act
      const response = await request(app)
        .get('/organizations/org-other-123/data')
        .set('Authorization', `Bearer ${mockTokens.superAdmin}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, organizationId: 'org-other-123' });
    });

    it('should allow org admin to access their own organization', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(testUsers.orgAdmin);

      // Act
      const response = await request(app)
        .get('/organizations/org-test-123/data')
        .set('Authorization', `Bearer ${mockTokens.orgAdmin}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, organizationId: 'org-test-123' });
    });

    it('should deny org admin access to other organizations', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(testUsers.orgAdmin);

      // Act
      const response = await request(app)
        .get('/organizations/org-other-123/data')
        .set('Authorization', `Bearer ${mockTokens.orgAdmin}`);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied to this organization');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow admin roles to access user management', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(testUsers.orgAdmin);

      // Act
      const response = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${mockTokens.orgAdmin}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, users: [] });
    });

    it('should deny non-admin roles access to user management', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(testUsers.investigator);

      // Act
      const response = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${mockTokens.investigator}`);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient role permissions');
    });
  });

  describe('Permission-Based Access Control', () => {
    it('should allow users with patient:manage permission to create patients', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(testUsers.investigator);

      // Act
      const response = await request(app)
        .post('/patients')
        .set('Authorization', `Bearer ${mockTokens.investigator}`)
        .send({ name: 'Test Patient' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, patientId: 'patient-123' });
    });

    it('should deny users without patient:manage permission', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(testUsers.dataEntry);

      // Act
      const response = await request(app)
        .post('/patients')
        .set('Authorization', `Bearer ${mockTokens.dataEntry}`)
        .send({ name: 'Test Patient' });

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });
  });

  describe('Role Hierarchy Validation', () => {
    it('should allow org admin to assign investigator role', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(testUsers.orgAdmin);

      // Act
      const response = await request(app)
        .post('/users/user-123/role')
        .set('Authorization', `Bearer ${mockTokens.orgAdmin}`)
        .send({ role: 'investigator' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, role: 'investigator' });
    });

    it('should deny investigator from assigning org admin role', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(testUsers.investigator);

      // Act
      const response = await request(app)
        .post('/users/user-123/role')
        .set('Authorization', `Bearer ${mockTokens.investigator}`)
        .send({ role: 'org_admin' });

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Cannot assign role higher than your own');
    });
  });

  describe('Full RBAC Integration', () => {
    it('should allow study admin to access sensitive study data', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(testUsers.studyAdmin);

      // Act
      const response = await request(app)
        .get('/studies/study-test-123/sensitive-data')
        .set('Authorization', `Bearer ${mockTokens.studyAdmin}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, studyId: 'study-test-123' });
    });

    it('should deny investigator access to sensitive study data', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByCognitoSub).mockResolvedValue(testUsers.investigator);

      // Act
      const response = await request(app)
        .get('/studies/study-test-123/sensitive-data')
        .set('Authorization', `Bearer ${mockTokens.investigator}`);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient role permissions');
    });
  });

  describe('Authentication Requirements', () => {
    it('should return 401 for requests without authentication', async () => {
      // Act
      const response = await request(app)
        .get('/organizations/org-test-123/data');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should return 403 for requests with invalid tokens', async () => {
      // Act
      const response = await request(app)
        .get('/organizations/org-test-123/data')
        .set('Authorization', 'Bearer invalid-token');

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Invalid or expired token');
    });
  });
});