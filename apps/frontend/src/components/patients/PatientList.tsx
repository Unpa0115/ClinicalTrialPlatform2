import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  TextField,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Avatar,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  LocalHospital as MedicalIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { PatientRecord } from '@clinical-trial/shared';
import { patientService } from '../../services/PatientService';
import { useAuth } from '../../contexts/AuthContext';
import PatientCreateForm from './PatientCreateForm';
import PatientEditForm from './PatientEditForm';
import PatientDetailDialog from './PatientDetailDialog';

interface PatientListProps {
  organizationId?: string;
  onAssignToSurvey?: (patient: PatientRecord) => void;
}

const statusColors: Record<PatientRecord['status'], 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  active: 'success',
  inactive: 'default',
  withdrawn: 'warning',
  completed: 'info',
};

const statusLabels: Record<PatientRecord['status'], string> = {
  active: '有効',
  inactive: '無効',
  withdrawn: '辞退',
  completed: '完了',
};

const genderLabels: Record<string, string> = {
  male: '男性',
  female: '女性',
  other: 'その他',
};

export default function PatientList({ 
  organizationId, 
  onAssignToSurvey 
}: PatientListProps) {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);

  // Success message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Status update dialog
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    patient: PatientRecord | null;
    newStatus: PatientRecord['status'] | null;
  }>({
    open: false,
    patient: null,
    newStatus: null,
  });

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    patient: PatientRecord | null;
    loading: boolean;
  }>({
    open: false,
    patient: null,
    loading: false,
  });

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const targetOrgId = organizationId || user?.organizationId;
      if (!targetOrgId) {
        setError('Organization ID is required');
        return;
      }

      const options: any = {
        organizationId: targetOrgId,
      };
      
      if (statusFilter) options.status = statusFilter;
      if (searchTerm) options.patientCodePrefix = searchTerm;

      const response = await patientService.searchPatients(options);
      setPatients(response.patients);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [statusFilter, searchTerm, organizationId, user]);

  const handleStatusUpdate = async () => {
    if (!statusDialog.patient || !statusDialog.newStatus) return;

    try {
      await patientService.updatePatientStatus(statusDialog.patient.patientId, statusDialog.newStatus);
      setStatusDialog({ open: false, patient: null, newStatus: null });
      setSuccessMessage('患者のステータスを更新しました');
      loadPatients(); // Reload the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update patient status');
    }
  };

  const handleCreatePatient = () => {
    setCreateFormOpen(true);
  };

  const handleEditPatient = (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setEditFormOpen(true);
  };

  const handleViewPatient = (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setDetailDialogOpen(true);
  };

  const handlePatientCreated = (patient: PatientRecord) => {
    setSuccessMessage(`患者「${patient.patientCode}」を作成しました`);
    loadPatients();
  };

  const handlePatientUpdated = (patient: PatientRecord) => {
    setSuccessMessage(`患者「${patient.patientCode}」を更新しました`);
    loadPatients();
  };

  const handleEditFromDetail = (patient: PatientRecord) => {
    setDetailDialogOpen(false);
    setSelectedPatient(patient);
    setEditFormOpen(true);
  };

  const handleDeletePatient = (patient: PatientRecord) => {
    setDeleteDialog({
      open: true,
      patient,
      loading: false,
    });
  };

  const confirmDeletePatient = async () => {
    if (!deleteDialog.patient) return;

    try {
      setDeleteDialog(prev => ({ ...prev, loading: true }));
      await patientService.deletePatient(deleteDialog.patient.patientId);
      setDeleteDialog({ open: false, patient: null, loading: false });
      setSuccessMessage(`Patient "${deleteDialog.patient.patientName}" deleted successfully`);
      loadPatients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete patient');
      setDeleteDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const canCreatePatient = user?.role !== 'viewer';
  const canEditPatient = (patient: PatientRecord) => {
    if (user?.role === 'super_admin' || user?.role === 'study_admin') return true;
    if (user?.role === 'org_admin' && user.organizationId === patient.registeredOrganizationId) return true;
    return false;
  };

  const canDeletePatient = (patient: PatientRecord) => {
    // Only super admin and study admin can delete patients, and only if status is inactive
    return (user?.role === 'super_admin' || user?.role === 'study_admin') && 
           patient.status === 'inactive';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          患者マスター管理
        </Typography>
        {canCreatePatient && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreatePatient}
          >
            新規患者登録
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3}>
        <TextField
          label="患者コード検索"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="患者コードで検索"
          sx={{ minWidth: 200 }}
        />
        <TextField
          select
          label="ステータス"
          variant="outlined"
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">すべて</MenuItem>
          <MenuItem value="active">有効</MenuItem>
          <MenuItem value="inactive">無効</MenuItem>
          <MenuItem value="withdrawn">辞退</MenuItem>
          <MenuItem value="completed">完了</MenuItem>
        </TextField>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Patients Grid */}
      <Grid container spacing={3}>
        {patients.map((patient) => (
          <Grid item xs={12} md={6} lg={4} key={patient.patientId}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="h2">
                        {patient.patientCode}
                      </Typography>
                      {patient.patientInitials && (
                        <Typography variant="body2" color="text.secondary">
                          {patient.patientInitials}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Chip
                    label={statusLabels[patient.status]}
                    color={statusColors[patient.status]}
                    size="small"
                  />
                </Box>

                {patient.gender && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    性別: {genderLabels[patient.gender] || patient.gender}
                  </Typography>
                )}

                {patient.dateOfBirth && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    生年月日: {new Date(patient.dateOfBirth).toLocaleDateString('ja-JP')}
                  </Typography>
                )}

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  登録日: {new Date(patient.registrationDate).toLocaleDateString('ja-JP')}
                </Typography>

                {patient.medicalHistory && patient.medicalHistory.length > 0 && (
                  <Box mb={1}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <MedicalIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        既往歴:
                      </Typography>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {patient.medicalHistory.slice(0, 2).map((history, index) => (
                        <Chip
                          key={index}
                          label={history}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {patient.medicalHistory.length > 2 && (
                        <Chip
                          label={`+${patient.medicalHistory.length - 2}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                )}

                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <AssignmentIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    参加中の試験: {patient.participatingStudies.length}件
                  </Typography>
                </Box>

                {/* Action Buttons */}
                <Box display="flex" justifyContent="flex-end" gap={1} flexWrap="wrap">
                  <IconButton
                    size="small"
                    onClick={() => handleViewPatient(patient)}
                    title="詳細表示"
                  >
                    <ViewIcon />
                  </IconButton>
                  {canEditPatient(patient) && (
                    <IconButton
                      size="small"
                      onClick={() => handleEditPatient(patient)}
                      title="編集"
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                  {onAssignToSurvey && patient.status === 'active' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onAssignToSurvey(patient)}
                      startIcon={<AssignmentIcon />}
                    >
                      試験割当
                    </Button>
                  )}
                  {canEditPatient(patient) && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setStatusDialog({
                        open: true,
                        patient,
                        newStatus: patient.status === 'active' ? 'inactive' : 'active'
                      })}
                    >
                      ステータス変更
                    </Button>
                  )}
                  {canDeletePatient(patient) && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeletePatient(patient)}
                      title="削除"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {patients.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            {searchTerm || statusFilter ? '条件に一致する患者が見つかりません' : '患者がいません'}
          </Typography>
        </Box>
      )}

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialog.open}
        onClose={() => setStatusDialog({ open: false, patient: null, newStatus: null })}
      >
        <DialogTitle>ステータス変更</DialogTitle>
        <DialogContent>
          <Typography>
            患者「{statusDialog.patient?.patientCode}」のステータスを変更しますか？
          </Typography>
          <TextField
            select
            fullWidth
            margin="normal"
            label="新しいステータス"
            value={statusDialog.newStatus || ''}
            onChange={(e) => setStatusDialog(prev => ({
              ...prev,
              newStatus: e.target.value as PatientRecord['status']
            }))}
          >
            <MenuItem value="active">有効</MenuItem>
            <MenuItem value="inactive">無効</MenuItem>
            <MenuItem value="withdrawn">辞退</MenuItem>
            <MenuItem value="completed">完了</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, patient: null, newStatus: null })}>
            キャンセル
          </Button>
          <Button onClick={handleStatusUpdate} variant="contained">
            変更
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => !deleteDialog.loading && setDeleteDialog({ open: false, patient: null, loading: false })}
      >
        <DialogTitle>削除確認</DialogTitle>
        <DialogContent>
          <Typography>
            患者「{deleteDialog.patient?.patientCode}」を削除しますか？
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            この操作は取り消せません。関連するデータがすべて永続的に削除されます。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, patient: null, loading: false })}
            disabled={deleteDialog.loading}
          >
            キャンセル
          </Button>
          <Button 
            onClick={confirmDeletePatient} 
            variant="contained" 
            color="error"
            disabled={deleteDialog.loading}
            startIcon={deleteDialog.loading ? <CircularProgress size={20} /> : null}
          >
            {deleteDialog.loading ? '削除中...' : '削除'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Patient Create Form */}
      <PatientCreateForm
        open={createFormOpen}
        onClose={() => setCreateFormOpen(false)}
        onSuccess={handlePatientCreated}
        organizationId={organizationId}
      />

      {/* Patient Edit Form */}
      <PatientEditForm
        open={editFormOpen}
        patient={selectedPatient}
        onClose={() => {
          setEditFormOpen(false);
          setSelectedPatient(null);
        }}
        onSuccess={handlePatientUpdated}
      />

      {/* Patient Detail Dialog */}
      <PatientDetailDialog
        open={detailDialogOpen}
        patient={selectedPatient}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedPatient(null);
        }}
        onEdit={handleEditFromDetail}
      />

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Box>
  );
}