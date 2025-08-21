import { OrganizationRepository } from '../repositories/OrganizationRepository.js';
import { RepositoryFactory } from '../repositories/index.js';
import { OrganizationRecord } from '@clinical-trial/shared';

export interface CreateOrganizationRequest {
  organizationName: string;
  organizationCode: string;
  organizationType: OrganizationRecord['organizationType'];
  address: {
    country: string;
    prefecture: string;
    city: string;
    addressLine1: string;
    addressLine2?: string;
    postalCode: string;
  };
  phoneNumber: string;
  email: string;
  website?: string;
  principalInvestigator: string;
  studyCoordinator: string;
  contactPerson: string;
  maxPatientCapacity: number;
  availableEquipment: string[];
  certifications: string[];
}

export interface UpdateOrganizationRequest {
  organizationName?: string;
  organizationType?: OrganizationRecord['organizationType'];
  address?: {
    country: string;
    prefecture: string;
    city: string;
    addressLine1: string;
    addressLine2?: string;
    postalCode: string;
  };
  phoneNumber?: string;
  email?: string;
  website?: string;
  principalInvestigator?: string;
  studyCoordinator?: string;
  contactPerson?: string;
  maxPatientCapacity?: number;
  availableEquipment?: string[];
  certifications?: string[];
  status?: OrganizationRecord['status'];
  approvalDate?: string;
}

/**
 * Organization Service
 * Handles organization management and capabilities tracking
 */
export class OrganizationService {
  private organizationRepository: OrganizationRepository;

  constructor() {
    const repositoryFactory = RepositoryFactory.getInstance();
    this.organizationRepository = repositoryFactory.getOrganizationRepository();
  }

