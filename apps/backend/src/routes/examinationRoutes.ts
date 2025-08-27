import express from 'express';
import { ExaminationService } from '../services/ExaminationService.js';
import { z } from 'zod';

const router = express.Router();
const examinationService = new ExaminationService();

// Simple middleware for now (skip authentication for testing)
const skipAuth = (req: any, res: any, next: any) => {
  // Mock user for testing
  req.user = {
    sub: 'test-user',
    username: 'test-user',
    email: 'test@example.com',
    organizationId: 'org-admin-001',
    role: 'super_admin'
  };
  next();
};

// Validation middleware
const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ error: 'Validation failed', details: error });
    }
  };
};

// Draft Data validation schemas
const saveDraftSchema = z.object({
  formData: z.record(z.object({
    right: z.any().optional(),
    left: z.any().optional(),
  })),
  currentStep: z.number(),
  totalSteps: z.number(),
  completedSteps: z.array(z.string()),
  examinationOrder: z.array(z.string()),
  autoSaved: z.boolean().optional().default(false),
});

const submitExaminationSchema = z.object({
  formData: z.record(z.object({
    right: z.any().optional(),
    left: z.any().optional(),
  })),
  completedExaminations: z.array(z.string()),
  conductedBy: z.string(),
});

// Get visit configuration and examination order
router.get('/visits/:visitId/config', 
  skipAuth,
  async (req, res) => {
    try {
      const { visitId } = req.params;
      const config = await examinationService.getVisitExaminationConfig(visitId);
      res.json(config);
    } catch (error) {
      console.error('Failed to get visit configuration:', error);
      res.status(500).json({ error: 'Failed to get visit configuration' });
    }
  }
);

// Load draft data
router.get('/visits/:visitId/draft', 
  skipAuth,
  async (req, res) => {
    try {
      const { visitId } = req.params;
      const draft = await examinationService.loadDraft(visitId);
      res.json(draft);
    } catch (error) {
      console.error('Failed to load draft:', error);
      res.status(500).json({ error: 'Failed to load draft' });
    }
  }
);

// Save draft data
router.post('/visits/:visitId/draft', 
  skipAuth,
  validate(saveDraftSchema),
  async (req, res) => {
    try {
      const { visitId } = req.params;
      const draftData = req.body;
      
      console.log('Manual draft save request:', { visitId, draftData: JSON.stringify(draftData, null, 2) });
      
      const result = await examinationService.saveDraft(visitId, draftData);
      console.log('Manual draft save success:', result);
      res.json(result);
    } catch (error) {
      console.error('Failed to save draft - detailed error:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({ error: 'Failed to save draft', details: error.message });
    }
  }
);

// Auto-save draft data
router.put('/visits/:visitId/draft/autosave', 
  skipAuth,
  async (req, res) => {
    try {
      const { visitId } = req.params;
      const updates = req.body;
      
      const result = await examinationService.autoSaveDraft(visitId, updates);
      res.json(result);
    } catch (error) {
      console.error('Auto-save failed:', error);
      res.status(500).json({ error: 'Auto-save failed' });
    }
  }
);

// Get all examination data for a visit
router.get('/visits/:visitId/examinations', 
  skipAuth,
  async (req, res) => {
    try {
      const { visitId } = req.params;
      const examinations = await examinationService.getAllExaminationData(visitId);
      res.json(examinations);
    } catch (error) {
      console.error('Failed to get examination data:', error);
      res.status(500).json({ error: 'Failed to get examination data' });
    }
  }
);

// Submit complete examination data
router.post('/visits/:visitId/examinations/submit', 
  skipAuth,
  validate(submitExaminationSchema),
  async (req, res) => {
    try {
      const { visitId } = req.params;
      const { formData, completedExaminations, conductedBy } = req.body;
      
      const result = await examinationService.submitExaminationData(
        visitId, 
        formData, 
        completedExaminations, 
        conductedBy
      );
      
      res.json(result);
    } catch (error) {
      console.error('Failed to submit examination data:', error);
      res.status(500).json({ error: 'Failed to submit examination data' });
    }
  }
);

// Save specific examination data
router.post('/visits/:visitId/examinations/:examinationId',
  skipAuth,
  async (req, res) => {
    try {
      const { visitId, examinationId } = req.params;
      const { rightEyeData, leftEyeData, surveyId, patientId, clinicalStudyId, organizationId } = req.body;
      
      const result = await examinationService.saveExaminationData(
        visitId,
        examinationId,
        rightEyeData,
        leftEyeData,
        surveyId,
        patientId,
        clinicalStudyId,
        organizationId
      );
      
      res.json(result);
    } catch (error) {
      console.error('Failed to save examination data:', error);
      res.status(500).json({ error: 'Failed to save examination data' });
    }
  }
);

// Update examination data
router.put('/visits/:visitId/examinations/:examinationId/:eyeside',
  skipAuth,
  async (req, res) => {
    try {
      const { visitId, examinationId, eyeside } = req.params;
      const updateData = req.body;
      
      if (!['right', 'left'].includes(eyeside)) {
        return res.status(400).json({ error: 'Invalid eyeside parameter' });
      }
      
      const result = await examinationService.updateExaminationData(
        visitId,
        examinationId,
        eyeside as 'right' | 'left',
        updateData
      );
      
      res.json(result);
    } catch (error) {
      console.error('Failed to update examination data:', error);
      res.status(500).json({ error: 'Failed to update examination data' });
    }
  }
);

// Get examination data for comparison
router.get('/surveys/:surveyId/examinations/:examinationId/comparison',
  skipAuth,
  async (req, res) => {
    try {
      const { surveyId, examinationId } = req.params;
      const { eyeside } = req.query;
      
      if (!eyeside || !['right', 'left'].includes(eyeside as string)) {
        return res.status(400).json({ error: 'Valid eyeside query parameter required' });
      }
      
      const comparison = await examinationService.getExaminationComparison(
        surveyId,
        examinationId,
        eyeside as 'right' | 'left'
      );
      
      res.json(comparison);
    } catch (error) {
      console.error('Failed to get examination comparison:', error);
      res.status(500).json({ error: 'Failed to get examination comparison' });
    }
  }
);

// Get draft statistics
router.get('/visits/:visitId/draft/stats',
  skipAuth,
  async (req, res) => {
    try {
      const { visitId } = req.params;
      const stats = await examinationService.getDraftStats(visitId);
      res.json(stats);
    } catch (error) {
      console.error('Failed to get draft stats:', error);
      res.status(500).json({ error: 'Failed to get draft stats' });
    }
  }
);

// Clear draft data
router.delete('/visits/:visitId/draft',
  skipAuth,
  async (req, res) => {
    try {
      const { visitId } = req.params;
      await examinationService.clearDraft(visitId);
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to clear draft:', error);
      res.status(500).json({ error: 'Failed to clear draft' });
    }
  }
);

// Validate examination data
router.post('/visits/:visitId/examinations/validate',
  skipAuth,
  async (req, res) => {
    try {
      const { visitId } = req.params;
      const validation = await examinationService.validateExaminationData(visitId);
      res.json(validation);
    } catch (error) {
      console.error('Failed to validate examination data:', error);
      res.status(500).json({ error: 'Failed to validate examination data' });
    }
  }
);

export default router;