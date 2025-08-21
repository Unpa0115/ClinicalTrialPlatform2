import { BaseExaminationRepository, BaseExaminationData } from './BaseExaminationRepository.js';
import { tableNames } from '../config/database.js';

/**
 * LensFluidSurfaceAssessment examination data interface
 */
export interface LensFluidSurfaceAssessmentExaminationData extends BaseExaminationData {
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

/**
 * Repository for LensFluidSurfaceAssessment examination data
 * Handles lens fitting assessment and tear film wettability analysis
 */
export class LensFluidSurfaceAssessmentRepository extends BaseExaminationRepository<LensFluidSurfaceAssessmentExaminationData> {
  constructor() {
    super(tableNames.lensFluidSurfaceAssessment);
  }

  protected getExaminationIdFieldName(): string {
    return 'fittingId';
  }

  protected getExaminationPrefix(): string {
    return 'fitting';
  }

  // Valid assessment values
  private readonly VALID_TIMING = ['initial', 'after_5min', 'after_15min', 'after_30min', 'end_of_day'];
  private readonly VALID_POSITIONS = ['optimal', 'slightly_high', 'slightly_low', 'high', 'low', 'decentered'];
  private readonly VALID_PATTERNS = ['ideal', 'acceptable', 'tight', 'loose', 'irregular', 'unstable'];
  private readonly VALID_WETTABILITY = ['excellent', 'good', 'fair', 'poor', 'very_poor'];
  private readonly VALID_DEPOSITS = ['none', 'minimal', 'mild', 'moderate', 'heavy'];
  private readonly VALID_DRYNESS = ['none', 'minimal', 'mild', 'moderate', 'severe'];

  /**
   * Create lens fluid surface assessment with validation
   */
  async createLensFluidSurfaceAssessment(
    visitId: string,
    surveyId: string,
    patientId: string,
    clinicalStudyId: string,
    organizationId: string,
    eyeside: 'Right' | 'Left',
    data: Omit<LensFluidSurfaceAssessmentExaminationData, keyof BaseExaminationData | 'fittingId'>
  ): Promise<LensFluidSurfaceAssessmentExaminationData> {
    // Validate assessment data
    this.validateFittingData(data);

    return await this.createExamination(
      visitId, surveyId, patientId, clinicalStudyId, organizationId, eyeside, data
    );
  }

  /**
   * Update lens fluid surface assessment
   */
  async updateLensFluidSurfaceAssessment(
    visitId: string,
    fittingId: string,
    updates: Partial<Omit<LensFluidSurfaceAssessmentExaminationData, keyof BaseExaminationData | 'fittingId'>>
  ): Promise<LensFluidSurfaceAssessmentExaminationData> {
    // Validate updated data
    if (Object.keys(updates).length > 0) {
      this.validateFittingData(updates as any);
    }

    return await this.updateExamination(visitId, fittingId, updates);
  }

  /**
   * Get fitting assessment summary for survey
   */
  async getFittingSummary(surveyId: string, eyeside: 'Right' | 'Left'): Promise<{
    visitCount: number;
    averageLensMovement: number;
    fittingTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
    commonIssues: string[];
    face2Progression: {
      visitId: string;
      date: string;
      x: number;
      y: number;
      distance: number; // Distance from optimal center (0,0)
    }[];
    recommendations: string[];
  }> {
    const examinations = await this.compareVisits(surveyId, eyeside);
    
    if (examinations.length === 0) {
      return this.getEmptyFittingSummary();
    }

    // Calculate average lens movement
    const totalMovement = examinations.reduce((sum, exam) => sum + exam.lensMovement, 0);
    const averageLensMovement = totalMovement / examinations.length;

    // Analyze FACE2 progression
    const face2Progression = examinations.map(exam => ({
      visitId: exam.visitId,
      date: exam.createdAt,
      x: exam.face2_X,
      y: exam.face2_Y,
      distance: Math.sqrt(exam.face2_X * exam.face2_X + exam.face2_Y * exam.face2_Y)
    }));

    // Identify common issues
    const commonIssues = this.identifyCommonIssues(examinations);

    // Determine fitting trend
    const fittingTrend = this.analyzeFittingTrend(examinations);

    // Generate recommendations
    const recommendations = this.generateFittingRecommendations(examinations, averageLensMovement, face2Progression);

    return {
      visitCount: examinations.length,
      averageLensMovement: Math.round(averageLensMovement * 100) / 100,
      fittingTrend,
      commonIssues,
      face2Progression,
      recommendations
    };
  }