  /**
   * Create a new organization
   */
  async createOrganization(request: CreateOrganizationRequest, createdBy: string): Promise<OrganizationRecord> {
    try {
      // Check if organization code already exists
      const existingOrg = await this.organizationRepository.findByCode(request.organizationCode);
      if (existingOrg) {
        throw new Error(`Organization with code ${request.organizationCode} already exists`);
      }

      // Validate email format
      this.validateEmail(request.email);

      // Validate phone number format
      this.validatePhoneNumber(request.phoneNumber);

      const orgData: Omit<OrganizationRecord, 'organizationId' | 'createdAt' | 'updatedAt' | 'entityType'> = {
        ...request,
        status: 'pending_approval',
        activeStudies: [],
        createdBy,
        lastModifiedBy: createdBy,
      };

      return await this.organizationRepository.createOrganization(orgData);
    } catch (error) {
      console.error('Error creating organization:', error);
      throw new Error(`Failed to create organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(organizationId: string): Promise<OrganizationRecord | null> {
    try {
      return await this.organizationRepository.findById(organizationId);
    } catch (error) {
      console.error('Error getting organization:', error);
      throw new Error(`Failed to get organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get organization by code
   */
  async getOrganizationByCode(organizationCode: string): Promise<OrganizationRecord | null> {
    try {
      return await this.organizationRepository.findByCode(organizationCode);
    } catch (error) {
      console.error('Error getting organization by code:', error);
      throw new Error(`Failed to get organization by code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(organizationId: string, request: UpdateOrganizationRequest, updatedBy: string): Promise<OrganizationRecord> {
    try {
      // Validate email format if provided
      if (request.email) {
        this.validateEmail(request.email);
      }

      // Validate phone number format if provided
      if (request.phoneNumber) {
        this.validatePhoneNumber(request.phoneNumber);
      }

      const updateData = {
        ...request,
        lastModifiedBy: updatedBy,
      };

      return await this.organizationRepository.update(organizationId, updateData);
    } catch (error) {
      console.error('Error updating organization:', error);
      throw new Error(`Failed to update organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all organizations with optional status filter
   */
  async getOrganizations(params?: { status?: string }): Promise<OrganizationRecord[]> {
    try {
      console.log('=== ORGANIZATION SERVICE GET ===');
      console.log('Params:', params);
      
      if (params?.status) {
        console.log('Filtering by status:', params.status);
        return await this.organizationRepository.findByStatus(params.status as OrganizationRecord['status']);
      } else {
        console.log('Getting all organizations');
        return await this.organizationRepository.findAllOrganizations();
      }
    } catch (error) {
      console.error('Error getting organizations:', error);
      throw new Error(`Failed to get organizations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get organizations by status
   */
  async getOrganizationsByStatus(status: OrganizationRecord['status']): Promise<OrganizationRecord[]> {
    try {
      return await this.organizationRepository.findByStatus(status);
    } catch (error) {
      console.error('Error getting organizations by status:', error);
      throw new Error(`Failed to get organizations by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get active organizations
   */
  async getActiveOrganizations(): Promise<OrganizationRecord[]> {
    try {
      return await this.organizationRepository.findActiveOrganizations();
    } catch (error) {
      console.error('Error getting active organizations:', error);
      throw new Error(`Failed to get active organizations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update organization status
   */
  async updateOrganizationStatus(organizationId: string, status: OrganizationRecord['status'], updatedBy: string): Promise<OrganizationRecord> {
    try {
      const updateData: any = { 
        status,
        lastModifiedBy: updatedBy 
      };

      // Set approval date when approving
      if (status === 'active') {
        updateData.approvalDate = new Date().toISOString();
      }

      return await this.organizationRepository.update(organizationId, updateData);
    } catch (error) {
      console.error('Error updating organization status:', error);
      throw new Error(`Failed to update organization status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update organization capacity
   */
  async updateOrganizationCapacity(organizationId: string, maxPatientCapacity: number): Promise<OrganizationRecord> {
    try {
      if (maxPatientCapacity < 0) {
        throw new Error('Patient capacity cannot be negative');
      }

      return await this.organizationRepository.updateCapacity(organizationId, maxPatientCapacity);
    } catch (error) {
      console.error('Error updating organization capacity:', error);
      throw new Error(`Failed to update organization capacity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add study to organization
   */
  async addStudyToOrganization(organizationId: string, studyId: string): Promise<OrganizationRecord> {
    try {
      return await this.organizationRepository.addActiveStudy(organizationId, studyId);
    } catch (error) {
      console.error('Error adding study to organization:', error);
      throw new Error(`Failed to add study to organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove study from organization
   */
  async removeStudyFromOrganization(organizationId: string, studyId: string): Promise<OrganizationRecord> {
    try {
      return await this.organizationRepository.removeActiveStudy(organizationId, studyId);
    } catch (error) {
      console.error('Error removing study from organization:', error);
      throw new Error(`Failed to remove study from organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update organization equipment
   */
  async updateOrganizationEquipment(organizationId: string, availableEquipment: string[]): Promise<OrganizationRecord> {
    try {
      return await this.organizationRepository.updateEquipment(organizationId, availableEquipment);
    } catch (error) {
      console.error('Error updating organization equipment:', error);
      throw new Error(`Failed to update organization equipment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update organization certifications
   */
  async updateOrganizationCertifications(organizationId: string, certifications: string[]): Promise<OrganizationRecord> {
    try {
      return await this.organizationRepository.updateCertifications(organizationId, certifications);
    } catch (error) {
      console.error('Error updating organization certifications:', error);
      throw new Error(`Failed to update organization certifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get organization statistics
   */
  async getOrganizationStatistics(organizationId: string): Promise<{
    totalActiveStudies: number;
    maxPatientCapacity: number;
    availableEquipmentCount: number;
    certificationsCount: number;
    status: OrganizationRecord['status'];
  }> {
    try {
      const organization = await this.organizationRepository.findById(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      return {
        totalActiveStudies: organization.activeStudies.length,
        maxPatientCapacity: organization.maxPatientCapacity,
        availableEquipmentCount: organization.availableEquipment.length,
        certificationsCount: organization.certifications.length,
        status: organization.status,
      };
    } catch (error) {
      console.error('Error getting organization statistics:', error);
      throw new Error(`Failed to get organization statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  /**
   * Validate phone number format (basic validation)
   */
  private validatePhoneNumber(phoneNumber: string): void {
    // Remove all non-digit characters for validation
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // Check if it has at least 10 digits (minimum for most phone numbers)
    if (digitsOnly.length < 10) {
      throw new Error('Phone number must have at least 10 digits');
    }

    // Check if it has too many digits (maximum reasonable length)
    if (digitsOnly.length > 15) {
      throw new Error('Phone number cannot exceed 15 digits');
    }
  }

  /**
   * Delete organization (only for inactive/pending organizations with no active studies)
   */
  async deleteOrganization(organizationId: string, deletedBy: string): Promise<void> {
    try {
      // First, check if the organization exists and can be deleted
      const org = await this.organizationRepository.findById(organizationId);
      if (!org) {
        throw new Error('Organization not found');
      }

      if (org.status !== 'inactive' && org.status !== 'pending_approval') {
        throw new Error('Only inactive or pending organizations can be deleted');
      }

      if (org.activeStudies && org.activeStudies.length > 0) {
        throw new Error('Cannot delete organization with active studies. Please remove all studies first.');
      }

      // Delete the organization
      await this.organizationRepository.deleteById(organizationId);
    } catch (error) {
      console.error('Error deleting organization:', error);
      throw new Error(`Failed to delete organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
let organizationServiceInstance: OrganizationService | null = null;

export function getOrganizationService(): OrganizationService {
  if (!organizationServiceInstance) {
    organizationServiceInstance = new OrganizationService();
  }
  return organizationServiceInstance;
}