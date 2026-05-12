import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NavigationStep } from '../services/api';

interface RouteStepListProps {
  steps: NavigationStep[];
  currentIndex: number;
}

export default function RouteStepList({ steps, currentIndex }: RouteStepListProps) {
  if (steps.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucun itinéraire actif.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} accessibilityRole="list">
      {steps.map((step, idx) => {
        const isPast = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        
        return (
          <View 
            key={idx} 
            style={[styles.stepItem, isCurrent && styles.currentStep]}
            accessible={true}
            accessibilityLabel={`${isCurrent ? "Étape actuelle : " : ""}${step.label}`}
          >
            <View style={[styles.bullet, isPast ? styles.bulletPast : isCurrent ? styles.bulletCurrent : styles.bulletFuture]} />
            <Text style={[styles.stepText, isCurrent && styles.currentStepText]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginBottom: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#64748B', fontSize: 16 },
  stepItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  currentStep: { backgroundColor: 'rgba(37, 99, 235, 0.05)' },
  bullet: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  bulletPast: { backgroundColor: '#CBD5E1' },
  bulletCurrent: { backgroundColor: '#2563EB', transform: [{ scale: 1.2 }] },
  bulletFuture: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#CBD5E1' },
  stepText: { fontSize: 16, color: '#64748B' },
  currentStepText: { fontWeight: 'bold', color: '#1E293B' }
});
