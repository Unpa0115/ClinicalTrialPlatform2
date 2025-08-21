import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { OrganizationRecord } from '@clinical-trial/shared';
import { organizationService, UpdateOrganizationRequest } from '../../services/OrganizationService';

const organizationEditSchema = z.object({
  organizationName: z.string().min(1, 'Organization name is required').max(200, 'Organization name must be 200 characters or less'),
  organizationType: z.enum(['hospital', 'clinic', 'research_center', 'university', 'other']),
  address: z.object({
    country: z.string().min(1, 'Country is required'),
    prefecture: z.string().min(1, 'Prefecture is required'),
    city: z.string().min(1, 'City is required'),
    addressLine1: z.string().min(1, 'Address line 1 is required'),
    addressLine2: z.string().optional(),
    postalCode: z.string().min(1, 'Postal code is required'),
  }),
  phoneNumber: z.string().min(1, 'Phone number is required').max(50, 'Phone number must be 50 characters or less'),
  email: z.string().email('Please enter a valid email address').max(100, 'Email must be 100 characters or less'),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  principalInvestigator: z.string().min(1, 'Principal investigator name is required').max(100, 'Name must be 100 characters or less'),
  studyCoordinator: z.string().min(1, 'Study coordinator is required').max(100, 'Name must be 100 characters or less'),
  contactPerson: z.string().min(1, 'Contact person is required').max(100, 'Name must be 100 characters or less'),
  maxPatientCapacity: z.number().min(1, 'Maximum patients must be at least 1').max(10000, 'Maximum patients cannot exceed 10,000'),
  availableEquipment: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'pending_approval', 'suspended']),
});

type OrganizationEditFormData = z.infer<typeof organizationEditSchema>;

interface OrganizationEditFormProps {
  open: boolean;
  organization: OrganizationRecord | null;
  onClose: () => void;
  onSuccess: (organization: OrganizationRecord) => void;
}

const organizationTypes = [
  { value: 'hospital', label: 'Hospital' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'research_center', label: 'Research Center' },
  { value: 'university', label: 'University' },
  { value: 'other', label: 'Other' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'suspended', label: 'Suspended' },
];


export default function OrganizationEditForm({
  open,
  organization,
  onClose,
  onSuccess,
}: OrganizationEditFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrganizationEditFormData>({
    resolver: zodResolver(organizationEditSchema),
  });


  useEffect(() => {
    if (organization && open) {
      reset({
        organizationName: organization.organizationName,
        organizationType: organization.organizationType,
        address: typeof organization.address === 'object' ? organization.address : {
          country: '',
          prefecture: '',
          city: '',
          addressLine1: organization.address || '',
          addressLine2: '',
          postalCode: '',
        },
        phoneNumber: organization.phoneNumber || '',
        email: organization.email || '',
        website: organization.website || '',
        principalInvestigator: organization.principalInvestigator || '',
        studyCoordinator: organization.studyCoordinator || '',
        contactPerson: organization.contactPerson || '',
        maxPatientCapacity: organization.maxPatientCapacity || 1,
        availableEquipment: organization.availableEquipment || [],
        certifications: organization.certifications || [],
        status: organization.status,
      });
    }
  }, [organization, open, reset]);


  const onSubmit = async (data: OrganizationEditFormData) => {
    if (!organization) return;

    try {
      setLoading(true);
      setError(null);

      const updateRequest: UpdateOrganizationRequest = {
        ...data,
        website: data.website || undefined,
        availableEquipment: data.availableEquipment || [],
        certifications: data.certifications?.filter(cert => cert.trim() !== '') || [],
      };

      const response = await organizationService.updateOrganization(organization.organizationId, updateRequest);
      onSuccess(response.organization);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update organization');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  if (!organization) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Organization: {organization.organizationName}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="organizationName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Organization Name *"
                    fullWidth
                    error={!!errors.organizationName}
                    helperText={errors.organizationName?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <Controller
                name="organizationType"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Organization Type *"
                    fullWidth
                    error={!!errors.organizationType}
                    helperText={errors.organizationType?.message}
                  >
                    {organizationTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Status *"
                    fullWidth
                    error={!!errors.status}
                    helperText={errors.status?.message}
                  >
                    {statusOptions.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Address
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="address.country"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Country *"
                    fullWidth
                    error={!!errors.address?.country}
                    helperText={errors.address?.country?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="address.prefecture"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Prefecture *"
                    fullWidth
                    error={!!errors.address?.prefecture}
                    helperText={errors.address?.prefecture?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="address.city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="City *"
                    fullWidth
                    error={!!errors.address?.city}
                    helperText={errors.address?.city?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="address.postalCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Postal Code *"
                    fullWidth
                    error={!!errors.address?.postalCode}
                    helperText={errors.address?.postalCode?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="address.addressLine1"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Address Line 1 *"
                    fullWidth
                    error={!!errors.address?.addressLine1}
                    helperText={errors.address?.addressLine1?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="address.addressLine2"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Address Line 2"
                    fullWidth
                    error={!!errors.address?.addressLine2}
                    helperText={errors.address?.addressLine2?.message}
                  />
                )}
              />
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Contact Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone Number *"
                    fullWidth
                    error={!!errors.phoneNumber}
                    helperText={errors.phoneNumber?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email Address *"
                    type="email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="website"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Website"
                    fullWidth
                    error={!!errors.website}
                    helperText={errors.website?.message}
                  />
                )}
              />
            </Grid>

            {/* Staff Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Staff Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="principalInvestigator"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Principal Investigator *"
                    fullWidth
                    error={!!errors.principalInvestigator}
                    helperText={errors.principalInvestigator?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="studyCoordinator"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Study Coordinator *"
                    fullWidth
                    error={!!errors.studyCoordinator}
                    helperText={errors.studyCoordinator?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="contactPerson"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Contact Person *"
                    fullWidth
                    error={!!errors.contactPerson}
                    helperText={errors.contactPerson?.message}
                  />
                )}
              />
            </Grid>

            {/* Capabilities */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Capabilities
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="maxPatientCapacity"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Maximum Patient Capacity *"
                    type="number"
                    fullWidth
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    error={!!errors.maxPatientCapacity}
                    helperText={errors.maxPatientCapacity?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Updating...' : 'Update Organization'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}