import React, { useState } from 'react';
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
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { IconButton, Chip } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { OrganizationRecord } from '@clinical-trial/shared';
import {
  organizationService,
  CreateOrganizationRequest,
} from '../../services/OrganizationService';

const addressSchema = z.object({
  country: z.string().min(1, 'Country is required').max(100),
  prefecture: z.string().min(1, 'Prefecture is required').max(100),
  city: z.string().min(1, 'City is required').max(100),
  addressLine1: z.string().min(1, 'Address line 1 is required').max(200),
  addressLine2: z.string().max(200).optional(),
  postalCode: z.string().min(1, 'Postal code is required').max(20),
});

const organizationSchema = z.object({
  organizationName: z.string().min(1, 'Organization name is required').max(200),
  organizationCode: z.string().min(1, 'Organization code is required').max(50),
  organizationType: z.enum([
    'hospital',
    'clinic',
    'research_center',
    'university',
    'other',
  ]),
  address: addressSchema,
  phoneNumber: z.string()
    .min(1, 'Phone number is required')
    .regex(/^\d{10,}$/, 'Phone number must contain at least 10 digits')
    .max(50),
  email: z.string().email('Please enter a valid email address'),
  website: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  principalInvestigator: z
    .string()
    .min(1, 'Principal investigator name is required')
    .max(100),
  studyCoordinator: z.string().min(1, 'Study coordinator is required').max(100),
  contactPerson: z.string().min(1, 'Contact person is required').max(100),
  maxPatientCapacity: z
    .number()
    .int()
    .min(1, 'Maximum patients must be at least 1'),
  availableEquipment: z.array(z.string()),
  certifications: z.array(z.string()),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

interface OrganizationCreateFormProps {
  open: boolean;
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

const equipmentOptions = [
  'Slit Lamp',
  'Fundus Camera',
  'OCT Scanner',
  'Visual Field Analyzer',
  'Tonometer',
  'Pachymeter',
  'Autorefractor',
  'Contact Lens Fitting Set',
  'Tear Film Analyzer',
  'Other Equipment',
];

export default function OrganizationCreateForm({
  open,
  onClose,
  onSuccess,
}: OrganizationCreateFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      organizationName: '',
      organizationCode: '',
      organizationType: 'hospital',
      address: {
        country: 'Japan',
        prefecture: '',
        city: '',
        addressLine1: '',
        addressLine2: '',
        postalCode: '',
      },
      phoneNumber: '',
      email: '',
      website: '',
      principalInvestigator: '',
      studyCoordinator: '',
      contactPerson: '',
      maxPatientCapacity: 100,
      availableEquipment: [],
      certifications: [],
    },
  });

  const {
    fields: equipmentFields,
    append: appendEquipment,
    remove: removeEquipment,
  } = useFieldArray({
    control,
    name: 'availableEquipment',
  });

  const {
    fields: certificationFields,
    append: appendCertification,
    remove: removeCertification,
  } = useFieldArray({
    control,
    name: 'certifications',
  });

  const selectedEquipment = watch('availableEquipment') || [];

  const handleEquipmentToggle = (equipment: string) => {
    const current = selectedEquipment;
    const updated = current.includes(equipment)
      ? current.filter((e) => e !== equipment)
      : [...current, equipment];
    setValue('availableEquipment', updated);
  };

  const onSubmit = async (data: OrganizationFormData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('=== ORGANIZATION CREATE DEBUG ===');
      console.log('Form data:', data);

      const createRequest: CreateOrganizationRequest = {
        organizationName: data.organizationName,
        organizationCode: data.organizationCode,
        organizationType: data.organizationType,
        address: {
          country: data.address.country,
          prefecture: data.address.prefecture,
          city: data.address.city,
          addressLine1: data.address.addressLine1,
          addressLine2: data.address.addressLine2 || undefined,
          postalCode: data.address.postalCode,
        },
        phoneNumber: data.phoneNumber,
        email: data.email,
        website: data.website || undefined,
        principalInvestigator: data.principalInvestigator,
        studyCoordinator: data.studyCoordinator,
        contactPerson: data.contactPerson,
        maxPatientCapacity: data.maxPatientCapacity,
        availableEquipment: data.availableEquipment.filter(
          (eq) => eq.trim() !== ''
        ),
        certifications: data.certifications.filter(
          (cert) => cert.trim() !== ''
        ),
      };

      console.log('Create request:', createRequest);
      const response =
        await organizationService.createOrganization(createRequest);
      console.log('Create response:', response);
      onSuccess(response.organization);
      handleClose();
    } catch (err) {
      console.error('Organization create error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to create organization'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Organization</DialogTitle>
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

            <Grid item xs={12} sm={6}>
              <Controller
                name="organizationCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Organization Code *"
                    fullWidth
                    error={!!errors.organizationCode}
                    helperText={errors.organizationCode?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
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
                    placeholder="e.g., 0312345678"
                    fullWidth
                    error={!!errors.phoneNumber}
                    helperText={errors.phoneNumber?.message || "Must be at least 10 digits"}
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
                Capabilities & Equipment
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="maxPatientCapacity"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || 0}
                    label="Maximum Patient Capacity *"
                    type="number"
                    fullWidth
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                    error={!!errors.maxPatientCapacity}
                    helperText={errors.maxPatientCapacity?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Available Equipment
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {equipmentOptions.map((equipment) => (
                  <Chip
                    key={equipment}
                    label={equipment}
                    clickable
                    color={
                      selectedEquipment.includes(equipment)
                        ? 'primary'
                        : 'default'
                    }
                    variant={
                      selectedEquipment.includes(equipment)
                        ? 'filled'
                        : 'outlined'
                    }
                    onClick={() => handleEquipmentToggle(equipment)}
                    size="small"
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Typography variant="subtitle2">Certifications</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => appendCertification('')}
                  size="small"
                >
                  Add Certification
                </Button>
              </Box>
              {certificationFields.map((field, index) => (
                <Box
                  key={field.id}
                  display="flex"
                  alignItems="center"
                  gap={1}
                  mb={1}
                >
                  <Controller
                    name={`certifications.${index}`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={`Certification ${index + 1}`}
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                  <IconButton
                    onClick={() => removeCertification(index)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
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
            {loading ? 'Creating...' : 'Create Organization'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
