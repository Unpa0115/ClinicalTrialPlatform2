import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Paper,
  Tabs,
  Tab,
  Container,
  useTheme,
  alpha
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Health as HealthIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  Schedule as ScheduleIcon,
  Shield as ShieldIcon,
  Computer as ComputerIcon
} from '@mui/icons-material';
import SystemHealthDashboard from './SystemHealthDashboard';
import SecurityDashboard from './SecurityDashboard';
import SystemConfigurationManager from './SystemConfigurationManager';

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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const quickActions = [
    {
      title: 'System Health',
      description: 'Monitor system status and performance',
      icon: <HealthIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />,
      color: theme.palette.success.main,
      onClick: () => setCurrentTab(1)
    },
    {
      title: 'Security Center',
      description: 'Manage security threats and incidents',
      icon: <SecurityIcon sx={{ fontSize: 40, color: theme.palette.error.main }} />,
      color: theme.palette.error.main,
      onClick: () => setCurrentTab(2)
    },
    {
      title: 'Configuration',
      description: 'Configure system settings and policies',
      icon: <SettingsIcon sx={{ fontSize: 40, color: theme.palette.info.main }} />,
      color: theme.palette.info.main,
      onClick: () => setCurrentTab(3)
    },
    {
      title: 'Database Management',
      description: 'Monitor and optimize database performance',
      icon: <StorageIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />,
      color: theme.palette.warning.main,
      onClick: () => setCurrentTab(1)
    }
  ];

  const systemStats = [
    {
      title: 'System Status',
      value: 'Healthy',
      icon: <ComputerIcon />,
      color: 'success'
    },
    {
      title: 'Active Threats',
      value: '0',
      icon: <ShieldIcon />,
      color: 'success'
    },
    {
      title: 'Database Tables',
      value: '16',
      icon: <StorageIcon />,
      color: 'info'
    },
    {
      title: 'Backup Status',
      value: 'Current',
      icon: <ScheduleIcon />,
      color: 'info'
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box>
        <Typography variant="h3" component="h1" gutterBottom>
          <DashboardIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          System Administration
        </Typography>
        <Typography variant="body1" color="textSecondary" gutterBottom>
          Monitor and manage clinical trial platform system operations
        </Typography>

        {/* Navigation Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 60,
                textTransform: 'none'
              }
            }}
          >
            <Tab 
              label="Overview" 
              icon={<DashboardIcon />}
              iconPosition="start"
            />
            <Tab 
              label="System Health" 
              icon={<HealthIcon />}
              iconPosition="start"
            />
            <Tab 
              label="Security" 
              icon={<SecurityIcon />}
              iconPosition="start"
            />
            <Tab 
              label="Configuration" 
              icon={<SettingsIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Overview Tab */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            {/* System Statistics */}
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom>
                System Overview
              </Typography>
              <Grid container spacing={2} mb={3}>
                {systemStats.map((stat, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card
                      sx={{
                        height: '100%',
                        background: `linear-gradient(135deg, ${alpha(theme.palette[stat.color as keyof typeof theme.palette].main, 0.1)}, ${alpha(theme.palette[stat.color as keyof typeof theme.palette].main, 0.05)})`
                      }}
                    >
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Box sx={{ color: `${stat.color}.main`, mr: 1 }}>
                            {stat.icon}
                          </Box>
                          <Typography variant="body2" color="textSecondary">
                            {stat.title}
                          </Typography>
                        </Box>
                        <Typography variant="h4" component="div">
                          {stat.value}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={3}>
                {quickActions.map((action, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        '&:hover': {
                          boxShadow: theme.shadows[8],
                          transform: 'translateY(-2px)',
                          transition: 'all 0.3s ease-in-out'
                        }
                      }}
                    >
                      <CardActionArea 
                        onClick={action.onClick}
                        sx={{ 
                          height: '100%',
                          p: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          justifyContent: 'flex-start'
                        }}
                      >
                        <Box mb={2}>
                          {action.icon}
                        </Box>
                        <Typography variant="h6" component="div" gutterBottom>
                          {action.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {action.description}
                        </Typography>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent System Activity
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    • System health check completed successfully (2 minutes ago)
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    • Database optimization job completed (1 hour ago)
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    • Security scan completed - no threats detected (2 hours ago)
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    • Backup schedule executed successfully (6 hours ago)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* System Alerts */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Alerts
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 120,
                      flexDirection: 'column'
                    }}
                  >
                    <HealthIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography variant="body1" color="success.main" fontWeight="bold">
                      All Systems Operational
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      No alerts at this time
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* System Health Tab */}
        <TabPanel value={currentTab} index={1}>
          <SystemHealthDashboard />
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={currentTab} index={2}>
          <SecurityDashboard />
        </TabPanel>

        {/* Configuration Tab */}
        <TabPanel value={currentTab} index={3}>
          <SystemConfigurationManager />
        </TabPanel>
      </Box>
    </Container>
  );
};

export default AdminDashboard;