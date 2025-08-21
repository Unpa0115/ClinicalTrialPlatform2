import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import OrganizationList from '../OrganizationList';
import { organizationService } from '../../../services/OrganizationService';
import { useAuth } from '../../../contexts/AuthContext';
import { OrganizationRecord } from '@clinical-trial/shared';

// Mock the services and contexts
jest.mock('../../../services/OrganizationService');
jest.mock('../../../contexts/AuthContext');

const mockOrganizationService = organizationService as jest.Mocked<typeof organizationService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock organization data
const mockOrganizations: OrganizationRecord[] = [
  {
    organizationId: 'org-1',
    organizationName: 'Test Hospital',
    organizationCode: 'TH001',
    organizationType: 'hospital',
    address: {
      country: 'Japan',
      prefecture: 'Tokyo',
      city: 'Shibuya',
      addressLine1: '1-1-1 Shibuya',
      postalCode: '150-0002',
    },
    phoneNumber: '03-1234-5678',
    email: 'contact@testhospital.com',
    principalInvestigator: 'Dr. Yamada',
    studyCoordinator: 'Nurse Sato',
    contactPerson: 'Manager Tanaka',
    maxPatientCapacity: 100,
    availableEquipment: ['OCT', 'Slit Lamp'],
    certifications: ['GCP', 'ISO'],
    status: 'active',
    activeStudies: ['study-1'],
    createdBy: 'user-1',
    lastModifiedBy: 'user-1',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    entityType: 'organization',
  },
  {
    organizationId: 'org-2',
    organizationName: 'Test Clinic',
    organizationCode: 'TC001',
    organizationType: 'clinic',
    address: {
      country: 'Japan',
      prefecture: 'Osaka',
      city: 'Namba',
      addressLine1: '2-2-2 Namba',
      postalCode: '542-0076',
    },
    phoneNumber: '06-1234-5678',
    email: 'info@testclinic.com',
    principalInvestigator: 'Dr. Suzuki',
    studyCoordinator: 'Nurse Kimura',
    contactPerson: 'Manager Watanabe',
    maxPatientCapacity: 50,
    availableEquipment: ['Fundus Camera'],
    certifications: ['GCP'],
    status: 'pending',
    activeStudies: [],
    createdBy: 'user-1',
    lastModifiedBy: 'user-1',
    createdAt: '2023-01-02T00:00:00.000Z',
    updatedAt: '2023-01-02T00:00:00.000Z',
    entityType: 'organization',
  },
];

const mockUser = {
  userId: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'super_admin' as const,
  organizationId: 'org-1',
};

