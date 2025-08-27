import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  LinearProgress,
  Chip,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  SentimentVeryDissatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  SentimentSatisfied,
  SentimentVerySatisfied,
  Visibility as EyeIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';

interface VASData {
  comfortLevel: number;
  drynessLevel: number;
  visualPerformance_Daytime: number;
  visualPerformance_EndOfDay: number;
}

interface VASComparisonData {
  current: VASData;
  previous?: VASData;
  trend?: {
    comfort: 'up' | 'down' | 'stable';
    dryness: 'up' | 'down' | 'stable';
    visualDaytime: 'up' | 'down' | 'stable';
    visualEndDay: 'up' | 'down' | 'stable';
  };
}

interface VASVisualizationProps {
  rightEyeData: VASComparisonData;
  leftEyeData: VASComparisonData;
  visitName?: string;
  showComparison?: boolean;
  showTrends?: boolean;
}

const VASVisualization: React.FC<VASVisualizationProps> = ({
  rightEyeData,
  leftEyeData,
  visitName = 'Current Visit',
  showComparison = false,
  showTrends = false,
}) => {
  
  const getSentimentIcon = (score: number, size: 'small' | 'medium' | 'large' = 'medium') => {
    const iconProps = { fontSize: size };
    
    if (score >= 80) return <SentimentVerySatisfied color="success" {...iconProps} />;
    if (score >= 60) return <SentimentSatisfied color="success" {...iconProps} />;
    if (score >= 40) return <SentimentNeutral color="warning" {...iconProps} />;
    if (score >= 20) return <SentimentDissatisfied color="error" {...iconProps} />;
    return <SentimentVeryDissatisfied color="error" {...iconProps} />;
  };

  const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 60) return 'success';
    if (score >= 30) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return '非常に良好';
    if (score >= 60) return '良好';
    if (score >= 40) return '普通';
    if (score >= 20) return '不良';
    return '非常に不良';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon color="success" fontSize="small" />;
      case 'down':
        return <TrendingDownIcon color="error" fontSize="small" />;
      case 'stable':
        return <TrendingFlatIcon color="info" fontSize="small" />;
    }
  };

  const getTrendLabel = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return '改善';
      case 'down':
        return '悪化';
      case 'stable':
        return '安定';
    }
  };

  const calculateChange = (current: number, previous?: number): number | null => {
    if (previous === undefined) return null;
    return current - previous;
  };

  const renderVASScale = (
    label: string,
    currentScore: number,
    previousScore?: number,
    isInverted: boolean = false, // For dryness (lower is better)
    unit: string = 'points'
  ) => {
    const change = calculateChange(currentScore, previousScore);
    const displayColor = isInverted 
      ? getScoreColor(100 - currentScore) 
      : getScoreColor(currentScore);
    
    const displayScore = isInverted ? 100 - currentScore : currentScore;

    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            {label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getSentimentIcon(displayScore, 'small')}
            <Typography variant="body2" color="text.secondary">
              {currentScore}/{100} {unit}
            </Typography>
          </Box>
        </Box>

        {/* Visual Scale */}
        <Box sx={{ position: 'relative', mb: 1 }}>
          <LinearProgress
            variant="determinate"
            value={currentScore}
            color={displayColor}
            sx={{
              height: 12,
              borderRadius: 6,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 6,
                transition: 'transform 0.4s ease',
              },
            }}
          />
          
          {/* Score marker */}
          <Box
            sx={{
              position: 'absolute',
              left: `${currentScore}%`,
              top: -2,
              transform: 'translateX(-50%)',
              width: 16,
              height: 16,
              bgcolor: 'white',
              border: 2,
              borderColor: displayColor === 'success' ? 'success.main' : 
                         displayColor === 'warning' ? 'warning.main' : 'error.main',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                bgcolor: displayColor === 'success' ? 'success.main' : 
                       displayColor === 'warning' ? 'warning.main' : 'error.main',
                borderRadius: '50%',
              }}
            />
          </Box>
        </Box>

        {/* Scale labels */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            0 (最小)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            50
          </Typography>
          <Typography variant="caption" color="text.secondary">
            100 (最大)
          </Typography>
        </Box>

        {/* Score interpretation and change */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip
            label={getScoreLabel(displayScore)}
            color={displayColor}
            size="small"
            variant="outlined"
          />
          
          {showComparison && change !== null && (
            <Chip
              label={`${change >= 0 ? '+' : ''}${change}pts`}
              color={change > 5 ? 'success' : change < -5 ? 'error' : 'default'}
              size="small"
              icon={change > 5 ? <TrendingUpIcon /> : change < -5 ? <TrendingDownIcon /> : <TrendingFlatIcon />}
            />
          )}
        </Box>
      </Box>
    );
  };

  const renderEyeData = (
    eyeLabel: string,
    data: VASComparisonData,
    eyeIcon: React.ReactNode
  ) => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          {eyeIcon}
          {eyeLabel}
        </Typography>

        {renderVASScale(
          '快適性レベル',
          data.current.comfortLevel,
          data.previous?.comfortLevel,
          false,
          'points'
        )}

        {renderVASScale(
          '乾燥感レベル',
          data.current.drynessLevel,
          data.previous?.drynessLevel,
          true, // Inverted - lower dryness is better
          'points'
        )}

        {renderVASScale(
          '視覚性能（日中）',
          data.current.visualPerformance_Daytime,
          data.previous?.visualPerformance_Daytime,
          false,
          'points'
        )}

        {renderVASScale(
          '視覚性能（終日）',
          data.current.visualPerformance_EndOfDay,
          data.previous?.visualPerformance_EndOfDay,
          false,
          'points'
        )}

        {/* Trend Summary */}
        {showTrends && data.trend && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              傾向分析
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {getTrendIcon(data.trend.comfort)}
                  <Typography variant="caption">
                    快適性: {getTrendLabel(data.trend.comfort)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {getTrendIcon(data.trend.dryness)}
                  <Typography variant="caption">
                    乾燥感: {getTrendLabel(data.trend.dryness)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {getTrendIcon(data.trend.visualDaytime)}
                  <Typography variant="caption">
                    視覚日中: {getTrendLabel(data.trend.visualDaytime)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {getTrendIcon(data.trend.visualEndDay)}
                  <Typography variant="caption">
                    視覚終日: {getTrendLabel(data.trend.visualEndDay)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderComparisonSummary = () => {
    const rightAverage = (
      rightEyeData.current.comfortLevel +
      (100 - rightEyeData.current.drynessLevel) + // Inverted dryness
      rightEyeData.current.visualPerformance_Daytime +
      rightEyeData.current.visualPerformance_EndOfDay
    ) / 4;

    const leftAverage = (
      leftEyeData.current.comfortLevel +
      (100 - leftEyeData.current.drynessLevel) + // Inverted dryness
      leftEyeData.current.visualPerformance_Daytime +
      leftEyeData.current.visualPerformance_EndOfDay
    ) / 4;

    const difference = Math.abs(rightAverage - leftAverage);
    const hasSignificantDifference = difference > 20;

    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          左右比較サマリー
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                右目 総合スコア
              </Typography>
              <Typography variant="h4" color={getScoreColor(rightAverage)}>
                {Math.round(rightAverage)}
              </Typography>
              {getSentimentIcon(rightAverage, 'large')}
            </Box>
          </Grid>
          
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                左右差
              </Typography>
              <Typography variant="h4" color={hasSignificantDifference ? 'error' : 'success'}>
                {Math.round(difference)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                points
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                左目 総合スコア
              </Typography>
              <Typography variant="h4" color={getScoreColor(leftAverage)}>
                {Math.round(leftAverage)}
              </Typography>
              {getSentimentIcon(leftAverage, 'large')}
            </Box>
          </Grid>
        </Grid>

        {hasSignificantDifference && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              左右の目で大きな差が見られます（差: {Math.round(difference)}点）。
              詳細な検査や専門医の診察をお勧めします。
            </Typography>
          </Alert>
        )}
      </Paper>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          VAS評価 視覚化
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {visitName} • Visual Analog Scale による症状評価
        </Typography>
      </Box>

      {/* VAS Scale Legend */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          VAS スケール説明
        </Typography>
        <Typography variant="body2" color="text.secondary">
          0-100のスケールで症状を評価します。快適性・視覚性能は高いほど良好、乾燥感は低いほど良好です。
        </Typography>
      </Paper>

      {/* Eye Data Visualization */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {renderEyeData(
            '右目 (Right Eye)',
            rightEyeData,
            <EyeIcon color="primary" />
          )}
        </Grid>
        
        <Grid item xs={12} md={6}>
          {renderEyeData(
            '左目 (Left Eye)',
            leftEyeData,
            <EyeIcon color="secondary" />
          )}
        </Grid>
      </Grid>

      {/* Comparison Summary */}
      {renderComparisonSummary()}
    </Box>
  );
};

export default VASVisualization;