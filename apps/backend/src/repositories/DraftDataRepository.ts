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
}