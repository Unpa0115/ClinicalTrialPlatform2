import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  LinearProgress,
  IconButton,
  Alert,

  Paper,
} from '@mui/material';
import {
  Save as SaveIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Visibility as EyeIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Removed TabPanel component as we're using parallel layout instead of tabs

const ExaminationDataEntryMockup: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [vasComfort, setVasComfort] = useState(50);
  const [vasDryness, setVasDryness] = useState(30);

  // Mock visit configuration - dynamic examination steps
  // This configuration would come from the Clinical Study setup
  const visitConfiguration = {
    visitId: 'visit-001',
    visitName: 'ベースライン訪問',
    patientCode: 'P001',
    studyName: 'コンタクトレンズ快適性評価試験',
    // These examination steps are dynamically generated based on
    // the visit template configuration from Clinical Study creation
    examinationOrder: [
      { id: 'basic-info', name: '基礎情報', completed: true },
      { id: 'vas', name: 'VAS評価', completed: false },
      { id: 'comparative', name: '相対評価', completed: false },
      { id: 'fitting', name: 'フィッティング検査', completed: false },
    ],
  };

  // Mock survey data for automatic field population
  const mockSurveyData = {
    surveyId: 'survey-001',
    visitId: 'visit-001',
    patientId: 'patient-001',
    studyId: 'study-001',
  };

  // Example of how different visits would have different configurations:
  // const visitConfigurationExamples = {
  //   'visit-1-baseline': ['basic-info', 'vas', 'comparative', 'fitting'],
  //   'visit-2-1week': ['vas', 'comparative', 'lens-inspection', 'questionnaire'],
  //   'visit-3-1month': ['basic-info', 'vas', 'comparative', 'tear-film', 'corrected-va'],
  // };

  const steps = visitConfiguration.examinationOrder.map((exam) => exam.name);
  const completedSteps = visitConfiguration.examinationOrder.filter(
    (exam) => exam.completed
  ).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSaveDraft = () => {
    // Mock save draft functionality
    alert('下書きが保存されました');
  };

  const renderBasicInfoForm = (eyeside: string) => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          基礎情報入力 ({eyeside === 'Right' ? '右目' : '左目'})
        </Typography>
        {/* Hidden fields for automatic data population */}
        <input type="hidden" name="eyeside" value={eyeside} />
        <input type="hidden" name="surveyId" value={mockSurveyData.surveyId} />
        <input type="hidden" name="visitId" value={mockSurveyData.visitId} />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="現在使用しているコンタクトレンズ"
          placeholder="例: アキュビューオアシス"
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          角膜曲率半径
        </Typography>
      </Grid>
      <Grid item xs={4}>
        <TextField
          fullWidth
          label="R1"
          type="number"
          InputProps={{ endAdornment: 'mm' }}
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          fullWidth
          label="R2"
          type="number"
          InputProps={{ endAdornment: 'mm' }}
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          fullWidth
          label="Ave"
          type="number"
          InputProps={{ endAdornment: 'mm' }}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          屈折検査
        </Typography>
      </Grid>
      <Grid item xs={3}>
        <TextField
          fullWidth
          label="VA"
          type="number"
          inputProps={{ step: '0.1' }}
        />
      </Grid>
      <Grid item xs={3}>
        <TextField
          fullWidth
          label="S"
          type="number"
          inputProps={{ step: '0.25' }}
          InputProps={{ endAdornment: 'D' }}
        />
      </Grid>
      <Grid item xs={3}>
        <TextField
          fullWidth
          label="C"
          type="number"
          inputProps={{ step: '0.25' }}
          InputProps={{ endAdornment: 'D' }}
        />
      </Grid>
      <Grid item xs={3}>
        <TextField
          fullWidth
          label="Ax"
          type="number"
          InputProps={{ endAdornment: '°' }}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          眼圧測定
        </Typography>
      </Grid>
      <Grid item xs={4}>
        <TextField
          fullWidth
          label="測定1"
          type="number"
          InputProps={{ endAdornment: 'mmHg' }}
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          fullWidth
          label="測定2"
          type="number"
          InputProps={{ endAdornment: 'mmHg' }}
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          fullWidth
          label="測定3"
          type="number"
          InputProps={{ endAdornment: 'mmHg' }}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="角膜内皮細胞数"
          type="number"
          InputProps={{ endAdornment: 'cells/mm²' }}
        />
      </Grid>
    </Grid>
  );

  const renderVASForm = (eyeside: string) => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          VAS評価 ({eyeside === 'Right' ? '右目' : '左目'})
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          0-100のスケールで評価
        </Typography>
        {/* Hidden fields for automatic data population */}
        <input type="hidden" name="eyeside" value={eyeside} />
        <input type="hidden" name="surveyId" value={mockSurveyData.surveyId} />
        <input type="hidden" name="visitId" value={mockSurveyData.visitId} />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          快適性レベル
        </Typography>
        <Box sx={{ px: 2 }}>
          <Slider
            value={vasComfort}
            onChange={(_, newValue) => setVasComfort(newValue as number)}
            valueLabelDisplay="on"
            step={1}
            marks
            min={0}
            max={100}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption">非常に不快 (0)</Typography>
            <Typography variant="caption">非常に快適 (100)</Typography>
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          乾燥感レベル
        </Typography>
        <Box sx={{ px: 2 }}>
          <Slider
            value={vasDryness}
            onChange={(_, newValue) => setVasDryness(newValue as number)}
            valueLabelDisplay="on"
            step={1}
            marks
            min={0}
            max={100}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption">全く乾燥しない (0)</Typography>
            <Typography variant="caption">非常に乾燥する (100)</Typography>
          </Box>
        </Box>
      </Grid>

      <Grid item xs={6}>
        <TextField
          fullWidth
          label="日中の視覚性能"
          type="number"
          inputProps={{ min: 0, max: 100 }}
          helperText="0-100で入力"
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="一日の終わりの視覚性能"
          type="number"
          inputProps={{ min: 0, max: 100 }}
          helperText="0-100で入力"
        />
      </Grid>
    </Grid>
  );

  const renderComparativeForm = (eyeside: string) => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          相対評価 ({eyeside === 'Right' ? '右目' : '左目'})
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          前回レンズと比較評価
        </Typography>
        {/* Hidden fields for automatic data population */}
        <input type="hidden" name="eyeside" value={eyeside} />
        <input type="hidden" name="surveyId" value={mockSurveyData.surveyId} />
        <input type="hidden" name="visitId" value={mockSurveyData.visitId} />
      </Grid>

      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>快適性</InputLabel>
          <Select>
            <MenuItem value="much_better">大幅に良い</MenuItem>
            <MenuItem value="better">良い</MenuItem>
            <MenuItem value="same">同じ</MenuItem>
            <MenuItem value="worse">悪い</MenuItem>
            <MenuItem value="much_worse">大幅に悪い</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="快適性の理由"
          multiline
          rows={2}
          placeholder="評価の理由を入力してください"
        />
      </Grid>

      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>乾燥感</InputLabel>
          <Select>
            <MenuItem value="much_better">大幅に良い</MenuItem>
            <MenuItem value="better">良い</MenuItem>
            <MenuItem value="same">同じ</MenuItem>
            <MenuItem value="worse">悪い</MenuItem>
            <MenuItem value="much_worse">大幅に悪い</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="乾燥感の理由"
          multiline
          rows={2}
          placeholder="評価の理由を入力してください"
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          視覚性能評価
        </Typography>
      </Grid>

      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>デジタルデバイス使用時</InputLabel>
          <Select>
            <MenuItem value="much_better">大幅に良い</MenuItem>
            <MenuItem value="better">良い</MenuItem>
            <MenuItem value="same">同じ</MenuItem>
            <MenuItem value="worse">悪い</MenuItem>
            <MenuItem value="much_worse">大幅に悪い</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="理由"
          placeholder="評価の理由を入力してください"
        />
      </Grid>

      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>眼精疲労</InputLabel>
          <Select>
            <MenuItem value="much_better">大幅に良い</MenuItem>
            <MenuItem value="better">良い</MenuItem>
            <MenuItem value="same">同じ</MenuItem>
            <MenuItem value="worse">悪い</MenuItem>
            <MenuItem value="much_worse">大幅に悪い</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="総合満足度"
          placeholder="総合的な満足度の理由"
        />
      </Grid>
    </Grid>
  );

  const renderCurrentStepContent = (eyeside: string) => {
    switch (activeStep) {
      case 0:
        return renderBasicInfoForm(eyeside);
      case 1:
        return renderVASForm(eyeside);
      case 2:
        return renderComparativeForm(eyeside);
      case 3:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              フィッティング検査 ({eyeside === 'Right' ? '右目' : '左目'})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              実装予定
            </Typography>
            <input type="hidden" name="eyeside" value={eyeside} />
            <input type="hidden" name="surveyId" value={mockSurveyData.surveyId} />
            <input type="hidden" name="visitId" value={mockSurveyData.visitId} />
          </Box>
        );
      default:
        return (
          <Box>
            <Typography variant="subtitle1">不明なステップです</Typography>
            <input type="hidden" name="eyeside" value={eyeside} />
            <input type="hidden" name="surveyId" value={mockSurveyData.surveyId} />
            <input type="hidden" name="visitId" value={mockSurveyData.visitId} />
          </Box>
        );
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
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
                患者コード
              </Typography>
              <Typography variant="h6">
                {visitConfiguration.patientCode}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Visit名
              </Typography>
              <Typography variant="body1">
                {visitConfiguration.visitName}
              </Typography>
            </Grid>
            <Grid item xs={12} md={5}>
              <Typography variant="subtitle2" color="text.secondary">
                進捗状況
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={progressPercentage}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2">
                  {completedSteps}/{steps.length} (
                  {Math.round(progressPercentage)}%)
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
          この検査フォームの構成は、臨床試験作成で設定されたVisitテンプレートに基づいて自動生成されています。
          異なるVisitでは、設定された検査項目に応じて表示される検査ステップが動的に変更されます。
        </Typography>
      </Alert>

      {/* Dynamic Step Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            検査ステップ構成 (Visit別動的設定)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {visitConfiguration.examinationOrder.map((exam, index) => (
              <Chip
                key={exam.id}
                label={exam.name}
                color={
                  exam.completed
                    ? 'success'
                    : index === activeStep
                      ? 'primary'
                      : 'default'
                }
                variant={index === activeStep ? 'filled' : 'outlined'}
                onClick={() => setActiveStep(index)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step
                key={label}
                completed={visitConfiguration.examinationOrder[index].completed}
              >
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Left/Right Eye Parallel Input */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            {steps[activeStep]} - 左右眼データ入力
          </Typography>
          
          <Grid container spacing={3}>
            {/* Right Eye Column */}
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                border: '2px solid #1976d2', 
                borderRadius: 2, 
                p: 2,
                backgroundColor: '#f3f7ff'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EyeIcon sx={{ mr: 1, color: '#1976d2' }} />
                  <Typography variant="h6" color="#1976d2">
                    右目 (Right)
                  </Typography>
                </Box>
                <Alert severity="info" sx={{ mb: 2, fontSize: '0.875rem' }}>
                  Eyeside: "Right", SurveyId: {mockSurveyData.surveyId}, VisitId: {mockSurveyData.visitId}
                </Alert>
                {renderCurrentStepContent('Right')}
              </Box>
            </Grid>

            {/* Left Eye Column */}
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                border: '2px solid #d32f2f', 
                borderRadius: 2, 
                p: 2,
                backgroundColor: '#fff3f3'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EyeIcon sx={{ mr: 1, color: '#d32f2f' }} />
                  <Typography variant="h6" color="#d32f2f">
                    左目 (Left)
                  </Typography>
                </Box>
                <Alert severity="info" sx={{ mb: 2, fontSize: '0.875rem' }}>
                  Eyeside: "Left", SurveyId: {mockSurveyData.surveyId}, VisitId: {mockSurveyData.visitId}
                </Alert>
                {renderCurrentStepContent('Left')}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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
            disabled={activeStep === 0}
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
            >
              下書き保存
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button variant="contained" color="success">
                検査完了
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<NextIcon />}
              >
                次のステップ
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Auto-save indicator */}
      <Box sx={{ position: 'fixed', bottom: 80, right: 20 }}>
        <Chip
          label="自動保存済み"
          color="success"
          size="small"
          sx={{ opacity: 0.8 }}
        />
      </Box>
    </Box>
  );
};

export default ExaminationDataEntryMockup;
