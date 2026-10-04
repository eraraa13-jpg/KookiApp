import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';

export default function EmptyState({ icon = '📭', title = 'چیزی نیست!', subtitle = '' }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50, paddingHorizontal: 40 },
  icon: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 17, fontWeight: 'bold', color: COLORS.textSecondary, textAlign: 'center' },
  subtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
});