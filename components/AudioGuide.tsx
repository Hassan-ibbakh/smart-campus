import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AudioGuide({ currentText }: { isSpeaking: boolean, currentText: string }) {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <Text style={styles.label}>Guide Audio :</Text>
      <Text style={styles.text}>{currentText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#185FA5', padding: 15, borderRadius: 10 },
  label: { color: '#8fbbe3', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  text: { color: '#fff', fontSize: 16, fontWeight: '500' }
});
