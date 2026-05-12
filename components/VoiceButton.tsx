import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, View, Platform, Alert } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat,
  withTiming, Easing, interpolate,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';

export default function VoiceButton({ onSpeechEnd }: { onSpeechEnd: (audioUri: string) => void }) {
  const [state, setState]       = useState<'idle' | 'listening' | 'processing'>('idle');
  const recordingRef            = useRef<Audio.Recording | null>(null);
  const pulse                   = useSharedValue(0);

  // ─── Animation pulse ──────────────────────────────────────────────────────
  useEffect(() => {
    if (state === 'listening' || state === 'processing') {
      pulse.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        false,
      );
    } else {
      pulse.value = withTiming(0);
    }
  }, [state]);

  // ─── Démarrer l'enregistrement ────────────────────────────────────────────
  const startRecording = async () => {
    if (Platform.OS === 'web' || state !== 'idle') return;

    // 1. Demander la permission micro
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission refusée',
        'Autorisez le microphone dans les paramètres de l\'application.',
      );
      return;
    }

    try {
      // 2. Configurer le mode audio pour l'enregistrement
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 3. Nettoyer un éventuel enregistrement précédent
      if (recordingRef.current) {
        try { await recordingRef.current.stopAndUnloadAsync(); } catch (_) {}
        recordingRef.current = null;
      }

      // 4. Créer le nouvel enregistrement
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setState('listening');

    } catch (err) {
      console.error('[VoiceButton] startRecording error:', err);
      setState('idle');
      recordingRef.current = null;
    }
  };

  // ─── Arrêter l'enregistrement ─────────────────────────────────────────────
  const stopRecording = async () => {
    if (!recordingRef.current || state !== 'listening') return;

    const rec = recordingRef.current;
    recordingRef.current = null;
    setState('processing');

    try {
      await rec.stopAndUnloadAsync();

      // Repasser en mode lecture après enregistrement
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const uri = rec.getURI();
      if (uri) {
        onSpeechEnd(uri);
        setTimeout(() => setState('idle'), 800);
      } else {
        setState('idle');
      }
    } catch (err) {
      console.error('[VoiceButton] stopRecording error:', err);
      setState('idle');
    }
  };

  // ─── Styles animés ────────────────────────────────────────────────────────
  const ringStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 2]) }],
    opacity:   state !== 'idle' ? interpolate(pulse.value, [0, 1], [0.6, 0]) : 0,
  }), [state]);

  const ringStyle2 = useAnimatedStyle(() => {
    const p2 = (pulse.value + 0.5) % 1;
    return {
      transform: [{ scale: interpolate(p2, [0, 1], [1, 2]) }],
      opacity:   state !== 'idle' ? interpolate(p2, [0, 1], [0.6, 0]) : 0,
    };
  }, [state]);

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 0.5, 1], [1, 1.1, 1]) }],
  }));

  // Couleur du ring selon l'état
  const ringColor = state === 'listening' ? '#FF4757' : '#2563EB';

  // ─── Rendu ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPressIn={startRecording}
        onPressOut={stopRecording}
        activeOpacity={0.9}
      >
        <View style={styles.buttonContainer}>
          <Animated.View style={[styles.ring, { borderColor: ringColor }, ringStyle1]} />
          <Animated.View style={[styles.ring, { borderColor: ringColor }, ringStyle2]} />

          <Animated.View style={[
            styles.button,
            coreStyle,
            state === 'listening'  && styles.listening,
            state === 'processing' && styles.processing,
          ]}>
            {/* Icône micro */}
            <View style={[
              styles.micBody,
              state === 'listening'  && { backgroundColor: '#FF4757' },
              state === 'processing' && { backgroundColor: '#10B981' },
            ]} />
            <View style={[
              styles.micBase,
              state === 'listening'  && { borderColor: '#FF4757' },
              state === 'processing' && { borderColor: '#10B981' },
            ]} />
          </Animated.View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { alignItems: 'center', justifyContent: 'center' },
  buttonContainer: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },

  button: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#2563EB',
    shadowColor: '#2563EB', shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  listening:  { borderColor: '#FF4757', shadowColor: '#FF4757', backgroundColor: '#FFF5F5' },
  processing: { borderColor: '#10B981', shadowColor: '#10B981', backgroundColor: '#F0FDF4' },

  ring: {
    position: 'absolute',
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 1.5, borderColor: '#2563EB',
  },

  // Micro dessiné en CSS
  micBody: {
    width: 10, height: 16,
    backgroundColor: '#2563EB',
    borderRadius: 5,
    marginBottom: 2,
  },
  micBase: {
    position: 'absolute',
    bottom: 8,
    width: 18, height: 10,
    borderLeftWidth: 2, borderRightWidth: 2, borderBottomWidth: 2,
    borderColor: '#2563EB',
    borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
  },
});