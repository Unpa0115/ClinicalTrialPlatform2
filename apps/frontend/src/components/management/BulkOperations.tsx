import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Snackbar,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { PatientRecord } from '@clinical-trial/shared';
import { patientService } from '../../services/PatientService';
import { useAuth } from '../../contexts/AuthContext';

interface BulkOperationsProps {
  patients: PatientRecord[];
  onOperationComplete?: () => void;
}

interface BulkOperation {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiresConfirmation: boolean;
  allowedRoles: string[];
}

interface OperationResult {
  patientId: string;
  patientCode: string;
  success: boolean;
  error?: string;
}

const BULK_OPERATIONS: BulkOperation[] = [
  {
    id: 'updateStatus',
    name: 'Update Patient Status',
    description: 'Change status for multiple patients at once',
    icon: <PeopleIcon />,
    requiresConfirmation: true,
    allowedRoles: ['super_admin', 'study_admin', 'org_admin'],
  },
  {
    id: 'assignSurveys',
    name: 'Assign Surveys',
    description: 'Assign surveys to multiple patients',
    icon: <AssignmentIcon />,
    requiresConfirmation: true,
    allowedRoles: ['super_admin', 'study_admin', 'org_admin'],
  },
];

export default function BulkOperations({ 
  patients, 
  onOperationComplete 
}: BulkOperationsProps) {
  const { user } = useAuth();
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [operationData, setOperationData] = useState<any>({});
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState<OperationResult[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const availableOperations = BULK_OPERATIONS.filter(op => 
    op.allowedRoles.includes(user?.role || '')
  );

  const handlePatientSelection = (patientId: string, checked: boolean) => {
    if (checked) {
      setSelectedPatients(prev => [...prev, patientId]);
    } else {
      setSelectedPatients(prev => prev.filter(id => id !== patientId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPatients(patients.map(p => p.patientId));
    } else {
      setSelectedPatients([]);
    }
  };

  const handleOperationStart = (operation: BulkOperation) => {
    if (selectedPatients.length === 0) {
      setError('Please select at least one patient');
      return;
    }

    setSelectedOperation(operation);
    setCurrentStep(0);
    setProgress(0);
    setResults([]);
    setError(null);

    if (operation.requiresConfirmation) {
      setConfirmationOpen(true);
    } else {
      executeOperation(operation);
    }
  };

  const executeOperation = async (operation: BulkOperation) => {
    setExecuting(true);
    setConfirmationOpen(false);
    setCurrentStep(1);
    
    const operationResults: OperationResult[] = [];
    const totalPatients = selectedPatients.length;

    try {
      for (let i = 0; i < selectedPatients.length; i++) {
        const patientId = selectedPatients[i];
        const patient = patients.find(p => p.patientId === patientId);
        
        if (!patient) {
          operationResults.push({
            patientId,
            patientCode: 'Unknown',
            success: false,
            error: 'Patient not found',
          });
          continue;
        }

        try {
          await executePatientOperation(operation, patient);
          operationResults.push({
            patientId,
            patientCode: patient.patientCode,
            success: true,
          });
        } catch (err) {
          operationResults.push({
            patientId,
            patientCode: patient.patientCode,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }

        setProgress(((i + 1) / totalPatients) * 100);
        setResults([...operationResults]);
      }

      setCurrentStep(2);
      const successCount = operationResults.filter(r => r.success).length;
      const errorCount = operationResults.filter(r => !r.success).length;
      
      if (errorCount === 0) {
        setSuccessMessage(`Operation completed successfully for all ${successCount} patients`);
      } else {
        setSuccessMessage(`Operation completed: ${successCount} successful, ${errorCount} failed`);
      }

      onOperationComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setExecuting(false);
    }
  };

  const executePatientOperation = async (operation: BulkOperation, patient: PatientRecord) => {
    switch (operation.id) {
      case 'updateStatus':
        if (operationData.newStatus) {
          await patientService.updatePatientStatus(patient.patientId, operationData.newStatus);
        }
        break;
      case 'assignSurveys':
        if (operationData.surveyId) {
          // This would call a survey assignment service
          // await surveyService.assignToPatient(patient.patientId, operationData.surveyId);
          throw new Error('Survey assignment not implemented');
        }
        break;
      default:
        throw new Error(`Unknown operation: ${operation.id}`);
    }
  };

  const renderOperationDataInput = () => {
    if (!selectedOperation) return null;

    switch (selectedOperation.id) {
      case 'updateStatus':
        return (
          <TextField
            select
            fullWidth
            label="New Status"
            value={operationData.newStatus || ''}
            onChange={(e) => setOperationData({ ...operationData, newStatus: e.target.value })}
            margin="normal"
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="withdrawn">Withdrawn</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </TextField>
        );
      case 'assignSurveys':
        return (
          <TextField
            fullWidth
            label="Survey ID"
            value={operationData.surveyId || ''}
            onChange={(e) => setOperationData({ ...operationData, surveyId: e.target.value })}
            margin="normal"
            helperText="Enter the ID of the survey to assign"
          />
        );
      default:
        return null;
    }
  };

  const renderResults = () => {
    if (results.length === 0) return null;

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Operation Results
        </Typography>
        
        <Box display="flex" gap={2} mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckIcon color="success" />
            <Typography variant="body2">
              Success: {successCount}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <ErrorIcon color="error" />
            <Typography variant="body2">
              Failed: {errorCount}
            </Typography>
          </Box>
        </Box>

        <List dense>
          {results.map((result, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                {result.success ? (
                  <CheckIcon color="success" />
                ) : (
                  <ErrorIcon color="error" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={`Patient ${result.patientCode}`}
                secondary={result.error || 'Success'}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Bulk Operations
      </Typography>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Patient Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Select Patients ({selectedPatients.length} selected)
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedPatients.length === patients.length && patients.length > 0}
                indeterminate={selectedPatients.length > 0 && selectedPatients.length < patients.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            }
            label="Select All"
          />

          <Box sx={{ maxHeight: 300, overflow: 'auto', mt: 1 }}>
            {patients.map((patient) => (
              <FormControlLabel
                key={patient.patientId}
                control={
                  <Checkbox
                    checked={selectedPatients.includes(patient.patientId)}
                    onChange={(e) => handlePatientSelection(patient.patientId, e.target.checked)}
                  />
                }
                label={`${patient.patientCode} - ${patient.status}`}
                sx={{ display: 'block' }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Available Operations */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Available Operations
          </Typography>
          
          <Box display="flex" flexWrap="wrap" gap={2}>
            {availableOperations.map((operation) => (
              <Button
                key={operation.id}
                variant="outlined"
                startIcon={operation.icon}
                onClick={() => handleOperationStart(operation)}
                disabled={selectedPatients.length === 0 || executing}
                sx={{ minWidth: 200 }}
              >
                {operation.name}
              </Button>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Execution Progress */}
      {executing && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Executing Operation
            </Typography>
            
            <Stepper activeStep={currentStep} sx={{ mb: 2 }}>
              <Step>
                <StepLabel>Preparing</StepLabel>
              </Step>
              <Step>
                <StepLabel>Processing Patients</StepLabel>
              </Step>
              <Step>
                <StepLabel>Completed</StepLabel>
              </Step>
            </Stepper>

            {currentStep === 1 && (
              <Box>
                <Typography variant="body2" gutterBottom>
                  Processing {selectedPatients.length} patients...
                </Typography>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {Math.round(progress)}% complete
                </Typography>
              </Box>
            )}

            {renderResults()}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmationOpen} onClose={() => setConfirmationOpen(false)}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="warning" />
            Confirm Bulk Operation
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            You are about to perform "{selectedOperation?.name}" on {selectedPatients.length} patients.
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {selectedOperation?.description}
          </Typography>

          {renderOperationDataInput()}

          <Alert severity="warning" sx={{ mt: 2 }}>
            This operation cannot be undone. Please make sure you have the correct settings.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmationOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => selectedOperation && executeOperation(selectedOperation)} 
            variant="contained"
            color="warning"
            disabled={
              (selectedOperation?.id === 'updateStatus' && !operationData.newStatus) ||
              (selectedOperation?.id === 'assignSurveys' && !operationData.surveyId)
            }
          >
            Execute Operation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Box>
  );
}