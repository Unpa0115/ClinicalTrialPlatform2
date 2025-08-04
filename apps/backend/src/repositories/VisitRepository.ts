import { BaseRepository } from './BaseRepository.js';
import { tableNames, indexNames } from '../config/database.js';
import { VisitRecord } from '@clinical-trial/shared';

/**
 * Repository for Visits table operations
 * Handles flexible visit management with dynamic examination configuration
 */
export class VisitRepository extends BaseRepository<VisitRecord> {
  constructor() {
    super(tableNames.visits);
  }

  protected getPrimaryKeyName(): string {
    return 'surveyId';
  }

  protected getSortKeyName(): string | null {
    return 'visitId';
  }

  protected getIndexSortKeyName(indexName: string): string | null {
    return null; // All GSIs use single key
  }

  /**
   * Create a new visit with generated ID
   */
  async createVisit(visitData: Omit<VisitRecord, 'visitId' | 'createdAt' | 'updatedAt'>): Promise<VisitRecord> {
    const now = new Date().toISOString();
    const visitId = `visit-${visitData.visitNumber}-${Date.now()}`;

    const visit: VisitRecord = {
      ...visitData,
      visitId,
      createdAt: now,
      updatedAt: now,
    };

    return await this.create(visit);
  }

  /**
   * Find visits by survey ID
   */
  async findBySurvey(surveyId: string): Promise<VisitRecord[]> {
    const result = await this.queryByPartitionKey(surveyId);
    return result.items.sort((a, b) => a.visitNumber - b.visitNumber);
  }

  /**
   * Find specific visit by survey and visit ID
   */
  async findBySurveyAndVisit(surveyId: string, visitId: string): Promise<VisitRecord | null> {
    return await this.findById(surveyId, visitId);
  }

  /**
   * Find visits by clinical study
   */
  async findByStudy(studyId: string): Promise<VisitRecord[]> {
    const result = await this.queryByPartitionKey(studyId, {
      indexName: indexNames.studyIndex,
    });

    return result.items;
  }

  /**
   * Find visits by organization
   */
  async findByOrganization(organizationId: string): Promise<VisitRecord[]> {
    const result = await this.queryByPartitionKey(organizationId, {
      indexName: indexNames.organizationIndex,
    });

    return result.items;
  }

  /**
   * Update visit status
   */
  async updateStatus(
    surveyId: string, 
    visitId: string, 
    status: VisitRecord['status']
  ): Promise<VisitRecord> {
    return await this.update(surveyId, { status }, visitId);
  }

  /**
   * Update visit completion percentage
   */
  async updateCompletion(
    surveyId: string, 
    visitId: string, 
    completionPercentage: number,
    completedExaminations: string[]
  ): Promise<VisitRecord> {
    return await this.update(surveyId, { 
      completionPercentage, 
      completedExaminations 
    }, visitId);
  }

  /**
   * Mark examination as completed
   */
  async completeExamination(
    surveyId: string, 
    visitId: string, 
    examinationId: string
  ): Promise<VisitRecord> {
    const visit = await this.findBySurveyAndVisit(surveyId, visitId);
    if (!visit) {
      throw new Error(`Visit ${visitId} not found`);
    }

    const updatedCompleted = [...visit.completedExaminations];
    if (!updatedCompleted.includes(examinationId)) {
      updatedCompleted.push(examinationId);
    }

    // Calculate completion percentage
    const totalExaminations = visit.requiredExaminations.length + visit.optionalExaminations.length;
    const completionPercentage = totalExaminations > 0 
      ? Math.round((updatedCompleted.length / totalExaminations) * 100)
      : 100;

    return await this.update(surveyId, { 
      completedExaminations: updatedCompleted,
      completionPercentage
    }, visitId);
  }

  /**
   * Skip examination
   */
  async skipExamination(
    surveyId: string, 
    visitId: string, 
    examinationId: string
  ): Promise<VisitRecord> {
    const visit = await this.findBySurveyAndVisit(surveyId, visitId);
    if (!visit) {
      throw new Error(`Visit ${visitId} not found`);
    }

    const updatedSkipped = [...visit.skippedExaminations];
    if (!updatedSkipped.includes(examinationId)) {
      updatedSkipped.push(examinationId);
    }

    return await this.update(surveyId, { 
      skippedExaminations: updatedSkipped 
    }, visitId);
  }

  /**
   * Update visit examination configuration (for dynamic visits)
   */
  async updateExaminationConfiguration(
    surveyId: string, 
    visitId: string, 
    configuration: {
      requiredExaminations: string[];
      optionalExaminations: string[];
      examinationOrder: string[];
    }
  ): Promise<VisitRecord> {
    return await this.update(surveyId, configuration, visitId);
  }

  /**
   * Set actual visit date
   */
  async setActualDate(
    surveyId: string, 
    visitId: string, 
    actualDate: string
  ): Promise<VisitRecord> {
    return await this.update(surveyId, { actualDate }, visitId);
  }

  /**
   * Add visit notes
   */
  async addNotes(
    surveyId: string, 
    visitId: string, 
    visitNotes: string
  ): Promise<VisitRecord> {
    return await this.update(surveyId, { visitNotes }, visitId);
  }

  /**
   * Record protocol deviation
   */
  async recordDeviation(
    surveyId: string, 
    visitId: string, 
    deviationReason: string
  ): Promise<VisitRecord> {
    return await this.update(surveyId, { deviationReason }, visitId);
  }

  /**
   * Complete visit
   */
  async completeVisit(surveyId: string, visitId: string): Promise<VisitRecord> {
    return await this.update(surveyId, { 
      status: 'completed',
      completionPercentage: 100,
      actualDate: new Date().toISOString()
    }, visitId);
  }

  /**
   * Get visit statistics for survey
   */
  async getSurveyVisitStats(surveyId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    scheduled: number;
    missed: number;
    averageCompletion: number;
  }> {
    const visits = await this.findBySurvey(surveyId);

    const stats = {
      total: visits.length,
      completed: visits.filter(v => v.status === 'completed').length,
      inProgress: visits.filter(v => v.status === 'in_progress').length,
      scheduled: visits.filter(v => v.status === 'scheduled').length,
      missed: visits.filter(v => v.status === 'missed').length,
      averageCompletion: 0,
    };

    if (visits.length > 0) {
      const totalCompletion = visits.reduce((sum, visit) => sum + visit.completionPercentage, 0);
      stats.averageCompletion = Math.round(totalCompletion / visits.length);
    }

    return stats;
  }

  /**
   * Get visits due for completion (within window period)
   */
  async getVisitsDue(organizationId: string, daysAhead: number = 7): Promise<VisitRecord[]> {
    const visits = await this.findByOrganization(organizationId);
    const now = new Date();
    const futureDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));

    return visits.filter(visit => {
      if (visit.status !== 'scheduled') return false;
      
      const scheduledDate = new Date(visit.scheduledDate);
      return scheduledDate >= now && scheduledDate <= futureDate;
    });
  }

  /**
   * Get overdue visits (past window end date)
   */
  async getOverdueVisits(organizationId: string): Promise<VisitRecord[]> {
    const visits = await this.findByOrganization(organizationId);
    const now = new Date();

    return visits.filter(visit => {
      if (visit.status === 'completed' || visit.status === 'missed') return false;
      
      const windowEndDate = new Date(visit.windowEndDate);
      return windowEndDate < now;
    });
  }
}