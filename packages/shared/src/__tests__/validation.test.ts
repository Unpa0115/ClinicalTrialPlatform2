import { describe, it, expect } from 'vitest';
import { 
  ValidationSchemas,
  transformBasicInfoForAPI,
  transformVASForAPI,
  handleDynamoDBError
} from '../index.js';

describe('Validation Schemas', () => {
  describe('BasicInfoExaminationDataSchema', () => {
    it('should validate correct basic info data', () => {
      const validData = {
        visitId: 'visit-123',
        basicInfoId: 'basicinfo-right-123',
        surveyId: 'survey-123',
        patientId: 'patient-123',
        clinicalStudyId: 'study-123',
        organizationId: 'org-123',
        eyeside: 'Right' as const,
        currentUsedCL: 'Acuvue Oasys',
        cr_R1: 7.8,
        cr_R2: 7.6,
        cr_Ave: 7.7,
        va: 1.2,
        s: -2.5,
        c: -0.5,
        ax: 180,
        intraocularPressure1: 14,
        intraocularPressure2: 15,
        intraocularPressure3: 14,
        cornealEndothelialCells: 2800,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = ValidationSchemas.BasicInfoExaminationData.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid corneal curvature values', () => {
      const invalidData = {
        visitId: 'visit-123',
        basicInfoId: 'basicinfo-right-123',
        surveyId: 'survey-123',
        patientId: 'patient-123',
        clinicalStudyId: 'study-123',
        organizationId: 'org-123',
        eyeside: 'Right' as const,
        currentUsedCL: 'Acuvue Oasys',
        cr_R1: 5.0, // Invalid: below 6.0mm
        cr_R2: 7.6,
        cr_Ave: 7.7,
        va: 1.2,
        s: -2.5,
        c: -0.5,
        ax: 180,
        intraocularPressure1: 14,
        intraocularPressure2: 15,
        intraocularPressure3: 14,
        cornealEndothelialCells: 2800,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = ValidationSchemas.BasicInfoExaminationData.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('R1 must be at least 6.0mm');
      }
    });

    it('should reject invalid intraocular pressure values', () => {
      const invalidData = {
        visitId: 'visit-123',
        basicInfoId: 'basicinfo-right-123',
        surveyId: 'survey-123',
        patientId: 'patient-123',
        clinicalStudyId: 'study-123',
        organizationId: 'org-123',
        eyeside: 'Right' as const,
        currentUsedCL: 'Acuvue Oasys',
        cr_R1: 7.8,
        cr_R2: 7.6,
        cr_Ave: 7.7,
        va: 1.2,
        s: -2.5,
        c: -0.5,
        ax: 180,
        intraocularPressure1: 30, // Invalid: above 25mmHg
        intraocularPressure2: 15,
        intraocularPressure3: 14,
        cornealEndothelialCells: 2800,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = ValidationSchemas.BasicInfoExaminationData.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('IOP1 must be at most 25mmHg');
      }
    });
  });

  describe('VASExaminationDataSchema', () => {
    it('should validate correct VAS data', () => {
      const validData = {
        visitId: 'visit-123',
        vasId: 'vas-right-123',
        surveyId: 'survey-123',
        patientId: 'patient-123',
        clinicalStudyId: 'study-123',
        organizationId: 'org-123',
        eyeside: 'Right' as const,
        comfortLevel: 75,
        drynessLevel: 30,
        visualPerformance_Daytime: 85,
        visualPerformance_EndOfDay: 70,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = ValidationSchemas.VASExaminationData.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject VAS scores outside 0-100 range', () => {
      const invalidData = {
        visitId: 'visit-123',
        vasId: 'vas-right-123',
        surveyId: 'survey-123',
        patientId: 'patient-123',
        clinicalStudyId: 'study-123',
        organizationId: 'org-123',
        eyeside: 'Right' as const,
        comfortLevel: 150, // Invalid: above 100
        drynessLevel: 30,
        visualPerformance_Daytime: 85,
        visualPerformance_EndOfDay: 70,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = ValidationSchemas.VASExaminationData.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Comfort level must be 0-100');
      }
    });
  });

  describe('EyesideSchema', () => {
    it('should accept valid eyeside values', () => {
      expect(ValidationSchemas.BasicInfoExaminationData.shape.eyeside.safeParse('Right').success).toBe(true);
      expect(ValidationSchemas.BasicInfoExaminationData.shape.eyeside.safeParse('Left').success).toBe(true);
    });

    it('should reject invalid eyeside values', () => {
      expect(ValidationSchemas.BasicInfoExaminationData.shape.eyeside.safeParse('right').success).toBe(false);
      expect(ValidationSchemas.BasicInfoExaminationData.shape.eyeside.safeParse('left').success).toBe(false);
      expect(ValidationSchemas.BasicInfoExaminationData.shape.eyeside.safeParse('Both').success).toBe(false);
    });
  });
});

describe('Data Transformers', () => {
  describe('transformBasicInfoForAPI', () => {
    it('should calculate average IOP correctly', () => {
      const basicInfo = {
        visitId: 'visit-123',
        basicInfoId: 'basicinfo-right-123',
        surveyId: 'survey-123',
        patientId: 'patient-123',
        clinicalStudyId: 'study-123',
        organizationId: 'org-123',
        eyeside: 'Right' as const,
        currentUsedCL: 'Acuvue Oasys',
        cr_R1: 7.8,
        cr_R2: 7.6,
        cr_Ave: 7.7,
        va: 1.2,
        s: -2.5,
        c: -0.5,
        ax: 180,
        intraocularPressure1: 14,
        intraocularPressure2: 15,
        intraocularPressure3: 14,
        cornealEndothelialCells: 2800,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const transformed = transformBasicInfoForAPI(basicInfo);
      
      expect(transformed.averageIOP).toBe(14.3); // (14 + 15 + 14) / 3 = 14.33, rounded to 14.3
      expect(transformed.cornealCurvature).toEqual({
        r1: 7.8,
        r2: 7.6,
        average: 7.7,
      });
      expect(transformed.refraction).toEqual({
        va: 1.2,
        s: -2.5,
        c: -0.5,
        ax: 180,
      });
      expect(transformed.intraocularPressure).toEqual([14, 15, 14]);
    });
  });

  describe('transformVASForAPI', () => {
    it('should calculate average score and categories correctly', () => {
      const vasData = {
        visitId: 'visit-123',
        vasId: 'vas-right-123',
        surveyId: 'survey-123',
        patientId: 'patient-123',
        clinicalStudyId: 'study-123',
        organizationId: 'org-123',
        eyeside: 'Right' as const,
        comfortLevel: 75,
        drynessLevel: 30, // Inverted: 100 - 30 = 70 for calculation
        visualPerformance_Daytime: 85,
        visualPerformance_EndOfDay: 70,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const transformed = transformVASForAPI(vasData);
      
      // Average: (75 + 70 + 85 + 70) / 4 = 75
      expect(transformed.averageScore).toBe(75);
      expect(transformed.comfortCategory).toBe('good'); // 75 is in 60-79 range
      expect(transformed.drynessCategory).toBe('good'); // 70 (inverted) is in 60-79 range
      expect(transformed.visualPerformanceCategory).toBe('good'); // (85 + 70) / 2 = 77.5 is in 60-79 range
    });
  });
});

describe('Error Handling', () => {
  describe('handleDynamoDBError', () => {
    it('should handle ValidationException correctly', () => {
      const error = { name: 'ValidationException' };
      const result = handleDynamoDBError(error);
      
      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.statusCode).toBe(400);
      expect(result.retryable).toBe(false);
    });

    it('should handle ResourceNotFoundException correctly', () => {
      const error = { name: 'ResourceNotFoundException' };
      const result = handleDynamoDBError(error);
      
      expect(result.code).toBe('NOT_FOUND');
      expect(result.statusCode).toBe(404);
      expect(result.retryable).toBe(false);
    });

    it('should handle ProvisionedThroughputExceededException correctly', () => {
      const error = { name: 'ProvisionedThroughputExceededException' };
      const result = handleDynamoDBError(error);
      
      expect(result.code).toBe('THROTTLED');
      expect(result.statusCode).toBe(429);
      expect(result.retryable).toBe(true);
    });

    it('should handle unknown errors correctly', () => {
      const error = { name: 'UnknownError' };
      const result = handleDynamoDBError(error);
      
      expect(result.code).toBe('INTERNAL_ERROR');
      expect(result.statusCode).toBe(500);
      expect(result.retryable).toBe(false);
    });
  });
});