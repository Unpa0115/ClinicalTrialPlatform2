import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Compare as CompareIcon,
  TrendingUp as TrendIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const DataReviewMockup: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);

  // Mock data for visits
  const mockVisits = [
    {
      id: 'visit-001',
      visitNumber: 1,
      visitName: 'ベースライン',
      visitDate: '2024-01-20',
      status: 'completed',
      completionPercentage: 100,
      examinations: {
        'basic-info': { completed: true, hasData: true },
        vas: { completed: true, hasData: true },
        comparative: { completed: true, hasData: true },
        fitting: { completed: true, hasData: true },
        questionnaire: { completed: true, hasData: true },
      },
    },
    {
      id: 'visit-002',
      visitNumber: 2,
      visitName: '1週間後フォローアップ',
      visitDate: '2024-01-27',
      status: 'completed',
      completionPercentage: 100,
      examinations: {
        vas: { completed: true, hasData: true },
        comparative: { completed: true, hasData: true },
        'lens-inspection': { completed: true, hasData: true },
        questionnaire: { completed: true, hasData: true },
      },
    },
    {
      id: 'visit-003',
      visitNumber: 3,
      visitName: '1ヶ月後評価',
      visitDate: '2024-02-20',
      status: 'in_progress',
      completionPercentage: 60,
      examinations: {
        'basic-info': { completed: true, hasData: true },
        vas: { completed: true, hasData: true },
        comparative: { completed: false, hasData: false },
        'tear-film': { completed: false, hasData: false },
        'corrected-va': { completed: false, hasData: false },
      },
    },
  ];

  // Mock VAS trend data
  const vasTrendData = [
    { visit: 'ベースライン', comfort: 45, dryness: 65, visualPerformance: 70 },
    { visit: '1週間後', comfort: 60, dryness: 45, visualPerformance: 75 },
    { visit: '1ヶ月後', comfort: 70, dryness: 35, visualPerformance: 80 },
  ];

  // Mock examination data for detailed view (unused in mockup)
  /*
  const mockExaminationData = {
    'basic-info': {
      rightEye: {
        currentUsedCL: 'アキュビューオアシス',
        cr_R1: 7.8,
        cr_R2: 7.6,
        cr_Ave: 7.7,
        va: 1.2,
        s: -2.5,
        c: -0.5,
        ax: 180,
        intraocularPressure: [14, 15, 14],
        cornealEndothelialCells: 2800
      },
      leftEye: {
        currentUsedCL: 'アキュビューオアシス',
        cr_R1: 7.9,
        cr_R2: 7.7,
        cr_Ave: 7.8,
        va: 1.0,
        s: -3.0,
        c: -0.75,
        ax: 175,
        intraocularPressure: [13, 14, 13],
        cornealEndothelialCells: 2750
      }
    },
    'vas': {
      rightEye: {
        comfortLevel: 70,
        drynessLevel: 35,
        visualPerformance_Daytime: 80,
        visualPerformance_EndOfDay: 65
      },
      leftEye: {
        comfortLevel: 65,
        drynessLevel: 40,
        visualPerformance_Daytime: 75,
        visualPerformance_EndOfDay: 60
      }
    }
  };
  */

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'scheduled':
        return 'info';
      case 'missed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '完了';
      case 'in_progress':
        return '実施中';
      case 'scheduled':
        return '予定';
      case 'missed':
        return '未実施';
      default:
        return status;
    }
  };

  const renderVisitList = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Visit</TableCell>
            <TableCell>実施日</TableCell>
            <TableCell>ステータス</TableCell>
            <TableCell>完了率</TableCell>
            <TableCell>検査項目</TableCell>
            <TableCell>操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {mockVisits.map((visit) => (
            <TableRow key={visit.id}>
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    Visit {visit.visitNumber}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {visit.visitName}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>{visit.visitDate}</TableCell>
              <TableCell>
                <Chip
                  label={getStatusLabel(visit.status)}
                  color={getStatusColor(visit.status) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={visit.completionPercentage}
                    sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="caption">
                    {visit.completionPercentage}%
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {Object.entries(visit.examinations).map(([examId, exam]) => (
                    <Chip
                      key={examId}
                      label={examId}
                      size="small"
                      color={exam.completed ? 'success' : 'default'}
                      variant={exam.completed ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  onClick={() => {
                    setSelectedVisit(visit);
                    setOpenDetailDialog(true);
                  }}
                >
                  <ViewIcon />
                </IconButton>
                <IconButton size="small">
                  <EditIcon />
                </IconButton>
                <IconButton size="small">
                  <CompareIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderTrendAnalysis = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              VAS スコア推移
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={vasTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="visit" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="comfort"
                  stroke="#2196f3"
                  strokeWidth={2}
                  name="快適性"
                />
                <Line
                  type="monotone"
                  dataKey="dryness"
                  stroke="#f44336"
                  strokeWidth={2}
                  name="乾燥感"
                />
                <Line
                  type="monotone"
                  dataKey="visualPerformance"
                  stroke="#4caf50"
                  strokeWidth={2}
                  name="視覚性能"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              検査完了状況
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mockVisits}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="visitName" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="completionPercentage" fill="#2196f3" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              データ品質指標
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
              >
                <Typography variant="body2">データ完全性</Typography>
                <Typography variant="body2">95%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={95} sx={{ mb: 2 }} />

              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
              >
                <Typography variant="body2">プロトコル準拠率</Typography>
                <Typography variant="body2">88%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={88} sx={{ mb: 2 }} />

              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
              >
                <Typography variant="body2">Visit実施率</Typography>
                <Typography variant="body2">92%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={92} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderDataComparison = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Alert severity="info">
          複数のVisitのデータを比較して、変化を確認できます。
        </Alert>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              基礎情報比較 (右目)
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>項目</TableCell>
                  <TableCell>ベースライン</TableCell>
                  <TableCell>1週間後</TableCell>
                  <TableCell>1ヶ月後</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>視力 (VA)</TableCell>
                  <TableCell>1.2</TableCell>
                  <TableCell>1.2</TableCell>
                  <TableCell>1.5</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>眼圧 (平均)</TableCell>
                  <TableCell>14.3</TableCell>
                  <TableCell>14.0</TableCell>
                  <TableCell>13.7</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>角膜内皮細胞</TableCell>
                  <TableCell>2800</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>2795</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              VAS スコア比較
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>項目</TableCell>
                  <TableCell>ベースライン</TableCell>
                  <TableCell>1週間後</TableCell>
                  <TableCell>1ヶ月後</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>快適性</TableCell>
                  <TableCell>45</TableCell>
                  <TableCell>60 (+15)</TableCell>
                  <TableCell>70 (+25)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>乾燥感</TableCell>
                  <TableCell>65</TableCell>
                  <TableCell>45 (-20)</TableCell>
                  <TableCell>35 (-30)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>視覚性能</TableCell>
                  <TableCell>70</TableCell>
                  <TableCell>75 (+5)</TableCell>
                  <TableCell>80 (+10)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          データレビュー
        </Typography>
      </Box>

      {/* Patient Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                患者コード
              </Typography>
              <Typography variant="h6">P001</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                臨床試験
              </Typography>
              <Typography variant="body1">
                コンタクトレンズ快適性評価試験
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                ベースライン日
              </Typography>
              <Typography variant="body1">2024-01-20</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                全体進捗
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={75}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2">75%</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Review Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
        >
          <Tab icon={<ViewIcon />} label="Visit一覧" />
          <Tab icon={<TrendIcon />} label="推移分析" />
          <Tab icon={<CompareIcon />} label="データ比較" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderVisitList()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderTrendAnalysis()}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {renderDataComparison()}
      </TabPanel>

      {/* Visit Detail Dialog */}
      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Visit詳細: {selectedVisit?.visitName}</DialogTitle>
        <DialogContent>
          {selectedVisit && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                検査データ詳細
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        基礎情報 (右目)
                      </Typography>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell>使用レンズ</TableCell>
                            <TableCell>アキュビューオアシス</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>角膜曲率半径</TableCell>
                            <TableCell>7.7mm (平均)</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>視力</TableCell>
                            <TableCell>1.2</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>眼圧</TableCell>
                            <TableCell>14.3 mmHg (平均)</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        VAS スコア
                      </Typography>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell>快適性</TableCell>
                            <TableCell>70/100</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>乾燥感</TableCell>
                            <TableCell>35/100</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>日中視覚性能</TableCell>
                            <TableCell>80/100</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>終日視覚性能</TableCell>
                            <TableCell>65/100</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)}>閉じる</Button>
          <Button variant="outlined">データ編集</Button>
          <Button variant="contained">レポート出力</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataReviewMockup;
