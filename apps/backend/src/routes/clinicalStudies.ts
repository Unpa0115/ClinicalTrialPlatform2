import express, { Request, Response } from 'express';
import { z } from 'zod';
import { getClinicalStudyService } from '../services/ClinicalStudyService.js';
import { authenticateToken, AuthenticatedRequest, extractUserContext } from '../middleware/auth.js';
import { requireAction } from '../middleware/authorization.js';

const router = express.Router();

// Validation schemas
const visitTemplateSchema = z.object({
  visitNumber: z.number().int().min(1),
  visitType: z.enum(['baseline', '1week', '1month', '3month', 'custom']),
  visitName: z.string().min(1).max(100),
  scheduledDaysFromBaseline: z.number().int().min(0),
  windowDaysBefore: z.number().int().min(0),
  windowDaysAfter: z.number().int().min(0),
  requiredExaminations: z.array(z.string()),
  optionalExaminations: z.array(z.string()),
  examinationOrder: z.array(z.string()),
  isRequired: z.boolean(),
});

const examinationConfigSchema = z.object({
  examinationId: z.string().min(1),
  examinationName: z.string().min(1).max(100),
  description: z.string().max(500),
  isRequired: z.boolean(),
  estimatedDuration: z.number().int().min(0),
});

const createClinicalStudySchema = z.object({
  studyName: z.string().min(1).max(200),
  studyCode: z.string().min(1).max(50),
  description: z.string().max(1000),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  targetOrganizations: z.array(z.string()),
  maxPatientsPerOrganization: z.number().int().min(1),
  totalTargetPatients: z.number().int().min(1),
  visitTemplate: z.array(visitTemplateSchema).min(1),
  examinations: z.array(examinationConfigSchema).min(1),
  protocolVersion: z.string().min(1).max(20),
  ethicsApprovalNumber: z.string().max(50).optional(),
  regulatoryApprovals: z.array(z.string()),
  currentPhase: z.string().min(1).max(50),
});

const updateClinicalStudySchema = z.object({
  studyName: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  targetOrganizations: z.array(z.string()).optional(),
  maxPatientsPerOrganization: z.number().int().min(1).optional(),
  totalTargetPatients: z.number().int().min(1).optional(),
  visitTemplate: z.array(visitTemplateSchema).min(1).optional(),
  examinations: z.array(examinationConfigSchema).min(1).optional(),
  status: z.enum(['planning', 'active', 'recruiting', 'completed', 'suspended', 'terminated']).optional(),
  currentPhase: z.string().min(1).max(50).optional(),
  protocolVersion: z.string().min(1).max(20).optional(),
  ethicsApprovalNumber: z.string().max(50).optional(),
  regulatoryApprovals: z.array(z.string()).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['planning', 'active', 'recruiting', 'completed', 'suspended', 'terminated']),
});

const updateVisitTemplateSchema = z.object({
  visitTemplate: z.array(visitTemplateSchema).min(1),
});

const addOrganizationSchema = z.object({
  organizationId: z.string().min(1),
});

const generateSurveySchema = z.object({
  organizationId: z.string().min(1),
  patientId: z.string().min(1),
  baselineDate: z.string().datetime(),
});

const updateEnrollmentSchema = z.object({
  enrolledPatients: z.number().int().min(0),
});

// ============================================================================
// CLINICAL STUDY MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/clinical-studies
 * Create a new clinical study with flexible visit configuration
 */
router.post('/', authenticateToken, requireAction('create', 'clinical_study'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createClinicalStudySchema.parse(req.body);
    const userContext = extractUserContext(req);

    // Validate date range
    if (new Date(validatedData.startDate) >= new Date(validatedData.endDate)) {
      res.status(400).json({ error: 'End date must be after start date' });
      return;
    }

    const clinicalStudyService = getClinicalStudyService();
    const study = await clinicalStudyService.createStudy(validatedData, userContext.userId!);

    res.status(201).json({
      success: true,
      study: {
        clinicalStudyId: study.clinicalStudyId,
        studyName: study.studyName,
        studyCode: study.studyCode,
        description: study.description,
        status: study.status,
        startDate: study.startDate,
        endDate: study.endDate,
        targetOrganizations: study.targetOrganizations,
        maxPatientsPerOrganization: study.maxPatientsPerOrganization,
        totalTargetPatients: study.totalTargetPatients,
        enrolledPatients: study.enrolledPatients,
        visitTemplate: study.visitTemplate,
        examinations: study.examinations,
        protocolVersion: study.protocolVersion,
        currentPhase: study.currentPhase,
        createdAt: study.createdAt,
        updatedAt: study.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error creating clinical study:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create clinical study', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * GET /api/clinical-studies
 * List clinical studies with optional filtering
 */
router.get('/', authenticateToken, requireAction('read', 'clinical_study'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userContext = extractUserContext(req);
    const { status, organizationId } = req.query;

    const clinicalStudyService = getClinicalStudyService();
    let studies;

    if (status && typeof status === 'string') {
      studies = await clinicalStudyService.getStudiesByStatus(status as any);
    } else if (organizationId && typeof organizationId === 'string') {
      studies = await clinicalStudyService.getStudiesByOrganization(organizationId);
    } else if (userContext.role === 'org_admin' && userContext.organizationId) {
      // Organization admins can only see studies for their organization
      studies = await clinicalStudyService.getStudiesByOrganization(userContext.organizationId);
    } else {
      // For super_admin and study_admin, get studies based on status (default to all active studies)
      // If no status filter is provided, we still want to show all studies, not just active ones
      studies = await clinicalStudyService.getActiveStudies();
    }

    res.json({
      success: true,
      studies: studies.map(study => ({
        clinicalStudyId: study.clinicalStudyId,
        studyName: study.studyName,
        studyCode: study.studyCode,
        description: study.description,
        status: study.status,
        startDate: study.startDate,
        endDate: study.endDate,
        targetOrganizations: study.targetOrganizations,
        maxPatientsPerOrganization: study.maxPatientsPerOrganization,
        totalTargetPatients: study.totalTargetPatients,
        enrolledPatients: study.enrolledPatients,
        currentPhase: study.currentPhase,
        protocolVersion: study.protocolVersion,
        createdAt: study.createdAt,
        updatedAt: study.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error listing clinical studies:', error);
    res.status(500).json({ error: 'Failed to list clinical studies', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /api/clinical-studies/:studyId
 * Get clinical study details
 */
router.get('/:studyId', authenticateToken, requireAction('read', 'clinical_study'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studyId } = req.params;
    const userContext = extractUserContext(req);

    const clinicalStudyService = getClinicalStudyService();
    const study = await clinicalStudyService.getStudyById(studyId);

    if (!study) {
      res.status(404).json({ error: 'Clinical study not found' });
      return;
    }

    // Check access permissions
    if (userContext.role === 'org_admin' && userContext.organizationId) {
      if (!study.targetOrganizations.includes(userContext.organizationId)) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    }

    res.json({
      success: true,
      study: {
        clinicalStudyId: study.clinicalStudyId,
        studyName: study.studyName,
        studyCode: study.studyCode,
        description: study.description,
        status: study.status,
        startDate: study.startDate,
        endDate: study.endDate,
        targetOrganizations: study.targetOrganizations,
        maxPatientsPerOrganization: study.maxPatientsPerOrganization,
        totalTargetPatients: study.totalTargetPatients,
        enrolledPatients: study.enrolledPatients,
        visitTemplate: study.visitTemplate,
        examinations: study.examinations,
        protocolVersion: study.protocolVersion,
        ethicsApprovalNumber: study.ethicsApprovalNumber,
        regulatoryApprovals: study.regulatoryApprovals,
        currentPhase: study.currentPhase,
        createdBy: study.createdBy,
        lastModifiedBy: study.lastModifiedBy,
        createdAt: study.createdAt,
        updatedAt: study.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error getting clinical study:', error);
    res.status(500).json({ error: 'Failed to get clinical study', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * PUT /api/clinical-studies/:studyId
 * Update clinical study
 */
router.put('/:studyId', authenticateToken, requireAction('update', 'clinical_study'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studyId } = req.params;
    const validatedData = updateClinicalStudySchema.parse(req.body);
    const userContext = extractUserContext(req);

    // Validate date range if both dates are provided
    if (validatedData.startDate && validatedData.endDate) {
      if (new Date(validatedData.startDate) >= new Date(validatedData.endDate)) {
        res.status(400).json({ error: 'End date must be after start date' });
        return;
      }
    }

    const clinicalStudyService = getClinicalStudyService();
    
    // Check if study exists and user has access
    const existingStudy = await clinicalStudyService.getStudyById(studyId);
    if (!existingStudy) {
      res.status(404).json({ error: 'Clinical study not found' });
      return;
    }

    if (userContext.role === 'org_admin' && userContext.organizationId) {
      if (!existingStudy.targetOrganizations.includes(userContext.organizationId)) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    }

    const updatedStudy = await clinicalStudyService.updateStudy(studyId, validatedData, userContext.userId!);

    res.json({
      success: true,
      study: {
        clinicalStudyId: updatedStudy.clinicalStudyId,
        studyName: updatedStudy.studyName,
        studyCode: updatedStudy.studyCode,
        description: updatedStudy.description,
        status: updatedStudy.status,
        startDate: updatedStudy.startDate,
        endDate: updatedStudy.endDate,
        targetOrganizations: updatedStudy.targetOrganizations,
        maxPatientsPerOrganization: updatedStudy.maxPatientsPerOrganization,
        totalTargetPatients: updatedStudy.totalTargetPatients,
        enrolledPatients: updatedStudy.enrolledPatients,
        visitTemplate: updatedStudy.visitTemplate,
        examinations: updatedStudy.examinations,
        protocolVersion: updatedStudy.protocolVersion,
        currentPhase: updatedStudy.currentPhase,
        updatedAt: updatedStudy.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating clinical study:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update clinical study', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * PUT /api/clinical-studies/:studyId/status
 * Update clinical study status
 */
router.put('/:studyId/status', authenticateToken, requireAction('update', 'clinical_study'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studyId } = req.params;
    const validatedData = updateStatusSchema.parse(req.body);
    const userContext = extractUserContext(req);

    const clinicalStudyService = getClinicalStudyService();
    const updatedStudy = await clinicalStudyService.updateStudyStatus(studyId, validatedData.status, userContext.userId!);

    res.json({
      success: true,
      study: {
        clinicalStudyId: updatedStudy.clinicalStudyId,
        studyName: updatedStudy.studyName,
        status: updatedStudy.status,
        updatedAt: updatedStudy.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating study status:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update study status', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * PUT /api/clinical-studies/:studyId/visit-template
 * Update visit template configuration
 */
router.put('/:studyId/visit-template', authenticateToken, requireAction('update', 'clinical_study'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studyId } = req.params;
    const validatedData = updateVisitTemplateSchema.parse(req.body);
    const userContext = extractUserContext(req);

    const clinicalStudyService = getClinicalStudyService();
    const updatedStudy = await clinicalStudyService.updateVisitTemplate(studyId, validatedData.visitTemplate, userContext.userId!);

    res.json({
      success: true,
      study: {
        clinicalStudyId: updatedStudy.clinicalStudyId,
        studyName: updatedStudy.studyName,
        visitTemplate: updatedStudy.visitTemplate,
        updatedAt: updatedStudy.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating visit template:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update visit template', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * POST /api/clinical-studies/:studyId/organizations
 * Add organization to study
 */
router.post('/:studyId/organizations', authenticateToken, requireAction('update', 'clinical_study'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studyId } = req.params;
    const validatedData = addOrganizationSchema.parse(req.body);

    const clinicalStudyService = getClinicalStudyService();
    const updatedStudy = await clinicalStudyService.addOrganizationToStudy(studyId, validatedData.organizationId);

    res.json({
      success: true,
      study: {
        clinicalStudyId: updatedStudy.clinicalStudyId,
        studyName: updatedStudy.studyName,
        targetOrganizations: updatedStudy.targetOrganizations,
        updatedAt: updatedStudy.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error adding organization to study:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to add organization to study', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * DELETE /api/clinical-studies/:studyId/organizations/:organizationId
 * Remove organization from study
 */
router.delete('/:studyId/organizations/:organizationId', authenticateToken, requireAction('update', 'clinical_study'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studyId, organizationId } = req.params;

    const clinicalStudyService = getClinicalStudyService();
    const updatedStudy = await clinicalStudyService.removeOrganizationFromStudy(studyId, organizationId);

    res.json({
      success: true,
      study: {
        clinicalStudyId: updatedStudy.clinicalStudyId,
        studyName: updatedStudy.studyName,
        targetOrganizations: updatedStudy.targetOrganizations,
        updatedAt: updatedStudy.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error removing organization from study:', error);
    res.status(500).json({ error: 'Failed to remove organization from study', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /api/clinical-studies/:studyId/surveys
 * Generate survey from clinical study template
 */
router.post('/:studyId/surveys', authenticateToken, requireAction('create', 'survey'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studyId } = req.params;
    const validatedData = generateSurveySchema.parse(req.body);
    const userContext = extractUserContext(req);

    const clinicalStudyService = getClinicalStudyService();
    const survey = await clinicalStudyService.generateSurveyFromTemplate({
      clinicalStudyId: studyId,
      organizationId: validatedData.organizationId,
      patientId: validatedData.patientId,
      baselineDate: validatedData.baselineDate,
      assignedBy: userContext.userId!,
    });

    res.status(201).json({
      success: true,
      survey: {
        surveyId: survey.surveyId,
        clinicalStudyId: survey.clinicalStudyId,
        organizationId: survey.organizationId,
        patientId: survey.patientId,
        name: survey.name,
        description: survey.description,
        baselineDate: survey.baselineDate,
        expectedCompletionDate: survey.expectedCompletionDate,
        status: survey.status,
        totalVisits: survey.totalVisits,
        completedVisits: survey.completedVisits,
        completionPercentage: survey.completionPercentage,
        createdAt: survey.createdAt,
      },
    });
  } catch (error) {
    console.error('Error generating survey from template:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to generate survey from template', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * PUT /api/clinical-studies/:studyId/enrollment
 * Update enrollment count
 */
router.put('/:studyId/enrollment', authenticateToken, requireAction('update', 'clinical_study'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studyId } = req.params;
    const validatedData = updateEnrollmentSchema.parse(req.body);

    const clinicalStudyService = getClinicalStudyService();
    const updatedStudy = await clinicalStudyService.updateEnrollmentCount(studyId, validatedData.enrolledPatients);

    res.json({
      success: true,
      study: {
        clinicalStudyId: updatedStudy.clinicalStudyId,
        studyName: updatedStudy.studyName,
        enrolledPatients: updatedStudy.enrolledPatients,
        totalTargetPatients: updatedStudy.totalTargetPatients,
        updatedAt: updatedStudy.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating enrollment count:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update enrollment count', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * DELETE /api/clinical-studies/:studyId
 * Delete a clinical study (only for planning status studies)
 */
router.delete('/:studyId', authenticateToken, requireAction('delete', 'clinical_study'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studyId } = req.params;
    const userContext = extractUserContext(req);

    const clinicalStudyService = getClinicalStudyService();
    
    // Check if study exists
    const existingStudy = await clinicalStudyService.getStudyById(studyId);
    if (!existingStudy) {
      res.status(404).json({ error: 'Clinical study not found' });
      return;
    }

    // Only allow deletion if study is in planning status
    if (existingStudy.status !== 'planning') {
      res.status(400).json({ error: 'Only studies in planning status can be deleted' });
      return;
    }

    // Check access permissions - only super_admin and study_admin can delete
    if (userContext.role !== 'super_admin' && userContext.role !== 'study_admin') {
      res.status(403).json({ error: 'Insufficient permissions to delete clinical study' });
      return;
    }

    await clinicalStudyService.deleteStudy(studyId, userContext.userId!);

    res.json({
      success: true,
      message: `Clinical study "${existingStudy.studyName || existingStudy.studyCode}" has been deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting clinical study:', error);
    res.status(500).json({ error: 'Failed to delete clinical study', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;