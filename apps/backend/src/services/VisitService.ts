import { VisitRepository } from '../repositories/VisitRepository.js';
import { SurveyRepository } from '../repositories/SurveyRepository.js';
import { ClinicalStudyRepository } from '../repositories/ClinicalStudyRepository.js';
import { RepositoryFactory } from '../repositories/index.js';
import { VisitRecord, SurveyRecord, ClinicalStudyRecord } from '@clinical-trial/shared';

export interface VisitSchedulingRequest {
  surveyId: string;
  visitId: string;
  scheduledDate: string;
  conductedBy: string;
  notes?: string;
}

export interface ExaminationCompletionRequest {
  visitId: string;
  examinationId: string;
  completed: boolean;
  notes?: string;
}

export interface ProtocolDeviationAlert {
  visitId: string;
  surveyId: string;
  patientId: string;
  deviationType: 'window_violation' | 'missed_visit' | 'examination_skip' | 'protocol_change';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
  windowStartDate?: string;
  windowEndDate?: string;
  scheduledDate?: string;
  actualDate?: string;
}

/**
 * Service for managing visits with protocol compliance and dynamic examination tracking
 */
export class VisitService {
  private visitRepository: VisitRepository;
  private surveyRepository: SurveyRepository;
  private clinicalStudyRepository: ClinicalStudyRepository;

  constructor() {
    const factory = RepositoryFactory.getInstance();
    this.visitRepository = factory.getVisitRepository();
    this.surveyRepository = factory.getSurveyRepository();
    this.clinicalStudyRepository = factory.getClinicalStudyRepository();
  }

  /**
   * Schedule a visit with protocol compliance checking
   */
  async scheduleVisit(request: VisitSchedulingRequest): Promise<{
    visit: VisitRecord;
    protocolCompliant: boolean;
    deviations: ProtocolDeviationAlert[];
  }> {
    const visit = await this.visitRepository.findBySurveyAndVisit(request.surveyId, request.visitId);
    if (!visit) {
      throw new Error(`Visit not found: ${request.visitId}`);
    }

    const scheduledDate = new Date(request.scheduledDate);
    const windowStart = new Date(visit.windowStartDate);
    const windowEnd = new Date(visit.windowEndDate);
    
    const deviations: ProtocolDeviationAlert[] = [];
    let protocolCompliant = true;

    // Check if scheduled date is within protocol window
    if (scheduledDate < windowStart || scheduledDate > windowEnd) {
      protocolCompliant = false;
      deviations.push({
        visitId: request.visitId,
        surveyId: request.surveyId,
        patientId: visit.patientId,
        deviationType: 'window_violation',
        description: `Visit scheduled outside protocol window. Scheduled: ${request.scheduledDate}, Window: ${visit.windowStartDate} to ${visit.windowEndDate}`,
        severity: 'medium',
        detectedAt: new Date().toISOString(),
        windowStartDate: visit.windowStartDate,
        windowEndDate: visit.windowEndDate,
        scheduledDate: request.scheduledDate
      });
    }

    // Update visit with new schedule
    const updatedVisit = await this.visitRepository.update(request.surveyId, {
      scheduledDate: request.scheduledDate,
      conductedBy: request.conductedBy,
      visitNotes: request.notes,
      status: 'scheduled'
    }, request.visitId);

    return {
      visit: updatedVisit,
      protocolCompliant,
      deviations
    };
  }

  /**
   * Start a visit (set status to in_progress)
   */
  async startVisit(visitId: string, conductedBy?: string): Promise<VisitRecord> {
    // Find the visit to get surveyId
    const visit = await this.visitRepository.findById(visitId);
    if (!visit) {
      throw new Error(`Visit not found: ${visitId}`);
    }

    const updates: Partial<VisitRecord> = {
      status: 'in_progress',
      actualDate: new Date().toISOString()
    };

    if (conductedBy) {
      updates.conductedBy = conductedBy;
    }

    return await this.visitRepository.update(visit.surveyId, updates, visitId);
  }

  /**
   * Complete an examination within a visit
   */
  async completeExamination(request: ExaminationCompletionRequest): Promise<{
    visit: VisitRecord;
    completionPercentage: number;
    allExaminationsComplete: boolean;
  }> {
    const visit = await this.visitRepository.findById(request.visitId);
    if (!visit) {
      throw new Error(`Visit not found: ${request.visitId}`);
    }

    let updatedVisit: VisitRecord;
    
    if (request.completed) {
      updatedVisit = await this.visitRepository.completeExamination(
        visit.surveyId,
        request.visitId,
        request.examinationId
      );
    } else {
      updatedVisit = await this.visitRepository.skipExamination(
        visit.surveyId,
        request.visitId,
        request.examinationId
      );
    }

    // Check if all required examinations are completed
    const totalRequired = visit.requiredExaminations.length;
    const completedRequired = updatedVisit.completedExaminations.filter(examId =>
      visit.requiredExaminations.includes(examId)
    ).length;
    
    const allExaminationsComplete = completedRequired === totalRequired;

    return {
      visit: updatedVisit,
      completionPercentage: updatedVisit.completionPercentage,
      allExaminationsComplete
    };
  }

