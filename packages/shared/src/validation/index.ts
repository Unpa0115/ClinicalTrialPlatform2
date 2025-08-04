import { z } from 'zod';

// Base validation schemas
export const EyesideSchema = z.enum(['Right', 'Left']);

export const BaseExaminationDataSchema = z.object({
  visitId: z.string().min(1, 'Visit ID is required'),
  surveyId: z.string().min(1, 'Survey ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  clinicalStudyId: z.string().min(1, 'Clinical Study ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  eyeside: EyesideSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Clinical Study validation
export const VisitTemplateSchema = z.object({
  visitNumber: z.number().int().positive(),
  visitType: z.enum(['baseline', '1week', '1month', '3month', 'custom']),
  visitName: z.string().min(1, 'Visit name is required'),
  scheduledDaysFromBaseline: z.number().int().min(0),
  windowDaysBefore: z.number().int().min(0),
  windowDaysAfter: z.number().int().min(0),
  requiredExaminations: z.array(z.string()),
  optionalExaminations: z.array(z.string()),
  examinationOrder: z.array(z.string()),
  isRequired: z.boolean(),
});

export const ExaminationConfigSchema = z.object({
  examinationId: z.string().min(1),
  examinationName: z.string().min(1),
  description: z.string(),
  isRequired: z.boolean(),
  estimatedDuration: z.number().int().positive(),
});

export const ClinicalStudyRecordSchema = z.object({
  clinicalStudyId: z.string().min(1),
  studyName: z.string().min(1, 'Study name is required'),
  studyCode: z.string().min(1, 'Study code is required'),
  description: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  targetOrganizations: z.array(z.string()),
  maxPatientsPerOrganization: z.number().int().positive(),
  totalTargetPatients: z.number().int().positive(),
  visitTemplate: z.array(VisitTemplateSchema),
  examinations: z.array(ExaminationConfigSchema),
  status: z.enum(['planning', 'active', 'recruiting', 'completed', 'suspended', 'terminated']),
  currentPhase: z.string(),
  enrolledPatients: z.number().int().min(0),
  protocolVersion: z.string().min(1),
  ethicsApprovalNumber: z.string().optional(),
  regulatoryApprovals: z.array(z.string()),
  createdBy: z.string().min(1),
  lastModifiedBy: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  entityType: z.literal('clinical-study'),
});

// Organization validation
export const AddressSchema = z.object({
  country: z.string().min(1),
  prefecture: z.string().min(1),
  city: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  postalCode: z.string().min(1),
});

export const OrganizationRecordSchema = z.object({
  organizationId: z.string().min(1),
  organizationName: z.string().min(1, 'Organization name is required'),
  organizationCode: z.string().min(1, 'Organization code is required'),
  organizationType: z.enum(['hospital', 'clinic', 'research_center', 'university', 'other']),
  address: AddressSchema,
  phoneNumber: z.string().min(1),
  email: z.string().email(),
  website: z.string().url().optional(),
  principalInvestigator: z.string().min(1),
  studyCoordinator: z.string().min(1),
  contactPerson: z.string().min(1),
  maxPatientCapacity: z.number().int().positive(),
  availableEquipment: z.array(z.string()),
  certifications: z.array(z.string()),
  status: z.enum(['active', 'inactive', 'pending_approval', 'suspended']),
  approvalDate: z.string().datetime().optional(),
  activeStudies: z.array(z.string()),
  createdBy: z.string().min(1),
  lastModifiedBy: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  entityType: z.literal('organization'),
});

// Patient validation
export const ContactInfoSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  emergencyContact: z.string().optional(),
}).optional();

export const PatientRecordSchema = z.object({
  patientId: z.string().min(1),
  patientCode: z.string().min(1, 'Patient code is required'),
  patientInitials: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  registeredOrganizationId: z.string().min(1),
  registrationDate: z.string().datetime(),
  medicalHistory: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  contactInfo: ContactInfoSchema,
  status: z.enum(['active', 'inactive', 'withdrawn', 'completed']),
  participatingStudies: z.array(z.string()),
  createdBy: z.string().min(1),
  lastModifiedBy: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  entityType: z.literal('patient'),
});

// Survey validation
export const SurveyRecordSchema = z.object({
  surveyId: z.string().min(1),
  clinicalStudyId: z.string().min(1),
  organizationId: z.string().min(1),
  patientId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  baselineDate: z.string().datetime(),
  expectedCompletionDate: z.string().datetime(),
  status: z.enum(['active', 'completed', 'withdrawn', 'suspended']),
  completionPercentage: z.number().int().min(0).max(100),
  totalVisits: z.number().int().positive(),
  completedVisits: z.number().int().min(0),
  assignedBy: z.string().min(1),
  conductedBy: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  entityType: z.literal('survey'),
});

// Visit validation
export const VisitRecordSchema = z.object({
  surveyId: z.string().min(1),
  visitId: z.string().min(1),
  clinicalStudyId: z.string().min(1),
  organizationId: z.string().min(1),
  patientId: z.string().min(1),
  visitNumber: z.number().int().positive(),
  visitType: z.enum(['baseline', '1week', '1month', '3month', 'custom']),
  visitName: z.string().min(1),
  scheduledDate: z.string().datetime(),
  actualDate: z.string().datetime().optional(),
  windowStartDate: z.string().datetime(),
  windowEndDate: z.string().datetime(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'missed', 'cancelled', 'rescheduled']),
  completionPercentage: z.number().int().min(0).max(100),
  requiredExaminations: z.array(z.string()),
  optionalExaminations: z.array(z.string()),
  examinationOrder: z.array(z.string()),
  completedExaminations: z.array(z.string()),
  skippedExaminations: z.array(z.string()),
  visitNotes: z.string().optional(),
  deviationReason: z.string().optional(),
  conductedBy: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// User validation
export const UserRecordSchema = z.object({
  userId: z.string().min(1),
  username: z.string().min(1, 'Username is required'),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  displayName: z.string().min(1),
  title: z.string().min(1),
  department: z.string().optional(),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  primaryOrganizationId: z.string().min(1),
  accessibleOrganizations: z.array(z.string()),
  role: z.enum(['super_admin', 'study_admin', 'org_admin', 'investigator', 'coordinator', 'data_entry', 'viewer']),
  permissions: z.array(z.string()),
  accessibleStudies: z.array(z.string()),
  status: z.enum(['active', 'inactive', 'pending_activation', 'suspended', 'locked']),
  lastLoginAt: z.string().datetime().optional(),
  passwordChangedAt: z.string().datetime(),
  failedLoginAttempts: z.number().int().min(0),
  passwordHash: z.string().min(1),
  mfaEnabled: z.boolean(),
  mfaSecret: z.string().optional(),
  language: z.enum(['ja', 'en']),
  timezone: z.string().min(1),
  createdBy: z.string().min(1),
  lastModifiedBy: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  entityType: z.literal('user'),
});

// Examination data validation schemas
export const BasicInfoExaminationDataSchema = BaseExaminationDataSchema.extend({
  basicInfoId: z.string().min(1),
  currentUsedCL: z.string().min(1, 'Current contact lens is required'),
  
  // 角膜曲率半径 (6.0-9.0mm range)
  cr_R1: z.number().min(6.0, 'R1 must be at least 6.0mm').max(9.0, 'R1 must be at most 9.0mm'),
  cr_R2: z.number().min(6.0, 'R2 must be at least 6.0mm').max(9.0, 'R2 must be at most 9.0mm'),
  cr_Ave: z.number().min(6.0, 'Average must be at least 6.0mm').max(9.0, 'Average must be at most 9.0mm'),
  
  // 屈折検査
  va: z.number().min(0.1, 'VA must be at least 0.1').max(2.0, 'VA must be at most 2.0'),
  s: z.number().min(-20, 'S must be at least -20D').max(20, 'S must be at most 20D'),
  c: z.number().min(-10, 'C must be at least -10D').max(10, 'C must be at most 10D'),
  ax: z.number().int().min(0, 'Axis must be at least 0°').max(180, 'Axis must be at most 180°'),
  
  // 眼圧 (8-25 mmHg range)
  intraocularPressure1: z.number().int().min(8, 'IOP1 must be at least 8mmHg').max(25, 'IOP1 must be at most 25mmHg'),
  intraocularPressure2: z.number().int().min(8, 'IOP2 must be at least 8mmHg').max(25, 'IOP2 must be at most 25mmHg'),
  intraocularPressure3: z.number().int().min(8, 'IOP3 must be at least 8mmHg').max(25, 'IOP3 must be at most 25mmHg'),
  
  // 角膜内皮細胞 (2000-4000 cells/mm² range)
  cornealEndothelialCells: z.number().int().min(2000, 'Endothelial cells must be at least 2000 cells/mm²').max(4000, 'Endothelial cells must be at most 4000 cells/mm²'),
});

export const VASExaminationDataSchema = BaseExaminationDataSchema.extend({
  vasId: z.string().min(1),
  
  // VAS scores (0-100 integer range)
  comfortLevel: z.number().int().min(0, 'Comfort level must be 0-100').max(100, 'Comfort level must be 0-100'),
  drynessLevel: z.number().int().min(0, 'Dryness level must be 0-100').max(100, 'Dryness level must be 0-100'),
  visualPerformance_Daytime: z.number().int().min(0, 'Daytime visual performance must be 0-100').max(100, 'Daytime visual performance must be 0-100'),
  visualPerformance_EndOfDay: z.number().int().min(0, 'End-of-day visual performance must be 0-100').max(100, 'End-of-day visual performance must be 0-100'),
});

export const ComparativeExaminationDataSchema = BaseExaminationDataSchema.extend({
  comparativeScoresId: z.string().min(1),
  
  // Comparative assessment fields
  comfort: z.string().min(1),
  comfortReason: z.string(),
  dryness: z.string().min(1),
  drynessReason: z.string(),
  
  // Visual performance assessments
  vp_DigitalDevice: z.string().min(1),
  vpReason_DigitalDevice: z.string(),
  vp_DayTime: z.string().min(1),
  vpReason_DayTime: z.string(),
  vp_EndOfDay: z.string().min(1),
  vpReason_EndOfDay: z.string(),
  vp_Glare: z.string().min(1),
  vpReason_Glare: z.string(),
  vp_Halo: z.string().min(1),
  vpReason_Halo: z.string(),
  vp_StarBurst: z.string().min(1),
  vpReason_StarBurst: z.string(),
  
  // Overall assessments
  eyeStrain: z.string().min(1),
  eyeStrainReason: z.string(),
  totalSatisfaction: z.string().min(1),
  totalSatisfactionReason: z.string(),
});

export const FittingExaminationDataSchema = BaseExaminationDataSchema.extend({
  fittingId: z.string().min(1),
  
  timing: z.string().min(1),
  lensMovement: z.number().min(0, 'Lens movement must be positive'),
  lensPosition: z.string().min(1),
  fittingPattern: z.string().min(1),
  lensWettability: z.string().min(1),
  surfaceDeposit: z.string().min(1),
  lensDryness: z.string().min(1),
  
  // FACE2 coordinates
  face2_X: z.number(),
  face2_Y: z.number(),
});

export const DR1ExaminationDataSchema = BaseExaminationDataSchema.extend({
  dr1Id: z.string().min(1),
  
  tearBreakUpTime: z.number().min(0, 'Tear break-up time must be positive'),
  schirmerTest: z.number().int().min(0, 'Schirmer test must be positive'),
  tearMeniscusHeight: z.number().min(0, 'Tear meniscus height must be positive'),
  tearQuality: z.string().min(1),
  blinkingPattern: z.string().min(1),
});

export const CorrectedVAExaminationDataSchema = BaseExaminationDataSchema.extend({
  correctedVAId: z.string().min(1),
  
  va_WithoutLens: z.string().min(1),
  va_WithLens: z.string().min(1),
  redGreenTest: z.string().min(1),
  
  // S-Correction fields
  va_S_Correction: z.string().min(1),
  s_S_Correction: z.string().min(1),
  clarity_S_Correction: z.string().min(1),
  clarityDetail_S_Correction: z.string().min(1),
  stability_S_Correction: z.string().min(1),
  stabilityDetail_S_Correction: z.string().min(1),
  
  // SC-Correction fields
  va_SC_Correction: z.string().min(1),
  s_SC_Correction: z.string().min(1),
  c_SC_Correction: z.string().min(1),
  ax_SC_Correction: z.string().min(1),
  clarity_SC_Correction: z.string().min(1),
  clarityDetail_SC_Correction: z.string().min(1),
  stability_SC_Correction: z.string().min(1),
  stabilityDetail_SC_Correction: z.string().min(1),
});

export const LensInspectionExaminationDataSchema = BaseExaminationDataSchema.extend({
  lensInspectionId: z.string().min(1),
  
  lensDeposit: z.string().min(1),
  lensScratchDamage: z.string().min(1),
});

export const QuestionnaireExaminationDataSchema = BaseExaminationDataSchema.extend({
  questionnaireId: z.string().min(1),
  
  timing: z.string().min(1),
  
  // Comfort assessments
  comfort: z.string().min(1),
  comfortDetail: z.string(),
  comfort_Initial: z.string().min(1),
  comfortDetail_Initial: z.string(),
  comfort_Daytime: z.string().min(1),
  comfortDetail_Daytime: z.string(),
  comfort_Afternoon: z.string().min(1),
  comfortDetail_Afternoon: z.string(),
  comfort_EndOfDay: z.string().min(1),
  comfortDetail_EndOfDay: z.string(),
  
  // Dryness assessments
  dryness: z.string().min(1),
  drynessDetail: z.string(),
  dryness_Initial: z.string().min(1),
  drynessDetail_Initial: z.string(),
  dryness_Daytime: z.string().min(1),
  drynessDetail_Daytime: z.string(),
  dryness_Afternoon: z.string().min(1),
  drynessDetail_Afternoon: z.string(),
  dryness_EndOfDay: z.string().min(1),
  drynessDetail_EndOfDay: z.string(),
  
  // Symptom assessments
  irritation: z.string().min(1),
  irritationDetail: z.string(),
  burning: z.string().min(1),
  burningDetail: z.string(),
  
  // Lens handling
  easeOfInsertion: z.string().min(1),
  easeOfInsertionDetail: z.string(),
  easeOfRemoval: z.string().min(1),
  easeOfRemovalDetail: z.string(),
  
  // Visual performance
  visualPerformance: z.string().min(1),
  visualPerformanceDetail: z.string(),
  
  // Overall assessment
  eyeStrain: z.string().min(1),
  eyeStrainDetail: z.string(),
  totalSatisfaction: z.string().min(1),
  totalSatisfactionDetail: z.string(),
  
  // Other symptoms
  otherSymptoms: z.string().min(1),
  otherSymptomsDetail: z.string(),
});

// Audit Log validation
export const AuditLogRecordSchema = z.object({
  logId: z.string().min(1),
  timestamp: z.string().datetime(),
  eventType: z.enum(['create', 'update', 'delete', 'view', 'login', 'logout', 'export', 'import']),
  action: z.string().min(1),
  userId: z.string().min(1),
  username: z.string().min(1),
  userRole: z.string().min(1),
  targetType: z.enum(['clinical_study', 'survey', 'visit', 'examination', 'user', 'organization', 'patient']),
  targetId: z.string().min(1),
  targetName: z.string().optional(),
  clinicalStudyId: z.string().optional(),
  organizationId: z.string().optional(),
  patientId: z.string().optional(),
  surveyId: z.string().optional(),
  visitId: z.string().optional(),
  changes: z.array(z.object({
    field: z.string().min(1),
    oldValue: z.any(),
    newValue: z.any(),
  })).optional(),
  ipAddress: z.string().min(1),
  userAgent: z.string().min(1),
  sessionId: z.string().min(1),
  description: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  createdAt: z.string().datetime(),
  entityType: z.literal('audit-log'),
});

// Draft Data validation
export const DraftRecordSchema = z.object({
  visitId: z.string().min(1),
  draftId: z.literal('current'),
  formData: z.record(z.string(), z.object({
    right: z.any().optional(),
    left: z.any().optional(),
  })),
  currentStep: z.number().int().min(0),
  totalSteps: z.number().int().positive(),
  completedSteps: z.array(z.string()),
  examinationOrder: z.array(z.string()),
  lastSaved: z.string().datetime(),
  autoSaved: z.boolean(),
  ttl: z.number().int().positive(),
});

// Export all schemas
export const ValidationSchemas = {
  ClinicalStudyRecord: ClinicalStudyRecordSchema,
  OrganizationRecord: OrganizationRecordSchema,
  PatientRecord: PatientRecordSchema,
  SurveyRecord: SurveyRecordSchema,
  VisitRecord: VisitRecordSchema,
  UserRecord: UserRecordSchema,
  BasicInfoExaminationData: BasicInfoExaminationDataSchema,
  VASExaminationData: VASExaminationDataSchema,
  ComparativeExaminationData: ComparativeExaminationDataSchema,
  FittingExaminationData: FittingExaminationDataSchema,
  DR1ExaminationData: DR1ExaminationDataSchema,
  CorrectedVAExaminationData: CorrectedVAExaminationDataSchema,
  LensInspectionExaminationData: LensInspectionExaminationDataSchema,
  QuestionnaireExaminationData: QuestionnaireExaminationDataSchema,
  AuditLogRecord: AuditLogRecordSchema,
  DraftRecord: DraftRecordSchema,
};