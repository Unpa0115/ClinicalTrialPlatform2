import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SurveyService } from '../SurveyService.js';
import { RepositoryFactory } from '../../repositories/index.js';
import { SurveyRecord, ClinicalStudyRecord, PatientRecord, VisitRecord } from '@clinical-trial/shared';

// Mock the repositories
jest.mock('../../repositories/index.js');

describe('SurveyService', () => {
  let surveyService: SurveyService;
  let mockSurveyRepository: any;
  let mockClinicalStudyRepository: any;
  let mockPatientRepository: any;
  let mockVisitRepository: any;
  let mockRepositoryFactory: any;

  const mockClinicalStudy: ClinicalStudyRecord = {
    clinicalStudyId: 'study-test-123',
    studyName: 'Test Clinical Study',
    studyCode: 'TEST001',
    description: 'Test study description',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-12-31T23:59:59Z',
    targetOrganizations: ['org-1'],
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
        requiredExaminations: ['basic_info', 'vas'],
        optionalExaminations: ['questionnaire'],
        examinationOrder: ['basic_info', 'vas', 'questionnaire'],
        isRequired: true
      },
      {
        visitNumber: 2,
        visitType: '1week',
        visitName: '1 Week Follow-up',
        scheduledDaysFromBaseline: 7,
        windowDaysBefore: 1,
        windowDaysAfter: 2,
        requiredExaminations: ['vas'],
        optionalExaminations: ['basic_info'],
        examinationOrder: ['vas', 'basic_info'],
        isRequired: true
      }
    ],
    examinations: [],
    status: 'active',
    currentPhase: 'recruitment',
    enrolledPatients: 0,
    protocolVersion: '1.0',
    regulatoryApprovals: [],
    createdBy: 'admin',
    lastModifiedBy: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    entityType: 'clinical-study'
  };

  const mockPatient: PatientRecord = {
    patientId: 'patient-001-123',
    patientCode: 'P001',
    registeredOrganizationId: 'org-1',
    registrationDate: '2024-01-01T00:00:00Z',
    status: 'active',
    participatingStudies: [],
    createdBy: 'admin',
    lastModifiedBy: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    entityType: 'patient'
  };

  const mockSurvey: SurveyRecord = {
    surveyId: 'survey-patient-001-study-test-123',
    clinicalStudyId: 'study-test-123',
    organizationId: 'org-1',
    patientId: 'patient-001-123',
    name: 'P001-TEST001-2024-01-01',
    description: 'Generated survey for P001 in study Test Clinical Study',
    baselineDate: '2024-01-01T00:00:00Z',
    expectedCompletionDate: '2024-01-10T23:59:59Z',
    status: 'active',
    completionPercentage: 0,
    totalVisits: 2,
    completedVisits: 0,
    assignedBy: 'admin',
    conductedBy: 'investigator-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    entityType: 'survey'
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock repository methods
    mockSurveyRepository = {
      createSurvey: jest.fn(),
      findById: jest.fn(),
      findByPatient: jest.fn(),
      updateProgress: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      findByOrganization: jest.fn(),
      findByStudy: jest.fn()
    };

    mockClinicalStudyRepository = {
      findById: jest.fn()
    };

    mockPatientRepository = {
      findById: jest.fn(),
      update: jest.fn()
    };

    mockVisitRepository = {
      createVisit: jest.fn(),
      findBySurvey: jest.fn()
    };

    // Mock RepositoryFactory
    mockRepositoryFactory = {
      getSurveyRepository: jest.fn(() => mockSurveyRepository),
      getClinicalStudyRepository: jest.fn(() => mockClinicalStudyRepository),
      getPatientRepository: jest.fn(() => mockPatientRepository),
      getVisitRepository: jest.fn(() => mockVisitRepository)
    };

    (RepositoryFactory.getInstance as jest.Mock).mockReturnValue(mockRepositoryFactory);

    surveyService = new SurveyService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createSurveyFromTemplate', () => {
    const createRequest = {
      clinicalStudyId: 'study-test-123',
      organizationId: 'org-1',
      patientId: 'patient-001-123',
      assignedBy: 'admin',
      conductedBy: 'investigator-1',
      baselineDate: '2024-01-01T00:00:00Z'
    };

    it('should create survey with visits from clinical study template', async () => {
      // Arrange
      mockClinicalStudyRepository.findById.mockResolvedValue(mockClinicalStudy);
      mockPatientRepository.findById.mockResolvedValue(mockPatient);
      mockSurveyRepository.findByPatient.mockResolvedValue([]);
      mockSurveyRepository.createSurvey.mockResolvedValue(mockSurvey);
      mockVisitRepository.createVisit.mockImplementation((visitData) => 
        Promise.resolve({ ...visitData, visitId: `visit-${visitData.visitNumber}-123` })
      );
      mockPatientRepository.update.mockResolvedValue(mockPatient);

      // Act
      const result = await surveyService.createSurveyFromTemplate(createRequest);

      // Assert
      expect(result.survey).toEqual(mockSurvey);
      expect(result.visits).toHaveLength(2);
      expect(result.summary.totalVisits).toBe(2);
      expect(result.summary.generatedVisits).toBe(2);

      // Verify repository calls
      expect(mockClinicalStudyRepository.findById).toHaveBeenCalledWith('study-test-123');
      expect(mockPatientRepository.findById).toHaveBeenCalledWith('patient-001-123');
      expect(mockSurveyRepository.createSurvey).toHaveBeenCalledWith(
        expect.objectContaining({
          clinicalStudyId: 'study-test-123',
          organizationId: 'org-1',
          patientId: 'patient-001-123',
          totalVisits: 2
        })
      );
      expect(mockVisitRepository.createVisit).toHaveBeenCalledTimes(2);
    });

    it('should throw error if clinical study not found', async () => {
      // Arrange
      mockClinicalStudyRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(surveyService.createSurveyFromTemplate(createRequest))
        .rejects.toThrow('Clinical study not found: study-test-123');
    });

    it('should throw error if clinical study is not active', async () => {
      // Arrange
      const inactiveStudy = { ...mockClinicalStudy, status: 'completed' as const };
      mockClinicalStudyRepository.findById.mockResolvedValue(inactiveStudy);

      // Act & Assert
      await expect(surveyService.createSurveyFromTemplate(createRequest))
        .rejects.toThrow('Clinical study is not active: completed');
    });

    it('should throw error if patient not found', async () => {
      // Arrange
      mockClinicalStudyRepository.findById.mockResolvedValue(mockClinicalStudy);
      mockPatientRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(surveyService.createSurveyFromTemplate(createRequest))
        .rejects.toThrow('Patient not found: patient-001-123');
    });

    it('should throw error if patient does not belong to organization', async () => {
      // Arrange
      const wrongOrgPatient = { ...mockPatient, registeredOrganizationId: 'org-2' };
      mockClinicalStudyRepository.findById.mockResolvedValue(mockClinicalStudy);
      mockPatientRepository.findById.mockResolvedValue(wrongOrgPatient);

      // Act & Assert
      await expect(surveyService.createSurveyFromTemplate(createRequest))
        .rejects.toThrow('Patient does not belong to organization: org-1');
    });

    it('should throw error if patient already has active survey in study', async () => {
      // Arrange
      const existingSurvey = { ...mockSurvey, status: 'active' as const };
      mockClinicalStudyRepository.findById.mockResolvedValue(mockClinicalStudy);
      mockPatientRepository.findById.mockResolvedValue(mockPatient);
      mockSurveyRepository.findByPatient.mockResolvedValue([existingSurvey]);

      // Act & Assert
      await expect(surveyService.createSurveyFromTemplate(createRequest))
        .rejects.toThrow('Patient already has active survey in study:');
    });

    it('should create visits with correct scheduling based on baseline date', async () => {
      // Arrange
      mockClinicalStudyRepository.findById.mockResolvedValue(mockClinicalStudy);
      mockPatientRepository.findById.mockResolvedValue(mockPatient);
      mockSurveyRepository.findByPatient.mockResolvedValue([]);
      mockSurveyRepository.createSurvey.mockResolvedValue(mockSurvey);
      
      const mockVisits: VisitRecord[] = [];
      mockVisitRepository.createVisit.mockImplementation((visitData) => {
        const visit = { ...visitData, visitId: `visit-${visitData.visitNumber}-123` } as VisitRecord;
        mockVisits.push(visit);
        return Promise.resolve(visit);
      });
      
      mockPatientRepository.update.mockResolvedValue(mockPatient);

      // Act
      const result = await surveyService.createSurveyFromTemplate(createRequest);

      // Assert
      expect(mockVisitRepository.createVisit).toHaveBeenCalledWith(
        expect.objectContaining({
          visitNumber: 1,
          visitType: 'baseline',
          scheduledDate: '2024-01-01T00:00:00.000Z', // Baseline + 0 days
          windowStartDate: '2024-01-01T00:00:00.000Z', // Baseline - 0 days
          windowEndDate: '2024-01-04T00:00:00.000Z' // Baseline + 3 days
        })
      );

      expect(mockVisitRepository.createVisit).toHaveBeenCalledWith(
        expect.objectContaining({
          visitNumber: 2,
          visitType: '1week',
          scheduledDate: '2024-01-08T00:00:00.000Z', // Baseline + 7 days
          windowStartDate: '2024-01-07T00:00:00.000Z', // Scheduled - 1 day
          windowEndDate: '2024-01-10T00:00:00.000Z' // Scheduled + 2 days
        })
      );
    });
  });

  describe('getSurveyWithDetails', () => {
    it('should return survey with related clinical study, patient, and visits', async () => {
      // Arrange
      const mockVisits: VisitRecord[] = [
        {
          surveyId: mockSurvey.surveyId,
          visitId: 'visit-1-123',
          clinicalStudyId: mockSurvey.clinicalStudyId,
          organizationId: mockSurvey.organizationId,
          patientId: mockSurvey.patientId,
          visitNumber: 1,
          visitType: 'baseline',
          visitName: 'Baseline Visit',
          scheduledDate: '2024-01-01T00:00:00Z',
          windowStartDate: '2024-01-01T00:00:00Z',
          windowEndDate: '2024-01-04T00:00:00Z',
          status: 'scheduled',
          completionPercentage: 0,
          requiredExaminations: ['basic_info', 'vas'],
          optionalExaminations: ['questionnaire'],
          examinationOrder: ['basic_info', 'vas', 'questionnaire'],
          completedExaminations: [],
          skippedExaminations: [],
          conductedBy: 'investigator-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      mockSurveyRepository.findById.mockResolvedValue(mockSurvey);
      mockClinicalStudyRepository.findById.mockResolvedValue(mockClinicalStudy);
      mockPatientRepository.findById.mockResolvedValue(mockPatient);
      mockVisitRepository.findBySurvey.mockResolvedValue({ visits: mockVisits });

      // Act
      const result = await surveyService.getSurveyWithDetails(mockSurvey.surveyId);

      // Assert
      expect(result.survey).toEqual(mockSurvey);
      expect(result.clinicalStudy).toEqual(mockClinicalStudy);
      expect(result.patient).toEqual(mockPatient);
      expect(result.visits).toEqual(mockVisits);
    });

    it('should throw error if survey not found', async () => {
      // Arrange
      mockSurveyRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(surveyService.getSurveyWithDetails('nonexistent-survey'))
        .rejects.toThrow('Survey not found: nonexistent-survey');
    });
  });

  describe('updateSurveyProgress', () => {
    it('should update survey progress based on completed visits', async () => {
      // Arrange
      const mockVisits: VisitRecord[] = [
        { visitId: 'visit-1', status: 'completed' } as VisitRecord,
        { visitId: 'visit-2', status: 'scheduled' } as VisitRecord
      ];

      mockVisitRepository.findBySurvey.mockResolvedValue({ visits: mockVisits });
      const updatedSurvey = { ...mockSurvey, completedVisits: 1, completionPercentage: 50 };
      mockSurveyRepository.updateProgress.mockResolvedValue(updatedSurvey);

      // Act
      const result = await surveyService.updateSurveyProgress(mockSurvey.surveyId);

      // Assert
      expect(mockSurveyRepository.updateProgress).toHaveBeenCalledWith(
        mockSurvey.surveyId,
        50, // 1 completed out of 2 total = 50%
        1   // 1 completed visit
      );
      expect(result).toEqual(updatedSurvey);
    });

    it('should mark survey as completed when all visits are completed', async () => {
      // Arrange
      const mockVisits: VisitRecord[] = [
        { visitId: 'visit-1', status: 'completed' } as VisitRecord,
        { visitId: 'visit-2', status: 'completed' } as VisitRecord
      ];

      mockVisitRepository.findBySurvey.mockResolvedValue({ visits: mockVisits });
      const completedSurvey = { 
        ...mockSurvey, 
        completedVisits: 2, 
        completionPercentage: 100,
        status: 'completed' as const
      };
      mockSurveyRepository.updateProgress.mockResolvedValue(completedSurvey);

      // Act
      const result = await surveyService.updateSurveyProgress(mockSurvey.surveyId);

      // Assert
      expect(mockSurveyRepository.updateProgress).toHaveBeenCalledWith(
        mockSurvey.surveyId,
        100, // 2 completed out of 2 total = 100%
        2    // 2 completed visits
      );
      expect(result.status).toBe('completed');
    });
  });

  describe('getSurveysByOrganization', () => {
    it('should return filtered surveys by organization with pagination', async () => {
      // Arrange
      const mockSurveys = [mockSurvey];
      const pagination = { limit: 10, exclusiveStartKey: undefined };
      const filters = { status: 'active' as const };

      mockSurveyRepository.findByOrganization.mockResolvedValue({
        surveys: mockSurveys,
        lastEvaluatedKey: undefined
      });

      // Act
      const result = await surveyService.getSurveysByOrganization(
        'org-1',
        filters,
        pagination
      );

      // Assert
      expect(result.surveys).toEqual(mockSurveys);
      expect(mockSurveyRepository.findByOrganization).toHaveBeenCalledWith('org-1', pagination);
    });

    it('should filter surveys by status', async () => {
      // Arrange
      const activeSurvey = { ...mockSurvey, status: 'active' as const };
      const completedSurvey = { ...mockSurvey, surveyId: 'survey-2', status: 'completed' as const };
      const allSurveys = [activeSurvey, completedSurvey];

      mockSurveyRepository.findByOrganization.mockResolvedValue({
        surveys: allSurveys,
        lastEvaluatedKey: undefined
      });

      // Act
      const result = await surveyService.getSurveysByOrganization(
        'org-1',
        { status: 'active' }
      );

      // Assert
      expect(result.surveys).toHaveLength(1);
      expect(result.surveys[0].status).toBe('active');
    });
  });

  describe('withdrawSurvey', () => {
    it('should withdraw survey and cancel related visits', async () => {
      // Arrange
      const mockVisits: VisitRecord[] = [
        { visitId: 'visit-1', status: 'scheduled' } as VisitRecord,
        { visitId: 'visit-2', status: 'in_progress' } as VisitRecord,
        { visitId: 'visit-3', status: 'completed' } as VisitRecord
      ];

      const withdrawnSurvey = { ...mockSurvey, status: 'withdrawn' as const };
      mockSurveyRepository.updateStatus.mockResolvedValue(withdrawnSurvey);
      mockVisitRepository.findBySurvey.mockResolvedValue({ visits: mockVisits });
      mockVisitRepository.updateStatus.mockResolvedValue({} as VisitRecord);
      mockVisitRepository.update.mockResolvedValue({} as VisitRecord);

      // Act
      const result = await surveyService.withdrawSurvey(mockSurvey.surveyId, 'Patient withdrawn consent');

      // Assert
      expect(mockSurveyRepository.updateStatus).toHaveBeenCalledWith(mockSurvey.surveyId, 'withdrawn');
      expect(mockVisitRepository.updateStatus).toHaveBeenCalledTimes(2); // Only scheduled and in_progress visits
      expect(result).toEqual(withdrawnSurvey);
    });
  });

  describe('getSurveyDashboardStats', () => {
    it('should return comprehensive survey statistics', async () => {
      // Arrange
      const activeSurvey1 = { ...mockSurvey, status: 'active' as const, completionPercentage: 50 };
      const activeSurvey2 = { ...mockSurvey, surveyId: 'survey-2', status: 'active' as const, completionPercentage: 75 };
      const completedSurvey = { ...mockSurvey, surveyId: 'survey-3', status: 'completed' as const, completionPercentage: 100 };
      const surveys = [activeSurvey1, activeSurvey2, completedSurvey];

      mockSurveyRepository.findByOrganization.mockResolvedValue({ surveys });
      
      // Mock related data for recent activity
      mockPatientRepository.findById.mockResolvedValue(mockPatient);
      mockClinicalStudyRepository.findById.mockResolvedValue(mockClinicalStudy);

      // Act
      const result = await surveyService.getSurveyDashboardStats('org-1');

      // Assert
      expect(result.totalSurveys).toBe(3);
      expect(result.activeSurveys).toBe(2);
      expect(result.completedSurveys).toBe(1);
      expect(result.withdrawnSurveys).toBe(0);
      expect(result.averageCompletion).toBe(75); // (50 + 75 + 100) / 3 = 75
      expect(result.recentActivity).toHaveLength(3);
    });

    it('should handle empty survey list', async () => {
      // Arrange
      mockSurveyRepository.findByOrganization.mockResolvedValue({ surveys: [] });

      // Act
      const result = await surveyService.getSurveyDashboardStats('org-1');

      // Assert
      expect(result.totalSurveys).toBe(0);
      expect(result.activeSurveys).toBe(0);
      expect(result.completedSurveys).toBe(0);
      expect(result.averageCompletion).toBe(0);
      expect(result.recentActivity).toHaveLength(0);
    });

    it('should throw error if neither organizationId nor clinicalStudyId provided', async () => {
      // Act & Assert
      await expect(surveyService.getSurveyDashboardStats())
        .rejects.toThrow('Either organizationId or clinicalStudyId must be provided');
    });
  });
});