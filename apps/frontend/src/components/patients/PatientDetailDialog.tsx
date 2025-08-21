import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  ContactEmergency as EmergencyIcon,
  LocalHospital as MedicalIcon,
  Medication as MedicationIcon,
  Warning as AllergyIcon,
  Assignment as StudyIcon,
} from '@mui/icons-material';
import { PatientRecord } from '@clinical-trial/shared';

interface PatientDetailDialogProps {
  open: boolean;
  patient: PatientRecord | null;
  onClose: () => void;
  onEdit?: (patient: PatientRecord) => void;
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

export default function PatientDetailDialog({
  open,
  patient,
  onClose,
  onEdit,
}: PatientDetailDialogProps) {
  if (!patient) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(patient);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <PersonIcon />
            <Typography variant="h6">患者詳細: {patient.patientCode}</Typography>
          </Box>
          <Chip
            label={statusLabels[patient.status]}
            color={statusColors[patient.status]}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* 基本情報 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  基本情報
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      患者コード
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {patient.patientCode}
                    </Typography>
                  </Grid>
                  {patient.patientInitials && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        患者イニシャル
                      </Typography>
                      <Typography variant="body1">
                        {patient.patientInitials}
                      </Typography>
                    </Grid>
                  )}
                  {patient.dateOfBirth && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        生年月日
                      </Typography>
                      <Typography variant="body1">
                        {new Date(patient.dateOfBirth).toLocaleDateString('ja-JP')}
                      </Typography>
                    </Grid>
                  )}
                  {patient.gender && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        性別
                      </Typography>
                      <Typography variant="body1">
                        {genderLabels[patient.gender] || patient.gender}
                      </Typography>
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      登録日
                    </Typography>
                    <Typography variant="body1">
                      {new Date(patient.registrationDate).toLocaleDateString('ja-JP')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      ステータス
                    </Typography>
                    <Chip
                      label={statusLabels[patient.status]}
                      color={statusColors[patient.status]}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 連絡先情報 */}
          {patient.contactInfo && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    連絡先情報
                  </Typography>
                  <Grid container spacing={2}>
                    {patient.contactInfo.phone && (
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PhoneIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              電話番号
                            </Typography>
                            <Typography variant="body1">
                              {patient.contactInfo.phone}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                    {patient.contactInfo.email && (
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <EmailIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              メールアドレス
                            </Typography>
                            <Typography variant="body1">
                              {patient.contactInfo.email}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                    {patient.contactInfo.emergencyContact && (
                      <Grid item xs={12}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <EmergencyIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              緊急連絡先
                            </Typography>
                            <Typography variant="body1">
                              {patient.contactInfo.emergencyContact}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* 医療情報 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  医療情報
                </Typography>
                
                {/* 既往歴 */}
                {patient.medicalHistory && patient.medicalHistory.length > 0 && (
                  <Box mb={2}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <MedicalIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2">既往歴</Typography>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {patient.medicalHistory.map((history, index) => (
                        <Chip
                          key={index}
                          label={history}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* 現在の薬物療法 */}
                {patient.currentMedications && patient.currentMedications.length > 0 && (
                  <Box mb={2}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <MedicationIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2">現在の薬物療法</Typography>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {patient.currentMedications.map((medication, index) => (
                        <Chip
                          key={index}
                          label={medication}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* アレルギー */}
                {patient.allergies && patient.allergies.length > 0 && (
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <AllergyIcon fontSize="small" color="warning" />
                      <Typography variant="subtitle2">アレルギー</Typography>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {patient.allergies.map((allergy, index) => (
                        <Chip
                          key={index}
                          label={allergy}
                          size="small"
                          variant="outlined"
                          color="warning"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {(!patient.medicalHistory || patient.medicalHistory.length === 0) &&
                 (!patient.currentMedications || patient.currentMedications.length === 0) &&
                 (!patient.allergies || patient.allergies.length === 0) && (
                  <Typography variant="body2" color="text.secondary">
                    医療情報は登録されていません
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 参加中の試験 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <StudyIcon fontSize="small" color="action" />
                  <Typography variant="h6">参加中の試験</Typography>
                </Box>
                {patient.participatingStudies && patient.participatingStudies.length > 0 ? (
                  <Typography variant="body1">
                    {patient.participatingStudies.length}件の試験に参加中
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    参加中の試験はありません
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 作成・更新情報 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  作成・更新情報
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      作成日時
                    </Typography>
                    <Typography variant="body1">
                      {new Date(patient.createdAt).toLocaleString('ja-JP')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      最終更新日時
                    </Typography>
                    <Typography variant="body1">
                      {new Date(patient.updatedAt).toLocaleString('ja-JP')}
                    </Typography>
                  </Grid>
                  {patient.createdBy && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        作成者
                      </Typography>
                      <Typography variant="body1">
                        {patient.createdBy}
                      </Typography>
                    </Grid>
                  )}
                  {patient.lastModifiedBy && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        最終更新者
                      </Typography>
                      <Typography variant="body1">
                        {patient.lastModifiedBy}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
        {onEdit && (
          <Button variant="contained" onClick={handleEdit}>
            編集
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}