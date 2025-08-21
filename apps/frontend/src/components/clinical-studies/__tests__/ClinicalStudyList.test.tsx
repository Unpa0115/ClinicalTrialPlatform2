import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import ClinicalStudyList from '../ClinicalStudyList';
import { clinicalStudyService } from '../../../services/ClinicalStudyService';
import { useAuth } from '../../../contexts/AuthContext';
import { ClinicalStudyRecord } from '@clinical-trial/shared';

// Mock the services and contexts
jest.mock('../../../services/ClinicalStudyService');
jest.mock('../../../contexts/AuthContext');

const mockClinicalStudyService = clinicalStudyService as jest.Mocked<typeof clinicalStudyService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock clinical study data
const mockClinicalStudies: ClinicalStudyRecord[] = [
  {
    clinicalStudyId: 'study-1',
    studyName: 'Test Study 1',
    studyCode: 'TST001',
    description: 'Test study description',
    studyType: 'interventional',
    phase: 'phase_1',
    primaryObjective: 'Primary objective',
    secondaryObjectives: ['Secondary objective 1'],
    inclusionCriteria: ['Inclusion 1'],
    exclusionCriteria: ['Exclusion 1'],
    targetOrganizations: ['org-1'],
    plannedEnrollment: 100,
    estimatedDuration: 12,
    visitTemplate: [],
    status: 'planning',
    currentEnrollment: 0,
    createdBy: 'user-1',
    lastModifiedBy: 'user-1',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    entityType: 'clinicalStudy',
  },
  {
    clinicalStudyId: 'study-2',
    studyName: 'Test Study 2',
    studyCode: 'TST002',
    description: 'Another test study',
    studyType: 'observational',
    phase: 'phase_2',
    primaryObjective: 'Primary objective 2',
    secondaryObjectives: [],
    inclusionCriteria: ['Inclusion 2'],
    exclusionCriteria: ['Exclusion 2'],
    targetOrganizations: ['org-1'],
    plannedEnrollment: 50,
    estimatedDuration: 6,
    visitTemplate: [],
    status: 'active',
    currentEnrollment: 10,
    createdBy: 'user-1',
    lastModifiedBy: 'user-1',
    createdAt: '2023-01-02T00:00:00.000Z',
    updatedAt: '2023-01-02T00:00:00.000Z',
    entityType: 'clinicalStudy',
  },
];

const mockUser = {
  userId: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'study_admin' as const,
  organizationId: 'org-1',
};

