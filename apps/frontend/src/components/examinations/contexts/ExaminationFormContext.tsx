import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { VisitRecord } from '@clinical-trial/shared';
import { examinationService, DraftData, SaveDraftRequest } from '../../../services/ExaminationService';

// Form state types
export interface ExaminationFormState {
  // Visit configuration
  visitConfig: VisitRecord | null;
  currentStep: number;
  totalSteps: number;
  examinationOrder: string[];
  completedSteps: string[];
  skippedSteps: string[];
  
  // Form data for each examination and each eye
  formData: {
    [examinationId: string]: {
      right?: any;
      left?: any;
    };
  };
  
  // UI state
  isLoading: boolean;
  isDraftSaving: boolean;
  lastSaved: Date | null;
  errors: Record<string, string>;
  
  // Progress tracking
  completionPercentage: number;
  canProceedToNext: boolean;
  canGoBack: boolean;
}

// Action types for form state management
export type ExaminationFormAction =
  | { type: 'SET_VISIT_CONFIG'; payload: VisitRecord }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'GO_TO_NEXT_STEP' }
  | { type: 'GO_TO_PREVIOUS_STEP' }
  | { type: 'UPDATE_FORM_DATA'; payload: { examinationId: string; eyeside: 'right' | 'left'; data: any } }
  | { type: 'COMPLETE_STEP'; payload: string }
  | { type: 'SKIP_STEP'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DRAFT_SAVING'; payload: boolean }
  | { type: 'SET_LAST_SAVED'; payload: Date }
  | { type: 'SET_ERROR'; payload: { key: string; message: string } }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'CLEAR_ALL_ERRORS' }
  | { type: 'LOAD_DRAFT_DATA'; payload: any }
  | { type: 'RESET_FORM' };

// Initial state
const initialState: ExaminationFormState = {
  visitConfig: null,
  currentStep: 0,
  totalSteps: 0,
  examinationOrder: [],
  completedSteps: [],
  skippedSteps: [],
  formData: {},
  isLoading: false,
  isDraftSaving: false,
  lastSaved: null,
  errors: {},
  completionPercentage: 0,
  canProceedToNext: false,
  canGoBack: false,
};

// Reducer function
function examinationFormReducer(state: ExaminationFormState, action: ExaminationFormAction): ExaminationFormState {
  switch (action.type) {
    case 'SET_VISIT_CONFIG': {
      const visitConfig = action.payload;
      const examinationOrder = visitConfig.examinationOrder;
      const totalSteps = examinationOrder.length;
      
      return {
        ...state,
        visitConfig,
        examinationOrder,
        totalSteps,
        currentStep: 0,
        completedSteps: visitConfig.completedExaminations || [],
        completionPercentage: totalSteps > 0 ? (visitConfig.completedExaminations?.length || 0) / totalSteps * 100 : 0,
        canGoBack: false,
        canProceedToNext: totalSteps > 1,
      };
    }
    
    case 'SET_CURRENT_STEP': {
      const newStep = Math.max(0, Math.min(action.payload, state.totalSteps - 1));
      return {
        ...state,
        currentStep: newStep,
        canGoBack: newStep > 0,
        canProceedToNext: newStep < state.totalSteps - 1,
      };
    }
    
    case 'GO_TO_NEXT_STEP': {
      const newStep = Math.min(state.currentStep + 1, state.totalSteps - 1);
      return {
        ...state,
        currentStep: newStep,
        canGoBack: newStep > 0,
        canProceedToNext: newStep < state.totalSteps - 1,
      };
    }
    
    case 'GO_TO_PREVIOUS_STEP': {
      const newStep = Math.max(state.currentStep - 1, 0);
      return {
        ...state,
        currentStep: newStep,
        canGoBack: newStep > 0,
        canProceedToNext: newStep < state.totalSteps - 1,
      };
    }
    
    case 'UPDATE_FORM_DATA': {
      const { examinationId, eyeside, data } = action.payload;
      console.log('Reducer UPDATE_FORM_DATA:', { examinationId, eyeside, data });
      const newState = {
        ...state,
        formData: {
          ...state.formData,
          [examinationId]: {
            ...state.formData[examinationId],
            [eyeside]: data,
          },
        },
      };
      console.log('New form data:', newState.formData);
      return newState;
    }
    
    case 'COMPLETE_STEP': {
      const stepId = action.payload;
      if (state.completedSteps.includes(stepId)) return state;
      
      const newCompletedSteps = [...state.completedSteps, stepId];
      const newSkippedSteps = state.skippedSteps.filter(id => id !== stepId);
      
      return {
        ...state,
        completedSteps: newCompletedSteps,
        skippedSteps: newSkippedSteps,
        completionPercentage: state.totalSteps > 0 ? (newCompletedSteps.length / state.totalSteps) * 100 : 0,
      };
    }
    
    case 'SKIP_STEP': {
      const stepId = action.payload;
      if (state.skippedSteps.includes(stepId)) return state;
      
      const newSkippedSteps = [...state.skippedSteps, stepId];
      const newCompletedSteps = state.completedSteps.filter(id => id !== stepId);
      
      return {
        ...state,
        skippedSteps: newSkippedSteps,
        completedSteps: newCompletedSteps,
        completionPercentage: state.totalSteps > 0 ? (newCompletedSteps.length / state.totalSteps) * 100 : 0,
      };
    }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_DRAFT_SAVING':
      return { ...state, isDraftSaving: action.payload };
    
    case 'SET_LAST_SAVED':
      return { ...state, lastSaved: action.payload };
    
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.message,
        },
      };
    
    case 'CLEAR_ERROR': {
      const { [action.payload]: removed, ...remainingErrors } = state.errors;
      return { ...state, errors: remainingErrors };
    }
    
    case 'CLEAR_ALL_ERRORS':
      return { ...state, errors: {} };
    
    case 'LOAD_DRAFT_DATA':
      return {
        ...state,
        formData: action.payload.formData || {},
        currentStep: action.payload.currentStep || 0,
        completedSteps: action.payload.completedSteps || [],
        lastSaved: action.payload.lastSaved ? new Date(action.payload.lastSaved) : null,
      };
    
    case 'RESET_FORM':
      return { ...initialState };
    
    default:
      return state;
  }
}