  /**
   * Compare lens movement between visits
   */
  async compareLensMovement(
    visitId1: string,
    visitId2: string,
    eyeside: 'Right' | 'Left'
  ): Promise<{
    visit1: LensFluidSurfaceAssessmentExaminationData | null;
    visit2: LensFluidSurfaceAssessmentExaminationData | null;
    movementChange: number | null;
    fittingImprovement: 'improved' | 'worsened' | 'stable' | 'not_comparable';
    face2Change: {
      xChange: number;
      yChange: number;
      distanceChange: number;
    } | null;
  }> {
    const [visit1Data, visit2Data] = await Promise.all([
      this.findByVisitAndEye(visitId1, eyeside),
      this.findByVisitAndEye(visitId2, eyeside)
    ]);

    let movementChange = null;
    let fittingImprovement: 'improved' | 'worsened' | 'stable' | 'not_comparable' = 'not_comparable';
    let face2Change = null;

    if (visit1Data && visit2Data) {
      movementChange = visit2Data.lensMovement - visit1Data.lensMovement;
      fittingImprovement = this.compareFittingQuality(visit1Data, visit2Data);
      
      const distance1 = Math.sqrt(visit1Data.face2_X * visit1Data.face2_X + visit1Data.face2_Y * visit1Data.face2_Y);
      const distance2 = Math.sqrt(visit2Data.face2_X * visit2Data.face2_X + visit2Data.face2_Y * visit2Data.face2_Y);
      
      face2Change = {
        xChange: visit2Data.face2_X - visit1Data.face2_X,
        yChange: visit2Data.face2_Y - visit1Data.face2_Y,
        distanceChange: distance2 - distance1
      };
    }

    return {
      visit1: visit1Data,
      visit2: visit2Data,
      movementChange,
      fittingImprovement,
      face2Change
    };
  }

  /**
   * Get FACE2 coordinates analysis
   */
  async getFACE2Analysis(surveyId: string, eyeside: 'Right' | 'Left'): Promise<{
    centeringStability: 'excellent' | 'good' | 'fair' | 'poor';
    averageDistance: number;
    maxDeviation: number;
    trendDirection: 'improving' | 'stable' | 'declining' | 'insufficient_data';
    quadrantDistribution: {
      q1: number; // Upper right (+X, +Y)
      q2: number; // Upper left (-X, +Y)
      q3: number; // Lower left (-X, -Y)
      q4: number; // Lower right (+X, -Y)
    };
    recommendations: string[];
  }> {
    const examinations = await this.compareVisits(surveyId, eyeside);
    
    if (examinations.length === 0) {
      return {
        centeringStability: 'poor',
        averageDistance: 0,
        maxDeviation: 0,
        trendDirection: 'insufficient_data',
        quadrantDistribution: { q1: 0, q2: 0, q3: 0, q4: 0 },
        recommendations: ['No FACE2 data available for analysis']
      };
    }

    // Calculate distances from center (0,0)
    const distances = examinations.map(exam => 
      Math.sqrt(exam.face2_X * exam.face2_X + exam.face2_Y * exam.face2_Y)
    );

    const averageDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const maxDeviation = Math.max(...distances);

    // Determine centering stability
    let centeringStability: 'excellent' | 'good' | 'fair' | 'poor';
    if (averageDistance <= 0.5) centeringStability = 'excellent';
    else if (averageDistance <= 1.0) centeringStability = 'good';
    else if (averageDistance <= 2.0) centeringStability = 'fair';
    else centeringStability = 'poor';

    // Analyze quadrant distribution
    const quadrantDistribution = examinations.reduce((acc, exam) => {
      if (exam.face2_X >= 0 && exam.face2_Y >= 0) acc.q1++;
      else if (exam.face2_X < 0 && exam.face2_Y >= 0) acc.q2++;
      else if (exam.face2_X < 0 && exam.face2_Y < 0) acc.q3++;
      else acc.q4++;
      return acc;
    }, { q1: 0, q2: 0, q3: 0, q4: 0 });

    // Determine trend direction
    const trendDirection = examinations.length < 2 ? 'insufficient_data' : 
      this.analyzeFACE2Trend(examinations);

    // Generate recommendations
    const recommendations = this.generateFACE2Recommendations(
      centeringStability, 
      averageDistance, 
      maxDeviation, 
      quadrantDistribution, 
      examinations.length
    );

    return {
      centeringStability,
      averageDistance: Math.round(averageDistance * 100) / 100,
      maxDeviation: Math.round(maxDeviation * 100) / 100,
      trendDirection,
      quadrantDistribution,
      recommendations
    };
  }

