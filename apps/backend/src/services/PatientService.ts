import { PatientRepository } from '../repositories/PatientRepository.js';
import { SurveyRepository } from '../repositories/SurveyRepository.js';
import { ClinicalStudyRepository } from '../repositories/ClinicalStudyRepository.js';
import { RepositoryFactory } from '../repositories/index.js';
import { PatientRecord, SurveyRecord } from '@clinical-trial/shared';

export interface CreatePatientRequest {
  patientCode: string;
  patientInitials?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  registeredOrganizationId: string;
  medicalHistory?: string[];
  currentMedications?: string[];
  allergies?: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    emergencyContact?: string;
  };
}

export interface UpdatePatientRequest {
  patientInitials?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  medicalHistory?: string[];
  currentMedications?: string[];
  allergies?: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    emergencyContact?: string;
  };
  status?: PatientRecord['status'];
}

export interface AssignPatientToSurveyRequest {
  patientId: string;
  clinicalStudyId: string;
  organizationId: string;
  baselineDate: string;
  assignedBy: string;
}

export interface PatientSearchOptions {
  patientCodePrefix?: string;
  status?: PatientRecord['status'];
  limit?: number;
  exclusiveStartKey?: any;
}

/**
 * Patient Service
 * Handles patient master management with organization-based filtering
 */
export class PatientService {
  private patientRepository: PatientRepository;
  private surveyRepository: SurveyRepository;
  private clinicalStudyRepository: ClinicalStudyRepository;

  constructor() {
    const repositoryFactory = RepositoryFactory.getInstance();
    this.patientRepository = repositoryFactory.getPatientRepository();
    this.surveyRepository = repositoryFactory.getSurveyRepository();
    this.clinicalStudyRepository = repositoryFactory.getClinicalStudyRepository();
  }

  /**
   * Create a new patient
   */
  async createPatient(request: CreatePatientRequest, createdBy: string): Promise<PatientRecord> {
    try {
      // Check if patient code already exists in the organization
      const existingPatient = await this.patientRepository.findByCodeInOrganization(
        request.registeredOrganizationId,
        request.patientCode
      );

      if (existingPatient) {
        throw new Error(`Patient with code ${request.patientCode} already exists in this organization`);
      }

      // Validate patient code format
      this.validatePatientCode(request.patientCode);

      // Validate email format if provided
      if (request.contactInfo?.email) {
        this.validateEmail(request.contactInfo.email);
      }

      const patientData: Omit<PatientRecord, 'patientId' | 'createdAt' | 'updatedAt' | 'entityType'> = {
        ...request,
        registrationDate: new Date().toISOString(),
        status: 'active',
        participatingStudies: [],
        createdBy,
        lastModifiedBy: createdBy,
      };

      return await this.patientRepository.createPatient(patientData);
    } catch (error) {
      console.error('Error creating patient:', error);
      throw new Error(`Failed to create patient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get patient by ID
   */
  async getPatientById(patientId: string): Promise<PatientRecord | null> {
    try {
      return await this.patientRepository.findById(patientId);
    } catch (error) {
      console.error('Error getting patient:', error);
      throw new Error(`Failed to get patient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update patient
   */
  async updatePatient(patientId: string, request: UpdatePatientRequest, updatedBy: string): Promise<PatientRecord> {
    try {
      // Validate email format if provided
      if (request.contactInfo?.email) {
        this.validateEmail(request.contactInfo.email);
      }

      const updateData = {
        ...request,
        lastModifiedBy: updatedBy,
      };

      return await this.patientRepository.update(patientId, updateData);
    } catch (error) {
      console.error('Error updating patient:', error);
      throw new Error(`Failed to update patient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search patients by organization with optional filters
   */
  async searchPatientsByOrganization(
    organizationId: string,
    options: PatientSearchOptions = {}
  ): Promise<{ patients: PatientRecord[]; lastEvaluatedKey?: any }> {
    try {
      let patients: PatientRecord[];
      let lastEvaluatedKey: any;

      if (options.patientCodePrefix && options.patientCodePrefix.trim() !== '') {
        // Search by patient code prefix (only if not empty)
        patients = await this.patientRepository.searchByCodeInOrganization(
          organizationId,
          options.patientCodePrefix.trim()
        );
      } else {
        // Get all patients for organization
        const result = await this.patientRepository.findByOrganization(organizationId, {
          limit: options.limit,
          exclusiveStartKey: options.exclusiveStartKey,
        });
        patients = result.patients;
        lastEvaluatedKey = result.lastEvaluatedKey;
      }

      // Filter by status if specified
      if (options.status) {
        patients = patients.filter(patient => patient.status === options.status);
      }

      return { patients, lastEvaluatedKey };
    } catch (error) {
      console.error('Error searching patients:', error);
      throw new Error(`Failed to search patients: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get patient by code within organization
   */
  async getPatientByCodeInOrganization(organizationId: string, patientCode: string): Promise<PatientRecord | null> {
    try {
      return await this.patientRepository.findByCodeInOrganization(organizationId, patientCode);
    } catch (error) {
      console.error('Error getting patient by code:', error);
      throw new Error(`Failed to get patient by code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update patient status
   */
  async updatePatientStatus(patientId: string, status: PatientRecord['status'], updatedBy: string): Promise<PatientRecord> {
    try {
      const updatedPatient = await this.patientRepository.updateStatus(patientId, status);
      
      // Update lastModifiedBy
      return await this.patientRepository.update(patientId, { lastModifiedBy: updatedBy });
    } catch (error) {
      console.error('Error updating patient status:', error);
      throw new Error(`Failed to update patient status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update patient medical information
   */
  async updatePatientMedicalInfo(
    patientId: string,
    medicalInfo: {
      medicalHistory?: string[];
      currentMedications?: string[];
      allergies?: string[];
    },
    updatedBy: string
  ): Promise<PatientRecord> {
    try {
      const updatedPatient = await this.patientRepository.updateMedicalInfo(patientId, medicalInfo);
      
      // Update lastModifiedBy
      return await this.patientRepository.update(patientId, { lastModifiedBy: updatedBy });
    } catch (error) {
      console.error('Error updating patient medical info:', error);
      throw new Error(`Failed to update patient medical info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update patient contact information
   */
  async updatePatientContactInfo(
    patientId: string,
    contactInfo: PatientRecord['contactInfo'],
    updatedBy: string
  ): Promise<PatientRecord> {
    try {
      // Validate email format if provided
      if (contactInfo?.email) {
        this.validateEmail(contactInfo.email);
      }

      const updatedPatient = await this.patientRepository.updateContactInfo(patientId, contactInfo);
      
      // Update lastModifiedBy
      return await this.patientRepository.update(patientId, { lastModifiedBy: updatedBy });
    } catch (error) {
      console.error('Error updating patient contact info:', error);
      throw new Error(`Failed to update patient contact info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Assign existing patient to survey (clinical study)
   */
  async assignPatientToSurvey(request: AssignPatientToSurveyRequest): Promise<SurveyRecord> {
    try {
      // Verify patient exists
      const patient = await this.patientRepository.findById(request.patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Verify clinical study exists and is active
      const study = await this.clinicalStudyRepository.findById(request.clinicalStudyId);
      if (!study) {
        throw new Error('Clinical study not found');
      }

      if (study.status !== 'active' && study.status !== 'recruiting') {
        throw new Error('Cannot assign patients to inactive studies');
      }

      // Verify organization is part of the study
      if (!study.targetOrganizations.includes(request.organizationId)) {
        throw new Error('Organization is not part of this clinical study');
      }

      // Verify patient belongs to the organization
      if (patient.registeredOrganizationId !== request.organizationId) {
        throw new Error('Patient does not belong to this organization');
      }

      // Check if patient is already assigned to this study
      const existingSurveys = await this.surveyRepository.findByPatient(request.patientId);
      const existingStudySurvey = existingSurveys.find(survey => survey.clinicalStudyId === request.clinicalStudyId);
      
      if (existingStudySurvey) {
        throw new Error('Patient is already assigned to this clinical study');
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

      // Create survey
      const surveyData: Omit<SurveyRecord, 'surveyId' | 'createdAt' | 'updatedAt' | 'entityType'> = {
        clinicalStudyId: request.clinicalStudyId,
        organizationId: request.organizationId,
        patientId: request.patientId,
        name: `${study.studyName} - ${patient.patientCode}`,
        description: `Survey for patient ${patient.patientCode} in study ${study.studyName}`,
        baselineDate: request.baselineDate,
        expectedCompletionDate: expectedCompletionDate.toISOString(),
        status: 'active',
        completionPercentage: 0,
        totalVisits: study.visitTemplate.length,
        completedVisits: 0,
        assignedBy: request.assignedBy,
      };

      const survey = await this.surveyRepository.createSurvey(surveyData);

      // Add study to patient's participating studies
      await this.patientRepository.addParticipatingStudy(request.patientId, request.clinicalStudyId);

      return survey;
    } catch (error) {
      console.error('Error assigning patient to survey:', error);
      throw new Error(`Failed to assign patient to survey: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove patient from study
   */
  async removePatientFromStudy(patientId: string, studyId: string, updatedBy: string): Promise<PatientRecord> {
    try {
      // Update patient's participating studies
      const updatedPatient = await this.patientRepository.removeParticipatingStudy(patientId, studyId);
      
      // Update lastModifiedBy
      return await this.patientRepository.update(patientId, { lastModifiedBy: updatedBy });
    } catch (error) {
      console.error('Error removing patient from study:', error);
      throw new Error(`Failed to remove patient from study: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get patient participation tracking
   */
  async getPatientParticipation(patientId: string): Promise<{
    patient: PatientRecord;
    surveys: SurveyRecord[];
    totalStudies: number;
    activeStudies: number;
    completedStudies: number;
  }> {
    try {
      const patient = await this.patientRepository.findById(patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      const surveys = await this.surveyRepository.findByPatient(patientId);

      return {
        patient,
        surveys,
        totalStudies: patient.participatingStudies.length,
        activeStudies: surveys.filter(s => s.status === 'active').length,
        completedStudies: surveys.filter(s => s.status === 'completed').length,
      };
    } catch (error) {
      console.error('Error getting patient participation:', error);
      throw new Error(`Failed to get patient participation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get organization patient statistics
   */
  async getOrganizationPatientStatistics(organizationId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    withdrawn: number;
    completed: number;
    totalParticipatingStudies: number;
  }> {
    try {
      const stats = await this.patientRepository.getOrganizationPatientStats(organizationId);
      
      // Get total participating studies count
      const result = await this.patientRepository.findByOrganization(organizationId);
      const totalParticipatingStudies = result.patients.reduce(
        (total, patient) => total + patient.participatingStudies.length,
        0
      );

      return {
        ...stats,
        totalParticipatingStudies,
      };
    } catch (error) {
      console.error('Error getting organization patient statistics:', error);
      throw new Error(`Failed to get organization patient statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate patient code format
   */
  private validatePatientCode(patientCode: string): void {
    // Patient code should be alphanumeric and between 3-20 characters
    const patientCodeRegex = /^[A-Za-z0-9-_]{3,20}$/;
    if (!patientCodeRegex.test(patientCode)) {
      throw new Error('Patient code must be 3-20 characters long and contain only letters, numbers, hyphens, and underscores');
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
}

// Singleton instance
let patientServiceInstance: PatientService | null = null;

export function getPatientService(): PatientService {
  if (!patientServiceInstance) {
    patientServiceInstance = new PatientService();
  }
  return patientServiceInstance;
}