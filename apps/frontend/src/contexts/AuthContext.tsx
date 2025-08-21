import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, UserProfile } from '../services/AuthService';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
  hasGroup: (group: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
    authService.setupTokenRefresh();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const isAuth = await authService.isAuthenticated();
      
      if (isAuth) {
        const profile = await authService.getUserProfile();
        setUser(profile);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      await authService.signIn({ username, password });
      const profile = await authService.getUserProfile();
      setUser(profile);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await authService.getUserProfile();
      setUser(profile);
    } catch (error) {
      console.error('Profile refresh error:', error);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Super admin has all permissions
    if (user.groups?.includes('super_admin')) {
      return true;
    }

    // Check role-based permissions
    const rolePermissions = getRolePermissions(user.role);
    if (rolePermissions.includes('*') || rolePermissions.includes(permission)) {
      return true;
    }

    // Check wildcard permissions
    const [category] = permission.split(':');
    const wildcardPermission = `${category}:*`;
    if (rolePermissions.includes(wildcardPermission)) {
      return true;
    }

    return false;
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role || '');
  };

  const hasGroup = (group: string | string[]): boolean => {
    if (!user) return false;
    
    const groups = Array.isArray(group) ? group : [group];
    const userGroups = user.groups || [];
    
    return groups.some(g => userGroups.includes(g));
  };

  const getRolePermissions = (role?: string): string[] => {
    const permissionMap: Record<string, string[]> = {
      'super_admin': ['*'],
      'study_admin': [
        'study:*', 
        'organization:*', 
        'user:*',
        'patient:*',
        'visit:*',
        'examination:*',
        'audit:*'
      ],
      'org_admin': [
        'organization:manage',
        'user:manage',
        'patient:manage',
        'visit:read',
        'examination:read',
        'audit:read'
      ],
      'investigator': [
        'study:read',
        'patient:manage',
        'visit:manage',
        'examination:manage',
        'audit:read'
      ],
      'coordinator': [
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
        'patient:read',
        'visit:read',
        'examination:read'
      ]
    };

    return permissionMap[role || ''] || [];
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    refreshProfile,
    hasPermission,
    hasRole,
    hasGroup
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC for protecting routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      return <div>Please sign in to access this page.</div>;
    }

    return <Component {...props} />;
  };
}

// HOC for role-based access
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: string | string[]
) {
  return function RoleProtectedComponent(props: P) {
    const { hasRole, isLoading } = useAuth();

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!hasRole(allowedRoles)) {
      return <div>Access denied. Insufficient permissions.</div>;
    }

    return <Component {...props} />;
  };
}

// HOC for permission-based access
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: string
) {
  return function PermissionProtectedComponent(props: P) {
    const { hasPermission, isLoading } = useAuth();

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!hasPermission(requiredPermission)) {
      return <div>Access denied. Insufficient permissions.</div>;
    }

    return <Component {...props} />;
  };
}