import { AuditService } from '../AuditService';
import { AuditLogRepository, AuditLogRecord } from '../../repositories/AuditLogRepository';

// Mock the AuditLogRepository
jest.mock('../../repositories/AuditLogRepository');
const MockAuditLogRepository = AuditLogRepository as jest.MockedClass<typeof AuditLogRepository>;

describe('AuditService', () => {
  let auditService: AuditService;
  let mockAuditLogRepository: jest.Mocked<AuditLogRepository>;

  const mockContext = {
    userId: 'user-123',
    username: 'test@example.com',
    userRole: 'investigator',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 Test Browser',
    sessionId: 'session-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuditLogRepository = new MockAuditLogRepository() as jest.Mocked<AuditLogRepository>;
    auditService = new AuditService();
    (auditService as any).auditLogRepository = mockAuditLogRepository;
  });

  describe('logDataChange', () => {
    const mockChanges = [
      {
        field: 'comfortLevel',
        oldValue: 75,
        newValue: 80,
      },
    ];

    it('should log data change events correctly', async () => {
      const mockLogRecord: AuditLogRecord = {
        logId: 'log-123',
        timestamp: '2023-01-01T00:00:00Z',
        eventType: 'update',
        action: 'examination_update',
        userId: mockContext.userId,
        username: mockContext.username,
        userRole: mockContext.userRole,
        targetType: 'examination',
        targetId: 'exam-123',
        targetName: 'VAS評価',
        changes: mockChanges,
        severity: 'medium',
        ipAddress: mockContext.ipAddress,
        userAgent: mockContext.userAgent,
        sessionId: mockContext.sessionId,
        createdAt: '2023-01-01T00:00:00Z',
        entityType: 'audit-log',
      };

      mockAuditLogRepository.logDataChange.mockResolvedValue(mockLogRecord);

      const result = await auditService.logDataChange(
        'update',
        'examination',
        'exam-123',
        'VAS評価',
        mockChanges,
        {
          ...mockContext,
          clinicalStudyId: 'study-123',
          organizationId: 'org-123',
          patientId: 'patient-123',
          reason: 'Data correction',
        }
      );

      expect(mockAuditLogRepository.logDataChange).toHaveBeenCalledWith(
        'update',
        mockContext.userId,
        mockContext.username,
        mockContext.userRole,
        'examination',
        'exam-123',
        'VAS評価',
        mockChanges,
        expect.objectContaining({
          clinicalStudyId: 'study-123',
          organizationId: 'org-123',
          patientId: 'patient-123',
          reason: 'Data correction',
          ipAddress: mockContext.ipAddress,
          userAgent: mockContext.userAgent,
          sessionId: mockContext.sessionId,
        })
      );

      expect(result).toEqual(mockLogRecord);
    });

    it('should handle create events', async () => {
      mockAuditLogRepository.logDataChange.mockResolvedValue({} as AuditLogRecord);

      await auditService.logDataChange(
        'create',
        'visit',
        'visit-123',
        'Baseline Visit',
        [],
        mockContext
      );

      expect(mockAuditLogRepository.logDataChange).toHaveBeenCalledWith(
        'create',
        mockContext.userId,
        mockContext.username,
        mockContext.userRole,
        'visit',
        'visit-123',
        'Baseline Visit',
        [],
        expect.any(Object)
      );
    });

    it('should handle delete events', async () => {
      mockAuditLogRepository.logDataChange.mockResolvedValue({} as AuditLogRecord);

      await auditService.logDataChange(
        'delete',
        'patient',
        'patient-123',
        'Patient 001',
        [],
        mockContext
      );

      expect(mockAuditLogRepository.logDataChange).toHaveBeenCalledWith(
        'delete',
        mockContext.userId,
        mockContext.username,
        mockContext.userRole,
        'patient',
        'patient-123',
        'Patient 001',
        [],
        expect.any(Object)
      );
    });
  });

  describe('logExaminationAccess', () => {
    it('should log examination access correctly', async () => {
      const mockLogRecord: AuditLogRecord = {
        logId: 'log-124',
        timestamp: '2023-01-01T00:00:00Z',
        eventType: 'view',
        action: 'examination_vas_right_accessed',
        userId: mockContext.userId,
        username: mockContext.username,
        userRole: mockContext.userRole,
        targetType: 'examination',
        targetId: 'visit-123-vas-right',
        targetName: 'vas (right)',
        severity: 'low',
        ipAddress: mockContext.ipAddress,
        userAgent: mockContext.userAgent,
        sessionId: mockContext.sessionId,
        createdAt: '2023-01-01T00:00:00Z',
        entityType: 'audit-log',
      };

      mockAuditLogRepository.logDataAccess.mockResolvedValue(mockLogRecord);

      const result = await auditService.logExaminationAccess(
        mockContext.userId,
        mockContext.username,
        mockContext.userRole,
        'visit-123',
        'vas',
        'right',
        {
          clinicalStudyId: 'study-123',
          organizationId: 'org-123',
          patientId: 'patient-123',
          ipAddress: mockContext.ipAddress,
          userAgent: mockContext.userAgent,
          sessionId: mockContext.sessionId,
        }
      );

      expect(mockAuditLogRepository.logDataAccess).toHaveBeenCalledWith(
        mockContext.userId,
        mockContext.username,
        mockContext.userRole,
        'examination',
        'visit-123-vas-right',
        'vas (right)',
        expect.objectContaining({
          action: 'examination_vas_right_accessed',
          clinicalStudyId: 'study-123',
          organizationId: 'org-123',
        })
      );

      expect(result).toEqual(mockLogRecord);
    });
  });

  describe('logBulkOperation', () => {
    it('should log bulk update operations', async () => {
      mockAuditLogRepository.logEvent.mockResolvedValue({} as AuditLogRecord);

      await auditService.logBulkOperation(
        'bulk_update',
        100,
        95,
        5,
        {
          ...mockContext,
          targetIds: ['id1', 'id2', 'id3'],
          organizationId: 'org-123',
          clinicalStudyId: 'study-123',
          description: 'Bulk comfort level update',
        }
      );

      expect(mockAuditLogRepository.logEvent).toHaveBeenCalledWith(
        'update',
        'bulk_update',
        mockContext.userId,
        mockContext.username,
        mockContext.userRole,
        'examination',
        'id1,id2,id3',
        expect.objectContaining({
          targetName: 'Bulk operation on 100 items',
          description: 'Bulk comfort level update',
          severity: 'low', // 5% failure rate is low
        })
      );
    });

    it('should set appropriate severity based on failure rate', async () => {
      mockAuditLogRepository.logEvent.mockResolvedValue({} as AuditLogRecord);

      // High failure rate (50%)
      await auditService.logBulkOperation(
        'bulk_delete',
        100,
        50,
        50,
        {
          ...mockContext,
          targetIds: ['id1'],
        }
      );

      expect(mockAuditLogRepository.logEvent).toHaveBeenCalledWith(
        'delete',
        'bulk_delete',
        mockContext.userId,
        mockContext.username,
        mockContext.userRole,
        'examination',
        'id1',
        expect.objectContaining({
          severity: 'high', // > 10% failure rate
        })
      );
    });
  });

  describe('logAuthentication', () => {
    it('should log successful login', async () => {
      mockAuditLogRepository.logAuthEvent.mockResolvedValue({} as AuditLogRecord);

      await auditService.logAuthentication(
        'login',
        mockContext.userId,
        mockContext.username,
        true,
        {
          ipAddress: mockContext.ipAddress,
          userAgent: mockContext.userAgent,
          sessionId: mockContext.sessionId,
        }
      );

      expect(mockAuditLogRepository.logAuthEvent).toHaveBeenCalledWith(
        'login',
        mockContext.userId,
        mockContext.username,
        true,
        expect.objectContaining({
          ipAddress: mockContext.ipAddress,
          userAgent: mockContext.userAgent,
          sessionId: mockContext.sessionId,
        })
      );
    });

    it('should log failed login with reason', async () => {
      mockAuditLogRepository.logAuthEvent.mockResolvedValue({} as AuditLogRecord);

      await auditService.logAuthentication(
        'login',
        mockContext.userId,
        mockContext.username,
        false,
        {
          ipAddress: mockContext.ipAddress,
          userAgent: mockContext.userAgent,
          sessionId: mockContext.sessionId,
          failureReason: 'Invalid password',
        }
      );

      expect(mockAuditLogRepository.logAuthEvent).toHaveBeenCalledWith(
        'login',
        mockContext.userId,
        mockContext.username,
        false,
        expect.objectContaining({
          failureReason: 'Invalid password',
        })
      );
    });
  });

  describe('logSecurityEvent', () => {
    it('should log unauthorized access attempts', async () => {
      mockAuditLogRepository.logEvent.mockResolvedValue({} as AuditLogRecord);

      await auditService.logSecurityEvent(
        'unauthorized_access_attempt',
        mockContext.userId,
        mockContext.username,
        mockContext.userRole,
        {
          targetType: 'patient',
          targetId: 'patient-123',
          targetName: 'Patient 001',
          organizationId: 'org-123',
          description: 'Attempted to access patient data without permission',
          severity: 'high',
          ipAddress: mockContext.ipAddress,
          userAgent: mockContext.userAgent,
          sessionId: mockContext.sessionId,
        }
      );

      expect(mockAuditLogRepository.logEvent).toHaveBeenCalledWith(
        'view',
        'unauthorized_access_attempt',
        mockContext.userId,
        mockContext.username,
        mockContext.userRole,
        'patient',
        'patient-123',
        expect.objectContaining({
          description: 'Attempted to access patient data without permission',
          severity: 'high',
        })
      );
    });
  });

  describe('logProtocolDeviation', () => {
    it('should log minor protocol deviations', async () => {
      mockAuditLogRepository.logEvent.mockResolvedValue({} as AuditLogRecord);

      await auditService.logProtocolDeviation(
        'minor',
        'visit-123',
        'patient-123',
        'study-123',
        'Visit window exceeded by 2 days',
        {
          ...mockContext,
          organizationId: 'org-123',
          surveyId: 'survey-123',
        }
      );

      expect(mockAuditLogRepository.logEvent).toHaveBeenCalledWith(
        'create',
        'protocol_deviation_minor',
        mockContext.userId,
        mockContext.username,
        mockContext.userRole,
        'visit',
        'visit-123',
        expect.objectContaining({
          description: 'Visit window exceeded by 2 days',
          severity: 'medium',
        })
      );
    });

    it('should log critical protocol deviations with higher severity', async () => {
      mockAuditLogRepository.logEvent.mockResolvedValue({} as AuditLogRecord);

      await auditService.logProtocolDeviation(
        'critical',
        'visit-123',
        'patient-123',
        'study-123',
        'Safety parameter exceeded limits',
        {
          ...mockContext,
          organizationId: 'org-123',
          correctionAction: 'Patient withdrawn from study',
        }
      );

      expect(mockAuditLogRepository.logEvent).toHaveBeenCalledWith(
        'create',
        'protocol_deviation_critical',
        mockContext.userId,
        mockContext.username,
        mockContext.userRole,
        'visit',
        'visit-123',
        expect.objectContaining({
          description: 'Safety parameter exceeded limits Correction: Patient withdrawn from study',
          severity: 'critical',
        })
      );
    });
  });

  describe('logDataQualityIssue', () => {
    it('should log missing data issues', async () => {
      mockAuditLogRepository.logEvent.mockResolvedValue({} as AuditLogRecord);

      await auditService.logDataQualityIssue(
        'missing_data',
        'high',
        'intraocularPressure',
        'visit-123',
        'patient-123',
        'study-123',
        'Required field is empty',
        {
          ...mockContext,
          organizationId: 'org-123',
          surveyId: 'survey-123',
          examinationId: 'basic-info',
        }
      );

      expect(mockAuditLogRepository.logEvent).toHaveBeenCalledWith(
        'create',
        'data_quality_missing_data',
        mockContext.userId,
        mockContext.username,
        mockContext.userRole,
        'examination',
        'visit-123-intraocularPressure',
        expect.objectContaining({
          targetName: 'Data Quality Issue - intraocularPressure',
          description: 'Required field is empty',
          severity: 'high',
        })
      );
    });

    it('should include detected value and expected range in description', async () => {
      mockAuditLogRepository.logEvent.mockResolvedValue({} as AuditLogRecord);

      await auditService.logDataQualityIssue(
        'outlier',
        'medium',
        'comfortLevel',
        'visit-123',
        'patient-123',
        'study-123',
        'VAS score outside normal range',
        {
          ...mockContext,
          organizationId: 'org-123',
          detectedValue: 150,
          expectedRange: '0-100',
        }
      );

      expect(mockAuditLogRepository.logEvent).toHaveBeenCalledWith(
        'create',
        'data_quality_outlier',
        mockContext.userId,
        mockContext.username,
        mockContext.userRole,
        'examination',
        'visit-123-comfortLevel',
        expect.objectContaining({
          description: 'VAS score outside normal range Value: 150 Expected: 0-100',
        })
      );
    });
  });

  describe('runDataQualityCheck', () => {
    const mockVisitContext = {
      patientId: 'patient-123',
      clinicalStudyId: 'study-123',
      organizationId: 'org-123',
      userId: 'system',
      username: 'system',
      ipAddress: '127.0.0.1',
      userAgent: 'System',
      sessionId: 'system-session',
    };

    beforeEach(() => {
      mockAuditLogRepository.logEvent.mockResolvedValue({} as AuditLogRecord);
    });

    it('should detect completely missing examination data', async () => {
      const examinationData = {
        'vas': {}, // No right or left data
      };

      await auditService.runDataQualityCheck('visit-123', examinationData, mockVisitContext);

      expect(mockAuditLogRepository.logEvent).toHaveBeenCalledWith(
        'create',
        'data_quality_missing_data',
        'system',
        'system',
        'system',
        'examination',
        'visit-123-vas',
        expect.objectContaining({
          description: 'No data found for examination vas',
          severity: 'high',
        })
      );
    });

    it('should detect partial data (missing left or right eye)', async () => {
      const examinationData = {
        'vas': {
          right: { comfortLevel: 80 },
          // Missing left eye data
        },
      };

      await auditService.runDataQualityCheck('visit-123', examinationData, mockVisitContext);

      expect(mockAuditLogRepository.logEvent).toHaveBeenCalledWith(
        'create',
        'data_quality_missing_data',
        'system',
        'system',
        'system',
        'examination',
        'visit-123-vas_left',
        expect.objectContaining({
          description: 'Missing left eye data for examination vas',
          severity: 'medium',
        })
      );
    });

    it('should detect VAS score outliers', async () => {
      const examinationData = {
        'vas': {
          right: { comfortLevel: 150 }, // Invalid VAS score
        },
      };

      await auditService.runDataQualityCheck('visit-123', examinationData, mockVisitContext);

      expect(mockAuditLogRepository.logEvent).toHaveBeenCalledWith(
        'create',
        'data_quality_invalid_data',
        'system',
        'system',
        'system',
        'examination',
        'visit-123-comfortLevel_right',
        expect.objectContaining({
          description: 'VAS score out of valid range (0-100)',
        })
      );
    });

    it('should detect suspiciously consistent VAS scores', async () => {
      const examinationData = {
        'vas': {
          right: {
            comfortLevel: 50,
            drynessLevel: 50,
            visualPerformance_Daytime: 50,
            visualPerformance_EndOfDay: 50,
          },
        },
      };

      await auditService.runDataQualityCheck('visit-123', examinationData, mockVisitContext);

      expect(mockAuditLogRepository.logEvent).toHaveBeenCalledWith(
        'create',
        'data_quality_inconsistent_data',
        'system',
        'system',
        'system',
        'examination',
        'visit-123-vas_consistency_right',
        expect.objectContaining({
          description: 'All VAS scores are identical, may indicate data entry error',
        })
      );
    });

    it('should detect basic info outliers', async () => {
      const examinationData = {
        'basic-info': {
          right: {
            va: 5.0, // Unrealistic visual acuity
            intraocularPressure1: 60, // High IOP
          },
        },
      };

      await auditService.runDataQualityCheck('visit-123', examinationData, mockVisitContext);

      expect(mockAuditLogRepository.logEvent).toHaveBeenCalledTimes(2);
      
      // Check for VA outlier
      expect(mockAuditLogRepository.logEvent).toHaveBeenCalledWith(
        'create',
        'data_quality_outlier',
        'system',
        'system',
        'system',
        'examination',
        'visit-123-va_right',
        expect.objectContaining({
          description: 'Visual acuity value outside typical range',
        })
      );

      // Check for IOP outlier
      expect(mockAuditLogRepository.logEvent).toHaveBeenCalledWith(
        'create',
        'data_quality_outlier',
        'system',
        'system',
        'system',
        'examination',
        'visit-123-iop1_right',
        expect.objectContaining({
          description: 'Intraocular pressure outside normal range',
        })
      );
    });
  });

  describe('queryAuditLogs', () => {
    it('should query logs with filters', async () => {
      const mockResult = {
        logs: [{} as AuditLogRecord],
        lastEvaluatedKey: undefined,
      };

      mockAuditLogRepository.queryLogs.mockResolvedValue(mockResult);

      const filters = {
        userId: 'user-123',
        eventType: 'update' as const,
        startDate: '2023-01-01',
        endDate: '2023-01-31',
      };

      const result = await auditService.queryAuditLogs(filters, { limit: 25 });

      expect(mockAuditLogRepository.queryLogs).toHaveBeenCalledWith(filters, 25, undefined);
      expect(result).toEqual(mockResult);
    });

    it('should use default pagination parameters', async () => {
      mockAuditLogRepository.queryLogs.mockResolvedValue({
        logs: [],
        lastEvaluatedKey: undefined,
      });

      await auditService.queryAuditLogs({});

      expect(mockAuditLogRepository.queryLogs).toHaveBeenCalledWith({}, 50, undefined);
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate comprehensive compliance report', async () => {
      const mockReportData = {
        dataModifications: [{} as AuditLogRecord],
        accessViolations: [{} as AuditLogRecord],
        criticalEvents: [{} as AuditLogRecord],
        userActivity: { 'user-123': 10 },
      };

      mockAuditLogRepository.getComplianceReport.mockResolvedValue(mockReportData);

      const result = await auditService.generateComplianceReport(
        'org-123',
        '2023-01-01',
        '2023-01-31'
      );

      expect(mockAuditLogRepository.getComplianceReport).toHaveBeenCalledWith(
        'org-123',
        '2023-01-01',
        '2023-01-31'
      );

      expect(result).toEqual({
        ...mockReportData,
        summary: expect.objectContaining({
          reportPeriod: { startDate: '2023-01-01', endDate: '2023-01-31' },
          organizationId: 'org-123',
          totalEvents: 3, // 1 + 1 + 1 from mock data
          complianceScore: expect.any(Number),
          generatedAt: expect.any(String),
        }),
      });
    });
  });

  describe('exportAuditLogs', () => {
    const mockLogs: AuditLogRecord[] = [
      {
        logId: 'log-1',
        timestamp: '2023-01-01T00:00:00Z',
        eventType: 'update',
        action: 'test_action',
        userId: 'user-1',
        username: 'test@example.com',
        userRole: 'investigator',
        targetType: 'examination',
        targetId: 'exam-1',
        targetName: 'Test Exam',
        severity: 'low',
        ipAddress: '192.168.1.1',
        userAgent: 'Test',
        sessionId: 'session-1',
        createdAt: '2023-01-01T00:00:00Z',
        entityType: 'audit-log',
      },
    ];

    beforeEach(() => {
      mockAuditLogRepository.queryLogs.mockResolvedValue({
        logs: mockLogs,
        lastEvaluatedKey: undefined,
      });
    });

    it('should export logs as CSV by default', async () => {
      const result = await auditService.exportAuditLogs({
        organizationId: 'org-123',
        startDate: '2023-01-01',
        endDate: '2023-01-31',
      });

      expect(result).toContain('Log ID,Timestamp,Event Type'); // CSV headers
      expect(result).toContain('log-1,2023-01-01T00:00:00Z,update'); // CSV data
    });

    it('should export logs as JSON when requested', async () => {
      const result = await auditService.exportAuditLogs({
        organizationId: 'org-123',
        startDate: '2023-01-01',
        endDate: '2023-01-31',
      }, 'json');

      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0]).toEqual(mockLogs[0]);
    });

    it('should export logs as XML when requested', async () => {
      const result = await auditService.exportAuditLogs({
        organizationId: 'org-123',
        startDate: '2023-01-01',
        endDate: '2023-01-31',
      }, 'xml');

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<audit_logs>');
      expect(result).toContain('<log_id>log-1</log_id>');
      expect(result).toContain('</audit_logs>');
    });
  });

  describe('cleanupOldLogs', () => {
    it('should clean up old logs with default retention period', async () => {
      mockAuditLogRepository.cleanupOldLogs.mockResolvedValue(150);

      const result = await auditService.cleanupOldLogs();

      expect(mockAuditLogRepository.cleanupOldLogs).toHaveBeenCalledWith(2555); // ~7 years
      expect(result).toBe(150);
    });

    it('should clean up old logs with custom retention period', async () => {
      mockAuditLogRepository.cleanupOldLogs.mockResolvedValue(75);

      const result = await auditService.cleanupOldLogs(365); // 1 year

      expect(mockAuditLogRepository.cleanupOldLogs).toHaveBeenCalledWith(365);
      expect(result).toBe(75);
    });
  });
});