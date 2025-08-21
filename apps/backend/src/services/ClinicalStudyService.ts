import { ClinicalStudyRepository } from '../repositories/ClinicalStudyRepository.js';
import { SurveyRepository } from '../repositories/SurveyRepository.js';
import { RepositoryFactory } from '../repositories/index.js';
import { ClinicalStudyRecord, VisitTemplate, ExaminationConfig, SurveyRecord } from '@clinical-trial/shared';

export interface CreateClinicalStudyRequest {
  studyName: string;
  studyCode: string;
  description: string;
  startDate: string;
  endDate: string;
  targetOrganizations: string[];
  maxPatientsPerOrganization: number;
  totalTargetPatients: number;
  visitTemplate: VisitTemplate[];
  examinations: ExaminationConfig[];
  protocolVersion: string;
  ethicsApprovalNumber?: string;
  regulatoryApprovals: string[];
  currentPhase: string;
}

export interface UpdateClinicalStudyRequest {
  studyName?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  targetOrganizations?: string[];
  maxPatientsPerOrganization?: number;
  totalTargetPatients?: number;
  visitTemplate?: VisitTemplate[];
  examinations?: ExaminationConfig[];
  status?: ClinicalStudyRecord['status'];
  currentPhase?: string;
  protocolVersion?: string;
  ethicsApprovalNumber?: string;
  regulatoryApprovals?: string[];
}

export interface GenerateSurveyFromTemplateRequest {
  clinicalStudyId: string;
  organizationId: string;
  patientId: string;
  baselineDate: string;
  assignedBy: string;
}

/**
 * Clinical Study Service
 * Handles clinical study protocol management with flexible visit configuration
 */
export class ClinicalStudyService {
  private clinicalStudyRepository: ClinicalStudyRepository;
  private surveyRepository: SurveyRepository;

  constructor() {
    const repositoryFactory = RepositoryFactory.getInstance();
    this.clinicalStudyRepository = repositoryFactory.getClinicalStudyRepository();
    this.surveyRepository = repositoryFactory.getSurveyRepository();
  }

