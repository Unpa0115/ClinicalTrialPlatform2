import { BaseRepository } from './BaseRepository.js';
import { tableNames } from '../config/database.js';

export interface AuditLogRecord {
  logId: string; // "log-{timestamp}-{uuid}"
  timestamp: string; // ISO string for chronological ordering
  
  // Event Information
  eventType: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'export' | 'import';
  action: string; // Specific action (e.g., "survey_created", "visit_completed")
  
  // User Information
  userId: string; // User who performed the action
  username: string; // Username
  userRole: string; // User role at time of action
  
  // Target Information
  targetType: 'clinical_study' | 'survey' | 'visit' | 'examination' | 'user' | 'organization' | 'patient';
  targetId: string; // Target ID
  targetName?: string; // Target name
  
  // Context Information
  clinicalStudyId?: string; // Related clinical study ID
  organizationId?: string; // Related organization ID
  patientId?: string; // Related patient ID
  surveyId?: string; // Related survey ID
  visitId?: string; // Related visit ID
  
  // Change Details
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[]; // Detailed changes
  
  // System Information
  ipAddress: string; // IP address
  userAgent: string; // User agent
  sessionId: string; // Session ID
  
  // Additional Context
  description?: string; // Additional description
  severity: 'low' | 'medium' | 'high' | 'critical'; // Severity level
  
  // Metadata
  createdAt: string; // ISO string
  
  // GSI for querying
  entityType: 'audit-log'; // GSI partition key
}

export interface AuditLogQuery {
  userId?: string;
  eventType?: AuditLogRecord['eventType'];
  targetType?: AuditLogRecord['targetType'];
  targetId?: string;
  clinicalStudyId?: string;
  organizationId?: string;
  severity?: AuditLogRecord['severity'];
  startDate?: string;
  endDate?: string;
}

export interface AuditLogStats {
  totalLogs: number;
  logsByEventType: { [key: string]: number };
  logsBySeverity: { [key: string]: number };
  logsByUser: { [key: string]: number };
  recentActivity: AuditLogRecord[];
}

/**
 * Repository for AuditLog table operations
 * Handles comprehensive event tracking and audit trail management
 */
export class AuditLogRepository extends BaseRepository<AuditLogRecord> {
  constructor() {
    super(tableNames.auditLog);
  }

  protected getPrimaryKeyName(): string {
    return 'logId';
  }

  protected getSortKeyName(): string | null {
    return 'timestamp';
  }

  protected getIndexPartitionKeyName(indexName: string): string | null {
    switch (indexName) {
      case 'EntityTypeIndex':
        return 'entityType';
      case 'UserIdIndex':
        return 'userId';
      case 'TargetIndex':
        return 'targetType';
      default:
        return null;
    }
  }

  protected getIndexSortKeyName(indexName: string): string | null {
    switch (indexName) {
      case 'EntityTypeIndex':
      case 'UserIdIndex':
      case 'TargetIndex':
        return 'timestamp';
      default:
        return null;
    }
  }

  /**
   * Create a new audit log entry
   */
  async logEvent(
    eventType: AuditLogRecord['eventType'],
    action: string,
    userId: string,
    username: string,
    userRole: string,
    targetType: AuditLogRecord['targetType'],
    targetId: string,
    context: {
      targetName?: string;
      clinicalStudyId?: string;
      organizationId?: string;
      patientId?: string;
      surveyId?: string;
      visitId?: string;
      changes?: AuditLogRecord['changes'];
      description?: string;
      severity?: AuditLogRecord['severity'];
      ipAddress: string;
      userAgent: string;
      sessionId: string;
    }
  ): Promise<AuditLogRecord> {
    const timestamp = new Date().toISOString();
    const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const auditLog: AuditLogRecord = {
      logId,
      timestamp,
      eventType,
      action,
      userId,
      username,
      userRole,
      targetType,
      targetId,
      targetName: context.targetName,
      clinicalStudyId: context.clinicalStudyId,
      organizationId: context.organizationId,
      patientId: context.patientId,
      surveyId: context.surveyId,
      visitId: context.visitId,
      changes: context.changes,
      description: context.description,
      severity: context.severity || 'low',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      createdAt: timestamp,
      entityType: 'audit-log',
    };

    return await this.create(auditLog);
  }

