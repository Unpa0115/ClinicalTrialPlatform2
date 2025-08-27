import { describe, it, expect } from 'vitest';
import {
  basicInfoSchema,
  vasSchema,
  comparativeSchema,
  fittingSchema,
  dr1Schema,
  correctedVASchema,
  lensInspectionSchema,
  questionnaireSchema,
} from '../validation/examinationSchemas';

describe('Examination Form Validation Schemas', () => {
  const baseData = {
    visitId: 'visit-001',
    surveyId: 'survey-001',
    patientId: 'patient-001',
    clinicalStudyId: 'study-001',
    organizationId: 'org-001',
    eyeside: 'Right' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('BasicInfo Schema', () => {
    it('validates correct basic info data', () => {
      const validData = {
        ...baseData,
        basicInfoId: 'basic-001',
        currentUsedCL: 'アキュビューオアシス',
        cr_R1: 7.8,
        cr_R2: 7.9,
        cr_Ave: 7.85,
        va: 1.0,
        s: -2.0,
        c: -0.5,
        ax: 90,
        intraocularPressure1: 15,
        intraocularPressure2: 14,
        intraocularPressure3: 16,
        cornealEndothelialCells: 2500,
      };

      const result = basicInfoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid eyeside value', () => {
      const invalidData = {
        ...baseData,
        basicInfoId: 'basic-001',
        eyeside: 'Center' as any,
        currentUsedCL: 'Test lens',
        cr_R1: 7.8,
        cr_R2: 7.9,
        cr_Ave: 7.85,
        va: 1.0,
        s: -2.0,
        c: -0.5,
        ax: 90,
        intraocularPressure1: 15,
        intraocularPressure2: 14,
        intraocularPressure3: 16,
        cornealEndothelialCells: 2500,
      };

      const result = basicInfoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects out-of-range values', () => {
      const invalidData = {
        ...baseData,
        basicInfoId: 'basic-001',
        currentUsedCL: 'Test lens',
        cr_R1: 150, // Out of range (max 100)
        cr_R2: 7.9,
        cr_Ave: 7.85,
        va: 1.0,
        s: -2.0,
        c: -0.5,
        ax: 90,
        intraocularPressure1: 15,
        intraocularPressure2: 14,
        intraocularPressure3: 16,
        cornealEndothelialCells: 2500,
      };

      const result = basicInfoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('VAS Schema', () => {
    it('validates correct VAS data', () => {
      const validData = {
        ...baseData,
        vasId: 'vas-001',
        comfortLevel: 75,
        drynessLevel: 25,
        visualPerformance_Daytime: 80,
        visualPerformance_EndOfDay: 70,
      };

      const result = vasSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects VAS scores outside 0-100 range', () => {
      const invalidData = {
        ...baseData,
        vasId: 'vas-001',
        comfortLevel: 150, // Out of range
        drynessLevel: 25,
        visualPerformance_Daytime: 80,
        visualPerformance_EndOfDay: 70,
      };

      const result = vasSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Comparative Schema', () => {
    it('validates correct comparative data', () => {
      const validData = {
        ...baseData,
        comparativeScoresId: 'comp-001',
        comfort: 'better',
        comfortReason: '前回より快適',
        dryness: 'same',
        drynessReason: '変化なし',
        vp_DigitalDevice: 'better',
        vpReason_DigitalDevice: 'クリアに見える',
        vp_DayTime: 'same',
        vpReason_DayTime: '問題なし',
        vp_EndOfDay: 'worse',
        vpReason_EndOfDay: '夕方に曇る',
        vp_Glare: 'same',
        vpReason_Glare: '変化なし',
        vp_Halo: 'same',
        vpReason_Halo: '変化なし',
        vp_StarBurst: 'same',
        vpReason_StarBurst: '変化なし',
        eyeStrain: 'better',
        eyeStrainReason: '疲れにくい',
        totalSatisfaction: 'better',
        totalSatisfactionReason: '全体的に良好',
      };

      const result = comparativeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid assessment values', () => {
      const invalidData = {
        ...baseData,
        comparativeScoresId: 'comp-001',
        comfort: 'excellent' as any, // Invalid option
        comfortReason: '前回より快適',
        dryness: 'same',
        drynessReason: '変化なし',
        vp_DigitalDevice: 'better',
        vpReason_DigitalDevice: 'クリアに見える',
        vp_DayTime: 'same',
        vpReason_DayTime: '問題なし',
        vp_EndOfDay: 'worse',
        vpReason_EndOfDay: '夕方に曇る',
        vp_Glare: 'same',
        vpReason_Glare: '変化なし',
        vp_Halo: 'same',
        vpReason_Halo: '変化なし',
        vp_StarBurst: 'same',
        vpReason_StarBurst: '変化なし',
        eyeStrain: 'better',
        eyeStrainReason: '疲れにくい',
        totalSatisfaction: 'better',
        totalSatisfactionReason: '全体的に良好',
      };

      const result = comparativeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Fitting Schema', () => {
    it('validates correct fitting data', () => {
      const validData = {
        ...baseData,
        fittingId: 'fitting-001',
        timing: '装用1時間後',
        lensMovement: 2.5,
        lensPosition: '中央',
        fittingPattern: '適正',
        lensWettability: '良好',
        surfaceDeposit: 'なし',
        lensDryness: 'なし',
        face2_X: 1.5,
        face2_Y: -0.8,
      };

      const result = fittingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects FACE2 coordinates outside range', () => {
      const invalidData = {
        ...baseData,
        fittingId: 'fitting-001',
        timing: '装用1時間後',
        lensMovement: 2.5,
        lensPosition: '中央',
        fittingPattern: '適正',
        lensWettability: '良好',
        surfaceDeposit: 'なし',
        lensDryness: 'なし',
        face2_X: 15.0, // Out of range (max 10)
        face2_Y: -0.8,
      };

      const result = fittingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('DR1 Schema', () => {
    it('validates correct DR1 data', () => {
      const validData = {
        ...baseData,
        dr1Id: 'dr1-001',
        tearBreakUpTime: 12.5,
        schirmerTest: 18,
        tearMeniscusHeight: 0.35,
        tearQuality: '正常',
        blinkingPattern: '正常',
      };

      const result = dr1Schema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects negative values', () => {
      const invalidData = {
        ...baseData,
        dr1Id: 'dr1-001',
        tearBreakUpTime: -5, // Invalid negative value
        schirmerTest: 18,
        tearMeniscusHeight: 0.35,
        tearQuality: '正常',
        blinkingPattern: '正常',
      };

      const result = dr1Schema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('CorrectedVA Schema', () => {
    it('validates correct corrected VA data', () => {
      const validData = {
        ...baseData,
        correctedVAId: 'corrected-001',
        va_WithoutLens: '0.8',
        va_WithLens: '1.0',
        redGreenTest: '同等',
        va_S_Correction: '1.2',
        s_S_Correction: '+0.25D',
        clarity_S_Correction: '良好',
        clarityDetail_S_Correction: 'くっきり見える',
        stability_S_Correction: '安定',
        stabilityDetail_S_Correction: '常に安定',
        va_SC_Correction: '1.5',
        s_SC_Correction: '+0.25D',
        c_SC_Correction: '-0.50D',
        ax_SC_Correction: '90°',
        clarity_SC_Correction: '非常に良好',
        clarityDetail_SC_Correction: 'くっきり見える',
        stability_SC_Correction: '非常に安定',
        stabilityDetail_SC_Correction: '常に安定',
      };

      const result = correctedVASchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('LensInspection Schema', () => {
    it('validates correct lens inspection data', () => {
      const validData = {
        ...baseData,
        lensInspectionId: 'lens-001',
        lensDeposit: '軽度タンパク質沈着',
        lensScratchDamage: '軽微な表面傷',
      };

      const result = lensInspectionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('requires lens deposit and damage fields', () => {
      const invalidData = {
        ...baseData,
        lensInspectionId: 'lens-001',
        lensDeposit: '', // Empty required field
        lensScratchDamage: '軽微な表面傷',
      };

      const result = lensInspectionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Questionnaire Schema', () => {
    it('validates correct questionnaire data', () => {
      const validData = {
        ...baseData,
        questionnaireId: 'quest-001',
        timing: '装用4時間後',
        comfort: '軽度',
        comfortDetail: '概ね快適',
        comfort_Initial: 'なし',
        comfortDetail_Initial: '問題なし',
        comfort_Daytime: '軽度',
        comfortDetail_Daytime: 'やや違和感',
        comfort_Afternoon: '中等度',
        comfortDetail_Afternoon: '乾燥感増加',
        comfort_EndOfDay: '重度',
        comfortDetail_EndOfDay: '不快感強い',
        dryness: '中等度',
        drynessDetail: '午後から乾燥',
        dryness_Initial: 'なし',
        drynessDetail_Initial: '問題なし',
        dryness_Daytime: '軽度',
        drynessDetail_Daytime: '軽い乾燥',
        dryness_Afternoon: '中等度',
        drynessDetail_Afternoon: '明らかな乾燥',
        dryness_EndOfDay: '重度',
        drynessDetail_EndOfDay: '強い乾燥感',
        irritation: '軽度',
        irritationDetail: '時々チクチク',
        burning: 'なし',
        burningDetail: '特になし',
        easeOfInsertion: '良い',
        easeOfInsertionDetail: 'スムーズ',
        easeOfRemoval: '良い',
        easeOfRemovalDetail: '簡単',
        visualPerformance: '良い',
        visualPerformanceDetail: 'クリア',
        eyeStrain: '軽度',
        eyeStrainDetail: '夕方に疲労',
        totalSatisfaction: '普通',
        totalSatisfactionDetail: '概ね満足',
        otherSymptoms: 'なし',
        otherSymptomsDetail: '特になし',
      };

      const result = questionnaireSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('requires all questionnaire fields', () => {
      const invalidData = {
        ...baseData,
        questionnaireId: 'quest-001',
        timing: '装用4時間後',
        // Missing many required fields
        comfort: '',
        comfortDetail: '',
      };

      const result = questionnaireSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});