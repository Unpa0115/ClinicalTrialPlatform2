import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { PermissionService, Permission } from '../services/PermissionService.js';
import { RepositoryFactory } from '../repositories/index.js';
import { UserRecord } from '../repositories/UserRepository.js';

/**
 * Role hierarchy for RBAC validation
 */
export const ROLE_HIERARCHY: Record<UserRecord['role'], number> = {
  'super_admin': 10,
  'study_admin': 20,
  'org_admin': 30,
  'investigator': 40,
  'coordinator': 50,
  'data_entry': 60,
  'viewer': 70
};

/**
 * Site-based access control middleware
 * Ensures users can only access data from their assigned organizations
 */
export function requireSiteAccess(organizationIdParam: string = 'organizationId') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      const userRepository = RepositoryFactory.getInstance().getUserRepository();
      const fullUser = await userRepository.findByCognitoSub(req.user.sub);
      
      if (!fullUser) {
        res.status(401).json({ error: 'User profile not found' });
        return;
      }

      const requestedOrgId = req.params[organizationIdParam] || req.body.organizationId;
      
      // Super admins and study admins can access any organization
      if (fullUser.role === 'super_admin' || fullUser.role === 'study_admin') {
        req.user.fullUserRecord = fullUser;
        next();
        return;
      }

      // Check if user has access to the requested organization
      if (requestedOrgId && !fullUser.accessibleOrganizations.includes(requestedOrgId)) {
        res.status(403).json({
          error: 'Access denied to this organization',
          userOrganizations: fullUser.accessibleOrganizations,
          requestedOrganization: requestedOrgId
        });
        return;
      }

      req.user.fullUserRecord = fullUser;
      next();
    } catch (error) {
      console.error('Site access control error:', error);
      res.status(500).json({ error: 'Access control check failed' });
    }
  };
}

/**
 * Study-specific access control middleware
 */
export function requireStudyAccess(studyIdParam: string = 'studyId') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      const userRepository = RepositoryFactory.getInstance().getUserRepository();
      const fullUser = await userRepository.findByCognitoSub(req.user.sub);
      
      if (!fullUser) {
        res.status(401).json({ error: 'User profile not found' });
        return;
      }

      const requestedStudyId = req.params[studyIdParam] || req.body.studyId;
      
      // Super admins and study admins can access any study
      if (fullUser.role === 'super_admin' || fullUser.role === 'study_admin') {
        req.user.fullUserRecord = fullUser;
        next();
        return;
      }

      // Check if user has access to the requested study
      if (requestedStudyId && !fullUser.accessibleStudies.includes(requestedStudyId)) {
        res.status(403).json({
          error: 'Access denied to this study',
          userStudies: fullUser.accessibleStudies,
          requestedStudy: requestedStudyId
        });
        return;
      }

      req.user.fullUserRecord = fullUser;
      next();
    } catch (error) {
      console.error('Study access control error:', error);
      res.status(500).json({ error: 'Access control check failed' });
    }
  };
}

/**
 * Role-based access control with Cognito Groups integration
 */
export function requireCognitoRole(allowedRoles: UserRecord['role'] | UserRecord['role'][]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      const userRepository = RepositoryFactory.getInstance().getUserRepository();
      const fullUser = await userRepository.findByCognitoSub(req.user.sub);
      
      if (!fullUser) {
        res.status(401).json({ error: 'User profile not found' });
        return;
      }

      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      // Check if user's role is in allowed roles
      const hasRole = roles.includes(fullUser.role);
      
      // Also check Cognito groups for redundancy
      const hasGroup = fullUser.cognitoGroups.some(group => roles.includes(group as UserRecord['role']));
      
      if (!hasRole && !hasGroup) {
        res.status(403).json({
          error: 'Insufficient role permissions',
          required: roles,
          userRole: fullUser.role,
          userGroups: fullUser.cognitoGroups
        });
        return;
      }

      req.user.fullUserRecord = fullUser;
      next();
    } catch (error) {
      console.error('Role-based access control error:', error);
      res.status(500).json({ error: 'Role check failed' });
    }
  };
}

/**
 * Granular permission check with Cognito Groups
 */
export function requireCognitoPermission(permission: Permission | Permission[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      const userRepository = RepositoryFactory.getInstance().getUserRepository();
      const fullUser = await userRepository.findByCognitoSub(req.user.sub);
      
      if (!fullUser) {
        res.status(401).json({ error: 'User profile not found' });
        return;
      }

      const permissions = Array.isArray(permission) ? permission : [permission];
      
      // Build context for permission check
      const context = {
        userId: fullUser.cognitoSub,
        organizationId: fullUser.primaryOrganizationId,
        targetOrganizationId: req.params.organizationId || req.body.organizationId,
        targetStudyId: req.params.studyId || req.body.studyId
      };

      // Check if user has any of the required permissions
      const hasPermission = PermissionService.hasAnyPermission(fullUser, permissions, context);

      if (!hasPermission) {
        res.status(403).json({
          error: 'Insufficient permissions',
          required: permissions,
          userRole: fullUser.role,
          userPermissions: fullUser.permissions,
          userGroups: fullUser.cognitoGroups
        });
        return;
      }

      req.user.fullUserRecord = fullUser;
      next();
    } catch (error) {
      console.error('Permission-based access control error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

/**
 * Multi-site access control for organization administrators
 */
export function requireMultiSiteAccess() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      const userRepository = RepositoryFactory.getInstance().getUserRepository();
      const fullUser = await userRepository.findByCognitoSub(req.user.sub);
      
      if (!fullUser) {
        res.status(401).json({ error: 'User profile not found' });
        return;
      }

      // Only super_admin, study_admin, and org_admin can access multiple sites
      const allowedRoles: UserRecord['role'][] = ['super_admin', 'study_admin', 'org_admin'];
      
      if (!allowedRoles.includes(fullUser.role)) {
        res.status(403).json({
          error: 'Multi-site access denied',
          userRole: fullUser.role,
          allowedRoles
        });
        return;
      }

      req.user.fullUserRecord = fullUser;
      next();
    } catch (error) {
      console.error('Multi-site access control error:', error);
      res.status(500).json({ error: 'Multi-site access check failed' });
    }
  };
}

