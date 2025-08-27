import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  IconButton,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Fab,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  PartiallyCompleted as PartialIcon,
  RadioButtonUnchecked as NotStartedIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  MoreVert as MoreIcon,
  Timeline as TimelineIcon,
  Compare as CompareIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { EXAMINATION_CONFIG } from '../examinations/DynamicExaminationForm';

interface VisitSummary {
  visitId: string;
  visitNumber: number;
  visitName: string;
  visitType: string;
  scheduledDate: string;
  actualDate?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled' | 'rescheduled';
  completionPercentage: number;
  examinationConfig: string[];
  completedExaminations: string[];
  skippedExaminations: string[];
  protocolDeviations?: string[];
  windowStartDate: string;
  windowEndDate: string;
  conductedBy?: string;
}

interface VisitNavigationControlsProps {
  currentVisitId: string;
  surveyId: string;
  visits: VisitSummary[];
  onVisitChange: (visitId: string) => void;
  allowEdit?: boolean;
}

const VisitNavigationControls: React.FC<VisitNavigationControlsProps> = ({
  currentVisitId,
  surveyId,
  visits,
  onVisitChange,
  allowEdit = false,
}) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVisitForMenu, setSelectedVisitForMenu] = useState<string | null>(null);

  const currentVisitIndex = visits.findIndex(visit => visit.visitId === currentVisitId);
  const currentVisit = visits[currentVisitIndex];

  const getStatusIcon = (status: string, completionPercentage: number) => {
    switch (status) {
      case 'completed':
        return <CompletedIcon color="success" />;
      case 'in_progress':
        return completionPercentage > 0 ? <PartialIcon color="warning" /> : <NotStartedIcon color="action" />;
      case 'scheduled':
        return <ScheduleIcon color="info" />;
      case 'missed':
      case 'cancelled':
        return <WarningIcon color="error" />;
      case 'rescheduled':
        return <ScheduleIcon color="warning" />;
      default:
        return <NotStartedIcon color="action" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'scheduled':
        return 'info';
      case 'missed':
      case 'cancelled':
        return 'error';
      case 'rescheduled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      scheduled: '予定',
      in_progress: '進行中',
      completed: '完了',
      missed: '未実施',
      cancelled: 'キャンセル',
      rescheduled: '再予定',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const isWithinWindow = (visit: VisitSummary) => {
    const now = new Date();
    const windowStart = new Date(visit.windowStartDate);
    const windowEnd = new Date(visit.windowEndDate);
    return now >= windowStart && now <= windowEnd;
  };

  const hasProtocolDeviation = (visit: VisitSummary) => {
    return visit.protocolDeviations && visit.protocolDeviations.length > 0;
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, visitId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedVisitForMenu(visitId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVisitForMenu(null);
  };

  const handleViewVisit = (visitId: string) => {
    onVisitChange(visitId);
    handleMenuClose();
  };

  const handleEditVisit = (visitId: string) => {
    navigate(`/examinations/${visitId}`);
    handleMenuClose();
  };

  const renderVisitListItem = (visit: VisitSummary, isActive: boolean) => (
    <Card 
      key={visit.visitId} 
      variant={isActive ? 'outlined' : 'elevation'}
      sx={{ 
        mb: 1, 
        bgcolor: isActive ? 'primary.50' : 'background.paper',
        border: isActive ? 2 : 1,
        borderColor: isActive ? 'primary.main' : 'divider',
      }}
    >
      <CardContent sx={{ pb: '16px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Badge 
                badgeContent={visit.visitNumber} 
                color="primary" 
                sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}
              >
                {getStatusIcon(visit.status, visit.completionPercentage)}
              </Badge>
              {visit.visitName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {visit.visitType} • {new Date(visit.scheduledDate).toLocaleDateString('ja-JP')}
              {visit.actualDate && visit.actualDate !== visit.scheduledDate && (
                <> (実施日: {new Date(visit.actualDate).toLocaleDateString('ja-JP')})</>
              )}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={getStatusLabel(visit.status)}
              color={getStatusColor(visit.status) as any}
              size="small"
            />
            {hasProtocolDeviation(visit) && (
              <Tooltip title="プロトコル逸脱あり">
                <WarningIcon color="warning" fontSize="small" />
              </Tooltip>
            )}
            <IconButton 
              size="small" 
              onClick={(e) => handleMenuOpen(e, visit.visitId)}
            >
              <MoreIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Window Period Indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <CalendarIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            実施期間: {new Date(visit.windowStartDate).toLocaleDateString('ja-JP')} - {new Date(visit.windowEndDate).toLocaleDateString('ja-JP')}
          </Typography>
          {isWithinWindow(visit) && (
            <Chip label="期間内" color="success" size="small" variant="outlined" />
          )}
        </Box>

        {/* Progress Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
            進捗: {visit.completionPercentage}%
          </Typography>
          <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 6 }}>
            <Box
              sx={{
                width: `${visit.completionPercentage}%`,
                bgcolor: visit.status === 'completed' ? 'success.main' : 'primary.main',
                height: '100%',
                borderRadius: 1,
                transition: 'width 0.3s ease',
              }}
            />
          </Box>
        </Box>

        {/* Examination Status */}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {visit.examinationConfig.map((examId) => {
            const config = EXAMINATION_CONFIG[examId as keyof typeof EXAMINATION_CONFIG];
            const isCompleted = visit.completedExaminations.includes(examId);
            const isSkipped = visit.skippedExaminations.includes(examId);
            
            return (
              <Tooltip 
                key={examId} 
                title={`${config?.name || examId}${isCompleted ? ' (完了)' : isSkipped ? ' (スキップ)' : ' (未実施)'}`}
              >
                <Chip
                  label={config?.icon || examId.charAt(0).toUpperCase()}
                  size="small"
                  color={isCompleted ? 'success' : isSkipped ? 'warning' : 'default'}
                  variant={isCompleted || isSkipped ? 'filled' : 'outlined'}
                  sx={{ fontSize: '0.7rem', height: 20, minWidth: 20 }}
                />
              </Tooltip>
            );
          })}
        </Box>

        {/* Action Buttons */}
        {isActive && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              size="small"
              startIcon={<ViewIcon />}
              onClick={() => handleViewVisit(visit.visitId)}
            >
              詳細表示
            </Button>
            {allowEdit && visit.status !== 'completed' && (
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => handleEditVisit(visit.visitId)}
                color="primary"
              >
                データ入力
              </Button>
            )}
            <Button
              size="small"
              startIcon={<CompareIcon />}
              variant="outlined"
            >
              比較
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderTimelineView = () => (
    <Timeline>
      {visits.map((visit, index) => (
        <TimelineItem key={visit.visitId}>
          <TimelineSeparator>
            <TimelineDot 
              color={
                visit.visitId === currentVisitId ? 'primary' :
                visit.status === 'completed' ? 'success' :
                visit.status === 'in_progress' ? 'warning' : 'grey'
              }
              variant={visit.visitId === currentVisitId ? 'filled' : 'outlined'}
            >
              {getStatusIcon(visit.status, visit.completionPercentage)}
            </TimelineDot>
            {index < visits.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent>
            <Card 
              variant={visit.visitId === currentVisitId ? 'outlined' : 'elevation'}
              sx={{ 
                mb: 2,
                border: visit.visitId === currentVisitId ? 2 : 1,
                borderColor: visit.visitId === currentVisitId ? 'primary.main' : 'divider',
              }}
            >
              <CardContent>
                <Typography variant="h6">
                  {visit.visitName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {new Date(visit.scheduledDate).toLocaleDateString('ja-JP')} • 進捗: {visit.completionPercentage}%
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {visit.examinationConfig.slice(0, 5).map((examId) => {
                    const config = EXAMINATION_CONFIG[examId as keyof typeof EXAMINATION_CONFIG];
                    const isCompleted = visit.completedExaminations.includes(examId);
                    
                    return (
                      <Chip
                        key={examId}
                        label={config?.icon || examId}
                        size="small"
                        color={isCompleted ? 'success' : 'default'}
                        variant="outlined"
                      />
                    );
                  })}
                  {visit.examinationConfig.length > 5 && (
                    <Chip label={`+${visit.examinationConfig.length - 5}`} size="small" variant="outlined" />
                  )}
                </Box>
                {visit.visitId === currentVisitId && (
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewVisit(visit.visitId)}
                    sx={{ mt: 1 }}
                  >
                    詳細表示
                  </Button>
                )}
              </CardContent>
            </Card>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );

  return (
    <Box>
      {/* Navigation Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Visit ナビゲーション
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={viewMode === 'list' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('list')}
            >
              リスト
            </Button>
            <Button
              variant={viewMode === 'timeline' ? 'contained' : 'outlined'}
              size="small"
              startIcon={<TimelineIcon />}
              onClick={() => setViewMode('timeline')}
            >
              タイムライン
            </Button>
          </Box>
        </Box>

        {/* Quick Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            startIcon={<BackIcon />}
            disabled={currentVisitIndex <= 0}
            onClick={() => currentVisitIndex > 0 && onVisitChange(visits[currentVisitIndex - 1].visitId)}
            size="small"
          >
            前のVisit
          </Button>
          
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {currentVisit ? `${currentVisitIndex + 1} / ${visits.length}` : ''}
            </Typography>
          </Box>
          
          <Button
            endIcon={<NextIcon />}
            disabled={currentVisitIndex >= visits.length - 1}
            onClick={() => currentVisitIndex < visits.length - 1 && onVisitChange(visits[currentVisitIndex + 1].visitId)}
            size="small"
          >
            次のVisit
          </Button>
        </Box>
      </Paper>

      {/* Visit List or Timeline */}
      {viewMode === 'list' ? (
        <Box>
          {visits.map((visit) => 
            renderVisitListItem(visit, visit.visitId === currentVisitId)
          )}
        </Box>
      ) : (
        renderTimelineView()
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedVisitForMenu && handleViewVisit(selectedVisitForMenu)}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          詳細表示
        </MenuItem>
        {allowEdit && (
          <MenuItem onClick={() => selectedVisitForMenu && handleEditVisit(selectedVisitForMenu)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            データ入力
          </MenuItem>
        )}
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <CompareIcon fontSize="small" />
          </ListItemIcon>
          比較対象に設定
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default VisitNavigationControls;