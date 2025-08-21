import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { jest } from '@jest/globals';
import SurveyCreateForm from '../SurveyCreateForm';

// Mock MUI Date Picker components
jest.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: ({ onChange, value, label, slotProps }: any) => (
    <input
      data-testid={`datepicker-${label?.toLowerCase().replace(/\s+/g, '-')}`}
      type="datetime-local"
      value={value ? value.toISOString().slice(0, 16) : ''}
      onChange={(e) => onChange?.(e.target.value ? new Date(e.target.value) : null)}
      {...slotProps?.textField}
    />
  )
}));

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }: any) => <div>{children}</div>
}));

jest.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
  AdapterDateFns: jest.fn()
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

const mockClinicalStudies = [
  {
    clinicalStudyId: 'study-1',
    studyName: 'Test Study 1',
    studyCode: 'TS001',
    description: 'Test study description',
    status: 'active',
    visitTemplate: [
      {
        visitNumber: 1,
        visitType: 'baseline',
        visitName: 'Baseline Visit',
        scheduledDaysFromBaseline: 0,
        windowDaysBefore: 0,
        windowDaysAfter: 3,
        requiredExaminations: ['basic_info', 'vas'],
        optionalExaminations: ['questionnaire'],
        examinationOrder: ['basic_info', 'vas', 'questionnaire'],
        isRequired: true
      }
    ],
    totalTargetPatients: 100,
    enrolledPatients: 25
  }
];

const mockPatients = [
  {
    patientId: 'patient-1',
    patientCode: 'P001',
    patientInitials: 'JD',
    registrationDate: '2024-01-01T00:00:00Z',
    status: 'active',
    participatingStudies: [],
    medicalHistory: ['Hypertension']
  },
  {
    patientId: 'patient-2',
    patientCode: 'P002',
    registrationDate: '2024-01-02T00:00:00Z',
    status: 'active',
    participatingStudies: ['study-1'], // Already participating
    medicalHistory: []
  }
];