describe('ClinicalStudyList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
    });
  });

  test('renders clinical study list with studies', async () => {
    mockClinicalStudyService.getStudies.mockResolvedValue({
      success: true,
      studies: mockClinicalStudies,
    });

    render(<ClinicalStudyList />);

    expect(screen.getByText('Clinical Study Management')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Test Study 1')).toBeInTheDocument();
      expect(screen.getByText('Test Study 2')).toBeInTheDocument();
    });
  });

  test('shows create button for authorized users', async () => {
    mockClinicalStudyService.getStudies.mockResolvedValue({
      success: true,
      studies: mockClinicalStudies,
    });

    render(<ClinicalStudyList />);

    await waitFor(() => {
      expect(screen.getByText('Create New Study')).toBeInTheDocument();
    });
  });

  test('filters studies by search term', async () => {
    mockClinicalStudyService.getStudies.mockResolvedValue({
      success: true,
      studies: mockClinicalStudies,
    });

    render(<ClinicalStudyList />);

    await waitFor(() => {
      expect(screen.getByText('Test Study 1')).toBeInTheDocument();
      expect(screen.getByText('Test Study 2')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search by study name or code');
    fireEvent.change(searchInput, { target: { value: 'TST001' } });

    expect(screen.getByText('Test Study 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Study 2')).not.toBeInTheDocument();
  });

  test('filters studies by status', async () => {
    mockClinicalStudyService.getStudies.mockResolvedValue({
      success: true,
      studies: mockClinicalStudies,
    });

    render(<ClinicalStudyList />);

    await waitFor(() => {
      expect(screen.getByText('Test Study 1')).toBeInTheDocument();
      expect(screen.getByText('Test Study 2')).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText('Status');
    fireEvent.click(statusSelect);
    fireEvent.click(screen.getByText('Active'));

    await waitFor(() => {
      expect(mockClinicalStudyService.getStudies).toHaveBeenCalledWith({
        status: 'active',
      });
    });
  });

  test('opens detail dialog when view button is clicked', async () => {
    mockClinicalStudyService.getStudies.mockResolvedValue({
      success: true,
      studies: mockClinicalStudies,
    });

    render(<ClinicalStudyList />);

    await waitFor(() => {
      expect(screen.getByText('Test Study 1')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByTitle('View Details');
    fireEvent.click(viewButtons[0]);

    expect(screen.getByText('Test Study 1')).toBeInTheDocument();
  });

  test('opens edit form when edit button is clicked', async () => {
    mockClinicalStudyService.getStudies.mockResolvedValue({
      success: true,
      studies: mockClinicalStudies,
    });

    render(<ClinicalStudyList />);

    await waitFor(() => {
      expect(screen.getByText('Test Study 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Edit');
    fireEvent.click(editButtons[0]);

    expect(screen.getByText('Edit Clinical Study: Test Study 1')).toBeInTheDocument();
  });

  test('shows delete button only for planning status studies', async () => {
    mockClinicalStudyService.getStudies.mockResolvedValue({
      success: true,
      studies: mockClinicalStudies,
    });

    render(<ClinicalStudyList />);

    await waitFor(() => {
      expect(screen.getByText('Test Study 1')).toBeInTheDocument();
    });

    // Planning status study should have delete button
    const deleteButtons = screen.getAllByTitle('Delete');
    expect(deleteButtons).toHaveLength(1);

    // Active study should not have delete button (only planning status can be deleted)
    const studyCards = screen.getAllByRole('button', { name: /Change Status/i });
    expect(studyCards).toHaveLength(2); // Both studies should have change status button
  });

  test('opens delete confirmation dialog', async () => {
    mockClinicalStudyService.getStudies.mockResolvedValue({
      success: true,
      studies: mockClinicalStudies,
    });

    render(<ClinicalStudyList />);

    await waitFor(() => {
      expect(screen.getByText('Test Study 1')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete the clinical study "Test Study 1"/)).toBeInTheDocument();
  });

  test('deletes study when confirmed', async () => {
    mockClinicalStudyService.getStudies.mockResolvedValue({
      success: true,
      studies: mockClinicalStudies,
    });
    mockClinicalStudyService.deleteClinicalStudy.mockResolvedValue({
      success: true,
      message: 'Study deleted successfully',
    });

    render(<ClinicalStudyList />);

    await waitFor(() => {
      expect(screen.getByText('Test Study 1')).toBeInTheDocument();
    });

    // Open delete dialog
    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmDeleteButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmDeleteButton);

    await waitFor(() => {
      expect(mockClinicalStudyService.deleteClinicalStudy).toHaveBeenCalledWith('study-1');
    });
  });

  test('opens status change dialog', async () => {
    mockClinicalStudyService.getStudies.mockResolvedValue({
      success: true,
      studies: mockClinicalStudies,
    });

    render(<ClinicalStudyList />);

    await waitFor(() => {
      expect(screen.getByText('Test Study 1')).toBeInTheDocument();
    });

    const changeStatusButtons = screen.getAllByText('Change Status');
    fireEvent.click(changeStatusButtons[0]);

    expect(screen.getByText('Change Status')).toBeInTheDocument();
    expect(screen.getByLabelText('New Status')).toBeInTheDocument();
  });

  test('updates study status when confirmed', async () => {
    mockClinicalStudyService.getStudies.mockResolvedValue({
      success: true,
      studies: mockClinicalStudies,
    });
    mockClinicalStudyService.updateStudyStatus.mockResolvedValue({
      success: true,
      study: { ...mockClinicalStudies[0], status: 'active' },
    });

    render(<ClinicalStudyList />);

    await waitFor(() => {
      expect(screen.getByText('Test Study 1')).toBeInTheDocument();
    });

    // Open status change dialog
    const changeStatusButtons = screen.getAllByText('Change Status');
    fireEvent.click(changeStatusButtons[0]);

    // Select new status
    const statusSelect = screen.getByLabelText('New Status');
    fireEvent.click(statusSelect);
    fireEvent.click(screen.getByRole('option', { name: 'Active' }));

    // Confirm change
    const confirmButton = screen.getByRole('button', { name: 'Change' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockClinicalStudyService.updateStudyStatus).toHaveBeenCalledWith('study-1', 'active');
    });
  });

  test('handles loading state', () => {
    mockClinicalStudyService.getStudies.mockReturnValue(new Promise(() => {})); // Never resolves

    render(<ClinicalStudyList />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('handles error state', async () => {
    const errorMessage = 'Failed to load studies';
    mockClinicalStudyService.getStudies.mockRejectedValue(new Error(errorMessage));

    render(<ClinicalStudyList />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('shows no studies message when list is empty', async () => {
    mockClinicalStudyService.getStudies.mockResolvedValue({
      success: true,
      studies: [],
    });

    render(<ClinicalStudyList />);

    await waitFor(() => {
      expect(screen.getByText('No clinical studies found')).toBeInTheDocument();
    });
  });

  test('respects user permissions for organization admin', async () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, role: 'org_admin' },
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
    });

    mockClinicalStudyService.getStudies.mockResolvedValue({
      success: true,
      studies: mockClinicalStudies,
    });

    render(<ClinicalStudyList />);

    // Organization admin should not see create button
    await waitFor(() => {
      expect(screen.queryByText('Create New Study')).not.toBeInTheDocument();
    });
  });
});