import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ExaminationDataViewer from '../ExaminationDataViewer';
import { ClinicalStudyProvider } from '../../../contexts/ClinicalStudyContext';
import * as examinationService from '../../../services/ExaminationService';

// Mock the examination service
jest.mock('../../../services/ExaminationService');
const mockExaminationService = examinationService as jest.Mocked<typeof examinationService>;

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
const mockUseParams = { visitId: 'visit-test-001' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams,
}));

const theme = createTheme();

const MockWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <ClinicalStudyProvider>
        {children}
      </ClinicalStudyProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('ExaminationDataViewer', () => {
  const mockVisitConfig = {
    visitId: 'visit-test-001',
    surveyId: 'survey-test-001',
    patientId: 'patient-test-001',
    clinicalStudyId: 'study-test-001',
    organizationId: 'org-test-001',
    examinationOrder: ['basic-info', 'vas', 'comparative'],
    requiredExaminations: ['basic-info', 'vas'],
    optionalExaminations: ['comparative'],
    totalSteps: 3,
    visitName: 'テストVisit',
    visitType: 'baseline',
  };

  const mockExaminationData = {
    'basic-info': {
      right: {
        currentUsedCL: 'テストレンズ',
        va: 1.2,
        s: -2.0,
        c: -0.5,
        ax: 90,
        intraocularPressure1: 15,
        intraocularPressure2: 16,
        intraocularPressure3: 15,
      },
      left: {
        currentUsedCL: 'テストレンズ',
        va: 1.0,
        s: -2.5,
        c: -0.25,
        ax: 85,
        intraocularPressure1: 14,
        intraocularPressure2: 15,
        intraocularPressure3: 14,
      },
    },
    'vas': {
      right: {
        comfortLevel: 85,
        drynessLevel: 20,
        visualPerformance_Daytime: 90,
        visualPerformance_EndOfDay: 75,
      },
      left: {
        comfortLevel: 80,
        drynessLevel: 25,
        visualPerformance_Daytime: 88,
        visualPerformance_EndOfDay: 73,
      },
    },
    'comparative': {
      right: {
        comfort: '改善',
        comfortReason: 'レンズの安定性が向上',
        dryness: '変化なし',
        drynessReason: '特に変化を感じない',
        totalSatisfaction: '満足',
        totalSatisfactionReason: '全体的に良好',
      },
      left: {
        comfort: '改善',
        comfortReason: 'フィット感が良い',
        dryness: '軽度改善',
        drynessReason: '終日の乾燥感が軽減',
        totalSatisfaction: '満足',
        totalSatisfactionReason: '問題なし',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockExaminationService.examinationService = {
      getVisitExaminationConfig: jest.fn().mockResolvedValue(mockVisitConfig),
      getAllExaminationData: jest.fn().mockResolvedValue(mockExaminationData),
    } as any;
  });

  it('should render examination data viewer with loading state initially', () => {
    render(
      <MockWrapper>
        <ExaminationDataViewer />
      </MockWrapper>
    );

    expect(screen.getByText('検査データ閲覧')).toBeInTheDocument();
    // Loading skeletons should be visible initially
    expect(screen.getAllByTestId('skeleton')).toHaveLength(3);
  });

  it('should load and display visit configuration and examination data', async () => {
    render(
      <MockWrapper>
        <ExaminationDataViewer />
      </MockWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('テストVisit')).toBeInTheDocument();
      expect(screen.getByText('基礎情報')).toBeInTheDocument();
      expect(screen.getByText('VAS評価')).toBeInTheDocument();
      expect(screen.getByText('相対評価')).toBeInTheDocument();
    });

    expect(mockExaminationService.examinationService.getVisitExaminationConfig).toHaveBeenCalledWith('visit-test-001');
    expect(mockExaminationService.examinationService.getAllExaminationData).toHaveBeenCalledWith('visit-test-001');
  });

  it('should display examination configuration chips', async () => {
    render(
      <MockWrapper>
        <ExaminationDataViewer />
      </MockWrapper>
    );

    await waitFor(() => {
      const basicInfoChip = screen.getByText('基礎情報').closest('.MuiChip-root');
      const vasChip = screen.getByText('VAS評価').closest('.MuiChip-root');
      const comparativeChip = screen.getByText('相対評価').closest('.MuiChip-root');

      expect(basicInfoChip).toHaveClass('MuiChip-colorSuccess'); // Has data
      expect(vasChip).toHaveClass('MuiChip-colorSuccess'); // Has data
      expect(comparativeChip).toHaveClass('MuiChip-colorSuccess'); // Has data
    });
  });

  it('should allow switching between examination tabs', async () => {
    render(
      <MockWrapper>
        <ExaminationDataViewer />
      </MockWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('基礎情報')).toBeInTheDocument();
    });

    // Click on VAS tab
    const vasTab = screen.getByRole('tab', { name: /VAS評価/ });
    fireEvent.click(vasTab);

    await waitFor(() => {
      expect(screen.getByText('快適性レベル')).toBeInTheDocument();
      expect(screen.getByText('85/100')).toBeInTheDocument(); // Right eye comfort level
      expect(screen.getByText('80/100')).toBeInTheDocument(); // Left eye comfort level
    });
  });

  it('should display right and left eye data correctly', async () => {
    render(
      <MockWrapper>
        <ExaminationDataViewer />
      </MockWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('基礎情報')).toBeInTheDocument();
    });

    // Check for basic info data
    expect(screen.getByText('現在使用CL')).toBeInTheDocument();
    expect(screen.getAllByText('テストレンズ')).toHaveLength(2); // Right and left

    // Check for visual acuity values
    expect(screen.getByText('1.2')).toBeInTheDocument(); // Right eye VA
    expect(screen.getByText('1')).toBeInTheDocument(); // Left eye VA

    // Check for right and left eye labels
    expect(screen.getAllByText('右目 (Right)')).toHaveLength(1);
    expect(screen.getAllByText('左目 (Left)')).toHaveLength(1);
  });

  it('should display VAS data with progress bars', async () => {
    render(
      <MockWrapper>
        <ExaminationDataViewer />
      </MockWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('基礎情報')).toBeInTheDocument();
    });

    // Click on VAS tab
    const vasTab = screen.getByRole('tab', { name: /VAS評価/ });
    fireEvent.click(vasTab);

    await waitFor(() => {
      // Check for VAS progress bars
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);

      // Check for VAS values
      expect(screen.getByText('85/100')).toBeInTheDocument(); // Right comfort
      expect(screen.getByText('80/100')).toBeInTheDocument(); // Left comfort
      expect(screen.getByText('20/100')).toBeInTheDocument(); // Right dryness
      expect(screen.getByText('25/100')).toBeInTheDocument(); // Left dryness
    });
  });

  it('should show comparison mode controls', async () => {
    render(
      <MockWrapper>
        <ExaminationDataViewer />
      </MockWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('比較モード')).toBeInTheDocument();
      expect(screen.getByText('トレンド表示')).toBeInTheDocument();
      expect(screen.getByText('印刷')).toBeInTheDocument();
      expect(screen.getByText('エクスポート')).toBeInTheDocument();
    });
  });

  it('should display eye comparison warnings when there are significant differences', async () => {
    const mockDataWithDifferences = {
      ...mockExaminationData,
      'vas': {
        right: { comfortLevel: 90 },
        left: { comfortLevel: 50 }, // 40 point difference - should trigger warning
      },
    };

    mockExaminationService.examinationService.getAllExaminationData.mockResolvedValue(mockDataWithDifferences);

    render(
      <MockWrapper>
        <ExaminationDataViewer />
      </MockWrapper>
    );

    await waitFor(() => {
      const vasTab = screen.getByRole('tab', { name: /VAS評価/ });
      fireEvent.click(vasTab);
    });

    await waitFor(() => {
      // Should show warning for significant difference
      expect(screen.getByText(/左右差の注意点/)).toBeInTheDocument();
    });
  });

  it('should handle missing data gracefully', async () => {
    const mockDataWithMissing = {
      'basic-info': {
        right: mockExaminationData['basic-info'].right,
        // Missing left eye data
      },
    };

    mockExaminationService.examinationService.getAllExaminationData.mockResolvedValue(mockDataWithMissing);

    render(
      <MockWrapper>
        <ExaminationDataViewer />
      </MockWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('データなし')).toBeInTheDocument();
    });
  });

  it('should handle navigation back to visits list', async () => {
    render(
      <MockWrapper>
        <ExaminationDataViewer />
      </MockWrapper>
    );

    await waitFor(() => {
      const backButton = screen.getByLabelText(/back|戻る/i);
      fireEvent.click(backButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/visits');
  });

  it('should handle service errors gracefully', async () => {
    mockExaminationService.examinationService.getVisitExaminationConfig.mockRejectedValue(
      new Error('Service error')
    );

    render(
      <MockWrapper>
        <ExaminationDataViewer />
      </MockWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/訪問データの読み込みに失敗しました/)).toBeInTheDocument();
    });
  });

  it('should show error when visitId is not provided', () => {
    // Mock useParams to return undefined visitId
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useParams: () => ({}),
    }));

    render(
      <MockWrapper>
        <ExaminationDataViewer />
      </MockWrapper>
    );

    expect(screen.getByText('訪問IDが指定されていません')).toBeInTheDocument();
  });

  it('should display examination status indicators correctly', async () => {
    render(
      <MockWrapper>
        <ExaminationDataViewer />
      </MockWrapper>
    );

    await waitFor(() => {
      // Check for completion status icons
      const completedIcons = screen.getAllByTestId('CheckCircleIcon');
      expect(completedIcons.length).toBeGreaterThan(0);
    });
  });

  it('should format field data according to examination type', async () => {
    render(
      <MockWrapper>
        <ExaminationDataViewer />
      </MockWrapper>
    );

    await waitFor(() => {
      // Basic info specific formatting
      expect(screen.getByText(/R1:/)).toBeInTheDocument(); // Corneal radius
      expect(screen.getByText(/VA:/)).toBeInTheDocument(); // Visual acuity
      expect(screen.getByText(/mmHg/)).toBeInTheDocument(); // Intraocular pressure
    });
  });
});

