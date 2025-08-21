import { BaseRepository } from './BaseRepository.js';
import { tableNames } from '../config/database.js';

/**
 * Draft data record interface for flexible examination configurations
 */
export interface DraftRecord {
  visitId: string;
  draftId: 'current'; // Fixed value for current draft
  formData: {
    [examinationId: string]: {
      right?: any;
      left?: any;
    };
  };
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  examinationOrder: string[];
  lastSaved: string;
  autoSaved: boolean;
  ttl: number; // Unix timestamp for TTL (30 days)
}

/**
 * Repository for DraftData table operations
 * Handles unified draft management across flexible examination configurations
 */
export class DraftDataRepository extends BaseRepository<DraftRecord> {
  constructor() {
    super(tableNames.draftData);
  }

  protected getPrimaryKeyName(): string {
    return 'visitId';
  }

  protected getSortKeyName(): string | null {
    return 'draftId';
  }

  protected getIndexPartitionKeyName(indexName: string): string | null {
    return null;
  }

  protected getIndexSortKeyName(indexName: string): string | null {
    return null;
  }

  /**
   * Save draft data with automatic TTL setting (30 days)
   */
  async saveDraft(
    visitId: string,
    formData: DraftRecord['formData'],
    currentStep: number,
    totalSteps: number,
    completedSteps: string[],
    examinationOrder: string[],
    autoSaved: boolean = true
  ): Promise<DraftRecord> {
    const now = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now

    const draftRecord: DraftRecord = {
      visitId,
      draftId: 'current',
      formData,
      currentStep,
      totalSteps,
      completedSteps,
      examinationOrder,
      lastSaved: now,
      autoSaved,
      ttl,
    };

    return await this.create(draftRecord);
  }

  /**
   * Update existing draft data
   */
  async updateDraft(
    visitId: string,
    updates: Partial<Omit<DraftRecord, 'visitId' | 'draftId' | 'ttl'>>
  ): Promise<DraftRecord> {
    const updatedData = {
      ...updates,
      lastSaved: new Date().toISOString(),
    };

    return await this.update(visitId, updatedData, 'current');
  }

  /**
   * Get current draft for a visit
   */
  async getDraft(visitId: string): Promise<DraftRecord | null> {
    return await this.findById(visitId, 'current');
  }

  /**
   * Update form data for specific examination
   */
  async updateExaminationData(
    visitId: string,
    examinationId: string,
    eyeside: 'right' | 'left',
    data: any
  ): Promise<DraftRecord> {
    const draft = await this.getDraft(visitId);
    if (!draft) {
      throw new Error(`No draft found for visit ${visitId}`);
    }

    const updatedFormData = { ...draft.formData };
    if (!updatedFormData[examinationId]) {
      updatedFormData[examinationId] = {};
    }
    updatedFormData[examinationId][eyeside] = data;

    return await this.updateDraft(visitId, { 
      formData: updatedFormData,
      autoSaved: true
    });
  }

  /**
   * Update current step progress
   */
  async updateProgress(
    visitId: string,
    currentStep: number,
    completedSteps: string[]
  ): Promise<DraftRecord> {
    return await this.updateDraft(visitId, {
      currentStep,
      completedSteps,
      autoSaved: true
    });
  }

  /**
   * Mark step as completed
   */
  async completeStep(visitId: string, stepId: string): Promise<DraftRecord> {
    const draft = await this.getDraft(visitId);
    if (!draft) {
      throw new Error(`No draft found for visit ${visitId}`);
    }

    const updatedCompletedSteps = [...draft.completedSteps];
    if (!updatedCompletedSteps.includes(stepId)) {
      updatedCompletedSteps.push(stepId);
    }

    // Update current step if this was the current step
    let newCurrentStep = draft.currentStep;
    const currentStepIndex = draft.examinationOrder.indexOf(stepId);
    if (currentStepIndex === draft.currentStep) {
      newCurrentStep = Math.min(draft.currentStep + 1, draft.totalSteps - 1);
    }

    return await this.updateDraft(visitId, {
      currentStep: newCurrentStep,
      completedSteps: updatedCompletedSteps,
      autoSaved: true
    });
  }

  /**
   * Clear draft data (called after final submission)
   */
  async clearDraft(visitId: string): Promise<void> {
    await this.delete(visitId, 'current');
  }

