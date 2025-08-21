import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  EventAvailable as EventAvailableIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, parseISO, differenceInDays } from 'date-fns';

interface VisitStatistics {
  totalVisits: number;
  completedVisits: number;
  inProgressVisits: number;
  scheduledVisits: number;
  missedVisits: number;
  averageCompletionPercentage: number;
  protocolDeviations: number;
  examinationStats: {
    totalExaminations: number;
    completedExaminations: number;
    skippedExaminations: number;
    completionRate: number;
  };
}

interface Visit {
  visitId: string;
  surveyId: string;
  patientId: string;
  visitNumber: number;
  visitName: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled' | 'rescheduled';
  scheduledDate: string;
  actualDate?: string;
  windowStartDate: string;
  windowEndDate: string;
  completionPercentage: number;
  requiredExaminations: string[];
  optionalExaminations: string[];
  completedExaminations: string[];
  skippedExaminations: string[];
  deviationReason?: string;
  visitNotes?: string;
  conductedBy: string;
}

interface Survey {
  surveyId: string;
  name: string;
  patientId: string;
  status: string;
  completionPercentage: number;
  totalVisits: number;
  completedVisits: number;
}

interface ProtocolDeviation {
  visitId: string;
  surveyId: string;
  patientId: string;
  deviationType: 'window_violation' | 'missed_visit' | 'examination_skip' | 'protocol_change';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
}

interface VisitProgressDashboardProps {
  organizationId: string;
  surveyId?: string;
  refreshTrigger?: number;
}

