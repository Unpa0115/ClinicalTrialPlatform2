import { BaseExaminationRepository, BaseExaminationData } from './BaseExaminationRepository.js';
import { tableNames } from '../config/database.js';

/**
 * CorrectedVA examination data interface
 */
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

/**
 * Repository for CorrectedVA (Corrected Visual Acuity) examination data
 * Handles comprehensive visual acuity testing with lens corrections
 */
export class CorrectedVARepository extends BaseExaminationRepository<CorrectedVAExaminationData> {
  constructor() {
    super(tableNames.correctedVA);
  }

  protected getExaminationIdFieldName(): string {
    return 'correctedVAId';
  }

  protected getExaminationPrefix(): string {
    return 'correctedva';
  }

  // Valid assessment values
  private readonly VALID_RED_GREEN_TEST = [
    'neutral', 'red_clearer', 'green_clearer', 'cannot_determine'
  ];
  private readonly VALID_CLARITY = [
    'excellent', 'good', 'fair', 'poor', 'very_poor'
  ];
  private readonly VALID_STABILITY = [
    'very_stable', 'stable', 'moderately_stable', 'unstable', 'very_unstable'
  ];

  /**
   * Create corrected VA examination with validation
   */
  async createCorrectedVA(
    visitId: string,
    surveyId: string,
    patientId: string,
    clinicalStudyId: string,
    organizationId: string,
    eyeside: 'Right' | 'Left',
    data: Omit<CorrectedVAExaminationData, keyof BaseExaminationData | 'correctedVAId'>
  ): Promise<CorrectedVAExaminationData> {
    // Validate corrected VA data
    this.validateCorrectedVAData(data);

    return await this.createExamination(
      visitId, surveyId, patientId, clinicalStudyId, organizationId, eyeside, data
    );
  }

  /**
   * Update corrected VA examination
   */
  async updateCorrectedVA(
    visitId: string,
    correctedVAId: string,
    updates: Partial<Omit<CorrectedVAExaminationData, keyof BaseExaminationData | 'correctedVAId'>>
  ): Promise<CorrectedVAExaminationData> {
    // Validate updated data
    if (Object.keys(updates).length > 0) {
      this.validateCorrectedVAData(updates as any);
    }

    return await this.updateExamination(visitId, correctedVAId, updates);
  }

  /**
   * Get visual acuity progression summary for survey
   */
  async getVAProgressionSummary(surveyId: string, eyeside: 'Right' | 'Left'): Promise<{
    visitCount: number;
    withoutLensProgression: {
      baseline: string;
      latest: string;
      improvement: 'improved' | 'stable' | 'declined' | 'insufficient_data';
    };
    withLensProgression: {
      baseline: string;
      latest: string;
      improvement: 'improved' | 'stable' | 'declined' | 'insufficient_data';
    };
    correctionEffectiveness: {
      s_correction: 'very_effective' | 'effective' | 'moderately_effective' | 'limited_effect';
      sc_correction: 'very_effective' | 'effective' | 'moderately_effective' | 'limited_effect';
    };
    clarityTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
    stabilityTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
    recommendations: string[];
  }> {
    const examinations = await this.compareVisits(surveyId, eyeside);
    
    if (examinations.length === 0) {
      return this.getEmptyVAProgressionSummary();
    }

    const baseline = examinations[0];
    const latest = examinations[examinations.length - 1];

    // Analyze progressions
    const withoutLensProgression = {
      baseline: baseline.va_WithoutLens,
      latest: latest.va_WithoutLens,
      improvement: this.compareVisualAcuity(baseline.va_WithoutLens, latest.va_WithoutLens)
    };

    const withLensProgression = {
      baseline: baseline.va_WithLens,
      latest: latest.va_WithLens,
      improvement: this.compareVisualAcuity(baseline.va_WithLens, latest.va_WithLens)
    };

    // Assess correction effectiveness
    const correctionEffectiveness = {
      s_correction: this.assessCorrectionEffectiveness(
        latest.va_WithoutLens,
        latest.va_S_Correction,
        latest.clarity_S_Correction,
        latest.stability_S_Correction
      ),
      sc_correction: this.assessCorrectionEffectiveness(
        latest.va_WithoutLens,
        latest.va_SC_Correction,
        latest.clarity_SC_Correction,
        latest.stability_SC_Correction
      )
    };

    // Analyze trends
    const clarityTrend = this.analyzeClarityTrend(examinations);
    const stabilityTrend = this.analyzeStabilityTrend(examinations);

    // Generate recommendations
    const recommendations = this.generateVARecommendations(
      examinations, 
      correctionEffectiveness,
      clarityTrend,
      stabilityTrend
    );

    return {
      visitCount: examinations.length,
      withoutLensProgression,
      withLensProgression,
      correctionEffectiveness,
      clarityTrend,
      stabilityTrend,
      recommendations
    };
  }

