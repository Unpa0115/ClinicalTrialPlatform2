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
  InputAdornment,
} from '@mui/material';
import { Visibility as EyeIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { dr1Schema, DR1FormData } from '../validation/examinationSchemas';
import { useExaminationForm } from '../contexts/ExaminationFormContext';

interface DR1FormProps {
  examinationId: string;
}

// Options for tear quality assessment
const TEAR_QUALITY_OPTIONS = [
  '正常',
  'やや粘稠',
  '粘稠',
  '泡沫状',
  '混濁',
  '血性',
  '油性分泌物過多',
  '水様分泌物過多',
];

// Options for blinking pattern assessment
const BLINKING_PATTERN_OPTIONS = [
  '正常',
  '頻回瞬目',
  '瞬目減少',
  '不完全瞬目',
  '強制瞬目',
  '不規則瞬目',
  '片眼瞬目',
];

export const DR1Form: React.FC<DR1FormProps> = ({ examinationId }) => {
  const { state, updateFormData, setError, clearError } = useExaminationForm();
  
  // React Hook Form setup for right eye
  const rightForm = useForm<DR1FormData>({
    resolver: zodResolver(dr1Schema),
    defaultValues: {
      visitId: state.visitConfig?.visitId || '',
      surveyId: state.visitConfig?.surveyId || '',
      patientId: state.visitConfig?.patientId || '',
      clinicalStudyId: state.visitConfig?.clinicalStudyId || '',
      organizationId: state.visitConfig?.organizationId || '',
      eyeside: 'Right',
      dr1Id: `${examinationId}-right-${Date.now()}`,
      tearBreakUpTime: 0,
      schirmerTest: 0,
      tearMeniscusHeight: 0,
      tearQuality: '',
      blinkingPattern: '',
    },
  });
  
  // React Hook Form setup for left eye
  const leftForm = useForm<DR1FormData>({
    resolver: zodResolver(dr1Schema),
    defaultValues: {
      visitId: state.visitConfig?.visitId || '',
      surveyId: state.visitConfig?.surveyId || '',
      patientId: state.visitConfig?.patientId || '',
      clinicalStudyId: state.visitConfig?.clinicalStudyId || '',
      organizationId: state.visitConfig?.organizationId || '',
      eyeside: 'Left',
      dr1Id: `${examinationId}-left-${Date.now()}`,
      tearBreakUpTime: 0,
      schirmerTest: 0,
      tearMeniscusHeight: 0,
      tearQuality: '',
      blinkingPattern: '',
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
      setError(examinationId, '涙液層検査の入力に不備があります');
    } else {
      clearError(examinationId);
    }
  }, [rightErrors, leftErrors, examinationId, setError, clearError]);
  
  // Assessment interpretation functions
  const interpretTearBreakUpTime = (value: number): { status: string; color: string; description: string } => {
    if (value >= 10) return { status: '正常', color: '#4caf50', description: '正常な涙液安定性' };
    if (value >= 5) return { status: 'やや短縮', color: '#ff9800', description: '軽度ドライアイの疑い' };
    if (value >= 3) return { status: '短縮', color: '#f44336', description: '中等度ドライアイ' };
    return { status: '著明短縮', color: '#d32f2f', description: '重度ドライアイ' };
  };
  
  const interpretSchirmerTest = (value: number): { status: string; color: string; description: string } => {
    if (value >= 15) return { status: '正常', color: '#4caf50', description: '正常な涙液分泌' };
    if (value >= 10) return { status: 'やや減少', color: '#ff9800', description: '軽度分泌低下' };
    if (value >= 5) return { status: '減少', color: '#f44336', description: '中等度分泌低下' };
    return { status: '著明減少', color: '#d32f2f', description: '重度分泌低下' };
  };
  
  const interpretTearMeniscus = (value: number): { status: string; color: string; description: string } => {
    if (value >= 0.3) return { status: '正常', color: '#4caf50', description: '正常な涙液貯留' };
    if (value >= 0.2) return { status: 'やや低下', color: '#ff9800', description: '軽度涙液減少' };
    if (value >= 0.1) return { status: '低下', color: '#f44336', description: '中等度涙液減少' };
    return { status: '著明低下', color: '#d32f2f', description: '重度涙液減少' };
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
        涙液層の評価を行ってください。BUT（涙液破綻時間）、シルマーテスト、涙液メニスカス高の測定と質的評価を入力します。
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              定量測定
            </Typography>
          </Divider>
        </Grid>
        
        {/* Tear Break-Up Time */}
        <Grid item xs={12}>
          <Controller
            name="tearBreakUpTime"
            control={form.control}
            render={({ field, fieldState }) => {
              const interpretation = interpretTearBreakUpTime(field.value);
              return (
                <Box>
                  <TextField
                    {...field}
                    fullWidth
                    label="涙液破綻時間 (BUT)"
                    type="number"
                    inputProps={{ step: '0.1', min: '0', max: '60' }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">秒</InputAdornment>
                    }}
                    helperText={fieldState.error?.message || "正常値: 10秒以上"}
                    error={!!fieldState.error}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                  {field.value > 0 && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ color: interpretation.color, fontWeight: 'bold' }}>
                        評価: {interpretation.status} - {interpretation.description}
                      </Typography>
                    </Alert>
                  )}
                </Box>
              );
            }}
          />
        </Grid>
        
        {/* Schirmer Test */}
        <Grid item xs={12}>
          <Controller
            name="schirmerTest"
            control={form.control}
            render={({ field, fieldState }) => {
              const interpretation = interpretSchirmerTest(field.value);
              return (
                <Box>
                  <TextField
                    {...field}
                    fullWidth
                    label="シルマーテスト"
                    type="number"
                    inputProps={{ step: '1', min: '0', max: '50' }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mm/5分</InputAdornment>
                    }}
                    helperText={fieldState.error?.message || "正常値: 15mm以上"}
                    error={!!fieldState.error}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                  {field.value > 0 && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ color: interpretation.color, fontWeight: 'bold' }}>
                        評価: {interpretation.status} - {interpretation.description}
                      </Typography>
                    </Alert>
                  )}
                </Box>
              );
            }}
          />
        </Grid>
        
        {/* Tear Meniscus Height */}
        <Grid item xs={12}>
          <Controller
            name="tearMeniscusHeight"
            control={form.control}
            render={({ field, fieldState }) => {
              const interpretation = interpretTearMeniscus(field.value);
              return (
                <Box>
                  <TextField
                    {...field}
                    fullWidth
                    label="涙液メニスカス高"
                    type="number"
                    inputProps={{ step: '0.01', min: '0', max: '10' }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>
                    }}
                    helperText={fieldState.error?.message || "正常値: 0.3mm以上"}
                    error={!!fieldState.error}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                  {field.value > 0 && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ color: interpretation.color, fontWeight: 'bold' }}>
                        評価: {interpretation.status} - {interpretation.description}
                      </Typography>
                    </Alert>
                  )}
                </Box>
              );
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              質的評価
            </Typography>
          </Divider>
        </Grid>
        
        {/* Tear Quality */}
        <Grid item xs={6}>
          <Controller
            name="tearQuality"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>涙液の質的評価</InputLabel>
                <Select
                  {...field}
                  label="涙液の質的評価"
                >
                  {TEAR_QUALITY_OPTIONS.map((option) => (
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
        
        {/* Blinking Pattern */}
        <Grid item xs={6}>
          <Controller
            name="blinkingPattern"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>瞬目パターン</InputLabel>
                <Select
                  {...field}
                  label="瞬目パターン"
                >
                  {BLINKING_PATTERN_OPTIONS.map((option) => (
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
      </Grid>
      
      {/* Assessment Summary */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          涙液層評価サマリー
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={4}>
            <Typography variant="caption">BUT</Typography>
            <Typography variant="body2" fontWeight="bold">
              {form.watch('tearBreakUpTime')}秒
            </Typography>
            <Typography variant="caption" sx={{ 
              color: form.watch('tearBreakUpTime') > 0 ? interpretTearBreakUpTime(form.watch('tearBreakUpTime')).color : 'text.secondary'
            }}>
              {form.watch('tearBreakUpTime') > 0 ? interpretTearBreakUpTime(form.watch('tearBreakUpTime')).status : '-'}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption">シルマー</Typography>
            <Typography variant="body2" fontWeight="bold">
              {form.watch('schirmerTest')}mm
            </Typography>
            <Typography variant="caption" sx={{ 
              color: form.watch('schirmerTest') > 0 ? interpretSchirmerTest(form.watch('schirmerTest')).color : 'text.secondary'
            }}>
              {form.watch('schirmerTest') > 0 ? interpretSchirmerTest(form.watch('schirmerTest')).status : '-'}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption">メニスカス</Typography>
            <Typography variant="body2" fontWeight="bold">
              {form.watch('tearMeniscusHeight')}mm
            </Typography>
            <Typography variant="caption" sx={{ 
              color: form.watch('tearMeniscusHeight') > 0 ? interpretTearMeniscus(form.watch('tearMeniscusHeight')).color : 'text.secondary'
            }}>
              {form.watch('tearMeniscusHeight') > 0 ? interpretTearMeniscus(form.watch('tearMeniscusHeight')).status : '-'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">涙液質</Typography>
            <Typography variant="body2">
              {form.watch('tearQuality') || '未選択'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">瞬目</Typography>
            <Typography variant="body2">
              {form.watch('blinkingPattern') || '未選択'}
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