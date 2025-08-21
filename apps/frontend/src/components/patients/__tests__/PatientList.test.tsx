import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import PatientList from '../PatientList';
import { patientService } from '../../../services/PatientService';
import { useAuth } from '../../../contexts/AuthContext';
import { PatientRecord } from '@clinical-trial/shared';

// Mock the services and contexts
jest.mock('../../../services/PatientService');
jest.mock('../../../contexts/AuthContext');

const mockPatientService = patientService as jest.Mocked<typeof patientService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock patient data
const mockPatients: PatientRecord[] = [
  {
    patientId: 'patient-1',
    patientCode: 'P001',
    patientName: 'Test Patient 1',
    patientInitials: 'TP1',
    dateOfBirth: '1980-01-01',
    gender: 'male',
    registeredOrganizationId: 'org-1',
    medicalHistory: ['Hypertension'],
    currentMedications: ['Medication A'],
    allergies: ['Allergy A'],
    contactInfo: {
      phone: '090-1234-5678',
      email: 'test1@example.com',
      emergencyContact: '090-8765-4321',
    },
    status: 'active',
    enrolledStudies: ['study-1'],
    assignedSurveys: ['survey-1'],
    consentRecords: [],
    createdBy: 'user-1',
    lastModifiedBy: 'user-1',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    entityType: 'patient',
  },
  {
    patientId: 'patient-2',
    patientCode: 'P002',
    patientName: 'Test Patient 2',
    patientInitials: 'TP2',
    dateOfBirth: '1990-02-02',
    gender: 'female',
    registeredOrganizationId: 'org-1',
    medicalHistory: ['Diabetes'],
    currentMedications: ['Medication B'],
    allergies: [],
    contactInfo: {
      phone: '090-2345-6789',
      email: 'test2@example.com',
      emergencyContact: '090-9876-5432',
    },
    status: 'inactive',
    enrolledStudies: [],
    assignedSurveys: [],
    consentRecords: [],
    createdBy: 'user-1',
    lastModifiedBy: 'user-1',
    createdAt: '2023-01-02T00:00:00.000Z',
    updatedAt: '2023-01-02T00:00:00.000Z',
    entityType: 'patient',
  },
];

const mockUser = {
  userId: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'super_admin' as const,
  organizationId: 'org-1',
};

describe('PatientList', () => {
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

  test('renders patient list with patients', async () => {
    mockPatientService.getPatientsByOrganization.mockResolvedValue({
      success: true,
      patients: mockPatients,
    });

    render(<PatientList organizationId="org-1" />);

    expect(screen.getByText('患者マスター管理')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('P001')).toBeInTheDocument();
      expect(screen.getByText('P002')).toBeInTheDocument();
    });
  });

  test('shows create button for authorized users', async () => {
    mockPatientService.getPatientsByOrganization.mockResolvedValue({
      success: true,
      patients: mockPatients,
    });

    render(<PatientList organizationId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText('新規患者登録')).toBeInTheDocument();
    });
  });

  test('filters patients by search term', async () => {
    mockPatientService.getPatientsByOrganization.mockResolvedValue({
      success: true,
      patients: mockPatients,
    });

    render(<PatientList organizationId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText('P001')).toBeInTheDocument();
      expect(screen.getByText('P002')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('患者コードまたは名前で検索');
    fireEvent.change(searchInput, { target: { value: 'P001' } });

    expect(screen.getByText('P001')).toBeInTheDocument();
    expect(screen.queryByText('P002')).not.toBeInTheDocument();
  });

  test('filters patients by status', async () => {
    mockPatientService.getPatientsByOrganization.mockResolvedValue({
      success: true,
      patients: mockPatients,
    });

    render(<PatientList organizationId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText('P001')).toBeInTheDocument();
      expect(screen.getByText('P002')).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText('ステータス');
    fireEvent.click(statusSelect);
    fireEvent.click(screen.getByText('有効'));

    const activePatients = mockPatients.filter(p => p.status === 'active');
    expect(screen.getByText('P001')).toBeInTheDocument();
    expect(screen.queryByText('P002')).not.toBeInTheDocument();
  });

  test('opens detail dialog when view button is clicked', async () => {
    mockPatientService.getPatientsByOrganization.mockResolvedValue({
      success: true,
      patients: mockPatients,
    });

    render(<PatientList organizationId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText('P001')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByTitle('詳細表示');
    fireEvent.click(viewButtons[0]);

    expect(screen.getByText('P001')).toBeInTheDocument();
  });

  test('opens edit form when edit button is clicked', async () => {
    mockPatientService.getPatientsByOrganization.mockResolvedValue({
      success: true,
      patients: mockPatients,
    });

    render(<PatientList organizationId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText('P001')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('編集');
    fireEvent.click(editButtons[0]);

    expect(screen.getByText('患者情報編集: P001')).toBeInTheDocument();
  });

  test('shows delete button only for inactive patients', async () => {
    mockPatientService.getPatientsByOrganization.mockResolvedValue({
      success: true,
      patients: mockPatients,
    });

    render(<PatientList organizationId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText('P001')).toBeInTheDocument();
    });

    // Active patient should not have delete button
    const activePatientCard = screen.getByText('P001').closest('.MuiCard-root');
    expect(activePatientCard?.querySelector('[title="削除"]')).not.toBeInTheDocument();

    // Inactive patient should have delete button
    const inactivePatientCard = screen.getByText('P002').closest('.MuiCard-root');
    expect(inactivePatientCard?.querySelector('[title="削除"]')).toBeInTheDocument();
  });

  test('opens delete confirmation dialog', async () => {
    mockPatientService.getPatientsByOrganization.mockResolvedValue({
      success: true,
      patients: mockPatients,
    });

    render(<PatientList organizationId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText('P002')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('削除');
    fireEvent.click(deleteButton);

    expect(screen.getByText('削除確認')).toBeInTheDocument();
    expect(screen.getByText(/患者「P002」を削除しますか？/)).toBeInTheDocument();
  });

  test('deletes patient when confirmed', async () => {
    mockPatientService.getPatientsByOrganization.mockResolvedValue({
      success: true,
      patients: mockPatients,
    });
    mockPatientService.deletePatient.mockResolvedValue({
      success: true,
      message: 'Patient deleted successfully',
    });

    render(<PatientList organizationId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText('P002')).toBeInTheDocument();
    });

    // Open delete dialog
    const deleteButton = screen.getByTitle('削除');
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmDeleteButton = screen.getByRole('button', { name: '削除' });
    fireEvent.click(confirmDeleteButton);

    await waitFor(() => {
      expect(mockPatientService.deletePatient).toHaveBeenCalledWith('patient-2');
    });
  });

  test('opens status change dialog', async () => {
    mockPatientService.getPatientsByOrganization.mockResolvedValue({
      success: true,
      patients: mockPatients,
    });

    render(<PatientList organizationId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText('P001')).toBeInTheDocument();
    });

    const changeStatusButtons = screen.getAllByText('ステータス変更');
    fireEvent.click(changeStatusButtons[0]);

    expect(screen.getByText('ステータス変更')).toBeInTheDocument();
    expect(screen.getByLabelText('新しいステータス')).toBeInTheDocument();
  });

  test('updates patient status when confirmed', async () => {
    mockPatientService.getPatientsByOrganization.mockResolvedValue({
      success: true,
      patients: mockPatients,
    });
    mockPatientService.updatePatientStatus.mockResolvedValue({
      success: true,
      patient: { ...mockPatients[0], status: 'inactive' },
    });

    render(<PatientList organizationId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText('P001')).toBeInTheDocument();
    });

    // Open status change dialog
    const changeStatusButtons = screen.getAllByText('ステータス変更');
    fireEvent.click(changeStatusButtons[0]);

    // Select new status
    const statusSelect = screen.getByLabelText('新しいステータス');
    fireEvent.click(statusSelect);
    fireEvent.click(screen.getByRole('option', { name: '無効' }));

    // Confirm change
    const confirmButton = screen.getByRole('button', { name: '変更' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockPatientService.updatePatientStatus).toHaveBeenCalledWith('patient-1', 'inactive');
    });
  });

  test('displays patient information correctly', async () => {
    mockPatientService.getPatientsByOrganization.mockResolvedValue({
      success: true,
      patients: mockPatients,
    });

    render(<PatientList organizationId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText('P001')).toBeInTheDocument();
      expect(screen.getByText('1980年1月1日')).toBeInTheDocument();
      expect(screen.getByText('男性')).toBeInTheDocument();
      expect(screen.getByText('有効')).toBeInTheDocument();
    });
  });

  test('displays medical information', async () => {
    mockPatientService.getPatientsByOrganization.mockResolvedValue({
      success: true,
      patients: mockPatients,
    });

    render(<PatientList organizationId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Medication A')).toBeInTheDocument();
      expect(screen.getByText('Allergy A')).toBeInTheDocument();
    });
  });

  test('handles loading state', () => {
    mockPatientService.getPatientsByOrganization.mockReturnValue(new Promise(() => {})); // Never resolves

    render(<PatientList organizationId="org-1" />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('handles error state', async () => {
    const errorMessage = 'Failed to load patients';
    mockPatientService.getPatientsByOrganization.mockRejectedValue(new Error(errorMessage));

    render(<PatientList organizationId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('shows no patients message when list is empty', async () => {
    mockPatientService.getPatientsByOrganization.mockResolvedValue({
      success: true,
      patients: [],
    });

    render(<PatientList organizationId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText('患者がいません')).toBeInTheDocument();
    });
  });

  test('shows assign button when onAssignToSurvey is provided', async () => {
    const mockOnAssignToSurvey = jest.fn();
    mockPatientService.getPatientsByOrganization.mockResolvedValue({
      success: true,
      patients: mockPatients,
    });

    render(<PatientList organizationId="org-1" onAssignToSurvey={mockOnAssignToSurvey} />);

    await waitFor(() => {
      expect(screen.getByText('試験割当')).toBeInTheDocument();
    });

    const assignButton = screen.getByText('試験割当');
    fireEvent.click(assignButton);

    expect(mockOnAssignToSurvey).toHaveBeenCalledWith(mockPatients[0]);
  });

  test('respects user permissions for org admin', async () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, role: 'org_admin' },
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
    });

    mockPatientService.getPatientsByOrganization.mockResolvedValue({
      success: true,
      patients: mockPatients,
    });

    render(<PatientList organizationId="org-1" />);

    // Organization admin should still see create button (role !== 'viewer')
    await waitFor(() => {
      expect(screen.getByText('新規患者登録')).toBeInTheDocument();
    });
  });

  test('displays enrollment status', async () => {
    mockPatientService.getPatientsByOrganization.mockResolvedValue({
      success: true,
      patients: mockPatients,
    });

    render(<PatientList organizationId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText('参加試験: 1件')).toBeInTheDocument();
      expect(screen.getByText('アサイン済み調査: 1件')).toBeInTheDocument();
    });
  });
});