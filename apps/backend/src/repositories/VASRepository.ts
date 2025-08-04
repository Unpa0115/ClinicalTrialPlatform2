import { BaseExaminationRepository, BaseExaminationData } from './BaseExaminationRepository.js';
import { tableNames } from '../config/database.js';

/**
 * VAS examination data interface
 */
export interface VASExaminationData extends BaseExaminationData {
  vasId: string;
  
  // VAS Data (0-100 scale)
  comfortLevel: number; // Integer (0-100)
  drynessLevel: number; // Integer (0-100)
  visualPerformance_Daytime: number; // Integer (0-100)
  visualPerformance_EndOfDay: number; // Integer (0-100)
}

/**
 * Repository for VAS (Visual Analog Scale) examination data
 * Handles comfort and symptom assessment data
 */
export class VASRepository extends BaseExaminationRepository<VASExaminationData> {
  constructor() {
    super(tableNames.vas);
  }

  protected getExaminationIdFieldName(): string {
    return 'vasId';
  }

  protected getExaminationPrefix(): string {
    return 'vas';
  }

  /**
   * Create VAS examination with validation
   */
  async createVAS(
    visitId: string,
    surveyId: string,
    patientId: string,
    clinicalStudyId: string,
    organizationId: string,
    eyeside: 'Right' | 'Left',
    data: Omit<VASExaminationData, keyof BaseExaminationData | 'vasId'>
  ): Promise<VASExaminationData> {
    // Validate VAS scores (0-100)
    this.validateVASData(data);

    return await this.createExamination(
      visitId, surveyId, patientId, clinicalStudyId, organizationId, eyeside, data
    );
  }

  /**
   * Update VAS examination
   */
  async updateVAS(
    visitId: string,
    vasId: string,
    updates: Partial<Omit<VASExaminationData, keyof BaseExaminationData | 'vasId'>>
  ): Promise<VASExaminationData> {
    // Validate updated data
    if (Object.keys(updates).length > 0) {
      this.validateVASData(updates as any);
    }

    return await this.updateExamination(visitId, vasId, updates);
  }

  /**
   * Get VAS trend data for survey
   */
  async getVASTrend(surveyId: string, eyeside: 'Right' | 'Left'): Promise<{
    visitId: string;
    date: string;
    comfortLevel: number;
    drynessLevel: number;
    visualPerformance_Daytime: number;
    visualPerformance_EndOfDay: number;
  }[]> {
    const examinations = await this.compareVisits(surveyId, eyeside);
    
    return examinations.map(exam => ({
      visitId: exam.visitId,
      date: exam.createdAt,
      comfortLevel: exam.comfortLevel,
      drynessLevel: exam.drynessLevel,
      visualPerformance_Daytime: exam.visualPerformance_Daytime,
      visualPerformance_EndOfDay: exam.visualPerformance_EndOfDay,
    }));
  }

  /**
   * Calculate average VAS scores for survey
   */
  async getAverageVASScores(surveyId: string, eyeside: 'Right' | 'Left'): Promise<{
    averageComfort: number;
    averageDryness: number;
    averageVisualPerformanceDaytime: number;
    averageVisualPerformanceEndOfDay: number;
    visitCount: number;
  } | null> {
    const examinations = await this.findBySurveyAndEye(surveyId, eyeside);
    
    if (examinations.length === 0) {
      return null;
    }

    const totals = examinations.reduce((acc, exam) => ({
      comfort: acc.comfort + exam.comfortLevel,
      dryness: acc.dryness + exam.drynessLevel,
      visualDaytime: acc.visualDaytime + exam.visualPerformance_Daytime,
      visualEndOfDay: acc.visualEndOfDay + exam.visualPerformance_EndOfDay,
    }), { comfort: 0, dryness: 0, visualDaytime: 0, visualEndOfDay: 0 });

    const count = examinations.length;

    return {
      averageComfort: Math.round(totals.comfort / count),
      averageDryness: Math.round(totals.dryness / count),
      averageVisualPerformanceDaytime: Math.round(totals.visualDaytime / count),
      averageVisualPerformanceEndOfDay: Math.round(totals.visualEndOfDay / count),
      visitCount: count,
    };
  }

