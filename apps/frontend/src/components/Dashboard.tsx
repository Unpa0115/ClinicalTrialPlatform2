import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Science as ScienceIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

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

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        UI モックアップ ダッシュボード
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        眼科臨床試験管理プラットフォームの主要ワークフローのUIモックアップです。
        各カードをクリックして、対応する機能のモックアップを確認できます。
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
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
          現在、プロジェクト構造とUIモックアップの作成が完了しています。
          各モックアップは実際の要件に基づいて設計されており、
          次のフェーズでの実装の基盤となります。
        </Typography>
      </Box>
    </Box>
  );
};

export default Dashboard;