  /**
   * Validate fitting assessment data
   */
  private validateFittingData(data: Partial<Omit<LensFluidSurfaceAssessmentExaminationData, keyof BaseExaminationData | 'fittingId'>>): void {
    // Validate timing
    if (data.timing !== undefined && !this.VALID_TIMING.includes(data.timing)) {
      throw new Error(`timing must be one of: ${this.VALID_TIMING.join(', ')}`);
    }

    // Validate lens movement (typically 0-5mm)
    if (data.lensMovement !== undefined && (data.lensMovement < 0 || data.lensMovement > 5)) {
      throw new Error('lensMovement must be between 0 and 5mm');
    }

    // Validate lens position
    if (data.lensPosition !== undefined && !this.VALID_POSITIONS.includes(data.lensPosition)) {
      throw new Error(`lensPosition must be one of: ${this.VALID_POSITIONS.join(', ')}`);
    }

    // Validate fitting pattern
    if (data.fittingPattern !== undefined && !this.VALID_PATTERNS.includes(data.fittingPattern)) {
      throw new Error(`fittingPattern must be one of: ${this.VALID_PATTERNS.join(', ')}`);
    }

    // Validate lens wettability
    if (data.lensWettability !== undefined && !this.VALID_WETTABILITY.includes(data.lensWettability)) {
      throw new Error(`lensWettability must be one of: ${this.VALID_WETTABILITY.join(', ')}`);
    }

    // Validate surface deposit
    if (data.surfaceDeposit !== undefined && !this.VALID_DEPOSITS.includes(data.surfaceDeposit)) {
      throw new Error(`surfaceDeposit must be one of: ${this.VALID_DEPOSITS.join(', ')}`);
    }

    // Validate lens dryness
    if (data.lensDryness !== undefined && !this.VALID_DRYNESS.includes(data.lensDryness)) {
      throw new Error(`lensDryness must be one of: ${this.VALID_DRYNESS.join(', ')}`);
    }

    // Validate FACE2 coordinates (typically -5 to +5)
    if (data.face2_X !== undefined && (data.face2_X < -5 || data.face2_X > 5)) {
      throw new Error('face2_X must be between -5 and +5');
    }
    if (data.face2_Y !== undefined && (data.face2_Y < -5 || data.face2_Y > 5)) {
      throw new Error('face2_Y must be between -5 and +5');
    }
  }

  private getEmptyFittingSummary() {
    return {
      visitCount: 0,
      averageLensMovement: 0,
      fittingTrend: 'insufficient_data' as const,
      commonIssues: [],
      face2Progression: [],
      recommendations: ['No fitting data available for analysis']
    };
  }

  private identifyCommonIssues(examinations: LensFluidSurfaceAssessmentExaminationData[]): string[] {
    const issues: string[] = [];
    
    // Check for consistent positioning issues
    const positionIssues = examinations.filter(exam => 
      !['optimal', 'acceptable'].includes(exam.lensPosition)
    );
    if (positionIssues.length > examinations.length * 0.5) {
      issues.push('Consistent lens positioning problems detected');
    }

    // Check for wettability issues
    const wettabilityIssues = examinations.filter(exam => 
      ['poor', 'very_poor'].includes(exam.lensWettability)
    );
    if (wettabilityIssues.length > examinations.length * 0.3) {
      issues.push('Lens wettability concerns identified');
    }

    // Check for surface deposit accumulation
    const depositIssues = examinations.filter(exam => 
      ['moderate', 'heavy'].includes(exam.surfaceDeposit)
    );
    if (depositIssues.length > examinations.length * 0.3) {
      issues.push('Surface deposit accumulation patterns noted');
    }

    return issues;
  }

  private analyzeFittingTrend(examinations: LensFluidSurfaceAssessmentExaminationData[]): 'improving' | 'stable' | 'declining' | 'insufficient_data' {
    if (examinations.length < 2) return 'insufficient_data';

    const first = examinations[0];
    const last = examinations[examinations.length - 1];

    const scores = examinations.map(exam => this.calculateFittingScore(exam));
    const firstScore = scores[0];
    const lastScore = scores[scores.length - 1];

    const scoreDifference = lastScore - firstScore;

    if (scoreDifference >= 2) return 'improving';
    if (scoreDifference <= -2) return 'declining';
    return 'stable';
  }

