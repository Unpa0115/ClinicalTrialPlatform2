import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Toolbar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardHeader,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  Tooltip,
  Fab
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Science as ScienceIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';
import { format, parseISO, differenceInDays } from 'date-fns';

interface ProtocolDeviation {
  visitId: string;
  surveyId: string;
  patientId: string;
  deviationType: 'window_violation' | 'missed_visit' | 'examination_skip' | 'protocol_change';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
  windowStartDate?: string;
  windowEndDate?: string;
  scheduledDate?: string;
  actualDate?: string;
  status?: 'open' | 'acknowledged' | 'resolved' | 'accepted';
  assignedTo?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
}

interface DeviationSummary {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  recentCount: number;
}

interface ProtocolDeviationManagerProps {
  organizationId: string;
  clinicalStudyId?: string;
  refreshTrigger?: number;
  onDeviationUpdate?: () => void;
}

type Order = 'asc' | 'desc';

interface HeadCell {
  disablePadding: boolean;
  id: keyof ProtocolDeviation;
  label: string;
  numeric: boolean;
  sortable: boolean;
}

const headCells: readonly HeadCell[] = [
  { id: 'severity', numeric: false, disablePadding: false, label: 'Severity', sortable: true },
  { id: 'deviationType', numeric: false, disablePadding: false, label: 'Type', sortable: true },
  { id: 'description', numeric: false, disablePadding: false, label: 'Description', sortable: false },
  { id: 'detectedAt', numeric: false, disablePadding: false, label: 'Detected', sortable: true },
  { id: 'visitId', numeric: false, disablePadding: false, label: 'Visit', sortable: false }
];

