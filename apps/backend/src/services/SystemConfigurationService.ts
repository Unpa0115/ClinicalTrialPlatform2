import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { AuditService } from './AuditService';

export interface SystemConfiguration {
  configId: string;
  configType: 'data_retention' | 'backup_schedule' | 'security_policy' | 'system_settings';
  configName: string;
  description?: string;
  value: any;
  isActive: boolean;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataRetentionPolicy {
  tableName: string;
  retentionDays: number;
  archiveBeforeDelete: boolean;
  archiveLocation?: string;
  isActive: boolean;
}

export interface BackupSchedule {
  tableName: string;
  scheduleType: 'daily' | 'weekly' | 'monthly';
  scheduleTime: string;
  isActive: boolean;
  retentionDays: number;
}

export interface SystemSettings {
  maxSessionTimeout: number;
  passwordExpirationDays: number;
  maxLoginAttempts: number;
  auditLogRetentionDays: number;
  alertEmailEnabled: boolean;
  alertRecipients: string[];
}

export class SystemConfigurationService {
  private docClient: DynamoDBDocumentClient;
  private auditService: AuditService;

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'ap-northeast-1'
    });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.auditService = new AuditService();
  }

  async createConfiguration(config: Omit<SystemConfiguration, 'configId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<SystemConfiguration> {
    const configId = `config-${config.configType}-${Date.now()}`;
    const now = new Date().toISOString();

    const configRecord: SystemConfiguration = {
      ...config,
      configId,
      createdAt: now,
      updatedAt: now
    };

    await this.docClient.send(new PutCommand({
      TableName: 'dev-SystemConfigurations',
      Item: configRecord
    }));

    await this.auditService.logEvent({
      eventType: 'create',
      action: 'system_configuration_created',
      userId,
      targetType: 'system_configuration',
      targetId: configId,
      targetName: config.configName,
      description: `System configuration "${config.configName}" created`,
      severity: 'medium'
    });

    return configRecord;
  }

  async updateConfiguration(configId: string, updates: Partial<SystemConfiguration>, userId: string): Promise<SystemConfiguration> {
    const existing = await this.getConfiguration(configId);
    if (!existing) {
      throw new Error('Configuration not found');
    }

    const updatedConfig = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.docClient.send(new UpdateCommand({
      TableName: 'dev-SystemConfigurations',
      Key: { configId },
      UpdateExpression: 'SET #value = :value, #isActive = :isActive, #lastModifiedBy = :lastModifiedBy, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#value': 'value',
        '#isActive': 'isActive',
        '#lastModifiedBy': 'lastModifiedBy',
        '#updatedAt': 'updatedAt'
      },
      ExpressionAttributeValues: {
        ':value': updates.value || existing.value,
        ':isActive': updates.isActive !== undefined ? updates.isActive : existing.isActive,
        ':lastModifiedBy': userId,
        ':updatedAt': updatedConfig.updatedAt
      }
    }));

    await this.auditService.logEvent({
      eventType: 'update',
      action: 'system_configuration_updated',
      userId,
      targetType: 'system_configuration',
      targetId: configId,
      targetName: existing.configName,
      description: `System configuration "${existing.configName}" updated`,
      severity: 'medium'
    });

    return updatedConfig;
  }

  async getConfiguration(configId: string): Promise<SystemConfiguration | null> {
    const result = await this.docClient.send(new GetCommand({
      TableName: 'dev-SystemConfigurations',
      Key: { configId }
    }));

    return result.Item as SystemConfiguration || null;
  }

  async getConfigurationsByType(configType: string): Promise<SystemConfiguration[]> {
    const result = await this.docClient.send(new ScanCommand({
      TableName: 'dev-SystemConfigurations',
      FilterExpression: 'configType = :configType',
      ExpressionAttributeValues: {
        ':configType': configType
      }
    }));

    return result.Items as SystemConfiguration[] || [];
  }

  async getAllConfigurations(): Promise<SystemConfiguration[]> {
    const result = await this.docClient.send(new ScanCommand({
      TableName: 'dev-SystemConfigurations'
    }));

    return result.Items as SystemConfiguration[] || [];
  }

  // Data Retention Policies
  async setDataRetentionPolicy(policy: DataRetentionPolicy, userId: string): Promise<SystemConfiguration> {
    return this.createConfiguration({
      configType: 'data_retention',
      configName: `Data Retention - ${policy.tableName}`,
      description: `Data retention policy for ${policy.tableName} table`,
      value: policy,
      isActive: policy.isActive,
      lastModifiedBy: userId
    }, userId);
  }

  async getDataRetentionPolicies(): Promise<DataRetentionPolicy[]> {
    const configs = await this.getConfigurationsByType('data_retention');
    return configs.map(config => config.value as DataRetentionPolicy);
  }

  // Backup Schedules
  async setBackupSchedule(schedule: BackupSchedule, userId: string): Promise<SystemConfiguration> {
    return this.createConfiguration({
      configType: 'backup_schedule',
      configName: `Backup Schedule - ${schedule.tableName}`,
      description: `Backup schedule for ${schedule.tableName} table`,
      value: schedule,
      isActive: schedule.isActive,
      lastModifiedBy: userId
    }, userId);
  }

  async getBackupSchedules(): Promise<BackupSchedule[]> {
    const configs = await this.getConfigurationsByType('backup_schedule');
    return configs.map(config => config.value as BackupSchedule);
  }

  // System Settings
  async updateSystemSettings(settings: SystemSettings, userId: string): Promise<SystemConfiguration> {
    const existing = await this.getConfigurationsByType('system_settings');
    
    if (existing.length > 0) {
      return this.updateConfiguration(existing[0].configId, {
        value: settings,
        lastModifiedBy: userId
      }, userId);
    } else {
      return this.createConfiguration({
        configType: 'system_settings',
        configName: 'System Settings',
        description: 'Global system settings',
        value: settings,
        isActive: true,
        lastModifiedBy: userId
      }, userId);
    }
  }

  async getSystemSettings(): Promise<SystemSettings | null> {
    const configs = await this.getConfigurationsByType('system_settings');
    return configs.length > 0 ? configs[0].value as SystemSettings : null;
  }

  async deleteConfiguration(configId: string, userId: string): Promise<void> {
    const existing = await this.getConfiguration(configId);
    if (!existing) {
      throw new Error('Configuration not found');
    }

    // Mark as inactive instead of deleting for audit purposes
    await this.updateConfiguration(configId, {
      isActive: false,
      lastModifiedBy: userId
    }, userId);

    await this.auditService.logEvent({
      eventType: 'delete',
      action: 'system_configuration_deleted',
      userId,
      targetType: 'system_configuration',
      targetId: configId,
      targetName: existing.configName,
      description: `System configuration "${existing.configName}" deleted (marked inactive)`,
      severity: 'high'
    });
  }
}