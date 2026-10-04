import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import { toEnglishDigits } from '../utils/formatters';
import { formatJalaliDate } from '../utils/persianDate';
import { getAccounts, getCategories, addTransaction, updateTransaction } from '../database/Database';
import Toast from 'react-native-toast-message';

export default function AddTransactionScreen({ navigation, route }) {
  const edit = route?.params?.editTransaction;
  const defType = route?.params?.defaultType || 'expense';

  const [type, setType] = useState(edit?.type || defType);
  const [amount, setAmount] = useState(edit ? edit.amount.toString() : '');
  const [desc, setDesc] = useState(edit?.description || '');
  const [catId, setCatId] = useState(edit?.category_id || null);
  const [accId, setAccId] = useState(edit?.account_id || null);
  const [toAccId, setToAccId] = useState(edit?.to_account_id || null);
  const [date, setDate] = useState(edit?.date || new Date().toISOString().split('T')[0]);
  const [cats, setCats] = useState([]);
  const [accs, setAccs] = useState([]);

  useEffect(() => { load(); }, [type]);

  async function load() {
    const a = await getAccounts();
    setAccs(a);
    if (!accId && a.length) setAccId(a[0].id);
    if (type !== 'transfer') setCats(await getCategories(type));
  }

  async function save() {
    const n = parseFloat(toEnglishDigits(amount));
    if (!n || n <= 0) return Alert.alert('خطا', 'مبلغ رو وارد کن');
    if (!accId) return Alert.alert('خطا', 'حساب رو انتخاب کن');
    if (type !== 'transfer' && !catId) return Alert.alert('خطا', 'دسته‌بندی رو انتخاب کن');
    if (type === 'transfer' && !toAccId) return Alert.alert('خطا', 'حساب مقصد رو انتخاب کن');
    if (type === 'transfer' && accId === toAccId) return Alert.alert('خطا', 'مبدا و مقصد یکیه');

    const data = { amount: n, type, category_id: type === 'transfer' ? null : catId, account_id: accId, to_account_id: type === 'transfer' ? toAccId : null, description: desc, date };
    try {
      if (edit) { await updateTransaction(edit.id, data); Toast.show({ type: 'success', text1: 'ویرایش شد ✅' }); }
      else { await addTransaction(data); Toast.show({ type: 'success', text1: 'ثبت شد 🍪' }); }
      navigation.goBack();
    } catch (e) { Alert.alert('خطا', e.message); }
  }

  const types = [
    { key: 'expense', label: 'هزینه', icon: 'arrow-up-circle', color: COLORS.expense },
    { key: 'income', label: 'درآمد', icon: 'arrow-down-circle', color: COLORS.income },
    { key: 'transfer', label: 'انتقال', icon: 'swap-horizontal-outline', color: '#6c5ce7' },
  ];
  const accent = type === 'income' ? COLORS.income : type === 'expense' ? COLORS.expense : '#6c5ce7';

  return (
    <KeyboardAvoidingView style={styles.bg} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
          <Text style={styles.title}>{edit ? 'ویرایش' : 'تراکنش جدید'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.typeRow}>
          {types.map((t) => (
            <TouchableOpacity key={t.key} style={[styles.typeBtn, type === t.key && { backgroundColor: t.color + '25', borderColor: t.color }]}
              onPress={() => { setType(t.key); setCatId(null); }}>
              <Ionicons name={t.icon} size={20} color={type === t.key ? t.color : COLORS.textMuted} />
              <Text style={[styles.typeText, type === t.key && { color: t.color }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.amtSec}>
          <Text style={styles.amtLabel}>مبلغ (تومان)</Text>
          <TextInput style={[styles.amtInput, { color: accent, borderBottomColor: accent }]} placeholder="۰" placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric" value={amount} onChangeText={setAmount} textAlign="center" />
        </View>

        <View style={styles.sec}>
          <Text style={styles.secLabel}>{type === 'transfer' ? 'از حساب' : 'حساب'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row' }}>
              {accs.map((a) => (
                <TouchableOpacity key={a.id} style={[styles.accOpt, accId === a.id && { backgroundColor: a.color + '25', borderColor: a.color }]} onPress={() => setAccId(a.id)}>
                  <Text style={{ fontSize: 18, marginLeft: 6 }}>{a.icon}</Text>
                  <Text style={[styles.accOptText, accId === a.id && { color: a.color }]}>{a.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {type === 'transfer' && (
          <View style={styles.sec}>
            <Text style={styles.secLabel}>به حساب</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row' }}>
                {accs.filter((a) => a.id !== accId).map((a) => (
                  <TouchableOpacity key={a.id} style={[styles.accOpt, toAccId === a.id && { backgroundColor: a.color + '25', borderColor: a.color }]} onPress={() => setToAccId(a.id)}>
                    <Text style={{ fontSize: 18, marginLeft: 6 }}>{a.icon}</Text>
                    <Text style={[styles.accOptText, toAccId === a.id && { color: a.color }]}>{a.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {type !== 'transfer' && (
          <View style={styles.sec}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.secLabel}>دسته‌بندی</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Categories')}><Text style={{ color: COLORS.primary, fontSize: 13 }}>+ جدید</Text></TouchableOpacity>
            </View>
            <View style={styles.catGrid}>
              {cats.map((c) => (
                <TouchableOpacity key={c.id} style={[styles.catBadge, catId === c.id && { backgroundColor: c.color + '30', borderColor: c.color }]} onPress={() => setCatId(c.id)}>
                  <Text style={{ fontSize: 16, marginLeft: 4 }}>{c.icon}</Text>
                  <Text style={[styles.catText, catId === c.id && { color: c.color }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.sec}>
          <Text style={styles.secLabel}>توضیحات</Text>
          <TextInput style={styles.input} placeholder="مثلاً: ناهار رستوران..." placeholderTextColor={COLORS.textMuted} value={desc} onChangeText={setDesc} textAlign="right" multiline />
        </View>

        <View style={styles.sec}>
          <Text style={styles.secLabel}>تاریخ: {formatJalaliDate(date)}</Text>
          <TextInput style={[styles.input, { textAlign: 'center' }]} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textMuted} value={date} onChangeText={setDate} />
        </View>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: accent }]} onPress={save}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.saveText}>{edit ? 'ذخیره تغییرات' : 'ثبت تراکنش'}</Text>
        </TouchableOpacity>
        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 12 },
  closeBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 19, fontWeight: 'bold', color: COLORS.text },
  typeRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 20 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginHorizontal: 3, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border },
  typeText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginRight: 4 },
  amtSec: { alignItems: 'center', paddingHorizontal: 40, marginBottom: 24 },
  amtLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 },
  amtInput: { fontSize: 38, fontWeight: 'bold', width: '100%', paddingVertical: 10, borderBottomWidth: 3, textAlign: 'center' },
  sec: { paddingHorizontal: 20, marginBottom: 20 },
  secLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 10, textAlign: 'right' },
  accOpt: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, marginHorizontal: 3, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border },
  accOptText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  catBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1.5, borderColor: COLORS.border, margin: 3, backgroundColor: COLORS.surface },
  catText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  input: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, paddingVertical: 16, borderRadius: 16, elevation: 4 },
  saveText: { fontSize: 17, fontWeight: 'bold', color: '#fff', marginRight: 8 },
});