  /**
   * Get draft statistics
   */
  async getDraftStats(visitId: string): Promise<{
    exists: boolean;
    completionPercentage: number;
    completedSteps: number;
    totalSteps: number;
    lastSaved?: string;
    autoSaved?: boolean;
  } | null> {
    const draft = await this.getDraft(visitId);
    if (!draft) {
      return { 
        exists: false, 
        completionPercentage: 0, 
        completedSteps: 0, 
        totalSteps: 0 
      };
    }

    const completionPercentage = draft.totalSteps > 0 
      ? Math.round((draft.completedSteps.length / draft.totalSteps) * 100)
      : 0;

    return {
      exists: true,
      completionPercentage,
      completedSteps: draft.completedSteps.length,
      totalSteps: draft.totalSteps,
      lastSaved: draft.lastSaved,
      autoSaved: draft.autoSaved,
    };
  }

  /**
   * Batch operations for left/right eye data management
   */
  async batchUpdateEyeData(
    visitId: string,
    examinationId: string,
    data: {
      right?: any;
      left?: any;
    }
  ): Promise<DraftRecord> {
    const draft = await this.getDraft(visitId);
    if (!draft) {
      throw new Error(`No draft found for visit ${visitId}`);
    }

    const updatedFormData = { ...draft.formData };
    if (!updatedFormData[examinationId]) {
      updatedFormData[examinationId] = {};
    }

    // Update both eyes if provided
    if (data.right !== undefined) {
      updatedFormData[examinationId].right = data.right;
    }
    if (data.left !== undefined) {
      updatedFormData[examinationId].left = data.left;
    }

    return await this.updateDraft(visitId, { 
      formData: updatedFormData,
      autoSaved: true
    });
  }

  /**
   * Initialize draft for new visit with dynamic configuration
   */
  async initializeDraft(
    visitId: string,
    examinationOrder: string[]
  ): Promise<DraftRecord> {
    const emptyFormData: DraftRecord['formData'] = {};
    examinationOrder.forEach(examId => {
      emptyFormData[examId] = {};
    });

    return await this.saveDraft(
      visitId,
      emptyFormData,
      0, // Start at first step
      examinationOrder.length,
      [], // No completed steps initially
      examinationOrder,
      false // Manual initialization
    );
  }

  /**
   * Check if draft has unsaved changes
   */
  async hasUnsavedChanges(visitId: string): Promise<boolean> {
    const draft = await this.getDraft(visitId);
    if (!draft) return false;

    // Check if last saved was more than 30 seconds ago (auto-save interval)
    const lastSavedTime = new Date(draft.lastSaved).getTime();
    const now = Date.now();
    const timeDiff = now - lastSavedTime;

    return timeDiff > 30000 && !draft.autoSaved; // 30 seconds
  }