  /**
   * Log data modification events with change tracking
   */
  async logDataChange(
    action: 'create' | 'update' | 'delete',
    userId: string,
    username: string,
    userRole: string,
    targetType: AuditLogRecord['targetType'],
    targetId: string,
    targetName: string,
    changes: AuditLogRecord['changes'],
    context: {
      clinicalStudyId?: string;
      organizationId?: string;
      patientId?: string;
      surveyId?: string;
      visitId?: string;
      reason?: string;
      ipAddress: string;
      userAgent: string;
      sessionId: string;
    }
  ): Promise<AuditLogRecord> {
    const severity: AuditLogRecord['severity'] = 
      action === 'delete' ? 'high' : 
      changes.length > 5 ? 'medium' : 'low';

    return await this.logEvent(
      action,
      `${targetType}_${action}`,
      userId,
      username,
      userRole,
      targetType,
      targetId,
      {
        ...context,
        targetName,
        changes,
        description: context.reason,
        severity,
      }
    );
  }

  /**
   * Log user authentication events
   */
  async logAuthEvent(
    eventType: 'login' | 'logout',
    userId: string,
    username: string,
    success: boolean,
    context: {
      ipAddress: string;
      userAgent: string;
      sessionId: string;
      failureReason?: string;
    }
  ): Promise<AuditLogRecord> {
    return await this.logEvent(
      eventType,
      `user_${eventType}_${success ? 'success' : 'failure'}`,
      userId,
      username,
      'unknown', // Role might not be available during login
      'user',
      userId,
      {
        targetName: username,
        description: success ? `User ${eventType} successful` : `User ${eventType} failed: ${context.failureReason}`,
        severity: success ? 'low' : 'medium',
        ...context,
      }
    );
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    userId: string,
    username: string,
    userRole: string,
    targetType: AuditLogRecord['targetType'],
    targetId: string,
    targetName: string,
    context: {
      action: string;
      clinicalStudyId?: string;
      organizationId?: string;
      ipAddress: string;
      userAgent: string;
      sessionId: string;
    }
  ): Promise<AuditLogRecord> {
    return await this.logEvent(
      'view',
      context.action,
      userId,
      username,
      userRole,
      targetType,
      targetId,
      {
        targetName,
        clinicalStudyId: context.clinicalStudyId,
        organizationId: context.organizationId,
        severity: 'low',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
      }
    );
  }

  /**
   * Query audit logs with filters
   */
  async queryLogs(
    query: AuditLogQuery,
    limit: number = 50,
    lastEvaluatedKey?: any
  ): Promise<{
    logs: AuditLogRecord[];
    lastEvaluatedKey?: any;
  }> {
    // Use appropriate index based on query parameters
    if (query.userId) {
      return await this.queryByIndex(
        'UserIdIndex',
        query.userId,
        {
          sortKeyCondition: query.startDate && query.endDate ? {
            between: [query.startDate, query.endDate]
          } : undefined,
          limit,
          lastEvaluatedKey,
          scanIndexForward: false, // Most recent first
        }
      );
    }

    if (query.targetType) {
      return await this.queryByIndex(
        'TargetIndex',
        query.targetType,
        {
          sortKeyCondition: query.startDate && query.endDate ? {
            between: [query.startDate, query.endDate]
          } : undefined,
          limit,
          lastEvaluatedKey,
          scanIndexForward: false,
        }
      );
    }

    // Default query using EntityTypeIndex
    return await this.queryByIndex(
      'EntityTypeIndex',
      'audit-log',
      {
        sortKeyCondition: query.startDate && query.endDate ? {
          between: [query.startDate, query.endDate]
        } : undefined,
        limit,
        lastEvaluatedKey,
        scanIndexForward: false,
      }
    );
  }

  /**
   * Get audit logs for a specific target
   */
  async getLogsForTarget(
    targetType: AuditLogRecord['targetType'],
    targetId: string,
    limit: number = 50
  ): Promise<AuditLogRecord[]> {
    const result = await this.queryByIndex(
      'TargetIndex',
      targetType,
      {
        filterExpression: 'targetId = :targetId',
        expressionAttributeValues: {
          ':targetId': targetId,
        },
        limit,
        scanIndexForward: false,
      }
    );

    return result.logs;
  }

