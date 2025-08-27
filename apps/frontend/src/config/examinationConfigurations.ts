/**
 * 臨床試験別検査設定
 * Clinical Study specific examination configurations
 */

export interface ExaminationStep {
  id: string;
  name: string;
  displayName: string;
  description: string;
  required: boolean;
  estimatedMinutes?: number;
  dependencies?: string[]; // 前提となる検査
}

export interface VisitTemplate {
  visitType: string;
  visitName: string;
  description: string;
  estimatedDuration: number; // minutes
  examinations: ExaminationStep[];
  defaultOrder: string[];
  allowedReorder: boolean;
  requiredCompletionPercentage?: number;
}

export interface ClinicalStudyConfig {
  clinicalStudyId: string;
  studyName: string;
  studyType: string;
  visitTemplates: VisitTemplate[];
  globalExaminationSettings: {
    allowSkip: boolean;
    autoSaveInterval: number; // seconds
    maxSessionDuration: number; // minutes
    requireAllMandatory: boolean;
  };
}

// 利用可能な全検査タイプの定義
export const AVAILABLE_EXAMINATIONS: Record<string, ExaminationStep> = {
  'basic-info': {
    id: 'basic-info',
    name: 'basic-info',
    displayName: '基礎情報',
    description: '角膜曲率、視力、屈折度、眼圧、角膜内皮細胞数',
    required: true,
    estimatedMinutes: 15,
  },
  'vas': {
    id: 'vas',
    name: 'vas',
    displayName: 'VAS評価',
    description: 'Visual Analog Scale による主観評価',
    required: true,
    estimatedMinutes: 10,
  },
  'comparative': {
    id: 'comparative',
    name: 'comparative',
    displayName: '相対評価',
    description: '前回との比較による主観評価',
    required: false,
    estimatedMinutes: 8,
    dependencies: ['vas'],
  },
  'fitting': {
    id: 'fitting',
    name: 'fitting',
    displayName: 'フィッティング検査',
    description: 'レンズ動き、位置、濡れ性の評価',
    required: true,
    estimatedMinutes: 12,
  },
  'dr1': {
    id: 'dr1',
    name: 'dr1',
    displayName: '涙液層検査',
    description: '涙液破綻時間、シルマー検査、涙液メニスカス高',
    required: true,
    estimatedMinutes: 20,
  },
  'corrected-va': {
    id: 'corrected-va',
    name: 'corrected-va',
    displayName: '矯正視力検査',
    description: 'レンズ有無での視力測定、赤緑テスト',
    required: false,
    estimatedMinutes: 15,
  },
  'lens-inspection': {
    id: 'lens-inspection',
    name: 'lens-inspection',
    displayName: 'レンズ検査',
    description: 'レンズ汚れ、傷の検査',
    required: false,
    estimatedMinutes: 5,
  },
  'questionnaire': {
    id: 'questionnaire',
    name: 'questionnaire',
    displayName: '問診',
    description: '詳細な主観症状の問診',
    required: false,
    estimatedMinutes: 10,
  }
};

