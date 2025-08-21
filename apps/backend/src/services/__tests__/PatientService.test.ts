import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PatientService } from '../PatientService.js';
import { PatientRepository } from '../../repositories/PatientRepository.js';
import { SurveyRepository } from '../../repositories/SurveyRepository.js';
import { ClinicalStudyRepository } from '../../repositories/ClinicalStudyRepository.js';
import { PatientRecord, SurveyRecord, ClinicalStudyRecord } from '@clinical-trial/shared';

// Mock dependencies
vi.mock('../../repositories/index.js', () => ({
  RepositoryFactory: {
    getInstance: () => ({
      getPatientRepository: () => mockPatientRepository,
      getSurveyRepository: () => mockSurveyRepository,
      getClinicalStudyRepository: () => mockClinicalStudyRepository
    })
  }
}));

// Mock implementations
const mockPatientRepository = {
  createPatient: vi.fn(),
  findById: vi.fn(),
  findByCodeInOrganization: vi.fn(),
  update: vi.fn(),
  findByOrganization: vi.fn(),
  searchByCodeInOrganization: vi.fn(),
  updateStatus: vi.fn(),
  updateMedicalInfo: vi.fn(),
  updateContactInfo: vi.fn(),
  addParticipatingStudy: vi.fn(),
  removeParticipatingStudy: vi.fn(),
  getOrganizationPatientStats: vi.fn(),
} as unknown as PatientRepository;

const mockSurveyRepository = {
  createSurvey: vi.fn(),
  findByPatient: vi.fn(),
} as unknown as SurveyRepository;

const mockClinicalStudyRepository = {
  findById: vi.fn(),
} as unknown as ClinicalStudyRepository;

// Test data
const mockPatient: PatientRecord = {
  patientId: 'patient-test-123',
  patientCode: 'P001',
  patientInitials: 'T.P.',
  dateOfBirth: '1990-01-01T00:00:00Z',
  gender: 'male',
  registeredOrganizationId: 'org-test-123',
  registrationDate: '2024-01-01T00:00:00Z',
  medicalHistory: ['Hypertension'],
  currentMedications: ['Lisinopril'],
  allergies: ['Penicillin'],
  contactInfo: {
    phone: '03-1234-5678',
    email: 'patient@example.com',
    emergencyContact: 'Emergency Contact',
  },
  status: 'active',
  participatingStudies: ['study-test-123'],
  createdBy: 'user-admin-123',
  lastModifiedBy: 'user-admin-123',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  entityType: 'patient',
};

const mockClinicalStudy: ClinicalStudyRecord = {
  clinicalStudyId: 'study-test-123',
  studyName: 'Test Clinical Study',
  studyCode: 'TEST001',
  description: 'Test study description',
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-12-31T23:59:59Z',
  targetOrganizations: ['org-test-123'],
  maxPatientsPerOrganization: 50,
  totalTargetPatients: 100,
  visitTemplate: [
    {
      visitNumber: 1,
      visitType: 'baseline',
      visitName: 'Baseline Visit',
      scheduledDaysFromBaseline: 0,
      windowDaysBefore: 0,
      windowDaysAfter: 3,
      requiredExaminations: ['basic_info'],
      optionalExaminations: [],
      examinationOrder: ['basic_info'],
      isRequired: true,
    },
    {
      visitNumber: 2,
      visitType: '1week',
      visitName: '1 Week Follow-up',
      scheduledDaysFromBaseline: 7,
      windowDaysBefore: 2,
      windowDaysAfter: 3,
      requiredExaminations: ['vas'],
      optionalExaminations: [],
      examinationOrder: ['vas'],
      isRequired: true,
    },
  ],
  examinations: [],
  status: 'active',
  currentPhase: 'Phase I',
  enrolledPatients: 0,
  protocolVersion: '1.0',
  regulatoryApprovals: [],
  createdBy: 'user-admin-123',
  lastModifiedBy: 'user-admin-123',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  entityType: 'clinical-study',
};

