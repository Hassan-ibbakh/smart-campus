import * as Speech from 'expo-speech';
import { useCallback, useRef } from 'react';

export const useSpeech = () => {
  const isSpeaking = useRef(false);

  const speak = useCallback((text: string, priority: 'high' | 'normal' = 'normal', onDoneCallback?: () => void) => {
    if (priority === 'high') {
      Speech.stop();
    }
    
    Speech.speak(text, {
      language: 'fr-FR',
      pitch: 1.0,
      rate: 0.9,
      onStart: () => {
        isSpeaking.current = true;
      },
      onDone: () => {
        isSpeaking.current = false;
        if (onDoneCallback) {
          onDoneCallback();
        }
      },
      onError: () => {
        isSpeaking.current = false;
        if (onDoneCallback) {
          onDoneCallback();
        }
      }
    });
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
    isSpeaking.current = false;
  }, []);

  return { speak, stop };
};
