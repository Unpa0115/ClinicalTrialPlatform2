import React, { useEffect, useRef, useCallback } from 'react';
import {
  Grid,
  TextField,
  Typography,
  Box,
  Alert,
  Divider,
  InputAdornment,
} from '@mui/material';
import { Visibility as EyeIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { basicInfoSchema, BasicInfoFormData } from '../validation/examinationSchemas';
import { useExaminationForm } from '../contexts/ExaminationFormContext';

interface BasicInfoFormProps {
  examinationId: string;
}

export const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ examinationId }) => {
  const { state, updateFormData, setError, clearError } = useExaminationForm();
  const isInitialLoad = useRef(true);
  
  console.log('BasicInfoForm rendering:', {
    examinationId,
    visitConfig: state.visitConfig,
    formData: state.formData[examinationId],
    allFormData: state.formData,
    isLoading: state.isLoading
  });
  
  // React Hook Form setup for right eye
  const rightForm = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      visitId: state.visitConfig?.visitId || '',
      surveyId: state.visitConfig?.surveyId || '',
      patientId: state.visitConfig?.patientId || '',
      clinicalStudyId: state.visitConfig?.clinicalStudyId || '',
      organizationId: state.visitConfig?.organizationId || '',
      eyeside: 'Right',
      basicInfoId: `${examinationId}-right-${Date.now()}`,
      currentUsedCL: '',
      cr_R1: 0,
      cr_R2: 0,
      cr_Ave: 0,
      va: 0,
      s: 0,
      c: 0,
      ax: 0,
      intraocularPressure1: 0,
      intraocularPressure2: 0,
      intraocularPressure3: 0,
      cornealEndothelialCells: 0,
    },
  });
  
  // React Hook Form setup for left eye
  const leftForm = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      visitId: state.visitConfig?.visitId || '',
      surveyId: state.visitConfig?.surveyId || '',
      patientId: state.visitConfig?.patientId || '',
      clinicalStudyId: state.visitConfig?.clinicalStudyId || '',
      organizationId: state.visitConfig?.organizationId || '',
      eyeside: 'Left',
      basicInfoId: `${examinationId}-left-${Date.now()}`,
      currentUsedCL: '',
      cr_R1: 0,
      cr_R2: 0,
      cr_Ave: 0,
      va: 0,
      s: 0,
      c: 0,
      ax: 0,
      intraocularPressure1: 0,
      intraocularPressure2: 0,
      intraocularPressure3: 0,
      cornealEndothelialCells: 0,
    },
  });
  
  // Load existing form data from context
  useEffect(() => {
    const existingData = state.formData[examinationId];
    console.log('Loading existing form data:', { examinationId, existingData });
    if (existingData?.right) {
      console.log('Resetting right form with:', existingData.right);
      rightForm.reset(existingData.right);
    }
    if (existingData?.left) {
      console.log('Resetting left form with:', existingData.left);
      leftForm.reset(existingData.left);
    }
  }, [state.formData, examinationId, rightForm, leftForm]);
  
  // Save form data to context on form submission or specific events
  const saveFormData = useCallback(() => {
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
      setError(examinationId, '基礎情報の入力に不備があります');
    } else {
      clearError(examinationId);
    }
  }, [rightErrors, leftErrors, examinationId, setError, clearError]);
  
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
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Controller
            name="currentUsedCL"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="現在使用しているコンタクトレンズ"
                placeholder="例: アキュビューオアシス"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onBlur={(e) => {
                  field.onBlur(e);
                  saveFormData();
                }}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              角膜曲率半径
            </Typography>
          </Divider>
        </Grid>
        
        <Grid item xs={4}>
          <Controller
            name="cr_R1"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="R1"
                type="number"
                inputProps={{ step: '0.01', min: '0', max: '100' }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">mm</InputAdornment>
                }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={4}>
          <Controller
            name="cr_R2"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="R2"
                type="number"
                inputProps={{ step: '0.01', min: '0', max: '100' }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">mm</InputAdornment>
                }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={4}>
          <Controller
            name="cr_Ave"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="Ave"
                type="number"
                inputProps={{ step: '0.01', min: '0', max: '100' }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">mm</InputAdornment>
                }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              屈折検査
            </Typography>
          </Divider>
        </Grid>
        
        <Grid item xs={3}>
          <Controller
            name="va"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="VA"
                type="number"
                inputProps={{ step: '0.1', min: '0', max: '2.0' }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={3}>
          <Controller
            name="s"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="S"
                type="number"
                inputProps={{ step: '0.25', min: '-20', max: '20' }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">D</InputAdornment>
                }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={3}>
          <Controller
            name="c"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="C"
                type="number"
                inputProps={{ step: '0.25', min: '-10', max: '10' }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">D</InputAdornment>
                }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={3}>
          <Controller
            name="ax"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="Ax"
                type="number"
                inputProps={{ step: '1', min: '0', max: '180' }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">°</InputAdornment>
                }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              眼圧測定
            </Typography>
          </Divider>
        </Grid>
        
        <Grid item xs={4}>
          <Controller
            name="intraocularPressure1"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="測定1"
                type="number"
                inputProps={{ step: '1', min: '0', max: '50' }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">mmHg</InputAdornment>
                }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={4}>
          <Controller
            name="intraocularPressure2"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="測定2"
                type="number"
                inputProps={{ step: '1', min: '0', max: '50' }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">mmHg</InputAdornment>
                }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={4}>
          <Controller
            name="intraocularPressure3"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="測定3"
                type="number"
                inputProps={{ step: '1', min: '0', max: '50' }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">mmHg</InputAdornment>
                }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Controller
            name="cornealEndothelialCells"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="角膜内皮細胞数"
                type="number"
                inputProps={{ step: '1', min: '500', max: '5000' }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">cells/mm²</InputAdornment>
                }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              />
            )}
          />
        </Grid>
      </Grid>
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