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
  Card,
  CardContent,
  IconButton,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClinicalStudyRecord } from '@clinical-trial/shared';
import {
  clinicalStudyService,
  UpdateClinicalStudyRequest,
} from '../../services/ClinicalStudyService';

const visitTemplateSchema = z.object({
  visitNumber: z.number().min(1, 'Visit number must be at least 1'),
  visitType: z.enum(['baseline', '1week', '1month', '3month', 'custom']),
  visitName: z.string().min(1, 'Visit name is required'),
  scheduledDaysFromBaseline: z
    .number()
    .min(0, 'Days from baseline must be non-negative'),
  windowDaysBefore: z
    .number()
    .min(0, 'Window days before must be non-negative'),
  windowDaysAfter: z.number().min(0, 'Window days after must be non-negative'),
  requiredExaminations: z
    .array(z.string())
    .min(1, 'At least one examination is required'),
  optionalExaminations: z.array(z.string()),
  examinationOrder: z.array(z.string()),
  isRequired: z.boolean(),
});

const examinationConfigSchema = z.object({
  examinationId: z.string().min(1),
  examinationName: z.string().min(1).max(100),
  description: z.string().max(500),
  isRequired: z.boolean(),
  estimatedDuration: z.number().min(0),
});

const clinicalStudyEditSchema = z.object({
  studyName: z
    .string()
    .min(1, 'Study name is required')
    .max(200, 'Study name must be 200 characters or less'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(1000, 'Description must be 1000 characters or less'),
  startDate: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === '') return true;
        return !isNaN(Date.parse(val));
      },
      { message: 'Invalid date format' }
    ),
  endDate: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === '') return true;
        return !isNaN(Date.parse(val));
      },
      { message: 'Invalid date format' }
    ),
  targetOrganizations: z
    .array(z.string())
    .min(1, 'At least one target organization is required'),
  maxPatientsPerOrganization: z
    .number()
    .min(1, 'Max patients per organization must be at least 1')
    .optional(),
  totalTargetPatients: z
    .number()
    .min(1, 'Total target patients must be at least 1')
    .max(100000, 'Total target patients cannot exceed 100,000'),
  visitTemplate: z
    .array(visitTemplateSchema)
    .min(1, 'At least one visit is required'),
  examinations: z
    .array(examinationConfigSchema)
    .min(1, 'At least one examination is required'),
  status: z.enum([
    'planning',
    'active',
    'recruiting',
    'completed',
    'suspended',
    'terminated',
  ]),
  currentPhase: z.string().min(1, 'Current phase is required').max(50),
  protocolVersion: z.string().min(1, 'Protocol version is required').max(20),
  ethicsApprovalNumber: z.string().max(50).optional(),
  regulatoryApprovals: z.array(z.string()),
});

type ClinicalStudyEditFormData = z.infer<typeof clinicalStudyEditSchema>;

interface ClinicalStudyEditFormProps {
  open: boolean;
  study: ClinicalStudyRecord | null;
  onClose: () => void;
  onSuccess: (study: ClinicalStudyRecord) => void;
}

const visitTypes = [
  { value: 'baseline', label: 'Baseline' },
  { value: '1week', label: '1 Week' },
  { value: '1month', label: '1 Month' },
  { value: '3month', label: '3 Month' },
  { value: 'custom', label: 'Custom' },
];

const statusOptions = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'recruiting', label: 'Recruiting' },
  { value: 'completed', label: 'Completed' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'terminated', label: 'Terminated' },
];

const examinationTypes = [
  'Basic Information',
  'Visual Analog Scale (VAS)',
  'Comparative Assessment',
  'Lens Fitting & Tear Film',
  'Tear Film Layer Test',
  'Corrected Visual Acuity',
  'Lens Inspection',
  'Questionnaire',
];

