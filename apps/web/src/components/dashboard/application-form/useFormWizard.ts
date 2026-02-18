import { useCallback, useEffect, useRef, useState } from 'react';
import { STEPS, type FormState } from './types';

const STORAGE_KEY = 'hacklanta_application_draft';
const AUTOSAVE_DELAY_MS = 500;

interface SavedDraft {
  form: Partial<FormState>;
  currentStep: number;
}

export interface UseFormWizardReturn {
  currentStep: number;
  direction: 1 | -1;
  stepErrors: string[];
  isFirstStep: boolean;
  isLastStep: boolean;
  goNext: () => boolean;
  goBack: () => void;
  goToStep: (step: number) => void;
  clearErrors: () => void;
  validateAllSteps: () => number | null; // returns first failing step index, or null
}

export function useFormWizard(
  form: FormState,
  resumeFile: File | null,
  isEditing: boolean,
  setForm: (updater: (prev: FormState) => FormState) => void,
  setCurrentStepExternal?: (step: number) => void,
): UseFormWizardReturn {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHydrated = useRef(false);

  // Hydrate from localStorage on mount (CREATE mode only)
  useEffect(() => {
    if (isEditing || hasHydrated.current) return;
    hasHydrated.current = true;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { form: savedForm, currentStep: savedStep } = JSON.parse(saved) as SavedDraft;
        if (savedForm && typeof savedForm === 'object') {
          setForm((prev) => ({ ...prev, ...savedForm }));
        }
        if (typeof savedStep === 'number' && savedStep >= 0 && savedStep < STEPS.length) {
          setCurrentStep(savedStep);
        }
      }
    } catch {
      // corrupt data, ignore
    }
  }, [isEditing, setForm]);

  // Autosave to localStorage (CREATE mode only, debounced)
  useEffect(() => {
    if (isEditing) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      try {
        const draft: SavedDraft = { form, currentStep };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch {
        // storage full or unavailable, silently fail
      }
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [form, currentStep, isEditing]);

  const clearErrors = useCallback(() => {
    setStepErrors([]);
  }, []);

  const goNext = useCallback((): boolean => {
    const errors = STEPS[currentStep].validate(form, resumeFile, isEditing);
    if (errors.length > 0) {
      setStepErrors(errors);
      return false;
    }
    setStepErrors([]);
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    return true;
  }, [currentStep, form, resumeFile, isEditing]);

  const goBack = useCallback(() => {
    setStepErrors([]);
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      if (step < 0 || step >= STEPS.length) return;
      setStepErrors([]);
      setDirection(step > currentStep ? 1 : -1);
      setCurrentStep(step);
    },
    [currentStep],
  );

  const validateAllSteps = useCallback((): number | null => {
    for (let i = 0; i < STEPS.length; i++) {
      const errors = STEPS[i].validate(form, resumeFile, isEditing);
      if (errors.length > 0) {
        setDirection(i > currentStep ? 1 : -1);
        setCurrentStep(i);
        setStepErrors(errors);
        return i;
      }
    }
    return null;
  }, [form, resumeFile, isEditing, currentStep]);

  // Sync external step state if needed
  useEffect(() => {
    setCurrentStepExternal?.(currentStep);
  }, [currentStep, setCurrentStepExternal]);

  return {
    currentStep,
    direction,
    stepErrors,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === STEPS.length - 1,
    goNext,
    goBack,
    goToStep,
    clearErrors,
    validateAllSteps,
  };
}

export function clearDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
