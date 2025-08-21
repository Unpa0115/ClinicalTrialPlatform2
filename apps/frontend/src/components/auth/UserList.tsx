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
  TablePagination,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  VpnKey as PasswordIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import { userManagementService, User, CreateUserRequest, UpdateUserRequest } from '../../services/UserManagementService';

interface UserListProps {
  organizationId?: string;
  currentUserRole: User['role'];
}

export const UserList: React.FC<UserListProps> = ({ organizationId, currentUserRole }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    title: '',
    primaryOrganizationId: organizationId || '',
    role: 'viewer'
  });
  const [editForm, setEditForm] = useState<UpdateUserRequest>({});
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    permanent: true
  });

  const availableRoles = userManagementService.getAvailableRoles(currentUserRole);

  useEffect(() => {
    loadUsers();
  }, [page, rowsPerPage, organizationId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userManagementService.getUsers(organizationId, page + 1, rowsPerPage);
      setUsers(response.users);
      setTotalUsers(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      setError(null);
      await userManagementService.createUser(createForm);
      setCreateDialogOpen(false);
      setCreateForm({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        title: '',
        primaryOrganizationId: organizationId || '',
        role: 'viewer'
      });
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    try {
      setError(null);
      await userManagementService.updateUser(selectedUser.userId, editForm);
      setEditDialogOpen(false);
      setEditForm({});
      setSelectedUser(null);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setError(null);
      await userManagementService.deleteUser(selectedUser.userId);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleSetPassword = async () => {
    if (!selectedUser) return;
    
    try {
      setError(null);
      await userManagementService.setUserPassword(selectedUser.userId, passwordForm);
      setPasswordDialogOpen(false);
      setPasswordForm({ password: '', permanent: true });
      setSelectedUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set password');
    }
  };

  const handleSyncUser = async (user: User) => {
    try {
      setError(null);
      await userManagementService.syncUserFromCognito(user.username);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync user');
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      title: user.title,
      department: user.department,
      specialization: user.specialization,
      licenseNumber: user.licenseNumber,
      role: user.role,
      status: user.status
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const openPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setPasswordDialogOpen(true);
  };

  const getStatusColor = (status: User['status']) => {
    const colors: Record<User['status'], 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      'active': 'success',
      'pending_activation': 'warning',
      'inactive': 'default',
      'suspended': 'error',
      'locked': 'error'
    };
    return colors[status] || 'default';
  };

  const getRoleColor = (role: User['role']) => {
    const colors: Record<User['role'], 'primary' | 'secondary' | 'info' | 'warning' | 'error' | 'success'> = {
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

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">User Management</Typography>
            <Box>
              <Button
                startIcon={<RefreshIcon />}
                onClick={loadUsers}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                disabled={!availableRoles.length}
              >
                Add User
              </Button>
            </Box>
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
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Last Login</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {user.displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.username}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={userManagementService.getRoleDisplayName(user.role)}
                            color={getRoleColor(user.role)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={userManagementService.getStatusDisplayName(user.status)}
                            color={getStatusColor(user.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit User">
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(user)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Set Password">
                            <IconButton
                              size="small"
                              onClick={() => openPasswordDialog(user)}
                            >
                              <PasswordIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Sync from Cognito">
                            <IconButton
                              size="small"
                              onClick={() => handleSyncUser(user)}
                            >
                              <SyncIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete User">
                            <IconButton
                              size="small"
                              onClick={() => openDeleteDialog(user)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={totalUsers}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Username"
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              required
              fullWidth
            />
            <Box display="flex" gap={2}>
              <TextField
                label="First Name"
                value={createForm.firstName}
                onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Last Name"
                value={createForm.lastName}
                onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                required
                fullWidth
              />
            </Box>
            <TextField
              label="Title"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Department"
              value={createForm.department || ''}
              onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
              fullWidth
            />
            <TextField
              label="Role"
              select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as User['role'] })}
              required
              fullWidth
            >
              {availableRoles.map((role) => (
                <MenuItem key={role} value={role}>
                  {userManagementService.getRoleDisplayName(role)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Temporary Password"
              type="password"
              value={createForm.temporaryPassword || ''}
              onChange={(e) => setCreateForm({ ...createForm, temporaryPassword: e.target.value })}
              fullWidth
              helperText="Leave empty to generate automatically"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Email"
              type="email"
              value={editForm.email || ''}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              fullWidth
            />
            <Box display="flex" gap={2}>
              <TextField
                label="First Name"
                value={editForm.firstName || ''}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                fullWidth
              />
              <TextField
                label="Last Name"
                value={editForm.lastName || ''}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                fullWidth
              />
            </Box>
            <TextField
              label="Title"
              value={editForm.title || ''}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              fullWidth
            />
            <TextField
              label="Department"
              value={editForm.department || ''}
              onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              fullWidth
            />
            <TextField
              label="Role"
              select
              value={editForm.role || ''}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value as User['role'] })}
              fullWidth
            >
              {availableRoles.map((role) => (
                <MenuItem key={role} value={role}>
                  {userManagementService.getRoleDisplayName(role)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Status"
              select
              value={editForm.status || ''}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value as User['status'] })}
              fullWidth
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditUser} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{selectedUser?.displayName}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Set Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
        <DialogTitle>Set Password</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="New Password"
              type="password"
              value={passwordForm.password}
              onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Password Type"
              select
              value={passwordForm.permanent}
              onChange={(e) => setPasswordForm({ ...passwordForm, permanent: e.target.value === 'true' })}
              fullWidth
            >
              <MenuItem value="true">Permanent</MenuItem>
              <MenuItem value="false">Temporary (user must change on next login)</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSetPassword} variant="contained">Set Password</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};