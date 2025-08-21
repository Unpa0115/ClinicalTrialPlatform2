import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import ClinicalStudyEditForm from '../ClinicalStudyEditForm';
import { clinicalStudyService } from '../../../services/ClinicalStudyService';
import { ClinicalStudyRecord } from '@clinical-trial/shared';

// Mock the service
jest.mock('../../../services/ClinicalStudyService');

const mockClinicalStudyService = clinicalStudyService as jest.Mocked<typeof clinicalStudyService>;

const mockStudy: ClinicalStudyRecord = {
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

describe('ClinicalStudyEditForm', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders edit form when open with study', () => {
    render(
      <ClinicalStudyEditForm
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Edit Clinical Study: Test Study')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Study')).toBeInTheDocument();
    expect(screen.getByDisplayValue('TST001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test study description')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(
      <ClinicalStudyEditForm
        open={false}
        study={mockStudy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText('Edit Clinical Study: Test Study')).not.toBeInTheDocument();
  });

  test('does not render when study is null', () => {
    render(
      <ClinicalStudyEditForm
        open={true}
        study={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText('Edit Clinical Study')).not.toBeInTheDocument();
  });

  test('pre-fills form with study data', () => {
    render(
      <ClinicalStudyEditForm
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByDisplayValue('Test Study')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test study description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Primary objective')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Secondary objective 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Inclusion 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Exclusion 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Baseline Visit')).toBeInTheDocument();
  });

  test('study code is disabled and cannot be edited', () => {
    render(
      <ClinicalStudyEditForm
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const studyCodeInput = screen.getByDisplayValue('TST001');
    expect(studyCodeInput).toBeDisabled();
    expect(screen.getByText('Study code cannot be changed')).toBeInTheDocument();
  });

  test('shows validation errors for required fields', async () => {
    render(
      <ClinicalStudyEditForm
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Clear study name
    const studyNameInput = screen.getByDisplayValue('Test Study');
    fireEvent.change(studyNameInput, { target: { value: '' } });

    const submitButton = screen.getByRole('button', { name: 'Update Study' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Study name is required')).toBeInTheDocument();
    });
  });

  test('adds and removes secondary objectives', () => {
    render(
      <ClinicalStudyEditForm
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Should have one secondary objective initially
    expect(screen.getByDisplayValue('Secondary objective 1')).toBeInTheDocument();

    // Add another secondary objective
    const addSecondaryButton = screen.getByRole('button', { name: /Add/ });
    fireEvent.click(addSecondaryButton);

    expect(screen.getByLabelText('Secondary Objective 2')).toBeInTheDocument();

    // Remove the first secondary objective
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    expect(screen.queryByDisplayValue('Secondary objective 1')).not.toBeInTheDocument();
  });

  test('adds and removes visit templates', () => {
    render(
      <ClinicalStudyEditForm
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Should start with 1 visit
    expect(screen.getAllByText(/Visit \d+/)).toHaveLength(1);

    // Add visit
    const addVisitButton = screen.getByRole('button', { name: 'Add Visit' });
    fireEvent.click(addVisitButton);

    expect(screen.getAllByText(/Visit \d+/)).toHaveLength(2);
    expect(screen.getByDisplayValue('Visit 2')).toBeInTheDocument();
  });

  test('toggles examination selection for visits', () => {
    render(
      <ClinicalStudyEditForm
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Basic Information should be selected initially
    const basicInfoChip = screen.getByText('Basic Information');
    expect(basicInfoChip.closest('.MuiChip-root')).toHaveClass('MuiChip-filled');

    // Deselect Basic Information
    fireEvent.click(basicInfoChip);
    expect(basicInfoChip.closest('.MuiChip-root')).toHaveClass('MuiChip-outlined');

    // Select VAS
    const vasChip = screen.getByText('Visual Analog Scale (VAS)');
    fireEvent.click(vasChip);
    expect(vasChip.closest('.MuiChip-root')).toHaveClass('MuiChip-filled');
  });

  test('updates status field', () => {
    render(
      <ClinicalStudyEditForm
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const statusSelect = screen.getByDisplayValue('planning');
    fireEvent.click(statusSelect);
    
    const activeOption = screen.getByRole('option', { name: 'Active' });
    fireEvent.click(activeOption);

    expect(screen.getByDisplayValue('active')).toBeInTheDocument();
  });

  test('submits form with updated data', async () => {
    const updatedStudy = { ...mockStudy, studyName: 'Updated Study Name' };
    mockClinicalStudyService.updateClinicalStudy.mockResolvedValue({
      success: true,
      study: updatedStudy,
    });

    render(
      <ClinicalStudyEditForm
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Update study name
    const studyNameInput = screen.getByDisplayValue('Test Study');
    fireEvent.change(studyNameInput, { target: { value: 'Updated Study Name' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Update Study' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockClinicalStudyService.updateClinicalStudy).toHaveBeenCalledWith(
        'study-1',
        expect.objectContaining({
          studyName: 'Updated Study Name',
        })
      );
      expect(mockOnSuccess).toHaveBeenCalledWith(updatedStudy);
    });
  });

  test('handles form submission error', async () => {
    const errorMessage = 'Failed to update study';
    mockClinicalStudyService.updateClinicalStudy.mockRejectedValue(new Error(errorMessage));

    render(
      <ClinicalStudyEditForm
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Update Study' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('shows loading state during submission', async () => {
    mockClinicalStudyService.updateClinicalStudy.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <ClinicalStudyEditForm
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Update Study' });
    fireEvent.click(submitButton);

    expect(screen.getByRole('button', { name: 'Updating...' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('closes form when cancel is clicked', () => {
    render(
      <ClinicalStudyEditForm
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('resets form when study changes', () => {
    const { rerender } = render(
      <ClinicalStudyEditForm
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByDisplayValue('Test Study')).toBeInTheDocument();

    const newStudy = { ...mockStudy, studyName: 'New Study Name' };
    rerender(
      <ClinicalStudyEditForm
        open={true}
        study={newStudy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByDisplayValue('New Study Name')).toBeInTheDocument();
  });

  test('validates visit template requirements', async () => {
    render(
      <ClinicalStudyEditForm
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Deselect all examinations from the visit
    const basicInfoChip = screen.getByText('Basic Information');
    fireEvent.click(basicInfoChip); // Deselect Basic Information

    // Try to submit
    const submitButton = screen.getByRole('button', { name: 'Update Study' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('At least one examination is required')).toBeInTheDocument();
    });
  });
});