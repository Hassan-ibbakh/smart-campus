import { useState, useEffect, useRef } from 'react';
import { navigateApi, NavigationStep } from '../services/api';

export const useNavigation = () => {
  const [steps, setSteps] = useState<NavigationStep[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startNavigation = async (from: string, to: string, accessible: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await navigateApi(from, to, accessible);
      setSteps(result.steps);
      setCurrentIndex(0);
      return result;
    } catch (err: any) {
      setError(err.message || 'Erreur lors du calcul de l\'itinéraire');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const goToNextStep = () => {
    setCurrentIndex((prev) => {
      if (prev < steps.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  };

  const startSimulation = () => {
    // La simulation est maintenant pilotée par les événements vocaux
    // On avance au premier pas pour lancer la chaîne
    if (steps.length > 0) {
      setCurrentIndex(0);
    }
  };

  const stopSimulation = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopSimulation();
  }, []);

  return {
    steps,
    currentStep: currentIndex >= 0 ? steps[currentIndex] : null,
    currentIndex,
    isArrived: currentIndex === steps.length - 1 && steps.length > 0,
    loading,
    error,
    startNavigation,
    goToNextStep,
    startSimulation,
    stopSimulation,
    setSteps, // Pour bypass API en mode démo si backend non dispo
    setCurrentIndex
  };
};
