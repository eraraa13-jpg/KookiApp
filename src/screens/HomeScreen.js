import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import { formatCurrency, toPersianDigits } from '../utils/formatters';
import { getCurrentJalaliMonth, getStartOfJalaliMonth, getEndOfJalaliMonth, getJalaliMonthName } from '../utils/persianDate';
import { getAccounts, getAccountBalance, getTransactions, getTotalBalance, getMonthlyStats, deleteTransaction } from '../database/Database';
import TransactionCard from '../components/TransactionCard';
import EmptyState from '../components/EmptyState';

export default function HomeScreen({ navigation }) {
  const [totalBalance, setTotalBalance] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [recent, setRecent] = useState([]);
  const [stats, setStats] = useState({ income: 0, expense: 0 });
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    try {
      setTotalBalance(await getTotalBalance());
      const accs = await getAccounts();
      setAccounts(accs);
      const b = {};
      for (const a of accs) b[a.id] = await getAccountBalance(a.id);
      setBalances(b);
      setRecent(await getTransactions({ limit: 15 }));
      const cm = getCurrentJalaliMonth();
      const s = getStartOfJalaliMonth(cm.year, cm.month).toISOString().split('T')[0];
      const e = getEndOfJalaliMonth(cm.year, cm.month).toISOString().split('T')[0];
      setStats(await getMonthlyStats(s, e));
    } catch (err) { console.error(err); }
  }

  const cm = getCurrentJalaliMonth();

  return (
    <ScrollView style={styles.bg} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} colors={[COLORS.primary]} tintColor={COLORS.primary} />} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View><Text style={styles.greeting}>سلام! 🍪</Text><Text style={styles.sub}>کوکی مالی‌ات</Text></View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balLabel}>موجودی کل</Text>
          <Text style={[styles.balAmount, { color: totalBalance >= 0 ? COLORS.income : COLORS.expense }]}>{formatCurrency(totalBalance)}</Text>
          <View style={styles.monthRow}>
            <View style={styles.monthItem}>
              <View style={[styles.mIcon, { backgroundColor: COLORS.incomeBg }]}><Ionicons name="arrow-down" size={16} color={COLORS.income} /></View>
              <View><Text style={styles.mLabel}>درآمد {getJalaliMonthName(cm.month)}</Text><Text style={[styles.mVal, { color: COLORS.income }]}>{formatCurrency(stats.income)}</Text></View>
            </View>
            <View style={styles.mDiv} />
            <View style={styles.monthItem}>
              <View style={[styles.mIcon, { backgroundColor: COLORS.expenseBg }]}><Ionicons name="arrow-up" size={16} color={COLORS.expense} /></View>
              <View><Text style={styles.mLabel}>هزینه {getJalaliMonthName(cm.month)}</Text><Text style={[styles.mVal, { color: COLORS.expense }]}>{formatCurrency(stats.expense)}</Text></View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.secHead}><Text style={styles.secTitle}>حساب‌ها</Text></View>
        <FlatList data={accounts} horizontal inverted showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          keyExtractor={(i) => i.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.accCard, { borderLeftColor: item.color, borderLeftWidth: 4 }]} onPress={() => navigation.navigate('Accounts')}>
              <Text style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</Text>
              <Text style={styles.accName}>{item.name}</Text>
              <Text style={[styles.accBal, { color: (balances[item.id] || 0) >= 0 ? COLORS.income : COLORS.expense }]}>
                {formatCurrency(balances[item.id] || 0)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.quickRow}>
        {[
          { label: 'درآمد', icon: 'add-circle', color: COLORS.income, bg: COLORS.incomeBg, type: 'income' },
          { label: 'هزینه', icon: 'remove-circle', color: COLORS.expense, bg: COLORS.expenseBg, type: 'expense' },
          { label: 'انتقال', icon: 'swap-horizontal', color: '#6c5ce7', bg: 'rgba(108,92,231,0.15)', type: 'transfer' },
          { label: 'گزارش', icon: 'bar-chart', color: '#fdcb6e', bg: 'rgba(253,203,110,0.15)', type: null },
        ].map((q, i) => (
          <TouchableOpacity key={i} style={[styles.quickBtn, { backgroundColor: q.bg }]}
            onPress={() => q.type ? navigation.navigate('AddTransaction', { defaultType: q.type }) : navigation.navigate('Reports')}>
            <Ionicons name={q.icon} size={24} color={q.color} />
            <Text style={[styles.quickText, { color: q.color }]}>{q.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.secHead}>
          <Text style={styles.secTitle}>تراکنش‌های اخیر</Text>
          <Text style={styles.seeAll}>{toPersianDigits(recent.length.toString())} مورد</Text>
        </View>
        {recent.length === 0 ? <EmptyState icon="🍪" title="هنوز تراکنشی نداری!" subtitle="از دکمه + اولین تراکنشت رو ثبت کن" /> :
          recent.map((t) => <TransactionCard key={t.id} transaction={t}
            onPress={(tr) => navigation.navigate('AddTransaction', { editTransaction: tr })}
            onLongPress={(tr) => Alert.alert('حذف', 'حذف بشه؟', [{ text: 'انصراف', style: 'cancel' }, { text: 'حذف', style: 'destructive', onPress: async () => { await deleteTransaction(tr.id); load(); } }])}
          />)
        }
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 26, fontWeight: 'bold', color: COLORS.text, textAlign: 'right' },
  sub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, textAlign: 'right' },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  balanceCard: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 22, elevation: 6 },
  balLabel: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  balAmount: { fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginVertical: 12 },
  monthRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  monthItem: { flexDirection: 'row', alignItems: 'center' },
  mIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  mLabel: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right' },
  mVal: { fontSize: 14, fontWeight: 'bold', textAlign: 'right', marginTop: 2 },
  mDiv: { width: 1, height: 36, backgroundColor: COLORS.divider },
  section: { marginTop: 20 },
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  secTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.text },
  seeAll: { fontSize: 13, color: COLORS.primary },
  accCard: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 16, marginHorizontal: 6, width: 150, alignItems: 'center' },
  accName: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  accBal: { fontSize: 13, fontWeight: 'bold' },
  quickRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, justifyContent: 'space-between' },
  quickBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, marginHorizontal: 3, borderRadius: 14 },
  quickText: { fontSize: 11, fontWeight: '600', marginTop: 4 },
});