import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const NavItem = ({ label, path }: { label: string; path: string }) => {
    const isActive = pathname === path;
    return (
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push(path as any)}
      >
        <Text style={[styles.navLabel, isActive && styles.activeLabel]}>{label}</Text>
        {isActive && <View style={styles.activeDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <NavItem label="ACCUEIL"   path="/"        />
        <NavItem label="CARTE"    path="/navigate" />
        <NavItem label="ASSISTANT" path="/ask"      />
        <NavItem label="MENU"   path="/menu"     />
        <NavItem label="RÉGLAGES"   path="/settings" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    justifyContent: 'space-between',
    width: '100%',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  navLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  activeLabel: {
    color: '#2563EB',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2563EB',
    marginTop: 4,
  },
});