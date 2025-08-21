import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as WebsiteIcon,
  Person as PersonIcon,
  Groups as PatientsIcon,
  LocalHospital as SpecializationIcon,
  Verified as CertificationIcon,
} from '@mui/icons-material';
import { OrganizationRecord } from '@clinical-trial/shared';

interface OrganizationDetailDialogProps {
  open: boolean;
  organization: OrganizationRecord | null;
  onClose: () => void;
  onEdit?: (organization: OrganizationRecord) => void;
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

const typeLabels: Record<OrganizationRecord['organizationType'], string> = {
  hospital: 'Hospital',
  clinic: 'Clinic',
  research_center: 'Research Center',
  university: 'University',
  other: 'Other',
};

export default function OrganizationDetailDialog({
  open,
  organization,
  onClose,
  onEdit,
}: OrganizationDetailDialogProps) {
  if (!organization) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(organization);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <BusinessIcon />
            <Typography variant="h6">{organization.organizationName}</Typography>
          </Box>
          <Chip
            label={statusLabels[organization.status]}
            color={statusColors[organization.status]}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Organization Name
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {organization.organizationName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Type
                    </Typography>
                    <Typography variant="body1">
                      {typeLabels[organization.organizationType]}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Address
                    </Typography>
                    <Typography variant="body1">
                      {typeof organization.address === 'object' 
                        ? `${organization.address.addressLine1}${organization.address.addressLine2 ? ', ' + organization.address.addressLine2 : ''}, ${organization.address.city}, ${organization.address.prefecture} ${organization.address.postalCode}, ${organization.address.country}`
                        : organization.address || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Created Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(organization.createdAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={statusLabels[organization.status]}
                      color={statusColors[organization.status]}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contact Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Phone Number
                        </Typography>
                        <Typography variant="body1">
                          {organization.phoneNumber || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <EmailIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Email Address
                        </Typography>
                        <Typography variant="body1">
                          {organization.email || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  {organization.website && (
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <WebsiteIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Website
                          </Typography>
                          <Typography variant="body1">
                            <a href={organization.website} target="_blank" rel="noopener noreferrer">
                              {organization.website}
                            </a>
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Principal Investigator */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Principal Investigator
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Name
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {organization.principalInvestigator || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Study Coordinator
                    </Typography>
                    <Typography variant="body1">
                      {organization.studyCoordinator || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Contact Person
                    </Typography>
                    <Typography variant="body1">
                      {organization.contactPerson || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Capabilities */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Capabilities
                </Typography>
                
                <Box mb={2}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <PatientsIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2">Maximum Patient Capacity</Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="bold">
                    {organization.maxPatientCapacity?.toLocaleString() || 'N/A'}
                  </Typography>
                </Box>

                {organization.availableEquipment && organization.availableEquipment.length > 0 && (
                  <Box mb={2}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <SpecializationIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2">Available Equipment</Typography>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {organization.availableEquipment.map((equipment, index) => (
                        <Chip
                          key={index}
                          label={equipment}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {organization.certifications && organization.certifications.length > 0 && (
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <CertificationIcon fontSize="small" color="success" />
                      <Typography variant="subtitle2">Certifications</Typography>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {organization.certifications.map((certification, index) => (
                        <Chip
                          key={index}
                          label={certification}
                          size="small"
                          variant="outlined"
                          color="success"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Associated Studies */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Associated Studies
                </Typography>
                {organization.activeStudies && organization.activeStudies.length > 0 ? (
                  <Typography variant="body1">
                    {organization.activeStudies.length} studies associated
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No studies associated yet
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Creation/Update Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Creation & Update Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Created At
                    </Typography>
                    <Typography variant="body1">
                      {new Date(organization.createdAt).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body1">
                      {new Date(organization.updatedAt).toLocaleString()}
                    </Typography>
                  </Grid>
                  {organization.createdBy && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Created By
                      </Typography>
                      <Typography variant="body1">
                        {organization.createdBy}
                      </Typography>
                    </Grid>
                  )}
                  {organization.lastModifiedBy && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Last Modified By
                      </Typography>
                      <Typography variant="body1">
                        {organization.lastModifiedBy}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {onEdit && (
          <Button variant="contained" onClick={handleEdit}>
            Edit
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}