import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Person,
  Email,
  Business,
  Security,
  Group,
  Edit,
  Logout,
  Key
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/AuthService';

interface UserProfileProps {
  onSignOut?: () => void;
}

export function UserProfile({ onSignOut }: UserProfileProps) {
  const { user, signOut } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          User profile not available. Please sign in again.
        </Alert>
      </Box>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      onSignOut?.();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handlePasswordChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (passwordError) setPasswordError(null);
  };

  const handleChangePassword = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      setPasswordError('Please fill in all fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    try {
      setIsChangingPassword(true);
      await authService.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordSuccess(true);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setChangePasswordOpen(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleColor = (role?: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
      'super_admin': 'error',
      'study_admin': 'primary',
      'org_admin': 'secondary',
      'investigator': 'info',
      'coordinator': 'success',
      'data_entry': 'warning',
      'viewer': 'default' as any
    };
    return colors[role || ''] || 'default' as any;
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || user.username.charAt(0).toUpperCase();
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.main',
              fontSize: '2rem',
              mr: 3
            }}
          >
            {getInitials(user.firstName, user.lastName)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom>
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.username
              }
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Chip
                label={user.role?.replace('_', ' ').toUpperCase() || 'No Role'}
                color={getRoleColor(user.role)}
                size="small"
              />
              {user.groups?.map((group) => (
                <Chip
                  key={group}
                  label={group.replace('_', ' ').toUpperCase()}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Key />}
              onClick={() => setChangePasswordOpen(true)}
            >
              Change Password
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Logout />}
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Profile Details */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Person />
                </ListItemIcon>
                <ListItemText
                  primary="Username"
                  secondary={user.username}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Email />
                </ListItemIcon>
                <ListItemText
                  primary="Email"
                  secondary={user.email}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Business />
                </ListItemIcon>
                <ListItemText
                  primary="Organization ID"
                  secondary={user.organizationId || 'Not assigned'}
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Access & Permissions
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Security />
                </ListItemIcon>
                <ListItemText
                  primary="Role"
                  secondary={user.role?.replace('_', ' ').toUpperCase() || 'No Role Assigned'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Group />
                </ListItemIcon>
                <ListItemText
                  primary="Groups"
                  secondary={
                    user.groups && user.groups.length > 0
                      ? user.groups.map(g => g.replace('_', ' ').toUpperCase()).join(', ')
                      : 'No Groups Assigned'
                  }
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>

        {/* Additional Info */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>User ID:</strong> {user.sub}
          </Typography>
        </Box>
      </Paper>

      {/* Change Password Dialog */}
      <Dialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          {passwordSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Password changed successfully!
            </Alert>
          )}
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Current Password"
            type="password"
            value={passwordData.oldPassword}
            onChange={handlePasswordChange('oldPassword')}
            margin="normal"
          />
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={passwordData.newPassword}
            onChange={handlePasswordChange('newPassword')}
            margin="normal"
            helperText="Must be at least 8 characters long"
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange('confirmPassword')}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setChangePasswordOpen(false)}
            disabled={isChangingPassword}
          >
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={isChangingPassword}
          >
            {isChangingPassword ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserProfile;