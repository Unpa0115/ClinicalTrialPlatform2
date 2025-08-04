import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  // Add as AddIcon, // Unused in mockup
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PatientSurveyMockup: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Mock data for patients
  const mockPatients = [
    {
      id: 'patient-001',
      patientCode: 'P001',
      patientInitials: 'T.S.',
      gender: 'male',
      registrationDate: '2024-01-10',
      status: 'active',
      participatingStudies: ['CL-COMFORT-2024'],
      organization: '東京眼科病院',
    },
    {
      id: 'patient-002',
      patientCode: 'P002',
      patientInitials: 'M.K.',
      gender: 'female',
      registrationDate: '2024-01-15',
      status: 'active',
      participatingStudies: [],
      organization: '東京眼科病院',
    },
    {
      id: 'patient-003',
      patientCode: 'P003',
      patientInitials: 'H.Y.',
      gender: 'male',
      registrationDate: '2024-02-01',
      status: 'active',
      participatingStudies: ['CL-COMFORT-2024', 'SH-LENS-2024'],
      organization: '大阪視力センター',
    },
  ];

  // Mock data for surveys
  const mockSurveys = [
    {
      id: 'survey-001',
      patientCode: 'P001',
      patientInitials: 'T.S.',
      studyName: 'コンタクトレンズ快適性評価試験',
      studyCode: 'CL-COMFORT-2024',
      baselineDate: '2024-01-20',
      status: 'active',
      completionPercentage: 67,
      totalVisits: 3,
      completedVisits: 2,
      nextVisitDate: '2024-02-20',
    },
    {
      id: 'survey-002',
      patientCode: 'P003',
      patientInitials: 'H.Y.',
      studyName: 'コンタクトレンズ快適性評価試験',
      studyCode: 'CL-COMFORT-2024',
      baselineDate: '2024-02-05',
      status: 'active',
      completionPercentage: 33,
      totalVisits: 3,
      completedVisits: 1,
      nextVisitDate: '2024-02-12',
    },
  ];

  // Mock clinical studies for assignment
  const mockClinicalStudies = [
    {
      id: 'study-001',
      studyName: 'コンタクトレンズ快適性評価試験',
      studyCode: 'CL-COMFORT-2024',
      status: 'active',
    },
    {
      id: 'study-002',
      studyName: '新型シリコンハイドロゲルレンズ評価',
      studyCode: 'SH-LENS-2024',
      status: 'recruiting',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'default';
      case 'withdrawn':
        return 'error';
      case 'suspended':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '実施中';
      case 'completed':
        return '完了';
      case 'withdrawn':
        return '中止';
      case 'suspended':
        return '一時停止';
      default:
        return status;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          患者サーベイ管理
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
        >
          <Tab icon={<PersonIcon />} label="患者マスター" />
          <Tab icon={<AssignmentIcon />} label="サーベイ管理" />
        </Tabs>
      </Box>

      {/* Patient Master Tab */}
      <TabPanel value={tabValue} index={0}>
        {/* Patient Registration Form */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              新規患者登録
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="患者コード"
                  placeholder="例: P004"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="患者イニシャル"
                  placeholder="例: A.B."
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>性別</InputLabel>
                  <Select>
                    <MenuItem value="male">男性</MenuItem>
                    <MenuItem value="female">女性</MenuItem>
                    <MenuItem value="other">その他</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="生年月日"
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="連絡先電話番号"
                  placeholder="例: 03-1234-5678"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="既往歴・アレルギー"
                  placeholder="関連する医療情報を入力してください"
                  variant="outlined"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button variant="contained" color="primary">
                患者を登録
              </Button>
              <Button variant="outlined">クリア</Button>
            </Box>
          </CardContent>
        </Card>

        {/* Patient Search and List */}
        <Card>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Typography variant="h6">患者マスター検索</Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                placeholder="患者コードまたはイニシャルで検索"
                variant="outlined"
                size="small"
                sx={{ flexGrow: 1 }}
              />
              <Button variant="contained" startIcon={<SearchIcon />}>
                検索
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>患者コード</TableCell>
                    <TableCell>イニシャル</TableCell>
                    <TableCell>性別</TableCell>
                    <TableCell>登録日</TableCell>
                    <TableCell>ステータス</TableCell>
                    <TableCell>参加試験</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>{patient.patientCode}</TableCell>
                      <TableCell>{patient.patientInitials}</TableCell>
                      <TableCell>
                        {patient.gender === 'male' ? '男性' : '女性'}
                      </TableCell>
                      <TableCell>{patient.registrationDate}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(patient.status)}
                          color={getStatusColor(patient.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {patient.participatingStudies.length > 0 ? (
                          patient.participatingStudies.map((study, index) => (
                            <Chip
                              key={index}
                              label={study}
                              size="small"
                              sx={{ mr: 0.5 }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            なし
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setOpenAssignDialog(true);
                          }}
                        >
                          サーベイ割り当て
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Survey Management Tab */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              アクティブなサーベイ
            </Typography>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>患者</TableCell>
                    <TableCell>臨床試験</TableCell>
                    <TableCell>ベースライン日</TableCell>
                    <TableCell>進捗状況</TableCell>
                    <TableCell>Visit状況</TableCell>
                    <TableCell>次回予定</TableCell>
                    <TableCell>ステータス</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockSurveys.map((survey) => (
                    <TableRow key={survey.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {survey.patientCode}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {survey.patientInitials}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {survey.studyName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {survey.studyCode}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{survey.baselineDate}</TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <LinearProgress
                            variant="determinate"
                            value={survey.completionPercentage}
                            sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption">
                            {survey.completionPercentage}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {survey.completedVisits} / {survey.totalVisits}
                      </TableCell>
                      <TableCell>{survey.nextVisitDate}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(survey.status)}
                          color={getStatusColor(survey.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined">
                          詳細
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Survey Assignment Dialog */}
      <Dialog
        open={openAssignDialog}
        onClose={() => setOpenAssignDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          サーベイ割り当て: {selectedPatient?.patientCode} (
          {selectedPatient?.patientInitials})
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>臨床試験を選択</InputLabel>
              <Select>
                {mockClinicalStudies.map((study) => (
                  <MenuItem key={study.id} value={study.id}>
                    {study.studyName} ({study.studyCode})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="date"
              label="ベースライン日"
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="備考"
              placeholder="サーベイ割り当てに関する備考があれば入力してください"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={() => setOpenAssignDialog(false)}
          >
            割り当て実行
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientSurveyMockup;
