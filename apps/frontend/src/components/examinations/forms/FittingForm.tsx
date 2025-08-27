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
  Paper,
} from '@mui/material';
import { Visibility as EyeIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { fittingSchema, FittingFormData } from '../validation/examinationSchemas';
import { useExaminationForm } from '../contexts/ExaminationFormContext';

interface FittingFormProps {
  examinationId: string;
}

// Options for dropdown selections
const TIMING_OPTIONS = [
  '装用直後',
  '装用30分後',
  '装用1時間後',
  '装用2時間後',
  '装用4時間後',
  '装用終日',
];

const LENS_POSITION_OPTIONS = [
  '中央',
  '上方偏位',
  '下方偏位',
  '鼻側偏位',
  '耳側偏位',
  '不安定',
];

const FITTING_PATTERN_OPTIONS = [
  '適正',
  'タイト',
  'ルーズ',
  '不均一',
  '周辺部タイト',
  '中央部タイト',
];

const WETTABILITY_OPTIONS = [
  '良好',
  'やや不良',
  '不良',
  '部分的不良',
  '非常に良好',
];

const SURFACE_DEPOSIT_OPTIONS = [
  'なし',
  '軽度',
  '中等度',
  '重度',
  '部分的',
];

const LENS_DRYNESS_OPTIONS = [
  'なし',
  '軽度',
  '中等度',
  '重度',
  '部分的',
];

export const FittingForm: React.FC<FittingFormProps> = ({ examinationId }) => {
  const { state, updateFormData, setError, clearError } = useExaminationForm();
  
  // React Hook Form setup for right eye
  const rightForm = useForm<FittingFormData>({
    resolver: zodResolver(fittingSchema),
    defaultValues: {
      visitId: state.visitConfig?.visitId || '',
      surveyId: state.visitConfig?.surveyId || '',
      patientId: state.visitConfig?.patientId || '',
      clinicalStudyId: state.visitConfig?.clinicalStudyId || '',
      organizationId: state.visitConfig?.organizationId || '',
      eyeside: 'Right',
      fittingId: `${examinationId}-right-${Date.now()}`,
      timing: '',
      lensMovement: 0,
      lensPosition: '',
      fittingPattern: '',
      lensWettability: '',
      surfaceDeposit: '',
      lensDryness: '',
      face2_X: 0,
      face2_Y: 0,
    },
  });
  
  // React Hook Form setup for left eye
  const leftForm = useForm<FittingFormData>({
    resolver: zodResolver(fittingSchema),
    defaultValues: {
      visitId: state.visitConfig?.visitId || '',
      surveyId: state.visitConfig?.surveyId || '',
      patientId: state.visitConfig?.patientId || '',
      clinicalStudyId: state.visitConfig?.clinicalStudyId || '',
      organizationId: state.visitConfig?.organizationId || '',
      eyeside: 'Left',
      fittingId: `${examinationId}-left-${Date.now()}`,
      timing: '',
      lensMovement: 0,
      lensPosition: '',
      fittingPattern: '',
      lensWettability: '',
      surfaceDeposit: '',
      lensDryness: '',
      face2_X: 0,
      face2_Y: 0,
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
      setError(examinationId, 'フィッティング検査の入力に不備があります');
    } else {
      clearError(examinationId);
    }
  }, [rightErrors, leftErrors, examinationId, setError, clearError]);
  
  // FACE2 Coordinate Visualization
  const FACE2Visualizer: React.FC<{
    x: number;
    y: number;
    label: string;
  }> = ({ x, y, label }) => (
    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
      <Typography variant="subtitle2" gutterBottom>
        {label} - FACE2座標
      </Typography>
      <Box sx={{ 
        width: 200, 
        height: 200, 
        border: '2px solid #ccc', 
        borderRadius: 1,
        position: 'relative',
        bgcolor: 'white',
        mx: 'auto'
      }}>
        {/* Coordinate grid */}
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '1px',
          bgcolor: '#e0e0e0',
        }} />
        <Box sx={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: '1px',
          bgcolor: '#e0e0e0',
        }} />
        
        {/* Data point */}
        <Box sx={{
          position: 'absolute',
          left: `${50 + (x / 10) * 50}%`,
          top: `${50 - (y / 10) * 50}%`,
          width: 8,
          height: 8,
          bgcolor: 'primary.main',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }} />
        
        {/* Axis labels */}
        <Typography variant="caption" sx={{ 
          position: 'absolute', 
          bottom: -20, 
          left: '50%', 
          transform: 'translateX(-50%)'
        }}>
          X: {x.toFixed(2)}
        </Typography>
        <Typography variant="caption" sx={{ 
          position: 'absolute', 
          left: -25, 
          top: '50%', 
          transform: 'translateY(-50%) rotate(-90deg)',
          transformOrigin: 'center'
        }}>
          Y: {y.toFixed(2)}
        </Typography>
      </Box>
      <Typography variant="caption" display="block" textAlign="center" sx={{ mt: 1 }}>
        範囲: X,Y = -10.0 ～ +10.0
      </Typography>
    </Paper>
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
        レンズフィッティングと涙濡れ性の評価を行ってください。FACE2座標による定量的評価も含めて入力してください。
      </Typography>
      
      <Grid container spacing={2}>
        {/* Timing */}
        <Grid item xs={12}>
          <Controller
            name="timing"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>測定タイミング</InputLabel>
                <Select
                  {...field}
                  label="測定タイミング"
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
              フィッティング評価
            </Typography>
          </Divider>
        </Grid>
        
        {/* Lens Movement */}
        <Grid item xs={12}>
          <Controller
            name="lensMovement"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="レンズ移動度"
                type="number"
                inputProps={{ step: '0.1', min: '-5', max: '5' }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">mm</InputAdornment>
                }}
                helperText={fieldState.error?.message || "瞬目時のレンズ移動量を入力 (-5.0 ～ +5.0mm)"}
                error={!!fieldState.error}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
        </Grid>
        
        {/* Lens Position */}
        <Grid item xs={6}>
          <Controller
            name="lensPosition"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>レンズ位置</InputLabel>
                <Select
                  {...field}
                  label="レンズ位置"
                >
                  {LENS_POSITION_OPTIONS.map((option) => (
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
        
        {/* Fitting Pattern */}
        <Grid item xs={6}>
          <Controller
            name="fittingPattern"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>フィッティングパターン</InputLabel>
                <Select
                  {...field}
                  label="フィッティングパターン"
                >
                  {FITTING_PATTERN_OPTIONS.map((option) => (
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
              涙濡れ性評価
            </Typography>
          </Divider>
        </Grid>
        
        {/* Lens Wettability */}
        <Grid item xs={4}>
          <Controller
            name="lensWettability"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>レンズ濡れ性</InputLabel>
                <Select
                  {...field}
                  label="レンズ濡れ性"
                >
                  {WETTABILITY_OPTIONS.map((option) => (
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
        
        {/* Surface Deposit */}
        <Grid item xs={4}>
          <Controller
            name="surfaceDeposit"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>表面沈着物</InputLabel>
                <Select
                  {...field}
                  label="表面沈着物"
                >
                  {SURFACE_DEPOSIT_OPTIONS.map((option) => (
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
        
        {/* Lens Dryness */}
        <Grid item xs={4}>
          <Controller
            name="lensDryness"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>レンズ乾燥</InputLabel>
                <Select
                  {...field}
                  label="レンズ乾燥"
                >
                  {LENS_DRYNESS_OPTIONS.map((option) => (
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
              FACE2評価
            </Typography>
          </Divider>
        </Grid>
        
        {/* FACE2 Coordinates */}
        <Grid item xs={6}>
          <Controller
            name="face2_X"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="FACE2 X座標"
                type="number"
                inputProps={{ step: '0.1', min: '-10', max: '10' }}
                helperText={fieldState.error?.message || "X座標 (-10.0 ～ +10.0)"}
                error={!!fieldState.error}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={6}>
          <Controller
            name="face2_Y"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="FACE2 Y座標"
                type="number"
                inputProps={{ step: '0.1', min: '-10', max: '10' }}
                helperText={fieldState.error?.message || "Y座標 (-10.0 ～ +10.0)"}
                error={!!fieldState.error}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
        </Grid>
        
        {/* FACE2 Visualization */}
        <Grid item xs={12}>
          <FACE2Visualizer
            x={form.watch('face2_X')}
            y={form.watch('face2_Y')}
            label={eyeside === 'Right' ? '右目' : '左目'}
          />
        </Grid>
      </Grid>
      
      {/* Assessment Summary */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          フィッティング要約
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Typography variant="caption">レンズ移動</Typography>
            <Typography variant="body2" fontWeight="bold">
              {form.watch('lensMovement')}mm
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">レンズ位置</Typography>
            <Typography variant="body2">
              {form.watch('lensPosition') || '未選択'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">濡れ性</Typography>
            <Typography variant="body2">
              {form.watch('lensWettability') || '未選択'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">FACE2座標</Typography>
            <Typography variant="body2" fontWeight="bold">
              ({form.watch('face2_X')}, {form.watch('face2_Y')})
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