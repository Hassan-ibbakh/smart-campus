import { useState, useEffect } from 'react';
import { Pedometer, Magnetometer } from 'expo-sensors';

export function usePDR(isNavigating: boolean) {
  const [stepCount, setStepCount] = useState(0);
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    let subscription: any;
    if (isNavigating) {
      subscription = Pedometer.watchStepCount(result => {
        setStepCount(prev => prev + 1);
      });
    }
    return () => subscription && subscription.remove();
  }, [isNavigating]);

  useEffect(() => {
    let subscription: any;
    if (isNavigating) {
      subscription = Magnetometer.addListener(data => {
        // Calcul du cap en degrés
        let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
        setHeading(angle);
      });
    }
    return () => subscription && subscription.remove();
  }, [isNavigating]);

  return { stepCount, heading };
}
