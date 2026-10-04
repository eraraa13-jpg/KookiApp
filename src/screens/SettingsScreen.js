import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { COLORS } from '../utils/colors';
import { exportData, getTotalBalance, getAccounts, getTransactions } from '../database/Database';
import { formatCurrency, toPersianDigits } from '../utils/formatters';

export default function SettingsScreen({ navigation }) {
  const [stats, setStats] = useState({ totalBalance: 0, accountCount: 0, transactionCount: 0 });

  useEffect(() => {
    (async () => {
      const b = await getTotalBalance();
      const a = await getAccounts();
      const t = await getTransactions({});
      setStats({ totalBalance: b, accountCount: a.length, transactionCount: t.length });
    })();
  }, []);

  async function handleBackup() {
    try {
      const data = await exportData();
      const path = FileSystem.documentDirectory + 'kooki_backup.json';
      await FileSystem.writeAsStringAsync(path, data);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(path);
      else Alert.alert('خطا', 'امکان اشتراک‌گذاری نیست');
    } catch (e) { Alert.alert('خطا', 'مشکل در پشتیبان‌گیری'); }
  }

  async function handleShare() {
    const msg = '🍪 گزارش مالی کوکی:\nموجودی: ' + formatCurrency(stats.totalBalance) + '\nحساب‌ها: ' + toPersianDigits(stats.accountCount.toString()) + '\nتراکنش‌ها: ' + toPersianDigits(stats.transactionCount.toString());
    await Share.share({ message: msg });
  }

  return (
    <ScrollView style={styles.bg} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><Text style={styles.title}>تنظیمات ⚙️</Text></View>
      <View style={styles.infoCard}>
        <Text style={{ fontSize: 44, marginBottom: 8 }}>🍪</Text>
        <Text style={styles.appName}>کوکی</Text>
        <Text style={styles.appSub}>مدیریت مالی شخصی لوکال</Text>
        <View style={styles.statsRow}>
          <View style={{ alignItems: 'center', flex: 1 }}><Text style={styles.statVal}>{toPersianDigits(stats.accountCount.toString())}</Text><Text style={styles.statLbl}>حساب</Text></View>
          <View style={styles.div} />
          <View style={{ alignItems: 'center', flex: 1 }}><Text style={styles.statVal}>{toPersianDigits(stats.transactionCount.toString())}</Text><Text style={styles.statLbl}>تراکنش</Text></View>
          <View style={styles.div} />
          <View style={{ alignItems: 'center', flex: 1 }}><Text style={[styles.statVal, { fontSize: 13 }]}>{formatCurrency(stats.totalBalance)}</Text><Text style={styles.statLbl}>موجودی</Text></View>
        </View>
      </View>

      <View style={styles.menuCard}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Categories')}>
          <Ionicons name="folder-outline" size={22} color="#6c5ce7" style={{ marginLeft: 12 }} />
          <Text style={styles.menuText}>مدیریت دسته‌بندی‌ها</Text>
          <Ionicons name="chevron-back" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Accounts')}>
          <Ionicons name="wallet-outline" size={22} color="#00b894" style={{ marginLeft: 12 }} />
          <Text style={styles.menuText}>مدیریت حساب‌ها</Text>
          <Ionicons name="chevron-back" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleBackup}>
          <Ionicons name="cloud-download-outline" size={22} color="#fdcb6e" style={{ marginLeft: 12 }} />
          <Text style={styles.menuText}>پشتیبان‌گیری (خروجی JSON)</Text>
          <Ionicons name="chevron-back" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color="#74b9ff" style={{ marginLeft: 12 }} />
          <Text style={styles.menuText}>اشتراک‌گذاری خلاصه</Text>
          <Ionicons name="chevron-back" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, textAlign: 'right' },
  infoCard: { backgroundColor: COLORS.surface, borderRadius: 22, padding: 20, marginHorizontal: 16, marginTop: 12, alignItems: 'center' },
  appName: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  appSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 },
  statsRow: { flexDirection: 'row', width: '100%', backgroundColor: COLORS.surfaceLight, borderRadius: 14, padding: 12 },
  statVal: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  statLbl: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  div: { width: 1, backgroundColor: COLORS.divider },
  menuCard: { backgroundColor: COLORS.surface, borderRadius: 20, marginHorizontal: 16, marginTop: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderBottomColor: COLORS.divider },
  menuText: { flex: 1, fontSize: 15, color: COLORS.text, textAlign: 'right' },
});