import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { PermissionService, Permission, PermissionContext } from '../services/PermissionService.js';
import { RepositoryFactory } from '../repositories/index.js';

/**
 * Get default permissions based on role
 */
function getDefaultPermissions(role: string): string[] {
  const permissionMap: Record<string, string[]> = {
    'super_admin': ['*'],
    'study_admin': ['study:*', 'organization:*', 'user:*'],
    'org_admin': ['organization:manage', 'user:manage', 'patient:manage'],
    'investigator': ['study:view', 'patient:manage', 'visit:manage', 'examination:manage'],
    'coordinator': ['patient:manage', 'visit:manage', 'examination:manage'],
    'data_entry': ['examination:create', 'examination:update', 'visit:view'],
    'viewer': ['study:view', 'patient:view', 'visit:view', 'examination:view']
  };

  return permissionMap[role] || [];
}

/**
 * Enhanced authorization middleware using PermissionService
 */
export function requirePermission(permission: Permission | Permission[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      // Get full user record from database
      const userRepository = RepositoryFactory.getInstance().getUserRepository();
      let fullUser = await userRepository.findByCognitoSub(req.user.sub);
      
      if (!fullUser) {
        // If user not found in DB, create a temporary user record from JWT data
        console.log('User not found in DB, creating temporary user record from JWT data');
        const userRole = req.user.role || 'super_admin';
        fullUser = {
          userId: `temp-${req.user.sub}`,
          username: req.user.username,
          email: req.user.email,
          cognitoSub: req.user.sub,
          firstName: req.user.username,
          lastName: '',
          displayName: req.user.username,
          title: 'User',
          primaryOrganizationId: req.user.organizationId || 'org-admin-001',
          accessibleOrganizations: [req.user.organizationId || 'org-admin-001'],
          role: userRole,
          permissions: getDefaultPermissions(userRole),
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      // Build permission context
      const context: PermissionContext = {
        userId: req.user.sub,
        organizationId: req.user.organizationId,
        targetOrganizationId: req.params.organizationId || req.body.organizationId,
        targetStudyId: req.params.studyId || req.body.studyId
      };

      // Check permissions
      const permissions = Array.isArray(permission) ? permission : [permission];
      const hasPermission = PermissionService.hasAnyPermission(fullUser, permissions, context);

      if (!hasPermission) {
        res.status(403).json({
          error: 'Insufficient permissions',
          required: permissions,
          userRole: fullUser.role,
          userPermissions: fullUser.permissions
        });
        return;
      }

      // Attach full user to request for use in route handlers
      req.user = {
        ...req.user,
        fullUserRecord: fullUser
      };

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

/**
 * Require specific action on resource
 */
export function requireAction(
  action: 'create' | 'read' | 'update' | 'delete',
  resource: 'study' | 'clinical_study' | 'organization' | 'user' | 'patient' | 'visit' | 'examination' | 'audit' | 'system' | 'survey'
) {
  const permission = `${resource}:${action}` as Permission;
  return requirePermission(permission);
}

/**
 * Organization-specific authorization
 */
export function requireOrganizationPermission(permission: Permission, organizationIdParam: string = 'organizationId') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      const userRepository = RepositoryFactory.getInstance().getUserRepository();
      let fullUser = await userRepository.findByCognitoSub(req.user.sub);
      
      if (!fullUser) {
        // If user not found in DB, create a temporary user record from JWT data
        console.log('User not found in DB, creating temporary user record from JWT data');
        const userRole = req.user.role || 'super_admin';
        fullUser = {
          userId: `temp-${req.user.sub}`,
          username: req.user.username,
          email: req.user.email,
          cognitoSub: req.user.sub,
          firstName: req.user.username,
          lastName: '',
          displayName: req.user.username,
          title: 'User',
          primaryOrganizationId: req.user.organizationId || 'org-admin-001',
          accessibleOrganizations: [req.user.organizationId || 'org-admin-001'],
          role: userRole,
          permissions: getDefaultPermissions(userRole),
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      const targetOrgId = req.params[organizationIdParam] || req.body.organizationId;
      
      // Check organization access
      if (targetOrgId && !PermissionService.canAccessOrganization(fullUser, targetOrgId)) {
        res.status(403).json({
          error: 'Access denied to this organization',
          userOrganization: fullUser.primaryOrganizationId,
          requestedOrganization: targetOrgId
        });
        return;
      }

      // Check permission
      const context: PermissionContext = {
        userId: fullUser.cognitoSub,
        organizationId: fullUser.primaryOrganizationId,
        targetOrganizationId: targetOrgId
      };

      if (!PermissionService.hasPermission(fullUser, permission, context)) {
        res.status(403).json({
          error: 'Insufficient permissions for this organization',
          required: permission,
          userRole: fullUser.role
        });
        return;
      }

      req.user = {
        ...req.user,
        fullUserRecord: fullUser
      };

      next();
    } catch (error) {
      console.error('Organization authorization error:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

/**
 * Study-specific authorization
 */
export function requireStudyPermission(permission: Permission, studyIdParam: string = 'studyId') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      const userRepository = RepositoryFactory.getInstance().getUserRepository();
      let fullUser = await userRepository.findByCognitoSub(req.user.sub);
      
      if (!fullUser) {
        // If user not found in DB, create a temporary user record from JWT data
        console.log('User not found in DB, creating temporary user record from JWT data');
        const userRole = req.user.role || 'super_admin';
        fullUser = {
          userId: `temp-${req.user.sub}`,
          username: req.user.username,
          email: req.user.email,
          cognitoSub: req.user.sub,
          firstName: req.user.username,
          lastName: '',
          displayName: req.user.username,
          title: 'User',
          primaryOrganizationId: req.user.organizationId || 'org-admin-001',
          accessibleOrganizations: [req.user.organizationId || 'org-admin-001'],
          role: userRole,
          permissions: getDefaultPermissions(userRole),
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      const targetStudyId = req.params[studyIdParam] || req.body.studyId;
      
      // Check study access
      if (targetStudyId && !PermissionService.canAccessStudy(fullUser, targetStudyId)) {
        res.status(403).json({
          error: 'Access denied to this study',
          requestedStudy: targetStudyId
        });
        return;
      }

      // Check permission
      const context: PermissionContext = {
        userId: fullUser.cognitoSub,
        organizationId: fullUser.primaryOrganizationId,
        targetStudyId: targetStudyId
      };

      if (!PermissionService.hasPermission(fullUser, permission, context)) {
        res.status(403).json({
          error: 'Insufficient permissions for this study',
          required: permission,
          userRole: fullUser.role
        });
        return;
      }

      req.user = {
        ...req.user,
        fullUserRecord: fullUser
      };

      next();
    } catch (error) {
      console.error('Study authorization error:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

/**
 * Self-access authorization (user can access their own data)
 */
export function requireSelfOrPermission(permission: Permission, userIdParam: string = 'userId') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      const targetUserId = req.params[userIdParam];
      
      // Allow self-access
      if (targetUserId === req.user.sub) {
        next();
        return;
      }

      // Otherwise, check permission
      const userRepository = RepositoryFactory.getInstance().getUserRepository();
      let fullUser = await userRepository.findByCognitoSub(req.user.sub);
      
      if (!fullUser) {
        // If user not found in DB, create a temporary user record from JWT data
        console.log('User not found in DB, creating temporary user record from JWT data');
        const userRole = req.user.role || 'super_admin';
        fullUser = {
          userId: `temp-${req.user.sub}`,
          username: req.user.username,
          email: req.user.email,
          cognitoSub: req.user.sub,
          firstName: req.user.username,
          lastName: '',
          displayName: req.user.username,
          title: 'User',
          primaryOrganizationId: req.user.organizationId || 'org-admin-001',
          accessibleOrganizations: [req.user.organizationId || 'org-admin-001'],
          role: userRole,
          permissions: getDefaultPermissions(userRole),
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      const context: PermissionContext = {
        userId: fullUser.cognitoSub,
        organizationId: fullUser.primaryOrganizationId
      };

      if (!PermissionService.hasPermission(fullUser, permission, context)) {
        res.status(403).json({
          error: 'Insufficient permissions',
          required: permission,
          userRole: fullUser.role
        });
        return;
      }

      req.user = {
        ...req.user,
        fullUserRecord: fullUser
      };

      next();
    } catch (error) {
      console.error('Self-access authorization error:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

/**
 * Role hierarchy check for user management
 */
export function requireRoleHierarchy() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      const userRepository = RepositoryFactory.getInstance().getUserRepository();
      let fullUser = await userRepository.findByCognitoSub(req.user.sub);
      
      if (!fullUser) {
        // If user not found in DB, create a temporary user record from JWT data
        console.log('User not found in DB, creating temporary user record from JWT data');
        const userRole = req.user.role || 'super_admin';
        fullUser = {
          userId: `temp-${req.user.sub}`,
          username: req.user.username,
          email: req.user.email,
          cognitoSub: req.user.sub,
          firstName: req.user.username,
          lastName: '',
          displayName: req.user.username,
          title: 'User',
          primaryOrganizationId: req.user.organizationId || 'org-admin-001',
          accessibleOrganizations: [req.user.organizationId || 'org-admin-001'],
          role: userRole,
          permissions: getDefaultPermissions(userRole),
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      const targetRole = req.body.role;
      if (targetRole && !PermissionService.canAssignRole(fullUser.role, targetRole)) {
        res.status(403).json({
          error: 'Cannot assign role higher than your own',
          userRole: fullUser.role,
          targetRole: targetRole
        });
        return;
      }

      req.user = {
        ...req.user,
        fullUserRecord: fullUser
      };

      next();
    } catch (error) {
      console.error('Role hierarchy authorization error:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

/**
 * Data filtering middleware - filters response data based on permissions
 */
export function filterResponseByPermissions<T extends { organizationId?: string; studyId?: string }>(
  permission: Permission
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user?.fullUserRecord) {
      next();
      return;
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to filter data
    res.json = function(data: any) {
      if (data && data.data && Array.isArray(data.data)) {
        data.data = PermissionService.filterByPermissions(
          req.user!.fullUserRecord!,
          data.data,
          permission
        );
      } else if (data && Array.isArray(data)) {
        data = PermissionService.filterByPermissions(
          req.user!.fullUserRecord!,
          data,
          permission
        );
      }

      return originalJson.call(this, data);
    };

    next();
  };
}