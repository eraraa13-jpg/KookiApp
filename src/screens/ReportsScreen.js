import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import { formatCurrency, formatNumber, toPersianDigits } from '../utils/formatters';
import { getCurrentJalaliMonth, getStartOfJalaliMonth, getEndOfJalaliMonth, getJalaliMonthName } from '../utils/persianDate';
import { getMonthlyStats, getCategoryStats } from '../database/Database';
import ProgressBar from '../components/ProgressBar';
import EmptyState from '../components/EmptyState';

export default function ReportsScreen() {
  const [cm, setCm] = useState(getCurrentJalaliMonth());
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });
  const [expCats, setExpCats] = useState([]);
  const [incCats, setIncCats] = useState([]);
  const [tab, setTab] = useState('expense');

  useFocusEffect(useCallback(() => { load(); }, [cm]));

  async function load() {
    const s = getStartOfJalaliMonth(cm.year, cm.month).toISOString().split('T')[0];
    const e = getEndOfJalaliMonth(cm.year, cm.month).toISOString().split('T')[0];
    setStats(await getMonthlyStats(s, e));
    setExpCats(await getCategoryStats('expense', s, e));
    setIncCats(await getCategoryStats('income', s, e));
  }

  function prev() { let { year, month } = cm; month--; if (month < 1) { month = 12; year--; } setCm({ year, month }); }
  function next() { let { year, month } = cm; month++; if (month > 12) { month = 1; year++; } setCm({ year, month }); }

  const currentCats = tab === 'expense' ? expCats : incCats;
  const total = currentCats.reduce((a, b) => a + b.total, 0);

  return (
    <ScrollView style={styles.bg} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><Text style={styles.title}>گزارش‌ها 📊</Text></View>

      <View style={styles.mSelector}>
        <TouchableOpacity onPress={next} style={styles.mBtn}><Ionicons name="chevron-forward" size={22} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.mText}>{getJalaliMonthName(cm.month)} {toPersianDigits(cm.year.toString())}</Text>
        <TouchableOpacity onPress={prev} style={styles.mBtn}><Ionicons name="chevron-back" size={22} color={COLORS.text} /></TouchableOpacity>
      </View>

      <View style={styles.sumCard}>
        <View style={styles.sumRow}>
          <View style={styles.sumCol}><Text style={styles.sLbl}>درآمد</Text><Text style={[styles.sVal, { color: COLORS.income }]}>{formatCurrency(stats.income)}</Text></View>
          <View style={styles.div} />
          <View style={styles.sumCol}><Text style={styles.sLbl}>هزینه</Text><Text style={[styles.sVal, { color: COLORS.expense }]}>{formatCurrency(stats.expense)}</Text></View>
          <View style={styles.div} />
          <View style={styles.sumCol}><Text style={styles.sLbl}>تراز</Text><Text style={[styles.sVal, { color: stats.balance >= 0 ? COLORS.income : COLORS.expense }]}>{formatCurrency(Math.abs(stats.balance))}</Text></View>
        </View>
        {stats.income > 0 && (
          <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.divider }}>
            <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 6, textAlign: 'right' }}>نسبت هزینه به درآمد</Text>
            <ProgressBar value={stats.expense} maxValue={stats.income} color={COLORS.primary} height={8} />
          </View>
        )}
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'expense' && { backgroundColor: COLORS.expenseBg }]} onPress={() => setTab('expense')}>
          <Text style={[styles.tabText, tab === 'expense' && { color: COLORS.expense }]}>هزینه‌ها</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'income' && { backgroundColor: COLORS.incomeBg }]} onPress={() => setTab('income')}>
          <Text style={[styles.tabText, tab === 'income' && { color: COLORS.income }]}>درآمدها</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>جزئیات {tab === 'expense' ? 'هزینه‌ها' : 'درآمدها'}</Text>
        <Text style={styles.cardSub}>مجموع: {formatCurrency(total)}</Text>
        {currentCats.length === 0 ? <EmptyState icon="📊" title="داده‌ای نیست" /> :
          currentCats.map((c) => {
            const pct = total > 0 ? (c.total / total) * 100 : 0;
            return (
              <View key={c.id} style={styles.catRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, marginLeft: 8 }}>{c.icon}</Text>
                  <View><Text style={styles.catName}>{c.name}</Text><Text style={styles.catCnt}>{toPersianDigits(c.count.toString())} تراکنش</Text></View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.catVal}>{formatNumber(c.total)} ت</Text>
                  <Text style={styles.catPct}>{toPersianDigits(Math.round(pct).toString())}٪</Text>
                </View>
              </View>
            );
          })
        }
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 6 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, textAlign: 'right' },
  mSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginVertical: 14 },
  mBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  mText: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  sumCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 18, marginHorizontal: 16, marginBottom: 14 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-around' },
  sumCol: { alignItems: 'center', flex: 1 },
  sLbl: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
  sVal: { fontSize: 13, fontWeight: 'bold' },
  div: { width: 1, backgroundColor: COLORS.divider },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 14, backgroundColor: COLORS.surface, borderRadius: 14, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  card: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, marginHorizontal: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, textAlign: 'right' },
  cardSub: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'right', marginBottom: 12 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.divider },
  catName: { fontSize: 14, fontWeight: '600', color: COLORS.text, textAlign: 'right' },
  catCnt: { fontSize: 10, color: COLORS.textMuted, textAlign: 'right', marginTop: 2 },
  catVal: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  catPct: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});