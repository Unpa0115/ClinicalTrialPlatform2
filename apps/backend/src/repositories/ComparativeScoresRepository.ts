import { BaseExaminationRepository, BaseExaminationData } from './BaseExaminationRepository.js';
import { tableNames } from '../config/database.js';

/**
 * ComparativeScores examination data interface
 */
export interface ComparativeScoresExaminationData extends BaseExaminationData {
  comparativeScoresId: string;
  
  // Comparative Assessment Data
  comfort: string;
  comfortReason: string;
  dryness: string;
  drynessReason: string;
  
  // Visual Performance
  vp_DigitalDevice: string;
  vpReason_DigitalDevice: string;
  vp_DayTime: string;
  vpReason_DayTime: string;
  vp_EndOfDay: string;
  vpReason_EndOfDay: string;
  vp_Glare: string;
  vpReason_Glare: string;
  vp_Halo: string;
  vpReason_Halo: string;
  vp_StarBurst: string;
  vpReason_StarBurst: string;
  
  // Overall Assessment
  eyeStrain: string;
  eyeStrainReason: string;
  totalSatisfaction: string;
  totalSatisfactionReason: string;
}

/**
 * Repository for ComparativeScores examination data
 * Handles comparative assessments with detailed reason text fields
 */
export class ComparativeScoresRepository extends BaseExaminationRepository<ComparativeScoresExaminationData> {
  constructor() {
    super(tableNames.comparativeScores);
  }

  protected getExaminationIdFieldName(): string {
    return 'comparativeScoresId';
  }

  protected getExaminationPrefix(): string {
    return 'comparative';
  }

  // Valid assessment values
  private readonly VALID_ASSESSMENTS = [
    'much_better', 'better', 'same', 'worse', 'much_worse', 'not_applicable'
  ];

  /**
   * Create comparative scores examination with validation
   */
  async createComparativeScores(
    visitId: string,
    surveyId: string,
    patientId: string,
    clinicalStudyId: string,
    organizationId: string,
    eyeside: 'Right' | 'Left',
    data: Omit<ComparativeScoresExaminationData, keyof BaseExaminationData | 'comparativeScoresId'>
  ): Promise<ComparativeScoresExaminationData> {
    // Validate assessment values
    this.validateComparativeData(data);

    return await this.createExamination(
      visitId, surveyId, patientId, clinicalStudyId, organizationId, eyeside, data
    );
  }

  /**
   * Update comparative scores examination
   */
  async updateComparativeScores(
    visitId: string,
    comparativeScoresId: string,
    updates: Partial<Omit<ComparativeScoresExaminationData, keyof BaseExaminationData | 'comparativeScoresId'>>
  ): Promise<ComparativeScoresExaminationData> {
    // Validate updated data
    if (Object.keys(updates).length > 0) {
      this.validateComparativeData(updates as any);
    }

    return await this.updateExamination(visitId, comparativeScoresId, updates);
  }