describe('OrganizationList', () => {
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

  test('renders organization list with organizations', async () => {
    mockOrganizationService.getOrganizations.mockResolvedValue({
      success: true,
      organizations: mockOrganizations,
    });

    render(<OrganizationList />);

    expect(screen.getByText('Organization Management')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
      expect(screen.getByText('Test Clinic')).toBeInTheDocument();
    });
  });

  test('shows create button for authorized users', async () => {
    mockOrganizationService.getOrganizations.mockResolvedValue({
      success: true,
      organizations: mockOrganizations,
    });

    render(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByText('Create New Organization')).toBeInTheDocument();
    });
  });

  test('filters organizations by search term', async () => {
    mockOrganizationService.getOrganizations.mockResolvedValue({
      success: true,
      organizations: mockOrganizations,
    });

    render(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
      expect(screen.getByText('Test Clinic')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search by organization name');
    fireEvent.change(searchInput, { target: { value: 'Hospital' } });

    expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    expect(screen.queryByText('Test Clinic')).not.toBeInTheDocument();
  });

  test('filters organizations by status', async () => {
    mockOrganizationService.getOrganizations.mockResolvedValue({
      success: true,
      organizations: mockOrganizations,
    });

    render(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
      expect(screen.getByText('Test Clinic')).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText('Status');
    fireEvent.click(statusSelect);
    fireEvent.click(screen.getByText('Active'));

    await waitFor(() => {
      expect(mockOrganizationService.getOrganizations).toHaveBeenCalledWith({
        status: 'active',
      });
    });
  });

  test('opens detail dialog when view button is clicked', async () => {
    mockOrganizationService.getOrganizations.mockResolvedValue({
      success: true,
      organizations: mockOrganizations,
    });

    render(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByTitle('View Details');
    fireEvent.click(viewButtons[0]);

    expect(screen.getByText('Test Hospital')).toBeInTheDocument();
  });

  test('opens edit form when edit button is clicked', async () => {
    mockOrganizationService.getOrganizations.mockResolvedValue({
      success: true,
      organizations: mockOrganizations,
    });

    render(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Edit');
    fireEvent.click(editButtons[0]);

    expect(screen.getByText('Edit Organization: Test Hospital')).toBeInTheDocument();
  });

  test('shows delete button only for eligible organizations', async () => {
    mockOrganizationService.getOrganizations.mockResolvedValue({
      success: true,
      organizations: mockOrganizations,
    });

    render(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    });

    // Active organization with studies should not have delete button
    const hospitalCard = screen.getByText('Test Hospital').closest('.MuiCard-root');
    expect(hospitalCard?.querySelector('[title="Delete"]')).not.toBeInTheDocument();

    // Pending organization without studies should have delete button
    const clinicCard = screen.getByText('Test Clinic').closest('.MuiCard-root');
    expect(clinicCard?.querySelector('[title="Delete"]')).toBeInTheDocument();
  });

  test('opens delete confirmation dialog', async () => {
    mockOrganizationService.getOrganizations.mockResolvedValue({
      success: true,
      organizations: mockOrganizations,
    });

    render(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByText('Test Clinic')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete the organization "Test Clinic"/)).toBeInTheDocument();
  });

  test('deletes organization when confirmed', async () => {
    mockOrganizationService.getOrganizations.mockResolvedValue({
      success: true,
      organizations: mockOrganizations,
    });
    mockOrganizationService.deleteOrganization.mockResolvedValue({
      success: true,
      message: 'Organization deleted successfully',
    });

    render(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByText('Test Clinic')).toBeInTheDocument();
    });

    // Open delete dialog
    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmDeleteButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmDeleteButton);

    await waitFor(() => {
      expect(mockOrganizationService.deleteOrganization).toHaveBeenCalledWith('org-2');
    });
  });

  test('opens status change dialog', async () => {
    mockOrganizationService.getOrganizations.mockResolvedValue({
      success: true,
      organizations: mockOrganizations,
    });

    render(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    });

    const changeStatusButtons = screen.getAllByText('Change Status');
    fireEvent.click(changeStatusButtons[0]);

    expect(screen.getByText('Change Status')).toBeInTheDocument();
    expect(screen.getByLabelText('New Status')).toBeInTheDocument();
  });

  test('updates organization status when confirmed', async () => {
    mockOrganizationService.getOrganizations.mockResolvedValue({
      success: true,
      organizations: mockOrganizations,
    });
    mockOrganizationService.updateOrganizationStatus.mockResolvedValue({
      success: true,
      organization: { ...mockOrganizations[0], status: 'inactive' },
    });

    render(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    });

    // Open status change dialog
    const changeStatusButtons = screen.getAllByText('Change Status');
    fireEvent.click(changeStatusButtons[0]);

    // Select new status
    const statusSelect = screen.getByLabelText('New Status');
    fireEvent.click(statusSelect);
    fireEvent.click(screen.getByRole('option', { name: 'Inactive' }));

    // Confirm change
    const confirmButton = screen.getByRole('button', { name: 'Change' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOrganizationService.updateOrganizationStatus).toHaveBeenCalledWith('org-1', 'inactive');
    });
  });

  test('displays organization information correctly', async () => {
    mockOrganizationService.getOrganizations.mockResolvedValue({
      success: true,
      organizations: mockOrganizations,
    });

    render(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
      expect(screen.getByText('コード: TH001')).toBeInTheDocument();
      expect(screen.getByText('Hospital')).toBeInTheDocument();
      expect(screen.getByText('最大患者数: 100')).toBeInTheDocument();
      expect(screen.getByText('主任研究者: Dr. Yamada')).toBeInTheDocument();
      expect(screen.getByText('研究コーディネーター: Nurse Sato')).toBeInTheDocument();
      expect(screen.getByText('所在地: Tokyo Shibuya')).toBeInTheDocument();
    });
  });

  test('displays available equipment', async () => {
    mockOrganizationService.getOrganizations.mockResolvedValue({
      success: true,
      organizations: mockOrganizations,
    });

    render(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByText('OCT')).toBeInTheDocument();
      expect(screen.getByText('Slit Lamp')).toBeInTheDocument();
    });
  });

  test('handles loading state', () => {
    mockOrganizationService.getOrganizations.mockReturnValue(new Promise(() => {})); // Never resolves

    render(<OrganizationList />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('handles error state', async () => {
    const errorMessage = 'Failed to load organizations';
    mockOrganizationService.getOrganizations.mockRejectedValue(new Error(errorMessage));

    render(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('shows no organizations message when list is empty', async () => {
    mockOrganizationService.getOrganizations.mockResolvedValue({
      success: true,
      organizations: [],
    });

    render(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByText('No organizations found')).toBeInTheDocument();
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

    mockOrganizationService.getOrganizations.mockResolvedValue({
      success: true,
      organizations: mockOrganizations,
    });

    render(<OrganizationList />);

    // Organization admin should not see create button
    await waitFor(() => {
      expect(screen.queryByText('Create New Organization')).not.toBeInTheDocument();
    });
  });

  test('shows equipment count when more than 3', async () => {
    const orgWithManyEquipment = {
      ...mockOrganizations[0],
      availableEquipment: ['OCT', 'Slit Lamp', 'Fundus Camera', 'Autorefractor', 'Tonometer'],
    };

    mockOrganizationService.getOrganizations.mockResolvedValue({
      success: true,
      organizations: [orgWithManyEquipment],
    });

    render(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByText('+2')).toBeInTheDocument(); // Shows +2 for remaining equipment
    });
  });
});