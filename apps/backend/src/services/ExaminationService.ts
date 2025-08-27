import { DraftDataRepository, DraftRecord } from '../repositories/DraftDataRepository.js';
import { BasicInfoRepository, BasicInfoExaminationData } from '../repositories/BasicInfoRepository.js';
import { VASRepository, VASExaminationData } from '../repositories/VASRepository.js';
import { ComparativeScoresRepository, ComparativeScoresExaminationData } from '../repositories/ComparativeScoresRepository.js';
import { LensFluidSurfaceAssessmentRepository, LensFluidSurfaceAssessmentExaminationData } from '../repositories/LensFluidSurfaceAssessmentRepository.js';
import { DR1Repository, DR1ExaminationData } from '../repositories/DR1Repository.js';
import { CorrectedVARepository, CorrectedVAExaminationData } from '../repositories/CorrectedVARepository.js';
import { LensInspectionRepository, LensInspectionExaminationData } from '../repositories/LensInspectionRepository.js';
import { QuestionnaireRepository, QuestionnaireExaminationData } from '../repositories/QuestionnaireRepository.js';
import { VisitRepository } from '../repositories/VisitRepository.js';
import { SurveyRepository } from '../repositories/SurveyRepository.js';
import { BaseExaminationData } from '../repositories/BaseExaminationRepository.js';

export interface SaveDraftRequest {
  formData: {
    [examinationId: string]: {
      right?: any;
      left?: any;
    };
  };
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  examinationOrder: string[];
  autoSaved?: boolean;
}

export interface SubmitExaminationRequest {
  formData: {
    [examinationId: string]: {
      right?: any;
      left?: any;
    };
  };
  completedExaminations: string[];
  conductedBy: string;
}

export interface VisitExaminationConfig {
  visitId: string;
  surveyId: string;
  patientId: string;
  clinicalStudyId: string;
  organizationId: string;
  examinationOrder: string[];
  requiredExaminations: string[];
  optionalExaminations: string[];
  totalSteps: number;
  visitName: string;
  visitType: string;
}

/**
 * Service for managing examination data across all examination types
 * Integrates with DynamoDB repositories and provides unified API
 */
export class ExaminationService {
  private draftRepository: DraftDataRepository;
  private basicInfoRepository: BasicInfoRepository;
  private vasRepository: VASRepository;
  private comparativeRepository: ComparativeScoresRepository;
  private fittingRepository: LensFluidSurfaceAssessmentRepository;
  private dr1Repository: DR1Repository;
  private correctedVARepository: CorrectedVARepository;
  private lensInspectionRepository: LensInspectionRepository;
  private questionnaireRepository: QuestionnaireRepository;
  private visitRepository: VisitRepository;
  private surveyRepository: SurveyRepository;

  constructor() {
    this.draftRepository = new DraftDataRepository();
    this.basicInfoRepository = new BasicInfoRepository();
    this.vasRepository = new VASRepository();
    this.comparativeRepository = new ComparativeScoresRepository();
    this.fittingRepository = new LensFluidSurfaceAssessmentRepository();
    this.dr1Repository = new DR1Repository();
    this.correctedVARepository = new CorrectedVARepository();
    this.lensInspectionRepository = new LensInspectionRepository();
    this.questionnaireRepository = new QuestionnaireRepository();
    this.visitRepository = new VisitRepository();
    this.surveyRepository = new SurveyRepository();
  }

  /**
   * Get visit configuration for examination setup
   */
  async getVisitExaminationConfig(visitId: string): Promise<VisitExaminationConfig> {
    // For now, we'll use a known surveyId to find the visit
    // In a real implementation, we might need to search across all surveys
    // or maintain a separate index for visitId
    const surveyId = 'survey-test-001'; // This should come from request context
    
    const visit = await this.visitRepository.findById(surveyId, visitId);
    if (!visit) {
      throw new Error(`Visit not found: ${visitId}`);
    }

    const survey = await this.surveyRepository.findById(visit.surveyId);
    if (!survey) {
      throw new Error(`Survey not found: ${visit.surveyId}`);
    }

    return {
      visitId: visit.visitId,
      surveyId: visit.surveyId,
      patientId: visit.patientId,
      clinicalStudyId: visit.clinicalStudyId,
      organizationId: visit.organizationId,
      examinationOrder: visit.examinationOrder,
      requiredExaminations: visit.requiredExaminations,
      optionalExaminations: visit.optionalExaminations,
      totalSteps: visit.examinationOrder.length,
      visitName: visit.visitName,
      visitType: visit.visitType,
    };
  }

