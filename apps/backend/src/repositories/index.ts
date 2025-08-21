// Base repositories
export { BaseRepository } from './BaseRepository.js';
export { BaseExaminationRepository, type BaseExaminationData } from './BaseExaminationRepository.js';

// Core management repositories
export { ClinicalStudyRepository } from './ClinicalStudyRepository.js';
export { OrganizationRepository } from './OrganizationRepository.js';
export { UserRepository, type UserRecord, type CreateUserWithCognitoRequest } from './UserRepository.js';
export { PatientRepository } from './PatientRepository.js';
export { SurveyRepository } from './SurveyRepository.js';
export { VisitRepository } from './VisitRepository.js';

// Draft data management
export { DraftDataRepository, type DraftRecord } from './DraftDataRepository.js';

// Examination repositories
export { BasicInfoRepository, type BasicInfoExaminationData } from './BasicInfoRepository.js';
export { VASRepository, type VASExaminationData } from './VASRepository.js';
export { ComparativeScoresRepository, type ComparativeScoresExaminationData } from './ComparativeScoresRepository.js';
export { LensFluidSurfaceAssessmentRepository, type LensFluidSurfaceAssessmentExaminationData } from './LensFluidSurfaceAssessmentRepository.js';
export { DR1Repository, type DR1ExaminationData } from './DR1Repository.js';
export { CorrectedVARepository, type CorrectedVAExaminationData } from './CorrectedVARepository.js';
export { LensInspectionRepository, type LensInspectionExaminationData } from './LensInspectionRepository.js';
export { QuestionnaireRepository, type QuestionnaireExaminationData } from './QuestionnaireRepository.js';

// Import classes for factory
import { ClinicalStudyRepository } from './ClinicalStudyRepository.js';
import { OrganizationRepository } from './OrganizationRepository.js';
import { UserRepository } from './UserRepository.js';
import { PatientRepository } from './PatientRepository.js';
import { SurveyRepository } from './SurveyRepository.js';
import { VisitRepository } from './VisitRepository.js';
import { DraftDataRepository } from './DraftDataRepository.js';
import { BasicInfoRepository } from './BasicInfoRepository.js';
import { VASRepository } from './VASRepository.js';
import { ComparativeScoresRepository } from './ComparativeScoresRepository.js';
import { LensFluidSurfaceAssessmentRepository } from './LensFluidSurfaceAssessmentRepository.js';
import { DR1Repository } from './DR1Repository.js';
import { CorrectedVARepository } from './CorrectedVARepository.js';
import { LensInspectionRepository } from './LensInspectionRepository.js';
import { QuestionnaireRepository } from './QuestionnaireRepository.js';

// Repository factory for dependency injection
export class RepositoryFactory {
  private static instance: RepositoryFactory;
  
  // Core repositories
  private _clinicalStudyRepository?: ClinicalStudyRepository;
  private _organizationRepository?: OrganizationRepository;
  private _userRepository?: UserRepository;
  private _patientRepository?: PatientRepository;
  private _surveyRepository?: SurveyRepository;
  private _visitRepository?: VisitRepository;
  private _draftDataRepository?: DraftDataRepository;
  
  // Examination repositories
  private _basicInfoRepository?: BasicInfoRepository;
  private _vasRepository?: VASRepository;
  private _comparativeScoresRepository?: ComparativeScoresRepository;
  private _lensFluidSurfaceAssessmentRepository?: LensFluidSurfaceAssessmentRepository;
  private _dr1Repository?: DR1Repository;
  private _correctedVARepository?: CorrectedVARepository;
  private _lensInspectionRepository?: LensInspectionRepository;
  private _questionnaireRepository?: QuestionnaireRepository;

  private constructor() {}

  public static getInstance(): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory();
    }
    return RepositoryFactory.instance;
  }

  // Core repository getters
  public getClinicalStudyRepository(): ClinicalStudyRepository {
    if (!this._clinicalStudyRepository) {
      this._clinicalStudyRepository = new ClinicalStudyRepository();
    }
    return this._clinicalStudyRepository;
  }

  public getOrganizationRepository(): OrganizationRepository {
    if (!this._organizationRepository) {
      this._organizationRepository = new OrganizationRepository();
    }
    return this._organizationRepository;
  }

  public getUserRepository(): UserRepository {
    if (!this._userRepository) {
      this._userRepository = new UserRepository();
    }
    return this._userRepository;
  }

  public getPatientRepository(): PatientRepository {
    if (!this._patientRepository) {
      this._patientRepository = new PatientRepository();
    }
    return this._patientRepository;
  }

  public getSurveyRepository(): SurveyRepository {
    if (!this._surveyRepository) {
      this._surveyRepository = new SurveyRepository();
    }
    return this._surveyRepository;
  }

  public getVisitRepository(): VisitRepository {
    if (!this._visitRepository) {
      this._visitRepository = new VisitRepository();
    }
    return this._visitRepository;
  }

  public getDraftDataRepository(): DraftDataRepository {
    if (!this._draftDataRepository) {
      this._draftDataRepository = new DraftDataRepository();
    }
    return this._draftDataRepository;
  }

  // Examination repository getters
  public getBasicInfoRepository(): BasicInfoRepository {
    if (!this._basicInfoRepository) {
      this._basicInfoRepository = new BasicInfoRepository();
    }
    return this._basicInfoRepository;
  }

  public getVASRepository(): VASRepository {
    if (!this._vasRepository) {
      this._vasRepository = new VASRepository();
    }
    return this._vasRepository;
  }

  public getComparativeScoresRepository(): ComparativeScoresRepository {
    if (!this._comparativeScoresRepository) {
      this._comparativeScoresRepository = new ComparativeScoresRepository();
    }
    return this._comparativeScoresRepository;
  }

  public getLensFluidSurfaceAssessmentRepository(): LensFluidSurfaceAssessmentRepository {
    if (!this._lensFluidSurfaceAssessmentRepository) {
      this._lensFluidSurfaceAssessmentRepository = new LensFluidSurfaceAssessmentRepository();
    }
    return this._lensFluidSurfaceAssessmentRepository;
  }

  public getDR1Repository(): DR1Repository {
    if (!this._dr1Repository) {
      this._dr1Repository = new DR1Repository();
    }
    return this._dr1Repository;
  }

  public getCorrectedVARepository(): CorrectedVARepository {
    if (!this._correctedVARepository) {
      this._correctedVARepository = new CorrectedVARepository();
    }
    return this._correctedVARepository;
  }

  public getLensInspectionRepository(): LensInspectionRepository {
    if (!this._lensInspectionRepository) {
      this._lensInspectionRepository = new LensInspectionRepository();
    }
    return this._lensInspectionRepository;
  }

  public getQuestionnaireRepository(): QuestionnaireRepository {
    if (!this._questionnaireRepository) {
      this._questionnaireRepository = new QuestionnaireRepository();
    }
    return this._questionnaireRepository;
  }

  // Utility method to get all repositories
  public getAllRepositories() {
    return {
      clinicalStudy: this.getClinicalStudyRepository(),
      organization: this.getOrganizationRepository(),
      user: this.getUserRepository(),
      patient: this.getPatientRepository(),
      survey: this.getSurveyRepository(),
      visit: this.getVisitRepository(),
      draftData: this.getDraftDataRepository(),
      basicInfo: this.getBasicInfoRepository(),
      vas: this.getVASRepository(),
      comparativeScores: this.getComparativeScoresRepository(),
      lensFluidSurfaceAssessment: this.getLensFluidSurfaceAssessmentRepository(),
      dr1: this.getDR1Repository(),
      correctedVA: this.getCorrectedVARepository(),
      lensInspection: this.getLensInspectionRepository(),
      questionnaire: this.getQuestionnaireRepository(),
    };
  }

  // Helper method to get examination repositories by ID
  public getExaminationRepository(examinationId: string) {
    switch (examinationId) {
      case 'basicInfo':
        return this.getBasicInfoRepository();
      case 'vas':
        return this.getVASRepository();
      case 'comparativeScores':
        return this.getComparativeScoresRepository();
      case 'lensFluidSurfaceAssessment':
        return this.getLensFluidSurfaceAssessmentRepository();
      case 'dr1':
        return this.getDR1Repository();
      case 'correctedVA':
        return this.getCorrectedVARepository();
      case 'lensInspection':
        return this.getLensInspectionRepository();
      case 'questionnaire':
        return this.getQuestionnaireRepository();
      default:
        throw new Error(`Unknown examination type: ${examinationId}`);
    }
  }
}