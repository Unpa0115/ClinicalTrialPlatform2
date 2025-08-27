import express, { Request, Response } from 'express';
import { SystemConfigurationService } from '../services/SystemConfigurationService';
import { SystemHealthService } from '../services/SystemHealthService';
import { SecurityService } from '../services/SecurityService';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';

const router = express.Router();
const systemConfigService = new SystemConfigurationService();
const systemHealthService = new SystemHealthService();
const securityService = new SecurityService();

// System Configuration Routes
router.get('/configurations', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const configurations = await systemConfigService.getAllConfigurations();
    res.json({
      success: true,
      data: configurations
    });
  } catch (error) {
    console.error('Error fetching configurations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system configurations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/configurations/:type', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const configurations = await systemConfigService.getConfigurationsByType(type);
    res.json({
      success: true,
      data: configurations
    });
  } catch (error) {
    console.error('Error fetching configurations by type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch configurations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/configurations', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || 'unknown';
    const configuration = await systemConfigService.createConfiguration(req.body, userId);
    res.status(201).json({
      success: true,
      data: configuration
    });
  } catch (error) {
    console.error('Error creating configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/configurations/:configId', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const { configId } = req.params;
    const userId = req.user?.userId || 'unknown';
    const configuration = await systemConfigService.updateConfiguration(configId, req.body, userId);
    res.json({
      success: true,
      data: configuration
    });
  } catch (error) {
    console.error('Error updating configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/configurations/:configId', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const { configId } = req.params;
    const userId = req.user?.userId || 'unknown';
    await systemConfigService.deleteConfiguration(configId, userId);
    res.json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Data Retention Policies
router.get('/data-retention-policies', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const policies = await systemConfigService.getDataRetentionPolicies();
    res.json({
      success: true,
      data: policies
    });
  } catch (error) {
    console.error('Error fetching data retention policies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data retention policies',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/data-retention-policies', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || 'unknown';
    const policy = await systemConfigService.setDataRetentionPolicy(req.body, userId);
    res.status(201).json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('Error creating data retention policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create data retention policy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Backup Schedules
router.get('/backup-schedules', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const schedules = await systemConfigService.getBackupSchedules();
    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Error fetching backup schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backup schedules',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/backup-schedules', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || 'unknown';
    const schedule = await systemConfigService.setBackupSchedule(req.body, userId);
    res.status(201).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Error creating backup schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// System Settings
router.get('/system-settings', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const settings = await systemConfigService.getSystemSettings();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/system-settings', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || 'unknown';
    const settings = await systemConfigService.updateSystemSettings(req.body, userId);
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// System Health Routes
router.get('/health', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const health = await systemHealthService.getSystemHealth();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system health',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/health/optimization-suggestions', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const suggestions = await systemHealthService.getDatabaseOptimizationSuggestions();
    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Error fetching optimization suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch optimization suggestions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/maintenance/database-cleanup', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const result = await systemHealthService.performDatabaseCleanup();
    res.json({
      success: true,
      data: result,
      message: 'Database cleanup completed successfully'
    });
  } catch (error) {
    console.error('Error performing database cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform database cleanup',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Security Management Routes
router.get('/security/threats', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    // In production, this would fetch from SecurityThreats table
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Error fetching security threats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch security threats',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/security/threats/:threatId/block', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const { threatId } = req.params;
    const userId = req.user?.userId || 'unknown';
    await securityService.blockThreat(threatId, userId);
    res.json({
      success: true,
      message: 'Threat blocked successfully'
    });
  } catch (error) {
    console.error('Error blocking threat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block threat',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/security/threats/:threatId/resolve', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const { threatId } = req.params;
    const { notes } = req.body;
    const userId = req.user?.userId || 'unknown';
    await securityService.resolveThreat(threatId, userId, notes);
    res.json({
      success: true,
      message: 'Threat resolved successfully'
    });
  } catch (error) {
    console.error('Error resolving threat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve threat',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Security Incidents
router.get('/security/incidents', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    // In production, this would fetch from SecurityIncidents table
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Error fetching security incidents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch security incidents',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/security/incidents', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || 'unknown';
    const incident = await securityService.createIncident({
      ...req.body,
      reportedBy: userId
    });
    res.status(201).json({
      success: true,
      data: incident
    });
  } catch (error) {
    console.error('Error creating security incident:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create security incident',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/security/incidents/:incidentId/status', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const { incidentId } = req.params;
    const { status, notes } = req.body;
    const userId = req.user?.userId || 'unknown';
    await securityService.updateIncidentStatus(incidentId, status, userId, notes);
    res.json({
      success: true,
      message: 'Incident status updated successfully'
    });
  } catch (error) {
    console.error('Error updating incident status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update incident status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// IP Access Control
router.get('/security/ip-rules', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    // In production, this would fetch from IPAccessRules table
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Error fetching IP access rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch IP access rules',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/security/ip-rules', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || 'unknown';
    const rule = await securityService.createIPAccessRule({
      ...req.body,
      createdBy: userId
    });
    res.status(201).json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error creating IP access rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create IP access rule',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Session Management
router.get('/security/sessions', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const sessions = await securityService.getActiveSessions();
    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active sessions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/security/sessions/:sessionId', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.userId || 'unknown';
    await securityService.terminateSession(sessionId, userId);
    res.json({
      success: true,
      message: 'Session terminated successfully'
    });
  } catch (error) {
    console.error('Error terminating session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to terminate session',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/security/users/:userId/sessions', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const { userId: targetUserId } = req.params;
    const userId = req.user?.userId || 'unknown';
    await securityService.terminateAllUserSessions(targetUserId, userId);
    res.json({
      success: true,
      message: 'All user sessions terminated successfully'
    });
  } catch (error) {
    console.error('Error terminating user sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to terminate user sessions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Security Metrics
router.get('/security/metrics', authenticateToken, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    const { timeRange = 'day' } = req.query;
    const metrics = await securityService.getSecurityMetrics(timeRange as 'hour' | 'day' | 'week' | 'month');
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching security metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch security metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;