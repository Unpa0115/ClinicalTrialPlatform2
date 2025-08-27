import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Chip,
  LinearProgress,
  IconButton,
  Alert,
  Paper,
  Skeleton,
} from '@mui/material';
import {
  Save as SaveIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Visibility as EyeIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckIcon,
  SkipNext as SkipIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { VisitRecord } from '@clinical-trial/shared';

import { ExaminationFormProvider, useExaminationForm } from './contexts/ExaminationFormContext';
import { 
  getClinicalStudyConfig, 
  getVisitTemplate, 
  getExaminationSteps, 
  getDefaultExaminationOrder,
  ExaminationStep 
} from '../../config/examinationConfigurations';
import { useClinicalStudy } from '../../contexts/ClinicalStudyContext';
import { examinationService } from '../../services/ExaminationService';
import { BasicInfoForm } from './forms/BasicInfoForm';
import { VASForm } from './forms/VASForm';
import { ComparativeForm } from './forms/ComparativeForm';
import { FittingForm } from './forms/FittingForm';
import { DR1Form } from './forms/DR1Form';
import { CorrectedVAForm } from './forms/CorrectedVAForm';
import { LensInspectionForm } from './forms/LensInspectionForm';
import { QuestionnaireForm } from './forms/QuestionnaireForm';

// Examination configuration mapping
export const EXAMINATION_CONFIG = {
  'basic-info': {
    id: 'basic-info',
    name: '基礎情報',
    component: BasicInfoForm,
    icon: '👁️',
    estimatedDuration: 15,
    description: '角膜曲率半径、屈折検査、眼圧測定など',
  },
  'vas': {
    id: 'vas',
    name: 'VAS評価',
    component: VASForm,
    icon: '📊',
    estimatedDuration: 10,
    description: '視覚アナログスケールによる快適性評価',
  },
  'comparative': {
    id: 'comparative',
    name: '相対評価',
    component: ComparativeForm,
    icon: '⚖️',
    estimatedDuration: 12,
    description: '前回レンズとの比較評価',
  },
  'fitting': {
    id: 'fitting',
    name: 'フィッティング検査',
    component: FittingForm,
    icon: '🔍',
    estimatedDuration: 20,
    description: 'レンズフィッティングと涙濡れ性検査',
  },
  'dr1': {
    id: 'dr1',
    name: '涙液層検査',
    component: DR1Form,
    icon: '💧',
    estimatedDuration: 15,
    description: '涙液破綻時間、シルマーテストなど',
  },
  'corrected-va': {
    id: 'corrected-va',
    name: '矯正視力検査',
    component: CorrectedVAForm,
    icon: '👓',
    estimatedDuration: 18,
    description: 'レンズ補正後の視力および安定性評価',
  },
  'lens-inspection': {
    id: 'lens-inspection',
    name: 'レンズ検査',
    component: LensInspectionForm,
    icon: '🔬',
    estimatedDuration: 8,
    description: 'レンズ汚れ、傷・損傷の検査',
  },
  'questionnaire': {
    id: 'questionnaire',
    name: '問診',
    component: QuestionnaireForm,
    icon: '📝',
    estimatedDuration: 25,
    description: '時間帯別症状評価と総合問診',
  },
} as const;

interface ExaminationFormContentProps {
  visitId: string;
}

const ExaminationFormContent: React.FC<ExaminationFormContentProps> = ({ visitId }) => {
  const navigate = useNavigate();
  const { currentStudy } = useClinicalStudy();
  const {
    state,
    setVisitConfig,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    completeStep,
    skipStep,
    saveDraft,
    loadDraft,
    getCurrentExamination,
    isStepCompleted,
    isStepSkipped,
    canCompleteCurrentStep,
    setError,
  } = useExaminationForm();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load visit configuration and draft data on mount
  useEffect(() => {
    const loadVisitData = async () => {
      try {
        // Load visit configuration from DynamoDB
        const visitExaminationConfig = await examinationService.getVisitExaminationConfig(visitId);
        
        // Convert to VisitRecord format for compatibility
        const visitConfig: VisitRecord = {
          surveyId: visitExaminationConfig.surveyId,
          visitId: visitExaminationConfig.visitId,
          clinicalStudyId: visitExaminationConfig.clinicalStudyId,
          organizationId: visitExaminationConfig.organizationId,
          patientId: visitExaminationConfig.patientId,
          visitNumber: 1,
          visitType: visitExaminationConfig.visitType as any,
          visitName: visitExaminationConfig.visitName,
          scheduledDate: new Date().toISOString(),
          windowStartDate: new Date().toISOString(),
          windowEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'in_progress',
          completionPercentage: 0,
          requiredExaminations: visitExaminationConfig.requiredExaminations,
          optionalExaminations: visitExaminationConfig.optionalExaminations,
          examinationOrder: visitExaminationConfig.examinationOrder,
          completedExaminations: [],
          skippedExaminations: [],
          conductedBy: 'current-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        console.log(`✅ Visit設定ロード完了: ${visitConfig.visitName}`);
        console.log(`🔬 必須検査: ${visitConfig.requiredExaminations.join(', ')}`);
        console.log(`📝 任意検査: ${visitConfig.optionalExaminations.join(', ')}`);
        console.log(`⚡ 検査順序: ${visitConfig.examinationOrder.join(' → ')}`);
        
        setVisitConfig(visitConfig);
        
        // Load draft data if available
        await loadDraft(visitId);
      } catch (error) {
        console.error('Failed to load visit data:', error);
        setError('load', '訪問データの読み込みに失敗しました');
      }
    };
    
    loadVisitData();
  }, [visitId, setVisitConfig, loadDraft, setError]);
  
  const handleStepClick = (stepIndex: number) => {
    goToStep(stepIndex);
  };
  
  const handleNext = () => {
    const currentExamination = getCurrentExamination();
    if (currentExamination && canCompleteCurrentStep()) {
      completeStep(currentExamination);
    }
    goToNextStep();
  };
  
  const handleBack = () => {
    goToPreviousStep();
  };
  
  const handleSkipStep = () => {
    const currentExamination = getCurrentExamination();
    if (currentExamination) {
      skipStep(currentExamination);
      goToNextStep();
    }
  };
  
  const handleSaveDraft = async () => {
    await saveDraft();
  };
  
  const handleCompleteExamination = async () => {
    setIsSubmitting(true);
    try {
      // Complete current step if possible
      const currentExamination = getCurrentExamination();
      if (currentExamination && canCompleteCurrentStep()) {
        completeStep(currentExamination);
      }
      
      // Submit all examination data to backend
      await examinationService.submitExaminationData(visitId, {
        formData: state.formData,
        completedExaminations: state.completedSteps,
        conductedBy: 'current-user', // TODO: Get current user from auth context
      });
      
      // Navigate back to visit overview or dashboard
      navigate('/visits/' + visitId);
    } catch (error) {
      setError('submit', '検査データの送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderExaminationForm = (examinationId: string) => {
    const config = EXAMINATION_CONFIG[examinationId as keyof typeof EXAMINATION_CONFIG];
    if (!config) {
      return (
        <Alert severity="error">
          未対応の検査タイプです: {examinationId}
        </Alert>
      );
    }
    
    const FormComponent = config.component;
    return <FormComponent examinationId={examinationId} />;
  };
  
  if (state.isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }
  
  if (!state.visitConfig) {
    return (
      <Alert severity="error">
        訪問データを読み込めませんでした
      </Alert>
    );
  }
  
  const currentExamination = getCurrentExamination();
  const currentConfig = currentExamination ? EXAMINATION_CONFIG[currentExamination as keyof typeof EXAMINATION_CONFIG] : null;
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/visits')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          動的検査データ入力
        </Typography>
      </Box>

      {/* Visit Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Visit名
              </Typography>
              <Typography variant="h6">
                {state.visitConfig.visitName}
              </Typography>
              {currentStudy && (
                <Chip 
                  label={currentStudy.studyName} 
                  size="small" 
                  color="primary" 
                  sx={{ mt: 0.5 }}
                />
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                患者ID
              </Typography>
              <Typography variant="body1">
                {state.visitConfig.patientId}
              </Typography>
            </Grid>
            <Grid item xs={12} md={5}>
              <Typography variant="subtitle2" color="text.secondary">
                進捗状況
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={state.completionPercentage}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2">
                  {state.completedSteps.length}/{state.totalSteps} (
                  {Math.round(state.completionPercentage)}%)
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Dynamic Configuration Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>動的構成:</strong>{' '}
          {currentStudy ? (
            <>
              「{currentStudy.studyName}」の設定に基づいて検査フォームが構成されています。
              この訪問では{state.totalSteps}個の検査ステップが設定されています。
            </>
          ) : (
            <>
              この検査フォームの構成は、臨床試験設定に基づいて自動生成されています。
              この訪問では{state.totalSteps}個の検査ステップが設定されています。
            </>
          )}
        </Typography>
      </Alert>

      {/* Dynamic Step Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            検査ステップ構成 (Visit別動的設定)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {state.examinationOrder.map((examId, index) => {
              const config = EXAMINATION_CONFIG[examId as keyof typeof EXAMINATION_CONFIG];
              const isCompleted = isStepCompleted(examId);
              const isSkipped = isStepSkipped(examId);
              const isCurrent = index === state.currentStep;
              
              return (
                <Chip
                  key={examId}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span>{config?.icon}</span>
                      <span>{config?.name || examId}</span>
                      {isCompleted && <CheckIcon sx={{ fontSize: 16 }} />}
                      {isSkipped && <SkipIcon sx={{ fontSize: 16 }} />}
                    </Box>
                  }
                  color={
                    isCompleted
                      ? 'success'
                      : isSkipped
                        ? 'warning'
                        : isCurrent
                          ? 'primary'
                          : 'default'
                  }
                  variant={isCurrent ? 'filled' : 'outlined'}
                  onClick={() => handleStepClick(index)}
                  sx={{ cursor: 'pointer' }}
                />
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={state.currentStep} alternativeLabel>
            {state.examinationOrder.map((examId, index) => {
              const config = EXAMINATION_CONFIG[examId as keyof typeof EXAMINATION_CONFIG];
              const isCompleted = isStepCompleted(examId);
              const isSkipped = isStepSkipped(examId);
              
              return (
                <Step
                  key={examId}
                  completed={isCompleted}
                >
                  <StepLabel
                    error={isSkipped}
                    onClick={() => handleStepClick(index)}
                    sx={{ cursor: 'pointer' }}
                  >
                    {config?.name || examId}
                    {isSkipped && (
                      <Typography variant="caption" display="block" color="warning.main">
                        スキップ済み
                      </Typography>
                    )}
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </CardContent>
      </Card>

      {/* Current Examination Info */}
      {currentConfig && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            現在の検査: {currentConfig.icon} {currentConfig.name}
          </Typography>
          <Typography variant="body2">
            {currentConfig.description} (予想所要時間: {currentConfig.estimatedDuration}分)
          </Typography>
        </Alert>
      )}

      {/* Error Display */}
      {Object.keys(state.errors).length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {Object.values(state.errors).map((error, index) => (
            <Typography key={index} variant="body2">
              {error}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Examination Form */}
      {currentExamination && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              {currentConfig?.name} - 左右眼データ入力
            </Typography>
            {renderExaminationForm(currentExamination)}
          </CardContent>
        </Card>
      )}

      {/* Navigation and Save Controls */}
      <Paper sx={{ p: 2, position: 'sticky', bottom: 0, zIndex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button
            disabled={!state.canGoBack}
            onClick={handleBack}
            startIcon={<BackIcon />}
          >
            前のステップ
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={handleSaveDraft}
              disabled={state.isDraftSaving}
            >
              {state.isDraftSaving ? '保存中...' : '下書き保存'}
            </Button>

            <Button
              variant="outlined"
              color="warning"
              onClick={handleSkipStep}
              disabled={state.currentStep >= state.totalSteps - 1}
            >
              スキップ
            </Button>

            {state.currentStep === state.totalSteps - 1 ? (
              <Button
                variant="contained"
                color="success"
                onClick={handleCompleteExamination}
                disabled={isSubmitting}
              >
                {isSubmitting ? '送信中...' : '検査完了'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<NextIcon />}
                disabled={!state.canProceedToNext}
              >
                次のステップ
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Auto-save indicator */}
      {state.lastSaved && (
        <Box sx={{ position: 'fixed', bottom: 80, right: 20 }}>
          <Chip
            label={`最終保存: ${state.lastSaved.toLocaleTimeString()}`}
            color="success"
            size="small"
            sx={{ opacity: 0.8 }}
          />
        </Box>
      )}
    </Box>
  );
};

interface DynamicExaminationFormProps {
  visitId?: string;
}

const DynamicExaminationForm: React.FC<DynamicExaminationFormProps> = ({ visitId: propVisitId }) => {
  const { visitId: paramVisitId } = useParams<{ visitId: string }>();
  const visitId = propVisitId || paramVisitId;
  
  if (!visitId) {
    return (
      <Alert severity="error">
        訪問IDが指定されていません
      </Alert>
    );
  }
  
  return (
    <ExaminationFormProvider>
      <ExaminationFormContent visitId={visitId} />
    </ExaminationFormProvider>
  );
};

export default DynamicExaminationForm;