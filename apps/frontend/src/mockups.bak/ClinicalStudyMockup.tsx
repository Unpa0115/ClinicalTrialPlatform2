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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ClinicalStudyMockup: React.FC = () => {
  const navigate = useNavigate();
  const [selectedStudy, setSelectedStudy] = useState<any>(null);

  // Mock data for clinical studies
  const mockStudies = [
    {
      id: 'study-001',
      studyName: 'コンタクトレンズ快適性評価試験',
      studyCode: 'CL-COMFORT-2024',
      status: 'active',
      enrolledPatients: 45,
      targetPatients: 100,
      organizations: ['東京眼科病院', '大阪視力センター'],
      startDate: '2024-01-15',
      protocolVersion: 'v1.2',
    },
    {
      id: 'study-002',
      studyName: '新型シリコンハイドロゲルレンズ評価',
      studyCode: 'SH-LENS-2024',
      status: 'recruiting',
      enrolledPatients: 23,
      targetPatients: 80,
      organizations: ['名古屋アイクリニック'],
      startDate: '2024-02-01',
      protocolVersion: 'v1.0',
    },
  ];

  // Available examination types
  const availableExaminations = [
    {
      id: 'basic-info',
      name: '基礎情報',
      description: '患者基本情報・屈折検査・眼圧測定',
    },
    { id: 'vas', name: 'VAS評価', description: '快適性・乾燥感のスケール評価' },
    {
      id: 'comparative',
      name: '相対評価',
      description: '前回レンズとの比較評価',
    },
    {
      id: 'fitting',
      name: 'フィッティング検査',
      description: 'レンズフィッティング状態確認',
    },
    {
      id: 'lens-inspection',
      name: 'レンズ検査',
      description: 'レンズ状態・汚れ・破損確認',
    },
    {
      id: 'tear-film',
      name: '涙液層検査',
      description: '涙液層厚・安定性測定',
    },
    {
      id: 'corrected-va',
      name: '矯正視力検査',
      description: 'レンズ装用時視力測定',
    },
    {
      id: 'questionnaire',
      name: '問診',
      description: '自覚症状・使用感に関する問診',
    },
  ];

  // Visit template state - default 2 visits
  const [visitTemplate, setVisitTemplate] = useState([
    {
      visitNumber: 1,
      visitName: 'ベースライン訪問',
      visitType: 'baseline',
      scheduledDays: 0,
      windowBefore: 0,
      windowAfter: 3,
      requiredExams: ['basic-info', 'vas', 'comparative', 'fitting'],
      isRequired: true,
    },
    {
      visitNumber: 2,
      visitName: '1週間後フォローアップ',
      visitType: '1week',
      scheduledDays: 7,
      windowBefore: 2,
      windowAfter: 2,
      requiredExams: ['vas', 'comparative', 'lens-inspection', 'questionnaire'],
      isRequired: true,
    },
  ]);

  // Visit management functions
  const addVisit = () => {
    const newVisitNumber =
      Math.max(...visitTemplate.map((v) => v.visitNumber)) + 1;
    const newVisit = {
      visitNumber: newVisitNumber,
      visitName: `Visit ${newVisitNumber}`,
      visitType: 'custom',
      scheduledDays: 30,
      windowBefore: 3,
      windowAfter: 3,
      requiredExams: ['basic-info'],
      isRequired: true,
    };
    setVisitTemplate([...visitTemplate, newVisit]);
  };

  const removeVisit = (visitNumber: number) => {
    if (visitTemplate.length <= 1) {
      alert('最低1つのVisitが必要です');
      return;
    }
    setVisitTemplate(
      visitTemplate.filter((v) => v.visitNumber !== visitNumber)
    );
  };

  const updateVisit = (visitNumber: number, field: string, value: any) => {
    setVisitTemplate(
      visitTemplate.map((visit) =>
        visit.visitNumber === visitNumber ? { ...visit, [field]: value } : visit
      )
    );
  };

  const updateVisitExaminations = (
    visitNumber: number,
    examId: string,
    checked: boolean
  ) => {
    setVisitTemplate(
      visitTemplate.map((visit) => {
        if (visit.visitNumber === visitNumber) {
          const updatedExams = checked
            ? [...visit.requiredExams, examId]
            : visit.requiredExams.filter((id) => id !== examId);
          return { ...visit, requiredExams: updatedExams };
        }
        return visit;
      })
    );
  };

  const getExaminationName = (examId: string) => {
    const exam = availableExaminations.find((e) => e.id === examId);
    return exam ? exam.name : examId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'recruiting':
        return 'info';
      case 'planning':
        return 'warning';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '実施中';
      case 'recruiting':
        return '募集中';
      case 'planning':
        return '計画中';
      case 'completed':
        return '完了';
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
          臨床試験管理
        </Typography>
      </Box>

      {/* Study Creation Form */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            新規臨床試験作成
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="試験名"
                placeholder="例: コンタクトレンズ快適性評価試験"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="試験コード"
                placeholder="例: CL-COMFORT-2024"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="試験説明"
                placeholder="試験の目的と概要を入力してください"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="開始日"
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="終了日"
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="目標患者数"
                placeholder="100"
                variant="outlined"
              />
            </Grid>
          </Grid>

          {/* Visit Template Configuration */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Visit テンプレート設定
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              ここで設定したVisit構成と検査項目が、動的検査データ入力画面の構成を決定します。
            </Alert>

            {visitTemplate.map((visit) => (
              <Accordion key={visit.visitNumber} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      width: '100%',
                    }}
                  >
                    <Typography variant="subtitle1">
                      Visit {visit.visitNumber}: {visit.visitName}
                    </Typography>
                    <Chip
                      label={visit.isRequired ? '必須' : '任意'}
                      size="small"
                      color={visit.isRequired ? 'primary' : 'default'}
                    />
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeVisit(visit.visitNumber);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Visit名"
                        value={visit.visitName}
                        size="small"
                        onChange={(e) =>
                          updateVisit(
                            visit.visitNumber,
                            'visitName',
                            e.target.value
                          )
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Visit タイプ</InputLabel>
                        <Select
                          value={visit.visitType}
                          onChange={(e) =>
                            updateVisit(
                              visit.visitNumber,
                              'visitType',
                              e.target.value
                            )
                          }
                        >
                          <MenuItem value="baseline">ベースライン</MenuItem>
                          <MenuItem value="1week">1週間後</MenuItem>
                          <MenuItem value="1month">1ヶ月後</MenuItem>
                          <MenuItem value="3month">3ヶ月後</MenuItem>
                          <MenuItem value="custom">カスタム</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="予定日数"
                        value={visit.scheduledDays}
                        type="number"
                        size="small"
                        onChange={(e) =>
                          updateVisit(
                            visit.visitNumber,
                            'scheduledDays',
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="許容範囲（前）"
                        value={visit.windowBefore}
                        type="number"
                        size="small"
                        onChange={(e) =>
                          updateVisit(
                            visit.visitNumber,
                            'windowBefore',
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="許容範囲（後）"
                        value={visit.windowAfter}
                        type="number"
                        size="small"
                        onChange={(e) =>
                          updateVisit(
                            visit.visitNumber,
                            'windowAfter',
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </Grid>

                    {/* Examination Selection */}
                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle2"
                        gutterBottom
                        sx={{ mt: 2 }}
                      >
                        検査項目選択:
                      </Typography>
                      <FormGroup>
                        <Grid container spacing={1}>
                          {availableExaminations.map((exam) => (
                            <Grid item xs={12} sm={6} md={4} key={exam.id}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={visit.requiredExams.includes(
                                      exam.id
                                    )}
                                    onChange={(e) =>
                                      updateVisitExaminations(
                                        visit.visitNumber,
                                        exam.id,
                                        e.target.checked
                                      )
                                    }
                                    size="small"
                                  />
                                }
                                label={
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      fontWeight="medium"
                                    >
                                      {exam.name}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {exam.description}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </FormGroup>
                    </Grid>

                    {/* Selected Examinations Preview */}
                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle2"
                        gutterBottom
                        sx={{ mt: 2 }}
                      >
                        選択済み検査項目 ({visit.requiredExams.length}項目):
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {visit.requiredExams.map((examId) => (
                          <Chip
                            key={examId}
                            label={getExaminationName(examId)}
                            size="small"
                            color="primary"
                            onDelete={() =>
                              updateVisitExaminations(
                                visit.visitNumber,
                                examId,
                                false
                              )
                            }
                          />
                        ))}
                        {visit.requiredExams.length === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            検査項目が選択されていません
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                onClick={addVisit}
              >
                Visit を追加
              </Button>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ alignSelf: 'center' }}
              >
                現在 {visitTemplate.length} 個のVisitが設定されています
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button variant="contained" color="primary">
              試験を作成
            </Button>
            <Button variant="outlined">下書き保存</Button>
          </Box>
        </CardContent>
      </Card>

      {/* Existing Studies List */}
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
            <Typography variant="h6">既存の臨床試験</Typography>
            <Button variant="contained" startIcon={<AddIcon />}>
              新規作成
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>試験名</TableCell>
                  <TableCell>試験コード</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell>患者登録状況</TableCell>
                  <TableCell>参加組織</TableCell>
                  <TableCell>開始日</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockStudies.map((study) => (
                  <TableRow key={study.id}>
                    <TableCell>{study.studyName}</TableCell>
                    <TableCell>{study.studyCode}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(study.status)}
                        color={getStatusColor(study.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {study.enrolledPatients} / {study.targetPatients}
                      <Box
                        sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
                      >
                        (
                        {Math.round(
                          (study.enrolledPatients / study.targetPatients) * 100
                        )}
                        %)
                      </Box>
                    </TableCell>
                    <TableCell>
                      {study.organizations.map((org, index) => (
                        <Chip
                          key={index}
                          label={org}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>{study.startDate}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => setSelectedStudy(study)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Study Details Dialog */}
      <Dialog
        open={!!selectedStudy}
        onClose={() => setSelectedStudy(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>臨床試験詳細: {selectedStudy?.studyName}</DialogTitle>
        <DialogContent>
          {selectedStudy && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                基本情報
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    試験コード
                  </Typography>
                  <Typography variant="body1">
                    {selectedStudy.studyCode}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    プロトコルバージョン
                  </Typography>
                  <Typography variant="body1">
                    {selectedStudy.protocolVersion}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    開始日
                  </Typography>
                  <Typography variant="body1">
                    {selectedStudy.startDate}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    患者登録状況
                  </Typography>
                  <Typography variant="body1">
                    {selectedStudy.enrolledPatients} /{' '}
                    {selectedStudy.targetPatients} 名
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedStudy(null)}>閉じる</Button>
          <Button variant="contained">編集</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClinicalStudyMockup;