  /**
   * Validate examination data before saving to individual tables
   */
  async validateFormData(visitId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    missingRequired: string[];
  }> {
    const draft = await this.getDraft(visitId);
    if (!draft) {
      return {
        isValid: false,
        errors: ['No draft data found'],
        warnings: [],
        missingRequired: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const missingRequired: string[] = [];

    // Check if all required examinations have data for both eyes
    draft.examinationOrder.forEach(examId => {
      const examData = draft.formData[examId];
      if (!examData || (!examData.right && !examData.left)) {
        missingRequired.push(`${examId} - no data for either eye`);
      } else {
        if (!examData.right) warnings.push(`${examId} - missing right eye data`);
        if (!examData.left) warnings.push(`${examId} - missing left eye data`);
      }
    });

    // Validate data consistency
    Object.entries(draft.formData).forEach(([examId, examData]) => {
      if (examData.right && examData.left) {
        // Check for significant discrepancies between eyes (placeholder logic)
        // This could be expanded with specific validation rules per examination type
        const hasDiscrepancies = this.checkEyeDataConsistency(examData.right, examData.left, examId);
        if (hasDiscrepancies) {
          warnings.push(`${examId} - significant difference between right and left eye data`);
        }
      }
    });

    const isValid = errors.length === 0 && missingRequired.length === 0;

    return {
      isValid,
      errors,
      warnings,
      missingRequired
    };
  }

  /**
   * Get form completion summary
   */
  async getCompletionSummary(visitId: string): Promise<{
    totalExaminations: number;
    completedExaminations: number;
    partiallyCompleted: number;
    notStarted: number;
    examinationStatus: {
      [examId: string]: {
        status: 'completed' | 'partial' | 'not_started';
        rightEye: boolean;
        leftEye: boolean;
        lastUpdated?: string;
      };
    };
    readyForSubmission: boolean;
  } | null> {
    const draft = await this.getDraft(visitId);
    if (!draft) {
      return null;
    }

    const examinationStatus: any = {};
    let completedExaminations = 0;
    let partiallyCompleted = 0;
    let notStarted = 0;

    draft.examinationOrder.forEach(examId => {
      const examData = draft.formData[examId];
      const hasRightEye = !!(examData?.right);
      const hasLeftEye = !!(examData?.left);

      let status: 'completed' | 'partial' | 'not_started';
      if (hasRightEye && hasLeftEye) {
        status = 'completed';
        completedExaminations++;
      } else if (hasRightEye || hasLeftEye) {
        status = 'partial';
        partiallyCompleted++;
      } else {
        status = 'not_started';
        notStarted++;
      }

      examinationStatus[examId] = {
        status,
        rightEye: hasRightEye,
        leftEye: hasLeftEye,
        lastUpdated: draft.lastSaved
      };
    });

    const readyForSubmission = completedExaminations === draft.examinationOrder.length;

    return {
      totalExaminations: draft.examinationOrder.length,
      completedExaminations,
      partiallyCompleted,
      notStarted,
      examinationStatus,
      readyForSubmission
    };
  }

  /**
   * Auto-save with conflict detection
   */
  async autoSave(
    visitId: string,
    updates: Partial<Omit<DraftRecord, 'visitId' | 'draftId' | 'ttl' | 'lastSaved' | 'autoSaved'>>
  ): Promise<{
    success: boolean;
    conflict?: boolean;
    latestDraft?: DraftRecord;
  }> {
    try {
      const existingDraft = await this.getDraft(visitId);
      if (!existingDraft) {
        return { success: false };
      }

      // Check for potential conflicts (if draft was modified by another session)
      const lastSavedTime = new Date(existingDraft.lastSaved).getTime();
      const now = Date.now();
      const timeSinceLastSave = now - lastSavedTime;

      // If draft was saved very recently by another session, there might be a conflict
      if (timeSinceLastSave < 5000 && existingDraft.autoSaved) { // 5 seconds
        return {
          success: false,
          conflict: true,
          latestDraft: existingDraft
        };
      }

      const updatedDraft = await this.updateDraft(visitId, {
        ...updates,
        autoSaved: true
      });

      return { success: true, latestDraft: updatedDraft };
    } catch (error) {
      console.error('Auto-save failed:', error);
      return { success: false };
    }
  }

  /**
   * Get draft restoration information
   */
  async getDraftRestorationInfo(visitId: string): Promise<{
    canRestore: boolean;
    lastSaved?: string;
    completionPercentage?: number;
    availableExaminations?: string[];
    nextStep?: number;
    examinationOrder?: string[];
  }> {
    const draft = await this.getDraft(visitId);
    if (!draft) {
      return { canRestore: false };
    }

    const availableExaminations = Object.keys(draft.formData).filter(examId => {
      const examData = draft.formData[examId];
      return examData && (examData.right || examData.left);
    });

    const completionPercentage = draft.totalSteps > 0 
      ? Math.round((draft.completedSteps.length / draft.totalSteps) * 100)
      : 0;

    return {
      canRestore: true,
      lastSaved: draft.lastSaved,
      completionPercentage,
      availableExaminations,
      nextStep: draft.currentStep,
      examinationOrder: draft.examinationOrder
    };
  }

  /**
   * Create backup before major operations
   */
  async createBackup(visitId: string): Promise<string | null> {
    const draft = await this.getDraft(visitId);
    if (!draft) {
      return null;
    }

    const backupId = `backup-${Date.now()}`;
    const backupRecord: DraftRecord = {
      ...draft,
      draftId: backupId as any,
      lastSaved: new Date().toISOString(),
      ttl: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days for backup
    };

    await this.create(backupRecord);
    return backupId;
  }

  /**
   * Clean up expired drafts (to be called by maintenance job)
   */
  async cleanupExpiredDrafts(): Promise<number> {
    // This would typically be implemented with a scan operation
    // For now, returning 0 as this would be handled by DynamoDB TTL
    return 0;
  }

  /**
   * Helper method to check eye data consistency
   */
  private checkEyeDataConsistency(rightData: any, leftData: any, examId: string): boolean {
    // Placeholder implementation - would contain examination-specific validation
    // For example, checking if measurements are within reasonable ranges between eyes
    
    if (examId === 'basicInfo') {
      // Check if visual acuity is drastically different between eyes
      if (rightData.va && leftData.va) {
        const vaDiff = Math.abs(parseFloat(rightData.va) - parseFloat(leftData.va));
        return vaDiff > 0.3; // Flag if difference > 3 lines of vision
      }
    }
    
    if (examId === 'vas') {
      // Check if VAS scores are dramatically different
      if (rightData.comfortLevel && leftData.comfortLevel) {
        const comfortDiff = Math.abs(rightData.comfortLevel - leftData.comfortLevel);
        return comfortDiff > 30; // Flag if difference > 30 points
      }
    }
    
    return false; // No significant discrepancies detected
  }
}