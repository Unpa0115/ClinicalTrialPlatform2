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
  Chip,
} from '@mui/material';
import { Visibility as EyeIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { correctedVASchema, CorrectedVAFormData } from '../validation/examinationSchemas';
import { useExaminationForm } from '../contexts/ExaminationFormContext';

interface CorrectedVAFormProps {
  examinationId: string;
}

// Options for red-green test
const RED_GREEN_TEST_OPTIONS = [
  '赤優位',
  '緑優位',
  '同等',
  '判定困難',
];

// Options for clarity assessment
const CLARITY_OPTIONS = [
  '非常に良好',
  '良好',
  'やや不良',
  '不良',
  '非常に不良',
];

// Options for clarity detail
const CLARITY_DETAIL_OPTIONS = [
  'くっきり見える',
  'やや滲んで見える',
  '滲んで見える',
  'ぼやけて見える',
  '二重に見える',
  '歪んで見える',
];

// Options for stability assessment
const STABILITY_OPTIONS = [
  '非常に安定',
  '安定',
  'やや不安定',
  '不安定',
  '非常に不安定',
];

// Options for stability detail
const STABILITY_DETAIL_OPTIONS = [
  '常に安定',
  '瞬目後すぐ安定',
  '瞬目後やや時間要',
  '瞬目後時間要',
  '常に不安定',
  '時間とともに悪化',
];

export const CorrectedVAForm: React.FC<CorrectedVAFormProps> = ({ examinationId }) => {
  const { state, updateFormData, setError, clearError } = useExaminationForm();
  
  // React Hook Form setup for right eye
  const rightForm = useForm<CorrectedVAFormData>({
    resolver: zodResolver(correctedVASchema),
    defaultValues: {
      visitId: state.visitConfig?.visitId || '',
      surveyId: state.visitConfig?.surveyId || '',
      patientId: state.visitConfig?.patientId || '',
      clinicalStudyId: state.visitConfig?.clinicalStudyId || '',
      organizationId: state.visitConfig?.organizationId || '',
      eyeside: 'Right',
      correctedVAId: `${examinationId}-right-${Date.now()}`,
      va_WithoutLens: '',
      va_WithLens: '',
      redGreenTest: '',
      va_S_Correction: '',
      s_S_Correction: '',
      clarity_S_Correction: '',
      clarityDetail_S_Correction: '',
      stability_S_Correction: '',
      stabilityDetail_S_Correction: '',
      va_SC_Correction: '',
      s_SC_Correction: '',
      c_SC_Correction: '',
      ax_SC_Correction: '',
      clarity_SC_Correction: '',
      clarityDetail_SC_Correction: '',
      stability_SC_Correction: '',
      stabilityDetail_SC_Correction: '',
    },
  });
  
  // React Hook Form setup for left eye
  const leftForm = useForm<CorrectedVAFormData>({
    resolver: zodResolver(correctedVASchema),
    defaultValues: {
      visitId: state.visitConfig?.visitId || '',
      surveyId: state.visitConfig?.surveyId || '',
      patientId: state.visitConfig?.patientId || '',
      clinicalStudyId: state.visitConfig?.clinicalStudyId || '',
      organizationId: state.visitConfig?.organizationId || '',
      eyeside: 'Left',
      correctedVAId: `${examinationId}-left-${Date.now()}`,
      va_WithoutLens: '',
      va_WithLens: '',
      redGreenTest: '',
      va_S_Correction: '',
      s_S_Correction: '',
      clarity_S_Correction: '',
      clarityDetail_S_Correction: '',
      stability_S_Correction: '',
      stabilityDetail_S_Correction: '',
      va_SC_Correction: '',
      s_SC_Correction: '',
      c_SC_Correction: '',
      ax_SC_Correction: '',
      clarity_SC_Correction: '',
      clarityDetail_SC_Correction: '',
      stability_SC_Correction: '',
      stabilityDetail_SC_Correction: '',
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
      setError(examinationId, '矯正視力検査の入力に不備があります');
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
      
      <Typography variant="body2" color="text.secondary" paragraph>
        レンズ装用下での矯正視力検査を行います。球面補正（S補正）および球面円柱補正（SC補正）による視力向上と安定性を評価してください。
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              基本視力測定
            </Typography>
          </Divider>
        </Grid>
        
        {/* Basic Visual Acuity */}
        <Grid item xs={4}>
          <Controller
            name="va_WithoutLens"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="レンズなし視力"
                placeholder="例: 0.8"
                helperText={fieldState.error?.message}
                error={!!fieldState.error}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={4}>
          <Controller
            name="va_WithLens"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="レンズ装用時視力"
                placeholder="例: 1.0"
                helperText={fieldState.error?.message}
                error={!!fieldState.error}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={4}>
          <Controller
            name="redGreenTest"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>赤緑テスト</InputLabel>
                <Select
                  {...field}
                  label="赤緑テスト"
                >
                  {RED_GREEN_TEST_OPTIONS.map((option) => (
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
              S補正（球面度数補正）
            </Typography>
          </Divider>
        </Grid>
        
        {/* S-Correction */}
        <Grid item xs={6}>
          <Controller
            name="va_S_Correction"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="S補正後視力"
                placeholder="例: 1.2"
                helperText={fieldState.error?.message}
                error={!!fieldState.error}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={6}>
          <Controller
            name="s_S_Correction"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="S補正値"
                placeholder="例: +0.50D"
                helperText={fieldState.error?.message}
                error={!!fieldState.error}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={6}>
          <Controller
            name="clarity_S_Correction"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>S補正後明瞭度</InputLabel>
                <Select
                  {...field}
                  label="S補正後明瞭度"
                >
                  {CLARITY_OPTIONS.map((option) => (
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
            name="clarityDetail_S_Correction"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>明瞭度詳細</InputLabel>
                <Select
                  {...field}
                  label="明瞭度詳細"
                >
                  {CLARITY_DETAIL_OPTIONS.map((option) => (
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
            name="stability_S_Correction"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>S補正後安定性</InputLabel>
                <Select
                  {...field}
                  label="S補正後安定性"
                >
                  {STABILITY_OPTIONS.map((option) => (
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
            name="stabilityDetail_S_Correction"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>安定性詳細</InputLabel>
                <Select
                  {...field}
                  label="安定性詳細"
                >
                  {STABILITY_DETAIL_OPTIONS.map((option) => (
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
              SC補正（球面円柱度数補正）
            </Typography>
          </Divider>
        </Grid>
        
        {/* SC-Correction */}
        <Grid item xs={3}>
          <Controller
            name="va_SC_Correction"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="SC補正後視力"
                placeholder="例: 1.5"
                helperText={fieldState.error?.message}
                error={!!fieldState.error}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={3}>
          <Controller
            name="s_SC_Correction"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="SC補正球面度数"
                placeholder="例: +0.25D"
                helperText={fieldState.error?.message}
                error={!!fieldState.error}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={3}>
          <Controller
            name="c_SC_Correction"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="SC補正円柱度数"
                placeholder="例: -0.50D"
                helperText={fieldState.error?.message}
                error={!!fieldState.error}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={3}>
          <Controller
            name="ax_SC_Correction"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="SC補正軸"
                placeholder="例: 90°"
                helperText={fieldState.error?.message}
                error={!!fieldState.error}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={6}>
          <Controller
            name="clarity_SC_Correction"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>SC補正後明瞭度</InputLabel>
                <Select
                  {...field}
                  label="SC補正後明瞭度"
                >
                  {CLARITY_OPTIONS.map((option) => (
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
            name="clarityDetail_SC_Correction"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>明瞭度詳細</InputLabel>
                <Select
                  {...field}
                  label="明瞭度詳細"
                >
                  {CLARITY_DETAIL_OPTIONS.map((option) => (
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
            name="stability_SC_Correction"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>SC補正後安定性</InputLabel>
                <Select
                  {...field}
                  label="SC補正後安定性"
                >
                  {STABILITY_OPTIONS.map((option) => (
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
            name="stabilityDetail_SC_Correction"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>安定性詳細</InputLabel>
                <Select
                  {...field}
                  label="安定性詳細"
                >
                  {STABILITY_DETAIL_OPTIONS.map((option) => (
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
          矯正視力評価サマリー
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              <Chip 
                label={`レンズなし: ${form.watch('va_WithoutLens') || '-'}`}
                size="small"
                variant="outlined"
              />
              <Chip 
                label={`レンズ装用: ${form.watch('va_WithLens') || '-'}`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip 
                label={`赤緑: ${form.watch('redGreenTest') || '-'}`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">S補正</Typography>
            <Typography variant="body2" fontWeight="bold">
              VA: {form.watch('va_S_Correction') || '-'} / S: {form.watch('s_S_Correction') || '-'}
            </Typography>
            <Typography variant="caption" display="block">
              明瞭度: {form.watch('clarity_S_Correction') || '-'}
            </Typography>
            <Typography variant="caption">
              安定性: {form.watch('stability_S_Correction') || '-'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">SC補正</Typography>
            <Typography variant="body2" fontWeight="bold">
              VA: {form.watch('va_SC_Correction') || '-'}
            </Typography>
            <Typography variant="caption" display="block">
              S: {form.watch('s_SC_Correction') || '-'} / C: {form.watch('c_SC_Correction') || '-'} / Ax: {form.watch('ax_SC_Correction') || '-'}
            </Typography>
            <Typography variant="caption" display="block">
              明瞭度: {form.watch('clarity_SC_Correction') || '-'}
            </Typography>
            <Typography variant="caption">
              安定性: {form.watch('stability_SC_Correction') || '-'}
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