  /**
   * Get comparative scores summary for survey
   */
  async getComparativeScoresSummary(surveyId: string, eyeside: 'Right' | 'Left'): Promise<{
    visitCount: number;
    improvements: {
      comfort: number;
      dryness: number;
      digitalDevice: number;
      dayTime: number;
      endOfDay: number;
      glare: number;
      halo: number;
      starBurst: number;
      eyeStrain: number;
      totalSatisfaction: number;
    };
    deteriorations: {
      comfort: number;
      dryness: number;
      digitalDevice: number;
      dayTime: number;
      endOfDay: number;
      glare: number;
      halo: number;
      starBurst: number;
      eyeStrain: number;
      totalSatisfaction: number;
    };
    mostCommonReasons: {
      improvement: string[];
      deterioration: string[];
    };
  }> {
    const examinations = await this.findBySurveyAndEye(surveyId, eyeside);
    
    if (examinations.length === 0) {
      return this.getEmptyScoresSummary();
    }

    const improvements = {
      comfort: 0, dryness: 0, digitalDevice: 0, dayTime: 0, endOfDay: 0,
      glare: 0, halo: 0, starBurst: 0, eyeStrain: 0, totalSatisfaction: 0
    };

    const deteriorations = {
      comfort: 0, dryness: 0, digitalDevice: 0, dayTime: 0, endOfDay: 0,
      glare: 0, halo: 0, starBurst: 0, eyeStrain: 0, totalSatisfaction: 0
    };

    const improvementReasons: string[] = [];
    const deteriorationReasons: string[] = [];

    examinations.forEach(exam => {
      // Count improvements and deteriorations
      if (this.isImprovement(exam.comfort)) {
        improvements.comfort++;
        if (exam.comfortReason.trim()) improvementReasons.push(exam.comfortReason);
      } else if (this.isDeteriorationn(exam.comfort)) {
        deteriorations.comfort++;
        if (exam.comfortReason.trim()) deteriorationReasons.push(exam.comfortReason);
      }

      if (this.isImprovement(exam.dryness)) {
        improvements.dryness++;
        if (exam.drynessReason.trim()) improvementReasons.push(exam.drynessReason);
      } else if (this.isDeteriorationn(exam.dryness)) {
        deteriorations.dryness++;
        if (exam.drynessReason.trim()) deteriorationReasons.push(exam.drynessReason);
      }

      // Continue for all assessment fields...
      this.countAssessmentChanges(exam, improvements, deteriorations, improvementReasons, deteriorationReasons);
    });

    return {
      visitCount: examinations.length,
      improvements,
      deteriorations,
      mostCommonReasons: {
        improvement: this.getMostCommonReasons(improvementReasons),
        deterioration: this.getMostCommonReasons(deteriorationReasons)
      }
    };
  }

  /**
   * Compare comparative scores between visits
   */
  async compareComparativeScoresBetweenVisits(
    visitId1: string,
    visitId2: string,
    eyeside: 'Right' | 'Left'
  ): Promise<{
    visit1: ComparativeScoresExaminationData | null;
    visit2: ComparativeScoresExaminationData | null;
    changes: {
      comfort: 'improved' | 'deteriorated' | 'same' | 'not_comparable';
      dryness: 'improved' | 'deteriorated' | 'same' | 'not_comparable';
      visualPerformance: 'improved' | 'deteriorated' | 'same' | 'not_comparable';
      eyeStrain: 'improved' | 'deteriorated' | 'same' | 'not_comparable';
      totalSatisfaction: 'improved' | 'deteriorated' | 'same' | 'not_comparable';
    } | null;
  }> {
    const [visit1Data, visit2Data] = await Promise.all([
      this.findByVisitAndEye(visitId1, eyeside),
      this.findByVisitAndEye(visitId2, eyeside)
    ]);

    let changes = null;
    if (visit1Data && visit2Data) {
      changes = {
        comfort: this.compareAssessments(visit1Data.comfort, visit2Data.comfort),
        dryness: this.compareAssessments(visit1Data.dryness, visit2Data.dryness),
        visualPerformance: this.compareVisualPerformance(visit1Data, visit2Data),
        eyeStrain: this.compareAssessments(visit1Data.eyeStrain, visit2Data.eyeStrain),
        totalSatisfaction: this.compareAssessments(visit1Data.totalSatisfaction, visit2Data.totalSatisfaction),
      };
    }

    return {
      visit1: visit1Data,
      visit2: visit2Data,
      changes,
    };
  }

