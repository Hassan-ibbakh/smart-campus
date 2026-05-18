import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, StatusBar, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing } from 'react-native-reanimated';
import { useSpeech } from '../hooks/useSpeech';
import BottomNav from '../components/BottomNav';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const router = useRouter();
  const { speak } = useSpeech();
  const [enhancedAccessibility, setEnhancedAccessibility] = useState(false);

  // Animations pour le côté "vivant"
  const glowScale = useSharedValue(1);
  const floatY = useSharedValue(0);

  useEffect(() => {
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );

    floatY.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
  }, []);

  const animatedGlow = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: 0.15
  }));

  const animatedFloat = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }]
  }));

  const handleStart = () => {
    speak("Bienvenue. Je suis Luna, votre concierge personnelle. Je suis là pour rendre votre visite au mall fluide, mémorable et sans aucun effort.", "high");
    router.push({
      pathname: '/navigate',
      params: { enhancedAccessibility: enhancedAccessibility ? 'true' : 'false' }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Fond Dégradé Premium */}
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        style={StyleSheet.absoluteFill}
      />

      {/* Cercles Lumineux (L'âme du système) */}
      <Animated.View style={[styles.glowCircle, animatedGlow]} />
      <View style={styles.glowCircle2} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topNav}>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>INTELLIGENCE INCLUSIVE</Text>
          </View>
        </View>

        <Animated.View style={[styles.header, animatedFloat]}>
          <Text style={styles.brandSubtitle}>VOTRE CONCIERGE PERSONNEL</Text>
          <Text style={styles.title}>L'Expérience</Text>
          <Text style={styles.titleHighlight}>Mémorable.</Text>
          <Text style={styles.tagline}>
            La navigation intelligente qui transforme chaque visite en un moment de plaisir, sans friction.
          </Text>
        </Animated.View>

        <View style={styles.content}>
          <TouchableOpacity
            style={styles.mainButton}
            onPress={handleStart}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.mainButtonText}>COMMENCER LE VOYAGE</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.accessibilitySection}>
            <View style={styles.glassCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.accessibilityLabel}>Mode Inclusif</Text>
                  <Text style={styles.accessibilitySub}>Parcours sans obstacles & guidage vocal</Text>
                </View>
                <Switch
                  value={enhancedAccessibility}
                  onValueChange={(val) => {
                    setEnhancedAccessibility(val);
                    speak(val ? "Mode inclusif activé. Je privilégierai les ascenseurs et les rampes." : "Mode standard activé.");
                  }}
                  trackColor={{ false: '#334155', true: '#3B82F6' }}
                  thumbColor={'#FFFFFF'}
                />
              </View>
            </View>
          </View>
          
          <Text style={styles.footerText}>Développé avec ❤️ pour le MIAthon 2026</Text>
        </View>
      </SafeAreaView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  safeArea: { flex: 1 },
  glowCircle: { position: 'absolute', top: '10%', right: '-20%', width: 400, height: 400, borderRadius: 200, backgroundColor: '#3B82F6', filter: 'blur(80px)', zIndex: 0 },
  glowCircle2: { position: 'absolute', bottom: '20%', left: '-10%', width: 300, height: 300, borderRadius: 150, backgroundColor: '#6366F1', opacity: 0.1, filter: 'blur(60px)', zIndex: 0 },
  topNav: { marginTop: 10, alignItems: 'center', zIndex: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  badgeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', marginRight: 10, shadowColor: '#3B82F6', shadowRadius: 5, shadowOpacity: 0.8 },
  badgeText: { color: '#94A3B8', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  header: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, zIndex: 10 },
  brandSubtitle: { color: '#3B82F6', fontSize: 14, fontWeight: '800', letterSpacing: 4, marginBottom: 12 },
  title: { fontSize: 52, fontWeight: '300', color: '#F8FAFC', letterSpacing: -1 },
  titleHighlight: { fontSize: 52, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1, marginBottom: 20 },
  tagline: { fontSize: 18, color: '#94A3B8', lineHeight: 28, maxWidth: '90%' },
  content: { paddingHorizontal: 24, paddingBottom: 110, zIndex: 10 },
  mainButton: { borderRadius: 20, overflow: 'hidden', marginBottom: 24, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  gradientButton: { paddingVertical: 22, alignItems: 'center' },
  mainButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  accessibilitySection: { marginBottom: 20 },
  glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accessibilityLabel: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 },
  accessibilitySub: { fontSize: 13, color: '#64748B', maxWidth: '80%' },
  footerText: { textAlign: 'center', color: '#475569', fontSize: 11, letterSpacing: 1 }
});
