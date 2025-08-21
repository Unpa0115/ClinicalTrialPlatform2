import React, { useState, useEffect } from 'react';
import { authService } from '../../services/AuthService';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Toolbar,
  Typography,
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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  Person as PersonIcon,
  Science as ScienceIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

interface Survey {
  surveyId: string;
  clinicalStudyId: string;
  organizationId: string;
  patientId: string;
  name: string;
  description?: string;
  baselineDate: string;
  expectedCompletionDate: string;
  status: 'active' | 'completed' | 'withdrawn' | 'suspended';
  completionPercentage: number;
  totalVisits: number;
  completedVisits: number;
  assignedBy: string;
  conductedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface SurveyDetails {
  survey: Survey;
  clinicalStudy: any;
  patient: any;
  visits: any[];
}

interface SurveyManagementTableProps {
  organizationId: string;
  clinicalStudyId?: string;
  onSurveySelect?: (survey: Survey) => void;
  refreshTrigger?: number;
}

type Order = 'asc' | 'desc';

interface HeadCell {
  disablePadding: boolean;
  id: keyof Survey;
  label: string;
  numeric: boolean;
  sortable: boolean;
}

const headCells: readonly HeadCell[] = [
  { id: 'name', numeric: false, disablePadding: false, label: 'Survey Name', sortable: true },
  { id: 'status', numeric: false, disablePadding: false, label: 'Status', sortable: true },
  { id: 'completionPercentage', numeric: true, disablePadding: false, label: 'Progress', sortable: true },
  { id: 'baselineDate', numeric: false, disablePadding: false, label: 'Baseline Date', sortable: true },
  { id: 'expectedCompletionDate', numeric: false, disablePadding: false, label: 'Expected Completion', sortable: true },
  { id: 'updatedAt', numeric: false, disablePadding: false, label: 'Last Updated', sortable: true }
];

const SurveyManagementTable: React.FC<SurveyManagementTableProps> = ({
  organizationId,
  clinicalStudyId,
  onSurveySelect,
  refreshTrigger
}) => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Table state
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof Survey>('updatedAt');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  
  // Dialog state
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [surveyDetails, setSurveyDetails] = useState<SurveyDetails | null>(null);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');

  useEffect(() => {
    loadSurveys();
  }, [organizationId, clinicalStudyId, refreshTrigger]);

  const loadSurveys = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `http://localhost:3001/api/surveys/organization/${organizationId}`;
      if (clinicalStudyId) {
        url += `?clinicalStudyId=${clinicalStudyId}`;
      }
      