  /**
   * Get trend analysis for comparative scores
   */
  async getTrendAnalysis(surveyId: string, eyeside: 'Right' | 'Left'): Promise<{
    overallTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
    keyFindings: string[];
    recommendations: string[];
    concernAreas: string[];
  }> {
    const examinations = await this.compareVisits(surveyId, eyeside);
    
    if (examinations.length < 2) {
      return {
        overallTrend: 'insufficient_data',
        keyFindings: ['Insufficient data for trend analysis'],
        recommendations: ['Complete additional visits for comprehensive trend analysis'],
        concernAreas: []
      };
    }

    const keyFindings: string[] = [];
    const recommendations: string[] = [];
    const concernAreas: string[] = [];

    // Analyze trends across visits
    const first = examinations[0];
    const last = examinations[examinations.length - 1];

    // Compare first and last assessments
    const changes = {
      comfort: this.compareAssessments(first.comfort, last.comfort),
      dryness: this.compareAssessments(first.dryness, last.dryness),
      eyeStrain: this.compareAssessments(first.eyeStrain, last.eyeStrain),
      totalSatisfaction: this.compareAssessments(first.totalSatisfaction, last.totalSatisfaction),
    };

    // Generate findings based on changes
    Object.entries(changes).forEach(([aspect, change]) => {
      if (change === 'improved') {
        keyFindings.push(`${aspect} has improved over the study period`);
      } else if (change === 'deteriorated') {
        keyFindings.push(`${aspect} has deteriorated over the study period`);
        concernAreas.push(`Monitor ${aspect} closely in future visits`);
      }
    });

    // Determine overall trend
    const improvements = Object.values(changes).filter(change => change === 'improved').length;
    const deteriorations = Object.values(changes).filter(change => change === 'deteriorated').length;

    let overallTrend: 'improving' | 'stable' | 'declining';
    if (improvements > deteriorations) {
      overallTrend = 'improving';
      recommendations.push('Continue current treatment approach');
    } else if (deteriorations > improvements) {
      overallTrend = 'declining';
      recommendations.push('Consider adjusting treatment protocol');
      recommendations.push('Schedule follow-up assessment');
    } else {
      overallTrend = 'stable';
      recommendations.push('Maintain current monitoring schedule');
    }

    return {
      overallTrend,
      keyFindings,
      recommendations,
      concernAreas
    };
  }

  /**
   * Validate comparative assessment data
   */
  private validateComparativeData(data: Partial<Omit<ComparativeScoresExaminationData, keyof BaseExaminationData | 'comparativeScoresId'>>): void {
    const assessmentFields = [
      'comfort', 'dryness', 'vp_DigitalDevice', 'vp_DayTime', 'vp_EndOfDay',
      'vp_Glare', 'vp_Halo', 'vp_StarBurst', 'eyeStrain', 'totalSatisfaction'
    ] as const;

    assessmentFields.forEach(field => {
      if (data[field] !== undefined && !this.VALID_ASSESSMENTS.includes(data[field]!)) {
        throw new Error(`${field} must be one of: ${this.VALID_ASSESSMENTS.join(', ')}`);
      }
    });

    // Validate reason text fields are not empty when assessment is provided
    const reasonFields = [
      'comfortReason', 'drynessReason', 'vpReason_DigitalDevice', 'vpReason_DayTime',
      'vpReason_EndOfDay', 'vpReason_Glare', 'vpReason_Halo', 'vpReason_StarBurst',
      'eyeStrainReason', 'totalSatisfactionReason'
    ] as const;

    reasonFields.forEach(field => {
      if (data[field] !== undefined && typeof data[field] !== 'string') {
        throw new Error(`${field} must be a string`);
      }
    });
  }

  private isImprovement(assessment: string): boolean {
    return assessment === 'much_better' || assessment === 'better';
  }

  private isDeteriorationn(assessment: string): boolean {
    return assessment === 'much_worse' || assessment === 'worse';
  }

