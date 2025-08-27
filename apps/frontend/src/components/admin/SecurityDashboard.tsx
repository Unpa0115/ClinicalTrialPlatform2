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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Security as SecurityIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
  Shield as ShieldIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { apiClient } from '../../services/apiClient';

interface SecurityThreat {
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
}

interface SecurityIncident {
  incidentId: string;
  incidentType: 'security_breach' | 'data_leak' | 'unauthorized_modification' | 'system_compromise' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'contained' | 'resolved';
  reportedBy: string;
  assignedTo?: string;
  affectedResources: string[];
  affectedUsers: string[];
  description: string;
  reportedAt: string;
  resolvedAt?: string;
}

interface IPAccessRule {
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

interface SessionInfo {
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
}

interface SecurityMetrics {
  totalEvents: number;
  loginAttempts: number;
  successfulLogins: number;
  failedLogins: number;
  dataModifications: number;
  suspiciousActivities: number;
}

const SecurityDashboard: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [ipRules, setIpRules] = useState<IPAccessRule[]>([]);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [showThreatDialog, setShowThreatDialog] = useState(false);
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);
  const [showIpRuleDialog, setShowIpRuleDialog] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState<SecurityThreat | null>(null);

  // Form states
  const [newIncident, setNewIncident] = useState({
    incidentType: 'policy_violation' as const,
    severity: 'medium' as const,
    description: '',
    affectedResources: '',
    affectedUsers: ''
  });

  const [newIpRule, setNewIpRule] = useState({
    ruleName: '',
    ipAddress: '',
    ipRange: '',
    action: 'deny' as const,
    organizationId: '',
    userRole: ''
  });

  useEffect(() => {
    loadSecurityData();
    const interval = setInterval(loadSecurityData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const [threatsRes, incidentsRes, ipRulesRes, sessionsRes, metricsRes] = await Promise.all([
        apiClient.get('/admin/security/threats'),
        apiClient.get('/admin/security/incidents'),
        apiClient.get('/admin/security/ip-rules'),
        apiClient.get('/admin/security/sessions'),
        apiClient.get('/admin/security/metrics?timeRange=day')
      ]);

      if (threatsRes.data.success) setThreats(threatsRes.data.data);
      if (incidentsRes.data.success) setIncidents(incidentsRes.data.data);
      if (ipRulesRes.data.success) setIpRules(ipRulesRes.data.data);
      if (sessionsRes.data.success) setSessions(sessionsRes.data.data);
      if (metricsRes.data.success) setMetrics(metricsRes.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const blockThreat = async (threatId: string) => {
    try {
      const response = await apiClient.put(`/admin/security/threats/${threatId}/block`);
      if (response.data.success) {
        loadSecurityData();
        alert('Threat blocked successfully');
      }
    } catch (err) {
      alert('Failed to block threat');
    }
  };

  const resolveThreat = async (threatId: string, notes: string) => {
    try {
      const response = await apiClient.put(`/admin/security/threats/${threatId}/resolve`, { notes });
      if (response.data.success) {
        loadSecurityData();
        setShowThreatDialog(false);
        alert('Threat resolved successfully');
      }
    } catch (err) {
      alert('Failed to resolve threat');
    }
  };

  const createIncident = async () => {
    try {
      const incident = {
        ...newIncident,
        affectedResources: newIncident.affectedResources.split(',').map(r => r.trim()),
        affectedUsers: newIncident.affectedUsers.split(',').map(u => u.trim()),
        status: 'reported' as const,
        mitigationActions: []
      };

      const response = await apiClient.post('/admin/security/incidents', incident);
      if (response.data.success) {
        loadSecurityData();
        setShowIncidentDialog(false);
        setNewIncident({
          incidentType: 'policy_violation',
          severity: 'medium',
          description: '',
          affectedResources: '',
          affectedUsers: ''
        });
        alert('Security incident created successfully');
      }
    } catch (err) {
      alert('Failed to create incident');
    }
  };

  const createIPRule = async () => {
    try {
      const response = await apiClient.post('/admin/security/ip-rules', newIpRule);
      if (response.data.success) {
        loadSecurityData();
        setShowIpRuleDialog(false);
        setNewIpRule({
          ruleName: '',
          ipAddress: '',
          ipRange: '',
          action: 'deny',
          organizationId: '',
          userRole: ''
        });
        alert('IP access rule created successfully');
      }
    } catch (err) {
      alert('Failed to create IP access rule');
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      const response = await apiClient.delete(`/admin/security/sessions/${sessionId}`);
      if (response.data.success) {
        loadSecurityData();
        alert('Session terminated successfully');
      }
    } catch (err) {
      alert('Failed to terminate session');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <ErrorIcon color="error" />;
      case 'investigating': return <WarningIcon color="warning" />;
      case 'mitigated': return <ShieldIcon color="info" />;
      case 'resolved': return <CheckCircleIcon color="success" />;
      default: return <CheckCircleIcon color="disabled" />;
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
          <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Security Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadSecurityData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Security Metrics */}
      {metrics && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6">{metrics.totalEvents}</Typography>
                <Typography variant="body2">Total Events</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6">{metrics.loginAttempts}</Typography>
                <Typography variant="body2">Login Attempts</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">{metrics.successfulLogins}</Typography>
                <Typography variant="body2">Successful Logins</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error.main">{metrics.failedLogins}</Typography>
                <Typography variant="body2">Failed Logins</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6">{metrics.dataModifications}</Typography>
                <Typography variant="body2">Data Changes</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">{metrics.suspiciousActivities}</Typography>
                <Typography variant="body2">Suspicious Activities</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, value) => setCurrentTab(value)}>
          <Tab label="Security Threats" />
          <Tab label="Incidents" />
          <Tab label="IP Access Rules" />
          <Tab label="Active Sessions" />
        </Tabs>
      </Paper>

      {/* Security Threats Tab */}
      {currentTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Security Threats</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Source IP</TableCell>
                    <TableCell>Attempts</TableCell>
                    <TableCell>Last Activity</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {threats.map((threat) => (
                    <TableRow key={threat.threatId}>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(threat.status)}
                          label={threat.status}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{threat.threatType}</TableCell>
                      <TableCell>
                        <Chip
                          label={threat.severity}
                          color={getSeverityColor(threat.severity) as any}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{threat.sourceIp}</TableCell>
                      <TableCell>{threat.attemptCount}</TableCell>
                      <TableCell>{new Date(threat.lastActivity).toLocaleString()}</TableCell>
                      <TableCell>
                        {!threat.isBlocked && (
                          <Button
                            size="small"
                            onClick={() => blockThreat(threat.threatId)}
                            startIcon={<BlockIcon />}
                            color="error"
                          >
                            Block
                          </Button>
                        )}
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedThreat(threat);
                            setShowThreatDialog(true);
                          }}
                        >
                          Resolve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {threats.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No security threats detected
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Incidents Tab */}
      {currentTab === 1 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Security Incidents</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowIncidentDialog(true)}
              >
                Report Incident
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Reported By</TableCell>
                    <TableCell>Reported At</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incidents.map((incident) => (
                    <TableRow key={incident.incidentId}>
                      <TableCell>{incident.incidentType}</TableCell>
                      <TableCell>
                        <Chip
                          label={incident.severity}
                          color={getSeverityColor(incident.severity) as any}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={incident.status} variant="outlined" size="small" />
                      </TableCell>
                      <TableCell>{incident.reportedBy}</TableCell>
                      <TableCell>{new Date(incident.reportedAt).toLocaleString()}</TableCell>
                      <TableCell>{incident.description}</TableCell>
                    </TableRow>
                  ))}
                  {incidents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No security incidents reported
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* IP Access Rules Tab */}
      {currentTab === 2 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">IP Access Rules</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowIpRuleDialog(true)}
              >
                Add Rule
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Rule Name</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Created By</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ipRules.map((rule) => (
                    <TableRow key={rule.ruleId}>
                      <TableCell>{rule.ruleName}</TableCell>
                      <TableCell>{rule.ipAddress}</TableCell>
                      <TableCell>
                        <Chip
                          label={rule.action}
                          color={rule.action === 'allow' ? 'success' : 'error'}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{rule.createdBy}</TableCell>
                      <TableCell>{new Date(rule.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={rule.isActive ? 'Active' : 'Inactive'}
                          color={rule.isActive ? 'success' : 'default'}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {ipRules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No IP access rules configured
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Active Sessions Tab */}
      {currentTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Active User Sessions</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Login Time</TableCell>
                    <TableCell>Last Activity</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.sessionId}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <PersonIcon sx={{ mr: 1 }} />
                          {session.username}
                        </Box>
                      </TableCell>
                      <TableCell>{session.ipAddress}</TableCell>
                      <TableCell>{session.role}</TableCell>
                      <TableCell>{new Date(session.loginTime).toLocaleString()}</TableCell>
                      <TableCell>{new Date(session.lastActivity).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => terminateSession(session.sessionId)}
                        >
                          Terminate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sessions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No active sessions
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Threat Resolution Dialog */}
      <Dialog open={showThreatDialog} onClose={() => setShowThreatDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve Security Threat</DialogTitle>
        <DialogContent>
          {selectedThreat && (
            <>
              <Typography variant="body1" gutterBottom>
                Threat: {selectedThreat.threatType} from {selectedThreat.sourceIp}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Resolution Notes"
                variant="outlined"
                margin="normal"
                id="resolution-notes"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowThreatDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              const notes = (document.getElementById('resolution-notes') as HTMLInputElement)?.value || '';
              if (selectedThreat) {
                resolveThreat(selectedThreat.threatId, notes);
              }
            }}
            variant="contained"
          >
            Resolve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Incident Dialog */}
      <Dialog open={showIncidentDialog} onClose={() => setShowIncidentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Report Security Incident</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Incident Type</InputLabel>
            <Select
              value={newIncident.incidentType}
              onChange={(e) => setNewIncident({ ...newIncident, incidentType: e.target.value as any })}
            >
              <MenuItem value="security_breach">Security Breach</MenuItem>
              <MenuItem value="data_leak">Data Leak</MenuItem>
              <MenuItem value="unauthorized_modification">Unauthorized Modification</MenuItem>
              <MenuItem value="system_compromise">System Compromise</MenuItem>
              <MenuItem value="policy_violation">Policy Violation</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Severity</InputLabel>
            <Select
              value={newIncident.severity}
              onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value as any })}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            variant="outlined"
            margin="normal"
            value={newIncident.description}
            onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
          />
          <TextField
            fullWidth
            label="Affected Resources (comma-separated)"
            variant="outlined"
            margin="normal"
            value={newIncident.affectedResources}
            onChange={(e) => setNewIncident({ ...newIncident, affectedResources: e.target.value })}
          />
          <TextField
            fullWidth
            label="Affected Users (comma-separated)"
            variant="outlined"
            margin="normal"
            value={newIncident.affectedUsers}
            onChange={(e) => setNewIncident({ ...newIncident, affectedUsers: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowIncidentDialog(false)}>Cancel</Button>
          <Button onClick={createIncident} variant="contained">
            Create Incident
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create IP Rule Dialog */}
      <Dialog open={showIpRuleDialog} onClose={() => setShowIpRuleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add IP Access Rule</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Rule Name"
            variant="outlined"
            margin="normal"
            value={newIpRule.ruleName}
            onChange={(e) => setNewIpRule({ ...newIpRule, ruleName: e.target.value })}
          />
          <TextField
            fullWidth
            label="IP Address"
            variant="outlined"
            margin="normal"
            value={newIpRule.ipAddress}
            onChange={(e) => setNewIpRule({ ...newIpRule, ipAddress: e.target.value })}
          />
          <TextField
            fullWidth
            label="IP Range (optional, e.g., 192.168.1.0/24)"
            variant="outlined"
            margin="normal"
            value={newIpRule.ipRange}
            onChange={(e) => setNewIpRule({ ...newIpRule, ipRange: e.target.value })}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Action</InputLabel>
            <Select
              value={newIpRule.action}
              onChange={(e) => setNewIpRule({ ...newIpRule, action: e.target.value as any })}
            >
              <MenuItem value="allow">Allow</MenuItem>
              <MenuItem value="deny">Deny</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowIpRuleDialog(false)}>Cancel</Button>
          <Button onClick={createIPRule} variant="contained">
            Create Rule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityDashboard;