import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  IconButton,
  Alert,
  Paper,
  Skeleton,
  Tabs,
  Tab,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Visibility as EyeIcon,
  ArrowBack as ArrowBackIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Compare as CompareIcon,
  Timeline as TimelineIcon,
  Print as PrintIcon,
  GetApp as ExportIcon,
  Info as InfoIcon,
  CheckCircle as CompletedIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { EXAMINATION_CONFIG } from '../examinations/DynamicExaminationForm';
import { examinationService } from '../../services/ExaminationService';
import { useClinicalStudy } from '../../contexts/ClinicalStudyContext';

interface VisitComparisonData {
  visitId: string;
  visitName: string;
  visitDate: string;
  completionStatus: 'completed' | 'partial' | 'not_started';
  examinationData: {
    [examinationId: string]: {
      right?: any;
      left?: any;
    };
  };
  examinationConfig: string[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`examination-tabpanel-${index}`}
    aria-labelledby={`examination-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const ExaminationDataViewer: React.FC = () => {
  const navigate = useNavigate();
  const { visitId } = useParams<{ visitId: string }>();
  const { currentStudy } = useClinicalStudy();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVisitData, setCurrentVisitData] = useState<VisitComparisonData | null>(null);
  const [comparisonVisits, setComparisonVisits] = useState<VisitComparisonData[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedComparisonVisit, setSelectedComparisonVisit] = useState<string | null>(null);

  useEffect(() => {
    if (!visitId) {
      setError('訪問IDが指定されていません');
      return;
    }
    
    loadVisitData();
  }, [visitId]);

  const loadVisitData = async () => {
    try {
      setIsLoading(true);
      
      // Get current visit configuration and data
      const visitConfig = await examinationService.getVisitExaminationConfig(visitId!);
      const examinationData = await examinationService.getAllExaminationData(visitId!);
      
      const currentVisit: VisitComparisonData = {
        visitId: visitId!,
        visitName: visitConfig.visitName,
        visitDate: new Date().toISOString(), // This should come from actual visit data
        completionStatus: 'completed', // This should be calculated based on actual data
        examinationData,
        examinationConfig: visitConfig.examinationOrder,
      };

      setCurrentVisitData(currentVisit);

      // Load comparison visits (other visits from the same survey)
      // This would be implemented with a proper API call
      setComparisonVisits([]); // Placeholder for now

    } catch (error) {
      console.error('Failed to load visit data:', error);
      setError('訪問データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const renderExaminationData = (
    examinationId: string, 
    data: { right?: any; left?: any }, 
    isComparison = false
  ) => {
    const config = EXAMINATION_CONFIG[examinationId as keyof typeof EXAMINATION_CONFIG];
    if (!config) return null;

    const hasRightData = !!data.right;
    const hasLeftData = !!data.left;

    if (!hasRightData && !hasLeftData) {
      return (
        <Alert severity="info" sx={{ my: 2 }}>
          <Typography variant="body2">
            この検査のデータは記録されていません
          </Typography>
        </Alert>
      );
    }

    return (
      <Card sx={{ mt: 2, opacity: isComparison ? 0.8 : 1 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>{config.icon}</span>
              {config.name}
              {isComparison && (
                <Chip label="比較データ" size="small" color="secondary" variant="outlined" />
              )}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Right Eye Data */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: hasRightData ? 'background.paper' : 'grey.50' }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <EyeIcon color="primary" />
                  右目 (Right)
                  {hasRightData ? (
                    <CompletedIcon color="success" fontSize="small" />
                  ) : (
                    <ErrorIcon color="error" fontSize="small" />
                  )}
                </Typography>
                {hasRightData ? (
                  renderFieldData(data.right, examinationId)
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    データなし
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Left Eye Data */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: hasLeftData ? 'background.paper' : 'grey.50' }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <EyeIcon color="secondary" />
                  左目 (Left)
                  {hasLeftData ? (
                    <CompletedIcon color="success" fontSize="small" />
                  ) : (
                    <ErrorIcon color="error" fontSize="small" />
                  )}
                </Typography>
                {hasLeftData ? (
                  renderFieldData(data.left, examinationId)
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    データなし
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Eye Comparison Summary */}
          {hasRightData && hasLeftData && renderEyeComparison(data.right, data.left, examinationId)}
        </CardContent>
      </Card>
    );
  };

  const renderFieldData = (data: any, examinationId: string) => {
    if (!data) return null;

    // This would be customized based on examination type
    switch (examinationId) {
      case 'basic-info':
        return renderBasicInfoData(data);
      case 'vas':
        return renderVASData(data);
      case 'comparative':
        return renderComparativeData(data);
      case 'fitting':
        return renderFittingData(data);
      case 'dr1':
        return renderDR1Data(data);
      case 'corrected-va':
        return renderCorrectedVAData(data);
      case 'lens-inspection':
        return renderLensInspectionData(data);
      case 'questionnaire':
        return renderQuestionnaireData(data);
      default:
        return renderGenericData(data);
    }
  };

  const renderBasicInfoData = (data: any) => (
    <List dense>
      <ListItem>
        <ListItemText primary="現在使用CL" secondary={data.currentUsedCL || 'N/A'} />
      </ListItem>
      <ListItem>
        <ListItemText 
          primary="角膜曲率半径" 
          secondary={`R1: ${data.cr_R1 || 'N/A'}, R2: ${data.cr_R2 || 'N/A'}, Ave: ${data.cr_Ave || 'N/A'}`} 
        />
      </ListItem>
      <ListItem>
        <ListItemText 
          primary="屈折検査" 
          secondary={`VA: ${data.va || 'N/A'}, S: ${data.s || 'N/A'}, C: ${data.c || 'N/A'}, Ax: ${data.ax || 'N/A'}`} 
        />
      </ListItem>
      <ListItem>
        <ListItemText 
          primary="眼圧" 
          secondary={`${data.intraocularPressure1 || 'N/A'} / ${data.intraocularPressure2 || 'N/A'} / ${data.intraocularPressure3 || 'N/A'} mmHg`} 
        />
      </ListItem>
      <ListItem>
        <ListItemText primary="角膜内皮細胞" secondary={`${data.cornealEndothelialCells || 'N/A'} cells/mm²`} />
      </ListItem>
    </List>
  );

  const renderVASData = (data: any) => (
    <Box>
      <List dense>
        <ListItem>
          <ListItemText primary="快適性" secondary={`${data.comfortLevel || 0}/100`} />
          <LinearProgress 
            variant="determinate" 
            value={data.comfortLevel || 0} 
            sx={{ width: 100, ml: 2 }} 
            color="success"
          />
        </ListItem>
        <ListItem>
          <ListItemText primary="乾燥感" secondary={`${data.drynessLevel || 0}/100`} />
          <LinearProgress 
            variant="determinate" 
            value={data.drynessLevel || 0} 
            sx={{ width: 100, ml: 2 }} 
            color="warning"
          />
        </ListItem>
        <ListItem>
          <ListItemText primary="視覚性能（日中）" secondary={`${data.visualPerformance_Daytime || 0}/100`} />
          <LinearProgress 
            variant="determinate" 
            value={data.visualPerformance_Daytime || 0} 
            sx={{ width: 100, ml: 2 }} 
            color="info"
          />
        </ListItem>
        <ListItem>
          <ListItemText primary="視覚性能（終日）" secondary={`${data.visualPerformance_EndOfDay || 0}/100`} />
          <LinearProgress 
            variant="determinate" 
            value={data.visualPerformance_EndOfDay || 0} 
            sx={{ width: 100, ml: 2 }} 
            color="info"
          />
        </ListItem>
      </List>
    </Box>
  );

  const renderComparativeData = (data: any) => (
    <List dense>
      <ListItem>
        <ListItemText primary="快適性" secondary={`${data.comfort || 'N/A'}`} />
      </ListItem>
      <ListItem>
        <ListItemText primary="快適性理由" secondary={data.comfortReason || 'N/A'} />
      </ListItem>
      <ListItem>
        <ListItemText primary="乾燥感" secondary={`${data.dryness || 'N/A'}`} />
      </ListItem>
      <ListItem>
        <ListItemText primary="乾燥感理由" secondary={data.drynessReason || 'N/A'} />
      </ListItem>
      <ListItem>
        <ListItemText primary="総合満足度" secondary={`${data.totalSatisfaction || 'N/A'}`} />
      </ListItem>
    </List>
  );

  const renderFittingData = (data: any) => (
    <List dense>
      <ListItem>
        <ListItemText primary="タイミング" secondary={data.timing || 'N/A'} />
      </ListItem>
      <ListItem>
        <ListItemText primary="レンズ動き" secondary={`${data.lensMovement || 'N/A'} mm`} />
      </ListItem>
      <ListItem>
        <ListItemText primary="レンズ位置" secondary={data.lensPosition || 'N/A'} />
      </ListItem>
      <ListItem>
        <ListItemText primary="フィッティングパターン" secondary={data.fittingPattern || 'N/A'} />
      </ListItem>
      <ListItem>
        <ListItemText primary="FACE2座標" secondary={`X: ${data.face2_X || 'N/A'}, Y: ${data.face2_Y || 'N/A'}`} />
      </ListItem>
    </List>
  );

  const renderDR1Data = (data: any) => (
    <List dense>
      <ListItem>
        <ListItemText primary="涙液破綻時間" secondary={`${data.tearBreakUpTime || 'N/A'} 秒`} />
      </ListItem>
      <ListItem>
        <ListItemText primary="シルマーテスト" secondary={`${data.schirmerTest || 'N/A'} mm`} />
      </ListItem>
      <ListItem>
        <ListItemText primary="涙液メニスカス高" secondary={`${data.tearMeniscusHeight || 'N/A'} mm`} />
      </ListItem>
      <ListItem>
        <ListItemText primary="涙液の質" secondary={data.tearQuality || 'N/A'} />
      </ListItem>
      <ListItem>
        <ListItemText primary="瞬目パターン" secondary={data.blinkingPattern || 'N/A'} />
      </ListItem>
    </List>
  );

  const renderCorrectedVAData = (data: any) => (
    <List dense>
      <ListItem>
        <ListItemText primary="レンズなし視力" secondary={data.va_WithoutLens || 'N/A'} />
      </ListItem>
      <ListItem>
        <ListItemText primary="レンズ装用時視力" secondary={data.va_WithLens || 'N/A'} />
      </ListItem>
      <ListItem>
        <ListItemText primary="S補正後視力" secondary={data.va_S_Correction || 'N/A'} />
      </ListItem>
      <ListItem>
        <ListItemText primary="SC補正後視力" secondary={data.va_SC_Correction || 'N/A'} />
      </ListItem>
      <ListItem>
        <ListItemText primary="明瞭度（S補正）" secondary={data.clarity_S_Correction || 'N/A'} />
      </ListItem>
      <ListItem>
        <ListItemText primary="安定性（S補正）" secondary={data.stability_S_Correction || 'N/A'} />
      </ListItem>
    </List>
  );

  const renderLensInspectionData = (data: any) => (
    <List dense>
      <ListItem>
        <ListItemText primary="レンズ汚れ" secondary={data.lensDeposit || 'N/A'} />
      </ListItem>
      <ListItem>
        <ListItemText primary="レンズ傷・損傷" secondary={data.lensScratchDamage || 'N/A'} />
      </ListItem>
    </List>
  );

  const renderQuestionnaireData = (data: any) => (
    <List dense>
      <ListItem>
        <ListItemText primary="タイミング" secondary={data.timing || 'N/A'} />
      </ListItem>
      <ListItem>
        <ListItemText primary="全体的快適性" secondary={data.comfort || 'N/A'} />
      </ListItem>
      <ListItem>
        <ListItemText primary="全体的乾燥感" secondary={data.dryness || 'N/A'} />
      </ListItem>
      <ListItem>
        <ListItemText primary="視覚性能" secondary={data.visualPerformance || 'N/A'} />
      </ListItem>
      <ListItem>
        <ListItemText primary="総合満足度" secondary={data.totalSatisfaction || 'N/A'} />
      </ListItem>
    </List>
  );

  const renderGenericData = (data: any) => (
    <List dense>
      {Object.entries(data).map(([key, value]) => (
        <ListItem key={key}>
          <ListItemText 
            primary={key} 
            secondary={typeof value === 'object' ? JSON.stringify(value) : String(value || 'N/A')} 
          />
        </ListItem>
      ))}
    </List>
  );

  const renderEyeComparison = (rightData: any, leftData: any, examinationId: string) => {
    // Placeholder for eye comparison logic
    const differences = [];
    
    // Add examination-specific comparison logic here
    if (examinationId === 'vas') {
      const comfortDiff = Math.abs((rightData.comfortLevel || 0) - (leftData.comfortLevel || 0));
      if (comfortDiff > 20) {
        differences.push(`快適性に大きな差があります (差: ${comfortDiff}点)`);
      }
    }
    
    if (differences.length > 0) {
      return (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            左右差の注意点:
          </Typography>
          <List dense>
            {differences.map((diff, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <WarningIcon color="warning" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={diff} />
              </ListItem>
            ))}
          </List>
        </Alert>
      );
    }
    
    return null;
  };

  if (!visitId) {
    return (
      <Alert severity="error">
        訪問IDが指定されていません
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!currentVisitData) {
    return (
      <Alert severity="warning">
        訪問データが見つかりません
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/visits')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          検査データ閲覧
        </Typography>
      </Box>

      {/* Visit Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Visit情報
              </Typography>
              <Typography variant="h6">
                {currentVisitData.visitName}
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
                実施日
              </Typography>
              <Typography variant="body1">
                {new Date(currentVisitData.visitDate).toLocaleDateString('ja-JP')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                ステータス
              </Typography>
              <Chip 
                label={
                  currentVisitData.completionStatus === 'completed' ? '完了' :
                  currentVisitData.completionStatus === 'partial' ? '部分完了' : '未開始'
                }
                color={
                  currentVisitData.completionStatus === 'completed' ? 'success' :
                  currentVisitData.completionStatus === 'partial' ? 'warning' : 'default'
                }
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={comparisonMode}
                  onChange={(e) => setComparisonMode(e.target.checked)}
                />
              }
              label="比較モード"
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<TimelineIcon />} variant="outlined" size="small">
              トレンド表示
            </Button>
            <Button startIcon={<PrintIcon />} variant="outlined" size="small">
              印刷
            </Button>
            <Button startIcon={<ExportIcon />} variant="outlined" size="small">
              エクスポート
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Examination Configuration Display */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>検査構成:</strong> この訪問では以下の検査が実施されています
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          {currentVisitData.examinationConfig.map((examId) => {
            const config = EXAMINATION_CONFIG[examId as keyof typeof EXAMINATION_CONFIG];
            const hasData = !!(currentVisitData.examinationData[examId]?.right || currentVisitData.examinationData[examId]?.left);
            
            return (
              <Chip
                key={examId}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>{config?.icon}</span>
                    <span>{config?.name || examId}</span>
                    {hasData && <CompletedIcon sx={{ fontSize: 16 }} />}
                  </Box>
                }
                color={hasData ? 'success' : 'default'}
                variant="outlined"
                size="small"
              />
            );
          })}
        </Box>
      </Alert>

      {/* Examination Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={selectedTab} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
          >
            {currentVisitData.examinationConfig.map((examId, index) => {
              const config = EXAMINATION_CONFIG[examId as keyof typeof EXAMINATION_CONFIG];
              const hasData = !!(currentVisitData.examinationData[examId]?.right || currentVisitData.examinationData[examId]?.left);
              
              return (
                <Tab
                  key={examId}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{config?.icon}</span>
                      <span>{config?.name || examId}</span>
                      {hasData ? (
                        <CompletedIcon color="success" fontSize="small" />
                      ) : (
                        <InfoIcon color="disabled" fontSize="small" />
                      )}
                    </Box>
                  }
                  id={`examination-tab-${index}`}
                  aria-controls={`examination-tabpanel-${index}`}
                />
              );
            })}
          </Tabs>
        </Box>

        {/* Tab Panels */}
        {currentVisitData.examinationConfig.map((examId, index) => (
          <TabPanel key={examId} value={selectedTab} index={index}>
            {renderExaminationData(
              examId, 
              currentVisitData.examinationData[examId] || {}
            )}
            
            {/* Comparison data if enabled */}
            {comparisonMode && selectedComparisonVisit && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  比較データ
                </Typography>
                {/* This would render comparison visit data */}
                <Alert severity="info">
                  比較機能は実装中です。他の訪問データとの比較がここに表示されます。
                </Alert>
              </Box>
            )}
          </TabPanel>
        ))}
      </Card>
    </Box>
  );
};

export default ExaminationDataViewer;