describe('SurveyCreateForm', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onSurveyCreated: jest.fn(),
    organizationId: 'org-1'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'mock-token';
      if (key === 'user') return JSON.stringify({ userId: 'user-1' });
      return null;
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const setupMockFetch = () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockClinicalStudies })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockPatients })
      });
  };

  it('renders the form dialog when open', async () => {
    setupMockFetch();
    
    render(<SurveyCreateForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Create New Survey')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Clinical Study')).toBeInTheDocument();
    expect(screen.getByText('Patient')).toBeInTheDocument();
    expect(screen.getByText('Survey Configuration')).toBeInTheDocument();
  });

  it('loads clinical studies and patients on mount', async () => {
    setupMockFetch();
    
    render(<SurveyCreateForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
    
    expect(mockFetch).toHaveBeenCalledWith('/api/clinical-studies', {
      headers: {
        'Authorization': 'Bearer mock-token'
      }
    });
    
    expect(mockFetch).toHaveBeenCalledWith('/api/patients/organization/org-1', {
      headers: {
        'Authorization': 'Bearer mock-token'
      }
    });
  });

  it('populates clinical study and patient dropdowns', async () => {
    setupMockFetch();
    
    render(<SurveyCreateForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Clinical Study')).toBeInTheDocument();
      expect(screen.getByLabelText('Patient')).toBeInTheDocument();
    });
  });

  it('shows study details when study is selected', async () => {
    setupMockFetch();
    
    render(<SurveyCreateForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Clinical Study')).toBeInTheDocument();
    });
    
    const studySelect = screen.getByLabelText('Clinical Study');
    fireEvent.mouseDown(studySelect);
    
    await waitFor(() => {
      const option = screen.getByText('TS001 - Test Study 1');
      fireEvent.click(option);
    });
    
    await waitFor(() => {
      expect(screen.getByText('View Study Details')).toBeInTheDocument();
      expect(screen.getByText('1 visits')).toBeInTheDocument();
    });
  });

  it('validates form before submission', async () => {
    setupMockFetch();
    
    render(<SurveyCreateForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Create Survey')).toBeInTheDocument();
    });
    
    const submitButton = screen.getByText('Create Survey');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please select a clinical study')).toBeInTheDocument();
    });
  });

  it('prevents survey creation for patient already in study', async () => {
    setupMockFetch();
    
    render(<SurveyCreateForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Clinical Study')).toBeInTheDocument();
      expect(screen.getByLabelText('Patient')).toBeInTheDocument();
    });
    
    // Select study
    const studySelect = screen.getByLabelText('Clinical Study');
    fireEvent.mouseDown(studySelect);
    await waitFor(() => {
      const option = screen.getByText('TS001 - Test Study 1');
      fireEvent.click(option);
    });
    
    // Select patient who is already in the study
    const patientSelect = screen.getByLabelText('Patient');
    fireEvent.mouseDown(patientSelect);
    await waitFor(() => {
      const option = screen.getByText('P002');
      fireEvent.click(option);
    });
    
    const submitButton = screen.getByText('Create Survey');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Patient already has an active survey in this study')).toBeInTheDocument();
    });
  });

  it('successfully creates a survey', async () => {
    setupMockFetch();
    
    // Mock successful survey creation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          survey: { surveyId: 'survey-1', name: 'Test Survey' },
          visits: [{ visitId: 'visit-1' }],
          summary: { generatedVisits: 1 }
        }
      })
    });
    
    render(<SurveyCreateForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Clinical Study')).toBeInTheDocument();
    });
    
    // Select study
    const studySelect = screen.getByLabelText('Clinical Study');
    fireEvent.mouseDown(studySelect);
    await waitFor(() => {
      const option = screen.getByText('TS001 - Test Study 1');
      fireEvent.click(option);
    });
    
    // Select patient (first one - not participating in study)
    const patientSelect = screen.getByLabelText('Patient');
    fireEvent.mouseDown(patientSelect);
    await waitFor(() => {
      const option = screen.getByText('P001 (JD)');
      fireEvent.click(option);
    });
    
    // Set baseline date
    const dateInput = screen.getByTestId('datepicker-baseline-date');
    fireEvent.change(dateInput, { target: { value: '2024-01-15T10:00' } });
    
    const submitButton = screen.getByText('Create Survey');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/surveys/from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({
          clinicalStudyId: 'study-1',
          organizationId: 'org-1',
          patientId: 'patient-1',
          baselineDate: expect.any(String),
          assignedBy: 'user-1',
          customName: undefined
        })
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText('Survey created successfully with 1 visits')).toBeInTheDocument();
    });
    
    expect(defaultProps.onSurveyCreated).toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    // Mock failed clinical studies fetch
    mockFetch.mockResolvedValueOnce({
      ok: false
    });
    
    render(<SurveyCreateForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load clinical studies')).toBeInTheDocument();
    });
  });

  it('shows study details dialog', async () => {
    setupMockFetch();
    
    render(<SurveyCreateForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Clinical Study')).toBeInTheDocument();
    });
    
    // Select study
    const studySelect = screen.getByLabelText('Clinical Study');
    fireEvent.mouseDown(studySelect);
    await waitFor(() => {
      const option = screen.getByText('TS001 - Test Study 1');
      fireEvent.click(option);
    });
    
    // Click view details
    await waitFor(() => {
      const viewDetailsButton = screen.getByText('View Study Details');
      fireEvent.click(viewDetailsButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Study Details')).toBeInTheDocument();
      expect(screen.getByText('Test Study 1 (TS001)')).toBeInTheDocument();
      expect(screen.getByText('Visit Template (1 visits)')).toBeInTheDocument();
    });
  });

  it('shows patient details dialog', async () => {
    setupMockFetch();
    
    render(<SurveyCreateForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Patient')).toBeInTheDocument();
    });
    
    // Select patient
    const patientSelect = screen.getByLabelText('Patient');
    fireEvent.mouseDown(patientSelect);
    await waitFor(() => {
      const option = screen.getByText('P001 (JD)');
      fireEvent.click(option);
    });
    
    // Click view details
    await waitFor(() => {
      const viewDetailsButton = screen.getByText('View Patient Details');
      fireEvent.click(viewDetailsButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Patient Details')).toBeInTheDocument();
      expect(screen.getByText('P001 (JD)')).toBeInTheDocument();
      expect(screen.getByText('Medical History:')).toBeInTheDocument();
    });
  });

  it('calculates expected completion date', async () => {
    setupMockFetch();
    
    render(<SurveyCreateForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Clinical Study')).toBeInTheDocument();
    });
    
    // Select study
    const studySelect = screen.getByLabelText('Clinical Study');
    fireEvent.mouseDown(studySelect);
    await waitFor(() => {
      const option = screen.getByText('TS001 - Test Study 1');
      fireEvent.click(option);
    });
    
    // Set baseline date
    const dateInput = screen.getByTestId('datepicker-baseline-date');
    fireEvent.change(dateInput, { target: { value: '2024-01-15T10:00' } });
    
    await waitFor(() => {
      expect(screen.getByText('Expected Completion:')).toBeInTheDocument();
    });
  });

  it('closes dialog when cancel is clicked', async () => {
    setupMockFetch();
    
    render(<SurveyCreateForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('allows custom survey name', async () => {
    setupMockFetch();
    
    render(<SurveyCreateForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Custom Survey Name (Optional)')).toBeInTheDocument();
    });
    
    const customNameField = screen.getByLabelText('Custom Survey Name (Optional)');
    fireEvent.change(customNameField, { target: { value: 'My Custom Survey Name' } });
    
    expect(customNameField).toHaveValue('My Custom Survey Name');
  });

  it('filters active clinical studies only', async () => {
    const studiesWithInactive = [
      ...mockClinicalStudies,
      {
        ...mockClinicalStudies[0],
        clinicalStudyId: 'study-2',
        studyName: 'Inactive Study',
        studyCode: 'IS001',
        status: 'completed'
      }
    ];
    
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: studiesWithInactive })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockPatients })
      });
    
    render(<SurveyCreateForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Clinical Study')).toBeInTheDocument();
    });
    
    const studySelect = screen.getByLabelText('Clinical Study');
    fireEvent.mouseDown(studySelect);
    
    await waitFor(() => {
      expect(screen.getByText('TS001 - Test Study 1')).toBeInTheDocument();
      expect(screen.queryByText('IS001 - Inactive Study')).not.toBeInTheDocument();
    });
  });

  it('filters active patients only', async () => {
    const patientsWithInactive = [
      ...mockPatients,
      {
        ...mockPatients[0],
        patientId: 'patient-3',
        patientCode: 'P003',
        status: 'inactive'
      }
    ];
    
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockClinicalStudies })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: patientsWithInactive })
      });
    
    render(<SurveyCreateForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Patient')).toBeInTheDocument();
    });
    
    const patientSelect = screen.getByLabelText('Patient');
    fireEvent.mouseDown(patientSelect);
    
    await waitFor(() => {
      expect(screen.getByText('P001 (JD)')).toBeInTheDocument();
      expect(screen.getByText('P002')).toBeInTheDocument();
      expect(screen.queryByText('P003')).not.toBeInTheDocument();
    });
  });
});