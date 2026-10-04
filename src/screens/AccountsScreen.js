import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import { formatCurrency, toEnglishDigits } from '../utils/formatters';
import { getAccounts, addAccount, updateAccount, deleteAccount, getAccountBalance, getTransactions } from '../database/Database';
import TransactionCard from '../components/TransactionCard';
import EmptyState from '../components/EmptyState';

const ICONS = ['🏦', '👛', '💳', '🏧', '💰', '🪙', '📱', '🏠'];
const CLR = ['#e94560', '#00b894', '#6c5ce7', '#fdcb6e', '#00cec9', '#e17055', '#a29bfe', '#55efc4'];

export default function AccountsScreen() {
  const [accs, setAccs] = useState([]);
  const [bals, setBals] = useState({});
  const [modal, setModal] = useState(false);
  const [editAcc, setEditAcc] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailTx, setDetailTx] = useState([]);
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [card, setCard] = useState('');
  const [initBal, setInitBal] = useState('');
  const [icon, setIcon] = useState('🏦');
  const [color, setColor] = useState('#e94560');

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    const a = await getAccounts();
    setAccs(a);
    const b = {};
    for (const x of a) b[x.id] = await getAccountBalance(x.id);
    setBals(b);
  }

  async function showDetail(acc) {
    setDetail(acc);
    setDetailTx(await getTransactions({ account_id: acc.id, limit: 50 }));
  }

  function openAdd() { setEditAcc(null); setName(''); setBank(''); setCard(''); setInitBal(''); setIcon('🏦'); setColor('#e94560'); setModal(true); }
  function openEdit(a) { setEditAcc(a); setName(a.name); setBank(a.bank_name || ''); setCard(a.card_number || ''); setInitBal(a.initial_balance?.toString() || '0'); setIcon(a.icon || '🏦'); setColor(a.color || '#e94560'); setModal(true); }

  async function save() {
    if (!name.trim()) return Alert.alert('خطا', 'نام حساب لازمه');
    const d = { name: name.trim(), bank_name: bank.trim(), card_number: card.trim(), initial_balance: parseFloat(toEnglishDigits(initBal)) || 0, icon, color };
    if (editAcc) await updateAccount(editAcc.id, d); else await addAccount(d);
    setModal(false); load();
  }

  function del(a) {
    Alert.alert('حذف', 'حذف "' + a.name + '"؟', [
      { text: 'انصراف', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => { await deleteAccount(a.id); if (detail?.id === a.id) setDetail(null); load(); } }
    ]);
  }

  function renderModal() {
    return (
      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editAcc ? 'ویرایش حساب' : 'حساب جدید'}</Text>
            <TextInput style={styles.input} placeholder="نام حساب *" placeholderTextColor={COLORS.textMuted} value={name} onChangeText={setName} textAlign="right" />
            <TextInput style={styles.input} placeholder="نام بانک" placeholderTextColor={COLORS.textMuted} value={bank} onChangeText={setBank} textAlign="right" />
            <TextInput style={styles.input} placeholder="شماره کارت" placeholderTextColor={COLORS.textMuted} value={card} onChangeText={setCard} keyboardType="numeric" textAlign="center" />
            <TextInput style={styles.input} placeholder="موجودی اولیه" placeholderTextColor={COLORS.textMuted} value={initBal} onChangeText={setInitBal} keyboardType="numeric" textAlign="center" />
            <Text style={styles.lbl}>آیکون</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
              {ICONS.map((i) => <TouchableOpacity key={i} style={[styles.iconOpt, icon === i && styles.iconSel]} onPress={() => setIcon(i)}><Text style={{ fontSize: 22 }}>{i}</Text></TouchableOpacity>)}
            </View>
            <Text style={styles.lbl}>رنگ</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 }}>
              {CLR.map((c) => <TouchableOpacity key={c} style={[styles.clrOpt, { backgroundColor: c }, color === c && styles.clrSel]} onPress={() => setColor(c)} />)}
            </View>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}><Text style={styles.cancelText}>انصراف</Text></TouchableOpacity>
              <TouchableOpacity style={styles.okBtn} onPress={save}><Text style={styles.okText}>ذخیره</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (detail) {
    return (
      <View style={styles.bg}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setDetail(null)} style={styles.backBtn}><Ionicons name="arrow-forward" size={24} color={COLORS.text} /></TouchableOpacity>
          <Text style={styles.title}>{detail.name}</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => openEdit(detail)} style={{ padding: 8 }}><Ionicons name="create-outline" size={20} color={COLORS.primary} /></TouchableOpacity>
            <TouchableOpacity onPress={() => del(detail)} style={{ padding: 8 }}><Ionicons name="trash-outline" size={20} color={COLORS.expense} /></TouchableOpacity>
          </View>
        </View>
        <View style={styles.balCard}>
          <Text style={styles.balLabel}>موجودی</Text>
          <Text style={[styles.balAmt, { color: (bals[detail.id] || 0) >= 0 ? COLORS.income : COLORS.expense }]}>{formatCurrency(bals[detail.id] || 0)}</Text>
        </View>
        <Text style={styles.detTitle}>تراکنش‌ها</Text>
        <ScrollView>
          {detailTx.length === 0 ? <EmptyState icon="📭" title="تراکنشی نیست" /> : detailTx.map((t) => <TransactionCard key={t.id} transaction={t} />)}
          <View style={{ height: 100 }} />
        </ScrollView>
        {renderModal()}
      </View>
    );
  }

  return (
    <View style={styles.bg}>
      <View style={styles.header}>
        <Text style={styles.title}>حساب‌ها</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {accs.length === 0 ? <EmptyState icon="🏦" title="حسابی نداری" subtitle="از + حساب بساز" /> :
          accs.map((a) => (
            <TouchableOpacity key={a.id} style={[styles.accItem, { borderRightColor: a.color, borderRightWidth: 4 }]} onPress={() => showDetail(a)} onLongPress={() => del(a)}>
              <View style={[styles.accIconBox, { backgroundColor: a.color + '25' }]}><Text style={{ fontSize: 26 }}>{a.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.accName}>{a.name}</Text>
                <Text style={styles.accBank}>{a.bank_name}</Text>
                {a.card_number ? <Text style={styles.accCard}>•••• {a.card_number.slice(-4)}</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: COLORS.textMuted }}>موجودی</Text>
                <Text style={[{ fontSize: 15, fontWeight: 'bold' }, { color: (bals[a.id] || 0) >= 0 ? COLORS.income : COLORS.expense }]}>{formatCurrency(bals[a.id] || 0)}</Text>
              </View>
            </TouchableOpacity>
          ))
        }
        <View style={{ height: 100 }} />
      </ScrollView>
      {renderModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 14 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  accItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 18, padding: 14, marginHorizontal: 16, marginVertical: 5 },
  accIconBox: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  accName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, textAlign: 'right' },
  accBank: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'right', marginTop: 2 },
  accCard: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right', marginTop: 2 },
  balCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 22, marginHorizontal: 16, marginBottom: 14, alignItems: 'center' },
  balLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 },
  balAmt: { fontSize: 30, fontWeight: 'bold' },
  detTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.text, paddingHorizontal: 20, marginBottom: 10, textAlign: 'right' },
  modalBg: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: 16 },
  input: { backgroundColor: COLORS.surfaceLight, borderRadius: 14, padding: 12, fontSize: 15, color: COLORS.text, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  lbl: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, textAlign: 'right' },
  iconOpt: { padding: 8, borderRadius: 10, margin: 3, backgroundColor: COLORS.surfaceLight },
  iconSel: { backgroundColor: COLORS.primary + '30', borderWidth: 2, borderColor: COLORS.primary },
  clrOpt: { width: 32, height: 32, borderRadius: 16, margin: 4 },
  clrSel: { borderWidth: 3, borderColor: '#fff' },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.surfaceLight, marginLeft: 6, alignItems: 'center' },
  cancelText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  okBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.primary, marginRight: 6, alignItems: 'center' },
  okText: { fontSize: 15, color: '#fff', fontWeight: 'bold' },
});