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

// Examination Data Types
export interface BaseExaminationData {
  surveyId: string;
  visitId: string;
  patientId: string;
  clinicalStudyId: string;
  organizationId: string;
  eyeside: 'Right' | 'Left';
  examinationDate: string;
  conductedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BasicInfoExaminationData extends BaseExaminationData {
  currentUsedCL?: string;
  cornealCurvature?: {
    r1: number;
    r2: number;
    average: number;
  };
  refraction?: {
    va: number;
    s: number;
    c: number;
    ax: number;
  };
  intraocularPressure?: number[];
  cornealEndothelialCells?: number;
  entityType: 'basic-info-examination';
}

export interface VASExaminationData extends BaseExaminationData {
  comfortLevel: number; // 0-100
  drynessLevel: number; // 0-100
  visualPerformanceDaytime: number; // 0-100
  visualPerformanceEndOfDay: number; // 0-100
  entityType: 'vas-examination';
}

export interface ComparativeExaminationData extends BaseExaminationData {
  comfort: 'much_better' | 'better' | 'same' | 'worse' | 'much_worse';
  comfortReason?: string;
  dryness: 'much_better' | 'better' | 'same' | 'worse' | 'much_worse';
  drynessReason?: string;
  digitalDeviceUse: 'much_better' | 'better' | 'same' | 'worse' | 'much_worse';
  digitalDeviceReason?: string;
  eyeFatigue: 'much_better' | 'better' | 'same' | 'worse' | 'much_worse';
  overallSatisfaction?: string;
  entityType: 'comparative-examination';
}

export interface FittingExaminationData extends BaseExaminationData {
  lensMovement?: string;
  centration?: string;
  tightness?: string;
  overallFitting?: string;
  notes?: string;
  entityType: 'fitting-examination';
}
