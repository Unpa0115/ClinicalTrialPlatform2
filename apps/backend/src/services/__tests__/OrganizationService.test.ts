import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OrganizationService } from '../OrganizationService.js';
import { OrganizationRepository } from '../../repositories/OrganizationRepository.js';
import { OrganizationRecord } from '@clinical-trial/shared';

// Mock dependencies
vi.mock('../../repositories/index.js', () => ({
  RepositoryFactory: {
    getInstance: () => ({
      getOrganizationRepository: () => mockOrganizationRepository
    })
  }
}));

// Mock implementations
const mockOrganizationRepository = {
  createOrganization: vi.fn(),
  findById: vi.fn(),
  findByCode: vi.fn(),
  update: vi.fn(),
  findByStatus: vi.fn(),
  findActiveOrganizations: vi.fn(),
  updateCapacity: vi.fn(),
  addActiveStudy: vi.fn(),
  removeActiveStudy: vi.fn(),
  updateEquipment: vi.fn(),
  updateCertifications: vi.fn(),
} as unknown as OrganizationRepository;

// Test data
const mockOrganization: OrganizationRecord = {
  organizationId: 'org-test-123',
  organizationName: 'Test Hospital',
  organizationCode: 'TEST001',
  organizationType: 'hospital',
  address: {
    country: 'Japan',
    prefecture: 'Tokyo',
    city: 'Shibuya',
    addressLine1: '1-1-1 Test Street',
    addressLine2: 'Test Building 5F',
    postalCode: '150-0001',
  },
  phoneNumber: '03-1234-5678',
  email: 'contact@test-hospital.jp',
  website: 'https://test-hospital.jp',
  principalInvestigator: 'Dr. Test Investigator',
  studyCoordinator: 'Test Coordinator',
  contactPerson: 'Test Contact',
  maxPatientCapacity: 100,
  availableEquipment: ['OCT', 'Slit Lamp', 'Tonometer'],
  certifications: ['ISO 9001', 'GCP Certified'],
  status: 'active',
  approvalDate: '2024-01-01T00:00:00Z',
  activeStudies: ['study-test-123'],
  createdBy: 'user-admin-123',
  lastModifiedBy: 'user-admin-123',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  entityType: 'organization',
};

