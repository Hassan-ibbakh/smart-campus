import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { fetchBuildings, fetchHistory, fetchEmergency } from '../services/api';
import BottomNav from '../components/BottomNav';

export default function MenuScreen() {
  const router = useRouter();
  const [buildings, setBuildings] = useState([]);
  const [history, setHistory] = useState([]);
  const [emergency, setEmergency] = useState(null);

  useEffect(() => {
    fetchBuildings().then(setBuildings);
    fetchHistory().then(setHistory);
    fetchEmergency().then(setEmergency);
  }, []);

  const MenuCard = ({ title, children, style }: any) => (
    <View style={[styles.card, style]}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>COMMAND CENTER</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <MenuCard title="CAMPUS INFRASTRUCTURE">
          <View style={styles.buildingGrid}>
            {buildings.map((b: any) => (
              <View key={b.id} style={[styles.buildingItem, { borderColor: `${b.color}40` }]}>
                <View style={[styles.typeBadge, { backgroundColor: b.color }]} />
                <Text style={styles.buildingName}>{b.name}</Text>
                <Text style={styles.buildingNameAr}>{b.nameAr}</Text>
                <Text style={styles.buildingInfo}>{b.floors} FLOORS • {b.type.toUpperCase()}</Text>
              </View>
            ))}
          </View>
          
          {/* Figma Inspiration: Quick Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>BUILDINGS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>48</Text>
              <Text style={styles.statLabel}>DEPTS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>200+</Text>
              <Text style={styles.statLabel}>ROOMS</Text>
            </View>
          </View>
        </MenuCard>

        <MenuCard title="RECENT DEPLOYMENTS (HISTORY)">
          {history.map((h: any) => (
            <View key={h.id} style={styles.historyItem}>
              <View>
                <Text style={styles.historyDest}>{h.destination}</Text>
                <Text style={styles.historyDate}>{h.date} • {h.time}</Text>
              </View>
              <Text style={styles.historyArrow}>→</Text>
            </View>
          ))}
        </MenuCard>

        {emergency && (
          <MenuCard title="EMERGENCY PROTOCOLS" style={styles.emergencyCard}>
            <View style={styles.emergencyRow}>
              <Text style={styles.emergencyLabel}>Security</Text>
              <Text style={styles.emergencyValue}>{emergency.security}</Text>
            </View>
            <View style={styles.emergencyRow}>
              <Text style={styles.emergencyLabel}>Medical</Text>
              <Text style={styles.emergencyValue}>{emergency.medical}</Text>
            </View>
          </MenuCard>
        )}
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  backButton: { marginRight: 20 },
  backText: { color: '#2563EB', fontSize: 12, fontWeight: 'bold' },
  headerTitle: { color: '#1E293B', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardTitle: { color: '#2563EB', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' },
  buildingGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  buildingItem: { width: '48%', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  typeBadge: { width: 12, height: 2, borderRadius: 1, marginBottom: 8 },
  buildingName: { color: '#1E293B', fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  buildingNameAr: { color: '#64748B', fontSize: 12, marginBottom: 8, textAlign: 'right' },
  buildingInfo: { color: '#64748B', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  statsBar: { flexDirection: 'row', backgroundColor: 'rgba(37, 99, 235, 0.05)', borderRadius: 12, padding: 12, marginTop: 16, justifyContent: 'space-between', alignItems: 'center' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { color: '#1E293B', fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace' },
  statLabel: { color: '#64748B', fontSize: 8, fontWeight: '900' },
  statDivider: { width: 1, height: 20, backgroundColor: 'rgba(0,0,0,0.1)' },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  historyDest: { color: '#1E293B', fontSize: 14, fontWeight: '500' },
  historyDate: { color: '#64748B', fontSize: 11, marginTop: 2 },
  historyArrow: { color: '#2563EB', fontSize: 18 },
  emergencyCard: { borderColor: 'rgba(255, 71, 87, 0.4)' },
  emergencyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  emergencyLabel: { color: '#64748B', fontSize: 13 },
  emergencyValue: { color: '#FF4757', fontSize: 13, fontWeight: 'bold' }
});
