import { BaseRepository } from './BaseRepository.js';
import { indexNames } from '../config/database.js';

/**
 * Base examination data interface with standardized fields
 * All examination tables include these common fields
 */
export interface BaseExaminationData {
  visitId: string;
  surveyId: string; // Auto-populated
  patientId: string;
  clinicalStudyId: string;
  organizationId: string;
  eyeside: 'Right' | 'Left'; // Standardized field
  createdAt: string;
  updatedAt: string;
}

/**
 * Base repository for examination data tables
 * Provides common functionality for all examination types
 */
export abstract class BaseExaminationRepository<T extends BaseExaminationData> extends BaseRepository<T> {
  constructor(tableName: string) {
    super(tableName);
  }

  protected getPrimaryKeyName(): string {
    return 'visitId';
  }

  protected abstract getExaminationIdFieldName(): string;

  protected getSortKeyName(): string | null {
    return this.getExaminationIdFieldName();
  }

  protected getIndexPartitionKeyName(indexName: string): string | null {
    return null;
  }

  protected getIndexSortKeyName(indexName: string): string | null {
    switch (indexName) {
      case indexNames.surveyIndex:
        return 'eyeside';
      default:
        return null;
    }
  }

  /**
   * Create examination data with automatic field population
   */
  async createExamination(
    visitId: string,
    surveyId: string,
    patientId: string,
    clinicalStudyId: string,
    organizationId: string,
    eyeside: 'Right' | 'Left',
    examinationData: Omit<T, keyof BaseExaminationData | string>
  ): Promise<T> {
    const now = new Date().toISOString();
    const examinationId = `${this.getExaminationPrefix()}-${eyeside.toLowerCase()}-${Date.now()}`;

    const examination = {
      ...examinationData,
      visitId,
      [this.getExaminationIdFieldName()]: examinationId,
      surveyId, // Auto-populated
      patientId,
      clinicalStudyId,
      organizationId,
      eyeside, // Standardized field ('Right'/'Left')
      createdAt: now,
      updatedAt: now,
    } as T;

    return await this.create(examination);
  }

  /**
   * Find examination data by visit
   */
  async findByVisit(visitId: string): Promise<T[]> {
    const result = await this.queryByPartitionKey(visitId);
    return result.items;
  }

  /**
   * Find examination data by visit and eye side
   */
  async findByVisitAndEye(visitId: string, eyeside: 'Right' | 'Left'): Promise<T | null> {
    const examinations = await this.findByVisit(visitId);
    return examinations.find(exam => exam.eyeside === eyeside) || null;
  }

  /**
   * Find examination data by survey (across all visits)
   */
  async findBySurvey(surveyId: string): Promise<T[]> {
    const result = await this.queryByPartitionKey(surveyId, {
      indexName: indexNames.surveyIndex,
    });
    return result.items;
  }

  /**
   * Find examination data by survey and eye side
   */
  async findBySurveyAndEye(surveyId: string, eyeside: 'Right' | 'Left'): Promise<T[]> {
    const result = await this.queryByPartitionKey(surveyId, {
      indexName: indexNames.surveyIndex,
      sortKeyCondition: '=',
      sortKeyValue: eyeside,
    });
    return result.items;
  }

  /**
   * Update examination data
   */
  async updateExamination(
    visitId: string,
    examinationId: string,
    updates: Partial<Omit<T, keyof BaseExaminationData>>
  ): Promise<T> {
    return await this.update(visitId, updates, examinationId);
  }

  /**
   * Delete examination data
   */
  async deleteExamination(visitId: string, examinationId: string): Promise<void> {
    await this.delete(visitId, examinationId);
  }

  /**
   * Batch operations for left/right eye data management
   */
  async batchCreateBothEyes(
    visitId: string,
    surveyId: string,
    patientId: string,
    clinicalStudyId: string,
    organizationId: string,
    rightEyeData: Omit<T, keyof BaseExaminationData | string>,
    leftEyeData: Omit<T, keyof BaseExaminationData | string>
  ): Promise<{ right: T; left: T }> {
    const rightExam = await this.createExamination(
      visitId, surveyId, patientId, clinicalStudyId, organizationId,
      'Right', rightEyeData
    );

    const leftExam = await this.createExamination(
      visitId, surveyId, patientId, clinicalStudyId, organizationId,
      'Left', leftEyeData
    );

    return { right: rightExam, left: leftExam };
  }

  /**
   * Get both eyes data for a visit
   */
  async getBothEyesData(visitId: string): Promise<{ right: T | null; left: T | null }> {
    const examinations = await this.findByVisit(visitId);
    
    return {
      right: examinations.find(exam => exam.eyeside === 'Right') || null,
      left: examinations.find(exam => exam.eyeside === 'Left') || null,
    };
  }

  /**
   * Compare data between visits for trend analysis
   */
  async compareVisits(surveyId: string, eyeside: 'Right' | 'Left'): Promise<T[]> {
    const examinations = await this.findBySurveyAndEye(surveyId, eyeside);
    return examinations.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // Abstract methods to be implemented by specific examination repositories
  protected abstract getExaminationPrefix(): string;
}