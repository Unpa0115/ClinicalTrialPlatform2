import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, isBefore, isAfter } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon
} from '@mui/icons-material';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    'en-US': enUS,
  },
});

interface Visit {
  visitId: string;
  surveyId: string;
  clinicalStudyId: string;
  organizationId: string;
  patientId: string;
  visitNumber: number;
  visitType: string;
  visitName: string;
  scheduledDate: string;
  actualDate?: string;
  windowStartDate: string;
  windowEndDate: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled' | 'rescheduled';
  completionPercentage: number;
  requiredExaminations: string[];
  optionalExaminations: string[];
  examinationOrder: string[];
  completedExaminations: string[];
  skippedExaminations: string[];
  visitNotes?: string;
  deviationReason?: string;
  conductedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Visit;
  allDay?: boolean;
}

interface VisitSchedulingCalendarProps {
  organizationId: string;
  surveyId?: string;
  onVisitScheduled?: (visit: Visit) => void;
  refreshTrigger?: number;
}

const VisitSchedulingCalendar: React.FC<VisitSchedulingCalendarProps> = ({
  organizationId,
  surveyId,
  onVisitScheduled,
  refreshTrigger
}) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Calendar state
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  // Dialog state
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  
  // Form state
  const [scheduleForm, setScheduleForm] = useState({
    visitId: '',
    scheduledDate: new Date(),
    conductedBy: '',
    notes: ''
  });
  
  // Protocol compliance state
  const [complianceAlerts, setComplianceAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadVisits();
  }, [organizationId, surveyId, refreshTrigger]);

  useEffect(() => {
    // Convert visits to calendar events
    const calendarEvents: CalendarEvent[] = visits.map(visit => {
      const startDate = new Date(visit.scheduledDate);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
      
      return {
        id: visit.visitId,
        title: `${visit.visitName} - ${getPatientDisplay(visit)}`,
        start: startDate,
        end: endDate,
        resource: visit
      };
    });
    
    setEvents(calendarEvents);
  }, [visits]);

  const loadVisits = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `/api/visits/statistics?organizationId=${organizationId}`;
      if (surveyId) {
        url = `/api/visits/statistics?surveyId=${surveyId}`;
      }
      
      // Note: This would need to be updated to get actual visit list
      // For now, we'll use a placeholder implementation
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        // This is a placeholder - we need a proper visits list endpoint
        setVisits([]);
      } else {
        setError('Failed to load visits');
      }
    } catch (err) {
      console.error('Error loading visits:', err);
      setError('Failed to load visits');
    } finally {
      setLoading(false);
    }
  };

  const getPatientDisplay = (visit: Visit) => {
    // This would need patient data - placeholder for now
    return `Patient-${visit.patientId.slice(-3)}`;
  };

  const getEventStyle = (event: CalendarEvent) => {
    const visit = event.resource;
    const now = new Date();
    const windowStart = new Date(visit.windowStartDate);
    const windowEnd = new Date(visit.windowEndDate);
    const scheduled = new Date(visit.scheduledDate);
    
    let backgroundColor = '#1976d2'; // Default blue
    let color = 'white';
    
    switch (visit.status) {
      case 'completed':
        backgroundColor = '#2e7d32'; // Green
        break;
      case 'in_progress':
        backgroundColor = '#ed6c02'; // Orange
        break;
      case 'missed':
        backgroundColor = '#d32f2f'; // Red
        break;
      case 'cancelled':
        backgroundColor = '#757575'; // Gray
        break;
      case 'rescheduled':
        backgroundColor = '#9c27b0'; // Purple
        break;
      case 'scheduled':
        // Check for protocol compliance
        if (isBefore(scheduled, windowStart) || isAfter(scheduled, windowEnd)) {
          backgroundColor = '#ff9800'; // Warning orange
        } else if (isAfter(now, windowEnd) && visit.status !== 'completed') {
          backgroundColor = '#d32f2f'; // Overdue red
        }
        break;
    }
    
    return {
      style: {
        backgroundColor,
        color,
        border: 'none',
        borderRadius: '4px'
      }
    };
  };

  const handleEventSelect = (event: CalendarEvent) => {
    setSelectedVisit(event.resource);
    setDetailsDialogOpen(true);
  };

  const handleSlotSelect = ({ start, end }: { start: Date; end: Date }) => {
    // This would open a dialog to schedule a new visit
    // For now, we'll focus on rescheduling existing visits
  };

  const handleScheduleVisit = async () => {
    if (!selectedVisit) return;
    
    try {
      const response = await fetch('/api/visits/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          surveyId: selectedVisit.surveyId,
          visitId: selectedVisit.visitId,
          scheduledDate: scheduleForm.scheduledDate.toISOString(),
          conductedBy: scheduleForm.conductedBy,
          notes: scheduleForm.notes
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (!result.data.protocolCompliant) {
          setComplianceAlerts(result.data.deviations);
        }
        
        loadVisits(); // Refresh visits
        setScheduleDialogOpen(false);
        onVisitScheduled?.(result.data.visit);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to schedule visit');
      }
    } catch (err) {
      console.error('Error scheduling visit:', err);
      setError('Failed to schedule visit');
    }
  };

  const handleReschedule = () => {
    if (!selectedVisit) return;
    
    setScheduleForm({
      visitId: selectedVisit.visitId,
      scheduledDate: new Date(selectedVisit.scheduledDate),
      conductedBy: selectedVisit.conductedBy,
      notes: selectedVisit.visitNotes || ''
    });
    
    setDetailsDialogOpen(false);
    setScheduleDialogOpen(true);
  };

  const isWithinWindow = (visitDate: Date, windowStart: string, windowEnd: string) => {
    const start = new Date(windowStart);
    const end = new Date(windowEnd);
    return visitDate >= start && visitDate <= end;
  };

  const getStatusChip = (status: Visit['status']) => {
    const statusConfig = {
      scheduled: { color: 'primary' as const, label: 'Scheduled' },
      in_progress: { color: 'warning' as const, label: 'In Progress' },
      completed: { color: 'success' as const, label: 'Completed' },
      missed: { color: 'error' as const, label: 'Missed' },
      cancelled: { color: 'default' as const, label: 'Cancelled' },
      rescheduled: { color: 'secondary' as const, label: 'Rescheduled' }
    };
    
    const config = statusConfig[status] || statusConfig.scheduled;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {complianceAlerts.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Protocol Deviations Detected:
            </Typography>
            {complianceAlerts.map((alert, index) => (
              <Typography key={index} variant="body2">
                • {alert.description}
              </Typography>
            ))}
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Visit Schedule Calendar
            </Typography>
            
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<ScheduleIcon />}
                onClick={() => setView(Views.WEEK)}
                color={view === Views.WEEK ? 'primary' : 'inherit'}
              >
                Week
              </Button>
              <Button
                variant="outlined"
                startIcon={<CalendarIcon />}
                onClick={() => setView(Views.MONTH)}
                color={view === Views.MONTH ? 'primary' : 'inherit'}
              >
                Month
              </Button>
            </Box>
          </Box>

          <Box sx={{ height: 600 }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectEvent={handleEventSelect}
              onSelectSlot={handleSlotSelect}
              selectable
              eventPropGetter={getEventStyle}
              views={{
                month: true,
                week: true,
                day: true
              }}
              step={30}
              showMultiDayTimes
              components={{
                event: ({ event }) => (
                  <Box>
                    <Typography variant="caption" fontWeight="bold">
                      {event.title}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {getStatusChip(event.resource.status)}
                    </Box>
                  </Box>
                )
              }}
            />
          </Box>
        </Paper>

        {/* Visit Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <AssignmentIcon />
              Visit Details
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedVisit && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {selectedVisit.visitName}
                      </Typography>
                      
                      <Box mb={2}>
                        {getStatusChip(selectedVisit.status)}
                      </Box>
                      
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <PersonIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Patient"
                            secondary={getPatientDisplay(selectedVisit)}
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemIcon>
                            <ScheduleIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Scheduled Date"
                            secondary={format(new Date(selectedVisit.scheduledDate), 'PPpp')}
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemIcon>
                            <AccessTimeIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Protocol Window"
                            secondary={`${format(new Date(selectedVisit.windowStartDate), 'PP')} - ${format(new Date(selectedVisit.windowEndDate), 'PP')}`}
                          />
                        </ListItem>
                        
                        {selectedVisit.actualDate && (
                          <ListItem>
                            <ListItemIcon>
                              <CheckCircleIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary="Actual Date"
                              secondary={format(new Date(selectedVisit.actualDate), 'PPpp')}
                            />
                          </ListItem>
                        )}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Examination Configuration
                      </Typography>
                      
                      <Box mb={2}>
                        <Typography variant="subtitle2" gutterBottom>
                          Progress: {selectedVisit.completionPercentage}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedVisit.completedExaminations.length} of {selectedVisit.requiredExaminations.length + selectedVisit.optionalExaminations.length} examinations
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Required Examinations:
                      </Typography>
                      <Box mb={2}>
                        {selectedVisit.requiredExaminations.map(exam => (
                          <Chip
                            key={exam}
                            label={exam}
                            size="small"
                            color={selectedVisit.completedExaminations.includes(exam) ? 'success' : 'default'}
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Optional Examinations:
                      </Typography>
                      <Box>
                        {selectedVisit.optionalExaminations.map(exam => (
                          <Chip
                            key={exam}
                            label={exam}
                            size="small"
                            variant="outlined"
                            color={selectedVisit.completedExaminations.includes(exam) ? 'success' : 'default'}
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {selectedVisit.visitNotes && (
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Visit Notes
                        </Typography>
                        <Typography variant="body2">
                          {selectedVisit.visitNotes}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {selectedVisit.deviationReason && (
                  <Grid item xs={12}>
                    <Alert severity="warning">
                      <Typography variant="subtitle2" gutterBottom>
                        Protocol Deviation
                      </Typography>
                      <Typography variant="body2">
                        {selectedVisit.deviationReason}
                      </Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedVisit?.status === 'scheduled' && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleReschedule}
              >
                Reschedule
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Schedule/Reschedule Dialog */}
        <Dialog
          open={scheduleDialogOpen}
          onClose={() => setScheduleDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {selectedVisit ? 'Reschedule Visit' : 'Schedule Visit'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <DateTimePicker
                label="Scheduled Date & Time"
                value={scheduleForm.scheduledDate}
                onChange={(date) => setScheduleForm(prev => ({ 
                  ...prev, 
                  scheduledDate: date || new Date() 
                }))}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal'
                  }
                }}
              />

              <TextField
                fullWidth
                margin="normal"
                label="Conducted By"
                value={scheduleForm.conductedBy}
                onChange={(e) => setScheduleForm(prev => ({ 
                  ...prev, 
                  conductedBy: e.target.value 
                }))}
              />

              <TextField
                fullWidth
                margin="normal"
                label="Notes"
                multiline
                rows={3}
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
              />

              {selectedVisit && !isWithinWindow(
                scheduleForm.scheduledDate,
                selectedVisit.windowStartDate,
                selectedVisit.windowEndDate
              ) && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Warning: This date is outside the protocol window (
                    {format(new Date(selectedVisit.windowStartDate), 'PP')} - {format(new Date(selectedVisit.windowEndDate), 'PP')}
                    ). This will be recorded as a protocol deviation.
                  </Typography>
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleScheduleVisit}
              disabled={!scheduleForm.conductedBy.trim()}
            >
              {selectedVisit ? 'Reschedule' : 'Schedule'} Visit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default VisitSchedulingCalendar;