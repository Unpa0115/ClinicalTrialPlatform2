import { BaseExaminationRepository, BaseExaminationData } from './BaseExaminationRepository.js';
import { tableNames } from '../config/database.js';

/**
 * DR1 examination data interface
 */
export interface DR1ExaminationData extends BaseExaminationData {
  dr1Id: string;
  
  // Tear Film Assessment Data
  tearBreakUpTime: number; // Float - 涙液破綻時間 (seconds)
  schirmerTest: number; // Integer - シルマーテスト値 (mm/5min)
  tearMeniscusHeight: number; // Float - 涙液メニスカス高 (mm)
  
  // Additional Assessments
  tearQuality: string; // 涙液の質的評価
  blinkingPattern: string; // 瞬目パターン
}

/**
 * Repository for DR1 (Tear Film Assessment) examination data
 * Handles comprehensive tear film analysis and dry eye assessment
 */
export class DR1Repository extends BaseExaminationRepository<DR1ExaminationData> {
  constructor() {
    super(tableNames.dr1);
  }

  protected getExaminationIdFieldName(): string {
    return 'dr1Id';
  }

  protected getExaminationPrefix(): string {
    return 'dr1';
  }

  // Valid assessment values
  private readonly VALID_TEAR_QUALITY = [
    'excellent', 'good', 'fair', 'poor', 'very_poor'
  ];
  private readonly VALID_BLINKING_PATTERNS = [
    'normal', 'frequent', 'infrequent', 'incomplete', 'irregular', 'forced'
  ];

  /**
   * Create DR1 examination with validation
   */
  async createDR1(
    visitId: string,
    surveyId: string,
    patientId: string,
    clinicalStudyId: string,
    organizationId: string,
    eyeside: 'Right' | 'Left',
    data: Omit<DR1ExaminationData, keyof BaseExaminationData | 'dr1Id'>
  ): Promise<DR1ExaminationData> {
    // Validate tear film data
    this.validateDR1Data(data);

    return await this.createExamination(
      visitId, surveyId, patientId, clinicalStudyId, organizationId, eyeside, data
    );
  }

  /**
   * Update DR1 examination
   */
  async updateDR1(
    visitId: string,
    dr1Id: string,
    updates: Partial<Omit<DR1ExaminationData, keyof BaseExaminationData | 'dr1Id'>>
  ): Promise<DR1ExaminationData> {
    // Validate updated data
    if (Object.keys(updates).length > 0) {
      this.validateDR1Data(updates as any);
    }

    return await this.updateExamination(visitId, dr1Id, updates);
  }

  /**
   * Get tear film assessment summary for survey
   */
  async getTearFilmSummary(surveyId: string, eyeside: 'Right' | 'Left'): Promise<{
    visitCount: number;
    averageTBUT: number; // Tear Break-Up Time
    averageSchirmer: number;
    averageMeniscusHeight: number;
    dryEyeSeverity: 'none' | 'mild' | 'moderate' | 'severe';
    trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
    riskFactors: string[];
    recommendations: string[];
  }> {
    const examinations = await this.compareVisits(surveyId, eyeside);
    
    if (examinations.length === 0) {
      return this.getEmptyTearFilmSummary();
    }

    // Calculate averages
    const totalTBUT = examinations.reduce((sum, exam) => sum + exam.tearBreakUpTime, 0);
    const totalSchirmer = examinations.reduce((sum, exam) => sum + exam.schirmerTest, 0);
    const totalMeniscus = examinations.reduce((sum, exam) => sum + exam.tearMeniscusHeight, 0);

    const averageTBUT = totalTBUT / examinations.length;
    const averageSchirmer = totalSchirmer / examinations.length;
    const averageMeniscusHeight = totalMeniscus / examinations.length;

    // Assess dry eye severity
    const dryEyeSeverity = this.assessDryEyeSeverity(averageTBUT, averageSchirmer, averageMeniscusHeight);

    // Analyze trend
    const trend = this.analyzeTearFilmTrend(examinations);

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(examinations, averageTBUT, averageSchirmer);

    // Generate recommendations
    const recommendations = this.generateTearFilmRecommendations(
      dryEyeSeverity, 
      riskFactors, 
      examinations,
      averageTBUT,
      averageSchirmer
    );

    return {
      visitCount: examinations.length,
      averageTBUT: Math.round(averageTBUT * 100) / 100,
      averageSchirmer: Math.round(averageSchirmer * 100) / 100,
      averageMeniscusHeight: Math.round(averageMeniscusHeight * 1000) / 1000,
      dryEyeSeverity,
      trend,
      riskFactors,
      recommendations
    };
  }

