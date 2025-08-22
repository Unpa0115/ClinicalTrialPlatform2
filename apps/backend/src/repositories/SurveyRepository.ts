import { BaseRepository } from './BaseRepository.js';
import { tableNames, indexNames } from '../config/database.js';
import { SurveyRecord } from '@clinical-trial/shared';

/**
 * Repository for Surveys table operations
 * Handles individual patient survey management with clinical study integration
 */
export class SurveyRepository extends BaseRepository<SurveyRecord> {
  constructor() {
    super(tableNames.surveys);
  }

  protected getPrimaryKeyName(): string {
    return 'surveyId';
  }

  protected getSortKeyName(): string | null {
    return null;
  }

  protected getIndexPartitionKeyName(indexName: string): string | null {
    switch (indexName) {
      case indexNames.organizationIndex:
        return 'organizationId';
      case indexNames.studyIndex:
        return 'clinicalStudyId';
      case indexNames.patientIndex:
        return 'patientId';
      default:
        return null;
    }
  }

  protected getIndexSortKeyName(indexName: string): string | null {
    switch (indexName) {
      case indexNames.organizationIndex:
        return 'status';
      case indexNames.studyIndex:
        return 'status';
      case indexNames.patientIndex:
        return 'status';
      default:
        return null;
    }
  }

  /**
   * Create a new survey with generated ID
   */
  async createSurvey(surveyData: Omit<SurveyRecord, 'surveyId' | 'createdAt' | 'updatedAt' | 'entityType'>): Promise<SurveyRecord> {
    const now = new Date().toISOString();
    const surveyId = `survey-${surveyData.patientId}-${surveyData.clinicalStudyId}-${Date.now()}`;

    const survey: SurveyRecord = {
      ...surveyData,
      surveyId,
      entityType: 'survey',
      createdAt: now,
      updatedAt: now,
    };

    return await this.create(survey);
  }

  /**
   * Find surveys by clinical study
   */
  async findByStudy(studyId: string, options?: {
    limit?: number;
    exclusiveStartKey?: any;
  }): Promise<{ surveys: SurveyRecord[]; lastEvaluatedKey?: any }> {
    const result = await this.queryByPartitionKey(studyId, {
      indexName: indexNames.studyIndex,
      limit: options?.limit,
      exclusiveStartKey: options?.exclusiveStartKey,
    });

    return {
      surveys: result.items,
      lastEvaluatedKey: result.lastEvaluatedKey,
    };
  }

  /**
   * Find surveys by organization
   */
  async findByOrganization(organizationId: string, options?: {
    limit?: number;
    exclusiveStartKey?: any;
  }): Promise<{ surveys: SurveyRecord[]; lastEvaluatedKey?: any }> {
    const result = await this.queryByPartitionKey(organizationId, {
      indexName: indexNames.organizationIndex,
      limit: options?.limit,
      exclusiveStartKey: options?.exclusiveStartKey,
    });

    return {
      surveys: result.items,
      lastEvaluatedKey: result.lastEvaluatedKey,
    };
  }

  /**
   * Find surveys by patient
   */
  async findByPatient(patientId: string): Promise<SurveyRecord[]> {
    const result = await this.queryByPartitionKey(patientId, {
      indexName: indexNames.patientIndex,
    });

    return result.items;
  }

  /**
   * Find active surveys by organization
   */
  async findActiveSurveysByOrganization(organizationId: string): Promise<SurveyRecord[]> {
    const result = await this.findByOrganization(organizationId);
    return result.surveys.filter(survey => survey.status === 'active');
  }

  /**
   * Update survey progress
   */
  async updateProgress(
    surveyId: string, 
    completionPercentage: number, 
    completedVisits: number
  ): Promise<SurveyRecord> {
    return await this.update(surveyId, { 
      completionPercentage, 
      completedVisits 
    });
  }

  /**
   * Update survey status
   */
  async updateStatus(surveyId: string, status: SurveyRecord['status']): Promise<SurveyRecord> {
    return await this.update(surveyId, { status });
  }

  /**
   * Complete survey
   */
  async completeSurvey(surveyId: string): Promise<SurveyRecord> {
    return await this.update(surveyId, { 
      status: 'completed',
      completionPercentage: 100
    });
  }

  /**
   * Assign conductor to survey
   */
  async assignConductor(surveyId: string, conductorId: string): Promise<SurveyRecord> {
    return await this.update(surveyId, { conductedBy: conductorId });
  }

  /**
   * Get survey statistics for study
   */
  async getStudySurveyStats(studyId: string): Promise<{
    total: number;
    active: number;
    completed: number;
    withdrawn: number;
    suspended: number;
    averageCompletion: number;
  }> {
    const result = await this.findByStudy(studyId);
    const surveys = result.surveys;

    const stats = {
      total: surveys.length,
      active: surveys.filter(s => s.status === 'active').length,
      completed: surveys.filter(s => s.status === 'completed').length,
      withdrawn: surveys.filter(s => s.status === 'withdrawn').length,
      suspended: surveys.filter(s => s.status === 'suspended').length,
      averageCompletion: 0,
    };

    if (surveys.length > 0) {
      const totalCompletion = surveys.reduce((sum, survey) => sum + survey.completionPercentage, 0);
      stats.averageCompletion = Math.round(totalCompletion / surveys.length);
    }

    return stats;
  }

  /**
   * Get survey statistics for organization
   */
  async getOrganizationSurveyStats(organizationId: string): Promise<{
    total: number;
    active: number;
    completed: number;
    averageCompletion: number;
  }> {
    const result = await this.findByOrganization(organizationId);
    const surveys = result.surveys;

    const stats = {
      total: surveys.length,
      active: surveys.filter(s => s.status === 'active').length,
      completed: surveys.filter(s => s.status === 'completed').length,
      averageCompletion: 0,
    };

    if (surveys.length > 0) {
      const totalCompletion = surveys.reduce((sum, survey) => sum + survey.completionPercentage, 0);
      stats.averageCompletion = Math.round(totalCompletion / surveys.length);
    }

    return stats;
  }
}