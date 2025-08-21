import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Box, Button, Menu, MenuItem, Tabs, Tab } from '@mui/material';
import { AccountCircle, Logout, Science, Business, People, Assignment, CalendarToday } from '@mui/icons-material';
import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import UserProfile from './components/auth/UserProfile';
import Dashboard from './components/Dashboard';
import ClinicalStudyList from './components/clinical-studies/ClinicalStudyList';
import OrganizationList from './components/organizations/OrganizationList';
import PatientList from './components/patients/PatientList';
import SurveyManagementTable from './components/surveys/SurveyManagementTable';
import VisitSchedulingCalendar from './components/visits/VisitSchedulingCalendar';
import VisitProgressDashboard from './components/visits/VisitProgressDashboard';

// Auth-aware header component
function AuthHeader() {
  const { user, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentTab, setCurrentTab] = useState(window.location.pathname);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    handleClose();
    await signOut();
  };

  const handleTitleClick = () => {
    navigate('/');
    setCurrentTab('/');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
    navigate(newValue);
  };

  const navigationTabs = [
    { label: 'ダッシュボード', value: '/', icon: <Science /> },
    { label: '臨床試験', value: '/clinical-studies', icon: <Science /> },
    { label: '組織', value: '/organizations', icon: <Business /> },
    { label: '患者', value: '/patients', icon: <People /> },
    { label: 'サーベイ', value: '/surveys', icon: <Assignment /> },
    { label: 'ビジット', value: '/visits', icon: <CalendarToday /> },
  ];

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            cursor: 'pointer',
            mr: 3,
            '&:hover': {
              opacity: 0.8
            }
          }}
          onClick={handleTitleClick}
        >
          眼科臨床試験管理プラットフォーム
        </Typography>
        
        {isAuthenticated && (
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              textColor="inherit"
              sx={{
                '& .MuiTab-root': {
                  color: 'white',
                  minHeight: 48,
                },
                '& .Mui-selected': {
                  color: 'white !important',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: 'white',
                },
              }}
            >
              {navigationTabs.map((tab) => (
                <Tab
                  key={tab.value}
                  label={tab.label}
                  value={tab.value}
                  icon={tab.icon}
                  iconPosition="start"
                  sx={{ minHeight: 48 }}
                />
              ))}
            </Tabs>
          </Box>
        )}
        
        {isAuthenticated && user && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.username
              }
            </Typography>
            <Button
              color="inherit"
              onClick={handleMenu}
              startIcon={<AccountCircle />}
            >
              Profile
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose}>
                <AccountCircle sx={{ mr: 1 }} />
                View Profile
              </MenuItem>
              <MenuItem onClick={handleSignOut}>
                <Logout sx={{ mr: 1 }} />
                Sign Out
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        Loading...
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Main app content
function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AuthHeader />

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <LoginForm />
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/clinical-studies"
            element={
              <ProtectedRoute>
                <ClinicalStudyList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizations"
            element={
              <ProtectedRoute>
                <OrganizationList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <PatientList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/surveys"
            element={
              <ProtectedRoute>
                <SurveyManagementTable organizationId="org-admin-001" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visits"
            element={
              <ProtectedRoute>
                <VisitSchedulingCalendar organizationId="org-admin-001" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visits/dashboard"
            element={
              <ProtectedRoute>
                <VisitProgressDashboard organizationId="org-admin-001" />
              </ProtectedRoute>
            }
          />
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
