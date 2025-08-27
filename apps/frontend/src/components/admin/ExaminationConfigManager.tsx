import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Science as ScienceIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

import {
  CLINICAL_STUDY_CONFIGURATIONS,
  AVAILABLE_EXAMINATIONS,
  getClinicalStudyConfig,
  ClinicalStudyConfig,
  VisitTemplate,
  ExaminationStep
} from '../../config/examinationConfigurations';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const ExaminationConfigManager: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedStudy, setSelectedStudy] = useState<ClinicalStudyConfig | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const studies = Object.values(CLINICAL_STUDY_CONFIGURATIONS);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleStudyClick = (study: ClinicalStudyConfig) => {
    setSelectedStudy(study);
    setDetailsOpen(true);
  };

  const getExaminationChips = (examinations: ExaminationStep[]) => {
    return examinations.map(exam => (
      <Chip
        key={exam.id}
        label={exam.displayName}
        size="small"
        color={exam.required ? 'primary' : 'default'}
        variant={exam.required ? 'filled' : 'outlined'}
        sx={{ mr: 0.5, mb: 0.5 }}
      />
    ));
  };

  const getTotalEstimatedTime = (examinations: ExaminationStep[]) => {
    return examinations.reduce((total, exam) => total + (exam.estimatedMinutes || 0), 0);
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          検査設定管理
        </Typography>
        <Typography variant="body1" color="text.secondary">
          臨床試験別の検査内容・順序の設定を管理します
        </Typography>
      </Paper>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="試験別設定一覧" icon={<ScienceIcon />} />
          <Tab label="検査タイプマスター" icon={<AssignmentIcon />} />
          <Tab label="設定テンプレート" icon={<SettingsIcon />} />
        </Tabs>

        <TabPanel value={selectedTab} index={0}>
          <Grid container spacing={3}>
            {studies.map((study) => (
              <Grid item xs={12} md={6} lg={4} key={study.clinicalStudyId}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out',
                    },
                  }}
                  onClick={() => handleStudyClick(study)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <ScienceIcon sx={{ mr: 1 }} />
                      <Typography variant="h6" component="h2">
                        {study.studyName}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Study ID: {study.clinicalStudyId}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Visit Templates ({study.visitTemplates.length})
                    </Typography>
                    
                    {study.visitTemplates.slice(0, 2).map((template) => (
                      <Box key={template.visitType} sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {template.visitName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {template.examinations.length}検査 • {getTotalEstimatedTime(template.examinations)}分
                        </Typography>
                      </Box>
                    ))}
                    
                    {study.visitTemplates.length > 2 && (
                      <Typography variant="caption" color="text.secondary">
                        他 {study.visitTemplates.length - 2} テンプレート
                      </Typography>
                    )}

                    <Box sx={{ mt: 2 }}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStudyClick(study);
                        }}
                      >
                        詳細・編集
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="large"
            >
              新しい試験設定を追加
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          <Typography variant="h6" gutterBottom>
            利用可能な検査タイプ
          </Typography>
          
          <Grid container spacing={2}>
            {Object.values(AVAILABLE_EXAMINATIONS).map((exam) => (
              <Grid item xs={12} sm={6} md={4} key={exam.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {exam.displayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {exam.description}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={exam.required ? '必須' : '任意'}
                        color={exam.required ? 'error' : 'default'}
                        size="small"
                      />
                      <Chip
                        label={`${exam.estimatedMinutes || 0}分`}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          <Alert severity="info" sx={{ mb: 3 }}>
            このセクションでは、新しい試験タイプのテンプレートを作成できます。
            既存の設定を参考に、検査項目の組み合わせパターンを定義します。
          </Alert>
          
          <Typography variant="body2" color="text.secondary">
            テンプレート機能は今後実装予定です。
            現在は <code>examinationConfigurations.ts</code> で直接設定を変更してください。
          </Typography>
        </TabPanel>
      </Paper>

      {/* Study Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <ScienceIcon />
            {selectedStudy?.studyName}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedStudy && (
            <Box>
              <Typography variant="body1" paragraph>
                <strong>Study ID:</strong> {selectedStudy.clinicalStudyId}
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Study Type:</strong> {selectedStudy.studyType}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                グローバル設定
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>スキップ許可:</strong> {selectedStudy.globalExaminationSettings.allowSkip ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>自動保存間隔:</strong> {selectedStudy.globalExaminationSettings.autoSaveInterval}秒
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>最大セッション時間:</strong> {selectedStudy.globalExaminationSettings.maxSessionDuration}分
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>必須検査完了要求:</strong> {selectedStudy.globalExaminationSettings.requireAllMandatory ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Visit Templates ({selectedStudy.visitTemplates.length})
              </Typography>

              {selectedStudy.visitTemplates.map((template, index) => (
                <Accordion key={template.visitType} defaultExpanded={index === 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                      <ScheduleIcon />
                      <Box flexGrow={1}>
                        <Typography variant="subtitle1">
                          {template.visitName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {template.examinations.length}検査 • 予定時間: {getTotalEstimatedTime(template.examinations)}分
                        </Typography>
                      </Box>
                      <Chip
                        label={template.visitType}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          基本情報
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemText
                              primary="予定時間"
                              secondary={`${template.estimatedDuration}分`}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="順序変更"
                              secondary={template.allowedReorder ? '許可' : '固定'}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="必要完了率"
                              secondary={`${template.requiredCompletionPercentage || 100}%`}
                            />
                          </ListItem>
                        </List>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          検査項目
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          {getExaminationChips(template.examinations)}
                        </Box>
                        
                        <Typography variant="subtitle2" gutterBottom>
                          実行順序
                        </Typography>
                        <Box>
                          {template.defaultOrder.map((examId, idx) => {
                            const exam = AVAILABLE_EXAMINATIONS[examId];
                            return exam ? (
                              <Chip
                                key={examId}
                                label={`${idx + 1}. ${exam.displayName}`}
                                size="small"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ) : null;
                          })}
                        </Box>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          {template.description}
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            閉じる
          </Button>
          <Button variant="contained" startIcon={<EditIcon />}>
            設定を編集
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExaminationConfigManager;