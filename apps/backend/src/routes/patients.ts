import express, { Request, Response } from 'express';
import { z } from 'zod';
import { getPatientService } from '../services/PatientService.js';
import { authenticateToken, AuthenticatedRequest, extractUserContext } from '../middleware/auth.js';
import { requireAction } from '../middleware/authorization.js';

const router = express.Router();

// Validation schemas
const contactInfoSchema = z.object({
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  emergencyContact: z.string().max(100).optional(),
}).optional();

const createPatientSchema = z.object({
  patientCode: z.string().min(3).max(20),
  patientInitials: z.string().max(10).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  registeredOrganizationId: z.string().min(1),
  medicalHistory: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  contactInfo: contactInfoSchema,
});

const updatePatientSchema = z.object({
  patientInitials: z.string().max(10).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  medicalHistory: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  contactInfo: contactInfoSchema,
  status: z.enum(['active', 'inactive', 'withdrawn', 'completed']).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'withdrawn', 'completed']),
});

const updateMedicalInfoSchema = z.object({
  medicalHistory: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
});

const updateContactInfoSchema = z.object({
  contactInfo: z.object({
    phone: z.string().max(50).optional(),
    email: z.string().email().optional(),
    emergencyContact: z.string().max(100).optional(),
  }),
});

const assignToSurveySchema = z.object({
  clinicalStudyId: z.string().min(1),
  organizationId: z.string().min(1),
  baselineDate: z.string(),
});

const removeFromStudySchema = z.object({
  studyId: z.string().min(1),
});

// ============================================================================
// PATIENT MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/patients
 * Create a new patient
 */
router.post('/', authenticateToken, requireAction('create', 'patient'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createPatientSchema.parse(req.body);
    const userContext = extractUserContext(req);

    // Check if user has access to the organization
    if (userContext.role === 'org_admin' && userContext.organizationId !== validatedData.registeredOrganizationId) {
      res.status(403).json({ error: 'Access denied: Cannot create patient for different organization' });
      return;
    }

    const patientService = getPatientService();
    const patient = await patientService.createPatient(validatedData, userContext.userId!);

    res.status(201).json({
      success: true,
      patient: {
        patientId: patient.patientId,
        patientCode: patient.patientCode,
        patientInitials: patient.patientInitials,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        registeredOrganizationId: patient.registeredOrganizationId,
        registrationDate: patient.registrationDate,
        medicalHistory: patient.medicalHistory,
        currentMedications: patient.currentMedications,
        allergies: patient.allergies,
        contactInfo: patient.contactInfo,
        status: patient.status,
        participatingStudies: patient.participatingStudies,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create patient', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * GET /api/patients
 * Search patients with optional filters
 */
router.get('/', authenticateToken, requireAction('read', 'patient'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userContext = extractUserContext(req);
    const { organizationId, patientCodePrefix, status, limit, exclusiveStartKey } = req.query;

    console.log('Patient search request:', {
      userContext: { role: userContext.role, organizationId: userContext.organizationId },
      queryParams: { organizationId, patientCodePrefix, status, limit, exclusiveStartKey }
    });

    let targetOrganizationId: string;

    if (userContext.role === 'org_admin') {
      // Organization admins can only see patients from their organization
      targetOrganizationId = userContext.organizationId!;
    } else if (organizationId && typeof organizationId === 'string') {
      // Super admins and study admins can specify organization
      targetOrganizationId = organizationId;
    } else {
      res.status(400).json({ error: 'Organization ID is required' });
      return;
    }

    const searchOptions = {
      patientCodePrefix: typeof patientCodePrefix === 'string' ? patientCodePrefix : undefined,
      status: typeof status === 'string' ? status as any : undefined,
      limit: typeof limit === 'string' ? parseInt(limit) : undefined,
      exclusiveStartKey: typeof exclusiveStartKey === 'string' ? JSON.parse(exclusiveStartKey) : undefined,
    };

    console.log('Search options:', { targetOrganizationId, searchOptions });

    const patientService = getPatientService();
    const result = await patientService.searchPatientsByOrganization(targetOrganizationId, searchOptions);

    res.json({
      success: true,
      patients: result.patients.map(patient => ({
        patientId: patient.patientId,
        patientCode: patient.patientCode,
        patientInitials: patient.patientInitials,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        registeredOrganizationId: patient.registeredOrganizationId,
        registrationDate: patient.registrationDate,
        medicalHistory: patient.medicalHistory,
        currentMedications: patient.currentMedications,
        allergies: patient.allergies,
        contactInfo: patient.contactInfo,
        status: patient.status,
        participatingStudies: patient.participatingStudies,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
      })),
      pagination: {
        lastEvaluatedKey: result.lastEvaluatedKey,
      },
    });
  } catch (error) {
    console.error('Error searching patients:', error);
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.errors);
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to search patients', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * GET /api/patients/:patientId
 * Get patient details
 */
router.get('/:patientId', authenticateToken, requireAction('read', 'patient'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const userContext = extractUserContext(req);

    const patientService = getPatientService();
    const patient = await patientService.getPatientById(patientId);

    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    // Check access permissions
    if (userContext.role === 'org_admin' && userContext.organizationId !== patient.registeredOrganizationId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({
      success: true,
      patient: {
        patientId: patient.patientId,
        patientCode: patient.patientCode,
        patientInitials: patient.patientInitials,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        registeredOrganizationId: patient.registeredOrganizationId,
        registrationDate: patient.registrationDate,
        medicalHistory: patient.medicalHistory,
        currentMedications: patient.currentMedications,
        allergies: patient.allergies,
        contactInfo: patient.contactInfo,
        status: patient.status,
        participatingStudies: patient.participatingStudies,
        createdBy: patient.createdBy,
        lastModifiedBy: patient.lastModifiedBy,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error getting patient:', error);
    res.status(500).json({ error: 'Failed to get patient', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * PUT /api/patients/:patientId
 * Update patient
 */
router.put('/:patientId', authenticateToken, requireAction('update', 'patient'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const validatedData = updatePatientSchema.parse(req.body);
    const userContext = extractUserContext(req);

    const patientService = getPatientService();
    
    // Check if patient exists and user has access
    const existingPatient = await patientService.getPatientById(patientId);
    if (!existingPatient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    if (userContext.role === 'org_admin' && userContext.organizationId !== existingPatient.registeredOrganizationId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const updatedPatient = await patientService.updatePatient(patientId, validatedData, userContext.userId!);

    res.json({
      success: true,
      patient: {
        patientId: updatedPatient.patientId,
        patientCode: updatedPatient.patientCode,
        patientInitials: updatedPatient.patientInitials,
        dateOfBirth: updatedPatient.dateOfBirth,
        gender: updatedPatient.gender,
        registeredOrganizationId: updatedPatient.registeredOrganizationId,
        registrationDate: updatedPatient.registrationDate,
        medicalHistory: updatedPatient.medicalHistory,
        currentMedications: updatedPatient.currentMedications,
        allergies: updatedPatient.allergies,
        contactInfo: updatedPatient.contactInfo,
        status: updatedPatient.status,
        participatingStudies: updatedPatient.participatingStudies,
        updatedAt: updatedPatient.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update patient', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * PUT /api/patients/:patientId/status
 * Update patient status
 */
router.put('/:patientId/status', authenticateToken, requireAction('update', 'patient'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const validatedData = updateStatusSchema.parse(req.body);
    const userContext = extractUserContext(req);

    const patientService = getPatientService();
    const updatedPatient = await patientService.updatePatientStatus(patientId, validatedData.status, userContext.userId!);

    res.json({
      success: true,
      patient: {
        patientId: updatedPatient.patientId,
        patientCode: updatedPatient.patientCode,
        status: updatedPatient.status,
        updatedAt: updatedPatient.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating patient status:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update patient status', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * PUT /api/patients/:patientId/medical-info
 * Update patient medical information
 */
router.put('/:patientId/medical-info', authenticateToken, requireAction('update', 'patient'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const validatedData = updateMedicalInfoSchema.parse(req.body);
    const userContext = extractUserContext(req);

    const patientService = getPatientService();
    const updatedPatient = await patientService.updatePatientMedicalInfo(patientId, validatedData, userContext.userId!);

    res.json({
      success: true,
      patient: {
        patientId: updatedPatient.patientId,
        patientCode: updatedPatient.patientCode,
        medicalHistory: updatedPatient.medicalHistory,
        currentMedications: updatedPatient.currentMedications,
        allergies: updatedPatient.allergies,
        updatedAt: updatedPatient.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating patient medical info:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update patient medical info', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * PUT /api/patients/:patientId/contact-info
 * Update patient contact information
 */
router.put('/:patientId/contact-info', authenticateToken, requireAction('update', 'patient'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const validatedData = updateContactInfoSchema.parse(req.body);
    const userContext = extractUserContext(req);

    const patientService = getPatientService();
    const updatedPatient = await patientService.updatePatientContactInfo(patientId, validatedData.contactInfo, userContext.userId!);

    res.json({
      success: true,
      patient: {
        patientId: updatedPatient.patientId,
        patientCode: updatedPatient.patientCode,
        contactInfo: updatedPatient.contactInfo,
        updatedAt: updatedPatient.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating patient contact info:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update patient contact info', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * POST /api/patients/:patientId/assign-survey
 * Assign existing patient to survey (clinical study)
 */
router.post('/:patientId/assign-survey', authenticateToken, requireAction('create', 'survey'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const validatedData = assignToSurveySchema.parse(req.body);
    const userContext = extractUserContext(req);

    const patientService = getPatientService();
    const survey = await patientService.assignPatientToSurvey({
      patientId,
      clinicalStudyId: validatedData.clinicalStudyId,
      organizationId: validatedData.organizationId,
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
    console.error('Error assigning patient to survey:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to assign patient to survey', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * DELETE /api/patients/:patientId/studies/:studyId
 * Remove patient from study
 */
router.delete('/:patientId/studies/:studyId', authenticateToken, requireAction('update', 'patient'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId, studyId } = req.params;
    const userContext = extractUserContext(req);

    const patientService = getPatientService();
    const updatedPatient = await patientService.removePatientFromStudy(patientId, studyId, userContext.userId!);

    res.json({
      success: true,
      patient: {
        patientId: updatedPatient.patientId,
        patientCode: updatedPatient.patientCode,
        participatingStudies: updatedPatient.participatingStudies,
        updatedAt: updatedPatient.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error removing patient from study:', error);
    res.status(500).json({ error: 'Failed to remove patient from study', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /api/patients/:patientId/participation
 * Get patient participation tracking
 */
router.get('/:patientId/participation', authenticateToken, requireAction('read', 'patient'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const userContext = extractUserContext(req);

    const patientService = getPatientService();
    const participation = await patientService.getPatientParticipation(patientId);

    // Check access permissions
    if (userContext.role === 'org_admin' && userContext.organizationId !== participation.patient.registeredOrganizationId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({
      success: true,
      participation: {
        patient: {
          patientId: participation.patient.patientId,
          patientCode: participation.patient.patientCode,
          patientInitials: participation.patient.patientInitials,
          status: participation.patient.status,
          registeredOrganizationId: participation.patient.registeredOrganizationId,
        },
        surveys: participation.surveys.map(survey => ({
          surveyId: survey.surveyId,
          clinicalStudyId: survey.clinicalStudyId,
          name: survey.name,
          status: survey.status,
          completionPercentage: survey.completionPercentage,
          totalVisits: survey.totalVisits,
          completedVisits: survey.completedVisits,
          baselineDate: survey.baselineDate,
          expectedCompletionDate: survey.expectedCompletionDate,
        })),
        statistics: {
          totalStudies: participation.totalStudies,
          activeStudies: participation.activeStudies,
          completedStudies: participation.completedStudies,
        },
      },
    });
  } catch (error) {
    console.error('Error getting patient participation:', error);
    res.status(500).json({ error: 'Failed to get patient participation', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * DELETE /api/patients/:patientId
 * Delete patient
 */
router.delete('/:patientId', authenticateToken, requireAction('delete', 'patient'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const userContext = extractUserContext(req);

    const patientService = getPatientService();
    
    // Check if patient exists and user has access
    const existingPatient = await patientService.getPatientById(patientId);
    if (!existingPatient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    // Only allow deletion if patient status is inactive
    if (existingPatient.status !== 'inactive') {
      res.status(400).json({ error: 'Only inactive patients can be deleted' });
      return;
    }

    if (userContext.role === 'org_admin' && userContext.organizationId !== existingPatient.registeredOrganizationId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await patientService.deletePatient(patientId, userContext.userId!);

    res.json({
      success: true,
      message: `Patient ${existingPatient.patientCode} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /api/patients/organizations/:organizationId/statistics
 * Get organization patient statistics
 */
router.get('/organizations/:organizationId/statistics', authenticateToken, requireAction('read', 'patient'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.params;
    const userContext = extractUserContext(req);

    // Check access permissions
    if (userContext.role === 'org_admin' && userContext.organizationId !== organizationId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const patientService = getPatientService();
    const statistics = await patientService.getOrganizationPatientStatistics(organizationId);

    res.json({
      success: true,
      statistics,
    });
  } catch (error) {
    console.error('Error getting organization patient statistics:', error);
    res.status(500).json({ error: 'Failed to get organization patient statistics', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;