      const token = await authService.getAccessToken();
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        try {
          const data = JSON.parse(responseText);
          setSurveys(data.data?.surveys || data.surveys || []);
        } catch (parseError) {
          console.error('Failed to parse JSON:', parseError);
          setError('Invalid response format from server');
        }
      } else {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        setError(`Failed to load surveys: ${response.status}`);
      }
    } catch (err) {
      console.error('Error loading surveys:', err);
      setError('Failed to load surveys');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSort = (property: keyof Survey) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, survey: Survey) => {
    setAnchorEl(event.currentTarget);
    setSelectedSurvey(survey);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSurvey(null);
  };

  const handleViewDetails = async () => {
    if (!selectedSurvey) return;
    
    try {
      const response = await fetch(`/api/surveys/${selectedSurvey.surveyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSurveyDetails(data.data);
        setDetailsDialogOpen(true);
      } else {
        setError('Failed to load survey details');
      }
    } catch (err) {
      console.error('Error loading survey details:', err);
      setError('Failed to load survey details');
    }
    
    handleMenuClose();
  };

  const handleWithdrawSurvey = async () => {
    if (!selectedSurvey) return;
    
    try {
      const response = await fetch(`/api/surveys/${selectedSurvey.surveyId}/withdraw`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason: withdrawReason })
      });
      
      if (response.ok) {
        loadSurveys(); // Refresh the list
        setWithdrawDialogOpen(false);
        setWithdrawReason('');
      } else {
        setError('Failed to withdraw survey');
      }
    } catch (err) {
      console.error('Error withdrawing survey:', err);
      setError('Failed to withdraw survey');
    }
    
    handleMenuClose();
  };

  const getStatusColor = (status: Survey['status']) => {
    switch (status) {
      case 'active': return 'primary';
      case 'completed': return 'success';
      case 'withdrawn': return 'error';
      case 'suspended': return 'warning';
      default: return 'default';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'success';
    if (percentage >= 75) return 'info';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = survey.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         survey.surveyId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || survey.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedSurveys = [...filteredSurveys].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const paginatedSurveys = sortedSurveys.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
          <Typography
            sx={{ flex: '1 1 100%' }}
            variant="h6"
            id="tableTitle"
            component="div"
          >
            Survey Management
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search surveys..."
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
          </Box>
        </Toolbar>
        
        {showFilters && (
          <Box sx={{ px: 2, pb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="withdrawn">Withdrawn</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
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
              {paginatedSurveys.map((survey) => (
                <TableRow
                  hover
                  key={survey.surveyId}
                  onClick={() => onSurveySelect?.(survey)}
                  sx={{ cursor: onSurveySelect ? 'pointer' : 'default' }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {survey.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {survey.surveyId}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={survey.status}
                      color={getStatusColor(survey.status)}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={survey.completionPercentage}
                        color={getProgressColor(survey.completionPercentage)}
                        sx={{ width: 100, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2">
                        {survey.completionPercentage}%
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {survey.completedVisits}/{survey.totalVisits} visits
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(survey.baselineDate), 'PP')}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(survey.expectedCompletionDate), 'PP')}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(survey.updatedAt), 'PP')}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuClick(e, survey);
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
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredSurveys.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

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
        <MenuItem
          onClick={() => {
            setWithdrawDialogOpen(true);
            handleMenuClose();
          }}
          disabled={selectedSurvey?.status !== 'active'}
        >
          <WarningIcon sx={{ mr: 1 }} />
          Withdraw Survey
        </MenuItem>
      </Menu>

      {/* Survey Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AssignmentIcon />
            Survey Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {surveyDetails && (
            <Box>
              {/* Survey Info */}
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  {surveyDetails.survey.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {surveyDetails.survey.description}
                </Typography>
                
                <Box display="flex" gap={2} mb={2}>
                  <Chip
                    label={surveyDetails.survey.status}
                    color={getStatusColor(surveyDetails.survey.status)}
                  />
                  <Chip
                    label={`${surveyDetails.survey.completionPercentage}% Complete`}
                    color={getProgressColor(surveyDetails.survey.completionPercentage)}
                  />
                </Box>
              </Box>

              <Divider />

              {/* Clinical Study Info */}
              <Box my={3}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <ScienceIcon />
                  <Typography variant="h6">Clinical Study</Typography>
                </Box>
                <Typography variant="body1" fontWeight="bold">
                  {surveyDetails.clinicalStudy?.studyName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {surveyDetails.clinicalStudy?.studyCode}
                </Typography>
              </Box>

              <Divider />

              {/* Patient Info */}
              <Box my={3}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <PersonIcon />
                  <Typography variant="h6">Patient</Typography>
                </Box>
                <Typography variant="body1" fontWeight="bold">
                  {surveyDetails.patient?.patientCode}
                  {surveyDetails.patient?.patientInitials && 
                    ` (${surveyDetails.patient.patientInitials})`
                  }
                </Typography>
              </Box>

              <Divider />

              {/* Visits Info */}
              <Box my={3}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <TimelineIcon />
                  <Typography variant="h6">
                    Visits ({surveyDetails.visits.length})
                  </Typography>
                </Box>
                
                <List>
                  {surveyDetails.visits.map((visit: any) => (
                    <ListItem key={visit.visitId}>
                      <ListItemIcon>
                        {visit.status === 'completed' ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <CalendarIcon />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={`Visit ${visit.visitNumber}: ${visit.visitName}`}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Scheduled: {format(new Date(visit.scheduledDate), 'PP')}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Status: {visit.status} • Progress: {visit.completionPercentage}%
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Withdraw Survey Dialog */}
      <Dialog
        open={withdrawDialogOpen}
        onClose={() => setWithdrawDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Withdraw Survey</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Are you sure you want to withdraw this survey? This action will:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="• Change survey status to 'withdrawn'" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Cancel all scheduled and in-progress visits" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Stop data collection for this patient" />
            </ListItem>
          </List>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for withdrawal"
            value={withdrawReason}
            onChange={(e) => setWithdrawReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleWithdrawSurvey}
            color="error"
            variant="contained"
            disabled={!withdrawReason.trim()}
          >
            Withdraw Survey
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SurveyManagementTable;