const mockSurvey: SurveyRecord = {
  surveyId: 'survey-patient-123-study-123',
  clinicalStudyId: 'study-test-123',
  organizationId: 'org-test-123',
  patientId: 'patient-test-123',
  name: 'Test Clinical Study - P001',
  description: 'Survey for patient P001 in study Test Clinical Study',
  baselineDate: '2024-02-01T00:00:00Z',
  expectedCompletionDate: '2024-02-15T00:00:00Z',
  status: 'active',
  completionPercentage: 0,
  totalVisits: 2,
  completedVisits: 0,
  assignedBy: 'user-admin-123',
  createdAt: '2024-02-01T00:00:00Z',
  updatedAt: '2024-02-01T00:00:00Z',
  entityType: 'survey',
};

describe('PatientService', () => {
  let patientService: PatientService;

  beforeEach(() => {
    patientService = new PatientService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createPatient', () => {
    it('should successfully create a patient with valid data', async () => {
      // Arrange
      const createRequest = {
        patientCode: 'P001',
        patientInitials: 'T.P.',
        dateOfBirth: '1990-01-01T00:00:00Z',
        gender: 'male' as const,
        registeredOrganizationId: 'org-test-123',
        medicalHistory: ['Hypertension'],
        currentMedications: ['Lisinopril'],
        allergies: ['Penicillin'],
        contactInfo: {
          phone: '03-1234-5678',
          email: 'patient@example.com',
          emergencyContact: 'Emergency Contact',
        },
      };

      vi.mocked(mockPatientRepository.findByCodeInOrganization).mockResolvedValue(null);
      vi.mocked(mockPatientRepository.createPatient).mockResolvedValue(mockPatient);

      // Act
      const result = await patientService.createPatient(createRequest, 'user-admin-123');

      // Assert
      expect(result).toEqual(mockPatient);
      expect(mockPatientRepository.findByCodeInOrganization).toHaveBeenCalledWith('org-test-123', 'P001');
      expect(mockPatientRepository.createPatient).toHaveBeenCalledWith({
        ...createRequest,
        registrationDate: expect.any(String),
        status: 'active',
        participatingStudies: [],
        createdBy: 'user-admin-123',
        lastModifiedBy: 'user-admin-123',
      });
    });

    it('should throw error for duplicate patient code in organization', async () => {
      // Arrange
      const createRequest = {
        patientCode: 'P001',
        registeredOrganizationId: 'org-test-123',
        patientInitials: 'T.P.',
        gender: 'male' as const,
      };

      vi.mocked(mockPatientRepository.findByCodeInOrganization).mockResolvedValue(mockPatient);

      // Act & Assert
      await expect(patientService.createPatient(createRequest, 'user-admin-123'))
        .rejects.toThrow('Failed to create patient: Patient with code P001 already exists in this organization');

      expect(mockPatientRepository.findByCodeInOrganization).toHaveBeenCalledWith('org-test-123', 'P001');
      expect(mockPatientRepository.createPatient).not.toHaveBeenCalled();
    });

    it('should throw error for invalid patient code format', async () => {
      // Arrange
      const createRequest = {
        patientCode: 'P!', // Invalid format (too short and contains special character)
        registeredOrganizationId: 'org-test-123',
        patientInitials: 'T.P.',
        gender: 'male' as const,
      };

      vi.mocked(mockPatientRepository.findByCodeInOrganization).mockResolvedValue(null);

      // Act & Assert
      await expect(patientService.createPatient(createRequest, 'user-admin-123'))
        .rejects.toThrow('Failed to create patient: Patient code must be 3-20 characters long and contain only letters, numbers, hyphens, and underscores');
    });

    it('should throw error for invalid email format', async () => {
      // Arrange
      const createRequest = {
        patientCode: 'P001',
        registeredOrganizationId: 'org-test-123',
        patientInitials: 'T.P.',
        gender: 'male' as const,
        contactInfo: {
          email: 'invalid-email', // Invalid email format
        },
      };

      vi.mocked(mockPatientRepository.findByCodeInOrganization).mockResolvedValue(null);

      // Act & Assert
      await expect(patientService.createPatient(createRequest, 'user-admin-123'))
        .rejects.toThrow('Failed to create patient: Invalid email format');
    });
  });

  describe('getPatientById', () => {
    it('should return patient when found', async () => {
      // Arrange
      vi.mocked(mockPatientRepository.findById).mockResolvedValue(mockPatient);

      // Act
      const result = await patientService.getPatientById('patient-test-123');

      // Assert
      expect(result).toEqual(mockPatient);
      expect(mockPatientRepository.findById).toHaveBeenCalledWith('patient-test-123');
    });

    it('should return null when patient not found', async () => {
      // Arrange
      vi.mocked(mockPatientRepository.findById).mockResolvedValue(null);

      // Act
      const result = await patientService.getPatientById('nonexistent-patient');

      // Assert
      expect(result).toBeNull();
      expect(mockPatientRepository.findById).toHaveBeenCalledWith('nonexistent-patient');
    });
  });

  describe('updatePatient', () => {
    it('should successfully update patient', async () => {
      // Arrange
      const updateRequest = {
        patientInitials: 'Updated Initials',
        medicalHistory: ['Updated History'],
        status: 'inactive' as const,
      };

      const updatedPatient = { ...mockPatient, ...updateRequest };
      vi.mocked(mockPatientRepository.update).mockResolvedValue(updatedPatient);

      // Act
      const result = await patientService.updatePatient('patient-test-123', updateRequest, 'user-admin-123');

      // Assert
      expect(result).toEqual(updatedPatient);
      expect(mockPatientRepository.update).toHaveBeenCalledWith('patient-test-123', {
        ...updateRequest,
        lastModifiedBy: 'user-admin-123',
      });
    });

    it('should validate email format when updating contact info', async () => {
      // Arrange
      const updateRequest = {
        contactInfo: {
          email: 'invalid-email', // Invalid email format
        },
      };

      // Act & Assert
      await expect(patientService.updatePatient('patient-test-123', updateRequest, 'user-admin-123'))
        .rejects.toThrow('Failed to update patient: Invalid email format');
    });
  });

  describe('searchPatientsByOrganization', () => {
    it('should return patients for organization', async () => {
      // Arrange
      const patients = [mockPatient];
      vi.mocked(mockPatientRepository.findByOrganization).mockResolvedValue({
        patients,
        lastEvaluatedKey: undefined,
      });

      // Act
      const result = await patientService.searchPatientsByOrganization('org-test-123');

      // Assert
      expect(result).toEqual({ patients, lastEvaluatedKey: undefined });
      expect(mockPatientRepository.findByOrganization).toHaveBeenCalledWith('org-test-123', {});
    });

    it('should search by patient code prefix', async () => {
      // Arrange
      const patients = [mockPatient];
      vi.mocked(mockPatientRepository.searchByCodeInOrganization).mockResolvedValue(patients);

      // Act
      const result = await patientService.searchPatientsByOrganization('org-test-123', {
        patientCodePrefix: 'P0',
      });

      // Assert
      expect(result).toEqual({ patients, lastEvaluatedKey: undefined });
      expect(mockPatientRepository.searchByCodeInOrganization).toHaveBeenCalledWith('org-test-123', 'P0');
    });

    it('should filter by status', async () => {
      // Arrange
      const allPatients = [
        mockPatient,
        { ...mockPatient, patientId: 'patient-test-456', status: 'inactive' as const },
      ];
      vi.mocked(mockPatientRepository.findByOrganization).mockResolvedValue({
        patients: allPatients,
        lastEvaluatedKey: undefined,
      });

      // Act
      const result = await patientService.searchPatientsByOrganization('org-test-123', {
        status: 'active',
      });

      // Assert
      expect(result.patients).toHaveLength(1);
      expect(result.patients[0].status).toBe('active');
    });
  });

  describe('getPatientByCodeInOrganization', () => {
    it('should return patient when found by code in organization', async () => {
      // Arrange
      vi.mocked(mockPatientRepository.findByCodeInOrganization).mockResolvedValue(mockPatient);

      // Act
      const result = await patientService.getPatientByCodeInOrganization('org-test-123', 'P001');

      // Assert
      expect(result).toEqual(mockPatient);
      expect(mockPatientRepository.findByCodeInOrganization).toHaveBeenCalledWith('org-test-123', 'P001');
    });

    it('should return null when patient not found by code', async () => {
      // Arrange
      vi.mocked(mockPatientRepository.findByCodeInOrganization).mockResolvedValue(null);

      // Act
      const result = await patientService.getPatientByCodeInOrganization('org-test-123', 'NONEXISTENT');

      // Assert
      expect(result).toBeNull();
      expect(mockPatientRepository.findByCodeInOrganization).toHaveBeenCalledWith('org-test-123', 'NONEXISTENT');
    });
  });

  describe('updatePatientStatus', () => {
    it('should update patient status', async () => {
      // Arrange
      const updatedPatient = { ...mockPatient, status: 'inactive' as const };
      vi.mocked(mockPatientRepository.updateStatus).mockResolvedValue(updatedPatient);
      vi.mocked(mockPatientRepository.update).mockResolvedValue(updatedPatient);

      // Act
      const result = await patientService.updatePatientStatus('patient-test-123', 'inactive', 'user-admin-123');

      // Assert
      expect(result).toEqual(updatedPatient);
      expect(mockPatientRepository.updateStatus).toHaveBeenCalledWith('patient-test-123', 'inactive');
      expect(mockPatientRepository.update).toHaveBeenCalledWith('patient-test-123', {
        lastModifiedBy: 'user-admin-123',
      });
    });
  });

  describe('assignPatientToSurvey', () => {
    it('should successfully assign patient to survey', async () => {
      // Arrange
      const assignRequest = {
        patientId: 'patient-test-123',
        clinicalStudyId: 'study-test-123',
        organizationId: 'org-test-123',
        baselineDate: '2024-02-01T00:00:00Z',
        assignedBy: 'user-admin-123',
      };

      vi.mocked(mockPatientRepository.findById).mockResolvedValue(mockPatient);
      vi.mocked(mockClinicalStudyRepository.findById).mockResolvedValue(mockClinicalStudy);
      vi.mocked(mockSurveyRepository.findByPatient).mockResolvedValue([]);
      vi.mocked(mockSurveyRepository.createSurvey).mockResolvedValue(mockSurvey);
      vi.mocked(mockPatientRepository.addParticipatingStudy).mockResolvedValue(mockPatient);

      // Act
      const result = await patientService.assignPatientToSurvey(assignRequest);

      // Assert
      expect(result).toEqual(mockSurvey);
      expect(mockPatientRepository.findById).toHaveBeenCalledWith('patient-test-123');
      expect(mockClinicalStudyRepository.findById).toHaveBeenCalledWith('study-test-123');
      expect(mockSurveyRepository.findByPatient).toHaveBeenCalledWith('patient-test-123');
      expect(mockSurveyRepository.createSurvey).toHaveBeenCalled();
      expect(mockPatientRepository.addParticipatingStudy).toHaveBeenCalledWith('patient-test-123', 'study-test-123');
    });

    it('should throw error for non-existent patient', async () => {
      // Arrange
      const assignRequest = {
        patientId: 'nonexistent-patient',
        clinicalStudyId: 'study-test-123',
        organizationId: 'org-test-123',
        baselineDate: '2024-02-01T00:00:00Z',
        assignedBy: 'user-admin-123',
      };

      vi.mocked(mockPatientRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(patientService.assignPatientToSurvey(assignRequest))
        .rejects.toThrow('Failed to assign patient to survey: Patient not found');
    });

    it('should throw error for non-existent clinical study', async () => {
      // Arrange
      const assignRequest = {
        patientId: 'patient-test-123',
        clinicalStudyId: 'nonexistent-study',
        organizationId: 'org-test-123',
        baselineDate: '2024-02-01T00:00:00Z',
        assignedBy: 'user-admin-123',
      };

      vi.mocked(mockPatientRepository.findById).mockResolvedValue(mockPatient);
      vi.mocked(mockClinicalStudyRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(patientService.assignPatientToSurvey(assignRequest))
        .rejects.toThrow('Failed to assign patient to survey: Clinical study not found');
    });

    it('should throw error for inactive clinical study', async () => {
      // Arrange
      const assignRequest = {
        patientId: 'patient-test-123',
        clinicalStudyId: 'study-test-123',
        organizationId: 'org-test-123',
        baselineDate: '2024-02-01T00:00:00Z',
        assignedBy: 'user-admin-123',
      };

      const inactiveStudy = { ...mockClinicalStudy, status: 'suspended' as const };

      vi.mocked(mockPatientRepository.findById).mockResolvedValue(mockPatient);
      vi.mocked(mockClinicalStudyRepository.findById).mockResolvedValue(inactiveStudy);

      // Act & Assert
      await expect(patientService.assignPatientToSurvey(assignRequest))
        .rejects.toThrow('Failed to assign patient to survey: Cannot assign patients to inactive studies');
    });

    it('should throw error when organization is not part of study', async () => {
      // Arrange
      const assignRequest = {
        patientId: 'patient-test-123',
        clinicalStudyId: 'study-test-123',
        organizationId: 'org-different-123', // Different organization
        baselineDate: '2024-02-01T00:00:00Z',
        assignedBy: 'user-admin-123',
      };

      vi.mocked(mockPatientRepository.findById).mockResolvedValue(mockPatient);
      vi.mocked(mockClinicalStudyRepository.findById).mockResolvedValue(mockClinicalStudy);

      // Act & Assert
      await expect(patientService.assignPatientToSurvey(assignRequest))
        .rejects.toThrow('Failed to assign patient to survey: Organization is not part of this clinical study');
    });

    it('should throw error when patient already assigned to study', async () => {
      // Arrange
      const assignRequest = {
        patientId: 'patient-test-123',
        clinicalStudyId: 'study-test-123',
        organizationId: 'org-test-123',
        baselineDate: '2024-02-01T00:00:00Z',
        assignedBy: 'user-admin-123',
      };

      const existingSurvey = { ...mockSurvey, clinicalStudyId: 'study-test-123' };

      vi.mocked(mockPatientRepository.findById).mockResolvedValue(mockPatient);
      vi.mocked(mockClinicalStudyRepository.findById).mockResolvedValue(mockClinicalStudy);
      vi.mocked(mockSurveyRepository.findByPatient).mockResolvedValue([existingSurvey]);

      // Act & Assert
      await expect(patientService.assignPatientToSurvey(assignRequest))
        .rejects.toThrow('Failed to assign patient to survey: Patient is already assigned to this clinical study');
    });
  });

  describe('removePatientFromStudy', () => {
    it('should remove patient from study', async () => {
      // Arrange
      const updatedPatient = { ...mockPatient, participatingStudies: [] };
      vi.mocked(mockPatientRepository.removeParticipatingStudy).mockResolvedValue(updatedPatient);
      vi.mocked(mockPatientRepository.update).mockResolvedValue(updatedPatient);

      // Act
      const result = await patientService.removePatientFromStudy('patient-test-123', 'study-test-123', 'user-admin-123');

      // Assert
      expect(result).toEqual(updatedPatient);
      expect(mockPatientRepository.removeParticipatingStudy).toHaveBeenCalledWith('patient-test-123', 'study-test-123');
      expect(mockPatientRepository.update).toHaveBeenCalledWith('patient-test-123', {
        lastModifiedBy: 'user-admin-123',
      });
    });
  });

  describe('getPatientParticipation', () => {
    it('should return patient participation data', async () => {
      // Arrange
      const surveys = [mockSurvey];
      vi.mocked(mockPatientRepository.findById).mockResolvedValue(mockPatient);
      vi.mocked(mockSurveyRepository.findByPatient).mockResolvedValue(surveys);

      // Act
      const result = await patientService.getPatientParticipation('patient-test-123');

      // Assert
      expect(result).toEqual({
        patient: mockPatient,
        surveys,
        totalStudies: 1,
        activeStudies: 1,
        completedStudies: 0,
      });
      expect(mockPatientRepository.findById).toHaveBeenCalledWith('patient-test-123');
      expect(mockSurveyRepository.findByPatient).toHaveBeenCalledWith('patient-test-123');
    });

    it('should throw error for non-existent patient', async () => {
      // Arrange
      vi.mocked(mockPatientRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(patientService.getPatientParticipation('nonexistent-patient'))
        .rejects.toThrow('Failed to get patient participation: Patient not found');
    });
  });

  describe('getOrganizationPatientStatistics', () => {
    it('should return organization patient statistics', async () => {
      // Arrange
      const stats = {
        total: 10,
        active: 8,
        inactive: 1,
        withdrawn: 1,
        completed: 0,
      };
      const patients = [mockPatient];

      vi.mocked(mockPatientRepository.getOrganizationPatientStats).mockResolvedValue(stats);
      vi.mocked(mockPatientRepository.findByOrganization).mockResolvedValue({ patients });

      // Act
      const result = await patientService.getOrganizationPatientStatistics('org-test-123');

      // Assert
      expect(result).toEqual({
        ...stats,
        totalParticipatingStudies: 1,
      });
      expect(mockPatientRepository.getOrganizationPatientStats).toHaveBeenCalledWith('org-test-123');
      expect(mockPatientRepository.findByOrganization).toHaveBeenCalledWith('org-test-123');
    });
  });

  describe('validation methods', () => {
    it('should validate valid patient codes', async () => {
      // Arrange
      const validCodes = ['P001', 'PATIENT-123', 'P_001', 'ABC123DEF'];

      for (const code of validCodes) {
        const createRequest = {
          patientCode: code,
          registeredOrganizationId: 'org-test-123',
          patientInitials: 'T.P.',
          gender: 'male' as const,
        };

        vi.mocked(mockPatientRepository.findByCodeInOrganization).mockResolvedValue(null);
        vi.mocked(mockPatientRepository.createPatient).mockResolvedValue(mockPatient);

        // Act & Assert - should not throw error
        await expect(patientService.createPatient(createRequest, 'user-admin-123'))
          .resolves.toBeDefined();
      }
    });

    it('should validate valid email addresses', async () => {
      // Arrange
      const validEmails = [
        'test@example.com',
        'user.name+tag@domain.co.jp',
        'test123@test-domain.org',
      ];

      for (const email of validEmails) {
        const createRequest = {
          patientCode: 'P001',
          registeredOrganizationId: 'org-test-123',
          patientInitials: 'T.P.',
          gender: 'male' as const,
          contactInfo: { email },
        };

        vi.mocked(mockPatientRepository.findByCodeInOrganization).mockResolvedValue(null);
        vi.mocked(mockPatientRepository.createPatient).mockResolvedValue(mockPatient);

        // Act & Assert - should not throw error
        await expect(patientService.createPatient(createRequest, 'user-admin-123'))
          .resolves.toBeDefined();
      }
    });
  });
});