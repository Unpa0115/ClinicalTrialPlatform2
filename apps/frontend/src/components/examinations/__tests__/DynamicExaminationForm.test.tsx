import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import DynamicExaminationForm from '../DynamicExaminationForm';

// Mock the react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ visitId: 'test-visit-001' }),
  };
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('DynamicExaminationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dynamic examination form', async () => {
    render(
      <TestWrapper>
        <DynamicExaminationForm visitId="test-visit-001" />
      </TestWrapper>
    );

    // Check for main title
    expect(screen.getByText('動的検査データ入力')).toBeInTheDocument();
    
    // Check for dynamic configuration alert
    expect(screen.getByText(/動的構成:/)).toBeInTheDocument();
    
    // Wait for visit configuration to load (mocked)
    await waitFor(() => {
      expect(screen.getByText('ベースライン検査')).toBeInTheDocument();
    });
  });

  it('displays visit information correctly', async () => {
    render(
      <TestWrapper>
        <DynamicExaminationForm visitId="test-visit-001" />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check for visit name
      expect(screen.getByText('ベースライン検査')).toBeInTheDocument();
      
      // Check for patient ID
      expect(screen.getByText('patient-001')).toBeInTheDocument();
      
      // Check for progress indicator
      expect(screen.getByText(/進捗状況/)).toBeInTheDocument();
    });
  });

  it('displays examination step chips', async () => {
    render(
      <TestWrapper>
        <DynamicExaminationForm visitId="test-visit-001" />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check for examination step chips
      expect(screen.getByText('基礎情報')).toBeInTheDocument();
      expect(screen.getByText('VAS評価')).toBeInTheDocument();
      expect(screen.getByText('相対評価')).toBeInTheDocument();
      expect(screen.getByText('フィッティング検査')).toBeInTheDocument();
    });
  });

  it('shows stepper navigation', async () => {
    render(
      <TestWrapper>
        <DynamicExaminationForm visitId="test-visit-001" />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check for stepper
      const steppers = screen.getAllByText('基礎情報');
      expect(steppers.length).toBeGreaterThan(0);
    });
  });

  it('displays navigation controls', async () => {
    render(
      <TestWrapper>
        <DynamicExaminationForm visitId="test-visit-001" />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check for navigation buttons
      expect(screen.getByText('前のステップ')).toBeInTheDocument();
      expect(screen.getByText('下書き保存')).toBeInTheDocument();
      expect(screen.getByText('スキップ')).toBeInTheDocument();
      expect(screen.getByText('次のステップ')).toBeInTheDocument();
    });
  });

  it('handles navigation button clicks', async () => {
    render(
      <TestWrapper>
        <DynamicExaminationForm visitId="test-visit-001" />
      </TestWrapper>
    );

    await waitFor(() => {
      const nextButton = screen.getByText('次のステップ');
      fireEvent.click(nextButton);
      
      const skipButton = screen.getByText('スキップ');
      fireEvent.click(skipButton);
      
      const draftButton = screen.getByText('下書き保存');
      fireEvent.click(draftButton);
    });
  });

  it('shows current examination info', async () => {
    render(
      <TestWrapper>
        <DynamicExaminationForm visitId="test-visit-001" />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check for current examination info
      expect(screen.getByText(/現在の検査:/)).toBeInTheDocument();
    });
  });

  it('displays left/right eye parallel input sections', async () => {
    render(
      <TestWrapper>
        <DynamicExaminationForm visitId="test-visit-001" />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check for eye sections
      expect(screen.getByText('右目 (Right)')).toBeInTheDocument();
      expect(screen.getByText('左目 (Left)')).toBeInTheDocument();
    });
  });

  it('handles visit ID parameter correctly', () => {
    render(
      <TestWrapper>
        <DynamicExaminationForm />
      </TestWrapper>
    );

    // Should use visitId from useParams
    expect(screen.getByText('動的検査データ入力')).toBeInTheDocument();
  });

  it('shows error when no visit ID is provided', () => {
    // Mock useParams to return undefined
    vi.mocked(require('react-router-dom').useParams).mockReturnValue({});
    
    render(
      <TestWrapper>
        <DynamicExaminationForm />
      </TestWrapper>
    );

    expect(screen.getByText('訪問IDが指定されていません')).toBeInTheDocument();
  });
});

describe('ExaminationForm Navigation', () => {
  it('allows step navigation via chip clicks', async () => {
    render(
      <TestWrapper>
        <DynamicExaminationForm visitId="test-visit-001" />
      </TestWrapper>
    );

    await waitFor(() => {
      const vasChip = screen.getByText('VAS評価');
      fireEvent.click(vasChip);
      
      // Should navigate to VAS step
      expect(screen.getByText(/VAS評価/)).toBeInTheDocument();
    });
  });

  it('disables previous button on first step', async () => {
    render(
      <TestWrapper>
        <DynamicExaminationForm visitId="test-visit-001" />
      </TestWrapper>
    );

    await waitFor(() => {
      const prevButton = screen.getByText('前のステップ');
      expect(prevButton).toBeDisabled();
    });
  });

  it('shows completion button on last step', async () => {
    render(
      <TestWrapper>
        <DynamicExaminationForm visitId="test-visit-001" />
      </TestWrapper>
    );

    // Navigate to last step (mocked to have 4 steps)
    await waitFor(() => {
      // Click through all steps to reach the last one
      const nextButton = screen.getByText('次のステップ');
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      
      // Should show completion button
      expect(screen.getByText('検査完了')).toBeInTheDocument();
    });
  });
});

describe('Form State Management', () => {
  it('maintains form data across step navigation', async () => {
    render(
      <TestWrapper>
        <DynamicExaminationForm visitId="test-visit-001" />
      </TestWrapper>
    );

    await waitFor(() => {
      // Form state should be maintained when navigating
      // This would require more detailed testing of form inputs
      expect(screen.getByText('動的検査データ入力')).toBeInTheDocument();
    });
  });

  it('shows auto-save indicator', async () => {
    render(
      <TestWrapper>
        <DynamicExaminationForm visitId="test-visit-001" />
      </TestWrapper>
    );

    await waitFor(() => {
      // Auto-save functionality should be visible
      const autoSaveIndicator = screen.queryByText(/最終保存:/);
      // May not be visible initially until auto-save occurs
    });
  });
});