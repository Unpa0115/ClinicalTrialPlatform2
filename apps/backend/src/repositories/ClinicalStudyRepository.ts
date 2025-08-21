import { BaseRepository } from './BaseRepository.js';
import { tableNames, indexNames } from '../config/database.js';
import { ClinicalStudyRecord } from '@clinical-trial/shared';

/**
 * Repository for ClinicalStudy table operations
 * Handles clinical study protocol management with flexible visit configuration
 */
export class ClinicalStudyRepository extends BaseRepository<ClinicalStudyRecord> {
  constructor() {
    super(tableNames.clinicalStudy);
  }

  protected getPrimaryKeyName(): string {
    return 'clinicalStudyId';
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
   * Create a new clinical study with generated ID
   */
  async createStudy(studyData: Omit<ClinicalStudyRecord, 'clinicalStudyId' | 'createdAt' | 'updatedAt' | 'entityType'>): Promise<ClinicalStudyRecord> {
    const now = new Date().toISOString();
    const studyId = `study-${studyData.studyCode}-${Date.now()}`;

    const study: ClinicalStudyRecord = {
      ...studyData,
      clinicalStudyId: studyId,
      entityType: 'clinicalStudy',
      createdAt: now,
      updatedAt: now,
    };

    return await this.create(study);
  }

  /**
   * Find studies by status
   */
  async findByStatus(status: ClinicalStudyRecord['status']): Promise<ClinicalStudyRecord[]> {
    const result = await this.queryByPartitionKey('clinicalStudy', {
      indexName: indexNames.entityTypeIndex,
      sortKeyCondition: '=',
      sortKeyValue: status,
    });

    return result.items;
  }

  /**
   * Find all active studies
   */
  async findActiveStudies(): Promise<ClinicalStudyRecord[]> {
    // Include both 'active' and 'recruiting' as active studies
    const activeStudies = await this.findByStatus('active');
    const recruitingStudies = await this.findByStatus('recruiting');
    return [...activeStudies, ...recruitingStudies];
  }

  /**
   * Find studies by organization
   */
  async findByOrganization(organizationId: string): Promise<ClinicalStudyRecord[]> {
    const result = await this.scanAll({
      filterExpression: 'contains(#targetOrgs, :orgId)',
      expressionAttributeNames: {
        '#targetOrgs': 'targetOrganizations',
      },
      expressionAttributeValues: {
        ':orgId': organizationId,
      },
    });

    return result.items;
  }

  /**
   * Update study enrollment count
   */
  async updateEnrollmentCount(studyId: string, enrolledPatients: number): Promise<ClinicalStudyRecord> {
    return await this.update(studyId, { 
      enrolledPatients,
      completionPercentage: Math.round((enrolledPatients / (await this.findById(studyId))!.totalTargetPatients) * 100)
    });
  }

  /**
   * Update visit template configuration
   */
  async updateVisitTemplate(studyId: string, visitTemplate: ClinicalStudyRecord['visitTemplate']): Promise<ClinicalStudyRecord> {
    return await this.update(studyId, { visitTemplate });
  }

  /**
   * Add organization to study
   */
  async addOrganization(studyId: string, organizationId: string): Promise<ClinicalStudyRecord> {
    const study = await this.findById(studyId);
    if (!study) {
      throw new Error(`Study ${studyId} not found`);
    }

    const updatedOrganizations = [...study.targetOrganizations];
    if (!updatedOrganizations.includes(organizationId)) {
      updatedOrganizations.push(organizationId);
    }

    return await this.update(studyId, { targetOrganizations: updatedOrganizations });
  }

  /**
   * Remove organization from study
   */
  async removeOrganization(studyId: string, organizationId: string): Promise<ClinicalStudyRecord> {
    const study = await this.findById(studyId);
    if (!study) {
      throw new Error(`Study ${studyId} not found`);
    }

    const updatedOrganizations = study.targetOrganizations.filter(id => id !== organizationId);
    return await this.update(studyId, { targetOrganizations: updatedOrganizations });
  }

  /**
   * Delete clinical study by ID
   */
  async deleteById(studyId: string): Promise<void> {
    await this.delete(studyId);
  }
}