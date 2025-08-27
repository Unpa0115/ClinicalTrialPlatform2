import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Alert,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { apiClient } from '../../services/apiClient';

interface SystemConfiguration {
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

interface DataRetentionPolicy {
  tableName: string;
  retentionDays: number;
  archiveBeforeDelete: boolean;
  archiveLocation?: string;
  isActive: boolean;
}

interface BackupSchedule {
  tableName: string;
  scheduleType: 'daily' | 'weekly' | 'monthly';
  scheduleTime: string;
  isActive: boolean;
  retentionDays: number;
}

interface SystemSettings {
  maxSessionTimeout: number;
  passwordExpirationDays: number;
  maxLoginAttempts: number;
  auditLogRetentionDays: number;
  alertEmailEnabled: boolean;
  alertRecipients: string[];
}

const SystemConfigurationManager: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [configurations, setConfigurations] = useState<SystemConfiguration[]>([]);
  const [dataRetentionPolicies, setDataRetentionPolicies] = useState<DataRetentionPolicy[]>([]);
  const [backupSchedules, setBackupSchedules] = useState<BackupSchedule[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showRetentionDialog, setShowRetentionDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SystemConfiguration | null>(null);

  // Form states
  const [newRetentionPolicy, setNewRetentionPolicy] = useState<DataRetentionPolicy>({
    tableName: '',
    retentionDays: 365,
    archiveBeforeDelete: false,
    archiveLocation: '',
    isActive: true
  });

  const [newBackupSchedule, setNewBackupSchedule] = useState<BackupSchedule>({
    tableName: '',
    scheduleType: 'daily',
    scheduleTime: '02:00',
    isActive: true,
    retentionDays: 30
  });

  const [editingSettings, setEditingSettings] = useState<SystemSettings>({
    maxSessionTimeout: 3600,
    passwordExpirationDays: 90,
    maxLoginAttempts: 5,
    auditLogRetentionDays: 2555, // 7 years
    alertEmailEnabled: true,
    alertRecipients: []
  });

  const tableNames = [
    'dev-ClinicalStudy',
    'dev-Organizations',
    'dev-Users',
    'dev-Patients',
    'dev-Surveys',
    'dev-Visits',
    'dev-BasicInfo',
    'dev-VAS',
    'dev-ComparativeScores',
    'dev-LensFluidSurfaceAssessment',
    'dev-DR1',
    'dev-CorrectedVA',
    'dev-LensInspection',
    'dev-Questionnaire',
    'dev-AuditLog',
    'dev-DraftData'
  ];

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [configsRes, retentionRes, backupRes, settingsRes] = await Promise.all([
        apiClient.get('/admin/configurations'),
        apiClient.get('/admin/data-retention-policies'),
        apiClient.get('/admin/backup-schedules'),
        apiClient.get('/admin/system-settings')
      ]);

      if (configsRes.data.success) setConfigurations(configsRes.data.data);
      if (retentionRes.data.success) setDataRetentionPolicies(retentionRes.data.data);
      if (backupRes.data.success) setBackupSchedules(backupRes.data.data);
      if (settingsRes.data.success && settingsRes.data.data) {
        setSystemSettings(settingsRes.data.data);
        setEditingSettings(settingsRes.data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration data');
    } finally {
      setLoading(false);
    }
  };

  const createRetentionPolicy = async () => {
    try {
      const response = await apiClient.post('/admin/data-retention-policies', newRetentionPolicy);
      if (response.data.success) {
        loadAllData();
        setShowRetentionDialog(false);
        setNewRetentionPolicy({
          tableName: '',
          retentionDays: 365,
          archiveBeforeDelete: false,
          archiveLocation: '',
          isActive: true
        });
        alert('Data retention policy created successfully');
      }
    } catch (err) {
      alert('Failed to create data retention policy');
    }
  };

  const createBackupSchedule = async () => {
    try {
      const response = await apiClient.post('/admin/backup-schedules', newBackupSchedule);
      if (response.data.success) {
        loadAllData();
        setShowBackupDialog(false);
        setNewBackupSchedule({
          tableName: '',
          scheduleType: 'daily',
          scheduleTime: '02:00',
          isActive: true,
          retentionDays: 30
        });
        alert('Backup schedule created successfully');
      }
    } catch (err) {
      alert('Failed to create backup schedule');
    }
  };

  const updateSystemSettings = async () => {
    try {
      const response = await apiClient.put('/admin/system-settings', editingSettings);
      if (response.data.success) {
        setSystemSettings(editingSettings);
        setShowSettingsDialog(false);
        alert('System settings updated successfully');
      }
    } catch (err) {
      alert('Failed to update system settings');
    }
  };

  const deleteConfiguration = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/admin/configurations/${configId}`);
      if (response.data.success) {
        loadAllData();
        alert('Configuration deleted successfully');
      }
    } catch (err) {
      alert('Failed to delete configuration');
    }
  };

  if (loading) {
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

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          System Configuration
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadAllData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, value) => setCurrentTab(value)}>
          <Tab label="System Settings" />
          <Tab label="Data Retention" />
          <Tab label="Backup Schedules" />
          <Tab label="All Configurations" />
        </Tabs>
      </Paper>

      {/* System Settings Tab */}
      {currentTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">System Settings</Typography>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setShowSettingsDialog(true)}
                  >
                    Edit Settings
                  </Button>
                </Box>
                {systemSettings ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">Max Session Timeout</Typography>
                      <Typography variant="body1">{systemSettings.maxSessionTimeout} seconds</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">Password Expiration</Typography>
                      <Typography variant="body1">{systemSettings.passwordExpirationDays} days</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">Max Login Attempts</Typography>
                      <Typography variant="body1">{systemSettings.maxLoginAttempts}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">Audit Log Retention</Typography>
                      <Typography variant="body1">{systemSettings.auditLogRetentionDays} days</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">Email Alerts</Typography>
                      <Chip 
                        label={systemSettings.alertEmailEnabled ? 'Enabled' : 'Disabled'}
                        color={systemSettings.alertEmailEnabled ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">Alert Recipients</Typography>
                      <Typography variant="body1">{systemSettings.alertRecipients.join(', ') || 'None'}</Typography>
                    </Grid>
                  </Grid>
                ) : (
                  <Typography>No system settings configured</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Data Retention Tab */}
      {currentTab === 1 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Data Retention Policies
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowRetentionDialog(true)}
              >
                Add Policy
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Table Name</TableCell>
                    <TableCell>Retention Days</TableCell>
                    <TableCell>Archive Before Delete</TableCell>
                    <TableCell>Archive Location</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dataRetentionPolicies.map((policy, index) => (
                    <TableRow key={index}>
                      <TableCell>{policy.tableName}</TableCell>
                      <TableCell>{policy.retentionDays}</TableCell>
                      <TableCell>
                        <Chip 
                          label={policy.archiveBeforeDelete ? 'Yes' : 'No'}
                          color={policy.archiveBeforeDelete ? 'info' : 'default'}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{policy.archiveLocation || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={policy.isActive ? 'Active' : 'Inactive'}
                          color={policy.isActive ? 'success' : 'default'}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {dataRetentionPolicies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No data retention policies configured
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Backup Schedules Tab */}
      {currentTab === 2 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Backup Schedules
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowBackupDialog(true)}
              >
                Add Schedule
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Table Name</TableCell>
                    <TableCell>Schedule Type</TableCell>
                    <TableCell>Schedule Time</TableCell>
                    <TableCell>Retention Days</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {backupSchedules.map((schedule, index) => (
                    <TableRow key={index}>
                      <TableCell>{schedule.tableName}</TableCell>
                      <TableCell>
                        <Chip label={schedule.scheduleType} variant="outlined" size="small" />
                      </TableCell>
                      <TableCell>{schedule.scheduleTime}</TableCell>
                      <TableCell>{schedule.retentionDays}</TableCell>
                      <TableCell>
                        <Chip 
                          label={schedule.isActive ? 'Active' : 'Inactive'}
                          color={schedule.isActive ? 'success' : 'default'}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {backupSchedules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No backup schedules configured
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* All Configurations Tab */}
      {currentTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>All System Configurations</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Modified</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {configurations.map((config) => (
                    <TableRow key={config.configId}>
                      <TableCell>
                        <Chip label={config.configType} variant="outlined" size="small" />
                      </TableCell>
                      <TableCell>{config.configName}</TableCell>
                      <TableCell>{config.description}</TableCell>
                      <TableCell>
                        <Chip 
                          label={config.isActive ? 'Active' : 'Inactive'}
                          color={config.isActive ? 'success' : 'default'}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(config.updatedAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => deleteConfiguration(config.configId)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {configurations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No configurations found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Data Retention Policy Dialog */}
      <Dialog open={showRetentionDialog} onClose={() => setShowRetentionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Data Retention Policy</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Table Name</InputLabel>
            <Select
              value={newRetentionPolicy.tableName}
              onChange={(e) => setNewRetentionPolicy({ ...newRetentionPolicy, tableName: e.target.value })}
            >
              {tableNames.map((tableName) => (
                <MenuItem key={tableName} value={tableName}>{tableName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="number"
            label="Retention Days"
            variant="outlined"
            margin="normal"
            value={newRetentionPolicy.retentionDays}
            onChange={(e) => setNewRetentionPolicy({ ...newRetentionPolicy, retentionDays: parseInt(e.target.value) })}
          />
          <FormControlLabel
            control={
              <Switch
                checked={newRetentionPolicy.archiveBeforeDelete}
                onChange={(e) => setNewRetentionPolicy({ ...newRetentionPolicy, archiveBeforeDelete: e.target.checked })}
              />
            }
            label="Archive Before Delete"
          />
          {newRetentionPolicy.archiveBeforeDelete && (
            <TextField
              fullWidth
              label="Archive Location"
              variant="outlined"
              margin="normal"
              value={newRetentionPolicy.archiveLocation}
              onChange={(e) => setNewRetentionPolicy({ ...newRetentionPolicy, archiveLocation: e.target.value })}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRetentionDialog(false)}>Cancel</Button>
          <Button onClick={createRetentionPolicy} variant="contained">
            Create Policy
          </Button>
        </DialogActions>
      </Dialog>

      {/* Backup Schedule Dialog */}
      <Dialog open={showBackupDialog} onClose={() => setShowBackupDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Backup Schedule</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Table Name</InputLabel>
            <Select
              value={newBackupSchedule.tableName}
              onChange={(e) => setNewBackupSchedule({ ...newBackupSchedule, tableName: e.target.value })}
            >
              {tableNames.map((tableName) => (
                <MenuItem key={tableName} value={tableName}>{tableName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Schedule Type</InputLabel>
            <Select
              value={newBackupSchedule.scheduleType}
              onChange={(e) => setNewBackupSchedule({ ...newBackupSchedule, scheduleType: e.target.value as any })}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="time"
            label="Schedule Time"
            variant="outlined"
            margin="normal"
            value={newBackupSchedule.scheduleTime}
            onChange={(e) => setNewBackupSchedule({ ...newBackupSchedule, scheduleTime: e.target.value })}
          />
          <TextField
            fullWidth
            type="number"
            label="Backup Retention Days"
            variant="outlined"
            margin="normal"
            value={newBackupSchedule.retentionDays}
            onChange={(e) => setNewBackupSchedule({ ...newBackupSchedule, retentionDays: parseInt(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBackupDialog(false)}>Cancel</Button>
          <Button onClick={createBackupSchedule} variant="contained">
            Create Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* System Settings Dialog */}
      <Dialog open={showSettingsDialog} onClose={() => setShowSettingsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit System Settings</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Session Timeout (seconds)"
                variant="outlined"
                margin="normal"
                value={editingSettings.maxSessionTimeout}
                onChange={(e) => setEditingSettings({ ...editingSettings, maxSessionTimeout: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Password Expiration Days"
                variant="outlined"
                margin="normal"
                value={editingSettings.passwordExpirationDays}
                onChange={(e) => setEditingSettings({ ...editingSettings, passwordExpirationDays: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Login Attempts"
                variant="outlined"
                margin="normal"
                value={editingSettings.maxLoginAttempts}
                onChange={(e) => setEditingSettings({ ...editingSettings, maxLoginAttempts: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Audit Log Retention Days"
                variant="outlined"
                margin="normal"
                value={editingSettings.auditLogRetentionDays}
                onChange={(e) => setEditingSettings({ ...editingSettings, auditLogRetentionDays: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingSettings.alertEmailEnabled}
                    onChange={(e) => setEditingSettings({ ...editingSettings, alertEmailEnabled: e.target.checked })}
                  />
                }
                label="Enable Email Alerts"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Alert Recipients (comma-separated emails)"
                variant="outlined"
                margin="normal"
                value={editingSettings.alertRecipients.join(', ')}
                onChange={(e) => setEditingSettings({ 
                  ...editingSettings, 
                  alertRecipients: e.target.value.split(',').map(email => email.trim()).filter(email => email)
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettingsDialog(false)}>Cancel</Button>
          <Button onClick={updateSystemSettings} variant="contained" startIcon={<SaveIcon />}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemConfigurationManager;