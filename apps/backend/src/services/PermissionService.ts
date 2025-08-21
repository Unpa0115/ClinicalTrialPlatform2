import { UserRecord } from '../repositories/UserRepository.js';

export type Permission = 
  // System-wide permissions
  | '*'  // Super admin - all permissions
  
  // Study management
  | 'study:create' | 'study:read' | 'study:update' | 'study:delete'
  | 'study:*'  // All study permissions
  
  // Clinical study management (alias for study)
  | 'clinical_study:create' | 'clinical_study:read' | 'clinical_study:update' | 'clinical_study:delete'
  | 'clinical_study:*'  // All clinical study permissions
  
  // Survey management
  | 'survey:create' | 'survey:read' | 'survey:update' | 'survey:delete'
  | 'survey:manage'  // All survey permissions except delete
  | 'survey:*'  // All survey permissions
  
  // Organization management
  | 'organization:create' | 'organization:read' | 'organization:update' | 'organization:delete'
  | 'organization:manage'  // All organization permissions except create/delete
  | 'organization:*'  // All organization permissions
  
  // User management
  | 'user:create' | 'user:read' | 'user:update' | 'user:delete'
  | 'user:manage'  // All user permissions except create/delete
  | 'user:*'  // All user permissions
  
  // Patient management
  | 'patient:create' | 'patient:read' | 'patient:update' | 'patient:delete'
  | 'patient:manage'  // All patient permissions except delete
  | 'patient:*'  // All patient permissions
  
  // Visit management
  | 'visit:create' | 'visit:read' | 'visit:update' | 'visit:delete'
  | 'visit:manage'  // All visit permissions except delete
  | 'visit:*'  // All visit permissions
  
  // Examination data
  | 'examination:create' | 'examination:read' | 'examination:update' | 'examination:delete'
  | 'examination:manage'  // All examination permissions except delete
  | 'examination:*'  // All examination permissions
  
  // Audit and compliance
  | 'audit:read' | 'audit:export'
  | 'audit:*'  // All audit permissions
  
  // System administration
  | 'system:read' | 'system:manage'
  | 'system:*';  // All system permissions

export interface PermissionContext {
  userId: string;
  organizationId?: string;
  studyId?: string;
  patientId?: string;
  targetOrganizationId?: string;
  targetStudyId?: string;
}

export class PermissionService {
  
  /**
   * Get default permissions for a role
   */
  static getDefaultPermissions(role: UserRecord['role']): Permission[] {
    const permissionMap: Record<UserRecord['role'], Permission[]> = {
      'super_admin': ['*'],
      'study_admin': [
        'study:*', 
        'clinical_study:*',
        'survey:*',
        'organization:*', 
        'user:*',
        'patient:*',
        'visit:*',
        'examination:*',
        'audit:*'
      ],
      'org_admin': [
        'clinical_study:read',
        'survey:manage',
        'organization:manage',
        'user:manage',
        'patient:manage',
        'visit:read',
        'examination:read',
        'audit:read'
      ],
      'investigator': [
        'study:read',
        'clinical_study:read',
        'survey:manage',
        'patient:manage',
        'visit:manage',
        'examination:manage',
        'audit:read'
      ],
      'coordinator': [
        'survey:create',
        'survey:read',
        'survey:update',
        'patient:manage',
        'visit:manage',
        'examination:manage'
      ],
      'data_entry': [
        'examination:create',
        'examination:update',
        'visit:read',
        'patient:read'
      ],
      'viewer': [
        'study:read',
        'clinical_study:read',
        'survey:read',
        'patient:read',
        'visit:read',
        'examination:read'
      ]
    };

    return permissionMap[role] || [];
  }

  /**
   * Check if user has a specific permission
   */
  static hasPermission(user: UserRecord, permission: Permission, context?: PermissionContext): boolean {
    // Ensure permissions array exists
    if (!user.permissions || !Array.isArray(user.permissions)) {
      console.warn('User permissions not found or invalid:', user);
      return false;
    }

    // Super admin has all permissions
    if (user.permissions.includes('*')) {
      return true;
    }

    // Check direct permission
    if (user.permissions.includes(permission)) {
      return true;
    }

    // Check wildcard permissions
    const [category] = permission.split(':');
    const wildcardPermission = `${category}:*` as Permission;
    if (user.permissions.includes(wildcardPermission)) {
      return true;
    }

    // Context-based permissions
    if (context) {
      return this.checkContextualPermission(user, permission, context);
    }

    return false;
  }

  /**
   * Check multiple permissions (user must have ALL)
   */
  static hasAllPermissions(user: UserRecord, permissions: Permission[], context?: PermissionContext): boolean {
    return permissions.every(permission => this.hasPermission(user, permission, context));
  }

  /**
   * Check multiple permissions (user must have ANY)
   */
  static hasAnyPermission(user: UserRecord, permissions: Permission[], context?: PermissionContext): boolean {
    return permissions.some(permission => this.hasPermission(user, permission, context));
  }

  /**
   * Check if user can access a specific organization
   */
  static canAccessOrganization(user: UserRecord, organizationId: string): boolean {
    // Super admin and study admin can access any organization
    if (user.role === 'super_admin' || user.role === 'study_admin') {
      return true;
    }

    // Check if user's organization matches or if it's in accessible organizations
    return user.primaryOrganizationId === organizationId || 
           user.accessibleOrganizations.includes(organizationId);
  }

  /**
   * Check if user can access a specific study
   */
  static canAccessStudy(user: UserRecord, studyId: string): boolean {
    // Super admin and study admin can access any study
    if (user.role === 'super_admin' || user.role === 'study_admin') {
      return true;
    }

    // Check if study is in user's accessible studies
    return user.accessibleStudies.includes(studyId);
  }

  /**
   * Check contextual permissions based on organization/study access
   */
  private static checkContextualPermission(
    user: UserRecord, 
    permission: Permission, 
    context: PermissionContext
  ): boolean {
    // Organization-based access control
    if (context.targetOrganizationId) {
      if (!this.canAccessOrganization(user, context.targetOrganizationId)) {
        return false;
      }
    }

    // Study-based access control
    if (context.targetStudyId) {
      if (!this.canAccessStudy(user, context.targetStudyId)) {
        return false;
      }
    }

    // Self-access permissions (user can always access their own data)
    if (context.userId === user.cognitoSub) {
      const selfPermissions: Permission[] = [
        'user:read', 'user:update',
        'examination:read', 'visit:read'
      ];
      if (selfPermissions.includes(permission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get effective permissions for a user (combining role permissions with custom permissions)
   */
  static getEffectivePermissions(user: UserRecord): Permission[] {
    const rolePermissions = this.getDefaultPermissions(user.role);
    const customPermissions = user.permissions as Permission[];
    
    // Merge and deduplicate
    const allPermissions = [...rolePermissions, ...customPermissions];
    return [...new Set(allPermissions)];
  }

  /**
   * Check if user can perform action on resource
   */
  static canPerformAction(
    user: UserRecord,
    action: 'create' | 'read' | 'update' | 'delete',
    resource: 'study' | 'organization' | 'user' | 'patient' | 'visit' | 'examination' | 'audit' | 'system',
    context?: PermissionContext
  ): boolean {
    const permission = `${resource}:${action}` as Permission;
    return this.hasPermission(user, permission, context);
  }

  /**
   * Filter items based on user permissions and context
   */
  static filterByPermissions<T extends { organizationId?: string; studyId?: string }>(
    user: UserRecord,
    items: T[],
    requiredPermission: Permission
  ): T[] {
    return items.filter(item => {
      const context: PermissionContext = {
        userId: user.cognitoSub,
        organizationId: user.primaryOrganizationId,
        targetOrganizationId: item.organizationId,
        targetStudyId: item.studyId
      };
      
      return this.hasPermission(user, requiredPermission, context);
    });
  }

  /**
   * Validate role hierarchy (for role assignment validation)
   */
  static canAssignRole(assignerRole: UserRecord['role'], targetRole: UserRecord['role']): boolean {
    const roleHierarchy: Record<UserRecord['role'], number> = {
      'super_admin': 10,
      'study_admin': 20,
      'org_admin': 30,
      'investigator': 40,
      'coordinator': 50,
      'data_entry': 60,
      'viewer': 70
    };

    const assignerLevel = roleHierarchy[assignerRole];
    const targetLevel = roleHierarchy[targetRole];

    // Can only assign roles at same level or lower (higher number)
    return assignerLevel <= targetLevel;
  }
}