// 臨床試験別設定
export const CLINICAL_STUDY_CONFIGURATIONS: Record<string, ClinicalStudyConfig> = {
  'study-test-001': {
    clinicalStudyId: 'study-test-001',
    studyName: '新世代シリコーンハイドロゲルレンズ評価試験',
    studyType: 'contact_lens_evaluation',
    globalExaminationSettings: {
      allowSkip: true,
      autoSaveInterval: 30,
      maxSessionDuration: 120,
      requireAllMandatory: true,
    },
    visitTemplates: [
      {
        visitType: 'baseline',
        visitName: 'ベースライン検査',
        description: '初回装用時の包括的評価',
        estimatedDuration: 90,
        allowedReorder: false,
        requiredCompletionPercentage: 100,
        examinations: [
          AVAILABLE_EXAMINATIONS['basic-info'],
          AVAILABLE_EXAMINATIONS['vas'],
          AVAILABLE_EXAMINATIONS['fitting'],
          AVAILABLE_EXAMINATIONS['dr1'],
          { ...AVAILABLE_EXAMINATIONS['questionnaire'], required: true }, // この試験では問診必須
        ],
        defaultOrder: ['basic-info', 'dr1', 'fitting', 'vas', 'questionnaire'],
      },
      {
        visitType: '1week',
        visitName: '1週間後フォローアップ',
        description: '短期装用後の変化評価',
        estimatedDuration: 45,
        allowedReorder: true,
        requiredCompletionPercentage: 80,
        examinations: [
          AVAILABLE_EXAMINATIONS['vas'],
          AVAILABLE_EXAMINATIONS['comparative'],
          AVAILABLE_EXAMINATIONS['lens-inspection'],
          AVAILABLE_EXAMINATIONS['questionnaire'],
        ],
        defaultOrder: ['vas', 'comparative', 'lens-inspection', 'questionnaire'],
      },
      {
        visitType: '1month',
        visitName: '1ヶ月後フォローアップ',
        description: '長期装用後の総合評価',
        estimatedDuration: 75,
        allowedReorder: true,
        requiredCompletionPercentage: 90,
        examinations: [
          AVAILABLE_EXAMINATIONS['basic-info'],
          AVAILABLE_EXAMINATIONS['vas'],
          AVAILABLE_EXAMINATIONS['comparative'],
          AVAILABLE_EXAMINATIONS['fitting'],
          AVAILABLE_EXAMINATIONS['dr1'],
          AVAILABLE_EXAMINATIONS['corrected-va'],
          AVAILABLE_EXAMINATIONS['lens-inspection'],
          AVAILABLE_EXAMINATIONS['questionnaire'],
        ],
        defaultOrder: ['basic-info', 'dr1', 'fitting', 'corrected-va', 'vas', 'comparative', 'lens-inspection', 'questionnaire'],
      }
    ]
  },

  'study-dry-eye-002': {
    clinicalStudyId: 'study-dry-eye-002',
    studyName: 'ドライアイ向けコンタクトレンズ臨床試験',
    studyType: 'dry_eye_lens_study',
    globalExaminationSettings: {
      allowSkip: false, // ドライアイ試験では全検査必須
      autoSaveInterval: 60,
      maxSessionDuration: 150,
      requireAllMandatory: true,
    },
    visitTemplates: [
      {
        visitType: 'baseline',
        visitName: 'ベースライン検査',
        description: 'ドライアイ症状の包括的評価',
        estimatedDuration: 120,
        allowedReorder: false,
        requiredCompletionPercentage: 100,
        examinations: [
          AVAILABLE_EXAMINATIONS['basic-info'],
          { ...AVAILABLE_EXAMINATIONS['dr1'], required: true }, // ドライアイ試験では涙液検査必須
          AVAILABLE_EXAMINATIONS['vas'],
          AVAILABLE_EXAMINATIONS['fitting'],
          { ...AVAILABLE_EXAMINATIONS['questionnaire'], required: true },
        ],
        defaultOrder: ['basic-info', 'dr1', 'vas', 'fitting', 'questionnaire'],
      },
      {
        visitType: '2week',
        visitName: '2週間後評価',
        description: 'ドライアイ症状の変化評価',
        estimatedDuration: 60,
        allowedReorder: false,
        requiredCompletionPercentage: 100,
        examinations: [
          { ...AVAILABLE_EXAMINATIONS['dr1'], required: true },
          AVAILABLE_EXAMINATIONS['vas'],
          AVAILABLE_EXAMINATIONS['comparative'],
          { ...AVAILABLE_EXAMINATIONS['questionnaire'], required: true },
        ],
        defaultOrder: ['dr1', 'vas', 'comparative', 'questionnaire'],
      }
    ]
  },

  'study-presbyopia-003': {
    clinicalStudyId: 'study-presbyopia-003',
    studyName: '老視用多焦点レンズ評価試験',
    studyType: 'presbyopia_lens_study',
    globalExaminationSettings: {
      allowSkip: true,
      autoSaveInterval: 30,
      maxSessionDuration: 90,
      requireAllMandatory: true,
    },
    visitTemplates: [
      {
        visitType: 'baseline',
        visitName: 'ベースライン検査',
        description: '多焦点レンズ装用前評価',
        estimatedDuration: 75,
        allowedReorder: true,
        requiredCompletionPercentage: 85,
        examinations: [
          AVAILABLE_EXAMINATIONS['basic-info'],
          { ...AVAILABLE_EXAMINATIONS['corrected-va'], required: true }, // 老視試験では視力検査必須
          AVAILABLE_EXAMINATIONS['vas'],
          AVAILABLE_EXAMINATIONS['fitting'],
          AVAILABLE_EXAMINATIONS['questionnaire'],
        ],
        defaultOrder: ['basic-info', 'corrected-va', 'fitting', 'vas', 'questionnaire'],
      }
    ]
  }
};

// 設定取得のヘルパー関数
export const getClinicalStudyConfig = (clinicalStudyId: string): ClinicalStudyConfig | null => {
  return CLINICAL_STUDY_CONFIGURATIONS[clinicalStudyId] || null;
};

export const getVisitTemplate = (clinicalStudyId: string, visitType: string): VisitTemplate | null => {
  const config = getClinicalStudyConfig(clinicalStudyId);
  if (!config) return null;
  
  return config.visitTemplates.find(template => template.visitType === visitType) || null;
};

export const getExaminationSteps = (clinicalStudyId: string, visitType: string): ExaminationStep[] => {
  const template = getVisitTemplate(clinicalStudyId, visitType);
  return template?.examinations || [];
};

export const getDefaultExaminationOrder = (clinicalStudyId: string, visitType: string): string[] => {
  const template = getVisitTemplate(clinicalStudyId, visitType);
  return template?.defaultOrder || [];
};

export const isExaminationRequired = (clinicalStudyId: string, visitType: string, examinationId: string): boolean => {
  const steps = getExaminationSteps(clinicalStudyId, visitType);
  const step = steps.find(s => s.id === examinationId);
  return step?.required || false;
};