/**
 * Data filtering middleware based on user's organization access
 */
export function filterByOrganizationAccess<T extends { organizationId?: string }>(
  dataKey: string = 'data'
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user?.fullUserRecord) {
      next();
      return;
    }

    const fullUser = req.user.fullUserRecord;

    // Store original json method
    const originalJson = res.json;

    // Override json method to filter data
    res.json = function(data: any) {
      if (data && data[dataKey] && Array.isArray(data[dataKey])) {
        // Super admins and study admins can see all data
        if (fullUser.role === 'super_admin' || fullUser.role === 'study_admin') {
          return originalJson.call(this, data);
        }

        // Filter data based on user's accessible organizations
        data[dataKey] = data[dataKey].filter((item: T) => {
          return !item.organizationId || fullUser.accessibleOrganizations.includes(item.organizationId);
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Audit logging middleware for RBAC actions
 */
export function auditRBACAction(action: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user?.fullUserRecord) {
      next();
      return;
    }

    try {
      // Log the RBAC action
      console.log(`RBAC Action: ${action}`, {
        userId: req.user.fullUserRecord.cognitoSub,
        username: req.user.fullUserRecord.username,
        role: req.user.fullUserRecord.role,
        groups: req.user.fullUserRecord.cognitoGroups,
        organizationId: req.user.fullUserRecord.primaryOrganizationId,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });

      next();
    } catch (error) {
      console.error('RBAC audit logging error:', error);
      next(); // Don't block the request if logging fails
    }
  };
}

/**
 * Role hierarchy validation for user management operations
 */
export function validateRoleHierarchy(targetRoleParam: string = 'role') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      const userRepository = RepositoryFactory.getInstance().getUserRepository();
      const fullUser = await userRepository.findByCognitoSub(req.user.sub);
      
      if (!fullUser) {
        res.status(401).json({ error: 'User profile not found' });
        return;
      }

      const targetRole = req.params[targetRoleParam] || req.body.role;
      
      if (targetRole) {
        const userLevel = ROLE_HIERARCHY[fullUser.role];
        const targetLevel = ROLE_HIERARCHY[targetRole as UserRecord['role']];

        // Users can only assign roles at their level or lower (higher number)
        if (userLevel > targetLevel) {
          res.status(403).json({
            error: 'Cannot assign role higher than your own',
            userRole: fullUser.role,
            targetRole: targetRole,
            userLevel,
            targetLevel
          });
          return;
        }
      }

      req.user.fullUserRecord = fullUser;
      next();
    } catch (error) {
      console.error('Role hierarchy validation error:', error);
      res.status(500).json({ error: 'Role hierarchy check failed' });
    }
  };
}

/**
 * Combined RBAC middleware that checks role, permissions, and site access
 */
export function requireFullRBAC(
  allowedRoles: UserRecord['role'] | UserRecord['role'][],
  requiredPermissions?: Permission | Permission[],
  requireSiteAccessCheck: boolean = true
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      const userRepository = RepositoryFactory.getInstance().getUserRepository();
      const fullUser = await userRepository.findByCognitoSub(req.user.sub);
      
      if (!fullUser) {
        res.status(401).json({ error: 'User profile not found' });
        return;
      }

      // 1. Check role
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      const hasRole = roles.includes(fullUser.role) || 
                     fullUser.cognitoGroups.some(group => roles.includes(group as UserRecord['role']));

      if (!hasRole) {
        res.status(403).json({
          error: 'Insufficient role permissions',
          required: roles,
          userRole: fullUser.role,
          userGroups: fullUser.cognitoGroups
        });
        return;
      }

      // 2. Check permissions if specified
      if (requiredPermissions) {
        const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
        const context = {
          userId: fullUser.cognitoSub,
          organizationId: fullUser.primaryOrganizationId,
          targetOrganizationId: req.params.organizationId || req.body.organizationId,
          targetStudyId: req.params.studyId || req.body.studyId
        };

        const hasPermission = PermissionService.hasAnyPermission(fullUser, permissions, context);
        if (!hasPermission) {
          res.status(403).json({
            error: 'Insufficient permissions',
            required: permissions,
            userPermissions: fullUser.permissions
          });
          return;
        }
      }

      // 3. Check site access if required
      if (requireSiteAccessCheck) {
        const requestedOrgId = req.params.organizationId || req.body.organizationId;
        if (requestedOrgId && 
            fullUser.role !== 'super_admin' && 
            fullUser.role !== 'study_admin' &&
            !fullUser.accessibleOrganizations.includes(requestedOrgId)) {
          res.status(403).json({
            error: 'Access denied to this organization',
            userOrganizations: fullUser.accessibleOrganizations,
            requestedOrganization: requestedOrgId
          });
          return;
        }
      }

      req.user.fullUserRecord = fullUser;
      next();
    } catch (error) {
      console.error('Full RBAC check error:', error);
      res.status(500).json({ error: 'RBAC check failed' });
    }
  };
}