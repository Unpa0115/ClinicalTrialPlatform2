import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Block as BlockIcon
} from '@mui/icons-material';
import { userManagementService, ActiveSession } from '../../services/UserManagementService';

export const SessionManagement: React.FC = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);
  const [terminateAllDialogOpen, setTerminateAllDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const activeSessions = await userManagementService.getActiveSessions();
      setSessions(activeSessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async () => {
    if (!selectedSession) return;
    
    try {
      setError(null);
      await userManagementService.terminateSession(selectedSession.sessionId);
      setTerminateDialogOpen(false);
      setSelectedSession(null);
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to terminate session');
    }
  };

  const handleTerminateAllUserSessions = async () => {
    if (!selectedUserId) return;
    
    try {
      setError(null);
      await userManagementService.terminateUserSessions(selectedUserId);
      setTerminateAllDialogOpen(false);
      setSelectedUserId(null);
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to terminate user sessions');
    }
  };

  const openTerminateDialog = (session: ActiveSession) => {
    setSelectedSession(session);
    setTerminateDialogOpen(true);
  };

  const openTerminateAllDialog = (userId: string) => {
    setSelectedUserId(userId);
    setTerminateAllDialogOpen(true);
  };

  const formatExpiryTime = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffMs <= 0) {
      return 'Expired';
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'info' | 'warning' | 'error' | 'success'> = {
      'super_admin': 'error',
      'study_admin': 'warning',
      'org_admin': 'info',
      'investigator': 'primary',
      'coordinator': 'secondary',
      'data_entry': 'success',
      'viewer': 'default'
    };
    return colors[role] || 'default';
  };

  const getUniqueUsers = () => {
    const userMap = new Map();
    sessions.forEach(session => {
      if (!userMap.has(session.userId)) {
        userMap.set(session.userId, {
          userId: session.userId,
          username: session.username,
          email: session.email,
          role: session.role,
          organizationId: session.organizationId,
          sessionCount: 1
        });
      } else {
        userMap.get(session.userId).sessionCount++;
      }
    });
    return Array.from(userMap.values());
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Active Sessions</Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadSessions}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Session Statistics */}
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom>
                  Session Overview
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Chip label={`Total Sessions: ${sessions.length}`} color="primary" />
                  <Chip label={`Active Users: ${getUniqueUsers().length}`} color="info" />
                </Box>
              </Box>

              {/* Active Sessions Table */}
              <Typography variant="subtitle1" gutterBottom>
                Active Sessions
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Organization</TableCell>
                      <TableCell>Expires In</TableCell>
                      <TableCell>Session ID</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.sessionId}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {session.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {session.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={session.role.replace('_', ' ').toUpperCase()}
                            color={getRoleColor(session.role)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{session.organizationId}</TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            color={formatExpiryTime(session.expiresAt) === 'Expired' ? 'error' : 'text.primary'}
                          >
                            {formatExpiryTime(session.expiresAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                            {session.sessionId.substring(0, 8)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Terminate Session">
                            <IconButton
                              size="small"
                              onClick={() => openTerminateDialog(session)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Terminate All User Sessions">
                            <IconButton
                              size="small"
                              onClick={() => openTerminateAllDialog(session.userId)}
                              color="warning"
                            >
                              <BlockIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {sessions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary">
                            No active sessions found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* User Summary */}
              {getUniqueUsers().length > 0 && (
                <Box mt={4}>
                  <Typography variant="subtitle1" gutterBottom>
                    User Summary
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>User</TableCell>
                          <TableCell>Role</TableCell>
                          <TableCell>Sessions</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getUniqueUsers().map((user) => (
                          <TableRow key={user.userId}>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {user.username}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {user.email}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={user.role.replace('_', ' ').toUpperCase()}
                                color={getRoleColor(user.role)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip label={user.sessionCount} size="small" />
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                color="warning"
                                onClick={() => openTerminateAllDialog(user.userId)}
                                startIcon={<BlockIcon />}
                              >
                                Terminate All
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Terminate Session Dialog */}
      <Dialog open={terminateDialogOpen} onClose={() => setTerminateDialogOpen(false)}>
        <DialogTitle>Terminate Session</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to terminate the session for user "{selectedSession?.username}"?
            This will immediately log them out.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTerminateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTerminateSession} color="error" variant="contained">
            Terminate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Terminate All User Sessions Dialog */}
      <Dialog open={terminateAllDialogOpen} onClose={() => setTerminateAllDialogOpen(false)}>
        <DialogTitle>Terminate All User Sessions</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to terminate ALL sessions for this user?
            This will immediately log them out from all devices.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTerminateAllDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTerminateAllUserSessions} color="error" variant="contained">
            Terminate All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};