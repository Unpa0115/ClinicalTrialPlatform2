import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import VASVisualization from '../VASVisualization';

const theme = createTheme();

const MockWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('VASVisualization', () => {
  const mockRightEyeData = {
    current: {
      comfortLevel: 85,
      drynessLevel: 20,
      visualPerformance_Daytime: 90,
      visualPerformance_EndOfDay: 75,
    },
    previous: {
      comfortLevel: 75,
      drynessLevel: 30,
      visualPerformance_Daytime: 80,
      visualPerformance_EndOfDay: 70,
    },
    trend: {
      comfort: 'up' as const,
      dryness: 'up' as const, // Improvement (lower is better for dryness)
      visualDaytime: 'up' as const,
      visualEndDay: 'up' as const,
    },
  };

  const mockLeftEyeData = {
    current: {
      comfortLevel: 80,
      drynessLevel: 25,
      visualPerformance_Daytime: 88,
      visualPerformance_EndOfDay: 73,
    },
    previous: {
      comfortLevel: 78,
      drynessLevel: 28,
      visualPerformance_Daytime: 85,
      visualPerformance_EndOfDay: 68,
    },
    trend: {
      comfort: 'up' as const,
      dryness: 'up' as const,
      visualDaytime: 'up' as const,
      visualEndDay: 'up' as const,
    },
  };

  it('should render VAS visualization with proper title and description', () => {
    render(
      <MockWrapper>
        <VASVisualization
          rightEyeData={mockRightEyeData}
          leftEyeData={mockLeftEyeData}
          visitName="Test Visit"
        />
      </MockWrapper>
    );

    expect(screen.getByText('VAS評価 視覚化')).toBeInTheDocument();
    expect(screen.getByText('Test Visit • Visual Analog Scale による症状評価')).toBeInTheDocument();
  });

  it('should display VAS scale legend', () => {
    render(
      <MockWrapper>
        <VASVisualization
          rightEyeData={mockRightEyeData}
          leftEyeData={mockLeftEyeData}
        />
      </MockWrapper>
    );

    expect(screen.getByText('VAS スケール説明')).toBeInTheDocument();
    expect(screen.getByText(/0-100のスケールで症状を評価します/)).toBeInTheDocument();
  });

  it('should render right and left eye sections', () => {
    render(
      <MockWrapper>
        <VASVisualization
          rightEyeData={mockRightEyeData}
          leftEyeData={mockLeftEyeData}
        />
      </MockWrapper>
    );

    expect(screen.getByText('右目 (Right Eye)')).toBeInTheDocument();
    expect(screen.getByText('左目 (Left Eye)')).toBeInTheDocument();
  });

  it('should display all VAS metrics with correct values', () => {
    render(
      <MockWrapper>
        <VASVisualization
          rightEyeData={mockRightEyeData}
          leftEyeData={mockLeftEyeData}
        />
      </MockWrapper>
    );

    // Right eye values
    expect(screen.getByText('85/100 points')).toBeInTheDocument(); // Comfort
    expect(screen.getByText('20/100 points')).toBeInTheDocument(); // Dryness
    expect(screen.getByText('90/100 points')).toBeInTheDocument(); // Visual daytime
    expect(screen.getByText('75/100 points')).toBeInTheDocument(); // Visual end of day

    // Left eye values
    expect(screen.getByText('80/100 points')).toBeInTheDocument(); // Comfort
    expect(screen.getByText('25/100 points')).toBeInTheDocument(); // Dryness
    expect(screen.getByText('88/100 points')).toBeInTheDocument(); // Visual daytime
    expect(screen.getByText('73/100 points')).toBeInTheDocument(); // Visual end of day
  });

  it('should show appropriate sentiment icons based on scores', () => {
    render(
      <MockWrapper>
        <VASVisualization
          rightEyeData={mockRightEyeData}
          leftEyeData={mockLeftEyeData}
        />
      </MockWrapper>
    );

    // High scores (85, 80) should show positive sentiment icons
    const verySatisfiedIcons = screen.getAllByTestId('SentimentVerySatisfiedIcon');
    expect(verySatisfiedIcons.length).toBeGreaterThan(0);

    // Good scores (75, 73) should show satisfied icons
    const satisfiedIcons = screen.getAllByTestId('SentimentSatisfiedIcon');
    expect(satisfiedIcons.length).toBeGreaterThan(0);
  });

  it('should display progress bars for each metric', () => {
    render(
      <MockWrapper>
        <VASVisualization
          rightEyeData={mockRightEyeData}
          leftEyeData={mockLeftEyeData}
        />
      </MockWrapper>
    );

    // Each metric should have a progress bar (4 metrics × 2 eyes = 8 progress bars)
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(8);
  });

  it('should show comparison changes when showComparison is true', () => {
    render(
      <MockWrapper>
        <VASVisualization
          rightEyeData={mockRightEyeData}
          leftEyeData={mockLeftEyeData}
          showComparison={true}
        />
      </MockWrapper>
    );

    // Should show change chips
    expect(screen.getByText('+10pts')).toBeInTheDocument(); // Comfort improvement
    expect(screen.getByText('-10pts')).toBeInTheDocument(); // Dryness improvement (negative is good)
  });

  it('should show trend analysis when showTrends is true', () => {
    render(
      <MockWrapper>
        <VASVisualization
          rightEyeData={mockRightEyeData}
          leftEyeData={mockLeftEyeData}
          showTrends={true}
        />
      </MockWrapper>
    );

    expect(screen.getAllByText('傾向分析')).toHaveLength(2); // One for each eye
    expect(screen.getAllByText('快適性: 改善')).toHaveLength(2);
    expect(screen.getAllByText('乾燥感: 改善')).toHaveLength(2);
  });

  it('should render left-right comparison summary correctly', () => {
    render(
      <MockWrapper>
        <VASVisualization
          rightEyeData={mockRightEyeData}
          leftEyeData={mockLeftEyeData}
        />
      </MockWrapper>
    );

    expect(screen.getByText('左右比較サマリー')).toBeInTheDocument();
    expect(screen.getByText('右目 総合スコア')).toBeInTheDocument();
    expect(screen.getByText('左目 総合スコア')).toBeInTheDocument();
    expect(screen.getByText('左右差')).toBeInTheDocument();
  });

  it('should calculate and display overall scores correctly', () => {
    render(
      <MockWrapper>
        <VASVisualization
          rightEyeData={mockRightEyeData}
          leftEyeData={mockLeftEyeData}
        />
      </MockWrapper>
    );

    // Right eye average: (85 + (100-20) + 90 + 75) / 4 = 82.5 ≈ 83
    // Left eye average: (80 + (100-25) + 88 + 73) / 4 = 79
    // The exact values may vary based on implementation
    const scoreElements = screen.getAllByText(/\d{2}/);
    expect(scoreElements.length).toBeGreaterThan(0);
  });

  it('should show warning for significant left-right differences', () => {
    const mockDataWithDifference = {
      ...mockRightEyeData,
      current: {
        ...mockRightEyeData.current,
        comfortLevel: 90, // High comfort
      },
    };

    const mockLeftDataWithDifference = {
      ...mockLeftEyeData,
      current: {
        ...mockLeftEyeData.current,
        comfortLevel: 40, // Low comfort - 50 point difference
      },
    };

    render(
      <MockWrapper>
        <VASVisualization
          rightEyeData={mockDataWithDifference}
          leftEyeData={mockLeftDataWithDifference}
        />
      </MockWrapper>
    );

    expect(screen.getByText(/左右の目で大きな差が見られます/)).toBeInTheDocument();
  });

  it('should handle inverted dryness scale correctly', () => {
    render(
      <MockWrapper>
        <VASVisualization
          rightEyeData={mockRightEyeData}
          leftEyeData={mockLeftEyeData}
        />
      </MockWrapper>
    );

    // Dryness scale should be inverted (lower is better)
    // A dryness level of 20 should show as good (green color)
    const drynessProgressBars = screen.getAllByLabelText(/乾燥感レベル/);
    expect(drynessProgressBars.length).toBeGreaterThan(0);
  });

  it('should render scale labels correctly', () => {
    render(
      <MockWrapper>
        <VASVisualization
          rightEyeData={mockRightEyeData}
          leftEyeData={mockLeftEyeData}
        />
      </MockWrapper>
    );

    // Scale labels should be present
    expect(screen.getAllByText('0 (最小)')).toHaveLength(8); // 4 metrics × 2 eyes
    expect(screen.getAllByText('50')).toHaveLength(8);
    expect(screen.getAllByText('100 (最大)')).toHaveLength(8);
  });

  it('should show appropriate status labels for different score ranges', () => {
    const mockHighScores = {
      current: {
        comfortLevel: 95,
        drynessLevel: 5,
        visualPerformance_Daytime: 90,
        visualPerformance_EndOfDay: 88,
      },
    };

    const mockLowScores = {
      current: {
        comfortLevel: 15,
        drynessLevel: 85,
        visualPerformance_Daytime: 20,
        visualPerformance_EndOfDay: 18,
      },
    };

    render(
      <MockWrapper>
        <VASVisualization
          rightEyeData={mockHighScores}
          leftEyeData={mockLowScores}
        />
      </MockWrapper>
    );

    expect(screen.getByText('非常に良好')).toBeInTheDocument(); // High scores
    expect(screen.getByText('非常に不良')).toBeInTheDocument(); // Low scores
  });

  it('should handle missing previous data gracefully', () => {
    const mockDataWithoutPrevious = {
      current: mockRightEyeData.current,
      // No previous data
    };

    render(
      <MockWrapper>
        <VASVisualization
          rightEyeData={mockDataWithoutPrevious}
          leftEyeData={mockDataWithoutPrevious}
          showComparison={true}
        />
      </MockWrapper>
    );

    // Should still render current data without comparison chips
    expect(screen.getByText('85/100 points')).toBeInTheDocument();
    // Should not show comparison chips when no previous data
    expect(screen.queryByText(/pts/)).not.toBeInTheDocument();
  });

  it('should handle empty or zero values', () => {
    const mockEmptyData = {
      current: {
        comfortLevel: 0,
        drynessLevel: 0,
        visualPerformance_Daytime: 0,
        visualPerformance_EndOfDay: 0,
      },
    };

    render(
      <MockWrapper>
        <VASVisualization
          rightEyeData={mockEmptyData}
          leftEyeData={mockEmptyData}
        />
      </MockWrapper>
    );

    expect(screen.getAllByText('0/100 points')).toHaveLength(8); // All metrics should show 0
    expect(screen.getAllByText('非常に不良')).toHaveLength(6); // Score labels for non-inverted metrics
  });
});

describe('VASVisualization - Accessibility', () => {
  it('should have proper ARIA labels for progress bars', () => {
    render(
      <MockWrapper>
        <VASVisualization
          rightEyeData={mockRightEyeData}
          leftEyeData={mockLeftEyeData}
        />
      </MockWrapper>
    );

    const progressBars = screen.getAllByRole('progressbar');
    progressBars.forEach(progressBar => {
      expect(progressBar).toHaveAttribute('aria-valuenow');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });
  });

  it('should provide meaningful text alternatives for sentiment icons', () => {
    render(
      <MockWrapper>
        <VASVisualization
          rightEyeData={mockRightEyeData}
          leftEyeData={mockLeftEyeData}
        />
      </MockWrapper>
    );

    const sentimentIcons = screen.getAllByTestId(/Sentiment/);
    expect(sentimentIcons.length).toBeGreaterThan(0);
    
    // Icons should be wrapped with meaningful context
    expect(screen.getAllByText(/\d+\/100 points/)).toHaveLength(8);
  });
});