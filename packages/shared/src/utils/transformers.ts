import { 
  ClinicalStudyRecord, 
  OrganizationRecord, 
  PatientRecord, 
  SurveyRecord, 
  VisitRecord,
  BasicInfoExaminationData,
  VASExaminationData,
  ComparativeExaminationData,
  FittingExaminationData,
  DR1ExaminationData,
  CorrectedVAExaminationData,
  LensInspectionExaminationData,
  QuestionnaireExaminationData,
  AuditLogRecord,
  DraftRecord
} from '../types/index.js';

/**
 * Data transformation utilities for API responses
 * Handles data sanitization, formatting, and conversion
 */

// Remove sensitive fields from user data
export function sanitizeUserData(user: any): Omit<any, 'passwordHash' | 'mfaSecret'> {
  const { passwordHash, mfaSecret, ...sanitizedUser } = user;
  return sanitizedUser;
}

// Transform clinical study for API response
export function transformClinicalStudyForAPI(study: ClinicalStudyRecord) {
  return {
    ...study,
    enrollmentProgress: study.totalTargetPatients > 0 
      ? Math.round((study.enrolledPatients / study.totalTargetPatients) * 100)
      : 0,
    isActive: study.status === 'active',
    visitCount: study.visitTemplate.length,
    examinationCount: study.examinations.length,
  };
}

// Transform organization for API response
export function transformOrganizationForAPI(organization: OrganizationRecord) {
  return {
    ...organization,
    isActive: organization.status === 'active',
    studyCount: organization.activeStudies.length,
    hasCapacity: organization.maxPatientCapacity > 0,
  };
}

// Transform patient for API response
export function transformPatientForAPI(patient: PatientRecord) {
  return {
    ...patient,
    isActive: patient.status === 'active',
    studyCount: patient.participatingStudies.length,
    hasContactInfo: !!patient.contactInfo,
    // Mask sensitive information
    contactInfo: patient.contactInfo ? {
      hasPhone: !!patient.contactInfo.phone,
      hasEmail: !!patient.contactInfo.email,
      hasEmergencyContact: !!patient.contactInfo.emergencyContact,
    } : undefined,
  };
}

// Transform survey for API response
export function transformSurveyForAPI(survey: SurveyRecord) {
  return {
    ...survey,
    isActive: survey.status === 'active',
    isCompleted: survey.status === 'completed',
    visitProgress: survey.totalVisits > 0 
      ? Math.round((survey.completedVisits / survey.totalVisits) * 100)
      : 0,
    remainingVisits: survey.totalVisits - survey.completedVisits,
  };
}

// Transform visit for API response
export function transformVisitForAPI(visit: VisitRecord) {
  const totalExaminations = visit.requiredExaminations.length + visit.optionalExaminations.length;
  
  return {
    ...visit,
    isCompleted: visit.status === 'completed',
    isOverdue: new Date(visit.windowEndDate) < new Date() && visit.status !== 'completed',
    examinationProgress: totalExaminations > 0 
      ? Math.round((visit.completedExaminations.length / totalExaminations) * 100)
      : 0,
    remainingExaminations: totalExaminations - visit.completedExaminations.length,
    hasDeviations: !!visit.deviationReason,
  };
}

// Transform basic info examination for API response
export function transformBasicInfoForAPI(basicInfo: BasicInfoExaminationData) {
  return {
    ...basicInfo,
    averageIOP: Math.round(((basicInfo.intraocularPressure1 + basicInfo.intraocularPressure2 + basicInfo.intraocularPressure3) / 3) * 10) / 10,
    cornealCurvature: {
      r1: basicInfo.cr_R1,
      r2: basicInfo.cr_R2,
      average: basicInfo.cr_Ave,
    },
    refraction: {
      va: basicInfo.va,
      s: basicInfo.s,
      c: basicInfo.c,
      ax: basicInfo.ax,
    },
    intraocularPressure: [
      basicInfo.intraocularPressure1,
      basicInfo.intraocularPressure2,
      basicInfo.intraocularPressure3,
    ],
  };
}

// Transform VAS examination for API response
export function transformVASForAPI(vas: VASExaminationData) {
  return {
    ...vas,
    averageScore: Math.round((vas.comfortLevel + (100 - vas.drynessLevel) + vas.visualPerformance_Daytime + vas.visualPerformance_EndOfDay) / 4),
    comfortCategory: getVASCategory(vas.comfortLevel),
    drynessCategory: getVASCategory(100 - vas.drynessLevel), // Inverted because lower dryness is better
    visualPerformanceCategory: getVASCategory((vas.visualPerformance_Daytime + vas.visualPerformance_EndOfDay) / 2),
  };
}

// Helper function to categorize VAS scores
function getVASCategory(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

// Transform comparative examination for API response
export function transformComparativeForAPI(comparative: ComparativeExaminationData) {
  return {
    ...comparative,
    hasReasons: !!(comparative.comfortReason || comparative.drynessReason),
    visualPerformanceCount: [
      comparative.vp_DigitalDevice,
      comparative.vp_DayTime,
      comparative.vp_EndOfDay,
      comparative.vp_Glare,
      comparative.vp_Halo,
      comparative.vp_StarBurst,
    ].filter(vp => vp && vp.trim()).length,
  };
}

// Transform fitting examination for API response
export function transformFittingForAPI(fitting: FittingExaminationData) {
  return {
    ...fitting,
    face2Coordinates: {
      x: fitting.face2_X,
      y: fitting.face2_Y,
    },
    hasMovement: fitting.lensMovement > 0,
    fittingQuality: getFittingQuality(fitting.lensMovement),
  };
}

// Helper function to assess fitting quality
function getFittingQuality(movement: number): 'excellent' | 'good' | 'acceptable' | 'poor' {
  if (movement <= 0.5) return 'excellent';
  if (movement <= 1.0) return 'good';
  if (movement <= 1.5) return 'acceptable';
  return 'poor';
}

// Transform DR1 examination for API response
export function transformDR1ForAPI(dr1: DR1ExaminationData) {
  return {
    ...dr1,
    tearStability: getTearStability(dr1.tearBreakUpTime),
    tearProduction: getTearProduction(dr1.schirmerTest),
    overallTearHealth: getTearHealth(dr1.tearBreakUpTime, dr1.schirmerTest),
  };
}

// Helper functions for tear assessment
function getTearStability(breakUpTime: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (breakUpTime >= 10) return 'excellent';
  if (breakUpTime >= 7) return 'good';
  if (breakUpTime >= 5) return 'fair';
  return 'poor';
}

function getTearProduction(schirmerTest: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (schirmerTest >= 15) return 'excellent';
  if (schirmerTest >= 10) return 'good';
  if (schirmerTest >= 5) return 'fair';
  return 'poor';
}

function getTearHealth(breakUpTime: number, schirmerTest: number): 'excellent' | 'good' | 'fair' | 'poor' {
  const stabilityScore = getTearStability(breakUpTime);
  const productionScore = getTearProduction(schirmerTest);
  
  const scores = { excellent: 4, good: 3, fair: 2, poor: 1 };
  const averageScore = (scores[stabilityScore] + scores[productionScore]) / 2;
  
  if (averageScore >= 3.5) return 'excellent';
  if (averageScore >= 2.5) return 'good';
  if (averageScore >= 1.5) return 'fair';
  return 'poor';
}

// Transform corrected VA examination for API response
export function transformCorrectedVAForAPI(correctedVA: CorrectedVAExaminationData) {
  return {
    ...correctedVA,
    hasImprovement: correctedVA.va_WithLens > correctedVA.va_WithoutLens,
    sCorrectionData: {
      va: correctedVA.va_S_Correction,
      s: correctedVA.s_S_Correction,
      clarity: correctedVA.clarity_S_Correction,
      stability: correctedVA.stability_S_Correction,
    },
    scCorrectionData: {
      va: correctedVA.va_SC_Correction,
      s: correctedVA.s_SC_Correction,
      c: correctedVA.c_SC_Correction,
      ax: correctedVA.ax_SC_Correction,
      clarity: correctedVA.clarity_SC_Correction,
      stability: correctedVA.stability_SC_Correction,
    },
  };
}

// Transform lens inspection examination for API response
export function transformLensInspectionForAPI(lensInspection: LensInspectionExaminationData) {
  return {
    ...lensInspection,
    hasIssues: !!(lensInspection.lensDeposit || lensInspection.lensScratchDamage),
    lensCondition: getLensCondition(lensInspection.lensDeposit, lensInspection.lensScratchDamage),
  };
}

// Helper function to assess lens condition
function getLensCondition(deposit: string, damage: string): 'excellent' | 'good' | 'fair' | 'poor' {
  const hasDeposit = deposit && deposit.toLowerCase() !== 'none' && deposit.toLowerCase() !== 'なし';
  const hasDamage = damage && damage.toLowerCase() !== 'none' && damage.toLowerCase() !== 'なし';
  
  if (!hasDeposit && !hasDamage) return 'excellent';
  if (hasDeposit && !hasDamage) return 'good';
  if (!hasDeposit && hasDamage) return 'fair';
  return 'poor';
}

// Transform questionnaire examination for API response
export function transformQuestionnaireForAPI(questionnaire: QuestionnaireExaminationData) {
  return {
    ...questionnaire,
    comfortSummary: {
      overall: questionnaire.comfort,
      initial: questionnaire.comfort_Initial,
      daytime: questionnaire.comfort_Daytime,
      afternoon: questionnaire.comfort_Afternoon,
      endOfDay: questionnaire.comfort_EndOfDay,
    },
    drynessSummary: {
      overall: questionnaire.dryness,
      initial: questionnaire.dryness_Initial,
      daytime: questionnaire.dryness_Daytime,
      afternoon: questionnaire.dryness_Afternoon,
      endOfDay: questionnaire.dryness_EndOfDay,
    },
    lensHandling: {
      insertion: questionnaire.easeOfInsertion,
      removal: questionnaire.easeOfRemoval,
    },
    hasOtherSymptoms: !!(questionnaire.otherSymptoms && questionnaire.otherSymptoms.trim()),
  };
}

// Transform audit log for API response
export function transformAuditLogForAPI(auditLog: AuditLogRecord) {
  return {
    ...auditLog,
    isHighSeverity: auditLog.severity === 'high' || auditLog.severity === 'critical',
    hasChanges: !!(auditLog.changes && auditLog.changes.length > 0),
    changeCount: auditLog.changes ? auditLog.changes.length : 0,
    formattedTimestamp: new Date(auditLog.timestamp).toLocaleString('ja-JP'),
  };
}

// Transform draft data for API response
export function transformDraftForAPI(draft: DraftRecord) {
  const completionPercentage = draft.totalSteps > 0 
    ? Math.round((draft.completedSteps.length / draft.totalSteps) * 100)
    : 0;
  
  return {
    ...draft,
    completionPercentage,
    isAutoSaved: draft.autoSaved,
    lastSavedFormatted: new Date(draft.lastSaved).toLocaleString('ja-JP'),
    expiresAt: new Date(draft.ttl * 1000).toLocaleString('ja-JP'),
    hasUnsavedChanges: !draft.autoSaved,
    examinationCount: draft.examinationOrder.length,
    completedCount: draft.completedSteps.length,
    remainingCount: draft.totalSteps - draft.completedSteps.length,
  };
}

// Batch transformation utilities
export function transformExaminationDataForAPI(examinationType: string, data: any) {
  switch (examinationType) {
    case 'basic-info':
      return transformBasicInfoForAPI(data);
    case 'vas':
      return transformVASForAPI(data);
    case 'comparative':
      return transformComparativeForAPI(data);
    case 'fitting':
      return transformFittingForAPI(data);
    case 'dr1':
      return transformDR1ForAPI(data);
    case 'corrected-va':
      return transformCorrectedVAForAPI(data);
    case 'lens-inspection':
      return transformLensInspectionForAPI(data);
    case 'questionnaire':
      return transformQuestionnaireForAPI(data);
    default:
      return data;
  }
}

// Error handling for DynamoDB operations
export function handleDynamoDBError(error: any): { 
  message: string; 
  code: string; 
  statusCode: number; 
  retryable: boolean; 
} {
  const errorCode = error.name || error.code || 'UnknownError';
  
  switch (errorCode) {
    case 'ValidationException':
      return {
        message: 'Invalid data provided',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        retryable: false,
      };
    case 'ConditionalCheckFailedException':
      return {
        message: 'Resource already exists or condition not met',
        code: 'CONDITION_FAILED',
        statusCode: 409,
        retryable: false,
      };
    case 'ResourceNotFoundException':
      return {
        message: 'Resource not found',
        code: 'NOT_FOUND',
        statusCode: 404,
        retryable: false,
      };
    case 'ProvisionedThroughputExceededException':
      return {
        message: 'Request rate too high, please retry',
        code: 'THROTTLED',
        statusCode: 429,
        retryable: true,
      };
    case 'ServiceUnavailable':
      return {
        message: 'Service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
        statusCode: 503,
        retryable: true,
      };
    default:
      return {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        retryable: false,
      };
  }
}