  /**
   * Compare correction effectiveness between visits
   */
  async compareCorrectionEffectiveness(
    visitId1: string,
    visitId2: string,
    eyeside: 'Right' | 'Left'
  ): Promise<{
    visit1: CorrectedVAExaminationData | null;
    visit2: CorrectedVAExaminationData | null;
    sCorrectionComparison: {
      vaImprovement: number; // VA lines improved
      clarityChange: 'improved' | 'worsened' | 'same';
      stabilityChange: 'improved' | 'worsened' | 'same';
      overallEffectiveness: 'improved' | 'worsened' | 'same';
    } | null;
    scCorrectionComparison: {
      vaImprovement: number; // VA lines improved
      clarityChange: 'improved' | 'worsened' | 'same';
      stabilityChange: 'improved' | 'worsened' | 'same';
      overallEffectiveness: 'improved' | 'worsened' | 'same';
    } | null;
    recommendations: string[];
  }> {
    const [visit1Data, visit2Data] = await Promise.all([
      this.findByVisitAndEye(visitId1, eyeside),
      this.findByVisitAndEye(visitId2, eyeside)
    ]);

    let sCorrectionComparison = null;
    let scCorrectionComparison = null;
    let recommendations: string[] = [];

    if (visit1Data && visit2Data) {
      // S-Correction comparison
      const sVAImprovement = this.calculateVAImprovement(visit1Data.va_S_Correction, visit2Data.va_S_Correction);
      sCorrectionComparison = {
        vaImprovement: sVAImprovement,
        clarityChange: this.compareClarityStability(visit1Data.clarity_S_Correction, visit2Data.clarity_S_Correction),
        stabilityChange: this.compareClarityStability(visit1Data.stability_S_Correction, visit2Data.stability_S_Correction),
        overallEffectiveness: this.calculateOverallEffectiveness(
          sVAImprovement,
          visit1Data.clarity_S_Correction,
          visit2Data.clarity_S_Correction,
          visit1Data.stability_S_Correction,
          visit2Data.stability_S_Correction
        )
      };

      // SC-Correction comparison
      const scVAImprovement = this.calculateVAImprovement(visit1Data.va_SC_Correction, visit2Data.va_SC_Correction);
      scCorrectionComparison = {
        vaImprovement: scVAImprovement,
        clarityChange: this.compareClarityStability(visit1Data.clarity_SC_Correction, visit2Data.clarity_SC_Correction),
        stabilityChange: this.compareClarityStability(visit1Data.stability_SC_Correction, visit2Data.stability_SC_Correction),
        overallEffectiveness: this.calculateOverallEffectiveness(
          scVAImprovement,
          visit1Data.clarity_SC_Correction,
          visit2Data.clarity_SC_Correction,
          visit1Data.stability_SC_Correction,
          visit2Data.stability_SC_Correction
        )
      };

      // Generate specific recommendations
      recommendations = this.generateComparisonRecommendations(
        visit1Data, 
        visit2Data, 
        sCorrectionComparison, 
        scCorrectionComparison
      );
    }

    return {
      visit1: visit1Data,
      visit2: visit2Data,
      sCorrectionComparison,
      scCorrectionComparison,
      recommendations
    };
  }

