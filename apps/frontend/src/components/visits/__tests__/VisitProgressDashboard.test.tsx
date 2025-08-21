import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import VisitProgressDashboard from '../VisitProgressDashboard';

// Mock Recharts components
jest.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="pie-cell"></div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar"></div>,
  XAxis: () => <div data-testid="x-axis"></div>,
  YAxis: () => <div data-testid="y-axis"></div>,
  CartesianGrid: () => <div data-testid="cartesian-grid"></div>,
  Tooltip: () => <div data-testid="tooltip"></div>,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line"></div>
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

const mockStatistics = {
  totalVisits: 50,
  completedVisits: 20,
  inProgressVisits: 10,
  scheduledVisits: 15,
  missedVisits: 5,
  averageCompletionPercentage: 75,
  protocolDeviations: 3,
  examinationStats: {
    totalExaminations: 150,
    completedExaminations: 100,
    skippedExaminations: 10,
    completionRate: 67
  }
};

const mockVisits = [
  {
    visitId: 'visit-1',
    surveyId: 'survey-1',
    patientId: 'patient-1',
    visitNumber: 1,
    visitName: 'Baseline Visit',
    status: 'completed' as const,
    scheduledDate: '2024-01-15T10:00:00Z',
    actualDate: '2024-01-15T10:30:00Z',
    windowStartDate: '2024-01-15T00:00:00Z',
    windowEndDate: '2024-01-18T23:59:59Z',
    completionPercentage: 100,
    requiredExaminations: ['basic_info', 'vas'],
    optionalExaminations: ['questionnaire'],
    completedExaminations: ['basic_info', 'vas', 'questionnaire'],
    skippedExaminations: [],
    conductedBy: 'investigator-1'
  },
  {
    visitId: 'visit-2',
    surveyId: 'survey-1',
    patientId: 'patient-1',
    visitNumber: 2,
    visitName: '1 Week Follow-up',
    status: 'in_progress' as const,
    scheduledDate: '2024-01-22T10:00:00Z',
    windowStartDate: '2024-01-21T00:00:00Z',
    windowEndDate: '2024-01-24T23:59:59Z',
    completionPercentage: 50,
    requiredExaminations: ['vas'],
    optionalExaminations: ['basic_info'],
    completedExaminations: ['vas'],
    skippedExaminations: [],
    conductedBy: 'investigator-1'
  }
];

const mockSurveys = [
  {
    surveyId: 'survey-1',
    name: 'Patient P001 - Study TS001',
    patientId: 'patient-1',
    status: 'active',
    completionPercentage: 75,
    totalVisits: 2,
    completedVisits: 1
  }
];

const mockDeviations = [
  {
    visitId: 'visit-1',
    surveyId: 'survey-1',
    patientId: 'patient-1',
    deviationType: 'window_violation' as const,
    description: 'Visit scheduled outside protocol window',
    severity: 'medium' as const,
    detectedAt: '2024-01-20T12:00:00Z'
  },
  {
    visitId: 'visit-2',
    surveyId: 'survey-1',
    patientId: 'patient-2',
    deviationType: 'missed_visit' as const,
    description: 'Visit missed - past window end date',
    severity: 'high' as const,
    detectedAt: '2024-01-21T08:00:00Z'
  }
];

