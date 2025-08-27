import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  Divider,
  Switch,
  FormControlLabel,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Visibility as EyeIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  CompareArrows as CompareIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { EXAMINATION_CONFIG } from '../examinations/DynamicExaminationForm';
import VASVisualization from './VASVisualization';

interface VisitData {
  visitId: string;
  visitName: string;
  visitDate: string;
  visitType: string;
  examinationData: {
    [examinationId: string]: {
      right?: any;
      left?: any;
    };
  };
}

interface ComparisonResult {
  field: string;
  baselineValue: any;
  currentValue: any;
  change: number | string;
  changeType: 'improvement' | 'deterioration' | 'stable' | 'significant_change';
  significance: 'high' | 'medium' | 'low';
  eyeside: 'right' | 'left' | 'both';
}

interface VisitComparisonViewProps {
  baselineVisit: VisitData;
  currentVisit: VisitData;
  onExaminationSelect?: (examinationId: string) => void;
}

const VisitComparisonView: React.FC<VisitComparisonViewProps> = ({
  baselineVisit,
  currentVisit,
  onExaminationSelect,
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [showOnlyChanges, setShowOnlyChanges] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [selectedExamination, setSelectedExamination] = useState<string | null>(null);

  const getComparisons = (examinationId: string): ComparisonResult[] => {
    const baselineData = baselineVisit.examinationData[examinationId];
    const currentData = currentVisit.examinationData[examinationId];
    
    if (!baselineData || !currentData) return [];

    const comparisons: ComparisonResult[] = [];

    // Compare right eye data
    if (baselineData.right && currentData.right) {
      const rightComparisons = compareExaminationData(
        baselineData.right,
        currentData.right,
        examinationId,
        'right'
      );
      comparisons.push(...rightComparisons);
    }

    // Compare left eye data  
    if (baselineData.left && currentData.left) {
      const leftComparisons = compareExaminationData(
        baselineData.left,
        currentData.left,
        examinationId,
        'left'
      );
      comparisons.push(...leftComparisons);
    }

    return comparisons;
  };

  const compareExaminationData = (
    baselineData: any,
    currentData: any,
    examinationId: string,
    eyeside: 'right' | 'left'
  ): ComparisonResult[] => {
    const results: ComparisonResult[] = [];

    // Examination-specific comparison logic
    switch (examinationId) {
      case 'basic-info':
        results.push(...compareBasicInfo(baselineData, currentData, eyeside));
        break;
      case 'vas':
        results.push(...compareVAS(baselineData, currentData, eyeside));
        break;
      case 'comparative':
        results.push(...compareComparative(baselineData, currentData, eyeside));
        break;
      case 'fitting':
        results.push(...compareFitting(baselineData, currentData, eyeside));
        break;
      case 'dr1':
        results.push(...compareDR1(baselineData, currentData, eyeside));
        break;
      case 'corrected-va':
        results.push(...compareCorrectedVA(baselineData, currentData, eyeside));
        break;
      case 'lens-inspection':
        results.push(...compareLensInspection(baselineData, currentData, eyeside));
        break;
      case 'questionnaire':
        results.push(...compareQuestionnaire(baselineData, currentData, eyeside));
        break;
    }

    return results;
  };

  const compareBasicInfo = (baseline: any, current: any, eyeside: 'right' | 'left'): ComparisonResult[] => {
    const results: ComparisonResult[] = [];

    // Visual Acuity
    if (baseline.va && current.va) {
      const change = parseFloat(current.va) - parseFloat(baseline.va);
      results.push({
        field: `視力 (${eyeside === 'right' ? '右' : '左'})`,
        baselineValue: baseline.va,
        currentValue: current.va,
        change: change.toFixed(2),
        changeType: change > 0.1 ? 'improvement' : change < -0.1 ? 'deterioration' : 'stable',
        significance: Math.abs(change) > 0.2 ? 'high' : Math.abs(change) > 0.1 ? 'medium' : 'low',
        eyeside,
      });
    }

    // Intraocular Pressure (average of three measurements)
    if (baseline.intraocularPressure1 && current.intraocularPressure1) {
      const baselineAvg = (baseline.intraocularPressure1 + baseline.intraocularPressure2 + baseline.intraocularPressure3) / 3;
      const currentAvg = (current.intraocularPressure1 + current.intraocularPressure2 + current.intraocularPressure3) / 3;
      const change = currentAvg - baselineAvg;
      
      results.push({
        field: `眼圧 (${eyeside === 'right' ? '右' : '左'})`,
        baselineValue: `${baselineAvg.toFixed(1)} mmHg`,
        currentValue: `${currentAvg.toFixed(1)} mmHg`,
        change: `${change >= 0 ? '+' : ''}${change.toFixed(1)} mmHg`,
        changeType: change > 2 ? 'deterioration' : change < -2 ? 'improvement' : 'stable',
        significance: Math.abs(change) > 3 ? 'high' : Math.abs(change) > 2 ? 'medium' : 'low',
        eyeside,
      });
    }

    return results;
  };

  const compareVAS = (baseline: any, current: any, eyeside: 'right' | 'left'): ComparisonResult[] => {
    const results: ComparisonResult[] = [];
    
    const vasFields = [
      { key: 'comfortLevel', label: '快適性', higher_better: true },
      { key: 'drynessLevel', label: '乾燥感', higher_better: false },
      { key: 'visualPerformance_Daytime', label: '視覚性能（日中）', higher_better: true },
      { key: 'visualPerformance_EndOfDay', label: '視覚性能（終日）', higher_better: true },
    ];

    vasFields.forEach(field => {
      if (baseline[field.key] !== undefined && current[field.key] !== undefined) {
        const change = current[field.key] - baseline[field.key];
        const isImprovement = field.higher_better ? change > 0 : change < 0;
        
        results.push({
          field: `${field.label} (${eyeside === 'right' ? '右' : '左'})`,
          baselineValue: `${baseline[field.key]}/100`,
          currentValue: `${current[field.key]}/100`,
          change: `${change >= 0 ? '+' : ''}${change}`,
          changeType: Math.abs(change) < 5 ? 'stable' : isImprovement ? 'improvement' : 'deterioration',
          significance: Math.abs(change) > 20 ? 'high' : Math.abs(change) > 10 ? 'medium' : 'low',
          eyeside,
        });
      }
    });

    return results;
  };

  const compareComparative = (baseline: any, current: any, eyeside: 'right' | 'left'): ComparisonResult[] => {
    const results: ComparisonResult[] = [];
    
    // Compare categorical ratings
    const comparativeFields = ['comfort', 'dryness', 'totalSatisfaction'];
    
    comparativeFields.forEach(field => {
      if (baseline[field] && current[field] && baseline[field] !== current[field]) {
        results.push({
          field: `${field} (${eyeside === 'right' ? '右' : '左'})`,
          baselineValue: baseline[field],
          currentValue: current[field],
          change: '変更あり',
          changeType: 'significant_change',
          significance: 'medium',
          eyeside,
        });
      }
    });

    return results;
  };

  const compareFitting = (baseline: any, current: any, eyeside: 'right' | 'left'): ComparisonResult[] => {
    const results: ComparisonResult[] = [];
    
    // Compare lens movement
    if (baseline.lensMovement !== undefined && current.lensMovement !== undefined) {
      const change = current.lensMovement - baseline.lensMovement;
      
      results.push({
        field: `レンズ動き (${eyeside === 'right' ? '右' : '左'})`,
        baselineValue: `${baseline.lensMovement} mm`,
        currentValue: `${current.lensMovement} mm`,
        change: `${change >= 0 ? '+' : ''}${change.toFixed(1)} mm`,
        changeType: Math.abs(change) < 0.1 ? 'stable' : 'significant_change',
        significance: Math.abs(change) > 0.5 ? 'high' : Math.abs(change) > 0.2 ? 'medium' : 'low',
        eyeside,
      });
    }

    return results;
  };

  const compareDR1 = (baseline: any, current: any, eyeside: 'right' | 'left'): ComparisonResult[] => {
    const results: ComparisonResult[] = [];
    
    // Compare tear break-up time
    if (baseline.tearBreakUpTime !== undefined && current.tearBreakUpTime !== undefined) {
      const change = current.tearBreakUpTime - baseline.tearBreakUpTime;
      
      results.push({
        field: `涙液破綻時間 (${eyeside === 'right' ? '右' : '左'})`,
        baselineValue: `${baseline.tearBreakUpTime} 秒`,
        currentValue: `${current.tearBreakUpTime} 秒`,
        change: `${change >= 0 ? '+' : ''}${change} 秒`,
        changeType: change > 1 ? 'improvement' : change < -1 ? 'deterioration' : 'stable',
        significance: Math.abs(change) > 3 ? 'high' : Math.abs(change) > 1 ? 'medium' : 'low',
        eyeside,
      });
    }

    // Compare Schirmer test
    if (baseline.schirmerTest !== undefined && current.schirmerTest !== undefined) {
      const change = current.schirmerTest - baseline.schirmerTest;
      
      results.push({
        field: `シルマーテスト (${eyeside === 'right' ? '右' : '左'})`,
        baselineValue: `${baseline.schirmerTest} mm`,
        currentValue: `${current.schirmerTest} mm`,
        change: `${change >= 0 ? '+' : ''}${change} mm`,
        changeType: change > 2 ? 'improvement' : change < -2 ? 'deterioration' : 'stable',
        significance: Math.abs(change) > 5 ? 'high' : Math.abs(change) > 2 ? 'medium' : 'low',
        eyeside,
      });
    }

    return results;
  };

  const compareCorrectedVA = (baseline: any, current: any, eyeside: 'right' | 'left'): ComparisonResult[] => {
    const results: ComparisonResult[] = [];
    
    // Compare corrected visual acuity fields
    const vaFields = ['va_WithLens', 'va_S_Correction', 'va_SC_Correction'];
    
    vaFields.forEach(field => {
      if (baseline[field] && current[field] && baseline[field] !== current[field]) {
        results.push({
          field: `${field} (${eyeside === 'right' ? '右' : '左'})`,
          baselineValue: baseline[field],
          currentValue: current[field],
          change: '変更あり',
          changeType: 'significant_change',
          significance: 'medium',
          eyeside,
        });
      }
    });

    return results;
  };

  const compareLensInspection = (baseline: any, current: any, eyeside: 'right' | 'left'): ComparisonResult[] => {
    const results: ComparisonResult[] = [];
    
    const inspectionFields = ['lensDeposit', 'lensScratchDamage'];
    
    inspectionFields.forEach(field => {
      if (baseline[field] && current[field] && baseline[field] !== current[field]) {
        const isWorse = current[field] === '多い' || current[field] === '重度' || current[field] === 'あり';
        
        results.push({
          field: `${field === 'lensDeposit' ? 'レンズ汚れ' : 'レンズ傷・損傷'} (${eyeside === 'right' ? '右' : '左'})`,
          baselineValue: baseline[field],
          currentValue: current[field],
          change: '変更あり',
          changeType: isWorse ? 'deterioration' : 'improvement',
          significance: 'medium',
          eyeside,
        });
      }
    });

    return results;
  };

  const compareQuestionnaire = (baseline: any, current: any, eyeside: 'right' | 'left'): ComparisonResult[] => {
    const results: ComparisonResult[] = [];
    
    // Compare key questionnaire fields
    const questionnaireFields = [
      'comfort', 'dryness', 'visualPerformance', 
      'eyeStrain', 'totalSatisfaction'
    ];
    
    questionnaireFields.forEach(field => {
      if (baseline[field] && current[field] && baseline[field] !== current[field]) {
        results.push({
          field: `${field} (${eyeside === 'right' ? '右' : '左'})`,
          baselineValue: baseline[field],
          currentValue: current[field],
          change: '変更あり',
          changeType: 'significant_change',
          significance: 'medium',
          eyeside,
        });
      }
    });

    return results;
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'improvement':
        return <TrendingUpIcon color="success" fontSize="small" />;
      case 'deterioration':
        return <TrendingDownIcon color="error" fontSize="small" />;
      case 'significant_change':
        return <InfoIcon color="info" fontSize="small" />;
      case 'stable':
      default:
        return <TrendingFlatIcon color="action" fontSize="small" />;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'improvement':
        return 'success';
      case 'deterioration':
        return 'error';
      case 'significant_change':
        return 'info';
      case 'stable':
      default:
        return 'default';
    }
  };

  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'info';
    }
  };

  const toggleSection = (examinationId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [examinationId]: !prev[examinationId]
    }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const getAllComparisons = () => {
    const allComparisons: { [examinationId: string]: ComparisonResult[] } = {};
    
    // Get examinations present in both visits
    const commonExaminations = Object.keys(baselineVisit.examinationData).filter(
      examId => currentVisit.examinationData[examId]
    );

    commonExaminations.forEach(examId => {
      const comparisons = getComparisons(examId);
      if (comparisons.length > 0) {
        allComparisons[examId] = comparisons;
      }
    });

    return allComparisons;
  };

  const renderComparisonTable = (comparisons: ComparisonResult[]) => {
    const filteredComparisons = showOnlyChanges 
      ? comparisons.filter(c => c.changeType !== 'stable')
      : comparisons;

    if (filteredComparisons.length === 0) {
      return (
        <Alert severity="info">
          {showOnlyChanges ? '変化のある項目はありません。' : 'データがありません。'}
        </Alert>
      );
    }

    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>項目</TableCell>
              <TableCell>ベースライン値</TableCell>
              <TableCell>現在値</TableCell>
              <TableCell>変化</TableCell>
              <TableCell>重要度</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredComparisons.map((comparison, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EyeIcon 
                      color={comparison.eyeside === 'right' ? 'primary' : 'secondary'} 
                      fontSize="small" 
                    />
                    {comparison.field}
                  </Box>
                </TableCell>
                <TableCell>{comparison.baselineValue}</TableCell>
                <TableCell>{comparison.currentValue}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getChangeIcon(comparison.changeType)}
                    <Chip
                      label={comparison.change}
                      color={getChangeColor(comparison.changeType) as any}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={comparison.significance === 'high' ? '高' : comparison.significance === 'medium' ? '中' : '低'}
                    color={getSignificanceColor(comparison.significance) as any}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderVASComparison = () => {
    const baselineVAS = baselineVisit.examinationData['vas'];
    const currentVAS = currentVisit.examinationData['vas'];

    if (!baselineVAS || !currentVAS) {
      return (
        <Alert severity="info">
          VAS評価のデータが不足しています。
        </Alert>
      );
    }

    // Prepare data for VAS visualization
    const rightEyeData = {
      current: currentVAS.right || {},
      previous: baselineVAS.right,
    };

    const leftEyeData = {
      current: currentVAS.left || {},
      previous: baselineVAS.left,
    };

    return (
      <VASVisualization
        rightEyeData={rightEyeData}
        leftEyeData={leftEyeData}
        visitName={`${baselineVisit.visitName} vs ${currentVisit.visitName}`}
        showComparison={true}
      />
    );
  };

  const allComparisons = getAllComparisons();
  const examinationIds = Object.keys(allComparisons);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Visit間比較分析
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
              <Typography variant="subtitle2" color="primary">
                ベースライン
              </Typography>
              <Typography variant="h6">
                {baselineVisit.visitName}
              </Typography>
              <Typography variant="caption">
                {new Date(baselineVisit.visitDate).toLocaleDateString('ja-JP')}
              </Typography>
            </Paper>
          </Grid>
          <Grid item>
            <CompareIcon color="action" sx={{ fontSize: 40 }} />
          </Grid>
          <Grid item>
            <Paper sx={{ p: 2, bgcolor: 'secondary.50' }}>
              <Typography variant="subtitle2" color="secondary">
                現在
              </Typography>
              <Typography variant="h6">
                {currentVisit.visitName}
              </Typography>
              <Typography variant="caption">
                {new Date(currentVisit.visitDate).toLocaleDateString('ja-JP')}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={showOnlyChanges}
              onChange={(e) => setShowOnlyChanges(e.target.checked)}
            />
          }
          label="変化のある項目のみ表示"
        />
      </Paper>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={handleTabChange}>
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon />
                  全体サマリー
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimelineIcon />
                  VAS比較
                </Box>
              } 
            />
            {examinationIds.map((examId, index) => {
              const config = EXAMINATION_CONFIG[examId as keyof typeof EXAMINATION_CONFIG];
              return (
                <Tab
                  key={examId}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{config?.icon}</span>
                      {config?.name || examId}
                    </Box>
                  }
                />
              );
            })}
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <CardContent>
          {/* Overall Summary */}
          {selectedTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                変化サマリー
              </Typography>
              {examinationIds.map(examId => {
                const config = EXAMINATION_CONFIG[examId as keyof typeof EXAMINATION_CONFIG];
                const comparisons = allComparisons[examId];
                const significantChanges = comparisons.filter(c => c.significance === 'high' || c.changeType !== 'stable');
                
                return (
                  <Card key={examId} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => toggleSection(examId)}
                      >
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{config?.icon}</span>
                          {config?.name || examId}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label={`${significantChanges.length}個の変化`}
                            color={significantChanges.length > 0 ? 'warning' : 'success'}
                            size="small"
                          />
                          <IconButton>
                            {expandedSections[examId] ? <CollapseIcon /> : <ExpandIcon />}
                          </IconButton>
                        </Box>
                      </Box>
                      
                      <Collapse in={expandedSections[examId]}>
                        <Box sx={{ mt: 2 }}>
                          {renderComparisonTable(comparisons)}
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}

          {/* VAS Comparison */}
          {selectedTab === 1 && renderVASComparison()}

          {/* Individual Examination Comparisons */}
          {selectedTab >= 2 && (
            <Box>
              {(() => {
                const examId = examinationIds[selectedTab - 2];
                const config = EXAMINATION_CONFIG[examId as keyof typeof EXAMINATION_CONFIG];
                const comparisons = allComparisons[examId];
                
                return (
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{config?.icon}</span>
                      {config?.name || examId} - 詳細比較
                    </Typography>
                    {renderComparisonTable(comparisons)}
                  </Box>
                );
              })()}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default VisitComparisonView;