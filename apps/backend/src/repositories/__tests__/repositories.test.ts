import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RepositoryFactory } from '../index.js';
import { ClinicalStudyRecord, OrganizationRecord, PatientRecord } from '@clinical-trial/shared';

describe('Repository Integration Tests', () => {
  let repositoryFactory: RepositoryFactory;

  beforeAll(() => {
    repositoryFactory = RepositoryFactory.getInstance();
  });

  describe('ClinicalStudyRepository', () => {
    it('should create and retrieve a clinical study', async () => {
      const clinicalStudyRepo = repositoryFactory.getClinicalStudyRepository();
      
      const studyData: Omit<ClinicalStudyRecord, 'clinicalStudyId' | 'createdAt' | 'updatedAt' | 'entityType'> = {
        studyName: 'Test Clinical Study',
        studyCode: 'TEST-001',
        description: 'Test study for repository validation',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
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
            requiredExaminations: ['basic-info', 'vas'],
            optionalExaminations: [],
            examinationOrder: ['basic-info', 'vas'],
            isRequired: true,
          }
        ],
        examinations: [
          {
            examinationId: 'basic-info',
            examinationName: '基礎情報',
            description: 'Basic patient information',
            isRequired: true,
            estimatedDuration: 30,
          }
        ],
        status: 'planning',
        currentPhase: 'Phase 1',
        enrolledPatients: 0,
        protocolVersion: 'v1.0',
        regulatoryApprovals: [],
        createdBy: 'test-user',
        lastModifiedBy: 'test-user',
      };

      const createdStudy = await clinicalStudyRepo.createStudy(studyData);
      
      expect(createdStudy.clinicalStudyId).toBeDefined();
      expect(createdStudy.studyName).toBe(studyData.studyName);
      expect(createdStudy.studyCode).toBe(studyData.studyCode);
      expect(createdStudy.entityType).toBe('clinical-study');
      expect(createdStudy.createdAt).toBeDefined();
      expect(createdStudy.updatedAt).toBeDefined();

      // Test retrieval
      const retrievedStudy = await clinicalStudyRepo.findById(createdStudy.clinicalStudyId);
      expect(retrievedStudy).toEqual(createdStudy);
    });
  });

  describe('OrganizationRepository', () => {
    it('should create and retrieve an organization', async () => {
      const organizationRepo = repositoryFactory.getOrganizationRepository();
      
      const orgData: Omit<OrganizationRecord, 'organizationId' | 'createdAt' | 'updatedAt' | 'entityType'> = {
        organizationName: 'Test Hospital',
        organizationCode: 'TEST-HOSP',
        organizationType: 'hospital',
        address: {
          country: 'Japan',
          prefecture: 'Tokyo',
          city: 'Shibuya',
          addressLine1: '1-1-1 Test Street',
          postalCode: '150-0001',
        },
        phoneNumber: '03-1234-5678',
        email: 'test@hospital.com',
        principalInvestigator: 'Dr. Test',
        studyCoordinator: 'Coordinator Test',
        contactPerson: 'Contact Test',
        maxPatientCapacity: 100,
        availableEquipment: ['equipment1', 'equipment2'],
        certifications: ['cert1', 'cert2'],
        status: 'active',
        activeStudies: [],
        createdBy: 'test-user',
        lastModifiedBy: 'test-user',
      };

      const createdOrg = await organizationRepo.createOrganization(orgData);
      
      expect(createdOrg.organizationId).toBeDefined();
      expect(createdOrg.organizationName).toBe(orgData.organizationName);
      expect(createdOrg.organizationCode).toBe(orgData.organizationCode);
      expect(createdOrg.entityType).toBe('organization');

      // Test retrieval by code
      const retrievedOrg = await organizationRepo.findByCode(orgData.organizationCode);
      expect(retrievedOrg).toEqual(createdOrg);
    });
  });

  describe('PatientRepository', () => {
    it('should create and retrieve a patient', async () => {
      const patientRepo = repositoryFactory.getPatientRepository();
      
      const patientData: Omit<PatientRecord, 'patientId' | 'createdAt' | 'updatedAt' | 'entityType'> = {
        patientCode: 'P001',
        patientInitials: 'T.S.',
        gender: 'male',
        registeredOrganizationId: 'org-test-123',
        registrationDate: '2024-01-15',
        status: 'active',
        participatingStudies: [],
        createdBy: 'test-user',
        lastModifiedBy: 'test-user',
      };

      const createdPatient = await patientRepo.createPatient(patientData);
      
      expect(createdPatient.patientId).toBeDefined();
      expect(createdPatient.patientCode).toBe(patientData.patientCode);
      expect(createdPatient.entityType).toBe('patient');

      // Test organization-based search
      const orgPatients = await patientRepo.findByOrganization(patientData.registeredOrganizationId);
      expect(orgPatients.patients).toHaveLength(1);
      expect(orgPatients.patients[0]).toEqual(createdPatient);
    });
  });

  describe('DraftDataRepository', () => {
    it('should save and retrieve draft data', async () => {
      const draftRepo = repositoryFactory.getDraftDataRepository();
      
      const visitId = 'visit-test-123';
      const formData = {
        'basic-info': {
          right: { currentUsedCL: 'Test Lens Right' },
          left: { currentUsedCL: 'Test Lens Left' }
        },
        'vas': {
          right: { comfortLevel: 75 },
          left: { comfortLevel: 70 }
        }
      };
      const examinationOrder = ['basic-info', 'vas'];

      const savedDraft = await draftRepo.saveDraft(
        visitId,
        formData,
        0, // currentStep
        2, // totalSteps
        [], // completedSteps
        examinationOrder,
        true // autoSaved
      );

      expect(savedDraft.visitId).toBe(visitId);
      expect(savedDraft.draftId).toBe('current');
      expect(savedDraft.formData).toEqual(formData);
      expect(savedDraft.examinationOrder).toEqual(examinationOrder);
      expect(savedDraft.ttl).toBeDefined();

      // Test retrieval
      const retrievedDraft = await draftRepo.getDraft(visitId);
      expect(retrievedDraft).toEqual(savedDraft);

      // Test stats
      const stats = await draftRepo.getDraftStats(visitId);
      expect(stats?.exists).toBe(true);
      expect(stats?.totalSteps).toBe(2);
      expect(stats?.completedSteps).toBe(0);
    });
  });

  describe('BasicInfoRepository', () => {
    it('should create and retrieve basic info examination data', async () => {
      const basicInfoRepo = repositoryFactory.getBasicInfoRepository();
      
      const visitId = 'visit-test-456';
      const surveyId = 'survey-test-456';
      const patientId = 'patient-test-456';
      const clinicalStudyId = 'study-test-456';
      const organizationId = 'org-test-456';
      
      const basicInfoData = {
        currentUsedCL: 'Acuvue Oasys',
        cr_R1: 7.8,
        cr_R2: 7.6,
        cr_Ave: 7.7,
        va: 1.2,
        s: -2.5,
        c: -0.5,
        ax: 180,
        intraocularPressure1: 14,
        intraocularPressure2: 15,
        intraocularPressure3: 14,
        cornealEndothelialCells: 2800,
      };

      const createdBasicInfo = await basicInfoRepo.createBasicInfo(
        visitId, surveyId, patientId, clinicalStudyId, organizationId,
        'Right', basicInfoData
      );

      expect(createdBasicInfo.basicInfoId).toBeDefined();
      expect(createdBasicInfo.visitId).toBe(visitId);
      expect(createdBasicInfo.surveyId).toBe(surveyId);
      expect(createdBasicInfo.eyeside).toBe('Right');
      expect(createdBasicInfo.currentUsedCL).toBe(basicInfoData.currentUsedCL);

      // Test average IOP calculation
      const avgIOP = await basicInfoRepo.getAverageIOP(visitId, 'Right');
      expect(avgIOP).toBe(14.3); // (14 + 15 + 14) / 3 = 14.33, rounded to 14.3
    });
  });

  describe('VASRepository', () => {
    it('should create and retrieve VAS examination data', async () => {
      const vasRepo = repositoryFactory.getVASRepository();
      
      const visitId = 'visit-test-789';
      const surveyId = 'survey-test-789';
      const patientId = 'patient-test-789';
      const clinicalStudyId = 'study-test-789';
      const organizationId = 'org-test-789';
      
      const vasData = {
        comfortLevel: 75,
        drynessLevel: 30,
        visualPerformance_Daytime: 85,
        visualPerformance_EndOfDay: 70,
      };

      const createdVAS = await vasRepo.createVAS(
        visitId, surveyId, patientId, clinicalStudyId, organizationId,
        'Right', vasData
      );

      expect(createdVAS.vasId).toBeDefined();
      expect(createdVAS.visitId).toBe(visitId);
      expect(createdVAS.surveyId).toBe(surveyId);
      expect(createdVAS.eyeside).toBe('Right');
      expect(createdVAS.comfortLevel).toBe(vasData.comfortLevel);

      // Test both eyes data retrieval
      const bothEyesData = await vasRepo.getBothEyesData(visitId);
      expect(bothEyesData.right).toEqual(createdVAS);
      expect(bothEyesData.left).toBeNull();
    });
  });

  describe('ComparativeScoresRepository', () => {
    it('should create and validate comparative scores data', async () => {
      const comparativeRepo = repositoryFactory.getComparativeScoresRepository();
      
      const visitId = 'visit-comp-123';
      const surveyId = 'survey-comp-123';
      const patientId = 'patient-comp-123';
      const clinicalStudyId = 'study-comp-123';
      const organizationId = 'org-comp-123';
      
      const comparativeData = {
        comfort: 'better',
        comfortReason: 'Improved lens design',
        dryness: 'much_better',
        drynessReason: 'Enhanced moisture retention',
        vp_DigitalDevice: 'better',
        vpReason_DigitalDevice: 'Clearer screen viewing',
        vp_DayTime: 'same',
        vpReason_DayTime: 'No significant change',
        vp_EndOfDay: 'better',
        vpReason_EndOfDay: 'Less fatigue',
        vp_Glare: 'same',
        vpReason_Glare: 'No change noted',
        vp_Halo: 'same',
        vpReason_Halo: 'Stable performance',
        vp_StarBurst: 'better',
        vpReason_StarBurst: 'Reduced visual artifacts',
        eyeStrain: 'better',
        eyeStrainReason: 'More comfortable wear',
        totalSatisfaction: 'better',
        totalSatisfactionReason: 'Overall improvement'
      };

      const created = await comparativeRepo.createComparativeScores(
        visitId, surveyId, patientId, clinicalStudyId, organizationId,
        'Right', comparativeData
      );

      expect(created.comparativeScoresId).toBeDefined();
      expect(created.comfort).toBe('better');
      expect(created.comfortReason).toBe('Improved lens design');
      expect(created.eyeside).toBe('Right');
    });

    it('should validate invalid assessment values', async () => {
      const comparativeRepo = repositoryFactory.getComparativeScoresRepository();
      
      const invalidData = {
        comfort: 'invalid_value', // Invalid assessment
        comfortReason: 'Test reason'
      } as any;

      await expect(
        comparativeRepo.createComparativeScores(
          'test-visit', 'test-survey', 'test-patient', 'test-study', 'test-org',
          'Right', invalidData
        )
      ).rejects.toThrow();
    });
  });

  describe('LensFluidSurfaceAssessmentRepository', () => {
    it('should create lens fitting assessment data', async () => {
      const fittingRepo = repositoryFactory.getLensFluidSurfaceAssessmentRepository();
      
      const visitId = 'visit-fit-123';
      const surveyId = 'survey-fit-123';
      const patientId = 'patient-fit-123';
      const clinicalStudyId = 'study-fit-123';
      const organizationId = 'org-fit-123';
      
      const fittingData = {
        timing: 'after_15min',
        lensMovement: 1.2,
        lensPosition: 'optimal',
        fittingPattern: 'ideal',
        lensWettability: 'excellent',
        surfaceDeposit: 'minimal',
        lensDryness: 'none',
        face2_X: 0.1,
        face2_Y: -0.2
      };

      const created = await fittingRepo.createLensFluidSurfaceAssessment(
        visitId, surveyId, patientId, clinicalStudyId, organizationId,
        'Right', fittingData
      );

      expect(created.fittingId).toBeDefined();
      expect(created.lensMovement).toBe(1.2);
      expect(created.face2_X).toBe(0.1);
      expect(created.face2_Y).toBe(-0.2);
      expect(created.eyeside).toBe('Right');
    });

    it('should validate FACE2 coordinates within range', async () => {
      const fittingRepo = repositoryFactory.getLensFluidSurfaceAssessmentRepository();
      
      const invalidData = {
        timing: 'initial',
        lensMovement: 1.0,
        lensPosition: 'optimal',
        fittingPattern: 'ideal',
        lensWettability: 'good',
        surfaceDeposit: 'none',
        lensDryness: 'none',
        face2_X: 10.0, // Out of range (-5 to +5)
        face2_Y: 0.0
      };

      await expect(
        fittingRepo.createLensFluidSurfaceAssessment(
          'test-visit', 'test-survey', 'test-patient', 'test-study', 'test-org',
          'Right', invalidData
        )
      ).rejects.toThrow('face2_X must be between -5 and +5');
    });
  });

  describe('DR1Repository', () => {
    it('should create tear film assessment data', async () => {
      const dr1Repo = repositoryFactory.getDR1Repository();
      
      const visitId = 'visit-dr1-123';
      const surveyId = 'survey-dr1-123';
      const patientId = 'patient-dr1-123';
      const clinicalStudyId = 'study-dr1-123';
      const organizationId = 'org-dr1-123';
      
      const dr1Data = {
        tearBreakUpTime: 8.5,
        schirmerTest: 12,
        tearMeniscusHeight: 0.25,
        tearQuality: 'good',
        blinkingPattern: 'normal'
      };

      const created = await dr1Repo.createDR1(
        visitId, surveyId, patientId, clinicalStudyId, organizationId,
        'Right', dr1Data
      );

      expect(created.dr1Id).toBeDefined();
      expect(created.tearBreakUpTime).toBe(8.5);
      expect(created.schirmerTest).toBe(12);
      expect(created.tearQuality).toBe('good');
      expect(created.eyeside).toBe('Right');
    });

    it('should validate tear film measurement ranges', async () => {
      const dr1Repo = repositoryFactory.getDR1Repository();
      
      const invalidData = {
        tearBreakUpTime: 35.0, // Out of range (1-30 seconds)
        schirmerTest: 10,
        tearMeniscusHeight: 0.3,
        tearQuality: 'good',
        blinkingPattern: 'normal'
      };

      await expect(
        dr1Repo.createDR1(
          'test-visit', 'test-survey', 'test-patient', 'test-study', 'test-org',
          'Right', invalidData
        )
      ).rejects.toThrow('Tear break-up time must be between 1 and 30 seconds');
    });
  });

  describe('Enhanced DraftDataRepository', () => {
    it('should validate form data completeness', async () => {
      const draftRepo = repositoryFactory.getDraftDataRepository();
      
      const visitId = 'visit-validation-123';
      const formData = {
        'basicInfo': {
          right: { currentUsedCL: 'Test Lens' },
          // Missing left eye data
        },
        'vas': {
          right: { comfortLevel: 75 },
          left: { comfortLevel: 70 }
        }
      };
      
      await draftRepo.saveDraft(
        visitId, formData, 1, 2, ['basicInfo'], ['basicInfo', 'vas']
      );

      const validation = await draftRepo.validateFormData(visitId);
      
      expect(validation.isValid).toBe(false);
      expect(validation.warnings).toContain('basicInfo - missing left eye data');
    });

    it('should get completion summary', async () => {
      const draftRepo = repositoryFactory.getDraftDataRepository();
      
      const visitId = 'visit-completion-123';
      const formData = {
        'basicInfo': {
          right: { currentUsedCL: 'Test' },
          left: { currentUsedCL: 'Test' }
        },
        'vas': {
          right: { comfortLevel: 75 }
          // Missing left eye
        },
        'dr1': {
          // No data
        }
      };
      
      await draftRepo.saveDraft(
        visitId, formData, 1, 3, ['basicInfo'], ['basicInfo', 'vas', 'dr1']
      );

      const summary = await draftRepo.getCompletionSummary(visitId);
      
      expect(summary).not.toBeNull();
      expect(summary?.totalExaminations).toBe(3);
      expect(summary?.completedExaminations).toBe(1); // Only basicInfo has both eyes
      expect(summary?.partiallyCompleted).toBe(1); // VAS has only right eye
      expect(summary?.notStarted).toBe(1); // DR1 has no data
      expect(summary?.readyForSubmission).toBe(false);
    });

    it('should handle auto-save with conflict detection', async () => {
      const draftRepo = repositoryFactory.getDraftDataRepository();
      
      const visitId = 'visit-autosave-123';
      
      // Initialize draft
      await draftRepo.saveDraft(
        visitId, {}, 0, 2, [], ['basicInfo', 'vas']
      );

      // Simulate auto-save
      const autoSaveResult = await draftRepo.autoSave(visitId, {
        formData: { basicInfo: { right: { currentUsedCL: 'Updated' } } }
      });

      expect(autoSaveResult.success).toBe(true);
      expect(autoSaveResult.latestDraft).toBeDefined();
    });
  });
});