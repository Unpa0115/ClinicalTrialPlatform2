import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Science as ScienceIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  Business as BusinessIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const managementFeatures = [
    {
      title: '臨床試験管理',
      description: '臨床試験プロトコルの作成、管理、ステータス更新',
      icon: <ScienceIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      path: '/clinical-studies',
      status: 'ready',
      roles: ['super_admin', 'study_admin', 'org_admin'],
    },
    {
      title: '組織管理',
      description: '研究組織の登録、管理、承認ワークフロー',
      icon: <BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      path: '/organizations',
      status: 'ready',
      roles: ['super_admin', 'study_admin', 'org_admin'],
    },
    {
      title: '患者マスター管理',
      description: '患者の登録、検索、試験への割り当て',
      icon: <PersonAddIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      path: '/patients',
      status: 'ready',
      roles: ['super_admin', 'study_admin', 'org_admin', 'investigator', 'coordinator'],
    },
  ];

  const mockups = [
    {
      title: '臨床試験作成',
      description: '新しい臨床試験プロトコルの作成と管理',
      icon: <ScienceIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      path: '/mockups/clinical-study',
      status: 'ready',
    },
    {
      title: '患者サーベイ管理',
      description: '患者マスター管理と既存患者のサーベイ割り当て',
      icon: <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      path: '/mockups/patient-survey',
      status: 'ready',
    },
    {
      title: '動的検査データ入力',
      description: 'Visit構成に応じた柔軟な検査データ入力フォーム',
      icon: <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      path: '/mockups/examination-entry',
      status: 'ready',
    },
    {
      title: 'データレビュー',
      description: '検査データの表示、比較、管理機能',
      icon: <AnalyticsIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      path: '/mockups/data-review',
      status: 'ready',
    },
  ];

  const canAccessFeature = (feature: { roles: string[] }) => {
    return user?.role && feature.roles.includes(user.role);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        眼科臨床試験管理プラットフォーム
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        ようこそ、{user?.firstName} {user?.lastName}さん。
        あなたの役割: {user?.role}
      </Typography>

      {/* Management Features */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
        管理機能
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {managementFeatures
          .filter(feature => canAccessFeature(feature))
          .map((feature, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease-in-out',
                },
              }}
              onClick={() => navigate(feature.path)}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>{feature.icon}</Box>

                <Typography variant="h6" component="h2" gutterBottom>
                  {feature.title}
                </Typography>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {feature.description}
                </Typography>

                <Box sx={{ mt: 2, mb: 2 }}>
                  <Chip
                    label={feature.status === 'ready' ? '利用可能' : '開発中'}
                    color={feature.status === 'ready' ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>

                <Button
                  variant="contained"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(feature.path);
                  }}
                >
                  開く
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* UI Mockups */}
      <Typography variant="h5" component="h2" gutterBottom>
        UI モックアップ
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        主要ワークフローのUIモックアップです。各カードをクリックして確認できます。
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {mockups.map((mockup, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease-in-out',
                },
              }}
              onClick={() => navigate(mockup.path)}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>{mockup.icon}</Box>

                <Typography variant="h6" component="h2" gutterBottom>
                  {mockup.title}
                </Typography>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {mockup.description}
                </Typography>

                <Box sx={{ mt: 2, mb: 2 }}>
                  <Chip
                    label={mockup.status === 'ready' ? '準備完了' : '開発中'}
                    color={mockup.status === 'ready' ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>

                <Button
                  variant="contained"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(mockup.path);
                  }}
                >
                  モックアップを見る
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          開発ステータス
        </Typography>
        <Typography variant="body2" color="text.secondary">
          臨床試験管理、組織管理、患者マスター管理の基本機能が実装されました。
          各機能は役割ベースのアクセス制御に対応しており、
          実際のワークフローに基づいて設計されています。
        </Typography>
      </Box>
    </Box>
  );
};

export default Dashboard;
