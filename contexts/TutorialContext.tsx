
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';

export interface TutorialStepConfig {
  selector: string;
  title: string;
  content: string;
  path?: string; 
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void; 
  desktopOnly?: boolean; 
  mobileOnly?: boolean; 
  isWelcome?: boolean; 
  nextPath?: string;
}


export type TutorialFeature = 'dashboard' | 'timetable' | 'todo' | 'reminders' | 'studyRoomJoin' | 'studyRoomCreate' | 'studyRoomInRoom' | 'settings';

type TutorialProgress = Record<TutorialFeature, 'unseen' | 'seen'>;

const INITIAL_PROGRESS: TutorialProgress = {
    dashboard: 'unseen',
    timetable: 'unseen',
    todo: 'unseen',
    reminders: 'unseen',
    studyRoomJoin: 'unseen',
    studyRoomCreate: 'unseen',
    studyRoomInRoom: 'unseen',
    settings: 'unseen',
};

interface TutorialContextType {
  
  isPromptActive: boolean;
  activeStep: TutorialStepConfig | null;
  isLastStep: boolean;
  
  
  tutorialProgress: TutorialProgress;
  startTutorial: (feature: TutorialFeature, steps: TutorialStepConfig[]) => void;
  nextStep: () => void;
  endCurrentTutorial: () => void;
  endEntireTutorial: () => void;
  isDesktop: boolean;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tutorialProgress, setTutorialProgress] = useLocalStorage<TutorialProgress>(`studysync-tutorial-${user?.id || 'guest'}`, INITIAL_PROGRESS);
  
  const [activeFeature, setActiveFeature] = useState<TutorialFeature | null>(null);
  const [activeSteps, setActiveSteps] = useState<TutorialStepConfig[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  
  useEffect(() => {
    const isNewUser = sessionStorage.getItem('isNewUser');
    if (isNewUser && user) {
      setTutorialProgress(INITIAL_PROGRESS);
      sessionStorage.removeItem('isNewUser');
    }
  }, [user, setTutorialProgress]);

  const activeStep = activeSteps.length > 0 ? activeSteps[activeStepIndex] : null;
  const isPromptActive = activeSteps.length > 0;
  const isLastStep = activeSteps.length > 0 && activeStepIndex === activeSteps.length - 1;

  const endCurrentTutorial = useCallback((markAsSeen: boolean = true) => {
    if (markAsSeen && activeFeature) {
        setTutorialProgress(prev => ({ ...prev, [activeFeature]: 'seen' }));
    }
    setActiveFeature(null);
    setActiveSteps([]);
    setActiveStepIndex(0);
  }, [activeFeature, setTutorialProgress]);

  
  useEffect(() => {
      if (!activeStep) return;
      const isInvalidNow = (activeStep.desktopOnly && !isDesktop) || (activeStep.mobileOnly && isDesktop);
      if (isInvalidNow) {
          endCurrentTutorial(true);
      }
  }, [isDesktop, activeStep, endCurrentTutorial]);


  const startTutorial = useCallback((feature: TutorialFeature, steps: TutorialStepConfig[]) => {
    
    if (tutorialProgress[feature] === 'unseen' && !isPromptActive) {
      
      const filteredSteps = steps.filter(step => {
        if (step.desktopOnly && !isDesktop) return false;
        if (step.mobileOnly && isDesktop) return false;
        return true;
      });

      
      if (filteredSteps.length === 0) {
          setTutorialProgress(prev => ({ ...prev, [feature]: 'seen' }));
          return;
      }
      
      setActiveFeature(feature);
      setActiveSteps(filteredSteps);
      setActiveStepIndex(0);
    }
  }, [tutorialProgress, isPromptActive, setTutorialProgress, isDesktop]);
  
  const nextStep = useCallback(() => {
    if (isLastStep) {
        const nextPath = activeStep?.nextPath;
        endCurrentTutorial(true);
        if (isDesktop && nextPath) {
            navigate(nextPath);
        }
    } else {
        setActiveStepIndex(prev => prev + 1);
    }
  }, [isLastStep, activeStep, endCurrentTutorial, navigate, isDesktop]);
  
  const endEntireTutorial = useCallback(() => {
    const seenProgress = Object.keys(INITIAL_PROGRESS).reduce((acc, key) => {
        acc[key as TutorialFeature] = 'seen';
        return acc;
    }, {} as TutorialProgress);
    setTutorialProgress(seenProgress);
    endCurrentTutorial(false);
  }, [setTutorialProgress, endCurrentTutorial]);
  
  
  useEffect(() => {
    if (!activeStep) return;

    if (activeStep.path && activeStep.path !== location.pathname) {
      navigate(activeStep.path);
    }
    
    if (activeStep.action) {
      activeStep.action();
    }
  }, [activeStep, location.pathname, navigate]);


  const value = {
    isPromptActive,
    activeStep,
    isLastStep,
    tutorialProgress,
    startTutorial,
    nextStep,
    endCurrentTutorial: () => endCurrentTutorial(true),
    endEntireTutorial,
    isDesktop,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = (): TutorialContextType => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within an TutorialProvider');
  }
  return context;
};