  /**
   * Compare tear film parameters between visits
   */
  async compareTearFilmBetweenVisits(
    visitId1: string,
    visitId2: string,
    eyeside: 'Right' | 'Left'
  ): Promise<{
    visit1: DR1ExaminationData | null;
    visit2: DR1ExaminationData | null;
    changes: {
      tbutChange: number;
      schirmerChange: number;
      meniscusHeightChange: number;
      qualityChange: 'improved' | 'worsened' | 'same' | 'not_comparable';
      blinkingChange: 'improved' | 'worsened' | 'same' | 'not_comparable';
    } | null;
    clinicalSignificance: string[];
  }> {
    const [visit1Data, visit2Data] = await Promise.all([
      this.findByVisitAndEye(visitId1, eyeside),
      this.findByVisitAndEye(visitId2, eyeside)
    ]);

    let changes = null;
    let clinicalSignificance: string[] = [];

    if (visit1Data && visit2Data) {
      const tbutChange = visit2Data.tearBreakUpTime - visit1Data.tearBreakUpTime;
      const schirmerChange = visit2Data.schirmerTest - visit1Data.schirmerTest;
      const meniscusHeightChange = visit2Data.tearMeniscusHeight - visit1Data.tearMeniscusHeight;

      changes = {
        tbutChange,
        schirmerChange,
        meniscusHeightChange,
        qualityChange: this.compareTearQuality(visit1Data.tearQuality, visit2Data.tearQuality),
        blinkingChange: this.compareBlinkingPattern(visit1Data.blinkingPattern, visit2Data.blinkingPattern),
      };

      // Assess clinical significance
      clinicalSignificance = this.assessClinicalSignificance(
        tbutChange, 
        schirmerChange, 
        meniscusHeightChange,
        visit1Data,
        visit2Data
      );
    }

    return {
      visit1: visit1Data,
      visit2: visit2Data,
      changes,
      clinicalSignificance
    };
  }

