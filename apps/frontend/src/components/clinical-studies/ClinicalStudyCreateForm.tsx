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
  Card,
  CardContent,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClinicalStudyRecord } from '@clinical-trial/shared';
import { clinicalStudyService, CreateClinicalStudyRequest } from '../../services/ClinicalStudyService';

const visitTemplateSchema = z.object({
  visitNumber: z.number().min(1, 'Visit number must be at least 1'),
  visitName: z.string().min(1, 'Visit name is required'),
  scheduledDaysFromBaseline: z.number().min(0, 'Days from baseline must be non-negative'),
  windowDaysBefore: z.number().min(0, 'Window days before must be non-negative'),
  windowDaysAfter: z.number().min(0, 'Window days after must be non-negative'),
  requiredExaminations: z.array(z.string()).min(1, 'At least one examination is required'),
  isRequired: z.boolean(),
});

const clinicalStudySchema = z.object({
  studyName: z.string().min(1, 'Study name is required').max(200, 'Study name must be 200 characters or less'),
  studyCode: z.string().min(1, 'Study code is required').max(50, 'Study code must be 50 characters or less'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description must be 2000 characters or less'),
  studyType: z.enum(['interventional', 'observational', 'registry']),
  phase: z.enum(['phase_1', 'phase_2', 'phase_3', 'phase_4', 'not_applicable']),
  primaryObjective: z.string().min(1, 'Primary objective is required').max(1000, 'Primary objective must be 1000 characters or less'),
  secondaryObjectives: z.array(z.string()).optional(),
  inclusionCriteria: z.array(z.string()).min(1, 'At least one inclusion criterion is required'),
  exclusionCriteria: z.array(z.string()).min(1, 'At least one exclusion criterion is required'),
  targetOrganizations: z.array(z.string()).min(1, 'At least one target organization is required'),
  plannedEnrollment: z.number().min(1, 'Planned enrollment must be at least 1').max(100000, 'Planned enrollment cannot exceed 100,000'),
  estimatedDuration: z.number().min(1, 'Estimated duration must be at least 1 month').max(120, 'Estimated duration cannot exceed 120 months'),
  visitTemplate: z.array(visitTemplateSchema).min(1, 'At least one visit is required'),
});

type ClinicalStudyFormData = z.infer<typeof clinicalStudySchema>;

interface ClinicalStudyCreateFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (study: ClinicalStudyRecord) => void;
}

const studyTypes = [
  { value: 'interventional', label: 'Interventional' },
  { value: 'observational', label: 'Observational' },
  { value: 'registry', label: 'Registry' },
];

