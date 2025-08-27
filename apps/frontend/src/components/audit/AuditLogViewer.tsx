import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DatePicker,
  Pagination,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Avatar,
} from '@mui/material';
import { DatePicker as MUIDatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Download as ExportIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Event as EventIcon,
  ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface AuditLogEntry {
  logId: string;
  timestamp: string;
  eventType: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'export' | 'import';
  action: string;
  userId: string;
  username: string;
  userRole: string;
  targetType: 'clinical_study' | 'survey' | 'visit' | 'examination' | 'user' | 'organization' | 'patient';
  targetId: string;
  targetName?: string;
  clinicalStudyId?: string;
  organizationId?: string;
  patientId?: string;
  surveyId?: string;
  visitId?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  createdAt: string;
}

interface AuditLogFilter {
  eventType?: string;
  severity?: string;
  userId?: string;
  targetType?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  searchText?: string;
}

interface AuditLogViewerProps {
  organizationId?: string;
  clinicalStudyId?: string;
  patientId?: string;
  onExport?: (logs: AuditLogEntry[]) => void;
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  organizationId,
  clinicalStudyId,
  patientId,
  onExport,
}) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<AuditLogFilter>({});
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [stats, setStats] = useState<{
    total: number;
    byEventType: { [key: string]: number };
    bySeverity: { [key: string]: number };
    byUser: { [key: string]: number };
  }>({
    total: 0,
    byEventType: {},
    bySeverity: {},
    byUser: {},
  });

  useEffect(() => {
    loadAuditLogs();
  }, [currentPage, pageSize, organizationId, clinicalStudyId, patientId]);

  useEffect(() => {
    applyFilters();
  }, [logs, filters]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      // This would call the backend API to load audit logs
      // For now, using mock data
      const mockLogs: AuditLogEntry[] = [
        {
          logId: 'log-1',
          timestamp: new Date().toISOString(),
          eventType: 'update',
          action: 'examination_data_updated',
          userId: 'user-1',
          username: 'doctor@example.com',
          userRole: 'investigator',
          targetType: 'examination',
          targetId: 'exam-1',
          targetName: 'VAS評価',
          clinicalStudyId: 'study-1',
          organizationId: organizationId || 'org-1',
          patientId: patientId || 'patient-1',
          surveyId: 'survey-1',
          visitId: 'visit-1',
          changes: [
            {
              field: 'comfortLevel',
              oldValue: 75,
              newValue: 80,
            },
          ],
          description: 'VASスコアの修正',
          severity: 'medium',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          sessionId: 'session-123',
          createdAt: new Date().toISOString(),
        },
        {
          logId: 'log-2',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          eventType: 'view',
          action: 'patient_data_accessed',
          userId: 'user-2',
          username: 'coordinator@example.com',
          userRole: 'coordinator',
          targetType: 'patient',
          targetId: 'patient-1',
          targetName: '患者001',
          organizationId: organizationId || 'org-1',
          severity: 'low',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0...',
          sessionId: 'session-124',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          logId: 'log-3',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          eventType: 'delete',
          action: 'visit_data_deleted',
          userId: 'user-1',
          username: 'doctor@example.com',
          userRole: 'investigator',
          targetType: 'visit',
          targetId: 'visit-2',
          targetName: '1週間後フォローアップ',
          clinicalStudyId: 'study-1',
          organizationId: organizationId || 'org-1',
          patientId: patientId || 'patient-1',
          description: 'プロトコル逸脱によるデータ削除',
          severity: 'high',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          sessionId: 'session-125',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ];

      setLogs(mockLogs);
      
      // Calculate statistics
      const newStats = {
        total: mockLogs.length,
        byEventType: {},
        bySeverity: {},
        byUser: {},
      };

      mockLogs.forEach(log => {
        newStats.byEventType[log.eventType] = (newStats.byEventType[log.eventType] || 0) + 1;
        newStats.bySeverity[log.severity] = (newStats.bySeverity[log.severity] || 0) + 1;
        newStats.byUser[log.username] = (newStats.byUser[log.username] || 0) + 1;
      });

      setStats(newStats);
      setTotalPages(Math.ceil(mockLogs.length / pageSize));
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    if (filters.eventType) {
      filtered = filtered.filter(log => log.eventType === filters.eventType);
    }

    if (filters.severity) {
      filtered = filtered.filter(log => log.severity === filters.severity);
    }

    if (filters.userId) {
      filtered = filtered.filter(log => log.userId === filters.userId);
    }

    if (filters.targetType) {
      filtered = filtered.filter(log => log.targetType === filters.targetType);
    }

    if (filters.startDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= filters.endDate!);
    }

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchLower) ||
        log.username.toLowerCase().includes(searchLower) ||
        log.targetName?.toLowerCase().includes(searchLower) ||
        log.description?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredLogs(filtered);
  };

  const getEventTypeIcon = (eventType: string) => {
    const iconProps = { fontSize: 'small' as const };
    switch (eventType) {
      case 'create':
        return <InfoIcon color="info" {...iconProps} />;
      case 'update':
        return <InfoIcon color="warning" {...iconProps} />;
      case 'delete':
        return <ErrorIcon color="error" {...iconProps} />;
      case 'view':
        return <ViewIcon color="action" {...iconProps} />;
      case 'login':
      case 'logout':
        return <SecurityIcon color="primary" {...iconProps} />;
      case 'export':
      case 'import':
        return <AssessmentIcon color="secondary" {...iconProps} />;
      default:
        return <InfoIcon {...iconProps} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'info';
    }
  };

  const getSeverityLabel = (severity: string) => {
    const labels = {
      critical: '緊急',
      high: '高',
      medium: '中',
      low: '低',
    };
    return labels[severity as keyof typeof labels] || severity;
  };

  const getEventTypeLabel = (eventType: string) => {
    const labels = {
      create: '作成',
      update: '更新',
      delete: '削除',
      view: '閲覧',
      login: 'ログイン',
      logout: 'ログアウト',
      export: 'エクスポート',
      import: 'インポート',
    };
    return labels[eventType as keyof typeof labels] || eventType;
  };

  const getTargetTypeLabel = (targetType: string) => {
    const labels = {
      clinical_study: '臨床試験',
      survey: 'サーベイ',
      visit: '訪問',
      examination: '検査',
      user: 'ユーザー',
      organization: '組織',
      patient: '患者',
    };
    return labels[targetType as keyof typeof labels] || targetType;
  };

  const handleViewDetails = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const handleExport = () => {
    if (onExport) {
      onExport(filteredLogs);
    } else {
      // Default export implementation
      const csvContent = generateCSV(filteredLogs);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const generateCSV = (logs: AuditLogEntry[]) => {
    const headers = [
      'ログID',
      '日時',
      'イベント種別',
      'アクション',
      'ユーザー',
      'ロール',
      '対象種別',
      '対象名',
      '重要度',
      '説明',
      'IPアドレス'
    ];

    const rows = logs.map(log => [
      log.logId,
      format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: ja }),
      getEventTypeLabel(log.eventType),
      log.action,
      log.username,
      log.userRole,
      getTargetTypeLabel(log.targetType),
      log.targetName || log.targetId,
      getSeverityLabel(log.severity),
      log.description || '',
      log.ipAddress,
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const renderFilterChips = () => {
    const activeFilters = [];

    if (filters.eventType) {
      activeFilters.push(
        <Chip
          key="eventType"
          label={`イベント: ${getEventTypeLabel(filters.eventType)}`}
          onDelete={() => setFilters({ ...filters, eventType: undefined })}
          size="small"
        />
      );
    }

    if (filters.severity) {
      activeFilters.push(
        <Chip
          key="severity"
          label={`重要度: ${getSeverityLabel(filters.severity)}`}
          onDelete={() => setFilters({ ...filters, severity: undefined })}
          size="small"
        />
      );
    }

    if (filters.targetType) {
      activeFilters.push(
        <Chip
          key="targetType"
          label={`対象: ${getTargetTypeLabel(filters.targetType)}`}
          onDelete={() => setFilters({ ...filters, targetType: undefined })}
          size="small"
        />
      );
    }

    if (filters.startDate || filters.endDate) {
      const dateLabel = filters.startDate && filters.endDate
        ? `期間: ${format(filters.startDate, 'MM/dd')} - ${format(filters.endDate, 'MM/dd')}`
        : filters.startDate
        ? `開始日: ${format(filters.startDate, 'MM/dd')}`
        : `終了日: ${format(filters.endDate!, 'MM/dd')}`;
      
      activeFilters.push(
        <Chip
          key="dateRange"
          label={dateLabel}
          onDelete={() => setFilters({ ...filters, startDate: null, endDate: null })}
          size="small"
        />
      );
    }

    if (filters.searchText) {
      activeFilters.push(
        <Chip
          key="search"
          label={`検索: ${filters.searchText}`}
          onDelete={() => setFilters({ ...filters, searchText: '' })}
          size="small"
        />
      );
    }

    return activeFilters;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            監査ログ
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadAuditLogs}
              disabled={loading}
            >
              更新
            </Button>
            <Button
              startIcon={<FilterIcon />}
              onClick={() => setFilterDialogOpen(true)}
            >
              フィルター
            </Button>
            <Button
              startIcon={<ExportIcon />}
              onClick={handleExport}
              variant="outlined"
            >
              エクスポート
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary">
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  総ログ数
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="error">
                  {stats.bySeverity.high || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  高重要度
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="warning">
                  {stats.bySeverity.medium || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  中重要度
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">
                  {Object.keys(stats.byUser).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  アクティブユーザー
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Active Filters */}
        {renderFilterChips().length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              アクティブフィルター:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {renderFilterChips()}
            </Box>
          </Box>
        )}

        {/* Audit Log Table */}
        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>日時</TableCell>
                    <TableCell>イベント</TableCell>
                    <TableCell>ユーザー</TableCell>
                    <TableCell>対象</TableCell>
                    <TableCell>重要度</TableCell>
                    <TableCell>説明</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((log) => (
                    <TableRow key={log.logId} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EventIcon color="action" fontSize="small" />
                          <Box>
                            <Typography variant="body2">
                              {format(new Date(log.timestamp), 'MM/dd HH:mm', { locale: ja })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(log.timestamp), 'yyyy', { locale: ja })}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getEventTypeIcon(log.eventType)}
                          <Box>
                            <Typography variant="body2">
                              {getEventTypeLabel(log.eventType)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {log.action}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24 }}>
                            <PersonIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2">
                              {log.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {log.userRole}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {getTargetTypeLabel(log.targetType)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.targetName || log.targetId}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getSeverityLabel(log.severity)}
                          color={getSeverityColor(log.severity) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {log.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="詳細表示">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(log)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(event, page) => setCurrentPage(page)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          </CardContent>
        </Card>

        {/* Filter Dialog */}
        <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>フィルター設定</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>イベント種別</InputLabel>
                  <Select
                    value={filters.eventType || ''}
                    onChange={(e) => setFilters({ ...filters, eventType: e.target.value || undefined })}
                  >
                    <MenuItem value="">すべて</MenuItem>
                    <MenuItem value="create">作成</MenuItem>
                    <MenuItem value="update">更新</MenuItem>
                    <MenuItem value="delete">削除</MenuItem>
                    <MenuItem value="view">閲覧</MenuItem>
                    <MenuItem value="login">ログイン</MenuItem>
                    <MenuItem value="logout">ログアウト</MenuItem>
                    <MenuItem value="export">エクスポート</MenuItem>
                    <MenuItem value="import">インポート</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>重要度</InputLabel>
                  <Select
                    value={filters.severity || ''}
                    onChange={(e) => setFilters({ ...filters, severity: e.target.value || undefined })}
                  >
                    <MenuItem value="">すべて</MenuItem>
                    <MenuItem value="critical">緊急</MenuItem>
                    <MenuItem value="high">高</MenuItem>
                    <MenuItem value="medium">中</MenuItem>
                    <MenuItem value="low">低</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <MUIDatePicker
                  label="開始日"
                  value={filters.startDate}
                  onChange={(date) => setFilters({ ...filters, startDate: date })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MUIDatePicker
                  label="終了日"
                  value={filters.endDate}
                  onChange={(date) => setFilters({ ...filters, endDate: date })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="検索"
                  value={filters.searchText || ''}
                  onChange={(e) => setFilters({ ...filters, searchText: e.target.value || undefined })}
                  placeholder="ユーザー名、アクション、説明で検索"
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFilters({})}>
              クリア
            </Button>
            <Button onClick={() => setFilterDialogOpen(false)}>
              キャンセル
            </Button>
            <Button variant="contained" onClick={() => setFilterDialogOpen(false)}>
              適用
            </Button>
          </DialogActions>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            監査ログ詳細
          </DialogTitle>
          <DialogContent>
            {selectedLog && (
              <Box sx={{ pt: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      基本情報
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="ログID" secondary={selectedLog.logId} />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="日時" 
                          secondary={format(new Date(selectedLog.timestamp), 'yyyy年MM月dd日 HH:mm:ss', { locale: ja })} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="イベント種別" secondary={getEventTypeLabel(selectedLog.eventType)} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="アクション" secondary={selectedLog.action} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="重要度" secondary={
                          <Chip 
                            label={getSeverityLabel(selectedLog.severity)} 
                            color={getSeverityColor(selectedLog.severity) as any} 
                            size="small" 
                          />
                        } />
                      </ListItem>
                    </List>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      ユーザー情報
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="ユーザーID" secondary={selectedLog.userId} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="ユーザー名" secondary={selectedLog.username} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="ロール" secondary={selectedLog.userRole} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="IPアドレス" secondary={selectedLog.ipAddress} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="セッションID" secondary={selectedLog.sessionId} />
                      </ListItem>
                    </List>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      対象情報
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="対象種別" secondary={getTargetTypeLabel(selectedLog.targetType)} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="対象ID" secondary={selectedLog.targetId} />
                      </ListItem>
                      {selectedLog.targetName && (
                        <ListItem>
                          <ListItemText primary="対象名" secondary={selectedLog.targetName} />
                        </ListItem>
                      )}
                      {selectedLog.clinicalStudyId && (
                        <ListItem>
                          <ListItemText primary="臨床試験ID" secondary={selectedLog.clinicalStudyId} />
                        </ListItem>
                      )}
                      {selectedLog.patientId && (
                        <ListItem>
                          <ListItemText primary="患者ID" secondary={selectedLog.patientId} />
                        </ListItem>
                      )}
                    </List>
                  </Grid>
                  {selectedLog.description && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        説明
                      </Typography>
                      <Typography variant="body2">
                        {selectedLog.description}
                      </Typography>
                    </Grid>
                  )}
                  {selectedLog.changes && selectedLog.changes.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        変更内容
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>フィールド</TableCell>
                              <TableCell>変更前</TableCell>
                              <TableCell>変更後</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedLog.changes.map((change, index) => (
                              <TableRow key={index}>
                                <TableCell>{change.field}</TableCell>
                                <TableCell>{JSON.stringify(change.oldValue)}</TableCell>
                                <TableCell>{JSON.stringify(change.newValue)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>
              閉じる
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AuditLogViewer;