const VisitProgressDashboard: React.FC<VisitProgressDashboardProps> = ({
  organizationId,
  surveyId,
  refreshTrigger
}) => {
  const [statistics, setStatistics] = useState<VisitStatistics | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [deviations, setDeviations] = useState<ProtocolDeviation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [visitDetailsOpen, setVisitDetailsOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [deviationsDialogOpen, setDeviationsDialogOpen] = useState(false);

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuVisitId, setMenuVisitId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [organizationId, surveyId, refreshTrigger]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadStatistics(),
        loadVisits(),
        loadSurveys(),
        loadProtocolDeviations()
      ]);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    const params = surveyId
      ? `surveyId=${surveyId}`
      : `organizationId=${organizationId}`;

    const response = await fetch(`/api/visits/statistics?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      setStatistics(data.data);
    }
  };

  const loadVisits = async () => {
    // This would need a proper visits list endpoint
    // For now, we'll use placeholder data
    setVisits([]);
  };

  const loadSurveys = async () => {
    if (surveyId) {
      // Single survey mode
      const response = await fetch(`/api/surveys/${surveyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSurveys([data.data.survey]);
      }
    } else {
      // Organization mode
      const response = await fetch(`/api/surveys/organization/${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSurveys(data.data.surveys || []);
      }
    }
  };

  const loadProtocolDeviations = async () => {
    const response = await fetch(`/api/visits/protocol-deviations?organizationId=${organizationId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      setDeviations(data.data || []);
    }
  };

  const handleVisitAction = async (action: string, visitId: string) => {
    try {
      let endpoint = '';
      let method = 'PUT';
      let body = {};

      switch (action) {
        case 'start':
          endpoint = `/api/visits/${visitId}/start`;
          break;
        case 'complete':
          endpoint = `/api/visits/${visitId}/complete`;
          break;
        case 'missed':
          endpoint = `/api/visits/${visitId}/missed`;
          body = { reason: 'Marked as missed from dashboard' };
          break;
        case 'cancel':
          endpoint = `/api/visits/${visitId}/cancel`;
          body = { reason: 'Cancelled from dashboard' };
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        loadDashboardData(); // Refresh data
      } else {
        setError(`Failed to ${action} visit`);
      }
    } catch (err) {
      console.error(`Error ${action} visit:`, err);
      setError(`Failed to ${action} visit`);
    }

    setAnchorEl(null);
    setMenuVisitId(null);
  };

  const getStatusColor = (status: Visit['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'scheduled': return 'primary';
      case 'missed': return 'error';
      case 'cancelled': return 'default';
      case 'rescheduled': return 'secondary';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: ProtocolDeviation['severity']) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'success';
    if (percentage >= 75) return 'info';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  // Chart data preparation
  const statusDistributionData = statistics ? [
    { name: 'Completed', value: statistics.completedVisits, color: '#2e7d32' },
    { name: 'In Progress', value: statistics.inProgressVisits, color: '#ed6c02' },
    { name: 'Scheduled', value: statistics.scheduledVisits, color: '#1976d2' },
    { name: 'Missed', value: statistics.missedVisits, color: '#d32f2f' }
  ] : [];

  const examinationData = statistics ? [
    { name: 'Completed', value: statistics.examinationStats.completedExaminations },
    { name: 'Skipped', value: statistics.examinationStats.skippedExaminations },
    { name: 'Remaining', value: statistics.examinationStats.totalExaminations - statistics.examinationStats.completedExaminations - statistics.examinationStats.skippedExaminations }
  ] : [];

  const surveyProgressData = surveys.map(survey => ({
    name: survey.name.length > 20 ? survey.name.substring(0, 20) + '...' : survey.name,
    progress: survey.completionPercentage,
    visits: `${survey.completedVisits}/${survey.totalVisits}`
  }));

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Visits
                  </Typography>
                  <Typography variant="h4">
                    {statistics?.totalVisits || 0}
                  </Typography>
                </Box>
                <TimelineIcon color="primary" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Completed
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {statistics?.completedVisits || 0}
                  </Typography>
                </Box>
                <CheckCircleIcon color="success" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Average Progress
                  </Typography>
                  <Typography variant="h4">
                    {statistics?.averageCompletionPercentage || 0}%
                  </Typography>
                </Box>
                <TrendingUpIcon color="info" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Protocol Deviations
                  </Typography>
                  <Typography variant="h4" color={deviations.length > 0 ? "warning.main" : "success.main"}>
                    {deviations.length}
                  </Typography>
                </Box>
                <WarningIcon color={deviations.length > 0 ? "warning" : "success"} fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts Row */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Visit Status Distribution" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Examination Progress" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={examinationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Survey Progress Chart */}
        {!surveyId && (
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Survey Progress Overview" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={surveyProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="progress" fill="#2e7d32" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Recent Visits Table */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="Recent Visits"
              action={
                <Button
                  size="small"
                  onClick={() => loadDashboardData()}
                >
                  Refresh
                </Button>
              }
            />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Visit</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Scheduled</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visits.slice(0, 10).map((visit) => (
                      <TableRow key={visit.visitId} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {visit.visitName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Patient: {visit.patientId.slice(-6)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={visit.status}
                            color={getStatusColor(visit.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={visit.completionPercentage}
                              color={getProgressColor(visit.completionPercentage)}
                              sx={{ width: 60, height: 6 }}
                            />
                            <Typography variant="body2">
                              {visit.completionPercentage}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {format(parseISO(visit.scheduledDate), 'MMM dd, HH:mm')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              setAnchorEl(e.currentTarget);
                              setMenuVisitId(visit.visitId);
                            }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Protocol Deviations */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="Protocol Deviations"
              action={
                deviations.length > 0 && (
                  <Button
                    size="small"
                    color="warning"
                    onClick={() => setDeviationsDialogOpen(true)}
                  >
                    View All
                  </Button>
                )
              }
            />
            <CardContent>
              {deviations.length === 0 ? (
                <Box display="flex" alignItems="center" justifyContent="center" py={4}>
                  <Typography color="text.secondary">
                    No protocol deviations detected
                  </Typography>
                </Box>
              ) : (
                <List>
                  {deviations.slice(0, 5).map((deviation, index) => (
                    <ListItem key={index} dense>
                      <ListItemIcon>
                        <ErrorIcon color={getSeverityColor(deviation.severity)} />
                      </ListItemIcon>
                      <ListItemText
                        primary={deviation.description}
                        secondary={`${deviation.deviationType} • ${format(parseISO(deviation.detectedAt), 'MMM dd')}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
          setMenuVisitId(null);
        }}
      >
        <MenuItem onClick={() => handleVisitAction('start', menuVisitId!)}>
          <PlayArrowIcon sx={{ mr: 1 }} />
          Start Visit
        </MenuItem>
        <MenuItem onClick={() => handleVisitAction('complete', menuVisitId!)}>
          <CheckCircleIcon sx={{ mr: 1 }} />
          Complete Visit
        </MenuItem>
        <MenuItem onClick={() => handleVisitAction('missed', menuVisitId!)}>
          <ErrorIcon sx={{ mr: 1 }} />
          Mark as Missed
        </MenuItem>
        <MenuItem onClick={() => handleVisitAction('cancel', menuVisitId!)}>
          <StopIcon sx={{ mr: 1 }} />
          Cancel Visit
        </MenuItem>
      </Menu>

      {/* Protocol Deviations Dialog */}
      <Dialog
        open={deviationsDialogOpen}
        onClose={() => setDeviationsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Protocol Deviations</DialogTitle>
        <DialogContent>
          <List>
            {deviations.map((deviation, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>
                    <ErrorIcon color={getSeverityColor(deviation.severity)} />
                  </ListItemIcon>
                  <ListItemText
                    primary={deviation.description}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          Type: {deviation.deviationType} • Severity: {deviation.severity}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Detected: {format(parseISO(deviation.detectedAt), 'PPpp')}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Visit ID: {deviation.visitId}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < deviations.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeviationsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VisitProgressDashboard;