  /**
   * Create a new clinical study with flexible visit configuration
   */
  async createStudy(request: CreateClinicalStudyRequest, createdBy: string): Promise<ClinicalStudyRecord> {
    try {
      // Validate visit template configuration
      this.validateVisitTemplate(request.visitTemplate);
      
      // Validate examination configuration
      this.validateExaminationConfig(request.examinations);

      const studyData: Omit<ClinicalStudyRecord, 'clinicalStudyId' | 'createdAt' | 'updatedAt' | 'entityType'> = {
        ...request,
        status: 'planning',
        enrolledPatients: 0,
        createdBy,
        lastModifiedBy: createdBy,
      };

      return await this.clinicalStudyRepository.createStudy(studyData);
    } catch (error) {
      console.error('Error creating clinical study:', error);
      throw new Error(`Failed to create clinical study: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get clinical study by ID
   */
  async getStudyById(studyId: string): Promise<ClinicalStudyRecord | null> {
    try {
      return await this.clinicalStudyRepository.findById(studyId);
    } catch (error) {
      console.error('Error getting clinical study:', error);
      throw new Error(`Failed to get clinical study: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update clinical study
   */
  async updateStudy(studyId: string, request: UpdateClinicalStudyRequest, updatedBy: string): Promise<ClinicalStudyRecord> {
    try {
      // Validate visit template if provided
      if (request.visitTemplate) {
        this.validateVisitTemplate(request.visitTemplate);
      }

      // Validate examination configuration if provided
      if (request.examinations) {
        this.validateExaminationConfig(request.examinations);
      }

      const updateData = {
        ...request,
        lastModifiedBy: updatedBy,
      };

      return await this.clinicalStudyRepository.update(studyId, updateData);
    } catch (error) {
      console.error('Error updating clinical study:', error);
      throw new Error(`Failed to update clinical study: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get studies by status
   */
  async getStudiesByStatus(status: ClinicalStudyRecord['status']): Promise<ClinicalStudyRecord[]> {
    try {
      return await this.clinicalStudyRepository.findByStatus(status);
    } catch (error) {
      console.error('Error getting studies by status:', error);
      throw new Error(`Failed to get studies by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all clinical studies
   */
  async getAllStudies(): Promise<ClinicalStudyRecord[]> {
    try {
      return await this.clinicalStudyRepository.scanAll();
    } catch (error) {
      console.error('Error getting all studies:', error);
      throw new Error(`Failed to get all studies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get active studies
   */
  async getActiveStudies(): Promise<ClinicalStudyRecord[]> {
    try {
      return await this.clinicalStudyRepository.findActiveStudies();
    } catch (error) {
      console.error('Error getting active studies:', error);
      throw new Error(`Failed to get active studies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get studies by organization
   */
  async getStudiesByOrganization(organizationId: string): Promise<ClinicalStudyRecord[]> {
    try {
      return await this.clinicalStudyRepository.findByOrganization(organizationId);
    } catch (error) {
      console.error('Error getting studies by organization:', error);
      throw new Error(`Failed to get studies by organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update study status
   */
  async updateStudyStatus(studyId: string, status: ClinicalStudyRecord['status'], updatedBy: string): Promise<ClinicalStudyRecord> {
    try {
      return await this.clinicalStudyRepository.update(studyId, { 
        status,
        lastModifiedBy: updatedBy 
      });
    } catch (error) {
      console.error('Error updating study status:', error);
      throw new Error(`Failed to update study status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update visit template configuration
   */
  async updateVisitTemplate(studyId: string, visitTemplate: VisitTemplate[], updatedBy: string): Promise<ClinicalStudyRecord> {
    try {
      this.validateVisitTemplate(visitTemplate);
      return await this.clinicalStudyRepository.updateVisitTemplate(studyId, visitTemplate);
    } catch (error) {
      console.error('Error updating visit template:', error);
      throw new Error(`Failed to update visit template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add organization to study
   */
  async addOrganizationToStudy(studyId: string, organizationId: string): Promise<ClinicalStudyRecord> {
    try {
      return await this.clinicalStudyRepository.addOrganization(studyId, organizationId);
    } catch (error) {
      console.error('Error adding organization to study:', error);
      throw new Error(`Failed to add organization to study: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove organization from study
   */
  async removeOrganizationFromStudy(studyId: string, organizationId: string): Promise<ClinicalStudyRecord> {
    try {
      return await this.clinicalStudyRepository.removeOrganization(studyId, organizationId);
    } catch (error) {
      console.error('Error removing organization from study:', error);
      throw new Error(`Failed to remove organization from study: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate survey from clinical study template
   */
  async generateSurveyFromTemplate(request: GenerateSurveyFromTemplateRequest): Promise<SurveyRecord> {
    try {
      const study = await this.clinicalStudyRepository.findById(request.clinicalStudyId);
      if (!study) {
        throw new Error('Clinical study not found');
      }

      if (study.status !== 'active' && study.status !== 'recruiting') {
        throw new Error('Cannot generate surveys for inactive studies');
      }

      // Calculate expected completion date based on visit template
      const maxDaysFromBaseline = Math.max(
        ...study.visitTemplate.map(visit => 
          visit.scheduledDaysFromBaseline + visit.windowDaysAfter
        )
      );
      
      const baselineDate = new Date(request.baselineDate);
      const expectedCompletionDate = new Date(baselineDate);
      expectedCompletionDate.setDate(expectedCompletionDate.getDate() + maxDaysFromBaseline);

      const surveyData: Omit<SurveyRecord, 'surveyId' | 'createdAt' | 'updatedAt' | 'entityType'> = {
        clinicalStudyId: request.clinicalStudyId,
        organizationId: request.organizationId,
        patientId: request.patientId,
        name: `${study.studyName} - Patient Survey`,
        description: `Survey generated from study template: ${study.studyName}`,
        baselineDate: request.baselineDate,
        expectedCompletionDate: expectedCompletionDate.toISOString(),
        status: 'active',
        completionPercentage: 0,
        totalVisits: study.visitTemplate.length,
        completedVisits: 0,
        assignedBy: request.assignedBy,
      };

      return await this.surveyRepository.createSurvey(surveyData);
    } catch (error) {
      console.error('Error generating survey from template:', error);
      throw new Error(`Failed to generate survey from template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update enrollment count
   */
  async updateEnrollmentCount(studyId: string, enrolledPatients: number): Promise<ClinicalStudyRecord> {
    try {
      return await this.clinicalStudyRepository.updateEnrollmentCount(studyId, enrolledPatients);
    } catch (error) {
      console.error('Error updating enrollment count:', error);
      throw new Error(`Failed to update enrollment count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete clinical study (only for planning status studies)
   */
  async deleteStudy(studyId: string, deletedBy: string): Promise<void> {
    try {
      // First, check if the study exists and is in planning status
      const study = await this.clinicalStudyRepository.findById(studyId);
      if (!study) {
        throw new Error('Clinical study not found');
      }

      if (study.status !== 'planning') {
        throw new Error('Only studies in planning status can be deleted');
      }

      // Check if there are any associated surveys
      const surveys = await this.surveyRepository.findByClinicalStudyId(studyId);
      if (surveys && surveys.length > 0) {
        throw new Error('Cannot delete study with associated surveys. Please remove all surveys first.');
      }

      // Delete the study
      await this.clinicalStudyRepository.deleteById(studyId);
    } catch (error) {
      console.error('Error deleting clinical study:', error);
      throw new Error(`Failed to delete clinical study: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate visit template configuration
   */
  private validateVisitTemplate(visitTemplate: VisitTemplate[]): void {
    if (!visitTemplate || visitTemplate.length === 0) {
      throw new Error('At least one visit must be configured');
    }

    // Check for duplicate visit numbers
    const visitNumbers = visitTemplate.map(visit => visit.visitNumber);
    const uniqueVisitNumbers = new Set(visitNumbers);
    if (visitNumbers.length !== uniqueVisitNumbers.size) {
      throw new Error('Visit numbers must be unique');
    }

    // Validate each visit
    visitTemplate.forEach((visit, index) => {
      if (!visit.visitName || visit.visitName.trim() === '') {
        throw new Error(`Visit ${index + 1}: Visit name is required`);
      }

      if (visit.scheduledDaysFromBaseline < 0) {
        throw new Error(`Visit ${index + 1}: Scheduled days from baseline cannot be negative`);
      }

      if (visit.windowDaysBefore < 0 || visit.windowDaysAfter < 0) {
        throw new Error(`Visit ${index + 1}: Window days cannot be negative`);
      }

      if (!visit.requiredExaminations || visit.requiredExaminations.length === 0) {
        if (!visit.optionalExaminations || visit.optionalExaminations.length === 0) {
          throw new Error(`Visit ${index + 1}: At least one examination (required or optional) must be specified`);
        }
      }

      if (!visit.examinationOrder || visit.examinationOrder.length === 0) {
        throw new Error(`Visit ${index + 1}: Examination order must be specified`);
      }
    });
  }

  /**
   * Validate examination configuration
   */
  private validateExaminationConfig(examinations: ExaminationConfig[]): void {
    if (!examinations || examinations.length === 0) {
      throw new Error('At least one examination must be configured');
    }

    // Check for duplicate examination IDs
    const examinationIds = examinations.map(exam => exam.examinationId);
    const uniqueExaminationIds = new Set(examinationIds);
    if (examinationIds.length !== uniqueExaminationIds.size) {
      throw new Error('Examination IDs must be unique');
    }

    // Validate each examination
    examinations.forEach((exam, index) => {
      if (!exam.examinationId || exam.examinationId.trim() === '') {
        throw new Error(`Examination ${index + 1}: Examination ID is required`);
      }

      if (!exam.examinationName || exam.examinationName.trim() === '') {
        throw new Error(`Examination ${index + 1}: Examination name is required`);
      }

      if (exam.estimatedDuration < 0) {
        throw new Error(`Examination ${index + 1}: Estimated duration cannot be negative`);
      }
    });
  }
}

// Singleton instance
let clinicalStudyServiceInstance: ClinicalStudyService | null = null;

export function getClinicalStudyService(): ClinicalStudyService {
  if (!clinicalStudyServiceInstance) {
    clinicalStudyServiceInstance = new ClinicalStudyService();
  }
  return clinicalStudyServiceInstance;
}