const phases = [
  { value: 'phase_1', label: 'Phase I' },
  { value: 'phase_2', label: 'Phase II' },
  { value: 'phase_3', label: 'Phase III' },
  { value: 'phase_4', label: 'Phase IV' },
  { value: 'not_applicable', label: 'Not Applicable' },
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

export default function ClinicalStudyCreateForm({
  open,
  onClose,
  onSuccess,
}: ClinicalStudyCreateFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClinicalStudyFormData>({
    resolver: zodResolver(clinicalStudySchema),
    defaultValues: {
      studyName: '',
      studyCode: '',
      description: '',
      studyType: 'interventional',
      phase: 'not_applicable',
      primaryObjective: '',
      secondaryObjectives: [],
      inclusionCriteria: [],
      exclusionCriteria: [],
      targetOrganizations: [],
      plannedEnrollment: 100,
      estimatedDuration: 12,
      visitTemplate: [
        {
          visitNumber: 1,
          visitName: 'Baseline Visit',
          scheduledDaysFromBaseline: 0,
          windowDaysBefore: 0,
          windowDaysAfter: 3,
          requiredExaminations: ['Basic Information'],
          isRequired: true,
        },
        {
          visitNumber: 2,
          visitName: 'Follow-up Visit',
          scheduledDaysFromBaseline: 30,
          windowDaysBefore: 7,
          windowDaysAfter: 7,
          requiredExaminations: ['Visual Analog Scale (VAS)'],
          isRequired: true,
        },
      ],
    },
  });

  const {
    fields: secondaryObjectiveFields,
    append: appendSecondaryObjective,
    remove: removeSecondaryObjective,
  } = useFieldArray({
    control,
    name: 'secondaryObjectives',
  });

  const {
    fields: inclusionCriteriaFields,
    append: appendInclusionCriteria,
    remove: removeInclusionCriteria,
  } = useFieldArray({
    control,
    name: 'inclusionCriteria',
  });

  const {
    fields: exclusionCriteriaFields,
    append: appendExclusionCriteria,
    remove: removeExclusionCriteria,
  } = useFieldArray({
    control,
    name: 'exclusionCriteria',
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

  const handleExaminationToggle = (visitIndex: number, examination: string) => {
    const currentVisit = watch(`visitTemplate.${visitIndex}`);
    const currentExaminations = currentVisit.requiredExaminations || [];
    const updated = currentExaminations.includes(examination)
      ? currentExaminations.filter(e => e !== examination)
      : [...currentExaminations, examination];
    setValue(`visitTemplate.${visitIndex}.requiredExaminations`, updated);
  };

  const addNewVisit = () => {
    const currentVisits = watch('visitTemplate');
    const nextVisitNumber = Math.max(...currentVisits.map(v => v.visitNumber)) + 1;
    appendVisitTemplate({
      visitNumber: nextVisitNumber,
      visitName: `Visit ${nextVisitNumber}`,
      scheduledDaysFromBaseline: 30 * (nextVisitNumber - 1),
      windowDaysBefore: 7,
      windowDaysAfter: 7,
      requiredExaminations: ['Basic Information'],
      isRequired: true,
    });
  };

  const onSubmit = async (data: ClinicalStudyFormData) => {
    try {
      setLoading(true);
      setError(null);

      const createRequest: CreateClinicalStudyRequest = {
        ...data,
        secondaryObjectives: data.secondaryObjectives?.filter(obj => obj.trim() !== '') || [],
        inclusionCriteria: data.inclusionCriteria.filter(criteria => criteria.trim() !== ''),
        exclusionCriteria: data.exclusionCriteria.filter(criteria => criteria.trim() !== ''),
        targetOrganizations: data.targetOrganizations.filter(org => org.trim() !== ''),
      };

      const response = await clinicalStudyService.createClinicalStudy(createRequest);
      onSuccess(response.study);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create clinical study');
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
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>Create New Clinical Study</DialogTitle>
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

            <Grid item xs={12} sm={8}>
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

            <Grid item xs={12} sm={4}>
              <Controller
                name="studyCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Study Code *"
                    fullWidth
                    error={!!errors.studyCode}
                    helperText={errors.studyCode?.message}
                  />
                )}
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

            <Grid item xs={12} sm={4}>
              <Controller
                name="studyType"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Study Type *"
                    fullWidth
                    error={!!errors.studyType}
                    helperText={errors.studyType?.message}
                  >
                    {studyTypes.map((type) => (
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
                name="phase"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Phase *"
                    fullWidth
                    error={!!errors.phase}
                    helperText={errors.phase?.message}
                  >
                    {phases.map((phase) => (
                      <MenuItem key={phase.value} value={phase.value}>
                        {phase.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="plannedEnrollment"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Planned Enrollment *"
                    type="number"
                    fullWidth
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    error={!!errors.plannedEnrollment}
                    helperText={errors.plannedEnrollment?.message}
                  />
                )}
              />
            </Grid>

            {/* Objectives */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Objectives
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="primaryObjective"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Primary Objective *"
                    fullWidth
                    multiline
                    rows={2}
                    error={!!errors.primaryObjective}
                    helperText={errors.primaryObjective?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle2">Secondary Objectives</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => appendSecondaryObjective('')}
                  size="small"
                >
                  Add
                </Button>
              </Box>
              {secondaryObjectiveFields.map((field, index) => (
                <Box key={field.id} display="flex" alignItems="center" gap={1} mb={1}>
                  <Controller
                    name={`secondaryObjectives.${index}`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={`Secondary Objective ${index + 1}`}
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                  <IconButton
                    onClick={() => removeSecondaryObjective(index)}
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
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle1">Visit {index + 1}</Typography>
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
                      <Grid item xs={12} sm={6}>
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
                              helperText={errors.visitTemplate?.[index]?.visitName?.message}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Controller
                          name={`visitTemplate.${index}.scheduledDaysFromBaseline`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Days from Baseline *"
                              type="number"
                              fullWidth
                              size="small"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              error={!!errors.visitTemplate?.[index]?.scheduledDaysFromBaseline}
                              helperText={errors.visitTemplate?.[index]?.scheduledDaysFromBaseline?.message}
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
                              label="Window Days Before"
                              type="number"
                              fullWidth
                              size="small"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              error={!!errors.visitTemplate?.[index]?.windowDaysBefore}
                              helperText={errors.visitTemplate?.[index]?.windowDaysBefore?.message}
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
                              label="Window Days After"
                              type="number"
                              fullWidth
                              size="small"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              error={!!errors.visitTemplate?.[index]?.windowDaysAfter}
                              helperText={errors.visitTemplate?.[index]?.windowDaysAfter?.message}
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
                            const currentExaminations = watch(`visitTemplate.${index}.requiredExaminations`) || [];
                            const isSelected = currentExaminations.includes(examination);
                            return (
                              <Chip
                                key={examination}
                                label={examination}
                                clickable
                                color={isSelected ? 'primary' : 'default'}
                                variant={isSelected ? 'filled' : 'outlined'}
                                onClick={() => handleExaminationToggle(index, examination)}
                                size="small"
                              />
                            );
                          })}
                        </Box>
                        {errors.visitTemplate?.[index]?.requiredExaminations && (
                          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                            {errors.visitTemplate[index]?.requiredExaminations?.message}
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
          >
            {loading ? 'Creating...' : 'Create Study'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}