  /**
   * Get dry eye classification based on current standards
   */
  async getDryEyeClassification(visitId: string, eyeside: 'Right' | 'Left'): Promise<{
    classification: 'normal' | 'aqueous_deficient' | 'evaporative' | 'mixed' | 'severe';
    severity: 'none' | 'mild' | 'moderate' | 'severe';
    primaryMechanism: string;
    supportingEvidence: string[];
    treatmentGuidance: string[];
  } | null> {
    const dr1Data = await this.findByVisitAndEye(visitId, eyeside);
    
    if (!dr1Data) {
      return null;
    }

    const { tearBreakUpTime, schirmerTest, tearMeniscusHeight, tearQuality, blinkingPattern } = dr1Data;

    // Classify dry eye type
    let classification: 'normal' | 'aqueous_deficient' | 'evaporative' | 'mixed' | 'severe';
    let primaryMechanism = '';
    let supportingEvidence: string[] = [];

    if (tearBreakUpTime >= 10 && schirmerTest >= 10 && tearMeniscusHeight >= 0.2) {
      classification = 'normal';
      primaryMechanism = 'Normal tear film parameters';
    } else if (schirmerTest < 5 && tearMeniscusHeight < 0.1) {
      classification = 'aqueous_deficient';
      primaryMechanism = 'Reduced tear production';
      supportingEvidence.push(`Low Schirmer test (${schirmerTest}mm)`);
      supportingEvidence.push(`Reduced tear meniscus (${tearMeniscusHeight}mm)`);
    } else if (tearBreakUpTime < 5 && schirmerTest >= 10) {
      classification = 'evaporative';
      primaryMechanism = 'Increased tear evaporation';
      supportingEvidence.push(`Short tear break-up time (${tearBreakUpTime}s)`);
    } else if (tearBreakUpTime < 5 && schirmerTest < 10) {
      classification = 'mixed';
      primaryMechanism = 'Combined aqueous deficiency and evaporative dysfunction';
      supportingEvidence.push(`Short TBUT (${tearBreakUpTime}s) and low Schirmer (${schirmerTest}mm)`);
    } else {
      classification = 'severe';
      primaryMechanism = 'Severe dry eye with multiple factors';
    }

    // Add additional supporting evidence
    if (tearQuality === 'poor' || tearQuality === 'very_poor') {
      supportingEvidence.push('Poor tear quality observed');
    }
    if (blinkingPattern === 'incomplete' || blinkingPattern === 'infrequent') {
      supportingEvidence.push(`Abnormal blinking pattern: ${blinkingPattern}`);
    }

    // Determine severity
    const severity = this.assessDryEyeSeverity(tearBreakUpTime, schirmerTest, tearMeniscusHeight);

    // Generate treatment guidance
    const treatmentGuidance = this.generateTreatmentGuidance(classification, severity);

    return {
      classification,
      severity,
      primaryMechanism,
      supportingEvidence,
      treatmentGuidance
    };
  }

  /**
   * Validate DR1 data ranges and values
   */
  private validateDR1Data(data: Partial<Omit<DR1ExaminationData, keyof BaseExaminationData | 'dr1Id'>>): void {
    // Validate tear break-up time (typical range: 1-30 seconds)
    if (data.tearBreakUpTime !== undefined && (data.tearBreakUpTime < 1 || data.tearBreakUpTime > 30)) {
      throw new Error('Tear break-up time must be between 1 and 30 seconds');
    }

    // Validate Schirmer test (typical range: 0-35mm)
    if (data.schirmerTest !== undefined && (data.schirmerTest < 0 || data.schirmerTest > 35)) {
      throw new Error('Schirmer test must be between 0 and 35mm');
    }

    // Validate tear meniscus height (typical range: 0-1mm)
    if (data.tearMeniscusHeight !== undefined && (data.tearMeniscusHeight < 0 || data.tearMeniscusHeight > 1)) {
      throw new Error('Tear meniscus height must be between 0 and 1mm');
    }

    // Validate tear quality
    if (data.tearQuality !== undefined && !this.VALID_TEAR_QUALITY.includes(data.tearQuality)) {
      throw new Error(`tearQuality must be one of: ${this.VALID_TEAR_QUALITY.join(', ')}`);
    }

    // Validate blinking pattern
    if (data.blinkingPattern !== undefined && !this.VALID_BLINKING_PATTERNS.includes(data.blinkingPattern)) {
      throw new Error(`blinkingPattern must be one of: ${this.VALID_BLINKING_PATTERNS.join(', ')}`);
    }
  }

  private getEmptyTearFilmSummary() {
    return {
      visitCount: 0,
      averageTBUT: 0,
      averageSchirmer: 0,
      averageMeniscusHeight: 0,
      dryEyeSeverity: 'none' as const,
      trend: 'insufficient_data' as const,
      riskFactors: [],
      recommendations: ['No tear film data available for analysis']
    };
  }

  private assessDryEyeSeverity(
    tbut: number, 
    schirmer: number, 
    meniscus: number
  ): 'none' | 'mild' | 'moderate' | 'severe' {
    let severityScore = 0;

    // TBUT scoring
    if (tbut < 5) severityScore += 3;
    else if (tbut < 10) severityScore += 2;
    else if (tbut < 15) severityScore += 1;

    // Schirmer scoring
    if (schirmer < 5) severityScore += 3;
    else if (schirmer < 10) severityScore += 2;
    else if (schirmer < 15) severityScore += 1;

    // Meniscus scoring
    if (meniscus < 0.1) severityScore += 2;
    else if (meniscus < 0.2) severityScore += 1;

    if (severityScore >= 6) return 'severe';
    if (severityScore >= 4) return 'moderate';
    if (severityScore >= 2) return 'mild';
    return 'none';
  }

  private analyzeTearFilmTrend(examinations: DR1ExaminationData[]): 'improving' | 'stable' | 'declining' | 'insufficient_data' {
    if (examinations.length < 2) return 'insufficient_data';

    // Compare first half vs second half
    const mid = Math.floor(examinations.length / 2);
    const firstHalf = examinations.slice(0, mid);
    const secondHalf = examinations.slice(mid);

    const firstAvgTBUT = firstHalf.reduce((sum, e) => sum + e.tearBreakUpTime, 0) / firstHalf.length;
    const secondAvgTBUT = secondHalf.reduce((sum, e) => sum + e.tearBreakUpTime, 0) / secondHalf.length;

    const firstAvgSchirmer = firstHalf.reduce((sum, e) => sum + e.schirmerTest, 0) / firstHalf.length;
    const secondAvgSchirmer = secondHalf.reduce((sum, e) => sum + e.schirmerTest, 0) / secondHalf.length;

    const tbutImprovement = secondAvgTBUT - firstAvgTBUT;
    const schirmerImprovement = secondAvgSchirmer - firstAvgSchirmer;

    const overallImprovement = (tbutImprovement + schirmerImprovement) / 2;

    if (overallImprovement >= 2) return 'improving';
    if (overallImprovement <= -2) return 'declining';
    return 'stable';
  }

  private identifyRiskFactors(
    examinations: DR1ExaminationData[], 
    avgTBUT: number, 
    avgSchirmer: number
  ): string[] {
    const riskFactors: string[] = [];

    if (avgTBUT < 5) {
      riskFactors.push('Consistently short tear break-up time');
    }

    if (avgSchirmer < 5) {
      riskFactors.push('Chronically low tear production');
    }

    // Check for poor tear quality across visits
    const poorQualityCount = examinations.filter(e => 
      e.tearQuality === 'poor' || e.tearQuality === 'very_poor'
    ).length;
    if (poorQualityCount > examinations.length * 0.5) {
      riskFactors.push('Persistent poor tear quality');
    }

    // Check for abnormal blinking patterns
    const abnormalBlinkingCount = examinations.filter(e => 
      ['incomplete', 'infrequent', 'irregular'].includes(e.blinkingPattern)
    ).length;
    if (abnormalBlinkingCount > examinations.length * 0.5) {
      riskFactors.push('Consistent abnormal blinking patterns');
    }

    return riskFactors;
  }

  private generateTearFilmRecommendations(
    severity: string,
    riskFactors: string[],
    examinations: DR1ExaminationData[],
    avgTBUT: number,
    avgSchirmer: number
  ): string[] {
    const recommendations: string[] = [];

    if (severity === 'severe') {
      recommendations.push('Immediate ophthalmologist referral for comprehensive dry eye management');
      recommendations.push('Consider prescription dry eye medications');
    } else if (severity === 'moderate') {
      recommendations.push('Implement comprehensive artificial tear regimen');
      recommendations.push('Consider punctal plugs or other tear retention methods');
    } else if (severity === 'mild') {
      recommendations.push('Regular use of preservative-free artificial tears');
      recommendations.push('Monitor for progression at next visit');
    }

    if (avgTBUT < 5) {
      recommendations.push('Focus on meibomian gland function and lid hygiene');
    }

    if (avgSchirmer < 5) {
      recommendations.push('Evaluate for systemic causes of aqueous deficiency');
    }

    if (riskFactors.includes('Consistent abnormal blinking patterns')) {
      recommendations.push('Patient education on proper blinking and eye lubrication habits');
    }

    return recommendations;
  }

  private compareTearQuality(quality1: string, quality2: string): 'improved' | 'worsened' | 'same' | 'not_comparable' {
    const qualityOrder = ['very_poor', 'poor', 'fair', 'good', 'excellent'];
    const score1 = qualityOrder.indexOf(quality1);
    const score2 = qualityOrder.indexOf(quality2);

    if (score1 === -1 || score2 === -1) return 'not_comparable';

    if (score2 > score1) return 'improved';
    if (score2 < score1) return 'worsened';
    return 'same';
  }

  private compareBlinkingPattern(pattern1: string, pattern2: string): 'improved' | 'worsened' | 'same' | 'not_comparable' {
    const normalPatterns = ['normal'];
    const improvedPatterns = ['normal', 'frequent'];
    const worsenedPatterns = ['incomplete', 'infrequent', 'irregular', 'forced'];

    if (normalPatterns.includes(pattern2) && !normalPatterns.includes(pattern1)) {
      return 'improved';
    }
    if (worsenedPatterns.includes(pattern2) && !worsenedPatterns.includes(pattern1)) {
      return 'worsened';
    }
    if (pattern1 === pattern2) return 'same';
    return 'not_comparable';
  }

  private assessClinicalSignificance(
    tbutChange: number,
    schirmerChange: number,
    meniscusChange: number,
    visit1: DR1ExaminationData,
    visit2: DR1ExaminationData
  ): string[] {
    const significance: string[] = [];

    if (Math.abs(tbutChange) >= 3) {
      significance.push(`Clinically significant TBUT change: ${tbutChange > 0 ? '+' : ''}${tbutChange.toFixed(1)}s`);
    }

    if (Math.abs(schirmerChange) >= 5) {
      significance.push(`Clinically significant Schirmer change: ${schirmerChange > 0 ? '+' : ''}${schirmerChange}mm`);
    }

    if (Math.abs(meniscusChange) >= 0.1) {
      significance.push(`Notable tear meniscus change: ${meniscusChange > 0 ? '+' : ''}${meniscusChange.toFixed(2)}mm`);
    }

    // Check for crossing severity thresholds
    const severity1 = this.assessDryEyeSeverity(visit1.tearBreakUpTime, visit1.schirmerTest, visit1.tearMeniscusHeight);
    const severity2 = this.assessDryEyeSeverity(visit2.tearBreakUpTime, visit2.schirmerTest, visit2.tearMeniscusHeight);

    if (severity1 !== severity2) {
      significance.push(`Dry eye severity changed from ${severity1} to ${severity2}`);
    }

    return significance;
  }

  private generateTreatmentGuidance(
    classification: string, 
    severity: string
  ): string[] {
    const guidance: string[] = [];

    switch (classification) {
      case 'aqueous_deficient':
        guidance.push('Consider cyclosporine or lifitegrast for tear production enhancement');
        guidance.push('Evaluate for autoimmune conditions (Sjögren\'s syndrome)');
        break;
      case 'evaporative':
        guidance.push('Focus on meibomian gland dysfunction treatment');
        guidance.push('Warm compresses and lid massage therapy');
        break;
      case 'mixed':
        guidance.push('Combination therapy addressing both aqueous and evaporative components');
        guidance.push('Consider both tear production enhancement and lipid layer stabilization');
        break;
      case 'severe':
        guidance.push('Multidisciplinary approach with ophthalmology consultation');
        guidance.push('Consider advanced treatments: scleral lenses, autologous serum tears');
        break;
    }

    if (severity === 'severe') {
      guidance.push('Close monitoring and frequent follow-up recommended');
    }

    return guidance;
  }
}