  /**
   * Get recent activity for dashboard
   */
  async getRecentActivity(
    organizationId?: string,
    limit: number = 20
  ): Promise<AuditLogRecord[]> {
    const result = await this.queryByIndex(
      'EntityTypeIndex',
      'audit-log',
      {
        filterExpression: organizationId ? 'organizationId = :orgId' : undefined,
        expressionAttributeValues: organizationId ? {
          ':orgId': organizationId,
        } : undefined,
        limit,
        scanIndexForward: false,
      }
    );

    return result.logs;
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(
    organizationId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<AuditLogStats> {
    // In a real implementation, this would use DynamoDB aggregation
    // For now, we'll return a simple scan-based implementation
    const result = await this.queryByIndex(
      'EntityTypeIndex',
      'audit-log',
      {
        filterExpression: this.buildFilterExpression({
          organizationId,
          startDate,
          endDate,
        }),
        expressionAttributeValues: this.buildExpressionAttributeValues({
          organizationId,
          startDate,
          endDate,
        }),
        limit: 1000, // Reasonable limit for stats calculation
        scanIndexForward: false,
      }
    );

    const logs = result.logs;
    
    // Calculate statistics
    const logsByEventType: { [key: string]: number } = {};
    const logsBySeverity: { [key: string]: number } = {};
    const logsByUser: { [key: string]: number } = {};

    logs.forEach(log => {
      logsByEventType[log.eventType] = (logsByEventType[log.eventType] || 0) + 1;
      logsBySeverity[log.severity] = (logsBySeverity[log.severity] || 0) + 1;
      logsByUser[log.username] = (logsByUser[log.username] || 0) + 1;
    });

    return {
      totalLogs: logs.length,
      logsByEventType,
      logsBySeverity,
      logsByUser,
      recentActivity: logs.slice(0, 10), // Most recent 10 entries
    };
  }

  /**
   * Get compliance report data
   */
  async getComplianceReport(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    dataModifications: AuditLogRecord[];
    accessViolations: AuditLogRecord[];
    criticalEvents: AuditLogRecord[];
    userActivity: { [userId: string]: number };
  }> {
    const result = await this.queryByIndex(
      'EntityTypeIndex',
      'audit-log',
      {
        filterExpression: 'organizationId = :orgId AND #timestamp BETWEEN :startDate AND :endDate',
        expressionAttributeNames: {
          '#timestamp': 'timestamp',
        },
        expressionAttributeValues: {
          ':orgId': organizationId,
          ':startDate': startDate,
          ':endDate': endDate,
        },
        limit: 5000, // Large limit for comprehensive reporting
        scanIndexForward: false,
      }
    );

    const logs = result.logs;

    const dataModifications = logs.filter(log => 
      ['create', 'update', 'delete'].includes(log.eventType)
    );

    const accessViolations = logs.filter(log =>
      log.severity === 'high' && log.eventType === 'view'
    );

    const criticalEvents = logs.filter(log =>
      log.severity === 'critical'
    );

    const userActivity: { [userId: string]: number } = {};
    logs.forEach(log => {
      userActivity[log.userId] = (userActivity[log.userId] || 0) + 1;
    });

    return {
      dataModifications,
      accessViolations,
      criticalEvents,
      userActivity,
    };
  }

  /**
   * Clean up old audit logs (should be called by maintenance job)
   */
  async cleanupOldLogs(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffTimestamp = cutoffDate.toISOString();

    // In a real implementation, this would use a more efficient batch operation
    const result = await this.queryByIndex(
      'EntityTypeIndex',
      'audit-log',
      {
        filterExpression: '#timestamp < :cutoffDate',
        expressionAttributeNames: {
          '#timestamp': 'timestamp',
        },
        expressionAttributeValues: {
          ':cutoffDate': cutoffTimestamp,
        },
        limit: 1000,
      }
    );

    let deletedCount = 0;
    for (const log of result.logs) {
      await this.delete(log.logId, log.timestamp);
      deletedCount++;
    }

    return deletedCount;
  }

  /**
   * Helper method to build filter expression
   */
  private buildFilterExpression(params: {
    organizationId?: string;
    startDate?: string;
    endDate?: string;
  }): string | undefined {
    const conditions = [];

    if (params.organizationId) {
      conditions.push('organizationId = :orgId');
    }

    if (params.startDate && params.endDate) {
      conditions.push('#timestamp BETWEEN :startDate AND :endDate');
    } else if (params.startDate) {
      conditions.push('#timestamp >= :startDate');
    } else if (params.endDate) {
      conditions.push('#timestamp <= :endDate');
    }

    return conditions.length > 0 ? conditions.join(' AND ') : undefined;
  }

  /**
   * Helper method to build expression attribute values
   */
  private buildExpressionAttributeValues(params: {
    organizationId?: string;
    startDate?: string;
    endDate?: string;
  }): { [key: string]: any } | undefined {
    const values: { [key: string]: any } = {};

    if (params.organizationId) {
      values[':orgId'] = params.organizationId;
    }

    if (params.startDate) {
      values[':startDate'] = params.startDate;
    }

    if (params.endDate) {
      values[':endDate'] = params.endDate;
    }

    return Object.keys(values).length > 0 ? values : undefined;
  }
}