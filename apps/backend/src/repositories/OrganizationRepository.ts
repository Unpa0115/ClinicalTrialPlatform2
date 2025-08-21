import { BaseRepository } from './BaseRepository.js';
import { tableNames, indexNames } from '../config/database.js';
import { OrganizationRecord } from '@clinical-trial/shared';

/**
 * Repository for Organizations table operations
 * Handles organization management and capabilities tracking
 */
export class OrganizationRepository extends BaseRepository<OrganizationRecord> {
  constructor() {
    super(tableNames.organizations);
  }

  protected getPrimaryKeyName(): string {
    return 'organizationId';
  }

  protected getSortKeyName(): string | null {
    return null;
  }

  protected getIndexPartitionKeyName(indexName: string): string | null {
    switch (indexName) {
      case indexNames.entityTypeIndex:
        return 'entityType';
      default:
        return null;
    }
  }

  protected getIndexSortKeyName(indexName: string): string | null {
    switch (indexName) {
      case indexNames.entityTypeIndex:
        return 'status';
      default:
        return null;
    }
  }

  /**
   * Create a new organization with generated ID
   */
  async createOrganization(orgData: Omit<OrganizationRecord, 'organizationId' | 'createdAt' | 'updatedAt' | 'entityType'>): Promise<OrganizationRecord> {
    const now = new Date().toISOString();
    const orgId = `org-${orgData.organizationCode}-${Date.now()}`;

    const organization: OrganizationRecord = {
      ...orgData,
      organizationId: orgId,
      entityType: 'organization',
      createdAt: now,
      updatedAt: now,
    };

    return await this.create(organization);
  }

  /**
   * Find all organizations
   */
  async findAllOrganizations(): Promise<OrganizationRecord[]> {
    console.log('=== ORGANIZATION REPOSITORY FIND ALL ===');
    const result = await this.queryByPartitionKey('organization', {
      indexName: indexNames.entityTypeIndex,
    });

    console.log('Repository found organizations:', result.items.length);
    return result.items;
  }

  /**
   * Find organizations by status
   */
  async findByStatus(status: OrganizationRecord['status']): Promise<OrganizationRecord[]> {
    const result = await this.queryByPartitionKey('organization', {
      indexName: indexNames.entityTypeIndex,
      sortKeyCondition: '=',
      sortKeyValue: status,
    });

    return result.items;
  }

  /**
   * Find all active organizations
   */
  async findActiveOrganizations(): Promise<OrganizationRecord[]> {
    return await this.findByStatus('active');
  }

  /**
   * Find organization by code
   */
  async findByCode(organizationCode: string): Promise<OrganizationRecord | null> {
    const result = await this.scanAll({
      filterExpression: '#orgCode = :code',
      expressionAttributeNames: {
        '#orgCode': 'organizationCode',
      },
      expressionAttributeValues: {
        ':code': organizationCode,
      },
    });

    return result.items[0] || null;
  }

  /**
   * Update organization capacity
   */
  async updateCapacity(orgId: string, maxPatientCapacity: number): Promise<OrganizationRecord> {
    return await this.update(orgId, { maxPatientCapacity });
  }

  /**
   * Add study to organization
   */
  async addActiveStudy(orgId: string, studyId: string): Promise<OrganizationRecord> {
    const org = await this.findById(orgId);
    if (!org) {
      throw new Error(`Organization ${orgId} not found`);
    }

    const updatedStudies = [...org.activeStudies];
    if (!updatedStudies.includes(studyId)) {
      updatedStudies.push(studyId);
    }

    return await this.update(orgId, { activeStudies: updatedStudies });
  }

  /**
   * Remove study from organization
   */
  async removeActiveStudy(orgId: string, studyId: string): Promise<OrganizationRecord> {
    const org = await this.findById(orgId);
    if (!org) {
      throw new Error(`Organization ${orgId} not found`);
    }

    const updatedStudies = org.activeStudies.filter(id => id !== studyId);
    return await this.update(orgId, { activeStudies: updatedStudies });
  }

  /**
   * Update organization equipment
   */
  async updateEquipment(orgId: string, availableEquipment: string[]): Promise<OrganizationRecord> {
    return await this.update(orgId, { availableEquipment });
  }

  /**
   * Update organization certifications
   */
  async updateCertifications(orgId: string, certifications: string[]): Promise<OrganizationRecord> {
    return await this.update(orgId, { certifications });
  }

  /**
   * Delete organization by ID
   */
  async deleteById(organizationId: string): Promise<void> {
    await this.delete(organizationId);
  }
}