  private countAssessmentChanges(
    exam: ComparativeScoresExaminationData,
    improvements: any,
    deteriorations: any,
    improvementReasons: string[],
    deteriorationReasons: string[]
  ): void {
    const fields = [
      { assessment: exam.vp_DigitalDevice, reason: exam.vpReason_DigitalDevice, key: 'digitalDevice' },
      { assessment: exam.vp_DayTime, reason: exam.vpReason_DayTime, key: 'dayTime' },
      { assessment: exam.vp_EndOfDay, reason: exam.vpReason_EndOfDay, key: 'endOfDay' },
      { assessment: exam.vp_Glare, reason: exam.vpReason_Glare, key: 'glare' },
      { assessment: exam.vp_Halo, reason: exam.vpReason_Halo, key: 'halo' },
      { assessment: exam.vp_StarBurst, reason: exam.vpReason_StarBurst, key: 'starBurst' },
      { assessment: exam.eyeStrain, reason: exam.eyeStrainReason, key: 'eyeStrain' },
      { assessment: exam.totalSatisfaction, reason: exam.totalSatisfactionReason, key: 'totalSatisfaction' }
    ];

    fields.forEach(({ assessment, reason, key }) => {
      if (this.isImprovement(assessment)) {
        improvements[key]++;
        if (reason.trim()) improvementReasons.push(reason);
      } else if (this.isDeteriorationn(assessment)) {
        deteriorations[key]++;
        if (reason.trim()) deteriorationReasons.push(reason);
      }
    });
  }

  private getMostCommonReasons(reasons: string[]): string[] {
    const reasonCounts = reasons.reduce((acc, reason) => {
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([reason]) => reason);
  }

  private getEmptyScoresSummary() {
    return {
      visitCount: 0,
      improvements: {
        comfort: 0, dryness: 0, digitalDevice: 0, dayTime: 0, endOfDay: 0,
        glare: 0, halo: 0, starBurst: 0, eyeStrain: 0, totalSatisfaction: 0
      },
      deteriorations: {
        comfort: 0, dryness: 0, digitalDevice: 0, dayTime: 0, endOfDay: 0,
        glare: 0, halo: 0, starBurst: 0, eyeStrain: 0, totalSatisfaction: 0
      },
      mostCommonReasons: {
        improvement: [],
        deterioration: []
      }
    };
  }

  private compareAssessments(
    assessment1: string,
    assessment2: string
  ): 'improved' | 'deteriorated' | 'same' | 'not_comparable' {
    if (assessment1 === 'not_applicable' || assessment2 === 'not_applicable') {
      return 'not_comparable';
    }

    const assessmentOrder = ['much_worse', 'worse', 'same', 'better', 'much_better'];
    const score1 = assessmentOrder.indexOf(assessment1);
    const score2 = assessmentOrder.indexOf(assessment2);

    if (score1 === -1 || score2 === -1) return 'not_comparable';

    if (score2 > score1) return 'improved';
    if (score2 < score1) return 'deteriorated';
    return 'same';
  }

  private compareVisualPerformance(
    visit1: ComparativeScoresExaminationData,
    visit2: ComparativeScoresExaminationData
  ): 'improved' | 'deteriorated' | 'same' | 'not_comparable' {
    const vpFields1 = [visit1.vp_DigitalDevice, visit1.vp_DayTime, visit1.vp_EndOfDay, visit1.vp_Glare, visit1.vp_Halo, visit1.vp_StarBurst];
    const vpFields2 = [visit2.vp_DigitalDevice, visit2.vp_DayTime, visit2.vp_EndOfDay, visit2.vp_Glare, visit2.vp_Halo, visit2.vp_StarBurst];

    const comparisons = vpFields1.map((field1, index) => 
      this.compareAssessments(field1, vpFields2[index])
    ).filter(comp => comp !== 'not_comparable');

    if (comparisons.length === 0) return 'not_comparable';

    const improvements = comparisons.filter(comp => comp === 'improved').length;
    const deteriorations = comparisons.filter(comp => comp === 'deteriorated').length;

    if (improvements > deteriorations) return 'improved';
    if (deteriorations > improvements) return 'deteriorated';
    return 'same';
  }
}