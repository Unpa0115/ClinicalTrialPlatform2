import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { VisitService } from '../VisitService.js';
import { RepositoryFactory } from '../../repositories/index.js';
import { VisitRecord, SurveyRecord, ClinicalStudyRecord } from '@clinical-trial/shared';

// Mock the repositories
jest.mock('../../repositories/index.js');

describe('VisitService', () => {
  let visitService: VisitService;
  let mockVisitRepository: any;
  let mockSurveyRepository: any;
  let mockClinicalStudyRepository: any;
  let mockRepositoryFactory: any;

  const mockVisit: VisitRecord = {
    surveyId: 'survey-123',
    visitId: 'visit-1-123',
    clinicalStudyId: 'study-123',
    organizationId: 'org-1',
    patientId: 'patient-123',
    visitNumber: 1,
    visitType: 'baseline',
    visitName: 'Baseline Visit',
    scheduledDate: '2024-01-01T00:00:00Z',
    actualDate: undefined,
    windowStartDate: '2024-01-01T00:00:00Z',
    windowEndDate: '2024-01-04T00:00:00Z',
    status: 'scheduled',
    completionPercentage: 0,
    requiredExaminations: ['basic_info', 'vas'],
    optionalExaminations: ['questionnaire'],
    examinationOrder: ['basic_info', 'vas', 'questionnaire'],
    completedExaminations: [],
    skippedExaminations: [],
    visitNotes: undefined,
    deviationReason: undefined,
    conductedBy: 'investigator-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockSurvey: SurveyRecord = {
    surveyId: 'survey-123',
    clinicalStudyId: 'study-123',
    organizationId: 'org-1',
    patientId: 'patient-123',
    name: 'Test Survey',
    baselineDate: '2024-01-01T00:00:00Z',
    expectedCompletionDate: '2024-01-10T00:00:00Z',
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
    jest.clearAllMocks();

    mockVisitRepository = {
      findBySurveyAndVisit: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      completeExamination: jest.fn(),
      skipExamination: jest.fn(),
      completeVisit: jest.fn(),
      updateExaminationConfiguration: jest.fn(),
      findBySurvey: jest.fn(),
      findByOrganization: jest.fn(),
      updateStatus: jest.fn()
    };

    mockSurveyRepository = {
      updateProgress: jest.fn()
    };

    mockClinicalStudyRepository = {
      findById: jest.fn()
    };

    mockRepositoryFactory = {
      getVisitRepository: jest.fn(() => mockVisitRepository),
      getSurveyRepository: jest.fn(() => mockSurveyRepository),
      getClinicalStudyRepository: jest.fn(() => mockClinicalStudyRepository)
    };

    (RepositoryFactory.getInstance as jest.Mock).mockReturnValue(mockRepositoryFactory);

    visitService = new VisitService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('scheduleVisit', () => {
    const scheduleRequest = {
      surveyId: 'survey-123',
      visitId: 'visit-1-123',
      scheduledDate: '2024-01-02T00:00:00Z',
      conductedBy: 'investigator-1',
      notes: 'Scheduled for morning'
    };

    it('should schedule visit within protocol window', async () => {
      // Arrange
      mockVisitRepository.findBySurveyAndVisit.mockResolvedValue(mockVisit);
      const updatedVisit = { ...mockVisit, scheduledDate: scheduleRequest.scheduledDate };
      mockVisitRepository.update.mockResolvedValue(updatedVisit);

      // Act
      const result = await visitService.scheduleVisit(scheduleRequest);

      // Assert
      expect(result.protocolCompliant).toBe(true);
      expect(result.deviations).toHaveLength(0);
      expect(result.visit).toEqual(updatedVisit);
      expect(mockVisitRepository.update).toHaveBeenCalledWith(
        'survey-123',
        expect.objectContaining({
          scheduledDate: '2024-01-02T00:00:00Z',
          conductedBy: 'investigator-1',
          visitNotes: 'Scheduled for morning',
          status: 'scheduled'
        }),
        'visit-1-123'
      );
    });

    it('should detect protocol deviation when scheduled outside window', async () => {
      // Arrange
      const outsideWindowRequest = {
        ...scheduleRequest,
        scheduledDate: '2024-01-10T00:00:00Z' // Outside window end (2024-01-04)
      };
      
      mockVisitRepository.findBySurveyAndVisit.mockResolvedValue(mockVisit);
      const updatedVisit = { ...mockVisit, scheduledDate: outsideWindowRequest.scheduledDate };
      mockVisitRepository.update.mockResolvedValue(updatedVisit);

      // Act
      const result = await visitService.scheduleVisit(outsideWindowRequest);

      // Assert
      expect(result.protocolCompliant).toBe(false);
      expect(result.deviations).toHaveLength(1);
      expect(result.deviations[0].deviationType).toBe('window_violation');
      expect(result.deviations[0].severity).toBe('medium');
    });

    it('should throw error if visit not found', async () => {
      // Arrange
      mockVisitRepository.findBySurveyAndVisit.mockResolvedValue(null);

      // Act & Assert
      await expect(visitService.scheduleVisit(scheduleRequest))
        .rejects.toThrow('Visit not found: visit-1-123');
    });
  });

  describe('startVisit', () => {
    it('should start visit and set status to in_progress', async () => {
      // Arrange
      mockVisitRepository.findById.mockResolvedValue(mockVisit);
      const startedVisit = { 
        ...mockVisit, 
        status: 'in_progress' as const,
        actualDate: expect.any(String)
      };
      mockVisitRepository.update.mockResolvedValue(startedVisit);

      // Act
      const result = await visitService.startVisit('visit-1-123', 'new-investigator');

      // Assert
      expect(mockVisitRepository.update).toHaveBeenCalledWith(
        'survey-123',
        expect.objectContaining({
          status: 'in_progress',
          actualDate: expect.any(String),
          conductedBy: 'new-investigator'
        }),
        'visit-1-123'
      );
      expect(result).toEqual(startedVisit);
    });

    it('should throw error if visit not found', async () => {
      // Arrange
      mockVisitRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(visitService.startVisit('nonexistent-visit'))
        .rejects.toThrow('Visit not found: nonexistent-visit');
    });
  });

  describe('completeExamination', () => {
    const completionRequest = {
      visitId: 'visit-1-123',
      examinationId: 'basic_info',
      completed: true,
      notes: 'Examination completed successfully'
    };

    it('should complete examination and update visit progress', async () => {
      // Arrange
      mockVisitRepository.findById.mockResolvedValue(mockVisit);
      const updatedVisit = {
        ...mockVisit,
        completedExaminations: ['basic_info'],
        completionPercentage: 33 // 1 out of 3 examinations
      };
      mockVisitRepository.completeExamination.mockResolvedValue(updatedVisit);

      // Act
      const result = await visitService.completeExamination(completionRequest);

      // Assert
      expect(mockVisitRepository.completeExamination).toHaveBeenCalledWith(
        'survey-123',
        'visit-1-123',
        'basic_info'
      );
      expect(result.visit).toEqual(updatedVisit);
      expect(result.completionPercentage).toBe(33);
      expect(result.allExaminationsComplete).toBe(false);
    });

    it('should skip examination when completed is false', async () => {
      // Arrange
      const skipRequest = { ...completionRequest, completed: false };
      mockVisitRepository.findById.mockResolvedValue(mockVisit);
      const updatedVisit = {
        ...mockVisit,
        skippedExaminations: ['basic_info']
      };
      mockVisitRepository.skipExamination.mockResolvedValue(updatedVisit);

      // Act
      const result = await visitService.completeExamination(skipRequest);

      // Assert
      expect(mockVisitRepository.skipExamination).toHaveBeenCalledWith(
        'survey-123',
        'visit-1-123',
        'basic_info'
      );
      expect(result.visit).toEqual(updatedVisit);
    });

    it('should detect when all required examinations are complete', async () => {
      // Arrange
      mockVisitRepository.findById.mockResolvedValue(mockVisit);
      const fullyCompletedVisit = {
        ...mockVisit,
        completedExaminations: ['basic_info', 'vas'], // All required examinations
        completionPercentage: 67
      };
      mockVisitRepository.completeExamination.mockResolvedValue(fullyCompletedVisit);

      // Act
      const result = await visitService.completeExamination(completionRequest);

      // Assert
      expect(result.allExaminationsComplete).toBe(true);
    });
  });

  describe('completeVisit', () => {
    it('should complete visit and update survey progress', async () => {
      // Arrange
      mockVisitRepository.findById.mockResolvedValue(mockVisit);
      const completedVisit = {
        ...mockVisit,
        status: 'completed' as const,
        completionPercentage: 100
      };
      mockVisitRepository.completeVisit.mockResolvedValue(completedVisit);
      
      const visits = [completedVisit, { ...mockVisit, visitId: 'visit-2', status: 'scheduled' }];
      mockVisitRepository.findBySurvey.mockResolvedValue(visits);
      
      const updatedSurvey = { ...mockSurvey, completedVisits: 1, completionPercentage: 50 };
      mockSurveyRepository.updateProgress.mockResolvedValue(updatedSurvey);

      // Act
      const result = await visitService.completeVisit('visit-1-123');

      // Assert
      expect(mockVisitRepository.completeVisit).toHaveBeenCalledWith('survey-123', 'visit-1-123');
      expect(mockSurveyRepository.updateProgress).toHaveBeenCalledWith('survey-123', 50, 1);
      expect(result.visit).toEqual(completedVisit);
      expect(result.survey).toEqual(updatedSurvey);
    });
  });

  describe('getVisitConfiguration', () => {
    it('should return visit with examination configuration details', async () => {
      // Arrange
      const visitWithSomeCompleted = {
        ...mockVisit,
        completedExaminations: ['basic_info'],
        skippedExaminations: ['questionnaire']
      };
      mockVisitRepository.findById.mockResolvedValue(visitWithSomeCompleted);

      // Act
      const result = await visitService.getVisitConfiguration('visit-1-123');

      // Assert
      expect(result.visit).toEqual(visitWithSomeCompleted);
      expect(result.examinationConfig).toEqual({
        totalExaminations: 3,
        requiredExaminations: ['basic_info', 'vas'],
        optionalExaminations: ['questionnaire'],
        examinationOrder: ['basic_info', 'vas', 'questionnaire'],
        completedExaminations: ['basic_info'],
        skippedExaminations: ['questionnaire'],
        remainingExaminations: ['vas'] // Only VAS remains
      });
    });
  });

  describe('detectProtocolDeviations', () => {
    it('should detect missed visits past window end date', async () => {
      // Arrange
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      
      const missedVisit = {
        ...mockVisit,
        windowEndDate: pastDate.toISOString(),
        status: 'scheduled' as const
      };
      
      mockVisitRepository.findByOrganization.mockResolvedValue([missedVisit]);

      // Act
      const deviations = await visitService.detectProtocolDeviations('org-1');

      // Assert
      expect(deviations).toHaveLength(1);
      expect(deviations[0].deviationType).toBe('missed_visit');
      expect(deviations[0].severity).toBe('high');
    });

    it('should detect visits scheduled outside protocol window', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      const outOfWindowVisit = {
        ...mockVisit,
        scheduledDate: futureDate.toISOString(),
        status: 'scheduled' as const
      };
      
      mockVisitRepository.findByOrganization.mockResolvedValue([outOfWindowVisit]);

      // Act
      const deviations = await visitService.detectProtocolDeviations('org-1');

      // Assert
      expect(deviations).toHaveLength(1);
      expect(deviations[0].deviationType).toBe('window_violation');
      expect(deviations[0].severity).toBe('medium');
    });

    it('should detect incomplete required examinations in completed visits', async () => {
      // Arrange
      const incompleteVisit = {
        ...mockVisit,
        status: 'completed' as const,
        completedExaminations: ['basic_info'], // Missing 'vas' which is required
        requiredExaminations: ['basic_info', 'vas']
      };
      
      mockVisitRepository.findByOrganization.mockResolvedValue([incompleteVisit]);

      // Act
      const deviations = await visitService.detectProtocolDeviations('org-1');

      // Assert
      expect(deviations).toHaveLength(1);
      expect(deviations[0].deviationType).toBe('examination_skip');
      expect(deviations[0].severity).toBe('medium');
      expect(deviations[0].description).toContain('vas');
    });
  });

  describe('getVisitStatistics', () => {
    it('should calculate comprehensive visit statistics', async () => {
      // Arrange
      const visits: VisitRecord[] = [
        { ...mockVisit, status: 'completed', completionPercentage: 100, completedExaminations: ['basic_info', 'vas'] },
        { ...mockVisit, visitId: 'visit-2', status: 'in_progress', completionPercentage: 50, completedExaminations: ['basic_info'] },
        { ...mockVisit, visitId: 'visit-3', status: 'scheduled', completionPercentage: 0, completedExaminations: [] },
        { ...mockVisit, visitId: 'visit-4', status: 'missed', completionPercentage: 0, completedExaminations: [] }
      ];
      
      mockVisitRepository.findBySurvey.mockResolvedValue(visits);
      mockVisitRepository.findByOrganization.mockResolvedValue([]);

      // Act
      const stats = await visitService.getVisitStatistics('survey-123');

      // Assert
      expect(stats.totalVisits).toBe(4);
      expect(stats.completedVisits).toBe(1);
      expect(stats.inProgressVisits).toBe(1);
      expect(stats.scheduledVisits).toBe(1);
      expect(stats.missedVisits).toBe(1);
      expect(stats.averageCompletionPercentage).toBe(38); // (100+50+0+0)/4 = 37.5 -> 38
      expect(stats.examinationStats.totalExaminations).toBe(12); // 4 visits * 3 examinations each
      expect(stats.examinationStats.completedExaminations).toBe(3); // 2 + 1 + 0 + 0
      expect(stats.examinationStats.completionRate).toBe(25); // 3/12 = 25%
    });

    it('should handle empty visit list', async () => {
      // Arrange
      mockVisitRepository.findBySurvey.mockResolvedValue([]);

      // Act
      const stats = await visitService.getVisitStatistics('survey-123');

      // Assert
      expect(stats.totalVisits).toBe(0);
      expect(stats.averageCompletionPercentage).toBe(0);
      expect(stats.examinationStats.completionRate).toBe(0);
    });

    it('should throw error if neither surveyId nor organizationId provided', async () => {
      // Act & Assert
      await expect(visitService.getVisitStatistics())
        .rejects.toThrow('Either surveyId or organizationId must be provided');
    });
  });

  describe('rescheduleVisit', () => {
    it('should reschedule visit with new date', async () => {
      // Arrange
      mockVisitRepository.findById.mockResolvedValue(mockVisit);
      mockVisitRepository.update.mockResolvedValue({
        ...mockVisit,
        status: 'rescheduled',
        deviationReason: 'Patient request'
      });

      // Mock the subsequent scheduling call
      mockVisitRepository.findBySurveyAndVisit.mockResolvedValue(mockVisit);
      const rescheduledVisit = {
        ...mockVisit,
        scheduledDate: '2024-01-03T00:00:00Z'
      };
      mockVisitRepository.update.mockResolvedValueOnce({
        ...mockVisit,
        status: 'rescheduled',
        deviationReason: 'Patient request'
      }).mockResolvedValueOnce(rescheduledVisit);

      // Act
      const result = await visitService.rescheduleVisit(
        'visit-1-123',
        '2024-01-03T00:00:00Z',
        'Patient request'
      );

      // Assert
      expect(result.visit.scheduledDate).toBe('2024-01-03T00:00:00Z');
      expect(result.protocolCompliant).toBe(true); // Within window
    });
  });

  describe('markVisitMissed', () => {
    it('should mark visit as missed with reason', async () => {
      // Arrange
      mockVisitRepository.findById.mockResolvedValue(mockVisit);
      const missedVisit = {
        ...mockVisit,
        status: 'missed' as const,
        deviationReason: 'Patient no-show'
      };
      mockVisitRepository.update.mockResolvedValue(missedVisit);

      // Act
      const result = await visitService.markVisitMissed('visit-1-123', 'Patient no-show');

      // Assert
      expect(mockVisitRepository.update).toHaveBeenCalledWith(
        'survey-123',
        {
          status: 'missed',
          deviationReason: 'Patient no-show'
        },
        'visit-1-123'
      );
      expect(result).toEqual(missedVisit);
    });
  });

  describe('cancelVisit', () => {
    it('should cancel visit with reason', async () => {
      // Arrange
      mockVisitRepository.findById.mockResolvedValue(mockVisit);
      const cancelledVisit = {
        ...mockVisit,
        status: 'cancelled' as const,
        deviationReason: 'Study terminated'
      };
      mockVisitRepository.update.mockResolvedValue(cancelledVisit);

      // Act
      const result = await visitService.cancelVisit('visit-1-123', 'Study terminated');

      // Assert
      expect(mockVisitRepository.update).toHaveBeenCalledWith(
        'survey-123',
        {
          status: 'cancelled',
          deviationReason: 'Study terminated'
        },
        'visit-1-123'
      );
      expect(result).toEqual(cancelledVisit);
    });
  });
});