  /**
   * Compare VAS scores between two visits
   */
  async compareVASBetweenVisits(
    surveyId: string,
    eyeside: 'Right' | 'Left',
    visit1Id: string,
    visit2Id: string
  ): Promise<{
    visit1: VASExaminationData | null;
    visit2: VASExaminationData | null;
    changes: {
      comfortChange: number;
      drynessChange: number;
      visualDaytimeChange: number;
      visualEndOfDayChange: number;
    } | null;
  }> {
    const [visit1Data, visit2Data] = await Promise.all([
      this.findByVisitAndEye(visit1Id, eyeside),
      this.findByVisitAndEye(visit2Id, eyeside)
    ]);

    let changes = null;
    if (visit1Data && visit2Data) {
      changes = {
        comfortChange: visit2Data.comfortLevel - visit1Data.comfortLevel,
        drynessChange: visit2Data.drynessLevel - visit1Data.drynessLevel,
        visualDaytimeChange: visit2Data.visualPerformance_Daytime - visit1Data.visualPerformance_Daytime,
        visualEndOfDayChange: visit2Data.visualPerformance_EndOfDay - visit1Data.visualPerformance_EndOfDay,
      };
    }

    return {
      visit1: visit1Data,
      visit2: visit2Data,
      changes,
    };
  }

  /**
   * Get VAS improvement analysis
   */
  async getImprovementAnalysis(surveyId: string, eyeside: 'Right' | 'Left'): Promise<{
    overallImprovement: 'improved' | 'worsened' | 'stable' | 'insufficient_data';
    comfortTrend: 'improving' | 'worsening' | 'stable';
    drynessTrend: 'improving' | 'worsening' | 'stable';
    visualPerformanceTrend: 'improving' | 'worsening' | 'stable';
    significantChanges: string[];
  }> {
    const examinations = await this.compareVisits(surveyId, eyeside);
    
    if (examinations.length < 2) {
      return {
        overallImprovement: 'insufficient_data',
        comfortTrend: 'stable',
        drynessTrend: 'stable',
        visualPerformanceTrend: 'stable',
        significantChanges: [],
      };
    }

    const first = examinations[0];
    const last = examinations[examinations.length - 1];

    const comfortChange = last.comfortLevel - first.comfortLevel;
    const drynessChange = last.drynessLevel - first.drynessLevel;
    const visualDaytimeChange = last.visualPerformance_Daytime - first.visualPerformance_Daytime;
    const visualEndOfDayChange = last.visualPerformance_EndOfDay - first.visualPerformance_EndOfDay;

    const significantChanges: string[] = [];
    const threshold = 10; // 10-point change considered significant

    if (Math.abs(comfortChange) >= threshold) {
      significantChanges.push(`Comfort ${comfortChange > 0 ? 'improved' : 'worsened'} by ${Math.abs(comfortChange)} points`);
    }
    if (Math.abs(drynessChange) >= threshold) {
      significantChanges.push(`Dryness ${drynessChange < 0 ? 'improved' : 'worsened'} by ${Math.abs(drynessChange)} points`);
    }
    if (Math.abs(visualDaytimeChange) >= threshold) {
      significantChanges.push(`Daytime vision ${visualDaytimeChange > 0 ? 'improved' : 'worsened'} by ${Math.abs(visualDaytimeChange)} points`);
    }
    if (Math.abs(visualEndOfDayChange) >= threshold) {
      significantChanges.push(`End-of-day vision ${visualEndOfDayChange > 0 ? 'improved' : 'worsened'} by ${Math.abs(visualEndOfDayChange)} points`);
    }

    return {
      overallImprovement: this.calculateOverallTrend([comfortChange, -drynessChange, visualDaytimeChange, visualEndOfDayChange]),
      comfortTrend: this.calculateTrend(comfortChange),
      drynessTrend: this.calculateTrend(-drynessChange), // Negative because lower dryness is better
      visualPerformanceTrend: this.calculateTrend((visualDaytimeChange + visualEndOfDayChange) / 2),
      significantChanges,
    };
  }

  /**
   * Validate VAS data (0-100 scale)
   */
  private validateVASData(data: Partial<Omit<VASExaminationData, keyof BaseExaminationData | 'vasId'>>): void {
    const vasFields = ['comfortLevel', 'drynessLevel', 'visualPerformance_Daytime', 'visualPerformance_EndOfDay'] as const;
    
    vasFields.forEach(field => {
      if (data[field] !== undefined) {
        const value = data[field]!;
        if (!Number.isInteger(value) || value < 0 || value > 100) {
          throw new Error(`${field} must be an integer between 0 and 100`);
        }
      }
    });
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(change: number): 'improving' | 'worsening' | 'stable' {
    const threshold = 5; // 5-point threshold for trend determination
    
    if (change >= threshold) return 'improving';
    if (change <= -threshold) return 'worsening';
    return 'stable';
  }

  /**
   * Calculate overall trend from multiple changes
   */
  private calculateOverallTrend(changes: number[]): 'improved' | 'worsened' | 'stable' {
    const averageChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    const threshold = 5;
    
    if (averageChange >= threshold) return 'improved';
    if (averageChange <= -threshold) return 'worsened';
    return 'stable';
  }
}