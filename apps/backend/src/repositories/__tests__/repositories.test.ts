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
});