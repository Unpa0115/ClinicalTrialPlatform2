import { AuditLogRepository, AuditLogRecord } from '../repositories/AuditLogRepository.js';

/**
 * Service for managing audit logging and compliance monitoring
 */
export class AuditService {
  private auditLogRepository: AuditLogRepository;

  constructor() {
    this.auditLogRepository = new AuditLogRepository();
  }

  /**
   * Log a data change event with comprehensive context
   */
  async logDataChange(
    eventType: 'create' | 'update' | 'delete',
    targetType: AuditLogRecord['targetType'],
    targetId: string,
    targetName: string,
    changes: AuditLogRecord['changes'],
    context: {
      userId: string;
      username: string;
      userRole: string;
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
    return await this.auditLogRepository.logDataChange(
      eventType,
      context.userId,
      context.username,
      context.userRole,
      targetType,
      targetId,
      targetName,
      changes,
      {
        clinicalStudyId: context.clinicalStudyId,
        organizationId: context.organizationId,
        patientId: context.patientId,
        surveyId: context.surveyId,
        visitId: context.visitId,
        reason: context.reason,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
      }
    );
  }

  /**
   * Log examination data access
   */
  async logExaminationAccess(
    userId: string,
    username: string,
    userRole: string,
    visitId: string,
    examinationId: string,
    eyeSide: 'right' | 'left',
    context: {
      clinicalStudyId?: string;
      organizationId?: string;
      patientId?: string;
      surveyId?: string;
      ipAddress: string;
      userAgent: string;
      sessionId: string;
    }
  ): Promise<AuditLogRecord> {
    return await this.auditLogRepository.logDataAccess(
      userId,
      username,
      userRole,
      'examination',
      `${visitId}-${examinationId}-${eyeSide}`,
      `${examinationId} (${eyeSide})`,
      {
        action: `examination_${examinationId}_${eyeSide}_accessed`,
        clinicalStudyId: context.clinicalStudyId,
        organizationId: context.organizationId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
      }
    );
  }

  /**
   * Log bulk data operations
   */
  async logBulkOperation(
    operationType: 'bulk_update' | 'bulk_delete' | 'data_import' | 'data_export',
    itemCount: number,
    successCount: number,
    failureCount: number,
    context: {
      userId: string;
      username: string;
      userRole: string;
      targetIds: string[];
      organizationId?: string;
      clinicalStudyId?: string;
      description?: string;
      ipAddress: string;
      userAgent: string;
      sessionId: string;
    }
  ): Promise<AuditLogRecord> {
    const severity: AuditLogRecord['severity'] = 
      failureCount > itemCount * 0.1 ? 'high' : // More than 10% failures
      failureCount > 0 ? 'medium' : 'low';

    const description = context.description || 
      `${operationType} operation: ${successCount} successful, ${failureCount} failed out of ${itemCount} items`;

    return await this.auditLogRepository.logEvent(
      operationType.includes('export') ? 'export' : 
      operationType.includes('import') ? 'import' :
      operationType.includes('delete') ? 'delete' : 'update',
      operationType,
      context.userId,
      context.username,
      context.userRole,
      'examination', // Assuming bulk operations are typically on examination data
      context.targetIds.join(','),
      {
        targetName: `Bulk operation on ${itemCount} items`,
        clinicalStudyId: context.clinicalStudyId,
        organizationId: context.organizationId,
        description,
        severity,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
      }
    );
  }

  /**
   * Log user authentication events
   */
  async logAuthentication(
    eventType: 'login' | 'logout',
    userId: string,
    username: string,
    success: boolean,
    context: {
      ipAddress: string;
      userAgent: string;
      sessionId: string;
      failureReason?: string;
      organizationId?: string;
    }
  ): Promise<AuditLogRecord> {
    return await this.auditLogRepository.logAuthEvent(
      eventType,
      userId,
      username,
      success,
      {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
        failureReason: context.failureReason,
      }
    );
  }

  /**
   * Log security events (unauthorized access attempts, permission violations)
   */
  async logSecurityEvent(
    action: string,
    userId: string,
    username: string,
    userRole: string,
    context: {
      targetType?: AuditLogRecord['targetType'];
      targetId?: string;
      targetName?: string;
      organizationId?: string;
      clinicalStudyId?: string;
      description: string;
      severity: AuditLogRecord['severity'];
      ipAddress: string;
      userAgent: string;
      sessionId: string;
    }
  ): Promise<AuditLogRecord> {
    return await this.auditLogRepository.logEvent(
      'view', // Most security events are related to unauthorized access
      action,
      userId,
      username,
      userRole,
      context.targetType || 'user',
      context.targetId || userId,
      {
        targetName: context.targetName,
        organizationId: context.organizationId,
        clinicalStudyId: context.clinicalStudyId,
        description: context.description,
        severity: context.severity,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
      }
    );
  }

  /**
   * Log protocol deviations
   */
  async logProtocolDeviation(
    deviationType: 'minor' | 'major' | 'critical',
    visitId: string,
    patientId: string,
    clinicalStudyId: string,
    description: string,
    context: {
      userId: string;
      username: string;
      userRole: string;
      organizationId: string;
      surveyId?: string;
      correctionAction?: string;
      ipAddress: string;
      userAgent: string;
      sessionId: string;
    }
  ): Promise<AuditLogRecord> {
    const severity: AuditLogRecord['severity'] = 
      deviationType === 'critical' ? 'critical' :
      deviationType === 'major' ? 'high' : 'medium';

    return await this.auditLogRepository.logEvent(
      'create',
      `protocol_deviation_${deviationType}`,
      context.userId,
      context.username,
      context.userRole,
      'visit',
      visitId,
      {
        targetName: `Protocol Deviation - Visit ${visitId}`,
        clinicalStudyId,
        organizationId: context.organizationId,
        patientId,
        surveyId: context.surveyId,
        description: `${description}${context.correctionAction ? ` Correction: ${context.correctionAction}` : ''}`,
        severity,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
      }
    );
  }

  /**
   * Log data quality issues
   */
  async logDataQualityIssue(
    issueType: 'missing_data' | 'invalid_data' | 'inconsistent_data' | 'outlier',
    severity: 'low' | 'medium' | 'high' | 'critical',
    fieldName: string,
    visitId: string,
    patientId: string,
    clinicalStudyId: string,
    description: string,
    context: {
      userId: string; // System user for automated detection
      username: string;
      userRole: string;
      organizationId: string;
      surveyId?: string;
      examinationId?: string;
      detectedValue?: any;
      expectedRange?: string;
      ipAddress: string;
      userAgent: string;
      sessionId: string;
    }
  ): Promise<AuditLogRecord> {
    return await this.auditLogRepository.logEvent(
      'create',
      `data_quality_${issueType}`,
      context.userId,
      context.username,
      context.userRole,
      'examination',
      `${visitId}-${fieldName}`,
      {
        targetName: `Data Quality Issue - ${fieldName}`,
        clinicalStudyId,
        organizationId: context.organizationId,
        patientId,
        surveyId: context.surveyId,
        visitId,
        description: `${description}${context.detectedValue ? ` Value: ${JSON.stringify(context.detectedValue)}` : ''}${context.expectedRange ? ` Expected: ${context.expectedRange}` : ''}`,
        severity: severity as AuditLogRecord['severity'],
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
      }
    );
  }

  /**
   * Query audit logs with filters
   */
  async queryAuditLogs(
    filters: {
      userId?: string;
      eventType?: AuditLogRecord['eventType'];
      targetType?: AuditLogRecord['targetType'];
      targetId?: string;
      clinicalStudyId?: string;
      organizationId?: string;
      severity?: AuditLogRecord['severity'];
      startDate?: string;
      endDate?: string;
    },
    pagination: {
      limit?: number;
      lastEvaluatedKey?: any;
    } = {}
  ) {
    return await this.auditLogRepository.queryLogs(
      filters,
      pagination.limit || 50,
      pagination.lastEvaluatedKey
    );
  }

  /**
   * Get audit logs for a specific target (e.g., visit, patient)
   */
  async getTargetAuditLogs(
    targetType: AuditLogRecord['targetType'],
    targetId: string,
    limit: number = 50
  ) {
    return await this.auditLogRepository.getLogsForTarget(targetType, targetId, limit);
  }

  /**
   * Get recent activity for dashboard
   */
  async getRecentActivity(organizationId?: string, limit: number = 20) {
    return await this.auditLogRepository.getRecentActivity(organizationId, limit);
  }

  /**
   * Generate compliance statistics
   */
  async getComplianceStats(
    organizationId?: string,
    startDate?: string,
    endDate?: string
  ) {
    return await this.auditLogRepository.getAuditStats(organizationId, startDate, endDate);
  }

  /**
   * Generate comprehensive compliance report
   */
  async generateComplianceReport(
    organizationId: string,
    startDate: string,
    endDate: string
  ) {
    const report = await this.auditLogRepository.getComplianceReport(
      organizationId,
      startDate,
      endDate
    );

    // Calculate additional metrics
    const totalEvents = report.dataModifications.length + report.accessViolations.length + report.criticalEvents.length;
    const complianceScore = Math.max(0, 100 - (report.accessViolations.length * 2 + report.criticalEvents.length * 5));

    return {
      ...report,
      summary: {
        reportPeriod: { startDate, endDate },
        organizationId,
        totalEvents,
        complianceScore,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Detect and log potential data quality issues automatically
   */
  async runDataQualityCheck(
    visitId: string,
    examinationData: { [examinationId: string]: { right?: any; left?: any } },
    context: {
      patientId: string;
      clinicalStudyId: string;
      organizationId: string;
      surveyId?: string;
      userId: string; // System user for automated detection
      username: string;
      ipAddress: string;
      userAgent: string;
      sessionId: string;
    }
  ) {
    const issues: AuditLogRecord[] = [];

    for (const [examinationId, examData] of Object.entries(examinationData)) {
      // Check for missing required data
      if (!examData.right && !examData.left) {
        const issue = await this.logDataQualityIssue(
          'missing_data',
          'high',
          examinationId,
          visitId,
          context.patientId,
          context.clinicalStudyId,
          `No data found for examination ${examinationId}`,
          context
        );
        issues.push(issue);
        continue;
      }

      // Check for partial data (only one eye)
      if (examData.right && !examData.left) {
        const issue = await this.logDataQualityIssue(
          'missing_data',
          'medium',
          `${examinationId}_left`,
          visitId,
          context.patientId,
          context.clinicalStudyId,
          `Missing left eye data for examination ${examinationId}`,
          { ...context, examinationId }
        );
        issues.push(issue);
      } else if (examData.left && !examData.right) {
        const issue = await this.logDataQualityIssue(
          'missing_data',
          'medium',
          `${examinationId}_right`,
          visitId,
          context.patientId,
          context.clinicalStudyId,
          `Missing right eye data for examination ${examinationId}`,
          { ...context, examinationId }
        );
        issues.push(issue);
      }

      // Examination-specific quality checks
      if (examinationId === 'vas') {
        issues.push(...await this.checkVASQuality(examData, examinationId, visitId, context));
      } else if (examinationId === 'basic-info') {
        issues.push(...await this.checkBasicInfoQuality(examData, examinationId, visitId, context));
      }
    }

    return issues;
  }

  /**
   * Check VAS data quality
   */
  private async checkVASQuality(
    examData: { right?: any; left?: any },
    examinationId: string,
    visitId: string,
    context: any
  ): Promise<AuditLogRecord[]> {
    const issues: AuditLogRecord[] = [];

    ['right', 'left'].forEach(async (eyeSide) => {
      const data = examData[eyeSide as 'right' | 'left'];
      if (!data) return;

      // Check for outlier values (VAS scores should be 0-100)
      const vasFields = ['comfortLevel', 'drynessLevel', 'visualPerformance_Daytime', 'visualPerformance_EndOfDay'];
      
      for (const field of vasFields) {
        const value = data[field];
        if (value !== undefined && (value < 0 || value > 100)) {
          const issue = await this.logDataQualityIssue(
            'invalid_data',
            'high',
            `${field}_${eyeSide}`,
            visitId,
            context.patientId,
            context.clinicalStudyId,
            `VAS score out of valid range (0-100)`,
            { 
              ...context, 
              examinationId,
              detectedValue: value,
              expectedRange: '0-100'
            }
          );
          issues.push(issue);
        }
      }

      // Check for suspiciously consistent scores (all values identical)
      const scores = vasFields.map(field => data[field]).filter(v => v !== undefined);
      if (scores.length > 2 && scores.every(score => score === scores[0])) {
        const issue = await this.logDataQualityIssue(
          'inconsistent_data',
          'medium',
          `vas_consistency_${eyeSide}`,
          visitId,
          context.patientId,
          context.clinicalStudyId,
          `All VAS scores are identical, may indicate data entry error`,
          { 
            ...context, 
            examinationId,
            detectedValue: scores[0]
          }
        );
        issues.push(issue);
      }
    });

    return issues;
  }

  /**
   * Check BasicInfo data quality
   */
  private async checkBasicInfoQuality(
    examData: { right?: any; left?: any },
    examinationId: string,
    visitId: string,
    context: any
  ): Promise<AuditLogRecord[]> {
    const issues: AuditLogRecord[] = [];

    ['right', 'left'].forEach(async (eyeSide) => {
      const data = examData[eyeSide as 'right' | 'left'];
      if (!data) return;

      // Check visual acuity range
      if (data.va !== undefined && (data.va < 0.1 || data.va > 2.0)) {
        const issue = await this.logDataQualityIssue(
          'outlier',
          'medium',
          `va_${eyeSide}`,
          visitId,
          context.patientId,
          context.clinicalStudyId,
          `Visual acuity value outside typical range`,
          { 
            ...context, 
            examinationId,
            detectedValue: data.va,
            expectedRange: '0.1-2.0'
          }
        );
        issues.push(issue);
      }

      // Check intraocular pressure range
      const pressureValues = [data.intraocularPressure1, data.intraocularPressure2, data.intraocularPressure3];
      pressureValues.forEach(async (pressure, index) => {
        if (pressure !== undefined && (pressure < 5 || pressure > 50)) {
          const issue = await this.logDataQualityIssue(
            'outlier',
            pressure < 5 || pressure > 30 ? 'high' : 'medium',
            `iop${index + 1}_${eyeSide}`,
            visitId,
            context.patientId,
            context.clinicalStudyId,
            `Intraocular pressure outside normal range`,
            { 
              ...context, 
              examinationId,
              detectedValue: pressure,
              expectedRange: '5-30 mmHg'
            }
          );
          issues.push(issue);
        }
      });
    });

    return issues;
  }

  /**
   * Clean up old audit logs (should be called by maintenance job)
   */
  async cleanupOldLogs(retentionDays: number = 2555) { // ~7 years default
    return await this.auditLogRepository.cleanupOldLogs(retentionDays);
  }

  /**
   * Export audit logs for regulatory compliance
   */
  async exportAuditLogs(
    filters: {
      organizationId?: string;
      clinicalStudyId?: string;
      startDate: string;
      endDate: string;
    },
    format: 'csv' | 'json' | 'xml' = 'csv'
  ) {
    const { logs } = await this.auditLogRepository.queryLogs(filters, 10000); // Large limit for export

    switch (format) {
      case 'json':
        return JSON.stringify(logs, null, 2);
      
      case 'xml':
        return this.convertToXML(logs);
      
      case 'csv':
      default:
        return this.convertToCSV(logs);
    }
  }

  /**
   * Convert audit logs to CSV format
   */
  private convertToCSV(logs: AuditLogRecord[]): string {
    const headers = [
      'Log ID',
      'Timestamp',
      'Event Type',
      'Action',
      'User ID',
      'Username',
      'User Role',
      'Target Type',
      'Target ID',
      'Target Name',
      'Clinical Study ID',
      'Organization ID',
      'Patient ID',
      'Survey ID',
      'Visit ID',
      'Description',
      'Severity',
      'IP Address',
      'Session ID',
      'Changes'
    ];

    const rows = logs.map(log => [
      log.logId,
      log.timestamp,
      log.eventType,
      log.action,
      log.userId,
      log.username,
      log.userRole,
      log.targetType,
      log.targetId,
      log.targetName || '',
      log.clinicalStudyId || '',
      log.organizationId || '',
      log.patientId || '',
      log.surveyId || '',
      log.visitId || '',
      log.description || '',
      log.severity,
      log.ipAddress,
      log.sessionId,
      log.changes ? JSON.stringify(log.changes) : ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }

  /**
   * Convert audit logs to XML format
   */
  private convertToXML(logs: AuditLogRecord[]): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n<audit_logs>\n';
    const xmlFooter = '</audit_logs>';
    
    const xmlBody = logs.map(log => {
      const changes = log.changes ? log.changes.map(change => 
        `    <change field="${change.field}" old_value="${change.oldValue}" new_value="${change.newValue}" />`
      ).join('\n') : '';

      return `  <audit_log>
    <log_id>${log.logId}</log_id>
    <timestamp>${log.timestamp}</timestamp>
    <event_type>${log.eventType}</event_type>
    <action>${log.action}</action>
    <user_id>${log.userId}</user_id>
    <username>${log.username}</username>
    <user_role>${log.userRole}</user_role>
    <target_type>${log.targetType}</target_type>
    <target_id>${log.targetId}</target_id>
    <target_name>${log.targetName || ''}</target_name>
    <clinical_study_id>${log.clinicalStudyId || ''}</clinical_study_id>
    <organization_id>${log.organizationId || ''}</organization_id>
    <patient_id>${log.patientId || ''}</patient_id>
    <survey_id>${log.surveyId || ''}</survey_id>
    <visit_id>${log.visitId || ''}</visit_id>
    <description>${log.description || ''}</description>
    <severity>${log.severity}</severity>
    <ip_address>${log.ipAddress}</ip_address>
    <session_id>${log.sessionId}</session_id>
    <changes>
${changes}
    </changes>
  </audit_log>`;
    }).join('\n');

    return xmlHeader + xmlBody + '\n' + xmlFooter;
  }
}