describe('OrganizationService', () => {
  let organizationService: OrganizationService;

  beforeEach(() => {
    organizationService = new OrganizationService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrganization', () => {
    it('should successfully create an organization with valid data', async () => {
      // Arrange
      const createRequest = {
        organizationName: 'Test Hospital',
        organizationCode: 'TEST001',
        organizationType: 'hospital' as const,
        address: {
          country: 'Japan',
          prefecture: 'Tokyo',
          city: 'Shibuya',
          addressLine1: '1-1-1 Test Street',
          addressLine2: 'Test Building 5F',
          postalCode: '150-0001',
        },
        phoneNumber: '03-1234-5678',
        email: 'contact@test-hospital.jp',
        website: 'https://test-hospital.jp',
        principalInvestigator: 'Dr. Test Investigator',
        studyCoordinator: 'Test Coordinator',
        contactPerson: 'Test Contact',
        maxPatientCapacity: 100,
        availableEquipment: ['OCT', 'Slit Lamp', 'Tonometer'],
        certifications: ['ISO 9001', 'GCP Certified'],
      };

      vi.mocked(mockOrganizationRepository.findByCode).mockResolvedValue(null);
      vi.mocked(mockOrganizationRepository.createOrganization).mockResolvedValue(mockOrganization);

      // Act
      const result = await organizationService.createOrganization(createRequest, 'user-admin-123');

      // Assert
      expect(result).toEqual(mockOrganization);
      expect(mockOrganizationRepository.findByCode).toHaveBeenCalledWith('TEST001');
      expect(mockOrganizationRepository.createOrganization).toHaveBeenCalledWith({
        ...createRequest,
        status: 'pending_approval',
        activeStudies: [],
        createdBy: 'user-admin-123',
        lastModifiedBy: 'user-admin-123',
      });
    });

    it('should throw error for duplicate organization code', async () => {
      // Arrange
      const createRequest = {
        organizationName: 'Test Hospital',
        organizationCode: 'TEST001',
        organizationType: 'hospital' as const,
        address: {
          country: 'Japan',
          prefecture: 'Tokyo',
          city: 'Shibuya',
          addressLine1: '1-1-1 Test Street',
          postalCode: '150-0001',
        },
        phoneNumber: '03-1234-5678',
        email: 'contact@test-hospital.jp',
        principalInvestigator: 'Dr. Test Investigator',
        studyCoordinator: 'Test Coordinator',
        contactPerson: 'Test Contact',
        maxPatientCapacity: 100,
        availableEquipment: [],
        certifications: [],
      };

      vi.mocked(mockOrganizationRepository.findByCode).mockResolvedValue(mockOrganization);

      // Act & Assert
      await expect(organizationService.createOrganization(createRequest, 'user-admin-123'))
        .rejects.toThrow('Failed to create organization: Organization with code TEST001 already exists');

      expect(mockOrganizationRepository.findByCode).toHaveBeenCalledWith('TEST001');
      expect(mockOrganizationRepository.createOrganization).not.toHaveBeenCalled();
    });

    it('should throw error for invalid email format', async () => {
      // Arrange
      const createRequest = {
        organizationName: 'Test Hospital',
        organizationCode: 'TEST001',
        organizationType: 'hospital' as const,
        address: {
          country: 'Japan',
          prefecture: 'Tokyo',
          city: 'Shibuya',
          addressLine1: '1-1-1 Test Street',
          postalCode: '150-0001',
        },
        phoneNumber: '03-1234-5678',
        email: 'invalid-email', // Invalid email format
        principalInvestigator: 'Dr. Test Investigator',
        studyCoordinator: 'Test Coordinator',
        contactPerson: 'Test Contact',
        maxPatientCapacity: 100,
        availableEquipment: [],
        certifications: [],
      };

      vi.mocked(mockOrganizationRepository.findByCode).mockResolvedValue(null);

      // Act & Assert
      await expect(organizationService.createOrganization(createRequest, 'user-admin-123'))
        .rejects.toThrow('Failed to create organization: Invalid email format');
    });

    it('should throw error for invalid phone number (too short)', async () => {
      // Arrange
      const createRequest = {
        organizationName: 'Test Hospital',
        organizationCode: 'TEST001',
        organizationType: 'hospital' as const,
        address: {
          country: 'Japan',
          prefecture: 'Tokyo',
          city: 'Shibuya',
          addressLine1: '1-1-1 Test Street',
          postalCode: '150-0001',
        },
        phoneNumber: '123', // Too short
        email: 'contact@test-hospital.jp',
        principalInvestigator: 'Dr. Test Investigator',
        studyCoordinator: 'Test Coordinator',
        contactPerson: 'Test Contact',
        maxPatientCapacity: 100,
        availableEquipment: [],
        certifications: [],
      };

      vi.mocked(mockOrganizationRepository.findByCode).mockResolvedValue(null);

      // Act & Assert
      await expect(organizationService.createOrganization(createRequest, 'user-admin-123'))
        .rejects.toThrow('Failed to create organization: Phone number must have at least 10 digits');
    });
  });

  describe('getOrganizationById', () => {
    it('should return organization when found', async () => {
      // Arrange
      vi.mocked(mockOrganizationRepository.findById).mockResolvedValue(mockOrganization);

      // Act
      const result = await organizationService.getOrganizationById('org-test-123');

      // Assert
      expect(result).toEqual(mockOrganization);
      expect(mockOrganizationRepository.findById).toHaveBeenCalledWith('org-test-123');
    });

    it('should return null when organization not found', async () => {
      // Arrange
      vi.mocked(mockOrganizationRepository.findById).mockResolvedValue(null);

      // Act
      const result = await organizationService.getOrganizationById('nonexistent-org');

      // Assert
      expect(result).toBeNull();
      expect(mockOrganizationRepository.findById).toHaveBeenCalledWith('nonexistent-org');
    });
  });

  describe('getOrganizationByCode', () => {
    it('should return organization when found by code', async () => {
      // Arrange
      vi.mocked(mockOrganizationRepository.findByCode).mockResolvedValue(mockOrganization);

      // Act
      const result = await organizationService.getOrganizationByCode('TEST001');

      // Assert
      expect(result).toEqual(mockOrganization);
      expect(mockOrganizationRepository.findByCode).toHaveBeenCalledWith('TEST001');
    });

    it('should return null when organization not found by code', async () => {
      // Arrange
      vi.mocked(mockOrganizationRepository.findByCode).mockResolvedValue(null);

      // Act
      const result = await organizationService.getOrganizationByCode('NONEXISTENT');

      // Assert
      expect(result).toBeNull();
      expect(mockOrganizationRepository.findByCode).toHaveBeenCalledWith('NONEXISTENT');
    });
  });

  describe('updateOrganization', () => {
    it('should successfully update organization', async () => {
      // Arrange
      const updateRequest = {
        organizationName: 'Updated Hospital Name',
        email: 'updated@test-hospital.jp',
        maxPatientCapacity: 150,
      };

      const updatedOrganization = { ...mockOrganization, ...updateRequest };
      vi.mocked(mockOrganizationRepository.update).mockResolvedValue(updatedOrganization);

      // Act
      const result = await organizationService.updateOrganization('org-test-123', updateRequest, 'user-admin-123');

      // Assert
      expect(result).toEqual(updatedOrganization);
      expect(mockOrganizationRepository.update).toHaveBeenCalledWith('org-test-123', {
        ...updateRequest,
        lastModifiedBy: 'user-admin-123',
      });
    });

    it('should validate email format when updating', async () => {
      // Arrange
      const updateRequest = {
        email: 'invalid-email', // Invalid email format
      };

      // Act & Assert
      await expect(organizationService.updateOrganization('org-test-123', updateRequest, 'user-admin-123'))
        .rejects.toThrow('Failed to update organization: Invalid email format');
    });
  });

  describe('getOrganizationsByStatus', () => {
    it('should return organizations filtered by status', async () => {
      // Arrange
      const activeOrganizations = [mockOrganization];
      vi.mocked(mockOrganizationRepository.findByStatus).mockResolvedValue(activeOrganizations);

      // Act
      const result = await organizationService.getOrganizationsByStatus('active');

      // Assert
      expect(result).toEqual(activeOrganizations);
      expect(mockOrganizationRepository.findByStatus).toHaveBeenCalledWith('active');
    });
  });

  describe('getActiveOrganizations', () => {
    it('should return active organizations', async () => {
      // Arrange
      const activeOrganizations = [mockOrganization];
      vi.mocked(mockOrganizationRepository.findActiveOrganizations).mockResolvedValue(activeOrganizations);

      // Act
      const result = await organizationService.getActiveOrganizations();

      // Assert
      expect(result).toEqual(activeOrganizations);
      expect(mockOrganizationRepository.findActiveOrganizations).toHaveBeenCalled();
    });
  });

  describe('updateOrganizationStatus', () => {
    it('should update organization status to active with approval date', async () => {
      // Arrange
      const updatedOrganization = { ...mockOrganization, status: 'active' as const };
      vi.mocked(mockOrganizationRepository.update).mockResolvedValue(updatedOrganization);

      // Act
      const result = await organizationService.updateOrganizationStatus('org-test-123', 'active', 'user-admin-123');

      // Assert
      expect(result).toEqual(updatedOrganization);
      expect(mockOrganizationRepository.update).toHaveBeenCalledWith('org-test-123', {
        status: 'active',
        lastModifiedBy: 'user-admin-123',
        approvalDate: expect.any(String),
      });
    });

    it('should update organization status to inactive without approval date', async () => {
      // Arrange
      const updatedOrganization = { ...mockOrganization, status: 'inactive' as const };
      vi.mocked(mockOrganizationRepository.update).mockResolvedValue(updatedOrganization);

      // Act
      const result = await organizationService.updateOrganizationStatus('org-test-123', 'inactive', 'user-admin-123');

      // Assert
      expect(result).toEqual(updatedOrganization);
      expect(mockOrganizationRepository.update).toHaveBeenCalledWith('org-test-123', {
        status: 'inactive',
        lastModifiedBy: 'user-admin-123',
      });
    });
  });

  describe('updateOrganizationCapacity', () => {
    it('should update organization capacity', async () => {
      // Arrange
      const updatedOrganization = { ...mockOrganization, maxPatientCapacity: 200 };
      vi.mocked(mockOrganizationRepository.updateCapacity).mockResolvedValue(updatedOrganization);

      // Act
      const result = await organizationService.updateOrganizationCapacity('org-test-123', 200);

      // Assert
      expect(result).toEqual(updatedOrganization);
      expect(mockOrganizationRepository.updateCapacity).toHaveBeenCalledWith('org-test-123', 200);
    });

    it('should throw error for negative capacity', async () => {
      // Act & Assert
      await expect(organizationService.updateOrganizationCapacity('org-test-123', -10))
        .rejects.toThrow('Failed to update organization capacity: Patient capacity cannot be negative');
    });
  });

  describe('addStudyToOrganization', () => {
    it('should add study to organization', async () => {
      // Arrange
      const updatedOrganization = {
        ...mockOrganization,
        activeStudies: [...mockOrganization.activeStudies, 'study-new-123'],
      };
      vi.mocked(mockOrganizationRepository.addActiveStudy).mockResolvedValue(updatedOrganization);

      // Act
      const result = await organizationService.addStudyToOrganization('org-test-123', 'study-new-123');

      // Assert
      expect(result).toEqual(updatedOrganization);
      expect(mockOrganizationRepository.addActiveStudy).toHaveBeenCalledWith('org-test-123', 'study-new-123');
    });
  });

  describe('removeStudyFromOrganization', () => {
    it('should remove study from organization', async () => {
      // Arrange
      const updatedOrganization = {
        ...mockOrganization,
        activeStudies: [],
      };
      vi.mocked(mockOrganizationRepository.removeActiveStudy).mockResolvedValue(updatedOrganization);

      // Act
      const result = await organizationService.removeStudyFromOrganization('org-test-123', 'study-test-123');

      // Assert
      expect(result).toEqual(updatedOrganization);
      expect(mockOrganizationRepository.removeActiveStudy).toHaveBeenCalledWith('org-test-123', 'study-test-123');
    });
  });

  describe('updateOrganizationEquipment', () => {
    it('should update organization equipment', async () => {
      // Arrange
      const newEquipment = ['OCT', 'Slit Lamp', 'Tonometer', 'Fundus Camera'];
      const updatedOrganization = { ...mockOrganization, availableEquipment: newEquipment };
      vi.mocked(mockOrganizationRepository.updateEquipment).mockResolvedValue(updatedOrganization);

      // Act
      const result = await organizationService.updateOrganizationEquipment('org-test-123', newEquipment);

      // Assert
      expect(result).toEqual(updatedOrganization);
      expect(mockOrganizationRepository.updateEquipment).toHaveBeenCalledWith('org-test-123', newEquipment);
    });
  });

  describe('updateOrganizationCertifications', () => {
    it('should update organization certifications', async () => {
      // Arrange
      const newCertifications = ['ISO 9001', 'GCP Certified', 'ISO 14155'];
      const updatedOrganization = { ...mockOrganization, certifications: newCertifications };
      vi.mocked(mockOrganizationRepository.updateCertifications).mockResolvedValue(updatedOrganization);

      // Act
      const result = await organizationService.updateOrganizationCertifications('org-test-123', newCertifications);

      // Assert
      expect(result).toEqual(updatedOrganization);
      expect(mockOrganizationRepository.updateCertifications).toHaveBeenCalledWith('org-test-123', newCertifications);
    });
  });

  describe('getOrganizationStatistics', () => {
    it('should return organization statistics', async () => {
      // Arrange
      vi.mocked(mockOrganizationRepository.findById).mockResolvedValue(mockOrganization);

      // Act
      const result = await organizationService.getOrganizationStatistics('org-test-123');

      // Assert
      expect(result).toEqual({
        totalActiveStudies: 1,
        maxPatientCapacity: 100,
        availableEquipmentCount: 3,
        certificationsCount: 2,
        status: 'active',
      });
      expect(mockOrganizationRepository.findById).toHaveBeenCalledWith('org-test-123');
    });

    it('should throw error for non-existent organization', async () => {
      // Arrange
      vi.mocked(mockOrganizationRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(organizationService.getOrganizationStatistics('nonexistent-org'))
        .rejects.toThrow('Failed to get organization statistics: Organization not found');
    });
  });

  describe('validation methods', () => {
    it('should validate valid email addresses', async () => {
      // Arrange
      const createRequest = {
        organizationName: 'Test Hospital',
        organizationCode: 'TEST001',
        organizationType: 'hospital' as const,
        address: {
          country: 'Japan',
          prefecture: 'Tokyo',
          city: 'Shibuya',
          addressLine1: '1-1-1 Test Street',
          postalCode: '150-0001',
        },
        phoneNumber: '03-1234-5678',
        email: 'valid.email+test@example.com', // Valid email with special characters
        principalInvestigator: 'Dr. Test Investigator',
        studyCoordinator: 'Test Coordinator',
        contactPerson: 'Test Contact',
        maxPatientCapacity: 100,
        availableEquipment: [],
        certifications: [],
      };

      vi.mocked(mockOrganizationRepository.findByCode).mockResolvedValue(null);
      vi.mocked(mockOrganizationRepository.createOrganization).mockResolvedValue(mockOrganization);

      // Act & Assert - should not throw error
      await expect(organizationService.createOrganization(createRequest, 'user-admin-123'))
        .resolves.toBeDefined();
    });

    it('should validate phone numbers with various formats', async () => {
      // Arrange
      const createRequest = {
        organizationName: 'Test Hospital',
        organizationCode: 'TEST001',
        organizationType: 'hospital' as const,
        address: {
          country: 'Japan',
          prefecture: 'Tokyo',
          city: 'Shibuya',
          addressLine1: '1-1-1 Test Street',
          postalCode: '150-0001',
        },
        phoneNumber: '+81-3-1234-5678', // Valid phone with country code and formatting
        email: 'contact@test-hospital.jp',
        principalInvestigator: 'Dr. Test Investigator',
        studyCoordinator: 'Test Coordinator',
        contactPerson: 'Test Contact',
        maxPatientCapacity: 100,
        availableEquipment: [],
        certifications: [],
      };

      vi.mocked(mockOrganizationRepository.findByCode).mockResolvedValue(null);
      vi.mocked(mockOrganizationRepository.createOrganization).mockResolvedValue(mockOrganization);

      // Act & Assert - should not throw error
      await expect(organizationService.createOrganization(createRequest, 'user-admin-123'))
        .resolves.toBeDefined();
    });

    it('should throw error for phone number that is too long', async () => {
      // Arrange
      const createRequest = {
        organizationName: 'Test Hospital',
        organizationCode: 'TEST001',
        organizationType: 'hospital' as const,
        address: {
          country: 'Japan',
          prefecture: 'Tokyo',
          city: 'Shibuya',
          addressLine1: '1-1-1 Test Street',
          postalCode: '150-0001',
        },
        phoneNumber: '12345678901234567890', // Too long (20 digits)
        email: 'contact@test-hospital.jp',
        principalInvestigator: 'Dr. Test Investigator',
        studyCoordinator: 'Test Coordinator',
        contactPerson: 'Test Contact',
        maxPatientCapacity: 100,
        availableEquipment: [],
        certifications: [],
      };

      vi.mocked(mockOrganizationRepository.findByCode).mockResolvedValue(null);

      // Act & Assert
      await expect(organizationService.createOrganization(createRequest, 'user-admin-123'))
        .rejects.toThrow('Failed to create organization: Phone number cannot exceed 15 digits');
    });
  });
});