import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import ClinicalStudyDetailDialog from '../ClinicalStudyDetailDialog';
import { ClinicalStudyRecord } from '@clinical-trial/shared';

const mockStudy: ClinicalStudyRecord = {
  clinicalStudyId: 'study-1',
  studyName: 'Test Study',
  studyCode: 'TST001',
  description: 'Test study description',
  studyType: 'interventional',
  phase: 'phase_1',
  primaryObjective: 'Primary objective',
  secondaryObjectives: ['Secondary objective 1', 'Secondary objective 2'],
  inclusionCriteria: ['Inclusion 1', 'Inclusion 2'],
  exclusionCriteria: ['Exclusion 1', 'Exclusion 2'],
  targetOrganizations: ['org-1', 'org-2'],
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
      requiredExaminations: ['Basic Information', 'VAS'],
      optionalExaminations: [],
      examinationOrder: ['Basic Information', 'VAS'],
      isRequired: true,
    },
    {
      visitNumber: 2,
      visitType: '1week',
      visitName: 'Week 1 Follow-up',
      scheduledDaysFromBaseline: 7,
      windowDaysBefore: 2,
      windowDaysAfter: 2,
      requiredExaminations: ['VAS', 'Questionnaire'],
      optionalExaminations: [],
      examinationOrder: ['VAS', 'Questionnaire'],
      isRequired: true,
    },
  ],
  status: 'active',
  currentEnrollment: 50,
  createdBy: 'user-1',
  lastModifiedBy: 'user-2',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-15T00:00:00.000Z',
  entityType: 'clinicalStudy',
};

