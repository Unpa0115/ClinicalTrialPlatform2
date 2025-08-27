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
} from '@mui/material';
import { Visibility as EyeIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { comparativeSchema, ComparativeFormData } from '../validation/examinationSchemas';
import { useExaminationForm } from '../contexts/ExaminationFormContext';

interface ComparativeFormProps {
  examinationId: string;
}

// Assessment options for dropdowns
const ASSESSMENT_OPTIONS = [
  { value: 'much_better', label: '大幅に良い', color: '#4caf50' },
  { value: 'better', label: '良い', color: '#8bc34a' },
  { value: 'same', label: '同じ', color: '#ff9800' },
  { value: 'worse', label: '悪い', color: '#f44336' },
  { value: 'much_worse', label: '大幅に悪い', color: '#d32f2f' },
];

export const ComparativeForm: React.FC<ComparativeFormProps> = ({ examinationId }) => {
  const { state, updateFormData, setError, clearError } = useExaminationForm();
  
  // React Hook Form setup for right eye
  const rightForm = useForm<ComparativeFormData>({
    resolver: zodResolver(comparativeSchema),
    defaultValues: {
      visitId: state.visitConfig?.visitId || '',
      surveyId: state.visitConfig?.surveyId || '',
      patientId: state.visitConfig?.patientId || '',
      clinicalStudyId: state.visitConfig?.clinicalStudyId || '',
      organizationId: state.visitConfig?.organizationId || '',
      eyeside: 'Right',
      comparativeScoresId: `${examinationId}-right-${Date.now()}`,
      comfort: 'same',
      comfortReason: '',
      dryness: 'same',
      drynessReason: '',
      vp_DigitalDevice: 'same',
      vpReason_DigitalDevice: '',
      vp_DayTime: 'same',
      vpReason_DayTime: '',
      vp_EndOfDay: 'same',
      vpReason_EndOfDay: '',
      vp_Glare: 'same',
      vpReason_Glare: '',
      vp_Halo: 'same',
      vpReason_Halo: '',
      vp_StarBurst: 'same',
      vpReason_StarBurst: '',
      eyeStrain: 'same',
      eyeStrainReason: '',
      totalSatisfaction: 'same',
      totalSatisfactionReason: '',
    },
  });
  
  // React Hook Form setup for left eye
  const leftForm = useForm<ComparativeFormData>({
    resolver: zodResolver(comparativeSchema),
    defaultValues: {
      visitId: state.visitConfig?.visitId || '',
      surveyId: state.visitConfig?.surveyId || '',
      patientId: state.visitConfig?.patientId || '',
      clinicalStudyId: state.visitConfig?.clinicalStudyId || '',
      organizationId: state.visitConfig?.organizationId || '',
      eyeside: 'Left',
      comparativeScoresId: `${examinationId}-left-${Date.now()}`,
      comfort: 'same',
      comfortReason: '',
      dryness: 'same',
      drynessReason: '',
      vp_DigitalDevice: 'same',
      vpReason_DigitalDevice: '',
      vp_DayTime: 'same',
      vpReason_DayTime: '',
      vp_EndOfDay: 'same',
      vpReason_EndOfDay: '',
      vp_Glare: 'same',
      vpReason_Glare: '',
      vp_Halo: 'same',
      vpReason_Halo: '',
      vp_StarBurst: 'same',
      vpReason_StarBurst: '',
      eyeStrain: 'same',
      eyeStrainReason: '',
      totalSatisfaction: 'same',
      totalSatisfactionReason: '',
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
  
  // Save form data manually on blur events
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
      setError(examinationId, '相対評価の入力に不備があります');
    } else {
      clearError(examinationId);
    }
  }, [rightErrors, leftErrors, examinationId, setError, clearError]);
  
  // Custom Assessment Selector component
  const AssessmentSelector: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: boolean;
    helperText?: string;
  }> = ({ label, value, onChange, error, helperText }) => {
    const selectedOption = ASSESSMENT_OPTIONS.find(opt => opt.value === value);
    
    return (
      <FormControl fullWidth error={error}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={value}
          label={label}
          onChange={(e) => onChange(e.target.value)}
          sx={{
            '& .MuiSelect-select': {
              color: selectedOption?.color || 'inherit',
              fontWeight: selectedOption?.value !== 'same' ? 'bold' : 'normal',
            },
          }}
        >
          {ASSESSMENT_OPTIONS.map((option) => (
            <MenuItem 
              key={option.value} 
              value={option.value}
              sx={{ 
                color: option.color,
                fontWeight: option.value !== 'same' ? 'bold' : 'normal',
              }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {helperText && (
          <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
            {helperText}
          </Typography>
        )}
      </FormControl>
    );
  };
  
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
        前回レンズとの比較評価を行ってください。各項目について評価を選択し、理由を記載してください。
      </Typography>
      
      <Grid container spacing={2}>
        {/* Basic Comfort and Dryness */}
        <Grid item xs={6}>
          <Controller
            name="comfort"
            control={form.control}
            render={({ field, fieldState }) => (
              <AssessmentSelector
                label="快適性"
                value={field.value}
                onChange={field.onChange}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="comfortReason"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="快適性の理由"
                multiline
                rows={2}
                placeholder="評価の理由を入力してください"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={6}>
          <Controller
            name="dryness"
            control={form.control}
            render={({ field, fieldState }) => (
              <AssessmentSelector
                label="乾燥感"
                value={field.value}
                onChange={field.onChange}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="drynessReason"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="乾燥感の理由"
                multiline
                rows={2}
                placeholder="評価の理由を入力してください"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              視覚性能評価
            </Typography>
          </Divider>
        </Grid>
        
        {/* Visual Performance - Digital Device */}
        <Grid item xs={6}>
          <Controller
            name="vp_DigitalDevice"
            control={form.control}
            render={({ field, fieldState }) => (
              <AssessmentSelector
                label="デジタルデバイス使用時"
                value={field.value}
                onChange={field.onChange}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="vpReason_DigitalDevice"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="理由"
                placeholder="評価の理由を入力してください"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        
        {/* Visual Performance - Day Time */}
        <Grid item xs={6}>
          <Controller
            name="vp_DayTime"
            control={form.control}
            render={({ field, fieldState }) => (
              <AssessmentSelector
                label="日中の視覚性能"
                value={field.value}
                onChange={field.onChange}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="vpReason_DayTime"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="理由"
                placeholder="評価の理由を入力してください"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        
        {/* Visual Performance - End of Day */}
        <Grid item xs={6}>
          <Controller
            name="vp_EndOfDay"
            control={form.control}
            render={({ field, fieldState }) => (
              <AssessmentSelector
                label="一日の終わり"
                value={field.value}
                onChange={field.onChange}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="vpReason_EndOfDay"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="理由"
                placeholder="評価の理由を入力してください"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        
        {/* Visual Disturbances */}
        <Grid item xs={6}>
          <Controller
            name="vp_Glare"
            control={form.control}
            render={({ field, fieldState }) => (
              <AssessmentSelector
                label="グレア"
                value={field.value}
                onChange={field.onChange}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="vpReason_Glare"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="理由"
                placeholder="評価の理由を入力してください"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={6}>
          <Controller
            name="vp_Halo"
            control={form.control}
            render={({ field, fieldState }) => (
              <AssessmentSelector
                label="ハロー"
                value={field.value}
                onChange={field.onChange}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="vpReason_Halo"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="理由"
                placeholder="評価の理由を入力してください"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={6}>
          <Controller
            name="vp_StarBurst"
            control={form.control}
            render={({ field, fieldState }) => (
              <AssessmentSelector
                label="スターバースト"
                value={field.value}
                onChange={field.onChange}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="vpReason_StarBurst"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="理由"
                placeholder="評価の理由を入力してください"
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
            name="eyeStrain"
            control={form.control}
            render={({ field, fieldState }) => (
              <AssessmentSelector
                label="眼精疲労"
                value={field.value}
                onChange={field.onChange}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="eyeStrainReason"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="理由"
                placeholder="評価の理由を入力してください"
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
              <AssessmentSelector
                label="総合満足度"
                value={field.value}
                onChange={field.onChange}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="totalSatisfactionReason"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="理由"
                placeholder="総合的な満足度の理由"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
      </Grid>
      
      {/* Assessment Summary */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          評価サマリー
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={4}>
            <Typography variant="caption">快適性</Typography>
            <Typography variant="body2" sx={{ 
              color: ASSESSMENT_OPTIONS.find(opt => opt.value === form.watch('comfort'))?.color,
              fontWeight: 'bold'
            }}>
              {ASSESSMENT_OPTIONS.find(opt => opt.value === form.watch('comfort'))?.label}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption">乾燥感</Typography>
            <Typography variant="body2" sx={{ 
              color: ASSESSMENT_OPTIONS.find(opt => opt.value === form.watch('dryness'))?.color,
              fontWeight: 'bold'
            }}>
              {ASSESSMENT_OPTIONS.find(opt => opt.value === form.watch('dryness'))?.label}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption">総合満足度</Typography>
            <Typography variant="body2" sx={{ 
              color: ASSESSMENT_OPTIONS.find(opt => opt.value === form.watch('totalSatisfaction'))?.color,
              fontWeight: 'bold'
            }}>
              {ASSESSMENT_OPTIONS.find(opt => opt.value === form.watch('totalSatisfaction'))?.label}
            </Typography>
          </Grid>
        </Grid>
      </Box>
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