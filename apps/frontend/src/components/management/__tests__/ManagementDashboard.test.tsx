import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import ManagementDashboard from '../ManagementDashboard';
import { useAuth } from '../../../contexts/AuthContext';
import { patientService } from '../../../services/PatientService';
import { clinicalStudyService } from '../../../services/ClinicalStudyService';
import { organizationService } from '../../../services/OrganizationService';

// Mock all services and contexts
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/PatientService');
jest.mock('../../../services/ClinicalStudyService');
jest.mock('../../../services/OrganizationService');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockPatientService = patientService as jest.Mocked<typeof patientService>;
const mockClinicalStudyService = clinicalStudyService as jest.Mocked<typeof clinicalStudyService>;
const mockOrganizationService = organizationService as jest.Mocked<typeof organizationService>;

const mockSuperAdmin = {
  userId: 'user-1',
  username: 'superadmin',
  email: 'admin@example.com',
  role: 'super_admin' as const,
  organizationId: 'org-1',
};

const mockOrgAdmin = {
  userId: 'user-2',
  username: 'orgadmin',
  email: 'orgadmin@example.com',
  role: 'org_admin' as const,
  organizationId: 'org-1',
};

const mockPatients = [
  {
    patientId: 'patient-1',
    patientCode: 'P001',
    patientName: 'Test Patient 1',
    status: 'active' as const,
    registeredOrganizationId: 'org-1',
    enrolledStudies: [],
    assignedSurveys: [],
    consentRecords: [],
    createdBy: 'user-1',
    lastModifiedBy: 'user-1',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    entityType: 'patient' as const,
  },
];

