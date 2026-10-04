import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../utils/colors';
import { formatCurrency } from '../utils/formatters';
import { formatJalaliDate } from '../utils/persianDate';

export default function TransactionCard({ transaction, onPress, onLongPress }) {
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress?.(transaction)} onLongPress={() => onLongPress?.(transaction)} activeOpacity={0.7}>
      <View style={[styles.iconBox, { backgroundColor: (transaction.category_color || '#666') + '25' }]}>
        <Text style={styles.icon}>{isTransfer ? '🔄' : (transaction.category_icon || '📌')}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {isTransfer ? 'انتقال به ' + transaction.to_account_name : (transaction.category_name || 'بدون دسته')}
        </Text>
        <Text style={styles.desc} numberOfLines={1}>{transaction.description || transaction.account_name}</Text>
        <Text style={styles.date}>{formatJalaliDate(transaction.date)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: isIncome ? COLORS.income : isTransfer ? COLORS.textSecondary : COLORS.expense }]}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </Text>
        <Text style={styles.accName}>{transaction.account_name}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, padding: 14, marginHorizontal: 16, marginVertical: 4 },
  iconBox: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  icon: { fontSize: 22 },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, textAlign: 'right' },
  desc: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'right', marginTop: 2 },
  date: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right', marginTop: 2 },
  right: { alignItems: 'flex-end', marginRight: 4 },
  amount: { fontSize: 14, fontWeight: 'bold' },
  accName: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
});