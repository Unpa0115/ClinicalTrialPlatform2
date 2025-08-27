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
  Chip,
} from '@mui/material';
import { Visibility as EyeIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { lensInspectionSchema, LensInspectionFormData } from '../validation/examinationSchemas';
import { useExaminationForm } from '../contexts/ExaminationFormContext';

interface LensInspectionFormProps {
  examinationId: string;
}

// Options for lens deposit assessment
const LENS_DEPOSIT_OPTIONS = [
  'なし',
  '軽度タンパク質沈着',
  '中等度タンパク質沈着',
  '重度タンパク質沈着',
  '軽度脂質沈着',
  '中等度脂質沈着',
  '重度脂質沈着',
  '混合沈着物（軽度）',
  '混合沈着物（中等度）',
  '混合沈着物（重度）',
  'カルシウム沈着',
  'その他の沈着物',
];

// Options for lens scratch/damage assessment
const LENS_DAMAGE_OPTIONS = [
  'なし',
  '軽微な表面傷',
  '浅い線状傷',
  '深い線状傷',
  '点状傷',
  '放射状傷',
  '辺縁部裂け',
  '中央部裂け',
  '亀裂',
  '穿孔',
  '変形',
  '変色',
  '曇り',
  '部分的欠損',
  '全体的劣化',
];

export const LensInspectionForm: React.FC<LensInspectionFormProps> = ({ examinationId }) => {
  const { state, updateFormData, setError, clearError } = useExaminationForm();
  
  // React Hook Form setup for right eye
  const rightForm = useForm<LensInspectionFormData>({
    resolver: zodResolver(lensInspectionSchema),
    defaultValues: {
      visitId: state.visitConfig?.visitId || '',
      surveyId: state.visitConfig?.surveyId || '',
      patientId: state.visitConfig?.patientId || '',
      clinicalStudyId: state.visitConfig?.clinicalStudyId || '',
      organizationId: state.visitConfig?.organizationId || '',
      eyeside: 'Right',
      lensInspectionId: `${examinationId}-right-${Date.now()}`,
      lensDeposit: '',
      lensScratchDamage: '',
    },
  });
  
  // React Hook Form setup for left eye
  const leftForm = useForm<LensInspectionFormData>({
    resolver: zodResolver(lensInspectionSchema),
    defaultValues: {
      visitId: state.visitConfig?.visitId || '',
      surveyId: state.visitConfig?.surveyId || '',
      patientId: state.visitConfig?.patientId || '',
      clinicalStudyId: state.visitConfig?.clinicalStudyId || '',
      organizationId: state.visitConfig?.organizationId || '',
      eyeside: 'Left',
      lensInspectionId: `${examinationId}-left-${Date.now()}`,
      lensDeposit: '',
      lensScratchDamage: '',
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
      setError(examinationId, 'レンズ検査の入力に不備があります');
    } else {
      clearError(examinationId);
    }
  }, [rightErrors, leftErrors, examinationId, setError, clearError]);
  
  // Assessment severity functions
  const getDepositSeverity = (deposit: string): { level: string; color: string; description: string } => {
    if (deposit === 'なし') return { level: '正常', color: '#4caf50', description: '沈着物なし' };
    if (deposit.includes('軽度')) return { level: '軽度', color: '#ff9800', description: '軽微な沈着' };
    if (deposit.includes('中等度')) return { level: '中等度', color: '#f44336', description: '要注意レベル' };
    if (deposit.includes('重度')) return { level: '重度', color: '#d32f2f', description: '交換推奨' };
    return { level: 'その他', color: '#9e9e9e', description: '詳細評価要' };
  };
  
  const getDamageSeverity = (damage: string): { level: string; color: string; description: string } => {
    if (damage === 'なし') return { level: '正常', color: '#4caf50', description: '損傷なし' };
    if (damage.includes('軽微') || damage.includes('浅い') || damage.includes('点状')) {
      return { level: '軽度', color: '#ff9800', description: '継続使用可' };
    }
    if (damage.includes('深い') || damage.includes('放射状') || damage.includes('裂け') || damage.includes('変形')) {
      return { level: '中度', color: '#f44336', description: '交換検討' };
    }
    if (damage.includes('亀裂') || damage.includes('穿孔') || damage.includes('欠損')) {
      return { level: '重度', color: '#d32f2f', description: '即座に交換' };
    }
    return { level: 'その他', color: '#9e9e9e', description: '詳細評価要' };
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
        コンタクトレンズの状態を詳細に検査してください。沈着物の有無・程度、傷や損傷の状態を記録します。
      </Typography>
      
      <Grid container spacing={3}>
        {/* Lens Deposit Assessment */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            🔬 レンズ汚れ・沈着物評価
          </Typography>
          
          <Controller
            name="lensDeposit"
            control={form.control}
            render={({ field, fieldState }) => {
              const severity = field.value ? getDepositSeverity(field.value) : null;
              
              return (
                <Box>
                  <FormControl fullWidth error={!!fieldState.error}>
                    <InputLabel>レンズ汚れ・沈着物</InputLabel>
                    <Select
                      {...field}
                      label="レンズ汚れ・沈着物"
                    >
                      {LENS_DEPOSIT_OPTIONS.map((option) => (
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
                  
                  {severity && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ color: severity.color, fontWeight: 'bold' }}>
                        評価レベル: {severity.level} - {severity.description}
                      </Typography>
                    </Alert>
                  )}
                </Box>
              );
            }}
          />
        </Grid>
        
        {/* Lens Scratch/Damage Assessment */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            ⚠️ レンズ傷・損傷評価
          </Typography>
          
          <Controller
            name="lensScratchDamage"
            control={form.control}
            render={({ field, fieldState }) => {
              const severity = field.value ? getDamageSeverity(field.value) : null;
              
              return (
                <Box>
                  <FormControl fullWidth error={!!fieldState.error}>
                    <InputLabel>レンズ傷・損傷</InputLabel>
                    <Select
                      {...field}
                      label="レンズ傷・損傷"
                    >
                      {LENS_DAMAGE_OPTIONS.map((option) => (
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
                  
                  {severity && (
                    <Alert 
                      severity={
                        severity.level === '正常' ? 'success' :
                        severity.level === '軽度' ? 'info' :
                        severity.level === '中度' ? 'warning' : 'error'
                      } 
                      sx={{ mt: 2 }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        評価レベル: {severity.level} - {severity.description}
                      </Typography>
                    </Alert>
                  )}
                </Box>
              );
            }}
          />
        </Grid>
        
        {/* Inspection Guidelines */}
        <Grid item xs={12}>
          <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              検査ガイドライン
            </Typography>
            <Typography variant="caption" display="block" paragraph>
              <strong>沈着物評価:</strong> タンパク質沈着（白色）、脂質沈着（油性）、混合沈着物の種類と程度を評価
            </Typography>
            <Typography variant="caption" display="block" paragraph>
              <strong>傷・損傷評価:</strong> 表面傷、亀裂、変形、変色などの物理的損傷を詳細に記録
            </Typography>
            <Typography variant="caption" display="block">
              <strong>交換基準:</strong> 重度沈着、深い傷、亀裂、穿孔がある場合は即座に交換推奨
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      {/* Assessment Summary */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          レンズ状態評価サマリー
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="caption">沈着物状態</Typography>
            <Box sx={{ mt: 0.5 }}>
              {form.watch('lensDeposit') ? (
                <Chip 
                  label={form.watch('lensDeposit')}
                  size="small"
                  sx={{ 
                    bgcolor: getDepositSeverity(form.watch('lensDeposit')).color + '20',
                    color: getDepositSeverity(form.watch('lensDeposit')).color,
                    fontWeight: 'bold'
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">未選択</Typography>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="caption">傷・損傷状態</Typography>
            <Box sx={{ mt: 0.5 }}>
              {form.watch('lensScratchDamage') ? (
                <Chip 
                  label={form.watch('lensScratchDamage')}
                  size="small"
                  sx={{ 
                    bgcolor: getDamageSeverity(form.watch('lensScratchDamage')).color + '20',
                    color: getDamageSeverity(form.watch('lensScratchDamage')).color,
                    fontWeight: 'bold'
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">未選択</Typography>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="caption">総合評価</Typography>
            <Box sx={{ mt: 0.5 }}>
              {form.watch('lensDeposit') && form.watch('lensScratchDamage') ? (
                (() => {
                  const depositSev = getDepositSeverity(form.watch('lensDeposit'));
                  const damageSev = getDamageSeverity(form.watch('lensScratchDamage'));
                  
                  let overallStatus = '良好';
                  let overallColor = '#4caf50';
                  
                  if (depositSev.level === '重度' || damageSev.level === '重度') {
                    overallStatus = '即座に交換';
                    overallColor = '#d32f2f';
                  } else if (depositSev.level === '中等度' || damageSev.level === '中度') {
                    overallStatus = '交換検討';
                    overallColor = '#f44336';
                  } else if (depositSev.level === '軽度' || damageSev.level === '軽度') {
                    overallStatus = '継続観察';
                    overallColor = '#ff9800';
                  }
                  
                  return (
                    <Typography variant="body2" sx={{ color: overallColor, fontWeight: 'bold' }}>
                      {overallStatus}
                    </Typography>
                  );
                })()
              ) : (
                <Typography variant="body2" color="text.secondary">
                  評価完了後に表示されます
                </Typography>
              )}
            </Box>
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