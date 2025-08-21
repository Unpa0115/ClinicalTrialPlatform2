import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import ClinicalStudyCreateForm from '../ClinicalStudyCreateForm';
import { clinicalStudyService } from '../../../services/ClinicalStudyService';
import { ClinicalStudyRecord } from '@clinical-trial/shared';

// Mock the service
jest.mock('../../../services/ClinicalStudyService');

const mockClinicalStudyService = clinicalStudyService as jest.Mocked<typeof clinicalStudyService>;

const mockCreatedStudy: ClinicalStudyRecord = {
  clinicalStudyId: 'study-1',
  studyName: 'Test Study',
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
  visitTemplate: [
    {
      visitNumber: 1,
      visitType: 'baseline',
      visitName: 'Baseline Visit',
      scheduledDaysFromBaseline: 0,
      windowDaysBefore: 0,
      windowDaysAfter: 3,
      requiredExaminations: ['Basic Information'],
      optionalExaminations: [],
      examinationOrder: ['Basic Information'],
      isRequired: true,
    },
  ],
  status: 'planning',
  currentEnrollment: 0,
  createdBy: 'user-1',
  lastModifiedBy: 'user-1',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  entityType: 'clinicalStudy',
};

describe('ClinicalStudyCreateForm', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders create form when open', () => {
    render(
      <ClinicalStudyCreateForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Create New Clinical Study')).toBeInTheDocument();
    expect(screen.getByLabelText(/Study Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Study Code/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(
      <ClinicalStudyCreateForm
        open={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText('Create New Clinical Study')).not.toBeInTheDocument();
  });

  test('shows validation errors for required fields', async () => {
    render(
      <ClinicalStudyCreateForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Create Study' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Study name is required')).toBeInTheDocument();
      expect(screen.getByText('Study code is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });
  });

  test('fills form with default values', () => {
    render(
      <ClinicalStudyCreateForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Check default visit template
    expect(screen.getByDisplayValue('Baseline Visit')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Follow-up Visit')).toBeInTheDocument();

    // Check default study type
    expect(screen.getByDisplayValue('interventional')).toBeInTheDocument();
    
    // Check default planned enrollment
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  });

  test('adds and removes secondary objectives', () => {
    render(
      <ClinicalStudyCreateForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Add secondary objective
    const addSecondaryButton = screen.getByRole('button', { name: /Add/ });
    fireEvent.click(addSecondaryButton);

    expect(screen.getByLabelText('Secondary Objective 1')).toBeInTheDocument();

    // Remove secondary objective
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(screen.queryByLabelText('Secondary Objective 1')).not.toBeInTheDocument();
  });

  test('adds and removes visit templates', () => {
    render(
      <ClinicalStudyCreateForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Should start with 2 visits
    expect(screen.getAllByText(/Visit \d+/)).toHaveLength(2);

    // Add visit
    const addVisitButton = screen.getByRole('button', { name: 'Add Visit' });
    fireEvent.click(addVisitButton);

    expect(screen.getAllByText(/Visit \d+/)).toHaveLength(3);
    expect(screen.getByDisplayValue('Visit 3')).toBeInTheDocument();

    // Remove visit
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    const visitDeleteButton = deleteButtons.find(button => 
      button.closest('[role="dialog"]')?.textContent?.includes('Visit')
    );
    if (visitDeleteButton) {
      fireEvent.click(visitDeleteButton);
    }

    expect(screen.getAllByText(/Visit \d+/)).toHaveLength(2);
  });

  test('toggles examination selection for visits', () => {
    render(
      <ClinicalStudyCreateForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Find examination chips
    const examinationChips = screen.getAllByText('Visual Analog Scale (VAS)');
    const firstVasChip = examinationChips[0];
    
    // Should be unselected initially
    expect(firstVasChip.closest('.MuiChip-root')).toHaveClass('MuiChip-outlined');
    
    // Click to select
    fireEvent.click(firstVasChip);
    
    // Should be selected now
    expect(firstVasChip.closest('.MuiChip-root')).toHaveClass('MuiChip-filled');
  });

  test('submits form with valid data', async () => {
    mockClinicalStudyService.createClinicalStudy.mockResolvedValue({
      success: true,
      study: mockCreatedStudy,
    });

    render(
      <ClinicalStudyCreateForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Study Name/), {
      target: { value: 'Test Study' },
    });
    fireEvent.change(screen.getByLabelText(/Study Code/), {
      target: { value: 'TST001' },
    });
    fireEvent.change(screen.getByLabelText(/Description/), {
      target: { value: 'Test study description' },
    });
    fireEvent.change(screen.getByLabelText(/Primary Objective/), {
      target: { value: 'Primary objective' },
    });

    // Add inclusion/exclusion criteria
    const addInclusionButton = screen.getAllByRole('button', { name: /Add/ })[1]; // Second Add button
    fireEvent.click(addInclusionButton);
    fireEvent.change(screen.getByLabelText('Inclusion Criteria 1'), {
      target: { value: 'Inclusion 1' },
    });

    const addExclusionButton = screen.getAllByRole('button', { name: /Add/ })[2]; // Third Add button
    fireEvent.click(addExclusionButton);
    fireEvent.change(screen.getByLabelText('Exclusion Criteria 1'), {
      target: { value: 'Exclusion 1' },
    });

    // Add target organization
    const addOrgButton = screen.getAllByRole('button', { name: /Add/ })[3]; // Fourth Add button
    fireEvent.click(addOrgButton);
    fireEvent.change(screen.getByLabelText('Target Organization 1'), {
      target: { value: 'org-1' },
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Create Study' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockClinicalStudyService.createClinicalStudy).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalledWith(mockCreatedStudy);
    });
  });

  test('handles form submission error', async () => {
    const errorMessage = 'Failed to create study';
    mockClinicalStudyService.createClinicalStudy.mockRejectedValue(new Error(errorMessage));

    render(
      <ClinicalStudyCreateForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill required fields (minimal)
    fireEvent.change(screen.getByLabelText(/Study Name/), {
      target: { value: 'Test Study' },
    });
    fireEvent.change(screen.getByLabelText(/Study Code/), {
      target: { value: 'TST001' },
    });
    fireEvent.change(screen.getByLabelText(/Description/), {
      target: { value: 'Test study description' },
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Create Study' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('shows loading state during submission', async () => {
    mockClinicalStudyService.createClinicalStudy.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <ClinicalStudyCreateForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill minimal required data and submit
    fireEvent.change(screen.getByLabelText(/Study Name/), {
      target: { value: 'Test Study' },
    });
    fireEvent.change(screen.getByLabelText(/Study Code/), {
      target: { value: 'TST001' },
    });

    const submitButton = screen.getByRole('button', { name: 'Create Study' });
    fireEvent.click(submitButton);

    expect(screen.getByRole('button', { name: 'Creating...' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('closes form when cancel is clicked', () => {
    render(
      <ClinicalStudyCreateForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('validates visit template requirements', async () => {
    render(
      <ClinicalStudyCreateForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Clear all examinations from the first visit
    const basicInfoChips = screen.getAllByText('Basic Information');
    fireEvent.click(basicInfoChips[0]); // Deselect Basic Information

    // Try to submit
    const submitButton = screen.getByRole('button', { name: 'Create Study' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('At least one examination is required')).toBeInTheDocument();
    });
  });
});