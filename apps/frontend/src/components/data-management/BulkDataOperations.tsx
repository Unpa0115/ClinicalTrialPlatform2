import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CloudUpload as CloudUploadIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface BulkOperationItem {
  id: string;
  visitId: string;
  examinationId: string;
  eyeSide: 'right' | 'left';
  fieldName: string;
  currentValue: any;
  newValue: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  error?: string;
}

interface BulkOperationJob {
  id: string;
  type: 'update' | 'delete' | 'import' | 'export';
  name: string;
  description: string;
  items: BulkOperationItem[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  totalItems: number;
  processedItems: number;
  successItems: number;
  failedItems: number;
  skippedItems: number;
}

interface BulkDataOperationsProps {
  visitIds?: string[];
  onJobComplete?: (job: BulkOperationJob) => void;
}

const BulkDataOperations: React.FC<BulkDataOperationsProps> = ({
  visitIds = [],
  onJobComplete,
}) => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [operationType, setOperationType] = useState<'update' | 'delete' | 'import' | 'export'>('update');
  const [selectedVisits, setSelectedVisits] = useState<string[]>(visitIds);
  const [selectedExaminations, setSelectedExaminations] = useState<string[]>([]);
  const [bulkEditData, setBulkEditData] = useState<{[key: string]: any}>({});
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [currentJob, setCurrentJob] = useState<BulkOperationJob | null>(null);
  const [jobHistory, setJobHistory] = useState<BulkOperationJob[]>([]);
  const [confirmationDialog, setConfirmationDialog] = useState(false);

  useEffect(() => {
    loadJobHistory();
  }, []);

  const loadJobHistory = async () => {
    // This would load job history from the backend
    // Placeholder data for now
    setJobHistory([]);
  };

  const hasPermission = (operation: string) => {
    if (!user) return false;
    
    const permissions = {
      update: ['super_admin', 'study_admin', 'org_admin'],
      delete: ['super_admin', 'study_admin'],
      import: ['super_admin', 'study_admin', 'org_admin'],
      export: ['super_admin', 'study_admin', 'org_admin', 'investigator'],
    };
    
    return permissions[operation as keyof typeof permissions]?.includes(user.role) || false;
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    parseImportFile(file);
  };

