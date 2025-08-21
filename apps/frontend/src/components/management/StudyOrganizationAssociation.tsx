import React, { useState, useEffect } from 'react';
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
  Chip,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Business as OrganizationIcon,
  Science as StudyIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { ClinicalStudyRecord, OrganizationRecord } from '@clinical-trial/shared';
import { clinicalStudyService } from '../../services/ClinicalStudyService';
import { organizationService } from '../../services/OrganizationService';
import { useAuth } from '../../contexts/AuthContext';

interface StudyOrganizationAssociationProps {
  onAssociationChange?: () => void;
}

interface Association {
  studyId: string;
  studyName: string;
  organizationId: string;
  organizationName: string;
  maxPatientCapacity: number;
  currentEnrollment: number;
  status: 'active' | 'inactive' | 'full';
}

export default function StudyOrganizationAssociation({ 
  onAssociationChange 
}: StudyOrganizationAssociationProps) {
  const { user } = useAuth();
  const [studies, setStudies] = useState<ClinicalStudyRecord[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<string>('');
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const [maxCapacity, setMaxCapacity] = useState<number>(50);

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    association: Association | null;
  }>({
    open: false,
    association: null,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [studiesResponse, organizationsResponse] = await Promise.all([
        clinicalStudyService.getStudies(),
        organizationService.getOrganizations({ status: 'active' }),
      ]);

      setStudies(studiesResponse.studies);
      setOrganizations(organizationsResponse.organizations);

      // Build associations from study target organizations
      const associationList: Association[] = [];
      studiesResponse.studies.forEach(study => {
        study.targetOrganizations?.forEach(orgId => {
          const org = organizationsResponse.organizations.find(o => o.organizationId === orgId);
          if (org) {
            associationList.push({
              studyId: study.clinicalStudyId,
              studyName: study.studyName,
              organizationId: org.organizationId,
              organizationName: org.organizationName,
              maxPatientCapacity: org.maxPatientCapacity,
              currentEnrollment: study.currentEnrollment || 0,
              status: (study.currentEnrollment || 0) >= org.maxPatientCapacity ? 'full' : 'active',
            });
          }
        });
      });
      setAssociations(associationList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddAssociation = async () => {
    if (!selectedStudy || !selectedOrganization) {
      setError('Please select both study and organization');
      return;
    }

    try {
      await clinicalStudyService.addOrganizationToStudy(selectedStudy, selectedOrganization);
      await organizationService.updateOrganizationCapacity(selectedOrganization, maxCapacity);
      
      setAddDialogOpen(false);
      setSelectedStudy('');
      setSelectedOrganization('');
      setMaxCapacity(50);
      setSuccessMessage('Association created successfully');
      loadData();
      onAssociationChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create association');
    }
  };

  const handleRemoveAssociation = async (association: Association) => {
    try {
      await clinicalStudyService.removeOrganizationFromStudy(
        association.studyId, 
        association.organizationId
      );
      
      setDeleteDialog({ open: false, association: null });
      setSuccessMessage('Association removed successfully');
      loadData();
      onAssociationChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove association');
    }
  };

  const getAvailableOrganizations = () => {
    if (!selectedStudy) return organizations;
    
    const study = studies.find(s => s.clinicalStudyId === selectedStudy);
    const associatedOrgIds = study?.targetOrganizations || [];
    
    return organizations.filter(org => !associatedOrgIds.includes(org.organizationId));
  };

  const getAvailableStudies = () => {
    return studies.filter(study => study.status === 'active' || study.status === 'recruiting');
  };

  const canManageAssociations = user?.role === 'super_admin' || user?.role === 'study_admin';

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Study-Organization Associations
        </Typography>
        {canManageAssociations && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add Association
          </Button>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Associations Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <StudyIcon fontSize="small" />
                    Clinical Study
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <OrganizationIcon fontSize="small" />
                    Organization
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PeopleIcon fontSize="small" />
                    Capacity
                  </Box>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Progress</TableCell>
                {canManageAssociations && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {associations.map((association, index) => (
                <TableRow key={`${association.studyId}-${association.organizationId}`}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {association.studyName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {association.organizationName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {association.currentEnrollment} / {association.maxPatientCapacity}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={association.status === 'full' ? 'Full' : 'Active'}
                      color={association.status === 'full' ? 'error' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 100,
                          height: 8,
                          bgcolor: 'grey.300',
                          borderRadius: 1,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            width: `${Math.min((association.currentEnrollment / association.maxPatientCapacity) * 100, 100)}%`,
                            height: '100%',
                            bgcolor: association.status === 'full' ? 'error.main' : 'success.main',
                          }}
                        />
                      </Box>
                      <Typography variant="caption">
                        {Math.round((association.currentEnrollment / association.maxPatientCapacity) * 100)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  {canManageAssociations && (
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteDialog({ 
                          open: true, 
                          association 
                        })}
                        title="Remove Association"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {associations.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No associations found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create associations between studies and organizations to enable patient enrollment
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add Association Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Study-Organization Association</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Clinical Study"
                value={selectedStudy}
                onChange={(e) => setSelectedStudy(e.target.value)}
              >
                {getAvailableStudies().map((study) => (
                  <MenuItem key={study.clinicalStudyId} value={study.clinicalStudyId}>
                    {study.studyName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Organization"
                value={selectedOrganization}
                onChange={(e) => setSelectedOrganization(e.target.value)}
                disabled={!selectedStudy}
              >
                {getAvailableOrganizations().map((org) => (
                  <MenuItem key={org.organizationId} value={org.organizationId}>
                    {org.organizationName} (Current capacity: {org.maxPatientCapacity})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                type="number"
                fullWidth
                label="Maximum Patient Capacity"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                inputProps={{ min: 1, max: 1000 }}
                helperText="Maximum number of patients this organization can enroll for this study"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddAssociation} 
            variant="contained"
            disabled={!selectedStudy || !selectedOrganization}
          >
            Add Association
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, association: null })}
      >
        <DialogTitle>Remove Association</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove the association between "{deleteDialog.association?.studyName}" 
            and "{deleteDialog.association?.organizationName}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This will prevent the organization from enrolling new patients to this study.
            Existing enrolled patients will not be affected.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, association: null })}>
            Cancel
          </Button>
          <Button 
            onClick={() => deleteDialog.association && handleRemoveAssociation(deleteDialog.association)} 
            variant="contained" 
            color="error"
          >
            Remove
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