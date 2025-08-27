import { DynamoDBClient, DescribeTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { AuditService } from './AuditService';

export interface SystemHealth {
  timestamp: string;
  overallStatus: 'healthy' | 'warning' | 'critical';
  services: ServiceHealthStatus[];
  databases: DatabaseHealthStatus[];
  performance: PerformanceMetrics;
  alerts: SystemAlert[];
}

export interface ServiceHealthStatus {
  serviceName: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  lastChecked: string;
  responseTime: number;
  errorRate: number;
  uptime: number;
  details?: string;
}

export interface DatabaseHealthStatus {
  tableName: string;
  status: 'healthy' | 'warning' | 'critical';
  itemCount: number;
  sizeBytes: number;
  readCapacityUtilization?: number;
  writeCapacityUtilization?: number;
  throttlingEvents: number;
  lastBackup?: string;
  indexes: IndexHealthStatus[];
}

export interface IndexHealthStatus {
  indexName: string;
  status: 'healthy' | 'warning' | 'critical';
  itemCount: number;
  sizeBytes: number;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  throughputPerSecond: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
}

export interface SystemAlert {
  alertId: string;
  alertType: 'performance' | 'error' | 'security' | 'capacity' | 'backup';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  isActive: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export class SystemHealthService {
  private docClient: DynamoDBDocumentClient;
  private dynamoClient: DynamoDBClient;
  private auditService: AuditService;

  constructor() {
    this.dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'ap-northeast-1'
    });
    this.docClient = DynamoDBDocumentClient.from(this.dynamoClient);
    this.auditService = new AuditService();
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const timestamp = new Date().toISOString();
    
    const [services, databases, performance, alerts] = await Promise.all([
      this.checkServicesHealth(),
      this.checkDatabasesHealth(),
      this.getPerformanceMetrics(),
      this.getActiveAlerts()
    ]);

    const overallStatus = this.calculateOverallStatus(services, databases, alerts);

    return {
      timestamp,
      overallStatus,
      services,
      databases,
      performance,
      alerts
    };
  }

  private async checkServicesHealth(): Promise<ServiceHealthStatus[]> {
    const services = ['auth', 'examination', 'audit', 'clinical-study', 'survey', 'visit'];
    const serviceStatuses: ServiceHealthStatus[] = [];

    for (const serviceName of services) {
      try {
        const startTime = Date.now();
        await this.pingService(serviceName);
        const responseTime = Date.now() - startTime;

        serviceStatuses.push({
          serviceName,
          status: 'healthy',
          lastChecked: new Date().toISOString(),
          responseTime,
          errorRate: 0,
          uptime: 99.9
        });
      } catch (error) {
        serviceStatuses.push({
          serviceName,
          status: 'critical',
          lastChecked: new Date().toISOString(),
          responseTime: 0,
          errorRate: 100,
          uptime: 0,
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return serviceStatuses;
  }

  private async checkDatabasesHealth(): Promise<DatabaseHealthStatus[]> {
    try {
      const listTablesResponse = await this.dynamoClient.send(new ListTablesCommand({}));
      const tableNames = listTablesResponse.TableNames || [];
      
      const databaseStatuses: DatabaseHealthStatus[] = [];

      for (const tableName of tableNames) {
        if (tableName.startsWith('dev-')) {
          try {
            const tableHealth = await this.checkTableHealth(tableName);
            databaseStatuses.push(tableHealth);
          } catch (error) {
            databaseStatuses.push({
              tableName,
              status: 'critical',
              itemCount: 0,
              sizeBytes: 0,
              throttlingEvents: 0,
              indexes: []
            });
          }
        }
      }

      return databaseStatuses;
    } catch (error) {
      return [];
    }
  }

  private async checkTableHealth(tableName: string): Promise<DatabaseHealthStatus> {
    const describeResponse = await this.dynamoClient.send(new DescribeTableCommand({
      TableName: tableName
    }));

    const table = describeResponse.Table;
    if (!table) {
      throw new Error(`Table ${tableName} not found`);
    }

    // Get item count (approximate)
    const scanResponse = await this.docClient.send(new ScanCommand({
      TableName: tableName,
      Select: 'COUNT'
    }));

    const itemCount = scanResponse.Count || 0;
    const sizeBytes = table.TableSizeBytes || 0;

    // Check indexes
    const indexes: IndexHealthStatus[] = [];
    if (table.GlobalSecondaryIndexes) {
      for (const gsi of table.GlobalSecondaryIndexes) {
        indexes.push({
          indexName: gsi.IndexName || 'Unknown',
          status: 'healthy',
          itemCount: gsi.ItemCount || 0,
          sizeBytes: gsi.IndexSizeBytes || 0
        });
      }
    }

    // Determine status based on metrics
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (sizeBytes > 10 * 1024 * 1024 * 1024) { // 10GB
      status = 'warning';
    }
    if (sizeBytes > 100 * 1024 * 1024 * 1024) { // 100GB
      status = 'critical';
    }

    return {
      tableName,
      status,
      itemCount,
      sizeBytes,
      throttlingEvents: 0, // Would need CloudWatch metrics for real data
      indexes
    };
  }

  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    // Simulate performance metrics - in production, these would come from monitoring tools
    return {
      averageResponseTime: 250,
      throughputPerSecond: 100,
      errorRate: 0.1,
      memoryUsage: 65.5,
      cpuUsage: 45.2,
      activeConnections: 25
    };
  }

  private async getActiveAlerts(): Promise<SystemAlert[]> {
    // In production, this would query a dedicated alerts table
    return [
      {
        alertId: 'alert-001',
        alertType: 'performance',
        severity: 'medium',
        title: 'High Response Time',
        description: 'Average response time exceeded 500ms threshold',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        isActive: true
      }
    ];
  }

  private calculateOverallStatus(
    services: ServiceHealthStatus[],
    databases: DatabaseHealthStatus[],
    alerts: SystemAlert[]
  ): 'healthy' | 'warning' | 'critical' {
    const criticalServices = services.filter(s => s.status === 'critical').length;
    const criticalDatabases = databases.filter(d => d.status === 'critical').length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.isActive).length;

    if (criticalServices > 0 || criticalDatabases > 0 || criticalAlerts > 0) {
      return 'critical';
    }

    const warningServices = services.filter(s => s.status === 'warning').length;
    const warningDatabases = databases.filter(d => d.status === 'warning').length;
    const warningAlerts = alerts.filter(a => a.severity === 'high' && a.isActive).length;

    if (warningServices > 0 || warningDatabases > 0 || warningAlerts > 0) {
      return 'warning';
    }

    return 'healthy';
  }

  private async pingService(serviceName: string): Promise<void> {
    // Simulate service health check
    // In production, this would make actual HTTP requests to service endpoints
    if (Math.random() > 0.95) { // 5% failure rate simulation
      throw new Error(`Service ${serviceName} is not responding`);
    }
  }

  async createAlert(alert: Omit<SystemAlert, 'alertId' | 'timestamp' | 'isActive'>): Promise<SystemAlert> {
    const newAlert: SystemAlert = {
      ...alert,
      alertId: `alert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isActive: true
    };

    // In production, save to alerts table
    return newAlert;
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    // In production, update alert in database
    await this.auditService.logEvent({
      eventType: 'update',
      action: 'alert_acknowledged',
      userId,
      targetType: 'system_alert',
      targetId: alertId,
      description: `System alert ${alertId} acknowledged`,
      severity: 'low'
    });
  }

  async resolveAlert(alertId: string, userId: string): Promise<void> {
    // In production, update alert in database
    await this.auditService.logEvent({
      eventType: 'update',
      action: 'alert_resolved',
      userId,
      targetType: 'system_alert',
      targetId: alertId,
      description: `System alert ${alertId} resolved`,
      severity: 'low'
    });
  }

  async getDatabaseOptimizationSuggestions(): Promise<string[]> {
    const suggestions: string[] = [];
    const databases = await this.checkDatabasesHealth();

    for (const db of databases) {
      if (db.itemCount > 10000) {
        suggestions.push(`Consider partitioning large table: ${db.tableName} (${db.itemCount} items)`);
      }
      
      if (db.sizeBytes > 1024 * 1024 * 1024) { // 1GB
        suggestions.push(`Consider archiving old data in table: ${db.tableName} (${(db.sizeBytes / 1024 / 1024 / 1024).toFixed(2)}GB)`);
      }

      if (db.indexes.length > 5) {
        suggestions.push(`Review index usage for table: ${db.tableName} (${db.indexes.length} indexes)`);
      }
    }

    return suggestions;
  }

  async performDatabaseCleanup(): Promise<{ tablesProcessed: number; itemsDeleted: number }> {
    let tablesProcessed = 0;
    let itemsDeleted = 0;

    // Clean up draft data older than TTL
    try {
      const draftScanResult = await this.docClient.send(new ScanCommand({
        TableName: 'dev-DraftData',
        FilterExpression: '#ttl < :now',
        ExpressionAttributeNames: {
          '#ttl': 'ttl'
        },
        ExpressionAttributeValues: {
          ':now': Math.floor(Date.now() / 1000)
        }
      }));

      if (draftScanResult.Items && draftScanResult.Items.length > 0) {
        // In production, would delete these items
        itemsDeleted += draftScanResult.Items.length;
      }
      tablesProcessed++;
    } catch (error) {
      // Log error but continue
    }

    return { tablesProcessed, itemsDeleted };
  }
}