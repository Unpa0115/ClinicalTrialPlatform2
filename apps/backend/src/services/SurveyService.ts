import { SurveyRepository } from '../repositories/SurveyRepository.js';
import { ClinicalStudyRepository } from '../repositories/ClinicalStudyRepository.js';
import { PatientRepository } from '../repositories/PatientRepository.js';
import { VisitRepository } from '../repositories/VisitRepository.js';
import { RepositoryFactory } from '../repositories/index.js';
import { SurveyRecord, ClinicalStudyRecord, PatientRecord, VisitRecord } from '@clinical-trial/shared';

export interface CreateSurveyFromTemplateRequest {
  clinicalStudyId: string;
  organizationId: string;
  patientId: string;
  assignedBy: string;
  conductedBy?: string;
  baselineDate: string;
  customName?: string;
}

export interface SurveyGenerationResult {
  survey: SurveyRecord;
  visits: VisitRecord[];
  summary: {
    totalVisits: number;
    generatedVisits: number;
    estimatedCompletionDate: string;
  };
}

/**
 * Service for managing surveys with clinical study integration
 */
export class SurveyService {
  private surveyRepository: SurveyRepository;
  private clinicalStudyRepository: ClinicalStudyRepository;
  private patientRepository: PatientRepository;
  private visitRepository: VisitRepository;

  constructor() {
    const factory = RepositoryFactory.getInstance();
    this.surveyRepository = factory.getSurveyRepository();
    this.clinicalStudyRepository = factory.getClinicalStudyRepository();
    this.patientRepository = factory.getPatientRepository();
    this.visitRepository = factory.getVisitRepository();
  }

  /**
   * Generate survey from clinical study template with automatic visit creation
   */
  async createSurveyFromTemplate(request: CreateSurveyFromTemplateRequest): Promise<SurveyGenerationResult> {
    // Validate clinical study exists and is active
    const clinicalStudy = await this.clinicalStudyRepository.findById(request.clinicalStudyId);
    if (!clinicalStudy) {
      throw new Error(`Clinical study not found: ${request.clinicalStudyId}`);
    }

    if (clinicalStudy.status !== 'active' && clinicalStudy.status !== 'recruiting') {
      throw new Error(`Clinical study is not active: ${clinicalStudy.status}`);
    }

    // Validate patient exists and belongs to organization
    const patient = await this.patientRepository.findById(request.patientId);
    if (!patient) {
      throw new Error(`Patient not found: ${request.patientId}`);
    }

    if (patient.registeredOrganizationId !== request.organizationId) {
      throw new Error(`Patient does not belong to organization: ${request.organizationId}`);
    }

    // Check if patient already has active survey in this study
    const existingSurveys = await this.surveyRepository.findByPatient(request.patientId);
    const activeInStudy = existingSurveys.find(s => 
      s.clinicalStudyId === request.clinicalStudyId && s.status === 'active'
    );

    if (activeInStudy) {
      throw new Error(`Patient already has active survey in study: ${activeInStudy.surveyId}`);
    }

    // Generate survey name
    const surveyName = request.customName || 
      `${patient.patientCode}-${clinicalStudy.studyCode}-${new Date().toISOString().split('T')[0]}`;

    // Calculate expected completion date based on visit templates
    const baselineDate = new Date(request.baselineDate);
    const maxDaysFromBaseline = Math.max(...clinicalStudy.visitTemplate.map(vt => 
      vt.scheduledDaysFromBaseline + vt.windowDaysAfter
    ));
    const expectedCompletionDate = new Date(baselineDate);
    expectedCompletionDate.setDate(baselineDate.getDate() + maxDaysFromBaseline);

    // Create survey
    const survey = await this.surveyRepository.createSurvey({
      clinicalStudyId: request.clinicalStudyId,
      organizationId: request.organizationId,
      patientId: request.patientId,
      name: surveyName,
      description: `Generated survey for ${patient.patientCode} in study ${clinicalStudy.studyName}`,
      baselineDate: request.baselineDate,
      expectedCompletionDate: expectedCompletionDate.toISOString(),
      status: 'active',
      completionPercentage: 0,
      totalVisits: clinicalStudy.visitTemplate.length,
      completedVisits: 0,
      assignedBy: request.assignedBy,
      conductedBy: request.conductedBy
    });

    // Generate visits from clinical study template
    const visits: VisitRecord[] = [];
    
    for (const visitTemplate of clinicalStudy.visitTemplate) {
      const scheduledDate = new Date(baselineDate);
      scheduledDate.setDate(baselineDate.getDate() + visitTemplate.scheduledDaysFromBaseline);

      const windowStartDate = new Date(scheduledDate);
      windowStartDate.setDate(scheduledDate.getDate() - visitTemplate.windowDaysBefore);

      const windowEndDate = new Date(scheduledDate);
      windowEndDate.setDate(scheduledDate.getDate() + visitTemplate.windowDaysAfter);

      const visit = await this.visitRepository.createVisit({
        surveyId: survey.surveyId,
        clinicalStudyId: request.clinicalStudyId,
        organizationId: request.organizationId,
        patientId: request.patientId,
        visitNumber: visitTemplate.visitNumber,
        visitType: visitTemplate.visitType,
        visitName: visitTemplate.visitName,
        scheduledDate: scheduledDate.toISOString(),
        windowStartDate: windowStartDate.toISOString(),
        windowEndDate: windowEndDate.toISOString(),
        status: 'scheduled',
        completionPercentage: 0,
        requiredExaminations: visitTemplate.requiredExaminations,
        optionalExaminations: visitTemplate.optionalExaminations,
        examinationOrder: visitTemplate.examinationOrder,
        completedExaminations: [],
        skippedExaminations: [],
        conductedBy: request.conductedBy || request.assignedBy
      });

      visits.push(visit);
    }

    // Update patient's participating studies
    if (!patient.participatingStudies.includes(request.clinicalStudyId)) {
      await this.patientRepository.update(request.patientId, {
        participatingStudies: [...patient.participatingStudies, request.clinicalStudyId]
      });
    }

    return {
      survey,
      visits,
      summary: {
        totalVisits: visits.length,
        generatedVisits: visits.length,
        estimatedCompletionDate: expectedCompletionDate.toISOString()
      }
    };
  }

