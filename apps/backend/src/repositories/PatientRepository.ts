import { BaseRepository } from './BaseRepository.js';
import { tableNames, indexNames } from '../config/database.js';
import { PatientRecord } from '@clinical-trial/shared';

/**
 * Repository for Patients table operations
 * Handles patient master management with organization-based filtering
 */
export class PatientRepository extends BaseRepository<PatientRecord> {
  constructor() {
    super(tableNames.patients);
  }

  protected getPrimaryKeyName(): string {
    return 'patientId';
  }

  protected getSortKeyName(): string | null {
    return null;
  }

  protected getIndexPartitionKeyName(indexName: string): string | null {
    switch (indexName) {
      case indexNames.organizationIndex:
        return 'registeredOrganizationId';
      default:
        return null;
    }
  }

  protected getIndexSortKeyName(indexName: string): string | null {
    switch (indexName) {
      case indexNames.organizationIndex:
        return 'patientCode';
      default:
        return null;
    }
  }

  /**
   * Create a new patient with generated ID
   */
  async createPatient(patientData: Omit<PatientRecord, 'patientId' | 'createdAt' | 'updatedAt' | 'entityType'>): Promise<PatientRecord> {
    const now = new Date().toISOString();
    const patientId = `patient-${patientData.patientCode}-${Date.now()}`;

    const patient: PatientRecord = {
      ...patientData,
      patientId,
      entityType: 'patient',
      createdAt: now,
      updatedAt: now,
    };

    return await this.create(patient);
  }

  /**
   * Find patients by organization (optimized with GSI)
   */
  async findByOrganization(organizationId: string, options?: {
    limit?: number;
    exclusiveStartKey?: any;
  }): Promise<{ patients: PatientRecord[]; lastEvaluatedKey?: any }> {
    const result = await this.queryByPartitionKey(organizationId, {
      indexName: indexNames.organizationIndex,
      limit: options?.limit,
      exclusiveStartKey: options?.exclusiveStartKey,
    });

    return {
      patients: result.items,
      lastEvaluatedKey: result.lastEvaluatedKey,
    };
  }

  /**
   * Search patients by code within organization
   */
  async searchByCodeInOrganization(
    organizationId: string, 
    patientCodePrefix: string
  ): Promise<PatientRecord[]> {
    const result = await this.queryByPartitionKey(organizationId, {
      indexName: indexNames.organizationIndex,
      sortKeyCondition: 'begins_with',
      sortKeyValue: patientCodePrefix,
    });

    return result.items;
  }

  /**
   * Find patient by code within organization
   */
  async findByCodeInOrganization(
    organizationId: string, 
    patientCode: string
  ): Promise<PatientRecord | null> {
    const result = await this.queryByPartitionKey(organizationId, {
      indexName: indexNames.organizationIndex,
      sortKeyCondition: '=',
      sortKeyValue: patientCode,
    });

    return result.items[0] || null;
  }

  /**
   * Find patients by status within organization
   */
  async findByStatusInOrganization(
    organizationId: string, 
    status: PatientRecord['status']
  ): Promise<PatientRecord[]> {
    const result = await this.queryByPartitionKey(organizationId, {
      indexName: indexNames.organizationIndex,
    });

    // Filter by status (since we can't use multiple conditions in GSI)
    return result.items.filter(patient => patient.status === status);
  }

  /**
   * Add study to patient's participating studies
   */
  async addParticipatingStudy(patientId: string, studyId: string): Promise<PatientRecord> {
    const patient = await this.findById(patientId);
    if (!patient) {
      throw new Error(`Patient ${patientId} not found`);
    }

    const updatedStudies = [...patient.participatingStudies];
    if (!updatedStudies.includes(studyId)) {
      updatedStudies.push(studyId);
    }

    return await this.update(patientId, { participatingStudies: updatedStudies });
  }

  /**
   * Remove study from patient's participating studies
   */
  async removeParticipatingStudy(patientId: string, studyId: string): Promise<PatientRecord> {
    const patient = await this.findById(patientId);
    if (!patient) {
      throw new Error(`Patient ${patientId} not found`);
    }

    const updatedStudies = patient.participatingStudies.filter(id => id !== studyId);
    return await this.update(patientId, { participatingStudies: updatedStudies });
  }

  /**
   * Update patient status
   */
  async updateStatus(patientId: string, status: PatientRecord['status']): Promise<PatientRecord> {
    return await this.update(patientId, { status });
  }

  /**
   * Update patient medical information
   */
  async updateMedicalInfo(
    patientId: string, 
    medicalInfo: {
      medicalHistory?: string[];
      currentMedications?: string[];
      allergies?: string[];
    }
  ): Promise<PatientRecord> {
    return await this.update(patientId, medicalInfo);
  }

  /**
   * Update patient contact information
   */
  async updateContactInfo(
    patientId: string, 
    contactInfo: PatientRecord['contactInfo']
  ): Promise<PatientRecord> {
    return await this.update(patientId, { contactInfo });
  }

  /**
   * Get patient statistics for organization
   */
  async getOrganizationPatientStats(organizationId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    withdrawn: number;
    completed: number;
  }> {
    const result = await this.findByOrganization(organizationId);
    const patients = result.patients;

    return {
      total: patients.length,
      active: patients.filter(p => p.status === 'active').length,
      inactive: patients.filter(p => p.status === 'inactive').length,
      withdrawn: patients.filter(p => p.status === 'withdrawn').length,
      completed: patients.filter(p => p.status === 'completed').length,
    };
  }
}