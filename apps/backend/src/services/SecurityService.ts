import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { AuditService } from './AuditService';
import { AuthService } from './AuthService';

export interface SecurityThreat {
  threatId: string;
  threatType: 'brute_force' | 'suspicious_activity' | 'data_breach_attempt' | 'unauthorized_access' | 'malware' | 'ddos';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'investigating' | 'mitigated' | 'resolved';
  sourceIp: string;
  targetResource: string;
  userId?: string;
  username?: string;
  description: string;
  detectionTime: string;
  lastActivity: string;
  attemptCount: number;
  isBlocked: boolean;
  blockedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
}

export interface SecurityIncident {
  incidentId: string;
  incidentType: 'security_breach' | 'data_leak' | 'unauthorized_modification' | 'system_compromise' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'contained' | 'resolved';
  reportedBy: string;
  assignedTo?: string;
  affectedResources: string[];
  affectedUsers: string[];
  description: string;
  timeline: IncidentTimelineEntry[];
  mitigationActions: string[];
  reportedAt: string;
  resolvedAt?: string;
  impactAssessment?: string;
}

export interface IncidentTimelineEntry {
  timestamp: string;
  action: string;
  performedBy: string;
  description: string;
}

export interface SecurityPolicy {
  policyId: string;
  policyType: 'access_control' | 'ip_restriction' | 'session_management' | 'password_policy' | 'audit_policy';
  policyName: string;
  description: string;
  rules: any;
  isActive: boolean;
  enforcementLevel: 'warn' | 'block' | 'audit';
  createdBy: string;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPAccessRule {
  ruleId: string;
  ruleName: string;
  ipAddress: string;
  ipRange?: string;
  action: 'allow' | 'deny';
  organizationId?: string;
  userRole?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  username: string;
  ipAddress: string;
  userAgent: string;
  loginTime: string;
  lastActivity: string;
  isActive: boolean;
  organizationId: string;
  role: string;
  permissions: string[];
}

export class SecurityService {
  private docClient: DynamoDBDocumentClient;
  private auditService: AuditService;
  private authService: AuthService;

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'ap-northeast-1'
    });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.auditService = new AuditService();
    this.authService = new AuthService();
  }

  // Threat Detection and Management
  async detectThreat(
    threatType: SecurityThreat['threatType'],
    sourceIp: string,
    targetResource: string,
    userId?: string,
    username?: string,
    description?: string
  ): Promise<SecurityThreat> {
    const existingThreat = await this.getActiveThreatByIP(sourceIp, threatType);
    
    if (existingThreat) {
      // Update existing threat
      existingThreat.attemptCount += 1;
      existingThreat.lastActivity = new Date().toISOString();
      
      await this.updateThreat(existingThreat.threatId, {
        attemptCount: existingThreat.attemptCount,
        lastActivity: existingThreat.lastActivity
      });

      // Auto-block if threshold exceeded
      if (existingThreat.attemptCount >= 5 && !existingThreat.isBlocked) {
        await this.blockThreat(existingThreat.threatId, 'system-auto');
      }

      return existingThreat;
    }

    // Create new threat
    const threatId = `threat-${threatType}-${Date.now()}`;
    const now = new Date().toISOString();

    const threat: SecurityThreat = {
      threatId,
      threatType,
      severity: this.calculateThreatSeverity(threatType),
      status: 'active',
      sourceIp,
      targetResource,
      userId,
      username,
      description: description || `${threatType} detected from ${sourceIp}`,
      detectionTime: now,
      lastActivity: now,
      attemptCount: 1,
      isBlocked: false
    };

    await this.docClient.send(new PutCommand({
      TableName: 'dev-SecurityThreats',
      Item: threat
    }));

    await this.auditService.logEvent({
      eventType: 'create',
      action: 'security_threat_detected',
      userId: 'system',
      targetType: 'security_threat',
      targetId: threatId,
      description: `Security threat detected: ${threatType} from ${sourceIp}`,
      severity: 'high',
      ipAddress: sourceIp
    });

    return threat;
  }

  async getActiveThreatByIP(ipAddress: string, threatType?: string): Promise<SecurityThreat | null> {
    const params: any = {
      TableName: 'dev-SecurityThreats',
      FilterExpression: 'sourceIp = :ip AND #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':ip': ipAddress,
        ':status': 'active'
      }
    };

    if (threatType) {
      params.FilterExpression += ' AND threatType = :threatType';
      params.ExpressionAttributeValues[':threatType'] = threatType;
    }

    const result = await this.docClient.send(new ScanCommand(params));
    
    return result.Items && result.Items.length > 0 ? result.Items[0] as SecurityThreat : null;
  }

  async updateThreat(threatId: string, updates: Partial<SecurityThreat>): Promise<void> {
    const updateExpressions: string[] = [];
    const expressionAttributeValues: any = {};
    const expressionAttributeNames: any = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'status') {
        updateExpressions.push('#status = :status');
        expressionAttributeNames['#status'] = 'status';
        expressionAttributeValues[':status'] = value;
      } else {
        updateExpressions.push(`${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    await this.docClient.send(new UpdateCommand({
      TableName: 'dev-SecurityThreats',
      Key: { threatId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues
    }));
  }

  async blockThreat(threatId: string, blockedBy: string): Promise<void> {
    await this.updateThreat(threatId, {
      isBlocked: true,
      blockedAt: new Date().toISOString(),
      status: 'mitigated'
    });

    await this.auditService.logEvent({
      eventType: 'update',
      action: 'security_threat_blocked',
      userId: blockedBy,
      targetType: 'security_threat',
      targetId: threatId,
      description: `Security threat ${threatId} blocked`,
      severity: 'high'
    });
  }

  async resolveThreat(threatId: string, resolvedBy: string, notes?: string): Promise<void> {
    await this.updateThreat(threatId, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
      resolvedBy,
      notes
    });

    await this.auditService.logEvent({
      eventType: 'update',
      action: 'security_threat_resolved',
      userId: resolvedBy,
      targetType: 'security_threat',
      targetId: threatId,
      description: `Security threat ${threatId} resolved`,
      severity: 'medium'
    });
  }

  // Security Incident Management
  async createIncident(incident: Omit<SecurityIncident, 'incidentId' | 'reportedAt' | 'timeline'>): Promise<SecurityIncident> {
    const incidentId = `incident-${incident.incidentType}-${Date.now()}`;
    const now = new Date().toISOString();

    const newIncident: SecurityIncident = {
      ...incident,
      incidentId,
      reportedAt: now,
      timeline: [{
        timestamp: now,
        action: 'incident_created',
        performedBy: incident.reportedBy,
        description: 'Security incident created'
      }]
    };

    await this.docClient.send(new PutCommand({
      TableName: 'dev-SecurityIncidents',
      Item: newIncident
    }));

    await this.auditService.logEvent({
      eventType: 'create',
      action: 'security_incident_created',
      userId: incident.reportedBy,
      targetType: 'security_incident',
      targetId: incidentId,
      description: `Security incident created: ${incident.incidentType}`,
      severity: 'critical'
    });

    return newIncident;
  }

  async updateIncidentStatus(incidentId: string, status: SecurityIncident['status'], userId: string, notes?: string): Promise<void> {
    const incident = await this.getIncident(incidentId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    const timelineEntry: IncidentTimelineEntry = {
      timestamp: new Date().toISOString(),
      action: `status_changed_to_${status}`,
      performedBy: userId,
      description: notes || `Incident status changed to ${status}`
    };

    incident.timeline.push(timelineEntry);
    
    const updates: any = {
      status,
      timeline: incident.timeline
    };

    if (status === 'resolved') {
      updates.resolvedAt = new Date().toISOString();
    }

    await this.updateIncident(incidentId, updates);
  }

  async getIncident(incidentId: string): Promise<SecurityIncident | null> {
    const result = await this.docClient.send(new GetCommand({
      TableName: 'dev-SecurityIncidents',
      Key: { incidentId }
    }));

    return result.Item as SecurityIncident || null;
  }

  async updateIncident(incidentId: string, updates: Partial<SecurityIncident>): Promise<void> {
    const updateExpressions: string[] = [];
    const expressionAttributeValues: any = {};
    const expressionAttributeNames: any = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'status') {
        updateExpressions.push('#status = :status');
        expressionAttributeNames['#status'] = 'status';
        expressionAttributeValues[':status'] = value;
      } else {
        updateExpressions.push(`${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    await this.docClient.send(new UpdateCommand({
      TableName: 'dev-SecurityIncidents',
      Key: { incidentId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues
    }));
  }

  // IP Access Control
  async createIPAccessRule(rule: Omit<IPAccessRule, 'ruleId' | 'createdAt'>): Promise<IPAccessRule> {
    const ruleId = `ip-rule-${Date.now()}`;
    const now = new Date().toISOString();

    const newRule: IPAccessRule = {
      ...rule,
      ruleId,
      createdAt: now
    };

    await this.docClient.send(new PutCommand({
      TableName: 'dev-IPAccessRules',
      Item: newRule
    }));

    await this.auditService.logEvent({
      eventType: 'create',
      action: 'ip_access_rule_created',
      userId: rule.createdBy,
      targetType: 'ip_access_rule',
      targetId: ruleId,
      description: `IP access rule created: ${rule.action} ${rule.ipAddress}`,
      severity: 'medium'
    });

    return newRule;
  }

  async checkIPAccess(ipAddress: string, organizationId?: string, userRole?: string): Promise<boolean> {
    const result = await this.docClient.send(new ScanCommand({
      TableName: 'dev-IPAccessRules',
      FilterExpression: 'isActive = :isActive',
      ExpressionAttributeValues: {
        ':isActive': true
      }
    }));

    const rules = result.Items as IPAccessRule[] || [];

    // Check specific IP matches first
    const specificRules = rules.filter(rule => rule.ipAddress === ipAddress);
    if (specificRules.length > 0) {
      const denyRule = specificRules.find(rule => rule.action === 'deny');
      if (denyRule) return false;
      
      const allowRule = specificRules.find(rule => rule.action === 'allow');
      if (allowRule) return true;
    }

    // Check IP range matches
    const rangeRules = rules.filter(rule => rule.ipRange && this.isIPInRange(ipAddress, rule.ipRange));
    if (rangeRules.length > 0) {
      const denyRule = rangeRules.find(rule => rule.action === 'deny');
      if (denyRule) return false;
      
      const allowRule = rangeRules.find(rule => rule.action === 'allow');
      if (allowRule) return true;
    }

    // Default allow if no specific rules
    return true;
  }

  // Session Management
  async getActiveSessions(): Promise<SessionInfo[]> {
    // In production, this would query a sessions table or cache
    // For now, return mock data
    return [
      {
        sessionId: 'session-001',
        userId: 'user-001',
        username: 'admin_user',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        isActive: true,
        organizationId: 'org-admin-001',
        role: 'super_admin',
        permissions: ['read', 'write', 'admin']
      }
    ];
  }

  async terminateSession(sessionId: string, terminatedBy: string): Promise<void> {
    // In production, this would invalidate the session in the session store
    await this.auditService.logEvent({
      eventType: 'update',
      action: 'session_terminated',
      userId: terminatedBy,
      targetType: 'user_session',
      targetId: sessionId,
      description: `User session ${sessionId} terminated by administrator`,
      severity: 'high'
    });
  }

  async terminateAllUserSessions(userId: string, terminatedBy: string): Promise<void> {
    // In production, this would invalidate all sessions for the user
    await this.auditService.logEvent({
      eventType: 'update',
      action: 'all_user_sessions_terminated',
      userId: terminatedBy,
      targetType: 'user_session',
      targetId: userId,
      description: `All sessions for user ${userId} terminated by administrator`,
      severity: 'high'
    });
  }

  // Security Monitoring
  async getSecurityMetrics(timeRange: 'hour' | 'day' | 'week' | 'month'): Promise<any> {
    const now = new Date();
    let startTime: Date;

    switch (timeRange) {
      case 'hour':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get security events from audit logs
    const auditLogs = await this.auditService.getAuditLogs({
      startDate: startTime.toISOString(),
      endDate: now.toISOString(),
      eventTypes: ['login', 'logout', 'create', 'update', 'delete', 'view']
    });

    return {
      totalEvents: auditLogs.length,
      loginAttempts: auditLogs.filter(log => log.action === 'user_login_attempt').length,
      successfulLogins: auditLogs.filter(log => log.action === 'user_login_successful').length,
      failedLogins: auditLogs.filter(log => log.action === 'user_login_failed').length,
      dataModifications: auditLogs.filter(log => log.eventType === 'update' || log.eventType === 'delete').length,
      suspiciousActivities: auditLogs.filter(log => log.severity === 'high' || log.severity === 'critical').length
    };
  }

  private calculateThreatSeverity(threatType: SecurityThreat['threatType']): 'low' | 'medium' | 'high' | 'critical' {
    switch (threatType) {
      case 'brute_force':
        return 'high';
      case 'data_breach_attempt':
        return 'critical';
      case 'unauthorized_access':
        return 'high';
      case 'ddos':
        return 'critical';
      case 'malware':
        return 'critical';
      case 'suspicious_activity':
        return 'medium';
      default:
        return 'medium';
    }
  }

  private isIPInRange(ip: string, range: string): boolean {
    // Simple CIDR matching - in production, use a proper library
    const [rangeIP, prefixLength] = range.split('/');
    if (!prefixLength) return ip === rangeIP;
    
    // For simplicity, just check if IPs match up to the prefix
    const ipParts = ip.split('.').map(Number);
    const rangeParts = rangeIP.split('.').map(Number);
    const bitsToCheck = parseInt(prefixLength);
    
    // This is a simplified implementation
    return ipParts[0] === rangeParts[0] && ipParts[1] === rangeParts[1];
  }
}