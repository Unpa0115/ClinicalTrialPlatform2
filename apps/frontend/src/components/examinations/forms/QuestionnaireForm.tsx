import React, { useEffect } from 'react';
import {
  Grid,
  TextField,
  Typography,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
} from '@mui/material';
import { 
  Visibility as EyeIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as TimeIcon,
  Psychology as ComfortIcon,
  Opacity as DrynessIcon,
  Warning as SymptomIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { questionnaireSchema, QuestionnaireFormData } from '../validation/examinationSchemas';
import { useExaminationForm } from '../contexts/ExaminationFormContext';

interface QuestionnaireFormProps {
  examinationId: string;
}

// Timing options
const TIMING_OPTIONS = [
  '装用開始時',
  '装用1時間後',
  '装用2時間後',
  '装用4時間後',
  '装用8時間後',
  '装用終了時',
  '装用後（翌日）',
];

// Assessment options for symptoms
const SYMPTOM_ASSESSMENT_OPTIONS = [
  'なし',
  '軽度',
  '中等度',
  '重度',
  '非常に重度',
];

// Assessment options for ease/performance
const PERFORMANCE_ASSESSMENT_OPTIONS = [
  '非常に良い',
  '良い',
  '普通',
  '悪い',
  '非常に悪い',
];

// Assessment options for satisfaction
const SATISFACTION_OPTIONS = [
  '非常に満足',
  '満足',
  '普通',
  '不満',
  '非常に不満',
];

export const QuestionnaireForm: React.FC<QuestionnaireFormProps> = ({ examinationId }) => {
  const { state, updateFormData, setError, clearError } = useExaminationForm();
  
  // React Hook Form setup for right eye
  const rightForm = useForm<QuestionnaireFormData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      visitId: state.visitConfig?.visitId || '',
      surveyId: state.visitConfig?.surveyId || '',
      patientId: state.visitConfig?.patientId || '',
      clinicalStudyId: state.visitConfig?.clinicalStudyId || '',
      organizationId: state.visitConfig?.organizationId || '',
      eyeside: 'Right',
      questionnaireId: `${examinationId}-right-${Date.now()}`,
      timing: '',
      // Comfort assessments
      comfort: '',
      comfortDetail: '',
      comfort_Initial: '',
      comfortDetail_Initial: '',
      comfort_Daytime: '',
      comfortDetail_Daytime: '',
      comfort_Afternoon: '',
      comfortDetail_Afternoon: '',
      comfort_EndOfDay: '',
      comfortDetail_EndOfDay: '',
      // Dryness assessments
      dryness: '',
      drynessDetail: '',
      dryness_Initial: '',
      drynessDetail_Initial: '',
      dryness_Daytime: '',
      drynessDetail_Daytime: '',
      dryness_Afternoon: '',
      drynessDetail_Afternoon: '',
      dryness_EndOfDay: '',
      drynessDetail_EndOfDay: '',
      // Symptom assessments
      irritation: '',
      irritationDetail: '',
      burning: '',
      burningDetail: '',
      // Lens handling
      easeOfInsertion: '',
      easeOfInsertionDetail: '',
      easeOfRemoval: '',
      easeOfRemovalDetail: '',
      // Visual performance
      visualPerformance: '',
      visualPerformanceDetail: '',
      // Overall assessment
      eyeStrain: '',
      eyeStrainDetail: '',
      totalSatisfaction: '',
      totalSatisfactionDetail: '',
      // Other symptoms
      otherSymptoms: '',
      otherSymptomsDetail: '',
    },
  });
  
  // React Hook Form setup for left eye
  const leftForm = useForm<QuestionnaireFormData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      visitId: state.visitConfig?.visitId || '',
      surveyId: state.visitConfig?.surveyId || '',
      patientId: state.visitConfig?.patientId || '',
      clinicalStudyId: state.visitConfig?.clinicalStudyId || '',
      organizationId: state.visitConfig?.organizationId || '',
      eyeside: 'Left',
      questionnaireId: `${examinationId}-left-${Date.now()}`,
      timing: '',
      // Same structure as right eye...
      comfort: '',
      comfortDetail: '',
      comfort_Initial: '',
      comfortDetail_Initial: '',
      comfort_Daytime: '',
      comfortDetail_Daytime: '',
      comfort_Afternoon: '',
      comfortDetail_Afternoon: '',
      comfort_EndOfDay: '',
      comfortDetail_EndOfDay: '',
      dryness: '',
      drynessDetail: '',
      dryness_Initial: '',
      drynessDetail_Initial: '',
      dryness_Daytime: '',
      drynessDetail_Daytime: '',
      dryness_Afternoon: '',
      drynessDetail_Afternoon: '',
      dryness_EndOfDay: '',
      drynessDetail_EndOfDay: '',
      irritation: '',
      irritationDetail: '',
      burning: '',
      burningDetail: '',
      easeOfInsertion: '',
      easeOfInsertionDetail: '',
      easeOfRemoval: '',
      easeOfRemovalDetail: '',
      visualPerformance: '',
      visualPerformanceDetail: '',
      eyeStrain: '',
      eyeStrainDetail: '',
      totalSatisfaction: '',
      totalSatisfactionDetail: '',
      otherSymptoms: '',
      otherSymptomsDetail: '',
    },
  });
  
  // Load existing form data from context
  useEffect(() => {
    const existingData = state.formData[examinationId];
    if (existingData?.right) {
      rightForm.reset(existingData.right);
    }
    if (existingData?.left) {
      leftForm.reset(existingData.left);
    }
  }, [state.formData, examinationId, rightForm, leftForm]);
  
  // Save form data manually
  const saveFormData = React.useCallback(() => {
    const rightData = rightForm.getValues();
    const leftData = leftForm.getValues();
    updateFormData(examinationId, 'right', rightData);
    updateFormData(examinationId, 'left', leftData);
  }, [rightForm, leftForm, examinationId, updateFormData]);
  
  // Form validation
  const rightErrors = rightForm.formState.errors;
  const leftErrors = leftForm.formState.errors;
  
  useEffect(() => {
    if (Object.keys(rightErrors).length > 0 || Object.keys(leftErrors).length > 0) {
      setError(examinationId, '問診の入力に不備があります');
    } else {
      clearError(examinationId);
    }
  }, [rightErrors, leftErrors, examinationId, setError, clearError]);
  
  const renderTimeBasedAssessment = (
    form: typeof rightForm | typeof leftForm,
    title: string,
    baseFieldName: string,
    assessmentOptions: string[],
    icon: React.ReactNode
  ) => (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography variant="subtitle1">{title}</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          {/* Overall Assessment */}
          <Grid item xs={6}>
            <Controller
              name={baseFieldName as any}
              control={form.control}
              render={({ field, fieldState }) => (
                <FormControl fullWidth error={!!fieldState.error}>
                  <InputLabel>全体的な{title}</InputLabel>
                  <Select
                    {...field}
                    label={`全体的な${title}`}
                  >
                    {assessmentOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                  {fieldState.error && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {fieldState.error?.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={6}>
            <Controller
              name={`${baseFieldName}Detail` as any}
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={`${title}詳細`}
                  multiline
                  rows={2}
                  placeholder="詳細な症状や感想を記入"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
          
          {/* Time-specific assessments */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              時間帯別評価
            </Typography>
          </Grid>
          
          {[
            { field: 'Initial', label: '装用直後' },
            { field: 'Daytime', label: '日中' },
            { field: 'Afternoon', label: '午後' },
            { field: 'EndOfDay', label: '一日の終わり' },
          ].map(({ field, label }) => (
            <React.Fragment key={field}>
              <Grid item xs={3}>
                <Controller
                  name={`${baseFieldName}_${field}` as any}
                  control={form.control}
                  render={({ field: formField, fieldState }) => (
                    <FormControl fullWidth error={!!fieldState.error} size="small">
                      <InputLabel>{label}</InputLabel>
                      <Select
                        {...formField}
                        label={label}
                      >
                        {assessmentOptions.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
                  name={`${baseFieldName}Detail_${field}` as any}
                  control={form.control}
                  render={({ field: formField, fieldState }) => (
                    <TextField
                      {...formField}
                      fullWidth
                      label={`${label}詳細`}
                      size="small"
                      placeholder="詳細記入"
                      error={!!fieldState.error}
                    />
                  )}
                />
              </Grid>
            </React.Fragment>
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
  
  const renderEyeForm = (
    form: typeof rightForm | typeof leftForm,
    eyeside: 'Right' | 'Left',
    color: string,
    bgColor: string
  ) => (
    <Box sx={{ 
      border: `2px solid ${color}`, 
      borderRadius: 2, 
      p: 2,
      backgroundColor: bgColor
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <EyeIcon sx={{ mr: 1, color }} />
        <Typography variant="h6" sx={{ color }}>
          {eyeside === 'Right' ? '右目 (Right)' : '左目 (Left)'}
        </Typography>
      </Box>
      
      <Alert severity="info" sx={{ mb: 2, fontSize: '0.875rem' }}>
        Eyeside: "{eyeside}", SurveyId: {state.visitConfig?.surveyId}, VisitId: {state.visitConfig?.visitId}
      </Alert>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        包括的な症状評価を行います。時間帯別の症状変化も含めて詳細に記録してください。
      </Typography>
      
      <Grid container spacing={2}>
        {/* Timing */}
        <Grid item xs={12}>
          <Controller
            name="timing"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>問診タイミング</InputLabel>
                <Select
                  {...field}
                  label="問診タイミング"
                  startAdornment={<TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  {TIMING_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {fieldState.error && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {fieldState.error?.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              主観的症状評価
            </Typography>
          </Divider>
        </Grid>
        
        {/* Comfort Assessment */}
        <Grid item xs={12}>
          {renderTimeBasedAssessment(
            form,
            '快適性',
            'comfort',
            SYMPTOM_ASSESSMENT_OPTIONS,
            <ComfortIcon color="primary" />
          )}
        </Grid>
        
        {/* Dryness Assessment */}
        <Grid item xs={12}>
          {renderTimeBasedAssessment(
            form,
            '乾燥感',
            'dryness',
            SYMPTOM_ASSESSMENT_OPTIONS,
            <DrynessIcon color="info" />
          )}
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              その他の症状
            </Typography>
          </Divider>
        </Grid>
        
        {/* Other Symptoms */}
        <Grid item xs={6}>
          <Controller
            name="irritation"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>刺激感</InputLabel>
                <Select
                  {...field}
                  label="刺激感"
                >
                  {SYMPTOM_ASSESSMENT_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="irritationDetail"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="刺激感詳細"
                placeholder="刺激の種類や程度を記入"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={6}>
          <Controller
            name="burning"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>灼熱感</InputLabel>
                <Select
                  {...field}
                  label="灼熱感"
                >
                  {SYMPTOM_ASSESSMENT_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="burningDetail"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="灼熱感詳細"
                placeholder="灼熱感の程度や発生条件を記入"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              レンズハンドリング
            </Typography>
          </Divider>
        </Grid>
        
        {/* Lens Handling */}
        <Grid item xs={6}>
          <Controller
            name="easeOfInsertion"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>装用のしやすさ</InputLabel>
                <Select
                  {...field}
                  label="装用のしやすさ"
                >
                  {PERFORMANCE_ASSESSMENT_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="easeOfInsertionDetail"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="装用詳細"
                placeholder="装用時の感想や困難点"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={6}>
          <Controller
            name="easeOfRemoval"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>取り外しのしやすさ</InputLabel>
                <Select
                  {...field}
                  label="取り外しのしやすさ"
                >
                  {PERFORMANCE_ASSESSMENT_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="easeOfRemovalDetail"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="取り外し詳細"
                placeholder="取り外し時の感想や困難点"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              総合評価
            </Typography>
          </Divider>
        </Grid>
        
        {/* Overall Assessment */}
        <Grid item xs={6}>
          <Controller
            name="visualPerformance"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>視覚性能</InputLabel>
                <Select
                  {...field}
                  label="視覚性能"
                >
                  {PERFORMANCE_ASSESSMENT_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="visualPerformanceDetail"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="視覚性能詳細"
                placeholder="見え方の質や問題点"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={6}>
          <Controller
            name="eyeStrain"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>眼精疲労</InputLabel>
                <Select
                  {...field}
                  label="眼精疲労"
                >
                  {SYMPTOM_ASSESSMENT_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="eyeStrainDetail"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="眼精疲労詳細"
                placeholder="疲労感の程度や発生時間"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={6}>
          <Controller
            name="totalSatisfaction"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>総合満足度</InputLabel>
                <Select
                  {...field}
                  label="総合満足度"
                >
                  {SATISFACTION_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="totalSatisfactionDetail"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="総合満足度詳細"
                placeholder="総合的な使用感や改善希望"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        
        {/* Other Symptoms */}
        <Grid item xs={6}>
          <Controller
            name="otherSymptoms"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="その他の症状"
                placeholder="上記以外の症状があれば記入"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="otherSymptomsDetail"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="その他症状詳細"
                multiline
                rows={2}
                placeholder="その他症状の詳細や発生条件"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
      </Grid>
      
      {/* Summary */}
      <Paper sx={{ mt: 3, p: 2, bgcolor: 'background.default' }}>
        <Typography variant="subtitle2" gutterBottom>
          問診サマリー
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={4}>
            <Typography variant="caption">快適性</Typography>
            <Typography variant="body2" fontWeight="bold">
              {form.watch('comfort') || '未回答'}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption">乾燥感</Typography>
            <Typography variant="body2" fontWeight="bold">
              {form.watch('dryness') || '未回答'}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption">総合満足度</Typography>
            <Typography variant="body2" fontWeight="bold">
              {form.watch('totalSatisfaction') || '未回答'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
  
  return (
    <Grid container spacing={3}>
      {/* Right Eye Column */}
      <Grid item xs={12} md={6}>
        {renderEyeForm(rightForm, 'Right', '#1976d2', '#f3f7ff')}
      </Grid>
      
      {/* Left Eye Column */}
      <Grid item xs={12} md={6}>
        {renderEyeForm(leftForm, 'Left', '#d32f2f', '#fff3f3')}
      </Grid>
    </Grid>
  );
};