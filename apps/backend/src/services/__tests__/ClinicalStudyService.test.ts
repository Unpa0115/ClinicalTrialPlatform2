import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ClinicalStudyService } from '../ClinicalStudyService.js';
import { ClinicalStudyRepository } from '../../repositories/ClinicalStudyRepository.js';
import { SurveyRepository } from '../../repositories/SurveyRepository.js';
import { ClinicalStudyRecord, SurveyRecord, VisitTemplate, ExaminationConfig } from '@clinical-trial/shared';

// Mock dependencies
vi.mock('../../repositories/index.js', () => ({
  RepositoryFactory: {
    getInstance: () => ({
      getClinicalStudyRepository: () => mockClinicalStudyRepository,
      getSurveyRepository: () => mockSurveyRepository
    })
  }
}));

// Mock implementations
const mockClinicalStudyRepository = {
  createStudy: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  findByStatus: vi.fn(),
  findActiveStudies: vi.fn(),
  findByOrganization: vi.fn(),
  updateVisitTemplate: vi.fn(),
  addOrganization: vi.fn(),
  removeOrganization: vi.fn(),
  updateEnrollmentCount: vi.fn(),
} as unknown as ClinicalStudyRepository;

const mockSurveyRepository = {
  createSurvey: vi.fn(),
} as unknown as SurveyRepository;

// Test data
const mockVisitTemplate: VisitTemplate[] = [
  {
    visitNumber: 1,
    visitType: 'baseline',
    visitName: 'ベースライン訪問',
    scheduledDaysFromBaseline: 0,
    windowDaysBefore: 0,
    windowDaysAfter: 3,
    requiredExaminations: ['basic_info', 'vas'],
    optionalExaminations: ['questionnaire'],
    examinationOrder: ['basic_info', 'vas', 'questionnaire'],
    isRequired: true,
  },
  {
    visitNumber: 2,
    visitType: '1week',
    visitName: '1週間後フォローアップ',
    scheduledDaysFromBaseline: 7,
    windowDaysBefore: 2,
    windowDaysAfter: 3,
    requiredExaminations: ['vas', 'comparative'],
    optionalExaminations: ['fitting'],
    examinationOrder: ['vas', 'comparative', 'fitting'],
    isRequired: true,
  },
];

const mockExaminations: ExaminationConfig[] = [
  {
    examinationId: 'basic_info',
    examinationName: '基礎情報',
    description: '基本的な眼科検査データ',
    isRequired: true,
    estimatedDuration: 15,
  },
  {
    examinationId: 'vas',
    examinationName: 'VAS評価',
    description: 'Visual Analog Scale評価',
    isRequired: true,
    estimatedDuration: 10,
  },
  {
    examinationId: 'comparative',
    examinationName: '相対評価',
    description: '比較評価検査',
    isRequired: false,
    estimatedDuration: 20,
  },
];

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
  visitTemplate: mockVisitTemplate,
  examinations: mockExaminations,
  status: 'planning',
  currentPhase: 'Phase I',
  enrolledPatients: 0,
  protocolVersion: '1.0',
  ethicsApprovalNumber: 'ETH-2024-001',
  regulatoryApprovals: ['PMDA-2024-001'],
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
  name: 'Test Clinical Study - Patient Survey',
  description: 'Survey generated from study template: Test Clinical Study',
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