  /**
   * Complete a visit
   */
  async completeVisit(visitId: string): Promise<{
    visit: VisitRecord;
    survey: SurveyRecord;
  }> {
    const visit = await this.visitRepository.findById(visitId);
    if (!visit) {
      throw new Error(`Visit not found: ${visitId}`);
    }

    // Complete the visit
    const completedVisit = await this.visitRepository.completeVisit(visit.surveyId, visitId);

    // Update survey progress
    const updatedSurvey = await this.updateSurveyProgress(visit.surveyId);

    return {
      visit: completedVisit,
      survey: updatedSurvey
    };
  }

  /**
   * Update survey progress based on visit completions
   */
  private async updateSurveyProgress(surveyId: string): Promise<SurveyRecord> {
    const visits = await this.visitRepository.findBySurvey(surveyId);
    const completedVisits = visits.filter(v => v.status === 'completed').length;
    const totalVisits = visits.length;
    const completionPercentage = totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0;

    return await this.surveyRepository.updateProgress(surveyId, completionPercentage, completedVisits);
  }

  /**
   * Get visit details with examination configuration
   */
  async getVisitConfiguration(visitId: string): Promise<{
    visit: VisitRecord;
    examinationConfig: {
      totalExaminations: number;
      requiredExaminations: string[];
      optionalExaminations: string[];
      examinationOrder: string[];
      completedExaminations: string[];
      skippedExaminations: string[];
      remainingExaminations: string[];
    };
  }> {
    const visit = await this.visitRepository.findById(visitId);
    if (!visit) {
      throw new Error(`Visit not found: ${visitId}`);
    }

    const allExaminations = [...visit.requiredExaminations, ...visit.optionalExaminations];
    const remainingExaminations = allExaminations.filter(examId =>
      !visit.completedExaminations.includes(examId) && !visit.skippedExaminations.includes(examId)
    );

    return {
      visit,
      examinationConfig: {
        totalExaminations: allExaminations.length,
        requiredExaminations: visit.requiredExaminations,
        optionalExaminations: visit.optionalExaminations,
        examinationOrder: visit.examinationOrder,
        completedExaminations: visit.completedExaminations,
        skippedExaminations: visit.skippedExaminations,
        remainingExaminations
      }
    };
  }

  /**
   * Update visit examination configuration (for dynamic visits)
   */
  async updateExaminationConfiguration(
    visitId: string,
    configuration: {
      requiredExaminations: string[];
      optionalExaminations: string[];
      examinationOrder: string[];
    }
  ): Promise<VisitRecord> {
    const visit = await this.visitRepository.findById(visitId);
    if (!visit) {
      throw new Error(`Visit not found: ${visitId}`);
    }

    return await this.visitRepository.updateExaminationConfiguration(
      visit.surveyId,
      visitId,
      configuration
    );
  }

  /**
   * Detect protocol deviations for visits
   */
  async detectProtocolDeviations(organizationId?: string): Promise<ProtocolDeviationAlert[]> {
    const deviations: ProtocolDeviationAlert[] = [];
    const now = new Date();

    // Get visits to check - either for specific organization or all
    let visits: VisitRecord[] = [];
    if (organizationId) {
      visits = await this.visitRepository.findByOrganization(organizationId);
    } else {
      // Would need a method to get all visits, for now use organization-specific
      throw new Error('Organization ID is required for deviation detection');
    }

    for (const visit of visits) {
      const windowEnd = new Date(visit.windowEndDate);
      const scheduledDate = new Date(visit.scheduledDate);

      // Check for missed visits (past window end date and not completed)
      if (windowEnd < now && visit.status !== 'completed' && visit.status !== 'missed') {
        deviations.push({
          visitId: visit.visitId,
          surveyId: visit.surveyId,
          patientId: visit.patientId,
          deviationType: 'missed_visit',
          description: `Visit missed - past window end date: ${visit.windowEndDate}`,
          severity: 'high',
          detectedAt: now.toISOString(),
          windowStartDate: visit.windowStartDate,
          windowEndDate: visit.windowEndDate,
          scheduledDate: visit.scheduledDate
        });
      }

      // Check for visits scheduled outside window
      if (visit.status === 'scheduled') {
        const windowStart = new Date(visit.windowStartDate);
        if (scheduledDate < windowStart || scheduledDate > windowEnd) {
          deviations.push({
            visitId: visit.visitId,
            surveyId: visit.surveyId,
            patientId: visit.patientId,
            deviationType: 'window_violation',
            description: `Visit scheduled outside protocol window`,
            severity: 'medium',
            detectedAt: now.toISOString(),
            windowStartDate: visit.windowStartDate,
            windowEndDate: visit.windowEndDate,
            scheduledDate: visit.scheduledDate
          });
        }
      }

      // Check for incomplete required examinations in completed visits
      if (visit.status === 'completed') {
        const incompleteRequired = visit.requiredExaminations.filter(examId =>
          !visit.completedExaminations.includes(examId)
        );
        
        if (incompleteRequired.length > 0) {
          deviations.push({
            visitId: visit.visitId,
            surveyId: visit.surveyId,
            patientId: visit.patientId,
            deviationType: 'examination_skip',
            description: `Required examinations not completed: ${incompleteRequired.join(', ')}`,
            severity: 'medium',
            detectedAt: now.toISOString()
          });
        }
      }
    }

    return deviations;
  }

