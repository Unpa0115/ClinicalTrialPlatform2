import express from 'express';
import { VisitService } from '../services/VisitService.js';
import { authenticateJWT } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';
import { validateRequest } from '../middleware/validation.js';
import { body, param, query } from 'express-validator';

const router = express.Router();
const visitService = new VisitService();

// Validation schemas
const visitIdValidation = [
  param('visitId').isString().notEmpty().withMessage('Visit ID is required')
];

const scheduleVisitValidation = [
  body('surveyId').isString().notEmpty().withMessage('Survey ID is required'),
  body('visitId').isString().notEmpty().withMessage('Visit ID is required'),
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
  body('conductedBy').isString().notEmpty().withMessage('Conducted by is required'),
  body('notes').optional().isString()
];

const examinationCompletionValidation = [
  body('visitId').isString().notEmpty().withMessage('Visit ID is required'),
  body('examinationId').isString().notEmpty().withMessage('Examination ID is required'),
  body('completed').isBoolean().withMessage('Completed status is required'),
  body('notes').optional().isString()
];

const rescheduleValidation = [
  body('newScheduledDate').isISO8601().withMessage('Valid new scheduled date is required'),
  body('reason').optional().isString()
];

const statusUpdateValidation = [
  body('reason').optional().isString()
];

/**
 * @route POST /api/visits/schedule
 * @desc Schedule a visit with protocol compliance checking
 * @access Private (investigator, coordinator, data_entry)
 */
router.post('/schedule',
  authenticateJWT,
  checkPermission(['investigator', 'coordinator', 'data_entry']),
  scheduleVisitValidation,
  validateRequest,
  async (req, res) => {
    try {
      const result = await visitService.scheduleVisit(req.body);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error scheduling visit:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule visit'
      });
    }
  }
);

/**
 * @route PUT /api/visits/:visitId/start
 * @desc Start a visit (set status to in_progress)
 * @access Private (investigator, coordinator, data_entry)
 */
router.put('/:visitId/start',
  authenticateJWT,
  checkPermission(['investigator', 'coordinator', 'data_entry']),
  visitIdValidation,
  [body('conductedBy').optional().isString()],
  validateRequest,
  async (req, res) => {
    try {
      const { visitId } = req.params;
      const { conductedBy } = req.body;
      
      const visit = await visitService.startVisit(visitId, conductedBy);
      res.json({
        success: true,
        data: visit
      });
    } catch (error) {
      console.error('Error starting visit:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start visit'
      });
    }
  }
);

/**
 * @route PUT /api/visits/examination/complete
 * @desc Complete or skip an examination within a visit
 * @access Private (investigator, coordinator, data_entry)
 */
router.put('/examination/complete',
  authenticateJWT,
  checkPermission(['investigator', 'coordinator', 'data_entry']),
  examinationCompletionValidation,
  validateRequest,
  async (req, res) => {
    try {
      const result = await visitService.completeExamination(req.body);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error completing examination:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update examination'
      });
    }
  }
);

/**
 * @route PUT /api/visits/:visitId/complete
 * @desc Complete a visit
 * @access Private (investigator, coordinator, data_entry)
 */
router.put('/:visitId/complete',
  authenticateJWT,
  checkPermission(['investigator', 'coordinator', 'data_entry']),
  visitIdValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { visitId } = req.params;
      const result = await visitService.completeVisit(visitId);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error completing visit:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete visit'
      });
    }
  }
);

/**
 * @route GET /api/visits/:visitId/configuration
 * @desc Get visit configuration with examination details
 * @access Private (all authenticated users with access to the visit)
 */
router.get('/:visitId/configuration',
  authenticateJWT,
  visitIdValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { visitId } = req.params;
      const configuration = await visitService.getVisitConfiguration(visitId);
      res.json({
        success: true,
        data: configuration
      });
    } catch (error) {
      console.error('Error getting visit configuration:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to get visit configuration'
        });
      }
    }
  }
);

/**
 * @route PUT /api/visits/:visitId/configuration
 * @desc Update visit examination configuration (for dynamic visits)
 * @access Private (study_admin, org_admin, investigator)
 */
router.put('/:visitId/configuration',
  authenticateJWT,
  checkPermission(['study_admin', 'org_admin', 'investigator']),
  visitIdValidation,
  [
    body('requiredExaminations').isArray().withMessage('Required examinations must be an array'),
    body('optionalExaminations').isArray().withMessage('Optional examinations must be an array'),
    body('examinationOrder').isArray().withMessage('Examination order must be an array')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { visitId } = req.params;
      const { requiredExaminations, optionalExaminations, examinationOrder } = req.body;
      
      const visit = await visitService.updateExaminationConfiguration(visitId, {
        requiredExaminations,
        optionalExaminations,
        examinationOrder
      });
      
      res.json({
        success: true,
        data: visit
      });
    } catch (error) {
      console.error('Error updating visit configuration:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update visit configuration'
      });
    }
  }
);

/**
 * @route PUT /api/visits/:visitId/reschedule
 * @desc Reschedule a visit
 * @access Private (investigator, coordinator)
 */
router.put('/:visitId/reschedule',
  authenticateJWT,
  checkPermission(['investigator', 'coordinator']),
  visitIdValidation,
  rescheduleValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { visitId } = req.params;
      const { newScheduledDate, reason } = req.body;
      
      const result = await visitService.rescheduleVisit(visitId, newScheduledDate, reason);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error rescheduling visit:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reschedule visit'
      });
    }
  }
);

/**
 * @route PUT /api/visits/:visitId/missed
 * @desc Mark visit as missed
 * @access Private (investigator, coordinator)
 */
router.put('/:visitId/missed',
  authenticateJWT,
  checkPermission(['investigator', 'coordinator']),
  visitIdValidation,
  statusUpdateValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { visitId } = req.params;
      const { reason } = req.body;
      
      const visit = await visitService.markVisitMissed(visitId, reason);
      res.json({
        success: true,
        data: visit
      });
    } catch (error) {
      console.error('Error marking visit as missed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark visit as missed'
      });
    }
  }
);

/**
 * @route PUT /api/visits/:visitId/cancel
 * @desc Cancel a visit
 * @access Private (investigator, coordinator)
 */
router.put('/:visitId/cancel',
  authenticateJWT,
  checkPermission(['investigator', 'coordinator']),
  visitIdValidation,
  statusUpdateValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { visitId } = req.params;
      const { reason } = req.body;
      
      const visit = await visitService.cancelVisit(visitId, reason);
      res.json({
        success: true,
        data: visit
      });
    } catch (error) {
      console.error('Error cancelling visit:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel visit'
      });
    }
  }
);

/**
 * @route GET /api/visits/protocol-deviations
 * @desc Get protocol deviations for visits
 * @access Private (org_admin, study_admin, investigator)
 */
router.get('/protocol-deviations',
  authenticateJWT,
  checkPermission(['org_admin', 'study_admin', 'investigator']),
  [query('organizationId').optional().isString()],
  validateRequest,
  async (req, res) => {
    try {
      const { organizationId } = req.query;
      const deviations = await visitService.detectProtocolDeviations(organizationId as string);
      res.json({
        success: true,
        data: deviations
      });
    } catch (error) {
      console.error('Error detecting protocol deviations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to detect protocol deviations'
      });
    }
  }
);

/**
 * @route GET /api/visits/statistics
 * @desc Get visit statistics with dynamic examination tracking
 * @access Private (org_admin, study_admin, investigator)
 */
router.get('/statistics',
  authenticateJWT,
  checkPermission(['org_admin', 'study_admin', 'investigator']),
  [
    query('surveyId').optional().isString(),
    query('organizationId').optional().isString()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { surveyId, organizationId } = req.query;
      
      if (!surveyId && !organizationId) {
        return res.status(400).json({
          success: false,
          error: 'Either surveyId or organizationId must be provided'
        });
      }
      
      const statistics = await visitService.getVisitStatistics(
        surveyId as string,
        organizationId as string
      );
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Error getting visit statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get visit statistics'
      });
    }
  }
);

export default router;