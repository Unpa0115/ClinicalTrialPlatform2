// Clinical Study Types
export interface ClinicalStudyRecord {
  clinicalStudyId: string;
  studyName: string;
  studyCode: string;
  description: string;
  startDate: string;
  endDate: string;
  targetOrganizations: string[];
  maxPatientsPerOrganization: number;
  totalTargetPatients: number;
  visitTemplate: VisitTemplate[];
  examinations: ExaminationConfig[];
  status:
    | 'planning'
    | 'active'
    | 'recruiting'
    | 'completed'
    | 'suspended'
    | 'terminated';
  currentPhase: string;
  enrolledPatients: number;
  protocolVersion: string;
  ethicsApprovalNumber?: string;
  regulatoryApprovals: string[];
  createdBy: string;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
  entityType: 'clinical-study';
}

export interface VisitTemplate {
  visitNumber: number;
  visitType: 'baseline' | '1week' | '1month' | '3month' | 'custom';
  visitName: string;
  scheduledDaysFromBaseline: number;
  windowDaysBefore: number;
  windowDaysAfter: number;
  requiredExaminations: string[];
  optionalExaminations: string[];
  examinationOrder: string[];
  isRequired: boolean;
}

export interface ExaminationConfig {
  examinationId: string;
  examinationName: string;
  description: string;
  isRequired: boolean;
  estimatedDuration: number;
}

// Organization Types
export interface OrganizationRecord {
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  organizationType:
    | 'hospital'
    | 'clinic'
    | 'research_center'
    | 'university'
    | 'other';
  address: {
    country: string;
    prefecture: string;
    city: string;
    addressLine1: string;
    addressLine2?: string;
    postalCode: string;
  };
  phoneNumber: string;
  email: string;
  website?: string;
  principalInvestigator: string;
  studyCoordinator: string;
  contactPerson: string;
  maxPatientCapacity: number;
  availableEquipment: string[];
  certifications: string[];
  status: 'active' | 'inactive' | 'pending_approval' | 'suspended';
  approvalDate?: string;
  activeStudies: string[];
  createdBy: string;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
  entityType: 'organization';
}

// Patient Types
export interface PatientRecord {
  patientId: string;
  patientCode: string;
  patientInitials?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  registeredOrganizationId: string;
  registrationDate: string;
  medicalHistory?: string[];
  currentMedications?: string[];
  allergies?: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    emergencyContact?: string;
  };
  status: 'active' | 'inactive' | 'withdrawn' | 'completed';
  participatingStudies: string[];
  createdBy: string;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
  entityType: 'patient';
}

// Survey Types
export interface SurveyRecord {
  surveyId: string;
  clinicalStudyId: string;
  organizationId: string;
  patientId: string;
  name: string;
  description?: string;
  baselineDate: string;
  expectedCompletionDate: string;
  status: 'active' | 'completed' | 'withdrawn' | 'suspended';
  completionPercentage: number;
  totalVisits: number;
  completedVisits: number;
  assignedBy: string;
  conductedBy?: string;
  createdAt: string;
  updatedAt: string;
  entityType: 'survey';
}

// Visit Types
export interface VisitRecord {
  surveyId: string;
  visitId: string;
  clinicalStudyId: string;
  organizationId: string;
  patientId: string;
  visitNumber: number;
  visitType: 'baseline' | '1week' | '1month' | '3month' | 'custom';
  visitName: string;
  scheduledDate: string;
  actualDate?: string;
  windowStartDate: string;
  windowEndDate: string;
  status:
    | 'scheduled'
    | 'in_progress'
    | 'completed'
    | 'missed'
    | 'cancelled'
    | 'rescheduled';
  completionPercentage: number;
  requiredExaminations: string[];
  optionalExaminations: string[];
  examinationOrder: string[];
  completedExaminations: string[];
  skippedExaminations: string[];
  visitNotes?: string;
  deviationReason?: string;
  conductedBy: string;
  createdAt: string;
  updatedAt: string;
}

// User Types
export interface UserRecord {
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  title: string;
  department?: string;
  specialization?: string;
  licenseNumber?: string;
  primaryOrganizationId: string;
  accessibleOrganizations: string[];
  role:
    | 'super_admin'
    | 'study_admin'
    | 'org_admin'
    | 'investigator'
    | 'coordinator'
    | 'data_entry'
    | 'viewer';
  permissions: string[];
  accessibleStudies: string[];
  status: 'active' | 'inactive' | 'pending_activation' | 'suspended' | 'locked';
  lastLoginAt?: string;
  passwordChangedAt: string;
  failedLoginAttempts: number;
  passwordHash: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  language: 'ja' | 'en';
  timezone: string;
  createdBy: string;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
  entityType: 'user';
}

