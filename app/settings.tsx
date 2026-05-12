import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import BottomNav from '../components/BottomNav';

const SettingItem = ({ label, description, value, onToggle }: any) => (
  <View style={styles.settingItem}>
    <View style={styles.settingText}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
      thumbColor={'#FFFFFF'}
    />
  </View>
);

export default function SettingsScreen() {
  const router = useRouter();
  const [wifiMode, setWifiMode] = useState(true);
  const [autoLoc, setAutoLoc] = useState(true);
  const [voiceGuidance, setVoiceGuidance] = useState(true);
  const [notifications, setNotifications] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SYSTEM CONFIG</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NAVIGATION ENGINE</Text>
          <View style={styles.glassCard}>
            <SettingItem 
              label="Wi-Fi Fingerprinting" 
              description="Enable high-precision indoor mapping" 
              value={wifiMode} 
              onToggle={setWifiMode} 
            />
            <View style={styles.divider} />
            <SettingItem 
              label="Auto-Detect Location" 
              description="Real-time situational awareness" 
              value={autoLoc} 
              onToggle={setAutoLoc} 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCESSIBILITY MODULES</Text>
          <View style={styles.glassCard}>
            <SettingItem 
              label="Voice Guidance" 
              description="Real-time audio navigation cues" 
              value={voiceGuidance} 
              onToggle={setVoiceGuidance} 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SYSTEM NOTIFICATIONS</Text>
          <View style={styles.glassCard}>
            <SettingItem 
              label="Push Alerts" 
              description="Campus emergency & status updates" 
              value={notifications} 
              onToggle={setNotifications} 
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Smart Campus UMP — Version 2.1.0</Text>
          <Text style={styles.infoSub}>Engineering Grade Infrastructure</Text>
        </View>
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
  section: { marginBottom: 32 },
  sectionTitle: { color: '#2563EB', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
  glassCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  settingText: { flex: 1, marginRight: 16 },
  settingLabel: { color: '#1E293B', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  settingDescription: { color: '#64748B', fontSize: 11, lineHeight: 16 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginHorizontal: 16 },
  infoBox: { marginTop: 40, alignItems: 'center' },
  infoText: { color: '#2563EB', fontSize: 12, fontWeight: 'bold' },
  infoSub: { color: '#64748B', fontSize: 10, marginTop: 4 }
});
