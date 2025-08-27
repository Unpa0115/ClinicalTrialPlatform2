import { z } from 'zod';

// Basic examination schema shared by all forms
const baseExaminationSchema = z.object({
  visitId: z.string().min(1, '訪問IDが必要です'),
  surveyId: z.string().min(1, 'サーベイIDが必要です'),
  patientId: z.string().min(1, '患者IDが必要です'),
  clinicalStudyId: z.string().min(1, '臨床試験IDが必要です'),
  organizationId: z.string().min(1, '組織IDが必要です'),
  eyeside: z.enum(['Right', 'Left'], {
    errorMap: () => ({ message: '右目または左目を選択してください' })
  }),
});

// BasicInfo examination schema (基礎情報)
export const basicInfoSchema = baseExaminationSchema.extend({
  basicInfoId: z.string().min(1, '基礎情報IDが必要です'),
  currentUsedCL: z.string().min(1, '現在使用しているコンタクトレンズを入力してください'),
  
  // 角膜曲率半径
  cr_R1: z.number()
    .min(0, 'R1は0以上である必要があります')
    .max(100, 'R1は100以下である必要があります'),
  cr_R2: z.number()
    .min(0, 'R2は0以上である必要があります')
    .max(100, 'R2は100以下である必要があります'),
  cr_Ave: z.number()
    .min(0, '平均値は0以上である必要があります')
    .max(100, '平均値は100以下である必要があります'),
  
  // 屈折検査
  va: z.number()
    .min(0, '視力は0以上である必要があります')
    .max(2.0, '視力は2.0以下である必要があります'),
  s: z.number()
    .min(-20, '球面度数は-20以上である必要があります')
    .max(20, '球面度数は20以下である必要があります'),
  c: z.number()
    .min(-10, '円柱度数は-10以上である必要があります')
    .max(10, '円柱度数は10以下である必要があります'),
  ax: z.number()
    .min(0, '軸は0以上である必要があります')
    .max(180, '軸は180以下である必要があります'),
  
  // 眼圧
  intraocularPressure1: z.number()
    .min(0, '眼圧1は0以上である必要があります')
    .max(50, '眼圧1は50以下である必要があります'),
  intraocularPressure2: z.number()
    .min(0, '眼圧2は0以上である必要があります')
    .max(50, '眼圧2は50以下である必要があります'),
  intraocularPressure3: z.number()
    .min(0, '眼圧3は0以上である必要があります')
    .max(50, '眼圧3は50以下である必要があります'),
  
  // 角膜内皮細胞
  cornealEndothelialCells: z.number()
    .min(500, '角膜内皮細胞数は500以上である必要があります')
    .max(5000, '角膜内皮細胞数は5000以下である必要があります'),
});

// VAS examination schema (Visual Analog Scale)
export const vasSchema = baseExaminationSchema.extend({
  vasId: z.string().min(1, 'VAS IDが必要です'),
  comfortLevel: z.number()
    .min(0, '快適性レベルは0以上である必要があります')
    .max(100, '快適性レベルは100以下である必要があります'),
  drynessLevel: z.number()
    .min(0, '乾燥感レベルは0以上である必要があります')
    .max(100, '乾燥感レベルは100以下である必要があります'),
  visualPerformance_Daytime: z.number()
    .min(0, '日中の視覚性能は0以上である必要があります')
    .max(100, '日中の視覚性能は100以下である必要があります'),
  visualPerformance_EndOfDay: z.number()
    .min(0, '一日の終わりの視覚性能は0以上である必要があります')
    .max(100, '一日の終わりの視覚性能は100以下である必要があります'),
});

// Comparative examination schema (相対評価)
const comparativeAssessmentOptions = z.enum([
  'much_better', 'better', 'same', 'worse', 'much_worse'
], {
  errorMap: () => ({ message: '評価を選択してください' })
});

export const comparativeSchema = baseExaminationSchema.extend({
  comparativeScoresId: z.string().min(1, '相対評価IDが必要です'),
  comfort: comparativeAssessmentOptions,
  comfortReason: z.string().min(1, '快適性の理由を入力してください'),
  dryness: comparativeAssessmentOptions,
  drynessReason: z.string().min(1, '乾燥感の理由を入力してください'),
  
  // Visual Performance
  vp_DigitalDevice: comparativeAssessmentOptions,
  vpReason_DigitalDevice: z.string().min(1, 'デジタルデバイス使用時の理由を入力してください'),
  vp_DayTime: comparativeAssessmentOptions,
  vpReason_DayTime: z.string().min(1, '日中の理由を入力してください'),
  vp_EndOfDay: comparativeAssessmentOptions,
  vpReason_EndOfDay: z.string().min(1, '一日の終わりの理由を入力してください'),
  vp_Glare: comparativeAssessmentOptions,
  vpReason_Glare: z.string().min(1, 'グレアの理由を入力してください'),
  vp_Halo: comparativeAssessmentOptions,
  vpReason_Halo: z.string().min(1, 'ハローの理由を入力してください'),
  vp_StarBurst: comparativeAssessmentOptions,
  vpReason_StarBurst: z.string().min(1, 'スターバーストの理由を入力してください'),
  
  // Overall Assessment
  eyeStrain: comparativeAssessmentOptions,
  eyeStrainReason: z.string().min(1, '眼精疲労の理由を入力してください'),
  totalSatisfaction: comparativeAssessmentOptions,
  totalSatisfactionReason: z.string().min(1, '総合満足度の理由を入力してください'),
});

// Fitting examination schema (フィッティング・涙濡れ性検査)
export const fittingSchema = baseExaminationSchema.extend({
  fittingId: z.string().min(1, 'フィッティングIDが必要です'),
  timing: z.string().min(1, 'タイミングを入力してください'),
  lensMovement: z.number()
    .min(-5, 'レンズ移動度は-5以上である必要があります')
    .max(5, 'レンズ移動度は5以下である必要があります'),
  lensPosition: z.string().min(1, 'レンズ位置を入力してください'),
  fittingPattern: z.string().min(1, 'フィッティングパターンを入力してください'),
  lensWettability: z.string().min(1, 'レンズ濡れ性を入力してください'),
  surfaceDeposit: z.string().min(1, '表面沈着物を入力してください'),
  lensDryness: z.string().min(1, 'レンズ乾燥を入力してください'),
  
  // FACE2 Assessment
  face2_X: z.number()
    .min(-10, 'FACE2 X座標は-10以上である必要があります')
    .max(10, 'FACE2 X座標は10以下である必要があります'),
  face2_Y: z.number()
    .min(-10, 'FACE2 Y座標は-10以上である必要があります')
    .max(10, 'FACE2 Y座標は10以下である必要があります'),
});

// DR1 examination schema (涙液層検査)
export const dr1Schema = baseExaminationSchema.extend({
  dr1Id: z.string().min(1, 'DR1 IDが必要です'),
  tearBreakUpTime: z.number()
    .min(0, '涙液破綻時間は0以上である必要があります')
    .max(60, '涙液破綻時間は60以下である必要があります'),
  schirmerTest: z.number()
    .min(0, 'シルマーテスト値は0以上である必要があります')
    .max(50, 'シルマーテスト値は50以下である必要があります'),
  tearMeniscusHeight: z.number()
    .min(0, '涙液メニスカス高は0以上である必要があります')
    .max(10, '涙液メニスカス高は10以下である必要があります'),
  tearQuality: z.string().min(1, '涙液の質的評価を入力してください'),
  blinkingPattern: z.string().min(1, '瞬目パターンを入力してください'),
});

// Corrected VA examination schema (矯正視力検査)
export const correctedVASchema = baseExaminationSchema.extend({
  correctedVAId: z.string().min(1, '矯正視力IDが必要です'),
  va_WithoutLens: z.string().min(1, 'レンズなし視力を入力してください'),
  va_WithLens: z.string().min(1, 'レンズ装用時視力を入力してください'),
  redGreenTest: z.string().min(1, '赤緑テストを入力してください'),
  
  // S-Correction
  va_S_Correction: z.string().min(1, 'S補正後視力を入力してください'),
  s_S_Correction: z.string().min(1, 'S補正値を入力してください'),
  clarity_S_Correction: z.string().min(1, 'S補正後明瞭度を入力してください'),
  clarityDetail_S_Correction: z.string().min(1, 'S補正後明瞭度詳細を入力してください'),
  stability_S_Correction: z.string().min(1, 'S補正後安定性を入力してください'),
  stabilityDetail_S_Correction: z.string().min(1, 'S補正後安定性詳細を入力してください'),
  
  // SC-Correction
  va_SC_Correction: z.string().min(1, 'SC補正後視力を入力してください'),
  s_SC_Correction: z.string().min(1, 'SC補正球面度数を入力してください'),
  c_SC_Correction: z.string().min(1, 'SC補正円柱度数を入力してください'),
  ax_SC_Correction: z.string().min(1, 'SC補正軸を入力してください'),
  clarity_SC_Correction: z.string().min(1, 'SC補正後明瞭度を入力してください'),
  clarityDetail_SC_Correction: z.string().min(1, 'SC補正後明瞭度詳細を入力してください'),
  stability_SC_Correction: z.string().min(1, 'SC補正後安定性を入力してください'),
  stabilityDetail_SC_Correction: z.string().min(1, 'SC補正後安定性詳細を入力してください'),
});

// Lens inspection examination schema (レンズ検査)
export const lensInspectionSchema = baseExaminationSchema.extend({
  lensInspectionId: z.string().min(1, 'レンズ検査IDが必要です'),
  lensDeposit: z.string().min(1, 'レンズ汚れを入力してください'),
  lensScratchDamage: z.string().min(1, 'レンズ傷・損傷を入力してください'),
});

// Questionnaire examination schema (問診)
export const questionnaireSchema = baseExaminationSchema.extend({
  questionnaireId: z.string().min(1, '問診IDが必要です'),
  timing: z.string().min(1, 'タイミングを入力してください'),
  
  // Comfort Assessment
  comfort: z.string().min(1, '全体的な快適性を入力してください'),
  comfortDetail: z.string().min(1, '快適性詳細を入力してください'),
  comfort_Initial: z.string().min(1, '装用直後の快適性を入力してください'),
  comfortDetail_Initial: z.string().min(1, '装用直後の快適性詳細を入力してください'),
  comfort_Daytime: z.string().min(1, '日中の快適性を入力してください'),
  comfortDetail_Daytime: z.string().min(1, '日中の快適性詳細を入力してください'),
  comfort_Afternoon: z.string().min(1, '午後の快適性を入力してください'),
  comfortDetail_Afternoon: z.string().min(1, '午後の快適性詳細を入力してください'),
  comfort_EndOfDay: z.string().min(1, '一日の終わりの快適性を入力してください'),
  comfortDetail_EndOfDay: z.string().min(1, '一日の終わりの快適性詳細を入力してください'),
  
  // Dryness Assessment
  dryness: z.string().min(1, '全体的な乾燥感を入力してください'),
  drynessDetail: z.string().min(1, '乾燥感詳細を入力してください'),
  dryness_Initial: z.string().min(1, '装用直後の乾燥感を入力してください'),
  drynessDetail_Initial: z.string().min(1, '装用直後の乾燥感詳細を入力してください'),
  dryness_Daytime: z.string().min(1, '日中の乾燥感を入力してください'),
  drynessDetail_Daytime: z.string().min(1, '日中の乾燥感詳細を入力してください'),
  dryness_Afternoon: z.string().min(1, '午後の乾燥感を入力してください'),
  drynessDetail_Afternoon: z.string().min(1, '午後の乾燥感詳細を入力してください'),
  dryness_EndOfDay: z.string().min(1, '一日の終わりの乾燥感を入力してください'),
  drynessDetail_EndOfDay: z.string().min(1, '一日の終わりの乾燥感詳細を入力してください'),
  
  // Symptom Assessment
  irritation: z.string().min(1, '刺激感を入力してください'),
  irritationDetail: z.string().min(1, '刺激感詳細を入力してください'),
  burning: z.string().min(1, '灼熱感を入力してください'),
  burningDetail: z.string().min(1, '灼熱感詳細を入力してください'),
  
  // Lens Handling
  easeOfInsertion: z.string().min(1, '装用のしやすさを入力してください'),
  easeOfInsertionDetail: z.string().min(1, '装用のしやすさ詳細を入力してください'),
  easeOfRemoval: z.string().min(1, '取り外しのしやすさを入力してください'),
  easeOfRemovalDetail: z.string().min(1, '取り外しのしやすさ詳細を入力してください'),
  
  // Visual Performance
  visualPerformance: z.string().min(1, '視覚性能を入力してください'),
  visualPerformanceDetail: z.string().min(1, '視覚性能詳細を入力してください'),
  
  // Overall Assessment
  eyeStrain: z.string().min(1, '眼精疲労を入力してください'),
  eyeStrainDetail: z.string().min(1, '眼精疲労詳細を入力してください'),
  totalSatisfaction: z.string().min(1, '総合満足度を入力してください'),
  totalSatisfactionDetail: z.string().min(1, '総合満足度詳細を入力してください'),
  
  // Other Symptoms
  otherSymptoms: z.string().min(1, 'その他の症状を入力してください'),
  otherSymptomsDetail: z.string().min(1, 'その他の症状詳細を入力してください'),
});

// Export TypeScript types inferred from schemas
export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type VASFormData = z.infer<typeof vasSchema>;
export type ComparativeFormData = z.infer<typeof comparativeSchema>;
export type FittingFormData = z.infer<typeof fittingSchema>;
export type DR1FormData = z.infer<typeof dr1Schema>;
export type CorrectedVAFormData = z.infer<typeof correctedVASchema>;
export type LensInspectionFormData = z.infer<typeof lensInspectionSchema>;
export type QuestionnaireFormData = z.infer<typeof questionnaireSchema>;

// Combined form data type for dynamic forms
export type ExaminationFormData =
  | BasicInfoFormData
  | VASFormData
  | ComparativeFormData
  | FittingFormData
  | DR1FormData
  | CorrectedVAFormData
  | LensInspectionFormData
  | QuestionnaireFormData;