import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import VoiceButton from '../components/VoiceButton';
import CampusMap from '../components/CampusMap';
import AudioGuide from '../components/AudioGuide';
import { useNavigation } from '../hooks/useNavigation';
import { useSpeech } from '../hooks/useSpeech';
import { usePDR } from '../hooks/usePDR';

// ─── Telemetry ────────────────────────────────────────────────────────────────
const MetricBar = ({ label, value, unit, progress, color }: any) => (
  <View style={styles.metricItemContainer}>
    <Text style={styles.metricLabel}>{label}</Text>
    <View style={styles.metricValueRow}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricUnit}>{unit}</Text>
    </View>
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: color }]} />
    </View>
  </View>
);

const InfoCard = ({ label, value, align }: any) => (
  <View style={[styles.infoCard, align === 'right' ? { right: 20 } : { left: 20 }]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const TelemetryBar = ({ isNavigating }: { isNavigating: boolean }) => {
  const [accuracy, setAccuracy] = useState(1.2);
  const [latency,  setLatency]  = useState(45);

  useEffect(() => {
    if (!isNavigating) return;
    const interval = setInterval(() => {
      setAccuracy(Number((Math.random() * (1.8 - 0.8) + 0.8).toFixed(1)));
      setLatency(Math.floor(Math.random() * (60 - 30) + 30));
    }, 2000);
    return () => clearInterval(interval);
  }, [isNavigating]);

  return (
    <View style={styles.telemetryContainer}>
      <MetricBar label="WI-FI PRECISION" value={accuracy} unit="m"  progress={85} color="#00E676" />
      <MetricBar label="RAG LATENCY"     value={latency}  unit="ms" progress={92} color="#5BC0BE" />
      <MetricBar label="SAT LOCK"        value="4"        unit="/5" progress={80} color="#00E676" />
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function NavigateScreen() {
  const params                = useLocalSearchParams();
  const enhancedAccessibility = params.enhancedAccessibility === 'true';

  const {
    steps, currentStep, currentIndex, isArrived,
    startSimulation, stopSimulation,
    setSteps, setCurrentIndex, goToNextStep,
  } = useNavigation();

  const { speak } = useSpeech();
  const { stepCount } = usePDR(steps.length > 0 && !isArrived);

  // ── ① NOUVEAU : charger les steps reçus depuis AskScreen ──────────────────
  useEffect(() => {
    if (!params.steps) return;
    try {
      const parsed = JSON.parse(params.steps as string);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSteps(parsed);
        setCurrentIndex(0);
        // Lance la simulation automatiquement dès l'arrivée sur la page
        startSimulation();

        // Annonce vocale de départ
        const dest = params.destination as string | undefined;
        speak(
          dest
            ? `Navigation démarrée. Je vous guide vers ${dest}.`
            : 'Navigation démarrée.',
          'high',
        );
      }
    } catch (e) {
      console.warn('[Navigate] Impossible de parser les steps :', e);
    }
  // On ne le déclenche qu'une seule fois à l'arrivée sur la page
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── ② Avancer d'un pas physique tous les 3 pas PDR ───────────────────────
  useEffect(() => {
    if (steps.length > 0 && !isArrived && stepCount > 0 && stepCount % 3 === 0) {
      goToNextStep();
    }
  }, [stepCount]);

  // ── ③ Lire l'instruction courante à chaque changement d'étape ─────────────
  useEffect(() => {
    if (!currentStep) return;
    const text = enhancedAccessibility
      ? `${currentStep.label}. ${currentStep.accessibilityHint}`
      : currentStep.accessibilityHint;

    speak(text, 'high', () => {
      if (!isArrived) setTimeout(() => goToNextStep(), 1000);
    });
  }, [currentIndex, currentStep, enhancedAccessibility, isArrived]);

  // ── ④ Arrivée ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isArrived) {
      speak('Vous êtes arrivé à votre destination.', 'high');
      stopSimulation();
    }
  }, [isArrived]);

  // ── ⑤ Commande vocale depuis la page navigate ─────────────────────────────
  const handleSpeechEnd = async (audioUri: string | File) => {
    speak('Analyse vocale en cours...', 'normal');
    try {
      const { processVoiceCommand } = require('../services/api');
      const result = await processVoiceCommand(audioUri);

      if (!result || result.detail || !result.extracted_intent) {
        throw new Error(result?.detail || "Erreur d'analyse de l'intention");
      }

      const { extracted_intent, navigation } = result;
      speak(`Je vous emmène vers : ${extracted_intent.to_label}`, 'high', () => {
        setSteps(navigation.steps);
        setCurrentIndex(0);
        startSimulation();
      });
    } catch (err) {
      speak("Désolé, je n'ai pas compris votre demande.", 'high');
      console.error('Voice Flow Error:', err);
    }
  };

  // ── Calcul de la distance restante ────────────────────────────────────────
  const distanceRestante = (steps.length - currentIndex) * 12;
  const progressPct      = steps.length > 1
    ? (currentIndex / (steps.length - 1)) * 100
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <TelemetryBar isNavigating={steps.length > 0 && !isArrived} />

      <View style={styles.mapZone}>
        <CampusMap steps={steps} currentStepIndex={currentIndex} />

        <InfoCard label="NIVEAU ACTUEL"  value={`Étage ${currentStep?.floor ?? 0}`} align="left"  />
        <InfoCard label="DISTANCE RESTANTE" value={`${distanceRestante} m`}          align="right" />

        {/* Badge destination (affiché uniquement si on vient de l'assistant) */}
        {params.destination ? (
          <View style={styles.destBadge}>
            <Text style={styles.destBadgeLabel}>DESTINATION</Text>
            <Text style={styles.destBadgeValue}>
              {(params.destination as string).replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.bottomZone}>
        {/* Instruction + bouton vocal */}
        <View style={styles.sheetHeader}>
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionLabel}>INSTRUCTION ACTUELLE</Text>
            <Text style={styles.instructionText}>
              {currentStep?.label ?? 'Prêt pour la navigation'}
            </Text>
            {isArrived && (
              <Text style={styles.arrivedText}>✅ Vous êtes arrivé !</Text>
            )}
          </View>
          <View style={styles.voiceWrapper}>
            <VoiceButton onSpeechEnd={handleSpeechEnd} />
          </View>
        </View>

        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>

        {/* Compteur d'étapes */}
        <Text style={styles.stepCounter}>
          {steps.length > 0
            ? `Étape ${currentIndex + 1} / ${steps.length}`
            : 'Aucun itinéraire chargé'}
        </Text>

        <AudioGuide
          isSpeaking={false}
          currentText={currentStep?.accessibilityHint ?? 'En attente de destination...'}
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Telemetry
  telemetryContainer:   { backgroundColor: 'rgba(255,255,255,0.9)', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', flexDirection: 'row', justifyContent: 'space-between' },
  metricItemContainer:  { width: '30%' },
  metricLabel:          { color: '#64748B', fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  metricValueRow:       { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  metricValue:          { color: '#1E293B', fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace' },
  metricUnit:           { color: '#64748B', fontSize: 9, marginLeft: 2 },
  progressBarBg:        { height: 2, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 1 },
  progressBarFill:      { height: 2, borderRadius: 1 },

  // Map
  mapZone:  { flex: 1 },
  infoCard: { position: 'absolute', top: 20, backgroundColor: 'rgba(255,255,255,0.9)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', minWidth: 100 },
  infoLabel: { color: '#64748B', fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  infoValue: { color: '#1E293B', fontSize: 13, fontWeight: 'bold' },

  // Badge destination
  destBadge:      { position: 'absolute', bottom: 20, alignSelf: 'center', left: 20, right: 20, backgroundColor: 'rgba(37,99,235,0.92)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' },
  destBadgeLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 8, fontWeight: '900', letterSpacing: 2, marginBottom: 2 },
  destBadgeValue: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  // Bottom sheet
  bottomZone:           { position: 'absolute', bottom: 30, left: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
  sheetHeader:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  instructionContainer: { flex: 1 },
  instructionLabel:     { color: '#2563EB', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  instructionText:      { color: '#1E293B', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  arrivedText:          { color: '#00C851', fontSize: 13, fontWeight: '800', marginTop: 4 },
  voiceWrapper:         { width: 64, height: 64, marginLeft: 16 },

  // Progress
  progressContainer: { height: 4, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' },
  progressFill:      { height: '100%', backgroundColor: '#2563EB', borderRadius: 2 },

  // Step counter
  stepCounter: { color: '#64748B', fontSize: 10, fontWeight: '700', letterSpacing: 1, textAlign: 'center', marginBottom: 12 },
});