// Base Examination Data Types with standardized Eyeside field
export interface BaseExaminationData {
  visitId: string;
  surveyId: string; // Auto-populated
  patientId: string;
  clinicalStudyId: string;
  organizationId: string;
  eyeside: 'Right' | 'Left'; // Standardized field
  createdAt: string;
  updatedAt: string;
}

// BasicInfo Examination Data (基礎情報)
export interface BasicInfoExaminationData extends BaseExaminationData {
  basicInfoId: string;
  
  // Basic Information Data
  currentUsedCL: string; // 現在使用しているコンタクトレンズ
  
  // 角膜曲率半径
  cr_R1: number; // Integer
  cr_R2: number; // Integer
  cr_Ave: number; // Integer - 平均
  
  // 屈折検査
  va: number; // Float - 視力
  s: number; // Float - 球面度数
  c: number; // Float - 円柱度数
  ax: number; // Integer - 軸
  
  // 眼圧
  intraocularPressure1: number; // Integer
  intraocularPressure2: number; // Integer
  intraocularPressure3: number; // Integer
  
  // 角膜内皮細胞
  cornealEndothelialCells: number; // Integer
}

// VAS Examination Data (Visual Analog Scale)
export interface VASExaminationData extends BaseExaminationData {
  vasId: string;
  
  // VAS Data (0-100 scale)
  comfortLevel: number; // Integer (0-100)
  drynessLevel: number; // Integer (0-100)
  visualPerformance_Daytime: number; // Integer (0-100)
  visualPerformance_EndOfDay: number; // Integer (0-100)
}

// Comparative Scores Examination Data (相対評価)
export interface ComparativeExaminationData extends BaseExaminationData {
  comparativeScoresId: string;
  
  // Comparative Assessment Data
  comfort: string;
  comfortReason: string;
  dryness: string;
  drynessReason: string;
  
  // Visual Performance
  vp_DigitalDevice: string;
  vpReason_DigitalDevice: string;
  vp_DayTime: string;
  vpReason_DayTime: string;
  vp_EndOfDay: string;
  vpReason_EndOfDay: string;
  vp_Glare: string;
  vpReason_Glare: string;
  vp_Halo: string;
  vpReason_Halo: string;
  vp_StarBurst: string;
  vpReason_StarBurst: string;
  
  // Overall Assessment
  eyeStrain: string;
  eyeStrainReason: string;
  totalSatisfaction: string;
  totalSatisfactionReason: string;
}

// Fitting Examination Data (フィッティング・涙濡れ性検査)
export interface FittingExaminationData extends BaseExaminationData {
  fittingId: string;
  
  // Fitting Assessment Data
  timing: string;
  lensMovement: number; // Float
  lensPosition: string;
  fittingPattern: string;
  lensWettability: string;
  surfaceDeposit: string;
  lensDryness: string;
  
  // FACE2 Assessment
  face2_X: number; // Float
  face2_Y: number; // Float
}

// DR1 Examination Data (涙液層検査)
export interface DR1ExaminationData extends BaseExaminationData {
  dr1Id: string;
  
  // Tear Film Assessment Data
  tearBreakUpTime: number; // Float - 涙液破綻時間
  schirmerTest: number; // Integer - シルマーテスト値
  tearMeniscusHeight: number; // Float - 涙液メニスカス高
  
  // Additional Assessments
  tearQuality: string; // 涙液の質的評価
  blinkingPattern: string; // 瞬目パターン
}

// Corrected VA Examination Data (矯正視力検査)
export interface CorrectedVAExaminationData extends BaseExaminationData {
  correctedVAId: string;
  
  // Visual Acuity Data
  va_WithoutLens: string; // レンズなし視力
  va_WithLens: string; // レンズ装用時視力
  
  // Red-Green Test
  redGreenTest: string; // 赤緑テスト
  
  // S-Correction (球面度数補正)
  va_S_Correction: string; // S補正後視力
  s_S_Correction: string; // S補正値
  clarity_S_Correction: string; // S補正後明瞭度
  clarityDetail_S_Correction: string; // S補正後明瞭度詳細
  stability_S_Correction: string; // S補正後安定性
  stabilityDetail_S_Correction: string; // S補正後安定性詳細
  
