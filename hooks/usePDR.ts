import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

// Pedometer and Magnetometer are native-only — not available on Web
let Pedometer: any = null;
let Magnetometer: any = null;

if (Platform.OS !== 'web') {
  const sensors = require('expo-sensors');
  Pedometer = sensors.Pedometer;
  Magnetometer = sensors.Magnetometer;
}

export function usePDR(isNavigating: boolean) {
  const [stepCount, setStepCount] = useState(0);
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    // Skip on web — Pedometer not supported
    if (Platform.OS === 'web' || !Pedometer || !isNavigating) return;

    const subscription = Pedometer.watchStepCount(() => {
      setStepCount(prev => prev + 1);
    });

    return () => subscription && subscription.remove();
  }, [isNavigating]);

  useEffect(() => {
    // Skip on web — Magnetometer not supported
    if (Platform.OS === 'web' || !Magnetometer || !isNavigating) return;

    const subscription = Magnetometer.addListener((data: any) => {
      const angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
      setHeading(angle);
    });

    return () => subscription && subscription.remove();
  }, [isNavigating]);

  return { stepCount, heading };
}