  /**
   * Get survey by ID with related data
   */
  async getSurveyWithDetails(surveyId: string): Promise<{
    survey: SurveyRecord;
    clinicalStudy: ClinicalStudyRecord;
    patient: PatientRecord;
    visits: VisitRecord[];
  }> {
    const survey = await this.surveyRepository.findById(surveyId);
    if (!survey) {
      throw new Error(`Survey not found: ${surveyId}`);
    }

    const [clinicalStudy, patient, visitsResult] = await Promise.all([
      this.clinicalStudyRepository.findById(survey.clinicalStudyId),
      this.patientRepository.findById(survey.patientId),
      this.visitRepository.findBySurvey(surveyId)
    ]);

    if (!clinicalStudy) {
      throw new Error(`Clinical study not found: ${survey.clinicalStudyId}`);
    }

    if (!patient) {
      throw new Error(`Patient not found: ${survey.patientId}`);
    }

    return {
      survey,
      clinicalStudy,
      patient,
      visits: visitsResult.visits
    };
  }

  /**
   * Update survey progress based on visit completions
   */
  async updateSurveyProgress(surveyId: string): Promise<SurveyRecord> {
    const visitsResult = await this.visitRepository.findBySurvey(surveyId);
    const visits = visitsResult.visits;

    const completedVisits = visits.filter(v => v.status === 'completed').length;
    const totalVisits = visits.length;
    const completionPercentage = totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0;

    // Determine survey status based on completion
    let status: SurveyRecord['status'] = 'active';
    if (completionPercentage === 100) {
      status = 'completed';
    }

    return await this.surveyRepository.update(surveyId, {
      completedVisits,
      totalVisits,
      completionPercentage,
      status
    });
  }

  /**
   * Get surveys by organization with filtering and pagination
   */
  async getSurveysByOrganization(
    organizationId: string, 
    filters?: {
      status?: SurveyRecord['status'];
      clinicalStudyId?: string;
      patientId?: string;
    },
    pagination?: {
      limit?: number;
      exclusiveStartKey?: any;
    }
  ): Promise<{
    surveys: SurveyRecord[];
    lastEvaluatedKey?: any;
  }> {
    const result = await this.surveyRepository.findByOrganization(organizationId, pagination);
    let surveys = result.surveys;

    // Apply filters
    if (filters?.status) {
      surveys = surveys.filter(s => s.status === filters.status);
    }
    if (filters?.clinicalStudyId) {
      surveys = surveys.filter(s => s.clinicalStudyId === filters.clinicalStudyId);
    }
    if (filters?.patientId) {
      surveys = surveys.filter(s => s.patientId === filters.patientId);
    }

    return {
      surveys,
      lastEvaluatedKey: result.lastEvaluatedKey
    };
  }