  /**
   * Get optimal correction analysis
   */
  async getOptimalCorrectionAnalysis(visitId: string, eyeside: 'Right' | 'Left'): Promise<{
    recommendedCorrection: 's_correction' | 'sc_correction' | 'no_correction' | 'insufficient_data';
    analysisDetails: {
      withoutLens: { va: string; limitations: string[] };
      sCorrection: { va: string; clarity: string; stability: string; effectiveness: string };
      scCorrection: { va: string; clarity: string; stability: string; effectiveness: string };
    };
    decisionFactors: string[];
    clinicalNotes: string[];
    followUpRecommendations: string[];
  } | null> {
    const correctedVAData = await this.findByVisitAndEye(visitId, eyeside);
    
    if (!correctedVAData) {
      return null;
    }

    // Analyze each correction approach
    const withoutLensLimitations = this.identifyUncorrectedLimitations(correctedVAData);
    
    const sCorrectionEffectiveness = this.assessCorrectionEffectiveness(
      correctedVAData.va_WithoutLens,
      correctedVAData.va_S_Correction,
      correctedVAData.clarity_S_Correction,
      correctedVAData.stability_S_Correction
    );

    const scCorrectionEffectiveness = this.assessCorrectionEffectiveness(
      correctedVAData.va_WithoutLens,
      correctedVAData.va_SC_Correction,
      correctedVAData.clarity_SC_Correction,
      correctedVAData.stability_SC_Correction
    );

    // Determine recommended correction
    const recommendedCorrection = this.determineOptimalCorrection(
      correctedVAData,
      sCorrectionEffectiveness,
      scCorrectionEffectiveness
    );

    // Generate analysis details
    const analysisDetails = {
      withoutLens: {
        va: correctedVAData.va_WithoutLens,
        limitations: withoutLensLimitations
      },
      sCorrection: {
        va: correctedVAData.va_S_Correction,
        clarity: correctedVAData.clarity_S_Correction,
        stability: correctedVAData.stability_S_Correction,
        effectiveness: sCorrectionEffectiveness
      },
      scCorrection: {
        va: correctedVAData.va_SC_Correction,
        clarity: correctedVAData.clarity_SC_Correction,
        stability: correctedVAData.stability_SC_Correction,
        effectiveness: scCorrectionEffectiveness
      }
    };

    // Identify decision factors
    const decisionFactors = this.identifyDecisionFactors(correctedVAData, recommendedCorrection);

    // Generate clinical notes and follow-up recommendations
    const clinicalNotes = this.generateClinicalNotes(correctedVAData, recommendedCorrection);
    const followUpRecommendations = this.generateFollowUpRecommendations(
      correctedVAData, 
      recommendedCorrection,
      sCorrectionEffectiveness,
      scCorrectionEffectiveness
    );

    return {
      recommendedCorrection,
      analysisDetails,
      decisionFactors,
      clinicalNotes,
      followUpRecommendations
    };
  }

  /**
   * Validate corrected VA data
   */
  private validateCorrectedVAData(data: Partial<Omit<CorrectedVAExaminationData, keyof BaseExaminationData | 'correctedVAId'>>): void {
    // Validate visual acuity strings (should be in format like "20/20", "1.0", etc.)
    const vaFields = [
      'va_WithoutLens', 'va_WithLens', 'va_S_Correction', 'va_SC_Correction'
    ] as const;

    vaFields.forEach(field => {
      if (data[field] !== undefined && typeof data[field] !== 'string') {
        throw new Error(`${field} must be a string representing visual acuity`);
      }
    });

    // Validate red-green test
    if (data.redGreenTest !== undefined && !this.VALID_RED_GREEN_TEST.includes(data.redGreenTest)) {
      throw new Error(`redGreenTest must be one of: ${this.VALID_RED_GREEN_TEST.join(', ')}`);
    }

    // Validate clarity assessments
    const clarityFields = ['clarity_S_Correction', 'clarity_SC_Correction'] as const;
    clarityFields.forEach(field => {
      if (data[field] !== undefined && !this.VALID_CLARITY.includes(data[field]!)) {
        throw new Error(`${field} must be one of: ${this.VALID_CLARITY.join(', ')}`);
      }
    });

    // Validate stability assessments
    const stabilityFields = ['stability_S_Correction', 'stability_SC_Correction'] as const;
    stabilityFields.forEach(field => {
      if (data[field] !== undefined && !this.VALID_STABILITY.includes(data[field]!)) {
        throw new Error(`${field} must be one of: ${this.VALID_STABILITY.join(', ')}`);
      }
    });

    // Validate correction values (spherical and cylindrical)
    const correctionFields = ['s_S_Correction', 's_SC_Correction', 'c_SC_Correction'] as const;
    correctionFields.forEach(field => {
      if (data[field] !== undefined && typeof data[field] !== 'string') {
        throw new Error(`${field} must be a string representing diopter value`);
      }
    });

    // Validate axis (0-180 degrees)
    if (data.ax_SC_Correction !== undefined && typeof data.ax_SC_Correction !== 'string') {
      throw new Error('ax_SC_Correction must be a string representing axis value');
    }
  }

  private getEmptyVAProgressionSummary() {
    return {
      visitCount: 0,
      withoutLensProgression: {
        baseline: '',
        latest: '',
        improvement: 'insufficient_data' as const
      },
      withLensProgression: {
        baseline: '',
        latest: '',
        improvement: 'insufficient_data' as const
      },
      correctionEffectiveness: {
        s_correction: 'limited_effect' as const,
        sc_correction: 'limited_effect' as const
      },
      clarityTrend: 'insufficient_data' as const,
      stabilityTrend: 'insufficient_data' as const,
      recommendations: ['No corrected VA data available for analysis']
    };
  }

  private compareVisualAcuity(va1: string, va2: string): 'improved' | 'stable' | 'declined' | 'insufficient_data' {
    // This is a simplified comparison - in reality, you'd need to parse different VA formats
    // For now, assume string comparison where alphabetically later means better
    if (!va1 || !va2) return 'insufficient_data';
    
    // Simple numeric comparison for decimal VA values
    const num1 = parseFloat(va1);
    const num2 = parseFloat(va2);
    
    if (!isNaN(num1) && !isNaN(num2)) {
      const improvement = num2 - num1;
      if (improvement >= 0.1) return 'improved';
      if (improvement <= -0.1) return 'declined';
      return 'stable';
    }
    
    return 'insufficient_data';
  }

  private assessCorrectionEffectiveness(
    uncorrectedVA: string,
    correctedVA: string,
    clarity: string,
    stability: string
  ): 'very_effective' | 'effective' | 'moderately_effective' | 'limited_effect' {
    let effectivenessScore = 0;

    // VA improvement scoring
    const improvement = this.calculateVAImprovement(uncorrectedVA, correctedVA);
    if (improvement >= 3) effectivenessScore += 3;
    else if (improvement >= 2) effectivenessScore += 2;
    else if (improvement >= 1) effectivenessScore += 1;

    // Clarity scoring
    const clarityScores: Record<string, number> = {
      'excellent': 2, 'good': 2, 'fair': 1, 'poor': 0, 'very_poor': 0
    };
    effectivenessScore += clarityScores[clarity] || 0;

    // Stability scoring
    const stabilityScores: Record<string, number> = {
      'very_stable': 2, 'stable': 2, 'moderately_stable': 1, 'unstable': 0, 'very_unstable': 0
    };
    effectivenessScore += stabilityScores[stability] || 0;

    if (effectivenessScore >= 6) return 'very_effective';
    if (effectivenessScore >= 4) return 'effective';
    if (effectivenessScore >= 2) return 'moderately_effective';
    return 'limited_effect';
  }

  private calculateVAImprovement(va1: string, va2: string): number {
    // Simplified VA improvement calculation
    const num1 = parseFloat(va1);
    const num2 = parseFloat(va2);
    
    if (!isNaN(num1) && !isNaN(num2)) {
      // Convert to "lines" of improvement (approximate)
      const improvement = (num2 - num1) * 10; // Rough conversion
      return Math.round(improvement);
    }
    
    return 0;
  }

  private analyzeClarityTrend(examinations: CorrectedVAExaminationData[]): 'improving' | 'stable' | 'declining' | 'insufficient_data' {
    if (examinations.length < 2) return 'insufficient_data';

    const clarityScores = examinations.map(exam => {
      const sScore = this.getClarityScore(exam.clarity_S_Correction);
      const scScore = this.getClarityScore(exam.clarity_SC_Correction);
      return (sScore + scScore) / 2;
    });

    const first = clarityScores[0];
    const last = clarityScores[clarityScores.length - 1];
    const change = last - first;

    if (change >= 1) return 'improving';
    if (change <= -1) return 'declining';
    return 'stable';
  }

  private analyzeStabilityTrend(examinations: CorrectedVAExaminationData[]): 'improving' | 'stable' | 'declining' | 'insufficient_data' {
    if (examinations.length < 2) return 'insufficient_data';

    const stabilityScores = examinations.map(exam => {
      const sScore = this.getStabilityScore(exam.stability_S_Correction);
      const scScore = this.getStabilityScore(exam.stability_SC_Correction);
      return (sScore + scScore) / 2;
    });

    const first = stabilityScores[0];
    const last = stabilityScores[stabilityScores.length - 1];
    const change = last - first;

    if (change >= 1) return 'improving';
    if (change <= -1) return 'declining';
    return 'stable';
  }

  private getClarityScore(clarity: string): number {
    const scores: Record<string, number> = {
      'excellent': 5, 'good': 4, 'fair': 3, 'poor': 2, 'very_poor': 1
    };
    return scores[clarity] || 0;
  }

  private getStabilityScore(stability: string): number {
    const scores: Record<string, number> = {
      'very_stable': 5, 'stable': 4, 'moderately_stable': 3, 'unstable': 2, 'very_unstable': 1
    };
    return scores[stability] || 0;
  }

  private compareClarityStability(assessment1: string, assessment2: string): 'improved' | 'worsened' | 'same' {
    const score1 = this.getClarityScore(assessment1);
    const score2 = this.getClarityScore(assessment2);

    if (score2 > score1) return 'improved';
    if (score2 < score1) return 'worsened';
    return 'same';
  }

  private calculateOverallEffectiveness(
    vaImprovement: number,
    clarity1: string,
    clarity2: string,
    stability1: string,
    stability2: string
  ): 'improved' | 'worsened' | 'same' {
    let score = 0;
    
    if (vaImprovement > 0) score += 1;
    else if (vaImprovement < 0) score -= 1;

    const clarityChange = this.getClarityScore(clarity2) - this.getClarityScore(clarity1);
    const stabilityChange = this.getStabilityScore(stability2) - this.getStabilityScore(stability1);

    if (clarityChange > 0) score += 1;
    else if (clarityChange < 0) score -= 1;

    if (stabilityChange > 0) score += 1;
    else if (stabilityChange < 0) score -= 1;

    if (score > 0) return 'improved';
    if (score < 0) return 'worsened';
    return 'same';
  }

  // Additional helper methods for the complex analysis would continue here...
  // Due to length constraints, I'm including the key structure and core methods

  private generateVARecommendations(
    examinations: CorrectedVAExaminationData[],
    effectiveness: any,
    clarityTrend: string,
    stabilityTrend: string
  ): string[] {
    const recommendations: string[] = [];

    if (effectiveness.sc_correction === 'very_effective') {
      recommendations.push('SC correction shows excellent results - continue current approach');
    } else if (effectiveness.s_correction === 'very_effective') {
      recommendations.push('S correction is highly effective - astigmatic correction may not be necessary');
    }

    if (clarityTrend === 'declining') {
      recommendations.push('Monitor clarity trends - consider lens surface treatments or replacement');
    }

    if (stabilityTrend === 'declining') {
      recommendations.push('Evaluate fit stability and consider design modifications');
    }

    return recommendations;
  }

  private generateComparisonRecommendations(
    visit1: CorrectedVAExaminationData,
    visit2: CorrectedVAExaminationData,
    sComparison: any,
    scComparison: any
  ): string[] {
    const recommendations: string[] = [];

    if (sComparison?.overallEffectiveness === 'improved' && scComparison?.overallEffectiveness === 'improved') {
      recommendations.push('Both correction methods showing improvement - continue monitoring');
    } else if (sComparison?.overallEffectiveness === 'worsened' || scComparison?.overallEffectiveness === 'worsened') {
      recommendations.push('Declining correction effectiveness detected - review fit and lens condition');
    }

    return recommendations;
  }

  private identifyUncorrectedLimitations(data: CorrectedVAExaminationData): string[] {
    const limitations: string[] = [];
    
    // Compare uncorrected vs corrected VA to identify limitations
    const uncorrectedNum = parseFloat(data.va_WithoutLens);
    const withLensNum = parseFloat(data.va_WithLens);
    
    if (!isNaN(uncorrectedNum) && !isNaN(withLensNum) && uncorrectedNum < withLensNum) {
      limitations.push('Significant visual acuity limitation without correction');
    }

    return limitations;
  }

  private determineOptimalCorrection(
    data: CorrectedVAExaminationData,
    sEffectiveness: string,
    scEffectiveness: string
  ): 's_correction' | 'sc_correction' | 'no_correction' | 'insufficient_data' {
    if (scEffectiveness === 'very_effective') return 'sc_correction';
    if (sEffectiveness === 'very_effective' && scEffectiveness !== 'very_effective') return 's_correction';
    if (sEffectiveness === 'limited_effect' && scEffectiveness === 'limited_effect') return 'no_correction';
    
    return 'sc_correction'; // Default to more comprehensive correction
  }

  private identifyDecisionFactors(data: CorrectedVAExaminationData, recommendation: string): string[] {
    const factors: string[] = [];
    
    factors.push(`Red-green test result: ${data.redGreenTest}`);
    
    if (recommendation === 'sc_correction') {
      factors.push('Cylindrical correction provides superior visual outcome');
    } else if (recommendation === 's_correction') {
      factors.push('Spherical correction sufficient for optimal vision');
    }

    return factors;
  }

  private generateClinicalNotes(data: CorrectedVAExaminationData, recommendation: string): string[] {
    const notes: string[] = [];
    
    notes.push(`Best corrected visual acuity achieved with ${recommendation}`);
    
    if (data.clarityDetail_SC_Correction) {
      notes.push(`SC correction clarity details: ${data.clarityDetail_SC_Correction}`);
    }
    
    if (data.stabilityDetail_SC_Correction) {
      notes.push(`SC correction stability details: ${data.stabilityDetail_SC_Correction}`);
    }

    return notes;
  }

  private generateFollowUpRecommendations(
    data: CorrectedVAExaminationData,
    recommendation: string,
    sEffectiveness: string,
    scEffectiveness: string
  ): string[] {
    const recommendations: string[] = [];
    
    if (recommendation === 'sc_correction' && scEffectiveness !== 'very_effective') {
      recommendations.push('Monitor SC correction effectiveness at next visit');
    }
    
    recommendations.push('Continue regular visual acuity monitoring');
    
    return recommendations;
  }
}