describe('ExaminationDataViewer - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle empty examination data', async () => {
    mockExaminationService.examinationService = {
      getVisitExaminationConfig: jest.fn().mockResolvedValue({
        ...mockVisitConfig,
        examinationOrder: ['basic-info'],
      }),
      getAllExaminationData: jest.fn().mockResolvedValue({}),
    } as any;

    render(
      <MockWrapper>
        <ExaminationDataViewer />
      </MockWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('この検査のデータは記録されていません')).toBeInTheDocument();
    });
  });

  it('should handle network errors during data loading', async () => {
    mockExaminationService.examinationService = {
      getVisitExaminationConfig: jest.fn().mockRejectedValue(new Error('Network error')),
      getAllExaminationData: jest.fn().mockRejectedValue(new Error('Network error')),
    } as any;

    render(
      <MockWrapper>
        <ExaminationDataViewer />
      </MockWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/訪問データの読み込みに失敗しました/)).toBeInTheDocument();
    });
  });

  it('should display comparison data when comparison mode is enabled', async () => {
    render(
      <MockWrapper>
        <ExaminationDataViewer />
      </MockWrapper>
    );

    await waitFor(() => {
      const comparisonToggle = screen.getByRole('switch', { name: /比較モード/ });
      fireEvent.click(comparisonToggle);
    });

    // Mock implementation would need to handle comparison data loading
    // This test verifies the UI responds to comparison mode toggle
    expect(screen.getByRole('switch', { name: /比較モード/ })).toBeChecked();
  });
});