  const parseImportFile = async (file: File) => {
    try {
      const text = await file.text();
      
      if (file.name.endsWith('.csv')) {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index];
          });
          return row;
        }).filter(row => Object.values(row).some(v => v)); // Remove empty rows

        setPreviewData(data);
        validateImportData(data, headers);
      } else if (file.name.endsWith('.json')) {
        const data = JSON.parse(text);
        setPreviewData(Array.isArray(data) ? data : [data]);
        validateImportData(Array.isArray(data) ? data : [data], Object.keys(data[0] || {}));
      }
    } catch (error) {
      setValidationErrors(['ファイルの解析に失敗しました: ' + (error as Error).message]);
    }
  };

  const validateImportData = (data: any[], headers: string[]) => {
    const errors: string[] = [];
    
    // Required fields validation
    const requiredFields = ['visitId', 'examinationId', 'eyeSide', 'fieldName'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    
    if (missingFields.length > 0) {
      errors.push(`必須フィールドが不足しています: ${missingFields.join(', ')}`);
    }

    // Data validation
    data.forEach((row, index) => {
      if (!row.visitId) {
        errors.push(`行 ${index + 2}: visitIdが空です`);
      }
      if (!row.examinationId) {
        errors.push(`行 ${index + 2}: examinationIdが空です`);
      }
      if (row.eyeSide && !['right', 'left'].includes(row.eyeSide)) {
        errors.push(`行 ${index + 2}: eyeSideは'right'または'left'である必要があります`);
      }
    });

    setValidationErrors(errors);
  };

  const prepareBulkUpdate = () => {
    const items: BulkOperationItem[] = [];
    let itemId = 1;

    selectedVisits.forEach(visitId => {
      selectedExaminations.forEach(examId => {
        ['right', 'left'].forEach(eyeSide => {
          Object.entries(bulkEditData).forEach(([fieldName, newValue]) => {
            items.push({
              id: `item-${itemId++}`,
              visitId,
              examinationId: examId,
              eyeSide: eyeSide as 'right' | 'left',
              fieldName,
              currentValue: null, // Would be loaded from database
              newValue,
              status: 'pending',
            });
          });
        });
      });
    });

    return items;
  };

  const prepareBulkDelete = () => {
    const items: BulkOperationItem[] = [];
    let itemId = 1;

    selectedVisits.forEach(visitId => {
      selectedExaminations.forEach(examId => {
        ['right', 'left'].forEach(eyeSide => {
          items.push({
            id: `item-${itemId++}`,
            visitId,
            examinationId: examId,
            eyeSide: eyeSide as 'right' | 'left',
            fieldName: 'entire_record',
            currentValue: null,
            newValue: null,
            status: 'pending',
          });
        });
      });
    });

    return items;
  };

  const prepareBulkImport = () => {
    return previewData.map((row, index) => ({
      id: `import-${index + 1}`,
      visitId: row.visitId,
      examinationId: row.examinationId,
      eyeSide: row.eyeSide as 'right' | 'left',
      fieldName: row.fieldName,
      currentValue: null,
      newValue: row.newValue,
      status: 'pending' as const,
    }));
  };

  const createBulkJob = async () => {
    let items: BulkOperationItem[] = [];
    let jobName = '';
    let jobDescription = '';

    switch (operationType) {
      case 'update':
        items = prepareBulkUpdate();
        jobName = '一括データ更新';
        jobDescription = `${selectedVisits.length}個の訪問、${selectedExaminations.length}個の検査の一括更新`;
        break;
      case 'delete':
        items = prepareBulkDelete();
        jobName = '一括データ削除';
        jobDescription = `${selectedVisits.length}個の訪問、${selectedExaminations.length}個の検査の一括削除`;
        break;
      case 'import':
        items = prepareBulkImport();
        jobName = 'データインポート';
        jobDescription = `${previewData.length}件のデータインポート`;
        break;
      case 'export':
        items = [];
        jobName = 'データエクスポート';
        jobDescription = `${selectedVisits.length}個の訪問データのエクスポート`;
        break;
    }

    const job: BulkOperationJob = {
      id: `job-${Date.now()}`,
      type: operationType,
      name: jobName,
      description: jobDescription,
      items,
      status: 'pending',
      progress: 0,
      createdBy: user?.username || 'unknown',
      createdAt: new Date().toISOString(),
      totalItems: items.length,
      processedItems: 0,
      successItems: 0,
      failedItems: 0,
      skippedItems: 0,
    };

    setCurrentJob(job);
    setConfirmationDialog(false);
    
    // Start processing
    processBulkJob(job);
  };

  const processBulkJob = async (job: BulkOperationJob) => {
    setCurrentJob({ ...job, status: 'running', startedAt: new Date().toISOString() });
    
    for (let i = 0; i < job.items.length; i++) {
      if (currentJob?.status === 'paused') {
        break;
      }

      const item = job.items[i];
      
      try {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Process the item based on job type
        await processItem(item, job.type);
        
        item.status = 'completed';
        job.successItems++;
      } catch (error) {
        item.status = 'failed';
        item.error = (error as Error).message;
        job.failedItems++;
      }
      
      job.processedItems++;
      job.progress = Math.round((job.processedItems / job.totalItems) * 100);
      
      setCurrentJob({ ...job });
    }
    
    // Complete the job
    setCurrentJob({
      ...job,
      status: 'completed',
      completedAt: new Date().toISOString(),
    });

    if (onJobComplete) {
      onJobComplete(job);
    }
  };

  const processItem = async (item: BulkOperationItem, jobType: string) => {
    // This would call the appropriate backend API based on job type
    switch (jobType) {
      case 'update':
        // Call update API
        console.log('Updating item:', item);
        break;
      case 'delete':
        // Call delete API
        console.log('Deleting item:', item);
        break;
      case 'import':
        // Call import API
        console.log('Importing item:', item);
        break;
      case 'export':
        // Call export API
        console.log('Exporting item:', item);
        break;
    }
  };

  const pauseJob = () => {
    if (currentJob) {
      setCurrentJob({ ...currentJob, status: 'paused' });
    }
  };

  const resumeJob = () => {
    if (currentJob) {
      setCurrentJob({ ...currentJob, status: 'running' });
      processBulkJob(currentJob);
    }
  };

  const cancelJob = () => {
    if (currentJob) {
      setCurrentJob({ ...currentJob, status: 'failed' });
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Operation Type Selection
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              操作タイプを選択
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  variant={operationType === 'update' ? 'outlined' : 'elevation'}
                  sx={{ 
                    cursor: hasPermission('update') ? 'pointer' : 'not-allowed',
                    opacity: hasPermission('update') ? 1 : 0.5,
                    border: operationType === 'update' ? 2 : 1,
                    borderColor: operationType === 'update' ? 'primary.main' : 'divider',
                  }}
                  onClick={() => hasPermission('update') && setOperationType('update')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <EditIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6">一括更新</Typography>
                    <Typography variant="body2" color="text.secondary">
                      複数のデータを一度に更新
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  variant={operationType === 'delete' ? 'outlined' : 'elevation'}
                  sx={{ 
                    cursor: hasPermission('delete') ? 'pointer' : 'not-allowed',
                    opacity: hasPermission('delete') ? 1 : 0.5,
                    border: operationType === 'delete' ? 2 : 1,
                    borderColor: operationType === 'delete' ? 'primary.main' : 'divider',
                  }}
                  onClick={() => hasPermission('delete') && setOperationType('delete')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <DeleteIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
                    <Typography variant="h6">一括削除</Typography>
                    <Typography variant="body2" color="text.secondary">
                      複数のデータを一度に削除
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  variant={operationType === 'import' ? 'outlined' : 'elevation'}
                  sx={{ 
                    cursor: hasPermission('import') ? 'pointer' : 'not-allowed',
                    opacity: hasPermission('import') ? 1 : 0.5,
                    border: operationType === 'import' ? 2 : 1,
                    borderColor: operationType === 'import' ? 'primary.main' : 'divider',
                  }}
                  onClick={() => hasPermission('import') && setOperationType('import')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <UploadIcon sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                    <Typography variant="h6">インポート</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ファイルからデータを取り込み
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  variant={operationType === 'export' ? 'outlined' : 'elevation'}
                  sx={{ 
                    cursor: hasPermission('export') ? 'pointer' : 'not-allowed',
                    opacity: hasPermission('export') ? 1 : 0.5,
                    border: operationType === 'export' ? 2 : 1,
                    borderColor: operationType === 'export' ? 'primary.main' : 'divider',
                  }}
                  onClick={() => hasPermission('export') && setOperationType('export')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <DownloadIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6">エクスポート</Typography>
                    <Typography variant="body2" color="text.secondary">
                      データをファイルに出力
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 1: // Target Selection
        if (operationType === 'import') {
          return (
            <Box>
              <Typography variant="h6" gutterBottom>
                インポートファイルを選択
              </Typography>
              <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 4, textAlign: 'center', mb: 2 }}>
                <input
                  accept=".csv,.json"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  onChange={handleFileImport}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    size="large"
                  >
                    ファイルを選択
                  </Button>
                </label>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  CSV または JSON ファイルをアップロード
                </Typography>
              </Box>
              
              {importFile && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  選択されたファイル: {importFile.name} ({Math.round(importFile.size / 1024)}KB)
                </Alert>
              )}

              {validationErrors.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    検証エラー:
                  </Typography>
                  <ul>
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              {previewData.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>データプレビュー ({previewData.length}件)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            {Object.keys(previewData[0] || {}).map(key => (
                              <TableCell key={key}>{key}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {previewData.slice(0, 10).map((row, index) => (
                            <TableRow key={index}>
                              {Object.values(row).map((value, i) => (
                                <TableCell key={i}>{String(value)}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          );
        } else {
          return (
            <Box>
              <Typography variant="h6" gutterBottom>
                対象を選択
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>訪問を選択</InputLabel>
                    <Select
                      multiple
                      value={selectedVisits}
                      onChange={(e) => setSelectedVisits(e.target.value as string[])}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {visitIds.map(visitId => (
                        <MenuItem key={visitId} value={visitId}>
                          <Checkbox checked={selectedVisits.indexOf(visitId) > -1} />
                          <ListItemText primary={visitId} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>検査を選択</InputLabel>
                    <Select
                      multiple
                      value={selectedExaminations}
                      onChange={(e) => setSelectedExaminations(e.target.value as string[])}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {['basic-info', 'vas', 'comparative', 'fitting', 'dr1', 'corrected-va', 'lens-inspection', 'questionnaire'].map(examId => (
                        <MenuItem key={examId} value={examId}>
                          <Checkbox checked={selectedExaminations.indexOf(examId) > -1} />
                          <ListItemText primary={examId} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {operationType === 'update' && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    更新するフィールドと値を指定
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="フィールド名"
                        placeholder="例: comfortLevel"
                        onBlur={(e) => {
                          if (e.target.value) {
                            setBulkEditData(prev => ({
                              ...prev,
                              [e.target.value]: ''
                            }));
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="新しい値"
                        placeholder="例: 85"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          );
        }

      case 2: // Confirmation and Execution
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              実行確認
            </Typography>
            
            {currentJob && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      {currentJob.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {currentJob.status === 'running' && (
                        <Button
                          size="small"
                          startIcon={<PauseIcon />}
                          onClick={pauseJob}
                        >
                          一時停止
                        </Button>
                      )}
                      {currentJob.status === 'paused' && (
                        <Button
                          size="small"
                          startIcon={<PlayArrowIcon />}
                          onClick={resumeJob}
                        >
                          再開
                        </Button>
                      )}
                      <Button
                        size="small"
                        color="error"
                        startIcon={<StopIcon />}
                        onClick={cancelJob}
                        disabled={currentJob.status === 'completed'}
                      >
                        キャンセル
                      </Button>
                    </Box>
                  </Box>

                  <LinearProgress 
                    variant="determinate" 
                    value={currentJob.progress} 
                    sx={{ mb: 2 }}
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={3}>
                      <Typography variant="body2" color="text.secondary">
                        進捗
                      </Typography>
                      <Typography variant="h6">
                        {currentJob.processedItems} / {currentJob.totalItems}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2" color="text.secondary">
                        成功
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {currentJob.successItems}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2" color="text.secondary">
                        失敗
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {currentJob.failedItems}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2" color="text.secondary">
                        ステータス
                      </Typography>
                      <Chip 
                        label={currentJob.status}
                        color={
                          currentJob.status === 'completed' ? 'success' :
                          currentJob.status === 'running' ? 'primary' :
                          currentJob.status === 'failed' ? 'error' : 'default'
                        }
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {!currentJob && (
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrowIcon />}
                onClick={() => setConfirmationDialog(true)}
                disabled={
                  (operationType === 'import' && (validationErrors.length > 0 || !importFile)) ||
                  (operationType !== 'import' && (selectedVisits.length === 0 || selectedExaminations.length === 0))
                }
              >
                実行開始
              </Button>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        一括データ操作
      </Typography>

      <Stepper activeStep={activeStep} orientation="vertical">
        <Step>
          <StepLabel>操作タイプを選択</StepLabel>
          <StepContent>
            {renderStepContent(0)}
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={() => setActiveStep(1)}
                disabled={!hasPermission(operationType)}
              >
                次へ
              </Button>
            </Box>
          </StepContent>
        </Step>

        <Step>
          <StepLabel>
            {operationType === 'import' ? 'ファイルを選択' : '対象を選択'}
          </StepLabel>
          <StepContent>
            {renderStepContent(1)}
            <Box sx={{ mt: 2 }}>
              <Button
                onClick={() => setActiveStep(0)}
                sx={{ mr: 1 }}
              >
                戻る
              </Button>
              <Button
                variant="contained"
                onClick={() => setActiveStep(2)}
                disabled={
                  (operationType === 'import' && (!importFile || validationErrors.length > 0)) ||
                  (operationType !== 'import' && (selectedVisits.length === 0 || selectedExaminations.length === 0))
                }
              >
                次へ
              </Button>
            </Box>
          </StepContent>
        </Step>

        <Step>
          <StepLabel>実行</StepLabel>
          <StepContent>
            {renderStepContent(2)}
            <Box sx={{ mt: 2 }}>
              <Button
                onClick={() => setActiveStep(1)}
                sx={{ mr: 1 }}
                disabled={currentJob?.status === 'running'}
              >
                戻る
              </Button>
            </Box>
          </StepContent>
        </Step>
      </Stepper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmationDialog} onClose={() => setConfirmationDialog(false)}>
        <DialogTitle>
          実行の確認
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            この操作は元に戻せません。続行しますか？
          </Alert>
          <Typography variant="body1">
            操作タイプ: <strong>{operationType}</strong>
          </Typography>
          {operationType !== 'import' && (
            <>
              <Typography variant="body1">
                対象訪問数: <strong>{selectedVisits.length}</strong>
              </Typography>
              <Typography variant="body1">
                対象検査数: <strong>{selectedExaminations.length}</strong>
              </Typography>
            </>
          )}
          {operationType === 'import' && (
            <Typography variant="body1">
              インポート件数: <strong>{previewData.length}</strong>
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmationDialog(false)}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={createBulkJob}
          >
            実行
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BulkDataOperations;