describe('ClinicalStudyDetailDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders detail dialog when open with study', () => {
    render(
      <ClinicalStudyDetailDialog
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Test Study')).toBeInTheDocument();
    expect(screen.getByText('TST001')).toBeInTheDocument();
    expect(screen.getByText('Test study description')).toBeInTheDocument();
    expect(screen.getByText('Interventional')).toBeInTheDocument();
    expect(screen.getByText('Phase I')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(
      <ClinicalStudyDetailDialog
        open={false}
        study={mockStudy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.queryByText('Test Study')).not.toBeInTheDocument();
  });

  test('does not render when study is null', () => {
    render(
      <ClinicalStudyDetailDialog
        open={true}
        study={null}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.queryByText('Basic Information')).not.toBeInTheDocument();
  });

  test('displays basic information correctly', () => {
    render(
      <ClinicalStudyDetailDialog
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Test Study')).toBeInTheDocument();
    expect(screen.getByText('TST001')).toBeInTheDocument();
    expect(screen.getByText('Test study description')).toBeInTheDocument();
    expect(screen.getByText('Interventional')).toBeInTheDocument();
    expect(screen.getByText('Phase I')).toBeInTheDocument();
    expect(screen.getByText('100 participants')).toBeInTheDocument();
    expect(screen.getByText('12 months')).toBeInTheDocument();
  });

  test('displays study objectives', () => {
    render(
      <ClinicalStudyDetailDialog
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Primary objective')).toBeInTheDocument();
    expect(screen.getByText('1. Secondary objective 1')).toBeInTheDocument();
    expect(screen.getByText('2. Secondary objective 2')).toBeInTheDocument();
  });

  test('displays inclusion and exclusion criteria', () => {
    render(
      <ClinicalStudyDetailDialog
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('1. Inclusion 1')).toBeInTheDocument();
    expect(screen.getByText('2. Inclusion 2')).toBeInTheDocument();
    expect(screen.getByText('1. Exclusion 1')).toBeInTheDocument();
    expect(screen.getByText('2. Exclusion 2')).toBeInTheDocument();
  });

  test('displays target organizations', () => {
    render(
      <ClinicalStudyDetailDialog
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('org-1')).toBeInTheDocument();
    expect(screen.getByText('org-2')).toBeInTheDocument();
  });

  test('displays visit template information', () => {
    render(
      <ClinicalStudyDetailDialog
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Baseline Visit')).toBeInTheDocument();
    expect(screen.getByText('Week 1 Follow-up')).toBeInTheDocument();
    expect(screen.getByText('Visit 1')).toBeInTheDocument();
    expect(screen.getByText('Visit 2')).toBeInTheDocument();
    expect(screen.getByText('Day 0')).toBeInTheDocument();
    expect(screen.getByText('Day 7 (±2 days)')).toBeInTheDocument();
  });

  test('displays examination requirements for each visit', () => {
    render(
      <ClinicalStudyDetailDialog
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    // Check examinations are displayed as chips
    const basicInfoChips = screen.getAllByText('Basic Information');
    const vasChips = screen.getAllByText('VAS');
    const questionnaireChips = screen.getAllByText('Questionnaire');

    expect(basicInfoChips.length).toBeGreaterThan(0);
    expect(vasChips.length).toBeGreaterThan(0);
    expect(questionnaireChips.length).toBeGreaterThan(0);
  });

  test('displays enrollment statistics', () => {
    render(
      <ClinicalStudyDetailDialog
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('100')).toBeInTheDocument(); // Planned enrollment
    expect(screen.getByText('50')).toBeInTheDocument(); // Current enrollment
    expect(screen.getByText('50%')).toBeInTheDocument(); // Progress percentage
  });

  test('displays creation and update information', () => {
    render(
      <ClinicalStudyDetailDialog
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('user-1')).toBeInTheDocument(); // Created by
    expect(screen.getByText('user-2')).toBeInTheDocument(); // Last modified by
    
    // Check dates are formatted correctly
    const createdDate = new Date(mockStudy.createdAt).toLocaleDateString();
    const updatedDate = new Date(mockStudy.updatedAt).toLocaleDateString();
    expect(screen.getByText(createdDate)).toBeInTheDocument();
    expect(screen.getByText(updatedDate)).toBeInTheDocument();
  });

  test('shows edit button when onEdit is provided', () => {
    render(
      <ClinicalStudyDetailDialog
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  test('does not show edit button when onEdit is not provided', () => {
    render(
      <ClinicalStudyDetailDialog
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  test('calls onEdit when edit button is clicked', () => {
    render(
      <ClinicalStudyDetailDialog
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    const editButton = screen.getByRole('button', { name: 'Edit' });
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockStudy);
  });

  test('calls onClose when close button is clicked', () => {
    render(
      <ClinicalStudyDetailDialog
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('handles study without secondary objectives', () => {
    const studyWithoutSecondaryObjectives = {
      ...mockStudy,
      secondaryObjectives: undefined,
    };

    render(
      <ClinicalStudyDetailDialog
        open={true}
        study={studyWithoutSecondaryObjectives}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Primary objective')).toBeInTheDocument();
    // Should not crash or show error
  });

  test('handles study without target organizations', () => {
    const studyWithoutOrganizations = {
      ...mockStudy,
      targetOrganizations: undefined,
    };

    render(
      <ClinicalStudyDetailDialog
        open={true}
        study={studyWithoutOrganizations}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('No target organizations specified')).toBeInTheDocument();
  });

  test('handles study without visit template', () => {
    const studyWithoutVisitTemplate = {
      ...mockStudy,
      visitTemplate: undefined,
    };

    render(
      <ClinicalStudyDetailDialog
        open={true}
        study={studyWithoutVisitTemplate}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('No visit template defined')).toBeInTheDocument();
  });

  test('displays correct status color and label', () => {
    render(
      <ClinicalStudyDetailDialog
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    const statusChips = screen.getAllByText('Active');
    expect(statusChips.length).toBeGreaterThan(0);
    
    // Check that the status chip has the correct color class
    const statusChip = statusChips[0].closest('.MuiChip-root');
    expect(statusChip).toHaveClass('MuiChip-colorSuccess');
  });

  test('formats window periods correctly', () => {
    render(
      <ClinicalStudyDetailDialog
        open={true}
        study={mockStudy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Day 0')).toBeInTheDocument();
    expect(screen.getByText('Day 7 (±2 days)')).toBeInTheDocument();
  });

  test('calculates enrollment progress correctly', () => {
    const studyWithZeroEnrollment = {
      ...mockStudy,
      currentEnrollment: 0,
    };

    render(
      <ClinicalStudyDetailDialog
        open={true}
        study={studyWithZeroEnrollment}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});