// Context type
interface ExaminationFormContextType {
  state: ExaminationFormState;
  dispatch: React.Dispatch<ExaminationFormAction>;
  
  // Helper functions
  setVisitConfig: (visitConfig: VisitRecord) => void;
  goToStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  updateFormData: (examinationId: string, eyeside: 'right' | 'left', data: any) => void;
  completeStep: (stepId: string) => void;
  skipStep: (stepId: string) => void;
  setError: (key: string, message: string) => void;
  clearError: (key: string) => void;
  clearAllErrors: () => void;
  saveDraft: () => Promise<void>;
  loadDraft: (visitId: string) => Promise<void>;
  resetForm: () => void;
  
  // Computed properties
  getCurrentExamination: () => string | null;
  isStepCompleted: (stepId: string) => boolean;
  isStepSkipped: (stepId: string) => boolean;
  canCompleteCurrentStep: () => boolean;
}

// Create context
const ExaminationFormContext = createContext<ExaminationFormContextType | undefined>(undefined);

// Provider component
export const ExaminationFormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(examinationFormReducer, initialState);
  
  // Helper functions
  const setVisitConfig = useCallback((visitConfig: VisitRecord) => {
    dispatch({ type: 'SET_VISIT_CONFIG', payload: visitConfig });
  }, []);
  
  const goToStep = useCallback((step: number) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: step });
  }, []);
  
  const goToNextStep = useCallback(() => {
    dispatch({ type: 'GO_TO_NEXT_STEP' });
  }, []);
  
  const goToPreviousStep = useCallback(() => {
    dispatch({ type: 'GO_TO_PREVIOUS_STEP' });
  }, []);
  
  const updateFormData = useCallback((examinationId: string, eyeside: 'right' | 'left', data: any) => {
    console.log('updateFormData called:', { examinationId, eyeside, dataKeys: Object.keys(data) });
    dispatch({ type: 'UPDATE_FORM_DATA', payload: { examinationId, eyeside, data } });
  }, []);
  
  const completeStep = useCallback((stepId: string) => {
    dispatch({ type: 'COMPLETE_STEP', payload: stepId });
  }, []);
  
  const skipStep = useCallback((stepId: string) => {
    dispatch({ type: 'SKIP_STEP', payload: stepId });
  }, []);
  
  const setError = useCallback((key: string, message: string) => {
    dispatch({ type: 'SET_ERROR', payload: { key, message } });
  }, []);
  
  const clearError = useCallback((key: string) => {
    dispatch({ type: 'CLEAR_ERROR', payload: key });
  }, []);
  
  const clearAllErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_ERRORS' });
  }, []);
  
  const saveDraft = useCallback(async () => {
    if (!state.visitConfig) return;
    
    dispatch({ type: 'SET_DRAFT_SAVING', payload: true });
    
    try {
      const draftData: SaveDraftRequest = {
        formData: state.formData,
        currentStep: state.currentStep,
        totalSteps: state.totalSteps,
        completedSteps: state.completedSteps,
        examinationOrder: state.examinationOrder,
        autoSaved: false,
      };
      
      await examinationService.saveDraft(state.visitConfig.visitId, draftData);
      dispatch({ type: 'SET_LAST_SAVED', payload: new Date() });
    } catch (error) {
      console.error('Failed to save draft:', error);
      setError('draft', '下書き保存に失敗しました');
    } finally {
      dispatch({ type: 'SET_DRAFT_SAVING', payload: false });
    }
  }, [state.visitConfig, state.formData, state.currentStep, state.totalSteps, state.completedSteps, state.examinationOrder, setError]);
  
  const loadDraft = useCallback(async (visitId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const draftData = await examinationService.loadDraft(visitId);
      if (draftData) {
        dispatch({ type: 'LOAD_DRAFT_DATA', payload: draftData });
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      setError('draft', '下書き読み込みに失敗しました');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [setError]);
  
  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);
  
  // Computed properties
  const getCurrentExamination = useCallback(() => {
    if (state.currentStep >= 0 && state.currentStep < state.examinationOrder.length) {
      return state.examinationOrder[state.currentStep];
    }
    return null;
  }, [state.currentStep, state.examinationOrder]);
  
  const isStepCompleted = useCallback((stepId: string) => {
    return state.completedSteps.includes(stepId);
  }, [state.completedSteps]);
  
  const isStepSkipped = useCallback((stepId: string) => {
    return state.skippedSteps.includes(stepId);
  }, [state.skippedSteps]);
  
  const canCompleteCurrentStep = useCallback(() => {
    const currentExamination = getCurrentExamination();
    if (!currentExamination) return false;
    
    const formData = state.formData[currentExamination];
    // Check if both eyes have data (basic validation)
    return formData && formData.right && formData.left;
  }, [getCurrentExamination, state.formData]);
  
  // Auto-save functionality
  useEffect(() => {
    if (!state.visitConfig || state.isDraftSaving) return;
    
    const autoSaveTimer = setInterval(async () => {
      dispatch({ type: 'SET_DRAFT_SAVING', payload: true });
      
      try {
        const updates = {
          formData: state.formData,
          currentStep: state.currentStep,
          totalSteps: state.totalSteps,
          completedSteps: state.completedSteps,
          examinationOrder: state.examinationOrder,
          autoSaved: true,
        };
        
        const result = await examinationService.autoSaveDraft(state.visitConfig.visitId, updates);
        
        if (result.success) {
          dispatch({ type: 'SET_LAST_SAVED', payload: new Date() });
        }
      } catch (error) {
        // Silent fail for auto-save
        console.warn('Auto-save failed:', error);
      } finally {
        dispatch({ type: 'SET_DRAFT_SAVING', payload: false });
      }
    }, 30000); // Auto-save every 30 seconds
    
    return () => clearInterval(autoSaveTimer);
  }, [state.visitConfig, state.formData, state.currentStep, state.totalSteps, state.completedSteps, state.examinationOrder, state.isDraftSaving]);
  
  const contextValue: ExaminationFormContextType = {
    state,
    dispatch,
    setVisitConfig,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    updateFormData,
    completeStep,
    skipStep,
    setError,
    clearError,
    clearAllErrors,
    saveDraft,
    loadDraft,
    resetForm,
    getCurrentExamination,
    isStepCompleted,
    isStepSkipped,
    canCompleteCurrentStep,
  };
  
  return (
    <ExaminationFormContext.Provider value={contextValue}>
      {children}
    </ExaminationFormContext.Provider>
  );
};

// Hook to use the context
export const useExaminationForm = () => {
  const context = useContext(ExaminationFormContext);
  if (context === undefined) {
    throw new Error('useExaminationForm must be used within an ExaminationFormProvider');
  }
  return context;
};