  private calculateFittingScore(exam: LensFluidSurfaceAssessmentExaminationData): number {
    let score = 0;

    // Position scoring
    const positionScores: Record<string, number> = {
      'optimal': 5, 'acceptable': 4, 'slightly_high': 3, 'slightly_low': 3,
      'high': 2, 'low': 2, 'decentered': 1
    };
    score += positionScores[exam.lensPosition] || 0;

    // Pattern scoring
    const patternScores: Record<string, number> = {
      'ideal': 5, 'acceptable': 4, 'tight': 2, 'loose': 2, 'irregular': 1, 'unstable': 0
    };
    score += patternScores[exam.fittingPattern] || 0;

    // Wettability scoring
    const wettabilityScores: Record<string, number> = {
      'excellent': 5, 'good': 4, 'fair': 3, 'poor': 2, 'very_poor': 1
    };
    score += wettabilityScores[exam.lensWettability] || 0;

    return score;
  }

  private compareFittingQuality(
    visit1: LensFluidSurfaceAssessmentExaminationData,
    visit2: LensFluidSurfaceAssessmentExaminationData
  ): 'improved' | 'worsened' | 'stable' | 'not_comparable' {
    const score1 = this.calculateFittingScore(visit1);
    const score2 = this.calculateFittingScore(visit2);

    const scoreDifference = score2 - score1;

    if (scoreDifference >= 2) return 'improved';
    if (scoreDifference <= -2) return 'worsened';
    return 'stable';
  }

  private analyzeFACE2Trend(examinations: LensFluidSurfaceAssessmentExaminationData[]): 'improving' | 'stable' | 'declining' {
    const distances = examinations.map(exam => 
      Math.sqrt(exam.face2_X * exam.face2_X + exam.face2_Y * exam.face2_Y)
    );

    const firstHalf = distances.slice(0, Math.floor(distances.length / 2));
    const secondHalf = distances.slice(Math.ceil(distances.length / 2));

    const firstAvg = firstHalf.reduce((sum, d) => sum + d, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d, 0) / secondHalf.length;

    const improvement = firstAvg - secondAvg;

    if (improvement >= 0.5) return 'improving';
    if (improvement <= -0.5) return 'declining';
    return 'stable';
  }

  private generateFittingRecommendations(
    examinations: LensFluidSurfaceAssessmentExaminationData[],
    averageMovement: number,
    face2Progression: any[]
  ): string[] {
    const recommendations: string[] = [];

    if (averageMovement > 2.0) {
      recommendations.push('Consider a tighter fitting lens to reduce excessive movement');
    } else if (averageMovement < 0.5) {
      recommendations.push('Consider a looser fitting lens to improve comfort and tear exchange');
    }

    const recentExam = examinations[examinations.length - 1];
    if (recentExam.lensWettability === 'poor' || recentExam.lensWettability === 'very_poor') {
      recommendations.push('Address lens wettability issues - consider surface treatments or different lens material');
    }

    if (recentExam.surfaceDeposit === 'moderate' || recentExam.surfaceDeposit === 'heavy') {
      recommendations.push('Implement enhanced cleaning regimen or consider more frequent lens replacement');
    }

    const avgDistance = face2Progression.reduce((sum, p) => sum + p.distance, 0) / face2Progression.length;
    if (avgDistance > 2.0) {
      recommendations.push('FACE2 analysis indicates centering issues - evaluate lens design and fit');
    }

    return recommendations;
  }

  private generateFACE2Recommendations(
    stability: string,
    avgDistance: number,
    maxDeviation: number,
    quadrants: any,
    visitCount: number
  ): string[] {
    const recommendations: string[] = [];

    if (stability === 'poor') {
      recommendations.push('Lens centering requires immediate attention - consider alternative lens design');
    } else if (stability === 'fair') {
      recommendations.push('Monitor lens centering closely and consider fit adjustments if pattern continues');
    }

    if (maxDeviation > 3.0) {
      recommendations.push('Significant lens decentration episodes detected - evaluate patient handling and insertion technique');
    }

    // Check for consistent directional bias
    const totalVisits = quadrants.q1 + quadrants.q2 + quadrants.q3 + quadrants.q4;
    if (totalVisits > 0) {
      const maxQuadrant = Math.max(quadrants.q1, quadrants.q2, quadrants.q3, quadrants.q4);
      if (maxQuadrant > totalVisits * 0.6) {
        recommendations.push('Consistent directional bias detected - evaluate lid tension and lens design asymmetries');
      }
    }

    if (visitCount < 3) {
      recommendations.push('Collect additional FACE2 data points for more comprehensive centering analysis');
    }

    return recommendations;
  }
}