  /**
   * Load draft data for a visit
   */
  async loadDraft(visitId: string): Promise<DraftRecord | null> {
    return await this.draftRepository.getDraft(visitId);
  }

  /**
   * Save draft data
   */
  async saveDraft(visitId: string, draftData: SaveDraftRequest): Promise<DraftRecord> {
    return await this.draftRepository.saveDraft(
      visitId,
      draftData.formData,
      draftData.currentStep,
      draftData.totalSteps,
      draftData.completedSteps,
      draftData.examinationOrder,
      draftData.autoSaved || false
    );
  }

  /**
   * Auto-save draft data with conflict detection
   */
  async autoSaveDraft(visitId: string, updates: Partial<SaveDraftRequest>): Promise<{
    success: boolean;
    conflict?: boolean;
    latestDraft?: DraftRecord;
  }> {
    return await this.draftRepository.autoSave(visitId, updates);
  }

  /**
   * Clear draft data after successful submission
   */
  async clearDraft(visitId: string): Promise<void> {
    await this.draftRepository.clearDraft(visitId);
  }

  /**
   * Get draft statistics
   */
  async getDraftStats(visitId: string) {
    return await this.draftRepository.getDraftStats(visitId);
  }

  /**
   * Save examination data for a specific examination type
   */
  async saveExaminationData(
    visitId: string,
    examinationId: string,
    rightEyeData: any,
    leftEyeData: any,
    surveyId: string,
    patientId: string,
    clinicalStudyId: string,
    organizationId: string
  ): Promise<{ right?: any; left?: any }> {
    const repository = this.getRepositoryByExaminationId(examinationId);
    
    const result = await repository.batchCreateBothEyes(
      visitId,
      surveyId,
      patientId,
      clinicalStudyId,
      organizationId,
      rightEyeData,
      leftEyeData
    );

    return result;
  }

  /**
   * Update examination data for specific eye
   */
  async updateExaminationData(
    visitId: string,
    examinationId: string,
    eyeside: 'right' | 'left',
    updateData: any
  ): Promise<any> {
    const repository = this.getRepositoryByExaminationId(examinationId);
    const examinations = await repository.findByVisit(visitId);
    
    const examination = examinations.find(exam => exam.eyeside === (eyeside === 'right' ? 'Right' : 'Left'));
    if (!examination) {
      throw new Error(`Examination not found for ${eyeside} eye`);
    }

    const examinationIdField = this.getExaminationIdField(examinationId);
    return await repository.updateExamination(visitId, examination[examinationIdField], updateData);
  }

  /**
   * Get all examination data for a visit
   */
  async getAllExaminationData(visitId: string): Promise<{
    [examinationId: string]: {
      right?: any;
      left?: any;
    };
  }> {
    const config = await this.getVisitExaminationConfig(visitId);
    const result: any = {};

    for (const examinationId of config.examinationOrder) {
      const repository = this.getRepositoryByExaminationId(examinationId);
      const data = await repository.getBothEyesData(visitId);
      result[examinationId] = data;
    }

    return result;
  }

  /**
   * Submit all examination data and clear draft
   */
  async submitExaminationData(
    visitId: string,
    formData: { [examinationId: string]: { right?: any; left?: any } },
    completedExaminations: string[],
    conductedBy: string
  ): Promise<{ success: boolean; savedExaminations: string[] }> {
    const config = await this.getVisitExaminationConfig(visitId);
    const savedExaminations: string[] = [];

    try {
      // Save all examination data to individual tables
      for (const [examinationId, examData] of Object.entries(formData)) {
        if (examData.right || examData.left) {
          await this.saveExaminationData(
            visitId,
            examinationId,
            examData.right,
            examData.left,
            config.surveyId,
            config.patientId,
            config.clinicalStudyId,
            config.organizationId
          );
          savedExaminations.push(examinationId);
        }
      }

      // Update visit status
      await this.visitRepository.update(config.surveyId, {
        status: 'completed',
        completedExaminations: completedExaminations,
        completionPercentage: 100,
        conductedBy,
      }, visitId);

      // Clear draft data
      await this.clearDraft(visitId);

      return { success: true, savedExaminations };
    } catch (error) {
      console.error('Failed to submit examination data:', error);
      throw new Error('Failed to submit examination data');
    }
  }

  /**
   * Get examination data comparison across visits for trend analysis
   */
  async getExaminationComparison(
    surveyId: string,
    examinationId: string,
    eyeside: 'right' | 'left'
  ): Promise<any[]> {
    const repository = this.getRepositoryByExaminationId(examinationId);
    const eyeSideFormatted = eyeside === 'right' ? 'Right' : 'Left';
    return await repository.compareVisits(surveyId, eyeSideFormatted);
  }

  /**
   * Validate examination data before submission
   */
  async validateExaminationData(visitId: string) {
    return await this.draftRepository.validateFormData(visitId);
  }

  /**
   * Get completion summary for a visit
   */
  async getCompletionSummary(visitId: string) {
    return await this.draftRepository.getCompletionSummary(visitId);
  }

  /**
   * Initialize draft for a new visit
   */
  async initializeDraft(visitId: string): Promise<DraftRecord> {
    const config = await this.getVisitExaminationConfig(visitId);
    return await this.draftRepository.initializeDraft(visitId, config.examinationOrder);
  }

  /**
   * Update specific examination data in draft
   */
  async updateDraftExaminationData(
    visitId: string,
    examinationId: string,
    eyeside: 'right' | 'left',
    data: any
  ): Promise<DraftRecord> {
    return await this.draftRepository.updateExaminationData(visitId, examinationId, eyeside, data);
  }

  /**
   * Batch update both eyes data in draft
   */
  async updateDraftBothEyes(
    visitId: string,
    examinationId: string,
    data: { right?: any; left?: any }
  ): Promise<DraftRecord> {
    return await this.draftRepository.batchUpdateEyeData(visitId, examinationId, data);
  }

  /**
   * Mark examination step as completed in draft
   */
  async completeExaminationStep(visitId: string, stepId: string): Promise<DraftRecord> {
    return await this.draftRepository.completeStep(visitId, stepId);
  }

  /**
   * Update draft progress
   */
  async updateDraftProgress(
    visitId: string,
    currentStep: number,
    completedSteps: string[]
  ): Promise<DraftRecord> {
    return await this.draftRepository.updateProgress(visitId, currentStep, completedSteps);
  }

  /**
   * Get repository by examination ID
   */
  private getRepositoryByExaminationId(examinationId: string): any {
    switch (examinationId) {
      case 'basic-info':
        return this.basicInfoRepository;
      case 'vas':
        return this.vasRepository;
      case 'comparative':
        return this.comparativeRepository;
      case 'fitting':
        return this.fittingRepository;
      case 'dr1':
        return this.dr1Repository;
      case 'corrected-va':
        return this.correctedVARepository;
      case 'lens-inspection':
        return this.lensInspectionRepository;
      case 'questionnaire':
        return this.questionnaireRepository;
      default:
        throw new Error(`Unknown examination type: ${examinationId}`);
    }
  }

  /**
   * Get examination ID field name by examination ID
   */
  private getExaminationIdField(examinationId: string): string {
    switch (examinationId) {
      case 'basic-info':
        return 'basicInfoId';
      case 'vas':
        return 'vasId';
      case 'comparative':
        return 'comparativeScoresId';
      case 'fitting':
        return 'fittingId';
      case 'dr1':
        return 'dr1Id';
      case 'corrected-va':
        return 'correctedVAId';
      case 'lens-inspection':
        return 'lensInspectionId';
      case 'questionnaire':
        return 'questionnaireId';
      default:
        throw new Error(`Unknown examination type: ${examinationId}`);
    }
  }
}