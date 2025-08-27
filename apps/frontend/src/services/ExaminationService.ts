import { apiClient } from './apiClient';

export interface DraftData {
  visitId: string;
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
  ttl: number;
}

export interface VisitExaminationConfig {
  visitId: string;
  surveyId: string;
  patientId: string;
  clinicalStudyId: string;
  organizationId: string;
  examinationOrder: string[];
  requiredExaminations: string[];
  optionalExaminations: string[];
  totalSteps: number;
  visitName: string;
  visitType: string;
}

export interface SaveDraftRequest {
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
  autoSaved?: boolean;
}

export interface SubmitExaminationRequest {
  formData: {
    [examinationId: string]: {
      right?: any;
      left?: any;
    };
  };
  completedExaminations: string[];
  conductedBy: string;
}

export interface DraftStats {
  exists: boolean;
  completionPercentage: number;
  completedSteps: number;
  totalSteps: number;
  lastSaved?: string;
  autoSaved?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
}

export interface AutoSaveResult {
  success: boolean;
  conflict?: boolean;
  latestDraft?: DraftData;
}

/**
 * Service for examination data management
 * Connects frontend with DynamoDB-backed examination API
 */
export class ExaminationService {
  private readonly baseUrl = '/api/examinations';

  /**
   * Get visit configuration and examination order
   */
  async getVisitExaminationConfig(visitId: string): Promise<VisitExaminationConfig> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/visits/${visitId}/config`);
      return response.data;
    } catch (error) {
      console.error('Failed to get visit examination config:', error);
      throw new Error('Failed to get visit configuration');
    }
  }

  /**
   * Load draft data for a visit
   */
  async loadDraft(visitId: string): Promise<DraftData | null> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/visits/${visitId}/draft`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No draft exists
      }
      console.error('Failed to load draft:', error);
      throw new Error('Failed to load draft data');
    }
  }

  /**
   * Save draft data manually
   */
  async saveDraft(visitId: string, draftData: SaveDraftRequest): Promise<DraftData> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/visits/${visitId}/draft`, draftData);
      return response.data;
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw new Error('Failed to save draft data');
    }
  }

  /**
   * Auto-save draft data with conflict detection
   */
  async autoSaveDraft(visitId: string, updates: Partial<SaveDraftRequest>): Promise<AutoSaveResult> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/visits/${visitId}/draft/autosave`, updates);
      return response.data;
    } catch (error) {
      console.error('Auto-save failed:', error);
      return { success: false };
    }
  }

  /**
   * Get all examination data for a visit
   */
  async getAllExaminationData(visitId: string): Promise<{
    [examinationId: string]: {
      right?: any;
      left?: any;
    };
  }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/visits/${visitId}/examinations`);
      return response.data;
    } catch (error) {
      console.error('Failed to get examination data:', error);
      throw new Error('Failed to get examination data');
    }
  }

  /**
   * Submit complete examination data
   */
  async submitExaminationData(
    visitId: string, 
    submissionData: SubmitExaminationRequest
  ): Promise<{ success: boolean; savedExaminations: string[] }> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/visits/${visitId}/examinations/submit`,
        submissionData
      );
      return response.data;
    } catch (error) {
      console.error('Failed to submit examination data:', error);
      throw new Error('Failed to submit examination data');
    }
  }

  /**
   * Save specific examination data for both eyes
   */
  async saveExaminationData(
    visitId: string,
    examinationId: string,
    rightEyeData: any,
    leftEyeData: any,
    surveyId: string,
    patientId: string,
    clinicalStudyId: string,
    organizationId: string
  ): Promise<{ right?: any; left?: any }> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/visits/${visitId}/examinations/${examinationId}`,
        {
          rightEyeData,
          leftEyeData,
          surveyId,
          patientId,
          clinicalStudyId,
          organizationId,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to save examination data:', error);
      throw new Error('Failed to save examination data');
    }
  }

  /**
   * Update examination data for specific eye
   */
  async updateExaminationData(
    visitId: string,
    examinationId: string,
    eyeside: 'right' | 'left',
    updateData: any
  ): Promise<any> {
    try {
      const response = await apiClient.put(
        `${this.baseUrl}/visits/${visitId}/examinations/${examinationId}/${eyeside}`,
        updateData
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update examination data:', error);
      throw new Error('Failed to update examination data');
    }
  }

  /**
   * Get examination comparison data across visits
   */
  async getExaminationComparison(
    surveyId: string,
    examinationId: string,
    eyeside: 'right' | 'left'
  ): Promise<any[]> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/surveys/${surveyId}/examinations/${examinationId}/comparison`,
        { params: { eyeside } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get examination comparison:', error);
      throw new Error('Failed to get examination comparison');
    }
  }

  /**
   * Get draft statistics
   */
  async getDraftStats(visitId: string): Promise<DraftStats> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/visits/${visitId}/draft/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to get draft stats:', error);
      return {
        exists: false,
        completionPercentage: 0,
        completedSteps: 0,
        totalSteps: 0,
      };
    }
  }

  /**
   * Clear draft data
   */
  async clearDraft(visitId: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/visits/${visitId}/draft`);
    } catch (error) {
      console.error('Failed to clear draft:', error);
      throw new Error('Failed to clear draft data');
    }
  }

  /**
   * Validate examination data before submission
   */
  async validateExaminationData(visitId: string): Promise<ValidationResult> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/visits/${visitId}/examinations/validate`);
      return response.data;
    } catch (error) {
      console.error('Failed to validate examination data:', error);
      throw new Error('Failed to validate examination data');
    }
  }

  /**
   * Initialize draft for new examination session
   */
  async initializeDraft(visitId: string, examinationOrder: string[]): Promise<DraftData> {
    try {
      const draftData: SaveDraftRequest = {
        formData: this.createEmptyFormData(examinationOrder),
        currentStep: 0,
        totalSteps: examinationOrder.length,
        completedSteps: [],
        examinationOrder,
        autoSaved: false,
      };
      
      return await this.saveDraft(visitId, draftData);
    } catch (error) {
      console.error('Failed to initialize draft:', error);
      throw new Error('Failed to initialize draft');
    }
  }

  /**
   * Update specific examination data in draft
   */
  async updateDraftExaminationData(
    visitId: string,
    examinationId: string,
    eyeside: 'right' | 'left',
    data: any
  ): Promise<DraftData> {
    try {
      const draft = await this.loadDraft(visitId);
      if (!draft) {
        throw new Error('No draft found');
      }

      const updatedFormData = { ...draft.formData };
      if (!updatedFormData[examinationId]) {
        updatedFormData[examinationId] = {};
      }
      updatedFormData[examinationId][eyeside] = data;

      return await this.saveDraft(visitId, {
        ...draft,
        formData: updatedFormData,
        autoSaved: false,
      });
    } catch (error) {
      console.error('Failed to update draft examination data:', error);
      throw new Error('Failed to update draft examination data');
    }
  }

  /**
   * Batch update both eyes data in draft
   */
  async updateDraftBothEyes(
    visitId: string,
    examinationId: string,
    data: { right?: any; left?: any }
  ): Promise<DraftData> {
    try {
      const draft = await this.loadDraft(visitId);
      if (!draft) {
        throw new Error('No draft found');
      }

      const updatedFormData = { ...draft.formData };
      if (!updatedFormData[examinationId]) {
        updatedFormData[examinationId] = {};
      }

      if (data.right !== undefined) {
        updatedFormData[examinationId].right = data.right;
      }
      if (data.left !== undefined) {
        updatedFormData[examinationId].left = data.left;
      }

      return await this.saveDraft(visitId, {
        ...draft,
        formData: updatedFormData,
        autoSaved: false,
      });
    } catch (error) {
      console.error('Failed to update draft both eyes data:', error);
      throw new Error('Failed to update draft both eyes data');
    }
  }

  /**
   * Mark examination step as completed in draft
   */
  async completeExaminationStep(visitId: string, stepId: string): Promise<DraftData> {
    try {
      const draft = await this.loadDraft(visitId);
      if (!draft) {
        throw new Error('No draft found');
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

      return await this.saveDraft(visitId, {
        ...draft,
        currentStep: newCurrentStep,
        completedSteps: updatedCompletedSteps,
        autoSaved: false,
      });
    } catch (error) {
      console.error('Failed to complete examination step:', error);
      throw new Error('Failed to complete examination step');
    }
  }

  /**
   * Auto-save with current form data from context
   */
  async performAutoSave(
    visitId: string,
    formData: any,
    currentStep: number,
    totalSteps: number,
    completedSteps: string[],
    examinationOrder: string[]
  ): Promise<AutoSaveResult> {
    try {
      const updates: Partial<SaveDraftRequest> = {
        formData,
        currentStep,
        totalSteps,
        completedSteps,
        examinationOrder,
        autoSaved: true,
      };

      return await this.autoSaveDraft(visitId, updates);
    } catch (error) {
      console.error('Auto-save failed:', error);
      return { success: false };
    }
  }

  /**
   * Check if draft has unsaved changes
   */
  async hasUnsavedChanges(visitId: string): Promise<boolean> {
    try {
      const draft = await this.loadDraft(visitId);
      if (!draft) return false;

      // Check if last saved was more than 30 seconds ago
      const lastSavedTime = new Date(draft.lastSaved).getTime();
      const now = Date.now();
      const timeDiff = now - lastSavedTime;

      return timeDiff > 30000 && !draft.autoSaved;
    } catch (error) {
      console.error('Failed to check unsaved changes:', error);
      return false;
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
    try {
      const draft = await this.loadDraft(visitId);
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
    } catch (error) {
      console.error('Failed to get draft restoration info:', error);
      return { canRestore: false };
    }
  }

  /**
   * Create empty form data structure for initialization
   */
  private createEmptyFormData(examinationOrder: string[]): {
    [examinationId: string]: { right?: any; left?: any };
  } {
    const formData: any = {};
    examinationOrder.forEach(examId => {
      formData[examId] = {};
    });
    return formData;
  }
}

// Export singleton instance
export const examinationService = new ExaminationService();