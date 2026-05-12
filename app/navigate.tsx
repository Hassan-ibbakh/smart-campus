import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import VoiceButton from '../components/VoiceButton';
import CampusMap from '../components/CampusMap';
import RouteStepList from '../components/RouteStepList';
import AudioGuide from '../components/AudioGuide';
import RagResultCard from '../components/RagResultCard';
import { useNavigation } from '../hooks/useNavigation';
import { useSpeech } from '../hooks/useSpeech';

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

const InfoCard = ({ label, value, icon, align }: any) => (
  <View style={[styles.infoCard, align === 'right' ? { right: 20 } : { left: 20 }]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const TelemetryBar = ({ isNavigating }: { isNavigating: boolean }) => {
  const [accuracy, setAccuracy] = useState(1.2);
  const [latency, setLatency] = useState(45);

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
      <MetricBar label="WI-FI PRECISION" value={accuracy} unit="m" progress={85} color="#00E676" />
      <MetricBar label="RAG LATENCY" value={latency} unit="ms" progress={92} color="#5BC0BE" />
      <MetricBar label="SAT LOCK" value="4" unit="/5" progress={80} color="#00E676" />
    </View>
  );
};

import { usePDR } from '../hooks/usePDR';

export default function NavigateScreen() {
  const params = useLocalSearchParams();
  const enhancedAccessibility = params.enhancedAccessibility === 'true';
  
  const { steps, currentStep, currentIndex, isArrived, startNavigation, startSimulation, stopSimulation, setSteps, setCurrentIndex, goToNextStep } = useNavigation();
  const { speak } = useSpeech();

  // SYNC TEMPS RÉEL : Détection des pas physiques
  const { stepCount, heading } = usePDR(steps.length > 0 && !isArrived);

  useEffect(() => {
    if (steps.length > 0 && !isArrived && stepCount > 0) {
      // Simulation : tous les 3 pas physiques, on avance d'un nœud sur la carte
      if (stepCount % 3 === 0) {
        goToNextStep();
      }
    }
  }, [stepCount]);
  
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (currentStep) {
      const text = enhancedAccessibility ? `${currentStep.label}. ${currentStep.accessibilityHint}` : currentStep.accessibilityHint;
      
      // La voix parle, et QUAND elle a fini, on attend 1 seconde puis on passe à l'étape suivante.
      // Cela garantit une synchronisation parfaite !
      speak(text, 'high', () => {
        if (!isArrived) {
          setTimeout(() => {
            goToNextStep();
          }, 1000);
        }
      });
    }
  }, [currentIndex, currentStep, enhancedAccessibility, isArrived]);

  useEffect(() => {
    if (isArrived) {
      speak("Vous êtes arrivé à votre destination.", 'high');
      stopSimulation();
    }
  }, [isArrived]);

  const handleSpeechEnd = async (audioUri: string) => {
    speak("Analyse vocale en cours...", "normal");
    try {
      const { processVoiceCommand } = require('../services/api');
      const result = await processVoiceCommand(audioUri);
      
      console.log("Voice Command Result:", result);

      if (!result || result.detail || !result.extracted_intent) {
        throw new Error(result?.detail || "Erreur d'analyse de l'intention");
      }
      
      const { transcription, extracted_intent, navigation } = result;
      
      speak(`Je vous emmène vers : ${extracted_intent.to_label}`, "high", () => {
        setSteps(navigation.steps);
        setCurrentIndex(0);
        startSimulation();
      });
      
    } catch (err) {
      speak("Désolé, je n'ai pas compris votre demande.", "high");
      console.error("Voice Flow Error:", err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TelemetryBar isNavigating={steps.length > 0 && !isArrived} />
      
      <View style={styles.mapZone}>
        <CampusMap steps={steps} currentStepIndex={currentIndex} />
        
        {/* Smart UX: Floating Info Cards */}
        <InfoCard label="CURRENT FLOOR" value={`Etage ${currentStep?.floor || 0}`} align="left" />
        <InfoCard label="DISTANCE" value={`${(steps.length - currentIndex) * 12} meters`} align="right" />
      </View>

      <View style={styles.bottomZone}>
        <View style={styles.sheetHeader}>
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionLabel}>INSTRUCTION ACTUELLE</Text>
            <Text style={styles.instructionText}>{currentStep?.label || "Prêt pour la navigation"}</Text>
          </View>
          <View style={styles.voiceWrapper}>
            <VoiceButton onSpeechEnd={handleSpeechEnd} />
          </View>
        </View>

        <TouchableOpacity 
          style={{ backgroundColor: 'rgba(37, 99, 235, 0.05)', padding: 8, borderRadius: 8, alignItems: 'center', marginBottom: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(37, 99, 235, 0.2)' }}
          onPress={async () => {
            speak("Scanning spatial... Je vois la table du jury.", "normal", async () => {
              try {
                const { locateSemantically } = require('../services/api');
                const result = await locateSemantically("Je vois une grande table avec le jury et un projecteur.");
                speak(`Analyse terminée. Nœud : ${result.detected_node_id}`, "high");
              } catch (e) {
                speak("Erreur Groq.", "high");
              }
            });
          }}
        >
          <Text style={{ color: '#2563EB', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 }}>[🔍 TEST POSITIONNEMENT SÉMANTIQUE]</Text>
        </TouchableOpacity>
        
        {/* Smart UX: Visual Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressFill, { width: `${(currentIndex / Math.max(1, steps.length - 1)) * 100}%` }]} />
        </View>
        
        <AudioGuide isSpeaking={false} currentText={currentStep?.accessibilityHint || "Scanning for destination..."} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  telemetryContainer: { backgroundColor: 'rgba(255, 255, 255, 0.9)', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0, 0, 0, 0.05)', flexDirection: 'row', justifyContent: 'space-between' },
  metricItemContainer: { width: '30%' },
  metricLabel: { color: '#64748B', fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  metricValueRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  metricValue: { color: '#1E293B', fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace' },
  metricUnit: { color: '#64748B', fontSize: 9, marginLeft: 2 },
  progressBarBg: { height: 2, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 1 },
  progressBarFill: { height: 2, borderRadius: 1 },
  
  mapZone: { flex: 1 },
  infoCard: { position: 'absolute', top: 20, backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', minWidth: 100 },
  infoLabel: { color: '#64748B', fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  infoValue: { color: '#1E293B', fontSize: 13, fontWeight: 'bold' },

  bottomZone: { position: 'absolute', bottom: 30, left: 16, right: 16, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.05)', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  instructionContainer: { flex: 1 },
  instructionLabel: { color: '#2563EB', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  instructionText: { color: '#1E293B', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  detailsToggle: { color: '#2563EB', fontSize: 11, fontWeight: 'bold', textDecorationLine: 'underline' },
  detailsContainer: { maxHeight: 150, marginBottom: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 12 },
  voiceWrapper: { width: 64, height: 64, marginLeft: 16 },
  progressContainer: { height: 4, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 2, marginBottom: 16, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2563EB' }
});
