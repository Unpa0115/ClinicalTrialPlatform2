import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  Typography,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PatientRecord } from '@clinical-trial/shared';
import { patientService, CreatePatientRequest } from '../../services/PatientService';
import { useAuth } from '../../contexts/AuthContext';

const patientSchema = z.object({
  patientCode: z.string().min(3, '患者コードは3文字以上で入力してください').max(20, '患者コードは20文字以下で入力してください'),
  patientInitials: z.string().max(10, 'イニシャルは10文字以下で入力してください').optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  registeredOrganizationId: z.string().min(1, '組織IDは必須です'),
  medicalHistory: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  contactInfo: z.object({
    phone: z.string().max(50).optional(),
    email: z.string().email('有効なメールアドレスを入力してください').optional(),
    emergencyContact: z.string().max(100).optional(),
  }).optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientCreateFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (patient: PatientRecord) => void;
  organizationId?: string;
}

export default function PatientCreateForm({
  open,
  onClose,
  onSuccess,
  organizationId,
}: PatientCreateFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      patientCode: '',
      patientInitials: '',
      dateOfBirth: '',
      gender: '',
      registeredOrganizationId: organizationId || user?.organizationId || '',
      medicalHistory: [],
      currentMedications: [],
      allergies: [],
      contactInfo: {
        phone: '',
        email: '',
        emergencyContact: '',
      },
    },
  });

  const {
    fields: medicalHistoryFields,
    append: appendMedicalHistory,
    remove: removeMedicalHistory,
  } = useFieldArray({
    control,
    name: 'medicalHistory',
  });

  const {
    fields: medicationFields,
    append: appendMedication,
    remove: removeMedication,
  } = useFieldArray({
    control,
    name: 'currentMedications',
  });

  const {
    fields: allergyFields,
    append: appendAllergy,
    remove: removeAllergy,
  } = useFieldArray({
    control,
    name: 'allergies',
  });

  const onSubmit = async (data: PatientFormData) => {
    try {
      setLoading(true);
      setError(null);

      const createRequest: CreatePatientRequest = {
        ...data,
        gender: data.gender === '' ? undefined : data.gender as 'male' | 'female' | 'other',
        medicalHistory: data.medicalHistory?.filter(item => item.trim() !== ''),
        currentMedications: data.currentMedications?.filter(item => item.trim() !== ''),
        allergies: data.allergies?.filter(item => item.trim() !== ''),
      };

      const response = await patientService.createPatient(createRequest);
      onSuccess(response.patient);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '患者の作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>新規患者登録</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* 基本情報 */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                基本情報
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="patientCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="患者コード *"
                    fullWidth
                    error={!!errors.patientCode}
                    helperText={errors.patientCode?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="patientInitials"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="患者イニシャル"
                    fullWidth
                    error={!!errors.patientInitials}
                    helperText={errors.patientInitials?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="生年月日"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.dateOfBirth}
                    helperText={errors.dateOfBirth?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="性別"
                    fullWidth
                    error={!!errors.gender}
                    helperText={errors.gender?.message}
                  >
                    <MenuItem value="">選択してください</MenuItem>
                    <MenuItem value="male">男性</MenuItem>
                    <MenuItem value="female">女性</MenuItem>
                    <MenuItem value="other">その他</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            {/* 連絡先情報 */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                連絡先情報
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="contactInfo.phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="電話番号"
                    fullWidth
                    error={!!errors.contactInfo?.phone}
                    helperText={errors.contactInfo?.phone?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="contactInfo.email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="メールアドレス"
                    type="email"
                    fullWidth
                    error={!!errors.contactInfo?.email}
                    helperText={errors.contactInfo?.email?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="contactInfo.emergencyContact"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="緊急連絡先"
                    fullWidth
                    error={!!errors.contactInfo?.emergencyContact}
                    helperText={errors.contactInfo?.emergencyContact?.message}
                  />
                )}
              />
            </Grid>

            {/* 既往歴 */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6">既往歴</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => appendMedicalHistory('')}
                  size="small"
                >
                  追加
                </Button>
              </Box>
              {medicalHistoryFields.map((field, index) => (
                <Box key={field.id} display="flex" alignItems="center" gap={1} mb={1}>
                  <Controller
                    name={`medicalHistory.${index}`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={`既往歴 ${index + 1}`}
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                  <IconButton
                    onClick={() => removeMedicalHistory(index)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Grid>

            {/* 現在の薬物療法 */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6">現在の薬物療法</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => appendMedication('')}
                  size="small"
                >
                  追加
                </Button>
              </Box>
              {medicationFields.map((field, index) => (
                <Box key={field.id} display="flex" alignItems="center" gap={1} mb={1}>
                  <Controller
                    name={`currentMedications.${index}`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={`薬物療法 ${index + 1}`}
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                  <IconButton
                    onClick={() => removeMedication(index)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Grid>

            {/* アレルギー */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6">アレルギー</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => appendAllergy('')}
                  size="small"
                >
                  追加
                </Button>
              </Box>
              {allergyFields.map((field, index) => (
                <Box key={field.id} display="flex" alignItems="center" gap={1} mb={1}>
                  <Controller
                    name={`allergies.${index}`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={`アレルギー ${index + 1}`}
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                  <IconButton
                    onClick={() => removeAllergy(index)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? '作成中...' : '患者を作成'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}