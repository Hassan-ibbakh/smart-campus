import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing } from 'react-native-reanimated';
import { useSpeech } from '../hooks/useSpeech';
import BottomNav from '../components/BottomNav';

export default function HomeScreen() {
  const router = useRouter();
  const { speak } = useSpeech();
  const [enhancedAccessibility, setEnhancedAccessibility] = useState(false);

  // Animations
  const glowOpacity = useSharedValue(0.3);
  const floatY = useSharedValue(0);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );

    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
  }, []);

  const animatedGlow = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const animatedFloat = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));

  const handleStart = () => {
    speak("Démarrage du système de navigation.", "high");
    router.push({
      pathname: '/navigate',
      params: { enhancedAccessibility: enhancedAccessibility ? 'true' : 'false' }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Decorative Background Glow */}
      <Animated.View style={[styles.glowCircle, animatedGlow]} />

      <View style={styles.topNav}>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>SYSTEM ONLINE</Text>
        </View>
      </View>

      <Animated.View style={[styles.header, animatedFloat]}>
        <Text style={styles.brandSubtitle}>AL-HIKMA UNIVERSITY</Text>
        <Text style={styles.title}>SMART</Text>
        <Text style={styles.titleHighlight}>CAMPUS</Text>
        <Text style={styles.tagline}>AI-Powered Indoor Navigation</Text>
      </Animated.View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.mainButton}
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <Text style={styles.mainButtonText}>INITIALIZE NAVIGATION</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/menu')}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>ACCESS COMMAND CENTER</Text>
        </TouchableOpacity>

        <View style={styles.accessibilityToggleContainer}>
          <View>
            <Text style={styles.accessibilityLabel}>Enhanced Accessibility</Text>
            <Text style={styles.accessibilitySub}>Audio descriptions & high contrast</Text>
          </View>
          <Switch
            value={enhancedAccessibility}
            onValueChange={(val) => {
              setEnhancedAccessibility(val);
              speak(val ? "Accessibilité renforcée activée" : "Accessibilité standard");
            }}
            trackColor={{ false: '#2C3A47', true: '#00E676' }}
            thumbColor={'#FFFFFF'}
          />
        </View>
      </View>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  glowCircle: { position: 'absolute', top: '15%', left: '10%', width: 300, height: 300, borderRadius: 150, backgroundColor: '#2563EB', filter: [{ blur: 100 }], opacity: 0.1, zIndex: -1 },
  topNav: { marginTop: 20, alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(37, 99, 235, 0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(37, 99, 235, 0.3)' },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2563EB', marginRight: 8 },
  badgeText: { color: '#2563EB', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5 },
  header: { flex: 1, justifyContent: 'center', alignItems: 'flex-start', marginTop: 40, paddingHorizontal: 24 },
  brandSubtitle: { color: '#2563EB', fontSize: 12, fontWeight: 'bold', letterSpacing: 3, marginBottom: 16 },
  title: { fontSize: 56, fontWeight: '900', color: '#1E293B', letterSpacing: -1, lineHeight: 60 },
  titleHighlight: { fontSize: 56, fontWeight: '900', color: '#2563EB', letterSpacing: -1, lineHeight: 60, marginBottom: 16 },
  tagline: { fontSize: 16, color: '#64748B', letterSpacing: 0.5, maxWidth: '80%', lineHeight: 24 },
  content: { paddingHorizontal: 24, paddingBottom: 100 },
  mainButton: { backgroundColor: '#2563EB', paddingVertical: 20, borderRadius: 16, alignItems: 'center', marginBottom: 16, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 10 },
  mainButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  secondaryButton: { backgroundColor: 'transparent', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 32, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  secondaryButtonText: { color: '#1E293B', fontSize: 13, fontWeight: '700', letterSpacing: 1.5 },
  accessibilityToggleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  accessibilityLabel: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
  accessibilitySub: { fontSize: 12, color: '#64748B' }
});