export default function ClinicalStudyEditForm({
  open,
  study,
  onClose,
  onSuccess,
}: ClinicalStudyEditFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClinicalStudyEditFormData>({
    resolver: zodResolver(clinicalStudyEditSchema),
    defaultValues: {
      studyName: '',
      description: '',
      startDate: '',
      endDate: '',
      targetOrganizations: ['Organization 1'],
      maxPatientsPerOrganization: 10,
      totalTargetPatients: 100,
      visitTemplate: [
        {
          visitNumber: 1,
          visitType: 'baseline',
          visitName: 'Baseline Visit',
          scheduledDaysFromBaseline: 0,
          windowDaysBefore: 0,
          windowDaysAfter: 7,
          requiredExaminations: ['Basic Information'],
          optionalExaminations: [],
          examinationOrder: ['Basic Information'],
          isRequired: true,
        },
      ],
      examinations: [
        {
          examinationId: 'basic-info',
          examinationName: 'Basic Information',
          description: 'Basic patient information and assessment',
          isRequired: true,
          estimatedDuration: 30,
        },
      ],
      status: 'planning',
      currentPhase: 'Phase I',
      protocolVersion: '1.0',
      ethicsApprovalNumber: '',
      regulatoryApprovals: [],
    },
  });

  const {
    fields: examinationFields,
    append: appendExamination,
    remove: removeExamination,
  } = useFieldArray({
    control,
    name: 'examinations',
  });

  const {
    fields: regulatoryApprovalsFields,
    append: appendRegulatoryApproval,
    remove: removeRegulatoryApproval,
  } = useFieldArray({
    control,
    name: 'regulatoryApprovals',
  });

  const {
    fields: targetOrganizationFields,
    append: appendTargetOrganization,
    remove: removeTargetOrganization,
  } = useFieldArray({
    control,
    name: 'targetOrganizations',
  });

  const {
    fields: visitTemplateFields,
    append: appendVisitTemplate,
    remove: removeVisitTemplate,
  } = useFieldArray({
    control,
    name: 'visitTemplate',
  });

  // Helper function to format date for datetime-local input
  const formatDateForInput = (dateStr: string | undefined | null): string => {
    if (!dateStr) return '';

    try {
      // Handle various date formats
      let date: Date;

      // If it's already in ISO format or similar
      if (dateStr.includes('T') || dateStr.includes('-')) {
        date = new Date(dateStr);
      }
      // If it's in format like "2025/08/01 12:34"
      else if (dateStr.includes('/')) {
        const parts = dateStr.split(' ');
        const datePart = parts[0];
        const timePart = parts[1] || '00:00';
        const [year, month, day] = datePart.split('/');
        const [hour, minute] = timePart.split(':');
        date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute)
        );
      } else {
        date = new Date(dateStr);
      }

      if (isNaN(date.getTime())) {
        return '';
      }

      // Format as YYYY-MM-DDTHH:mm for datetime-local input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');

      return `${year}-${month}-${day}T${hour}:${minute}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  useEffect(() => {
    if (study && open) {
      // Ensure visitTemplate has proper defaults
      const processedVisitTemplate = (study.visitTemplate || []).map((visit, index) => ({
        visitNumber: visit.visitNumber || index + 1,
        visitType: visit.visitType || 'custom',
        visitName: visit.visitName || `Visit ${index + 1}`,
        scheduledDaysFromBaseline: Number(visit.scheduledDaysFromBaseline) || 0,
        windowDaysBefore: Number(visit.windowDaysBefore) || 0,
        windowDaysAfter: Number(visit.windowDaysAfter) || 0,
        requiredExaminations: visit.requiredExaminations || ['Basic Information'],
        optionalExaminations: visit.optionalExaminations || [],
        examinationOrder: visit.examinationOrder || ['Basic Information'],
        isRequired: visit.isRequired !== undefined ? visit.isRequired : true,
      }));

      // Ensure examinations has proper defaults
      const processedExaminations = (study.examinations || []).map((exam, index) => ({
        examinationId: exam.examinationId || `exam-${index}`,
        examinationName: exam.examinationName || 'Basic Information',
        description: exam.description || '',
        isRequired: exam.isRequired !== undefined ? exam.isRequired : true,
        estimatedDuration: Number(exam.estimatedDuration) || 30,
      }));

      reset({
        studyName: study.studyName || '',
        description: study.description || '',
        startDate: formatDateForInput(study.startDate),
        endDate: formatDateForInput(study.endDate),
        targetOrganizations: (study.targetOrganizations && study.targetOrganizations.length > 0) 
          ? study.targetOrganizations 
          : ['Organization 1'],
        maxPatientsPerOrganization: Number(study.maxPatientsPerOrganization) || 10,
        totalTargetPatients: Number(study.totalTargetPatients) || 100,
        visitTemplate: processedVisitTemplate.length > 0 ? processedVisitTemplate : [{
          visitNumber: 1,
          visitType: 'baseline',
          visitName: 'Baseline Visit',
          scheduledDaysFromBaseline: 0,
          windowDaysBefore: 0,
          windowDaysAfter: 7,
          requiredExaminations: ['Basic Information'],
          optionalExaminations: [],
          examinationOrder: ['Basic Information'],
          isRequired: true,
        }],
        examinations: processedExaminations.length > 0 ? processedExaminations : [{
          examinationId: 'basic-info',
          examinationName: 'Basic Information',
          description: 'Basic patient information and assessment',
          isRequired: true,
          estimatedDuration: 30,
        }],
        status: study.status || 'planning',
        currentPhase: study.currentPhase || 'Phase I',
        protocolVersion: study.protocolVersion || '1.0',
        ethicsApprovalNumber: study.ethicsApprovalNumber || '',
        regulatoryApprovals: study.regulatoryApprovals || [],
      });
    }
  }, [study, open, reset]);

  const handleExaminationToggle = (visitIndex: number, examination: string) => {
    const currentVisit = watch(`visitTemplate.${visitIndex}`);
    const currentExaminations = currentVisit.requiredExaminations || [];
    const updated = currentExaminations.includes(examination)
      ? currentExaminations.filter((e) => e !== examination)
      : [...currentExaminations, examination];
    setValue(`visitTemplate.${visitIndex}.requiredExaminations`, updated);
  };

  const addNewVisit = () => {
    const currentVisits = watch('visitTemplate');
    const nextVisitNumber =
      currentVisits.length > 0
        ? Math.max(...currentVisits.map((v) => v.visitNumber)) + 1
        : 1;
    appendVisitTemplate({
      visitNumber: nextVisitNumber,
      visitType: 'custom',
      visitName: `Visit ${nextVisitNumber}`,
      scheduledDaysFromBaseline: 30 * (nextVisitNumber - 1),
      windowDaysBefore: 7,
      windowDaysAfter: 7,
      requiredExaminations: ['Basic Information'],
      optionalExaminations: [],
      examinationOrder: ['Basic Information'],
      isRequired: true,
    });
  };

  const addNewExamination = () => {
    appendExamination({
      examinationId: `exam-${Date.now()}`,
      examinationName: '',
      description: '',
      isRequired: true,
      estimatedDuration: 30,
    });
  };

  // Helper function to convert datetime-local input to ISO string
  const formatDateForSubmit = (
    dateStr: string | undefined
  ): string | undefined => {
    if (!dateStr || dateStr === '') return undefined;

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return undefined;
      }
      return date.toISOString();
    } catch (error) {
      console.error('Error converting date for submit:', error);
      return undefined;
    }
  };

  const onSubmit = async (data: ClinicalStudyEditFormData) => {
    console.log('=== FORM SUBMIT DEBUG ===');
    console.log('Form data:', data);
    console.log('Form errors:', errors);
    console.log('Form isValid:', Object.keys(errors).length === 0);
    
    if (!study) {
      console.log('No study provided, returning');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const updateRequest: UpdateClinicalStudyRequest = {
        ...data,
        startDate: formatDateForSubmit(data.startDate),
        endDate: formatDateForSubmit(data.endDate),
        targetOrganizations: data.targetOrganizations.filter(
          (org) => org.trim() !== ''
        ),
        regulatoryApprovals:
          data.regulatoryApprovals?.filter(
            (approval) => approval.trim() !== ''
          ) || [],
      };

      console.log(
        'Updating clinical study:',
        study.clinicalStudyId,
        updateRequest
      );
      const response = await clinicalStudyService.updateClinicalStudy(
        study.clinicalStudyId,
        updateRequest
      );
      console.log('Update response:', response);
      onSuccess(response.study);
      handleClose();
    } catch (err) {
      console.error('Clinical study update error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to update clinical study'
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

  if (!study) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>Edit Clinical Study: {study.studyName}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit, (errors) => {
        console.log('=== FORM VALIDATION FAILED ===');
        console.log('Validation errors:', errors);
      })}>
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
                name="studyName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Study Name *"
                    fullWidth
                    error={!!errors.studyName}
                    helperText={errors.studyName?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Study Code"
                value={study.studyCode}
                fullWidth
                disabled
                helperText="Study code cannot be changed"
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description *"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Start Date"
                    type="datetime-local"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.startDate}
                    helperText={errors.startDate?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="End Date"
                    type="datetime-local"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.endDate}
                    helperText={errors.endDate?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="totalTargetPatients"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || 0}
                    label="Total Target Patients *"
                    type="number"
                    fullWidth
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                    error={!!errors.totalTargetPatients}
                    helperText={errors.totalTargetPatients?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="maxPatientsPerOrganization"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || 0}
                    label="Max Patients per Organization"
                    type="number"
                    fullWidth
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                    error={!!errors.maxPatientsPerOrganization}
                    helperText={errors.maxPatientsPerOrganization?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="currentPhase"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Current Phase *"
                    fullWidth
                    error={!!errors.currentPhase}
                    helperText={errors.currentPhase?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="protocolVersion"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Protocol Version *"
                    fullWidth
                    error={!!errors.protocolVersion}
                    helperText={errors.protocolVersion?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="ethicsApprovalNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Ethics Approval Number"
                    fullWidth
                    error={!!errors.ethicsApprovalNumber}
                    helperText={errors.ethicsApprovalNumber?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
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

            {/* Target Organizations */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Target Organizations
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle2">Target Organizations *</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => appendTargetOrganization('')}
                  size="small"
                >
                  Add Organization
                </Button>
              </Box>
              {targetOrganizationFields.map((field, index) => (
                <Box key={field.id} display="flex" alignItems="center" gap={1} mb={1}>
                  <Controller
                    name={`targetOrganizations.${index}`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={`Organization ${index + 1}`}
                        fullWidth
                        size="small"
                        error={!!errors.targetOrganizations?.[index]}
                        helperText={errors.targetOrganizations?.[index]?.message}
                      />
                    )}
                  />
                  <IconButton
                    onClick={() => removeTargetOrganization(index)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              {errors.targetOrganizations && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  At least one target organization is required
                </Typography>
              )}
            </Grid>

            {/* Examinations */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Examinations
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Typography variant="subtitle2">
                  Required Examinations
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addNewExamination}
                  size="small"
                >
                  Add Examination
                </Button>
              </Box>
              {examinationFields.map((field, index) => (
                <Card key={field.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={2}
                    >
                      <Typography variant="subtitle1">
                        Examination {index + 1}
                      </Typography>
                      <IconButton
                        onClick={() => removeExamination(index)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name={`examinations.${index}.examinationName`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Examination Name *"
                              fullWidth
                              size="small"
                              error={
                                !!errors.examinations?.[index]?.examinationName
                              }
                              helperText={
                                errors.examinations?.[index]?.examinationName
                                  ?.message
                              }
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name={`examinations.${index}.estimatedDuration`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Duration (minutes)"
                              type="number"
                              fullWidth
                              size="small"
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                field.onChange(isNaN(value) ? 0 : value);
                              }}
                              error={
                                !!errors.examinations?.[index]
                                  ?.estimatedDuration
                              }
                              helperText={
                                errors.examinations?.[index]?.estimatedDuration
                                  ?.message
                              }
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Controller
                          name={`examinations.${index}.description`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Description"
                              fullWidth
                              multiline
                              rows={2}
                              size="small"
                              error={
                                !!errors.examinations?.[index]?.description
                              }
                              helperText={
                                errors.examinations?.[index]?.description
                                  ?.message
                              }
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Grid>

            {/* Regulatory Approvals */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Regulatory Approvals
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Typography variant="subtitle2">
                  Regulatory Approvals
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => appendRegulatoryApproval('')}
                  size="small"
                >
                  Add Approval
                </Button>
              </Box>
              {regulatoryApprovalsFields.map((field, index) => (
                <Box
                  key={field.id}
                  display="flex"
                  alignItems="center"
                  gap={1}
                  mb={1}
                >
                  <Controller
                    name={`regulatoryApprovals.${index}`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={`Regulatory Approval ${index + 1}`}
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                  <IconButton
                    onClick={() => removeRegulatoryApproval(index)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Grid>

            {/* Visit Template */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Visit Template
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="subtitle2">Study Visits</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addNewVisit}
                  size="small"
                  variant="outlined"
                >
                  Add Visit
                </Button>
              </Box>

              {visitTemplateFields.map((field, index) => (
                <Card key={field.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={2}
                    >
                      <Typography variant="subtitle1">
                        Visit {index + 1}
                      </Typography>
                      {visitTemplateFields.length > 1 && (
                        <IconButton
                          onClick={() => removeVisitTemplate(index)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Controller
                          name={`visitTemplate.${index}.visitName`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Visit Name *"
                              fullWidth
                              size="small"
                              error={!!errors.visitTemplate?.[index]?.visitName}
                              helperText={
                                errors.visitTemplate?.[index]?.visitName
                                  ?.message
                              }
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <Controller
                          name={`visitTemplate.${index}.visitType`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              value={field.value || 'custom'}
                              select
                              label="Visit Type *"
                              fullWidth
                              size="small"
                              error={!!errors.visitTemplate?.[index]?.visitType}
                              helperText={
                                errors.visitTemplate?.[index]?.visitType
                                  ?.message
                              }
                            >
                              {visitTypes.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                  {type.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <Controller
                          name={`visitTemplate.${index}.scheduledDaysFromBaseline`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              value={field.value || 0}
                              label="Days from Baseline *"
                              type="number"
                              fullWidth
                              size="small"
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                field.onChange(isNaN(value) ? 0 : value);
                              }}
                              error={
                                !!errors.visitTemplate?.[index]
                                  ?.scheduledDaysFromBaseline
                              }
                              helperText={
                                errors.visitTemplate?.[index]
                                  ?.scheduledDaysFromBaseline?.message
                              }
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Controller
                          name={`visitTemplate.${index}.windowDaysBefore`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              value={field.value || 0}
                              label="Window Days Before"
                              type="number"
                              fullWidth
                              size="small"
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                field.onChange(isNaN(value) ? 0 : value);
                              }}
                              error={
                                !!errors.visitTemplate?.[index]
                                  ?.windowDaysBefore
                              }
                              helperText={
                                errors.visitTemplate?.[index]?.windowDaysBefore
                                  ?.message
                              }
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Controller
                          name={`visitTemplate.${index}.windowDaysAfter`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              value={field.value || 0}
                              label="Window Days After"
                              type="number"
                              fullWidth
                              size="small"
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                field.onChange(isNaN(value) ? 0 : value);
                              }}
                              error={
                                !!errors.visitTemplate?.[index]?.windowDaysAfter
                              }
                              helperText={
                                errors.visitTemplate?.[index]?.windowDaysAfter
                                  ?.message
                              }
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Required Examinations *
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {examinationTypes.map((examination) => {
                            const currentExaminations =
                              watch(
                                `visitTemplate.${index}.requiredExaminations`
                              ) || [];
                            const isSelected =
                              currentExaminations.includes(examination);
                            return (
                              <Chip
                                key={examination}
                                label={examination}
                                clickable
                                color={isSelected ? 'primary' : 'default'}
                                variant={isSelected ? 'filled' : 'outlined'}
                                onClick={() =>
                                  handleExaminationToggle(index, examination)
                                }
                                size="small"
                              />
                            );
                          })}
                        </Box>
                        {errors.visitTemplate?.[index]
                          ?.requiredExaminations && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ mt: 1, display: 'block' }}
                          >
                            {
                              errors.visitTemplate[index]?.requiredExaminations
                                ?.message
                            }
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
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
            onClick={() => {
              console.log('UPDATE STUDY button clicked');
              console.log('Current form errors:', errors);
              console.log('Form valid:', Object.keys(errors).length === 0);
            }}
          >
            {loading ? 'Updating...' : 'Update Study'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
