import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  Person as PersonIcon,
  Science as ScienceIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

interface ClinicalStudy {
  clinicalStudyId: string;
  studyName: string;
  studyCode: string;
  description: string;
  status: string;
  visitTemplate: VisitTemplate[];
  totalTargetPatients: number;
  enrolledPatients: number;
}

interface VisitTemplate {
  visitNumber: number;
  visitType: string;
  visitName: string;
  scheduledDaysFromBaseline: number;
  windowDaysBefore: number;
  windowDaysAfter: number;
  requiredExaminations: string[];
  optionalExaminations: string[];
  examinationOrder: string[];
  isRequired: boolean;
}

interface Patient {
  patientId: string;
  patientCode: string;
  patientInitials?: string;
  registrationDate: string;
  status: string;
  participatingStudies: string[];
  medicalHistory?: string[];
}

interface Organization {
  organizationId: string;
  organizationName: string;
  organizationCode: string;
}

interface SurveyCreateFormProps {
  open: boolean;
  onClose: () => void;
  onSurveyCreated: (survey: any) => void;
  organizationId: string;
}

const SurveyCreateForm: React.FC<SurveyCreateFormProps> = ({
  open,
  onClose,
  onSurveyCreated,
  organizationId
}) => {
  const [formData, setFormData] = useState({
    clinicalStudyId: '',
    patientId: '',
    baselineDate: new Date(),
    customName: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [clinicalStudies, setClinicalStudies] = useState<ClinicalStudy[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedStudy, setSelectedStudy] = useState<ClinicalStudy | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // UI states
  const [studyDetailsOpen, setStudyDetailsOpen] = useState(false);
  const [patientDetailsOpen, setPatientDetailsOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadClinicalStudies();
      loadPatients();
    }
  }, [open, organizationId]);

  const loadClinicalStudies = async () => {
    try {
      const response = await fetch('/api/clinical-studies', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const activeStudies = data.data.filter((study: ClinicalStudy) => 
          study.status === 'active' || study.status === 'recruiting'
        );
        setClinicalStudies(activeStudies);
      }
    } catch (err) {
      console.error('Error loading clinical studies:', err);
      setError('Failed to load clinical studies');
    }
  };

  const loadPatients = async () => {
    try {
      const response = await fetch(`/api/patients/organization/${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const activePatients = data.data.filter((patient: Patient) => 
          patient.status === 'active'
        );
        setPatients(activePatients);
      }
    } catch (err) {
      console.error('Error loading patients:', err);
      setError('Failed to load patients');
    }
  };

  const handleStudyChange = (studyId: string) => {
    const study = clinicalStudies.find(s => s.clinicalStudyId === studyId);
    setSelectedStudy(study || null);
    setFormData(prev => ({ ...prev, clinicalStudyId: studyId }));
  };

  const handlePatientChange = (patientId: string) => {
    const patient = patients.find(p => p.patientId === patientId);
    setSelectedPatient(patient || null);
    setFormData(prev => ({ ...prev, patientId }));
  };

  const calculateExpectedCompletion = () => {
    if (!selectedStudy || !formData.baselineDate) return null;
    
    const maxDays = Math.max(...selectedStudy.visitTemplate.map(vt => 
      vt.scheduledDaysFromBaseline + vt.windowDaysAfter
    ));
    
    const expectedDate = new Date(formData.baselineDate);
    expectedDate.setDate(expectedDate.getDate() + maxDays);
    
    return expectedDate;
  };

  const validateForm = () => {
    if (!formData.clinicalStudyId) {
      setError('Please select a clinical study');
      return false;
    }
    
    if (!formData.patientId) {
      setError('Please select a patient');
      return false;
    }
    
    if (!formData.baselineDate) {
      setError('Please select a baseline date');
      return false;
    }

    // Check if patient already has active survey in this study
    if (selectedPatient?.participatingStudies.includes(formData.clinicalStudyId)) {
      setError('Patient already has an active survey in this study');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await fetch('/api/surveys/from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          clinicalStudyId: formData.clinicalStudyId,
          organizationId,
          patientId: formData.patientId,
          baselineDate: formData.baselineDate.toISOString(),
          assignedBy: user.userId || 'current-user',
          customName: formData.customName || undefined
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setSuccess(`Survey created successfully with ${result.data.summary.generatedVisits} visits`);
        onSurveyCreated(result.data);
        
        // Reset form
        setFormData({
          clinicalStudyId: '',
          patientId: '',
          baselineDate: new Date(),
          customName: '',
          notes: ''
        });
        setSelectedStudy(null);
        setSelectedPatient(null);
        
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create survey');
      }
    } catch (err) {
      console.error('Error creating survey:', err);
      setError('Failed to create survey');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      clinicalStudyId: '',
      patientId: '',
      baselineDate: new Date(),
      customName: '',
      notes: ''
    });
    setSelectedStudy(null);
    setSelectedPatient(null);
    setError(null);
    setSuccess(null);
    onClose();
  };

  const expectedCompletion = calculateExpectedCompletion();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AddIcon />
          <Typography variant="h6">Create New Survey</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Clinical Study Selection */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader
                    avatar={<ScienceIcon />}
                    title="Clinical Study"
                    subheader="Select study protocol"
                  />
                  <CardContent>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Clinical Study</InputLabel>
                      <Select
                        value={formData.clinicalStudyId}
                        onChange={(e) => handleStudyChange(e.target.value)}
                        label="Clinical Study"
                      >
                        {clinicalStudies.map((study) => (
                          <MenuItem key={study.clinicalStudyId} value={study.clinicalStudyId}>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {study.studyCode} - {study.studyName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {study.enrolledPatients}/{study.totalTargetPatients} patients enrolled
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    {selectedStudy && (
                      <Box mt={2}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setStudyDetailsOpen(true)}
                        >
                          View Study Details
                        </Button>
                        <Box mt={1}>
                          <Chip
                            size="small"
                            label={`${selectedStudy.visitTemplate.length} visits`}
                            icon={<TimelineIcon />}
                          />
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Patient Selection */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader
                    avatar={<PersonIcon />}
                    title="Patient"
                    subheader="Select patient from master"
                  />
                  <CardContent>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Patient</InputLabel>
                      <Select
                        value={formData.patientId}
                        onChange={(e) => handlePatientChange(e.target.value)}
                        label="Patient"
                      >
                        {patients.map((patient) => (
                          <MenuItem key={patient.patientId} value={patient.patientId}>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {patient.patientCode}
                                {patient.patientInitials && ` (${patient.patientInitials})`}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Registered: {format(new Date(patient.registrationDate), 'PPP')}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    {selectedPatient && (
                      <Box mt={2}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setPatientDetailsOpen(true)}
                        >
                          View Patient Details
                        </Button>
                        {selectedPatient.participatingStudies.length > 0 && (
                          <Box mt={1}>
                            <Typography variant="caption" color="text.secondary">
                              Active in {selectedPatient.participatingStudies.length} studies
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Survey Configuration */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader
                    avatar={<CalendarIcon />}
                    title="Survey Configuration"
                    subheader="Set baseline date and survey details"
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <DatePicker
                          label="Baseline Date"
                          value={formData.baselineDate}
                          onChange={(date) => setFormData(prev => ({ 
                            ...prev, 
                            baselineDate: date || new Date() 
                          }))}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              margin: 'normal'
                            }
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          margin="normal"
                          label="Custom Survey Name (Optional)"
                          value={formData.customName}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            customName: e.target.value 
                          }))}
                          placeholder="Leave empty for auto-generated name"
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        {expectedCompletion && (
                          <Box mt={3}>
                            <Typography variant="body2" color="text.secondary">
                              Expected Completion:
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {format(expectedCompletion, 'PPP')}
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </LocalizationProvider>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.clinicalStudyId || !formData.patientId}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
        >
          {loading ? 'Creating Survey...' : 'Create Survey'}
        </Button>
      </DialogActions>

      {/* Study Details Dialog */}
      <Dialog
        open={studyDetailsOpen}
        onClose={() => setStudyDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Study Details</DialogTitle>
        <DialogContent>
          {selectedStudy && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedStudy.studyName} ({selectedStudy.studyCode})
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {selectedStudy.description}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Visit Template ({selectedStudy.visitTemplate.length} visits)
              </Typography>
              
              <List>
                {selectedStudy.visitTemplate.map((visit, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <TimelineIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Visit ${visit.visitNumber}: ${visit.visitName}`}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            Day {visit.scheduledDaysFromBaseline} from baseline 
                            (Window: -{visit.windowDaysBefore} to +{visit.windowDaysAfter} days)
                          </Typography>
                          <Box mt={1}>
                            {visit.requiredExaminations.map(exam => (
                              <Chip key={exam} size="small" label={exam} sx={{ mr: 0.5, mb: 0.5 }} />
                            ))}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudyDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Patient Details Dialog */}
      <Dialog
        open={patientDetailsOpen}
        onClose={() => setPatientDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Patient Details</DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedPatient.patientCode}
                {selectedPatient.patientInitials && ` (${selectedPatient.patientInitials})`}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Registration Date: {format(new Date(selectedPatient.registrationDate), 'PPP')}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Status: {selectedPatient.status}
              </Typography>
              
              {selectedPatient.medicalHistory && selectedPatient.medicalHistory.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Medical History:
                  </Typography>
                  {selectedPatient.medicalHistory.map((item, index) => (
                    <Chip key={index} size="small" label={item} sx={{ mr: 0.5, mb: 0.5 }} />
                  ))}
                </Box>
              )}
              
              {selectedPatient.participatingStudies.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Participating Studies: {selectedPatient.participatingStudies.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Patient is currently enrolled in other studies
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPatientDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default SurveyCreateForm;