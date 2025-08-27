import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  Visibility as ViewIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  NotificationImportant as AlertIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ComplianceMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  status: 'compliant' | 'warning' | 'non_compliant';
  trend: 'up' | 'down' | 'stable';
  description: string;
  lastUpdated: string;
}

interface ProtocolDeviation {
  id: string;
  studyId: string;
  studyName: string;
  patientId: string;
  visitId: string;
  type: 'minor' | 'major' | 'critical';
  category: 'visit_window' | 'missed_assessment' | 'protocol_violation' | 'data_integrity' | 'other';
  description: string;
  reportedBy: string;
  reportedDate: string;
  status: 'open' | 'investigated' | 'resolved';
  correctionAction?: string;
  organizationId: string;
}

interface DataQualityIssue {
  id: string;
  type: 'missing_data' | 'invalid_data' | 'inconsistent_data' | 'outlier';
  severity: 'low' | 'medium' | 'high' | 'critical';
  field: string;
  visitId: string;
  patientId: string;
  studyId: string;
  description: string;
  detectedDate: string;
  status: 'open' | 'resolved' | 'false_positive';
  organizationId: string;
}

interface ComplianceDashboardProps {
  organizationId?: string;
  studyId?: string;
}

const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({
  organizationId,
  studyId,
}) => {
  const [complianceMetrics, setComplianceMetrics] = useState<ComplianceMetric[]>([]);
  const [protocolDeviations, setProtocolDeviations] = useState<ProtocolDeviation[]>([]);
  const [dataQualityIssues, setDataQualityIssues] = useState<DataQualityIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [detailType, setDetailType] = useState<'deviation' | 'quality'>('deviation');

  useEffect(() => {
    loadComplianceData();
  }, [organizationId, studyId, selectedTimeframe]);

  const loadComplianceData = async () => {
    setLoading(true);
    try {
      // This would call the backend APIs to load compliance data
      // For now, using mock data

      const mockMetrics: ComplianceMetric[] = [
        {
          id: 'protocol-compliance',
          name: 'プロトコル遵守率',
          value: 94.5,
          target: 95.0,
          status: 'warning',
          trend: 'down',
          description: '全体のプロトコル遵守率',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'data-completeness',
          name: 'データ完全性',
          value: 98.2,
          target: 98.0,
          status: 'compliant',
          trend: 'up',
          description: '必須データ項目の記入率',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'visit-adherence',
          name: '訪問スケジュール遵守',
          value: 92.1,
          target: 95.0,
          status: 'warning',
          trend: 'stable',
          description: 'プロトコルウィンドウ内での訪問実施率',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'audit-readiness',
          name: '監査対応準備',
          value: 87.3,
          target: 90.0,
          status: 'warning',
          trend: 'up',
          description: '監査に必要な文書の準備状況',
          lastUpdated: new Date().toISOString(),
        },
      ];

      const mockDeviations: ProtocolDeviation[] = [
        {
          id: 'dev-1',
          studyId: 'study-001',
          studyName: '眼科臨床試験A',
          patientId: 'patient-001',
          visitId: 'visit-baseline-001',
          type: 'major',
          category: 'visit_window',
          description: 'ベースライン訪問がプロトコルウィンドウを7日超過',
          reportedBy: 'coordinator@example.com',
          reportedDate: new Date(Date.now() - 86400000).toISOString(),
          status: 'open',
          organizationId: organizationId || 'org-001',
        },
        {
          id: 'dev-2',
          studyId: 'study-001',
          studyName: '眼科臨床試験A',
          patientId: 'patient-002',
          visitId: 'visit-1week-002',
          type: 'minor',
          category: 'missed_assessment',
          description: 'VAS評価の一部項目が未実施',
          reportedBy: 'investigator@example.com',
          reportedDate: new Date(Date.now() - 172800000).toISOString(),
          status: 'investigated',
          correctionAction: 'フォローアップ訪問で追加評価実施',
          organizationId: organizationId || 'org-001',
        },
      ];

      const mockQualityIssues: DataQualityIssue[] = [
        {
          id: 'qual-1',
          type: 'outlier',
          severity: 'medium',
          field: 'comfortLevel',
          visitId: 'visit-1week-003',
          patientId: 'patient-003',
          studyId: 'study-001',
          description: 'VAS快適性スコアが他の患者と比較して異常値（95→15への急激な変化）',
          detectedDate: new Date(Date.now() - 43200000).toISOString(),
          status: 'open',
          organizationId: organizationId || 'org-001',
        },
        {
          id: 'qual-2',
          type: 'missing_data',
          severity: 'high',
          field: 'intraocularPressure',
          visitId: 'visit-baseline-004',
          patientId: 'patient-004',
          studyId: 'study-001',
          description: '必須項目である眼圧測定値が未入力',
          detectedDate: new Date(Date.now() - 21600000).toISOString(),
          status: 'open',
          organizationId: organizationId || 'org-001',
        },
      ];

      setComplianceMetrics(mockMetrics);
      setProtocolDeviations(mockDeviations);
      setDataQualityIssues(mockQualityIssues);
    } catch (error) {
      console.error('Failed to load compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'success';
      case 'warning':
        return 'warning';
      case 'non_compliant':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'non_compliant':
        return <ErrorIcon color="error" />;
      default:
        return <ErrorIcon color="action" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon color="success" fontSize="small" />;
      case 'down':
        return <TrendingDownIcon color="error" fontSize="small" />;
      case 'stable':
      default:
        return <TimelineIcon color="action" fontSize="small" />;
    }
  };

  const getDeviationTypeColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'error';
      case 'major':
        return 'warning';
      case 'minor':
        return 'info';
      default:
        return 'default';
    }
  };

  const getQualitySeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleViewDetail = (item: any, type: 'deviation' | 'quality') => {
    setSelectedDetail(item);
    setDetailType(type);
    setDetailDialogOpen(true);
  };

  const generateComplianceReport = () => {
    // This would generate a comprehensive compliance report
    console.log('Generating compliance report...');
  };

  // Prepare data for charts
  const complianceChartData = complianceMetrics.map(metric => ({
    name: metric.name,
    value: metric.value,
    target: metric.target,
  }));

  const deviationsByType = protocolDeviations.reduce((acc, dev) => {
    acc[dev.type] = (acc[dev.type] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const deviationChartData = Object.entries(deviationsByType).map(([type, count]) => ({
    name: type === 'critical' ? '重大' : type === 'major' ? '主要' : '軽微',
    value: count,
    color: type === 'critical' ? '#f44336' : type === 'major' ? '#ff9800' : '#2196f3',
  }));

  const qualityIssuesByType = dataQualityIssues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const qualityChartData = Object.entries(qualityIssuesByType).map(([type, count]) => ({
    name: type === 'missing_data' ? '未入力' : 
          type === 'invalid_data' ? '無効データ' :
          type === 'inconsistent_data' ? '不整合' : '外れ値',
    value: count,
  }));

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          コンプライアンス ダッシュボード
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>期間</InputLabel>
            <Select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
            >
              <MenuItem value="7d">過去7日</MenuItem>
              <MenuItem value="30d">過去30日</MenuItem>
              <MenuItem value="90d">過去90日</MenuItem>
              <MenuItem value="1y">過去1年</MenuItem>
            </Select>
          </FormControl>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadComplianceData}
            disabled={loading}
          >
            更新
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={generateComplianceReport}
            variant="outlined"
          >
            レポート出力
          </Button>
        </Box>
      </Box>

      {/* Alert Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge badgeContent={protocolDeviations.filter(d => d.status === 'open').length} color="error">
                  <WarningIcon color="warning" />
                </Badge>
                <Box>
                  <Typography variant="h6">
                    {protocolDeviations.filter(d => d.status === 'open').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    未解決逸脱
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge badgeContent={dataQualityIssues.filter(q => q.status === 'open').length} color="error">
                  <AssessmentIcon color="info" />
                </Badge>
                <Box>
                  <Typography variant="h6">
                    {dataQualityIssues.filter(q => q.status === 'open').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    データ品質問題
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon color="primary" />
                <Box>
                  <Typography variant="h6">
                    {complianceMetrics.filter(m => m.status === 'compliant').length}/{complianceMetrics.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    基準達成項目
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon color="secondary" />
                <Box>
                  <Typography variant="h6">
                    95.2%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    全体遵守率
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Compliance Metrics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            コンプライアンス指標
          </Typography>
          <Grid container spacing={2}>
            {complianceMetrics.map((metric) => (
              <Grid item xs={12} md={6} key={metric.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>
                          {metric.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {metric.description}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(metric.status)}
                        {getTrendIcon(metric.trend)}
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="h4" color={getStatusColor(metric.status) + '.main'}>
                        {metric.value}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        / 目標 {metric.target}%
                      </Typography>
                    </Box>
                    
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((metric.value / metric.target) * 100, 100)}
                      color={getStatusColor(metric.status) as any}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        差: {(metric.value - metric.target).toFixed(1)}%
                      </Typography>
                      <Chip
                        label={metric.status === 'compliant' ? '基準達成' : metric.status === 'warning' ? '要注意' : '未達成'}
                        color={getStatusColor(metric.status) as any}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                プロトコル逸脱分布
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deviationChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {deviationChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                データ品質問題分布
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={qualityChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Issues Lists */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  プロトコル逸脱
                </Typography>
                <Chip 
                  label={`${protocolDeviations.filter(d => d.status === 'open').length}件未解決`}
                  color={protocolDeviations.filter(d => d.status === 'open').length > 0 ? 'error' : 'success'}
                  size="small"
                />
              </Box>
              <List>
                {protocolDeviations.slice(0, 5).map((deviation) => (
                  <ListItem key={deviation.id} divider>
                    <ListItemIcon>
                      <Chip
                        label={deviation.type === 'critical' ? '重大' : deviation.type === 'major' ? '主要' : '軽微'}
                        color={getDeviationTypeColor(deviation.type) as any}
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={deviation.description}
                      secondary={`${deviation.studyName} - 患者: ${deviation.patientId} - ${new Date(deviation.reportedDate).toLocaleDateString('ja-JP')}`}
                    />
                    <Tooltip title="詳細表示">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetail(deviation, 'deviation')}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItem>
                ))}
              </List>
              {protocolDeviations.length > 5 && (
                <Button fullWidth variant="outlined" size="small">
                  すべて表示 ({protocolDeviations.length}件)
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  データ品質問題
                </Typography>
                <Chip 
                  label={`${dataQualityIssues.filter(q => q.status === 'open').length}件未解決`}
                  color={dataQualityIssues.filter(q => q.status === 'open').length > 0 ? 'warning' : 'success'}
                  size="small"
                />
              </Box>
              <List>
                {dataQualityIssues.slice(0, 5).map((issue) => (
                  <ListItem key={issue.id} divider>
                    <ListItemIcon>
                      <Chip
                        label={issue.severity === 'critical' ? '緊急' : issue.severity === 'high' ? '高' : issue.severity === 'medium' ? '中' : '低'}
                        color={getQualitySeverityColor(issue.severity) as any}
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={issue.description}
                      secondary={`フィールド: ${issue.field} - 患者: ${issue.patientId} - ${new Date(issue.detectedDate).toLocaleDateString('ja-JP')}`}
                    />
                    <Tooltip title="詳細表示">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetail(issue, 'quality')}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItem>
                ))}
              </List>
              {dataQualityIssues.length > 5 && (
                <Button fullWidth variant="outlined" size="small">
                  すべて表示 ({dataQualityIssues.length}件)
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {detailType === 'deviation' ? 'プロトコル逸脱詳細' : 'データ品質問題詳細'}
        </DialogTitle>
        <DialogContent>
          {selectedDetail && (
            <Box sx={{ pt: 1 }}>
              {detailType === 'deviation' ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="逸脱ID" secondary={selectedDetail.id} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="重要度" secondary={
                          <Chip
                            label={selectedDetail.type === 'critical' ? '重大' : selectedDetail.type === 'major' ? '主要' : '軽微'}
                            color={getDeviationTypeColor(selectedDetail.type) as any}
                            size="small"
                          />
                        } />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="カテゴリ" secondary={selectedDetail.category} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="報告者" secondary={selectedDetail.reportedBy} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="報告日" secondary={new Date(selectedDetail.reportedDate).toLocaleString('ja-JP')} />
                      </ListItem>
                    </List>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="臨床試験" secondary={selectedDetail.studyName} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="患者ID" secondary={selectedDetail.patientId} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="訪問ID" secondary={selectedDetail.visitId} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="ステータス" secondary={
                          <Chip
                            label={selectedDetail.status === 'open' ? '未解決' : selectedDetail.status === 'investigated' ? '調査中' : '解決済み'}
                            color={selectedDetail.status === 'open' ? 'error' : selectedDetail.status === 'investigated' ? 'warning' : 'success'}
                            size="small"
                          />
                        } />
                      </ListItem>
                    </List>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      詳細
                    </Typography>
                    <Typography variant="body2">
                      {selectedDetail.description}
                    </Typography>
                  </Grid>
                  {selectedDetail.correctionAction && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        修正措置
                      </Typography>
                      <Typography variant="body2">
                        {selectedDetail.correctionAction}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="問題ID" secondary={selectedDetail.id} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="種別" secondary={selectedDetail.type} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="重要度" secondary={
                          <Chip
                            label={selectedDetail.severity === 'critical' ? '緊急' : selectedDetail.severity === 'high' ? '高' : selectedDetail.severity === 'medium' ? '中' : '低'}
                            color={getQualitySeverityColor(selectedDetail.severity) as any}
                            size="small"
                          />
                        } />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="フィールド" secondary={selectedDetail.field} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="検出日" secondary={new Date(selectedDetail.detectedDate).toLocaleString('ja-JP')} />
                      </ListItem>
                    </List>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="臨床試験ID" secondary={selectedDetail.studyId} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="患者ID" secondary={selectedDetail.patientId} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="訪問ID" secondary={selectedDetail.visitId} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="ステータス" secondary={
                          <Chip
                            label={selectedDetail.status === 'open' ? '未解決' : selectedDetail.status === 'resolved' ? '解決済み' : '誤検知'}
                            color={selectedDetail.status === 'open' ? 'error' : selectedDetail.status === 'resolved' ? 'success' : 'default'}
                            size="small"
                          />
                        } />
                      </ListItem>
                    </List>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      詳細
                    </Typography>
                    <Typography variant="body2">
                      {selectedDetail.description}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            閉じる
          </Button>
          <Button variant="contained" color="primary">
            {detailType === 'deviation' ? '逸脱対応' : '問題対応'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComplianceDashboard;