import { BaseExaminationRepository, BaseExaminationData } from './BaseExaminationRepository.js';
import { tableNames } from '../config/database.js';

/**
 * LensInspection examination data interface
 */
export interface LensInspectionExaminationData extends BaseExaminationData {
  lensInspectionId: string;
  
  // Lens Inspection Data
  lensDeposit: string; // レンズ汚れ
  lensScratchDamage: string; // レンズ傷・損傷
}

/**
 * Repository for LensInspection examination data
 * Handles lens condition assessment including deposits, scratches, and damage evaluation
 */
export class LensInspectionRepository extends BaseExaminationRepository<LensInspectionExaminationData> {
  constructor() {
    super(tableNames.lensInspection);
  }

  protected getExaminationIdFieldName(): string {
    return 'lensInspectionId';
  }

  protected getExaminationPrefix(): string {
    return 'lensinspection';
  }

  // Valid assessment values
  private readonly VALID_DEPOSIT_LEVELS = [
    'none', 'minimal', 'mild', 'moderate', 'heavy', 'severe'
  ];
  private readonly VALID_DAMAGE_LEVELS = [
    'none', 'minimal_surface', 'minor_scratches', 'moderate_damage', 
    'significant_damage', 'severe_damage', 'replacement_required'
  ];

  /**
   * Create lens inspection examination with validation
   */
  async createLensInspection(
    visitId: string,
    surveyId: string,
    patientId: string,
    clinicalStudyId: string,
    organizationId: string,
    eyeside: 'Right' | 'Left',
    data: Omit<LensInspectionExaminationData, keyof BaseExaminationData | 'lensInspectionId'>
  ): Promise<LensInspectionExaminationData> {
    // Validate lens inspection data
    this.validateLensInspectionData(data);

    return await this.createExamination(
      visitId, surveyId, patientId, clinicalStudyId, organizationId, eyeside, data
    );
  }

  /**
   * Update lens inspection examination
   */
  async updateLensInspection(
    visitId: string,
    lensInspectionId: string,
    updates: Partial<Omit<LensInspectionExaminationData, keyof BaseExaminationData | 'lensInspectionId'>>
  ): Promise<LensInspectionExaminationData> {
    // Validate updated data
    if (Object.keys(updates).length > 0) {
      this.validateLensInspectionData(updates as any);
    }

    return await this.updateExamination(visitId, lensInspectionId, updates);
  }

  /**
   * Get lens condition summary for survey
   */
  async getLensConditionSummary(surveyId: string, eyeside: 'Right' | 'Left'): Promise<{
    visitCount: number;
    conditionTrend: {
      deposits: 'improving' | 'stable' | 'worsening' | 'insufficient_data';
      damage: 'improving' | 'stable' | 'worsening' | 'insufficient_data';
      overall: 'improving' | 'stable' | 'worsening' | 'insufficient_data';
    };
    currentStatus: {
      depositLevel: string;
      damageLevel: string;
      replacementNeeded: boolean;
      warningLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
    };
    progressionAnalysis: {
      visitId: string;
      date: string;
      depositScore: number;
      damageScore: number;
      overallScore: number;
      notes: string[];
    }[];
    recommendations: string[];
    maintenanceGuidance: string[];
  }> {
    const examinations = await this.compareVisits(surveyId, eyeside);
    
    if (examinations.length === 0) {
      return this.getEmptyLensConditionSummary();
    }

    const latest = examinations[examinations.length - 1];

    // Analyze trends
    const conditionTrend = {
      deposits: this.analyzeDepositTrend(examinations),
      damage: this.analyzeDamageTrend(examinations),
      overall: this.analyzeOverallConditionTrend(examinations)
    };

    // Current status assessment
    const currentStatus = {
      depositLevel: latest.lensDeposit,
      damageLevel: latest.lensScratchDamage,
      replacementNeeded: this.isReplacementNeeded(latest),
      warningLevel: this.assessWarningLevel(latest)
    };

    // Generate progression analysis
    const progressionAnalysis = examinations.map(exam => ({
      visitId: exam.visitId,
      date: exam.createdAt,
      depositScore: this.getDepositScore(exam.lensDeposit),
      damageScore: this.getDamageScore(exam.lensScratchDamage),
      overallScore: this.getOverallConditionScore(exam),
      notes: this.generateProgressionNotes(exam)
    }));

    // Generate recommendations
    const recommendations = this.generateLensRecommendations(
      examinations, 
      currentStatus, 
      conditionTrend
    );

    // Generate maintenance guidance
    const maintenanceGuidance = this.generateMaintenanceGuidance(
      currentStatus,
      progressionAnalysis
    );

    return {
      visitCount: examinations.length,
      conditionTrend,
      currentStatus,
      progressionAnalysis,
      recommendations,
      maintenanceGuidance
    };
  }

  /**
   * Compare lens condition between visits
   */
  async compareLensConditionBetweenVisits(
    visitId1: string,
    visitId2: string,
    eyeside: 'Right' | 'Left'
  ): Promise<{
    visit1: LensInspectionExaminationData | null;
    visit2: LensInspectionExaminationData | null;
    changes: {
      depositChange: 'improved' | 'worsened' | 'same' | 'not_comparable';
      damageChange: 'improved' | 'worsened' | 'same' | 'not_comparable';
      overallCondition: 'improved' | 'worsened' | 'same' | 'not_comparable';
      replacementStatus: {
        before: boolean;
        after: boolean;
        statusChange: 'new_replacement_needed' | 'no_longer_needed' | 'still_needed' | 'still_good';
      };
    } | null;
    clinicalSignificance: string[];
    actionRequired: string[];
  }> {
    const [visit1Data, visit2Data] = await Promise.all([
      this.findByVisitAndEye(visitId1, eyeside),
      this.findByVisitAndEye(visitId2, eyeside)
    ]);

    let changes = null;
    let clinicalSignificance: string[] = [];
    let actionRequired: string[] = [];

    if (visit1Data && visit2Data) {
      const replacementBefore = this.isReplacementNeeded(visit1Data);
      const replacementAfter = this.isReplacementNeeded(visit2Data);

      let replacementStatusChange: string;
      if (!replacementBefore && replacementAfter) {
        replacementStatusChange = 'new_replacement_needed';
      } else if (replacementBefore && !replacementAfter) {
        replacementStatusChange = 'no_longer_needed';
      } else if (replacementBefore && replacementAfter) {
        replacementStatusChange = 'still_needed';
      } else {
        replacementStatusChange = 'still_good';
      }

      changes = {
        depositChange: this.compareConditionLevels(visit1Data.lensDeposit, visit2Data.lensDeposit, this.VALID_DEPOSIT_LEVELS),
        damageChange: this.compareConditionLevels(visit1Data.lensScratchDamage, visit2Data.lensScratchDamage, this.VALID_DAMAGE_LEVELS),
        overallCondition: this.compareOverallCondition(visit1Data, visit2Data),
        replacementStatus: {
          before: replacementBefore,
          after: replacementAfter,
          statusChange: replacementStatusChange as any
        }
      };

      // Assess clinical significance
      clinicalSignificance = this.assessClinicalSignificance(visit1Data, visit2Data, changes);

      // Determine required actions
      actionRequired = this.determineRequiredActions(visit1Data, visit2Data, changes);
    }

    return {
      visit1: visit1Data,
      visit2: visit2Data,
      changes,
      clinicalSignificance,
      actionRequired
    };
  }

  /**
   * Get lens replacement timeline prediction
   */
  async getLensReplacementPrediction(surveyId: string, eyeside: 'Right' | 'Left'): Promise<{
    currentCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'replace_immediately';
    estimatedReplacementTimeframe: 'immediate' | 'within_1_week' | 'within_2_weeks' | 'within_1_month' | 'more_than_1_month' | 'undetermined';
    riskFactors: string[];
    mainConcerns: string[];
    monitoringRecommendations: string[];
    replacementCriteria: {
      depositThreshold: boolean;
      damageThreshold: boolean;
      visualImpairment: boolean;
      comfortIssues: boolean;
    };
    predictionConfidence: 'high' | 'medium' | 'low';
  } | null> {
    const examinations = await this.compareVisits(surveyId, eyeside);
    
    if (examinations.length === 0) {
      return null;
    }

    const latest = examinations[examinations.length - 1];

    // Assess current condition
    const currentCondition = this.assessCurrentCondition(latest);

    // Predict replacement timeframe
    const estimatedReplacementTimeframe = this.predictReplacementTimeframe(
      examinations, 
      currentCondition
    );

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(examinations);

    // Identify main concerns
    const mainConcerns = this.identifyMainConcerns(latest, examinations);

    // Generate monitoring recommendations
    const monitoringRecommendations = this.generateMonitoringRecommendations(
      currentCondition, 
      estimatedReplacementTimeframe
    );

    // Assess replacement criteria
    const replacementCriteria = {
      depositThreshold: this.isDepositThresholdReached(latest),
      damageThreshold: this.isDamageThresholdReached(latest),
      visualImpairment: this.isVisualImpairmentRisk(latest),
      comfortIssues: this.isComfortIssueRisk(latest)
    };

    // Calculate prediction confidence
    const predictionConfidence = this.calculatePredictionConfidence(
      examinations.length,
      this.analyzeDataConsistency(examinations)
    );

    return {
      currentCondition,
      estimatedReplacementTimeframe,
      riskFactors,
      mainConcerns,
      monitoringRecommendations,
      replacementCriteria,
      predictionConfidence
    };
  }

  /**
   * Validate lens inspection data
   */
  private validateLensInspectionData(data: Partial<Omit<LensInspectionExaminationData, keyof BaseExaminationData | 'lensInspectionId'>>): void {
    // Validate lens deposit level
    if (data.lensDeposit !== undefined && !this.VALID_DEPOSIT_LEVELS.includes(data.lensDeposit)) {
      throw new Error(`lensDeposit must be one of: ${this.VALID_DEPOSIT_LEVELS.join(', ')}`);
    }

    // Validate lens scratch/damage level
    if (data.lensScratchDamage !== undefined && !this.VALID_DAMAGE_LEVELS.includes(data.lensScratchDamage)) {
      throw new Error(`lensScratchDamage must be one of: ${this.VALID_DAMAGE_LEVELS.join(', ')}`);
    }
  }

  private getEmptyLensConditionSummary() {
    return {
      visitCount: 0,
      conditionTrend: {
        deposits: 'insufficient_data' as const,
        damage: 'insufficient_data' as const,
        overall: 'insufficient_data' as const
      },
      currentStatus: {
        depositLevel: 'unknown',
        damageLevel: 'unknown',
        replacementNeeded: false,
        warningLevel: 'none' as const
      },
      progressionAnalysis: [],
      recommendations: ['No lens inspection data available for analysis'],
      maintenanceGuidance: []
    };
  }

  private analyzeDepositTrend(examinations: LensInspectionExaminationData[]): 'improving' | 'stable' | 'worsening' | 'insufficient_data' {
    if (examinations.length < 2) return 'insufficient_data';

    const scores = examinations.map(exam => this.getDepositScore(exam.lensDeposit));
    const firstAvg = scores.slice(0, Math.floor(scores.length / 2)).reduce((sum, score) => sum + score, 0) / Math.floor(scores.length / 2);
    const lastAvg = scores.slice(Math.ceil(scores.length / 2)).reduce((sum, score) => sum + score, 0) / Math.floor(scores.length / 2);

    const change = lastAvg - firstAvg;
    
    if (change <= -1) return 'improving';
    if (change >= 1) return 'worsening';
    return 'stable';
  }

  private analyzeDamageTrend(examinations: LensInspectionExaminationData[]): 'improving' | 'stable' | 'worsening' | 'insufficient_data' {
    if (examinations.length < 2) return 'insufficient_data';

    const scores = examinations.map(exam => this.getDamageScore(exam.lensScratchDamage));
    const firstAvg = scores.slice(0, Math.floor(scores.length / 2)).reduce((sum, score) => sum + score, 0) / Math.floor(scores.length / 2);
    const lastAvg = scores.slice(Math.ceil(scores.length / 2)).reduce((sum, score) => sum + score, 0) / Math.floor(scores.length / 2);

    const change = lastAvg - firstAvg;
    
    if (change <= -1) return 'improving';
    if (change >= 1) return 'worsening';
    return 'stable';
  }

  private analyzeOverallConditionTrend(examinations: LensInspectionExaminationData[]): 'improving' | 'stable' | 'worsening' | 'insufficient_data' {
    if (examinations.length < 2) return 'insufficient_data';

    const scores = examinations.map(exam => this.getOverallConditionScore(exam));
    const firstAvg = scores.slice(0, Math.floor(scores.length / 2)).reduce((sum, score) => sum + score, 0) / Math.floor(scores.length / 2);
    const lastAvg = scores.slice(Math.ceil(scores.length / 2)).reduce((sum, score) => sum + score, 0) / Math.floor(scores.length / 2);

    const change = lastAvg - firstAvg;
    
    if (change <= -1) return 'improving';
    if (change >= 1) return 'worsening';
    return 'stable';
  }

  private getDepositScore(depositLevel: string): number {
    const scores: Record<string, number> = {
      'none': 0, 'minimal': 1, 'mild': 2, 'moderate': 3, 'heavy': 4, 'severe': 5
    };
    return scores[depositLevel] || 0;
  }

  private getDamageScore(damageLevel: string): number {
    const scores: Record<string, number> = {
      'none': 0, 'minimal_surface': 1, 'minor_scratches': 2, 
      'moderate_damage': 3, 'significant_damage': 4, 'severe_damage': 5, 'replacement_required': 6
    };
    return scores[damageLevel] || 0;
  }

  private getOverallConditionScore(exam: LensInspectionExaminationData): number {
    return this.getDepositScore(exam.lensDeposit) + this.getDamageScore(exam.lensScratchDamage);
  }

  private isReplacementNeeded(exam: LensInspectionExaminationData): boolean {
    const depositScore = this.getDepositScore(exam.lensDeposit);
    const damageScore = this.getDamageScore(exam.lensScratchDamage);
    
    return depositScore >= 4 || damageScore >= 4 || exam.lensScratchDamage === 'replacement_required';
  }

  private assessWarningLevel(exam: LensInspectionExaminationData): 'none' | 'low' | 'medium' | 'high' | 'critical' {
    const overallScore = this.getOverallConditionScore(exam);
    
    if (overallScore >= 8) return 'critical';
    if (overallScore >= 6) return 'high';
    if (overallScore >= 4) return 'medium';
    if (overallScore >= 2) return 'low';
    return 'none';
  }

  private generateProgressionNotes(exam: LensInspectionExaminationData): string[] {
    const notes: string[] = [];
    
    if (this.getDepositScore(exam.lensDeposit) >= 3) {
      notes.push(`Significant deposit accumulation: ${exam.lensDeposit}`);
    }
    
    if (this.getDamageScore(exam.lensScratchDamage) >= 3) {
      notes.push(`Notable lens damage: ${exam.lensScratchDamage}`);
    }
    
    if (this.isReplacementNeeded(exam)) {
      notes.push('Lens replacement recommended');
    }
    
    return notes;
  }

  private generateLensRecommendations(
    examinations: LensInspectionExaminationData[],
    currentStatus: any,
    trends: any
  ): string[] {
    const recommendations: string[] = [];
    
    if (currentStatus.replacementNeeded) {
      recommendations.push('Immediate lens replacement required');
    } else if (currentStatus.warningLevel === 'high') {
      recommendations.push('Schedule lens replacement within 1 week');
    } else if (currentStatus.warningLevel === 'medium') {
      recommendations.push('Consider lens replacement within 2 weeks');
    }
    
    if (trends.deposits === 'worsening') {
      recommendations.push('Review cleaning regimen and technique');
      recommendations.push('Consider more frequent lens replacement schedule');
    }
    
    if (trends.damage === 'worsening') {
      recommendations.push('Evaluate lens handling practices');
      recommendations.push('Review insertion and removal technique');
    }
    
    return recommendations;
  }

  private generateMaintenanceGuidance(currentStatus: any, progressionAnalysis: any[]): string[] {
    const guidance: string[] = [];
    
    if (currentStatus.depositLevel !== 'none') {
      guidance.push('Implement enhanced cleaning protocol');
      guidance.push('Use protein removal treatments as directed');
    }
    
    if (currentStatus.damageLevel !== 'none') {
      guidance.push('Review proper lens handling techniques');
      guidance.push('Ensure fingernails are trimmed and smooth');
    }
    
    guidance.push('Regular lens inspection during wear');
    guidance.push('Follow prescribed replacement schedule strictly');
    
    return guidance;
  }

  private compareConditionLevels(
    level1: string, 
    level2: string, 
    validLevels: string[]
  ): 'improved' | 'worsened' | 'same' | 'not_comparable' {
    const index1 = validLevels.indexOf(level1);
    const index2 = validLevels.indexOf(level2);
    
    if (index1 === -1 || index2 === -1) return 'not_comparable';
    
    if (index2 < index1) return 'improved';
    if (index2 > index1) return 'worsened';
    return 'same';
  }

  private compareOverallCondition(
    exam1: LensInspectionExaminationData,
    exam2: LensInspectionExaminationData
  ): 'improved' | 'worsened' | 'same' | 'not_comparable' {
    const score1 = this.getOverallConditionScore(exam1);
    const score2 = this.getOverallConditionScore(exam2);
    
    if (score2 < score1) return 'improved';
    if (score2 > score1) return 'worsened';
    return 'same';
  }

  private assessClinicalSignificance(
    visit1: LensInspectionExaminationData,
    visit2: LensInspectionExaminationData,
    changes: any
  ): string[] {
    const significance: string[] = [];
    
    if (changes.replacementStatus.statusChange === 'new_replacement_needed') {
      significance.push('Lens condition has deteriorated to replacement threshold');
    }
    
    if (changes.depositChange === 'worsened') {
      significance.push('Significant increase in lens deposits noted');
    }
    
    if (changes.damageChange === 'worsened') {
      significance.push('Progressive lens damage identified');
    }
    
    return significance;
  }

  private determineRequiredActions(
    visit1: LensInspectionExaminationData,
    visit2: LensInspectionExaminationData,
    changes: any
  ): string[] {
    const actions: string[] = [];
    
    if (changes.replacementStatus.statusChange === 'new_replacement_needed') {
      actions.push('Schedule immediate lens replacement');
      actions.push('Review patient compliance and handling technique');
    }
    
    if (changes.depositChange === 'worsened') {
      actions.push('Evaluate cleaning protocol effectiveness');
    }
    
    if (changes.damageChange === 'worsened') {
      actions.push('Patient education on proper lens care');
    }
    
    return actions;
  }

  // Additional helper methods for replacement prediction
  private assessCurrentCondition(exam: LensInspectionExaminationData): 'excellent' | 'good' | 'fair' | 'poor' | 'replace_immediately' {
    const score = this.getOverallConditionScore(exam);
    
    if (score === 0) return 'excellent';
    if (score <= 2) return 'good';
    if (score <= 4) return 'fair';
    if (score <= 6) return 'poor';
    return 'replace_immediately';
  }

  private predictReplacementTimeframe(
    examinations: LensInspectionExaminationData[],
    currentCondition: string
  ): 'immediate' | 'within_1_week' | 'within_2_weeks' | 'within_1_month' | 'more_than_1_month' | 'undetermined' {
    if (currentCondition === 'replace_immediately') return 'immediate';
    if (currentCondition === 'poor') return 'within_1_week';
    if (currentCondition === 'fair') return 'within_2_weeks';
    if (currentCondition === 'good') return 'within_1_month';
    return 'more_than_1_month';
  }

  private identifyRiskFactors(examinations: LensInspectionExaminationData[]): string[] {
    const riskFactors: string[] = [];
    
    const rapidDeteriorationVisits = examinations.filter((exam, index) => {
      if (index === 0) return false;
      const prev = examinations[index - 1];
      return this.getOverallConditionScore(exam) - this.getOverallConditionScore(prev) >= 2;
    });
    
    if (rapidDeteriorationVisits.length > 0) {
      riskFactors.push('History of rapid lens condition deterioration');
    }
    
    return riskFactors;
  }

  private identifyMainConcerns(latest: LensInspectionExaminationData, examinations: LensInspectionExaminationData[]): string[] {
    const concerns: string[] = [];
    
    if (this.getDepositScore(latest.lensDeposit) >= 3) {
      concerns.push('Significant protein/lipid deposit accumulation');
    }
    
    if (this.getDamageScore(latest.lensScratchDamage) >= 3) {
      concerns.push('Progressive lens surface damage');
    }
    
    return concerns;
  }

  private generateMonitoringRecommendations(currentCondition: string, timeframe: string): string[] {
    const recommendations: string[] = [];
    
    if (currentCondition === 'poor' || timeframe === 'immediate') {
      recommendations.push('Daily lens inspection required');
    } else {
      recommendations.push('Regular lens condition monitoring');
    }
    
    recommendations.push('Document any changes in comfort or vision quality');
    
    return recommendations;
  }

  private isDepositThresholdReached(exam: LensInspectionExaminationData): boolean {
    return this.getDepositScore(exam.lensDeposit) >= 4;
  }

  private isDamageThresholdReached(exam: LensInspectionExaminationData): boolean {
    return this.getDamageScore(exam.lensScratchDamage) >= 4;
  }

  private isVisualImpairmentRisk(exam: LensInspectionExaminationData): boolean {
    return this.getOverallConditionScore(exam) >= 6;
  }

  private isComfortIssueRisk(exam: LensInspectionExaminationData): boolean {
    return this.getDamageScore(exam.lensScratchDamage) >= 3;
  }

  private calculatePredictionConfidence(visitCount: number, dataConsistency: number): 'high' | 'medium' | 'low' {
    if (visitCount >= 4 && dataConsistency >= 0.8) return 'high';
    if (visitCount >= 2 && dataConsistency >= 0.6) return 'medium';
    return 'low';
  }

  private analyzeDataConsistency(examinations: LensInspectionExaminationData[]): number {
    if (examinations.length < 2) return 0;
    
    let consistencyScore = 0;
    for (let i = 1; i < examinations.length; i++) {
      const prevScore = this.getOverallConditionScore(examinations[i - 1]);
      const currScore = this.getOverallConditionScore(examinations[i]);
      
      // Expect gradual deterioration or stability
      if (currScore >= prevScore) {
        consistencyScore++;
      }
    }
    
    return consistencyScore / (examinations.length - 1);
  }
}