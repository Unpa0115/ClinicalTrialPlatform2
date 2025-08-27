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
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  Visibility as ViewIcon,
  Lock as LockIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { EXAMINATION_CONFIG } from '../examinations/DynamicExaminationForm';

interface DataCorrectionRecord {
  id: string;
  visitId: string;
  examinationId: string;
  eyeSide: 'right' | 'left';
  fieldName: string;
  originalValue: any;
  correctedValue: any;
  reason: string;
  correctedBy: string;
  correctedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface DataEditRequest {
  visitId: string;
  examinationId: string;
  eyeSide: 'right' | 'left';
  fieldName: string;
  originalValue: any;
  newValue: any;
  reason: string;
}

interface DataCorrectionInterfaceProps {
  visitId: string;
  examinationData: {
    [examinationId: string]: {
      right?: any;
      left?: any;
    };
  };
  onDataUpdate?: (updatedData: any) => void;
  allowDirectEdit?: boolean;
  requireApproval?: boolean;
}

const DataCorrectionInterface: React.FC<DataCorrectionInterfaceProps> = ({
  visitId,
  examinationData,
  onDataUpdate,
  allowDirectEdit = false,
  requireApproval = true,
}) => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<{
    examinationId: string;
    eyeSide: 'right' | 'left';
    fieldName: string;
    currentValue: any;
  } | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [editReason, setEditReason] = useState('');
  const [corrections, setCorrections] = useState<DataCorrectionRecord[]>([]);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCorrectionHistory();
    loadAuditHistory();
  }, [visitId]);

  const loadCorrectionHistory = async () => {
    // This would load correction history from the backend
    // Placeholder data for now
    setCorrections([]);
  };

  const loadAuditHistory = async () => {
    // This would load audit history from the backend
    // Placeholder data for now
    setAuditHistory([]);
  };

  const hasEditPermission = () => {
    if (!user) return false;
    const allowedRoles = ['super_admin', 'study_admin', 'org_admin', 'investigator'];
    return allowedRoles.includes(user.role);
  };

  const hasDeletePermission = () => {
    if (!user) return false;
    const allowedRoles = ['super_admin', 'study_admin'];
    return allowedRoles.includes(user.role);
  };

  const hasApprovalPermission = () => {
    if (!user) return false;
    const allowedRoles = ['super_admin', 'study_admin', 'org_admin'];
    return allowedRoles.includes(user.role);
  };

  const handleEditField = (
    examinationId: string,
    eyeSide: 'right' | 'left',
    fieldName: string,
    currentValue: any
  ) => {
    if (!hasEditPermission()) {
      alert('データ修正の権限がありません');
      return;
    }

    setCurrentEdit({
      examinationId,
      eyeSide,
      fieldName,
      currentValue,
    });
    setEditValue(currentValue || '');
    setEditReason('');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!currentEdit || !editReason.trim()) {
      alert('修正理由を入力してください');
      return;
    }

    const editRequest: DataEditRequest = {
      visitId,
      examinationId: currentEdit.examinationId,
      eyeSide: currentEdit.eyeSide,
      fieldName: currentEdit.fieldName,
      originalValue: currentEdit.currentValue,
      newValue: editValue,
      reason: editReason,
    };

    try {
      if (allowDirectEdit && !requireApproval) {
        // Direct edit - update data immediately
        await submitDirectEdit(editRequest);
      } else {
        // Submit for approval
        await submitEditRequest(editRequest);
      }

      setEditDialogOpen(false);
      setCurrentEdit(null);
      setEditValue('');
      setEditReason('');

      // Reload correction history
      loadCorrectionHistory();
    } catch (error) {
      console.error('Failed to save edit:', error);
      alert('データの修正に失敗しました');
    }
  };

  const submitDirectEdit = async (editRequest: DataEditRequest) => {
    // This would call the backend API to update the data directly
    console.log('Submitting direct edit:', editRequest);
    
    // Update local data
    if (onDataUpdate) {
      const updatedData = { ...examinationData };
      if (!updatedData[editRequest.examinationId]) {
        updatedData[editRequest.examinationId] = {};
      }
      if (!updatedData[editRequest.examinationId][editRequest.eyeSide]) {
        updatedData[editRequest.examinationId][editRequest.eyeSide] = {};
      }
      updatedData[editRequest.examinationId][editRequest.eyeSide][editRequest.fieldName] = editRequest.newValue;
      onDataUpdate(updatedData);
    }
  };

  const submitEditRequest = async (editRequest: DataEditRequest) => {
    // This would call the backend API to submit edit request for approval
    console.log('Submitting edit request:', editRequest);
  };

  const handleDeleteData = (
    examinationId: string,
    eyeSide: 'right' | 'left'
  ) => {
    if (!hasDeletePermission()) {
      alert('データ削除の権限がありません');
      return;
    }

    // Show delete confirmation dialog
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    // This would call the backend API to delete data
    setDeleteDialogOpen(false);
  };

  const handleApproveCorrection = async (correctionId: string) => {
    if (!hasApprovalPermission()) {
      alert('承認権限がありません');
      return;
    }

    // This would call the backend API to approve the correction
    console.log('Approving correction:', correctionId);
  };

  const handleRejectCorrection = async (correctionId: string, reason: string) => {
    if (!hasApprovalPermission()) {
      alert('承認権限がありません');
      return;
    }

    // This would call the backend API to reject the correction
    console.log('Rejecting correction:', correctionId, 'Reason:', reason);
  };

  const renderFieldValue = (value: any, fieldName: string) => {
    if (value === null || value === undefined) {
      return <Chip label="データなし" size="small" variant="outlined" />;
    }

    if (typeof value === 'boolean') {
      return <Chip label={value ? 'はい' : 'いいえ'} size="small" color={value ? 'success' : 'default'} />;
    }

    if (typeof value === 'number') {
      return <Typography variant="body2" fontWeight="bold">{value}</Typography>;
    }

    return <Typography variant="body2">{String(value)}</Typography>;
  };

  const renderExaminationDataTable = (examinationId: string) => {
    const config = EXAMINATION_CONFIG[examinationId as keyof typeof EXAMINATION_CONFIG];
    const data = examinationData[examinationId];

    if (!data) {
      return (
        <Alert severity="info">
          このexaminationにはデータがありません
        </Alert>
      );
    }

    const rightData = data.right || {};
    const leftData = data.left || {};
    const allFields = new Set([...Object.keys(rightData), ...Object.keys(leftData)]);

    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>フィールド</TableCell>
              <TableCell align="center">右目 (Right)</TableCell>
              <TableCell align="center">左目 (Left)</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from(allFields).map((fieldName) => (
              <TableRow key={fieldName}>
                <TableCell>
                  <Typography variant="subtitle2">
                    {fieldName}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    {renderFieldValue(rightData[fieldName], fieldName)}
                    {hasEditPermission() && (
                      <IconButton
                        size="small"
                        onClick={() => handleEditField(examinationId, 'right', fieldName, rightData[fieldName])}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    {renderFieldValue(leftData[fieldName], fieldName)}
                    {hasEditPermission() && (
                      <IconButton
                        size="small"
                        onClick={() => handleEditField(examinationId, 'left', fieldName, leftData[fieldName])}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="履歴表示">
                      <IconButton
                        size="small"
                        onClick={() => setHistoryDialogOpen(true)}
                      >
                        <HistoryIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {hasDeletePermission() && (
                      <Tooltip title="データ削除">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteData(examinationId, 'right')}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderPendingCorrections = () => {
    const pendingCorrections = corrections.filter(c => c.status === 'pending');

    if (pendingCorrections.length === 0) {
      return (
        <Alert severity="info">
          承認待ちの修正はありません
        </Alert>
      );
    }

    return (
      <List>
        {pendingCorrections.map((correction) => (
          <ListItem key={correction.id}>
            <Card sx={{ width: '100%' }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2">
                      {EXAMINATION_CONFIG[correction.examinationId as keyof typeof EXAMINATION_CONFIG]?.name || correction.examinationId}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {correction.eyeSide === 'right' ? '右目' : '左目'} - {correction.fieldName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2">
                      <strong>元の値:</strong> {renderFieldValue(correction.originalValue, correction.fieldName)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>修正値:</strong> {renderFieldValue(correction.correctedValue, correction.fieldName)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2">
                      <strong>理由:</strong> {correction.reason}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      修正者: {correction.correctedBy} ({new Date(correction.correctedAt).toLocaleString('ja-JP')})
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    {hasApprovalPermission() && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => handleApproveCorrection(correction.id)}
                        >
                          承認
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<ErrorIcon />}
                          onClick={() => {
                            const reason = prompt('却下理由を入力してください:');
                            if (reason) {
                              handleRejectCorrection(correction.id, reason);
                            }
                          }}
                        >
                          却下
                        </Button>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </ListItem>
        ))}
      </List>
    );
  };

  const examinationIds = Object.keys(examinationData);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          データ管理・修正
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={bulkEditMode}
                onChange={(e) => setBulkEditMode(e.target.checked)}
                disabled={!hasEditPermission()}
              />
            }
            label="一括編集モード"
          />
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={() => setHistoryDialogOpen(true)}
          >
            変更履歴
          </Button>
        </Box>
      </Box>

      {/* Permission Alert */}
      {!hasEditPermission() && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon />
            <Typography>
              データ編集権限がありません。閲覧のみ可能です。
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Data Management Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={selectedTab} 
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {examinationIds.map((examId, index) => {
              const config = EXAMINATION_CONFIG[examId as keyof typeof EXAMINATION_CONFIG];
              return (
                <Tab
                  key={examId}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{config?.icon}</span>
                      <span>{config?.name || examId}</span>
                    </Box>
                  }
                />
              );
            })}
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon />
                  <span>承認管理</span>
                </Box>
              }
            />
          </Tabs>
        </Box>

        <CardContent>
          {/* Examination Data Tables */}
          {examinationIds.map((examId, index) => (
            selectedTab === index && (
              <Box key={examId}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{EXAMINATION_CONFIG[examId as keyof typeof EXAMINATION_CONFIG]?.icon}</span>
                  {EXAMINATION_CONFIG[examId as keyof typeof EXAMINATION_CONFIG]?.name || examId}
                </Typography>
                {renderExaminationDataTable(examId)}
              </Box>
            )
          ))}

          {/* Approval Management Tab */}
          {selectedTab === examinationIds.length && (
            <Box>
              <Typography variant="h6" gutterBottom>
                承認管理
              </Typography>
              {renderPendingCorrections()}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          データ修正
        </DialogTitle>
        <DialogContent>
          {currentEdit && (
            <Box sx={{ pt: 1 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>対象:</strong> {EXAMINATION_CONFIG[currentEdit.examinationId as keyof typeof EXAMINATION_CONFIG]?.name} - 
                  {currentEdit.eyeSide === 'right' ? '右目' : '左目'} - {currentEdit.fieldName}
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Paper sx={{ p: 2, flex: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    現在の値
                  </Typography>
                  {renderFieldValue(currentEdit.currentValue, currentEdit.fieldName)}
                </Paper>
                <Paper sx={{ p: 2, flex: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    修正後の値
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="新しい値を入力"
                  />
                </Paper>
              </Box>

              <TextField
                fullWidth
                label="修正理由 *"
                multiline
                rows={3}
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="データを修正する理由を詳しく入力してください"
                required
                sx={{ mb: 2 }}
              />

              {requireApproval && !allowDirectEdit && (
                <Alert severity="warning">
                  この修正は管理者の承認が必要です。承認されるまで変更は適用されません。
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveEdit}
            disabled={!editReason.trim()}
          >
            {allowDirectEdit && !requireApproval ? '保存' : '承認申請'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          データ削除の確認
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            この操作は元に戻せません。本当にデータを削除しますか？
          </Alert>
          <TextField
            fullWidth
            label="削除理由 *"
            multiline
            rows={3}
            placeholder="データを削除する理由を詳しく入力してください"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={confirmDelete}
          >
            削除
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          変更履歴
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {auditHistory.length === 0 ? (
              <Alert severity="info">
                変更履歴はありません
              </Alert>
            ) : (
              <List>
                {auditHistory.map((entry, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <HistoryIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={entry.action}
                      secondary={`${entry.user} - ${new Date(entry.timestamp).toLocaleString('ja-JP')}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataCorrectionInterface;