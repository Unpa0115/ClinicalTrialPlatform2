// Base repositories
export { BaseRepository } from './BaseRepository.js';
export { BaseExaminationRepository, type BaseExaminationData } from './BaseExaminationRepository.js';

// Core management repositories
export { ClinicalStudyRepository } from './ClinicalStudyRepository.js';
export { OrganizationRepository } from './OrganizationRepository.js';
export { PatientRepository } from './PatientRepository.js';
export { SurveyRepository } from './SurveyRepository.js';
export { VisitRepository } from './VisitRepository.js';

// Draft data management
export { DraftDataRepository, type DraftRecord } from './DraftDataRepository.js';

// Examination repositories
export { BasicInfoRepository, type BasicInfoExaminationData } from './BasicInfoRepository.js';
export { VASRepository, type VASExaminationData } from './VASRepository.js';

// Import classes for factory
import { ClinicalStudyRepository } from './ClinicalStudyRepository.js';
import { OrganizationRepository } from './OrganizationRepository.js';
import { PatientRepository } from './PatientRepository.js';
import { SurveyRepository } from './SurveyRepository.js';
import { VisitRepository } from './VisitRepository.js';
import { DraftDataRepository } from './DraftDataRepository.js';
import { BasicInfoRepository } from './BasicInfoRepository.js';
import { VASRepository } from './VASRepository.js';

// Repository factory for dependency injection
export class RepositoryFactory {
  private static instance: RepositoryFactory;
  
  // Core repositories
  private _clinicalStudyRepository?: ClinicalStudyRepository;
  private _organizationRepository?: OrganizationRepository;
  private _patientRepository?: PatientRepository;
  private _surveyRepository?: SurveyRepository;
  private _visitRepository?: VisitRepository;
  private _draftDataRepository?: DraftDataRepository;
  
  // Examination repositories
  private _basicInfoRepository?: BasicInfoRepository;
  private _vasRepository?: VASRepository;

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

  // Utility method to get all repositories
  public getAllRepositories() {
    return {
      clinicalStudy: this.getClinicalStudyRepository(),
      organization: this.getOrganizationRepository(),
      patient: this.getPatientRepository(),
      survey: this.getSurveyRepository(),
      visit: this.getVisitRepository(),
      draftData: this.getDraftDataRepository(),
      basicInfo: this.getBasicInfoRepository(),
      vas: this.getVASRepository(),
    };
  }
}