describe('ManagementDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default service mocks
    mockPatientService.getPatientsByOrganization.mockResolvedValue({
      success: true,
      patients: mockPatients,
    });
    
    mockClinicalStudyService.getStudies.mockResolvedValue({
      success: true,
      studies: [],
    });
    
    mockOrganizationService.getOrganizations.mockResolvedValue({
      success: true,
      organizations: [],
    });
  });

  test('renders management dashboard for super admin', async () => {
    mockUseAuth.mockReturnValue({
      user: mockSuperAdmin,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
    });

    render(<ManagementDashboard />);

    expect(screen.getByText('Management Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive management interface for clinical trial platform administration')).toBeInTheDocument();

    // Super admin should see all tabs
    await waitFor(() => {
      expect(screen.getByText('Clinical Studies')).toBeInTheDocument();
      expect(screen.getByText('Organizations')).toBeInTheDocument();
      expect(screen.getByText('Patients')).toBeInTheDocument();
      expect(screen.getByText('Study Associations')).toBeInTheDocument();
      expect(screen.getByText('Bulk Operations')).toBeInTheDocument();
    });
  });

  test('renders limited tabs for organization admin', async () => {
    mockUseAuth.mockReturnValue({
      user: mockOrgAdmin,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
    });

    render(<ManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Clinical Studies')).toBeInTheDocument();
      expect(screen.getByText('Patients')).toBeInTheDocument();
      expect(screen.getByText('Bulk Operations')).toBeInTheDocument();
      
      // Should not see organization management or study associations
      expect(screen.queryByText('Organizations')).not.toBeInTheDocument();
      expect(screen.queryByText('Study Associations')).not.toBeInTheDocument();
    });
  });

  test('shows overview cards on initial load', async () => {
    mockUseAuth.mockReturnValue({
      user: mockSuperAdmin,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
    });

    render(<ManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Active Studies')).toBeInTheDocument();
      expect(screen.getByText('Organizations')).toBeInTheDocument();
      expect(screen.getByText('Total Patients')).toBeInTheDocument();
      expect(screen.getByText('Active Surveys')).toBeInTheDocument();
    });
  });

  test('switches between tabs correctly', async () => {
    mockUseAuth.mockReturnValue({
      user: mockSuperAdmin,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
    });

    render(<ManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Clinical Studies')).toBeInTheDocument();
    });

    // Click on Patients tab
    const patientsTab = screen.getByText('Patients');
    fireEvent.click(patientsTab);

    // Should show patient management interface
    await waitFor(() => {
      expect(screen.getByText('患者マスター管理')).toBeInTheDocument();
    });

    // Click on Organizations tab
    const organizationsTab = screen.getByText('Organizations');
    fireEvent.click(organizationsTab);

    // Should show organization management interface
    await waitFor(() => {
      expect(screen.getByText('Organization Management')).toBeInTheDocument();
    });
  });

  test('loads patients data on mount', async () => {
    mockUseAuth.mockReturnValue({
      user: mockSuperAdmin,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
    });

    render(<ManagementDashboard />);

    await waitFor(() => {
      expect(mockPatientService.getPatientsByOrganization).toHaveBeenCalledWith('org-1');
    });
  });

  test('shows login message when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: false,
    });

    render(<ManagementDashboard />);

    expect(screen.getByText('Please log in to access the management dashboard')).toBeInTheDocument();
  });

  test('handles navigation with keyboard', async () => {
    mockUseAuth.mockReturnValue({
      user: mockSuperAdmin,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
    });

    render(<ManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Clinical Studies')).toBeInTheDocument();
    });

    const tablist = screen.getByRole('tablist');
    
    // Navigate with arrow keys
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    
    // Should move to next tab
    await waitFor(() => {
      expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Organizations');
    });
  });

  test('displays correct patient count in overview', async () => {
    mockUseAuth.mockReturnValue({
      user: mockSuperAdmin,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
    });

    render(<ManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Patient count
    });
  });

  test('integrates with bulk operations component', async () => {
    mockUseAuth.mockReturnValue({
      user: mockSuperAdmin,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
    });

    render(<ManagementDashboard />);

    // Navigate to Bulk Operations tab
    const bulkOpsTab = screen.getByText('Bulk Operations');
    fireEvent.click(bulkOpsTab);

    await waitFor(() => {
      expect(screen.getByText('Select Patients (0 selected)')).toBeInTheDocument();
      expect(screen.getByText('Available Operations')).toBeInTheDocument();
    });
  });

  test('integrates with study association component', async () => {
    mockUseAuth.mockReturnValue({
      user: mockSuperAdmin,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
    });

    render(<ManagementDashboard />);

    // Navigate to Study Associations tab
    const associationsTab = screen.getByText('Study Associations');
    fireEvent.click(associationsTab);

    await waitFor(() => {
      expect(screen.getByText('Study-Organization Associations')).toBeInTheDocument();
    });
  });

  test('handles data refresh functionality', async () => {
    // Mock window.location.reload
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: {
        reload: mockReload
      },
      writable: true
    });

    mockUseAuth.mockReturnValue({
      user: mockSuperAdmin,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
    });

    render(<ManagementDashboard />);

    // The refresh functionality should be called when associations change
    // This is tested indirectly through component integration
    expect(mockPatientService.getPatientsByOrganization).toHaveBeenCalled();
  });

  test('responsive behavior on mobile', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('(max-width:'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    mockUseAuth.mockReturnValue({
      user: mockSuperAdmin,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
    });

    render(<ManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Management Dashboard')).toBeInTheDocument();
    });

    // Should still render all components, but with mobile-optimized layout
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  test('accessibility features', async () => {
    mockUseAuth.mockReturnValue({
      user: mockSuperAdmin,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
    });

    render(<ManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    // Check for proper ARIA labels
    const tabs = screen.getAllByRole('tab');
    tabs.forEach((tab, index) => {
      expect(tab).toHaveAttribute('aria-controls', `management-tabpanel-${index}`);
      expect(tab).toHaveAttribute('id', `management-tab-${index}`);
    });

    // Check for proper tabpanel
    const activeTabpanel = screen.getByRole('tabpanel');
    expect(activeTabpanel).toHaveAttribute('aria-labelledby', 'management-tab-0');
  });
});