  /**
   * Get visit statistics with dynamic examination tracking
   */
  async getVisitStatistics(surveyId?: string, organizationId?: string): Promise<{
    totalVisits: number;
    completedVisits: number;
    inProgressVisits: number;
    scheduledVisits: number;
    missedVisits: number;
    averageCompletionPercentage: number;
    protocolDeviations: number;
    examinationStats: {
      totalExaminations: number;
      completedExaminations: number;
      skippedExaminations: number;
      completionRate: number;
    };
  }> {
    let visits: VisitRecord[] = [];

    if (surveyId) {
      visits = await this.visitRepository.findBySurvey(surveyId);
    } else if (organizationId) {
      visits = await this.visitRepository.findByOrganization(organizationId);
    } else {
      throw new Error('Either surveyId or organizationId must be provided');
    }

    // Calculate visit statistics
    const stats = {
      totalVisits: visits.length,
      completedVisits: visits.filter(v => v.status === 'completed').length,
      inProgressVisits: visits.filter(v => v.status === 'in_progress').length,
      scheduledVisits: visits.filter(v => v.status === 'scheduled').length,
      missedVisits: visits.filter(v => v.status === 'missed').length,
      averageCompletionPercentage: 0,
      protocolDeviations: 0,
      examinationStats: {
        totalExaminations: 0,
        completedExaminations: 0,
        skippedExaminations: 0,
        completionRate: 0
      }
    };

    if (visits.length > 0) {
      // Calculate average completion percentage
      const totalCompletion = visits.reduce((sum, v) => sum + v.completionPercentage, 0);
      stats.averageCompletionPercentage = Math.round(totalCompletion / visits.length);

      // Calculate examination statistics
      let totalExaminations = 0;
      let completedExaminations = 0;
      let skippedExaminations = 0;

      for (const visit of visits) {
        const visitTotal = visit.requiredExaminations.length + visit.optionalExaminations.length;
        totalExaminations += visitTotal;
        completedExaminations += visit.completedExaminations.length;
        skippedExaminations += visit.skippedExaminations.length;
      }

      stats.examinationStats = {
        totalExaminations,
        completedExaminations,
        skippedExaminations,
        completionRate: totalExaminations > 0 ? Math.round((completedExaminations / totalExaminations) * 100) : 0
      };

      // Count protocol deviations
      const deviations = await this.detectProtocolDeviations(organizationId);
      stats.protocolDeviations = deviations.length;
    }

    return stats;
  }

  /**
   * Reschedule a visit
   */
  async rescheduleVisit(visitId: string, newScheduledDate: string, reason?: string): Promise<{
    visit: VisitRecord;
    protocolCompliant: boolean;
    deviations: ProtocolDeviationAlert[];
  }> {
    const visit = await this.visitRepository.findById(visitId);
    if (!visit) {
      throw new Error(`Visit not found: ${visitId}`);
    }

    // Update status to rescheduled and add reason
    await this.visitRepository.update(visit.surveyId, {
      status: 'rescheduled',
      deviationReason: reason || 'Visit rescheduled'
    }, visitId);

    // Schedule with new date
    return await this.scheduleVisit({
      surveyId: visit.surveyId,
      visitId,
      scheduledDate: newScheduledDate,
      conductedBy: visit.conductedBy,
      notes: reason
    });
  }

  /**
   * Mark visit as missed
   */
  async markVisitMissed(visitId: string, reason?: string): Promise<VisitRecord> {
    const visit = await this.visitRepository.findById(visitId);
    if (!visit) {
      throw new Error(`Visit not found: ${visitId}`);
    }

    return await this.visitRepository.update(visit.surveyId, {
      status: 'missed',
      deviationReason: reason || 'Visit missed'
    }, visitId);
  }

  /**
   * Cancel a visit
   */
  async cancelVisit(visitId: string, reason?: string): Promise<VisitRecord> {
    const visit = await this.visitRepository.findById(visitId);
    if (!visit) {
      throw new Error(`Visit not found: ${visitId}`);
    }

    return await this.visitRepository.update(visit.surveyId, {
      status: 'cancelled',
      deviationReason: reason || 'Visit cancelled'
    }, visitId);
  }
}