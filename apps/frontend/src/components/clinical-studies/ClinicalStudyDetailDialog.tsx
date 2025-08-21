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
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Science as ScienceIcon,
  Assignment as AssignmentIcon,
  Groups as GroupsIcon,
  Schedule as ScheduleIcon,
  LocalHospital as ExaminationIcon,
  Business as OrganizationIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { ClinicalStudyRecord } from '@clinical-trial/shared';

interface ClinicalStudyDetailDialogProps {
  open: boolean;
  study: ClinicalStudyRecord | null;
  onClose: () => void;
  onEdit?: (study: ClinicalStudyRecord) => void;
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

const typeLabels: Record<ClinicalStudyRecord['studyType'], string> = {
  interventional: 'Interventional',
  observational: 'Observational',
  registry: 'Registry',
};

const phaseLabels: Record<ClinicalStudyRecord['phase'], string> = {
  phase_1: 'Phase I',
  phase_2: 'Phase II',
  phase_3: 'Phase III',
  phase_4: 'Phase IV',
  not_applicable: 'Not Applicable',
};

export default function ClinicalStudyDetailDialog({
  open,
  study,
  onClose,
  onEdit,
}: ClinicalStudyDetailDialogProps) {
  if (!study) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(study);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <ScienceIcon />
            <Typography variant="h6">{study.studyName}</Typography>
          </Box>
          <Chip
            label={statusLabels[study.status]}
            color={statusColors[study.status]}
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
                      Study Name
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {study.studyName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Study Code
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {study.studyCode}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {study.description}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Study Type
                    </Typography>
                    <Typography variant="body1">
                      {typeLabels[study.studyType]}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Phase
                    </Typography>
                    <Typography variant="body1">
                      {phaseLabels[study.phase]}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={statusLabels[study.status]}
                      color={statusColors[study.status]}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Planned Enrollment
                    </Typography>
                    <Typography variant="body1">
                      {study.plannedEnrollment?.toLocaleString() || 'N/A'} participants
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Estimated Duration
                    </Typography>
                    <Typography variant="body1">
                      {study.estimatedDuration || 'N/A'} months
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Created Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(study.createdAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body1">
                      {new Date(study.updatedAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Objectives */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Study Objectives
                </Typography>
                
                <Box mb={2}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <AssignmentIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle2">Primary Objective</Typography>
                  </Box>
                  <Typography variant="body1">
                    {study.primaryObjective}
                  </Typography>
                </Box>

                {study.secondaryObjectives && study.secondaryObjectives.length > 0 && (
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <AssignmentIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2">Secondary Objectives</Typography>
                    </Box>
                    <List dense>
                      {study.secondaryObjectives.map((objective, index) => (
                        <ListItem key={index} sx={{ pl: 0 }}>
                          <ListItemText
                            primary={`${index + 1}. ${objective}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Eligibility Criteria */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Inclusion Criteria
                </Typography>
                {study.inclusionCriteria && study.inclusionCriteria.length > 0 ? (
                  <List dense>
                    {study.inclusionCriteria.map((criteria, index) => (
                      <ListItem key={index} sx={{ pl: 0 }}>
                        <ListItemText
                          primary={`${index + 1}. ${criteria}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No inclusion criteria specified
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Exclusion Criteria
                </Typography>
                {study.exclusionCriteria && study.exclusionCriteria.length > 0 ? (
                  <List dense>
                    {study.exclusionCriteria.map((criteria, index) => (
                      <ListItem key={index} sx={{ pl: 0 }}>
                        <ListItemText
                          primary={`${index + 1}. ${criteria}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No exclusion criteria specified
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Target Organizations */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <OrganizationIcon fontSize="small" color="action" />
                  <Typography variant="h6">Target Organizations</Typography>
                </Box>
                {study.targetOrganizations && study.targetOrganizations.length > 0 ? (
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {study.targetOrganizations.map((orgId, index) => (
                      <Chip
                        key={index}
                        label={orgId}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No target organizations specified
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Visit Template */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <TimelineIcon fontSize="small" color="action" />
                  <Typography variant="h6">Visit Template</Typography>
                </Box>
                {study.visitTemplate && study.visitTemplate.length > 0 ? (
                  <Grid container spacing={2}>
                    {study.visitTemplate.map((visit, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {visit.visitName}
                              </Typography>
                              <Chip
                                label={`Visit ${visit.visitNumber}`}
                                size="small"
                                color="primary"
                              />
                            </Box>
                            
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <ScheduleIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                Day {visit.scheduledDaysFromBaseline}
                                {(visit.windowDaysBefore > 0 || visit.windowDaysAfter > 0) && (
                                  <span>
                                    {' '}(±{Math.max(visit.windowDaysBefore, visit.windowDaysAfter)} days)
                                  </span>
                                )}
                              </Typography>
                            </Box>

                            <Box>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <ExaminationIcon fontSize="small" color="action" />
                                <Typography variant="body2" fontWeight="medium">
                                  Required Examinations:
                                </Typography>
                              </Box>
                              <Box display="flex" flexWrap="wrap" gap={0.5}>
                                {visit.requiredExaminations.map((exam, examIndex) => (
                                  <Chip
                                    key={examIndex}
                                    label={exam}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No visit template defined
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Enrollment Statistics */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <GroupsIcon fontSize="small" color="action" />
                  <Typography variant="h6">Enrollment Statistics</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Planned Enrollment
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {study.plannedEnrollment?.toLocaleString() || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Current Enrollment
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {study.currentEnrollment?.toLocaleString() || '0'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Enrollment Progress
                    </Typography>
                    <Typography variant="h6" color="info.main">
                      {study.currentEnrollment && study.plannedEnrollment
                        ? `${Math.round((study.currentEnrollment / study.plannedEnrollment) * 100)}%`
                        : '0%'}
                    </Typography>
                  </Grid>
                </Grid>
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
                      {new Date(study.createdAt).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body1">
                      {new Date(study.updatedAt).toLocaleString()}
                    </Typography>
                  </Grid>
                  {study.createdBy && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Created By
                      </Typography>
                      <Typography variant="body1">
                        {study.createdBy}
                      </Typography>
                    </Grid>
                  )}
                  {study.lastModifiedBy && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Last Modified By
                      </Typography>
                      <Typography variant="body1">
                        {study.lastModifiedBy}
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