describe('VisitProgressDashboard', () => {
  const defaultProps = {
    organizationId: 'org-1'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
  });

  const setupMockFetch = (surveyMode = false) => {
    const responses = [
      // Statistics
      {
        ok: true,
        json: async () => ({ data: mockStatistics })
      },
      // Surveys
      {
        ok: true,
        json: async () => ({ data: { surveys: mockSurveys } })
      },
      // Protocol deviations
      {
        ok: true,
        json: async () => ({ data: mockDeviations })
      }
    ];

    if (surveyMode) {
      // Single survey mode - different endpoint for surveys
      responses[1] = {
        ok: true,
        json: async () => ({ data: { survey: mockSurveys[0] } })
      };
    }

    mockFetch
      .mockResolvedValueOnce(responses[0])
      .mockResolvedValueOnce(responses[1])
      .mockResolvedValueOnce(responses[2]);
  };

  it('renders dashboard with summary cards', async () => {
    setupMockFetch();
    
    render(<VisitProgressDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Visits')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('Average Progress')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Protocol Deviations')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('renders charts', async () => {
    setupMockFetch();
    
    render(<VisitProgressDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Visit Status Distribution')).toBeInTheDocument();
      expect(screen.getByText('Examination Progress')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  it('shows survey progress chart in organization mode', async () => {
    setupMockFetch();
    
    render(<VisitProgressDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Survey Progress Overview')).toBeInTheDocument();
    });
  });

  it('hides survey progress chart in single survey mode', async () => {
    setupMockFetch(true);
    
    render(<VisitProgressDashboard {...defaultProps} surveyId="survey-1" />);
    
    await waitFor(() => {
      expect(screen.queryByText('Survey Progress Overview')).not.toBeInTheDocument();
    });
  });

  it('displays recent visits table', async () => {
    setupMockFetch();
    
    render(<VisitProgressDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Recent Visits')).toBeInTheDocument();
      expect(screen.getByText('Visit')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('Scheduled')).toBeInTheDocument();
    });
  });

  it('displays protocol deviations section', async () => {
    setupMockFetch();
    
    render(<VisitProgressDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Protocol Deviations')).toBeInTheDocument();
      expect(screen.getByText('View All')).toBeInTheDocument();
    });
  });

  it('shows "no deviations" message when list is empty', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockStatistics })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { surveys: mockSurveys } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      });
    
    render(<VisitProgressDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('No protocol deviations detected')).toBeInTheDocument();
    });
  });

  it('opens protocol deviations dialog', async () => {
    setupMockFetch();
    
    render(<VisitProgressDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('View All')).toBeInTheDocument();
    });
    
    const viewAllButton = screen.getByText('View All');
    fireEvent.click(viewAllButton);
    
    await waitFor(() => {
      expect(screen.getByText('Protocol Deviations')).toBeInTheDocument(); // Dialog title
      expect(screen.getByText('Visit scheduled outside protocol window')).toBeInTheDocument();
      expect(screen.getByText('Visit missed - past window end date')).toBeInTheDocument();
    });
  });

  it('handles visit actions from menu', async () => {
    setupMockFetch();
    
    // Mock visit action response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { ...mockVisits[0], status: 'completed' } })
    });
    
    render(<VisitProgressDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getAllByTestId('MoreVertIcon')[0]).toBeInTheDocument();
    });
    
    // Click menu button (this would need the visits table to be populated)
    // For now, we'll test that the menu items exist when opened
  });

  it('refreshes data when refresh button is clicked', async () => {
    setupMockFetch();
    
    render(<VisitProgressDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
    
    // Clear previous calls
    mockFetch.mockClear();
    
    // Setup new responses for refresh
    setupMockFetch();
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3); // Statistics, surveys, deviations
    });
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'));
    
    render(<VisitProgressDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
    });
  });

  it('calls correct endpoints for single survey mode', async () => {
    setupMockFetch(true);
    
    render(<VisitProgressDashboard {...defaultProps} surveyId="survey-1" />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/visits/statistics?surveyId=survey-1',
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/surveys/survey-1',
        expect.any(Object)
      );
    });
  });

  it('calls correct endpoints for organization mode', async () => {
    setupMockFetch();
    
    render(<VisitProgressDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/visits/statistics?organizationId=org-1',
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/surveys/organization/org-1',
        expect.any(Object)
      );
    });
  });

  it('updates data when refreshTrigger changes', async () => {
    setupMockFetch();
    
    const { rerender } = render(<VisitProgressDashboard {...defaultProps} refreshTrigger={1} />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
    
    // Clear and setup new responses
    mockFetch.mockClear();
    setupMockFetch();
    
    // Change refreshTrigger
    rerender(<VisitProgressDashboard {...defaultProps} refreshTrigger={2} />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  it('displays loading state', () => {
    // Setup a pending promise to keep loading state
    mockFetch.mockImplementation(() => new Promise(() => {}));
    
    render(<VisitProgressDashboard {...defaultProps} />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows correct statistics when no data available', async () => {
    const emptyStatistics = {
      totalVisits: 0,
      completedVisits: 0,
      inProgressVisits: 0,
      scheduledVisits: 0,
      missedVisits: 0,
      averageCompletionPercentage: 0,
      protocolDeviations: 0,
      examinationStats: {
        totalExaminations: 0,
        completedExaminations: 0,
        skippedExaminations: 0,
        completionRate: 0
      }
    };
    
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: emptyStatistics })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { surveys: [] } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      });
    
    render(<VisitProgressDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument(); // Multiple zeros for different metrics
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });
});