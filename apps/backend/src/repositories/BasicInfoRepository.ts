import { BaseExaminationRepository, BaseExaminationData } from './BaseExaminationRepository.js';
import { tableNames } from '../config/database.js';

/**
 * BasicInfo examination data interface
 */
export interface BasicInfoExaminationData extends BaseExaminationData {
  basicInfoId: string;
  
  // Basic Information Data
  currentUsedCL: string; // 現在使用しているコンタクトレンズ
  
  // 角膜曲率半径
  cr_R1: number; // Integer
  cr_R2: number; // Integer
  cr_Ave: number; // Integer - 平均
  
  // 屈折検査
  va: number; // Float - 視力
  s: number; // Float - 球面度数
  c: number; // Float - 円柱度数
  ax: number; // Integer - 軸
  
  // 眼圧
  intraocularPressure1: number; // Integer
  intraocularPressure2: number; // Integer
  intraocularPressure3: number; // Integer
  
  // 角膜内皮細胞
  cornealEndothelialCells: number; // Integer
}

/**
 * Repository for BasicInfo examination data
 * Handles basic patient information and refraction data
 */
export class BasicInfoRepository extends BaseExaminationRepository<BasicInfoExaminationData> {
  constructor() {
    super(tableNames.basicInfo);
  }

  protected getExaminationIdFieldName(): string {
    return 'basicInfoId';
  }

  protected getExaminationPrefix(): string {
    return 'basicinfo';
  }

  /**
   * Create basic info examination with validation
   */
  async createBasicInfo(
    visitId: string,
    surveyId: string,
    patientId: string,
    clinicalStudyId: string,
    organizationId: string,
    eyeside: 'Right' | 'Left',
    data: Omit<BasicInfoExaminationData, keyof BaseExaminationData | 'basicInfoId'>
  ): Promise<BasicInfoExaminationData> {
    // Validate data ranges
    this.validateBasicInfoData(data);

    return await this.createExamination(
      visitId, surveyId, patientId, clinicalStudyId, organizationId, eyeside, data
    );
  }

  /**
   * Update basic info examination
   */
  async updateBasicInfo(
    visitId: string,
    basicInfoId: string,
    updates: Partial<Omit<BasicInfoExaminationData, keyof BaseExaminationData | 'basicInfoId'>>
  ): Promise<BasicInfoExaminationData> {
    // Validate updated data
    if (Object.keys(updates).length > 0) {
      this.validateBasicInfoData(updates as any);
    }

    return await this.updateExamination(visitId, basicInfoId, updates);
  }

  /**
   * Get average intraocular pressure
   */
  async getAverageIOP(visitId: string, eyeside: 'Right' | 'Left'): Promise<number | null> {
    const basicInfo = await this.findByVisitAndEye(visitId, eyeside);
    if (!basicInfo) return null;

    const pressures = [
      basicInfo.intraocularPressure1,
      basicInfo.intraocularPressure2,
      basicInfo.intraocularPressure3
    ].filter(p => p > 0);

    return pressures.length > 0 
      ? Math.round((pressures.reduce((sum, p) => sum + p, 0) / pressures.length) * 10) / 10
      : null;
  }

  /**
   * Compare corneal curvature between visits
   */
  async compareCornealCurvature(surveyId: string, eyeside: 'Right' | 'Left'): Promise<{
    visitId: string;
    date: string;
    cr_R1: number;
    cr_R2: number;
    cr_Ave: number;
  }[]> {
    const examinations = await this.compareVisits(surveyId, eyeside);
    
    return examinations.map(exam => ({
      visitId: exam.visitId,
      date: exam.createdAt,
      cr_R1: exam.cr_R1,
      cr_R2: exam.cr_R2,
      cr_Ave: exam.cr_Ave,
    }));
  }

  /**
   * Compare visual acuity between visits
   */
  async compareVisualAcuity(surveyId: string, eyeside: 'Right' | 'Left'): Promise<{
    visitId: string;
    date: string;
    va: number;
    s: number;
    c: number;
    ax: number;
  }[]> {
    const examinations = await this.compareVisits(surveyId, eyeside);
    
    return examinations.map(exam => ({
      visitId: exam.visitId,
      date: exam.createdAt,
      va: exam.va,
      s: exam.s,
      c: exam.c,
      ax: exam.ax,
    }));
  }

  /**
   * Validate basic info data ranges
   */
  private validateBasicInfoData(data: Partial<Omit<BasicInfoExaminationData, keyof BaseExaminationData | 'basicInfoId'>>): void {
    // Validate corneal curvature (typical range: 6.0-9.0mm)
    if (data.cr_R1 !== undefined && (data.cr_R1 < 6.0 || data.cr_R1 > 9.0)) {
      throw new Error('Corneal curvature R1 out of valid range (6.0-9.0mm)');
    }
    if (data.cr_R2 !== undefined && (data.cr_R2 < 6.0 || data.cr_R2 > 9.0)) {
      throw new Error('Corneal curvature R2 out of valid range (6.0-9.0mm)');
    }
    if (data.cr_Ave !== undefined && (data.cr_Ave < 6.0 || data.cr_Ave > 9.0)) {
      throw new Error('Corneal curvature average out of valid range (6.0-9.0mm)');
    }

    // Validate visual acuity (typical range: 0.1-2.0)
    if (data.va !== undefined && (data.va < 0.1 || data.va > 2.0)) {
      throw new Error('Visual acuity out of valid range (0.1-2.0)');
    }

    // Validate intraocular pressure (typical range: 8-25 mmHg)
    const iopFields = ['intraocularPressure1', 'intraocularPressure2', 'intraocularPressure3'] as const;
    iopFields.forEach(field => {
      if (data[field] !== undefined && (data[field]! < 8 || data[field]! > 25)) {
        throw new Error(`${field} out of valid range (8-25 mmHg)`);
      }
    });

    // Validate corneal endothelial cells (typical range: 2000-4000 cells/mm²)
    if (data.cornealEndothelialCells !== undefined && 
        (data.cornealEndothelialCells < 2000 || data.cornealEndothelialCells > 4000)) {
      throw new Error('Corneal endothelial cells out of valid range (2000-4000 cells/mm²)');
    }
  }
}