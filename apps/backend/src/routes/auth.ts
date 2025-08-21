import express, { Request, Response } from 'express';
import { z } from 'zod';
import { RepositoryFactory } from '../repositories/index.js';
import { authenticateToken, requireRole, AuthenticatedRequest, extractUserContext } from '../middleware/auth.js';
import { requirePermission, requireAction, requireSelfOrPermission, requireRoleHierarchy } from '../middleware/authorization.js';
import { createCognitoService } from '../config/cognito.js';
import { getAuthService } from '../services/AuthService.js';

const router = express.Router();
const repositoryFactory = RepositoryFactory.getInstance();

// Lazy initialization to ensure environment variables are loaded
let userRepository: any;
let cognitoService: any;
let authService: any;

function getUserRepository() {
  if (!userRepository) {
    userRepository = repositoryFactory.getUserRepository();
  }
  return userRepository;
}

function getCognitoService() {
  if (!cognitoService) {
    cognitoService = createCognitoService();
  }
  return cognitoService;
}

function getAuthServiceInstance() {
  if (!authService) {
    authService = getAuthService();
  }
  return authService;
}

// Validation schemas
const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  title: z.string().min(1).max(100),
  primaryOrganizationId: z.string(),
  role: z.enum(['super_admin', 'study_admin', 'org_admin', 'investigator', 'coordinator', 'data_entry', 'viewer']),
  department: z.string().max(100).optional(),
  specialization: z.string().max(100).optional(),
  licenseNumber: z.string().max(50).optional(),
  temporaryPassword: z.string().min(8).optional(),
  language: z.enum(['ja', 'en']).optional(),
  timezone: z.string().optional()
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(100).optional(),
  department: z.string().max(100).optional(),
  specialization: z.string().max(100).optional(),
  licenseNumber: z.string().max(50).optional(),
  primaryOrganizationId: z.string().optional(),
  role: z.enum(['super_admin', 'study_admin', 'org_admin', 'investigator', 'coordinator', 'data_entry', 'viewer']).optional(),
  language: z.enum(['ja', 'en']).optional(),
  timezone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending_activation', 'suspended', 'locked']).optional()
});

const setPasswordSchema = z.object({
  password: z.string().min(8).max(128),
  permanent: z.boolean().default(true)
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
});

const passwordResetSchema = z.object({
  username: z.string().min(1)
});

const confirmPasswordResetSchema = z.object({
  username: z.string().min(1),
  confirmationCode: z.string().min(1),
  newPassword: z.string().min(8).max(128)
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128)
});

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

/**
 * POST /api/auth/login
 * Authenticate user with username/password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    const loginResponse = await getAuthServiceInstance().login(validatedData);
    
    res.json({
      success: true,
      ...loginResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(401).json({ error: 'Authentication failed', details: error.message });
    }
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const validatedData = refreshTokenSchema.parse(req.body);
    
    const refreshResponse = await getAuthServiceInstance().refreshToken(validatedData);
    
    res.json({
      success: true,
      ...refreshResponse
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(401).json({ error: 'Token refresh failed', details: error.message });
    }
  }
});

/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessionId = req.user?.sessionId;
    
    if (sessionId) {
      await getAuthServiceInstance().logout(sessionId);
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed', details: error.message });
  }
});

/**
 * POST /api/auth/forgot-password
 * Initiate password reset process
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const validatedData = passwordResetSchema.parse(req.body);
    
    await getAuthServiceInstance().initiatePasswordReset(validatedData);
    
    res.json({
      success: true,
      message: 'Password reset instructions sent to your email'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      // Don't reveal specific error details for security
      res.json({
        success: true,
        message: 'Password reset instructions sent to your email'
      });
    }
  }
});

/**
 * POST /api/auth/confirm-forgot-password
 * Confirm password reset with verification code
 */
