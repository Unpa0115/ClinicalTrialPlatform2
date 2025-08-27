import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  CLINICAL_STUDY_CONFIGURATIONS, 
  getClinicalStudyConfig, 
  ClinicalStudyConfig 
} from '../config/examinationConfigurations';

interface ClinicalStudyContextType {
  currentStudy: ClinicalStudyConfig | null;
  availableStudies: ClinicalStudyConfig[];
  switchStudy: (studyId: string) => void;
  isStudyLoading: boolean;
}

const ClinicalStudyContext = createContext<ClinicalStudyContextType | undefined>(undefined);

export const useClinicalStudy = () => {
  const context = useContext(ClinicalStudyContext);
  if (context === undefined) {
    throw new Error('useClinicalStudy must be used within a ClinicalStudyProvider');
  }
  return context;
};

interface ClinicalStudyProviderProps {
  children: React.ReactNode;
}

export const ClinicalStudyProvider: React.FC<ClinicalStudyProviderProps> = ({ children }) => {
  const [currentStudy, setCurrentStudy] = useState<ClinicalStudyConfig | null>(null);
  const [isStudyLoading, setIsStudyLoading] = useState(true);
  
  const availableStudies = Object.values(CLINICAL_STUDY_CONFIGURATIONS);

  useEffect(() => {
    // Load saved study from localStorage or default to first available
    const savedStudyId = localStorage.getItem('currentClinicalStudyId');
    const initialStudyId = savedStudyId || availableStudies[0]?.clinicalStudyId;
    
    if (initialStudyId) {
      const study = getClinicalStudyConfig(initialStudyId);
      if (study) {
        setCurrentStudy(study);
        localStorage.setItem('currentClinicalStudyId', initialStudyId);
        console.log(`🔬 初期化: ${study.studyName} を選択`);
      }
    }
    
    setIsStudyLoading(false);
  }, []);

  const switchStudy = (studyId: string) => {
    setIsStudyLoading(true);
    
    const study = getClinicalStudyConfig(studyId);
    if (study) {
      setCurrentStudy(study);
      localStorage.setItem('currentClinicalStudyId', studyId);
      console.log(`🔄 試験切り替え: ${study.studyName}`);
      
      // Trigger a page refresh to ensure all components use new study
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      console.error(`❌ 試験が見つかりません: ${studyId}`);
    }
    
    setIsStudyLoading(false);
  };

  return (
    <ClinicalStudyContext.Provider value={{
      currentStudy,
      availableStudies,
      switchStudy,
      isStudyLoading,
    }}>
      {children}
    </ClinicalStudyContext.Provider>
  );
};