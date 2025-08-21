import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import { UserRecord } from '../repositories/UserRepository.js';

// Extended Request interface to include user information
export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string; // Cognito user ID
    username: string;
    email: string;
    groups?: string[];
    organizationId?: string;
    role?: string;
    sessionId?: string; // Session ID for logout
    fullUserRecord?: UserRecord; // Full user record from database (populated by authorization middleware)
    [key: string]: any;
  };
}

export interface CognitoJWTPayload {
  sub: string;
  aud: string;
  'cognito:username': string;
  email: string;
  'cognito:groups'?: string[];
  'custom:organization_id'?: string;
  'custom:role'?: string;
  token_use: 'access' | 'id';
  iss: string;
  exp: number;
  iat: number;
  [key: string]: any;
}

/**
 * Verify Cognito JWT token without validating signature (for development)
 * In production, you should verify the signature using Cognito's public keys
 */
function verifyToken(token: string): CognitoJWTPayload {
  try {
    // Decode without verification for development
    // TODO: In production, fetch and verify with Cognito's public keys
    const decoded = jwt.decode(token) as CognitoJWTPayload;
    
    if (!decoded) {
      throw new Error('Invalid token format');
    }

    // Basic validation
    if (decoded.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }

    if (decoded.token_use !== 'access' && decoded.token_use !== 'id') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error(`Token verification failed: ${error}`);
  }
}

/**
 * Authentication middleware - verifies JWT token from Cognito
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    
    // Extract user information from JWT payload
    req.user = {
      sub: decoded.sub,
      username: decoded['cognito:username'] || decoded.username,
      email: decoded.email,
      groups: decoded['cognito:groups'] || [],
      organizationId: decoded['custom:organization_id'] || 'org-admin-001', // Default for testing
      role: decoded['custom:role'] || 'super_admin', // Default for testing
      sessionId: decoded.sessionId, // Include session ID for logout
      ...decoded // Include all other claims
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Authorization middleware - checks if user has required role/group
 */
export function requireRole(roles: string | string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    const userGroups = req.user.groups || [];
    const userRole = req.user.role;

    // Check if user has any of the required roles (either in groups or custom:role attribute)
    const hasRole = requiredRoles.some(role => 
      userGroups.includes(role) || userRole === role
    );

    if (!hasRole) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredRoles,
        current: { groups: userGroups, role: userRole }
      });
      return;
    }

    next();
  };
}

/**
 * Organization access middleware - checks if user has access to specific organization
 */
export function requireOrganizationAccess(organizationIdParam: string = 'organizationId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const requestedOrgId = req.params[organizationIdParam] || req.body.organizationId;
    const userOrgId = req.user.organizationId;
    const userGroups = req.user.groups || [];

    // Super admins and study admins can access any organization
    if (userGroups.includes('super_admin') || userGroups.includes('study_admin')) {
      next();
      return;
    }

    // Other users can only access their own organization
    if (userOrgId !== requestedOrgId) {
      res.status(403).json({ 
        error: 'Access denied to this organization',
        userOrganization: userOrgId,
        requestedOrganization: requestedOrgId
      });
      return;
    }

    next();
  };
}

/**
 * Optional authentication middleware - populates user if token is present but doesn't require it
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      sub: decoded.sub,
      username: decoded['cognito:username'] || decoded.username,
      email: decoded.email,
      groups: decoded['cognito:groups'] || [],
      organizationId: decoded['custom:organization_id'],
      role: decoded['custom:role'],
      ...decoded
    };
  } catch (error) {
    // Ignore token errors for optional auth
    console.warn('Optional auth token error:', error);
  }

  next();
}

/**
 * Extract user information from request (for logging/auditing)
 */
export function extractUserContext(req: AuthenticatedRequest): {
  userId?: string;
  username?: string;
  organizationId?: string;
  role?: string;
  groups?: string[];
} {
  if (!req.user) {
    return {};
  }

  return {
    userId: req.user.sub,
    username: req.user.username,
    organizationId: req.user.organizationId,
    role: req.user.role,
    groups: req.user.groups
  };
}

// Alias for backward compatibility
export const authenticateJWT = authenticateToken;