import React, { useEffect } from 'react';
import {
  Grid,
  TextField,
  Typography,
  Box,
  Alert,
  Slider,
  InputAdornment,
} from '@mui/material';
import { Visibility as EyeIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { vasSchema, VASFormData } from '../validation/examinationSchemas';
import { useExaminationForm } from '../contexts/ExaminationFormContext';

interface VASFormProps {
  examinationId: string;
}

export const VASForm: React.FC<VASFormProps> = ({ examinationId }) => {
  const { state, updateFormData, setError, clearError } = useExaminationForm();
  
  // React Hook Form setup for right eye
  const rightForm = useForm<VASFormData>({
    resolver: zodResolver(vasSchema),
    defaultValues: {
      visitId: state.visitConfig?.visitId || '',
      surveyId: state.visitConfig?.surveyId || '',
      patientId: state.visitConfig?.patientId || '',
      clinicalStudyId: state.visitConfig?.clinicalStudyId || '',
      organizationId: state.visitConfig?.organizationId || '',
      eyeside: 'Right',
      vasId: `${examinationId}-right-${Date.now()}`,
      comfortLevel: 50,
      drynessLevel: 50,
      visualPerformance_Daytime: 50,
      visualPerformance_EndOfDay: 50,
    },
  });
  
  // React Hook Form setup for left eye
  const leftForm = useForm<VASFormData>({
    resolver: zodResolver(vasSchema),
    defaultValues: {
      visitId: state.visitConfig?.visitId || '',
      surveyId: state.visitConfig?.surveyId || '',
      patientId: state.visitConfig?.patientId || '',
      clinicalStudyId: state.visitConfig?.clinicalStudyId || '',
      organizationId: state.visitConfig?.organizationId || '',
      eyeside: 'Left',
      vasId: `${examinationId}-left-${Date.now()}`,
      comfortLevel: 50,
      drynessLevel: 50,
      visualPerformance_Daytime: 50,
      visualPerformance_EndOfDay: 50,
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
      setError(examinationId, 'VAS評価の入力に不備があります');
    } else {
      clearError(examinationId);
    }
  }, [rightErrors, leftErrors, examinationId, setError, clearError]);
  
  // Custom VAS Slider component
  const VASSlider: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    leftLabel: string;
    rightLabel: string;
    color?: string;
    error?: boolean;
    helperText?: string;
  }> = ({ label, value, onChange, leftLabel, rightLabel, color = 'primary', error, helperText }) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        {label}
      </Typography>
      <Box sx={{ px: 2 }}>
        <Slider
          value={value}
          onChange={(_, newValue) => onChange(newValue as number)}
          valueLabelDisplay="on"
          step={1}
          marks={[
            { value: 0, label: '0' },
            { value: 25, label: '25' },
            { value: 50, label: '50' },
            { value: 75, label: '75' },
            { value: 100, label: '100' },
          ]}
          min={0}
          max={100}
          color={color as any}
          sx={{ 
            mb: 2,
            '& .MuiSlider-valueLabelOpen': {
              fontSize: '0.875rem',
              fontWeight: 'bold',
            },
            ...(error && {
              '& .MuiSlider-track': {
                color: 'error.main',
              },
              '& .MuiSlider-thumb': {
                color: 'error.main',
              },
            }),
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            {leftLabel}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {rightLabel}
          </Typography>
        </Box>
        {helperText && (
          <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
            {helperText}
          </Typography>
        )}
      </Box>
    </Box>
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
        0-100のスケールで評価してください。スライダーを動かして適切な値を選択してください。
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Controller
            name="comfortLevel"
            control={form.control}
            render={({ field, fieldState }) => (
              <VASSlider
                label="快適性レベル"
                value={field.value}
                onChange={field.onChange}
                leftLabel="非常に不快 (0)"
                rightLabel="非常に快適 (100)"
                color={eyeside === 'Right' ? 'primary' : 'secondary'}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Controller
            name="drynessLevel"
            control={form.control}
            render={({ field, fieldState }) => (
              <VASSlider
                label="乾燥感レベル"
                value={field.value}
                onChange={field.onChange}
                leftLabel="全く乾燥しない (0)"
                rightLabel="非常に乾燥する (100)"
                color={eyeside === 'Right' ? 'primary' : 'secondary'}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={6}>
          <Controller
            name="visualPerformance_Daytime"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="日中の視覚性能"
                type="number"
                inputProps={{ min: 0, max: 100, step: 1 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">/100</InputAdornment>
                }}
                helperText={fieldState.error?.message || "0-100で入力してください"}
                error={!!fieldState.error}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  field.onChange(Math.max(0, Math.min(100, value)));
                }}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={6}>
          <Controller
            name="visualPerformance_EndOfDay"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="一日の終わりの視覚性能"
                type="number"
                inputProps={{ min: 0, max: 100, step: 1 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">/100</InputAdornment>
                }}
                helperText={fieldState.error?.message || "0-100で入力してください"}
                error={!!fieldState.error}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  field.onChange(Math.max(0, Math.min(100, value)));
                }}
              />
            )}
          />
        </Grid>
      </Grid>
      
      {/* Visual representation of scores */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          現在の評価スコア
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Typography variant="caption">快適性</Typography>
            <Typography variant="h6" color={eyeside === 'Right' ? 'primary' : 'secondary'}>
              {form.watch('comfortLevel')}/100
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">乾燥感</Typography>
            <Typography variant="h6" color={eyeside === 'Right' ? 'primary' : 'secondary'}>
              {form.watch('drynessLevel')}/100
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