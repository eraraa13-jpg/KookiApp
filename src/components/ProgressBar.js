import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';
import { toPersianDigits } from '../utils/formatters';

export default function ProgressBar({ value, maxValue, color = COLORS.primary, height = 8 }) {
  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  const over = value > maxValue;
  return (
    <View style={styles.row}>
      <View style={[styles.bg, { height, borderRadius: height / 2 }]}>
        <View style={[styles.fill, { width: pct + '%', height, borderRadius: height / 2, backgroundColor: over ? COLORS.expense : color }]} />
      </View>
      <Text style={[styles.pct, { color: over ? COLORS.expense : color }]}>
        {toPersianDigits(Math.round(pct).toString())}٪
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  bg: { flex: 1, backgroundColor: COLORS.surfaceLight, overflow: 'hidden' },
  fill: {},
  pct: { fontSize: 12, fontWeight: 'bold', marginRight: 8, width: 36, textAlign: 'left' },
});