describe('ClinicalStudyService', () => {
  let clinicalStudyService: ClinicalStudyService;

  beforeEach(() => {
    clinicalStudyService = new ClinicalStudyService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createStudy', () => {
    it('should successfully create a clinical study with valid data', async () => {
      // Arrange
      const createRequest = {
        studyName: 'Test Clinical Study',
        studyCode: 'TEST001',
        description: 'Test study description',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        targetOrganizations: ['org-test-123'],
        maxPatientsPerOrganization: 50,
        totalTargetPatients: 100,
        visitTemplate: mockVisitTemplate,
        examinations: mockExaminations,
        protocolVersion: '1.0',
        ethicsApprovalNumber: 'ETH-2024-001',
        regulatoryApprovals: ['PMDA-2024-001'],
        currentPhase: 'Phase I',
      };

      vi.mocked(mockClinicalStudyRepository.createStudy).mockResolvedValue(mockClinicalStudy);

      // Act
      const result = await clinicalStudyService.createStudy(createRequest, 'user-admin-123');

      // Assert
      expect(result).toEqual(mockClinicalStudy);
      expect(mockClinicalStudyRepository.createStudy).toHaveBeenCalledWith({
        ...createRequest,
        status: 'planning',
        enrolledPatients: 0,
        createdBy: 'user-admin-123',
        lastModifiedBy: 'user-admin-123',
      });
    });

    it('should throw error for invalid visit template (no visits)', async () => {
      // Arrange
      const createRequest = {
        studyName: 'Test Clinical Study',
        studyCode: 'TEST001',
        description: 'Test study description',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        targetOrganizations: ['org-test-123'],
        maxPatientsPerOrganization: 50,
        totalTargetPatients: 100,
        visitTemplate: [], // Empty visit template
        examinations: mockExaminations,
        protocolVersion: '1.0',
        regulatoryApprovals: [],
        currentPhase: 'Phase I',
      };

      // Act & Assert
      await expect(clinicalStudyService.createStudy(createRequest, 'user-admin-123'))
        .rejects.toThrow('Failed to create clinical study: At least one visit must be configured');
    });

    it('should throw error for invalid examination config (no examinations)', async () => {
      // Arrange
      const createRequest = {
        studyName: 'Test Clinical Study',
        studyCode: 'TEST001',
        description: 'Test study description',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        targetOrganizations: ['org-test-123'],
        maxPatientsPerOrganization: 50,
        totalTargetPatients: 100,
        visitTemplate: mockVisitTemplate,
        examinations: [], // Empty examinations
        protocolVersion: '1.0',
        regulatoryApprovals: [],
        currentPhase: 'Phase I',
      };

      // Act & Assert
      await expect(clinicalStudyService.createStudy(createRequest, 'user-admin-123'))
        .rejects.toThrow('Failed to create clinical study: At least one examination must be configured');
    });

    it('should throw error for duplicate visit numbers', async () => {
      // Arrange
      const invalidVisitTemplate = [
        { ...mockVisitTemplate[0], visitNumber: 1 },
        { ...mockVisitTemplate[1], visitNumber: 1 }, // Duplicate visit number
      ];

      const createRequest = {
        studyName: 'Test Clinical Study',
        studyCode: 'TEST001',
        description: 'Test study description',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        targetOrganizations: ['org-test-123'],
        maxPatientsPerOrganization: 50,
        totalTargetPatients: 100,
        visitTemplate: invalidVisitTemplate,
        examinations: mockExaminations,
        protocolVersion: '1.0',
        regulatoryApprovals: [],
        currentPhase: 'Phase I',
      };

      // Act & Assert
      await expect(clinicalStudyService.createStudy(createRequest, 'user-admin-123'))
        .rejects.toThrow('Failed to create clinical study: Visit numbers must be unique');
    });
  });

  describe('getStudyById', () => {
    it('should return clinical study when found', async () => {
      // Arrange
      vi.mocked(mockClinicalStudyRepository.findById).mockResolvedValue(mockClinicalStudy);

      // Act
      const result = await clinicalStudyService.getStudyById('study-test-123');

      // Assert
      expect(result).toEqual(mockClinicalStudy);
      expect(mockClinicalStudyRepository.findById).toHaveBeenCalledWith('study-test-123');
    });

    it('should return null when study not found', async () => {
      // Arrange
      vi.mocked(mockClinicalStudyRepository.findById).mockResolvedValue(null);

      // Act
      const result = await clinicalStudyService.getStudyById('nonexistent-study');

      // Assert
      expect(result).toBeNull();
      expect(mockClinicalStudyRepository.findById).toHaveBeenCalledWith('nonexistent-study');
    });
  });

  describe('updateStudy', () => {
    it('should successfully update clinical study', async () => {
      // Arrange
      const updateRequest = {
        studyName: 'Updated Study Name',
        description: 'Updated description',
        status: 'active' as const,
      };

      const updatedStudy = { ...mockClinicalStudy, ...updateRequest };
      vi.mocked(mockClinicalStudyRepository.update).mockResolvedValue(updatedStudy);

      // Act
      const result = await clinicalStudyService.updateStudy('study-test-123', updateRequest, 'user-admin-123');

      // Assert
      expect(result).toEqual(updatedStudy);
      expect(mockClinicalStudyRepository.update).toHaveBeenCalledWith('study-test-123', {
        ...updateRequest,
        lastModifiedBy: 'user-admin-123',
      });
    });

    it('should validate visit template when provided in update', async () => {
      // Arrange
      const updateRequest = {
        visitTemplate: [], // Invalid empty visit template
      };

      // Act & Assert
      await expect(clinicalStudyService.updateStudy('study-test-123', updateRequest, 'user-admin-123'))
        .rejects.toThrow('Failed to update clinical study: At least one visit must be configured');
    });
  });

  describe('getStudiesByStatus', () => {
    it('should return studies filtered by status', async () => {
      // Arrange
      const activeStudies = [mockClinicalStudy];
      vi.mocked(mockClinicalStudyRepository.findByStatus).mockResolvedValue(activeStudies);

      // Act
      const result = await clinicalStudyService.getStudiesByStatus('active');

      // Assert
      expect(result).toEqual(activeStudies);
      expect(mockClinicalStudyRepository.findByStatus).toHaveBeenCalledWith('active');
    });
  });

  describe('getActiveStudies', () => {
    it('should return active studies', async () => {
      // Arrange
      const activeStudies = [mockClinicalStudy];
      vi.mocked(mockClinicalStudyRepository.findActiveStudies).mockResolvedValue(activeStudies);

      // Act
      const result = await clinicalStudyService.getActiveStudies();

      // Assert
      expect(result).toEqual(activeStudies);
      expect(mockClinicalStudyRepository.findActiveStudies).toHaveBeenCalled();
    });
  });

  describe('getStudiesByOrganization', () => {
    it('should return studies for organization', async () => {
      // Arrange
      const orgStudies = [mockClinicalStudy];
      vi.mocked(mockClinicalStudyRepository.findByOrganization).mockResolvedValue(orgStudies);

      // Act
      const result = await clinicalStudyService.getStudiesByOrganization('org-test-123');

      // Assert
      expect(result).toEqual(orgStudies);
      expect(mockClinicalStudyRepository.findByOrganization).toHaveBeenCalledWith('org-test-123');
    });
  });

  describe('updateStudyStatus', () => {
    it('should update study status', async () => {
      // Arrange
      const updatedStudy = { ...mockClinicalStudy, status: 'active' as const };
      vi.mocked(mockClinicalStudyRepository.update).mockResolvedValue(updatedStudy);

      // Act
      const result = await clinicalStudyService.updateStudyStatus('study-test-123', 'active', 'user-admin-123');

      // Assert
      expect(result).toEqual(updatedStudy);
      expect(mockClinicalStudyRepository.update).toHaveBeenCalledWith('study-test-123', {
        status: 'active',
        lastModifiedBy: 'user-admin-123',
      });
    });
  });

  describe('updateVisitTemplate', () => {
    it('should update visit template', async () => {
      // Arrange
      const newVisitTemplate = [...mockVisitTemplate];
      const updatedStudy = { ...mockClinicalStudy, visitTemplate: newVisitTemplate };
      vi.mocked(mockClinicalStudyRepository.updateVisitTemplate).mockResolvedValue(updatedStudy);

      // Act
      const result = await clinicalStudyService.updateVisitTemplate('study-test-123', newVisitTemplate, 'user-admin-123');

      // Assert
      expect(result).toEqual(updatedStudy);
      expect(mockClinicalStudyRepository.updateVisitTemplate).toHaveBeenCalledWith('study-test-123', newVisitTemplate);
    });

    it('should validate visit template before update', async () => {
      // Arrange
      const invalidVisitTemplate: VisitTemplate[] = []; // Empty template

      // Act & Assert
      await expect(clinicalStudyService.updateVisitTemplate('study-test-123', invalidVisitTemplate, 'user-admin-123'))
        .rejects.toThrow('Failed to update visit template: At least one visit must be configured');
    });
  });

  describe('addOrganizationToStudy', () => {
    it('should add organization to study', async () => {
      // Arrange
      const updatedStudy = {
        ...mockClinicalStudy,
        targetOrganizations: [...mockClinicalStudy.targetOrganizations, 'org-new-123'],
      };
      vi.mocked(mockClinicalStudyRepository.addOrganization).mockResolvedValue(updatedStudy);

      // Act
      const result = await clinicalStudyService.addOrganizationToStudy('study-test-123', 'org-new-123');

      // Assert
      expect(result).toEqual(updatedStudy);
      expect(mockClinicalStudyRepository.addOrganization).toHaveBeenCalledWith('study-test-123', 'org-new-123');
    });
  });

  describe('removeOrganizationFromStudy', () => {
    it('should remove organization from study', async () => {
      // Arrange
      const updatedStudy = {
        ...mockClinicalStudy,
        targetOrganizations: [],
      };
      vi.mocked(mockClinicalStudyRepository.removeOrganization).mockResolvedValue(updatedStudy);

      // Act
      const result = await clinicalStudyService.removeOrganizationFromStudy('study-test-123', 'org-test-123');

      // Assert
      expect(result).toEqual(updatedStudy);
      expect(mockClinicalStudyRepository.removeOrganization).toHaveBeenCalledWith('study-test-123', 'org-test-123');
    });
  });

  describe('generateSurveyFromTemplate', () => {
    it('should generate survey from active study template', async () => {
      // Arrange
      const activeStudy = { ...mockClinicalStudy, status: 'active' as const };
      vi.mocked(mockClinicalStudyRepository.findById).mockResolvedValue(activeStudy);
      vi.mocked(mockSurveyRepository.createSurvey).mockResolvedValue(mockSurvey);

      const request = {
        clinicalStudyId: 'study-test-123',
        organizationId: 'org-test-123',
        patientId: 'patient-test-123',
        baselineDate: '2024-02-01T00:00:00Z',
        assignedBy: 'user-admin-123',
      };

      // Act
      const result = await clinicalStudyService.generateSurveyFromTemplate(request);

      // Assert
      expect(result).toEqual(mockSurvey);
      expect(mockClinicalStudyRepository.findById).toHaveBeenCalledWith('study-test-123');
      expect(mockSurveyRepository.createSurvey).toHaveBeenCalledWith({
        clinicalStudyId: 'study-test-123',
        organizationId: 'org-test-123',
        patientId: 'patient-test-123',
        name: 'Test Clinical Study - Patient Survey',
        description: 'Survey generated from study template: Test Clinical Study',
        baselineDate: '2024-02-01T00:00:00Z',
        expectedCompletionDate: expect.any(String),
        status: 'active',
        completionPercentage: 0,
        totalVisits: 2,
        completedVisits: 0,
        assignedBy: 'user-admin-123',
      });
    });

    it('should throw error for non-existent study', async () => {
      // Arrange
      vi.mocked(mockClinicalStudyRepository.findById).mockResolvedValue(null);

      const request = {
        clinicalStudyId: 'nonexistent-study',
        organizationId: 'org-test-123',
        patientId: 'patient-test-123',
        baselineDate: '2024-02-01T00:00:00Z',
        assignedBy: 'user-admin-123',
      };

      // Act & Assert
      await expect(clinicalStudyService.generateSurveyFromTemplate(request))
        .rejects.toThrow('Failed to generate survey from template: Clinical study not found');
    });

    it('should throw error for inactive study', async () => {
      // Arrange
      const inactiveStudy = { ...mockClinicalStudy, status: 'suspended' as const };
      vi.mocked(mockClinicalStudyRepository.findById).mockResolvedValue(inactiveStudy);

      const request = {
        clinicalStudyId: 'study-test-123',
        organizationId: 'org-test-123',
        patientId: 'patient-test-123',
        baselineDate: '2024-02-01T00:00:00Z',
        assignedBy: 'user-admin-123',
      };

      // Act & Assert
      await expect(clinicalStudyService.generateSurveyFromTemplate(request))
        .rejects.toThrow('Failed to generate survey from template: Cannot generate surveys for inactive studies');
    });
  });

  describe('updateEnrollmentCount', () => {
    it('should update enrollment count', async () => {
      // Arrange
      const updatedStudy = { ...mockClinicalStudy, enrolledPatients: 25 };
      vi.mocked(mockClinicalStudyRepository.updateEnrollmentCount).mockResolvedValue(updatedStudy);

      // Act
      const result = await clinicalStudyService.updateEnrollmentCount('study-test-123', 25);

      // Assert
      expect(result).toEqual(updatedStudy);
      expect(mockClinicalStudyRepository.updateEnrollmentCount).toHaveBeenCalledWith('study-test-123', 25);
    });
  });

  describe('validation methods', () => {
    it('should validate visit template with missing visit name', async () => {
      // Arrange
      const invalidVisitTemplate = [
        { ...mockVisitTemplate[0], visitName: '' }, // Empty visit name
      ];

      const createRequest = {
        studyName: 'Test Clinical Study',
        studyCode: 'TEST001',
        description: 'Test study description',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        targetOrganizations: ['org-test-123'],
        maxPatientsPerOrganization: 50,
        totalTargetPatients: 100,
        visitTemplate: invalidVisitTemplate,
        examinations: mockExaminations,
        protocolVersion: '1.0',
        regulatoryApprovals: [],
        currentPhase: 'Phase I',
      };

      // Act & Assert
      await expect(clinicalStudyService.createStudy(createRequest, 'user-admin-123'))
        .rejects.toThrow('Failed to create clinical study: Visit 1: Visit name is required');
    });

    it('should validate examination config with missing examination name', async () => {
      // Arrange
      const invalidExaminations = [
        { ...mockExaminations[0], examinationName: '' }, // Empty examination name
      ];

      const createRequest = {
        studyName: 'Test Clinical Study',
        studyCode: 'TEST001',
        description: 'Test study description',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        targetOrganizations: ['org-test-123'],
        maxPatientsPerOrganization: 50,
        totalTargetPatients: 100,
        visitTemplate: mockVisitTemplate,
        examinations: invalidExaminations,
        protocolVersion: '1.0',
        regulatoryApprovals: [],
        currentPhase: 'Phase I',
      };

      // Act & Assert
      await expect(clinicalStudyService.createStudy(createRequest, 'user-admin-123'))
        .rejects.toThrow('Failed to create clinical study: Examination 1: Examination name is required');
    });
  });
});