  // SC-Correction (球面円柱度数補正)
  va_SC_Correction: string; // SC補正後視力
  s_SC_Correction: string; // SC補正球面度数
  c_SC_Correction: string; // SC補正円柱度数
  ax_SC_Correction: string; // SC補正軸
  clarity_SC_Correction: string; // SC補正後明瞭度
  clarityDetail_SC_Correction: string; // SC補正後明瞭度詳細
  stability_SC_Correction: string; // SC補正後安定性
  stabilityDetail_SC_Correction: string; // SC補正後安定性詳細
}

// Lens Inspection Examination Data (レンズ検査)
export interface LensInspectionExaminationData extends BaseExaminationData {
  lensInspectionId: string;
  
  // Lens Inspection Data
  lensDeposit: string; // レンズ汚れ
  lensScratchDamage: string; // レンズ傷・損傷
}

// Questionnaire Examination Data (問診)
export interface QuestionnaireExaminationData extends BaseExaminationData {
  questionnaireId: string;
  
  // Basic Information
  timing: string; // タイミング
  
  // Comfort Assessment (時間帯別)
  comfort: string; // 全体的な快適性
  comfortDetail: string; // 快適性詳細
  comfort_Initial: string; // 装用直後の快適性
  comfortDetail_Initial: string; // 装用直後の快適性詳細
  comfort_Daytime: string; // 日中の快適性
  comfortDetail_Daytime: string; // 日中の快適性詳細
  comfort_Afternoon: string; // 午後の快適性
  comfortDetail_Afternoon: string; // 午後の快適性詳細
  comfort_EndOfDay: string; // 一日の終わりの快適性
  comfortDetail_EndOfDay: string; // 一日の終わりの快適性詳細
  
  // Dryness Assessment (時間帯別)
  dryness: string; // 全体的な乾燥感
  drynessDetail: string; // 乾燥感詳細
  dryness_Initial: string; // 装用直後の乾燥感
  drynessDetail_Initial: string; // 装用直後の乾燥感詳細
  dryness_Daytime: string; // 日中の乾燥感
  drynessDetail_Daytime: string; // 日中の乾燥感詳細
  dryness_Afternoon: string; // 午後の乾燥感
  drynessDetail_Afternoon: string; // 午後の乾燥感詳細
  dryness_EndOfDay: string; // 一日の終わりの乾燥感
  drynessDetail_EndOfDay: string; // 一日の終わりの乾燥感詳細
  
  // Symptom Assessment
  irritation: string; // 刺激感
  irritationDetail: string; // 刺激感詳細
  burning: string; // 灼熱感
  burningDetail: string; // 灼熱感詳細
  
  // Lens Handling
  easeOfInsertion: string; // 装用のしやすさ
  easeOfInsertionDetail: string; // 装用のしやすさ詳細
  easeOfRemoval: string; // 取り外しのしやすさ
  easeOfRemovalDetail: string; // 取り外しのしやすさ詳細
  
  // Visual Performance
  visualPerformance: string; // 視覚性能
  visualPerformanceDetail: string; // 視覚性能詳細
  
  // Overall Assessment
  eyeStrain: string; // 眼精疲労
  eyeStrainDetail: string; // 眼精疲労詳細
  totalSatisfaction: string; // 総合満足度
  totalSatisfactionDetail: string; // 総合満足度詳細
  
  // Other Symptoms
  otherSymptoms: string; // その他の症状
  otherSymptomsDetail: string; // その他の症状詳細
}

// Audit Log Types
export interface AuditLogRecord {
  logId: string;
  timestamp: string;
  eventType: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'export' | 'import';
  action: string;
  userId: string;
  username: string;
  userRole: string;
  targetType: 'clinical_study' | 'survey' | 'visit' | 'examination' | 'user' | 'organization' | 'patient';
  targetId: string;
  targetName?: string;
  clinicalStudyId?: string;
  organizationId?: string;
  patientId?: string;
  surveyId?: string;
  visitId?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  entityType: 'audit-log';
}

// Draft Data Types
export interface DraftRecord {
  visitId: string;
  draftId: 'current';
  formData: {
    [examinationId: string]: {
      right?: any;
      left?: any;
    };
  };
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  examinationOrder: string[];
  lastSaved: string;
  autoSaved: boolean;
  ttl: number;
}