router.post('/confirm-forgot-password', async (req: Request, res: Response) => {
  try {
    const validatedData = confirmPasswordResetSchema.parse(req.body);
    
    await getAuthServiceInstance().confirmPasswordReset(validatedData);
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Password reset confirmation error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(400).json({ error: 'Password reset failed', details: error.message });
    }
  }
});

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 */
router.post('/change-password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = changePasswordSchema.parse(req.body);
    const userContext = extractUserContext(req);
    
    await getAuthServiceInstance().changePassword({
      username: userContext.username!,
      oldPassword: validatedData.oldPassword,
      newPassword: validatedData.newPassword
    });
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(400).json({ error: 'Password change failed', details: error.message });
    }
  }
});

/**
 * GET /api/auth/sessions
 * Get active sessions (Admin only)
 */
router.get('/sessions', authenticateToken, requireAction('read', 'system'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessions = getAuthServiceInstance().getActiveSessions();
    
    res.json({
      success: true,
      sessions: sessions.map(session => ({
        sessionId: session.sessionId,
        userId: session.userId,
        username: session.username,
        email: session.email,
        role: session.role,
        organizationId: session.organizationId,
        expiresAt: session.expiresAt
      }))
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ error: 'Failed to get sessions', details: error.message });
  }
});

/**
 * DELETE /api/auth/sessions/:sessionId
 * Terminate specific session (Admin only)
 */
router.delete('/sessions/:sessionId', authenticateToken, requireAction('delete', 'system'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    await getAuthServiceInstance().terminateSession(sessionId);
    
    res.json({
      success: true,
      message: 'Session terminated successfully'
    });
  } catch (error) {
    console.error('Error terminating session:', error);
    res.status(500).json({ error: 'Failed to terminate session', details: error.message });
  }
});

/**
 * DELETE /api/auth/users/:userId/sessions
 * Terminate all sessions for a user (Admin only)
 */
router.delete('/users/:userId/sessions', authenticateToken, requireAction('delete', 'system'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    await getAuthServiceInstance().terminateUserSessions(userId);
    
    res.json({
      success: true,
      message: 'All user sessions terminated successfully'
    });
  } catch (error) {
    console.error('Error terminating user sessions:', error);
    res.status(500).json({ error: 'Failed to terminate user sessions', details: error.message });
  }
});

// ============================================================================
// USER MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/auth/users
 * Create a new user (Admin only)
 */
