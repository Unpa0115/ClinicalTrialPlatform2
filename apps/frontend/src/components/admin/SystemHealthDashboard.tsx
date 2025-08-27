import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Storage as StorageIcon,
  Computer as ComputerIcon,
  NetworkCheck as NetworkCheckIcon,
  Refresh as RefreshIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { apiClient } from '../../services/apiClient';

interface SystemHealth {
  timestamp: string;
  overallStatus: 'healthy' | 'warning' | 'critical';
  services: ServiceHealthStatus[];
  databases: DatabaseHealthStatus[];
  performance: PerformanceMetrics;
  alerts: SystemAlert[];
}

interface ServiceHealthStatus {
  serviceName: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  lastChecked: string;
  responseTime: number;
  errorRate: number;
  uptime: number;
  details?: string;
}

interface DatabaseHealthStatus {
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

interface IndexHealthStatus {
  indexName: string;
  status: 'healthy' | 'warning' | 'critical';
  itemCount: number;
  sizeBytes: number;
}

interface PerformanceMetrics {
  averageResponseTime: number;
  throughputPerSecond: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
}

interface SystemAlert {
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

const SystemHealthDashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOptimizationDialog, setShowOptimizationDialog] = useState(false);
  const [performingCleanup, setPerformingCleanup] = useState(false);

  useEffect(() => {
    loadHealthData();
    loadOptimizationSuggestions();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadHealthData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/health');
      if (response.data.success) {
        setHealthData(response.data.data);
      } else {
        setError('Failed to load system health data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system health data');
    } finally {
      setLoading(false);
    }
  };

  const loadOptimizationSuggestions = async () => {
    try {
      const response = await apiClient.get('/admin/health/optimization-suggestions');
      if (response.data.success) {
        setOptimizationSuggestions(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load optimization suggestions:', err);
    }
  };

  const performDatabaseCleanup = async () => {
    try {
      setPerformingCleanup(true);
      const response = await apiClient.post('/admin/maintenance/database-cleanup');
      if (response.data.success) {
        alert(`Database cleanup completed. Processed ${response.data.data.tablesProcessed} tables, deleted ${response.data.data.itemsDeleted} items.`);
        loadHealthData();
      }
    } catch (err) {
      alert('Failed to perform database cleanup');
    } finally {
      setPerformingCleanup(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'critical': return <ErrorIcon color="error" />;
      default: return <CheckCircleIcon color="disabled" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading && !healthData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!healthData) return null;

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          System Health Dashboard
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<BuildIcon />}
            onClick={() => setShowOptimizationDialog(true)}
            sx={{ mr: 1 }}
          >
            Optimization
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadHealthData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Overall Status */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              {getStatusIcon(healthData.overallStatus)}
              <Typography variant="h6" ml={1}>
                Overall System Status: {healthData.overallStatus.toUpperCase()}
              </Typography>
              <Chip 
                label={`Last Updated: ${new Date(healthData.timestamp).toLocaleString()}`} 
                variant="outlined" 
                size="small" 
                sx={{ ml: 2 }}
              />
            </Box>
            {healthData.alerts.filter(alert => alert.isActive).length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {healthData.alerts.filter(alert => alert.isActive).length} active alert(s) require attention
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ComputerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Performance Metrics
              </Typography>
              <Box mb={2}>
                <Typography variant="body2">Average Response Time</Typography>
                <Typography variant="h6">{healthData.performance.averageResponseTime}ms</Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2">Throughput</Typography>
                <Typography variant="h6">{healthData.performance.throughputPerSecond} req/sec</Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2">Error Rate</Typography>
                <Typography variant="h6">{healthData.performance.errorRate}%</Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2">Memory Usage</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={healthData.performance.memoryUsage} 
                  sx={{ mt: 1 }}
                />
                <Typography variant="body2">{healthData.performance.memoryUsage}%</Typography>
              </Box>
              <Box>
                <Typography variant="body2">CPU Usage</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={healthData.performance.cpuUsage} 
                  sx={{ mt: 1 }}
                />
                <Typography variant="body2">{healthData.performance.cpuUsage}%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <NetworkCheckIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Active Connections
              </Typography>
              <Typography variant="h4">{healthData.performance.activeConnections}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Services Status */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Services Status</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Service</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Response Time</TableCell>
                      <TableCell>Error Rate</TableCell>
                      <TableCell>Uptime</TableCell>
                      <TableCell>Last Checked</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {healthData.services.map((service) => (
                      <TableRow key={service.serviceName}>
                        <TableCell>{service.serviceName}</TableCell>
                        <TableCell>
                          <Chip 
                            icon={getStatusIcon(service.status)}
                            label={service.status}
                            color={getStatusColor(service.status) as any}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{service.responseTime}ms</TableCell>
                        <TableCell>{service.errorRate}%</TableCell>
                        <TableCell>{service.uptime}%</TableCell>
                        <TableCell>{new Date(service.lastChecked).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Database Status */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Database Status
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Table Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Item Count</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Throttling Events</TableCell>
                      <TableCell>Indexes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {healthData.databases.map((db) => (
                      <TableRow key={db.tableName}>
                        <TableCell>{db.tableName}</TableCell>
                        <TableCell>
                          <Chip 
                            icon={getStatusIcon(db.status)}
                            label={db.status}
                            color={getStatusColor(db.status) as any}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{db.itemCount.toLocaleString()}</TableCell>
                        <TableCell>{formatBytes(db.sizeBytes)}</TableCell>
                        <TableCell>{db.throttlingEvents}</TableCell>
                        <TableCell>{db.indexes.length}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Alerts */}
      {healthData.alerts.filter(alert => alert.isActive).length > 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Active Alerts</Typography>
                {healthData.alerts.filter(alert => alert.isActive).map((alert) => (
                  <Alert 
                    key={alert.alertId}
                    severity={alert.severity === 'critical' ? 'error' : alert.severity === 'high' ? 'warning' : 'info'}
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="subtitle2">{alert.title}</Typography>
                    <Typography variant="body2">{alert.description}</Typography>
                    <Typography variant="caption">
                      {new Date(alert.timestamp).toLocaleString()}
                    </Typography>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Optimization Dialog */}
      <Dialog 
        open={showOptimizationDialog} 
        onClose={() => setShowOptimizationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>System Optimization</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>Optimization Suggestions</Typography>
          <List>
            {optimizationSuggestions.map((suggestion, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <BuildIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={suggestion} />
              </ListItem>
            ))}
            {optimizationSuggestions.length === 0 && (
              <ListItem>
                <ListItemText primary="No optimization suggestions available at this time." />
              </ListItem>
            )}
          </List>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Maintenance Tools
          </Typography>
          <Button
            variant="contained"
            onClick={performDatabaseCleanup}
            disabled={performingCleanup}
            startIcon={performingCleanup ? <CircularProgress size={20} /> : <BuildIcon />}
          >
            {performingCleanup ? 'Performing Cleanup...' : 'Run Database Cleanup'}
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOptimizationDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemHealthDashboard;