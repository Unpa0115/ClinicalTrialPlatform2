import { SystemConfigurationService, DataRetentionPolicy, BackupSchedule, SystemSettings } from '../SystemConfigurationService';
import { SystemHealthService } from '../SystemHealthService';
import { SecurityService } from '../SecurityService';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Mock DynamoDB
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

// Mock AuditService
jest.mock('../AuditService', () => ({
  AuditService: jest.fn().mockImplementation(() => ({
    logEvent: jest.fn().mockResolvedValue(undefined)
  }))
}));

// Mock AuthService
jest.mock('../AuthService', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    // Mock methods as needed
  }))
}));

describe('System Administration Services', () => {
  let mockDocClient: jest.Mocked<DynamoDBDocumentClient>;
  let systemConfigService: SystemConfigurationService;
  let systemHealthService: SystemHealthService;
  let securityService: SecurityService;

  beforeEach(() => {
    mockDocClient = {
      send: jest.fn(),
    } as any;

    // Mock DynamoDBDocumentClient.from
    (DynamoDBDocumentClient.from as jest.Mock).mockReturnValue(mockDocClient);

    systemConfigService = new SystemConfigurationService();
    systemHealthService = new SystemHealthService();
    securityService = new SecurityService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('SystemConfigurationService', () => {
    describe('createConfiguration', () => {
      it('should create a new configuration successfully', async () => {
        const configData = {
          configType: 'system_settings' as const,
          configName: 'Test Configuration',
          description: 'Test description',
          value: { setting: 'value' },
          isActive: true,
          lastModifiedBy: 'test-user'
        };

        mockDocClient.send.mockResolvedValueOnce({});

        const result = await systemConfigService.createConfiguration(configData, 'test-user');

        expect(result.configName).toBe(configData.configName);
        expect(result.configType).toBe(configData.configType);
        expect(result.value).toEqual(configData.value);
        expect(result.configId).toMatch(/^config-system_settings-\d+$/);
        expect(mockDocClient.send).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({
              TableName: 'dev-SystemConfigurations',
              Item: expect.objectContaining({
                configName: configData.configName,
                configType: configData.configType
              })
            })
          })
        );
      });
    });

    describe('setDataRetentionPolicy', () => {
      it('should create data retention policy', async () => {
        const policy: DataRetentionPolicy = {
          tableName: 'dev-TestTable',
          retentionDays: 365,
          archiveBeforeDelete: true,
          archiveLocation: 's3://backup-bucket',
          isActive: true
        };

        mockDocClient.send.mockResolvedValueOnce({});

        const result = await systemConfigService.setDataRetentionPolicy(policy, 'test-user');

        expect(result.configType).toBe('data_retention');
        expect(result.configName).toBe('Data Retention - dev-TestTable');
        expect(result.value).toEqual(policy);
      });
    });

    describe('setBackupSchedule', () => {
      it('should create backup schedule', async () => {
        const schedule: BackupSchedule = {
          tableName: 'dev-TestTable',
          scheduleType: 'daily',
          scheduleTime: '02:00',
          isActive: true,
          retentionDays: 30
        };

        mockDocClient.send.mockResolvedValueOnce({});

        const result = await systemConfigService.setBackupSchedule(schedule, 'test-user');

        expect(result.configType).toBe('backup_schedule');
        expect(result.configName).toBe('Backup Schedule - dev-TestTable');
        expect(result.value).toEqual(schedule);
      });
    });

    describe('updateSystemSettings', () => {
      it('should update system settings when none exist', async () => {
        const settings: SystemSettings = {
          maxSessionTimeout: 3600,
          passwordExpirationDays: 90,
          maxLoginAttempts: 5,
          auditLogRetentionDays: 2555,
          alertEmailEnabled: true,
          alertRecipients: ['admin@example.com']
        };

        // Mock getConfigurationsByType to return empty array (no existing settings)
        mockDocClient.send.mockResolvedValueOnce({ Items: [] });
        // Mock createConfiguration
        mockDocClient.send.mockResolvedValueOnce({});

        const result = await systemConfigService.updateSystemSettings(settings, 'test-user');

        expect(result.configType).toBe('system_settings');
        expect(result.value).toEqual(settings);
      });
    });

    describe('getConfiguration', () => {
      it('should retrieve configuration by ID', async () => {
        const mockConfig = {
          configId: 'config-test-123',
          configType: 'system_settings',
          configName: 'Test Config',
          value: { test: 'value' },
          isActive: true
        };

        mockDocClient.send.mockResolvedValueOnce({ Item: mockConfig });

        const result = await systemConfigService.getConfiguration('config-test-123');

        expect(result).toEqual(mockConfig);
        expect(mockDocClient.send).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({
              TableName: 'dev-SystemConfigurations',
              Key: { configId: 'config-test-123' }
            })
          })
        );
      });

      it('should return null if configuration not found', async () => {
        mockDocClient.send.mockResolvedValueOnce({});

        const result = await systemConfigService.getConfiguration('nonexistent-id');

        expect(result).toBeNull();
      });
    });
  });

  describe('SystemHealthService', () => {
    describe('getSystemHealth', () => {
      it('should return system health status', async () => {
        // Mock ListTablesCommand
        mockDocClient.send
          .mockResolvedValueOnce({ TableNames: ['dev-Users', 'dev-Patients'] }) // ListTablesCommand
          .mockResolvedValueOnce({ Table: { TableSizeBytes: 1024, ItemCount: 10 } }) // DescribeTableCommand for dev-Users
          .mockResolvedValueOnce({ Count: 10 }) // ScanCommand for dev-Users
          .mockResolvedValueOnce({ Table: { TableSizeBytes: 2048, ItemCount: 20 } }) // DescribeTableCommand for dev-Patients  
          .mockResolvedValueOnce({ Count: 20 }); // ScanCommand for dev-Patients

        const result = await systemHealthService.getSystemHealth();

        expect(result).toHaveProperty('timestamp');
        expect(result).toHaveProperty('overallStatus');
        expect(result).toHaveProperty('services');
        expect(result).toHaveProperty('databases');
        expect(result).toHaveProperty('performance');
        expect(result).toHaveProperty('alerts');
        expect(result.overallStatus).toMatch(/^(healthy|warning|critical)$/);
      });
    });

    describe('getDatabaseOptimizationSuggestions', () => {
      it('should return optimization suggestions for large tables', async () => {
        // Mock table health check with large table
        mockDocClient.send
          .mockResolvedValueOnce({ TableNames: ['dev-LargeTable'] })
          .mockResolvedValueOnce({ 
            Table: { 
              TableSizeBytes: 2 * 1024 * 1024 * 1024, // 2GB
              GlobalSecondaryIndexes: [
                { IndexName: 'GSI1' },
                { IndexName: 'GSI2' },
                { IndexName: 'GSI3' },
                { IndexName: 'GSI4' },
                { IndexName: 'GSI5' },
                { IndexName: 'GSI6' }
              ]
            }
          })
          .mockResolvedValueOnce({ Count: 15000 });

        const suggestions = await systemHealthService.getDatabaseOptimizationSuggestions();

        expect(suggestions).toContain(expect.stringContaining('archiving old data'));
        expect(suggestions).toContain(expect.stringContaining('partitioning large table'));
        expect(suggestions).toContain(expect.stringContaining('Review index usage'));
      });
    });

    describe('performDatabaseCleanup', () => {
      it('should perform database cleanup and return results', async () => {
        // Mock draft data cleanup
        mockDocClient.send.mockResolvedValueOnce({ 
          Items: [
            { visitId: 'visit-1', draftId: 'current' },
            { visitId: 'visit-2', draftId: 'current' }
          ]
        });

        const result = await systemHealthService.performDatabaseCleanup();

        expect(result).toHaveProperty('tablesProcessed');
        expect(result).toHaveProperty('itemsDeleted');
        expect(result.tablesProcessed).toBe(1);
        expect(result.itemsDeleted).toBe(2);
      });
    });
  });

  describe('SecurityService', () => {
    describe('detectThreat', () => {
      it('should create new threat when none exists', async () => {
        // Mock getActiveThreatByIP - no existing threat
        mockDocClient.send.mockResolvedValueOnce({ Items: [] });
        // Mock threat creation
        mockDocClient.send.mockResolvedValueOnce({});

        const result = await securityService.detectThreat(
          'brute_force',
          '192.168.1.100',
          '/api/auth/login',
          'test-user',
          'testuser',
          'Multiple failed login attempts'
        );

        expect(result.threatType).toBe('brute_force');
        expect(result.sourceIp).toBe('192.168.1.100');
        expect(result.severity).toBe('high');
        expect(result.attemptCount).toBe(1);
        expect(result.isBlocked).toBe(false);
      });

      it('should update existing threat and auto-block after threshold', async () => {
        const existingThreat = {
          threatId: 'threat-123',
          threatType: 'brute_force',
          sourceIp: '192.168.1.100',
          targetResource: '/api/auth/login',
          attemptCount: 4,
          lastActivity: '2023-01-01T00:00:00Z',
          isBlocked: false,
          severity: 'high',
          status: 'active',
          detectionTime: '2023-01-01T00:00:00Z',
          description: 'Brute force attack'
        };

        // Mock getActiveThreatByIP - return existing threat
        mockDocClient.send.mockResolvedValueOnce({ Items: [existingThreat] });
        // Mock updateThreat calls
        mockDocClient.send.mockResolvedValueOnce({});
        mockDocClient.send.mockResolvedValueOnce({});

        const result = await securityService.detectThreat(
          'brute_force',
          '192.168.1.100',
          '/api/auth/login'
        );

        expect(result.attemptCount).toBe(5);
        expect(mockDocClient.send).toHaveBeenCalledTimes(3); // getActiveThreatByIP + 2 updateThreat calls (increment + block)
      });
    });

    describe('createIncident', () => {
      it('should create security incident successfully', async () => {
        const incidentData = {
          incidentType: 'data_breach_attempt' as const,
          severity: 'critical' as const,
          status: 'reported' as const,
          reportedBy: 'security-admin',
          assignedTo: 'incident-team',
          affectedResources: ['user-database', 'audit-logs'],
          affectedUsers: ['user-123', 'user-456'],
          description: 'Attempted unauthorized data access',
          mitigationActions: []
        };

        mockDocClient.send.mockResolvedValueOnce({});

        const result = await securityService.createIncident(incidentData);

        expect(result.incidentType).toBe(incidentData.incidentType);
        expect(result.severity).toBe(incidentData.severity);
        expect(result.reportedBy).toBe(incidentData.reportedBy);
        expect(result.timeline).toHaveLength(1);
        expect(result.timeline[0].action).toBe('incident_created');
        expect(result.incidentId).toMatch(/^incident-data_breach_attempt-\d+$/);
      });
    });

    describe('createIPAccessRule', () => {
      it('should create IP access rule', async () => {
        const ruleData = {
          ruleName: 'Block Suspicious IP',
          ipAddress: '192.168.1.100',
          action: 'deny' as const,
          organizationId: 'org-123',
          userRole: 'admin',
          isActive: true,
          createdBy: 'security-admin'
        };

        mockDocClient.send.mockResolvedValueOnce({});

        const result = await securityService.createIPAccessRule(ruleData);

        expect(result.ruleName).toBe(ruleData.ruleName);
        expect(result.ipAddress).toBe(ruleData.ipAddress);
        expect(result.action).toBe(ruleData.action);
        expect(result.ruleId).toMatch(/^ip-rule-\d+$/);
      });
    });

    describe('checkIPAccess', () => {
      it('should deny access for blocked IP', async () => {
        const mockRules = [
          {
            ruleId: 'rule-1',
            ipAddress: '192.168.1.100',
            action: 'deny',
            isActive: true
          }
        ];

        mockDocClient.send.mockResolvedValueOnce({ Items: mockRules });

        const result = await securityService.checkIPAccess('192.168.1.100');

        expect(result).toBe(false);
      });

      it('should allow access for allowed IP', async () => {
        const mockRules = [
          {
            ruleId: 'rule-1',
            ipAddress: '192.168.1.100',
            action: 'allow',
            isActive: true
          }
        ];

        mockDocClient.send.mockResolvedValueOnce({ Items: mockRules });

        const result = await securityService.checkIPAccess('192.168.1.100');

        expect(result).toBe(true);
      });

      it('should allow access by default when no rules match', async () => {
        mockDocClient.send.mockResolvedValueOnce({ Items: [] });

        const result = await securityService.checkIPAccess('10.0.0.1');

        expect(result).toBe(true);
      });
    });

    describe('getActiveSessions', () => {
      it('should return list of active sessions', async () => {
        const sessions = await securityService.getActiveSessions();

        expect(Array.isArray(sessions)).toBe(true);
        if (sessions.length > 0) {
          expect(sessions[0]).toHaveProperty('sessionId');
          expect(sessions[0]).toHaveProperty('userId');
          expect(sessions[0]).toHaveProperty('username');
          expect(sessions[0]).toHaveProperty('ipAddress');
          expect(sessions[0]).toHaveProperty('isActive');
        }
      });
    });

    describe('getSecurityMetrics', () => {
      it('should return security metrics for specified time range', async () => {
        // Mock AuditService.getAuditLogs
        const mockAuditLogs = [
          { action: 'user_login_successful', eventType: 'login' },
          { action: 'user_login_failed', eventType: 'login' },
          { action: 'data_modified', eventType: 'update', severity: 'high' },
          { action: 'user_login_attempt', eventType: 'login' }
        ];

        // Mock the getAuditLogs method
        const auditService = require('../AuditService').AuditService;
        auditService.prototype.getAuditLogs = jest.fn().mockResolvedValue(mockAuditLogs);

        const metrics = await securityService.getSecurityMetrics('day');

        expect(metrics).toHaveProperty('totalEvents');
        expect(metrics).toHaveProperty('loginAttempts');
        expect(metrics).toHaveProperty('successfulLogins');
        expect(metrics).toHaveProperty('failedLogins');
        expect(metrics).toHaveProperty('dataModifications');
        expect(metrics).toHaveProperty('suspiciousActivities');
        
        expect(metrics.totalEvents).toBe(4);
        expect(metrics.loginAttempts).toBe(1);
        expect(metrics.successfulLogins).toBe(1);
        expect(metrics.failedLogins).toBe(1);
        expect(metrics.suspiciousActivities).toBe(1);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle threat detection and incident creation workflow', async () => {
      // Simulate threat detection
      mockDocClient.send.mockResolvedValueOnce({ Items: [] }); // No existing threats
      mockDocClient.send.mockResolvedValueOnce({}); // Create threat

      const threat = await securityService.detectThreat(
        'data_breach_attempt',
        '192.168.1.100',
        '/api/patients',
        'malicious-user',
        'hacker'
      );

      expect(threat.severity).toBe('critical');

      // Create incident based on threat
      mockDocClient.send.mockResolvedValueOnce({}); // Create incident

      const incident = await securityService.createIncident({
        incidentType: 'security_breach',
        severity: 'critical',
        status: 'reported',
        reportedBy: 'security-system',
        affectedResources: [threat.targetResource],
        affectedUsers: [threat.userId || 'unknown'],
        description: `Security incident created from threat: ${threat.threatId}`,
        mitigationActions: ['Block IP address', 'Investigate user activity']
      });

      expect(incident.severity).toBe('critical');
      expect(incident.affectedResources).toContain('/api/patients');
    });

    it('should create comprehensive system configuration', async () => {
      // Create data retention policy
      mockDocClient.send.mockResolvedValueOnce({});
      const retentionPolicy = await systemConfigService.setDataRetentionPolicy({
        tableName: 'dev-AuditLog',
        retentionDays: 2555, // 7 years
        archiveBeforeDelete: true,
        archiveLocation: 's3://clinical-trial-archives',
        isActive: true
      }, 'system-admin');

      // Create backup schedule
      mockDocClient.send.mockResolvedValueOnce({});
      const backupSchedule = await systemConfigService.setBackupSchedule({
        tableName: 'dev-AuditLog',
        scheduleType: 'daily',
        scheduleTime: '01:00',
        isActive: true,
        retentionDays: 90
      }, 'system-admin');

      // Update system settings
      mockDocClient.send.mockResolvedValueOnce({ Items: [] }); // No existing settings
      mockDocClient.send.mockResolvedValueOnce({});
      const systemSettings = await systemConfigService.updateSystemSettings({
        maxSessionTimeout: 3600,
        passwordExpirationDays: 90,
        maxLoginAttempts: 3,
        auditLogRetentionDays: 2555,
        alertEmailEnabled: true,
        alertRecipients: ['admin@example.com', 'security@example.com']
      }, 'system-admin');

      expect(retentionPolicy.configType).toBe('data_retention');
      expect(backupSchedule.configType).toBe('backup_schedule');
      expect(systemSettings.configType).toBe('system_settings');
    });
  });
});