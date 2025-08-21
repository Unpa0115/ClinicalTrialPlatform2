import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Science as StudyIcon,
  Business as OrganizationIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import ClinicalStudyList from '../clinical-studies/ClinicalStudyList';
import OrganizationList from '../organizations/OrganizationList';
import PatientList from '../patients/PatientList';
import StudyOrganizationAssociation from './StudyOrganizationAssociation';
import BulkOperations from './BulkOperations';
import { PatientRecord } from '@clinical-trial/shared';
import { patientService } from '../../services/PatientService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`management-tabpanel-${index}`}
      aria-labelledby={`management-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `management-tab-${index}`,
    'aria-controls': `management-tabpanel-${index}`,
  };
}

export default function ManagementDashboard() {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);
  const [patients, setPatients] = useState<PatientRecord[]>([]);

  useEffect(() => {
    // Load patients for bulk operations
    const loadPatients = async () => {
      if (user?.organizationId) {
        try {
          const response = await patientService.getPatientsByOrganization(user.organizationId);
          setPatients(response.patients);
        } catch (error) {
          console.error('Failed to load patients:', error);
        }
      }
    };

    loadPatients();
  }, [user?.organizationId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const refreshData = () => {
    // Trigger refresh of data in child components
    // This could be implemented with a context or state management solution
    window.location.reload();
  };

  // Define tabs based on user role
  const getTabs = () => {
    const baseTabs = [
      {
        label: 'Clinical Studies',
        icon: <StudyIcon />,
        component: <ClinicalStudyList />,
        roles: ['super_admin', 'study_admin', 'org_admin'],
      },
      {
        label: 'Organizations',
        icon: <OrganizationIcon />,
        component: <OrganizationList />,
        roles: ['super_admin', 'study_admin'],
      },
      {
        label: 'Patients',
        icon: <PeopleIcon />,
        component: <PatientList organizationId={user?.organizationId} />,
        roles: ['super_admin', 'study_admin', 'org_admin'],
      },
      {
        label: 'Study Associations',
        icon: <AssignmentIcon />,
        component: <StudyOrganizationAssociation onAssociationChange={refreshData} />,
        roles: ['super_admin', 'study_admin'],
      },
      {
        label: 'Bulk Operations',
        icon: <SettingsIcon />,
        component: <BulkOperations patients={patients} onOperationComplete={refreshData} />,
        roles: ['super_admin', 'study_admin', 'org_admin'],
      },
    ];

    return baseTabs.filter(tab => tab.roles.includes(user?.role || ''));
  };

  const availableTabs = getTabs();

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography variant="h6" color="text.secondary">
          Please log in to access the management dashboard
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Management Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive management interface for clinical trial platform administration
        </Typography>
      </Box>

      {/* Overview Cards - Only show on dashboard tab */}
      {tabValue === 0 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Active Studies
                    </Typography>
                    <Typography variant="h4">
                      12
                    </Typography>
                  </Box>
                  <StudyIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Organizations
                    </Typography>
                    <Typography variant="h4">
                      8
                    </Typography>
                  </Box>
                  <OrganizationIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Patients
                    </Typography>
                    <Typography variant="h4">
                      {patients.length}
                    </Typography>
                  </Box>
                  <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Active Surveys
                    </Typography>
                    <Typography variant="h4">
                      24
                    </Typography>
                  </Box>
                  <AssignmentIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          aria-label="management dashboard tabs"
        >
          {availableTabs.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.icon}
              label={tab.label}
              iconPosition="start"
              {...a11yProps(index)}
              sx={{
                minHeight: 64,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {availableTabs.map((tab, index) => (
        <TabPanel key={index} value={tabValue} index={index}>
          {tab.component}
        </TabPanel>
      ))}

      {/* Quick Actions FAB-style buttons for mobile */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={refreshData}
            sx={{ borderRadius: '50%', minWidth: 56, height: 56 }}
          >
            <DashboardIcon />
          </Button>
        </Box>
      )}
    </Box>
  );
}