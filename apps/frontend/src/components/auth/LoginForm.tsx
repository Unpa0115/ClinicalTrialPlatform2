import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, Person } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

export function LoginForm({ onSuccess, onForgotPassword }: LoginFormProps) {
  const { signIn, signOut, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      await signIn(formData.username, formData.password);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleClearSession = async () => {
    try {
      await signOut();
      setError(null);
      // Clear form data
      setFormData({ username: '', password: '' });
    } catch (err: any) {
      console.log('Clear session completed');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'grey.50',
        padding: 2
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          maxWidth: 400,
          width: '100%'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Clinical Trial Platform
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Sign In
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            variant="outlined"
            value={formData.username}
            onChange={handleChange('username')}
            disabled={isLoading}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person color="action" />
                </InputAdornment>
              ),
            }}
            autoComplete="username"
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            value={formData.password}
            onChange={handleChange('password')}
            disabled={isLoading}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={togglePasswordVisibility}
                    edge="end"
                    disabled={isLoading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            autoComplete="current-password"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading || !formData.username || !formData.password}
            sx={{ mt: 3, mb: 1 }}
          >
            {isLoading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={handleClearSession}
            disabled={isLoading}
            sx={{ mb: 2 }}
          >
            Clear Session
          </Button>

          {onForgotPassword && (
            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={onForgotPassword}
                disabled={isLoading}
                sx={{ textDecoration: 'none' }}
              >
                Forgot your password?
              </Link>
            </Box>
          )}
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            © 2024 Clinical Trial Platform. All rights reserved.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default LoginForm;