router.post('/users', authenticateToken, requireAction('create', 'user'), requireRoleHierarchy(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    const userContext = extractUserContext(req);

    const newUser = await getUserRepository().createUserWithCognito(validatedData, userContext.userId!);

    res.status(201).json({
      success: true,
      user: {
        userId: newUser.userId,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        displayName: newUser.displayName,
        title: newUser.title,
        role: newUser.role,
        status: newUser.status,
        primaryOrganizationId: newUser.primaryOrganizationId,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create user', details: error.message });
    }
  }
});

/**
 * GET /api/auth/users
 * List users (Admin only)
 */
router.get('/users', authenticateToken, requireAction('read', 'user'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userContext = extractUserContext(req);
    const { organizationId, page = '1', limit = '10' } = req.query;

    let users;
    if (organizationId && typeof organizationId === 'string') {
      users = await getUserRepository().findByOrganization(organizationId);
    } else if (userContext.role === 'org_admin') {
      // Org admins can only see users from their organization
      users = await getUserRepository().findByOrganization(userContext.organizationId!);
    } else {
      // Super admins and study admins can see all users
      // TODO: Implement pagination for all users
      users = [];
    }

    res.json({
      success: true,
      users: users.map(user => ({
        userId: user.userId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        title: user.title,
        role: user.role,
        status: user.status,
        primaryOrganizationId: user.primaryOrganizationId,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: users.length
      }
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Failed to list users', details: error.message });
  }
});

/**
 * GET /api/auth/users/:userId
 * Get user details
 */
router.get('/users/:userId', authenticateToken, requireSelfOrPermission('user:read'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const userContext = extractUserContext(req);

    const user = await getUserRepository().findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check access permissions
    const isOwnProfile = user.cognitoSub === userContext.userId;
    const isAdmin = userContext.groups?.some(group => ['super_admin', 'study_admin', 'org_admin'].includes(group));
    const isSameOrganization = user.primaryOrganizationId === userContext.organizationId;

    if (!isOwnProfile && !isAdmin && !isSameOrganization) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({
      success: true,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        title: user.title,
        department: user.department,
        specialization: user.specialization,
        licenseNumber: user.licenseNumber,
        role: user.role,
        status: user.status,
        primaryOrganizationId: user.primaryOrganizationId,
        accessibleOrganizations: user.accessibleOrganizations,
        accessibleStudies: user.accessibleStudies,
        permissions: user.permissions,
        language: user.language,
        timezone: user.timezone,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user', details: error.message });
  }
});

/**
 * PUT /api/auth/users/:userId
 * Update user
 */
router.put('/users/:userId', authenticateToken, requireSelfOrPermission('user:update'), requireRoleHierarchy(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const validatedData = updateUserSchema.parse(req.body);
    const userContext = extractUserContext(req);

    const existingUser = await getUserRepository().findById(userId);
    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check permissions
    const isOwnProfile = existingUser.cognitoSub === userContext.userId;
    const isAdmin = userContext.groups?.some(group => ['super_admin', 'study_admin', 'org_admin'].includes(group));

    if (!isOwnProfile && !isAdmin) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Non-admins can't change certain fields
    if (!isAdmin) {
      delete validatedData.role;
      delete validatedData.primaryOrganizationId;
      delete validatedData.status;
    }

    const updatedUser = await getUserRepository().updateUserWithCognito(userId, validatedData, userContext.userId!);

    res.json({
      success: true,
      user: {
        userId: updatedUser.userId,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        displayName: updatedUser.displayName,
        title: updatedUser.title,
        role: updatedUser.role,
        status: updatedUser.status,
        primaryOrganizationId: updatedUser.primaryOrganizationId,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update user', details: error.message });
    }
  }
});

/**
 * DELETE /api/auth/users/:userId
 * Delete user (Admin only)
 */
router.delete('/users/:userId', authenticateToken, requireAction('delete', 'user'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const existingUser = await getUserRepository().findById(userId);
    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await getUserRepository().deleteUserWithCognito(userId);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
});

/**
 * POST /api/auth/users/:userId/password
 * Set user password (Admin only)
 */
router.post('/users/:userId/password', authenticateToken, requireAction('update', 'user'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const validatedData = setPasswordSchema.parse(req.body);

    const user = await getUserRepository().findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await getCognitoService().setUserPassword(user.username, validatedData.password, validatedData.permanent);

    res.json({
      success: true,
      message: 'Password set successfully'
    });
  } catch (error) {
    console.error('Error setting password:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to set password', details: error.message });
    }
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userContext = extractUserContext(req);
    
    const user = await getUserRepository().findByCognitoSub(userContext.userId!);
    if (!user) {
      res.status(404).json({ error: 'User profile not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        title: user.title,
        department: user.department,
        specialization: user.specialization,
        role: user.role,
        status: user.status,
        primaryOrganizationId: user.primaryOrganizationId,
        accessibleOrganizations: user.accessibleOrganizations,
        accessibleStudies: user.accessibleStudies,
        permissions: user.permissions,
        language: user.language,
        timezone: user.timezone,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Failed to get user profile', details: error.message });
  }
});

/**
 * POST /api/auth/sync/:username
 * Sync user data from Cognito (Admin only)
 */
router.post('/sync/:username', authenticateToken, requireAction('update', 'user'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.params;

    const syncedUser = await getUserRepository().syncFromCognito(username);
    if (!syncedUser) {
      res.status(404).json({ error: 'User not found or sync failed' });
      return;
    }

    res.json({
      success: true,
      message: 'User synced successfully',
      user: {
        userId: syncedUser.userId,
        username: syncedUser.username,
        email: syncedUser.email,
        role: syncedUser.role,
        status: syncedUser.status,
        updatedAt: syncedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user', details: error.message });
  }
});

export default router;