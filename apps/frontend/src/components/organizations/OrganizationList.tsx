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
  List,
  ListItem,
  ListItemText,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Build as BuildIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import OrganizationCreateForm from './OrganizationCreateForm';
import OrganizationEditForm from './OrganizationEditForm';
import OrganizationDetailDialog from './OrganizationDetailDialog';
import { OrganizationRecord } from '@clinical-trial/shared';
import { organizationService } from '../../services/OrganizationService';
import { useAuth } from '../../contexts/AuthContext';

interface OrganizationListProps {
  // No external handlers needed - all CRUD operations are handled internally
}

const statusColors: Record<OrganizationRecord['status'], 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  active: 'success',
  inactive: 'default',
  pending_approval: 'warning',
  suspended: 'error',
};

const statusLabels: Record<OrganizationRecord['status'], string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending_approval: 'Pending Approval',
  suspended: 'Suspended',
};

const organizationTypeLabels: Record<OrganizationRecord['organizationType'], string> = {
  hospital: 'Hospital',
  clinic: 'Clinic',
  research_center: 'Research Center',
  university: 'University',
};

export default function OrganizationList({}: OrganizationListProps) {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationRecord | null>(null);

  // Success message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Status update dialog
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    organization: OrganizationRecord | null;
    newStatus: OrganizationRecord['status'] | null;
  }>({
    open: false,
    organization: null,
    newStatus: null,
  });

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    organization: OrganizationRecord | null;
    loading: boolean;
  }>({
    open: false,
    organization: null,
    loading: false,
  });

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== LOADING ORGANIZATIONS ===');
      console.log('Status filter:', statusFilter);
      
      const params: any = {};
      if (statusFilter) params.status = statusFilter;

      console.log('API params:', params);
      const response = await organizationService.getOrganizations(params);
      console.log('API response:', response);
      console.log('Organizations count:', response.organizations?.length || 0);
      
      setOrganizations(response.organizations);
    } catch (err) {
      console.error('Load organizations error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, [statusFilter]);

  const handleStatusUpdate = async () => {
    if (!statusDialog.organization || !statusDialog.newStatus) return;

    try {
      await organizationService.updateOrganizationStatus(statusDialog.organization.organizationId, statusDialog.newStatus);
      setStatusDialog({ open: false, organization: null, newStatus: null });
      setSuccessMessage('Organization status updated successfully');
      loadOrganizations(); // Reload the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update organization status');
    }
  };

  const handleCreateOrganization = () => {
    setCreateFormOpen(true);
  };

  const handleEditOrganization = (organization: OrganizationRecord) => {
    setSelectedOrganization(organization);
    setEditFormOpen(true);
  };

  const handleViewOrganization = (organization: OrganizationRecord) => {
    setSelectedOrganization(organization);
    setDetailDialogOpen(true);
  };

  const handleOrganizationCreated = (organization: OrganizationRecord) => {
    setSuccessMessage(`Organization "${organization.organizationName}" created successfully`);
    loadOrganizations();
  };

  const handleOrganizationUpdated = (organization: OrganizationRecord) => {
    setSuccessMessage(`Organization "${organization.organizationName}" updated successfully`);
    loadOrganizations();
  };

  const handleEditFromDetail = (organization: OrganizationRecord) => {
    setDetailDialogOpen(false);
    setSelectedOrganization(organization);
    setEditFormOpen(true);
  };

  const handleDeleteOrganization = (organization: OrganizationRecord) => {
    setDeleteDialog({
      open: true,
      organization,
      loading: false,
    });
  };

  const confirmDeleteOrganization = async () => {
    if (!deleteDialog.organization) return;

    try {
      setDeleteDialog(prev => ({ ...prev, loading: true }));
      await organizationService.deleteOrganization(deleteDialog.organization.organizationId);
      setDeleteDialog({ open: false, organization: null, loading: false });
      setSuccessMessage(`Organization "${deleteDialog.organization.organizationName}" deleted successfully`);
      loadOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete organization');
      setDeleteDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const filteredOrganizations = organizations.filter(org =>
    org.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.organizationCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateOrganization = user?.role === 'super_admin' || user?.role === 'study_admin';
  const canEditOrganization = (org: OrganizationRecord) => {
    if (user?.role === 'super_admin' || user?.role === 'study_admin') return true;
    if (user?.role === 'org_admin' && user.organizationId === org.organizationId) return true;
    return false;
  };

  const canDeleteOrganization = (org: OrganizationRecord) => {
    // Only super admin can delete organizations, and only if they're inactive/pending
    return user?.role === 'super_admin' && 
           (org.status === 'inactive' || org.status === 'pending_approval') &&
           org.activeStudies.length === 0; // No active studies
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
          Organization Management
        </Typography>
        {canCreateOrganization && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateOrganization}
          >
            Create New Organization
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
          placeholder="Search by organization name"
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
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
          <MenuItem value="pending_approval">Pending Approval</MenuItem>
          <MenuItem value="suspended">Suspended</MenuItem>
        </TextField>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Organizations Grid */}
      <Grid container spacing={3}>
        {filteredOrganizations.map((organization) => (
          <Grid item xs={12} md={6} lg={4} key={organization.organizationId}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="h2" noWrap>
                    {organization.organizationName}
                  </Typography>
                  <Chip
                    label={statusLabels[organization.status]}
                    color={statusColors[organization.status]}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  コード: {organization.organizationCode}
                </Typography>

                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <BusinessIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {organizationTypeLabels[organization.organizationType]}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PeopleIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    最大患者数: {organization.maxPatientCapacity}
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  主任研究者: {organization.principalInvestigator}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  研究コーディネーター: {organization.studyCoordinator}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  所在地: {organization.address.prefecture} {organization.address.city}
                </Typography>

                {organization.availableEquipment.length > 0 && (
                  <Box mb={2}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <BuildIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        利用可能機器:
                      </Typography>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {organization.availableEquipment.slice(0, 3).map((equipment, index) => (
                        <Chip
                          key={index}
                          label={equipment}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {organization.availableEquipment.length > 3 && (
                        <Chip
                          label={`+${organization.availableEquipment.length - 3}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                )}

                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  参加中の試験: {organization.activeStudies.length}件
                </Typography>

                {/* Action Buttons */}
                <Box display="flex" justifyContent="flex-end" gap={1}>
                  <IconButton
                    size="small"
                    onClick={() => handleViewOrganization(organization)}
                    title="View Details"
                  >
                    <ViewIcon />
                  </IconButton>
                  {canEditOrganization(organization) && (
                    <IconButton
                      size="small"
                      onClick={() => handleEditOrganization(organization)}
                      title="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                  {(user?.role === 'super_admin' || user?.role === 'study_admin') && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setStatusDialog({
                        open: true,
                        organization,
                        newStatus: organization.status === 'pending_approval' ? 'active' : 
                                  organization.status === 'active' ? 'inactive' : 
                                  organization.status
                      })}
                    >
                      Change Status
                    </Button>
                  )}
                  {canDeleteOrganization(organization) && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteOrganization(organization)}
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

      {filteredOrganizations.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            {searchTerm || statusFilter ? 'No organizations match the criteria' : 'No organizations found'}
          </Typography>
        </Box>
      )}

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialog.open}
        onClose={() => setStatusDialog({ open: false, organization: null, newStatus: null })}
      >
        <DialogTitle>Change Status</DialogTitle>
        <DialogContent>
          <Typography>
            Do you want to change the status of "{statusDialog.organization?.organizationName}"?
          </Typography>
          <TextField
            select
            fullWidth
            margin="normal"
            label="New Status"
            value={statusDialog.newStatus || ''}
            onChange={(e) => setStatusDialog(prev => ({
              ...prev,
              newStatus: e.target.value as OrganizationRecord['status']
            }))}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="pending_approval">Pending Approval</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, organization: null, newStatus: null })}>
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
        onClose={() => !deleteDialog.loading && setDeleteDialog({ open: false, organization: null, loading: false })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the organization "{deleteDialog.organization?.organizationName}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This action cannot be undone. All associated data will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, organization: null, loading: false })}
            disabled={deleteDialog.loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteOrganization} 
            variant="contained" 
            color="error"
            disabled={deleteDialog.loading}
            startIcon={deleteDialog.loading ? <CircularProgress size={20} /> : null}
          >
            {deleteDialog.loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Organization Create Form */}
      <OrganizationCreateForm
        open={createFormOpen}
        onClose={() => setCreateFormOpen(false)}
        onSuccess={handleOrganizationCreated}
      />

      {/* Organization Edit Form */}
      <OrganizationEditForm
        open={editFormOpen}
        organization={selectedOrganization}
        onClose={() => {
          setEditFormOpen(false);
          setSelectedOrganization(null);
        }}
        onSuccess={handleOrganizationUpdated}
      />

      {/* Organization Detail Dialog */}
      <OrganizationDetailDialog
        open={detailDialogOpen}
        organization={selectedOrganization}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedOrganization(null);
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