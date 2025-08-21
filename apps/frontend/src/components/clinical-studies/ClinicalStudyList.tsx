import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  TextField,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  People as PeopleIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { ClinicalStudyRecord } from '@clinical-trial/shared';
import { clinicalStudyService } from '../../services/ClinicalStudyService';
import { useAuth } from '../../contexts/AuthContext';
import ClinicalStudyCreateForm from './ClinicalStudyCreateForm';
import ClinicalStudyEditForm from './ClinicalStudyEditForm';
import ClinicalStudyDetailDialog from './ClinicalStudyDetailDialog';

interface ClinicalStudyListProps {
  // No external handlers needed - all CRUD operations are handled internally
}

const statusColors: Record<ClinicalStudyRecord['status'], 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  planning: 'default',
  active: 'success',
  recruiting: 'primary',
  completed: 'info',
  suspended: 'warning',
  terminated: 'error',
};

const statusLabels: Record<ClinicalStudyRecord['status'], string> = {
  planning: 'Planning',
  active: 'Active',
  recruiting: 'Recruiting',
  completed: 'Completed',
  suspended: 'Suspended',
  terminated: 'Terminated',
};

export default function ClinicalStudyList({}: ClinicalStudyListProps) {
  const { user } = useAuth();
  const [studies, setStudies] = useState<ClinicalStudyRecord[]>([]);

  // Dialog states
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<ClinicalStudyRecord | null>(null);

  // Success message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Status update dialog
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    study: ClinicalStudyRecord | null;
    newStatus: ClinicalStudyRecord['status'] | null;
  }>({
    open: false,
    study: null,
    newStatus: null,
  });

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    study: ClinicalStudyRecord | null;
    loading: boolean;
  }>({
    open: false,
    study: null,
    loading: false,
  });

  const loadStudies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (user?.role === 'org_admin' && user.organizationId) {
        params.organizationId = user.organizationId;
      }

      const response = await clinicalStudyService.getStudies(params);
      setStudies(response.studies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clinical studies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudies();
  }, [statusFilter, user]);

  const handleStatusUpdate = async () => {
    if (!statusDialog.study || !statusDialog.newStatus) return;

    try {
      await clinicalStudyService.updateStudyStatus(statusDialog.study.clinicalStudyId, statusDialog.newStatus);
      setStatusDialog({ open: false, study: null, newStatus: null });
      setSuccessMessage('Clinical study status updated successfully');
      loadStudies(); // Reload the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update study status');
    }
  };

  const handleCreateStudy = () => {
    setCreateFormOpen(true);
  };

  const handleEditStudy = (study: ClinicalStudyRecord) => {
    setSelectedStudy(study);
    setEditFormOpen(true);
  };

  const handleViewStudy = (study: ClinicalStudyRecord) => {
    setSelectedStudy(study);
    setDetailDialogOpen(true);
  };

  const handleStudyCreated = (study: ClinicalStudyRecord) => {
    setSuccessMessage(`Clinical study "${study.studyName || study.studyCode}" created successfully`);
    loadStudies();
  };

  const handleStudyUpdated = (study: ClinicalStudyRecord) => {
    setSuccessMessage(`Clinical study "${study.studyName || study.studyCode}" updated successfully`);
    loadStudies();
  };

  const handleEditFromDetail = (study: ClinicalStudyRecord) => {
    setDetailDialogOpen(false);
    setSelectedStudy(study);
    setEditFormOpen(true);
  };

  const handleDeleteStudy = (study: ClinicalStudyRecord) => {
    setDeleteDialog({
      open: true,
      study,
      loading: false,
    });
  };

  const confirmDeleteStudy = async () => {
    if (!deleteDialog.study) return;

    try {
      setDeleteDialog(prev => ({ ...prev, loading: true }));
      await clinicalStudyService.deleteClinicalStudy(deleteDialog.study.clinicalStudyId);
      setDeleteDialog({ open: false, study: null, loading: false });
      setSuccessMessage(`Clinical study "${deleteDialog.study.studyName || deleteDialog.study.studyCode}" deleted successfully`);
      loadStudies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete clinical study');
      setDeleteDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const filteredStudies = studies.filter(study =>
    (study.studyName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (study.studyCode?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const canCreateStudy = user?.role === 'super_admin' || user?.role === 'study_admin';
  const canEditStudy = (study: ClinicalStudyRecord) => {
    if (user?.role === 'super_admin' || user?.role === 'study_admin') return true;
    if (user?.role === 'org_admin' && user.organizationId) {
      return study.targetOrganizations?.includes(user.organizationId) || false;
    }
    return false;
  };

  const canDeleteStudy = (study: ClinicalStudyRecord) => {
    // Only super admin and study admin can delete studies, and only if status is planning
    return (user?.role === 'super_admin' || user?.role === 'study_admin') && 
           study.status === 'planning';
  };

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
          Clinical Study Management
        </Typography>
        {canCreateStudy && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateStudy}
          >
            Create New Study
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by study name or code"
          sx={{ minWidth: 200 }}
        />
        <TextField
          select
          label="Status"
          variant="outlined"
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="planning">Planning</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="recruiting">Recruiting</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="suspended">Suspended</MenuItem>
          <MenuItem value="terminated">Terminated</MenuItem>
        </TextField>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Studies Grid */}
      <Grid container spacing={3}>
        {filteredStudies.map((study) => (
          <Grid item xs={12} md={6} lg={4} key={study.clinicalStudyId}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="h2" noWrap>
                    {study.studyName || study.studyCode || 'Unnamed Study'}
                  </Typography>
                  <Chip
                    label={statusLabels[study.status] || 'Unknown'}
                    color={statusColors[study.status] || 'default'}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  コード: {study.studyCode || 'N/A'}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  フェーズ: {study.currentPhase || 'N/A'}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  プロトコルバージョン: {study.protocolVersion || 'N/A'}
                </Typography>

                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <PeopleIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {study.enrolledPatients || 0} / {study.totalTargetPatients || 0} 患者
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {study.description && study.description.length > 100
                    ? `${study.description.substring(0, 100)}...`
                    : study.description || 'No description available'
                  }
                </Typography>

                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  開始日: {study.startDate ? new Date(study.startDate).toLocaleDateString('ja-JP') : 'N/A'}
                  {' - '}
                  終了日: {study.endDate ? new Date(study.endDate).toLocaleDateString('ja-JP') : 'N/A'}
                </Typography>

                {/* Action Buttons */}
                <Box display="flex" justifyContent="flex-end" gap={1}>
                  <IconButton
                    size="small"
                    onClick={() => handleViewStudy(study)}
                    title="View Details"
                  >
                    <ViewIcon />
                  </IconButton>
                  {canEditStudy(study) && (
                    <IconButton
                      size="small"
                      onClick={() => handleEditStudy(study)}
                      title="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                  {canEditStudy(study) && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setStatusDialog({
                        open: true,
                        study,
                        newStatus: study.status === 'planning' ? 'active' : 
                                  study.status === 'active' ? 'completed' : 
                                  study.status
                      })}
                    >
                      Change Status
                    </Button>
                  )}
                  {canDeleteStudy(study) && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteStudy(study)}
                      title="Delete"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredStudies.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            {searchTerm || statusFilter ? 'No clinical studies match the criteria' : 'No clinical studies found'}
          </Typography>
        </Box>
      )}

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialog.open}
        onClose={() => setStatusDialog({ open: false, study: null, newStatus: null })}
      >
        <DialogTitle>Change Status</DialogTitle>
        <DialogContent>
          <Typography>
            Do you want to change the status of "{statusDialog.study?.studyName || statusDialog.study?.studyCode || 'this study'}"?
          </Typography>
          <TextField
            select
            fullWidth
            margin="normal"
            label="New Status"
            value={statusDialog.newStatus || ''}
            onChange={(e) => setStatusDialog(prev => ({
              ...prev,
              newStatus: e.target.value as ClinicalStudyRecord['status']
            }))}
          >
            <MenuItem value="planning">Planning</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="recruiting">Recruiting</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
            <MenuItem value="terminated">Terminated</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, study: null, newStatus: null })}>
            Cancel
          </Button>
          <Button onClick={handleStatusUpdate} variant="contained">
            Change
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => !deleteDialog.loading && setDeleteDialog({ open: false, study: null, loading: false })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the clinical study "{deleteDialog.study?.studyName || deleteDialog.study?.studyCode}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This action cannot be undone. All associated data will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, study: null, loading: false })}
            disabled={deleteDialog.loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteStudy} 
            variant="contained" 
            color="error"
            disabled={deleteDialog.loading}
            startIcon={deleteDialog.loading ? <CircularProgress size={20} /> : null}
          >
            {deleteDialog.loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clinical Study Create Form */}
      <ClinicalStudyCreateForm
        open={createFormOpen}
        onClose={() => setCreateFormOpen(false)}
        onSuccess={handleStudyCreated}
      />

      {/* Clinical Study Edit Form */}
      <ClinicalStudyEditForm
        open={editFormOpen}
        study={selectedStudy}
        onClose={() => {
          setEditFormOpen(false);
          setSelectedStudy(null);
        }}
        onSuccess={handleStudyUpdated}
      />

      {/* Clinical Study Detail Dialog */}
      <ClinicalStudyDetailDialog
        open={detailDialogOpen}
        study={selectedStudy}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedStudy(null);
        }}
        onEdit={handleEditFromDetail}
      />

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