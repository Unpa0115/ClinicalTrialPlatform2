import express, { Request, Response } from 'express';
import { z } from 'zod';
import { getOrganizationService } from '../services/OrganizationService.js';
import { authenticateToken, AuthenticatedRequest, extractUserContext } from '../middleware/auth.js';
import { requireAction } from '../middleware/authorization.js';

const router = express.Router();

// Validation schemas
const addressSchema = z.object({
  country: z.string().min(1).max(100),
  prefecture: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  addressLine1: z.string().min(1).max(200),
  addressLine2: z.string().max(200).optional(),
  postalCode: z.string().min(1).max(20),
});

const createOrganizationSchema = z.object({
  organizationName: z.string().min(1).max(200),
  organizationCode: z.string().min(1).max(50),
  organizationType: z.enum(['hospital', 'clinic', 'research_center', 'university', 'other']),
  address: addressSchema,
  phoneNumber: z.string().min(1).max(50),
  email: z.string().email(),
  website: z.string().url().optional(),
  principalInvestigator: z.string().min(1).max(100),
  studyCoordinator: z.string().min(1).max(100),
  contactPerson: z.string().min(1).max(100),
  maxPatientCapacity: z.number().int().min(1),
  availableEquipment: z.array(z.string()),
  certifications: z.array(z.string()),
});

const updateOrganizationSchema = z.object({
  organizationName: z.string().min(1).max(200).optional(),
  organizationType: z.enum(['hospital', 'clinic', 'research_center', 'university', 'other']).optional(),
  address: addressSchema.optional(),
  phoneNumber: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  principalInvestigator: z.string().min(1).max(100).optional(),
  studyCoordinator: z.string().min(1).max(100).optional(),
  contactPerson: z.string().min(1).max(100).optional(),
  maxPatientCapacity: z.number().int().min(1).optional(),
  availableEquipment: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'pending_approval', 'suspended']).optional(),
  approvalDate: z.string().datetime().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'pending_approval', 'suspended']),
});

const updateCapacitySchema = z.object({
  maxPatientCapacity: z.number().int().min(0),
});

const addStudySchema = z.object({
  studyId: z.string().min(1),
});

const updateEquipmentSchema = z.object({
  availableEquipment: z.array(z.string()),
});

const updateCertificationsSchema = z.object({
  certifications: z.array(z.string()),
});

// ============================================================================
// ORGANIZATION MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/organizations
 * Create a new organization
 */
router.post('/', authenticateToken, requireAction('create', 'organization'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createOrganizationSchema.parse(req.body);
    const userContext = extractUserContext(req);

    const organizationService = getOrganizationService();
    const organization = await organizationService.createOrganization(validatedData, userContext.userId!);

    res.status(201).json({
      success: true,
      organization: {
        organizationId: organization.organizationId,
        organizationName: organization.organizationName,
        organizationCode: organization.organizationCode,
        organizationType: organization.organizationType,
        address: organization.address,
        phoneNumber: organization.phoneNumber,
        email: organization.email,
        website: organization.website,
        principalInvestigator: organization.principalInvestigator,
        studyCoordinator: organization.studyCoordinator,
        contactPerson: organization.contactPerson,
        maxPatientCapacity: organization.maxPatientCapacity,
        availableEquipment: organization.availableEquipment,
        certifications: organization.certifications,
        status: organization.status,
        activeStudies: organization.activeStudies,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create organization', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * GET /api/organizations
 * List organizations with optional filtering
 */
router.get('/', authenticateToken, requireAction('read', 'organization'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userContext = extractUserContext(req);
    const { status } = req.query;

    console.log('=== ORGANIZATIONS GET ENDPOINT ===');
    console.log('User context:', userContext);
    console.log('Status filter:', status);

    const organizationService = getOrganizationService();
    let organizations;

    if (userContext.role === 'org_admin' && userContext.organizationId) {
      // Organization admins can only see their own organization
      const org = await organizationService.getOrganizationById(userContext.organizationId);
      organizations = org ? [org] : [];
    } else {
      // For super_admin and study_admin, get all organizations or filter by status
      const params = status && typeof status === 'string' ? { status } : undefined;
      organizations = await organizationService.getOrganizations(params);
    }

    res.json({
      success: true,
      organizations: organizations.map(org => ({
        organizationId: org.organizationId,
        organizationName: org.organizationName,
        organizationCode: org.organizationCode,
        organizationType: org.organizationType,
        address: org.address,
        phoneNumber: org.phoneNumber,
        email: org.email,
        website: org.website,
        principalInvestigator: org.principalInvestigator,
        studyCoordinator: org.studyCoordinator,
        contactPerson: org.contactPerson,
        maxPatientCapacity: org.maxPatientCapacity,
        availableEquipment: org.availableEquipment,
        certifications: org.certifications,
        status: org.status,
        approvalDate: org.approvalDate,
        activeStudies: org.activeStudies,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error listing organizations:', error);
    res.status(500).json({ error: 'Failed to list organizations', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /api/organizations/:organizationId
 * Get organization details
 */
router.get('/:organizationId', authenticateToken, requireAction('read', 'organization'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.params;
    const userContext = extractUserContext(req);

    const organizationService = getOrganizationService();
    const organization = await organizationService.getOrganizationById(organizationId);

    if (!organization) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    // Check access permissions
    if (userContext.role === 'org_admin' && userContext.organizationId !== organizationId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({
      success: true,
      organization: {
        organizationId: organization.organizationId,
        organizationName: organization.organizationName,
        organizationCode: organization.organizationCode,
        organizationType: organization.organizationType,
        address: organization.address,
        phoneNumber: organization.phoneNumber,
        email: organization.email,
        website: organization.website,
        principalInvestigator: organization.principalInvestigator,
        studyCoordinator: organization.studyCoordinator,
        contactPerson: organization.contactPerson,
        maxPatientCapacity: organization.maxPatientCapacity,
        availableEquipment: organization.availableEquipment,
        certifications: organization.certifications,
        status: organization.status,
        approvalDate: organization.approvalDate,
        activeStudies: organization.activeStudies,
        createdBy: organization.createdBy,
        lastModifiedBy: organization.lastModifiedBy,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error getting organization:', error);
    res.status(500).json({ error: 'Failed to get organization', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * PUT /api/organizations/:organizationId
 * Update organization
 */
router.put('/:organizationId', authenticateToken, requireAction('update', 'organization'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.params;
    const validatedData = updateOrganizationSchema.parse(req.body);
    const userContext = extractUserContext(req);

    const organizationService = getOrganizationService();
    
    // Check if organization exists and user has access
    const existingOrg = await organizationService.getOrganizationById(organizationId);
    if (!existingOrg) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    if (userContext.role === 'org_admin' && userContext.organizationId !== organizationId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const updatedOrganization = await organizationService.updateOrganization(organizationId, validatedData, userContext.userId!);

    res.json({
      success: true,
      organization: {
        organizationId: updatedOrganization.organizationId,
        organizationName: updatedOrganization.organizationName,
        organizationCode: updatedOrganization.organizationCode,
        organizationType: updatedOrganization.organizationType,
        address: updatedOrganization.address,
        phoneNumber: updatedOrganization.phoneNumber,
        email: updatedOrganization.email,
        website: updatedOrganization.website,
        principalInvestigator: updatedOrganization.principalInvestigator,
        studyCoordinator: updatedOrganization.studyCoordinator,
        contactPerson: updatedOrganization.contactPerson,
        maxPatientCapacity: updatedOrganization.maxPatientCapacity,
        availableEquipment: updatedOrganization.availableEquipment,
        certifications: updatedOrganization.certifications,
        status: updatedOrganization.status,
        approvalDate: updatedOrganization.approvalDate,
        activeStudies: updatedOrganization.activeStudies,
        updatedAt: updatedOrganization.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update organization', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * PUT /api/organizations/:organizationId/status
 * Update organization status
 */
router.put('/:organizationId/status', authenticateToken, requireAction('update', 'organization'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.params;
    const validatedData = updateStatusSchema.parse(req.body);
    const userContext = extractUserContext(req);

    const organizationService = getOrganizationService();
    const updatedOrganization = await organizationService.updateOrganizationStatus(organizationId, validatedData.status, userContext.userId!);

    res.json({
      success: true,
      organization: {
        organizationId: updatedOrganization.organizationId,
        organizationName: updatedOrganization.organizationName,
        status: updatedOrganization.status,
        approvalDate: updatedOrganization.approvalDate,
        updatedAt: updatedOrganization.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating organization status:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update organization status', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * PUT /api/organizations/:organizationId/capacity
 * Update organization patient capacity
 */
router.put('/:organizationId/capacity', authenticateToken, requireAction('update', 'organization'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.params;
    const validatedData = updateCapacitySchema.parse(req.body);

    const organizationService = getOrganizationService();
    const updatedOrganization = await organizationService.updateOrganizationCapacity(organizationId, validatedData.maxPatientCapacity);

    res.json({
      success: true,
      organization: {
        organizationId: updatedOrganization.organizationId,
        organizationName: updatedOrganization.organizationName,
        maxPatientCapacity: updatedOrganization.maxPatientCapacity,
        updatedAt: updatedOrganization.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating organization capacity:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update organization capacity', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * POST /api/organizations/:organizationId/studies
 * Add study to organization
 */
router.post('/:organizationId/studies', authenticateToken, requireAction('update', 'organization'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.params;
    const validatedData = addStudySchema.parse(req.body);

    const organizationService = getOrganizationService();
    const updatedOrganization = await organizationService.addStudyToOrganization(organizationId, validatedData.studyId);

    res.json({
      success: true,
      organization: {
        organizationId: updatedOrganization.organizationId,
        organizationName: updatedOrganization.organizationName,
        activeStudies: updatedOrganization.activeStudies,
        updatedAt: updatedOrganization.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error adding study to organization:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to add study to organization', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * DELETE /api/organizations/:organizationId/studies/:studyId
 * Remove study from organization
 */
router.delete('/:organizationId/studies/:studyId', authenticateToken, requireAction('update', 'organization'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId, studyId } = req.params;

    const organizationService = getOrganizationService();
    const updatedOrganization = await organizationService.removeStudyFromOrganization(organizationId, studyId);

    res.json({
      success: true,
      organization: {
        organizationId: updatedOrganization.organizationId,
        organizationName: updatedOrganization.organizationName,
        activeStudies: updatedOrganization.activeStudies,
        updatedAt: updatedOrganization.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error removing study from organization:', error);
    res.status(500).json({ error: 'Failed to remove study from organization', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * PUT /api/organizations/:organizationId/equipment
 * Update organization equipment
 */
router.put('/:organizationId/equipment', authenticateToken, requireAction('update', 'organization'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.params;
    const validatedData = updateEquipmentSchema.parse(req.body);

    const organizationService = getOrganizationService();
    const updatedOrganization = await organizationService.updateOrganizationEquipment(organizationId, validatedData.availableEquipment);

    res.json({
      success: true,
      organization: {
        organizationId: updatedOrganization.organizationId,
        organizationName: updatedOrganization.organizationName,
        availableEquipment: updatedOrganization.availableEquipment,
        updatedAt: updatedOrganization.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating organization equipment:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update organization equipment', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * PUT /api/organizations/:organizationId/certifications
 * Update organization certifications
 */
router.put('/:organizationId/certifications', authenticateToken, requireAction('update', 'organization'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.params;
    const validatedData = updateCertificationsSchema.parse(req.body);

    const organizationService = getOrganizationService();
    const updatedOrganization = await organizationService.updateOrganizationCertifications(organizationId, validatedData.certifications);

    res.json({
      success: true,
      organization: {
        organizationId: updatedOrganization.organizationId,
        organizationName: updatedOrganization.organizationName,
        certifications: updatedOrganization.certifications,
        updatedAt: updatedOrganization.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating organization certifications:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update organization certifications', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/**
 * GET /api/organizations/:organizationId/statistics
 * Get organization statistics
 */
router.get('/:organizationId/statistics', authenticateToken, requireAction('read', 'organization'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.params;
    const userContext = extractUserContext(req);

    // Check access permissions
    if (userContext.role === 'org_admin' && userContext.organizationId !== organizationId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const organizationService = getOrganizationService();
    const statistics = await organizationService.getOrganizationStatistics(organizationId);

    res.json({
      success: true,
      statistics,
    });
  } catch (error) {
    console.error('Error getting organization statistics:', error);
    res.status(500).json({ error: 'Failed to get organization statistics', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * DELETE /api/organizations/:organizationId
 * Delete an organization (only for inactive/pending organizations with no active studies)
 */
router.delete('/:organizationId', authenticateToken, requireAction('delete', 'organization'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.params;
    const userContext = extractUserContext(req);

    const organizationService = getOrganizationService();
    
    // Check if organization exists
    const existingOrg = await organizationService.getOrganizationById(organizationId);
    if (!existingOrg) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    // Only allow deletion if organization is inactive or pending
    if (existingOrg.status !== 'inactive' && existingOrg.status !== 'pending_approval') {
      res.status(400).json({ error: 'Only inactive or pending organizations can be deleted' });
      return;
    }

    // Check if organization has active studies
    if (existingOrg.activeStudies && existingOrg.activeStudies.length > 0) {
      res.status(400).json({ error: 'Cannot delete organization with active studies. Please remove all studies first.' });
      return;
    }

    // Check access permissions - only super_admin can delete
    if (userContext.role !== 'super_admin') {
      res.status(403).json({ error: 'Insufficient permissions to delete organization' });
      return;
    }

    await organizationService.deleteOrganization(organizationId, userContext.userId!);

    res.json({
      success: true,
      message: `Organization "${existingOrg.organizationName}" has been deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({ error: 'Failed to delete organization', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;