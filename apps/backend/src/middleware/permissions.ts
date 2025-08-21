import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';

// Define user roles
export type UserRole = 
  | 'super_admin' 
  | 'study_admin' 
  | 'org_admin' 
  | 'investigator' 
  | 'coordinator' 
  | 'data_entry' 
  | 'viewer';

// Define permissions
export interface Permission {
  resource: string;
  action: string;
  condition?: (user: any, resource?: any) => boolean;
}

// Role-based permissions mapping
const rolePermissions: Record<UserRole, string[]> = {
  super_admin: ['*'], // All permissions
  study_admin: [
    'clinical_studies:*',
    'surveys:*',
    'visits:*',
    'organizations:read',
    'patients:*',
    'deviations:*'
  ],
  org_admin: [
    'clinical_studies:read',
    'surveys:*',
    'visits:*',
    'organizations:manage_own',
    'patients:*',
    'users:manage_org',
    'deviations:*'
  ],
  investigator: [
    'clinical_studies:read',
    'surveys:manage',
    'visits:manage',
    'patients:manage',
    'deviations:view'
  ],
  coordinator: [
    'surveys:manage',
    'visits:manage',
    'patients:manage',
    'deviations:view'
  ],
  data_entry: [
    'surveys:read',
    'visits:manage',
    'patients:read',
    'examinations:*'
  ],
  viewer: [
    'clinical_studies:read',
    'surveys:read',
    'visits:read',
    'patients:read',
    'organizations:read'
  ]
};

/**
 * Check if user has permission for a specific action
 */
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const userPermissions = rolePermissions[userRole] || [];
  
  // Super admin has all permissions
  if (userPermissions.includes('*')) {
    return true;
  }
  
  // Check exact match
  if (userPermissions.includes(permission)) {
    return true;
  }
  
  // Check wildcard permissions
  const [resource, action] = permission.split(':');
  const wildcardPermission = `${resource}:*`;
  
  return userPermissions.includes(wildcardPermission);
}

/**
 * Middleware to check if user has required permissions
 */
export function checkPermission(requiredRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRole = req.user.role as UserRole;
    
    // Check if user has one of the required roles
    if (requiredRoles.includes(userRole)) {
      return next();
    }

    // Special case: super_admin always has access
    if (userRole === 'super_admin') {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions'
    });
  };
}

/**
 * Check resource-specific permissions
 */
export function checkResourcePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRole = req.user.role as UserRole;
    
    if (hasPermission(userRole, permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `Permission denied: ${permission}`
    });
  };
}

/**
 * Check organization-based access
 */
export function checkOrganizationAccess() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRole = req.user.role as UserRole;
    const userOrganizationId = req.user.organizationId;
    const requestedOrganizationId = req.params.organizationId || req.body.organizationId;

    // Super admin and study admin can access all organizations
    if (userRole === 'super_admin' || userRole === 'study_admin') {
      return next();
    }

    // Other roles can only access their own organization
    if (userOrganizationId === requestedOrganizationId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Access denied: Organization mismatch'
    });
  };
}

/**
 * Check study-specific access
 */
export function checkStudyAccess() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRole = req.user.role as UserRole;
    const userStudies = req.user.accessibleStudies || [];
    const requestedStudyId = req.params.clinicalStudyId || req.body.clinicalStudyId;

    // Super admin and study admin can access all studies
    if (userRole === 'super_admin' || userRole === 'study_admin') {
      return next();
    }

    // Check if user has access to the requested study
    if (userStudies.includes(requestedStudyId)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Access denied: Study not accessible'
    });
  };
}

/**
 * Combine multiple permission checks
 */
export function requirePermissions(...permissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRole = req.user.role as UserRole;
    
    // Check if user has all required permissions
    const hasAllPermissions = permissions.every(permission => 
      hasPermission(userRole, permission)
    );

    if (hasAllPermissions) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `Missing required permissions: ${permissions.join(', ')}`
    });
  };
}

/**
 * Get user permissions for client-side permission checking
 */
export function getUserPermissions(userRole: UserRole): string[] {
  return rolePermissions[userRole] || [];
}

/**
 * Middleware to add user permissions to response
 */
export function addPermissionsToResponse() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user) {
      const userRole = req.user.role as UserRole;
      req.user.permissions = getUserPermissions(userRole);
    }
    next();
  };
}