  /**
   * Get surveys by clinical study with filtering
   */
  async getSurveysByStudy(
    clinicalStudyId: string,
    filters?: {
      status?: SurveyRecord['status'];
      organizationId?: string;
    }
  ): Promise<SurveyRecord[]> {
    const result = await this.surveyRepository.findByStudy(clinicalStudyId);
    let surveys = result.surveys;

    // Apply filters
    if (filters?.status) {
      surveys = surveys.filter(s => s.status === filters.status);
    }
    if (filters?.organizationId) {
      surveys = surveys.filter(s => s.organizationId === filters.organizationId);
    }

    return surveys;
  }

  /**
   * Assign existing patient to survey in clinical study
   */
  async assignExistingPatientToStudy(request: CreateSurveyFromTemplateRequest): Promise<SurveyGenerationResult> {
    // This is essentially the same as createSurveyFromTemplate
    // but with additional validation for existing patient assignment
    return await this.createSurveyFromTemplate(request);
  }

  /**
   * Withdraw survey and related visits
   */
  async withdrawSurvey(surveyId: string, reason?: string): Promise<SurveyRecord> {
    // Update survey status
    const survey = await this.surveyRepository.updateStatus(surveyId, 'withdrawn');

    // Update all related visits to cancelled
    const visitsResult = await this.visitRepository.findBySurvey(surveyId);
    const activeVisits = visitsResult.visits.filter(v => 
      v.status === 'scheduled' || v.status === 'in_progress'
    );

    for (const visit of activeVisits) {
      await this.visitRepository.updateStatus(visit.visitId, 'cancelled');
      if (reason) {
        await this.visitRepository.update(visit.visitId, {
          deviationReason: `Survey withdrawn: ${reason}`
        });
      }
    }

    return survey;
  }

  /**
   * Get survey statistics for dashboard
   */
  async getSurveyDashboardStats(organizationId?: string, clinicalStudyId?: string): Promise<{
    totalSurveys: number;
    activeSurveys: number;
    completedSurveys: number;
    withdrawnSurveys: number;
    averageCompletion: number;
    recentActivity: Array<{
      surveyId: string;
      patientCode: string;
      studyName: string;
      status: string;
      lastUpdate: string;
    }>;
  }> {
    let surveys: SurveyRecord[] = [];

    if (organizationId && clinicalStudyId) {
      // Get surveys for specific organization and study
      surveys = await this.getSurveysByStudy(clinicalStudyId, { organizationId });
    } else if (organizationId) {
      // Get all surveys for organization
      const result = await this.surveyRepository.findByOrganization(organizationId);
      surveys = result.surveys;
    } else if (clinicalStudyId) {
      // Get all surveys for study
      const result = await this.surveyRepository.findByStudy(clinicalStudyId);
      surveys = result.surveys;
    } else {
      throw new Error('Either organizationId or clinicalStudyId must be provided');
    }

    const stats = {
      totalSurveys: surveys.length,
      activeSurveys: surveys.filter(s => s.status === 'active').length,
      completedSurveys: surveys.filter(s => s.status === 'completed').length,
      withdrawnSurveys: surveys.filter(s => s.status === 'withdrawn').length,
      averageCompletion: 0,
      recentActivity: [] as Array<{
        surveyId: string;
        patientCode: string;
        studyName: string;
        status: string;
        lastUpdate: string;
      }>
    };

    if (surveys.length > 0) {
      const totalCompletion = surveys.reduce((sum, s) => sum + s.completionPercentage, 0);
      stats.averageCompletion = Math.round(totalCompletion / surveys.length);

      // Get recent activity (last 10 updated surveys)
      const recentSurveys = surveys
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10);

      for (const survey of recentSurveys) {
        try {
          const [patient, clinicalStudy] = await Promise.all([
            this.patientRepository.findById(survey.patientId),
            this.clinicalStudyRepository.findById(survey.clinicalStudyId)
          ]);

          stats.recentActivity.push({
            surveyId: survey.surveyId,
            patientCode: patient?.patientCode || 'Unknown',
            studyName: clinicalStudy?.studyName || 'Unknown',
            status: survey.status,
            lastUpdate: survey.updatedAt
          });
        } catch (error) {
          // Skip if patient or study not found
          continue;
        }
      }
    }

    return stats;
  }
}