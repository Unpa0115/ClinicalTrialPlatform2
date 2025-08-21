import express from 'express';
import { SurveyService } from '../services/SurveyService.js';
import { authenticateJWT } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';
import { validateRequest } from '../middleware/validation.js';
import { body, param, query } from 'express-validator';

const router = express.Router();
const surveyService = new SurveyService();

// Validation schemas
const createSurveyValidation = [
  body('clinicalStudyId').isString().notEmpty().withMessage('Clinical study ID is required'),
  body('organizationId').isString().notEmpty().withMessage('Organization ID is required'),
  body('patientId').isString().notEmpty().withMessage('Patient ID is required'),
  body('assignedBy').isString().notEmpty().withMessage('Assigned by is required'),
  body('baselineDate').isISO8601().withMessage('Valid baseline date is required'),
  body('conductedBy').optional().isString(),
  body('customName').optional().isString()
];

const surveyIdValidation = [
  param('surveyId').isString().notEmpty().withMessage('Survey ID is required')
];

const updateStatusValidation = [
  body('status').isIn(['active', 'completed', 'withdrawn', 'suspended']).withMessage('Valid status is required')
];

/**
 * @route POST /api/surveys/from-template
 * @desc Create survey from clinical study template
 * @access Private (study_admin, org_admin, investigator, coordinator)
 */
router.post('/from-template',
  authenticateJWT,
  checkPermission(['study_admin', 'org_admin', 'investigator', 'coordinator']),
  createSurveyValidation,
  validateRequest,
  async (req, res) => {
    try {
      const result = await surveyService.createSurveyFromTemplate(req.body);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error creating survey from template:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create survey'
      });
    }
  }
);

/**
 * @route GET /api/surveys/:surveyId
 * @desc Get survey details with related data
 * @access Private (all authenticated users with access to the survey)
 */
router.get('/:surveyId',
  authenticateJWT,
  surveyIdValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { surveyId } = req.params;
      const surveyDetails = await surveyService.getSurveyWithDetails(surveyId);
      
      res.json({
        success: true,
        data: surveyDetails
      });
    } catch (error) {
      console.error('Error getting survey details:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to get survey details'
        });
      }
    }
  }
);

/**
 * @route PUT /api/surveys/:surveyId/progress
 * @desc Update survey progress based on visit completions
 * @access Private (system automated call)
 */
router.put('/:surveyId/progress',
  authenticateJWT,
  surveyIdValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { surveyId } = req.params;
      const updatedSurvey = await surveyService.updateSurveyProgress(surveyId);
      
      res.json({
        success: true,
        data: updatedSurvey
      });
    } catch (error) {
      console.error('Error updating survey progress:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update survey progress'
      });
    }
  }
);

/**
 * @route PUT /api/surveys/:surveyId/status
 * @desc Update survey status
 * @access Private (study_admin, org_admin, investigator, coordinator)
 */
router.put('/:surveyId/status',
  authenticateJWT,
  checkPermission(['study_admin', 'org_admin', 'investigator', 'coordinator']),
  surveyIdValidation,
  updateStatusValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { surveyId } = req.params;
      const { status } = req.body;
      
      // Special handling for withdrawal
      if (status === 'withdrawn') {
        const { reason } = req.body;
        const updatedSurvey = await surveyService.withdrawSurvey(surveyId, reason);
        res.json({
          success: true,
          data: updatedSurvey
        });
      } else {
        // For other status updates, use the repository directly
        const surveyRepo = new (await import('../repositories/SurveyRepository.js')).SurveyRepository();
        const updatedSurvey = await surveyRepo.updateStatus(surveyId, status);
        res.json({
          success: true,
          data: updatedSurvey
        });
      }
    } catch (error) {
      console.error('Error updating survey status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update survey status'
      });
    }
  }
);

/**
 * @route GET /api/surveys/organization/:organizationId
 * @desc Get surveys by organization with filtering
 * @access Private (org_admin, investigator, coordinator, data_entry for their org)
 */
router.get('/organization/:organizationId',
  authenticateJWT,
  [
    param('organizationId').isString().notEmpty().withMessage('Organization ID is required'),
    query('status').optional().isIn(['active', 'completed', 'withdrawn', 'suspended']),
    query('clinicalStudyId').optional().isString(),
    query('patientId').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('startKey').optional().isString()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { organizationId } = req.params;
      const { status, clinicalStudyId, patientId, limit, startKey } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status;
      if (clinicalStudyId) filters.clinicalStudyId = clinicalStudyId as string;
      if (patientId) filters.patientId = patientId as string;
      
      const pagination: any = {};
      if (limit) pagination.limit = parseInt(limit as string);
      if (startKey) pagination.exclusiveStartKey = JSON.parse(startKey as string);
      
      const result = await surveyService.getSurveysByOrganization(
        organizationId,
        Object.keys(filters).length > 0 ? filters : undefined,
        Object.keys(pagination).length > 0 ? pagination : undefined
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting surveys by organization:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get surveys'
      });
    }
  }
);

/**
 * @route GET /api/surveys/study/:clinicalStudyId
 * @desc Get surveys by clinical study
 * @access Private (study_admin, org_admin, investigator for their studies)
 */
router.get('/study/:clinicalStudyId',
  authenticateJWT,
  [
    param('clinicalStudyId').isString().notEmpty().withMessage('Clinical study ID is required'),
    query('status').optional().isIn(['active', 'completed', 'withdrawn', 'suspended']),
    query('organizationId').optional().isString()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { clinicalStudyId } = req.params;
      const { status, organizationId } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status;
      if (organizationId) filters.organizationId = organizationId as string;
      
      const surveys = await surveyService.getSurveysByStudy(
        clinicalStudyId,
        Object.keys(filters).length > 0 ? filters : undefined
      );
      
      res.json({
        success: true,
        data: surveys
      });
    } catch (error) {
      console.error('Error getting surveys by study:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get surveys'
      });
    }
  }
);

/**
 * @route GET /api/surveys/dashboard/stats
 * @desc Get survey statistics for dashboard
 * @access Private (org_admin, study_admin, investigator)
 */
router.get('/dashboard/stats',
  authenticateJWT,
  checkPermission(['org_admin', 'study_admin', 'investigator']),
  [
    query('organizationId').optional().isString(),
    query('clinicalStudyId').optional().isString()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { organizationId, clinicalStudyId } = req.query;
      
      if (!organizationId && !clinicalStudyId) {
        return res.status(400).json({
          success: false,
          error: 'Either organizationId or clinicalStudyId must be provided'
        });
      }
      
      const stats = await surveyService.getSurveyDashboardStats(
        organizationId as string,
        clinicalStudyId as string
      );
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting survey dashboard stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get survey statistics'
      });
    }
  }
);

/**
 * @route POST /api/surveys/assign-existing-patient
 * @desc Assign existing patient to clinical study survey
 * @access Private (study_admin, org_admin, investigator, coordinator)
 */
router.post('/assign-existing-patient',
  authenticateJWT,
  checkPermission(['study_admin', 'org_admin', 'investigator', 'coordinator']),
  createSurveyValidation,
  validateRequest,
  async (req, res) => {
    try {
      const result = await surveyService.assignExistingPatientToStudy(req.body);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error assigning existing patient:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign patient to study'
      });
    }
  }
);

/**
 * @route PUT /api/surveys/:surveyId/withdraw
 * @desc Withdraw survey with reason
 * @access Private (study_admin, org_admin, investigator)
 */
router.put('/:surveyId/withdraw',
  authenticateJWT,
  checkPermission(['study_admin', 'org_admin', 'investigator']),
  [
    ...surveyIdValidation,
    body('reason').optional().isString().withMessage('Reason must be a string')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { surveyId } = req.params;
      const { reason } = req.body;
      
      const updatedSurvey = await surveyService.withdrawSurvey(surveyId, reason);
      
      res.json({
        success: true,
        data: updatedSurvey
      });
    } catch (error) {
      console.error('Error withdrawing survey:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to withdraw survey'
      });
    }
  }
);

export default router;