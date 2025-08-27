import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Box, Button, Menu, MenuItem, Tabs, Tab, Select, FormControl, InputLabel, Chip, Divider } from '@mui/material';
import { AccountCircle, Logout, Science, Business, People, Assignment, CalendarToday, Settings, AdminPanelSettings } from '@mui/icons-material';
import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ClinicalStudyProvider, useClinicalStudy } from './contexts/ClinicalStudyContext';
import LoginForm from './components/auth/LoginForm';
import UserProfile from './components/auth/UserProfile';
import Dashboard from './components/Dashboard';
import ClinicalStudyList from './components/clinical-studies/ClinicalStudyList';
import OrganizationList from './components/organizations/OrganizationList';
import PatientList from './components/patients/PatientList';
import SurveyManagementTable from './components/surveys/SurveyManagementTable';
import VisitSchedulingCalendar from './components/visits/VisitSchedulingCalendar';
import VisitProgressDashboard from './components/visits/VisitProgressDashboard';
import DynamicExaminationForm from './components/examinations/DynamicExaminationForm';
import ExaminationConfigManager from './components/admin/ExaminationConfigManager';
import AdminDashboard from './components/admin/AdminDashboard';

// Auth-aware header component
function AuthHeader() {
  const { user, signOut, isAuthenticated } = useAuth();
  const { currentStudy, availableStudies, switchStudy } = useClinicalStudy();
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

  // 動的ルートのためのタブ値の正規化
  const getTabValue = (pathname: string) => {
    // 検査ページの場合はビジットタブを選択状態にする
    if (pathname.startsWith('/examinations/')) {
      return '/visits';
    }
    // 管理ページやダッシュボードの場合は値を無効にする（タブ選択を解除）
    if (pathname.startsWith('/admin/') || pathname === '/profile' || pathname === '/') {
      return false;
    }
    return pathname;
  };

  const navigationTabs = [
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
              value={getTabValue(currentTab)}
              onChange={handleTabChange}
              textColor="inherit"
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                '& .MuiTab-root': {
                  color: 'white',
                  minHeight: 48,
                  minWidth: 'auto',
                  flexShrink: 0,
                },
                '& .Mui-selected': {
                  color: 'white !important',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: 'white',
                },
                '& .MuiTabs-scrollButtons': {
                  color: 'white',
                  '&.Mui-disabled': {
                    opacity: 0.3,
                  },
                },
                flex: 1,
                maxWidth: '60%', // タブ全体の最大幅を制限
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Clinical Study Selector */}
            {currentStudy && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="inherit" sx={{ opacity: 0.8 }}>
                  現在の試験:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Select
                    value={currentStudy.clinicalStudyId}
                    onChange={(e) => switchStudy(e.target.value)}
                    sx={{
                      color: 'white',
                      '& .MuiSelect-icon': { color: 'white' },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                    }}
                  >
                    {availableStudies.map((study) => (
                      <MenuItem key={study.clinicalStudyId} value={study.clinicalStudyId}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {study.studyName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {study.studyType} • {study.visitTemplates.length} templates
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            <Typography variant="body2" sx={{ mr: 1 }}>
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
              メニュー
            </Button>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                sx: { minWidth: 200 }
              }}
            >
              <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                <AccountCircle sx={{ mr: 1 }} />
                プロフィール
              </MenuItem>
              
              <Divider />
              
              <MenuItem onClick={() => { handleClose(); navigate('/admin/examination-config'); }}>
                <Settings sx={{ mr: 1 }} />
                検査設定管理
              </MenuItem>
              
              {user.role === 'super_admin' && (
                <MenuItem onClick={() => { handleClose(); navigate('/admin'); }}>
                  <AdminPanelSettings sx={{ mr: 1 }} />
                  システム管理
                </MenuItem>
              )}
              
              <Divider />
              
              <MenuItem onClick={handleSignOut}>
                <Logout sx={{ mr: 1 }} />
                ログアウト
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
          <Route
            path="/examinations/:visitId"
            element={
              <ProtectedRoute>
                <DynamicExaminationForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/examination-config"
            element={
              <ProtectedRoute>
                <ExaminationConfigManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
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
      <ClinicalStudyProvider>
        <AppContent />
      </ClinicalStudyProvider>
    </AuthProvider>
  );
}

export default App;
