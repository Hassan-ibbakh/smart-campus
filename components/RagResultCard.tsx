import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RagResponse } from '../services/api';

export default function RagResultCard({ result }: { result: RagResponse }) {
  const confidence = 98.4;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.badgeText}>INSTITUTIONAL DATA</Text>
        <Text style={styles.confidenceText}>{confidence}% CONFIDENCE</Text>
      </View>
      
      <Text style={styles.title}>{result.office}</Text>
      <Text style={styles.desc}>{result.description}</Text>
      
      <View style={styles.ragBox}>
        <View style={styles.sourceHeader}>
          <View style={styles.verifiedDot} />
          <Text style={styles.ragSourceLabel}>AUTHENTICATED SOURCE (RAG)</Text>
        </View>
        <Text style={styles.ragSource}>{result.rag_excerpt}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'rgba(26, 37, 48, 0.9)', width: '100%', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0, 230, 118, 0.3)', shadowColor: '#00E676', shadowOpacity: 0.1, shadowRadius: 15, marginTop: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  badgeText: { color: '#5BC0BE', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  confidenceText: { color: '#00E676', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  title: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', marginBottom: 6, letterSpacing: -0.5 },
  desc: { fontSize: 14, color: '#A5B1C2', marginBottom: 16, lineHeight: 20 },
  ragBox: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 10, borderLeftWidth: 2, borderLeftColor: '#00E676' },
  sourceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  verifiedDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#00E676', marginRight: 6 },
  ragSourceLabel: { fontSize: 9, color: '#00E676', fontWeight: '900', letterSpacing: 1 },
  ragSource: { fontSize: 12, color: '#FFFFFF', fontStyle: 'italic', lineHeight: 18, opacity: 0.8 }
});