const ProtocolDeviationManager: React.FC<ProtocolDeviationManagerProps> = ({
  organizationId,
  clinicalStudyId,
  refreshTrigger,
  onDeviationUpdate
}) => {
  const [deviations, setDeviations] = useState<ProtocolDeviation[]>([]);
  const [summary, setSummary] = useState<DeviationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Table state
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof ProtocolDeviation>('detectedAt');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDeviation, setSelectedDeviation] = useState<ProtocolDeviation | null>(null);

  // Dialog state
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolveForm, setResolveForm] = useState({
    status: 'resolved' as const,
    notes: '',
    assignedTo: ''
  });

  useEffect(() => {
    loadDeviations();
  }, [organizationId, clinicalStudyId, refreshTrigger]);

  const loadDeviations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/visits/protocol-deviations?organizationId=${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const deviationList = data.data || [];
        setDeviations(deviationList);
        
        // Calculate summary
        const summary: DeviationSummary = {
          total: deviationList.length,
          byType: {},
          bySeverity: {},
          byStatus: {},
          recentCount: 0
        };

        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        deviationList.forEach((deviation: ProtocolDeviation) => {
          // By type
          summary.byType[deviation.deviationType] = (summary.byType[deviation.deviationType] || 0) + 1;
          
          // By severity
          summary.bySeverity[deviation.severity] = (summary.bySeverity[deviation.severity] || 0) + 1;
          
          // By status (placeholder - assuming 'open' for all)
          const status = deviation.status || 'open';
          summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
          
          // Recent count
          if (parseISO(deviation.detectedAt) > oneDayAgo) {
            summary.recentCount++;
          }
        });

        setSummary(summary);
      } else {
        setError('Failed to load protocol deviations');
      }
    } catch (err) {
      console.error('Error loading protocol deviations:', err);
      setError('Failed to load protocol deviations');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSort = (property: keyof ProtocolDeviation) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, deviation: ProtocolDeviation) => {
    setAnchorEl(event.currentTarget);
    setSelectedDeviation(deviation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDeviation(null);
  };

  const handleViewDetails = () => {
    setDetailsDialogOpen(true);
    handleMenuClose();
  };

  const handleResolveDeviation = () => {
    setResolveForm({
      status: 'resolved',
      notes: '',
      assignedTo: ''
    });
    setResolveDialogOpen(true);
    handleMenuClose();
  };

  const handleResolveSubmit = async () => {
    if (!selectedDeviation) return;

    try {
      // This would be an API call to update the deviation status
      // For now, we'll simulate the update locally
      const updatedDeviations = deviations.map(d => 
        d.visitId === selectedDeviation.visitId && d.detectedAt === selectedDeviation.detectedAt
          ? { 
              ...d, 
              status: resolveForm.status,
              notes: resolveForm.notes,
              resolvedBy: 'current-user', // This would come from auth context
              resolvedAt: new Date().toISOString()
            }
          : d
      );

      setDeviations(updatedDeviations);
      setResolveDialogOpen(false);
      onDeviationUpdate?.();
    } catch (err) {
      console.error('Error resolving deviation:', err);
      setError('Failed to resolve deviation');
    }
  };

  const getSeverityIcon = (severity: ProtocolDeviation['severity']) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'high':
        return <WarningIcon color="warning" />;
      case 'medium':
        return <InfoIcon color="info" />;
      case 'low':
        return <CheckCircleIcon color="action" />;
      default:
        return <InfoIcon />;
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

  const getTypeIcon = (type: ProtocolDeviation['deviationType']) => {
    switch (type) {
      case 'window_violation':
        return <ScheduleIcon />;
      case 'missed_visit':
        return <ErrorIcon />;
      case 'examination_skip':
        return <AssignmentIcon />;
      case 'protocol_change':
        return <EditIcon />;
      default:
        return <WarningIcon />;
    }
  };

  const getTypeLabel = (type: ProtocolDeviation['deviationType']) => {
    switch (type) {
      case 'window_violation': return 'Window Violation';
      case 'missed_visit': return 'Missed Visit';
      case 'examination_skip': return 'Examination Skip';
      case 'protocol_change': return 'Protocol Change';
      default: return type;
    }
  };

  const filteredDeviations = deviations.filter(deviation => {
    const matchesSearch = deviation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deviation.visitId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || deviation.severity === severityFilter;
    const matchesType = typeFilter === 'all' || deviation.deviationType === typeFilter;
    const matchesStatus = statusFilter === 'all' || (deviation.status || 'open') === statusFilter;
    
    return matchesSearch && matchesSeverity && matchesType && matchesStatus;
  });

  const sortedDeviations = [...filteredDeviations].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }

    return 0;
  });

  const paginatedDeviations = sortedDeviations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleExport = () => {
    // Create CSV content
    const headers = ['Severity', 'Type', 'Description', 'Detected At', 'Visit ID', 'Patient ID'];
    const csvContent = [
      headers.join(','),
      ...filteredDeviations.map(deviation => [
        deviation.severity,
        getTypeLabel(deviation.deviationType),
        `"${deviation.description}"`,
        format(parseISO(deviation.detectedAt), 'yyyy-MM-dd HH:mm:ss'),
        deviation.visitId,
        deviation.patientId
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protocol-deviations-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Deviations
                  </Typography>
                  <Typography variant="h4">
                    {summary?.total || 0}
                  </Typography>
                </Box>
                <WarningIcon color="warning" fontSize="large" />
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
                    Critical
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {summary?.bySeverity.critical || 0}
                  </Typography>
                </Box>
                <ErrorIcon color="error" fontSize="large" />
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
                    High Priority
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {summary?.bySeverity.high || 0}
                  </Typography>
                </Box>
                <WarningIcon color="warning" fontSize="large" />
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
                    Recent (24h)
                  </Typography>
                  <Typography variant="h4">
                    {summary?.recentCount || 0}
                  </Typography>
                </Box>
                <Badge 
                  badgeContent={summary?.recentCount || 0} 
                  color="error"
                  invisible={(summary?.recentCount || 0) === 0}
                >
                  <NotificationIcon color="info" fontSize="large" />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
          <Typography
            sx={{ flex: '1 1 100%' }}
            variant="h6"
            id="tableTitle"
            component="div"
          >
            Protocol Deviation Management
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search deviations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>

            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={handleExport}
            >
              Export
            </Button>
          </Box>
        </Toolbar>

        {showFilters && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={severityFilter}
                    label="Severity"
                    onChange={(e) => setSeverityFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Severities</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={typeFilter}
                    label="Type"
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="window_violation">Window Violation</MenuItem>
                    <MenuItem value="missed_visit">Missed Visit</MenuItem>
                    <MenuItem value="examination_skip">Examination Skip</MenuItem>
                    <MenuItem value="protocol_change">Protocol Change</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="open">Open</MenuItem>
                    <MenuItem value="acknowledged">Acknowledged</MenuItem>
                    <MenuItem value="resolved">Resolved</MenuItem>
                    <MenuItem value="accepted">Accepted</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}

        {loading && <LinearProgress />}

        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
            <TableHead>
              <TableRow>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    padding={headCell.disablePadding ? 'none' : 'normal'}
                    sortDirection={orderBy === headCell.id ? order : false}
                  >
                    {headCell.sortable ? (
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={() => handleRequestSort(headCell.id)}
                      >
                        {headCell.label}
                      </TableSortLabel>
                    ) : (
                      headCell.label
                    )}
                  </TableCell>
                ))}
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedDeviations.map((deviation, index) => (
                <TableRow
                  hover
                  key={`${deviation.visitId}-${deviation.detectedAt}-${index}`}
                >
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getSeverityIcon(deviation.severity)}
                      <Chip
                        label={deviation.severity}
                        color={getSeverityColor(deviation.severity)}
                        size="small"
                      />
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getTypeIcon(deviation.deviationType)}
                      <Typography variant="body2">
                        {getTypeLabel(deviation.deviationType)}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {deviation.description}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {format(parseISO(deviation.detectedAt), 'PPp')}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {deviation.visitId}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Patient: {deviation.patientId.slice(-6)}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, deviation)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredDeviations.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="refresh"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={loadDeviations}
      >
        <RefreshIcon />
      </Fab>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <VisibilityIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleResolveDeviation}>
          <CheckCircleIcon sx={{ mr: 1 }} />
          Resolve
        </MenuItem>
      </Menu>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Protocol Deviation Details
        </DialogTitle>
        <DialogContent>
          {selectedDeviation && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Deviation Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        {getSeverityIcon(selectedDeviation.severity)}
                      </ListItemIcon>
                      <ListItemText
                        primary="Severity"
                        secondary={selectedDeviation.severity}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {getTypeIcon(selectedDeviation.deviationType)}
                      </ListItemIcon>
                      <ListItemText
                        primary="Type"
                        secondary={getTypeLabel(selectedDeviation.deviationType)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ScheduleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Detected"
                        secondary={format(parseISO(selectedDeviation.detectedAt), 'PPpp')}
                      />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Visit Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <AssignmentIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Visit ID"
                        secondary={selectedDeviation.visitId}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Patient ID"
                        secondary={selectedDeviation.patientId}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ScienceIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Survey ID"
                        secondary={selectedDeviation.surveyId}
                      />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {selectedDeviation.description}
                  </Typography>
                </Grid>

                {selectedDeviation.windowStartDate && selectedDeviation.windowEndDate && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Protocol Window
                    </Typography>
                    <Typography variant="body2">
                      Window: {format(parseISO(selectedDeviation.windowStartDate), 'PP')} - {format(parseISO(selectedDeviation.windowEndDate), 'PP')}
                    </Typography>
                    {selectedDeviation.scheduledDate && (
                      <Typography variant="body2">
                        Scheduled: {format(parseISO(selectedDeviation.scheduledDate), 'PP')}
                      </Typography>
                    )}
                    {selectedDeviation.actualDate && (
                      <Typography variant="body2">
                        Actual: {format(parseISO(selectedDeviation.actualDate), 'PP')}
                      </Typography>
                    )}
                  </Grid>
                )}

                {selectedDeviation.notes && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Notes
                    </Typography>
                    <Typography variant="body2">
                      {selectedDeviation.notes}
                    </Typography>
                  </Grid>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog
        open={resolveDialogOpen}
        onClose={() => setResolveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Resolve Protocol Deviation
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={resolveForm.status}
                label="Status"
                onChange={(e) => setResolveForm(prev => ({ 
                  ...prev, 
                  status: e.target.value as any 
                }))}
              >
                <MenuItem value="acknowledged">Acknowledged</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="accepted">Accepted as Deviation</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              margin="normal"
              label="Assigned To"
              value={resolveForm.assignedTo}
              onChange={(e) => setResolveForm(prev => ({ 
                ...prev, 
                assignedTo: e.target.value 
              }))}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Resolution Notes"
              multiline
              rows={4}
              value={resolveForm.notes}
              onChange={(e) => setResolveForm(prev => ({ 
                ...prev, 
                notes: e.target.value 
              }))}
              placeholder="Describe the resolution or action taken..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleResolveSubmit}
            disabled={!resolveForm.notes.trim()}
          >
            Resolve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProtocolDeviationManager;